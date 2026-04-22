import { getDatabase } from './schema';
import type { Bookmark } from '@/lib/bible/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export async function getBookmarks(): Promise<Bookmark[]> {
  const db = await getDatabase();
  return db.getAllAsync<Bookmark>('SELECT * FROM bookmarks ORDER BY createdAt DESC');
}

export async function addBookmark(
  book: string,
  chapter: number,
  verse: number
): Promise<Bookmark> {
  const db = await getDatabase();
  const id = generateId();
  const createdAt = Date.now();

  await db.runAsync(
    'INSERT INTO bookmarks (id, book, chapter, verse, createdAt) VALUES (?, ?, ?, ?, ?)',
    [id, book, chapter, verse, createdAt]
  );

  return { id, book, chapter, verse, createdAt };
}

export async function removeBookmark(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [id]);
}
