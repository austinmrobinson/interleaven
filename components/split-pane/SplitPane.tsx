import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedReaction,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  runOnUI,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { bookTheme } from '@/lib/theme/book-theme';
import {
  EditorBlurRefContext,
  SplitPaneLayoutGenerationContext,
  TopPaneAtSmallestSnapContext,
  type EditorBlurHandler,
} from './SplitPaneLayoutContext';

const HANDLE_HEIGHT = 20;
const MIN_PANE_HEIGHT = 120;

/**
 * When the keyboard is open, bottom pane height is at least keyboard height + this reserve
 * (title bar, floating bar, format toolbar clearance, editor breathing room).
 */
const KEYBOARD_OPEN_NOTES_RESERVE = 220;

/**
 * Snap points as top-pane (Bible) height fractions of total height. The set is
 * symmetric so both panes have the same available sizes (15% / 33% / 50%):
 * - top 0.15 → notes at 85%  (max notes)
 * - top 0.33 → notes at 67%
 * - top 0.50 → even split
 * - top 0.67 → notes at 33%
 * - top 0.85 → notes at 15%  (max bible)
 * The default on first layout is the snap point closest to 0.5.
 */
export const SPLIT_SNAP_POINTS: readonly number[] = [0.15, 0.33, 0.5, 0.67, 0.85];

/**
 * When the notes editor is focused (keyboard about to open), ensure the notes
 * pane is at least this fraction of the screen. Also the threshold at which
 * dragging the handle downward will dismiss the keyboard.
 */
const KEYBOARD_OPEN_NOTES_MIN_FRACTION = 0.5;

/**
 * Fraction at or below which the top pane is considered "at smallest snap" for
 * UI chrome purposes — halfway between the smallest snap and the next one.
 * Falls back to the smallest snap if there's only one.
 */
const AT_SMALLEST_SNAP_FRACTION: number =
  SPLIT_SNAP_POINTS.length >= 2
    ? (SPLIT_SNAP_POINTS[0] + SPLIT_SNAP_POINTS[1]) / 2
    : SPLIT_SNAP_POINTS[0];

/** Flick-velocity threshold (px/s) above which we snap in the direction of travel. */
const SNAP_VELOCITY_THRESHOLD = 420;

const SNAP_MS = 220;
const SNAP_EASING = Easing.out(Easing.cubic);

const KEYBOARD_SPLIT_MS = Platform.OS === 'ios' ? 250 : 220;
const KEYBOARD_SPLIT_EASING = Easing.out(Easing.cubic);

function minNotesPaneHeight(totalH: number, keyboardH: number): number {
  'worklet';
  const maxBottom = totalH - HANDLE_HEIGHT - MIN_PANE_HEIGHT;
  if (keyboardH <= 0) return MIN_PANE_HEIGHT;
  const keyboardNeed = keyboardH + KEYBOARD_OPEN_NOTES_RESERVE;
  const halfScreen = totalH * KEYBOARD_OPEN_NOTES_MIN_FRACTION;
  const needed = Math.max(keyboardNeed, halfScreen);
  return Math.min(
    maxBottom,
    Math.max(MIN_PANE_HEIGHT, needed),
  );
}

/**
 * Resolve snap fractions to allowed pixel positions for the top pane,
 * clamped to [MIN_PANE_HEIGHT, maxPos] and de-duplicated.
 */
function resolveSnapPositions(totalH: number, keyboardH: number): number[] {
  'worklet';
  const minBottom = minNotesPaneHeight(totalH, keyboardH);
  const maxPos = totalH - HANDLE_HEIGHT - minBottom;
  if (maxPos < MIN_PANE_HEIGHT) return [MIN_PANE_HEIGHT];
  const out: number[] = [];
  for (const frac of SPLIT_SNAP_POINTS) {
    const target = Math.round(totalH * frac);
    const clamped = Math.min(Math.max(target, MIN_PANE_HEIGHT), maxPos);
    if (!out.some((v) => Math.abs(v - clamped) < 1)) out.push(clamped);
  }
  out.sort((a, b) => a - b);
  return out;
}

/** Pick the snap target given current position + velocity. Velocity biases direction. */
function pickSnapTarget(
  current: number,
  velocity: number,
  snaps: number[],
): number {
  'worklet';
  if (snaps.length === 0) return current;
  if (snaps.length === 1) return snaps[0];

  if (Math.abs(velocity) >= SNAP_VELOCITY_THRESHOLD) {
    if (velocity > 0) {
      for (const s of snaps) if (s > current + 1) return s;
      return snaps[snaps.length - 1];
    } else {
      for (let i = snaps.length - 1; i >= 0; i--) {
        if (snaps[i] < current - 1) return snaps[i];
      }
      return snaps[0];
    }
  }

  let best = snaps[0];
  let bestDist = Math.abs(snaps[0] - current);
  for (let i = 1; i < snaps.length; i++) {
    const d = Math.abs(snaps[i] - current);
    if (d < bestDist) {
      best = snaps[i];
      bestDist = d;
    }
  }
  return best;
}

/** Initial snap: closest snap point to a 50/50 split. */
function pickInitialSnap(totalH: number): number {
  'worklet';
  const snaps = resolveSnapPositions(totalH, 0);
  return pickSnapTarget(totalH * 0.5, 0, snaps);
}

interface SplitPaneProps {
  topPane: ReactNode;
  bottomPane: ReactNode;
}

export function SplitPane({ topPane, bottomPane }: SplitPaneProps) {
  const { height: windowHeight } = useWindowDimensions();
  const didInitialLayout = useRef(false);
  const [layoutGeneration, setLayoutGeneration] = useState(0);
  const [topAtSmallest, setTopAtSmallest] = useState(false);
  const lastThrottledBumpRef = useRef(0);
  const editorBlurRef = useRef<EditorBlurHandler>(null);

  const bumpLayoutGeneration = useCallback(() => {
    setLayoutGeneration((n) => n + 1);
  }, []);

  const throttledBumpLayoutGeneration = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottledBumpRef.current < 72) return;
    lastThrottledBumpRef.current = now;
    bumpLayoutGeneration();
  }, [bumpLayoutGeneration]);

  const totalHeight = useSharedValue(windowHeight);
  const splitPosition = useSharedValue(pickInitialSnap(windowHeight));
  const startPosition = useSharedValue(0);
  const savedSplitForKeyboard = useSharedValue(-1);
  const keyboardHeightSV = useSharedValue(0);
  const didDismissKeyboardInGesture = useSharedValue(false);

  useAnimatedReaction(
    () => {
      const total = totalHeight.value;
      if (total <= 0) return false;
      return splitPosition.value / total <= AT_SMALLEST_SNAP_FRACTION;
    },
    (isAtSmallest, prev) => {
      if (isAtSmallest === prev) return;
      runOnJS(setTopAtSmallest)(isAtSmallest);
    },
    [],
  );

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, (e) => {
      const keyboardH = e.endCoordinates?.height ?? 0;
      keyboardHeightSV.value = keyboardH;
      runOnUI((kbHeight: number, durationMs: number) => {
        'worklet';
        const neededBottom = minNotesPaneHeight(totalHeight.value, kbHeight);
        const currentBottom =
          totalHeight.value - splitPosition.value - HANDLE_HEIGHT;
        if (currentBottom < neededBottom) {
          if (savedSplitForKeyboard.value < 0) {
            savedSplitForKeyboard.value = splitPosition.value;
          }
          const newSplit = totalHeight.value - HANDLE_HEIGHT - neededBottom;
          splitPosition.value = withTiming(
            Math.max(MIN_PANE_HEIGHT, newSplit),
            { duration: durationMs, easing: KEYBOARD_SPLIT_EASING },
          );
        }
      })(keyboardH, KEYBOARD_SPLIT_MS);
      setTimeout(bumpLayoutGeneration, KEYBOARD_SPLIT_MS + 48);
    });

    const hideSub = Keyboard.addListener(hideEvt, () => {
      keyboardHeightSV.value = 0;
      runOnUI((durationMs: number) => {
        'worklet';
        const saved = savedSplitForKeyboard.value;
        if (saved >= 0) {
          const maxPos = totalHeight.value - MIN_PANE_HEIGHT - HANDLE_HEIGHT;
          const restored = Math.min(Math.max(saved, MIN_PANE_HEIGHT), maxPos);
          splitPosition.value = withTiming(restored, {
            duration: durationMs,
            easing: KEYBOARD_SPLIT_EASING,
          });
          savedSplitForKeyboard.value = -1;
        }
      })(KEYBOARD_SPLIT_MS);
      setTimeout(bumpLayoutGeneration, KEYBOARD_SPLIT_MS + 48);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [bumpLayoutGeneration, savedSplitForKeyboard, splitPosition, totalHeight]);

  function triggerHaptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function dismissKeyboard() {
    editorBlurRef.current?.();
    Keyboard.dismiss();
  }

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startPosition.value = splitPosition.value;
      didDismissKeyboardInGesture.value = false;
      savedSplitForKeyboard.value = -1;
    })
    .onUpdate((e) => {
      const maxPos =
        totalHeight.value - HANDLE_HEIGHT - MIN_PANE_HEIGHT;
      const newPosition = startPosition.value + e.translationY;
      const clamped = Math.min(Math.max(newPosition, MIN_PANE_HEIGHT), maxPos);
      splitPosition.value = clamped;
      if (
        keyboardHeightSV.value > 0 &&
        !didDismissKeyboardInGesture.value &&
        clamped > totalHeight.value * KEYBOARD_OPEN_NOTES_MIN_FRACTION
      ) {
        didDismissKeyboardInGesture.value = true;
        runOnJS(dismissKeyboard)();
      }
      runOnJS(throttledBumpLayoutGeneration)();
    })
    .onEnd((e) => {
      const snaps = resolveSnapPositions(
        totalHeight.value,
        keyboardHeightSV.value,
      );
      const target = pickSnapTarget(splitPosition.value, e.velocityY, snaps);
      if (Math.abs(target - splitPosition.value) > 0.5) {
        splitPosition.value = withTiming(target, {
          duration: SNAP_MS,
          easing: SNAP_EASING,
        });
        runOnJS(triggerHaptic)();
      }
      runOnJS(bumpLayoutGeneration)();
    });

  const topPaneStyle = useAnimatedStyle(() => ({
    height: splitPosition.value,
  }));

  const bottomPaneStyle = useAnimatedStyle(() => ({
    height: totalHeight.value - splitPosition.value - HANDLE_HEIGHT,
  }));

  return (
    <SplitPaneLayoutGenerationContext.Provider value={layoutGeneration}>
      <TopPaneAtSmallestSnapContext.Provider value={topAtSmallest}>
      <EditorBlurRefContext.Provider value={editorBlurRef}>
      <View
        style={styles.container}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h <= 0) return;
          totalHeight.value = h;
          const maxPos = h - MIN_PANE_HEIGHT - HANDLE_HEIGHT;
          if (!didInitialLayout.current) {
            didInitialLayout.current = true;
            splitPosition.value = pickInitialSnap(h);
          } else if (splitPosition.value > maxPos) {
            splitPosition.value = maxPos;
          }
        }}
      >
        <Animated.View style={[styles.pane, styles.topPane, topPaneStyle]}>
          {topPane}
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={styles.handle}>
            <View style={styles.handleBar}>
              <View style={styles.pill} />
            </View>
          </Animated.View>
        </GestureDetector>

        <Animated.View style={[styles.pane, styles.bottomPane, bottomPaneStyle]}>
          {bottomPane}
        </Animated.View>
      </View>
      </EditorBlurRefContext.Provider>
      </TopPaneAtSmallestSnapContext.Provider>
    </SplitPaneLayoutGenerationContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bookTheme.shellBezel,
  },
  pane: {
    overflow: 'hidden',
  },
  topPane: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  bottomPane: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  handle: {
    height: HANDLE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: bookTheme.shellBezel,
  },
  handleBar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: bookTheme.shellHandlePill,
  },
});
