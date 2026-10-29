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
type Slot = { slug: string; title: ""; slot: true; edge: string };

const edgeKey = (e: Edge) => `${e.from}->${e.to}`;

/**
 * Columns by depth, with a reserved slot in every column a long edge crosses
 * (the usual trick for drawing layered graphs). Slots keep a corridor free,
 * so the edge can be drawn through it instead of across other topics.
 *
 * Within a column, entries are ordered by barycenter sweeps to cut edge
 * crossings, with ties broken by input order, so the result is the same on
 * every load.
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

  // Start in input (index) order, then barycenter sweeps: each entry moves to
  // the average grid row of its neighbours in the column before (down sweeps)
  // or after (up sweeps). Ties keep the current order, and the ordering with
  // the fewest crossings wins, so the result is identical on every load.
  const index = new Map(nodes.map((n, i) => [n.slug, i]));
  const sourceIndex = (n: T | Slot) => index.get(isSlot(n) ? n.edge.split("->")[0] : n.slug) ?? 0;
  const succ = new Map<string, string[]>();
  for (const [to, froms] of feeds) for (const f of froms) succ.set(f, [...(succ.get(f) ?? []), to]);
  // Dead ends (nothing leads on) sort after entries that continue, so edges
  // passing through a column stay together instead of running past a dead end.
  const deadEnd = (n: T | Slot) => (succ.has(n.slug) ? 0 : 1);

  // First pass, left to right: barycenter of predecessors, then dead ends last, then input order.
  let order: (T | Slot)[][] = [];
  cols.forEach((col, c) => {
    const row = rowGrid(order);
    const score = (n: T | Slot) => {
      const ps = (feeds.get(n.slug) ?? []).filter((p) => row.has(p)).map((p) => row.get(p)!);
      return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0;
    };
    order[c] = [...col].sort(
      (a, b) => (c > 0 ? score(a) - score(b) : 0) || deadEnd(a) - deadEnd(b) || sourceIndex(a) - sourceIndex(b),
    );
  });

  let best = order;
  let bestCount = countCrossings(order, feeds);
  for (let pass = 0; pass < 8 && bestCount > 0; pass++) {
    const down = pass % 2 === 0;
    const next = order.map((c) => [...c]);
    const range = down ? next.map((_, c) => c).slice(1) : next.map((_, c) => c).slice(0, -1).reverse();
    for (const c of range) {
      const row = rowGrid(next);
      const ref = down ? feeds : succ;
      const score = (n: T | Slot) => {
        const ns = (ref.get(n.slug) ?? []).filter((m) => row.has(m)).map((m) => row.get(m)!);
        return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : row.get(n.slug)!;
      };
      const scores = new Map(next[c].map((n) => [n.slug, score(n)]));
      next[c].sort((a, b) => scores.get(a.slug)! - scores.get(b.slug)!); // stable: ties keep order
    }
    order = next;
    const count = countCrossings(order, feeds);
    if (count < bestCount) [best, bestCount] = [order, count];
  }
  // Barycenter sweeps are a heuristic. Crossings only occur between neighbouring columns, so the
  // fewest-crossings ordering can be found exactly, column by column.
  if (bestCount > 0) {
    const exact = fewestCrossings(best, feeds);
    const count = countCrossings(exact, feeds);
    if (count < bestCount) [best, bestCount] = [exact, count];
  }
  return best;
}

/**
 * The ordering of every column with the fewest crossings, by dynamic programming over each
 * column's permutations (the cost of a column depends only on the column before it). Ties go to
 * the earlier permutation, so the result is the same on every load. Columns of more than 6
 * entries are left as they are.
 */
function fewestCrossings<T extends Node>(cols: (T | Slot)[][], feeds: Map<string, string[]>): (T | Slot)[][] {
  if (cols.some((c) => c.length > 6)) return cols;
  const perms = <U,>(a: U[]): U[][] =>
    a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
  const options = cols.map((c) => perms(c));
  const between = (prev: (T | Slot)[], cur: (T | Slot)[]) => {
    const at = new Map(prev.map((n, i) => [n.slug, i]));
    const segs = cur.flatMap((n, j) => (feeds.get(n.slug) ?? []).filter((f) => at.has(f)).map((f) => [at.get(f)!, j]));
    let count = 0;
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) if ((segs[i][0] - segs[j][0]) * (segs[i][1] - segs[j][1]) < 0) count++;
    }
    return count;
  };
  const cost = options.map(() => [] as number[]);
  const from = options.map(() => [] as number[]);
  options[0].forEach(() => cost[0].push(0));
  for (let c = 1; c < cols.length; c++) {
    options[c].forEach((cur) => {
      let bestCost = Infinity;
      let bestFrom = 0;
      options[c - 1].forEach((prev, p) => {
        const total = cost[c - 1][p] + between(prev, cur);
        if (total < bestCost) [bestCost, bestFrom] = [total, p];
      });
      cost[c].push(bestCost);
      from[c].push(bestFrom);
    });
  }
  let q = cost[cols.length - 1].indexOf(Math.min(...cost[cols.length - 1]));
  const result: (T | Slot)[][] = [];
  for (let c = cols.length - 1; c >= 0; c--) {
    result[c] = options[c][q];
    q = from[c][q];
  }
  return result;
}

/**
 * Order for the stacked (one per row) map: a topological order that keeps
 * each prerequisite chain together, so the edges, which all bend to the left,
 * nest instead of crossing. After placing a topic, the next one is the ready
 * topic whose prerequisite was placed most recently; ties go to input order.
 */
function stackOrder<T extends Node>(topics: T[], edges: Edge[]): T[] {
  const preds = new Map(topics.map((t) => [t.slug, edges.filter((e) => e.to === t.slug).map((e) => e.from)]));
  const placed = new Map<string, number>();
  const out: T[] = [];
  while (out.length < topics.length) {
    const ready = topics.filter((t) => !placed.has(t.slug) && preds.get(t.slug)!.every((p) => placed.has(p) || !preds.has(p)));
    const recency = (t: T) => Math.max(-1, ...preds.get(t.slug)!.map((p) => placed.get(p) ?? -1));
    // Most recent prerequisite first; on a tie, the topic with the smaller branch below it first, so its
    // edge closes before the bigger branch opens (a dead end has the smallest branch, zero).
    const below = (slug: string): number => {
      const seen = new Set<string>();
      const walk = (x: string) => edges.filter((e) => e.from === x && !seen.has(e.to)).forEach((e) => (seen.add(e.to), walk(e.to)));
      walk(slug);
      return seen.size;
    };
    // A topic that starts a new chain (no prerequisite placed yet) goes the other way: the longest chain
    // first, so a shorter chain is placed just before the topic it joins and its edge stays short.
    const next = ready.reduce((best, t) => {
      const d = recency(t) - recency(best);
      if (d !== 0) return d > 0 ? t : best;
      const fewer = below(t.slug) - below(best.slug);
      return (recency(t) === -1 ? fewer > 0 : fewer < 0) ? t : best;
    }, ready[0]);
    placed.set(next.slug, out.length);
    out.push(next);
  }
  return out;
}

/** Pairs of drawn segments (slots included) that cross between adjacent columns. */
function countCrossings(cols: (Node | Slot)[][], feeds: Map<string, string[]>) {
  const row = rowGrid(cols);
  let count = 0;
  for (let c = 1; c < cols.length; c++) {
    const segs = cols[c].flatMap((n) => (feeds.get(n.slug) ?? []).filter((f) => row.has(f)).map((f) => [row.get(f)!, row.get(n.slug)!]));
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) {
        if ((segs[i][0] - segs[j][0]) * (segs[i][1] - segs[j][1]) < 0) count++;
      }
    }
  }
  return count;
}

/** Edge crossings in the drawn layout of these edges. */
export function crossings<T extends Node>(nodes: T[], edges: Edge[]) {
  const cols = layers(nodes, edges);
  const col = new Map(cols.flatMap((c, i) => c.map((n) => [n.slug, i] as const)));
  const feeds = new Map<string, string[]>();
  const link = (from: string, to: string) => feeds.set(to, [...(feeds.get(to) ?? []), from]);
  for (const e of edges) {
    if (!col.has(e.from) || !col.has(e.to)) continue;
    let prev = e.from;
    for (let d = col.get(e.from)! + 1; d < col.get(e.to)!; d++) {
      link(prev, `${edgeKey(e)}#${d}`);
      prev = `${edgeKey(e)}#${d}`;
    }
    link(prev, e.to);
  }
  return countCrossings(cols, feeds);
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
  cols.forEach((col, c) => {
    // shortcut: the first column sits half a row lower than centred, so Databases lands between Storage Engines and Transactions; revisit if the first column's edges change.
    const first = (rows - col.length) / 2 + (c === 0 && col.length < rows ? 0.5 : 0);
    col.forEach((n, i) => row.set(n.slug, first + i));
  });
  return row;
}

function rowSpan(cols: (Node | Slot)[][]) {
  const row = rowGrid(cols);
  const real = cols.flat().filter((n) => !isSlot(n)).map((n) => row.get(n.slug)!);
  return { min: Math.min(...real), max: Math.max(...real) };
}

/** Labels may shrink to this share of their full size to keep the horizontal map on narrower stages. */
export const MIN_LABEL_SCALE = 0.8;

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
 * The layout's y axis points up (the SVG map flips it), so the first row gets the largest y.
 */
export function fitPositions(
  cols: (Node | Slot)[][],
  orientation: Orientation,
  box: { width: number; height: number; labelWidth: Map<string, number>; edges?: Edge[] },
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
  const order = stackOrder(cols.flat().filter((n) => !isSlot(n)), box.edges ?? []);
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
 * the right (the layout's y axis points up; the SVG map flips it).
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

  // Then, where a clear bend crosses another edge, prefer a clear bend that does not.
  const curve = (e: Edge) => sample(positions.get(e.from)!, positions.get(e.to)!, result.get(edgeKey(e))!);
  const drawn = edges.filter((e) => result.has(edgeKey(e)));
  for (const e of drawn) {
    const others = drawn.filter((o) => o !== e && o.from !== e.from && o.from !== e.to && o.to !== e.from && o.to !== e.to);
    const crosses = (c: number) => {
      const mine = sample(positions.get(e.from)!, positions.get(e.to)!, c);
      return others.some((o) => polylinesCross(mine, curve(o)));
    };
    const key = edgeKey(e);
    if (!crosses(result.get(key)!)) continue;
    const a = positions.get(e.from)!;
    const b = positions.get(e.to)!;
    const base = result.get(key)!;
    const candidates: number[] = [];
    for (let k = 1; k <= 80; k++) candidates.push(base + 0.02 * k, base - 0.02 * k);
    const better = candidates.find((c) => Math.abs(c) <= 1 && clear(a, b, c, e, topics, labels, stage) && !crosses(c));
    if (better !== undefined) result.set(key, better);
  }
  return result;
}

/** Points along the quadratic curve the map draws for curvature c. */
export function sample(a: Point, b: Point, c: number, steps = 40) {
  const ctrl = { x: (a.x + b.x) / 2 - (b.y - a.y) * c, y: (a.y + b.y) / 2 + (b.x - a.x) * c };
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { x: (1 - t) ** 2 * a.x + 2 * t * (1 - t) * ctrl.x + t ** 2 * b.x, y: (1 - t) ** 2 * a.y + 2 * t * (1 - t) * ctrl.y + t ** 2 * b.y };
  });
}

function polylinesCross(p: Point[], q: Point[]) {
  const side = (a: Point, b: Point, c: Point) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  for (let i = 1; i < p.length; i++) {
    for (let j = 1; j < q.length; j++) {
      const [a, b, c, d] = [p[i - 1], p[i], q[j - 1], q[j]];
      if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0) return true;
    }
  }
  return false;
}

/** Pairs of drawn edges (not sharing a topic) whose curves cross. */
export function drawnCrossings(positions: Map<string, Point>, edges: Edge[], curvatures: Map<string, number>) {
  const drawn = edges.filter((e) => curvatures.has(edgeKey(e)) && positions.has(e.from) && positions.has(e.to));
  const curve = (e: Edge) => sample(positions.get(e.from)!, positions.get(e.to)!, curvatures.get(edgeKey(e))!);
  const out: string[] = [];
  drawn.forEach((e, i) =>
    drawn.slice(i + 1).forEach((o) => {
      if ([e.from, e.to].some((s) => s === o.from || s === o.to)) return;
      if (polylinesCross(curve(e), curve(o))) out.push(`${edgeKey(e)} x ${edgeKey(o)}`);
    }),
  );
  return out;
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

/**
 * The column ordering to draw, given real label widths: tries every ordering
 * within columns (only while there are few), keeps those with the same number
 * of rows, and returns the first with no edge touching a label or node and no
 * crossing; the barycenter ordering is tried first and is the fallback. Same
 * inputs, same result, so the map is identical on every load.
 */
export function chooseLayers<T extends Node>(
  base: (T | Slot)[][],
  edges: Edge[],
  box: { width: number; height: number; labelWidth: Map<string, number> },
  stage: { minX: number; maxX: number; minY: number; maxY: number },
  limit = 720,
) {
  // The search takes about 0.7s on a laptop and the map's layout effect asks again with the same inputs (every
  // re-run, every return to the homepage), so remember the answer, and keep it for the tab so a refresh skips it too.
  const key = JSON.stringify([base.map((c) => c.map((n) => `${n.slug}|${n.title}`)), edges.map((e) => `${e.from}>${e.to}`), box.width, box.height, [...box.labelWidth], stage, limit]);
  let hit = chosenLayers.get(key) as (T | Slot)[][] | undefined;
  if (!hit) {
    const slugs = readTabLayers(key);
    const bySlug = new Map(base.flat().map((n) => [n.slug, n] as const));
    const rebuilt = slugs?.map((c) => c.map((slug) => bySlug.get(slug) ?? (slug.startsWith("blank#") ? ({ slug, title: "", slot: true, edge: "" } as Slot) : undefined)));
    hit = rebuilt && rebuilt.every((c) => c.every(Boolean)) ? (rebuilt as (T | Slot)[][]) : undefined;
  }
  if (!hit) {
    hit = searchLayers(base, edges, box, stage, limit);
    writeTabLayers(key, hit.map((c) => c.map((n) => n.slug)));
  }
  // shortcut: keeps the 12 most recent widths, enough for resizing a window; upgrade if layouts become per-user.
  if (!chosenLayers.has(key) && chosenLayers.size >= 12) chosenLayers.delete(chosenLayers.keys().next().value!);
  chosenLayers.set(key, hit);
  return hit;
}

const chosenLayers = new Map<string, unknown>();

// The chosen ordering also lives in sessionStorage (slugs only, a pure speed-up with no personal data), so a refresh
// in the same tab does not repeat the search. Anything unreadable or blocked just means the search runs.
const TAB_KEY = "sys101:layers";
const fnv = (t: string) => [...t].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261).toString(36);
function readTabLayers(key: string): string[][] | undefined {
  try {
    const all = JSON.parse(window.sessionStorage.getItem(TAB_KEY) ?? "{}");
    const v = all[fnv(key) + key.length];
    return Array.isArray(v) && v.every((c) => Array.isArray(c) && c.every((x) => typeof x === "string")) ? v : undefined;
  } catch {
    return undefined;
  }
}
function writeTabLayers(key: string, slugs: string[][]) {
  try {
    const all = JSON.parse(window.sessionStorage.getItem(TAB_KEY) ?? "{}");
    const keys = Object.keys(all);
    if (keys.length >= 12) delete all[keys[0]];
    all[fnv(key) + key.length] = slugs;
    window.sessionStorage.setItem(TAB_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked or full: the next refresh searches again.
  }
}

function searchLayers<T extends Node>(
  base: (T | Slot)[][],
  edges: Edge[],
  box: { width: number; height: number; labelWidth: Map<string, number> },
  stage: { minX: number; maxX: number; minY: number; maxY: number },
  limit: number,
) {
  const perms = <U,>(a: U[]): U[][] =>
    a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
  const count = base.reduce((n, col) => n * [...Array(col.length)].reduce((f, _, i) => f * (i + 1), 1), 1);
  const rows = rowCount(base, "horizontal");
  const labels = new Map([...box.labelWidth].map(([slug, width]) => [slug, { start: LABEL_START, width }]));
  const score = (cols: (T | Slot)[][]) => {
    const { positions } = fitPositions(cols, "horizontal", box);
    const bends = edgeCurvatures(positions, edges, slotsByEdge(cols, positions), stage, "horizontal", labels);
    const real = new Map([...positions].filter(([s]) => labels.has(s)));
    return edgeCollisions(real, edges, bends, labels, stage).length * 1000 + drawnCrossings(real, edges, bends).length;
  };
  let best = base;
  let bestScore = score(base);
  if (bestScore === 0) return base;
  if (count <= limit) {
    const combos = base.reduce<(T | Slot)[][][]>((acc, col) => acc.flatMap((a) => perms(col).map((p) => [...a, p])), [[]]);
    for (const cols of combos) {
      if (rowCount(cols, "horizontal") !== rows) continue;
      const s = score(cols);
      if (s < bestScore) [best, bestScore] = [cols, s];
      if (s === 0) break;
    }
  }
  // A short column is centred, which can park a topic on the row of a neighbour's label. Blank
  // slots above or below shift it by whole rows (never past the tallest column), one column at a time.
  const blank = (c: number, i: number): Slot => ({ slug: `blank#${c}#${i}`, title: "", slot: true, edge: "" });
  for (let c = 0; c < best.length && bestScore > 0; c++) {
    for (let room = rows - best[c].length; room > 0 && bestScore > 0; room--) {
      for (let above = 0; above <= room && bestScore > 0; above++) {
        const padded = [...Array.from({ length: above }, (_, i) => blank(c, i)), ...best[c], ...Array.from({ length: room - above }, (_, i) => blank(c, above + i))];
        const cols = best.map((x, i) => (i === c ? padded : x));
        const s = score(cols);
        if (s < bestScore) [best, bestScore] = [cols, s];
      }
    }
  }
  return best;
}
