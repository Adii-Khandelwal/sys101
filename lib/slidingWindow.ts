// Model and wording of the sliding-window gauge (Cloudflare 2017). Pure, so the build, the
// reading-time estimate and the tests can use it without any DOM.
import type { FigureSource } from "./figures";

export type WindowInputs = { limit: number; previous: number; current: number; elapsed: number };

export const WINDOW_SECONDS = 60;
/** Extra requests "Add a request" may stack on the current minute, so the tray never overflows. */
export const MAX_ADDED = 22;

/** Previous count weighted by the share of that minute still inside the window, plus the current count. */
export function windowEstimate(previous: number, current: number, elapsed: number): number {
  return Math.round(((previous * (WINDOW_SECONDS - elapsed)) / WINDOW_SECONDS + current) * 10) / 10;
}

const fmt = (n: number) => String(Math.round(n * 10) / 10);

export function windowFormula(i: WindowInputs, current = i.current, elapsed = i.elapsed): string {
  return `${i.previous} × (${WINDOW_SECONDS} − ${elapsed}) / ${WINDOW_SECONDS} + ${current} = ${fmt(windowEstimate(i.previous, current, elapsed))}`;
}

export function windowStatus(estimate: number, limit: number): string {
  return estimate > limit ? `over the limit of ${limit}` : `within the limit of ${limit}`;
}

export function windowValueText(i: WindowInputs, current: number, elapsed: number): string {
  return `${elapsed} seconds into the minute, estimate ${fmt(windowEstimate(i.previous, current, elapsed))} of ${i.limit}`;
}

export const windowValid = (i: WindowInputs) => i.elapsed >= 0 && i.elapsed <= WINDOW_SECONDS && i.previous > 0 && i.current >= 0 && i.limit > 0;

/** Every visible sentence of the figure. Wording is ours; the post is cited, not quoted. */
export function windowText(i: WindowInputs, src: FigureSource) {
  return {
    title: "Sliding window gauge",
    description: `Two trays on a rail. The left tray holds ${i.previous} beads for the previous minute, spread evenly. The right tray holds ${i.current} beads for this minute. A frame ${WINDOW_SECONDS} seconds wide slides along the rail, and a dial reads the estimate against a mark at the limit of ${i.limit}.`,
    legend: [
      `Left tray: the previous minute, ${i.previous} requests spread evenly over ${WINDOW_SECONDS} seconds.`,
      `Right tray: the current minute, ${i.current} requests so far, spread over the seconds that have passed.`,
      `Frame: the last ${WINDOW_SECONDS} seconds. Filled beads inside it count, hollow beads outside it do not.`,
      `Dial: the estimate. The long mark is the limit, ${i.limit} requests per minute.`,
    ],
    caption: `Figure from ${src.company} ${src.year} (${src.postId}). The estimate is the previous count weighted by the share of that minute still inside the frame, plus the current count. The slider moves time while the current count stays at ${i.current}, so it shows the estimate falling as the previous minute slides out. "Add a request" puts one more bead in the current tray and adds 1 to the current count; Reset restores ${i.current} and ${i.elapsed} seconds.`,
  };
}
