import fs from "node:fs";
import path from "node:path";

// "Start from zero" learn pages: a beginner's path through one topic, built
// only from official sources (see CLAUDE.md, Learn pages and Official sources).

/** A written official source: a standard, a project's or vendor's docs, or a university's course pages. */
export type WrittenSource = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  kind: string;
  /** Year published, or "no date shown". */
  year: string;
  /** YYYY-MM-DD: when we last opened it. */
  verifiedOn: string;
  /** Extra detail shown with the source, such as a software version. */
  note?: string;
};

/** A video from an official, university or recognized conference channel. */
export type VideoSource = WrittenSource & { kind: "video"; channel: string; length: string };

export type Source = WrittenSource | VideoSource;

export type Term = { term: string; definition: string };

/** Where to read: a source id, the specific section, and what to look for in it. */
export type Reading = { source: string; section: string; what: string };

export type Stage = {
  id: string;
  name: string;
  /** Paragraphs in our own words. Cite a source inline as [[source-id]]. */
  body: string[];
  terms: Term[];
  reading: Reading[];
  /** Optional original SVG diagram in the site style, same rules as topic diagrams. */
  diagram?: string;
  /** Optional video: a source id of kind "video". */
  video?: string;
  /** Untracked checklist: what the reader can now do. */
  canNow: string[];
};

export type Learn = {
  /** Topic slug this page belongs to. */
  slug: string;
  promise: string;
  before: { prerequisites: string[]; terms: Term[]; note?: string };
  stages: Stage[];
  misconceptions: { myth: string; truth: string }[];
  tryIt: { intro: string; commands: { command: string; shows: string; source: string; note?: string }[] };
  next: string;
  sources: Source[];
};

export const STAGE_NAMES = ["Basics", "How it works", "Going deeper", "In practice and trade-offs"] as const;

const LEARN_DIR = path.join(process.cwd(), "content", "learn");

const nonEmpty = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const isVideo = (s: Source): s is VideoSource => s.kind === "video";
const CITE = /\[\[([a-z0-9-]+)\]\]/g;

/** Source ids cited inline in a piece of text. */
export const citations = (text: string) => [...text.matchAll(CITE)].map((m) => m[1]);

/** Diagrams are hand-written SVG; enforce the site's design rules (same as topic diagrams). */
function checkDiagram(svg: string | undefined): string[] {
  if (!nonEmpty(svg)) return ["is empty"];
  const problems: string[] = [];
  if (!/^<svg[\s>]/.test(svg!.trim())) problems.push("must start with <svg");
  if (!/viewBox=/.test(svg!)) problems.push("needs a viewBox so it scales");
  if (!/<title[^>]*>[^<]+<\/title>/.test(svg!)) problems.push("needs a <title> for screen readers");
  if (/gradient|<filter|drop-shadow|<script|\son\w+=/i.test(svg!)) problems.push("uses gradients, filters, shadows or scripts");
  return problems;
}

/** Every rule the build enforces on a learn page. Returns the problems found. */
export function checkLearn(l: Learn, topicSlugs: string[]): string[] {
  const problems: string[] = [];
  const ids = new Map<string, Source>();
  for (const s of l.sources ?? []) {
    const where = `source "${s.id}"`;
    if (ids.has(s.id)) problems.push(`${where} is listed twice`);
    ids.set(s.id, s);
    for (const f of ["title", "url", "publisher", "kind", "year", "verifiedOn"] as const) {
      if (!nonEmpty(s[f])) problems.push(`${where} is missing ${f}`);
    }
    if (nonEmpty(s.verifiedOn) && !/^\d{4}-\d{2}-\d{2}$/.test(s.verifiedOn)) problems.push(`${where}: verifiedOn must be YYYY-MM-DD`);
    if (nonEmpty(s.url) && !/^https:\/\//.test(s.url)) problems.push(`${where}: url must be https`);
    if (isVideo(s)) {
      for (const f of ["channel", "length", "year"] as const) if (!nonEmpty(s[f])) problems.push(`${where}: a video needs its ${f}`);
    }
  }
  const known = (id: string, where: string) => {
    if (!ids.has(id)) problems.push(`${where}: unknown source id "${id}"`);
  };

  if (!nonEmpty(l.promise)) problems.push("promise is empty");
  for (const p of l.before?.prerequisites ?? []) if (!topicSlugs.includes(p)) problems.push(`before: unknown topic "${p}"`);

  if (!Array.isArray(l.stages) || l.stages.length !== STAGE_NAMES.length) problems.push(`needs exactly ${STAGE_NAMES.length} stages`);
  (l.stages ?? []).forEach((st, i) => {
    const where = `stage ${i + 1} (${st.name})`;
    if (st.name !== STAGE_NAMES[i]) problems.push(`${where}: should be named "${STAGE_NAMES[i]}"`);
    if (!Array.isArray(st.body) || !st.body.some(nonEmpty)) problems.push(`${where} is empty`);
    if (!Array.isArray(st.canNow) || !st.canNow.length) problems.push(`${where} needs a "You can now" list`);
    st.body?.forEach((p) => citations(p).forEach((id) => known(id, where)));
    st.reading?.forEach((r) => {
      known(r.source, `${where} reading`);
      if (!nonEmpty(r.section) || !nonEmpty(r.what)) problems.push(`${where}: each reading needs a section and what to read`);
    });
    const official = (st.reading ?? []).some((r) => ids.has(r.source) && !isVideo(ids.get(r.source)!));
    if (!official) problems.push(`${where} has no official written source`);
    if (st.diagram !== undefined) problems.push(...checkDiagram(st.diagram).map((p) => `${where} diagram ${p}`));
    if (st.video) {
      known(st.video, `${where} video`);
      if (ids.has(st.video) && !isVideo(ids.get(st.video)!)) problems.push(`${where}: "${st.video}" is not a video`);
    }
  });

  (l.misconceptions ?? []).forEach((m) => citations(`${m.myth} ${m.truth}`).forEach((id) => known(id, "misconceptions")));
  (l.tryIt?.commands ?? []).forEach((c) => known(c.source, `try it "${c.command}"`));
  citations(l.next ?? "").forEach((id) => known(id, "where to go next"));
  return problems;
}

/** All learn pages, validated; an invalid one fails the build. */
export function getAllLearn(topicSlugs: string[]): Learn[] {
  if (!fs.existsSync(LEARN_DIR)) return [];
  const pages = fs
    .readdirSync(LEARN_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((file) => ({ file, learn: JSON.parse(fs.readFileSync(path.join(LEARN_DIR, file), "utf8")) as Learn }));
  const problems = pages.flatMap(({ file, learn }) => [
    ...(`${learn.slug}.json` !== file ? [`slug "${learn.slug}" does not match the file name`] : []),
    ...(topicSlugs.includes(learn.slug) ? [] : [`no topic "${learn.slug}"`]),
    ...checkLearn(learn, topicSlugs),
  ].map((p) => `${file}: ${p}`));
  if (problems.length) throw new Error(`Invalid content in content/learn:\n- ${problems.join("\n- ")}`);
  return pages.map((p) => p.learn);
}

export function getLearn(slug: string, topicSlugs: string[]) {
  return getAllLearn(topicSlugs).find((l) => l.slug === slug);
}
