// Model and wording of the membership-filter rig (Meta 2021, Ribbon filter). Pure.
// The post gives: a filter over-approximates a set so most absent keys are rejected; a Ribbon filter is built by
// solving a linear system from hash functions of the keys, keys going in one after another; a query XORs the values
// at some array positions and must give a set result for a key that is "in"; Bloom uses roughly 50 percent more
// space than the lower bound, Ribbon as little as 1 percent. The 12 cells, the five keys, three positions per key,
// one-bit cells and the choice to leave unconstrained cells at 0 are this figure's own example, not the post's.
import type { FigureSource } from "./figures";

/** bloomOverhead, ribbonOverhead: percent of space above the information-theoretic lower bound. */
export type FilterInputs = { bloomOverhead: number; ribbonOverhead: number };
export const filterValid = (i: FilterInputs) => i.ribbonOverhead > 0 && i.bloomOverhead > i.ribbonOverhead && i.bloomOverhead <= 50;

export const CELLS = 12;
export const FILTER_STEPS = 8;
export const filterLast = FILTER_STEPS - 1;

/** Keys A to C are added; D and E are never added. Three cell positions each, the figure's own example. */
export const KEYS = [
  { name: "A", cells: [3, 8, 10] },
  { name: "B", cells: [2, 7, 9] },
  { name: "C", cells: [2, 3, 6] },
  { name: "D", cells: [2, 5, 8] },
  { name: "E", cells: [3, 6, 8] },
] as const;
export type KeyName = (typeof KEYS)[number]["name"];
const ADDED = 3;

/** One solution of "the cells under every key add up (XOR) to 1" by Gauss-Jordan elimination; cells that no equation fixes stay 0. */
export function solveCells(keys: readonly (readonly number[])[]): number[] {
  const rows = keys.map((k) => ({ mask: k.reduce((m, p) => m | (1 << p), 0), rhs: 1 }));
  const pivots: [number, number][] = [];
  let next = 0;
  for (let c = 0; c < CELLS; c++) {
    const p = rows.findIndex((r, idx) => idx >= next && (r.mask >> c) & 1);
    if (p < 0) continue;
    [rows[next], rows[p]] = [rows[p], rows[next]];
    for (let r = 0; r < rows.length; r++) {
      if (r === next || !((rows[r].mask >> c) & 1)) continue;
      rows[r].mask ^= rows[next].mask;
      rows[r].rhs ^= rows[next].rhs;
    }
    pivots.push([c, next++]);
  }
  const bits = Array<number>(CELLS).fill(0);
  for (const [c, r] of pivots) bits[c] = rows[r].rhs;
  return bits;
}

const keyOf = (n: KeyName) => KEYS.find((k) => k.name === n)!;
const xorAt = (bits: number[], cells: readonly number[]) => cells.reduce((s, c) => s ^ bits[c], 0);
const list = (a: readonly number[]) => a.map((c) => c + 1).join(", ");

export type FilterState = {
  bits: number[];
  added: KeyName[];
  probe: { key: KeyName; cells: number[]; tall: number[]; xor: 0 | 1 } | null;
  /** Lamp on: the probe reads 1, which means "maybe present". */
  lamp: boolean;
  bars: boolean;
  headline: string;
  readout: string;
  space: string;
};

/** Space as a multiple of the lower bound, and the saving of Ribbon over Bloom in percent. */
export const spaceOf = (i: FilterInputs) => {
  const bloom = 100 + i.bloomOverhead;
  const ribbon = 100 + i.ribbonOverhead;
  return { bloom, ribbon, saved: Math.round((1 - ribbon / bloom) * 100) };
};

export function filterState(i: FilterInputs, step: number): FilterState {
  const at = Math.min(Math.max(step, 0), filterLast);
  const nAdded = at === 0 ? 0 : Math.min(at, ADDED);
  const added = KEYS.slice(0, nAdded).map((k) => k.name);
  const bits = solveCells(KEYS.slice(0, nAdded).map((k) => k.cells));
  const probeKey: KeyName | null = at >= 1 && at <= 3 ? KEYS[at - 1].name : at === 4 ? "A" : at === 5 ? "D" : at === 6 ? "E" : null;
  const probe = probeKey && (() => {
    const cells = [...keyOf(probeKey).cells];
    return { key: probeKey, cells, tall: cells.filter((c) => bits[c]), xor: xorAt(bits, cells) as 0 | 1 };
  })();
  const sp = spaceOf(i);
  const p = probe;
  const reads = p ? `Key ${p.key} points at cells ${list(p.cells)}. Raised cells under the probe: ${p.tall.length ? list(p.tall) : "none"}, so the sum is ${p.xor}.` : "";
  const headline =
    at === 0
      ? "Twelve cells, all 0. No key has been added."
      : at <= 3
        ? `Add key ${KEYS[at - 1].name}. The cells are re-solved so that every added key sums to 1, and key ${KEYS[at - 1].name} now reads 1 (maybe present).`
        : at === 4
          ? "Look up key A, which was added. The sum is 1, so the filter says maybe present."
          : at === 5
            ? "Look up key D, which was never added. Its cells also sum to 1, so the filter says maybe present: a false positive."
            : at === 6
              ? "Look up key E, which was never added. Its cells sum to 0, so it is definitely absent."
              : `Space, as a multiple of the lower bound: Bloom about ${sp.bloom / 100}, Ribbon as little as ${sp.ribbon / 100}. That is about ${sp.saved}% less than Bloom, the post's "roughly 1/3".`;
  const readout = at === 0 ? "Added keys: none" : `Added keys: ${added.join(", ")}. Raised cells: ${bits.flatMap((b, c) => (b ? [c + 1] : [])).join(", ") || "none"}.${reads ? ` ${reads}` : ""}`;
  const space = `The post puts a well-built Bloom filter about ${i.bloomOverhead}% above the lower bound and Ribbon variants as low as ${i.ribbonOverhead}% or less.`;
  return { bits, added, probe, lamp: !!probe && probe.xor === 1, bars: at === filterLast, headline, readout, space };
}

export function filterText(i: FilterInputs, src: FigureSource) {
  const sp = spaceOf(i);
  return {
    title: "Membership filter as a bit array",
    description: `A row of twelve cells, each with a pin that is flat for 0 and raised for 1. A bridge over the row carries a probe with three legs that stand over the three cells a key points at; a lamp on the bridge lights when the number of raised cells under the legs is odd, which the filter reports as maybe present. Keys A, B and C are added one after another and the pins are re-solved each time. Looking up A lights the lamp. Looking up D, which was never added, also lights it: a false positive. Looking up E leaves it dark: definitely absent. In the last step three bars in front of the row compare space: the lower bound, a Bloom filter at ${sp.bloom / 100} times that and a Ribbon filter at ${sp.ribbon / 100} times.`,
    legend: [
      `Row of pins: the filter's array, one cell each. A flat pin is 0 and a raised pin is 1. Cells are counted from the left.`,
      `Bridge and legs: the probe. Its three legs stand over the cells a key points at; raised pins under them are counted, and an odd count lights the lamp (maybe present). An even count leaves it dark (definitely absent).`,
      `Three bars (last step): space needed. Rear, the lower bound (1 times); middle, Bloom (${sp.bloom / 100} times); front and lit, Ribbon (${sp.ribbon / 100} times). Lengths follow the post's percentages.`,
    ],
    caption: `Figure from ${src.company} ${src.year} (${src.postId}). The mechanism follows the post: a filter over-approximates the set of keys, a query combines (XOR) the values at some array positions and must give a set result for a key that is in, the array is found by solving equations as keys go in, and Bloom uses about ${i.bloomOverhead} percent more space than the lower bound against as low as ${i.ribbonOverhead} percent for Ribbon. The twelve cells, the five keys, three positions per key, one-bit cells and leaving unconstrained cells at 0 are drawn for the example and are not from the post, which gives no false positive rate and no cell layout; a real filter would let few absent keys through, and this one is built to show the one that gets through.`,
  };
}
