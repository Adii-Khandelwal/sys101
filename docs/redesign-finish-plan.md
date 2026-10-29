# Redesign finish plan (Phase 6 to 8, plus extras)

Written 29 Oct 2026 on the owner's instruction: finish Phases 6, 7 and 8 end to end, then look for more design to add, study https://engineering-atlas.in/ with REA, adopt what fits, and plan before building. Open judgement calls are decided as a senior engineer would and recorded here. All work stays on `claude/redesign-p5-topic-pages` (owner is not merging PR #118 yet), committed per step, checks per step, one agent running build checks at a time.

## Decisions

### Phase 7 (each item judged on its own)
| Item | Decision | Why |
| - | - | - |
| Timetable (route planner) | Build, small | Derived from the graph (`lib/graph.ts`, topic reading times), no new data, helps "what do I read next" |
| Numbered sidenotes | Build | Reuses `MarginTerms` and `lib/marginStack.ts`; owner already approved margin use |
| Tally marks | Skip | Would show a count twice on a page (rule in CLAUDE.md); owner 6.11 says only if it replaces another display, nothing does |
| Interchange stations | Skip | Node shape already encodes state; the plan's own gate (6.9, 6.16) cannot be proven without owner review on a real phone |
| Ring turntable | Skip | Content work: needs `add-post`, `verify:figures` and the network; not a design change |

### Reference site study (engineering-atlas.in, 26 pages crawled, viewed with REA and Playwright)
It is a commercial, purple dark-hero site (gradients, card rows, pricing, Space Grotesk, coupon banner). Almost all of its skin is banned here, so nothing visual is copied. Structure ideas only:

| Idea seen | Decision |
| - | - |
| Footer as grouped link columns | Adopt (plain text columns, hairline, no icons) |
| FAQ block ("Questions") on About | Adopt as `<details>`, answers from facts the site already states |
| Left contents list with active section | Already built for About (6a); reuse on Glossary and Background if they lack one |
| Numbered section markers beside headings | Already covered by overprint and station numbers; skip |
| "Series" grouping of long reads | Skip (would need new content grouping) |
| Master-detail module browser (Your toolkit) | Skip (duplicates the map and Path) |
| Stats strip ("12 lessons ready") | Skip (duplicate-count rule) |
| "Try this first" prediction box, "Interview radar" | Skip (content work; `InterviewTag` exists) |
| Gradients, dark hero, cards, pricing, Space Grotesk, coupons | Rejected by CLAUDE.md |

## Steps
1. 6b: restyle the remaining pages (reads, glossary, background, data, terms, privacy, 404, hidden `_new`, tours overlay) by the 6a pattern; commit.
2. 6c: footer columns and About FAQ; commit.
3. 7a: sidenotes; 7b: timetable; commit each.
4. Copy pass (owner, 29 Oct 2026): every page's headings, subheadings, descriptions, intros, labels, empty states and button text, checked for clearer, plainer, more specific wording. Scope: the site's own words (home, topic and learn page frames, capstone frames, list pages, text pages, 404, tours, meta titles and descriptions). Not in scope: sourced figures, quotes, post summaries and quiz answers (honesty rules, `verify:figures`); change those only with a source reopened. Rules: no em dashes, titles under 60 characters, descriptions under 155 ending at a sentence boundary, no "It's not X, it's Y", sentence-case Cabin labels, keep tests, tours and `check-seo` in step. Output: a table of old to new wording per page in `docs/drafts/copy-pass.md`, one commit.
5. 8: full checks (`tsc`, lint, tests, build in `.next-build`, `check-seo`, `check-news`, `check-diagram-overflow`, `check:ui` on a server on another port, `check:tour`, `check:offline`), `/ponytail-review`, update docs and rule files, fix, then push the branch and open the PR into `main`'s integration target as the plan says. Not merged by me. Not checked and said so: Safari, a real phone, Lighthouse, forced-colors.

## Round 2: the optional items (owner "do the optional ones too", 29 Oct 2026)

Branch `claude/redesign-extras` from `main`, one worker at a time (shared CSS, shared `.next-build`), one commit per item, one PR at the end.

| Item | Plan | Gate |
| - | - | - |
| Tally marks | Draw topics read in a Path group as tally strokes (fives struck through) that REPLACE the existing read count text in that place, so no count shows twice (6.11); text alternative carries the number | Greyscale and screen-reader check; `lib/homepage.test.ts`, no duplicate counts |
| Interchange stations | Topics that sit in more than one group of the graph get a separate outer ring; node state stays by shape (6.9, 6.16); legend gains one entry only if needed | Six states plus ring distinct in greyscale; layout and crossing tests stay green |
| Ring turntable | Only if a verified post's `digest.numbers` rows and its text give a mechanism: one figure per `figures.md`; goes through `add-post` rules and `verify:figures` (network) | Stop and report if no source qualifies; never invent numbers |
| Copy round three | Topic and learn page frames, glossary, posts, terms, learn pages, empty states, tour text; same rules as before | check-seo, tours, tests in step |
| Study ideas | Left-label / right-list layout on grouped list pages; a jump line without counts on /capstones, /reads, /glossary; "Short version" under Privacy and Terms titles (only claims the policy makes); oldstyle figures for years if Libre Caslon has them | 390 and 1440 screenshots; accessibility rules |
| Not doing | "Try this first" and "Where people slip" (35+ new sourced texts), numbered section markers (clash with overprint and station numbers), collapsible side contents (layout shift) | Said again in the PR |
