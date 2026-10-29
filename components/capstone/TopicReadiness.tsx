"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useReadTopics } from "@/lib/progress";

type Item = { slug: string; title: string; role?: string };

const noop = () => () => {};
/** False in the server HTML and on the first client render, true after, so the page never claims progress it has not read. */
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

/**
 * Readiness from the existing read flags. `list` shows each topic with its role and a word for its state; `summary`
 * shows only "N of M topics done". Shape (filled or empty box) and text carry the state, not colour.
 */
export default function TopicReadiness({ items, mode }: { items: Item[]; mode: "list" | "summary" }) {
  const read = useReadTopics();
  const mounted = useMounted();
  const done = items.filter((i) => read.includes(i.slug)).length;
  const count = mounted ? `${done} of ${items.length} topics done` : `Builds on ${items.length} ${items.length === 1 ? "topic" : "topics"}`;
  if (mode === "summary") {
    return (
      <p className="cap-ready label" aria-live="polite">
        <span className="cap-boxes" aria-hidden="true">
          {items.map((i) => (
            <span key={i.slug} className={mounted && read.includes(i.slug) ? "cap-box is-done" : "cap-box"} />
          ))}
        </span>
        {count}
      </p>
    );
  }
  return (
    <>
      <p className="cap-ready label" aria-live="polite">
        {count}
      </p>
      <ul className="cap-topics">
        {items.map((i) => {
          const isDone = mounted && read.includes(i.slug);
          return (
            <li key={i.slug}>
              <span className={isDone ? "cap-box is-done" : "cap-box"} aria-hidden="true" />
              <div>
                <Link href={`/topic/${i.slug}`}>{i.title}</Link>
                {i.role && <p>{i.role}</p>}
              </div>
              {mounted && <span className="label">{isDone ? "Done" : "Not yet"}</span>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
