"use client";

import { useEffect, useMemo, useState } from "react";
import { useLesson } from "@/lib/progress";
import { markVisited, unitStatus, type LessonMeta } from "@/lib/lessonStore";
import { CompactProgress } from "./LessonTrackers";

type Entry = { id: string; name: string; tracked: boolean };

/**
 * Left rail: the progress header, then every section. Done units get a
 * small filled square (and "(done)" for screen readers); the current section
 * is in the accent color. Scrolling still records visits and the resume point.
 */
export default function LessonRail({ meta, entries }: { meta: LessonMeta; entries: Entry[] }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(() => meta, [meta.slug, meta.postIds.join(), meta.correct.join()]);
  const { progress, update } = useLesson(m);
  const [current, setCurrent] = useState(entries[0]?.id);
  const ids = entries.map((e) => e.id).join();

  useEffect(() => {
    const els = ids
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    const pick = () => {
      // The current section is the last one whose top has passed a third of the way down the screen.
      const line = window.innerHeight / 3;
      let id = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) id = el.id;
      setCurrent(id);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [ids]);

  // Record visits and the resume point when the current tracked unit changes.
  const tracked = entries.filter((e) => e.tracked).map((e) => e.id).join();
  useEffect(() => {
    if (current && tracked.split(",").includes(current)) update((p) => markVisited(p, m.slug, current));
  }, [current, tracked, m.slug, update]);

  return (
    <nav className="lesson-rail" aria-label="Sections on this page" data-pagefind-ignore>
      <CompactProgress meta={m} />
      <ol>
        {entries.map((e) => {
          const status = e.tracked ? unitStatus(progress, m, e.id) : null;
          return (
            <li key={e.id} className={e.id === current ? "is-current" : undefined}>
              <a href={`#${e.id}`} aria-current={e.id === current ? "location" : undefined}>
                {status === "done" && <span className="status is-done" aria-hidden="true" />}
                {e.name}
                {status === "done" && <span className="visually-hidden"> (done)</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
