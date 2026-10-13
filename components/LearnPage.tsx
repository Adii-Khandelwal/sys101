import { diagramHtml } from "@/lib/diagramHtml";
import Link from "next/link";
import { Fragment } from "react";
import PageUpdated from "./PageUpdated";
import SiteFooter from "./SiteFooter";
import LearnRail, { type LearnEntry } from "./LearnRail";
import VideoEmbed from "./VideoEmbed";
import { prerequisiteLabel, type Learn, type Source, type VideoSource } from "@/lib/learn";
import type { Topic } from "@/lib/topics";
import { learnUpdated } from "@/lib/site";
import { learnReadingLabel } from "@/lib/readingTime";
import { StripBackToTop } from "./BackToTop";

type Props = { topic: Topic; learn: Learn; titles: Map<string, string> };

const isVideo = (s: Source): s is VideoSource => s.kind === "video";

/** Text with [[source-id]] citations turned into numbered links to the Sources list, and [text](/path) into internal links. */
function Cited({ text, number }: { text: string; number: Map<string, number> }) {
  const parts = text.split(/(\[\[[a-z0-9-]+\]\]|\[[^[\]]+\]\(\/[^)\s]*\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const cite = part.match(/^\[\[([a-z0-9-]+)\]\]$/);
        if (cite) {
          return (
            <sup key={i} className="cite">
              <a href={`#src-${cite[1]}`} aria-label={`Source ${number.get(cite[1])}`}>
                [{number.get(cite[1])}]
              </a>
            </sup>
          );
        }
        const link = part.match(/^\[([^[\]]+)\]\((\/[^)\s]*)\)$/);
        if (link) return <Link key={i} href={link[2]}>{link[1]}</Link>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Plain text link to a video: nothing loads from YouTube unless the reader follows it. */
/** "Start from zero": a beginner's path through one topic, built from official sources. */
export default function LearnPage({ topic, learn, titles }: Props) {
  const number = new Map(learn.sources.map((s, i) => [s.id, i + 1]));
  const byId = new Map(learn.sources.map((s) => [s.id, s]));
  const name = (id: string) => byId.get(id)?.title ?? id;

  // Contents of the page, in order, for the rail and the narrow-screen line.
  const entries: LearnEntry[] = [
    { id: "before", name: "Before you start" },
    ...learn.stages.map((st) => ({ id: st.id, name: st.name })),
    { id: "myths", name: "Common misconceptions" },
    { id: "try", name: "Try it" },
    { id: "next", name: "Where to go next" },
  ];

  return (
    <article className="dossier learn lesson">
      <LearnRail entries={entries} />
      <div className="progress-sticky" data-pagefind-ignore>
        <LearnRail entries={entries} variant="line" />
        <StripBackToTop />
      </div>

      <nav className="label" data-pagefind-ignore>
        <Link href={`/topic/${topic.slug}`}>Back to {topic.title}</Link>
      </nav>

      <div data-pagefind-body>
        <div className="topic-tagline" data-pagefind-ignore>
          <span className="label">Start from zero</span>
          <span className="label reading-time">{learnReadingLabel(learn)}</span>
        </div>
        <h1 data-pagefind-meta="title">Start from zero: {topic.title}</h1>
        <p className="concept">{learn.promise}</p>
        <p className="learn-note" data-pagefind-ignore>
          A beginner&apos;s path through {topic.title}, built only from official sources. It is separate from your
          progress on the topic page.
        </p>

        <section id="before" className="learn-section" aria-labelledby="before-h">
          <h2 id="before-h">Before you start</h2>
          {learn.before.note && <p>{learn.before.note}</p>}
          {learn.before.prerequisites.length > 0 && (
            <p>
              {prerequisiteLabel(learn.before.note)}{" "}
              {learn.before.prerequisites.map((s, i) => (
                <Fragment key={s}>
                  {i > 0 && ", "}
                  <Link href={`/topic/${s}`}>{titles.get(s) ?? s}</Link>
                </Fragment>
              ))}
              .
            </p>
          )}
          {learn.before.prerequisites.some((s) => topic.prerequisiteReasons?.[s]) && (
            <ul className="relation-reasons">
              {learn.before.prerequisites.map(
                (s) =>
                  topic.prerequisiteReasons?.[s] && (
                    <li key={s}>{topic.prerequisiteReasons[s]}</li>
                  ),
              )}
            </ul>
          )}
          <dl className="learn-terms">
            {learn.before.terms.map((t) => (
              <div key={t.term}>
                <dt>{t.term}</dt>
                <dd>{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        {learn.stages.map((st, i) => {
          const video = st.video ? byId.get(st.video) : undefined;
          return (
            <section key={st.id} id={st.id} className="learn-section" aria-labelledby={`${st.id}-h`}>
              <p className="label">Stage {i + 1}</p>
              <h2 id={`${st.id}-h`}>{st.name}</h2>
              {st.body.map((p, j) => (
                <p key={j}>
                  <Cited text={p} number={number} />
                </p>
              ))}

              {st.diagram && <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(st.diagram) }} />}

              <h3>Key terms</h3>
              <dl className="learn-terms">
                {st.terms.map((t) => (
                  <div key={t.term}>
                    <dt>{t.term}</dt>
                    <dd>{t.definition}</dd>
                  </div>
                ))}
              </dl>

              <h3>Official reading</h3>
              <ul className="learn-reading">
                {st.reading.map((r, j) => (
                  <li key={j}>
                    <a href={byId.get(r.source)!.url} target="_blank" rel="noopener noreferrer">
                      {name(r.source)}
                    </a>
                    , {r.section}. {r.what}{" "}
                    <sup className="cite">
                      <a href={`#src-${r.source}`} aria-label={`Source ${number.get(r.source)}`}>
                        [{number.get(r.source)}]
                      </a>
                    </sup>
                  </li>
                ))}
              </ul>

              {video && isVideo(video) && <VideoEmbed video={video} />}

              <h3>You can now</h3>
              <ul className="learn-can">
                {st.canNow.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          );
        })}

        <section id="myths" className="learn-section" aria-labelledby="myths-h">
          <h2 id="myths-h">Common misconceptions</h2>
          <dl className="learn-myths">
            {learn.misconceptions.map((m) => (
              <div key={m.myth}>
                <dt>{m.myth}</dt>
                <dd>
                  <Cited text={m.truth} number={number} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="try" className="learn-section" aria-labelledby="try-h">
          <h2 id="try-h">Try it</h2>
          <p>
            <Cited text={learn.tryIt.intro} number={number} />
          </p>
          <ul className="learn-try">
            {learn.tryIt.commands.map((c) => (
              <li key={c.command}>
                {c.warning && (
                  <p className="learn-warn">
                    <strong>Warning:</strong> {c.warning}
                  </p>
                )}
                <pre className="learn-code" tabIndex={0} aria-label="Example, scrolls sideways">
                  <code>{c.command}</code>
                </pre>
                {c.exampleNames && c.exampleNames.length > 0 && (
                  <span className="learn-names">Example names, not from the docs: {c.exampleNames.join(", ")}.</span>
                )}
                <span>
                  {c.shows}
                  {c.note ? ` ${c.note}` : ""}{" "}
                  <sup className="cite">
                    <a href={`#src-${c.source}`} aria-label={`Source ${number.get(c.source)}`}>
                      [{number.get(c.source)}]
                    </a>
                  </sup>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section id="next" className="learn-section" aria-labelledby="next-h">
          <h2 id="next-h">Where to go next</h2>
          <p>
            <Cited text={learn.next} number={number} />
          </p>
          <p>
            <Link href={`/topic/${topic.slug}`}>The {topic.title} topic page</Link> ·{" "}
            <Link href={`/topic/${topic.slug}#posts`}>Its posts</Link>
          </p>
        </section>
      </div>

      <section className="learn-section" aria-labelledby="sources-h" data-pagefind-ignore>
        <h2 id="sources-h">Sources</h2>
        <ol className="learn-sources">
          {learn.sources.map((s) => (
            <li key={s.id} id={`src-${s.id}`}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
              </a>
              <span className="learn-source-meta">
                {" "}
                {s.publisher}. {isVideo(s) ? `Video, ${s.channel}, ${s.length}` : s.kind}
                {s.year === "no date shown" ? "" : `, ${s.year}`}.{s.note ? ` ${s.note}` : ""}
                {isVideo(s) ? " Not vetted line by line like the written sources." : ""}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <PageUpdated date={learnUpdated(learn)} />
      <SiteFooter />
    </article>
  );
}
