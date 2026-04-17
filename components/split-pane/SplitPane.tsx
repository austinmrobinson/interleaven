import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  runOnUI,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { bookTheme } from '@/lib/theme/book-theme';
import { SplitPaneLayoutGenerationContext } from './SplitPaneLayoutContext';

const HANDLE_HEIGHT = 20;
const MIN_PANE_HEIGHT = 120;

/**
 * When the keyboard is open, bottom pane height is at least keyboard height + this reserve
 * (title bar, floating bar, format toolbar clearance, editor breathing room).
 */
const KEYBOARD_OPEN_NOTES_RESERVE = 220;

const SPRING = { damping: 22, stiffness: 220 };

const KEYBOARD_SPLIT_MS = Platform.OS === 'ios' ? 250 : 220;
const KEYBOARD_SPLIT_EASING = Easing.out(Easing.cubic);

function minNotesPaneHeight(totalH: number, keyboardH: number): number {
  'worklet';
  const maxBottom = totalH - HANDLE_HEIGHT - MIN_PANE_HEIGHT;
  if (keyboardH <= 0) return MIN_PANE_HEIGHT;
  const needed = keyboardH + KEYBOARD_OPEN_NOTES_RESERVE;
  return Math.min(
    maxBottom,
    Math.max(MIN_PANE_HEIGHT, needed),
  );
}

interface SplitPaneProps {
  topPane: ReactNode;
  bottomPane: ReactNode;
}

export function SplitPane({ topPane, bottomPane }: SplitPaneProps) {
  const { height: windowHeight } = useWindowDimensions();
  const didInitialLayout = useRef(false);
  const [layoutGeneration, setLayoutGeneration] = useState(0);
  const lastThrottledBumpRef = useRef(0);

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
  const splitPosition = useSharedValue(
    Math.min(windowHeight * 0.55, windowHeight - MIN_PANE_HEIGHT - HANDLE_HEIGHT)
  );
  const startPosition = useSharedValue(0);
  const savedSplitForKeyboard = useSharedValue(-1);
  const keyboardHeightSV = useSharedValue(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, (e) => {
      const keyboardH = e.endCoordinates?.height ?? 0;
      keyboardHeightSV.value = keyboardH;
      runOnUI((kbHeight: number, durationMs: number) => {
        'worklet';
        const maxBottom =
          totalHeight.value - HANDLE_HEIGHT - MIN_PANE_HEIGHT;
        const neededBottom = Math.min(
          maxBottom,
          Math.max(
            MIN_PANE_HEIGHT,
            kbHeight + KEYBOARD_OPEN_NOTES_RESERVE,
          ),
        );
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

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startPosition.value = splitPosition.value;
    })
    .onUpdate((e) => {
      const minBottom = minNotesPaneHeight(
        totalHeight.value,
        keyboardHeightSV.value,
      );
      const maxPos = totalHeight.value - HANDLE_HEIGHT - minBottom;
      const newPosition = startPosition.value + e.translationY;
      const clamped = Math.min(Math.max(newPosition, MIN_PANE_HEIGHT), maxPos);
      splitPosition.value = clamped;
      runOnJS(throttledBumpLayoutGeneration)();
    })
    .onEnd(() => {
      const minBottom = minNotesPaneHeight(
        totalHeight.value,
        keyboardHeightSV.value,
      );
      const maxPos = totalHeight.value - HANDLE_HEIGHT - minBottom;
      if (splitPosition.value <= MIN_PANE_HEIGHT + 10) {
        splitPosition.value = withSpring(MIN_PANE_HEIGHT);
        runOnJS(triggerHaptic)();
      } else if (splitPosition.value >= maxPos - 10) {
        splitPosition.value = withSpring(maxPos);
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
      <View
        style={styles.container}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h <= 0) return;
          totalHeight.value = h;
          const maxPos = h - MIN_PANE_HEIGHT - HANDLE_HEIGHT;
          if (!didInitialLayout.current) {
            didInitialLayout.current = true;
            splitPosition.value = Math.min(h * 0.55, maxPos);
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
