"use client";

import { useEffect, useRef, useState } from "react";
import { StripBackToTop } from "@/components/BackToTop";
import { glideToSection } from "@/lib/glide";
import { STEPS } from "@/lib/designSteps";

/**
 * Section navigation on the capstone rail's classes (.lesson-rail, .progress-sticky). From 1180px a fixed left rail: a station per section, the current one ringed, names only
 * and no count (design pages track nothing). Below that, one sticky line "Section 3 of N: Entities" that opens the list. The current section comes from an
 * IntersectionObserver on the top third of the screen. Real anchors, so it works without JavaScript. Nothing is stored.
 */
/** The top fraction of the screen that counts as "the current section"; the observer band and the position test share it. */
const BAND = 0.34;

export default function DesignRail() {
  const [current, setCurrent] = useState<string>(STEPS[0].id);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const els = STEPS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      () => {
        // The current section is the last one whose top has passed the top third of the screen, so the ring stays on the last section through Worth knowing and Original sources (no rail entry).
        const line = window.innerHeight * BAND;
        const last = els.filter((el) => el.getBoundingClientRect().top <= line).pop();
        setCurrent((last ?? els[0]).id);
      },
      { rootMargin: `0px 0px -${Math.round((1 - BAND) * 100)}% 0px`, threshold: [0, 1] },
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

  const index = STEPS.findIndex((s) => s.id === current);
  const rows = () => (
    <ol>
      {STEPS.map((s) => (
        <li key={s.id} data-id={s.id} className={s.id === current ? "is-current" : undefined}>
          <a href={`#${s.id}`} aria-current={s.id === current ? "location" : undefined} onClick={(e) => go(e, s.id)}>
            <span className="station" aria-hidden="true" />
            {s.label}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav className="lesson-rail cap-rail" aria-label="Sections on this page" data-pagefind-ignore>
        {rows()}
      </nav>
      <div className="progress-sticky cap-bar" data-pagefind-ignore>
        <p className="progress-line label">
          <button type="button" className="cap-bar-button" aria-expanded={open} aria-controls="design-bar-list" ref={button} onClick={() => setOpen(!open)}>
            Section {index + 1} of {STEPS.length}: {STEPS[index].label}
          </button>
        </p>
        <StripBackToTop />
        <nav id="design-bar-list" className="cap-bar-list" aria-label="Sections on this page" hidden={!open}>
          {rows()}
        </nav>
      </div>
    </>
  );
}
