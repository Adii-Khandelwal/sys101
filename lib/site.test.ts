import { describe, expect, it } from "vitest";
import { absoluteUrl, breadcrumbLd, clip, firstSentence } from "./site";

describe("meta text", () => {
  it("takes the first sentence", () => {
    expect(firstSentence("Caching keeps copies close. It costs freshness.")).toBe("Caching keeps copies close.");
  });

  it("does not split on a dot inside a word", () => {
    expect(firstSentence("Use node.js for this. Then stop.")).toBe("Use node.js for this.");
  });

  it("clips at a word boundary under the limit", () => {
    const out = clip("word ".repeat(60), 155);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith("word…")).toBe(true);
  });
});

describe("urls", () => {
  it("has no trailing slash on the home URL and no query strings", () => {
    expect(absoluteUrl("/")).toMatch(/^https:\/\/[^/?]+$/);
    expect(absoluteUrl("/topic/dns")).toMatch(/\/topic\/dns$/);
  });

  it("numbers breadcrumb items from 1", () => {
    const ld = breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "DNS", path: "/topic/dns" },
    ]);
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });
});
