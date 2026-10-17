import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { capstoneProblems, getAllCapstones, type Capstone } from "./capstones";
import { evaluate, formatValue } from "./formula";
import { getAllTopics } from "./topics";

const slugs = getAllTopics().map((t) => t.slug);
const base = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "capstones", "metrics-pipeline.json"), "utf8")) as Capstone;
const problems = (edit: (c: Capstone) => void) => {
  const c = structuredClone(base);
  edit(c);
  return capstoneProblems(c, "metrics-pipeline.json", slugs).join("\n");
};

describe("formula evaluator", () => {
  it("does arithmetic with precedence, unary minus, parentheses and functions", () => {
    expect(evaluate("2 + 3 * 4", {})).toBe(14);
    expect(evaluate("(2 + 3) * -4", {})).toBe(-20);
    expect(evaluate("ceil(a / b) + max(1, a, 2)", { a: 7, b: 2 })).toBe(11);
    expect(evaluate("points * bytes / 1000", { points: 100, bytes: 40 })).toBe(4);
  });
  it("rejects unknown ids, functions, bad syntax and code", () => {
    expect(() => evaluate("x + 1", {})).toThrow(/unknown input/);
    expect(() => evaluate("eval(1)", {})).toThrow(/unknown function/);
    expect(() => evaluate("constructor", {})).toThrow(/unknown input/);
    expect(() => evaluate("constructor(1)", {})).toThrow(/unknown function/);
    expect(() => evaluate("1 +", {})).toThrow();
    expect(() => evaluate("1 2", {})).toThrow();
    expect(() => evaluate("alert(1); 2", {})).toThrow();
    expect(() => evaluate("1 / 0", {})).toThrow(/division by zero/);
  });
  it("formats numbers the same everywhere", () => {
    expect(formatValue(1234567.8)).toBe("1,234,568");
    expect(formatValue(1.239)).toBe("1.24");
    expect(formatValue(NaN)).toBe("n/a");
  });
});

describe("capstone loader", () => {
  it("loads every file in content/capstones", () => {
    expect(getAllCapstones(slugs).map((c) => c.slug)).toContain("metrics-pipeline");
  });
  it("accepts the placeholder", () => {
    expect(problems(() => {})).toBe("");
  });
  it("fails on a missing topic, a bad reference and an empty section", () => {
    expect(problems((c) => (c.topics[0].slug = "no-such-topic"))).toMatch(/not an existing topic/);
    expect(problems((c) => (c.brief.requirements[0].sourceId = "nope"))).toMatch(/not in sources/);
    expect(problems((c) => (c.decisions[0].realChoice.sourceId = "nope"))).toMatch(/not in sources/);
    expect(problems((c) => (c.diagram.failures[0].effects[0].nodeId = "nope"))).toMatch(/unknown node/);
    expect(problems((c) => (c.diagram.nodes[0].topic = "databases"))).toMatch(/not in this capstone's topics/);
    expect(problems((c) => (c.decisions = []))).toMatch(/decisions is missing or empty/);
    expect(problems((c) => (c.sizing.inputs = []))).toMatch(/sizing.inputs/);
    expect(problems((c) => (c.decisions[0].answerIndex = 9))).toMatch(/answerIndex/);
  });
  it("fails on a formula that uses an unknown input or divides by zero in range", () => {
    expect(problems((c) => (c.sizing.outputs[0].formula = "ghost * 2"))).toMatch(/unknown input/);
    expect(problems((c) => (c.sizing.outputs[0].formula = "points_per_min / (retention_hours - 1)"))).toMatch(/division by zero/);
  });
  it("fails on an em dash or an it's-not phrase", () => {
    expect(problems((c) => (c.summary = "A pipeline — with a dash."))).toMatch(/banned phrasing/);
    expect(problems((c) => (c.brief.text = "It's not a queue, it's a log."))).toMatch(/banned phrasing/);
  });
});
