import fs from "node:fs";
import path from "node:path";
import { NO_DATE, formatDate, formatMonth } from "./topics";

export type NewsItem = {
  id: string;
  kind: "release" | "engineering-post" | "standard" | "docs";
  title: string;
  publisher: string;
  url: string;
  /** YYYY-MM-DD, YYYY-MM, YYYY or "no date shown": exactly what the source page shows. */
  dateShown: string;
  summary: string;
  /** 1 to 3 phrases copied from the source page, at least one per 15 summary words. Only the checkers read them; never displayed. */
  evidence: string[];
  /** "manual": picked and written in a working session. "routine": added by the scheduled routine. Decides the note under the section. */
  origin: "manual" | "routine";
  addedOn: string;
  verifiedOn: string;
};
export type News = { asOf: string; items: NewsItem[] };

const NEWS_DIR = path.join(process.cwd(), "content", "news");

/** The topic's What's new file, or null when there is none. Shape and content are checked by scripts/check-news.mjs. */
export function getNews(slug: string): News | null {
  const file = path.join(NEWS_DIR, `${slug}.json`);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as News) : null;
}

/** The date as the source shows it: "11 October 2026", "October 2026", "2026" or "no date shown". */
export function newsDate(dateShown: string): string {
  if (dateShown === NO_DATE) return NO_DATE;
  return dateShown.length === 10 ? formatDate(dateShown) : dateShown.length === 7 ? formatMonth(`${dateShown}-01`) : dateShown;
}
