# Content audit: consensus

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 0 |
| misleading | 3 |
| weak | 4 |
| style | 0 |

7 findings. Applied: 6 (fixed 5, softened 1, cut 0); left 1.

Verified clean: etcd performance figures (about 50 ms US and up to 400 ms intercontinental, several hundred microseconds in a datacenter, fdatasync about 10 ms spinning and under 1 ms SSD, over 30,000 requests per second under heavy load, snapshots can double latency on HDD) and the page last-modified date; CockroachDB figures (up to 85%, hundreds of thousands or millions of Ranges, TLA+ verification, recovery within seconds) and date 2026-05-26; Raft page and paper claims (five servers tolerate two failures, heartbeat lease assumes bounded clock skew); etcd-why single replication group and split-brain statements; Kubernetes etcd odd members and five-member recommendation; all 3 Background quotes.

## Findings

**T1** `comparison paragraph 2; etcd takeaways; learn practice[0]`. Severity: misleading. Status: fixed.
- Current: "the guide's advice is to shrink them (SSDs, nearby members) and batch"; "You make consensus faster by shrinking those, with SSDs and co-located members, and by batching requests"
- Source: etcd guide: gives the round-trip and fdatasync figures and says "To increase throughput, etcd batches multiple requests together". It gives no advice about SSDs or nearby members.
- Problem: Advice attributed to the guide that it does not give.
- Rewrite: Say what the guide gives.

**L2** `practice body[0]`. Severity: misleading. Status: fixed.
- Current: see T1
- Source: see T1
- Problem: Advice attributed to the guide that it does not give.
- Rewrite: Say what the guide gives.

**T2** `comparison paragraph 2-3`. Severity: weak. Status: fixed.
- Current: "One post says 'here is the floor you cannot beat'; the other says 'here is overhead above the floor that you can.'"; "a cost the software created for itself"
- Source: Neither post says these sentences.
- Problem: Invented quotations and a loaded phrase.
- Rewrite: No quotation marks.

**T3** `Cockroach takeaways`. Severity: weak. Status: fixed.
- Current: "…removed a per-Range overhead that only showed at scale"
- Source: "as a cluster grows to hundreds of thousands or even millions of Ranges, the constant renewal traffic adds up to a substantial CPU cost".
- Problem: "Only showed at scale" is stronger than "adds up as the cluster grows".
- Rewrite: As quoted.

**T4** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common mistakes in reasoning about consensus"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**L1** `deeper body[2]; promise`. Severity: weak. Status: softened.
- Current: "An even number buys nothing extra: four nodes tolerate the same single failure as three…" cited next to the Kubernetes docs.
- Source: kube-etcd: "You should run etcd as a cluster with an odd number of members"; "A five-member cluster is recommended in production". It does not give the three-versus-four reasoning.
- Problem: The arithmetic is general reasoning, not on the cited page.
- Rewrite: Label it.

**N1** `Cockroach post (selection note, no edit)`. Severity: weak. Status: left.
- Current: The blog post is an announcement of a SIGMOD paper with a key-takeaways box and FAQ; the 85% figure is stated as "in our experiments" with no detail.
- Source: Post text: "We are pleased to announce that Cockroach Labs has a new paper appearing at SIGMOD 2026".
- Problem: The page treats an announcement as a post; the paper itself would be the stronger source. Not changed: replacing the source needs approval under the post-selection rules.

## Could not verify

- The Cockroach Labs post is an announcement of the SIGMOD 2026 paper; the paper was not opened, so the 85% figure rests on the announcement alone.
- The Raft paper PDF was read as extracted text; the "quite difficult to understand" quotation was not matched because of line-break hyphenation.
- General Raft mechanics in the lesson (randomised timeouts, vote only for an up-to-date log) come from the Raft paper, which is cited on the learn page but not on the topic page.
