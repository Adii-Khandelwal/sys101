"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { matchesAll } from "@/lib/searchMatch";
import { focusFirstResult, useSlashFocus } from "@/lib/useSlashFocus";

export type DesignRow = { slug: string; title: string; summary: string; coverage: string };

/** Every row is in the server HTML; the filter only hides rows, so without JavaScript the full list shows. */
export default function DesignIndex({ rows }: { rows: DesignRow[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useSlashFocus(inputRef);
  const q = query.trim();
  const shown = rows.filter((r) => !q || matchesAll(`${r.title} ${r.summary}`, q));
  return (
    <>
      <div className="posts-tools">
        <div className="search posts-search" role="search">
          <label htmlFor="design-filter" className="visually-hidden">
            Filter design questions by title or description
          </label>
          <div className="search-field">
            <input
              ref={inputRef}
              id="design-filter"
              type="search"
              placeholder="Filter by title"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => (e.key === "Escape" ? (setQuery(""), e.currentTarget.blur()) : e.key === "Enter" && focusFirstResult(".cap-index h2 a"))}
              aria-keyshortcuts="/"
            />
            <kbd className="search-hint" aria-hidden="true">
              /
            </kbd>
          </div>
        </div>
      </div>
      <p className="label" aria-live="polite">
        {q ? `${shown.length} of ${rows.length} questions` : ""}
      </p>
      <ul className="cap-index">
        {shown.map((r) => (
          <li key={r.slug} id={r.slug}>
            <h2>
              <Link href={`/design/${r.slug}`}>{r.title}</Link>
            </h2>
            <p>{r.summary}</p>
            <p className="label">{r.coverage}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
