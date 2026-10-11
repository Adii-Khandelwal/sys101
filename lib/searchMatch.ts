// Strict word checks on top of the search index's loose matching.
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Words the reader has finished typing (followed by a space). The search
 * index matches loosely (prefixes, near spellings), so a page is only kept if
 * it really contains each finished word at the start of a word: "flipkart "
 * must not match "fly". The word still being typed keeps loose matching.
 */
export function finishedWords(q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return /\s$/.test(q) ? words : words.slice(0, -1);
}

export function containsAll(text: string, words: string[]) {
  return words.every((w) => new RegExp(`(^|[^\\p{L}\\p{N}])${escape(w)}`, "iu").test(text));
}
