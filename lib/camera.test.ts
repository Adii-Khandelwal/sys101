import { describe, expect, it } from "vitest";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  STEP,
  clampPan,
  revealDelta,
  dragView,
  moveView,
  fitRatio,
  fitState,
  isFitted,
  ratioLimits,
  wheelFactor,
  zoomBy,
  type Camera,
} from "./camera";

const fit = 1.25;
const center = { x: 0.5, y: 0.5 };
const pointer = { x: 0.8, y: 0.3 };
const { min, max } = ratioLimits(fit);

// Every input reduces to zoomBy with its own factor and anchor.
const inputs: Record<string, { zoomIn: (c: Camera) => Camera; zoomOut: (c: Camera) => Camera }> = {
  wheel: { zoomIn: (c) => zoomBy(c, wheelFactor(-120), pointer, fit), zoomOut: (c) => zoomBy(c, wheelFactor(120), pointer, fit) },
  pinch: { zoomIn: (c) => zoomBy(c, 1.3, pointer, fit), zoomOut: (c) => zoomBy(c, 1 / 1.3, pointer, fit) },
  buttons: { zoomIn: (c) => zoomBy(c, STEP, center, fit), zoomOut: (c) => zoomBy(c, 1 / STEP, center, fit) },
  keys: { zoomIn: (c) => zoomBy(c, STEP, center, fit), zoomOut: (c) => zoomBy(c, 1 / STEP, center, fit) },
  doubleClick: { zoomIn: (c) => zoomBy(c, 2, pointer, fit), zoomOut: (c) => zoomBy(c, 1 / 2, pointer, fit) },
};

const repeat = (c: Camera, f: (c: Camera) => Camera, n = 200) => Array.from({ length: n }).reduce<Camera>((s) => f(s), c);

describe("camera", () => {
  it("applies identical limits to every input", () => {
    for (const [name, input] of Object.entries(inputs)) {
      expect(repeat(fitState(fit), input.zoomIn).ratio, name).toBe(min);
      expect(repeat(fitState(fit), input.zoomOut).ratio, name).toBe(max);
    }
    expect(fit / min).toBeCloseTo(MAX_ZOOM);
    expect(fit / max).toBeCloseTo(MIN_ZOOM);
  });

  it("reaches the minimum zoom exactly when zooming out from the maximum", () => {
    for (const input of Object.values(inputs)) {
      const zoomedIn = repeat(fitState(fit), input.zoomIn);
      expect(repeat(zoomedIn, input.zoomOut).ratio).toBe(max);
    }
  });

  it("makes Fit all idempotent and identical after zooming fully out", () => {
    const fullyOut = repeat(zoomBy(fitState(fit), 3, pointer, fit), inputs.wheel.zoomOut);
    expect(fitState(fit)).toEqual(fitState(fit));
    expect(fitState(fit)).toEqual({ x: 0.5, y: 0.5, ratio: fit, angle: 0 });
    expect(fullyOut.ratio).toBe(max);
    // Fit all ignores where the camera was, so applying it twice changes nothing.
    const once = fitState(fit);
    const twice = fitState(fit);
    expect(twice).toEqual(once);
  });

  it("recomputes the fit ratio when the viewport resizes", () => {
    const content = { w: 1200, h: 400 };
    const wide = fitRatio(content.w, content.h, 1200, 400);
    const narrow = fitRatio(content.w, content.h, 600, 400);
    expect(wide).toBe(1);
    expect(narrow).toBe(2);
    expect(ratioLimits(narrow).max).toBeGreaterThan(ratioLimits(wide).max);
  });

  it("does not move the camera when zooming out within the pan limit", () => {
    const graph = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    const view = { width: 1000, height: 400 };
    const unitsPerPx = 1 / 1000;
    const panned = clampPan({ x: 1.3, y: 0.5, ratio: 0.5, angle: 0 }, graph, view, unitsPerPx);
    expect(clampPan(panned, graph, view, unitsPerPx)).toEqual(panned);
    let cam = panned;
    for (let i = 0; i < 10; i++) {
      const out = zoomBy(cam, 1 / STEP, { x: cam.x, y: cam.y }, fit);
      expect(clampPan(out, graph, view, unitsPerPx)).toEqual(out);
      cam = out;
    }
  });

  it("keeps part of the graph within the pan margin", () => {
    const graph = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    const view = { width: 1000, height: 400 };
    const far = clampPan({ x: 50, y: -50, ratio: 1, angle: 0 }, graph, view, 1 / 1000);
    // Right edge of the graph is 64px inside the left edge of the viewport.
    expect(far.x - 0.5).toBeCloseTo(1 - 0.064);
  });
});

describe("zoom round trips", () => {
  const start = fitState(fit);
  const from = (c: Camera, f: (c: Camera) => Camera, n = 60) => repeat(c, f, n);

  for (const [name, input] of Object.entries(inputs)) {
    it(`${name}: zoom to the maximum, back to the minimum, then Fit all is the identical state`, () => {
      const atMax = from(start, input.zoomIn);
      expect(atMax.ratio).toBeCloseTo(min, 10);
      const atMin = from(atMax, input.zoomOut);
      expect(atMin.ratio).toBeCloseTo(max, 10);
      expect(fitState(fit)).toEqual(start);
    });

    it(`${name}: is never stuck at either limit`, () => {
      const atMax = from(start, input.zoomIn);
      expect(input.zoomOut(atMax).ratio).toBeGreaterThan(atMax.ratio);
      const atMin = from(start, input.zoomOut);
      expect(input.zoomIn(atMin).ratio).toBeLessThan(atMin.ratio);
    });
  }

  it("zooming at a corner and back out leaves the view centre where the anchor kept it", () => {
    const corner = { x: 0.95, y: 0.05 };
    const zoomed = zoomBy(zoomBy(start, 3, corner, fit), 1 / 3, corner, fit);
    expect(zoomed.ratio).toBeCloseTo(start.ratio, 10);
    expect(zoomed.x).toBeCloseTo(start.x, 10);
    expect(zoomed.y).toBeCloseTo(start.y, 10);
  });

  it("a different label scale does not change the fit ratio, which comes from the layout box and the viewport", () => {
    expect(fitRatio(1296, 520, 1296, 520)).toBe(1);
    expect(fitRatio(1296, 520, 1296, 520)).toBe(fitRatio(1296, 520, 1296, 520));
  });
});


describe("dragging", () => {
  // A node's place on screen, in pixels from the view centre: (graph - camera) / s, where s is framed units per pixel.
  const screenX = (nodeX: number, cam: Camera, s: number) => (nodeX - cam.x) / s;
  const screenY = (nodeY: number, cam: Camera, s: number) => (nodeY - cam.y) / s;

  it("content follows the finger: dragging right moves the content right, dragging up moves it up", () => {
    const cam: Camera = { x: 0.5, y: 0.5, ratio: 1, angle: 0 };
    const s = 0.001;
    const view = dragView({ x: 100, y: 100 }, { x: 200, y: 60 }); // finger: 100px right, 40px up
    const next = moveView(cam, { x: view.x * s, y: view.y * s });
    expect(screenX(0.6, next, s) - screenX(0.6, cam, s)).toBeCloseTo(100);
    expect(screenY(0.6, next, s) - screenY(0.6, cam, s)).toBeCloseTo(-40);
  });
});

describe("isFitted (the Fit to size button's state)", () => {
  const fit = 1.6;
  it("is true on the fitted view and for tiny float noise around it", () => {
    expect(isFitted(fitState(fit), fit)).toBe(true);
    expect(isFitted({ ...fitState(fit), ratio: fit * 1.0005, x: 0.5004 }, fit)).toBe(true);
  });
  it("is false after any zoom or pan a reader could see", () => {
    expect(isFitted(zoomBy(fitState(fit), 2, { x: 0.5, y: 0.5 }, fit), fit)).toBe(false); // zoomed in
    expect(isFitted({ ...fitState(fit), ratio: fit / 0.7 }, fit)).toBe(false); // zoomed out
    expect(isFitted({ ...fitState(fit), x: 0.52 }, fit)).toBe(false); // panned sideways
    expect(isFitted({ ...fitState(fit), y: 0.47 }, fit)).toBe(false); // panned up
  });
  it("Fit all always lands on a fitted view", () => {
    const dragged = moveView(zoomBy(fitState(fit), 3, { x: 0.4, y: 0.6 }, fit), { x: 0.05, y: -0.03 });
    expect(isFitted(dragged, fit)).toBe(false);
    expect(isFitted(fitState(fit), fit)).toBe(true);
  });
});

describe("revealDelta (keyboard focus on a station that is off screen)", () => {
  it("is zero when the point is already inside the margins", () => {
    expect(revealDelta(300, 0, 1000)).toBe(0);
    expect(revealDelta(40, 0, 1000)).toBe(0);
  });
  it("moves left or up (negative) for a point before the low margin, and right or down for one past the high margin", () => {
    expect(revealDelta(-100, 0, 1000)).toBe(-140);
    expect(revealDelta(1200, 0, 1000, 40, 100)).toBe(300);
  });
  it("leaves room for a label that extends past the station", () => {
    expect(revealDelta(900, 0, 1000, 40, 40 + 150)).toBe(90);
  });
});
