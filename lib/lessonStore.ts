// Progress for lesson-format topics, as pure functions over a plain object.
// The browser glue (localStorage, events) lives in lib/progress.ts.

export const PROGRESS_KEY = "sys101:progress";
export const READ_KEY = "sys101:read"; // the read list the map and index use
export const OLD_CONCEPT_KEY = "sys101:concept"; // v1: topics with the concept marked complete
export const OLD_POSTS_KEY = "sys101:posts"; // v1: post ids marked read
export const VERSION = 2;

/** The five concept sections every lesson topic has, in page order. */
export const CONCEPT_SECTIONS = ["why", "model", "how", "example", "mistakes"] as const;

export type TopicProgress = {
  /** Section ids marked done (concept sections). */
  done: string[];
  /** Unit ids scrolled into view (sections, "check", post ids). */
  visited: string[];
  /** Quiz answers: question index -> chosen option index. */
  answers: Record<string, number>;
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
export type LessonMeta = { slug: string; postIds: string[]; correct: number[] };

export const emptyProgress = (): Progress => ({ version: VERSION, topics: {}, posts: [] });
const emptyTopic = (): TopicProgress => ({ done: [], visited: [], answers: {} });

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function cleanTopic(v: unknown): TopicProgress {
  const t = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const answers: Record<string, number> = {};
  if (t.answers && typeof t.answers === "object") {
    for (const [k, a] of Object.entries(t.answers as Record<string, unknown>)) {
      if (/^\d+$/.test(k) && Number.isInteger(a) && (a as number) >= 0) answers[k] = a as number;
    }
  }
  return {
    done: strings(t.done),
    visited: strings(t.visited),
    answers,
    ...(typeof t.last === "string" ? { last: t.last } : {}),
  };
}

/** Parse stored JSON into Progress, keeping whatever is valid. Never throws. */
export function parseProgress(raw: string | null): Progress | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || v.version !== VERSION) return null;
    const topics: Record<string, TopicProgress> = {};
    if (v.topics && typeof v.topics === "object") {
      for (const [slug, t] of Object.entries(v.topics)) topics[slug] = cleanTopic(t);
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
export const units = (meta: LessonMeta) => [...CONCEPT_SECTIONS, "check", ...meta.postIds];

export type UnitStatus = "not started" | "visited" | "done";

export function unitStatus(p: Progress, meta: LessonMeta, unit: string): UnitStatus {
  const t = topicOf(p, meta.slug);
  const done =
    unit === "check" ? quizComplete(p, meta) : meta.postIds.includes(unit) ? p.posts.includes(unit) : t.done.includes(unit);
  if (done) return "done";
  return t.visited.includes(unit) ? "visited" : "not started";
}

/** First unit not done, or undefined when everything is. */
export const firstIncomplete = (p: Progress, meta: LessonMeta) => units(meta).find((u) => unitStatus(p, meta, u) !== "done");

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

/** The read list with this topic's entry set from isTopicRead. Other topics are untouched. */
export function syncRead(read: string[], p: Progress, meta: LessonMeta) {
  const on = isTopicRead(p, meta);
  const has = read.includes(meta.slug);
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

export function markVisited(p: Progress, slug: string, unit: string): Progress {
  const t = topicOf(p, slug);
  if (t.visited.includes(unit) && t.last === unit) return p;
  return withTopic(p, slug, (x) => ({ ...x, visited: x.visited.includes(unit) ? x.visited : [...x.visited, unit], last: unit }));
}

export function answer(p: Progress, slug: string, question: number, option: number): Progress {
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

export type ExportFile = { app: "sys101"; version: typeof VERSION; exportedAt: string; progress: Progress; read: string[] };

export function exportFile(p: Progress, read: string[], now = new Date()): ExportFile {
  return { app: "sys101", version: VERSION, exportedAt: now.toISOString(), progress: p, read };
}

/** Validate an uploaded export before applying it. */
export function validateImport(text: string): { ok: true; progress: Progress; read: string[] } | { ok: false; error: string } {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  const f = v as Partial<ExportFile>;
  if (!f || typeof f !== "object" || f.app !== "sys101") return { ok: false, error: "That file is not a sys101 progress export." };
  if (f.version !== VERSION) return { ok: false, error: `This export is version ${String(f.version)}; only version ${VERSION} can be imported.` };
  const progress = parseProgress(JSON.stringify(f.progress));
  if (!progress) return { ok: false, error: "The progress data in that file is damaged." };
  if (!Array.isArray(f.read) || !f.read.every((s) => typeof s === "string")) return { ok: false, error: "The read list in that file is damaged." };
  return { ok: true, progress, read: f.read };
}
