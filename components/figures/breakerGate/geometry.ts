// Geometry of the breaker gate rig: a three-lane road from a client tower through a gate to three pods.
// World x runs along the road, y across the lanes, z is height. Pure TypeScript: the Live part and the audit both build from here.
import { makeScene, type Spec } from "../scene";
import { LANES, breakerState, type BreakerInputs, type Gate, type Req, type Zone } from "../../../lib/breakerGate";

const scene = makeScene([[-6, -8, 0], [196, -8, 0], [196, 38, 0], [-6, 38, 0], [0, 0, 30], [196, 38, 30]]);
export const PROJECTION = scene.projection;
export const { shift, drawn } = scene;

const AZ = (18 * Math.PI) / 180;
const LANE = 10;
export const BAR_LIFT = 14; // how far a raised bar rides up the posts
const GATE_X = 70;
const CUBE = 4;
const PITCH = 4.4; // gap between neighbours in a queue is 0.4
const PLATE_Z = 3.4;

/** Left edge of a request in each zone: queued before the gate, passing at normal load, or queued at its pod. */
export const xOf = (zone: Zone, j: number) => (zone === "wait" ? 67 - PITCH * j : zone === "flow" ? 100 : 126 - PITCH * j);

export const cubeSpec = (lane: number, j: number, x0: number): Spec => ({
  name: `req.${lane}.${j}`,
  min: [x0, lane * LANE + 3, PLATE_Z],
  max: [x0 + CUBE, lane * LANE + 3 + CUBE, PLATE_Z + CUBE],
});

export const FEET: Spec[] = [[-6, -8], [192, -8], [-6, 34], [192, 34]].map(([x, y], i): Spec => ({ name: `stand.foot${i}`, min: [x, y, 0], max: [x + 4, y + 4, 2] }));
export const BASE: Spec[] = [{ name: "stand.base", min: [-6, -8, 2], max: [196, 38, 3] }, ...FEET];

const lanes = (name: string, x0: number, x1: number): Spec[] =>
  Array.from({ length: LANES }, (_, k): Spec => ({ name: `${name}.${k}`, min: [x0, k * LANE + 1, 3], max: [x1, k * LANE + 9, PLATE_Z] }));

/** Parts that never move: the client tower, road plates, pods, posts, beam and lamp plinth. */
export const STATIC: Spec[] = [
  { name: "client", min: [2, 2, 3], max: [12, 28, 16] },
  ...lanes("road.up", 14, GATE_X - 1),
  ...lanes("road.down", GATE_X + 6, 130),
  ...Array.from({ length: LANES }, (_, k): Spec[] => [
    { name: `pod.${k}`, min: [130, k * LANE + 0.5, 3], max: [156, k * LANE + 9.5, 13] },
    { name: `pod.${k}.roof`, min: [129, k * LANE + 0.2, 13], max: [157, k * LANE + 9.8, 14.2] },
  ]).flat(),
  { name: "post.far", min: [GATE_X, -4, 3], max: [GATE_X + 5, -1, 26] },
  { name: "post.near", min: [GATE_X, 31, 3], max: [GATE_X + 5, 34, 26] },
  { name: "plinth", min: [62, -7.5, 3], max: [84, -4.5, 5.5] },
];
export const BEAM: Spec = { name: "beam", min: [GATE_X, -4, 26], max: [GATE_X + 5, 34, 28.5] };
/** The bar over lanes 0 and 1, and the leaf over lane 2 (the probe lane). Down they rest on the base; up they ride the posts. */
export const BARS: Record<"main" | "leaf", Spec> = {
  main: { name: "bar.main", min: [GATE_X + 1, -1, 3], max: [GATE_X + 4, 20, 8] },
  leaf: { name: "bar.leaf", min: [GATE_X + 1, 20.5, 3], max: [GATE_X + 4, 31, 8] },
};
/** Lamps on the plinth, left to right: closed, half-open, open. */
export const LAMPS: { gate: Gate; spec: Spec }[] = (["closed", "half-open", "open"] as const).map((gate, k) => ({
  gate,
  spec: { name: `lamp.${gate}`, min: [64 + 7 * k, -7, 5.5], max: [68 + 7 * k, -5, 8.5] },
}));

/** Which bars are raised in a gate state. */
export const raised = (g: Gate) => ({ main: g === "closed", leaf: g !== "open" });
const lifted = (s: Spec): Spec => ({ ...s, min: [s.min[0], s.min[1], s.min[2] + BAR_LIFT], max: [s.max[0], s.max[1], s.max[2] + BAR_LIFT] });

const depth = (s: Spec) => ((s.min[0] + s.max[0]) / 2) * Math.sin(AZ) + ((s.min[1] + s.max[1]) / 2) * Math.cos(AZ);
/** Flat road plates go first: they sort by their long centre, which would paint them over the cubes that sit on them. */
const flat = (s: Spec) => s.name.startsWith("road.");
const byDepth = (a: Spec, b: Spec) => Number(flat(b)) - Number(flat(a)) || depth(a) - depth(b) || a.min[2] - b.min[2];

export type Item =
  | { id: string; kind: "fixed"; box: ReturnType<typeof drawn>["box"] }
  | { id: string; kind: "lamp"; gate: Gate; box: ReturnType<typeof drawn>["box"] }
  | { id: string; kind: "bar"; bar: "main" | "leaf"; box: ReturnType<typeof drawn>["box"] }
  | { id: string; kind: "cube"; lane: number; j: number; box: ReturnType<typeof drawn>["box"] };

export function buildGeometry(i: BreakerInputs) {
  type Entry = { spec: Spec; item: Item };
  const entries: Entry[] = [];
  const add = (spec: Spec, rest: { kind: Item["kind"]; gate?: Gate; bar?: "main" | "leaf"; lane?: number; j?: number }) => entries.push({ spec, item: { id: spec.name, box: drawn(spec).box, ...rest } as Item });
  for (const s of STATIC) add(s, { kind: "fixed" });
  for (const l of LAMPS) add(l.spec, { kind: "lamp", gate: l.gate });
  for (const b of ["main", "leaf"] as const) add(BARS[b], { kind: "bar", bar: b });
  for (let lane = 0; lane < LANES; lane++) for (let j = 0; j < i.factor; j++) add(cubeSpec(lane, j, xOf("wait", j)), { kind: "cube", lane, j });
  // The beam rests on both posts, so it is painted after the nearer one.
  entries.sort((a, b) => byDepth(a.spec, b.spec));
  const items = entries.map((e) => e.item);
  items.splice(items.findIndex((it) => it.id === "post.near") + 1, 0, { id: BEAM.name, kind: "fixed", box: drawn(BEAM).box });
  return { viewBox: scene.viewBox, base: BASE.map(drawn), items };
}
export type BreakerGeometry = ReturnType<typeof buildGeometry>;

/** Audit entry: every solid at rest for a step of the story. */
export function auditShapes(i: BreakerInputs, step: number): Spec[] {
  const s = breakerState(i, step);
  const up = raised(s.gate);
  const bars = (["main", "leaf"] as const).map((b) => (up[b] ? lifted(BARS[b]) : BARS[b]));
  const reqs = s.reqs.filter((r: Req) => r.visible).map((r) => cubeSpec(r.lane, r.j, xOf(r.zone, r.j)));
  return [...BASE, ...STATIC, BEAM, ...LAMPS.map((l) => l.spec), ...bars, ...reqs];
}
