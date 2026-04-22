import { parseStudyVerseHref } from './studyverse';

export interface VerseRefExtracted {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  text: string;
}

/**
 * Pull scripture chips from stored Markdown (including `studyverse:` links).
 * Continuation lines `> ...` after the header line are merged into `text`.
 */
export function extractVerseRefsFromMarkdown(md: string): VerseRefExtracted[] {
  const out: VerseRefExtracted[] = [];
  const seen = new Set<string>();
  const headerRe =
    /\[\*\*([\s\S]*?)\*\*\]\((studyverse:[^)]+)\)\s*[—\-]\s*([^\n]*)/g;

  for (const m of md.matchAll(headerRe)) {
    const parsed = parseStudyVerseHref(m[2]);
    if (!parsed) continue;
    const key = `${parsed.book}|${parsed.chapter}|${parsed.verse}|${parsed.endVerse ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const start = m.index + m[0].length;
    const rest = md.slice(start);
    const contMatch = rest.match(/^(?:\n>\s*[^\n]*)+/);
    let text = (m[3] ?? '').trim();
    if (contMatch) {
      const extra = contMatch[0]
        .split('\n')
        .slice(1)
        .map((line) => line.replace(/^>\s?/, ''))
        .join('\n');
      if (extra) text = text ? `${text}\n${extra}` : extra;
    }
    out.push({ ...parsed, text: text.trim() });
  }
  return out;
}
