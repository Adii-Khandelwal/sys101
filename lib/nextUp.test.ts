import { describe, expect, it } from "vitest";
import { readCount, readyTopics, resumeTarget } from "./nextUp";

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

describe("resumeTarget", () => {
  it("picks the most recently touched unfinished topic past its start", () => {
    const topics = {
      dns: { last: "how" },
      caching: { last: "example" },
    };
    const updated = { dns: "2026-01-01", caching: "2026-02-01" };
    expect(resumeTarget(topics, updated, [])).toEqual({ slug: "caching", section: "example" });
  });
  it("ignores finished topics and ones still on the first section", () => {
    const topics = { dns: { last: "how" }, caching: { last: "why" }, cdns: { last: "model" } };
    const updated = { dns: "2026-03-01", caching: "2026-04-01", cdns: "2026-01-01" };
    // caching is on "why" (start) so skipped; dns is read so skipped; cdns remains.
    expect(resumeTarget(topics, updated, ["dns"])).toEqual({ slug: "cdns", section: "model" });
  });
  it("returns null with no resumable topic", () => {
    expect(resumeTarget({}, {}, [])).toBeNull();
    expect(resumeTarget({ dns: { last: "why" } }, {}, [])).toBeNull();
  });
});
