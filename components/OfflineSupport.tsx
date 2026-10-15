"use client";

import { useEffect } from "react";

/** Registers the service worker (public/sw.js) and, at most once a day, asks it to copy the whole site for offline use (it decides whether a day has passed). */
export default function OfflineSupport() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const run = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
        (await navigator.serviceWorker.ready).active?.postMessage("warm");
      } catch {
        // Offline support is optional; the site works the same without it.
      }
    };
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2000));
    window.addEventListener("load", () => idle(run), { once: true });
    if (document.readyState === "complete") idle(run);
  }, []);
  return null;
}
