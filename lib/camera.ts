// Pure camera math for the homepage graph. Every input (wheel, pinch,
// buttons, keys, double-click) goes through zoomTo, so they all share the
// same limits. Coordinates are Sigma's "framed graph" space: the camera's
// x/y is the view center, and ratio grows as you zoom out.

export type Camera = { x: number; y: number; ratio: number; angle: number };
export type Box = { minX: number; maxX: number; minY: number; maxY: number };

export const MIN_ZOOM = 0.6; // of the fitted view
export const MAX_ZOOM = 8;
export const STEP = 1.5; // buttons and keys
const PAN_MARGIN_PX = 64;

/** Ratio at which the content box exactly fits the viewport. */
export function fitRatio(contentW: number, contentH: number, viewW: number, viewH: number) {
  if (viewW <= 0 || viewH <= 0) return 1;
  return Math.max(contentW / viewW, contentH / viewH);
}

export function fitState(fit: number): Camera {
  return { x: 0.5, y: 0.5, ratio: fit, angle: 0 };
}

/** Is the camera on the fitted view, to a tolerance far below anything a reader could see? */
export function isFitted(cam: Camera, fit: number): boolean {
  return Math.abs(cam.ratio / fit - 1) < 0.002 && Math.abs(cam.x - 0.5) < 0.002 && Math.abs(cam.y - 0.5) < 0.002;
}

/** Ratio bounds: zoom 8x in to 0.6x out, relative to the fitted view. */
export function ratioLimits(fit: number) {
  return { min: fit / MAX_ZOOM, max: fit / MIN_ZOOM };
}

export function clampRatio(ratio: number, fit: number) {
  const { min, max } = ratioLimits(fit);
  return Math.min(max, Math.max(min, ratio));
}

/** Zoom level shown to the reader: 1 is the fitted view. */
export function zoomLevel(cam: Camera, fit: number) {
  return fit / cam.ratio;
}

/**
 * Zoom to `ratio` (clamped) keeping `anchor` fixed on screen. The anchor is
 * the pointer for wheel, pinch and double-click, and the view center for
 * buttons and keys. Never applies the pan limit, so zooming out never moves
 * the camera on its own.
 */
function zoomTo(cam: Camera, ratio: number, anchor: { x: number; y: number }, fit: number): Camera {
  const next = clampRatio(ratio, fit);
  const k = next / cam.ratio;
  return { ...cam, ratio: next, x: anchor.x + (cam.x - anchor.x) * k, y: anchor.y + (cam.y - anchor.y) * k };
}

/** Zoom by a factor (> 1 zooms in) around an anchor. */
export function zoomBy(cam: Camera, factor: number, anchor: { x: number; y: number }, fit: number): Camera {
  return zoomTo(cam, cam.ratio / factor, anchor, fit);
}

/**
 * Keep part of the graph within PAN_MARGIN_PX of the viewport edge.
 * `unitsPerPx` is framed units per screen pixel at ratio 1, so the visible
 * half-extents and margin scale with the camera ratio. Zooming out only
 * widens the allowed range, so a camera that was inside stays put.
 */
export function clampPan(cam: Camera, graph: Box, view: { width: number; height: number }, unitsPerPx: number): Camera {
  const s = unitsPerPx * cam.ratio;
  const hw = (view.width / 2) * s;
  const hh = (view.height / 2) * s;
  const m = PAN_MARGIN_PX * s;
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
  return {
    ...cam,
    x: clamp(cam.x, graph.minX + m - hw, graph.maxX - m + hw),
    y: clamp(cam.y, graph.minY + m - hh, graph.maxY - m + hh),
  };
}

/** Wheel delta to a zoom factor: one notch of a mouse wheel is about 20%. */
export function wheelFactor(deltaY: number) {
  return Math.exp(-deltaY * 0.002);
}

/** The screen distance the view moves when a finger or pointer goes from `prev` to `now`: the opposite way, so the content follows the pointer. */
export function dragView(prev: { x: number; y: number }, now: { x: number; y: number }) {
  return { x: prev.x - now.x, y: prev.y - now.y };
}

/** Move the camera by a distance in framed-graph units. A camera that moves right shows content further right, so the content on screen moves left. */
export function moveView(cam: Camera, delta: { x: number; y: number }): Camera {
  return { ...cam, x: cam.x + delta.x, y: cam.y + delta.y };
}
