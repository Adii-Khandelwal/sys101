import { describe, expect, it } from "vitest";
import { columns, transitiveReduction } from "./graph";
import { formatNumber, topicNumbers, topicOrder } from "./order";
import { getAllTopics } from "./topics";

const topics = getAllTopics();
const ordered = topicOrder(topics);
const numbers = topicNumbers(ordered);

describe("topic reading order", () => {
  it("numbers every topic once, 1 to N", () => {
    expect(ordered).toHaveLength(topics.length);
    expect([...numbers.values()].sort((a, b) => a - b)).toEqual(topics.map((_, i) => i + 1));
  });

  it("puts every topic after all of its prerequisites", () => {
    for (const t of topics) for (const p of t.prerequisites) expect(numbers.get(t.slug)!, `${t.slug} after ${p}`).toBeGreaterThan(numbers.get(p)!);
  });

  it("is the order the map draws, so Map index and Path view agree", () => {
    const edges = topics.flatMap((t) => t.prerequisites.map((p) => ({ from: p, to: t.slug })));
    expect(ordered.map((t) => t.slug)).toEqual(columns(topics, transitiveReduction(edges)).flat().map((t) => t.slug));
  });

  it("is the same on every run (ties keep the alphabetical input order from getAllTopics)", () => {
    expect(topicOrder(getAllTopics()).map((t) => t.slug)).toEqual(ordered.map((t) => t.slug));
  });

  it("formats numbers with two digits", () => {
    expect(formatNumber(3)).toBe("03");
    expect(formatNumber(12)).toBe("12");
  });
});
