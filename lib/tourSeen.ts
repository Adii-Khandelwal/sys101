// Remembers that a reader has taken or skipped a guided tour, so its link stops showing on every visit.
// One small versioned object in localStorage; every read and write is guarded, and a missing or damaged value
// means "not seen". Not part of the progress store, the export or the import.
import type { TourId } from "./tours";

export const TOURS_KEY = "sys101:tours";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type Seen = { version: 1; seen: Partial<Record<TourId, true>> };

const empty = (): Seen => ({ version: 1, seen: {} });

export function parseSeen(raw: string | null): Seen {
  try {
    const v = raw ? JSON.parse(raw) : null;
    if (v?.version !== 1 || typeof v.seen !== "object" || v.seen === null) return empty();
    return { version: 1, seen: { ...(v.seen.home === true ? { home: true as const } : {}), ...(v.seen.topic === true ? { topic: true as const } : {}) } };
  } catch {
    return empty();
  }
}

const local = (): Store | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function loadSeen(store: Store | null = local()): Seen {
  try {
    return parseSeen(store?.getItem(TOURS_KEY) ?? null);
  } catch {
    return empty();
  }
}

export function markSeen(id: TourId, store: Store | null = local()) {
  try {
    store?.setItem(TOURS_KEY, JSON.stringify({ version: 1, seen: { ...loadSeen(store).seen, [id]: true } }));
  } catch {
    // storage blocked: the link simply shows again next visit
  }
}

export function forgetSeen(store: Store | null = local()) {
  try {
    store?.removeItem(TOURS_KEY);
  } catch {
    // nothing to clear
  }
}
