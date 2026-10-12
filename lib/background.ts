import fs from "node:fs";
import path from "node:path";
import { topicNumbers, topicOrder } from "./order";
import { BANNED_PHRASING, NO_DATE, getAllTopics, type Topic } from "./topics";

/** One page a post cites as assuming the concept. `quote` is the sentence from that post, copied from its page. */
export type AssumedBy = { postId: string; quote: string };

/** An official page that explains the concept: opened and checked on `verifiedOn`. */
export type BackgroundSource = { title: string; publisher: string; url: string; year: string; verifiedOn: string };

export type BackgroundItem = {
  id: string;
  name: string;
  /** Two plain lines in our voice. For a concept taught later in the course, one line that says the gist is enough. */
  explanation: string;
  assumedBy: AssumedBy[];
  /** Our own topic page for the concept, when there is one. Linked, never re-explained. */
  topicPage?: string;
  /** Official sources, with publisher and year. Required when there is no topic page. */
  sources?: BackgroundSource[];
};

/** content/background/<topic-slug>.json: what the posts of one topic assume beyond the topic itself. */
export type Background = { topic: string; /** YYYY-MM-DD: when the file was last edited. Used as the sitemap lastmod. */ updatedOn: string; items: BackgroundItem[] };

const DIR = path.join(process.cwd(), "content", "background");
/** The explanation of a concept taught later is a single line this long at most. */
export const GIST_MAX_WORDS = 32;
export const EXPLANATION_MAX_WORDS = 60;

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const words = (t: string) => t.trim().split(/\s+/).length;
const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);
const YEAR = /^(\d{4}|no date shown|page shows last updated \d{4}-\d{2}-\d{2})$/;

/** A quote as shown inside our own quotation marks: its inner double quotes become single, the usual way to nest them. */
export const displayQuote = (q: string) => q.replace(/\u201C/g, "\u2018").replace(/\u201D/g, "\u2019");

/** Is this concept taught on a topic page that comes after `slug` in the course? Uses the one shared reading order. */
export function isTaughtLater(item: Pick<BackgroundItem, "topicPage">, slug: string, numbers: Map<string, number>) {
  return !!item.topicPage && (numbers.get(item.topicPage) ?? 0) > (numbers.get(slug) ?? 0);
}

/** Everything wrong with one background file. Run at load, so a bad file fails the build like a bad topic does. */
export function validateBackground(file: string, b: Background, topics: Topic[]): string[] {
  const problems: string[] = [];
  const bySlug = new Map(topics.map((t) => [t.slug, t]));
  const numbers = topicNumbers(topicOrder(topics));
  const topic = bySlug.get(b.topic);
  if (`${b.topic}.json` !== file) problems.push(`${file}: topic "${b.topic}" does not match the file name`);
  if (!topic) return [...problems, `${file}: no topic "${b.topic}"`];
  if (!isDate(b.updatedOn)) problems.push(`${file}: updatedOn must be a YYYY-MM-DD date`);
  else if (new Date(`${b.updatedOn}T00:00:00Z`).getTime() > Date.now() + 24 * 60 * 60 * 1000) problems.push(`${file}: updatedOn is in the future`);
  if (!Array.isArray(b.items) || b.items.length === 0) return [...problems, `${file}: items is empty`];
  const ids = new Set<string>();
  b.items.forEach((it, i) => {
    const where = `${file}: item ${i + 1} (${it.id ?? "no id"})`;
    if (!nonEmpty(it.id) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(it.id)) problems.push(`${where}: id must be lowercase words joined by hyphens`);
    else if (ids.has(it.id)) problems.push(`${where}: duplicate id`);
    else ids.add(it.id);
    if (!nonEmpty(it.name)) problems.push(`${where}: name is empty`);
    if (!nonEmpty(it.explanation)) problems.push(`${where}: explanation is empty`);
    else {
      const n = words(it.explanation);
      if (n < 8) problems.push(`${where}: explanation is ${n} words, needs at least 8`);
      if (BANNED_PHRASING.test(it.explanation)) problems.push(`${where}: explanation has banned phrasing`);
      if (n > EXPLANATION_MAX_WORDS) problems.push(`${where}: explanation is ${n} words, at most ${EXPLANATION_MAX_WORDS}`);
    }
    if (!Array.isArray(it.assumedBy) || it.assumedBy.length === 0) problems.push(`${where}: needs at least one assumedBy`);
    const seenPosts = new Set<string>();
    (it.assumedBy ?? []).forEach((a, j) => {
      const at = `${where}: assumedBy ${j + 1}`;
      if (!topic.posts.some((p) => p.id === a.postId)) problems.push(`${at}: no post "${a.postId}" in ${topic.slug}`);
      if (seenPosts.has(a.postId)) problems.push(`${at}: post "${a.postId}" listed twice, one sentence per post`);
      seenPosts.add(a.postId);
      if (!nonEmpty(a.quote)) problems.push(`${at}: quote is empty`);
      else if (a.quote.length > 400 || BANNED_PHRASING.test(a.quote)) problems.push(`${at}: quote is too long or contains an em dash`);
    });
    if (it.topicPage !== undefined) {
      if (!bySlug.has(it.topicPage)) problems.push(`${where}: topicPage "${it.topicPage}" has no topic file`);
      if (it.topicPage === b.topic) problems.push(`${where}: topicPage is the topic itself`);
    }
    const sources = it.sources ?? [];
    if (!it.topicPage && sources.length === 0) problems.push(`${where}: with no topic page it needs an official source`);
    if (isTaughtLater(it, b.topic, numbers)) {
      if (sources.length) problems.push(`${where}: a concept taught later links forward only, with no source`);
      if (nonEmpty(it.explanation) && words(it.explanation) > GIST_MAX_WORDS) problems.push(`${where}: a concept taught later gets a one-line gist of at most ${GIST_MAX_WORDS} words`);
      if (nonEmpty(it.explanation) && !/gist is enough/i.test(it.explanation)) problems.push(`${where}: the gist must say that the gist is enough`);
    } else {
      if (nonEmpty(it.explanation) && /gist is enough/i.test(it.explanation)) problems.push(`${where}: only a concept taught later says the gist is enough`);
      // The page does not link back to an earlier topic, so the reader needs the official source instead.
      if (sources.length === 0) problems.push(`${where}: a concept not taught later is shown with its official source, so it needs one`);
    }
    const urls = new Set<string>();
    sources.forEach((s, j) => {
      const at = `${where}: source ${j + 1}`;
      for (const f of ["title", "publisher", "url"] as const) if (!nonEmpty(s[f])) problems.push(`${at}: ${f} is empty`);
      if (nonEmpty(s.url) && !/^https:\/\//.test(s.url)) problems.push(`${at}: url must be https`);
      if (urls.has(s.url)) problems.push(`${at}: duplicate url`);
      urls.add(s.url);
      if (!YEAR.test(s.year ?? "")) problems.push(`${at}: year must be a four-digit year, "${NO_DATE}", or "page shows last updated YYYY-MM-DD"`);
      if (!isDate(s.verifiedOn)) problems.push(`${at}: verifiedOn must be a YYYY-MM-DD date`);
    });
  });
  return problems;
}

/** Every background file, checked. Sorted by topic title to match the rest of the site. */
export function getAllBackground(): Background[] {
  if (!fs.existsSync(DIR)) return [];
  const topics = getAllTopics();
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
  const all = files.map((f) => ({ f, b: JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Background }));
  const problems = all.flatMap(({ f, b }) => validateBackground(f, b, topics));
  if (problems.length) throw new Error(`Invalid content in content/background:\n- ${problems.join("\n- ")}`);
  const title = new Map(topics.map((t) => [t.slug, t.title]));
  return all.map((x) => x.b).sort((a, b) => (title.get(a.topic) ?? "").localeCompare(title.get(b.topic) ?? ""));
}

export const getBackground = (slug: string) => getAllBackground().find((b) => b.topic === slug) ?? null;

/** Where a topic's background section is, or undefined when the topic has none. The topic page shows its link only then. */
export const backgroundHref = (slug: string) => (getBackground(slug) ? `/background#${slug}` : undefined);

/** The latest edit across all background files: the sitemap lastmod for /background. */
export const backgroundUpdated = () => getAllBackground().reduce((a, b) => (b.updatedOn > a ? b.updatedOn : a), "");
