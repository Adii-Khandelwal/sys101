// Opens every post and source behind content/background and confirms what the files claim. Needs the network, so it
// is not in the build:   npm run verify:background
//   - each "Assumed by" sentence appears in the text of the post it names (curly quotes and spacing ignored);
//   - each official source URL answers with a success status.
// Any miss fails the run.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { evidenceFound, pageText } from "./news-verify-rules.mjs";

const root = process.cwd();
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  // Some sites (Uber's blog) answer 406 to a request that does not look like a browser's.
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchOnce(url) {
  // Uber's blog also wants the trailing slash.
  for (const u of [url, url.endsWith("/") ? null : `${url}/`]) {
    if (!u) continue;
    const res = await fetch(u, { headers: { ...HEADERS, Accept: `${HEADERS.Accept},application/pdf` }, redirect: "follow", signal: AbortSignal.timeout(40000) });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (u === url && res.status !== 406 && res.status !== 404) throw new Error(`HTTP ${res.status}`);
  }
  throw new Error("HTTP error");
}

/** The text of a PDF, through pdftotext or Python's pypdf (the same tools as verify:figures). */
function pdfText(buf) {
  const tmp = path.join(os.tmpdir(), `verify-background-${process.pid}-${Math.random().toString(36).slice(2)}.pdf`);
  fs.writeFileSync(tmp, buf);
  try {
    try {
      return execFileSync("pdftotext", ["-layout", tmp, "-"], { maxBuffer: 1 << 28 }).toString();
    } catch {
      return execFileSync("python3", ["-I", "-c", "import sys,pypdf;r=pypdf.PdfReader(sys.argv[1]);print('\\n'.join((p.extract_text() or '') for p in r.pages))", tmp], { maxBuffer: 1 << 28 }).toString();
    }
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

const isPdf = (buf) => buf.subarray(0, 5).toString() === "%PDF-";

/** Plain text of a page or paper. A Google Research abstract page (research.google/pubs/pubN/) is followed to its paper. */
async function pageTextOf(url) {
  const buf = await fetchOnce(url);
  if (isPdf(buf)) return pdfText(buf);
  const pub = url.match(/research\.google\/pubs\/pub(\d+)/);
  if (pub) {
    try {
      const paper = await fetchOnce(`https://research.google.com/pubs/archive/${pub[1]}.pdf`);
      if (isPdf(paper)) return pdfText(paper);
    } catch {
      // fall back to the abstract page
    }
  }
  return pageText(buf.toString("utf8"));
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
        if (!pageCache.has(post.url)) pageCache.set(post.url, await pageTextOf(post.url));
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
        await fetchOnce(s.url);
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
