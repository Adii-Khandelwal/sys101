// Read-only, offline brief for the monthly What's new run: for each topic that has an allowlist, which sites to look at,
// what is already listed, and how many places are free. It writes nothing and fetches nothing; the routine still opens
// the pages itself and every check stays the gate. Usage: node scripts/news-month.mjs [YYYY-MM]  (default: last month)
import fs from "node:fs";
import path from "node:path";
import { MAX_ITEMS, olderThan12Months } from "./news-rules.mjs";

/** "2026-10" before the given date, as YYYY-MM. */
export function previousMonth(today) {
  const [y, m] = today.slice(0, 7).split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

const where = (e) => `${e.host}${e.pathPrefix ?? ""}${e.pathPattern ? ` (pattern ${e.pathPattern})` : ""}`;
const lastDay = (month) => {
  const [y, m] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

/**
 * The brief as lines of text. `state` is docs/news-state.json, `news` maps topic slug to its news file (or undefined),
 * `month` is the month to look for (YYYY-MM). Topics are listed oldest `lastChecked` first, like the routine's pick.
 */
export function monthBrief(state, news, month) {
  const slugs = Object.keys(state.allowedDomains ?? {}).sort(
    (a, b) => (state.lastChecked?.[a] ?? "").localeCompare(state.lastChecked?.[b] ?? "") || a.localeCompare(b),
  );
  const lines = [`Looking for pages dated ${month}, for ${slugs.length} topics with an allowlist.`];
  for (const slug of slugs) {
    const items = news[slug]?.items ?? [];
    // An item the 12-month rule will remove on this run does not take a place.
    const kept = items.filter((i) => !olderThan12Months(i.dateShown, lastDay(month)));
    const free = Math.max(0, MAX_ITEMS - kept.length);
    lines.push("", `${slug}  (last checked ${state.lastChecked?.[slug] ?? "never"}, ${free} of ${MAX_ITEMS} places free)`);
    for (const e of state.allowedDomains[slug]) lines.push(`  site: ${where(e)}  publisher: "${e.publisher}"${e.kinds ? `  kinds: ${e.kinds.join(", ")}` : ""}`);
    for (const i of items) lines.push(`  listed: ${i.id}  (${i.dateShown}, added ${i.addedOn})${kept.includes(i) ? "" : "  older than 12 months, remove"}`);
  }
  return lines;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const root = process.cwd();
  const month = process.argv[2] ?? previousMonth(new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    console.error("Usage: node scripts/news-month.mjs [YYYY-MM]");
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(path.join(root, "docs", "news-state.json"), "utf8"));
  const dir = path.join(root, "content", "news");
  const news = Object.fromEntries(
    (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter((f) => f.endsWith(".json")).map((f) => [f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))]),
  );
  console.log(monthBrief(state, news, month).join("\n"));
}
