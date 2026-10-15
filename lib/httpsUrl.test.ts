import { describe, expect, it } from "vitest";
import { httpsUrlProblem } from "./httpsUrl";

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
