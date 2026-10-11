// Which topics to suggest next, from the read list. Pure, so it is easy to test.

export type IndexEntry = { slug: string; title: string; prerequisites: string[] };

/** How many topics build on this one, directly or further down the map. */
function leadsTo(slug: string, entries: IndexEntry[]) {
  const seen = new Set<string>();
  const stack = [slug];
  while (stack.length) {
    const s = stack.pop()!;
    for (const e of entries) if (e.prerequisites.includes(s) && !seen.has(e.slug)) seen.add(e.slug), stack.push(e.slug);
  }
  return seen.size;
}

/**
 * Unread topics whose prerequisites are all read, best first: topics that
 * continue something already read before fresh starting points, then topics
 * that open up more of the map, then index order. Empty when all are read.
 */
export function readyTopics(entries: IndexEntry[], read: readonly string[]) {
  const ready = entries.filter((e) => !read.includes(e.slug) && e.prerequisites.every((p) => read.includes(p)));
  const continues = (e: IndexEntry) => (e.prerequisites.length > 0 ? 1 : 0);
  return ready
    .map((e, i) => ({ e, i, c: continues(e), n: leadsTo(e.slug, entries) }))
    .sort((a, b) => b.c - a.c || b.n - a.n || a.i - b.i)
    .map((x) => x.e);
}

export function readCount(entries: IndexEntry[], read: readonly string[]) {
  return entries.filter((e) => read.includes(e.slug)).length;
}

/** Nothing read yet ("first": no link, the map is the way in) or some progress ("progress": Next up). */
export function startVariant(read: readonly string[]): "first" | "progress" {
  return read.length === 0 ? "first" : "progress";
}

/** A topic the reader was partway through, best to resume. */
export type ResumeTarget = { slug: string; section: string };

/**
 * The topic to offer as "Continue where you left off": one that is not finished
 * yet, has a last-viewed section past the start, and was touched most recently
 * (by the per-topic change date). Returns null when there is nothing to resume.
 */
export function resumeTarget(
  topics: Record<string, { last?: string }>,
  updated: Record<string, string>,
  read: readonly string[],
): ResumeTarget | null {
  const candidates = Object.entries(topics)
    .filter(([slug, t]) => t.last && t.last !== "why" && !read.includes(slug))
    .map(([slug, t]) => ({ slug, section: t.last!, when: updated[slug] ?? "" }))
    .sort((a, b) => (a.when < b.when ? 1 : a.when > b.when ? -1 : a.slug.localeCompare(b.slug)));
  return candidates[0] ? { slug: candidates[0].slug, section: candidates[0].section } : null;
}
