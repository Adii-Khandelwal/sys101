import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BURST_AT_MS, BURST_SCALE, GROWTH_MS, SAFETY_MS, SHOCK_SCALE, SWELL_SCALE, bubbleLayers, clickIntent, growBubble, playNodeOpen, removeBubbles } from "./nodeOpen";

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const graphView = fs.readFileSync(path.join(root, "components/GraphView.tsx"), "utf8");

describe("which clicks play the node-open animation", () => {
  const click = { type: "click", button: 0, detail: 1 };

  it("a plain pointer click or a touch tap animates", () => {
    expect(clickIntent(click, false)).toBe("animate");
    expect(clickIntent({ type: "touchend" }, false)).toBe("animate"); // a tap carries a touch event: no detail, no button
    expect(clickIntent({ type: "click", button: 0, detail: 2 }, false)).toBe("animate");
  });

  it("reduced motion opens at once, with no animation", () => {
    expect(clickIntent(click, true)).toBe("instant");
    expect(clickIntent({ type: "touchend" }, true)).toBe("instant");
  });

  it("Ctrl, Cmd, Shift or Alt opens a new tab and never animates, with or without reduced motion", () => {
    for (const key of ["ctrlKey", "metaKey", "shiftKey", "altKey"]) {
      expect(clickIntent({ ...click, [key]: true }, false), key).toBe("new-tab");
      expect(clickIntent({ ...click, [key]: true }, true), `${key} with reduced motion`).toBe("new-tab");
    }
  });

  it("a middle click opens a new tab and never animates", () => {
    expect(clickIntent({ type: "auxclick", button: 1 }, false)).toBe("new-tab");
    expect(clickIntent({ type: "auxclick", button: 1 }, true)).toBe("new-tab");
  });

  it("a click made by a script or assistive technology (detail 0) is not a pointer click: no animation", () => {
    expect(clickIntent({ type: "click", button: 0, detail: 0 }, false)).toBe("instant");
  });

  it("a missing event is treated as a plain click", () => {
    expect(clickIntent(undefined, false)).toBe("animate");
    expect(clickIntent(undefined, true)).toBe("instant");
  });

  it("the Map's click handler wires the intents: new tab for modified clicks, no bubble unless the intent is animate", () => {
    // 4a: the Map's node links are plain links; modified clicks are left to the browser. 4c puts playNodeOpen back.
    expect(graphView).toContain("clickIntent(e.nativeEvent");
    expect(graphView).toMatch(/=== "new-tab"\) return;/);
    // the animation lives only in the Map: Path view, search and plain links never import it
    for (const f of ["components/PathView.tsx", "components/Search.tsx", "components/TopicList.tsx", "components/TopicIndex.tsx", "components/HomeView.tsx"]) {
      if (fs.existsSync(path.join(root, f))) expect(fs.readFileSync(path.join(root, f), "utf8"), f).not.toMatch(/nodeOpen|growBubble|playNodeOpen|node-open/);
    }
  });
});

describe("the bubble", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lays out the ring, the fill and the centre dot the way the map draws a node", () => {
    expect(bubbleLayers(14, 1.5)).toEqual({ outer: 14, inner: 12.5, dot: 12.5 - 0.55 * 14 });
    expect(bubbleLayers(14, 3).dot).toBeCloseTo(11 - 7.7, 5);
    expect(bubbleLayers(2, 5)).toEqual({ outer: 2, inner: 0, dot: 0 }); // never negative
  });

  it("is built at its largest size and scaled DOWN to the node to start, so it stays crisp when it swells", () => {
    const made: FakeEl[] = [];
    const doc = fakeDocument(made);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    const bubble = growBubble({ x: 100, y: 50, r: 14, border: "#111", fill: "#eee", dot: "#a33", borderSize: 3 });
    const el = made[0];
    expect(el.className).toBe("node-bubble");
    expect(el.attrs["aria-hidden"]).toBe("true");
    const big = 14 * SWELL_SCALE;
    expect(el.style.cssText).toContain(`left:${100 - big}px;top:${50 - big}px;width:${big * 2}px;height:${big * 2}px`);
    expect(el.style.cssText).toContain(`transform:scale(${1 / SWELL_SCALE})`); // exactly the node's own size at the start
    expect(el.reflowed).toBe(true); // the starting frame was committed before anything changes
    expect(el.children).toHaveLength(3);
    // each later size is a transform, and nothing but transform and opacity is ever set afterwards
    bubble.scaleTo(SWELL_SCALE / 2);
    expect(el.style.transform).toBe("scale(0.5)");
    bubble.scaleTo(SWELL_SCALE);
    expect(el.style.transform).toBe("scale(1)");
    bubble.fadeOut();
    expect(el.style.opacity).toBe("0");
    expect(Object.keys(el.style).filter((k) => !["cssText", "transform", "opacity"].includes(k))).toEqual([]);
    bubble.remove();
    expect(doc.body.children).toHaveLength(0);
    removeBubbles(); // idempotent
  });

  it("the sizes only ever grow, up to a burst past the full growth, and the burst starts before the growth ends", () => {
    expect(SWELL_SCALE).toBeGreaterThan(1);
    expect(BURST_SCALE).toBeGreaterThan(SWELL_SCALE);
    expect(SHOCK_SCALE).toBeGreaterThan(1);
    // The ease-in-out speed peaks about halfway and fades to nothing at the end. Bursting between 40% and 70% means the
    // pop takes over while the bubble is still moving fast, so there is no slowdown before it.
    expect(BURST_AT_MS).toBeGreaterThan(GROWTH_MS * 0.4);
    expect(BURST_AT_MS).toBeLessThan(GROWTH_MS * 0.7);
  });

  it("the CSS animates only transform and opacity, from the tokens: one continuous growth of three base durations, a fast burst", () => {
    const rule = (sel: string) => {
      const at = css.indexOf(`${sel} {`);
      expect(at, sel).toBeGreaterThan(-1);
      return css.slice(at, css.indexOf("}", at) + 1);
    };
    expect(rule(".node-bubble")).toMatch(/transition: transform calc\(var\(--dur-base\) \* 3\) var\(--ease-in-out\), opacity var\(--dur-fast\) var\(--ease-out\);/);
    expect(rule(".node-bubble.is-bursting")).toMatch(/transition: transform var\(--dur-fast\) var\(--ease-out\), opacity var\(--dur-fast\) var\(--ease-out\);/);
    expect(rule(".node-burst")).toMatch(/transition: transform var\(--dur-base\) var\(--ease-out\), opacity var\(--dur-base\) var\(--ease-out\);/);
    expect(rule(".node-curtain")).toMatch(/transition: opacity var\(--dur-base\) var\(--ease-out\);/);
    expect(rule(".node-curtain")).toContain("background: var(--paper)");
    expect(css).not.toContain("is-swelling"); // no second growth step to start from rest: that was the pause
    // the loader state: a gentle scale pulse on the skeleton-pulse token, transform only
    expect(rule(".node-bubble.is-waiting")).toMatch(/animation: bubble-breathe var\(--dur-pulse\) var\(--ease-in-out\) infinite alternate;/);
    const breathe = css.match(/@keyframes bubble-breathe \{[^]*?\n\}/)![0];
    expect(breathe).toMatch(/scale\(1\)/);
    expect(breathe).not.toMatch(/opacity|width|height|top|left|translate/);
    for (const sel of [".node-bubble", ".node-burst", ".node-curtain"]) {
      expect(rule(sel), sel).toContain("pointer-events: none");
      expect(rule(sel), sel).not.toMatch(/animation|transition:[^;]*(width|height|top|left|margin)/);
    }
    const base = Number(css.match(/--dur-base:\s*(\d+)ms/)![1]);
    expect(GROWTH_MS).toBe(base * 3);
  });

  it("uses no page-to-page keyframes and no View Transitions rules for the node-open path", () => {
    expect(css).not.toContain('data-nav="node-open"');
  });
});

describe("playNodeOpen: the whole sequence", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const setup = () => {
    vi.useFakeTimers();
    const made: FakeEl[] = [];
    const doc = fakeDocument(made);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    let release: () => void = () => {};
    const navigate = vi.fn(() => new Promise<void>((r) => (release = r)));
    const spec = { x: 100, y: 50, r: 14, border: "#111", fill: "#eee", dot: "#a33", borderSize: 3 };
    const flush = async () => {
      for (let i = 0; i < 6; i++) await Promise.resolve();
    };
    return { made, doc, navigate, release: () => release(), spec, flush };
  };
  const find = (made: FakeEl[], cls: string) => made.find((e) => e.className.split(" ").includes(cls))!;
  const hasBurst = (made: FakeEl[]) => made.some((e) => e.className === "node-burst");

  it("starts one continuous growth at once, with the screen fading in; nothing navigates yet", async () => {
    const t = setup();
    playNodeOpen(t.spec, t.navigate);
    const curtain = find(t.made, "node-curtain");
    const bubble = find(t.made, "node-bubble");
    expect(curtain.style.opacity).toBe("1");
    expect(bubble.style.transform).toBe("scale(1)"); // straight to full size: a single move, set once
    expect(curtain.reflowed).toBe(true);
    expect(t.doc.body.children.indexOf(curtain)).toBeLessThan(t.doc.body.children.indexOf(bubble)); // the bubble is above the screen
    await t.flush();
    expect(t.navigate).not.toHaveBeenCalled();
  });

  it("never restarts or changes the growth partway: the bubble is touched once before the burst", async () => {
    const t = setup();
    playNodeOpen(t.spec, t.navigate);
    const bubble = find(t.made, "node-bubble");
    const seen: string[] = [];
    let transform = bubble.style.transform;
    const watch = () => {
      if (bubble.style.transform !== transform || bubble.className !== "node-bubble") seen.push(`${bubble.className}|${bubble.style.transform}`);
      transform = bubble.style.transform;
    };
    find(t.made, "node-curtain").listeners.transitionend(); // the screen is in: the page loads
    await t.flush();
    watch();
    await vi.advanceTimersByTimeAsync(BURST_AT_MS - 1);
    watch();
    expect(seen).toEqual([]); // no second step, no class change, no new size
  });

  it("loads the page behind the screen once it is fully in, and bursts only when the page has arrived and the growth is far enough", async () => {
    const t = setup();
    playNodeOpen(t.spec, t.navigate);
    find(t.made, "node-curtain").listeners.transitionend();
    await t.flush();
    expect(t.navigate).toHaveBeenCalledTimes(1);
    t.release(); // the page is here, but the growth is not far enough
    await vi.advanceTimersByTimeAsync(BURST_AT_MS - 5);
    expect(hasBurst(t.made)).toBe(false);
    await vi.advanceTimersByTimeAsync(10);
    expect(hasBurst(t.made)).toBe(true);
  });

  it("a slow page keeps the bubble at full size until it arrives: it never bursts early", async () => {
    const t = setup();
    playNodeOpen(t.spec, t.navigate);
    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(2000); // the page is still loading
    expect(hasBurst(t.made)).toBe(false);
    expect(find(t.made, "node-bubble").className).toBe("node-bubble is-waiting"); // breathing: it is the loader
    t.release();
    await vi.advanceTimersByTimeAsync(300);
    expect(t.doc.body.children).toHaveLength(0);
  });

  it("a page that arrives in time never sees the loader state: the bubble bursts straight out of the growth", async () => {
    const t = setup();
    playNodeOpen(t.spec, t.navigate);
    const bubble = find(t.made, "node-bubble");
    find(t.made, "node-curtain").listeners.transitionend();
    await t.flush();
    t.release();
    await vi.advanceTimersByTimeAsync(BURST_AT_MS + 5);
    expect(bubble.className).toBe("node-bubble is-bursting");
    bubble.listeners.transitionend?.(); // the growth's end arrives after the burst: it must not drag the bubble back to waiting
    await vi.advanceTimersByTimeAsync(GROWTH_MS + 100);
    expect(bubble.className).not.toContain("is-waiting");
  });

  it("the burst: pop outward and fade, a shock ring past it, the screen fades out, then everything is removed", async () => {
    const t = setup();
    playNodeOpen(t.spec, t.navigate);
    const curtain = find(t.made, "node-curtain");
    const bubble = find(t.made, "node-bubble");
    curtain.listeners.transitionend();
    await t.flush();
    t.release();
    await vi.advanceTimersByTimeAsync(BURST_AT_MS + 5);
    const shock = find(t.made, "node-burst");
    expect(bubble.className).toBe("node-bubble is-bursting");
    expect(bubble.style.transform).toBe(`scale(${BURST_SCALE / SWELL_SCALE})`);
    expect(bubble.style.opacity).toBe("0");
    expect(shock.style.transform).toBe(`scale(${SHOCK_SCALE})`);
    expect(shock.style.opacity).toBe("0");
    expect(shock.style.cssText).toContain("border-color:#111");
    expect(curtain.style.opacity).toBe("0");
    expect(t.doc.body.children).toHaveLength(3); // still there until the fade ends
    curtain.listeners.transitionend();
    await t.flush();
    expect(t.doc.body.children).toHaveLength(0);
  });

  it("works without transitionend (a hidden tab): timeouts carry it through", async () => {
    const t = setup();
    playNodeOpen(t.spec, t.navigate);
    await vi.advanceTimersByTimeAsync(300);
    expect(t.navigate).toHaveBeenCalledTimes(1);
    t.release();
    await vi.advanceTimersByTimeAsync(600);
    expect(t.doc.body.children).toHaveLength(0);
  });

  it("cancel removes everything at once, including the shock ring, and the page swap never starts", async () => {
    const t = setup();
    const open = playNodeOpen(t.spec, t.navigate);
    open.cancel();
    expect(t.doc.body.children).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(t.navigate).not.toHaveBeenCalled();
  });

  it("nothing can hold the screen for longer than the safety limit", async () => {
    const t = setup();
    playNodeOpen(t.spec, t.navigate);
    find(t.made, "node-curtain").listeners.transitionend();
    await t.flush();
    expect(t.doc.body.children).toHaveLength(2); // the page never arrives
    await vi.advanceTimersByTimeAsync(SAFETY_MS + 10);
    expect(t.doc.body.children).toHaveLength(0);
  });

  // 4c: restore the Map's wiring test (playNodeOpen inside the page swap, removeBubbles on leaving) with the transition.
  it.todo("the Map starts it only for the animate intent, runs the page swap inside it, and keeps the screen across the swap");
});

type FakeEl = { className: string; attrs: Record<string, string>; style: Record<string, string> & { cssText: string }; children: FakeEl[]; reflowed: boolean; listeners: Record<string, () => void>; setAttribute: (k: string, v: string) => void; append: (...c: FakeEl[]) => void; getBoundingClientRect: () => object; addEventListener: (t: string, f: () => void) => void; remove: () => void };

function fakeDocument(made: FakeEl[]) {
  const body = { children: [] as FakeEl[], append(el: FakeEl) { this.children.push(el); } };
  const create = (): FakeEl => {
    const el: FakeEl = {
      className: "",
      attrs: {},
      style: { cssText: "" } as FakeEl["style"],
      children: [],
      reflowed: false,
      listeners: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      append(...c) { this.children.push(...c); },
      getBoundingClientRect() { this.reflowed = true; return {}; },
      addEventListener(t, f) { this.listeners[t] = f; },
      remove() { body.children = body.children.filter((x) => x !== this); },
    };
    made.push(el);
    return el;
  };
  return { body, createElement: create, querySelectorAll: () => ({ forEach: (f: (e: FakeEl) => void) => body.children.slice().forEach(f) }) };
}
