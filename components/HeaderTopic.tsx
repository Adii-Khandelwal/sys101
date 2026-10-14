"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { trackFly } from "@/lib/letterRise";
import { usePathname } from "next/navigation";

/**
 * On topic pages, the topic's name next to the logo, flown in from its heading
 * letter by letter as the heading scrolls under the sticky header. Decorative for screen readers: the page
 * heading already names the topic.
 */
export default function HeaderTopic() {
  const pathname = usePathname();
  const [heading, setHeading] = useState<HTMLElement | null>(null);
  const title = heading?.textContent ?? null;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setHeading(null);
    if (!pathname.startsWith("/topic/")) return;
    let timer = 0;
    const start = performance.now();
    // After a client-side navigation the new page may still be loading: wait for its heading.
    const attach = () => {
      const h1 = document.querySelector<HTMLElement>("article h1");
      if (!h1) {
        if (performance.now() - start < 3000) timer = window.setTimeout(attach, 50);
        return;
      }
      setHeading(h1);
    };
    attach();
    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

  // Runs once the letters are in the DOM, before paint, so the title never shows in full at the top of the page.
  useLayoutEffect(() => {
    if (heading && ref.current) return trackFly(heading, ref.current);
  }, [heading]);

  if (!title) return null;
  return (
    <span ref={ref} className="header-topic" aria-hidden="true">
      <span className="header-topic-rule" data-fade />
      {[...title].map((c, i) => (
        <span key={i} className="rise-letter" data-ghost={c === " " ? undefined : ""}>
          {c === " " ? "\u00a0" : c}
        </span>
      ))}
    </span>
  );
}
