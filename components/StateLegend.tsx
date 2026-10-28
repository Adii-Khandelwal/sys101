type State = "unread" | "ready" | "progress" | "read";

/** Legend icons drawn like the nodes: thin ring, thick ring with a centre dot, filled orange. */
function LegendMark({ state }: { state: State }) {
  return (
    <svg className="legend-mark" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      {state === "read" ? (
        <circle cx="8" cy="8" r="7" fill="var(--accent)" />
      ) : state === "progress" ? (
        <circle cx="8" cy="8" r="5.5" fill="var(--paper)" stroke="var(--accent)" strokeWidth="3" />
      ) : (
        <circle cx="8" cy="8" r={state === "ready" ? 5.5 : 6.25} fill="var(--paper)" stroke="var(--ink-soft)" strokeWidth={state === "ready" ? 3 : 1.5} />
      )}
      {state === "ready" && <circle cx="8" cy="8" r="1.6" fill="var(--ink-soft)" />}
      {state === "progress" && <circle cx="8" cy="8" r="1.6" fill="var(--accent)" />}
    </svg>
  );
}

/** The four states, shown the same way above the map and above the Path list. */
export default function StateLegend() {
  return (
    <p className="graph-legend label" data-tour="states">
      <span className="legend-item">
        <LegendMark state="unread" /> Unread
      </span>
      <span className="legend-item">
        <LegendMark state="ready" /> Ready
      </span>
      <span className="legend-break" aria-hidden="true" />
      <span className="legend-item">
        <LegendMark state="progress" /> In progress
      </span>
      <span className="legend-item">
        <LegendMark state="read" /> Read
      </span>
    </p>
  );
}
