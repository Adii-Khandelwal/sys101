import { describe, expect, it } from "vitest";
import { tallyBundles, tallyPath } from "./tally";

describe("tally marks", () => {
  it("groups in fives", () => {
    expect(tallyBundles(0)).toEqual({ fives: 0, rest: 0 });
    expect(tallyBundles(4)).toEqual({ fives: 0, rest: 4 });
    expect(tallyBundles(5)).toEqual({ fives: 1, rest: 0 });
    expect(tallyBundles(13)).toEqual({ fives: 2, rest: 3 });
    expect(tallyBundles(-2)).toEqual({ fives: 0, rest: 0 });
  });
  it("draws one stroke per topic, plus a strike per five", () => {
    const strokes = (n: number) => (tallyPath(n).d.match(/M/g) ?? []).length;
    expect(strokes(0)).toBe(0);
    expect(strokes(3)).toBe(3);
    expect(strokes(5)).toBe(5);
    expect(strokes(12)).toBe(12 - 10 + 2 * 5);
  });
  it("widens with the count", () => {
    expect(tallyPath(10).width).toBeGreaterThan(tallyPath(5).width);
  });
});
