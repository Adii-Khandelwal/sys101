import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { allowlistChanged, disallowedPaths, isFork, isNewsPr, isStrict, pathAllowed } from "../scripts/news-guard.mjs";

const root = path.resolve(__dirname, "..");
const f = (filename: string, previous_filename?: string) => ({ filename, ...(previous_filename ? { previous_filename } : {}) });

describe("the news path guard", () => {
  it("allows only news JSON files and the state file", () => {
    expect(pathAllowed("content/news/caching.json")).toBe(true);
    expect(pathAllowed("content/news/sub/dir/x.json")).toBe(true);
    expect(pathAllowed("docs/news-state.json")).toBe(true);
  });
  it("blocks the workflow, scripts, code, content and config", () => {
    for (const p of [
      ".github/workflows/news-pr.yml",
      ".github/CODEOWNERS",
      "scripts/check-news.mjs",
      "scripts/news-guard.mjs",
      "lib/site.ts",
      "package.json",
      "package-lock.json",
      "vitest.config.ts",
      "content/topics/caching.json",
      "content/learn/caching.json",
      "app/page.tsx",
      "docs/news-state.json.bak",
      "docs/whats-new.md",
      "content/news/run.sh",
      "content/news/.hidden.json",
      "content/newsletter/x.json",
      "content/news/../../scripts/x.json",
      "../content/news/x.json",
      "",
    ]) {
      expect(pathAllowed(p), p).toBe(false);
    }
  });
  it("blocks a rename out of, or into, the allowed paths", () => {
    expect(disallowedPaths([f("content/news/a.json", "scripts/check-news.mjs")])).toEqual(["scripts/check-news.mjs"]);
    expect(disallowedPaths([f("scripts/a.mjs", "content/news/a.json")])).toEqual(["scripts/a.mjs"]);
    expect(disallowedPaths([f("content/news/b.json", "content/news/a.json")])).toEqual([]);
  });
  it("holds claude/ branches to the news rules, and a person's branch only when it changes nothing but news files", () => {
    expect(isNewsPr([f("app/page.tsx")], "feature/x")).toBe(false);
    expect(isNewsPr([f("app/page.tsx")], "claude/news-2026-10-12")).toBe(true);
    expect(isNewsPr([f("app/page.tsx")], "claude/other")).toBe(false);
    expect(isNewsPr([f("content/news/a.json"), f("lib/news.ts")], "claude/other")).toBe(true); // then the path guard rejects it
    expect(isNewsPr([f("content/news/a.json")], "feature/x")).toBe(true);
    expect(isNewsPr([f("docs/news-state.json")], "feature/x")).toBe(true);
    // a person's pull request that mixes news data with code (a schema change) is theirs to review
    expect(isNewsPr([f("content/news/a.json"), f("lib/news.ts"), f("scripts/news-rules.mjs")], "feature/x")).toBe(false);
    expect(isNewsPr([], "feature/x")).toBe(false);
    expect(isStrict("claude/anything")).toBe(true);
    expect(isStrict("feature/x")).toBe(false);
  });
  it("notices a changed allowlist but not a changed lastChecked", () => {
    const base = { lastChecked: { caching: "2026-10-01" }, allowedDomains: { caching: [{ host: "valkey.io", publisher: "Valkey project" }] } };
    expect(allowlistChanged(base, { ...base, lastChecked: { caching: "2026-10-12" } })).toBe(false);
    expect(allowlistChanged(base, { ...base, allowedDomains: { caching: [{ host: "valkey.io", publisher: "Valkey project" }, { host: "evil.example", publisher: "X" }] } })).toBe(true);
    expect(allowlistChanged(base, { lastChecked: {} })).toBe(true);
  });
});

describe("the guard command, as the workflow runs it", () => {
  const REPO = "owner/sys101";
  const run = (files: object[], headRef: string, count = files.length, headRepo = REPO) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "guard-"));
    const list = path.join(dir, "files.ndjson");
    const outFile = path.join(dir, "output");
    fs.writeFileSync(list, files.map((x) => JSON.stringify(x)).join("\n"));
    const outputs = () => Object.fromEntries((fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : "").split("\n").filter(Boolean).map((l) => l.split("=")));
    try {
      const out = execFileSync("node", [path.join(root, "scripts/news-guard.mjs"), "paths", list, headRef, String(count), headRepo, REPO], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GITHUB_OUTPUT: outFile } });
      return { code: 0, out, o: outputs() };
    } catch (e) {
      return { code: (e as { status: number }).status, out: String((e as { stderr: Buffer }).stderr), o: outputs() };
    }
  };
  it("passes a routine pull request that changes only news files", () => {
    expect(run([f("content/news/caching.json"), f("docs/news-state.json")], "claude/news-2026-10-12").code).toBe(0);
  });
  it("blocks a claude/ pull request that also changes the workflow, a script or any other file", () => {
    for (const extra of [".github/workflows/news-pr.yml", "scripts/check-news.mjs", "lib/site.ts", "content/topics/dns.json", "package.json"]) {
      const r = run([f("content/news/caching.json"), f(extra)], "claude/news-2026-10-12");
      expect(r.code, extra).toBe(1);
      expect(r.out).toContain(extra);
    }
  });
  it("blocks a claude/news-* pull request that changes only a script, and an incomplete file list", () => {
    expect(run([f("scripts/check-news.mjs")], "claude/news-x").code).toBe(1);
    expect(run([f("content/news/caching.json")], "claude/news-x", 4).code).toBe(1);
    expect(run([], "claude/news-x").code).toBe(1);
  });
  it("leaves an ordinary pull request alone, including a person's that mixes news data with code", () => {
    expect(run([f("app/page.tsx")], "feature/x").code).toBe(0);
    const mixed = run([f("content/news/caching.json"), f("lib/news.ts"), f("scripts/news-rules.mjs")], "feature/x");
    expect(mixed.code).toBe(0);
    expect(mixed.out).toContain("Not a news pull request");
  });
  it("still blocks the same mixed change from a claude/ branch", () => {
    for (const ref of ["claude/news-2026-10-12", "claude/fix-schema"]) {
      const r = run([f("content/news/caching.json"), f("lib/news.ts")], ref);
      expect(r.code, ref).toBe(1);
      expect(r.out).toContain("lib/news.ts");
    }
  });
});

describe("every pull request is checked against the base allowlist only", () => {
  const state = (allowedDomains: unknown, lastChecked: unknown = {}) => ({ lastChecked, allowedDomains });
  const check = (base: unknown, head: unknown) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "state-"));
    fs.writeFileSync(path.join(dir, "base.json"), JSON.stringify(base));
    fs.writeFileSync(path.join(dir, "head.json"), JSON.stringify(head));
    try {
      execFileSync("node", [path.join(root, "scripts/news-guard.mjs"), "state", path.join(dir, "base.json"), path.join(dir, "head.json")], { stdio: ["ignore", "pipe", "pipe"] });
      return 0;
    } catch (e) {
      return (e as { status: number }).status;
    }
  };
  const entry = { host: "valkey.io", pathPrefix: "/blog/", publisher: "Valkey project" };
  const base = state({ caching: [entry] }, { caching: "2026-10-01" });
  it("passes a pull request that only moves lastChecked", () => {
    expect(check(base, state({ caching: [entry] }, { caching: "2026-10-12", dns: "2026-10-12" }))).toBe(0);
  });
  it("fails any pull request that adds, removes, widens or reorders an allowlist entry", () => {
    expect(check(base, state({ caching: [entry, { host: "evil.example", publisher: "X" }] }))).toBe(1);
    expect(check(base, state({ caching: [] }))).toBe(1);
    expect(check(base, state({ caching: [{ ...entry, pathPrefix: "/" }] }))).toBe(1);
    expect(check(base, state({ caching: [{ ...entry, publisher: "Someone" }] }))).toBe(1);
    expect(check(base, state({ caching: [entry], dns: [entry] }))).toBe(1);
    expect(check(base, { lastChecked: {} })).toBe(1);
    const two = state({ caching: [entry, { host: "redis.io", publisher: "Redis" }] });
    expect(check(two, state({ caching: [{ host: "redis.io", publisher: "Redis" }, entry] }))).toBe(1);
  });
  it("does not mind the order of keys inside an entry", () => {
    expect(check(base, state({ caching: [{ publisher: "Valkey project", pathPrefix: "/blog/", host: "valkey.io" }] }))).toBe(0);
  });
  it("is run for every news pull request, not only claude/ branches", () => {
    const yml = fs.readFileSync(path.join(root, ".github/workflows/news-pr.yml"), "utf8");
    const step = yml.slice(yml.indexOf("Take only the news data"), yml.indexOf("rm -rf pr"));
    expect(step).toContain("news-guard.mjs state");
    expect(step).not.toMatch(/STRICT|strict/);
    expect(yml).not.toContain("STRICT");
  });
});

describe("a fork pull request never reaches the network step or auto-merge", () => {
  const yml = fs.readFileSync(path.join(root, ".github/workflows/news-pr.yml"), "utf8");
  const stepWith = (needle: string) => {
    const i = yml.indexOf(needle);
    expect(i, needle).toBeGreaterThan(-1);
    return yml.slice(yml.lastIndexOf("- if:", i), i + needle.length);
  };
  it("recognises a fork, and treats a missing head repository as one", () => {
    expect(isFork("owner/sys101", "owner/sys101")).toBe(false);
    expect(isFork("Owner/Sys101", "owner/sys101")).toBe(false);
    expect(isFork("someone/sys101", "owner/sys101")).toBe(true);
    expect(isFork("", "owner/sys101")).toBe(true);
    expect(isFork(undefined, "owner/sys101")).toBe(true);
  });
  it("passes the path guard for a fork pull request that changes only news files, and marks it a fork", () => {
    const REPO = "owner/sys101";
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fork-"));
    const list = path.join(dir, "files.ndjson");
    const outFile = path.join(dir, "output");
    fs.writeFileSync(list, JSON.stringify({ filename: "content/news/caching.json" }) + "\n" + JSON.stringify({ filename: "docs/news-state.json" }));
    const out = execFileSync("node", [path.join(root, "scripts/news-guard.mjs"), "paths", list, "patch-1", "2", "someone/sys101", REPO], { encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: outFile } });
    expect(out).toContain("News pull request");
    expect(fs.readFileSync(outFile, "utf8").split("\n").filter(Boolean)).toEqual(["news=true", "strict=false", "fork=true"]);
  });
  it("still fails a fork pull request that adds a file outside the news paths from a claude/ branch name", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fork-"));
    const list = path.join(dir, "files.ndjson");
    fs.writeFileSync(list, JSON.stringify({ filename: "content/news/caching.json" }) + "\n" + JSON.stringify({ filename: "scripts/x.mjs" }));
    expect(() => execFileSync("node", [path.join(root, "scripts/news-guard.mjs"), "paths", list, "claude/news-x", "2", "someone/sys101", "owner/sys101"], { stdio: "pipe" })).toThrow();
  });
  it("runs verify:news only when the pull request is not a fork, and says so when it skips", () => {
    expect(stepWith("npm run verify:news")).toContain("steps.guard.outputs.fork != 'true'");
    expect(stepWith('echo "fork PR: network verification skipped, merge manually"')).toContain("steps.guard.outputs.fork == 'true'");
    // nothing else in the job opens URLs: no curl, no fetch, no other verify step
    expect(yml.match(/^\s*run: .*verify[:-]news/gm)).toHaveLength(1);
    expect(yml).not.toMatch(/curl |wget /);
  });
  it("never auto-merges a fork pull request", () => {
    const auto = yml.slice(yml.indexOf("  automerge:"));
    expect(auto).toContain("needs.check.outputs.fork != 'true'");
    expect(auto).toContain("github.event.pull_request.head.repo.full_name == github.repository");
    expect(yml).toContain("fork: ${{ steps.guard.outputs.fork }}");
  });
});

describe("the workflow never runs pull request code", () => {
  const yml = fs.readFileSync(path.join(root, ".github/workflows/news-pr.yml"), "utf8");
  const at = (needle: string) => {
    const i = yml.indexOf(needle);
    expect(i, needle).toBeGreaterThan(-1);
    return i;
  };
  it("triggers on pull_request_target only, and checks the base branch out first", () => {
    expect(yml).toMatch(/^\s*pull_request_target:/m);
    expect(yml).not.toMatch(/^\s*pull_request:/m);
    expect(at("ref: ${{ github.event.pull_request.base.ref }}")).toBeLessThan(at("news-guard.mjs paths"));
  });
  it("puts the pull request in its own directory, after the guard, and deletes it before anything is installed or run", () => {
    expect(at("news-guard.mjs paths")).toBeLessThan(at("path: pr"));
    expect(at("rm -rf pr")).toBeLessThan(at("npm ci"));
    expect(at("path: pr")).toBeLessThan(at("rm -rf pr"));
    for (const m of yml.matchAll(/^\s*(npm|node|npx|bash|sh) .*$/gm)) expect(m[0], m[0]).not.toMatch(/\bpr\/(?!docs\/news-state\.json)/);
    expect(yml).not.toMatch(/working-directory:\s*pr|cd pr\b|\.\/pr\//);
  });
  it("is read-only except the auto-merge job, which checks nothing out", () => {
    const top = yml.slice(0, yml.indexOf("jobs:"));
    expect(top).toMatch(/permissions:\s*\n\s+contents: read\s*\n/);
    expect(yml.match(/contents: write/g)).toHaveLength(1);
    expect(yml.match(/pull-requests: write/g)).toHaveLength(1);
    expect(yml.slice(at("automerge:"))).not.toContain("actions/checkout");
    expect(yml.slice(at("automerge:"))).toContain("startsWith(github.head_ref, 'claude/')");
    expect(yml.slice(at("automerge:"))).toContain("vars.NEWS_AUTOMERGE == 'true'");
  });
  it("has CODEOWNERS for everything that changes what runs or what the site teaches", () => {
    const owners = fs.readFileSync(path.join(root, ".github/CODEOWNERS"), "utf8");
    for (const p of ["/.github/**", "/scripts/**", "/lib/**", "/package.json", "/package-lock.json", "/vitest.config.ts", "/content/topics/**", "/content/learn/**"]) {
      expect(owners, p).toMatch(new RegExp(`^${p.replace(/[*.]/g, "\\$&")}\\s+@\\S+`, "m"));
    }
    expect(owners).not.toMatch(/^\/content\/news|^\/docs\/news-state/m);
  });
});
