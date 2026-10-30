"use client";

import { useEffect, useRef, useState } from "react";
import { jumpTarget, maxScroll, percentLabel, percentTicks, scrollFraction, scrollTopForDrag, tapeShift } from "@/lib/scrollRuler";

// Columns, left to right: the 10..90 numbers (right-aligned in a fixed box), then the ticks growing from the right edge.
const W = 48;
const NUM_X = 26; // right edge of the numbers
const READOUT_X = 32; // right edge of the readout: "100%" is 29px wide at 11px, so it needs more than the numbers' 26px
const MINOR = 6;
const MID = 10;
const MAJOR = 16;
const SECTION = 20;
const PPP = 10; // tape pixels per percent: the whole page is a 1000px tape
const TAPE = PPP * 100;
const MARKER_AT = 0.33; // the fixed marker sits this far down the ruler

/**
 * A ruler down the right edge in place of the native page scrollbar (desktop, fine pointer only; CSS decides).
 * A tape measure: the marker and its percent readout stay put and the tape (ticks every 2%, 5% and 10%, numbered,
 * plus a longer tick at each h2) slides past as the page scrolls. Drag the tape to scroll (pulling it down goes
 * up the page); a section tick jumps to its heading. Decorative: keyboard and screen-reader users keep native scrolling.
 */
export default function ScrollRuler() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tapeRef = useRef<SVGGElement>(null);
  const readoutRef = useRef<SVGTextElement>(null);
  const numsRef = useRef<SVGGElement>(null);
  const [track, setTrack] = useState(0);
  const [heads, setHeads] = useState<{ pct: number; offset: number; name: string }[]>([]);
  const [active, setActive] = useState(false);
  const [measured, setMeasured] = useState(false);
  const drag = useRef<{ y: number; top: number } | null>(null);
  const geo = useRef({ track: 0, max: 0, clearance: 76 });
  const markerY = Math.round(track * MARKER_AT);

  useEffect(() => {
    let raf = 0;
    const place = () => {
      const g = geo.current;
      const frac = scrollFraction(window.scrollY, g.max + window.innerHeight, window.innerHeight);
      const at = Math.round(g.track * MARKER_AT);
      const shift = tapeShift(frac, at, PPP);
      tapeRef.current?.style.setProperty("transform", `translateY(${shift}px)`);
      if (readoutRef.current) readoutRef.current.textContent = percentLabel(frac);
      numsRef.current?.querySelectorAll("text").forEach((t) => {
        const y = Number(t.dataset.y) + shift;
        t.classList.toggle("is-hidden", y > at - 14 && y < at + 27); // the marker and its readout sit here
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
      setMeasured(true);
      setHeads(els.map((h) => { const offset = h.getBoundingClientRect().top + window.scrollY; return { offset, name: h.textContent?.trim() ?? "", pct: max ? Math.min(100, (offset / max) * 100) : 0 }; }));
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

  // `html.has-ruler` (native scrollbar hidden) is set before first paint by a script in app/layout.tsx; drop it once measured if the ruler cannot show (short page) and on unmount.
  useEffect(() => {
    if (!measured) return;
    const cl = document.documentElement.classList;
    if (active) return cl.add("has-ruler");
    // Wait: early measures can see a page that is still filling in, and dropping the class then would flash the bar.
    const t = setTimeout(() => cl.remove("has-ruler"), 800);
    return () => clearTimeout(t);
  }, [active, measured]);
  useEffect(() => () => document.documentElement.classList.remove("has-ruler"), []);

  const tickPath = (step: number, len: number, skip: (p: number) => boolean) =>
    percentTicks(TAPE, step).filter((t) => !skip(t.pct)).map((t) => `M${W - len},${Math.round(t.y) + 0.5}H${W}`).join("");

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
        drag.current = { y: e.clientY, top: window.scrollY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current && e.buttons & 1) window.scrollTo({ top: scrollTopForDrag(drag.current.top, e.clientY - drag.current.y, PPP, geo.current.max), behavior: "auto" });
      }}
      onLostPointerCapture={() => (drag.current = null)}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <svg width={W} height={track} viewBox={`0 0 ${W} ${track}`} aria-hidden="true" focusable="false">
        <g ref={tapeRef}>
          <path className="scroll-ruler-minor" d={tickPath(2, MINOR, (p) => p % 5 === 0)} />
          <path className="scroll-ruler-mid" d={tickPath(5, MID, (p) => p % 10 === 0)} />
          <path className="scroll-ruler-major" d={tickPath(10, MAJOR, () => false)} />
          <g ref={numsRef}>
            {percentTicks(TAPE, 10).slice(1, -1).map((t) => (
              <text key={t.pct} className="scroll-ruler-num" data-y={t.y} x={NUM_X} y={t.y + 4} textAnchor="end">
                {t.pct}
              </text>
            ))}
          </g>
          {heads.map((h, i) => (
            <g key={i}>
              <line className="scroll-ruler-section" x1={W - SECTION} x2={W} y1={Math.round(h.pct * PPP) + 0.5} y2={Math.round(h.pct * PPP) + 0.5} />
              <rect className="scroll-ruler-hit" data-i={i} x={W - SECTION} y={Math.round(h.pct * PPP) - 3} width={SECTION} height="7">
                <title>{h.name}</title>
              </rect>
            </g>
          ))}
        </g>
        <g className="scroll-ruler-marker" transform={`translate(0 ${markerY})`}>
          <rect x="0" y="-8" width={READOUT_X} height="27" />
          <line x1="0" x2={W} y1="0" y2="0" />
          <text ref={readoutRef} x={READOUT_X} y="15" textAnchor="end" />
        </g>
      </svg>
    </div>
  );
}
