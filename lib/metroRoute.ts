// Metro-style edge routing for the homepage map: an edge leaves its station horizontally, jogs between columns on a
// vertical with 45-degree chamfers, and enters the next station horizontally. Pure geometry in stage pixels, y down.
// Labels hang below their station, left-aligned with the station's left edge (x - NODE_RADIUS).
import { NODE_RADIUS } from "./graph";

export type Pt = { x: number; y: number };
/** An edge to route: `via` are the corridor slots it passes through, in order, one per skipped column. */
export type RouteEdge = { from: string; to: string; via: Pt[] };

/** Chamfer leg: the diagonal runs this far across and this far down (45 degrees). */
export const CHAMFER = 9;
/** Arrowhead length; the last run into a station must be at least this long (twice, with room). */
export const ARROW = 9;
const HEAD_HALF = 4.5;
/** Label baseline below the station's centre, and the box a label occupies (cap height 13, descent 5, margins). */
export const LABEL_BASELINE = NODE_RADIUS + 20;
const LABEL_TOP = NODE_RADIUS + 2;
const LABEL_BOTTOM = LABEL_BASELINE + 8;
/** A label's left edge sits this far left of its station's centre. */
export const LABEL_LEFT = NODE_RADIUS;
const MARGIN = 6; // clear space kept between a jog and a label or station
const GRID = 3; // jog positions are tried every GRID px
const KEEP_OFF = 6; // parallel lines of unrelated edges stay at least this far apart

export const edgeId = (e: { from: string; to: string }) => `${e.from}->${e.to}`;

type Seg = { id: string; from: string; to: string; a: Pt; b: Pt; lo: number; hi: number; x: number };

/** The polyline of one segment from a to b with its vertical at jog x: run, chamfer, vertical, chamfer, run. */
function segmentPoints(a: Pt, b: Pt, x: number): Pt[] {
  const dy = b.y - a.y;
  const s = Math.sign(dy);
  if (Math.abs(dy) < 2 * CHAMFER) return [a, b];
  return [a, { x: x - CHAMFER, y: a.y }, { x, y: a.y + s * CHAMFER }, { x, y: b.y - s * CHAMFER }, { x: x + CHAMFER, y: b.y }, b];
}

/**
 * Route every edge. `columns` need each real station's label width; the jog of every segment is chosen in the free
 * strip between the end of its column's widest label and the arrowhead run into the next column, trying positions
 * that cross nothing already placed, and preferring to share a trunk with an edge from the same source or into the
 * same target. Returns each edge's polyline from its source's centre to its target's centre.
 */
export function routeEdges(
  positions: Map<string, Pt>,
  edges: RouteEdge[],
  labelWidth: Map<string, number>,
): Map<string, Pt[]> {
  const real = [...positions].filter(([slug]) => labelWidth.has(slug));
  const widest = new Map<number, number>();
  for (const [slug, p] of real) widest.set(Math.round(p.x), Math.max(widest.get(Math.round(p.x)) ?? 0, labelWidth.get(slug)!));

  // Segments between consecutive waypoints, which sit in consecutive columns (an edge without slots may span several).
  const segs: Seg[] = [];
  for (const e of edges) {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b) continue;
    const way = [a, ...e.via, b];
    for (let i = 1; i < way.length; i++) {
      const p = way[i - 1];
      const q = way[i];
      const wide = widest.get(Math.round(p.x)) ?? 0;
      const lo = Math.max(p.x + NODE_RADIUS + CHAMFER + 2, p.x - LABEL_LEFT + wide + MARGIN + CHAMFER);
      // The jog must end its chamfer before the arrowhead run into q; if the columns are too close for a clear strip, it sits at the latest allowed x (and the audit reports any crossing).
      const hi = q.x - NODE_RADIUS - ARROW * 2 - CHAMFER;
      const seg: Seg = { id: edgeId(e), from: e.from, to: e.to, a: p, b: q, lo: Math.min(lo, hi), hi, x: (Math.min(lo, hi) + hi) / 2 };
      segs.push(seg);
    }
  }

  const related = (s: Seg, t: Seg) => s.id === t.id || s.from === t.from || s.to === t.to || s.from === t.to || s.to === t.from;
  const cost = (s: Seg, x: number, others: Seg[]) => {
    const mine = segmentPoints(s.a, s.b, x);
    let c = Math.abs(x - (s.lo + s.hi) / 2) * 0.01;
    for (const t of others) {
      if (t === s || t.a.x !== s.a.x || t.b.x !== s.b.x) continue;
      const theirs = segmentPoints(t.a, t.b, t.x);
      const kin = related(s, t);
      if (properCross(mine, theirs)) c += 1000;
      if (!kin) {
        const d = polylineGap(mine, theirs);
        if (d < KEEP_OFF) c += 400 + (KEEP_OFF - d) * 20;
      } else if (t.x === x && (s.from === t.from || s.to === t.to) && Math.sign(s.b.y - s.a.y) === Math.sign(t.b.y - t.a.y)) {
        c -= 5; // siblings in the same direction share the trunk
      }
    }
    return c;
  };

  // Hardest first (longest vertical), then settle: every segment picks again with the others in place.
  const order = [...segs].sort((p, q) => Math.abs(q.b.y - q.a.y) - Math.abs(p.b.y - p.a.y));
  for (let pass = 0; pass < 4; pass++) {
    for (const s of order) {
      if (Math.abs(s.b.y - s.a.y) < 2 * CHAMFER) continue;
      let best = s.x;
      let bestCost = Infinity;
      for (let x = Math.ceil(s.lo / GRID) * GRID; x <= s.hi; x += GRID) {
        const c = cost(s, x, segs);
        if (c < bestCost) [best, bestCost] = [x, c];
      }
      s.x = best;
    }
  }

  const out = new Map<string, Pt[]>();
  for (const e of edges) {
    const mine = segs.filter((s) => s.id === edgeId(e));
    if (!mine.length) continue;
    const pts: Pt[] = [];
    for (const s of mine) pts.push(...segmentPoints(s.a, s.b, s.x));
    // Drop repeated points and the middle of straight runs, so a corridor pass is one line.
    const clean = pts.filter((p, i) => {
      const prev = pts[i - 1];
      const next = pts[i + 1];
      if (prev && prev.x === p.x && prev.y === p.y) return false;
      return !(prev && next && prev.y === p.y && next.y === p.y);
    });
    out.set(edgeId(e), clean);
  }
  return out;
}

/**
 * Hints for edges the map does not draw (they follow from a longer path): jog out of the source just past its label
 * into a lane between two rows of stations, run along the lane, and drop into the target on the last strip before it.
 * They keep off every station and label but may cross other lines; they are faint and dashed.
 */
export function routeHidden(positions: Map<string, Pt>, edges: { from: string; to: string }[], labelWidth: Map<string, number>) {
  const real = [...positions].filter(([slug]) => labelWidth.has(slug));
  const widest = new Map<number, number>();
  for (const [slug, p] of real) widest.set(Math.round(p.x), Math.max(widest.get(Math.round(p.x)) ?? 0, labelWidth.get(slug)!));
  const top = Math.min(...real.map(([, p]) => p.y));
  const bottom = Math.max(...real.map(([, p]) => p.y)) + LABEL_BOTTOM;
  /** A horizontal run at `y` from x1 to x2 touches no station and no label. */
  const laneClear = (y: number, x1: number, x2: number) =>
    real.every(([slug, p]) => {
      if (p.x + NODE_RADIUS < x1 - 40 || p.x - LABEL_LEFT > x2 + 40) return true;
      const box = labelBox(p, labelWidth.get(slug)!, 6);
      return Math.abs(y - p.y) > NODE_RADIUS + 8 && !(y > box.minY && y < box.maxY && box.maxX > x1 && box.minX < x2);
    });
  const out = new Map<string, Pt[]>();
  for (const e of edges) {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b) continue;
    const x1 = Math.max(a.x + NODE_RADIUS + CHAMFER + 2, a.x - LABEL_LEFT + (widest.get(Math.round(a.x)) ?? 0) + MARGIN + CHAMFER) + 2 * GRID;
    const x2 = b.x - NODE_RADIUS - ARROW * 2 - CHAMFER - 2 * GRID;
    const mid = (a.y + b.y) / 2;
    let lane = a.y - 40;
    for (let d = 0, found = false; !found && d <= bottom - top + 100; d += 3) {
      for (const y of [mid + d, mid - d]) {
        if (y >= top - 40 && y <= bottom + 30 && laneClear(y, x1, x2)) [lane, found] = [y, true];
        if (found) break;
      }
    }
    const pts: Pt[] = [a];
    const leg = (x: number, from: number, to: number) => {
      const s = Math.sign(to - from);
      pts.push({ x: x - CHAMFER, y: from }, { x, y: from + s * CHAMFER }, { x, y: to - s * CHAMFER }, { x: x + CHAMFER, y: to });
    };
    if (x2 <= x1 + 4 * CHAMFER || Math.abs(lane - a.y) < 2 * CHAMFER || Math.abs(lane - b.y) < 2 * CHAMFER) {
      out.set(edgeId(e), [a, b].length && Math.abs(b.y - a.y) < 2 * CHAMFER ? [a, b] : segmentPoints(a, b, Math.max(a.x + NODE_RADIUS + CHAMFER + 2, Math.min(x2, (a.x + b.x) / 2))));
      continue;
    }
    leg(x1, a.y, lane);
    leg(x2, lane, b.y);
    pts.push(b);
    out.set(edgeId(e), pts);
  }
  return out;
}

const side = (a: Pt, b: Pt, c: Pt) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));

/** Two segments cross at a point inside both (touching ends and collinear overlaps are not crossings). */
function segCross(a: Pt, b: Pt, c: Pt, d: Pt) {
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

function properCross(p: Pt[], q: Pt[]) {
  for (let i = 1; i < p.length; i++) for (let j = 1; j < q.length; j++) if (segCross(p[i - 1], p[i], q[j - 1], q[j])) return true;
  return false;
}

function pointSegment(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = dx || dy ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

/** Smallest distance between two polylines that do not cross (endpoints are enough for line segments). */
function polylineGap(p: Pt[], q: Pt[]) {
  let m = Infinity;
  for (let i = 1; i < p.length; i++)
    for (let j = 1; j < q.length; j++) {
      const [a, b, c, d] = [p[i - 1], p[i], q[j - 1], q[j]];
      m = Math.min(m, pointSegment(a, c, d), pointSegment(b, c, d), pointSegment(c, a, b), pointSegment(d, a, b));
    }
  return m;
}

/** The box a station's label fills, with its clearance, in stage pixels. */
export function labelBox(p: Pt, width: number, pad = 4) {
  return { minX: p.x - LABEL_LEFT - pad, maxX: p.x - LABEL_LEFT + width + pad, minY: p.y + LABEL_TOP - pad, maxY: p.y + LABEL_BOTTOM + pad };
}

function hitsBox(a: Pt, b: Pt, r: { minX: number; maxX: number; minY: number; maxY: number }) {
  for (let i = 0; i <= 40; i++) {
    const x = a.x + ((b.x - a.x) * i) / 40;
    const y = a.y + ((b.y - a.y) * i) / 40;
    if (x > r.minX && x < r.maxX && y > r.minY && y < r.maxY) return true;
  }
  return false;
}

/**
 * Everything wrong with a routing, as readable lines (empty when clean): an edge crossing or running along an edge
 * it shares no station with, two edges that share a station crossing each other, an edge through another station or
 * any label, or off the stage. Edges that share a station may overlap on a trunk.
 */
export function routeProblems(
  routes: Map<string, Pt[]>,
  positions: Map<string, Pt>,
  labelWidth: Map<string, number>,
  stage: { minX: number; maxX: number; minY: number; maxY: number },
) {
  const out: string[] = [];
  const ids = [...routes.keys()];
  const ends = (id: string) => id.split("->");
  ids.forEach((id, i) =>
    ids.slice(i + 1).forEach((other) => {
      const kin = ends(id).some((s) => ends(other).includes(s));
      const p = routes.get(id)!;
      const q = routes.get(other)!;
      if (properCross(p, q)) out.push(`edge-edge ${id} x ${other}`);
      else if (!kin && polylineGap(p, q) < 2) out.push(`edge-edge ${id} touches ${other}`);
    }),
  );
  const labelled = [...positions].filter(([slug]) => labelWidth.has(slug));
  for (const [id, pts] of routes) {
    const [from, to] = ends(id);
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = [pts[i - 1], pts[i]];
      for (const [slug, p] of labelled) {
        if (slug !== from && slug !== to && pointSegment(p, a, b) < NODE_RADIUS + 6) out.push(`edge-node ${id} through ${slug}`);
        if (hitsBox(a, b, labelBox(p, labelWidth.get(slug)!))) out.push(`edge-label ${id} through the label of ${slug}`);
      }
      if ([a, b].some((q) => q.x < stage.minX || q.x > stage.maxX || q.y < stage.minY || q.y > stage.maxY)) out.push(`off-stage ${id}`);
    }
  }
  return [...new Set(out)];
}

/** The ring round `slug` covers no other station and no other label (it may cross lines: it is drawn over them on purpose). */
export function ringProblems(positions: Map<string, Pt>, labelWidth: Map<string, number>, slug: string) {
  const p = positions.get(slug);
  if (!p) return [];
  const { cx, cy, rx, ry } = ringFor(p, labelWidth.get(slug) ?? 100);
  const box = { minX: cx - rx * 1.06, maxX: cx + rx * 1.06, minY: cy - ry * 1.06, maxY: cy + ry * 1.06 };
  const out: string[] = [];
  for (const [other, q] of positions) {
    if (other === slug || !labelWidth.has(other)) continue;
    if (q.x + NODE_RADIUS > box.minX && q.x - NODE_RADIUS < box.maxX && q.y + NODE_RADIUS > box.minY && q.y - NODE_RADIUS < box.maxY) out.push(`ring ${slug} over station ${other}`);
    const l = labelBox(q, labelWidth.get(other)!, 0);
    if (l.minX < box.maxX && box.minX < l.maxX && l.minY < box.maxY && box.minY < l.maxY) out.push(`ring ${slug} over the label of ${other}`);
  }
  return out;
}

/** Label-to-label and label-to-station overlaps among the stations themselves. */
export function labelProblems(positions: Map<string, Pt>, labelWidth: Map<string, number>) {
  const out: string[] = [];
  const real = [...positions].filter(([slug]) => labelWidth.has(slug));
  real.forEach(([a, p], i) => {
    const box = labelBox(p, labelWidth.get(a)!, 0);
    for (const [b, q] of real) {
      if (b !== a && Math.hypot(q.x - Math.max(box.minX, Math.min(q.x, box.maxX)), q.y - Math.max(box.minY, Math.min(q.y, box.maxY))) < NODE_RADIUS + 2) out.push(`label-node ${a} over ${b}`);
    }
    for (const [b, q] of real.slice(i + 1)) {
      const o = labelBox(q, labelWidth.get(b)!, 0);
      if (box.minX < o.maxX && o.minX < box.maxX && box.minY < o.maxY && o.minY < box.maxY) out.push(`label-label ${a} over ${b}`);
    }
  });
  return out;
}

/**
 * The drawable shape of a routed edge in screen pixels: the path trimmed to the station rims (radius `r`) and, when
 * `arrow` is set, a small triangle (ARROW long, 2 x HEAD_HALF across) whose tip touches the target's rim. The head does
 * not grow with the line's width, so a lit line stays tidy.
 */
export function routeShape(points: Pt[], r: number, arrow = true) {
  const pts = points.map((p) => ({ ...p }));
  const unit = (f: Pt, t: Pt) => {
    const l = Math.hypot(t.x - f.x, t.y - f.y) || 1;
    return { x: (t.x - f.x) / l, y: (t.y - f.y) / l };
  };
  const first = unit(pts[0], pts[1]);
  pts[0] = { x: pts[0].x + first.x * r, y: pts[0].y + first.y * r };
  const n = pts.length;
  const last = unit(pts[n - 2], pts[n - 1]);
  const tip = { x: pts[n - 1].x - last.x * r, y: pts[n - 1].y - last.y * r };
  const len = arrow ? ARROW : 0;
  const base = { x: tip.x - last.x * len, y: tip.y - last.y * len };
  pts[n - 1] = { x: base.x + last.x * 0.5, y: base.y + last.y * 0.5 }; // tucked under the head so no gap shows
  const f = (v: number) => Math.round(v * 100) / 100;
  return {
    d: pts.map((p, i) => `${i ? "L" : "M"}${f(p.x)},${f(p.y)}`).join(" "),
    head: `${f(tip.x)},${f(tip.y)} ${f(base.x - last.y * HEAD_HALF)},${f(base.y + last.x * HEAD_HALF)} ${f(base.x + last.y * HEAD_HALF)},${f(base.y - last.x * HEAD_HALF)}`,
  };
}

/** The ellipse of the ring round a station and the start of its label (before the hand-drawn wobble, which is at most 6%). */
export function ringFor(p: Pt, labelWidth: number) {
  const w = Math.min(labelWidth, 150);
  return { cx: p.x - LABEL_LEFT + w / 2, cy: p.y + 12, rx: w / 2 + 30, ry: 36 };
}

/**
 * A hand-drawn ring round a station and the start of its label: an ellipse of 45 points with a slow wobble in its
 * radius, starting short of where it ends so the ends overlap like a pen lifted and put down again. Not animated.
 * Same input, same ring.
 */
export function handRing(cx: number, cy: number, rx: number, ry: number) {
  let d = "";
  for (let i = 0; i <= 44; i++) {
    const a = -2.2 + (i / 44) * (Math.PI * 2 + 0.55);
    const k = 1 + 0.04 * Math.sin(a * 3 + 1) + i * 0.0014;
    d += `${i ? " L" : "M"}${(cx + rx * k * Math.cos(a)).toFixed(1)} ${(cy + ry * k * Math.sin(a)).toFixed(1)}`;
  }
  return d;
}
