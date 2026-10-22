// Reading-time estimate for a topic, from the actual text the page renders.
// Pure and content-derived (no hardcoded minutes), so it is testable and the
// homepage/index "compute from data" rule holds.
import type { Topic } from "./topics";
import type { News } from "./news";
import { figureProse } from "./figures";

// Technical prose with diagrams and code reads slower than casual text; 200 wpm
// is a common, defensible estimate for careful reading. Each diagram adds a
// flat look-at allowance since a reader studies it rather than reading words.
const WORDS_PER_MINUTE = 200;
const SECONDS_PER_DIAGRAM = 12;

/** Words in a plain string (SVG markup and code are not counted as prose). */
function words(text: string | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Every prose string the topic page actually renders, in reading order. */
function proseStrings(topic: Topic): string[] {
  const out: string[] = [topic.concept, ...(topic.summary?.points ?? []), ...(topic.summary?.figures.map((f) => f.label) ?? []), ...Object.values(topic.prerequisiteReasons ?? {})];
  const l = topic.lesson;
  if (l) {
    out.push(l.why.outcome, l.why.body);
    out.push(l.mentalModel.outcome, l.mentalModel.body);
    out.push(l.howItWorks.outcome, ...l.howItWorks.steps.flatMap((s) => [s.step, s.explanation]));
    out.push(l.workedExample.outcome, ...l.workedExample.steps.flatMap((s) => [s.step, s.explanation]));
    out.push(l.mistakesOutcome, l.checkOutcome);
    for (const q of l.quiz) out.push(q.question, ...q.options, q.why, ...q.wrong);
    out.push(l.postsOutcome, l.differOutcome, l.exercisesOutcome);
    for (const e of l.exercises) out.push(e.prompt, e.answer, e.tradeoffs, ...e.wrongAnswers);
    out.push(l.next.outcome, l.next.body);
  } else {
    if (topic.primer) out.push(topic.primer);
    for (const q of topic.quiz ?? []) out.push(q.question, q.answer);
    if (topic.exercise) out.push(topic.exercise.prompt, topic.exercise.answer);
  }
  for (const m of topic.mistakes) out.push(m);
  for (const g of topic.glossary) out.push(g.term, g.definition);
  if (topic.comparison) out.push(topic.comparison);
  for (const p of topic.posts) {
    const d = p.digest;
    out.push(d.problem, d.constraints);
    out.push(...d.walkthrough.flatMap((s) => [s.step, s.explanation]));
    out.push(...d.numbers.flatMap((n) => [n.value, n.meaning]));
    out.push(d.tradeoffs.chosen, d.tradeoffs.rejected ?? "", d.tradeoffs.why);
    out.push(d.failures, d.takeaways);
    out.push(...figureProse(d.figure, d.numbers, { company: p.company, year: p.published.slice(0, 4), postId: p.id ?? "" }));
  }
  return out;
}

/** Count of diagrams the page renders (lesson figures and one per post). */
function diagramCount(topic: Topic): number {
  let n = topic.posts.length + topic.posts.filter((p) => p.digest.figure).length; // each post digest has a diagram, some a figure
  if (topic.lesson?.howItWorks.stepper) n += 1;
  if (topic.lesson) n += 3; // mental model, how it works, worked example
  return n;
}

/** Unrounded reading time of a topic page, in minutes. */
export function readingExact(topic: Topic, news?: News | null): number {
  // What's new renders each item's title and summary below the page, so they count too.
  const newsProse = (news?.items ?? []).flatMap((i) => [i.title, i.summary]);
  const wordCount = [...proseStrings(topic), ...newsProse].reduce((sum, s) => sum + words(s), 0);
  return wordCount / WORDS_PER_MINUTE + (diagramCount(topic) * SECONDS_PER_DIAGRAM) / 60;
}

/** Minutes to read a topic page, rounded to a whole minute (never below 1). */
export function readingMinutes(topic: Topic, news?: News | null): number {
  return Math.max(1, Math.round(readingExact(topic, news)));
}

/** The label shown on the page, e.g. "~8 min read". */
export function readingLabel(topic: Topic, news?: News | null): string {
  return `~${readingMinutes(topic, news)} min read`;
}

// ── Start-from-zero learn pages ───────────────────────────────────────────

import type { Learn } from "./learn";

/** Every prose string a learn page renders (citation markup is left in; it is a few chars). */
function learnProseStrings(learn: Learn): string[] {
  const out: string[] = [learn.promise];
  for (const t of learn.before.terms) out.push(t.term, t.definition);
  if (learn.before.note) out.push(learn.before.note);
  for (const s of learn.stages) {
    out.push(s.name, ...s.body);
    for (const t of s.terms) out.push(t.term, t.definition);
    for (const r of s.reading) out.push(r.section, r.what);
    out.push(...s.canNow);
  }
  for (const m of learn.misconceptions) out.push(m.myth, m.truth);
  out.push(learn.tryIt.intro);
  for (const c of learn.tryIt.commands) out.push(c.shows, c.note ?? "", c.warning ?? ""); // command text is code, not prose
  out.push(learn.next);
  return out;
}

/** Minutes to read a learn page, from the text it renders plus its stage diagrams. */
export function learnReadingMinutes(learn: Learn): number {
  const wordCount = learnProseStrings(learn).reduce((sum, s) => sum + words(s), 0);
  const diagrams = learn.stages.filter((s) => s.diagram).length;
  const minutes = wordCount / WORDS_PER_MINUTE + (diagrams * SECONDS_PER_DIAGRAM) / 60;
  return Math.max(1, Math.round(minutes));
}

/** The label shown on a learn page, e.g. "~6 min read". */
export function learnReadingLabel(learn: Learn): string {
  return `~${learnReadingMinutes(learn)} min read`;
}
