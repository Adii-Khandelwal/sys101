// Offline pipeline for company marks (.claude/rules/logos.md). The site never fetches a logo at runtime.
//   node scripts/make-logos.mjs              rebuild public/logos and lib/logoFiles.ts from content/logos.json
//   node scripts/make-logos.mjs add "Name" [domain]
//                                            find a mark for a new company, add it to content/logos.json, then rebuild.
//                                            Sources, in order: svgl (official brand SVGs), Simple Icons, then Hunter by domain.
import fs from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const sharp = createRequire(import.meta.url)("sharp");
const CFG = "content/logos.json";
const SVGL_DATA = "https://raw.githubusercontent.com/pheralb/svgl/main/src/data/svgs.ts";
const SVGL = "https://raw.githubusercontent.com/pheralb/svgl/main/static/library/";
const cfg = JSON.parse(fs.readFileSync(CFG, "utf8"));
const SI = `https://cdn.jsdelivr.net/npm/simple-icons@${cfg.simpleIcons.version}/`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r;
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// ── Finding a mark for a new company ──────────────────────────────────────────
async function findSource(name, domain) {
  const ts = await (await get(SVGL_DATA)).text();
  for (const block of ts.split(/\n  \{\n/)) {
    const title = block.match(/title:\s*["']([^"']+)/)?.[1];
    if (!title || norm(title) !== norm(name)) continue;
    const route = block.match(/route:\s*(\{[^}]*\}|["'][^"']+["'])/s)?.[1];
    const file = (s) => s.match(/["']\/library\/([^"']+)["']/)?.[1];
    if (route?.startsWith("{")) {
      const light = file(route.match(/light:\s*["'][^"']+["']/)?.[0] ?? "");
      const dark = file(route.match(/dark:\s*["'][^"']+["']/)?.[0] ?? "");
      if (light) return { svgl: light, ...(dark && { svglDark: dark }) };
    } else if (route) return { svgl: file(route) };
  }
  const data = await (await get(SI + "data/simple-icons.json")).json();
  const hit = data.find((i) => norm(i.title) === norm(name) || (i.aliases?.aka ?? []).some((a) => norm(a) === norm(name)));
  if (hit) {
    const slugOf = hit.slug ?? hit.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if ((await fetch(`${SI}icons/${slugOf}.svg`)).ok) return { simpleIcons: slugOf };
  }
  if (domain) return { hunter: domain };
  throw new Error(`No svgl or Simple Icons mark for "${name}". Pass its domain to use Hunter: node scripts/make-logos.mjs add "${name}" example.com, or list it under withoutLogo with a reason.`);
}

if (process.argv[2] === "add") {
  const [, , , name, domain] = process.argv;
  if (!name) throw new Error('usage: node scripts/make-logos.mjs add "Company Name" [domain.com]');
  if (cfg.logos[name]) console.log(`${name} already has a mark.`);
  else {
    cfg.logos[name] = await findSource(name, domain);
    delete cfg.withoutLogo[name];
    cfg.logos = Object.fromEntries(Object.entries(cfg.logos).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2) + "\n");
    console.log(`${name}: ${JSON.stringify(cfg.logos[name])}`);
  }
}

// ── Building the files ────────────────────────────────────────────────────────
fs.mkdirSync("public/logos", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
// Simple Icons draw every mark in a 24x24 square, so a wide wordmark floats in empty space. Crop the viewBox to the drawn shape
// (measured in a real browser) so the file carries the mark's true proportions.
const bbox = async (d) => {
  await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path id="p" d="${d}"/></svg>`);
  return page.evaluate(() => { const b = document.getElementById("p").getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
};
const viewBoxSize = (svg) => {
  const v = svg.match(/viewBox="([\d.\s-]+)"/)?.[1].trim().split(/\s+/).map(Number);
  if (!v || v.length !== 4) throw new Error("no viewBox");
  return { w: v[2], h: v[3] };
};
const r2 = (n) => Math.round(n * 100) / 100;
const siData = await (await get(SI + "data/simple-icons.json")).json();

const out = {};
for (const [name, src] of Object.entries(cfg.logos)) {
  const base = slug(name);
  const entry = {};
  if (src.svgl) {
    for (const [suffix, f] of [["", src.svgl], ["-dark", src.svglDark]].filter(([, f]) => f)) {
      const svg = await (await get(SVGL + f)).text();
      fs.writeFileSync(`public/logos/${base}${suffix}.svg`, svg);
      Object.assign(entry, suffix ? { dark: `/logos/${base}-dark.svg` } : { src: `/logos/${base}.svg`, ...viewBoxSize(svg) });
    }
    entry.source = "svgl";
  } else if (src.simpleIcons) {
    const svg = await (await get(`${SI}icons/${src.simpleIcons}.svg`)).text();
    const d = svg.match(/<path d="([^"]+)"/)?.[1];
    const hex = siData.find((i) => (i.slug ?? i.title.toLowerCase().replace(/[^a-z0-9]/g, "")) === src.simpleIcons)?.hex;
    if (!d || !hex) throw new Error(`${src.simpleIcons}: no path or brand colour`);
    if (luminance(`#${hex}`) < 0.08) throw new Error(`${src.simpleIcons}: #${hex} is too dark for a dark page; use svgl or add a dark variant`);
    const b = await bbox(d);
    fs.writeFileSync(`public/logos/${base}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r2(b.x)} ${r2(b.y)} ${r2(b.w)} ${r2(b.h)}" fill="#${hex}"><path d="${d}"/></svg>\n`);
    Object.assign(entry, { src: `/logos/${base}.svg`, w: r2(b.w), h: r2(b.h), source: "simple-icons" });
  } else if (src.hunter) {
    // Raster: trim the empty border, keep the proportions, 2x the slot, WebP. It keeps its own background, so look at it on both themes.
    const img = Buffer.from(await (await get(`https://logos.hunter.io/${src.hunter}`)).arrayBuffer());
    const { data, info } = await sharp(img).trim({ threshold: 12 }).resize({ width: 128, height: 128, fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer({ resolveWithObject: true });
    fs.writeFileSync(`public/logos/${base}.webp`, data);
    Object.assign(entry, { src: `/logos/${base}.webp`, w: info.width, h: info.height, source: "hunter" });
  } else throw new Error(`${name}: needs svgl, simpleIcons or hunter in ${CFG}`);
  out[name] = entry;
}
await browser.close();
const body = Object.entries(out).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n");
fs.writeFileSync(
  "lib/logoFiles.ts",
  `// Generated by scripts/make-logos.mjs from content/logos.json. Do not edit.\nexport type LogoFile = { src: string; dark?: string; w: number; h: number; source: "svgl" | "simple-icons" | "hunter" };\nexport const LOGO_FILES: Record<string, LogoFile> = {\n${body}\n};\n`,
);
console.log(`wrote ${Object.keys(out).length} logos`);
