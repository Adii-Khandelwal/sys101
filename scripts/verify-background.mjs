// Opens every post and source behind content/background and confirms what the files claim. Needs the network, so it
// is not in the build:   npm run verify:background
//   - each "Assumed by" sentence appears in the text of the post it names (curly quotes and spacing ignored);
//   - each official source URL answers with a success status.
// Any miss fails the run.
import fs from "node:fs";
import path from "node:path";
import { evidenceFound, pageText } from "./news-verify-rules.mjs";

const root = process.cwd();
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  // Some sites (Uber's blog) answer 406 to a request that does not look like a browser's.
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function get(url) {
  // Uber's blog also wants the trailing slash.
  for (const u of [url, url.endsWith("/") ? null : `${url}/`]) {
    if (!u) continue;
    const res = await fetch(u, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(30000) });
    if (res.ok) return res.text();
    if (u === url && res.status !== 406 && res.status !== 404) throw new Error(`HTTP ${res.status}`);
  }
  throw new Error("HTTP error");
}

const dir = path.join(root, "content", "background");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
const pageCache = new Map();
let failures = 0;
let checked = 0;
for (const f of files) {
  const b = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const topic = JSON.parse(fs.readFileSync(path.join(root, "content", "topics", `${b.topic}.json`), "utf8"));
  for (const item of b.items) {
    for (const a of item.assumedBy) {
      checked++;
      const post = topic.posts.find((p) => p.id === a.postId);
      try {
        if (!pageCache.has(post.url)) pageCache.set(post.url, pageText(await get(post.url)));
        if (evidenceFound(pageCache.get(post.url), a.quote)) console.log(`ok   ${b.topic}/${item.id} in ${a.postId}`);
        else throw new Error(`sentence not found in the post text: "${a.quote.slice(0, 80)}..."`);
      } catch (e) {
        failures++;
        console.error(`FAIL ${b.topic}/${item.id} in ${a.postId}\n  ${e.message}`);
      }
    }
    for (const s of item.sources ?? []) {
      checked++;
      try {
        await get(s.url);
        console.log(`ok   ${b.topic}/${item.id} source ${s.url}`);
      } catch (e) {
        failures++;
        console.error(`FAIL ${b.topic}/${item.id} source ${s.url}\n  ${e.message}`);
      }
    }
  }
}
console.log(`${checked} checks, ${failures} failed.`);
process.exit(failures ? 1 : 0);
