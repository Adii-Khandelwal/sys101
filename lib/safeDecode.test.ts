import { describe, expect, it } from "vitest";
import { safeDecode } from "./safeDecode";

describe("safeDecode", () => {
  it("decodes valid escapes", () => {
    expect(safeDecode("a%20b")).toBe("a b");
  });

  it("returns a malformed escape unchanged instead of throwing", () => {
    expect(safeDecode("100%")).toBe("100%");
    expect(safeDecode("%E0%A4%A")).toBe("%E0%A4%A");
  });
});
