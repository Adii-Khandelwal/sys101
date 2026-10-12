import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Background from "../app/background/page";
import TopicLesson from "../components/TopicLesson";
import sitemap from "../app/sitemap";
import { backgroundHref, backgroundUpdated, displayQuote, getAllBackground, getBackground, isTaughtLater, validateBackground, type Background as BackgroundFile } from "./background";
import { topicNumbers, topicOrder } from "./order";
import { getAllTopics, getDependents } from "./topics";

const topics = getAllTopics();
const numbers = topicNumbers(topicOrder(topics));
const files = getAllBackground();
const html = renderToStaticMarkup(Background() as never);
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

/** A valid file to break one thing at a time. */
const good = (): BackgroundFile => JSON.parse(JSON.stringify(files.find((f) => f.topic === "caching")!));
const problems = (b: BackgroundFile) => validateBackground("caching.json", b, topics).join("\n");

describe("background content", () => {
  it("has a file for caching, and every file passes validation", () => {
    expect(files.map((f) => f.topic)).toContain("caching");
    for (const f of fs.readdirSync(path.resolve(__dirname, "../content/background"))) expect(f).toMatch(/\.json$/);
  });

  it("every item cites a post that exists on that topic, once per post", () => {
    for (const f of files) {
      const posts = new Set(topics.find((t) => t.slug === f.topic)!.posts.map((p) => p.id));
      for (const item of f.items) {
        expect(item.assumedBy.length, `${f.topic}/${item.id}`).toBeGreaterThan(0);
        for (const a of item.assumedBy) expect(posts.has(a.postId), `${f.topic}/${item.id}: ${a.postId}`).toBe(true);
        expect(new Set(item.assumedBy.map((a) => a.postId)).size).toBe(item.assumedBy.length);
      }
    }
  });

  it("every internal link resolves: topic pages, post anchors and the background section", () => {
    const slugs = new Set(topics.map((t) => t.slug));
    for (const f of files) {
      expect(slugs.has(f.topic)).toBe(true);
      for (const item of f.items) {
        if (item.topicPage) expect(slugs.has(item.topicPage), `${f.topic}/${item.id}`).toBe(true);
      }
    }
    for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
      const [route, hash] = m[1].split("#");
      const topic = route.match(/^\/topic\/([^/]+)$/)?.[1];
      if (topic) {
        expect(slugs.has(topic), m[1]).toBe(true);
        // a post's section, or "posts": the top of the posts part, where "Back to the topic" lands
        if (hash) expect(hash === "posts" || topics.find((t) => t.slug === topic)!.posts.some((p) => p.id === hash), `${m[1]} points at a post or the posts part`).toBe(true);
      }
    }
  });

  it("every external link is https, opens in a new tab safely, and is listed once per item", () => {
    for (const f of files) {
      for (const item of f.items) {
        const urls = (item.sources ?? []).map((s) => s.url);
        expect(new Set(urls).size).toBe(urls.length);
        for (const u of urls) expect(u).toMatch(/^https:\/\//);
      }
    }
    for (const m of html.matchAll(/<a [^>]*href="(https:[^"]+)"[^>]*>/g)) {
      expect(m[0]).toContain('target="_blank"');
      expect(m[0]).toContain('rel="noopener noreferrer"');
    }
  });

  it("an item with no topic page has an official source with publisher and year", () => {
    for (const f of files) {
      for (const item of f.items) {
        if (item.topicPage) continue;
        expect(item.sources?.length, `${f.topic}/${item.id}`).toBeGreaterThan(0);
        for (const s of item.sources!) {
          expect(s.publisher.length).toBeGreaterThan(0);
          expect(s.year).toMatch(/^(\d{4}|no date shown|page shows last updated \d{4}-\d{2}-\d{2})$/);
        }
      }
    }
  });
});

describe("the /background page", () => {
  it("has no duplicate anchors", () => {
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it("has exactly one h1 and a section with id = topic slug for every topic that has a file", () => {
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    for (const f of files) expect(html, f.topic).toContain(`<section id="${f.topic}"`);
    expect(html.match(/<section /g)).toHaveLength(files.length);
  });

  it("labels a concept 'Taught later' exactly when its topic page comes after the topic in the course", () => {
    const caching = getBackground("caching")!;
    const later = caching.items.filter((i) => isTaughtLater(i, "caching", numbers)).map((i) => i.id);
    expect(later.sort()).toEqual(["circuit-breaker", "consensus", "eventual-and-strong-consistency", "publish-subscribe", "sharding"]);
    expect(html.match(/Taught later/g)).toHaveLength(later.length);
    // Databases comes before Caching, so it is not "later", and the page says nothing about where it is taught.
    expect(isTaughtLater({ topicPage: "databases" }, "caching", numbers)).toBe(false);
    expect(html).not.toMatch(/Taught earlier|topic 01/);
  });

  it("shows each assumed-by sentence with its post, and does not re-explain or link to the later topic", () => {
    for (const item of getBackground("caching")!.items) {
      for (const a of item.assumedBy) {
        const shown = displayQuote(a.quote).replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
        expect(html.includes(displayQuote(a.quote)) || html.includes(shown), `${item.id}: ${a.postId}`).toBe(true);
        expect(html).toContain(`/topic/caching#${a.postId}`);
      }
    }
    // no line says where a concept is taught, and no link points at another topic page: the reader uses search or the glossary
    expect(html).not.toMatch(/Taught in|Taught earlier|, topic \d\d/);
    const topicLinks = [...html.matchAll(/href="(\/topic\/[^"]*)"/g)].map((m) => m[1]);
    for (const l of topicLinks) expect(l, l).toMatch(/^\/topic\/caching(#[\w-]+)?$/);
    expect(html).toContain("https://www.postgresql.org/docs/current/tutorial-transactions.html");
  });

  it("nests an inner quotation with single quotes, so the sentence is not shown with doubled marks", () => {
    expect(displayQuote("\u201CCache should be consistent\u201D is an invariant")).toBe("\u2018Cache should be consistent\u2019 is an invariant");
    expect(displayQuote("we don\u2019t")).toBe("we don\u2019t");
    expect(html).not.toContain("\u201C\u201C");
    expect(html).not.toMatch(/<q>[^<]*\u201C/);
  });

  it("uses no emoji and no em dash", () => {
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(html).not.toContain("—");
  });

  it("is in the sitemap with the latest edit as lastmod", () => {
    const entry = sitemap().find((e) => e.url.endsWith("/background"));
    expect(entry).toBeDefined();
    expect(entry!.lastModified).toBe(backgroundUpdated());
  });
});

describe("the link from a topic page", () => {
  it("exists only for topics that have a background file", () => {
    for (const t of topics) expect(backgroundHref(t.slug), t.slug).toBe(files.some((f) => f.topic === t.slug) ? `/background#${t.slug}` : undefined);
    expect(backgroundHref("caching")).toBe("/background#caching");
    expect(backgroundHref("dns")).toBeUndefined();
  });
});

describe("validation catches the mistakes it is for", () => {
  it("a post id that does not exist, a duplicate id, a missing source", () => {
    const a = good();
    a.items[0].assumedBy[0].postId = "nope";
    expect(problems(a)).toContain('no post "nope"');
    const b = good();
    b.items[1].id = b.items[0].id;
    expect(problems(b)).toContain("duplicate id");
    const c = good();
    c.items[1].sources = [];
    expect(problems(c)).toContain("needs an official source");
  });
  it("a topic taught later must say the gist is enough, stay one line, and link forward only", () => {
    const later = (b: BackgroundFile) => b.items.find((i) => i.id === "consensus")!;
    const a = good();
    later(a).explanation = "Several machines agreeing on one order of changes even when some of them fail along the way.";
    expect(problems(a)).toContain("the gist must say that the gist is enough");
    const b = good();
    later(b).explanation = `${"word ".repeat(40)}The gist is enough here.`;
    expect(problems(b)).toContain("one-line gist");
    const c = good();
    later(c).sources = [{ title: "T", publisher: "P", url: "https://example.com", year: "2026", verifiedOn: "2026-10-12" }];
    expect(problems(c)).toContain("only the label and the gist");
  });
  it("an earlier concept with a topic page still needs its official source, since the page does not link back", () => {
    const a = good();
    a.items[0].sources = [];
    expect(problems(a)).toContain("needs one");
  });
  it("an earlier concept may not claim the gist is enough", () => {
    const a = good();
    a.items[0].explanation = "A transaction bundles changes into one step that happens fully or not at all. The gist is enough here.";
    expect(problems(a)).toContain("only a concept taught later says the gist is enough");
  });
  it("bad urls, years, dates and banned phrasing", () => {
    const a = good();
    a.items[1].sources![0].url = "http://insecure.example";
    a.items[1].sources![0].year = "last year";
    a.items[1].sources![0].verifiedOn = "yesterday";
    a.items[0].explanation = "It is not just a log, it is the record every replica copies from — so it matters a great deal.";
    const out = problems(a);
    expect(out).toContain("url must be https");
    expect(out).toContain("year must be");
    expect(out).toContain("verifiedOn must be");
    expect(out).toContain("banned phrasing");
  });
  it("a file whose topic does not match its name or does not exist", () => {
    expect(validateBackground("dns.json", good(), topics).join()).toContain("does not match the file name");
    const a = good();
    a.topic = "nope";
    expect(validateBackground("nope.json", a, topics).join()).toContain('no topic "nope"');
  });
});

describe("the link on a topic page", () => {
  const caching = topics.find((t) => t.slug === "caching")!;
  const render = (backgroundHref?: string) =>
    renderToStaticMarkup(
      TopicLesson({
        topic: caching,
        prerequisites: caching.prerequisites.map((s) => topics.find((t) => t.slug === s)!),
        dependents: getDependents("caching"),
        titles: new Map(topics.map((t) => [t.slug, t.title])),
        backgroundHref,
        updated: "2026-10-12",
      }) as never,
    );

  it("sits at the top of the posts section, directly above the first post, with the agreed wording", () => {
    const out = render("/background#caching");
    expect(out).toContain('<span>Before you read these posts:</span><a href="/background#caching">Background for this topic</a>');
    const at = out.indexOf("Before you read these posts:");
    const firstPost = out.indexOf(`<div id="${caching.posts[0].id}">`);
    expect(at).toBeGreaterThan(out.indexOf('id="posts-h"'));
    expect(at).toBeLessThan(firstPost);
    // nothing but the end of the section sits between the link and the first post
    expect(out.slice(at, firstPost)).not.toMatch(/<h2|<section id=/);
    expect(out.match(/Background for this topic/g)).toHaveLength(1);
  });

  it("is gone from the row with 'Skip to the posts'", () => {
    const row = render("/background#caching").match(/<p class="lesson-jump">.*?<\/p>/s)![0];
    expect(row).toContain("Skip to the posts");
    expect(row).not.toContain("Background");
  });

  it("has the anchor that 'Back to the topic' on /background lands on, just above the posts", () => {
    const out = render("/background#caching");
    expect(out).toContain('id="posts"');
    expect(out.indexOf('id="posts"')).toBeLessThan(out.indexOf("Before you read these posts:"));
    expect(out.indexOf('id="posts"')).toBeLessThan(out.indexOf(`<div id="${caching.posts[0].id}">`));
    expect(renderToStaticMarkup(Background() as never)).toContain('<a href="/topic/caching#posts">Back to the Caching topic</a>');
  });

  it("is not shown when the topic has no background file", () => {
    expect(render(undefined)).not.toContain("Before you read these posts");
    expect(render(backgroundHref("dns"))).not.toContain("Before you read these posts");
  });
});
