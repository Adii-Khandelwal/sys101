// Checks the built HTML for the SEO rules in CLAUDE.md and fails the build on any miss:
//   - every indexable page has a unique title and description, within length
//   - exactly one <h1>, and headings never skip a level
//   - an og:image and a summary_large_image twitter card
//   - exactly one canonical link, absolute, with no query string
//   - no noindex on indexable pages; /data and the 404 page are noindex
//   - the sitemap lists every indexable page and nothing else
//   - every JSON-LD block parses and names a schema.org type, and none is FAQPage
//   - raster images have alt, width, and height; SVGs have role="img" and a name
//   - page content is in the HTML itself, not in a hidden Suspense chunk that needs JavaScript
//
// Runs after `next build` (see "postbuild" in package.json). Reads only local files.

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const APP = path.join(process.cwd(), process.env.NEXT_DIST_DIR || ".next", "server", "app");
const NOINDEX = new Set(["/data", "/_not-found"]);

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(full);
    return e.name.endsWith(".html") ? [full] : [];
  });
}

const toRoute = (file) => {
  const rel = path.relative(APP, file).replace(/\.html$/, "").split(path.sep).join("/");
  return rel === "index" ? "/" : `/${rel}`;
};

const problems = [];
const titles = new Map();
const descriptions = new Map();
const indexable = [];

for (const file of htmlFiles(APP)) {
  const route = toRoute(file);
  const $ = cheerio.load(fs.readFileSync(file, "utf8"));
  const fail = (msg) => problems.push(`${route}: ${msg}`);
  const noindex = /noindex/i.test($('meta[name="robots"]').attr("content") ?? "");

  if (NOINDEX.has(route)) {
    if (!noindex) fail("must be noindex");
  } else {
    indexable.push(route);
    if (noindex) fail("indexable page has noindex");

    const title = $("head > title").text();
    const description = $('meta[name="description"]').attr("content") ?? "";
    if (!title) fail("missing <title>");
    if (title.length >= 60) fail(`title is ${title.length} characters, must be under 60`);
    if (!description) fail("missing meta description");
    if (description.length >= 155) fail(`description is ${description.length} characters, must be under 155`);
    if (/(…|\.\.\.)\s*$/.test(description)) fail("description ends in an ellipsis; end it at a sentence or clause boundary");
    if (!/[.!?]$/.test(description)) fail("description must end with a sentence-ending mark");
    if (description.trim().split(/\s+/).length < 8) fail("description is under 8 words; write a full sentence");
    if (!/\.$/.test(description)) fail("description must end with a period");
    if (titles.has(title)) fail(`title also used by ${titles.get(title)}`);
    if (descriptions.has(description)) fail(`description also used by ${descriptions.get(description)}`);
    titles.set(title, route);
    descriptions.set(description, route);

    if (!/^https:\/\/.+\/og\.png$/.test($('meta[property="og:image"]').attr("content") ?? "")) fail("missing og:image (/og.png)");
    if ($('meta[name="twitter:card"]').attr("content") !== "summary_large_image") fail("twitter:card must be summary_large_image");
    const canonical = $('link[rel="canonical"]');
    if (canonical.length !== 1) fail(`has ${canonical.length} canonical links, needs exactly 1`);
    const href = canonical.attr("href") ?? "";
    if (!/^https:\/\//.test(href) || href.includes("?")) fail(`canonical "${href}" must be absolute https with no query string`);
    else if (new URL(href).pathname.replace(/\/$/, "") !== route.replace(/\/$/, "")) fail(`canonical "${href}" does not match the page`);
  }

  if ($('div[hidden][id^="S:"]').length) fail("content is streamed hidden and needs JavaScript to show (a loading.tsx or Suspense boundary around the page?)");

  const h1 = $("h1").length;
  if (h1 !== 1) fail(`has ${h1} <h1> elements, needs exactly 1`);
  let last = 0;
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = Number(el.tagName[1]);
    if (last && level > last + 1) fail(`heading skips from h${last} to h${level} ("${$(el).text().slice(0, 40)}")`);
    last = level;
  });

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      if (data["@context"] !== "https://schema.org" || !data["@type"]) fail("JSON-LD needs @context https://schema.org and @type");
      if (data["@type"] === "FAQPage") fail("FAQ schema is not allowed");
      if (data["@type"] === "BreadcrumbList") {
        data.itemListElement.forEach((item, i) => {
          if (item.position !== i + 1 || !item.name || !/^https:\/\//.test(item.item)) fail(`breadcrumb item ${i + 1} is incomplete`);
        });
      }
    } catch {
      fail("JSON-LD does not parse");
    }
  });

  $("img").each((_, el) => {
    const img = $(el);
    if (img.attr("alt") === undefined || !img.attr("width") || !img.attr("height")) fail(`<img src="${img.attr("src")}"> needs alt, width, and height`);
  });
  $("svg").each((_, el) => {
    const svg = $(el);
    if (svg.attr("aria-hidden") === "true") return;
    const named = svg.attr("aria-label") || svg.attr("aria-labelledby") || svg.children("title").length > 0;
    if (svg.attr("role") !== "img" || !named) fail('an <svg> needs role="img" and an accessible name, or aria-hidden');
  });
}

// Sitemap: every indexable page, no noindex page, no duplicates.
const sitemapFile = path.join(APP, "sitemap.xml.body");
if (!fs.existsSync(sitemapFile)) problems.push("sitemap.xml was not built");
else {
  const listed = [...fs.readFileSync(sitemapFile, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => new URL(m[1]).pathname.replace(/(.)\/$/, "$1") || "/",
  );
  for (const route of indexable) if (!listed.includes(route)) problems.push(`sitemap is missing ${route}`);
  for (const route of listed) if (!indexable.includes(route)) problems.push(`sitemap lists ${route}, which is not an indexable page`);
  if (new Set(listed).size !== listed.length) problems.push("sitemap lists a page twice");
  // The sitemap must also match the content files, so a topic or learn file can never be left out.
  const slugsIn = (dir) => {
    const d = path.join(process.cwd(), "content", dir);
    return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")) : [];
  };
  for (const slug of slugsIn("topics")) if (!listed.includes(`/topic/${slug}`)) problems.push(`sitemap is missing /topic/${slug}, which has a file in content/topics`);
  for (const slug of slugsIn("learn")) if (!listed.includes(`/topic/${slug}/learn`)) problems.push(`sitemap is missing /topic/${slug}/learn, which has a file in content/learn`);
  if (/<lastmod>\s*<\/lastmod>/.test(fs.readFileSync(sitemapFile, "utf8"))) problems.push("sitemap has an empty lastmod");
}

const robotsFile = path.join(APP, "robots.txt.body");
if (!fs.existsSync(robotsFile)) problems.push("robots.txt was not built");
else {
  const robots = fs.readFileSync(robotsFile, "utf8");
  if (/^Disallow:\s*\S/m.test(robots)) problems.push("robots.txt blocks a path");
  if (!/^Sitemap:\s*https:\/\/\S+\/sitemap\.xml$/m.test(robots)) problems.push("robots.txt does not point to the sitemap");
}

if (problems.length) {
  console.error(`SEO check failed:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`SEO check passed: ${indexable.length} indexable pages, all in the sitemap.`);
