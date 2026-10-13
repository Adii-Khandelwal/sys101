"use client";

import { useEffect, useMemo, useState } from "react";
import { lastViewedOnLoad, useLesson } from "@/lib/progress";
import { optionId } from "@/lib/quizIds";
import { RevealPanel } from "./Reveal";
import {
  markAllDone,
  unmarkAllDone,
  quizComplete,
  summary,
  counts,
  quizScore,
  retryQuiz,
  answer,
  toggleUnit,
  topicOf,
  unitStatus,
  type LessonMeta,
} from "@/lib/lessonStore";

/** Props from the server are new objects each render; key the meta by its contents. */
function useMeta(meta: LessonMeta) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => meta, [meta.slug, meta.postIds.join(), meta.correct.join()]);
}

/** Plain text toggle at the end of a tracked section or post. */
export function MarkDone({ meta, unit }: { meta: LessonMeta; unit: string }) {
  const m = useMeta(meta);
  const { progress, update } = useLesson(m);
  const done = unitStatus(progress, m, unit) === "done";
  return (
    <p className="mark-row" data-pagefind-ignore>
      <button
        type="button"
        className="text-button label mark-done"
        aria-pressed={done}
        onClick={() => update((p) => toggleUnit(p, m, unit))}
      >
        <span className="mark-square" aria-hidden="true" />
        <span className="swap">
          <span data-hidden={done || undefined} aria-hidden={done || undefined}>
            Mark done
          </span>
          <span data-hidden={!done || undefined} aria-hidden={!done || undefined}>
            Done
          </span>
        </span>
      </button>
    </p>
  );
}

/** End-of-topic button: marks every section and post done in one go. */
export function FinishTopic({ meta }: { meta: LessonMeta }) {
  const m = useMeta(meta);
  const { progress, update } = useLesson(m);
  const s = summary(progress, m);
  const quizLeft = !quizComplete(progress, m);
  const allMarked = s.done === s.total || (quizLeft && s.done === s.total - 1);
  return (
    <div className="finish-topic" data-pagefind-ignore>
      <button
        type="button"
        className="text-button label mark-done"
        aria-pressed={allMarked}
        onClick={() => update((p) => (allMarked ? unmarkAllDone(p, m) : markAllDone(p, m)))}
      >
        <span className="mark-square" aria-hidden="true" />
        {allMarked ? "Every section is done" : "I have finished this topic"}
      </button>
      {quizLeft && (
        <p className="finish-note">
          The quiz counts once every question is answered. <a href="#check">Go to the quiz</a>
        </p>
      )}
    </div>
  );
}

/**
 * "3 of 8 done", a segmented bar (concept, quiz, posts), and Start, Continue
 * or Review. The per-group detail shows as a tooltip on hover or focus and is
 * always available to screen readers. `line` is the one-line narrow-screen form.
 */
export function CompactProgress({ meta, variant = "rail" }: { meta: LessonMeta; variant?: "rail" | "line" }) {
  const m = useMeta(meta);
  const { progress } = useLesson(m);
  const s = summary(progress, m);
  const c = counts(progress, m);
  const detail = `Concept ${c.concept} of ${c.conceptTotal}, quiz ${c.quiz.answered} of ${c.quiz.total} answered, posts ${c.posts} of ${c.postsTotal}`;
  // "Start" would only point at the first section, which is right below: nothing to offer until something is done.
  const link = s.action === "Start" ? null : <a href={`#${s.target}`}>{s.action}</a>;

  if (variant === "line") {
    return (
      <p className="progress-line label" aria-live="polite" data-tour="progress">
        <span key={s.done} className="fade-swap">
          {s.done}
        </span>{" "}
        of {s.total} done<span className="visually-hidden"> ({detail})</span>
        {link && <> · {link}</>}
      </p>
    );
  }
  return (
    <div className="progress-head" aria-live="polite" data-tour="progress">
      <p className="label">
        <span key={s.done} className="fade-swap">
          {s.done}
        </span>{" "}
        of {s.total} done
      </p>
      <div className="progress-bar" tabIndex={0} aria-label={`${s.done} of ${s.total} done. ${detail}`}>
        {s.segments.map((seg, i) => (
          <span
            key={seg.unit}
            className={`seg${seg.done ? " is-done" : ""}${i > 0 && s.segments[i - 1].group !== seg.group ? " group-start" : ""}`}
          />
        ))}
        <span className="progress-tip label" aria-hidden="true">
          Concept {c.concept}/{c.conceptTotal} · Quiz {c.quiz.answered}/{c.quiz.total} · Posts {c.posts}/{c.postsTotal}
        </span>
      </div>
      {link && <p className="label">{link}</p>}
    </div>
  );
}

/** Shown on return: a link back to the last section viewed on the previous visit. */
export function ResumeLine({ meta, names }: { meta: LessonMeta; names: Record<string, string> }) {
  // Read after hydration, so the server and first client render match.
  const [last, setLast] = useState<string>();
  useEffect(() => setLast(lastViewedOnLoad(meta.slug)), [meta.slug]);
  if (!last || last === "why" || !names[last]) return null;
  return (
    <p className="resume label" data-pagefind-ignore>
      <a href={`#${last}`}>Continue where you left off: {names[last]}</a>
    </p>
  );
}

type Question = { question: string; options: string[]; correct: number; why: string; wrong: string[]; teaches: string };

/** Scored quiz: answers are stored, explanations appear after answering, and Retry clears them. */
export function QuizBlock({ meta, quiz, names }: { meta: LessonMeta; quiz: Question[]; names: Record<string, string> }) {
  const m = useMeta(meta);
  const { progress, update } = useLesson(m);
  const answers = topicOf(progress, m.slug).answers;
  const score = quizScore(progress, m);
  return (
    <>
      <ol className="quiz">
        {quiz.map((q, i) => {
          const chosen = answers[i]; // an option id
          const answered = chosen !== undefined;
          const ids = q.options.map(optionId);
          const right = answered && chosen === ids[q.correct];
          return (
            <li key={q.question}>
              <p>{q.question}</p>
              <ol className="options">
                {q.options.map((o, j) => (
                  <li key={o}>
                    <button
                      type="button"
                      className={`option${chosen === ids[j] ? (j === q.correct ? " is-right" : " is-wrong") : ""}`}
                      aria-pressed={chosen === ids[j]}
                      disabled={answered}
                      onClick={() => update((p) => answer(p, m.slug, i, ids[j]))}
                    >
                      {o}
                    </button>
                    {answered && j === q.correct && <span className="verdict">Correct answer</span>}
                    {answered && chosen === ids[j] && j !== q.correct && <span className="verdict is-wrong">Your answer</span>}
                  </li>
                ))}
              </ol>
              <RevealPanel open={answered}>
                <div className="explain" aria-live="polite">
                  <p>
                    <strong>{right ? "Right." : "Not quite."}</strong> {right ? "" : <>The answer is &ldquo;{q.options[q.correct]}&rdquo;. </>}
                    {q.why}
                  </p>
                  <ul className="wrong">
                    {q.options.map((_, j) =>
                      j === q.correct ? null : (
                        <li key={j}>
                          <strong>&ldquo;{q.options[j]}&rdquo; is wrong:</strong> {q.wrong[j]}
                        </li>
                      ),
                    )}
                  </ul>
                  <p>
                    <a href={`#${q.teaches}`}>Review: {names[q.teaches]}</a>
                  </p>
                </div>
              </RevealPanel>
            </li>
          );
        })}
      </ol>
      <p className="quiz-score" aria-live="polite">
        {score.answered === 0
          ? `${score.total} questions. Pick an answer to see why it is right or wrong.`
          : `${score.correct} of ${score.total} correct${score.answered < score.total ? `, ${score.total - score.answered} left` : ""}.`}{" "}
        {score.answered > 0 && (
          <button type="button" className="text-button label" onClick={() => update((p) => retryQuiz(p, m.slug))}>
            Retry
          </button>
        )}
      </p>
    </>
  );
}
