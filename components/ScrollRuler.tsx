"use client";

import { useEffect, useRef, useState } from "react";
import { jumpTarget, maxScroll, percentLabel, percentTicks, rulerY, scrollTopForPointer } from "@/lib/scrollRuler";

// Columns, left to right: the 10..90 numbers (right-aligned in a fixed box), then the ticks growing from the right edge.
const W = 48;
const NUM_X = 26; // right edge of the numbers and the readout
const MINOR = 6;
const MID = 10;
const MAJOR = 16;
const SECTION = 20;

/**
 * A ruler down the right edge in place of the native page scrollbar (desktop, fine pointer only; CSS decides).
 * The whole page runs 0 to 100%: ticks every 2%, 5% and 10% (numbered), a marker with a percent readout, and a
 * longer tick at each h2. Drag or press to scroll proportionally; a section tick jumps to its heading.
 * Decorative: keyboard and screen-reader users keep native scrolling.
 */
export default function ScrollRuler() {
  const rootRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const readoutRef = useRef<SVGTextElement>(null);
  const numsRef = useRef<SVGGElement>(null);
  const [track, setTrack] = useState(0);
  const [heads, setHeads] = useState<{ y: number; offset: number }[]>([]);
  const [active, setActive] = useState(false);
  const dragging = useRef(false);
  const geo = useRef({ track: 0, max: 0, clearance: 76 });

  useEffect(() => {
    let raf = 0;
    const place = () => {
      const g = geo.current;
      const y = rulerY(window.scrollY, g.max, g.track);
      markerRef.current?.style.setProperty("transform", `translateY(${y}px)`);
      if (readoutRef.current) readoutRef.current.textContent = percentLabel(g.max ? window.scrollY / g.max : 0);
      numsRef.current?.querySelectorAll("text").forEach((t) => {
        const ty = Number(t.dataset.y);
        t.classList.toggle("is-hidden", ty > y - 14 && ty < y + 27); // the marker and its readout sit here
      });
    };
    const measure = () => {
      raf = 0;
      const root = rootRef.current;
      if (!root) return;
      const doc = document.documentElement;
      const rect = root.getBoundingClientRect();
      const max = maxScroll(doc.scrollHeight, window.innerHeight);
      const els = Array.from(document.querySelectorAll<HTMLElement>("h2")).filter((h) => h.getClientRects().length > 0 && !h.closest("header, footer, [role=dialog]"));
      const header = parseFloat(getComputedStyle(doc).getPropertyValue("--header-h")) || 60;
      geo.current = { track: rect.height, max, clearance: header + 16 };
      setTrack(rect.height);
      setActive(doc.scrollHeight > window.innerHeight + 40);
      setHeads(els.map((h) => { const offset = h.getBoundingClientRect().top + window.scrollY; return { offset, y: rulerY(offset, max, rect.height) }; }));
      place();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    let placing = 0;
    const schedulePlace = () => {
      if (!placing) placing = requestAnimationFrame(() => ((placing = 0), place()));
    };
    measure();
    window.addEventListener("scroll", schedulePlace, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", schedulePlace);
      cancelAnimationFrame(placing);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // The native scrollbar is hidden (CSS, `html.has-ruler`) only while the ruler is shown, so no-JS, pre-hydration and short pages keep it.
  useEffect(() => {
    document.documentElement.classList.toggle("has-ruler", active);
    return () => document.documentElement.classList.remove("has-ruler");
  }, [active]);

  const jump = (e: React.PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect();
    window.scrollTo({ top: scrollTopForPointer(e.clientY, r.top, r.height, geo.current.max), behavior: "auto" });
  };

  const tickPath = (step: number, len: number, skip: (p: number) => boolean) =>
    percentTicks(track, step).filter((t) => !skip(t.pct)).map((t) => `M${W - len},${Math.min(Math.round(t.y), track - 1) + 0.5}H${W}`).join("");

  return (
    <div
      ref={rootRef}
      className="scroll-ruler"
      aria-hidden="true"
      hidden={!active}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const i = (e.target as SVGElement).dataset?.i;
        if (i !== undefined) {
          window.scrollTo({ top: jumpTarget(heads[Number(i)].offset, geo.current.clearance, geo.current.max), behavior: "auto" });
          return;
        }
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        jump(e);
      }}
      onPointerMove={(e) => dragging.current && e.buttons & 1 && jump(e)}
      onLostPointerCapture={() => (dragging.current = false)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <svg width={W} height={track} viewBox={`0 0 ${W} ${track}`} aria-hidden="true" focusable="false">
        <path className="scroll-ruler-minor" d={tickPath(2, MINOR, (p) => p % 5 === 0)} />
        <path className="scroll-ruler-mid" d={tickPath(5, MID, (p) => p % 10 === 0)} />
        <path className="scroll-ruler-major" d={tickPath(10, MAJOR, () => false)} />
        <g ref={numsRef}>
          {percentTicks(track, 10).slice(1, -1).map((t) => (
            <text key={t.pct} className="scroll-ruler-num" data-y={t.y} x={NUM_X} y={t.y + 4} textAnchor="end">
              {t.pct}
            </text>
          ))}
        </g>
        {heads.map((h, i) => (
          <g key={i}>
            <line className="scroll-ruler-section" x1={W - SECTION} x2={W} y1={Math.round(h.y) + 0.5} y2={Math.round(h.y) + 0.5} />
            <rect className="scroll-ruler-hit" data-i={i} x={W - SECTION} y={Math.round(h.y) - 3} width={SECTION} height="7" />
          </g>
        ))}
        <g ref={markerRef} className="scroll-ruler-marker">
          <rect x="0" y="-8" width={NUM_X} height="27" />
          <line x1="0" x2={W} y1="0" y2="0" />
          <text ref={readoutRef} x={NUM_X} y="15" textAnchor="end" />
        </g>
      </svg>
    </div>
  );
}
