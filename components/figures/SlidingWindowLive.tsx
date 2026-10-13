"use client";

import { useState, type KeyboardEvent } from "react";
import { MAX_ADDED, WINDOW_SECONDS, windowEstimate, windowFormula, windowStatus, windowValueText, type WindowInputs } from "@/lib/slidingWindow";
import type { FigureText } from "@/lib/figures";
import { FigureFrame, Solid } from "./parts";
import { currentBeadX, dialAngle, type Geometry } from "./slidingWindow/geometry";

/** This minute's beads in two lanes, drawn back lane first. */
function beadsOf(count: number, elapsed: number, geo: Geometry) {
  const [dx, dy] = geo.second;
  const xs = currentBeadX(count, elapsed);
  return xs
    .map((x, k) => {
      const lane = k % geo.curLanes.length;
      const [ox, oy] = geo.curLanes[lane];
      return { k, lane, cx: ox + (x - 60) * dx, cy: oy + (x - 60) * dy };
    })
    .sort((a, b) => a.lane - b.lane);
}

/** The interactive figure. Labels, readout and captions are HTML outside the scaled SVG. */
// `uid` comes from the post id, not useId: the lazy wrapper moves the tree, and useId then differs between server and client.
export default function SlidingWindowLive({ uid, geo, inputs, text }: { uid: string; geo: Geometry; inputs: WindowInputs; text: FigureText }) {
  const [elapsed, setElapsed] = useState(inputs.elapsed);
  const [added, setAdded] = useState(0);
  const current = inputs.current + added;
  const estimate = windowEstimate(inputs.previous, current, elapsed);
  const [dx, dy] = geo.second;
  const shift = `translate(${(dx * elapsed).toFixed(2)}px, ${(dy * elapsed).toFixed(2)}px)`;

  // Shift + arrow steps 5 seconds; plain arrows keep the native 1 second step.
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const dir = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!dir || !e.shiftKey) return;
    e.preventDefault();
    setElapsed(Math.min(WINDOW_SECONDS, Math.max(0, elapsed + 5 * dir)));
  };

  const svg = (
    <>
      {geo.staticBoxes.slice(0, 2).map((s) => (
        <Solid key={s.name} b={s.box} />
      ))}
      <g className="fig-ticks">
        {geo.ticks.map((t) => (
          <path key={t.d} d={t.d} className={t.major ? "fig-tick fig-tick-major" : "fig-tick"} />
        ))}
      </g>
      <path d={geo.gauge.backHull} className="fig-right" />
      <g transform={geo.gauge.matrix}>
        <circle r={geo.gauge.faceR} className="fig-top" />
        <circle r={geo.gauge.faceR - 1.6} className="fig-bezel" />
        {geo.gauge.ticks.map((t) => (
          <path key={t.d} d={t.d} className={t.limit ? "fig-tick fig-limit" : "fig-tick"} />
        ))}
      </g>
      <g className="fig-needle" style={{ transform: `${geo.gauge.matrix} rotate(${dialAngle(estimate, geo.dialMax)}deg)` }}>
        <path d="M0,2.6L0,-10.6" className="fig-hand" />
        <circle r={geo.gauge.hub} className="fig-hub" />
      </g>
      {geo.staticBoxes.slice(2).map((s) => (
        <Solid key={s.name} b={s.box} />
      ))}
      {geo.prevBeads.map((b) => (
        <circle key={b.x} cx={b.cx} cy={b.cy} r={geo.beadR} className={b.x >= elapsed ? "fig-bead fig-in" : "fig-bead"} />
      ))}
      {beadsOf(current, elapsed, geo).map((b) => (
        <circle key={b.k} cx={b.cx} cy={b.cy} r={geo.beadR} className="fig-bead fig-in" />
      ))}
      <g className="fig-move" style={{ transform: shift }}>
        {geo.frameBack.map((s, k) => (
          <Solid key={`${s.name}${k}`} b={s.box} />
        ))}
      </g>
      <g className="fig-move" style={{ transform: shift }}>
        {geo.frameFront.map((s, k) => (
          <Solid key={`${s.name}${k}`} b={s.box} />
        ))}
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
      svg={svg}
      readout={
        <>
          <span className="label">Estimate</span>
          <output htmlFor={`${uid}s`} className="fig-formula">
            {windowFormula(inputs, current, elapsed)}
          </output>
          <span className="fig-status">{windowStatus(estimate, inputs.limit)}</span>
        </>
      }
      controls={
        <>
          <label className="fig-slider">
            <span className="label">Seconds into the minute</span>
            <input
              id={`${uid}s`}
              type="range"
              min={0}
              max={WINDOW_SECONDS}
              step={1}
              value={elapsed}
              aria-valuetext={windowValueText(inputs, current, elapsed)}
              onChange={(e) => setElapsed(Number(e.target.value))}
              onKeyDown={onKey}
            />
            <span className="fig-seconds">{elapsed} s</span>
          </label>
          <button type="button" className="text-button" disabled={added >= MAX_ADDED} onClick={() => setAdded(added + 1)}>
            Add a request
          </button>
          <button type="button" className="text-button" onClick={() => (setElapsed(inputs.elapsed), setAdded(0))}>
            Reset
          </button>
        </>
      }
    />
  );
}
