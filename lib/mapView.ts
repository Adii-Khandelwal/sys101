// The Map's camera and sideways scroll, kept for the Back button. Saved when a node is opened, restored once when the
// Map is mounted again by Back or Forward, and thrown away otherwise, so a fresh visit always starts fitted.
import type { Camera } from "./camera";

export type MapView = { camera: Camera; scrollLeft: number };
type Saved = { v: 1; at: number; view: MapView };

const KEY = "sys101:mapView";
/** The Map mounts within this long of a popstate (Back or Forward) when it is the page being returned to. */
export const POP_WINDOW_MS = 2000;
/** A saved view older than this is a different visit. */
export const MAX_AGE_MS = 30 * 60 * 1000;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

let poppedAt = -Infinity;
if (typeof window !== "undefined") window.addEventListener("popstate", () => (poppedAt = Date.now()));

const store = (): Store | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null; // storage blocked
  }
};

export function saveMapView(view: MapView, s: Store | null = store(), now = Date.now()) {
  try {
    s?.setItem(KEY, JSON.stringify({ v: 1, at: now, view } satisfies Saved));
  } catch {
    // storage full or blocked: Back simply returns to the fitted map
  }
}

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** The saved view if the Map is being returned to by Back or Forward right now, else null. Always clears it. */
export function takeMapView(s: Store | null = store(), now = Date.now(), popped = poppedAt): MapView | null {
  if (!s) return null;
  let raw: string | null = null;
  try {
    raw = s.getItem(KEY);
    s.removeItem(KEY);
  } catch {
    return null;
  }
  if (!raw || now - popped > POP_WINDOW_MS) return null;
  try {
    const p = JSON.parse(raw) as Saved;
    const c = p?.view?.camera;
    if (p.v !== 1 || !finite(p.at) || now - p.at > MAX_AGE_MS) return null;
    if (!c || !finite(c.x) || !finite(c.y) || !finite(c.ratio) || c.ratio <= 0 || !finite(p.view.scrollLeft) || p.view.scrollLeft < 0) return null;
    return { camera: { x: c.x, y: c.y, ratio: c.ratio, angle: 0 }, scrollLeft: p.view.scrollLeft };
  } catch {
    return null; // corrupt data
  }
}
