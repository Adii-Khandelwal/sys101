import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// IntentLink asks for the app router, which does not exist when a page is rendered to a string.
vi.mock("next/navigation", () => ({ useRouter: () => ({ prefetch: () => {} }), usePathname: () => "/" }));

import About from "../app/about/page";
import Background from "../app/background/page";
import Glossary from "../app/glossary/page";
import Reads from "../app/reads/page";
import Privacy from "../app/privacy/page";
import Terms from "../app/terms/page";
import LearnPage from "../components/LearnPage";
import TopicLesson from "../components/TopicLesson";
import { backgroundUpdated } from "./background";
import { getAllLearn } from "./learn";
import { getAllReads, readsUpdated } from "./reads";
import { getNews } from "./news";
import { PAGE_DATES, learnUpdated, topicPageUpdated } from "./site";
import { formatDate, getAllTopics, getDependents } from "./topics";

const topics = getAllTopics();
const titles = new Map(topics.map((t) => [t.slug, t.title]));
const render = (el: unknown) => renderToStaticMarkup(el as never);

const pages: { name: string; html: string; date: string }[] = [
  ...topics.map((t) => {
    const updated = topicPageUpdated(t, getNews(t.slug));
    return {
      name: `topic ${t.slug}`,
      date: updated,
      html: render(TopicLesson({ topic: t, prerequisites: t.prerequisites.map((s) => topics.find((x) => x.slug === s)!), dependents: getDependents(t.slug), titles, updated })),
    };
  }),
  ...getAllLearn(topics.map((t) => t.slug)).map((l) => ({
    name: `learn ${l.slug}`,
    date: learnUpdated(l),
    html: render(LearnPage({ topic: topics.find((t) => t.slug === l.slug)!, learn: l, titles })),
  })),
  { name: "background", date: backgroundUpdated(), html: render(Background()) },
  { name: "reads", date: readsUpdated(getAllReads(topics.map((t) => t.slug))), html: render(Reads()) },
  { name: "about", date: PAGE_DATES.about, html: render(About()) },
  { name: "glossary", date: PAGE_DATES.glossary, html: render(Glossary()) },
  { name: "terms", date: PAGE_DATES.terms, html: render(Terms()) },
  { name: "privacy", date: PAGE_DATES.privacy, html: render(Privacy()) },
];

describe("every content page carries one date, at the bottom", () => {
  it("covers every topic, every learn page and the six other pages", () => {
    expect(pages.length).toBe(topics.length + getAllLearn(topics.map((t) => t.slug)).length + 6);
  });

  for (const p of pages) {
    it(`${p.name}: exactly one "Page last updated" line, just above the footer, with the page's own date`, () => {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.html.match(/Page last updated/g)).toHaveLength(1);
      expect(p.html).toContain(`Page last updated ${formatDate(p.date)}</p><footer`);
    });

    it(`${p.name}: no "Checked on", no "Last updated" at the top, no "no date shown" or "date unknown"`, () => {
      expect(p.html).not.toMatch(/Checked on/i);
      expect(p.html).not.toMatch(/no date shown|date unknown/i);
      expect(p.html.match(/Last updated/g)?.length ?? 0).toBe(0); // the only form is "Page last updated", at the bottom
    });
  }
});
