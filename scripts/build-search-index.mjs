// Builds the Pagefind search index from the prerendered pages (see app-output.mjs for where they are).
// A missing or tiny index fails the build: search is a feature of every page, and a silent skip once shipped an index of one page.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { appOutput } from "./app-output.mjs";

const fail = (msg) => {
  console.error(`Search index FAILED: ${msg}`);
  process.exit(1);
};

const site = appOutput();
if (!site) fail("the prerendered pages were not found (see the listing above), so this deployment would have no search.");
execFileSync("npx", ["pagefind", "--site", site, "--output-path", "public/pagefind"], { stdio: "inherit" });

// Every topic has a page, plus the glossary, posts, reads, background and the rest; fewer than that means the wrong folder was indexed.
const topics = fs.readdirSync("content/topics").filter((f) => f.endsWith(".json")).length;
const { languages } = JSON.parse(fs.readFileSync("public/pagefind/pagefind-entry.json", "utf8"));
const pages = Object.values(languages).reduce((n, l) => n + l.page_count, 0);
if (pages < topics + 5) fail(`only ${pages} pages indexed from ${site}, expected at least ${topics + 5} (${topics} topics + the site pages).`);
console.log(`Search index OK: ${pages} pages.`);
