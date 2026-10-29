import { describe, expect, it } from "vitest";
import { MAX_AGE_MS, POP_WINDOW_MS, saveMapView, takeMapView, type MapView } from "./mapView";

const memory = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v), removeItem: (k: string) => void delete data[k] };
};
const view: MapView = { scrollLeft: 260 };
const KEY = "sys101:mapView";

describe("restoring the Map's sideways scroll for the Back button", () => {
  it("returns the saved view when the Map is mounted right after a Back or Forward", () => {
    const s = memory();
    saveMapView(view, s, 1000);
    expect(takeMapView(s, 1500, 1400)).toEqual(view);
  });

  it("is read once: a second read, and the stored value, are gone", () => {
    const s = memory();
    saveMapView(view, s, 1000);
    takeMapView(s, 1500, 1400);
    expect(s.data[KEY]).toBeUndefined();
    expect(takeMapView(s, 1500, 1400)).toBeNull();
  });

  it("a fresh visit (no Back or Forward just before) starts fitted, and discards the old view", () => {
    const s = memory();
    saveMapView(view, s, 1000);
    expect(takeMapView(s, 1500, -Infinity)).toBeNull();
    expect(s.data[KEY]).toBeUndefined();
    const t = memory();
    saveMapView(view, t, 1000);
    expect(takeMapView(t, 1000 + POP_WINDOW_MS + 5000, 1000)).toBeNull(); // the pop was long before this mount
  });

  it("an old saved view belongs to a different visit", () => {
    const s = memory();
    saveMapView(view, s, 0);
    expect(takeMapView(s, MAX_AGE_MS + 1, MAX_AGE_MS)).toBeNull();
  });

  it("ignores corrupt, wrongly shaped and out-of-range data", () => {
    for (const raw of ["not json", "null", "{}", JSON.stringify({ v: 3, at: 1, view: { scrollLeft: "a" } }), JSON.stringify({ v: 3, at: 1, view: { scrollLeft: -5 } }), JSON.stringify({ v: 3, at: 1, view: {} })]) {
      expect(takeMapView(memory({ [KEY]: raw }), 100, 90), raw).toBeNull();
    }
  });

  it("works without storage and survives storage that throws", () => {
    expect(takeMapView(null, 100, 90)).toBeNull();
    expect(() => saveMapView(view, null)).not.toThrow();
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(() => saveMapView(view, broken)).not.toThrow();
    expect(takeMapView(broken, 100, 90)).toBeNull();
  });

  it("views saved by the older zoom camera (versions 1 and 2) are ignored", () => {
    for (const v of [1, 2]) {
      const old = memory({ [KEY]: JSON.stringify({ v, at: 10, view: { camera: { x: 0.4, y: 0.6, ratio: 0.5, angle: 0 }, scrollLeft: 260 } }) });
      expect(takeMapView(old, 20, 15), `v${v}`).toBeNull();
    }
  });
});
