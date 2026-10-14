import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FEATURED_FIGURES, LESSON_OUTLINE, featuredFigures, topicSections } from "./lessonOutline";
import { getAllTopics } from "./topics";

const topics = getAllTopics();

describe("Inside a topic preview", () => {
  const dns = topics.find((t) => t.slug === "dns")!;
  const sections = topicSections(dns);

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
    const by = Object.fromEntries(sections.map((s) => [s.id, s.count]));
    expect(by.check).toBe(`${dns.lesson!.quiz.length} questions`);
    expect(by.exercises).toBe(`${dns.lesson!.exercises.length} exercises`);
    expect(by.posts).toBe(`${dns.posts.length} posts`);
  });

  it("rotates through real figures that exist in their posts, with sources", () => {
    const figs = featuredFigures(topics);
    expect(figs).toHaveLength(FEATURED_FIGURES.length);
    expect(figs[0].value).toBe("150x");
    const posts = topics.flatMap((t) => t.posts);
    figs.forEach((f, i) => {
      const post = posts.find((p) => p.id === FEATURED_FIGURES[i].post)!;
      expect(post.digest.numbers.some((n) => n.value === f.value && n.meaning === f.meaning)).toBe(true);
      expect([f.company, f.url]).toEqual([post.company, post.url]);
    });
    expect(new Set(FEATURED_FIGURES.map((x) => x.post)).size).toBe(FEATURED_FIGURES.length);
  });
});
