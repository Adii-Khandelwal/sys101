// Pure geometry for the sliding-window gauge: no DOM, no React, so the server builds it, the
// test checks it and the skill's audit can replay it. World units: x is time across two minutes
// (0 to 60 previous minute, 60 to 120 current minute), y is depth, z is height.
// Same drawing method as the anatomy skill (one projection, painter's order, three visible faces
// per box, four tones), written small: no halo, gradient or dot grid, which CLAUDE.md bans.
import { WINDOW_SECONDS, MAX_ADDED, type WindowInputs } from "@/lib/slidingWindow";
import { makeScene, type Box, type Flat, type Pt3, type Spec } from "../scene";

export type { Box, Flat, Pt3, Spec };

const GAUGE = { x: WINDOW_SECONDS, z: 34, r: 14, back: -2.4 };
const scene = makeScene([[-6, -4, 0], [126, -4, 0], [126, 18, 0], [-6, 18, 0], [GAUGE.x - GAUGE.r, GAUGE.back, GAUGE.z + GAUGE.r], [GAUGE.x + GAUGE.r, 0, GAUGE.z + GAUGE.r]]);
const { iso, box, drawn } = scene;
const S = scene.S;
const round = (n: number) => Math.round(n * 100) / 100;
export const HEIGHT = scene.height;
/** Screen shift of one second of time along the rail. */
export const SECOND: Flat = scene.shift(1);

const BASE = { x0: -6, x1: 126, y0: -4, y1: 18, z0: 0, z1: 3 };
const TRAY = { y0: 5, y1: 13, z0: 3, z1: 5.2 };
const BEAD = { r: 0.7, z: 5.2 + 0.7 };
/** Lanes either side of the previous minute's row (y = 9), so beads never touch it. */
export const CUR_LANES = [6.2, 11.8];

const GAP = 1.5; // least centre spacing of two beads (diameter 1.4)

/**
 * World x of each bead of this minute, in lane order (k % lanes). The requests came during the elapsed
 * seconds, so they spread over x = 60 to the leading gate. When that span is too short for them they
 * pack against the gate and run back over the previous tray's outer lanes, never out of the window.
 */
export function currentBeadX(count: number, elapsed: number): number[] {
  const cols = Math.ceil(count / CUR_LANES.length);
  const right = WINDOW_SECONDS + elapsed - 1.4; // gate half width plus bead radius
  const step = (right - WINDOW_SECONDS) / cols;
  return Array.from({ length: count }, (_, k) => {
    const c = Math.floor(k / CUR_LANES.length);
    return step >= GAP ? WINDOW_SECONDS + (c + 0.5) * step : right - (cols - 1 - c) * GAP;
  });
}



/** Solids that stay put, painter's order: the first two sit behind the gauge face, the rest in front of it. */
export const STATIC: Spec[] = [
  { name: "stand.base", min: [BASE.x0, BASE.y0, BASE.z0], max: [BASE.x1, BASE.y1, BASE.z1] },
  { name: "gauge.post", min: [GAUGE.x - 1.5, -2.2, 3], max: [GAUGE.x + 1.5, -0.2, GAUGE.z - GAUGE.r + 0.3] },
  { name: "tray.previous", min: [-0.5, TRAY.y0, TRAY.z0], max: [60, TRAY.y1, TRAY.z1] },
  { name: "tray.current", min: [60, TRAY.y0, TRAY.z0], max: [120.5, TRAY.y1, TRAY.z1] },
];
/** The frame at elapsed 0: back parts, then front parts. Each moves by one second of shift per second. */
export const FRAME_BACK: Spec[] = [
  ...[0, WINDOW_SECONDS].map((x) => ({ name: `frame.post.back@${x}`, min: [x - 0.7, 3, 3] as Pt3, max: [x + 0.7, 4.4, 15] as Pt3 })),
  { name: "frame.lintel", min: [0.7, 3, 15], max: [WINDOW_SECONDS - 0.7, 4.4, 16.4] },
];
export const FRAME_FRONT: Spec[] = [0, WINDOW_SECONDS].flatMap((x) => [
  { name: `frame.post.front@${x}`, min: [x - 0.7, 13.6, 3] as Pt3, max: [x + 0.7, 15, 15] as Pt3 },
  { name: `frame.beam@${x}`, min: [x - 0.7, 3, 15] as Pt3, max: [x + 0.7, 15, 16.4] as Pt3 },
]);

/** The kit's camera for the same view, so the skill's audit sees what is drawn: azimuth 72 is x pointing right. */
export const PROJECTION = scene.projection;
export const GAUGE_WORLD = GAUGE;
export const BEAD_WORLD = BEAD;

/** Convex hull (monotone chain) of screen points, as a closed path. */
function hull(points: Flat[]): string {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (list: Flat[]) => {
    const h: Flat[] = [];
    for (const q of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    return h.slice(0, -1);
  };
  const all = [...build(p), ...build([...p].reverse())];
  return `M${all.map((q) => q.join(",")).join("L")}Z`;
}

/** Dial angle in degrees clockwise from straight up, for a value on a 0..max scale. */
export const dialAngle = (value: number, max: number) => -120 + (240 * Math.min(Math.max(value, 0), max)) / max;

export type Geometry = {
  viewBox: string;
  /** Painter's order, back to front. `tone` picks the face fill. */
  staticBoxes: { name: string; box: Box }[];
  ticks: { d: string; major: boolean }[];
  gauge: { backHull: string; matrix: string; faceR: number; ticks: { d: string; limit: boolean }[]; hub: number };
  prevBeads: { cx: number; cy: number; x: number }[];
  /** Screen origin (x = 60) of each of the two lanes the current minute's beads sit in, front lane last. */
  curLanes: Flat[];
  frameBack: { name: string; box: Box }[];
  frameFront: { name: string; box: Box }[];
  second: Flat;
  beadR: number;
  dialMax: number;
  limitAngle: number;
};

export function buildGeometry(i: WindowInputs): Geometry {
  const dialMax = Math.ceil((i.previous + i.current + MAX_ADDED) / 10) * 10;
  const beadR = round(BEAD.r * S);

  const staticBoxes = STATIC.map(drawn);

  // Ruler along the front of the base: a tick every 5 seconds, longer every 15, longest at the minute line.
  const ticks: Geometry["ticks"] = [];
  for (let t = 0; t <= 2 * WINDOW_SECONDS; t += 5) {
    const len = t % 60 === 0 ? 3 : t % 15 === 0 ? 2 : 1;
    ticks.push({ d: `M${iso([t, 18 - len, BASE.z1]).join(",")}L${iso([t, 18, BASE.z1]).join(",")}`, major: t % 15 === 0 });
  }

  const N = 48;
  const circle = (y: number, r = GAUGE.r): Flat[] =>
    Array.from({ length: N }, (_, k) => iso([GAUGE.x + r * Math.sin((2 * Math.PI * k) / N), y, GAUGE.z + r * Math.cos((2 * Math.PI * k) / N)]));
  const backHull = hull([...circle(0), ...circle(GAUGE.back)]);

  // The face lives in a local frame (u along x, v down) mapped onto the y = 0 plane by one matrix.
  const [ax, ay, dz] = scene.matrixOf();
  const [ex, ey] = iso([GAUGE.x, 0, GAUGE.z]);
  const matrix = `matrix(${ax}, ${ay}, 0, ${dz}, ${ex}, ${ey})`;
  const gTicks: Geometry["gauge"]["ticks"] = [];
  for (let v = 0; v <= dialMax; v += 5) {
    const a = (dialAngle(v, dialMax) * Math.PI) / 180;
    const limit = v === i.limit;
    const [r0, r1] = limit ? [7.2, 12] : v % 10 === 0 ? [9.2, 12] : [10.6, 12];
    gTicks.push({ d: `M${round(r0 * Math.sin(a))},${round(-r0 * Math.cos(a))}L${round(r1 * Math.sin(a))},${round(-r1 * Math.cos(a))}`, limit });
  }

  const prevBeads = Array.from({ length: i.previous }, (_, k) => {
    const x = ((k + 0.5) * WINDOW_SECONDS) / i.previous;
    const [cx, cy] = iso([x, 9, BEAD.z]);
    return { cx, cy, x: round(x) };
  });
  // The current minute's requests happened during the elapsed part, so the client spreads them from x = 60.
  const curLanes = CUR_LANES.map((y) => iso([WINDOW_SECONDS, y, BEAD.z]));

  // The frame is drawn at elapsed 0 (gates at x = 0 and 60) and shifted along the rail by `second` x elapsed.
  const frameBack = FRAME_BACK.map(drawn);
  const frameFront = FRAME_FRONT.map(drawn);

  return {
    viewBox: scene.viewBox,
    staticBoxes,
    ticks,
    gauge: { backHull, matrix, faceR: 14, ticks: gTicks, hub: 1.1 },
    prevBeads,
    curLanes,
    frameBack,
    frameFront,
    second: SECOND,
    beadR,
    dialMax,
    limitAngle: dialAngle(i.limit, dialMax),
  };
}
