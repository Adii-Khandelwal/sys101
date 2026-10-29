import { describe, expect, it } from "vitest";
import { firstSentence, neighbours, nextUpSlug, signSlug } from "./stationSign";

describe("station sign selection", () => {
  it("prefers the hovered or focused topic, then Next up, then the first", () => {
    expect(signSlug("caching", "dns", "databases")).toBe("caching");
    expect(signSlug(null, "dns", "databases")).toBe("dns");
    expect(signSlug(null, null, "databases")).toBe("databases");
  });
  it("follows the Next up button's topic", () => {
    expect(nextUpSlug({ kind: "start" }, "a")).toBe("a");
    expect(nextUpSlug({ kind: "next", next: { slug: "b", title: "B", prerequisites: [] }, also: null }, "a")).toBe("b");
    expect(nextUpSlug({ kind: "done" }, "a")).toBeNull();
  });
  it("lists neighbours in course order without repeats", () => {
    const edges = [
      { from: "b", to: "d" },
      { from: "a", to: "d" },
      { from: "d", to: "f" },
      { from: "d", to: "e" },
    ];
    expect(neighbours("d", edges, ["a", "b", "c", "d", "e", "f"])).toEqual({ before: ["a", "b"], after: ["e", "f"] });
  });
  it("cuts a concept at its first sentence", () => {
    expect(firstSentence("One. Two.")).toBe("One.");
  });
});
