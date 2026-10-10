import Link from "next/link";
import type { Post, Topic } from "@/lib/topics";
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

/** One post, rewritten: context, walkthrough, diagram, numbers, trade-offs, then what went wrong. */
function PostDigest({ post, index }: { post: Post; index: number }) {
  const d = post.digest;
  const id = `post-${index + 1}`;
  return (
    <section className="post" aria-labelledby={`${id}-title`}>
      <div className="label">{post.company}</div>
      <h2 id={`${id}-title`}>{post.title}</h2>

      <p className="post-problem">{d.problem}</p>
      <h3>Constraints</h3>
      <p>{d.constraints}</p>

      <h3>Walkthrough</h3>
      <ol className="walkthrough">
        {d.walkthrough.map((s) => (
          <li key={s.step}>
            <strong>{s.step}.</strong> {s.explanation}
          </li>
        ))}
      </ol>

      {/* Diagrams are our own SVG from content JSON, checked at build time. */}
      <figure className="diagram" dangerouslySetInnerHTML={{ __html: d.diagram }} />

      <h3>Numbers</h3>
      <table className="numbers">
        <tbody>
          {d.numbers.map((n) => (
            <tr key={n.value + n.meaning}>
              <th scope="row">{n.value}</th>
              <td>{n.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Trade-offs</h3>
      <dl className="tradeoffs">
        {/* The {" "} text nodes keep terms and definitions apart in the search index. */}
        <dt>Chosen</dt> <dd>{d.tradeoffs.chosen}</dd> <dt>Rejected</dt> <dd>{d.tradeoffs.rejected}</dd>{" "}
        <dt>Why</dt> <dd>{d.tradeoffs.why}</dd>
      </dl>

      <h3>What went wrong</h3>
      <p>{d.failures}</p>
      <h3>Takeaways</h3>
      <p>{d.takeaways}</p>
    </section>
  );
}

export default function TopicDossier({ topic, prerequisites, dependents }: Props) {
  return (
    <article className="dossier">
      <nav className="label" data-pagefind-ignore>
        <Link href="/">← sys101</Link>
        <ReadToggle slug={topic.slug} />
      </nav>

      <div data-pagefind-body>
        <div className="label" data-pagefind-ignore>
          {topic.group ?? "Concept"}
        </div>
        <h1 data-pagefind-meta="title">{topic.title}</h1>
        <p className="concept">{topic.concept}</p>

        <div className="relations" data-pagefind-ignore>
          <div>
            <div className="label">Builds on</div>
            <TopicList topics={prerequisites} />
          </div>
          <div>
            <div className="label">Leads to</div>
            <TopicList topics={dependents} />
          </div>
        </div>

        <section className="primer" aria-labelledby="primer">
          <h2 id="primer" className="label">
            Before you start
          </h2>
          <p>{topic.primer}</p>
        </section>

        {topic.posts.map((post, i) => (
          <PostDigest key={post.url} post={post} index={i} />
        ))}

        {topic.posts.length >= 2 && topic.comparison && (
          <section className="closing" aria-labelledby="differ">
            <h2 id="differ">Where they differ</h2>
            <p>{topic.comparison}</p>
          </section>
        )}

        <section className="closing" aria-labelledby="glossary">
          <h2 id="glossary">Glossary</h2>
          <dl className="glossary">
            {topic.glossary.map((g) => (
              <div key={g.term}>
                <dt>{g.term}</dt> <dd>{g.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="closing" aria-labelledby="mistakes">
          <h2 id="mistakes">Common mistakes</h2>
          <ol className="mistakes">
            {topic.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
        </section>

        <section className="closing" aria-labelledby="check" data-pagefind-ignore>
          <h2 id="check">Check yourself</h2>
          <ol className="quiz">
            {topic.quiz.map((q) => (
              <li key={q.question}>
                <p>{q.question}</p>
                <details>
                  <summary>Show answer</summary>
                  <p>{q.answer}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>

        <section className="closing" aria-labelledby="exercise" data-pagefind-ignore>
          <h2 id="exercise">Design exercise</h2>
          <p>{topic.exercise.prompt}</p>
          <details>
            <summary>Show a model answer</summary>
            <p>{topic.exercise.answer}</p>
          </details>
        </section>
      </div>

      <section className="sources" aria-labelledby="sources" data-pagefind-ignore>
        <h2 id="sources" className="label">
          {topic.posts.length === 1 ? "Original post" : "Original posts"}
        </h2>
        <ul>
          {topic.posts.map((post) => (
            <li key={post.url}>
              <a href={post.url} target="_blank" rel="noopener noreferrer">
                {post.title}
              </a>{" "}
              <span className="label">{post.company}</span>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </article>
  );
}
