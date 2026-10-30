# Say it in 30 seconds: sources, batch A (18 topics)

Each sentence lists the JSON path it came from (topic file in content/topics/). Sentences are numbered in the order of the text in the `thirtySeconds` field. Caching and consistent hashing are the approved samples, verbatim; their sources are in thirty-second-answers.md.

## api-design-rpc-rest-graphql (87 words, 5 sentences)
1. lesson.why.body (three questions)
2. lesson.mentalModel.body (who decides the shape)
3. lesson.howItWorks.steps[2] and [3]; mistakes[0]
4. lesson.howItWorks.steps[3] (server keeps older shapes working)
5. posts[1] (Shopify, 2021-06-22) digest.numbers[0] (50 points per second), lesson.howItWorks.steps[4]

## autoscaling-and-capacity (88 words, 5)
1. lesson.why.body (demand moves, capacity takes minutes)
2. lesson.howItWorks.steps[0], [1], [2]
3. lesson.howItWorks.steps[3]; mistakes[1]
4. lesson.howItWorks.steps[0]; mistakes[0]
5. posts[0] (Google, 2020-04-27) digest.numbers[0] (23% vs 46%)

## cap (89 words, 5)
1. lesson.why.body (partition: answer or refuse)
2. mistakes[0]
3. lesson.howItWorks.steps[0], [1], [2]
4. lesson.howItWorks.steps[3]
5. posts[0] (Amazon, 2007-10-14) digest.numbers[1] ((3, 2, 2))

## cdns (83 words, 5)
1. lesson.why.body
2. lesson.howItWorks.steps[0], [1], [2]
3. mistakes[0]
4. lesson.howItWorks.steps[2] (reuse open connection)
5. posts[0] (Cloudflare, 2022-09-14) digest.numbers[1] (87.1% to 99.92%)

## circuit-breakers (87 words, 5)
1. lesson.why.body (threads tied up; retries worse)
2. lesson.howItWorks.steps[1], [2]
3. lesson.howItWorks.steps[3]
4. mistakes[0]
5. posts[0] (Zalando, 2026-10-08) digest.numbers[4] (10x per pod after close; avalanche in numbers[3] and [5])

## consensus (89 words, 5)
1. lesson.why.body
2. lesson.howItWorks.steps[0], [3]
3. lesson.howItWorks.steps[1], [2], [5]
4. mistakes[2]
5. posts[1] (Cockroach Labs, 2026-05-26) digest.numbers[0] (up to 85%)

## databases (87 words, 5)
1. lesson.why.body
2. lesson.howItWorks.steps[0] to [3]
3. lesson.howItWorks.steps[4]
4. lesson.howItWorks.steps[5]; mistakes[0]
5. posts[0] (Uber, 2016-07-26) digest.numbers[0] (at least 4) and numbers[5] (9.2)

## disaster-recovery-and-backups (85 words, 5)
1. lesson.why.body; mistakes[0]
2. lesson.why.body (RPO, RTO)
3. lesson.howItWorks.steps[1], [2], [4]
4. mistakes[1]
5. posts[0] (GitLab, 2017-02-10) digest.numbers[4] (pg_dump failing), numbers[2] (roughly 6 hours)

## distributed-transactions (86 words, 6)
1. lesson.why.body
2. lesson.howItWorks.steps[0] to [2]
3. lesson.howItWorks.steps[2], [4]; mistakes[1]
4. lesson.howItWorks.steps[5]; mistakes[2]
5. posts[0] (Google, 2010-10-04) digest.numbers[1] (~4x overhead)

## dns (82 words, 5)
1. lesson.why.body
2. lesson.why.body (split across servers, cached)
3. lesson.howItWorks.steps[0] to [4]
4. lesson.howItWorks.steps[5]; mistakes[0]
5. posts[1] (Slack, 2021-11-29) digest.numbers[0] (under 1%) and numbers[1] (24 hours)

## event-driven-architecture (86 words, 5)
1. lesson.why.body; lesson.howItWorks.steps[0]
2. lesson.why.body (producer no longer knows or waits)
3. lesson.howItWorks.steps[1]
4. lesson.howItWorks.steps[3]
5. posts[1] (Zapier, 2026-03-30) digest.numbers[0] (50 SQLite shard files per pod)

## failover (80 words, 5)
1. lesson.why.body
2. lesson.howItWorks.steps[1], [2], [3]
3. lesson.howItWorks.steps[4]; mistakes[2]
4. mistakes[0]
5. posts[0] (GitHub, 2018-06-20) digest.numbers[0] (10 to 13 seconds)

## http-tcp-tls (85 words, 4)
1. lesson.why.body; lesson.howItWorks.steps[1] to [3]
2. lesson.why.body (fewer trips); lesson.howItWorks.steps[4], [5], [6]
3. lesson.howItWorks.steps[5]; mistakes[1]
4. posts[2] (Cloudflare, 2017-03-15) digest.numbers[2] (1000 ms for a visitor 250 ms away)

## idempotency-and-retries (90 words, 6)
1. lesson.why.body
2. lesson.howItWorks.steps[2], [3]
3. lesson.howItWorks.steps[4], [5]
4. mistakes[1]
5. (sentence 5 is the example) posts[0] (Amazon Web Services Builders' Library, 2019-12-05) digest.numbers[3] (243x, five layers retrying three times)

## indexing (78 words, 5)
1. lesson.why.body
2. lesson.why.body (second paragraph)
3. lesson.howItWorks.steps[2]
4. lesson.howItWorks.steps[3], [4]
5. posts[0] (GitHub, 2023-02-06) digest.numbers[2] (2,048 cores for 96 seconds; 115 TB in numbers[1])

## load-balancing (83 words, 4)
1. lesson.why.body
2. lesson.howItWorks.steps[0], [1]; mistakes[2]
3. mistakes[0]
4. posts[0] (Uber, 2022-05-17) digest.numbers[0] (100,000,000 connections for two 10,000 task services)

## caching, consistent-hashing
Verbatim from thirty-second-answers.md (89 and 86 words).
