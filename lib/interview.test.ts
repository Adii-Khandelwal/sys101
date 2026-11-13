import { describe, expect, it } from "vitest";
import { getInterview, interviewProblems, type Interview } from "./interview";

describe("interview process page", () => {
  it("the shipped file is valid", () => {
    expect(interviewProblems(getInterview())).toEqual([]);
  });
  const bad = (f: (d: Interview) => void) => {
    const d = structuredClone(getInterview());
    f(d);
    return interviewProblems(d);
  };
  it("rejects an unknown cite and a missing company name", () => {
    expect(bad((d) => (d.sections[0].paragraphs[0].cites = ["nope"]))).not.toEqual([]);
    expect(bad((d) => (d.sections[0].paragraphs[0].text = "A paragraph that names nobody."))).not.toEqual([]);
  });
  it("rejects a line break and a section with one paragraph", () => {
    expect(bad((d) => (d.sections[0].paragraphs[0].text += "\nx"))).not.toEqual([]);
    expect(bad((d) => (d.sections[0].paragraphs = d.sections[0].paragraphs.slice(0, 1)))).not.toEqual([]);
  });
  it("rejects a missing no-guidance company and an em dash", () => {
    expect(bad((d) => (d.noGuidance = d.noGuidance.filter((n) => n.company !== "Apple")))).not.toEqual([]);
    expect(bad((d) => (d.summary += " — x"))).not.toEqual([]);
  });
});
