/**
 * Bottom area of the Bible reader reserved for prev/next chapter controls.
 * Keep in sync with scripture scroll `paddingBottom` in `BibleReader`.
 */
export const BIBLE_READER_BOTTOM_CHROME_HEIGHT = 72;

/** Height of the bottom linear fade over scripture (modest extension past nav; keep in sync with visual). */
export const BIBLE_READER_BOTTOM_FADE_HEIGHT = BIBLE_READER_BOTTOM_CHROME_HEIGHT + 16;

/**
 * Top padding under the floating header in `BibleReader` scroll content.
 * Keep in sync with `scrollContent.paddingTop` and selection margin strip `top`.
 */
export const BIBLE_READER_SCROLL_TOP_INSET = 56;

/** Height of the top fade over scripture (slight extension past header clearance). */
export const BIBLE_READER_TOP_FADE_HEIGHT = BIBLE_READER_SCROLL_TOP_INSET + 16;

/** Horizontal inset of verse body in `ChapterVersesFlow`; selection margin taps use the same width. */
export const BIBLE_READER_TEXT_HORIZONTAL_INSET = 20;
