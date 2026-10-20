"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { FOUND_MS, findLine, takeFind } from "@/lib/findOnPage";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * After a click on a search result, scrolls to the line that matched and highlights it for two seconds. The highlight
 * is a background colour (`.is-found`) that is removed after FOUND_MS. Without JavaScript the link still
 * opens the right section.
 */
export default function FindOnPage() {
  const pathname = usePathname();
  useEffect(() => {
    const found = takeFind(pathname);
    if (!found) return;
    let frame = 0;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let line: Element | null = null;
    const look = () => {
      let id = "";
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {}
      const root = document.body;
      line = findLine(root, found.words, found.hint, id ? document.getElementById(id) : null);
      if (!line) {
        if (++tries < 30) frame = requestAnimationFrame(look); // the page may still be drawing
        return;
      }
      line.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      line.classList.add("is-found");
      timer = setTimeout(() => line?.classList.remove("is-found"), FOUND_MS);
    };
    frame = requestAnimationFrame(look);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      line?.classList.remove("is-found");
    };
  }, [pathname]);
  return null;
}
