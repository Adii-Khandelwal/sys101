# Phase 0 spike C: theme reveal (result: PASS)

Patch: `docs/drafts/redesign-spike-C.patch` (5 files: ThemeToggle, ViewTransitions, globals.css, lib/motion.ts, lib/motion.test.ts). Tested in a throwaway worktree with headless Chromium (Playwright 1248, 1440x900), dev server on :3412. `npx tsc` and `lib/motion.test.ts` pass.

## Results
| Item | Result | Evidence |
| - | - | - |
| Same-document view transition around `ThemeToggle.choose` | PASS | pointer click: `::view-transition-new(root)` animation `theme-reveal`, 560ms, flag on for about 560ms then removed; theme ends `dark`, no leftover animations |
| Circle grows from pointer, clip-path on new(root) | PASS | slowed to 2% playback via CDP, screenshot shows a dark circle centred top-right (the toggle) with the old cream page outside |
| Header does not cross-fade outside circle | PASS | `.site-header` gets `view-transition-name: none` under the flag; header is part of the root picture, cream outside the circle, dark inside; no `site-header` group animation listed |
| Map shows new colours in the new snapshot | PASS | Sigma canvas inside the circle has light labels and grey edges on dark; outside still dark-on-cream. The existing MutationObserver in GraphView runs as a microtask inside the callback and Sigma redrew before capture, so no explicit `refresh()` was needed (7.4 said to call it; not needed here, but harmless to add if Sigma stays) |
| No flash | PASS | no intermediate frame with mixed state in the slowed shots; the icon is the moon after (flushSync) |
| Keyboard path instant | PASS | Enter on the focused button: theme changed synchronously, `data-theme-reveal` never set, no view-transition animations |
| React icon in new snapshot | PASS | flushSync of `setTheme` inside the callback |
| ViewTransitions interplay | PASS by construction, not clicked | `runThemeReveal` returns false (instant swap) if a navigation or reveal is running; the reveal is stored in `running`, so `skipRunningTransition()` ends it. Not exercised in a browser: a navigation started during a reveal skips it, and the flag is removed on `finished` (a tick later) |
| Splash | PASS by guard, not exercised (automation skips the Splash) | returns false while `data-splash` is on `<html>` (the backdrop covers the toggle anyway) |
| Reduced motion | PASS | flag not set; existing root rules play: `vt-in` 80ms (`--dur-fast` is `--dur-reduced`), `vt-out` 0ms |
| No API | PASS | `document.startViewTransition = undefined`: theme swapped instantly, no flag |

Notes: the UA adds a 250ms `view-transition-group(root)` animation (size only, invisible here). `theme-color` updates after the reveal as the plan accepts. The worktree's tsconfig was touched by Next dev and is left out of the patch. Not checked: Safari and Firefox (Firefox has same-document transitions since 144, unverified here), a real phone, a touch tap (`detail` is 1 on a tap, so it reveals from the tap point), the 390px layout, light-to-dark only was filmed (dark to light uses the same path).

## New token
- `lib/motion.ts`: `DURATION.reveal = 560` (comment: theme reveal, the circle growing from the click).
- `app/globals.css` `:root`: `--dur-reveal: 560ms;`. `lib/motion.test.ts` gets `expect(token("dur-reveal")).toBe(`${DURATION.reveal}ms`)` (in the patch). Not needed in the reduced block: the reveal never runs under reduced motion.

## motion.md text (replace the "no ... staggered" exceptions sentence by adding after the `.reveal` exception)
> Second named exception, the theme reveal (components/ThemeToggle.tsx, `runThemeReveal` in components/ViewTransitions.tsx): a pointer click on the theme toggle runs a same-document View Transition in which the new theme's picture is revealed by a `clip-path: circle()` growing from the click point to the farthest corner over `--dur-reveal` (560ms, ease-out). While it runs, `<html>` carries `data-theme-reveal`, which turns off the root cross-fade rules and the header's `view-transition-name`, so nothing fades outside the circle. A keyboard activation, a browser without the API, a running navigation transition or reveal, and the opening screen all swap the theme instantly. Under reduced motion there is no circle: the theme swaps with the 80ms `--dur-reduced` root fade. React state is updated with `flushSync` inside the transition callback. The tokens line in Standing rules gains `--dur-reveal` 560ms.
