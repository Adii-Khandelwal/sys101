import { describe, expect, it } from "vitest";
import { glossaryId, markTerms, termVariants, type GlossaryEntry } from "./glossaryMatch";

const e = (term: string): GlossaryEntry => ({ term, definition: "d" });
const run = (text: string, terms: string[], seen = new Set<string>()) => markTerms(text, terms.map(e), seen);
const marked = (segs: ReturnType<typeof run>) => segs.filter((s) => typeof s !== "string").map((s) => (s as { text: string }).text);
const joined = (segs: ReturnType<typeof run>) => segs.map((s) => (typeof s === "string" ? s : s.text)).join("");

describe("termVariants", () => {
  it("splits A / B, drops parentheses, keeps acronyms", () => {
    expect(termVariants("cache hit / miss")).toEqual(["cache hit", "miss"]);
    expect(termVariants("two-phase commit (2pc)")).toEqual(["two-phase commit (2pc)", "two-phase commit", "2pc"]);
    expect(termVariants("quorum (n, r, w)")).toEqual(["quorum (n, r, w)", "quorum"]);
    expect(termVariants("http/3")).toEqual(["http/3"]);
  });
});

describe("markTerms", () => {
  it("marks whole words only, case-insensitively, without changing the text", () => {
    const s = run("A Cache and a cachet; caches too.", ["cache"]);
    expect(marked(s)).toEqual(["Cache"]);
    expect(joined(s)).toBe("A Cache and a cachet; caches too.");
  });
  it("marks only the first occurrence, and remembers it across calls", () => {
    const seen = new Set<string>();
    expect(marked(run("replica, replica", ["replica"], seen))).toEqual(["replica"]);
    expect(marked(run("another replica", ["replica"], seen))).toEqual([]);
  });
  it("matches either side of A / B and counts them as one entry", () => {
    expect(marked(run("a miss then a cache hit", ["cache hit / miss"]))).toEqual(["miss"]);
  });
  it("prefers the longest overlapping term", () => {
    expect(marked(run("a retry budget helps", ["retry", "retry budget"]))).toEqual(["retry budget"]);
  });
  it("does not match inside hyphenated words", () => {
    expect(marked(run("cache-aside and fan-out", ["cache", "out"]))).toEqual([]);
  });
  it("handles special characters", () => {
    const s = run("HTTP/3 (QUIC) uses C++ and $5.", ["http/3", "c++"]);
    expect(marked(s)).toEqual(["HTTP/3", "C++"]);
    expect(joined(s)).toBe("HTTP/3 (QUIC) uses C++ and $5.");
  });
  it("returns the text untouched when nothing matches", () => {
    expect(run("nothing here", ["cache"])).toEqual(["nothing here"]);
  });
});

describe("glossaryId", () => {
  it("is topic plus term slug", () => expect(glossaryId("cap", "Quorum (N, R, W)")).toBe("cap-quorum-n-r-w"));
});
