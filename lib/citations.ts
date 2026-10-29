// Finds where lesson prose already names a source's company, so a reference mark can follow it. Text is never altered.

export type Cite = { company: string; n: number };
export type CiteSegment = string | { n: number };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Posts whose company is the only one of that name in the topic: a name shared by two posts could mean either, so it gets no mark. n is the post's place in the references list. */
export function citable(posts: { company: string }[]): Cite[] {
  return posts.flatMap((p, i) => (posts.filter((q) => q.company === p.company).length === 1 ? [{ company: p.company, n: i + 1 }] : []));
}

/** Splits `text` after the first mention of each company not yet in `seen` (one set per section); a mark goes in at each split. */
export function markCitations(text: string, cites: Cite[], seen: Set<number>): CiteSegment[] {
  const open = cites.filter((c) => !seen.has(c.n));
  if (open.length === 0) return [text];
  const re = new RegExp(`(?<![\\w-])(${open.map((c) => escape(c.company)).join("|")})(?![\\w-])`, "g");
  const out: CiteSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const c = open.find((x) => x.company === m[1])!;
    if (seen.has(c.n)) continue;
    seen.add(c.n);
    out.push(text.slice(last, m.index! + m[0].length), { n: c.n });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
