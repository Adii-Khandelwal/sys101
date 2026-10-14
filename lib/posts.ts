import type { SourceCounts } from "./sourceKinds";
import { GROUPS, type Group, type Topic } from "./topics";

/** One distinct post (by URL). A post taught under two topics has two `topics` entries and two `ids`. */
type IndexedPost = {
  title: string;
  company: string;
  url: string;
  /** Four-digit year, or null when the source shows no date. Never guessed. */
  year: string | null;
  topics: { slug: string; title: string; postId: string }[];
};

export type PostRow = IndexedPost & { key: string };
type TopicBlock = { slug: string; title: string; posts: PostRow[] };
export type PostsIndex = {
  total: number;
  /** Distinct organizations credited (a company with two credits counts once). */
  companyCount: number;
  counts: SourceCounts;
  topicCount: number;
  byTopic: { group: Group; topics: TopicBlock[] }[];
  byCompany: { name: string; id: string; posts: PostRow[] }[];
  /** Newest year first; posts with no date go last under year null. */
  byYear: { year: string | null; id: string; posts: PostRow[] }[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** One company can be credited twice (Amazon, and its Builders' Library): treat it as one organization. */
export const organization = (company: string) => (company.startsWith("Amazon") ? "Amazon" : company);

const isPaper = (p: { ageNote?: string }) => (p.ageNote ?? "").startsWith("This is a research paper");

/** Counts of what the topic files list: posts, papers (marked in ageNote), versioned docs pages (an edition that is not "date unknown"), organizations. */
export function sourceCounts(ordered: Topic[]): SourceCounts {
  const byUrl = new Map<string, Topic["posts"][number]>();
  for (const p of ordered.flatMap((t) => t.posts)) byUrl.set(p.url, p);
  const all = [...byUrl.values()];
  const papers = all.filter(isPaper).length;
  const docs = all.filter((p) => !isPaper(p) && p.edition && p.edition !== "date unknown").length;
  return {
    total: all.length,
    papers,
    docs,
    posts: all.length - papers - docs,
    organizations: new Set(all.map((p) => organization(p.company))).size,
  };
}

const yearOf = (published: string) => (/^\d{4}/.test(published) ? published.slice(0, 4) : null);

/** Everything /posts shows, derived from the topic files. `ordered` is the course order. */
export function buildPostsIndex(ordered: Topic[]): PostsIndex {
  const byUrl = new Map<string, IndexedPost>();
  const topicBlocks = new Map<string, TopicBlock>();
  for (const t of ordered) {
    const rows: PostRow[] = [];
    for (const p of t.posts) {
      const ref = { slug: t.slug, title: t.title, postId: p.id! };
      let post = byUrl.get(p.url);
      if (post) post.topics.push(ref);
      else byUrl.set(p.url, (post = { title: p.title, company: p.company, url: p.url, year: yearOf(p.published), topics: [ref] }));
      rows.push({ ...post, key: p.id! });
    }
    topicBlocks.set(t.slug, { slug: t.slug, title: t.title, posts: rows });
  }
  const posts = [...byUrl.values()];
  const row = (p: IndexedPost): PostRow => ({ ...p, key: p.topics[0].postId });

  const byTopic = GROUPS.map((group) => ({
    group,
    topics: ordered.filter((t) => t.group === group).map((t) => topicBlocks.get(t.slug)!),
  })).filter((g) => g.topics.length);

  const companies = [...new Set(posts.map((p) => organization(p.company)))].sort((a, b) => a.localeCompare(b));
  const byCompany = companies.map((name) => ({ name, id: slugify(name), posts: posts.filter((p) => organization(p.company) === name).map(row) }));

  const years = [...new Set(posts.map((p) => p.year))].sort((a, b) => (a === null ? 1 : b === null ? -1 : b.localeCompare(a)));
  const byYear = years.map((year) => ({
    year,
    id: year ?? "no-date",
    posts: posts.filter((p) => p.year === year).map(row),
  }));

  const counts = sourceCounts(ordered);
  return { total: posts.length, companyCount: companies.length, counts, topicCount: ordered.length, byTopic, byCompany, byYear };
}
