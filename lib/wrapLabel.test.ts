import { describe, expect, it } from "vitest";
import { getAllCapstones } from "./capstones";
import { getAllTopics } from "./topics";
import { LABEL_LINE_CHARS, LABEL_MAX_LINES, wrapLabel } from "./wrapLabel";

describe("wrapLabel", () => {
  it("wraps at word boundaries", () => {
    expect(wrapLabel("Live Origin (picks first valid segment)")).toEqual(["Live Origin (picks first", "valid segment)"]);
    expect(wrapLabel("Origin cache")).toEqual(["Origin cache"]);
  });

  it("fits every capstone diagram label in its box", () => {
    for (const c of getAllCapstones(getAllTopics().map((t) => t.slug))) {
      for (const n of c.diagram.nodes) {
        const lines = wrapLabel(n.label);
        expect(lines.length, `${c.slug}: ${n.label}`).toBeLessThanOrEqual(LABEL_MAX_LINES);
        for (const l of lines) expect(l.length, `${c.slug}: ${l}`).toBeLessThanOrEqual(LABEL_LINE_CHARS);
      }
    }
  });
});
