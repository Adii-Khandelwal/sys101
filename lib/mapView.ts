// The Map's sideways scroll, kept for the Back button. Saved when a node is opened, restored once when the
// Map is mounted again by Back or Forward, and thrown away otherwise, so a fresh visit always starts at the left.

export type MapView = { scrollLeft: number };
/** v3 saves only the scroll; v1 and v2 saved a zoom camera and are ignored. */
type Saved = { v: 3; at: number; view: MapView };

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
    s?.setItem(KEY, JSON.stringify({ v: 3, at: now, view } satisfies Saved));
  } catch {
    // storage full or blocked: Back simply returns to the left edge
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
    if (p.v !== 3 || !finite(p.at) || now - p.at > MAX_AGE_MS) return null;
    if (!finite(p?.view?.scrollLeft) || p.view.scrollLeft < 0) return null;
    return { scrollLeft: p.view.scrollLeft };
  } catch {
    return null; // corrupt data
  }
}
