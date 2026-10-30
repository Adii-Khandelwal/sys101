"use client";

import { useMemo, useState } from "react";
import { ringLast, ringState, KEYS, POINTS, SERVER_IDS, type RingInputs } from "@/lib/hashRing";
import type { FigureText } from "@/lib/figures";
import { FigureFrame, Solid, StepControls, stepKeys } from "./parts";
import { byDepth, drawn, keyLift, keySpec, postSpecs, slabSpec, tierOf, type RingGeometry } from "./hashRing/geometry";
import type { Spec } from "./scene";

const px = ([x, y]: [number, number]) => `translate(${x}px, ${y}px)`;
const TIERS = SERVER_IDS.length;

type Item = { id: string; spec: Spec; kind: "slab" | "post" | "key"; cell: number; layer?: number; server?: (typeof SERVER_IDS)[number]; key?: string };

// `uid` comes from the post id, not useId: the lazy wrapper moves the tree, and useId then differs between server and client.
export default function HashRingLive({ uid, geo, inputs, text }: { uid: string; geo: RingGeometry; inputs: RingInputs; text: FigureText }) {
  const [step, setStep] = useState(0);
  const [many, setMany] = useState(false);
  const at = Math.min(step, ringLast);
  const s = ringState(inputs, many, at);

  // Every part that can appear in this mode, in one fixed painter's order; steps only change opacity and lift.
  const items = useMemo(() => {
    const m = many ? "many" : "one";
    const all: (Item & { sort: Spec })[] = [];
    for (let c = 0; c < 36; c++) for (let l = 0; l < TIERS; l++) all.push({ id: `s${c}.${l}`, spec: slabSpec(c, l), sort: slabSpec(c, l), kind: "slab", cell: c, layer: l });
    for (const sv of SERVER_IDS)
      for (const c of POINTS[m][sv]) for (const p of postSpecs(c, sv)) all.push({ id: p.name + sv, spec: p, sort: p, kind: "post", cell: c, server: sv });
    for (const k of KEYS) all.push({ id: `k${k.name}`, spec: keySpec(k.name, k.cell), sort: keySpec(k.name, k.cell, TIERS), kind: "key", cell: k.cell, key: k.name });
    return all.sort((a, b) => byDepth(a.sort, b.sort)).map((it) => ({ ...it, box: drawn(it.spec).box }));
  }, [many]);

  const svg = (
    <>
      {geo.base.map((p) => (
        <Solid key={p.name} b={p.box} />
      ))}
      {items.map((it) => {
        if (it.kind === "slab") {
          const on = (it.layer as number) < tierOf(s.cellOwner[it.cell]);
          return (
            <g key={it.id} className="fig-fade" style={{ opacity: on ? 1 : 0 }}>
              <Solid b={it.box} />
            </g>
          );
        }
        if (it.kind === "post") {
          return (
            <g key={it.id} className="fig-fade" style={{ opacity: s.present.includes(it.server as "A") ? 1 : 0 }}>
              <Solid b={it.box} />
            </g>
          );
        }
        const o = s.owners.find((x) => x.name === it.key)!;
        return (
          <g key={it.id} className="fig-move" style={{ transform: px(keyLift(tierOf(o.server))) }}>
            <Solid b={it.box} className={o.moved ? "fig-lit" : undefined} />
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
      onKeyDown={stepKeys(at, ringLast, setStep)}
      svg={svg}
      readout={
        <>
          <span className="label">
            Step {at + 1} of {ringLast + 1}
          </span>
          <p className="fig-line">{s.headline}</p>
          <p className="fig-formula">{s.readout}</p>
          <p className="fig-formula">{s.spread}</p>
        </>
      }
      controls={
        <StepControls step={at} last={ringLast} setStep={setStep} reset={() => (setStep(0), setMany(false))}>
          <button type="button" className="text-button" aria-pressed={many} onClick={() => setMany(!many)}>
            Points per server: {many ? "3" : "1"}
          </button>
        </StepControls>
      }
    />
  );
}
