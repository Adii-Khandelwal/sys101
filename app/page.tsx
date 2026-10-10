import GraphView from "@/components/GraphView";
import SiteFooter from "@/components/SiteFooter";
import TopicIndex from "@/components/TopicIndex";
import { getAllTopics } from "@/lib/topics";

export default function Home() {
  const topics = getAllTopics();

  return (
    <main className="home">
      <header className="masthead">
        <h1>sys101</h1>
        <p>System design concepts, ordered by what you need to know first.</p>
      </header>

      <section className="graph-stage">
        <GraphView
          nodes={topics.map((t) => ({ slug: t.slug, title: t.title, posts: t.posts.length }))}
          edges={topics.flatMap((t) => t.prerequisites.map((p) => ({ from: p, to: t.slug })))}
        />
      </section>

      <TopicIndex topics={topics.map((t) => ({ slug: t.slug, title: t.title }))} />

      <SiteFooter />
    </main>
  );
}
