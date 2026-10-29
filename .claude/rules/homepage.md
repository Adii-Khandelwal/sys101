---
paths:
  - "app/page.tsx"
  - "components/Home*.tsx"
  - "components/NextUp.tsx"
  - "components/PathView.tsx"
  - "components/PostSources.tsx"
  - "components/InsideTopic.tsx"
  - "components/TryQuestion.tsx"
  - "components/DailyFigure.tsx"
  - "components/StateLegend.tsx"
  - "components/StationSign.tsx"
  - "lib/stationSign*.ts"
  - "components/Search.tsx"
  - "lib/homeContent.test.ts"
  - "lib/homepage.test.ts"
  - "lib/nextUp*.ts"
  - "lib/order*.ts"
---

# Homepage

Applies when editing the homepage and its parts.

## Standing rules

- Topic numbers come from one function, topicOrder in lib/order.ts. Order: masthead (what it is, who it is for, why, one filled start button), map or Path view with the station sign (from 1024px) under the map and the "All topics" index, Inside a topic (DNS), Try a question, Put it together (the first three capstones, hidden when there are none; the link to /capstones shows once there are two or more and reads "All N capstones" when more than three exist), Companies we learn from. Thin dividers and a few 1.5px frames (the figure of the day, the All topics and Path group badges), no cards or images; the only icons are company marks beside company names (components/CompanyLogo.tsx), plus the site's own `LogoMark` beside the big wordmark. A new company in any post needs a mark: node scripts/make-logos.mjs add (.claude/rules/logos.md); a test fails without one.
- Every homepage number, name, date, and excerpt is computed from data at build time. Never hardcode them (lib/homepage.test.ts scans the source).
- "Try a question" uses component state only and never touches the progress store.

## Specification

- Order: masthead (wordmark, lead line, a two-paragraph pitch: why company write-ups are worth learning from, and what the site does with them, the start button or Next up line, Why I made this (links to /about, whose first section is "Why I made it") and tour links, search; two columns from 1024px with the pitch beside the wordmark, one column below, so the map's top edge stays visible; the right column, the search underline and the Map/Path controls end on one right edge), the map or Path view with the station sign (from 1024px) under the map and the "All topics" index, Inside a topic (DNS), Try a question, Companies we learn from. Thin dividers and a few 1.5px frames (the figure of the day, the All topics and Path group badges), no cards or images; the only icons are company marks beside company names (.claude/rules/logos.md). The top edge of the map stays visible without scrolling at 1440x800 and 390x844.
- Every homepage number, name, date, and excerpt is computed from data at build time (topics, quiz, posts). Never hardcode them; lib/homepage.test.ts scans the source.
- The one filled button under the intro (NextUp, `homeAction` in lib/nextUp.ts, from local progress only; the static HTML shows the first-visit version). Priority: a topic you deliberately started (a section marked done or a quiz question answered) beats one that is merely ready, because it is what you are in the middle of. 1) Started: "Continue: <topic>" (or "Finish:" when two or fewer units are left) linking to the first unfinished section, with that section's name and "x of N done" beside it. 2) Nothing started, nothing read: "Start with <first topic>" and its reading time. 3) Something read, nothing started: "Next up: <topic>" with "Also ready" under it and the topics-read count. 4) Everything read: "All caught up". With several started, the latest deliberate change wins (`updated` is stamped only on those), then the one furthest along, then course order; the quiet line under the button names up to two others with their progress and "and N more". With one started, the quiet line is "After it: <next ready topic>". Topics that are read, no longer in the course, or only visited are ignored. There is no separate "pick up where you left off" line: this button replaces it.
- Inside a topic: the real section names in order (lib/lessonOutline.ts, checked against TopicLesson.tsx) with real counts, generic wording (no topic name, no "Open" link), and a figure of the day: one digest figure from FEATURED_FIGURES, each with company, year, and its post linked. All are in the static HTML; the first shows without JavaScript and the reader's local date picks one after load. Each must exist in its digest (the build fails otherwise).
- Try a question: the DNS lesson quiz questions in order, looping. After an answer the result stays 5 seconds (paused while the pointer or focus is inside, and "Next question" skips it), then the next question fades in (opacity and transform only). Component state only; never reads or writes the progress store.
- Counts: the homepage shows none (the intro is two short paragraphs of pitch, no numbers). /posts says "sources" and "organizations" (lib/posts.ts sourceCounts: one entry per URL, Amazon and its Builders' Library credit as one organization). /posts also names the kinds present: engineering posts, research papers (ageNote starts "This is a research paper"), documentation pages (an edition other than "date unknown").
- Companies we learn from: organizations alphabetical, each with its mark (when it has one), in a wrapped, left-aligned row of mark plus name (marks dimmed with opacity 0.7, full on hover and focus, never recoloured; `even` on CompanyLogo sizes each to the same area with a width and height cap), linking to that company on /posts (`/posts#<company>` opens the By company view); no counts here, /posts has them. Where one organization has several credits with different names (Amazon: the Dynamo paper; AWS: the Builders' Library) the label says both (`MIXED_LABEL`, lib/organization.ts, "Amazon and AWS") and the AWS mark stands for it. It has no note under the row (owner, 29 Oct 2026: removed; each company links to /posts and the header links /posts and /reads); `NOT_COMPANIES` in lib/organization.ts stays for the /posts count test.
- "/" focuses search (not while typing or with Ctrl, Cmd, Alt); Escape clears and blurs. Footer "Report a mistake" mails REPORT_EMAIL in lib/site.ts. Search results: the whole row is the link (the title link is stretched over it, `.search-results li > a::after`); a click or Enter on the first result passes the typed words and the excerpt's words through sessionStorage (lib/findOnPage.ts), and components/FindOnPage.tsx (in the layout) scrolls the best-matching line to the middle of the screen and gives it `.is-found` for 2 seconds (FOUND_MS). It matches a line (`LINE` selector) with every typed word at the start of a word, skipping the header, footer and search, prefers lines after the URL's section anchor and the line sharing the most excerpt words, and does nothing when no line matches. The highlight is a background colour with no motion, so reduced motion needs no variant.
- Reading order and numbers: one function, `topicOrder` in lib/order.ts, orders all topics for the Map index, the Path view, the Next up tie-break and the sitemap. Sort: the map's columns of the transitive reduction read left to right, so prerequisite depth first, then position in the column (barycenter sweeps, ties kept in input order, which is alphabetical by title). Numbers are global, 1 to N (`topicNumbers`), shown as 01 to NN. Every topic's number is greater than all its prerequisites'. The Path view groups by `group`, so numbers rise within a group but not always down the whole page; its caption says the numbers are a suggestion and prerequisites are what matter. Group headers read "<Group>, <n> of <total> topics".
- Path view groups longer than 5 topics (`COLLAPSED_SHOWS` in components/PathView.tsx) show their first 5 and a "Show N more" / "Show fewer" button (aria-expanded, aria-controls, 44px, under the title column). All topics stay in the HTML; collapsed ones are `display: none` by `data-collapsed` in CSS. Revealed topics fade in (opacity, `--dur-base`, none under reduced motion); collapsing is instant and scrolls the group heading back into view if it was above the viewport. Mark group read still covers every topic in the group.

## Owner's later decisions (this area)

- Wordmark: the site's own `LogoMark` (46px) sits left of the big "sys101" in `.masthead-title`; the h1 stays alone inside so its letters can fly (`lib/letterRise.ts`). Not a background or watermark.
- Lead line: "Learn system design from what real companies built, broke and fixed." (same text in `scripts/make-og.mjs` and the OG alt in `lib/site.ts`; rerun `node scripts/make-og.mjs` after changing it).
- /posts: no counts beside company, topic or year headings; the "N sources from N organizations (...)" line is at the bottom (`.posts-total`), and the top status line is empty except while filtering.

## Design pass (Phase 4d)

- Overprint: `.overprint` plus `data-text` (the same string, from one constant or literal) puts a second-ink copy 2px down and right through `::before` (`--overprint`: multiply in light, screen in dark; the lead line uses `--offset: 1px`). Only on the lead line and the section titles (Inside a topic, Try a question, Put it together, Companies we learn from, All topics), all 26px or larger. Never on the `h1` or anything the Splash moves. Removed under `prefers-contrast: more` and `forced-colors: active`. The text stays once in the DOM.
- Overprint text goes through `components/Overprint.tsx` (`data-text` is set from its one string child).
- The map and the Path view mark a topic with only its concept done, or only its posts done, with the left or right half filled (graph.md); the station sign does not draw a state mark.
- Station sign (`components/StationSign.tsx`, selection in `lib/stationSign.ts`): under the map, from 1024px only (hidden below; the Path view and the Next up button cover phones). Shows the hovered or focused station (`GraphView` `onActive`), else the Next up topic (`nextUpSlug` over `homeAction`), else the first topic. Reversed-out bar (ink, paper text) with the group badge, the title and "Topic NN" (no "of 35": the homepage shows no counts), then Read first, the first sentence of the concept with reading time and "Read this topic", and Makes possible. With no station hovered or focused it shows only badge, title, Read first, summary and Makes possible (the Next up button carries number, time and link); the number, reading time and "Read this topic" appear for a hovered or focused station. A plain region, no live announcements. The `data-tour="states"` legend (`StateLegend`: a framed bar of the four marks with lowercase Cabin words, shared with the Path view) sits above the map and its group badges, outside the frame. "Plan a route" is not built.
- Not built from the prototype: the "Next stops" and "Try one" framed block (Try a question stays its own section).
