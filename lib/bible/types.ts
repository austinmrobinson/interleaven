export interface BibleWord {
  text: string;
  index: number;
}

export interface BibleVerse {
  verse: number;
  text: string;
  words: BibleWord[];
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface RawVerse {
  verse: string;
  text: string;
}

export interface RawChapter {
  chapter: string;
  verses: RawVerse[];
}

export interface RawBook {
  book: string;
  chapters: RawChapter[];
}

export interface BookInfo {
  name: string;
  chapterCount: number;
  testament: 'old' | 'new';
}

export interface HighlightStyle {
  type: 'highlight' | 'underline' | 'circle';
  color: string;
}

export interface Highlight {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  startWordIndex: number;
  endWordIndex: number;
  style: HighlightStyle;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteVerse {
  noteId: string;
  book: string;
  chapter: number;
  verse: number;
}

export interface Bookmark {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  createdAt: number;
}
