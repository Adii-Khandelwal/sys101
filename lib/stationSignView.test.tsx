import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import StationSign from "@/components/StationSign";

const topics = [
  { slug: "a", title: "Alpha", group: "Data", number: "01", minutes: 19, concept: "Alpha holds data. More." },
  { slug: "b", title: "Beta", group: "Scaling", number: "02", minutes: 21, concept: "Beta spreads load." },
];
const props = { topics, edges: [{ from: "a", to: "b" }], entries: [{ slug: "a", title: "Alpha", prerequisites: [] }, { slug: "b", title: "Beta", prerequisites: ["a"] }], metas: [] };

describe("StationSign", () => {
  it("shows no number, time or open link until a station is hovered or focused", () => {
    const html = renderToStaticMarkup(<StationSign {...props} active={null} />);
    expect(html).toContain("Alpha");
    expect(html).toContain("Makes possible");
    expect(html).not.toMatch(/Topic 01|min read|Read this topic/);
  });
  it("shows the full sign for the active station", () => {
    const html = renderToStaticMarkup(<StationSign {...props} active="b" />);
    expect(html).toContain("Topic 02");
    expect(html).toContain("~21 min read");
    expect(html).toContain("Read this topic");
    expect(html).toContain("Beta spreads load.");
  });
});
