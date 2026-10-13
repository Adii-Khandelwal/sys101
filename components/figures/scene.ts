// Shared isometric scene for the post figures: one projection, three visible faces per box.
// Pure TypeScript with no DOM, so the server builds it, tests check it and the anatomy skill's
// audit can replay it. World units: x runs along the rails, y is depth, z is height.
export type Pt3 = [number, number, number];
export type Flat = [number, number];
export type Box = { top: string; front: string; right: string };
export type Spec = { name: string; min: Pt3; max: Pt3 };

const AZ = (18 * Math.PI) / 180;
const EL = (30 * Math.PI) / 180;
const [cA, sA, cE, sE] = [Math.cos(AZ), Math.sin(AZ), Math.cos(EL), Math.sin(EL)];
const round = (n: number) => Math.round(n * 100) / 100;
const raw = ([x, y, z]: Pt3): Flat => [x * cA - y * sA, (x * sA + y * cA) * sE - z * cE];

const WIDTH = 720;
const PAD = 14;

/** Fit the viewBox to the extreme points of everything drawn (including moved parts at both ends). */
export function makeScene(extremes: Pt3[]) {
  const xs = extremes.map((p) => raw(p)[0]);
  const ys = extremes.map((p) => raw(p)[1]);
  const S = (WIDTH - 2 * PAD) / (Math.max(...xs) - Math.min(...xs));
  const height = Math.ceil((Math.max(...ys) - Math.min(...ys)) * S + 2 * PAD);
  const OX = PAD - Math.min(...xs) * S;
  const OY = PAD - Math.min(...ys) * S;
  const iso = (p: Pt3): Flat => {
    const [x, y] = raw(p);
    return [round(OX + x * S), round(OY + y * S)];
  };
  const poly = (pts: Pt3[]) => `M${pts.map((p) => iso(p).join(",")).join("L")}Z`;
  /** The three faces a viewer sees: top, the +y face and the +x face. */
  const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
    top: poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]),
    front: poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]),
    right: poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]),
  });
  const drawn = ({ name, min, max }: Spec) => ({ name, box: box(...min, ...max) });
  /** Screen shift for a world move of (dx, dy, dz), for transforms. */
  const shift = (dx: number, dy = 0, dz = 0): Flat => {
    const [x, y] = raw([dx, dy, dz]);
    return [round(x * S * 100) / 100, round(y * S * 100) / 100];
  };
  /** The kit's camera for the same view, so the skill's audit sees what is drawn: azimuth 72 puts x to the right. */
  const projection = { origin: [OX, OY] as Flat, scale: S / Math.sqrt(1.6), azimuth: 90 - 18, elevation: 30 };
  return { iso, box, drawn, shift, projection, S, height, viewBox: `0 0 ${WIDTH} ${height}`, matrixOf: () => [round(cA * S * 1000) / 1000, round(sA * sE * S * 1000) / 1000, round(cE * S * 1000) / 1000] as Pt3 };
}
