# Next content evaluation (29 Oct 2026)

Research only. Judges the two parked topics and the ride dispatch capstone against what the site already teaches. Every source below was fetched raw with curl and browser-like headers, saved to the scratchpad, tag-stripped, and each figure was checked as a literal string in that text. Nothing here has been through `add-post` yet (no digest, no logo check, no `verifiedOn`).

## 1. Verdicts

| Item | Verdict |
| - | - |
| `multi-region-traffic-routing` | Build, reframed and slim: "Traffic steering and draining" |
| `exactly-once-processing` | Fold into `log-based-streaming` as one section plus one post. No node. |
| Capstone `ride dispatch` | Stay parked. No source passed. |

### multi-region-traffic-routing: build (slim)

What existing topics already cover (quoted from `content/topics/*.json`):

- `failover`, lesson.mentalModel: "If they rely on DNS (the lookup that turns a name into an address) with a time-to-live (how long an answer may be cached), they may keep using the old address until the cache expires, so fast systems redirect at a layer they control, a load balancer…". Also howItWorks step 5: "through a layer you control, a proxy or load balancer, rather than relying on DNS time-to-live, so traffic moves in seconds instead of waiting for caches to expire." Cross-region failover appears only as an exercise outcome line: "plan cross-region failover". No source on routing users between regions.
- `disaster-recovery-and-backups` (Maelstrom): "Meta found out in drills, on purpose, that its data centre drains took more than 10 hours and ran into hidden dependencies, and kept fixing them until the work took under an hour for user-facing traffic." This covers draining by dependency order and drills. It does not cover how a user request is steered to a site.
- `disaster-recovery-and-backups` howItWorks: "Backup and restore only keeps copies… Pilot light… Warm standby… Active/active serves from every site." This is the recovery ladder, not the routing layer.
- `dns`: the two posts are DNS record build speed and Slack's DNSSEC rollout. A search for nearest, closest, geograph, location, region, steer and health in the non-diagram text returns nothing. DNS has no GeoDNS, no anycast and no TTL-staleness figure.
- `load-balancing`: only a zone locality config line in the Robinhood digest ("A locality config sets how much traffic each zone sends to each other zone"). Nothing global.

Verdict reasoning: the overlap is partial. The mechanism "DNS TTL is slow, use a layer you control" is already taught, and drain-by-dependency is taught. The gap is the steering layer itself (GeoDNS against anycast, weighted reroute, graceful drain) with measured drain times. That is a different lesson from failover, so a small node is justified, but only if it adds the steering numbers and does not repeat Maelstrom. The old plan's single source (Netflix Active-Active, 2013) could not be opened (see drops), and the roadmap's "multi-region" framing overstates what the new sources show: Slack drains an Availability Zone and Dropbox steers between PoPs, not regions. Name the node for steering and draining, and say so on the page.

Suggested shape: prerequisites `dns`, `failover`, `load-balancing` (3, no `replication`, so the layout test stays clean). Group Reliability. Test the placement on a stub first (`add-topic` step 1). Do not reuse Maelstrom or the AWS static-stability post (each source appears once).

Candidate sources (all opened raw, 29 Oct 2026):

| Source | Company, year | Verbatim figures found on the page |
| - | - | - |
| [Dropbox traffic infrastructure: Edge network](https://dropbox.tech/infrastructure/dropbox-traffic-infrastructure-edge-network) | Dropbox, Oct 10 2018 (8 years old, show the year) | "Dropbox has 20 PoPs around the world"; "Even though we have TTL of one minute for www.dropbox.com , it still takes 15 minutes to drain 90% of traffic, and it may take a full hour to drain 95% of traffic"; "20ms PoP↔user latency, 150ms PoP↔DC latency, 100ms server execution time"; "there are less than 100K 7th level s2 cells"; "more than half a billion registered users" |
| [Slack's Migration to a Cellular Architecture](https://slack.engineering/slacks-migration-to-a-cellular-architecture/) | Slack, Aug 22 2023 | "Remove as much traffic as possible from an AZ within 5 minutes"; "99.99% availability SLA allows us less than 1 hour per year"; "as little as 1% of traffic"; "Weights provide gradual drains with a granularity of 1%"; 2021-06-30 outage 11:45am PDT, link removed 12:33pm, recurred 5:22pm, removed 5:31pm; migration "over the last 1.5 years" |
| [How HashiCorp made cross-Region switchover seamless with Amazon Application Recovery Controller](https://aws.amazon.com/blogs/architecture/how-hashicorp-made-cross-region-switchover-seamless-with-amazon-application-recovery-controller) | HashiCorp SRE with AWS author, 25 Jul 2025 | "traffic shifting within seconds and full propagation completing in approximately 2 minutes"; control plane "accessible through endpoints in five distinct Regions"; "monthly disaster recovery testing program"; "a single API call" |

Why each passes the five rules:

- Dropbox: specific numbers (drain curves, latency inputs); honest trade-offs (anycast cannot drain gracefully, GeoDNS stale data, hybrid unicast/anycast cost); credible (runs the system); maps to `dns` and `failover`. Age: 2018 teaches an unchanged fundamental (DNS caching ignores TTL) and must show its year. Not otherwise used in the repo (only Magic Pocket and Robinhood from Dropbox are). The "TTL is a lie" claim fits the existing failover DNS line and gives it a measured version.
- Slack: numbers present; trade-offs are explicit (siloing needs every service in every AZ; some services cannot be siloed, deferred to a later post); current; credible. Maps to `failover` and `load-balancing` (Envoy weighted clusters). Caveat: this is AZ draining inside one region (the post says "most of our core computational infrastructure resides in multiple Availability Zones within a single region, us-east-1"). It is not multi-region. Slack is already a source on `dns`, `message-queues`, `overload-and-cascading-failures`, `real-time-delivery` and two capstones, but not this post.
- HashiCorp: the only one with a region-level mechanism (Route 53 failover records tied to ARC routing controls, TXT records as a global state flag, warm standby). Weak on rule 4 and rule 1: it is an AWS Architecture Blog customer story co-written by a HashiCorp SRE, and it has only two or three numbers. Treat as optional third source or drop; owner call. Do not rely on the "five Regions" figure for HashiCorp's own footprint, it describes ARC's endpoints.

### exactly-once-processing: fold into log-based-streaming

What is already taught:

- `message-queues`, lesson.mentalModel: "Exactly-once is not something a queue can promise on its own; you get its effect by making consumers idempotent, so a repeat does no harm." Its mistakes diagram is titled "assuming exactly-once delivery".
- `idempotency-and-retries`, lesson.mentalModel: "That label is an idempotency key. The client makes up a unique key for one intended action and sends it with the request. If it has to retry, it sends the same key. The server stores the key with the result of the work, so a repeat gets the saved…".
- `log-based-streaming`, quiz 4 why: "Committing before the work gives at-most-once delivery; committing after gives at-least-once." Exercise 2 answer: "The indexer consumes the topic and upserts by key (inserts the row, or overwrites it if that key already exists)". Its "next" section already links "Idempotency and Retries explains how to make the repeats a log allows safe."
- `stream-vs-batch-processing` covers checkpoints only as restart snapshots.

The one gap: the transactional-sink half (checkpoint plus two-phase commit so uncommitted output is ignored). That is one idea, with one source, which is not enough for a node and not enough to meet the second-source condition from the owner decisions. Add it as a section of `log-based-streaming` (CDC went there the same way) and add the post, no new node, no graph change.

Source (opened raw, 29 Oct 2026):

| Source | Company, year | Verbatim figures found on the page |
| - | - | - |
| [Real-Time Exactly-Once Ad Event Processing with Apache Flink, Kafka, and Pinot](https://www.uber.com/en-US/blog/real-time-exactly-once-ad-event-processing/) | Uber, Sep 23 2021 (5 years old, show the year) | "When the next checkpointing triggers (every 2 minutes)… two-phase commit protocol"; "The default checkpoint interval is 10 minutes, ours is 2 minutes"; "We have a 3 day retention period on our Kafka top[ics]"; "3 Flink jobs"; "deployed in 2 regions"; "hundreds of millions of ad events per week" |

Passes: specific design, an honest trade-off (it waits for the checkpoint, so "not exactly real-time"), credible, maps to `log-based-streaming` (and links back to `idempotency-and-retries`: record UUID as idempotency key, Pinot upsert, Hive dedup). Weakness: the only throughput figure is a vague "hundreds of millions per week", and there is no before and after error rate. Use it for the mechanism and the checkpoint interval trade-off. No second source was found, so do not create a node.

### Capstone ride dispatch: not ready

Searched for a primary dispatch source. Nothing passed:

- Uber DISCO and "Scaling Uber's real-time market platform": the search returned only secondary blogs (DEV, highscalability, a QCon take-away), with unverified figures. No primary Uber post was opened.
- Ringpop, Uber, opened raw: it only says "many millions of trips per day". The rest is a membership and consistent-hashing library description with no measured numbers. It overlaps `consistent-hashing`.
- H3: already a Great read (`content/reads/h3.json`), where rule 1 is waived. It cannot also serve as a capstone source (each source in one place).
- DoorDash dispatch posts: found by search, but `careersatdoordash.com/?p=...` returns 403 "Please confirm your reservation" to curl. Not opened, so not usable.

Verdict: leave parked. Do not build until a company post with dispatch latency or match-rate numbers is opened raw.

## 2. Sources dropped

- Netflix, "Active-Active for Multi-Regional Resiliency" (2013): live URL and medium.com mirror returned 403; the Wayback copy returned a redirect page only and then a 429. Figures unconfirmed, so the roadmap's "500 ms", "1 million records" and "24 hours" are dropped.
- Netflix Chaos Kong posts: not opened (search returned only secondary sites). The "under 7 minutes" and "65%" figures seen on kindatechnical.com are not from a Netflix page and are dropped.
- DoorDash dispatch posts: 403 (above).
- Uber DISCO, other Uber marketplace pages: not opened.
- HashiCorp figure "five distinct Regions": real on the page but describes ARC, not HashiCorp. Not used as a HashiCorp figure.
- Dropbox "five minutes", "one hour" strings: the page says "a full hour"; quote it that way.

## 3. Ranked recommendation

1. Fold exactly-once into `log-based-streaming` (smallest, one source, no layout risk). Uber 2021 is added as a fifth post and a short section: transactional sink and idempotency key, with the 2-minute checkpoint trade-off.
2. Build `multi-region-traffic-routing` as "Traffic steering and draining" with Dropbox 2018 and Slack 2023 as the core and HashiCorp 2025 optional. This is the only parked item with real new teaching. It depends on a stub layout test and a Dropbox logo check (Dropbox and Slack and Uber already have logos; HashiCorp does not).
3. Ride dispatch stays parked.

Smallest first PR: the `log-based-streaming` change. One `add-post` for Uber 2021 (digest, diagram, `verifiedOn`, figures re-checked by `npm run verify:figures`), one new lesson section, `npm run readme:stats`. No new company logo (Uber exists), no new node, no graph test beyond `npm test`. Then the traffic-steering node as its own PR: stub placement test first, then two posts.

If the owner prefers building something new over folding, the traffic-steering node is the better first build, because Dropbox and Slack are already opened and checked here.

## 4. Suggested "Future plan" wording (CLAUDE.md not edited)

- `multi-region-traffic-routing`: build as "Traffic steering and draining" (prerequisites `dns`, `failover`, `load-balancing`) from Dropbox Edge 2018 and Slack cellular 2023; HashiCorp ARC 2025 optional. Netflix 2013 could not be opened.
- `exactly-once-processing`: fold into `log-based-streaming` as a section with the Uber 2021 post; no node.
- Capstone ride dispatch: stays parked; no primary dispatch post could be opened (Uber DISCO, DoorDash blocked, Ringpop and H3 do not fit).

## 5. Not checked

Safari/phone irrelevant here. Not verified: dates of the Dropbox and Uber pages beyond what the page header shows, logo availability for HashiCorp, the layout test for the new node, whether `log-based-streaming` has room for a fifth post in its page layout.
