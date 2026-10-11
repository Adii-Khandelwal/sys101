import { optionId } from "@/lib/quizIds";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import DataControls from "@/components/DataControls";
import SiteFooter from "@/components/SiteFooter";
import { getAllTopics } from "@/lib/topics";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = {
  ...pageMeta({ path: "/data", title: "Your data", description: "Export, import, or reset the reading progress that sys101 keeps in this browser." }),
  robots: { index: false, follow: true },
};

export default function YourData() {
  const topics = getAllTopics()
    .filter((t) => t.lesson)
    .map((t) => ({ slug: t.slug, title: t.title, prerequisites: t.prerequisites, postIds: t.posts.map((p) => p.id!), correct: t.lesson!.quiz.map((q) => optionId(q.options[q.correct])) }));
  return (
    <article className="dossier legal">
      <h1>Your data</h1>
      <p>Your reading progress is stored in this browser only. Nothing is sent anywhere, and there are no accounts.</p>
      <DataControls topics={topics} />
      <SiteFooter />
    </article>
  );
}
