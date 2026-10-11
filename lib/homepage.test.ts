import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const FILES = [
  "app/page.tsx",
  "components/HomeView.tsx",
  "components/NextUp.tsx",
  "components/PathView.tsx",
  "components/PostSources.tsx",
  "components/InsideTopic.tsx",
  "lib/homeStats.ts",
  "lib/lessonOutline.ts",
  "components/StillToCome.tsx",
  "components/TopicIndex.tsx",
  "components/TryQuestion.tsx",
];
const NOUN = "(topics?|posts?|companies|company|questions?|sources?|exercises?|sections?)";
const NUMBER_WORDS = "(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\\d+)";
const MONTH = "(January|February|March|April|May|June|July|August|September|October|November|December)";
const RULES: [string, RegExp][] = [
  ["a count in digits or words", new RegExp(`\\b${NUMBER_WORDS}\\s+${NOUN}\\b`, "i")],
  ["a count like 'of 10'", /\bof\s+\d+\b/i],
  ["an ISO date", /\b\d{4}-\d{2}-\d{2}\b/],
  ["a written date", new RegExp(`\\b${MONTH}\\b|\\b\\d{1,2}\\s+${MONTH}`)],
];

describe("homepage source", () => {
  it("hardcodes no counts or dates; they come from data", () => {
    const found: string[] = [];
    for (const file of FILES) {
      // Comments may mention numbers; only code and copy count.
      const src = fs.readFileSync(path.join(root, file), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      for (const [what, re] of RULES) {
        const m = src.match(re);
        if (m) found.push(`${file}: ${what}: "${m[0]}"`);
      }
    }
    expect(found).toEqual([]);
  });
});
