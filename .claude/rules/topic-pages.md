---
paths:
  - "content/topics/**"
  - "lib/topics.ts"
  - "lib/topics.test.ts"
  - "lib/readingTime.ts"
  - "lib/lessonOutline.ts"
  - "lib/quizIds.ts"
  - "lib/legacyQuiz.ts"
  - "components/Topic*.tsx"
  - "components/InterviewTag.tsx"
  - "components/PageUpdated.tsx"
  - "components/PostFigure.tsx"
  - "app/topic/**"
  - "scripts/topic-brief.mjs"
  - "scripts/apply-drafts.mjs"
  - "docs/drafts/**"
---

# Topic pages

Applies when editing topic pages, their content JSON or the schema in lib/topics.ts. The build checks most of this.

## Standing rules

- Order: Part A concept (Why it exists, Mental model, How it works, Worked example, Common mistakes, Check yourself), Part B real world (one section per post, then Where they differ), Design exercises, What to learn next, Original posts. Each section opens with "After this you can ...".
- Concept text may come from general knowledge, but every figure or company claim must come from a verified post in the JSON. Never invent numbers.
- Check yourself is 5 to 8 questions; the build enforces answer positions, no 2- or 3-cycle of positions, and the correct option longest in at most 2. QUIZ_STYLE_PENDING (lib/topics.ts) lists topics not yet reworked.
- Diagrams are original inline SVG with a title and alt text. No data controls on topic pages (they live on /data).
- A reading-time estimate ("~N min read") shows beside the group label on topic and learn pages and in the All-topics index; it is computed from the rendered prose plus a per-diagram allowance (lib/readingTime.ts), never hardcoded.
- A post digest may carry one interactive `figure` (lib/figures.ts, .claude/rules/figures.md): its inputs are digest.numbers rows, labels are HTML outside the SVG, no gradients, filters, idle motion or auto-start; one per post, only where the source gives a mechanism.
- Original posts lists company and year (just the company when the source shows no date); links open in a new tab with rel="noopener noreferrer".
- Every content page ends with one "Page last updated <date>" line above the footer (PageUpdated), from content dates; no per-source "Checked on". `verifiedOn` is the date that entry was last edited; no code writes it. Never imply the author personally checked sources unless true.
- "In short" (`summary`: 3 to 5 plain points, 0 to 3 labelled digest figures) sits under the concept; `prerequisiteReasons` gives one sentence per prerequisite (Builds on, Path rows, learn page). Checked in lib/topics.ts (figure labels: no colon, units spaced like "500 ms"); REQUIRE_NEW_FIELDS (now true) makes both mandatory. Details: .claude/rules/topic-pages.md.
- Optional `description` on a topic replaces the generated meta description: one sentence of 8 words or more ending in a period, under 155 characters. Interview tags are hidden for now (SHOW_INTERVIEW_TAGS in lib/topics.ts); the field stays.
- A source with no date (versioned docs) sets `published` to "no date shown" plus `edition`, shown instead of a date only when it gives one the page shows ("date unknown" shows nothing). `tradeoffs.rejected` is left out when the source names no alternative.
- A paper says "This is a research paper, not a company blog post"; no internal phrasing like "the rules" on a page.
- "What's new" (content/news, 3 items max, allowlisted sources) follows What to learn next, untracked, build-checked. No provenance note on the section. The routine touches only content/news/** and docs/news-state.json; read .claude/rules/news.md.
- "Posts" (/posts): every distinct post by topic, company or year (lib/posts.ts); all views are static HTML, ?view= only picks one, canonical /posts, only By topic in Pagefind.
- "Background" (/background, content/background/<slug>.json) lists what a topic's posts assume; concepts taught later get a "Taught later" label and a gist, with no link. Topic pages link to it only if a file exists. Read .claude/rules/background.md.

## Specification

- Order: Part A concept (Why it exists, Mental model, How it works, Worked example, Common mistakes, Check yourself), Part B real world (one section per post, then Where they differ), then Design exercises, What to learn next, Original posts. Each section opens with one line "After this you can ...". A "Skip to the posts" link sits at the top, with one quiet "Start from zero" text link beside it to the learn page. The Original posts section stays.
- Concept text may come from general knowledge, but every figure or company claim must come from a verified post in the JSON. Never invent numbers.
- Check yourself: 5 to 8 questions. Each answer explains why it is right and why the others are wrong, and links back to the teaching section. Option order lives in the content: spread the right answer across positions (none over half a topic's questions, no more than 2 in a row; the build fails on all in one position, a run of 4+, or a letter like "B" in an explanation), with "Neither" or "All of the above" last. Explanations quote option text, never letters. The build also fails when the correct positions repeat in a cycle of 2 or 3 (such as A,B,C,A,B,C) or when the correct option is the single longest in more than 2 questions (lib/topics.ts checkQuizStyle; QUIZ_STYLE_PENDING lists topics not yet reworked). Saved answers are keyed by option id (lib/quizIds.ts), so reordering is safe; lib/legacyQuiz.ts is the frozen v2 order used to upgrade old saves and is never edited. "Where they differ" is 2 to 3 short paragraphs (what they share, where they diverge, the evidence); the build checks it. Design exercises: 2 to 3 in rising difficulty (apply, design, scale 10x) with model answers hidden until clicked.
- Diagrams are original inline SVG in the site style. Never copy or embed a blog's diagram. Link to an original figure only if verified it exists. Every diagram has a title and alt text. The build requires a diagram on the Mental model, How it works and Worked example concept sections, and on every post digest.
- Original posts lists each source with company and year (just the company for a source that shows no date). The page carries one "Page last updated" line at the bottom, not a date per source. Links open in a new tab with rel="noopener noreferrer". Missing attribution fields fail the build.
- No data controls on topic pages. They live on /data.
- Optional `interviewRelevance` on a topic ("core", "common" or "niche", in lib/topics.ts) shows a small mono small-caps marker beside the group label (components/InterviewTag.tsx), state carried by the text with only "core" taking the rust accent. The build rejects any other value; a topic without the field shows no marker.

## In short and edge reasons

- `summary`: `points` (3 to 5 sentences, 8 to 28 words each, digits only if already in the topic JSON, no em dash or "it's not X" phrasing) and `figures` (0 to 3 of `{postId, row, label}`: the row is in a post's `digest.numbers`, the label is a hand-written plain phrase of 4 to 15 words with no editorial wording, every number in it appearing in that row and the row's value in it). Rendered as "In short" under the concept; a figure reads "<label>, <Company> <date string>", the date string being exactly what the post header shows (an undated source shows its edition label), plus "(company's own figure)" added automatically when the row's meaning calls it a headline or a target. Each figure links to its post section. Not tracked, not in the rail, indexed by search.
- `prerequisiteReasons`: `{ [prerequisiteId]: sentence }` for the full prerequisite set, 8 to 30 words, no digits. Shown under each Builds on link, in Path rows and in the learn page Before you start. Not on the map tooltip (see docs/tasks/batch-1.md).
- Write both only through drafts files (`scripts/topic-brief.mjs`, `scripts/apply-drafts.mjs`). Restate only what the page already says.
- Style: one unit format everywhere ("500 ms", "100 TB", "8 million", never "500ms"), and a figure label is a phrase, never "label: value". A label may use numbers from its row, from another row of the same post, or the post year (for example "Postgres 9.2 ... (2016 account)").

## Page last updated

- Every content page ends with one line, "Page last updated <date>", from the `PageUpdated` component, just above the footer. It replaces the per-source "Checked on" dates, the "As of" line under What's new, and the "Last updated" label that used to sit at the top of Terms and Privacy.
- The date is derived, never typed on the page: a topic page uses its newest post `verifiedOn` or its What's new `asOf` (`topicPageUpdated` in lib/site.ts); a learn page its newest source `verifiedOn` (`learnUpdated`); /background the newest `updatedOn`; About, Glossary, Terms and Privacy use `PAGE_DATES`. The same dates feed the sitemap lastmod.
- A source that shows no date shows no date: "no date shown" and "date unknown" never appear on a page (`postDateShown`, `companyWhen`). An `edition` label that gives a date the page shows ("page shows last modified June 14, 2021, v3.5 documentation") is still shown.
- lib/pageUpdated.test.ts renders every topic, learn page and the five other pages and checks all of this.
