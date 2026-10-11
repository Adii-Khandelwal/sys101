import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TopicDossier from "@/components/TopicDossier";
import TopicLesson from "@/components/TopicLesson";
import { getAllTopics, getDependents, getTopic } from "@/lib/topics";
import { getLearn } from "@/lib/learn";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, pageMeta, pageTitle, topicLd } from "@/lib/site";

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
  if (!topic) return {};
  return pageMeta({ path: `/topic/${topic.slug}`, title: pageTitle(topic), description: topic.description ?? topic.concept });
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const prerequisites = topic.prerequisites
    .map((s) => getTopic(s))
    .filter((t) => t !== undefined);

  // Lesson-format topics (piloted on DNS) use the teaching-journey template.
  const Template = topic.lesson ? TopicLesson : TopicDossier;
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: topic.title, path: `/topic/${slug}` },
        ])}
      />
      <JsonLd data={topicLd(topic, prerequisites)} />
      <Template
        topic={topic}
        prerequisites={prerequisites}
        dependents={getDependents(slug)}
        titles={new Map(getAllTopics().map((t) => [t.slug, t.title]))}
        learnHref={getLearn(slug, getAllTopics().map((t) => t.slug)) ? `/topic/${slug}/learn` : undefined}
      />
    </>
  );
}
