import { describe, expect, it } from "vitest";
import { RAIL_SECTIONS, quizKey, railStates } from "./capstoneRail";

describe("capstone rail states", () => {
  it("is empty before anything is touched", () => {
    expect(Object.values(railStates({}, ["a", "b"], 3)).every((v) => v === "")).toBe(true);
  });
  it("counts decisions, marks touched, and counts quiz answers", () => {
    const s = railStates({ a: 1, _size: 1, _break: 1, [quizKey(0)]: 2 }, ["a", "b", "c"], 3);
    expect(s).toEqual({ design: "1 of 3 answered", size: "touched", break: "touched", check: "answered 1 of 3" });
  });
  it("says done when every question is answered, and ignores bad values", () => {
    expect(railStates({ _q0: 0, _q1: 1 }, [], 2).check).toBe("done");
    expect(railStates({ a: -1, b: 1.5 }, ["a", "b"], 2).design).toBe("");
  });
  it("lists seven sections in page order", () => {
    expect(RAIL_SECTIONS.map((s) => s.id)).toEqual(["brief", "design", "size", "system", "break", "differ", "check"]);
  });
});
