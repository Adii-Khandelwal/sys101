import type { ReactNode } from "react";

/** One turn of the round. The speaker is named in words and by box shape (hollow for the interviewer, filled for you), never by colour alone. */
export default function DesignTurn({ who, children }: { who: "Interviewer" | "You"; children: ReactNode }) {
  return (
    <div className="design-turn">
      <p className="label design-who">
        <span className={who === "You" ? "cap-box is-done" : "cap-box"} aria-hidden="true" />
        {who}
      </p>
      <div className="design-said">{children}</div>
    </div>
  );
}
