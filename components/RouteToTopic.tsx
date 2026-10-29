"use client";

import Link from "next/link";
import { useReadTopics } from "@/lib/progress";

export type RouteItem = { slug: string; title: string; minutes: number };

/** Every topic to read before this one, in order, collapsed. A filled disc is read, a hollow ring is not (shape, with hidden text for screen readers). */
export default function RouteToTopic({ items }: { items: RouteItem[] }) {
  const read = useReadTopics();
  if (items.length === 0) return null;
  return (
    <details className="route">
      <summary>Route to this topic</summary>
      <ol>
        {items.map((i) => (
          <li key={i.slug}>
            <span className="route-mark" data-read={read.includes(i.slug) || undefined} aria-hidden="true" />
            <Link href={`/topic/${i.slug}`}>{i.title}</Link>
            <span className="route-min">~{i.minutes} min</span>
            <span className="visually-hidden">{read.includes(i.slug) ? ", read" : ", not read"}</span>
          </li>
        ))}
      </ol>
      <p className="route-total">Total ~{items.reduce((n, i) => n + i.minutes, 0)} min</p>
    </details>
  );
}
