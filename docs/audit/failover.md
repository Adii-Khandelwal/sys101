# Content audit: failover

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 1 |
| misleading | 4 |
| weak | 4 |
| style | 0 |

9 findings. Applied: 9 (fixed 9, softened 0, cut 0); left 0.

Verified clean: GitHub figures (10 to 13 seconds, up to 20 and 25 seconds), date 2018-06-20 with update 2020-05-21, VIP and DNS failure modes, holistic detection, orchestrator/raft, Consul KV, GLB/HAProxy, DC isolation; AWS static stability figures (50 percent, 66 percent, 4/9 versus 2/3, three or more zones, RDS repoint, leader election, zonal calendar, NAT gateway, control and data plane, gray failures) and page dates; learn page claims against RDS Multi-AZ pages (60 to 120 seconds, 60-second JVM TTL, synchronous standby, reboot with failover), Cloudflare load balancing health, Orchestrator failure detection and AWS health checks (shallow to deep, fail open); background quotes.

## Findings

**T1** `GitHub failures`. Severity: wrong. Status: fixed.
- Current: "The new design still has limits it names, including that failover is not instantaneous and that split-brain mitigation is partly still in the works."
- Source: GitHub, Limitations and drawbacks: the proxy "masks the apps' identities from the primary"; on a data center isolation apps in the isolated DC "are still able to write to the primary" and "there could be a short period of split-brain"; "the outage of Consul at the time of the failover; partial DC isolation" are other scenarios; "Split-brain mitigation (more in the works)".
- Problem: "Not instantaneous" is not a limit the post names, and the real named limits are missing.
- Rewrite: Use the limits the post names.

**T2** `GitHub takeaway`. Severity: misleading. Status: fixed.
- Current: "Doing all three is what takes GitHub's outage window down to around ten seconds…"
- Source: GitHub: "Between 10 and 13 seconds of total outage time in most cases"; the post does not attribute the figure to the three parts together.
- Problem: Causal claim stronger than the post.
- Rewrite: Report the figure, label the reading.

**T3** `AWS failures`. Severity: weak. Status: fixed.
- Current: "…and capacity that is paid for before it is needed."
- Source: aws-static-stability-azs: states "overprovision by 50 percent" and names the cost as "additional complexity"; no passage prices or discusses the spare capacity.
- Problem: A cost the article does not state.
- Rewrite: Say what the article does.

**T4** `lesson workedExample steps and diagram`. Severity: misleading. Status: fixed.
- Current: "…because detection is quorum-based…"; "~10 seconds to recover: quorum detection + proxy redirect"
- Source: GitHub: detection is by orchestrator (holistic, replicas agree); only the failover decision runs on the raft leader; "10 and 13 seconds … in most cases".
- Problem: Detection is not quorum-based in the post, and the causes of ten seconds are asserted.
- Rewrite: Use the post's statement.

**T5** `lesson workedExample step 4`. Severity: misleading. Status: fixed.
- Current: "The old primary is fenced so it cannot accept writes if it returns…"
- Source: GitHub: orchestrator sets "the old primary as read_only, if possible"; "there could be a short period of split-brain"; STONITH "we are working to mitigate".
- Problem: Presents fencing as complete; GitHub's own post does not claim that.
- Rewrite: State the limit.

**T6** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common failover mistakes"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**L1** `promise`. Severity: weak. Status: fixed.
- Current: "After this you can follow the topic page and the posts."
- Source: n/a
- Problem: Says nothing about the topic.
- Rewrite: Name the outcomes.

**L2** `basics bullet 3, how bullet 2, deeper bullet 3`. Severity: weak. Status: fixed.
- Current: Unlabelled framing: "The reason this is hard…", "Deciding on a replacement must yield exactly one winner…", "With asynchronous replication a promoted replica may be slightly behind…".
- Source: No cited passage says these.
- Problem: Our own explanation not marked as such.
- Rewrite: Label.

**L3** `practice bullet 3 and canNow`. Severity: weak. Status: fixed.
- Current: "The RDS page shows how much the third step can matter…" and "can dominate recovery time"
- Source: aws-rds-failover: "Failover times are typically 60–120 seconds"; the DNS record changes and "you need to re-establish any existing connections".
- Problem: The page does not say client discovery dominates recovery time.
- Rewrite: Match the page.

## Could not verify

- The AWS static stability page shows "Published Oct 2, 2026"; the true age is unknown, as the existing entry says.
- The GitHub post says "adding" components; its current stack was not checked against newer GitHub material.
- The lesson page is general concept text and was checked against the posts only where it cites them.
