// Finds a topic's own glossary terms in its prose. Pure text in, segments out; the text itself is never altered.

export type GlossaryEntry = { term: string; definition: string; diagram?: string };
export type Segment = string | { text: string; entry: GlossaryEntry };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Anchor on /glossary. Terms repeat across topics ("replica" in two), so the topic is part of the id. */
export const glossaryId = (topicSlug: string, term: string) => `${topicSlug}-${slugify(term)}`;

/** "A / B" gives A and B; "name (xyz)" gives the full term, "name" and the short acronym "xyz". */
export function termVariants(term: string): string[] {
  const out = new Set<string>();
  for (const part of term.split(" / ")) {
    const p = part.trim();
    if (!p) continue;
    out.add(p);
    const m = p.match(/^(.*?)\s*\(([^)]*)\)$/);
    if (m) {
      if (m[1]) out.add(m[1]);
      if (/^[a-z0-9]{2,6}$/i.test(m[2])) out.add(m[2]);
    }
  }
  return [...out];
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Splits `text` into plain strings and matches. Whole words, case-insensitive, an optional plural "s"; the longest variant
 * wins where two overlap. Only the first match of each entry is marked; `seen` (one set per section) carries that across calls.
 */
export function markTerms(text: string, entries: GlossaryEntry[], seen: Set<string>): Segment[] {
  const byVariant = new Map<string, GlossaryEntry>();
  for (const e of entries) for (const v of termVariants(e.term)) if (!byVariant.has(v.toLowerCase())) byVariant.set(v.toLowerCase(), e);
  if (byVariant.size === 0) return [text];
  const variants = [...byVariant.keys()].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(?<![\\w-])(${variants.map(escape).join("|")})(?:s)?(?![\\w-])`, "gi");
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const entry = byVariant.get(m[1].toLowerCase())!;
    if (seen.has(entry.term)) continue;
    seen.add(entry.term);
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push({ text: m[0], entry });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}
