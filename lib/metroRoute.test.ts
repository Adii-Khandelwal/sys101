import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chooseLayers, fitPositions, layers, slotsByEdge, transitiveReduction, NODE_RADIUS } from "./graph";
import { CHAMFER, edgeId, handRing, labelProblems, ringProblems, routeEdges, routeHidden, routeProblems, routeShape, type Pt } from "./metroRoute";

const PAD = 48;
const PAD_TOP = 58;
const TOP_CLEAR = 24;
const dir = path.resolve(__dirname, "../content/topics");
const topics = fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
type N = { slug: string; title: string };
type E = { from: string; to: string };
const allNodes: N[] = topics.map((t) => ({ slug: t.slug, title: t.title })).sort((a, b) => a.title.localeCompare(b.title));
const allEdges: E[] = topics.flatMap((t) => t.prerequisites.map((p: string) => ({ from: p, to: t.slug })));

// Advance widths in px of every character in a topic title, measured in Chromium with the site's body font (Libre Caslon
// Text, 18px, weight 500 which resolves to the 400 face) via canvas measureText on the dev server. Summed per glyph they
// match the measured title widths to within 3% (kerning), so capital-heavy titles ("DNS", "CDNs") are not underestimated.
const GLYPH: Record<string, number> = { A: 13.39, P: 11.93, I: 6.73, " ": 4.9, D: 14.58, e: 10.08, s: 7.83, i: 5.4, g: 9.25, n: 11, C: 13.93, a: 9.45, p: 11.07, c: 9.63, t: 6.3, y: 10.3, h: 11.14, T: 13.57, o: 11.09, r: 7.47, m: 16.33, N: 14.9, u: 10.76, B: 12.58, k: 10.64, d: 10.93, L: 11.81, S: 10.78, H: 15.43, b: 10.84, R: 13.19, v: 10.19, E: 12.46, "-": 8.37, F: 11.7, l: 5.2, ",": 4.73, x: 10.42, M: 18.22, Q: 15.05, O: 15.05, j: 5.04, f: 6.32, ":": 5.11, V: 12.98 };
const titleWidth = (title: string) => [...title].reduce((sum, ch) => sum + (GLYPH[ch] ?? 11), 0);

/** Lay out and route the way GraphView does, with label widths from the glyph table times `wider`. Stage pixels, y down. */
function chart(nodes: N[], edges: E[], viewport: number, wider = 1) {
  const drawn = transitiveReduction(edges);
  const base = layers(nodes, drawn);
  const labelWidth = new Map(nodes.map((n) => [n.slug, titleWidth(n.title) * wider]));
  const rows = Math.max(...base.map((c) => c.length));
  const height = Math.min(rows * 120 + 130, 700) - PAD - PAD_TOP;
  const view = Math.max(1, viewport - PAD * 2);
  const needed = fitPositions(base, "horizontal", { width: view, height, labelWidth, edges: drawn }).required;
  const width = Math.max(view, needed);
  const stage = { minX: -PAD + 8, maxX: width + PAD - 8, minY: -PAD + 8, maxY: height + PAD_TOP - TOP_CLEAR };
  const lay = chooseLayers(base, drawn, { width, height, labelWidth }, stage);
  const { positions } = fitPositions(lay, "horizontal", { width, height, labelWidth, edges: drawn });
  const flip = (p: Pt): Pt => ({ x: p.x + PAD, y: height + PAD_TOP - p.y });
  const px = new Map([...positions].map(([k, p]) => [k, flip(p)]));
  const slots = slotsByEdge(lay, positions);
  const routes = routeEdges(
    px,
    drawn.map((e) => ({ from: e.from, to: e.to, via: (slots.get(edgeId(e)) ?? []).map(flip).sort((a, b) => a.x - b.x) })),
    labelWidth,
  );
  const frame = { minX: 0, maxX: width + PAD * 2, minY: 0, maxY: height + PAD + PAD_TOP };
  return { px, routes, labelWidth, frame };
}

describe("metro routing", () => {
  for (const viewport of [1280, 1440]) {
    it(`all ${allNodes.length} topics at ${viewport}px: no edge crosses an edge, station or label; no label overlaps`, () => {
      const c = chart(allNodes, allEdges, viewport);
      expect(c.routes.size).toBe(transitiveReduction(allEdges).length);
      expect(routeProblems(c.routes, c.px, c.labelWidth, c.frame)).toEqual([]);
      expect(labelProblems(c.px, c.labelWidth)).toEqual([]);
    }, 120000);
  }

  for (const viewport of [1280, 1440]) {
    it(`stays clean at ${viewport}px when every label runs 25% wider than measured`, () => {
      const c = chart(allNodes, allEdges, viewport, 1.25);
      expect([...routeProblems(c.routes, c.px, c.labelWidth, c.frame), ...labelProblems(c.px, c.labelWidth)]).toEqual([]);
    }, 120000);
  }

  it("whichever station the ring is on, it covers no other station or label", () => {
    for (const viewport of [1280, 1440]) {
      const c = chart(allNodes, allEdges, viewport, 1.25);
      const bad = allNodes.flatMap((n) => ringProblems(c.px, c.labelWidth, n.slug));
      expect(bad).toEqual([]);
    }
  }, 120000);

  it("the glyph table covers every character in every title", () => {
    expect(allNodes.flatMap((n) => [...n.title]).filter((ch) => !(ch in GLYPH))).toEqual([]);
  });

  it("a growing course (3 to 35 topics, in depth order) stays clean at both widths", () => {
    // Prefixes by prerequisite depth, as the course grew: every prefix is closed under prerequisites.
    const depthOf = new Map<string, number>();
    const prereq = new Map(topics.map((t) => [t.slug, t.prerequisites as string[]]));
    const depth = (s: string): number => depthOf.get(s) ?? (depthOf.set(s, 1 + Math.max(-1, ...prereq.get(s)!.map(depth))), depthOf.get(s)!);
    const order = [...allNodes].sort((a, b) => depth(a.slug) - depth(b.slug) || a.title.localeCompare(b.title));
    const failures: string[] = [];
    for (let n = 3; n <= order.length; n++) {
      const keep = new Set(order.slice(0, n).map((x) => x.slug));
      const nodes = order.slice(0, n);
      const edges = allEdges.filter((e) => keep.has(e.from) && keep.has(e.to));
      for (const viewport of [1280, 1440]) {
        const c = chart(nodes, edges, viewport);
        const bad = [...routeProblems(c.routes, c.px, c.labelWidth, c.frame), ...labelProblems(c.px, c.labelWidth)];
        if (bad.length) failures.push(`${n} topics at ${viewport}: ${bad.join("; ")}`);
      }
    }
    expect(failures).toEqual([]);
  }, 600000);
});

describe("route geometry", () => {
  const labelWidth = new Map([["a", 60], ["b", 60]]);
  const pos = new Map<string, Pt>([["a", { x: 100, y: 100 }], ["b", { x: 300, y: 200 }]]);

  it("leaves and enters on the row, with 45-degree chamfers around one vertical", () => {
    const [pts] = [...routeEdges(pos, [{ from: "a", to: "b", via: [] }], labelWidth).values()];
    expect(pts).toHaveLength(6);
    expect(pts[0]).toEqual({ x: 100, y: 100 });
    expect(pts[5]).toEqual({ x: 300, y: 200 });
    expect(pts[1].y).toBe(100);
    expect(pts[4].y).toBe(200);
    expect(pts[2].x).toBe(pts[3].x);
    expect(pts[2].x - pts[1].x).toBe(CHAMFER);
    expect(pts[2].y - pts[1].y).toBe(CHAMFER);
    expect(pts[4].x - pts[3].x).toBe(CHAMFER);
    expect(pts[4].y - pts[3].y).toBe(CHAMFER);
  });

  it("columns closer than the label needs: the jog never runs into the arrowhead's run", () => {
    const close = new Map<string, Pt>([["a", { x: 100, y: 100 }], ["b", { x: 150, y: 200 }]]);
    const [pts] = [...routeEdges(close, [{ from: "a", to: "b", via: [] }], new Map([["a", 200], ["b", 60]])).values()];
    expect(pts[3].x + CHAMFER).toBeLessThanOrEqual(150 - NODE_RADIUS - 9);
  });

  it("keeps the vertical clear of the source's label", () => {
    const [pts] = [...routeEdges(pos, [{ from: "a", to: "b", via: [] }], labelWidth).values()];
    expect(pts[2].x - CHAMFER).toBeGreaterThan(100 - NODE_RADIUS + 60);
  });

  it("two edges from one station into two targets share the trunk without crossing", () => {
    const p = new Map<string, Pt>([["a", { x: 100, y: 200 }], ["b", { x: 300, y: 100 }], ["c", { x: 300, y: 300 }]]);
    const w = new Map([["a", 60], ["b", 60], ["c", 60]]);
    const routes = routeEdges(p, [{ from: "a", to: "b", via: [] }, { from: "a", to: "c", via: [] }], w);
    expect(routeProblems(routes, p, w, { minX: 0, maxX: 400, minY: 0, maxY: 400 })).toEqual([]);
  });

  it("the drawn shape stops at the station rims and ends in an arrowhead on the target's rim", () => {
    const s = routeShape([{ x: 0, y: 0 }, { x: 100, y: 0 }], NODE_RADIUS);
    expect(s.d).toBe(`M${NODE_RADIUS},0 L${100 - NODE_RADIUS - 9 + 0.5},0`);
    expect(s.head.startsWith(`${100 - NODE_RADIUS},0 `)).toBe(true);
  });

  it("hint routes for the hidden edges keep off every station and label", () => {
    const c = chart(allNodes, allEdges, 1440);
    const drawn = new Set(transitiveReduction(allEdges).map(edgeId));
    const hidden = allEdges.filter((e) => !drawn.has(edgeId(e)));
    expect(hidden.length).toBeGreaterThan(0);
    const routes = routeHidden(c.px, hidden, c.labelWidth);
    expect(routes.size).toBe(hidden.length);
    const bad = routeProblems(routes, c.px, c.labelWidth, c.frame).filter((p) => p.startsWith("edge-node") || p.startsWith("edge-label"));
    expect(bad).toEqual([]);
  }, 60000);

  it("the hand-drawn ring is the same every time and does not close exactly", () => {
    const d = handRing(100, 100, 80, 30);
    expect(handRing(100, 100, 80, 30)).toBe(d);
    const pts = d.split(/[ML] ?/).filter(Boolean).map((p) => p.split(" ").map(Number));
    expect(pts).toHaveLength(45);
    expect(Math.hypot(pts[0][0] - pts[44][0], pts[0][1] - pts[44][1])).toBeGreaterThan(1);
  });

  it("the audit sees a crossing, a station in the way and a label in the way", () => {
    const p = new Map<string, Pt>([["a", { x: 0, y: 0 }], ["b", { x: 200, y: 0 }], ["c", { x: 100, y: -50 }], ["d", { x: 100, y: 50 }], ["m", { x: 100, y: 0 }]]);
    const w = new Map([["a", 40], ["b", 40], ["c", 40], ["d", 40], ["m", 40]]);
    const stage = { minX: -50, maxX: 300, minY: -100, maxY: 100 };
    const routes = new Map<string, Pt[]>([
      ["a->b", [p.get("a")!, p.get("b")!]],
      ["c->d", [p.get("c")!, p.get("d")!]],
    ]);
    const found = routeProblems(routes, p, w, stage);
    expect(found).toContain("edge-edge a->b x c->d");
    expect(found).toContain("edge-node a->b through m");
    expect(found.some((x) => x.startsWith("edge-label c->d"))).toBe(true);
  });
});
