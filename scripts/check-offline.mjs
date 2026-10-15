// Loads the site online, waits for the service worker's warm-up, goes offline and opens every sitemap page, then follows a link.
// Needs a production server (the worker registers only there). Offline, never in the build.
// Run: BASE_URL=http://localhost:3100 npm run check:offline   (BASE_URL defaults to http://localhost:3000)
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const problems = [];

const sitemap = await (await fetch(BASE + "/sitemap.xml")).text();
const paths = [...new Set(["/data", ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)])];

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const stamped = () => page.evaluate(async () => !!(await (await caches.open("sys101-pages-v1")).match("/__warmed")));
for (let i = 0; i < 60 && !(await stamped().catch(() => false)); i++) await page.waitForTimeout(1000);
if (!(await stamped())) problems.push("the warm-up did not finish in 60s (is this a production server?)");

await ctx.setOffline(true);
for (const path of paths) {
  const res = await page.goto(BASE + path).catch(() => null);
  if (!res || res.status() !== 200 || !(await page.locator("h1").count())) problems.push(`offline: ${path} did not load`);
}
await page.goto(BASE + "/");
await page.click('a[href="/about"]');
await page.waitForURL("**/about", { timeout: 5000 }).catch(() => problems.push("offline: following a link to /about failed"));
await browser.close();

if (problems.length) {
  console.error("Offline check failed:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log(`Offline check passed: ${paths.length} pages and a link.`);
