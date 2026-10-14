import { describe, expect, it } from "vitest";
import { fadeProgress } from "./headerFade";

describe("fadeProgress", () => {
  it("is 0 at the top of the page and 1 once the heading's bottom edge touches the header", () => {
    expect(fadeProgress(0, 600, 56, 3000)).toBe(0);
    expect(fadeProgress(544, 600, 56, 3000)).toBe(1);
    expect(fadeProgress(484, 600, 56, 3000)).toBeCloseTo(0.5);
  });
  it("counts a heading too near the end of the page as arrived at the last scroll position, so the last headings take turns", () => {
    // Two headings 50px apart at the very end of a 1000px page in a 700px window: neither can reach the header on its own.
    const max = 300;
    expect(fadeProgress(max, 950, 56, max)).toBe(1);
    expect(fadeProgress(max, 1000, 56, max)).toBe(1);
    expect(fadeProgress(max - 200, 1000, 56, max)).toBe(0);
  });
  it("shows nothing on a page that cannot scroll", () => {
    expect(fadeProgress(0, 300, 56, 0)).toBe(0);
  });
  it("is 1 at once for a heading that starts above the header", () => {
    expect(fadeProgress(0, 40, 56, 3000)).toBe(1);
  });
});
