import { describe, expect, it } from "vitest";
import { jumpTarget, percentLabel, percentTicks, scrollFraction, scrollTopForDrag, tapeShift } from "./scrollRuler";

describe("scroll ruler maths", () => {
  it("maps scrollTop to a fraction", () => {
    expect(scrollFraction(0, 3000, 1000)).toBe(0);
    expect(scrollFraction(1000, 3000, 1000)).toBe(0.5);
    expect(scrollFraction(5000, 3000, 1000)).toBe(1);
    expect(scrollFraction(10, 800, 1000)).toBe(0);
  });
  it("slides the tape so the marker reads the current percent", () => {
    expect(tapeShift(0, 200, 10)).toBe(200);
    expect(tapeShift(0.5, 200, 10)).toBe(-300);
    expect(tapeShift(2, 200, 10)).toBe(-800);
  });
  it("turns a drag of the tape into a scrollTop and clamps", () => {
    expect(scrollTopForDrag(1000, -50, 10, 2000)).toBe(1100);
    expect(scrollTopForDrag(1000, 50, 10, 2000)).toBe(900);
    expect(scrollTopForDrag(100, 500, 10, 2000)).toBe(0);
    expect(scrollTopForDrag(1900, -500, 10, 2000)).toBe(2000);
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
