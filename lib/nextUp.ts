// Which topic to suggest next, from the read list and what was started. Pure, so it is easy to test.

export type IndexEntry = { slug: string; title: string; prerequisites: string[] };

/** How many topics build on this one, directly or further down the map. */
function leadsTo(slug: string, entries: IndexEntry[]) {
  const seen = new Set<string>();
  const stack = [slug];
  while (stack.length) {
    const s = stack.pop()!;
    for (const e of entries) {
      if (e.prerequisites.includes(s) && !seen.has(e.slug)) {
        seen.add(e.slug);
        stack.push(e.slug);
      }
    }
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

import { summary, topicOf, type LessonMeta, type Progress } from "./lessonStore";

/** A topic the reader has started but not finished, with where they are in it. */
export type Started = { slug: string; title: string; done: number; total: number; target: string };

export type HomeAction =
  /** Nothing read and nothing started: the map's first topic. */
  | { kind: "start" }
  /** Something started: continue it. `others` are the other started topics, most recent first; `after` is the next ready topic. */
  | { kind: "continue"; topic: Started; others: Started[]; after: IndexEntry | null }
  /** Something read, nothing started: the best ready topic, and the second best. */
  | { kind: "next"; next: IndexEntry; also: IndexEntry | null }
  | { kind: "done" };

/**
 * What the homepage's one button should point at. A topic the reader deliberately started (a section marked done or a quiz
 * question answered) beats a topic that is merely ready: it is what they are in the middle of. With several started, the one
 * with the latest deliberate change wins (`updated` is stamped only on such changes), then the one furthest along, then course
 * order. Started topics that are not in the course any more, or have no lesson meta, are ignored.
 */
export function homeAction(
  entries: IndexEntry[],
  metas: LessonMeta[],
  progress: Progress,
  read: readonly string[],
  updated: Record<string, string>,
): HomeAction {
  const metaOf = new Map(metas.map((m) => [m.slug, m]));
  const started: Started[] = entries
    .filter((e) => !read.includes(e.slug) && metaOf.has(e.slug))
    .filter((e) => {
      const t = topicOf(progress, e.slug);
      return t.done.length > 0 || Object.keys(t.answers).length > 0;
    })
    .map((e) => {
      const sum = summary(progress, metaOf.get(e.slug)!);
      return { slug: e.slug, title: e.title, done: sum.done, total: sum.total, target: sum.target };
    })
    .sort((a, b) => {
      const ua = updated[a.slug] ?? "";
      const ub = updated[b.slug] ?? "";
      return ua < ub ? 1 : ua > ub ? -1 : b.done - a.done; // equal on both: the stable sort keeps course order
    });
  const ready = readyTopics(entries, read);
  if (started.length > 0) {
    const [topic, ...others] = started;
    return { kind: "continue", topic, others, after: ready.find((e) => e.slug !== topic.slug) ?? null };
  }
  if (read.length === 0) return { kind: "start" };
  return ready[0] ? { kind: "next", next: ready[0], also: ready[1] ?? null } : { kind: "done" };
}
