import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { CELLS, KEYS, filterLast, filterState, filterText, filterValid, solveCells, spaceOf, type FilterInputs } from "./filterBits";

// Read the JSON directly: the registry (lib/figures.ts) knows the id only once the admin applies the snippets.
const topic = JSON.parse(fs.readFileSync("content/topics/probabilistic-data-structures.json", "utf8"));
const post = topic.posts.find((p: { digest: { figure?: { id: string } } }) => p.digest.figure?.id === "filter-bits");
const num = (row: number) => Number(post.digest.numbers[row].value.match(/\d[\d,]*(?:\.\d+)?/)[0].replace(/,/g, ""));
const i: FilterInputs = { bloomOverhead: num(post.digest.figure.rows.bloomOverhead), ribbonOverhead: num(post.digest.figure.rows.ribbonOverhead) };
const xor = (bits: number[], cells: readonly number[]) => cells.reduce((s, c) => s ^ bits[c], 0);

describe("filter bits model", () => {
  it("reads the post's numbers rows", () => {
    expect(i).toEqual({ bloomOverhead: 50, ribbonOverhead: 1 });
    expect(filterValid(i)).toBe(true);
    expect(spaceOf(i)).toEqual({ bloom: 150, ribbon: 101, saved: 33 });
  });

  it("solves every added key to 1 at each build step", () => {
    for (let n = 1; n <= 3; n++) {
      const bits = solveCells(KEYS.slice(0, n).map((k) => k.cells));
      expect(bits).toHaveLength(CELLS);
      for (const k of KEYS.slice(0, n)) expect(xor(bits, k.cells)).toBe(1);
    }
  });

  it("shows a true hit, a false positive and a definite miss", () => {
    const at = (s: number) => filterState(i, s);
    expect(at(4).probe).toMatchObject({ key: "A", xor: 1 });
    expect(at(4).lamp).toBe(true);
    expect(at(5).probe).toMatchObject({ key: "D", xor: 1 });
    expect(at(5).added).not.toContain("D");
    expect(at(5).lamp).toBe(true);
    expect(at(6).probe).toMatchObject({ key: "E", xor: 0 });
    expect(at(6).lamp).toBe(false);
    expect(at(6).added).not.toContain("E");
  });

  it("changes the array while keys go in, shows bars only on the last step and clamps the step", () => {
    const [b1, b2, b3] = [1, 2, 3].map((n) => filterState(i, n).bits.join(""));
    expect(new Set([b1, b2, b3]).size).toBe(3);
    expect(filterState(i, 0).bits.every((b) => b === 0)).toBe(true);
    expect([0, 1, 2, 3, 4, 5, 6].some((n) => filterState(i, n).bars)).toBe(false);
    expect(filterState(i, filterLast).bars).toBe(true);
    expect(filterState(i, 99).headline).toBe(filterState(i, filterLast).headline);
  });

  it("writes plain wording with the post's numbers and no em dash", () => {
    const t = filterText(i, { company: "Meta", year: "2021", postId: "ribbon-meta-2021" });
    const all = [t.title, t.description, ...t.legend, t.caption, ...Array.from({ length: filterLast + 1 }, (_, s) => filterState(i, s).headline)].join(" ");
    expect(all).not.toContain("—");
    expect(t.caption).toContain("50 percent");
    expect(t.caption).toContain("not from the post");
  });
});
