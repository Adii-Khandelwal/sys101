"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DURATION, EASING, bezier, prefersReducedMotion } from "@/lib/motion";
import { isPhone, keyAction, move, overlayBoxes, placeBox, resolveSteps, wrapTab, type TourId } from "@/lib/tours";

const PAD = 4; // the outline sits this far outside the target
const PHONE_HEADER = 72; // the sticky header and strip on a phone, which a lifted target must stay below
type Rect = { left: number; top: number; right: number; bottom: number };

const ease = bezier(EASING.inOut);

/**
 * Runs `frame(p)` every animation frame with p easing from 0 to 1 over `ms`, then `done`. Reduced motion (or ms of 0)
 * jumps straight to p = 1. One clock drives the page scroll, the outline and the tooltip, so they always arrive together.
 * Returns a cancel function.
 */
function animate(ms: number, frame: (p: number) => void, done: () => void) {
  if (ms <= 0 || prefersReducedMotion()) {
    frame(1);
    done();
    return () => {};
  }
  const t0 = performance.now();
  let id = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / ms);
    frame(ease(t));
    if (t < 1) id = requestAnimationFrame(tick);
    else done();
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({
  left: lerp(a.left, b.left, p),
  top: lerp(a.top, b.top, p),
  right: lerp(a.right, b.right, p),
  bottom: lerp(a.bottom, b.bottom, p),
});

/** A step that only moves the outline takes the base token; one that moves the page takes the slow token, a little longer for a long way so it does not blur. */
const travelMs = (distance: number) => (distance < 2 ? DURATION.base : DURATION.slow + Math.min(DURATION.slow / 2, distance / 50));

/** Under the target, else above it, else at the foot of the screen. */
function placeTip(rect: Rect, w: number, h: number) {
  const left = Math.min(Math.max(rect.left, 16), Math.max(16, window.innerWidth - w - 16));
  const below = rect.bottom + 12;
  const above = rect.top - 12 - h;
  return { left, top: below + h <= window.innerHeight - 12 ? below : above >= 12 ? above : window.innerHeight - h - 12 };
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
  // A step change moves the page, outline and tooltip together on one clock (see `animate`); following a scroll or resize snaps.
  const shown = useRef<Rect | null>(null);
  const tipNow = useRef({ left: 16, top: 16 });
  const animating = useRef(false);
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
    const reduced = prefersReducedMotion();
    const fade = (parseFloat(dialog.current ? getComputedStyle(dialog.current).transitionDuration : "0") || 0) * 1000;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        onClose(finished);
      }
    };
    if (window.scrollY > 2) {
      const from = window.scrollY;
      if (reduced) {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        setTimeout(finish, fade);
      } else animate(DURATION.slow, (p) => window.scrollTo({ top: from * (1 - p), behavior: "instant" as ScrollBehavior }), finish);
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

  // Bring the target into view. Every step works out where the page will end up, then moves the page, the outline and the
  // tooltip there on one eased clock: the first step with the overlay still hidden (it fades in on arrival), later steps with the
  // old outline travelling to the new place while the page scrolls under it. Reduced motion jumps.
  useEffect(() => {
    if (!step) return onClose(false);
    const el = visibleTarget(step.target);
    if (!el) return;
    const padded = (): Rect => {
      const r = el.getBoundingClientRect();
      return { left: r.left - PAD, top: r.top - PAD, right: r.right + PAD, bottom: r.bottom + PAD };
    };
    const measure = () => {
      const next = padded();
      if (same(shown.current, next)) return;
      shown.current = next;
      setRect(next);
    };
    const follow = () => measure();

    // Find where the browser would put the page (its own rules for centring and sticky headers), then put it back. No frame is
    // painted in between, so nothing flashes.
    const y0 = window.scrollY;
    const dock = phone && dialog.current ? dialog.current.offsetHeight : 0;
    if (phone) document.documentElement.style.setProperty("--tour-dock", `${dock + 8}px`);
    el.scrollIntoView({ block: phone ? "start" : "center", inline: "nearest", behavior: "instant" as ScrollBehavior });
    if (phone) {
      // The docked tooltip must never cover its target: lift it just clear, keeping its top below the header.
      const r = padded();
      const over = r.bottom - (window.innerHeight - dock - 8);
      const room = r.top - PHONE_HEADER;
      if (over > 0 && room > 0) window.scrollBy({ top: Math.min(over, room), behavior: "instant" as ScrollBehavior });
    }
    const yEnd = window.scrollY;
    const endRect = padded();
    window.scrollTo({ top: y0, behavior: "instant" as ScrollBehavior });

    const from = shown.current;
    const fromTip = tipNow.current;
    const endTip = dialog.current && !phone ? placeTip(endRect, dialog.current.offsetWidth, dialog.current.offsetHeight) : fromTip;
    let listening = false;
    const arrive = () => {
      animating.current = false;
      window.scrollTo({ top: yEnd, behavior: "instant" as ScrollBehavior });
      measure();
      window.addEventListener("resize", follow);
      window.addEventListener("scroll", follow, true);
      listening = true;
    };
    animating.current = index > 0 && !!from;
    const cancel = animate(
      travelMs(Math.abs(yEnd - y0)),
      (p) => {
        window.scrollTo({ top: lerp(y0, yEnd, p), behavior: "instant" as ScrollBehavior });
        // The first step has no outline yet (the overlay is hidden), so only a later step moves one.
        if (index > 0 && from && p < 1) {
          const r = lerpRect(from, endRect, p);
          shown.current = r;
          setRect(r);
          if (!phone) {
            const t = { left: lerp(fromTip.left, endTip.left, p), top: lerp(fromTip.top, endTip.top, p) };
            tipNow.current = t;
            setTip(t);
          }
        }
      },
      arrive,
    );
    // The page stays under the blocker, but the reader may switch Map and Path with the keyboard or the page may change:
    // the steps were worded for one view (or their target is gone), so the tour ends instead of describing what is not there.
    const watch = window.setInterval(() => {
      if (!el.isConnected || pathShowing() !== startedOnPath.current) closeRef.current(false);
    }, 300);
    setSaid(`Step ${index + 1} of ${steps.length}: ${step.title}. ${step.text}`);
    return () => {
      cancel();
      animating.current = false;
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
  // While a step is travelling the animation places it, so this waits for the outline to arrive.
  useLayoutEffect(() => {
    if (!rect || !dialog.current || animating.current) return;
    if (phone) {
      // The docked tooltip must never cover its target. Give the page room below its end (so a target at the very bottom
      // can scroll up); the lift itself is part of the step's travel.
      document.documentElement.style.setProperty("--tour-dock", `${dialog.current.offsetHeight + 8}px`);
      return;
    }
    const t = placeTip(rect, dialog.current.offsetWidth, dialog.current.offsetHeight);
    tipNow.current = t;
    setTip(t);
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
        <svg className="tour-svg" data-shown={visible || undefined} aria-hidden="true">
          {(["top", "bottom", "left", "right"] as const).map((k) => (
            <rect key={k} className="tour-dim" width="1" height="1" style={{ transform: placeBox(boxes[k]) }} />
          ))}
          <rect className="tour-ring" width="1" height="1" style={{ transform: placeBox(boxes.ring) }} />
        </svg>
      )}
      <div
        ref={dialog}
        className="tour-tip"
        data-shown={visible || undefined}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        tabIndex={-1}
        // On a phone the tooltip is docked to the bottom edge in CSS and does not move.
        style={phone ? undefined : { transform: `translate(${tip.left}px, ${tip.top}px)` }}
      >
        <div key={index} className="tour-body">
          <p className="label tour-count">
            Step {index + 1} of {steps.length}
          </p>
          <p id="tour-title" className="tour-title">
            {step.title}
          </p>
          <p id="tour-text" className="tour-text">
            {step.text}
          </p>
        </div>
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
