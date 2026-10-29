import type { Metadata } from "next";
import { PAGE_DATES, pageMeta } from "@/lib/site";
import { getAllTopics } from "@/lib/topics";
import Overprint from "@/components/Overprint";
import GlossaryFilter from "@/components/GlossaryFilter";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = pageMeta({
  path: "/glossary",
  title: "Glossary",
  description: "Every term defined across the sys101 topics, grouped by topic, each linking back to where it is taught.",
});

export default function Glossary() {
  // Topics that actually define terms, in title order (getAllTopics is sorted by title).
  const groups = getAllTopics()
    .filter((t) => t.glossary.length > 0)
    .map((t) => ({ slug: t.slug, title: t.title, terms: t.glossary }));

  return (
    <article className="dossier legal glossary-page lesson">
      <div data-pagefind-body>
        {/* The key on the h1 silences a dev-only "unique key" warning React raises for a server element passed to a client component as a prop. */}
        <GlossaryFilter groups={groups} heading={<Overprint key="heading" as="h1" className="page-h1" data-pagefind-meta="title">Glossary</Overprint>} />
      </div>

      <PageUpdated date={PAGE_DATES.glossary} />
      <SiteFooter />
    </article>
  );
}
