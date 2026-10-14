import { DURATION, easeInOut, prefersReducedMotion } from "./motion";

/** Where to scroll so `el` lands just under the sticky header. */
export function anchorTop(el: HTMLElement) {
  const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - header - 16);
}

let stop: (() => void) | null = null;

/**
 * Scrolls the page to `top` the way a reader would, eased over 320ms (up to 700ms for a long way) with the same curve as the
 * other on-screen moves. The reader can stop it by touching, wheeling or pressing a key. Reduced motion jumps. Returns when done.
 */
export function glideTo(top: number): Promise<void> {
  stop?.();
  const from = window.scrollY;
  const to = Math.min(top, document.documentElement.scrollHeight - window.innerHeight);
  const dist = Math.abs(to - from);
  if (prefersReducedMotion() || dist < 2) {
    window.scrollTo({ top: to, behavior: "instant" as ScrollBehavior });
    return Promise.resolve();
  }
  const ms = Math.min(700, Math.max(DURATION.slow, dist * 0.3));
  return new Promise((resolve) => {
    const t0 = performance.now();
    let raf = 0;
    const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
    const end = () => {
      cancelAnimationFrame(raf);
      events.forEach((e) => window.removeEventListener(e, end));
      stop = null;
      resolve();
    };
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      window.scrollTo({ top: from + (to - from) * easeInOut(p), behavior: "instant" as ScrollBehavior });
      if (p < 1) raf = requestAnimationFrame(frame);
      else end();
    };
    events.forEach((e) => window.addEventListener(e, end, { passive: true }));
    stop = end;
    raf = requestAnimationFrame(frame);
  });
}

/** Glides to a section and moves focus to its heading without another jump. */
export function glideToSection(target: HTMLElement) {
  const heading = target.querySelector<HTMLElement>("h2, h3") ?? target;
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  return glideTo(anchorTop(target));
}

/** Waits for an element to be on screen (a page that has just opened may still be loading), up to `cap` ms. */
export function whenVisible(id: string, cap = 1500): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const look = () => {
      const el = document.getElementById(id);
      if (el && el.getClientRects().length) resolve(el);
      else if (performance.now() - t0 > cap) resolve(null);
      else setTimeout(look, 16);
    };
    look();
  });
}
