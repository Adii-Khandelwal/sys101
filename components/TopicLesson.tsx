import Link from "next/link";
import { formatDate, type Topic } from "@/lib/topics";
import { PostDigest, TopicList } from "./TopicDossier";
import { CompactProgress, MarkDone, QuizBlock, ResumeLine, YourData } from "./LessonTrackers";
import type { LessonMeta } from "@/lib/lessonStore";
import LessonRail from "./LessonRail";
import SiteFooter from "./SiteFooter";

type Props = {
  topic: Topic;
  prerequisites: Topic[];
  dependents: Topic[];
  titles: Map<string, string>;
};

const SECTION_NAMES: Record<string, string> = {
  check: "Check yourself",
  why: "Why it exists",
  model: "Mental model",
  how: "How it works",
  example: "Worked example",
  mistakes: "Common mistakes",
  posts: "How companies use it",
  differ: "Where they differ",
};

const LEVELS = { apply: "Apply", design: "Design", scale: "Scale it 10x" };

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
    </>
  );
}

/** Opening line of every section: what the reader can do after it. */
function Outcome({ text }: { text: string }) {
  return <p className="outcome">{text}</p>;
}

/** Topic page in the teaching-journey format: concept first, then real-world posts. */
export default function TopicLesson({ topic, prerequisites, dependents, titles }: Props) {
  const l = topic.lesson!;
  const meta: LessonMeta = { slug: topic.slug, postIds: topic.posts.map((p) => p.id!), correct: l.quiz.map((q) => q.correct) };
  const names: Record<string, string> = {
    ...SECTION_NAMES,
    ...Object.fromEntries(topic.posts.map((p) => [p.id!, `${p.company} post`])),
  };
  const entries = [
    ...["why", "model", "how", "example", "mistakes", "check"].map((id) => ({ id, name: SECTION_NAMES[id], tracked: true })),
    { id: "posts", name: "How companies use it", tracked: false },
    ...topic.posts.map((p) => ({ id: p.id!, name: `${p.company} post`, tracked: true })),
    ...(topic.posts.length >= 2 && topic.comparison ? [{ id: "differ", name: "Where they differ", tracked: false }] : []),
    { id: "exercises", name: "Design exercises", tracked: false },
    { id: "next", name: "What to learn next", tracked: false },
  ];

  return (
    <article className="dossier lesson">
      <LessonRail meta={meta} entries={entries} />
      <div className="progress-sticky" data-pagefind-ignore>
        <CompactProgress meta={meta} variant="line" />
      </div>
      <nav className="label" data-pagefind-ignore>
        <Link href="/">← sys101</Link>
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

        <div className="lesson-top" data-pagefind-ignore>
          <ResumeLine meta={meta} names={names} />

          <a className="text-button label" href="#posts">
            Skip to the posts
          </a>
        </div>

        <div id="concept" className="part">
          <p className="label part-label">Part A · Concept</p>

          <section id="why" aria-labelledby="why-h">
            <h2 id="why-h">Why it exists</h2>
            <Outcome text={l.why.outcome} />
            <Paragraphs text={l.why.body} />
            <MarkDone meta={meta} unit="why" />
          </section>

          <section id="model" aria-labelledby="model-h">
            <h2 id="model-h">Mental model</h2>
            <Outcome text={l.mentalModel.outcome} />
            <Paragraphs text={l.mentalModel.body} />
            <figure className="diagram" dangerouslySetInnerHTML={{ __html: l.mentalModel.diagram }} />
            <h3>Words to know</h3>
            <dl className="glossary">
              {topic.glossary.map((g) => (
                <div key={g.term}>
                  <dt>{g.term}</dt> <dd>{g.definition}</dd>
                </div>
              ))}
            </dl>
            <MarkDone meta={meta} unit="model" />
          </section>

          <section id="how" aria-labelledby="how-h">
            <h2 id="how-h">How it works</h2>
            <Outcome text={l.howItWorks.outcome} />
            <ol className="walkthrough">
              {l.howItWorks.steps.map((s) => (
                <li key={s.step}>
                  <strong>{s.step}.</strong> {s.explanation}
                </li>
              ))}
            </ol>
            <MarkDone meta={meta} unit="how" />
          </section>

          <section id="example" aria-labelledby="example-h">
            <h2 id="example-h">Worked example</h2>
            <Outcome text={l.workedExample.outcome} />
            <ol className="walkthrough">
              {l.workedExample.steps.map((s) => (
                <li key={s.step}>
                  <strong>{s.step}.</strong> {s.explanation}
                </li>
              ))}
            </ol>
            <MarkDone meta={meta} unit="example" />
          </section>

          <section id="mistakes" aria-labelledby="mistakes-h">
            <h2 id="mistakes-h">Common mistakes</h2>
            <Outcome text={l.mistakesOutcome} />
            <ol className="mistakes">
              {topic.mistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
            <MarkDone meta={meta} unit="mistakes" />
          </section>

          <section id="check" aria-labelledby="check-h" data-pagefind-ignore>
            <h2 id="check-h">Check yourself</h2>
            <Outcome text={l.checkOutcome} />
            <QuizBlock meta={meta} quiz={l.quiz} names={names} />
          </section>

        </div>

        <div id="posts" className="part">
          <div className="part-head" data-pagefind-ignore>
            <p className="label part-label">Part B · Real world</p>
            <a className="text-button label" href="#concept">
              Back to concept
            </a>
          </div>

          <section aria-labelledby="posts-h">
            <h2 id="posts-h" className="part-title">
              How companies use it
            </h2>
            <Outcome text={l.postsOutcome} />
          </section>

          {topic.posts.map((post, i) => (
            <div key={post.url} id={post.id}>
              <PostDigest post={post} index={i} titles={titles} />
              <MarkDone meta={meta} unit={post.id!} />
            </div>
          ))}

          {topic.posts.length >= 2 && topic.comparison && (
            <section id="differ" className="closing" aria-labelledby="differ-h">
              <h2 id="differ-h">Where they differ</h2>
              <Outcome text={l.differOutcome} />
              <p>{topic.comparison}</p>
            </section>
          )}

          <section id="exercises" className="closing" aria-labelledby="exercises-h" data-pagefind-ignore>
            <h2 id="exercises-h">Design exercises</h2>
            <Outcome text={l.exercisesOutcome} />
            <ol className="exercises">
              {l.exercises.map((x) => (
                <li key={x.prompt}>
                  <p className="label">{LEVELS[x.level]}</p>
                  <p>{x.prompt}</p>
                  <details>
                    <summary>Show a model answer</summary>
                    <p>{x.answer}</p>
                    <h4>Trade-offs</h4>
                    <p>{x.tradeoffs}</p>
                    <h4>Common wrong answers</h4>
                    <ul className="wrong">
                      {x.wrongAnswers.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                    <p>
                      <a href={`#${x.teaches}`}>Review: {SECTION_NAMES[x.teaches]}</a>
                    </p>
                  </details>
                </li>
              ))}
            </ol>
          </section>

          <section id="next" className="closing" aria-labelledby="next-h">
            <h2 id="next-h">What to learn next</h2>
            <Outcome text={l.next.outcome} />
            <Paragraphs text={l.next.body} />
            <div data-pagefind-ignore>
              <TopicList topics={dependents} />
            </div>
          </section>
        </div>
      </div>

      <YourData meta={meta} title={topic.title} />

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
              <span className="label">
                {post.company} · {post.published.slice(0, 4)}
              </span>
              <span className="checked">Checked on {formatDate(post.verifiedOn)}</span>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </article>
  );
}
