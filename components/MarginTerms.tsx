"use client";

import { useLayoutEffect, useRef } from "react";
import { stackTops } from "@/lib/marginStack";

type Item = { term: string; definition: string; id?: string };

/**
 * The right-hand margin from 1200px: the glossary terms whose popovers sit in this section, with the same definitions. A duplicate of
 * the popover text, so it is hidden from screen readers and from search (data-pagefind-ignore, and lib/findOnPage.ts skips it).
 * Below 1200px it is display:none. Without JavaScript it is a plain list that sticks beside the section. With it, each note is moved
 * beside the line holding its term (`data-note` on the term, `data-note-for` here), pushed down so none overlap (lib/marginStack.ts);
 * each note starts with its number (the order of first use in the section) and the term carries the same number as CSS content;
 * hovering or focusing a term or its note marks the other (`data-linked`). A learn page passes items without ids: they stay a list.
 */
export default function MarginTerms({ terms, label = "Terms in this section" }: { terms: Item[]; label?: string }) {
  const box = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = box.current;
    const section = el?.closest<HTMLElement>("section");
    el?.setAttribute("data-ready", ""); // from here the notes may show (CSS hides them until then when scripting is on, so they never jump)
    if (!el || !section || !terms.some((t) => t.id)) return;
    const wide = window.matchMedia("(min-width: 1200px)");
    const notes = [...el.querySelectorAll<HTMLElement>("[data-note-for]")];
    const place = () => {
      section.style.minHeight = "";
      if (!wide.matches) return void el.removeAttribute("data-placed");
      const top = section.getBoundingClientRect().top;
      const rows = notes.flatMap((n) => {
        const term = section.querySelector<HTMLElement>(`[data-note="${n.dataset.noteFor}"]`);
        return term ? [{ n, want: term.getBoundingClientRect().top - top }] : [];
      });
      if (rows.length !== notes.length) return void el.removeAttribute("data-placed"); // a term not found: keep the plain list
      el.setAttribute("data-placed", "");
      const { tops, bottom } = stackTops(rows.map((r) => r.want), rows.map((r) => r.n.offsetHeight), section.offsetHeight);
      rows.forEach((r, i) => (r.n.style.top = `${tops[i]}px`));
      if (bottom > section.offsetHeight) section.style.minHeight = `${bottom}px`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(section);
    wide.addEventListener("change", place);
    void document.fonts?.ready.then(place);

    // Hover or focus on a term marks its note, and the other way round.
    const mark = (target: EventTarget | null, on: boolean) => {
      const from = (target as HTMLElement | null)?.closest?.<HTMLElement>("[data-note], [data-note-for]");
      if (!from) return;
      const id = from.dataset.note ?? from.dataset.noteFor;
      const other = from.dataset.note ? el.querySelector<HTMLElement>(`[data-note-for="${id}"]`) : section.querySelector<HTMLElement>(`[data-note="${id}"]`);
      for (const x of [from, other]) {
        if (!x) continue;
        if (on) x.setAttribute("data-linked", "");
        else x.removeAttribute("data-linked");
      }
    };
    const over = (e: Event) => mark(e.target, true);
    const out = (e: Event) => mark(e.target, false);
    section.addEventListener("pointerover", over);
    section.addEventListener("pointerout", out);
    section.addEventListener("focusin", over);
    section.addEventListener("focusout", out);
    return () => {
      ro.disconnect();
      wide.removeEventListener("change", place);
      section.removeEventListener("pointerover", over);
      section.removeEventListener("pointerout", out);
      section.removeEventListener("focusin", over);
      section.removeEventListener("focusout", out);
      section.style.minHeight = "";
    };
  }, [terms]);

  if (terms.length === 0) return null;
  return (
    <aside ref={box} className="margin-terms" aria-hidden="true" data-pagefind-ignore>
      <div className="margin-terms-in">
        <p className="margin-terms-label">{label}</p>
        <dl>
          {terms.map((t, n) => (
            <div key={t.term} className="margin-note" data-note-for={t.id}>
              <dt><span className="margin-num">{n + 1}</span>{t.term}</dt>
              <dd>{t.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
