import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ prefetch: () => {} }), usePathname: () => "/" }));

import Reads from "../app/reads/page";
import { READ_THEMES, buildReads, getAllReads, readProblems, type Read } from "./reads";
import { getAllTopics } from "./topics";

const topics = getAllTopics();
const slugs = topics.map((t) => t.slug);
const reads = getAllReads(slugs);
const html = renderToStaticMarkup(Reads() as never);
const sample = (over: Partial<Read> = {}): Read => ({ ...reads.find((r) => r.influence === "writeup")!, ...over });
const problems = (r: Read) => readProblems([r], slugs, [`${r.id}.json`]).filter((p) => !p.startsWith("theme "));

describe("Great reads data", () => {
  it("loads, passes every check and fills every theme", () => {
    expect(reads.length).toBeGreaterThan(0);
    for (const t of READ_THEMES) expect(reads.filter((r) => r.theme === t).length, t).toBeGreaterThanOrEqual(3);
  });

  it("a write-up says nothing about impact; only a stated entry may, and it must attribute and carry a claim", () => {
    expect(problems(sample({ whyItMatters: "Explains the design of a store that became the standard way to keep many replicas in step across sites." }))).toEqual(
      expect.arrayContaining([expect.stringContaining("say nothing about impact")]),
    );
    expect(problems(sample({ influence: "stated" }))).toEqual(expect.arrayContaining([expect.stringContaining("needs a claim phrase")]));
    expect(problems(sample({ influence: "stated", claim: { phrase: "x" } }))).toEqual(expect.arrayContaining([expect.stringContaining("must attribute")]));
  });

  it("rejects an interview claim, an em dash, a stray number, a bad link and an unknown topic", () => {
    const body = "Explains how a team built a store that is asked about in every interview and why it chose its design in the end.";
    expect(problems(sample({ whyItMatters: body }))).toEqual(expect.arrayContaining([expect.stringContaining("interview")]));
    expect(problems(sample({ whyItMatters: body.replace("asked about in every interview", "slow — and careful") }))).not.toEqual([]);
    expect(problems(sample({ whyItMatters: "Explains how a team built a store that holds 500 petabytes and why it chose its design in the end." }))).toEqual(
      expect.arrayContaining([expect.stringContaining("number 500")]),
    );
    expect(problems(sample({ url: "http://example.com/x" }))).not.toEqual([]);
    expect(problems(sample({ topics: ["no-such-topic"] }))).not.toEqual([]);
  });

  it("computes 'also a source' from the topic files, so a paper already in a topic points at it", () => {
    const data = buildReads(reads, topics);
    const rows = data.byTheme.flatMap((g) => g.reads);
    const dynamo = rows.find((r) => r.id === "dynamo")!;
    expect(dynamo.sourceOn.map((t) => t.slug)).toEqual(["cap"]);
    expect(dynamo.related).toEqual([]);
    expect(rows.filter((r) => r.sourceOn.length).every((r) => topics.some((t) => t.posts.some((p) => p.url === r.url)))).toBe(true);
    for (const g of data.byTheme) expect(g.reads.map((r) => r.published)).toEqual([...g.reads.map((r) => r.published)].sort());
  });
});

describe("Great reads page", () => {
  it("shows every entry once, with its kind, year and an external link", () => {
    for (const r of reads) {
      expect(html.split(r.url).length - 1, r.id).toBe(2); // the link, and the JSON-LD item
      expect(html).toContain(`original ${r.kind}, external`);
    }
  });

  it("makes no interview claim, uses no em dash, and says each read describes its system as of the year shown", () => {
    expect(html).not.toMatch(/interview/i);
    expect(html).not.toContain("—");
    expect(html).toContain("as of the year shown");
    expect(html).not.toMatch(/still holds|still true/i);
  });

  it("types no count: the page source has no number literal", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "app", "reads", "page.tsx"), "utf8");
    expect(src.replace(/position: i \+ 1/, "")).not.toMatch(/\b\d{2,}\b/);
  });
});
