import { describe, expect, it } from "vitest";
import { checkPullQuote, getAllTopics, type Topic } from "./topics";

const topic = (pullQuote: Topic["pullQuote"]) => ({ posts: [{ id: "a" }], pullQuote }) as unknown as Topic;

describe("pullQuote", () => {
  it("accepts a short sentence from one of the posts", () => {
    expect(checkPullQuote(topic({ text: "A short plain sentence.", postId: "a" }))).toEqual([]);
  });
  it("rejects an unknown post, a long text and two sentences", () => {
    expect(checkPullQuote(topic({ text: "Fine.", postId: "zzz" }))).toHaveLength(1);
    expect(checkPullQuote(topic({ text: Array(25).fill("word").join(" "), postId: "a" }))).toHaveLength(1);
    expect(checkPullQuote(topic({ text: "One. Two.", postId: "a" }))).toHaveLength(1);
  });
  it("is used on at most 12 topics", () => {
    expect(getAllTopics().filter((t) => t.pullQuote).length).toBeLessThanOrEqual(12);
  });
});
