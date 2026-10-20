"use client";

import { glideToSection } from "@/lib/glide";
import { prefersReducedMotion } from "@/lib/motion";
import { useEffect, useRef, useState } from "react";

export type LearnEntry = { id: string; name: string };

/**
 * Left rail for a "Start from zero" page: a reading-progress bar and the page
 * contents, with the current section highlighted and a marker that slides to
 * it. Progress is how far the reader has moved through the sections, computed
 * from scroll position only. It never touches the reading-progress store, so
 * learn pages stay untracked (.claude/rules/learn-pages.md: learn pages never touch progress).
 */
export default function LearnRail({
  entries,
  variant = "rail",
  scope = "page",
}: {
  entries: LearnEntry[];
  variant?: "rail" | "line";
  /** "section": the bar restarts at 0 whenever the next entry's section begins, instead of spanning the page. */
  scope?: "page" | "section";
}) {
  const [index, setIndex] = useState(0);
  // The bar moves by a ref write, not React state, so a scroll tick re-renders only when the section or the whole percent changes.
  const [percent, setPercent] = useState(0);
  const fill = useRef<HTMLSpanElement>(null);
  const ids = entries.map((e) => e.id).join();
  const total = entries.length;

  useEffect(() => {
    const els = ids
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    const pick = () => {
      // Measure against a line just below the sticky site header, so the first
      // section counts as current while you are still at the top of the page.
      const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      const line = header + 24;
      let i = 0;
      els.forEach((el, n) => {
        if (el.getBoundingClientRect().top <= line) i = n;
      });
      // Smooth reading progress: how far the page is scrolled through its
      // scrollable range, 0 at the top and 1 at the bottom.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      let r = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
      if (scope === "section" && els.length) {
        const top = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
        const start = top(els[i]);
        const next = els[i + 1];
        const end = next ? top(next) : start + els[i].offsetHeight;
        r = end > start ? Math.min(1, Math.max(0, (window.scrollY + line - start) / (end - start))) : 1;
      }
      // At the very bottom the last short sections never cross the line, so
      // snap the current section to the final one once scrolled to the end.
      const atBottom = max > 0 && window.scrollY / max >= 0.999;
      setIndex(atBottom ? els.length - 1 : i);
      const shown = atBottom ? 1 : r;
      if (fill.current) fill.current.style.transform = `scaleX(${shown})`;
      setPercent(Math.round(shown * 100));
    };
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
  }, [ids, scope]);

  const current = entries[index]?.id;
  const done = index + 1;

  // One marker slides (transform only) to the current row.
  const list = useRef<HTMLOListElement>(null);
  const [markerY, setMarkerY] = useState<number | null>(null);
  useEffect(() => {
    const row = list.current?.querySelector<HTMLElement>(`[data-id="${current}"]`);
    setMarkerY(row ? row.offsetTop : null);
    // A long list scrolls inside the rail: bring the current row into view there, never moving the page.
    const box = list.current?.closest<HTMLElement>(".lesson-rail");
    if (row && box && box.scrollHeight > box.clientHeight) {
      const top = row.offsetTop - box.clientHeight / 2;
      box.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }, [current]);

  /** Jump to a section, clear of the sticky header, and move focus to its heading. */
  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    void glideToSection(target);
    history.replaceState(null, "", `#${id}`);
  };

  const what = scope === "section" ? "Section" : "Page";
  const label = `${what} scrolled: ${percent}%. Section ${done} of ${total}: ${entries[index]?.name ?? ""}`;

  if (variant === "line") {
    return (
      <p className="progress-line label" aria-live="polite" data-pagefind-ignore>
        <span className="learn-progress-track" aria-hidden="true">
          <span ref={fill} className="learn-progress-fill" />
        </span>
        <span className="visually-hidden">{label}</span>
        <a href={`#${current}`} onClick={(e) => current && go(e, current)}>
          Contents
        </a>
      </p>
    );
  }

  return (
    <nav className="lesson-rail" aria-label="Contents of this page" data-pagefind-ignore>
      <div className="progress-head" aria-live="polite">
        <div className="learn-progress-track" tabIndex={0} aria-label={label}>
          <span ref={fill} className="learn-progress-fill" />
        </div>
      </div>
      <ol ref={list}>
        {markerY !== null && (
          <span className="rail-marker" aria-hidden="true" style={{ transform: `translateY(${markerY}px)` }} />
        )}
        {entries.map((e) => (
          <li key={e.id} data-id={e.id} className={e.id === current ? "is-current" : undefined}>
            <a href={`#${e.id}`} aria-current={e.id === current ? "location" : undefined} onClick={(ev) => go(ev, e.id)}>
              {e.name}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
