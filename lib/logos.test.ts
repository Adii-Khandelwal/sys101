import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import marks from "../content/logos.json";
import { LOGO_FILES } from "./logoFiles";
import { organization } from "./organization";
import { getAllTopics } from "./topics";

const orgs = [...new Set(getAllTopics().flatMap((t) => t.posts.map((p) => organization(p.company))))];
const file = (src: string) => path.join(process.cwd(), "public", src);

describe("company logos", () => {
  it("every organization has a logo or a written reason it has none", () => {
    for (const o of orgs) expect(o in LOGO_FILES || o in marks.withoutLogo, o).toBe(true);
  });
  it("lists no organization that is gone, and none twice", () => {
    for (const o of [...Object.keys(LOGO_FILES), ...Object.keys(marks.withoutLogo)]) expect(orgs, o).toContain(o);
    for (const o of Object.keys(marks.withoutLogo)) expect(o in LOGO_FILES, o).toBe(false);
  });
  it("every file exists, is a small SVG with a viewBox, and has the proportions its entry says", () => {
    for (const [name, l] of Object.entries(LOGO_FILES)) {
      for (const src of [l.src, l.dark].filter(Boolean) as string[]) {
        const svg = fs.readFileSync(file(src), "utf8");
        expect(svg.startsWith("<svg"), `${name} ${src}`).toBe(true);
        expect(fs.statSync(file(src)).size, `${name} ${src}`).toBeLessThan(16_000);
        expect(svg, `${name} ${src} must not run scripts`).not.toMatch(/<script|on\w+=/i);
      }
      const v = fs.readFileSync(file(l.src), "utf8").match(/viewBox="([\d.\s-]+)"/)![1].trim().split(/\s+/).map(Number);
      expect(v[2] / v[3], name).toBeCloseTo(l.w / l.h, 1);
    }
  });
});
