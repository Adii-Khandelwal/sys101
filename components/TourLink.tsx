"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { TourId } from "@/lib/tours";
import { loadSeen, markSeen } from "@/lib/tourSeen";

// A separate chunk, fetched only when a reader starts a tour.
const TourOverlay = dynamic(() => import("./TourOverlay"), { ssr: false });

/**
 * The quiet entry link. It never starts by itself and appears only once the page is running. It stays until the
 * reader finishes the tour (Done) or presses Skip tour, and goes the moment that happens; Esc only closes the tour
 * for now. It is not shown again on later visits (Your data can bring it back), so it never nags. The footer copy
 * stays, as the way to take the tour again.
 */
export default function TourLink({ tour, variant = "inline" }: { tour: TourId; variant?: "inline" | "footer" }) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setSeen(loadSeen().seen[tour] === true);
    setReady(true);
  }, [tour]);

  // Taken or skipped counts as seen. The link stays on this page until the next visit, so focus has somewhere to return.
  // The footer copy stays: it is how a reader takes the tour again, and it does not nag from down there.
  if (seen && variant === "inline") return null;

  return (
    <>
      <button
        ref={button}
        type="button"
        className={variant === "footer" ? "text-button tour-footer-link" : "text-button label tour-link"}
        data-pagefind-ignore
        // Without JavaScript the button does nothing, so it stays invisible; its space is kept so nothing shifts.
        style={ready ? undefined : { visibility: "hidden" }}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {variant === "footer" ? "Take the tour" : "Take the 30-second tour"}
      </button>
      {open && (
        <TourOverlay
          tour={tour}
          onClose={(finished) => {
            setOpen(false);
            if (finished) markSeen(tour);
            if (finished && variant === "inline") {
              // The link is gone now, so focus goes to the top of the page, where the tour leaves the reader.
              setSeen(true);
              const heading = document.querySelector<HTMLElement>("h1");
              heading?.setAttribute("tabindex", "-1");
              heading?.focus({ preventScroll: true });
            } else button.current?.focus({ preventScroll: true });
          }}
        />
      )}
    </>
  );
}
