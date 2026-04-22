import { memo } from 'react';
import { Text, Pressable, View, StyleSheet } from 'react-native';
import type { HighlightStyle } from '@/lib/bible/types';
import type { RunSpan } from '@/lib/bible/word-run-spans';
import { bibleSerifFont } from '@/lib/typography';
import { bookTheme } from '@/lib/theme/book-theme';

const SEL_R = 5;
const ANN_R = 5;
const UNDERLINE_R = 3;
const CIRCLE_R = 9;

interface WordTokenProps {
  text: string;
  isSelected: boolean;
  selectionSpan: RunSpan;
  highlight?: HighlightStyle;
  annotationSpan: RunSpan;
  onPress: () => void;
  onLongPress: () => void;
}

function spanRadii(span: RunSpan, radius: number) {
  switch (span) {
    case 'single':
      return { borderRadius: radius };
    case 'first':
      return {
        borderTopLeftRadius: radius,
        borderBottomLeftRadius: radius,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      };
    case 'last':
      return {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: radius,
        borderBottomRightRadius: radius,
      };
    case 'middle':
      return { borderRadius: 0 };
    default:
      return {};
  }
}

function underlineCapRadii(span: RunSpan) {
  switch (span) {
    case 'single':
      return { borderBottomLeftRadius: UNDERLINE_R, borderBottomRightRadius: UNDERLINE_R };
    case 'first':
      return { borderBottomLeftRadius: UNDERLINE_R };
    case 'last':
      return { borderBottomRightRadius: UNDERLINE_R };
    default:
      return {};
  }
}

export const WordToken = memo(function WordToken({
  text,
  isSelected,
  selectionSpan,
  highlight,
  annotationSpan,
  onPress,
  onLongPress,
}: WordTokenProps) {
  const hasHighlightBg = highlight?.type === 'highlight';
  const hasUnderline = highlight?.type === 'underline';
  const hasCircle = highlight?.type === 'circle';

  const boxStyle = [
    styles.box,
    hasHighlightBg && {
      backgroundColor: highlight!.color + '40',
      ...spanRadii(annotationSpan, ANN_R),
    },
    hasUnderline && {
      borderBottomWidth: 2.5,
      borderBottomColor: highlight!.color,
      ...underlineCapRadii(annotationSpan),
    },
    hasCircle && {
      borderWidth: 1.5,
      borderColor: highlight!.color,
      paddingHorizontal: 2,
      paddingVertical: 1,
      ...spanRadii(annotationSpan, CIRCLE_R),
    },
    isSelected && {
      backgroundColor: hasHighlightBg
        ? bookTheme.selectionWordTintOnHighlight
        : bookTheme.selectionWordTint,
      ...spanRadii(selectionSpan, SEL_R),
    },
  ];

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} hitSlop={2}>
      <View style={boxStyle}>
        <Text style={styles.word}>
          {text}{' '}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  box: {
    alignSelf: 'flex-start',
  },
  word: {
    fontSize: 17,
    lineHeight: 28,
    color: bookTheme.ink,
    fontFamily: bibleSerifFont,
  },
});
