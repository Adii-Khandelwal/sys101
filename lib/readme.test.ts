import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { apply, stats } from "../scripts/readme-stats.mjs";
import { AI_ASSISTANCE } from "./site";
import { buildPostsIndex } from "./posts";
import { buildReads, getAllReads } from "./reads";
import { sourceKinds } from "./sourceKinds";
import { getAllTopics } from "./topics";
import { topicOrder } from "./order";

const readme = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");

describe("README", () => {
  it("has numbers that match the content (run npm run readme:stats)", () => {
    expect(apply(readme)).toBe(readme);
  });

  it("counts the way the site does", () => {
    const topics = getAllTopics();
    const idx = buildPostsIndex(topicOrder(topics));
    const reads = buildReads(getAllReads(topics.map((t) => t.slug)), topics);
    expect(stats()).toEqual({
      topics: String(idx.topicCount),
      sources: String(idx.total),
      organizations: String(idx.companyCount),
      kinds: sourceKinds(idx.counts),
      reads: String(reads.total),
      themes: String(reads.themeCount),
    });
  });

  it("carries the AI-assistance sentence word for word", () => {
    expect(readme).toContain(AI_ASSISTANCE);
  });

  it("carries the non-affiliation sentence the About page has", () => {
    const sentence = "The posts belong to their authors and companies, and this personal project is not affiliated with any of them.";
    expect(readme).toContain(sentence);
    expect(fs.readFileSync(path.join(process.cwd(), "app/about/page.tsx"), "utf8").replace(/\s+/g, " ")).toContain(sentence);
  });

  it("points every local image and link at a file that exists", () => {
    const targets = [...readme.matchAll(/(?:src|srcset|href)="(?!https?:|mailto:)([^"#]+)"|\]\((?!https?:|mailto:|#)([^)#]+)\)/g)].map((m) => m[1] ?? m[2]);
    expect(targets.length).toBeGreaterThan(6);
    for (const t of targets) expect(fs.existsSync(path.join(process.cwd(), t)), t).toBe(true);
  });
});
