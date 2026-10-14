const RANGE = 120; // px of scroll over which a name fades in

/**
 * 0 to 1 as the heading whose bottom edge is `bottom` (from the top of the page) passes under the header. A heading that sits so
 * near the end of the page that it never reaches the header counts as arrived at the last scroll position (`max`), so the
 * final headings still take turns instead of staying half shown together.
 */
export const fadeProgress = (scroll: number, bottom: number, header: number, max: number) => {
  if (max <= 0) return 0; // the page cannot scroll, so no heading has passed under the bar (a 404 or a short page)
  const reach = Math.min(bottom - header, Math.max(0, max));
  if (reach <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - (reach - scroll) / Math.min(RANGE, reach)));
};

/**
 * Fades the top bar's copy of a heading in as that heading scrolls under the sticky header, and out again as the next heading
 * (when given) arrives, so the bar always shows the latest heading that has passed. Opacity and a few pixels of transform only,
 * driven by scroll position; reduced motion switches instantly at the halfway point. Returns a cleanup.
 */
export function trackFade(heading: HTMLElement, el: HTMLElement, next?: HTMLElement | null) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let header = 0;
  let bottom = 0; // the heading's bottom edge, from the top of the page
  let nextBottom = 0;
  let max = 0; // the last scroll position
  let raf = 0;
  let dead = false;

  const measure = () => {
    header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    max = document.documentElement.scrollHeight - window.innerHeight;
    bottom = heading.getBoundingClientRect().bottom + window.scrollY;
    nextBottom = next ? next.getBoundingClientRect().bottom + window.scrollY : 0;
  };
  const apply = () => {
    raf = 0;
    if (dead) return;
    const p = fadeProgress(window.scrollY, bottom, header, max);
    const gone = next ? fadeProgress(window.scrollY, nextBottom, header, max) : 0;
    let o = p * (1 - gone);
    if (reduce) o = o >= 0.5 ? 1 : 0;
    el.style.opacity = String(o);
    el.style.transform = `translateY(${(1 - o) * 6}px)`;
  };
  const schedule = () => {
    if (!raf && !dead) raf = requestAnimationFrame(apply);
  };
  const remeasure = () => {
    measure();
    schedule();
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", remeasure);
  void document.fonts?.ready.then(remeasure); // heading positions move when the web font arrives
  measure();
  apply();
  return () => {
    dead = true;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", remeasure);
    cancelAnimationFrame(raf);
    el.style.opacity = el.style.transform = "";
  };
}
