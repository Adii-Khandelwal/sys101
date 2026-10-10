"use client";

import Link from "next/link";
import { useReadTopics } from "@/lib/progress";

type Entry = { slug: string; title: string; number: string };
type Props = { groups: { name: string; entries: Entry[] }[]; total: number };

export default function TopicIndex({ groups, total }: Props) {
  const read = useReadTopics();
  const count = groups.flatMap((g) => g.entries).filter((e) => read.includes(e.slug)).length;

  return (
    <section className="index" aria-labelledby="index-heading">
      <h2 id="index-heading" className="label">
        All topics · {count} of {total} read
      </h2>
      <div className="index-groups">
        {groups.map((g) => (
          <div key={g.name}>
            <h3 className="label">{g.name}</h3>
            <ol>
              {g.entries.map((e) => {
                const isRead = read.includes(e.slug);
                return (
                  <li key={e.slug}>
                    <span className="index-number">{e.number}</span>
                    <Link href={`/topic/${e.slug}`}>{e.title}</Link>
                    <span className={isRead ? "legend-dot is-read" : "legend-dot"} aria-hidden="true" />
                    <span className="visually-hidden">{isRead ? "read" : "unread"}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
