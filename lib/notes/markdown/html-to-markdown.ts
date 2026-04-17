import { NodeHtmlMarkdown } from 'node-html-markdown';

const baseOptions = {
  bulletMarker: '-',
  strongDelimiter: '**',
  emDelimiter: '*',
  useInlineLinks: true,
} as const;

/** Standard instance: escapes markdown chars in plain text so round-tripping preserves literal `*`, `#`, etc. */
const nhmEscaped = new NodeHtmlMarkdown(baseOptions);

/**
 * "Raw" instance: does NOT escape markdown chars, so newly-typed markdown syntax in
 * unformatted HTML text (e.g. `<p>**bold** </p>` after the user types `**bold** `)
 * round-trips back into real formatting when reparsed.
 *
 * Pattern `/.^/` never matches, so line-start escaping is effectively disabled.
 * Global escape only handles backslashes themselves.
 */
const nhmRaw = new NodeHtmlMarkdown({
  ...baseOptions,
  globalEscape: [/\\/gm, '\\\\'],
  lineStartEscape: [/.^/, ''],
});

function wrap(html: string): string | null {
  const trimmed = html.trim();
  if (!trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>') return null;
  return trimmed.includes('<body') ? trimmed : `<div>${trimmed}</div>`;
}

/** Convert editor HTML to Markdown for persistence (safely escapes literal `*`, `#`, etc.). */
export function enrichedHtmlToMarkdown(html: string): string {
  const wrapped = wrap(html);
  if (!wrapped) return '';
  return nhmEscaped.translate(wrapped).trim();
}

/**
 * Convert editor HTML to Markdown without escaping markdown punctuation.
 *
 * Use this only for the live-shortcut roundtrip — typed syntax like `**bold** ` that
 * is still literal HTML text must survive the HTML → Markdown hop unescaped so that
 * re-parsing the Markdown turns it into real formatting.
 */
export function enrichedHtmlToMarkdownRaw(html: string): string {
  const wrapped = wrap(html);
  if (!wrapped) return '';
  return nhmRaw.translate(wrapped).trim();
}
