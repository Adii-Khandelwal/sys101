"use client";

import Link from "next/link";
import { useReadTopics } from "@/lib/progress";

type Props = { topics: { slug: string; title: string }[] };

export default function TopicIndex({ topics }: Props) {
  const read = useReadTopics();
  const count = topics.filter((t) => read.includes(t.slug)).length;

  return (
    <section className="index">
      <div className="label">
        Index · {count} of {topics.length} read
      </div>
      <ol>
        {topics.map((t) => (
          <li key={t.slug} className={read.includes(t.slug) ? "is-read" : undefined}>
            <Link href={`/topic/${t.slug}`}>{t.title}</Link>
            {read.includes(t.slug) && <span>read</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
