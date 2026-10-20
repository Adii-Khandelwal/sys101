import { describe, expect, it } from "vitest";
import { GLOSS_OPEN_DELAY_MS, glossOpenMode } from "./glossOpen";

const base = { alreadyOpen: false, otherOpen: false, lastClosedAt: 0, now: 10_000 };

describe("glossOpenMode", () => {
  it("the first open waits", () => expect(glossOpenMode(base)).toBe("wait"));
  it("a neighbour opens at once while another popover is open", () => expect(glossOpenMode({ ...base, otherOpen: true })).toBe("instant"));
  it("a neighbour opens at once within 300ms of a close", () => expect(glossOpenMode({ ...base, lastClosedAt: base.now - (GLOSS_OPEN_DELAY_MS - 1) })).toBe("instant"));
  it("waits again after 300ms", () => expect(glossOpenMode({ ...base, lastClosedAt: base.now - GLOSS_OPEN_DELAY_MS })).toBe("wait"));
  it("returning to an open popover changes nothing", () => expect(glossOpenMode({ ...base, alreadyOpen: true, otherOpen: true })).toBe("stay"));
});
