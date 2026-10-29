import { describe, expect, it } from "vitest";
import { stackTops } from "./marginStack";

describe("stackTops", () => {
  it("keeps notes where they want to be when there is room", () => {
    expect(stackTops([10, 200], [50, 50]).tops).toEqual([10, 200]);
  });
  it("pushes a note down past the previous one, with the gap", () => {
    expect(stackTops([10, 20, 30], [50, 50, 50]).tops).toEqual([10, 68, 126]);
  });
  it("pulls the group back up when the last would pass the section's end", () => {
    const { tops, bottom } = stackTops([0, 300, 310], [100, 100, 100], 420);
    expect(tops[2] + 100).toBeLessThanOrEqual(420);
    expect(tops[1] + 100 + 8).toBeLessThanOrEqual(tops[2]);
    expect(bottom).toBeLessThanOrEqual(420);
  });
  it("lets the column grow, without overlap, when the notes cannot fit the section", () => {
    const { tops, bottom } = stackTops([0, 0, 0], [100, 100, 100], 150);
    expect(tops).toEqual([0, 108, 216]);
    expect(bottom).toBe(316);
  });
  it("handles no notes", () => {
    expect(stackTops([], [])).toEqual({ tops: [], bottom: 0 });
  });
  it("places a single note at its wanted top", () => {
    expect(stackTops([40], [60], 500)).toEqual({ tops: [40], bottom: 100 });
  });
  it("lets a note taller than its section start at the top and report its own height", () => {
    expect(stackTops([30], [200], 100)).toEqual({ tops: [0], bottom: 200 });
  });
});
