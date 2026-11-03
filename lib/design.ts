import fs from "node:fs";
import path from "node:path";
import { BANNED_PHRASING, NO_DATE, type Post } from "./topics";
import { checkDiagram } from "./diagramCheck";
import { httpsUrlProblem } from "./httpsUrl";
import { SITE_NAME, SITE_URL, absoluteUrl, metaDescription } from "./site";
import { PAGE_ANCHORS, ROUND_LIMITS, SECTIONS_WITH_BLOCKS, STEPS, type StepId } from "./designSteps";

export { STEPS };

export type SourceKind = "post" | "paper" | "reference";

export type DesignSource = Pick<Post, "title" | "url" | "company" | "published" | "verifiedOn"> & {
  id: string;
  kind: SourceKind;
  /** Required for `reference` sources: the licence as read on the source, in words. */
  license?: string;
  /** Required when `published` is "no date shown": the version or edition of the document that was read. */
  edition?: string;
};

type Cites = { cites?: string[] };
export type DesignBlock =
  | ({ type: "p"; text: string } & Cites)
  | ({ type: "list"; items: string[] } & Cites)
  | { type: "assumption"; text: string }
  | { type: "real"; text: string; cites: string[] }
  | { type: "diagram"; title: string; svg: string }
  | { type: "table"; caption: string; columns: string[]; rows: string[][] };
export type DesignStage = { id: string; need: string; add: string; weak: string; diagram?: string };
export type DesignDive = { id: string; title: string; attempt: string; breaks: string; better: string; tradeoff: string; real?: { text: string; cites: string[] } } & Cites;
export type DesignFollowUp = { ask: string; answer: string } & Cites;

type WithTopics = { topics: string[] };
/** What the interviewer asks, what the learner says, and a general habit, shown in a box before the section's details. */
export type DesignRound = { ask: string; say: string; tip: string };
export type DesignSection = WithTopics & DesignRound & { blocks: DesignBlock[] };

export type Design = {
  slug: string;
  title: string;
  summary: string;
  topics: { slug: string; role: string }[];
  capstone?: string;
  "general-tips": { blocks: DesignBlock[]; topics?: string[] };
  clarify: DesignSection;
  requirements: DesignSection;
  entities: DesignSection;
  api: DesignSection;
  "data-model": DesignSection;
  "high-level": DesignSection & { stages: DesignStage[] };
  "deep-dives": WithTopics & DesignRound & { blocks?: DesignBlock[]; dives: DesignDive[]; notes?: string[] };
  "failure-modes": DesignSection;
  "against-the-grain": DesignSection;
  "strong-answer": WithTopics & DesignRound & { talkTrack: string; levels: { mid: string; senior: string; staff: string }; followUps: DesignFollowUp[] };
  mistakes: WithTopics & DesignRound & { items: { mistake: string; fix: string }[] };
  /** "Worth knowing": short hooks from company posts or papers only (never a reference), figures allowed. */
  curiosities?: { id: string; text: string; sourceId: string }[];
  sources: DesignSource[];
};

const DIR = path.join(process.cwd(), "content", "design");
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** YYYY-MM-DD that survives a round trip through Date, so 2026-02-31 fails. */
const realDate = (v: unknown) => typeof v === "string" && DATE.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
/** A figure outside an assumption: any digit or one of these big-number words, unless the block cites a post or paper. */
const BIG_WORDS = /\b(?:hundred|thousand|million|billion|trillion|dozen|percent)s?\b/i;
/** "X is not Y, it is Z" (comma, semicolon or colon) with any subject, "not X but Y", and "A, not a Y: ...". */
const CONTRAST = [/\b(?:is|are)(?: not|n['’]t)\b[^.!?]*[,;:.]\s*(?:it|they|this)(?: is|['’]s| are)\b/i, /\bit is not\b[^.!?]*\bit is\b/i, /\bnot\b[^.!?]*\bbut\b/i, /,\s*not (?:a|an|the)\b[^.!?:;]*:/i];
const rec = (v: unknown): v is Record<string, any> => typeof v === "object" && v !== null && !Array.isArray(v); // eslint-disable-line @typescript-eslint/no-explicit-any
const arr = (v: unknown): v is unknown[] => Array.isArray(v);
// checkDiagram already rejects a style attribute, so only fill and stroke can carry a literal.
const HEX_OR_FN = /(?:fill|stroke)\s*=\s*(?:"[^"]*|'[^']*)(?:#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\()/i;
const YEAR = /(?<![\d.,])(?:199\d|20\d\d)(?![\d])/g;
const QUOTE_CHARS = /["“”„‟«»]/;
/** A quotation: opened by “ « „ ‟ and closed by ” “ », or straight double quotes. */
const QUOTE_SPAN = /[“«„‟]([^”“»]*)[”“»]|"([^"]*)"/g;
// Words of a company name that are ordinary English or legal suffixes, so "cloud" or "services" in prose is not a vendor name.
const GENERIC = new Set(["inc", "corp", "corporation", "ltd", "llc", "the", "and", "for", "cloud", "web", "services", "service", "engineering", "labs", "team", "blog", "group", "technologies", "technology", "software", "systems", "company", "docs", "documentation", "developers", "research", "open", "source", "foundation", "project"]);

const words = (t: string): string[] => t.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

/** Everything the build checks about one design file. `topicSlugs` and `capstoneSlugs` are the slugs that exist. Never throws on a bad shape. */
export function designProblems(d: Design, file: string, topicSlugs: readonly string[], capstoneSlugs: readonly string[] = []): string[] {
  const p: string[] = [];
  const add = (m: string) => p.push(`${file}: ${m}`);
  const unique = (ids: unknown[], name: string) => ids.forEach((id, i) => ids.indexOf(id) !== i && add(`${name} id "${String(id)}" is used twice`));
  if (!rec(d)) return [`${file}: the file is not an object`];

  if (d.slug !== file.replace(/\.json$/, "")) add(`slug "${d.slug}" must equal the file name`);
  for (const k of ["title", "summary"] as const) if (!nonEmpty(d[k])) add(`${k} is empty`);

  const sources = (arr(d.sources) ? d.sources : []) as DesignSource[];
  if (!sources.length) add("sources is missing or empty");
  unique(sources.map((s) => s?.id), "source");
  sources.forEach((s, i) => {
    if (!rec(s)) return add(`sources[${i}] is not an object`);
    for (const k of ["id", "title", "company"] as const) if (!nonEmpty(s[k])) add(`sources[${i}].${k} is empty`);
    const bad = httpsUrlProblem(s.url);
    if (bad) add(`sources[${i}].url ${bad}`);
    if (s.published === NO_DATE) {
      if (!nonEmpty(s.edition)) add(`sources[${i}] has no date shown and needs an edition`);
    } else if (typeof s.published !== "string" || !/^\d{4}(-\d{2}-\d{2})?$/.test(s.published) || (s.published.length === 10 && !realDate(s.published))) add(`sources[${i}].published must be YYYY, YYYY-MM-DD or "${NO_DATE}", as the source shows it`);
    if (!realDate(s.verifiedOn)) add(`sources[${i}].verifiedOn must be a real date, YYYY-MM-DD`);
    if (!["post", "paper", "reference"].includes(s.kind)) add(`sources[${i}].kind must be post, paper or reference`);
    if (s.kind === "reference" && !nonEmpty(s.license)) add(`sources[${i}] is a reference and needs a license`);
  });
  const source = (id: unknown) => sources.find((x) => rec(x) && x.id === id);

  const topicEntries = (arr(d.topics) ? d.topics : []) as Design["topics"];
  const roleSlugs = topicEntries.map((t) => t?.slug);
  if (!roleSlugs.length) add("topics is missing or empty");
  unique(roleSlugs, "topic");
  topicEntries.forEach((t) => {
    if (!rec(t)) return add("topics: an entry is not an object");
    if (!topicSlugs.includes(t.slug)) add(`topics: "${t.slug}" is not an existing topic`);
    if (!nonEmpty(t.role)) add(`topics: "${t.slug}" has no role`);
  });
  if (d.capstone !== undefined && !capstoneSlugs.includes(d.capstone)) add(`capstone "${d.capstone}" does not exist`);

  // Vendor-neutral: a source's company name may appear only in a `real` block (and in a source's own fields).
  const vendorWords = [...new Set(sources.flatMap((s) => (rec(s) && typeof s.company === "string" ? words(s.company) : [])))].filter((x) => x.length >= 3 && !GENERIC.has(x) && !/^\d+$/.test(x));
  const vendorRe = vendorWords.length ? new RegExp(`(?<![\\p{L}\\p{N}])(?:${vendorWords.join("|")})(?![\\p{L}\\p{N}])`, "iu") : null;
  const quotesBySource = new Map<string, number>();

  /** The kinds of the cited sources; reports a cite that is not an id in sources. */
  const cited = (cites: unknown, w: string): SourceKind[] => {
    if (cites === undefined) return [];
    if (!arr(cites)) return (add(`${w}: cites must be an array of source ids`), []);
    const kinds: SourceKind[] = [];
    for (const id of cites) {
      const s = source(id);
      if (!s) add(`${w} cites source "${String(id)}", which is not in sources`);
      else kinds.push(s.kind);
    }
    return kinds;
  };
  /** One piece of prose: vendor-neutral, quotes only in `real`, a figure only in an assumption or beside a post or paper. */
  const prose = (text: unknown, w: string, o: { real?: boolean; assumption?: boolean; kinds?: SourceKind[]; cites?: unknown } = {}) => {
    if (!nonEmpty(text)) return add(`${w} is empty or not text`);
    if (!o.real && vendorRe?.test(text)) add(`${w} names a source company ("${text.match(vendorRe)![0]}"); vendor names belong only in a "How a real system does it" block`);
    if (!o.real && QUOTE_CHARS.test(text)) add(`${w} has quotation marks; only a "How a real system does it" block may quote`);
    // A four-digit year is a date, not a figure, but only in a real block that names one of its cited companies.
    const names: string[] = o.real && arr(o.cites) ? o.cites.flatMap((id): string[] => (source(id) ? words(source(id)!.company) : [])).filter((x) => x.length >= 3 && !GENERIC.has(x)) : [];
    const figureText = names.length && names.some((n) => words(text).includes(n)) ? text.replace(YEAR, "") : text;
    if (!o.assumption && !(o.kinds ?? []).some((k) => k !== "reference") && (/\d/.test(figureText) || BIG_WORDS.test(figureText))) add(`${w} holds a figure; use an assumption block, or cite a post or paper ("${text.slice(0, 40)}")`);
    if (o.real) {
      const spans = [...text.matchAll(QUOTE_SPAN)].map((m) => m[1] ?? m[2] ?? "");
      if (QUOTE_CHARS.test(text.replace(QUOTE_SPAN, ""))) add(`${w} has an unmatched quotation mark`);
      for (const q of spans) if (words(q).length > 25) add(`${w}: a quotation is over 25 words`);
      if (spans.length && arr(o.cites)) for (const id of o.cites) quotesBySource.set(String(id), (quotesBySource.get(String(id)) ?? 0) + spans.length);
    }
  };
  // Section anchors and page anchors are taken, so an SVG id cannot clash with one.
  const diagramIds = new Set<string>([...STEPS.map((x) => x.id), ...PAGE_ANCHORS]);
  const diagram = (svg: unknown, w: string) => {
    if (typeof svg !== "string") return add(`${w}: diagram must be a string`);
    checkDiagram(svg).forEach((m) => add(`${w}: diagram ${m}`));
    if (!/role\s*=\s*"img"/.test(svg)) add(`${w}: diagram needs role="img"`);
    if (HEX_OR_FN.test(svg)) add(`${w}: diagram uses a colour literal; use tokens such as var(--ink)`);
    for (const [, id] of svg.matchAll(/\sid\s*=\s*"([^"]+)"/g)) {
      if (diagramIds.has(id)) add(`${w}: diagram id "${id}" is used by another diagram on this page`);
      diagramIds.add(id);
    }
  };
  const topicList = (list: unknown, w: string) => {
    if (!arr(list)) return add(`${w}: topics must be an array`);
    for (const t of list) if (typeof t !== "string" || !topicSlugs.includes(t)) add(`${w}: topic "${String(t)}" does not exist`);
  };
  const strings = (list: unknown, w: string) => {
    if (!arr(list)) return add(`${w} must be an array`);
    list.forEach((x, i) => prose(x, `${w}[${i}]`));
  };

  const blocks = (list: unknown, w: string) => {
    if (list === undefined) return;
    if (!arr(list)) return add(`${w}: blocks must be an array`);
    list.forEach((b, i) => {
      const bw = `${w} block ${i + 1}`;
      if (!rec(b)) return add(`${bw} is not an object`);
      const kinds = cited(b.cites, bw);
      if (b.cites !== undefined && ["assumption", "diagram", "table"].includes(b.type)) add(`${bw}: a ${b.type} block cannot carry cites`);
      switch (b.type) {
        case "p":
          prose(b.text, `${bw} text`, { kinds });
          break;
        case "list":
          if (!arr(b.items) || !b.items.length) add(`${bw}: list needs items`);
          else b.items.forEach((x, j) => prose(x, `${bw} item ${j + 1}`, { kinds }));
          break;
        case "assumption":
          prose(b.text, `${bw} text`, { assumption: true });
          break;
        case "real":
          if (!arr(b.cites) || !b.cites.length) add(`${bw}: a real block needs at least one cite`);
          prose(b.text, `${bw} text`, { real: true, kinds, cites: b.cites });
          break;
        case "diagram":
          if (!nonEmpty(b.title)) add(`${bw}: diagram needs a title`);
          diagram(b.svg, bw);
          break;
        case "table": {
          if (!nonEmpty(b.caption)) add(`${bw}: table needs a caption`);
          const cols = arr(b.columns) ? b.columns : [];
          if (!cols.length) add(`${bw}: table needs columns`);
          cols.forEach((c, j) => prose(c, `${bw} column ${j + 1}`));
          if (!arr(b.rows) || !b.rows.length) add(`${bw}: table needs rows`);
          else b.rows.forEach((r, j) => (!arr(r) || r.length !== cols.length ? add(`${bw} row ${j + 1}: needs ${cols.length} cells`) : r.forEach((c, k) => prose(c, `${bw} row ${j + 1} cell ${k + 1}`))));
          break;
        }
        default:
          add(`${bw}: unknown block type "${String(b.type)}"`);
      }
    });
  };
  const section = (id: StepId): Record<string, any> | undefined => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const s = (d as unknown as Record<string, unknown>)[id];
    if (!rec(s)) return void add(`section "${id}" is missing or not an object`);
    if (s.topics !== undefined || id !== "general-tips") topicList(s.topics, `section "${id}"`);
    if (id === "general-tips") return s;
    // The round box: what the interviewer asks, what the learner says, one habit. A figure needs an assumption block in the same section.
    const hasAssumption = arr(s.blocks) && s.blocks.some((b) => rec(b) && b.type === "assumption");
    for (const k of ["ask", "say", "tip"] as const) {
      const w = `section "${id}" ${k}`;
      prose(s[k], w, { assumption: hasAssumption });
      if (nonEmpty(s[k])) {
        const n = s[k].trim().split(/\s+/).length;
        const [lo, hi] = ROUND_LIMITS[k];
        if (n < lo || n > hi) add(`${w} has ${n} words; it needs ${lo} to ${hi}`);
      }
    }
    return s;
  };

  for (const id of SECTIONS_WITH_BLOCKS) {
    const s = section(id);
    if (!s) continue;
    blocks(s.blocks, `section "${id}"`);
    if (id !== "high-level" && (!arr(s.blocks) || !s.blocks.length)) add(`section "${id}" needs at least one block`);
  }

  const hl = section("high-level");
  if (hl) {
    const stages = arr(hl.stages) ? hl.stages : [];
    if (!stages.length) add('section "high-level": needs at least one stage');
    unique(stages.map((x) => (rec(x) ? x.id : undefined)), "stage");
    stages.forEach((st, i) => {
      if (!rec(st)) return add(`stage ${i + 1} is not an object`);
      const w = `stage "${st.id}"`;
      if (!nonEmpty(st.id)) add(`stage ${i + 1} needs an id`);
      for (const k of ["need", "add", "weak"]) prose(st[k], `${w} ${k}`);
      if (st.diagram !== undefined) diagram(st.diagram, w);
    });
  }

  const dd = section("deep-dives");
  if (dd) {
    blocks(dd.blocks, 'section "deep-dives"');
    const dives = arr(dd.dives) ? dd.dives : [];
    if (dives.length < 3 || dives.length > 4) add(`section "deep-dives": needs 3 to 4 dives, has ${dives.length}`);
    unique(dives.map((x) => (rec(x) ? x.id : undefined)), "dive");
    dives.forEach((dv, i) => {
      if (!rec(dv)) return add(`dive ${i + 1} is not an object`);
      const w = `dive "${dv.id}"`;
      if (!nonEmpty(dv.id)) add(`dive ${i + 1} needs an id`);
      const kinds = cited(dv.cites, w);
      for (const k of ["title", "attempt", "breaks", "better", "tradeoff"]) prose(dv[k], `${w} ${k}`, { kinds });
      if (dv.real !== undefined) {
        if (!rec(dv.real)) return add(`${w}: real must be an object`);
        if (!arr(dv.real.cites) || !dv.real.cites.length) add(`${w}: real needs at least one cite`);
        prose(dv.real.text, `${w} real`, { real: true, kinds: cited(dv.real.cites, `${w} real`), cites: dv.real.cites });
      }
    });
    if (dd.notes !== undefined) strings(dd.notes, 'section "deep-dives" notes');
  }

  const sa = section("strong-answer");
  if (sa) {
    prose(sa.talkTrack, "strong-answer talkTrack");
    for (const k of ["mid", "senior", "staff"]) prose(rec(sa.levels) ? sa.levels[k] : undefined, `strong-answer level ${k}`);
    const fu = arr(sa.followUps) ? sa.followUps : [];
    if (fu.length < 6 || fu.length > 16) add(`strong-answer: needs 6 to 16 follow-ups, has ${fu.length}`);
    fu.forEach((f, i) => {
      if (!rec(f)) return add(`follow-up ${i + 1} is not an object`);
      const kinds = cited(f.cites, `follow-up ${i + 1}`);
      prose(f.ask, `follow-up ${i + 1} ask`);
      prose(f.answer, `follow-up ${i + 1} answer`, { kinds });
    });
  }

  const ms = section("mistakes");
  if (ms) {
    const items = arr(ms.items) ? ms.items : [];
    if (items.length < 5 || items.length > 8) add(`mistakes: needs 5 to 8 items, has ${items.length}`);
    items.forEach((m, i) => {
      if (!rec(m)) return add(`mistake ${i + 1} is not an object`);
      prose(m.mistake, `mistake ${i + 1}`);
      prose(m.fix, `mistake ${i + 1} fix`);
    });
  }

  const curiosities = d.curiosities ?? [];
  if (!arr(curiosities)) add("curiosities must be an array");
  else {
    if (curiosities.length && (curiosities.length < 4 || curiosities.length > 8)) add(`curiosities needs 4 to 8 entries, has ${curiosities.length}`);
    unique(curiosities.map((c) => (rec(c) ? c.id : undefined)), "curiosity");
    curiosities.forEach((c) => {
      if (!rec(c)) return add("a curiosity is not an object");
      const w = `curiosity "${c.id}"`;
      if (!nonEmpty(c.id) || !nonEmpty(c.text)) add(`${w}: needs an id and text`);
      else {
        if (c.text.trim().split(/\s+/).length > 45) add(`${w}: text is over 45 words`);
        if (vendorRe?.test(c.text)) add(`${w} names a company in its text; the source badge carries the name`);
        if (QUOTE_CHARS.test(c.text)) add(`${w} has quotation marks; only a "How a real system does it" block may quote`);
      }
      const src = source(c.sourceId);
      if (!src) add(`${w} cites source "${c.sourceId}", which is not in sources`);
      else if (src.kind === "reference") add(`${w} cites a reference source; only a post or paper may supply a curiosity`);
    });
  }

  for (const [id, n] of quotesBySource) if (n > 1) add(`source "${id}" is quoted ${n} times; at most one quotation per source`);

  const all: string[] = [];
  JSON.stringify(d, (_k, v) => (typeof v === "string" && all.push(v), v));
  for (const s of all) if (/[—–]/.test(s) || BANNED_PHRASING.test(s) || CONTRAST.some((r) => r.test(s))) add(`banned phrasing in "${s.slice(0, 50)}"`);
  return p;
}

/** Every design page, validated. Thrown during static generation, so a bad file fails the build. No folder means no pages. */
export function getAllDesign(topicSlugs: readonly string[], capstoneSlugs: readonly string[] = []): Design[] {
  if (!fs.existsSync(DIR)) return [];
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  const all = files.map((f) => ({ f, d: JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Design }));
  const problems = all.flatMap(({ f, d }) => designProblems(d, f, topicSlugs, capstoneSlugs));
  if (problems.length) throw new Error(`Invalid content in content/design:\n- ${problems.join("\n- ")}`);
  return all.map((x) => x.d);
}

/** Blocks that carry cites, counted once each: a block with cites (a `real` block always has some), a dive with cites or a real note, a follow-up with cites. */
export function sourcedClaims(d: Design): number {
  const has = (c?: string[]) => Array.isArray(c) && c.length > 0;
  const blockList = [...SECTIONS_WITH_BLOCKS.flatMap((id) => d[id].blocks ?? []), ...(d["deep-dives"].blocks ?? [])];
  return blockList.filter((b) => "cites" in b && has(b.cites)).length + d["deep-dives"].dives.filter((x) => has(x.cites) || x.real).length + d["strong-answer"].followUps.filter((f) => has(f.cites)).length;
}
export const sourcedLine = (d: Design) => `${sourcedClaims(d)} claims are sourced; the rest is the site's own reasoning`;

/** The newest source check, which is the page's "last updated" date. */
export const designUpdated = (d: Pick<Design, "sources">) => d.sources.map((s) => s.verifiedOn).reduce((a, b) => (b > a ? b : a));
export const designDescription = (d: Pick<Design, "summary">) => metaDescription(d.summary);

export function designLd(d: Design, topicTitles: Map<string, string>) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: d.title,
    description: designDescription(d),
    url: absoluteUrl(`/design/${d.slug}`),
    inLanguage: "en",
    learningResourceType: "Design question",
    dateModified: designUpdated(d),
    competencyRequired: d.topics.map((t) => topicTitles.get(t.slug) ?? t.slug),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}
