"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Result = { url: string; title: string; section?: string; excerpt: string };

type SubResult = { url: string; title: string; excerpt: string; locations: number[] };
type Pagefind = {
  debouncedSearch: (q: string, opts?: object, ms?: number) => Promise<{
    results: { data: () => Promise<{ url: string; meta: { title?: string }; excerpt: string; sub_results: SubResult[] }> }[];
  } | null>;
};

// The index is static files generated at build time (see `postbuild`), so
// search runs entirely in the browser with no third-party service.
const PAGEFIND = "/pagefind/pagefind.js";

// Pagefind indexes Next's prerendered .html files; the site serves them without the extension.
const clean = (url: string) => url.replace(/\.html(?=#|$)/, "");

export default function Search() {
  const router = useRouter();
  const pagefind = useRef<Pagefind | null>(null);
  const loading = useRef<Promise<void> | null>(null);
  const latest = useRef(0); // id of the newest search; older responses are dropped
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
    const id = ++latest.current;
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
    if (!found || id !== latest.current) return; // a newer keystroke owns the results now
    const pages = await Promise.all(found.results.slice(0, 8).map((r) => r.data()));
    if (id !== latest.current) return;
    setResults(
      pages.map((page) => {
        // Link to the section with the most matches, so a hit in the glossary opens the glossary.
        const best = [...page.sub_results].sort((a, b) => b.locations.length - a.locations.length)[0];
        const title = page.meta.title ?? clean(page.url);
        return {
          url: clean(best?.url ?? page.url),
          title,
          section: best && best.title !== title ? best.title : undefined,
          excerpt: best?.excerpt ?? page.excerpt,
        };
      }),
    );
    setSearching(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      search("");
    } else if (e.key === "Enter" && results?.length && !searching) {
      router.push(results[0].url);
    }
  };

  const showResults = query.trim() && !searching && results;

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
        spellCheck={false}
        value={query}
        onFocus={load}
        onChange={(e) => search(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={status === "unavailable"}
        aria-describedby="search-status"
      />

      <div id="search-status" aria-live="polite">
        {status === "unavailable" && (
          <p className="search-note">
            {process.env.NODE_ENV === "development"
              ? "Search isn't available in local development yet. Run npm run search:index to build it; it already works on the live site."
              : "Search couldn't load. Reloading the page usually fixes it."}
          </p>
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
        {showResults &&
          (results.length === 0 ? (
            <p className="search-note">No topics mention “{query.trim()}”.</p>
          ) : (
            <>
              <p className="visually-hidden">
                {results.length} {results.length === 1 ? "result" : "results"}. Press Enter to open the first.
              </p>
              <ul className="search-results">
                {results.map((r) => (
                  <li key={r.url}>
                    <Link href={r.url}>{r.title}</Link>
                    {r.section && <span className="search-section label">{r.section}</span>}
                    {/* Pagefind escapes page text and only adds <mark> around matches. */}
                    <p dangerouslySetInnerHTML={{ __html: r.excerpt }} />
                  </li>
                ))}
              </ul>
            </>
          ))}
      </div>
    </div>
  );
}
