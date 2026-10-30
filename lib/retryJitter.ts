// Model and wording of retries with backoff and jitter (Amazon Builders' Library 2019). Pure and deterministic.
import type { FigureSource } from "./figures";

/** retries: how many times each client retries (the post's "three retries at each layer"). */
export type JitterInputs = { retries: number };

/** The figure's own example, not the post's: how many clients retry, and the length of the first wait. */
export const CLIENTS = 12;
/** Waits double after every attempt (the post says "exponentially"; the factor 2 is the figure's example). */
export const waitOf = (attempt: number) => 2 ** (attempt - 1);
/** A time slot is a quarter of the first wait; 24 ticks make one first wait, so times stay exact integers. */
const TICKS = 24;
const SLOT = 6;

export const jitterValid = (i: JitterInputs) => Number.isInteger(i.retries) && i.retries >= 1 && i.retries <= 3;
export const jitterLast = (i: JitterInputs) => i.retries;

/** Times in ticks of the retry `attempt` (1..retries) per client. Plain: the whole wait. Jitter: a fixed, evenly spread part of it, different for each client and attempt. */
export function retryTicks(i: JitterInputs, jitter: boolean): number[][] {
  return Array.from({ length: CLIENTS }, (_, c) => {
    const t = [0];
    for (let a = 1; a <= i.retries; a++) {
      const part = jitter ? 4 + Math.floor((((c * 5 + a * 7) % CLIENTS) * 19) / (CLIENTS - 1)) : 2 * CLIENTS; // out of 2 * CLIENTS; at least 4 so a try never overlaps the one before it
      t.push(t[a - 1] + (part * TICKS * waitOf(a)) / (2 * CLIENTS));
    }
    return t;
  });
}

type JitterState = {
  step: number;
  /** Retries sent so far across all clients. */
  sent: number;
  /** The most retries that land in one slot. */
  peak: number;
  headline: string;
  readout: string;
};

export function jitterState(i: JitterInputs, o: { jitter: boolean }, step: number): JitterState {
  const at = Math.min(Math.max(step, 0), jitterLast(i));
  const ticks = retryTicks(i, o.jitter);
  const slots = new Map<number, number>();
  for (const t of ticks) for (let a = 1; a <= at; a++) slots.set(Math.floor(t[a] / SLOT), (slots.get(Math.floor(t[a] / SLOT)) ?? 0) + 1);
  const peak = Math.max(0, ...slots.values());
  const sent = CLIENTS * at;
  const headline =
    at === 0
      ? `All ${CLIENTS} clients call at the same moment and the call fails for every one of them.`
      : o.jitter
        ? `Retry ${at}: each client waits a different part of the backoff, so the ${CLIENTS} retries are spread over time.`
        : `Retry ${at}: every client waited the same time, so all ${CLIENTS} retries arrive together.`;
  const readout = at === 0 ? "no retries yet" : `${sent} retries so far; busiest slot: ${peak} of ${CLIENTS} clients at once`;
  return { step: at, sent, peak, headline, readout };
}

export function jitterText(i: JitterInputs, src: FigureSource) {
  return {
    title: "Retries with backoff and jitter",
    description: `Twelve lanes, one for each client, run along a time rail. Each block on a lane is one try. The first try of all twelve lands at the start. Each retry waits twice as long as the one before, up to ${i.retries} retries. With jitter off, every block of a retry lines up in a wall at the end of the wait. With jitter on, the blocks spread across the wait.`,
    legend: [
      `Each lane: one client. Left to right: time. The ruler at the front marks the backoff steps; the posts at the back mark where each plain wait ends.`,
      `A filled block is the try that just happened. A hollow block is an earlier try.`,
      `A wall of blocks across all lanes is a burst of ${CLIENTS} calls at once. A slanted scatter is the same calls spread out.`,
    ],
    caption: `Figure from ${src.company} ${src.year} (${src.postId}). The post says that clients which all back off to the same time cause the overload again when they retry, and that jitter adds randomness to the backoff to spread the retries in time; it also describes three retries in its layered example. The count of ${CLIENTS} clients, the doubling wait and the fixed spread of jitter are this figure's own example, not the post's numbers. Next step sends the next retry. The switch turns jitter on or off.`,
  };
}
