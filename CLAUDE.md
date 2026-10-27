# sys101

Standing rules for this project. Follow them in every task. This file is always loaded; the detail for one area lives in `.claude/rules/`, loaded when you touch matching files (index below). Skills for repeatable workflows live in `.claude/skills/`. Nothing here has a length limit: keep each file cohesive, each rule one idea, and edit rather than duplicate.

## Rule precedence

- CLAUDE.md wins over any skill, plugin, or design tool (Impeccable, Emil Kowalski skills, Taste Skill). Skills are advisory. If one suggests something banned here (shadows, gradients, bounce easing, em dashes, a banned font), skip it silently.
- Task prompts use TASK / FILES / DONE WHEN / SKIP. Follow SKIP strictly. Prompts do not repeat these rules, so assume them.
- Multi-agent by default (`docs/agents.md`): the main session is the admin (splits, assigns, merges, runs the final checks, decides) and does not do the pieces. Content and design: `worker-strong`, then `reviewer`, max 2 rounds. Menial work: batched into one `worker-cheap` call, no reviewer. Trivial tasks: admin directly. Big tasks: show a plan table and wait for "go". Max 3 workers, parallel only on different files.
- Code questions (callers, where a function is defined, structure): use the codebase-memory MCP tools (`search_graph`, `trace_path`, `get_code_snippet`) before grep; fall back to grep for text, JSON content and config.
- Cheapest model that can do the piece; each agent gets only its files and the relevant rules. Every report gets one line: who did what, what the reviewer rejected, rough tokens per model. Never push unasked; commit only on a branch.
- Claude Code treats memory as context, not enforcement. Anything that must never happen is a hook in `.claude/settings.json` (see Project configuration), not only a sentence here.

## Project

A system design course for one learner, built as a prerequisite graph. Each topic is taught through how real companies engineered it, not through textbook definitions, in a clear order, without guessing which blog to read or what to know first.

- Roadmap logic: every topic lists what it builds on and what leads on from it.
- Topic order is a standard curriculum: networking basics, databases, load balancing, caching, CDNs, consistent hashing, replication, sharding, indexing, CAP, consensus, distributed transactions, queues, pub-sub, event-driven design, rate limiting, circuit breakers, failover, then capstones.

## Future plan (topics to add next)

Researched in Oct 2026 and revised after the owner review. Status on 25 Oct 2026: the site has 35 topics and seven capstones. Batches 1 to 3 are merged. Batch 4 has shipped `probabilistic-data-structures`, `api-design-rpc-rest-graphql` and `online-schema-migrations` ('Schema Migrations', Buildkite, GitHub and Shopify posts) and `observability-and-slos` (Dapper, Canopy, Google SRE book and workbook); the Notion 2026 reindexing post is on `indexing`. The capstone page type (`/capstones`, `/capstone/<slug>`, `.claude/rules/capstones.md`) is built with the metrics pipeline, social graph store (TAO), payments ledger and file sync capstones (PRs #51 to #53, #84 to #86, all merged), the chat and messaging capstone and the live video capstone (Facebook 2015, Netflix 2025 as one company) (chat: three dated sources: WhatsApp 2012, Messenger 2014, Slack Flannel 2017; no presence or acknowledgement figures). Glossary terms now appear inline in lesson text with popovers (`topic-pages.md`). Full sources, figures and risks are in `docs/roadmap.md` (read it only when planning a topic; every figure there still goes through `add-post`). Each topic has at most 3 prerequisites so the map layout test stays clean (test the placement on a stub first, `add-topic` step 1; the `chooseLayers` fix lets short columns shift). Each source appears in one place only.

Still to do:

1. Batch 4 is done.
2. Parked: `multi-region-traffic-routing` (judged against failover, DNS and disaster recovery before building) and `exactly-once-processing` (mostly covered by idempotency and streaming; fold in or drop). `service-mesh-and-api-gateways` was dropped (overlaps load balancing and rate limiting; no recent source).
3. Capstones: chat is built on six sources (WhatsApp 2012 and 2021, Messenger 2014, Slack 2017 and 2020, Discord 2024; Slack 2023 belongs to `real-time-delivery`), with no figures yet for presence or read receipts; notifications is built (Patreon 2026, Pinterest 2020, Slack tracing 2023; no source on batching, de-duplication, push delivery or guarantees); ride dispatch not ready. Each new capstone is a content JSON plus research.

Go-live bar for an announcement is met for topics (batches 1 and 2) and the chat capstone now exists. Post rule 4 as decided by the owner: papers by teams that ran the system, MongoDB Atlas and the CrowdStrike RCA count; Confluent and Debezium are explanation only.

## Where the detail lives (`.claude/rules/`)

Path-scoped rule files load when you read, write or edit a matching file; open the one you need before changing that area. Each holds the standing rules and the full specification for its area.

| File | Area |
| - | - |
| `topic-pages.md` | Topic pages, content JSON, quiz style, In short, prerequisite reasons, Page last updated, reading time, interview tags |
| `learn-pages.md` | /topic/<slug>/learn, official-source rules, videos, Try it commands |
| `progress-tracking.md` | Tracked units, "in progress", localStorage store, the Path group toggle |
| `homepage.md` | Masthead, the one start button and its priority, map or Path, Inside a topic, Try a question, sources, topic numbering |
| `graph.md` | The map: layout, states, zoom and pan, group labels, node-open transition |
| `motion.md` | Duration and easing tokens, what may animate |
| `seo.md` | Canonicals, titles, descriptions, JSON-LD, sitemap, images, `check-seo` |
| `accessibility-and-chrome.md` | Contrast, focus, touch targets, phone and laptop parity, skeletons, header, footer, AI sentence |
| `tours.md` | Guided tours: steps, motion clock, behaviour, seen flag, checks |
| `background.md` | /background data, "Taught later", checks |
| `figures.md` | Interactive post figures, their inputs and checks |
| `reads.md` | Great reads (/reads): selection, `influence` rule, data, `verify:reads` |
| `capstones.md` | Capstone pages (/capstones, /capstone/<slug>): schema, interactive parts, checks |
| `news.md` | What's new, the allowlist, the routine, the guard workflow |
| `logos.md` | Company marks, sources, the `add` command, brand rules, exceptions |
| `offline.md` | Service worker, offline caching, warm-up |
| `security.md` | Response headers and CSP, HTML sinks, URL checks, import limits, workflow pins |
| `tooling.md` | Verification scripts and their network use |

## Post selection (strict, never use just any post)

Only include a post if it passes most of these:

1. Specific: real numbers like latency, throughput, request volume, error rates. No vague claims.
2. Honest about trade-offs: what was tried, what failed, why the final choice was made.
3. Still relevant: current architecture. A post older than about five years passes only if it teaches an unchanged fundamental and shows its year. Never claim an old post still holds unless an opened source says so.
4. Credible source: the engineering team of a company running the system at real scale. No toy projects, listicles, marketing, or "top 10" roundups.
5. Teaches something transferable to a concept in the graph.

- System design flow: the post maps to one graph node. Incident write-ups that teach a reusable concept belong on the matching topic.
- Great reads (/reads, `reads.md`) are the one exception: rule 1 (numbers) and rule 5 (graph concept) are waived there, rule 3 becomes the label "describes the system as of <year>" with no "still holds" claim, and the only read state is a per-entry toggle outside topic progress.
- General knowledge flow: stories that map to no single node (large migrations, pure war stories). Keep them off topic pages.

## Honesty rules

- Only use posts you actually opened. Never invent URLs, quotes, or numbers. Write summaries in your own words from what the post says.
- If a post fails the selection rules, say so and find another. Before saving a new post, show the user the URL, the company, and why it passed.
- The fetch tool returns a model-written reading, not the page. For every figure, fetch the raw page with curl (browser-like headers if blocked) and confirm the number appears. Drop any figure you cannot find, and list the drops in the reply.
- A peer-reviewed paper by a company's engineering team counts as a post, labeled "paper", under the same five rules.
- Learn pages use official sources only (details in `learn-pages.md`). Claude cannot watch videos: show each candidate and get approval first.
- A new company in any post needs a logo in the same change: `node scripts/make-logos.mjs add "<Company>" [domain]` (see `logos.md`); `lib/logos.test.ts` fails without it.

## Site feel

Handcrafted, not AI-template. Cream background, serif headings, restrained palette with one or two accents (one rust). Plain, specific copy written like a person.

- Two themes from CSS-variable tokens in app/globals.css: light (cream) and a warm dark (brown-charcoal, off-white ink, brighter AA rust). Any new colour must be a token, never a literal.
- Theme toggle (sun/moon) stored locally, follows prefers-color-scheme until chosen, set before paint (no flash). SVG diagrams theme via the tokens; the Sigma map reads live vars (readThemeColors, lib/graphUi.ts).
- Never use: gradients, neon, rainbow, pastels, purple and black, pure white background, drop shadows, large radius, liquid glass, emojis, sparkle icons, loose side icons, animated arrows, hover animations everywhere, bounce or elastic easing,
  three-card rows, bento grids, pricing tiers, testimonials, colored stripes, terminal mockups, dot grids, radial orbs, checkmark bullets, Inter/Geist/Space Grotesk, em dashes, "It's not X, it's Y" phrasing.
- Links are not underlined unless they sit inside a running sentence; a standalone link shows itself by a colour change on hover (rust; ink in side contents lists). Every search or filter box behaves like the homepage search: "/" focus, Escape clears, Enter to the first result, word-start matching, a "/" hint, an aria-live count (`accessibility-and-chrome.md`). Only the homepage "sys101" flies letter by letter into the bar; elsewhere the page name and the current section name fade into it, the section name lighter (`motion.md`).
- Always: skeleton loaders, a real working demo, Terms and Privacy pages in the footer.
- Review every page or UI piece before calling it done: render it at 1440px and 390px and check it reads as part of the whole (mono small-caps labels, generous whitespace, state shown by shape not colour alone).
- Check spacing: text and adjacent controls must never run together. Prefer a flex row with `gap` over JSX `{" "}`. Catch this in development, never push it.
- Company marks are the only icons: beside company names, from local files, never recoloured (`logos.md`). The one other mark is the site's own three-node `LogoMark` (components/Logo.tsx): in the header, beside the homepage wordmark, at the start of the footer and on the opening screen (`Splash`) and the slow-navigation loader (`NavPending`), nowhere else and never as a background or watermark. Homepage: thin dividers, no cards or images.
- On a UI request, fix every similar element across the page, not one spot, and check that no count or status appears twice on one page (client-rendered parts included).

## Architecture of the site itself

Apply system design thinking to this site: static generation, CDN caching, decoupled offline pipeline, idempotent jobs, cached outputs, no runtime dependency on third parties, graceful degradation. Justify choices in these terms. Two exceptions:

- Vercel Web Analytics (page views, no third-party cookies, per Vercel's own docs). The site works fully if it fails to load, it never receives reading progress, and Privacy describes it.
- YouTube on learn pages: a click-to-load facade (title, channel, year, length, "optional", "not vetted line by line like the written sources") that loads nothing from YouTube until "Play here"; then youtube-nocookie.com, with an external link as a no-JavaScript fallback. Privacy says so.
- Company marks and every other asset are local files; nothing is fetched from a third party at runtime. Logo lookups happen only in the offline script.

## Working in this repo

- Node 24 (`.nvmrc`). Run `source ~/.nvm/nvm.sh && nvm use` before npm commands.
- `npm run dev` (leave it running on :3000 when idle), `npx tsc --noEmit`, `npm run lint`, `npm test` (vitest), `npm run build` (production check). Pushing to `main` deploys to Vercel.
- A production build overwrites `.next` under a running `next dev` and breaks it. While the dev server is up, build into another directory and run the post-build checks against it with the same variable, then delete it: `NEXT_DIST_DIR=.next-build npx next build`, then `NEXT_DIST_DIR=.next-build node scripts/check-seo.mjs` (also `check-news`, `check-diagram-overflow`), then `rm -rf .next-build`. (`postbuild` reads `.next`, so Pagefind is skipped this way; run it only on a build that owns `.next`.) A hook blocks the unsafe form.
- Topics live in `content/topics/<slug>.json`; the schema in `lib/topics.ts` is checked by the build. Keep it in sync with `topic-pages.md`. Tooling (verify:figures with docs/hand-checks.json, audit:figures, check:tour, check:ui, diagram overflow check, Pagefind index) is described in `tooling.md`.
- The build fails on an empty section or quiz, a missing prerequisite, a prerequisite cycle, missing attribution or verifiedOn, or a bad diagram (gradients, filters, scripts, no `<title>`).
- Planned work lives in `docs/ideas.md` and the topic roadmap in `docs/roadmap.md`; read them only when asked or when choosing the next topic. `docs/verification-log.md`, `docs/review-progress.md`, `docs/tasks/` and `docs/drafts/` are working records, not rules.

## Verifying a change

Run only what the change touches, then once at the end:

1. `npx tsc --noEmit`, `npm run lint`, `npm test`.
2. A build (see above) and `check-seo`, `check-news`, `check-diagram-overflow`. `npm run check:tour` when tours or the top of a topic page changed; the graph tests are in `npm test`.
3. Anything visible: render it at 1440px and 390px, light and dark, and look (`npm run check:ui` for overflow, tooltips, split labels, broken images and layout shift; the `verify-ui` skill has the full routine). Wording that names a key, control or view must be true on each screen.
4. State what you did not check (Safari, a real phone, Pagefind, a deploy) in the report.

## Git and releases

- Work on a branch, never directly on `main`, and never on a branch whose PR is already merged: a later commit or push reaches no PR (the guard-branch hook blocks `git commit` and `git push` on `main` and on a branch with a merged PR; start a new one with `git switch -c <name> origin/main`). Before a push, also run `git fetch` and check `git log origin/main --merges -3`. Commit messages end with the co-author line the session gives. Push only when asked.
- `gh` is installed at `/opt/homebrew/bin/gh` (not on Claude's PATH, so call it by full path) and needs a one-time `gh auth login` by the user; after every push, create the PR yourself with `gh pr create` (never leave it to the owner) and give the PR link, with a short description (what changed, checks, anything to read before merging; the PR body ends with the attribution line the session gives). Fall back to opening `https://github.com/Adii-Khandelwal/sys101/compare/main...<branch>?expand=1` only if `gh` fails. Vercel builds a preview for each branch and deploys `main`; after a merge, check the live site (`https://sys101.vercel.app`) rather than assuming.
- Run `/ponytail-review` on the diff before every push of code changes and say what it found in the report.
- Auto-merge: a pull request the owner opens from a branch in this repository turns on GitHub auto-merge (`.github/workflows/automerge.yml`, squash, only the commit that was checked) and merges itself once the required checks `check` (CI) and `Vercel` (build and post-build checks) pass; a failing check leaves it open. Branch protection on `main` requires those two checks and nothing else. A pull request that touches `.github/`, `.claude/` or `CLAUDE.md` is never auto-merged: the owner merges it. After a PR opens, report it as "auto-merge on" and check the live site after it lands.
- `.github/CODEOWNERS` records who owns what; `.claude/**` and `CLAUDE.md` are listed because they change what an agent does.

## Owner's ideas (the log)

Every idea or preference the owner states goes in `docs/owner-ideas.md` (one line each, newest last) and in full in the matching rule file. Add a line with each new one.

## Keeping docs current

- Update docs with every commit. When a task adds or changes a standing rule, page type, schema, route, feature or convention, update the matching `.claude/rules/` file (or this file for a project-wide rule) and `README.md` in the same commit. Edit existing text; never duplicate a rule.
- Put a new rule where it will load when it matters: path-scoped in `.claude/rules/<area>.md` (add the file's globs to its `paths`), or here only if it applies to every task. A new area gets a rule file and a row in the table above. Use a skill, not a rule, for a multi-step workflow.
- Do not record one-off details or temporary state. Dated working records go in `docs/`.
- Rule files are specifications: keep the numbers, names and file references exact, and update them in the same change that alters the behaviour.

## Project configuration

- `.claude/settings.json` (shared): permissions for the routine read-only and check commands, hooks (a guard against building under a running dev server, a guard against hand-editing generated files, a guard against committing or pushing on `main` or a merged branch, a test-output trimmer), and the plugins this project uses (`ponytail` on; `vercel` and `agent-skills` installed but off) with their marketplaces. Personal settings go in `.claude/settings.local.json` (gitignored).
- `.claude/hooks/`: the scripts those hooks run. They read the tool call as JSON on stdin and exit 2 with a message to block.
- `.claude/skills/`: project skills (below). `.claude/rules/`: the rule files above.

## Skills and plugins

Project skills (`.claude/skills/`, invoke with `/name` or let them trigger):

- `add-topic`: everything a new topic needs (content, learn page, background, graph checks, tests).
- `add-post`: choosing, verifying and saving a post (selection rules, raw-page figure check, logo, drafts).
- `verify-ui`: the render, overflow, tooltip, split-label, tap-target and layout-shift routine at 1440 and 390, light and dark.
- `release-check`: the pre-push checklist and the report and PR hand-off.

Installed skills that fit this project (advisory; this file wins, and anything banned here is skipped silently):

- `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt` (plugin `ponytail`): the smallest change; review before push.
- `emil-design-eng`, `animate`, `review-animations`, `animation-performance`, `improve-animations`: motion and polish, within the Motion rules (tokens, transform and opacity only, no bounce).
- `break-ui`: worst-case data (long names, zero items) on a component.
- `mobile-native`, `apple-design`: touch and phone behaviour, within the accessibility rules.
- `anatomy`: the interactive figures' geometry audit (`npm run audit:figures`).
- Plugins `vercel` (Next.js and deploy skills) and `agent-skills` (spec, plan, build, review, ship workflows) are installed but off in `.claude/settings.json` to keep every session's context small. Turn one on in `enabledPlugins` (or `/plugin`) for a task that needs it, then off again.
- Not used here: skills that add gradients, shadows, glass, bounce, emojis or a banned font; or that add a dependency or runtime third-party call.

## Ponytail

- Ponytail (plugin, default level full) is active for code changes. Before adding a dependency, component, script or file, climb its ladder: does it need to exist, is it already in the repo, is there a native or standard way, is there an installed dependency.
- CLAUDE.md wins. Ponytail never overrides the honesty rules, source verification, accessibility, tests, motion rules or the banned list. "Write less" is for code, not research: content work and audits still read every source in full.
- Shortcut comments (`shortcut: <limit>, <when to upgrade>`) are listed by /ponytail-debt; write the ledger to docs/debt.md only when asked.

## Compact instructions

When compacting, keep: the current task and its SKIP list, files changed and why, failing checks with their output, and decisions the user made. Drop exploration and passed checks.

## Token discipline

- Do the task. Don't restate it, plan out loud, or narrate steps. Read only the files the task needs; grep before opening, read line ranges, never re-read a file you just edited.
- Make the smallest change that meets the task. Subagents follow the multi-agent rule above.
- Run only the checks relevant to what changed, then one final build.
- Don't fetch posts again for content already verified in content/topics/.
- Final reply says "CLAUDE.md: updated <section>" (or "no change"), likewise README and the rule files, in one line. Max 8 lines overall: what changed (file names), what couldn't be verified, the next decision. No code listings or diffs unless asked.
- Ask at most one question at a time, only when blocked. Candidate tables: at most 6 columns, figures only.
- `.claude/hooks/trim-test-output.sh` cuts a bare `npm test` or `npx vitest` to its summary and failures (exit code kept); add `| cat` to see everything.
- Between unrelated tasks run `/clear`; `/context` shows what fills the window; `/effort` lower for routine CSS and copy changes.
- Saving tokens never means skipping verification.
