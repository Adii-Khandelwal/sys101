"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "sys101:theme";

/** The theme in effect now: an explicit saved choice, else the OS preference. */
function resolve(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // storage blocked
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Light/dark toggle. The no-flash script in the layout sets data-theme before
 * paint from the saved choice; this syncs the button to the live theme after
 * mount (so server and first client render match), writes the choice, and
 * follows the OS until the reader picks one.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null); // null until mounted, to avoid a hydration mismatch

  useEffect(() => {
    setTheme(resolve());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      try {
        if (!localStorage.getItem(KEY)) setTheme(mq.matches ? "dark" : "light");
      } catch {
        // storage blocked
      }
    };
    mq.addEventListener("change", follow);
    return () => mq.removeEventListener("change", follow);
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // storage blocked: lasts for this page only
    }
  };

  // Before mount the theme is unknown; render a stable, inert placeholder so the
  // markup matches the server and there is no layout shift.
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => theme && choose(next)}
      aria-label={theme ? `Switch to ${next} theme` : "Switch theme"}
      title={theme ? `Switch to ${next} theme` : "Switch theme"}
      suppressHydrationWarning
    >
      {theme === "dark" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

/** A sun: current theme is light. */
function SunIcon() {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.2" y1="5.2" x2="6.9" y2="6.9" />
        <line x1="17.1" y1="17.1" x2="18.8" y2="18.8" />
        <line x1="5.2" y1="18.8" x2="6.9" y2="17.1" />
        <line x1="17.1" y1="6.9" x2="18.8" y2="5.2" />
      </g>
    </svg>
  );
}

/** A crescent moon: current theme is dark. */
function MoonIcon() {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M20 14.5A8 8 0 0 1 9.5 4a0.5 0.5 0 0 0-0.7-0.6 8.5 8.5 0 1 0 11.8 11.8 0.5 0.5 0 0 0-0.6-0.7z"
        fill="currentColor"
      />
    </svg>
  );
}
