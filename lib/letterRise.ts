// Header names (the homepage wordmark, a topic's title) rise into the bar one letter at a time as the page heading scrolls under it.
const RANGE = 120; // px of scroll over which the whole name arrives
const SOFT = 3; // how many letters are mid-rise at once

/** 0 to 1 arrival of item i of n, for overall progress p. Item 0 starts first. */
export const riseQ = (p: number, i: number, n: number) => Math.min(1, Math.max(0, (p * (n + SOFT) - i) / SOFT));

/**
 * 0 while the heading's bottom edge is RANGE or more below the header, 1 once it touches it. pageBottom is that edge's
 * distance from the top of the page: the range is capped by it, so at scroll position 0 the progress is exactly 0.
 */
export const headingProgress = (bottom: number, header: number, pageBottom: number) => {
  const range = Math.max(1, Math.min(RANGE, pageBottom - header));
  return Math.min(1, Math.max(0, 1 - (bottom - header) / range));
};

/** Drives every [data-rise] child of root from h1's scroll position (opacity and transform only). Returns a cleanup. */
export function trackRise(h1: HTMLElement, root: HTMLElement, onProgress?: (p: number) => void) {
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-rise]"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  const apply = () => {
    raf = 0;
    const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    const bottom = h1.getBoundingClientRect().bottom;
    let p = headingProgress(bottom, header, bottom + window.scrollY);
    if (reduce) p = p >= 0.5 ? 1 : 0; // no travel: the name is simply there or not
    items.forEach((el, i) => {
      const q = riseQ(p, i, items.length);
      el.style.opacity = String(q);
      el.style.transform = `translateY(${(1 - q) * 10}px)`;
    });
    onProgress?.(p);
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  apply();
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    cancelAnimationFrame(raf);
    // The logo outlives the homepage: leave its letters visible on other pages.
    items.forEach((el) => {
      el.style.opacity = "";
      el.style.transform = "";
    });
  };
}
