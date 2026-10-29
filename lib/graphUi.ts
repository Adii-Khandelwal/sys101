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

export type HighlightEvent =
  | { type: "enter"; node: string }
  | { type: "focus"; node: string }
  | { type: "leave" }
  | { type: "blur" }
  | { type: "escape" }
  | { type: "touchOutside" }
  | { type: "scroll" };

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
    builtOn: prerequisites.length > 0 && pending.length < prerequisites.length ? `Read first: ${prerequisites.map(titleOf).join(", ")}` : null,
    // Three or more are joined by commas only: a title may itself contain "and".
    finish: pending.length > 0 ? `Finish ${pending.map(titleOf).join(pending.length === 2 ? " and " : ", ")} first.` : null,
  };
}

/**
 * Which station an arrow key moves keyboard focus to, or null. Left goes to a prerequisite and right to a topic that builds
 * on this one (the nearest by height when there are several); up and down go to the station above or below in the same
 * column. `px` are stage positions (y down) and `edges` the drawn prerequisites.
 */
export function nextStation(
  key: string,
  slug: string,
  px: Map<string, { x: number; y: number }>,
  edges: { from: string; to: string }[],
): string | null {
  const here = px.get(slug);
  if (!here) return null;
  const nearest = (slugs: string[]) =>
    slugs.filter((s) => px.has(s)).sort((a, b) => Math.abs(px.get(a)!.y - here.y) - Math.abs(px.get(b)!.y - here.y) || a.localeCompare(b))[0] ?? null;
  if (key === "ArrowLeft") return nearest(edges.filter((e) => e.to === slug).map((e) => e.from));
  if (key === "ArrowRight") return nearest(edges.filter((e) => e.from === slug).map((e) => e.to));
  if (key !== "ArrowUp" && key !== "ArrowDown") return null;
  const column = [...px].filter(([, p]) => Math.abs(p.x - here.x) < 1).sort((a, b) => a[1].y - b[1].y);
  const i = column.findIndex(([s]) => s === slug);
  return column[i + (key === "ArrowDown" ? 1 : -1)]?.[0] ?? null;
}

/**
 * How far to scroll (in px, positive is right or down) so a point at `p` sits at least `before` px inside the low edge and
 * `after` px inside the high edge of the range [lo, hi]; 0 when it already does. For keyboard focus landing on a station
 * that is off screen.
 */
export function revealDelta(p: number, lo: number, hi: number, before = 40, after = 40) {
  if (p < lo + before) return p - (lo + before);
  if (p > hi - after) return p - (hi - after);
  return 0;
}
