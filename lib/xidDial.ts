// Model and wording of the transaction-id counter rig (Sentry 2015). Pure.
import type { FigureSource } from "./figures";

/** limit: the counter's peak in billions ("around 2 billion"). margin: ids left, in millions, at which Postgres stops accepting commands. */
export type XidInputs = { limit: number; margin: number };

export const xidValid = (i: XidInputs) => i.limit > 0 && i.margin > 0;

type XidEvent = "start" | "advance" | "climb" | "halt" | "recover";
export const XID_EVENTS: XidEvent[] = ["start", "advance", "climb", "halt", "recover"];
export const XID_LAST = XID_EVENTS.length - 1;

export type XidState = {
  event: XidEvent;
  /** Where the carriage sits on the rail. The post gives no counter readings, so the first three are for illustration. */
  pos: "start" | "first" | "far" | "halt";
  gate: "open" | "closed";
  writes: boolean;
  headline: string;
  readout: string;
};

export function xidState(i: XidInputs, step: number): XidState {
  const at = Math.min(Math.max(step, 0), XID_LAST);
  const event = XID_EVENTS[at];
  const pos = { start: "start", advance: "first", climb: "far", halt: "halt", recover: "halt" }[event] as XidState["pos"];
  const gate = event === "halt" ? "closed" : "open";
  const headline = {
    start: `The id counter is low. The first time a transaction changes rows (an INSERT, UPDATE or DELETE), the counter goes up by one.`,
    advance: `A transaction writes a row and the counter advances. The counter is what decides which row versions a transaction can see.`,
    climb: `A write-heavy database keeps advancing it. The absolute peak is around ${i.limit} billion, and it can be far lower in some situations.`,
    halt: `Fewer than ${i.margin} million ids are left before the maximum, so Postgres stops accepting commands. Reusing an id would make past transactions look like they are in the future. Sentry's replicas stayed readable.`,
    recover: `Vacuuming every table is the only way back without data loss. Sentry's autovacuums finished on all but one huge table; truncating it brought writes back five minutes later.`,
  }[event];
  const stop = `stops at fewer than ${i.margin} million left`;
  const readout = event === "recover" ? `writes accepted; peak about ${i.limit} billion; ${stop}` : event === "halt" ? `writes refused; peak about ${i.limit} billion; ${stop}` : `writes accepted; peak about ${i.limit} billion; ${stop}`;
  return { event, pos, gate, writes: event !== "halt", headline, readout };
}

export function xidText(i: XidInputs, src: FigureSource) {
  return {
    title: "Transaction id counter",
    description: `A carriage on a rail stands for the database's transaction id counter. It moves toward a stop block at the far end, the counter's peak of around ${i.limit} billion. Just before the stop block is a gate: when fewer than ${i.margin} million ids are left, the gate closes and Postgres refuses writes.`,
    legend: [
      `Lit block on the carriage: the id counter. It moves right each time a transaction changes rows.`,
      `Block at the right end: the counter's maximum, around ${i.limit} billion.`,
      `Gate in front of it: closed when fewer than ${i.margin} million ids are left, so Postgres stops accepting commands. The marked strip under the gate is that last stretch, drawn far wider than it is.`,
    ],
    caption: `Figure from ${src.company} ${src.year} (${src.postId}). The peak and the gate follow the post. The carriage's first positions are for illustration, because the post gives no counter readings, and the gate strip is not to scale: ${i.margin} million is a tiny part of ${i.limit} billion. The post does not say what the counter reads after the vacuums, so the carriage stays where it was.`,
  };
}
