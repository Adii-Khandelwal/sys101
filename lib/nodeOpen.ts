// The node-open transition on the Map: a plain click or tap on a node grows its bubble, then the topic opens with a
// short fade-in (docs/graph.md). Everything else keeps its normal behaviour. Pure parts are tested; the DOM part is small.
import { DURATION } from "./motion";

/** What a click on a map node should do. */
export type ClickIntent =
  /** A plain pointer or touch click: grow the bubble, then open with a fade-in. */
  | "animate"
  /** Open at once, no animation: reduced motion, or a click that did not come from a pointer. */
  | "instant"
  /** Ctrl, Cmd, Shift or Alt held, or a middle click: what a link does, a new tab. */
  | "new-tab";

type PointerLike = { type?: string; button?: number; detail?: number; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean };

/**
 * Decide from the browser event behind a Sigma click or tap. Modified and middle clicks never animate, even without
 * reduced motion. A "click" with detail 0 is one a script or assistive technology made, not a pointer: no animation.
 */
export function clickIntent(original: PointerLike | undefined, reducedMotion: boolean): ClickIntent {
  const e = original ?? {};
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button === 1) return "new-tab";
  if (reducedMotion) return "instant";
  if (e.type === "click" && e.detail === 0) return "instant";
  return "animate";
}

/** How much the bubble grows, as a multiple of its starting size. */
export const BUBBLE_SCALE = 2.4;

/** The node as drawn by the map: a ring, a band of fill, and a centre dot (see the "bordered" program in GraphView). */
export type BubbleSpec = { x: number; y: number; r: number; border: string; fill: string; dot: string; borderSize: number };

const FILL_BAND = 0.55; // the fill layer's width as a share of the radius, as in the map's node program

/** Sizes of the three circles for a node of radius `r`: the whole node, inside the ring, and the centre dot. */
export function bubbleLayers(r: number, borderSize: number) {
  const inner = Math.max(0, r - borderSize);
  return { outer: r, inner, dot: Math.max(0, inner - FILL_BAND * r) };
}

export type Bubble = { done: Promise<void>; remove: () => void };

/** Remove every bubble: on arrival at a page, and whenever a page is restored from the back/forward cache. */
export function removeBubbles() {
  document.querySelectorAll(".node-bubble").forEach((el) => el.remove());
}

/**
 * Put a copy of the node over the node and scale it up with a transform (compositor only, no layout). It starts at
 * scale 1, exactly over the node, so nothing flashes. `done` resolves when the growth ends. Under prefers-reduced-motion
 * this is never called: the caller navigates at once.
 */
export function growBubble(spec: BubbleSpec): Bubble {
  const el = document.createElement("div");
  el.className = "node-bubble";
  el.setAttribute("aria-hidden", "true");
  const { outer, inner, dot } = bubbleLayers(spec.r, spec.borderSize);
  el.style.cssText = `left:${spec.x - outer}px;top:${spec.y - outer}px;width:${outer * 2}px;height:${outer * 2}px`;
  const circle = (size: number, color: string) => {
    const c = document.createElement("span");
    c.style.cssText = `width:${size * 2}px;height:${size * 2}px;margin:${-size}px 0 0 ${-size}px;background:${color}`;
    return c;
  };
  el.append(circle(outer, spec.border), circle(inner, spec.fill), circle(dot, spec.dot));
  document.body.append(el);
  el.getBoundingClientRect(); // commit the starting frame before the transition begins
  const done = new Promise<void>((resolve) => {
    // The timeout only matters if transitionend never fires (a hidden tab).
    const timer = window.setTimeout(resolve, DURATION.base + 60);
    el.addEventListener(
      "transitionend",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
  el.style.transform = `scale(${BUBBLE_SCALE})`;
  return { done, remove: () => el.remove() };
}
