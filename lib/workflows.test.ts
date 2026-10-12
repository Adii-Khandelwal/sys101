import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import { describe, expect, it } from "vitest";

const dir = path.resolve(__dirname, "../.github/workflows");
const files = fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));

type Step = { name?: string; if?: string; run?: string; uses?: string };
type Workflow = { name?: string; on: Record<string, unknown>; jobs: Record<string, { "runs-on": string; steps: Step[] }> };

// A workflow that does not parse never runs, and GitHub reports it only as a failed "push" run with no jobs, so a
// pull request shows no checks at all. Parse every workflow here so that cannot reach main unnoticed.
describe("workflow files", () => {
  for (const f of files) {
    const doc = parseDocument(fs.readFileSync(path.join(dir, f), "utf8"));

    it(`${f} is valid YAML`, () => {
      expect(doc.errors.map((e) => e.message)).toEqual([]);
    });

    it(`${f} has a trigger, jobs, runners and steps that each run or use something`, () => {
      const w = doc.toJS() as Workflow;
      expect(Object.keys(w.on ?? {}).length).toBeGreaterThan(0);
      for (const [id, job] of Object.entries(w.jobs)) {
        expect(job["runs-on"], id).toBeTruthy();
        for (const [i, step] of (job.steps ?? []).entries()) {
          expect(Boolean(step.run) !== Boolean(step.uses), `${f} ${id} step ${i + 1} needs exactly one of run or uses`).toBe(true);
          if (step.if !== undefined) expect(typeof step.if, `${f} ${id} step ${i + 1} if`).toBe("string");
        }
      }
    });
  }

  it("news-pr.yml says what the fork step prints, exactly", () => {
    const w = parseDocument(fs.readFileSync(path.join(dir, "news-pr.yml"), "utf8")).toJS() as Workflow;
    const step = w.jobs.check.steps.find((s) => s.name?.startsWith("Fork pull request"));
    expect(step?.run?.trim()).toBe('echo "fork PR: network verification skipped, merge manually"');
    expect(step?.if).toContain("steps.guard.outputs.fork == 'true'");
    const verify = w.jobs.check.steps.find((s) => s.run === "npm run verify:news");
    expect(verify?.if).toContain("steps.guard.outputs.fork != 'true'");
    expect(Object.keys(w.on)).toEqual(["pull_request_target"]);
  });
});
