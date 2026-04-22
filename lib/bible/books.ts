import type { BookInfo } from './types';

const OLD_TESTAMENT: string[] = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
];

const NEW_TESTAMENT: string[] = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John',
  '3 John', 'Jude', 'Revelation',
];

export const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];

export function getTestament(bookName: string): 'old' | 'new' {
  return OLD_TESTAMENT.includes(bookName) ? 'old' : 'new';
}

export function getBookIndex(bookName: string): number {
  return ALL_BOOKS.indexOf(bookName);
}

export function getNextBook(bookName: string): string | undefined {
  const idx = getBookIndex(bookName);
  return idx < ALL_BOOKS.length - 1 ? ALL_BOOKS[idx + 1] : undefined;
}

export function getPrevBook(bookName: string): string | undefined {
  const idx = getBookIndex(bookName);
  return idx > 0 ? ALL_BOOKS[idx - 1] : undefined;
}
