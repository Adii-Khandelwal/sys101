import { describe, expect, it } from "vitest";
import { nextStation, revealDelta, groupSet, INK_SOFT, INK, PAPER, EDGE, contrast, fade, highlightSet, nextHighlight, placeTooltip, prerequisiteLines, type HighlightEvent } from "./graphUi";

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
    expect(contrast(INK_SOFT, PAPER)).toBeGreaterThanOrEqual(4.5);
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

  it("highlights exactly the nodes of a clicked group", () => {
    const nodes = [
      { slug: "mq", group: "Messaging" },
      { slug: "pubsub", group: "Messaging" },
      { slug: "cache", group: "Scaling" },
      { slug: "dns", group: "Data" },
    ];
    expect([...groupSet("Messaging", nodes)].sort()).toEqual(["mq", "pubsub"]);
    expect([...groupSet("Scaling", nodes)]).toEqual(["cache"]);
    expect([...groupSet("Nonexistent", nodes)]).toEqual([]);
  });
});

describe("highlight clears", () => {
  const clears: HighlightEvent[] = [{ type: "leave" }, { type: "blur" }, { type: "escape" }, { type: "touchOutside" }, { type: "scroll" }];
  for (const e of clears) {
    it(`on ${e.type}`, () => expect(nextHighlight("dns", e)).toBeNull());
  }
  it("sets on enter and focus", () => {
    expect(nextHighlight(null, { type: "enter", node: "dns" })).toBe("dns");
    expect(nextHighlight("dns", { type: "focus", node: "cdns" })).toBe("cdns");
  });
});

describe("map tooltip prerequisite lines", () => {
  const title = (slug: string) => ({ dns: "DNS", caching: "Caching", databases: "Databases" })[slug] ?? slug;
  const lines = (read: string[]) => prerequisiteLines(["dns", "caching"], read, title);

  it("joins three or more with commas, since a title may contain 'and'", () => {
    expect(prerequisiteLines(["a", "b", "c"], [], (x) => x.toUpperCase()).finish).toBe("Finish A, B, C first.");
  });
  it("says it once when nothing is read: only 'Finish ... first'", () => {
    expect(lines([])).toEqual({ builtOn: null, finish: "Finish DNS and Caching first." });
  });
  it("when one is read, the finish line drops it and the two lines differ", () => {
    expect(lines(["dns"])).toEqual({ builtOn: "Builds on: DNS, Caching", finish: "Finish Caching first." });
    expect(lines(["caching"])).toEqual({ builtOn: "Builds on: DNS, Caching", finish: "Finish DNS first." });
  });
  it("when all are read there is nothing to finish, only what it builds on", () => {
    expect(lines(["dns", "caching"])).toEqual({ builtOn: "Builds on: DNS, Caching", finish: null });
    expect(lines(["dns", "caching", "databases"])).toEqual({ builtOn: "Builds on: DNS, Caching", finish: null });
  });
  it("a topic with no prerequisites has neither line", () => {
    expect(prerequisiteLines([], [], title)).toEqual({ builtOn: null, finish: null });
  });
  it("a single unread prerequisite is named once", () => {
    expect(prerequisiteLines(["dns"], [], title)).toEqual({ builtOn: null, finish: "Finish DNS first." });
  });
});


describe("arrow keys between stations", () => {
  const px = new Map([["a", { x: 0, y: 100 }], ["b", { x: 100, y: 40 }], ["c", { x: 100, y: 130 }], ["d", { x: 100, y: 220 }], ["e", { x: 200, y: 100 }]]);
  const edges = [{ from: "a", to: "b" }, { from: "a", to: "c" }, { from: "b", to: "e" }, { from: "c", to: "e" }];
  it("left goes to the nearest prerequisite and right to the nearest topic that builds on this one", () => {
    expect(nextStation("ArrowRight", "a", px, edges)).toBe("c"); // c is 30 away, b is 60
    expect(nextStation("ArrowLeft", "e", px, edges)).toBe("c");
    expect(nextStation("ArrowLeft", "a", px, edges)).toBeNull();
    expect(nextStation("ArrowRight", "e", px, edges)).toBeNull();
  });
  it("up and down walk the column, and stop at its ends", () => {
    expect(nextStation("ArrowDown", "b", px, edges)).toBe("c");
    expect(nextStation("ArrowDown", "c", px, edges)).toBe("d");
    expect(nextStation("ArrowDown", "d", px, edges)).toBeNull();
    expect(nextStation("ArrowUp", "b", px, edges)).toBeNull();
  });
  it("other keys and unknown stations do nothing", () => {
    expect(nextStation("Enter", "a", px, edges)).toBeNull();
    expect(nextStation("ArrowUp", "zzz", px, edges)).toBeNull();
  });
});

describe("revealDelta (keyboard focus on a station that is off screen)", () => {
  it("is zero when the point is already inside the margins", () => {
    expect(revealDelta(300, 0, 1000)).toBe(0);
    expect(revealDelta(40, 0, 1000)).toBe(0);
  });
  it("moves left or up (negative) for a point before the low margin, and right or down for one past the high margin", () => {
    expect(revealDelta(-100, 0, 1000)).toBe(-140);
    expect(revealDelta(1200, 0, 1000, 40, 100)).toBe(300);
  });
  it("leaves room for a label that extends past the station", () => {
    expect(revealDelta(900, 0, 1000, 40, 40 + 150)).toBe(90);
  });
});
