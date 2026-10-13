# Content audit: load-balancing

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 1 |
| misleading | 6 |
| weak | 8 |
| style | 1 |

16 findings. Applied: 16 (fixed 14, softened 0, cut 2); left 0.

Verified clean: Uber figures (100,000,000 connections, 100 to 100,000 QPS, 15 to 30% on 8 services, up to 40%, under 0.01% hosts, about 6 months, 36 services); Dropbox figures (1.26 to 1.01, 1.4 to 1.05, 25% fleet reduction, 15% missing reports, 100/200 at 30% gives 170); both post dates (2022-05-17, 2024-10-23); NGINX weight example, HAProxy health-check, stickiness and keepalived claims; RFC 9110 idempotent text; all 5 Background quotes except B1.

## Findings

**T1** `Dropbox digest.problem`. Severity: wrong. Status: cut.
- Current: "Teams responded by buying extra capacity to stay safe."
- Source: Not in the Dropbox post. (The extra-capacity point is Uber's: "bad load balancing results in resource overallocation".)
- Problem: Attributes to Dropbox something its post does not say.
- Rewrite: Delete the sentence.

**T2** `Dropbox summary point 4 and takeaways`. Severity: misleading. Status: fixed.
- Current: "Dropbox advises picking a load signal that cannot look healthy while the server is stuck." / "Pick a load signal that cannot look healthy while the server is stuck."
- Source: Footnote 3: stuck-disk nodes kept low CPU and "LBS starts increasing the weight of the node... leading to a dead spiral... we ended up using the maximum of CPU and in-flight requests". The "What we learned" list does not include this advice.
- Problem: The post reports what Dropbox did, not advice in those words.
- Rewrite: Report what Dropbox did.

**T3** `Dropbox failures, last sentence`. Severity: weak. Status: fixed.
- Current: "Migrating every service took far longer than planned because migration was not designed in from the start."
- Source: "The migration process for Robinhood was not well-designed from the very beginning, so we ended up spending much more time than expected reimplementing the process and redesigning the configuration."
- Problem: The extra time went on reimplementing the process and redesigning the configuration.
- Rewrite: As quoted.

**T4** `Uber constraints`. Severity: weak. Status: fixed.
- Current: "Connecting everything to everything is impossible at that size." / "…and work without proxies coordinating with each other."
- Source: "if a service with 10,000 tasks attempted to call another service with 10,000 tasks, we'd need 100,000,000 TCP connections"; "The task selection still remains random—there is still no coordination between the proxies."
- Problem: "Impossible" is stronger than the post, and no-coordination is a design choice, not a stated requirement.
- Rewrite: Use the post's figure and call coordination a choice.

**T5** `Uber numbers "17 of 36"; "15 to 30%"`. Severity: misleading. Status: fixed.
- Current: "Large services whose p99 CPU fell by 10% or more after rollout"
- Source: "Out of 36 services, 17 have shown 10%+ p99 CPU utilization reduction... We don't have precise data to claim the exact numbers... the onboarding coincided with COVID-19."
- Problem: They were the last "power-services" to onboard, not "large services", and the post says it lacks precise data for the wider rollout.
- Rewrite: Name the group and the caveat.

**T6** `Uber tradeoffs.rejected`. Severity: misleading. Status: fixed.
- Current: "Fixed subset sizes with manual tuning, least-pending-request balancing, deterministic subsets that need proxies to coordinate, and tracking load per caller or per procedure."
- Source: Least-pending was what proxies were already using ("wasn't working well enough"); deterministic subsets and per-caller tracking were "discussed... but do not plan to implement".
- Problem: Mixes what Uber dropped, what it found insufficient and what it only considered.
- Rewrite: Separate the three.

**T7** `lesson workedExample "Reuse existing signals"`. Severity: misleading. Status: fixed.
- Current: "On 17 of 36 large services, p99 CPU fell by 10% or more." / "…so the totals came back within seconds without new infrastructure."
- Source: Same as T5; the post says it reused the existing control plane and sent aggregated reports back to proxies.
- Problem: Same group and caveat issue; "without new infrastructure" is stronger than "leveraged the existing architecture".
- Rewrite: Match the post.

**T8** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common ways load balancing goes wrong"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**T9** `Exercise 2 (design) tradeoffs`. Severity: weak. Status: fixed.
- Current: "…per-client logic reacts faster but takes months to roll out."
- Source: Dropbox: "It can take several months to roll out changes to internal clients". Nothing says client logic reacts faster.
- Problem: Unsupported comparison.
- Rewrite: Say only what Dropbox says.

**L1** `basics body[0]`. Severity: weak. Status: fixed.
- Current: "…a common technique for optimising resource utilisation, maximising throughput, reducing latency and improving fault tolerance [[nginx-lb]]."
- Source: "Load balancing across multiple application instances is a common technique for optimizing resource utilization, maximizing throughput, reducing latency, and improving fault-tolerance."
- Problem: Near-copy.
- Rewrite: Own words.

**L2** `how body[0]`. Severity: weak. Status: fixed.
- Current: "NGINX lists algorithms ranging from basic Round Robin to Least Connections, Least Time and hashing-based methods."
- Source: "Random (NGINX Plus only)"; "least_time header" listed as NGINX Plus.
- Problem: Omits that some methods are NGINX Plus features.
- Rewrite: Add the condition.

**L3** `practice body[0]`. Severity: misleading. Status: fixed.
- Current: "…which helps caches on that backend stay warm…"; "its counters need a shared memory zone to work as expected"
- Source: NGINX: "If an upstream block does not include the zone directive, each worker process keeps its own copy... and maintains its own set of related counters." Nothing in the cited pages says hashing keeps caches warm.
- Problem: One claim has no source; the other overstates.
- Rewrite: Cut the cache claim; restate the NGINX point.

**L4** `practice body[2]`. Severity: weak. Status: fixed.
- Current: "Layer 7 balancers are also where retries happen: RFC 9110 says…"
- Source: RFC 9110 §9.2.2: "the request can be repeated automatically if a communication failure occurs before the client is able to read the server's response."
- Problem: The RFC does not say balancers are where retries happen.
- Rewrite: Reword.

**L5** `promise`. Severity: weak. Status: fixed.
- Current: "After this you can follow the topic page and the posts."
- Source: n/a
- Problem: Says nothing about the topic.
- Rewrite: Name the outcomes.

**B1** `service-discovery quote`. Severity: weak. Status: fixed.
- Current: A quote stitched from three list items (traffic assignment, discovery, proxy shared).
- Source: Uber: "This system interfaces with cluster management to keep the most up-to-date information about the service backend tasks."
- Problem: The first quote runs three separate bullet lines together.
- Rewrite: Use one sentence.

**B2** `eventual-consistency gist`. Severity: style. Status: cut.
- Current: "The gist is enough here."
- Source: n/a
- Problem: Repeated filler.
- Rewrite: Delete.

## Could not verify

- Uber post says rollout was ~18-12 months before writing; the "nearly 2 years" in production line was not compared with our text beyond the figures above.
- The learn page's F5 glossary and HAProxy layer-4/7 paragraphs were spot-checked, not read end to end.
- Quiz Q1 and the DNS-caching claim in lesson.why rely on the DNS topic and its sources, not on these posts.
