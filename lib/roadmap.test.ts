import { describe, expect, it } from "vitest";
import { checkRoadmap, getRoadmap } from "./roadmap";
import { getAllTopics } from "./topics";

describe("roadmap", () => {
  it("the planned list passes against the written topics", () => {
    expect(getRoadmap(getAllTopics()).length).toBeGreaterThan(0);
  });

  it("fails on duplicates and on topics that already exist", () => {
    const topics = [{ slug: "rate-limiting", title: "Rate Limiting" }];
    expect(checkRoadmap([{ title: "Rate limiting", group: "Reliability" }], topics)).toHaveLength(1);
    expect(
      checkRoadmap(
        [
          { title: "Consensus", group: "Data" },
          { title: "consensus", group: "Data" },
        ],
        [],
      ),
    ).toHaveLength(1);
  });
});
