import type { DesignRound } from "@/lib/design";

const ROWS = [
  { key: "ask", label: "The interviewer asks", shape: "" },
  { key: "say", label: "What you say", shape: "is-say" },
  { key: "tip", label: "Tip", shape: "is-tip" },
] as const;

/** The round box at the top of a section. Each row has a text label and a shape (hollow square, filled square, short rule), so no row rests on colour. */
export default function DesignRoundBox({ round }: { round: DesignRound }) {
  return (
    <dl className="design-round">
      {ROWS.map((r) => (
        <div key={r.key}>
          <dt className="label">
            <span className={r.shape ? `design-mark ${r.shape}` : "design-mark"} aria-hidden="true" />
            {r.label}
          </dt>
          <dd>{round[r.key]}</dd>
        </div>
      ))}
    </dl>
  );
}
