"use client";

import { useEffect, useRef, useState } from "react";
import { StripBackToTop } from "@/components/BackToTop";
import { glideToSection } from "@/lib/glide";
import { RAIL_SECTIONS, TRACKED, railDone, railStates } from "@/lib/capstoneRail";
import { useStoredChoices } from "./useStoredChoices";

/**
 * Section tracker, built on the topic rail's classes (.lesson-rail, .progress-head, .progress-bar, .status).
 * From 1180px a fixed left rail: a count and segmented bar, then a station per section, filled once done, and the state word. Below that, the same one sticky line the topic page has, with "Back to top"; the section name opens the list.
 * The current section comes from an IntersectionObserver on the top third of the screen. Real anchors, so it works without JavaScript.
 */
export default function CapstoneRail({ slug, decisionIds, quizLength }: { slug: string; decisionIds: string[]; quizLength: number }) {
  const [picks] = useStoredChoices(slug);
  const states = railStates(picks, decisionIds, quizLength);
  const done = railDone(picks, decisionIds, quizLength);
  const [current, setCurrent] = useState<string>(RAIL_SECTIONS[0].id);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const els = RAIL_SECTIONS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id);
          else inBand.delete(e.target.id);
        }
        // The last section in page order that touches the top third is the current one; with none there, keep the last.
        const last = [...RAIL_SECTIONS].reverse().find((s) => inBand.has(s.id));
        if (last) setCurrent(last.id);
      },
      { rootMargin: "0px 0px -66% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    setOpen(false);
    if (!target) return;
    e.preventDefault();
    void glideToSection(target);
    history.replaceState(null, "", `#${id}`);
  };

  const index = RAIL_SECTIONS.findIndex((s) => s.id === current);
  const rows = () => (
    <ol>
      {RAIL_SECTIONS.map((s) => (
        <li key={s.id} data-id={s.id} className={`${s.id === current ? "is-current" : ""}${done.includes(s.id) ? " is-done" : ""}` || undefined}>
          <a href={`#${s.id}`} aria-current={s.id === current ? "location" : undefined} onClick={(e) => go(e, s.id)}>
            <span className="station" aria-hidden="true" />
            {s.label}
            {done.includes(s.id) && <span className="visually-hidden"> (done)</span>}
            {states[s.id] && <span className="cap-rail-state">{states[s.id]}</span>}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav className="lesson-rail cap-rail" aria-label="Sections on this page" data-pagefind-ignore>
        <div className="progress-head" aria-live="polite">
          <p className="label">
            {done.length} of {TRACKED.length} done
          </p>
          <div className="progress-bar" role="img" aria-label={`${done.length} of ${TRACKED.length} sections done`}>
            {TRACKED.map((id) => (
              <span key={id} className={`seg${done.includes(id) ? " is-done" : ""}`} />
            ))}
          </div>
        </div>
        {rows()}
      </nav>
      <div className="progress-sticky cap-bar" data-pagefind-ignore>
        <p className="progress-line label">
          <button type="button" className="cap-bar-button" aria-expanded={open} aria-controls="cap-bar-list" ref={button} onClick={() => setOpen(!open)}>
            Section {index + 1} of {RAIL_SECTIONS.length}: {RAIL_SECTIONS[index].label}
          </button>
        </p>
        <StripBackToTop />
        <nav id="cap-bar-list" className="cap-bar-list" aria-label="Sections on this page" hidden={!open}>
          {rows()}
        </nav>
      </div>
    </>
  );
}
