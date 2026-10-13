# Content audit: cap

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 0 |
| misleading | 3 |
| weak | 3 |
| style | 1 |

7 findings. Applied: 7 (fixed 3, softened 3, cut 1); left 0.

Verified clean: Dynamo: (3,2,2), 99.94% of requests saw one version over 24 hours, last write wins, always-writeable, vector-clock and preference-list claims; Spanner: TrueTime 1 to 7 ms, commit wait about 5 ms and Paxos about 9 ms in the one-replica test, under 1 ms between datacenters, 50 MB directory in a few seconds, F1 moving off sharded MySQL, one Paxos state machine per tablet; DynamoDB read-consistency claims including half the cost; Cassandra last-write-wins, mutation timestamps and replication factor; Spanner TrueTime page claims; post dates and ages.

## Findings

**T1** `Dynamo constraints; numbers row 1; summary figure 1`. Severity: misleading. Status: fixed.
- Current: "The headline requirement is a service level agreement… 99.9% of read and write requests must execute within 300 ms."; "The SLA Dynamo is built to"; "Dynamo's SLA".
- Source: Dynamo paper §2.2: "An example of a simple SLA is a service guaranteeing that it will provide a response within 300ms for 99.9% of its requests for a peak client load of 500 requests per second"; "SLAs are expressed and measured at the 99.9th percentile of the distribution". §6: "the 99.9th percentile latencies are around 200 ms".
- Problem: The 300 ms figure is the paper's example SLA, not a Dynamo requirement; Dynamo's measured 99.9th percentile was around 200 ms.
- Rewrite: Call it the example SLA.

**T2** `Spanner constraints and failures`. Severity: weak. Status: softened.
- Current: "…which is the opposite CAP stance from Dynamo."; "…which is the availability price of choosing consistency."
- Source: The Spanner paper never mentions CAP; "partition" appears only for data partitions.
- Problem: The CAP framing is ours, not the paper's.
- Rewrite: Label the framing.

**T3** `Dynamo ageNote`. Severity: misleading. Status: softened.
- Current: "…now offers strongly consistent reads and transactions"
- Source: The AWS read-consistency page confirms strongly consistent reads; transactions were not checked on an opened page.
- Problem: A claim without an opened source.
- Rewrite: Keep what was confirmed.

**T4** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common misreadings of CAP"
- Source: n/a
- Problem: No source ranks misreadings.
- Rewrite: Drop "most common".

**L1** `basics body[0], body[1]; promise`. Severity: weak. Status: softened.
- Current: The CAP statement and the "pick two" remark are cited to no page.
- Source: None of the four cited pages states the theorem (DynamoDB and Cassandra pages describe their own settings).
- Problem: The learn page is official-sources-only; two general statements need a label.
- Rewrite: Label them.

**B1** `paxos quote`. Severity: weak. Status: fixed.
- Current: "Our Paxos implementation supports long-lived leaders with time-based leader leases, whose length defaults to 10 seconds."
- Source: Spanner: "To support replication, each spanserver implements a single Paxos state machine on top of each tablet."
- Problem: The quote is about leader leases, not about what Paxos does here.
- Rewrite: Use the replication sentence.

**B2** `paxos and two-phase-commit gists`. Severity: style. Status: cut.
- Current: "The gist is enough here."
- Source: n/a
- Problem: Repeated filler.
- Rewrite: Delete.

## Could not verify

- DynamoDB transactions (in the Dynamo ageNote) were not checked on an opened page and were cut.
- Paper dates 2007-10-14 and 2012-10-08 were taken from the existing entries (conference dates), not from the PDFs, which show only the proceedings line.
- The Cassandra phrase "quorum intersection ... generally visible" was matched by keyword, not read in full context.
