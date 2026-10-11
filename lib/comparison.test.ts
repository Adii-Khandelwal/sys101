import { describe, expect, it } from "vitest";
import { getAllTopics } from "./topics";

describe("Where they differ", () => {
  it("is 2 to 3 short paragraphs on every topic with two posts", () => {
    for (const t of getAllTopics().filter((x) => x.posts.length >= 2)) {
      const paras = t.comparison!.split("\n\n");
      expect(paras.length, t.slug).toBeGreaterThanOrEqual(2);
      expect(paras.length, t.slug).toBeLessThanOrEqual(3);
    }
  });
});
