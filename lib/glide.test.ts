import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectGlide, glideSettled, glideToSection, settleGlide, whenVisible } from "./glide";

// No DOM in the test environment: a small fake of what glide.ts touches.
type Listener = () => void;
let scrollY: number;
let reduced: boolean;
let nowMs: number;
let rafQueue: ((t: number) => void)[];
let listeners: Map<string, Set<Listener>>;
let scrolls: number[];

// `pageTop` is where the section is on the page; the viewport-relative top moves as the page scrolls, as in a browser.
const section = (pageTop: number, heading = { hasAttribute: () => true, setAttribute: vi.fn(), focus: vi.fn() }) => ({
  getBoundingClientRect: () => ({ top: pageTop - scrollY }),
  querySelector: () => heading,
});

function step(ms: number) {
  nowMs += ms;
  const run = rafQueue;
  rafQueue = [];
  run.forEach((cb) => cb(nowMs));
}

beforeEach(() => {
  scrollY = 0;
  reduced = false;
  nowMs = 0;
  rafQueue = [];
  scrolls = [];
  listeners = new Map();
  vi.stubGlobal("window", {
    get scrollY() {
      return scrollY;
    },
    innerHeight: 800,
    matchMedia: () => ({ matches: reduced }),
    scrollTo: ({ top }: { top: number }) => {
      scrollY = top;
      scrolls.push(top);
    },
    addEventListener: (e: string, l: Listener) => (listeners.get(e) ?? listeners.set(e, new Set()).get(e)!).add(l),
    removeEventListener: (e: string, l: Listener) => listeners.get(e)?.delete(l),
  });
  vi.stubGlobal("document", {
    documentElement: { scrollHeight: 5000 },
    querySelector: (s: string) => ({ offsetHeight: s === ".site-header" ? 64 : 0 }), // the sticky header; no phone strip
    getElementById: () => null,
  });
  vi.stubGlobal("performance", { now: () => nowMs });
  vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => rafQueue.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {
    rafQueue = [];
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("hand-off to other scrollers", () => {
  it("waits for the glide to settle, and not at all when none is expected", async () => {
    await glideSettled();
    const token = expectGlide();
    let done = false;
    void glideSettled().then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(false);
    settleGlide(token);
    await Promise.resolve();
    await Promise.resolve();
    expect(done).toBe(true);
  });

  it("ignores a late settle from an older navigation", async () => {
    const first = expectGlide();
    const second = expectGlide();
    let done = false;
    void glideSettled().then(() => (done = true));
    settleGlide(first);
    await Promise.resolve();
    await Promise.resolve();
    expect(done).toBe(false);
    settleGlide(second);
    await Promise.resolve();
    await Promise.resolve();
    expect(done).toBe(true);
  });
});

describe("glideToSection", () => {
  it("lands the section just under the header (header 64px + 16px gap)", async () => {
    reduced = true;
    await glideToSection(section(1000) as unknown as HTMLElement);
    expect(scrollY).toBe(1000 - 80);
  });

  it("also clears the phone contents strip when it is shown", async () => {
    reduced = true;
    vi.stubGlobal("document", {
      documentElement: { scrollHeight: 5000 },
      querySelector: (s: string) => ({ offsetHeight: s === ".site-header" ? 64 : 48 }),
      getElementById: () => null,
    });
    await glideToSection(section(1000) as unknown as HTMLElement);
    expect(scrollY).toBe(1000 - 80 - 48);
  });

  it("moves focus to the heading without scrolling, and makes it focusable", async () => {
    reduced = true;
    const heading = { hasAttribute: () => false, setAttribute: vi.fn(), focus: vi.fn() };
    await glideToSection(section(500, heading) as unknown as HTMLElement);
    expect(heading.setAttribute).toHaveBeenCalledWith("tabindex", "-1");
    expect(heading.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("never scrolls above the top", async () => {
    reduced = true;
    scrollY = 300;
    await glideToSection(section(10) as unknown as HTMLElement); // 10 - 80 is above the top
    expect(scrollY).toBe(0);
  });

  it("stops at the bottom of the page instead of overshooting", async () => {
    reduced = true;
    await glideToSection(section(9000) as unknown as HTMLElement);
    expect(scrollY).toBe(5000 - 800);
  });

  it("jumps at once under reduced motion", async () => {
    reduced = true;
    await glideToSection(section(2000) as unknown as HTMLElement);
    expect(scrolls).toEqual([2000 - 80]);
  });

  it("jumps when the target is already about where it should be", async () => {
    scrollY = 920;
    await glideToSection(section(1001) as unknown as HTMLElement); // target 921, 1px away
    expect(scrolls).toEqual([921]); // one instant jump, no frames queued
    expect(rafQueue).toHaveLength(0);
  });

  it("eases in frames, ends exactly on target and resolves", async () => {
    let done = false;
    glideToSection(section(1080) as unknown as HTMLElement).then(() => (done = true)); // target 1000, far: 320..700ms
    step(16);
    expect(scrollY).toBeGreaterThan(0);
    expect(scrollY).toBeLessThan(1000);
    expect(done).toBe(false);
    step(800); // past the longest duration
    await Promise.resolve();
    expect(scrollY).toBe(1000);
    expect(done).toBe(true);
    expect(listeners.get("wheel")?.size ?? 0).toBe(0); // interrupt listeners removed
  });

  it("caps the duration at 700ms for a long way", async () => {
    glideToSection(section(4080) as unknown as HTMLElement);
    step(700);
    expect(scrollY).toBe(4000);
  });

  it("stops when the reader wheels, touches or presses a key", async () => {
    for (const evt of ["wheel", "touchstart", "keydown", "mousedown"]) {
      scrollY = 0;
      let done = false;
      glideToSection(section(1080) as unknown as HTMLElement).then(() => (done = true));
      step(50);
      const at = scrollY;
      listeners.get(evt)!.forEach((l) => l());
      await Promise.resolve();
      expect(done, evt).toBe(true);
      step(800); // no more frames after the stop
      expect(scrollY, evt).toBe(at);
    }
  });

  it("a new glide stops the one in progress", async () => {
    let first = false;
    glideToSection(section(1080) as unknown as HTMLElement).then(() => (first = true));
    step(50);
    glideToSection(section(2080) as unknown as HTMLElement);
    await Promise.resolve();
    expect(first).toBe(true);
    step(800);
    expect(scrollY).toBe(2000);
  });
});

describe("whenVisible", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resolves with the element once it has layout", async () => {
    const el = { getClientRects: () => [1] };
    let has = false;
    (document as unknown as { getElementById: () => unknown }).getElementById = () => (has ? el : null);
    const p = whenVisible("x");
    vi.advanceTimersByTime(100);
    has = true;
    vi.advanceTimersByTime(40);
    await expect(p).resolves.toBe(el);
  });

  it("ignores an element that is in the page but not shown", async () => {
    (document as unknown as { getElementById: () => unknown }).getElementById = () => ({ getClientRects: () => [] });
    const p = whenVisible("x", 200);
    vi.setSystemTime(Date.now());
    nowMs = 0;
    for (let i = 0; i < 20; i++) {
      nowMs += 16;
      vi.advanceTimersByTime(16);
    }
    await expect(p).resolves.toBeNull();
  });

  it("gives up with null after the cap", async () => {
    const p = whenVisible("missing", 100);
    for (let i = 0; i < 12; i++) {
      nowMs += 16;
      vi.advanceTimersByTime(16);
    }
    await expect(p).resolves.toBeNull();
  });
});
