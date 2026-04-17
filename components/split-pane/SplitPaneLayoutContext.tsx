import { createContext, useContext } from "react";

/** Increments when the split position or keyboard-driven resize changes; children can clamp scroll. */
export const SplitPaneLayoutGenerationContext = createContext(0);

export function useSplitPaneLayoutGeneration(): number {
  return useContext(SplitPaneLayoutGenerationContext);
}
