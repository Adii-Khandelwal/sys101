"use client";

import { useEffect, useRef, useState } from "react";
import { trackRise } from "@/lib/letterRise";
import { usePathname } from "next/navigation";

/**
 * On topic pages, the topic's name next to the logo, arriving letter by letter
 * as its heading scrolls under the sticky header. Decorative for screen readers: the page
 * heading already names the topic.
 */
export default function HeaderTopic() {
  const pathname = usePathname();
  const [title, setTitle] = useState<string | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setTitle(null);
    if (!pathname.startsWith("/topic/")) return;
    let stop: (() => void) | undefined;
    let timer = 0;
    let done = false;
    const start = performance.now();
    // After a client-side navigation the new page may still be loading: wait for its heading.
    const attach = () => {
      const h1 = document.querySelector<HTMLElement>("article h1");
      if (!h1) {
        if (performance.now() - start < 3000) timer = window.setTimeout(attach, 50);
        return;
      }
      setTitle(h1.textContent);
      // The title (state) renders on the next frame; start tracking once its letters exist.
      requestAnimationFrame(() => {
        if (!done && ref.current) stop = trackRise(h1, ref.current);
      });
    };
    attach();
    return () => {
      done = true;
      window.clearTimeout(timer);
      stop?.();
    };
  }, [pathname]);

  if (!title) return null;
  return (
    <span ref={ref} className="header-topic" aria-hidden="true">
      <span className="header-topic-rule" data-rise />
      {[...title].map((c, i) => (
        <span key={i} className="rise-letter" data-rise>
          {c === " " ? "\u00a0" : c}
        </span>
      ))}
    </span>
  );
}
