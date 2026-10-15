/**
 * A Pagefind excerpt arrives as HTML with the matched words in <mark>. It is built from the site's own text and escaped by
 * Pagefind, but it is injected as HTML, so keep only the exact tags <mark> and </mark> and turn every other "<" into text.
 */
export function safeExcerpt(html: string): string {
  return html.replace(/<(?!\/?mark>)/g, "&lt;");
}
