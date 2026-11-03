# Payment gateway page v3: report (1 Nov 2026, writing pass for ask, say, tip and general tips)

Page: `design-payments-gateway-v3.json`. `designProblems` returns no problems (temporary copy in content/design and a temporary vitest test, both deleted).

Counts: 84 blocks in the section lists (24 real, 4 assumption, 2 diagrams) plus 4 dive real notes, so 28 real blocks; 23 marked quotes (every one an exact substring of the F, S or R2 row wording, or of the raw page I fetched this round; at most one quotation per block and per source); 31 sourced claims by `sourcedClaims`; 6 stage diagrams (8 diagrams in all); 4 dives; 3 notes (scale, hot merchants, reconciliation); 8 follow-ups; 7 mistakes; 7 curiosities; 43 sources. New: `general-tips` (7 habits, a follow-up-changes-a-constraint paragraph, a stuck paragraph, 5 real blocks from R2) and ask, say and tip on all 11 sections.

## Final cleanup (text and diagram labels only)
- Final diagram: the store box now lists payments, attempts, movements, keys, ledger and outbox.
- Stage four diagram redrawn: capture request, then a movement row in the sent state, then the provider capture call, then one local transaction holding the captured payment and the ledger entries; arrows follow the stage text. Stage four text now opens "A capture request comes in." Stage six diagram title says stuck attempts and movements; the stage text says the reconciler compares reports with "the payment store and our ledger" and "lists the mismatches" so the labels appear in it.
- "Attempt or movement" now appears in the in-progress record sentence, the capture/void movement row mention, the failover rows and say, the reconciliation note, the reconciliation follow-up, the failure-modes say, the repair-loop paragraph and the first metric (attempts and movements stuck in sent). A retried create is stopped after record expiry only by the unique order reference; a retried capture is refused because the payment's final state refuses a second capture. Failover text says losing a movement loses the provider key for that capture.
- A capture with a new key while an earlier capture movement is still sent or unknown gets a conflict status (at most one open capture movement per payment): added to the API status paragraph (our reasoning).
- PCI real says the glossary defines the cardholder data environment as the components, people and processes that "store, process, or transmit cardholder data" (same single quote). The late-authorization exception row says "void or refund".
- History: the round-five Adyen changed-body misread (Adyen's page was credited with a changed-body rule) is recorded here as well as in round six; the report's earlier count of general-tips real blocks (6) was wrong, it is 5.
- Validation: designProblems returns no problems; 31 sourced claims, 28 real blocks, 23 quotes. The new capture-conflict rule and the failover-keeps-movements rule are our reasoning and are UNVERIFIED.

## Round six: every change
1. Idempotency real now says all three providers document the repeated request, Square and Stripe also the changed one, and Adyen the replay case. History: the earlier sentence wrongly credited Adyen's page with a changed-body rule.
2. Adyen fail-open real says "when Adyen's own idempotency store is unavailable".
3. Hot-merchant note and the one-merchant follow-up say "the key insert and the payment row, whose order reference is unique, in one local transaction" (there is no separate order-reference insert).
4. Capture-intent design rule (our reasoning): the money-movement row is committed in the sent state, in the same local transaction as the key record, before the provider capture or void call; its id is the provider's idempotency key; the result, the payment state change and the ledger entries commit together afterwards; recovery scans movements as well as attempts. Changed in the happy-path list, stages two, three, record-money and check-outside, the data-model Money movement and Idempotency rows and the index paragraph, the entities list, dive 1 and dive 4, the failure table (Ledger write row now says the provider may already have captured and the retry is safe because of the movement id; the crash rows and reconciler row name movements), the say scripts, the talk track and a mistake fix. Full capture only and the (movement id, kind) ledger id are unchanged. The stage-three diagram stays about attempts; the movement row appears in the stage-four diagram (see the cleanup below).
5. Clarify: "store and pass only the token"; the scope sentence is dropped (the PCI real block carries it).
6. An in-progress key record is kept until its attempt is resolved ("until recovery finishes it"); once a record has expired a retry runs as new and only the unique order reference stops a second charge (API text, dive 1, Idempotency row).
7. Failure-modes say now matches the table, note and follow-up: a compensating entry a reviewer approves, or resolving the stuck attempt.
8. Razorpay's validate page says to use the old secret when validating retries of older requests after a webhook secret change: the rotation follow-up now cites it. Support is partial: the length of the overlap period is ours (UNVERIFIED). Hohpe's source entry records the page footer "© 2024 • All rights reserved". Kafka's source title is the page title "Design".

## Round five: every change
1. Dive intro now reads "Three shorter notes on scale, hot merchants and reconciliation follow the dives" (3 notes).
2. The idempotency-key paragraph in the API has no cites; the real block after it carries them.
3. Razorpay real claims only what its page backs (signature in a header; signing the body with a shared secret).
4. Currency real quotes "All API requests expect amount values in the currency’s minor unit" (exact on the live page, curly apostrophe).
5. PCI real is a topic sentence plus the quote only.
6. Adyen fail-open real is one topic sentence (this design pauses the charge path and asks merchants to retry later); the Payment store row says the same.
7. Entities real says the providers "between them" document slow answers and windows.
8. Dive 2 real supports "storing, acknowledging first and deduplicating" only.
9. IETF real names the two cases it supports; the API status text marks the illegal-move conflict as our own choice.
10. Order reference is unique among payments that are not failed, voided or expired (table row, retention paragraph, follow-up).
11. Key record, payment and first attempt commit in one local transaction (stage two and three, Idempotency row and its paragraph, dive 1).
12. One wording for a second copy of a running request: "a conflict status that tells the client to retry later" (API, failure rows 2 and 3, failure-modes say, dive 1).
13. Against-the-grain say opens "I would not, and I would avoid exactly-once delivery too."
14. Deep-dives ask is a natural opener that does not list the answers.
15. General tips: "Pacing advice (not any company's process):" and the internal sentence removed.
16. Years in numerals inside real blocks naming the company (October 2022, 2020, 2023 with ages).
17. Microsoft real: how to start answering an interview question; Amazon real: asking questions as the design takes shape.
18. The reconciliation follow-up has no cites (the cited facts sit in the failure-modes real block; the four difference kinds and the approver are ours).
19. Real-block frames varied; the word "backs" appears once in the whole file (in an unrelated sentence), none in real blocks.
20. Ledger account row: "a checkpoint plus the entries since it"; strong-answer tip no longer repeats the changed-constraint paragraph; outbox source title "Pattern: Transactional outbox".
21. This report: the PostgreSQL page also has section 26.2.8 Synchronous Replication (opened in the fetched copy; the real block names that section for the remedy, still one quote from the loss-window sentence). The sentence "shows only the loss window" is withdrawn. Whether synchronous or quorum commit suits the payment store is still our reasoning.
Owner decisions applied: "we" kept in reasoning text; four-digit years only in real blocks that name their company.

## Round four: what changed
- Method: every `real` block is now one sentence of our own saying what the source covers for this design and which part of the answer it backs, plus at most one exact quotation naming the provider. Sources with no quote that carries the point (IETF draft, Stripe keys, Stripe and Adyen retention, Adyen fail-open, Amazon breaker note) have the topic sentence and cite only. The "first result on a repeat" point appears once (api). The checker counts a quote against every source cited in that block, so quoted blocks cite only the sources they support.
- Slips: the order-reference unique index covers non-failed payments only; several attempts have one real reason (a second provider after a definite rejection) and an unknown outcome keeps the same attempt; the key and order-reference inserts sit in the same local transaction as the payment row; sub-partitions relieve hot rows only, a saturated primary gets a dedicated database; Money movement is now an entity; an API crash shows the merchant a connection error, a retry-later answer while the key record is in progress (until recovered or expired), then pending, consistently in the API text, failure table, failure-modes say and dive 1.
- Asks, says and tips: spoken asks for high-level, against-the-grain, strong-answer and mistakes; no change-of-constraint promise in any ask; no figure in tips; "assumptions below" where the box precedes the assumption; the metric named in the section is the count and age of attempts stuck in sent (our reasoning).
- General tips: pacing is our advice and says so; Amazon note fixed to the SDE II page wording; dates in the notes (October of the year twenty twenty-two for Meta, no date shown for Amazon, Microsoft and Atlassian, the Flipkart PDF about six years old from 2020 file metadata, all in words because digits are barred beside reference sources); internal phrasing removed; the length block dropped.
- Cites: dive 4 no longer says dual-write (the microservices.io page does not use the term; that wording is on the AWS prescriptive guidance page F76, not cited); dive 1 no longer says API errors point to webhooks; follow-up 1 cites only the IETF draft; the verify-an-event follow-up has no cites (rotation is UNVERIFIED).
- Banned forms removed ("never a field that is updated", "no recipe for services", "instead of guessing"). Breaker trade-off appears once in a real block (topic sentence) and once in the failure table row; removed from dive 3 and the notes.
- Sources: licence strings now match the pages read this round (Python: PSF License Version 2; PCI SSC copyright line; PostgreSQL Global Development Group line; IETF Trust copyright and BCP 78). Titles are page headings I read for Stripe, Adyen, Razorpay (Best Practices; Validate and Test Webhooks), Square (Idempotency), SQS, RabbitMQ, Pub/Sub, DynamoDB, Spanner, SRE book, Python, PCI (Glossary), PostgreSQL (Log-Shipping Standby Servers), Amazon SDE II, Microsoft. Descriptive only (page not fetched or JavaScript-blocked): Meta blog, Atlassian PDF, Flipkart PDF, Helland, Sagas, IETF draft title.

## History of misreadings found by review
- Round three: dual-write attributed to microservices.io (it is AWS F76's term); "API errors point to webhooks" (the Stripe page uses webhooks for outcomes reported by events, including after a request completes); "reconciliation ahead of any repeat" (Stripe says retry with the same key and parameters inside the key window, then reconcile).
- Earlier: Square F38 cited for retention (it is about behaviour varying by API).

## VERIFIED by opening the raw page
Python `compare_digest` (docs.python.org hmac); Stripe currencies (minor units); Stripe API keys (rotation, grace period); PCI SSC glossary (store, process, or transmit); DynamoDB optimistic locking (version number); PostgreSQL warm standby (asynchronous loss window); Stripe error handling (https://docs.stripe.com/error-handling, opened this round: connection errors retry with the same key and parameters in the key window, then reconcile; API errors rely on webhooks); Adyen idempotency (pause or fall back); Kafka design (idempotent producer); IETF draft 08. Interview pages: taken from R2 (not re-opened); the Meta page returned an error to curl in round four.

## UNVERIFIED (our reasoning, no opened source)
- Webhook secret rotation: partly supported by the Razorpay validate page (old secret for retries of older requests); the length of the overlap period is ours; tokenisation as described; API-key hashing and scopes.
- Status-code mapping beyond the IETF draft's two cases.
- Unique indexes on (merchant, key) and (merchant, order reference among non-failed payments); the index-first write order and same-transaction insert.
- Two short transactions around an attempt row; fail-closed idempotency store; never moving an unknown attempt to a second provider.
- Lookup-miss reasoning; late-authorization handling (the fact is F9/F43, the void is ours); recovery of a key record left in progress and the retry-later answer.
- Ledger id from movement id and kind; per-merchant sub-accounts; transaction locality; balances as sums plus checkpoints; dedicated database for a saturated merchant; per-merchant rate limits; the breaker rule.
- Only one layer retries and the total fits the shared deadline; polling as a fallback (F42 supports it, not cited in the text).
- Two-phase abort before the vote versus stall after prepare (general knowledge; F55 says only that it can block).
- Authorization with a void as a tentative operation (our inference beside F57).
- Capacity claim for one relational primary per partition; "status reads stay modest"; the four reconciliation difference kinds; replica promotion with synchronous or quorum commit as our remedy (the PostgreSQL page describes the asynchronous loss window and a synchronous replication section; applying it to this store is ours).
- The first metric to watch (attempts stuck in sent); the ask, say and tip scripts and the general-tips habits are our reasoning.
- Arithmetic checked by hand: 500 x 86,400 about 43.2 million; x4 about 170 million rows; x200 bytes about 35 GB a day; about 12.6 TB a year, written as 13.

- The capture-intent design rule (movement row committed before the provider capture, its id as the provider key, recovery scanning movements) is our reasoning; so is the pause-the-charge-path choice, and keeping an in-progress key record until its attempt is resolved.

## Gaps
- Card networks have no source. Interview pages for Google, Uber, Netflix, Stripe and others were not available (R2).
- Diagrams were not rendered.
- The overlap script checks 4-word runs outside quotes and finds only generic phrases; it cannot see a close paraphrase.
