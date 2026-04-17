import { formatVerseReferenceForDisplay } from '@/lib/bible/format-verse-ref';
import { studyVerseHref } from './studyverse';

export interface ScriptureQuoteRef {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  text: string;
}

/** Blockquote line with a verse-scoped link (round-trips through Markdown + editor). */
export function buildScriptureQuoteMarkdown(ref: ScriptureQuoteRef): string {
  const label = formatVerseReferenceForDisplay(
    ref.book,
    ref.chapter,
    ref.verse,
    ref.endVerse,
  );
  const href = studyVerseHref(ref.book, ref.chapter, ref.verse, ref.endVerse);
  const normalized = ref.text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const head = `> [**${label}**](${href}) — ${lines[0] ?? ''}`;
  const tail = lines
    .slice(1)
    .map((l) => `> ${l}`)
    .join('\n');
  return (tail ? `${head}\n${tail}` : head) + '\n\n';
}
