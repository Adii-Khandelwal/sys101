// Pure pieces of the homepage graph's hover and focus behaviour.

export const INK = "#1f1b16";
export const INK_SOFT = "#5c5346";
export const EDGE = "#8a7f6c";
export const PAPER = "#f3ecdc";
export const ACCENT = "#9a3b1f";
const ACCENT_DARK = "#7a2c15";

/** Unrelated nodes and edges keep 60% of their colour while a node is highlighted. */
const FADE = 0.6;
/** Faded labels use the secondary ink, which keeps WCAG AA contrast on the paper colour. */
export const FADED_LABEL = INK_SOFT;

/** The map's palette. Defaults are the light theme; readThemeColors() reads the live CSS vars. */
export type ThemeColors = {
  ink: string;
  inkSoft: string;
  edge: string;
  paper: string;
  accent: string;
  accentDark: string;
};

export const LIGHT_COLORS: ThemeColors = { ink: INK, inkSoft: INK_SOFT, edge: EDGE, paper: PAPER, accent: ACCENT, accentDark: ACCENT_DARK };

/**
 * The current theme's map colours, read from the CSS custom properties so the
 * Sigma canvas (which cannot use CSS) matches the themed page. Falls back to the
 * light constants on the server or before styles resolve. --accent-dark is
 * derived if the theme does not define it.
 */
export function readThemeColors(): ThemeColors {
  if (typeof window === "undefined") return LIGHT_COLORS;
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => {
    const raw = s.getPropertyValue(name).trim();
    return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
  };
  const accent = v("--accent", ACCENT);
  return {
    ink: v("--ink", INK),
    inkSoft: v("--ink-soft", INK_SOFT),
    edge: v("--edge", EDGE),
    paper: v("--paper", PAPER),
    accent,
    accentDark: v("--accent-dark", darken(accent)),
  };
}

/** A slightly darker shade of a hex colour, for the pressed/active rust outline. */
function darken(hex: string, amount = 0.82) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * amount);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

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
 * opens the topic (CLAUDE.md, Graph and Touch).
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


type LabelNode = { x: number; y: number; r: number };
type LabelSpot = { x: number; y: number };

/**
 * Where a group label may sit, best first. Every label is placed the same way, relative to its
 * first node: on a horizontal map, directly above it with the label's left edge on the node's left
 * edge, else directly below it the same way. A stacked map has no room above or below a row, so the
 * label goes right of the node's own label. Left of the node and right of its label are last
 * resorts. A label is never pinned to the stage edge.
 */
export function groupLabelSpots(first: LabelNode, labelWidth: number, firstTitleWidth: number, stacked: boolean): LabelSpot[] {
  // 28 above and 8 below clear the ring by a few px even for descenders (g, y) in the serif label.
  const above = { x: first.x - first.r, y: first.y - first.r - 28 };
  const below = { x: first.x - first.r, y: first.y + first.r + 8 };
  const left = { x: first.x - first.r - labelWidth - 8, y: first.y - 8 };
  const right = { x: first.x + first.r + 8 + firstTitleWidth + 16, y: first.y - 8 };
  return stacked ? [right, above, below, left] : [above, below, left, right];
}

/** The first spot that is on the stage and not blocked; else the first spot. */
export function placeGroupLabel(spots: LabelSpot[], fits: (s: LabelSpot) => boolean, blocked: (s: LabelSpot) => boolean) {
  return spots.find((s) => fits(s) && !blocked(s)) ?? spots[0];
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
