import type { Topic } from "./topics";

/** The headings of a lesson topic page, in page order (checked against components/TopicLesson.tsx). */
export const LESSON_OUTLINE = [
  { id: "why", name: "Why it exists" },
  { id: "model", name: "Mental model" },
  { id: "how", name: "How it works" },
  { id: "example", name: "Worked example" },
  { id: "mistakes", name: "Common mistakes" },
  { id: "check", name: "Check yourself" },
  { id: "posts", name: "How companies use it" },
  { id: "differ", name: "Where they differ" },
  { id: "exercises", name: "Design exercises" },
  { id: "next", name: "What to learn next" },
] as const;

/**
 * What the "Inside a topic" preview shows for one lesson topic: its section names with
 * real counts, and one figure from the first post digest that has one (null if none).
 */
export function topicPreview(topic: Topic) {
  const l = topic.lesson;
  if (!l) throw new Error(`Inside a topic: "${topic.slug}" has no lesson`);
  const counts: Record<string, string> = {
    check: `${l.quiz.length} questions`,
    posts: `${topic.posts.length} posts`,
    exercises: `${l.exercises.length} exercises`,
  };
  const sections = LESSON_OUTLINE.map((s) => ({ ...s, count: counts[s.id] }));
  for (const post of topic.posts) {
    const n = post.digest.numbers.find((x) => x.value.trim() && x.meaning.trim());
    if (n) {
      return { sections, figure: { ...n, company: post.company, year: post.published.slice(0, 4), url: post.url } };
    }
  }
  return { sections, figure: null };
}
