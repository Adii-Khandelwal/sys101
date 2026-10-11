"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  OLD_CONCEPT_KEY,
  OLD_POSTS_KEY,
  PROGRESS_KEY,
  emptyProgress,
  loadProgress,
  syncRead,
  type LessonMeta,
  type Progress,
} from "./lessonStore";

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

// ── Lesson progress (topics in the lesson format) ─────────────────────────
// Stored as one versioned object (see lib/lessonStore.ts). The read list
// above stays the single flag the map and index use; for lesson topics it is
// derived from isTopicRead on every change, so no other code needs to know.


const safeGet = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage blocked: the page still renders, progress just is not kept
  }
};

let progressCache: { raw: string; value: Progress } | null = null;

function getProgress(): Progress {
  const raw = [PROGRESS_KEY, OLD_CONCEPT_KEY, OLD_POSTS_KEY].map((k) => safeGet(k) ?? "").join("\u0000");
  if (progressCache?.raw !== raw) progressCache = { raw, value: loadProgress(safeGet) };
  return progressCache.value;
}

const SERVER_PROGRESS = emptyProgress();

function saveProgress(p: Progress) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    // storage unavailable
  }
}

/** Progress for one lesson topic, plus an update function that keeps the read flag in step. */
export function useLesson(meta: LessonMeta) {
  const progress = useSyncExternalStore(subscribe, getProgress, () => SERVER_PROGRESS);

  const update = useCallback(
    (f: (p: Progress) => Progress) => {
      const current = getProgress();
      const next = f(current);
      if (next === current) return; // nothing changed: no write, no re-render
      saveProgress(next);
      write(syncRead([...getSnapshot()], next, meta)); // notifies this tab; other tabs get the storage event
    },
    [meta],
  );

  // On first visit after the upgrade: store the migrated v1 progress, and make
  // the read flag agree with the current rule.
  useEffect(() => {
    if (safeGet(PROGRESS_KEY) === null) saveProgress(getProgress());
    const read = getSnapshot();
    const synced = syncRead([...read], getProgress(), meta);
    if (synced.length !== read.length) write(synced);
  }, [meta]);

  return { progress, update };
}

// The last section viewed per topic as it was when this page loaded, before
// scrolling on this visit updates it, so "Continue where you left off" points
// to the previous visit.
const lastAtLoad: Record<string, string> =
  typeof window === "undefined"
    ? {}
    : Object.fromEntries(
        Object.entries(getProgress().topics).flatMap(([slug, t]) => (t.last ? [[slug, t.last]] : [])),
      );

export function lastViewedOnLoad(slug: string): string | undefined {
  return lastAtLoad[slug];
}

/** Replace all progress, for import. */
export function replaceProgress(p: Progress, read: string[]) {
  saveProgress(p);
  write(read);
}
