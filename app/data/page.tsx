import type { Metadata } from "next";
import DataControls from "@/components/DataControls";
import SiteFooter from "@/components/SiteFooter";
import { getAllTopics } from "@/lib/topics";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = { title: "Your data" };

export default function YourData() {
  const topics = getAllTopics()
    .filter((t) => t.lesson)
    .map((t) => ({ slug: t.slug, title: t.title, postIds: t.posts.map((p) => p.id!), correct: t.lesson!.quiz.map((q) => q.correct) }));
  return (
    <article className="dossier legal">
      <h1>Your data</h1>
      <p>Your reading progress is stored in this browser only. Nothing is sent anywhere, and there are no accounts.</p>
      <DataControls topics={topics} />
      <SiteFooter />
    </article>
  );
}
