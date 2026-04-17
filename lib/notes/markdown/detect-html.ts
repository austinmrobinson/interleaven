/** Block / inline tags the rich editor and HTML normalizer understand. */
const LIKELY_HTML =
  /<\/?(p|br|h[1-6]|ul|ol|li|blockquote|b|strong|i|em|u|s|code|pre|a|div|span)\b/i;

export function looksLikeLikelyHtml(text: string): boolean {
  return LIKELY_HTML.test(text);
}
