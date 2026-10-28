# Redesign decisions: Phase 0 results and open register items

Date: 28 Oct 2026. Evidence: `docs/drafts/redesign-spike-A.md` to `-D.md` (reviewer PASS on the checkable claims; runtime measurements not re-run). Nothing here is built. Phase 1 starts only after the owner answers the items under "Owner must answer".

## Spike results

| Spike | Result | One line |
| - | - | - |
| A. SVG map | PASS, with two design changes | 0 crossings for all 35 topics at 1280 and 1440; camera, keyboard, back-keeps-view, scroll-snap, 44px hits pass. About 6.5 days for Phase 4; +0.5 day for a router index only if 150 nodes is a real target |
| B. Fonts | Not clear: LCP risk | Mobile LCP (throttled) 732 to 856 ms home and 844 to 960 ms topic (+15%); CLS 0; fonts 292 KB to 96 KB. Desktop unmeasured |
| C. Theme reveal | PASS | 560 ms circle from the click, header and map correct, keyboard / no-API / reduced motion fall back as planned. Not tested: Safari, Firefox, phone, `skipRunningTransition` hand-off, Splash guard |
| D. Contrast | Five pairings fail | See below |

## Owner must answer

1. **Map (spike A).** Accept labels under the station, left-aligned, and shared trunks where edges meet (the metro look)? Recommend yes; today's right-hand labels cannot work with elbows (52 hits). If no, fall back to restyling Sigma.
2. **Fonts (spike B).** Mobile LCP is about 120 ms worse, against "LCP not worse than today". Recommend: try fewer preloads (Text 400 and Display only), another `display` value and dropping weight 700 at the start of Phase 1, and accept if the gap closes to within noise; otherwise keep Newsreader for body text and use Caslon Display for headings only.
3. **Font weights.** Caslon has no 500 or 600 (10 and 3 rules today). Recommend: map 500 to 400 and 600 to 700, and check each by eye.
4. **Italics.** Libre Caslon Display has no italic; italic text comes from Libre Caslon Text. Recommend accept; keep `--font-serif-italic` as the name so `lib/fonts.test.ts` and the italic rule stay.
5. **Reversed-out title bar.** Orange on blue ink or ink on orange is 2.15 (light) and 2.14 (dark). Recommend the bar is ink with paper text (10.2 and 14.2) and the line badge is a paper-coloured square with ink text; orange appears only as a rule or ring beside it, never as bar text.
6. **Orange buttons.** Paper text on light orange is 3.05 (large text only), literal white fails in dark (2.73). Recommend: the one filled start button is ink-filled with paper text in both themes; orange is for rings and rules.
7. **Raised surfaces in light.** Muted `#55608F` and accent `#B33414` fall to 4.23 and 4.27 on a 6% tint. Recommend the tint is 4% (re-measure in Phase 1), or text on a tint uses full ink.
8. **Theme reveal token.** Add `--dur-reveal: 560ms` / `DURATION.reveal` and the written `clip-path` exception in `motion.md` (draft text in spike C). Recommend yes.
9. **Branch strategy (register 20).** Already in use (`claude/redesign-atlas`); confirm or tell me to switch.

## Register items from the plan (section 6), all still as recommended there

Items 1 to 14 and 17 to 22 stand as written in `docs/redesign-plan.md`. Item 15 (progress markers) needs a read of `lib/progress.ts` and `LessonTrackers` in Phase 1 or 3. Items 11 and 16 are Phase 7 only.

## Added by Phase 0

- **Token gaps in the plan's section 3.** `--highlight` uses `color-mix()` and so fails `readThemeColors` (needs a hex). Also map: `--fig-top`, `--fig-front`, `--fig-right` (flipped in dark), the print block (literal `#fff`), the `prefers-contrast: more` overrides and `--header-h`. The dark values are duplicated in the `data-theme` and `prefers-color-scheme` blocks, so edit both.
- **Font-coupled files:** `app/layout.tsx`, `lib/fonts.test.ts`, `app/globals.css` (20 serif, 32 mono, 10 italic rules), `scripts/check-diagram-overflow.mjs`, `scripts/make-og.mjs`, `accessibility-and-chrome.md`, `offline.md` plus `check:offline`.
- **Not verified in Phase 0:** Safari, Firefox, a real phone, Lighthouse, tooltip timings, the node-open bubble, pinch zoom, the 1280 page-scroll versus pan conflict, the 190 KB bundle saving, the site font on the map spike (Georgia stood in).

## Owner answers (28 Oct 2026)

"All as recommended": items 1 to 9 above and register items 1 to 22 stand as recommended.
