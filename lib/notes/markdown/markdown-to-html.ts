import { marked } from 'marked';
import { enrichedHtmlToMarkdown } from './html-to-markdown';
import { looksLikeLikelyHtml } from './detect-html';

marked.use({
  gfm: true,
  breaks: true,
});

export { looksLikeLikelyHtml } from './detect-html';

export function markdownToEnrichedHtml(markdown: string): string {
  const trimmed = markdown.trim();
  if (!trimmed) return '<p></p>';
  const html = marked.parse(trimmed, { async: false }) as string;
  const out = html.trim();
  return out || '<p></p>';
}

/**
 * Load note body into the editor: Markdown → HTML; legacy HTML → MD → HTML once to normalize.
 */
export function noteContentToEditorHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '<p></p>';
  if (looksLikeLikelyHtml(raw)) {
    return markdownToEnrichedHtml(enrichedHtmlToMarkdown(raw));
  }
  return markdownToEnrichedHtml(raw);
}
