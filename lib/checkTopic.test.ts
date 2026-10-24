import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { getAllTopics } from "./topics";

const run = (slug: string) => spawnSync("node", ["scripts/check-topic.mjs", slug], { encoding: "utf8" });

describe("scripts/check-topic.mjs", () => {
  it("passes for every topic that exists today", () => {
    for (const t of getAllTopics()) {
      const r = run(t.slug); // once per topic: the message below must not spawn a second process
      expect(r.status, `${t.slug}\n${r.stderr}`).toBe(0);
    }
  }, 60_000);
  it("fails for a topic with no file", () => {
    expect(run("no-such-topic").status).toBe(1);
  });
});
