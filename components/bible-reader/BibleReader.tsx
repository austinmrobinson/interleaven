import {
  useSplitPaneLayoutGeneration,
  useTopPaneAtSmallestSnap,
} from '@/components/split-pane/SplitPaneLayoutContext';
import { useClampScrollWhenSplitChanges } from '@/lib/hooks/useClampScrollWhenSplitChanges';
import { useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, Alert, Pressable, type NativeScrollEvent } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useBible } from '@/contexts/BibleContext';
import { useSelection } from '@/contexts/SelectionContext';
import { useNoteInsert } from '@/contexts/NoteInsertContext';
import { useHighlights } from '@/lib/hooks/useHighlights';
import { getChapterTitle } from '@/lib/bible/titles';
import { bibleSerifFont, bibleSerifFontBold } from '@/lib/typography';
import { bookTheme } from '@/lib/theme/book-theme';
import { ChapterHeader } from './ChapterHeader';
import { ChapterNav } from './ChapterNav';
import { ChapterVersesFlow } from './ChapterVersesFlow';
import { BookPicker } from './BookPicker';
import { SelectionToolbar } from './SelectionToolbar';
import { ReaderEdgeFade } from './ReaderEdgeFade';
import {
  BIBLE_READER_BOTTOM_CHROME_HEIGHT,
  BIBLE_READER_BOTTOM_FADE_HEIGHT,
  BIBLE_READER_SCROLL_TOP_INSET,
  BIBLE_READER_TEXT_HORIZONTAL_INSET,
  BIBLE_READER_TOP_FADE_HEIGHT,
} from '@/lib/layout/bible-reader-chrome';
import { FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP } from '@/components/ui/FloatingToolbarShell';
import {
  extendSelectionEndOneVerseDown,
  moveSelectionEndByWords,
  shrinkSelectionEndOneVerseUp,
} from '@/lib/bible/selection-gestures';
import type { HighlightStyle } from '@/lib/bible/types';

/** Space above bottom safe area for selection toolbar + optional wrap (see `SelectionToolbar` + `bottomInset`). */
const SELECTION_SIDE_STRIP_BOTTOM_INSET =
  10 + FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP + 104;

export function BibleReader() {
  const {
    currentBook,
    currentChapter,
    chapterData,
    goToChapter,
    goNextChapter,
    goPrevChapter,
    hasNext,
    hasPrev,
  } = useBible();

  const {
    selection,
    isSelecting,
    startSelection,
    extendSelection,
    clearSelection,
    isWordSelected,
  } = useSelection();
  const { requestInsert } = useNoteInsert();
  const { highlights, add: addHighlight, getHighlightForWord } = useHighlights(currentBook, currentChapter);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [visibleVerse, setVisibleVerse] = useState(1);
  const scrollRef = useRef<ScrollView>(null);
  const verseOffsets = useRef<Record<number, number>>({});
  const paragraphYRef = useRef(0);
  const verseLocalYRef = useRef<Record<number, number>>({});
  const splitGeneration = useSplitPaneLayoutGeneration();
  const topAtSmallestSnap = useTopPaneAtSmallestSnap();
  const { handleScroll: clampSplitScroll, handleContentSizeChange, handleLayout } =
    useClampScrollWhenSplitChanges(scrollRef, splitGeneration);

  const handleParagraphLayout = useCallback((contentY: number) => {
    paragraphYRef.current = contentY;
    const p = contentY;
    for (const [v, localY] of Object.entries(verseLocalYRef.current)) {
      verseOffsets.current[Number(v)] = p + localY;
    }
  }, []);

  const handleVerseNumberLayout = useCallback((verse: number, localY: number) => {
    verseLocalYRef.current[verse] = localY;
    verseOffsets.current[verse] = paragraphYRef.current + localY;
  }, []);

  const handleScroll = useCallback((e: NativeScrollEvent) => {
    const offsetY = e.contentOffset.y;
    const offsets = verseOffsets.current;
    const verses = Object.keys(offsets).map(Number).sort((a, b) => a - b);
    let current = 1;
    for (const v of verses) {
      if (offsets[v] <= offsetY + 20) current = v;
      else break;
    }
    setVisibleVerse(current);
  }, []);

  const handleWordPress = useCallback((verse: number, wordIndex: number) => {
    if (isSelecting) {
      extendSelection(verse, wordIndex);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startSelection(currentBook, currentChapter, verse, wordIndex);
    }
  }, [isSelecting, currentBook, currentChapter, startSelection, extendSelection]);

  const handleWordLongPress = useCallback((verse: number, wordIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSelection(currentBook, currentChapter, verse, wordIndex);
  }, [currentBook, currentChapter, startSelection]);

  const handleHighlight = useCallback(async (style: HighlightStyle) => {
    if (!selection) return;

    const start = selection.start;
    const end = selection.end;
    const normalizedStart = start.verse < end.verse ||
      (start.verse === end.verse && start.wordIndex <= end.wordIndex)
      ? start : end;
    const normalizedEnd = normalizedStart === start ? end : start;

    if (normalizedStart.verse === normalizedEnd.verse) {
      await addHighlight(normalizedStart.verse, normalizedStart.wordIndex, normalizedEnd.wordIndex, style);
    } else {
      for (let v = normalizedStart.verse; v <= normalizedEnd.verse; v++) {
        const verseData = chapterData?.verses.find(vd => vd.verse === v);
        if (!verseData) continue;
        const sIdx = v === normalizedStart.verse ? normalizedStart.wordIndex : 0;
        const eIdx = v === normalizedEnd.verse ? normalizedEnd.wordIndex : verseData.words.length - 1;
        await addHighlight(v, sIdx, eIdx, style);
      }
    }

    clearSelection();
  }, [selection, addHighlight, clearSelection, chapterData]);

  const handleAddToNote = useCallback(() => {
    if (!selection || !chapterData) return;

    const start = selection.start;
    const end = selection.end;
    const normalizedStart = start.verse < end.verse ||
      (start.verse === end.verse && start.wordIndex <= end.wordIndex)
      ? start : end;
    const normalizedEnd = normalizedStart === start ? end : start;

    const selectedWords: string[] = [];
    for (let v = normalizedStart.verse; v <= normalizedEnd.verse; v++) {
      const verseData = chapterData.verses.find(vd => vd.verse === v);
      if (!verseData) continue;
      const sIdx = v === normalizedStart.verse ? normalizedStart.wordIndex : 0;
      const eIdx = v === normalizedEnd.verse ? normalizedEnd.wordIndex : verseData.words.length - 1;
      const words = verseData.words.filter(w => w.index >= sIdx && w.index <= eIdx);
      selectedWords.push(...words.map(w => w.text));
    }

    requestInsert({
      book: currentBook,
      chapter: currentChapter,
      verse: normalizedStart.verse,
      endVerse:
        normalizedEnd.verse !== normalizedStart.verse ? normalizedEnd.verse : undefined,
      text: selectedWords.join(' '),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearSelection();
  }, [selection, chapterData, currentBook, currentChapter, requestInsert, clearSelection]);

  const resetScroll = useCallback(() => {
    verseOffsets.current = {};
    verseLocalYRef.current = {};
    paragraphYRef.current = 0;
    setVisibleVerse(1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const handleChapterChange = useCallback((book: string, chapter: number) => {
    clearSelection();
    goToChapter(book, chapter);
    resetScroll();
  }, [goToChapter, clearSelection, resetScroll]);

  const handlePrev = useCallback(() => {
    clearSelection();
    goPrevChapter();
    resetScroll();
  }, [goPrevChapter, clearSelection, resetScroll]);

  const handleNext = useCallback(() => {
    clearSelection();
    goNextChapter();
    resetScroll();
  }, [goNextChapter, clearSelection, resetScroll]);

  const onSwipeTowardNext = useCallback(() => {
    if (!hasNext) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleNext();
  }, [hasNext, handleNext]);

  const onSwipeTowardPrev = useCallback(() => {
    if (!hasPrev) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handlePrev();
  }, [hasPrev, handlePrev]);

  const handleSelectionSwipeHorizontal = useCallback(
    (rightish: boolean) => {
      if (!selection || !chapterData) return;
      const delta = rightish ? -1 : 1;
      const next = moveSelectionEndByWords(
        chapterData.verses,
        selection.start,
        selection.end,
        delta,
      );
      if (next) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        extendSelection(next.verse, next.wordIndex);
      }
    },
    [selection, chapterData, extendSelection],
  );

  const handleSelectionSwipeVertical = useCallback(
    (downish: boolean) => {
      if (!selection || !chapterData) return;
      const next = downish
        ? extendSelectionEndOneVerseDown(chapterData.verses, selection.start, selection.end)
        : shrinkSelectionEndOneVerseUp(chapterData.verses, selection.start, selection.end);
      if (next) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        extendSelection(next.verse, next.wordIndex);
      }
    },
    [selection, chapterData, extendSelection],
  );

  const chapterSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!isSelecting)
        .activeOffsetX([-26, 26])
        .failOffsetY([-22, 22])
        .onEnd((e) => {
          'worklet';
          const { translationX, velocityX } = e;
          const distancePass = Math.abs(translationX) >= 56;
          const velocityPass = Math.abs(velocityX) >= 640;
          if (!distancePass && !velocityPass) return;

          const towardNext = velocityPass ? velocityX < 0 : translationX < 0;

          if (towardNext) {
            runOnJS(onSwipeTowardNext)();
          } else {
            runOnJS(onSwipeTowardPrev)();
          }
        }),
    [isSelecting, onSwipeTowardNext, onSwipeTowardPrev],
  );

  const selectionSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isSelecting)
        .onEnd((e) => {
          'worklet';
          const { translationX, translationY, velocityX, velocityY } = e;
          const t = 32;
          const v = 420;
          const moved =
            Math.abs(translationX) > t ||
            Math.abs(translationY) > t ||
            Math.abs(velocityX) > v ||
            Math.abs(velocityY) > v;
          if (!moved) return;

          const horiz = Math.abs(translationX) >= Math.abs(translationY);
          if (horiz) {
            const rightish =
              translationX > t ||
              (Math.abs(translationX) <= t && Math.abs(velocityX) > v && velocityX > 0);
            runOnJS(handleSelectionSwipeHorizontal)(rightish);
          } else {
            const downish =
              translationY > t ||
              (Math.abs(translationY) <= t && Math.abs(velocityY) > v && velocityY > 0);
            runOnJS(handleSelectionSwipeVertical)(downish);
          }
        }),
    [isSelecting, handleSelectionSwipeHorizontal, handleSelectionSwipeVertical],
  );

  const rootReaderGesture = useMemo(
    () => (isSelecting ? selectionSwipeGesture : chapterSwipeGesture),
    [isSelecting, selectionSwipeGesture, chapterSwipeGesture],
  );

  if (!chapterData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureDetector gesture={rootReaderGesture}>
      <View style={styles.container} collapsable={false}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isSelecting && styles.scrollContentSelecting,
          ]}
          scrollEnabled={!isSelecting}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            clampSplitScroll(e);
            handleScroll(e.nativeEvent);
          }}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleLayout}
          scrollEventThrottle={60}
        >
          {(() => {
            const title = getChapterTitle(currentBook, currentChapter);
            return title ? <Text style={styles.chapterTitle}>{title}</Text> : null;
          })()}
          <ChapterVersesFlow
            verses={chapterData.verses}
            onParagraphLayout={handleParagraphLayout}
            onVerseNumberLayout={handleVerseNumberLayout}
            isWordSelected={isWordSelected}
            getHighlightForWord={getHighlightForWord}
            onWordPress={handleWordPress}
            onWordLongPress={handleWordLongPress}
          />
        </ScrollView>

        <ReaderEdgeFade edge="top" height={BIBLE_READER_TOP_FADE_HEIGHT} style={styles.topFade} />
        {!topAtSmallestSnap && (
          <ReaderEdgeFade edge="bottom" height={BIBLE_READER_BOTTOM_FADE_HEIGHT} style={styles.bottomFade} />
        )}

        {isSelecting && (
          <View style={styles.selectionSideTapLayer} pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss selection"
              style={[styles.selectionSideStrip, styles.selectionSideStripLeft]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                clearSelection();
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss selection"
              style={[styles.selectionSideStrip, styles.selectionSideStripRight]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                clearSelection();
              }}
            />
          </View>
        )}

        {!isSelecting && !topAtSmallestSnap && (
          <View style={styles.navOverlay} pointerEvents="box-none">
            <ChapterNav
              hasPrev={hasPrev}
              hasNext={hasNext}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </View>
        )}

        <View style={styles.headerOverlay} pointerEvents="box-none">
          <ChapterHeader
            book={currentBook}
            chapter={currentChapter}
            verse={visibleVerse}
            onPress={() => setPickerVisible(true)}
            onSearchPress={() => Alert.alert('Search', 'Scripture search is coming soon.')}
          />
        </View>

        <SelectionToolbar
          visible={isSelecting}
          bottomInset={isSelecting ? 10 : BIBLE_READER_BOTTOM_CHROME_HEIGHT}
          onHighlight={handleHighlight}
          onClear={clearSelection}
          onAddToNote={handleAddToNote}
        />

        <BookPicker
          visible={pickerVisible}
          currentBook={currentBook}
          currentChapter={currentChapter}
          onSelect={handleChapterChange}
          onClose={() => setPickerVisible(false)}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bookTheme.pageBackground,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: 4,
  },
  topFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 4,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
  selectionSideTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  selectionSideStrip: {
    position: 'absolute',
    top: BIBLE_READER_SCROLL_TOP_INSET,
    bottom: SELECTION_SIDE_STRIP_BOTTOM_INSET,
    width: BIBLE_READER_TEXT_HORIZONTAL_INSET,
  },
  selectionSideStripLeft: {
    left: 0,
  },
  selectionSideStripRight: {
    right: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BIBLE_READER_BOTTOM_CHROME_HEIGHT,
    paddingTop: BIBLE_READER_SCROLL_TOP_INSET,
  },
  scrollContentSelecting: {
    paddingBottom: 28,
  },
  chapterTitle: {
    fontSize: 22,
    color: bookTheme.ink,
    fontFamily: bibleSerifFontBold,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: bookTheme.inkSecondary,
  },
});
