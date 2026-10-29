import Link from "next/link";
import Overprint from "./Overprint";
import TopicReadiness from "@/components/capstone/TopicReadiness";
import type { Capstone } from "@/lib/capstones";

// The strip shows the first few; the rest are one click away on /capstones, so the homepage does not grow with every new capstone.
const SHOWN = 3;

/** Homepage strip pointing at the capstones: title, one line, and how many of its topics are finished. */
export default function PutItTogether({ capstones, titles }: { capstones: Capstone[]; titles: Map<string, string> }) {
  if (capstones.length === 0) return null;
  return (
    <section className="home-extra put-together" aria-labelledby="put-heading" data-tour="capstones">
      <Overprint id="put-heading" className="label">Put it together</Overprint>
      <p className="home-extra-note">Whole systems that combine topics from the map.</p>
      <ul className="cap-index">
        {capstones.slice(0, SHOWN).map((c) => (
          <li key={c.slug}>
            <Link href={`/capstone/${c.slug}`}>{c.title}</Link>
            <p>{c.summary}</p>
            <TopicReadiness mode="summary" items={c.topics.map((t) => ({ slug: t.slug, title: titles.get(t.slug) ?? t.slug }))} />
          </li>
        ))}
      </ul>
      {capstones.length > 1 && (
        <p>
          <Link href="/capstones">{capstones.length > SHOWN ? `All ${capstones.length} capstones` : "All capstones"}</Link>
        </p>
      )}
    </section>
  );
}
