import { describe, expect, it } from "vitest";
import { dateMatches, datesShown, evidenceFound, fetchAllowed, pageText } from "../scripts/news-verify-rules.mjs";
import { checkSummary, isAllowEntry, itemAllowedProblems, patternProblems, urlAllowed, latestDay, normalizeUrl, olderThan12Months, validateNews } from "../scripts/news-rules.mjs";
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
const AWS = { host: "aws.amazon.com", pathPrefix: "/blogs/", publisher: "Amazon Web Services" };
const allow = (host: string, pathPrefix?: string, publisher = "Redis", kinds?: string[]) => ({ host, ...(pathPrefix ? { pathPrefix } : {}), publisher, ...(kinds ? { kinds } : {}) });
const ctx = { allowedDomains: [allow("redis.io")], originalUrls: ["https://example.com/post"], today };
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
    expect(check([item({ url: "https://evil.example/x" })]).errors.join()).toMatch(/not inside allowedDomains/);
    expect(check([item({ url: "https://docs.redis.io/x" })]).errors).toEqual([]);
    expect(check([item({ url: "https://redis.io.evil.example/x" })]).errors.join()).toMatch(/not inside allowedDomains/);
    expect(check([item({ url: "https://notredis.io/x" })]).errors.join()).toMatch(/not inside allowedDomains/);
    expect(check([item({ url: "https://example.com/post/" })], { ...ctx, allowedDomains: [allow("example.com")] }).errors.join()).toMatch(/already an Original post/);
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
    const withFigure = "Redis says the release cut memory use for large caches by about 30 percent in the maintainers' own benchmark.";
    expect(checkSummary(withFigure, "memory down 30 percent", "Redis").join()).toBe("");
    expect(checkSummary(withFigure, "memory went down", "Redis").join()).toMatch(/"30"/);
  });
  it("credits the source for any figure or comparison", () => {
    const plain = "The project changed how it stores small strings so that each key carries more data than before.";
    expect(checkSummary(plain, "", "Valkey project").join()).toMatch(/attribution/);
    expect(checkSummary("The project changed how it stores small strings and keeps each key in a single block of memory.", "", "Valkey project").join()).toBe("");
    const faster = "The release makes string lookups faster by keeping small values next to their header in memory.";
    expect(checkSummary(faster, "", "Valkey project").join()).toMatch(/attribution/);
    expect(checkSummary(faster.replace("The release", "The Valkey project says the release"), "", "Valkey project").join()).toBe("");
    expect(checkSummary(faster.replace("The release", "The project says the release"), "", "Valkey project").join()).toMatch(/naming "Valkey"/);
    expect(checkSummary(faster.replace("The release makes", "Valkey describes how the release makes"), "", "Valkey project").join()).toBe("");
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
  it("matches hosts exactly or as a true subdomain, never by substring", () => {
    expect(urlAllowed("https://redis.io/blog/x", [allow("redis.io")])).toBe(true);
    expect(urlAllowed("https://a.b.redis.io/x", [allow("redis.io")])).toBe(true);
    expect(urlAllowed("https://fakeredis.io/x", [allow("redis.io")])).toBe(false);
    expect(urlAllowed("https://aws.amazon.com.evil.example/blogs/x", [AWS])).toBe(false);
    expect(urlAllowed("https://evil-aws.amazon.com.example/blogs/x", [AWS])).toBe(false);
    expect(urlAllowed("https://aws.amazon.com@evil.example/blogs/x", [AWS])).toBe(false);
    expect(urlAllowed("https://user:pw@aws.amazon.com/blogs/x", [AWS])).toBe(false);
    expect(urlAllowed("http://aws.amazon.com/blogs/x", [AWS])).toBe(false);
    expect(urlAllowed("https://aws.amazon.com:8443/blogs/x", [AWS])).toBe(false);
  });
  it("holds a path-limited entry to its prefix", () => {
    const entries = [AWS, allow("aws.amazon.com", "/builders-library/"), allow("valkey.io", "/blog")];
    expect(urlAllowed("https://aws.amazon.com/blogs/networking/x", entries)).toBe(true);
    expect(urlAllowed("https://aws.amazon.com/builders-library/x", entries)).toBe(true);
    expect(urlAllowed("https://aws.amazon.com/products/x", entries)).toBe(false);
    expect(urlAllowed("https://aws.amazon.com/blogs", entries)).toBe(false); // the bare prefix with a slash needs the slash
    expect(urlAllowed("https://aws.amazon.com/blogs/../products/x", entries)).toBe(false); // dot segments resolve first
    expect(urlAllowed("https://valkey.io/blog/post", entries)).toBe(true);
    expect(urlAllowed("https://valkey.io/blogger/post", entries)).toBe(false);
  });
  it("accepts only well-formed entries", () => {
    expect([allow("memcached.org"), allow("uber.com", "/us/en/blog/", "Uber"), allow("postgresql.org", "/about/news/", "PostgreSQL", ["release"])].every(isAllowEntry)).toBe(true);
    for (const bad of ["redis.io", { host: "https://redis.io", publisher: "Redis" }, { host: "redis.io" }, { host: "redis.io", publisher: "" }, { host: "redis.io", publisher: "R", pathPrefix: "blog/" }, { host: "redis.io", publisher: "R", kinds: [] }, { host: "redis.io", publisher: "R", kinds: ["blog"] }, { host: "redis.io", publisher: "R", extra: 1 }, null]) {
      expect(isAllowEntry(bad), JSON.stringify(bad)).toBe(false);
    }
  });
  it("makes the item's publisher equal the entry's, and honours kinds", () => {
    const entries = [allow("postgresql.org", "/about/news/", "PostgreSQL", ["release"]), allow("redis.io", "/blog/", "Redis")];
    const base = { url: "https://www.postgresql.org/about/news/x", publisher: "PostgreSQL", kind: "release" };
    expect(itemAllowedProblems(base, entries)).toEqual([]);
    expect(itemAllowedProblems({ ...base, publisher: "Postgres" }, entries).join()).toMatch(/publisher "Postgres" does not match/);
    expect(itemAllowedProblems({ ...base, kind: "engineering-post" }, entries).join()).toMatch(/kind "engineering-post" is not allowed.*release/);
    expect(itemAllowedProblems({ ...base, url: "https://www.postgresql.org/docs/x" }, entries).join()).toMatch(/not inside allowedDomains/);
    expect(itemAllowedProblems({ url: "https://redis.io/blog/x", publisher: "Redis", kind: "docs" }, entries)).toEqual([]);
    // two entries for one host: the one whose publisher matches decides
    const two = [allow("builder.aws.com", "/learn/", "Amazon Web Services"), allow("builder.aws.com", "/learn/", "Someone Else")];
    expect(itemAllowedProblems({ url: "https://builder.aws.com/learn/x", publisher: "Someone Else", kind: "docs" }, two)).toEqual([]);
  });
  it("reports a publisher mismatch through validateNews", () => {
    expect(check([item({ publisher: "Redis Ltd" })]).errors.join()).toMatch(/does not match the allowlist entry/);
  });
  it("normalises urls for the Original-post comparison", () => {
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

describe("redirects stay inside the allowlist", () => {
  const entries = [AWS];
  const res = (status: number, extra: { location?: string; body?: string } = {}) => ({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (n: string) => (n.toLowerCase() === "location" ? (extra.location ?? null) : null) },
    text: async () => extra.body ?? "",
  });
  it("returns the page and its final URL when every hop is allowed", async () => {
    const fake = async (u: string) => (u.endsWith("/old") ? res(301, { location: "/blogs/new" }) : res(200, { body: "<p>hi</p>" }));
    expect(await fetchAllowed("https://aws.amazon.com/blogs/old", entries, fake)).toEqual({ html: "<p>hi</p>", finalUrl: "https://aws.amazon.com/blogs/new" });
  });
  it("refuses a redirect to a different host, even a look-alike", async () => {
    for (const to of ["https://evil.example/blogs/x", "https://aws.amazon.com.evil.example/blogs/x", "https://aws.amazon.com/products/x", "http://aws.amazon.com/blogs/x"]) {
      const fake = async () => res(302, { location: to });
      await expect(fetchAllowed("https://aws.amazon.com/blogs/a", entries, fake)).rejects.toThrow(/redirected outside the allowlist/);
    }
  });
  it("refuses a start URL outside the allowlist and endless redirects", async () => {
    await expect(fetchAllowed("https://evil.example/blogs/a", entries, async () => res(200))).rejects.toThrow(/outside the allowlist/);
    await expect(fetchAllowed("https://aws.amazon.com/blogs/a", entries, async () => res(302, { location: "/blogs/a" }))).rejects.toThrow(/too many redirects/);
  });
});

describe("pathPattern entries", () => {
  const UBER = { host: "uber.com", pathPattern: "^/(blog/|[a-zA-Z]{2}/en/blog/|en-US/blog/)", publisher: "Uber" };
  it("is a valid entry", () => {
    expect(isAllowEntry(UBER)).toBe(true);
  });
  it("covers the Uber blog paths and nothing else", () => {
    for (const p of ["/blog/", "/blog/post", "/in/en/blog/", "/us/en/blog/post", "/US/en/blog/", "/en-US/blog/x"]) expect(urlAllowed(`https://www.uber.com${p}`, [UBER]), p).toBe(true);
    for (const p of ["/careers/", "/en/blog/", "/blog", "/blogger/x", "/us/en/blogs/", "/us/en/careers/", "/xyz/en/blog/", "/us/fr/blog/", "/"]) expect(urlAllowed(`https://www.uber.com${p}`, [UBER]), p).toBe(false);
  });
  it("keeps exact-or-subdomain host matching", () => {
    for (const u of ["https://uber.com.evil.example/blog/", "https://evil-uber.com/blog/", "https://notuber.com/blog/", "https://uber.com@evil.example/blog/", "http://www.uber.com/blog/", "https://www.uber.com:8443/blog/"]) expect(urlAllowed(u, [UBER]), u).toBe(false);
    expect(urlAllowed("https://www.uber.com/blog/", [UBER])).toBe(true);
    expect(urlAllowed("https://uber.com/blog/", [UBER])).toBe(true);
  });
  it("refuses a redirect to a path the pattern does not match", async () => {
    const res = (status: number, location?: string) => ({ status, ok: status === 200, headers: { get: (n: string) => (n.toLowerCase() === "location" ? (location ?? null) : null) }, text: async () => "<p>ok</p>" });
    await expect(fetchAllowed("https://www.uber.com/us/en/blog/a", [UBER], async () => res(302, "/careers/"))).rejects.toThrow(/redirected outside the allowlist/);
    await expect(fetchAllowed("https://www.uber.com/blog/", [UBER], async () => res(302, "https://evil.example/blog/"))).rejects.toThrow(/redirected outside/);
    const hop = async (u: string) => (new URL(u).pathname === "/blog/" ? res(302, "/in/en/blog/") : res(200));
    expect((await fetchAllowed("https://www.uber.com/blog/", [UBER], hop)).finalUrl).toBe("https://www.uber.com/in/en/blog/");
  });
  it("accepts only safe patterns", () => {
    expect(patternProblems("^/(blog/|[a-z]{2}/blog/)")).toEqual([]);
    expect(patternProblems("^/blog/.*")).toEqual([]);
    for (const bad of ["/blog/", "blog/", "^/(a+)+$", "^/(a|aa)*$", "^/(a*)*", "^/(?=blog)", "^/(?<n>a)", "^/(a)\\1", "^/a+/b+", "^/.*/.*", "^/(", "^/" + "a".repeat(250), "", 5]) {
      expect(patternProblems(bad).length, String(bad)).toBeGreaterThan(0);
    }
    expect(isAllowEntry({ host: "uber.com", pathPattern: "^/(a+)+$", publisher: "Uber" })).toBe(false);
    expect(isAllowEntry({ ...UBER, pathPrefix: "/blog/" })).toBe(false);
  });
  it("is used by the Uber entries in docs/news-state.json", async () => {
    const state = (await import("../docs/news-state.json")).default as { allowedDomains: Record<string, { host: string; pathPattern?: string }[]> };
    for (const [slug, list] of Object.entries(state.allowedDomains)) {
      const uber = list.filter((e) => e.host === "uber.com");
      expect(uber.every((e) => e.pathPattern === UBER.pathPattern), slug).toBe(true);
      expect(uber.length <= 1, slug).toBe(true);
    }
  });
});
