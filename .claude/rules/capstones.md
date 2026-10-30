---
paths:
  - "content/capstones/**"
  - "lib/capstones*.ts"
  - "lib/formula.ts"
  - "components/capstone/**"
  - "app/capstone/**"
  - "app/capstones/**"
---

# Capstones

Applies when editing capstone pages, their content JSON or the loader. A capstone combines topics the learner has finished into one system. The build checks the schema (`capstoneProblems` in lib/capstones.ts, run by `getAllCapstones`).

## Standing rules

- Routes: `/capstones` (index: title, summary, "N of M topics done" from the read flags, shape and text, never colour alone; from 1180px a `LearnRail` of the capstone titles in the left margin, names only, each entry `id` = its slug, same as Great reads and Blogs) and `/capstone/<slug>` (static, canonical, BreadcrumbList and LearningResource JSON-LD, sitemap entries, Pagefind body, `PageUpdated` from the newest source `verifiedOn`). "Capstones" is the fourth NAV_ITEMS link (header and footer), and the homepage "Put it together" strip (components/PutItTogether.tsx, after Try a question) links each capstone with its readiness line.
- Section order, each opening "After this you can ...": Topics it builds on, The brief, Design it first, Size it, The system, Break it, Where they differ, Check yourself, Original posts. All content is in the HTML; the interactive parts have a `<noscript>` text version.
- Reveal order: the real company choice appears only after the reader picks an option. Section tracker (`CapstoneRail`, `lib/capstoneRail.ts`): the topic rail's classes and place from 1180px (fixed, left, a count and segmented bar over the four completable sections, a metro line with a station per section (filled once finished), real anchors, IntersectionObserver on the top third, no scroll listeners); below 1180px one sticky line "Section 3 of 7: Size it" under the header opens the list (button with aria-expanded, Escape closes). It lists Brief, Design it, Size it, System, Break it, Compare, Quiz, with a state word: "N of M answered", "touched" (Size it once an input changes, Break it once a failure is toggled), "answered N of M" or "done". Those states live in the same stored picks (reserved keys `_size`, `_break`, `_q<i>`; decision ids start with a letter), so section totals appear only in the rail and headings say "Decision N" and "Question N". Picks are kept in localStorage (`sys101:capstone2:<slug>`; picks are stored by option position, so reordering options needs a new prefix and `clearCapstoneChoices` also clears the old `sys101:capstone:` keys; try/catch with an in-memory fallback for the visit when storage is blocked; not in the export file; cleared by "Reset everything" on /data through `clearCapstoneChoices`; Privacy says so). Capstones add no tracked units and never change a topic's read flag.
- Optional static diagrams (same rules as topic diagrams, original SVG in the site tokens, text only from the capstone's own fields): `decisions[].diagram` shows inside the reveal, after the real choice (never before the reader picks), and `compareDiagram` shows under "Where they differ".
- Diagram: node labels wrap by words inside the 200px box (`wrapLabel`, lib/wrapLabel.ts: 25 characters a line, 3 lines at most; `lib/wrapLabel.test.ts` fails for a label that needs more); the drawing is for pointers and is `aria-hidden`; the same parts are real buttons in a list (a column under 768px, three columns above). State shows by border shape (dashed degraded, dotted and crossed down) and by a word. Colours are tokens only; motion is the existing tokens, transform and opacity only.
- Formulas run through lib/formula.ts (no eval, no Function): numbers, input ids, + - * / ( ), ceil, floor, round, min, max. The build evaluates each at the defaults, with all inputs at min, all at max, and each input alone at its min and max, so a divide by zero in range fails.
- Sources are never invented: every requirement and real choice cites a `sourceId` in `sources`, and each figure must be confirmed on the raw page (`add-post`). A new company needs a mark (`logos.md`).

## Specification

`content/capstones/<slug>.json`, file name equal to `slug`. Fields: `slug, title, summary, topics [{slug, role}], brief {text, requirements [{label, value, sourceId}]}, decisions [{id, question, options [{label, why}], answerIndex, realChoice {company, text, sourceId}}], sizing {inputs [{id, label, min, max, step, default, unit?}], outputs [{label, formula, unit?}]}, diagram {title, nodes [{id, label, topic, company, tradeoff, to?}], failures [{id, label, effects [{nodeId, state: "degraded"|"down"}]}]}, compare (2 to 3 paragraphs split by a blank line), quiz (the topic LessonQuestion shape; `teaches` is one of the capstone's topic slugs; 3 to 8 questions; the position and style checks apply; the same position, run, cycle, over-half and longest-label checks also run on `decisions[]`, where the better fit is `answerIndex` and the labels are the options), sources [{id, title, url, company, published, verifiedOn}]`. `to` lists the nodes a node points to. Banned phrasing (em dash, "it's not X") fails the build anywhere in the file.
