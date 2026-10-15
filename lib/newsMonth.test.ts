import { describe, expect, it } from "vitest";
import { monthBrief, previousMonth } from "../scripts/news-month.mjs";

const state = {
  lastChecked: { b: "2026-09-01", a: "2026-10-01" },
  allowedDomains: {
    a: [{ host: "valkey.io", pathPrefix: "/blog/", publisher: "Valkey project" }],
    b: [{ host: "postgresql.org", publisher: "PostgreSQL", kinds: ["release"] }],
    c: [{ host: "etcd.io", publisher: "etcd" }],
  },
};
const item = (id: string, dateShown: string) => ({ id, dateShown, addedOn: "2026-10-12" });

describe("news-month brief", () => {
  it("steps back one month, over a year end too", () => {
    expect(previousMonth("2026-10-16")).toBe("2026-09");
    expect(previousMonth("2027-01-03")).toBe("2026-12");
  });

  it("lists topics with the oldest check first, never-checked before all, with their sites", () => {
    const text = monthBrief(state, {}, "2026-09").join("\n");
    expect(text.indexOf("\nc ")).toBeLessThan(text.indexOf("\nb "));
    expect(text.indexOf("\nb ")).toBeLessThan(text.indexOf("\na "));
    expect(text).toContain('site: valkey.io/blog/  publisher: "Valkey project"');
    expect(text).toContain("kinds: release");
    expect(text).toContain("c  (last checked never, 3 of 3 places free)");
  });

  it("counts free places and flags an item the 12-month rule will remove", () => {
    const text = monthBrief(state, { a: { asOf: "2026-10-01", items: [item("fresh", "2026-08-13"), item("stale", "2025-06-01")] } }, "2026-09").join("\n");
    expect(text).toContain("a  (last checked 2026-10-01, 2 of 3 places free)");
    expect(text).toContain("listed: stale  (2025-06-01, added 2026-10-12)  older than 12 months, remove");
    expect(text).not.toContain("listed: fresh  (2026-08-13, added 2026-10-12)  older");
  });
});
