"use client";

import { useMemo, useState } from "react";
import { CELLS, KEYS, filterLast, filterState, type FilterInputs } from "@/lib/filterBits";
import type { FigureText } from "@/lib/figures";
import { FigureFrame, Solid, StepControls, stepKeys } from "./parts";
import { BASE, BRIDGE, CELL, LAMP, PILLARS, barSpecs, byDepth, drawn, legSpec, pinSpec, riserSpec, shift, slabSpec, type FilterGeometry } from "./filterBits/geometry";
import type { Spec } from "./scene";

const px = ([x, y]: [number, number]) => `translate(${x}px, ${y}px)`;

type Item = { id: string; kind: "plain" | "riser"; cell: number; box: ReturnType<typeof drawn>["box"]; spec: Spec };

// `uid` comes from the post id, not useId: the lazy wrapper moves the tree, and useId then differs between server and client.
export default function FilterBitsLive({ uid, geo, inputs, text }: { uid: string; geo: FilterGeometry; inputs: FilterInputs; text: FigureText }) {
  const [step, setStep] = useState(0);
  const at = Math.min(step, filterLast);
  const s = filterState(inputs, at);

  // Every part that can appear, in one fixed painter's order; steps only change opacity and position.
  const row = useMemo(() => {
    const all: Item[] = [];
    for (let c = 0; c < CELLS; c++) {
      for (const [kind, spec] of [["plain", slabSpec(c)], ["plain", pinSpec(c)], ["riser", riserSpec(c)]] as const) all.push({ id: spec.name, kind, cell: c, spec, box: drawn(spec).box });
    }
    for (const p of PILLARS) all.push({ id: p.name, kind: "plain", cell: -1, spec: p, box: drawn(p).box });
    return all.sort((a, b) => byDepth(a.spec, b.spec));
  }, []);
  const bars = useMemo(() => barSpecs(inputs).map(drawn), [inputs]);
  const legCells = s.probe?.cells ?? [...KEYS[at === 0 ? 0 : 4].cells];
  const leg = drawn(legSpec(0)).box;

  const svg = (
    <>
      {BASE.map((p) => (
        <Solid key={p.name} b={drawn(p).box} />
      ))}
      {row.map((it) =>
        it.kind === "riser" ? (
          <g key={it.id} className="fig-fade" style={{ opacity: s.bits[it.cell] ? 1 : 0 }}>
            <Solid b={it.box} />
          </g>
        ) : (
          <Solid key={it.id} b={it.box} />
        ),
      )}
      {bars.map((b, k) => (
        <g key={b.name} className="fig-fade" style={{ opacity: s.bars ? 1 : 0 }}>
          <Solid b={b.box} className={k === 2 ? "fig-lit" : undefined} />
        </g>
      ))}
      {legCells.map((c, k) => (
        <g key={k} className="fig-move fig-fade" style={{ transform: px(shift(c * CELL)), opacity: s.probe ? 1 : 0 }}>
          <Solid b={leg} />
        </g>
      ))}
      <Solid b={drawn(BRIDGE).box} />
      <Solid b={drawn(LAMP).box} className={s.lamp ? "fig-lit" : "fig-hollow"} />
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
      onKeyDown={stepKeys(at, filterLast, setStep)}
      svg={svg}
      readout={
        <>
          <span className="label">
            Step {at + 1} of {filterLast + 1}
          </span>
          <p className="fig-line">{s.headline}</p>
          <p className="fig-formula">{s.readout}</p>
          {s.bars && <p className="fig-formula">{s.space}</p>}
        </>
      }
      controls={<StepControls step={at} last={filterLast} setStep={setStep} reset={() => setStep(0)} />}
    />
  );
}
