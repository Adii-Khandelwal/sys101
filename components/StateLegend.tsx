type State = "unread" | "ready" | "progress" | "concept" | "posts" | "read";

/** Legend icons drawn like the nodes: thin ring, thick ring with a centre dot, filled orange. */
function LegendMark({ state }: { state: State }) {
  return (
    <svg className="legend-mark" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
      {state === "concept" || state === "posts" ? (
        <>
          <circle cx="8" cy="8" r="5.5" fill="var(--paper)" stroke="var(--accent)" strokeWidth="3" />
          <path d={state === "concept" ? "M8 2.5A5.5 5.5 0 0 0 8 13.5Z" : "M8 2.5A5.5 5.5 0 0 1 8 13.5Z"} fill="var(--accent)" />
        </>
      ) : state === "read" ? (
        <circle cx="8" cy="8" r="7" fill="var(--accent)" />
      ) : state === "progress" ? (
        <circle cx="8" cy="8" r="5.5" fill="var(--paper)" stroke="var(--accent)" strokeWidth="3" />
      ) : (
        <circle cx="8" cy="8" r={state === "ready" ? 5.5 : 6} fill="var(--paper)" stroke="var(--ink)" strokeWidth={state === "ready" ? 3 : 2} />
      )}
      {state === "ready" && <circle cx="8" cy="8" r="1.6" fill="var(--ink)" />}
      {state === "progress" && <circle cx="8" cy="8" r="1.6" fill="var(--accent)" />}
    </svg>
  );
}

/** The six states, shown the same way above the map and above the Path list. */
export default function StateLegend({ interchange = false }: { interchange?: boolean }) {
  return (
    <p className="graph-legend label" data-tour="states">
      <span className="legend-item">
        <LegendMark state="unread" /> unread
      </span>
      <span className="legend-item">
        <LegendMark state="ready" /> ready to read
      </span>
      <span className="legend-item">
        <LegendMark state="progress" /> in progress
      </span>
      <span className="legend-item">
        <LegendMark state="concept" /> concept read
      </span>
      <span className="legend-item">
        <LegendMark state="posts" /> posts read
      </span>
      <span className="legend-item">
        <LegendMark state="read" /> read
      </span>
      {interchange && (
        <span className="legend-item">
          <svg className="legend-mark" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
            <circle cx="8" cy="8" r="7" fill="none" stroke="var(--ink)" strokeWidth="1" />
          </svg>
          {"\u0020"}outer ring: joins two groups
        </span>
      )}
    </p>
  );
}
