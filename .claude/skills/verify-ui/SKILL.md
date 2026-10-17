---
name: verify-ui
description: Verify a sys101 UI change by rendering it at 1440px and 390px, light and dark, and running the overflow, tooltip, split-label, broken-image and layout-shift checks. Use after changing any page, component or style, and before calling UI work done.
---

# Verify the UI

A feature is not done until it works on a phone and a laptop. Read `.claude/rules/accessibility-and-chrome.md` for the bar.

1. **Run the dev server** (leave it up on :3000; never `npm run build` over it: use `NEXT_DIST_DIR`). Use Playwright from `node_modules` for screenshots; temporary scripts go in the job's tmp directory, not the repo.
2. **Look at it.** Render the changed pages at 1440x900 and 390x844, light and dark (`colorScheme`). Read the screenshots; check it reads as part of the whole: mono small-caps labels, generous whitespace, state shown by shape not colour alone, no text or controls running together, readable wrapping.
3. **Run the automated check:** `npm run check:ui` (all sitemap pages x 1440 and 390 x light and dark): sideways scroll, hover-tooltip sources, short labels split over lines, broken company marks, layout shift. Fix what it reports. Add a case to `scripts/ui-audit.mjs` when a new class of bug shows up.
4. **Specific checks by area:**
   - Homepage: the map's top edge is visible at 1440x800 and 390x844; the right edges (pitch, search underline, Map/Path, Fit to size) line up; the start button reads for a first visit, with one started topic, with several, and when everything is read (seed `localStorage` keys `sys101:read`, `sys101:progress`, `sys101:updated`).
   - Map: after adding or moving anything, zero crossings and overlaps at 1280 and 1440 (a phone has no map, only the Path view); the group row above the map shows each group with its count, and clicking one highlights only that group.
   - Tours: `npm run check:tour`; no jumps (page, outline and tooltip share one eased clock).
   - Toggles: every "Mark done" style control undoes on a second click.
   - Touch: taps are 44px (pseudo-element areas count), phone wording names no key.
5. **Report** what you looked at and what you did not (Safari, a real phone).
