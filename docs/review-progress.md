# Review progress

Working through the review in batches of four topics, committing after each. Each batch covers: learn page claims checked against the cited pages, source dates (a year only if the page shows one), Try it commands (must appear in the cited page or one it links to, no prompt characters, warnings on risky commands), post dates against the pages, and (for the 13 pending topics) the quiz rework.

## Batch 1: Failover, CAP, Consensus, Distributed Transactions

Done. Learn pages rewritten where the cited pages did not support a claim; sources added where the claim lives on a sub-page. Posts: displayed year, Original posts year and anchor id agree with each page's own date for all four topics (Percolator's page shows 2010 only; the month comes from the OSDI 2010 dates, not from the page).

Failover learn page: the RDS Multi-AZ failover page says failover changes the DNS record of the DB instance and AWS recommends a JVM DNS TTL of no more than 60 seconds. The learn page wrongly said a managed database avoids DNS caching; fixed.

## Batch 2: Event-driven, Caching, CDNs, Circuit Breakers

Done. Learn pages checked against the cited pages and rewritten where a sentence carried a citation the page does not support (for example Memcached's page does not describe cache-aside, and Redis's page does not state a default eviction policy). Caching, CDNs and Circuit Breakers quizzes reworked and removed from QUIZ_STYLE_PENDING. Microsoft Learn dates are rendered by script, so they were read in a browser. Posts: all dates agree with the pages.

## Batch 3: Consistent Hashing, Databases, DNS, Indexing

Done. Quizzes reworked and removed from QUIZ_STYLE_PENDING. Learn pages: several citations pointed at pages that do not say the thing (the Lucene landing page has nothing on inverted indexes or scoring; Redis Cluster's page says it does not use consistent hashing; PostgreSQL's concepts page has nothing on the planner), so the claims were re-sourced to pages that do, or the citation was dropped and the sentence left as general explanation. Try it commands replaced with ones that appear on the cited pages. Posts: all dates agree with the pages.

## Remaining

Batch 4: Load Balancing, Message Queues, Pub-Sub, Rate Limiting. Batch 5: Replication, Sharding. Then: checks and rendering code, quiz rework for the 13 pending topics (as each batch lands), full build, verify:figures, search check.
