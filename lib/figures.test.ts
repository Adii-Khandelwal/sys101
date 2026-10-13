import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { getAllTopics, type Post } from "./topics";
import { checkFigure, figureProse, figureText, resolveInputs, FIGURE_IDS, type FigureId, type FigureSpec } from "./figures";
import { canAdd, nudge, windowEstimate, windowFormula, windowStatus, windowValid, windowValueText, MAX_ADDED, type WindowInputs } from "./slidingWindow";
import { raceEvents, raceLast, raceState, type RaceInputs } from "./fillRace";
import { latchState, type LatchInputs } from "./commitLatch";
import { readingExact } from "./readingTime";
import SlidingWindowLive from "@/components/figures/SlidingWindowLive";
import FillRaceLive from "@/components/figures/FillRaceLive";
import CommitLatchLive from "@/components/figures/CommitLatchLive";
import { buildGeometry as windowGeometry, CUR_LANES } from "@/components/figures/slidingWindow/geometry";
import { buildGeometry as raceGeometry } from "@/components/figures/fillRace/geometry";
import { buildGeometry as latchGeometry } from "@/components/figures/commitLatch/geometry";

const topics = getAllTopics();
const postWith = (id: FigureId) => topics.flatMap((t) => t.posts).find((p) => p.digest.figure?.id === id) as Post;
const specOf = (p: Post) => p.digest.figure as FigureSpec;
const inputsOf = (p: Post) => resolveInputs(specOf(p), p.digest.numbers)!;
const srcOf = (p: Post) => ({ company: p.company, year: p.published.slice(0, 4), postId: p.id! });

describe("every registered figure", () => {
  it.each(FIGURE_IDS)("%s sits on a post, reads its inputs from the numbers rows and counts toward reading time", (id) => {
    const post = postWith(id);
    expect(post, `a post carries ${id}`).toBeTruthy();
    expect(checkFigure(specOf(post), post.digest.numbers)).toEqual([]);
    const topic = topics.find((t) => t.posts.some((p) => p.id === post.id))!;
    const without = { ...topic, posts: topic.posts.map((p) => (p.id === post.id ? { ...p, digest: { ...p.digest, figure: undefined } } : p)) };
    expect(figureProse(specOf(post), post.digest.numbers, srcOf(post)).join(" ").split(/\s+/).length).toBeGreaterThan(80);
    expect(readingExact(topic)).toBeGreaterThan(readingExact(without));
    expect(figureProse(undefined, post.digest.numbers, srcOf(post))).toEqual([]);
  });

  it("rejects a figure whose rows are missing, not numeric or out of range", () => {
    const post = postWith("sliding-window");
    const spec = specOf(post);
    expect(checkFigure({ ...spec, rows: { ...spec.rows, limit: 99 } }, post.digest.numbers)).not.toEqual([]);
    expect(checkFigure({ ...spec, rows: { limit: 8 } }, post.digest.numbers)).not.toEqual([]);
    expect(checkFigure({ ...spec, id: "nope" as never }, post.digest.numbers)).not.toEqual([]);
    expect(resolveInputs(spec, post.digest.numbers.map((n) => ({ ...n, value: n.value.replace("15 seconds", "75 seconds") })))).toBeNull();
  });
});

describe("sliding-window model", () => {
  const post = postWith("sliding-window");
  const inputs = inputsOf(post) as unknown as WindowInputs;

  it("reads the post's example and computes the estimate by the formula", () => {
    expect(inputs).toEqual({ limit: 50, previous: 42, current: 18, elapsed: 15 });
    expect(windowEstimate(42, 18, 15)).toBe(49.5);
    expect(windowFormula(inputs)).toBe("42 × (60 − 15) / 60 + 18 = 49.5");
    expect(windowStatus(49.5, 50)).toBe("within the limit of 50");
    expect(windowEstimate(42, 19, 15)).toBe(50.5);
    expect(windowStatus(50.5, 50)).toBe("over the limit of 50");
    expect(windowEstimate(42, 18, 0)).toBe(60);
    expect(windowEstimate(42, 18, 60)).toBe(18);
    expect(windowValueText(inputs, 18, 15)).toBe("15 seconds into the minute, estimate 49.5 of 50");
  });

  it("steps five seconds with Shift and arrows, kept inside the minute, and caps added requests", () => {
    expect([nudge(15, 1), nudge(15, -1), nudge(58, 1), nudge(2, -1)]).toEqual([20, 10, 60, 0]);
    expect([canAdd(0), canAdd(MAX_ADDED - 1), canAdd(MAX_ADDED)]).toEqual([true, true, false]);
  });

  it("refuses inputs the drawing cannot show", () => {
    expect(windowValid(inputs)).toBe(true);
    expect(windowValid({ ...inputs, current: 30 })).toBe(false); // 30 + 22 beads overflow the 40-bead tray
    expect(windowValid({ ...inputs, limit: 52 })).toBe(false); // no 5-step tick for the limit mark
    expect(windowValid({ ...inputs, limit: 100 })).toBe(false); // off the dial
  });

  it("keeps the current minute's lanes clear of the previous minute's row", () => {
    for (const y of CUR_LANES) expect(Math.abs(y - 9)).toBeGreaterThanOrEqual(2.8);
  });
});

describe("fill-race model", () => {
  const post = postWith("fill-race");
  const i = inputsOf(post) as unknown as RaceInputs;
  const last = (guard: boolean, evict: boolean) => raceState(i, { guard, evict }, raceEvents({ guard, evict }).length - 1);

  it("reads the post's example", () => expect(i).toEqual({ stale: 42, fresh: 43, version: 2 }));

  it("lets the slow reply win with no guard", () => {
    const s = last(false, false);
    expect(s.cache).toBe(42);
    expect(s.db).toBe(43);
    expect(s.readout).toContain("stale");
  });

  it("refuses the older reply with the guard, until the entry is evicted", () => {
    expect(last(true, false)).toMatchObject({ cache: 43, refused: true, fill: "blocked", pawl: "up" });
    expect(last(true, true)).toMatchObject({ cache: 42, refused: false, fill: "delivered", pawl: "down" });
  });

  it("shortens the story when the eviction switch goes off, so a stored step cannot jump back", () => {
    expect(raceLast({ guard: false, evict: false })).toBe(4);
    expect(raceLast({ guard: false, evict: true })).toBe(5);
    expect(raceState(i, { guard: true, evict: false }, 5).event).toBe("reply"); // out of range clamps to the end
  });

  it("has the invalidation land first", () => {
    const events = raceEvents({ guard: true, evict: true });
    expect(events.indexOf("invalidate")).toBeLessThan(events.indexOf("reply"));
    expect(raceState(i, { guard: true, evict: false }, 3).cache).toBe(43);
    expect(raceState(i, { guard: false, evict: false }, 3).headline).not.toContain("@version");
  });
});

describe("commit-latch model", () => {
  const post = postWith("commit-latch");
  const i = inputsOf(post) as unknown as LatchInputs;

  it("reads the paper's transfer", () => expect(i).toEqual({ bobBefore: 10, joeBefore: 2, amount: 7, oldTs: 5, startTs: 7, commitTs: 8 }));

  it("commits at step 4, when the primary lock is erased, while Joe's lock is still there", () => {
    expect(latchState(i, 2)).toMatchObject({ bobLock: true, joeLock: true, bobNew: "tentative", cord: true });
    expect(latchState(i, 3)).toMatchObject({ bobLock: false, joeLock: true, bobNew: "committed", joeNew: "tentative", cord: true });
    expect(latchState(i, 4)).toMatchObject({ joeLock: false, joeNew: "committed", cord: false });
  });

  it("derives the new balances from the inputs", () => {
    expect(latchState(i, 4).reader).toBe("A reader sees Bob $3 and Joe $9, both at 8.");
    expect(latchState(i, 3).bob).toContain("$3 @7");
  });
});

describe("figure markup", () => {
  const render = (id: FigureId) => {
    const post = postWith(id);
    const inputs = inputsOf(post);
    const text = figureText(id, inputs, srcOf(post));
    const props = { uid: "fig-test", inputs: inputs as never, text };
    const el =
      id === "sliding-window"
        ? createElement(SlidingWindowLive, { ...props, geo: windowGeometry(inputs as unknown as WindowInputs) })
        : id === "fill-race"
          ? createElement(FillRaceLive, { ...props, geo: raceGeometry() })
          : createElement(CommitLatchLive, { ...props, geo: latchGeometry() });
    const html = renderToStaticMarkup(el);
    return { html, svg: html.match(/<svg[\s\S]*<\/svg>/)![0], post };
  };

  it.each(FIGURE_IDS)("%s follows the build's diagram rules and keeps labels in HTML", (id) => {
    const { html, svg, post } = render(id);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toMatch(/viewBox=/);
    expect(svg).toMatch(/<title[^>]*>[^<]+<\/title>/);
    expect(svg).toMatch(/<desc[^>]*>[^<]+<\/desc>/);
    expect(svg).toMatch(/role="img"/);
    expect(svg).not.toMatch(/gradient|<filter|drop-shadow|<script|\son\w+=|<text/i);
    expect(html).not.toMatch(/—|it's not/i);
    expect(html.replace(svg, "")).toContain(`Figure from ${post.company} ${post.published.slice(0, 4)} (${post.id})`);
  });

  it("the sliding window states its slider's spoken value and the worked example", () => {
    const { html } = render("sliding-window");
    expect(html).toContain('aria-valuetext="15 seconds into the minute, estimate 49.5 of 50"');
    expect(html).toContain("42 × (60 − 15) / 60 + 18 = 49.5");
  });

  it("the steppers start at step 1 with a live readout and working controls", () => {
    expect(render("fill-race").html).toContain("Step 1 of 5");
    expect(render("fill-race").html).toContain("Version guard: off");
    expect(render("commit-latch").html).toContain("Step 1 of 5");
    expect(render("commit-latch").html).toContain('aria-live="polite"');
  });
});
