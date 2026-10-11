import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  LABEL_START,
  MIN_LABEL_GAP,
  chooseLayers,
  crossings,
  drawnCrossings,
  edgeCollisions,
  edgeCurvatures,
  fitPositions,
  layers,
  minLabelGap,
  rowCount,
  slotsByEdge,
  transitiveReduction,
  type Orientation,
} from "./graph";

type E = { from: string; to: string };
const keys = (es: E[]) => es.map((e) => `${e.from}->${e.to}`).sort();
const PAD = 48;
const PAD_TOP = 70;

describe("transitive reduction", () => {
  it("drops the shortcut in a small chain", () => {
    expect(keys(transitiveReduction([{ from: "a", to: "b" }, { from: "b", to: "c" }, { from: "a", to: "c" }]))).toEqual(["a->b", "b->c"]);
  });

  it("on this graph hides only DNS -> CDNs", () => {
    const dir = path.resolve(__dirname, "../content/topics");
    const topics = fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
    const edges = topics.flatMap((t) => t.prerequisites.map((p: string) => ({ from: p, to: t.slug })));
    const reduced = transitiveReduction(edges);
    expect(keys(edges).filter((k) => !keys(reduced).includes(k))).toEqual(["dns->cdns"]);
  });

  it("leaves a graph with no redundant edges unchanged", () => {
    const es = [{ from: "a", to: "b" }, { from: "b", to: "c" }, { from: "a", to: "d" }];
    expect(keys(transitiveReduction(es))).toEqual(keys(es));
  });

  it("keeps both sides of a diamond and drops its shortcut", () => {
    const diamond = [{ from: "a", to: "b" }, { from: "a", to: "c" }, { from: "b", to: "d" }, { from: "c", to: "d" }];
    expect(keys(transitiveReduction(diamond))).toEqual(keys(diamond));
    expect(keys(transitiveReduction([...diamond, { from: "a", to: "d" }]))).toEqual(keys(diamond));
  });
});

// Lay a graph out the way GraphView does, with label widths estimated at
// 9.2px per character (Newsreader 500 at 18px averages under 9px).
function plan(nodes: { slug: string; title: string }[], edges: E[], stageWidth: number, orientation: Orientation, perChar = 9.2) {
  const drawn = transitiveReduction(edges);
  const cols = layers(nodes, drawn);
  const labelWidth = new Map(nodes.map((n) => [n.slug, n.title.length * perChar]));
  const width = stageWidth - PAD * 2;
  const rows = rowCount(cols, orientation);
  const height = Math.min(rows * 120 + 142, 700) - PAD - PAD_TOP; // as the map: CSS stage height, 70px top padding
  const stage = { minX: -PAD + 8, maxX: width + PAD - 8, minY: -PAD + 8, maxY: height + PAD_TOP - 8 };
  const lay = orientation === "horizontal" ? chooseLayers(cols, drawn, { width, height, labelWidth }, stage) : cols;
  const { positions, required } = fitPositions(lay, orientation, { width, height, labelWidth, edges: drawn });
  const labels = new Map(nodes.map((n) => [n.slug, { start: LABEL_START, width: labelWidth.get(n.slug)! }]));
  const bends = edgeCurvatures(positions, drawn, slotsByEdge(lay, positions), stage, orientation, labels);
  const real = new Map([...positions].filter(([s]) => labels.has(s)));
  return {
    required,
    width,
    collisions: edgeCollisions(real, drawn, bends, labels, stage),
    gap: minLabelGap(real, labels),
    crossed: drawnCrossings(real, drawn, bends),
  };
}

describe("layout: no edge crosses a label or node, labels keep their gap", () => {
  const dir = path.resolve(__dirname, "../content/topics");
  const topics = fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  const nodes = topics.map((t) => ({ slug: t.slug, title: t.title }));
  const edges = topics.flatMap((t) => t.prerequisites.map((p: string) => ({ from: p, to: t.slug })));

  it("the current 8 topics at 1440px (stage 1120px)", () => {
    const r = plan(nodes, edges, 1120, "horizontal");
    expect(r.required).toBeLessThanOrEqual(r.width);
    expect(r.collisions).toEqual([]);
    expect(r.gap).toBeGreaterThanOrEqual(MIN_LABEL_GAP);
    expect(r.crossed).toEqual([]);
  });

  it("the current 8 topics at 1440px for any realistic label width", () => {
    for (const perChar of [7.5, 8, 8.5, 9.2, 10]) {
      const r = plan(nodes, edges, 1120, "horizontal", perChar);
      expect([perChar, r.collisions, r.crossed]).toEqual([perChar, [], []]);
    }
  });

  it("the current 8 topics stacked at 390px (stage 358px)", () => {
    const r = plan(nodes, edges, 358, "vertical");
    expect(r.collisions).toEqual([]);
    expect(r.crossed).toEqual([]);
  });

  it("a 25-node fixture, at the width its labels need", () => {
    const names = ["Queues", "Pub-Sub", "Rate Limiting", "Circuit Breakers", "Failover"];
    const n25 = Array.from({ length: 25 }, (_, i) => ({ slug: `t${i}`, title: `${names[i % 5]} ${Math.floor(i / 5) + 1}` }));
    const e25: E[] = [];
    for (let i = 5; i < 25; i++) {
      e25.push({ from: `t${i - 5}`, to: `t${i}` }); // previous layer, same lane
      if (i % 5 !== 0) e25.push({ from: `t${i - 6}`, to: `t${i}` }); // previous layer, lane above
    }
    e25.push({ from: "t0", to: "t15" }, { from: "t2", to: "t22" }, { from: "t1", to: "t11" }); // long and redundant edges
    const wide = plan(n25, e25, 100000, "horizontal").required + PAD * 2;
    const r = plan(n25, e25, wide, "horizontal");
    expect(r.collisions).toEqual([]);
    expect(r.gap).toBeGreaterThanOrEqual(MIN_LABEL_GAP);
  });
});

describe("edge crossings", () => {
  const dir = path.resolve(__dirname, "../content/topics");
  const topics = fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  const nodes = topics.map((t) => ({ slug: t.slug, title: t.title }));
  const edges = transitiveReduction(topics.flatMap((t) => t.prerequisites.map((p: string) => ({ from: p, to: t.slug }))));

  it("the current graph draws with zero crossings, identically every time", () => {
    expect(crossings(nodes, edges)).toBe(0);
    expect(JSON.stringify(layers(nodes, edges))).toBe(JSON.stringify(layers(nodes, edges)));
  });

  it("a 25-node fixture draws with zero crossings", () => {
    const n25 = Array.from({ length: 25 }, (_, i) => ({ slug: `t${i}`, title: `T${i}` }));
    const e25: E[] = [];
    for (let i = 5; i < 25; i++) {
      e25.push({ from: `t${i - 5}`, to: `t${i}` });
      if (i % 5 !== 0) e25.push({ from: `t${i - 6}`, to: `t${i}` });
    }
    e25.push({ from: "t0", to: "t15" }, { from: "t2", to: "t22" }, { from: "t1", to: "t11" });
    // Shuffled input order must not matter for the count.
    const shuffled = [...n25].sort((a, b) => ((Number(a.slug.slice(1)) * 7) % 25) - ((Number(b.slug.slice(1)) * 7) % 25));
    expect(crossings(shuffled, transitiveReduction(e25))).toBe(0);
  });
});
