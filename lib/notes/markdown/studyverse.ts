export const STUDYVERSE_SCHEME = 'studyverse:';

export function studyVerseHref(
  book: string,
  chapter: number,
  verse: number,
  endVerse?: number,
): string {
  const enc = encodeURIComponent(book);
  const end =
    endVerse != null && endVerse !== verse ? `-${endVerse}` : '';
  return `${STUDYVERSE_SCHEME}${enc}/${chapter}/${verse}${end}`;
}

export function parseStudyVerseHref(href: string): {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
} | null {
  if (!href.startsWith(STUDYVERSE_SCHEME)) return null;
  const path = href.slice(STUDYVERSE_SCHEME.length);
  const parts = path.split('/');
  if (parts.length !== 3) return null;
  const book = decodeURIComponent(parts[0]);
  const chapter = parseInt(parts[1], 10);
  const versePart = parts[2];
  if (Number.isNaN(chapter)) return null;
  if (versePart.includes('-')) {
    const [a, b] = versePart.split('-');
    const verse = parseInt(a, 10);
    const endVerse = parseInt(b, 10);
    if (Number.isNaN(verse) || Number.isNaN(endVerse)) return null;
    return { book, chapter, verse, endVerse };
  }
  const verse = parseInt(versePart, 10);
  if (Number.isNaN(verse)) return null;
  return { book, chapter, verse };
}
