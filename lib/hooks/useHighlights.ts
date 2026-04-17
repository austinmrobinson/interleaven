import { useState, useEffect, useCallback } from 'react';
import type { Highlight, HighlightStyle } from '@/lib/bible/types';
import {
  getHighlightsForChapter,
  addHighlight,
  removeHighlight,
} from '@/lib/db/highlights';

export function useHighlights(book: string, chapter: number) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    getHighlightsForChapter(book, chapter).then(h => {
      setHighlights(h);
      setIsLoaded(true);
    });
  }, [book, chapter]);

  const add = useCallback(async (
    verse: number,
    startWordIndex: number,
    endWordIndex: number,
    style: HighlightStyle
  ) => {
    const h = await addHighlight(book, chapter, verse, startWordIndex, endWordIndex, style);
    setHighlights(prev => [...prev, h]);
    return h;
  }, [book, chapter]);

  const remove = useCallback(async (id: string) => {
    await removeHighlight(id);
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, []);

  const getHighlightForWord = useCallback((verse: number, wordIndex: number): Highlight | undefined => {
    return highlights.find(h =>
      h.verse === verse &&
      wordIndex >= h.startWordIndex &&
      wordIndex <= h.endWordIndex
    );
  }, [highlights]);

  return { highlights, isLoaded, add, remove, getHighlightForWord };
}
