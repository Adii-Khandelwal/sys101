import { describe, expect, it, vi } from "vitest";
import { headingProgress, riseQ, trackRise } from "./letterRise";

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

  it("clears its inline styles on cleanup, so a persistent logo is visible on the next page", () => {
    const letter = { style: { opacity: "", transform: "" } };
    const root = { querySelectorAll: () => [letter] } as unknown as HTMLElement;
    const h1 = { getBoundingClientRect: () => ({ bottom: 900 }) } as unknown as HTMLElement; // far below the header: progress 0
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }), addEventListener() {}, removeEventListener() {} });
    vi.stubGlobal("document", { querySelector: () => ({ offsetHeight: 60 }) });
    vi.stubGlobal("requestAnimationFrame", () => 1);
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const stop = trackRise(h1, root);
    expect(letter.style.opacity).toBe("0");
    stop();
    expect(letter.style).toEqual({ opacity: "", transform: "" });
    vi.unstubAllGlobals();
  });
});
