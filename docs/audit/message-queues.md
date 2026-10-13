# Content audit: message-queues

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 1 |
| misleading | 4 |
| weak | 1 |
| style | 1 |

7 findings. Applied: 7 (fixed 6, softened 0, cut 1); left 0.

Verified clean: Slack figures (over 1.4 billion jobs, 33,000 per second, 16 brokers on i3.2xlarge, 32 partitions, 3 copies, 2 days, 50 Redis clusters and 1,600 partitions, Kafka 0.10.1.2) and dates (2017-12-06, updated 2020-06-25); Kafkagate leader-only acknowledgement; JQRelay offsets and Consul rate limits; FOQS figures (close to one trillion items per day, hundreds of billions in backlogs, 10s to 10+ million per minute, 10 Kb payload, two additional regions, a few milliseconds) and design (leases, ack, nack, prefetch buffer, circuit breaker, pull model, checkpointing); SQS, RabbitMQ and Kafka claims on the learn page; all 4 Background quotes.

## Findings

**T1** `comparison paragraph 1`. Severity: wrong. Status: fixed.
- Current: "Meta built FOQS in 2021 as a general queue for many teams"
- Source: The post is dated 2021-02-22 and says "FOQS has experienced exponential growth over the past few years"; it does not give a build date.
- Problem: 2021 is the post date, not when FOQS was built.
- Rewrite: Say the post, not the build, is from 2021.

**T2** `summary point 4; FOQS takeaways`. Severity: misleading. Status: fixed.
- Current: "…anything unacknowledged comes back, which makes at-least-once delivery the safe default."; "At-least-once is the safe default".
- Source: FOQS: "FOQS supports both at least once and at most once delivery semantics. If an item is to be delivered at most once, it will be deleted when the lease expires; if at least once, redelivery will be attempted."
- Problem: The post offers both semantics; "the safe default" is ours, and unacknowledged items do not always come back.
- Rewrite: Match the post.

**T3** `lesson workedExample "A slowdown starts"`. Severity: weak. Status: fixed.
- Current: "At Slack in 2017, slow database queries made jobs run slowly."
- Source: "about a year ago, Slack experienced a significant production outage due to the job queue" (post dated December 2017).
- Problem: The outage was about a year before the 2017 post.
- Rewrite: Date it from the post.

**T4** `lesson next.body`. Severity: misleading. Status: fixed.
- Current: "Message Queues is the end of this branch of the map for now… Rate Limiting is the next topic planned."
- Source: Site data: pub-sub lists message-queues as a prerequisite, and a Rate Limiting topic exists.
- Problem: Stale statements about the map.
- Rewrite: Describe the real next topics.

**T5** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common mistakes with queues"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**L1** `practice body[0], body[2]; next; SQS sentence; promise`. Severity: misleading. Status: fixed.
- Current: "…queues sit at the far end of this map"; "This is the far end of the current map"; SQS "suggests… a metric for the age of the oldest message".
- Source: Site data: pub-sub follows message-queues. sqs-dlq mentions the ApproximateAgeOfOldestMessage metric in its retention discussion; its alarm advice is for messages moved to a dead-letter queue.
- Problem: Stale map statements; the SQS page does not suggest that metric.
- Rewrite: Fix each.

**B1** `circuit-breaker gist`. Severity: style. Status: cut.
- Current: "The gist is enough here."
- Source: n/a
- Problem: Repeated filler.
- Rewrite: Delete.

## Could not verify

- Kafka "exactly once" fine-print warning on the kafka-design page was matched by keyword only.
- The topic mentions a Redis page and Thrift page in Background; only their explanations were read.
