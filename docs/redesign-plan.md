# Redesign plan: the two-ink print ("Atlas")

Status: 29 Oct 2026. Phases 0 to 7 and the Phase 8 automated proof pass are done on branch claude/redesign-p5-topic-pages (report: docs/drafts/redesign-phase8-report.md). Still open: real phone, Safari, Lighthouse, forced-colors, owner walk-through, the PR to main.

## 1. What this is

Port the approved Atlas prototype into the real sys101 site: a printed-atlas look (two inks on paper, a metro-style prerequisite chart, station-sign headers) in a light and a dark theme, with a circular theme reveal from the click point.

Reference prototype (look and feel only, fake data): Claude artifact https://claude.ai/artifact/9MvEBCnNshiusWckkWD4DA (read with the Artifact `read` action). Its source is in `docs/design/atlas-prototype/` (see its README). Never import or ship those files.

### Decisions already made by the owner
1. Direction: Atlas (two-ink print), not the earlier generic drafts.
2. Dark theme: brown-charcoal, not navy.
3. The theme change reveals outward from the click point (checked as feasible, section 7.4).
4. No existing feature is removed because the prototype does not show it. Every feature is restyled in the new look (memory note `redesign-keep-all-features`). Additive features are separate and opt-in.
5. Second ink: orange only (light `#E8452A`, dark `#FF7050`), chosen over pink and teal on 28 Oct 2026. No other second-ink options are to be built. Known trade-off, accepted: orange on warm dark is the most common generated-looking pairing, so the distinctiveness has to come from the overprint, the metro chart and the station sign, not from the hue.
6. Build in a fresh session, in phases.

## 2. Ground rules
- Branch strategy (owner confirms, register item 20). One long-lived integration branch, `claude/redesign-atlas`, cut from `origin/main`; each phase is a branch `claude/redesign-pN-<name>` off it, merged into it, so the live site is never half-converted and Vercel previews the integration branch. The `claude/` prefix matters: `.github/workflows/automerge.yml` has no base-branch filter and skips only drafts, PRs touching `.github/`, `.claude/` or `CLAUDE.md`, and branches starting `claude/`; `redesign-atlas` has no branch protection, so a plain name would be auto-merged before CI and Vercel finish. Phase PRs are merged by hand with `gh pr merge` after `check` and `Vercel` pass and the owner says "go". One final PR to main when all phases pass, merged by the owner.
- Guard hook (`.claude/hooks/guard-branch.sh`) only checks for a merge into `origin/main`. So: (a) after a phase PR merges, delete that phase branch and never commit on it again (check PR state with `gh pr view` by hand); (b) make the first commit on `claude/redesign-atlas` right away (this plan and `docs/redesign-decisions.md`) so its tip is not an ancestor of `origin/main` and the hook does not block it; (c) merge `origin/main` into `claude/redesign-atlas` at the start of every phase, because main keeps moving (news routine, topics, capstones) and the final PR would drift.
- CLAUDE.md and the rule files stay law. This redesign deliberately changes the rules listed in section 6. Each change is made in the same phase as the code, with the owner's answer first. Everything not listed there still applies (honesty rules, no runtime third parties, accessibility, offline, SEO, security headers, motion tokens).
- Multi-agent per CLAUDE.md: main session is admin; `worker-strong` for CSS and component work, `reviewer` after each, `worker-cheap` for greps and check runs. Show a plan table and wait for "go" before each phase.
- Every phase ends with: `npx tsc --noEmit`, lint, `npm test`, a build into another directory (`NEXT_DIST_DIR`) plus `check-seo`, `check-news`, `check-diagram-overflow`, `check:ui` at 1440 and 390 in light and dark, and a short report. `check:tour` runs in phases 2 to 5 (and 8), `check:offline` in phases 1, 2 and 8. `/ponytail-review` before every push.

## 3. Design language (from the prototype)
- Light: paper `#E6E2D6`, ink (blue) `#1B2A6B`, second ink (orange) `#E8452A`. Dark: paper `#1A1512`, ink `#EDE3CC`, second ink `#FF7050`.
- Measured contrast: blue on paper 10.2:1; cream on brown 14.2:1; orange on brown 6.6:1; orange `#E8452A` on light paper only 3.05:1, so it is for lines, rings and large type. The text-safe orange for light is `#B33414` (4.74:1). Muted text: `#55608F` on light paper (4.69:1), `#A39B8B` on dark (6.57:1).
- Type: Libre Caslon Display (headings), Libre Caslon Text (body), Cabin (labels and UI). Sentence case. No tracked all-caps eyebrows and no monospace labels (the current Plex Mono role moves to Cabin).
- Shapes: square corners, hairline rules, 1.5px frames. No shadows, no pills.
- Signature devices: (a) overprint headings, routes and the hand-drawn ring in the second ink, darkening where they overlap (light) or lightening (dark); (b) metro chart: stations, elbow lines with 45-degree chamfers, a hand-drawn ring round the current station; (c) station sign: reversed-out title bar with a line badge, "read first" and "makes possible" columns; (d) timetable for routes; (e) crop marks round the chart.
- Token mapping: `--paper`, `--ink`, `--ink-soft`, `--rule`, `--accent`, `--skeleton`, `--edge` stay. `--accent` becomes the text-safe orange in light (`#B33414`) and `#FF7050` in dark (6.63:1). Add `--ink2` (second ink, graphics and large type). Every colour token stays a 6-digit hex: `lib/graphUi.ts` `readThemeColors` only accepts `/^#[0-9a-f]{6}$/i` (no `color-mix`, no oklch). Add `--ink2` to `ThemeColors` there.
- Overprint is a CSS pseudo-element (`::before { content: attr(data-text) / ""; }`, offset, `mix-blend-mode`), never a duplicated child span, so `HeaderTopic` (needs an h2 with no child elements), `lib/letterRise.ts` (splits `h1.textContent`), `lib/findOnPage.ts` and the Pagefind index see the text once. Under `forced-colors` and `prefers-contrast: more` the offset copy is removed. Never put overprint on the homepage `h1` that `lib/letterRise.ts` splits into letters and flies into the bar (the pseudo-element would stay behind), nor on anything the Splash `.is-landing` hand-over moves; if overprint is ever wanted there, add a class from `trackFly` that hides it while the flight runs.

## 4. Phases (each phase leaves the integration branch building with every check green; Phase 4 is the one exception, see there)

### Phase 0: spikes and a decision doc (no UI change)
- A. Map renderer spike: see 7.1. Output: pass or fail against the gate list, with screenshots.
- B. Fonts: measure LCP and CLS with Libre Caslon Display, Libre Caslon Text and Cabin through `next/font/google` (self-hosted at build) against today's Newsreader and IBM Plex Mono. List everything tied to the current fonts: `lib/fonts.test.ts`, the separate `--font-serif-italic` instance (every `font-style: italic` rule must set it, per accessibility-and-chrome.md), the preload rule, `scripts/check-diagram-overflow.mjs` (loads Newsreader and Plex), `scripts/make-og.mjs` (`--font-mono`), the 32 `font-mono` CSS rules.
- C. Theme reveal spike: see 7.4.
- D. Contrast pre-check of every token pair in both themes (numbers only; the enforcing test lands in Phase 1).
- E. Take the decision register (section 6) to the owner.
Output: `docs/redesign-decisions.md`.

### Phase 1: tokens, type, colour plumbing
- Colour tokens in `app/globals.css` (26 hex values), `app/layout.tsx:52-53` (`viewport.themeColor`), `lib/graphUi.ts:3-8` (INK, INK_SOFT, EDGE, PAPER, ACCENT, ACCENT_DARK), `lib/diagramCheck.ts` (allow `mix-blend-mode` only if diagrams need it; otherwise keep overprint out of diagrams), ThemeToggle `theme-color` effect, `scripts/make-og.mjs` and the OG image, favicon and `icon.svg`, `apple-touch-icon.png`.
- Fonts and everything in the Phase 0 list. Run `check:offline` (its warm-up reads stylesheets for fonts).
- Add `lib/contrast.test.ts`: reads the tokens from globals.css and fails text pairs below 4.5:1 and graphic pairs below 3:1. Re-measure the links rationale (graph.md and the in-sentence underline rule say rust against ink is under 3:1) and `a:active` colours with the new pair.
- Print stylesheet (`globals.css` near line 4434), `prefers-contrast`, `forced-colors`: carry over and re-check.
- Company marks on the new paper (`.company-logo-light/dark`, dimmed 0.7, never recoloured, logos.md).

### Phase 2: chrome
Header (`SiteNav` with its "small mono links" rewritten to Cabin, `HeaderTopic` page and section fade), footer (`SiteFooter`), Menu button, Splash colours and flight onto the masthead (keep the three-node `LogoMark`, `letterRise`, `.is-landing`, the hand-over on `transitionend`), `NavPending`, the theme toggle with the reveal (7.4), search (`Search`, `FindOnPage`, `.is-found`, "/" and Escape), buttons, forms, focus rings, skeletons, `BackToTop`, `CopyLink`, `ReportMistake`, `OfflineSupport`. Keep `data-tour` targets and every press-feedback rule.

### Phase 3: homepage (except the map)
Masthead keeps: wordmark, lead line, two-paragraph pitch, the one filled start button (`NextUp`, `lib/nextUp.ts`), "Why I made this", tour links, search. Also: Inside a topic, Try a question, Put it together, Companies we learn from, `StateLegend`, `PathView` (the phone default) as the vertical line, "All topics" index. Content stays computed (`lib/homepage.test.ts`, `lib/homeContent.test.ts`). A static "start here" margin note shows only in the first-visit render (no progress), never to a returning reader.

### Phase 4: the map (gated by Phase 0 spike A), three PRs into the integration branch, merged in order
Between 4a and 4c the integration branch's map is missing camera, keyboard, node-open and back-keeps-view, which is acceptable because the branch is never deployed to production; the map-parity checks (`check:ui` map checks, the 1280 and 1440 zero-crossing test) must pass after 4c, not before.
- 4a: SVG renderer at parity with today's look, on the existing layout (`lib/graph.ts`, `chooseLayers`).
- 4b: metro styling: elbow edges with chamfers, station markers, group buttons, legend.
- 4c: port of camera and zoom/pan (`lib/camera.ts`), node-open transition (`lib/nodeOpen.ts`: the bubble must stay "a DOM copy of the node (ring, fill, centre dot)"), `lib/mapView.ts` back-keeps-view, scroll-snap and the "Scroll sideways" cue (the cue, "Fit to size" and all zoom were dropped on 29 Oct 2026 by owner decision), tooltip timings (300ms first, 150ms cool-down, keyboard never waits), keyboard traversal and aria-live, the plain text index (the WebGL-fail fallback stays as the no-JS index), the skeleton until placed.
Update `lib/graph.test.ts` crossing tests for elbow geometry; add a 1280 and 1440 zero-crossing test.

### Phase 4d: design pass on the homepage and chrome (after 4b, owner "yes" 29 Oct 2026)
Phases 2 and 3 came out as a recolour: overprint and the other signature devices were left optional. This pass compares screenshots of the real homepage, chrome and Path view with `HomeLight`, `HomeDark` and `Phone` in `docs/design/atlas-prototype/` and brings in what is missing: overprint on section headings (pseudo-element, section 3 rules), crop marks round the map, the reversed-out station-sign look, the masthead layout, the hand-drawn ring. Decision 22 still applies (no handwritten note, italic micro-labels, colophon, extra rules). Done when side-by-side screenshots at 1440 and 390, light and dark, are shown to the owner. Own PR into the integration branch.

### Phase 5: topic and learn pages
Margin definitions for glossary terms (owner-approved 29 Oct 2026) are part of this phase; numbered sidenotes stay Phase 7. Done when a side-by-side screenshot comparison with the `Chapter` prototype screen is shown to the owner (the gate that Phases 2 and 3 lacked). Title block as the station sign (the map still opens a topic on click; the sign is the page header and the hover/focus preview), lesson rail as a short metro line (`LessonRail`, `LearnRail`, `LessonTrackers`), "In short", sections, quiz and exercises (`Reveal` keeps its one named `grid-template-rows` exception), glossary popovers (kept: `GlossTerm`, `GlossaryFilter`), `StepThrough`, `HighlightTarget`, sources and `PostSources`, `InterviewTag` (its mono rule rewritten), `PageUpdated`, learn pages and the click-to-load `VideoEmbed` facade, `TopicDossier`, interactive figures re-themed through tokens (`components/figures`, `npm run audit:figures`).

### Phase 6: every other page
Gate: the prototype has no screens for these, so show the owner one sample screen per page type (capstone, a list page, a text page) before building the rest. `/capstones` and `/capstone/<slug>` (all interactive parts), `/posts` (Blogs), `/reads`, `/glossary`, `/background`, `/data` (`DataControls`), `/about`, `/terms`, `/privacy`, `app/_new` (hidden, not routed: keep restyled and still hidden; `WhatsNew`), 404, tours overlay (`TourOverlay`, `TourLink`; `check:tour`).

### Phase 7: additive features (each opt-in, separate PR, only with an owner "go")
Timetable (route planner, derived from the graph), tally marks (only if the duplicate-count rule is solved, see 6.11), interchange stations (only with an encoding that keeps node state legible, see 6.9), margin sidenotes, the ring turntable. The turntable is content work, not design: figures.md takes inputs from `digest.numbers` rows and only where a source gives the mechanism, so it goes through `add-post` and `verify:figures`.

### Phase 8: proof
Full checks, `check:offline` and `check:tour` on a production build, a pass over every row of the parity checklist (section 8), real phone and Safari, Lighthouse before and after, owner walk-through, then the one PR to main.

## 5. What the prototype shows versus the site
Prototype-only mechanics to leave out: the worst-case data switch (becomes test fixtures, not a control), paper grain (full-page SVG filter, costly), colour-bar swatches, dotted guide grid. Prototype words to change: "chapter" and "plate" become "topic" (the site's word, and the URLs); metro words stay visual only.

## 6. Decision register (design versus current rules; recommendation in brackets)
1. Blue plus orange two inks replace "cream and one rust". [Accept; rewrite CLAUDE.md "Site feel".]
2. Light paper `#E6E2D6` replaces cream `#f3ecdc`. [Accept.]
3. Orange text safety. [`--ink2` for graphics and large type; text uses `--accent` (`#B33414`).]
4. Fonts: Caslon plus Cabin replace Newsreader plus Plex Mono. [Accept if Phase 0 LCP and CLS hold.]
5. Mono small-caps labels go. They appear in the CLAUDE.md review checklist, graph.md group names, SiteNav "small mono links", `InterviewTag` (topic-pages.md), motion.md (the "not a mono `.label` one" wording) and the `.label` filter in `HeaderTopic`. [Accept; rewrite every one; keep the `.label` class name so `HeaderTopic` still works.]
6. Overprint text may read as a drop shadow. [Accept as a print device, done with a pseudo-element (section 3); not a blur shadow.]
7. Dotted guide grid ("dot grids" banned). [Use solid 12% hairlines.]
8. Colour-bar swatches ("coloured stripes" banned). [Drop.]
9. Paper grain. [Drop.]
10. Crosshair registration mark in the masthead. [Keep the three-node `LogoMark` only; drop the crosshair. Crop marks stay as hairlines.]
11. Tally marks versus "no count or status appears twice on one page" and "homepage shows no counts". [Defer to Phase 7; only if it replaces another progress display.]
12. Motion. The print-in stagger conflicts with "no staggered effects" and doubles the Splash. [Drop it.] The registration slide used 360ms, which is not a token and was tied to selecting. [Drop, or keep as a pointer-only hover/press highlight at `--dur-slow` 320ms, never on a keyboard action; owner chooses.] The theme reveal animates `clip-path`: needs a new duration token mirrored in `lib/motion.ts` and CSS (`lib/motion.test.ts`) and a written exception in motion.md.
13. Vocabulary: keep "topic". [Accept.]
14. Map click: keep click-to-open, the sign is the topic header and the hover/focus preview. [Accept.]
15. Progress markers: the prototype's concept/posts halves versus graph.md's four states (unread thin outline, ready thicker outline plus centre dot, in progress rust outline and rust centre dot, read filled). [First read `lib/progress.ts` and `LessonTrackers` to see what is stored; keep the four states by shape; add halves only if the data exists.]
16. Interchange stations change node shape, which already encodes state. [Phase 7 only; encode as a separate outer ring and prove the four states stay distinct in greyscale.]
17. "Start here" note versus the `NextUp` priority. [First-visit render only (section 4, Phase 3).]
18. Sidenotes versus glossary popovers. [Keep popovers; numbered sidenotes are Phase 7. Margin definitions of every glossary term, beside the paragraph that uses it, were approved by the owner on 29 Oct 2026 and built in Phase 5 (`MarginTerms`).]
19. Rust is named in graph.md states, in `a:active`, and in the in-sentence underline rationale. [Rewrite each for the new pair after Phase 1 re-measures. The underline rule STAYS: orange text on blue ink is 2.15:1 (`#B33414` on `#1B2A6B`) and `#FF7050` on `#EDE3CC` is 2.14:1, both under the 3:1 that WCAG 1.4.1 asks for, so in-sentence links keep their underline.]
20. Branch strategy (section 2): long-lived `claude/redesign-atlas` with `claude/redesign-pN-*` phase branches, merged by hand, one final PR to main. This departs from CLAUDE.md ("start a new one with `git switch -c <name> origin/main`") and the memory note `branch-off-main` ("never stack on unmerged branches"). [Accept for this project only, so the live site is never half-converted. Alternative if refused: ship each phase straight to main behind no flag, which leaves a half-converted site live for weeks.]
21. Overprint on the flying homepage heading. [None there (section 3).]
22. DECIDED 28 Oct 2026: apply all five "vibe-coded" audit fixes, already applied to the prototype and to the copy in `docs/design/atlas-prototype/`. The real build must not bring any of them back. Tells removed: the colophon line ("Set in Libre Caslon and Cabin. Printed in two inks…"), the handwritten "start here" note (keep the hand-drawn ring), the italic micro-labels ("show me", "find", "Where do you want to get to?"), the half-degree rotated "In short" slip, and the excess hairline rules (about 17 on the home page; keep the frame, the chart and one rule per section). Also removed: per-row hairlines in the timetable, quiz and sources lists, and the dividers inside the station sign (about 17 rules down to 8 on the home page).

## 7. Risks and handling

### 7.1 Map renderer (largest)
Today: Sigma (WebGL), graphology, a custom layout, `lib/camera.ts`, `lib/nodeOpen.ts`, `lib/mapView.ts`, about 1,135 lines in `GraphView.tsx`. The prototype is DOM and SVG with elbow edges, which Sigma cannot draw. Options: (1) keep Sigma and restyle only (cheap, loses the metro look); (2) SVG renderer on the existing layout (matches the design, drops about 190 KB, and reads CSS variables natively so a theme change needs no repaint). Spike gate for (2): elbow routing with zero edge/label/node crossings at 1280 and 1440 for every topic; smooth at 150 nodes; zoom and pan parity; keyboard traversal and aria-live; back-keeps-view; scroll-snap; hit areas 44px. Fail on any: fall back to (1).

### 7.2 Accidental feature loss
Parity checklist (section 8) is walked in every phase report: which features were touched and how each was verified.

### 7.3 Accessibility
Contrast test (Phase 1); state never by colour alone; 44px targets; focus rings; `prefers-contrast` and `forced-colors` (overprint and blend removed); reduced motion.

### 7.4 Theme reveal (named "theme reveal", because graph.md already calls the node-open sequence a "burst")
- Same-document View Transition around `ThemeToggle.choose`; pointer clicks only. A keyboard activation (click detail 0) swaps instantly.
- Inside the update callback: set `data-theme`, use `flushSync` for the React theme state (or the new snapshot shows the old sun or moon icon), and if the map still uses Sigma call its `refresh()` there (the MutationObserver sync runs after the callback's frame; the browser paints nothing while the callback runs). The SVG map from 7.1 needs none.
- Scope: a flag on `<html>` while it runs. It disables the existing `::view-transition-old/new(root)` cross-fade rules and removes the `site-header` `view-transition-name` (otherwise the header cross-fades outside the circle). The reveal is a `clip-path: circle(0 at x y)` growing on `::view-transition-new(root)`, 500 to 600ms, new token.
- Interplay: starting a view transition skips one already running. Do not start the reveal while a navigation transition is running (swap instantly instead); store the reveal in `running` in `ViewTransitions.tsx` so `skipRunningTransition()` (NavPending) can end it. A click during the Splash only skips the Splash.
- `theme-color`: the effect runs after the transition, so the browser bar changes just after the reveal. Accepted.
- Reduced motion keeps motion.md's 80ms fade rather than a hard swap: use the existing root cross-fade at `--dur-reduced`. No browser support for the API: instant swap, as today. The inline no-flash script in `app/layout.tsx` needs no change.

### 7.5 Performance and offline
No full-page filters, no new runtime third parties, fonts self-hosted, `check:offline` passes, LCP not worse than today (Phase 0 B baseline, Phase 8 compare).

## 8. Feature-parity checklist (tick per phase in each report)
Rule files: topic-pages, learn-pages, progress-tracking, homepage, graph, motion, seo, accessibility-and-chrome, tours, background, figures, reads, capstones, news, logos, offline, security, tooling.
Pieces that are easy to lose: Splash and `letterRise` flight, `data-tour` targets, `NavPending`, `HeaderTopic` fades, map scroll-snap and the "Scroll sideways" cue (dropped 29 Oct 2026 by owner decision, with "Fit to size" and all zoom), tooltip timings, the text index fallback, `BackToTop`, `CopyLink`, `StepThrough`, `Reveal`, `HighlightTarget`, `FindOnPage` `.is-found`, `GlossaryFilter`, `DataControls`, `WhatsNew`, `OfflineSupport`, print stylesheet, `prefers-contrast`, `forced-colors`, JSON-LD and OG images, security headers and CSP, sitemap, Pagefind search, "/" shortcut.

## 9. Starting the build in a fresh session
1. Read this plan, then memory notes `redesign-keep-all-features` and `night-theme-brown-and-burst` (reveal is the same feature; use the name "theme reveal").
2. Read `docs/design/atlas-prototype/README.md` and open the artifact.
3. Create `claude/redesign-atlas` from `origin/main` and commit this plan and `docs/design/` on it first (section 2, guard hook). Do Phase 0 and bring the register to the owner. Do not start Phase 1 until they answer.
4. After each phase: PR into `claude/redesign-atlas`, report (one line per agent, rough tokens), wait for "go", then merge by hand with `gh pr merge` and delete the phase branch.
