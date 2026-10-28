// Measure diagram label widths in real Chromium with the site's actual fonts and CSS,
// and report any <text> whose rendered box exceeds the <rect> it sits in.
//
// Usage: node scripts/check-diagram-overflow.mjs            (report, exit 1 if any overflow)
//        node scripts/check-diagram-overflow.mjs --json      (machine-readable)
//
// Why a browser: label width depends on the exact font (Libre Caslon / Cabin) and the
// browser's text shaping. getComputedTextLength() gives the true rendered advance width, so we
// are not guessing per-character widths.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const JSON_OUT = process.argv.includes("--json");

const files = [];
for (const dir of ["content/topics", "content/learn"]) {
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".json")) files.push(path.join(dir, f));
}

// Collect every diagram string with a stable location label.
const diagrams = [];
function walk(o, where) {
  if (Array.isArray(o)) return o.forEach((v) => walk(v, where));
  if (o && typeof o === "object") {
    for (const [k, v] of Object.entries(o)) {
      if (k === "diagram" && typeof v === "string") diagrams.push({ where, svg: v });
      else walk(v, where);
    }
  }
}
for (const f of files) walk(JSON.parse(fs.readFileSync(f, "utf8")), f);

// The real diagram CSS (fonts + sizes), mirroring app/globals.css. We load the Google Fonts
// (Libre Caslon Text, Cabin) so measurement matches production, not a system fallback.
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Cabin:wght@400..700&display=swap');
  :root { --font-serif: 'Libre Caslon Text'; --font-sans: 'Cabin'; }
  svg.dg { display:block; width:560px; }
  .dg-label { font-family: var(--font-sans), sans-serif; font-size:15px; }
  .dg-note  { font-family: var(--font-sans), sans-serif; font-size:12px; }
`;

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  // No Chromium available (e.g. CI without `npx playwright install`). Skip rather than fail the
  // build: the check still runs locally and anywhere the browser is installed. Install with
  // `npx playwright install chromium` to enable it here.
  console.warn(`check-diagram-overflow: skipped, Chromium not available (${e.message.split("\n")[0]})`);
  console.warn("Run `npx playwright install chromium` to enable the diagram overflow check.");
  process.exit(0);
}
const page = await browser.newPage();
await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body></body></html>`);
// Wait for the web fonts to be ready so measurements use the real faces.
await page.evaluate(async () => {
  await document.fonts.load("15px Cabin");
  await document.fonts.load("12px Cabin");
  await document.fonts.ready;
});

const overflows = [];
for (const d of diagrams) {
  const result = await page.evaluate((svg) => {
    const host = document.createElement("div");
    host.innerHTML = svg;
    document.body.appendChild(host);
    const el = host.querySelector("svg");
    const texts = [...el.querySelectorAll("text")];
    const rects = [...el.querySelectorAll("rect")].map((r) => ({
      x: parseFloat(r.getAttribute("x")),
      y: parseFloat(r.getAttribute("y")),
      w: parseFloat(r.getAttribute("width")),
      h: parseFloat(r.getAttribute("height")),
    }));
    const out = [];
    for (const t of texts) {
      const label = (t.textContent || "").trim();
      if (!label) continue;
      const len = t.getComputedTextLength(); // true rendered width in user units
      const tx = parseFloat(t.getAttribute("x"));
      const ty = parseFloat(t.getAttribute("y"));
      const anchor = t.getAttribute("text-anchor") || "start";
      // Left/right extent of the text given its anchor.
      let left = tx, right = tx;
      if (anchor === "middle") { left = tx - len / 2; right = tx + len / 2; }
      else if (anchor === "end") { left = tx - len; }
      else { right = tx + len; }
      // The box this label belongs to: a rect that vertically contains the baseline and
      // horizontally contains the anchor x. Labels not inside any rect are free captions.
      const box = rects.find((r) => tx >= r.x - 1 && tx <= r.x + r.w + 1 && ty >= r.y - 1 && ty <= r.y + r.h + 1);
      if (!box) continue;
      const pad = 4; // keep text off the stroke
      if (left < box.x + pad - 0.5 || right > box.x + box.w - pad + 0.5) {
        out.push({ label, len: Math.round(len), boxW: box.w, boxX: box.x, left: Math.round(left), right: Math.round(right) });
      }
    }
    host.remove();
    return out;
  }, d.svg);
  for (const o of result) overflows.push({ where: d.where, ...o });
}

await browser.close();

if (JSON_OUT) {
  console.log(JSON.stringify(overflows, null, 2));
} else {
  for (const o of overflows) {
    console.log(`${o.where}\n  "${o.label}" rendered ${o.len}px, box width ${o.boxW} at x=${o.boxX} (text spans ${o.left}..${o.right}, box ${o.boxX}..${o.boxX + o.boxW})`);
  }
  console.log(`\nOverflowing labels: ${overflows.length}`);
}
process.exit(overflows.length ? 1 : 0);
