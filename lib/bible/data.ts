import type { RawBook, BibleChapter } from './types';
import { tokenizeVerseText } from './tokenizer';

let bibleData: RawBook[] | null = null;

function loadBibleData(): RawBook[] {
  if (!bibleData) {
    bibleData = require('@/assets/bible/kjv.json') as RawBook[];
  }
  return bibleData;
}

export function getChapter(bookName: string, chapter: number): BibleChapter | null {
  const books = loadBibleData();
  const book = books.find(b => b.book === bookName);
  if (!book) return null;

  const rawChapter = book.chapters.find(c => parseInt(c.chapter, 10) === chapter);
  if (!rawChapter) return null;

  return {
    book: bookName,
    chapter,
    verses: rawChapter.verses.map(v => ({
      verse: parseInt(v.verse, 10),
      text: v.text,
      words: tokenizeVerseText(v.text),
    })),
  };
}

export function getChapterCount(bookName: string): number {
  const books = loadBibleData();
  const book = books.find(b => b.book === bookName);
  return book ? book.chapters.length : 0;
}

export function getBookNames(): string[] {
  const books = loadBibleData();
  return books.map(b => b.book);
}
