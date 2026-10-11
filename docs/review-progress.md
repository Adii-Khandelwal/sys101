# Review progress

Working through the review in batches of four topics, committing after each. Each batch covers: learn page claims checked against the cited pages, source dates (a year only if the page shows one), Try it commands (must appear in the cited page or one it links to, no prompt characters, warnings on risky commands), post dates against the pages, and (for the 13 pending topics) the quiz rework.

## Batch 1: Failover, CAP, Consensus, Distributed Transactions

Done. Learn pages rewritten where the cited pages did not support a claim; sources added where the claim lives on a sub-page. Posts: displayed year, Original posts year and anchor id agree with each page's own date for all four topics (Percolator's page shows 2010 only; the month comes from the OSDI 2010 dates, not from the page).

Failover learn page: the RDS Multi-AZ failover page says failover changes the DNS record of the DB instance and AWS recommends a JVM DNS TTL of no more than 60 seconds. The learn page wrongly said a managed database avoids DNS caching; fixed.

## Remaining

Batch 2: Event-driven, Caching, CDNs, Circuit Breakers. Batch 3: Consistent Hashing, Databases, DNS, Indexing. Batch 4: Load Balancing, Message Queues, Pub-Sub, Rate Limiting. Batch 5: Replication, Sharding. Then: checks and rendering code, quiz rework for the 13 pending topics (as each batch lands), full build, verify:figures, search check.
