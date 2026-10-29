import { optionId } from "./quizIds";
import { describe, expect, it } from "vitest";
import {
  CONCEPT_SECTIONS,
  answer,
  emptyProgress,
  exportFile,
  halfOf,
  isTopicRead,
  loadProgress,
  migrate,
  parseProgress,
  quizComplete,
  quizScore,
  retryQuiz,
  markAllDone,
  unmarkAllDone,
  summary,
  syncRead,
  markVisited,
  toggleUnit,
  MAX_IMPORT_CHARS,
  validateImport,
  mergeProgress,
  diffSummary,
  deriveRead,
  planImport,
  resetAll,
  resetTopic,
  exportName,
  migrateAnswers,
  type LessonMeta,
  type Progress,
} from "./lessonStore";

const meta: LessonMeta = { slug: "dns", postIds: ["cloudflare-dns-builds-2022", "slack-dnssec-2021"], correct: ["c0", "c1", "c2", "c3", "c4", "c5"] };

const allConcept = (p: Progress) => CONCEPT_SECTIONS.reduce((s, id) => toggleUnit(s, meta, id), p);
const answerAll = (p: Progress, pick: (i: number) => string) => meta.correct.reduce((s, _, i) => answer(s, "dns", i, pick(i)), p);

describe("derived read flag", () => {
  it("is read only with every concept section, a complete quiz and every post", () => {
    let p = allConcept(emptyProgress());
    expect(isTopicRead(p, meta)).toBe(false);
    p = answerAll(p, () => "x"); // all answered, mostly wrong: still complete
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
    // v2 stored a position; it is upgraded to the id of the option that was in that position.
    expect(p.topics.dns).toEqual({ done: ["why"], visited: [], answers: { 0: optionId("When its cached copy's TTL runs out and it asks again") } });
  });
});

describe("stored progress", () => {
  it("ignores a __proto__ key instead of setting the prototype of the topics object", () => {
    const raw = '{"version":2,"topics":{"__proto__":{"done":["why"]},"dns":{"done":["why"]}},"posts":[]}';
    const p = parseProgress(raw);
    expect(p).not.toBeNull();
    expect(Object.getPrototypeOf(p!.topics)).toBe(Object.prototype);
    expect(Object.keys(p!.topics)).toEqual(["dns"]);
  });
});

describe("import validation", () => {
  const good = JSON.stringify(exportFile(toggleUnit(emptyProgress(), meta, "why"), ["dns"]));

  it("accepts a sys101 export", () => {
    const r = validateImport(good);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.progress.topics.dns.done).toEqual(["why"]);
  });

  it("drops a __proto__ topic even when no known list is given", () => {
    const file = JSON.parse(good);
    const dns = JSON.stringify(file.progress.topics.dns);
    file.progress.topics = JSON.parse(`{"__proto__":${dns},"dns":${dns}}`);
    const r = validateImport(JSON.stringify(file));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.getPrototypeOf(r.progress.topics)).toBe(Object.prototype);
      expect(Object.keys(r.progress.topics)).toEqual(["dns"]);
    }
  });

  it("rejects a file too large to be an export before parsing it", () => {
    const r = validateImport(" ".repeat(MAX_IMPORT_CHARS + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/too large/);
  });

  it("rejects anything else with a reason", () => {
    expect(validateImport("nope").ok).toBe(false);
    expect(validateImport(JSON.stringify({ app: "other" })).ok).toBe(false);
    expect(validateImport(JSON.stringify({ ...JSON.parse(good), version: 1 })).ok).toBe(false);
    expect(validateImport(JSON.stringify({ ...JSON.parse(good), progress: "x" })).ok).toBe(false);
    expect(validateImport(JSON.stringify({ ...JSON.parse(good), read: [1] })).ok).toBe(false);
  });
});

describe("answers keyed by option id", () => {
  const ttl = optionId("When its cached copy's TTL runs out and it asks again");

  it("upgrades v2 positions using the old option order and drops what cannot be mapped", () => {
    expect(migrateAnswers("dns", { 0: 1, 1: 3, 2: 9, 77: 0, x: 1, 3: -1 })).toEqual({
      0: ttl,
      1: optionId("The servers that are authoritative for example.com"),
    });
    expect(migrateAnswers("unknown-topic", { 0: 0 })).toEqual({});
  });

  it("keeps other progress when an old record is upgraded", () => {
    const raw = JSON.stringify({ version: 2, posts: ["slack-dnssec-2021"], topics: { dns: { done: ["why", "model"], visited: ["why"], last: "model", answers: { 0: 1 } } } });
    const p = parseProgress(raw)!;
    expect(p.version).toBe(3);
    expect(p.posts).toEqual(["slack-dnssec-2021"]);
    expect(p.topics.dns).toEqual({ done: ["why", "model"], visited: ["why"], last: "model", answers: { 0: ttl } });
  });

  it("reads v3 answers as ids and ignores numbers", () => {
    const raw = JSON.stringify({ version: 3, posts: [], topics: { dns: { done: [], visited: [], answers: { 0: ttl, 1: 2 } } } });
    expect(parseProgress(raw)!.topics.dns.answers).toEqual({ 0: ttl });
  });

  it("imports a v2 export by upgrading its answers", () => {
    const v2 = { app: "sys101", version: 2, exportedAt: "2026-10-01T00:00:00.000Z", read: [], progress: { version: 2, posts: [], topics: { dns: { done: [], visited: [], answers: { 0: 1 } } } } };
    const r = validateImport(JSON.stringify(v2), { slugs: ["dns"], postIds: [] });
    expect(r.ok && r.progress.topics.dns.answers).toEqual({ 0: ttl });
    expect(r.ok && r.progress.version).toBe(3);
  });

  it("an option keeps its id when the options are reordered", () => {
    const a = ["x", "y", "z"].map(optionId);
    const b = ["z", "x", "y"].map(optionId);
    expect(b).toEqual([a[2], a[0], a[1]]);
  });
});

describe("quiz scoring and retry", () => {
  it("scores answers, counts complete once all are answered, and retries", () => {
    let p = answer(emptyProgress(), "dns", 0, "c0"); // right
    p = answer(p, "dns", 1, "nope"); // wrong
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
    p = answerAll(allConcept(emptyProgress()), () => "x");
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
    p = answerAll(p, () => "x");
    expect(isTopicRead(p, meta)).toBe(true);
    expect(markAllDone(p, meta)).toEqual(p);
  });

  it("undoes the marks but keeps quiz answers", () => {
    const p = answerAll(markAllDone(emptyProgress(), meta), () => "x");
    const u = unmarkAllDone(p, meta);
    expect(summary(u, meta).done).toBe(1);
    expect(isTopicRead(u, meta)).toBe(false);
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
  const lb: LessonMeta = { slug: "load-balancing", postIds: ["uber-dynamic-subsetting-2022", "dropbox-robinhood-2024"], correct: ["c0", "c1", "c2", "c3", "c4", "c5"] };
  const metas = [meta, lb];
  const known = { slugs: ["dns", "load-balancing"], postIds: [...meta.postIds, ...lb.postIds] };
  const started = answer(toggleUnit(toggleUnit(emptyProgress(), meta, "why"), meta, "cloudflare-dns-builds-2022"), "dns", 0, "c0");

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
    const here = answer(toggleUnit(emptyProgress(), lb, "why"), "dns", 0, "c9");
    const merged = mergeProgress(here, started);
    expect(merged.topics.dns.done).toEqual(["why"]);
    expect(merged.topics.dns.answers).toEqual({ 0: "c9" }); // the answer already given here is kept
    expect(merged.topics["load-balancing"].done).toEqual(["why"]);
    expect(merged.posts).toEqual(["cloudflare-dns-builds-2022"]);
    expect(diffSummary(here, merged, metas)).toEqual({ topics: 1, items: 2 });
    expect(diffSummary(here, started, metas)).toEqual({ topics: 2, items: 4 });
  });

  it("plans an import: merge combines and keeps the later date, replace uses only the file, corrupt storage counts as empty", () => {
    const here = { progress: answer(toggleUnit(emptyProgress(), lb, "why"), "dns", 0, "c9"), read: ["load-balancing"], updated: { dns: "2026-10-12T00:00:00.000Z", "load-balancing": "2026-10-01T00:00:00.000Z" }, corrupt: false };
    const file = { progress: started, read: ["dns"], updated: { dns: "2026-10-11T12:00:00.000Z" } };
    const merge = planImport(here, file, "merge", metas);
    expect(merge.next.topics.dns.answers).toEqual({ 0: "c9" });
    expect(merge.nextRead).toEqual([]); // read flags are derived: neither topic is finished
    const finished = meta.correct.reduce((p, c, i) => answer(p, "dns", i, c), meta.postIds.reduce((p, id) => toggleUnit(p, meta, id), CONCEPT_SECTIONS.reduce((p, s) => toggleUnit(p, meta, s), emptyProgress())));
    expect(planImport(here, { ...file, progress: finished, read: [] }, "merge", metas).nextRead).toEqual(["dns"]);
    expect(merge.dates).toEqual({ dns: "2026-10-12T00:00:00.000Z", "load-balancing": "2026-10-01T00:00:00.000Z" });
    expect(merge.diff).toEqual({ topics: 1, items: 2 });
    const replace = planImport(here, file, "replace", metas);
    expect(replace.next).toEqual(started);
    expect(replace.nextRead).toEqual([]);
    expect(replace.dates).toEqual(file.updated);
    expect(replace.diff.topics).toBe(2);
    const fromCorrupt = planImport({ ...here, corrupt: true }, file, "merge", metas);
    expect(fromCorrupt.next).toEqual(started);
    expect(fromCorrupt.diff).toEqual(diffSummary(emptyProgress(), started, metas));
  });

  it("rejects invalid and wrong-version files whole, and ignores unknown topics with a count", () => {
    const good = JSON.parse(JSON.stringify(exportFile(started, ["dns"])));
    expect(validateImport(JSON.stringify({ ...good, version: 9 }), known).ok).toBe(false);
    const badType = structuredClone(good);
    badType.progress.topics.dns.answers = { 0: 1 };
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
    expect(parseProgress(JSON.stringify({ version: 2, topics: "x" }))).toEqual({ version: 3, topics: {}, posts: [] });
    expect(loadProgress((k) => (k === "sys101:progress" ? "{broken" : null))).toEqual(emptyProgress());
  });
});

describe("renamed post ids", () => {
  it("keeps progress saved under an old post id", () => {
    const saved = JSON.stringify({
      version: 3,
      topics: { failover: { done: ["github-mysql-ha-2020", "check"], visited: ["github-mysql-ha-2020"], answers: {}, last: "github-mysql-ha-2020" } },
      posts: ["github-mysql-ha-2020"],
    });
    const p = parseProgress(saved)!;
    expect(p.posts).toEqual(["github-mysql-ha-failover-2018"]);
    expect(p.topics.failover.done).toEqual(["github-mysql-ha-failover-2018", "check"]);
    expect(p.topics.failover.visited).toEqual(["github-mysql-ha-failover-2018"]);
    expect(p.topics.failover.last).toBe("github-mysql-ha-failover-2018");
  });
});

describe("halfOf", () => {
  const meta = { slug: "t", postIds: ["a", "b"], correct: [] };
  const p = (done: string[], posts: string[]) => ({ version: 3 as const, topics: { t: { done, visited: [], answers: {} } }, posts });
  it("names the one finished half, and none for both or neither", () => {
    expect(halfOf(p([...CONCEPT_SECTIONS], ["a"]), meta)).toBe("concept");
    expect(halfOf(p(["why"], ["a", "b"]), meta)).toBe("posts");
    expect(halfOf(p([...CONCEPT_SECTIONS], ["a", "b"]), meta)).toBeNull();
    expect(halfOf(p(["why"], ["a"]), meta)).toBeNull();
  });
  it("does not count a topic with no posts as posts read", () => {
    expect(halfOf(p(["why"], []), { ...meta, postIds: [] })).toBeNull();
  });
});
