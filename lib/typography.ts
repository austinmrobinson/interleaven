import { Platform } from 'react-native';

const SERIF_IOS = 'NewYorkMedium-Regular';

export const bibleSerifFont = Platform.select({
  ios: SERIF_IOS,
  default: 'serif',
});

/** Serif for notes, titles, and book-style chrome (same face as the reader body). */
export const bookSerifFont = bibleSerifFont;
