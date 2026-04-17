import type { ComponentRef, RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

/**
 * Keeps scroll offset valid when the split pane (or keyboard) changes the viewport height.
 */
export function useClampScrollWhenSplitChanges(
  scrollRef: RefObject<ComponentRef<typeof ScrollView> | null>,
  splitGeneration: number,
) {
  const scrollYRef = useRef(0);
  const contentHeightRef = useRef(0);
  const viewportHeightRef = useRef(0);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    contentHeightRef.current = h;
  }, []);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    viewportHeightRef.current = e.nativeEvent.layout.height;
  }, []);

  useEffect(() => {
    if (splitGeneration === 0) return;

    const t = setTimeout(() => {
      const contentH = contentHeightRef.current;
      const viewportH = viewportHeightRef.current;
      if (viewportH <= 0) return;
      const maxY = Math.max(0, contentH - viewportH);
      const y = Math.min(Math.max(0, scrollYRef.current), maxY);
      if (Math.abs(y - scrollYRef.current) > 2) {
        scrollRef.current?.scrollTo({ y, animated: false });
        scrollYRef.current = y;
      }
    }, 48);
    return () => clearTimeout(t);
  }, [splitGeneration, scrollRef]);

  return { scrollYRef, handleScroll, handleContentSizeChange, handleLayout };
}
