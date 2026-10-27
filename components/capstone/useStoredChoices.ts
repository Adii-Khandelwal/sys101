"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "sys101:capstone-change";
// "2": options were reordered (answers are stored by position), so picks saved under "sys101:capstone:" no longer match and are dropped.
const PREFIX = "sys101:capstone2:";
const OLD_PREFIX = "sys101:capstone:";
// When storage is blocked or full, picks last for the visit in this map.
const memory: Record<string, string> = {};

/** Forget every capstone answer (used by "Reset everything" on /data). */
export function clearCapstoneChoices() {
  for (const k of Object.keys(memory)) delete memory[k];
  try {
    for (const k of Object.keys(window.localStorage).filter((x) => x.startsWith(PREFIX) || x.startsWith(OLD_PREFIX))) window.localStorage.removeItem(k);
  } catch {
    // Storage unavailable: nothing saved to clear.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The reader's picks for one capstone, kept in localStorage (try/catch: storage may be blocked) and shared by every island on the page. */
export function useStoredChoices(slug: string) {
  const key = PREFIX + slug;
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      window.addEventListener(EVENT, cb);
      return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener(EVENT, cb);
      };
    },
    () => {
      try {
        return window.localStorage.getItem(key) ?? memory[key] ?? "";
      } catch {
        return memory[key] ?? "";
      }
    },
    () => "",
  );
  let picks: Record<string, number> = {};
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") picks = parsed;
  } catch {
    // Corrupt value: start empty.
  }
  const set = useCallback(
    (id: string, index: number | null) => {
      const next = { ...picks };
      if (index === null) delete next[id];
      else next[id] = index;
      memory[key] = JSON.stringify(next);
      try {
        window.localStorage.setItem(key, memory[key]);
      } catch {
        // Storage unavailable: the pick lasts until the page is left.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, raw],
  );
  return [picks, set] as const;
}
