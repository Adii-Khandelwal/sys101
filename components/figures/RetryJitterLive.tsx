"use client";

import { useState } from "react";
import { jitterLast, jitterState, type JitterInputs } from "@/lib/retryJitter";
import type { FigureText } from "@/lib/figures";
import { FigureFrame, Solid, StepControls, stepKeys } from "./parts";
import type { JitterGeometry } from "./retryJitter/geometry";

const px = ([x, y]: [number, number]) => `translate(${x}px, ${y}px)`;

// `uid` comes from the post id, not useId: the lazy wrapper moves the tree, and useId then differs between server and client.
export default function RetryJitterLive({ uid, geo, inputs, text }: { uid: string; geo: JitterGeometry; inputs: JitterInputs; text: FigureText }) {
  const [step, setStep] = useState(0);
  const [jitter, setJitter] = useState(false);
  const last = jitterLast(inputs);
  const at = Math.min(step, last);
  const s = jitterState(inputs, { jitter }, at);
  const shifts = jitter ? geo.jittered : geo.plain;

  const svg = (
    <>
      {geo.back.map((p) => (
        <Solid key={p.name} b={p.box} />
      ))}
      {geo.markers.map((b, c) => (
        <g key={c}>
          {Array.from({ length: inputs.retries + 1 }, (_, a) => (
            <g key={a} className="fig-move fig-fade" style={{ transform: px(shifts[c][a]), opacity: a <= at ? 1 : 0 }}>
              <Solid b={b} className={a === at ? "fig-lit" : "fig-hollow"} />
            </g>
          ))}
        </g>
      ))}
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
      onKeyDown={stepKeys(at, last, setStep)}
      svg={svg}
      readout={
        <>
          <span className="label">
            Step {at + 1} of {last + 1}
          </span>
          <p className="fig-line">{s.headline}</p>
          <p className="fig-formula">{s.readout}</p>
        </>
      }
      controls={
        <StepControls step={at} last={last} setStep={setStep} reset={() => (setStep(0), setJitter(false))}>
          <button type="button" className="text-button" aria-pressed={jitter} onClick={() => setJitter(!jitter)}>
            Jitter: {jitter ? "on" : "off"}
          </button>
        </StepControls>
      }
    />
  );
}
