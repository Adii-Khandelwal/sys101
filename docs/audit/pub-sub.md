# Content audit: pub-sub

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 0 |
| misleading | 2 |
| weak | 4 |
| style | 0 |

6 findings. Applied: 6 (fixed 6, softened 0, cut 0); left 0.

Verified clean: Spotify figures (232M MAU, 1.5M per second, over 8M at peak, over 500 event types, over 350 TB, 100 to 500 billion events a day, 15 services on 2,500 VMs, SLOs of a few hours, 24 and 72 hours, Kafka system shut down February 2017) and date 2019-11-12; Uber figures (300 microservices, 1M to 12M messages a second, about 200,000 partitions, 10 MB/s partition, P99 under 10 s as a target, hundreds of services) and date 2021-08-31; Consumer Proxy design details (out-of-order commit, DLQ, flow control, Rest Proxy and Kafka Connect comparison); Redis at-most-once, Google at-least-once, ordering keys, per-message leases, service-to-service scope, approximate dead-letter attempts; all 5 Background quotes except the four replaced.

## Findings

**T1** `summary point 4`. Severity: weak. Status: fixed.
- Current: "…which suits only work where order does not matter."
- Source: Uber: "Message queueing focuses on unordered, point-to-point, asynchronous messaging".
- Problem: "Only" is stronger than the post.
- Rewrite: Drop "only".

**T2** `lesson next.body`. Severity: misleading. Status: fixed.
- Current: "Pub-sub is the base for event-driven design, which is planned next on the map."
- Source: Site data: the Event-driven Architecture topic exists and lists pub-sub as a prerequisite; Rate Limiting and Circuit Breakers exist.
- Problem: Stale statement about the map.
- Rewrite: Say it exists.

**T3** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common mistakes with pub-sub"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**T4** `comparison paragraph 1`. Severity: weak. Status: fixed.
- Current: "…split by kind of work…"
- Source: Uber's post describes one proxy in front of consumer groups, not topics split by kind of work.
- Problem: Spotify's design does not describe Uber's.
- Rewrite: Drop the clause.

**B1** `kafka-offsets, grpc, cloud-pubsub, etl quotes`. Severity: weak. Status: fixed.
- Current: Quotes that start mid-thought or only point elsewhere: "However, this would cause potential data loss…"; "Sends/pushes each message separately…"; "It took us almost a year to design…"; "You can read more about this concept in Reliable export…".
- Source: Uber: "Unlike Kafka, where a commit indicates that all messages with lower offsets are also committed, a Consumer Proxy commit only marks that single message as committed."; Uber: "Sends/pushes each message separately to a consumer service instance that exposes a gRPC® service endpoint"; Spotify: "The backbone of our system is Cloud Pub/Sub."; Spotify: "every Event Type has its own Pub/Sub topic, Extract, Transform, Load (ETL) process, and final storage location".
- Problem: Each old quote does not show the concept it is filed under.
- Rewrite: Use the sentences that show the concepts.

**L1** `promise`. Severity: weak. Status: fixed.
- Current: "After this you can follow the topic page and the posts."
- Source: n/a
- Problem: Says nothing about the topic.
- Rewrite: Name the outcomes.

## Could not verify

- The learn page was spot-checked against the Kafka design page for the delivery-semantics wording only by keyword.
- The three videos on the learn page (Google Cloud, two Confluent) cannot be watched; only their metadata is shown.
- Spotify "Reliable export of Cloud Pub/Sub streams to Cloud Storage" and Uber follow-up material were not opened.
