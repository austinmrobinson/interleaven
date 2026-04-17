import type { RefObject } from "react";
import { ScrollView, View } from "react-native";

const EDGE_MARGIN = 14;

/** Anything that exposes `measureInWindow` (e.g. `View`, native text input). */
export type MeasureInWindowRef = RefObject<
  { measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) => void } | null
>;

export interface EnsureViewInScrollWindowOptions {
  /** Extra offset from the top of the ScrollView window (e.g. floating chrome). */
  insetTop: number;
  /** Screen Y of the keyboard’s top edge, or null when hidden. */
  keyboardTopY: number | null;
  /**
   * Subtract from keyboard top so the caret stays above floating UI (e.g. format toolbar)
   * stacked above the keyboard. Ignored when `keyboardTopY` is null.
   */
  accessoryAboveKeyboard?: number;
}

/**
 * Scrolls a ScrollView so a target view stays between insetTop and the keyboard (or bottom of the scroll view).
 */
export function ensureViewInScrollWindow(
  scrollRef: RefObject<ScrollView | null>,
  scrollYRef: RefObject<number>,
  targetRef: MeasureInWindowRef,
  opts: EnsureViewInScrollWindowOptions,
): void {
  const scroll = scrollRef.current;
  const target = targetRef.current;
  if (!scroll || !target) return;

  const accessory = opts.accessoryAboveKeyboard ?? 0;

  target.measureInWindow((tx, ty, _tw, th) => {
    (scroll as unknown as View).measureInWindow((sx: number, sy: number, _sw: number, sh: number) => {
      const visibleTop = sy + opts.insetTop;
      let visibleBottom: number;
      if (opts.keyboardTopY != null && opts.keyboardTopY > 0) {
        visibleBottom = opts.keyboardTopY - accessory;
      } else {
        visibleBottom = sy + sh;
      }

      let delta = 0;
      if (ty + th > visibleBottom - EDGE_MARGIN) {
        delta = ty + th - (visibleBottom - EDGE_MARGIN);
      } else if (ty < visibleTop + EDGE_MARGIN) {
        delta = ty - (visibleTop + EDGE_MARGIN);
      }

      if (delta === 0) return;

      const nextY = Math.max(0, scrollYRef.current + delta);
      scroll.scrollTo({ y: nextY, animated: true });
      scrollYRef.current = nextY;
    });
  });
}
