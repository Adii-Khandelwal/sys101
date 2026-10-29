# Reference site study: engineering-atlas.in

Status and limits (read first)

- A fresh crawl was not possible. The site now returns 403 to the default headless browser; the only way through was to spoof a browser user agent, which the permission system refused as bot-check circumvention. I did not work around it.
- What this study rests on: 12 screenshots (1440 wide, viewport only or scrolled) from an earlier crawl, saved in `/private/tmp/claude-501/-Users-aditya-k-Projects-sys101/245d35c4-95d6-4bd0-9cf7-268588a7ae7e/scratchpad/ref/`. I looked at each with Read: home, HLD problem (top and scrolled), LLD hub, Java hub, Career hub, Backend track hub, Articles index, a blog (top and scrolled), About, Privacy. About 30 further earlier screenshots exist there (pricing, signin, contact, subscribe, refund, shipping, AI, tags) and were NOT viewed.
- Not done: the 390 width shots, hover and click interaction notes (search, nav menus, accordions, copy buttons, theme toggle, progress), full-page slices, the sitemap-wide URL count. Anything below about interaction is inferred from visible controls only.
- Branding, copy and assets are not to be copied. Only structure.

## Per page type

### Home
Dark navy hero with dotted grid and a purple to orange glow, giant sans heading, one white search-style button ("Explore"), a stacked-card carousel of "fresh breakdowns" with an All/HLD/LLD segmented filter and prev/next with a progress ring, and an orange marquee of topic names along the bottom. Top: dismissible promo strip, sticky nav with dropdowns (HLD, LLD, Articles), theme toggle, search icon, sign-in.
Worth taking: the segmented filter (All / kind) on a small "latest" list; the rotating "what is new" list as a plain list, not a stacked card. Not taking: dark hero, glow, marquee (motion plus gradient), promo strip, mascot.

### HLD problem page (design a rate limiter)
Left rail with the whole course tree: numbered modules, a "practise" block with a "13 ready" count, the current problem expanded into its 8 numbered sections (Understand the problem ... How to say it in the interview). Breadcrumb Home / HLD / module / page, "Hide menu" button to collapse the rail, big isometric hero illustration, one-paragraph lede, then a "What you'll learn" list (6 bullets with bold key phrases), an "Interview radar" box (what they probe, where candidates slip), then numbered section headings ("01  1. Understand the problem").
Worth taking: the in-rail section list for the current page with the active section highlighted; a collapsible rail; "where candidates slip" as a short labelled paragraph; section numbers in a second colour in the margin. Not taking: hero illustration, cards with rounded borders for each callout, green check bullets.

### LLD hub
Dark hero, orange hand-drawn underline under one word, three buttons, a stat row (problems ready of 47, lessons, areas), then a 3-column "01 Learn / 02 Build / 03 Practise" strip.
Worth taking: the stat row stating "ready of N" once, and the three-step strip as a plain numbered list on the homepage "Inside a topic" area. Not taking: three-column cards, dark hero, three competing buttons, purchase button.

### Java hub, Backend track hub, Career hub (track pages)
Pale lavender hero, breadcrumb, small three-dot eyebrow plus label, big title, lede, stat row (guides, sub-topics, diagrams), isometric art on the right. Backend and Career add a sticky sub-nav with counts ("Roadmaps 1", "Interviews and resumes 3", "Data and consistency 7"), then each sub-topic as a left column (eyebrow, title, one line, "Open sub-topic") beside its item cards.
Worth taking: a sticky sub-nav with counts that scrolls to sections (for /capstones, /reads, glossary groups); left-label / right-list layout for group sections, done as hairline-divided rows. Not taking: art, cards.

### Articles index
Hero with stats (28 articles, 2 series, 17 free), a search box with word examples in the placeholder, All/Free/Members chips, "Featured" row of three cards with kind and "New" badges.
Worth taking: a search placeholder that shows two or three real example queries; filter chips beside search on /reads and /glossary. Not taking: Members lock badges, three-card row.

### Blog (article)
Pale header band with breadcrumb, eyebrow, title, lede, a meta row (By, read time, level "Beginner to Senior", stack) and a Save button; below, a sticky "On this page" contents rail with the active item marked by a left rule; body with "Try this first" prompt box, "Seen this before?" cross-link box pointing at an earlier article, numbered section headings, a "Definition" box with a top rule.
Worth taking: "Try this first" (a question before the lesson), "Seen this before?" (one sentence tying back to a prerequisite, with link), and a meta row with a level range. Sys101 already has prerequisite reasons and reading time, so the first two are the real gain. Not taking: coloured tinted callout boxes (use hairline rule and Cabin label only).

### About and legal pages (Privacy, Refund, Shipping, Terms)
Same pale band header with eyebrow, title and a one-sentence "short version". Legal body is a narrow centred column with "Last updated" date, h2 sections, inline code chips. About is a big rounded panel with a portrait.
Worth taking: a one-sentence "Short version" under the title on Privacy and Terms; "Last updated" line at the top, not the bottom. Not taking: portrait panel.

### Not viewed (screenshots exist, not opened)
Pricing, sign in, contact, subscribe, AI hub, tags, 404. Pricing, sign in and subscribe are excluded by sys101 rules anyway.

## Ranked adoptable ideas (max 12)

1. Page outline inside the left contents on topic pages. Where: topic page rail lists the page's own sections with the active one marked. Files: `components/` topic rail, `app/topic/[slug]/page.tsx`, `app/globals.css`. Effort M. Risk: duplicates the existing contents list; replace, do not add. 
```
 Replication        <- current topic
  | 1 Why copy data
  | 2 Leader-follower   <- active, orange tick
  | 3 Failure cases
```
2. "Try this first" opening question per topic (one line, Cabin label, hairline above). Where: top of topic body. Files: `content/topics/*.json` (new optional field), `lib/topics.ts`, `topic-pages.md`, topic page. Effort M (35 topics need text). Risk: 35 questions to write and verify as honest.
```
TRY THIS FIRST
If one database dies mid-write, which copy do you trust?
```
3. "Seen this before?" tie-back sentence at the first use of a prerequisite. Where: topic body, under In short. Files: same as 2, can reuse prerequisite reasons. Effort S if it reuses existing prerequisite-reason text. Risk: duplicates the reasons list.
4. "Where people slip" labelled line on capstones and topics (one short paragraph). Files: capstone and topic JSON plus schema. Effort M. Risk: needs source backing, not invention.
5. Sticky sub-nav with counts on /capstones, /reads, /glossary (jump to group). Files: those page files, `app/globals.css`, `accessibility-and-chrome.md`. Effort M. Risk: counts must not repeat elsewhere on the page (no-duplicate-stats).
```
Metrics (1)  Social (1)  Payments (1)  Files (1)   <- sticky, hairline below
```
6. Filter chips beside every search box (All / kind). Files: search components, `reads.md`. Effort S to M. Risk: keep "/" focus, Escape, aria-live count rules.
7. Search placeholder with real example queries ("try quorum, sharding"). Files: homepage search, glossary search. Effort S. Risk: none.
8. Left-label / right-list layout for grouped pages (group name and one line at left, hairline rows at right). Where: /capstones, /glossary, /background. Effort M. Risk: phone stacking; check 390.
```
CONSISTENCY   | Raft          12 min
one-line gloss| Paxos         18 min
```
9. "Short version" sentence under the title of Privacy and Terms, "Last updated" at the top. Files: privacy and terms pages. Effort S. Risk: wording must stay true to the policy.
10. Collapsible side contents ("Hide menu") on wide screens, remembered locally. Files: topic layout, localStorage key list in `progress-tracking.md`. Effort M. Risk: layout shift on load; set before paint like theme.
11. Section numbers in the second ink in the margin of topic headings. Files: `app/globals.css`. Effort S. Risk: must not conflict with the reading-order numbering on the homepage.
12. "Ready N of M" wording for a rollout figure (for example capstones shipped of planned). Effort S. Risk: appears once per page only; sys101 currently shows no planned count, so adopt only if the owner wants one.

## Rejected and why

Dark hero, glow and gradients (banned); isometric illustration heroes (assets, and not handcrafted); marquee ticker (motion, noise); promo strip and discount code (marketing); pricing, passes, members lock badges, sign in (out of scope, banned); stacked-card carousel with progress ring (shadow, card stack, auto motion); three-column step cards and three-card rows (banned); rounded tinted callout boxes (large radius, tints not tokens); mascot art; green check bullets (banned); mono-font chips (third font); portrait panel with shadow.

## Six more handcrafted ideas of my own

1. Margin notes: a short Cabin note in the margin beside a paragraph on wide screens (author remark or source caveat), folded under the paragraph on phones. Files: topic page CSS and content schema. Effort M.
2. Ruled paper details: a single hairline double rule under the page title, like a ledger, in the ink token. Effort S.
3. Handwritten-style numerals are not allowed (font), so instead use small caps and old-style figures from Libre Caslon (`font-variant-numeric: oldstyle-nums`) for years and page counts. Effort S.
4. A "fleuron" section break (a plain typographic character or short rule with a gap) between long sections instead of whitespace only. Effort S. Check it is not an emoji or icon.
5. Pull quote from the source post, set in Caslon italic with the company name in Cabin below, once per topic, only where the post says it plainly. Honesty: quote must be copied from the opened raw page. Effort M.
6. Sources shown as a numbered "References" list at the foot of each topic with year in old-style figures, linked from superscript marks in the text. Effort M. Risk: some sources are already inline.

## Honesty note

Everything above about interaction (hover, accordions, copy buttons, theme toggle behaviour, progress indicators) is NOT observed. Please re-run the crawl from an environment the site allows if interaction detail matters.
