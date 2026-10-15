import Link from "next/link";
import HomeView from "@/components/HomeView";
import InsideTopic from "@/components/InsideTopic";
import { featuredFigures } from "@/lib/lessonOutline";
import NextUp from "@/components/NextUp";
import TourLink from "@/components/TourLink";
import { LogoMark } from "@/components/Logo";
import PostSources from "@/components/PostSources";
import Search from "@/components/Search";
import TryQuestion from "@/components/TryQuestion";
import SiteFooter from "@/components/SiteFooter";
import { optionId } from "@/lib/quizIds";
import { depths } from "@/lib/graph";
import { organization } from "@/lib/posts";
import { MIXED_LABEL } from "@/lib/organization";
import { formatNumber, topicNumbers, topicOrder } from "@/lib/order";
import { GROUPS, getAllTopics, type Group } from "@/lib/topics";
import { getNews } from "@/lib/news";
import { readingMinutes } from "@/lib/readingTime";
import { SITE_DESCRIPTION, pageMeta } from "@/lib/site";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata = pageMeta({
  path: "/",
  title: { absolute: "sys101" },
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
  const ordered = topicOrder(topics);
  const numbers = topicNumbers(ordered);
  const nodes = ordered.map((t) => ({
    slug: t.slug,
    title: t.title,
    posts: t.posts.length,
    group: t.group ?? groupFromDepth(depth.get(t.slug) ?? 0),
    concept: t.concept,
  }));
  const entries = ordered.map((t) => ({
    slug: t.slug,
    title: t.title,
    number: formatNumber(numbers.get(t.slug)!),
    minutes: readingMinutes(t, getNews(t.slug)),
    group: t.group ?? groupFromDepth(depth.get(t.slug) ?? 0),
  }));
  const groups = GROUPS.map((name) => ({ name, entries: entries.filter((e) => e.group === name) })).filter(
    (g) => g.entries.length > 0,
  );

  // Homepage extras, all computed from content at build time.
  const dns = topics.find((t) => t.slug === "dns");
  const quiz = dns?.lesson?.quiz;
  if (!dns || !quiz?.length) throw new Error("Homepage: the DNS topic needs a lesson quiz for Try a question");
  const credits = new Map<string, Set<string>>();
  for (const p of topics.flatMap((t) => t.posts)) credits.set(organization(p.company), (credits.get(organization(p.company)) ?? new Set()).add(p.company));
  const companies = [...credits.keys()]
    .sort((x, y) => x.localeCompare(y))
    .map((name) => ({ name, label: credits.get(name)!.size > 1 ? (MIXED_LABEL[name] ?? name) : name }));
  return (
    <main className="home">
      <header className="masthead">
        <div className="masthead-main">
          <div className="masthead-title">
            <LogoMark size={46} />
            <h1>sys101</h1>
          </div>
          <p className="masthead-lead">Learn system design from what real companies built, broke and fixed.</p>
          <NextUp
            start={{ slug: ordered[0].slug, title: ordered[0].title }}
            entries={ordered.map((t) => ({ slug: t.slug, title: t.title, prerequisites: t.prerequisites }))}
            metas={ordered.map((t) => ({ slug: t.slug, postIds: t.posts.map((p) => p.id!), correct: (t.lesson?.quiz ?? []).map((q) => optionId(q.options[q.correct])) }))}
          />
          <p className="masthead-actions">
            <Link className="label" href="/about">
              Why I made this
            </Link>
            <TourLink tour="home" />
          </p>
        </div>
        <div className="masthead-side">
          <div className="masthead-about">
            <p>
              Behind most systems you use is a team that got it wrong first: a database that outgrew its server, a cache that took the
              site down, a retry storm nobody saw coming. They wrote it up, and those posts are a goldmine.
            </p>
            <p>
              sys101 puts them in order, so you learn caching, replication and queues from what really happened, and always know
              what to read next.
            </p>
          </div>
          <Search />
        </div>
      </header>

      <HomeView
        nodes={nodes}
        edges={edges}
        indexGroups={groups}
        pathEntries={ordered.map((t) => ({
          slug: t.slug,
          title: t.title,
          number: formatNumber(numbers.get(t.slug)!),
          group: t.group ?? groupFromDepth(depth.get(t.slug) ?? 0),
          prerequisites: t.prerequisites,
          reasons: t.prerequisiteReasons,
        }))}
      />

      <InsideTopic topic={dns} figures={featuredFigures(topics)} />
      <TryQuestion slug={dns.slug} topicTitle={dns.title} questions={quiz} />
      <PostSources companies={companies} />

      <SiteFooter tour="home" />
    </main>
  );
}
