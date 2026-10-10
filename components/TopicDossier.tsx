import Link from "next/link";
import type { Topic } from "@/lib/topics";
import ReadToggle from "./ReadToggle";
import SiteFooter from "./SiteFooter";

type Props = {
  topic: Topic;
  prerequisites: Topic[];
  dependents: Topic[];
};

function TopicList({ topics }: { topics: Topic[] }) {
  if (topics.length === 0) return <p className="none">None</p>;
  return (
    <ul>
      {topics.map((t) => (
        <li key={t.slug}>
          <Link href={`/topic/${t.slug}`}>{t.title}</Link>
        </li>
      ))}
    </ul>
  );
}

export default function TopicDossier({ topic, prerequisites, dependents }: Props) {
  return (
    <article className="dossier">
      <nav className="label">
        <Link href="/">← sys101</Link>
        <ReadToggle slug={topic.slug} />
      </nav>

      <div className="label">Concept</div>
      <h1>{topic.title}</h1>
      <p className="concept">{topic.concept}</p>

      <div className="relations">
        <div>
          <div className="label">Builds on</div>
          <TopicList topics={prerequisites} />
        </div>
        <div>
          <div className="label">Leads to</div>
          <TopicList topics={dependents} />
        </div>
      </div>

      <section className="reading">
        <h2>From the field</h2>
        <ol>
          {topic.posts.map((post) => (
            <li key={post.url}>
              <div className="label">{post.company}</div>
              <h3>
                <a href={post.url} target="_blank" rel="noreferrer">
                  {post.title}
                </a>
              </h3>
              <p>{post.summary}</p>
            </li>
          ))}
        </ol>
      </section>

      <SiteFooter />
    </article>
  );
}
