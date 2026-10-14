import { describe, expect, it } from "vitest";
import { headingProgress, riseQ } from "./letterRise";

describe("letterRise", () => {
  it("is 0 at the start, 1 at the end, and letters arrive in order", () => {
    expect(headingProgress(500, 60)).toBe(0);
    expect(headingProgress(60, 60)).toBe(1);
    const n = 6;
    expect(Array.from({ length: n }, (_, i) => riseQ(0, i, n))).toEqual(Array(n).fill(0));
    expect(Array.from({ length: n }, (_, i) => riseQ(1, i, n))).toEqual(Array(n).fill(1));
    const mid = Array.from({ length: n }, (_, i) => riseQ(0.5, i, n));
    expect([...mid].sort((a, b) => b - a)).toEqual(mid);
  });
});
