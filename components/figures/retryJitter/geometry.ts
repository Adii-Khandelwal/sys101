// Geometry of the retry rig: twelve client lanes along a time rail, one block per try.
// World x is time (TS units for one first wait), y is the lane, z is height.
import { CLIENTS, retryTicks, type JitterInputs } from "@/lib/retryJitter";
import { makeScene, type Pt3, type Spec } from "../scene";

/** World units for one first wait; one tick is 1/24 of it. */
export const TS = 14;
const TICK = TS / 24;
const LANE = 3;
const END = 7 * TS + 2;

const scene = makeScene([[-6, -3, 0], [108, -3, 0], [108, 43, 0], [-6, 43, 0], [100, 0, 9], [0, 40, 9]]);
export const PROJECTION = scene.projection;
const { box, drawn, shift } = scene;

const laneY = (c: number) => 2 + LANE * c;
export const MARKER = (c: number): Spec => ({ name: `client.${c}`, min: [0, laneY(c) + 0.1, 3.4], max: [1.8, laneY(c) + 2.1, 8] });

export const STATIC_BACK: Spec[] = [
  { name: "stand.base", min: [-6, -3, 0], max: [108, 43, 3] },
  ...Array.from({ length: CLIENTS }, (_, c): Spec => ({ name: `rail.${c}`, min: [0, laneY(c), 3], max: [END, laneY(c) + 2.2, 3.4] })),
  ...[0, 1, 3, 7].map((u): Spec => ({ name: `post.${u}`, min: [u * TS - 0.5, -1.5, 3], max: [u * TS + 0.5, -0.3, 9] })),
];
export const STATIC_FRONT: Spec[] = [
  { name: "ruler.strip", min: [0, 39.5, 3], max: [END, 41.5, 3.5] },
  ...Array.from({ length: 8 }, (_, u): Spec => ({ name: `ruler.tick.${u}`, min: [u * TS - 0.3, 39.8, 3.5], max: [u * TS + 0.3, 41.2, 4.6] })),
];

export function buildGeometry(i: JitterInputs) {
  const shifts = (jitter: boolean) => retryTicks(i, jitter).map((row) => row.map((t) => shift(t * TICK)));
  return {
    viewBox: scene.viewBox,
    back: STATIC_BACK.map(drawn),
    front: STATIC_FRONT.map(drawn),
    markers: Array.from({ length: CLIENTS }, (_, c) => box(...MARKER(c).min, ...MARKER(c).max)),
    /** Screen shift of each client's try, indexed [client][attempt]. */
    plain: shifts(false),
    jittered: shifts(true),
  };
}
export type JitterGeometry = ReturnType<typeof buildGeometry>;

/** Every solid at rest for a state of the audit: the tries up to `step` at their times. */
export function auditShapes(i: JitterInputs, jitter: boolean, step: number): Spec[] {
  const ticks = retryTicks(i, jitter);
  const marks: Spec[] = [];
  for (let c = 0; c < CLIENTS; c++)
    for (let a = 0; a <= step; a++) {
      const m = MARKER(c);
      const x = ticks[c][a] * TICK;
      marks.push({ name: `${m.name}.${a}`, min: [m.min[0] + x, m.min[1], m.min[2] + 0] as Pt3, max: [m.max[0] + x, m.max[1], m.max[2]] as Pt3 });
    }
  return [...STATIC_BACK, ...marks, ...STATIC_FRONT];
}
