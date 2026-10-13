// Geometry of the commit latch: two account cabinets with cards on top, a latch or padlock on each
// front and a cord between the locks. World x runs left to right, y is depth, z is height.
import { makeScene, type Spec } from "../scene";

const scene = makeScene([[-6, 0, 0], [126, 0, 0], [126, 24, 0], [-6, 24, 0], [6, 4, 34], [114, 4, 34]]);
export const PROJECTION = scene.projection;
const { box, drawn, iso } = scene;

const BOB = 6;
const JOE = 74;
const W = 40;
const cabinet = (name: string, x0: number): Spec => ({ name: `cabinet.${name}`, min: [x0, 4, 3], max: [x0 + W, 16, 24] });
const cards = (name: string, x0: number) => ({
  old: { name: `${name}.card.old`, min: [x0 + 5, 6, 24], max: [x0 + 15, 14, 24.8] } as Spec,
  new: { name: `${name}.card.new`, min: [x0 + 19, 6, 24], max: [x0 + 29, 14, 24.8] } as Spec,
  flag: [
    { name: `${name}.flag.pole`, min: [x0 + 33, 9, 24], max: [x0 + 34.2, 10.2, 34] },
    { name: `${name}.flag.pennant`, min: [x0 + 34.2, 9, 29.5], max: [x0 + 38, 10.2, 34] },
  ] as Spec[],
});
const bobCards = cards("bob", BOB);
const joeCards = cards("joe", JOE);
export const LATCH: Spec[] = [
  { name: "bob.latch", min: [BOB + W / 2 - 5, 16, 12], max: [BOB + W / 2 + 5, 18.5, 17] },
  { name: "bob.latch.hasp", min: [BOB + W / 2 - 2.5, 16, 17], max: [BOB + W / 2 + 2.5, 18.5, 19.5] },
];
export const PADLOCK: Spec = { name: "joe.lock", min: [JOE + W / 2 - 3, 16, 12], max: [JOE + W / 2 + 3, 18, 16] };

export function buildGeometry() {
  const c = (x0: number) => x0 + W / 2;
  // The cord leaves the padlock, runs along the base in front of both cabinets and rises to the latch.
  const cord = [[c(JOE), 18, 12], [c(JOE), 21, 3], [c(BOB), 21, 3], [c(BOB), 18.5, 12]] as [number, number, number][];
  return {
    viewBox: scene.viewBox,
    base: drawn({ name: "stand.base", min: [-6, 0, 0], max: [126, 24, 3] }),
    bobCabinet: drawn(cabinet("bob", BOB)),
    joeCabinet: drawn(cabinet("joe", JOE)),
    bob: { old: box(...bobCards.old.min, ...bobCards.old.max), new: box(...bobCards.new.min, ...bobCards.new.max), flag: bobCards.flag.map(drawn) },
    joe: { old: box(...joeCards.old.min, ...joeCards.old.max), new: box(...joeCards.new.min, ...joeCards.new.max), flag: joeCards.flag.map(drawn) },
    latch: LATCH.map(drawn),
    padlock: drawn(PADLOCK),
    cord: `M${cord.map((p) => iso(p).join(",")).join("L")}`,
  };
}
export type LatchGeometry = ReturnType<typeof buildGeometry>;

/** Every solid at rest for the audit: what is drawn in each state of the figure. */
export function auditShapes(o: { bobLock: boolean; joeLock: boolean; bobNew: boolean; joeNew: boolean; bobFlag: boolean; joeFlag: boolean }): Spec[] {
  return [
    { name: "stand.base", min: [-6, 0, 0], max: [126, 24, 3] },
    cabinet("bob", BOB),
    cabinet("joe", JOE),
    bobCards.old,
    joeCards.old,
    ...(o.bobNew ? [bobCards.new] : []),
    ...(o.joeNew ? [joeCards.new] : []),
    ...(o.bobFlag ? bobCards.flag : []),
    ...(o.joeFlag ? joeCards.flag : []),
    ...(o.bobLock ? LATCH : []),
    ...(o.joeLock ? [PADLOCK] : []),
  ];
}
