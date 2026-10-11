// Motion tokens. The only place durations and easings are defined; the CSS
// custom properties in app/globals.css mirror these (checked by motion.test.ts).
// Motion gives feedback or shows a change of state, never decoration.

export const DURATION = {
  fast: 120, // press feedback, label swaps, tooltips, color state
  base: 200, // reveals, markers, page fade-in
  slow: 320, // camera moves, progress fills
  page: 160, // cross-fade between pages
  reduced: 80, // the longest fade allowed under prefers-reduced-motion
  pulse: 1400, // skeleton loading pulse
} as const;

export const EASING = {
  out: [0.23, 1, 0.32, 1], // entering or responding
  inOut: [0.645, 0.045, 0.355, 1], // moving on screen
} as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A cubic-bezier easing as a function of t in [0, 1]. */
export function bezier([x1, y1, x2, y2]: readonly number[]) {
  const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1;
  const b = (p1: number, p2: number) => 3 * p2 - 6 * p1;
  const c = (p1: number) => 3 * p1;
  const at = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t: number, p1: number, p2: number) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) break;
      t -= (at(t, x1, x2) - x) / s;
    }
    return at(t, y1, y2);
  };
}

export const easeOut = bezier(EASING.out);
export const easeInOut = bezier(EASING.inOut);
