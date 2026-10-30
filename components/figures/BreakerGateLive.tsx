"use client";

import { useState } from "react";
import { breakerLast, breakerState, type BreakerInputs } from "@/lib/breakerGate";
import type { FigureText } from "@/lib/figures";
import { FigureFrame, Solid, StepControls, stepKeys } from "./parts";
import { BAR_LIFT, raised, shift, xOf, type BreakerGeometry } from "./breakerGate/geometry";

const px = ([x, y]: [number, number]) => `translate(${x}px, ${y}px)`;

// `uid` comes from the post id, not useId: the lazy wrapper moves the tree, and useId then differs between server and client.
export default function BreakerGateLive({ uid, geo, inputs, text }: { uid: string; geo: BreakerGeometry; inputs: BreakerInputs; text: FigureText }) {
  const [step, setStep] = useState(0);
  const at = Math.min(step, breakerLast);
  const s = breakerState(inputs, at);
  const up = raised(s.gate);

  const svg = (
    <>
      {geo.base.map((p) => (
        <Solid key={p.name} b={p.box} />
      ))}
      {geo.items.map((it) => {
        if (it.kind === "fixed") return <Solid key={it.id} b={it.box} />;
        if (it.kind === "lamp") return <Solid key={it.id} b={it.box} className={it.gate === s.gate ? "fig-lit" : undefined} />;
        if (it.kind === "bar")
          return (
            <g key={it.id} className="fig-move" style={{ transform: px(shift(0, 0, up[it.bar] ? BAR_LIFT : 0)) }}>
              <Solid b={it.box} />
            </g>
          );
        const r = s.reqs.find((x) => x.lane === it.lane && x.j === it.j)!;
        return (
          <g key={it.id} className="fig-move fig-fade" style={{ transform: px(shift(xOf(r.zone, r.j) - xOf("wait", r.j))), opacity: r.visible ? 1 : 0 }}>
            <Solid b={it.box} className={r.lit ? "fig-lit" : r.zone === "wait" ? "fig-hollow" : undefined} />
          </g>
        );
      })}
    </>
  );

  return (
    <FigureFrame
      uid={uid}
      viewBox={geo.viewBox}
      title={text.title}
      description={text.description}
      legend={text.legend}
      caption={text.caption}
      onKeyDown={stepKeys(at, breakerLast, setStep)}
      svg={svg}
      readout={
        <>
          <span className="label">
            Step {at + 1} of {breakerLast + 1}
          </span>
          <p className="fig-line">{s.headline}</p>
          <p className="fig-formula">{s.readout}</p>
        </>
      }
      controls={<StepControls step={at} last={breakerLast} setStep={setStep} reset={() => setStep(0)} />}
    />
  );
}
