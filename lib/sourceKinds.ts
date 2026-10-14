/** What the listed sources are, counted once per distinct URL. */
export type SourceCounts = { total: number; posts: number; papers: number; docs: number; organizations: number };

/** "32 engineering posts, 3 research papers and 1 documentation page": only the kinds that are present. */
export function sourceKinds(c: SourceCounts): string {
  const parts = [
    c.posts && `${c.posts} engineering ${c.posts === 1 ? "post" : "posts"}`,
    c.papers && `${c.papers} research ${c.papers === 1 ? "paper" : "papers"}`,
    c.docs && `${c.docs} documentation ${c.docs === 1 ? "page" : "pages"}`,
  ].filter(Boolean) as string[];
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : (parts[0] ?? "");
}
