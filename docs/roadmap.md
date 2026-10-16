# Future topics roadmap

> Research plan from October 2026, not verified content. The posts and figures below come from research notes read through fetch tools and some Wayback copies. Before any of them goes into a topic file, run the `add-post` skill (raw-page figure check, exact-URL grep against `content/topics/*.json`, logo check). Revised after the owner review and a second research pass (Oct 2026). Read this file only when planning or choosing the next topic; the short version is in CLAUDE.md "Future plan".

# Seven topics are ready to build next

After the owner review, sys101 can add **7 topics now**: overload-and-cascading-failures, safe-deployments, object-storage, real-time-delivery, log-based-streaming (change data capture folded in as a section), autoscaling-and-capacity and time-clocks-and-consistency (consistency models merged in). Six more (stream-vs-batch-processing, disaster-recovery-and-backups, probabilistic-data-structures, api-design-rpc-rest-graphql, service-mesh-and-api-gateways, exactly-once-processing) have usable but thinner sources and follow later; two (online-schema-migrations, observability-and-slos) need a second source; multi-region-traffic-routing has one 2013 post. Search is not a new node: the existing Indexing and Search topic already covers inverted indexes, so a new Notion post (2026) is proposed as its third source. Build in batches of three or four topics with at most three prerequisites each, because the course graph fails layout tests when a new node adds a crossing edge. Each source appears in one place only. Capstones come last, and chat needs its own sources now that Slack 2023 belongs to real-time-delivery. To go live with a credible update, ship batches 1 and 2 (7 new topics, 29 in total).

## Owner decisions (Oct 2026)

- **Sources that count under post rule 4:** papers by teams that ran the system (Metastable Failures in the Wild as an analysis paper over public incident data, Autopilot, Maelstrom, Dapper, Canopy), MongoDB Atlas, and the CrowdStrike root cause analysis. Confluent does not count, and Debezium is not a post; both are explanation only.
- **CDC** is a section of log-based-streaming, taught with the Netflix DBLog paper, not a node. **Exactly-once-processing** stays later.
- **Reuse:** each post appears in one place only, as a topic source or a capstone source. Slack 2023 stays with real-time-delivery; Dropbox Magic Pocket stays with object-storage.
- **Posts dropped by this review:** LinkedIn instant messaging 2016, LinkedIn "Running Kafka at Scale" 2015, Cockroach "Living without atomic clocks", the DynamoDB 2022 figures as consistency evidence (they are throughput, not consistency).

## Ranked recommendation: 20 candidates after merging overlaps

Ranking weighs source strength first (rule 1 numbers, rule 3 age, rule 4 credibility), then how many existing topics the node unlocks. Prerequisites are existing slugs unless marked (new). Where the notes disagreed on a group, the choice is given in the conflicts paragraph below the table.

| slug | title | group | prerequisites | source strength | priority tier |
| - | - | - | - | - | - |
| overload-and-cascading-failures | Overload, backpressure and cascading failures | Reliability | rate-limiting, circuit-breakers, idempotency-and-retries | ok (one measured incident post, one paper) | next |
| safe-deployments | Safe deployments and config rollout | Reliability | load-balancing, failover | strong | next |
| object-storage | Object storage | Data | storage-engines, replication | strong | next |
| real-time-delivery | Real-time delivery at scale | Scaling | consistent-hashing, pub-sub, http-tcp-tls | strong | next |
| log-based-streaming | Log-based streaming (CDC as a section) | Messaging | message-queues, pub-sub, replication | strong | next |
| autoscaling-and-capacity | Autoscaling and capacity | Scaling | load-balancing, caching | ok (two sources, both with numbers) | next |
| time-clocks-and-consistency | Time, clocks and consistency | Data | replication, consensus, cap | ok (three sources, no vendor blog) | next |
| exactly-once-processing | Exactly-once processing | Messaging | idempotency-and-retries, log-based-streaming (new) | needs a second source (Confluent is explanation only) | later |
| stream-vs-batch-processing | Stream vs batch processing (backfills folded in) | Data | log-based-streaming (new), storage-engines | ok | later |
| disaster-recovery-and-backups | Disaster recovery and backups | Reliability | replication, failover | ok | later |
| probabilistic-data-structures | Bloom filters, Ribbon, HyperLogLog | Data | indexing, storage-engines | ok | later |
| service-mesh-and-api-gateways | Service mesh and API gateways (discovery folded in) | Scaling | load-balancing, circuit-breakers | needs a second source (nothing after 2018) | later |
| api-design-rpc-rest-graphql | API design: RPC, REST, GraphQL | Messaging | http-tcp-tls, idempotency-and-retries | ok (2019, 2020 sources) | later |
| online-schema-migrations | Online schema migrations | Reliability | databases, replication | needs a second source (no numbers) | later |
| observability-and-slos | Observability and SLOs (merged) | Reliability | load-balancing, message-queues | needs a second source (papers and one book) | parked |
| multi-region-traffic-routing | Multi-region traffic routing | Reliability | dns, failover, replication | not ready, needs a source (one 2013 post) | parked |
| (existing topic: indexing) | Add the Notion 2026 reindexing post as a third source | Data | n/a | strong (one new post, no new node) | next, any time |
| (capstones) | see the capstone section | n/a | n/a | see section | after batch 2 onward |

Group choices settled earlier still stand: CDC is taught in Messaging as a section of log-based-streaming, the service mesh sits in Scaling next to load-balancing, and online-schema-migrations sits in Reliability. Observability and SLOs stay one parked node: three Google pages and two papers, and no company post on logs or metric cardinality. Consistency models are merged into time and clocks, so the Data group gains one node, not two.

## Per-topic sources and verified figures

Every figure below is as the notes recorded it from raw page or PDF text. "Archive copy" means the live page blocked curl and the figure was read from a Wayback copy that should be re-checked live before publishing. Posts older than five years carry their year.

### overload-and-cascading-failures (Reliability, ok)

Teach failure dynamics (goodput collapse, recovery paths that overload themselves, metastable state, load balancer panic mode), not the shedding algorithm, because rate-limiting and circuit-breakers already cite the SRE Handling Overload page and the Uber Cinnamon post. Only the first two sources below carry measurements.

- Slack, "Slack's Outage on January 4th 2021", Laura Nolan, 1 Feb 2021 (updated 3 Feb), 2021 so show the year: [post](https://slack.engineering/slacks-outage-on-january-4th-2021/). Provisioning tried to add 1,200 servers between 7:01 and 7:15am PST and hit the Linux open-files limit and an AWS quota; 99% of messages were sent at 6:57am against a usual over 99.999%; CPU and thread-utilization autoscaling flipped from downscale to a large upscale; the web tier was degraded, not down, by 9:15am and fully fixed at 10:40am; load balancer panic mode plus retries and circuit breaking restored serving. The trigger was an AWS Transit Gateway limit, not a retry storm, and the post has no request-rate totals. Found in the Oct 2026 research pass; the guessed URL slug was a 404.
- Paper, Huang et al., "Metastable Failures in the Wild", OSDI 2022: [PDF](https://www.usenix.org/system/files/osdi22-huang-lexiang.pdf). 22 metastable failures from 11 organizations; at least 4 of 15 major AWS outages in the last decade were metastable; its table lists the 2019-03-12 Google outage (4.17 hours) and the 2019-10-31 Google Compute Engine incident (21.5 hours). Accepted by the owner as an analysis paper over public incident data (it is academic-led, not written by a team that ran a system).
- Mechanism only, no figures taken from them: AWS Builders' Library "Using load shedding to avoid overload" (undated; goodput, and the median-equals-timeout point), Google SRE Book "Addressing Cascading Failures" (2017; its Cluster A and B numbers are a worked example, not measurements) and Netflix "Performance Under Load" (archive copy; the adaptive-limit formula).
- Still open: a retry-amplification post with request-rate measurements.

### safe-deployments (Reliability, strong)

- AWS Builders' Library, "Automating safe, hands-off deployments", undated, current: [page](https://aws.amazon.com/builders-library/automating-safe-hands-off-deployments/). 24 Regions or 76 Availability Zones one at a time would take weeks, so pipelines deploy in waves (example: 3 Regions in wave 3, up to 12 in wave 4, the rest in wave 5); each wave starts with a one-box stage; in gamma the one box stays on new code for a period such as 30 minutes or one hour at about ten percent of gamma canary traffic.
- Cloudflare, "Cloudflare outage on November 18, 2025": [post](https://blog.cloudflare.com/18-november-2025-outage/). Failures began 11:20 UTC, a known good file was inserted by 14:30, all normal at 17:06; a ClickHouse permissions change at 11:05 doubled the Bot Management feature file; the limit is 200 features against about 60 in use; the file is regenerated every five minutes and pushed network-wide.
- CrowdStrike, "Channel File 291 Incident Root Cause Analysis", 6 Aug 2024: [PDF](https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf). The template defined 21 input fields but the integration code supplied 20; testing passed because the 21st was matched with wildcards; remediation includes staged deployment of template instances. Vendor RCA, not a service-at-scale blog: flag for owner.

### object-storage (Data, strong)

- Andy Warfield, "Building and operating a pretty big storage system called S3", 27 Jul 2023: [post](https://www.allthingsdistributed.com/2023/07/building-and-operating-a-pretty-big-storage-system.html). Since the first drive capacity improved 7.2M times, seek times only 150x; at 200TB drives the allowance is 1 I/O per second per 2TB; built from hundreds of microservices; objects are erasure coded across tens of drives and spread over millions of drives. Object-count and durability figures were not found and are dropped.
- Paper, Beaver et al. (Facebook), "Finding a needle in Haystack", OSDI 2010, older than five years, fundamental unchanged, show the year: [PDF](https://www.usenix.org/legacy/event/osdi10/tech/full_papers/Beaver.pdf). Over 260 billion images, more than 20 petabytes; one billion new photos (about 60 terabytes) per week; over one million images per second at peak; each usable terabyte costs about 28% less and serves about 4x more reads per second than on a NAS appliance; metadata access is the bottleneck.
- Dropbox, James Cowling, "Inside the Magic Pocket", 6 May 2016 (read from the live page, no update date shown), show the year: [post](https://dropbox.tech/infrastructure/inside-the-magic-pocket). Settled from the page: "store around 50PB of raw data" is the typical cell, and "we can support around a hundred petabytes before the memory and CPU overhead becomes a bottleneck" is the ceiling; buckets are "1GB logical storage containers"; blocks are "up to 4MB in size" (a maximum); growth "from our initial double-digit-petabyte prototypes to a multi-exabyte behemoth within the span of around 6 months". This post stays here; the file-sync capstone does not reuse it.

### real-time-delivery (Scaling, strong)

Discord Elixir is already used elsewhere, so it is not reused. Slack 2023 lives here only; the chat capstone needs its own sources.

- Slack, "Real-time Messaging", 11 Apr 2023: [post](https://slack.engineering/real-time-messaging/). About 16 million channels per host at peak; a replacement channel server ready "in under 20 seconds"; global delivery "in 500ms"; tens of millions of connected clients; consistent hashing routes channels.
- Netflix, "Pushy to the Limit", 10 Sep 2024, archive copy: [post](https://netflixtechblog.com/pushy-to-the-limit-evolving-netflixs-websocket-proxy-for-the-future-b468bc0ff658). "Hundreds of millions of concurrent WebSocket connections", 99.999% delivery reliability, 200,000 connections per node average with room to 400,000. Re-check the figures on the live page.
- Dropped by the owner review: LinkedIn "Instant Messaging at LinkedIn" (2016, a heap-size anecdote). Slack's "over 5 million simultaneous WebSocket connections" appears only on secondary sites. A third post would be welcome but is not required.

### log-based-streaming (Messaging, strong)

Frame it around storage, partitions, offsets and replay, not events as a design style, since event-driven-architecture exists. Change data capture is a section of this topic (the log as the source of truth for derived stores), taught with the DBLog paper.

- LinkedIn, Jay Kreps, "The Log", 16 Dec 2013, archive copy, old but an unchanged fundamental, show the year: [post](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying). "Over 60 billion unique message writes through Kafka per day".
- LinkedIn, "Introducing Northguard and Xinfra: scalable log storage at LinkedIn", 25 Jun 2025: [post](https://www.linkedin.com/blog/engineering/infrastructure/introducing-northguard-and-xinfra). Added by the second research pass to replace the stale 2015 numbers. "Over 32T records/day at 17 PB/day on 400K topics ... 10K+ machines within 150 clusters" (the page says 17 PB/day; some press says total, use the page). Segments, sealed at 1GB or after an hour, are the unit of replication, so a new broker needs no data moved onto it; the Raft metadata shards number "N (128+)". Kafka's lazy sync (10 seconds or 20k records) against Northguard's fsync on all replicas before the ack (10 ms, 20k records or 10 MB). Trade-off: Kafka partitions are heavyweight, so topics were set to "sacrifice consistency for produce availability"; migration uses topic epochs and dual writes. Weakness: a qualitative evaluation table, no latency percentiles; the "Current state" section was only partly read.
- Paper, Uber, "Real-time Data Infrastructure at Uber", arXiv 2104.00087: [PDF](https://arxiv.org/pdf/2104.00087). "As of October 2020, trillions of messages and petabytes" per day; Kafka retention limited "to only a few days".
- CDC section: Paper, Netflix, "DBLog", arXiv 2010.12597, 2020 ([PDF](https://arxiv.org/pdf/2010.12597)): lock-free watermark approach, chunked selects with progress in ZooKeeper, "tens of microservices", MySQL, PostgreSQL and Aurora. Pair with the Zapier outbox post already in the repo. Airbnb SpinalTap (archive copy, no figures, date unconfirmed) and the Debezium outbox post are explanation only.
- Backup source if the Northguard post is judged too qualitative: Datadog, "Datadog Streaming Platform", 19 Feb 2025 ([post](https://www.datadoghq.com/blog/engineering/streaming-platform-kafka-custom-abstractions/)); strong on offsets and head-of-line blocking, but its figures are scale statements.
- Dropped: LinkedIn "Running Kafka at Scale" (2015, stale numbers) and Uber's Kafka tiered storage post (2024, no measured numbers).

### autoscaling-and-capacity (Scaling, ok)

- Paper, Rzadca et al. (Google), "Autopilot: workload autoscaling at Google", EuroSys 2020: [author-hosted PDF](https://homepages.dcc.ufmg.br/~cunha/teaching/20221/cloudcomp/readings/10-readings/rzadca20autopilot.pdf), official page research.google/pubs/pub49174/. Autopiloted jobs have slack 23% versus 46% for manual; OOM-hit jobs cut by a factor of 10; over 48% of fleet-wide resource usage. Confirm the author-hosted copy is the published version.
- MongoDB, "MongoDB Predictive Auto-Scaling: An Experiment", 7 Apr 2026: [post](https://www.mongodb.com/company/blog/engineering/mongodb-predictive-auto-scaling-an-experiment). 25 million sampled points; about 25% of replica sets have weekly seasonality; trend interpolation beats naive baseline 68% of the time (29% error reduction); under 7% error for about 45%, 13% excluded; target CPU 50-75%, planner looks 15 minutes ahead. A database vendor, though it runs Atlas at scale: owner call. A third post is not yet opened.

### time-clocks-and-consistency (Data, ok)

Replaces the separate time-clocks-and-ordering and consistency-models nodes. Teach why wall clocks cannot order events, logical clocks (through the Dynamo paper already in the repo), bounded-uncertainty clocks (Spanner, already in the repo), and what consistency levels cost and how often they differ in production. CRDTs are a short section.

- Meta, "Building a more accurate time service at Facebook scale", 18 Mar 2020, show the year: [post](https://engineering.fb.com/2020/03/18/production-engineering/ntp-service/). Accuracy improved from 10 milliseconds to 100 microseconds; ntpd replaced with chrony.
- Paper, Lu et al. (Facebook), "Existential Consistency", SOSP 2015, older than five years, show the year: [PDF](https://sigops.org/s/conferences/sosp/2015/current/2015-Monterey/240-lu-online.pdf). 0.0004% of reads to vertices would differ in a linearizable system.
- Spanner OSDI 2012 (7 ms TrueTime bound) and Dynamo SOSP 2007 are already used by other topics; link to them rather than reusing them as new sources.
- Not used: Cockroach Labs "Living without atomic clocks" (its date is unconfirmed: 2022 shown, a 2016 string in the text), the DynamoDB ATC 2022 figures (they are throughput, not consistency; adaptive capacity belongs to sharding), and hybrid logical clocks (not confirmed in any opened text). The Figma multiplayer post (no numbers) is explanation only for CRDTs.
- Gap: a second measured consistency source. TAO stays with the graph-store capstone.

### exactly-once-processing (Messaging, needs a second source)

Keep narrow: effectively-once is at-least-once plus an idempotent or transactional sink; do not re-teach idempotency keys. Stays later until a second company source is found.

- Uber, "Real-Time Exactly-Once Ad Event Processing with Apache Flink, Kafka, and Pinot", 23 Sep 2021, archive copy: [post](https://www.uber.com/en-US/blog/real-time-exactly-once-ad-event-processing/). Checkpoint every 2 minutes with two-phase commit; "hundreds of millions of ad events per week".
- Confluent, "Exactly-Once Semantics Are Possible", 30 Jun 2017: explanation only (the owner does not count Confluent as a source under rule 4). Do not take its 3% figure into a topic.
- Netflix Keystone (below) is the at-least-once counterexample. No before and after error-rate figure was found.

### stream-vs-batch-processing (Data, ok)

- Uber, "Designing a Production-Ready Kappa Architecture", 23 Jan 2020, archive copy: [post](https://www.uber.com/en-US/blog/kappa-architecture-data-stream-processing/). Lambda "requires maintaining two disparate codebases"; replaying days of data into Kafka risks "overwhelming the system's infrastructure". Strong trade-offs, few numbers.
- Uber paper above ([PDF](https://arxiv.org/pdf/2104.00087)): Kappa "requires very long data retention in Kafka"; Kappa+ reads Hive directly with bounded input and throttling.
- Netflix, "Keystone Real-time Stream Processing Platform", archive copy, page date not captured: [post](https://netflixtechblog.com/keystone-real-time-stream-processing-platform-a3ee651812a). "Trillions of events and petabytes" per day; one Flink cluster per job. Confirm the date.
- Maestro (87.5% more executed jobs) is optional and weak; skip unless a pipelines node is wanted.

### disaster-recovery-and-backups (Reliability, ok)

Chaos engineering is folded in as "testing the recovery path".

- GitLab, "Postmortem of database outage of January 31", 2017, unchanged fundamental: [post](https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/). About 300 GB deleted; roughly 5,000 projects, 5,000 comments and 700 user accounts lost; five protection mechanisms failed; the S3 backup bucket was empty and failure emails were rejected.
- Paper, Meta, "Maelstrom", OSDI 2018: [PDF](https://www.usenix.org/system/files/osdi18-veeraraghavan.pdf). Drains a datacenter in under 40 minutes; first drill tests took more than 10 hours; 100+ disasters mitigated; a fibercut cost over 85% of a backbone's capacity. Academic venue but first-party Meta engineering.
- Gap: no cloud-provider region-evacuation post opened. The Meta 4 Oct 2021 outage post was dropped for lack of verifiable figures.

### probabilistic-data-structures (Data, ok)

- Meta, "Ribbon filter", 2021: [post](https://engineering.fb.com/2021/07/09/data-infrastructure/ribbon-filter/). Well-engineered Bloom filters use about 50 percent more space than the lower bound; Ribbon overhead can be 1 percent or less and saves roughly 1/3 of memory. It assumes the reader knows Bloom filters, so the node sits after storage-engines and indexing.
- Meta, "HyperLogLog in Presto", 13 Dec 2018: [post](https://engineering.fb.com/2018/12/13/data-infrastructure/hyperloglog/). 2,048 buckets of 5 bits is 1.2 KB for about 2.8 percent average error; speedups 7x to 1,000x. Reuse Cloudflare "Saving 100 TB of RAM with math" already in the repo. Ribbon false-positive figures were not captured.

### service-mesh-and-api-gateways (Scaling, needs a second source)

- Lyft, "Announcing Envoy", 14 Sep 2016, archive copy: [archive](https://web.archive.org/web/2020/https://eng.lyft.com/announcing-envoy-c-l7-proxy-and-communication-bus-92520b6c8191). About 30 services already showed sporadic network failures; later over one hundred services and over 2 million requests per second. The sentence reads "Today" in a 2016 post: label it "at launch".
- Lyft engineers via InfoQ, 9 Aug 2018: [article](https://www.infoq.com/articles/envoy-service-mesh-cascading-failure/). 95% reduction in load-based incidents on critical services; overlaps circuit-breakers, so use the mesh angle.
- Netflix, "Zuul 2", 21 Sep 2016, archive copy, 10 years old: [archive](https://web.archive.org/web/2023/https://netflixtechblog.com/zuul-2-the-netflix-journey-to-asynchronous-non-blocking-systems-45947377fb5c). About 25% more throughput and 25% lower CPU; "more than 83 million members" is a 2016 figure. No 2022+ company post on sidecar cost or ambient meshes passed.

### api-design-rpc-rest-graphql (Messaging, ok)

- Dropbox, "Courier: Dropbox migration to gRPC", 8 Jan 2019, 7+ years old: [post](https://dropbox.tech/infrastructure/courier-dropbox-migration-to-grpc). Hundreds of services, millions of requests per second; grpc-go hardcodes a 16Mb bandwidth-delay bound; AES-128-GCM benchmark of 4534.4 MB/s per core.
- Netflix, "How Netflix Scales its API with GraphQL Federation (Part 1)", 9 Nov 2020, archive copy: [archive](https://web.archive.org/web/2024/https://netflixtechblog.com/how-netflix-scales-its-api-with-graphql-federation-part-1-ae3557c187e2). About 10 ms worst-case planning overhead; deployed for the studio ecosystem only, so do not generalise. No REST-versioning post found; keep the scope to RPC vs graph vs plain HTTP.

### online-schema-migrations (Reliability, needs a second source)

- GitHub, "gh-ost", 1 Aug 2016, older than five years: [post](https://github.blog/engineering/infrastructure/gh-ost-github-s-online-migration-tool-for-mysql/). Triggerless, reads the binary log into a ghost table, then swaps.
- Stripe, "Online migrations at scale": [post](https://stripe.com/blog/online-migrations). Hundreds of millions of Subscriptions objects migrated at 100% operation; four-phase dual writing with GitHub Scientist. Date unconfirmed (believed 2017); only the first phase name was confirmed verbatim.
- Neither has migration durations or table sizes; a third source with numbers (a Shopify or Figma post was suggested but not searched) is required.

### observability-and-slos (Reliability, needs a second source)

- Paper, Google, "Dapper", 2010, unchanged fundamental: [PDF](https://static.googleusercontent.com/media/research.google.com/en//archive/papers/dapper-2010-1.pdf). Sampling every request costs 16.3% latency, 1/16 costs 2.12%, 1/1024 costs -0.20% (noise); median trace latency under 15 seconds.
- Paper, Facebook, "Canopy", SOSP 2017: [PDF](https://cs.brown.edu/~jcmace/papers/kaldor2017canopy.pdf). 1.3 billion traces per day; 129 performance datasets after 2 years; a distributed token bucket controls sampling.
- Google SRE Book, "Service Level Objectives", 2017: [page](https://sre.google/sre-book/service-level-objectives/). GCE target 99.95% ("three and a half nines"); a 50 ms typical request with 5% of requests 20 times slower shows why percentiles beat averages. Also "Embracing Risk" ([page](https://sre.google/sre-book/embracing-risk/)) and the Workbook "Implementing SLOs" ([page](https://sre.google/workbook/implementing-slos/)), with few measurements. No company post on log cost or metric cardinality was opened (Uber M3, Netflix Atlas, Honeycomb not fetched).

### multi-region-traffic-routing (Reliability, not ready, needs a source)

- Netflix, "Active-Active for Multi-Regional Resiliency", Dec 2013, archive copy: [archive](https://web.archive.org/web/2023/https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b). Geo-DNS about 50/50 between regions; a test wrote 1 million records in one region and read them from the other 500 ms later; traffic stayed in US-West-2 for over 24 hours. The page header shows Feb 12, 2013 but the text refers to June 2013 events: cite as "2013". Meta Taiji and Maelstrom were not usable as raw text for this node (Maelstrom is used under disaster recovery).

### search-and-inverted-indexes (not a node: improve the existing Indexing and Search topic)

The existing topic `indexing` (title "Indexing and Search") already teaches inverted indexes with GitHub code search (2023) and Discord (2025), so a separate node would overlap. Add one post as a third source:

- Notion, "Rebuilding Notion's lexical search reindexer", 10 Aug 2026: [post](https://www.notion.com/blog/rebuilding-notions-lexical-search-reindexer). Full reindex from 2+ weeks to under 2 days; catch-up from about 2 days to under 1 hour; consistency from about 90% to 100%; direct writes through the indexing API plateaued around 200K documents per second; each old reindex paged on-call 5 to 10 times, the new one 0 times. Trade-offs: a batch job on an online runtime, document code ported with validators, EBS failed so they moved to NVMe. It teaches rebuilding an inverted index without the live write path (snapshots, write aliases, `_reindex` with external versioning), which GitHub (building a custom index) and Discord (sharding a message index) do not. Weakness: no document count, index size or query latency. Notion already has a logo. The raw figures were checked in the Oct 2026 research pass; re-run `add-post` before use.
- Not used: SoundCloud 2019 (720M documents, p95 about 90 ms; old and overlaps Notion), and the Slack ranking and Twitter 2011 posts.

## Build order in four batches, with few prerequisites per node

The order puts every topic whose prerequisites are all existing slugs first, so batch 1 adds nodes without any edge between new nodes. The layout tests fail when a node adds a crossing edge, so each topic lists at most three prerequisites, and each new-to-new edge (log-based-streaming into exactly-once and stream-vs-batch) is introduced only after its source node has shipped and passed the layout test. Test each placement on a stub first (`add-topic` step 1).

Batch 1 is overload-and-cascading-failures, safe-deployments, object-storage and real-time-delivery. All depend only on existing topics and cover three of the four groups. Safe-deployments and overload share a cause (config changes triggered the Google 2019 incident in the metastable paper, Cloudflare 2025 and CrowdStrike 2024; Slack 2021 shows a recovery path overloading itself), which makes a good cross-link. Overload is the weakest of the four (one measured incident post and one paper); look for a retry-amplification post with request-rate numbers while building the others. For safe-deployments, use the AWS pipeline post for the mechanism only: its wave numbers are examples.

Batch 2 is log-based-streaming (with CDC as a section), autoscaling-and-capacity and time-clocks-and-consistency. The log node must land before anything in the stream cluster. Time-clocks-and-consistency keeps replication, consensus and cap as prerequisites.

Batch 3 is exactly-once-processing (only once a second company source is found), stream-vs-batch-processing and disaster-recovery-and-backups. Exactly-once and stream-vs-batch need log-based-streaming.

Batch 4 is probabilistic-data-structures, service-mesh-and-api-gateways, api-design-rpc-rest-graphql and online-schema-migrations (it relates to CDC as a link, not a prerequisite). Observability-and-slos follows when a second company source is found; multi-region-traffic-routing waits after the capstones for sources.

Any time: add the Notion 2026 reindexing post to the existing Indexing and Search topic (an `add-post` task, no new node).

## Capstone track: five minimal, up to eight extended

A capstone is a system that combines existing and new topics, so each depends on batches already shipped.

**Minimal track.** First, chat and real-time messaging (needs batch 1 real-time-delivery; also consistent-hashing, pub-sub, load-balancing, failover, http-tcp-tls, caching). Slack 2023 now belongs to real-time-delivery only (each source appears in one place), and Discord's posts are already on other topics, so this capstone needs its own sources. None has been found (a Messenger URL guess returned 404), so it is **not ready** until one is. Second, metrics and monitoring pipeline (after storage-engines, sharding and batch 2). Excellent sources: Gorilla, VLDB 2015 ([paper](https://www.vldb.org/pvldb/vol8/p1816-teller.pdf)): 700 million data points added per minute, average 1.37 bytes per point (12x from 16 bytes), at least 85% of queries for the past 26 hours; Monarch, VLDB 2020 ([paper](https://www.vldb.org/pvldb/vol13/p3181-adams.pdf)): close to a petabyte in memory, terabytes per second ingested; Uber M3, 2018 ([post](https://www.uber.com/blog/m3/)): over 6.6 billion time series, 500 million metrics per second aggregated. Third, file sync and storage (after object-storage and replication): Dropbox "Rewriting the heart of our sync engine" (9 Mar 2020, [post](https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine)); strong on trade-offs, no latency or durability digits. Magic Pocket stays with object-storage, so file sync needs one more source with numbers. Fourth, payments ledger (after distributed-transactions and replication): Uber, "How LedgerStore Supports Trillions of Indexes", 4 Apr 2024 ([post](https://www.uber.com/blog/how-ledgerstore-supports-trillions-of-indexes/)): a 1K WCU per partition throttling peak shaped a write-optimized buffer index, and card holds need strong indexes while payment history tolerates seconds of lag; plus Stripe on idempotency, 22 Feb 2017 ([post](https://stripe.com/blog/idempotency)), which has no numbers and may belong on the idempotency topic. Fifth, social graph store (after caching and replication): TAO, USENIX ATC 2013 ([paper](https://www.usenix.org/system/files/conference/atc13/atc13-bronson.pdf)) with reads 99.8% of requests and replication lag under 3 seconds 99% of the time; and "Scaling Memcache at Facebook", NSDI 2013 ([paper](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf)): over a billion requests per second, the gutter pool cuts client-visible failures by 99%. Both are 2013 papers and must show the year. The notes found **no primary source for feed fanout**, so frame this capstone as a graph store and caching tier, not a feed, until a fanout post is found.

**Extended track.** Notification system (LinkedIn, "Air Traffic Controller", 2018, [post](https://www.linkedin.com/blog/engineering/messaging-notifications/air-traffic-controller-member-first-notifications-at-linkedin): over a billion requests per day, member complaints cut in half; Uber push platform on gRPC, 16 Aug 2022, [post](https://www.uber.com/blog/ubers-next-gen-push-platform-on-grpc/), few numbers); fair strength. Live video (Facebook, 3 Dec 2015, [post](https://engineering.fb.com/2015/12/03/ios/under-the-hood-broadcasting-live-video-to-millions/): about 1.8 percent of requests leaked past the edge cache); one 2015 source, needs a newer second one. Ride matching and dispatch (Uber H3, 27 Jun 2018, and Ringpop); **not ready**: no primary dispatch post opened. Rank it last.

Capstone order by dependency: chat first (after batch 1, once it has its own source), metrics pipeline and file sync after batch 2, payments ledger after distributed-transactions work is solid (it also benefits from CDC), graph store after consistency-models.

## What to have before announcing at sys101.vercel.app

The site is live with 22 topics, so the announcement should not be a single node. Announce after **batches 1 and 2 (7 new topics, 29 in total)**, and add the chat capstone only once it has sources of its own. The absolute minimum is batch 1 (26 topics): all four nodes have strong or ok sources and no new-to-new edges. Each new topic needs the process the repo already requires (content JSON, learn page, background entry, logos for any new company, graph layout tests, check-seo and the other post-build checks), and every figure re-grepped from the raw page.

Avoid shipping first, in order of weakness: multi-region-traffic-routing (one 2013 post), observability-and-slos and online-schema-migrations (a second source with numbers is needed), exactly-once-processing (the only company post is Uber 2021), service-mesh (nothing after 2018), and the chat (no source yet), ride-dispatch, live-video and feed-fanout capstones.

## Dropped and folded candidates

Connection pooling and proxy tiers: no standalone node, only one qualifying post (OpenAI, "Scaling PostgreSQL to power 800 million ChatGPT users", 22 Jan 2026, [post](https://openai.com/index/scaling-postgresql/), read through a Wayback copy; PgBouncer cut average connection time from 50 ms to 5 ms in benchmarks) and Figma's pooling post is already used by sharding. Fold a section into databases or replication. CRDTs: no production post with verified scale numbers; a section of time-clocks-and-consistency. Change data capture and the outbox: a section of log-based-streaming, not a node. Consistency models: merged into time-clocks-and-consistency. Search and inverted indexes: not a node, the existing Indexing and Search topic gets a new post. Data pipelines and backfills as a node: folded into stream-vs-batch-processing. Chaos engineering: only the Netflix paper (arXiv 1702.05843, 2017) with no verifiable numbers; folded into disaster recovery. Backpressure and load shedding, and cascading and metastable failures: one node. Service discovery and API gateways as separate nodes: too thin; merged into the mesh. ID generation or URL shortener as a capstone: no source passed. Also dropped: Airbnb "Avoiding double payments" (Medium member-only), Instagram ID sharding, Twitter Snowflake, Netflix live, the Twitter Timelines talk, the Meta 4 Oct 2021 outage post, all SpinalTap figures, LinkedIn "Instant Messaging" (2016), LinkedIn "Running Kafka at Scale" (2015), Uber's Kafka tiered storage post (no measured numbers), Cockroach "Living without atomic clocks" (date unconfirmed), SoundCloud reindexing (2019, overlaps Notion).

## Open risks

Figures to re-verify live, because they were read from Wayback copies: the Lyft Envoy, Netflix Zuul 2, Active-Active, GraphQL Part 1, Pushy, Keystone and Maestro posts, Uber's Kappa and exactly-once posts, Airbnb SpinalTap. Statements inside 2016 posts (Envoy "2 million requests per second", Zuul "83 million members") need the 2016 label. The Autopilot PDF is author-hosted and should be matched to the ACM or Google page. The LinkedIn Northguard post's "Current state" section was only partly read.

Dates unconfirmed: Stripe online migrations (believed 2017), Netflix Keystone, Netflix Maestro, Slack search, SpinalTap, Ringpop, and the Netflix Active-Active header date. Settled in the second pass: Magic Pocket (6 May 2016) and its figures; the Slack 2021 post and its real URL.

Source rules, as decided by the owner (see "Owner decisions"): papers by teams that ran the system, MongoDB Atlas and the CrowdStrike RCA count; Confluent and Debezium are explanation only. Still to confirm: whether a second Google SRE Book page on cascading failures counts as distinct from the Handling Overload page already in use (it is now mechanism only), and whether the Metastable paper, accepted as an analysis paper, should stay if a measured incident post is found.

Exact-grep before use: run an exact grep of every URL above against `content/topics/*.json` (the first notes filtered by host keywords). Known repo overlaps to avoid reusing as new sources: sre.google handling-overload, the Uber Cinnamon post, AWS static-stability and timeouts-retries, Spanner OSDI 2012, Dynamo SOSP 2007, Zapier outbox, GitHub code search, Discord indexing, Elixir and storage posts, Meta "Cache made consistent", Cloudflare "Saving 100 TB of RAM with math", Figma sharding and the Dropbox Robinhood post, Spotify event delivery, Slack job queue and Uber consumer proxy. Not opened and therefore not usable: Meta Taiji, Meta Holistic Configuration Management, Netflix Kayenta, Bronson et al. HotOS 2021, the original Kafka paper, the Google Dataflow paper, Discord WebRTC figures and Netflix GraphQL Part 2.

## Conclusion

The notes show the course is strongest where a company or paper has published measured failure data (overload, deployments, storage, real-time connections), and weakest where the best sources teach mechanisms without numbers (CDC, schema migrations, SLOs). That points to a build order driven by source quality, not topic fashion: ship the strong, existing-prerequisite nodes first, close second-source gaps in parallel, and let the capstones reuse those nodes rather than introduce new facts.

The two decisions that gated the plan are now settled (see "Owner decisions"). What remains is closing the open sources (a retry-amplification post, a chat capstone source, a file-sync source, second sources for exactly-once, observability and schema migrations) and clearing the unconfirmed dates and archive-only figures before any topic is announced.
