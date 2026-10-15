# Future topics roadmap

> Research plan from October 2026, not verified content. The posts and figures below come from research notes read through fetch tools and some Wayback copies. Before any of them goes into a topic file, run the `add-post` skill (raw-page figure check, exact-URL grep against `content/topics/*.json`, logo check). Read this file only when planning or choosing the next topic; the short version is in CLAUDE.md "Future plan".

# Eight strong topics are ready to build next

sys101 can add **8 topics now with sources that pass the selection rules**: overload-and-cascading-failures, safe-deployments, object-storage, real-time-delivery, log-based-streaming, autoscaling-and-capacity, time-clocks-and-ordering and consistency-models. Seven more (change-data-capture, exactly-once-processing, stream-vs-batch-processing, disaster-recovery-and-backups, probabilistic-data-structures, service-mesh-and-api-gateways, api-design-rpc-rest-graphql) have usable but thinner sources and should follow once a second source or an owner judgement call is in. Three more (observability-and-slos, online-schema-migrations, multi-region-traffic-routing) need a second source before they are promoted, and search-and-inverted-indexes has **no new source that passes** and is marked "not ready, needs a source". The five research notes proposed about 26 overlapping candidates; merging them (CDC appears in both the data and messaging notes, observability and SLOs overlap, backpressure and metastable failures are one idea, service discovery and API gateways fold into the mesh) gives 19 topics plus one parked candidate. Build them in four batches of 3 to 4 topics, each topic keeping at most three prerequisites because the course graph already fails layout tests when a new node adds a crossing edge. Capstones come last: chat and a metrics pipeline have the strongest source sets, followed by file sync, payments ledger and a graph store (the feed capstone lacks a fanout source). To go live with a credible update, ship batches 1 and 2 (8 new topics, 30 in total) and avoid announcing the weakest-sourced ones first.

## Ranked recommendation: 20 candidates after merging overlaps

Ranking weighs source strength first (rule 1 numbers, rule 3 age, rule 4 credibility), then how many existing topics the node unlocks. Prerequisites are existing slugs unless marked (new). Where the notes disagreed on a group, the choice is given in the conflicts paragraph below the table.

| slug | title | group | prerequisites | source strength | priority tier |
| - | - | - | - | - | - |
| overload-and-cascading-failures | Overload, backpressure and cascading failures | Reliability | rate-limiting, circuit-breakers, idempotency-and-retries | strong | next |
| safe-deployments | Safe deployments and config rollout | Reliability | load-balancing, failover | strong | next |
| object-storage | Object storage | Data | storage-engines, replication | strong | next |
| real-time-delivery | Real-time delivery at scale | Scaling | consistent-hashing, pub-sub, http-tcp-tls | strong | next |
| log-based-streaming | Log-based streaming | Messaging | message-queues, pub-sub, replication | strong | next |
| autoscaling-and-capacity | Autoscaling and capacity | Scaling | load-balancing, caching | ok (two sources, both with numbers) | next |
| time-clocks-and-ordering | Time, clocks and ordering | Data | replication, consensus | ok (one date unconfirmed) | next |
| consistency-models | Consistency models | Data | cap, replication | ok (one measured source) | next |
| change-data-capture | Change data capture and outbox | Messaging | log-based-streaming (new), replication | needs a second source (no numbers) | later |
| exactly-once-processing | Exactly-once processing | Messaging | idempotency-and-retries, log-based-streaming (new) | needs a second source (one is vendor) | later |
| stream-vs-batch-processing | Stream vs batch processing (backfills folded in) | Data | log-based-streaming (new), storage-engines | ok | later |
| disaster-recovery-and-backups | Disaster recovery and backups | Reliability | replication, failover | ok | later |
| probabilistic-data-structures | Bloom filters, Ribbon, HyperLogLog | Data | indexing, storage-engines | ok | later |
| service-mesh-and-api-gateways | Service mesh and API gateways (discovery folded in) | Scaling | load-balancing, circuit-breakers | needs a second source (nothing after 2018) | later |
| api-design-rpc-rest-graphql | API design: RPC, REST, GraphQL | Messaging | http-tcp-tls, idempotency-and-retries | ok (2019, 2020 sources) | later |
| online-schema-migrations | Online schema migrations | Reliability | databases, replication | needs a second source (no numbers) | later |
| observability-and-slos | Observability and SLOs (merged) | Reliability | load-balancing, message-queues | needs a second source (papers and one vendor-style book) | later |
| multi-region-traffic-routing | Multi-region traffic routing | Reliability | dns, failover, replication | not ready, needs a source (one 2013 post) | after capstones |
| search-and-inverted-indexes | Search and inverted indexes | Data | indexing, sharding | not ready, needs a source | after capstones |
| (capstones) | see the capstone section | n/a | n/a | see section | after batch 2 onward |

The conflicts the notes left open, resolved here. CDC was filed under Data in one note and Messaging in another; it goes in **Messaging**, because it needs log-based-streaming first and leads on to event-driven-architecture, which keeps its edges inside one group. Observability and SLOs merge into one node: the SLO material is the smallest node in the notes, all three Google pages are one company's guidance with few measurements, and the observability evidence is two papers, so the combined node is still weak and waits for a second company source. The service mesh was filed under Reliability or Scaling; it goes in **Scaling** next to load-balancing, with circuit-breakers as its second prerequisite. Online schema migrations was Reliability or Data; it goes in **Reliability** (safe change under load). The notes ordered CDC before schema migrations because gh-ost reads the binary log, which is the CDC idea, but that is taught as a link, not a third prerequisite.

## Per-topic sources and verified figures

Every figure below is as the notes recorded it from raw page or PDF text. "Archive copy" means the live page blocked curl and the figure was read from a Wayback copy that should be re-checked live before publishing. Posts older than five years carry their year.

### overload-and-cascading-failures (Reliability, strong)

The node should teach failure dynamics (goodput collapse, retry amplification, metastable state, recovery below capacity), not the shedding algorithm, because rate-limiting and circuit-breakers already cite the SRE Handling Overload page and the Uber Cinnamon post.

- AWS Builders' Library, "Using load shedding to avoid overload", undated, current: [page](https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/). Goodput is the subset of throughput handled successfully with low latency; when median response time equals the client timeout, "half of the requests are timing out, so the availability is 50 percent"; if a service sheds 60 percent of traffic, median latency can look excellent because rejections are fast. Conceptual, few hard numbers.
- Google SRE Book, "Addressing Cascading Failures", 2017, unchanged fundamental: [page](https://sre.google/sre-book/addressing-cascading-failures/). Clusters A and B each fine at 1,000 QPS; when B fails, A receives 1,200 QPS and its successful handling dips well below 1,000; a service healthy at 10,000 QPS that fails at 11,000 QPS will not recover by dropping to 9,000 QPS; with only 10% of servers healthy the rate must drop to about 1,000 QPS.
- Paper, Huang et al., "Metastable Failures in the Wild", OSDI 2022: [PDF](https://www.usenix.org/system/files/osdi22-huang-lexiang.pdf). 22 metastable failures from 11 organizations; at least 4 of 15 major AWS outages in the last decade were metastable; its table lists the 2019-03-12 Google outage (4.17 hours) and the 2019-10-31 Google Compute Engine incident (21.5 hours). Academic-led with industry incident data: owner judgement on rule 4.
- Netflix, "Performance Under Load", 2018, archive copy of netflixtechblog.medium.com/performance-under-load-3e6fa9a60581: the adaptive-limit formula only (gradient = RTTnoload / RTTactual; newLimit = currentLimit x gradient + queueSize); no hard measurements, so use as illustration, not as a numbers source.

### safe-deployments (Reliability, strong)

- AWS Builders' Library, "Automating safe, hands-off deployments", undated, current: [page](https://aws.amazon.com/builders-library/automating-safe-hands-off-deployments/). 24 Regions or 76 Availability Zones one at a time would take weeks, so pipelines deploy in waves (example: 3 Regions in wave 3, up to 12 in wave 4, the rest in wave 5); each wave starts with a one-box stage; in gamma the one box stays on new code for a period such as 30 minutes or one hour at about ten percent of gamma canary traffic.
- Cloudflare, "Cloudflare outage on November 18, 2025": [post](https://blog.cloudflare.com/18-november-2025-outage/). Failures began 11:20 UTC, a known good file was inserted by 14:30, all normal at 17:06; a ClickHouse permissions change at 11:05 doubled the Bot Management feature file; the limit is 200 features against about 60 in use; the file is regenerated every five minutes and pushed network-wide.
- CrowdStrike, "Channel File 291 Incident Root Cause Analysis", 6 Aug 2024: [PDF](https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf). The template defined 21 input fields but the integration code supplied 20; testing passed because the 21st was matched with wildcards; remediation includes staged deployment of template instances. Vendor RCA, not a service-at-scale blog: flag for owner.

### object-storage (Data, strong)

- Andy Warfield, "Building and operating a pretty big storage system called S3", 27 Jul 2023: [post](https://www.allthingsdistributed.com/2023/07/building-and-operating-a-pretty-big-storage-system.html). Since the first drive capacity improved 7.2M times, seek times only 150x; at 200TB drives the allowance is 1 I/O per second per 2TB; built from hundreds of microservices; objects are erasure coded across tens of drives and spread over millions of drives. Object-count and durability figures were not found and are dropped.
- Paper, Beaver et al. (Facebook), "Finding a needle in Haystack", OSDI 2010, older than five years, fundamental unchanged: [PDF](https://www.usenix.org/legacy/event/osdi10/tech/full_papers/Beaver.pdf). Over 260 billion images, more than 20 petabytes; one billion new photos (about 60 terabytes) per week; over one million images per second at peak; each usable terabyte costs about 28% less and serves about 4x more reads per second than on a NAS appliance; metadata access is the bottleneck.
- Dropbox, "Inside the Magic Pocket": [post](https://dropbox.tech/infrastructure/inside-the-magic-pocket). Multi-exabyte growth in about 6 months from double-digit-petabyte prototypes; 1GB buckets; cells around 50PB raw; over a petabyte per machine, over 8 PB per rack. Date conflict: the capstone note records 6 May 2016, the data note could not find a date. Confirm before use. The capstone note also records blocks up to 4MB keyed by SHA-256 and a cell supporting around a hundred petabytes, which differs from the "around 50PB" figure; re-check both against the page.

### real-time-delivery (Scaling, strong)

Discord Elixir is already used elsewhere, so it is not reused.

- Slack, "Real-time Messaging", 11 Apr 2023: [post](https://slack.engineering/real-time-messaging/). About 16 million channels per host at peak; a replacement channel server ready "in under 20 seconds"; global delivery "in 500ms"; tens of millions of connected clients; consistent hashing routes channels.
- Netflix, "Pushy to the Limit", 10 Sep 2024, archive copy: [post](https://netflixtechblog.com/pushy-to-the-limit-evolving-netflixs-websocket-proxy-for-the-future-b468bc0ff658). "Hundreds of millions of concurrent WebSocket connections", 99.999% delivery reliability, 200,000 connections per node average with room to 400,000.
- LinkedIn, "Instant Messaging at LinkedIn", 2016 (year from URL path only), archive copy: [post](https://engineering.linkedin.com/blog/2016/10/instant-messaging-at-linkedin--scaling-to-hundreds-of-thousands-). A 4 GB JVM heap ran out, 8 GB ran out at about 90K connections on one node. Show the year.
- Dropped: Slack "over 5 million simultaneous WebSocket connections" appears only on secondary sites.

### log-based-streaming (Messaging, strong)

Frame it around storage, partitions, offsets and replay, not events as a design style, since event-driven-architecture exists.

- LinkedIn, Jay Kreps, "The Log", 16 Dec 2013, archive copy, old but unchanged fundamental: [post](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying). "Over 60 billion unique message writes through Kafka per day".
- LinkedIn, Todd Palino, "Running Kafka At Scale", 20 Mar 2015: [post](https://engineering.linkedin.com/kafka/running-kafka-scale). Over 800 billion messages per day, over 175 TB; over 650 TB consumed daily; over 1100 brokers in more than 60 clusters. Teach the model, not the current numbers.
- Paper, Uber, "Real-time Data Infrastructure at Uber", arXiv 2104.00087: [PDF](https://arxiv.org/pdf/2104.00087). "As of October 2020, trillions of messages and petabytes" per day; Kafka retention limited "to only a few days".

### autoscaling-and-capacity (Scaling, ok)

- Paper, Rzadca et al. (Google), "Autopilot: workload autoscaling at Google", EuroSys 2020: [author-hosted PDF](https://homepages.dcc.ufmg.br/~cunha/teaching/20221/cloudcomp/readings/10-readings/rzadca20autopilot.pdf), official page research.google/pubs/pub49174/. Autopiloted jobs have slack 23% versus 46% for manual; OOM-hit jobs cut by a factor of 10; over 48% of fleet-wide resource usage. Confirm the author-hosted copy is the published version.
- MongoDB, "MongoDB Predictive Auto-Scaling: An Experiment", 7 Apr 2026: [post](https://www.mongodb.com/company/blog/engineering/mongodb-predictive-auto-scaling-an-experiment). 25 million sampled points; about 25% of replica sets have weekly seasonality; trend interpolation beats naive baseline 68% of the time (29% error reduction); under 7% error for about 45%, 13% excluded; target CPU 50-75%, planner looks 15 minutes ahead. A database vendor, though it runs Atlas at scale: owner call. A third post is not yet opened.

### time-clocks-and-ordering (Data, ok)

- Cockroach Labs, "Living without atomic clocks": [post](https://www.cockroachlabs.com/blog/living-without-atomic-clocks/). TrueTime upper bound 7ms; NTP gives 100ms to 250ms; a node 100ms behind commits at ts=100ms while the earlier commit sits at ts=150ms. Page shows Jan 27, 2022 but contains a "2016" string, so the original date is unconfirmed. Vendor blog.
- Meta, "Building a more accurate time service at Facebook scale", 18 Mar 2020: [post](https://engineering.fb.com/2020/03/18/production-engineering/ntp-service/). Accuracy improved from 10 milliseconds to 100 microseconds; ntpd replaced with chrony.
- Spanner OSDI 2012 is already in the repo as the third source. Hybrid logical clocks are unconfirmed in the Cockroach text. Lamport and vector clocks should be taught through the Dynamo paper already in the repo.

### consistency-models (Data, ok)

- Paper, Lu et al. (Facebook), "Existential Consistency", SOSP 2015, older than five years: [PDF](https://sigops.org/s/conferences/sosp/2015/current/2015-Monterey/240-lu-online.pdf). 0.0004% of reads to vertices would differ in a linearizable system.
- Paper, Elhemali et al. (Amazon), DynamoDB, USENIX ATC 2022: [PDF](https://www.usenix.org/system/files/atc22-elhemali.pdf). 66-hour Prime Day 2021, peak 89.2 million requests per second. These are throughput figures, so use sparingly here; adaptive capacity (over 99.99% of skew throttling eliminated) belongs to sharding.
- CRDTs are taught here as a section. The Figma multiplayer post ([page](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)) explains it but has no numbers and cannot stand alone. No causal-consistency production post was opened.

### change-data-capture (Messaging, needs a second source)

Strong conceptually, weak on rule 1. Pair with the Zapier outbox post already in the repo.

- Paper, Netflix, "DBLog", arXiv 2010.12597, 2020: [PDF](https://arxiv.org/pdf/2010.12597). Lock-free watermark approach, chunked selects with progress in ZooKeeper; used by "tens of microservices"; runs on MySQL, PostgreSQL and Aurora.
- Airbnb, "Capturing Data Evolution in a Service-Oriented Architecture" (SpinalTap), archive copy: [post](https://web.archive.org/web/2022/https://medium.com/airbnb-engineering/capturing-data-evolution-in-a-service-oriented-architecture-72f7c643ee6f). At-least-once, in-order delivery; no throughput figure found, all figures dropped. Date conflict: the messaging note gives 15 Aug 2018, the data note found no confirmable date. Confirm.
- Debezium outbox post, 19 Feb 2019 ([post](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/)): explanation only, not a scored source (open-source project blog).

### exactly-once-processing (Messaging, needs a second source)

Keep narrow: effectively-once is at-least-once plus an idempotent or transactional sink; do not re-teach idempotency keys.

- Uber, "Real-Time Exactly-Once Ad Event Processing with Apache Flink, Kafka, and Pinot", 23 Sep 2021, archive copy: [post](https://www.uber.com/en-US/blog/real-time-exactly-once-ad-event-processing/). Checkpoint every 2 minutes with two-phase commit; "hundreds of millions of ad events per week".
- Confluent, "Exactly-Once Semantics Are Possible", 30 Jun 2017 (updated Mar 2025): [post](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/). Throughput falls "only by 3%" for 1 KB messages with 100 ms transactions, 20% versus the old at-most-once default. Vendor source, borderline on rule 4: owner call.
- Netflix Keystone (below) is the at-least-once counterexample. No before/after error-rate figure was found.

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

### search-and-inverted-indexes (Data, not ready, needs a source)

Only a Slack ranking post (Solr; 9% more clicked searches with the work graph, date not captured) and a 2011 Twitter post (Blender cut latency 3x, 10x throughput) were found; both are weak fits. The repo's GitHub code search and Discord indexing posts could anchor it, but a new Elasticsearch or Lucene engineering post is still missing.

## Build order in four batches, with few prerequisites per node

The order puts every topic whose prerequisites are all existing slugs first, so the first batch adds nodes without any edge between new nodes. The layout tests fail when a node adds a crossing edge, so each topic above lists two or three prerequisites at most, and each new-to-new edge (log-based-streaming into CDC, exactly-once and stream-vs-batch) is introduced only after its source node has shipped and been through the layout test.

Batch 1 is overload-and-cascading-failures, safe-deployments, object-storage and real-time-delivery. All four are strong, all depend only on existing topics, and they cover three of the four groups. Safe-deployments and overload also share a cause (config changes triggered the Google 2019 incident in the metastable paper, Cloudflare 2025 and CrowdStrike 2024), which makes a nice cross-link. Real-time-delivery unlocks the chat capstone.

Batch 2 is log-based-streaming, autoscaling-and-capacity, time-clocks-and-ordering and consistency-models. The log node must land before anything in the stream cluster; time before consistency is a teaching order, not a graph edge, so consistency-models keeps cap and replication as its prerequisites. Autoscaling is here because its two sources have numbers and recent dates.

Batch 3 is change-data-capture, exactly-once-processing, stream-vs-batch-processing and disaster-recovery-and-backups. The first three need log-based-streaming. Do not start CDC or exactly-once until the second-source gap in each is closed or the owner accepts the current one. CDC can precede exactly-once if outbox is taught first.

Batch 4 is probabilistic-data-structures, service-mesh-and-api-gateways, api-design-rpc-rest-graphql and online-schema-migrations (after CDC). Observability-and-slos follows when a second company source is found, and multi-region-traffic-routing and search-and-inverted-indexes wait after the capstones for sources.

## Capstone track: five minimal, up to eight extended

A capstone is a system that combines existing and new topics, so each depends on batches already shipped.

**Minimal track.** First, chat and real-time messaging (needs batch 1 real-time-delivery; also consistent-hashing, pub-sub, load-balancing, failover, http-tcp-tls, caching). Strongest arc; the source is the Slack 2023 post above, and Discord's existing topic sources can be cited without new figures. A second new chat source with numbers was not found (a Messenger URL guess returned 404), so it is "good" not "excellent". Second, metrics and monitoring pipeline (after storage-engines, sharding and batch 2). Excellent sources: Gorilla, VLDB 2015 ([paper](https://www.vldb.org/pvldb/vol8/p1816-teller.pdf)): 700 million data points added per minute, average 1.37 bytes per point (12x from 16 bytes), at least 85% of queries for the past 26 hours; Monarch, VLDB 2020 ([paper](https://www.vldb.org/pvldb/vol13/p3181-adams.pdf)): close to a petabyte in memory, terabytes per second ingested; Uber M3, 2018 ([post](https://www.uber.com/blog/m3/)): over 6.6 billion time series, 500 million metrics per second aggregated. Third, file sync and storage (after object-storage and replication): Dropbox "Inside the Magic Pocket" (6 May 2016, [post](https://dropbox.tech/infrastructure/inside-the-magic-pocket)) and "Rewriting the heart of our sync engine" (9 Mar 2020, [post](https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine)); strong on trade-offs, no latency or durability digits. Fourth, payments ledger (after distributed-transactions and replication): Uber, "How LedgerStore Supports Trillions of Indexes", 4 Apr 2024 ([post](https://www.uber.com/blog/how-ledgerstore-supports-trillions-of-indexes/)): a 1K WCU per partition throttling peak shaped a write-optimized buffer index, and card holds need strong indexes while payment history tolerates seconds of lag; plus Stripe on idempotency, 22 Feb 2017 ([post](https://stripe.com/blog/idempotency)), which has no numbers and may belong on the idempotency topic. Fifth, social graph store (after caching and replication): TAO, USENIX ATC 2013 ([paper](https://www.usenix.org/system/files/conference/atc13/atc13-bronson.pdf)) with reads 99.8% of requests and replication lag under 3 seconds 99% of the time; and "Scaling Memcache at Facebook", NSDI 2013 ([paper](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf)): over a billion requests per second, the gutter pool cuts client-visible failures by 99%. Both are 2013 papers and must show the year. The notes found **no primary source for feed fanout**, so frame this capstone as a graph store and caching tier, not a feed, until a fanout post is found.

**Extended track.** Notification system (LinkedIn, "Air Traffic Controller", 2018, [post](https://www.linkedin.com/blog/engineering/messaging-notifications/air-traffic-controller-member-first-notifications-at-linkedin): over a billion requests per day, member complaints cut in half; Uber push platform on gRPC, 16 Aug 2022, [post](https://www.uber.com/blog/ubers-next-gen-push-platform-on-grpc/), few numbers); fair strength. Live video (Facebook, 3 Dec 2015, [post](https://engineering.fb.com/2015/12/03/ios/under-the-hood-broadcasting-live-video-to-millions/): about 1.8 percent of requests leaked past the edge cache); one 2015 source, needs a newer second one. Ride matching and dispatch (Uber H3, 27 Jun 2018, and Ringpop); **not ready**: no primary dispatch post opened. Rank it last.

Capstone order by dependency: chat first (after batch 1), metrics pipeline and file sync after batch 2, payments ledger after distributed-transactions work is solid (it also benefits from CDC), graph store after consistency-models.

## What to have before announcing at sys101.vercel.app

The site is live with 22 topics, so the announcement should not be a single node. The notes imply a bar of strong sources only, so the recommendation is to announce after **batches 1 and 2 (8 new topics, 30 in total) and one capstone, chat**, which uses only a strong source. The absolute minimum is batch 1 (26 topics): all four nodes have strong sources and need no new-to-new edges. Each new topic needs the process the repo already requires (content JSON, learn page, background entry, logos for any new company such as Lyft, MongoDB, Cloudflare use, graph layout tests, check-seo and the other post-build checks), and every figure re-grepped from the raw page.

Avoid shipping first, in order of weakness: search-and-inverted-indexes and multi-region-traffic-routing (no passing source), observability-and-slos and online-schema-migrations (second source with numbers needed), change-data-capture (no verified numbers on either main source), exactly-once-processing (the only large-company post pairs with a vendor), service-mesh (nothing after 2018), and the ride-dispatch, live-video and feed-fanout capstones.

## Dropped and folded candidates

Connection pooling and proxy tiers: no standalone node, only one qualifying post (OpenAI, "Scaling PostgreSQL to power 800 million ChatGPT users", 22 Jan 2026, [post](https://openai.com/index/scaling-postgresql/), read through a Wayback copy; PgBouncer cut average connection time from 50 ms to 5 ms in benchmarks) and Figma's pooling post is already used by sharding. Fold a section into databases or replication. CRDTs: no production post with verified scale numbers; folded into consistency-models. Data pipelines and backfills as a node: the best evidence is the Uber stream-vs-batch story and Netflix Maestro has only job counts; folded into stream-vs-batch-processing. Chaos engineering: only the Netflix paper (arXiv 1702.05843, 2017) with no verifiable numbers; folded into disaster recovery. Backpressure and load shedding, and cascading and metastable failures: merged into one node. Service discovery and API gateways as separate nodes: too thin (one 2016 gateway post); merged into the mesh. ID generation or URL shortener as a capstone: no source passed, taught as a lesson inside chat and graph-store capstones. Also dropped: Airbnb "Avoiding double payments" (Medium member-only), Instagram ID sharding, Twitter Snowflake, Netflix live, the Twitter Timelines talk, the Meta 4 Oct 2021 outage post, and all SpinalTap figures.

## Open risks the owner should settle

Figures to re-verify live, because they were read from Wayback copies: the Lyft Envoy, Netflix Zuul 2, Active-Active, GraphQL Part 1, Pushy, Keystone and Maestro posts, Uber's Kappa and exactly-once posts, Airbnb SpinalTap and LinkedIn instant messaging. Statements inside 2016 posts (Envoy "2 million requests per second", Zuul "83 million members") need the 2016 label. The Autopilot PDF is author-hosted and should be matched to the ACM or Google page.

Dates unconfirmed: Cockroach "Living without atomic clocks" (2022 shown, a 2016 string in the text), Stripe online migrations (believed 2017), Dropbox Magic Pocket (2016 in one note, not found in the other), Netflix Keystone, Netflix Maestro, Slack search, SpinalTap (2018 in one note, unconfirmed in the other), LinkedIn IM (2016 from the URL only), Ringpop, and the Netflix Active-Active header date.

Sources that are vendor- or academic-led and need an owner judgement call on rule 4: Confluent (exactly-once), Cockroach Labs and MongoDB (database vendors writing about their products), CrowdStrike (vendor RCA), the Debezium blog, the Metastable Failures paper (academic-led with industry data), and the AWS Builders' Library pages (company engineering, undated). A second Google SRE Book page on cascading failures also needs the owner to say whether it counts as distinct from the Handling Overload page already in use.

Exact-grep before use: the notes checked by company and host keywords, and the reliability note says its grep "was filtered by host keywords, so do a final exact-URL grep before adding". Run an exact grep of every URL above against `content/topics/*.json`. Known repo overlaps to avoid reusing as new sources: sre.google handling-overload, the Uber Cinnamon post, AWS static-stability and timeouts-retries, Spanner OSDI 2012, Dynamo SOSP 2007, Zapier outbox, GitHub code search, Discord indexing, Elixir and storage posts, Meta "Cache made consistent", Cloudflare "Saving 100 TB of RAM with math", Figma sharding and the Dropbox Robinhood post, Spotify event delivery, Slack job queue and Uber consumer proxy. Not opened and therefore not usable: Meta Taiji, Meta Holistic Configuration Management, Netflix Kayenta, Bronson et al. HotOS 2021, the original Kafka paper, the Google Dataflow paper, Discord WebRTC figures and Netflix GraphQL Part 2.

## Conclusion

The notes show the course is strongest where a company or paper has published measured failure data (overload, deployments, storage, real-time connections), and weakest where the best sources teach mechanisms without numbers (CDC, schema migrations, SLOs). That points to a build order driven by source quality, not topic fashion: ship the strong, existing-prerequisite nodes first, close second-source gaps in parallel, and let the capstones reuse those nodes rather than introduce new facts.

The practical implication is that two decisions gate the plan: whether vendor and academic-led sources count under rule 4, and whether the owner will accept a thin-number node (CDC) for its conceptual value. Settling both before batch 3 avoids rework, and all unconfirmed dates and archive-only figures should be cleared before any of these topics is announced.
