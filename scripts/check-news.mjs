// Checks content/news/*.json and docs/news-state.json. Runs in the build (postbuild) and in the news PR check.
// Errors fail; dates older than 12 months are warnings here (verify-news.mjs fails them).
import fs from "node:fs";
import path from "node:path";
import { isAllowEntry, isDate, validateNews } from "./news-rules.mjs";

const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);
const topics = new Map(
  fs.readdirSync(path.join(root, "content", "topics")).map((f) => {
    const t = JSON.parse(fs.readFileSync(path.join(root, "content", "topics", f), "utf8"));
    return [t.slug, t.posts.map((p) => p.url)];
  }),
);
const problems = [];
let warnings = 0;

const state = JSON.parse(fs.readFileSync(path.join(root, "docs", "news-state.json"), "utf8"));
for (const k of Object.keys(state)) if (!["lastChecked", "allowedDomains"].includes(k)) problems.push(`news-state.json: unknown field "${k}"`);
for (const [slug, d] of Object.entries(state.lastChecked ?? {})) {
  if (!topics.has(slug)) problems.push(`news-state.json: lastChecked has unknown topic "${slug}"`);
  if (!isDate(d)) problems.push(`news-state.json: lastChecked.${slug} must be YYYY-MM-DD`);
  else if (d > today) problems.push(`news-state.json: lastChecked.${slug} is in the future`);
}
for (const [slug, list] of Object.entries(state.allowedDomains ?? {})) {
  if (!topics.has(slug)) problems.push(`news-state.json: allowedDomains has unknown topic "${slug}"`);
  if (!Array.isArray(list) || !list.every(isAllowEntry)) problems.push(`news-state.json: allowedDomains.${slug} must be a list of { host, pathPrefix?, publisher, kinds? }`);
}

const dir = path.join(root, "content", "news");
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith(".json")) : []) {
  const slug = f.replace(/\.json$/, "");
  if (!topics.has(slug)) {
    problems.push(`${f}: no topic "${slug}"`);
    continue;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  } catch (e) {
    problems.push(`${f}: not valid JSON`);
    continue;
  }
  const { errors, warnings: w } = validateNews(data, { allowedDomains: state.allowedDomains?.[slug] ?? [], originalUrls: topics.get(slug), today });
  problems.push(...errors.map((e) => `${f}: ${e}`));
  w.forEach((x) => console.warn(`news warning: ${f}: ${x}`));
  warnings += w.length;
}

if (problems.length) {
  console.error(`News check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`News check passed${warnings ? ` (${warnings} warning${warnings > 1 ? "s" : ""})` : ""}.`);
