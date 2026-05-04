import { createContext, useContext } from "react";
import type { MutableRefObject } from "react";

/** Increments when the split position or keyboard-driven resize changes; children can clamp scroll. */
export const SplitPaneLayoutGenerationContext = createContext(0);

export function useSplitPaneLayoutGeneration(): number {
  return useContext(SplitPaneLayoutGenerationContext);
}

/**
 * True when the top pane is at (or hovering near) the smallest snap point.
 * Children can use this to hide chrome that would crowd a short pane.
 */
export const TopPaneAtSmallestSnapContext = createContext(false);

export function useTopPaneAtSmallestSnap(): boolean {
  return useContext(TopPaneAtSmallestSnapContext);
}

/**
 * Ref holding an editor-blur callback. Children that own focusable inputs (e.g.
 * NotesEditor) set `ref.current` to a blur function on mount; SplitPane calls it
 * when it needs to force-dismiss the keyboard (e.g. user drags the notes pane
 * below 50%). Goes through a ref (not state) so gesture callbacks can invoke it
 * without recreating the gesture on every editor re-render.
 */
export type EditorBlurHandler = (() => void) | null;
export const EditorBlurRefContext =
  createContext<MutableRefObject<EditorBlurHandler> | null>(null);

export function useEditorBlurRef(): MutableRefObject<EditorBlurHandler> | null {
  return useContext(EditorBlurRefContext);
}
