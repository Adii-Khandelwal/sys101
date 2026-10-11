import { describe, expect, it } from "vitest";
import { containsAll, finishedWords } from "./searchMatch";

describe("search: finished words must really appear", () => {
  it("only counts words followed by a space as finished", () => {
    expect(finishedWords("flipkart")).toEqual([]);
    expect(finishedWords("flipkart ")).toEqual(["flipkart"]);
    expect(finishedWords("uber cac")).toEqual(["uber"]);
  });
  it("drops pages that only match loosely", () => {
    const text = "rows were backfilled on the fly instead";
    expect(containsAll(text, ["flipkart"])).toBe(false);
    expect(containsAll(text, ["fly"])).toBe(true);
    expect(containsAll("Caches at the edge", ["cache"])).toBe(true); // word start, so plurals still match
    expect(containsAll("subcache", ["cache"])).toBe(false);
  });
});
