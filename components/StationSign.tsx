"use client";

import Link from "next/link";
import { useAllProgress } from "@/lib/progress";
import type { LessonMeta } from "@/lib/lessonStore";
import { homeAction, type IndexEntry } from "@/lib/nextUp";
import { firstSentence, neighbours, nextUpSlug, signSlug } from "@/lib/stationSign";

export type SignTopic = { slug: string; title: string; group: string; number: string; minutes: number; concept: string };

/**
 * The station sign under the map: a reversed-out bar with the line badge and the topic, then Read first, the one-line summary
 * and Makes possible. It shows the topic the pointer or keyboard is on, else the Next up topic. A plain region: the station's
 * own link already names itself, so nothing here is announced.
 */
export default function StationSign({
  topics,
  edges,
  entries,
  metas,
  active,
}: {
  topics: SignTopic[];
  edges: { from: string; to: string }[];
  entries: IndexEntry[];
  metas: LessonMeta[];
  active: string | null;
}) {
  const { progress, updated, read } = useAllProgress();
  const slug = signSlug(active, nextUpSlug(homeAction(entries, metas, progress, read, updated), topics[0].slug), topics[0].slug);
  const by = new Map(topics.map((t) => [t.slug, t]));
  const t = by.get(slug) ?? topics[0];
  const { before, after } = neighbours(t.slug, edges, topics.map((x) => x.slug));
  const links = (slugs: string[]) =>
    slugs.map((s) => (
      <li key={s}>
        <Link href={`/topic/${s}`}>{by.get(s)?.title ?? s}</Link>
      </li>
    ));
  return (
    <section className="station-sign" aria-label="Selected topic" data-pagefind-ignore>
      <div className="sign-bar">
        <span className="sign-badge">{t.group}</span>
        <p className="sign-title">{t.title}</p>
        {active && <span className="sign-number">Topic {t.number}</span>}
      </div>
      <div className="sign-body">
        <div className="sign-side">
          <p className="sign-label">Read first</p>
          {before.length > 0 ? <ul>{links(before)}</ul> : <p>Nothing. Begin here.</p>}
        </div>
        <div className="sign-mid">
          <p className="sign-summary">{firstSentence(t.concept)}</p>
          {/* Only for a station the reader is on: otherwise the Next up button above already carries the number, time and link. */}
          {active && (
            <>
              <p className="sign-meta">~{t.minutes} min read</p>
              <Link className="sign-open" href={`/topic/${t.slug}`}>
                Read this topic
              </Link>
            </>
          )}
        </div>
        <div className="sign-side sign-after">
          <p className="sign-label">Makes possible</p>
          {after.length > 0 ? <ul>{links(after)}</ul> : <p>End of the line.</p>}
        </div>
      </div>
    </section>
  );
}
