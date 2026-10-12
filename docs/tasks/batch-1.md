# Batch 1: Path numbering, "In short" summaries, edge reasons

Read this first in any session and continue from RESUME. (TaskCreate/TaskUpdate were not available in the first session, so this file is the only tracker.)

## Phase A (code and pilot)
- [ ] Setup: this file, scripts/topic-brief.mjs, scripts/apply-drafts.mjs
- [x] A1 Path numbering: caption, phone group headers, shared ordering function, docs/homepage.md, tests
- [x] A2 Summary field (schema, render, checks)
- [x] A3 prerequisiteReasons (schema, render in Builds on, Path rows, learn "Before you start", map tooltip if under 20 lines, checks)
- [x] A4 Fields required only on topics that have them until Phase B ends (flag REQUIRE_NEW_FIELDS in lib/topics.ts)
- [x] A5 Pilot drafts for caching and consensus (docs/drafts/batch-1-pilot.json)
- [x] A6 Build, SEO check, search index, tests, 1440/390 check, CLAUDE.md, one commit per item, no push
- [x] A7 STOP and reply: 6 lines, then pilot text only

## Phase B (after the user says "continue"): batches of 4 topics
Per-topic status (todo / drafted / applied):
caching: pilot | consensus: pilot
cap: todo | cdns: todo | circuit-breakers: todo | consistent-hashing: todo | databases: todo | distributed-transactions: todo | dns: todo | event-driven-architecture: todo | failover: todo | indexing: todo | load-balancing: todo | message-queues: todo | pub-sub: todo | rate-limiting: todo | replication: todo | sharding: todo
- [ ] After the last batch: set REQUIRE_NEW_FIELDS = true, full build, tests, SEO check, list every figure referenced.

## Decisions
- Map tooltip reasons skipped: graph code is out of scope for this batch and the tooltip already carries concept, status, builds-on and a pending line; failover has 3 prerequisites, so it would not stay under 20 lines.
- Figure meaning is lowercased on its first letter when the second letter is lowercase (so "TAO" and "CPU" keep capitals).
- Ordering: topicOrder() in lib/order.ts = columns() of the transitive reduction, flattened (the existing Map index order). Numbers are global 1..N.
- Context passes about 70%: stop at a batch boundary, update RESUME, tell the user to /clear and paste "Continue batch 1 from docs/tasks/batch-1.md."

RESUME: Phase A done. Wait for the user to say "continue", then start Phase B batch 1 (cap, cdns, circuit-breakers, consistent-hashing).
