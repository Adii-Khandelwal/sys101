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

/** Rows the stage must hold: the tallest column, or the number of layers when stacked. */
export function rowCount(cols: Node[][], orientation: Orientation) {
  return orientation === "horizontal" ? Math.max(1, ...cols.map((c) => c.length)) : cols.length;
}

/**
 * Pixel positions that fill a `width` x `height` box (the stage minus its
 * padding). Horizontal: columns run left to right, leaving `labelRoom` on the
 * right for the last column's labels. Vertical (narrow screens): the same
 * columns stacked top to bottom, each spread across the width. Sigma's y axis
 * points up, so the first row gets the largest y.
 */
export function fitPositions(
  cols: Node[][],
  orientation: Orientation,
  box: { width: number; height: number; labelRoom: number },
) {
  const { width, height, labelRoom } = box;
  const across = Math.max(0, width - labelRoom); // width available to node centres
  const spread = (i: number, n: number, span: number) => (n > 1 ? (i * span) / (n - 1) : span / 2);
  const positions = new Map<string, { x: number; y: number }>();

  if (orientation === "horizontal") {
    const rows = rowCount(cols, orientation);
    cols.forEach((col, c) => {
      // Centre a short column within the tallest one, on the same row grid.
      const first = (rows - col.length) / 2;
      col.forEach((n, i) => {
        positions.set(n.slug, {
          x: spread(c, cols.length, across),
          y: height - spread(first + i, rows, height),
        });
      });
    });
  } else {
    cols.forEach((col, r) => {
      col.forEach((n, i) => {
        positions.set(n.slug, {
          x: spread(i, col.length, across),
          y: height - spread(r, cols.length, height),
        });
      });
    });
  }
  return positions;
}
