import { INTERVIEW_RELEVANCE_LABEL, SHOW_INTERVIEW_TAGS, type InterviewRelevance } from "@/lib/topics";

/**
 * A small mono small-caps marker saying how often a topic appears in system
 * design interviews. Shown beside the group label on the topic page. State is
 * carried by the text, not colour alone; "core" also takes the orange accent.
 * Not rendered while SHOW_INTERVIEW_TAGS is false; the field stays in the content.
 */
export default function InterviewTag({ level }: { level: InterviewRelevance }) {
  if (!SHOW_INTERVIEW_TAGS) return null;
  return (
    <span className={`interview-tag label is-${level}`}>{INTERVIEW_RELEVANCE_LABEL[level]}</span>
  );
}
