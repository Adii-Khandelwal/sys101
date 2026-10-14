// Preflight for a new or changed topic: the wiring the build and the tests do not catch on their own.
// Usage: node scripts/check-topic.mjs <slug>     (npm run check:topic -- <slug>)
// FAIL exits 1. WARN needs a decision (fix it, or say in the report why not). Offline, never in the build.
// The build and `npm test` still decide whether the content itself is valid; this only checks that every part exists
// and that the rest of the site was told about the new topic.
import fs from "node:fs";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/check-topic.mjs <slug>");
  process.exit(1);
}
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const topics = Object.fromEntries(fs.readdirSync("content/topics").map((f) => [f.replace(/\.json$/, ""), read(`content/topics/${f}`)]));
const t = topics[slug];
const fail = [];
const warn = [];

if (!t) {
  console.error(`FAIL no content/topics/${slug}.json`);
  process.exit(1);
}
if (t.slug !== slug) fail.push(`slug "${t.slug}" in the file differs from the file name "${slug}"`);

for (const dir of ["learn", "background"]) {
  if (!fs.existsSync(`content/${dir}/${slug}.json`)) {
    (dir === "learn" ? fail : warn).push(`no content/${dir}/${slug}.json${dir === "learn" ? " (a topic is not done without its learn page)" : " (fine only if its posts assume nothing; say so)"}`);
  }
}
if (fs.existsSync(`content/background/${slug}.json`) && read(`content/background/${slug}.json`).topic !== slug) fail.push("content/background: `topic` is not this slug");

for (const p of t.prerequisites ?? []) if (!topics[p]) fail.push(`prerequisite "${p}" has no topic file`);
if (!t.summary?.points?.length) fail.push("no `summary` (write it through scripts/topic-brief.mjs and scripts/apply-drafts.mjs)");
if (t.prerequisites?.length && !Object.keys(t.prerequisiteReasons ?? {}).length) fail.push("no `prerequisiteReasons` for its prerequisites");

// A prerequisite's "What to learn next" is hand-written; it should send the reader on to this topic.
const first = (title) => title.toLowerCase().split(/\s+/)[0];
for (const p of t.prerequisites ?? []) {
  const body = (topics[p]?.lesson?.next?.body ?? "").toLowerCase();
  if (topics[p] && !body.includes(first(t.title))) warn.push(`"${p}": What to learn next does not mention "${t.title}"`);
}

// Every company needs a mark (lib/logos.test.ts also fails, but later).
const logos = fs.readFileSync("lib/logoFiles.ts", "utf8");
const without = Object.keys(read("content/logos.json").withoutLogo ?? {});
const org = (c) => (c.startsWith("Amazon") ? "Amazon" : c === "Facebook" ? "Meta" : c);
for (const c of new Set(t.posts.map((p) => org(p.company)))) {
  if (!logos.includes(`"${c}":`) && !without.includes(c)) fail.push(`no logo for ${c}: node scripts/make-logos.mjs add "${c}" [domain]`);
}

// A post already used under another topic is allowed, but the same id is not.
const ids = new Map();
for (const [s, x] of Object.entries(topics)) for (const p of x.posts) ids.set(p.id, [...(ids.get(p.id) ?? []), s]);
for (const p of t.posts) if (ids.get(p.id).length > 1) fail.push(`post id "${p.id}" is also used by ${ids.get(p.id).filter((s) => s !== slug).join(", ")}`);

// Docs that say how many topics there are would now be wrong. Working records (verification log, review progress) are dated, so skipped.
const n = Object.keys(topics).length;
for (const f of ["CLAUDE.md", ...fs.readdirSync(".claude/rules").map((x) => `.claude/rules/${x}`), ".claude/skills/add-topic/SKILL.md"]) {
  fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/\b(\d+|eighteen)\s+topics\b/gi)) {
      const said = m[1].toLowerCase() === "eighteen" ? 18 : Number(m[1]);
      if (said !== n && said > 12) warn.push(`${f}:${i + 1} says "${m[0]}" but there are ${n} topics`);
    }
  });
}

for (const m of fail) console.error(`FAIL ${m}`);
for (const m of warn) console.warn(`WARN ${m}`);
if (!fail.length) console.log(`${slug}: files, prerequisites, summary, logos and ids are in place${warn.length ? `; ${warn.length} warning(s) to decide` : ""}.`);
process.exit(fail.length ? 1 : 0);
