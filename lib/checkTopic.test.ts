import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { getAllTopics } from "./topics";

const run = (slug: string) => spawnSync("node", ["scripts/check-topic.mjs", slug], { encoding: "utf8" });

describe("scripts/check-topic.mjs", () => {
  it("passes for every topic that exists today", () => {
    for (const t of getAllTopics()) expect(run(t.slug).status, `${t.slug}\n${run(t.slug).stderr}`).toBe(0);
  });
  it("fails for a topic with no file", () => {
    expect(run("no-such-topic").status).toBe(1);
  });
});
