# Design audit

Report only. No code or content was changed. Screenshots are in `docs/audit/design/` (named `<page>-<viewport>-<theme>.png`, viewport 1440 or 390, theme light or dark; a few extras at 768).

## How this was done

- Skills read in full before anything else: `emil-design-eng` (Emil Kowalski's design engineering philosophy), `review-animations` (+ its `STANDARDS.md`), `animate`, `animation-performance`, and `apple-design` (Apple's WWDC material translated to the web). I did not read `mobile-native`, `animate-expo`, `write-swift` or the rest: they are about other platforms.
- Skills applied: `emil-design-eng` and `review-animations` for motion and component feel; `animation-performance` for what animates and where; `apple-design` for typography, consistency and craft. Where no skill says anything (alignment, social image, print), the finding says "no skill principle" and rests on CLAUDE.md or my own judgement.
- CLAUDE.md governs. Its "Rule precedence" section says skills are advisory, so anything a skill suggests that CLAUDE.md bans is listed under "Needs a rule change" and mostly rejected.
- Build: the production build already in `.next-search` (HEAD `e670b8c`, working tree clean), served by `next start` on :3100. I did not rebuild. Playwright (headless Chromium) at 1440x900 and 390x844, light and dark (`colorScheme`), JS on.
- Pages captured: home Map and Path (1440; 390 shows Path only, by design), topic (Caching: top, concept, diagram/glossary, Meta/Uber posts, ending), learn, /background, /posts, quiz and exercise sections, glossary, About, Your data, Terms, 404.
- Numbers (contrast, tap area, CLS, bytes, computed styles) come from scripts run against that server. They are labelled "measured". Everything else is "seen in screenshot" or "from CSS".

## Biggest lift

### B1. /posts shows the contents rail as an unstyled bullet list below 1180px
- Page, viewport: /posts at 390 (`posts-390-light.png`, `posts-390-dark.png`) and 768 (`posts-768-light.png`). Dark 390 was captured but I only looked at the light ones.
- Wrong: the three rail lists render as plain `<ul>`s with default bullets. Group labels and topics run together ("FoundationsDatabases", "ScalingLoad Balancing"), the "TOPICS" label floats left of the list, and the whole thing sits above the view links and the list, so the first screen of the page is a ~500px index and the posts start below the fold. At 768 it is half the screen.
- Why: apple-design, Craft: "Nothing is random ... Jittery scroll, misaligned icons, and layouts that break on rotation read as carelessness." CLAUDE.md: "A feature is not done until it works on mobile." This is a regression from my own /posts commit; my mobile check then covered overflow only.
- Fix: hide `.posts-rail` under 1180px (the other pages swap to a quiet "Contents" strip on small screens; either do that or hide it, since the view links already sit at the top).
- Effort S. Risk low. CLAUDE.md change: none.

### B2. Keyboard focus is invisible on quiz options and an off-palette browser blue everywhere else
- Page, viewport: topic page, any viewport (measured at 1440; same CSS on 390).
- Wrong, measured: on a focused quiz option the computed outline is `solid 1px rgba(0,0,0,0)` with `:focus-visible` true. `.option { outline: 1px solid transparent }` (`app/globals.css:2203`) overrides the browser ring, so a keyboard user cannot see which answer is focused. I could not capture a clean screenshot of it (smooth scroll kept moving the page), so this rests on the computed style plus the CSS. On Mark done, Show a model answer, footer links and rail links the ring is the browser default (`auto 1px rgb(0, 95, 204)`), a saturated blue that exists nowhere else in the palette. Only the graph, lesson code blocks and Back to top have a designed ring (`:527`, `:578`, `:2474`, `:2677`).
- Why: CLAUDE.md: "WCAG AA contrast, visible focus rings, full keyboard use". apple-design, Familiarity: "things that look the same must behave the same."
- Fix: one rule, `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px }`, and let `.option` keep its state outline for wrong/right but use the same ring on focus (state outlines move to a different offset or a rule colour so they do not clash). Accent is 5.91:1 light and 4.98:1 dark on paper, so it passes as a UI indicator in both themes.
- Effort S. Risk low (check the quiz right/wrong states still read). CLAUDE.md change: none.

### B3. On desktop the map's right edge cuts through labels and nothing says it scrolls
- Page, viewport: home Map at 1440 (`map-1440-light.png`, `map-1440-dark.png`; also `home-map-1440-*.png`).
- Wrong, measured and seen: the stage is 1717px wide inside a 1320px window at 1280, 1440 and 1920 alike (the home column stops at 1400px). The right three columns are cut at the window edge: "Publ", "Cons" and two edges end mid-curve. "Fit to size" is disabled and faint, so nothing explains it. The sideways scrollbar is not visible in the screenshots (macOS overlay scrollbars hide until used, and headless Chromium may differ), so a visitor sees a map that looks broken or unfinished at the most common desktop width.
- Why: apple-design, Wayfinding: "Every screen should answer: Where am I? Where can I go? What's there?"
- Fix, smallest first: (a) a quiet mono cue in the legend row, e.g. "Scroll sideways for more", visible only while the map overflows and hidden at the end of the scroll; (b) let the stage scroll-snap so the cut falls between columns, never through a label; (c) larger: tighten the column pitch so the map fits the 1320px window (labels stay full size, the gaps shrink). (c) conflicts with docs/graph.md wording, see R2.
- Effort S for (a)/(b), L for (c). Risk: (c) touches the layout engine and the zero-crossings check. CLAUDE.md change: none for (a)/(b).
- Not tested: panning, zoom keys and opening a node. My one attempt at `+` zoom did not change the picture, so I am not claiming anything about zoom feel.

### B4. No social image, no theme-colour, no touch icon
- Page: every page (checked on /topic/caching's `<head>`; all pages share the layout).
- Wrong, measured: `og:image` and `twitter:image` are absent (`twitter:card` is `summary`), there is no `theme-color` meta, no `apple-touch-icon` and no manifest. Links pasted into chat show a bare title; a phone's browser bar stays default grey against a cream page, and a home-screen bookmark gets a screenshot tile. The favicon (`icon.svg` plus a 32px PNG) is present and fine.
- Why: apple-design, Craft: "Uncompromising attention to detail builds trust." No skill principle covers the image itself.
- Fix: one static 1200x630 image generated at build (wordmark, tagline, three-node mark on `--paper`, no gradient), `theme-color` for light and dark through `viewport`, and a 180px touch icon from the existing mark. All static, nothing at runtime.
- Effort M. Risk low; keep `check-seo` happy (it checks raster images in pages, not meta). CLAUDE.md change: none, but add one line under SEO naming the image.

### B5. The header and the page body do not share edges
- Page, viewport: home vs every other page, 1440 (`home-map-1440-light.png` vs `about-1440-light.png`, `posts-1440-light.png`).
- Wrong, measured from screenshots: the header wordmark sits at x=120 and the theme toggle at x=1298. Home content runs 60 to 1380. Topic/learn text starts at x=404, glossary/about/data at 404, but /posts starts at x=324 (840px column) and its rail at x=110. So moving from About to Posts shifts the page title 80px left; moving to home shifts the whole frame. The toggle lines up with nothing on the home page.
- Why: apple-design, Craft: "every spacing, timing, and alignment value is a deliberate choice you can defend."
- Fix: give the header the same container as the page it sits on (or give every page one shared left edge for the title), and put /posts' title on the same x as the other long pages by letting the rail hang left of it, as the topic page does. The rail already exists; only the column width and left offset change.
- Effort M. Risk medium: touches every page's width, so re-run the 1440/390 overflow checks. CLAUDE.md change: none.

## Worth doing

### W1. "Leads to" breaks topic names across lines
- Page, viewport: topic page, 1440 and 390 (`buildson-1440-light.png`, `buildson-390-light.png`).
- Wrong: the right-hand column is about 80px wide, so "Consistent Hashing" becomes two lines and "Rate Limiting" two more: three topics read as four items ("Consistent / Hashing / Rate / Limiting"). It sits on the first screen of every topic page.
- Why: apple-design, Simplicity: "use hierarchy ... so the most important thing is the most obvious."
- Fix: size that column to its content (`grid-template-columns: 1fr auto`, `white-space: nowrap` on each link) or stack Leads to under Builds on on narrow widths.
- Effort S. Risk low. CLAUDE.md change: none.

### W2. Every page navigation fades in 320ms and rises 8px
- Page: all client-side navigation. From CSS only (`app/globals.css:2235-2250`); I did not film the transition, so the feel is unverified.
- Wrong: `::view-transition-new(root)` runs `vt-in` over `--dur-slow` (320ms) with `translateY(8px)`. A reader clicking through topics, rail links and the posts index does this tens of times a day.
- Why: emil-design-eng, frequency table: "Tens of times/day (hover effects, list navigation) | Remove or drastically reduce." And: "Rule: UI animations should stay under 300ms." review-animations: "Justified motion. Every animation must answer 'why does this animate?'"
- Fix: opacity only, `--dur-fast` (120ms) in, the existing 160ms out, no translate. Header keeps its fixed view-transition name. Reduced motion already zeroes the tokens.
- Effort S. Risk low. CLAUDE.md change: none (still no fade on load).

### W3. Smooth scrolling applies to everything, including keyboard-driven jumps
- Page: all long pages (topic is ~15,000px at 1440). From CSS (`app/globals.css:2095`, `html { scroll-behavior: smooth }`) and one side effect I hit: `scrollIntoView` returned before the page had moved, so my first tap-target measurement read stale positions until I forced `behavior: "instant"`.
- Wrong: rail links, "Skip to the posts", search-result anchors and Tab-driven focus all animate over a browser-chosen duration that grows with distance.
- Why: emil-design-eng: "Never animate keyboard-initiated actions." review-animations: "Keyboard-initiated and 100+/day actions get no animation."
- Fix: drop the global rule; keep a smooth scroll only for the Back to top button, in JS, and only when reduced motion is not requested. Anchors then jump, which suits a reading tool. Reduced-motion already switches to `auto`.
- Effort S. Risk low (the rail's scroll-spy and the `scroll-margin-top` offsets are unaffected). CLAUDE.md change: none.

### W4. Home prefetches every topic page: about 1.26 MB on load
- Page: home at 1440. Measured: 18 `?_rsc=` fetches of 70 to 81 KB each (decoded bytes, local server), none for Pagefind. They are idle fetches and do not touch FCP/LCP (CLS 0.002). The phone cost was not measured; the Path list is the only view there, with the same links.
- Why: animation-performance, hard rule 3: "Never conclude 'it's fine' from a fast machine." apple-design counts latency the other way ("Be vigilant about every latency"), so this is a real trade-off, not a free win.
- Fix: prefetch on hover/focus/touchstart instead of on viewport entry (`prefetch={false}` plus a small intent handler), or leave it on for the Map only. The node-open transition already takes about 530ms, which covers a single on-intent fetch.
- Effort S to M. Risk: first open on a slow network may wait on the fetch; measure on throttled 4G before shipping. CLAUDE.md change: none.

### W5. Quiz answers are 18 underlined links and the letters misalign
- Page, viewport: topic page, 1440 (`quiz-1440-light.png`); 390 is fine (`quiz-390-dark.png`).
- Wrong: every option is a button with `text-decoration: underline` (measured), so a question reads like a list of hyperlinks. At 1440, when an option wraps, its letter ("A.", "C.") sits beside the last line instead of the first.
- Why: apple-design, Familiarity: "things that look the same must behave the same" (underline means link here). emil-design-eng: "Buttons must feel responsive" applies to these too: press feedback is there, a visible resting affordance is not.
- Fix: no underline at rest (hover and focus add it, hover gated behind `(hover: hover)`); align the letter to the first line (`align-items: baseline` on the first line box or a fixed `padding-top`); keep the 44px tap area.
- Effort S. Risk low. CLAUDE.md change: none.

### W6. The text-button family has four looks
- Page, viewport: topic page, 1440 and 390 (`exercises-1440-light.png`, `exercises-390-light.png`, `topic-end-1440-light.png`).
- Wrong: Mark done (checkbox glyph + underlined mono), Show a model answer (ink mono, no underline, indented 8px from the text above it), Back to top (hairline box), Reset (faint underlined mono). Same weight in the hierarchy, four treatments, and the answer button does not align with its paragraph.
- Why: apple-design, Familiarity: "Be consistent: things that look the same must behave the same and live in the same place."
- Fix: one `.text-button` look (mono, small caps, underlined, no box), the answer button left-aligned with the text, Back to top as the same style without the box (CLAUDE.md already calls it a "text button"); keep the checkbox glyph only on Mark done.
- Effort S to M. Risk low. CLAUDE.md change: none.

### W7. Learn and Background rails show a live "scrolled: N%" counter
- Page, viewport: learn at 1440 (`learn-1440-light.png`), background (`background-index-1440-light.png`): "PAGE SCROLLED: 0%", "SECTION SCROLLED: 0%".
- Wrong: a number that ticks while you read, next to a bar that already shows it. The topic page rail says "0 OF 8 DONE", which is progress the reader chose; this is just scroll position.
- Why: apple-design, Simplicity: "Every element earns its place." review-animations: "When unsure whether motion feels right, the strongest move is often to delete it." (the same instinct for a ticking readout).
- Fix: keep the bar and the `aria-label` (`components/LearnRail.tsx:97`), drop the visible text.
- Effort S. Risk low. CLAUDE.md change: none.

### W8. Glossary has 156 terms, 16,000px and no way to jump
- Page, viewport: glossary at 1440 and 390 (`glossary-1440-light.png`, `glossary-390-dark.png`). The page has only a filter. /posts and /background have a contents rail; glossary is the long page without one.
- Fix: the same rail pattern as /posts, listing the 18 topic groups (Pagefind keeps working: the terms stay in the HTML). On phones, the "Contents" strip.
- Effort M. Risk low. CLAUDE.md change: none.

## Polish

- **P1. No `text-wrap` anywhere.** Single-word last lines: "own." (exercise 2, `exercises-1440-light.png`), "back." (Common mistakes), "to users." Fix: `text-wrap: pretty` on paragraphs and list items, `balance` on headings and the lead. Ignored where unsupported. S, no risk.
- **P2. One tracking value for all heading sizes.** `h1, h2, h3 { letter-spacing: -0.01em }` (`:62`); measured -0.4px at 40px and -0.21px at 21px. apple-design: "Tracking (letter-spacing) is size-specific — never one value for all sizes. ... Tighten headings, leave body near 0." Fix: h1 about -0.02em, h2 -0.015em. Mono labels at +0.08em already follow the "small text slightly positive" half. S.
- **P3. Mono labels at 11px carry information.** 11 declarations at 11px (`:93`, `:605`, `:1019` and more): "READY", "0 OF 8 DONE", "ORIGINAL POST", reading time. Fix: 12px for labels that state something, 11px only for decoration. Re-run the posts-grid and header overflow checks. S.
- **P4. No `::selection` colour.** Selection is the OS blue on cream. Fix: a token-based selection (accent text on a tint of `--rule`), light and dark. S.
- **P5. No print stylesheet.** Measured by grep: no `@media print`. A 15,000px topic printed or saved as PDF keeps the fixed rail, header and Back to top. Fix: hide chrome, ink on white, show link URLs for the Original posts list. S.
- **P6. Hover colour rules are ungated.** 14 `:hover` rules and one `(hover: hover)` block (`:226`). Fix: wrap link hover in `@media (hover: hover) and (pointer: fine)`. emil-design-eng: "Touch devices trigger hover on tap, causing false positives. Gate hover animations behind this media query." Not tested on a real phone. S.
- **P7. Your data repeats 18 disabled Reset buttons.** `data-1440-light.png`, `data-390-light.png`: every row reads "0 OF 8 DONE" plus a ghosted RESET. Disabled controls are exempt from contrast rules, but the column is noise. Fix: show Reset only on rows with progress. S.
- **P8. Repeated name before every "builds on" sentence.** "Load Balancing: Load balancing shows requests ..." (learn page, `learn-1440-light.png`) and the Path rows ("Databases: Replication takes from databases ..."). The sentence restates the link. Fix: link the name, then the sentence; no repeated prefix. Presentation only. S.
- **P9. Short pages leave the footer mid-screen.** `notfound-1440-light.png`, `terms-1440-light.png`. Fix: min-height on the page shell with the footer pushed to the bottom. S.
- **P10. Glossary and filter spacing.** At 390 the "156 terms ..." line sits about 4px under the filter underline (`glossary-390-dark.png`); on /posts the gap between the view links and the filter is looser than elsewhere. S.
- **P11. Exercise numerals.** The serif "1." is larger than the mono APPLY/DESIGN label beside it and rides high (`exercises-1440-light.png`). Fix: same size and baseline as the label, or drop the label's separate line. S.
- **P12. Pixel sizes ignore the browser's default text size.** `html, body { font-size: 18px }` and about 90 font-size declarations, nearly all in px. Page zoom works; a changed browser default does not. apple-design: "Respect the user's text-size setting ... spacing in `rem`/`em`, not fixed px." Not tested at larger default sizes. L, medium risk (every layout number moves). Do this last or not at all.
- **P13. Figures in columns.** Years in /posts and "0 / 6 read" counters use whatever figures the font defaults to. A `tabular-nums` rule on those cells would stop them wobbling as counts change. I did not check that Newsreader ships tabular figures; if it does not, skip. S. No skill principle.

## Needs a rule change

### R1. Back to top covers text on phones
- Where: `topic-390-light.png`, `exercises-390-light.png`: the 44px box sits over the right edge of the text ("a failover" is hidden).
- CLAUDE.md rule: Accessibility and chrome, "A 'Back to top' text button appears after about 1.5 screens." A floating button over a 16px gutter cannot avoid text.
- Proposal: on phones, put "Back to top" in the sticky progress strip instead of floating. Desktop is unchanged, where it sits in the gutter.
- Effort S. Recommend yes.

### R2. The map is meant to stay full-size and scroll sideways
- docs/graph.md ("labels at full size, never shrunk ... the whole map section scrolls sideways") and CLAUDE.md Graph. B3(c) would narrow the column pitch so the map fits at 1280 to 1440.
- Proposal: keep labels full size; allow the pitch to shrink down to a stated minimum; keep sideways scroll only below that.
- Effort L. Recommend only if the cue in B3(a) feels insufficient after you look at it.

### R3. Ideas in the skills that CLAUDE.md bans, all recommended against
- Stagger group entrances 30 to 80ms (emil-design-eng, "Stagger Animations"): conflicts with Motion, "no staggered or scroll-triggered effects."
- Blur to bridge crossfades (`filter: blur(2px)`): conflicts with "Animate only transform, opacity, and color."
- Springs, momentum, rubber-banding (emil-design-eng, apple-design): conflicts with "No bounce or elastic"; the Map has no gesture that needs it.
- Translucent `backdrop-filter` header (apple-design "Materials & depth"): conflicts with "liquid glass" in the banned list, and with your brief.
- `@starting-style` and clip-path reveals: motion for its own sake on a reading page.
- None is worth a rule change here. Listed so the answer is on record.

## Leave alone (already good, do not touch)

- **L1. Palette and contrast.** Measured against paper: ink 14.55:1 light and 14.13:1 dark; ink-soft 6.42 and 6.54; accent 5.91 and 4.98; both pass AA for text. Rule lines are 1.48 and 1.43 and are decoration only.
- **L2. Typography pairing and measure.** Newsreader and IBM Plex Mono at 18px/1.55 with a ~632px column on the reading pages (screenshots of topic, learn, About). Heading to lead to body rhythm reads calm on `topic-1440-light.png`.
- **L3. Motion tokens and easing.** 120/200/320ms with `cubic-bezier(0.23, 1, 0.32, 1)`, which is exactly the strong ease-out in emil-design-eng. Press feedback `scale(0.97)` on `:active`, as the skill says. Only transform, opacity and colour animate, bar the `.reveal` grid-row transition, which animate allows for accordions ("`height` is tolerated only for accordions"). `transition: all` appears nowhere (grep).
- **L4. Reduced motion.** Under `prefers-reduced-motion` the tokens go to 0ms, smooth scroll is off and press scale is removed (measured: `--dur-base` 0ms, `scroll-behavior: auto`, button transition 0s).
- **L5. Touch targets.** Measured with `elementFromPoint` at 390: footer links (19px boxes) hit-test 44 to 50px, Mark done 52px, quiz options 44 to 79px, progress link 48px, post titles 70 to 79px. The visible boxes are small and the hit areas are not.
- **L6. No overflow and no layout shift.** No horizontal overflow at 1440 or 390 on any of the 11 pages in both themes (measured). CLS 0.002 on home and 0 on topic, posts and glossary. Fonts are preloaded and use `display: swap` with the next/font fallback adjustment.
- **L7. Dark theme.** Warm charcoal, off-white ink, brighter rust. Status shapes (outline, dot, fill) carry state, not colour alone (`map-1440-dark.png`, `topic-1440-dark.png`, `posts-1440-dark.png`).
- **L8. The rail pattern and the mono small-caps label system** across topic, learn, background and posts, once B1 is fixed.
- **L9. Page titles and 404.** Unique titles with the " · sys101" suffix; the 404 is plain and gives one next step. The top screens of About, Your data and the 404 read like a person wrote them; I found no marketing or filler there, but I did not read those pages to the end.
- **L10. Theme change.** The body fades background and colour over 200ms with `--ease-out`, which is the eased dark/light change apple-design asks for ("ease dark↔light theme changes").

## What I could not test

- No real device. Touch pan, pinch, pull-to-refresh and sticky hover on a phone are untested; 390px was a desktop Chromium viewport with touch enabled.
- Safari and Firefox. Everything was Chromium only; `text-wrap`, view transitions and focus rendering differ.
- Map interaction: pan, wheel, keyboard zoom, opening a node and the node-open transition. I did not watch any animation at speed or frame by frame, so every motion finding is from CSS, not from feel.
- Screen readers, forced colours and `prefers-contrast` (no rule exists; not tested), and browser text-size settings.
- Dark-mode screenshots were all captured but I only looked at a subset: topic, posts, map, learn (1440) and glossary, quiz, 404, topic-diagram (390). The rest (about, data, terms, background, home at 390 dark) were not looked at.
- Empty and loading states: skeletons, the Continue / "pick up where you left off" line with real progress, Your data after import. I only saw a fresh browser with no progress.
- Network realism: all timings are localhost (FCP/LCP 32 to 56ms are meaningless for a visitor). Byte counts are decoded bodies, not gzip/brotli transfer size. I did not run Lighthouse or a throttled profile.
- JS weight: about 460 KB (topic, posts, glossary) and 649 KB (home) of decoded script per page. I did not identify what is in it. A bundle analysis is the next step before saying anything.
- Content feel: I read the pages I captured, not every topic and learn page, so the voice check covers those and no more.

## Counts

| Group | Findings |
| --- | --- |
| Biggest lift | 5 (B1 to B5) |
| Worth doing | 8 (W1 to W8) |
| Polish | 13 (P1 to P13) |
| Needs a rule change | 3 (R1 to R3) |
| Leave alone | 10 (L1 to L10) |

## Appendix A. Round 1 result (13 October 2026)

Applied B1, B2, B3 (a)(b), W1, W2, W3, W5, W6, W7 and R1, one commit each. Before and after screenshots, 1440 and 390, light and dark, are in `docs/audit/design/round1/` (`<item>-<viewport>-<theme>-<before|after>.png`). Not touched: P-items, W4, W8, B4, B5, B3(c), R2, R3, P12.

Checks run on a production build: `tsc`, 402 tests, check-seo (43 pages), news check, diagram overflow (0 overflowing labels), and horizontal overflow on 45 pages at 1440 and 390 in both themes (180 loads, 0 overflowing). The graph layout engine was not changed; its zero-crossing tests are in the 402. Map pan at 1280 with the wheel scroll does not conflict (a drag changes the camera, scrollLeft stays).

### New findings from the dark screenshots

Looked at: about, data, terms, background-index (390 and 1440), home Path at 390. No overflow, no clipped text, status shapes intact.

### N1. Inline links differ from body text only by a 1.4:1 underline
- Page, viewport: About, Terms, Background, topic prose, 1440 and 390, both themes (`about-1440-dark.png`: "DNS", "Databases").
- Wrong, measured on About: link colour equals the surrounding text (light `rgb(31,27,22)`, dark `rgb(236,228,212)`), and the underline is the `--rule` token (`rgb(207,195,168)` on `rgb(243,236,220)` is about 1.5:1; dark `rgb(57,51,42)` on `rgb(26,23,19)` is about 1.4:1). The underline technically is a cue; judgement: at that contrast a reader skimming a paragraph will not see which words are links.
- Why: apple-design, Familiarity ("things that look the same must behave the same": here links and text look the same). WCAG 1.4.1 asks for a cue beyond colour; I did not test whether this one is enough for low-vision readers.
- Fix: underline in `--ink-soft` (6.4:1 and 6.5:1) for prose links; keep `--rule` for lists of links where position already says "link".
- Effort S. Risk low. CLAUDE.md change: none.

### N2. Background page: the sticky strip sits about 15px above the H1 at 390
- Page, viewport: /background at 390 (`background-index-390-dark.png`).
- Wrong, seen: before any scrolling the strip shows an empty dim track and "CONTENTS", then its bottom rule and the H1 start about 15px apart. Topic and learn pages have a line of text in the strip and more air below it. Same in light (CSS, not colour).
- Fix: more top margin on the first heading after `.progress-sticky` on this page, or leave the strip out until the reader has scrolled one screen.
- Effort S. Risk low. CLAUDE.md change: none.

### N3. Hydration warning on /posts in `next dev`, present before Round 1
- Page: /posts, dev server only (a red issue badge shows in `b1-posts-390-light-after.png`; the baseline at `e670b8c` logs the same message). Console text: "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties."
- Likely cause, not confirmed: `PICK_VIEW` (`components/PostsIndex.tsx:16`) sets `data-posts-view` on `<html>` before hydration and `<html>` has no `suppressHydrationWarning`. The production build shows no badge. Effort S.

### N4. Your data at 390 stacks Reset under each name; 1440 keeps it inline
- `data-390-dark.png` vs `data-1440-dark.png`. Each row is about 95px on a phone for "0 OF 8 DONE" plus a ghosted Reset. Same cure as P7 (show Reset only on rows with progress). Judgement, S.

Not a finding: the home header at 390 shows only the theme toggle, because the masthead already has the wordmark (Logo hides the duplicate by design).

### Not verified in Round 1
- Real-device touch: the phone strip button, tap targets and the `:has()` rule that hides the floating button were checked in Chromium at 390 with touch enabled only. Safari and Firefox untouched (`:has()`, `scroll-snap`, `:focus-visible` ring offsets).
- Scroll-snap used synthetic mouse-wheel input. Real trackpad momentum and touch-scroll on a tablet at 768 to 1024px were not tried. The first, unscrolled map view still cuts labels at the right edge at 1280 and 1440: snapping only decides where a scroll ends.
- Focus ring: checked on a quiz option and Mark done and Show a model answer by script focus after a keypress, not by tabbing through every page. Footer, rail, header and search focus were not looked at one by one.
- Page transition: edited from CSS; I did not film it, so the feel is unjudged. Reduced-motion was not re-run on the new cue and strip button (they use the existing tokens, which are 0ms).
- Between 641 and 1179px the strip shows without its Back to top button and the floating button stays; I did not check that range by eye.

## Appendix B. JavaScript per page

Measured on a production build with source maps (`productionBrowserSourceMaps`, temporary, not committed), loaded in headless Chromium, script bodies decoded; bytes per module from `source-map-explorer`. Totals match the first audit: topic 454 KB, posts 454, glossary 449, About 447, home 638 (gzip: 141 topic, 188 home).

### What every page carries (about 390 KB of 454)
| Chunk | Size | What it is |
| --- | --- | --- |
| `4bd1b696` | 169 KB | react-dom |
| `255` | 170 KB | Next's App Router client: react-server-dom-webpack 23 KB, react 8 KB, router and prefetch code, the rest of react-dom's scheduler |
| `176` | 9 KB | `next/link` |
| `app/layout` | 12 KB | ThemeToggle 2.0, Vercel Analytics about 3 (`src/utils.ts`, `generic.ts`, `react`), BackToTop 1.3, Logo 1.2, ViewTransitions 1.2, HeaderTopic 0.8 |
| `webpack`, `main-app` | 5 KB | runtime |

None of the framework 340 KB can go without changing framework. `polyfills` is `nomodule` and was not downloaded.

### Topic and posts (454 KB loaded vs about 392 KB in the page's own `<script>` tags)
- Page code: topic 11 KB, posts 3 KB (own chunk), plus `494` (18 KB, shared with posts): `lessonStore.ts` 7.2, **`legacyQuiz.ts` 7.0**, `progress.ts` 3.1.
- **About 60 KB arrives through link prefetch, not from the page.** With CDP initiators: the logo link to `/` pulls the whole home chunk (`app/page`, 53 KB, which holds `GraphView.tsx` 21.8, `lib/graph.ts` 8.7, Search 3.2, PathView 2.7, nodeOpen 2.3, TryQuestion 2.1) and the "Start from zero" link pulls the learn chunk (`216` 5 KB plus 2 KB). Visitors who never leave the page still pay for it. Same mechanism as W4's RSC prefetches, one level deeper.

### Home (638 KB)
- Same 390 KB base, plus page code 53 KB and `494` 18 KB.
- **Sigma stack, about 190 KB raw (roughly 50 KB gzipped): graphology 59, sigma 57+32+5, `events` 6, `@sigma/edge-curve` 14, `@sigma/node-border` 10.** It is the map renderer, dynamically imported inside `GraphView`'s effect (`components/GraphView.tsx:563`).
- **Phones download all of it and never show a map.** `HomeView` starts with `view = "map"`, so the first client render mounts `GraphView`, its effect starts the imports, and only then `matchMedia` flips the page to Path. Measured at 390: 638 KB, identical to desktop; no `.graph-stage` exists afterwards.

### What could change without changing behaviour
1. **Skip the Sigma imports on phones** (save about 190 KB raw, about 50 KB gzipped, on the most common visit on a phone): in `GraphView`, return early from the effect unless `matchMedia("(min-width: 768px)")` matches. Desktop path untouched. Effort S. Risk: the existing Back/Forward restore and the phone fixed-map path (the docs still describe a "fixed map" on phones; CLAUDE.md says Path only), so settle which is true first.
2. **Load `legacyQuiz.ts` on demand** (7 KB raw on every topic and posts page): it is a frozen table used once to convert old saved quiz positions. `import()` it only when old-format progress is found. Effort S. Risk low if the migration still runs before first render of the quiz.
3. **Stop prefetching the JS of `/` and the learn page from topic pages** (about 60 KB raw): `prefetch={false}` on the logo and the learn link, or prefetch on intent. Same trade-off as W4: a first click may wait. Effort S.
4. Not worth doing: Analytics (about 3 KB), ThemeToggle, the layout chunk. The home page chunk's own code (53 KB) is mostly GraphView and the layout engine, both needed for the Map.

## Appendix C. Round 2 result (13 October 2026)

Screenshots: `docs/audit/design/round2/` (local only, git-ignored). Checks after each group and at the end, on a production build: `tsc`, 402 tests (graph crossing tests included), check-seo (now also requires og:image and a large Twitter card), diagram overflow (0), Pagefind (39 pages, 4,530 words, same as before, so every glossary term is still indexed), horizontal overflow on 45 pages at 1440 and 390 in both themes (180 loads, 0).

### Part 0: Round 1 gaps
- Dark mode: focus ring is `rgb(212,104,63)` 2px on quiz options, Mark done, the answer button, footer and rail links, and the phone strip button. The strip button and the map cue read correctly on the dark paper. No bug.
- **Bug found and fixed:** between 641 and 1179px the strip's "Back to top" showed all the time (`.text-button` sets `display: inline-block` later in the file and beat `.strip-top { display: none }`), next to the floating button. Fixed; phones (390) and tablets (641, 768, 1024, 1179) re-checked.
- Reduced motion: the cue and the strip button have `transition-duration: 0s`. No bug.
- The CLAUDE.md Back to top line is 280 characters.

### Items
| Item | Result |
| --- | --- |
| B4 | Done. `public/og.png` (1200x630, wordmark and tagline on `--paper`, no gradient) and `public/apple-touch-icon.png` (180px mark), drawn by `scripts/make-og.mjs` with the site's real fonts and committed. `pageMeta` sets og:image (with size and alt) and `summary_large_image`; `theme-color` light and dark through `viewport`; one line added under SEO in CLAUDE.md. check-seo fails a page with neither. |
| B5 | Partly. The header now uses the home container (1400px): wordmark and toggle sit on the home page's edges (60 and 1380 at 1440). /posts' title is at the same x as every other long page (404 at 1440, 324 at 1280, 644 at 1920) and its rail sits where the topic rail does; its rows run on to the right. The header stays the same on every page, so the logo does not jump when you navigate; the reading pages' own edge (title and rail) is shared across About, Terms, Data, Glossary, Background, Topic, Learn and Posts. The wordmark does not share an edge with the reading column; making it do so would move the logo between pages. |
| W8 | Done. The glossary has the rail at 1180px and up and the "Contents" strip below (same component as Background), following the filter. |
| N1 | Done. Prose links (inside `p`, `dd`, `blockquote`) underline in `--ink-soft`: 6.42:1 light, 6.54:1 dark against the paper, was 1.48 and 1.43. A colour change alone cannot reach 3:1 against the surrounding ink (rust 2.46:1 light, 2.84:1 dark), so this is the quietest option that passes. Lists of links keep the faint rule. |
| N2 | Done. 28px between the strip and the H1 (was 16) on Background and Glossary at phone widths. |
| N3 | Done. `<html>` takes `suppressHydrationWarning`; the inline scripts set `data-theme` and `data-posts-view` on it before hydration on purpose. The warning is gone in dev. |
| N4 | Done. The count and Reset stay on one line at 390. |
| Bundle: map code | Done. `GraphView` returns early unless the window is 768px or wider. Production, 390px: 638 KB to 446 KB of script (decoded), no Sigma, graphology or edge chunks. Desktop unchanged at 637 KB. Resizing 390 to 1280 mounts the map (7 canvases); back to 390 removes it. |
| Bundle: legacyQuiz | **Not done, proposal below.** |
| P1 | Done. `text-wrap: pretty` on p, li, dd, blockquote; `balance` on headings and lead lines. The "own." widow in exercise 2 is gone. |
| P2 | Done. h1 -0.02em, h2 -0.015em, h3 -0.01em. |
| P3 | Done, with one skip. Every mono label that was 11px is 12px. The map's group names are 18px serif (they only carry `.label`), so they were never affected; checked after I first shrank them by mistake and put them back. |
| P4 | Done. `::selection` is `--rule` with `--ink` text: 9.8:1 light, 9.9:1 dark (rust on the tint would be 4.0 and 3.5). |
| P5 | Done. `@media print`: header, rails, strips, search, Back to top, footer and buttons hidden; ink on white (the dark theme does not print); answers open; external links print their address. Checked as a screen capture with print media and as a PDF; no paper printer. |
| P6 | Done. All 14 hover rules sit behind `(hover: hover) and (pointer: fine)`; the progress tip keeps its focus trigger outside the gate. |
| P7 | Done. Reset appears only on rows with progress (also fixes a row with a quiz answer but no section done, which could not be reset). |
| P8 | Done. The name before each "builds on" sentence is gone on the learn page and the Path rows; all 25 reasons already name their prerequisite. The topic page keeps the linked name above its sentence. |
| P9 | Done. Footer is at the bottom of the window on the 404 (it was mid-screen); Terms and Privacy are taller than a window at both sizes. |
| P10 | Done. Glossary count has 14px above it (the margin was being zeroed by `.dossier p`); /posts view links sit 4px from the filter when they wrap. |
| P11 | Done. Exercise numbers use the label's mono face at 12px, so baselines meet. |
| P13 | Done. Newsreader's served files have `tnum` (checked in the woff2 GSUB tables), so years and counts on /posts and the glossary use tabular figures. IBM Plex Mono is already tabular. |
| Not done by instruction | P12, B3(c), R2, R3, W4 prefetch changes. |

### New findings while doing this
- The map group names on the map are `font: inherit` buttons, so a change to `.label` never reaches them; `GraphView.tsx:965` sized their room for 11px mono, but they are 18px serif. The 7.5px per character estimate is untouched and still looks right; checked by eye, not by the overlap test (no new overlap in the screenshots).
- `check-seo` previously said nothing about social tags; it does now.

## Part 2: proposals (no code)

### W4: home prefetch on a throttled connection
Production build, headless Chromium, CDP throttle of 150ms RTT and about 4 Mbps down (my choice of "4G"), transfer sizes as served (gzip), 8s idle after load.

| | Total transferred | Prefetch requests | Prefetch bytes |
| --- | --- | --- | --- |
| Desktop 1440, prefetch on | 814 KB | 19 | 301 KB (15.8 KB each, about 320ms each) |
| Desktop 1440, prefetch off | 508 KB | 0 | 0 |
| Phone 390, prefetch on | 527 KB | 5 | 65 KB (13.1 KB each) |
| Phone 390, prefetch off | 456 KB | 0 | 0 |

- Prefetch is 37% of everything the desktop home downloads, and 12% on a phone.
- Cost of removing it, measured on the phone Path view: a tap that finds nothing prefetched takes 979ms to show the new heading, against 66ms with the prefetch. Desktop clicks showed no difference (372 vs 370ms), but the map's 530ms open animation hides the wait there by design, so I do not trust that number as a general result.
- Proposal: **desktop map, prefetch on pointer-enter or focus only** (`prefetch={false}` plus `router.prefetch(href)` on `pointerenter` and `focus`): saves about 300 KB per home visit; a hover usually lasts longer than the 320ms a fetch takes here, and the node-open animation covers the rest. **Phones keep viewport prefetch**: only 5 links and 65 KB, and without it a tap waits about a second on 4G. The logo and "Start from zero" links on topic pages also prefetch JS (about 60 KB raw, from Appendix B); `prefetch={false}` on those two is free because the reader is already on the page and rarely follows either.
- Not measured: a real phone on a real network, and what a mouse user's hover time actually is.

### B3(c): fitting the whole map into the window with labels at full size
Measured on the live map (18px labels, 8 columns): widest label per column is 75, 157, 62, 146, 194, 270, 135 and 196px.

- Needed width today: sum of the widest labels 1,235px, plus fixed overhead per column of 52px (label start 22, minimum gap 16, node radius 14) for 7 gaps and 22 for the last, which is 386px: 1,621px, plus 96px of stage padding gives the 1,717px stage.
- Windows: 1,200px at 1280, 1,320px at 1440 and at 1920 (the home column stops at 1,400px minus 80). Note a 1,320px window does not exist at 1280.
- **It does not fit at any of the three with full-size labels.** The label text alone (1,235px) is wider than the room left in a 1,320px window (1,224px after padding), so shrinking the gaps to zero would still not be enough. Shrinking the pitch is not the lever; the number of columns is.
- What would fit: labels at 0.68 scale (about 12px) fit 1,440 and 1,920 exactly, and 1,280 would need 0.58 (10.5px, too small). The code floor is `MIN_LABEL_SCALE = 0.8`, which needs a 1,470px stage: still more than 1,320. Widening the home container instead (full labels) needs a window of 1,717px, so a viewport of about 1,800px: it would fit at 1920 only.
- What breaks if labels shrink to 0.68: the 12px floor in P3 is the same size as the mono labels, so map labels would read as small as legends; zero-crossing and overlap tests would need re-running at three widths.
- Smallest rule change if you want it: allow labels to shrink to a stated floor (12px, scale 0.67) before the map scrolls sideways. Edit `MIN_LABEL_SCALE` in `lib/graph.ts` (0.8 to 0.67), `docs/graph.md` line 6 (the "labels at full size, never shrunk" sentence) and the matching sentence in README item 1. CLAUDE.md's Graph section does not state the rule, so it needs no edit unless you want the floor written there. At 1280 the map would still scroll sideways. I did not build a mock screenshot: the map is WebGL and a faithful mock means running the layout at a new scale.
- My recommendation: do not do it. The sideways scroll with the cue and snap from Round 1 costs nothing, and the alternative trades readable labels for no scrolling at only two of three widths.

### Bundle: `legacyQuiz.ts` (7 KB raw, loaded on every topic and posts page)
Why I stopped: `parseProgress` is synchronous and is called while the store reads localStorage on first render, from import in Your data, and from the tests. Loading the table lazily makes migration async. If a saved v2 progress is parsed before the table arrives and then written back, the old quiz answers are overwritten with nothing, which is data loss with no way back. A safe version needs: (1) `parseProgress` returns the v2 answers untouched in a side field, (2) the store dynamically imports `legacyQuiz` only when that field exists, converts, and only then saves, (3) nothing writes in between. That is a new state in the store and its tests, more than a small change. Saving 7 KB (a few KB gzipped) on a page that already carries 454 KB does not justify the risk until v2 data is rare enough to delete the table, which is the cleaner end state: drop v2 support after a stated date.

## What I could not verify in Round 2
- Real devices (touch, Safari, Firefox): `:has()`, `text-wrap`, the print layout, `scroll-snap`, `::selection` rendering and the 12px labels were checked in Chromium only.
- Printing: a PDF and a print-media screen capture, not paper.
- The social image: rendered locally; I did not run it through a real link preview (Slack, X, iMessage), which cache and may crop differently.
- B5 at widths between 1180 and 1280 beyond the 1280 and 1440 checks, and the 1920 numbers come from a headless viewport.
- The P3 change at 12px was covered by the diagram overflow check and the overflow sweep, not by looking at every page.
