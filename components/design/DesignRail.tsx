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
export default function DesignRail() {
  const [current, setCurrent] = useState<string>(STEPS[0].id);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const els = STEPS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id);
          else inBand.delete(e.target.id);
        }
        // The last section in page order that touches the top third is the current one; with none there, keep the last.
        const last = [...STEPS].reverse().find((s) => inBand.has(s.id));
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
