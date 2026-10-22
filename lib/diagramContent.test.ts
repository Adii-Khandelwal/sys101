import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkChart, checkStepper, getAllTopics } from "./topics";

const svg = (id: string, inner: string, vb = "0 0 560 60") => `<svg viewBox="${vb}" role="img" aria-labelledby="${id}-t" class="dg"><title id="${id}-t">A chart</title>${inner}</svg>`;
const bar = (w: number, label: string) => `<rect x="190" y="12" width="${w}" height="16" class="dg-box"/><text x="${200 + w}" y="24" class="dg-label">${label}</text>`;
const numbers = [{ value: "23% vs 46%", meaning: "slack" }, { value: "4/9", meaning: "chance" }];

describe("checkChart", () => {
  it("accepts proportional bars with figures from the numbers", () => {
    expect(checkChart(svg("c", bar(100, "23%") + bar(200, "46%")), numbers)).toEqual([]);
    expect(checkChart(svg("c", bar(100, "4/9") + bar(150, "2/3")), [...numbers, { value: "2/3", meaning: "x" }])).toEqual([]);
  });
  it("rejects a figure the numbers do not state", () => {
    expect(checkChart(svg("c", bar(100, "23%") + bar(200, "47%")), numbers).join()).toContain("47");
  });
  it("rejects bars that are not in proportion", () => {
    expect(checkChart(svg("c", bar(100, "23%") + bar(120, "46%")), numbers).join()).toContain("proportion");
  });
});

describe("checkStepper", () => {
  const frame = (n: number, vb = "0 0 560 60") => ({ caption: `Step ${n}`, diagram: svg(`f${n}`, `<rect x="1" y="1" width="9" height="9" class="dg-box"/>`, vb) });
  it("accepts 3 to 6 frames of one size", () => {
    expect(checkStepper({ frames: [frame(1), frame(2), frame(3)] })).toEqual([]);
  });
  it.each([
    ["two frames", { frames: [frame(1), frame(2)] }],
    ["a different size", { frames: [frame(1), frame(2), frame(3, "0 0 560 80")] }],
    ["a repeated caption", { frames: [frame(1), frame(2), { ...frame(3), caption: "Step 1" }] }],
  ])("rejects %s", (_n, s) => expect(checkStepper(s).length).toBeGreaterThan(0));
});

describe("diagram ids across the content", () => {
  // Pages such as /glossary and /background show many diagrams at once, so an id must name one diagram anywhere.
  it("never repeat", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    const scan = (file: string, text: string) => {
      for (const [, id] of text.replace(/\\"/g, '"').matchAll(/\sid="(dg-[^"]+)"/g)) {
        if (seen.has(id) && seen.get(id) !== file) dupes.push(`${id} in ${seen.get(id)} and ${file}`);
        seen.set(id, file);
      }
    };
    for (const dir of ["topics", "learn", "background", "capstones"]) {
      for (const f of fs.readdirSync(path.join(process.cwd(), "content", dir))) scan(`${dir}/${f}`, fs.readFileSync(path.join(process.cwd(), "content", dir, f), "utf8"));
    }
    expect(dupes).toEqual([]);
    expect(getAllTopics().length).toBeGreaterThan(0);
  });
});
