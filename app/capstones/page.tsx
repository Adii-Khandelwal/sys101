import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";
import TopicReadiness from "@/components/capstone/TopicReadiness";
import { capstoneUpdated, getAllCapstones } from "@/lib/capstones";
import { absoluteUrl, pageMeta } from "@/lib/site";
import { getAllTopics } from "@/lib/topics";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

const topics = getAllTopics();
const capstones = getAllCapstones(topics.map((t) => t.slug));
const titles = new Map(topics.map((t) => [t.slug, t.title]));

export const metadata: Metadata = pageMeta({
  path: "/capstones",
  title: "Capstones",
  description: "Whole-system designs that put finished topics together: decide, size it, break it, then compare with what companies built.",
});

export default function Capstones() {
  if (!capstones.length) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Capstones",
    url: absoluteUrl("/capstones"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: capstones.length,
      itemListElement: capstones.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.title, url: absoluteUrl(`/capstone/${c.slug}`) })),
    },
  };
  return (
    <article className="dossier posts-page cap-page">
      <div data-pagefind-body>
        <h1 data-pagefind-meta="title">Capstones</h1>
        <p className="posts-lead">Each capstone is one whole system built on several topics. You make the design choices first, size it, break it, then see what the companies chose.</p>
        <ul className="cap-index">
          {capstones.map((c) => (
            <li key={c.slug}>
              <h2>
                <Link href={`/capstone/${c.slug}`}>{c.title}</Link>
              </h2>
              <p>{c.summary}</p>
              <TopicReadiness mode="summary" items={c.topics.map((t) => ({ slug: t.slug, title: titles.get(t.slug) ?? t.slug }))} />
            </li>
          ))}
        </ul>
      </div>
      <JsonLd data={ld} />
      <PageUpdated date={capstones.map(capstoneUpdated).reduce((a, b) => (b > a ? b : a))} />
      <SiteFooter />
    </article>
  );
}
