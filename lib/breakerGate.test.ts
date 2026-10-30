import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildGeometry } from "@/components/figures/breakerGate/geometry";
import { BREAKER_STEPS, LANES, PROBES, breakerLast, breakerState, breakerText, breakerValid } from "./breakerGate";

const topic = JSON.parse(readFileSync("content/topics/circuit-breakers.json", "utf8"));
const post = topic.posts.find((p: { id: string }) => p.id === "zalando-circuit-breaker-herd-2026");
const first = (row: number) => Number(post.digest.numbers[row].value.match(/\d[\d,]*(?:\.\d+)?/)![0].replace(/,/g, ""));
const r = post.digest.figure.rows;
const i = { blocked: first(r.blocked), rps: first(r.rps), clientMs: first(r.clientMs), serviceMs: first(r.serviceMs), factor: first(r.factor) };

describe("breaker-gate draw order", () => {
  it("paints every road plate before any request cube, so a plate never covers a cube on it", () => {
    const ids = buildGeometry(i).items.map((it) => it.id);
    const lastRoad = Math.max(...ids.map((id, k) => (id.startsWith("road.") ? k : -1)));
    const firstReq = ids.findIndex((id) => id.startsWith("req."));
    expect(lastRoad).toBeLessThan(firstReq);
  });
});

describe("breaker-gate model", () => {
  it("reads the post's rows", () => {
    expect(i).toEqual({ blocked: 95, rps: 5, clientMs: 15, serviceMs: 3, factor: 10 });
    expect(breakerValid(i)).toBe(true);
    expect(breakerValid({ ...i, factor: 4 })).toBe(false);
    expect(breakerValid({ ...i, blocked: 100 })).toBe(false);
  });
  it("walks closed, open, half-open, closed, closed, open", () => {
    expect(Array.from({ length: BREAKER_STEPS }, (_, s) => breakerState(i, s).gate)).toEqual(["closed", "open", "half-open", "closed", "closed", "open"]);
  });
  it("lets only the probes through while half-open and holds the rest back", () => {
    const s = breakerState(i, 2);
    const through = s.reqs.filter((q) => q.visible && q.zone === "pod");
    expect(through).toHaveLength(PROBES);
    expect(through.every((q) => q.lane === LANES - 1 && !q.lit)).toBe(true);
    expect(s.reqs.filter((q) => q.visible && q.zone === "wait")).toHaveLength(LANES * i.factor - PROBES - LANES);
  });
  it("queues factor requests at each of the three pods and times out nearly all of them", () => {
    const s = breakerState(i, 4);
    for (let lane = 0; lane < LANES; lane++) expect(s.reqs.filter((q) => q.lane === lane && q.zone === "pod")).toHaveLength(i.factor);
    expect(s.reqs.filter((q) => q.lit)).toHaveLength(LANES * (i.factor - 1));
    expect(s.headline).toContain("over 100 ms");
    expect(breakerState(i, 5).reqs.every((q) => q.lit)).toBe(true);
  });
  it("clamps the step and uses no em dash", () => {
    expect(breakerState(i, 99).step).toBe(breakerLast);
    expect(breakerState(i, -1).step).toBe(0);
    const t = breakerText(i, { company: "Zalando", year: "2026", postId: "zalando-circuit-breaker-herd-2026" });
    expect(JSON.stringify([t, ...Array.from({ length: BREAKER_STEPS }, (_, s) => breakerState(i, s))])).not.toContain("—");
  });
});
