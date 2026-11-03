import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import CompanyLogo from "@/components/CompanyLogo";
import JsonLd from "@/components/JsonLd";
import Overprint from "@/components/Overprint";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";
import TopicReadiness from "@/components/capstone/TopicReadiness";
import DesignRail from "@/components/design/DesignRail";
import DesignAnswer from "@/components/design/DesignAnswer";
import { SourceBadge } from "@/components/design/DesignCites";
import { getAllCapstones } from "@/lib/capstones";
import { designDescription, designLd, designUpdated, getAllDesign, sourcedLine } from "@/lib/design";
import { STEPS } from "@/lib/designSteps";
import { designReadingLabel } from "@/lib/readingTime";
import { breadcrumbLd, pageMeta } from "@/lib/site";
import { formatDate, getAllTopics } from "@/lib/topics";

type Props = { params: Promise<{ slug: string }> };

// Prerendered at build time; an unknown slug is a static 404 (and with no content files there are no pages at all).
export const dynamic = "error";
export const dynamicParams = false;

const topics = getAllTopics();
const capstones = getAllCapstones(topics.map((t) => t.slug));
const designs = getAllDesign(topics.map((t) => t.slug), capstones.map((c) => c.slug));
const titles = new Map(topics.map((t) => [t.slug, t.title]));

export function generateStaticParams() {
  return designs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = designs.find((x) => x.slug === slug);
  if (!d) return {};
  return pageMeta({ path: `/design/${d.slug}`, title: `Design: ${d.title}`, description: designDescription(d) });
}

export default async function DesignPage({ params }: Props) {
  const { slug } = await params;
  const d = designs.find((x) => x.slug === slug);
  if (!d) notFound();
    const allTitles = Object.fromEntries(topics.map((t) => [t.slug, t.title]));
  const capstone = capstones.find((c) => c.slug === d.capstone);

  return (
    <article className="dossier chapter cap-page">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Design questions", path: "/design" }, { name: d.title, path: `/design/${d.slug}` }])} />
      <JsonLd data={designLd(d, titles)} />
      <div data-pagefind-body className="chapter-grid">
        <DesignRail />
        <header className="chapter-head">
          <div className="chapter-title">
            <div className="topic-tagline" data-pagefind-ignore>
              <span className="chapter-group">Design question</span>
            </div>
            <Overprint as="h1" className="chapter-h1" data-pagefind-meta="title">
              {d.title}
            </Overprint>
          </div>
          <dl className="chapter-meta" data-pagefind-ignore>
            <div>
              <dt>Time</dt>
              <dd className="reading-time">{designReadingLabel(d)}</dd>
            </div>
            <div>
              <dt>Sourcing</dt>
              <dd>{sourcedLine(d)}</dd>
            </div>
            <div>
              <dt>Sources from</dt>
              <dd>{[...new Set(d.sources.map((s) => s.company))].join(", ")}</dd>
            </div>
          </dl>
        </header>

        <div className="chapter-body">
          <div className="chapter-main">
            <p className="label">The interviewer lines are typical prompts, not a record of any company&apos;s interview.</p>
            <section className="cap-section" id="question">
              <Overprint as="h2">The question</Overprint>
              <p className="cap-outcome">After this you can say what is being asked and which topics the answer leans on.</p>
              <p className="posts-lead">{d.summary}</p>
              <TopicReadiness mode="list" items={d.topics.map((t) => ({ slug: t.slug, title: allTitles[t.slug], role: t.role }))} />
              {capstone && (
                <p>
                  The hard part is shown in a real system: <Link href={`/capstone/${capstone.slug}`}>{capstone.title}</Link>.
                </p>
              )}
            </section>

            <section className="cap-section" id="answer">
              <Overprint as="h2">The answer, section by section</Overprint>
              <p className="cap-outcome">After this you can talk through a design in {STEPS.length} sections and see which facts rest on a source.</p>
              <DesignAnswer d={d} topicTitles={allTitles} />
            </section>

            {d.curiosities && d.curiosities.length > 0 && (
              <section className="cap-section" id="worth-knowing">
                <Overprint as="h2">Worth knowing</Overprint>
                <p className="cap-outcome">After this you can name a real figure or decision that raises a question worth reading the full post for.</p>
                <ul className="design-claims">
                  {d.curiosities.map((c) => (
                    <li key={c.id}>
                      <p>{c.text}</p>
                      <SourceBadge src={d.sources.find((x) => x.id === c.sourceId)!} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="cap-section" id="sources">
              <Overprint as="h2">Original sources</Overprint>
              <p className="cap-outcome">After this you can open each source and read the full account.</p>
              <ul className="cap-sources">
                {d.sources.map((s) => (
                  <li key={s.id}>
                    <CompanyLogo name={s.company} size="sm" />
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <span className="label">
                      {[s.company, /^\d{4}/.test(s.published) ? (s.published.length === 4 ? s.published : formatDate(s.published)) : s.edition, s.kind].join(", ")}
                      {s.license ? `, ${s.license}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
      <PageUpdated date={designUpdated(d)} />
      <SiteFooter />
    </article>
  );
}
