import { containsAll } from "@/lib/searchMatch";

// A search result hands the words that were typed to the page it opens, through sessionStorage so the URL stays clean.
const KEY = "sys101:find";
const FRESH_MS = 15_000;
// A line of reading text. The innermost match wins, so a list item holding a paragraph picks the paragraph.
export const LINE = "p, li, dd, dt, blockquote, figcaption, summary, td, h1, h2, h3, h4";
export const FOUND_MS = 2000;

const tokens = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? [];

/** `excerpt` is the result's HTML snippet; its longer words pick the line it came from when several lines hold the query. */
export function rememberFind(url: string, query: string, excerpt = "") {
  try {
    const path = url.split("#")[0];
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hint = tokens(excerpt.replace(/<[^>]*>/g, " "));
    sessionStorage.setItem(KEY, JSON.stringify({ path, words, hint, at: Date.now() }));
  } catch {} // private mode: the page still opens, just without the highlight
}

/** The remembered words and excerpt words if they were left for this path a moment ago; read once. */
export function takeFind(pathname: string): { words: string[]; hint: string[] } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const { path, words, hint, at } = JSON.parse(raw);
    return path === pathname && Date.now() - at < FRESH_MS && Array.isArray(words) ? { words, hint: Array.isArray(hint) ? hint : [] } : null;
  } catch {
    return null;
  }
}

/**
 * The visible line in `root` whose text has every word at the start of a word and shares the most words with the excerpt
 * (the first such line on a tie). When the URL points at a section, lines after that section's heading are preferred,
 * because that is the section the result's excerpt came from.
 */
export function findLine(root: ParentNode, words: string[], hint: string[], anchor: Element | null): Element | null {
  const hits = [...root.querySelectorAll(LINE)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest(".site-header, .site-footer, [role=search], nav") && containsAll(el.textContent ?? "", words) && ![...el.querySelectorAll(LINE)].some((c) => containsAll(c.textContent ?? "", words)),
  );
  const after = anchor ? hits.filter((el) => anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING || el === anchor) : [];
  const score = (el: Element) => {
    const own = new Set(tokens(el.textContent ?? ""));
    return hint.filter((w) => own.has(w)).length;
  };
  const pool = after.length ? after : hits;
  return pool.reduce<Element | null>((best, el) => (!best || score(el) > score(best) ? el : best), null);
}
