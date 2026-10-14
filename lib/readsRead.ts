import { useCallback, useSyncExternalStore } from "react";

// Which Great reads you have marked as read. Its own key, apart from the topic progress store: a read here is never a topic unit.
// Stored only in this browser's localStorage, tolerant of missing or corrupt data, synced across tabs.
const KEY = "sys101:reads-read";
const CHANGE = "sys101:reads-read-change";
const EMPTY: readonly string[] = [];

let cachedRaw: string | null = null;
let cached: readonly string[] = EMPTY;

function snapshot(): readonly string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {} // storage blocked: nothing is remembered
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      cached = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : EMPTY;
    } catch {
      cached = EMPTY;
    }
  }
  return cached;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

function write(ids: readonly string[]) {
  try {
    if (ids.length) window.localStorage.setItem(KEY, JSON.stringify(ids));
    else window.localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(CHANGE));
}

/** Ids of the reads marked as read (empty on the server and on first render) and a toggle. */
export function useReadReads() {
  const ids = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const now = snapshot();
    write(now.includes(id) ? now.filter((x) => x !== id) : [...now, id]);
  }, []);
  return [ids, toggle] as const;
}

/** "Reset all progress" on /data also clears these. */
export const clearReadReads = () => write([]);
