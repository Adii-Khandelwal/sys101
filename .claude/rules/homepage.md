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
  - "components/Search.tsx"
  - "lib/homeContent.test.ts"
  - "lib/homepage.test.ts"
  - "lib/nextUp*.ts"
  - "lib/order*.ts"
---

# Homepage

Applies when editing the homepage and its parts.

## Standing rules

- Topic numbers come from one function, topicOrder in lib/order.ts. Order: masthead (what it is, who it is for, why, one filled start button), map or Path view with the "All topics" index, Inside a topic (DNS), Try a question, Companies we learn from. Thin dividers, no cards or images; the only icons are company marks beside company names (components/CompanyLogo.tsx), plus the site's own `LogoMark` beside the big wordmark. A new company in any post needs a mark: node scripts/make-logos.mjs add (.claude/rules/logos.md); a test fails without one.
- Every homepage number, name, date, and excerpt is computed from data at build time. Never hardcode them (lib/homepage.test.ts scans the source).
- "Try a question" uses component state only and never touches the progress store.

## Specification

- Order: masthead (wordmark, lead line, a two-paragraph pitch: why company write-ups are worth learning from, and what the site does with them, the start button or Next up line, Why I made this (links to /about, whose first section is "Why I made it") and tour links, search; two columns from 1024px with the pitch beside the wordmark, one column below, so the map's top edge stays visible; the right column, the search underline and the Map/Path controls end on one right edge), the map or Path view with the "All topics" index, Inside a topic (DNS), Try a question, Companies we learn from. Thin dividers, no cards or images; the only icons are company marks beside company names (.claude/rules/logos.md). The top edge of the map stays visible without scrolling at 1440x800 and 390x844.
- Every homepage number, name, date, and excerpt is computed from data at build time (topics, quiz, posts). Never hardcode them; lib/homepage.test.ts scans the source.
- The one filled button under the intro (NextUp, `homeAction` in lib/nextUp.ts, from local progress only; the static HTML shows the first-visit version). Priority: a topic you deliberately started (a section marked done or a quiz question answered) beats one that is merely ready, because it is what you are in the middle of. 1) Started: "Continue: <topic>" (or "Finish:" when two or fewer units are left) linking to the first unfinished section, with that section's name and "x of N done" beside it. 2) Nothing started, nothing read: "Start with <first topic>" and its reading time. 3) Something read, nothing started: "Next up: <topic>" with "Also ready" under it and the topics-read count. 4) Everything read: "All caught up". With several started, the latest deliberate change wins (`updated` is stamped only on those), then the one furthest along, then course order; the quiet line under the button names up to two others with their progress and "and N more". With one started, the quiet line is "After it: <next ready topic>". Topics that are read, no longer in the course, or only visited are ignored. There is no separate "pick up where you left off" line: this button replaces it.
- Inside a topic: the real section names in order (lib/lessonOutline.ts, checked against TopicLesson.tsx) with real counts, generic wording (no topic name, no "Open" link), and a figure of the day: one digest figure from FEATURED_FIGURES, each with company, year, and its post linked. All are in the static HTML; the first shows without JavaScript and the reader's local date picks one after load. Each must exist in its digest (the build fails otherwise).
- Try a question: the DNS lesson quiz questions in order, looping. After an answer the result stays 5 seconds (paused while the pointer or focus is inside, and "Next question" skips it), then the next question fades in (opacity and transform only). Component state only; never reads or writes the progress store.
- Counts: the homepage shows none (the intro is two short paragraphs of pitch, no numbers; the note under the companies row links /posts and /reads). /posts says "sources" and "organizations" (lib/posts.ts sourceCounts: one entry per URL, Amazon and its Builders' Library credit as one organization). /posts also names the kinds present: engineering posts, research papers (ageNote starts "This is a research paper"), documentation pages (an edition other than "date unknown").
- Companies we learn from: organizations alphabetical, each with its mark (when it has one), in a wrapped, left-aligned row of mark plus name (marks dimmed with opacity 0.7, full on hover and focus, never recoloured; `even` on CompanyLogo sizes each to the same area with a width and height cap), linking to that company on /posts (`/posts#<company>` opens the By company view); no counts here, /posts has them. Where one organization has several credits with different names (Amazon: the Dynamo paper; AWS: the Builders' Library) the label says both (`MIXED_LABEL`, lib/organization.ts, "Amazon and AWS") and the AWS mark stands for it. Names in `NOT_COMPANIES` (lib/organization.ts: etcd, a project) are called out in the note as not companies, so the title stays honest. Its note links /posts and /reads (Great reads, which are not counted here).
- "/" focuses search (not while typing or with Ctrl, Cmd, Alt); Escape clears and blurs. Footer "Report a mistake" mails REPORT_EMAIL in lib/site.ts.
- Reading order and numbers: one function, `topicOrder` in lib/order.ts, orders all topics for the Map index, the Path view, the Next up tie-break and the sitemap. Sort: the map's columns of the transitive reduction read left to right, so prerequisite depth first, then position in the column (barycenter sweeps, ties kept in input order, which is alphabetical by title). Numbers are global, 1 to N (`topicNumbers`), shown as 01 to NN. Every topic's number is greater than all its prerequisites'. The Path view groups by `group`, so numbers rise within a group but not always down the whole page; its caption says the numbers are a suggestion and prerequisites are what matter. Group headers read "<Group> · <n> of <total> topics".

## Owner's later decisions (this area)

- Wordmark: the site's own `LogoMark` (46px) sits left of the big "sys101" in `.masthead-title`; the h1 stays alone inside so its letters can fly (`lib/letterRise.ts`). Not a background or watermark.
- Lead line: "Learn system design from what real companies built, broke and fixed." (same text in `scripts/make-og.mjs` and the OG alt in `lib/site.ts`; rerun `node scripts/make-og.mjs` after changing it).
- /posts: no counts beside company, topic or year headings; the "N sources from N organizations (...)" line is at the bottom (`.posts-total`), and the top status line is empty except while filtering.
