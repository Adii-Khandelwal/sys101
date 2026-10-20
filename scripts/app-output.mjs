// Where the build wrote its prerendered pages. Normally <distDir>/server/app; a build that hands its output to a deployment
// adapter (Vercel on Next 16) may leave that folder without pages, so look for the folder that holds about.html. When nothing is
// found, print what is there, so the log shows where the pages went, and return null: the callers then skip with a message
// instead of failing the whole deployment over a layout this script does not know.
import fs from "node:fs";
import path from "node:path";

const MARK = "about.html";
const has = (dir) => fs.existsSync(path.join(dir, MARK));

// Every folder under dir that holds about.html. A stray copy can sit beside the real output, so callers pick the fullest one.
function find(dir, depth) {
  if (depth < 0 || !fs.existsSync(dir)) return [];
  const here = has(dir) ? [dir] : [];
  return here.concat(
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() && e.name !== "node_modules" && e.name !== "cache" ? find(path.join(dir, e.name), depth - 1) : [],
    ),
  );
}

// The folder with the most pages wins: on Vercel the first folder holding about.html held only that one file.
const pages = (dir) => fs.readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(".html")).length;
const fullest = (dirs) => dirs.sort((a, b) => pages(b) - pages(a))[0] ?? null;

function listing(dir, depth) {
  if (depth < 0 || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === "node_modules" || e.name === "cache") return [];
    const p = path.join(dir, e.name);
    return [e.isDirectory() ? `${p}/` : p, ...(e.isDirectory() ? listing(p, depth - 1) : [])];
  });
}

export function appOutput(cwd = process.cwd()) {
  const dist = path.join(cwd, process.env.NEXT_DIST_DIR || ".next");
  const usual = path.join(dist, "server", "app");
  if (has(usual)) return usual;
  const found = fullest([...find(dist, 5), ...find(path.join(cwd, ".vercel", "output"), 6)]);
  if (found) {
    console.log(`Note: the pages are in ${path.relative(cwd, found)}, not ${path.relative(cwd, usual)}.`);
    return found;
  }
  console.error(`No ${MARK} under ${path.relative(cwd, dist)} or .vercel/output. NEXT_ADAPTER_PATH=${process.env.NEXT_ADAPTER_PATH ?? "(unset)"}, VERCEL=${process.env.VERCEL ?? "(unset)"}. Found:`);
  console.error(listing(dist, 3).slice(0, 80).join("\n"));
  return null;
}
