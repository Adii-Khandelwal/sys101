import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TopicDossier from "@/components/TopicDossier";
import { routeTo } from "@/lib/route";
import { readingMinutes } from "@/lib/readingTime";
import TopicLesson from "@/components/TopicLesson";
import { getAllTopics, getDependents, getTopic } from "@/lib/topics";
import { getLearn } from "@/lib/learn";
import { getNews } from "@/lib/news";
import { backgroundHref } from "@/lib/background";
import { formatNumber, topicNumbers, topicOrder } from "@/lib/order";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, pageMeta, pageTitle, topicLd, topicPageUpdated } from "@/lib/site";

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
        number={formatNumber(topicNumbers(topicOrder(getAllTopics())).get(slug) ?? 0)}
        prerequisites={prerequisites}
        route={routeTo(slug, getAllTopics()).map((t) => ({ slug: t.slug, title: t.title, minutes: readingMinutes(t, getNews(t.slug)) }))}
        dependents={getDependents(slug)}
        titles={new Map(getAllTopics().map((t) => [t.slug, t.title]))}
        news={getNews(slug)}
        updated={topicPageUpdated(topic, getNews(slug))}
        backgroundHref={backgroundHref(slug)}
        learnHref={getLearn(slug, getAllTopics().map((t) => t.slug)) ? `/topic/${slug}/learn` : undefined}
      />
    </>
  );
}
