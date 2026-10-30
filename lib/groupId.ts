/** Anchor of a topic group heading on /posts (the rail links to it). Its own file so the client list can import it without lib/topics (fs). The prefix keeps it clear of topic slugs. */
export const groupId = (group: string) => `group-${group.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
