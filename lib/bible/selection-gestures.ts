import type { BibleVerse } from '@/lib/bible/types';

export interface WordPos {
  verse: number;
  wordIndex: number;
}

export interface SelectionEndpoints {
  start: WordPos;
  end: WordPos;
}

export function normalizeSelectionEndpoints(start: WordPos, end: WordPos): SelectionEndpoints {
  const a =
    start.verse < end.verse || (start.verse === end.verse && start.wordIndex <= end.wordIndex)
      ? start
      : end;
  const b = a === start ? end : start;
  return { start: a, end: b };
}

export function flattenChapterWords(verses: BibleVerse[]): WordPos[] {
  const out: WordPos[] = [];
  for (const v of verses) {
    for (const w of v.words) {
      out.push({ verse: v.verse, wordIndex: w.index });
    }
  }
  return out;
}

function flatIndex(flat: WordPos[], pos: WordPos): number {
  return flat.findIndex(p => p.verse === pos.verse && p.wordIndex === pos.wordIndex);
}

/** Move selection end by `delta` words along the chapter (positive = later in text). */
export function moveSelectionEndByWords(
  verses: BibleVerse[],
  start: WordPos,
  end: WordPos,
  delta: number,
): WordPos | null {
  const flat = flattenChapterWords(verses);
  const norm = normalizeSelectionEndpoints(start, end);
  const startIdx = flatIndex(flat, norm.start);
  const endIdx = flatIndex(flat, norm.end);
  if (startIdx < 0 || endIdx < 0) return null;
  const nextIdx = endIdx + delta;
  if (nextIdx < startIdx || nextIdx >= flat.length) return null;
  return flat[nextIdx];
}

/**
 * Extend selection downward by one “verse line”: first snap end to the last word of its verse,
 * then on a later swipe extend to the last word of the next verse.
 */
export function extendSelectionEndOneVerseDown(
  verses: BibleVerse[],
  start: WordPos,
  end: WordPos,
): WordPos | null {
  const norm = normalizeSelectionEndpoints(start, end);
  const vi = verses.findIndex(v => v.verse === norm.end.verse);
  if (vi < 0) return null;
  const verse = verses[vi];
  const lastW = verse.words[verse.words.length - 1];
  if (norm.end.wordIndex !== lastW.index) {
    return { verse: verse.verse, wordIndex: lastW.index };
  }
  if (vi >= verses.length - 1) return null;
  const next = verses[vi + 1];
  if (!next.words.length) return null;
  const lastN = next.words[next.words.length - 1];
  return { verse: next.verse, wordIndex: lastN.index };
}

/**
 * Shrink selection upward by one “verse line”: pull end to just before the first word of the
 * verse that currently contains the end (usually the last word of the previous verse).
 */
export function shrinkSelectionEndOneVerseUp(
  verses: BibleVerse[],
  start: WordPos,
  end: WordPos,
): WordPos | null {
  const norm = normalizeSelectionEndpoints(start, end);
  const flat = flattenChapterWords(verses);
  const startIdx = flatIndex(flat, norm.start);
  const endIdx = flatIndex(flat, norm.end);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) return null;

  const vi = verses.findIndex(v => v.verse === norm.end.verse);
  if (vi < 0) return null;
  const verse = verses[vi];
  const firstW = verse.words[0];
  const endVerseFirstIdx = flatIndex(flat, { verse: verse.verse, wordIndex: firstW.index });

  if (endIdx > endVerseFirstIdx) {
    const newIdx = endVerseFirstIdx - 1;
    if (newIdx >= startIdx) return flat[newIdx];
    return null;
  }

  if (vi === 0) {
    return moveSelectionEndByWords(verses, norm.start, norm.end, -1);
  }
  const prev = verses[vi - 1];
  const lastP = prev.words[prev.words.length - 1];
  const idx = flatIndex(flat, { verse: prev.verse, wordIndex: lastP.index });
  if (idx >= startIdx) return flat[idx];
  return moveSelectionEndByWords(verses, norm.start, norm.end, -1);
}
