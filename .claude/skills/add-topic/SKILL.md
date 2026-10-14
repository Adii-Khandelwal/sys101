---
name: add-topic
description: Add a new topic to sys101 end to end: topic JSON, its learn page, background file, graph placement and every check. Use when the user wants a new topic, a new node on the map, or a new lesson in the curriculum.
---

# Add a topic

A topic is not done until its learn page exists and the map still has zero crossings. Read the rule files first: `.claude/rules/topic-pages.md`, `.claude/rules/learn-pages.md`, `.claude/rules/graph.md`, `.claude/rules/background.md`.

1. **Place it.** Pick `slug`, `title`, optional `shortTitle` (page title under 60 characters with " · sys101"), `group`, and `prerequisites` (all must already exist; no cycle). The curriculum order in CLAUDE.md "Project" decides where it sits.
2. **Choose posts** with the `add-post` skill (selection rules, raw-page figure check, logo). Show the user each candidate (URL, company, why it passed) before saving. Two or more posts need a `comparison`.
3. **Write `content/topics/<slug>.json`** in the lesson format (README "Adding a topic" has the shape). Concept text may use general knowledge; every figure or company claim must come from a verified post. Quiz 5 to 8 questions with the position and length rules in `topic-pages.md`. Write `summary` and `prerequisiteReasons` through the drafts scripts (`scripts/topic-brief.mjs`, `scripts/apply-drafts.mjs`).
4. **Write `content/learn/<slug>.json`** from official sources only; show candidate sources and videos in a table and get approval before saving (`learn-pages.md`).
5. **Background** (`content/background/<slug>.json`) for what its posts assume, if they assume anything (`background.md`).
6. **Logos** for any new company: `node scripts/make-logos.mjs add "<Company>" [domain]`.
7. **Check:** `npx tsc --noEmit`, `npm test` (includes the graph crossing tests and the topic checks), then a build with `NEXT_DIST_DIR` if a dev server runs (CLAUDE.md "Working in this repo"). `npm run verify:figures` (network) for the new numbers.
8. **Look at the map** at 1280px, 1440px and 390px for zero crossings and overlaps, and test that sideways page scroll and map pan do not conflict at 1280px (`graph.md`). Use the `verify-ui` skill.
9. **Docs:** README topics table and counts ("Eighteen topics", "18 pages"), and the rule files if a convention changed.
