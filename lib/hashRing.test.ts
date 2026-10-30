import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { KEYS, PRESENT, POINTS, ringLast, ringState, ringValid, type RingInputs } from "./hashRing";

// Read the JSON directly: the registry (lib/figures.ts) knows the id only once the admin applies the snippets.
const topic = JSON.parse(fs.readFileSync("content/topics/consistent-hashing.json", "utf8"));
const post = topic.posts.find((p: { digest: { figure?: { id: string } } }) => p.digest.figure?.id === "hash-ring");
const num = (row: number) => Number(post.digest.numbers[row].value.match(/\d[\d,]*(?:\.\d+)?/)[0].replace(/,/g, ""));

describe("hash ring model", () => {
  it("reads the post's numbers rows", () => {
    const r = post.digest.figure.rows;
    const i = { spreadOne: num(r.spreadOne), points: num(r.points), spreadMany: num(r.spreadMany), servers: num(r.servers) };
    expect(i).toEqual({ spreadOne: 99, points: 160, spreadMany: 8, servers: 100 });
    expect(ringValid(i)).toBe(true);
  });

  const i: RingInputs = { spreadOne: 99, points: 160, spreadMany: 8, servers: 100 };
  const owners = (many: boolean, step: number) => Object.fromEntries(ringState(i, many, step).owners.map((o) => [o.name, o.server]));

  it.each([false, true])("moves only the keys of the stretches a join or a leave touches (many=%s)", (many) => {
    const [s0, s1, s2] = [0, 1, 2].map((n) => ringState(i, many, n));
    expect(s0.movedNames).toEqual([]);
    // Joining: every moved key now belongs to D, nothing else changes owner.
    expect(s1.movedNames.length).toBeGreaterThan(0);
    for (const o of s1.owners) expect(o.moved ? o.server : owners(many, 0)[o.name]).toBe(o.moved ? "D" : owners(many, 1)[o.name]);
    // Leaving: every moved key was owned by A, and nobody else's keys move.
    expect(s2.movedNames.length).toBeGreaterThan(0);
    for (const n of s2.movedNames) expect(owners(many, 1)[n]).toBe("A");
    for (const k of KEYS) if (owners(many, 1)[k.name] !== "A") expect(owners(many, 2)[k.name]).toBe(owners(many, 1)[k.name]);
    expect(s1.movedNames.length).toBeLessThan(KEYS.length);
    expect(s2.movedNames.length).toBeLessThan(KEYS.length);
  });

  it("wraps: a key before the first point belongs to the last server", () => {
    expect(owners(false, 0).t).toBe("C");
  });

  it("keeps points on distinct cells, away from the keys, and every step's last index in range", () => {
    for (const m of ["one", "many"] as const) {
      const cells = Object.values(POINTS[m]).flat();
      expect(new Set(cells).size).toBe(cells.length);
      for (const k of KEYS) expect(cells).not.toContain(k.cell);
    }
    expect(ringLast).toBe(PRESENT.length - 1);
    expect(ringState(i, false, 9).headline).toBe(ringState(i, false, ringLast).headline);
  });
});
