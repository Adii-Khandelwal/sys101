import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  LABEL_START,
  MIN_LABEL_GAP,
  MIN_LABEL_SCALE,
  chooseLayers,
  crossings,
  drawnCrossings,
  sample,
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
const PAD_TOP = 58;

describe("transitive reduction", () => {
  it("drops the shortcut in a small chain", () => {
    expect(keys(transitiveReduction([{ from: "a", to: "b" }, { from: "b", to: "c" }, { from: "a", to: "c" }]))).toEqual(["a->b", "b->c"]);
  });

  it("on this graph hides only the redundant shortcuts", () => {
    const dir = path.resolve(__dirname, "../content/topics");
    const topics = fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
    const edges = topics.flatMap((t) => t.prerequisites.map((p: string) => ({ from: p, to: t.slug })));
    const reduced = transitiveReduction(edges);
    expect(keys(edges).filter((k) => !keys(reduced).includes(k)).sort()).toEqual(["caching->rate-limiting", "databases->indexing", "databases->storage-engines", "dns->cdns", "http-tcp-tls->api-design-rpc-rest-graphql", "http-tcp-tls->cdns", "http-tcp-tls->real-time-delivery", "load-balancing->overload-and-cascading-failures", "load-balancing->safe-deployments", "rate-limiting->overload-and-cascading-failures", "replication->cap", "replication->consensus", "replication->disaster-recovery-and-backups", "replication->failover", "replication->object-storage", "sharding->distributed-transactions"]);
  });

  it("remembers the chosen layers for equal inputs, even for freshly built nodes", () => {
    const nodes = [{ slug: "a", title: "A" }, { slug: "b", title: "B" }, { slug: "c", title: "C" }];
    const es = [{ from: "a", to: "b" }, { from: "a", to: "c" }];
    const cols = layers(nodes, es);
    const box = { width: 800, height: 300, labelWidth: new Map(nodes.map((n) => [n.slug, 40])) };
    const stage = { minX: -40, maxX: 840, minY: -40, maxY: 300 };
    const first = chooseLayers(cols, es, box, stage);
    expect(chooseLayers(cols.map((c) => c.map((n) => ({ ...n }))), es, box, stage)).toBe(first);
  });

  it("keeps the chosen layers in the tab's session storage", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("window", { sessionStorage: { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) } });
    const nodes = [{ slug: "p", title: "P" }, { slug: "q", title: "Q" }];
    const es = [{ from: "p", to: "q" }];
    chooseLayers(layers(nodes, es), es, { width: 777, height: 250, labelWidth: new Map(nodes.map((n) => [n.slug, 30])) }, { minX: -40, maxX: 800, minY: -40, maxY: 250 });
    vi.unstubAllGlobals();
    expect(JSON.parse(data.get("sys101:layers")!)).toBeTruthy();
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
function plan(nodes: { slug: string; title: string }[], edges: E[], stageWidth: number, orientation: Orientation, perChar = 9.2, scale = 1) {
  const drawn = transitiveReduction(edges);
  const cols = layers(nodes, drawn);
  const labelWidth = new Map(nodes.map((n) => [n.slug, n.title.length * perChar * scale]));
  const width = stageWidth - PAD * 2;
  const rows = rowCount(cols, orientation);
  // Horizontal keeps the CSS stage-height cap; vertical (stacked) grows to fit every
  // node at full spacing, matching the uncapped .graph-stage[data-orientation="vertical"].
  const rawHeight = rows * 120 + 130;
  const height = (orientation === "horizontal" ? Math.min(rawHeight, 700) : rawHeight) - PAD - PAD_TOP;
  const stage = { minX: -PAD + 8, maxX: width + PAD - 8, minY: -PAD + 8, maxY: height + PAD_TOP - 24 };
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
    // Distance from the highest point of any edge to the stage's top line (the legend and controls row).
    topGap: height + PAD_TOP - Math.max(...drawn.map((e) => Math.max(...sample(positions.get(e.from)!, positions.get(e.to)!, bends.get(`${e.from}->${e.to}`) ?? 0).map((p) => p.y)))),
  };
}

describe("layout: no edge crosses a label or node, labels keep their gap", () => {
  const dir = path.resolve(__dirname, "../content/topics");
  const topics = fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  const nodes = topics.map((t) => ({ slug: t.slug, title: t.title }));
  const edges = topics.flatMap((t) => t.prerequisites.map((p: string) => ({ from: p, to: t.slug })));

  it("the current topics: a full-size horizontal map, laid out across the width it needs, is clean and wider than a 1320px stage", () => {
    // The desktop map is always horizontal at full-size labels, laid out across the width its
    // labels need; when that exceeds the viewport the stage renders at the content width and the
    // wrapper scrolls sideways. That full-size layout must be clean, and here it overflows 1320px.
    const base = new Map(nodes.map((n) => [n.slug, n.title.length * 7.8]));
    const drawn = transitiveReduction(edges);
    const required = fitPositions(layers(nodes, drawn), "horizontal", { width: 1320 - PAD * 2, height: 300, labelWidth: base, edges: drawn }).required;
    expect(required).toBeGreaterThan(1320 - PAD * 2); // wider than the stage, so the wrapper scrolls
    // Lay out across the natural width (plus stage padding), as the component does.
    const r = plan(nodes, edges, required + PAD * 2, "horizontal", 7.8, 1);
    expect(r.required).toBeLessThanOrEqual(r.width);
    expect(r.collisions).toEqual([]);
    expect(r.gap).toBeGreaterThanOrEqual(MIN_LABEL_GAP);
    expect(r.crossed).toEqual([]);
  }, 30000);

  it("the current topics: a full-size horizontal map laid out across its content width is clean", () => {
    // The desktop map no longer shrinks or stacks: it is always horizontal at full-size labels,
    // laid out across the width those labels need, and the wrapper scrolls when that exceeds the
    // viewport. The layout at full size must be collision- and crossing-free with its gap.
    const base = new Map(nodes.map((n) => [n.slug, n.title.length * 7.8]));
    const drawn = transitiveReduction(edges);
    const cols = layers(nodes, drawn);
    const required = fitPositions(cols, "horizontal", { width: 1320 - PAD * 2, height: 300, labelWidth: base, edges: drawn }).required;
    const r = plan(nodes, edges, required + PAD * 2, "horizontal", 7.8, 1);
    expect(r.required).toBeLessThanOrEqual(r.width);
    expect(r.collisions).toEqual([]);
    expect(r.crossed).toEqual([]);
    expect(r.gap).toBeGreaterThanOrEqual(MIN_LABEL_GAP);
  }, 60000);

  it("the current topics are clean across label widths, with room under the legend row", () => {
    for (const perChar of [7.5, 9.2]) {
      const base = new Map(nodes.map((n) => [n.slug, n.title.length * perChar]));
      const drawn = transitiveReduction(edges);
      const required = fitPositions(layers(nodes, drawn), "horizontal", { width: 1320 - PAD * 2, height: 300, labelWidth: base, edges: drawn }).required;
      const r = plan(nodes, edges, required + PAD * 2, "horizontal", perChar);
      expect([perChar, r.collisions]).toEqual([perChar, []]);
      expect([perChar, r.crossed]).toEqual([perChar, []]);
      expect(r.topGap).toBeGreaterThanOrEqual(24);
    }
  }, 120000);

  it("the smallest label scale keeps labels at 12px or more", () => {
    expect(MIN_LABEL_SCALE).toBeGreaterThanOrEqual(0.8);
    expect(18 * MIN_LABEL_SCALE).toBeGreaterThanOrEqual(12);
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
