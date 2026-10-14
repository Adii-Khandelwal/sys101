import { describe, expect, it } from "vitest";
import { emptyProgress, toggleUnit } from "./lessonStore";
import { homeAction, readCount, readyTopics } from "./nextUp";

const entries = [
  { slug: "databases", title: "Databases", prerequisites: [] },
  { slug: "dns", title: "DNS", prerequisites: [] },
  { slug: "replication", title: "Database Replication", prerequisites: ["databases"] },
  { slug: "load-balancing", title: "Load Balancing", prerequisites: ["dns"] },
  { slug: "caching", title: "Caching", prerequisites: ["load-balancing"] },
  { slug: "cdns", title: "CDNs", prerequisites: ["dns", "caching"] },
  { slug: "consistent-hashing", title: "Consistent Hashing", prerequisites: ["caching"] },
  { slug: "sharding", title: "Sharding", prerequisites: ["replication", "consistent-hashing"] },
];
const order = (read: string[]) => readyTopics(entries, read).map((e) => e.slug);

describe("next up", () => {
  it("starts with the starting point that opens up more of the map", () => {
    expect(order([])).toEqual(["dns", "databases"]);
  });
  it("prefers continuing what was read over a fresh start", () => {
    expect(order(["dns", "load-balancing", "caching"])).toEqual(["consistent-hashing", "cdns", "databases"]);
    expect(order(["databases", "dns"])).toEqual(["load-balancing", "replication"]); // Load Balancing opens up four topics
  });
  it("is empty when everything is read, and counts reads", () => {
    expect(order(entries.map((e) => e.slug))).toEqual([]);
    expect(readCount(entries, ["dns", "unknown"])).toBe(1);
  });
});

describe("homeAction", () => {
  const metas = entries.map((e) => ({ slug: e.slug, postIds: [`${e.slug}-a`], correct: ["x"] }));
  const none = emptyProgress();
  const doing = (...marks: [string, string[]][]) => {
    let p = emptyProgress();
    for (const [slug, units] of marks) for (const u of units) p = toggleUnit(p, metas.find((m) => m.slug === slug)!, u);
    return p;
  };
  const act = (p: ReturnType<typeof emptyProgress>, read: string[], updated: Record<string, string> = {}) => homeAction(entries, metas, p, read, updated);

  it("is the start of the map with nothing read and nothing started", () => {
    expect(act(none, []).kind).toBe("start");
  });
  it("is the best ready topic, plus the second, when something is read and nothing is started", () => {
    const a = act(none, ["databases", "dns"]);
    expect(a).toMatchObject({ kind: "next", next: { slug: "load-balancing" }, also: { slug: "replication" } });
  });
  it("is done when everything is read", () => {
    expect(act(none, entries.map((e) => e.slug)).kind).toBe("done");
  });
  it("continues a started topic even when other topics are ready", () => {
    const a = act(doing(["consistent-hashing", ["why", "model"]]), ["databases"]);
    expect(a).toMatchObject({ kind: "continue", topic: { slug: "consistent-hashing", done: 2, total: 7 }, others: [] });
    // the first section left incomplete is where the button lands
    expect(a.kind === "continue" && a.topic.target).toBe("how");
  });
  it("continues something started even with nothing read yet", () => {
    expect(act(doing(["dns", ["why"]]), []).kind).toBe("continue");
  });
  it("with several started, the latest deliberate change wins and the rest are listed after it", () => {
    const p = doing(["dns", ["why"]], ["caching", ["why", "model", "how"]], ["cdns", ["why"]]);
    const a = act(p, [], { dns: "2026-05-01T10:00:00Z", caching: "2026-04-01T10:00:00Z", cdns: "2026-06-01T10:00:00Z" });
    expect(a.kind === "continue" && [a.topic.slug, ...a.others.map((o) => o.slug)]).toEqual(["cdns", "dns", "caching"]);
  });
  it("breaks a tie on dates by who is further along, then course order", () => {
    const p = doing(["dns", ["why"]], ["caching", ["why", "model"]], ["cdns", ["why", "model"]]);
    const a = act(p, [], {});
    expect(a.kind === "continue" && [a.topic.slug, ...a.others.map((o) => o.slug)]).toEqual(["caching", "cdns", "dns"]);
  });
  it("ignores a started topic that is read, unknown, or only visited", () => {
    const p = { ...doing(["dns", ["why"]]), topics: { ...doing(["dns", ["why"]]).topics, ghost: { done: ["why"], visited: [], answers: {} }, caching: { done: [], visited: ["why", "model"], answers: {}, last: "model" } } };
    const a = act(p, ["dns"]);
    expect(a.kind).toBe("next");
  });
  it("offers the next ready topic after the current one, never the current one itself", () => {
    const a = act(doing(["replication", ["why"]]), ["databases"]);
    expect(a.kind === "continue" && a.after?.slug).toBe("dns");
  });
});
