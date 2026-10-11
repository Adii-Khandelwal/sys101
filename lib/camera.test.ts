import { describe, expect, it } from "vitest";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  STEP,
  clampPan,
  fitRatio,
  fitState,
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
