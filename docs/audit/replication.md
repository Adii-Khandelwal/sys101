# Content audit: replication

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 1 |
| misleading | 4 |
| weak | 5 |
| style | 1 |

11 findings. Applied: 11 (fixed 10, softened 0, cut 1); left 0.

Verified clean: Meta numbers (about 2 s vs 20 to 40 s, about 10x, 2 of 3, 500 ms and 3 missed heartbeats, about 300 ms, 10 to 100 ms, millions of shards) and date 2023-05-16; GitHub numbers (10 to 13 s, up to 20 s, up to 25 s, 500 ms, 1 or 2 orchestrator nodes) and date 2018-06-20 (updated 2020-05-21); MySQL replication claims on the learn page (asynchronous by default, scale-out, backups on a replica, binary-log method; Wayback copy); PostgreSQL log-shipping, lag, promote and multimaster claims; Raft page claims; all 9 Background quotes.

## Findings

**T1** `Meta tradeoffs.rejected`. Severity: wrong. Status: fixed.
- Current: "Stock Raft with one global quorum, joint consensus for changing several members at once, automatic repair of a lost quorum, and leaderless protocols."
- Source: Meta: "Some of the more speculative ideas... are about exploring leaderless protocols, like Epaxos. Our current deployments... have worked with the assumptions that come with strong leader protocols". And: "Apache Kudu did not have support for joint consensus, hence we only allow one-at-a-time membership changes."
- Problem: Leaderless protocols are something Meta is exploring, not something it rejected; joint consensus was unavailable in Kudu's Raft, not weighed and rejected.
- Rewrite: As quoted.

**T2** `summary point 3 and Meta takeaways`. Severity: misleading. Status: fixed.
- Current: "…removes a whole class of coordination bugs."
- Source: "Realizing that control plane operations like promotions and membership changes were the trigger of most issues... This was the single biggest contribution of bringing in Raft because it enabled provable correctness (safety property) across promotions and membership changes".
- Problem: "Removes a whole class of bugs" is our wording; the post claims provable safety across promotions and membership changes.
- Rewrite: Match the post.

**T3** `comparison paragraphs 2-3`. Severity: misleading. Status: fixed.
- Current: Compares GitHub "outages of 10 to 13 seconds" with Meta "about 2 seconds".
- Source: GitHub: total outage time = detect + failover + advertise. Meta: "Raft typically does a failover within 2 seconds... heartbeat every 500 milliseconds and start an election when three successive heartbeats fail"; and in the old setup "the clients noticing the finish of promotion would be much longer".
- Problem: The two figures are not measured the same way.
- Rewrite: Add the caveat.

**T4** `lesson workedExample diagram note`. Severity: weak. Status: fixed.
- Current: "Detection and promotion are where the failover seconds are spent."
- Source: GitHub: "The time it takes to detect a failure, run the failover and advertise the new primary's identity makes up the total outage time."
- Problem: Omits advertising, and neither post splits the seconds this way.
- Rewrite: Match the post.

**T5** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common replication mistakes"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**T6** `Meta constraints`. Severity: weak. Status: fixed.
- Current: "The binary log format had to stay the same"
- Source: "For replication, MySQL has historically used the binary log format... we decided to preserve this."
- Problem: A choice, not a stated requirement.
- Rewrite: Call it a decision.

**T7** `GitHub tradeoffs.why`. Severity: weak. Status: fixed.
- Current: "The proxies hide which client sent a query, and a short semi-synchronous timeout trades a little safety for availability."
- Source: "The proxy layer makes the apps unaware of the primary's identity, but it also masks the apps' identities from the primary." (listed under limitations)
- Problem: A limitation sits in the "why" with no signal that it is a cost.
- Rewrite: Mark it as a cost.

**L1** `basics body[0], body[1]; reading`. Severity: misleading. Status: fixed.
- Current: Chapter-introduction sentences cited to the 26.1 comparison page.
- Source: The sentences about "high availability... load balancing" and "read/write, master or primary servers... standby or secondary servers" are on https://www.postgresql.org/docs/current/high-availability.html (chapter 26 introduction), not on the 26.1 page (different-replication-solutions).
- Problem: Wrong source for two claims.
- Rewrite: Cite the chapter page; add it to sources and reading.

**L2** `how body[1]; misconception 3`. Severity: weak. Status: fixed.
- Current: "…both the primary and the standby, and data can then be lost only if both are damaged at once"
- Source: "The only possibility that data can be lost is if both the primary and the standby suffer crashes at the same time."
- Problem: Near-copy, and "damaged" for "crash at the same time".
- Rewrite: Own words, source wording.

**L3** `promise`. Severity: weak. Status: fixed.
- Current: "After this you can follow the topic page and the posts."
- Source: n/a
- Problem: Says nothing about the topic.
- Rewrite: Name the outcomes.

**B1** `four taught-later gists`. Severity: style. Status: cut.
- Current: "The gist is enough here."
- Source: n/a
- Problem: Repeated filler.
- Rewrite: Delete.

## Could not verify

- MySQL manual pages were blocked for direct curl; the learn and Background claims were checked on Wayback copies of 2026-08-31 and 2026-08-23.
- GitHub post "Updated May 21, 2020": the topic page does not say what changed in the update.
- The Raft consensus description on the learn page was checked on raft.github.io only, not in the Raft paper.
