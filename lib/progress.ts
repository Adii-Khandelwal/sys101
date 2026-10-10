"use client";

import { useCallback, useSyncExternalStore } from "react";

// Reading progress lives only in this browser's localStorage. Nothing is sent anywhere.
const KEY = "sys101:read";
const CHANGE = "sys101:progress";
const EMPTY: readonly string[] = [];

let cachedRaw: string | null = null;
let cachedSlugs: readonly string[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null; // storage blocked (private mode, disabled site data)
  }
}

function getSnapshot(): readonly string[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      cachedSlugs = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : EMPTY;
    } catch {
      cachedSlugs = EMPTY;
    }
  }
  return cachedSlugs;
}

function subscribe(onChange: () => void) {
  // `storage` fires for other tabs; CHANGE fires for this one.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

function write(slugs: readonly string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {
    // Storage unavailable: the toggle simply won't persist.
  }
  window.dispatchEvent(new Event(CHANGE));
}

/** Slugs of topics marked as read. Empty on the server and on first render. */
export function useReadTopics() {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function useIsRead(slug: string) {
  const read = useReadTopics();
  const isRead = read.includes(slug);
  const toggle = useCallback(() => {
    const current = getSnapshot();
    write(current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]);
  }, [slug]);
  return [isRead, toggle] as const;
}
