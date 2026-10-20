import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { INTERACTIVE_MIN_NODES, groupSet, mapIsInteractive, mapIsInteractiveAt, INK_SOFT, INK, PAPER, EDGE, contrast, fade, highlightSet, nextHighlight, placeTooltip, prerequisiteLines, type HighlightEvent } from "./graphUi";

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

  it("are never interactive on a phone, whatever the topic count", () => {
    // Phone: fixed map so a finger scrolls the page past it and a tap opens the topic.
    expect(mapIsInteractiveAt(12, true)).toBe(false);
    expect(mapIsInteractiveAt(50, true)).toBe(false);
    // Desktop: interactive only once there are enough topics.
    expect(mapIsInteractiveAt(11, false)).toBe(false);
    expect(mapIsInteractiveAt(12, false)).toBe(true);
    expect(mapIsInteractiveAt(13, false)).toBe(true);
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

describe("the Fit to size button", () => {
  const src = fs.readFileSync(path.resolve(__dirname, "../components/GraphView.tsx"), "utf8");
  it("is one text button, only on a map that can zoom and pan, and disabled while the view is fitted", () => {
    const at = src.indexOf("Fit to size");
    const button = src.slice(src.lastIndexOf("{interactive && (", at), src.indexOf("</button>", at));
    expect(button).toContain('className="text-button label graph-fit"');
    expect(button).toContain("onClick={() => fitAll()}");
    expect(button).toContain("disabled={fitted}");
    expect(src.match(/Fit to size/g)).toHaveLength(1);
    // the camera feeds its state, and there are still no zoom or show-all buttons on screen
    expect(src).toContain("setFitted(isFitted(state, fitRef.current))");
    expect(src).not.toMatch(/>\s*(Zoom in|Zoom out|Show all links|Fit all)\s*</);
  });
});
