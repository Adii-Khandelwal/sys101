import { describe, expect, it } from "vitest";
import { INTERACTIVE_MIN_NODES, mapIsInteractive, FADED_LABEL, INK, PAPER, EDGE, contrast, fade, highlightSet, nextHighlight, placeTooltip, type HighlightEvent } from "./graphUi";

describe("tooltip placement", () => {
  const tip = { w: 280, h: 72 };
  for (const view of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
    const r = 14;
    const spots = {
      "top-left": { x: 0, y: 0 },
      "top-right": { x: view.w, y: 0 },
      "bottom-left": { x: 0, y: view.h },
      "bottom-right": { x: view.w, y: view.h },
      top: { x: view.w / 2, y: 20 },
      bottom: { x: view.w / 2, y: view.h - 20 },
      left: { x: 10, y: view.h / 2 },
      right: { x: view.w - 10, y: view.h / 2 },
    };
    for (const [name, at] of Object.entries(spots)) {
      it(`stays inside a ${view.w}px viewport and off the node at ${name}`, () => {
        const p = placeTooltip({ ...at, r }, tip, view);
        expect(p.left).toBeGreaterThanOrEqual(8);
        expect(p.left + tip.w).toBeLessThanOrEqual(view.w - 8);
        // Never overlaps the node's box.
        const overlaps = p.top < at.y + r && p.top + tip.h > at.y - r && p.left < at.x + r && p.left + tip.w > at.x - r;
        expect(overlaps).toBe(false);
        if (at.y > tip.h + r + 16 && at.y < view.h - tip.h - r - 16) expect(p.top).toBeGreaterThanOrEqual(8);
      });
    }
    it(`flips below near the top and stays above otherwise (${view.w}px)`, () => {
      expect(placeTooltip({ x: view.w / 2, y: 30, r }, tip, view).placement).toBe("below");
      expect(placeTooltip({ x: view.w / 2, y: view.h / 2, r }, tip, view).placement).toBe("above");
      const below = placeTooltip({ x: view.w / 2, y: 30, r }, tip, view);
      expect(below.top + tip.h).toBeLessThanOrEqual(view.h - 8);
    });
  }
});

describe("fading", () => {
  it("faded labels keep WCAG AA contrast on the paper colour", () => {
    expect(contrast(FADED_LABEL, PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(INK, PAPER)).toBeGreaterThanOrEqual(4.5);
  });

  it("fades unrelated nodes and edges to 60%, not 30%", () => {
    expect(fade(EDGE)).toBe(fade(EDGE, 0.6));
    expect(contrast(fade(EDGE), PAPER)).toBeGreaterThan(contrast(fade(EDGE, 0.3), PAPER));
  });

  it("keeps the whole prerequisite chain and direct dependents opaque", () => {
    const edges = [{ from: "dns", to: "lb" }, { from: "lb", to: "cache" }, { from: "cache", to: "cdn" }, { from: "cache", to: "ch" }, { from: "ch", to: "shard" }];
    expect([...highlightSet("cache", edges)].sort()).toEqual(["cache", "cdn", "ch", "dns", "lb"]);
  });
});

describe("highlight clears", () => {
  const clears: HighlightEvent[] = [{ type: "leave" }, { type: "blur" }, { type: "escape" }, { type: "touchOutside" }, { type: "scroll" }, { type: "camera" }];
  for (const e of clears) {
    it(`on ${e.type}`, () => expect(nextHighlight("dns", e)).toBeNull());
  }
  it("sets on enter and focus", () => {
    expect(nextHighlight(null, { type: "enter", node: "dns" })).toBe("dns");
    expect(nextHighlight("dns", { type: "focus", node: "cdns" })).toBe("cdns");
  });
});

describe("map controls", () => {
  it("stay off until the map has 12 topics", () => {
    expect(mapIsInteractive(8)).toBe(false);
    expect(mapIsInteractive(11)).toBe(false);
    expect(mapIsInteractive(12)).toBe(true);
    expect(INTERACTIVE_MIN_NODES).toBe(12);
  });
});
