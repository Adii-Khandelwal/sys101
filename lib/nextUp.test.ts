import { describe, expect, it } from "vitest";
import { readCount, readyTopics } from "./nextUp";

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
