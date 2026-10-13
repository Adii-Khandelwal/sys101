// Model and wording of the cache fill race and version guard (Meta 2022). Pure.
import type { FigureSource } from "./figures";

/** stale: the value in the slow fill reply. fresh: the value written meanwhile. version: the newer entry's version. */
export type RaceInputs = { stale: number; fresh: number; version: number };
type RaceOptions = { guard: boolean; evict: boolean };
type RaceEvent = "start" | "fill" | "mutate" | "invalidate" | "evict" | "reply";

export const raceValid = (i: RaceInputs) => i.stale !== i.fresh && i.version > 0;

/** Index of the last step: the story is one event longer when the entry is evicted. */
export const raceLast = (o: RaceOptions) => raceEvents(o).length - 1;

export const raceEvents = (o: RaceOptions): RaceEvent[] => ["start", "fill", "mutate", "invalidate", ...(o.evict ? (["evict"] as const) : []), "reply"];

type RaceState = {
  event: RaceEvent;
  db: number;
  cache: number | null;
  /** Where the slow fill reply is: not sent, in flight, stopped at the pawl, or arrived. */
  fill: "hidden" | "flight" | "blocked" | "delivered";
  /** The invalidation event. */
  inval: "hidden" | "flight" | "delivered";
  pawl: "up" | "down";
  refused: boolean;
  headline: string;
  readout: string;
};

export function raceState(i: RaceInputs, o: RaceOptions, step: number): RaceState {
  const events = raceEvents(o);
  const at = Math.min(Math.max(step, 0), events.length - 1);
  const event = events[at];
  const has = (e: RaceEvent) => events.indexOf(e) <= at && events.includes(e);
  const db = has("mutate") ? i.fresh : i.stale;
  let cache: number | null = has("invalidate") ? i.fresh : null;
  if (has("evict")) cache = null;
  // The guard needs the newer entry still in the cache: it compares the reply with that entry's version.
  const armed = o.guard && cache !== null;
  const refused = event === "reply" && armed;
  if (event === "reply" && !refused) cache = i.stale;
  const fill = !has("fill") ? "hidden" : event === "reply" ? (refused ? "blocked" : "delivered") : "flight";
  const inval = !has("mutate") ? "hidden" : has("invalidate") ? "delivered" : "flight";
  const pawl = armed || (o.guard && !has("evict") && !has("reply")) ? "up" : "down";
  const v = o.guard ? ` @version=${i.version}` : "";
  const headline = {
    start: `The cache has no entry for x.`,
    fill: `The cache fills x from the database and gets x=${i.stale}. The reply is still on its way.`,
    mutate: `Someone sets x to ${i.fresh}. The invalidation event is on its way.`,
    invalidate: `The invalidation arrives first and the cache holds x=${i.fresh}${v}.`,
    evict: `The entry x=${i.fresh}${v} is evicted, so the cache has lost track of anything newer.`,
    reply: refused ? `The reply x=${i.stale} is older than the entry's version, so the cache refuses it.` : `The reply x=${i.stale} arrives and overwrites the cache.`,
  }[event];
  const cacheText = cache === null ? "empty" : `x=${cache}`;
  const verdict = cache === null ? "nothing cached" : cache === db ? (refused ? "consistent, older write refused" : "consistent") : "stale";
  return { event, db, cache, fill, inval, pawl, refused, headline, readout: `cache ${cacheText} · database x=${db} · ${verdict}` };
}

export function raceText(i: RaceInputs, src: FigureSource) {
  return {
    title: "Cache fill race",
    description: `One cache slot on the right and a database on the left, joined by two rails. A slow fill reply carrying x=${i.stale} travels on the front rail. A fast invalidation carrying x=${i.fresh} travels on the back rail and lands first. A one-way pawl by the slot is the version guard: raised, it stops the older reply, lowered or removed, the reply gets through.`,
    legend: [
      `Left block: the database. Right block: the cache entry for x. A filled block on top matches the database, a hollow one is stale.`,
      `Front rail: the fill reply, slow. Back rail: the invalidation event, fast.`,
      `Pawl by the slot: the version guard. Raised, it stops anything older than the entry's version. Lowered, anything gets through.`,
    ],
    caption: `Figure from ${src.company} ${src.year} (${src.postId}). The race and the version field follow the post's example, including the case where the newer entry is evicted before the older reply arrives. Next step moves one event on. The two switches change how it ends: with the guard off the old reply always wins, and with the entry evicted the guard has nothing to compare against.`,
  };
}
