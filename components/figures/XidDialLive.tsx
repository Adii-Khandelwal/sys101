"use client";

import { useState } from "react";
import { XID_LAST, xidState, type XidInputs } from "@/lib/xidDial";
import type { FigureText } from "@/lib/figures";
import { FigureFrame, Solid, StepControls, stepKeys } from "./parts";
import type { XidGeometry } from "./xidDial/geometry";

const px = ([x, y]: [number, number]) => `translate(${x}px, ${y}px)`;

// `uid` comes from the post id, not useId: the lazy wrapper moves the tree, and useId then differs between server and client.
export default function XidDialLive({ uid, geo, inputs, text }: { uid: string; geo: XidGeometry; inputs: XidInputs; text: FigureText }) {
  const [step, setStep] = useState(0);
  const at = Math.min(step, XID_LAST);
  const s = xidState(inputs, at);

  const svg = (
    <>
      {geo.back.map((p) => (
        <Solid key={p.name} b={p.box} />
      ))}
      <g className="fig-move" style={{ transform: px(geo.carShift[s.pos]) }}>
        <Solid b={geo.carriage} />
        <Solid b={geo.token} className="fig-lit" />
      </g>
      <g className="fig-fade" style={{ opacity: s.gate === "closed" ? 1 : 0 }}>
        <Solid b={geo.gateClosed} />
      </g>
      <g className="fig-fade" style={{ opacity: s.gate === "open" ? 1 : 0 }}>
        <Solid b={geo.gateOpen} />
      </g>
      {geo.front.map((p) => (
        <Solid key={p.name} b={p.box} />
      ))}
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
      onKeyDown={stepKeys(at, XID_LAST, setStep)}
      svg={svg}
      readout={
        <>
          <span className="label">
            Step {at + 1} of {XID_LAST + 1}
          </span>
          <p className="fig-line">{s.headline}</p>
          <p className="fig-formula">{s.readout}</p>
        </>
      }
      controls={<StepControls step={at} last={XID_LAST} setStep={setStep} reset={() => setStep(0)} />}
    />
  );
}
