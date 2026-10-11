import fs from "node:fs";
import path from "node:path";

/** A post rewritten in our own words, in reading order. */
export type Digest = {
  problem: string;
  constraints: string;
  walkthrough: { step: string; explanation: string }[];
  /** Inline SVG markup drawn for this post, styled by the dg-* classes in globals.css. */
  diagram: string;
  numbers: { value: string; meaning: string }[];
  tradeoffs: { chosen: string; rejected: string; why: string };
  failures: string;
  takeaways: string;
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
  /** YYYY-MM-DD: when the company published the post. Shown on the page. */
  published: string;
  /** Required for posts older than OLD_POST_YEARS: why it still passes rule 3, and what may have changed. */
  ageNote?: string;
  /** A newer source, opened by us, that still points to this post. */
  stillCitedBy?: { title: string; url: string; year: number };
  /** Topic slugs this post also teaches, linked from the post. */
  related?: string[];
  digest: Digest;
};

/** Index headings, in curriculum order. */
export const GROUPS = ["Foundations", "Scaling", "Data"] as const;
export type Group = (typeof GROUPS)[number];

/** A concept section in the lesson format: one line on what you can do after it, then the teaching. */
export type LessonSection = { outcome: string; body: string };

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

export type LessonExercise = {
  level: "apply" | "design" | "scale";
  prompt: string;
  answer: string;
  tradeoffs: string;
  wrongAnswers: string[];
  /** Section id that teaches the idea, linked from the answer. */
  teaches: string;
};

/** The teaching-journey format (docs/ideas.md, ideas 2 and 4). Piloted on DNS. */
export type Lesson = {
  why: LessonSection;
  mentalModel: LessonSection & { diagram: string };
  howItWorks: { outcome: string; steps: { step: string; explanation: string }[] };
  workedExample: { outcome: string; steps: { step: string; explanation: string }[] };
  mistakesOutcome: string;
  checkOutcome: string;
  quiz: LessonQuestion[];
  postsOutcome: string;
  differOutcome: string;
  exercisesOutcome: string;
  exercises: LessonExercise[];
  next: LessonSection;
};

/** Section ids a quiz answer may link back to. */
export const LESSON_SECTIONS = ["why", "model", "how", "example", "mistakes", "posts", "differ"] as const;
/** Sections in the concept part, which comes before the posts. */
export const CONCEPT_SECTION_IDS = ["why", "model", "how", "example", "mistakes"] as const;

export type Topic = {
  slug: string;
  title: string;
  group?: Group;
  concept: string;
  prerequisites: string[];
  /** Recap of what the prerequisites taught, 2 to 4 sentences. Not used by lesson topics. */
  primer?: string;
  /** New page format; when present it replaces primer, quiz and exercise. */
  lesson?: Lesson;
  posts: Post[];
  /** How the posts' approaches differ and why; required when a topic has two or more posts. */
  comparison?: string;
  glossary: { term: string; definition: string }[];
  /** Exactly three. */
  mistakes: string[];
  /** Three to five. Not used by lesson topics. */
  quiz?: { question: string; answer: string }[];
  exercise?: { prompt: string; answer: string };
};

const TOPICS_DIR = path.join(process.cwd(), "content", "topics");

export function getAllTopics(): Topic[] {
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

/** Posts older than this must explain why they still pass rule 3 (see CLAUDE.md). */
export const OLD_POST_YEARS = 5;

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
  section("why", l.why);
  section("mentalModel", l.mentalModel);
  section("next", l.next);
  problems.push(...checkDiagram(l.mentalModel?.diagram).map((p) => `lesson.mentalModel diagram ${p}`));
  for (const name of ["howItWorks", "workedExample"] as const) {
    outcome(name, l[name]?.outcome);
    if (!pairs(l[name]?.steps, "step", "explanation")) problems.push(`lesson.${name} needs steps`);
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
  if (!Array.isArray(l.exercises) || l.exercises.length < 2 || l.exercises.length > 3) problems.push("lesson.exercises needs 2 to 3");
  const order = ["apply", "design", "scale"];
  const levels = (l.exercises ?? []).map((x) => order.indexOf(x.level));
  if (levels.some((v, i) => i > 0 && v <= levels[i - 1])) problems.push("lesson.exercises must rise in difficulty: apply, design, scale");
  (l.exercises ?? []).forEach((x, i) => {
    const where = `lesson.exercises ${i + 1}`;
    if (!["apply", "design", "scale"].includes(x.level)) problems.push(`${where}: level must be apply, design or scale`);
    for (const f of ["prompt", "answer", "tradeoffs"] as const) if (!nonEmpty(x[f])) problems.push(`${where}: ${f} is empty`);
    if (!Array.isArray(x.wrongAnswers) || !x.wrongAnswers.length || !x.wrongAnswers.every(nonEmpty)) problems.push(`${where}: needs common wrong answers`);
    if (!(LESSON_SECTIONS as readonly string[]).includes(x.teaches)) problems.push(`${where}: teaches "${x.teaches}" is not a section id`);
  });
  const ids = topic.posts.map((p) => p.id);
  if (ids.some((id) => !nonEmpty(id))) problems.push("every post needs a stable id");
  if (new Set(ids).size !== ids.length) problems.push("post ids must be unique");
  return problems;
}

/** Diagrams are hand-written SVG; enforce the site's design rules on them. */
function checkDiagram(svg: string | undefined): string[] {
  if (!nonEmpty(svg)) return ["is empty"];
  const problems: string[] = [];
  if (!/^<svg[\s>]/.test(svg!.trim())) problems.push("must start with <svg");
  if (!/viewBox=/.test(svg!)) problems.push("needs a viewBox so it scales");
  if (!/<title[^>]*>[^<]+<\/title>/.test(svg!)) problems.push("needs a <title> for screen readers");
  if (/gradient|<filter|drop-shadow|<script|\son\w+=/i.test(svg!)) problems.push("uses gradients, filters, shadows or scripts");
  return problems;
}

function validate(entries: { file: string; topic: Topic }[]): string[] {
  const problems: string[] = [];
  const slugs = new Set<string>();

  for (const { file, topic } of entries) {
    if (`${topic.slug}.json` !== file) problems.push(`${file}: slug "${topic.slug}" does not match the file name`);
    if (slugs.has(topic.slug)) problems.push(`${file}: duplicate slug "${topic.slug}"`);
    slugs.add(topic.slug);
    if (topic.group && !GROUPS.includes(topic.group)) problems.push(`${file}: unknown group "${topic.group}"`);
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
    if (!pairs(topic.glossary, "term", "definition")) problems.push(`${file}: glossary needs entries with term and definition`);
    if (!Array.isArray(topic.mistakes) || topic.mistakes.length !== 3 || !topic.mistakes.every(nonEmpty)) {
      problems.push(`${file}: mistakes needs exactly 3 items`);
    }
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
      if (!isPastDate(post.verifiedOn)) problems.push(`${where}: verifiedOn must be a YYYY-MM-DD date, not in the future`);
      if (!isPastDate(post.published)) problems.push(`${where}: published must be a YYYY-MM-DD date, not in the future`);
      else if (isOld(post.published) && !nonEmpty(post.ageNote)) {
        problems.push(`${where}: published ${post.published}, over ${OLD_POST_YEARS} years ago, so it needs an ageNote (CLAUDE.md rule 3)`);
      }
      if (post.stillCitedBy && !(nonEmpty(post.stillCitedBy.title) && nonEmpty(post.stillCitedBy.url) && post.stillCitedBy.year > 0)) {
        problems.push(`${where}: stillCitedBy needs title, url and year`);
      }
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
      if (!nonEmpty(d.tradeoffs?.chosen) || !nonEmpty(d.tradeoffs?.rejected) || !nonEmpty(d.tradeoffs?.why)) {
        problems.push(`${where}: digest.tradeoffs needs chosen, rejected and why`);
      }
      problems.push(...checkDiagram(d.diagram).map((p) => `${where}: diagram ${p}`));
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
