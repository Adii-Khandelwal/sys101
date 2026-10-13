"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { TourId } from "@/lib/tours";
import { loadSeen, markSeen } from "@/lib/tourSeen";

// A separate chunk, fetched only when a reader starts a tour.
const TourOverlay = dynamic(() => import("./TourOverlay"), { ssr: false });

/**
 * The quiet entry link. It never starts by itself and appears only once the page is running. Once a reader has
 * taken or skipped the tour it is not shown again on later visits (Your data can bring it back), so it never nags.
 */
export default function TourLink({ tour }: { tour: TourId }) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setSeen(loadSeen().seen[tour] === true);
    setReady(true);
  }, [tour]);

  // Taken or skipped counts as seen. The link stays on this page until the next visit, so focus has somewhere to return.
  if (seen) return null;

  return (
    <>
      <button
        ref={button}
        type="button"
        className="text-button label tour-link"
        data-pagefind-ignore
        // Without JavaScript the button does nothing, so it stays invisible; its space is kept so nothing shifts.
        style={ready ? undefined : { visibility: "hidden" }}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        Take the 30-second tour
      </button>
      {open && (
        <TourOverlay
          tour={tour}
          onClose={() => {
            markSeen(tour);
            setOpen(false);
            button.current?.focus({ preventScroll: true }); // the page is back where the link is
          }}
        />
      )}
    </>
  );
}
