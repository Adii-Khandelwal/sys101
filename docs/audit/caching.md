# Content audit: Caching

Audit only. No content file was edited. Run on 2026-10-13.

## Scope and method

Files read in full:
- `content/topics/caching.json` (concept, summary, 2 posts, glossary, mistakes, comparison, lesson, quiz, exercises)
- `content/learn/caching.json`
- `content/background/caching.json`
- `content/news/caching.json`

Not separate files: meta description (no `description` field is set on this topic, so it is generated), and daily figures (computed from the post `numbers` rows, so they inherit those findings).

Sources fetched raw with curl (browser UA, `Accept: text/html`) and converted to text on 2026-10-13: Meta post, Uber post, Memcached About, Redis Key eviction, Redis SET, Redis TTL, RFC 9111, PostgreSQL tutorial transactions, Redis get-started, Redis Lua scripting, Google SRE book chapter 6, Valkey 9.1 post, AWS CloudFront post. The MySQL binary log page returned an Oracle "technical difficulties" page to curl, so I used the Wayback copy of 2026-10-05.

Finding IDs: T = topic page, L = learn page, B = background, N = What's new. Severity: wrong, misleading, weak, style.

## Summary

| Severity | Count |
|---|---|
| wrong | 6 |
| misleading | 20 |
| weak | 35 |
| style | 8 |

69 actionable findings, counted once each under their first severity label. The audit lists 71 IDs: T44 and L10 are verified-clean with no finding, and a few IDs carry a second severity for another sentence.

Verified clean (no finding): every verbatim quote in Background (9 items, 11 quotes), the Meta numbers other than those flagged below, the Uber figures other than those flagged below (40M, tens of petabytes, 5 minutes, 99% and 99.9%, 60K vs 3K), the Redis eviction, SET and TTL claims on the learn page other than those flagged below, RFC 9111 section references (1, 4.3, 4.4, 5.2), the Memcached 50 x 64MB = 3.2GB arithmetic, post titles and dates (Meta 2022-06-08, Uber 2024-02-15), the "six nines is 99.9999%, ten nines is 99.99999999%" glossary entry, no em dashes anywhere, no "It's not X, it's Y" phrasing, no repeated words.

Highest priority fixes: the six "wrong" items (T7, T12, T21, T32, T34, L4), then the claims the posts do not make: T10, T11, T14, T19.

---

## A. Topic page: `content/topics/caching.json`

### A1. Meta post digest

**T1** `posts[meta].digest.problem`, last sentence. Severity: misleading.
- Current: "At Meta's scale such cases are rare but frequent enough to cause real harm, like two people's messages being routed to different regions."
- Source: "Many years ago, when TAO was less consistent, some TAO replicas would have inconsistent data after reshuffling..." and "Real cache inconsistencies and racing write operations on the same key are rare."
- Problem: "frequent enough" is not in the post. The messaging split is a past incident from when TAO was less consistent, but our sentence reads as current.
- Rewrite: "Such races are rare, but the harm can be real. Meta describes a messaging case from years ago, when TAO was less consistent, where two people's messages to the same user went to different regions."

**T2** `digest.constraints`, "Logging every cache change would turn a read-heavy system into a write-heavy one." Severity: weak.
- Source: "would turn a read-heavy cache workload to an extremely write-heavy workload for the logging system."
- Problem: dropping "for the logging system" implies the cache itself becomes write-heavy.
- Rewrite: "Logging every cache change would turn a read-heavy cache workload into a write-heavy one for the logging system."

**T3** `digest.walkthrough[2]` "Wait before judging", also numbers row 5 and the diagram title and labels. Severity: misleading.
- Current: "Flagged samples are rechecked after one, five and ten minutes and only counted if they are still wrong"; numbers row: "1, 5 and 10 minutes / Timescales Polaris reports on".
- Source: "Polaris reports inconsistencies at certain timescales, e.g., one minute, five minutes or 10 minutes. If this sample still shows as inconsistent after one minute, Polaris reports it as an inconsistency for the corresponding timescale." Also: Polaris "requeues the sample to later check it against the same target cache host."
- Problem: the post gives one, five and ten minutes as examples ("e.g."), not as the fixed schedule. Our wording states them as the rule. The mechanism (requeue, recheck, report at a timescale) is also compressed into "rechecked after".
- Rewrite: "A flagged sample is requeued and checked again. If it is still wrong at a timescale boundary (the post's examples are one, five and ten minutes), it is reported for that timescale, so normal lag is not counted." Numbers row meaning: "Example timescales Polaris reports on".

**T4** `digest.walkthrough[5]` "Trace the race window". Severity: weak.
- Current: "consistency tracing on each cache server logs only the short window..."
- Source: the tracing library is "embedded into a few major cache services and throughout the invalidation pipeline."
- Problem: "each cache server" overstates the rollout.
- Rewrite: "Separately, a tracing library embedded in a few major cache services and the invalidation pipeline logs only the short window after a write when races happen, plus evictions, so engineers get a timeline when Polaris alarms."

**T5** `digest.numbers` row "under 30 minutes". Severity: weak.
- Current: "Time to find a real bug with tracing, versus weeks before"
- Source: "Many years ago, finding the root cause of such a bug would take weeks from someone who knew the code and the service inside out, if they were lucky enough to find it at all... With information from consistency tracing, it took on-call engineers less than 30 minutes."
- Problem: "weeks before" drops the condition (an expert, years ago, maybe never) and the credit is shared by Polaris (alarm) and tracing (timeline).
- Rewrite: "Time for on-call engineers to locate a real bug using Polaris and tracing. The post says this once took weeks for an expert, if it was found at all."

**T6** `digest.numbers` row 2 and `summary.figures[0]` ("over 10 trillion cache fills per day, even at a 99% hit rate"). Severity: misleading.
- Source: "Even if the cache hit rate reaches 99 percent, we would be doing more than 10 trillion cache fills a day." (1 quadrillion x 1% = 10 trillion.)
- Problem: the post gives an illustration ("would be"), not a measured TAO hit rate. The label reads as if 99% were TAO's actual hit rate.
- Rewrite: label "over 10 trillion cache fills per day if the hit rate reached 99%"; row meaning "Cache fills per day if TAO's hit rate reached 99%".

**T7** `digest.tradeoffs.why`. Severity: wrong (first sentence), misleading (second).
- Current: "Full logging would cost more than the cache itself, and immediate database checks could overload the database. Waiting and retrying means real problems are reported minutes later, which Meta accepted in exchange for a metric with no false alarms."
- Source: logging every change "would turn a read-heavy cache workload to an extremely write-heavy workload for the logging system"; bypass queries "are very compute-intensive. They also expose the database to risks"; "we can't send too many queries to the system that bypasses the cache."
- Problem: "cost more than the cache itself" is not in the post. "could overload" is stronger than "expose the database to risks". "which Meta accepted" is our framing of a trade-off the post does not discuss.
- Rewrite: "Full logging would turn a read-heavy cache into a write-heavy load on the logging system, and checking the database for every suspicious sample is compute-heavy and puts the database at risk. The cost of waiting is that real problems are reported at the first timescale boundary, not instantly; the post presents the wait as part of keeping the metric free of false alarms."

**T8** `digest.failures`, last sentence. Severity: weak.
- Current: "The authors note shard moves, failovers and network partitions can trigger similar bugs."
- Source: "Promotions, shard moves, failure recoveries, network partitions, and hardware failures can all potentially trigger bugs that lead to cache inconsistencies." This sits in the tracing section before the bug story, not as a remark about this bug.
- Problem: "failovers" is our word for "promotions, failure recoveries"; "similar bugs" narrows "bugs that lead to cache inconsistencies".
- Rewrite: "The authors list promotions, shard moves, failure recoveries, network partitions and hardware failures as events that can trigger bugs leading to inconsistency."

**T9** `digest.takeaways`, "Rare bugs tend to hide in error-handling paths". Severity: misleading.
- Source: "The bug hides in the error handling code behind interleaving operations and transient errors." (one bug)
- Problem: a general rule built from one case.
- Rewrite: "The rare bug Polaris caught hid in an error-handling path, behind interleaved operations and a transient error."

### A2. Uber post digest

**T10** `digest.problem`, "...and lost their warm cache whenever traffic failed over to another region." Severity: misleading.
- Source: "In case of region failover, services either have to maintain caching replication to stay hot or suffer higher latencies while the cache is warming up in other regions."
- Problem: the post names a choice (replicate or accept a cold cache). We state only the bad branch as what happened.
- Rewrite: "...and, on a regional failover, either had to run their own cache replication to stay warm or accept slow reads while the new region's cache filled."

**T11** `digest.constraints` and numbers row "6x". Severity: misleading.
- Current: "...so each stateful node is paid for six times." Numbers: "6x / Cost of each stateful node: 3 nodes per partition in each of 2 regions".
- Source: "Costs are multiplied 6x to handle each of the 3 stateful nodes across both regions."
- Problem: the post says the cost is multiplied 6x across the 3 nodes and both regions. Our "each node is paid for six times" is a different statement (and the numbers row restates 3 x 2 as if the post spelled it out; it does not).
- Rewrite: "Scaling is expensive: the post says costs are multiplied 6x, because each partition has three stateful nodes and the data is held in both regions." Numbers meaning: "Cost multiplier for scaling the database, across 3 stateful nodes and both regions (as the post puts it)".

**T12** `digest.numbers` row "over 6M per second" and `digest.failures` ("the largest use case's hit rate"). Severity: wrong.
- Current: "Requests in the largest first use case".
- Source: "one of our largest initial use cases drives over 6M RPS with a 99% cache hit rate."
- Problem: "one of the largest" became "the largest".
- Rewrite: "Requests per second in one of the largest first use cases".

**T13** `digest.walkthrough[3]` "Invalidate from the log". Severity: weak.
- Current: "A system called Flux follows MySQL's binary log and invalidates or updates the affected rows in Redis. That covers conditional updates and never caches data that was not committed."
- Source: "Flux tails the MySQL binlog events... and publishes the events to a list of consumers. A new consumer was written, which subscribes to data events and either invalidates or upserts the new rows in Redis." And: "by using binlogs, we don't run the risk of letting uncommitted transactions pollute the cache."
- Problem: Flux publishes; a new consumer does the invalidation. "never caches" is stronger than "we don't run the risk". The post's own result ("consistent within seconds of the database change, as opposed to minutes") is missing, and it is the point of the step.
- Rewrite: "Flux, Docstore's change data capture service, follows MySQL's binary log, and a new consumer invalidates or updates the affected rows in Redis. That covers conditional updates, and uncommitted transactions cannot pollute the cache. The post says this made the cache consistent within seconds of a database change, not minutes."

**T14** `digest.walkthrough[8]` "Contain failures". Severity: misleading.
- Current: "...so one Redis failure does not hammer one database shard. Circuit breakers and timeouts near the 99.99th percentile of cache latency keep a slow cache from slowing every request."
- Source: "a single Redis cluster going down may create a hot-shard issue on the database. To mitigate this, we decided to shard Redis clusters by partition key"; the circuit breaker is for "a Redis node [that] goes down... a request for which we have high confidence that it will fail"; adaptive timeouts are "equivalent to the P99.99 latency of cache requests".
- Problem: the circuit breaker is described for a failing node, not a slow cache. The timeout is what handles slow requests, and it is adaptive. "one Redis failure" should be one Redis cluster.
- Rewrite: "Redis is sharded by partition key, unlike the database, so one Redis cluster going down spreads its load across all database shards. A sliding-window circuit breaker skips a Redis node that keeps failing, and an adaptive timeout set near the 99.99th percentile of cache latency cancels the slowest requests and serves them from the database."
- Same issue in exercise T31 (scale).

**T15** `digest.numbers` row 99.99% and `summary.figures[1]`. Severity: weak.
- Current: "Share of cached reads matching the database, measured by compare mode" / "99.99% of cached reads matched the database in compare mode".
- Source: "With the addition of cache invalidation using Flux, the cache is 99.99% consistent." (stated right after the compare-mode description)
- Problem: the post does not say the figure is a share of reads, nor that compare mode produced it. Strongly implied, not stated.
- Rewrite: "The post calls the cache 99.99% consistent once Flux invalidation was added; compare mode, which checks cached reads against the database, is how it measures this."

**T16** `digest.numbers` row "75% and over 67%". Severity: style.
- Current: "Drop in p75 and p99.9 read latency".
- Source: "P75 latency is down 75% and P99.9 latency is down over 67%", under "Request latencies with integrated cache are significantly better" (cache vs storage engine).
- Problem: "read" is our inference; "p75" lowercase here and "P75" in the Background quote. Rows "40M", "6M", "60K", "3K" use the compact form, but docs/topic-pages.md says one unit format ("8 million").
- Rewrite: "Drop in P75 and P99.9 latency compared with the storage engine"; "over 40 million per second", "over 6 million per second", "about 60,000 vs 3,000" (check the style rule before applying).

**T17** `digest.tradeoffs.why`, "A shorter expiry would cut the hit rate without fixing consistency". Severity: weak.
- Source: lowering the default TTL "would reduce our cache hit rate without meaningfully improving consistency guarantees."
- Problem: "without fixing" is stronger than "without meaningfully improving".
- Rewrite: "A shorter expiry would cut the hit rate without meaningfully improving consistency."

**T18** `digest.failures`. Severity: misleading and style.
- Current: "The read path and the log follower could race, letting an older row overwrite a newer one, until row timestamps settled every write... The post itself gives the largest use case's hit rate as both 99% and 99.9%; this page uses 99%."
- Source: "However, the above cache invalidation strategy has a flaw... it is possible that we inadvertently write a stale row to the cache."
- Problem: the post presents this as a flaw in the design, not an incident that happened in production. "settled every write" is vague. The 99%/99.9% sentence is an editor's note under "failures", it does not belong to that field, and "this page" is internal phrasing.
- Rewrite: "The first invalidation design had a flaw: the read path and the log consumer both write to Redis, so a slow fill could overwrite a newer row. Comparing the MySQL timestamp on each row fixed it. Following the log alone also did not let a service read its own write, so an explicit invalidation call was added. Fixed timeouts were either too short, wasting work, or too long, hurting tail latency, which led to adaptive ones." Move the 99%/99.9% note into the numbers row meaning only (already there).

**T19** `digest.takeaways`. Severity: misleading.
- Current: "Putting the cache inside the database makes it consistent across every service instead of reinvented in each. The database's own change log is the most reliable invalidation signal."
- Source: the post says CacheFront is meant to "replace most of the custom-built caching solutions" and that using the change log made the cache "consistent within seconds of the database change". It never says "consistent across every service" or "most reliable".
- Problem: both are claims the post does not make; "consistent across every service" also confuses "one shared cache" with "consistency".
- Rewrite: "Putting the cache inside the database means teams share one cache and one invalidation path instead of building their own. Following the database's change log gave Uber faster invalidation than relying on expiry and kept uncommitted data out of the cache."

**T20** `digest.walkthrough[1]`, "such as a shopping cart". Severity: style.
- Source: "such as getting items in an eater's cart".
- Rewrite: "such as reading an Uber Eats cart". Low priority.

### A3. Where they differ

**T21** `comparison`, paragraph 1. Severity: wrong.
- Current: "Both companies cache in front of a strongly consistent database and both invalidate from the database's own stream of changes".
- Source: Uber says "Docstore is a strongly consistent database" and uses Flux on the binlog. Meta says only that "a cache doesn't hold the source of truth" and that "Something (e.g., a client or a pub/sub system) needs to tell the cache that a mutation happened." Meta never says TAO's backing store is strongly consistent or that invalidations come from the database's change stream.
- Rewrite: "Both companies keep a cache in front of a database and depend on invalidations to keep it correct, but they spent their effort in different places."

**T22** `comparison`, paragraph 3: "so it designed the races out up front with row versions". Severity: weak.
- Source: the timestamp deduplication is introduced as the fix for a flaw in the first invalidation design.
- Rewrite: "so it fixed the read-versus-invalidation race in the design with row timestamps". Same wording issue in lesson workedExample "Prevent it" and exercise "design".

### A4. Concept, summary, glossary, mistakes

**T23** `concept` vs `summary.points[0..1]`. Severity: weak (padding).
- Problem: the two summary points repeat the first two sentences of the concept almost word for word, directly under it. The "In short" block adds nothing for the first two points.
- Rewrite: shorten the concept to its first sentence plus the staleness price, or reword the points to the posts' angle (for example "A write to the database does not change the cache by itself. Something must invalidate the entry or the entry must expire.").

**T24** `prerequisiteReasons["load-balancing"]`. Severity: weak.
- Current: "Caching takes from load balancing the picture of requests spread across a pool of servers, and of some server in the path answering instead of the origin."
- Problem: "takes from... the picture" is vague; a server answering instead of the origin is the cache, not something load balancing taught.
- Rewrite: "Load balancing shows requests spread over a pool of servers. A cache is one more server in that path, one that answers in place of the origin."

**T25** `glossary` "Nines". Severity: weak.
- Current: "Shorthand for reliability: six nines is 99.9999%, ten nines is 99.99999999%."
- Problem: figures are right. On this page the nines measure the share of cache writes consistent within five minutes, not reliability.
- Rewrite: "Shorthand for how close a share is to 100%: six nines is 99.9999%, ten nines is 99.99999999%."

**T26** `glossary` "Negative caching". Severity: style.
- Problem: correct per Uber ("cache the negative result instead of having a cache miss and querying the database each time"), but the term appears nowhere else on the page. A glossary entry with no use in the text is orphaned. Either add a digest step or drop the term.

**T27** `mistakes[0]`. Severity: misleading.
- Current: "Assuming invalidations arrive in order. A delayed fill can land after the invalidation for a newer value and write the old value back."
- Problem: the headline is about invalidations arriving in order; the explanation is about a fill arriving after an invalidation. Different race.
- Rewrite: "Assuming a fill and an invalidation reach the cache in the order they were sent. A delayed fill can land after the invalidation for a newer value and write the old value back."

**T28** `mistakes[1]`. Severity: weak.
- Current: "Relying on a version check without storing the version. If the newer version is evicted, the cache can no longer tell which value wins."
- Source: "what if the cache entry 'x=43 @version=2' gets evicted from cache before 'x=42' arrives? In that case, the cache host would lose knowledge of the newer data."
- Problem: the headline says "without storing the version", but the version is stored; it is lost when the entry is evicted.
- Rewrite: "Keeping the version only inside the cache entry. If the newer entry is evicted, its version goes with it and the cache can no longer tell which value wins."

**T29** `mistakes[2]` and `mistakesOutcome`. Severity: misleading.
- Current: "Without a TTL, or with a long one, a missed invalidation can leave it wrong indefinitely." and "the three most common ways caches go wrong".
- Problem: a long TTL is bounded, so "indefinitely" is wrong for it. "most common" has no source.
- Rewrite: "Without a TTL a missed invalidation can leave it wrong indefinitely, and with a long one it stays wrong until the TTL ends." Outcome: "After this you can avoid three ways caches go wrong."

### A5. Lesson

**T30** `lesson.mentalModel.body`: "Most cache bugs come from these steps happening in an unexpected order." Severity: misleading. No source supports "most". Rewrite: "Many cache bugs come from these steps happening in an unexpected order, as the worked example shows."

**T31** `lesson.howItWorks.steps[3]` "Invalidate": "ideally from the database's own log of committed changes". Severity: weak. This is Uber's choice; Meta only says something must tell the cache. Rewrite: "A system outside the cache tells it to remove or replace the old entry. Uber used the database's own log of committed changes for this."

**T32** `lesson.workedExample.steps[1]` and the Polaris diagram. Severity: wrong.
- Current: "...a write changes the value and the database sends an invalidation." Diagram title: "a write updates the database, which sends invalidations to cache replicas and to Polaris".
- Source: "Something (e.g., a client or a pub/sub system) needs to tell the cache that a mutation happened."
- Problem: the post does not say the database sends invalidations.
- Rewrite: "a write changes the value and an invalidation is sent to the cache." Diagram: "a write updates the database; invalidations go to the cache replicas and to Polaris".

**T33** `lesson.workedExample.steps[3]`, "TAO went from six to ten nines". Severity: weak. Source: "by one measure... over the years". Add the qualifier or it reads as a Polaris result. Rewrite: "Over the years, by one measure, TAO went from six to ten nines of writes consistent within five minutes, and Polaris is how Meta measured it."

**T34** workedExample diagram (`dg` for the race). Severity: wrong.
- Current title: "...single-flight and a short TTL catch and bound it." Labels: "Catch it: single-flight", "Bound it: short TTL".
- Problem: single-flight appears nowhere on the page or in either post. Body step 4 says Polaris catches the race, steps 5 and 6 say versions prevent it and a 5-minute default TTL bounds it. Single-flight (one request refills a key) is a stampede defence, not a fix for this race, and a TTL does not "catch" anything.
- Rewrite: title "...Polaris catches it by rechecking; a version check prevents it; a TTL bounds how long it lasts." Labels: "Catch it: Polaris", "Prevent it: version", "Bound it: TTL".

**T35** `lesson.workedExample.steps[4]` "Prevent it". See T22 ("up front"). Rewrite: "Uber's Docstore cache prevents the race: Redis keeps a row only if its MySQL timestamp is newer than the one already cached."

### A6. Quiz

Positions and option-length rules are enforced by the build and not audited here. Answers checked against the posts.

**T36** Q1 "What is a cache fill?" correct option. Severity: style (grammar).
- Current: "Writing a value into the cache after a miss read it from the database"
- Rewrite: "Writing a value into the cache after a miss has read it from the database"

**T37** Q2 stem. Severity: weak.
- Current: "A fill reads value A. The value changes to B and B's invalidation arrives. Then the fill writes A. What does the cache hold?"
- Problem: the answer (A) holds only if the cache has no version check, which the stem does not say; Q3 then teaches the check. A careful reader can answer "B" because a version check would reject A.
- Rewrite: add "The cache keeps no version." to the stem.

**T38** Q5 distractor 0. Severity: misleading.
- Option: "Databases cannot store data at the volumes and speeds that modern services need". Explanation: "The database still holds all the data."
- Problem: the explanation rebuts only the storage half. The "speeds" half is partly true in the Uber post ("Speed of data retrieval from disk has a threshold") and Uber stores tens of petabytes. The option is arguable, so the item is not cleanly wrong.
- Rewrite option: "Databases cannot store the amount of data modern services hold"; explanation: "Databases store it fine. Docstore holds tens of petabytes. The cost is serving every repeated read from the database."

**T39** Q5 `wrong[1]`, "They can, which is the cost being accepted." Severity: style. "They" is unclear. Rewrite: "Caches can go stale. That is the cost being accepted."

**T40** Q4 correct option and explanation. Severity: weak. "Every entry has a TTL" as a backstop is taught as a rule; of the two posts only Uber states a default TTL (5 minutes). Meta explicitly scopes its discussion to caches with invalidations. Fine as general knowledge, but the quiz is filed under "mistakes" with no source note. Optional rewrite of `why`: "Invalidations can be lost or raced; expiry bounds how long a wrong value can live. Uber expires entries after 5 minutes by default for this reason."

### A7. Exercises

**T41** Exercise 1 (apply). Severity: weak.
- Problem: `answer` says to store a version but `tradeoffs` does not warn that the version disappears if the entry is evicted (Meta, and the page's own mistake 2). `wrongAnswers[0]` ("Assuming invalidations always arrive in order.") is a mistaken belief, not an answer to "what do you change?". Wrong answers mix forms (gerund, noun phrase, fragment).
- Rewrite `wrongAnswers`: "Trusting that invalidations always arrive in order, so changing nothing." Add to `tradeoffs`: "A version stored only in the entry is lost when the entry is evicted."

**T42** Exercise 3 (scale). Severity: misleading.
- Current answer: "...use timeouts and circuit breakers so a slow cache does not slow every request." Tradeoffs: "Warming costs reads in the standby region; extra protection adds tuning work."
- Problems: (a) circuit breakers are for failing nodes, not slow ones (see T14); (b) Docstore is active-active, so "standby region" contradicts the post; (c) Uber introduced adaptive timeouts to remove manual tuning, so "adds tuning work" points the other way.
- Rewrite: "...use a circuit breaker to skip failing cache nodes and adaptive timeouts so slow cache calls fall back to the database." Tradeoffs: "Warming costs extra reads in the second region, though only on cache misses. Protection adds moving parts to run."

**T43** Exercise 1 prompt. Severity: style. "for hours" fixes the TTL implicitly; the answer says "no expiry". Fine, but consider "for much longer than the TTL" or "for hours".

### A8. Next

**T44** `lesson.next.body`. Verified, no finding.

---

## B. Learn page: `content/learn/caching.json`

**L1** `stages[0].body[0]`. Severity: weak (near-copy, dropped condition).
- Current: "RFC 9111 puts the HTTP version this way: a cache stores cacheable responses to reduce the response time and network bandwidth consumption on future, equivalent requests" and "Memcached describes itself as a distributed memory object caching system for speeding up dynamic web applications by alleviating database load, a short-term memory for your applications".
- Source (RFC): "A cache stores cacheable responses to reduce the response time and network bandwidth consumption on future equivalent requests." Source (Memcached): "a high-performance, distributed memory object caching system, generic in nature, but originally intended for use in speeding up dynamic web applications by alleviating database load. You can think of it as a short-term memory for your applications."
- Problem: both are close to word-for-word without quote marks. The Memcached line also drops "originally intended" and presents "short-term memory" as how it describes itself, when it is "you can think of it as".
- Rewrite: "RFC 9111 says an HTTP cache stores responses so that later equivalent requests are answered faster and use less bandwidth [[rfc9111]]. Memcached was first meant to take load off the database behind a dynamic web site, and its page suggests thinking of it as a short-term memory for an application [[memcached-about]]."

**L2** `stages[0].body[1]`. Severity: weak (near-copy).
- Current: "when servers share one virtual pool of memory, a given item is always stored and retrieved from the same location across the whole web cluster... fifty web servers with 64MB each... 3.2GB of usable cache".
- Source: "all of the servers are looking into the same virtual pool of memory. This means that a given item is always stored and always retrieved from the same location in your entire web cluster." and "If you had fifty web servers, you'd still have a usable cache size of 64MB in the first example, but in the second, you'd have 3.2GB of usable cache."
- Problem: figures check (50 x 64MB = 3.2GB), but "64MB each" is implied by the page, not stated; the sentence is near-copy.
- Rewrite: "Memcached's page adds a point about clusters. If every web server keeps its own cache, fifty servers still give you only the one server's 64MB of usable cache. If they pool their memory, the same fifty give 3.2GB, and any given item always lives in one place [[memcached-about]]."

**L3** `stages[0].body[2]`, last sentence. Severity: weak (filler, overclaim).
- Current: "Deciding when to expire a copy and what to throw out when memory is full is the whole craft of caching."
- Problem: "the whole craft" is empty emphasis, and the next stage says invalidation is "the hardest part".
- Rewrite: "That leaves two decisions to make for every cache: when a copy expires, and what to drop when memory is full."

**L4** `stages[1].body[3]`. Severity: wrong.
- Current: "Headers such as Cache-Control and max-age tell caches how long a response may be reused..."
- Source: RFC 9111 §5.2: "The 'Cache-Control' header field is used to list directives"; max-age is a directive (§5.2.2.1), not a header. Expires is the other header.
- Rewrite: "The Cache-Control header, with directives such as max-age, tells caches how long a response may be reused and whether it may be stored at all, and validators let a cache ask the origin 'is my copy still good?' without refetching the whole thing [[rfc9111]]."

**L5** `stages[2].body[0]`. Severity: misleading.
- Current: "RFC 9111 describes the HTTP form of the second idea: because unsafe methods such as PUT, POST or DELETE can change state on the origin, a cache must invalidate the stored responses for the target URI when it gets a non-error response to one".
- Source (§4.4): "intervening caches are required to invalidate stored responses"; "A cache MUST invalidate the target URI when it receives a non-error status code in response to an unsafe request method."
- Problem: the quote is accurate, but the second idea was "explicitly deleting the key on a write", done by the write path. In HTTP, a cache that sees the write pass through drops its own copy. Caches the write never passes through are not covered. Calling it "the HTTP form" overstates the match.
- Rewrite: "RFC 9111 has a related rule: a cache that sees an unsafe request such as PUT, POST or DELETE succeed must invalidate its stored responses for that URI. It only covers caches the request passes through [[rfc9111]]."

**L6** `stages[2].body[0]`, "Most systems blend the two." Severity: weak. No source. Soften or cite: "Many systems use both."

**L7** `stages[2].body[1]` (stampede). Severity: weak.
- Problem: this page is "official sources only" but the stampede paragraph, the defences ("letting only one request refill a key while others wait, or refreshing a key slightly before it expires") and "can knock the origin over" cite nothing, and none of the five listed sources covers it. Also `practice` states "If the cache is down, every request becomes a miss and pours onto the origin" with no citation.
- Rewrite: either add an official source that names the stampede, or label it as general explanation and drop the specific defences until a source is chosen.

**L8** `stages[2].body[2]`, last sentence. Severity: misleading.
- Current: "...the volatile policies are mainly useful when one instance serves both caching and persistent keys".
- Source: "The volatile-lru, volatile-lrm, and volatile-random policies are mainly useful when you want to use a single Redis instance for both caching and for a set of persistent keys." The page gives volatile-ttl a different use ("Use volatile-ttl if your code can estimate which keys are good candidates for eviction and assign short TTLs").
- Rewrite: "It also notes that the volatile versions of LRU and random are mainly useful when one instance serves both caching and persistent keys, and suggests two separate instances if possible [[redis-eviction]]."

**L9** `stages[3].body[1]`, "Redis shows how to watch for the opposite problem". Severity: weak (unclear referent). "The opposite problem" of what? Rewrite: "Redis shows how to check that the cache is helping:".

**L10** `stages[3].body[2]`. Severity: verified. RFC §1 shared/private definitions are accurate; "usually" matches "usually (but not always)". Minor: add "but not always" if exact.

**L11** `stages[3].terms` "Write-through". Severity: misleading.
- Current: "Writing to the cache and the origin together, so the cache is never behind the origin."
- Problem: not used in any body paragraph of the page and not in any cited source. "never behind the origin" is an overclaim, since two writes to two systems can still disagree after a failure. This page is official-sources-only.
- Rewrite: delete the term, or cite a source and say "Writing to the cache and the origin as part of the same update."

**L12** `before.terms` "Origin" and `stages[0].terms` "Origin". Severity: style. Defined twice with different wording on one page. Keep one.

**L13** `misconceptions[1]`. Severity: misleading.
- Current: "Memory is limited, so Redis evicts keys by a chosen policy once the limit is reached, and with noeviction it returns an error instead of caching new data".
- Source: "Set maxmemory to zero to specify that you don't want to limit the memory for the dataset. This is the default behavior for 64-bit systems."
- Problem: omits that by default there is no limit on a 64-bit system, so Redis does not evict until you set maxmemory.
- Rewrite: "Memory is limited, so once you set a maxmemory limit Redis evicts keys by the chosen policy when it is reached (by default on 64-bit systems there is no limit), and with noeviction it returns an error instead of caching new data [[redis-eviction]]."

**L14** `misconceptions[2]`. Severity: weak.
- Current truth: "With cache-aside, the application wires the cache and the database together; a Redis cache entry is just a copy of data stored elsewhere [[redis-eviction]]."
- Problem: the cited page supports only "entries are copies of persistently-stored data". It says nothing about sync or cache-aside, and being a copy does not show the cache is not kept in sync. The first clause is general knowledge under a Redis citation.
- Rewrite: "Nothing keeps it in sync by itself. With cache-aside the application updates both, and a Redis cache entry is only a copy of data stored elsewhere [[redis-eviction]], so a change to the origin does not reach it unless something sends it."

**L15** `misconceptions[3]`. Severity: weak.
- Current: "A longer time to live raises the hit ratio but lets stale data live longer... Redis's INFO stats can show whether keys are expiring before they should [[redis-eviction]]."
- Problem: the citation covers only the last sentence (expired_keys high suggests the TTL is too low). The first sentence is general knowledge. Also the myth is "longer is always better" but the truth does not mention the evidence step: it takes a low `evicted_keys` and a high `expired_keys`.
- Rewrite: cite only the last sentence and say: "If evicted_keys is low and expired_keys is high, Redis says the TTL may be too low."

**L16** `tryIt.commands[2]` `TTL mykey`. Severity: weak.
- Current shows: "How many seconds are left before the key expires."
- Source: "returns seconds remaining, -1 if no expiry, -2 if key doesn't exist".
- Problem: a learner who runs TTL on a key without an expiry gets -1 and no explanation.
- Rewrite: "How many seconds are left before the key expires. It returns -1 if the key has no expiry and -2 if the key does not exist."

**L17** `tryIt.commands[3]` `INFO stats`. Severity: weak. The cited eviction page names "the INFO stats section" but does not show `INFO stats` as a command line. Check whether this meets the "appears on the cited page" rule, or cite the Redis INFO command page.

**L18** `promise` and `before.note`. Severity: weak (filler).
- Current: "After this you can follow the topic page and the posts." and "caches often sit behind the balancer and in front of the origin".
- Problem: the promise says nothing about caching; the note's claim is unsourced and not what the prerequisite reason says.
- Rewrite: "After this you can explain what a cache is, how entries expire and get evicted, and what can go wrong." Note: "Read Load Balancing first, since a cache is one more stop in the request path."

**L19** `next`. Severity: weak. "the two company posts on caching at scale" does not describe the posts (consistency monitoring and a cache built into a database). Rewrite: "the two company posts, one on measuring cache consistency at Meta and one on building a cache into Uber's database".

---

## C. Background: `content/background/caching.json`

Checked: all 11 quotes against the Meta and Uber pages (character for character including curly quotes) pass. Every `assumedBy` item matches a post that contains it.

**B1** `atomic-transactions.explanation`, last sentence. Severity: weak.
- Current: "A change that is not committed yet does not count as having happened."
- Source (PostgreSQL tutorial): "The updates made so far by an open transaction are invisible to other transactions until the transaction completes."
- Problem: the open transaction can see its own changes; the source claim is about visibility.
- Rewrite: "A change that is not committed yet is invisible to other readers."

**B2** `binary-log.explanation`. Severity: weak.
- Current: "A database keeps an ordered log of every change it commits, which is how its replicas copy it. Reading that log from outside lets another system react to each change as it happens, which is what change data capture means."
- Source (MySQL 8.4, Wayback copy): "The binary log contains 'events' that describe database changes... For replication, the binary log on a replication source server provides a record of the data changes to be sent to replicas."
- Problems: (a) "ordered" is not stated on the page; (b) the page says it also records statements that could have changed data and that logging must be enabled; (c) the second sentence (reading it from outside, change data capture) is not on the MySQL page at all, it is Uber's use. The cited source does not support half the explanation.
- Rewrite: "A MySQL server can keep a binary log of events that describe the changes made to its data, which is how replicas copy it. Uber's Flux reads that log and passes each change to other systems, an approach called change data capture." Cite the Uber post for the second sentence or drop it.

**B3** `latency-percentiles.explanation`. Severity: weak.
- Source (SRE book ch. 6): uses "the 99th percentile" and the 100 ms average vs 5 s for 1% example ("slow average and a very slow tail"), but does not define a percentile and does not mention P99.9 or P99.99.
- Problem: the "tail that an average hides" is supported; the definition and the P99.9/P99.99 sentence are general knowledge under the SRE citation.
- Rewrite (optional): add "The SRE book's example is a service averaging 100 ms where 1% of requests take 5 seconds."

**B4** Items "eventual-and-strong-consistency", "sharding", "publish-subscribe", "circuit-breaker", "consensus". Severity: style.
- Problem: "The gist is enough here." is the closing sentence of five explanations. Repeated filler, and it speaks to the reader about the file's own structure. The `topicPage` link already says where the full treatment is.
- Rewrite: delete the sentence from each.

**B5** `circuit-breaker` quote: "To achieve this, we use a sliding window circuit breaker." Severity: weak. "To achieve this" points back to a sentence not in the quote (short-circuiting requests to a failed Redis node), so the quote alone does not show what a circuit breaker does. Pick the next sentence pair: "If a Redis node goes down, we'd like to be able to short circuit requests to that node to avoid the unnecessary latency penalty of a Redis get/set request for which we have high confidence that it will fail."

**B6** `consensus` Meta quote. Severity: weak. "much like designing Paxos, where the protocol is different from building Paxos that actually works in production" is an analogy; it shows Paxos exists but not that it is a consensus protocol. The Uber Raft quote carries the term. Keep the Uber quote, drop or demote the Meta one.

---

## D. What's new: `content/news/caching.json`

**N1** Valkey item `summary`. Severity: misleading.
- Current: "...so a cache may achieve a higher hit rate."
- Source: "If you are utilizing Valkey as a dedicated cache running near full capacity with an eviction policy such as allkeys-lru, these memory savings effectively increase your cache capacity... your cache may achieve a higher hit rate without requiring any changes."
- Problem: the condition (a dedicated cache running near full capacity with an eviction policy) is dropped. The post also says the savings vary by workload (17% to 44% for small strings; little or none for some sorted-set member lengths).
- Rewrite: "The Valkey project says Valkey 9.1 cuts per-key memory overhead for strings and sorted sets, and that a cache running near full capacity with an eviction policy may see a higher hit rate."
- Evidence strings checked: all three are verbatim substrings. Date 2026-08-13 matches.

**N2** CloudFront item `summary`. Severity: misleading.
- Current: "...reports that invalidations take effect in under 5 seconds at P95."
- Source: "Over the years, CloudFront has made improvements to propagation times. At the time of writing, invalidations take effect in under 5 seconds at P95. The end-to-end completion time, which includes reporting the invalidation status back, is under 25 seconds at P95."
- Problem: the 5 seconds is about CloudFront invalidations in general at the time of writing, not about cache-tag invalidation, and the post gives 25 seconds for end-to-end completion. Quoting only the shorter figure flatters.
- Rewrite: "Amazon Web Services describes invalidating CloudFront objects by cache tag so related content can be purged with one request, and says that at the time of writing CloudFront invalidations take effect in under 5 seconds at P95 and complete end to end in under 25 seconds."
- Evidence strings are verbatim. Date 2026-05-04 matches. Note: the post opens "Today, Amazon CloudFront is launching...", a product launch; check this against the news allowlist `kinds` and the "no marketing" selection rule before keeping it as an `engineering-post`.

---

## Could not verify

- **MySQL binary log page** (`dev.mysql.com/doc/refman/8.4/en/binary-log.html`): direct curl returned Oracle's "technical difficulties" page. Checked against the Wayback copy of 2026-10-05, not the live page. The "no date shown" year was not confirmed on the live page.
- **RFC 9111 date "June 2022"**: the page's visible text shows "Copyright (c) 2022"; the full date comes only from the page's `citation_publication_date` meta tag (2022/06/06). Not visible to a reader.
- **Redis pages "no date shown"** (eviction, SET, TTL, get-started, Lua scripting) and **Memcached About**: confirmed no visible date in the fetched text, but these are single-page fetches of versioned docs. The Redis eviction page now also lists allkeys-lrm, volatile-lrm and volatile-ttl; the learn page says "include", so it is still accurate.
- **Memcached "64MB each"**: the page states 64MB for the independent-node case; "each" is an inference.
- **Learn page stampede paragraph, defences, "cache down means every request misses", "write-through", "edge cache", "critical path" terms**: no opened source in the page's source list covers them, so they could not be checked. They may be correct as general knowledge but are not verifiable from the sources the page cites.
- **Quiz and exercise claims about TTL as a backstop**: only Uber's 5-minute default TTL is in a post. The general rule is not in either post.
- **Meta TAO's backing store consistency** (needed for the comparison's first sentence): not stated in the Meta post; could not verify.
- **Whether the 6M RPS use case is the one that prompted CacheFront**: the post does not say, so the digest's "One service needed..." and the 6M row cannot be tied together from the source.
- **Reading time, meta description, daily figure, JSON-LD, sitemap dates**: generated at build time from the content above; not audited separately. Fixing T6, T11, T12 and T15 fixes the daily-figure text.
- **About page, Terms, Privacy, homepage**: out of scope for a per-topic run.
- **The task text was cut off** after "Could not verify: every item whose source you" so I read it as "every item whose source you could not open or confirm". If it meant something else, tell me.
