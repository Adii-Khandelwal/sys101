"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth wheel scrolling with Lenis, the library getartcraft.com uses (defaults, wheel only: touch, keys, the scrollbar, the
 * ruler and our own glides stay native). Not under reduced motion. A scrollable box under the pointer (results list, lesson
 * rail, dialog) keeps its own wheel (`allowNestedScroll`).
 */
export default function SmoothWheel() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, allowNestedScroll: true, anchors: false });
    return () => lenis.destroy();
  }, []);
  return null;
}
