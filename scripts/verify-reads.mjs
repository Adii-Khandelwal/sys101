// Opens every Great reads URL and confirms what the file claims. Needs the network, so it is not in the build.
//   npm run verify:reads     (alias: verify:landmarks)
// For each entry: the page must answer at its own URL (live, never an archive copy; a browser is the fallback when curl-style
// fetching is refused), every evidence phrase must be in the page text, `published` must match a date the page shows, and a
// "stated" claim phrase must be on its page. PDFs are read through Python's pypdf. Any miss fails the run.
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { dateMatches, datesShown, evidenceFound, pageText } from "./news-verify-rules.mjs";

const run = promisify(execFile);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9" };

async function pdfText(buf) {
  const tmp = path.join(os.tmpdir(), `verify-reads-${process.pid}-${Math.random().toString(36).slice(2)}.pdf`);
  fs.writeFileSync(tmp, buf);
  try {
    const py = "import sys,pypdf;r=pypdf.PdfReader(sys.argv[1]);print('\\n'.join((p.extract_text() or '') for p in r.pages))";
    return (await run("python3", ["-I", "-c", py, tmp], { maxBuffer: 256 * 1024 * 1024 })).stdout;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

let browser;
async function browse(url) {
  if (!browser) browser = await (await import("playwright")).chromium.launch();
  const ctx = await browser.newContext({ userAgent: UA, locale: "en-US" });
  try {
    const page = await ctx.newPage();
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);
    if (!res || !res.ok()) throw new Error(`HTTP ${res?.status()}`);
    return await page.content();
  } finally {
    await ctx.close();
  }
}

const cache = new Map();
/** { text, html, how }: the page as it answers today. */
async function open(url) {
  if (cache.has(url)) return cache.get(url);
  const job = (async () => {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if ((res.headers.get("content-type") ?? "").includes("pdf")) return { text: await pdfText(Buffer.from(await res.arrayBuffer())), how: "pdf" };
      const html = await res.text();
      return { html, text: pageText(html), how: "fetch" };
    } catch (first) {
      try {
        const html = await browse(url);
        return { html, text: pageText(html), how: "browser copy" };
      } catch (second) {
        throw new Error(`could not open ${url} (${first.message}; browser: ${second.message})`);
      }
    }
  })();
  cache.set(url, job);
  return job;
}

/** A full date or month must match a date the page shows; a year alone (papers) must appear as a whole number in the text. Tags become spaces so "Ingram</div><div>March 6" still reads as a date. */
function publishedShown(published, page) {
  if (/^\d{4}$/.test(published)) return new RegExp(`(?<!\\d)${published}(?!\\d)`).test(page.text);
  return dateMatches(published, datesShown((page.html ?? page.text).replace(/<[^>]+>/g, " ")));
}

const dir = path.join(process.cwd(), "content", "reads");
let failures = 0;
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const problems = [];
  let how = "";
  try {
    const page = await open(r.url);
    how = page.how;
    if (/^\s*(404|page not found|not found)\b/i.test(page.text.slice(0, 200))) problems.push("the page looks like a 404");
    for (const p of r.evidence) if (!evidenceFound(page.text, p)) problems.push(`evidence not in the page: "${p}"`);
    if (!publishedShown(r.published, r.dateUrl ? await open(r.dateUrl) : page)) problems.push(`published ${r.published} matches no date the page shows`);
    if (r.claim) {
      const other = await open(r.claim.url ?? r.url);
      if (!evidenceFound(other.text, r.claim.phrase)) problems.push(`claim phrase not on ${r.claim.url ?? "the page"}: "${r.claim.phrase}"`);
    }
  } catch (e) {
    problems.push(e.message);
  }
  if (problems.length) {
    failures++;
    console.error(`FAIL ${r.id} (${how})\n  ${problems.join("\n  ")}`);
  } else console.log(`ok   ${r.id} (${how})`);
}
if (browser) await browser.close();
console.log(`${files.length} reads checked, ${failures} failed.`);
process.exit(failures ? 1 : 0);
