# Payments gateway draft: step and claim trace

Draft: `docs/drafts/design-payments-gateway.json`. 7 steps sourced, 1 no-source-yet (api), 6 follow-ups. No raw pages re-fetched; figures checked against the repo copies named below.

Standard applied: a claim rests only on a capstone `decisions[].realChoice`, a capstone `brief.requirements` entry, or a topic digest field among `summary`, `numbers`, `tradeoffs`, `walkthrough`. Never on option `why`, quiz text, diagram node text, `compare`, `brief.text`, or digest `constraints`, `failures`, `takeaways`. No causal word unless the source states the link.

CAP = `content/capstones/payments-ledger.json`. RC = `decisions[id].realChoice.text`, REQ = `brief.requirements[n]` (0-based). Topic passages = `posts[id].digest.<field>` in `content/topics/<file>.json`.

Gaps: no source covers card authorisation, provider routing, settlement, webhooks, fraud or PCI, or a gateway-scale TPS figure.

## Steps
- requirements: 1 REQ[3]; 2 REQ[4]; 3 REQ[5]; 4 REQ[6].
- estimation: 1 REQ[0], REQ[1]; 2 REQ[2]; 3 RC backfill (the "ten times" sentence is removed); 4 sharding.json notion-postgres-sharding-2021 `numbers` (60K; 500 GB and 10 TB).
- api: no-source-yet. Idempotency-token point sits in deep-dives.
- data-model: 1 REQ[3]; 2 RC strong-index and RC weak-index; 3 RC one-table; 4 notion sharding `walkthrough` (Pick the key); 5 figma `walkthrough` (Group tables by key, Hash the key).
- high-level: 1 RC strong-index, RC weak-index, RC one-table; 2 percolator `walkthrough` (Build on single-row atomicity, Commit by flipping the primary, Let readers resolve); 3 RC validate. Cold tier not used.
- deep-dives: 1 RC strong-index; 2 RC time-index (buffer, M buckets, 10-minute window, deleted after offload; no throttle-point sentence); 3 percolator `walkthrough`; 4 cockroach `walkthrough` (Notice the rounds were serial, Pipeline, Prove the writes) and `numbers` (slope 6 vs 2); 5 aws `walkthrough` (Retry only what is safe); 6 RC backfill.
- failure-and-scale: 1 RC strong-index; 2 RC time-index; 3 aws `walkthrough` (Retry in one place, Put a timeout on every remote call, Add jitter), `numbers`, `tradeoffs.why` (one engineer's view; the 2019 date is the source's `published`); 4 google-sre `walkthrough` (A budget per request and per client, What the budgets do, Backends tell clients, Only one layer) and `numbers`; 5 RC validate; 6 figma `walkthrough` (Route with DBProxy: queries without a shard key go to every shard); 7 notion-lexical-reindexer `walkthrough` (Catch up with aliases and versions) and `tradeoffs.why` (rollback by restoring yesterday's snapshot).
- trade-offs: 1 RC weak-index; 2 RC time-index and RC one-table; 3 percolator `numbers` (~4x overhead) and `tradeoffs.why`; 4 figma `tradeoffs` (hashing, range scans, rejected cross-shard transactions); 5 notion sharding `tradeoffs` (480 divides evenly, Citus and Vitess hid distribution); 6 aws `tradeoffs` and `walkthrough` (circuit breakers, no measurement).

## followUps (6, all kept; each has 3 or more claims)
1. load-jump: 1 RC time-index; 2 RC time-index (state management, buffer tables not created in time); 3 RC one-table.
2. retry-storm: 1 aws `walkthrough` (Retry in one place; 243x); 2 aws `walkthrough` (token bucket, jitter); 3 and 4 google-sre `walkthrough` and `numbers`; 5 aws `walkthrough` (Retry only what is safe).
3. migration-failure: 1 RC validate (targets); 2 RC validate (shadow limits); 3 RC validate (Spark, 760 billion, 70 TB); 4 RC backfill (batches, AIMD, stop); 5 RC backfill (100 billion, 120 days, small steps); 6 RC validate (few weeks, fallback, month).
4. stricter-consistency: 1 REQ[4] and RC weak-index ("only when the use case strongly demands it"); 2 RC strong-index; 3 RC strong-index; 4 RC weak-index (what strong indexes give up).
5. cross-shard-write: 1 and 2 percolator `walkthrough`; 3 percolator `numbers`; 4 cockroach `walkthrough`; 5 figma `tradeoffs` (rejected) and `walkthrough` (Group tables by key).
6. database-too-big: 1 notion `numbers`; 2 notion `walkthrough` (Pick the key); 3 notion `walkthrough` (Fix the shard count) and `tradeoffs`; 4 notion `walkthrough` (Route in one place); 5 figma `walkthrough` (Shard logically first, Then split physically); 6 figma `walkthrough` (Route with DBProxy).

## Notes
- Removed in this pass: duplicate-charge sentence, appended "ten times", "which means"-style links not in the source, Percolator's 2 million timestamps (only in `failures`), the Figma lost-guarantees list (only in `failures`), Notion's two-year growth and "shard before a crisis" (`constraints`, `takeaways`), the six-nines acceptance claim, the cold tier, append-only.
- A source's own published year may appear in a claim (failure-and-scale 3 keeps "from 2019"), because it is verified metadata.
- Percolator is labelled "paper". Google SRE keeps `published` "no date shown" (page copyright 2017).
- Not used: GitHub, Discord, S3, Haystack, Dropbox.
