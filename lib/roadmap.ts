import fs from "node:fs";
import path from "node:path";
import type { Group, Topic } from "./topics";

/** Planned topics may sit in groups that no written topic uses yet. */
export type RoadmapGroup = Group | "Reliability" | "Case studies";
export const ROADMAP_GROUPS: readonly RoadmapGroup[] = ["Foundations", "Scaling", "Data", "Messaging", "Reliability", "Case studies"];

/** A topic in the curriculum that has no page yet. The file is in curriculum order. */
export type PlannedTopic = { title: string; group: RoadmapGroup };

const FILE = path.join(process.cwd(), "content", "roadmap.json");

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Problems with the planned list: bad entries, duplicates, or a topic that is already written. */
export function checkRoadmap(planned: PlannedTopic[], topics: Pick<Topic, "slug" | "title">[]): string[] {
  const problems: string[] = [];
  if (!Array.isArray(planned)) return ["roadmap.json must be a list"];
  const written = new Set(topics.flatMap((t) => [norm(t.title), norm(t.slug)]));
  const seen = new Set<string>();
  planned.forEach((p, i) => {
    const where = `roadmap ${i + 1}`;
    if (typeof p?.title !== "string" || !p.title.trim()) return problems.push(`${where}: title is empty`);
    if (!ROADMAP_GROUPS.includes(p.group)) problems.push(`${where}: unknown group "${p.group}"`);
    const key = norm(p.title);
    if (seen.has(key)) problems.push(`${where}: "${p.title}" is listed twice`);
    seen.add(key);
    if (written.has(key)) problems.push(`${where}: "${p.title}" already exists as a topic; remove it from roadmap.json`);
  });
  return problems;
}

export function getRoadmap(topics: Pick<Topic, "slug" | "title">[]): PlannedTopic[] {
  const planned = JSON.parse(fs.readFileSync(FILE, "utf8")) as PlannedTopic[];
  const problems = checkRoadmap(planned, topics);
  // Thrown during static generation, so a stale roadmap fails the build.
  if (problems.length) throw new Error(`Invalid content/roadmap.json:\n- ${problems.join("\n- ")}`);
  return planned;
}
