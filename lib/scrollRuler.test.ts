import { describe, expect, it } from "vitest";
import { jumpTarget, percentLabel, percentTicks, rulerY, scrollFraction, scrollTopForPointer } from "./scrollRuler";

describe("scroll ruler maths", () => {
  it("maps scrollTop to a fraction and to the marker", () => {
    expect(scrollFraction(0, 3000, 1000)).toBe(0);
    expect(scrollFraction(1000, 3000, 1000)).toBe(0.5);
    expect(scrollFraction(5000, 3000, 1000)).toBe(1);
    expect(scrollFraction(10, 800, 1000)).toBe(0);
    expect(rulerY(1000, 2000, 700)).toBe(350);
    expect(rulerY(0, 0, 700)).toBe(0);
  });
  it("puts a heading tick where the marker is when that heading is at the top", () => {
    expect(rulerY(600, 2000, 800)).toBe(240);
  });
  it("turns a press into a scrollTop and clamps outside the track", () => {
    expect(scrollTopForPointer(160, 60, 200, 2000)).toBe(1000);
    expect(scrollTopForPointer(0, 60, 200, 2000)).toBe(0);
    expect(scrollTopForPointer(900, 60, 200, 2000)).toBe(2000);
  });
  it("lists percent ticks and the readout", () => {
    expect(percentTicks(500, 10).map((t) => t.y)).toEqual([0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]);
    expect(percentTicks(500, 2)).toHaveLength(51);
    expect(percentLabel(0.224)).toBe("22%");
    expect(percentLabel(2)).toBe("100%");
  });
  it("jumps to a heading below the header, inside the page", () => {
    expect(jumpTarget(1000, 76, 3000)).toBe(924);
    expect(jumpTarget(30, 76, 3000)).toBe(0);
    expect(jumpTarget(5000, 76, 3000)).toBe(3000);
  });
});
