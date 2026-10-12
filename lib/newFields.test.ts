import { describe, expect, it } from "vitest";
import { checkReasons, checkSummary, type Topic } from "./topics";

const point = "A cache keeps a copy of popular data close to the reader so most requests skip the slow source.";
const digit = { value: "150x", meaning: "faster builds" };
const topic = (extra: Partial<Topic>) =>
  ({
    slug: "t",
    title: "T",
    concept: "A cache holds 3 copies.",
    prerequisites: ["a", "b"],
    posts: [{ id: "p1", digest: { numbers: [digit] } }],
    ...extra,
  }) as unknown as Topic;
const summary = (points: string[], figures: { postId: string; row: number }[] = []) => topic({ summary: { points, figures } });

describe("checkSummary", () => {
  it("accepts 3 good points and a real figure", () => {
    expect(checkSummary(summary([point, point + " Two.", point + " Three."], [{ postId: "p1", row: 0 }]))).toEqual([]);
  });
  it("rejects wrong counts and lengths", () => {
    expect(checkSummary(summary([point, point]))).toContain("summary.points needs 3 to 5 sentences");
    expect(checkSummary(summary([point, point, "Too short."]))).toEqual(expect.arrayContaining([expect.stringContaining("needs 8 to 28")]));
    expect(checkSummary(summary(Array(3).fill(point), Array(4).fill({ postId: "p1", row: 0 })))).toContain("summary.figures needs 0 to 3 entries");
  });
  it("rejects figure references that do not exist", () => {
    const three = [point, point, point];
    expect(checkSummary(summary(three, [{ postId: "nope", row: 0 }]))[0]).toContain('no post with id "nope"');
    expect(checkSummary(summary(three, [{ postId: "p1", row: 5 }]))[0]).toContain("no numbers row 5");
  });
  it("allows digits only when they appear in the topic", () => {
    const withDigit = (n: string) => summary([`A cache holds ${n} copies of the data so most reads never reach the source.`, point, point]);
    expect(checkSummary(withDigit("3"))).toEqual([]);
    expect(checkSummary(withDigit("7"))[0]).toContain('"7" does not appear');
  });
  it("rejects banned phrasing", () => {
    const bad = ["It's not a database, it's a copy of one, kept close to the people reading from it.", point, point];
    expect(checkSummary(summary(bad))[0]).toContain("banned phrasing");
    expect(checkSummary(summary([point.replace(" so ", " — so "), point, point]))[0]).toContain("banned phrasing");
  });
});

describe("checkReasons", () => {
  const reason = "Replicas make sense only once you know what a single database already promises you.";
  it("needs one reason for every prerequisite and none for others", () => {
    expect(checkReasons(topic({ prerequisiteReasons: { a: reason, b: reason } }))).toEqual([]);
    expect(checkReasons(topic({ prerequisiteReasons: { a: reason } }))).toContain('prerequisiteReasons: no reason for "b"');
    expect(checkReasons(topic({ prerequisiteReasons: { a: reason, b: reason, c: reason } }))).toContain("prerequisiteReasons.c: not a prerequisite of this topic");
  });
  it("rejects digits, bad length and missing full stop", () => {
    const out = checkReasons(topic({ prerequisiteReasons: { a: "Needs 2 things.", b: reason.slice(0, -1) } }));
    expect(out.join("\n")).toMatch(/no digits/);
    expect(out.join("\n")).toMatch(/needs 8 to 30/);
    expect(out.join("\n")).toMatch(/full stop/);
  });
});
