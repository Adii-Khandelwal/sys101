"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import LearnRail from "./LearnRail";
import { StripBackToTop } from "./BackToTop";
import HighlightTarget from "./HighlightTarget";
import { diagramHtml } from "@/lib/diagramHtml";
import { glossaryId } from "@/lib/glossaryMatch";
import { matchesAll } from "@/lib/searchMatch";
import { focusFirstResult, useSlashFocus } from "@/lib/useSlashFocus";

export type GlossaryGroup = { slug: string; title: string; terms: { term: string; definition: string; diagram?: string }[] };

/**
 * The glossary term list with a filter box. Typing narrows to terms (or
 * definitions) that match; "/" focuses the box, as on the homepage search.
 * All terms are in the server-rendered HTML, so search engines and Pagefind
 * still index them; the filter only hides non-matches in the browser.
 */
export default function GlossaryFilter({ groups, heading }: { groups: GlossaryGroup[]; heading: React.ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  useSlashFocus(inputRef);

  const filtered = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, terms: g.terms.filter((t) => matchesAll(`${t.term} ${t.definition}`, q)) }))
      .filter((g) => g.terms.length > 0);
  }, [groups, q]);

  const total = filtered.reduce((n, g) => n + g.terms.length, 0);

  // Contents follow the filter: only topics that still have a matching term are listed.
  const entries = filtered.map((g) => ({ id: `g-${g.slug}`, name: g.title }));

  return (
    <>
      <HighlightTarget selector=".glossary-terms > div" />
      {entries.length > 0 && (
        <>
          <LearnRail entries={entries} scope="section" />
          <div className="progress-sticky" data-pagefind-ignore>
            <LearnRail entries={entries} variant="line" scope="section" />
            <StripBackToTop />
          </div>
        </>
      )}
      {heading}
      <div className="search glossary-search" role="search">
        <label htmlFor="glossary-filter" className="visually-hidden">
          Filter glossary terms
        </label>
        <div className="search-field">
          <input
            ref={inputRef}
            id="glossary-filter"
            type="search"
            placeholder="Filter terms, e.g. replica"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => (e.key === "Escape" ? (setQuery(""), e.currentTarget.blur()) : e.key === "Enter" && focusFirstResult(".glossary-topic h2 a"))}
            aria-describedby="glossary-filter-status"
            aria-keyshortcuts="/"
          />
          <kbd className="search-hint" aria-hidden="true">
            /
          </kbd>
        </div>
      </div>

      <p id="glossary-filter-status" className="glossary-count" aria-live="polite">
        {q ? `${total} ${total === 1 ? "term" : "terms"} match “${query.trim()}”.` : `${total} terms across ${filtered.length} topics. Each links back to the topic that teaches it.`}
      </p>

      {total === 0 ? (
        <p className="search-note">No terms match “{query.trim()}”. Clear the filter to see every term.</p>
      ) : (
        filtered.map((g) => (
          <section key={g.slug} className="glossary-topic" aria-labelledby={`g-${g.slug}`}>
            <h2 id={`g-${g.slug}`}>
              <Link href={`/topic/${g.slug}`}>{g.title}</Link>
            </h2>
            <dl className="glossary-terms">
              {g.terms.map((t) => (
                <div key={t.term} id={glossaryId(g.slug, t.term)}>
                  <dt>{t.term}</dt>
                  <dd>{t.definition}</dd>
                  {t.diagram && <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(t.diagram) }} />}
                </div>
              ))}
            </dl>
          </section>
        ))
      )}
    </>
  );
}
