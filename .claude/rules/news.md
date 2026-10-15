---
paths:
  - "app/new/**"
  - "app/_new/**"
  - "lib/newsMonths*.ts"
  - "lib/newsMonth.test.ts"
  - "content/news/**"
  - "docs/news-state.json"
  - "docs/routines/**"
  - "scripts/*news*"
  - "pipeline/**"
  - ".github/workflows/news-pr.yml"
  - "lib/news*.ts"
---

# What's new (news routine)

Applies when editing content/news, the allowlist, the routine files or the news workflow. The routine may touch only content/news/** and docs/news-state.json.

## Specification

- Data: `content/news/<slug>.json` is `{ asOf, items }`, at most 3 items, zero is valid and renders nothing. An item has `id`, `kind` (release, engineering-post, standard, docs), `title`, `publisher`, `url`, `dateShown` (YYYY-MM-DD, YYYY-MM, YYYY or "no date shown", exactly what the page shows), `summary`, `evidence`, `origin`, `addedOn`, `verifiedOn`.
- Summary: one plain sentence of 12 to 30 words in our own words, no em dash or "not X but Y". Any digit must also be in the evidence, and it needs at least one evidence phrase per 15 summary words, so every sentence-level claim is covered. Any digit or comparative word (faster, higher, lower, more, less, better, improves) needs an attribution phrase (says, reports, claims, describes) naming the publisher's first word.
- Evidence: 1 to 3 different phrases of at most 15 words each, copied from the page text; together they must cover every claim in the summary (a checker enforces the count, the author enforces the coverage). Never displayed; only the checkers read them. `verify:news` confirms every phrase is in the page.
- Origin: `manual` (picked in a working session) or `routine` (added by the scheduled routine). Provenance data only: nothing on the topic page shows it, and there is no note about how items were chosen or reviewed.
- Allowlist: `docs/news-state.json` `allowedDomains[slug]` is a list of `{ host, pathPrefix? | pathPattern?, publisher, kinds? }`. `pathPattern` is an anchored regex for sites whose paths vary by locale (Uber: `^/(blog/|[a-zA-Z]{2}/en/blog/|en-US/blog/)`); it is allowed only in this file, must start with `^`, be at most 200 characters, and use no lookarounds, backreferences, quantified groups or more than one unbounded quantifier. A host matches exactly or as a true subdomain, never by substring. https only, no credentials, no other port. A prefix needs a path boundary. The item's `publisher` must equal the entry's `publisher` string, and `kinds` (if set) limits the item's kind. Only a person edits the allowlist; a `claude/` pull request that changes it fails the guard. `lastChecked[slug]` is the last routine run for that topic.
- Checks: `scripts/news-rules.mjs` holds every rule once. `scripts/check-news.mjs` runs in the build (errors fail, dates older than 12 months warn). `npm run verify:news` needs the network: it fetches each page raw (Wayback copy when blocked, marked "archive copy"), follows redirects by hand and refuses any hop outside the allowlist, confirms the evidence is in the page text and `dateShown` matches a date the page shows, and fails items older than 12 months.
- Page: "What's new in <Topic>" after What to learn next and before Original posts. Not tracked, not in the rail, searchable (its own `data-pagefind-body`, the heading is the label), sitemap lastmod includes `asOf`. The section carries no note about how items were chosen or reviewed. The About page describes the process in one sentence.
- Monthly page (HIDDEN for now by the owner: the code is in app/_new, a private folder, and its nav item, sitemap entry and test lines are commented out; the per-topic "What's new in <Topic>" sections stay; restore steps are at the top of app/_new/page.tsx): `/new` (app/_new/page.tsx, `groupNewsByMonth` in lib/newsMonths.ts) lists every topic's items by the month of `addedOn`, newest month first, then by topic title; a month with no items is kept and says "Nothing new this month"; it runs from the first month with an item to the month of the latest `asOf`, computed from the files alone (no clock). Each item looks as on a topic page, with the topic title linking to its What's new section; no counts. It is in the header nav and footer (`NAV_ITEMS`) and the sitemap.
- Monthly run: `docs/routines/whats-new-monthly.md` is the prompt addendum and runbook; `node scripts/news-month.mjs [YYYY-MM]` prints, offline, each topic's allowlisted sites, what is listed and how many places are free. It fetches nothing and is not a source. No new workflow, secret or data model.
- The routine may touch only `content/news/**` and `docs/news-state.json`. It never edits topics, digests, code or docs, and never pushes to main.
- Pull requests: `.github/workflows/news-pr.yml` runs on `pull_request_target`, so the workflow and scripts always come from the base branch. `scripts/news-guard.mjs` allows a news pull request to change only `content/news/**/*.json` and `docs/news-state.json`. CODEOWNERS covers everything else that matters. Setup and the test pull request to run before auto-merge: docs/routines/README.md.
