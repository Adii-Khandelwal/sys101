"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { scrollBehavior, showBackToTop } from "@/lib/scrollTop";

/** Fixed bottom-right "Back to top", shown only after scrolling well down the page. */
export default function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const update = () => setShown((was) => showBackToTop(window.scrollY, window.innerHeight, was));
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const toTop = () => {
    // Native smooth scrolling stops as soon as the reader scrolls by hand.
    window.scrollTo({ top: 0, behavior: scrollBehavior(prefersReducedMotion()) });
    const target = document.querySelector<HTMLElement>("main h1, article h1, h1") ?? document.getElementById("site-logo");
    if (target) {
      if (target.tagName === "H1" && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  };

  return (
    <button
      type="button"
      className={`back-to-top label${shown ? " is-shown" : ""}`}
      onClick={toTop}
      inert={!shown}
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
    >
      <svg viewBox="0 0 10 12" width="8" height="10" aria-hidden="true" focusable="false">
        <path d="M5,11 L5,1 M1,5 L5,1 L9,5" />
      </svg>
      <span className="back-to-top-text">Back to top</span>
    </button>
  );
}
