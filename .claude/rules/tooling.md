---
paths:
  - "scripts/**"
  - "package.json"
  - "vitest.config.ts"
  - ".github/**"
  - "pipeline/**"
---

# Tooling

Applies when editing scripts, the build, CI or package scripts.

## Specification

Moved from CLAUDE.md, "Working in this repo".

- `node scripts/news-month.mjs [YYYY-MM]` prints the monthly What's new brief (each topic's allowlisted sites, listed items, free places) from the repository files. Offline, read-only, never in the build.
- `npm run og:topics` (scripts/make-topic-og.mjs, optional slugs after the URL) redraws public/og/<slug>.png for the topics against a running site; offline, by hand, never in the build (.claude/rules/seo.md).
- `npm run verify:reads` (alias `verify:landmarks`) opens every Great reads URL live and checks its evidence and date (.claude/rules/reads.md). Needs the network, never in the build.
- `npm run verify:figures` fetches every source with curl (PDFs through pdftotext or pypdf; a page that refuses curl through the Wayback CDX API, marked "(archive copy)", and then through headless Chromium, marked "(browser copy)") and writes docs/verification-log.md (figure, URL, nearest heading, result). It checks the numbers table, problem, constraints, walkthrough, trade-offs, failures, takeaways and the numbers' meanings. A figure with a lone digit or a number written as a word cannot be judged by a script: the script looks for the other spelling next to the same noun, and anything left says HAND CHECK until a person has read the source and recorded the verdict in docs/hand-checks.json (key `<post id>|<figure as written>`, with a short note). `VF_DUMP=<dir>` writes each page's text for reading. Needs the network, so it never runs in the build. A figure the script cannot match (another formatting, a second linked source) can be settled by an entry in docs/hand-checks.json that says exactly what source was read; a slow host gets one retry at 90 seconds.
- `scripts/check-diagram-overflow.mjs` runs after the build (and as `npm run check:diagrams`): it renders each diagram SVG in headless Chromium and fails if a label's box spills past its rect. It skips when Chromium is absent (`npx playwright install chromium`); Playwright is a devDependency.
- `check-seo` reads the prerendered pages from `scripts/app-output.mjs`: normally `<distDir>/server/app`, else, of the folders holding `about.html` under the dist dir or `.vercel/output`, the one with the most `.html` pages. If none is found (a deployment adapter that keeps the pages elsewhere), it prints what is there and skips instead of failing the deployment, so run it again on a local build. It also accepts a sitemap or robots route that is built but not written as a `.body` file.
- `npm run build` also builds the Pagefind index into `public/pagefind` (git-ignored), and it does not read the build's output folders: `scripts/build-search-index.mjs` starts the built site (`next start` on a free port, `NEXT_ADAPTER_PATH` removed), fetches every URL in its sitemap, saves the HTML to a temp folder and indexes that. Reason: Vercel's Next 16 build keeps each prerendered page in its own hash folder under `.next/server/route-cache`, so the old folder lookup found one page and every deployment failed (and before that guard shipped an index of one page). The step fails the build when the site does not start, a page does not answer, or the index holds fewer than topics + 5 pages. Needs a finished build with the same `NEXT_DIST_DIR`. After a deploy, `npm run check:live-search` (scripts/check-live-search.mjs, optional base URL) fails if the live index is a stub; needs the network, never in the build. Under `npm run dev`, run `npm run search:index` (it builds into `.next-search` first).
- `npm run audit:figures` replays the figures' geometry through the anatomy skill's audit (.claude/rules/figures.md). `npm run check:tour` drives the guided tours in a browser against a running server (.claude/rules/tours.md). Both are offline and never run in the build.
- `npm run check:offline` (scripts/check-offline.mjs, `BASE_URL`) drives the service worker's offline copy against a production server (.claude/rules/offline.md). Offline, never in the build.
- `node scripts/make-logos.mjs` copies company marks from svgl and Simple Icons into `public/logos/` and writes `lib/logoFiles.ts` (.claude/rules/logos.md). Offline, run by hand, never in the build.
- `npm run check:ui` (scripts/ui-audit.mjs, `BASE_URL` defaults to http://localhost:3000) loads every sitemap page at 1440 and 390, light and dark, and fails on sideways scroll, hover-tooltip sources, a short Cabin label split over lines, a broken company mark or layout shift. Offline, run by hand, never in the build; the `verify-ui` skill uses it.
- `npm run readme:stats` rewrites the counts in README.md between `<!--stat:name-->` markers from content/ (`readme:check` only checks); `lib/readme.test.ts` fails on drift, on counts that differ from the site's own counters, and when the README's AI-assistance sentence differs from `AI_ASSISTANCE`. The README's screenshots live in docs/readme/ (how they are taken: docs/readme/README.md). Offline, never in the build.
- `npm run check:topic -- <slug>` (scripts/check-topic.mjs) is the add-topic preflight: the topic's learn and background files, prerequisites, summary and reasons, logos, duplicate post ids, the prerequisites' "What to learn next" text, and docs that state a topic count. FAIL exits 1, WARN needs a decision. Offline, never in the build.
- CI (`ci.yml` in the workflows folder) runs `npx tsc --noEmit`, `npm run lint` and `npm test` on every pull request; the build and post-build checks run on the Vercel preview.
- `getAllTopics()` (lib/topics.ts) reads and validates content/topics once per process in production, and on every call in dev and tests.
