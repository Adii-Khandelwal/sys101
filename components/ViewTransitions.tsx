"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/lib/motion";

type Doc = Document & { startViewTransition?: (cb: () => Promise<void>) => unknown };

/**
 * Resolve once the new page is really in the DOM: the URL has changed and no
 * loading skeleton (aria-busy) is present. Polls with a timer, because the
 * browser pauses rendering (and requestAnimationFrame) while a view
 * transition waits for this. Capped so a slow page never holds the old one.
 */
function pageReady(pathname: string, cap = 1000) {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const check = () => {
      const arrived = location.pathname === pathname && !document.querySelector('[aria-busy="true"]');
      if (arrived || performance.now() - start > cap) resolve();
      else setTimeout(check, 16);
    };
    check();
  });
}

/** Navigate with the page cross-fade where supported, ending only when the new page is ready. */
export function navigateWithTransition(router: { push: (href: string) => void }, href: string) {
  const doc = document as Doc;
  const url = new URL(href, location.href);
  if (!doc.startViewTransition || prefersReducedMotion()) return router.push(href);
  doc.startViewTransition(() => {
    router.push(url.pathname + url.search + url.hash);
    return pageReady(url.pathname);
  });
}

/**
 * Cross-fades between pages with the View Transitions API where supported.
 * Only plain left-clicks on same-site links to another page are wrapped;
 * hash links, new tabs, modified clicks and back/forward are left alone, and
 * browsers without the API navigate exactly as before.
 */
export default function ViewTransitions() {
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const doc = document as Doc;
      if (!doc.startViewTransition || prefersReducedMotion()) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      navigateWithTransition(router, url.href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
