export const bibleSerifFont = 'Lora_400Regular';
export const bibleSerifFontMedium = 'Lora_500Medium';
export const bibleSerifFontSemiBold = 'Lora_600SemiBold';
export const bibleSerifFontBold = 'Lora_700Bold';
export const bibleSerifFontItalic = 'Lora_400Regular_Italic';

export const bookSerifFont = bibleSerifFont;

/**
 * Family name for the notes editor. `EnrichedTextInput` applies bold/italic via
 * UIFontDescriptor symbolic traits, which only work when `fontFamily` is a real
 * family (e.g. "Lora") — not a single face like "Lora_400Regular". Face-specific
 * names remain correct for RN `<Text>` in the Bible reader.
 */
export const bookSerifFontFamily = 'Lora';
