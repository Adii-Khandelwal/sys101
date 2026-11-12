---
paths:
  - "content/design/**"
  - "lib/design*.ts"
  - "components/design/**"
  - "app/design/**"
  - "app/sitemap.ts"
  - "lib/navItems.ts"
---

# Design questions

Applies when editing a design page, its content JSON, the checker or the routes. A design question is a read-only model answer to "Design X", written in the order of an interview round. The build checks the schema (`designProblems` in lib/design.ts, run by `getAllDesign`; tests in lib/design.test.ts). The plan and its dated revisions are in `docs/design-questions-plan.md` (a working record; the code and this file win where they differ).

## Standing rules

- Routes: `/design` (index: title, one summary line and the sourcing line per question, a search box with the standard behaviour, a `DesignRail` of titles from 1180px; with no files in `content/design/` an honest empty state) and `/design/<slug>` (static, `dynamicParams = false`, canonical, LearningResource JSON-LD, sitemap entries, Pagefind body, `PageUpdated` from the newest source `verifiedOn`, reading time from `designReadingMinutes`). "Design" is a NAV_ITEMS link (header and footer).
- Read-only. No exercises, timer, step boxes, attempted marks, quiz, sizing calculator or stored notes. Nothing on /design touches localStorage, so `/data` and Privacy need no wording for it.
- Two layers of evidence. Explanation (the model answer) is the site's own reasoning, checked against at least one official source and written from understanding, never in a source's outline, sentences, examples or diagrams. Evidence is a statement about how a real company or API behaves, a figure, or a quote: it comes only from a source that was opened and re-read on the raw page (curl, not WebFetch), and it cites that source's id.
- Source kinds: `post` and `paper` (company engineering posts and papers, the CLAUDE.md Post selection rules; the only kind that may back a figure or supply a Worth knowing line) and `reference` (official documentation, standards and regulators, recognised teaching sites and practitioners, university notes, openly licensed repositories; explanation only, never a figure; `license` recorded as read on the page). Paid or all-rights-reserved books and interview products, unlicensed copies, anything behind a login, forums, video and AI summaries are never used. Their question titles may serve as a coverage checklist only.
- Vendor-neutral: a source company's name appears only in a "How a real system does it" (`real`) block, a source's own fields and the source badge. Plain text names none.
- Quotes: only inside a `real` block, at most one per source, 25 words or fewer. The lead confirms each quote as an exact substring of the raw page before it ships.
- Figures: a number in the model answer is either a labelled assumption block ("Assumption for this exercise") or sits in a block that cites a `post` or `paper`. A four-digit year counts as a date, not a figure, only inside a `real` block that names one of its cited companies. Where providers differ the text says "typically" and names the source. No invented figure, date, limit or quote.
- Reasoning the page cannot back: it is checked against an official source by the writer; what cannot be checked is flagged UNVERIFIED in the report and kept off the page until resolved. Nothing is published for a question until its sources are confirmed.
- Voice: neutral like every page, with these exceptions decided by the owner on 31 Oct 2026. The model-answer text may say "we" (talk track, levels, follow-up answers, mistakes), and each section's `say` string is a spoken first-person script, the way the Say it in 30 seconds answers are. The interviewer `ask` lines are typical prompts and the page says so ("The interviewer lines are typical prompts, not a record of any company's interview."); they never claim what a named company does. The `tip` is neutral. No em or en dash, no "It's not X, it's Y" (the checker also rejects "not X but Y").
- Facts about how real companies run their rounds appear only in `real` blocks of `general-tips`, from official first-party pages recorded in `docs/drafts/interview-process-sources.md`, naming the company and the page date. No company hiring-bar claim is made anywhere.
- Diagrams: original inline SVG, site tokens only, `role="img"` and a `<title>`, ids unique across the page. The page's drawing needs no words taken from its claims.
- Review workflow per question: writer (`worker-strong`), reviewer (accuracy, originality paragraph by paragraph against every source opened, banned list; max 2 rounds), then the lead's mechanical checks: `designProblems` through `npm test`, a five-word overlap check against the recorded wording of each source, exact-substring verification of each quote, and a raw-page re-fetch of each cited fact. Figures go through `add-post`. New candidate posts are shown to the owner (URL, company, why it passed) before saving. A new company needs a mark (`logos.md`).
- Adding a question: pick a title (a checklist title is fine); gather at least two confirmed `reference` sources for the explanation and the `post`/`paper` sources for `real` blocks and Worth knowing; write `content/design/<slug>.json` (file name equal to `slug`); run the checks; add a logo for any new company; add the question's topics so every slug exists; update the README count only if a count appears there; log the owner request in `docs/owner-ideas.md`.
- Not built: LLD (class design) pages are parked until the owner names a licensed source.
- "How an interview goes" (`/design/how-it-goes`, static route `app/design/how-it-goes/page.tsx`, content `content/interview-process.json`, loader and checker `lib/interview.ts` with `lib/interview.test.ts`): a read-only page of each company's own statements, claims grouped under one sub-header per source (logo, company, source title as plain text with no outgoing link (owner request, 13 Nov 2026), and the page date once, or the file-metadata year for an undated PDF, or nothing), so a claim's text does not repeat company, page or date; the checker requires every claim to cite an existing source, and the content is stored with claims of one source next to each other (a convention, not checked, so each source shows as one group), a list of companies with no readable official guidance (Google, Uber, Rubrik, Netflix and Apple must be listed). The source URLs, terms and read dates stay in the content file and are not shown. Linked from `/design`, from each design page's note and from the sitemap; it is not a design question, so it is not in `content/design/` or the index list. The checker rejects a claim citing an unknown source, more than one quote per source, any quote over 25 words, banned phrasing, and any use of the word "constraint" (no official page says interviewers change constraints). Source notes: `docs/drafts/interview-process-sources.md`.

## Specification

`content/design/<slug>.json`. Top-level fields: `slug` (equals the file name), `title`, `summary` (both non-empty), `topics [{slug, role}]` (at least one, no duplicates, every slug an existing topic, `role` non-empty; the 3-prerequisite cap does not apply), `capstone?` (an existing capstone slug), the twelve sections below, `curiosities?`, `sources`.

Sections, the only order a page may list them (`STEPS` in lib/designSteps.ts; the label is the rail name):

| id | Label | Shape beyond `topics` and the round |
| - | - | - |
| `general-tips` | General tips | `{ blocks, topics? }`; no round strings; at least 1 block |
| `clarify` | Clarify the problem | `blocks` (at least 1) |
| `requirements` | Requirements | `blocks` (at least 1) |
| `entities` | Entities | `blocks` (at least 1) |
| `api` | API | `blocks` (at least 1) |
| `data-model` | Data model | `blocks` (at least 1) |
| `high-level` | High-level design | `blocks` (may be empty) and `stages [{id, need, add, weak, diagram?}]` (at least 1) |
| `deep-dives` | Deep dives | `blocks?`, `dives [{id, title, attempt, breaks, better, tradeoff, cites?, real?: {text, cites}}]` (3 to 4), `notes?: string[]` |
| `failure-modes` | Failure modes | `blocks` (at least 1) |
| `against-the-grain` | Against the grain | `blocks` (at least 1) |
| `strong-answer` | A strong answer | `talkTrack`, `levels {mid, senior, staff}`, `followUps [{ask, answer, cites?}]` (6 to 16) |
| `mistakes` | Common mistakes | `items [{mistake, fix}]` (5 to 8) |

Every section except `general-tips` also carries `topics: string[]` (existing topic slugs; may be empty) and the round strings `ask`, `say`, `tip`, shown in a framed box ("The interviewer asks", "What you say", "Tip", each with a text label and a shape marker) before a "The reasoning behind it" heading. Word limits (`ROUND_LIMITS`): ask 6 to 40, say 25 to 140, tip 8 to 45. `general-tips.topics` is optional and checked only when present.

Block types: `p {text, cites?}`, `list {items, cites?}` (the type allows no `cites` on a list, the checker reads it), `assumption {text}` (label "Assumption for this exercise"), `real {text, cites}` (at least one cite), `diagram {title, svg}`, `table {caption, columns, rows}` (every row as long as `columns`; failure-modes table columns: component, what fails, what the user sees, how we recover).

`curiosities?` ("Worth knowing"): `[{id, text, sourceId}]`, 4 to 8 when present, each a one or two sentence hook.

`sources [{id, title, url, company, published, verifiedOn, kind, license?, edition?}]`: at least one; `published` is `YYYY`, `YYYY-MM-DD` or `no date shown` (then `edition` is required); `verifiedOn` is a real date; `license` is required for `reference`.

The header line reads "N claims are sourced; the rest is the site's own reasoning" (`sourcedLine`): N counts blocks with non-empty `cites` (a `real` block always has some), dives with `cites` or `real`, and follow-ups with `cites`, once each.

### What `designProblems` checks

Sources and file
- The file is an object; `slug` equals the file name without `.json`; `title` and `summary` are non-empty.
- `sources` is present and non-empty; ids are unique; `id`, `title`, `company` non-empty; `url` passes `httpsUrlProblem`; `published` form as above; `verifiedOn` is a real calendar date; `kind` is post, paper or reference; a reference has a `license`.
- `topics` is present and non-empty, ids unique, each slug exists, each has a role; `capstone`, when set, exists.

Prose (every string field, via one function)
- Non-empty text.
- Outside a `real` block: no source company word (words of 3 or more letters from any `sources[].company`, minus a generic list such as "cloud", "services", "open", "source"; case-insensitive, whole word) and no quotation mark.
- A digit or one of hundred, thousand, million, billion, trillion, dozen, percent (plural too) fails unless the block is an `assumption` or its `cites` include a `post` or `paper`. Cites of only references do not allow a figure. For ask, say and tip the allowance is an `assumption` block anywhere in the same section. In a `real` block, a four-digit year (1990 to 2099) is ignored only if the text contains a word of a cited company.
- In a `real` block: an unmatched quotation mark fails; a quotation over 25 words fails; more than one quotation per source across the whole page fails (counted per cite id).

Structure
- Every section is an object (a missing or null one is reported without throwing); `topics` is an array of existing slugs (required for all but `general-tips`).
- `cites` is an array of ids that exist in `sources`.
- Block types: `p` (text), `list` (at least one item), `assumption`, `real` (cites non-empty), `diagram` (title non-empty), `table` (caption, columns and rows non-empty, row length equal to columns); any other type fails.
- Diagrams (blocks and stage diagrams): `checkDiagram` rules (no gradients, filters, scripts, a `<title>`), `role="img"`, no hex, `rgb(a)` or `hsl(a)` literal in `fill`, `stroke` or `style`, ids unique across the page.
- Round strings present as text and within the word limits for all eleven sections but `general-tips`.
- Sections with `blocks` need at least one block, except `high-level`. `high-level` needs at least one stage; stage ids unique; `need`, `add`, `weak` are prose.
- `deep-dives`: 3 to 4 dives, ids unique, `title`, `attempt`, `breaks`, `better`, `tradeoff` prose (cited kinds apply); `real` an object with at least one cite and its text checked as a `real` block; `notes` an array of prose.
- `strong-answer`: `talkTrack` and the three levels are prose; 6 to 16 follow-ups, `ask` and `answer` prose (answer takes its cites' kinds).
- `mistakes`: 5 to 8 items, `mistake` and `fix` prose.
- `curiosities`: an array; 4 to 8 when non-empty; ids unique; id and text non-empty; text 45 words or fewer; no source company word; no quotation mark; `sourceId` exists and is not a `reference`. A figure is allowed.
- Banned phrasing over every string in the file: em or en dash, `BANNED_PHRASING` from lib/topics.ts, and the contrast patterns "is not X, it is Z", "it is not X ... it is" and "not X ... but".

Not checked by code (reviewer and lead): that a claim is true, that wording is original, that a quote is an exact substring, that a diagram matches its text, that "typically" is used where providers differ, that topic `role` and section `topics` are apt.
