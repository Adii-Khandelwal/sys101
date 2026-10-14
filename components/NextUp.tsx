"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DURATION, prefersReducedMotion } from "@/lib/motion";
import { useAllProgress } from "@/lib/progress";
import type { LessonMeta } from "@/lib/lessonStore";
import { homeAction, readCount, type IndexEntry, type Started } from "@/lib/nextUp";
import { navigateWithTransition } from "./ViewTransitions";

// Not imported from lib/lessonOutline, which reads topic files and so cannot go in a client bundle.
const SECTION_NAME = new Map<string, string>([
  ["why", "Why it exists"],
  ["model", "Mental model"],
  ["how", "How it works"],
  ["example", "Worked example"],
  ["mistakes", "Common mistakes"],
  ["check", "Check yourself"],
]);
/** The sections a reader can still be on are the concept sections, the quiz, or a post (any other id). */
const sectionName = (unit: string) => SECTION_NAME.get(unit) ?? "How companies use it";
const MORE_SHOWN = 2;

/**
 * The homepage's one button, from this browser's progress. Something started beats something merely ready, because it is
 * what the reader is in the middle of: "Continue" (or "Finish" when only a couple of units are left) lands on the first
 * unfinished section. Nothing started and nothing read: "Start with" the map's first topic. Otherwise "Next up".
 * A quiet line under it names the other started topics, or else the topic after this one. See lib/nextUp.ts homeAction.
 */
export default function NextUp({
  entries,
  metas,
  start,
}: {
  entries: IndexEntry[];
  metas: LessonMeta[];
  start: { slug: string; title: string; minutes: number };
}) {
  const { progress, updated, read } = useAllProgress();
  const router = useRouter();
  const action = homeAction(entries, metas, progress, read, updated);

  // Focus the topic's node on the map first, so the reader sees where it sits, then open it.
  const open = (e: React.MouseEvent<HTMLAnchorElement>, slug: string, hash = "") => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const href = `/topic/${slug}`;
    router.prefetch(href);
    const node = document.querySelector<HTMLElement>(`.graph-node-link[href="${href}"]`);
    node?.focus({ preventScroll: true });
    const wait = node && !prefersReducedMotion() ? DURATION.slow * 2 : 0;
    window.setTimeout(() => navigateWithTransition(router, href + hash), wait);
  };
  const link = (slug: string, title: string, hash = "") => (
    <Link href={`/topic/${slug}${hash}`} data-own-transition onClick={(e) => open(e, slug, hash)}>
      {title}
    </Link>
  );
  const progressOf = (t: Started) => (
    <>
      {link(t.slug, t.title, `#${t.target}`)} <span className="keep">({t.done} of {t.total})</span>
    </>
  );

  if (action.kind === "start") {
    return (
      <p className="start-cta" data-pagefind-ignore>
        <Link className="cta" href={`/topic/${start.slug}`} data-own-transition onClick={(e) => open(e, start.slug)}>
          Start with {start.title}
        </Link>
        <span className="label">Topic 01 · ~{start.minutes} min read</span>
      </p>
    );
  }

  if (action.kind === "continue") {
    const { topic, others, after } = action;
    const verb = topic.total - topic.done <= 2 ? "Finish" : "Continue";
    const shown = others.slice(0, MORE_SHOWN);
    return (
      <div className="next-up" data-pagefind-ignore>
        <p className="start-cta">
          <Link
            key={topic.slug}
            className="cta fade-swap"
            href={`/topic/${topic.slug}#${topic.target}`}
            data-own-transition
            onClick={(e) => open(e, topic.slug, `#${topic.target}`)}
          >
            {verb}: {topic.title}
          </Link>
          <span key={`${topic.slug}-${topic.done}`} className="label fade-swap">
            {sectionName(topic.target)} · {topic.done} of {topic.total} done
          </span>
        </p>
        {shown.length > 0 ? (
          <p className="next-also">
            Also in progress:{" "}
            {shown.map((t, i) => (
              <span key={t.slug}>
                {i > 0 && ", "}
                {progressOf(t)}
              </span>
            ))}
            {others.length > shown.length && ` and ${others.length - shown.length} more`}
          </p>
        ) : (
          after && <p className="next-also">After it: {link(after.slug, after.title)}</p>
        )}
      </div>
    );
  }

  const count = (
    <span key={readCount(entries, read)} className="label fade-swap">
      {readCount(entries, read)} of {entries.length} topics read
    </span>
  );
  return (
    <div className="next-up" data-pagefind-ignore>
      <p className="start-cta">
        {action.kind === "next" ? (
          <Link key={action.next.slug} className="cta fade-swap" href={`/topic/${action.next.slug}`} data-own-transition onClick={(e) => open(e, action.next.slug)}>
            Next up: {action.next.title}
          </Link>
        ) : (
          <span className="next-done">All caught up</span>
        )}
        {count}
      </p>
      {action.kind === "next" && action.also && <p className="next-also">Also ready: {link(action.also.slug, action.also.title)}</p>}
    </div>
  );
}
