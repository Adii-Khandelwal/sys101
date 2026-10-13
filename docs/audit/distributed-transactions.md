# Content audit: distributed-transactions

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 0 |
| misleading | 2 |
| weak | 3 |
| style | 0 |

5 findings. Applied: 4 (fixed 4, softened 0, cut 0); left 1.

Verified clean: Percolator (on the USENIX PDF): about 4x worst-case overhead, around 2 million timestamps per second, primary-lock commit point, 50% younger documents, much smoother resource usage, MapReduce re-run over the whole repository; CockroachDB pipelining post: slope 6 vs 2, a little under half a millisecond per extra statement, RETURNING NOTHING, buffering prototype aborts at serializable isolation, parallel commits previewed, "inspired in part by Google Percolator", date 2019-01-10; CockroachDB transactions page (all-or-nothing, SERIALIZABLE by default); Microsoft saga pivot and irreversible steps; all 4 Background quotes (the two Percolator quotes verified on the PDF text).

## Findings

**T1** `Percolator tradeoffs.rejected and .why`. Severity: misleading. Status: fixed.
- Current: "…the option of a new storage layer rather than building on Bigtable."; "a transaction protocol over the existing store was cheaper than a new database"; "far fresher indexes and much smoother resource use".
- Source: Percolator paper: MapReduce "must be run again over the entire repository"; "reducing the average age of documents in Google search results by 50%" at the same number of documents per day; "Percolator's much smoother resource usage". No new storage layer was weighed.
- Problem: One rejected option and one cost claim have no source; the benefit can be stated with the paper's own figure.
- Rewrite: Use the paper's figure.

**T2** `lesson exercise 2 (design) tradeoffs`. Severity: weak. Status: fixed.
- Current: "Percolator reports roughly a factor-of-four overhead versus raw Bigtable"
- Source: "worst case... writes a single cell and then commit... roughly a factor of four overhead on this benchmark".
- Problem: Drops the benchmark condition.
- Rewrite: Add the condition.

**T3** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common mistakes with distributed transactions"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**L1** `promise`. Severity: weak. Status: fixed.
- Current: "After this you can follow the topic page and the posts."
- Source: n/a
- Problem: Says nothing about the topic.
- Rewrite: Name the outcomes.

**N1** `Percolator url (note, no edit)`. Severity: weak. Status: left.
- Current: The entry links the research.google abstract page.
- Source: The numbers and quotes were checked on the paper PDF at usenix.org/legacy/event/osdi10/tech/full_papers/Peng.pdf; the abstract page alone lacks them.
- Problem: A reader following the link finds only the abstract.

## Could not verify

- The Percolator numbers are on the USENIX PDF, not on the research.google abstract page that the entry links; the topic link was left unchanged.
- The Spanner transactions page claims about write skew and external consistency on the learn page were not re-read line by line.
- Percolator's description of the client acting as coordinator was not compared with the digest wording "no coordinator is needed on the read path".
