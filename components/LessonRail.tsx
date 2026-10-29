"use client";

import { glideToSection } from "@/lib/glide";
import { prefersReducedMotion } from "@/lib/motion";
import CompanyLogo from "./CompanyLogo";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLesson } from "@/lib/progress";
import { markVisited, unitStatus, type LessonMeta } from "@/lib/lessonStore";
import { CompactProgress } from "./LessonTrackers";

type Entry = { id: string; name: string; tracked: boolean; company?: string };

/**
 * Left rail drawn as a short metro line: the progress header, then every section as a station on a vertical line. State is shape:
 * a done unit is a filled disc (and "(done)" for screen readers), a section not yet done is hollow, and the current section
 * has a ring round it with a second-ink dot. Scrolling still records visits and the resume point.
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
    // One layout read per frame, however many scroll events arrive.
    let frame = 0;
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), pick()));
    };
    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  // Record visits and the resume point when the current tracked unit changes.
  const tracked = entries.filter((e) => e.tracked).map((e) => e.id).join();
  useEffect(() => {
    // A guided tour scrolls through the page for the reader; that is not reading, so it leaves no trace.
    if (document.documentElement.dataset.touring) return;
    if (current && tracked.split(",").includes(current)) update((p) => markVisited(p, m.slug, current));
  }, [current, tracked, m.slug, update]);

  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const row = list.current?.querySelector<HTMLElement>(`[data-id="${current}"]`);
    // A long list scrolls inside the rail: bring the current row into view there, never moving the page.
    const box = list.current?.closest<HTMLElement>(".lesson-rail");
    if (row && box && box.scrollHeight > box.clientHeight) {
      box.scrollTo({ top: row.offsetTop - box.clientHeight / 2, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }, [current]);

  /** Jump to a section, clear of the top, and move focus to its heading without a jump. */
  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    void glideToSection(target);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav className="lesson-rail" aria-label="Sections on this page" data-pagefind-ignore>
      <CompactProgress meta={m} />
      <ol ref={list}>
        {entries.map((e) => {
          const status = e.tracked ? unitStatus(progress, m, e.id) : null;
          return (
            <li key={e.id} data-id={e.id} className={`${e.id === current ? "is-current" : ""}${status === "done" ? " is-done" : ""}` || undefined}>
              <a href={`#${e.id}`} aria-current={e.id === current ? "location" : undefined} onClick={(ev) => go(ev, e.id)}>
                <span className="station" aria-hidden="true" />
                {e.company && <CompanyLogo name={e.company} size="sm" bare />}
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
