# Content audit: indexing

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 0 |
| misleading | 3 |
| weak | 6 |
| style | 1 |

10 findings. Applied: 10 (fixed 9, softened 0, cut 1); left 0.

Verified clean: GitHub figures (about 8 million, almost 45 million, 115 TB, 15.5 billion, 2,048 cores for 96 s, about 100 ms p99, 640 per second, 120,000 per second, 36 to 18 hours, 25 TB index) and date 2023-02-06; Discord figures (~40%, over 200 nodes, ~2 billion, 200M and 50GB, 40 clusters, double throughput, 500 ms to under 100 ms, 1 s to under 500 ms) and date 2025-04-24; PostgreSQL index, hash, multicolumn and planner claims; Elasticsearch analysis, shard and near-real-time claims; Lucene postings and similarity claims; 4 of 5 other Background quotes.

## Findings

**T1** `GitHub problem`. Severity: weak. Status: fixed.
- Current: "…without stemming or dropping common words, which general text search does badly."
- Source: "we haven't had a lot of luck using general text search products to power code search. The user experience is poor, indexing is slow, and it's expensive to host." The requirements (punctuation, no stemming, no stop words, regex) are listed separately.
- Problem: Merges two points: the requirements, and the poor experience of general products.
- Rewrite: Separate the two.

**T2** `GitHub tradeoffs.why`. Severity: misleading. Status: fixed.
- Current: "…scanning was thousands of times too slow."
- Source: Only: grep over 115 TB would be "0.01 queries per second"; one shard host can serve "something like 640 queries per second".
- Problem: "Thousands of times" is our arithmetic, not a figure the post gives.
- Rewrite: Use the post's figure.

**T3** `GitHub takeaways`. Severity: misleading. Status: fixed.
- Current: "grams that match too much cost as much as no index."
- Source: "For common grams like for trigrams aren't selective enough. We get way too many false positives and that means slow queries."
- Problem: "As much as no index" is not in the post.
- Rewrite: Say what the post says.

**T4** `Discord constraints`. Severity: weak. Status: fixed.
- Current: "Elastic's recommendation is to keep an index under 200M messages and 50GB."
- Source: "each index could stay within the recommendation of 200M messages and 50GB of data" (no source named).
- Problem: The post does not say whose recommendation it is.
- Rewrite: Do not name the author.

**T5** `Discord failures; numbers "~40%"`. Severity: weak. Status: fixed.
- Current: Failures omit the Redis queue dropping messages; the 40% omits its assumption.
- Source: "when our indexing queue got backed up... the Redis cluster became a source of failure that began dropping messages"; "assuming an equal distribution, the odds... are ~40%".
- Problem: Missing a failure the post lists first, and a condition on the 40%.
- Rewrite: Add both.

**T6** `lesson workedExample "Add an inverted index"`. Severity: weak. Status: fixed.
- Current: "…one 64-core host can serve something like 640 queries per second."
- Source: "our 64 core hosts have an upper bound of something like 640 queries per second."
- Problem: Drops "upper bound".
- Rewrite: Add "upper bound".

**T7** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common indexing mistakes"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**B1** `elasticsearch-lucene first quote`. Severity: weak. Status: fixed.
- Current: GitHub quote about Elasticsearch taking months to index.
- Source: Discord: "Each of our Elasticsearch indices is a single Lucene index under the hood" (replaces the Discord MAX_DOC quote, which says nothing about how Elasticsearch relates to Lucene).
- Problem: The quote does not show that Elasticsearch is built on Lucene.
- Rewrite: Use the Discord sentence as the second quote.

**B2** `pub-sub gist`. Severity: style. Status: cut.
- Current: "The gist is enough here."
- Source: n/a
- Problem: Repeated filler.
- Rewrite: Delete.

**L1** `practice body[2]; promise`. Severity: weak. Status: fixed.
- Current: "…running each query on every shard and merging results [[es-docs]]" presented as sourced; filler promise.
- Source: es-docs: "Elasticsearch divides each index into shards and distributes them across the nodes in your cluster." It does not describe fan-out.
- Problem: Fan-out is general practice, not stated by the cited page (the how stage already says so).
- Rewrite: Label it.

## Could not verify

- Whether "foxes reduced to fox" appears in the Elasticsearch analysis page text was not confirmed beyond the tokenization and normalization paragraphs.
- The learn page's EXPLAIN example output (bitmap index scan on tenk1) was not re-read on the PostgreSQL page.
- The claim that clients report the Lucene/ES refresh interval default of one second was checked against the near-real-time page only.
