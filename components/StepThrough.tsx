"use client";

import { useState } from "react";
import { StepControls, stepKeys } from "./figures/parts";

/** A diagram told in frames: one frame at a time with Back, Next step and Reset (the arrow keys work too). Frames are our own checked SVG, already passed through diagramHtml. */
export default function StepThrough({ frames }: { frames: { caption: string; html: string }[] }) {
  const [at, setStep] = useState(0);
  const last = frames.length - 1;
  return (
    <figure className="fig step-through" data-pagefind-ignore onKeyDown={stepKeys(at, last, setStep)}>
      <div className="diagram" dangerouslySetInnerHTML={{ __html: frames[at].html }} />
      <div className="fig-readout" aria-live="polite">
        <span className="label">
          Step {at + 1} of {frames.length}
        </span>
        {/* Every caption sits in one grid cell, so the readout is as tall as the longest and the controls never jump. */}
        <div className="step-captions">
          {frames.map((f, i) => (
            <p key={f.caption} className="fig-line" aria-hidden={i !== at} style={{ visibility: i === at ? "visible" : "hidden" }}>
              {f.caption}
            </p>
          ))}
        </div>
      </div>
      <div className="fig-controls">
        <StepControls step={at} last={last} setStep={setStep} reset={() => setStep(0)} />
      </div>
      <noscript>
        {frames.map((f) => (
          <div key={f.caption}>
            <div className="diagram" dangerouslySetInnerHTML={{ __html: f.html }} />
            <p className="fig-line">{f.caption}</p>
          </div>
        ))}
      </noscript>
    </figure>
  );
}
