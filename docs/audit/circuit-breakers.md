# Content audit: circuit-breakers

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 0 |
| misleading | 2 |
| weak | 4 |
| style | 0 |

6 findings. Applied: 6 (fixed 4, softened 2, cut 0); left 0.

Verified clean: Zalando figures (95%, about 5 RPS per pod, 05:00 to 06:00, 15/10/2 ms probes, 3 ms vs over 100 ms, minimum three pods, 10x, about three seconds, force-close and pre-scale, cancellations) and date 2026-10-08; Uber figures (130M customers, 6 tiers, 128 cohorts, 768 priorities, 10 seconds, 33%, 120 ms test service, 650 RPS per instance, 40% and 552, 140 and 190 ms, 240/60/110, 30%, P50 +50% at 300% overload, 1 microsecond, first of three posts) and date 2023-11-22; learn page claims against Microsoft, gRPC deadlines and retry, Envoy circuit breaking and adaptive concurrency, Google SRE overload, AWS timeouts and retries, Hystrix, Istio and RFC 9110; background quotes.

## Findings

**T1** `lesson next.body`. Severity: misleading. Status: fixed.
- Current: "The planned topic on failover … is not written yet."
- Source: Site data: content/topics/failover.json exists.
- Problem: Stale statement about the map.
- Rewrite: Say it exists.

**T2** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common ways these protections go wrong"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**T3** `Uber auto-tuner step`. Severity: weak. Status: fixed.
- Current: "…a heavily modified TCP Vegas algorithm…"
- Source: Uber: "a modified TCP Vegas algorithm".
- Problem: "Heavily" is not in the post.
- Rewrite: Drop "heavily".

**T4** `Uber trade-off rejected`. Severity: weak. Status: softened.
- Current: "CoDel alone, which oscillates between rejecting everything and nothing."
- Source: Uber: "avoid oscillating between rejecting everything and then rejecting nothing (which CoDel tends to do)".
- Problem: The post says CoDel "tends to" do this.
- Rewrite: Soften.

**T5** `Zalando rejected and comparison`. Severity: weak. Status: softened.
- Current: "ideas it did not test" and "are untested"
- Source: Zalando: "There are a few places in the system design that can help break this cycle. Autoscaling on queue depth…"
- Problem: The post lists them as ideas and does not say whether they were tried.
- Rewrite: Say what the post does.

**L1** `promise`. Severity: weak. Status: fixed.
- Current: "After this you can follow the topic page and the posts."
- Source: n/a
- Problem: Says nothing about the topic.
- Rewrite: Name the outcomes.

## Could not verify

- The two learn videos (Lyft, Netflix) cannot be watched; only their metadata is shown.
- The Uber post date 2023-11-22 comes from the existing entry; the fetched text shows no date line.
- Zalando post is dated 2026-10-08 on the page; no later check of whether the Zalando breaker was changed.
