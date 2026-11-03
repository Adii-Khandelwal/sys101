# Payments gateway v2: claim trace

Draft `docs/drafts/design-payments-gateway-v2.json`. Reference claims rest on the S-rows of `docs/drafts/design-gateway-reference-sources.md` (R3); source ids in the JSON are the row ids in lower case (`s3` = S3). Basis key = row id plus a letter for the row's first or second quoted wording (a, b), in the row's order. Every claim is written in the page's own words with no quotation marks; the generator's check found no run of five consecutive words shared with any recorded wording. The wording column is the exact supporting text from the row.

## Sections

- scope: the page's own choice, no sources.
- Sourced: qualities, things-and-contract, build-it-up (5 stages), failure-and-change, thorough-answer.
- No-source-yet: deep-dives (no row states the cost of each rung of a ladder, or the order), against-the-grain (no row states that a common answer is wrong for this case).
- Claims: 45 reference claims in total (incl. follow-ups). 7 curiosities from the old reviewed draft. 4 diagrams (capture, record, retry-safely, notify); none for authorize (no row states a flow).
- Sources: 22 reference plus 5 post-side entries (four posts and one paper, google-percolator-2010); one entry per URL.

## Claim trace

| Source | Wording key | Claim (mine) | Supporting wording (R3 row) |
| - | - | - | - |
| s21 | S21a | Charge calls: Unmesh Joshi's Idempotent Receiver pattern (on martinfowler.com) notes that servers receive duplicate requests when clients retry. | servers will get duplicate requests from the client when it retries. |
| s7 | S7b | Square's guide treats accidental repeats of a call as a hazard to guard against, and notes they can have harmful effects. | protect against accidental duplicate calls that can have negative consequences. |
| s28 | S28b | Whole path: a teaching page on payment systems wants transactions to stay safe and financial records sound, even though outside payment networks respond on their own schedule. | The system should guarantee transaction safety and financial integrity despite the inherently asynchronous nature of external payment networks |
| s20 | S20 | Records: in Martin Fowler's accounting transaction, each withdrawal needs a matching deposit. | every withdrawel must be balanced with a deposit. |
| s1 | S1a | Payment record: Stripe's PaymentIntent follows a payment from the moment it is created until checkout finishes. | It tracks a payment from creation through checkout, and triggers additional authentication steps when required. |
| s1 | S1b | It usually maps to a shopper's cart or session inside the merchant's application. | Each PaymentIntent typically correlates with a single shopping cart or customer session in your application. |
| s15 | S15 | Order: Razorpay lets merchants make orders and attach payments to them. | You can create Orders and link them to payments. |
| s16 | S16a, S16b | Calls: PayPal's orders API has a call to authorize payment for an order and a separate call to capture it. | Authorizes payment for an order. / Captures payment for an order. |
| s3 | S3a | Retry-safe calls: Stripe's API lets a client repeat a request safely, without the operation being performed again by mistake. | The API supports idempotency for safely retrying requests without accidentally performing the same operation |
| s27 | S27b | Hello Interview's delivery page defines the contract between the system and its users before the high-level design. | Before you get into the high-level design, you'll want to define the contract between your system and its users. |
| s13 | S13 | Trust: Razorpay sends a hash signature in a request header with every event, and the receiver is expected to check it. | This hash signature is passed with each request under the X-Razorpay-Signature header that you need to validate at your end. |
| s8 | S8a | Adyen: authorizing reserves the money in the shopper's bank account. | The authorization reserves the funds on the shopper's bank account. |
| s2 | S2 | Stripe's PaymentIntent status says whether it needs more processing or an action from the customer. | A PaymentIntent’s status tracks the status of a payment and indicates when a payment requires further processing or customer actions. |
| s5 | S5a | Stripe: an eligible payment method can carry a hold that sets funds aside to be taken later. | you can place a hold on an eligible payment method to reserve funds that you can capture later. |
| s8 | S8b | Adyen notes that some payment methods allow capture to happen apart from authorization. | For some payment methods, you can capture a payment separately from authorization. |
| s12 | S12a | Razorpay describes the alternative where the payment moves to the captured state automatically. | it is automatically moved to the captured state. |
| s5 | S5b | Still weak: Stripe says an authorization that expires before capture releases the funds. | If the authorisation expires before you capture the funds, the funds are released |
| s17 | S17a | In TigerBeetle each account keeps running totals of posted debits and posted credits. | TigerBeetle tracks each account's cumulative posted debits and cumulative posted credits. |
| s18 | S18 | TigerBeetle's guide on pending transfers says they do not change the posted debit or credit totals. | Pending transfers leave the `debits_posted`/`credits_posted` unmodified. |
| s17 | S17b | TigerBeetle's data-modelling guide gives the id field the job of acting as an idempotency key. | The primary purpose of an `id` is to serve as an "idempotency key" |
| s3 | S3b | Stripe: the client makes up a unique idempotency key and sends it, and the server uses it to spot a later retry of the same request. | A client generates an idempotency key, which is a unique key that the server uses to recognize subsequent retries of the same request. |
| s21 | S21b | The Idempotent Receiver pattern has the server return an identical response to a repeat and skip processing the request again. | it returns the same response to the client, without processing the request again. |
| s7 | S7a | Square defines an operation as idempotent when repeating it, however often, gives the same result. | An API call or operation is idempotent if it has the same result no matter how many times it's applied. |
| s10 | S10 | Adyen says idempotency support helps avoid unwanted duplicates when failures and retries happen. | This helps avoid unwanted duplication in case of failures and retries. |
| s4 | S4a | Stripe lists a customer's bank confirming a payment as an event that arrives asynchronously, delivered by webhook. | Receiving webhook events helps you respond to asynchronous events, such as when a customer’s bank confirms a payment |
| s9 | S9b | Adyen advises the receiving side to store the message and then process what it contains afterwards. | store the message, and process the contents of the message. |
| s22 | S22a | Azure's retry pattern expects temporary faults in the cloud and wants applications built to absorb them quietly. | In the cloud, transient faults should be expected and an application should be designed to handle them elegantly and transparently. |
| s23 | S23a | Azure's circuit breaker pattern is about not retrying again and again an operation that is expected to fail. | instead of repeatedly retrying an operation that's likely to fail. |
| s27 | S27d | Hello Interview's delivery framework advises starting with a simple design that covers the core functional requirements. | Focus on a relatively simple design that meets the core functional requirements |
| s27 | S27a | The same framework says to do calculations only when they would change the design. | Instead, perform calculations only if they will directly influence your design. |
| s30 | S30 | The system-design-primer says candidates might be asked to estimate by hand, a different stance from the delivery framework. | You might be asked to do some estimates by hand. |
| s3 | S3a | Stripe's API lets a client repeat a request without repeating its effect. | The API supports idempotency for safely retrying requests without accidentally performing the same operation |
| s21 | S21b | Unmesh Joshi's Idempotent Receiver pattern answers a repeat with the same response and skips the work. | it returns the same response to the client, without processing the request again. |
| s12 | S12b | Razorpay's guide warns that the bank's report on a payment can reach it late. | Razorpay may not immediately receive payment status from the bank. |
| s9 | S9b | Adyen advises a merchant receiving webhooks to store the message and then process what it contains. | store the message, and process the contents of the message. |
| s21 | S21a | The Idempotent Receiver pattern notes that clients which retry cause servers to see duplicate requests. | servers will get duplicate requests from the client when it retries. |
| s13 | S13 | Razorpay includes a hash signature in a header that the receiver should validate. | This hash signature is passed with each request under the X-Razorpay-Signature header that you need to validate at your end. |
| s4 | S4b | Stripe's webhook guide says verifying a signature takes the raw request body. | Stripe requires the raw body of the request to perform signature verification. |
| s5 | S5b | With Stripe, if the authorization expires before capture, the held funds go back. | If the authorisation expires before you capture the funds, the funds are released |
| s8 | S8b | Adyen notes that capture can be separate from authorization for some payment methods. | For some payment methods, you can capture a payment separately from authorization. |
| s23 | S23a | Azure's circuit breaker pattern is an alternative to retrying again and again. | instead of repeatedly retrying an operation that's likely to fail. |
| s22 | S22a | Azure's retry pattern still expects temporary faults and wants them handled smoothly. | In the cloud, transient faults should be expected and an application should be designed to handle them elegantly and transparently. |
| s20 | S20 | Fowler's accounting transaction matches each withdrawal with a deposit. | every withdrawel must be balanced with a deposit. |
| s17 | S17a | TigerBeetle keeps running posted debit and credit totals per account. | TigerBeetle tracks each account's cumulative posted debits and cumulative posted credits. |
| s18 | S18 | Pending transfers do not change those posted totals. | Pending transfers leave the `debits_posted`/`credits_posted` unmodified. |

## Curiosities (company post/paper bank, old draft; all text from the old reviewed claims)

| id | sourceId | Old claim it rests on |
| - | - | - |
| trillion-move | migration | migration: More than a trillion ledger entries ... over two years, no downtime and no outage. |
| offline-check | migration | migration: biggest single job compared 760 billion records (70 TB compressed); live shadow validation cannot give strong guarantees for rarely accessed history. |
| two-rules | indexes | indexes: Card holds visible to the next read; payment history may lag a few seconds. |
| backfill-steps | migration | migration: 100 billion records at 10,000 a second take 120 days, production 1,000 a second; scale up in small steps. |
| stack-243 | aws-timeouts-retries-backoff-2019 | aws: stack five deep, three retries each layer, 243x the load. |
| budget-10 | google-sre-handling-overload-2017 | google-sre: retries below 10% of requests; layering brings growth to 1.1x in the general case. |
| four-times | google-percolator-2010 | percolator: writing a single cell and committing costs roughly four times raw Bigtable; Google accepted that overhead. |

The question at the end of each line is the hook; no cause is asserted.

## Diagrams

- capture: Hold to Capture (arrow: S5a, funds set aside to be captured later). retry-safely: Client to Server with the note Idempotency key (S3b: the client sends a key and the server uses it). notify: Store the message to Process what it contains (arrow: S9b, store first, process afterwards). record: Debits, Account, Credits joined by plain lines, no arrowheads (S17a: the account keeps both totals).
- authorize: no diagram, because S8a and S2 state no flow between parts. Each label word appears in that stage's claims (checked by the generator); `checkDiagram` passes.

## Agreement and disagreement

- Idempotency: S3, S7, S10 (API side), S21 (receiver side), S17 (ledger) are each cited for a different point, in the retry-safely stage, things-and-contract and the follow-ups. The page does not claim the sources agree beyond that. S21 is Unmesh Joshi's pattern on martinfowler.com; S20 is Martin Fowler's.
- Paired entries: only S20 and S17 speak to it; shown in qualities and the record stage.
- Capture: S5, S8, S12 are each cited for their own point; no default is claimed.
- Estimation: S27 and S30 differ; said plainly in thorough-answer.

## Left out and why

- Reconciliation, settlement files, PCI scope, tokenization, rate limiting, provider fallback, scale and running cost: no confirmed teaching source. Left out in scope or not mentioned.
- Against-the-grain: no-source-yet.
- Both dives removed. Repeat charge: no row states the cost its ladder needs. Late result: S9a only says webhooks avoid continuous polling (no cost of polling, no flaw fixed by the webhook rung) and S4b states a requirement (the raw request body for signature verification), not a cost. Deep-dives is no-source-yet.
- The AWS page is cited only as the post-kind entry for the stack-243 curiosity; the reference-kind entry is gone with every claim that cited it. S24, S25, S26, S29 unused.
- No estimation or caller-identity claims; no thorough-answer claim about which dives add depth.
- Follow-ups reuse source points already in the build-up, in fresh wording (an answer has to).
- Interviewer lines come from `lib/designSteps.ts`.
