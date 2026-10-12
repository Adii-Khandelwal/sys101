"use client";

import { useEffect } from "react";
import { DURATION } from "@/lib/motion";

/**
 * Highlights the section the URL fragment points at, briefly: /background#caching. The browser does the scrolling.
 * The highlight is an overlay whose opacity fades out over --dur-slow, which is 0ms under prefers-reduced-motion, so
 * there it simply appears and disappears. Without JavaScript the page still scrolls to the section.
 */
export default function HighlightTarget({ selector }: { selector: string }) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current: Element | null = null;
    const clear = () => {
      clearTimeout(timer);
      current?.classList.remove("is-highlighted");
      current = null;
    };
    const apply = () => {
      clear();
      let id = "";
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (!id) return;
      const el = document.getElementById(id);
      if (!el?.matches(selector)) return;
      current = el;
      el.classList.add("is-highlighted");
      timer = setTimeout(clear, DURATION.pulse);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => {
      window.removeEventListener("hashchange", apply);
      clear();
    };
  }, [selector]);
  return null;
}
