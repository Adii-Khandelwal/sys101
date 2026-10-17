"use client";

import { useEffect, useRef, useState } from "react";
import { glideToSection } from "@/lib/glide";
import { RAIL_SECTIONS, railStates } from "@/lib/capstoneRail";
import { useStoredChoices } from "./useStoredChoices";

/**
 * Section tracker. From 1180px it is a fixed list in the left margin (the topic rail's place and styles); below that it is one
 * sticky line, "Section 3 of 7: Size it", that opens the same list. Real anchors, so it works without JavaScript.
 * The current section comes from an IntersectionObserver on the top third of the screen.
 */
export default function CapstoneRail({ slug, decisionIds, quizLength }: { slug: string; decisionIds: string[]; quizLength: number }) {
  const [picks] = useStoredChoices(slug);
  const states = railStates(picks, decisionIds, quizLength);
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
  const list = (
    <ol>
      {RAIL_SECTIONS.map((s) => (
        <li key={s.id} className={s.id === current ? "is-current" : undefined}>
          <a href={`#${s.id}`} aria-current={s.id === current ? "location" : undefined} onClick={(e) => go(e, s.id)}>
            <span className="cap-rail-mark" aria-hidden="true" />
            <span>{s.label}</span>
            {states[s.id] && <span className="cap-rail-state">{states[s.id]}</span>}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav className="lesson-rail cap-rail" aria-label="Sections on this page" data-pagefind-ignore>
        {list}
      </nav>
      <div className="progress-sticky cap-bar" data-pagefind-ignore>
        <button type="button" className="cap-bar-button label" aria-expanded={open} aria-controls="cap-bar-list" ref={button} onClick={() => setOpen(!open)}>
          Section {index + 1} of {RAIL_SECTIONS.length}: {RAIL_SECTIONS[index].label}
        </button>
        <nav id="cap-bar-list" className="cap-bar-list" aria-label="Sections on this page" hidden={!open}>
          {list}
        </nav>
      </div>
    </>
  );
}
