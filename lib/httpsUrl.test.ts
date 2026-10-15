import { describe, expect, it } from "vitest";
import { httpsUrlProblem } from "./httpsUrl";
import { stillCitedProblems } from "./topics";

describe("httpsUrlProblem", () => {
  it("accepts a plain https URL", () => {
    expect(httpsUrlProblem("https://netflixtechblog.com/a-post")).toBeNull();
  });

  it.each(["javascript:alert(1)", "http://example.com", "data:text/html,x", "https://user:pw@example.com/", "//example.com", "not a url", ""])(
    "rejects %s",
    (u) => {
      expect(httpsUrlProblem(u)).not.toBeNull();
    },
  );
});

describe("stillCitedProblems", () => {
  it("accepts a complete https entry and nothing", () => {
    expect(stillCitedProblems({ title: "A talk", url: "https://example.com/a", year: 2024 })).toEqual([]);
    expect(stillCitedProblems(undefined)).toEqual([]);
  });

  it("checks the URL even when title and year are present", () => {
    expect(stillCitedProblems({ title: "A talk", url: "javascript:alert(1)", year: 2024 }).join()).toMatch(/must be an https URL/);
  });

  it("still asks for title, url and year", () => {
    expect(stillCitedProblems({ title: "", url: "https://example.com/a", year: 2024 }).join()).toMatch(/needs title, url and year/);
  });
});
