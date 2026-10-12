// The path guard for news pull requests. It runs from the base branch's copy in .github/workflows/news-pr.yml
// (pull_request_target), so a pull request can never change the code that judges it.
//
//   node scripts/news-guard.mjs paths <files.ndjson> <headRef> <changedFiles>
//       files.ndjson: one {"filename","previous_filename"?} per line, from the GitHub API.
//       Writes news=true|false and strict=true|false to $GITHUB_OUTPUT. Exits 1 when a news pull request changes
//       anything but content/news/**/*.json and docs/news-state.json (see isNewsPr for what counts as a news pull request).
//   node scripts/news-guard.mjs state <base-state.json> <head-state.json>
//       Exits 1 when allowedDomains differs: a routine pull request may never widen what it is checked against.
import fs from "node:fs";

const NEWS_JSON = /^content\/news\/(?:[A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const STATE = "docs/news-state.json";

/** May a pull request that touches the news files change this path? Only the news JSON files and the state file. */
export const pathAllowed = (p) => typeof p === "string" && !p.split("/").includes("..") && (p === STATE || NEWS_JSON.test(p));

/** Every path a change touches: the new name and, for a rename, the old one. */
export const touchedPaths = (files) => files.flatMap((f) => [f.filename, f.previous_filename].filter(Boolean));

export const disallowedPaths = (files) => touchedPaths(files).filter((p) => !pathAllowed(p));

/** Routine branches (claude/*) are the only ones that can be merged automatically, so they get the strict rules. */
export const isStrict = (headRef) => headRef.startsWith("claude/");

/**
 * Is this a news pull request that the checks and the path guard apply to?
 * - A claude/ branch: yes when it is named claude/news-* or touches a news path. The path guard then rejects anything
 *   beyond the news files, so a routine pull request can never carry other changes.
 * - Any other branch (a person's): only when every changed file is a news file. A person's pull request that mixes news
 *   data with code (a schema change, say) is reviewed by that person and is not a news pull request; it can never be
 *   merged automatically, and the Vercel build still runs check-news on it.
 */
export function isNewsPr(files, headRef) {
  const touched = touchedPaths(files);
  if (isStrict(headRef)) return headRef.startsWith("claude/news-") || touched.some((p) => p === STATE || p.startsWith("content/news/"));
  return touched.length > 0 && touched.every(pathAllowed);
}

export const allowlistChanged = (base, head) => JSON.stringify(base.allowedDomains ?? null) !== JSON.stringify(head.allowedDomains ?? null);

function main(argv) {
  const [mode, ...args] = argv;
  if (mode === "paths") {
    const [file, headRef = "", changed = ""] = args;
    const files = fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    // The API lists at most 3000 files; a count that does not match means a list we cannot trust.
    if (changed !== "" && Number(changed) !== files.length) throw new Error(`the pull request changes ${changed} files but the API listed ${files.length}`);
    const news = isNewsPr(files, headRef);
    const out = process.env.GITHUB_OUTPUT;
    if (out) fs.appendFileSync(out, `news=${news}\nstrict=${isStrict(headRef)}\n`);
    if (!news) return console.log("Not a news pull request: nothing to check.");
    if (!files.length) throw new Error("a news pull request with no changes");
    const bad = disallowedPaths(files);
    if (bad.length) throw new Error(`a news pull request may change only content/news/**/*.json and ${STATE}. It also changes:\n${bad.join("\n")}`);
    return console.log(`News pull request touching ${files.length} allowed file${files.length === 1 ? "" : "s"}.`);
  }
  if (mode === "state") {
    const [baseFile, headFile] = args;
    const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
    if (allowlistChanged(read(baseFile), read(headFile))) throw new Error("allowedDomains differs from the base branch. Only a person changes it, in a pull request that is not a claude/ branch.");
    return console.log("allowedDomains unchanged.");
  }
  throw new Error("usage: news-guard.mjs paths <files.ndjson> <headRef> <changedFiles> | state <base.json> <head.json>");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(`Guard failed: ${e.message}`);
    process.exit(1);
  }
}
