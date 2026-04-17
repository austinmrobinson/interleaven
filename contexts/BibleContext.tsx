import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { BibleChapter } from '@/lib/bible/types';
import { getChapter, getChapterCount } from '@/lib/bible/data';
import { getNextBook, getPrevBook } from '@/lib/bible/books';

interface BibleContextValue {
  currentBook: string;
  currentChapter: number;
  chapterData: BibleChapter | null;
  chapterCount: number;
  goToChapter: (book: string, chapter: number) => void;
  goNextChapter: () => void;
  goPrevChapter: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const BibleContext = createContext<BibleContextValue | null>(null);

export function BibleProvider({ children }: { children: ReactNode }) {
  const [currentBook, setCurrentBook] = useState('Genesis');
  const [currentChapter, setCurrentChapter] = useState(1);

  const chapterData = useMemo(
    () => getChapter(currentBook, currentChapter),
    [currentBook, currentChapter]
  );

  const chapterCount = useMemo(
    () => getChapterCount(currentBook),
    [currentBook]
  );

  const goToChapter = useCallback((book: string, chapter: number) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
  }, []);

  const hasNext = useMemo(() => {
    if (currentChapter < chapterCount) return true;
    return getNextBook(currentBook) !== undefined;
  }, [currentBook, currentChapter, chapterCount]);

  const hasPrev = useMemo(() => {
    if (currentChapter > 1) return true;
    return getPrevBook(currentBook) !== undefined;
  }, [currentBook, currentChapter]);

  const goNextChapter = useCallback(() => {
    if (currentChapter < chapterCount) {
      setCurrentChapter(c => c + 1);
    } else {
      const next = getNextBook(currentBook);
      if (next) {
        setCurrentBook(next);
        setCurrentChapter(1);
      }
    }
  }, [currentBook, currentChapter, chapterCount]);

  const goPrevChapter = useCallback(() => {
    if (currentChapter > 1) {
      setCurrentChapter(c => c - 1);
    } else {
      const prev = getPrevBook(currentBook);
      if (prev) {
        setCurrentBook(prev);
        setCurrentChapter(getChapterCount(prev));
      }
    }
  }, [currentBook, currentChapter]);

  const value = useMemo<BibleContextValue>(() => ({
    currentBook,
    currentChapter,
    chapterData,
    chapterCount,
    goToChapter,
    goNextChapter,
    goPrevChapter,
    hasNext,
    hasPrev,
  }), [currentBook, currentChapter, chapterData, chapterCount, goToChapter, goNextChapter, goPrevChapter, hasNext, hasPrev]);

  return (
    <BibleContext.Provider value={value}>
      {children}
    </BibleContext.Provider>
  );
}

export function useBible(): BibleContextValue {
  const ctx = useContext(BibleContext);
  if (!ctx) throw new Error('useBible must be used within BibleProvider');
  return ctx;
}
