"use client";

import type { Capstone, NodeState } from "@/lib/capstones";
import { STATE_WORD } from "./SystemDiagram";

type Props = {
  failures: Capstone["diagram"]["failures"];
  nodes: Capstone["diagram"]["nodes"];
  active: string[];
  states: Record<string, NodeState>;
  onToggle: (id: string) => void;
  onReset: () => void;
};

/** Failure switches. The diagram above changes; this lists every affected part in words as well. */
export default function BreakIt({ failures, nodes, active, states, onToggle, onReset }: Props) {
  const hit = nodes.filter((n) => states[n.id] && states[n.id] !== "ok");
  return (
    <div className="cap-break">
      <ul className="cap-failures">
        {failures.map((f) => (
          <li key={f.id}>
            <button type="button" className="cap-option" aria-pressed={active.includes(f.id)} onClick={() => onToggle(f.id)}>
              <span className="cap-mark" aria-hidden="true" />
              <span>{f.label}</span>
              <span className="label cap-tag">{active.includes(f.id) ? "On" : "Off"}</span>
            </button>
          </li>
        ))}
      </ul>
      <div aria-live="polite" className="cap-effects">
        {hit.length === 0 ? (
          <p>Everything is working. Switch a failure on to see what it takes down.</p>
        ) : (
          <>
            <p className="label">
              {hit.length} {hit.length === 1 ? "part" : "parts"} affected
            </p>
            <ul>
              {hit.map((n) => (
                <li key={n.id}>
                  {n.label}: {STATE_WORD[states[n.id]]}
                </li>
              ))}
            </ul>
          </>
        )}
        {active.length > 0 && (
          <button type="button" className="cap-link label" onClick={onReset}>
            Switch all off
          </button>
        )}
      </div>
    </div>
  );
}
