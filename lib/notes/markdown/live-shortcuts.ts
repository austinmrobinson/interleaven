export interface LiveMarkdownShortcutResult {
  reparse: true;
  /** Caret offset in plain text after `markdownToEnrichedHtml` runs. */
  caret: number;
}

function lineStartsWithListMarker(line: string): boolean {
  return /^\s*([*-]|\d+\.)\s+/.test(line);
}

/**
 * Detects a completed Markdown fragment immediately before the caret.
 *
 * The trigger character (space or newline) is at `plain[caret - 1]`. Everything
 * before the trigger is in `beforeTrigger`, and `line` is the current line's
 * contents up to (but not including) the trigger — so block-level patterns like
 * `# Heading` and `- item` match cleanly on either a space or a newline trigger.
 */
export function detectLiveMarkdownShortcut(
  plain: string,
  caret: number,
): LiveMarkdownShortcutResult | null {
  if (caret < 1) return null;
  const trigger = plain[caret - 1];
  if (trigger !== ' ' && trigger !== '\n') return null;

  const beforeTrigger = plain.slice(0, caret - 1);
  const lineStart = beforeTrigger.lastIndexOf('\n') + 1;
  const line = beforeTrigger.slice(lineStart);

  // Inline patterns: `**bold**`, `__bold__`, `~~strike~~`, `` `code` ``, `*italic*`, `_italic_`.

  let m = beforeTrigger.match(/\*\*([^*]+)\*\*$/);
  if (m) return shrink(caret, m[0].length - m[1].length);

  m = beforeTrigger.match(/__([^_]+)__$/);
  if (m) return shrink(caret, m[0].length - m[1].length);

  m = beforeTrigger.match(/~~([^~]+)~~$/);
  if (m) return shrink(caret, m[0].length - m[1].length);

  m = beforeTrigger.match(/`([^`]+)`$/);
  if (m) return shrink(caret, m[0].length - m[1].length);

  // Italic (`*x*` / `_x_`) is skipped when the line is a list item so `* item ` doesn't
  // get misread as italic, and when the match is actually the tail of a `**bold**` pair.
  if (!lineStartsWithListMarker(line)) {
    if (!/\*\*[^*]+\*\*$/.test(beforeTrigger)) {
      m = beforeTrigger.match(/(?:^|[^*])\*([^*\s][^*\n]*?)\*$/);
      if (m) return shrink(caret, 2);
    }
    if (!/__[^_]+__$/.test(beforeTrigger)) {
      m = beforeTrigger.match(/(?:^|[^_])_([^_\s][^_\n]*?)_$/);
      if (m) return shrink(caret, 2);
    }
  }

  // Block patterns only trigger at end of the current line.
  const hm = line.match(/^(#{1,6})\s+(\S.*)$/);
  if (hm) {
    const title = hm[2];
    // After reparse: line becomes just `title`. Cursor lands just after it.
    return { reparse: true, caret: lineStart + title.length };
  }

  const qm = line.match(/^>\s+(\S.*)$/);
  if (qm) {
    const inner = qm[1];
    return { reparse: true, caret: lineStart + inner.length };
  }

  const lm = line.match(/^[-*]\s+(\S.*)$/);
  if (lm) {
    const inner = lm[1];
    return { reparse: true, caret: lineStart + inner.length };
  }

  const olm = line.match(/^\d+\.\s+(\S.*)$/);
  if (olm) {
    const inner = olm[1];
    return { reparse: true, caret: lineStart + inner.length };
  }

  return null;
}

function shrink(caret: number, delta: number): LiveMarkdownShortcutResult {
  return { reparse: true, caret: caret - delta };
}
