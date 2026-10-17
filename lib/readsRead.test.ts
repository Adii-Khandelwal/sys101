import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The store keeps module-level state, so each test loads a fresh copy against a fake window.
function fakeWindow(initial?: string, { blocked = false }: { blocked?: boolean } = {}) {
  const data = new Map<string, string>(initial === undefined ? [] : [["sys101:reads-read", initial]]);
  const storage = {
    getItem: (k: string) => {
      if (blocked) throw new Error("blocked");
      return data.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (blocked) throw new Error("blocked");
      data.set(k, v);
    },
    removeItem: (k: string) => {
      if (blocked) throw new Error("blocked");
      data.delete(k);
    },
  };
  const events: string[] = [];
  vi.stubGlobal("window", { localStorage: storage, dispatchEvent: (e: Event) => events.push(e.type), addEventListener() {}, removeEventListener() {} });
  return { data, events };
}
const load = async () => {
  vi.resetModules();
  return import("./readsRead");
};

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("reads read store", () => {
  it("starts empty with nothing stored", async () => {
    fakeWindow();
    const { readReadsNow } = await load();
    expect(readReadsNow()).toEqual([]);
  });

  it("toggles an id on, then off, and removes the key when empty", async () => {
    const { data, events } = fakeWindow();
    const { toggleRead, readReadsNow } = await load();
    toggleRead("a");
    toggleRead("b");
    expect(readReadsNow()).toEqual(["a", "b"]);
    expect(JSON.parse(data.get("sys101:reads-read")!)).toEqual(["a", "b"]);
    toggleRead("a");
    toggleRead("b");
    expect(readReadsNow()).toEqual([]);
    expect(data.has("sys101:reads-read")).toBe(false);
    expect(events).toHaveLength(4); // every write tells subscribers
  });

  it("clearReadReads empties it", async () => {
    const { data } = fakeWindow(JSON.stringify(["a", "b"]));
    const { clearReadReads, readReadsNow } = await load();
    expect(readReadsNow()).toEqual(["a", "b"]);
    clearReadReads();
    expect(readReadsNow()).toEqual([]);
    expect(data.has("sys101:reads-read")).toBe(false);
  });

  it("ignores corrupt or wrongly shaped data", async () => {
    for (const raw of ["{not json", '{"a":1}', "42", "null"]) {
      fakeWindow(raw);
      const { readReadsNow } = await load();
      expect(readReadsNow(), raw).toEqual([]);
    }
  });

  it("keeps only the strings of a mixed array", async () => {
    fakeWindow(JSON.stringify(["a", 3, null, "b"]));
    const { readReadsNow } = await load();
    expect(readReadsNow()).toEqual(["a", "b"]);
  });

  it("picks up a change made in another tab", async () => {
    const { data } = fakeWindow(JSON.stringify(["a"]));
    const { readReadsNow } = await load();
    expect(readReadsNow()).toEqual(["a"]);
    data.set("sys101:reads-read", JSON.stringify(["a", "c"]));
    expect(readReadsNow()).toEqual(["a", "c"]);
  });

  it("does not throw when storage is blocked", async () => {
    fakeWindow(undefined, { blocked: true });
    const { readReadsNow, toggleRead, clearReadReads } = await load();
    expect(readReadsNow()).toEqual([]);
    expect(() => toggleRead("a")).not.toThrow();
    expect(() => clearReadReads()).not.toThrow();
  });

  it("returns the same array while nothing changed (useSyncExternalStore needs a stable snapshot)", async () => {
    fakeWindow(JSON.stringify(["a"]));
    const { readReadsNow } = await load();
    expect(readReadsNow()).toBe(readReadsNow());
  });
});
