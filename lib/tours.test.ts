import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOURS, holePath, keyAction, move, resolveSteps, wrapTab, type TourId } from "./tours";
import { BANNED_PHRASING } from "./topics";

const ids = Object.keys(TOURS) as TourId[];
const all = () => ids.flatMap((id) => TOURS[id].map((s) => ({ id, ...s })));

describe("tour steps", () => {
  it("has at most five steps a page, each with a title and text", () => {
    for (const id of ids) {
      expect(TOURS[id].length).toBeGreaterThan(0);
      expect(TOURS[id].length).toBeLessThanOrEqual(5);
    }
    for (const s of all()) {
      expect(s.title.trim()).not.toBe("");
      expect(s.text.trim()).not.toBe("");
    }
  });

  it("uses plain words: no em dashes, banned phrasing or emoji", () => {
    for (const s of all()) {
      for (const t of [s.title, s.text, s.phone?.text ?? ""]) {
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
      for (const target of [s.target, s.phone?.target].filter(Boolean) as string[]) {
        expect(source, `data-tour="${target}"`).toMatch(new RegExp(`data-tour=(?:"|\\{[^}]*)${target}`));
      }
    }
  });

  it("gives a phone its own wording and drops steps that are for desktop only", () => {
    const seen = (t: string) => t !== "none";
    const desktop = resolveSteps("home", false, seen);
    const phone = resolveSteps("home", true, seen);
    expect(desktop.map((s) => s.target)).toContain("view");
    expect(phone.map((s) => s.target)).not.toContain("view");
    expect(phone[0].text).not.toBe(desktop[0].text);
    expect(phone).toHaveLength(desktop.length - 1);
  });

  it("skips a step whose target is not on the page", () => {
    expect(resolveSteps("topic", false, (t) => t !== "check").map((s) => s.target)).not.toContain("check");
    expect(resolveSteps("topic", false, () => false)).toEqual([]);
  });

  it("keeps the reading tracker out of a tour's scrolling", () => {
    expect(fs.readFileSync("components/TourOverlay.tsx", "utf8")).toContain("dataset.touring");
    expect(fs.readFileSync("components/LessonRail.tsx", "utf8")).toContain("dataset.touring");
  });

  it("does not store anything: no flag, no localStorage", () => {
    for (const f of ["components/TourLink.tsx", "components/TourOverlay.tsx", "lib/tours.ts"]) expect(fs.readFileSync(f, "utf8")).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
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

  it("cuts the dim's hole with an even-odd polygon, not a shadow", () => {
    const d = holePath({ left: 10, top: 20, right: 110, bottom: 220 });
    expect(d).toMatch(/^polygon\(evenodd,/);
    expect(d).toContain("10px 20px");
    expect(d).toContain("110px 220px");
  });
});
