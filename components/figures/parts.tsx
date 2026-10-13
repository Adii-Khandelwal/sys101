import type { KeyboardEvent, ReactNode } from "react";
import type { Box } from "./scene";

/** A box's three visible faces, back to front. */
export const Solid = ({ b, className }: { b: Box; className?: string }) => (
  <g className={className}>
    <path d={b.right} className="fig-right" />
    <path d={b.front} className="fig-front" />
    <path d={b.top} className="fig-top" />
  </g>
);

type FrameProps = {
  uid: string;
  viewBox: string;
  title: string;
  description: string;
  legend: string[];
  caption: string;
  /** Aria-live readout block, then the controls. */
  readout: ReactNode;
  controls: ReactNode;
  svg: ReactNode;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
};

/** Shared shell: the scaled SVG, then readout, controls, legend, description and caption as real HTML. */
export function FigureFrame({ uid, viewBox, title, description, legend, caption, readout, controls, svg, onKeyDown }: FrameProps) {
  return (
    <figure className="fig" data-pagefind-ignore onKeyDown={onKeyDown}>
      <svg viewBox={viewBox} role="img" aria-labelledby={`${uid}t ${uid}d`} className="fig-svg">
        <desc id={`${uid}t`}>{title}</desc>
        <desc id={`${uid}d`}>{description}</desc>
        {svg}
      </svg>
      <div className="fig-readout" aria-live="polite">
        {readout}
      </div>
      <div className="fig-controls">{controls}</div>
      <ul className="fig-legend">
        {legend.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p className="fig-desc">{description}</p>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** Left and right arrows move a stepper figure one step. */
export const stepKeys = (step: number, last: number, setStep: (n: number) => void) => (e: KeyboardEvent<HTMLElement>) => {
  if (e.key === "ArrowRight") setStep(Math.min(step + 1, last));
  else if (e.key === "ArrowLeft") setStep(Math.max(step - 1, 0));
};

/** Back, Next step, any extra switches, then Reset: the controls of every stepper figure. */
export function StepControls({ step, last, setStep, reset, children }: { step: number; last: number; setStep: (n: number) => void; reset: () => void; children?: ReactNode }) {
  return (
    <>
      <button type="button" className="text-button" disabled={step === 0} onClick={() => setStep(step - 1)}>
        Back
      </button>
      <button type="button" className="text-button" disabled={step === last} onClick={() => setStep(step + 1)}>
        Next step
      </button>
      {children}
      <button type="button" className="text-button" onClick={reset}>
        Reset
      </button>
    </>
  );
}
