// Geometry of the hash ring rig: a square track of 36 cells on a base, tall posts for server points, small cubes for keys.
// Each cell is a stack of up to four slabs; the stack height is the owner's rank, so ownership reads from the surface.
// World x and y lie on the base, z is height. Pure TypeScript: the Live part and the audit both build from here.
import { makeScene, type Spec } from "../scene";
import { SERVER_IDS, type ServerId } from "../../../lib/hashRing";

export const G = 10; // cells per side of the grid, so the track is 4 * (G - 1) = 36 cells
export const CELL = 10;
export const FLOOR = 5; // top of the base: the track starts here
export const SLAB = 2; // thickness of one owner step
export const POST_BASE_TOP = 18; // post top for server A; each later server is POST_STEP taller
export const POST_STEP = 5;
const KEY_SIZE = 4;
const POST_SIZE = 4;
const SPAN = G * CELL;

const scene = makeScene([[-6, -6, 0], [SPAN + 6, -6, 0], [SPAN + 6, SPAN + 6, 0], [-6, SPAN + 6, 0], [0, 0, 36], [SPAN, 0, 36], [SPAN, SPAN, 36], [0, SPAN, 36]]);
export const PROJECTION = scene.projection;
export const { shift } = scene;
export const drawn = scene.drawn;

const AZ = (18 * Math.PI) / 180;

/** Grid position of a ring cell, clockwise from the far left corner. */
export function cellXY(i: number): [number, number] {
  const s = G - 1;
  if (i < s) return [i, 0];
  if (i < 2 * s) return [s, i - s];
  if (i < 3 * s) return [s - (i - 2 * s), s];
  return [0, s - (i - 3 * s)];
}

export const rank = (s: ServerId) => SERVER_IDS.indexOf(s);
/** Number of slabs in a cell owned by this server. */
export const tierOf = (s: ServerId) => rank(s) + 1;
export const topOf = (tier: number) => FLOOR + SLAB * tier;

export const slabSpec = (cell: number, layer: number): Spec => {
  const [gx, gy] = cellXY(cell);
  return { name: `cell.${cell}.${layer}`, min: [gx * CELL, gy * CELL, FLOOR + layer * SLAB], max: [(gx + 1) * CELL, (gy + 1) * CELL, FLOOR + (layer + 1) * SLAB] };
};
const centre = (cell: number, size: number) => {
  const [gx, gy] = cellXY(cell);
  const c: [number, number] = [gx * CELL + CELL / 2, gy * CELL + CELL / 2];
  return { x0: c[0] - size / 2, x1: c[0] + size / 2, y0: c[1] - size / 2, y1: c[1] + size / 2 };
};
/** A server point: a post on its cell, its own height, with a cap. */
export function postSpecs(cell: number, server: ServerId): Spec[] {
  const { x0, x1, y0, y1 } = centre(cell, POST_SIZE);
  const base = topOf(tierOf(server));
  const top = POST_BASE_TOP + POST_STEP * rank(server);
  return [
    { name: `post.${cell}`, min: [x0, y0, base], max: [x1, y1, top] },
    { name: `post.${cell}.cap`, min: [x0 - 1, y0 - 1, top], max: [x1 + 1, y1 + 1, top + 1.5] },
  ];
}
/** A key at rest on the first slab; the figure lifts it by SLAB per extra tier. */
export const keySpec = (name: string, cell: number, tier = 1): Spec => {
  const { x0, x1, y0, y1 } = centre(cell, KEY_SIZE);
  const lift = SLAB * (tier - 1);
  return { name: `key.${name}`, min: [x0, y0, FLOOR + SLAB + lift], max: [x1, y1, FLOOR + SLAB + KEY_SIZE + lift] };
};
export const keyLift = (tier: number) => shift(0, 0, SLAB * (tier - 1));

export const BASE: Spec[] = [
  { name: "stand.base", min: [-6, -6, 2], max: [SPAN + 6, SPAN + 6, FLOOR] },
  ...[[-6, -6], [SPAN + 2, -6], [-6, SPAN + 2], [SPAN + 2, SPAN + 2]].map(([x, y], i): Spec => ({ name: `stand.foot${i}`, min: [x, y, 0], max: [x + 4, y + 4, 2] })),
  { name: "plate", min: [SPAN / 2 - 18, SPAN + 1.5, FLOOR], max: [SPAN / 2 + 18, SPAN + 4.5, FLOOR + 0.6] },
];

const depth = (s: Spec) => ((s.min[0] + s.max[0]) / 2) * Math.sin(AZ) + ((s.min[1] + s.max[1]) / 2) * Math.cos(AZ);
/** Painter's order: far to near by the centre on the floor, then low to high. */
export const byDepth = (a: Spec, b: Spec) => depth(a) - depth(b) || a.min[2] - b.min[2];

export type View = { tier: number[]; posts: { cell: number; server: ServerId }[]; keys: { name: string; cell: number; tier: number }[] };

/** Everything drawn for one view of the ring, in painter's order. The audit replays exactly this. */
export function viewSpecs(v: View): Spec[] {
  const cells = v.tier.flatMap((t, c) => Array.from({ length: t }, (_, l) => slabSpec(c, l)));
  const rest = [...cells, ...v.posts.flatMap((p) => postSpecs(p.cell, p.server)), ...v.keys.map((k) => keySpec(k.name, k.cell, v.tier[k.cell]))];
  return [...BASE, ...rest.sort(byDepth)];
}

export function buildGeometry() {
  return { viewBox: scene.viewBox, base: BASE.map(drawn) };
}
export type RingGeometry = ReturnType<typeof buildGeometry>;

/** Audit entry: the visible parts for a state of the figure. */
export function auditShapes(v: View): Spec[] {
  return viewSpecs(v);
}
