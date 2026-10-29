/**
 * Every topic to read before `slug`, transitive, in an order that never puts a topic before one it builds on
 * (depth-first, prerequisites in their listed order, each topic once). Empty for a topic with no prerequisites.
 */
export function routeTo<T extends { slug: string; prerequisites: string[] }>(slug: string, topics: T[]): T[] {
  const by = new Map(topics.map((t) => [t.slug, t]));
  const done = new Set<string>([slug]); // marking `slug` first also stops a cycle back to it
  const out: T[] = [];
  const visit = (s: string) => {
    if (done.has(s)) return;
    done.add(s);
    const t = by.get(s);
    if (!t) return;
    t.prerequisites.forEach(visit);
    out.push(t);
  };
  by.get(slug)?.prerequisites.forEach(visit);
  return out;
}
