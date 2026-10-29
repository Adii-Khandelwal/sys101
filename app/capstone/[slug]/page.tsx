import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CompanyLogo from "@/components/CompanyLogo";
import { diagramHtml } from "@/lib/diagramHtml";
import JsonLd from "@/components/JsonLd";
import Overprint from "@/components/Overprint";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";
import CapstoneRail from "@/components/capstone/CapstoneRail";
import CapstoneQuiz from "@/components/capstone/CapstoneQuiz";
import DesignItFirst from "@/components/capstone/DesignItFirst";
import DiagramLab from "@/components/capstone/DiagramLab";
import SizingCalculator from "@/components/capstone/SizingCalculator";
import TopicReadiness from "@/components/capstone/TopicReadiness";
import { capstoneDescription, capstoneLd, capstoneUpdated, getAllCapstones } from "@/lib/capstones";
import { breadcrumbLd, pageMeta } from "@/lib/site";
import { formatDate, getAllTopics } from "@/lib/topics";

type Props = { params: Promise<{ slug: string }> };

// Prerendered at build time; an unknown slug is a static 404.
export const dynamic = "error";
export const dynamicParams = false;

const topics = getAllTopics();
const capstones = getAllCapstones(topics.map((t) => t.slug));
const titles = new Map(topics.map((t) => [t.slug, t.title]));

export function generateStaticParams() {
  return capstones.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = capstones.find((x) => x.slug === slug);
  if (!c) return {};
  return pageMeta({ path: `/capstone/${c.slug}`, title: `Capstone: ${c.title}`, description: capstoneDescription(c) });
}

export default async function CapstonePage({ params }: Props) {
  const { slug } = await params;
  const c = capstones.find((x) => x.slug === slug);
  if (!c) notFound();
  const topicTitles = Object.fromEntries(c.topics.map((t) => [t.slug, titles.get(t.slug) ?? t.slug]));
  const source = (id: string) => c.sources.find((s) => s.id === id)!;

  return (
    <article className="dossier chapter cap-page">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Capstones", path: "/capstones" }, { name: c.title, path: `/capstone/${c.slug}` }])} />
      <JsonLd data={capstoneLd(c, titles)} />
      <div data-pagefind-body className="chapter-grid">
        <CapstoneRail slug={c.slug} decisionIds={c.decisions.map((d) => d.id)} quizLength={c.quiz.length} />
        <header className="chapter-head">
          <div className="chapter-title">
            <div className="topic-tagline" data-pagefind-ignore>
              <span className="chapter-group">Capstone</span>
            </div>
            <Overprint as="h1" className="chapter-h1" data-pagefind-meta="title">
              {c.title}
            </Overprint>
          </div>
          <dl className="chapter-meta" data-pagefind-ignore>
            <div>
              <dt>Read first</dt>
              <dd>
                <a href="#need">{c.topics.length} topics, listed under Topics it builds on</a>
              </dd>
            </div>
            <div>
              <dt>Built on posts from</dt>
              <dd>{[...new Set(c.sources.map((s) => s.company))].join(", ")}</dd>
            </div>
          </dl>
        </header>

        <div className="chapter-body">
          <div className="chapter-main">
        <p className="posts-lead">{c.summary}</p>

        <section className="cap-section" id="need">
          <Overprint as="h2">Topics it builds on</Overprint>
          <p className="cap-outcome">After this you can see which finished topics this design leans on, and which to revisit first.</p>
          <TopicReadiness mode="list" items={c.topics.map((t) => ({ slug: t.slug, title: topicTitles[t.slug], role: t.role }))} />
        </section>

        <section className="cap-section" id="brief">
          <Overprint as="h2">The brief</Overprint>
          <p className="cap-outcome">After this you can state what the system must do before choosing any part of it.</p>
          <p>{c.brief.text}</p>
          <dl className="cap-reqs">
            {c.brief.requirements.map((r) => (
              <div key={r.label}>
                <dt className="label">{r.label}</dt>
                <dd>
                  {r.value} <span className="label">{source(r.sourceId).company}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="cap-section" id="design">
          <Overprint as="h2">Design it first</Overprint>
          <p className="cap-outcome">After this you can compare your own choice with the one a company made, and say why they differ.</p>
          <DesignItFirst slug={c.slug} decisions={c.decisions} sources={c.sources} />
        </section>

        <section className="cap-section" id="size">
          <Overprint as="h2">Size it</Overprint>
          <p className="cap-outcome">After this you can turn a write rate into memory and machines and see which input dominates.</p>
          <SizingCalculator slug={c.slug} sizing={c.sizing} />
        </section>

        <DiagramLab slug={c.slug} diagram={c.diagram} topicTitles={topicTitles} />
        <noscript>
          <section className="cap-section cap-noscript">
            <h2>Parts and failures (scripts are off)</h2>
            <dl>
              {c.diagram.nodes.map((n) => (
                <div key={n.id}>
                  <dt>{n.label} ({n.company})</dt>
                  <dd>{n.tradeoff}</dd>
                </div>
              ))}
            </dl>
            <ul>
              {c.diagram.failures.map((f) => (
                <li key={f.id}>
                  {f.label}: {f.effects.map((e) => `${c.diagram.nodes.find((n) => n.id === e.nodeId)!.label} ${e.state}`).join(", ")}
                </li>
              ))}
            </ul>
          </section>
        </noscript>

        <section className="cap-section" id="differ">
          <Overprint as="h2">Where they differ</Overprint>
          <p className="cap-outcome">After this you can explain where the sources agree and where their designs split.</p>
          {c.compare.split("\n\n").map((para) => (
            <p key={para}>{para}</p>
          ))}
          {c.compareDiagram && <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(c.compareDiagram) }} />}
        </section>

        <section className="cap-section" id="check">
          <Overprint as="h2">Check yourself</Overprint>
          <p className="cap-outcome">After this you can answer questions that cross topic boundaries.</p>
          <CapstoneQuiz slug={c.slug} quiz={c.quiz} topicTitles={topicTitles} />
        </section>

        <section className="cap-section" id="sources">
          <Overprint as="h2">Original posts</Overprint>
          <p className="cap-outcome">After this you can open each source and read the full account.</p>
          <ul className="cap-sources">
            {c.sources.map((s) => (
              <li key={s.id}>
                <CompanyLogo name={s.company} size="sm" />
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
                <span className="label">
                  {s.company}, {s.published.length === 4 ? s.published : formatDate(s.published)}
                </span>
              </li>
            ))}
          </ul>
        </section>
          </div>
        </div>
      </div>
      <PageUpdated date={capstoneUpdated(c)} />
      <SiteFooter />
    </article>
  );
}
