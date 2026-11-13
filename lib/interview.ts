import fs from "node:fs";
import path from "node:path";
import { bannedPhrasing, realDate } from "./design";
import { httpsUrlProblem } from "./httpsUrl";
import { metaDescription } from "./site";

export type InterviewParagraph = { text: string; cites: string[] };
export type InterviewSource = { id: string; title: string; url: string; company: string; published: string; edition: string; verifiedOn: string; terms: string };
export type Interview = {
  slug: string;
  title: string;
  summary: string;
  sections: { id: string; heading: string; paragraphs: InterviewParagraph[] }[];
  noGuidance: { company: string; note: string }[];
  sources: InterviewSource[];
};

const FILE = path.join(process.cwd(), "content", "interview-process.json");
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const QUOTE = /[“”"]([^“”"]*)[“”"]/g;

/** Every paragraph must cite sources that exist and name each cited company in its own text, so a reader always knows whose page says it. */
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
    if ((s.paragraphs?.length ?? 0) > 6 || (s.paragraphs?.length ?? 2) < 2) add(`section "${s.id}" needs 2 to 6 paragraphs`);
    if (!nonEmpty(s.id) || !nonEmpty(s.heading) || !s.paragraphs?.length) add(`section "${s.id}" needs an id, a heading and paragraphs`);
    (s.paragraphs ?? []).forEach((c, i) => {
      const w = `${s.id}[${i}]`;
      if (!nonEmpty(c.text)) return add(`${w} has no text`);
      if (/\n/.test(c.text)) add(`${w} has a line break inside its text`);
      if (!c.cites?.length) return add(`${w} cites no source`);
      for (const id of c.cites) {
        const so = src.get(id);
        if (!so) { add(`${w} cites "${id}", which is not in sources`); continue; }
        used.add(id);
        if (!c.text.includes(so.company)) add(`${w} cites ${id} but does not name ${so.company}`);
        if (c.cites.indexOf(id) !== c.cites.lastIndexOf(id)) add(`${w} cites ${id} twice`);
      }
      const spans = [...c.text.matchAll(QUOTE)];
      if (spans.some((m) => m[1].split(/\s+/).length > 25)) add(`${w} quotes more than 25 words`);
      // a quote counts against its first cited source
      if (spans.length) quotes.set(c.cites[0], (quotes.get(c.cites[0]) ?? 0) + spans.length);
    });
  });
  quotes.forEach((n, id) => n > 1 && add(`source ${id} is quoted ${n} times; one short quote per source`));
  src.forEach((_s, id) => !used.has(id) && add(`source ${id} is cited by no paragraph`));
  for (const c of ["Google", "Uber", "Rubrik", "Netflix", "Apple"]) if (!d.noGuidance?.some((n) => n.company === c)) add(`noGuidance must list ${c}`);
  const all: string[] = [];
  JSON.stringify(d, (_k, v) => (typeof v === "string" && all.push(v), v));
  for (const s of all) {
    if (bannedPhrasing(s)) add(`banned phrasing in "${s.slice(0, 50)}"`);
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
