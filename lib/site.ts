import type { Metadata } from "next";
import type { Topic } from "./topics";
import type { Learn } from "./learn";

export const CONTACT_EMAIL = "aditya01khandelwal@gmail.com";
/** Where "Report a mistake" mail goes. */
export const REPORT_EMAIL = CONTACT_EMAIL;

/** Origin for canonical URLs, the sitemap, and JSON-LD. No trailing slash. */
export const SITE_URL = (process.env.SITE_URL || "https://sys101.vercel.app").replace(/\/+$/, "");
export const SITE_NAME = "sys101";
/** Static 1200x630 social image, drawn by scripts/make-og.mjs from the wordmark and tagline. */
const OG_IMAGE = { path: "/og.png", width: 1200, height: 630, alt: "sys101: learn system design in the order it makes sense" } as const;
/** A page title must be shorter than this many characters (checked by scripts/check-seo.mjs). */
const TITLE_MAX = 60;
export const SITE_DESCRIPTION =
  "A system design course in prerequisite order, taught through how real engineering teams built their systems.";

/** Content dates for pages with no JSON behind them. Shown on the page and used as sitemap lastmod. */
export const PAGE_DATES = { about: "2026-10-14", terms: "2026-10-14", privacy: "2026-10-14", glossary: "2026-10-12" } as const;

/** How the write-ups are made, word for word the same on About and Terms (lib/site.test.ts checks both pages). */
export const AI_ASSISTANCE =
  "The write-ups are drafted with an AI assistant that reads each source. They have not all been reviewed line by line and may contain errors. When a write-up and the original disagree, trust the original.";

export const absoluteUrl = (path: string) => SITE_URL + (path === "/" ? "" : path);

/** A meta description must be shorter than this many characters (checked by scripts/check-seo.mjs). */
export const DESC_MAX = 155;

/**
 * A meta description that ends at a sentence or clause boundary and is shorter than DESC_MAX, with no
 * ellipsis. It is the first full sentence when that fits. If not, it is the text up to the last clause
 * boundary (a comma, semicolon, colon or dash) that fits, plus a period. Only when there is no clause
 * boundary at all does it cut at a word.
 */
export function metaDescription(text: string, limit = DESC_MAX): string {
  const max = limit - 1;
  const flat = text.replace(/\s+/g, " ").trim();
  const first = flat.match(/^.+?[.!?](?=\s|$)/);
  const sentence = first ? first[0] : flat;
  const closed = /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
  if (closed.length <= max) return closed;
  const body = sentence.replace(/[.!?]$/, "");
  let cut = -1;
  for (const m of body.matchAll(/[,;:]\s|\s[\u2013\u2014]\s/g)) if (m.index! <= max - 1) cut = m.index!;
  if (cut > 0) return `${body.slice(0, cut)}.`;
  const words = body.slice(0, max - 1);
  return `${words.slice(0, words.lastIndexOf(" ")).replace(/[,;:\s]+$/, "")}.`;
}

/**
 * A page title: the full name, or the topic's shortTitle when the full title with the site suffix
 * would reach TITLE_MAX characters. `prefix` is text before the name, such as "Start from zero: ".
 */
export function pageTitle(name: { title: string; shortTitle?: string }, prefix = ""): string {
  const full = `${prefix}${name.title}`;
  return name.shortTitle && `${full} · ${SITE_NAME}`.length >= TITLE_MAX ? `${prefix}${name.shortTitle}` : full;
}

/**
 * Per-page metadata: one canonical URL without query strings, plus Open Graph
 * and Twitter text tags. `title` is the bare page title; the layout adds the suffix.
 */
export function pageMeta({ path, title, description: raw }: { path: string; title: string | { absolute: string }; description: string }): Metadata {
  const url = absoluteUrl(path);
  const description = metaDescription(raw);
  const image = { url: absoluteUrl(OG_IMAGE.path), width: OG_IMAGE.width, height: OG_IMAGE.height, alt: OG_IMAGE.alt };
  const fullTitle = typeof title === "string" ? `${title} · ${SITE_NAME}` : title.absolute;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE_NAME, url, title: fullTitle, description, locale: "en", images: [image] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image.url] },
  };
}

const latest = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a), "");

/** A topic changes when a post on it is re-checked, so its newest verifiedOn date is its lastmod. */
const topicUpdated = (topic: Pick<Topic, "posts">) => latest(topic.posts.map((p) => p.verifiedOn));

/** The posts index changes when any post entry does. */
export const postsUpdated = (topics: Pick<Topic, "posts">[]) => latest(topics.flatMap((t) => t.posts.map((p) => p.verifiedOn)));

/** Meta description for /posts, from computed counts. */
export const postsDescription = (d: { total: number; companyCount: number; topicCount: number }) =>
  `All ${d.total} engineering posts behind the topics, from ${d.companyCount} companies, listed by topic, company or year, with a link to each original.`;

/** Same for a learn page and its official sources. */
/** When a topic page was last edited: its newest post entry or its What's new file, whichever is later. */
export const topicPageUpdated = (topic: Pick<Topic, "posts">, news?: { asOf: string } | null) => latest([topicUpdated(topic), news?.asOf ?? ""]);
export const learnUpdated = (learn: Pick<Learn, "sources">) => latest(learn.sources.map((s) => s.verifiedOn));

/** Learn page description, unique per topic and matching the note under its heading. */
export const learnDescription = (title: string) =>
  metaDescription(`A beginner's path through ${title} in four stages, from the basics to trade-offs, built only from official sources.`);

type Crumb = { name: string; path: string };

/** BreadcrumbList JSON-LD for the trail Home > Topic > Start from zero. */
export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.path) })),
  };
}

/** LearningResource JSON-LD for a topic page, built only from what the page shows. */
export function topicLd(topic: Topic, prerequisites: Pick<Topic, "title">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: topic.title,
    description: metaDescription(topic.description ?? topic.concept),
    url: absoluteUrl(`/topic/${topic.slug}`),
    inLanguage: "en",
    learningResourceType: "Lesson",
    dateModified: topicUpdated(topic),
    ...(prerequisites.length > 0 ? { competencyRequired: prerequisites.map((p) => p.title) } : {}),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}
