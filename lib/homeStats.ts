import type { Topic } from "./topics";

/** Counts for the homepage proof line, computed from the topic data. */
export function homeStats(topics: Pick<Topic, "posts">[]) {
  const posts = topics.flatMap((t) => t.posts);
  return {
    topics: topics.length,
    posts: new Set(posts.map((p) => p.url)).size,
    companies: new Set(posts.map((p) => p.company)).size,
    lastChecked: posts.map((p) => p.verifiedOn).sort().at(-1) ?? "",
  };
}
