# Ponytail audit

Report only. No code was changed. Run on 13 October 2026 with the `ponytail-audit` skill (plugin v5.1.0) over the whole repo at the commit after `861ac77` (working tree: CLAUDE.md, docs/ideas.md and docs/tooling.md edited for the Ponytail section, nothing else).

**What this repo does:** sys101 is a static system-design course. Next.js builds every page at build time from JSON in `content/`, Vercel serves the files, and the reader's progress lives only in their browser. A few offline scripts (`scripts/`) check the content and a weekly GitHub job checks links.
**Load I assumed:** one author editing content, and a few thousand readers loading static pages. There is no server code, no database and no user input that reaches a server, so "scale" findings do not apply. Cost of a mistake is a wrong claim on a page or a broken build, not data loss.

## Must fix

None. I found no wrong result, no security hole and no data-loss path. The two things I looked at hardest are noted at the end ("Checked and fine").

## Should fix

1. **A dead scaffold and two dependencies that only it uses** (`pipeline/fetch-rss.mjs`, `pipeline/summarize.mjs`, `package.json` lines for `@google/genai` and `rss-parser`)
   - **What it is:** 44 lines of "run by hand" scripts for an LLM pipeline that is listed under parked ideas. `summarize.mjs` builds a Gemini client, then does `void ai; void MODEL;` under a `TODO`: it does nothing.
   - **Simpler alternative:** delete `pipeline/`, the two `pipeline:*` scripts and the two dependencies (about 13 MB in `node_modules`: `@google` 11 MB, `rss-parser` 1.9 MB). The idea stays in `docs/ideas.md`. `cheerio` stays: `scripts/check-seo.mjs` uses it.
   - **Risk of changing:** low. README lines 67, 120 and 203 mention the folder and need an edit. Nothing in CI or the build calls it (checked: no reference in `.github/`, `package.json` build scripts or tests).
   - **Effort:** S.
2. **About 100 lines of CSS for things that no longer exist** (`app/globals.css`: `.start-here`, `.start-primary`, `.start-sep`, `.start-secondary` near line 217; `.inside-open` 369; `.mark-note` 1808; `.lesson-mark` 1890; `.graph-controls`, `.zoom-readout` 2082 to 2100; `.skeleton-title`, `.skeleton-line` 2157; `.bg-links` 3196)
   - **What it is:** 12 class names that appear nowhere in any component, script or JSON file (the rest of the 277 classes are used; `is-core`, `is-ready`, `is-progress` are built as `is-${state}`, so they are live). The rules that name them add up to about 117 lines (some rules also name live classes, so the true cut is a little smaller). The zoom buttons and the "start here" block were removed earlier; their styles stayed.
   - **Simpler alternative:** delete those rules. Check each with a grep for the class name first, because a few are named in docs (`docs/graph.md` mentions the zoom readout).
   - **Risk of changing:** low, but CSS is only checked by eye here: re-run the overflow sweep at 1440 and 390.
   - **Effort:** S.
3. **Two near-identical lists of about 25 selectors, for the 44px tap areas** (`app/globals.css` about 2884 to 2960)
   - **What it is:** one list gives each link `position: relative`; a second list (24 against 26 selectors, so they have already drifted by two) adds an invisible `::after` box. Add a link to one list and forget the other and the tap area is silently missing. The phone rule was last touched this week for the strip button, and it needed both lists edited.
   - **Simpler alternative:** one rule that applies to every `a` and `button` in these regions (`:is(...)`), or a shared class on the few that need it. A single `position: relative` on `a, button` inside the phone media query would also do.
   - **Risk of changing:** medium. Tap areas are tuned per component (some use `inset: -8px -4px`, some `-15px -4px`); a blanket rule could make two areas overlap. Needs the 390px tap-target check from the Round 1 audit.
   - **Effort:** M.
4. **Import and merge logic lives inside a component with no test** (`components/DataControls.tsx` lines 75 to 100: `plan()` and `apply()`)
   - **What it is:** `mergeProgress` and `parseProgress` are tested, but the code that decides what an import changes (`deriveRead`, the "topics updated, items changed" counts, which entries get ignored) sits in the component. A wrong count or a wrong "read" flag after import would not fail any test. This is the only place that can overwrite a reader's progress.
   - **Simpler alternative:** move `plan` into `lib/lessonStore.ts` or `lib/progress.ts` as a pure function and add one test with a merge and a replace case.
   - **Risk of changing:** low if moved without edits. **Effort:** S to M.
5. **The 768px phone line is written in four places** (`components/HomeView.tsx` `max-width: 767px`, `components/GraphView.tsx` `min-width: 768px`, `components/IntentLink.tsx` `max-width: 767px`, and the CSS `@media`)
   - **What it is:** three JS copies of one breakpoint, two of them added this month. If the breakpoint moves, one will be missed and the phone and desktop paths disagree (for example IntentLink would prefetch on a layout the map does not show).
   - **Simpler alternative:** one exported constant or helper in `lib/` (`isPhone()`), used by the three. CSS stays CSS.
   - **Risk of changing:** low. **Effort:** S.
6. **Two colour tables for the light and dark themes, and the dark one is written twice** (`app/globals.css` lines 1 to 50: `:root`, `:root[data-theme="dark"]`, and the `prefers-color-scheme: dark` block)
   - **What it is:** eight tokens, each dark value typed in two blocks that must match. The platform now does this with `color-scheme` and `light-dark()`: `--paper: light-dark(#f3ecdc, #1a1713)` and one switch for the chosen theme.
   - **Simpler alternative:** one block of `light-dark()` values plus `:root { color-scheme: light dark }` and `[data-theme="light"|"dark"]` setting `color-scheme`. Removes about 20 lines and the chance of the two dark blocks drifting.
   - **Risk of changing:** medium. `light-dark()` needs Chrome 123, Safari 17.5, Firefox 120 (2024); an older browser would lose every colour. The map reads the tokens at runtime with `getComputedStyle`, which still works, but needs a retest of the theme toggle, the print override I added, and the no-flash script.
   - **Effort:** M.
7. **`GraphView.tsx` does about eight jobs in 1,174 lines** (`components/GraphView.tsx`)
   - **What it is:** renderer setup, layout, camera and keyboard zoom, hover and group highlighting, the invisible accessible links, tooltips, the sideways-scroll cue and snap marks, view restore after Back, and the node-open animation hand-off. It is the only large file that has no test (the pure parts in `lib/graph.ts`, `camera.ts`, `graphUi.ts` do). Two `react-hooks/exhaustive-deps` warnings are in it.
   - **Simpler alternative:** split by job, not by line count: the DOM overlay (accessible links, tooltip, group labels, scroll cue) from the Sigma renderer. Do it only when you next touch the map; do not do it as its own task.
   - **Risk of changing:** high. The map has hand-tuned behaviour (layout, zero crossings, snap, the 530 ms open) and checks that need a browser. **Effort:** L.

## Nice to have

8. **36 `export` keywords nothing imports** (for example `lib/lessonStore.ts` `VERSION`, `POST_ID_ALIASES`, `hasTracked`; `lib/topics.ts` `isOwnClaim`, `OLD_POST_YEARS`, `REQUIRE_NEW_FIELDS`; `lib/posts.ts` `slugify`; `lib/camera.ts` `zoomTo`). All are used inside their own file; the `export` is noise. Another 48 exports are used only by tests, which is fine. Remove the 36 `export`s. Risk: none (tsc catches a mistake). Effort: S.
9. **Two truly dead exports and one duplicate constant** (`lib/quizIds.ts:16` `optionIds` is never called; `lib/lessonStore.ts:8` `READ_KEY = "sys101:read"` is never used, and `lib/progress.ts:18` repeats the same string as `KEY`). Delete `optionIds` and `READ_KEY`, or have `progress.ts` import the one constant. Risk: low (the key is the stored-data name, so test that it is unchanged). Effort: S.
10. **The brand mark is drawn four times** (`components/Logo.tsx` `LogoMark`, `public/icon.svg`, `public/logo.svg`, `scripts/make-og.mjs` `MARK`). `public/logo.svg` is referenced nowhere in the repo (grep: no hit outside docs): delete it unless you use it outside. The others each serve a different output and are fine. Risk: none if nothing outside links it (the file is on the live site at `/logo.svg`; check before deleting). Effort: S.
11. **Three hand-written type stubs** (`scripts/news-guard.d.mts`, `news-rules.d.mts`, `news-verify-rules.d.mts`) exist only so the tests can import the `.mjs` scripts under TypeScript. Replace with `// @ts-check` and JSDoc or `allowJs`; one fewer file per script and the types cannot drift. Risk: low. Effort: S.
12. **17 lint warnings on every build** (unused variables such as `_removed` in `lib/lessonStore.ts:244` and `_s`, `_r` in `lib/topics.ts:388`; `a && b()` used as a statement in `lib/graphUi.ts:93`, `lib/nextUp.ts:11`, `lib/progress.ts:89`; two `exhaustive-deps` in `GraphView.tsx` near 806 and 890). Fix or silence on purpose (`void` and an `if`) so a new warning stands out. Risk: the `exhaustive-deps` ones are real choices in the map; do not auto-fix. Effort: S.
13. **`@types/node` is `^26` but the project runs Node 24** (`package.json`, `.nvmrc`). The types allow Node 25 and 26 APIs that would fail on Vercel. Pin to `^24`. Risk: none. Effort: S.
14. **Two scroll listeners for one "show Back to top" decision** (`components/BackToTop.tsx`: the floating button and the strip button each call `useShowBackToTop`, so a phone topic page runs two scroll and two resize listeners). Harmless at this size; share one if a third caller appears. Effort: S.
15. **Frozen 327-line table loaded on every topic and posts page** (`lib/legacyQuiz.ts`, about 7 KB): already proposed in the Round 2 audit (lazy loading is unsafe; the clean fix is to drop v2 progress support after a set date). Not repeated here.

I left out smaller items; none worth a number.

## Checked and fine

- **Dependencies:** `cheerio`, `playwright`, `@vercel/analytics`, `next`, `react`, `sigma`, `graphology` and both `@sigma/*` plugins are used. `yaml` (dev) is used by `lib/workflows.test.ts`. `eslint`, `eslint-config-next` and `@eslint/eslintrc` look unused to a scanner but Next runs them in `next build` and `eslint.config.mjs` imports `@eslint/eslintrc`.
- **Reimplemented platform features:** I looked for them and found none worth changing. The custom bezier in `lib/motion.ts` drives the Sigma camera, which the platform cannot animate; the custom search UI sits on Pagefind's JSON API on purpose; the local-storage store is `useSyncExternalStore`-shaped and needed for cross-tab sync.
- **Injected HTML:** `dangerouslySetInnerHTML` is used for SVG diagrams (own content, checked by the build for scripts and gradients), JSON-LD (`<` is escaped in `components/JsonLd.tsx`), two inline scripts, and `components/Search.tsx:167` for Pagefind excerpts. The excerpts come from this site's own index, so they are safe as long as Pagefind keeps escaping page text; I did not read Pagefind's source to confirm that it does.
- **Secrets:** none in the repo (`GEMINI_API_KEY` is read from the environment in the dead pipeline stub only). The reporting address is public on purpose.
- **Workflows:** `.github/workflows/news-pr.yml` uses `pull_request_target` with the pull request's files treated as data only and read-only permissions by default; its header explains why. I read its design comment and permissions, not every step.
- **Ponytail itself (the plugin I was asked to install):** already installed at user level, version 5.1.0. See "Install check" below.

## Verdict

Healthy. Fix first: findings 1 and 2 (delete the dead pipeline and the dead CSS: about 160 lines and two dependencies, almost no risk), then 4 (test the import plan), then 5 (one breakpoint).

**Lean: about -160 lines, -2 dependencies possible** (finding 1 about 44 lines plus two dependencies, finding 2 about 100 lines, findings 8 to 13 a few more); findings 3 and 6 could save about 100 more at medium risk.

**Not checked:** I did not read every content JSON or the topic text (this is a code audit, not a content one); `scripts/verify-*.mjs` and `scripts/check-links.mjs` internals; the 1,174 lines of `GraphView.tsx` beyond the parts I touched this month; Vercel project settings; the pagefind index contents; browsers other than headless Chromium. Dead-CSS and dead-export findings come from a name search over `app`, `components`, `lib`, `scripts`, `content` and `public` plus `knip`, which does not know about the Vitest setup; I checked each export it called unused by hand. I did not run any of the proposed changes.

## Install check (task 1)

- **How it is installed:** as a Claude Code plugin, user scope, `ponytail@ponytail` v5.1.0 (git sha `9b58c1f`), from the marketplace `DietrichGebert/ponytail`. It is enabled in `~/.claude/settings.json`. Nothing was installed or changed in the repo for it; the six skills (`ponytail`, `-review`, `-audit`, `-debt`, `-gain`, `-help`) are already available.
- **Hooks:** three, from `hooks/claude-codex-hooks.json`, each a short Node script with a 5 second timeout: `SessionStart` (on startup, resume, clear and compact) injects the ruleset and a short map of the repo's folders and exported names, built from `git ls-files` with each tracked file read up to 64 KB for names only; `UserPromptSubmit` watches your prompts for `/ponytail`, "stop ponytail" and "normal mode" and re-injects the rules; `SubagentStart` injects the rules into subagents.
- **Network:** none. I searched the hooks and scripts for `http`, `fetch`, `net` and `socket` and found only a homepage URL string in a build script.
- **Writes outside the repo:** yes, small and in your home folder: a mode flag under `~/.claude` (one file per project, named by a hash of the project path); `~/.config/ponytail/` only if you set a default level; a copy of its statusline script into `~/.claude` and a `.ponytail-statusline-nudged` marker. It also prints a one-time offer asking the agent to suggest editing `~/.claude/settings.json` to add a statusline; it does not edit that file itself. `scripts/uninstall.js` removes all of these.
- **Secrets:** it does not read `.env` files or credentials. It reads tracked source files only for the map (git-ignored files such as `.env*` are not listed by `git ls-files`), and it reads your prompts only to match the on/off commands.
- **Nothing unsafe found.** One note: the hook text injected at session start is third-party instructions in your context; I read it and it matches `skills/ponytail/SKILL.md` and `AGENTS.md`.
