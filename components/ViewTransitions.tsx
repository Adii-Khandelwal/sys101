"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { expectGlide, glideToSection, settleGlide, whenVisible } from "@/lib/glide";
import { prefersReducedMotion } from "@/lib/motion";
import { safeDecode } from "@/lib/safeDecode";

type Doc = Document & { startViewTransition?: (cb: () => Promise<void>) => unknown };
type Transition = { finished?: Promise<unknown>; skipTransition?: () => void };

let running: Transition | undefined;

/** Ends the cross-fade early, which shows the live page again instead of the frozen picture of the old one (NavPending needs that to be seen). */
export function skipRunningTransition() {
  running?.skipTransition?.();
}

/**
 * Resolve once the new page is really in the DOM: the URL has changed and no
 * loading skeleton (aria-busy) is present. Polls with a timer, because the
 * browser pauses rendering (and requestAnimationFrame) while a view
 * transition waits for this. Capped so a slow page never holds the old one.
 */
export function pageReady(pathname: string, cap = 1000) {
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

/** After a page that was opened with a #section has loaded: show it from its top, then glide down to the section. */
async function glideToHash(url: URL, token: number) {
  try {
    if (location.pathname !== url.pathname) return; // the reader already went elsewhere (Back, another link): leave that page where it is
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    const id = safeDecode(url.hash.slice(1));
    const target = id ? await whenVisible(id) : null;
    if (target) await glideToSection(target);
  } finally {
    settleGlide(token);
  }
}

/**
 * Navigate with the page cross-fade where supported, ending only when the new page is ready. A link with a #section opens the
 * page at its top (Next is told not to jump to the section) and then glides down to it.
 */
export function navigateWithTransition(router: { push: (href: string, opts?: { scroll?: boolean }) => void }, href: string) {
  const doc = document as Doc;
  const url = new URL(href, location.href);
  const to = url.pathname + url.search + url.hash;
  const opts = url.hash ? { scroll: false } : undefined;
  const token = url.hash ? expectGlide() : 0;
  if (!doc.startViewTransition || prefersReducedMotion()) {
    router.push(to, opts);
    if (url.hash) void pageReady(url.pathname).then(() => glideToHash(url, token));
    return;
  }
  const t = doc.startViewTransition(() => {
    router.push(to, opts);
    return pageReady(url.pathname).then(() => {
      if (url.hash) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); // the new page is captured at its top
    });
  }) as Transition | undefined;
  running = t;
  void t?.finished?.finally(() => {
    if (running === t) running = undefined;
  });
  if (url.hash) void (t?.finished ?? Promise.resolve()).finally(() => glideToHash(url, token));
}

/**
 * Moves the reader through the site: a plain left-click on a link to another page cross-fades where the View Transitions API
 * exists; a link to a #section on this page glides down to it; a link to a #section on another page opens that page at its top
 * and then glides down. New tabs, modified clicks and back/forward are left alone, and browsers without the API navigate as before.
 */
export default function ViewTransitions() {
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const doc = document as Doc;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      if (a.hasAttribute("data-own-transition")) return; // the link runs its own navigation
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) {
        // Same page: a section on it glides there (an unknown or hidden one is left to the browser).
        const target = url.search === location.search && url.hash.length > 1 ? document.getElementById(safeDecode(url.hash.slice(1))) : null;
        if (!target || !target.getClientRects().length) return;
        e.preventDefault();
        history.replaceState(null, "", url.hash);
        void glideToSection(target);
        return;
      }
      if (!doc.startViewTransition && !url.hash) return; // a plain page change: Next does it
      if (prefersReducedMotion() && !url.hash) return;
      e.preventDefault();
      navigateWithTransition(router, url.href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
