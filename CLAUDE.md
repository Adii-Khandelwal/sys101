# sys101

Standing rules for this project. Follow them in every task.

## Rule precedence

- CLAUDE.md wins over any skill, plugin, or design tool (Impeccable, Emil Kowalski skills, Taste Skill). Skills are advisory. If one suggests something banned here (shadows, gradients, bounce easing, em dashes, a banned font), skip it silently.
- Task prompts use TASK / FILES / DONE WHEN / SKIP. Follow SKIP strictly. Prompts do not repeat these rules, so assume them.

## Project

A system design course for one learner, built as a prerequisite graph. Each topic is taught through how real companies engineered it, not through textbook definitions, in a clear order, without guessing which blog to read or what to know first.

- Roadmap logic: every topic lists what it builds on and what leads on from it.
- Topic order is a standard curriculum: networking basics, databases, load balancing, caching, CDNs, consistent hashing, replication, sharding, indexing, CAP, consensus, distributed transactions, queues, pub-sub, event-driven design, rate limiting, circuit breakers, failover, then capstones.

## Topic pages

- Order: Part A concept (Why it exists, Mental model, How it works, Worked example, Common mistakes, Check yourself), Part B real world (one section per post, then Where they differ), Design exercises, What to learn next, Original posts. Each section opens with "After this you can ...".
- Concept text may come from general knowledge, but every figure or company claim must come from a verified post in the JSON. Never invent numbers.
- Check yourself is 5 to 8 questions; the build enforces answer positions, no 2- or 3-cycle of positions, and the correct option longest in at most 2. QUIZ_STYLE_PENDING (lib/topics.ts) lists topics not yet reworked.
- Diagrams are original inline SVG with a title and alt text. No data controls on topic pages (they live on /data).
- A reading-time estimate ("~N min read") shows beside the group label on topic and learn pages and in the All-topics index; it is computed from the rendered prose plus a per-diagram allowance (lib/readingTime.ts), never hardcoded.
- Original posts lists company and year (just the company when the source shows no date); links open in a new tab with rel="noopener noreferrer".
- Every content page ends with one "Page last updated <date>" line above the footer (PageUpdated), from content dates; no per-source "Checked on". `verifiedOn` is the date that entry was last edited; no code writes it. Never imply the author personally checked sources unless true.
- "In short" (`summary`: 3 to 5 plain points, 0 to 3 labelled digest figures) sits under the concept; `prerequisiteReasons` gives one sentence per prerequisite (Builds on, Path rows, learn page). Checked in lib/topics.ts (figure labels: no colon, units spaced like "500 ms"); REQUIRE_NEW_FIELDS (now true) makes both mandatory. Details: docs/topic-pages.md.
- Optional `description` on a topic replaces the generated meta description: one sentence of 8 words or more ending in a period, under 155 characters. Interview tags are hidden for now (SHOW_INTERVIEW_TAGS in lib/topics.ts); the field stays.
- A source with no date (versioned docs) sets `published` to "no date shown" plus `edition`, shown instead of a date only when it gives one the page shows ("date unknown" shows nothing). `tradeoffs.rejected` is left out when the source names no alternative.
- A paper says "This is a research paper, not a company blog post"; no internal phrasing like "the rules" on a page.
- "What's new" (content/news, 3 items max, allowlisted sources) follows What to learn next, untracked, build-checked. No provenance note on the section. The routine touches only content/news/** and docs/news-state.json; read docs/whats-new.md.
- "Posts" (/posts): every distinct post by topic, company or year (lib/posts.ts); all views are static HTML, ?view= only picks one, canonical /posts, only By topic in Pagefind.
- "Background" (/background, content/background/<slug>.json) lists what a topic's posts assume; concepts taught later get a "Taught later" label and a gist, with no link. Topic pages link to it only if a file exists. Read docs/background.md.
- Read docs/topic-pages.md before editing topic pages or their content.

## Learn pages (start from zero)

- Every topic has a second page at /topic/<slug>/learn, titled "Start from zero: <Topic>", for a complete beginner. Not counted in "topic read"; never touches the progress store. A new topic is not done until its learn page exists.
- Content lives in content/learn/<slug>.json, typed in lib. Pagefind indexes it with a "Start from zero" label.
- Official sources only. Any number, default, limit, or command must be confirmed in an opened source; cite the page that says it. A source year is a four-digit year, "no date shown", or "page shows last updated YYYY-MM-DD", only if the page shows it (build check).
- Try it commands appear on the cited page, with no "> " or "$ " prompt; risky ones carry a visible `warning`; invented names go in `exampleNames` (build checks).
- Get approval for candidate sources and videos before saving. Read docs/learn-pages.md before editing learn pages.

## Progress tracking

- Tracked units per topic: each concept section, the quiz, each post, each with "Mark done" at the end of its section. A topic is read when all are done; the read flag is derived, and the graph and "Next up" use only it.
- "In progress" means deliberate progress only: a section marked done or a quiz question answered (inProgressSlugs in lib/progress.ts). Scrolling a section into view ("visited") does not count, so merely opening a topic never marks it in progress.
- Stored in localStorage only: versioned, try/catch, tolerant of missing or corrupt data, pages render without it, synced across tabs, old keys migrate. No accounts, nothing sent anywhere.
- Display: "x of N done", a thin segmented bar, a Continue link. The homepage shows a "pick up where you left off" line (HomeResume) below the masthead. /data shows a read/in-progress/ready tally then export/import/reset. The Path view shows a per-group count and a mark-group-read toggle (markTopics).

## Homepage

- Topic numbers come from one function, topicOrder in lib/order.ts (docs/homepage.md). Order: masthead, map or Path view with the "All topics" index, Inside a topic (DNS), Try a question, Where the posts come from. Thin dividers, no cards, icons, or images.
- Every homepage number, name, date, and excerpt is computed from data at build time. Never hardcode them (lib/homepage.test.ts scans the source).
- "Try a question" uses component state only and never touches the progress store.
- Read docs/homepage.md before editing the homepage.

## Graph

- The map is the homepage on desktop (768px and up); under 768px only the Path view is shown, with no Map/Path toggle; the toggle on desktop remembers an explicit choice.
- Layout is deterministic and static. Draw only the transitive reduction by default. No edge crosses a label or node.
- Node states never rely on color alone: unread (thin outline), ready (thicker outline + centre dot), in progress (rust outline + rust centre dot, for a topic deliberately started), read (filled rust). In progress ranks above ready. The Path view and the map legend show the same four states.
- Pan is desktop-only and starts at INTERACTIVE_MIN_NODES topics; zoom is keyboard-only (`+`/`-`/`0`). Zoom and Show all links have no on-screen buttons (camera and edge-filter state stay); the one exception is a "Fit to size" text button on an interactive map, disabled while the view is fitted. A phone gets the fixed map. Keep a plain text index and keyboard use as the fallback.
- After adding a topic, check the map at 1280px, 1440px, and 390px for zero crossings and overlaps. At 1280px also test that sideways page scroll and map pan do not conflict.
- Read docs/graph.md before editing graph code.

## Motion

- One tokens file: 120ms fast, 200ms base, 320ms slow. Ease-out cubic-bezier(0.23, 1, 0.32, 1) for entering or responding, ease-in-out for on-screen movement.
- Animate only transform, opacity, and color. No bounce or elastic, no layout shift, no staggered or scroll-triggered effects. Press feedback scale 0.97.
- Under prefers-reduced-motion, change instantly or fade in 80ms or less. Never fade in the page itself on load: it delays LCP. The one exception is the Map node-open transition (docs/graph.md): a fade-in after a plain click or tap on a Map node, never on a direct load.

## SEO

- One absolute canonical per page from SITE_URL in lib/site.ts, no query strings. Set metadata through pageMeta(), which adds Open Graph and Twitter text tags.
- Unique title under 60 characters with the " · sys101" suffix (optional topic `shortTitle`, used by pageTitle in lib/site.ts). Description under 155, ending at a sentence or clause boundary with no ellipsis (metaDescription), generated from content.
- Exactly one H1 and no skipped heading levels. Content must be in the HTML and render without JavaScript.
- app/sitemap.ts lists every indexable page with lastmod from content dates (PAGE_DATES for About, Glossary, Terms, Privacy). /data and 404 are noindex. /glossary aggregates every topic's glossary terms (grouped, backlinked) with a slash-to-focus filter; all terms are server-rendered for Pagefind.
- JSON-LD only where it matches visible content: BreadcrumbList on topic and learn pages, LearningResource on topic pages. No FAQ schema.
- No raster image without alt, width, and height. SVGs need role="img" and a name, or aria-hidden.
- scripts/check-seo.mjs runs after every build and fails it on any of these.

## Accessibility and chrome

- WCAG AA contrast, visible focus rings, full keyboard use, 44px touch targets, real buttons, aria-live for results. Verify at 1440px and 390px.
- Every feature must work seamlessly on a phone: verify each new feature at 390px (and touch), with no horizontal overflow, readable wrapping, and tap targets of 44px. A feature is not done until it works on mobile.
- Skeleton loaders match the final size and only stand in for client-loaded parts (no loading.tsx on content routes).
- Shared header: sys101 wordmark and three-node mark linking home, ThemeToggle. Footer: About, Glossary, Terms, Privacy, Your data, Report a mistake (REPORT_EMAIL in lib/site.ts). "Back to top" text button after about 1.5 screens: floating on desktop, in the sticky progress strip on phones (topic, learn, background).
- About and Terms describe AI assistance identically (an AI assistant drafts the write-ups; trust the original). Change one, check the other.

## Post selection (strict, never use just any post)

Only include a post if it passes most of these:

1. Specific: real numbers like latency, throughput, request volume, error rates. No vague claims.
2. Honest about trade-offs: what was tried, what failed, why the final choice was made.
3. Still relevant: current architecture. A post older than about five years passes only if it teaches an unchanged fundamental and shows its year. Never claim an old post still holds unless an opened source says so.
4. Credible source: the engineering team of a company running the system at real scale. No toy projects, listicles, marketing, or "top 10" roundups.
5. Teaches something transferable to a concept in the graph.

- System design flow: the post maps to one graph node. Incident write-ups that teach a reusable concept belong on the matching topic.
- General knowledge flow: stories that map to no single node (large migrations, pure war stories). Keep them off topic pages.

## Honesty rules

- Only use posts you actually opened. Never invent URLs, quotes, or numbers. Write summaries in your own words from what the post says.
- If a post fails the selection rules, say so and find another. Before saving a new post, show the user the URL, the company, and why it passed.
- The fetch tool returns a model-written reading, not the page. For every figure, fetch the raw page with curl (browser-like headers if blocked) and confirm the number appears. Drop any figure you cannot find, and list the drops in the reply.
- A peer-reviewed paper by a company's engineering team counts as a post, labeled "paper", under the same five rules.
- Learn pages use official sources only (details in docs/learn-pages.md). Claude cannot watch videos: show each candidate and get approval first.

## Site feel

Handcrafted, not AI-template. Cream background, serif headings, restrained palette with one or two accents (one rust). Plain, specific copy written like a person.

- Two themes from CSS-variable tokens in app/globals.css: light (cream) and a warm dark (brown-charcoal, off-white ink, brighter AA rust). Any new colour must be a token, never a literal.
- Theme toggle (sun/moon) stored locally, follows prefers-color-scheme until chosen, set before paint (no flash). SVG diagrams theme via the tokens; the Sigma map reads live vars (readThemeColors, lib/graphUi.ts).
- Never use: gradients, neon, rainbow, pastels, purple and black, pure white background, drop shadows, large radius, liquid glass, emojis, sparkle icons, loose side icons, animated arrows, hover animations everywhere, bounce or elastic easing,
  three-card rows, bento grids, pricing tiers, testimonials, colored stripes, terminal mockups, dot grids, radial orbs, checkmark bullets, Inter/Geist/Space Grotesk, em dashes, "It's not X, it's Y" phrasing.
- Always: skeleton loaders, a real working demo, Terms and Privacy pages in the footer.
- Review every page or UI piece before calling it done: render it at 1440px and 390px and check it reads as part of the whole (mono small-caps labels, generous whitespace, state shown by shape not colour alone).
- Check spacing: text and adjacent controls must never run together. Prefer a flex row with `gap` over JSX `{" "}`. Catch this in development, never push it.

## Architecture of the site itself

Apply system design thinking to this site: static generation, CDN caching, decoupled offline pipeline, idempotent jobs, cached outputs, no runtime dependency on third parties, graceful degradation. Justify choices in these terms. Two exceptions:

- Vercel Web Analytics (page views, no third-party cookies, per Vercel's own docs). The site works fully if it fails to load, it never receives reading progress, and Privacy describes it.
- YouTube on learn pages: a click-to-load facade (title, channel, year, length, "optional", "not vetted line by line like the written sources") that loads nothing from YouTube until "Play here"; then youtube-nocookie.com, with an external link as a no-JavaScript fallback. Privacy says so.

## Later ideas (do not build yet)

- General-knowledge flow: not built. Open decision: where those stories live (a separate section or route) and how topics link to them.
- LLM pipeline (Gemini Flash) to summarize and compare posts, and alternative views (Tracks, Companies matrix, expandable tree): see docs/ideas.md. The Path view, mobile Path default and weekly link checking are built.

## Working in this repo

- Node 24 (`.nvmrc`). Run `source ~/.nvm/nvm.sh && nvm use` before npm commands.
- `npm run dev`, `npm run build` (production check), `npx tsc --noEmit`. Pushing to `main` deploys to Vercel.
- Topics live in `content/topics/<slug>.json`; the schema in lib/topics.ts is checked by the build. Keep it in sync with this file.
- The build fails on an empty section or quiz, a missing prerequisite, a prerequisite cycle, missing attribution or verifiedOn, or a bad diagram (gradients, filters, scripts, no `<title>`).
- `npm run verify:figures` fetches every source with curl (PDFs through pdftotext or pypdf, blocked pages through the Wayback CDX API, marked "(archive copy)") and writes docs/verification-log.md (figure, URL, nearest heading, found or NOT FOUND). Needs the network, so it never runs in the build.
- `scripts/check-diagram-overflow.mjs` runs after the build (and as `npm run check:diagrams`): it renders each diagram SVG in headless Chromium and fails if a label's box spills past its rect. It skips when Chromium is absent (`npx playwright install chromium`); Playwright is a devDependency.
- `npm run build` also builds the Pagefind index into `public/pagefind` (git-ignored). Under `npm run dev`, run `npm run search:index` instead.

## Keeping docs current

- Update docs with every commit. When a task adds or changes a standing rule, page type, schema, route, feature, or convention, update the matching section of CLAUDE.md and README.md in the same commit. Edit existing text; never duplicate a rule.
- Do not record one-off details or temporary state. Keep CLAUDE.md under 160 lines and each line under about 300 characters by moving detail into docs/.
- Final reply says, in one line: "CLAUDE.md: updated <section>" (or "no change"), and likewise for README.

## Token discipline

- Do the task. Don't restate it, plan out loud, or narrate steps. Read only the files the task needs; grep before opening, read line ranges, never re-read a file you just edited.
- Make the smallest change that meets the task. Don't spawn subagents unless asked.
- Run only the checks relevant to what changed, then one final build.
- Don't fetch posts again for content already verified in content/topics/.
- Final reply max 8 lines: what changed (file names), what couldn't be verified, the next decision. No code listings or diffs unless asked.
- Ask at most one question at a time, only when blocked. Candidate tables: at most 6 columns, figures only.
- Saving tokens never means skipping verification. Planned work lives in docs/ideas.md; read it only when asked.
