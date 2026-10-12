import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { navigateWithTransition } from "../components/ViewTransitions";
import { BUBBLE_SCALE, bubbleLayers, clickIntent, growBubble, removeBubbles } from "./nodeOpen";

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const graphView = fs.readFileSync(path.join(root, "components/GraphView.tsx"), "utf8");

describe("which clicks play the node-open animation", () => {
  const click = { type: "click", button: 0, detail: 1 };

  it("a plain pointer click or a touch tap animates", () => {
    expect(clickIntent(click, false)).toBe("animate");
    expect(clickIntent({ type: "touchend" }, false)).toBe("animate"); // Sigma's tap carries a touch event: no detail, no button
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
    expect(graphView).toContain("clickIntent(event.original");
    expect(graphView).toMatch(/intent === "new-tab"\)[^}]*window\.open\(href, "_blank", "noopener,noreferrer"\)/s);
    // growBubble is only reached after the new-tab and instant branches have returned
    const handler = graphView.slice(graphView.indexOf("const openNode"));
    expect(handler.indexOf("growBubble(")).toBeGreaterThan(handler.indexOf('intent === "instant"'));
    expect(handler.indexOf("growBubble(")).toBeGreaterThan(handler.indexOf('intent === "new-tab"'));
    // the animation lives only in the Map: Path view, search and plain links never import it
    for (const f of ["components/PathView.tsx", "components/Search.tsx", "components/TopicList.tsx", "components/TopicIndex.tsx", "components/HomeView.tsx"]) {
      if (fs.existsSync(path.join(root, f))) expect(fs.readFileSync(path.join(root, f), "utf8"), f).not.toMatch(/nodeOpen|growBubble|node-open/);
    }
  });
});

describe("the bubble", () => {
  it("lays out the ring, the fill and the centre dot the way the map draws a node", () => {
    expect(bubbleLayers(14, 1.5)).toEqual({ outer: 14, inner: 12.5, dot: 12.5 - 0.55 * 14 });
    expect(bubbleLayers(14, 3).dot).toBeCloseTo(11 - 7.7, 5);
    expect(bubbleLayers(2, 5)).toEqual({ outer: 2, inner: 0, dot: 0 }); // never negative
  });

  it("grows by a transform only, to a fixed multiple, and is removed when asked", () => {
    const made: FakeEl[] = [];
    const doc = fakeDocument(made);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    const bubble = growBubble({ x: 100, y: 50, r: 14, border: "#111", fill: "#eee", dot: "#a33", borderSize: 3 });
    const el = made[0];
    expect(el.className).toBe("node-bubble");
    expect(el.attrs["aria-hidden"]).toBe("true");
    expect(el.style.cssText).toContain("left:86px;top:36px;width:28px;height:28px");
    expect(el.style.transform).toBe(`scale(${BUBBLE_SCALE})`);
    expect(el.reflowed).toBe(true); // the starting frame was committed before the transform changed
    expect(el.children).toHaveLength(3);
    expect(Object.keys(el.style).filter((k) => /width|height|left|top|margin/.test(k) && k !== "cssText")).toEqual([]); // growth never touches layout properties
    bubble.remove();
    expect(doc.body.children).toHaveLength(0);
    removeBubbles(); // idempotent
  });

  it("the CSS animates the bubble's transform with the base duration and nothing else", () => {
    const rule = css.match(/\.node-bubble \{[^}]*\}/)![0];
    expect(rule).toMatch(/transition: transform var\(--dur-base\) var\(--ease-out\);/);
    expect(rule).not.toMatch(/animation|width|height|top:\s*[^;]*transition/);
    expect(rule).toContain("pointer-events: none");
  });
});

describe("the page fade-in that follows", () => {
  it("is opacity only, one base duration, and applies only while a node is opening", () => {
    expect(css).toMatch(/html\[data-nav="node-open"\]::view-transition-new\(root\) \{\s*animation: vt-fade-in var\(--dur-base\) var\(--ease-out\) both;/);
    expect(css).toMatch(/html\[data-nav="node-open"\]::view-transition-old\(root\) \{\s*animation: none;/);
    const keyframes = css.match(/@keyframes vt-fade-in \{[^]*?\n\}/)![0];
    expect(keyframes).toContain("opacity: 0");
    expect(keyframes).not.toMatch(/transform|translate|scale/);
    // the ordinary page-to-page transition (with its 8px rise) is untouched
    expect(css).toMatch(/::view-transition-new\(root\) \{\s*animation: vt-in var\(--dur-slow\)/);
  });

  it("grow (base) plus fade-in (base) is about 400ms, from the tokens", () => {
    const base = Number(css.match(/--dur-base:\s*(\d+)ms/)![1]);
    expect(base * 2).toBe(400);
  });
});

describe("navigateWithTransition", () => {
  afterEach(() => vi.unstubAllGlobals());

  const setup = (reduced: boolean, withApi = true) => {
    const dataset: Record<string, string> = {};
    let finish: () => void = () => {};
    const finished = new Promise<void>((r) => (finish = r));
    let callback: (() => Promise<void>) | undefined;
    const start = vi.fn((cb: () => Promise<void>) => {
      callback = cb;
      return { finished };
    });
    vi.stubGlobal("document", { ...(withApi ? { startViewTransition: start } : {}), documentElement: { dataset }, querySelector: () => null });
    vi.stubGlobal("location", { href: "http://x.test/", pathname: "/" });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: reduced }) });
    const router = { push: vi.fn() };
    return { router, start, dataset, finish, run: () => callback!() };
  };

  it("under reduced motion it navigates at once: no transition, no data-nav", () => {
    const t = setup(true);
    navigateWithTransition(t.router, "/topic/caching", { nodeOpen: true, onSwap: vi.fn() });
    expect(t.router.push).toHaveBeenCalledWith("/topic/caching");
    expect(t.start).not.toHaveBeenCalled();
    expect(t.dataset.nav).toBeUndefined();
  });

  it("without the View Transitions API it just navigates", () => {
    const t = setup(false, false);
    navigateWithTransition(t.router, "/topic/caching", { nodeOpen: true });
    expect(t.router.push).toHaveBeenCalledWith("/topic/caching");
    expect(t.dataset.nav).toBeUndefined();
  });

  it("a node-open transition marks the page for the fade-in, swaps, removes the bubble after the swap, and clears the mark", async () => {
    const t = setup(false);
    const order: string[] = [];
    t.router.push.mockImplementation(() => order.push("push"));
    vi.stubGlobal("location", { href: "http://x.test/", pathname: "/topic/caching" }); // the new page has arrived
    navigateWithTransition(t.router, "/topic/caching", { nodeOpen: true, onSwap: () => order.push("swap") });
    expect(t.dataset.nav).toBe("node-open");
    await t.run();
    expect(order).toEqual(["push", "swap"]);
    t.finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(t.dataset.nav).toBeUndefined();
  });

  it("an ordinary link transition does not set data-nav, so it keeps the normal cross-fade", () => {
    const t = setup(false);
    navigateWithTransition(t.router, "/topic/caching");
    expect(t.start).toHaveBeenCalled();
    expect(t.dataset.nav).toBeUndefined();
  });
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
