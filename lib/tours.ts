// The guided tours (docs/tours.md): step text and the small pure helpers behind the overlay.
// Nothing here touches the DOM, so the tests can run it directly.
import { PHONE } from "./breakpoints";

export type TourId = "home" | "topic";

/** `target` is a data-tour name. `phone` swaps the text, or the target, on a phone; `desktopOnly` drops the step there. */
export type TourStep = {
  target: string;
  title: string;
  text: string;
  desktopOnly?: boolean;
  phone?: { text?: string; target?: string };
};

export const TOURS: Record<TourId, TourStep[]> = {
  home: [
    {
      target: "map",
      title: "The map",
      text: "Read the map left to right. A topic sits to the right of the topics it builds on, so you can start at the left and work across. Click a topic to open it.",
      phone: { text: "This list shows the topics in a suggested reading order, with what each one builds on written under its title. Tap one to open it." },
    },
    {
      target: "states",
      title: "Four states",
      text: "A hollow ring is unread. A thicker ring with a dot is ready: you have read what it builds on. A rust ring with a dot is in progress. A filled rust circle is read.",
      phone: { text: "The mark beside each topic shows where it stands. A hollow ring is unread, a ring with a dot is ready or in progress (the words beside the title say which), and a filled circle is read." },
    },
    {
      target: "view",
      title: "Map or Path",
      text: "Path is the same topics as a list, grouped, with a button to mark a whole group as read. The site remembers your choice.",
      desktopOnly: true,
    },
    {
      target: "search",
      title: "Search",
      text: "Search finds topics, companies and terms. Press / anywhere on the page to jump to the box, Enter to open the first result and Esc to clear it. Type several words with spaces between them and each word you have finished has to appear in the result.",
    },
    {
      target: "your-data",
      title: "Your data",
      text: "Your progress is saved in this browser only, with no account. Export it, import it or reset it on Your data.",
    },
  ],
  topic: [
    {
      target: "jump",
      title: "Two halves",
      text: "The page has two halves: the idea first, then how companies use it. If you already know the idea, Skip to the posts takes you straight there.",
    },
    {
      target: "progress",
      title: "Progress",
      text: "Each section and each post ends with a Mark done button. The count includes the quiz once you have answered every question. A topic is read when all of it is done.",
    },
    {
      target: "check",
      title: "Check yourself",
      text: "Pick an answer and the explanation opens, including why the other options are wrong. Your answers are kept in this browser.",
    },
    {
      target: "posts",
      title: "The posts",
      text: "Each post is rewritten in plain words, with the original linked at the end. If there is a Background link, it lists what the posts assume you already know.",
    },
    {
      target: "exercises",
      title: "Design exercises",
      text: "Try one on your own first. The model answer stays hidden until you open it.",
    },
  ],
};

export type ResolvedStep = { target: string; title: string; text: string };

/** The steps this reader gets: phone wording and targets applied, steps without a visible target dropped. */
export function resolveSteps(id: TourId, phone: boolean, visible: (target: string) => boolean): ResolvedStep[] {
  return TOURS[id].flatMap((s) => {
    if (phone && s.desktopOnly) return [];
    const target = (phone && s.phone?.target) || s.target;
    return visible(target) ? [{ target, title: s.title, text: (phone && s.phone?.text) || s.text }] : [];
  });
}

/** Where a Back or Next press lands: a step index, or null when Next on the last step finishes the tour. */
export function move(index: number, dir: 1 | -1, count: number): number | null {
  const to = index + dir;
  if (to >= count) return null;
  return Math.max(0, to);
}

/** Keys the tooltip answers to, apart from Tab: Esc closes, the arrows step. */
export function keyAction(key: string): "close" | "next" | "back" | null {
  return key === "Escape" ? "close" : key === "ArrowRight" ? "next" : key === "ArrowLeft" ? "back" : null;
}

/** Tab inside the tooltip wraps around its own buttons. Returns the index to focus, or null to leave the key alone. */
export function wrapTab(current: number, count: number, shift: boolean): number | null {
  if (shift && current <= 0) return count - 1;
  if (!shift && current >= count - 1) return 0;
  return null;
}

/** The phone line the CSS and the overlay share. */
export const isPhone = () => typeof window !== "undefined" && window.matchMedia(PHONE).matches;

/** The overlay's hole: a polygon with an even-odd fill, in viewport pixels. */
export function holePath(r: { left: number; top: number; right: number; bottom: number }) {
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${r.left}px ${r.top}px, ${r.left}px ${r.bottom}px, ${r.right}px ${r.bottom}px, ${r.right}px ${r.top}px, ${r.left}px ${r.top}px)`;
}
