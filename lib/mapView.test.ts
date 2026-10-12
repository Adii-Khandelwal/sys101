import { describe, expect, it } from "vitest";
import { MAX_AGE_MS, POP_WINDOW_MS, saveMapView, takeMapView, type MapView } from "./mapView";

const memory = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v), removeItem: (k: string) => void delete data[k] };
};
const view: MapView = { camera: { x: 0.4, y: 0.6, ratio: 0.5, angle: 0 }, scrollLeft: 260 };
const KEY = "sys101:mapView";

describe("restoring the Map's zoom and position for the Back button", () => {
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
    for (const raw of ["not json", "null", "{}", JSON.stringify({ v: 2, at: 1, view }), JSON.stringify({ v: 1, at: 1, view: { camera: { x: "a", y: 0, ratio: 1 }, scrollLeft: 0 } }), JSON.stringify({ v: 1, at: 1, view: { camera: { x: 0, y: 0, ratio: 0 }, scrollLeft: 0 } }), JSON.stringify({ v: 1, at: 1, view: { camera: { x: 0, y: 0, ratio: 1 }, scrollLeft: -5 } })]) {
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

  it("always restores with angle 0", () => {
    const s = memory({ [KEY]: JSON.stringify({ v: 1, at: 10, view: { camera: { x: 1, y: 2, ratio: 3, angle: 99 }, scrollLeft: 0 } }) });
    expect(takeMapView(s, 20, 15)?.camera.angle).toBe(0);
  });
});
