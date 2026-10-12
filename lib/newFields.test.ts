import { describe, expect, it } from "vitest";
import { checkReasons, checkSummary, figureLine, postDateLabel, getAllTopics, postWhen, type Topic } from "./topics";

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
const label = "builds got 150x faster in the example";
const fig = { postId: "p1", row: 0, label };
const summary = (points: string[], figures: { postId: string; row: number; label: string }[] = []) => topic({ summary: { points, figures } });

describe("checkSummary", () => {
  it("accepts 3 good points and a real figure", () => {
    expect(checkSummary(summary([point, point + " Two.", point + " Three."], [fig]))).toEqual([]);
  });
  it("rejects wrong counts and lengths", () => {
    expect(checkSummary(summary([point, point]))).toContain("summary.points needs 3 to 5 sentences");
    expect(checkSummary(summary([point, point, "Too short."]))).toEqual(expect.arrayContaining([expect.stringContaining("needs 8 to 28")]));
    expect(checkSummary(summary(Array(3).fill(point), Array(4).fill(fig)))).toContain("summary.figures needs 0 to 3 entries");
  });
  it("rejects figure references that do not exist", () => {
    const three = [point, point, point];
    expect(checkSummary(summary(three, [{ ...fig, postId: "nope" }]))[0]).toContain('no post with id "nope"');
    expect(checkSummary(summary(three, [{ ...fig, row: 5 }]))[0]).toContain("no numbers row 5");
  });
  it("holds figure labels to their row", () => {
    const three = [point, point, point];
    const out = (l: string) => checkSummary(summary(three, [{ ...fig, label: l }])).join("\n");
    expect(out("faster builds")).toMatch(/label is 2 words/);
    expect(out("builds got 900x faster in the example")).toMatch(/"900" is not in the referenced row/);
    expect(out("builds got much faster in the example here")).toMatch(/must contain the figure's value/);
    expect(out("builds got 150x faster, the post's headline result")).toMatch(/editorial/);
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

describe("summary figure lines", () => {
  const post = (meaning: string) => ({ company: "Acme", published: "2022-06-20", digest: { numbers: [{ value: "1x", meaning }] } }) as never;
  it("marks the company's own headline or target figures", () => {
    expect(figureLine(post("Median latency, the post's headline"), { row: 0, label: "x" })).toMatch(/\(company's own figure\)$/);
    expect(figureLine(post("A target for latency"), { row: 0, label: "x" })).toMatch(/own figure/);
    expect(figureLine(post("Measured latency"), { row: 0, label: "x" })).toBe("X, Acme June 2022");
  });
  it("shows every figure's date exactly as the post header does, and as the year in Original posts", () => {
    for (const t of getAllTopics()) {
      for (const f of t.summary?.figures ?? []) {
        const p = t.posts.find((x) => x.id === f.postId)!;
        expect(figureLine(p, f), `${t.slug} ${f.postId}`).toContain(` ${p.company} ${postWhen(p, "month")}`);
        expect(postDateLabel(p)).toBe(postWhen(p, "month"));
        // Original posts shows the year form: the same string for undated sources, the year of the header date otherwise.
        const year = postWhen(p, "year");
        expect(postDateLabel(p).endsWith(year) || postDateLabel(p) === year, `${f.postId}`).toBe(true);
      }
    }
  });
});
