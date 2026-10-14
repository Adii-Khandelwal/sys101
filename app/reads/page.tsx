import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageUpdated from "@/components/PageUpdated";
import ReadsList from "@/components/ReadsList";
import SiteFooter from "@/components/SiteFooter";
import { buildReads, getAllReads, readsDescription, readsUpdated } from "@/lib/reads";
import { absoluteUrl, pageMeta } from "@/lib/site";
import { getAllTopics } from "@/lib/topics";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

const topics = getAllTopics();
const reads = getAllReads(topics.map((t) => t.slug));
const data = buildReads(reads, topics);

export const metadata: Metadata = pageMeta({ path: "/reads", title: "Great reads", description: readsDescription(data) });

export default function Reads() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Great reads",
    url: absoluteUrl("/reads"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: data.total,
      itemListElement: data.byTheme.flatMap((g) => g.reads).map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.title, url: r.url })),
    },
  };
  return (
    <article className="dossier posts-page reads-page">
      <div data-pagefind-body>
        <h1 data-pagefind-meta="title">Great reads</h1>
        <p className="posts-lead">
          Posts and papers I chose because others adopted what they introduced, or because they are simply excellent. They are not tied to one topic, and they are not the sources the topics are built on (those are under{" "}
          <Link href="/posts">Posts</Link>). Each describes its system as of the year shown.
        </p>
        <ReadsList data={data} />
      </div>
      <JsonLd data={ld} />
      <PageUpdated date={readsUpdated(reads)} />
      <SiteFooter />
    </article>
  );
}
