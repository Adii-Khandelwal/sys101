// Geometry of the id counter rig: a rail, a carriage, a gate and a stop block.
// World x runs along the rail (start at 0, maximum at 100 and beyond), y is depth, z is height.
import { makeScene, type Pt3, type Spec } from "../scene";

const scene = makeScene([[-6, 0, 0], [116, 0, 0], [116, 22, 0], [-6, 22, 0], [95, 10, 16], [4, 10, 12.5]]);
export const PROJECTION = scene.projection;
const { box, drawn, shift } = scene;

export const CARRIAGE_LEN = 8;
/** Left edges of the carriage at each place. The last stops 0.4 short of the gate. */
export const CAR_AT = { start: 6, first: 14, far: 58, halt: 85.6 };

const TICKS: Spec[] = Array.from({ length: 11 }, (_, k) => ({ name: `tick.${k}`, min: [k * 10, 1, 3], max: [k * 10 + 1.2, 3, k % 5 === 0 ? 4 : 3.6] }));

export const STATIC_BACK: Spec[] = [
  { name: "stand.base", min: [-6, 0, 0], max: [116, 22, 3] },
  ...TICKS,
  { name: "rail", min: [0, 6, 3], max: [108, 14, 4] },
];
export const CARRIAGE: Spec = { name: "carriage", min: [0, 6.5, 4], max: [CARRIAGE_LEN, 13.5, 10] };
export const CARRIAGE_TOKEN: Spec = { name: "carriage.token", min: [1, 8, 10], max: [7, 12, 12.5] };
export const GATE_CLOSED: Spec = { name: "gate.closed", min: [94, 5, 4], max: [97, 15, 16] };
export const GATE_OPEN: Spec = { name: "gate.open", min: [94, 5, 4], max: [97, 15, 4.4] };
export const STATIC_FRONT: Spec[] = [
  { name: "stop", min: [100, 5, 4], max: [108, 15, 14] },
  { name: "margin.strip", min: [88, 15, 3], max: [100, 19, 3.6] },
];

export function buildGeometry() {
  return {
    viewBox: scene.viewBox,
    back: STATIC_BACK.map(drawn),
    carriage: box(...CARRIAGE.min, ...CARRIAGE.max),
    token: box(...CARRIAGE_TOKEN.min, ...CARRIAGE_TOKEN.max),
    gateClosed: box(...GATE_CLOSED.min, ...GATE_CLOSED.max),
    gateOpen: box(...GATE_OPEN.min, ...GATE_OPEN.max),
    front: STATIC_FRONT.map(drawn),
    carShift: Object.fromEntries(Object.entries(CAR_AT).map(([k, x]) => [k, shift(x)])) as Record<keyof typeof CAR_AT, [number, number]>,
  };
}
export type XidGeometry = ReturnType<typeof buildGeometry>;

/** Every solid at rest for a state of the audit: the carriage with its left edge at carX. */
export function auditShapes(carX: number, gateClosed: boolean): Spec[] {
  const move = (s: Spec, x: number): Spec => ({ ...s, min: [s.min[0] + x, s.min[1], s.min[2]] as Pt3, max: [s.max[0] + x, s.max[1], s.max[2]] as Pt3 });
  return [...STATIC_BACK, move(CARRIAGE, carX), move(CARRIAGE_TOKEN, carX), gateClosed ? GATE_CLOSED : GATE_OPEN, ...STATIC_FRONT];
}
