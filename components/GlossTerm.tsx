"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { GLOSS_OPEN_DELAY_MS, glossOpenMode } from "@/lib/glossOpen";

// The popover that is open now, so opening another one closes it: only one is ever shown.
let active: (() => void) | null = null;
// When a popover last closed, so the next one within a moment opens without delay or animation.
let lastClosed = 0;

/**
 * A glossary term inside lesson prose. Without JavaScript it is a plain link to its entry on /glossary. With it, hover,
 * focus or a tap opens a small popover with the definition and a "See in glossary" link; Escape closes it and puts focus
 * back on the term. Fading is opacity and a 0.97 scale from the term, on the motion tokens (opacity only under reduced motion).
 */
export default function GlossTerm({ href, definition, note, children }: { href: string; definition: string; /** Id of this term's margin note (lib/glossaryMatch.ts noteId). */ note?: string; children: string }) {
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);
  const term = useRef<HTMLAnchorElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const pinned = useRef(false);
  const leaving = useRef<number>(undefined);
  const opening = useRef<number>(undefined);
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const [up, setUp] = useState(false);
  const [instant, setInstant] = useState(false);

  useEffect(() => () => clearTimeout(opening.current), []);

  // The no-animation flag only covers the open itself; clear it shortly after, so the exit fades.
  useEffect(() => {
    if (!open || !instant) return;
    const t = window.setTimeout(() => setInstant(false), 50);
    return () => clearTimeout(t);
  }, [open, instant]);

  const close = () => {
    clearTimeout(leaving.current);
    clearTimeout(opening.current);
    pinned.current = false;
    setOpen(false);
  };

  // Keep the popover inside the viewport: flip it above the term when there is no room below, and slide it sideways back in.
  // Measured on open and again on scroll or resize while open (a tap can scroll the page).
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!root.current || !pop.current) return;
      const margin = 12;
      const r = root.current.getBoundingClientRect();
      const h = pop.current.offsetHeight + margin;
      setUp(r.bottom + h > window.innerHeight && r.top > h);
      const max = document.documentElement.clientWidth - margin - pop.current.offsetWidth;
      setShift(Math.round(Math.min(0, max - r.left) + Math.max(0, margin - r.left)));
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const mine = () => {
      clearTimeout(leaving.current);
      pinned.current = false;
      setOpen(false);
    };
    if (active !== mine) active?.();
    active = mine;
    return () => {
      if (active === mine) active = null;
      lastClosed = Date.now();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return (
    <span
      ref={root}
      className="gloss"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(leaving.current);
        // The first popover waits a moment so a mouse sweeping across prose opens none; its neighbours open at once.
        const mode = glossOpenMode({ alreadyOpen: open, otherOpen: active !== null, lastClosedAt: lastClosed, now: Date.now() });
        if (mode === "stay") return;
        setInstant(mode === "instant");
        if (mode === "instant") setOpen(true);
        else opening.current = window.setTimeout(() => setOpen(true), GLOSS_OPEN_DELAY_MS);
      }}
      // A short grace period, so a mouse path that drifts off the term and back does not close the popover.
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(opening.current);
        if (pinned.current) return;
        leaving.current = window.setTimeout(() => setOpen(false), 150);
      }}
      onFocus={(e) => {
        if (!e.target.matches(":focus-visible")) return;
        setInstant(false);
        setOpen(true);
      }}
      onBlur={(e) => !root.current?.contains(e.relatedTarget as Node | null) && close()}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        e.stopPropagation();
        close();
        term.current?.focus();
      }}
    >
      <a
        ref={term}
        className="gloss-term"
        data-note={note}
        data-popover
        data-own-transition // the global link handler would navigate; a click here only opens the popover
        href={href}
        aria-describedby={id}
        aria-expanded={open}
        onClick={(e) => {
          // A plain click opens the popover; the popover's own link goes to the glossary.
          e.preventDefault();
          if (open && pinned.current) return close();
          clearTimeout(opening.current);
          setInstant(false);
          pinned.current = true;
          setOpen(true);
        }}
      >
        {children}
      </a>
      <span
        ref={pop}
        className="gloss-pop"
        role="dialog"
        aria-label={children}
        data-open={open}
        data-up={up}
        data-instant={instant}
        data-pagefind-ignore
        // Grows from the term: the origin is the term's left edge, whatever the sideways shift.
        style={{ left: shift, transformOrigin: `${-shift}px ${up ? "100%" : "0"}` }}
      >
        <span id={id}>{definition}</span>
        <Link href={href} className="gloss-more" tabIndex={open ? 0 : -1}>
          See in glossary
        </Link>
      </span>
    </span>
  );
}
