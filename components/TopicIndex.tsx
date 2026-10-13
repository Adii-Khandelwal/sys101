"use client";

import IntentLink from "./IntentLink";
import { useReadTopics } from "@/lib/progress";

type Entry = { slug: string; title: string; number: string; minutes: number };
type Props = { groups: { name: string; entries: Entry[] }[] };

export default function TopicIndex({ groups }: Props) {
  const read = useReadTopics();

  return (
    <section className="index" aria-labelledby="index-heading">
      <h2 id="index-heading" className="label">
        All topics
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
                    <IntentLink href={`/topic/${e.slug}`}>{e.title}</IntentLink>
                    <span className="index-time label" aria-hidden="true">
                      ~{e.minutes} min read
                    </span>
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
