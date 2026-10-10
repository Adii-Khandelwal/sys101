// Layered layout for the prerequisite graph. Pure functions, shared by the
// server (to order the index) and the client (to place nodes), so the index
// numbering always matches the order of the map.

type Node = { slug: string; title: string };
type Edge = { from: string; to: string };

/** A topic's depth is the length of its longest prerequisite chain. */
export function depths(nodes: Node[], edges: Edge[]) {
  const prereqs = new Map(nodes.map((n) => [n.slug, [] as string[]]));
  for (const e of edges) if (prereqs.has(e.from)) prereqs.get(e.to)?.push(e.from);

  const depth = new Map<string, number>();
  const visit = (slug: string, seen: Set<string>): number => {
    if (depth.has(slug)) return depth.get(slug)!;
    if (seen.has(slug)) return 0; // cycle guard
    seen.add(slug);
    const parents = prereqs.get(slug) ?? [];
    const d = parents.length ? 1 + Math.max(...parents.map((p) => visit(p, seen))) : 0;
    depth.set(slug, d);
    return d;
  };
  nodes.forEach((n) => visit(n.slug, new Set()));
  return depth;
}

/** A placeholder in a column that a long edge passes through. Never drawn. */
export type Slot = { slug: string; title: ""; slot: true; edge: string };

const edgeKey = (e: Edge) => `${e.from}->${e.to}`;

/**
 * Columns by depth, with a reserved slot in every column a long edge crosses
 * (the usual trick for drawing layered graphs). Slots keep a corridor free,
 * so the edge can be drawn through it instead of across other topics.
 *
 * Within a column, entries are ordered by the average position of what feeds
 * them in the previous column (fewer crossings), then by title, so the result
 * is the same on every load.
 */
export function layers<T extends Node>(nodes: T[], edges: Edge[]): (T | Slot)[][] {
  const depth = depths(nodes, edges);
  const cols: (T | Slot)[][] = [];
  const add = (d: number, n: T | Slot) => (cols[d] ??= []).push(n);
  nodes.forEach((n) => add(depth.get(n.slug)!, n));

  // Each column entry's predecessors in the previous column.
  const feeds = new Map<string, string[]>();
  const link = (from: string, to: string) => feeds.set(to, [...(feeds.get(to) ?? []), from]);
  for (const e of edges) {
    if (!depth.has(e.from) || !depth.has(e.to)) continue;
    let prev = e.from;
    for (let d = depth.get(e.from)! + 1; d < depth.get(e.to)!; d++) {
      const slot: Slot = { slug: `${edgeKey(e)}#${d}`, title: "", slot: true, edge: edgeKey(e) };
      add(d, slot);
      link(prev, slot.slug);
      prev = slot.slug;
    }
    link(prev, e.to);
  }

  const rank = new Map<string, number>();
  return cols.map((col) => {
    const score = (n: T | Slot) => {
      const ps = (feeds.get(n.slug) ?? []).filter((p) => rank.has(p)).map((p) => rank.get(p)!);
      return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0;
    };
    const sorted = [...col].sort(
      (a, b) => score(a) - score(b) || a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug),
    );
    sorted.forEach((n, i) => rank.set(n.slug, i));
    return sorted;
  });
}

const isSlot = (n: Node | Slot): n is Slot => "slot" in n;

/** Topics only, grouped and ordered as on the map. Used for the index too. */
export function columns<T extends Node>(nodes: T[], edges: Edge[]): T[][] {
  return layers(nodes, edges).map((col) => col.filter((n): n is T => !isSlot(n)));
}

/** Reserved slot positions for each long edge, in order from source to target. */
export function slotsByEdge(cols: (Node | Slot)[][], positions: Map<string, { x: number; y: number }>) {
  const out = new Map<string, { x: number; y: number }[]>();
  for (const col of cols) {
    for (const n of col) {
      if (!isSlot(n) || !positions.has(n.slug)) continue;
      out.set(n.edge, [...(out.get(n.edge) ?? []), positions.get(n.slug)!]);
    }
  }
  return out;
}

export type Orientation = "horizontal" | "vertical";

/**
 * Rows the stage must hold: the tallest column when horizontal. When stacked
 * (narrow screens) every topic gets its own row, in map order, because two
 * topics side by side would put one's label over the other's node.
 */
export function rowCount(cols: (Node | Slot)[][], orientation: Orientation) {
  return orientation === "horizontal"
    ? Math.max(1, ...cols.map((c) => c.length))
    : cols.flat().filter((n) => !isSlot(n)).length;
}

/**
 * Pixel positions that fill a `width` x `height` box (the stage minus its
 * padding). Horizontal: columns run left to right, leaving `labelRoom` on the
 * right for the last column's labels. Vertical (narrow screens): the same
 * columns stacked top to bottom, each spread across the width. Sigma's y axis
 * points up, so the first row gets the largest y.
 */
export function fitPositions(
  cols: (Node | Slot)[][],
  orientation: Orientation,
  box: { width: number; height: number; labelRoom: number },
) {
  const { width, height, labelRoom } = box;
  const across = Math.max(0, width - labelRoom); // width available to node centres
  const spread = (i: number, n: number, span: number) => (n > 1 ? (i * span) / (n - 1) : span / 2);
  const positions = new Map<string, { x: number; y: number }>();

  if (orientation === "horizontal") {
    const rows = rowCount(cols, orientation);
    cols.forEach((col, c) => {
      // Centre a short column within the tallest one, on the same row grid.
      const first = (rows - col.length) / 2;
      col.forEach((n, i) => {
        positions.set(n.slug, {
          x: spread(c, cols.length, across),
          y: height - spread(first + i, rows, height),
        });
      });
    });
  } else {
    // One topic per row, a little in from the left edge so edges that bend
    // left have room, with labels running to the right.
    const order = cols.flat().filter((n) => !isSlot(n));
    const x = Math.min(32, across);
    order.forEach((n, i) => positions.set(n.slug, { x, y: height - spread(i, order.length, height) }));
  }
  return positions;
}

type Point = { x: number; y: number };

/**
 * Curvature for every edge. Edges are quadratic curves whose control point
 * sits `length * curvature` from the chord's midpoint along its normal
 * (-dy, dx), so the curve passes `length * curvature / 2` from the midpoint.
 * Positive curvature bends left-to-right edges up and top-to-bottom edges to
 * the right (sigma's y axis points up).
 *
 * Horizontal: a long edge is bent so its middle runs through its reserved
 * slots. A short edge bends toward where it is going, so it leaves its source
 * above or below the source's own label rather than through it.
 *
 * Vertical (one topic per row, labels on the right): edges bend left, just
 * enough to clear the topics they pass, and never past the stage.
 */
export function edgeCurvatures(
  positions: Map<string, Point>,
  edges: Edge[],
  slots: Map<string, Point[]>,
  stage: { minX: number; maxX: number; minY: number; maxY: number },
  orientation: Orientation,
  labels: Map<string, { start: number; width: number }>,
  clearance = 24,
) {
  const result = new Map<string, number>();
  const topics = [...positions].filter(([slug]) => labels.has(slug));
  for (const e of edges) {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const u = { x: dx / len, y: dy / len };
    const n = { x: -u.y, y: u.x };
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const key = edgeKey(e);

    if (orientation === "horizontal") {
      const through = slots.get(key);
      if (through?.length) {
        // Aim the curve's middle at the middle of its corridor.
        const m = through.length;
        const target = m % 2 ? through[(m - 1) / 2] : {
          x: (through[m / 2 - 1].x + through[m / 2].x) / 2,
          y: (through[m / 2 - 1].y + through[m / 2].y) / 2,
        };
        const offset = (target.x - mid.x) * n.x + (target.y - mid.y) * n.y;
        result.set(key, Math.max(-0.6, Math.min(0.6, (2 * offset) / len)));
      } else {
        const level = Math.abs(dy) < 1;
        result.set(key, level || dy > 0 ? 0.15 : -0.15);
      }
      continue;
    }

    // Vertical: bend left (negative for a downward edge) to clear topics in between.
    let need = len * 0.04;
    for (const [slug, p] of positions) {
      if (slug === e.from || slug === e.to) continue;
      const rx = p.x - a.x;
      const ry = p.y - a.y;
      const t = (rx * u.x + ry * u.y) / len;
      if (t <= 0.02 || t >= 0.98) continue;
      const d = -(rx * n.x + ry * n.y); // distance on the left side of the chord
      if (d < -clearance) continue;
      need = Math.max(need, (d + clearance) / (4 * t * (1 - t)));
    }
    const room = Math.max(0, mid.x - stage.minX); // left side, toward minX
    const h = Math.min(need, room);
    result.set(key, (dy <= 0 ? -1 : 1) * ((2 * h) / len));
  }

  // Final check by sampling: if a curve still touches a topic or a label, or
  // leaves the stage, bend it a little more (same side first, then the other).
  for (const e of edges) {
    const key = edgeKey(e);
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b || !result.has(key)) continue;
    const base = result.get(key)!;
    const sign = Math.sign(base) || 1;
    const candidates = [base];
    for (let k = 1; k <= 12; k++) candidates.push(base + sign * 0.05 * k);
    for (let k = 1; k <= 12; k++) candidates.push(base - sign * 0.05 * k);
    const ok = candidates.find((c) => Math.abs(c) <= 0.8 && clear(a, b, c, e, topics, labels, stage));
    if (ok !== undefined) result.set(key, ok);
  }
  return result;
}

/** Does the curve from a to b with curvature c stay on stage and off every other topic and label? */
function clear(
  a: Point,
  b: Point,
  c: number,
  e: Edge,
  topics: [string, Point][],
  labels: Map<string, { start: number; width: number }>,
  stage: { minX: number; maxX: number; minY: number; maxY: number },
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ctrl = { x: (a.x + b.x) / 2 - dy * c, y: (a.y + b.y) / 2 + dx * c };
  const NODE = 20; // radius plus margin
  const HALF = 13; // half a label's height plus margin
  for (let i = 1; i < 40; i++) {
    const t = i / 40;
    const x = (1 - t) ** 2 * a.x + 2 * t * (1 - t) * ctrl.x + t ** 2 * b.x;
    const y = (1 - t) ** 2 * a.y + 2 * t * (1 - t) * ctrl.y + t ** 2 * b.y;
    if (x < stage.minX || x > stage.maxX || y < stage.minY || y > stage.maxY) return false;
    for (const [slug, p] of topics) {
      const endpoint = slug === e.from || slug === e.to;
      if (!endpoint && Math.hypot(x - p.x, y - p.y) < NODE) return false;
      const l = labels.get(slug)!;
      if (x > p.x + l.start - 4 && x < p.x + l.start + l.width + 4 && Math.abs(y - p.y) < HALF) return false;
    }
  }
  return true;
}
