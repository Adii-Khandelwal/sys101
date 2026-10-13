"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isPhone, keyAction, move, overlayBoxes, placeBox, resolveSteps, wrapTab, type TourId } from "@/lib/tours";

const PAD = 4; // the outline sits this far outside the target
const PHONE_HEADER = 72; // the sticky header and strip on a phone, which a lifted target must stay below
type Rect = { left: number; top: number; right: number; bottom: number };

/**
 * Calls `done` when the page has stopped scrolling: after it moved and then held still for about 400ms (a browser may
 * update the scroll position in bursts during a long smooth scroll), when it never
 * moved at all (unless `mustMove`: a scroll that is known to be coming), when `arrived()` says so, or after `cap` ms. Returns a cancel function.
 */
function whenSettled(done: () => void, cap: number, arrived: () => boolean = () => false, mustMove = false) {
  const t0 = performance.now();
  let prev = window.scrollY;
  let still = 0;
  let moved = false;
  let id = 0;
  const tick = () => {
    const y = window.scrollY;
    if (y !== prev) moved = true;
    still = y === prev ? still + 1 : 0;
    prev = y;
    if (arrived() || (moved && still >= 24) || (!mustMove && !moved && still >= 8) || performance.now() - t0 > cap) done();
    else id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}

/** The homepage is showing the Path list (a phone always does). */
const pathShowing = () => isPhone() || !!document.querySelector("section.path");

const visibleTarget = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-tour~="${name}"]`)].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;

/** A thin outline around one part of the page, a light dim elsewhere, and a tooltip. Loaded only when a tour starts. */
// `onClose(finished)`: finished is true for Done and Skip tour, false for Esc and for a tour that ended because the page changed.
export default function TourOverlay({ tour, onClose }: { tour: TourId; onClose: (finished: boolean) => void }) {
  const [steps] = useState(() => resolveSteps(tour, { phone: isPhone(), path: pathShowing() }, (t) => !!visibleTarget(t)));
  const [index, setIndex] = useState(0);
  const startedOnPath = useRef(pathShowing());
  const [rect, setRect] = useState<Rect | null>(null);
  const [tip, setTip] = useState<{ left: number; top: number }>({ left: 16, top: 16 });
  const [said, setSaid] = useState("");
  // A step change glides to the next target (transform only); following a scroll or resize must not lag behind, so it snaps.
  const [glide, setGlide] = useState(false);
  const shown = useRef<Rect | null>(null);
  const same = (a: Rect | null, b: Rect) => !!a && a.left === b.left && a.top === b.top && a.right === b.right && a.bottom === b.bottom;
  const dialog = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const phone = isPhone();

  // Fade in once the first target is measured and the tooltip placed, so nothing jumps into place.
  const [visible, setVisible] = useState(false);
  const closing = useRef(false);

  // Fade out and ease the page back to its top, so a reader who closes the tour starts again from the top; then hand over. The reading
  // tracker stays off until then, so the scroll back leaves no visits. Under reduced motion all of it is instant.
  const close = (finished = false) => {
    if (closing.current) return;
    closing.current = true;
    setVisible(false);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fade = (parseFloat(dialog.current ? getComputedStyle(dialog.current).transitionDuration : "0") || 0) * 1000;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        onClose(finished);
      }
    };
    if (window.scrollY > 2) {
      window.scrollTo({ top: 0, behavior: reduced ? ("instant" as ScrollBehavior) : "smooth" });
      if (reduced) setTimeout(finish, fade);
      else whenSettled(finish, 2000, () => window.scrollY <= 1, true); // until it reaches the top, or stops
    } else setTimeout(finish, fade);
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  const go = (dir: 1 | -1) => {
    const to = move(index, dir, steps.length);
    if (to === null) close(true);
    else setIndex(to);
  };
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    if (!rect || visible || closing.current) return;
    let second = 0;
    const first = requestAnimationFrame(() => (second = requestAnimationFrame(() => setVisible(true))));
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [rect, visible]);

  // Bring the target into view, then follow it while the page moves. The first step travels there smoothly with the
  // overlay still hidden and fades in on arrival; later steps jump the page and glide the outline. Reduced motion jumps.
  useEffect(() => {
    if (!step) return onClose(false);
    const el = visibleTarget(step.target);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const travel = index === 0 && !reduced;
    el.scrollIntoView({ block: phone ? "start" : "center", inline: "nearest", behavior: travel ? "smooth" : ("instant" as ScrollBehavior) });
    const measure = (glides: boolean) => {
      const r = el.getBoundingClientRect();
      const next = { left: r.left - PAD, top: r.top - PAD, right: r.right + PAD, bottom: r.bottom + PAD };
      if (same(shown.current, next)) return;
      shown.current = next;
      setGlide(glides && index > 0);
      setRect(next);
    };
    const follow = () => measure(false);
    // The page stays under the blocker, but the reader may switch Map and Path with the keyboard or the page may change:
    // the steps were worded for one view (or their target is gone), so the tour ends instead of describing what is not there.
    const watch = window.setInterval(() => {
      if (!el.isConnected || pathShowing() !== startedOnPath.current) closeRef.current(false);
    }, 300);
    let listening = false;
    const start = () => {
      measure(true);
      window.addEventListener("resize", follow);
      window.addEventListener("scroll", follow, true);
      listening = true;
    };
    const stopTravel = travel ? whenSettled(start, 1500) : (start(), () => {});
    setSaid(`Step ${index + 1} of ${steps.length}: ${step.title}. ${step.text}`);
    return () => {
      stopTravel();
      if (listening) {
        window.removeEventListener("resize", follow);
        window.removeEventListener("scroll", follow, true);
      }
      window.clearInterval(watch);
    };
    // onClose and phone are stable for the life of a tour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, step]);

  // Place the tooltip: under the target, else above it, else at the foot of the screen. A phone docks it to the bottom edge in CSS.
  useLayoutEffect(() => {
    if (!rect || !dialog.current) return;
    if (phone) {
      // While the tour is closing the page is easing back to the top; lifting the target again would fight that scroll.
      if (closing.current) return;
      // The docked tooltip must never cover its target. Give the page room below its end (so a target at the very bottom
      // can scroll up), then scroll just enough to lift the target clear of the tooltip, keeping its top below the header.
      const dock = dialog.current.offsetHeight;
      document.documentElement.style.setProperty("--tour-dock", `${dock + 8}px`);
      const over = rect.bottom - (window.innerHeight - dock - 8);
      const room = rect.top - PHONE_HEADER;
      if (over > 0 && room > 0) window.scrollBy({ top: Math.min(over, room), behavior: "instant" as ScrollBehavior });
      return;
    }
    const { offsetWidth: w, offsetHeight: h } = dialog.current;
    const left = Math.min(Math.max(rect.left, 16), Math.max(16, window.innerWidth - w - 16));
    const below = rect.bottom + 12;
    const above = rect.top - 12 - h;
    setTip({ left, top: below + h <= window.innerHeight - 12 ? below : above >= 12 ? above : window.innerHeight - h - 12 });
  }, [rect, index, phone]);

  // The tour scrolls the page to each part; closing it puts the reader back where they were, and while it runs the
  // reading tracker (components/LessonRail.tsx) ignores the scrolling.
  useEffect(() => {
    document.documentElement.dataset.touring = "true";
    return () => {
      delete document.documentElement.dataset.touring;
      document.documentElement.style.removeProperty("--tour-dock");
    };
  }, []);

  // Focus goes into the tooltip and stays on its buttons; Esc closes; the arrows step.
  useEffect(() => {
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const inside = dialog.current?.contains(e.target as Node);
      if (e.key === "Tab" && inside) {
        const buttons = [...dialog.current!.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const to = wrapTab(buttons.indexOf(document.activeElement as HTMLButtonElement), buttons.length, e.shiftKey);
        if (to !== null) {
          e.preventDefault();
          buttons[to].focus();
        }
        return;
      }
      const action = keyAction(e.key);
      if (action === "close") {
        e.preventDefault();
        closeRef.current(false);
      } else if (inside && action) {
        e.preventDefault();
        goRef.current(action === "next" ? 1 : -1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!step) return null;
  const last = index === steps.length - 1;
  const boxes = rect ? overlayBoxes(rect, window.innerWidth, window.innerHeight) : null;
  return createPortal(
    <>
      {/* The rest of the page does not take clicks while a tour runs, so nothing is pressed by accident. Scrolling still works. */}
      <div className="tour-block" aria-hidden="true" />
      {boxes && (
        <svg className={`tour-svg${glide ? " tour-go" : ""}`} data-shown={visible || undefined} aria-hidden="true">
          {(["top", "bottom", "left", "right"] as const).map((k) => (
            <rect key={k} className="tour-dim" width="1" height="1" style={{ transform: placeBox(boxes[k]) }} />
          ))}
          <rect className="tour-ring" width="1" height="1" style={{ transform: placeBox(boxes.ring) }} />
        </svg>
      )}
      <div
        ref={dialog}
        className={`tour-tip${glide ? " tour-go" : ""}`}
        data-shown={visible || undefined}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        tabIndex={-1}
        // On a phone the tooltip is docked to the bottom edge in CSS and does not move.
        style={phone ? undefined : { transform: `translate(${tip.left}px, ${tip.top}px)` }}
      >
        <p className="label tour-count">
          Step {index + 1} of {steps.length}
        </p>
        <p id="tour-title" className="tour-title">
          {step.title}
        </p>
        <p id="tour-text" className="tour-text">
          {step.text}
        </p>
        <div className="tour-actions">
          <button type="button" className="text-button label" onClick={() => go(-1)} disabled={index === 0}>
            Back
          </button>
          <button type="button" className="text-button label" onClick={() => go(1)}>
            {last ? "Done" : "Next"}
          </button>
          <button type="button" className="text-button label tour-skip" onClick={() => close(true)}>
            Skip tour
          </button>
        </div>
      </div>
      <div className="visually-hidden" role="status" aria-live="polite">
        {said}
      </div>
    </>,
    document.body,
  );
}
