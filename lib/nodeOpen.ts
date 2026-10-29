// The node-open transition on the Map (.claude/rules/graph.md): a plain click or tap on a node grows its bubble while the map
// fades to the page colour; on that plain screen the bubble keeps swelling while the topic loads behind it, then bursts,
// and the screen fades out to show the topic. Everything else keeps its normal behaviour. Pure parts are tested; the DOM
// part is small.
import { DURATION } from "./motion";

/** What a click on a map node should do. */
type ClickIntent =
  /** A plain pointer or touch click: grow the bubble, then open with a fade-in. */
  | "animate"
  /** Open at once, no animation: reduced motion, or a click that did not come from a pointer. */
  | "instant"
  /** Ctrl, Cmd, Shift or Alt held, or a middle click: what a link does, a new tab. */
  | "new-tab";

type PointerLike = { type?: string; button?: number; detail?: number; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean };

/**
 * Decide from the browser event behind a node click or tap. Modified and middle clicks never animate, even without
 * reduced motion. A "click" with detail 0 is one a script or assistive technology made, not a pointer: no animation.
 */
export function clickIntent(original: PointerLike | undefined, reducedMotion: boolean): ClickIntent {
  const e = original ?? {};
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button === 1) return "new-tab";
  if (reducedMotion) return "instant";
  if (e.type === "click" && e.detail === 0) return "instant";
  return "animate";
}

/** The bubble's size, as a multiple of the node, at the end of each step. */
export const SWELL_SCALE = 10; // the one continuous growth would end here; the burst cuts it short
export const BURST_SCALE = 12; // the pop itself
export const SHOCK_SCALE = 2.2; // how far the shock ring travels past the bubble's full size

/** The node as drawn by the map: a ring, a band of fill, and a centre dot (see the "bordered" program in GraphView). */
export type BubbleSpec = { x: number; y: number; r: number; border: string; fill: string; dot: string; borderSize: number; dotRadius?: number; /** A half mark: which half of the inside is filled, and with what. */ half?: { side: "left" | "right"; color: string } };

const FILL_BAND = 0.55; // the fill layer's width as a share of the radius, as in the map's node program

/** Sizes of the three circles for a node of radius `r`: the whole node, inside the ring, and the centre dot. */
export function bubbleLayers(r: number, borderSize: number, dotRadius?: number) {
  const inner = Math.max(0, r - borderSize);
  return { outer: r, inner, dot: Math.max(0, Math.min(inner, dotRadius ?? inner - FILL_BAND * r)) };
}

/**
 * The bubble for a station of the SVG map: where it is (its circle's rect on screen), and how it is drawn (the circle's
 * computed paint, so a theme and a state are copied as they are). The ring's outer radius is the circle's radius plus
 * half its stroke; the centre dot is `dotRadius` (unread and read stations have none: it takes the fill colour).
 */
export function stationSpec(
  rect: { left: number; top: number; width: number; height: number },
  paint: { stroke: string; fill: string; strokeWidth: number; dot: string; dotRadius: number },
  half?: BubbleSpec["half"],
): BubbleSpec {
  const r = rect.width / 2 + paint.strokeWidth / 2;
  const hasDot = paint.dot !== "none" && paint.dot !== "";
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    r,
    border: paint.stroke,
    fill: paint.fill,
    dot: hasDot ? paint.dot : paint.fill,
    borderSize: paint.strokeWidth,
    dotRadius: hasDot ? paint.dotRadius : 0,
    ...(half && { half }),
  };
}

type Bubble = {
  /** Set the size as a multiple of the node. The element animates there by its CSS transition. */
  scaleTo: (k: number) => void;
  /** Swap the class: "" (the continuous growth), "is-waiting" (breathing, the page is still loading) or "is-bursting". */
  mode: (m: "" | "is-waiting" | "is-bursting") => void;
  fadeOut: () => void;
  remove: () => void;
  el: HTMLElement;
};

/** Remove every bubble, shock ring and screen: when a page is restored from the back/forward cache, and on leaving the map. */
export function removeBubbles() {
  document.querySelectorAll(".node-bubble, .node-burst, .node-curtain").forEach((el) => el.remove());
}

/**
 * Put a copy of the node over the node. It is built at its largest size (SWELL_SCALE times the node) and scaled DOWN
 * to the node's size to start, so every later size is a transform up from a crisp full-resolution layer: no blur, no
 * layout, compositor only. It starts exactly over the node, so nothing flashes.
 */
export function growBubble(spec: BubbleSpec): Bubble {
  const el = document.createElement("div");
  el.className = "node-bubble";
  el.setAttribute("aria-hidden", "true");
  const big = (n: number) => n * SWELL_SCALE;
  const { outer, inner, dot } = bubbleLayers(spec.r, spec.borderSize, spec.dotRadius);
  el.style.cssText = `left:${spec.x - big(outer)}px;top:${spec.y - big(outer)}px;width:${big(outer) * 2}px;height:${big(outer) * 2}px;transform:scale(${1 / SWELL_SCALE})`;
  const circle = (size: number, color: string) => {
    const c = document.createElement("span");
    c.style.cssText = `width:${big(size) * 2}px;height:${big(size) * 2}px;margin:${-big(size)}px 0 0 ${-big(size)}px;background:${color}`;
    return c;
  };
  const layers = [circle(outer, spec.border), circle(inner, spec.fill)];
  if (spec.half) {
    const h = circle(inner, spec.half.color);
    h.style.cssText += `;clip-path:inset(0 ${spec.half.side === "left" ? "50% 0 0" : "0 0 50%"})`; // the half disc, as the map draws it
    layers.push(h);
  }
  el.append(...layers, circle(dot, spec.dot));
  document.body.append(el);
  el.getBoundingClientRect(); // commit the starting frame before the transition begins
  return {
    el,
    scaleTo: (k) => (el.style.transform = `scale(${k / SWELL_SCALE})`),
    mode: (m) => (el.className = `node-bubble ${m}`.trim()),
    fadeOut: () => (el.style.opacity = "0"),
    remove: () => el.remove(),
  };
}

/** Resolve when `el` finishes a transition, or after `ms` if it never does (a hidden tab). */
function transitionEnd(el: Element, ms: number) {
  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    el.addEventListener(
      "transitionend",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/** The longest the opening may hold the screen, whatever the page does. */
export const SAFETY_MS = 6000;

/**
 * The growth lasts three base durations on one easing. Its speed peaks about halfway, so the burst starts at 55% of it:
 * at near top speed, and the pop carries on from there. A slow page can keep the bubble growing until the growth ends.
 */
export const GROWTH_MS = DURATION.base * 3;
export const BURST_AT_MS = GROWTH_MS * 0.55;

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * Play the whole transition: roughly 530 milliseconds, plus whatever the page swap needs beyond that.
 * - The bubble grows in ONE continuous motion (three base durations, a single easing, so its speed never drops to zero
 *   partway), while a screen in the page colour fades in over the map in the first base duration.
 * - Once the screen is fully in, `navigate` loads the topic behind it. The page swap can hold the main thread for a
 *   moment; nothing visible waits for it, because the growth runs on the compositor.
 * - The burst starts at 55% of the growth, when the bubble is at its fastest, once the page has arrived: it goes outward
 *   and fades (one fast duration), a thin shock ring flies past it, and the screen fades out (one base duration) to
 *   show the topic. If the page is slower than that, the bubble keeps growing, then breathes: it is the page loader.
 * Only transform and opacity are animated. `cancel` removes everything at once.
 */
export function playNodeOpen(spec: BubbleSpec, navigate: () => Promise<void>): { cancel: () => void; isActive: () => boolean } {
  let cancelled = false;
  const curtain = document.createElement("div");
  curtain.className = "node-curtain";
  curtain.setAttribute("aria-hidden", "true");
  document.body.append(curtain);
  const bubble = growBubble(spec); // appended after the screen, so it sits above it
  let shock: HTMLElement | null = null;
  let safety = 0;
  const cancel = () => {
    cancelled = true;
    window.clearTimeout(safety);
    bubble.remove();
    shock?.remove();
    curtain.remove();
  };
  safety = window.setTimeout(cancel, SAFETY_MS);
  let bursting = false;
  const burstTime = sleep(BURST_AT_MS);
  curtain.getBoundingClientRect();
  curtain.style.opacity = "1";
  bubble.scaleTo(SWELL_SCALE);
  // The bubble is the loading indicator. If the page is slow and the growth has run out, it breathes until the page arrives.
  void transitionEnd(bubble.el, GROWTH_MS + 60).then(() => {
    if (!cancelled && !bursting) bubble.mode("is-waiting");
  });
  void (async () => {
    // the screen is fully in: the page can load behind it
    await transitionEnd(curtain, DURATION.base + 60);
    if (cancelled) return;
    await Promise.all([navigate(), burstTime]);
    if (cancelled) return;
    // burst, and reveal the topic
    bursting = true;
    shock = document.createElement("div");
    shock.className = "node-burst";
    shock.setAttribute("aria-hidden", "true");
    const full = bubbleLayers(spec.r, spec.borderSize, spec.dotRadius).outer * SWELL_SCALE;
    shock.style.cssText = `left:${spec.x - full}px;top:${spec.y - full}px;width:${full * 2}px;height:${full * 2}px;border-color:${spec.border}`;
    document.body.append(shock);
    shock.getBoundingClientRect();
    const ended = transitionEnd(curtain, DURATION.base + 60);
    bubble.mode("is-bursting");
    bubble.scaleTo(BURST_SCALE);
    bubble.fadeOut();
    shock.style.transform = `scale(${SHOCK_SCALE})`;
    shock.style.opacity = "0";
    curtain.style.opacity = "0";
    await ended;
    cancel();
  })();
  return { cancel, isActive: () => !cancelled };
}
