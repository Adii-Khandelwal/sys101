import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SKIPPED, rememberFind, takeFind } from "./findOnPage";

describe("find on page hand-off", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("gives the typed words to the page the result opened, once", () => {
    rememberFind("/topic/caching#write-through", "Write  Through", "<mark>Write</mark> <mark>through</mark> sends every write");
    expect(takeFind("/topic/caching")).toEqual({ words: ["write", "through"], hint: ["write", "through", "sends", "every", "write"] });
    expect(takeFind("/topic/caching")).toBeNull();
  });

  it("ignores words left for another page", () => {
    rememberFind("/posts", "cache");
    expect(takeFind("/topic/caching")).toBeNull();
  });

  it("ignores words that are no longer fresh", () => {
    vi.useFakeTimers();
    rememberFind("/posts", "cache");
    vi.advanceTimersByTime(20_000);
    expect(takeFind("/posts")).toBeNull();
    vi.useRealTimers();
  });
});

describe("find on page skipped areas", () => {
  it("never searches navs or the header", () => {
    expect(SKIPPED).toContain("nav");
    expect(SKIPPED).toContain(".site-header");
  });
});
