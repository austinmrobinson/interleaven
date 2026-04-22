import { useState, useEffect, useCallback } from 'react';
import type { Note } from '@/lib/bible/types';
import { createNote, updateNote, getNote, getAllNotes } from '@/lib/db/notes';

export function useCurrentNote() {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    createNote('', '').then(n => {
      setNote(n);
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback(async (title: string, content: string) => {
    if (!note) return;
    await updateNote(note.id, title, content);
    setNote(prev => prev ? { ...prev, title, content, updatedAt: Date.now() } : prev);
  }, [note]);

  const loadNote = useCallback(async (id: string) => {
    const loaded = await getNote(id);
    if (loaded) setNote(loaded);
  }, []);

  const startNewNote = useCallback(async () => {
    const n = await createNote('', '');
    setNote(n);
    return n;
  }, []);

  return { note, isLoaded, save, loadNote, startNewNote };
}

export function useAllNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  const refresh = useCallback(async () => {
    const all = await getAllNotes();
    setNotes(all);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { notes, refresh };
}
