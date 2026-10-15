import { describe, expect, it } from "vitest";
import { groupNewsByMonth, newsDescription, newsUpdated } from "./newsMonths";
import type { News, NewsItem } from "./news";

const item = (id: string, addedOn: string): NewsItem => ({
  id, kind: "release", origin: "routine", title: id, publisher: "P", url: "https://example.com/" + id,
  dateShown: "2026-01-01", summary: "s", evidence: ["e"], addedOn, verifiedOn: addedOn,
});
const news = (asOf: string, ...items: NewsItem[]): News => ({ asOf, items });

describe("groupNewsByMonth", () => {
  it("is empty when no topic has an item", () => {
    expect(groupNewsByMonth([{ slug: "a", title: "A", news: null }, { slug: "b", title: "B", news: news("2026-10-01") }])).toEqual([]);
  });

  it("groups by month of addedOn, then by topic title, newest item first", () => {
    const months = groupNewsByMonth([
      { slug: "z", title: "Zed", news: news("2026-10-12", item("z1", "2026-10-03"), item("z2", "2026-10-09")) },
      { slug: "a", title: "Alpha", news: news("2026-10-12", item("a1", "2026-10-05")) },
    ]);
    expect(months.map((m) => m.month)).toEqual(["2026-10"]);
    expect(months[0].topics.map((t) => t.title)).toEqual(["Alpha", "Zed"]);
    expect(months[0].topics[1].items.map((i) => i.id)).toEqual(["z2", "z1"]);
  });

  it("keeps a quiet month between two busy ones, empty, newest first, and runs to the latest asOf", () => {
    const months = groupNewsByMonth([
      { slug: "a", title: "A", news: news("2026-12-02", item("a1", "2026-09-30"), item("a2", "2026-11-01")) },
    ]);
    expect(months.map((m) => [m.month, m.topics.length])).toEqual([["2026-12", 0], ["2026-11", 1], ["2026-10", 0], ["2026-09", 1]]);
  });

  it("crosses a year end", () => {
    const months = groupNewsByMonth([{ slug: "a", title: "A", news: news("2027-01-05", item("a1", "2026-12-20")) }]);
    expect(months.map((m) => m.month)).toEqual(["2027-01", "2026-12"]);
  });
});

describe("news page text", () => {
  it("dates the page by the latest asOf", () => {
    expect(newsUpdated([{ news: news("2026-10-01") }, { news: null }, { news: news("2026-10-12") }])).toBe("2026-10-12");
  });

  it("names the newest month that has items, and says so when there are none", () => {
    const months = groupNewsByMonth([{ slug: "a", title: "A", news: news("2026-12-02", item("a1", "2026-11-01")) }]);
    expect(newsDescription(months)).toContain("November 2026");
    expect(newsDescription([])).toContain("Nothing has been added yet");
  });
});
