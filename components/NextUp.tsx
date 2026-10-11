"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DURATION, prefersReducedMotion } from "@/lib/motion";
import { useReadTopics } from "@/lib/progress";
import { readCount, readyTopics, type IndexEntry } from "@/lib/nextUp";
import { navigateWithTransition } from "./ViewTransitions";

/** "Next up: <topic>" under the tagline, from what has been read in this browser. */
export default function NextUp({ entries }: { entries: IndexEntry[] }) {
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
      <span className="next-count label">
        {done} of {entries.length} topics read
      </span>
    </p>
  );
}
