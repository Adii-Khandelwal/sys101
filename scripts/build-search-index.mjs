// Builds the Pagefind search index from the prerendered pages (see app-output.mjs for where they are).
import { execFileSync } from "node:child_process";
import { appOutput } from "./app-output.mjs";

const site = appOutput();
if (site) execFileSync("npx", ["pagefind", "--site", site, "--output-path", "public/pagefind"], { stdio: "inherit" });
else console.log("Search index SKIPPED: the prerendered pages were not found (see the listing above), so this deployment has no search index.");
