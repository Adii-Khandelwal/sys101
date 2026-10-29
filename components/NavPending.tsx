"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";
import { skipRunningTransition } from "./ViewTransitions";

const WAIT_MS = 400; // a page that arrives sooner never shows this
const GIVE_UP_MS = 10000;

/**
 * The site's mark, pulsing over the page, when a link to another page has taken longer than WAIT_MS to arrive.
 * Only link clicks start it: a Map node opens its topic with its own bubble (lib/nodeOpen.ts) and never shows this.
 */
export default function NavPending() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  const timers = useRef<number[]>([]);

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setOn(false);
  };

  useEffect(stop, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a instanceof SVGAElement) return; // a Map node runs its own opening; an SVG link's href and target are not strings
      if ((a.target && a.target !== "_self") || a.hasAttribute("download") || a.hasAttribute("data-popover")) return; // a glossary term only opens its popover
      if (a.origin !== location.origin || a.pathname === location.pathname) return;
      if (document.documentElement.hasAttribute("data-splash")) return;
      stop();
      timers.current = [
        window.setTimeout(() => {
          skipRunningTransition(); // the cross-fade holds a still picture of the old page above everything
          setOn(true);
        }, WAIT_MS),
        window.setTimeout(stop, GIVE_UP_MS),
      ];
    };
    const onShow = () => stop(); // back from the back/forward cache
    document.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onShow);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className={`nav-pending${on ? " is-on" : ""}`} aria-hidden={!on} role={on ? "status" : undefined}>
      <span className="nav-pending-mark">
        <LogoMark size={40} />
      </span>
      {on && <span className="visually-hidden">Loading page</span>}
    </div>
  );
}
