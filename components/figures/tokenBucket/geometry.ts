// Geometry of the token bucket rig: a hopper with a 2 x 2 floor of token slots, a shallow debt bay in front,
// a refill tank behind, and a barrier across a lane that is lowered while the level is below zero.
// World x and y lie on the base, z is height. Pure TypeScript: the Live part and the audit both build from here.
import { makeScene, type Spec } from "../scene";
import { CAPACITY, DEBT_MAX, type BucketState } from "../../../lib/tokenBucket";

const scene = makeScene([[-6, -6, 0], [100, -6, 0], [100, 96, 0], [-6, 96, 0], [-6, -6, 28], [100, -6, 28]]);
export const PROJECTION = scene.projection;
export const { shift, drawn } = scene;

/** How far the barrier lifts when requests are accepted. */
export const GATE_LIFT = 10;

const TOKEN = 12;
export const tokenSpec = (k: number): Spec => {
  const x = 16 + (k % 2) * 16;
  const y = 28 + Math.floor(k / 2) * 16;
  return { name: `token.${k}`, min: [x, y, 7], max: [x + TOKEN, y + TOKEN, 12] };
};
export const debtSpec = (k: number): Spec => ({ name: `debt.${k}`, min: [12 + k * 22, 75, 6.5], max: [26 + k * 22, 85, 11.5] });
/** The barrier at its lowered (closed) position; the figure lifts it with `shift(0, 0, GATE_LIFT)`. */
export const GATE_BAR: Spec = { name: "gate.bar", min: [64, 51, 10], max: [86, 53, 13] };

/** Static solids in painter's order, split around the tokens that sit in the hopper. */
export const BACK: Spec[] = [
  { name: "stand.base", min: [-6, -6, 2], max: [100, 96, 5] },
  ...[[-6, -6], [96, -6], [-6, 92], [96, 92]].map(([x, y], i): Spec => ({ name: `stand.foot${i}`, min: [x, y, 0], max: [x + 4, y + 4, 2] })),
  { name: "feed.tank", min: [12, 2, 5], max: [48, 18, 22] },
  { name: "tray.floor", min: [8, 20, 5], max: [52, 64, 7] },
  { name: "tray.wallL", min: [8, 20, 7], max: [10, 64, 22] },
  { name: "tray.wallB", min: [10, 20, 7], max: [52, 22, 22] },
  { name: "feed.chute", min: [26, 14, 22], max: [34, 24, 25] },
  { name: "debt.floor", min: [8, 70, 5], max: [52, 90, 6.5] },
  { name: "debt.wallB", min: [10, 70, 6.5], max: [50, 72, 11] },
  { name: "lane.floor", min: [60, 14, 5], max: [90, 92, 6] },
  { name: "gate.postL", min: [60, 50, 6], max: [64, 54, 26] },
];
export const GATE_POST_R: Spec = { name: "gate.postR", min: [86, 50, 6], max: [90, 54, 26] };
export const LIPS: Spec[] = [
  { name: "tray.lipF", min: [10, 62, 7], max: [52, 64, 9] },
  { name: "tray.lipR", min: [50, 22, 7], max: [52, 62, 9] },
];

export function buildGeometry() {
  return {
    viewBox: scene.viewBox,
    back: BACK.map(drawn),
    postR: drawn(GATE_POST_R),
    lips: LIPS.map(drawn),
    tokens: Array.from({ length: CAPACITY }, (_, k) => ({ name: `token.${k}`, box: drawn(tokenSpec(k)).box })),
    debt: Array.from({ length: DEBT_MAX }, (_, k) => ({ name: `debt.${k}`, box: drawn(debtSpec(k)).box })),
    bar: drawn(GATE_BAR).box,
    lift: shift(0, 0, GATE_LIFT),
  };
}
export type BucketGeometry = ReturnType<typeof buildGeometry>;

const depth = (s: Spec) => (s.min[0] + s.max[0]) / 2 * Math.sin((18 * Math.PI) / 180) + ((s.min[1] + s.max[1]) / 2) * Math.cos((18 * Math.PI) / 180);

/** Audit entry: every solid at rest for a state of the figure, in painter's order. */
export function auditShapes(s: Pick<BucketState, "tokens" | "debt" | "rejecting">): Spec[] {
  const tokens = Array.from({ length: s.tokens }, (_, k) => tokenSpec(k)).sort((a, b) => depth(a) - depth(b));
  const bar: Spec = s.rejecting ? GATE_BAR : { ...GATE_BAR, min: [64, 51, 10 + GATE_LIFT], max: [86, 53, 13 + GATE_LIFT] };
  return [...BACK, ...tokens, ...LIPS, ...Array.from({ length: s.debt }, (_, k) => debtSpec(k)), bar, GATE_POST_R];
}
