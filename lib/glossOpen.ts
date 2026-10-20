/** How long the first glossary popover waits on hover, and how soon after one closes the next counts as a neighbour. */
export const GLOSS_OPEN_DELAY_MS = 300;

export type GlossOpenMode = "stay" | "instant" | "wait";

/**
 * What a mouse entering a glossary term should do. "stay": its own popover is already open (the pointer came back
 * within the grace period). "instant": another popover is open, or one closed under 300ms ago, so open now with no
 * animation. "wait": the first popover, which opens after the delay.
 */
export function glossOpenMode(o: { alreadyOpen: boolean; otherOpen: boolean; lastClosedAt: number; now: number }): GlossOpenMode {
  if (o.alreadyOpen) return "stay";
  return o.otherOpen || o.now - o.lastClosedAt < GLOSS_OPEN_DELAY_MS ? "instant" : "wait";
}
