import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CLIENTS, jitterLast, jitterState, jitterValid, retryTicks } from "./retryJitter";

const topic = JSON.parse(readFileSync("content/topics/idempotency-and-retries.json", "utf8"));
const post = topic.posts.find((p: { id: string }) => p.id === "aws-timeouts-retries-backoff-2019");
const i = { retries: Number(post.digest.numbers[post.digest.figure.rows.retries].value.match(/\d+/)![0]) };

describe("retry-jitter model", () => {
  it("reads three retries from the post's row", () => expect(i).toEqual({ retries: 3 }));
  it("lines every client up without jitter and spreads them with it", () => {
    const plain = jitterState(i, { jitter: false }, 1);
    const spread = jitterState(i, { jitter: true }, 1);
    expect(plain.peak).toBe(CLIENTS);
    expect(spread.peak).toBeLessThan(plain.peak);
    expect(jitterState(i, { jitter: false }, 0).peak).toBe(0);
  });
  it("keeps jitter inside the backoff wait and every time distinct per client", () => {
    const t = retryTicks(i, true);
    const p = retryTicks(i, false);
    for (let c = 0; c < CLIENTS; c++) for (let a = 1; a <= i.retries; a++) {
      expect(t[c][a]).toBeGreaterThan(t[c][a - 1]);
      expect(t[c][a]).toBeLessThanOrEqual(p[c][a]);
    }
    expect(new Set(t.map((r) => r[1])).size).toBe(CLIENTS);
  });
  it("is deterministic, steps to the retry count and clamps", () => {
    expect(retryTicks(i, true)).toEqual(retryTicks(i, true));
    expect(jitterLast(i)).toBe(3);
    expect(jitterState(i, { jitter: true }, 9).step).toBe(3);
    expect(jitterValid({ retries: 0 })).toBe(false);
    expect(jitterValid({ retries: 4 })).toBe(false);
  });
});
