import { NEWS_MODE } from "../lib/site";
import { newsDate, type News } from "../lib/news";

/** "What's new in <Topic>": up to three recent pages from approved sources. Renders nothing without items. Not tracked in progress. */
export default function WhatsNew({ title, news }: { title: string; news: News | null }) {
  if (!news || news.items.length === 0) return null;
  return (
    <section id="whats-new" className="whats-new" aria-labelledby="whats-new-h" data-pagefind-body>
      <h2 id="whats-new-h">What&apos;s new in {title}</h2>
      <p className="label">As of {newsDate(news.asOf)}</p>
      <ul>
        {news.items.map((item) => (
          <li key={item.id}>
            <p className="label whats-new-meta">
              <span>{newsDate(item.dateShown)}</span>
              <span>{item.publisher}</span>
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
      <p className="whats-new-note">
        {news.items.every((i) => i.origin === "routine") ? "Added by an automated routine after automated checks" : "Selected and checked with automated tools"}
        {NEWS_MODE === "review" ? " and reviewed by me before publishing" : ""}.
      </p>
    </section>
  );
}
