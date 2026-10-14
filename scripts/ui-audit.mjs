// Offline UI check against a running server (BASE_URL, default http://localhost:3000): every sitemap page at 1440 and 390,
// light and dark. Fails on sideways scroll, hover-tooltip sources (SVG <title>, title attributes), a short mono label split over
// lines, a broken company mark, or layout shift. Run by hand; never part of the build. See the verify-ui skill.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const browser = await chromium.launch();
const problems = new Set();

for (const [width, touch] of [[1440, false], [390, true]]) {
  for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: touch, colorScheme });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (window.__cls += e.value))).observe({ type: "layout-shift", buffered: true });
    });
    for (const path of paths) {
      await page.goto(BASE + path, { waitUntil: "networkidle" }).catch(() => {});
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
      const found = await page.evaluate(() => {
        const out = [];
        const de = document.documentElement;
        if (de.scrollWidth > de.clientWidth + 1) out.push(`sideways scroll (${de.scrollWidth} > ${de.clientWidth})`);
        if (document.querySelectorAll("svg title, [title]:not(iframe):not(.theme-toggle)").length) out.push("hover tooltip source (svg <title> or title attribute)");
        for (const el of document.querySelectorAll(".verdict, .mark-done, .read-toggle, .text-button, .label")) {
          if (el.closest("nav, footer")) continue;
          const text = el.textContent.trim();
          const lh = parseFloat(getComputedStyle(el).lineHeight) || 18;
          if (text && text.length <= 40 && el.getClientRects().length > 1 && el.getBoundingClientRect().height > lh * 1.6 && getComputedStyle(el).display.startsWith("inline")) out.push(`label split over lines: "${text}"`);
        }
        const broken = [...document.querySelectorAll("img.company-logo-img")].filter((i) => i.offsetParent !== null && (!i.complete || i.naturalWidth === 0));
        if (broken.length) out.push(`${broken.length} broken company mark(s)`);
        if (window.__cls > 0.02) out.push(`layout shift ${window.__cls.toFixed(3)}`);
        return out;
      });
      for (const f of found) problems.add(`${width} ${colorScheme} ${path}: ${f}`);
    }
    await context.close();
  }
}
await browser.close();
console.log(`${paths.length} pages x 2 widths x 2 themes`);
if (problems.size) {
  console.log([...problems].join("\n"));
  process.exit(1);
}
console.log("UI check passed.");
