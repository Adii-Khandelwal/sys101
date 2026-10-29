import { describe, expect, it } from "vitest";
import { citable, markCitations } from "./citations";

describe("citations", () => {
  const cites = citable([{ company: "Uber" }, { company: "Meta" }, { company: "Meta" }]);

  it("skips a company that wrote two posts", () => {
    expect(cites).toEqual([{ company: "Uber", n: 1 }]);
  });

  it("marks the first mention only, and never alters the text", () => {
    const seen = new Set<number>();
    const a = markCitations("Uber's fleet and Uber again", cites, seen);
    expect(a).toEqual(["Uber", { n: 1 }, "'s fleet and Uber again"]);
    expect(a.filter((x) => typeof x === "string").join("")).toBe("Uber's fleet and Uber again");
    expect(markCitations("Uber once more", cites, seen)).toEqual(["Uber once more"]);
  });

  it("matches whole words", () => {
    expect(markCitations("Uberize it", cites, new Set())).toEqual(["Uberize it"]);
  });
});
