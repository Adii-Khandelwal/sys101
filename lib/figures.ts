// Interactive figures that sit at the end of a post's section (.claude/rules/topic-pages.md, .claude/rules/figures.md).
// This file is the registry: which ids exist, which numbers rows feed each, and every figure's wording.
// The models are pure, so the build, the reading-time estimate and the tests need no DOM.
import { windowText, windowValid, windowFormula, type WindowInputs } from "./slidingWindow";
import { raceText, raceValid, type RaceInputs } from "./fillRace";
import { latchText, latchValid, type LatchInputs } from "./commitLatch";
import { xidText, xidValid, type XidInputs } from "./xidDial";
import { ringText, ringValid, type RingInputs } from "./hashRing";
import { jitterText, jitterValid, type JitterInputs } from "./retryJitter";
import { filterText, filterValid, type FilterInputs } from "./filterBits";
import { breakerText, breakerValid, type BreakerInputs } from "./breakerGate";
import { bucketText, bucketValid, type BucketInputs } from "./tokenBucket";

export const FIGURE_IDS = ["sliding-window", "fill-race", "commit-latch", "xid-dial", "hash-ring", "retry-jitter", "filter-bits", "breaker-gate", "token-bucket"] as const;
export type FigureId = (typeof FIGURE_IDS)[number];

/** Input names each figure needs, each pointing at a row of the post's digest.numbers. */
const FIGURE_ROWS: Record<FigureId, readonly string[]> = {
  "sliding-window": ["limit", "previous", "current", "elapsed"],
  "fill-race": ["stale", "fresh", "version"],
  "commit-latch": ["bobBefore", "joeBefore", "amount", "oldTs", "startTs", "commitTs"],
  "xid-dial": ["limit", "margin"],
  "hash-ring": ["spreadOne", "points", "spreadMany", "servers"],
  "retry-jitter": ["retries"],
  "filter-bits": ["bloomOverhead", "ribbonOverhead"],
  "breaker-gate": ["blocked", "rps", "clientMs", "serviceMs", "factor"],
  "token-bucket": ["batchMs"],
};

/** Rows of the post's digest.numbers that feed the figure; the first number in each value is the input. */
export type FigureSpec = { id: FigureId; rows: Record<string, number> };

export type FigureSource = { company: string; year: string; postId: string };

export type FigureText = { title: string; description: string; legend: string[]; caption: string };

const VALID: Record<FigureId, (i: never) => boolean> = {
  "sliding-window": windowValid as (i: never) => boolean,
  "fill-race": raceValid as (i: never) => boolean,
  "commit-latch": latchValid as (i: never) => boolean,
  "xid-dial": xidValid as (i: never) => boolean,
  "hash-ring": ringValid as (i: never) => boolean,
  "retry-jitter": jitterValid as (i: never) => boolean,
  "filter-bits": filterValid as (i: never) => boolean,
  "breaker-gate": breakerValid as (i: never) => boolean,
  "token-bucket": bucketValid as (i: never) => boolean,
};

/** The inputs of a figure, read from the post's numbers rows. Null when a row is missing, has no number or breaks the model's limits. */
export function resolveInputs(spec: FigureSpec, numbers: { value: string }[]): Record<string, number> | null {
  const keys = FIGURE_ROWS[spec.id];
  if (!keys || Object.keys(spec.rows).sort().join() !== [...keys].sort().join()) return null;
  const out: Record<string, number> = {};
  for (const k of keys) {
    const m = numbers[spec.rows[k]]?.value.match(/\d[\d,]*(?:\.\d+)?/);
    out[k] = m ? Number(m[0].replace(/,/g, "")) : NaN;
  }
  return Object.values(out).every(Number.isFinite) && VALID[spec.id](out as never) ? out : null;
}

/** Build-time check of a digest's figure field; returns problems. */
export function checkFigure(spec: FigureSpec | undefined, numbers: { value: string }[], postId?: string): string[] {
  if (!spec) return [];
  if (!postId) return ["a post with a figure needs an id: the figure is not shown without one"];
  if (!FIGURE_IDS.includes(spec.id)) return [`figure id "${spec.id}" is not registered`];
  return resolveInputs(spec, numbers) ? [] : [`figure "${spec.id}" needs rows ${FIGURE_ROWS[spec.id].join(", ")}, each pointing at a digest.numbers row that starts with a number the model accepts`];
}

export function figureText(id: FigureId, inputs: Record<string, number>, src: FigureSource): FigureText {
  if (id === "sliding-window") return windowText(inputs as WindowInputs, src);
  if (id === "fill-race") return raceText(inputs as RaceInputs, src);
  if (id === "xid-dial") return xidText(inputs as XidInputs, src);
  if (id === "hash-ring") return ringText(inputs as RingInputs, src);
  if (id === "retry-jitter") return jitterText(inputs as JitterInputs, src);
  if (id === "filter-bits") return filterText(inputs as FilterInputs, src);
  if (id === "breaker-gate") return breakerText(inputs as BreakerInputs, src);
  if (id === "token-bucket") return bucketText(inputs as BucketInputs, src);
  return latchText(inputs as LatchInputs, src);
}

/** Prose the figure adds to the page, for the reading-time estimate. */
export function figureProse(spec: FigureSpec | undefined, numbers: { value: string }[], src: FigureSource): string[] {
  const inputs = spec && resolveInputs(spec, numbers);
  if (!spec || !inputs) return [];
  const t = figureText(spec.id, inputs, src);
  const extra = spec.id === "sliding-window" ? [windowFormula(inputs as WindowInputs)] : [];
  return [t.description, ...t.legend, t.caption, ...extra];
}
