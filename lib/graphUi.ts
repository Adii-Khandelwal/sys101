// Pure pieces of the homepage graph's hover and focus behaviour.

export const INK = "#1b2a6b";
export const INK_SOFT = "#505b8a";
export const EDGE = "#767d9b";
export const PAPER = "#e6e2d6";
export const ACCENT = "#aa3012";

/** Unrelated nodes and edges keep 60% of their colour while a node is highlighted. */
const FADE = 0.6;
/** Blend `hex` toward `paper`, keeping `amount` of the original. */
export function fadeTo(hex: string, paper: string, amount = FADE) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(paper.slice(1), 16);
  const ch = (v: number, s: number) => (v >> s) & 255;
  const mix = (s: number) => Math.round(ch(a, s) * amount + ch(b, s) * (1 - amount));
  return `#${((mix(16) << 16) | (mix(8) << 8) | mix(0)).toString(16).padStart(6, "0")}`;
}

/** Blend `hex` toward the (light) paper colour, keeping `amount` of the original. */
export function fade(hex: string, amount = FADE) {
  return fadeTo(hex, PAPER, amount);
}

/** WCAG contrast ratio between two hex colours. */
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const c = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255);
    const [r, g, bl] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/**
 * The node's prerequisite chain (all ancestors), the node and its direct
 * dependents: everything that stays fully opaque while it is highlighted.
 */
export function highlightSet(node: string, edges: { from: string; to: string }[]) {
  const keep = new Set([node]);
  const stack = [node];
  while (stack.length) {
    const n = stack.pop()!;
    for (const e of edges) {
      if (e.to === n && !keep.has(e.from)) {
        keep.add(e.from);
        stack.push(e.from);
      }
    }
  }
  for (const e of edges) if (e.from === node) keep.add(e.to);
  return keep;
}

/** The slugs of every node in a group: everything that stays opaque when the group is highlighted. */
export function groupSet(group: string, nodes: { slug: string; group?: string }[]) {
  return new Set(nodes.filter((n) => n.group === group).map((n) => n.slug));
}

/**
 * Below this many topics the map is a fixed, fitted picture: no zoom, pan or map controls.
 * Lowered from 25 to 12 when the twelfth topic's long label made the map need a wider stage than
 * a 1280px screen gives it: zoom and pan switch on earlier instead of squeezing the layout.
 */
export const INTERACTIVE_MIN_NODES = 12;
export const mapIsInteractive = (nodeCount: number) => nodeCount >= INTERACTIVE_MIN_NODES;

/**
 * Whether the map should be interactive (zoom and pan) right now. Needs both
 * enough nodes to justify it and a non-phone viewport: a phone always gets a
 * fixed, non-interactive map so a finger scrolls the page past it and a tap
 * opens the topic (.claude/rules/graph.md, Graph and Touch).
 */
export const mapIsInteractiveAt = (nodeCount: number, isPhone: boolean) => mapIsInteractive(nodeCount) && !isPhone;

export type HighlightEvent =
  | { type: "enter"; node: string }
  | { type: "focus"; node: string }
  | { type: "leave" }
  | { type: "blur" }
  | { type: "escape" }
  | { type: "touchOutside" }
  | { type: "scroll" }
  | { type: "camera" };

/** Which node is highlighted after an event. Everything but enter and focus clears it. */
export function nextHighlight(_current: string | null, event: HighlightEvent): string | null {
  return event.type === "enter" || event.type === "focus" ? event.node : null;
}

/**
 * Viewport position for a tooltip of size w x h describing a node at (x, y)
 * with radius r. Prefers above the node, flips below when there is no room,
 * never overlaps the node, and stays at least `margin` px inside the viewport.
 */
export function placeTooltip(
  node: { x: number; y: number; r: number },
  tip: { w: number; h: number },
  view: { w: number; h: number },
  margin = 8,
  gap = 8,
) {
  const above = node.y - node.r - gap - tip.h;
  const below = node.y + node.r + gap;
  const fitsAbove = above >= margin;
  const fitsBelow = below + tip.h <= view.h - margin;
  const placement = fitsAbove || !fitsBelow && node.y - margin > view.h - node.y - margin ? "above" : "below";
  const top = placement === "above" ? above : below;
  const left = Math.min(Math.max(node.x - tip.w / 2, margin), Math.max(margin, view.w - margin - tip.w));
  return { left, top, placement };
}


/**
 * The prerequisite lines in a map tooltip. `finish` names what is still unread. `builtOn` lists all prerequisites, and
 * is left out only when it would repeat `finish` word for word (nothing read yet).
 */
export function prerequisiteLines(prerequisites: string[], read: readonly string[], titleOf: (slug: string) => string) {
  const pending = prerequisites.filter((q) => !read.includes(q));
  return {
    builtOn: prerequisites.length > 0 && pending.length < prerequisites.length ? `Builds on: ${prerequisites.map(titleOf).join(", ")}` : null,
    // Three or more are joined by commas only: a title may itself contain "and".
    finish: pending.length > 0 ? `Finish ${pending.map(titleOf).join(pending.length === 2 ? " and " : ", ")} first.` : null,
  };
}

type Pt = { x: number; y: number };

/**
 * One drawn edge in screen pixels: a quadratic curve from `a` to `b` through `ctrl`, trimmed to the node rims (radius `r`),
 * plus an arrowhead (a triangle, 7 wide per unit of `width`, 5 across) whose tip touches the target's rim.
 */
export function edgeShape(a: Pt, ctrl: Pt, b: Pt, r: number, width = 1, arrow = true) {
  const unit = (f: Pt, t: Pt) => {
    const l = Math.hypot(t.x - f.x, t.y - f.y) || 1;
    return { x: (t.x - f.x) / l, y: (t.y - f.y) / l };
  };
  const d0 = unit(a, ctrl);
  const d1 = unit(ctrl, b);
  const len = arrow ? 7 * width : 0;
  const start = { x: a.x + d0.x * r, y: a.y + d0.y * r };
  const tip = { x: b.x - d1.x * r, y: b.y - d1.y * r };
  const base = { x: tip.x - d1.x * len, y: tip.y - d1.y * len };
  const half = 2.5 * width;
  const f = (n: number) => Math.round(n * 100) / 100;
  return {
    d: `M${f(start.x)},${f(start.y)} Q${f(ctrl.x)},${f(ctrl.y)} ${f(base.x)},${f(base.y)}`,
    head: `${f(tip.x)},${f(tip.y)} ${f(base.x - d1.y * half)},${f(base.y + d1.x * half)} ${f(base.x + d1.y * half)},${f(base.y - d1.x * half)}`,
  };
}
