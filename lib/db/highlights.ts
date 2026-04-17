import { getDatabase } from './schema';
import type { Highlight, HighlightStyle } from '@/lib/bible/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export async function getHighlightsForChapter(
  book: string,
  chapter: number
): Promise<Highlight[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    book: string;
    chapter: number;
    verse: number;
    startWordIndex: number;
    endWordIndex: number;
    styleType: string;
    color: string;
    createdAt: number;
  }>('SELECT * FROM highlights WHERE book = ? AND chapter = ?', [book, chapter]);

  return rows.map(row => ({
    id: row.id,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    startWordIndex: row.startWordIndex,
    endWordIndex: row.endWordIndex,
    style: { type: row.styleType as HighlightStyle['type'], color: row.color },
    createdAt: row.createdAt,
  }));
}

export async function addHighlight(
  book: string,
  chapter: number,
  verse: number,
  startWordIndex: number,
  endWordIndex: number,
  style: HighlightStyle
): Promise<Highlight> {
  const db = await getDatabase();
  const id = generateId();
  const createdAt = Date.now();

  await db.runAsync(
    'INSERT INTO highlights (id, book, chapter, verse, startWordIndex, endWordIndex, styleType, color, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, book, chapter, verse, startWordIndex, endWordIndex, style.type, style.color, createdAt]
  );

  return { id, book, chapter, verse, startWordIndex, endWordIndex, style, createdAt };
}

export async function removeHighlight(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM highlights WHERE id = ?', [id]);
}

export async function clearHighlightsForVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM highlights WHERE book = ? AND chapter = ? AND verse = ?',
    [book, chapter, verse]
  );
}
