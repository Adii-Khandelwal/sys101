# sys101 backlog

Planned work, not built. Nothing here changes code or content until it is picked up and approved.

## 1. Richer practice

**Goal:** practice that teaches, not just checks recall.

**Decisions**
- Check yourself: 5 to 8 questions per topic (today 3 to 5).
- Each answer explains why it is right, why each wrong option is wrong, and links back to the section that teaches it.
- Design exercises: 2 to 3 per topic in rising difficulty: apply, design, scale it 10x.
- Each exercise has a model answer with reasoning, trade-offs, and common wrong answers, hidden until clicked.

**Schema or UI impact**
- `quiz[]` items gain answer options, a per-option explanation, and a `teaches` link to a section id.
- `exercise` becomes `exercises[]` with `level` (apply, design, scale), `prompt`, `answer`, `tradeoffs`, `wrongAnswers[]`.
- Build checks: 5 to 8 questions, 2 to 3 exercises, no empty explanations, every `teaches` link resolves to a real section.

**Rules to keep**
- Answers come from verified content on the page; no new figures.
- Hidden answers stay usable without JavaScript (native disclosure).

## 2. Topic page as a teaching journey

**Goal:** a page that reads in learning order.

**Decisions**
- Order:
  1. Why it exists
  2. Mental model
  3. How it works, step by step
  4. Worked example
  5. Common mistakes
  6. Check yourself (concept)
  7. How companies use it (posts)
  8. Where they differ
  9. Design exercises
  10. What to learn next
- Each section opens with one line saying what you can do after it.
- A progress rail shows where you are on the page.

**Schema or UI impact**
- New concept fields per section, each with an `outcome` line and a stable section id.
- Progress rail is a client component that reads section ids.

**Rules to keep**
- Design rules in CLAUDE.md, including no hover animations everywhere and reduced motion respected.

## 3. Diagrams

**Goal:** a diagram wherever a flow, topology, or before/after helps, without copying anyone's figures.

**Decisions**
- Never copy or embed diagrams from blog posts. Redraw the key idea as our own SVG in the site style, from the post's description, and link to the original figure ("See Figure 2 in the original").
- At least one diagram in the concept part, and one per post.

**Schema or UI impact**
- Diagrams gain `alt` text and an optional `sourceFigure` (label and URL).
- Concept sections can hold a diagram.

**Rules to keep**
- Existing SVG build checks: no gradients, filters, or scripts, and a title is required. Add: alt text required.
- Figure references must be checked against the original post before saving.

## 4. Concept first, then real-world deep dive

**Goal:** learn the idea fully, then see it in production.

**Decisions**
- Part A, Concept: what, why, how, trade-offs, vocabulary. Explanation is fine; invented numbers are not. Any figure or claim needs a verified source.
- Part B, Real world: the posts as use cases.
- A "Skip to the posts" button at the top, and a "Back to concept" link in Part B.
- Two trackers per topic, in localStorage: Concept (mark complete) and Posts (mark each post read). A topic counts as read when both are done.
- Graph nodes show concept and posts progress without relying on color alone, for example a two-segment marker or "1/2". Decide the design with the owner before building.

**Schema or UI impact**
- Concept sections as structured fields, posts as use cases, and a stable `id` per post for tracking.
- Progress storage changes from a list of read topics to per-topic concept and per-post state; existing "read" marks need a migration.
- Index and graph read state switch to the combined rule.

**Rules to keep**
- Progress stays in the browser only, as the Privacy page says.
- Honesty rules and approval before saving new posts.

## 5. Alternative views

**Goal:** a fallback if the graph stops being readable.

**Decisions**
- Options:
  - Path view: a linear syllabus in prerequisite order, grouped, with progress.
  - Tracks view: subway-style lanes per group.
  - Expandable tree.
  - Companies view: a matrix of topics by company.
- Recommendation: Path view as the default everywhere, with the graph as an optional "Map" toggle.
- Pivot trigger: the graph passes about 25 nodes, or its edges become hard to read.

**Schema or UI impact**
- Path view reuses the existing map order and groups; no content changes.
- Homepage gains a view toggle.

**Rules to keep**
- CLAUDE.md says the graph is the homepage; update that rule when the pivot happens.

## 6. Mobile

**Goal:** a homepage that works on phones without a custom canvas.

**Decisions**
- The graph is desktop only.
- Under 768px, the homepage shows the Path view: a grouped list, progress per topic, "Next up" at the top, and builds-on shown as text.
- An optional "Open map" link goes to a read-only, fitted graph.
- No custom pan or zoom on mobile.

**Schema or UI impact**
- Homepage branches by breakpoint.
- The mobile breakpoint moves from 640px to 768px.
- Touch pan and pinch code becomes desktop-only or is removed.

**Rules to keep**
- No horizontal page scroll, 16px gutters, skeleton loaders, and the existing design rules.

## Suggested build order

1. Ideas 4 and 2 together, since both change the page layout and the schema.
2. Idea 1.
3. Ideas 6 and 5 (Path view).
4. Idea 3, diagram by diagram, as each topic is rewritten.

Pilot the new topic format on DNS only, and get approval before rolling it out to the rest.

## Open questions

- Graph progress marker: a two-segment ring, "1/2" text, or something else?
- Worked examples: may they use clearly labelled illustrative numbers, or only figures from verified sources?
- When existing "read" marks migrate, should they count as concept complete, posts read, or both?
- Is the Path view the desktop default from the start, or only after the pivot trigger?
- Do current per-post diagrams need a `sourceFigure` link even though they summarize the whole post rather than one figure?

## Parked decisions (moved from CLAUDE.md)

- General-knowledge flow: not built. Open decision: where those stories live (a separate section or route) and how topics link to them.
- LLM pipeline (Gemini Flash) to summarize and compare posts, and alternative views (Tracks, Companies matrix, expandable tree) are described above. The Path view, mobile Path default and weekly link checking are built.
