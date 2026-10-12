"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

export type LearnEntry = { id: string; name: string };

/**
 * Left rail for a "Start from zero" page: a reading-progress bar and the page
 * contents, with the current section highlighted and a marker that slides to
 * it. Progress is how far the reader has moved through the sections, computed
 * from scroll position only. It never touches the reading-progress store, so
 * learn pages stay untracked (CLAUDE.md: learn pages never touch progress).
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
  const [ratio, setRatio] = useState(0);
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
      setRatio(atBottom ? 1 : r);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [ids, scope]);

  const current = entries[index]?.id;
  const done = index + 1;
  const percent = Math.round(ratio * 100);

  // One marker slides (transform only) to the current row.
  const list = useRef<HTMLOListElement>(null);
  const [markerY, setMarkerY] = useState<number | null>(null);
  useEffect(() => {
    const row = list.current?.querySelector<HTMLElement>(`[data-id="${current}"]`);
    setMarkerY(row ? row.offsetTop : null);
  }, [current]);

  /** Scroll smoothly to a section, clear of the sticky header, and move focus to its heading. */
  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - header - 16;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    const heading = target.querySelector<HTMLElement>("h2, h3") ?? target;
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    history.replaceState(null, "", `#${id}`);
  };

  const what = scope === "section" ? "Section" : "Page";
  const label = `${what} scrolled: ${percent}%. Section ${done} of ${total}: ${entries[index]?.name ?? ""}`;

  if (variant === "line") {
    return (
      <p className="progress-line label" aria-live="polite" data-pagefind-ignore>
        <span className="learn-progress-track" aria-hidden="true">
          <span className="learn-progress-fill" style={{ transform: `scaleX(${ratio})` }} />
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
        <p className="label">
          {what} scrolled:{" "}
          <span key={percent} className="fade-swap">
            {percent}%
          </span>
        </p>
        <div className="learn-progress-track" tabIndex={0} aria-label={label}>
          <span className="learn-progress-fill" style={{ transform: `scaleX(${ratio})` }} />
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
