---
paths:
  - "content/reads/**"
  - "app/reads/**"
  - "components/ReadsList.tsx"
  - "lib/reads*.ts"
  - "scripts/verify-reads.mjs"
---

# Great reads

Applies when editing /reads or its data. A short list chosen by the site's author because others adopted what a post or paper introduced, or because it is simply excellent. It is separate from the topic sources: it never changes a topic page, and its entries are not in the /posts or homepage counts.

## Standing rules

- An entry is the original write-up by the engineering team that built the system (a company blog post, or a paper by that team), live at its own URL. A page that works only through the Wayback Machine is dropped, not kept. Not eligible: non-company papers, retellings, listicles, marketing, a page whose original date cannot be confirmed (the AWS Builders' Library pages now show a 2026 republish date).
- Exceptions to CLAUDE.md's post selection, for this page only: rule 1 (real numbers) and rule 5 (maps to a graph concept) do not apply, and rule 3 (current architecture) is replaced by a label: the page says each read describes its system as of the year shown, and never claims it still holds.
- `influence` is `stated` or `writeup`. Only a `stated` entry may say anything about adoption or release, and only what its `claim` phrase (copied from an opened page, its own or the adopter's) backs, attributed in the sentence ("says", "calls", "announces"). A `writeup` describes what the piece explains and says nothing about impact; the build rejects impact words in it. Never write that a read is asked about in interviews.
- Read state is only the per-entry "Read" toggle (lib/readsRead.ts), kept apart from the topic progress store; see progress-tracking.md.
- Grouped by what each introduced, in five themes (READ_THEMES in lib/reads.ts), oldest first within a theme; a theme with fewer than 3 entries is folded into another (the build fails). The kind (post or paper) shows on each row beside the company ("Google · Paper").
- "Also a source on <topic>" is computed by matching the URL against topic posts (Dynamo and Spanner today); "Related" lists the other topics from `topics`.
- A new company needs a mark in the same change (`node scripts/make-logos.mjs add`); `lib/logos.test.ts` counts reads companies. `organization()` folds "Facebook" into Meta.

## Specification

- Data: `content/reads/<id>.json`, the file name equal to `id`. Fields: `title, company, kind (post|paper), published (YYYY or YYYY-MM-DD, exactly as the page shows), theme, url, dateUrl? (the page that shows the date when the entry is a PDF without one), whyItMatters (12 to 30 words, no em dash, every digit in an evidence phrase), influence, claim? ({ phrase (at most 15 words), url? }), evidence (1 to 3 phrases of at most 15 words from the entry's page), topics (slugs), openedOn, verifiedOn`. Checked by `readProblems` in lib/reads.ts, which `getAllReads` runs at build time and `lib/reads.test.ts` exercises.
- Page: `/reads`, "Great reads"; lead, a filter bar (All/Posts/Papers buttons, a Topic row of buttons built from the topics the reads link to (one scrolling row on a phone), a text filter on title, company and sentence; they only hide rows of the server-rendered list, and a line "N of M reads match" appears only while one is active, never typed), a sticky jump line under the filters (`JumpLine` in ReadsList, `.jump-line`: theme names only, no counts, 44px links, one scrolling row on a phone, the current theme marked by an accent rule under it as well as ink, glides with `glideToSection`; hidden for fewer than two themes and from 1180px, where the rail below replaces it), from 1180px a sticky left contents rail (`LearnRail`, the same metro line as Background, `scope="section"`, `data-pagefind-ignore`): theme names only, no counts or read state, built from the groups still showing (a theme whose rows are all filtered out leaves the rail), the current theme ringed by scroll position, a click glides with `glideToSection`; below 1180px there is no rail, only the jump line), five theme sections (empty ones hidden while filtering; from 900px the theme name sits in a 180px left column with the hairline-topped rows at the right, one column below). Row: year, title (the external link itself: new tab, `rel="noopener noreferrer"`, no underline, a hidden "original paper, external" note), company with mark and kind, the sentence, topic links, and a quiet "Read" toggle (a small box that fills with the accent, with aria-pressed) in the right column. The filter behaves like the homepage search: "/" focuses it, Escape clears and blurs, Enter moves to the first result, a word matches only at the start of a word (`matchesAll`, so "uber" never finds "Kubernetes"), a shortcut hint and `aria-keyshortcuts`, an aria-live count. /posts shares the same matcher and helpers (lib/searchMatch.ts, lib/useSlashFocus.ts); any new search box must have all of these. Server-rendered, Pagefind body, CollectionPage + ItemList JSON-LD (items are the original URLs), `PageUpdated` from the newest `verifiedOn`, in the sitemap, linked from the footer, the lead of /posts and the homepage sources note.
- `npm run verify:reads` (alias `verify:landmarks`, scripts/verify-reads.mjs, needs the network, never in the build) opens every URL live (browser fallback when fetch is refused, PDFs through pypdf), checks each evidence phrase and claim phrase is on its page and `published` matches a date the page shows (a year alone must appear as a whole number).
