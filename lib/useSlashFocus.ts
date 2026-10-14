import { useEffect, type RefObject } from "react";

/** Enter in a filter box moves focus to the first visible result link, as Enter opens the first result on the homepage. */
export function focusFirstResult(selector: string) {
  const link = [...document.querySelectorAll<HTMLAnchorElement>(selector)].find((a) => a.offsetParent !== null);
  link?.focus();
}

/** "/" focuses a page's search box, unless the reader is already typing somewhere or holds a shortcut key. */
export function useSlashFocus(ref: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onSlash = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener("keydown", onSlash);
    return () => window.removeEventListener("keydown", onSlash);
  }, [ref]);
}
