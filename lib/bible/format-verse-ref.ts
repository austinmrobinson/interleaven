/**
 * Human-readable scripture label for a selection (single verse or inclusive verse range).
 */
export function formatVerseReferenceForDisplay(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse?: number,
): string {
  if (endVerse != null && endVerse !== startVerse) {
    return `${book} ${chapter}:${startVerse}\u2013${endVerse}`;
  }
  return `${book} ${chapter}:${startVerse}`;
}
