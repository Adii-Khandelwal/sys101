import { INTERVIEW_RELEVANCE_LABEL, type InterviewRelevance } from "@/lib/topics";

/**
 * A small mono small-caps marker saying how often a topic appears in system
 * design interviews. Shown beside the group label on the topic page. State is
 * carried by the text, not colour alone; "core" also takes the rust accent.
 */
export default function InterviewTag({ level }: { level: InterviewRelevance }) {
  return (
    <span className={`interview-tag label is-${level}`}>{INTERVIEW_RELEVANCE_LABEL[level]}</span>
  );
}
