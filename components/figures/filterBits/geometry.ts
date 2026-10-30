// Geometry of the membership-filter rig: a row of 12 cells with pins (flat is 0, raised is 1), a bridge over it
// carrying three legs, a lamp, and three bars in front for the space comparison.
// World x runs along the row, y is depth, z is height. Pure TypeScript: the Live part and the audit both build from here.
import { makeScene, type Spec } from "../scene";
import { CELLS, spaceOf, type FilterInputs } from "../../../lib/filterBits";

export const CELL = 12;
export const FLOOR = 3;
const SPAN = CELLS * CELL;
const Y0 = 8; // cell strip
const Y1 = 22;
const YC = (Y0 + Y1) / 2;
const PIN = 6;
const PIN_LOW = 6; // top of a flat pin
export const PIN_HIGH = 12; // top of a raised pin, where a leg ends
const LEG = 3.5;
const LEG_TOP = 18;
const BAR_Y = [30, 37, 44];
const BAR_H = 2;
const BAR_UNIT = SPAN / 150; // so a bar at 1.5 times the lower bound spans the row

const scene = makeScene([[-8, -6, 0], [SPAN + 8, -6, 0], [SPAN + 8, 54, 0], [-8, 54, 0], [-6, 11, 26], [SPAN + 6, 11, 26]]);
export const PROJECTION = scene.projection;
export const { shift } = scene;
export const drawn = scene.drawn;

const AZ = (18 * Math.PI) / 180;
const cx = (c: number) => c * CELL + CELL / 2;

export const BASE: Spec[] = [
  { name: "stand.base", min: [-8, -6, 1.5], max: [SPAN + 8, 54, FLOOR] },
  ...[[-8, -6], [SPAN + 4, -6], [-8, 50], [SPAN + 4, 50]].map(([x, y], i): Spec => ({ name: `stand.foot${i}`, min: [x, y, 0], max: [x + 4, y + 4, 1.5] })),
];
export const slabSpec = (c: number): Spec => ({ name: `cell.${c}`, min: [c * CELL + 0.5, Y0, FLOOR], max: [(c + 1) * CELL - 0.5, Y1, FLOOR + 1] });
export const pinSpec = (c: number): Spec => ({ name: `pin.${c}`, min: [cx(c) - PIN / 2, YC - PIN / 2, FLOOR + 1], max: [cx(c) + PIN / 2, YC + PIN / 2, PIN_LOW] });
/** The raised part of a pin, sitting flush on the flat one. */
export const riserSpec = (c: number): Spec => ({ name: `riser.${c}`, min: [cx(c) - PIN / 2, YC - PIN / 2, PIN_LOW], max: [cx(c) + PIN / 2, YC + PIN / 2, PIN_HIGH] });
export const PILLARS: Spec[] = [
  { name: "pillar.left", min: [-6, YC - 4, FLOOR], max: [-2, YC + 4, LEG_TOP] },
  { name: "pillar.right", min: [SPAN + 2, YC - 4, FLOOR], max: [SPAN + 6, YC + 4, LEG_TOP] },
];
export const BRIDGE: Spec = { name: "bridge", min: [-6, YC - 4, LEG_TOP], max: [SPAN + 6, YC + 4, 21] };
export const LAMP: Spec = { name: "lamp", min: [SPAN - 12, YC - 2, 21], max: [SPAN - 4, YC + 2, 25] };
/** A leg drawn over cell 0; the figure shifts it by CELL per cell. It ends on the top of a raised pin. */
export const legSpec = (c: number): Spec => ({ name: `leg.${c}`, min: [cx(c) - LEG / 2, YC - LEG / 2, PIN_HIGH], max: [cx(c) + LEG / 2, YC + LEG / 2, LEG_TOP] });
export const barSpecs = (i: FilterInputs): Spec[] => {
  const s = spaceOf(i);
  return [100, s.bloom, s.ribbon].map((v, k): Spec => ({ name: `bar.${k}`, min: [0, BAR_Y[k], FLOOR], max: [v * BAR_UNIT, BAR_Y[k] + 4, FLOOR + BAR_H] }));
};

const depth = (s: Spec) => ((s.min[0] + s.max[0]) / 2) * Math.sin(AZ) + ((s.min[1] + s.max[1]) / 2) * Math.cos(AZ);
/** Painter's order: far to near by the centre on the floor, then low to high. */
export const byDepth = (a: Spec, b: Spec) => depth(a) - depth(b) || a.min[2] - b.min[2];

export type View = { bits: number[]; probe: number[] | null; bars: boolean };

/** Everything drawn for one state, in painter's order. The audit replays exactly this. */
export function viewSpecs(v: View, i: FilterInputs): Spec[] {
  const row = [...Array.from({ length: CELLS }, (_, c) => slabSpec(c)), ...PILLARS, ...Array.from({ length: CELLS }, (_, c) => pinSpec(c)), ...v.bits.flatMap((b, c) => (b ? [riserSpec(c)] : []))].sort(byDepth);
  return [...BASE, ...row, ...(v.bars ? barSpecs(i) : []), ...(v.probe ? v.probe.map(legSpec) : []), BRIDGE, LAMP];
}

export function buildGeometry() {
  return { viewBox: scene.viewBox };
}
export type FilterGeometry = ReturnType<typeof buildGeometry>;

/** Audit entry: the visible parts for a state of the figure. */
export function auditShapes(v: View, i: FilterInputs): Spec[] {
  return viewSpecs(v, i);
}
