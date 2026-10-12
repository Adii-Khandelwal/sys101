import type { MetadataRoute } from "next";
import { topicOrder } from "@/lib/order";
import { getAllTopics } from "@/lib/topics";
import { getAllLearn } from "@/lib/learn";
import { getNews } from "@/lib/news";
import { backgroundUpdated, getAllBackground } from "@/lib/background";
import { PAGE_DATES, absoluteUrl, learnUpdated, topicPageUpdated } from "@/lib/site";

// Built once at build time from the content files, like every page.
export const dynamic = "force-static";

/** Every indexable page, with lastmod taken from real content dates. /data is left out on purpose. */
export default function sitemap(): MetadataRoute.Sitemap {
  const topics = topicOrder(getAllTopics());
  const learn = getAllLearn(topics.map((t) => t.slug));
  // A topic's What's new "asOf" counts as a content change too.
  const topicDates = topics.map((t) => topicPageUpdated(t, getNews(t.slug)));
  const entry = (path: string, date: string) => ({ url: absoluteUrl(path), lastModified: date });
  return [
    entry("/", topicDates.reduce((a, b) => (b > a ? b : a))),
    ...topics.map((t, i) => entry(`/topic/${t.slug}`, topicDates[i])),
    ...learn.map((l) => entry(`/topic/${l.slug}/learn`, learnUpdated(l))),
    ...(getAllBackground().length ? [entry("/background", backgroundUpdated())] : []),
    entry("/about", PAGE_DATES.about),
    entry("/glossary", PAGE_DATES.glossary),
    entry("/terms", PAGE_DATES.terms),
    entry("/privacy", PAGE_DATES.privacy),
  ];
}
