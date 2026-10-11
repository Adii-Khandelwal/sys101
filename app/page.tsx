import GraphView from "@/components/GraphView";
import Search from "@/components/Search";
import SiteFooter from "@/components/SiteFooter";
import TopicIndex from "@/components/TopicIndex";
import { columns, depths, transitiveReduction } from "@/lib/graph";
import { GROUPS, getAllTopics, type Group } from "@/lib/topics";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

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
  const nodes = ordered.map((t) => ({ slug: t.slug, title: t.title, posts: t.posts.length }));
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
        <p>System design concepts, ordered by what you need to know first.</p>
        <Search />
      </header>

      <GraphView nodes={nodes} edges={edges} />

      <TopicIndex groups={groups} total={entries.length} />

      <SiteFooter />
    </main>
  );
}
