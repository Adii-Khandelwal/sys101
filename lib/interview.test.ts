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
  it("rejects a claim that names no company, an unknown source and a constraint claim", () => {
    expect(bad((d) => (d.sections[0].claims[0].text = "A loop has four rounds."))).not.toEqual([]);
    expect(bad((d) => (d.sections[0].claims[0].sourceId = "nope"))).not.toEqual([]);
    expect(bad((d) => (d.sections[0].claims[0].text += " Interviewers change the constraints. Amazon"))).not.toEqual([]);
  });
  it("rejects a missing no-guidance company and an em dash", () => {
    expect(bad((d) => (d.noGuidance = d.noGuidance.filter((n) => n.company !== "Apple")))).not.toEqual([]);
    expect(bad((d) => (d.summary += " — x"))).not.toEqual([]);
  });
});
