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
  markVisited,
  toggleUnit,
  validateImport,
  mergeProgress,
  diffSummary,
  deriveRead,
  resetAll,
  resetTopic,
  exportName,
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

describe("read marks from before lesson tracking", () => {
  it("are kept until something is tracked on the topic", () => {
    const visited = markVisited(emptyProgress(), meta.slug, "why");
    expect(syncRead([meta.slug], visited, meta)).toEqual([meta.slug]);
    const started = toggleUnit(visited, meta, "why");
    expect(syncRead([meta.slug], started, meta)).toEqual([]);
  });
});

describe("your data: export, import, merge, reset", () => {
  const lb: LessonMeta = { slug: "load-balancing", postIds: ["uber-dynamic-subsetting-2022", "dropbox-robinhood-2024"], correct: [0, 0, 1, 0, 1, 0] };
  const metas = [meta, lb];
  const known = { slugs: ["dns", "load-balancing"], postIds: [...meta.postIds, ...lb.postIds] };
  const started = answer(toggleUnit(toggleUnit(emptyProgress(), meta, "why"), meta, "cloudflare-dns-builds-2022"), "dns", 0, 1);

  it("round-trips an export through import unchanged, with a dated file name", () => {
    const file = JSON.stringify(exportFile(started, ["dns"], new Date("2026-10-11T12:00:00Z"), { dns: "2026-10-11T12:00:00.000Z" }));
    const r = validateImport(file, known);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.progress).toEqual(started);
    expect(r.read).toEqual(["dns"]);
    expect(r.updated).toEqual({ dns: "2026-10-11T12:00:00.000Z" });
    expect(r.ignored).toBe(0);
    expect(exportName(new Date(2026, 9, 11))).toBe("sys101-progress-2026-10-11.json");
  });

  it("merge keeps the more complete value; replace uses only the file", () => {
    const here = answer(toggleUnit(emptyProgress(), lb, "why"), "dns", 0, 2);
    const merged = mergeProgress(here, started);
    expect(merged.topics.dns.done).toEqual(["why"]);
    expect(merged.topics.dns.answers).toEqual({ 0: 2 }); // the answer already given here is kept
    expect(merged.topics["load-balancing"].done).toEqual(["why"]);
    expect(merged.posts).toEqual(["cloudflare-dns-builds-2022"]);
    expect(diffSummary(here, merged, metas)).toEqual({ topics: 1, items: 2 });
    expect(diffSummary(here, started, metas)).toEqual({ topics: 2, items: 4 });
  });

  it("rejects invalid and wrong-version files whole, and ignores unknown topics with a count", () => {
    const good = JSON.parse(JSON.stringify(exportFile(started, ["dns"])));
    expect(validateImport(JSON.stringify({ ...good, version: 3 }), known).ok).toBe(false);
    const badType = structuredClone(good);
    badType.progress.topics.dns.answers = { 0: "one" };
    expect(validateImport(JSON.stringify(badType), known).ok).toBe(false);
    const badList = structuredClone(good);
    badList.progress.topics.dns.done = "why";
    expect(validateImport(JSON.stringify(badList), known).ok).toBe(false);
    const extra = structuredClone(good);
    extra.progress.topics.kafka = { done: ["why"], visited: [], answers: {} };
    extra.progress.posts.push("someone-elses-post");
    const r = validateImport(JSON.stringify(extra), known);
    expect(r.ok && r.ignored).toBe(2);
    expect(r.ok && Object.keys(r.progress.topics)).toEqual(["dns"]);
  });

  it("resets one topic or everything", () => {
    const both = toggleUnit(started, lb, "why");
    const one = resetTopic(both, meta);
    expect(one.topics.dns).toBeUndefined();
    expect(one.posts).toEqual([]);
    expect(one.topics["load-balancing"].done).toEqual(["why"]);
    expect(resetAll()).toEqual({ progress: emptyProgress(), read: [] });
  });

  it("derives read flags after an import", () => {
    let full = CONCEPT_SECTIONS.reduce((p, s) => toggleUnit(p, meta, s), emptyProgress());
    full = meta.postIds.reduce((p, id) => toggleUnit(p, meta, id), full);
    full = meta.correct.reduce((p, c, i) => answer(p, "dns", i, c), full);
    expect(deriveRead([], full, metas)).toEqual(["dns"]);
  });

  it("treats corrupt storage as unreadable rather than throwing", () => {
    expect(parseProgress("{not json")).toBeNull();
    expect(parseProgress(JSON.stringify({ version: 2, topics: "x" }))).toEqual({ version: 2, topics: {}, posts: [] });
    expect(loadProgress((k) => (k === "sys101:progress" ? "{broken" : null))).toEqual(emptyProgress());
  });
});
