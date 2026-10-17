"use client";

import Link from "next/link";
import type { Capstone } from "@/lib/capstones";
import { quizKey } from "@/lib/capstoneRail";
import { useStoredChoices } from "./useStoredChoices";

/** Check yourself: choose an option, then read why it is right and why the others are not. Answers are kept with the capstone picks. */
export default function CapstoneQuiz({ slug, quiz, topicTitles }: { slug: string; quiz: Capstone["quiz"]; topicTitles: Record<string, string> }) {
  const [picks, setPick] = useStoredChoices(slug);
  return (
    <div className="cap-quiz">
      {quiz.map((q, n) => {
        const stored = picks[quizKey(n)];
        const p = Number.isInteger(stored) && stored >= 0 && stored < q.options.length ? stored : undefined;
        return (
          <fieldset key={q.question} className="cap-decision">
            <legend>
              <span className="label">
                Question {n + 1}
              </span>
              <span className="cap-question">{q.question}</span>
            </legend>
            <ul className="cap-options">
              {q.options.map((o, i) => (
                <li key={o}>
                  <button type="button" className="cap-option" aria-pressed={p === i} onClick={() => setPick(quizKey(n), i)}>
                    <span className="cap-mark" aria-hidden="true" />
                    <span>{o}</span>
                    {p !== undefined && (p === i || q.correct === i) && <span className="label cap-tag">{q.correct === i ? "Correct" : "Your pick"}</span>}
                  </button>
                  {p !== undefined && <p className="cap-why">{q.correct === i ? q.why : q.wrong[i]}</p>}
                </li>
              ))}
            </ul>
            <div aria-live="polite">
              {p !== undefined && (
                <p>
                  <Link href={`/topic/${q.teaches}`}>Review: {topicTitles[q.teaches] ?? q.teaches}</Link>
                </p>
              )}
            </div>
          </fieldset>
        );
      })}
      <noscript>
        <div className="cap-noscript">
          <p className="label">Answers (shown because scripts are off)</p>
          {quiz.map((q) => (
            <p key={q.question}>
              {q.question} {q.options[q.correct]}. {q.why}
            </p>
          ))}
        </div>
      </noscript>
    </div>
  );
}
