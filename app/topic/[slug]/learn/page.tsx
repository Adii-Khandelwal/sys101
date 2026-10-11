import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LearnPage from "@/components/LearnPage";
import { getAllLearn, getLearn } from "@/lib/learn";
import { getAllTopics, getTopic } from "@/lib/topics";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, learnDescription, pageMeta } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

// Prerendered at build time, only for topics that have a learn page.
export const dynamic = "error";
export const dynamicParams = false;

const slugs = () => getAllTopics().map((t) => t.slug);

export function generateStaticParams() {
  return getAllLearn(slugs()).map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = getTopic((await params).slug);
  if (!topic) return {};
  return pageMeta({
    path: `/topic/${topic.slug}/learn`,
    title: `Start from zero: ${topic.title}`,
    description: learnDescription(topic.title),
  });
}

export default async function Learn({ params }: Props) {
  const { slug } = await params;
  const topic = getTopic(slug);
  const learn = getLearn(slug, slugs());
  if (!topic || !learn) notFound();
  const titles = new Map(getAllTopics().map((t) => [t.slug, t.title]));
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: topic.title, path: `/topic/${slug}` },
          { name: "Start from zero", path: `/topic/${slug}/learn` },
        ])}
      />
      <LearnPage topic={topic} learn={learn} titles={titles} />
    </>
  );
}
