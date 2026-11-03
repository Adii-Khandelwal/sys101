# Design teaching pattern (R4 study, 31 Oct 2026)

Purpose: describe, in my own words, how free open-web system design breakdowns are written, so the site can apply the pattern to any question with its own wording, sources and diagrams. Nothing here is a copy of a page. No figure from any page is used. Each page has at most one short quote, marked with its URL.

Scope warning: this is a study of one site (Hello Interview) plus one free chapter on the ByteByteGo site. It is a teaching style, not evidence about any company. Claims on site pages still need their own confirmed sources.

## 1. Pages studied

All fetched with curl using a Mozilla Chrome user agent, HTML converted to text by a script (saved in the scratchpad `h/` folder). Terms line on every Hello Interview page: footer reads "© 2026 Optick Labs Inc. All rights reserved." with links to Terms and Conditions and Privacy Policy. Dates are the page's `dateModified` metadata (the visible "Updated" label was blank in the text). Paid parts are marked as a premium upsell; where a page was cut off, it is said below.

| Page | URL | Read | Date shown | One quote (URL) |
| - | - | - | - | - |
| Delivery framework | https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery | Full | 2024-07-07 | "Having a long list of requirements will hurt you more than it will help you" |
| Bitly | .../problem-breakdowns/bitly | Full | 2026-02-14 | "Deduplication trades off storage efficiency for these features." |
| Ticketmaster | .../problem-breakdowns/ticketmaster | Full | 2026-02-15 | "you'll rely on your non-functional requirements to guide you through the deep dives" |
| Uber | .../problem-breakdowns/uber | Full | 2026-02-15 | "Don't neglect the client when thinking about your design." |
| WhatsApp | .../problem-breakdowns/whatsapp | Full | 2026-02-16 | "reasoning about a solution on a single node first" |
| Dropbox | .../problem-breakdowns/dropbox | Full (to Final Design; level section is the shared template) | not captured in this pass | "In short, we trust but verify." |
| Web Crawler | .../problem-breakdowns/web-crawler | Full to the level section | not captured in this pass | "your first thought should be to break the system down into smaller, pipelined stages" |
| Rate Limiter (slug `distributed-rate-limiter`) | .../problem-breakdowns/distributed-rate-limiter | Full to Final Design | not captured in this pass | "it depends on the specific requirements of the system!" |
| Ad Click Aggregator | .../problem-breakdowns/ad-click-aggregator | Full to Final Design | not captured in this pass | "Click data matters, a lot." |
| FB News Feed | .../problem-breakdowns/fb-news-feed | Partial: each paragraph read only to about 420 characters | not captured in this pass | "In most situations we don't need a one-size-fits-all solution" |
| Local Delivery (slug `gopuff`) | .../problem-breakdowns/gopuff | Partial: about 380 characters per paragraph | not captured in this pass | "ensuring we're not "double booking" is a common one across system design problems" |
| Caching (core concept) | .../core-concepts/caching | Mostly: opening, where to cache, architectures, problems, and the "how to bring it up" closing | 2025-10-22 | "make it cache-aside" (from "If you only remember one caching pattern for interviews, make it cache-aside.") |
| Sharding (core concept) | .../core-concepts/sharding | First half (partitioning, shard keys, strategies); rest not read | 2025-10-22 | none |
| Dealing with Contention (pattern) | .../patterns/dealing-with-contention | CUT OFF by paywall after the opening example; only the table of contents seen | 2026-06-05 | none |
| Scaling Reads, Real-time Updates (patterns) | .../patterns/scaling-reads, .../patterns/realtime-updates | Fetched, paywall marker present, NOT read; only referenced through links from breakdowns | 2025-07-17, 2026-02-17 | none |
| Introduction (in-a-hurry) | .../in-a-hurry/introduction | Fetched, not read | 2024-02-05 | none |
| YouTube Top K | .../problem-breakdowns/youtube-top-k | HTTP 404 (slug unknown); not studied | none | none |

Dates for Dropbox, Web Crawler, Rate Limiter, Ad Click and News Feed were not captured; fetch the metadata again before citing. A separate "what is expected at each level" page does not exist: the level expectations are the last section of every breakdown, written to one template.

Drafting limits: the study covered nine pages in full and two in part, so the "pattern" below is confirmed on those. Locked pattern pages (contention, scaling reads, real-time updates) are not described beyond what the breakdowns say when they link to them.

## 2. The skeleton every breakdown uses

Order, and what each section is for (consistent across the nine full pages):

1. Problem in one or two lines (what the product is), sometimes a note on who the page targets.
2. Functional requirements: a short "users should be able to" list, then a labelled "below the line" list of things deliberately left out. Purpose: fix the scope so the rest can be finished.
3. Non-functional requirements: a short "the system should" list in the shape of the problem, then a below-the-line list. Purpose: these become the menu of deep dives.
4. Set-up: a one-paragraph plan (build in the order of the requirements, then harden), the core entities as a list of nouns, and the API (or, for data pipelines, input, output and a data flow).
5. High-level design: one subsection per functional requirement, each adding the smallest component set that satisfies it, ending in a working but naive system.
6. Deep dives: one subsection per non-functional pressure (or per weakness the naive design exposed), each a ladder of approaches.
7. Final design: one combined diagram.
8. Expected at each level: three paragraphs (mid, senior, staff) plus a short "bar for this question" line.
9. Test yourself and next-page link (site chrome; skip).

Two shape variants:
- Product questions (Bitly, Ticketmaster, Uber, WhatsApp, Dropbox, News Feed, Local Delivery): REST or command API, one requirement at a time.
- Pipeline questions (Web Crawler, Ad Click Aggregator): the "API" is replaced by input, output and an ordered data flow; the high-level design follows the flow stage by stage; the first deep dive is fault tolerance.
- Infrastructure component (Rate Limiter): the API is a single check function returning allow or deny plus headers; the high-level design starts with a placement decision (where it lives), then identification, then the algorithm.

## 3. How each section is done

### Functional scope
- The writer states how the interviewer would normally behave (give the features, or expect you to ask) and tells the reader to narrow to a few headline features. A page may say how many; the delivery page says a short list beats a long one.
- Out-of-scope items are kept in a named list and are of two kinds: product extras (accounts, analytics, ratings) and whole sub-systems that are their own question (payments, search, driver routing, text processing). Each exclusion is a feature or a system, never a quality.
- Some pages add a sentence on why an exclusion is safe (it adds complexity without being core), and say the reader should check with the interviewer.
- A few pages choose the scope to make the interesting part reachable (WhatsApp keeps "messages while offline" because it forces a durability design; the page says it would guide a candidate there). The scope list is therefore a teaching device: it picks the features that will cause the deep dives.
- Pipeline pages also say what the output is used for, and pick one use (the crawler page picks model-training text over search indexing) because the use changes the design.

### Non-functional requirements
- Each is a sentence naming the quality, the part of the system it applies to and a target, then often a parenthetical that names the tension (availability over consistency for search, but consistency for booking; strong consistency for ride matching but low latency for the match).
- They are specific to the problem by naming the hard moment: one popular event, one location with a burst of requests, one user with a huge audience, the largest allowed file, the worst case page size. The target is a number in the sources; our site may not copy those numbers, so each target must be restated with the company's or standard's own confirmed value or kept qualitative.
- The delivery page offers a checklist to choose them: consistency versus availability, environment limits, scale shape (burst, read to write ratio), latency of the heavy step, durability, security, fault tolerance, compliance. Pages keep only the ones that will drive a design choice and push the rest below the line.
- Two recurring moves: say which side of the consistency trade each path takes (the same system gets two answers for two paths), and name the read to write imbalance when there is one, because it decides caching and storage.
- Estimation is delayed until a design choice depends on it, not done up front. The pages say so, then do the arithmetic at the moment of need (a storage check before adding a precomputed table, a connection count before adding servers, a rate before choosing a store). A site version should do the same and mark the arithmetic as a teaching assumption.

### Entities and API
- Entities: a flat list of nouns with one line each, introduced as a first draft that will grow. The writer explains non-obvious splits (a Booking separate from a Ticket because one purchase has many tickets; an Item versus an Inventory like a class versus an instance; a Fare separate from a Ride).
- API: one endpoint or command per functional requirement, with the verb chosen and a reason (create versus read versus idempotent update). Pages repeat three habits: say the first version is simple and will change, derive the caller's identity from the session and never from the body, and let the server produce timestamps and prices.
- Where the protocol is not request and reply (chat), the page switches to socket commands and explains why, with an acknowledgement on every delivered command.
- Pipelines replace the API with input, output and a numbered data flow.

### Growing the high-level design
- The design is grown one requirement at a time. Each subsection starts with the user need, names the one new component or table that satisfies it, lists the components with a line each, and walks the request path in numbered steps.
- Reuse is shown: when a requirement needs no new service, the page says so and only adds a table (Uber ride request).
- The first version is deliberately naive and the page says what will break (a single chat server, a query that scans, a booking page that can fail after payment). The break is stated at the end of the subsection and picked up later as a deep dive. For infrastructure questions the page recommends reasoning on one machine first.
- Complexity noticed early is parked with a spoken note rather than built.
- Data storage choices are made lightly and said to matter little ("most databases would do"), with a reason tied to the access pattern, so the learner does not over-invest.
- Each step has its own diagram showing only what was added; labels come from the components just listed.

### Deep dives: choosing and framing
- Choice rule: take each non-functional requirement and each weakness the naive design left, in the order of how interesting they are. Scaling is usually placed late so the bottlenecks created by earlier dives are visible.
- Each deep dive opens with a question phrased as a problem ("how do we stop two buyers taking one seat"), then why the current design fails.
- Then a ladder of approaches, each with "approach" and "challenges". Labels used: bad, good, great. The bad rung is something real beginners propose, shown to fail for a stated reason. Good rungs work with a named cost. Great rungs fix that cost and carry their own cost.
- The ladder order is the learning order: simplest first, each next rung removes the previous rung's named problem. The reason a rung is weaker is always one concrete failure (not unique, long-held locks, lost on restart, double upload, hot key, polling load, cost).
- "Good" is sometimes kept as the better answer for a specific situation, and the page says so (fail open versus fail closed; cache-aside versus read-through). A ladder is not always a strict ranking.
- A few dives end by choosing a rung and updating the diagram; others are left as a comparison.
- The writers insert short notes where the textbook answer would be wrong for this case (checkpointing is unneeded when the window is small; a Bloom filter is overkill next to an index; plain polling is enough when the cost is low). This "against the grain" note is a strong teaching device.
- The same sub-problem appears across questions and is cross-referenced: a timed hold on a scarce thing (tickets, drivers, crawl rights), hot keys, fan-out, real-time push, big blobs, multi-step workflows. Pages say "if you solved the other question you know this".

### Wording trade-offs
- Every rung has a "Challenges" block listing costs as plain consequences: more moving parts, staleness, lost data on crash, extra network hop, operating cost.
- Phrases that carry the trade: "this is acceptable because", "the downside is only", "we are trading X for Y", "whether it is worth it depends on".
- Failure behaviour is written as a decision with both sides argued (what happens if the cache or lock service dies, fail open or closed), then a choice for this system with the reason.
- Real products are named as examples, but the argument rests on the mechanism.
- Honest hedges appear: assumptions flagged, the point that an answer is context-dependent, and a note when a concept is not in the formal standard.

### Expectations by level
- Closing section of every breakdown, three levels, written to a template: mid-level is mostly breadth with the interviewer driving the later half; senior is more depth, proactive about weaknesses, explains trade-offs; staff is mostly depth, proactive, brings experience, aims to teach the interviewer something. A "bar for this question" line then names which dives and which rung count at each level.
- Our site should not copy the template or the level ratios. A site version can describe, per question, which sections a first pass needs, which dives add depth, and which judgement calls separate a thorough answer, without claiming to know any company's hiring bar.

### Diagrams
- Whiteboard-style boxes and arrows, one image per step; the final design combines them. Each image adds one thing: a new service, a table next to a database, a queue, a cache, a lock store. The requirement list is also drawn as a whiteboard image.
- The page tells the reader that clear visuals matter because the reviewer will look at them later.
- Original SVGs on our site should follow the same growth idea: one diagram per added requirement, built only from the page's own claims (see section 6).

### Patterns named and cross-linked
- Recurring named patterns seen linked from the breakdowns: scaling reads, scaling writes, dealing with contention, real-time updates, multi-step processes, handling large blobs. Each appears as a boxed callout inside the relevant dive with one sentence on why this question is a good example, then a link to the pattern page (which is paywalled in part).
- Core concepts (caching, sharding, consistent hashing, indexing) are referred to by name without being rebuilt each time. The concept pages themselves follow: why it matters, the options in a short taxonomy (where to cache; cache-aside, write-through, write-behind, read-through; eviction), the common failure modes (stampede, consistency, hot key, shard key choice, resharding), and a closing "how to bring it up" script in five moves: identify the bottleneck, decide what to put there, pick the architecture, set the policies, name the downsides.
- Order across the site: foundations, then core concepts, then patterns, then question breakdowns that use them.

## 4. What stays the same and what changes by problem shape

| Shape | Same | Changes |
| - | - | - |
| Read-heavy (Bitly, News Feed, Local Delivery availability) | Requirements to entities to API to naive design to dives | Imbalance named in non-functional list; dives are index then cache then edge; consistency is relaxed on reads |
| Write-heavy / ingest (Ad Click, Uber location, rate limiter counters) | Same skeleton | Naive store breaks first on write volume; ladder is direct write, batch, stream or in-memory store; hot partitions and replay become dives |
| Contention (Ticketmaster, Uber driver hold, Local Delivery order) | Naive version works but has a visible gap | Ladder: long locks, status plus expiry, timed lock; dive ends in failure analysis of the lock store |
| Real-time (WhatsApp, Ticketmaster seat updates, Uber push) | Same | Protocol switch; routing across servers is the central dive; delivery guarantees and missed-message detection become dives |
| Storage / large objects (Dropbox) | Same | Control path versus data path split; chunking, resumability, security and speed dives |
| Algorithmic infrastructure (Rate Limiter) | Same | Placement decision first; the algorithm choice is a comparison inside the high-level design; scaling follows |
| Streaming / batch pipeline (Crawler, Ad Click) | Same | Input, output and flow replace the API; first dive splits the work into retryable stages |
| Fan-out (News Feed) | Same | Core dive is where to do the work (on read, on write, hybrid) |

## 5. Writing template for any topic (our own, original)

Use for a design page; adapt the section count to the site's step system.

1. Question: one sentence naming the product or component and the one reason it is interesting (the force that will shape the design).
2. Scope: three to five "must do" statements; a separate "left out" list, each item tagged feature or whole system; one line saying why the leftover items can wait. Ask: could a reader finish a design with only these?
3. Qualities: for each, name the quality, the part it applies to, and the pressure (burst, imbalance, worst case). Pick ones that each force a later choice; drop the rest. If a target is needed, restate it from the page's confirmed sources, otherwise write it qualitatively. Ask: which of these will I turn into a deep dive?
4. Things and contract: list the nouns with one line each and one note on any non-obvious split. Then the contract: one call per must-do, or input, output and flow for a pipeline. Add the identity and trust note (who the caller is, what the server decides).
5. First design, one need at a time: for each must-do, (a) the user need, (b) the smallest addition, (c) the numbered request path, (d) what is still weak. One diagram per step, showing only the delta.
6. Pressures: for each quality, a question heading, why the current design fails, then a ladder of three or four approaches in learning order. For each rung: what it does, why it is weaker or stronger, the one cost it leaves. Mark any rung that is right only in a given context.
7. Against the grain: one note per page where the common answer is wrong here and why.
8. Failure and change: what happens when each new part fails, and what the design costs to run.
9. Joined design: one diagram combining the steps.
10. Depth by effort: three short descriptions (first pass, deeper pass, expert pass) of what a learner can cover, phrased as learning goals.
11. Links: concept names the page relies on (with link to the site's topic), and patterns shared with other questions.

Choosing and wording scope: pick the features that expose the hardest mechanics; state exclusions in the same grammar as inclusions; never leave an exclusion that the design secretly needs.

Choosing and wording qualities: sentence shape is "[part] should [behaviour] under [pressure]"; tension is stated in the same sentence; number only if confirmed.

Growing the diagram: after each step the diagram must be a valid, working system for the requirements covered so far; label every box in the step list; do not draw a component no sentence has justified.

Framing a ladder: start from a plausible beginner idea, state the failure in one sentence a beginner can check, then the next rung addresses exactly that failure and no more. End with a rung that is not perfect and says what remains.

Wording trade-offs: use "we gain ... and pay ...", always name the cost in plain operational terms, and say what would make the other choice better.

Level expectations: describe by the behaviours to learn at each pass, not by a job grade.

### Checklist for a finished page
- The question has one stated reason it is interesting.
- Scope has a left-out list, each item tagged.
- Every quality maps to a deep dive or is explicitly dropped.
- Entities are named once; any non-obvious split is explained.
- The contract covers each must-do and states the trust rule.
- The first design works for every must-do and ends with a named weak point.
- Every deep dive starts with the failing symptom and has at least two rungs with a stated cost.
- At least one note says when a textbook answer is not needed here.
- Every failure of a new part is covered.
- No figure copied from a teaching source; all numbers are the site's own confirmed ones or are absent.
- Each claim has a source badge.
- Diagrams are original and built from the page's own claims, one per step plus a joined one.
- No sentence, example order or diagram layout repeated from a studied page.
- Terms for concepts link to the site's topics.

## 6. What to do differently on our site

- Pages are read-only: no practice boxes, no "try it first", no grading, no comments. The reader gets the chain of reasoning, not a prompt to write.
- Source badge per claim: a claim states what is established and where it comes from (company post, paper, standard, or teaching source); the teaching source only supports explanation and structure, never a number.
- No figures from a teaching source. If a number is needed, it comes from a confirmed company post or paper, or the page is qualitative. Teaching assumptions (user counts, rates, sizes) are not reused.
- Diagrams are original SVGs drawn from the page's own claims, one per added step, using site tokens; no reproduction of any image or layout seen on the studied pages.
- No copying or close paraphrase: the structure above is a method; the sentence-level text, example order, rung names and rung count per question must be our own and chosen from our sources. Ladder labels such as bad, good and great are Hello Interview's rating device; the site should describe weaker and stronger approaches in its own terms (for example by naming the failure) rather than reuse the three-label scheme.
- Level expectations: no hiring-bar claims; use learning passes.
- Interviewer lines on our site are typical prompts, as already decided; they do not describe a company's interview.
- Ground the dives in real systems where the site has a confirmed company post, as the Worth knowing section already does; the studied pages never cite a company post.
- Where the site already has a topic page for a concept (caching, sharding, consistent hashing), link to it instead of re-teaching.
- Keep a visible note on pages that the explanation follows a common teaching approach and is not a summary of any one source.

## 7. Alex Xu step-by-step build-up style: what a free source confirms

Free source opened: https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews (the free chapter on the ByteByteGo site, fetched by curl, 200 response; page metadata shows "Alex Xu" as the author; footer "Copyright ©2022-2026 ByteByteGo Inc. All rights reserved.", links to Terms of Service). No date was shown in the text.

Confirmed from that chapter, in my own words:
- It sets out a four-step approach to an interview: clarify the problem and fix the scope; propose a high-level design and agree it with the interviewer; go deeper into the parts that matter; wrap up with bottlenecks, error cases, operations and next scale.
- Step one is about asking questions before any design, with a worked example of a conversation about a news feed that settles platform, features, ordering, size limits, traffic and media.
- Step two is boxes for clients, servers, stores, caches, queues; a rough size check; walking a few concrete cases; deciding whether the API and schema belong at this level depending on the problem. The example splits the news feed into two flows (publishing and building the feed) and promises detail in a later chapter.
- Step three picks the components to detail with the interviewer, warns against spending time on minor detail, and re-applies the news feed example to the two flows.
- A rough time split for a 45-minute session is given, with the note that it is only a guide. I do not repeat the figures.
- A short do and don't list (ask, communicate, offer more than one approach, drill down only after the outline is agreed).
- One quote: "Never say your design is perfect and nothing can be improved."

Not confirmed: the free chapter describes a process, not the build-up style of the book chapters (for example the way each chapter grows from a basic design through numbered figures into a deep dive). The book's per-chapter structure, figure counts and wording are not visible on the free page except that the table of contents lists chapter titles (news feed, payment system, digital wallet, stock exchange and others). I did not read any book text and did not use any copy of the book. So the claim "Xu books teach by growing the design in numbered steps from a simple version" is only supported here by the chapter's own approach and example flow, not by chapter bodies. If a fuller description is needed, look for a free sample chapter on the publisher site or an author interview; none was read.

What can be applied safely from the confirmed part: the clarify then design then deepen then wrap order; settling scope through questions before drawing; separating the flows (write path and read path) in the first design; ending with bottlenecks, failures, operations and the next scale step.

## 8. Gaps and what could not be verified

- Hello Interview pattern pages (dealing with contention, scaling reads, real-time updates) are paywalled; only the introduction of contention and the page outline were readable. The cross-linking description relies on how breakdowns introduce them.
- News Feed and Local Delivery were read only to the first part of each paragraph; Sharding only in the first half; Caching skipped the middle paragraphs on write patterns but the headings were seen.
- The Introduction page and the YouTube Top K page were not read (the latter slug returned 404).
- Dates for five breakdowns not captured; dates shown for the rest are page metadata, not a visible label.
- The terms line is the footer copyright and link text; the actual Terms and Conditions page was not opened, so no reuse licence is confirmed. Treat all pages as all rights reserved: explanation only, no copying.
- Everything here concerns teaching style. Whether the style produces accurate designs, and any real company's practice, is not established by these pages.
