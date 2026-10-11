import type { Metadata } from "next";
import type { Topic } from "./topics";
import type { Learn } from "./learn";

export const CONTACT_EMAIL = "aditya01khandelwal@gmail.com";

/** Origin for canonical URLs, the sitemap, and JSON-LD. No trailing slash. */
export const SITE_URL = (process.env.SITE_URL || "https://sys101.vercel.app").replace(/\/+$/, "");
export const SITE_NAME = "sys101";
export const SITE_DESCRIPTION =
  "A system design course in prerequisite order, taught through how real engineering teams built their systems.";

/** Content dates for pages with no JSON behind them. Shown on the page and used as sitemap lastmod. */
export const PAGE_DATES = { about: "2026-10-11", terms: "2026-10-11", privacy: "2026-10-11" } as const;

export const absoluteUrl = (path: string) => SITE_URL + (path === "/" ? "" : path);

/** Shortens to max characters at a word boundary. */
export function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
}

/** First sentence of a paragraph, clipped to a meta description length. */
export function firstSentence(text: string, max = 155): string {
  const match = text.match(/^.+?[.!?](?=\s|$)/);
  return clip(match ? match[0] : text, max);
}

/**
 * Per-page metadata: one canonical URL without query strings, plus Open Graph
 * and Twitter text tags. `title` is the bare page title; the layout adds the suffix.
 */
export function pageMeta({ path, title, description }: { path: string; title: string | { absolute: string }; description: string }): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = typeof title === "string" ? `${title} · ${SITE_NAME}` : title.absolute;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE_NAME, url, title: fullTitle, description, locale: "en" },
    twitter: { card: "summary", title: fullTitle, description },
  };
}

const latest = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a), "");

/** A topic changes when a post on it is re-checked, so its newest verifiedOn date is its lastmod. */
export const topicUpdated = (topic: Pick<Topic, "posts">) => latest(topic.posts.map((p) => p.verifiedOn));

/** Same for a learn page and its official sources. */
export const learnUpdated = (learn: Pick<Learn, "sources">) => latest(learn.sources.map((s) => s.verifiedOn));

/** Learn page description, unique per topic and matching the note under its heading. */
export const learnDescription = (title: string) =>
  clip(`A beginner's path through ${title} in four stages, from the basics to trade-offs, built only from official sources.`, 155);

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
    description: firstSentence(topic.concept),
    url: absoluteUrl(`/topic/${topic.slug}`),
    inLanguage: "en",
    learningResourceType: "Lesson",
    dateModified: topicUpdated(topic),
    ...(prerequisites.length > 0 ? { competencyRequired: prerequisites.map((p) => p.title) } : {}),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}
