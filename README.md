# sys101

A system design course built as a prerequisite graph, taught through how real companies engineered each concept.

![The sys101 homepage: a map of topics joined by arrows that show which topic builds on which.](docs/graph.png)

Live at [sys101.vercel.app](https://sys101.vercel.app).

## Why this exists

Learning system design from engineering blogs is hard because nothing tells you which post to read first, or what you need to know before it makes sense. Good posts assume background that a different post explains. sys101 orders concepts by their prerequisites and attaches vetted engineering posts to each one, so there is always a clear next thing to read.

## Topics

Eighteen topics across five groups. Each topic lists what it builds on and the company posts digested on its page.

| Group | Topic | Builds on | Posts from |
|---|---|---|---|
| Foundations | Databases | none | Uber (2016), GitHub |
| Foundations | DNS | none | Cloudflare, Slack |
| Scaling | Load Balancing | DNS | Uber, Dropbox |
| Scaling | Caching | Load Balancing | Meta, Uber |
| Scaling | Consistent Hashing | Caching | Cloudflare, Discord (2017) |
| Scaling | CDNs | DNS, Caching | Cloudflare, Netflix (2017) |
| Data | Database Replication | Databases | Meta, GitHub (2018) |
| Data | Sharding and Partitioning | Database Replication, Consistent Hashing | Figma, Notion |
| Data | Indexing and Search | Databases, Sharding | GitHub, Discord |
| Data | CAP Theorem | Database Replication, Sharding and Partitioning | Amazon (2007, paper), Google (2012, paper) |
| Data | Consensus | CAP Theorem, Database Replication | etcd (CNCF), Cockroach Labs (2026) |
| Data | Distributed Transactions | Consensus, Sharding and Partitioning | Google (2010, paper), Cockroach Labs (2019) |
| Messaging | Message Queues | Sharding | Slack (2017), Meta |
| Messaging | Publish-Subscribe | Message Queues | Spotify (2019), Uber (2021) |
| Messaging | Event-driven Architecture | Publish-Subscribe | Grab (2020), Zapier, Grab (2023) |
| Reliability | Rate Limiting | Caching, Consistent Hashing | Cloudflare (2017), Databricks |
| Reliability | Circuit Breakers and Load Shedding | Rate Limiting | Zalando, Uber |
| Reliability | Failover | Circuit Breakers and Load Shedding | GitHub (2018), Cloudflare |

Years are shown for posts more than five years old; each topic page explains why they still apply. Next in the plan: capstone case studies.

## How it works

1. **The graph is the homepage.** Each node is a topic, and arrows point from what you should read first to what builds on it. A hollow node is unread, a node with a dot is ready to read (all its prerequisites are done), a node ringed in rust with a rust dot is in progress (you have started it), and a filled node is read. Once you have read something, "Next up" suggests where to go, preferring topics that continue what you already read and that open up more of the map, and a "pick up where you left off" line links back to the topic and section you last viewed. Under 768px the homepage shows only a linear Path view, with no Map/Path toggle (desktop keeps the toggle and remembers your choice). On desktop the map is a full-size horizontal graph; when it is wider than the screen (as it is once there are enough topics) the map section scrolls sideways with a scrollbar, rather than shrinking the labels or stacking. Pan with a drag and zoom with the trackpad or the `+`/`-`/`0` keys are available on desktop (the on-screen zoom and fit buttons were removed; the keyboard shortcuts remain). Below the map are a short "Inside a topic" outline with a figure of the day taken from the posts, a "Try a question" that rotates through real quiz questions, and a plain list of where the posts come from. Press `/` to jump to search.
2. **Each topic page is a lesson.** It opens with a reading-time estimate computed from its content, then an "In short" summary. It has two halves. First the idea: why the concept exists, a mental model with a diagram, how it works step by step, a worked example, the common mistakes, a self-check quiz with explained answers, and a "skip to the posts" link for people who already know it. Then the real world: a digest of each company post (problem, constraints, walkthrough, diagram, numbers, trade-offs, what failed, takeaways), a comparison when there are two or more posts, an interactive isometric figure on a post that gives a mechanism (so far the sliding-window gauge in Rate Limiting, the cache fill race in Caching and the commit latch in Distributed Transactions), and design exercises that rise in difficulty (apply, design, scale) with model answers.
3. **"Start from zero" learn pages** give an absolute beginner a staged path through a topic (Basics, How it works, Going deeper, In practice and trade-offs), built only from official sources: standards, vendor and project docs, university course pages, and recognized conference talks. Each stage cites its sources inline, points to the exact section to read, and ends with what you can now do. Videos are click-to-load and labelled as optional and not reviewed by the author. Every topic has one at `/topic/<slug>/learn`, and commands and config in "Try it" are shown as scrollable code blocks.
4. **Reading progress is stored in your browser only.** Nothing is sent to a server, and there are no accounts. Section-level, post-level and quiz progress are tracked per topic, with a progress bar on each page. A topic you have deliberately started (a section marked done or a quiz question answered) shows as "in progress" on the map and the Path view; the Path view also shows a per-group read count and a mark-group-read toggle. Quiz answers are saved by option, not by position, so options can be reordered without losing them, and older saves are upgraded. You can export, import, or reset it on the `/data` page, which also shows a read / in-progress / ready tally.
5. **A glossary and themes.** `/glossary` gathers every term defined across the topics, grouped by topic with a link back to each, a contents list down the side, and a filter box (focus it with `/`) that jumps straight to a term. `/posts` lists every post the topics are built on, by topic, company or year, with a filter and a contents list. A sun/moon control in the header switches between the light (cream) and a warm dark theme; the choice is remembered and follows your system setting until you pick one.

## How posts are chosen

A post is included only if it passes most of these:

1. **Specific.** Real numbers: latency, throughput, request volume, error rates.
2. **Honest about trade-offs.** What was tried, what failed, and why the final design won.
3. **Still relevant.** Describes architecture in use today. A post older than about five years passes only if it teaches a fundamental that has not changed, and its year is shown on the page via an `ageNote`.
4. **Credible.** Written by the engineering team that runs the system at scale. No listicles or marketing posts.
5. **Transferable.** Teaches something that applies to a concept in the graph.

A peer-reviewed paper by a company's engineering team can count as a post, labelled "paper", under the same rules. Every figure is checked against the raw page text (not a summary of it) before it is used, and figures that cannot be found are dropped. `npm run verify:figures` automates this: it fetches each source with curl, reads PDFs through pdftotext or pypdf, and for pages that block curl reads the Internet Archive, resolving a real captured snapshot through the Wayback CDX API and marking those rows "(archive copy)" in `docs/verification-log.md`.

## Architecture

```
content/topics/*.json ──► next build ──► static HTML + Pagefind index ──► CDN (Vercel)
content/learn/*.json  ──►     │
        ▲                     ├── fails on missing prerequisites, cycles, or empty sections
        │                     └── postbuild SEO check fails on bad titles/canonicals/headings/sitemap
pipeline/ (offline, run by hand)
  fetch RSS ──► extract text ──► draft digests ──► human review ──► commit JSON
```

The site is read-heavy and its content changes rarely, so every page is generated at build time and served as static files from a CDN, with search running in the browser against a prebuilt index. The content pipeline is decoupled from the site and idempotent: it only produces JSON for review, so a failed or repeated run never affects what readers see.

## Build-time checks

Content is validated during static generation (`lib/topics.ts`, `lib/learn.ts`); a bad file fails the build instead of shipping a broken page. The build fails if:

- a topic lists a prerequisite or related topic with no topic file, or prerequisites form a cycle;
- any section is empty, including each post's digest, the glossary, or a lesson section;
- a lesson's quiz has fewer than 5 or more than 8 questions, or an answer does not explain each wrong option; every correct answer sits in one position, one position repeats four times in a row, an explanation points at an option by letter, or "Neither" or "All of the above" is not last; a lesson needs 2 to 3 exercises rising in difficulty;
- a topic with two or more posts has a "Where they differ" comparison that is not 2 to 3 short paragraphs;
- a classic (non-lesson) topic's quiz has fewer than 3 or more than 5 questions, or has no exercise;
- a lesson is missing a diagram on its Mental model, How it works or Worked example section, or any post digest has no diagram;
- a diagram uses gradients, filters, shadows or scripts, or lacks a `viewBox` and a `<title>`;
- `verifiedOn` or `published` is missing or in the future, or a post over five years old has no `ageNote`;
- a learn page is missing its four stages, cites an unknown source, has a stage with no official written source, or lists an Internet-Draft without saying it is a work in progress, not a standard, and when it expires;
- a topic's `shortTitle` is empty or not shorter than its title.

A separate SEO check (`scripts/check-seo.mjs`) runs after `next build` and fails on: duplicate or over-length titles and descriptions, a description that ends in an ellipsis, a page without exactly one `<h1>`, headings that skip a level, a missing or wrong canonical, a page that should be `noindex` but is not (`/data`, 404), a sitemap that does not match the indexable pages or the files in `content/`, JSON-LD that does not parse, images without alt/width/height, and content streamed in a hidden chunk that needs JavaScript.

"What's new" lists (`content/news/<slug>.json`, at most three recent pages from per-topic approved sources) appear after "What to learn next". They are checked in the build (`scripts/check-news.mjs`) and against the live pages with `npm run verify:news`; see `docs/whats-new.md`.

A `/background` page lists, per topic, what its curated posts assume you already know (`content/background/<topic>.json`): each concept with the post sentence that assumes it, a link to our own topic page or an official source, and a "Taught later" gist for concepts that come later in the course. `npm run verify:background` checks the quotes against the live posts; see `docs/background.md`.

A diagram overflow check (`scripts/check-diagram-overflow.mjs`) also runs after `next build`. It renders every diagram SVG in headless Chromium with the site's real fonts (Newsreader, IBM Plex Mono) and uses `getComputedTextLength()` to measure each label; if a label's rendered box spills past the box drawn around it, the build fails. It skips with a notice when Chromium is not installed (so CI without the browser is unaffected); run `npx playwright install chromium` once to enable it, or run it on its own with `npm run check:diagrams`.

The unit tests also scan the homepage source so that no count or date is hardcoded, and check the graph layout for crossings and overlaps at 1440px, 1280px and 390px.

## Link checks

Every post records `verifiedOn`, the date someone last opened it and checked the digest, and each page ends with one "Page last updated <date>" line derived from those dates. A GitHub Action (`.github/workflows/link-check.yml`) requests every source URL each Monday and keeps one "Source links failing" issue in sync: it opens the issue, rewrites it on later runs, and closes it once every link passes, so reruns never duplicate it. Pages never fetch sources at runtime, so a dead link only affects the outbound link. Run it locally with `node scripts/check-links.mjs`.

## Stack

- Next.js (App Router) and TypeScript, every page statically generated
- Sigma.js and graphology for the graph (with node borders and curved edges)
- Pagefind for search, built into static files at build time
- Vercel for hosting and Vercel Analytics for traffic
- Vitest for the unit tests in `lib/`
- Playwright (headless Chromium) for the diagram overflow check, run after the build
- Pipeline in Node with rss-parser, Cheerio and Gemini Flash (`@google/genai`); scaffolded, not yet in use

## Project structure

```
app/              routes: graph homepage, topic pages, learn pages, glossary, about, data, terms, privacy, sitemap, robots
components/       graph view, topic lesson, learn page, index, search, glossary filter, progress trackers, data controls, theme toggle
content/topics/   one JSON file per topic (18 topics)
content/learn/    one JSON file per "start from zero" learn page (18 pages)
lib/              content loading and build checks, graph layout, reading progress, SEO helpers, and their tests
pipeline/         offline scripts for fetching and summarizing posts
scripts/          weekly source link check, the postbuild SEO and diagram-overflow checks, and the figure verifier
.github/          the scheduled link-check workflow
public/           static files; public/pagefind is generated by the build
docs/             images and design notes for this project
```

## Run locally

Requires Node 20.9 or newer (`package.json` sets `engines.node >= 20.9`; see also `.nvmrc`).

```
npm install
npm run dev            # http://localhost:3000
npm run search:index   # build the search index for local dev; rerun after content changes
npm run build          # static build, then the SEO check and the Pagefind index
npm test               # run the Vitest unit tests
```

## Adding a topic

Create `content/topics/<slug>.json` and, with it, `content/learn/<slug>.json`: a topic is not done until its learn page exists. Topics use the lesson format (`why`, `mentalModel`, `howItWorks`, `workedExample`, mistakes, a 5-to-8 question `quiz`, `posts`, a `comparison`, and 2-to-3 `exercises`); the older `primer`/`quiz`/`exercise` format is still supported for non-lesson topics. A shortened lesson example:

```json
{
  "slug": "cdn",
  "title": "CDNs",
  "shortTitle": "optional, used in page titles when the full title would pass 60 characters",
  "group": "Scaling",
  "interviewRelevance": "optional: core, common, or niche; shown as a marker on the topic page",
  "concept": "Two to four sentences on the idea itself.",
  "prerequisites": ["dns", "caching"],
  "lesson": {
    "why": { "outcome": "After this you can ...", "body": "..." },
    "mentalModel": { "outcome": "After this you can ...", "body": "...", "diagram": "<svg viewBox=\"0 0 560 300\"><title>...</title>...</svg>" },
    "howItWorks": { "outcome": "After this you can ...", "steps": [{ "step": "...", "explanation": "..." }], "diagram": "<svg viewBox=\"0 0 560 300\"><title>...</title>...</svg>" },
    "workedExample": { "outcome": "After this you can ...", "steps": [{ "step": "...", "explanation": "..." }], "diagram": "<svg viewBox=\"0 0 560 300\"><title>...</title>...</svg>" },
    "mistakesOutcome": "After this you can ...",
    "checkOutcome": "After this you can ...",
    "quiz": [{ "question": "...", "options": ["..."], "correct": 0, "why": "...", "wrong": ["..."], "teaches": "why" }],
    "postsOutcome": "After this you can ...",
    "differOutcome": "After this you can ...",
    "exercisesOutcome": "After this you can ...",
    "exercises": [{ "level": "apply", "prompt": "...", "answer": "...", "tradeoffs": "...", "wrongAnswers": ["..."], "teaches": "how" }],
    "next": { "outcome": "After this you can ...", "body": "..." }
  },
  "posts": [{
    "id": "cdn-cloudflare", "title": "Post title", "url": "https://...", "company": "Company",
    "verifiedOn": "2026-10-11", "published": "2024-03-14",
    "digest": {
      "problem": "...", "constraints": "...",
      "walkthrough": [{ "step": "...", "explanation": "..." }],
      "diagram": "<svg viewBox=\"0 0 560 300\"><title>...</title>...</svg>",
      "numbers": [{ "value": "...", "meaning": "..." }],
      "tradeoffs": { "chosen": "...", "rejected": "...", "why": "..." },
      "failures": "...", "takeaways": "..."
    }
  }],
  "comparison": "How the posts' approaches differ and why.",
  "glossary": [{ "term": "...", "definition": "..." }],
  "mistakes": ["...", "...", "..."]
}
```

Before committing:

- Every prerequisite already exists as a topic.
- Quiz answers are spread across positions, and explanations quote option text instead of naming letters.
- "Where they differ" is 2 to 3 short paragraphs: what the posts share, where they diverge, and what the evidence is.
- The post passes the selection rules above.
- The digest is written in your own words from the post itself, with no copied passages.
- Every number is checked against the post. Never estimate or round in a way the post does not.
- A post over five years old has an `ageNote` saying why it still applies, without claiming details still hold unless a source you opened says so.

## Content and attribution

Every post belongs to its authors. The digests are original write-ups of what each post says, drafted with AI assistance and checked against the originals, and every topic page links to the original. To have a post removed or a digest corrected, email aditya01khandelwal@gmail.com.

## Roadmap

- Capstone case studies
- Sync reading progress across devices
- Staleness review driven by link-check results and post age
- An LLM pipeline (Gemini Flash) to draft digests and comparisons for review

## License

All rights reserved.

