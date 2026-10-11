"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { prefersReducedMotion } from "@/lib/motion";
import { logoScrollsInPlace, scrollBehavior } from "@/lib/scrollTop";

/** Three nodes joined like a tiny prerequisite graph: two on the left, one on the right. */
export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg className="logo-mark" viewBox="0 0 24 20" width={size * 1.2} height={size} aria-hidden="true" focusable="false">
      <title>sys101 mark</title>
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
  return (
    <Link
      href="/"
      className="logo"
      aria-label="sys101, home"
      id="site-logo"
      onClick={(e) => {
        if (!logoScrollsInPlace(pathname)) return; // go home; the map restores its saved view
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: scrollBehavior(prefersReducedMotion()) });
      }}
    >
      <LogoMark />
      <span className="logo-word">sys101</span>
    </Link>
  );
}
