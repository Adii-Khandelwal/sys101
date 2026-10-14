"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAllProgress } from "@/lib/progress";
import CompanyLogo from "./CompanyLogo";
import type { PostRow, PostsIndex as Data } from "@/lib/posts";
import { sourceKinds } from "@/lib/sourceKinds";
import { matchesAll } from "@/lib/searchMatch";
import { focusFirstResult, useSlashFocus } from "@/lib/useSlashFocus";

const VIEWS = [
  { id: "topic", label: "By topic" },
  { id: "company", label: "By company" },
  { id: "year", label: "By year" },
] as const;
type View = (typeof VIEWS)[number]["id"];

// Runs as the page parses, so the chosen view shows with no flash. A #company or #topic link opens the view that holds it.
const PICK_VIEW = `(function(){var d=document.documentElement,q=new URLSearchParams(location.search).get("view"),v=["topic","company","year"].indexOf(q)>-1?q:null,h=decodeURIComponent(location.hash.slice(1)),e=h&&document.getElementById(h);if(!v&&e){var s=e.closest("[data-view]");if(s)v=s.getAttribute("data-view")}d.dataset.postsView=v||"topic";if(e)e.scrollIntoView()})()`;

const matches = (p: PostRow, q: string) => !q || matchesAll(`${p.title} ${p.company}`, q);

/**
 * The posts index. All three views are in the server-rendered HTML; CSS shows the one named by
 * <html data-posts-view>, so with no JavaScript they read one after another. Filtering only hides rows.
 */
export default function PostsIndex({ data }: { data: Data }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>("topic");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const { progress } = useAllProgress();
  const readIds = new Set(progress.posts);

  useEffect(() => {
    // A client-side arrival (the homepage's company links) does not run the inline script above: choose the view the address names.
    const d = document.documentElement;
    const q = new URLSearchParams(location.search).get("view");
    const named = VIEWS.find((v) => v.id === q)?.id;
    const hit = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    d.dataset.postsView = named ?? (hit?.closest("[data-view]")?.getAttribute("data-view") || d.dataset.postsView || "topic");
    const sync = () => setView((document.documentElement.dataset.postsView as View) || "topic");
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  useSlashFocus(inputRef);

  const [current, setCurrent] = useState("");

  const choose = (id: View) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    document.documentElement.dataset.postsView = id;
    history.pushState(null, "", id === "topic" ? "/posts" : `/posts?view=${id}`);
    setView(id);
  };

  const keep = (rows: PostRow[]) => rows.filter((p) => matches(p, q));
  const matching = new Set(data.byCompany.flatMap((c) => keep(c.posts)).map((p) => p.url)).size;

  // The group heading already names the company (or year), so that cell is left empty to keep the columns aligned.
  const row = (p: PostRow, own: boolean, hide?: "company" | "year") => {
    const first = p.topics[0];
    const read = own ? readIds.has(p.key) : p.topics.some((t) => readIds.has(t.postId));
    const others = own ? p.topics.filter((t) => t.postId !== p.key) : p.topics;
    return (
      <li key={p.key} className="posts-row">
        <Link className="posts-title" href={`/topic/${first.slug}#${own ? p.key : first.postId}`}>
          {p.title}
        </Link>
        <span className="posts-company">
          {hide === "company" ? null : (
            <>
              <CompanyLogo name={p.company} />
              <span>{p.company}</span>
            </>
          )}
        </span>
        <span className="posts-year">{hide === "year" ? null : (p.year ?? "No date")}</span>
        {others.length > 0 && (
          <span className="posts-topics">
            {own ? "Also in " : ""}
            {others.map((t, i) => (
              <span key={t.slug}>
                {i > 0 && ", "}
                <Link href={`/topic/${t.slug}#${t.postId}`}>{t.title}</Link>
              </span>
            ))}
          </span>
        )}
        <span className="posts-end">
          {read && <span className="posts-read label">Read</span>}
          <a className="posts-ext label" href={p.url} target="_blank" rel="noopener noreferrer">
            Original post<span className="visually-hidden"> (external, opens in a new tab)</span>
          </a>
        </span>
      </li>
    );
  };

  const section = (id: View, title: string, empty: boolean, children: ReactNode) => (
    <section id={`by-${id}`} data-view={id} className="posts-view" aria-labelledby={`by-${id}-h`}>
      <h2 id={`by-${id}-h`} className="label posts-view-h">
        {title}
      </h2>
      {empty ? <p className="search-note">No posts match “{query.trim()}”.</p> : children}
    </section>
  );

  const topicGroups = data.byTopic
    .map((g) => ({ ...g, topics: g.topics.map((t) => ({ ...t, posts: keep(t.posts) })).filter((t) => t.posts.length) }))
    .filter((g) => g.topics.length);
  const companies = data.byCompany.map((c) => ({ ...c, posts: keep(c.posts) })).filter((c) => c.posts.length);
  const years = data.byYear.map((y) => ({ ...y, posts: keep(y.posts) })).filter((y) => y.posts.length);

  // Contents for the left rail: what each view's headings are called there.
  const rails: Record<View, { label: string; items: { id: string; name: string; group?: string }[] }> = {
    topic: { label: "Topics", items: topicGroups.flatMap((g) => g.topics.map((t) => ({ id: t.slug, name: t.title, group: g.group }))) },
    company: { label: "Companies", items: companies.map((c) => ({ id: c.id, name: c.name })) },
    year: { label: "Years", items: years.map((y) => ({ id: y.id, name: y.year ?? "No date shown" })) },
  };
  const ids = rails[view].items.map((i) => i.id).join();

  // The current heading is the last one whose top has passed a third of the way down the screen.
  useEffect(() => {
    const els = ids.split(",").map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const pick = () => {
      const line = window.innerHeight / 3;
      let id = els[0]?.id ?? "";
      for (const el of els) if (el.getBoundingClientRect().top <= line) id = el.id;
      setCurrent(id);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [ids]);

  return (
    <>
      {VIEWS.map((v) => (
        <nav key={v.id} className="posts-rail" data-view={v.id} aria-label={`${rails[v.id].label} on this page`} data-pagefind-ignore>
          <p className="posts-rail-label label">{rails[v.id].label}</p>
          <ul>
            {rails[v.id].items.map((it, i, all) => (
              <li key={it.id} className={view === v.id && it.id === current ? "is-current" : undefined}>
                {it.group && it.group !== all[i - 1]?.group && <span className="posts-rail-group">{it.group}</span>}
                <a href={`#${it.id}`} aria-current={view === v.id && it.id === current ? "location" : undefined}>
                  {it.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ))}
      <div className="posts-tools">
        <nav className="posts-views label" aria-label="Choose how to list the posts">
          {VIEWS.map((v) => (
            <a key={v.id} href={v.id === "topic" ? "/posts" : `/posts?view=${v.id}`} data-view-link={v.id} aria-current={view === v.id ? "page" : undefined} onClick={choose(v.id)}>
              {v.label}
            </a>
          ))}
        </nav>
        <div className="search posts-search" role="search">
          <label htmlFor="posts-filter" className="visually-hidden">
            Filter posts by title or company
          </label>
          <div className="search-field">
            <input
              ref={inputRef}
              id="posts-filter"
              type="search"
              placeholder="Filter by title or company"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => (e.key === "Escape" ? (setQuery(""), e.currentTarget.blur()) : e.key === "Enter" && focusFirstResult(".posts-title"))}
              aria-describedby="posts-filter-status"
              aria-keyshortcuts="/"
            />
            <kbd className="search-hint" aria-hidden="true">
              /
            </kbd>
          </div>
        </div>
      </div>
      <p id="posts-filter-status" className="posts-count" aria-live="polite">
        {q
          ? `${matching} of ${data.total} sources match “${query.trim()}”.`
          : `${data.total} sources from ${data.companyCount} organizations (${sourceKinds(data.counts)}), taught across ${data.topicCount} topics.`}
      </p>

      <div data-pagefind-body>
        {section(
          "topic",
          "By topic",
          topicGroups.length === 0,
          topicGroups.map((g) => (
            <div key={g.group} className="posts-group">
              <h3 className="label posts-group-h">{g.group}</h3>
              {g.topics.map((t) => (
                <div key={t.slug}>
                  <h4 id={t.slug} className="posts-topic-h">
                    <Link href={`/topic/${t.slug}`}>{t.title}</Link>
                    <span className="posts-n"> {t.posts.length}</span>
                  </h4>
                  <ul className="posts-list">{t.posts.map((p) => row(p, true))}</ul>
                </div>
              ))}
            </div>
          )),
        )}
      </div>

      {section(
        "company",
        "By company",
        companies.length === 0,
        companies.map((c) => (
          <div key={c.id}>
            <h3 id={c.id} className="posts-topic-h posts-company-h">
              <CompanyLogo name={c.name} />
              <span>{c.name}</span>
              <span className="posts-n"> {c.posts.length}</span>
            </h3>
            <ul className="posts-list">{c.posts.map((p) => row(p, false, "company"))}</ul>
          </div>
        )),
      )}

      {section(
        "year",
        "By year",
        years.length === 0,
        years.map((y) => (
          <div key={y.id}>
            <h3 id={y.id} className="posts-topic-h">
              {y.year ?? "No date shown"}
              <span className="posts-n"> {y.posts.length}</span>
            </h3>
            <ul className="posts-list">{y.posts.map((p) => row(p, false, "year"))}</ul>
          </div>
        )),
      )}

      <script dangerouslySetInnerHTML={{ __html: PICK_VIEW }} />
    </>
  );
}
