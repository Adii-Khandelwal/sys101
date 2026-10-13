# Content audit: event-driven-architecture

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 6 |
| misleading | 1 |
| weak | 7 |
| style | 0 |

14 findings. Applied: 14 (fixed 13, softened 1, cut 0); left 0.

Verified clean: Grab Plumbing figures (over 300 billion events a week, terabytes of ingress each hour, hundreds of pipelines, ScyllaDB metastore, rewind a few hours, deduplication, operators, Go plugins to RPC plan) and date 2020-01-06; Zapier figures (50 shards, per-shard mutex, WAL, journal_size_limit, auto_vacuum, EBS volume, StatefulSet, decision to move away) and date; Grab cost figures (67%, half of cost, two-thirds, 25% drop, up to 500 ms, caveats) and date 2023-07-07; learn page claims against AWS, Microsoft (event-driven, event sourcing, outbox, CQRS) and Kafka quickstart; background quotes.

## Findings

**T1** `summary point 3`. Severity: wrong. Status: fixed.
- Current: "Zapier found a plain write-then-publish can lose events, so an outbox commits the event with the state change…"
- Source: Zapier: the problem was that Kafka was "a single point of failure" and producer latency spiked; "This wasn't the textbook transactional outbox pattern. In our case, the important atomic step was the local database write."
- Problem: The post does not describe a write-then-publish race or an event committed with a business state change.
- Rewrite: Say what Zapier did.

**T2** `Zapier problem`. Severity: wrong. Status: fixed.
- Current: "…a transactional outbox so a state change and its event are recorded together locally first…"
- Source: Same Zapier passage: the atomic step was the local database write of the event; Kafka emission happened later.
- Problem: No state change is recorded with the event in the post.
- Rewrite: Rewrite.

**T3** `Zapier constraints`. Severity: wrong. Status: fixed.
- Current: "Kafka infrastructure was mid-transition…"
- Source: Zapier: "Our relational database infrastructure was also going through a transition at the time, and we didn't want this service coupled to that work."
- Problem: It was the relational database infrastructure, not Kafka.
- Rewrite: Name the right system.

**T4** `Zapier trade-off why`. Severity: wrong. Status: fixed.
- Current: "…independent of the in-transition Kafka infrastructure…"
- Source: Same passage as T3.
- Problem: Same error.
- Rewrite: Rewrite.

**T5** `Zapier takeaway`. Severity: wrong. Status: fixed.
- Current: "…a plain write-to-db-then-publish can lose events, and an outbox fixes that by committing the event with the state change."
- Source: Zapier text above.
- Problem: Attributes a lesson the post does not make.
- Rewrite: Rewrite.

**T6** `comparison paragraph 2`. Severity: wrong. Status: fixed.
- Current: "Zapier owns the dual-write problem…commits the event with the state change in a local outbox"
- Source: Zapier text above.
- Problem: Same misattribution.
- Rewrite: Rewrite.

**T7** `Grab platform trade-off rejected`. Severity: weak. Status: softened.
- Current: "Letting each team build its own stream processing ad hoc, and (as a current limitation)…"
- Source: Grab: no passage names ad hoc team-by-team processing as a rejected option; the Go plugins limitation and plan for plugins over RPC are stated.
- Problem: An alternative the post does not name.
- Rewrite: Keep only what is named.

**T8** `lesson exercise scale trade-offs`. Severity: weak. Status: fixed.
- Current: "…and a same-AZ replica may lag the leader slightly."
- Source: Grab: "an increase of up to 500ms in end-to-end latency"; Kafka 2.3 introduced fetching from replicas.
- Problem: Unsourced lag claim; the post gives a number.
- Rewrite: Use the post.

**T9** `lesson.mistakesOutcome`. Severity: weak. Status: fixed.
- Current: "the three mistakes that most often break event-driven systems"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop the ranking.

**L1** `practice bullet 1 and misconception 4`. Severity: misleading. Status: fixed.
- Current: "says to avoid the style where…"
- Source: ms-eda: "This architecture might not be suitable when: …Business transactions require strong consistency across services."
- Problem: The page says it might not be suitable, not "avoid".
- Rewrite: Match the page.

**L2** `practice bullet 3`. Severity: weak. Status: fixed.
- Current: "AWS positions event-driven architecture as common in microservices precisely because it lets teams build and scale those services independently"
- Source: aws-eda: "common in modern applications built with microservices"; separately, decoupling lets services "be scaled, updated, and deployed independently".
- Problem: "Precisely because" is our causal claim.
- Rewrite: Two separate statements.

**L3** `deeper bullet 2 and 3`. Severity: weak. Status: fixed.
- Current: Uncited explanation of idempotency and "A common companion is CQRS".
- Source: ms-outbox: only says guaranteed delivery supports idempotent processing; ms-cqrs: "Segregate the read and write operations … into separate data models."
- Problem: Our own explanation not labelled; "common companion" not in the page.
- Rewrite: Label and match.

**L4** `practice bullet 2`. Severity: weak. Status: fixed.
- Current: Operational list partly uncited.
- Source: ms-eda: "operational overhead of event brokers, asynchronous error handling, and eventual consistency".
- Problem: Backlogs and tracing are our own points.
- Rewrite: Cite and label.

**L5** `Backlog term`. Severity: weak. Status: fixed.
- Current: "the main failure mode is a backlog growing unnoticed on one consumer."
- Source: n/a
- Problem: Ranking claim without a source.
- Rewrite: Drop "main failure mode".

## Could not verify

- The learn page videos and the Kafka quickstart output were not run.
- Grab and Zapier posts cite other posts (Netflix Keystone, a Zapier sidecar post) that were not opened.
- The Zapier date 2026-03-30 comes from the existing entry; the fetched text was not checked for a date line.
