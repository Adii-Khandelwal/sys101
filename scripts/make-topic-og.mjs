// Draws one social image per topic (public/og/<slug>.png, 1200x630): the title in the Atlas print look (ink with a
// second-ink overprint copy), the group badge and the site mark. Run by hand after a topic is added or retitled:
// `node scripts/make-topic-og.mjs http://localhost:3000 [slug ...]` against a running site, so the real Libre Caslon
// and Cabin are used. Colours come from the page's tokens through var(). The PNGs are committed (palette-reduced,
// under 120 KB each); nothing runs at build or runtime, and it is not run for learn pages.
import { chromium } from "playwright";
import sharp from "sharp";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3000";
const only = process.argv.slice(3);
const MAX_BYTES = 120 * 1024;
const MARK = `<svg height="64" viewBox="6.5 7 19.5 18" aria-hidden="true"><path d="M10.5,11 L22,16 M10.5,21 L22,16" fill="none" style="stroke:var(--ink)" stroke-width="1.6"/><circle cx="10.5" cy="11" r="3" style="fill:var(--paper);stroke:var(--ink)" stroke-width="1.6"/><circle cx="10.5" cy="21" r="3" style="fill:var(--paper);stroke:var(--ink)" stroke-width="1.6"/><circle cx="22" cy="16" r="3.8" style="fill:var(--ink2)"/></svg>`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const topics = readdirSync("content/topics")
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(`content/topics/${f}`, "utf8")))
  .filter((t) => !only.length || only.includes(t.slug));

mkdirSync("public/og", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, colorScheme: "light" });
const page = await ctx.newPage();
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));

for (const t of topics) {
  const size = t.title.length > 34 ? 84 : t.title.length > 20 ? 108 : 132;
  const title = esc(t.title);
  await page.evaluate((h) => {
    document.body.innerHTML = h;
    document.body.style.cssText = "margin:0;background:var(--paper);overflow:hidden";
  }, `<div style="box-sizing:border-box;width:1200px;height:630px;padding:72px 96px;display:flex;flex-direction:column;justify-content:space-between;color:var(--ink)">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <span style="padding:2px 18px;border:2px solid var(--ink);font-family:var(--font-sans);font-size:28px;font-weight:700;line-height:1.5">${esc(t.group ?? "Concept")}</span>
      <div style="display:flex;align-items:center;gap:20px">${MARK}<span style="font-family:var(--font-serif);font-size:56px;line-height:1;letter-spacing:-0.02em">sys101</span></div>
    </div>
    <h1 class="overprint" data-text="${title}" style="--offset:4px;margin:0;font-family:var(--font-serif);font-weight:400;font-size:${size}px;line-height:1.05;letter-spacing:-0.02em;max-width:1000px">${title}</h1>
    <p style="margin:0;font-family:var(--font-sans);font-size:26px">System design, taught through how real companies built it</p></div>`);
  await page.evaluate(() => document.fonts.ready);
  const raw = await page.screenshot();
  const out = await sharp(raw).png({ palette: true, colors: 64, effort: 10 }).toBuffer();
  if (out.length > MAX_BYTES) throw new Error(`${t.slug}: ${out.length} bytes is over the ${MAX_BYTES} budget`);
  writeFileSync(`public/og/${t.slug}.png`, out);
  console.log(t.slug, out.length);
}
await browser.close();
