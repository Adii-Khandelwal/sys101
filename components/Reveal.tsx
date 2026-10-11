"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

/**
 * A disclosure that opens with the shared reveal motion: space opens via grid
 * rows (no jump), content fades up 6px, and the button label cross-fades.
 * Closed content is inert, so it is neither focusable nor read out.
 */
export default function Reveal({ show, hide, children }: { show: string; hide: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="reveal-wrap">
      <button
        type="button"
        className="text-button label"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="swap">
          <span data-hidden={open || undefined}>{show}</span>
          <span data-hidden={!open || undefined} aria-hidden={!open}>
            {hide}
          </span>
        </span>
      </button>
      <RevealPanel id={id} open={open}>
        {children}
      </RevealPanel>
    </div>
  );
}

/** The animated panel on its own, for reveals driven by other state (quiz answers). */
export function RevealPanel({ id, open, children }: { id?: string; open: boolean; children: ReactNode }) {
  // Hide closed content only once JavaScript runs; without it a <noscript>
  // style in the layout shows every panel open, so answers stay readable.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const hidden = ready && !open;
  return (
    <div id={id} className="reveal" data-open={open || undefined}>
      <div className="reveal-inner" inert={hidden} aria-hidden={hidden || undefined}>
        <div className="reveal-content">{children}</div>
      </div>
    </div>
  );
}
