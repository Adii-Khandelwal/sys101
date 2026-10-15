---
paths:
  - "public/sw.js"
  - "components/OfflineSupport.tsx"
---

# Offline

Applies when editing the service worker or its registration.

## Specification

- After one online visit the whole site works offline; only external links fail. `public/sw.js` is hand-written (no dependency), registered in production only by `components/OfflineSupport.tsx` (mounted in app/layout.tsx).
- `/_next/static/*`: cache-first (`sys101-static-v1`). Everything else same-origin GET (pages, Next's `?_rsc` data, /pagefind): network-first with a 4s timeout, falling back to the last copy (`sys101-pages-v1`). Never intercepted: non-GET, other origins, `/_vercel/`. Link prefetches that fail offline are harmless: Next falls back to a normal navigation, which the cache answers.
- Warm-up (message "warm", at most once a day, the time kept in the cache entry `/__warmed`, never in localStorage; skipped under Save-Data): fetches every sitemap page plus `/data`, then the build files and logos each page names (stylesheets are read for fonts), then deletes cached build files no page names (only if every fetch succeeded). Search results work offline only for queries already run online (Pagefind's 11 MB index is not copied).
- Progress is never cached; Privacy has an "Offline copy" section. Bump `PAGE_DATES.privacy` if its wording changes.
- Bump the `-v1` cache names only if the cache layout changes; activation deletes older names.
- Check (no script yet): build into another dir, serve it on another port, in Playwright load `/`, reload, wait about 25s, go offline and open pages.
