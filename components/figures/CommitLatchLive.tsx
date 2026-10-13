"use client";

import { useState } from "react";
import { LATCH_STEPS, latchState, type LatchInputs } from "@/lib/commitLatch";
import type { FigureText } from "@/lib/figures";
import { FigureFrame, Solid, StepControls, stepKeys } from "./parts";
import type { LatchGeometry } from "./commitLatch/geometry";

// `uid` comes from the post id, not useId: the lazy wrapper moves the tree, and useId then differs between server and client.
export default function CommitLatchLive({ uid, geo, inputs, text }: { uid: string; geo: LatchGeometry; inputs: LatchInputs; text: FigureText }) {
  const [step, setStep] = useState(0);
  const s = latchState(inputs, step);
  const last = LATCH_STEPS - 1;
  const on = (v: boolean) => ({ opacity: v ? 1 : 0 });

  const cabinet = (cabinet: LatchGeometry["bobCabinet"], cards: LatchGeometry["bob"], cell: typeof s.bobNew) => (
    <>
      <Solid b={cabinet.box} />
      <Solid b={cards.old} />
      <g className="fig-fade" style={on(cell !== "none")}>
        <Solid b={cards.new} className={cell === "committed" ? "fig-lit" : "fig-hollow"} />
      </g>
      <g className="fig-fade" style={on(cell === "committed")}>
        {cards.flag.map((p) => (
          <Solid key={p.name} b={p.box} />
        ))}
      </g>
    </>
  );

  const svg = (
    <>
      <Solid b={geo.base.box} />
      {cabinet(geo.bobCabinet, geo.bob, s.bobNew)}
      <g className="fig-fade" style={on(s.bobLock)}>
        {geo.latch.map((p) => (
          <Solid key={p.name} b={p.box} className="fig-lit" />
        ))}
      </g>
      {cabinet(geo.joeCabinet, geo.joe, s.joeNew)}
      <g className="fig-fade" style={on(s.joeLock)}>
        <Solid b={geo.padlock.box} />
      </g>
      <path d={geo.cord} className="fig-cord fig-fade" style={on(s.cord)} />
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
      onKeyDown={stepKeys(step, last, setStep)}
      svg={svg}
      readout={
        <>
          <span className="label">
            Step {step + 1} of {LATCH_STEPS}
          </span>
          <p className="fig-line">{s.headline}</p>
          <p className="fig-formula">{s.bob}</p>
          <p className="fig-formula">{s.joe}</p>
          <p className="fig-line">{s.reader}</p>
        </>
      }
      controls={
        <StepControls step={step} last={last} setStep={setStep} reset={() => setStep(0)} />
      }
    />
  );
}
