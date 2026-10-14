import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOURS, keyAction, move, overlayBoxes, placeBox, resolveSteps, wrapTab, type TourId } from "./tours";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import SiteFooter from "@/components/SiteFooter";
import { BANNED_PHRASING } from "./topics";
import { TOURS_KEY, forgetSeen, loadSeen, markSeen, parseSeen } from "./tourSeen";

const ids = Object.keys(TOURS) as TourId[];
const all = () => ids.flatMap((id) => TOURS[id].map((s) => ({ id, ...s })));

describe("tour steps", () => {
  it("has at most six steps a page, each with a title and text", () => {
    for (const id of ids) {
      expect(TOURS[id].length).toBeGreaterThan(0);
      expect(TOURS[id].length).toBeLessThanOrEqual(6);
    }
    for (const s of all()) {
      expect(s.title.trim()).not.toBe("");
      expect(s.text.trim()).not.toBe("");
    }
  });

  it("uses plain words: no em dashes, banned phrasing or emoji", () => {
    for (const s of all()) {
      for (const t of [s.title, s.text, s.path?.text ?? ""]) {
        expect(t).not.toMatch(/—|–/);
        expect(t).not.toMatch(BANNED_PHRASING);
        expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });

  it("points every step at a data-tour name that exists in the source", () => {
    const files = ["components", "app"].flatMap((d) => fs.readdirSync(d, { recursive: true, encoding: "utf8" }).filter((f) => /\.tsx$/.test(f)).map((f) => fs.readFileSync(path.join(d, f), "utf8")));
    const source = files.join("\n");
    for (const s of all()) {
      for (const target of [s.target, s.path?.target].filter(Boolean) as string[]) {
        expect(source, `data-tour="${target}"`).toMatch(new RegExp(`data-tour=(?:"|\\{[^}]*)${target}`));
      }
    }
  });

  it("gives the Path list its own wording, whatever the screen, and drops desktop-only steps on a phone", () => {
    const seen = (t: string) => t !== "none";
    const map = resolveSteps("home", { path: false, phone: false }, seen);
    const deskPath = resolveSteps("home", { path: true, phone: false }, seen);
    const phone = resolveSteps("home", { path: true, phone: true }, seen);
    expect(map.map((s) => s.target)).toContain("view");
    expect(deskPath.map((s) => s.target)).toContain("view");
    expect(phone.map((s) => s.target)).not.toContain("view");
    // Nothing in the Path wording may talk about a map the reader is not looking at.
    for (const s of [...deskPath, ...phone].filter((x) => x.target !== "view")) expect(s.text).not.toMatch(/\bmap\b/i);
    expect(deskPath[0].text).not.toBe(map[0].text);
    expect(deskPath.find((s) => s.target === "view")!.text).toMatch(/You are on Path/);
    expect(map.find((s) => s.target === "view")!.text).not.toMatch(/You are on Path/);
    expect(phone).toHaveLength(map.length - 1);
    // A phone has no keyboard: nothing in its wording may mention keys, and a click becomes a pick or tap.
    for (const s of phone) expect(s.text).not.toMatch(/\bPress\b|\bEnter\b|\bEsc\b|\bClick\b| \/ /);
  });

  it("skips a step whose target is not on the page", () => {
    expect(resolveSteps("topic", { path: false, phone: false }, (t) => t !== "check").map((s) => s.target)).not.toContain("check");
    expect(resolveSteps("topic", { path: false, phone: false }, () => false)).toEqual([]);
  });

  it("keeps the reading tracker out of a tour's scrolling", () => {
    expect(fs.readFileSync("components/TourOverlay.tsx", "utf8")).toContain("dataset.touring");
    expect(fs.readFileSync("components/LessonRail.tsx", "utf8")).toContain("dataset.touring");
  });

  it("marks a tour seen only when it is finished or skipped, never on Esc or an auto-close", () => {
    const overlay = fs.readFileSync("components/TourOverlay.tsx", "utf8");
    expect(overlay).toContain("close(true)"); // Done and Skip tour
    expect(overlay).toContain("closeRef.current(false)"); // Esc, and the page changing under the tour
    expect(fs.readFileSync("components/TourLink.tsx", "utf8")).toMatch(/if \(finished\) markSeen/);
  });

  it("stores only a small seen flag, and only from the entry link and tourSeen", () => {
    for (const f of ["components/TourOverlay.tsx", "lib/tours.ts"]) expect(fs.readFileSync(f, "utf8")).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
    expect(fs.readFileSync("components/TourLink.tsx", "utf8")).not.toMatch(/localStorage/);
  });
});

describe("tour keys and moves", () => {
  it("steps forward and back, and finishes after the last step", () => {
    expect(move(0, 1, 5)).toBe(1);
    expect(move(3, -1, 5)).toBe(2);
    expect(move(0, -1, 5)).toBe(0);
    expect(move(4, 1, 5)).toBeNull();
  });

  it("answers Esc, ArrowRight and ArrowLeft, and nothing else", () => {
    expect([keyAction("Escape"), keyAction("ArrowRight"), keyAction("ArrowLeft"), keyAction("a"), keyAction("Enter")]).toEqual(["close", "next", "back", null, null]);
  });

  it("wraps Tab around the tooltip's buttons only at the ends", () => {
    expect(wrapTab(2, 3, false)).toBe(0);
    expect(wrapTab(0, 3, true)).toBe(2);
    expect(wrapTab(-1, 3, true)).toBe(2);
    expect(wrapTab(1, 3, false)).toBeNull();
    expect(wrapTab(1, 3, true)).toBeNull();
  });

  it("builds the dim from four rectangles around the target and the outline from one, in whole pixels", () => {
    const o = overlayBoxes({ left: 10.4, top: 20.2, right: 110.6, bottom: 220.4 }, 1000, 800);
    expect(o.ring).toEqual({ x: 10, y: 20, w: 101, h: 200 });
    expect(o.top).toEqual({ x: 0, y: 0, w: 1000, h: 20 });
    expect(o.bottom).toEqual({ x: 0, y: 220, w: 1000, h: 580 });
    expect(o.left).toEqual({ x: 0, y: 20, w: 10, h: 200 });
    expect(o.right).toEqual({ x: 111, y: 20, w: 889, h: 200 });
    expect(placeBox(o.ring)).toBe("translate(10px, 20px) scale(101, 200)");
    // A target partly off screen never gives a negative size.
    expect(overlayBoxes({ left: -30, top: -10, right: 50, bottom: 900 }, 400, 800).left.w).toBe(0);
  });

  it("moves and fades by transform and opacity only: no clip-path, width, height, top or left transitions", () => {
    const css = fs.readFileSync("app/globals.css", "utf8");
    const tour = css.slice(css.indexOf("Guided tour (components/TourOverlay.tsx)"));
    for (const m of tour.matchAll(/transition:([^;]+);/g)) for (const part of m[1].split(",")) expect(part).toMatch(/^\s*(transform|opacity) /);
    expect(tour).not.toMatch(/clip-path|box-shadow/);
  });
});

describe("the seen flag", () => {
  const fake = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
  };

  it("starts unseen, remembers each tour on its own, and can be cleared", () => {
    const s = fake();
    expect(loadSeen(s).seen).toEqual({});
    markSeen("home", s);
    expect(loadSeen(s).seen).toEqual({ home: true });
    markSeen("topic", s);
    expect(loadSeen(s).seen).toEqual({ home: true, topic: true });
    expect(JSON.parse(s.m.get(TOURS_KEY)!)).toEqual({ version: 1, seen: { home: true, topic: true } });
    forgetSeen(s);
    expect(loadSeen(s).seen).toEqual({});
  });

  it("treats missing, corrupt or foreign data as unseen and never throws", () => {
    for (const raw of [null, "", "{not json", "[]", '{"version":2,"seen":{"home":true}}', '{"version":1,"seen":null}', '{"version":1,"seen":{"home":"yes"}}']) expect(parseSeen(raw).seen).toEqual({});
    expect(parseSeen('{"version":1,"seen":{"home":true,"other":true}}').seen).toEqual({ home: true });
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(loadSeen(blocked).seen).toEqual({});
    expect(() => markSeen("home", blocked)).not.toThrow();
    expect(() => forgetSeen(blocked)).not.toThrow();
    expect(loadSeen(null).seen).toEqual({});
  });
});

describe("the footer", () => {
  const html = (el: React.ReactElement) => renderToStaticMarkup(el);

  it("offers the tour only on a page that has one, in its own group", () => {
    expect(html(createElement(SiteFooter, { tour: "home" }))).toContain("Take the tour");
    expect(html(createElement(SiteFooter, { tour: "topic" }))).toContain("Take the tour");
    expect(html(createElement(SiteFooter))).not.toContain("Take the tour");
    expect(html(createElement(SiteFooter))).toContain("footer-group");
  });
});
