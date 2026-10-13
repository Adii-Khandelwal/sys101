import type { ReactNode } from "react";
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
        <title id={`${uid}t`}>{title}</title>
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
