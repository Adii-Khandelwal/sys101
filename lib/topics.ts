import fs from "node:fs";
import path from "node:path";
import { checkFigure, type FigureSpec } from "./figures";
import { checkDiagram } from "./diagramCheck";
import { httpsUrlProblem } from "./httpsUrl";

/** A post rewritten in our own words, in reading order. */
type Digest = {
  problem: string;
  constraints: string;
  walkthrough: { step: string; explanation: string }[];
  /** Inline SVG markup drawn for this post, styled by the dg-* classes in globals.css. */
  diagram: string;
  numbers: { value: string; meaning: string }[];
  /** Optional bar chart of two or more `numbers` that share a unit, shown under the numbers table. Every figure in its text must appear in `numbers`. */
  chart?: string;
  /** `rejected` is left out when the source names no alternative. */
  tradeoffs: { chosen: string; rejected?: string; why: string };
  failures: string;
  takeaways: string;
  /** Optional interactive figure shown after the digest; its inputs are rows of `numbers` (lib/figures.ts). */
  figure?: FigureSpec;
};

export type Post = {
  /** Stable id for reading progress; required on lesson topics. */
  id?: string;
  title: string;
  /** Attribution only: the digest is the content. */
  url: string;
  company: string;
  /** YYYY-MM-DD: when someone last opened the post and checked the digest against it. */
  verifiedOn: string;
  /** YYYY-MM-DD: when the company published the post. Shown on the page. Versioned documentation with no date uses NO_DATE and sets `edition`. */
  published: string;
  /** Only with an undated source: the full label shown instead of a date, for example "page shows last modified June 14, 2021, v3.5 documentation". */
  edition?: string;
  /** Required for posts older than OLD_POST_YEARS: why it still passes rule 3, and what may have changed. */
  ageNote?: string;
  /** A newer source, opened by us, that still points to this post. */
  stillCitedBy?: { title: string; url: string; year: number };
  /** Topic slugs this post also teaches, linked from the post. */
  related?: string[];
  digest: Digest;
};

/** Index headings, in curriculum order. */
export const GROUPS = ["Scaling", "Data", "Messaging", "Reliability"] as const;
export type Group = (typeof GROUPS)[number];

/**
 * How often this topic comes up in system design interviews, shown as a small
 * marker on the topic page. Optional: a topic without it shows no marker.
 * "core" is asked in almost every interview, "common" comes up often, "niche"
 * is occasional or specialised.
 */
const INTERVIEW_RELEVANCE = ["core", "common", "niche"] as const;
export type InterviewRelevance = (typeof INTERVIEW_RELEVANCE)[number];

/** Interview tags are hidden for now; the field stays in the content. Set to true to show them again. */
export const SHOW_INTERVIEW_TAGS = false;

/** The label shown for each interview-relevance value. */
export const INTERVIEW_RELEVANCE_LABEL: Record<InterviewRelevance, string> = {
  core: "Core interview topic",
  common: "Common in interviews",
  niche: "Niche in interviews",
};

/** A concept section in the lesson format: one line on what you can do after it, then the teaching. */
type LessonSection = { outcome: string; body: string };

export type LessonQuestion = {
  question: string;
  options: string[];
  /** Index into options. */
  correct: number;
  /** Why the correct option is right. */
  why: string;
  /** Why each option is wrong; the entry at `correct` is ignored. */
  wrong: string[];
  /** Section id that teaches this, linked from the answer. */
  teaches: string;
};

type LessonExercise = {
  level: "apply" | "design" | "scale";
  /** Optional sketch of the model answer, shown inside the revealed answer. */
  diagram?: string;
  prompt: string;
  answer: string;
  tradeoffs: string;
  wrongAnswers: string[];
  /** Section id that teaches the idea, linked from the answer. */
  teaches: string;
};

/** The teaching-journey format (docs/ideas.md, ideas 2 and 4). Piloted on DNS. */
type Lesson = {
  why: LessonSection & { diagram?: string };
  mentalModel: LessonSection & { diagram: string };
  howItWorks: { outcome: string; steps: { step: string; explanation: string }[]; diagram: string; /** Optional step-through: 3 to 6 frames of one diagram, one shown at a time. */ stepper?: { frames: { caption: string; diagram: string }[] } };
  workedExample: { outcome: string; steps: { step: string; explanation: string }[]; diagram: string };
  mistakesOutcome: string;
  /** Optional picture of the three mistakes, shown under the list. */
  mistakesDiagram?: string;
  checkOutcome: string;
  quiz: LessonQuestion[];
  postsOutcome: string;
  differOutcome: string;
  exercisesOutcome: string;
  exercises: LessonExercise[];
  next: LessonSection;
};

/** Section ids a quiz answer may link back to. */
const LESSON_SECTIONS = ["why", "model", "how", "example", "mistakes", "posts", "differ"] as const;
/** Sections in the concept part, which comes before the posts. */
const CONCEPT_SECTION_IDS = ["why", "model", "how", "example", "mistakes"] as const;

/** The "In short" block under the concept paragraph. Figures point at rows of a post's digest.numbers, so values never drift. */
type Summary = { points: string[]; figures: { postId: string; row: number; label: string }[] };


/** A digest row the company itself calls a headline result, or a target rather than a measurement. */
const isOwnClaim = (row: { meaning: string }) => /headline|\btarget\b|\bgoal\b/i.test(row.meaning);

/** The line a summary figure renders as: label, company, date string, and a note when the number is the company's own claim. */
export function figureLine(post: Post, f: { row: number; label: string }) {
  return `${f.label[0].toUpperCase()}${f.label.slice(1)}, ${companyWhen(post, "month", " ")}${figureNote(post, f)}`;
}

const figureNote = (post: Post, f: { row: number }) => (isOwnClaim(post.digest.numbers[f.row]) ? " (company's own figure)" : "");

/** The same line in two parts, so the page can set the source apart: the figure, then "Company · Month Year" in label type. */
export function figureParts(post: Post, f: { row: number; label: string }) {
  return { text: `${f.label[0].toUpperCase()}${f.label.slice(1)}`, source: `${companyWhen(post, "month")}${figureNote(post, f)}` };
}

export type Topic = {
  slug: string;
  title: string;
  /** A shorter name for page titles when the full title with the site name would reach 60 characters. */
  shortTitle?: string;
  group?: Group;
  /** Optional: how often this topic appears in system design interviews. */
  interviewRelevance?: InterviewRelevance;
  /** Optional meta description that replaces the one generated from `concept`: a complete sentence of 8 words or more, under 155 characters, ending in a period. */
  description?: string;
  concept: string;
  prerequisites: string[];
  /** In short: 3 to 5 plain sentences and 0 to 3 digest figures. Required on every topic (REQUIRE_NEW_FIELDS). */
  summary?: Summary;
  /** "Say it in 30 seconds": a speakable answer, 55 to 100 words, 4 to 6 sentences (checkThirtySeconds). Required once REQUIRE_THIRTY_SECONDS is true. */
  thirtySeconds?: string;
  /** Optional: one sentence copied word for word from one of this topic's posts, under 25 words. `npm run verify:quotes` checks it against the live page. */
  pullQuote?: { text: string; postId: string };
  /** Why each prerequisite comes first: one sentence per prerequisite id, hidden edges included. */
  prerequisiteReasons?: Record<string, string>;
  /** Recap of what the prerequisites taught, 2 to 4 sentences. Not used by lesson topics. */
  primer?: string;
  /** New page format; when present it replaces primer, quiz and exercise. */
  lesson?: Lesson;
  posts: Post[];
  /** How the posts' approaches differ and why; required when a topic has two or more posts. */
  comparison?: string;
  /** Optional side-by-side picture of the posts' approaches, shown under the comparison text. */
  comparisonDiagram?: string;
  /** `diagram`: optional picture of a term that is really a shape or a process; shown under the term in the topic's "Words to know". */
  glossary: { term: string; definition: string; diagram?: string }[];
  /** Exactly three. */
  mistakes: string[];
  /** Three to five. Not used by lesson topics. */
  quiz?: { question: string; answer: string }[];
  exercise?: { prompt: string; answer: string };
};

const TOPICS_DIR = path.join(process.cwd(), "content", "topics");

let topicsCache: Topic[] | undefined;

/** Read and validated once per process in production; dev and tests re-read so content edits show up. */
export function getAllTopics(): Topic[] {
  if (topicsCache) return structuredClone(topicsCache); // a copy, so a caller cannot change the cached topics
  const all = loadAllTopics();
  if (process.env.NODE_ENV === "production") topicsCache = structuredClone(all);
  return all;
}

function loadAllTopics(): Topic[] {
  const topics = fs
    .readdirSync(TOPICS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ file: f, topic: JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, f), "utf8")) as Topic }));

  const problems = validate(topics);
  if (problems.length) {
    // Thrown during static generation, so a bad content file fails the build
    // instead of shipping a broken page.
    throw new Error(`Invalid content in content/topics:\n- ${problems.join("\n- ")}`);
  }
  return topics.map((t) => t.topic).sort((a, b) => a.title.localeCompare(b.title));
}

const nonEmpty = (v: unknown) => typeof v === "string" && v.trim().length > 0;

function isPastDate(v: unknown) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(`${v}T00:00:00Z`);
  // A calendar date in the author's timezone can be up to a day ahead of the
  // UTC build machine, so allow one day of slack.
  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(v) && date.getTime() <= tomorrow;
}

/** The `published` value for a source that shows no date, such as versioned documentation. */
export const NO_DATE = "no date shown";
export const isUndated = (post: Pick<Post, "published">) => post.published === NO_DATE;

/** An edition label that says nothing about a date. Such a source shows no date at all. */
const NO_DATE_LABEL = /^(date unknown|no date shown)$/i;

/**
 * The date text to show for a source, or null when there is nothing to say: a source with no date shows none, unless
 * its `edition` label gives a date the page shows ("page shows last modified June 14, 2021, v3.5 documentation").
 */
export function postDateShown(post: Pick<Post, "published" | "edition">, precision: "month" | "year"): string | null {
  if (isUndated(post)) {
    const e = post.edition?.trim();
    return e && !NO_DATE_LABEL.test(e) ? e : null;
  }
  return precision === "month" ? formatMonth(post.published) : post.published.slice(0, 4);
}

/** "Meta · June 2022", or just "Meta" when the source has no date to show. `sep` goes between the two. */
export function companyWhen(post: Pick<Post, "company" | "published" | "edition">, precision: "month" | "year", sep = " · ") {
  const when = postDateShown(post, precision);
  return when ? `${post.company}${sep}${when}` : post.company;
}

/** What the page shows where it would show a date: "June 2017", or for an undated source its `edition` label, such as "page shows last modified June 14, 2021, v3.5 documentation". */
export function postWhen(post: Pick<Post, "published" | "edition">, precision: "month" | "year") {
  if (isUndated(post)) return post.edition ?? NO_DATE;
  return precision === "month" ? formatMonth(post.published) : post.published.slice(0, 4);
}

/** Posts older than this must explain why they still pass rule 3 (see CLAUDE.md). */
const OLD_POST_YEARS = 5;

export function isOld(iso: string) {
  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - OLD_POST_YEARS);
  return new Date(`${iso}T00:00:00Z`) < cutoff;
}

/** "2017-06-20" -> "June 2017". */
export function formatMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10-11" -> "11 October 2026". Fixed format, so server and client render the same text. */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** A non-empty array whose items all have the two given non-empty string fields. */
function pairs<T>(list: T[] | undefined, a: keyof T, b: keyof T) {
  return Array.isArray(list) && list.length > 0 && list.every((x) => nonEmpty(x?.[a]) && nonEmpty(x?.[b]));
}

/** A letter used to point at an option ("option B", "Not C", "(A)", or a bare B to H), which breaks once options are reordered. */
const OPTION_LETTER = /\b(?:[Oo]ption|[Aa]nswer|[Cc]hoice|[Ll]etter)\s+\(?[A-H]\b|\bNot\s+[A-H]\b|\([A-H]\)|\b[B-H]\b(?![-\w])/;
const LAST_ONLY = /^(?:neither|none of the above|all of the above|both of the above)\b/i;

/**
 * Where the right answer sits must vary: not every question in one place, never more than 3 in a
 * row in the same place, and explanations may not point at options by letter. Options like
 * "Neither" or "All of the above" must be last.
 */
export function checkQuizPositions(quiz: Pick<LessonQuestion, "options" | "correct" | "why" | "wrong">[]): string[] {
  const problems: string[] = [];
  const at = quiz.map((q) => q.correct);
  if (quiz.length >= 2 && at.every((c) => c === at[0])) problems.push(`quiz: every correct answer is in position ${at[0] + 1}; spread them out`);
  const perPosition = at.reduce<Record<number, number>>((n, c) => ({ ...n, [c]: (n[c] ?? 0) + 1 }), {});
  for (const [pos, n] of Object.entries(perPosition)) if (quiz.length >= 4 && n * 2 > quiz.length) problems.push(`quiz: ${n} of ${quiz.length} correct answers are in position ${Number(pos) + 1}; no position may hold more than half`);
  let run = 1;
  for (let i = 1; i < at.length; i++) {
    run = at[i] === at[i - 1] ? run + 1 : 1;
    if (run === 4) problems.push(`quiz: the correct answer is in position ${at[i] + 1} for 4 questions in a row (from question ${i - 2})`);
  }
  quiz.forEach((q, i) => {
    const where = `quiz ${i + 1}`;
    [q.why, ...(q.wrong ?? [])].forEach((text) => {
      const m = OPTION_LETTER.exec(text ?? "");
      if (m) problems.push(`${where}: an explanation points at an option by letter ("${m[0]}"); quote the option text instead`);
    });
    q.options?.forEach((o, j) => {
      if (LAST_ONLY.test(o) && j !== q.options.length - 1) problems.push(`${where}: "${o}" must be the last option`);
    });
  });
  return problems;
}

/**
 * Topics whose quizzes predate the style checks below. The checks run on every other topic
 * and fail the build; remove a slug from this list once its quiz is reworked. A test fails
 * if a listed topic already passes, so the list can only shrink.
 */
export const QUIZ_STYLE_PENDING: readonly string[] = [];

/** Most questions in which the correct option may be the single longest one. */
const MAX_LONGEST_CORRECT = 2;

/**
 * Two tells a reader can use without knowing the answer: the correct positions repeat in a
 * cycle (period 2 or 3 over a full window, such as A,B,C,A,B,C), and the correct option is
 * the longest in more than MAX_LONGEST_CORRECT questions.
 */
export function checkQuizStyle(quiz: Pick<LessonQuestion, "options" | "correct">[]): string[] {
  const problems: string[] = [];
  const at = quiz.map((q) => q.correct);
  for (const period of [2, 3]) {
    for (let i = 0; i + 2 * period <= at.length; i++) {
      const w = at.slice(i, i + 2 * period);
      if (new Set(w).size > 1 && w.slice(0, period).every((v, k) => v === w[k + period])) {
        problems.push(`quiz: correct positions repeat with period ${period} from question ${i + 1}; break the pattern`);
        break;
      }
    }
  }
  const longest = quiz.filter((q) => q.options.every((o, j) => j === q.correct || q.options[q.correct].length > o.length)).length;
  if (longest > MAX_LONGEST_CORRECT) problems.push(`quiz: the correct option is the longest in ${longest} of ${quiz.length} questions (max ${MAX_LONGEST_CORRECT}); even out the option lengths`);
  return problems;
}

/** A chart is a valid diagram, prints only figures the digest's `numbers` state, and draws each bar in proportion to its label. */
export function checkChart(chart: string, numbers: { value: string; meaning: string }[]): string[] {
  const problems = checkDiagram(chart).map((p) => `chart ${p}`);
  const noCommas = (t: string) => t.replace(/(\d),(?=\d)/g, "$1");
  const known = noCommas(numbers.map((n) => `${n.value} ${n.meaning}`).join(" "));
  const shown = noCommas(chart.replace(/<title[^>]*>[^<]*<\/title>/, "")).match(/>[^<>]*\d[^<>]*</g) ?? [];
  for (const t of shown.flatMap((x) => x.match(/\d+(?:\.\d+)?/g) ?? [])) {
    if (!new RegExp(`(?<![\\d.])${t.replace(".", "\\.")}(?![\\d])`).test(known)) problems.push(`chart shows ${t}, which is not in numbers`);
  }
  // Each bar's end label gives its value (a number or a fraction like 4/9); width over value must agree across bars.
  const bars = [...noCommas(chart).matchAll(/<rect[^>]*\swidth="([\d.]+)"[^>]*class="dg-box[^"]*"[^>]*\/><text[^>]*>([^<]*)<\/text>/g)]
    .map(([, w, label]) => {
      const m = /(\d+(?:\.\d+)?)(?:\/(\d+))?/.exec(label);
      return m ? { w: Number(w), v: m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]) } : null;
    })
    .filter((b): b is { w: number; v: number } => b !== null && b.v > 0);
  if (bars.length > 1) {
    const scale = Math.max(...bars.map((b) => b.w / b.v));
    if (bars.some((b) => Math.abs(b.w - b.v * scale) > Math.max(1, b.w * 0.03))) problems.push("chart bars are not in proportion to their labels");
  }
  return problems;
}

/** A step-through needs 3 to 6 captioned frames, each a valid diagram, all drawn at one size so nothing jumps between steps. */
export function checkStepper(s: { frames?: { caption?: string; diagram?: string }[] } | undefined): string[] {
  if (s === undefined) return [];
  const frames = s.frames ?? [];
  const problems: string[] = [];
  if (frames.length < 3 || frames.length > 6) problems.push("needs 3 to 6 frames");
  if (new Set(frames.map((f) => f.caption)).size !== frames.length) problems.push("frame captions must differ");
  frames.forEach((f, i) => {
    if (!nonEmpty(f.caption)) problems.push(`frame ${i + 1}: caption is empty`);
    problems.push(...checkDiagram(f.diagram).map((p) => `frame ${i + 1}: ${p}`));
  });
  const boxes = new Set(frames.map((f) => /viewBox="([^"]*)"/.exec(f.diagram ?? "")?.[1]));
  if (boxes.size > 1) problems.push("frames must share one viewBox");
  const ids = frames.flatMap((f) => [...(f.diagram ?? "").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  if (new Set(ids).size !== ids.length) problems.push("frames must not repeat an id");
  return problems;
}

/** Every lesson section filled, 5 to 8 explained questions, 2 to 3 exercises, ids on posts. */
function checkLesson(topic: Topic): string[] {
  const l = topic.lesson!;
  const problems: string[] = [];
  // Every section opens with what the reader can do after it.
  const outcome = (name: string, v: string | undefined) => {
    if (!nonEmpty(v)) problems.push(`lesson.${name} outcome is empty`);
    else if (!v!.startsWith("After this you can ")) problems.push(`lesson.${name} outcome must start "After this you can ..."`);
  };
  const section = (name: string, s: { outcome?: string; body?: string } | undefined) => {
    outcome(name, s?.outcome);
    if (!nonEmpty(s?.body)) problems.push(`lesson.${name}.body is empty`);
  };
  if (l.mistakesDiagram !== undefined) problems.push(...checkDiagram(l.mistakesDiagram).map((p) => `lesson.mistakesDiagram ${p}`));
  section("why", l.why);
  section("mentalModel", l.mentalModel);
  section("next", l.next);
  if (l.why?.diagram !== undefined) problems.push(...checkDiagram(l.why.diagram).map((p) => `lesson.why diagram ${p}`));
  problems.push(...checkDiagram(l.mentalModel?.diagram).map((p) => `lesson.mentalModel diagram ${p}`));
  for (const name of ["howItWorks", "workedExample"] as const) {
    outcome(name, l[name]?.outcome);
    if (!pairs(l[name]?.steps, "step", "explanation")) problems.push(`lesson.${name} needs steps`);
    // A flow or worked walk-through needs a diagram beside its steps (docs/ideas.md idea 3).
    if (name === "howItWorks") problems.push(...checkStepper(l.howItWorks?.stepper).map((p) => `lesson.howItWorks stepper ${p}`));
    problems.push(...checkDiagram(l[name]?.diagram).map((p) => `lesson.${name} diagram ${p}`));
  }
  for (const name of ["mistakesOutcome", "checkOutcome", "postsOutcome", "differOutcome", "exercisesOutcome"] as const) {
    outcome(name, l[name]);
  }
  if (!Array.isArray(l.quiz) || l.quiz.length < 5 || l.quiz.length > 8) problems.push("lesson.quiz needs 5 to 8 questions");
  (l.quiz ?? []).forEach((q, i) => {
    const where = `lesson.quiz ${i + 1}`;
    if (!nonEmpty(q.question)) problems.push(`${where}: question is empty`);
    if (!Array.isArray(q.options) || q.options.length < 2 || !q.options.every(nonEmpty)) problems.push(`${where}: needs 2+ options`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= (q.options?.length ?? 0)) problems.push(`${where}: correct is not a valid option`);
    if (!nonEmpty(q.why)) problems.push(`${where}: no explanation of the right answer`);
    q.options?.forEach((_, j) => {
      if (j !== q.correct && !nonEmpty(q.wrong?.[j])) problems.push(`${where}: option ${j + 1} has no explanation of why it is wrong`);
    });
    // Check yourself sits in the concept part, before the posts, so it may only test the concept.
    if (!(CONCEPT_SECTION_IDS as readonly string[]).includes(q.teaches)) {
      problems.push(`${where}: teaches "${q.teaches}", but quiz questions may only test concept sections (${CONCEPT_SECTION_IDS.join(", ")})`);
    }
  });
  problems.push(...checkQuizPositions(l.quiz ?? []));
  if (!QUIZ_STYLE_PENDING.includes(topic.slug)) problems.push(...checkQuizStyle(l.quiz ?? []));
  if (!Array.isArray(l.exercises) || l.exercises.length < 2 || l.exercises.length > 3) problems.push("lesson.exercises needs 2 to 3");
  const order = ["apply", "design", "scale"];
  const levels = (l.exercises ?? []).map((x) => order.indexOf(x.level));
  if (levels.some((v, i) => i > 0 && v <= levels[i - 1])) problems.push("lesson.exercises must rise in difficulty: apply, design, scale");
  (l.exercises ?? []).forEach((x, i) => {
    const where = `lesson.exercises ${i + 1}`;
    if (!["apply", "design", "scale"].includes(x.level)) problems.push(`${where}: level must be apply, design or scale`);
    if (x.diagram !== undefined) problems.push(...checkDiagram(x.diagram).map((p) => `${where}: diagram ${p}`));
    for (const f of ["prompt", "answer", "tradeoffs"] as const) if (!nonEmpty(x[f])) problems.push(`${where}: ${f} is empty`);
    if (!Array.isArray(x.wrongAnswers) || !x.wrongAnswers.length || !x.wrongAnswers.every(nonEmpty)) problems.push(`${where}: needs common wrong answers`);
    if (!(LESSON_SECTIONS as readonly string[]).includes(x.teaches)) problems.push(`${where}: teaches "${x.teaches}" is not a section id`);
  });
  const ids = topic.posts.map((p) => p.id);
  if (ids.some((id) => !nonEmpty(id))) problems.push("every post needs a stable id");
  if (new Set(ids).size !== ids.length) problems.push("post ids must be unique");
  return problems;
}

/** Every topic must have `summary`, and `prerequisiteReasons` when it has prerequisites. Set to false only while backfilling a new field. */
const REQUIRE_NEW_FIELDS = true;
/** Flip to true once every content/topics/*.json has `thirtySeconds`. */
const REQUIRE_THIRTY_SECONDS = true;

/** A unit stuck to its number ("500ms", "100TB", "8M"): write "500 ms", "100 TB", "8 million". */
const UNIT_NO_SPACE = /\d(?:ms|μs|s|[KMGT]?B|[KMGT]b|Gbps|M|K)\b/;
const wordCount = (v: string) => v.trim().split(/\s+/).length;
/** Phrasing the site never uses: em dashes and the "it's not X, it's Y" pattern. */
/** Wording that comments on a figure instead of describing it. */
const EDITORIAL = /headline|\bfirst limit|\bsecond limit|\bthe post['’]s\b/i;
export const BANNED_PHRASING = /—|\bit['’]s not\b|\bnot (?:just|only|merely)\b|\bisn['’]t (?:just|only|merely)\b/i;

/** Rules for `pullQuote`: the post is one of the topic's, the text is one sentence under 25 words. The wording itself is checked against the page by scripts/verify-quotes.mjs (no excerpt is stored, so the build cannot). */
export function checkPullQuote(topic: Topic): string[] {
  const q = topic.pullQuote;
  if (q === undefined) return [];
  const problems: string[] = [];
  if (!nonEmpty(q.text)) return ["pullQuote.text is empty"];
  if (!topic.posts.some((p) => p.id === q.postId)) problems.push(`pullQuote.postId "${q.postId}" is not one of the topic's posts`);
  if (wordCount(q.text) >= 25) problems.push(`pullQuote.text is ${wordCount(q.text)} words, must be under 25`);
  if (/[.!?]\s+\S/.test(q.text.trim())) problems.push("pullQuote.text must be one sentence");
  return problems;
}

/** Rules for `summary`: counts, lengths, figure references, digits that come from the page, banned phrasing. */
export function checkSummary(topic: Topic): string[] {
  const s = topic.summary;
  if (!s) return REQUIRE_NEW_FIELDS ? ["summary is missing"] : [];
  const problems: string[] = [];
  if (!Array.isArray(s.points) || s.points.length < 3 || s.points.length > 5) problems.push("summary.points needs 3 to 5 sentences");
  // Digits in a point must already be on the page, so a summary cannot introduce a figure.
  const { summary: _s, prerequisiteReasons: _r, ...page } = topic;
  const source = JSON.stringify(page);
  (s.points ?? []).forEach((p, i) => {
    const where = `summary.points ${i + 1}`;
    const n = nonEmpty(p) ? wordCount(p) : 0;
    if (n < 8 || n > 28) problems.push(`${where}: ${n} words, needs 8 to 28`);
    if (nonEmpty(p) && !/[.!?]$/.test(p.trim())) problems.push(`${where}: must end with a full stop`);
    if (BANNED_PHRASING.test(p)) problems.push(`${where}: banned phrasing`);
    if (UNIT_NO_SPACE.test(p)) problems.push(`${where}: put a space between a number and its unit ("500 ms")`);
    for (const d of p.match(/\d[\d,.]*\d|\d/g) ?? []) if (!source.includes(d)) problems.push(`${where}: "${d}" does not appear in the topic content`);
  });
  if (!Array.isArray(s.figures) || s.figures.length > 3) problems.push("summary.figures needs 0 to 3 entries");
  const numbersIn = (t: string) => (t.match(/\d[\d,.]*\d|\d/g) ?? []);
  (s.figures ?? []).forEach((f, i) => {
    const where = `summary.figures ${i + 1}`;
    const post = topic.posts.find((p) => p.id === f.postId);
    const row = post?.digest.numbers[f.row];
    if (!post) return problems.push(`${where}: no post with id "${f.postId}"`);
    if (!Number.isInteger(f.row) || !row) return problems.push(`${where}: post "${f.postId}" has no numbers row ${f.row}`);
    if (!nonEmpty(f.label)) return problems.push(`${where}: label is required`);
    const n = wordCount(f.label);
    if (n < 4 || n > 15) problems.push(`${where}: label is ${n} words, needs 4 to 15`);
    if (BANNED_PHRASING.test(f.label) || EDITORIAL.test(f.label)) problems.push(`${where}: banned or editorial phrasing in label`);
    if (f.label.includes(":")) problems.push(`${where}: no "label: value" colon in a label; write it as a phrase`);
    if (UNIT_NO_SPACE.test(f.label)) problems.push(`${where}: put a space between a number and its unit ("500 ms")`);
    // Context numbers may come from the referenced row, another row of the same post's table, or the post's year.
    const rowText = `${row.value} ${row.meaning}`;
    const context = `${rowText} ${post.digest.numbers.map((n) => `${n.value} ${n.meaning}`).join(" ")} ${post.published?.slice(0, 4) ?? ""}`;
    for (const d of numbersIn(f.label)) if (!context.includes(d)) problems.push(`${where}: "${d}" is not in the post's numbers or its year`);
    const own = numbersIn(row.value);
    if (own.length && !own.some((d) => f.label.includes(d))) problems.push(`${where}: label must contain the figure's value (${row.value})`);
  });
  return problems;
}

/** Rules for `thirtySeconds`: length, sentence count, banned phrasing, and no invented figure (every digit run is already in the topic JSON, and a figure needs a post's company and year). */
export function checkThirtySeconds(topic: Topic): string[] {
  const t = topic.thirtySeconds;
  if (t === undefined) return REQUIRE_THIRTY_SECONDS ? ["thirtySeconds is missing"] : [];
  if (!nonEmpty(t)) return ["thirtySeconds is empty"];
  const problems: string[] = [];
  const n = wordCount(t);
  if (n < 55 || n > 100) problems.push(`thirtySeconds: ${n} words, needs 55 to 100`);
  const sentences = (t.trim().match(/[.!?](?=\s|$)/g) ?? []).length;
  if (sentences < 4 || sentences > 6) problems.push(`thirtySeconds: ${sentences} sentences, needs 4 to 6`);
  if (/[—–]/.test(t) || BANNED_PHRASING.test(t) || /\bnot\b[^.!?]*\bbut\b/i.test(t)) problems.push("thirtySeconds: banned phrasing");
  if (UNIT_NO_SPACE.test(t)) problems.push('thirtySeconds: put a space between a number and its unit ("500 ms")');
  const { thirtySeconds: _t, ...page } = topic;
  const source = JSON.stringify(page);
  const digits = t.match(/\d+/g) ?? [];
  for (const d of new Set(digits)) if (!source.includes(d)) problems.push(`thirtySeconds: "${d}" does not appear in the topic content`);
  if (digits.length) {
    const named = topic.posts.filter((p) => t.includes(p.company));
    if (!named.length) problems.push("thirtySeconds: a number needs a company name from the topic's posts");
    else if (!named.some((p) => t.includes(p.published.slice(0, 4)))) problems.push("thirtySeconds: a number needs the year of the named company's post");
  }
  return problems;
}

/** Rules for `prerequisiteReasons`: one sentence for each prerequisite and none for anything else, no digits. */
export function checkReasons(topic: Topic): string[] {
  const r = topic.prerequisiteReasons;
  if (!r) return REQUIRE_NEW_FIELDS && topic.prerequisites.length ? ["prerequisiteReasons is missing"] : [];
  const problems: string[] = [];
  for (const p of topic.prerequisites) if (!nonEmpty(r[p])) problems.push(`prerequisiteReasons: no reason for "${p}"`);
  for (const [id, text] of Object.entries(r)) {
    const where = `prerequisiteReasons.${id}`;
    if (!topic.prerequisites.includes(id)) problems.push(`${where}: not a prerequisite of this topic`);
    if (!nonEmpty(text)) continue;
    const n = wordCount(text);
    if (n < 8 || n > 30) problems.push(`${where}: ${n} words, needs 8 to 30`);
    if (!/[.!?]$/.test(text.trim())) problems.push(`${where}: must end with a full stop`);
    if (/\d/.test(text)) problems.push(`${where}: no digits`);
    if (BANNED_PHRASING.test(text)) problems.push(`${where}: banned phrasing`);
  }
  return problems;
}

/** Rules for a post's optional `stillCitedBy`: a title, a year and an https URL. */
export function stillCitedProblems(s: Post["stillCitedBy"]): string[] {
  if (!s) return [];
  const problems: string[] = [];
  if (!(nonEmpty(s.title) && nonEmpty(s.url) && s.year > 0)) problems.push("stillCitedBy needs title, url and year");
  if (nonEmpty(s.url)) {
    const bad = httpsUrlProblem(s.url);
    if (bad) problems.push(`stillCitedBy.url ${bad}`);
  }
  return problems;
}

function validate(entries: { file: string; topic: Topic }[]): string[] {
  const problems: string[] = [];
  const slugs = new Set<string>();

  for (const { file, topic } of entries) {
    if (`${topic.slug}.json` !== file) problems.push(`${file}: slug "${topic.slug}" does not match the file name`);
    if (slugs.has(topic.slug)) problems.push(`${file}: duplicate slug "${topic.slug}"`);
    slugs.add(topic.slug);
    if (topic.shortTitle !== undefined && (!nonEmpty(topic.shortTitle) || topic.shortTitle.length >= topic.title.length)) {
      problems.push(`${file}: shortTitle must be a non-empty name shorter than the title`);
    }
    if (topic.group && !GROUPS.includes(topic.group)) problems.push(`${file}: unknown group "${topic.group}"`);
    if (topic.description !== undefined) {
      const words = topic.description.trim().split(/\s+/).length;
      if (words < 8 || !/\.$/.test(topic.description.trim())) problems.push(`${file}: description must be a sentence of at least 8 words that ends with a period`);
      if (topic.description.length >= 155) problems.push(`${file}: description is ${topic.description.length} characters, must be under 155`);
    }
    if (topic.interviewRelevance !== undefined && !INTERVIEW_RELEVANCE.includes(topic.interviewRelevance)) {
      problems.push(`${file}: interviewRelevance must be one of ${INTERVIEW_RELEVANCE.join(", ")}`);
    }
    for (const p of checkPullQuote(topic)) problems.push(`${file}: ${p}`);
  }

  for (const { file, topic } of entries) {
    for (const p of topic.prerequisites ?? []) {
      if (!slugs.has(p)) problems.push(`${file}: prerequisite "${p}" has no topic file`);
      if (p === topic.slug) problems.push(`${file}: lists itself as a prerequisite`);
    }

    for (const field of topic.lesson ? (["title", "concept"] as const) : (["title", "concept", "primer"] as const)) {
      if (!nonEmpty(topic[field])) problems.push(`${file}: ${field} is empty`);
    }
    if (!topic.posts?.length) problems.push(`${file}: has no posts`);
    if ((topic.posts?.length ?? 0) >= 2 && !nonEmpty(topic.comparison)) {
      problems.push(`${file}: has ${topic.posts.length} posts but no comparison`);
    }
    if (topic.comparisonDiagram !== undefined) problems.push(...checkDiagram(topic.comparisonDiagram).map((p) => `${file}: comparisonDiagram ${p}`));
    if (nonEmpty(topic.comparison)) {
      const paras = topic.comparison!.split("\n\n").filter(nonEmpty).length;
      if (paras < 2 || paras > 3) problems.push(`${file}: comparison has ${paras} paragraphs; break it into 2 to 3 short ones (shared ground, where they diverge, the evidence)`);
    }
    if (!pairs(topic.glossary, "term", "definition")) problems.push(`${file}: glossary needs entries with term and definition`);
    for (const g of topic.glossary ?? []) if (g.diagram !== undefined) problems.push(...checkDiagram(g.diagram).map((p) => `${file}: glossary "${g.term}" diagram ${p}`));
    if (!Array.isArray(topic.mistakes) || topic.mistakes.length !== 3 || !topic.mistakes.every(nonEmpty)) {
      problems.push(`${file}: mistakes needs exactly 3 items`);
    }
    problems.push(...checkSummary(topic).map((p) => `${file}: ${p}`), ...checkReasons(topic).map((p) => `${file}: ${p}`), ...checkThirtySeconds(topic).map((p) => `${file}: ${p}`));
    if (topic.lesson) {
      problems.push(...checkLesson(topic).map((p) => `${file}: ${p}`));
    } else {
      if (!pairs(topic.quiz, "question", "answer") || topic.quiz!.length < 3 || topic.quiz!.length > 5) {
        problems.push(`${file}: quiz needs 3 to 5 questions with answers`);
      }
      if (!nonEmpty(topic.exercise?.prompt) || !nonEmpty(topic.exercise?.answer)) {
        problems.push(`${file}: exercise needs a prompt and a model answer`);
      }
    }

    (topic.posts ?? []).forEach((post, i) => {
      const where = `${file}: post ${i + 1} (${post.company ?? "unknown"})`;
      for (const field of ["title", "url", "company"] as const) {
        if (!nonEmpty(post[field])) problems.push(`${where}: ${field} is empty`);
      }
      if (nonEmpty(post.url)) {
        const bad = httpsUrlProblem(post.url);
        if (bad) problems.push(`${where}: url ${bad}`);
      }
      if (!isPastDate(post.verifiedOn)) problems.push(`${where}: verifiedOn must be a YYYY-MM-DD date, not in the future`);
      if (isUndated(post)) {
        if (!nonEmpty(post.edition)) problems.push(`${where}: an undated source needs an edition label such as "no date shown, v3.5 documentation"`);
        if (!nonEmpty(post.ageNote)) problems.push(`${where}: an undated source needs an ageNote`);
      } else if (!isPastDate(post.published)) problems.push(`${where}: published must be a YYYY-MM-DD date, not in the future`);
      else if (isOld(post.published) && !nonEmpty(post.ageNote)) {
        problems.push(`${where}: published ${post.published}, over ${OLD_POST_YEARS} years ago, so it needs an ageNote (CLAUDE.md rule 3)`);
      }
      problems.push(...stillCitedProblems(post.stillCitedBy).map((p) => `${where}: ${p}`));
      for (const r of post.related ?? []) {
        if (!slugs.has(r)) problems.push(`${where}: related topic "${r}" has no topic file`);
      }
      const d = post.digest;
      if (!d) return problems.push(`${where}: missing digest`);
      for (const field of ["problem", "constraints", "failures", "takeaways"] as const) {
        if (!nonEmpty(d[field])) problems.push(`${where}: digest.${field} is empty`);
      }
      if (!pairs(d.walkthrough, "step", "explanation")) problems.push(`${where}: digest.walkthrough needs steps`);
      if (!pairs(d.numbers, "value", "meaning")) problems.push(`${where}: digest.numbers needs {value, meaning} entries`);
      if (!nonEmpty(d.tradeoffs?.chosen) || (d.tradeoffs?.rejected !== undefined && !nonEmpty(d.tradeoffs.rejected)) || !nonEmpty(d.tradeoffs?.why)) {
        problems.push(`${where}: digest.tradeoffs needs chosen and why, and rejected only if the source names an alternative`);
      }
      problems.push(...checkDiagram(d.diagram).map((p) => `${where}: diagram ${p}`));
      if (d.chart !== undefined) problems.push(...checkChart(d.chart, d.numbers).map((p) => `${where}: ${p}`));
      problems.push(...checkFigure(d.figure, d.numbers, post.id).map((p) => `${where}: ${p}`));
    });
  }

  // The roadmap must be a DAG: a cycle would leave no valid reading order.
  const bySlug = new Map(entries.map((e) => [e.topic.slug, e.topic]));
  const state = new Map<string, "visiting" | "done">();
  const visit = (slug: string, trail: string[]) => {
    if (state.get(slug) === "done") return;
    if (state.get(slug) === "visiting") {
      problems.push(`prerequisite cycle: ${[...trail.slice(trail.indexOf(slug)), slug].join(" -> ")}`);
      return;
    }
    state.set(slug, "visiting");
    for (const p of bySlug.get(slug)?.prerequisites ?? []) if (bySlug.has(p)) visit(p, [...trail, slug]);
    state.set(slug, "done");
  };
  for (const slug of bySlug.keys()) visit(slug, []);

  return problems;
}

export function getTopic(slug: string): Topic | undefined {
  return getAllTopics().find((t) => t.slug === slug);
}

/** Topics that list `slug` as a prerequisite. */
export function getDependents(slug: string): Topic[] {
  return getAllTopics().filter((t) => t.prerequisites.includes(slug));
}
