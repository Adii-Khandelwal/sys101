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
  title: string;
  /** Attribution only: the digest is the content. */
  url: string;
  company: string;
  /** YYYY-MM-DD: when someone last opened the post and checked the digest against it. */
  verifiedOn: string;
  digest: Digest;
};

/** Index headings, in curriculum order. */
export const GROUPS = ["Foundations", "Scaling", "Data"] as const;
export type Group = (typeof GROUPS)[number];

export type Topic = {
  slug: string;
  title: string;
  group?: Group;
  concept: string;
  prerequisites: string[];
  /** Recap of what the prerequisites taught, 2 to 4 sentences. */
  primer: string;
  posts: Post[];
  /** How the posts' approaches differ and why; required when a topic has two or more posts. */
  comparison?: string;
  glossary: { term: string; definition: string }[];
  /** Exactly three. */
  mistakes: string[];
  /** Three to five. */
  quiz: { question: string; answer: string }[];
  exercise: { prompt: string; answer: string };
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

    for (const field of ["title", "concept", "primer"] as const) {
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
    if (!pairs(topic.quiz, "question", "answer") || topic.quiz.length < 3 || topic.quiz.length > 5) {
      problems.push(`${file}: quiz needs 3 to 5 questions with answers`);
    }
    if (!nonEmpty(topic.exercise?.prompt) || !nonEmpty(topic.exercise?.answer)) {
      problems.push(`${file}: exercise needs a prompt and a model answer`);
    }

    (topic.posts ?? []).forEach((post, i) => {
      const where = `${file}: post ${i + 1} (${post.company ?? "unknown"})`;
      for (const field of ["title", "url", "company"] as const) {
        if (!nonEmpty(post[field])) problems.push(`${where}: ${field} is empty`);
      }
      if (!isPastDate(post.verifiedOn)) problems.push(`${where}: verifiedOn must be a YYYY-MM-DD date, not in the future`);
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
