import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

export interface VerseReference {
  book: string;
  chapter: number;
  /** First verse of the selection (or only verse). */
  verse: number;
  /** Inclusive end verse when the selection spans multiple verses. */
  endVerse?: number;
  /** Selected wording inserted as the quoted body. */
  text: string;
}

interface NoteInsertContextValue {
  pendingInsert: VerseReference | null;
  requestInsert: (ref: VerseReference) => void;
  consumeInsert: () => VerseReference | null;
}

const NoteInsertContext = createContext<NoteInsertContextValue | null>(null);

export function NoteInsertProvider({ children }: { children: ReactNode }) {
  const [pendingInsert, setPendingInsert] = useState<VerseReference | null>(null);

  const requestInsert = useCallback((ref: VerseReference) => {
    setPendingInsert(ref);
  }, []);

  const consumeInsert = useCallback(() => {
    const current = pendingInsert;
    setPendingInsert(null);
    return current;
  }, [pendingInsert]);

  const value = useMemo<NoteInsertContextValue>(() => ({
    pendingInsert,
    requestInsert,
    consumeInsert,
  }), [pendingInsert, requestInsert, consumeInsert]);

  return (
    <NoteInsertContext.Provider value={value}>
      {children}
    </NoteInsertContext.Provider>
  );
}

export function useNoteInsert(): NoteInsertContextValue {
  const ctx = useContext(NoteInsertContext);
  if (!ctx) throw new Error('useNoteInsert must be used within NoteInsertProvider');
  return ctx;
}
