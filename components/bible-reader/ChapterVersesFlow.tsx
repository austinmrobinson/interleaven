import { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WordToken } from './WordToken';
import type { BibleVerse, Highlight } from '@/lib/bible/types';
import { bibleSerifFont } from '@/lib/typography';
import { bookTheme } from '@/lib/theme/book-theme';
import { BIBLE_READER_TEXT_HORIZONTAL_INSET } from '@/lib/layout/bible-reader-chrome';
import {
  computeAnnotationRunSpans,
  computeSelectionRunSpans,
} from '@/lib/bible/word-run-spans';

interface ChapterVersesFlowProps {
  verses: BibleVerse[];
  onParagraphLayout: (contentY: number) => void;
  onVerseNumberLayout: (verse: number, localY: number) => void;
  isWordSelected: (verse: number, wordIndex: number) => boolean;
  getHighlightForWord: (verse: number, wordIndex: number) => Highlight | undefined;
  onWordPress: (verse: number, wordIndex: number) => void;
  onWordLongPress: (verse: number, wordIndex: number) => void;
}

export const ChapterVersesFlow = memo(function ChapterVersesFlow({
  verses,
  onParagraphLayout,
  onVerseNumberLayout,
  isWordSelected,
  getHighlightForWord,
  onWordPress,
  onWordLongPress,
}: ChapterVersesFlowProps) {
  const handleParagraphLayout = useCallback(
    (e: { nativeEvent: { layout: { y: number } } }) => {
      onParagraphLayout(e.nativeEvent.layout.y);
    },
    [onParagraphLayout],
  );

  const handleVerseNumberLayout = useCallback(
    (verse: number, e: { nativeEvent: { layout: { y: number } } }) => {
      onVerseNumberLayout(verse, e.nativeEvent.layout.y);
    },
    [onVerseNumberLayout],
  );

  const annotationSpans = useMemo(
    () =>
      computeAnnotationRunSpans(verses, (v, w) => getHighlightForWord(v, w)?.style),
    [verses, getHighlightForWord],
  );

  const selectionSpans = useMemo(
    () => computeSelectionRunSpans(verses, isWordSelected),
    [verses, isWordSelected],
  );

  return (
    <View style={styles.paragraph} onLayout={handleParagraphLayout}>
      {verses.flatMap(verse => [
        <Text
          key={`vnum-${verse.verse}`}
          style={styles.verseNumber}
          onLayout={e => handleVerseNumberLayout(verse.verse, e)}
        >
          {verse.verse}
        </Text>,
        ...verse.words.map(word => {
          const key = `${verse.verse}-${word.index}`;
          const ann = annotationSpans.get(key) ?? 'none';
          const sel = selectionSpans.get(key) ?? 'none';
          return (
            <WordToken
              key={key}
              text={word.text}
              isSelected={isWordSelected(verse.verse, word.index)}
              selectionSpan={sel}
              highlight={getHighlightForWord(verse.verse, word.index)?.style}
              annotationSpan={ann}
              onPress={() => onWordPress(verse.verse, word.index)}
              onLongPress={() => onWordLongPress(verse.verse, word.index)}
            />
          );
        }),
      ])}
    </View>
  );
});

const styles = StyleSheet.create({
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    paddingHorizontal: BIBLE_READER_TEXT_HORIZONTAL_INSET,
    paddingBottom: 4,
  },
  verseNumber: {
    fontSize: 11,
    lineHeight: 28,
    fontWeight: '600',
    color: bookTheme.inkSecondary,
    fontFamily: bibleSerifFont,
    marginRight: 3,
    transform: [{ translateY: -4 }],
  },
});
