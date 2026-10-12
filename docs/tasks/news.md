# What's new per topic, and the checks for a proposing routine

Read this first in any session and continue from RESUME. Use scripts/topic-brief.mjs instead of reading topic JSON. One build at the end of each phase.

## Phase A (feature and Caching pilot, then STOP)
- [x] A1 Schema, rendering, checks, tests (empty allowlist structure)
- [x] A2 Pilot candidates for Caching shown as a table, STOP for approval (write nothing before approval)
- [ ] A3 After approval: write items, verify:news, build, tests, SEO, search index, CLAUDE.md, commit, stop

## Phase B (after the user says "continue")
- [ ] B1 .github/workflows/news-pr.yml
- [ ] B2 docs/routines/whats-new.md
- [ ] B3 docs/routines/README.md
- [ ] B4 allowedDomains table for all 18 topics, STOP for approval, then write docs/news-state.json, run checks, commit

## Decisions
- Rules live once in scripts/news-rules.mjs (with a .d.mts), imported by check-news, verify-news and the tests.
- NEWS_MODE is a constant in lib/site.ts ("review" default). Change it together with the auto-merge variable.
- The news section sits outside the main data-pagefind-body div (Original posts is outside it too), so it has its own data-pagefind-body; its heading "What's new in <Topic>" is the search label.

RESUME: A2 table shown (Valkey 9.1 announcement, Valkey 9.1 memory deep dive, CloudFront cache-tag invalidation blog). Waiting for approval. After approval (A3): write content/news/caching.json, add caching allowedDomains (valkey.io, aws.amazon.com plus existing post domains) to docs/news-state.json, set lastChecked.caching, run verify:news, build, tests, SEO, index, 1440/390 check, CLAUDE.md, commit.
