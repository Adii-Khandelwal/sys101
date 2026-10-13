// Geometry of the cache fill race: a database, two rails, a one-way pawl and one cache slot.
// World x runs along the rails (database at 0, cache at 94 and beyond), y is depth, z is height.
import { makeScene, type Pt3, type Spec } from "../scene";

const scene = makeScene([[-6, 0, 0], [126, 0, 0], [126, 22, 0], [-6, 22, 0], [120, 3, 18.5], [0, 4, 18.5]]);
export const PROJECTION = scene.projection;
const { box, drawn, shift } = scene;

export const CARRIAGE = { fillLen: 12, invalLen: 7 };
/** Left edges of the carriages in each place; the figure draws them at x = 0 and shifts them. */
export const FILL_AT = { hidden: 20, flight: 46, blocked: 63.6, delivered: 82 };
export const INVAL_AT = { hidden: 20, flight: 22, delivered: 87 };

export const STATIC_BACK: Spec[] = [
  { name: "stand.base", min: [-6, 0, 0], max: [126, 22, 3] },
  { name: "rail.back", min: [18, 3, 3], max: [92, 10, 3.6] },
  { name: "rail.front", min: [18, 11, 3], max: [92, 18, 3.6] },
  { name: "database", min: [0, 4, 3], max: [16, 18, 16] },
  { name: "database.token", min: [3, 8, 16], max: [13, 14, 18.5] },
];
export const CARRIAGE_INVAL: Spec = { name: "carriage.invalidation", min: [0, 4.5, 3.6], max: [CARRIAGE.invalLen, 8.5, 12] };
export const CARRIAGE_FILL: Spec = { name: "carriage.fill", min: [0, 12, 3.6], max: [CARRIAGE.fillLen, 17, 9.5] };
export const PAWL_UP: Spec = { name: "pawl.up", min: [76, 10.5, 3.6], max: [79, 18.5, 14] };
export const PAWL_DOWN: Spec = { name: "pawl.down", min: [76, 10.5, 3.6], max: [79, 18.5, 3.9] };
export const STATIC_FRONT: Spec[] = [{ name: "cache.host", min: [94, 3, 3], max: [120, 19, 16] }];
export const CACHE_TOKEN: Spec = { name: "cache.token", min: [98, 8, 16], max: [116, 14, 18.5] };

export function buildGeometry() {
  return {
    viewBox: scene.viewBox,
    back: STATIC_BACK.map(drawn),
    inval: box(...CARRIAGE_INVAL.min, ...CARRIAGE_INVAL.max),
    fill: box(...CARRIAGE_FILL.min, ...CARRIAGE_FILL.max),
    pawlUp: box(...PAWL_UP.min, ...PAWL_UP.max),
    pawlDown: box(...PAWL_DOWN.min, ...PAWL_DOWN.max),
    front: STATIC_FRONT.map(drawn),
    token: box(...CACHE_TOKEN.min, ...CACHE_TOKEN.max),
    /** Screen shift for each carriage place (carriages are drawn at x = 0). */
    fillShift: Object.fromEntries(Object.entries(FILL_AT).map(([k, x]) => [k, shift(x)])) as Record<keyof typeof FILL_AT, [number, number]>,
    invalShift: Object.fromEntries(Object.entries(INVAL_AT).map(([k, x]) => [k, shift(x)])) as Record<keyof typeof INVAL_AT, [number, number]>,
  };
}
export type RaceGeometry = ReturnType<typeof buildGeometry>;

/** Every solid at rest for a state of the audit: carriages at the given left edges. */
export function auditShapes(fillX: number, invalX: number, pawlUp: boolean, token: boolean): Spec[] {
  const move = (s: Spec, x: number): Spec => ({ ...s, min: [s.min[0] + x, s.min[1], s.min[2]] as Pt3, max: [s.max[0] + x, s.max[1], s.max[2]] as Pt3 });
  return [...STATIC_BACK, move(CARRIAGE_INVAL, invalX), move(CARRIAGE_FILL, fillX), pawlUp ? PAWL_UP : PAWL_DOWN, ...STATIC_FRONT, ...(token ? [CACHE_TOKEN] : [])];
}
