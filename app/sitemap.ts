import type { MetadataRoute } from "next";
import { topicOrder } from "@/lib/order";
import { getAllTopics } from "@/lib/topics";
import { getAllLearn } from "@/lib/learn";
import { getNews } from "@/lib/news";
// import { newsUpdated } from "@/lib/newsMonths"; // for the /new entry below, hidden for now
import { backgroundUpdated, getAllBackground } from "@/lib/background";
import { capstoneUpdated, getAllCapstones } from "@/lib/capstones";
import { getAllReads, readsUpdated } from "@/lib/reads";
import { PAGE_DATES, absoluteUrl, learnUpdated, postsUpdated, topicPageUpdated } from "@/lib/site";

// Built once at build time from the content files, like every page.
export const dynamic = "force-static";

/** Every indexable page, with lastmod taken from real content dates. /data is left out on purpose. */
export default function sitemap(): MetadataRoute.Sitemap {
  const topics = topicOrder(getAllTopics());
  const learn = getAllLearn(topics.map((t) => t.slug));
  // A topic's What's new "asOf" counts as a content change too.
  const capstones = getAllCapstones(topics.map((t) => t.slug));
  const topicDates = topics.map((t) => topicPageUpdated(t, getNews(t.slug)));
  const entry = (path: string, date: string) => ({ url: absoluteUrl(path), lastModified: date });
  return [
    entry("/", topicDates.reduce((a, b) => (b > a ? b : a))),
    ...topics.map((t, i) => entry(`/topic/${t.slug}`, topicDates[i])),
    ...learn.map((l) => entry(`/topic/${l.slug}/learn`, learnUpdated(l))),
    ...(getAllBackground().length ? [entry("/background", backgroundUpdated())] : []),
    entry("/posts", postsUpdated(topics)),
    entry("/reads", readsUpdated(getAllReads(topics.map((t) => t.slug)))),
    // entry("/new", newsUpdated(topics.map((t) => ({ news: getNews(t.slug) }))) || PAGE_DATES.news),
    ...(capstones.length ? [entry("/capstones", capstones.map(capstoneUpdated).reduce((a, b) => (b > a ? b : a))), ...capstones.map((c) => entry(`/capstone/${c.slug}`, capstoneUpdated(c)))] : []),
    entry("/about", PAGE_DATES.about),
    entry("/terms", PAGE_DATES.terms),
    entry("/privacy", PAGE_DATES.privacy),
  ];
}
