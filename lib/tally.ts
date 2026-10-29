/** Tally marks for topics read: bundles of four upright strokes struck through by a fifth. */
export function tallyBundles(n: number) {
  const count = Math.max(0, Math.floor(n));
  return { fives: Math.floor(count / 5), rest: count % 5 };
}

const STROKE = 6; // distance between strokes
const BUNDLE = 32; // width of one bundle of five, with its gap

/** SVG path data and width for a tally of n, in a 26px-high box. Strokes lean slightly, as drawn by hand. */
export function tallyPath(n: number) {
  const { fives, rest } = tallyBundles(n);
  const stroke = (x: number, k: number) => `M${x + k * STROKE} 4L${x + k * STROKE + (k % 2 ? 0.8 : -0.6)} 21`;
  let d = "";
  let x = 4;
  for (let g = 0; g < fives; g++) {
    for (let k = 0; k < 4; k++) d += stroke(x, k);
    d += `M${x - 3} 18L${x + 22} 6`;
    x += BUNDLE;
  }
  for (let k = 0; k < rest; k++) d += stroke(x, k);
  return { d, width: Math.max(8, x + rest * STROKE + 3) };
}
