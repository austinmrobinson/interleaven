import type { BibleWord } from './types';

export function tokenizeVerseText(text: string): BibleWord[] {
  const words: BibleWord[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(text)) !== null) {
    words.push({ text: match[0], index });
    index++;
  }

  return words;
}
