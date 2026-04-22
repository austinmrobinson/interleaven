import type { EnrichedTextInputInstance, OnChangeStateEvent } from "react-native-enriched";

/** 0 = body, 1–4 = H1–H4 (H5/H6 treated as 0 for toolbar UI). */
export function headingSelectedLevelFromState(s: OnChangeStateEvent | null): number {
  if (!s) return 0;
  if (s.h1.isActive) return 1;
  if (s.h2.isActive) return 2;
  if (s.h3.isActive) return 3;
  if (s.h4.isActive) return 4;
  return 0;
}

export function applyHeadingSelection(
  level: number,
  editor: EnrichedTextInputInstance | null,
  s: OnChangeStateEvent | null,
) {
  if (!editor) return;
  if (level === 0) {
    if (s?.h1.isActive) editor.toggleH1();
    else if (s?.h2.isActive) editor.toggleH2();
    else if (s?.h3.isActive) editor.toggleH3();
    else if (s?.h4.isActive) editor.toggleH4();
    else if (s?.h5.isActive) editor.toggleH5();
    else if (s?.h6.isActive) editor.toggleH6();
    return;
  }
  if (level === 1 && !s?.h1.isActive) editor.toggleH1();
  else if (level === 2 && !s?.h2.isActive) editor.toggleH2();
  else if (level === 3 && !s?.h3.isActive) editor.toggleH3();
  else if (level === 4 && !s?.h4.isActive) editor.toggleH4();
}
