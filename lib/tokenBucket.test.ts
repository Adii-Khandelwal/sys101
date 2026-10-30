import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { BUCKET_STEPS, CAPACITY, DEBT_MAX, bucketLast, bucketState, bucketValid } from "./tokenBucket";

// Read the JSON directly: the registry (lib/figures.ts) knows the id only once the admin applies the snippets.
const topic = JSON.parse(fs.readFileSync("content/topics/rate-limiting.json", "utf8"));
const post = topic.posts.find((p: { digest: { figure?: { id: string } } }) => p.digest.figure?.id === "token-bucket");
const num = (row: number) => Number(post.digest.numbers[row].value.match(/\d[\d,]*(?:\.\d+)?/)[0].replace(/,/g, ""));

describe("token bucket model", () => {
  const i = { batchMs: 100 };
  it("reads the post's numbers rows", () => {
    expect({ batchMs: num(post.digest.figure.rows.batchMs) }).toEqual(i);
    expect(bucketValid(i)).toBe(true);
    expect(bucketValid({ batchMs: 0 })).toBe(false);
  });

  const levels = Array.from({ length: BUCKET_STEPS }, (_, s) => bucketState(i, s));
  it("follows the story: burst goes negative, rejects until zero, then serves", () => {
    expect(levels.map((s) => s.level)).toEqual([4, -2, -2, 0, 1]);
    expect(levels.map((s) => s.rejecting)).toEqual([false, true, true, false, false]);
    expect(levels[2].rejected).toBe(true);
    expect(levels[4].rejected).toBe(false);
  });
  it("keeps tokens and debt in range and clamps the step", () => {
    for (const s of levels) {
      expect(s.tokens).toBeLessThanOrEqual(CAPACITY);
      expect(s.debt).toBeLessThanOrEqual(DEBT_MAX);
      expect(s.tokens * s.debt).toBe(0);
      expect(s.arrived).toBeLessThanOrEqual(s.tokens);
    }
    expect(bucketState(i, 99).headline).toBe(levels[bucketLast].headline);
    expect(bucketState(i, -3).level).toBe(CAPACITY);
  });
});
