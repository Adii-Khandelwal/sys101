"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DURATION, prefersReducedMotion } from "@/lib/motion";
import { useReadTopics } from "@/lib/progress";
import { readCount, readyTopics, startVariant, type IndexEntry } from "@/lib/nextUp";
import { navigateWithTransition } from "./ViewTransitions";

/**
 * The one start line under the intro, from what has been read in this browser.
 * With nothing read it is "Start here"; once something is read it is "Next up".
 * The two never show together.
 */
export default function NextUp({ entries, learnSlugs }: { entries: IndexEntry[]; learnSlugs: string[] }) {
  const read = useReadTopics();
  const router = useRouter();
  const ready = readyTopics(entries, read);
  const done = readCount(entries, read);
  const [next, also] = ready;

  // Focus the topic's node on the map first, so the reader sees where it sits, then open it.
  const open = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const href = `/topic/${slug}`;
    router.prefetch(href);
    const node = document.querySelector<HTMLElement>(`.graph-node-link[href="${href}"]`);
    node?.focus({ preventScroll: true });
    const wait = node && !prefersReducedMotion() ? DURATION.slow * 2 : 0;
    window.setTimeout(() => navigateWithTransition(router, href), wait);
  };

  // Reveal the Map (if the reader is on Path), then scroll to it and focus the first node.
  const exploreMap = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("sys101:show-map"));
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".graph-stage")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".graph-node-link")?.focus({ preventScroll: true }));
    });
  };

  const count = (
    <span className="next-count label">
      {done} of {entries.length} topics read
    </span>
  );

  if (startVariant(read) === "first" && next) {
    return (
      <p className="next-up" data-pagefind-ignore>
        <span>
          Start here:{" "}
          <Link className="start-primary" href={`/topic/${next.slug}`}>
            {next.title}
          </Link>
        </span>
        {learnSlugs.includes(next.slug) && (
          <span className="next-also">
            New to this? <Link href={`/topic/${next.slug}/learn`}>Start from zero</Link>
          </span>
        )}
        {also && (
          <span className="next-also">
            Also ready: <Link href={`/topic/${also.slug}`}>{also.title}</Link>
          </span>
        )}
        <a className="start-secondary next-also" href="#the-map" onClick={exploreMap}>
          Explore the map
        </a>
        {count}
      </p>
    );
  }

  return (
    <p className="next-up" data-pagefind-ignore>
      {next ? (
        <>
          Next up:{" "}
          <Link href={`/topic/${next.slug}`} data-own-transition onClick={(e) => open(e, next.slug)}>
            {next.title}
          </Link>
          {also && (
            <span className="next-also">
              {" "}
              Also ready:{" "}
              <Link href={`/topic/${also.slug}`} data-own-transition onClick={(e) => open(e, also.slug)}>
                {also.title}
              </Link>
            </span>
          )}
        </>
      ) : (
        "All caught up"
      )}
      {count}
    </p>
  );
}
