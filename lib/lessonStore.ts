// Progress for lesson-format topics, as pure functions over a plain object.
// The browser glue (localStorage, events) lives in lib/progress.ts.

import { LEGACY_OPTIONS } from "./legacyQuiz";
import { optionId } from "./quizIds";

export const PROGRESS_KEY = "sys101:progress";
export const OLD_CONCEPT_KEY = "sys101:concept"; // v1: topics with the concept marked complete
export const OLD_POSTS_KEY = "sys101:posts"; // v1: post ids marked read
const VERSION = 3;
/** v2 stored quiz answers as option positions; it is still read and upgraded. */
const OLD_VERSION = 2;

/** The five concept sections every lesson topic has, in page order. */
export const CONCEPT_SECTIONS = ["why", "model", "how", "example", "mistakes"] as const;

type TopicProgress = {
  /** Section ids marked done (concept sections). */
  done: string[];
  /** Unit ids scrolled into view (sections, "check", post ids). */
  visited: string[];
  /** Quiz answers: question index -> id of the chosen option (see lib/quizIds.ts). */
  answers: Record<string, string>;
  /** Last unit viewed, for "Continue where you left off". */
  last?: string;
};

export type Progress = {
  version: typeof VERSION;
  topics: Record<string, TopicProgress>;
  /** Post ids marked read. Ids are unique across topics. */
  posts: string[];
};

/** What a topic needs to be read: its posts and quiz answer key. */
/** `correct` holds the id of the right option for each question, in question order. */
export type LessonMeta = { slug: string; postIds: string[]; correct: string[] };

export const emptyProgress = (): Progress => ({ version: VERSION, topics: {}, posts: [] });
const emptyTopic = (): TopicProgress => ({ done: [], visited: [], answers: {} });

/** Post ids that were renamed (the id carried a wrong year), so saved progress under the old id still counts. */
const POST_ID_ALIASES: Record<string, string> = {
  "github-mysql-ha-2020": "github-mysql-ha-failover-2018",
};
const current = (id: string) => POST_ID_ALIASES[id] ?? id;

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string").map(current))] : [];

/**
 * Turn v2 answers (question index -> option position) into v3 (question index -> option id), using
 * the option order that existed when they were saved. An answer that cannot be mapped is dropped.
 */
export function migrateAnswers(slug: string, old: Record<string, unknown>): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const [k, pos] of Object.entries(old)) {
    if (!/^\d+$/.test(k) || !Number.isInteger(pos) || (pos as number) < 0) continue;
    const text = LEGACY_OPTIONS[slug]?.[Number(k)]?.[pos as number];
    if (text !== undefined) answers[k] = optionId(text);
  }
  return answers;
}

function cleanTopic(v: unknown, slug: string, version: number): TopicProgress {
  const t = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  let answers: Record<string, string> = {};
  if (t.answers && typeof t.answers === "object") {
    if (version === OLD_VERSION) answers = migrateAnswers(slug, t.answers as Record<string, unknown>);
    else {
      for (const [k, a] of Object.entries(t.answers as Record<string, unknown>)) {
        if (/^\d+$/.test(k) && typeof a === "string" && a) answers[k] = a;
      }
    }
  }
  return {
    done: strings(t.done),
    visited: strings(t.visited),
    answers,
    ...(typeof t.last === "string" ? { last: current(t.last) } : {}),
  };
}

/** Parse stored JSON into Progress, keeping whatever is valid. Never throws. */
export function parseProgress(raw: string | null): Progress | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || (v.version !== VERSION && v.version !== OLD_VERSION)) return null;
    const topics: Record<string, TopicProgress> = {};
    if (v.topics && typeof v.topics === "object") {
      // "__proto__" would set the prototype of this object instead of adding a topic.
      for (const [slug, t] of Object.entries(v.topics)) if (slug !== "__proto__") topics[slug] = cleanTopic(t, slug, v.version);
    }
    return { version: VERSION, topics, posts: strings(v.posts) };
  } catch {
    return null;
  }
}

/**
 * Build v2 progress from the v1 keys, losing nothing: a topic whose concept
 * was marked complete gets all five concept sections done, and every post
 * marked read stays read.
 */
export function migrate(oldConcept: string | null, oldPosts: string | null): Progress {
  const parse = (raw: string | null) => {
    try {
      return strings(raw ? JSON.parse(raw) : []);
    } catch {
      return [];
    }
  };
  const p = emptyProgress();
  for (const slug of parse(oldConcept)) p.topics[slug] = { ...emptyTopic(), done: [...CONCEPT_SECTIONS] };
  p.posts = [...new Set(parse(oldPosts))];
  return p;
}

/** Stored v2 progress, or a migration of v1 keys when there is none yet. */
export function loadProgress(get: (key: string) => string | null): Progress {
  return parseProgress(get(PROGRESS_KEY)) ?? migrate(get(OLD_CONCEPT_KEY), get(OLD_POSTS_KEY));
}

export const topicOf = (p: Progress, slug: string) => p.topics[slug] ?? emptyTopic();

export function quizScore(p: Progress, meta: LessonMeta) {
  const answers = topicOf(p, meta.slug).answers;
  const answered = meta.correct.filter((_, i) => answers[i] !== undefined).length;
  const correct = meta.correct.filter((c, i) => answers[i] === c).length;
  return { answered, correct, total: meta.correct.length };
}

/** Quiz is complete once every question has an answer; a perfect score is not required. */
export const quizComplete = (p: Progress, meta: LessonMeta) => quizScore(p, meta).answered === meta.correct.length;

export function counts(p: Progress, meta: LessonMeta) {
  const t = topicOf(p, meta.slug);
  return {
    concept: CONCEPT_SECTIONS.filter((s) => t.done.includes(s)).length,
    conceptTotal: CONCEPT_SECTIONS.length,
    quiz: quizScore(p, meta),
    posts: meta.postIds.filter((id) => p.posts.includes(id)).length,
    postsTotal: meta.postIds.length,
  };
}

/** The one rule: every concept section done, quiz complete, every post read. */
export function isTopicRead(p: Progress, meta: LessonMeta) {
  const t = topicOf(p, meta.slug);
  return (
    CONCEPT_SECTIONS.every((s) => t.done.includes(s)) &&
    quizComplete(p, meta) &&
    meta.postIds.every((id) => p.posts.includes(id))
  );
}

/** Units in page order, for "Continue" and the rail. */
const units = (meta: LessonMeta) => [...CONCEPT_SECTIONS, "check", ...meta.postIds];

type UnitStatus = "not started" | "visited" | "done";

export function unitStatus(p: Progress, meta: LessonMeta, unit: string): UnitStatus {
  const t = topicOf(p, meta.slug);
  const done =
    unit === "check" ? quizComplete(p, meta) : meta.postIds.includes(unit) ? p.posts.includes(unit) : t.done.includes(unit);
  if (done) return "done";
  return t.visited.includes(unit) ? "visited" : "not started";
}

/** First unit not done, or undefined when everything is. */
const firstIncomplete = (p: Progress, meta: LessonMeta) => units(meta).find((u) => unitStatus(p, meta, u) !== "done");

/**
 * What the progress header shows: units done out of all (concept sections,
 * the quiz as one, each post), per-unit state for the bar, and the link.
 */
export function summary(p: Progress, meta: LessonMeta) {
  const all = units(meta);
  const segments = all.map((u) => ({
    unit: u,
    group: (CONCEPT_SECTIONS as readonly string[]).includes(u) ? "concept" : u === "check" ? "quiz" : "posts",
    done: unitStatus(p, meta, u) === "done",
  }));
  const done = segments.filter((s) => s.done).length;
  const next = firstIncomplete(p, meta);
  const action = done === 0 ? "Start" : done === all.length ? "Review" : "Continue";
  return { done, total: all.length, segments, action, target: action === "Continue" ? next! : all[0] };
}

/** Whether anything that counts toward reading this topic has been recorded. Visits alone do not count. */
function hasTracked(p: Progress, meta: LessonMeta) {
  const t = topicOf(p, meta.slug);
  return t.done.length > 0 || Object.keys(t.answers).length > 0 || meta.postIds.some((id) => p.posts.includes(id));
}

/**
 * The read list with this topic's entry set from isTopicRead. Other topics are untouched.
 * A topic marked read before it had lesson tracking keeps that mark until something is tracked on it.
 */
export function syncRead(read: string[], p: Progress, meta: LessonMeta) {
  const on = isTopicRead(p, meta);
  const has = read.includes(meta.slug);
  if (has && !on && !hasTracked(p, meta)) return read;
  if (on === has) return read;
  return on ? [...read, meta.slug] : read.filter((s) => s !== meta.slug);
}

// ── Updates (all return a new Progress) ────────────────────────────────────

const withTopic = (p: Progress, slug: string, f: (t: TopicProgress) => TopicProgress): Progress => ({
  ...p,
  topics: { ...p.topics, [slug]: f(topicOf(p, slug)) },
});

const flip = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export function toggleUnit(p: Progress, meta: LessonMeta, unit: string): Progress {
  if (meta.postIds.includes(unit)) return { ...p, posts: flip(p.posts, unit) };
  return withTopic(p, meta.slug, (t) => ({ ...t, done: flip(t.done, unit) }));
}

/** Mark every concept section done and every post read. The quiz still needs answers. */
export function markAllDone(p: Progress, meta: LessonMeta): Progress {
  const t = withTopic(p, meta.slug, (x) => ({ ...x, done: [...new Set([...x.done, ...CONCEPT_SECTIONS])] }));
  return { ...t, posts: [...new Set([...t.posts, ...meta.postIds])] };
}

/** Undo markAllDone: clear every concept section and post mark. Quiz answers stay. */
export function unmarkAllDone(p: Progress, meta: LessonMeta): Progress {
  const t = withTopic(p, meta.slug, (x) => ({ ...x, done: x.done.filter((u) => !(CONCEPT_SECTIONS as readonly string[]).includes(u)) }));
  return { ...t, posts: t.posts.filter((id) => !meta.postIds.includes(id)) };
}

export function markVisited(p: Progress, slug: string, unit: string): Progress {
  const t = topicOf(p, slug);
  if (t.visited.includes(unit) && t.last === unit) return p;
  return withTopic(p, slug, (x) => ({ ...x, visited: x.visited.includes(unit) ? x.visited : [...x.visited, unit], last: unit }));
}

export function answer(p: Progress, slug: string, question: number, option: string): Progress {
  return withTopic(p, slug, (t) => ({ ...t, answers: { ...t.answers, [question]: option } }));
}

export function retryQuiz(p: Progress, slug: string): Progress {
  return withTopic(p, slug, (t) => ({ ...t, answers: {} }));
}

export function resetTopic(p: Progress, meta: LessonMeta): Progress {
  const { [meta.slug]: _removed, ...topics } = p.topics;
  return { ...p, topics, posts: p.posts.filter((id) => !meta.postIds.includes(id)) };
}

// ── Export and import ──────────────────────────────────────────────────────

type ExportFile = {
  app: "sys101";
  version: typeof VERSION;
  exportedAt: string;
  progress: Progress;
  read: string[];
  /** Last change per topic (ISO dates), where known. */
  updated?: Record<string, string>;
};

export function exportFile(p: Progress, read: string[], now = new Date(), updated: Record<string, string> = {}): ExportFile {
  return { app: "sys101", version: VERSION, exportedAt: now.toISOString(), progress: p, read, updated };
}

/** "sys101-progress-2026-10-11.json", in local time. */
export function exportName(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `sys101-progress-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** What this site knows about, to check an import against. */
export type Known = { slugs: string[]; postIds: string[] };

type ImportResult =
  | { ok: true; progress: Progress; read: string[]; updated: Record<string, string>; ignored: number }
  | { ok: false; error: string };

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/** The stored shape exactly, or a reason it is not. Nothing is repaired: a file is used whole or not at all. */
function strictTopic(v: unknown, slug: string, version: number): TopicProgress | string {
  if (!v || typeof v !== "object" || Array.isArray(v)) return "a topic entry is not an object";
  const t = v as Record<string, unknown>;
  if (!isStrings(t.done) || !isStrings(t.visited)) return "a topic's done or visited list is not a list of names";
  if (!t.answers || typeof t.answers !== "object" || Array.isArray(t.answers)) return "a topic's quiz answers are not an object";
  let answers: Record<string, string> = {};
  if (version === OLD_VERSION) {
    for (const [k, a] of Object.entries(t.answers as Record<string, unknown>)) {
      if (!/^\d+$/.test(k) || !Number.isInteger(a) || (a as number) < 0) return "a quiz answer is not a whole number";
    }
    answers = migrateAnswers(slug, t.answers as Record<string, unknown>);
  } else {
    for (const [k, a] of Object.entries(t.answers as Record<string, unknown>)) {
      if (!/^\d+$/.test(k) || typeof a !== "string" || !a) return "a quiz answer is not an option id";
      answers[k] = a;
    }
  }
  if (t.last !== undefined && typeof t.last !== "string") return "a topic's last position is not text";
  return { done: [...t.done], visited: [...t.visited], answers, ...(typeof t.last === "string" ? { last: t.last } : {}) };
}

/** A real export is a few kilobytes; anything near this size is not one. */
export const MAX_IMPORT_CHARS = 1_000_000;

/**
 * Validate an uploaded export before anything is applied: app, version,
 * shape and value types. Topics and posts this site does not have are
 * dropped and counted, not treated as errors.
 */
export function validateImport(text: string, known?: Known): ImportResult {
  if (text.length > MAX_IMPORT_CHARS) return { ok: false, error: "That file is too large to be a sys101 progress export." };
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  const f = v as Partial<ExportFile>;
  if (!f || typeof f !== "object" || f.app !== "sys101") return { ok: false, error: "That file is not a sys101 progress export." };
  if (f.version !== VERSION && f.version !== OLD_VERSION)
    return { ok: false, error: `This export is version ${String(f.version)}; only versions ${OLD_VERSION} and ${VERSION} can be imported.` };
  const p = f.progress as Partial<Progress> | undefined;
  if (!p || typeof p !== "object" || p.version !== f.version || !p.topics || typeof p.topics !== "object" || Array.isArray(p.topics))
    return { ok: false, error: "The progress data in that file is damaged." };
  if (!isStrings(p.posts)) return { ok: false, error: "The progress data in that file is damaged: posts is not a list of names." };
  if (!isStrings(f.read)) return { ok: false, error: "The read list in that file is damaged." };
  const updatedIn = f.updated ?? {};
  if (typeof updatedIn !== "object" || Array.isArray(updatedIn) || !Object.values(updatedIn).every((d) => typeof d === "string"))
    return { ok: false, error: "The dates in that file are damaged." };

  // "__proto__" would set the prototype of the topics object, whether or not a known list is given.
  const isTopic = (slug: string) => slug !== "__proto__" && (!known || known.slugs.includes(slug));
  const isPost = (id: string) => !known || known.postIds.includes(id);
  let ignored = 0;
  const topics: Record<string, TopicProgress> = {};
  for (const [slug, t] of Object.entries(p.topics)) {
    const clean = strictTopic(t, slug, f.version);
    if (typeof clean === "string") return { ok: false, error: `The progress data in that file is damaged: ${clean}.` };
    if (isTopic(slug)) topics[slug] = clean;
    else ignored++;
  }
  const posts = p.posts.filter(isPost);
  ignored += p.posts.length - posts.length;
  const read = f.read.filter(isTopic);
  ignored += f.read.filter((s) => !isTopic(s) && !(s in p.topics!)).length;
  const updated = Object.fromEntries(Object.entries(updatedIn as Record<string, string>).filter(([slug]) => isTopic(slug)));
  return { ok: true, progress: { version: VERSION, topics, posts: [...new Set(posts)] }, read: [...new Set(read)], updated, ignored };
}

const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

/** Merge keeps the more complete value: lists are combined, and an answer already given here is kept. */
export function mergeProgress(current: Progress, incoming: Progress): Progress {
  const topics: Record<string, TopicProgress> = { ...current.topics };
  for (const [slug, t] of Object.entries(incoming.topics)) {
    const c = current.topics[slug];
    topics[slug] = c
      ? {
          done: union(c.done, t.done),
          visited: union(c.visited, t.visited),
          answers: { ...t.answers, ...c.answers },
          ...((c.last ?? t.last) ? { last: c.last ?? t.last } : {}),
        }
      : t;
  }
  return { version: VERSION, topics, posts: union(current.posts, incoming.posts) };
}

/**
 * What applying `after` over `before` changes, for the preview: topics
 * touched, and items changed (sections done, quiz answers, posts read).
 */
export function diffSummary(before: Progress, after: Progress, metas: LessonMeta[]) {
  let topics = 0;
  let items = 0;
  for (const m of metas) {
    const a = topicOf(before, m.slug);
    const b = topicOf(after, m.slug);
    const flips = (x: string[], y: string[]) => x.filter((i) => !y.includes(i)).length + y.filter((i) => !x.includes(i)).length;
    const keys = new Set([...Object.keys(a.answers), ...Object.keys(b.answers)]);
    const n =
      flips(a.done, b.done) +
      [...keys].filter((k) => a.answers[k] !== b.answers[k]).length +
      flips(before.posts.filter((p) => m.postIds.includes(p)), after.posts.filter((p) => m.postIds.includes(p)));
    if (n) topics++;
    items += n;
  }
  return { topics, items };
}

/** The read list for this progress: each lesson topic's flag derived, any other entries kept. */
export function deriveRead(read: readonly string[], p: Progress, metas: LessonMeta[]) {
  return metas.reduce((r, m) => syncRead(r, p, m), [...new Set(read)]);
}

type ImportFile = { progress: Progress; read: readonly string[]; updated: Record<string, string> };

/**
 * What applying an imported file would produce here, in merge or replace mode: the progress, the read
 * list (derived again), the per-topic dates (merge keeps the later one) and the preview counts.
 * `corrupt` means the stored progress is unreadable, so it counts as empty.
 */
export function planImport(here: ImportFile & { corrupt: boolean }, file: ImportFile, mode: "merge" | "replace", metas: LessonMeta[]) {
  const base = here.corrupt ? emptyProgress() : here.progress;
  const next = mode === "merge" ? mergeProgress(base, file.progress) : file.progress;
  const nextRead = deriveRead(mode === "merge" ? [...here.read, ...file.read] : file.read, next, metas);
  const dates =
    mode === "merge"
      ? Object.fromEntries(
          [...new Set([...Object.keys(here.updated), ...Object.keys(file.updated)])].map((s) => [s, [here.updated[s], file.updated[s]].filter(Boolean).sort().pop()!]),
        )
      : file.updated;
  return { next, nextRead, dates, diff: diffSummary(base, next, metas) };
}

export function resetAll(): { progress: Progress; read: string[] } {
  return { progress: emptyProgress(), read: [] };
}
