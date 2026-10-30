# Say it in 30 seconds: sources, batch B (18 topics)

Each line is one sentence of the topic's `thirtySeconds` text and the JSON path it came from. `lesson` paths are under `lesson.`; `posts[n]` is by order in the file. Word counts counted by whitespace. The last sentence of each is the company example; its year is the post's published year.

## log-based-streaming (89 words)
1. concept; lesson.mentalModel.body (tape, bookmark)
2. concept (many consumers, go back and read again); lesson.why.body
3. lesson.howItWorks.steps[0] (hash a key), steps[3] (offset per partition)
4. lesson.howItWorks.steps[1], steps[4]; mistakes[0]
5. posts[0] (LinkedIn, 2013-12-16) digest.numbers[0] (Over 60 billion writes per day); tradeoffs.chosen (one central log)

## message-queues (88)
1. lesson.why.body
2. lesson.mentalModel.body (lease, acknowledge); steps[1], [2]
3. lesson.mentalModel.body (redelivery, at-least-once); steps[3]
4. steps[4] (idempotent), steps[5] (dead-letter queue)
5. posts[0] (Slack, 2017-12-06) digest.numbers[0] (over 1.4 billion, busiest days)

## object-storage (83)
1. concept; lesson.why.body (billions of large things, petabytes)
2. concept; lesson.mentalModel.body (ledger and warehouse); concept (copies or erasure coding)
3. mistakes[0] (no partial edit), mistakes[1] (metadata lookup decides throughput)
4. posts[0] (Amazon, 2023-07-27) digest.numbers[4] (tens of drives) and tradeoffs.chosen (own set of drives)

## observability-and-slos (80)
1. concept
2. concept; lesson.howItWorks.steps[0], [2], [3]
3. steps[1] (average hides the tail), steps[5] (traces)
4. posts[3] (Meta, 2017-10-28) digest.numbers[0] (1.3 billion traces per day)

## online-schema-migrations (83)
1. concept
2. concept (lock or days)
3. lesson.howItWorks.steps[1], [2], [3], [4]
4. steps[5]; mistakes[1]
5. posts[0] (Buildkite, 2021-03-25) digest.numbers[0] (over 2 billion rows)

## overload-and-cascading-failures (85)
1. concept
2. lesson.howItWorks.steps[2], [3]
3. concept (stay down after the cause is gone); steps[4]
4. steps[6]; mistakes[1], mistakes[2]
5. posts[0] (Slack, 2021-02-01) digest.numbers[0] (1,200 servers); mistakes[2]

## probabilistic-data-structures (91)
1. concept
2. concept (Bloom filter); lesson.howItWorks.steps[1] (0 bit skips the file)
3. steps[2] (bits per key)
4. mistakes[0]
5. posts[0] (Meta, 2021-07-09) digest.numbers[2] (roughly 1/3 memory saved)

## pub-sub (90)
1. concept
2. concept; lesson.howItWorks.steps[1], [2]
3. steps[3] (at-least-once)
4. steps[4], steps[5]
5. posts[1] (Uber, 2021-08-31) digest.numbers[1] (over 300 microservices) and tradeoffs.chosen (a proxy that pushes messages)

## rate-limiting (89)
Text copied verbatim from docs/drafts/thirty-second-answers.md. Sources as listed there.

## real-time-delivery (87)
1. concept
2. concept; lesson.howItWorks.steps[1], [2]
3. steps[4], steps[5]; mistakes[1] (random delay)
4. mistakes[0] (most connections sit idle)
5. posts[1] (Netflix, 2024-09-10) digest.numbers[2] (200,000 connections per node) and tradeoffs.chosen (scaled on connection count)

## replication (85)
1. concept
2. lesson.howItWorks.steps[0], [1]
3. steps[2]
4. steps[3], [4]
5. posts[0] (Meta, 2023-05-16) digest.numbers[0] (about 2 s vs 20 to 40 s)

## safe-deployments (82)
1. concept
2. lesson.howItWorks.steps[1], [2], [3], [4]
3. steps[5]
4. posts[0] (Amazon Web Services, 2020-06-18) digest.numbers[1] (ten percent) and numbers[0] (four or five business days)

## sharding (88)
1. concept
2. lesson.howItWorks.steps[0], [1], [2]
3. steps[2], steps[3]
4. steps[5]
5. posts[1] (Notion, 2021-10-06) digest.numbers[0] (480 logical shards), numbers[1] (32 physical databases) and tradeoffs.chosen (workspace ID)

## storage-engines (86)
1. concept
2. concept (B-tree sorted pages in place)
3. concept (LSM-tree); lesson.howItWorks.steps[0], [1], [2], [3]
4. steps[4] (a delete is a write)
5. posts[1] (Discord, 2023-03-06) digest.numbers[0] (12 nodes to 177 nodes; 177 nodes to 72 nodes after the move)

## stream-vs-batch-processing (86)
1. concept
2. concept
3. lesson.howItWorks.steps[1], [2]
4. steps[4]; concept (Lambda and Kappa)
5. posts[0] (Uber, 2020-01-23) digest.numbers[1] (nine days, roughly 10 terabytes) and tradeoffs.chosen (Hive table as a streaming source)

## time-clocks-and-consistency (85)
1. concept
2. lesson.howItWorks.steps[0], [1]
3. concept (three answers); steps[5] (Lamport clock), steps[6]
4. mistakes[1] (time-of-day clock stepped backwards)
5. posts[0] (Meta, 2020-03-18) digest.numbers[0] (10 ms to 100 µs) and tradeoffs.chosen (ntpd replaced with chrony)

## traffic-steering-and-draining (90)
1. concept
2. concept (DNS slow, load balancer seconds); lesson.howItWorks.steps[0]
3. steps[1], [2], [3], [4]
4. posts[0] (Dropbox, 2018-10-10) digest.numbers[0] (15 minutes, 90%, time-to-live of one minute)

## transactions-and-mvcc (85)
1. concept
2. concept; lesson.howItWorks.steps[0], [1]
3. steps[4]
4. steps[5] (32 bits)
5. posts[1] (Mailchimp, 2019-03-26) digest.numbers[2] (40 days); mistakes[0] (databases that refused writes)

## Notes for the reviewer

- Dated posts only for every figure; the undated Google, Meta and MongoDB posts in these topics were not used.
- observability-and-slos, safe-deployments and traffic-steering use 4 sentences; others 5.
