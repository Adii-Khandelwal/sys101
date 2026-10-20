// Builds the Pagefind search index from the pages the built site serves, not from the folders the build wrote them to: Vercel's
// Next 16 build keeps each prerendered page in its own hash folder under .next/server/route-cache, so reading the build output
// found one page and every deployment failed (and, before that guard, shipped an index of one page). So: start the built site,
// fetch every URL in its sitemap, save the HTML, index that folder. Needs a finished `next build` (same NEXT_DIST_DIR).
// A missing or tiny index fails the build: search is a feature of every page.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const fail = (msg) => {
  console.error(`Search index FAILED: ${msg}`);
  process.exitCode = 1;
};

const freePort = () =>
  new Promise((resolve) => {
    const s = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const topics = fs.readdirSync("content/topics").filter((f) => f.endsWith(".json")).length;
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const env = { ...process.env };
delete env.NEXT_ADAPTER_PATH; // serve the plain build output, not through a deployment adapter
const server = spawn("npx", ["next", "start", "-H", "127.0.0.1", "-p", String(port)], { env, stdio: "ignore" });
let exited = false;
server.on("exit", () => (exited = true));
const site = fs.mkdtempSync(path.join(os.tmpdir(), "sys101-search-"));

try {
  let sitemap = "";
  for (let i = 0; i < 120 && !sitemap; i++) {
    if (exited) throw new Error("`next start` exited before it served the site (is there a finished build?).");
    sitemap = await fetch(`${base}/sitemap.xml`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
    if (!sitemap) await new Promise((r) => setTimeout(r, 500));
  }
  if (!sitemap) throw new Error("the built site did not answer within 60 seconds.");

  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const p of paths) {
    const res = await fetch(base + p);
    if (!res.ok) throw new Error(`${p} answered ${res.status}.`);
    const file = path.join(site, p === "/" ? "" : p, "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, await res.text());
  }

  execFileSync("npx", ["pagefind", "--site", site, "--output-path", "public/pagefind"], { stdio: "inherit" });

  // Every topic has a page, plus the glossary, posts, reads, background and the rest; fewer than that means pages were missed.
  const { languages } = JSON.parse(fs.readFileSync("public/pagefind/pagefind-entry.json", "utf8"));
  const pages = Object.values(languages).reduce((n, l) => n + l.page_count, 0);
  if (pages < topics + 5) throw new Error(`only ${pages} pages indexed from ${paths.length} sitemap URLs, expected at least ${topics + 5} (${topics} topics + the site pages).`);
  console.log(`Search index OK: ${pages} pages.`);
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
} finally {
  server.kill();
  fs.rmSync(site, { recursive: true, force: true });
}
