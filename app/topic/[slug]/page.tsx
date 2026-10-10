import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TopicDossier from "@/components/TopicDossier";
import { getAllTopics, getDependents, getTopic } from "@/lib/topics";

type Props = { params: Promise<{ slug: string }> };

// Every topic is prerendered at build time; unknown slugs are a static 404,
// and anything that would make the page dynamic fails the build.
export const dynamic = "error";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTopics().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = getTopic((await params).slug);
  return { title: topic ? `${topic.title} · sys101` : "sys101" };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const prerequisites = topic.prerequisites
    .map((s) => getTopic(s))
    .filter((t) => t !== undefined);

  return (
    <TopicDossier
      topic={topic}
      prerequisites={prerequisites}
      dependents={getDependents(slug)}
      titles={new Map(getAllTopics().map((t) => [t.slug, t.title]))}
    />
  );
}
