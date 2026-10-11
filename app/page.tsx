import Link from "next/link";
import HomeView from "@/components/HomeView";
import NextUp from "@/components/NextUp";
import Search from "@/components/Search";
import StartHere from "@/components/StartHere";
import SiteFooter from "@/components/SiteFooter";
import { columns, depths, transitiveReduction } from "@/lib/graph";
import { GROUPS, getAllTopics, type Group } from "@/lib/topics";
import { SITE_DESCRIPTION, pageMeta } from "@/lib/site";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata = pageMeta({
  path: "/",
  title: { absolute: "sys101: system design from how real systems work" },
  description: SITE_DESCRIPTION,
});

/** Fallback when a topic has no `group`: shallow topics are foundations, deep ones data. */
function groupFromDepth(depth: number): Group {
  return depth === 0 ? "Foundations" : depth <= 2 ? "Scaling" : "Data";
}

export default function Home() {
  const topics = getAllTopics();
  const edges = topics.flatMap((t) => t.prerequisites.map((p) => ({ from: p, to: t.slug })));

  // Map order: by prerequisite depth, then position in the column. Used for
  // the index numbering and for keyboard tab order through the map.
  const depth = depths(topics, edges);
  // Same order as the drawn map, which uses the reduced edges; data keeps all edges.
  const ordered = columns(topics, transitiveReduction(edges)).flat();
  const nodes = ordered.map((t) => ({
    slug: t.slug,
    title: t.title,
    posts: t.posts.length,
    group: t.group ?? groupFromDepth(depth.get(t.slug) ?? 0),
    concept: t.concept,
  }));
  const entries = ordered.map((t, i) => ({
    slug: t.slug,
    title: t.title,
    number: String(i + 1).padStart(2, "0"),
    group: t.group ?? groupFromDepth(depth.get(t.slug) ?? 0),
  }));
  const groups = GROUPS.map((name) => ({ name, entries: entries.filter((e) => e.group === name) })).filter(
    (g) => g.entries.length > 0,
  );

  return (
    <main className="home">
      <header className="masthead">
        <h1>sys101</h1>
        <p className="masthead-lead">Learn system design in the order it makes sense.</p>
        <p>
          A guided path through the concepts behind systems at scale, built from real engineering
          stories. <Link href="/about">Why this exists</Link>
        </p>
        <NextUp entries={ordered.map((t) => ({ slug: t.slug, title: t.title, prerequisites: t.prerequisites }))} />
        <StartHere firstSlug="dns" firstTitle="DNS" />
        <Search />
      </header>

      <HomeView
        nodes={nodes}
        edges={edges}
        indexGroups={groups}
        pathEntries={ordered.map((t, i) => ({
          slug: t.slug,
          title: t.title,
          number: String(i + 1).padStart(2, "0"),
          group: t.group ?? groupFromDepth(depth.get(t.slug) ?? 0),
          posts: t.posts.length,
          prerequisites: t.prerequisites,
        }))}
      />

      <SiteFooter />
    </main>
  );
}
