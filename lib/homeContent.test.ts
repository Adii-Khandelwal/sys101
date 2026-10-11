import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LESSON_OUTLINE, topicPreview } from "./lessonOutline";
import { startVariant } from "./nextUp";
import { getAllTopics } from "./topics";

const dir = path.resolve(__dirname, "../content/topics");
const raw = fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
const topics = getAllTopics();

describe("Inside a topic preview", () => {
  const dns = topics.find((t) => t.slug === "dns")!;
  const preview = topicPreview(dns);

  it("uses the real section names, in the order the topic page has them", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../components/TopicLesson.tsx"), "utf8");
    let at = -1;
    for (const s of LESSON_OUTLINE) {
      const i = src.indexOf(s.name, at + 1);
      expect(i, `"${s.name}" in TopicLesson.tsx after the previous section`).toBeGreaterThan(at);
      at = i;
    }
  });

  it("shows the real counts", () => {
    const by = Object.fromEntries(preview.sections.map((s) => [s.id, s.count]));
    expect(by.check).toBe(`${dns.lesson!.quiz.length} questions`);
    expect(by.exercises).toBe(`${dns.lesson!.exercises.length} exercises`);
    expect(by.posts).toBe(`${dns.posts.length} posts`);
  });

  it("the figure exists in a post digest and carries its source", () => {
    const f = preview.figure!;
    expect(f).not.toBeNull();
    const post = dns.posts.find((p) => p.url === f.url)!;
    expect(post.company).toBe(f.company);
    expect(post.digest.numbers.some((n) => n.value === f.value && n.meaning === f.meaning)).toBe(true);
  });
});

describe("start line", () => {
  it("is exactly one version at a time", () => {
    expect(startVariant([])).toBe("first");
    expect(startVariant(["dns"])).toBe("progress");
  });
});
