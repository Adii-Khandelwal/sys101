# Content audit: rate-limiting

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 1 |
| misleading | 2 |
| weak | 3 |
| style | 1 |

7 findings. Applied: 7 (fixed 6, softened 0, cut 1); left 0.

Verified clean: Cloudflare figures (400 million requests from 270,000 sources, 0.003%, 6%, 3 sources under 15% over, no false positives, several billion requests a day, 400,000 per second, 42 x 0.75 + 18 = 49.5, 50-request example, Twemproxy, consistent hashing, SSL session ID reuse, leaky bucket and CAS reasons, anycast assumption) and date 2017-06-07; Databricks figures (P99 10ms to 20ms, single Redis, 100ms, 5%, 500+ calls, up to 10x, Dicer, token bucket, sidecar, defense in depth) and date 2025-09-11; learn page claims against RFC 6585, RFC 9110, AWS API Gateway, NGINX limit_req, Redis INCR, Envoy global rate limiting and the IETF draft; background quotes.

## Findings

**T1** `lesson next.body`. Severity: misleading. Status: fixed.
- Current: "The planned topics on circuit breakers and failover … They are not written yet."
- Source: Site data: content/topics/circuit-breakers.json and failover.json exist.
- Problem: Stale statement about the map.
- Rewrite: Say they exist.

**T2** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common ways rate limiters go wrong"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**T3** `Cloudflare failures`. Severity: weak. Status: fixed.
- Current: "The post calls the product young…"
- Source: Cloudflare: "We just started to explore how we can efficiently protect our customers with this new tool. We are looking into more advanced optimizations and create new features".
- Problem: "Young" is our word.
- Rewrite: Closer to the post.

**L1** `promise`. Severity: weak. Status: fixed.
- Current: "After this you can follow the topic page and the posts."
- Source: n/a
- Problem: Says nothing about the topic.
- Rewrite: Name the outcomes.

**L2** `how bullet 3 (Redis)`. Severity: wrong. Status: fixed.
- Current: "The page also warns that a simpler variant has a race condition…"
- Source: redis-incr: variant 1 is "the more simple and direct implementation" and uses MULTI/EXEC; variant 2 "uses a single counter, but is a bit more complex to get it right without race conditions" and has the race.
- Problem: The race belongs to the single-counter variant, not the simpler one.
- Rewrite: Name the right variant.

**L3** `practice bullet 2 (AWS)`. Severity: weak. Status: fixed.
- Current: "…resubmit the failed requests in a way that respects the limit, which means retrying more slowly"
- Source: aws-apigw-throttling: "the client can resubmit the failed requests in a way that is rate limiting."
- Problem: "Retrying more slowly" is our gloss, not marked.
- Rewrite: Label the gloss.

**B1** `single-point-of-failure gist`. Severity: style. Status: cut.
- Current: "The gist is enough here."
- Source: n/a
- Problem: Repeated filler.
- Rewrite: Delete.

## Could not verify

- The three learn videos (AWS re:Invent, two CNCF talks) cannot be watched; only their metadata is shown.
- The Databricks post gives no volume figures, so none were checked.
- The Dicer design was not opened beyond what the Databricks post says.
