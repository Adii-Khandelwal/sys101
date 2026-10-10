// Layered layout for the prerequisite graph. Pure functions, shared by the
// server (to order the index) and the client (to place nodes), so the index
// numbering always matches the order of the map.

type Node = { slug: string; title: string };
type Edge = { from: string; to: string };

/** A topic's depth is the length of its longest prerequisite chain. */
export function depths(nodes: Node[], edges: Edge[]) {
  const prereqs = new Map(nodes.map((n) => [n.slug, [] as string[]]));
  for (const e of edges) if (prereqs.has(e.from)) prereqs.get(e.to)?.push(e.from);

  const depth = new Map<string, number>();
  const visit = (slug: string, seen: Set<string>): number => {
    if (depth.has(slug)) return depth.get(slug)!;
    if (seen.has(slug)) return 0; // cycle guard
    seen.add(slug);
    const parents = prereqs.get(slug) ?? [];
    const d = parents.length ? 1 + Math.max(...parents.map((p) => visit(p, seen))) : 0;
    depth.set(slug, d);
    return d;
  };
  nodes.forEach((n) => visit(n.slug, new Set()));
  return depth;
}

/**
 * Nodes grouped into columns by depth. Within a column, nodes are ordered by
 * the average position of their prerequisites in earlier columns (fewer edge
 * crossings), then by title, so the result is the same on every load.
 */
export function columns<T extends Node>(nodes: T[], edges: Edge[]): T[][] {
  const depth = depths(nodes, edges);
  const cols: T[][] = [];
  for (const n of nodes) (cols[depth.get(n.slug)!] ??= []).push(n);

  const rank = new Map<string, number>();
  return cols.map((col) => {
    const score = (n: T) => {
      const parents = edges.filter((e) => e.to === n.slug && rank.has(e.from)).map((e) => rank.get(e.from)!);
      return parents.length ? parents.reduce((a, b) => a + b, 0) / parents.length : 0;
    };
    const sorted = [...col].sort((a, b) => score(a) - score(b) || a.title.localeCompare(b.title));
    sorted.forEach((n, i) => rank.set(n.slug, i));
    return sorted;
  });
}

export type Orientation = "horizontal" | "vertical";

/**
 * Graph coordinates for each node. Horizontal: columns run left to right.
 * Vertical (narrow screens): the same columns stacked top to bottom.
 * Sigma's y axis points up, so earlier rows get larger y.
 */
export function layeredPositions(cols: Node[][], orientation: Orientation) {
  const positions = new Map<string, { x: number; y: number }>();
  cols.forEach((col, depth) => {
    col.forEach((n, i) => {
      const offset = i - (col.length - 1) / 2;
      positions.set(
        n.slug,
        orientation === "horizontal" ? { x: depth, y: -offset * 0.7 } : { x: offset * 1.2, y: -depth },
      );
    });
  });
  return positions;
}
