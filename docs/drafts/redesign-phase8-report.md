# Redesign Phase 8 proof report (29 Oct 2026)

Branch claude/redesign-p5-topic-pages. No failures found, so no code fixes.

## Automated (production build in .next-build, served on :3100)
- tsc, lint: clean. npm test: 58 files, 703 tests pass.
- check-seo (86 pages), check-news, check-diagram-overflow (0 overflowing labels): pass.
- check:ui, 86 pages x 1440/390 x light/dark: pass (overflow, tooltips, split labels, images, layout shift).
- check:tour, check:offline (87 pages and a link), audit:figures (55 states): pass.

## Screenshots looked at (1440 and 390, light and dark)
Home, topic (route open, notes), learn, capstone chat-messaging, glossary, about with phone footer, privacy, 404. All read as Atlas. Phone footer: the 25px gaps are the minimum that keeps 44px tap areas (tap areas extend 15px each side), so left as is.

## Parity checklist (plan section 8 pieces)
- OK by automated checks: tour targets and overlay (check:tour), offline and service worker (check:offline), sitemap, SEO/JSON-LD/canonicals (check-seo), figures (audit:figures), diagrams, tooltips, text index fallback and layout in check:ui.
- OK by eye in screenshots: header and HeaderTopic, footer columns, scroll ruler, overprint titles, rail, route to this topic, footer on phone, 404.
- Covered by unit tests: contrast tokens, fonts, motion tokens, graph layout, glossary, news, logos.
- Not checked by hand: Splash flight, letterRise, NavPending, BackToTop, CopyLink, StepThrough, Reveal, HighlightTarget, FindOnPage .is-found, GlossaryFilter, DataControls, WhatsNew (hidden), print stylesheet, prefers-contrast, forced-colors, security headers and CSP on a deploy, OG images, Pagefind search (skipped with NEXT_DIST_DIR), "/" shortcut.
- Not checked at all: Safari, a real phone, Lighthouse before/after, forced-colors, owner walk-through.

## Final verification (29 Oct 2026)

- OK: tsc, lint, npm test (58 files, 704 tests), build, check-seo (86 pages), check-news, check-diagram-overflow (0).
- OK on a production server (:3100): check:ui (86 pages x 2 widths x 2 themes; it took 8 minutes, slow but not hung), check:tour, check:offline (87 pages), audit:figures (55 states).
- OK: screenshots at 1440 and 390, light and dark, of home, topic, learn, capstones and a capstone, posts, reads, glossary, background, data, about, terms, privacy, 404 and the tour box. Reworded strings wrap cleanly.
- OK: "/" focuses the home, glossary, posts and reads filters; Escape clears; Enter on home, posts and reads goes to the first result; FindOnPage highlights after a search click; HighlightTarget on /glossary#caching-cache-hit-miss; Reveal; CopyLink; StepThrough arrow keys; BackToTop; /data export (JSON file); topic reset; print (header and ruler hidden, readable); prefers-contrast: more; security headers (CSP, nosniff, frame deny, referrer, permissions); Splash inline script reviewed (home only, once per session, skipped for webdriver and reduced motion).
- Fixed: Enter in the glossary filter did nothing (its selector `.glossary-terms a` matched no link); it now focuses the first topic heading link (components/GlossaryFilter.tsx).
- Fixed: the "Start with Databases" button lost its edge under forced-colors (it had only a fill); added a 1px LinkText border (app/globals.css).
- Not checked: Safari, a real phone, Lighthouse, Splash playing (webdriver disables it), og.png and icons by eye beyond response codes.
