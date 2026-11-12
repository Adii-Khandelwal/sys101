import fs from "node:fs";
import path from "node:path";
import { bannedPhrasing, realDate } from "./design";
import { httpsUrlProblem } from "./httpsUrl";
import { metaDescription } from "./site";

export type InterviewClaim = { text: string; sourceId: string };
export type InterviewSource = { id: string; title: string; url: string; company: string; published: string; edition: string; verifiedOn: string; terms: string };
export type Interview = {
  slug: string;
  title: string;
  summary: string;
  sections: { id: string; heading: string; claims: InterviewClaim[] }[];
  noGuidance: { company: string; note: string }[];
  sources: InterviewSource[];
};

const FILE = path.join(process.cwd(), "content", "interview-process.json");
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const QUOTE = /[“”"]([^“”"]*)[“”"]/g;

/** Every claim must cite a source that exists (the page renders that source's company and date above its claims) and say nothing no official page says (interviewers changing constraints). */
export function interviewProblems(d: Interview): string[] {
  const p: string[] = [];
  const add = (m: string) => p.push(`interview-process.json: ${m}`);
  for (const k of ["title", "summary"] as const) if (!nonEmpty(d[k])) add(`${k} is empty`);
  if (d.slug !== "how-it-goes") add('slug must be "how-it-goes"');
  const src = new Map<string, InterviewSource>();
  (d.sources ?? []).forEach((s) => {
    if (src.has(s.id)) add(`source id "${s.id}" is used twice`);
    src.set(s.id, s);
    for (const k of ["id", "title", "company", "edition", "terms"] as const) if (!nonEmpty(s[k])) add(`source ${s.id}: ${k} is empty`);
    const bad = httpsUrlProblem(s.url);
    if (bad) add(`source ${s.id}: url ${bad}`);
    if (!realDate(s.verifiedOn)) add(`source ${s.id}: verifiedOn must be a real date`);
    if (s.published !== "no date shown" && !/^\d{1,2} \w{3} \d{4}$/.test(s.published)) add(`source ${s.id}: published must be "no date shown" or a date as the page shows it`);
  });
  if (!src.size) add("sources is empty");
  if (!d.sections?.length) add("sections is empty");
  const used = new Set<string>();
  const quotes = new Map<string, number>();
  (d.sections ?? []).forEach((s) => {
    if (!nonEmpty(s.id) || !nonEmpty(s.heading) || !s.claims?.length) add(`section "${s.id}" needs an id, a heading and claims`);
    (s.claims ?? []).forEach((c, i) => {
      const w = `${s.id}[${i}]`;
      const so = src.get(c.sourceId);
      if (!so) return add(`${w} cites "${c.sourceId}", which is not in sources`);
      used.add(so.id);
      const spans = [...c.text.matchAll(QUOTE)];
      if (spans.some((m) => m[1].split(/\s+/).length > 25)) add(`${w} quotes more than 25 words`);
      if (spans.length) quotes.set(so.id, (quotes.get(so.id) ?? 0) + spans.length);
    });
  });
  quotes.forEach((n, id) => n > 1 && add(`source ${id} is quoted ${n} times; one short quote per source`));
  src.forEach((_s, id) => !used.has(id) && add(`source ${id} backs no claim`));
  for (const c of ["Google", "Uber", "Rubrik", "Netflix", "Apple"]) if (!d.noGuidance?.some((n) => n.company === c)) add(`noGuidance must list ${c}`);
  const all: string[] = [];
  JSON.stringify(d, (_k, v) => (typeof v === "string" && all.push(v), v));
  for (const s of all) {
    if (bannedPhrasing(s)) add(`banned phrasing in "${s.slice(0, 50)}"`);
    if (/\bconstraints?\b/i.test(s)) add(`no official page says interviewers change constraints; remove "${s.slice(0, 50)}"`);
  }
  return p;
}

/** The page, validated. Thrown during static generation, so a bad file fails the build. */
export function getInterview(): Interview {
  const d = JSON.parse(fs.readFileSync(FILE, "utf8")) as Interview;
  const problems = interviewProblems(d);
  if (problems.length) throw new Error(`Invalid content in content/interview-process.json:\n- ${problems.join("\n- ")}`);
  return d;
}

export const interviewUpdated = (d: Pick<Interview, "sources">) => d.sources.map((s) => s.verifiedOn).reduce((a, b) => (b > a ? b : a));
export const interviewDescription = (d: Pick<Interview, "summary">) => metaDescription(d.summary);
