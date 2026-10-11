import { describe, expect, it } from "vitest";
import { logoScrollsInPlace, scrollBehavior, showBackToTop } from "./scrollTop";
import { ACCENT, EDGE, INK, INK_SOFT, PAPER, contrast } from "./graphUi";

describe("back to top visibility", () => {
  const vh = 800;
  it("stays hidden until 1.5 screens down", () => {
    expect(showBackToTop(0, vh, false)).toBe(false);
    expect(showBackToTop(1200, vh, false)).toBe(false);
    expect(showBackToTop(1201, vh, false)).toBe(true);
  });
  it("hides again near the top, without flickering at the threshold", () => {
    expect(showBackToTop(1000, vh, true)).toBe(true);
    expect(showBackToTop(700, vh, true)).toBe(false);
  });
});

describe("scrolling", () => {
  it("is instant under reduced motion and smooth otherwise", () => {
    expect(scrollBehavior(true)).toBe("auto");
    expect(scrollBehavior(false)).toBe("smooth");
  });
  it("the logo scrolls in place only on the homepage", () => {
    expect(logoScrollsInPlace("/")).toBe(true);
    for (const p of ["/topic/dns", "/data", "/terms", "/privacy", "/missing"]) expect(logoScrollsInPlace(p)).toBe(false);
  });
});

describe("contrast", () => {
  it("wordmark and button text pass AA; the mark passes the 3:1 graphics bar", () => {
    expect(contrast(INK, PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(INK_SOFT, PAPER)).toBeGreaterThanOrEqual(4.5); // button text
    expect(contrast(ACCENT, PAPER)).toBeGreaterThanOrEqual(3);
    expect(contrast(EDGE, PAPER)).toBeGreaterThanOrEqual(3);
  });
});
