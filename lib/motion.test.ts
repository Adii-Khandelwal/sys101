import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DURATION, EASING, easeInOut, easeOut, prefersReducedMotion } from "./motion";

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(d.name) ? [p] : [];
  });
}

describe("motion tokens", () => {
  it("CSS custom properties mirror lib/motion.ts", () => {
    const token = (name: string) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
    expect(token("dur-fast")).toBe(`${DURATION.fast}ms`);
    expect(token("dur-base")).toBe(`${DURATION.base}ms`);
    expect(token("dur-slow")).toBe(`${DURATION.slow}ms`);
    expect(token("dur-page")).toBe(`${DURATION.page}ms`);
    expect(token("dur-reduced")).toBe(`${DURATION.reduced}ms`);
    expect(token("ease-out")).toBe(`cubic-bezier(${EASING.out.join(", ")})`);
    expect(token("ease-in-out")).toBe(`cubic-bezier(${EASING.inOut.join(", ")})`);
  });

  it("no raw durations or easings outside the token definitions", () => {
    const offenders: string[] = [];
    for (const file of [...walk(path.join(root, "app")), ...walk(path.join(root, "components")), ...walk(path.join(root, "lib"))]) {
      if (file.endsWith("motion.ts") || file.includes(".test.")) continue;
      fs.readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/^\s*--(dur|ease)-[\w-]+:/.test(line)) return; // the token definitions themselves
          const raw =
            /\b\d+(\.\d+)?m?s\b/.test(line.replace(/\/\*.*\*\//g, "")) && /(transition|animation)/.test(line) ||
            /cubic-bezier\(/.test(line) ||
            /\b(duration|Duration)\s*[:=]\s*\d/.test(line) ||
            /now - start\)\s*\/\s*\d/.test(line) ||
            /\b(ease|ease-in|ease-out|ease-in-out|linear)\s*(;|,|$)/.test(line) && /(transition|animation)/.test(line);
          if (raw) offenders.push(`${path.relative(root, file)}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(offenders).toEqual([]);
  });

  it("easings start at 0, end at 1, and never bounce", () => {
    for (const f of [easeOut, easeInOut]) {
      expect(f(0)).toBe(0);
      expect(f(1)).toBe(1);
      let prev = 0;
      for (let t = 0.05; t <= 1; t += 0.05) {
        const v = f(t);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        expect(v).toBeLessThanOrEqual(1 + 1e-9);
        prev = v;
      }
    }
  });
});

describe("reduced motion", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("CSS makes movement instant and keeps fades at 80ms or less", () => {
    const block = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    for (const name of ["dur-base", "dur-slow", "dur-page"]) expect(block).toMatch(new RegExp(`--${name}:\\s*0ms`));
    // Fast fades (tooltips, popovers, swaps) stay as a short opacity fade instead of a hard cut.
    expect(block).toMatch(/--dur-fast:\s*var\(--dur-reduced\)/);
    expect(block).toMatch(/animation-duration:\s*var\(--dur-reduced\)/);
    expect(DURATION.reduced).toBeLessThanOrEqual(80);
    // Only Back to top scrolls smoothly, and that is in JS (scrollBehavior); CSS never sets smooth scrolling.
    expect(css).not.toMatch(/scroll-behavior:\s*smooth/);
  });

  it("JS reads the user's preference", () => {
    vi.stubGlobal("window", { matchMedia: (q: string) => ({ matches: q.includes("reduce") }) });
    expect(prefersReducedMotion()).toBe(true);
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    expect(prefersReducedMotion()).toBe(false);
  });
});
