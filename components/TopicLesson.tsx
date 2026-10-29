import type { ReactNode } from "react";
import GlossTerm from "./GlossTerm";
import CopyLink from "./CopyLink";
import { glossaryId, markTerms, noteId, sectionTerms } from "@/lib/glossaryMatch";
import MarginTerms from "./MarginTerms";
import Overprint from "./Overprint";
import { diagramHtml } from "@/lib/diagramHtml";
import { StepThroughLazy } from "./StepThroughLazy";
import Link from "next/link";
import CompanyLogo from "./CompanyLogo";
import { optionId } from "@/lib/quizIds";
import { figureParts, type Topic } from "@/lib/topics";
import { readingLabel } from "@/lib/readingTime";
import { OriginalPosts, PostDigest, TopicList } from "./TopicDossier";
import { CompactProgress, FinishTopic, MarkDone, QuizBlock, ResumeLine } from "./LessonTrackers";
import type { LessonMeta } from "@/lib/lessonStore";
import LessonRail from "./LessonRail";
import InterviewTag from "./InterviewTag";
import Reveal from "./Reveal";
import PageUpdated from "./PageUpdated";
import SiteFooter from "./SiteFooter";
import WhatsNew from "./WhatsNew";
import TourLink from "./TourLink";
import type { News } from "@/lib/news";
import { StripBackToTop } from "./BackToTop";

type Props = {
  topic: Topic;
  prerequisites: Topic[];
  dependents: Topic[];
  titles: Map<string, string>;
  /** Link to the topic's "Start from zero" page, when it has one. */
  learnHref?: string;
  /** Recent items from approved sources, shown after What to learn next. */
  news?: News | null;
  /** Link to this topic's section of /background, when it has one. */
  backgroundHref?: string;
  /** When the page was last edited, shown once at the bottom. */
  updated: string;
  /** Reading-order number ("07"), shown as "Topic 07". */
  number?: string;
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

type Gloss = (text: string) => ReactNode;
const plain: Gloss = (t) => t;

function Paragraphs({ text, g = plain }: { text: string; g?: Gloss }) {
  return (
    <>
      {text.split("\n\n").map((p) => (
        <p key={p.slice(0, 40)}>{g(p)}</p>
      ))}
    </>
  );
}

/** Opening line of every section: what the reader can do after it. */
function Outcome({ text }: { text: string }) {
  return <p className="outcome">{text}</p>;
}

/** "In short": the topic in a few plain sentences, then figures read from the posts' digests so they cannot drift. Not tracked. */
function InShort({ topic }: { topic: Topic }) {
  const s = topic.summary;
  if (!s) return null;
  const figures = s.figures.map((f) => {
    const post = topic.posts.find((p) => p.id === f.postId)!;
    return { post, ...figureParts(post, f) };
  });
  return (
    <section className="in-short" aria-labelledby="in-short-h">
      <h2 id="in-short-h" className="label">
        In short
      </h2>
      <ul>
        {s.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {figures.length > 0 && (
        <ul className="in-short-figures">
          {figures.map(({ post, text, source }) => (
            <li key={text}>
              <a href={`#${post.id}`}>
                <span>{text}</span>
                <span className="label company-label">
                  <CompanyLogo name={post.company} size="sm" />
                  <span>{source}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Topic page in the teaching-journey format: concept first, then real-world posts. */
export default function TopicLesson({ topic, prerequisites, dependents, titles, learnHref, news, backgroundHref, updated, number }: Props) {
  const l = topic.lesson!;
  const meta: LessonMeta = { slug: topic.slug, postIds: topic.posts.map((p) => p.id!), correct: l.quiz.map((q) => optionId(q.options[q.correct])) };
  const names: Record<string, string> = {
    ...SECTION_NAMES,
    ...Object.fromEntries(topic.posts.map((p) => [p.id!, `${p.company} post`])),
  };
  // One gloss per section: it marks the first use of each of this topic's glossary terms in that section's prose.
  const glossFor = (section: string): Gloss => {
    const seen = new Set<string>();
    return (text) =>
      markTerms(text, topic.glossary, seen).map((seg, i) =>
        typeof seg === "string" ? (
          seg
        ) : (
          <GlossTerm key={i} note={noteId(section, seg.entry.term)} href={`/glossary#${glossaryId(topic.slug, seg.entry.term)}`} definition={seg.entry.definition}>
            {seg.text}
          </GlossTerm>
        ),
      );
  };
  // The margin copy of each section's popover terms (same first-use rule as the prose, so the two cannot differ).
  const mt = (section: string, ...texts: string[]) => (
    <MarginTerms terms={sectionTerms(texts, topic.glossary).map((e) => ({ term: e.term, definition: e.definition, id: noteId(section, e.term) }))} />
  );
  const [gHow, gExample, gMistakes, gDiffer] = [glossFor("how"), glossFor("example"), glossFor("mistakes"), glossFor("differ")];
  const entries = [
    ...["why", "model", "how", "example", "mistakes", "check"].map((id) => ({ id, name: SECTION_NAMES[id], tracked: true })),
    { id: "posts", name: "How companies use it", tracked: false },
    ...topic.posts.map((p) => ({ id: p.id!, name: `${p.company} post`, tracked: true, company: p.company })),
    ...(topic.posts.length >= 2 && topic.comparison ? [{ id: "differ", name: "Where they differ", tracked: false }] : []),
    { id: "exercises", name: "Design exercises", tracked: false },
    { id: "next", name: "What to learn next", tracked: false },
  ];

  return (
    <article className="dossier lesson chapter">
      <div className="progress-sticky" data-pagefind-ignore>
        <CompactProgress meta={meta} variant="line" />
        <StripBackToTop />
      </div>

      <div data-pagefind-body className="chapter-grid">
        <header className="chapter-head">
          <div className="chapter-title">
            <div className="topic-tagline" data-pagefind-ignore>
              <span className="chapter-group">{topic.group ?? "Concept"}</span>
              {number && <span className="label">Topic {number}</span>}
              {topic.interviewRelevance && <InterviewTag level={topic.interviewRelevance} />}
            </div>
            <Overprint as="h1" className="chapter-h1" data-pagefind-meta="title">
              {topic.title}
            </Overprint>
          </div>
          <dl className="chapter-meta" data-pagefind-ignore>
            <div>
              <dt>Read first</dt>
              <dd>
                <TopicList topics={prerequisites} reasons={topic.prerequisiteReasons} />
              </dd>
            </div>
            <div>
              <dt>Makes possible</dt>
              <dd>
                <TopicList topics={dependents} />
              </dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd className="reading-time">{readingLabel(topic, news)}</dd>
            </div>
          </dl>
        </header>

        <div className="chapter-body">
          <LessonRail meta={meta} entries={entries} />
          <div className="chapter-main">
            <div className="chapter-intro">
            <div className="lesson-top" data-pagefind-ignore>
              <ResumeLine meta={meta} names={names} />
            </div>

            <InShort topic={topic} />

            <p className="concept">{topic.concept}</p>
            <div className="lesson-top" data-pagefind-ignore>
              <p className="lesson-jump" data-tour="jump">
                {learnHref && (
                  <Link className="text-button" href={learnHref} prefetch={false}>
                    New to this? Start from zero
                  </Link>
                )}
                <a className="text-button" href="#posts">
                  Skip to the posts
                </a>
              </p>
              <p className="lesson-tour">
                <TourLink tour="topic" />
              </p>
            </div>
            </div>

        <div id="concept" className="part">
          <p className="label part-label">Part A: Concept</p>

          <section id="why" aria-labelledby="why-h">
            <Overprint as="h2" id="why-h">Why it exists</Overprint>
            <CopyLink id="why" />
            <Outcome text={l.why.outcome} />
            <Paragraphs text={l.why.body} g={glossFor("why")} />
            {mt("why", ...l.why.body.split("\n\n"))}
            {l.why.diagram && <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(l.why.diagram) }} />}
            <MarkDone meta={meta} unit="why" />
          </section>

          <section id="model" aria-labelledby="model-h">
            <Overprint as="h2" id="model-h">Mental model</Overprint>
            <CopyLink id="model" />
            <Outcome text={l.mentalModel.outcome} />
            <Paragraphs text={l.mentalModel.body} g={glossFor("model")} />
            {mt("model", ...l.mentalModel.body.split("\n\n"))}
            <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(l.mentalModel.diagram) }} />
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
            <Overprint as="h2" id="how-h">How it works</Overprint>
            <CopyLink id="how" />
            <Outcome text={l.howItWorks.outcome} />
            <ol className="walkthrough">
              {l.howItWorks.steps.map((s) => (
                <li key={s.step}>
                  <strong>{s.step}.</strong> {gHow(s.explanation)}
                </li>
              ))}
            </ol>
            <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(l.howItWorks.diagram) }} />
            {l.howItWorks.stepper && (
              <StepThroughLazy frames={l.howItWorks.stepper.frames.map((f) => ({ caption: f.caption, html: diagramHtml(f.diagram) }))} />
            )}
            {mt("how", ...l.howItWorks.steps.map((x) => x.explanation))}
            <MarkDone meta={meta} unit="how" />
          </section>

          <section id="example" aria-labelledby="example-h">
            <Overprint as="h2" id="example-h">Worked example</Overprint>
            <CopyLink id="example" />
            <Outcome text={l.workedExample.outcome} />
            <ol className="walkthrough">
              {l.workedExample.steps.map((s) => (
                <li key={s.step}>
                  <strong>{s.step}.</strong> {gExample(s.explanation)}
                </li>
              ))}
            </ol>
            <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(l.workedExample.diagram) }} />
            {mt("example", ...l.workedExample.steps.map((x) => x.explanation))}
            <MarkDone meta={meta} unit="example" />
          </section>

          <section id="mistakes" aria-labelledby="mistakes-h">
            <Overprint as="h2" id="mistakes-h">Common mistakes</Overprint>
            <CopyLink id="mistakes" />
            <Outcome text={l.mistakesOutcome} />
            <ol className="mistakes">
              {topic.mistakes.map((m) => (
                <li key={m}>{gMistakes(m)}</li>
              ))}
            </ol>
            {l.mistakesDiagram && <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(l.mistakesDiagram) }} />}
            {mt("mistakes", ...topic.mistakes)}
            <MarkDone meta={meta} unit="mistakes" />
          </section>

          <section id="check" aria-labelledby="check-h" data-pagefind-ignore>
            <Overprint as="h2" id="check-h" data-tour="check">Check yourself</Overprint>
            <CopyLink id="check" />
            <Outcome text={l.checkOutcome} />
            <QuizBlock meta={meta} quiz={l.quiz} names={names} />
          </section>

        </div>

        <div id="posts" className="part">
          <div className="part-head" data-pagefind-ignore>
            <p className="label part-label">Part B: Real world</p>
            <a className="text-button label" href="#concept">
              Back to concept
            </a>
          </div>

          <section aria-labelledby="posts-h">
            <Overprint as="h2" id="posts-h" className="part-title" data-tour="posts">How companies use it</Overprint>
            <Outcome text={l.postsOutcome} />
            {backgroundHref && (
              <p className="posts-background" data-pagefind-ignore>
                <span>Before you read these posts:</span>
                <Link href={backgroundHref}>Background for this topic</Link>
              </p>
            )}
          </section>

          {topic.posts.map((post, i) => (
            <div key={post.url} id={post.id}>
              <PostDigest post={post} index={i} titles={titles} />
              <MarkDone meta={meta} unit={post.id!} />
            </div>
          ))}

          {topic.posts.length >= 2 && topic.comparison && (
            <section id="differ" className="closing" aria-labelledby="differ-h">
              <Overprint as="h2" id="differ-h">Where they differ</Overprint>
              <CopyLink id="differ" />
              <Outcome text={l.differOutcome} />
              {topic.comparison.split("\n\n").map((para) => (
                <p key={para.slice(0, 40)}>{gDiffer(para)}</p>
              ))}
              {mt("differ", ...topic.comparison!.split("\n\n"))}
              {topic.comparisonDiagram && <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(topic.comparisonDiagram) }} />}
            </section>
          )}

          <section id="exercises" className="closing" aria-labelledby="exercises-h" data-pagefind-ignore>
            <Overprint as="h2" id="exercises-h" data-tour="exercises">Design exercises</Overprint>
            <CopyLink id="exercises" />
            <Outcome text={l.exercisesOutcome} />
            <ol className="exercises">
              {l.exercises.map((x) => (
                <li key={x.prompt}>
                  <p className="label">{LEVELS[x.level]}</p>
                  <p>{x.prompt}</p>
                  <Reveal show="Show a model answer" hide="Hide the model answer">
                    <p>{x.answer}</p>
                    {x.diagram && <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(x.diagram) }} />}
                    <h3>Trade-offs</h3>
                    <p>{x.tradeoffs}</p>
                    <h3>Common wrong answers</h3>
                    <ul className="wrong">
                      {x.wrongAnswers.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                    <p>
                      <a href={`#${x.teaches}`}>Review: {SECTION_NAMES[x.teaches]}</a>
                    </p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>

          <section id="next" className="closing" aria-labelledby="next-h">
            <Overprint as="h2" id="next-h">What to learn next</Overprint>
            <Outcome text={l.next.outcome} />
            <Paragraphs text={l.next.body} g={glossFor("next")} />
            {mt("next", ...l.next.body.split("\n\n"))}
            <div data-pagefind-ignore>
              <TopicList topics={dependents} />
            </div>
          </section>

          <FinishTopic meta={meta} />
        </div>
          </div>
        </div>
      </div>

      <WhatsNew title={topic.title} news={news ?? null} />

      <OriginalPosts posts={topic.posts} />

      <PageUpdated date={updated} />
      <SiteFooter tour="topic" />
    </article>
  );
}
