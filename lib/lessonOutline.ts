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

/** The digest figure the preview features, picked because it reads clearly on its own. Must exist in the data. */
export const FEATURED_FIGURE = { topic: "dns", post: "cloudflare-dns-builds-2022", value: "150x" };

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
  const posts = [...topic.posts].sort((a, b) =>
    topic.slug === FEATURED_FIGURE.topic ? Number(b.id === FEATURED_FIGURE.post) - Number(a.id === FEATURED_FIGURE.post) : 0,
  );
  for (const post of posts) {
    const featured = topic.slug === FEATURED_FIGURE.topic && post.id === FEATURED_FIGURE.post;
    const n = post.digest.numbers.find((x) => (featured ? x.value === FEATURED_FIGURE.value : x.value.trim()) && x.meaning.trim());
    if (n) {
      return { sections, figure: { ...n, company: post.company, year: post.published.slice(0, 4), url: post.url, postTitle: post.title } };
    }
  }
  return { sections, figure: null };
}
