import { describe, it, expect } from "vitest";
import { inProgressSlugs } from "./progress";
import type { Progress } from "./lessonStore";

const progress = (topics: Progress["topics"]): Progress => ({ version: 3, topics, posts: [] });

describe("inProgressSlugs", () => {
  it("lists topics the reader deliberately started (a section done or a quiz answered)", () => {
    const p = progress({
      dns: { done: ["why"], visited: ["why"], answers: {} },
      databases: { done: [], visited: [], answers: { "0": "a" } },
    });
    expect(inProgressSlugs(p, []).sort()).toEqual(["databases", "dns"]);
  });

  it("does not count a topic only scrolled into view (visited but nothing done)", () => {
    const p = progress({ caching: { done: [], visited: ["why", "model", "how"], answers: {} } });
    expect(inProgressSlugs(p, [])).toEqual([]);
  });

  it("excludes read topics", () => {
    const p = progress({ dns: { done: ["why"], visited: ["why"], answers: {} } });
    expect(inProgressSlugs(p, ["dns"])).toEqual([]);
  });

  it("excludes topics with no progress at all", () => {
    const p = progress({ dns: { done: [], visited: [], answers: {} } });
    expect(inProgressSlugs(p, [])).toEqual([]);
  });
});
