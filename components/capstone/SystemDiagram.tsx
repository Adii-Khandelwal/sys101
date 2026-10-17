"use client";

import Link from "next/link";
import CompanyLogo from "@/components/CompanyLogo";
import type { Capstone, NodeState } from "@/lib/capstones";

type Node = Capstone["diagram"]["nodes"][number];
type Props = {
  title: string;
  nodes: Node[];
  states: Record<string, NodeState>;
  selected: string | null;
  onSelect: (id: string | null) => void;
  topicTitles: Record<string, string>;
};

/** State is carried by the border shape and by the word, never by colour alone. */
export const STATE_WORD: Record<NodeState, string> = { ok: "working", degraded: "degraded", down: "down" };

const W = 200;
const H = 64;
const GAP_X = 48;
const GAP_Y = 48;
const COLS = 3;

const pos = (i: number) => ({ x: (i % COLS) * (W + GAP_X), y: Math.floor(i / COLS) * (H + GAP_Y) });

/** Where the line from box a's centre toward box b's centre leaves a's edge. */
function edgePoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.min(dx ? W / 2 / Math.abs(dx) : Infinity, dy ? H / 2 / Math.abs(dy) : Infinity);
  return { x: a.x + W / 2 + dx * t, y: a.y + H / 2 + dy * t };
}

/** Clickable parts. The drawing (from 768px up) is for pointers and hidden from assistive tech; the same parts as real buttons are always there for keyboard and screen readers. */
export default function SystemDiagram({ title, nodes, states, selected, onSelect, topicTitles }: Props) {
  const rows = Math.ceil(nodes.length / COLS);
  const width = Math.min(nodes.length, COLS) * W + (Math.min(nodes.length, COLS) - 1) * GAP_X;
  const height = rows * H + (rows - 1) * GAP_Y;
  const current = nodes.find((n) => n.id === selected) ?? null;
  const state = (id: string): NodeState => states[id] ?? "ok";
  const toggle = (id: string) => onSelect(selected === id ? null : id);

  return (
    <div className="cap-lab">
      <div className="cap-panel" aria-live="polite">
        {current ? (
          <>
            <p className="label">
              {STATE_WORD[state(current.id)]}
            </p>
            <h3>{current.label}</h3>
            <p className="cap-panel-company">
              <CompanyLogo name={current.company} size="sm" />
              <span>{current.company}</span>
            </p>
            <p>{current.tradeoff}</p>
            <p>
              <Link href={`/topic/${current.topic}`}>Topic: {topicTitles[current.topic] ?? current.topic}</Link>
            </p>
            <button type="button" className="cap-link label" onClick={() => onSelect(null)}>
              Close
            </button>
          </>
        ) : (
          <p className="cap-hint">Select a part to see its trade-off, the company that built it and the topic that teaches it.</p>
        )}
      </div>

      <div className="cap-diagram-wrap">
        <svg className="dg cap-svg" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {nodes.flatMap((n, i) =>
            (n.to ?? []).map((t) => {
              const j = nodes.findIndex((m) => m.id === t);
              const a = pos(i);
              const b = pos(j);
              const s = edgePoint(a, b);
              const e = edgePoint(b, a);
              const ang = Math.atan2(e.y - s.y, e.x - s.x);
              const head = [0, 1].map((k) => `${e.x - 9 * Math.cos(ang + (k ? 0.4 : -0.4))},${e.y - 9 * Math.sin(ang + (k ? 0.4 : -0.4))}`);
              return (
                <g key={`${n.id}-${t}`} aria-hidden="true">
                  <line className="dg-line" x1={s.x} y1={s.y} x2={e.x} y2={e.y} />
                  <polyline className="dg-head" points={`${head[0]} ${e.x},${e.y} ${head[1]}`} />
                </g>
              );
            }),
          )}
          {nodes.map((n, i) => {
            const { x, y } = pos(i);
            const st = state(n.id);
            return (
              <g
                key={n.id}
                className={`cap-node cap-node-${st}${selected === n.id ? " is-selected" : ""}`}
                onClick={() => toggle(n.id)}
              >
                <rect className="cap-node-box" x={x} y={y} width={W} height={H} />
                {st === "down" && <line className="cap-node-cross" x1={x} y1={y} x2={x + W} y2={y + H} />}
                <text className="dg-label" x={x + W / 2} y={y + 28} textAnchor="middle">
                  {n.label}
                </text>
                <text className="dg-note" x={x + W / 2} y={y + 48} textAnchor="middle">
                  {st === "ok" ? n.company : STATE_WORD[st]}
                </text>
              </g>
            );
          })}
        </svg>

        <ul className="cap-nodelist" aria-label={title}>
          {nodes.map((n) => {
            const st = state(n.id);
            return (
              <li key={n.id}>
                <button type="button" className={`cap-nodebtn cap-node-${st}`} aria-pressed={selected === n.id} onClick={() => toggle(n.id)}>
                  <span>{n.label}</span>
                  <span className="label">{st === "ok" ? n.company : STATE_WORD[st]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
