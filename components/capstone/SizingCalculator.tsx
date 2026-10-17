"use client";

import { useState } from "react";
import { evaluate, formatValue } from "@/lib/formula";
import type { Capstone } from "@/lib/capstones";
import { TOUCHED } from "@/lib/capstoneRail";
import { useStoredChoices } from "./useStoredChoices";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Sliders with number boxes for the inputs; every output recomputes on each change. Formulas run through lib/formula.ts, never eval. */
export default function SizingCalculator({ slug, sizing }: { slug: string; sizing: Capstone["sizing"] }) {
  const [picks, setPick] = useStoredChoices(slug);
  const touch = () => picks[TOUCHED.size] === 1 || setPick(TOUCHED.size, 1);
  const [text, setText] = useState<Record<string, string>>(() => Object.fromEntries(sizing.inputs.map((i) => [i.id, String(i.default)])));
  const values = Object.fromEntries(
    sizing.inputs.map((i) => {
      const n = Number(text[i.id]);
      return [i.id, text[i.id] === "" || !Number.isFinite(n) ? i.default : clamp(n, i.min, i.max)];
    }),
  );
  return (
    <div className="cap-sizing">
      <div className="cap-inputs">
        {sizing.inputs.map((i) => (
          <div key={i.id} className="cap-input">
            <label htmlFor={`size-${i.id}`}>{i.label}</label>
            <div className="cap-input-row">
              <input
                type="range"
                id={`size-${i.id}`}
                min={i.min}
                max={i.max}
                step={i.step}
                value={values[i.id]}
                onChange={(e) => {
                  touch();
                  setText({ ...text, [i.id]: e.target.value });
                }}
              />
              <input
                type="number"
                inputMode="decimal"
                aria-label={`${i.label}, exact value`}
                min={i.min}
                max={i.max}
                step={i.step}
                value={text[i.id]}
                onChange={(e) => {
                  touch();
                  setText({ ...text, [i.id]: e.target.value });
                }}
                onBlur={() => setText({ ...text, [i.id]: String(values[i.id]) })}
              />
              {i.unit && <span className="label">{i.unit}</span>}
            </div>
          </div>
        ))}
      </div>
      <dl className="cap-outputs" role="status" aria-label="Results">
        {sizing.outputs.map((o) => {
          let shown = "n/a";
          try {
            shown = formatValue(evaluate(o.formula, values));
          } catch {
            // The build already checked every formula; a runtime failure shows n/a.
          }
          return (
            <div key={o.label} className="cap-output">
              <dt className="label">{o.label}</dt>
              <dd>
                {shown}
                {o.unit && <span className="label"> {o.unit}</span>}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
