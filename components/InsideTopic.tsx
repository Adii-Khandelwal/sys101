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
        {sections.map((s, i) => (
          <li key={s.id}>
            <span className="index-number">{String(i + 1).padStart(2, "0")}</span>
            <span className="inside-name">{s.name}</span>
            <span className="inside-count">{s.count ?? "\u00a0"}</span>
          </li>
        ))}
      </ol>
      {figure && (
        <div className="inside-figure">
          <p className="inside-kicker label">A real figure from a post</p>
          <p className="inside-value">{figure.value}</p>
          <p className="inside-meaning">
            {figure.meaning}.
            <span className="inside-source label">
              {figure.company}, {figure.year}
              <span aria-hidden="true"> · </span>
              <a href={figure.url} target="_blank" rel="noopener noreferrer">
                Original post
              </a>
            </span>
          </p>
        </div>
      )}
      <p className="inside-open">
        <Link href={`/topic/${topic.slug}`}>Open {topic.title}</Link>
      </p>
    </section>
  );
}
