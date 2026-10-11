import { describe, expect, it } from "vitest";
import {
  CONCEPT_SECTIONS,
  answer,
  emptyProgress,
  exportFile,
  isTopicRead,
  loadProgress,
  migrate,
  parseProgress,
  quizComplete,
  quizScore,
  retryQuiz,
  markAllDone,
  summary,
  syncRead,
  toggleUnit,
  validateImport,
  type LessonMeta,
  type Progress,
} from "./lessonStore";

const meta: LessonMeta = { slug: "dns", postIds: ["cloudflare-dns-builds-2022", "slack-dnssec-2021"], correct: [1, 3, 1, 1, 1, 1] };

const allConcept = (p: Progress) => CONCEPT_SECTIONS.reduce((s, id) => toggleUnit(s, meta, id), p);
const answerAll = (p: Progress, pick: (i: number) => number) => meta.correct.reduce((s, _, i) => answer(s, "dns", i, pick(i)), p);

describe("derived read flag", () => {
  it("is read only with every concept section, a complete quiz and every post", () => {
    let p = allConcept(emptyProgress());
    expect(isTopicRead(p, meta)).toBe(false);
    p = answerAll(p, () => 0); // all answered, mostly wrong: still complete
    expect(isTopicRead(p, meta)).toBe(false);
    p = toggleUnit(p, meta, meta.postIds[0]);
    expect(isTopicRead(p, meta)).toBe(false);
    p = toggleUnit(p, meta, meta.postIds[1]);
    expect(isTopicRead(p, meta)).toBe(true);
    expect(syncRead(["caching"], p, meta)).toEqual(["caching", "dns"]);
    p = toggleUnit(p, meta, "how");
    expect(isTopicRead(p, meta)).toBe(false);
    expect(syncRead(["caching", "dns"], p, meta)).toEqual(["caching"]);
  });
});

describe("migration from v1 keys", () => {
  it("keeps the concept and every post already marked", () => {
    const p = migrate(JSON.stringify(["dns"]), JSON.stringify(["slack-dnssec-2021"]));
    expect(p.topics.dns.done).toEqual([...CONCEPT_SECTIONS]);
    expect(p.posts).toEqual(["slack-dnssec-2021"]);
  });

  it("prefers stored v2 progress over v1 keys", () => {
    const v2 = toggleUnit(emptyProgress(), meta, "why");
    const store: Record<string, string> = {
      "sys101:progress": JSON.stringify(v2),
      "sys101:posts": JSON.stringify(["slack-dnssec-2021"]),
    };
    expect(loadProgress((k) => store[k] ?? null)).toEqual(v2);
  });
});

describe("corrupt or missing storage", () => {
  it("falls back to empty progress", () => {
    expect(loadProgress(() => null)).toEqual(emptyProgress());
    expect(parseProgress("{not json")).toBeNull();
    expect(parseProgress(JSON.stringify({ version: 1 }))).toBeNull();
    const store: Record<string, string> = { "sys101:progress": "garbage", "sys101:concept": "also garbage", "sys101:posts": "[1, 2]" };
    expect(loadProgress((k) => store[k] ?? null)).toEqual(emptyProgress());
  });

  it("keeps the valid parts of a damaged record", () => {
    const raw = JSON.stringify({ version: 2, posts: ["slack-dnssec-2021", 7], topics: { dns: { done: ["why", null], answers: { 0: 1, x: 2, 1: -1 } } } });
    const p = parseProgress(raw)!;
    expect(p.posts).toEqual(["slack-dnssec-2021"]);
    expect(p.topics.dns).toEqual({ done: ["why"], visited: [], answers: { 0: 1 } });
  });
});

describe("import validation", () => {
  const good = JSON.stringify(exportFile(toggleUnit(emptyProgress(), meta, "why"), ["dns"]));

  it("accepts a sys101 export", () => {
    const r = validateImport(good);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.progress.topics.dns.done).toEqual(["why"]);
  });

  it("rejects anything else with a reason", () => {
    expect(validateImport("nope").ok).toBe(false);
    expect(validateImport(JSON.stringify({ app: "other" })).ok).toBe(false);
    expect(validateImport(JSON.stringify({ ...JSON.parse(good), version: 1 })).ok).toBe(false);
    expect(validateImport(JSON.stringify({ ...JSON.parse(good), progress: "x" })).ok).toBe(false);
    expect(validateImport(JSON.stringify({ ...JSON.parse(good), read: [1] })).ok).toBe(false);
  });
});

describe("quiz scoring and retry", () => {
  it("scores answers, counts complete once all are answered, and retries", () => {
    let p = answer(emptyProgress(), "dns", 0, 1); // right
    p = answer(p, "dns", 1, 0); // wrong
    expect(quizScore(p, meta)).toEqual({ answered: 2, correct: 1, total: 6 });
    expect(quizComplete(p, meta)).toBe(false);
    p = answerAll(p, (i) => meta.correct[i]);
    expect(quizScore(p, meta)).toEqual({ answered: 6, correct: 6, total: 6 });
    expect(quizComplete(p, meta)).toBe(true);
    p = retryQuiz(p, "dns");
    expect(quizScore(p, meta)).toEqual({ answered: 0, correct: 0, total: 6 });
  });
});

describe("progress header text", () => {
  it("says Start, then Continue to the first incomplete unit, then Review", () => {
    let p = emptyProgress();
    expect(summary(p, meta)).toMatchObject({ done: 0, total: 8, action: "Start", target: "why" });
    p = toggleUnit(p, meta, "why");
    expect(summary(p, meta)).toMatchObject({ done: 1, action: "Continue", target: "model" });
    p = answerAll(allConcept(emptyProgress()), () => 0);
    p = toggleUnit(toggleUnit(p, meta, meta.postIds[0]), meta, meta.postIds[1]);
    expect(summary(p, meta)).toMatchObject({ done: 8, action: "Review", target: "why" });
    expect(summary(p, meta).segments.map((s) => s.group)).toEqual([
      "concept", "concept", "concept", "concept", "concept", "quiz", "posts", "posts",
    ]);
  });
});

describe("finish topic", () => {
  it("marks every section and post done, leaving the quiz to be answered", () => {
    let p = markAllDone(emptyProgress(), meta);
    expect(summary(p, meta).done).toBe(7);
    expect(isTopicRead(p, meta)).toBe(false);
    p = answerAll(p, () => 0);
    expect(isTopicRead(p, meta)).toBe(true);
    expect(markAllDone(p, meta)).toEqual(p);
  });
});
