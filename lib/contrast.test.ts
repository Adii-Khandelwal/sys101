import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/*
 * Token contrast, read from app/globals.css so the numbers cannot drift from the CSS.
 * Text pairs (ink, ink-soft, accent on paper and on --skeleton) need 4.5:1; graphic pairs (ink2, --edge on paper) need 3:1.
 * In-sentence links: --accent against --ink is under 3:1 in both themes (checked below), so a colour change cannot mark
 * a link inside running text (WCAG 1.4.1) and those links keep their underline. The a:active colour (--accent on paper)
 * passes 4.5:1 as text, so it is safe as the pressed state.
 */
const css = readFileSync("app/globals.css", "utf8");

function block(start: RegExp): Record<string, string> {
  const m = start.exec(css);
  if (!m) throw new Error(`block not found: ${start}`);
  const body = css.slice(m.index + m[0].length, css.indexOf("}", m.index + m[0].length));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((x) => [x[1], x[2]]));
}

const themes = {
  light: block(/^:root \{/m),
  "dark (data-theme)": block(/:root\[data-theme="dark"\] \{/),
  "dark (prefers-color-scheme)": block(/:root:not\(\[data-theme="light"\]\) \{/),
};

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each(Object.entries(themes))("%s contrast", (_n, t) => {
  for (const bg of ["paper", "skeleton"])
    for (const fg of ["ink", "ink-soft", "accent"])
      it(`${fg} on ${bg} is at least 4.5:1`, () => {
        expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
      });
  for (const fg of ["ink2", "edge"])
    it(`${fg} on paper is at least 3:1`, () => {
      expect(ratio(t[fg], t.paper)).toBeGreaterThanOrEqual(3);
    });
  it("accent against ink is under 3:1, so in-sentence links keep their underline", () => {
    expect(ratio(t.accent, t.ink)).toBeLessThan(3);
  });
});
