"use client";

import { useEffect } from "react";
import { LogoMark } from "./Logo";

const HOLD_MS = 1950; // one node comes on, two come out of it, the name flickers on like a bulb, then a short rest
const FLY_MS = 320; // keep equal to --dur-slow

/**
 * Opening screen, on the first homepage load of a browser session and nowhere else: one node comes on, two come out of it, and the
 * name comes on like a bulb (on, dim, off, on), then the mark and name fly into the masthead's own and the page is there. The page is already in the HTML underneath; this only covers it.
 * An inline script in the layout sets `data-splash` on <html> before paint (only on the homepage, never for reduced motion or
 * automation); without it the overlay never shows. A click or key skips it.
 */
export default function Splash() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-splash")) return;
    const el = document.querySelector<HTMLElement>(".splash");
    const close = () => {
      const title = document.querySelector<HTMLElement>(".masthead-title");
      const markTo = title?.querySelector("svg")?.getBoundingClientRect();
      const wordTo = title?.querySelector("h1")?.getBoundingClientRect();
      const mark = el?.querySelector<HTMLElement>(".splash-mark");
      const word = el?.querySelector<HTMLElement>(".splash-word");
      el?.classList.add("is-leaving");
      // Fly the mark and the name each onto the masthead's own, when it is on screen; otherwise the backdrop just fades.
      if (title && markTo && wordTo && mark && word && wordTo.bottom > 0 && wordTo.top < window.innerHeight) {
        const fly = (from: HTMLElement, to: DOMRect) => {
          const f = from.getBoundingClientRect();
          const dx = to.left + to.width / 2 - (f.left + f.width / 2);
          const dy = to.top + to.height / 2 - (f.top + f.height / 2);
          from.style.transform = `translate(${dx}px, ${dy}px) scale(${to.width / f.width})`;
        };
        title.classList.add("is-landing");
        fly(mark, markTo);
        fly(word, wordTo);
        const land = () => {
          root.removeAttribute("data-splash");
          title.classList.remove("is-landing");
        };
        // Hand over when the name has really arrived (the transition starts a frame after the class); the timer is the fallback.
        word.addEventListener("transitionend", land, { once: true });
        timers.push(window.setTimeout(land, FLY_MS + 100));
        return;
      }
      timers.push(window.setTimeout(() => root.removeAttribute("data-splash"), FLY_MS));
    };
    const timers = [window.setTimeout(close, HOLD_MS)];
    const skip = () => {
      timers.forEach(clearTimeout);
      document.querySelector(".masthead-title")?.classList.remove("is-landing");
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
