"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoScrollsInPlace } from "@/lib/scrollTop";
import { scrollToTop } from "./BackToTop";
import { trackRise } from "@/lib/letterRise";

/** Three nodes joined like a tiny prerequisite graph: two on the left, one on the right. */
export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg className="logo-mark" viewBox="0 0 24 20" width={size * 1.2} height={size} aria-hidden="true" focusable="false">
      <path d="M5,4 L19,10 M5,16 L19,10" className="logo-line" />
      <circle cx="5" cy="4" r="2.6" className="logo-node" />
      <circle cx="5" cy="16" r="2.6" className="logo-node" />
      <circle cx="19" cy="10" r="3" className="logo-node is-accent" />
    </svg>
  );
}

/** Site logo, top left on every page. On the homepage it only scrolls to the top. */
export default function Logo() {
  const pathname = usePathname();
  // The homepage opens with the big "sys101" heading; the wordmark rises into the bar letter by letter as that heading scrolls under it.
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const h1 = logoScrollsInPlace(pathname) ? document.querySelector<HTMLElement>(".masthead h1") : null;
    setHidden(!!h1);
    if (!h1 || !ref.current) return;
    return trackRise(h1, ref.current, (p) => setHidden(p < 0.5));
  }, [pathname]);
  return (
    <Link
      ref={ref}
      href="/"
      prefetch={false}
      className={`logo${hidden ? " is-hidden" : ""}`}
      inert={hidden}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      aria-label="sys101, home"
      id="site-logo"
      onClick={(e) => {
        if (!logoScrollsInPlace(pathname)) return; // go home; the map restores its saved view
        e.preventDefault();
        scrollToTop();
      }}
    >
      <span className="logo-rise" data-rise>
        <LogoMark />
      </span>
      <span className="logo-word">
        {[..."sys101"].map((c, i) => (
          <span key={i} className="rise-letter" data-rise>
            {c}
          </span>
        ))}
      </span>
    </Link>
  );
}
