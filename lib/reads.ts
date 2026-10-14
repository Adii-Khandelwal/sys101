import fs from "node:fs";
import path from "node:path";
import type { Topic } from "./topics";

export const READ_THEMES = [
  "Storing data",
  "Caching, sharding and moving data",
  "Traffic and resilience",
  "Platforms and building blocks",
  "Seeing and changing production",
] as const;
export type ReadTheme = (typeof READ_THEMES)[number];

/** A phrase copied from an opened page. Only the checkers read it; it is never displayed. */
type Phrase = { phrase: string; url?: string };

export type Read = {
  id: string;
  title: string;
  company: string;
  kind: "post" | "paper";
  /** YYYY-MM-DD or YYYY: exactly what the page shows. */
  published: string;
  theme: ReadTheme;
  url: string;
  /** The page that shows the date, when the entry itself (a PDF) does not. */
  dateUrl?: string;
  /** One plain sentence. Only a "stated" entry may say anything about adoption, and only what `claim` backs. */
  whyItMatters: string;
  influence: "stated" | "writeup";
  /** Required for "stated": the adopter's or the company's own sentence, on `url` unless it names another page. */
  claim?: Phrase;
  /** 1 to 3 phrases from the entry's own page that back the description. */
  evidence: string[];
  topics: string[];
  openedOn: string;
  verifiedOn: string;
};

const DIR = path.join(process.cwd(), "content", "reads");
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
// Words that say a piece mattered to others. Only a "stated" entry, with its claim phrase, may use them.
const IMPACT = /\b(influential|influenced|widely|adopted|adoption|popular|popularised|popularized|standard|seminal|industry|everyone|became|copied|famous|classic|landmark|legend\w*|pioneer\w*|revolution\w*)\b/i;
const ATTRIBUTION = /\b(says?|calls?|states?|announces?|tells?|notes?|reports?)\b/i;
const BANNED = /—|–|interview|it'?s not .{1,40}, it'?s|not .{1,40} but /i;

/** Everything the build checks about the list. Returns messages; empty means the data is sound. */
export function readProblems(reads: Read[], topicSlugs: string[], files: string[] = reads.map((r) => `${r.id}.json`)): string[] {
  const out: string[] = [];
  const seen = { id: new Set<string>(), url: new Set<string>() };
  reads.forEach((r, i) => {
    const bad = (m: string) => out.push(`${r.id ?? files[i]}: ${m}`);
    if (files[i] !== `${r.id}.json` || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id)) bad(`id must be a kebab-case slug that matches the file name`);
    if (seen.id.has(r.id)) bad("duplicate id");
    seen.id.add(r.id);
    if (!r.title || !r.company) bad("title and company are required");
    if (r.kind !== "post" && r.kind !== "paper") bad(`kind must be "post" or "paper"`);
    if (!/^\d{4}(-\d{2}-\d{2})?$/.test(r.published)) bad(`published "${r.published}" must be YYYY or YYYY-MM-DD`);
    if (!READ_THEMES.includes(r.theme)) bad(`unknown theme "${r.theme}"`);
    const links = [r.url, r.dateUrl, r.claim?.url].filter(Boolean) as string[];
    for (const u of links) {
      let url: URL | null = null;
      try {
        url = new URL(u);
      } catch {}
      if (!url || url.protocol !== "https:" || url.username || url.password) bad(`"${u}" must be an https URL without credentials`);
    }
    if (seen.url.has(r.url)) bad("duplicate url");
    seen.url.add(r.url);

    const n = words(r.whyItMatters).length;
    if (n < 12 || n > 30) bad(`whyItMatters is ${n} words, needs 12 to 30`);
    if (BANNED.test(r.whyItMatters)) bad("whyItMatters has an em dash, an interview claim or banned phrasing");
    const evidenceText = [...r.evidence, r.claim?.phrase ?? ""].join(" ");
    for (const d of r.whyItMatters.match(/\d+/g) ?? []) if (!evidenceText.includes(d)) bad(`whyItMatters has the number ${d}, which no evidence phrase contains`);
    if (r.evidence.length < 1 || r.evidence.length > 3 || r.evidence.some((p) => words(p).length > 15 || !p.trim())) bad("evidence is 1 to 3 phrases of at most 15 words");
    if (r.influence === "stated") {
      if (!r.claim || !r.claim.phrase.trim() || words(r.claim.phrase).length > 15) bad(`"stated" needs a claim phrase of at most 15 words`);
      if (!ATTRIBUTION.test(r.whyItMatters)) bad(`a "stated" sentence must attribute the claim (says, calls, announces, tells ...)`);
    } else if (r.influence === "writeup") {
      if (r.claim) bad(`"writeup" entries carry no claim`);
      if (IMPACT.test(r.whyItMatters)) bad(`"writeup" entries describe what the post explains and say nothing about impact`);
    } else bad(`influence must be "stated" or "writeup"`);
    for (const t of r.topics) if (!topicSlugs.includes(t)) bad(`topic "${t}" does not exist`);
    if (!ISO.test(r.openedOn) || !ISO.test(r.verifiedOn) || r.verifiedOn < r.openedOn) bad("openedOn and verifiedOn must be dates, verifiedOn not before openedOn");
  });
  for (const theme of READ_THEMES) if (reads.filter((r) => r.theme === theme).length < 3) out.push(`theme "${theme}" has fewer than 3 entries; fold it into another`);
  return out;
}

/** Every entry in content/reads, validated. A bad file fails the build. */
export function getAllReads(topicSlugs: string[]): Read[] {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort() : [];
  const reads = files.map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Read);
  const problems = readProblems(reads, topicSlugs, files);
  if (problems.length) throw new Error(`content/reads:\n  ${problems.join("\n  ")}`);
  return reads;
}

export type ReadRow = Read & {
  year: string;
  /** Topics where this very URL is already a source (computed from the topic files, never typed). */
  sourceOn: { slug: string; title: string; postId: string }[];
  /** Topics it connects to that do not already list it. */
  related: { slug: string; title: string }[];
};

/** The page's data: themes in a fixed order, oldest first within each, with the topic links worked out. */
export function buildReads(reads: Read[], topics: Topic[]) {
  const titleOf = new Map(topics.map((t) => [t.slug, t.title]));
  const rows: ReadRow[] = reads.map((r) => {
    const sourceOn = topics.flatMap((t) => t.posts.filter((p) => p.url === r.url).map((p) => ({ slug: t.slug, title: t.title, postId: p.id! })));
    return {
      ...r,
      year: r.published.slice(0, 4),
      sourceOn,
      related: r.topics.filter((s) => !sourceOn.some((x) => x.slug === s)).map((slug) => ({ slug, title: titleOf.get(slug)! })),
    };
  });
  const byTheme = READ_THEMES.map((theme) => ({
    theme,
    id: theme.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    reads: rows.filter((r) => r.theme === theme).sort((a, b) => a.published.localeCompare(b.published) || a.title.localeCompare(b.title)),
  }));
  return { total: rows.length, themeCount: byTheme.length, byTheme };
}
export type ReadsData = ReturnType<typeof buildReads>;

export const readsUpdated = (reads: Pick<Read, "verifiedOn">[]) => reads.reduce((a, r) => (r.verifiedOn > a ? r.verifiedOn : a), "");

export const readsDescription = (d: { total: number; themeCount: number }) =>
  `${d.total} posts and papers chosen because others adopted what they introduced, or because they are simply excellent, in ${d.themeCount} themes.`;
