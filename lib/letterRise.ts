// The page heading's letters fly into the top bar as you scroll: the homepage's "sys101" into the wordmark, a topic's title into
// the header beside the logo. Each letter keeps its place in the heading and is moved with a transform only (translate and scale),
// one letter after another; once it has arrived it stays pinned in the bar.
const RANGE = 120; // px of scroll over which the whole name arrives
const SOFT = 3; // how many letters are mid-flight at once

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

/** Where a letter is at arrival q: moved by (dx, dy) and scaled to k, both about its centre. */
export const flyTransform = (dx: number, dy: number, k: number, q: number) =>
  `translate(${dx * q}px, ${dy * q}px) scale(${1 + (k - 1) * q})`;

const fontSize = (el: Element) => parseFloat(getComputedStyle(el).fontSize);

/**
 * Splits h1 into letters and flies each one to the matching [data-ghost] letter inside root (the header's invisible
 * copy of the same text). [data-fade] items in root fade in with the first letters. A letter whose target lies past
 * root's right edge (a long title on a phone) fades out instead. Returns a cleanup that puts everything back.
 */
export function trackFly(h1: HTMLElement, root: HTMLElement, onProgress?: (p: number) => void) {
  const ghosts = Array.from(root.querySelectorAll<HTMLElement>("[data-ghost]"));
  const fades = Array.from(root.querySelectorAll<HTMLElement>("[data-fade]"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const text = h1.textContent ?? "";
  const original = Array.from(h1.childNodes);
  const slots: HTMLElement[] = [];
  const frag = document.createDocumentFragment();
  text.split(" ").forEach((word, wi) => {
    if (wi) frag.append(" ");
    const w = document.createElement("span");
    w.className = "fly-word";
    w.setAttribute("aria-hidden", "true");
    for (const c of word) {
      const slot = document.createElement("span");
      slot.className = "fly-slot";
      const letter = document.createElement("span");
      letter.className = "fly-letter";
      letter.textContent = c;
      slot.append(letter);
      w.append(slot);
      slots.push(slot);
    }
    frag.append(w);
  });
  h1.replaceChildren(frag);
  h1.setAttribute("aria-label", text);
  ghosts.forEach((g) => (g.style.opacity = "0")); // the flying letters are the visible ones

  const n = Math.min(slots.length, ghosts.length);
  const letterOf = (i: number) => slots[i].firstElementChild as HTMLElement;
  const undock = (i: number) => {
    const letter = letterOf(i);
    if (!letter.dataset.docked) return;
    delete letter.dataset.docked;
    slots[i].style.width = slots[i].style.height = slots[i].style.verticalAlign = "";
    letter.style.position = letter.style.left = letter.style.top = "";
  };

  // Where everything is, measured once (and again on resize or when the font arrives), so scrolling only does arithmetic:
  // reading layout every frame is what made the flight choppy.
  let header = 0;
  let pageBottom = 0; // the heading's bottom edge, from the top of the page
  let k = 1;
  let boxRight = 0;
  let geo: { x: number; y: number; w: number; h: number; tx: number; ty: number; fits: boolean }[] = [];
  const measure = () => {
    for (let i = 0; i < n; i++) undock(i); // docked letters change their slot's height, so measure undocked
    header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    pageBottom = h1.getBoundingClientRect().bottom + window.scrollY;
    boxRight = root.getBoundingClientRect().right;
    k = n ? fontSize(ghosts[0]) / fontSize(slots[0]) : 1;
    geo = slots.slice(0, n).map((slot, i) => {
      const a = slot.getBoundingClientRect();
      const t = ghosts[i].getBoundingClientRect();
      return {
        x: a.left + a.width / 2 + window.scrollX, // centre, in page coordinates
        y: a.top + a.height / 2 + window.scrollY,
        w: a.width,
        h: a.height,
        tx: t.left + t.width / 2, // target centre, in the viewport (the header does not scroll)
        ty: t.top + t.height / 2,
        fits: t.right <= boxRight + 0.5,
      };
    });
  };

  const goal = () => {
    const p = headingProgress(pageBottom - window.scrollY, header, pageBottom);
    return reduce ? (p >= 0.5 ? 1 : 0) : p; // reduced motion: no travel, the name is simply there or not
  };
  let shown = 0; // the progress on screen: it eases toward the scroll position, so a jump of the wheel does not make a jump of the letters
  let last = 0;
  let raf = 0;
  let dead = false; // set by the cleanup: a late font or frame callback must not touch the header afterwards
  const apply = (now = performance.now()) => {
    raf = 0;
    if (dead) return;
    const target = goal();
    const dt = Math.min(64, now - last);
    last = now;
    shown = reduce || Math.abs(target - shown) < 0.002 ? target : shown + (target - shown) * (1 - Math.exp(-dt / 70));
    for (let i = 0; i < slots.length; i++) {
      const letter = letterOf(i);
      const q = riseQ(shown, i, n);
      const g = geo[i];
      if (!g || !g.fits) {
        letter.style.transform = "";
        letter.style.opacity = String(1 - q);
        continue;
      }
      if (shown >= 1) {
        // Arrived: pin the letter to the viewport. A letter that still scrolls with the page lags the scroll by a frame and jitters.
        if (!letter.dataset.docked) {
          slots[i].style.width = `${g.w}px`; // the empty slot keeps the heading's line from reflowing
          slots[i].style.height = `${g.h}px`;
          slots[i].style.verticalAlign = "top"; // an empty inline-block sits on its bottom edge and would make the line taller
          letter.dataset.docked = "1";
          letter.style.position = "fixed";
          letter.style.left = `${g.tx - g.w / 2}px`;
          letter.style.top = `${g.ty - g.h / 2}px`;
          letter.style.transform = `scale(${k})`;
        }
        continue;
      }
      undock(i);
      letter.style.transform = flyTransform(g.tx - (g.x - window.scrollX), g.ty - (g.y - window.scrollY), k, q);
    }
    const f = Math.min(1, shown * 3);
    fades.forEach((el) => {
      el.style.opacity = String(f);
      el.style.transform = `translateY(${(1 - f) * 10}px)`;
    });
    onProgress?.(shown);
    if (shown !== target) raf = requestAnimationFrame(apply); // keep easing after the scrolling stops
  };
  const schedule = () => {
    if (!raf && !dead) raf = requestAnimationFrame(apply);
  };
  const remeasure = () => {
    if (dead) return;
    measure();
    schedule();
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", remeasure);
  void document.fonts?.ready.then(remeasure); // letter widths change when the web font arrives
  measure();
  shown = goal(); // start where the page is, with no easing (a reload part-way down the page)
  apply();
  return () => {
    dead = true;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", remeasure);
    cancelAnimationFrame(raf);
    // The logo outlives the homepage: put the heading and the header's letters back as they were.
    h1.replaceChildren(...original);
    h1.removeAttribute("aria-label");
    ghosts.forEach((g) => (g.style.opacity = ""));
    fades.forEach((el) => {
      el.style.opacity = "";
      el.style.transform = "";
    });
  };
}
