// Writes docs/verification-log.md: every figure in each post digest (numbers table, problem,
// walkthrough, failures, takeaways) checked against the raw source page, so it can be spot-checked.
//
// Run: npm run verify:figures        (needs the network; never part of the build)
// Pages that block curl are read from the Internet Archive, then (last) from headless Chromium via Playwright.
// Figures the script cannot match by itself (a lone digit, or a number written as a word) are listed as
// "HAND CHECK" until someone has read the source and recorded the verdict in docs/hand-checks.json.
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

const WORD_NUMBERS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, hundred: 100, half: 0.5 };
const WORD_RE = Object.keys(WORD_NUMBERS).join("|");
const BIG = "million|billion|thousand|trillion|quadrillion|k|m|b|t";

/**
 * Figures the matcher above cannot judge alone: a lone digit with no unit ("3 stateful nodes") and a number
 * written as a word ("three hours"). Each is a number and the word after it; the script tries the other way
 * of writing it ("3" or "three") and, failing that, lists it for a person to read against the source.
 */
function handChecksIn(text) {
  const out = new Map();
  const add = (m, num, noun) => out.set(m[0].trim(), { text: m[0].trim(), num, noun });
  for (const m of text.matchAll(new RegExp(`(?<![\\d.,$@=\\-/])\\b(\\d)\\b(?![\\d,.]\\d)(?!\\s*(?:%|x\\b|×|${BIG}\\b|ms\\b|µs\\b|s\\b|seconds?\\b|minutes?\\b|hours?\\b|days?\\b|GB\\b|TB\\b|MB\\b|KB\\b))\\s+([A-Za-z][\\w-]*)`, "g"))) add(m, Number(m[1]), m[2]);
  for (const m of text.matchAll(new RegExp(`\\b(${WORD_RE})\\b(?:[ -]thirds?|s)?\\s+(?:(?:the|of|a|more)\\s+)?([A-Za-z][\\w-]*)`, "gi"))) add(m, WORD_NUMBERS[m[1].toLowerCase()], m[2]);
  return [...out.values()];
}

/** The same number written the other way ("three" for "3") followed by the same noun, anywhere in the page. */
function handAuto(item, page) {
  const stem = item.noun.toLowerCase().replace(/(ies|es|s)$/, "").slice(0, 5);
  if (item.num === 0.5) return /\bhalf\b|\b50 ?%/i.test(page.text);
  const word = Object.keys(WORD_NUMBERS).find((k) => WORD_NUMBERS[k] === item.num);
  const forms = [String(item.num), word].filter(Boolean).join("|");
  return new RegExp(`\\b(?:${forms})\\b[\\s-]+(?:[A-Za-z-]+\\s+){0,2}?${stem}`, "i").test(page.text);
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

/** The page as a headless browser sees it, or null when Playwright or Chromium is not installed. */
async function browserHtml(url) {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ userAgent: UA });
      const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(3000);
      return res && res.status() === 200 ? await page.content() : null;
    } finally {
      await browser.close();
    }
  } catch {
    return null;
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
  // "over 10 million" in our text is "10+ million" in the post, and "three hours" is "three hour" there:
  // a leading qualifier is optional, a plus after the digits is allowed, and a final plural s is optional.
  const QUALIFIER = /^(?:over|more than|about|around|up to|nearly|almost|at least|roughly)\s+/i;
  const pattern = (f) => f.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/(\d)\s+/g, "$1\\+?\\s+").replace(/\s+/g, "\\s+").replace(/([a-z]{3,})s$/i, "$1s?");
  const re = new RegExp(`(?:${pattern(fig)})|(?:${pattern(fig.replace(QUALIFIER, ""))})`, "i");
  const exact = re.exec(page.text);
  if (exact) return { status: "found", at: exact.index };
  const p = parseFigure(fig);
  if (!p) return { status: "NOT FOUND" };
  const target = value(p.numStr, p.unit);
  // A small bare number ("3") is found in almost any text, so it cannot vouch for itself: it goes to a person.
  if (!p.unit && target < 10) return { status: "HAND", num: target, noun: (fig.split(p.numStr)[1] ?? "").trim().split(/\s+/)[0] ?? "" };
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
    const t = d.tradeoffs ?? {};
    const prose = [
      ["problem", d.problem],
      ["constraints", d.constraints],
      ["walkthrough", (d.walkthrough ?? []).map((w) => `${w.step}. ${w.explanation}`).join(" ")],
      ["meaning", (d.numbers ?? []).map((n) => n.meaning).join(" ")],
      ["tradeoffs", [t.chosen, t.rejected, t.why].filter(Boolean).join(" ")],
      ["failures", d.failures],
      ["takeaways", d.takeaways],
    ];
    for (const [where, text] of prose) {
      if (!text) continue;
      for (const f of figuresIn(text)) items.push({ where, text: f });
      for (const f of handChecksIn(text)) items.push({ where, hand: true, ...f, ctx: text.split(/(?<=[.!?])\s+/).find((x) => x.includes(f.text)) ?? text });
    }
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
const browsed = new Set();
await pool(urls, 4, async (u) => {
  let r = await fetchRaw(u);
  if (r.status !== 200) {
    // Blocked or gone: read the Internet Archive's copies of the same address, and say so in the log.
    // Ask the CDX API for snapshots the archive served as 200 text/html, so we fetch the real article
    // rather than a year-stub that Wayback may resolve to a bot-challenge page. Snapshots still differ,
    // so the text of every copy that loads is searched.
    const stamps = [];
    const cdx = await fetchRaw(
      `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(u)}` +
        `&output=text&filter=statuscode:200&filter=mimetype:text/html&fl=timestamp&collapse=digest&limit=5`,
    );
    if (cdx.status === 200) {
      for (const line of cdx.body.toString("utf8").trim().split("\n")) {
        const ts = line.trim();
        if (/^\d{14}$/.test(ts)) stamps.push(ts);
      }
    }
    // Fall back to year stubs if the CDX API gave nothing.
    if (!stamps.length) stamps.push("2024", "2021", "2025");
    const copies = [];
    for (const ts of stamps) {
      const copy = await fetchRaw(`https://web.archive.org/web/${ts}id_/${u}`);
      if (copy.status === 200 && !isPdf(copy.body)) copies.push(copy.body.toString("utf8"));
    }
    // Last resort: a real browser, which sites that refuse curl (and may not be archived) still serve.
    const live = await browserHtml(u);
    if (live) {
      browsed.add(u);
      copies.unshift(live);
    }
    if (copies.length) {
      if (copies.length > (live ? 1 : 0)) archived.add(u);
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

// VF_DUMP=<dir> writes each page's text to that folder, one file per source, for reading by hand.
if (process.env.VF_DUMP) {
  fs.mkdirSync(process.env.VF_DUMP, { recursive: true });
  for (const [u, pg] of pages) fs.writeFileSync(path.join(process.env.VF_DUMP, u.replace(/[^a-z0-9]+/gi, "_").slice(0, 120) + ".txt"), pg.text);
}

const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const lines = [
  "# Verification log",
  "",
  `Generated by \`npm run verify:figures\` on ${new Date().toISOString().slice(0, 10)}. Docs only: not published, not in the sitemap, not part of the build.`,
  "",
  "Pages marked \"(archive copy)\" were blocked to curl and were read from the Internet Archive's copy of the same address; \"(browser copy)\" means a headless browser read the live page, because curl was refused. Each figure from a digest's numbers table, problem, constraints, walkthrough, trade-offs, failures and takeaways is looked up in the page text. A lone digit with no unit, or a number written as a word, cannot be matched by a script: those rows say HAND CHECK until a person has read the source and recorded the verdict in docs/hand-checks.json (\"hand-checked\"). The last column is the nearest heading above the match, cut to 8 words. The check is automatic: it matches digits and units, not meaning, so spot-check the rows that matter. PDF papers are read through pdftotext or pypdf, and a Google Research abstract page is followed to its paper's PDF. A page that could not be fetched marks all its figures NOT FOUND.",
  "",
];
const summary = [];
const missing = [];
const toCheck = [];
// Verdicts a person recorded after reading the source: { "<post id>|<figure>": { verdict, source } }.
const HAND = path.join(process.cwd(), "docs", "hand-checks.json");
const handChecked = fs.existsSync(HAND) ? JSON.parse(fs.readFileSync(HAND, "utf8")) : {};

for (const t of topics) {
  const counts = { found: 0, "found with different formatting": 0, "NOT FOUND": 0, "hand-checked": 0, "HAND CHECK": 0, "found (other spelling)": 0 };
  const rows = [];
  for (const { post, items } of sources(t)) {
    const page = pages.get(post.url);
    const fetched = page.status === 200;
    for (const it of items) {
      const key = `${post.id}|${it.text}`;
      let hit = it.hand ? { status: "HAND", num: it.num, noun: it.noun } : fetched ? check(it.text, page) : { status: "NOT FOUND" };
      if (hit.status === "HAND") {
        // A number a script cannot judge: the other spelling next to the same noun, else a person's recorded verdict, else a task.
        hit = fetched && hit.noun && handAuto(hit, page) ? { status: "found (other spelling)" } : handChecked[key] ? { status: "hand-checked" } : { status: "HAND CHECK" };
      }
      counts[hit.status]++;
      if (hit.status === "HAND CHECK") toCheck.push(`${t.slug} / ${post.id} / ${it.where}: "${it.text}" in: ${it.ctx}`);
      const where = !fetched ? `page not fetched (HTTP ${page.status})` : hit.status === "NOT FOUND" ? "-" : headingAt(page.headings, hit.at);
      rows.push(`| ${esc(post.id)} | ${it.where} | ${esc(it.text)} | ${post.url}${archived.has(post.url) ? " (archive copy)" : ""}${browsed.has(post.url) ? " (browser copy)" : ""} | ${esc(where)} | ${hit.status} |`);
      if (hit.status === "NOT FOUND") missing.push(`${t.slug} / ${post.id} / ${it.where}: ${it.text}`);
    }
  }
  summary.push(`| ${t.slug} | ${counts.found} | ${counts["found with different formatting"]} | ${counts["NOT FOUND"]} | ${counts["found (other spelling)"]} | ${counts["hand-checked"]} | ${counts["HAND CHECK"]} |`);
  lines.push(`## ${t.title}`, "", "| Post | Section | Figure as written | Source URL | Nearest heading in page | Result |", "|---|---|---|---|---|---|", ...rows, "");
}

lines.push(
  "## Summary",
  "",
  "| Topic | Found | Found with different formatting | NOT FOUND | Small number found as \"3\" or \"three\" | Hand-checked | HAND CHECK still needed |",
  "|---|---|---|---|---|---|---|",
  ...summary,
  "",
);
fs.writeFileSync(OUT, lines.join("\n"));
console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`NOT FOUND: ${missing.length}`);
for (const m of missing) console.log(`  ${m}`);
console.log(`HAND CHECK still needed: ${toCheck.length}`);
for (const m of toCheck) console.log(`  ${m}`);
