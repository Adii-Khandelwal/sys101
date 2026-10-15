import { formatMonth } from "./topics";
import type { News, NewsItem } from "./news";

export type NewsMonth = { month: string; topics: { slug: string; title: string; items: NewsItem[] }[] };

/** "2026-10" -> next month "2026-11". */
const nextMonth = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
};

/**
 * Every topic's What's new items, grouped by the month they were added (`addedOn`), newest month first, then by topic
 * title. Months with nothing in them are kept, from the first month an item was added to the month of the latest
 * `asOf`, so a quiet month says so. Built from the files alone (no clock), so the page is the same on every build.
 */
export function groupNewsByMonth(entries: { slug: string; title: string; news: News | null }[]): NewsMonth[] {
  const byMonth = new Map<string, Map<string, { slug: string; title: string; items: NewsItem[] }>>();
  let last = "";
  for (const { slug, title, news } of entries) {
    if (!news) continue;
    if (news.asOf.slice(0, 7) > last) last = news.asOf.slice(0, 7);
    for (const item of news.items) {
      const month = item.addedOn.slice(0, 7);
      if (month > last) last = month;
      const topics = byMonth.get(month) ?? new Map();
      const topic = topics.get(slug) ?? { slug, title, items: [] };
      topic.items.push(item);
      topics.set(slug, topic);
      byMonth.set(month, topics);
    }
  }
  if (!byMonth.size) return [];
  const first = [...byMonth.keys()].sort()[0];
  const months: NewsMonth[] = [];
  for (let m = first; m <= last; m = nextMonth(m)) {
    const topics = [...(byMonth.get(m)?.values() ?? [])].sort((a, b) => a.title.localeCompare(b.title));
    for (const t of topics) t.items.sort((a, b) => b.addedOn.localeCompare(a.addedOn) || a.title.localeCompare(b.title));
    months.push({ month: m, topics });
  }
  return months.reverse();
}

/** The latest `asOf` of any topic's file: the date the page's content last changed. */
export const newsUpdated = (entries: { news: News | null }[]) =>
  entries.reduce((latest, e) => (e.news && e.news.asOf > latest ? e.news.asOf : latest), "");

/** The page's description, from its content: the newest month that has items. */
export function newsDescription(months: NewsMonth[]): string {
  const latest = months.find((m) => m.topics.length);
  return latest
    ? `New engineering posts, releases, standards and docs on the topics, month by month. Latest: ${formatMonth(`${latest.month}-01`)}.`
    : "New engineering posts, releases, standards and docs on the topics, month by month. Nothing has been added yet.";
}
