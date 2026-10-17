# Cleanup audit, 17 Oct 2026

Phase 1 audit; the applied changes are listed in section G. Branch `cleanup-2026-10-17` (from origin/main fbff1ca). Tools: knip, depcheck, madge, `tsc --noUnusedLocals`, ts-prune, plus repo-wide `grep -rnw`. Every deletion/unexport below was re-checked independently by a reviewer agent. There is no database; the nearest equivalents are `content/*.json` read by the `lib/*` loaders at build time and localStorage on the client.

Evidence rule: HIGH = a tool and an independent repo-wide grep (name, path, string, dynamic forms, scripts, tests, `.claude`, `.github`, docs) agree. Everything else is for your decision.

## A. HIGH confidence, safe to do after "go"

### Batch 1: remove `export` from symbols used only in their own file (UNEXPORT)
Behaviour-neutral, type-checked by tsc. ~12 lines changed, 0 bundle change.
| Symbol | Where | Evidence |
| - | - | - |
| anchorTop, glideTo | lib/glide.ts:4,15 | knip + ts-prune; grep: 2 hits, both in glide.ts (line 52) |
| units | lib/lessonStore.ts:159 | knip; only lessonStore.ts:172,179 |
| sourceCounts | lib/posts.ts:40 | knip; only posts.ts:90 (name also in a comment in scripts/readme-stats.mjs:6 and homepage.md:36; text stays true) |
| types CapstoneSource, Reading, Stage, ReadTheme, ReadRow, Digest, Lesson, Summary | lib/capstones.ts:9, learn.ts:38,40, reads.ts:13,99, topics.ts:8,95,116 | knip; each referenced only in its defining file |

### Batch 2: duplicate constants (CONSOLIDATE)
- `NODE_RADIUS = 14` is defined in lib/graph.ts:311 (exported, no importer) and again in components/GraphView.tsx:55. Import the one from lib/graph, delete the local copy. Removes a drift risk between label spacing and drawn size. Confirm: `npx tsc --noEmit && npm test -- graph`.
- `FADED_LABEL = INK_SOFT` (lib/graphUi.ts:13) is used only by lib/graphUi.test.ts:4,42. Use INK_SOFT in the test, delete the alias.
- `quizPositions.test.ts:40` unused parameter `o` (tsc-unused): rename to `_`.

### Batch 3: unused symbol (DELETE), one line
- `NODE_STATES` lib/capstones.ts:12. Zero references anywhere (grep -w = definition only). The type `NodeState` next to it stays.

## B. Needs your decision (not touched)

| ID | Item | Why | Confidence | Note |
| - | - | - | - | - |
| B1 | `zoomLevel` (lib/camera.ts:40), `optionIds` (lib/quizIds.ts:16) | Zero callers, confirmed. docs/ideas.md:152 says they are "kept available" on purpose | HIGH unused | ~6 lines; docs/ideas.md:152 needs an edit if removed |
| B2 | `verify:landmarks` npm script | Identical to `verify:reads`; named as an alias in .claude/rules/reads.md:28 and tooling.md:19 (protected) | HIGH duplicate | 1 line plus 2 rule edits |
| B3 | `REPORT_EMAIL = CONTACT_EMAIL` (lib/site.ts) | Alias; used in ReportMistake.tsx and named in accessibility-and-chrome.md:17, homepage.md:38 | MEDIUM | Needs a rule edit |
| B4 | public/logo.svg | No reference in app, lib, scripts, config (only docs/audit/ponytail.md). Still served at /logo.svg, so external links are unknown | MEDIUM | 1 small file; protected asset |
| B5 | docs/graph.png (88 KB) | 0 references anywhere | MEDIUM | DONE: deleted in commit "Delete docs/graph.png" |
| B6 | Figure geometry exports not read by anything: LATCH, PADLOCK (commitLatch); CARRIAGE, STATIC_BACK, CARRIAGE_INVAL, CARRIAGE_FILL, PAWL_UP, PAWL_DOWN, STATIC_FRONT, CACHE_TOKEN (fillRace) | knip flags them; scripts/audit-figures.mjs does not read them (it reads PROJECTION, auditShapes, FILL_AT, INVAL_AT, STATIC, FRAME_*, GAUGE_WORLD, BEAD_WORLD, currentBeadX, CUR_LANES). Used inside geometry.ts? Not checked | MEDIUM | Unexport only; the external anatomy kit was not checked |
| B7 | lib/legacyQuiz.ts (327 lines) plus the v1/v2 saved-progress migrations in lessonStore.ts and progress.ts | Live code (lessonStore.ts:4,59), not dead. Removing it drops old saved answers | HIGH it is used | ~370 lines. Product call |
| B8 | `QUIZ_STYLE_PENDING = []` (lib/topics.ts:288) and its test branch | Empty allowlist; topic-pages.md names it | MEDIUM | Needs a rule edit |
| B9 | `SHOW_INTERVIEW_TAGS = false` | Deliberately hidden feature, data kept | HIGH not dead | Keep unless you retire interview tags |
| B10 | pipeline/ (fetch-rss, summarize) plus deps @google/genai, rss-parser, 2 npm scripts | Only package.json calls them; no doc, workflow or hook does. Not shown to be dead (manual use) | MEDIUM | Removes 2 files, 2 deps, a large dependency tree |
| B11 | AGENTS.md is both gitignored and tracked | The ignore line is a no-op | HIGH | Untrack or drop the ignore line |
| B12 | docs/audit/ (20 tracked files), docs/drafts, docs/tasks | Working records, listed only | n/a | |
| B13 | reports/ and research_notes/ | Untracked, excluded in .git/info/exclude; a fresh clone lacks them | HIGH | Local only |

## C. Found, but it is a bug or debt rather than dead code

1. **`npm run audit:figures` is broken.** scripts/audit-figures.mjs:9 imports `esbuild`, which is not in package.json and not installed (vitest 5 uses rolldown). figures.md:26 says esbuild comes with vitest; that is stale. Fix options: add esbuild as a devDependency, or bundle another way. This matters because CLAUDE.md names the script. Adding a dependency is outside this task's rules, so it is your call.
2. **eslint-config-next is ^15.5.27 while next is ^16.4.1.** knip and depcheck call it unused, but eslint.config.mjs:7 loads it by string; do not remove. Bumping to ^16 is an upgrade, so not done here.
3. **Circular imports (madge):** lib/figures.ts with commitLatch.ts, fillRace.ts, slidingWindow.ts. They are `import type` only, erased at build, so no runtime cycle. A small lib/figureTypes.ts would silence madge. Low value.
4. **Redundant work at build time.** `getAllTopics()` (and getAllLearn, getAllReads, getAllCapstones, getAllBackground) re-read and re-validate all content JSON on every call: about 20 call sites for topics (1.6 MB), so each statically rendered page repeats it. A module-level cache gated on `NODE_ENV === "production"` would fix it; saving is not measured yet (I will time the build before and after). The five loaders also repeat the same readdir/parse/sort block (lib/topics.ts:169, learn.ts:169, reads.ts:92, capstones.ts:185, background.ts:120); a shared `readJsonDir` would save ~25 lines. These are SIMPLIFY/CONSOLIDATE, a separate commit from deletions, and I recommend doing them last.
5. **Scripts duplication (MEDIUM, not measured line by line):** chromium launch boilerplate in 5 scripts; fetch, Wayback and pdftotext fallback in 4 verify scripts; `isPdf` twice. A shared scripts/lib might save 100 to 200 lines but these scripts guard verification, so I would not touch them without your say.
6. **Untested risky logic:** lib/glide.ts, lib/readsRead.ts (localStorage store), lib/useSlashFocus.ts. readsRead and glide are worth a test.
7. **Huge files:** components/GraphView.tsx (1110 lines, 3 eslint-disable exhaustive-deps), lib/graph.ts 626, lib/topics.ts 575, lib/lessonStore.ts 423. Split only when touching them.
8. **CSS (app/globals.css, 5337 lines):** no unused classes (cap-node-degraded/down are built dynamically in SystemDiagram.tsx), all 27 tokens used, light/dark parity holds, only the print block has literal colours. `.site-nav-button` is defined three times in a row (2755 to 2779); merging is safe only after checking the @media at 2792, so it is a MEDIUM batch of ~10 lines. About 20 other selectors repeat, mostly deliberate. Short class names were matched by substring; per-name confirmation is still needed for md, ts, none, home, part.
9. No TODO/FIXME/HACK and no commented-out code in app, components, lib.

## D. Confirmed NOT dead (tool false positives)
public/sw.js (registered in OfflineSupport.tsx:13, tested by check-offline); eslint-config-next; typescript, pagefind, playwright, yaml, cheerio (all used by scripts or tests); knip `pdftotext` (external binary); the figure geometry exports read by audit-figures.mjs.

## E. Impact if all of Section A is done
~15 lines removed or changed in 8 files, 0 files deleted, no bundle change (exports are erased). Section B items add roughly 400 lines and 1 to 3 files; B10 adds 2 dependencies. The real wins are in C (broken audit script, repeated content parsing), not in deletions: the repo is already tight.

## F. Not checked
Content JSON that nothing reads (protected, not scanned), line-level script duplication, whether lessonStore tests cover the legacy migration, build-time effect of memoising, Safari, a real phone.

## G. Applied (17 Oct 2026)
Batch 1 (unexport 12 symbols), batch 2 (NODE_RADIUS import, FADED_LABEL alias removed, NODE_STATES deleted, CapstoneSource unexported, unused test parameter), and B5 (docs/graph.png deleted). Everything else in sections B and C was left for the owner. After the batches: tsc, lint, 593 tests, build, check-seo (76 pages), check-news, check:ui and check:tour all match the baseline; check-diagram-overflow still shows the 6 labels it showed before.
