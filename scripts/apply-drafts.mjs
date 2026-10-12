// Merges docs/drafts/<batch>.json ({slug: {summary, prerequisiteReasons}}) into content/topics/<slug>.json.
// Only those two fields are touched; the rest of each file is kept byte for byte.
// Usage: node scripts/apply-drafts.mjs docs/drafts/batch-1-pilot.json
import fs from "node:fs";

const FIELDS = ["summary", "prerequisiteReasons"];
const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/apply-drafts.mjs <drafts file>");
  process.exit(1);
}
const drafts = JSON.parse(fs.readFileSync(file, "utf8"));
const known = new Set(fs.readdirSync("content/topics").map((f) => f.replace(/\.json$/, "")));

const problems = [];
for (const [slug, draft] of Object.entries(drafts)) {
  if (!known.has(slug)) problems.push(`unknown slug "${slug}"`);
  for (const k of Object.keys(draft)) if (!FIELDS.includes(k)) problems.push(`${slug}: unknown field "${k}"`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

for (const [slug, draft] of Object.entries(drafts)) {
  const path = `content/topics/${slug}.json`;
  const raw = fs.readFileSync(path, "utf8");
  const indent = /\n( +)"/.exec(raw)?.[1] ?? "  ";
  const topic = JSON.parse(raw);
  // Rebuild the object with the draft fields placed after `prerequisites`, so key order stays stable.
  const out = {};
  for (const [k, v] of Object.entries(topic)) {
    if (FIELDS.includes(k)) continue;
    out[k] = v;
    if (k === "prerequisites") for (const f of FIELDS) if (draft[f] !== undefined) out[f] = draft[f];
  }
  const text = JSON.stringify(out, null, indent) + (raw.endsWith("\n") ? "\n" : "");
  // Safety: nothing but the two fields may differ after the merge.
  const strip = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k]) => !FIELDS.includes(k))));
  if (strip(JSON.parse(text)) !== strip(topic)) throw new Error(`${slug}: merge changed other fields`);
  fs.writeFileSync(path, text);
  console.log(`${slug}: applied ${Object.keys(draft).join(", ")}`);
}
