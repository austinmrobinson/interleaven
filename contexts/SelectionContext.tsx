import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

interface WordPosition {
  verse: number;
  wordIndex: number;
}

interface SelectionRange {
  book: string;
  chapter: number;
  start: WordPosition;
  end: WordPosition;
}

interface SelectionContextValue {
  selection: SelectionRange | null;
  isSelecting: boolean;
  startSelection: (book: string, chapter: number, verse: number, wordIndex: number) => void;
  extendSelection: (verse: number, wordIndex: number) => void;
  clearSelection: () => void;
  isWordSelected: (verse: number, wordIndex: number) => boolean;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

function isInRange(
  verse: number,
  wordIndex: number,
  start: WordPosition,
  end: WordPosition
): boolean {
  const normalizedStart = start.verse < end.verse ||
    (start.verse === end.verse && start.wordIndex <= end.wordIndex)
    ? start : end;
  const normalizedEnd = normalizedStart === start ? end : start;

  if (verse < normalizedStart.verse || verse > normalizedEnd.verse) return false;
  if (verse === normalizedStart.verse && verse === normalizedEnd.verse) {
    return wordIndex >= normalizedStart.wordIndex && wordIndex <= normalizedEnd.wordIndex;
  }
  if (verse === normalizedStart.verse) return wordIndex >= normalizedStart.wordIndex;
  if (verse === normalizedEnd.verse) return wordIndex <= normalizedEnd.wordIndex;
  return true;
}

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<SelectionRange | null>(null);

  const isSelecting = selection !== null;

  const startSelection = useCallback((book: string, chapter: number, verse: number, wordIndex: number) => {
    setSelection({
      book,
      chapter,
      start: { verse, wordIndex },
      end: { verse, wordIndex },
    });
  }, []);

  const extendSelection = useCallback((verse: number, wordIndex: number) => {
    setSelection(prev => {
      if (!prev) return prev;
      return { ...prev, end: { verse, wordIndex } };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  const isWordSelected = useCallback((verse: number, wordIndex: number): boolean => {
    if (!selection) return false;
    return isInRange(verse, wordIndex, selection.start, selection.end);
  }, [selection]);

  const value = useMemo<SelectionContextValue>(() => ({
    selection,
    isSelecting,
    startSelection,
    extendSelection,
    clearSelection,
    isWordSelected,
  }), [selection, isSelecting, startSelection, extendSelection, clearSelection, isWordSelected]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within SelectionProvider');
  return ctx;
}
