# What's new per topic, and the checks for a proposing routine

Read this first in any session and continue from RESUME. Use scripts/topic-brief.mjs instead of reading topic JSON. One build at the end of each phase.

## Phase A (feature and Caching pilot, then STOP)
- [x] A1 Schema, rendering, checks, tests (empty allowlist structure)
- [x] A2 Pilot candidates for Caching shown as a table, STOP for approval (write nothing before approval)
- [x] A3 After approval: write items, verify:news, build, tests, SEO, search index, CLAUDE.md, commit, stop

## Phase B (after the user says "continue")
- [x] B1 .github/workflows/news-pr.yml
- [x] B2 docs/routines/whats-new.md
- [x] B3 docs/routines/README.md
- [ ] B4 allowedDomains table for all 18 topics, STOP for approval, then write docs/news-state.json, run checks, commit

## Decisions
- Approved Caching items: Valkey 9.1 memory post, CloudFront invalidation by cache tag. Valkey 9.1 release post dropped. No third item.
- allowedDomains entries are host plus optional path prefix; redirects are followed by hand and every hop is checked.
- Rules live once in scripts/news-rules.mjs (with a .d.mts), imported by check-news, verify-news and the tests.
- NEWS_MODE is a constant in lib/site.ts ("review" default). Change it together with the auto-merge variable.
- The news section sits outside the main data-pagefind-body div (Original posts is outside it too), so it has its own data-pagefind-body; its heading "What's new in <Topic>" is the search label.

RESUME: B1-B3 done. Do B4: build the allowedDomains table for all 18 topics from each topic's existing sources, show it, STOP for approval. After approval write docs/news-state.json (keep caching), run check-news and the tests, update docs/routines/README.md host list if needed, commit.
