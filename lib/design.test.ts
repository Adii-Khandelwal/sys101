import { describe, expect, it } from "vitest";
import { STEPS, designProblems, sourcedClaims, sourcedLine, type Design, type DesignRound, type DesignSection } from "./design";
import { designReadingLabel, designReadingMinutes } from "./readingTime";

/** A valid v3 page used only by these tests. */
const SVG = '<svg viewBox="0 0 100 40" role="img" aria-labelledby="t1"><title id="t1">A queue between two parts</title><rect x="1" y="1" width="20" height="10" fill="var(--paper)" stroke="var(--ink)"/></svg>';
const R = (): DesignRound => ({
  ask: "What would you ask me about this problem before drawing anything?",
  say: "Before I draw, I want to agree on what the system must do, who uses it, and what a bad day looks like, so I will ask about the main flows, the failures that matter, and what can wait for a later pass.",
  tip: "Ask before you draw, and say your assumptions aloud so the interviewer can correct them early.",
});
const sec = (text = "The queue decouples the producer from the consumer."): DesignSection => ({ ...R(), blocks: [{ type: "p", text }], topics: ["sharding"] });
function fixture(): Design {
  return {
    slug: "fixture",
    title: "Design a fixture",
    summary: "A fixture used only by the tests, long enough to read as a sentence.",
    topics: [{ slug: "sharding", role: "Splits the data" }, { slug: "caching", role: "Keeps hot reads close" }],
    "general-tips": { blocks: [{ type: "p", text: "Clarify before drawing and think aloud." }] },
    clarify: sec(),
    requirements: { ...R(), blocks: [{ type: "list", items: ["Accept writes", "Serve reads"] }, { type: "assumption", text: "Assume 10 writes per second for this exercise." }], topics: [] },
    entities: sec(),
    api: sec(),
    "data-model": { ...R(), blocks: [{ type: "table", caption: "Rows", columns: ["Name", "Holds"], rows: [["queue", "messages"]] }], topics: [] },
    "high-level": { ...R(), blocks: [{ type: "diagram", title: "The first design", svg: SVG }], stages: [{ id: "s1", need: "Accept writes", add: "A queue in front.", weak: "The queue can fill." }], topics: [] },
    "deep-dives": { ...R(),
      dives: ["da", "db", "dc"].map((id) => ({ id, title: "A dive on pressure", attempt: "Drop writes.", breaks: "Data is lost.", better: "Push back on producers.", tradeoff: "Producers slow down." })),
      topics: [],
    },
    "failure-modes": sec(),
    "against-the-grain": sec(),
    "strong-answer": { ...R(),
      talkTrack: "Clarify, size, sketch, then go deep.",
      levels: { mid: "Cover the sketch.", senior: "Add the dives.", staff: "Add the judgement calls." },
      followUps: Array.from({ length: 6 }, (_, i) => ({ ask: `Ask about case ${"abcdefgh"[i]}?`, answer: "Answer plainly." })),
      topics: [],
    },
    mistakes: { ...R(), items: Array.from({ length: 5 }, (_, i) => ({ mistake: `Mistake ${"abcdefgh"[i]}`, fix: "Fix it." })), topics: [] },
    sources: [
      { id: "a", title: "A post", url: "https://example.com/a", company: "Examplecorp", published: "2024", verifiedOn: "2026-10-31", kind: "post" },
      { id: "r", title: "Docs", url: "https://example.com/r", company: "Refdocs", published: "2024", verifiedOn: "2026-10-31", kind: "reference", license: "CC BY 4.0" },
    ],
  };
}

const topics = ["sharding", "caching"];
const problems = (edit: (d: Design) => void) => {
  const d = fixture();
  edit(d);
  return designProblems(d, "fixture.json", topics).join("\n");
};
const p0 = (d: Design, text: string, cites?: string[]) => (d.clarify.blocks[0] = { type: "p", text, ...(cites ? { cites } : {}) });
const bad = (v: unknown) => v as never;

describe("designProblems", () => {
  it("accepts a valid fixture", () => expect(problems(() => {})).toBe(""));
  it("has the twelve section ids in order", () => {
    expect(STEPS.map((s) => s.id)).toEqual(["general-tips", "clarify", "requirements", "entities", "api", "data-model", "high-level", "deep-dives", "failure-modes", "against-the-grain", "strong-answer", "mistakes"]);
  });
  it("requires ask, say and tip in every round section, within the word limits", () => {
    const ids = ["clarify", "requirements", "entities", "api", "data-model", "high-level", "deep-dives", "failure-modes", "against-the-grain", "strong-answer", "mistakes"] as const;
    for (const id of ids) for (const k of ["ask", "say", "tip"] as const) {
      expect(problems((d) => delete (d[id] as Partial<DesignRound>)[k]), `${id} ${k}`).toMatch(new RegExp(`section "${id}" ${k} is empty or not text`));
      expect(problems((d) => ((d[id] as DesignRound)[k] = "Too short.")), `${id} ${k}`).toMatch(new RegExp(`section "${id}" ${k} has 2 words`));
    }
    expect(problems((d) => (d.clarify.ask = "word ".repeat(41)))).toMatch(/ask has 41 words; it needs 6 to 40/);
    expect(problems((d) => (d.clarify.say = "word ".repeat(141)))).toMatch(/say has 141 words/);
    expect(problems((d) => (d.clarify.tip = "word ".repeat(46)))).toMatch(/tip has 46 words/);
  });
  it("keeps the round strings clean: no vendor, quotes, banned phrasing, or a bare figure", () => {
    expect(problems((d) => (d.clarify.tip = "Ask before you draw, the way Examplecorp tells its own engineers to do."))).toMatch(/names a source company/);
    expect(problems((d) => (d.clarify.tip = 'Ask before you draw, and call it "the plan" aloud to the room.'))).toMatch(/quotation marks/);
    expect(problems((d) => (d.clarify.tip = "Ask before you draw. A queue is not a database, it is a log, so say so."))).toMatch(/banned phrasing/);
    expect(problems((d) => (d.clarify.tip = "Ask before you draw \u2013 and say your assumptions aloud to the room."))).toMatch(/banned phrasing/);
    expect(problems((d) => (d.clarify.say += " I will plan for 5000 requests."))).toMatch(/holds a figure/);
    expect(problems((d) => (d.clarify.say += " I will plan for a million users."))).toMatch(/holds a figure/);
    expect(problems((d) => (d.requirements.say += " I will use the assumptions above, 10 writes a second."))).toBe("");
  });
  it("lets general-tips carry blocks only", () => {
    expect(problems((d) => delete (d as Partial<Design>)["general-tips"])).toMatch(/section "general-tips" is missing/);
    expect(problems((d) => (d["general-tips"].blocks = []))).toMatch(/needs at least one block/);
    expect(problems((d) => (d["general-tips"].blocks[0] = { type: "p", text: "Name Examplecorp here." }))).toMatch(/names a source company/);
    expect(problems((d) => (d["general-tips"].topics = ["nope"]))).toMatch(/does not exist/);
    expect(problems((d) => (d["general-tips"].topics = ["sharding"]))).toBe("");
  });
  it("resolves cites and requires them on a real block", () => {
    expect(problems((d) => p0(d, "A plain claim.", ["nope"]))).toMatch(/cites source "nope"/);
    expect(problems((d) => (d.clarify.blocks[0] = { type: "real", text: "Examplecorp does it.", cites: [] }))).toMatch(/at least one cite/);
    expect(problems((d) => (d.clarify.blocks[0] = bad({ type: "real", text: "Examplecorp does it." })))).toMatch(/at least one cite/);
    expect(problems((d) => (d.clarify.blocks[0] = { type: "real", text: "Examplecorp does it.", cites: ["r"] }))).toBe("");
  });
  it("keeps vendor names to real blocks and curiosities' badges", () => {
    expect(problems((d) => p0(d, "Examplecorp uses a queue."))).toMatch(/names a source company/);
    expect(problems((d) => p0(d, "refdocs says so."))).toMatch(/names a source company/);
    expect(problems((d) => ((d.mistakes.items[0] as { fix: string }).fix = "Do what Examplecorp does."))).toMatch(/names a source company/);
    expect(problems((d) => (d.curiosities = Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, text: i ? "A hook." : "Examplecorp did it.", sourceId: "a" }))))).toMatch(/names a company/);
  });
  it("allows figures only in assumptions or beside a post or paper", () => {
    for (const t of ["Keep 3 replicas.", "A million rows.", "Ten percent fail.", "A dozen nodes.", "A trillion events."]) expect(problems((d) => p0(d, t)), t).toMatch(/holds a figure/);
    expect(problems((d) => p0(d, "Keep 3 replicas.", ["r"]))).toMatch(/holds a figure/);
    expect(problems((d) => p0(d, "Keep 3 replicas.", ["a"]))).toBe("");
    expect(problems((d) => (d.clarify.blocks[0] = { type: "assumption", text: "Assume a million users." }))).toBe("");
    expect(problems((d) => (d["high-level"].stages[0].weak = "It stalls after 3 tries."))).toMatch(/holds a figure/);
  });
  it("treats a year as a date only inside a real block that names its cited company", () => {
    const real = (text: string, cites = ["r"]) => (d: Design) => (d.clarify.blocks[0] = { type: "real", text, cites });
    expect(problems(real("Refdocs published it in October 2022."))).toBe("");
    expect(problems((d) => p0(d, "In 2022 the rate was higher."))).toMatch(/holds a figure/);
    expect(problems(real("Refdocs published it in 2022 with 3 replicas."))).toMatch(/holds a figure/);
    expect(problems(real("It was published in 2022."))).toMatch(/holds a figure/);
    expect(problems(real("Examplecorp published it in 2022."))).toMatch(/holds a figure/);
    expect(problems((d) => (d.clarify.say += " It dates from 2022."))).toMatch(/holds a figure/);
    expect(problems((d) => (d["high-level"].stages[0].weak = "It stalls in 2022."))).toMatch(/holds a figure/);
  });
  it("allows cites on a list and rejects them on assumption, diagram and table blocks", () => {
    expect(problems((d) => (d.clarify.blocks[0] = { type: "list", items: ["A"], cites: ["r"] }))).toBe("");
    expect(problems((d) => (d.clarify.blocks[0] = bad({ type: "list", items: ["A"], cites: ["nope"] })))).toMatch(/cites source "nope"/);
    expect(problems((d) => (d.clarify.blocks[0] = bad({ type: "assumption", text: "Assume 5 users.", cites: ["a"] })))).toMatch(/assumption block cannot carry cites/);
    expect(problems((d) => (d.clarify.blocks[0] = bad({ type: "diagram", title: "T", svg: SVG.replaceAll("t1", "z9"), cites: ["a"] })))).toMatch(/diagram block cannot carry cites/);
    expect(problems((d) => (d.clarify.blocks[0] = bad({ type: "table", caption: "c", columns: ["a"], rows: [["x"]], cites: ["a"] })))).toMatch(/table block cannot carry cites/);
    const d = fixture();
    d.clarify.blocks[0] = { type: "list", items: ["A"], cites: ["r"] };
    expect(sourcedClaims(d)).toBe(1);
  });
  it("keeps source, slug, capstone, curiosity and list-item shapes honest", () => {
    expect(problems((d) => (d.sources[0].url = "javascript:alert(1)"))).toMatch(/sources\[0\]\.url/);
    expect(problems((d) => (d.sources[0].url = "http://example.com/a"))).toMatch(/sources\[0\]\.url/);
    expect(problems((d) => (d.sources[0].published = "Oct 2024"))).toMatch(/published must be/);
    expect(problems((d) => (d.slug = "other"))).toMatch(/slug "other" must equal the file name/);
    expect(problems((d) => (d.capstone = "nope"))).toMatch(/capstone "nope" does not exist/);
    const hooks = (text: string) => (d: Design) => (d.curiosities = ["a", "b", "c", "d"].map((id, i) => ({ id, text: i ? "A hook." : text, sourceId: "a" })));
    expect(problems(hooks("word ".repeat(46)))).toMatch(/over 45 words/);
    expect(problems(hooks('A hook with "quotes" in it.'))).toMatch(/quotation marks/);
    expect(problems((d) => (d.clarify.blocks[0] = bad({ type: "list", items: [5] })))).toMatch(/item 1 is empty or not text/);
  });
  it("handles every quotation mark style in real blocks", () => {
    const real = (text: string) => (d: Design) => (d.clarify.blocks[0] = { type: "real", text, cites: ["r"] });
    const long = "word ".repeat(26).trim();
    for (const [open, close] of [["\u00AB", "\u00BB"], ["\u201E", "\u201C"], ["\u201E", "\u201D"], ["\u201F", "\u201D"]]) {
      expect(problems(real(`The docs say ${open}retries are safe${close}.`)), open + close).toBe("");
      expect(problems(real(`The docs say ${open}${long}${close}.`)), open + close).toMatch(/over 25 words/);
      expect(problems((d) => (d.clarify.blocks = [{ type: "real", text: `One ${open}quote${close}.`, cites: ["r"] }, { type: "real", text: `Two ${open}quote${close}.`, cites: ["r"] }])), open + close).toMatch(/quoted 2 times/);
    }
    expect(problems((d) => p0(d, "A \u00ABquote\u00BB here."))).toMatch(/quotation marks/);
  });
  it("keeps diagram ids clear of section and page anchors", () => {
    for (const id of ["clarify", "mistakes", "question", "answer", "worth-knowing", "sources"])
      expect(problems((d) => (d["high-level"].blocks[0] = { type: "diagram", title: "T", svg: SVG.replaceAll("t1", id) })), id).toMatch(new RegExp(`diagram id "${id}"`));
  });
  it("allows quotation marks only in real blocks, one short quote per source", () => {
    expect(problems((d) => p0(d, 'It "just works".'))).toMatch(/quotation marks/);
    expect(problems((d) => p0(d, "It “just works”."))).toMatch(/quotation marks/);
    const real = (text: string) => (d: Design) => (d.clarify.blocks[0] = { type: "real", text, cites: ["r"] });
    expect(problems(real('The docs say "retries are safe".'))).toBe("");
    expect(problems(real(`The docs say "${"word ".repeat(26).trim()}".`))).toMatch(/over 25 words/);
    expect(problems((d) => (d.clarify.blocks = [{ type: "real", text: 'One "quote" here.', cites: ["r"] }, { type: "real", text: 'Another "quote" there.', cites: ["r"] }]))).toMatch(/quoted 2 times/);
    expect(problems(real('An "unmatched quote.'))).toMatch(/unmatched/);
  });
  it("rejects banned phrasing and contrast patterns, en dash included", () => {
    for (const t of ["A — dash.", "A – dash.", "It is not fast but it is cheap.", "The queue is not a database, it is a log.", "A queue isn't a database, it's a log.", "The queue is not a database. It is a log.", "Pending is not a state: it is a reply.", "A reply, not a state: the merchant waits."])
      expect(problems((d) => (d.summary = t)), t).toMatch(/banned phrasing/);
  });
  it("checks diagrams: svg rules, role, tokens only, unique ids", () => {
    const dg = (svg: string) => (d: Design) => (d["high-level"].blocks[0] = { type: "diagram", title: "T", svg });
    expect(problems(dg("<svg><script/></svg>"))).toMatch(/diagram/);
    expect(problems(dg(SVG.replace(' role="img"', "")))).toMatch(/role="img"/);
    expect(problems(dg(SVG.replace('fill="var(--paper)"', 'fill="#ff0000"')))).toMatch(/colour literal/);
    expect(problems(dg(SVG.replace('stroke="var(--ink)"', 'stroke="rgb(1,2,3)"')))).toMatch(/colour literal/);
    expect(problems((d) => (d["high-level"].stages[0].diagram = SVG))).toMatch(/id "t1" is used by another/);
    expect(problems((d) => (d["high-level"].stages[0].diagram = SVG.replaceAll("t1", "t2")))).toBe("");
  });
  it("checks tables", () => {
    expect(problems((d) => (d["data-model"].blocks[0] = { type: "table", caption: "x", columns: ["a", "b"], rows: [["only one"]] }))).toMatch(/needs 2 cells/);
    expect(problems((d) => (d["data-model"].blocks[0] = { type: "table", caption: "", columns: ["a"], rows: [["x"]] }))).toMatch(/caption/);
  });
  it("checks counts", () => {
    expect(problems((d) => d["deep-dives"].dives.pop())).toMatch(/3 to 4 dives/);
    expect(problems((d) => d["strong-answer"].followUps.pop())).toMatch(/6 to 16 follow-ups/);
    expect(problems((d) => { const f = d["strong-answer"].followUps; while (f.length < 17) f.push({ ask: "Ask?", answer: "Answer." }); })).toMatch(/6 to 16 follow-ups/);
    expect(problems((d) => d.mistakes.items.pop())).toMatch(/5 to 8 items/);
    expect(problems((d) => (d.curiosities = [{ id: "c1", text: "A hook.", sourceId: "a" }]))).toMatch(/4 to 8/);
    expect(problems((d) => (d.curiosities = Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, text: "A hook.", sourceId: "r" }))))).toMatch(/only a post or paper/);
    expect(problems((d) => (d.curiosities = Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, text: "A hook, 40 million rows.", sourceId: "a" }))))).toBe("");
  });
  it("checks sources, topics and dates", () => {
    expect(problems((d) => delete d.sources[1].license)).toMatch(/needs a license/);
    expect(problems((d) => Object.assign(d.sources[1], { published: "no date shown", edition: "v1.2" }))).toBe("");
    expect(problems((d) => (d.sources[1].published = "no date shown"))).toMatch(/needs an edition/);
    expect(problems((d) => (d.sources[0].verifiedOn = "2026-02-31"))).toMatch(/real date/);
    expect(problems((d) => (d.clarify.topics = ["nope"]))).toMatch(/does not exist/);
  });
  it("counts sourced blocks once and words the header line", () => {
    const d = fixture();
    expect(sourcedClaims(d)).toBe(0);
    p0(d, "Claim.", ["r"]);
    d["deep-dives"].dives[0].cites = ["r"];
    d["strong-answer"].followUps[0].cites = ["r"];
    expect(sourcedClaims(d)).toBe(3);
    expect(sourcedLine(d)).toBe("3 claims are sourced; the rest is the site's own reasoning");
  });
  it("never throws on hostile shapes and always names the file", () => {
    const cases: Array<(d: Design) => void> = [
      (d) => (d.clarify = bad(null)),
      (d) => (d["general-tips"] = bad(null)),
      (d) => (d["general-tips"].blocks = bad(5)),
      (d) => (d.clarify.ask = bad(5)),
      (d) => (d.clarify.say = bad(null)),
      (d) => (d.clarify.tip = bad({})),
      (d) => (d.mistakes.ask = bad([])),
      (d) => (d.clarify.blocks = bad("x")),
      (d) => (d.clarify.blocks[0] = bad(null)),
      (d) => (d.clarify.blocks[0] = bad({ type: "p", text: 5 })),
      (d) => (d.clarify.blocks[0] = bad({ type: "nope" })),
      (d) => (d.clarify.blocks[0] = bad({ type: "list", items: [null] })),
      (d) => (d.clarify.blocks[0] = bad({ type: "table", columns: null, rows: null })),
      (d) => (d.clarify.blocks[0] = bad({ type: "diagram", svg: 5 })),
      (d) => (d.clarify.blocks[0] = bad({ type: "p", text: "x", cites: "a" })),
      (d) => (d["high-level"].stages[0] = bad(null)),
      (d) => (d["high-level"].stages = bad(undefined)),
      (d) => ((d["high-level"].stages[0] as { diagram: unknown }).diagram = 5),
      (d) => (d["deep-dives"].dives[0] = bad(null)),
      (d) => ((d["deep-dives"].dives[0] as { real: unknown }).real = "x"),
      (d) => (d["deep-dives"].notes = bad(5)),
      (d) => (d["strong-answer"].levels = bad(null)),
      (d) => (d["strong-answer"].followUps[0] = bad(null)),
      (d) => (d.mistakes.items[0] = bad(null)),
      (d) => (d.mistakes = bad(undefined)),
      (d) => (d.sources[0] = bad(null)),
      (d) => (d.sources = bad(null)),
      (d) => (d.topics[0] = bad(null)),
      (d) => (d.curiosities = bad([null])),
      (d) => (d.curiosities = bad("x")),
    ];
    cases.forEach((edit, i) => {
      const d = fixture();
      edit(d);
      let out: string[] = [];
      expect(() => (out = designProblems(d, "fixture.json", topics)), `case ${i}`).not.toThrow();
      expect(out.length, `case ${i}`).toBeGreaterThan(0);
      expect(out.every((m) => m.startsWith("fixture.json:")), `case ${i}`).toBe(true);
    });
    expect(designProblems(bad(null), "fixture.json", topics)).toHaveLength(1);
  });
});

describe("design reading time", () => {
  it("comes from the text and counts diagrams, never a fixed number", () => {
    const d = fixture();
    const base = designReadingMinutes(d);
    expect(base).toBeGreaterThanOrEqual(1);
    d.clarify.blocks.push({ type: "p", text: "word ".repeat(2000) });
    expect(designReadingMinutes(d)).toBeGreaterThanOrEqual(base + 9);
    expect(designReadingLabel(d)).toMatch(/^~\d+ min read$/);
    const withDiagrams = fixture();
    for (let i = 0; i < 30; i++) withDiagrams["high-level"].blocks.push({ type: "diagram", title: "T", svg: SVG.replaceAll("t1", `t${i}`) });
    expect(designReadingMinutes(withDiagrams)).toBeGreaterThan(base);
  });
});
