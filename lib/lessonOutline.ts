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

/** Section names of a lesson topic with its real counts, for the "Inside a topic" preview. */
export function topicSections(topic: Topic) {
  const l = topic.lesson;
  if (!l) throw new Error(`Inside a topic: "${topic.slug}" has no lesson`);
  const counts: Record<string, string> = {
    check: `${l.quiz.length} questions`,
    posts: `${topic.posts.length} posts`,
    exercises: `${l.exercises.length} exercises`,
  };
  return LESSON_OUTLINE.map((s) => ({ ...s, count: counts[s.id] }));
}

/**
 * Digest figures the homepage rotates through, one a day, picked because each reads clearly on its own
 * with the post's title beside it. Each must exist in a post digest, and the first is the default.
 */
export const FEATURED_FIGURES: { post: string; value: string }[] = [
  { post: "cloudflare-dns-builds-2022", value: "150x" },
  { post: "meta-cache-consistency-2022", value: "over 1 quadrillion" },
  { post: "cloudflare-pingora-2022", value: "160x" },
  { post: "cloudflare-ketama-ram-2026", value: "over 100TB" },
  { post: "github-mysql-8-upgrade-2023", value: "5.5 million" },
  { post: "discord-search-indexing-2025", value: "500ms to under 100ms" },
  { post: "uber-dynamic-subsetting-2022", value: "up to 40%" },
  { post: "meta-foqs-2021", value: "close to one trillion" },
  { post: "meta-mysql-raft-2023", value: "about 2 s vs 20 to 40 s" },
  { post: "notion-postgres-sharding-2021", value: "5 minutes" },
  { post: "cloudflare-rate-limiting-2017", value: "400,000 per second" },
];

export type Figure = { value: string; meaning: string; company: string; year: string; url: string; postTitle: string };

/** The featured figures, read from the posts' digests. A missing post or figure fails the build. */
export function featuredFigures(topics: Topic[]): Figure[] {
  const posts = topics.flatMap((t) => t.posts);
  return FEATURED_FIGURES.map(({ post: id, value }) => {
    const post = posts.find((p) => p.id === id);
    const n = post?.digest.numbers.find((x) => x.value === value && x.meaning.trim());
    if (!post || !n) throw new Error(`Featured figure "${value}" was not found in post "${id}"`);
    return { value: n.value, meaning: n.meaning, company: post.company, year: post.published.slice(0, 4), url: post.url, postTitle: post.title };
  });
}
