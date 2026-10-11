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

/**
 * Transitive reduction: drop an edge u -> v when v is still reachable from u
 * through a longer path (DNS -> CDNs is implied by DNS -> Load Balancing ->
 * Caching -> CDNs). Only the drawing uses this; prerequisite data, "Builds
 * on" lists, ready state and build checks keep the full edge set.
 */
export function transitiveReduction(edges: Edge[]): Edge[] {
  const out = new Map<string, string[]>();
  for (const e of edges) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  // Is `to` reachable from `from` without using the direct edge from -> to?
  const viaLonger = (from: string, to: string) => {
    const seen = new Set<string>();
    const stack = (out.get(from) ?? []).filter((n) => n !== to);
    while (stack.length) {
      const n = stack.pop()!;
      if (n === to) return true;
      if (seen.has(n)) continue;
      seen.add(n);
      stack.push(...(out.get(n) ?? []));
    }
    return false;
  };
  return edges.filter((e) => !viaLonger(e.from, e.to));
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
  if (orientation === "vertical") return cols.flat().filter((n) => !isSlot(n)).length;
  const { min, max } = rowSpan(cols);
  return Math.round(max - min) + 1;
}

/**
 * Row positions on the grid of the tallest column (slots included, so long
 * edges keep their corridors), and the span actually used by real topics. A
 * row that only holds corridors is not given any height.
 */
function rowGrid(cols: (Node | Slot)[][]) {
  const rows = Math.max(1, ...cols.map((c) => c.length));
  const row = new Map<string, number>();
  cols.forEach((col) => {
    const first = (rows - col.length) / 2;
    col.forEach((n, i) => row.set(n.slug, first + i));
  });
  return row;
}

function rowSpan(cols: (Node | Slot)[][]) {
  const row = rowGrid(cols);
  const real = cols.flat().filter((n) => !isSlot(n)).map((n) => row.get(n.slug)!);
  return { min: Math.min(...real), max: Math.max(...real) };
}

export const NODE_RADIUS = 14;
/** A label starts this far right of its node's centre. */
export const LABEL_START = NODE_RADIUS + 8;
/** Smallest space between the end of a label and the edge of the next node. */
export const MIN_LABEL_GAP = 16;

/**
 * Pixel positions inside a `width` x `height` box (the stage minus its
 * padding), and the width the horizontal layout needs.
 *
 * Horizontal: each gap between columns is at least the widest label in the
 * left column plus MIN_LABEL_GAP, measured from `labelWidth`; spare width is
 * shared equally. Rows span only the rows real topics use, so there is no
 * empty band above or below. Vertical (narrow screens): one topic per row.
 * Sigma's y axis points up, so the first row gets the largest y.
 */
export function fitPositions(
  cols: (Node | Slot)[][],
  orientation: Orientation,
  box: { width: number; height: number; labelWidth: Map<string, number> },
) {
  const { width, height, labelWidth } = box;
  const widest = (col: (Node | Slot)[]) =>
    Math.max(0, ...col.filter((n) => !isSlot(n)).map((n) => labelWidth.get(n.slug) ?? 0));
  const positions = new Map<string, { x: number; y: number }>();

  if (orientation === "horizontal") {
    const gaps = cols.slice(0, -1).map((col) => LABEL_START + widest(col) + MIN_LABEL_GAP + NODE_RADIUS);
    const lastRoom = LABEL_START + widest(cols[cols.length - 1] ?? []);
    const required = gaps.reduce((a, b) => a + b, 0) + lastRoom;
    const extra = Math.max(0, width - required);
    const share = gaps.length ? extra / gaps.length : 0;
    const xs = [gaps.length ? 0 : extra / 2];
    gaps.forEach((g, i) => xs.push(xs[i] + g + share));

    const row = rowGrid(cols);
    const { min, max } = rowSpan(cols);
    const span = max - min;
    cols.forEach((col, c) => {
      for (const n of col) {
        const r = row.get(n.slug)!;
        const y = span > 0 ? height - ((r - min) / span) * height : height / 2;
        // A corridor outside the rows topics use would sit off the stage; keep it inside.
        positions.set(n.slug, { x: xs[c], y: isSlot(n) ? Math.min(height, Math.max(0, y)) : y });
      }
    });
    return { positions, required };
  }

  // One topic per row, a little in from the left edge so edges that bend
  // left have room, with labels running to the right.
  const order = cols.flat().filter((n) => !isSlot(n));
  const room = LABEL_START + widest(order);
  const x = Math.max(0, Math.min(32, width - room));
  const spread = (i: number, n: number) => (n > 1 ? (i * height) / (n - 1) : height / 2);
  order.forEach((n, i) => positions.set(n.slug, { x, y: height - spread(i, order.length) }));
  return { positions, required: x + room };
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

/** Drawn edges that touch a node they do not connect, any label, or the stage edge. For tests and checks. */
export function edgeCollisions(
  positions: Map<string, Point>,
  edges: Edge[],
  curvatures: Map<string, number>,
  labels: Map<string, { start: number; width: number }>,
  stage: { minX: number; maxX: number; minY: number; maxY: number },
) {
  const topics = [...positions].filter(([slug]) => labels.has(slug));
  return edges
    .filter((e) => !clear(positions.get(e.from)!, positions.get(e.to)!, curvatures.get(edgeKey(e)) ?? 0, e, topics, labels, stage))
    .map(edgeKey);
}

/** Smallest gap between a label's end and the edge of any node to its right on the same row. */
export function minLabelGap(positions: Map<string, Point>, labels: Map<string, { start: number; width: number }>) {
  let min = Infinity;
  for (const [a, p] of positions) {
    const l = labels.get(a);
    if (!l) continue;
    const end = p.x + l.start + l.width;
    for (const [b, q] of positions) {
      if (b === a || !labels.has(b) || q.x <= p.x || Math.abs(q.y - p.y) > NODE_RADIUS + 13) continue;
      min = Math.min(min, q.x - NODE_RADIUS - end);
    }
  }
  return min;
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
