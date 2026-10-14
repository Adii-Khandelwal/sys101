// Draws the static social image (public/og.png, 1200x630) and the touch icon (public/apple-touch-icon.png, 180x180).
// Run by hand when the wordmark or tagline changes: `node scripts/make-og.mjs http://localhost:3000` against a running
// site, so the real Newsreader and IBM Plex Mono are used. The PNGs are committed; nothing runs at build or runtime.
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3000";
const MARK = (size, stroke) => `<svg height="${size}" viewBox="6.5 7 19.5 18" aria-hidden="true"><path d="M10.5,11 L22,16 M10.5,21 L22,16" fill="none" stroke="var(--ink-soft)" stroke-width="${stroke}"/><circle cx="10.5" cy="11" r="3" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width="${stroke}"/><circle cx="10.5" cy="21" r="3" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width="${stroke}"/><circle cx="22" cy="16" r="3.8" fill="var(--accent)"/></svg>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, colorScheme: "light" });
const page = await ctx.newPage();
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));

const draw = async (html) => {
  await page.evaluate((h) => {
    document.body.innerHTML = h;
    document.body.style.cssText = "margin:0;background:var(--paper);overflow:hidden";
  }, html);
  await page.evaluate(() => document.fonts.ready);
};

await draw(`<div style="box-sizing:border-box;width:1200px;height:630px;padding:84px 96px;display:flex;flex-direction:column;justify-content:space-between;color:var(--ink)">
  <div style="display:flex;align-items:center;gap:28px">${MARK(96, 1.6)}<span style="font-family:var(--font-serif);font-weight:500;font-size:96px;line-height:1;letter-spacing:-0.02em">sys101</span></div>
  <div>
    <p style="margin:0 0 28px;font-family:var(--font-serif);font-weight:500;font-size:68px;line-height:1.1;letter-spacing:-0.015em;max-width:960px">Learn system design from what real companies built, broke and fixed.</p>
    <p style="margin:0;font-family:var(--font-mono);font-size:22px;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-soft)">Each topic taught through how real engineering teams built it</p>
  </div></div>`);
await page.screenshot({ path: "public/og.png" });

await page.setViewportSize({ width: 180, height: 180 });
await draw(`<div style="width:180px;height:180px;display:flex;align-items:center;justify-content:center">${MARK(120, 1.8)}</div>`);
await page.screenshot({ path: "public/apple-touch-icon.png" });
await browser.close();
