// Hidden for now: the leading underscore makes Next treat this folder as private, so /new is not a route. To bring the page back,
// rename app/_new to app/new and uncomment the nav item (lib/navItems.ts), the sitemap entry (app/sitemap.ts) and the test lines (lib/pageUpdated.test.ts).
import type { Metadata } from "next";
import Link from "next/link";
import CompanyLogo from "@/components/CompanyLogo";
import JsonLd from "@/components/JsonLd";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";
import { getNews, newsDate } from "@/lib/news";
import { groupNewsByMonth, newsDescription, newsUpdated } from "@/lib/newsMonths";
import { PAGE_DATES, absoluteUrl, pageMeta } from "@/lib/site";
import { NO_DATE, formatMonth, getAllTopics } from "@/lib/topics";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

const entries = getAllTopics().map((t) => ({ slug: t.slug, title: t.title, news: getNews(t.slug) }));
const months = groupNewsByMonth(entries);

export const metadata: Metadata = pageMeta({ path: "/new", title: "What's new", description: newsDescription(months) });

export default function New() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "What's new",
    url: absoluteUrl("/new"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: months
        .flatMap((m) => m.topics.flatMap((t) => t.items))
        .map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.title, url: item.url })),
    },
  };
  return (
    <article className="dossier posts-page news-page">
      <div data-pagefind-body>
        <h1 data-pagefind-meta="title">What&apos;s new</h1>
        <p className="posts-lead">
          Recent pages from approved sources on the topics we teach, grouped by the month they were added. Each is dated as its own page shows it. For one subject, open the topic, where the same items sit under What&apos;s new.
        </p>
        {months.length === 0 && <p>Nothing has been added yet. Check back next month.</p>}
        {months.map((m) => (
          <section key={m.month} className="whats-new news-month" aria-labelledby={`month-${m.month}`}>
            <h2 id={`month-${m.month}`}>{formatMonth(`${m.month}-01`)}</h2>
            {m.topics.length === 0 && <p className="news-quiet">Nothing new this month.</p>}
            {m.topics.map((t) => (
              <div key={t.slug} className="news-topic">
                <h3>
                  <Link href={`/topic/${t.slug}#whats-new`}>{t.title}</Link>
                </h3>
                <ul>
                  {t.items.map((item) => (
                    <li key={item.id}>
                      <p className="label whats-new-meta">
                        {item.dateShown !== NO_DATE && <span>{newsDate(item.dateShown)}</span>}
                        <span className="company-label company-label-inline">
                          <CompanyLogo name={item.publisher} size="sm" bare />
                          {item.publisher}
                        </span>
                      </p>
                      <p>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          {item.title}
                        </a>
                      </p>
                      <p>{item.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
      <JsonLd data={ld} />
      <PageUpdated date={newsUpdated(entries) || PAGE_DATES.news} />
      <SiteFooter />
    </article>
  );
}
