# Pull quotes (checked 29 Oct 2026)

One optional `pullQuote` per topic, at most 8 topics. Each string below was found word for word (tags removed, entities decoded, whitespace collapsed, nothing else changed; curly apostrophes are the page’s own) on the raw page fetched with browser-like headers on 2026-10-29 (HTTP 200). `npm run verify:quotes` repeats that check against the live pages. No post stores an excerpt, so the test limit is: the build checks the post id exists, under 25 words and one sentence; only the script reads the page.

| Topic | Source | URL | Verbatim string |
| - | - | - | - |
| api-design-rpc-rest-graphql | Stripe, 2017 | https://stripe.com/blog/api-versioning | Versioning is always a compromise between improving developer experience and the additional burden of maintaining old versions. |
| databases | Uber, 2016 | https://www.uber.com/en-ES/blog/postgres-to-mysql-migration/ | MySQL’s replication architecture means that if bugs do cause table corruption, the problem is unlikely to cause a catastrophic failure. |
| dns | Slack, 2021 | https://slack.engineering/what-happened-during-slacks-dnssec-rollout/ | We decided not to restore signing due to a lack of confidence. |
| http-tcp-tls | Cloudflare, 2017 | https://blog.cloudflare.com/introducing-0-rtt/ | Although web applications should be replay resilient, that’s not always the reality. |
| indexing | GitHub, 2023 | https://github.blog/engineering/architecture-optimization/the-technology-behind-githubs-new-code-search/ | Even if we threw a ton of money at the problem, it still wouldn’t meet our user experience goals. |
| log-based-streaming | LinkedIn, 2013 | https://www.linkedin.com/blog/engineering/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying | Event data records things that happen rather than things that are. |
| rate-limiting | Databricks, 2025 | https://databricks.com/blog/high-performance-ratelimiting-databricks | We had to be more efficient and smarter about this, rather than throwing a huge number of servers at the problem. |
| sharding | Figma, 2024 | https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/ | Despite our incremental scaling progress, we always knew that vertical partitioning could only get us so far. |

## Skipped (27)

How the choice was made: every opened post page was fetched and scanned for sentences of 10 to 22 words that read as a stand-alone statement (keywords such as lesson, trade-off, instead of, never, always). I read those candidates, not every page in full. A topic is skipped when none of its candidates stood alone without the paragraph around it (they said "this" or "that", were procedural, or were a company slogan), or when the quote came from an undated page (no year in the attribution), or when the best candidate repeated a figure already on the page, or when its pages (papers, PDFs, long reference pages) gave no short sentence among the candidates. No candidate that was tried and not found in the raw page exists: every string above was found.

- autoscaling-and-capacity
- caching
- cap
- cdns
- consensus
- consistent-hashing
- distributed-transactions
- event-driven-architecture
- idempotency-and-retries
- load-balancing
- message-queues
- object-storage
- online-schema-migrations
- overload-and-cascading-failures
- probabilistic-data-structures
- pub-sub
- real-time-delivery
- replication
- safe-deployments
- storage-engines
- stream-vs-batch-processing
- time-clocks-and-consistency
- transactions-and-mvcc
- circuit-breakers: the Zalando sentence starts "When those assumptions don't hold", so it does not stand alone.
- disaster-recovery-and-backups: the GitLab sentence starts "This means we were never aware...", so it does not stand alone.
- failover: the only candidate is on an undated page, so the attribution would carry no year.
- observability-and-slos: the Google page is undated and its caption would be a long copyright label.
