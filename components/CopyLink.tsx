"use client";

import { useRef, useState } from "react";

/** Copies the address of one section of the page. Sits after the section's h2, not inside it: the header reads the h2's text. */
export default function CopyLink({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<number>(undefined);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${id}`);
    } catch {
      return; // no clipboard (insecure page, denied): the heading's section is still reachable by the contents rail
    }
    setDone(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1600);
  };

  return (
    <>
      <button type="button" className="copy-link" data-pagefind-ignore aria-label="Copy link to this section" onClick={copy}>
        {done ? "Copied" : "Copy link"}
      </button>
      <span className="visually-hidden" aria-live="polite">
        {done ? "Link copied" : ""}
      </span>
    </>
  );
}
