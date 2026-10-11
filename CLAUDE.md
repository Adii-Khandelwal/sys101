# sys101

Standing rules for this project. Follow them in every task.

## Project

A system design course for one learner, built as a prerequisite graph. Each topic is taught through how real companies engineered it, not through textbook definitions. The goal is to learn how systems are actually designed around the world, in a clear order, without having to guess which blog to read or what to know first.

## Core ideas

- Roadmap logic: every topic lists what it builds on and what it leads to. The learner should always know what to read before a topic.
- Every topic page has three parts: a short core concept explanation, curated engineering posts, and (when 2+ posts exist) a comparison of how the companies differ and why.
- The topic order follows a standard system design curriculum: networking basics, databases, load balancing, caching, CDNs, consistent hashing, replication, sharding, indexing, CAP, consensus, distributed transactions, queues, pub-sub, event-driven design, rate limiting, circuit breakers, failover, then capstone case studies.

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

## Site feel

Handcrafted, not AI-template. The graph is the homepage. Cream background, serif headings, restrained palette with one or two accents. Plain, specific copy written like a person.

Never use: gradients, neon, rainbow, pastels, purple and black, pure white background, drop shadows, large radius, liquid glass, emojis, sparkle icons, loose side icons, animated arrows, hover animations everywhere, three-card rows, bento grids, pricing tiers, testimonials, colored stripes, terminal mockups, dot grids, radial orbs, checkmark bullets, Inter/Geist/Space Grotesk, em dashes, "It's not X, it's Y" phrasing.

Always: skeleton loaders, a real working demo, Terms and Privacy pages in the footer.

## Architecture of the site itself

Always apply system design thinking to this site itself: static generation, CDN caching, decoupled offline pipeline, idempotent jobs, cached outputs, no runtime dependency on third parties, graceful degradation. Justify architecture choices in these terms.

## Later ideas (do not build yet)

Personal progress/maturity per concept, interview-relevance tags, staleness flags for outdated posts, LLM pipeline (Gemini Flash) to summarize and compare posts automatically.

## Working in this repo

- Node 24 (`.nvmrc`). Run `source ~/.nvm/nvm.sh && nvm use` before npm commands.
- `npm run dev` for the dev server, `npm run build` to check a production build, `npx tsc --noEmit` to type-check.
- Topics live in `content/topics/<slug>.json`, typed and validated in `lib/topics.ts`. A topic has `concept`, `prerequisites[]`, `primer`, `posts[]`, `comparison` (required with 2+ posts), `glossary[]`, `mistakes[3]`, `quiz[3-5]`, `exercise`. Each post has `title`, `url` (attribution only), `company`, and a `digest`: `problem`, `constraints`, `walkthrough[]`, `diagram` (inline SVG using the `dg-*` classes), `numbers[]`, `tradeoffs{chosen, rejected, why}`, `failures`, `takeaways`.
- The build fails on an empty section, a missing prerequisite, a prerequisite cycle, or a diagram with gradients, filters, scripts, or no `<title>`.
- `npm run build` also builds the Pagefind search index into `public/pagefind` (git-ignored). Under `npm run dev`, run `npm run search:index` to build the index without touching the dev server's `.next`.
- Pushing to `main` on GitHub deploys to Vercel.

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
