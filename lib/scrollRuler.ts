// Pure maths for the scroll ruler (components/ScrollRuler.tsx).

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** How far the page can scroll; never negative. */
export const maxScroll = (scrollHeight: number, viewport: number) => Math.max(0, scrollHeight - viewport);

/** Scroll position as 0..1 (0 when the page does not scroll). */
export function scrollFraction(scrollTop: number, scrollHeight: number, viewport: number) {
  const max = maxScroll(scrollHeight, viewport);
  return max === 0 ? 0 : clamp01(scrollTop / max);
}

/** Marker and major ticks share one scale: a heading sits on the marker when it is scrolled to the top. */
export const rulerY = (scrollTop: number, maxScrollTop: number, trackHeight: number) =>
  maxScrollTop === 0 ? 0 : clamp01(scrollTop / maxScrollTop) * trackHeight;

/** Where a press at pointerY (client px) on a track lands, as a scrollTop. */
export const scrollTopForPointer = (pointerY: number, trackTop: number, trackHeight: number, maxScrollTop: number) =>
  trackHeight <= 0 ? 0 : clamp01((pointerY - trackTop) / trackHeight) * maxScrollTop;

/** Tick y positions for a 0..100 scale: every `step` percent, from 0 to 100. */
export function percentTicks(trackHeight: number, step: number) {
  const out: { pct: number; y: number }[] = [];
  for (let p = 0; p <= 100; p += step) out.push({ pct: p, y: (p / 100) * trackHeight });
  return out;
}

/** Marker readout, e.g. 0.224 -> "22%". */
export const percentLabel = (fraction: number) => `${Math.round(clamp01(fraction) * 100)}%`;

/** scrollTop that puts a heading at the top of the page, below the header, kept inside the scrollable range. */
export const jumpTarget = (headingOffset: number, clearance: number, maxScrollTop: number) =>
  Math.min(Math.max(0, headingOffset - clearance), maxScrollTop);
