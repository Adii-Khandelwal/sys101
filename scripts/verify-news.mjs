// Opens every What's new URL and confirms what the file claims. Needs the network, so it is not in the build.
//   npm run verify:news
// For each item: fetch the page raw (the Wayback Machine copy when the site blocks us, and it says so),
// confirm the evidence phrase is in the page text, confirm dateShown matches a date the page shows, and fail
// any item older than 12 months. Any miss fails the run.
import fs from "node:fs";
import path from "node:path";
import { olderThan12Months } from "./news-rules.mjs";
import { dateMatches, datesShown, evidenceFound, fetchAllowed, pageText } from "./news-verify-rules.mjs";

const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const state = JSON.parse(fs.readFileSync(path.join(root, "docs", "news-state.json"), "utf8"));

async function get(url) {
  const res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** The page as HTML, and whether it came from the Wayback Machine. Redirects off the allowlist are refused, not worked around. */
async function fetchPage(url, allowed) {
  try {
    return { html: (await fetchAllowed(url, allowed, fetch, { headers: HEADERS })).html, archive: false };
  } catch (first) {
    if (/allowlist/.test(first.message)) throw first;
    try {
      const api = await get(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`);
      const snap = JSON.parse(api).archived_snapshots?.closest;
      if (!snap?.url) throw new Error("no archive copy");
      // "id_" asks for the original bytes without the archive's toolbar.
      return { html: await get(snap.url.replace(/\/web\/(\d+)\//, "/web/$1id_/")), archive: true };
    } catch {
      throw new Error(`could not fetch (${first.message}) and no archive copy`);
    }
  }
}

const dir = path.join(root, "content", "news");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
let failures = 0;
let checked = 0;
for (const f of files) {
  const news = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  for (const it of news.items) {
    checked++;
    const problems = [];
    let note = "";
    if (olderThan12Months(it.dateShown, today)) problems.push(`dateShown ${it.dateShown} is older than 12 months`);
    try {
      const { html, archive } = await fetchPage(it.url, state.allowedDomains?.[f.replace(/\.json$/, "")] ?? []);
      if (archive) note = " (archive copy)";
      if (!evidenceFound(pageText(html), it.evidence)) problems.push(`evidence not found in the page text: "${it.evidence}"`);
      const shown = datesShown(html);
      if (!dateMatches(it.dateShown, shown)) {
        problems.push(shown.length ? `dateShown ${it.dateShown} matches none of the dates on the page` : `dateShown ${it.dateShown} but the page shows no date`);
      }
    } catch (e) {
      problems.push(e.message);
    }
    if (problems.length) {
      failures++;
      console.error(`FAIL ${f} ${it.id}${note}\n  ${problems.join("\n  ")}`);
    } else console.log(`ok   ${f} ${it.id}${note}`);
  }
}
console.log(`${checked} item${checked === 1 ? "" : "s"} checked, ${failures} failed.`);
process.exit(failures ? 1 : 0);
