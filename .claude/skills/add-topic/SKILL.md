---
name: add-topic
description: Add a new topic to sys101 end to end: topic JSON, its learn page, background file, graph placement and every check. Use when the user wants a new topic, a new node on the map, or a new lesson in the curriculum.
---

# Add a topic

A topic is not done until its learn page exists, every check below is green and the map still has zero crossings. Read first: `CLAUDE.md` (honesty rules, site feel, banned list), `.claude/rules/topic-pages.md`, `learn-pages.md`, `graph.md`, `background.md`, and `shape.md` in this folder (the file shape and the before-committing list). Skip a rule only if the user says so.

## 0. Before you start

- Branch from the current main: `git fetch`, then `git switch -c <name> origin/main`. A hook blocks commits on `main` and on a merged branch.
- If `npm run dev` is up on :3000, leave it. Never run a bare `npm run build`: build with `NEXT_DIST_DIR=.next-build` (CLAUDE.md "Working in this repo").
- Never hand-edit generated files (`lib/logoFiles.ts`, `public/pagefind`, `public/logos` except through the logo script); a hook blocks it.
- Source work is slow and needs the network. Do not start writing until the user has approved the placement (step 1) and each post and learn source (steps 2 and 4).

## 1. Place it

Pick `slug` (lowercase, hyphens, equals the file name), `title`, optional `shortTitle` (the page title stays under 60 characters with " · sys101"), `group` (one of `GROUPS` in `lib/topics.ts`: Scaling, Data, Messaging, Reliability; a new group is a code change to `GROUPS` and the graph, so ask first), and `prerequisites` (every one must already exist; no cycle). The curriculum order in CLAUDE.md "Project" decides where it sits. Show the user the slug, group, prerequisites and one line on why before going on.

**Test the placement before any writing.** Write a stub `content/topics/<slug>.json` with only `slug`, `title`, `group` and `prerequisites` (plus any edge you plan to add to another topic's `prerequisites`) and run `npx vitest run lib/graph.test.ts`; it reads the raw JSON, so a stub is enough. If it fails, show the user the options (often no prerequisite, or fewer) now, not after the lesson is written. Then start posts and learn sources together (steps 2 and 4): two research agents in parallel, one table each, one approval turn.

## 2. Posts

Use the `add-post` skill for each. Show the user every candidate (URL, company, why it passed the five rules) and wait. Raw-page figure check with curl; drop and list any figure you cannot find. Fetch each raw page once into the scratchpad (`raw/<post-id>.txt`) and tell every later agent (writer, background, reviewer) to read those copies instead of fetching again. Two or more posts need a `comparison` (2 to 3 short paragraphs). A new company needs a mark in the same change (step 6).

## 3. The topic file

Write `content/topics/<slug>.json` in the lesson format (`shape.md`). Give the writer `shape.md`, the raw copies and one short excerpt of a sample topic, not a whole sample topic JSON (about 11k tokens each). Concept text may use general knowledge; every figure or company claim must come from a verified post, in your own words. Quiz 5 to 8 questions with the position and length rules in `topic-pages.md`; 2 to 3 exercises rising in difficulty. No em dashes, no "not just", no "it's not X, it's Y" (the build rejects them in summaries and figure labels; CLAUDE.md bans them everywhere). Diagrams are original inline SVG with a `<title>` and a `viewBox`, no gradients, filters or shadows, in the site's tokens.

Then the two fields that are written by script, not by hand: `node scripts/topic-brief.mjs <slug>` prints what you need; write `{ "<slug>": { "summary": ..., "prerequisiteReasons": ... } }` to `docs/drafts/<name>.json` and run `node scripts/apply-drafts.mjs docs/drafts/<name>.json`. Write them before the reviewer sees the file: several build limits (28-word points, no digits in reasons) fail only once they exist.

**Scripts before any reviewer** (they cost no tokens): `npx vitest run lib/topics lib/logos.test.ts lib/comparison lib/diagramCheck lib/pageUpdated.test.ts`, `node scripts/check-topic.mjs <slug>` and `npm run verify:figures` (record any HAND CHECK). Fix what they find, then one reviewer round on judgement only: own words, concept accuracy, quiz clarity, diagram truth. The reviewer reads the raw copies and does not re-fetch or re-run the scripts. A second round is the admin grepping the listed fixes, not a second Opus run.

## 4. Learn page

`content/learn/<slug>.json` from official sources only (standards, vendor and project docs, university courses, recognised conference talks). One agent researches the sources and, once approved (resume it with SendMessage), writes the page from the pages it already opened. Show candidate sources and videos in a table (at most 6 columns) and get approval before saving. Claude cannot watch videos: never add one unapproved. See `learn-pages.md` for the four stages and the Try it rules.

## 5. Background

`content/background/<slug>.json` for what its posts assume the reader knows. Every quote must be copied from the post's raw text. If the posts assume nothing beyond the topic, say so in the report instead of adding an empty file.

## 6. Logos and the rest of the site

- A new company: `node scripts/make-logos.mjs add "<Company>" [domain]`; look at the mark on both themes.
- **Update the "What to learn next" text of each prerequisite** (`lesson.next.body` in its topic file) so it sends the reader on to the new topic. It is hand-written, so nothing else updates it.
- **Numbers shift.** Topic numbers are positions in the map's left-to-right order (`topicOrder`), so a new topic renumbers every topic after it, and may move others within a column. Nothing stores a number (progress and links use slugs), but run a throwaway test or `lib/order.test.ts` to list what changed, grep for hard-coded numbers (`grep -rn -i -E "topic (0?[0-9]{1,2})\b" app components lib scripts .claude README.md`; today only `components/NextUp.tsx` says "Topic 01", which stays true while Databases is first), and tell the user which topics moved.
- **Prerequisites decide the layout.** Already tested on the stub in step 1; re-run `npx vitest run lib/graph.test.ts` once the real file exists. A failure there is a change to the placement, so stop and show the user the options before changing anything. There is no topic-level "related" field: `related` on a post means the post also teaches that topic, so mention a non-prerequisite topic in prose (the lesson text and "What to learn next").
- Do not add the topic to any list by hand: the map, Path, index, numbering (`topicOrder`), search, sitemap, "Next up", the progress store and the README counts all derive from `content/`.
- What's new for the topic is optional and separate (`news.md`); do not create `content/news/<slug>.json` or an allowlist entry unless asked.

## 7. Check, in this order

1. `node scripts/check-topic.mjs <slug>` (`npm run check:topic -- <slug>`). Fix every FAIL. Decide every WARN: fix it, or say in the report why it stays. It checks the files exist, prerequisites, summary, reasons, logos, duplicate post ids, the prerequisites' "What to learn next" text, and docs that state a topic count.
2. `npm run readme:stats` (README counts are computed; `lib/readme.test.ts` fails until you run it). Fix any other doc the check named, in the same change.
3. `npx tsc --noEmit`, `npm run lint`, `npm test` (graph crossing and overlap tests at 1440, 1280 and 390, topic and learn checks, logos).
4. A build into another directory, then `NEXT_DIST_DIR=.next-build node scripts/check-seo.mjs`, `check-news.mjs`, `check-diagram-overflow.mjs` (and `npm run check:tour` if the top of a topic page changed), then `rm -rf .next-build`.
5. `npm run verify:figures` (network) for the new numbers; it rewrites `docs/verification-log.md`, so commit that with the topic. A lone digit or number word it cannot judge says HAND CHECK: read the source and record it in `docs/hand-checks.json`.
6. Look at it with the `verify-ui` skill: the map at 1280, 1440 and 390 (zero crossings, no overlaps, sideways page scroll and map pan not in conflict at 1280), the topic page, its learn page, `/background` and `/posts`, light and dark. `npm run check:ui` for overflow, tooltips, split labels, broken images and layout shift.
7. Run `/ponytail-review` on the diff.

## 8. Report and hand-off

At most 8 lines (CLAUDE.md "Token discipline"): files changed, figures dropped, WARNs you kept and why, what you could not check (Safari, a real phone, Pagefind, a deploy), the next decision, and the CLAUDE.md, README and rule-file lines ("updated <section>" or "no change"). Do not push until asked. When asked, follow the `release-check` skill.
