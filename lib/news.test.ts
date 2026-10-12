import { describe, expect, it } from "vitest";
import { dateMatches, datesShown, evidenceFound, pageText } from "../scripts/news-verify-rules.mjs";
import { checkSummary, hostAllowed, latestDay, normalizeUrl, olderThan12Months, validateNews } from "../scripts/news-rules.mjs";
import { renderToStaticMarkup } from "react-dom/server";
import WhatsNew from "../components/WhatsNew";
import { NEWS_MODE } from "./site";
import { newsDate, type NewsItem } from "./news";

const today = "2026-10-12";
const summary = "The project added a new eviction policy that frees memory by removing the least recently used entries first.";
const item = (extra: object = {}) => ({
  id: "redis-eviction",
  kind: "docs",
  title: "Key eviction",
  publisher: "Redis",
  url: "https://redis.io/docs/latest/develop/reference/eviction/",
  dateShown: "2026-08-01",
  summary,
  evidence: "removes the least recently used keys first",
  addedOn: "2026-10-12",
  verifiedOn: "2026-10-12",
  ...extra,
});
const ctx = { allowedDomains: ["redis.io"], originalUrls: ["https://example.com/post"], today };
const check = (items: object[], c = ctx) => validateNews({ asOf: today, items }, c);

describe("validateNews", () => {
  it("accepts a good file and an empty one", () => {
    expect(check([item()]).errors).toEqual([]);
    expect(check([]).errors).toEqual([]);
  });
  it("rejects more than 3 items, duplicate ids and unknown fields", () => {
    expect(check([item({ id: "a" }), item({ id: "b" }), item({ id: "c" }), item({ id: "d" })]).errors.join()).toMatch(/at most 3/);
    expect(check([item(), item()]).errors.join()).toMatch(/duplicate id/);
    expect(check([item({ extra: 1 })]).errors.join()).toMatch(/unknown field "extra"/);
  });
  it("needs https, an allowed domain, and a page that is not already an Original post", () => {
    expect(check([item({ url: "http://redis.io/x" })]).errors.join()).toMatch(/https/);
    expect(check([item({ url: "https://evil.example/x" })]).errors.join()).toMatch(/not in allowedDomains/);
    expect(check([item({ url: "https://docs.redis.io/x" })]).errors).toEqual([]);
    expect(check([item({ url: "https://notredis.io/x" })]).errors.join()).toMatch(/not in allowedDomains/);
    expect(check([item({ url: "https://example.com/post/" })], { ...ctx, allowedDomains: ["example.com"] }).errors.join()).toMatch(/already an Original post/);
    expect(check([item()], { ...ctx, allowedDomains: [] }).errors.join()).toMatch(/no allowedDomains/);
  });
  it("holds dates to their format and the future", () => {
    expect(check([item({ dateShown: "June 2026" })]).errors.join()).toMatch(/dateShown must be/);
    expect(check([item({ verifiedOn: "2026-10-13" })]).errors.join()).toMatch(/verifiedOn is in the future/);
    expect(check([item({ dateShown: "2025-01-01" })]).warnings.join()).toMatch(/older than 12 months/);
    expect(check([item({ dateShown: "no date shown" })]).errors).toEqual([]);
  });
  it("limits evidence to 15 words", () => {
    expect(check([item({ evidence: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen" })]).errors.join()).toMatch(/at most 15/);
  });
});

describe("checkSummary", () => {
  it("needs 12 to 30 words in one sentence", () => {
    expect(checkSummary("Too short.", "")).toEqual(expect.arrayContaining([expect.stringMatching(/needs 12 to 30/)]));
    expect(checkSummary(`${summary} And a second one follows it here.`, "").join()).toMatch(/one sentence/);
  });
  it("rejects em dashes and not-but phrasing", () => {
    expect(checkSummary(summary.replace("that", "— that"), "").join()).toMatch(/banned/);
    expect(checkSummary("The release is not a rewrite but a change to how the cache frees memory under pressure.", "").join()).toMatch(/banned/);
  });
  it("allows a figure only when the evidence has it", () => {
    const withFigure = "The release cut memory use for large caches by about 30 percent in the maintainers' own benchmark.";
    expect(checkSummary(withFigure, "memory down 30 percent").join()).toBe("");
    expect(checkSummary(withFigure, "memory went down").join()).toMatch(/"30"/);
  });
});

describe("date and url helpers", () => {
  it("knows how old a partial date is", () => {
    expect(latestDay("2026-02")).toBe("2026-02-28");
    expect(latestDay("2026")).toBe("2026-12-31");
    expect(olderThan12Months("2025-10", today)).toBe(false);
    expect(olderThan12Months("2025-09", today)).toBe(true);
    expect(olderThan12Months("no date shown", today)).toBe(false);
  });
  it("matches hosts by domain, not by suffix text", () => {
    expect(hostAllowed("https://a.b.redis.io/x", ["redis.io"])).toBe(true);
    expect(hostAllowed("https://fakeredis.io/x", ["redis.io"])).toBe(false);
    expect(normalizeUrl("https://www.Example.com/a/?x=1#top")).toBe("example.com/a");
  });
  it("shows dates as the source does", () => {
    expect(newsDate("2026-08-01")).toBe("1 August 2026");
    expect(newsDate("2026-08")).toBe("August 2026");
    expect(newsDate("2026")).toBe("2026");
    expect(newsDate("no date shown")).toBe("no date shown");
  });
});

describe("verify helpers", () => {
  const html = `<html><head><meta property="article:published_time" content="2026-08-01T10:00:00Z"><script>var x = "removes the hidden keys"</script></head>
    <body><p>Posted on August 1, 2026</p><p>It removes the   least recently used keys first.</p></body></html>`;
  it("finds evidence in visible text only, ignoring case, spacing and quotes", () => {
    expect(evidenceFound(pageText(html), "removes the least recently used keys first")).toBe(true);
    expect(evidenceFound(pageText(html), "removes the hidden keys")).toBe(false);
    expect(evidenceFound("It’s fast", "it's fast")).toBe(true);
  });
  it("matches dateShown to the precision it gives", () => {
    const shown = datesShown(html);
    expect(dateMatches("2026-08-01", shown)).toBe(true);
    expect(dateMatches("2026-08", shown)).toBe(true);
    expect(dateMatches("2026", shown)).toBe(true);
    expect(dateMatches("2026-08-02", shown)).toBe(false);
    expect(dateMatches("2025", shown)).toBe(false);
    expect(dateMatches("no date shown", [])).toBe(true);
    expect(datesShown("<p>No dates here</p>")).toEqual([]);
    expect(datesShown("<p>Updated 14 June 2021</p>")).toContainEqual({ y: 2021, m: 6, d: 14 });
  });
});

describe("What's new section", () => {
  const html = (news: Parameters<typeof WhatsNew>[0]["news"]) => renderToStaticMarkup(WhatsNew({ title: "Caching", news }) as never);
  it("renders nothing without items", () => {
    expect(html(null)).toBe("");
    expect(html({ asOf: today, items: [] })).toBe("");
  });
  it("shows date, publisher, summary and a safe new-tab link, but never the evidence", () => {
    const out = html({ asOf: today, items: [item() as unknown as NewsItem] });
    expect(out).toContain("What&#x27;s new in Caching");
    expect(out).toContain("As of 12 October 2026");
    expect(out).toContain("1 August 2026");
    expect(out).toContain('target="_blank" rel="noopener noreferrer"');
    expect(out).toContain(summary);
    expect(out).not.toContain("least recently used keys first");
  });
  it("claims review only in review mode", () => {
    const out = html({ asOf: today, items: [item() as unknown as NewsItem] });
    expect(out.includes("reviewed by me")).toBe(NEWS_MODE === "review");
    expect(out).toContain("Added by an automated routine after automated checks");
  });
});
