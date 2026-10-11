import { describe, expect, it } from "vitest";
import { checkQuizPositions, getAllTopics } from "./topics";

const q = (correct: number, extra: object = {}) => ({ options: ["a", "b", "c"], correct, why: "Because.", wrong: ["x", "y", "z"], ...extra });

describe("quiz answer positions", () => {
  it("every real topic passes, with no position over half and no run over 2", () => {
    for (const t of getAllTopics().filter((t) => t.lesson)) {
      const at = t.lesson!.quiz.map((x) => x.correct);
      expect(checkQuizPositions(t.lesson!.quiz), t.slug).toEqual([]);
      for (const pos of new Set(at)) expect(at.filter((x) => x === pos).length, `${t.slug} position ${pos}`).toBeLessThanOrEqual(at.length / 2);
      for (let i = 2; i < at.length; i++) expect(at[i] === at[i - 1] && at[i] === at[i - 2], `${t.slug} run at ${i}`).toBe(false);
    }
  });

  it("fails when every correct answer shares a position", () => {
    expect(checkQuizPositions([q(0), q(0), q(0)]).join()).toMatch(/every correct answer is in position 1/);
  });

  it("fails when one position repeats more than 3 times in a row, and allows 3", () => {
    expect(checkQuizPositions([q(1), q(1), q(1), q(2)])).toEqual([]);
    expect(checkQuizPositions([q(1), q(1), q(1), q(1), q(2)]).join()).toMatch(/4 questions in a row/);
  });

  it("fails on a bare option letter in an explanation", () => {
    for (const text of ["The answer is B.", "Not C: it is slower.", "Option A is wrong.", "(B) fails", "B is wrong here."]) {
      expect(checkQuizPositions([q(0), q(1, { why: text })]).join(), text).toMatch(/by letter/);
    }
    expect(checkQuizPositions([q(0), q(1, { why: "A resolver reuses its copy. A B-tree needs a key.", wrong: ["", "", ""] })])).toEqual([]);
  });

  it("requires Neither and All of the above to be last", () => {
    expect(checkQuizPositions([q(0, { options: ["Neither", "b", "c"] }), q(1)]).join()).toMatch(/must be the last/);
    expect(checkQuizPositions([q(0, { options: ["a", "b", "Neither"] }), q(1)])).toEqual([]);
  });
});
