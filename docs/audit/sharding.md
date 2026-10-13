# Content audit: sharding

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 1 |
| misleading | 4 |
| weak | 5 |
| style | 0 |

10 findings. Applied: 10 (fixed 9, softened 0, cut 1); left 0.

Verified clean: Figma figures (almost 100x, several TB and billions of rows, roughly nine months, under 10%, 90%, 10 s, under 1 s) and date 2024-03-14; Notion figures (480, 32, 15, 60K, 500 GB and 10 TB, about 3 days, 5 minutes, 32/40/48 vs 64) and date 2021-10-06; MongoDB, PostgreSQL partitioning and DynamoDB partition claims on the learn page; 4 of 5 Background quotes were verbatim as-is.

## Findings

**L1** `practice body[1]; misconception 4; canNow`. Severity: wrong. Status: fixed.
- Current: "The shard key is close to irreversible… changing it means redistributing everything."
- Source: MongoDB sharding page: "Starting in MongoDB 5.0, you can reshard a collection by changing a collection's shard key." and "While you can reshard your collection later, carefully consider your shard key choice".
- Problem: The cited page says the key can be changed (resharding); it only warns to choose carefully.
- Rewrite: Match the MongoDB page.

**T1** `Notion ageNote`. Severity: misleading. Status: fixed.
- Current: "…15 logical schemas per database, grown from 32 to 96 databases…"
- Source: Notion 2023 post: "partitions data into 15 separate logical schemas per database... tripling the number of instances from 32 to 96 machines... we went from having 15 schemas per shard to 5"; "no report or observation in our metrics of perceived user downtime".
- Problem: After the 2023 re-shard each of the 96 databases holds 5 schemas, not 15.
- Rewrite: Fix the count.

**T2** `Figma and Notion "no hash ring" statements (summary point 3, takeaways, diagram labels, comparison paragraph 1)`. Severity: misleading. Status: fixed.
- Current: "Figma does not use a hash ring"; "Notion does not use a hash ring"; "Neither Figma nor Notion uses a consistent hash ring".
- Source: Neither post mentions a hash ring. Figma: shard views over "a range of hashed keys"; Notion: "partition the UUID space into uniform buckets", fixed 480 logical shards.
- Problem: A claim about what they do not use is not in either post; what the posts describe is fixed ranges and a fixed shard count.
- Rewrite: Say what the posts describe.

**T3** `comparison paragraphs 2-3`. Severity: misleading. Status: fixed.
- Current: "both get the ring's main benefit… from a fixed set of shards"; "Figma, with many more tables to move, built a proxy".
- Source: Neither post compares itself to a ring; Figma says it sharded "groups of related tables" and a "complex relational data model"; Notion sharded "all tables reachable from the block table". No table counts are compared.
- Problem: The first is our reading; the second claim has no source.
- Rewrite: Label the reading; cut the table-count claim.

**T4** `Notion tradeoffs.rejected`. Severity: weak. Status: cut.
- Current: "…native table partitioning, and 512 shards."
- Source: "suppose we had 512 logical shards… we'd jump from 32 to 64 hosts" (an illustration, not an option Notion evaluated).
- Problem: 512 was a contrast, not a rejected alternative.
- Rewrite: Cut 512 from the list.

**T5** `Figma walkthrough "Test in the shadows"`. Severity: weak. Status: fixed.
- Current: "Real production queries were replayed against candidate shard keys"
- Source: "a 'shadow planning' framework, which allowed users to define potential sharding schemes... and then run shadow the logical planning phase on top of live production traffic."
- Problem: Shadow planning ran on live traffic; the post does not say queries were replayed.
- Rewrite: As quoted.

**T6** `lesson mentalModel`. Severity: weak. Status: fixed.
- Current: "Many designs fix the number of logical shards up front and move whole shards between machines, so adding machines never reshuffles individual keys."
- Source: Notion fixes 480 logical shards; Figma uses hash ranges with physical shard splits.
- Problem: "Many designs" and "never" are unsourced generalisations.
- Rewrite: Name Notion.

**T7** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common sharding mistakes"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**B1** `transaction-id-wraparound quote`. Severity: weak. Status: fixed.
- Current: "…a safety mechanism" (quote ends mid-sentence)
- Source: Notion: "While disk capacity can be increased, more worrying was the prospect of transaction ID (TXID) wraparound, a safety mechanism in which Postgres would stop processing all writes to avoid clobbering existing data."
- Problem: The quote stops before it says what the mechanism does.
- Rewrite: Complete the sentence.

**L2** `promise`. Severity: weak. Status: fixed.
- Current: "After this you can follow the topic page and the posts."
- Source: n/a
- Problem: Says nothing about the topic.
- Rewrite: Name the outcomes.

## Could not verify

- The MySQL ACID manual page (Background item acid-transactions) was blocked and had no Wayback copy; its explanation is generic and was not checked against that page.
- Notion's 2023 follow-up was read at /blog/the-great-re-shard; its other claims were not compared with the topic page.
- Figma post: the "hash ring" contrast is our framing; the post is silent on rings.
