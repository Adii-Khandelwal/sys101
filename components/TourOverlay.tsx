"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isPhone, keyAction, move, overlayBoxes, placeBox, resolveSteps, wrapTab, type TourId } from "@/lib/tours";

const PAD = 4; // the outline sits this far outside the target
type Rect = { left: number; top: number; right: number; bottom: number };

const visibleTarget = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-tour~="${name}"]`)].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;

/** A thin outline around one part of the page, a light dim elsewhere, and a tooltip. Loaded only when a tour starts. */
export default function TourOverlay({ tour, onClose }: { tour: TourId; onClose: () => void }) {
  const [steps] = useState(() => resolveSteps(tour, isPhone(), (t) => !!visibleTarget(t)));
  const [index, setIndex] = useState(0);
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
  // Read while rendering, before the first step scrolls the page: this is where the reader was.
  const startY = useRef(typeof window === "undefined" ? 0 : window.scrollY);
  const closing = useRef(false);

  // Fade out, and if the tour scrolled the page, ease back to where the reader was; then hand over. The reading
  // tracker stays off until then, so the scroll back leaves no visits. Under reduced motion all of it is instant.
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setVisible(false);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fade = (parseFloat(dialog.current ? getComputedStyle(dialog.current).transitionDuration : "0") || 0) * 1000;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        onClose();
      }
    };
    if (Math.abs(window.scrollY - startY.current) > 2) {
      window.scrollTo({ top: startY.current, behavior: reduced ? ("instant" as ScrollBehavior) : "smooth" });
      if (reduced) setTimeout(finish, fade);
      else {
        // Wait until the page has reached the spot (or stopped moving), but never longer than 900ms.
        const t0 = performance.now();
        let still = 0;
        let prev = window.scrollY;
        const watch = () => {
          const y = window.scrollY;
          still = y === prev ? still + 1 : 0;
          prev = y;
          if (Math.abs(y - startY.current) <= 1 || still >= 6 || performance.now() - t0 > 900) finish();
          else requestAnimationFrame(watch);
        };
        requestAnimationFrame(watch);
      }
    } else setTimeout(finish, fade);
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  const go = (dir: 1 | -1) => {
    const to = move(index, dir, steps.length);
    if (to === null) close();
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

  // Bring the target into view (instantly: no scrolling animation), then follow it while the page moves.
  useEffect(() => {
    if (!step) return onClose();
    const el = visibleTarget(step.target);
    if (!el) return;
    el.scrollIntoView({ block: phone ? "start" : "center", inline: "nearest", behavior: "instant" as ScrollBehavior });
    const measure = (glides: boolean) => {
      const r = el.getBoundingClientRect();
      const next = { left: r.left - PAD, top: r.top - PAD, right: r.right + PAD, bottom: r.bottom + PAD };
      if (same(shown.current, next)) return;
      shown.current = next;
      setGlide(glides && index > 0);
      setRect(next);
    };
    measure(true);
    const follow = () => measure(false);
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, true);
    setSaid(`Step ${index + 1} of ${steps.length}: ${step.title}. ${step.text}`);
    return () => {
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow, true);
    };
    // onClose and phone are stable for the life of a tour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, step]);

  // Place the tooltip: under the target, else above it, else at the foot of the screen. A phone docks it to the bottom edge in CSS.
  useLayoutEffect(() => {
    if (!rect || !dialog.current) return;
    const { offsetWidth: w, offsetHeight: h } = dialog.current;
    const left = Math.min(Math.max(rect.left, 16), Math.max(16, window.innerWidth - w - 16));
    const below = rect.bottom + 12;
    const above = rect.top - 12 - h;
    setTip({ left, top: below + h <= window.innerHeight - 12 ? below : above >= 12 ? above : window.innerHeight - h - 12 });
  }, [rect, index]);

  // The tour scrolls the page to each part; closing it puts the reader back where they were, and while it runs the
  // reading tracker (components/LessonRail.tsx) ignores the scrolling.
  useEffect(() => {
    document.documentElement.dataset.touring = "true";
    return () => {
      delete document.documentElement.dataset.touring;
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
        closeRef.current();
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
          <button type="button" className="text-button label tour-skip" onClick={close}>
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
