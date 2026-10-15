import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Italic is a separate, non-preloaded font (app/layout.tsx); a rule that only says font-style: italic would show a faked slant.
describe("italic text", () => {
  it("names the italic font in every rule that sets font-style: italic", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*font-style:\s*italic[^{}]*)\}/g)];
    expect(rules.length).toBeGreaterThan(0);
    const missing = rules.filter((r) => !r[2].includes("var(--font-serif-italic)")).map((r) => r[1].trim());
    expect(missing).toEqual([]);
  });
});
