import { describe, it, expect } from "vitest";
import { getAllTopics } from "./topics";
import { getAllLearn } from "./learn";
import { readingMinutes, readingLabel, learnReadingMinutes, learnReadingLabel } from "./readingTime";

describe("readingMinutes", () => {
  const topics = getAllTopics();

  it("gives every topic a sensible estimate (between 2 and 40 minutes)", () => {
    for (const t of topics) {
      const m = readingMinutes(t);
      expect(m, `${t.slug} = ${m} min`).toBeGreaterThanOrEqual(2);
      expect(m, `${t.slug} = ${m} min`).toBeLessThanOrEqual(40);
    }
  });

  it("is a whole number of at least 1", () => {
    for (const t of topics) {
      const m = readingMinutes(t);
      expect(Number.isInteger(m)).toBe(true);
      expect(m).toBeGreaterThanOrEqual(1);
    }
  });

  it("counts more words as more time (a longer topic reads longer)", () => {
    // Build two synthetic topics differing only in body length.
    const base = topics[0];
    const short = { ...base, concept: "one two three", posts: [], lesson: undefined, glossary: [], mistakes: [], comparison: undefined };
    const long = { ...short, concept: Array(2000).fill("word").join(" ") };
    expect(readingMinutes(long as typeof base)).toBeGreaterThan(readingMinutes(short as typeof base));
  });

  it("labels as '~N min read'", () => {
    expect(readingLabel(topics[0])).toMatch(/^~\d+ min read$/);
  });
});

describe("learnReadingMinutes", () => {
  const learns = getAllLearn(getAllTopics().map((t) => t.slug));

  it("gives every learn page a sensible estimate (2 to 40 minutes)", () => {
    for (const l of learns) {
      const m = learnReadingMinutes(l);
      expect(m, `${l.slug} = ${m} min`).toBeGreaterThanOrEqual(2);
      expect(m, `${l.slug} = ${m} min`).toBeLessThanOrEqual(40);
    }
  });

  it("labels as '~N min read'", () => {
    expect(learnReadingLabel(learns[0])).toMatch(/^~\d+ min read$/);
  });
});
