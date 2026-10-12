import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { allowlistChanged, disallowedPaths, isNewsPr, isStrict, pathAllowed } from "../scripts/news-guard.mjs";

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
  it("treats a claude/news-* branch or any news path as a news pull request", () => {
    expect(isNewsPr([f("app/page.tsx")], "feature/x")).toBe(false);
    expect(isNewsPr([f("app/page.tsx")], "claude/news-2026-10-12")).toBe(true);
    expect(isNewsPr([f("content/news/a.json")], "feature/x")).toBe(true);
    expect(isNewsPr([f("docs/news-state.json")], "feature/x")).toBe(true);
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
  const run = (files: object[], headRef: string, count = files.length) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "guard-"));
    const list = path.join(dir, "files.ndjson");
    fs.writeFileSync(list, files.map((x) => JSON.stringify(x)).join("\n"));
    try {
      const out = execFileSync("node", [path.join(root, "scripts/news-guard.mjs"), "paths", list, headRef, String(count)], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      return { code: 0, out };
    } catch (e) {
      return { code: (e as { status: number }).status, out: String((e as { stderr: Buffer }).stderr) };
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
  it("leaves an ordinary pull request alone", () => {
    expect(run([f("app/page.tsx")], "feature/x").code).toBe(0);
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
