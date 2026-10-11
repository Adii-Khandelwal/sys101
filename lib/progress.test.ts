import { describe, it, expect } from "vitest";
import { inProgressSlugs } from "./progress";
import type { Progress } from "./lessonStore";

const progress = (topics: Progress["topics"]): Progress => ({ version: 3, topics, posts: [] });

describe("inProgressSlugs", () => {
  it("lists topics with some progress that are not read", () => {
    const p = progress({
      dns: { done: ["why"], visited: ["why"], answers: {} },
      caching: { done: [], visited: ["why", "model"], answers: {} },
      databases: { done: [], visited: [], answers: { "0": "a" } },
    });
    expect(inProgressSlugs(p, []).sort()).toEqual(["caching", "databases", "dns"]);
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
