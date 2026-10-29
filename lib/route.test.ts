import { describe, expect, it } from "vitest";
import { routeTo } from "./route";
import { getAllTopics } from "./topics";

const t = (slug: string, prerequisites: string[] = []) => ({ slug, prerequisites });

describe("routeTo", () => {
  it("lists each prerequisite once, after what it builds on", () => {
    const all = [t("a"), t("b", ["a"]), t("c", ["a"]), t("d", ["b", "c"])];
    expect(routeTo("d", all).map((x) => x.slug)).toEqual(["a", "b", "c"]);
  });
  it("is empty for a topic with no prerequisites", () => {
    expect(routeTo("a", [t("a"), t("b", ["a"])])).toEqual([]);
  });
  it("survives a cycle and never includes the topic itself", () => {
    expect(routeTo("a", [t("a", ["b"]), t("b", ["a"])]).map((x) => x.slug)).toEqual(["b"]);
  });
  it("respects prerequisites for every real topic", () => {
    const all = getAllTopics();
    for (const topic of all) {
      const r = routeTo(topic.slug, all).map((x) => x.slug);
      expect(new Set(r).size).toBe(r.length);
      expect(r).not.toContain(topic.slug);
      for (const x of routeTo(topic.slug, all)) for (const p of x.prerequisites) expect(r.indexOf(p)).toBeLessThan(r.indexOf(x.slug));
    }
  });
});
