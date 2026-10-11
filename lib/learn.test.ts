import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkLearn, citations, getAllLearn, type Learn } from "./learn";

const dir = path.resolve(__dirname, "../content/topics");
const slugs = fs.readdirSync(dir).map((f) => f.replace(/\.json$/, ""));
const dns = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../content/learn/dns.json"), "utf8")) as Learn;
const clone = () => structuredClone(dns);

describe("learn pages", () => {
  it("the DNS page passes every rule", () => {
    expect(checkLearn(dns, slugs)).toEqual([]);
    expect(getAllLearn(slugs).map((l) => l.slug)).toContain("dns");
  });

  it("reads inline citations", () => {
    expect(citations("Labels are short [[rfc1035]] and names too [[rfc1035]].")).toEqual(["rfc1035", "rfc1035"]);
  });

  it("fails an empty stage", () => {
    const l = clone();
    l.stages[0].body = [""];
    expect(checkLearn(l, slugs).join()).toMatch(/Basics\) is empty/);
  });

  it("fails a stage with no official written source", () => {
    const l = clone();
    l.stages[2].reading = [];
    expect(checkLearn(l, slugs).join()).toMatch(/no official written source/);
  });

  it("fails an unknown source id, in text or in Try it", () => {
    const l = clone();
    l.stages[0].body.push("A claim [[made-up]].");
    l.tryIt.commands[0].source = "nope";
    const problems = checkLearn(l, slugs).join();
    expect(problems).toMatch(/unknown source id "made-up"/);
    expect(problems).toMatch(/unknown source id "nope"/);
  });

  it("fails a source missing publisher, kind, year or verifiedOn", () => {
    for (const f of ["publisher", "kind", "year", "verifiedOn"] as const) {
      const l = clone();
      (l.sources[0] as Record<string, unknown>)[f] = "";
      expect(checkLearn(l, slugs).join()).toMatch(new RegExp(`missing ${f}`));
    }
  });

  it("fails a video without channel, length or year", () => {
    for (const f of ["channel", "length", "year"] as const) {
      const l = clone();
      const v = l.sources.find((s) => s.kind === "video") as Record<string, unknown>;
      v[f] = "";
      expect(checkLearn(l, slugs).join()).toMatch(new RegExp(`video needs its ${f}`));
    }
  });
});
