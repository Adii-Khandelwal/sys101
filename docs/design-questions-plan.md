# Design questions plan (interview and work resource)

Working record, created 31 Oct 2026 on branch `claude/design-questions`. Not a rule file. When a phase ships, its rules move to `.claude/rules/design-questions.md` (a new area needs its own rule file and a row in the CLAUDE.md table) and this file is trimmed.

## 1. Goal

Make sys101 a 0 to 100 resource for system design interviews (Google, Uber, Rubrik, Flipkart, Microsoft and other top tech companies) and for daily engineering work. Three layers, each with its own evidence rule:

| Layer | Page type | Job |
| - | - | - |
| Learn | `/topic/<slug>` (exists, 36 topics) | The building blocks, taught through real company posts |
| Prove | `/capstone/<slug>` (exists, 7 capstones) | One real system, reveal-after-you-pick, verified figures |
| Practice | `/design/<slug>` (new) | "Design X" in an interview shape: the 8 steps, timer, rubric, links to Learn and Prove |

Capstones are kept. A capstone answers "how did a real company build this"; a design question answers "how would I answer this in 45 minutes". They link to each other. No capstone is replaced.

## 2. The one rule that overrides everything: verified sources only

Set by the owner on 31 Oct 2026: never guess content, use only a verified legitimate source. This replaces the earlier idea of a "general reasoning" tier. Consequences:

- Every claim on a design page cites a `sourceId` in the page's `sources`. A step with no verified source is not written. It shows the line "No verified source yet" and is counted in the page's coverage line. Nothing fills the gap.
- Two source kinds only:
  - `post` or `paper`: an engineering post or paper by a team that ran the system (the five Post selection rules in CLAUDE.md). Only this kind may supply a figure.
  - `reference`: explanation only, never a figure. Allowed: openly licensed material whose license was read and recorded in the source (for example the system-design-primer repo, license to be confirmed before use), official documentation, and the precedents already accepted (Confluent, Debezium). Paid or all-rights-reserved books and sites (Alex Xu, ByteByteGo, Grokking, Educative) are never copied, paraphrased closely, or cited for a figure. Their question titles may be used as a coverage checklist only, because a title is not protected expression.
- Estimation defaults come from figures in the page's own sources. A learner-entered number is the learner's. No invented "assume 100M users" default.
- LLD (class design, parking lot, Splitwise, elevator) is **parked**: no legitimate engineering-source type exists for it. It ships only if the owner names an acceptable licensed source. Until then it is listed as "not started, no source" and nothing is written.
- Figures go through `add-post`: fetch the raw page with curl and confirm the number appears. Drops are listed in the report.
- Before saving a new post, show the owner its URL, company and why it passed.
- A new company needs a logo in the same change (`node scripts/make-logos.mjs add`).
- All other CLAUDE.md rules stand: no em dashes, no "It's not X, it's Y", tokens for colour, Cabin labels, skeletons, neutral voice, 1440px and 390px review, no duplicate counts.

## 3. Page specification (`/design/<slug>`)

`content/design/<slug>.json`, file name equal to `slug`. Reuses capstone patterns (loader, check function, rail, picks in localStorage with try/catch).

Fields:

```
slug, title, summary,
topics [{slug, role}]            // max 3 prerequisites rule does not apply, but every slug must exist
capstone?: slug                  // optional link to the capstone that proves the hard part
steps [{
  id: "requirements" | "estimation" | "api" | "data-model" | "high-level"
    | "deep-dives" | "failure-and-scale" | "trade-offs",
  status: "sourced" | "no-source-yet",
  claims [{ text, kind: "post" | "paper" | "reference", sourceId }],   // empty when no-source-yet
  topics [slug]                  // topics this step leans on
}],
sizing?                          // same shape as capstone sizing; defaults from sources only
quiz                             // topic LessonQuestion shape, teaches one of the page's topics
sources [{ id, title, url, company, published, verifiedOn, kind, license? }]
```

Build checks (new `designProblems` in `lib/design.ts`, run by `getAllDesign`): schema, every `sourceId` resolves, a `sourced` step has at least one claim, a `no-source-yet` step has none, a `reference` source has `license` and no figure appears in a claim that cites it, every topic slug exists, step order is fixed, banned phrasing fails, `verifiedOn` present. Tests in `lib/design.test.ts`.

Page sections (each opens "After this you can ..."): The question, Do it first (timer, the 8 steps as empty boxes the learner fills; stored locally, never exported), Size it (if `sizing`), The answer by step with a source badge per claim and the coverage line "5 of 8 steps have a verified source", Check yourself, Original sources. The model answer appears only after the learner marks the step attempted, same reveal rule as capstones.

Index `/design`: title, summary, coverage line, search box with the standard behaviour (`/`, Escape, Enter, word-start matching, aria-live count). Nav and sitemap entries, JSON-LD, Pagefind body, `PageUpdated` from the newest `verifiedOn`.

## 4. Phases

| # | Phase | Output | New sources? | Depends on |
| - | - | - | - | - |
| 1 | Playbook | Method page: 8-step skeleton, 45-minute budget, numbers cheat sheet, common mistakes | Yes: every number needs a verified source | research (R1) |
| 2 | Page type | Schema, loader, checks, tests, `/design` and `/design/<slug>` | No | this file |
| 3 | Pilot | Payments gateway answer built from sources already in the repo, reviewed at 1440 and 390 | No | 2 |
| 4 | Question bank | About 30 classic questions mapped to topics and capstones with a coverage flag each | No (titles only) | 2 |
| 5 | Back-fill | The 7 capstone-backed questions, then others as sources allow | Where found | 3 |
| 6 | Interview tags | `interviewRelevance` set on all 36 topics, `SHOW_INTERVIEW_TAGS` on | No | owner review of the ratings |
| 7 | Practice mode | Timed run with rubric from the step list; compare with the model answer | No | 3 |
| 8 | Source hunt | Ride dispatch, e-commerce checkout, feed fanout, geospatial, search, unique IDs, locks and leases | Yes | independent |
| 9 | LLD | Parked, see section 2 | n/a | owner names a source |

Order: 2 and R1 and the pilot draft run in parallel first (different files). Then 3 integration, then 4 to 7. Phase 8 runs in the background and never blocks anything.

## 5. Workers (first wave, parallel, different files)

Model rule: judgement and accuracy work goes to `worker-strong`; one `reviewer` round; admin merges. Max 3 at once. Brief each with TASK / FILES / DONE WHEN / SKIP and "do not start extra review rounds or launch sub-agents".

### W1: page type (code)

- TASK: implement section 3: `lib/design.ts` (types, loader, `designProblems`, `getAllDesign`), `lib/design.test.ts` using in-test fixtures only, `components/design/*`, `app/design/page.tsx`, `app/design/[slug]/page.tsx`, nav and sitemap entries. Reuse `lib/capstones.ts`, `lib/formula.ts`, `components/capstone/*` patterns; read `.claude/rules/capstones.md`, `accessibility-and-chrome.md`, `motion.md`, `seo.md` first. No content JSON may be created; do not touch `content/`.
- DONE WHEN: `npx tsc --noEmit`, `npm run lint`, `npm test` pass; with no files in `content/design/` the build still passes and `/design` shows an honest empty state; a fixture with a claim citing a missing source, a `reference` claim containing a figure, and a `no-source-yet` step with claims each fail `designProblems`.
- SKIP: LLD, practice mode, interview tags, any content, any dependency.

### R1: research for the playbook numbers (read-only, no site files)

- TASK: find candidate legitimate sources for (a) the interview method (how a design discussion is structured) and (b) a numbers cheat sheet (latency, throughput, storage orders of magnitude). Prefer primary sources: papers and talks by the engineers who measured them, official documentation, Google SRE book. For each figure fetch the raw page with curl (browser-like headers if blocked) and confirm the number appears. Write `docs/drafts/design-playbook-sources.md`: one row per candidate with URL, company or author, year, license or terms, the exact figure and where it appears, and the five-rule verdict. Drop and list any figure not found on the raw page. Do not save anything to content.
- DONE WHEN: each candidate has a raw-page confirmation or is in the drop list; stale numbers carry their year; no source is paid or all-rights-reserved.
- SKIP: writing the playbook itself, books you cannot open, anything behind a login.

### W3: pilot draft for the payments gateway (draft JSON, no schema code)

- TASK: draft `docs/drafts/design-payments-gateway.json` following the section 3 shape, using ONLY sources already verified in the repo: `content/capstones/payments-ledger.json` sources and the sources on the topics `distributed-transactions`, `idempotency-and-retries`, `indexing`, `sharding`, `object-storage` (read them from `content/topics/*.json`; do not re-fetch). For each of the 8 steps, write claims in your own words that those sources actually support, each with its `sourceId`; where the sources do not cover a step, set `status: "no-source-yet"` with no claims. Add a short report listing every step and why it is sourced or not. Do not invent figures or company names.
- DONE WHEN: every claim traces to a quoted passage in an existing repo source (list the passage location in the report); no figure appears that is not already in a repo source; banned phrasing absent.
- SKIP: new research, Razorpay or Splitwise claims without a source, the schema code, any file outside `docs/drafts/`.

### Reviewer (after the wave)

One `reviewer` call on W1's diff (DONE WHEN above) and one on W3's draft (claim to source check). R1 is checked by admin against the raw-page confirmations.

## 6. Checks before any push

1. `npx tsc --noEmit`, `npm run lint`, `npm test`.
2. Build with `NEXT_DIST_DIR=.next-build` (the dev server may be running), then `check-seo`, `check-news`, `check-diagram-overflow`, then remove the directory.
3. Render `/design` and each design page at 1440px and 390px, light and dark; `npm run check:ui`.
4. `/ponytail-review` on the diff. State what was not checked.
5. New rule file `.claude/rules/design-questions.md` plus the CLAUDE.md table row, `README.md`, and a line in `docs/owner-ideas.md`. Changes under `.claude/` or CLAUDE.md are never auto-merged: the owner merges.
6. Never push unasked. Commit only on `claude/design-questions`.

## 7. Open decisions

- LLD: parked until the owner names a licensed source.
- Whether the system-design-primer license (CC BY 4.0 as remembered) allows the reuse planned; R1 reads the license file before any use.
- Interview relevance ratings (phase 6) need owner review.

## 8. Owner ideas logged (also in `docs/owner-ideas.md`)

- 31 Oct 2026: add standalone "Design X" interview questions (Payment gateway, Splitwise, Uber, Flipkart and similar) for HLD, and LLD, aimed at Google, Uber, Rubrik, Flipkart, Microsoft and other top tech companies.
- 31 Oct 2026: use only verified legitimate sources; never guess content.

## 9. Revision, 31 Oct 2026: read-only pages (overrides sections 1, 3 and 4 where they differ)

Owner decision: design pages are for reading, not for exercises. The learner wants to read how to communicate an answer and what can happen in an interview (if the interviewer says this, answer like this; if that, then that), and to see how an interview goes.

Removed from the page type: the timer, the "Do it first" step boxes and "I have attempted this step" marks, the locked-until-attempted reveal, the sizing calculator, the quiz, all stored notes and picks (so nothing on /design touches localStorage, `clearDesignNotes` and its call in `components/DataControls.tsx` go, and no Privacy or `/data` wording is needed for design pages). Phase 7 (practice mode) is dropped.

New and kept:

- Every step's answer is fully visible, with the source badge per claim and the coverage line once.
- A new section "If the interviewer says ..." (`followUps`): `followUps [{ id, ask, claims [{ text, kind, sourceId }], topics [slug] }]`. `ask` is the interviewer's question or a changed condition, worded from what the page's own sources describe (for example a load jump, a failure, a stricter consistency need). The answer is only the sourced claims, in order, as a reader would say them. A follow-up with no supporting claims is not written. At least 3 per page once the page has 5 or more sourced steps; none are invented to fill a count. Build checks reuse the claim rules (sourceId resolves, reference claims hold no figure, banned phrasing).
- A separate page, "How an interview goes", built only from official first-party interview guidance (R2 research, `docs/drafts/interview-process-sources.md`). No claim on it without a raw-page confirmation. Candidate sources are company careers and candidate-prep pages (Google, Meta, Amazon, Microsoft, Uber and others whose pages say how their interview works). Where a company gives no guidance, the page says so. Nothing is written from memory.
- Index `/design` keeps the coverage total (two or more questions only) and links to "How an interview goes".

Wave 2 workers (different files): W1b (page-type code: remove the interactive parts, add `followUps` and its checks, update tests; files `lib/design*.ts`, `components/design/**`, `app/design/**`, and removing the `clearDesignNotes` call in `components/DataControls.tsx`), R2 (research only, `docs/drafts/interview-process-sources.md`), W3b (extend `docs/drafts/design-payments-gateway.json` and its report: drop `sizing` and `quiz`, add `followUps` only from sources already in the repo).

## 10. Revision, 31 Oct 2026: teach from the wider internet (reference layer; overrides section 2 where it differs)

Owner decision: design pages must not rest mainly on the company tech blogs already in the repo. Blogs do not carry the whole picture or the fluency of teaching, so the explanation layer draws on legitimate sources from the internet at large.

Rules for this layer (the verified-sources rule of section 2 stays):

- Two layers on every design page. **Evidence** (kind `post` or `paper`): company engineering posts and papers, the only source of figures and of "a company did this". **Explanation** (kind `reference`): the wider internet, used to teach what each step is, what a good answer says, what the pieces do and why, and how to phrase it. Explanation claims carry no figure (digits or number words), and the page never says a company did something on the strength of a reference source.
- What counts as a reference source: first-party official documentation (for a payment gateway, the public docs of payment providers that describe their own API, objects and webhooks), regulator and standards bodies' public documents, university course notes and open textbooks with a licence that permits the use, openly licensed repos (CC BY 4.0 and similar, licence read and recorded), and free tutorials by named experts whose terms allow citation. Each needs: URL, author or company, date or "no date shown", the licence or terms read from the raw page, and a confirmation on the raw page (curl, not WebFetch).
- Never: paid or all-rights-reserved books and interview-prep products (their text, diagrams and structure), forums, YouTube, AI summaries, anonymous posts. Question titles from them stay a checklist only.
- Writing: always the page's own words. No copying and no close paraphrase, even from a licence that allows copying, unless it is quoted under the quote limit with attribution. A CC BY text may be reused only with attribution recorded in the source entry. At most one short quote per source (CLAUDE.md copyright rule).
- Every reference claim still cites its `sourceId`; a claim whose support is not on the raw page is dropped. A step may now be `sourced` with reference claims only. Its badge reads "explained from reference sources", not "a company did this".
- Page layout stays: the 8 step answers (now richer, with the reference explanation first and the evidence claims after), the follow-ups, Original sources. Where explanation and evidence disagree, the page says so.

Next worker wave: R3 (research: reference sources for the payments gateway steps, `docs/drafts/design-gateway-reference-sources.md`), then a writing worker that builds the explanation layer only from R3's confirmed rows, then one reviewer round.

## 11. Revision, 31 Oct 2026: internet for the knowledge, blogs only for the close (overrides sections 3 and 10 where they differ)

Owner decision: all the teaching knowledge on a design page comes from the wider internet (the reference layer of section 10). The company tech blogs are used only at the end, as a few short inquisitive lines about the topic meant to make the reader want to know more.

- Step answers and follow-ups: explanation claims, kind `reference`, from R3-style confirmed sources. No figures there.
- A closing section "Worth knowing" (`curiosities [{ id, text, sourceId }]`, 4 to 8 per page): one or two sentences each, taken only from company posts and papers already verified in the repo (kind `post` or `paper`), carrying the company and year through the source badge. Each line is a hook: a surprising figure or a decision that raises a question, ending where the reader would ask "why?". Figures are allowed here because the source is a company post. Wording: neutral voice, no "I" or "we", no em or en dash, no "it is not X, it is Y", no "not X but Y". A line may end in a question, never invents a cause, and never says more than the post text supports (same standard as section 9 claims: realChoice, brief requirement, or digest numbers, tradeoffs, walkthrough).
- The existing reviewed evidence draft (`docs/drafts/design-payments-gateway.json`) stays as the bank the curiosity lines are chosen from. Nothing new may be added to that bank without `add-post`.
- Page order: question, answer by step (explanation), "If the interviewer says ...", Worth knowing, Original sources.

## 12. Revision, 31 Oct 2026: legitimate system design teaching sources count (amends section 10 "What counts" and "Never")

Owner clarification: "from the internet" means the recognised system design teaching sources on the open web, not only provider documentation.

Now allowed as `reference` sources (explanation only): free-to-read pages of established system design teaching sites and educators (for example ByteByteGo's free articles, Hello Interview's free guides, Exponent and Educative pages that are open without login, GeeksforGeeks design articles), vendor architecture guides (Microsoft Azure Architecture Center, AWS Well-Architected and Builders' Library, Google Cloud Architecture Center), recognised practitioners' sites (for example Martin Fowler), university course notes (for example MIT 6.5840), and openly licensed repositories (system-design-primer, CC BY 4.0).

Still never: copies of paid or all-rights-reserved books hosted without the owner's permission (for example the PDF of Alex Xu's book on GitHub), anything behind a paywall or login, forums, YouTube, AI summaries, anonymous posts.

How they are used:
- Read the freely available page, then write the point in the page's own words. No copying, no close paraphrase, no reproduced diagrams, structure or example sets. At most one short quote per source with attribution.
- No figure (digit or number word) is taken from a teaching source. Their numbers are teaching assumptions, not measurements.
- Each source entry records the URL, author or site, date shown, the terms line read from the raw page, and confirmation on the raw page (curl; a page that needs JavaScript or a login is dropped). A claim whose support is not on the raw page is dropped.
- A claim cites several teaching sources where they agree, and the page says where they differ. Agreement across two or more independent teaching sources is the bar for a point that is not in official documentation.
- Reading the sites for ideas does not make the page a summary of any one of them; the question list may follow common coverage, the wording may not.

## 13. Revision, 31 Oct 2026: pages read like an interview (adds to sections 9 to 12)

Owner decision: teach each design question the way the interview would go.

- Page order becomes the order of the round: the question as the interviewer would open it, then for each of the 8 steps an **Interviewer** line (a standing prompt per step, stored once in `lib/designSteps.ts`, for example "Start by saying what the system has to do") followed by **You** (the step's explanation claims, each with its source badge); then the interviewer's pushes as "If the interviewer says ..." branches, each an Interviewer line and a You answer; then "Worth knowing" (curiosity lines from company posts); then Original sources.
- Interviewer lines are standing prompts and branch questions written as plausible prompts. They are never claims about what a named company does. A one-line note under the title says so: "The interviewer lines are typical prompts, not a record of any company's interview."
- What real companies say about their rounds comes only from the official pages R2 confirmed (`docs/drafts/interview-process-sources.md`) and appears on one separate page, "How an interview goes" (`/design/how-it-goes`), linked from `/design` and from each design page. It states each company's own words about round length, stages and what is looked for, names the company and the page date, and lists the companies with no readable official guidance (Google, Uber, Rubrik, Netflix, Apple). It never says interviewers change constraints, because no official page does.
- On that page a company's own statement of round length may be a figure (for example a 45-minute round), attributed to the company and dated. This is the only place a first-party interview statement carries a figure. Explanation claims on design pages still carry none.
- Content file for that page: `content/interview-process.json` (not inside `content/design/`, which holds questions only).

## 14. Revision, 31 Oct 2026: the 16 breakdowns and the teaching pattern (adds to sections 9 to 13)

Owner decision: all 16 question breakdowns in the Hello Interview "Question Breakdowns" list (Bitly, Dropbox, Local Delivery Service, Ticketmaster, FB News Feed, Tinder, LeetCode, WhatsApp, Rate Limiter, YouTube, FB Live Comments, YouTube Top K, Uber, Web Crawler, Ad Click Aggregator, FB Post Search) become design pages, taught in that style and in the step-by-step build-up style of the Alex Xu books.

- The page list is a coverage checklist (titles are not protected). The wording, the order of examples, the diagrams and the answers are the site's own, built from confirmed sources. The Hello Interview and Xu texts are never copied or closely paraphrased, and the Xu books are never read from the unlicensed GitHub PDF.
- Teaching pattern: R4 studies the open Hello Interview pages and writes a pattern spec in its own words (`docs/drafts/design-teaching-pattern.md`): section order, what each section does, how scope and non-functional requirements are chosen, how a design grows one requirement at a time, how deep dives and trade-offs are framed, how expectations by level are given. The site applies that pattern with its own rules: read-only, a source badge per claim, no figure from a teaching source, original SVG diagrams built from the page's own claims.
- Sourcing: for each question, at least 2 independent confirmed teaching (reference) sources, plus candidate company posts or papers (evidence, for Worth knowing) that pass the Post selection rules. Batches: A (Bitly, Dropbox, Local Delivery Service, Ticketmaster, FB News Feed, Tinder, LeetCode, WhatsApp), B (Rate Limiter, YouTube, FB Live Comments, YouTube Top K, Uber, Web Crawler, Ad Click Aggregator, FB Post Search). The remaining 13 breakdowns on that site (Yelp, Instagram, Strava, Distributed Cache, Online Auction, Job Scheduler, News Aggregator, Price Tracking, Notification System, Robinhood, Google Docs, Payment System, Metrics Monitoring) follow after the first wave, as a later batch.
- No page is written for a question until its sources are confirmed. A question that cannot reach 2 confirmed teaching sources is listed as "not ready", never filled from memory.
- New candidate company posts are shown to the owner (URL, company, why it passed) before any is saved to `content/`.

Amendment to section 14 (31 Oct 2026): the exact 16 questions are not required. The point is to learn how each breakdown is written, for any topic. Batches A and B were stopped after partial results (kept in `docs/drafts/design-sources-batch-a.md` and `-b.md` as they stand). R4 now studies at least 10 open pages of different shapes plus 3 concept pages and writes a reusable writing template. Which questions the site covers is decided later, by which ones reach 2 confirmed teaching sources.

## 15. Page shape v2 (31 Oct 2026, from `docs/drafts/design-teaching-pattern.md`; replaces the fixed 8 steps for the pilot)

One question only (the payments gateway pilot) until the owner has seen it. The Alex Xu book PDF hosted on GitHub is not used: it is an unlicensed copy and the owner cannot grant rights to it. Owner-pasted passages may be used if offered.

Sections, in order (`lib/designSteps.ts` holds the id list and one standing interviewer `prompt` each; ids are fixed and in this order):

1. `scope`: plain page definition, no sources: `{ mustDo: string[3..5], leftOut: [{ item, kind: "feature" | "system" }], why: string }`. It is the page's own choice of what to cover, written neutrally, and says each left-out item can wait. Left-out items are product extras or whole systems that are their own question.
2. `qualities`: `{ status, claims[], topics[] }`. Each claim names a quality, where it bites and the tension (for example one path strict, another relaxed), supported by a reference source. No figures. Pick only qualities that force a later dive.
3. `things-and-contract`: `{ status, claims[], topics[] }`. Entities as nouns with the non-obvious splits explained, and the calls (one per must-do), with identity and trust notes.
4. `build-it-up`: `{ status, stages: [{ id, need, claims[], weak?: claim, diagram?: svg string }], topics[] }`. One stage per must-do, in order: the user need, the smallest addition, the numbered request path as claims, and what is still weak. A diagram per stage is optional; when present it shows only what the stage added, original inline SVG in the site tokens, passing `checkDiagram`, with every label taken from the stage's own claims.
5. `deep-dives`: `{ status, dives: [{ id, question, claims[] (why the current design fails), rungs: [{ id, label: "attempt" | "works" | "better", claims[] }] }], topics[] }`. 2 to 4 rungs per dive in learning order; each rung says what it does, why it is weaker or stronger, and the one cost it leaves. Display words: "First attempt", "Works, at a cost", "Fixes the cost" (the site's own wording, not another site's labels). A rung may be right only in some context and says so.
6. `against-the-grain`: `{ status, claims[], topics[] }`. A note where the common answer is wrong for this case, only if a source supports it.
7. `failure-and-change`: `{ status, claims[], topics[] }`. What happens when each new part fails, and what it costs to run.
8. `thorough-answer`: `{ status, claims[], topics[] }`. Which sections a first pass needs, which dives add depth, which judgement calls separate a thorough answer. Never a claim about any company's hiring bar.

Then `followUps` (an Interviewer line and a You answer, as built), `curiosities` ("Worth knowing"), `sources`. Every claim keeps `{ text, kind, sourceId }` with the section 12 rules (reference claims hold no figure and no number word; kind equals the source's kind; no causal word the source does not state; own words, at most one short quote per source). Per section: `sourced` needs claims, `no-source-yet` has none and the page shows "No verified source yet". Coverage line counts sections. Explanation claims come from reference sources; company posts appear only as `curiosities` (4 to 8 lines, hooks, digits allowed) and may reuse a post already used on a topic page, linking back to that topic's section.

Checks: `designProblems` covers the same rules over every claim array including stage, weak, rung and follow-up claims; dives need 2 to 4 rungs in order of the `label` set; diagram strings go through `checkDiagram` and every word in a node label must appear in the stage's claims (shown as a build error otherwise).

## 16. Page shape v3: an original model answer (31 Oct 2026; supersedes sections 11, 12 and 15 where they differ)

Owner brief (pasted by the owner): the page is a complete, original, vendor-neutral model answer. The explanations are the site's own, written from understanding. Sources back facts about how real systems behave; they are not the text of the answer.

Rules:
- General engineering reasoning is the site's own and needs no citation, but must be correct: each piece is checked against at least one official source, and the report flags any that could not be.
- Every statement about how a real company or API behaves cites a page that was opened and re-read on the raw page. Vendor names appear only in a short "How a real system does it" note, never as the explanation.
- No invented figure, date, limit or quote. A number is either a labelled assumption for the exercise or a verified figure from a company post or paper. Where behaviour varies between providers the text says "typically" and names the source.
- Own structure, own wording, own diagrams. Nothing follows a source's outline, sentence structure, examples or diagrams. The generic framework (requirements, entities, API, design, deep dives) is common knowledge.
- Voice: plain, specific, whiteboard. The banned list and diagram rules in CLAUDE.md apply. Keep the Interviewer and You voice and the "typical prompts, not a record of any company's interview" line.

Sections, in order (top-level keys of `content/design/<slug>.json`): `clarify`, `requirements`, `entities`, `api`, `data-model`, `high-level`, `deep-dives`, `failure-modes`, `against-the-grain`, `strong-answer`, `mistakes`. Then `curiosities` ("Worth knowing", unchanged), `sources`, and slug, title, summary, topics, capstone.

Block types (each section is `{ blocks: Block[] }` unless noted; `topics` per section stays):
- `p`: `{ type, text, cites?: sourceId[] }`: a paragraph of the site's own reasoning. Cites are optional and mark the facts about real systems it rests on.
- `list`: `{ type, items: string[] }`.
- `assumption`: `{ type, text }`: shown with the label "Assumption for this exercise"; digits allowed.
- `real`: `{ type, text, cites: sourceId[] }` (at least one): the only block that may name a vendor and the only one that may hold a short quotation (at most one quote per source, 25 words or fewer).
- `diagram`: `{ type, title, svg }`: original SVG, passes `checkDiagram`, tokens only, unique ids, `<title>` and `role="img"` label; the label-word-from-claims rule does not apply.
- `table`: `{ type, caption, columns: string[], rows: string[][] }` (failure modes: component, what fails, what the user sees, how we recover).
- `stage` (high-level only, in `stages[]`): `{ id, need, add, weak, diagram? }`.
- `dive` (deep-dives only, in `dives[]`): `{ id, title, attempt, breaks, better, tradeoff, cites?, real? }` plus an optional shorter `note` list for scaling and reconciliation.
- `strong-answer`: `{ talkTrack: string, levels: { mid, senior, staff }: strings, followUps: [{ ask, answer, cites? }] (6 to 8) }`.
- `mistakes`: `[{ mistake, fix }]` (5 to 8).

Checks (`designProblems`): cites resolve; a `real` block has cites; a source company or vendor name (any `sources[].company` word, case-insensitive) in a block that is not `real`, or in a `curiosity`, fails (vendor-neutral); digits and the words hundred, thousand, million, billion, trillion, dozen, percent in a block that is not an `assumption` fail unless the block cites a `post` or `paper` source; quotation marks only inside `real`; banned phrasing anywhere; diagram checks; step order; counts (dives 3 to 4 plus notes, followUps 6 to 8, mistakes 5 to 8, curiosities 4 to 8 when present); the old sourced/no-source-yet statuses go away.

Page mechanics: drop the per-line "Explained from reference sources" label. A block with cites shows its citations as links (source name and year) after the text; unmarked text is the site's own reasoning. The header line reads "N claims are sourced; the rest is our reasoning" with N the number of blocks that have cites, and no per-section coverage. Keep Leans-on topic links, reading time and "Page last updated".

Process: R6 (research) and W1e (page-type code) in parallel; then the writer (W6); then one reviewer round for accuracy, originality (paragraph by paragraph against every source opened, flagging copying or close paraphrase) and the banned list; at most 2 rounds. Checks: tsc, lint, tests, build into another directory, check-seo, verify:figures, diagram overflow, check:ui. No push. The other design pages are not touched until the owner approves this one.

## 17. Ask, say, tip (1 Nov 2026, owner request; adds to section 16)

Owner request: make it clear what question the interviewer asks, what the learner should reply, and a general tip, and cover how the round goes.

- Each of the 11 sections gets three required strings at its top: `ask` (the interviewer's question for this section, specific to the page's question, 6 to 40 words, a question or an instruction as a person would say it), `say` (what the learner replies, a spoken script in first person, 25 to 140 words, the way the "Say it in 30 seconds" answers are written; learner-voice first person is allowed here as elsewhere for spoken answers), and `tip` (one or two sentences, 8 to 45 words, neutral voice, a general habit for this part of the round). They replace the standing `prompt` strings in `lib/designSteps.ts`. The page note "typical prompts, not a record of any company's interview" stays.
- Rendering per section: a framed "round" box before the detailed material with three labelled rows, "The interviewer asks", "What you say" and "Tip", each with a text label and a shape marker (hollow square, filled square, a short rule) so the state never rests on colour; then a heading "The reasoning behind it" before the blocks, stages, dives and tables. The rail and strip names are unchanged.
- A new first section `general-tips` (rail name "General tips"): `{ blocks: Block[], topics? }`, no ask/say/tip. It states how a round typically runs and habits that work in any design round: clarify before drawing, state assumptions aloud, agree priorities, draw early and keep to it, think aloud, name the trade-off and the cost, check in with the interviewer, handle a follow-up that changes a constraint, and what to do when stuck. Facts about how real companies run their rounds come only from official first-party pages confirmed in `docs/drafts/interview-process-sources.md` (R2) and appear in `real` blocks naming the company and the page date; no figure from those pages is repeated unless the block cites it. The rest is our reasoning.
- Checks (`designProblems`): `ask`, `say`, `tip` present as strings for all 11 sections, within the word limits above, no banned phrasing, no vendor name, digits and big-number words only if the same section has an `assumption` block that the script refers to ("the assumptions above" is fine, a bare figure is not), no quotation marks. `general-tips` blocks follow the usual block rules.
- Content: the writer adds ask, say and tip for every section of the payments page and the `general-tips` section, and folds in the reviewer's five changes from the final review (rewrite the `real` blocks from what each source shows for this design, fix the five consistency slips, correct the Stripe and Adyen notes, titles and IETF version, remove the "rather than" contrasts and add the circuit-breaker trade-off), plus the two layout notes the owner saw (put the scaling and reconciliation notes after the dives, and remove a repeated cite).
