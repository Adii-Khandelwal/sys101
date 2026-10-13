import Link from "next/link";
import IntentLink from "./IntentLink";
import { companyWhen, isOld, isUndated, postDateShown, type Post, type Topic } from "@/lib/topics";
import ReadToggle from "./ReadToggle";
import InterviewTag from "./InterviewTag";
import Reveal from "./Reveal";
import PageUpdated from "./PageUpdated";
import SiteFooter from "./SiteFooter";
import PostFigure from "./figures/PostFigure";

type Props = {
  topic: Topic;
  prerequisites: Topic[];
  dependents: Topic[];
  /** slug -> title, for related-topic links. */
  titles: Map<string, string>;
  /** When the page was last edited, shown once at the bottom. */
  updated: string;
};

export function TopicList({ topics, reasons }: { topics: Topic[]; reasons?: Record<string, string> }) {
  if (topics.length === 0) return <p className="none">None</p>;
  return (
    <ul>
      {topics.map((t) => (
        <li key={t.slug}>
          <IntentLink href={`/topic/${t.slug}`}>{t.title}</IntentLink>
          {reasons?.[t.slug] && <p className="relation-reason">{reasons[t.slug]}</p>}
        </li>
      ))}
    </ul>
  );
}

/** One post, rewritten: context, walkthrough, diagram, numbers, trade-offs, then what went wrong. */
export function PostDigest({ post, index, titles }: { post: Post; index: number; titles: Map<string, string> }) {
  const d = post.digest;
  const id = `post-${index + 1}`;
  const old = isUndated(post) || isOld(post.published);
  return (
    <section className="post" aria-labelledby={`${id}-title`}>
      <div className="label">{companyWhen(post, "month")}</div>
      <h2 id={`${id}-title`}>{post.title}</h2>

      {old && (
        <aside className="age-note">
          {(isUndated(post) ? postDateShown(post, "year") : post.published) && (
            <p className="age-year">{isUndated(post) ? `Date: ${postDateShown(post, "year")}` : `Written in ${post.published.slice(0, 4)}`}</p>
          )}
          <p>{post.ageNote}</p>
          {post.stillCitedBy && (
            <p>
              Still cited in {post.stillCitedBy.year}:{" "}
              <a href={post.stillCitedBy.url} target="_blank" rel="noopener noreferrer">
                {post.stillCitedBy.title}
              </a>
            </p>
          )}
        </aside>
      )}
      {!old && post.stillCitedBy && (
        <p className="age-cited">
          Still cited in {post.stillCitedBy.year}:{" "}
          <a href={post.stillCitedBy.url} target="_blank" rel="noopener noreferrer">
            {post.stillCitedBy.title}
          </a>
        </p>
      )}

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
        <dt>Chosen</dt> <dd>{d.tradeoffs.chosen}</dd>{" "}
        {d.tradeoffs.rejected && (
          <>
            <dt>Rejected</dt> <dd>{d.tradeoffs.rejected}</dd>{" "}
          </>
        )}
        <dt>Why</dt> <dd>{d.tradeoffs.why}</dd>
      </dl>

      <h3>What went wrong</h3>
      <p>{d.failures}</p>
      <h3>Takeaways</h3>
      <p>{d.takeaways}</p>

      <PostFigure post={post} />

      {post.related?.length ? (
        <p className="related" data-pagefind-ignore>
          <span className="label">Related topic</span>{" "}
          {post.related.map((slug, i) => (
            <span key={slug}>
              {i > 0 && ", "}
              <Link href={`/topic/${slug}`}>{titles.get(slug) ?? slug}</Link>
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}

export default function TopicDossier({ topic, prerequisites, dependents, titles, updated }: Props) {
  return (
    <article className="dossier">
      <nav className="label" data-pagefind-ignore>
        <ReadToggle slug={topic.slug} />
      </nav>

      <div data-pagefind-body>
        <div className="topic-tagline" data-pagefind-ignore>
          <span className="label">{topic.group ?? "Concept"}</span>
          {topic.interviewRelevance && <InterviewTag level={topic.interviewRelevance} />}
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
          <PostDigest key={post.url} post={post} index={i} titles={titles} />
        ))}

        {topic.posts.length >= 2 && topic.comparison && (
          <section className="closing" aria-labelledby="differ">
            <h2 id="differ">Where they differ</h2>
            {topic.comparison.split("\n\n").map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
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
            {topic.quiz!.map((q) => (
              <li key={q.question}>
                <p>{q.question}</p>
                <Reveal show="Show answer" hide="Hide answer">
                  <p>{q.answer}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section className="closing" aria-labelledby="exercise" data-pagefind-ignore>
          <h2 id="exercise">Design exercise</h2>
          <p>{topic.exercise!.prompt}</p>
          <Reveal show="Show a model answer" hide="Hide the model answer">
            <p>{topic.exercise!.answer}</p>
          </Reveal>
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
              <span className="label">{companyWhen(post, "year")}</span>
            </li>
          ))}
        </ul>
      </section>

      <PageUpdated date={updated} />
      <SiteFooter />
    </article>
  );
}
