import fs from "node:fs";
import path from "node:path";

export type Post = {
  title: string;
  url: string;
  company: string;
  summary: string;
};

/** Index headings, in curriculum order. */
export const GROUPS = ["Foundations", "Scaling", "Data"] as const;
export type Group = (typeof GROUPS)[number];

export type Topic = {
  slug: string;
  title: string;
  group?: Group;
  concept: string;
  prerequisites: string[];
  posts: Post[];
  /** Short prose comparing the posts' approaches; shown when a topic has two or more posts. */
  comparison?: string;
};

const TOPICS_DIR = path.join(process.cwd(), "content", "topics");

export function getAllTopics(): Topic[] {
  return fs
    .readdirSync(TOPICS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, f), "utf8")) as Topic)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getTopic(slug: string): Topic | undefined {
  return getAllTopics().find((t) => t.slug === slug);
}

/** Topics that list `slug` as a prerequisite. */
export function getDependents(slug: string): Topic[] {
  return getAllTopics().filter((t) => t.prerequisites.includes(slug));
}
