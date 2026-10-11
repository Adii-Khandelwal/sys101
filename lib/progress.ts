"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  OLD_CONCEPT_KEY,
  OLD_POSTS_KEY,
  PROGRESS_KEY,
  emptyProgress,
  loadProgress,
  parseProgress,
  syncRead,
  topicOf,
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

/**
 * Set several topics' read flag at once, for "mark a whole group". Marks the
 * read list directly, the same flag the map and index use; a topic page visit
 * keeps it as long as that topic has no partial tracked progress (syncRead).
 */
export function markTopics(slugs: readonly string[], read: boolean) {
  const current = getSnapshot();
  const set = new Set(current);
  for (const s of slugs) (read ? set.add(s) : set.delete(s));
  write([...set]);
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
      if (trackedChanged(current, next, meta)) stampUpdated([meta.slug]);
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

/** Replace all progress, for import and reset. `updated` replaces the change dates when given. */
export function replaceProgress(p: Progress, read: string[], updated?: Record<string, string>) {
  saveProgress(p);
  if (updated) saveUpdated(updated);
  write(read);
}

// ── Change dates and storage health, for the Your data page ──────────────
// Dates live beside the progress object, under their own key, so the
// progress format itself is unchanged. Visits do not count as changes.

const UPDATED_KEY = "sys101:updated";

function trackedChanged(a: Progress, b: Progress, meta: LessonMeta) {
  const [x, y] = [topicOf(a, meta.slug), topicOf(b, meta.slug)];
  const mine = (p: Progress) => p.posts.filter((id) => meta.postIds.includes(id)).sort().join();
  return x.done.join() !== y.done.join() || JSON.stringify(x.answers) !== JSON.stringify(y.answers) || mine(a) !== mine(b);
}

let updatedCache: { raw: string; value: Record<string, string> } | null = null;

function getUpdated(): Record<string, string> {
  const raw = safeGet(UPDATED_KEY) ?? "";
  if (updatedCache?.raw !== raw) {
    let value: Record<string, string> = {};
    try {
      const v = raw ? JSON.parse(raw) : {};
      if (v && typeof v === "object" && !Array.isArray(v))
        value = Object.fromEntries(Object.entries(v).filter((e): e is [string, string] => typeof e[1] === "string"));
    } catch {
      // damaged dates only cost the dates
    }
    updatedCache = { raw, value };
  }
  return updatedCache.value;
}

function saveUpdated(v: Record<string, string>) {
  try {
    window.localStorage.setItem(UPDATED_KEY, JSON.stringify(v));
  } catch {
    // storage unavailable
  }
}

export function stampUpdated(slugs: string[], now = new Date()) {
  const next = { ...getUpdated() };
  for (const s of slugs) next[s] = now.toISOString();
  saveUpdated(next);
}

export type StorageStatus = "ok" | "empty" | "blocked" | "corrupt";

function getStatus(): StorageStatus {
  try {
    const probe = "sys101:probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
  } catch {
    return "blocked";
  }
  const raw = safeGet(PROGRESS_KEY);
  if (raw !== null && parseProgress(raw) === null) return "corrupt";
  const p = getProgress();
  return Object.keys(p.topics).length || p.posts.length || getSnapshot().length ? "ok" : "empty";
}

type DataState = { status: StorageStatus; progress: Progress; read: readonly string[]; updated: Record<string, string> };
let dataCache: DataState | null = null;
const SERVER_DATA: DataState = { status: "empty", progress: SERVER_PROGRESS, read: EMPTY, updated: {} };

function getData(): DataState {
  const next = { status: getStatus(), progress: getProgress(), read: getSnapshot(), updated: getUpdated() };
  if (
    dataCache &&
    dataCache.status === next.status &&
    dataCache.progress === next.progress &&
    dataCache.read === next.read &&
    dataCache.updated === next.updated
  )
    return dataCache;
  return (dataCache = next);
}

/** Everything the Your data page shows, kept live across tabs. */
export function useAllProgress() {
  return useSyncExternalStore(subscribe, getData, () => SERVER_DATA);
}

/**
 * Topics the reader has deliberately started but not finished: a section marked
 * done, or a quiz question answered. Scrolling a section into view ("visited")
 * does not count, so merely opening a topic never marks it in progress.
 */
export function inProgressSlugs(progress: Progress, read: readonly string[]): string[] {
  return Object.entries(progress.topics)
    .filter(([slug, t]) => !read.includes(slug) && (t.done.length > 0 || Object.keys(t.answers).length > 0))
    .map(([slug]) => slug);
}

/** Live set of in-progress topic slugs, for the map's "currently reading" marker. */
export function useInProgressTopics(): string[] {
  const { progress, read } = useAllProgress();
  return inProgressSlugs(progress, read);
}
