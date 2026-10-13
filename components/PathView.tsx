"use client";

import IntentLink from "./IntentLink";
import { markTopics, useInProgressTopics, useReadTopics } from "@/lib/progress";
import { readyTopics, type IndexEntry } from "@/lib/nextUp";
import StateLegend from "./StateLegend";

export type PathEntry = {
  slug: string;
  title: string;
  number: string;
  group: string;
  prerequisites: string[];
  /** Why each prerequisite comes first, by prerequisite id. */
  reasons?: Record<string, string>;
};

type Props = {
  /** All topics in curriculum order, carrying prerequisites and group. */
  entries: PathEntry[];
  /** Heading id so the homepage can label the view. */
  headingId?: string;
};

/**
 * A linear syllabus: topics in prerequisite order, grouped, each showing its
 * state (unread, ready, read), and what it builds on.
 * Reads the same browser read-state as the graph, so the two stay in step.
 * This is the graph's fallback and the mobile homepage (docs/ideas.md ideas 5, 6).
 */
export default function PathView({ entries, headingId = "path-heading" }: Props) {
  const read = useReadTopics();
  const inProgress = new Set(useInProgressTopics());
  const indexEntries: IndexEntry[] = entries.map((e) => ({ slug: e.slug, title: e.title, prerequisites: e.prerequisites }));
  const ready = new Set(readyTopics(indexEntries, read).map((e) => e.slug));
  const titleOf = new Map(entries.map((e) => [e.slug, e.title]));

  // Keep curriculum order, but render one block per group in GROUPS order.
  const groups: { name: string; items: PathEntry[] }[] = [];
  for (const e of entries) {
    const g = groups.find((x) => x.name === e.group) ?? (groups.push({ name: e.group, items: [] }), groups[groups.length - 1]);
    g.items.push(e);
  }

  // In progress (started, not finished) takes priority over ready, matching the map.
  const state = (slug: string) =>
    read.includes(slug) ? "read" : inProgress.has(slug) ? "progress" : ready.has(slug) ? "ready" : "unread";

  return (
    <section className="path" aria-labelledby={headingId}>
      <h2 id={headingId} className="visually-hidden">
        The path
      </h2>
      <p className="path-caption">
        Numbers show the suggested reading order across all topics. A topic&apos;s prerequisites are what really matter.
      </p>
      <StateLegend />
      {groups.map((g) => {
        const slugs = g.items.map((e) => e.slug);
        const readInGroup = slugs.filter((s) => read.includes(s)).length;
        const allRead = readInGroup === slugs.length;
        return (
          <div key={g.name} className="path-group" data-tour={g.name === groups[0].name ? "map" : undefined}>
            <h3 className="label path-group-name">
              <span>
                {g.name} · {slugs.length} of {entries.length} topics
              </span>
              <span className="path-group-count">
                {readInGroup} / {slugs.length} read
              </span>
              <button
                type="button"
                className="text-button label path-group-mark"
                aria-pressed={allRead}
                onClick={() => markTopics(slugs, !allRead)}
              >
                {allRead ? "Mark group unread" : "Mark group read"}
              </button>
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
                    <IntentLink href={`/topic/${e.slug}`} className="path-title">
                      {e.title}
                      {st === "ready" && <span className="path-ready-tag"> · ready</span>}
                      {st === "progress" && <span className="path-progress-tag"> · in progress</span>}
                    </IntentLink>
                    <span className="path-meta">
                      <span className="visually-hidden">
                        {st === "read" ? "read. " : st === "progress" ? "in progress. " : st === "ready" ? "ready to read. " : "unread. "}
                      </span>
                      {buildsOn.length > 0 ? (
                        e.reasons ? (
                          <>
                            <span className="path-builds">
                              <span className="path-meta-key">Builds on</span>
                              <span className="path-builds-names">{buildsOn.join(", ")}</span>
                            </span>
                            <span className="path-reasons">
                              {e.prerequisites.map((p) => (
                                <span key={p}>{e.reasons?.[p]}</span>
                              ))}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="path-meta-key">Builds on</span> {buildsOn.join(", ")}
                          </>
                        )
                      ) : (
                        <span className="path-meta-key">A starting point</span>
                      )}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        );
      })}
    </section>
  );
}
