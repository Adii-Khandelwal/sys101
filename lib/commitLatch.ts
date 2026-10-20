// Model and wording of the Percolator commit latch (Google 2010). Pure.
import type { FigureSource } from "./figures";

export type LatchInputs = { bobBefore: number; joeBefore: number; amount: number; oldTs: number; startTs: number; commitTs: number };

export const LATCH_STEPS = 5;
export const latchValid = (i: LatchInputs) => i.bobBefore >= i.amount && i.startTs > i.oldTs && i.commitTs > i.startTs;

type Cell = "none" | "tentative" | "committed";

type LatchState = {
  bobLock: boolean;
  joeLock: boolean;
  bobNew: Cell;
  joeNew: Cell;
  cord: boolean;
  headline: string;
  bob: string;
  joe: string;
  reader: string;
};

export function latchState(i: LatchInputs, step: number): LatchState {
  const at = Math.min(Math.max(step, 0), LATCH_STEPS - 1);
  const [bobAfter, joeAfter] = [i.bobBefore - i.amount, i.joeBefore + i.amount];
  const $ = (n: number) => `$${n}`;
  const bobNew: Cell = at === 0 ? "none" : at >= 3 ? "committed" : "tentative";
  const joeNew: Cell = at < 2 ? "none" : at >= 4 ? "committed" : "tentative";
  const bobLock = at === 1 || at === 2;
  const joeLock = at === 2 || at === 3;
  const cell = (name: string, before: number, after: number, lock: string, n: Cell) =>
    `${name}.bal  lock: ${lock}; data: ${$(before)} @${i.oldTs}${n === "none" ? "" : `, ${$(after)} @${i.startTs}`}; write record: ${n === "committed" ? `@${i.commitTs}, points at data @${i.startTs}` : "none yet"}`;
  const headline = [
    `Start: Bob has ${$(i.bobBefore)} and Joe has ${$(i.joeBefore)}, both written at timestamp ${i.oldTs}. The transfer moves ${$(i.amount)} from Bob to Joe.`,
    `The transaction locks Bob's cell and writes ${$(bobAfter)} at its start timestamp, ${i.startTs}. This lock is the primary.`,
    `It locks Joe's cell and writes ${$(joeAfter)} at ${i.startTs}. Joe's lock is a secondary and holds a reference to Bob's primary.`,
    `Commit point: one write erases Bob's primary lock and puts a write record at ${i.commitTs} in its place. The transaction is now committed, though Joe's lock is still there.`,
    `The secondary is cleaned up: Joe gets his write record at ${i.commitTs} and his lock is deleted.`,
  ][at];
  const reader = [
    `A reader sees Bob ${$(i.bobBefore)} and Joe ${$(i.joeBefore)}, both at ${i.oldTs}.`,
    `A reader of Bob's cell finds a lock, so the transaction has not committed.`,
    `A reader of Joe's cell finds a lock that points at Bob's cell, where the primary lock is still held, so the transaction has not committed.`,
    `A reader of Bob's cell now sees ${$(bobAfter)} at ${i.commitTs}. A reader of Joe's cell finds a lock, follows the reference, sees a write record at Bob's cell and rolls Joe's lock forward.`,
    `A reader sees Bob ${$(bobAfter)} and Joe ${$(joeAfter)}, both at ${i.commitTs}.`,
  ][at];
  return {
    bobLock,
    joeLock,
    bobNew,
    joeNew,
    cord: at === 2 || at === 3,
    headline,
    bob: cell("Bob", i.bobBefore, bobAfter, bobLock ? "primary" : "none", bobNew),
    joe: cell("Joe", i.joeBefore, joeAfter, joeLock ? "secondary" : "none", joeNew),
    reader,
  };
}

export function latchText(i: LatchInputs, src: FigureSource) {
  return {
    title: "Commit latch",
    description: `Two account cabinets, Bob's on the left and Joe's on the right. A transfer of $${i.amount} locks Bob's cabinet with a primary latch and Joe's with a padlock tied to that latch by a cord. One atomic write that clears the primary latch commits both.`,
    legend: [
      `Each cabinet is one cell. The old card is the balance before the transfer, the new card is the balance the transaction writes.`,
      `A hollow new card is tentative. A filled card with a flag is committed: the flag is the write record.`,
      `The large latch is the primary lock. The padlock is a secondary, tied to the primary by the cord.`,
    ],
    caption: `Figure from ${src.company} ${src.year} (${src.postId}). The five steps and the balances, timestamps and lock names follow the paper's own transfer example. Step through them with the buttons or the arrow keys. The commit point is step 4, when the primary lock is erased.`,
  };
}
