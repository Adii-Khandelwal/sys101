import { columns, transitiveReduction } from "./graph";
import type { Topic } from "./topics";

/**
 * The one reading order for all topics: the map's columns (prerequisite depth, then position in the
 * column, itself fixed by barycenter sweeps with ties kept in input order), read left to right.
 * The Map index, Path view, Next up tie-break and sitemap all use it. See .claude/rules/homepage.md.
 */
export function topicOrder<T extends Pick<Topic, "slug" | "title" | "prerequisites">>(topics: T[]): T[] {
  const edges = topics.flatMap((t) => t.prerequisites.map((p) => ({ from: p, to: t.slug })));
  return columns(topics, transitiveReduction(edges)).flat();
}

/** Reading-order number of each topic, 1 to N. */
export function topicNumbers(ordered: { slug: string }[]): Map<string, number> {
  return new Map(ordered.map((t, i) => [t.slug, i + 1]));
}

/** "01", "02", ...: how a number is shown on the page. */
export const formatNumber = (n: number) => String(n).padStart(2, "0");
