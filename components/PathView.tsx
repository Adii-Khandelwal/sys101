"use client";

import Link from "next/link";
import { useReadTopics } from "@/lib/progress";
import { readyTopics, type IndexEntry } from "@/lib/nextUp";

export type PathEntry = {
  slug: string;
  title: string;
  number: string;
  group: string;
  posts: number;
  prerequisites: string[];
};

type Props = {
  /** All topics in curriculum order, carrying prerequisites and group. */
  entries: PathEntry[];
  /** Heading id so the homepage can label the view. */
  headingId?: string;
};

/**
 * A linear syllabus: topics in prerequisite order, grouped, each showing its
 * state (unread, ready, read), what it builds on, and how many posts it has.
 * Reads the same browser read-state as the graph, so the two stay in step.
 * This is the graph's fallback and the mobile homepage (docs/ideas.md ideas 5, 6).
 */
export default function PathView({ entries, headingId = "path-heading" }: Props) {
  const read = useReadTopics();
  const indexEntries: IndexEntry[] = entries.map((e) => ({ slug: e.slug, title: e.title, prerequisites: e.prerequisites }));
  const ready = new Set(readyTopics(indexEntries, read).map((e) => e.slug));
  const titleOf = new Map(entries.map((e) => [e.slug, e.title]));

  // Keep curriculum order, but render one block per group in GROUPS order.
  const groups: { name: string; items: PathEntry[] }[] = [];
  for (const e of entries) {
    const g = groups.find((x) => x.name === e.group) ?? (groups.push({ name: e.group, items: [] }), groups[groups.length - 1]);
    g.items.push(e);
  }

  const state = (slug: string) => (read.includes(slug) ? "read" : ready.has(slug) ? "ready" : "unread");

  return (
    <section className="path" aria-labelledby={headingId}>
      <h2 id={headingId} className="visually-hidden">
        The path
      </h2>
      {groups.map((g) => (
        <div key={g.name} className="path-group">
          <h3 className="label path-group-name">
            <span>{g.name}</span>
          </h3>
          <ol className="path-list">
            {g.items.map((e) => {
              const st = state(e.slug);
              const buildsOn = e.prerequisites.map((p) => titleOf.get(p) ?? p);
              return (
                <li key={e.slug} className={`path-item is-${st}`}>
                  <span className="path-number" aria-hidden="true">
                    {e.number}
                  </span>
                  <span className="path-rail" aria-hidden="true">
                    <span className="path-marker" />
                  </span>
                  <span className="path-body">
                    <Link href={`/topic/${e.slug}`} className="path-title">
                      {e.title}
                      {st === "ready" && <span className="path-ready-tag"> · ready</span>}
                    </Link>
                    <span className="path-meta">
                      <span className="visually-hidden">
                        {st === "read" ? "read. " : st === "ready" ? "ready to read. " : "unread. "}
                      </span>
                      {buildsOn.length > 0 ? (
                        <>
                          <span className="path-meta-key">Builds on</span> {buildsOn.join(", ")}
                        </>
                      ) : (
                        <span className="path-meta-key">A starting point</span>
                      )}
                      <span className="path-meta-dot" aria-hidden="true">
                        ·
                      </span>
                      {e.posts} {e.posts === 1 ? "post" : "posts"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
