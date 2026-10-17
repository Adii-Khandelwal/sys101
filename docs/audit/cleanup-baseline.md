# Cleanup baseline (pre-change)

Measured on `fbff1ca`. `main` has since moved to `6177326` (PR #55); after the rebase the tests (593) and check-seo (76 pages) matched these numbers.

Recorded 2026-10-17 on branch `cleanup-2026-10-17`. No fixes were made.

## Commit

- HEAD: `fbff1caa0a098ec10d2e8fc5dd10dec9751ba7e5`

## Checks

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | PASS, exit 0, no output |
| Lint | `npm run lint` | PASS, exit 0 |
| Unit tests | `npx vitest run` | PASS, 46 files, 593 tests, duration 10.55s (wall 11s) |
| Production build | `NEXT_DIST_DIR=.next-build npx next build` | PASS, exit 0, wall 12s, Next 16.4.1, 81 static pages generated |
| SEO | `NEXT_DIST_DIR=.next-build node scripts/check-seo.mjs` | PASS, "76 indexable pages, all in the sitemap." |
| News | `NEXT_DIST_DIR=.next-build node scripts/check-news.mjs` | PASS, "News check passed." |
| Diagram overflow | `NEXT_DIST_DIR=.next-build node scripts/check-diagram-overflow.mjs` | FAIL, exit 1, "Overflowing labels: 6" |
| Tour | `npm run check:tour` | PASS, "Tour check passed." |
| Figures | `npm run verify:figures` | Exit 0, but prints `NOT FOUND: 59` (see below) |
| UI | `npm run check:ui` | PASS, exit 0, "76 pages x 2 widths x 2 themes", "UI check passed." (run against the dev server on :3000, which was already up) |

### Diagram overflow failure (verbatim, first lines)

```
content/topics/probabilistic-data-structures.json
  "The price is a controlled error: a wrong maybe for Bloom, a few percent off for the count" rendered 587px, box width 530 at x=15 (text spans -14..574, box 15..545)
content/topics/probabilistic-data-structures.json
  "first k bits pick a bucket" rendered 172px, box width 126 at x=148 (text spans 125..297, box 148..274)
content/topics/probabilistic-data-structures.json
  "Update the bucket" rendered 119px, box width 126 at x=286 (text spans 289..409, box 286..412)
content/topics/probabilistic-data-structures.json
  "keep the longest zero run" rendered 165px, box width 126 at x=286 (text spans 267..432, box 286..412)
content/topics/probabilistic-data-structures.json
  "harmonic mean of buckets" rendered 158px, box width 126 at x=424 (text spans 408..566, box 424..550)
content/topics/probabilistic-data-structures.json
  "dense layout, about 8 Kb, ~2.3 percent error" rendered 290px, box width 255 at x=295 (text spans 277..567, box 295..550)

Overflowing labels: 6
```

### Figures output (verbatim, first lines)

```
Fetching 78 pages with curl...
Wrote docs/verification-log.md
NOT FOUND: 59
  log-based-streaming / netflix-dblog-2020 / numbers: Trillions of operations per day
  log-based-streaming / uber-realtime-infra-2021 / numbers: Trillions of messages, petabytes of data per day
  overload-and-cascading-failures / github-aug-17-outage-2026 / numbers: 70–100K RPS
  overload-and-cascading-failures / github-aug-17-outage-2026 / walkthrough: 70K
  overload-and-cascading-failures / github-aug-17-outage-2026 / walkthrough: 100K
  overload-and-cascading-failures / github-aug-17-outage-2026 / walkthrough: 7K
  overload-and-cascading-failures / github-aug-17-outage-2026 / walkthrough: 9K
  overload-and-cascading-failures / github-aug-17-outage-2026 / walkthrough: 403,
```

Side effect: `verify:figures` rewrote the tracked file `docs/verification-log.md` (git shows it modified). Restoring it with `git checkout -- docs/verification-log.md` was denied by the permission classifier, so it is still modified and needs a decision from the owner.

## Production build detail

- Route list (from build output; Next truncates with "+N more"): `/`, `/_not-found`, `/about`, `/background`, `/capstone/[slug]` (SSG: `/capstone/metrics-pipeline`), `/capstones`, `/data`, `/glossary`, `/posts`, `/privacy`, `/reads`, `/robots.txt`, `/sitemap.xml`, `/terms`, `/topic/[slug]` (SSG, plus 30 more paths), `/topic/[slug]/learn` (SSG, plus 30 more paths).
- Next 16 build output prints no per-route size or First Load JS table. Per-route JS was therefore measured from the client reference manifests in `.next-build/server/app/**/_client-reference-manifest.js`: the union of client-module chunks per route, `.js` only, summed from disk. This is a proxy, not Next's First Load JS figure.

| Route | JS chunks | Raw bytes | Gzip bytes |
| --- | --- | --- | --- |
| /_global-error/page | 1 | 13822 | 3515 |
| /_not-found/page | 3 | 50324 | 16536 |
| /about/page | 3 | 50324 | 16536 |
| /background/page | 4 | 60159 | 20294 |
| /capstone/[slug]/page | 5 | 95595 | 32062 |
| /capstones/page | 4 | 76004 | 26176 |
| /data/page | 5 | 84183 | 28620 |
| /glossary/page | 4 | 63340 | 21473 |
| /page (home) | 5 | 130124 | 44772 |
| /posts/page | 5 | 86159 | 29556 |
| /privacy/page | 3 | 50324 | 16536 |
| /reads/page | 4 | 65395 | 21981 |
| /terms/page | 3 | 50324 | 16536 |
| /topic/[slug]/learn/page | 4 | 61534 | 20807 |
| /topic/[slug]/page | 5 | 89352 | 30277 |

`/robots.txt/route` and `/sitemap.xml/route` have no client JS.

## Pagefind and sitemap

- Pagefind: skipped for this build (`postbuild` reads `.next`, and this build used `.next-build`). `public/pagefind` exists from an earlier build: 300 `*.pf_fragment` files, 637 files total. It is not tracked by git, so it may be stale.
- Sitemap: 76 URLs (`<loc>` count in `.next-build/server/app/sitemap.xml.body`, matching check-seo "76 indexable pages").

## Notes

- `.next-build` was removed at the end.
- Untracked `docs/audit/cleanup.md` was already present before this run. It was not touched.
- The dev server on :3000 was already running and was left running.
