// Rewrites the numbers in README.md from the content files, so they are computed and never typed.
// A number sits between marker comments: <!--stat:sources-->52<!--/stat-->. Only the text between a pair changes.
// Usage: node scripts/readme-stats.mjs           rewrite README.md
//        node scripts/readme-stats.mjs --check   exit 1 if README.md has drifted (lib/readme.test.ts runs the same check)
// Counting rules are the site's: a source is one distinct URL, a paper is marked in ageNote, a documentation page has an
// edition (lib/posts.ts, sourceCounts), and an organization merges Amazon with AWS and Facebook with Meta (lib/organization.ts).
// Node 24 strips the types from the two lib files it imports.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { organization } from "../lib/organization.ts";
import { sourceKinds } from "../lib/sourceKinds.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (dir) =>
  fs
    .readdirSync(path.join(ROOT, dir))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, dir, f), "utf8")));

const isPaper = (p) => (p.ageNote ?? "").startsWith("This is a research paper");

export function stats() {
  const topics = readJson("content/topics");
  const byUrl = new Map(topics.flatMap((t) => t.posts).map((p) => [p.url, p]));
  const all = [...byUrl.values()];
  const papers = all.filter(isPaper).length;
  const docs = all.filter((p) => !isPaper(p) && p.edition && p.edition !== "date unknown").length;
  const kinds = sourceKinds({ total: all.length, papers, docs, posts: all.length - papers - docs, organizations: 0 });
  const reads = readJson("content/reads");
  return {
    topics: String(topics.length),
    sources: String(all.length),
    organizations: String(new Set(all.map((p) => organization(p.company))).size),
    kinds,
    reads: String(reads.length),
    themes: String(new Set(reads.map((r) => r.theme)).size),
  };
}

const MARKER = /<!--stat:([a-z]+)-->[\s\S]*?<!--\/stat-->/g;

/** The README text with every marked number replaced by the current value. A marker with no matching stat throws. */
export function apply(text, s = stats()) {
  return text.replace(MARKER, (_, name) => {
    if (!(name in s)) throw new Error(`README.md: unknown stat "${name}"`);
    return `<!--stat:${name}-->${s[name]}<!--/stat-->`;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = path.join(ROOT, "README.md");
  const before = fs.readFileSync(file, "utf8");
  const after = apply(before);
  if (process.argv.includes("--check")) {
    if (after !== before) {
      console.error("README.md numbers are out of date. Run: node scripts/readme-stats.mjs");
      process.exit(1);
    }
    console.log("README.md numbers match the content.");
  } else if (after !== before) {
    fs.writeFileSync(file, after);
    console.log("README.md numbers updated.");
  } else console.log("README.md numbers already match.");
}
