import { describe, expect, it } from "vitest";
import { DESC_MAX, absoluteUrl, breadcrumbLd, metaDescription, pageMeta, pageTitle } from "./site";
import { getAllTopics } from "./topics";

describe("meta descriptions", () => {
  it("takes the first full sentence when it fits", () => {
    expect(metaDescription("Caching keeps copies close. It costs freshness.")).toBe("Caching keeps copies close.");
  });

  it("does not split on a dot inside a word", () => {
    expect(metaDescription("Use node.js for this. Then stop.")).toBe("Use node.js for this.");
  });

  it("adds a period to a text with no sentence mark", () => {
    expect(metaDescription("A short phrase")).toBe("A short phrase.");
  });

  it("uses the text up to the last clause boundary that fits, plus a period, when the sentence is too long", () => {
    const long = `${"One clause that goes on, ".repeat(5)}and another clause that keeps going past the limit with many more words than fit in a description.`;
    const out = metaDescription(long);
    expect(out.length).toBeLessThan(DESC_MAX);
    expect(out.endsWith(".")).toBe(true);
    expect(out).not.toMatch(/[,;:]\.$/);
    expect(out.includes("…")).toBe(false);
    expect(long.startsWith(out.slice(0, -1))).toBe(true);
  });

  it("cuts at a word only when there is no clause boundary, still with no ellipsis", () => {
    const out = metaDescription("word ".repeat(60));
    expect(out.length).toBeLessThan(DESC_MAX);
    expect(out.endsWith("word.")).toBe(true);
  });

  it("every topic's description ends in a period after 8 words or more, under the limit, with no ellipsis", () => {
    for (const t of getAllTopics()) {
      const raw = t.description ?? t.concept;
      const d = metaDescription(raw);
      expect(d.length, t.slug).toBeLessThan(DESC_MAX);
      expect(d, t.slug).toMatch(/\.$/);
      expect(d.split(/\s+/).length, t.slug).toBeGreaterThanOrEqual(8);
      expect(d, t.slug).not.toMatch(/…|\.\.\./);
      expect(pageMeta({ path: "/x", title: t.title, description: raw }).description, t.slug).toBe(d);
      if (t.description) expect(d, t.slug).toBe(t.description);
    }
  });
});

describe("urls", () => {
  it("has no trailing slash on the home URL and no query strings", () => {
    expect(absoluteUrl("/")).toMatch(/^https:\/\/[^/?]+$/);
    expect(absoluteUrl("/topic/dns")).toMatch(/\/topic\/dns$/);
  });

  it("numbers breadcrumb items from 1", () => {
    const ld = breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "DNS", path: "/topic/dns" },
    ]);
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });
});

describe("page titles", () => {
  it("keeps the suffix and uses the short title when the full one would reach 60 characters", () => {
    const circuit = { title: "Circuit Breakers and Load Shedding", shortTitle: "Circuit Breakers" };
    expect(pageTitle(circuit)).toBe("Circuit Breakers and Load Shedding");
    expect(pageTitle(circuit, "Start from zero: ")).toBe("Start from zero: Circuit Breakers");
    const meta = pageMeta({ path: "/x", title: pageTitle(circuit, "Start from zero: "), description: "d" });
    expect(meta.title).toBe("Start from zero: Circuit Breakers");
    expect(String((meta.openGraph as { title?: string }).title)).toBe("Start from zero: Circuit Breakers · sys101");
    expect(String((meta.openGraph as { title?: string }).title).length).toBeLessThan(60);
  });

  it("keeps the full title when it fits, even if a short one exists", () => {
    expect(pageTitle({ title: "DNS", shortTitle: "D" }, "Start from zero: ")).toBe("Start from zero: DNS");
  });

  it("every topic page and learn page title is under 60 characters with the suffix", () => {
    for (const t of getAllTopics()) {
      expect(`${pageTitle(t)} · sys101`.length, t.slug).toBeLessThan(60);
      expect(`${pageTitle(t, "Start from zero: ")} · sys101`.length, `${t.slug} learn`).toBeLessThan(60);
    }
  });
});
