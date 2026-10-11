import Link from "next/link";
import { topicPreview } from "@/lib/lessonOutline";
import type { Topic } from "@/lib/topics";

/** A look at what one topic page contains, built from that topic's data. */
export default function InsideTopic({ topic }: { topic: Topic }) {
  const { sections, figure } = topicPreview(topic);
  return (
    <section className="home-extra inside-topic" aria-labelledby="inside-heading">
      <h2 id="inside-heading" className="label">
        Inside a topic
      </h2>
      <p className="home-extra-note">What a topic page holds, shown for {topic.title}.</p>
      <ol className="inside-sequence">
        {sections.map((s) => (
          <li key={s.id}>
            <span>{s.name}</span>
            {s.count && <span className="inside-count">{s.count}</span>}
          </li>
        ))}
      </ol>
      {figure && (
        <p className="inside-figure">
          <strong>{figure.value}</strong>: {figure.meaning}.{" "}
          <span className="inside-source">
            {figure.company}, {figure.year},{" "}
            <a href={figure.url} target="_blank" rel="noopener noreferrer">
              original post
            </a>
          </span>
        </p>
      )}
      <p>
        <Link href={`/topic/${topic.slug}`}>Open {topic.title}</Link>
      </p>
    </section>
  );
}
