# Content audit: cdns

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 0 |
| misleading | 9 |
| weak | 4 |
| style | 1 |

14 findings. Applied: 14 (fixed 14, softened 0, cut 0); left 0.

Verified clean: Pingora figures (over 1 trillion, 87.1% to 99.92%, 160x, a third as many, 5 ms and 80 ms, about 70% and 67%, 434 years); Netflix figures (50% storage, around 1,200 files, 100Gbps, 200TB+, 2016 migration); Pingora date 2022-09-14 and Netflix date 2017-06-20; the web.dev, MDN and RFC 9111 claims in the learn page that were spot-checked (CNAME setup, purging, very short caching, latency vs hit-ratio trade-off, managed caches, personalised responses); both Background quotes; the Netflix ageNote about the 2025 post (confirmed on a syndicated copy, which links back to this post).

## Findings

**T1** `Pingora walkthrough "Write its own HTTP library"; failures`. Severity: misleading. Status: fixed.
- Current: "Existing libraries rejected real-world traffic that Cloudflare must accept"; "Standard HTTP libraries were too strict for real traffic, which forced Cloudflare to write its own."
- Source: "Although there are some great off-the-shelf 3rd party HTTP libraries, such as hyper, we chose to build our own because we want to maximize the flexibility..."; "While the hyper team did ultimately accept that change".
- Problem: The post gives flexibility and non-compliant traffic as reasons and names one library (hyper), which later accepted the change. "Forced" overstates it.
- Rewrite: Say what the post says.

**T2** `Pingora walkthrough "Serve every trip to the origin"`. Severity: misleading. Status: fixed.
- Current: "Pingora handles all requests that must reach an origin"
- Source: "Pingora handles almost every HTTP request that needs to interact with an origin server (for a cache miss, for example)"
- Problem: "All" for "almost every".
- Rewrite: Use "almost every".

**T3** `Pingora failures, crash sentence`. Severity: weak. Status: fixed.
- Current: "Pingora's own code never crashed; the rare crashes traced back to a Linux kernel bug and faulty hardware on a few machines, which made one memory bug hard to rule out."
- Source: "have yet to crash due to our service code... Recently we discovered a kernel bug soon after our service started crashing. We've also discovered hardware issues on a few machines, in the past ruling out rare memory bugs caused by our software even after significant debugging was nearly impossible."
- Problem: The last clause garbles the source.
- Rewrite: As quoted.

**T4** `Pingora takeaways`. Severity: misleading. Status: fixed.
- Current: "…connection reuse matters as much as cache hit rate on uncached traffic. Architecture… drove the gains more than faster code."
- Source: "The most critical problem for our use cases is poor connection reuse."; "This is not because we run code faster" (about latency); CPU and memory savings also came from "Our Rust code runs more efficiently compared to our old Lua code".
- Problem: "As much as cache hit rate" is a comparison the post does not make, and the architecture-over-code claim holds for latency, not for CPU and memory.
- Rewrite: Restrict to what the post shows.

**T5** `Netflix tradeoffs.why`. Severity: misleading. Status: fixed.
- Current: "A single copy of a very popular file can overwhelm its server while others sit idle"
- Source: "This effect is not as pronounced in our deployment environment due to two crucial optimizations: ...route traffic based on network proximity... Popular files are locked into memory".
- Problem: Omits that Netflix says the effect is smaller for it, and gives other reasons for the copies.
- Rewrite: Add the condition.

**T6** `Netflix takeaways`. Severity: misleading. Status: fixed.
- Current: "…filling caches ahead of time beats waiting for misses."
- Source: The post describes proactive caching but compares it with nothing.
- Problem: A comparison the post does not make.
- Rewrite: State what Netflix does.

**T7** `comparison paragraphs 2-3`. Severity: misleading. Status: fixed.
- Current: "…so most viewers are served inside their own provider's network."; "a CDN serving other people's sites cannot predict demand as well, so cheap misses matter more."
- Source: Netflix: "We aim to serve as much of the content as possible over the shortest networking path." Neither post says the second claim.
- Problem: The first is not stated; the second is our inference presented as fact.
- Rewrite: Match the source; label the inference.

**T8** `Netflix problem`. Severity: weak. Status: fixed.
- Current: "most clusters near viewers do not have room"
- Source: "Many clusters that are proximally located to end-users (ISP clusters) do not have enough disk capacity".
- Problem: "Most" for "many".
- Rewrite: Use "many".

**T9** `lesson workedExample "Share one pool"`. Severity: misleading. Status: fixed.
- Current: "For one major customer, connection reuse went from 87.1% to 99.92%, and median and p95 time to first byte fell by 5 ms and 80 ms."
- Source: "Overall traffic on Pingora shows 5ms reduction on median TTFB and 80ms reduction on the 95th percentile."; "For one major customer, it increased the connection reuse ratio from 87.1% to 99.92%".
- Problem: The time-to-first-byte drop is for overall traffic, not the one customer.
- Rewrite: Separate the two figures.

**T10** `lesson workedExample diagram`. Severity: misleading. Status: fixed.
- Current: Title and labels mention "revalidation", "origin shield".
- Source: Neither post mentions revalidation or an origin shield.
- Problem: Diagram teaches ideas that appear in neither post.
- Rewrite: Match the posts.

**T11** `lesson.mistakesOutcome`. Severity: misleading. Status: fixed.
- Current: "the three most common ways CDN thinking goes wrong"
- Source: n/a
- Problem: No source ranks causes.
- Rewrite: Drop "most common".

**T12** `Netflix numbers units`. Severity: style. Status: fixed.
- Current: "up to 100Gbps", "200TB+"
- Source: Source writes 100Gbps and 200TB+.
- Problem: Site style is spaced units.
- Rewrite: Space the units.

**L1** `basics body[0], body[1]`. Severity: weak. Status: fixed.
- Current: Near-copies of web.dev and MDN sentences.
- Source: web.dev: "a network of servers that are optimized for quickly delivering content... shorter round-trip time (RTT)... CDN caches eliminate the need for a request to travel to the origin server". MDN: "Managed caches are explicitly deployed by service developers to offload the origin server and to deliver content efficiently."
- Problem: Too close to the sources.
- Rewrite: Own words.

**L2** `promise`. Severity: weak. Status: fixed.
- Current: "After this you can follow the topic page and the posts."
- Source: n/a
- Problem: Says nothing about the topic.
- Rewrite: Name the outcomes.

## Could not verify

- The Netflix post was blocked from direct fetch (Medium); it was read from the Wayback copy of 2021-04-09. The ageNote about the 2025 cache-miss post was confirmed only on a syndicated copy (noise.getoto.net), not the original page.
- How a CDN steers users to an edge (DNS, anycast) is general knowledge in the quiz and lesson; neither post describes it for these companies.
- Learn-page paragraphs on validation and cache busting were spot-checked, not read line by line.
