// After a deploy: the live search index must hold the whole site, not a stub. Usage: node scripts/check-live-search.mjs [baseUrl]
// Needs the network; run by hand after a merge (release-check), never in the build.
import fs from "node:fs";

const base = process.argv[2] ?? "https://sys101.vercel.app";
const topics = fs.readdirSync("content/topics").filter((f) => f.endsWith(".json")).length;
const res = await fetch(`${base}/pagefind/pagefind-entry.json`);
if (!res.ok) {
  console.error(`FAIL: ${base}/pagefind/pagefind-entry.json answered ${res.status}`);
  process.exit(1);
}
const { languages } = await res.json();
const pages = Object.values(languages).reduce((n, l) => n + l.page_count, 0);
if (pages < topics + 5) {
  console.error(`FAIL: the live search index holds ${pages} pages, expected at least ${topics + 5}.`);
  process.exit(1);
}
console.log(`OK: the live search index holds ${pages} pages.`);
