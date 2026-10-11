"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DURATION, prefersReducedMotion } from "@/lib/motion";
import { useReadTopics } from "@/lib/progress";
import { readCount, readyTopics, startVariant, type IndexEntry } from "@/lib/nextUp";
import { navigateWithTransition } from "./ViewTransitions";

/**
 * The line under the intro, from what has been read in this browser.
 * With nothing read it renders nothing (the map is the way in); once something
 * is read it shows "Next up" and the count.
 */
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

  const count = (
    <span key={done} className="next-count label fade-swap">
      {done} of {entries.length} topics read
    </span>
  );

  // Nothing read yet: the map below is the way in, so nothing shows here.
  if (startVariant(read) === "first") return null;

  return (
    <p className="next-up" data-pagefind-ignore>
      {next ? (
        <span key={next.slug} className="fade-swap">
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
        </span>
      ) : (
        "All caught up"
      )}
      {count}
    </p>
  );
}
