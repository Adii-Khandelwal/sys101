// Offline support. Pages are network-first (fresh when online, last seen copy when not);
// hashed build files are cache-first. A warm-up copies the whole site after the first visit.
const PAGES = "sys101-pages-v1";
const STATIC = "sys101-static-v1";
const NETWORK_TIMEOUT_MS = 4000;
const ASSET = /(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\\\s)(]+|\/logos\/[^"'\\\s)(]+/g;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  const keep = new Set([PAGES, STATIC]);
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
const isStatic = (url) => url.pathname.startsWith("/_next/static/");
// Pages share one entry per path; Next's data (RSC) requests differ by ?_rsc, so they keep it.
const pageKey = (req, url) => (req.mode === "navigate" ? url.origin + url.pathname : req.url);

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/_vercel/")) return;
  e.respondWith(isStatic(url) ? cacheFirst(req) : networkFirst(req, url));
});

async function cacheFirst(req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req, url) {
  const cache = await caches.open(PAGES);
  const key = pageKey(req, url);
  const hit = await cache.match(key, { ignoreVary: true });
  const network = fetch(req).then((res) => {
    // A redirected response cannot answer a navigation, so it is not stored.
    if (res.ok && !res.redirected) cache.put(key, res.clone());
    return res;
  });
  // Only give up on a slow network when there is a saved copy to show instead.
  try {
    return await (hit ? withTimeout(network, NETWORK_TIMEOUT_MS) : network);
  } catch {
    return hit || Response.error();
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const STAMP = "/__warmed";
let warming = false;
self.addEventListener("message", (e) => {
  if (e.data === "warm" && !warming) e.waitUntil(warmIfDue().finally(() => (warming = false)));
});

/** At most once a day; the time is kept in the cache itself, so nothing lands in localStorage. */
async function warmIfDue() {
  warming = true;
  const pages = await caches.open(PAGES);
  const last = await pages.match(STAMP);
  if (last && Date.now() - Number(await last.text()) < DAY_MS) return;
  if (await warm()) await pages.put(STAMP, new Response(String(Date.now())));
}

/** Fetch every page from the sitemap, then every build file those pages name, then drop build files no page names. */
async function warm() {
  const pages = await caches.open(PAGES);
  const statics = await caches.open(STATIC);
  const sitemapRes = await fetch("/sitemap.xml");
  if (!sitemapRes.ok) return false; // a bad answer would look like a one-page site and prune every other page's files
  const sitemap = await sitemapRes.text();
  const paths = new Set(["/data", ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)]);
  const wanted = new Set();
  let complete = true;
  const grab = (text) => {
    for (const m of text.matchAll(ASSET)) wanted.add(m[0].startsWith("/logos/") || m[0].startsWith("/_next/") ? m[0] : "/_next/" + m[0]);
  };

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (!res.ok || res.redirected) throw new Error(path);
      await pages.put(new URL(path, location.origin).href, res.clone());
      grab(await res.text());
    } catch {
      complete = false;
    }
  }
  // Stylesheets name the fonts, so read them too.
  for (const path of [...wanted].filter((p) => p.endsWith(".css"))) {
    try {
      grab(await (await fetch(path)).text());
    } catch {
      complete = false;
    }
  }
  for (const path of wanted) {
    if (await statics.match(path)) continue;
    try {
      const res = await fetch(path);
      if (res.ok) await statics.put(path, res);
    } catch {
      complete = false;
    }
  }
  if (!complete) return false;
  // Next's data requests (?_rsc=...) are saved as they happen and never expire otherwise.
  for (const req of await pages.keys()) if (new URL(req.url).search) await pages.delete(req);
  for (const req of await statics.keys()) {
    const p = new URL(req.url).pathname;
    if (!wanted.has(p) && !wanted.has(decodeURI(p))) await statics.delete(req);
  }
  return true;
}
