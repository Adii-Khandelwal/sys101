"use client";

import { useState } from "react";
import { bucketLast, bucketState, type BucketInputs } from "@/lib/tokenBucket";
import type { FigureText } from "@/lib/figures";
import { FigureFrame, Solid, StepControls, stepKeys } from "./parts";
import type { BucketGeometry } from "./tokenBucket/geometry";

const px = ([x, y]: [number, number]) => `translate(${x}px, ${y}px)`;

// `uid` comes from the post id, not useId: the lazy wrapper moves the tree, and useId then differs between server and client.
export default function TokenBucketLive({ uid, geo, inputs, text }: { uid: string; geo: BucketGeometry; inputs: BucketInputs; text: FigureText }) {
  const [step, setStep] = useState(0);
  const at = Math.min(step, bucketLast);
  const s = bucketState(inputs, at);

  // Fixed painter's order; steps only change opacity and the barrier's lift.
  const svg = (
    <>
      {geo.back.map((p) => (
        <Solid key={p.name} b={p.box} />
      ))}
      {geo.tokens.map((t, k) => (
        <g key={t.name} className="fig-fade" style={{ opacity: k < s.tokens ? 1 : 0 }}>
          <Solid b={t.box} className={k >= s.tokens - s.arrived && k < s.tokens ? "fig-lit" : undefined} />
        </g>
      ))}
      {geo.lips.map((p) => (
        <Solid key={p.name} b={p.box} />
      ))}
      {geo.debt.map((d, k) => (
        <g key={d.name} className="fig-fade" style={{ opacity: k < s.debt ? 1 : 0 }}>
          <Solid b={d.box} className="fig-hollow" />
        </g>
      ))}
      <g className="fig-move" style={{ transform: s.rejecting ? "translate(0px, 0px)" : px(geo.lift) }}>
        <Solid b={geo.bar} />
      </g>
      <Solid b={geo.postR.box} />
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
      onKeyDown={stepKeys(at, bucketLast, setStep)}
      svg={svg}
      readout={
        <>
          <span className="label">
            Step {at + 1} of {bucketLast + 1}
          </span>
          <p className="fig-line">{s.headline}</p>
          <p className="fig-formula">{s.readout}</p>
        </>
      }
      controls={<StepControls step={at} last={bucketLast} setStep={setStep} reset={() => setStep(0)} />}
    />
  );
}
