import { describe, expect, it } from "vitest";
import { flyTransform, headingProgress, riseQ } from "./letterRise";

describe("letterRise", () => {
  it("is 0 at the start, 1 at the end, and letters arrive in order", () => {
    expect(headingProgress(500, 60, 500)).toBe(0);
    expect(headingProgress(60, 60, 500)).toBe(1);
    expect(headingProgress(170, 60, 170)).toBe(0); // heading near the top of the page: nothing shows before any scroll
    const n = 6;
    expect(Array.from({ length: n }, (_, i) => riseQ(0, i, n))).toEqual(Array(n).fill(0));
    expect(Array.from({ length: n }, (_, i) => riseQ(1, i, n))).toEqual(Array(n).fill(1));
    const mid = Array.from({ length: n }, (_, i) => riseQ(0.5, i, n));
    expect([...mid].sort((a, b) => b - a)).toEqual(mid);
  });

  it("moves a letter by its full offset and scale only once it has arrived", () => {
    expect(flyTransform(-40, -90, 0.4, 0)).toBe("translate(0px, 0px) scale(1)");
    expect(flyTransform(-40, -90, 0.4, 1)).toBe("translate(-40px, -90px) scale(0.4)");
  });
});
