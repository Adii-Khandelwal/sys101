"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearnRail from "./LearnRail";
import CompanyLogo from "./CompanyLogo";
import { glideToSection } from "@/lib/glide";
import { useReadReads } from "@/lib/readsRead";
import { matchesAll } from "@/lib/searchMatch";
import { focusFirstResult, useSlashFocus } from "@/lib/useSlashFocus";
import type { ReadsData } from "@/lib/reads";

const KINDS = [
  { id: "all", label: "All" },
  { id: "post", label: "Posts" },
  { id: "paper", label: "Papers" },
] as const;

/** Sticky row of group names that jump to the group; no counts (the group headings carry them). The current group has a rule under it as well as the colour. */
function JumpLine({ groups, watch }: { groups: { id: string; theme: string }[]; watch: string }) {
  const [current, setCurrent] = useState("");
  const ids = groups.map((g) => g.id).join();
  useEffect(() => {
    const onScroll = () => {
      const line = document.querySelector<HTMLElement>(".jump-line");
      const edge = (line?.getBoundingClientRect().bottom ?? 0) + 48;
      let now = "";
      for (const id of ids.split(",")) if (id && (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= edge) now = id;
      setCurrent(now);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids, watch]);
  if (groups.length < 2) return null;
  return (
    <nav className="jump-line label" aria-label="Jump to a group">
      {groups.map((g) => (
        <a
          key={g.id}
          href={`#${g.id}`}
          aria-current={current === g.id ? "location" : undefined}
          onClick={(e) => {
            const target = document.getElementById(g.id)?.closest<HTMLElement>("section");
            if (!target) return;
            e.preventDefault();
            history.replaceState(null, "", `#${g.id}`);
            void glideToSection(target);
          }}
        >
          {g.theme}
        </a>
      ))}
    </nav>
  );
}

/**
 * Great reads grouped by what they introduced. Every row is in the server-rendered HTML; the filters only hide rows,
 * so without JavaScript the full list reads top to bottom. Nothing here touches the progress store.
 */
export default function ReadsList({ data }: { data: ReadsData }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("all");
  const [topic, setTopic] = useState("");
  const [query, setQuery] = useState("");
  const [readIds, toggleRead] = useReadReads();
  const inputRef = useRef<HTMLInputElement>(null);
  useSlashFocus(inputRef);
  const q = query.trim().toLowerCase();
  const all = data.byTheme.flatMap((g) => g.reads);
  const topics = [...new Map(all.flatMap((r) => [...r.sourceOn, ...r.related]).map((t) => [t.slug, t.title])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const keep = (r: (typeof all)[number]) =>
    (kind === "all" || r.kind === kind) &&
    (!topic || [...r.sourceOn, ...r.related].some((t) => t.slug === topic)) &&
    (!q || matchesAll(`${r.title} ${r.company} ${r.whyItMatters}`, q));
  const groups = data.byTheme.map((g) => ({ ...g, reads: g.reads.filter(keep) })).filter((g) => g.reads.length);
  const shown = groups.reduce((n, g) => n + g.reads.length, 0);
  const filtered = kind !== "all" || topic || q;

  return (
    <>
      <div className="posts-tools reads-tools">
        <nav className="posts-views label" aria-label="Show posts, papers or both">
          {KINDS.map((k) => (
            <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label}
            </button>
          ))}
        </nav>
        <div className="search posts-search" role="search">
          <label htmlFor="reads-filter" className="visually-hidden">
            Filter reads by title, company or description
          </label>
          <div className="search-field">
            <input
              ref={inputRef}
              id="reads-filter"
              type="search"
              placeholder="Filter by title or company"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => (e.key === "Escape" ? (setQuery(""), e.currentTarget.blur()) : e.key === "Enter" && focusFirstResult(".reads-title a"))}
              aria-keyshortcuts="/"
            />
            <kbd className="search-hint" aria-hidden="true">
              /
            </kbd>
          </div>
        </div>
      </div>
      <p className="reads-topicbar-label label">Topic</p>
      <nav className="posts-views reads-topicbar label" aria-label="Show reads linked to one topic">
        {[["", "Any"], ...topics].map(([slug, title]) => (
          <button key={slug} type="button" aria-pressed={topic === slug} onClick={() => setTopic(slug)}>
            {title}
          </button>
        ))}
      </nav>
      <p className="posts-count" aria-live="polite">
        {filtered ? `${shown} of ${data.total} reads match.${q && shown ? " Press Enter to go to the first." : ""}` : null}
      </p>
      {shown === 0 && <p className="search-note">No reads match. Clear a filter to see every read.</p>}
      {groups.length > 1 && <LearnRail entries={groups.map((g) => ({ id: g.id, name: g.theme }))} scope="section" />}
      <JumpLine groups={groups} watch={`${kind}|${topic}|${query}`} />
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={g.id} className="reads-theme">
          <h2 id={g.id} className="label posts-group-h">
            {g.theme} ({g.reads.length})
          </h2>
          <ul className="posts-list">
            {g.reads.map((r) => (
              <li key={r.id} className="reads-row">
                <span className="reads-year">{r.year}</span>
                <div className="reads-main">
                  <p className="reads-title">
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      {r.title}
                      <span className="visually-hidden"> (original {r.kind}, external, opens in a new tab)</span>
                    </a>
                  </p>
                  <p className="reads-co">
                    <CompanyLogo name={r.company} />
                    <span>
                      {r.company}, {r.kind === "paper" ? "Paper" : "Post"}
                    </span>
                  </p>
                  <p className="reads-why">{r.whyItMatters}</p>
                  {(r.sourceOn.length > 0 || r.related.length > 0) && (
                    <p className="reads-topics">
                      {r.sourceOn.length > 0 && (
                        <span>
                          Also a source on{" "}
                          {r.sourceOn.map((t, i) => (
                            <span key={t.slug}>
                              {i > 0 && ", "}
                              <Link href={`/topic/${t.slug}#${t.postId}`}>{t.title}</Link>
                            </span>
                          ))}
                        </span>
                      )}
                      {r.related.length > 0 && (
                        <span>
                          Related:{" "}
                          {r.related.map((t, i) => (
                            <span key={t.slug}>
                              {i > 0 && ", "}
                              <Link href={`/topic/${t.slug}`}>{t.title}</Link>
                            </span>
                          ))}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button type="button" className="reads-read label" aria-pressed={readIds.includes(r.id)} onClick={() => toggleRead(r.id)}>
                  <span className="read-box" aria-hidden="true" />
                  <span>Read</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
