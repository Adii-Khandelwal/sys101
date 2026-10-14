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
  let raf = 0;
  const apply = () => {
    raf = 0;
    const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    const bottom = h1.getBoundingClientRect().bottom;
    let p = headingProgress(bottom, header, bottom + window.scrollY);
    if (reduce) p = p >= 0.5 ? 1 : 0; // no travel: the name is simply there or not
    // Read every position first, then write, so the browser lays out once per frame.
    const boxRight = root.getBoundingClientRect().right;
    const k = n ? fontSize(ghosts[0]) / fontSize(slots[0]) : 1;
    const from = slots.slice(0, n).map((s) => s.getBoundingClientRect());
    const to = ghosts.slice(0, n).map((g) => g.getBoundingClientRect());
    slots.forEach((slot, i) => {
      const letter = slot.firstElementChild as HTMLElement;
      const q = riseQ(p, i, n);
      if (i >= n || to[i].right > boxRight + 0.5) {
        letter.style.transform = "";
        letter.style.opacity = String(1 - q);
        return;
      }
      const cx = to[i].left + to[i].width / 2;
      const cy = to[i].top + to[i].height / 2;
      if (p >= 1) {
        // Arrived: pin the letter to the viewport. Re-aiming a letter that scrolls with the page lags the scroll by a frame and jitters.
        if (!letter.dataset.docked) {
          slot.style.width = `${from[i].width}px`; // the empty slot keeps the heading's line from reflowing
          slot.style.height = `${from[i].height}px`;
          slot.style.verticalAlign = "top"; // an empty inline-block sits on its bottom edge and would make the line taller
          letter.dataset.docked = "1";
          letter.style.position = "fixed";
        }
        letter.style.left = `${cx - from[i].width / 2}px`;
        letter.style.top = `${cy - from[i].height / 2}px`;
        letter.style.transform = `scale(${k})`;
        return;
      }
      if (letter.dataset.docked) {
        delete letter.dataset.docked;
        slot.style.width = slot.style.height = slot.style.verticalAlign = letter.style.position = letter.style.left = letter.style.top = "";
      }
      letter.style.transform = flyTransform(cx - (from[i].left + from[i].width / 2), cy - (from[i].top + from[i].height / 2), k, q);
    });
    const f = Math.min(1, p * 3);
    fades.forEach((el) => {
      el.style.opacity = String(f);
      el.style.transform = `translateY(${(1 - f) * 10}px)`;
    });
    onProgress?.(p);
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  void document.fonts?.ready.then(schedule); // letter widths change when the web font arrives
  apply();
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
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
