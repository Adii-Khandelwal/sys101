"use client";

import { useState, type KeyboardEvent } from "react";
import { raceLast, raceState, type RaceInputs } from "@/lib/fillRace";
import type { FigureText } from "@/lib/figures";
import { FigureFrame, Solid } from "./parts";
import type { RaceGeometry } from "./fillRace/geometry";

const px = ([x, y]: [number, number]) => `translate(${x}px, ${y}px)`;

// `uid` comes from the post id, not useId: the lazy wrapper moves the tree, and useId then differs between server and client.
export default function FillRaceLive({ uid, geo, inputs, text }: { uid: string; geo: RaceGeometry; inputs: RaceInputs; text: FigureText }) {
  const [step, setStep] = useState(0);
  const [guard, setGuard] = useState(false);
  const [evict, setEvict] = useState(false);
  const last = raceLast({ guard, evict });
  const at = Math.min(step, last);
  const s = raceState(inputs, { guard, evict }, at);

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") setStep(Math.min(at + 1, last));
    else if (e.key === "ArrowLeft") setStep(Math.max(at - 1, 0));
  };

  const svg = (
    <>
      {geo.back.map((p) => (
        <Solid key={p.name} b={p.box} className={p.name === "database.token" ? "fig-lit" : undefined} />
      ))}
      <g className="fig-move fig-fade" style={{ transform: px(geo.invalShift[s.inval]), opacity: s.inval === "flight" ? 1 : 0 }}>
        <Solid b={geo.inval} />
      </g>
      <g className="fig-move fig-fade" style={{ transform: px(geo.fillShift[s.fill]), opacity: s.fill === "flight" || s.fill === "blocked" ? 1 : 0 }}>
        <Solid b={geo.fill} />
      </g>
      <g className="fig-fade" style={{ opacity: s.pawl === "up" ? 1 : 0 }}>
        <Solid b={geo.pawlUp} />
      </g>
      <g className="fig-fade" style={{ opacity: s.pawl === "down" ? 1 : 0 }}>
        <Solid b={geo.pawlDown} />
      </g>
      {geo.front.map((p) => (
        <Solid key={p.name} b={p.box} />
      ))}
      <g className="fig-fade" style={{ opacity: s.cache === null ? 0 : 1 }}>
        <Solid b={geo.token} className={s.cache === s.db ? "fig-lit" : "fig-hollow"} />
      </g>
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
      onKeyDown={onKey}
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
        <>
          <button type="button" className="text-button" disabled={at === 0} onClick={() => setStep(at - 1)}>
            Back
          </button>
          <button type="button" className="text-button" disabled={at === last} onClick={() => setStep(at + 1)}>
            Next step
          </button>
          <button type="button" className="text-button" aria-pressed={guard} onClick={() => (setGuard(!guard), setStep(0))}>
            Version guard: {guard ? "on" : "off"}
          </button>
          <button type="button" className="text-button" aria-pressed={evict} onClick={() => (setEvict(!evict), setStep(0))}>
            Entry evicted first: {evict ? "on" : "off"}
          </button>
          <button type="button" className="text-button" onClick={() => (setStep(0), setGuard(false), setEvict(false))}>
            Reset
          </button>
        </>
      }
    />
  );
}
