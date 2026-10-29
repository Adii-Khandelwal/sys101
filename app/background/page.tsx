import type { Metadata } from "next";
import Link from "next/link";
import Overprint from "@/components/Overprint";
import HighlightTarget from "@/components/HighlightTarget";
import LearnRail from "@/components/LearnRail";
import SiteFooter from "@/components/SiteFooter";
import PageUpdated from "@/components/PageUpdated";
import { backgroundUpdated, displayQuote, getAllBackground, isTaughtLater } from "@/lib/background";
import CompanyLogo from "@/components/CompanyLogo";
import { companyWhen, getAllTopics } from "@/lib/topics";
import { topicNumbers, topicOrder } from "@/lib/order";
import { diagramHtml } from "@/lib/diagramHtml";
import { pageMeta } from "@/lib/site";
import { StripBackToTop } from "@/components/BackToTop";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = pageMeta({
  path: "/background",
  title: "Background",
  description: "What the posts of each topic assume you already know, with a short note on each and where to learn more.",
});

export default function Background() {
  const topics = getAllTopics();
  const bySlug = new Map(topics.map((t) => [t.slug, t]));
  const numbers = topicNumbers(topicOrder(topics));
  const files = getAllBackground();

  return (
    <article className="dossier legal background-page lesson">
      <LearnRail scope="section" entries={files.map((b) => ({ id: b.topic, name: bySlug.get(b.topic)!.title }))} />
      <div className="progress-sticky" data-pagefind-ignore>
        <LearnRail entries={files.map((b) => ({ id: b.topic, name: bySlug.get(b.topic)!.title }))} variant="line" scope="section" />
        <StripBackToTop />
      </div>
      <div data-pagefind-body>
        <Overprint as="h1" className="page-h1" data-pagefind-meta="title">Background</Overprint>
        <p className="background-lead">
          The posts on each topic assume a few things the topic itself does not teach. They are listed here, each with the sentence that
          assumes it. A concept marked Taught later comes up in a later topic, and its one-line gist is enough for now.
        </p>

        {files.map((b) => {
          const topic = bySlug.get(b.topic)!;
          return (
            <section key={b.topic} id={b.topic} className="bg-section" aria-labelledby={`${b.topic}-h`}>
              <Overprint as="h2" id={`${b.topic}-h`}>{`Background for ${topic.title}`}</Overprint>
              <ul className="bg-items">
                {b.items.map((item) => {
                  const later = isTaughtLater(item, b.topic, numbers);
                  return (
                    <li key={item.id} id={`${b.topic}-${item.id}`} className="bg-item">
                      <h3>
                        {item.name}
                        {later && <span className="label bg-later">Taught later</span>}
                      </h3>
                      <p>{item.explanation}</p>
                      {item.diagram && <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(item.diagram) }} />}
                      <div className="bg-assumed">
                        <span className="label">Assumed by</span>
                        <ul>
                          {item.assumedBy.map((a) => {
                            const post = topic.posts.find((p) => p.id === a.postId)!;
                            return (
                              <li key={a.postId}>
                                <Link href={`/topic/${b.topic}#${a.postId}`} className="company-label">
                                  <CompanyLogo name={post.company} size="sm" />
                                  <span>{companyWhen(post, "year", ", ")}</span>
                                </Link>
                                <q>{displayQuote(a.quote)}</q>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      {(item.sources ?? []).length > 0 && (
                        <ul className="bg-sources">
                          {item.sources!.map((s) => (
                            <li key={s.url}>
                              <span className="label">Official source</span>
                              <a href={s.url} target="_blank" rel="noopener noreferrer">
                                {s.title}
                              </a>
                              <span className="bg-source-meta">{s.year === "no date shown" ? s.publisher : `${s.publisher}, ${s.year}`}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="label">
                <Link href={`/topic/${b.topic}#posts`}>Back to the {topic.title} topic</Link>
              </p>
            </section>
          );
        })}
      </div>

      <HighlightTarget selector="section.bg-section" />
      <PageUpdated date={backgroundUpdated()} />
      <SiteFooter />
    </article>
  );
}
