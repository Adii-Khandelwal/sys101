import fs from "node:fs";
import path from "node:path";
import { BANNED_PHRASING, checkQuizPositions, checkQuizStyle, type LessonQuestion, type Post } from "./topics";
import { evaluate } from "./formula";
import { httpsUrlProblem } from "./httpsUrl";
import { SITE_NAME, SITE_URL, absoluteUrl, metaDescription } from "./site";

/** A source the capstone cites. Same fields as a topic post, without the digest (the post itself lives on its topic). */
export type CapstoneSource = Pick<Post, "title" | "url" | "company" | "published" | "verifiedOn"> & { id: string };

export type NodeState = "ok" | "degraded" | "down";
export const NODE_STATES: readonly NodeState[] = ["ok", "degraded", "down"];

export type Capstone = {
  slug: string;
  title: string;
  summary: string;
  /** Finished topics this capstone combines, each with what it contributes here. */
  topics: { slug: string; role: string }[];
  brief: { text: string; requirements: { label: string; value: string; sourceId: string }[] };
  decisions: {
    id: string;
    question: string;
    options: { label: string; why: string }[];
    answerIndex: number;
    realChoice: { company: string; text: string; sourceId: string };
  }[];
  sizing: {
    inputs: { id: string; label: string; min: number; max: number; step: number; default: number; unit?: string }[];
    /** `formula` uses input ids, numbers, + - * / ( ) and ceil, floor, round, min, max (lib/formula.ts). */
    outputs: { label: string; formula: string; unit?: string }[];
  };
  diagram: {
    title: string;
    nodes: { id: string; label: string; topic: string; company: string; tradeoff: string; to?: string[] }[];
    failures: { id: string; label: string; effects: { nodeId: string; state: Exclude<NodeState, "ok"> }[] }[];
  };
  /** "Where they differ": 2 to 3 paragraphs separated by a blank line, like a topic's comparison. */
  compare: string;
  quiz: LessonQuestion[];
  sources: CapstoneSource[];
};

const DIR = path.join(process.cwd(), "content", "capstones");
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z][a-z0-9_-]*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Everything the build checks about one capstone file. `topicSlugs` are the slugs that exist. */
export function capstoneProblems(c: Capstone, file: string, topicSlugs: readonly string[]): string[] {
  const p: string[] = [];
  const add = (m: string) => p.push(`${file}: ${m}`);
  const arr = (v: unknown, name: string): boolean => (Array.isArray(v) && v.length > 0 ? true : (add(`${name} is missing or empty`), false));
  const unique = (ids: string[], name: string) => ids.forEach((id, i) => ids.indexOf(id) !== i && add(`${name} id "${id}" is used twice`));

  if (c.slug !== file.replace(/\.json$/, "")) add(`slug "${c.slug}" must equal the file name`);
  for (const k of ["title", "summary"] as const) if (!nonEmpty(c[k])) add(`${k} is empty`);

  const sourceIds = (c.sources ?? []).map((s) => s.id);
  if (arr(c.sources, "sources")) {
    unique(sourceIds, "source");
    c.sources.forEach((s, i) => {
      for (const k of ["id", "title", "company"] as const) if (!nonEmpty(s[k])) add(`sources[${i}].${k} is empty`);
      const bad = httpsUrlProblem(s.url);
      if (bad) add(`sources[${i}].url ${bad}`);
      if (!/^\d{4}(-\d{2}-\d{2})?$/.test(s.published ?? "")) add(`sources[${i}].published must be YYYY or YYYY-MM-DD, as the source shows it`);
      if (!DATE.test(s.verifiedOn ?? "")) add(`sources[${i}].verifiedOn must be YYYY-MM-DD`);
    });
  }
  const source = (id: string, where: string) => sourceIds.includes(id) || add(`${where} cites source "${id}", which is not in sources`);

  const roleSlugs = (c.topics ?? []).map((t) => t.slug);
  if (arr(c.topics, "topics")) {
    unique(roleSlugs, "topic");
    c.topics.forEach((t) => {
      if (!topicSlugs.includes(t.slug)) add(`topics: "${t.slug}" is not an existing topic`);
      if (!nonEmpty(t.role)) add(`topics: "${t.slug}" has no role`);
    });
  }

  if (!nonEmpty(c.brief?.text)) add("brief.text is empty");
  if (arr(c.brief?.requirements, "brief.requirements")) {
    c.brief.requirements.forEach((r, i) => {
      if (!nonEmpty(r.label) || !nonEmpty(r.value)) add(`brief.requirements[${i}] needs a label and a value`);
      source(r.sourceId, `brief.requirements[${i}]`);
    });
  }

  if (arr(c.decisions, "decisions")) {
    unique(c.decisions.map((d) => d.id), "decision");
    c.decisions.forEach((d) => {
      const w = `decision "${d.id}"`;
      if (!ID.test(d.id ?? "")) add(`${w}: id must be lowercase letters, digits, - or _`);
      if (!nonEmpty(d.question)) add(`${w}: question is empty`);
      if (!Array.isArray(d.options) || d.options.length < 2 || d.options.some((o) => !nonEmpty(o.label) || !nonEmpty(o.why))) add(`${w}: needs 2 or more options, each with a label and a why`);
      else if (!Number.isInteger(d.answerIndex) || d.answerIndex < 0 || d.answerIndex >= d.options.length) add(`${w}: answerIndex is out of range`);
      if (!nonEmpty(d.realChoice?.company) || !nonEmpty(d.realChoice?.text)) add(`${w}: realChoice needs a company and text`);
      source(d.realChoice?.sourceId, w);
    });
  }

  const inputs = c.sizing?.inputs ?? [];
  const vars: Record<string, number> = {};
  if (arr(inputs, "sizing.inputs")) {
    unique(inputs.map((i) => i.id), "sizing input");
    inputs.forEach((i) => {
      const w = `sizing input "${i.id}"`;
      if (!/^[a-z][a-z0-9_]*$/.test(i.id ?? "")) add(`${w}: id must be lowercase letters, digits or _`);
      if (!nonEmpty(i.label)) add(`${w}: label is empty`);
      if (![i.min, i.max, i.step, i.default].every(Number.isFinite) || !(i.min < i.max) || !(i.step > 0) || i.default < i.min || i.default > i.max) add(`${w}: needs min < max, step > 0 and a default between them`);
      vars[i.id] = i.default;
    });
  }
  if (arr(c.sizing?.outputs, "sizing.outputs")) {
    c.sizing.outputs.forEach((o, i) => {
      if (!nonEmpty(o.label)) add(`sizing.outputs[${i}].label is empty`);
      // Evaluated at the defaults, all inputs at min, all at max, and each input alone at its min and max, so a divide by zero in range fails the build.
      const ends = ["min", "max"] as const;
      const corners = [
        vars,
        ...ends.map((k) => Object.fromEntries(inputs.map((x) => [x.id, x[k]]))),
        ...inputs.flatMap((x) => ends.map((k) => ({ ...vars, [x.id]: x[k] }))),
      ];
      try {
        for (const v of corners) if (!Number.isFinite(evaluate(o.formula, v))) throw new Error("not a finite number");
      } catch (e) {
        add(`sizing.outputs[${i}] "${o.label}": ${(e as Error).message}`);
      }
    });
  }

  const nodeIds = (c.diagram?.nodes ?? []).map((n) => n.id);
  if (!nonEmpty(c.diagram?.title)) add("diagram.title is empty");
  if (arr(c.diagram?.nodes, "diagram.nodes")) {
    unique(nodeIds, "diagram node");
    c.diagram.nodes.forEach((n) => {
      for (const k of ["label", "company", "tradeoff"] as const) if (!nonEmpty(n[k])) add(`diagram node "${n.id}": ${k} is empty`);
      if (!ID.test(n.id ?? "")) add(`diagram node "${n.id}": id must be lowercase letters, digits, - or _`);
      if (!roleSlugs.includes(n.topic)) add(`diagram node "${n.id}": topic "${n.topic}" is not in this capstone's topics`);
      for (const t of n.to ?? []) if (!nodeIds.includes(t)) add(`diagram node "${n.id}": links to unknown node "${t}"`);
    });
  }
  if (arr(c.diagram?.failures, "diagram.failures")) {
    unique(c.diagram.failures.map((f) => f.id), "failure");
    c.diagram.failures.forEach((f) => {
      if (!nonEmpty(f.label)) add(`failure "${f.id}": label is empty`);
      if (!Array.isArray(f.effects) || f.effects.length === 0) add(`failure "${f.id}": needs at least one effect`);
      for (const e of f.effects ?? []) {
        if (!nodeIds.includes(e.nodeId)) add(`failure "${f.id}": unknown node "${e.nodeId}"`);
        if (e.state !== "degraded" && e.state !== "down") add(`failure "${f.id}": state must be "degraded" or "down"`);
      }
    });
  }

  if (!nonEmpty(c.compare)) add("compare is empty");
  else {
    const paras = c.compare.split("\n\n").filter(nonEmpty).length;
    if (paras < 2 || paras > 3) add(`compare has ${paras} paragraphs; break it into 2 or 3`);
  }

  if (!Array.isArray(c.quiz) || c.quiz.length < 3 || c.quiz.length > 8) add("quiz needs 3 to 8 questions");
  else {
    const before = p.length;
    c.quiz.forEach((q, i) => {
      const w = `quiz ${i + 1}`;
      if (!nonEmpty(q.question) || !nonEmpty(q.why)) add(`${w}: needs a question and a why`);
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.some((o) => !nonEmpty(o))) add(`${w}: needs 2 or more non-empty options`);
      else if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) add(`${w}: correct is out of range`);
      else if (!Array.isArray(q.wrong) || q.wrong.length !== q.options.length || q.wrong.some((x, j) => j !== q.correct && !nonEmpty(x))) add(`${w}: wrong needs one explanation per option`);
      if (!roleSlugs.includes(q.teaches)) add(`${w}: teaches "${q.teaches}" is not one of this capstone's topics`);
    });
    if (p.length === before) for (const m of [...checkQuizPositions(c.quiz), ...checkQuizStyle(c.quiz)]) add(m);
  }

  // Em dashes and "it's not X" phrasing anywhere in the text.
  const strings: string[] = [];
  JSON.stringify(c, (_k, v) => (typeof v === "string" && strings.push(v), v));
  for (const s of strings) if (BANNED_PHRASING.test(s)) add(`banned phrasing in "${s.slice(0, 50)}"`);
  return p;
}

/** Every capstone, validated. Thrown during static generation, so a bad file fails the build. */
export function getAllCapstones(topicSlugs: readonly string[]): Capstone[] {
  if (!fs.existsSync(DIR)) return [];
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  const all = files.map((f) => ({ f, c: JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Capstone }));
  const problems = all.flatMap(({ f, c }) => capstoneProblems(c, f, topicSlugs));
  if (problems.length) throw new Error(`Invalid content in content/capstones:\n- ${problems.join("\n- ")}`);
  return all.map((x) => x.c);
}

/** The newest source check, which is the page's "last updated" date. */
export const capstoneUpdated = (c: Pick<Capstone, "sources">) => c.sources.map((s) => s.verifiedOn).reduce((a, b) => (b > a ? b : a));

export const capstoneDescription = (c: Pick<Capstone, "summary">) => metaDescription(c.summary);

/** LearningResource JSON-LD for a capstone page, built only from what the page shows. */
export function capstoneLd(c: Capstone, topicTitles: Map<string, string>) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: c.title,
    description: capstoneDescription(c),
    url: absoluteUrl(`/capstone/${c.slug}`),
    inLanguage: "en",
    learningResourceType: "Capstone",
    dateModified: capstoneUpdated(c),
    competencyRequired: c.topics.map((t) => topicTitles.get(t.slug) ?? t.slug),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}
