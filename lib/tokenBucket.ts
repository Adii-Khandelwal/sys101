// Model and wording of the token bucket (Databricks 2025, High performance ratelimiting). Pure and deterministic.
// The post gives the mechanism: a bucket allows controlled bursts, "remembers" across time intervals, can go negative,
// and rejects until it refills to at least zero. It gives no capacity or refill rate. Capacity 4, one token per tick
// and the burst of 6 below are this figure's own example, not the post's numbers.
import type { FigureSource } from "./figures";

/** batchMs: the post's example interval at which clients report their counts (100 ms). */
export type BucketInputs = { batchMs: number };
export const bucketValid = (i: BucketInputs) => i.batchMs > 0;

export const CAPACITY = 4;
/** Debt the example can reach: the burst minus what the bucket held. */
export const DEBT_MAX = 2;

type Event = { refill: number; batch?: number; request?: boolean };
/** The story: full bucket, a burst counted in one batch, a rejected request, two refills, two refills and a request. */
const EVENTS: Event[] = [{ refill: 0 }, { refill: 0, batch: 6 }, { refill: 0, request: true }, { refill: 2 }, { refill: 2, request: true }];
export const BUCKET_STEPS = EVENTS.length;
export const bucketLast = BUCKET_STEPS - 1;

export type BucketState = {
  step: number;
  /** Tokens in the bucket; below zero is debt. */
  level: number;
  tokens: number;
  debt: number;
  /** Tokens that arrived by refill in this step and are still in the bucket. */
  arrived: number;
  /** True while the level is below zero: requests are rejected. */
  rejecting: boolean;
  rejected: boolean;
  headline: string;
  readout: string;
};

const HEADLINES = [
  `The bucket is full: ${CAPACITY} tokens. A request takes one token.`,
  `A burst of 6 hits is counted in one batch against ${CAPACITY} tokens. The bucket goes negative instead of resetting, and the 2 hits over the limit are remembered as debt.`,
  "A request arrives while the level is below zero. It is rejected.",
  "Two refill ticks add two tokens. They pay off the debt and the level is back to zero, so rejections stop.",
  "Two more ticks add two tokens, and a request takes one.",
];

export function bucketState(_i: BucketInputs, step: number): BucketState {
  const at = Math.min(Math.max(step, 0), bucketLast);
  let level = CAPACITY;
  let arrived = 0;
  let rejected = false;
  for (let s = 1; s <= at; s++) {
    const e = EVENTS[s];
    level = Math.min(level + e.refill, CAPACITY);
    arrived = s === at ? Math.min(e.refill, Math.max(level, 0)) : 0;
    rejected = false;
    if (e.batch) level -= e.batch;
    if (e.request) {
      if (level < 0) rejected = true;
      else level -= 1;
    }
  }
  const tokens = Math.max(level, 0);
  const arrivedKept = Math.min(arrived, tokens);
  const readout = `level ${level} of ${CAPACITY}${level < 0 ? `, ${-level} in debt` : ""}; ${level < 0 ? "rejecting requests" : "accepting requests"}${rejected ? "; this request was rejected" : ""}`;
  return { step: at, level, tokens, debt: Math.max(-level, 0), arrived: arrivedKept, rejecting: level < 0, rejected, headline: HEADLINES[at], readout };
}

export function bucketText(i: BucketInputs, src: FigureSource) {
  return {
    title: "Token bucket",
    description: `A hopper on a stand holds up to ${CAPACITY} tokens, shown as small cubes on its floor. A tank behind it drips one token in at each refill tick, up to the hopper's capacity. A request takes one token. A shallow dashed bay in front of the hopper holds one dashed block for each token of debt. A barrier across the lane to the right is lowered while the level is below zero, which means requests are rejected, and lifted when the level is back to at least zero.`,
    legend: [
      `Cubes in the hopper: tokens. An orange cube arrived by refill in this step.`,
      `Dashed blocks in the front bay: debt. A burst larger than the bucket pushes the level below zero and the overage is remembered, not reset.`,
      `Barrier on the lane: lowered while the level is below zero (requests rejected), lifted from zero upward.`,
    ],
    caption: `Figure from ${src.company} ${src.year} (${src.postId}). The post says a token bucket allows controlled bursts, remembers across intervals instead of resetting like a fixed window, can go negative, and rejects requests until the bucket refills to at least zero; clients report counts in batches, its example interval being ${i.batchMs} ms. The capacity of ${CAPACITY}, one token per tick, the burst of 6 hits and the rejected request are this figure's own example, not the post's numbers.`,
  };
}
