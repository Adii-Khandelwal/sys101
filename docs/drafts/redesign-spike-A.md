# Redesign spike A: SVG map with elbow edges instead of Sigma

Date 28 Oct 2026. Throwaway prototype in the worktree `/private/tmp/claude-501/-Users-aditya-k-Projects-sys101/245d35c4-95d6-4bd0-9cf7-268588a7ae7e/scratchpad/spikeA/spike/` (not shipped, nothing in the main tree except this file). Gate list: `docs/redesign-plan.md` 7.1.

## Result: SVG renderer is feasible. Recommend option (2), with two design changes the plan must accept (labels move below the station, router needs indexing).

## Gates

| Gate | Result | Evidence |
| - | - | - |
| Zero edge/label/node crossings at 1280 and 1440, every topic | PASS (one design change) | Existing layout (`chooseLayers` order and `fitPositions` positions, unchanged). Elbow router with 9px chamfers, audited by segment tests. Full 35 topics at 1280 and 1440: node hits 0, label hits 0, edge-edge 0, label-node 0, label-label 0, off-stage 0. Also 33 growing prefixes (3 to 35 topics, by depth) at both widths: 0 failures. Label widths x0.9, x1, x1.1, x1.25: still 0 (`spike/sens.mjs`). Labels centred under the station FAIL (1 label-label overlap, 1 label-edge hit from 16 topics up); labels left-aligned under the station PASS. Labels to the right of the station (today) FAIL by construction: 52 edge-label hits, because an elbow leaves the station horizontally through its own label. |
| Smooth at 150 nodes (synthetic) | PASS for drawing, FAIL for routing speed and legibility | 150 nodes, 202 edges, 979 DOM nodes. Pan and zoom frames: p50 16.7ms, p95 16.8ms at 1x and at 4x CPU throttle (rAF intervals); camera apply costs 0.04ms per call at 4x. Hover highlight the same. BUT routing 150 nodes takes 1.1s (2.2s before a bounding-box prefilter), against 0.09s for the 35 real topics: the router needs a spatial index, a worker, or a memo like `chooseLayers`. And the 15-row synthetic layout has 43px row pitch, so below-labels hit the row under them (140 label-node hits): the layout's 700px height cap is the limit, not the renderer. Random synthetic wiring also forces 192 edge crossings; no renderer fixes that. |
| Zoom/pan parity (`lib/camera.ts`) | PASS | `camera.ts` has no Sigma code (comments only). Used unchanged through a 20-line adapter (framed unit = max stage side, SVG `translate scale`). Measured: anchor stays fixed on zoom, limits 0.6x to 8x exact, `+` twice gives 2.25x, `0` returns to 1x and `isFitted`, drag pan through `clampPan` with the 64px margin, Ctrl/Cmd+wheel zoom. Hit buttons track node centres to 0.0002px. Not built: pinch, double-click, "Fit to size" easing (same math, plain pointer events). |
| Keyboard traversal and aria-live | PASS | 35 `<a>` tab stops in column order; arrows move to next/previous prerequisite and up/down in column; live region text on focus e.g. "Indexing and Search. Builds on Databases, Sharding and Partitioning." Focusing an off-screen node scrolls the wrapper natively (scrollLeft 0 to 1159 for Failover). Focus ring visible (UA ring in screenshots; needs the site's ring style). Real DOM links also give middle-click and Ctrl-click for free. |
| Back keeps the view | PASS | `lib/mapView.ts` is storage only. Saved camera and scrollLeft 900, `pushState` then `history.back()`, `takeMapView()` returned the saved view once and null the second time; without a popstate it returns null (starts fitted). |
| Scroll-snap | PASS | Same CSS (`scroll-snap-type: x proximity`, 1px `scroll-snap-align: end` marks) on the wrapper. At both widths the stage is 2617px wide (the 35 topics need it; the map already scrolls sideways today), wheel 437px settled on a mark (276 at 1440, 396 at 1280). The "Scroll sideways" cue is plain DOM. |
| 44px hit areas | PASS | 44x44 `<a>` in a screen-space layer (not scaled with the camera): min side 44, 0 overlaps at fit and at 0.6x zoom. Cost: one `transform` write per node per camera change (150 nodes measured above). |

## What I measured, and how

- Layout: `chooseLayers`, `fitPositions`, `slotsByEdge`, `transitiveReduction`, `layers` from `lib/graph.ts` bundled with esbuild and run in headless Chromium with real `measureText`. Existing layout cost 0.43s once (it is cached today).
- Router: per edge, horizontal exit, 45-degree chamfer of 9px, vertical jog, chamfer, horizontal entry (the prototype's `mk`), long edges pass through the reserved slots. Jog x chosen from a 4px grid by a greedy cost (node, label, edge, stage), three passes. Edges sharing an endpoint may overlap on the trunk (metro style); anything else counts as a crossing.
- Screenshots (1440x700): `spike/shots/atlas-light-left.png`, `atlas-light-right.png`, `atlas-dark-focus.png`, `now-light-left.png`, `now-dark-left.png`, `atlas-light-focus.png`, `atlas-dark-left.png`, `now-*-focus.png`, `synthetic150.png`, all under the spikeA path above. They show the current tokens and the Atlas blue/orange tokens; a highlighted route in the second ink works with plain CSS variables, so a theme switch needs no repaint.

## Not checked or not proven

- Site fonts: Georgia 500 18px stood in for Newsreader (8.9px per character average against the test's 9.2 estimate); the x0.9 to x1.25 sweep covers the difference.
- Layout was NOT re-optimised for elbows; `chooseLayers` scores curves, yet the result was clean anyway. If a future topic breaks it, the same permutation search can score the router (cost is the router time, about 0.1s per try at 35 nodes, so the search would need pruning).
- The 1280 and 1440 widths give the same layout because both overflow into the sideways scroll. The 1280 "page scroll vs map pan" conflict test was not run; no touch or pinch, Safari, real phone, tooltip timings (300ms, 150ms) or the node-open bubble were run. `nodeOpen.ts` has no Sigma code and only needs each node's screen rect (the hit link's rect works).
- Bundle size: the 190KB Sigma + graphology saving is from the plan, not measured here.
- Focus ring, group buttons, legend, reduced-motion and forced-colors handling are not prototyped.
- Existing tests: `lib/graph.test.ts` crossing tests sample quadratic curves; they need an elbow equivalent (segment tests are in the spike: `spike/main.ts`).

## Design changes the plan has to accept

1. Labels sit under the station, left-aligned with the station's left edge (`x - 14`), not to its right. Today's right-hand label is incompatible with horizontal-exit elbows. The existing column gaps (widest label + 16) are enough for left-aligned labels; centred labels need larger gaps. Row pitch must stay at least ~60px (label 22px + node 28px + clearance); the 120px per row used today is fine.
2. Edges that share a station overlap on a trunk (visible at Databases, Consistent Hashing, Sharding). That is the metro look, but the old rule "no edge crosses another" becomes "no crossing, shared trunks allowed".
3. The router needs an index or caching to stay under about 100ms past ~60 nodes (1.1s at 150).

## Recommendation

Replace Sigma with the SVG renderer (plan option 2). Every gate item passes at 35 topics. The 150-node limits are routing speed (fixable) and row pitch (a layout limit that Sigma has too).

## Effort (one engineer, with checks)

- 4a, SVG renderer at parity on the existing layout: about 2 days (renderer, hit layer, theme vars, skeleton, tests for the router and the new audit; the spike code is about 300 lines to harden).
- 4b, metro styling: about 1.5 days (station markers for read, in progress, ready; group buttons; legend; overprint, forced-colors).
- 4c, camera, node-open, back-keeps-view, scroll-snap and cue, tooltips, keyboard, plain index, check:ui map checks, 1280/1440 test: about 3 days.
- Total about 6.5 days, plus a router index (about 0.5 day) if 150 nodes is a real target.
