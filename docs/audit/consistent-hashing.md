# Content audit: consistent-hashing

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 0 |
| misleading | 3 |
| weak | 7 |
| style | 1 |

11 findings. Applied: 11 (fixed 10, softened 0, cut 1); left 0.

Verified clean: Cloudflare figures (99% to 8%, 160 points, 8 to 6 bytes, 25%, 90%, 0.7%, over 100TB) and date 2026-09-18; Discord figures (500,000 sessions, 12μs, 30 seconds, 7μs and 17.5 s, 0.3μs and 750 ms, up to 1 second) and date 2017-07-06; Karger, Dynamo and Redis Cluster claims (ring definition, neighbours only, 16384 slots, no consistent hashing in Redis Cluster); all 5 Background quotes.

## Findings

**T1** `Cloudflare walkthrough "Use fewer points"`. Severity: weak. Status: fixed.
- Current: "Guided by the math, they cut the points generated per server by 90%, where the measured loss of balance was negligible."
- Source: "Now that we have some math to back it up, we determined that we could decrease the number of hashes we were generating for each server by 90% without incurring any appreciable error".
- Problem: The decision came from the math and simulations, not a measurement of production balance.
- Rewrite: As quoted.

**T2** `Cloudflare walkthrough "Run both rings"; tradeoffs.why; lesson exercise 3 tradeoffs`. Severity: misleading. Status: fixed.
- Current: "which made rollback instant"; "temporary double memory"; "Two rings double memory during the move"
- Source: "it also gave us a clean rollback path. If anything looked wrong, we could send new requests back through the old ring without redeploying PBR."; "PBR carried both versions... in memory".
- Problem: "Instant" and "double" are not in the post; the new ring is about 90% smaller, so memory would not double.
- Rewrite: Say what the post says.

**T3** `Cloudflare problem; numbers; lesson workedExample "Count the cost"`. Severity: weak. Status: fixed.
- Current: "rings... reaching about 6GB"; "Ring memory in the worst cases"; "some rings reached about 6GB"
- Source: "the 'excessive memory use' (6GB in some cases) that Ivan found was due to an enormous number of hashes"
- Problem: The post gives 6GB as memory use in some cases, not the size of one ring.
- Rewrite: Match the post.

**T4** `summary figure 1`. Severity: weak. Status: fixed.
- Current: "With 160 virtual nodes per server, load variation fell from about 99% to about 8%"
- Source: Source: "if we go back to our 100-server example, if we use 160 points per server instead of just one, the coefficient of variation... drops from about 99% to about 8%".
- Problem: Drops the 100-server condition.
- Rewrite: Add the condition.

**T5** `Quiz Q5`. Severity: misleading. Status: fixed.
- Current: "Going from 160 to 1,600 points per server mostly costs you what? / Ten times the memory for little extra balance"
- Source: Post: going from 10,000 to 100,000 points (a weighted server) buys "a minuscule 0.7% reduction in error"; at 100 servers the formula gives CV about 7.9% at 160 points and 2.5% at 1,600.
- Problem: The post's "little extra balance" example is 10,000 to 100,000, not 160 to 1,600 (which is a visible gain).
- Rewrite: Use the post's example.

**T6** `lesson workedExample diagram label`. Severity: weak. Status: fixed.
- Current: "lookup stays O(1)"
- Source: The lesson itself says lookups use a binary search over sorted points; neither post gives a complexity.
- Problem: Unsourced and inconsistent with the lesson.
- Rewrite: Say "stays cheap".

**T7** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common mistakes with hash rings"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**T8** `Discord constraints`. Severity: weak. Status: fixed.
- Current: "Any call to another Erlang process costs about 12μs"
- Source: "The cost of communicating with another Erlang process using request/reply is about 12μs."
- Problem: "Any call" for a request and reply.
- Rewrite: As quoted.

**T9** `Discord failures`. Severity: weak. Status: fixed.
- Current: Failures omit the second problem the post describes.
- Source: "nearly 5,000,000 session processes were trying to stampede ten of these processes... We didn't want to use a circuit breaker... Semaphore library".
- Problem: The Background items on semaphores and circuit breakers refer to this, but the digest never mentions it.
- Rewrite: Add the sourced sentence.

**L1** `basics body[0]; deeper body[0]; misconception 3; promise`. Severity: weak. Status: fixed.
- Current: Near-copy of Karger without its hedge; "usually paired with replication"; hot-key truth uncited; filler promise.
- Source: Karger: "Roughly speaking, a consistent hash function is one which changes minimally as the range of the function changes."
- Problem: Hedge dropped; generalisation from Dynamo; unlabelled general claim.
- Rewrite: Fix each.

**B1** `pub-sub and circuit-breaker gists`. Severity: style. Status: cut.
- Current: "The gist is enough here."
- Source: n/a
- Problem: Repeated filler.
- Rewrite: Delete.

## Could not verify

- The Dynamo and Karger PDFs were read as extracted text (hyphenation artefacts); only the quoted properties were checked.
- The learn page's try-it Redis commands and the reshard prompt (1 to 16384 slots) were not re-run against the Redis page beyond the slot facts above.
- General statements in the lesson (binary search over sorted points, hashing a server many times with suffixes) have no cited source.
