import Link from "next/link";
import TopicReadiness from "@/components/capstone/TopicReadiness";
import type { Capstone } from "@/lib/capstones";

/** Homepage strip pointing at the capstones: title, one line, and how many of its topics are finished. */
export default function PutItTogether({ capstones, titles }: { capstones: Capstone[]; titles: Map<string, string> }) {
  if (capstones.length === 0) return null;
  return (
    <section className="home-extra put-together" aria-labelledby="put-heading" data-tour="capstones">
      <h2 id="put-heading" className="label">
        Put it together
      </h2>
      <p className="home-extra-note">Whole systems that combine topics from the map.</p>
      <ul className="cap-index">
        {capstones.map((c) => (
          <li key={c.slug}>
            <Link href={`/capstone/${c.slug}`}>{c.title}</Link>
            <p>{c.summary}</p>
            <TopicReadiness mode="summary" items={c.topics.map((t) => ({ slug: t.slug, title: titles.get(t.slug) ?? t.slug }))} />
          </li>
        ))}
      </ul>
      <p>
        <Link href="/capstones">All capstones</Link>
      </p>
    </section>
  );
}
