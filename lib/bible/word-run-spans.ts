import type { BibleVerse } from '@/lib/bible/types';
import type { HighlightStyle } from '@/lib/bible/types';

export type RunSpan = 'none' | 'single' | 'first' | 'middle' | 'last';

function styleRunKey(style: HighlightStyle | undefined): string | null {
  if (!style) return null;
  if (style.type === 'circle') return `circle:${style.color}`;
  if (style.type === 'highlight') return `highlight:${style.color}`;
  if (style.type === 'underline') return `underline:${style.color}`;
  return null;
}

/** Contiguous runs in reading order for underline / highlight / circle (same type+color). */
export function computeAnnotationRunSpans(
  verses: BibleVerse[],
  getStyle: (verse: number, wordIndex: number) => HighlightStyle | undefined,
): Map<string, RunSpan> {
  const flat: { verse: number; wordIndex: number; key: string | null }[] = [];
  for (const v of verses) {
    for (const w of v.words) {
      const key = styleRunKey(getStyle(v.verse, w.index));
      flat.push({ verse: v.verse, wordIndex: w.index, key });
    }
  }

  const map = new Map<string, RunSpan>();
  let i = 0;
  while (i < flat.length) {
    const key = flat[i].key;
    if (key == null) {
      map.set(`${flat[i].verse}-${flat[i].wordIndex}`, 'none');
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < flat.length && flat[j].key === key) j += 1;
    const runLen = j - i;
    for (let k = i; k < j; k++) {
      const id = `${flat[k].verse}-${flat[k].wordIndex}`;
      if (runLen === 1) map.set(id, 'single');
      else if (k === i) map.set(id, 'first');
      else if (k === j - 1) map.set(id, 'last');
      else map.set(id, 'middle');
    }
    i = j;
  }
  return map;
}

export function computeSelectionRunSpans(
  verses: BibleVerse[],
  isSelected: (verse: number, wordIndex: number) => boolean,
): Map<string, RunSpan> {
  const flat: { verse: number; wordIndex: number; sel: boolean }[] = [];
  for (const v of verses) {
    for (const w of v.words) {
      flat.push({ verse: v.verse, wordIndex: w.index, sel: isSelected(v.verse, w.index) });
    }
  }

  const map = new Map<string, RunSpan>();
  let i = 0;
  while (i < flat.length) {
    if (!flat[i].sel) {
      map.set(`${flat[i].verse}-${flat[i].wordIndex}`, 'none');
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < flat.length && flat[j].sel) j += 1;
    const runLen = j - i;
    for (let k = i; k < j; k++) {
      const id = `${flat[k].verse}-${flat[k].wordIndex}`;
      if (runLen === 1) map.set(id, 'single');
      else if (k === i) map.set(id, 'first');
      else if (k === j - 1) map.set(id, 'last');
      else map.set(id, 'middle');
    }
    i = j;
  }
  return map;
}
