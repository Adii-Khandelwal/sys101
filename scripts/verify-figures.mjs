// Writes docs/verification-log.md: every figure in each post digest (numbers table, problem,
// walkthrough, failures, takeaways) checked against the raw source page, so it can be spot-checked.
//
// Run: npm run verify:figures        (needs the network; never part of the build)
// PDFs (papers) need pdftotext, or Python with pypdf, on the machine running it.
// Output is docs only. It is not published and not in the sitemap. It quotes only the nearest
// heading of the source page (at most 8 words), never passages. It does not edit content.

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const run = promisify(execFile);
const TOPICS_DIR = path.join(process.cwd(), "content", "topics");
const OUT = path.join(process.cwd(), "docs", "verification-log.md");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const SCALE = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9, t: 1e12, trillion: 1e12 };
const NUM = /(\d[\d,]*(?:\.\d+)?)\s*(%|×|x\b|thousand|million|billion|trillion|[kKmMbBtT]\b|ms\b|µs\b|μs\b|us\b|s\b|seconds?\b|minutes?\b|hours?\b|days?\b|GB\b|TB\b|MB\b|KB\b|PB\b|Gbps\b|Mbps\b|fold\b|-fold\b)?/g;

function words(s, n = 8) {
  return s.trim().split(/\s+/).slice(0, n).join(" ");
}

/** Figures worth checking: numbers with a unit, a comma or decimal, or two or more digits that are not a bare year. */
function figuresIn(text) {
  const found = [];
  for (const m of text.matchAll(NUM)) {
    const raw = m[0].trim();
    const digits = m[1];
    const unit = m[2] ?? "";
    const bareYear = !unit && /^(19|20)\d\d$/.test(digits);
    const plain = digits.replace(/,/g, "");
    if (bareYear) continue;
    if (!unit && plain.length < 2 && !digits.includes(".")) continue;
    found.push(raw);
  }
  return [...new Set(found)];
}

function value(numStr, unit) {
  let v = parseFloat(numStr.replace(/,/g, ""));
  const u = (unit ?? "").toLowerCase();
  if (SCALE[u]) v *= SCALE[u];
  return v;
}

function parseFigure(fig) {
  const m = [...fig.matchAll(NUM)][0];
  return m ? { numStr: m[1], unit: m[2] ?? "" } : null;
}

async function fetchRaw(url) {
  const tmp = path.join(os.tmpdir(), `verify-figures-${process.pid}-${Math.random().toString(36).slice(2)}`);
  const args = ["-sL", "--max-time", "60", "-A", UA, "-H", "Accept: text/html,application/xhtml+xml,application/pdf", "-H", "Accept-Language: en-US,en;q=0.9", "-o", tmp, "-w", "%{http_code}", url];
  try {
    const { stdout } = await run("curl", args, { maxBuffer: 1024 * 1024 });
    const body = fs.readFileSync(tmp);
    return { status: Number(stdout), body };
  } catch (e) {
    return { status: 0, body: Buffer.alloc(0), error: e.message };
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

const isPdf = (buf) => buf.subarray(0, 5).toString("latin1") === "%PDF-";

/** Text of a PDF: pdftotext when installed, otherwise Python's pypdf (pip install pypdf). */
async function pdfToText(buf) {
  const tmp = path.join(os.tmpdir(), `verify-figures-${process.pid}-${Math.random().toString(36).slice(2)}.pdf`);
  fs.writeFileSync(tmp, buf);
  try {
    try {
      return (await run("pdftotext", ["-layout", tmp, "-"], { maxBuffer: 256 * 1024 * 1024 })).stdout;
    } catch {
      const py = "import sys,pypdf;r=pypdf.PdfReader(sys.argv[1]);print('\\n'.join((p.extract_text() or '') for p in r.pages))";
      return (await run("python3", ["-c", py, tmp], { maxBuffer: 256 * 1024 * 1024 })).stdout;
    }
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/** Numbered section headings ("4.1 Timestamp assignment") of a paper, with their offsets. */
function pdfPage(text) {
  const headings = [];
  for (const m of text.matchAll(/^\s*(\d+(?:\.\d+)*\.?)\s+([A-Z][A-Za-z0-9 ,:'\-]{2,60})\s*$/gm)) {
    headings.push({ at: m.index, title: `${m[1]} ${m[2]}`.trim() });
  }
  return { text: text.replace(/[ \t]+/g, " "), headings, pdf: true };
}

function decode(s) {
  return s
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&times;/g, "×")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/** Plain text of the page plus the character offset of each heading, so a match maps to its nearest heading. */
function pageText(html) {
  const body = html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ");
  let text = "";
  const headings = [];
  const re = /<(\/?)(h[1-6])\b[^>]*>|<[^>]+>/gi;
  let last = 0;
  let open = null;
  for (const m of body.matchAll(re)) {
    text += decode(body.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[2]) {
      if (!m[1]) open = { at: text.length };
      else if (open) {
        headings.push({ at: open.at, title: text.slice(open.at).replace(/\s+/g, " ").trim() });
        open = null;
      }
    }
    text += " ";
  }
  text += decode(body.slice(last));
  return { text, headings };
}

function headingAt(headings, pos) {
  let h = "(before first heading)";
  for (const x of headings) {
    if (x.at <= pos) h = x.title || h;
    else break;
  }
  return words(h);
}

function check(fig, page) {
  const re = new RegExp(fig.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "i");
  const exact = re.exec(page.text);
  if (exact) return { status: "found", at: exact.index };
  const p = parseFigure(fig);
  if (!p) return { status: "NOT FOUND" };
  const target = value(p.numStr, p.unit);
  // Same number written differently, for example "4000x" vs "4,000 times" or "1M" vs "1 million".
  for (const m of page.text.matchAll(NUM)) {
    if (value(m[1], m[2]) === target) return { status: "found with different formatting", at: m.index };
  }
  return { status: "NOT FOUND" };
}

function sources(topic) {
  const out = [];
  for (const post of topic.posts) {
    const d = post.digest ?? {};
    const items = [];
    for (const n of d.numbers ?? []) items.push({ where: "numbers", text: n.value, whole: true });
    const prose = [
      ["problem", d.problem],
      ["walkthrough", (d.walkthrough ?? []).map((w) => `${w.step}. ${w.explanation}`).join(" ")],
      ["failures", d.failures],
      ["takeaways", d.takeaways],
    ];
    for (const [where, t] of prose) if (t) for (const f of figuresIn(t)) items.push({ where, text: f });
    out.push({ post, items });
  }
  return out;
}

async function pool(tasks, n, fn) {
  const results = new Array(tasks.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < tasks.length) {
        const k = i++;
        results[k] = await fn(tasks[k]);
      }
    }),
  );
  return results;
}

const topics = fs
  .readdirSync(TOPICS_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, f), "utf8")));

const urls = [...new Set(topics.flatMap((t) => t.posts.map((p) => p.url)))];
console.log(`Fetching ${urls.length} pages with curl...`);
const pages = new Map();
const archived = new Set();
await pool(urls, 4, async (u) => {
  let r = await fetchRaw(u);
  if (r.status !== 200) {
    // Blocked or gone: read the Internet Archive's copies of the same address, and say so in the log.
    // Snapshots differ (some are bot-challenge pages), so the text of every copy that loads is searched.
    const copies = [];
    for (const year of ["2024", "2021", "2025"]) {
      const copy = await fetchRaw(`https://web.archive.org/web/${year}/${u}`);
      if (copy.status === 200 && !isPdf(copy.body)) copies.push(copy.body.toString("utf8"));
    }
    if (copies.length) {
      archived.add(u);
      let text = "";
      const headings = [];
      for (const html of copies) {
        const part = pageText(html);
        headings.push(...part.headings.map((h) => ({ at: h.at + text.length, title: h.title })));
        text += part.text + "\n";
      }
      return void pages.set(u, { status: 200, text, headings });
    }
  }
  if (r.status !== 200) return void pages.set(u, { status: r.status, text: "", headings: [] });
  if (isPdf(r.body)) return void pages.set(u, { status: 200, ...pdfPage(await pdfToText(r.body)) });
  const html = r.body.toString("utf8");
  let page = { status: 200, ...pageText(html) };
  // Google Research abstract pages (research.google/pubs/pubNNNN/) do not hold the paper; its PDF is at pubs/archive/NNNN.pdf.
  const pub = u.match(/research\.google\/pubs\/pub(\d+)/);
  if (pub) {
    const pdf = await fetchRaw(`https://research.google.com/pubs/archive/${pub[1]}.pdf`);
    if (pdf.status === 200 && isPdf(pdf.body)) page = { status: 200, ...pdfPage(await pdfToText(pdf.body)) };
  }
  pages.set(u, page);
});

const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const lines = [
  "# Verification log",
  "",
  `Generated by \`npm run verify:figures\` on ${new Date().toISOString().slice(0, 10)}. Docs only: not published, not in the sitemap, not part of the build.`,
  "",
  "Pages marked \"(archive copy)\" were blocked to curl and were read from the Internet Archive's copy of the same address. Each figure from a digest's numbers table, problem, walkthrough, failures and takeaways is looked up in the raw page fetched with curl. The last column is the nearest heading above the match, cut to 8 words. The check is automatic: it matches digits and units, not meaning, so spot-check the rows that matter. PDF papers are read through pdftotext or pypdf, and a Google Research abstract page is followed to its paper's PDF. A page that could not be fetched marks all its figures NOT FOUND.",
  "",
];
const summary = [];
const missing = [];

for (const t of topics) {
  const counts = { found: 0, "found with different formatting": 0, "NOT FOUND": 0 };
  const rows = [];
  for (const { post, items } of sources(t)) {
    const page = pages.get(post.url);
    const fetched = page.status === 200;
    for (const it of items) {
      const hit = fetched ? check(it.text, page) : { status: "NOT FOUND" };
      counts[hit.status]++;
      const where = !fetched ? `page not fetched (HTTP ${page.status})` : hit.status === "NOT FOUND" ? "-" : headingAt(page.headings, hit.at);
      rows.push(`| ${esc(post.id)} | ${it.where} | ${esc(it.text)} | ${post.url}${archived.has(post.url) ? " (archive copy)" : ""} | ${esc(where)} | ${hit.status} |`);
      if (hit.status === "NOT FOUND") missing.push(`${t.slug} / ${post.id} / ${it.where}: ${it.text}`);
    }
  }
  summary.push(`| ${t.slug} | ${counts.found} | ${counts["found with different formatting"]} | ${counts["NOT FOUND"]} |`);
  lines.push(`## ${t.title}`, "", "| Post | Section | Figure as written | Source URL | Nearest heading in page | Result |", "|---|---|---|---|---|---|", ...rows, "");
}

lines.push(
  "## Summary",
  "",
  "| Topic | Found | Found with different formatting | NOT FOUND |",
  "|---|---|---|---|",
  ...summary,
  "",
);
fs.writeFileSync(OUT, lines.join("\n"));
console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`NOT FOUND: ${missing.length}`);
for (const m of missing) console.log(`  ${m}`);
