"use client";

import { useRef, useState } from "react";
import IntentLink from "./IntentLink";
import { markTopics, useHalves, useInProgressTopics, useReadTopics } from "@/lib/progress";
import { readyTopics, type IndexEntry } from "@/lib/nextUp";
import type { LessonMeta } from "@/lib/lessonStore";
import { tallyPath as tally } from "@/lib/tally";
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

/** A group longer than this shows its first topics, then a button for the rest. */
const COLLAPSED_SHOWS = 5;

type Props = {
  /** All topics in curriculum order, carrying prerequisites and group. */
  entries: PathEntry[];
  /** Heading id so the homepage can label the view. */
  headingId?: string;
  /** Posts per topic, for the half marks. */
  metas?: LessonMeta[];
};

const NO_METAS: LessonMeta[] = [];

/**
 * A linear syllabus: topics in prerequisite order, grouped, each showing its
 * state (unread, ready, read), and what it builds on.
 * Reads the same browser read-state as the graph, so the two stay in step.
 * This is the graph's fallback and the mobile homepage (docs/ideas.md ideas 5, 6).
 */
export default function PathView({ entries, headingId = "path-heading", metas = NO_METAS }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const blocks = useRef<Record<string, HTMLDivElement | null>>({});
  const read = useReadTopics();
  const inProgress = new Set(useInProgressTopics());
  const halves = useHalves(metas);
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
    read.includes(slug) ? "read" : halves[slug] === "concept" ? "concept" : halves[slug] === "posts" ? "posts" : inProgress.has(slug) ? "progress" : ready.has(slug) ? "ready" : "unread";

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
        const long = g.items.length > COLLAPSED_SHOWS;
        const open = !long || !!expanded[g.name];
        const listId = `path-list-${g.name.toLowerCase().replace(/\W+/g, "-")}`;
        const toggle = () => {
          setExpanded((x) => ({ ...x, [g.name]: !open }));
          // Collapsing from far down the group would leave the page below it: bring the group's heading back into view.
          if (open) {
            requestAnimationFrame(() => {
              const el = blocks.current[g.name];
              if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
            });
          }
        };
        return (
          <div
            key={g.name}
            ref={(el) => {
              blocks.current[g.name] = el;
            }}
            className="path-group"
            data-collapsed={!open}
            data-tour={g.name === groups[0].name ? "map" : undefined}
          >
            <h3 className="label path-group-name">
              <span>
                {g.name}, {slugs.length} of {entries.length} topics
              </span>
              <span className="path-group-count">
                <span className="visually-hidden">
                  , {readInGroup} of {slugs.length} read
                </span>
                <svg className="path-tally" width={tally(readInGroup).width} height="26" aria-hidden="true">
                  <path d={tally(readInGroup).d} />
                </svg>
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
            <ol className="path-list" id={listId}>
            {g.items.map((e, i) => {
              const st = state(e.slug);
              const buildsOn = e.prerequisites.map((p) => titleOf.get(p) ?? p);
              return (
                <li key={e.slug} className={`path-item is-${st}`} data-extra={i >= COLLAPSED_SHOWS || undefined}>
                  <span className="path-number" aria-hidden="true">
                    {e.number}
                  </span>
                  <span className="path-rail" aria-hidden="true">
                    <span className="path-marker" />
                  </span>
                  <span className="path-body">
                    <IntentLink href={`/topic/${e.slug}`} className="path-title">
                      {e.title}
                      {st === "ready" && <span className="path-ready-tag">, ready</span>}
                      {st === "progress" && <span className="path-progress-tag">, in progress</span>}
                      {(st === "concept" || st === "posts") && <span className="path-progress-tag">, {st} read</span>}
                    </IntentLink>
                    <span className="path-meta">
                      <span className="visually-hidden">
                        {st === "read" ? "read. " : st === "progress" ? "in progress. " : st === "ready" ? "ready to read. " : "unread. "}
                      </span>
                      {buildsOn.length > 0 ? (
                        e.reasons ? (
                          <>
                            <span className="path-builds">
                              <span className="path-meta-key">Read first</span>
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
                            <span className="path-meta-key">Read first</span> {buildsOn.join(", ")}
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
            {long && (
              <div className="path-more">
                <button type="button" className="text-button label" aria-expanded={open} aria-controls={listId} onClick={toggle}>
                  {open ? "Show fewer" : `Show ${g.items.length - COLLAPSED_SHOWS} more`}
                </button>
              </div>
            )}
        </div>
        );
      })}
    </section>
  );
}
