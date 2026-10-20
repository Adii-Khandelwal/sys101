"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DURATION, prefersReducedMotion } from "@/lib/motion";
import type { LessonQuestion } from "@/lib/topics";

type Question = Pick<LessonQuestion, "question" | "options" | "correct" | "why" | "wrong">;
type Props = { slug: string; topicTitle: string; questions: Question[] };

/** How long the result stays up before the next question replaces it. */
const SHOW_RESULT_MS = 5000;

/**
 * Real quiz questions as a taste of a topic. Answering shows the result for five
 * seconds, then the next question fades in. The wait pauses while the pointer or
 * keyboard focus is inside, so nobody is cut off mid-read, and "Next question"
 * skips it. State is in the component only: it never touches the progress store.
 */
export default function TryQuestion({ slug, topicTitle, questions }: Props) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [held, setHeld] = useState(false); // pointer or focus inside: do not advance
  const q = questions[index];
  const right = chosen === q.correct;

  const advance = () => {
    // Fade the old question out, then swap; the new one fades in when it mounts.
    setLeaving(true);
    window.setTimeout(
      () => {
        setIndex((i) => (i + 1) % questions.length);
        setChosen(null);
        setLeaving(false);
      },
      prefersReducedMotion() ? DURATION.reduced : DURATION.base,
    );
  };

  useEffect(() => {
    if (chosen === null || held || leaving) return;
    const t = window.setTimeout(advance, SHOW_RESULT_MS);
    return () => window.clearTimeout(t);
    // advance only reads stable values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, held, leaving]);

  return (
    <section
      className="home-extra"
      aria-labelledby="try-heading"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <h2 id="try-heading" className="label">
        Try a question
      </h2>
      <div key={index} className={`try-body${leaving ? " is-leaving" : ""}`}>
        <p className="try-source label">From {topicTitle}, Check yourself</p>
        <p className="try-question" id="try-q">
          {q.question}
        </p>
        <ol className="options try-options" aria-labelledby="try-q">
          {q.options.map((o, j) => (
            <li key={o}>
              <button
                type="button"
                className={`option${chosen === j ? (right ? " is-right" : " is-wrong") : ""}`}
                aria-pressed={chosen === j}
                disabled={chosen !== null}
                onClick={() => setChosen(j)}
              >
                {o}
              </button>
            </li>
          ))}
        </ol>
        <div className="try-result" aria-live="polite">
          {chosen !== null && (
            <>
              <p>
                <strong>{right ? "Right." : "Not quite."}</strong> {right ? "" : <>The answer is &ldquo;{q.options[q.correct]}&rdquo;. </>}
                {q.why}
              </p>
              {!right && (
                <p className="try-wrong">
                  <strong>&ldquo;{q.options[chosen]}&rdquo; is wrong:</strong> {q.wrong[chosen]}
                </p>
              )}
              <p className="try-actions">
                <Link href={`/topic/${slug}`}>Open {topicTitle}</Link>
                <button type="button" className="text-button" onClick={advance}>
                  Next question
                </button>
              </p>
            </>
          )}
        </div>
      </div>
      <noscript>
        <p>
          <Link href={`/topic/${slug}#check`}>Open {topicTitle} to answer it</Link>
        </p>
      </noscript>
    </section>
  );
}
