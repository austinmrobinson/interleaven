import { getDatabase } from './schema';
import type { Note } from '@/lib/bible/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDatabase();
  return db.getAllAsync<Note>('SELECT * FROM notes ORDER BY updatedAt DESC');
}

export async function getNote(id: string): Promise<Note | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?', [id]);
}

export async function createNote(title: string = '', content: string = ''): Promise<Note> {
  const db = await getDatabase();
  const id = generateId();
  const now = Date.now();

  await db.runAsync(
    'INSERT INTO notes (id, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [id, title, content, now, now]
  );

  return { id, title, content, createdAt: now, updatedAt: now };
}

export async function updateNote(id: string, title: string, content: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    'UPDATE notes SET title = ?, content = ?, updatedAt = ? WHERE id = ?',
    [title, content, now, id]
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM note_verses WHERE noteId = ?', [id]);
}

export async function addVerseToNote(
  noteId: string,
  book: string,
  chapter: number,
  verse: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO note_verses (noteId, book, chapter, verse) VALUES (?, ?, ?, ?)',
    [noteId, book, chapter, verse]
  );
}

export async function getVersesForNote(noteId: string): Promise<Array<{
  book: string;
  chapter: number;
  verse: number;
}>> {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT book, chapter, verse FROM note_verses WHERE noteId = ?',
    [noteId]
  );
}
