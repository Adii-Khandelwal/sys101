# sys101

Standing rules for this project. Follow them in every task.

## Rule precedence

- CLAUDE.md wins over any skill, plugin, or design tool (Impeccable, Emil Kowalski skills, Taste Skill). Skills are advisory. If one suggests something banned here (shadows, gradients, bounce easing, em dashes, a banned font), skip it silently.
- Task prompts use TASK / FILES / DONE WHEN / SKIP. Follow SKIP strictly. Prompts do not repeat these rules, so assume them.

## Project

A system design course for one learner, built as a prerequisite graph. Each topic is taught through how real companies engineered it, not through textbook definitions. The goal is to learn how systems are actually designed around the world, in a clear order, without having to guess which blog to read or what to know first.

## Core ideas

- Roadmap logic: every topic lists what it builds on and what it leads to. The learner should always know what to read before a topic.
- The topic order follows a standard system design curriculum: networking basics, databases, load balancing, caching, CDNs, consistent hashing, replication, sharding, indexing, CAP, consensus, distributed transactions, queues, pub-sub, event-driven design, rate limiting, circuit breakers, failover, then capstone case studies.

## Topic pages

- Order: Part A concept (Why it exists, Mental model, How it works, Worked example, Common mistakes, Check yourself), Part B real world (one section per post, then Where they differ), then Design exercises, What to learn next, Original posts. Each section opens with one line "After this you can ...". A "Skip to the posts" link sits at the top, with one quiet "Start from zero" text link beside it to the learn page. The Original posts section stays.
- Concept text may come from general knowledge, but every figure or company claim must come from a verified post in the JSON. Never invent numbers.
- Check yourself: 5 to 8 questions. Each answer explains why it is right and why the others are wrong, and links back to the teaching section. Design exercises: 2 to 3 in rising difficulty (apply, design, scale 10x) with model answers hidden until clicked.
- Diagrams are original inline SVG in the site style. Never copy or embed a blog's diagram. Link to an original figure only if verified it exists. Every diagram has a title and alt text. The build requires a diagram on the Mental model, How it works and Worked example concept sections, and on every post digest.
- Original posts lists each source with company, year, and "Checked on" date. Links open in a new tab with rel="noopener noreferrer". Missing attribution fields fail the build.
- No data controls on topic pages. They live on /data.

## Learn pages (start from zero)

- Every topic, current and future, has a second page at /topic/<slug>/learn, titled "Start from zero: <Topic>", teaching it from 0 to 100 for a complete beginner. Not counted in "topic read"; never touches the progress store.
- Structure: promise line ("After this you can follow the topic page and the posts"); Before you start (link prerequisite topics plus the few terms needed); 4 stages (Basics, How it works, Going deeper, In practice and trade-offs), each with an explanation in our own words, key terms, official reading (a specific section and what to read in it), an optional original SVG diagram in the site style (same build rules as topic diagrams; usually on How it works), an optional video, and an untracked "You can now" list; then Common misconceptions, Try it (commands only if confirmed in an official source), Where to go next (back to the topic page and its posts), and Sources.
- Content lives in content/learn/<slug>.json, typed in lib. Pagefind indexes it with a "Start from zero" label.
- A new topic is not done until its learn page exists.

## Progress tracking

- Tracked units per topic: each concept section, the quiz, each post, each with "Mark done" at the end of its section. A topic is read when all are done. The read flag is derived from them, and the graph and "Next up" use only that derived flag.
- Stored in localStorage only: versioned, try/catch, tolerant of missing or corrupt data, pages render without it, synced across tabs, old keys migrate. No accounts, nothing sent anywhere.
- Display: "x of N done", a thin segmented bar, and a Continue link. Detail on hover and for screen readers.
- /data (linked in the footer): export, import with validation first, reset.

## Graph

- Homepage on desktop. Layout is deterministic, left to right by prerequisite depth, and panning never moves nodes.
- Under 25 topics the map is fixed and fitted: no zoom, pan, or map controls, and clicking a node cross-fades to its topic. From 25 topics, all of the following switch on.
- One fitRatio, recomputed on load, resize, and node-set change. Zoom range 0.6x to 8x of the fitted view, with identical limits for wheel, pinch, buttons, keys, and double-click. Ctrl or Cmd plus wheel zooms and plain wheel scrolls the page. Fit all always restores the identical state. 5px drag threshold. 64px pan limit.
- Draw only the transitive reduction of prerequisites by default. Hidden edges show faintly on hover or focus, and with "Show all links" once the map is interactive. Data and build checks use the full set.
- Node states that do not rely on color: unread (thin outline), ready (all prerequisites read, thicker outline), read (filled rust). Not-yet nodes stay clickable.
- No edge crosses a label or node. Labels sit right of nodes with a 16px gap. Tooltips are viewport-clamped and never clipped. Unrelated items fade to no lower than 60% opacity, and highlight always clears.
- Keyboard traversal, aria-live announcements, 44px hit areas, and a plain text index as the full fallback, including when WebGL fails. Smooth at 150 nodes.
- Pivot trigger: past about 25 nodes or unreadable edges. Mobile Path view is planned in docs/ideas.md.

## Motion

- One tokens file: 120ms fast, 200ms base, 320ms slow. Ease-out cubic-bezier(0.23, 1, 0.32, 1) for entering or responding, ease-in-out for on-screen movement. Animate only transform, opacity, and color. No bounce or elastic, no layout shift, no staggered or scroll-triggered effects. Press feedback scale 0.97. Under prefers-reduced-motion, change instantly or fade in 80ms or less. Never fade in the page itself on load: it delays LCP.

## SEO

- One absolute canonical per page from SITE_URL in lib/site.ts (env, default https://sys101.vercel.app), no query strings. Set metadata through pageMeta(), which adds Open Graph and Twitter text tags.
- Unique title under 60 characters and description under 155 per page, generated from content (topic: first sentence of `concept`; learn: "Start from zero: <Topic>"). No marketing words or keyword stuffing.
- Exactly one H1 and no skipped heading levels. Content must be in the HTML and render without JavaScript.
- app/sitemap.ts lists every indexable page with lastmod from content dates (newest verifiedOn; PAGE_DATES for About, Terms, Privacy). robots.txt allows all and points to it. /data and the 404 are noindex and left out.
- JSON-LD only where it matches visible content: BreadcrumbList on topic and learn pages, LearningResource on topic pages. No FAQ schema.
- No raster image without alt, width, and height. SVGs need role="img" and a name, or aria-hidden.
- scripts/check-seo.mjs runs after every build and fails it on any of these.

## Accessibility and chrome

- WCAG AA contrast, visible focus rings, full keyboard use, 44px touch targets, real buttons, aria-live for results. Verify at 1440px and 390px. Skeleton loaders match the final size, and only stand in for client-loaded parts, never around server-rendered page content (no loading.tsx on content routes).
- Shared header with the sys101 wordmark and three-node mark linking home. Footer links: About, Terms, Privacy, Your data. A "Back to top" text button appears after about 1.5 screens.

## Post selection (strict, never use just any post)

Only include a post if it passes most of these:

1. Specific: real numbers like latency, throughput, request volume, error rates. No vague claims like "improved performance significantly".
2. Honest about trade-offs: what was tried, what failed, why the final choice was made.
3. Still relevant: describes architecture that is current, not abandoned infrastructure. A post older than about five years passes only if it teaches a fundamental that has not changed, and its year must be shown on the page. Otherwise it fails. Never claim an old post's details still hold unless a source you opened says so; where you cannot confirm it, say it may have changed.
4. Credible source: the engineering team of a company that runs the system at real scale (Netflix, Uber, Cloudflare, Discord, Meta, Stripe, LinkedIn, Slack, AWS, etc.). No personal toy projects, no SEO listicles, no marketing posts, no "top 10" roundups.
5. Teaches something transferable to a concept in the graph.

Two content flows:

- System design flow: the post maps to one graph node and teaches one transferable concept.
- General knowledge flow: valuable stories (large migrations, incident write-ups) that do not map to one node. Keep these separate from topic pages.
- Incident write-ups that teach a transferable concept (for example, how DNS caching and TTLs shaped an outage and its rollback) count as system design and belong on the matching topic. Pure war stories, with no concept a reader could reuse, go to the general-knowledge flow.

## Honesty rules

- Only use posts you actually opened. Never invent URLs, quotes, or numbers.
- Write summaries from what the post says, with its figures, in your own words. No copying passages.
- If a post fails the selection rules, say so and find another.
- Before saving any new post, show the user the URL, the company, and why it passed.

### Official sources (learn pages)

- Learn pages use only official sources: standards and specs (IETF, W3C, ISO), a project's or vendor's own documentation, a university's own course pages; for video, the official channel of one of those, or a recognized conference or university.
- Open every source before use. Record publisher, kind, year, and verifiedOn. Never invent a URL, video, or quote. Never copy docs text: paraphrase and link.
- Any specific number, default, limit, or command must be confirmed in an opened official source and cite its source id. If not confirmed, state it generally or leave it out.
- Claude cannot watch videos. Show each candidate video (title, channel, year, length, why it fits) and get approval before saving. Label every video with channel, length, and year.
- Show candidate sources in a table and wait for approval before writing, as with posts.
- Build fails on: an empty stage, a stage with no official source, an unknown source id, a missing publisher, kind, year or verifiedOn, or a video without channel, length or year. The weekly link check covers these URLs too.

## Site feel

Handcrafted, not AI-template. The graph is the homepage. Cream background, serif headings, restrained palette with one or two accents. Plain, specific copy written like a person.

Never use: gradients, neon, rainbow, pastels, purple and black, pure white background, drop shadows, large radius, liquid glass, emojis, sparkle icons, loose side icons, animated arrows, hover animations everywhere, bounce or elastic easing, three-card rows, bento grids, pricing tiers, testimonials, colored stripes, terminal mockups, dot grids, radial orbs, checkmark bullets, Inter/Geist/Space Grotesk, em dashes, "It's not X, it's Y" phrasing.

Always: skeleton loaders, a real working demo, Terms and Privacy pages in the footer.

## Architecture of the site itself

Always apply system design thinking to this site itself: static generation, CDN caching, decoupled offline pipeline, idempotent jobs, cached outputs, no runtime dependency on third parties, graceful degradation. Justify architecture choices in these terms.

Two exceptions:
- Vercel Web Analytics (anonymous page views, no cookies). The site must work fully if it fails to load, it never receives reading progress, and the Privacy page must describe it.
- YouTube videos on learn pages: plain text links for now (title, channel, year, length, "optional, long", "not reviewed by the author"), so nothing loads from YouTube. An embed is allowed later only as click to load (nothing from YouTube until "Play here"; youtube-nocookie.com player; link fallback), with a Privacy page section saying YouTube receives data only after play is pressed.

## Later ideas (do not build yet)

Interview-relevance tags, LLM pipeline (Gemini Flash) to summarize and compare posts automatically, alternative views and the mobile Path view (see docs/ideas.md). Weekly link checking is built and replaces staleness flags for dead links.

## Working in this repo

- Node 24 (`.nvmrc`). Run `source ~/.nvm/nvm.sh && nvm use` before npm commands.
- `npm run dev` for the dev server, `npm run build` to check a production build, `npx tsc --noEmit` to type-check.
- Topics live in `content/topics/<slug>.json`. Topic schema lives in lib/topics.ts and the build checks it. Read it for exact fields, and keep it in sync with this file.
- The build fails on an empty section, an empty quiz, a missing prerequisite, a prerequisite cycle, missing attribution, a missing verifiedOn date, or a diagram with gradients, filters, scripts, or no `<title>`.
- `npm run build` also builds the Pagefind search index into `public/pagefind` (git-ignored). Under `npm run dev`, run `npm run search:index` to build the index without touching the dev server's `.next`.
- Pushing to `main` on GitHub deploys to Vercel.

## Keeping CLAUDE.md current

- At the end of any task that adds or changes a standing rule, page type, schema, route, or convention, update the matching section here in the same commit. Edit existing text instead of appending; never duplicate a rule.
- Do not record one-off task details or temporary state. Keep this file under about 200 lines by moving detail into docs/ and linking it.
- Final reply says, in one line: "CLAUDE.md: updated <section>" or "CLAUDE.md: no change".

## Token discipline

Work style:
- Do the task. Don't restate it, don't plan out loud, and don't narrate steps.
- Read only the files the task needs. Search with grep or glob before opening anything, and read line ranges instead of whole files. Never re-read a file you just edited.
- Make the smallest change that meets the task. Don't refactor, reformat, or touch unrelated files.
- Don't spawn subagents unless asked.
- Run only the checks relevant to what changed: tests for the touched code, then one final build. Don't run the full suite after every edit.
- Don't browse the web or fetch posts again for content already verified in content/topics/. Only open sources for new posts.

Output:
- Final reply max 8 lines: what changed (file names), what couldn't be verified, and the next decision needed.
- No code listings, diffs, or file contents in the reply unless asked. Show the diff only for risky changes.
- Ask at most one question at a time, and only when blocked. Otherwise pick the sensible default, state it in one line, and continue.
- Show candidates in tables of at most 6 columns, with figures only. No prose summaries of posts.

Safety stays on:
- Keep all CLAUDE.md rules: honesty, post selection, design, approval before saving new posts. Saving tokens never means skipping verification.

Planned work lives in docs/ideas.md. Read it only when asked.
