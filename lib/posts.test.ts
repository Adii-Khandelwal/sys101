import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { topicOrder } from "./order";
import { buildPostsIndex, groupId, organization } from "./posts";
import { NOT_COMPANIES } from "./organization";
import { sourceKinds } from "./sourceKinds";
import { postsDescription } from "./site";
import { getAllTopics } from "./topics";

const topics = getAllTopics();
const d = buildPostsIndex(topicOrder(topics));
const entries = topics.flatMap((t) => t.posts);
const urls = new Set(entries.map((p) => p.url));
const urlsIn = (rows: { url: string }[]) => rows.map((r) => r.url);

describe("posts index", () => {
  it("every name the homepage calls a non-company is a real organization", () => {
    const orgs = new Set(entries.map((p) => organization(p.company)));
    for (const name of NOT_COMPANIES) expect(orgs.has(name)).toBe(true);
  });

  it("counts match the data", () => {
    expect(d.total).toBe(urls.size);
    expect(d.companyCount).toBe(new Set(entries.map((p) => organization(p.company))).size);
    expect(d.counts.posts + d.counts.papers + d.counts.docs).toBe(d.counts.total);
    expect(d.counts.organizations).toBe(d.companyCount);
    expect(sourceKinds(d.counts)).toMatch(/engineering posts?/);
    expect(d.topicCount).toBe(topics.length);
  });

  it("lists every post exactly once in the company and year views", () => {
    for (const rows of [d.byCompany.flatMap((c) => c.posts), d.byYear.flatMap((y) => y.posts)]) {
      expect(urlsIn(rows).sort()).toEqual([...urls].sort());
    }
  });

  it("lists every topic entry once in the topic view, so a shared post shows under each topic", () => {
    const rows = d.byTopic.flatMap((g) => g.topics.flatMap((t) => t.posts));
    expect(rows.map((r) => r.key).sort()).toEqual(entries.map((p) => p.id!).sort());
    expect(rows.length).toBeGreaterThanOrEqual(d.total);
  });

  it("never guesses a year: undated posts go last, in their own group", () => {
    const undated = entries.filter((p) => !/^\d{4}/.test(p.published)).map((p) => p.url);
    const last = d.byYear[d.byYear.length - 1];
    if (undated.length) expect(last.year).toBeNull();
    expect(new Set(urlsIn(last.posts))).toEqual(new Set(last.year === null ? undated : []));
    const years = d.byYear.filter((y) => y.year).map((y) => y.year!);
    expect(years).toEqual([...years].sort().reverse());
  });

  it("points every row at a real topic section", () => {
    const ids = new Map(topics.map((t) => [t.slug, new Set(t.posts.map((p) => p.id))]));
    for (const p of d.byCompany.flatMap((c) => c.posts)) for (const t of p.topics) expect(ids.get(t.slug)?.has(t.postId), `${t.slug}#${t.postId}`).toBe(true);
  });

  it("has unique anchors across the three views", () => {
    const anchors = [
      "by-topic", "by-company", "by-year",
      ...d.byTopic.map((g) => groupId(g.group)),
      ...d.byTopic.flatMap((g) => g.topics.map((t) => t.slug)),
      ...d.byCompany.map((c) => c.id),
      ...d.byYear.map((y) => y.id),
    ];
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it("writes a meta description from the counts", () => {
    const s = postsDescription(d);
    expect(s).toContain(String(d.total));
    expect(s).toContain(String(d.companyCount));
    expect(s.length).toBeLessThan(155);
  });

  it("is in the sitemap, the footer and the home page sources section", () => {
    const read = (f: string) => fs.readFileSync(path.join(process.cwd(), f), "utf8");
    expect(read("app/sitemap.ts")).toContain('"/posts"');
    expect(read("components/SiteFooter.tsx")).toContain("NAV_ITEMS");
    expect(read("lib/navItems.ts")).toContain('"/posts"');
    expect(read("components/PostSources.tsx")).toContain("/posts#");
  });
});
