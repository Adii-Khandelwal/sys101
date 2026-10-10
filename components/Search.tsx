"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type Result = { url: string; title: string; excerpt: string };

type Pagefind = {
  debouncedSearch: (q: string, opts?: object, ms?: number) => Promise<{
    results: { data: () => Promise<{ url: string; meta: { title?: string }; excerpt: string }> }[];
  } | null>;
};

// The index is static files generated at build time (see `postbuild`), so
// search runs entirely in the browser with no third-party service.
const PAGEFIND = "/pagefind/pagefind.js";

export default function Search() {
  const pagefind = useRef<Pagefind | null>(null);
  const loading = useRef<Promise<void> | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);

  // Load the index the first time someone focuses the box, not on page load.
  const load = () => {
    loading.current ??= (async () => {
      setStatus("loading");
      try {
        pagefind.current = await import(/* webpackIgnore: true */ PAGEFIND);
        setStatus("ready");
      } catch {
        setStatus("unavailable"); // e.g. `npm run dev`, where no index has been built
      }
    })();
    return loading.current;
  };

  const search = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    await load(); // a fast typist can beat the index download
    if (!pagefind.current) return setSearching(false);
    const found = await pagefind.current.debouncedSearch(q, {}, 150);
    if (!found) return; // superseded by a newer keystroke
    const data = await Promise.all(found.results.slice(0, 8).map((r) => r.data()));
    setResults(
      data.map((d) => ({
        // Pagefind indexes Next's prerendered .html files; the site serves them without the extension.
        url: d.url.replace(/\.html$/, ""),
        title: d.meta.title ?? d.url,
        excerpt: d.excerpt,
      })),
    );
    setSearching(false);
  };

  return (
    <div className="search" role="search">
      <label htmlFor="site-search" className="visually-hidden">
        Search topics
      </label>
      <input
        id="site-search"
        type="search"
        placeholder="Search topics, companies, terms"
        autoComplete="off"
        value={query}
        onFocus={load}
        onChange={(e) => search(e.target.value)}
        disabled={status === "unavailable"}
      />

      <div aria-live="polite">
        {status === "unavailable" && (
          <p className="search-note">Search is built with the site and appears after a production build.</p>
        )}
        {query.trim() && (status === "loading" || searching) && (
          <ul className="search-results" aria-busy="true">
            {[0, 1].map((i) => (
              <li key={i}>
                <span className="skeleton-bar" style={{ width: "40%", height: 16 }} />
                <span className="skeleton-bar" style={{ width: "90%", marginTop: 8 }} />
              </li>
            ))}
          </ul>
        )}
        {query.trim() && !searching && results && (
          results.length === 0 ? (
            <p className="search-note">No topics mention “{query.trim()}”.</p>
          ) : (
            <ul className="search-results">
              {results.map((r) => (
                <li key={r.url}>
                  <Link href={r.url}>{r.title}</Link>
                  {/* Pagefind escapes page text and only adds <mark> around matches. */}
                  <p dangerouslySetInnerHTML={{ __html: r.excerpt }} />
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
