"use client";

import { useEffect } from "react";
import { LogoMark } from "./Logo";

const HOLD_MS = 1950; // one node comes on, two come out of it, the name flickers on like a bulb, then a short rest
const FADE_MS = 200;

/**
 * Opening screen, on every load or refresh of the homepage and nowhere else: one node comes on, two come out of it, and the
 * name comes on like a bulb (on, dim, off, on), then the page. The page is already in the HTML underneath; this only covers it.
 * An inline script in the layout sets `data-splash` on <html> before paint (only on the homepage, never for reduced motion or
 * automation); without it the overlay never shows. A click or key skips it.
 */
export default function Splash() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-splash")) return;
    const el = document.querySelector<HTMLElement>(".splash");
    const close = () => {
      el?.classList.add("is-leaving");
      timers.push(window.setTimeout(() => root.removeAttribute("data-splash"), FADE_MS));
    };
    const timers = [window.setTimeout(close, HOLD_MS)];
    const skip = () => {
      timers.forEach(clearTimeout);
      root.removeAttribute("data-splash");
    };
    window.addEventListener("keydown", skip, { once: true });
    el?.addEventListener("click", skip, { once: true });
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-lockup">
        <span className="splash-mark">
          <LogoMark size={44} />
        </span>
        <span className="splash-word">sys101</span>
      </div>
    </div>
  );
}
