import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";
import DesignIndex from "@/components/design/DesignIndex";
import { designUpdated, getAllDesign, sourcedLine } from "@/lib/design";
import { getAllCapstones } from "@/lib/capstones";
import Link from "next/link";
import { getInterview } from "@/lib/interview";
import { PAGE_DATES, absoluteUrl, pageMeta } from "@/lib/site";
import { getAllTopics } from "@/lib/topics";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

const slugs = getAllTopics().map((t) => t.slug);
const designs = getAllDesign(slugs, getAllCapstones(slugs).map((c) => c.slug));
const interview = getInterview();

export const metadata: Metadata = pageMeta({
  path: "/design",
  title: "Design questions",
  description: "Interview-style design questions answered step by step, with every claim tied to a verified source.",
});

export default function Design() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Design questions",
    url: absoluteUrl("/design"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: designs.length,
      itemListElement: designs.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: d.title, url: absoluteUrl(`/design/${d.slug}`) })),
    },
  };
  return (
    <article className="dossier posts-page cap-page">
      <div data-pagefind-body>
        <h1 data-pagefind-meta="title">Design questions</h1>
        <p className="posts-lead">Each question is answered section by section, the way the round goes; a fact about a real system links its source, and the rest is reasoning checked against official sources.</p>
        <ul className="cap-index">
          <li id="how-it-goes">
            <h2>
              <Link href="/design/how-it-goes">{interview.title}</Link>
            </h2>
            <p>{interview.summary}</p>
            <p className="label">Read this first, then pick a question below.</p>
          </li>
        </ul>
        {designs.length ? (
          <DesignIndex rows={designs.map((d) => ({ slug: d.slug, title: d.title, summary: d.summary, coverage: sourcedLine(d) }))} />
        ) : (
          <p className="design-empty">No design questions are published yet. One appears here only when its steps can be backed by sources that have been opened and checked.</p>
        )}
      </div>
      <JsonLd data={ld} />
      <PageUpdated date={designs.length ? designs.map(designUpdated).reduce((a, b) => (b > a ? b : a)) : PAGE_DATES.design} />
      <SiteFooter />
    </article>
  );
}
