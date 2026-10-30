// Model and wording of the consistent-hash ring (Cloudflare 2026, pingora-ketama). Pure.
// The post gives the rule (a key belongs to the first server to the left on the number line, the last range
// wraps round), the idea of giving each server several points, and the measured spread. The ring below
// (36 cells, seven keys, servers A to D) is a drawn example of that rule, not data from the post.
import type { FigureSource } from "./figures";

/** spreadOne, spreadMany: load variation in percent across `servers` servers with 1 point each and `points` points each. */
export type RingInputs = { spreadOne: number; points: number; spreadMany: number; servers: number };
export const ringValid = (i: RingInputs) => i.servers > 1 && i.points > 1 && i.spreadOne > i.spreadMany && i.spreadMany > 0;

export const RING_CELLS = 36;
export const RING_STEPS = 3;
export const SERVER_IDS = ["A", "B", "C", "D"] as const;
export type ServerId = (typeof SERVER_IDS)[number];
/** Cells of the ring that hold keys t to z. */
export const KEYS = [
  { name: "t", cell: 0 },
  { name: "u", cell: 5 },
  { name: "v", cell: 10 },
  { name: "w", cell: 17 },
  { name: "x", cell: 22 },
  { name: "y", cell: 24 },
  { name: "z", cell: 31 },
];
/** Server points for one point each, and for the post's example of adding two more hashes per server (three each). */
export const POINTS: Record<"one" | "many", Record<ServerId, number[]>> = {
  one: { A: [2], B: [14], C: [26], D: [20] },
  many: { A: [2, 12, 28], B: [14, 21, 34], C: [8, 18, 26], D: [16, 23, 32] },
};
/** Servers on the ring at each step: start, D joins, A leaves. */
export const PRESENT: ServerId[][] = [["A", "B", "C"], ["A", "B", "C", "D"], ["B", "C", "D"]];

export const ringLast = RING_STEPS - 1;

type Pt = { cell: number; server: ServerId };

/** The server that owns a cell: the nearest point at or before it, wrapping past cell 0 to the last point. */
export function ownerAt(points: Pt[], cell: number): ServerId {
  const before = points.filter((p) => p.cell <= cell);
  const pool = before.length ? before : points;
  return pool.reduce((a, b) => (b.cell > a.cell ? b : a)).server;
}

export type RingState = {
  present: ServerId[];
  /** Every point on the ring at this step. */
  points: Pt[];
  /** Owner of each of the ring's cells. */
  cellOwner: ServerId[];
  owners: { name: string; cell: number; server: ServerId; moved: boolean }[];
  movedNames: string[];
  headline: string;
  readout: string;
  spread: string;
};

const ownersAt = (m: "one" | "many", step: number) => {
  const points = PRESENT[step].flatMap((s) => POINTS[m][s].map((cell) => ({ cell, server: s })));
  return { points, owner: (cell: number) => ownerAt(points, cell) };
};

export function ringState(i: RingInputs, many: boolean, step: number): RingState {
  const m = many ? "many" : "one";
  const at = Math.min(Math.max(step, 0), RING_STEPS - 1);
  const now = ownersAt(m, at);
  const before = ownersAt(m, Math.max(at - 1, 0));
  const owners = KEYS.map((k) => {
    const server = now.owner(k.cell);
    return { ...k, server, moved: at > 0 && before.owner(k.cell) !== server };
  });
  const movedNames = owners.filter((o) => o.moved).map((o) => o.name);
  const rest = KEYS.length - movedNames.length;
  const list = movedNames.join(", ");
  const n = movedNames.length;
  const keys = (c: number) => (c === 1 ? "1 key" : `${c} keys`);
  const headline =
    at === 0
      ? `Servers A, B and C are on the ring${many ? ", three points each" : ", one point each"}. Each key belongs to the first server point before it, counting back round the ring.`
      : at === 1
        ? `Server D joins. ${keys(n)} (${list}) moved, all to D, and the other ${rest} stayed put.`
        : `Server A leaves. Its ${keys(n)} (${list}) went to the nearest server point before each, and the other ${rest} stayed put.`;
  const readout = `${owners.map((o) => `${o.name} on ${o.server}`).join("; ")}; moved this step: ${n ? list : "none"}`;
  const spread = `Across ${i.servers} servers the post measures the variation in load at about ${i.spreadOne}% with one point each and about ${i.spreadMany}% with ${i.points} points each, the default in NGINX and Pingora.`;
  return { present: PRESENT[at], points: now.points, cellOwner: Array.from({ length: RING_CELLS }, (_, c) => now.owner(c)), owners, movedNames, headline, readout, spread };
}

export function ringText(i: RingInputs, src: FigureSource) {
  return {
    title: "Consistent hash ring",
    description: `A square track stands for the hash ring, with 36 cells counted clockwise. Tall posts mark server points and small cubes are the keys t to z. A key belongs to the first server point before it, counting back round the ring. The stretch of track after a post rises to that server's height, so ownership can be read from the surface. When server D is added, only the cells between D's points and the next point change height and only the keys on them move. When server A is removed, only its own stretches drop to the server before them. A switch gives each server one point or three.`,
    legend: [
      `Square track: the ring, laid flat as a loop. Positions run clockwise and the last cell joins the first, so the stretch before the first post belongs to the last server.`,
      `Posts: server points. Taller posts are later servers (A shortest, D tallest). The track after a post rises to the same step, up to the next post.`,
      `Small cubes: keys t to z, riding on the track. A lit cube moved to a different server in this step.`,
    ],
    caption: `Figure from ${src.company} ${src.year} (${src.postId}). The lookup rule, the wrap-around and the idea of several points per server follow the post, which uses 160 points per server by default. That only a neighbouring stretch changes hands when a server joins or leaves follows from that rule, and the post says only that no large change is needed. The cell positions, the seven keys and the three-point case are drawn for the example and are not figures from the post.`,
  };
}
