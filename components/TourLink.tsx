"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { TourId } from "@/lib/tours";

// A separate chunk, fetched only when a reader starts a tour.
const TourOverlay = dynamic(() => import("./TourOverlay"), { ssr: false });

/** The quiet entry link. It never starts by itself and appears only once the page is running. */
export default function TourLink({ tour }: { tour: TourId }) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => setReady(true), []);

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
            setOpen(false);
            button.current?.focus();
          }}
        />
      )}
    </>
  );
}
