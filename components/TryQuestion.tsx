"use client";

import { useState } from "react";
import Link from "next/link";
import type { LessonQuestion } from "@/lib/topics";

type Props = { slug: string; topicTitle: string; question: Pick<LessonQuestion, "question" | "options" | "correct" | "why" | "wrong"> };

/**
 * One real quiz question as a taste of a topic. The choice lives in component
 * state only: it never touches the progress store, and a reload starts fresh.
 */
export default function TryQuestion({ slug, topicTitle, question: q }: Props) {
  const [chosen, setChosen] = useState<number | null>(null);
  const right = chosen === q.correct;

  return (
    <section className="home-extra" aria-labelledby="try-heading">
      <h2 id="try-heading" className="label">
        Try a question
      </h2>
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
            <p>
              <Link href={`/topic/${slug}`}>Open {topicTitle}</Link>
            </p>
          </>
        )}
      </div>
      <noscript>
        <p>
          <Link href={`/topic/${slug}#check`}>Open {topicTitle} to answer it</Link>
        </p>
      </noscript>
    </section>
  );
}
