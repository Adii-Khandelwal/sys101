# Facts sources for the payment gateway page (R6)

Compiled 1 Nov 2026. Every wording below was checked as a substring of the raw page text (curl, browser-like headers; PDFs through pypdf; copies in the session scratchpad). Wording is at most 25 words. No figure from teaching blogs; any number here is a doc or post figure flagged in Notes. Vendor docs show no reuse licence unless stated: quote-only, own words on the page.

## Topic 1: Payment lifecycle states and transitions

Readiness: ready (Stripe, Razorpay, Adyen). Note: no provider publishes a full legal-transition table as text (Razorpay has a diagram image); transitions here are partly stated and partly must be our reasoning, marked as such.

Vendor-only and disagreements: Vendor behaviour: all state names; say "typically" and name the source. Providers differ: Stripe puts retry-after-failure back to the start state, Razorpay can move Failed to Authorized later, Adyen result codes are per-answer and may change.

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F1 | https://docs.stripe.com/payments/payment-intents/verifying-status | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "A PaymentIntent’s status tracks the status of a payment and indicates when a payment requires further processing or customer actions." | Stripe states: requires payment method, requires confirmation, requires action, processing, requires capture, succeeded, canceled (names in the API object page, stripe.com/docs/api/payment_intents/object, opened). |
| F2 | https://docs.stripe.com/payments/payment-intents/verifying-status | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "the PaymentIntent’s status returns to requires _ payment _ method so the payment can be retried." | Transition: a failed attempt returns to the first state (spacing is a raw-text artefact). Failure is not terminal in Stripe. |
| F3 | https://docs.stripe.com/payments/payment-intents/verifying-status | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Subsequent refunds, disputes, and outcomes are reflected on the Charge." | The intent stays succeeded; later money events live on another object. Vendor design. |
| F4 | https://docs.stripe.com/payments/payment-intents/verifying-status | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "These payment methods can take up to a few days to process." | processing state for asynchronous methods. |
| F5 | https://razorpay.com/docs/payments/payments/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "The payment state changes to authorized when the bank successfully authenticates the customer’s payment details." | Razorpay states: created, authorized, captured, refunded, failed (read from the same page). |
| F6 | https://razorpay.com/docs/payments/payments/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Payment in this state is auto-refunded to the customer if not captured within 3 days of creation." | Vendor rule, doc figure (3 days), not for use as a page figure without "typically" and the name. |
| F7 | https://docs.adyen.com/online-payments/build-your-integration/payment-result-codes/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "The status of a payment can sometimes change after you get the result code" | Adyen result codes are the answer to a request, not a stored state; final: Authorised, Refused, Cancelled, Error. |
| F8 | https://docs.adyen.com/online-payments/build-your-integration/payment-result-codes/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "The payment order was successfully received but the final status of the payment is not available yet." | Pending; Received is "the initial state for all payments" (same page). |
| F9 | https://razorpay.com/docs/payments/payments/late-authorization/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "If there is no response, even after 10 minutes, the transaction is marked as Failed due to timeout." | Razorpay: Failed is not final; see topic 4. |

## Topic 2: Webhooks

Readiness: ready (Stripe, Adyen, Razorpay, Square).

Vendor-only and disagreements: Vendor behaviour: retry windows, deadlines. Providers disagree: ordering (Stripe none, Adyen use timestamp, Razorpay mostly), retry window (Stripe 3 days, Razorpay and Square 24 hours), deadline (Adyen 10 s, Razorpay 5 s, Square 10 s).

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F10 | https://docs.stripe.com/webhooks | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Stripe attempts to deliver events to your destination for up to three days with an exponential back off in live mode." | Retry window: Stripe three days (live mode). |
| F11 | https://docs.stripe.com/webhooks | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Stripe doesn’t guarantee the delivery of events in the order that they’re generated." | No ordering. |
| F12 | https://docs.stripe.com/webhooks | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Webhook endpoints might occasionally receive the same event more than once." | Dedupe by logged event IDs (same page). |
| F13 | https://docs.stripe.com/webhooks | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Stripe requires the raw body of the request to perform signature verification." | Signature over raw body. |
| F14 | https://docs.stripe.com/webhooks | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "you must return a 200 response before updating a customer’s invoice as paid in your accounting system." | Acknowledge first, then do work. |
| F15 | https://docs.stripe.com/webhooks | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Stripe includes a timestamp in the Stripe-Signature header." | Timestamp is signed, to resist replay. |
| F16 | https://docs.adyen.com/development-resources/webhooks/handle-webhook-events/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "Make sure that you acknowledge the webhook before applying any business logic" | Adyen: store, then accept, then process. |
| F17 | https://docs.adyen.com/development-resources/webhooks/handle-webhook-events/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "If Adyen does not receive this response within 10 seconds, for example because your server is down, we mark the webhook as Failing" | Response deadline: Adyen 10 seconds. |
| F18 | https://docs.adyen.com/development-resources/webhooks/handle-webhook-events/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "it is possible that you receive the same webhook event twice" | Duplicates share eventCode and pspReference (same page). |
| F19 | https://docs.adyen.com/development-resources/webhooks/handle-webhook-events/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "To ensure you are processing events in the correct chronological order, always check the timestamp." | Adyen: order from timestamp and sometimes sequenceNumber, a different stance from Stripe. |
| F20 | https://docs.adyen.com/development-resources/webhooks/handle-webhook-events/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "Always verify the HMAC signature before processing the payload and using its data." | HMAC signature. |
| F21 | https://razorpay.com/docs/webhooks/best-practices/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "we retry the delivery in exponential backoff policy for 24 hours after event creation timestamp." | Retry window: Razorpay 24 hours, then the webhook is disabled. |
| F22 | https://razorpay.com/docs/webhooks/best-practices/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "You could be receiving the same events multiple times as Razorpay follows at-least-once delivery semantics." | Names at-least-once explicitly. |
| F23 | https://razorpay.com/docs/webhooks/best-practices/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "However, you may not always receive the webhooks in order." | Ordering not guaranteed. |
| F24 | https://razorpay.com/docs/webhooks/best-practices/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "your server accepts the event but fails to respond in 5 seconds" | Response deadline: Razorpay 5 seconds. |
| F25 | https://razorpay.com/docs/webhooks/best-practices/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Razorpay considers any non-2xx response as an event delivery failure." | Expected response: 2xx. |
| F26 | https://razorpay.com/docs/webhooks/validate-test/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "This hash signature is passed with each request under the X-Razorpay-Signature header that you need to validate at your end." | Signature header. |
| F27 | https://developer.squareup.com/docs/webhooks/overview | Square | no date shown | Footer "© 2026 Square, Inc."; no reuse licence | reference | "Square resends the event notification for up to 24 hours after the originating event, using exponential backoff to avoid spamming applications." | Square: 24 hours, 11 retries in a table on the page. |
| F28 | https://developer.squareup.com/docs/webhooks/overview | Square | no date shown | Footer "© 2026 Square, Inc."; no reuse licence | reference | "If your application fails to acknowledge the notification in a timely manner, a duplicate event is sent" | Duplicates by design; 10 seconds to respond (same page). |

## Topic 3: Idempotency keys

Readiness: ready (Stripe, Adyen, Square).

Vendor-only and disagreements: Vendor behaviour: retention (Stripe v1 24 h, Adyen 7 to 14 days, Square not stated), key length, replay of errors. Providers disagree on retention and on conflict handling.

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F29 | https://docs.stripe.com/api/idempotent_requests | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Retries with the same key return the saved response, including 500 errors." | API v1 replay returns the saved response. |
| F30 | https://docs.stripe.com/api/idempotent_requests | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "you can remove keys from the system automatically after they’re at least 24 hours old." | Retention: Stripe v1, 24 hours minimum; v2 behaves differently. |
| F31 | https://docs.stripe.com/api/idempotent_requests | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "The idempotency layer compares incoming parameters to those of the original request and errors if they’re not the same" | Same key, different parameters: error. |
| F32 | https://docs.stripe.com/api/idempotent_requests | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "or the request conflicts with another request that’s executing concurrently, we don’t save the idempotent result" | Concurrent or invalid requests are not saved, so they can be retried. |
| F33 | https://docs.adyen.com/development-resources/api-idempotency/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "Idempotency keys are valid for a period of 7 to 14 days after first submission." | Retention: Adyen 7 to 14 days. |
| F34 | https://docs.adyen.com/development-resources/api-idempotency/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "If the Adyen payments platform already processed the request, the response to the first attempt will be returned without duplication." | Replay returns the first response. |
| F35 | https://docs.adyen.com/development-resources/api-idempotency/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "Fall back to non-idempotent processing by not submitting the idempotency-key HTTP header." | A fail-open option when the key store is down; also topic 11. |
| F36 | https://developer.squareup.com/docs/build-basics/common-api-patterns/idempotency | Square | no date shown | Footer "© 2026 Square, Inc."; no reuse licence | reference | "Instead of getting an error, the endpoint returns the response as the first successful CreatePayment response." | Replay returns the first response. |
| F37 | https://developer.squareup.com/docs/build-basics/common-api-patterns/idempotency | Square | no date shown | Footer "© 2026 Square, Inc."; no reuse licence | reference | "you get an error indicating that you used the idempotency key previously." | Same key, changed request: error. |
| F38 | https://developer.squareup.com/docs/build-basics/common-api-patterns/idempotency | Square | no date shown | Footer "© 2026 Square, Inc."; no reuse licence | reference | "Note that this behavior might vary depending on the API." | Square does not state retention on this page. |

## Topic 4: Finding out after a timeout or unknown result

Readiness: ready (Stripe, Razorpay, Adyen, Square).

Vendor-only and disagreements: Vendor behaviour: the retrieve and polling advice; Razorpay late authorisation is Razorpay-specific.

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F39 | https://docs.stripe.com/error-handling | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Treat the result of the API call as indeterminate. That is, don’t assume that it succeeded or that it failed." | Unknown result. |
| F40 | https://docs.stripe.com/error-handling | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Retrieve the relevant object from Stripe and check its status." | Fetch status, or wait for a webhook (same page). |
| F41 | https://docs.stripe.com/error-handling | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "If the outcome is still unknown, reconcile it before repeating the operation." | Reconcile before a new attempt. |
| F42 | https://docs.stripe.com/payments/payment-intents/verifying-status | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "it’s much less reliable and might trigger rate limits." | Polling is the fallback, webhooks preferred. |
| F43 | https://razorpay.com/docs/payments/payments/late-authorization/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "After that, Razorpay polls the bank at various intervals for 3 days, from the payment creation day." | Gateway polls the bank for the final answer; a Failed payment can become Authorized (late authorisation). Doc also gives a rate under 0.5 percent: a doc figure, do not use. |
| F44 | https://razorpay.com/docs/payments/payments/capture-settings/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Razorpay may not immediately receive payment status from the bank." | Unknown upstream status. |
| F45 | https://docs.adyen.com/development-resources/api-idempotency/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "this approach helps keep track of missing responses, a common consequence of a data transmission timeout." | Webhooks for missing responses. |
| F46 | https://developer.squareup.com/docs/build-basics/common-api-patterns/idempotency | Square | no date shown | Footer "© 2026 Square, Inc."; no reuse licence | reference | "You don't know what happened to your request and therefore you make the request again, charging the customer twice." | The timeout problem, with idempotency as the fix. |
| F47 | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | Marc Brooker, Amazon Builders' Library | Published Dec 5, 2019 | Footer "© 2026, Amazon Web Services, Inc", Site Terms; no reuse licence. Dated 2019. | post | "A timeout or failure doesn't necessarily mean that side effects haven't happened." | Amazon 2019. |

## Topic 5: Reconciliation and settlement reports

Readiness: ready (Stripe, Adyen); Razorpay has settlement but no reconciliation report found.

Vendor-only and disagreements: Vendor behaviour: report names and layouts; both are dashboard-and-file reports.

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F48 | https://docs.stripe.com/reports/payout-reconciliation | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "match the payouts you receive in your bank account with the batches of payments and other transactions that they relate to" | Stripe: payout-level report with an itemized CSV. |
| F49 | https://docs.stripe.com/reports/payout-reconciliation | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "You’re responsible for reconciling instant payouts against your transaction history." | Limit: instant payouts cannot be matched by Stripe. |
| F50 | https://docs.adyen.com/reporting/settlement-reconciliation/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "You get a settlement from Adyen when a batch closes." | Adyen: settlement batches. |
| F51 | https://docs.adyen.com/reporting/settlement-reconciliation/transaction-level/settlement-details-report/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "Use report to reconcile your settlements on a transaction level." | Adyen transaction-level report. |
| F52 | https://docs.adyen.com/reporting/settlement-reconciliation/transaction-level/settlement-details-report/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "Each transaction entry shows the status of the transaction." | Statuses like Settled and Chargeback appear in the sample rows (same page). |
| F53 | https://razorpay.com/docs/payments/settlements/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "The standard settlement cycle for domestic payments is T+2 working days (where T is the date of transaction capture)." | Razorpay: settlement doc only. Razorpay reconciliation page not found (404); not claimed. |

## Topic 6: Against distributed transactions; sagas

Readiness: ready (Helland 2007, Garcia-Molina and Salem 1987, Hohpe 2004 page). Hohpe IEEE Software 2005 version not opened. Sagas copy is a scan.

Vendor-only and disagreements: General reasoning, supported by papers. No vendor-only items.

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F54 | https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf | Pat Helland (then at Amazon.com; paper says views are personal) | CIDR 2007, January 7-10 | Paper text: Creative Commons Attribution 2.5, attribute author and CIDR 2007 | paper | "In general, application developers simply do not implement large scalable applications assuming distributed transactions." | Position paper 2007. |
| F55 | https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf | Pat Helland (then at Amazon.com; paper says views are personal) | CIDR 2007, January 7-10 | Paper text: Creative Commons Attribution 2.5, attribute author and CIDR 2007 | paper | "which can easily block when nodes are unavailable" | 2PC blocking (after "2PC (two phase commit)"). |
| F56 | https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf | Pat Helland (then at Amazon.com; paper says views are personal) | CIDR 2007, January 7-10 | Paper text: Creative Commons Attribution 2.5, attribute author and CIDR 2007 | paper | "You cannot perform atomic transactions across these disjoint scopes of transactional serializability." | Entities as the scope of atomicity. |
| F57 | https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf | Pat Helland (then at Amazon.com; paper says views are personal) | CIDR 2007, January 7-10 | Paper text: Creative Commons Attribution 2.5, attribute author and CIDR 2007 | paper | "In a world where atomic transactions are not a possibility, tentative operations are used to negotiate a shared outcome." | Tentative operation with a right to cancel. |
| F58 | https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf | Hector Garcia-Molina and Kenneth Salem, Princeton | 1987 (ACM, SIGMOD) | Scan carries ACM notice: copying with attribution "by permission of" ACM; copy hosted on a Cornell course page. OCR text, so letter errors in the raw text. | paper | "compensatmg transactions are run to amend a partial execution" | OCR-corrupt in the raw text: "compensatmg" is "compensating". Saga paper is about long-lived transactions in one database, not microservices. |
| F59 | https://www.enterpriseintegrationpatterns.com/ramblings/18_starbucks.html | Gregor Hohpe | November 19, 2004 | Footer "© 2024 • All rights reserved"; quote-only | post | "Compensating Action - The last option is to undo operations that were already completed to put the system back into a consistent state." | Also names retry and idempotent receiver (same page). The IEEE Software version was NOT opened and is not claimed. |
| F60 | https://www.enterpriseintegrationpatterns.com/ramblings/18_starbucks.html | Gregor Hohpe | November 19, 2004 | Footer "© 2024 • All rights reserved"; quote-only | post | "Such "compensating actions" work well for example if we deal with monetary systems where we can recredit money that has been debited." | Money example. |
| F61 | https://microservices.io/patterns/data/saga.html | Chris Richardson | no date shown | Footer "Copyright © 2026 Chris Richardson • All rights reserved"; quote-only | reference | "A saga is a reliably coordinated sequence of local transactions." | Same page: "2PC is not an option". |
| F62 | https://learn.microsoft.com/en-us/azure/architecture/patterns/saga | Microsoft Azure Architecture Center | ms.date 2025-02-25 (page metadata) | Footer "© Microsoft 2026", Terms of Use; no reuse licence | reference | "Maintain data consistency in distributed systems by coordinating a sequence of local transactions across multiple services." | Recent vendor guide. |

## Topic 7: At-least-once delivery, no end-to-end exactly-once

Readiness: ready (Kafka, SQS, RabbitMQ, Pub/Sub, Helland).

Vendor-only and disagreements: Pub/Sub exactly-once is vendor-specific and scoped; Kafka frames it as processing semantics.

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F63 | https://kafka.apache.org/42/design/design/ | Apache Kafka project (docs for 4.2) | no date shown | Footer: "© 2026 Apache Software Foundation under the terms of the Apache License v2" | reference | "At least once –Messages are never lost but may be redelivered." | Kafka docs frame exactly-once as processing semantics. |
| F64 | https://kafka.apache.org/42/design/design/ | Apache Kafka project (docs for 4.2) | no date shown | Footer: "© 2026 Apache Software Foundation under the terms of the Apache License v2" | reference | "Many systems claim to provide “exactly-once” delivery semantics, but it is important to read the fine print" | Caution. |
| F65 | https://kafka.apache.org/42/design/design/ | Apache Kafka project (docs for 4.2) | no date shown | Footer: "© 2026 Apache Software Foundation under the terms of the Apache License v2" | reference | "it cannot be sure if this error happened before or after the message was committed" | Producer network error: outcome unknown (Kafka docs). |
| F66 | https://kafka.apache.org/42/design/design/ | Apache Kafka project (docs for 4.2) | no date shown | Footer: "© 2026 Apache Software Foundation under the terms of the Apache License v2" | reference | "This can be handled more simply and generally by letting the consumer store its offset in the same place as its output." | Avoids two-phase commit to external stores. |
| F67 | https://kafka.apache.org/42/design/design/ | Apache Kafka project (docs for 4.2) | no date shown | Footer: "© 2026 Apache Software Foundation under the terms of the Apache License v2" | reference | "Exactly-once delivery for other destination systems generally requires cooperation with such systems" | Scope limit. |
| F68 | https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html | Amazon Web Services | no date shown | No licence or terms line on the page; AWS documentation, quote-only | reference | "Standard queues ensure at-least-once message delivery, but due to the highly distributed architecture, more than one copy of a message might be delivered" | Queue vendor statement. |
| F69 | https://www.rabbitmq.com/docs/reliability | RabbitMQ (Broadcom) | no date shown | Footer "Copyright © 2005-2026 Broadcom. All Rights Reserved."; quote-only | reference | "consumer applications will need to perform deduplication or handle incoming messages in an idempotent manner" | Broker advice. |
| F70 | https://cloud.google.com/pubsub/docs/exactly-once-delivery | Google Cloud | no date shown | Page footer: content licensed under Creative Commons Attribution 4.0 | reference | "Pub/Sub supports exactly-once delivery, within a cloud region, based on a Pub/Sub-defined unique message ID" | Scoped exactly-once; pull subscriptions only (same page). Providers differ. |
| F71 | https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf | Pat Helland (then at Amazon.com; paper says views are personal) | CIDR 2007, January 7-10 | Paper text: Creative Commons Attribution 2.5, attribute author and CIDR 2007 | paper | "Most Applications Use “At-Least-Once” Messaging" | Section heading, 2007. |
| F72 | https://microservices.io/patterns/data/transactional-outbox.html | Chris Richardson | no date shown | Footer "Copyright © 2026 Chris Richardson • All rights reserved"; quote-only | reference | "a message consumer must be idempotent, perhaps by tracking the IDs of the messages that it has already processed" | Consumers must be idempotent. |

## Topic 8: Transactional outbox

Readiness: ready (microservices.io, AWS Prescriptive Guidance, Azure).

Vendor-only and disagreements: Pattern documentation; Azure Service Bus dedupe is vendor-only.

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F73 | https://microservices.io/patterns/data/transactional-outbox.html | Chris Richardson | no date shown | Footer "Copyright © 2026 Chris Richardson • All rights reserved"; quote-only | reference | "it is not viable to use a traditional distributed transaction (2PC) that spans the database and the message broker" | Why outbox. |
| F74 | https://microservices.io/patterns/data/transactional-outbox.html | Chris Richardson | no date shown | Footer "Copyright © 2026 Chris Richardson • All rights reserved"; quote-only | reference | "Messages are guaranteed to be sent if and only if the database transaction commits" | Benefit. |
| F75 | https://microservices.io/patterns/data/transactional-outbox.html | Chris Richardson | no date shown | Footer "Copyright © 2026 Chris Richardson • All rights reserved"; quote-only | reference | "The Message relay might publish a message more than once." | Outbox is at-least-once. |
| F76 | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html | AWS Prescriptive Guidance | no date shown | No licence or terms line on the page; AWS documentation, quote-only | reference | "A dual write operation occurs when an application writes to two different systems" | Defines the problem. |
| F77 | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html | AWS Prescriptive Guidance | no date shown | No licence or terms line on the page; AWS documentation, quote-only | reference | "The events processing service might send out duplicate messages or events" | Same advice. |
| F78 | https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-outbox-cosmos | Microsoft Azure Architecture Center | ms.date 2026-02-23 (page metadata) | Footer "© Microsoft 2026", Terms of Use; no reuse licence | reference | "When Service Bus receives a duplicate message, it ignores and drops the message." | Vendor-specific dedupe by MessageId. |

## Topic 9: Append-only double-entry ledgers

Readiness: ready (Square 2019, TigerBeetle, Fowler S20 already in repo). Uber URLs listed, not re-extracted.

Vendor-only and disagreements: Square and TigerBeetle are single-company designs; Square relaxed standard debit and credit signs (page).

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F79 | https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/ | Square engineering blog | October 16, 2019 | Footer "© 2025 Square, Inc."; no reuse licence. Dated 2019: describes Square then. | post | "Books are immutable and can only have the balance changed by participating in accounting transaction." | Square 2019, built on Spanner. |
| F80 | https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/ | Square engineering blog | October 16, 2019 | Footer "© 2025 Square, Inc."; no reuse licence. Dated 2019: describes Square then. | post | "so each cent lost is matched with a cent gained" | Double entry balance. |
| F81 | https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/ | Square engineering blog | October 16, 2019 | Footer "© 2025 Square, Inc."; no reuse licence. Dated 2019: describes Square then. | post | "we occasionally observed inconsistencies in the data, resulting in customer inquiries and delayed deposits" | Motivation (no figures used). |
| F82 | https://raw.githubusercontent.com/tigerbeetle/tigerbeetle/main/docs/reference/transfer.md | TigerBeetle project (docs in repo) | no date shown | Repo LICENSE read: "Apache License Version 2.0"; assumes docs fall under repo licence | reference | "is an immutable record of a financial transaction between two accounts" | TigerBeetle: transfers cannot be changed or deleted; corrections are new transfers (page). |
| F83 | https://raw.githubusercontent.com/tigerbeetle/tigerbeetle/main/docs/coding/data-modeling.md | TigerBeetle project (docs in repo) | no date shown | Repo LICENSE read: "Apache License Version 2.0"; assumes docs fall under repo licence | reference | "Accounts and transfers are immutable once created." | Same. |
| F84 | https://raw.githubusercontent.com/tigerbeetle/tigerbeetle/main/docs/coding/data-modeling.md | TigerBeetle project (docs in repo) | no date shown | Repo LICENSE read: "Apache License Version 2.0"; assumes docs fall under repo licence | reference | "to avoid executing an event twice" | The id is the idempotency key. |

Also for topic 9: Fowler AccountingTransaction (S20 in design-gateway-reference-sources.md, 22 January 2005); Uber LedgerStore posts already in the repo (not re-extracted): https://www.uber.com/us/en/blog/how-ledgerstore-supports-trillions-of-indexes/ and https://www.uber.com/us/en/blog/migrating-from-dynamodb-to-ledgerstore/ .

## Topic 10: Partition keys and hot partitions

Readiness: ready (DynamoDB, Spanner, Square).

Vendor-only and disagreements: DynamoDB limits are vendor figures, do not use as page figures.

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F85 | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html | Amazon Web Services | no date shown | No licence or terms line on the page; AWS documentation, quote-only | reference | "You should design your application for uniform activity across all partition keys in the table and its secondary indexes." | Official guidance. |
| F86 | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html | Amazon Web Services | no date shown | No licence or terms line on the page; AWS documentation, quote-only | reference | "Every partition in a DynamoDB table is designed to deliver a maximum capacity of 3,000 read units per second and 1,000 write units per second." | Doc figure, vendor limit: not for page use. |
| F87 | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-sharding.html | Amazon Web Services | no date shown | No licence or terms line on the page; AWS documentation, quote-only | reference | "add a random number to the end of the partition key values" | Write sharding. |
| F88 | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-sharding.html | Amazon Web Services | no date shown | No licence or terms line on the page; AWS documentation, quote-only | reference | "to read all the items for a given day, you would have to query the items for all the suffixes and then merge the results" | Trade-off. |
| F89 | https://cloud.google.com/spanner/docs/schema-design | Google Cloud | no date shown | Page footer: content licensed under Creative Commons Attribution 4.0 | reference | "situations where too many requests are sent to the same server which saturates the resources of the server and potentially causes high latencies" | Hotspot defined. |
| F90 | https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/ | Square engineering blog | October 16, 2019 | Footer "© 2025 Square, Inc."; no reuse licence. Dated 2019: describes Square then. | post | "the schema had to be carefully designed to avoid hotspots" | Company post, timestamp-ordered keys. |

## Topic 11: Timeouts, retries, backoff, jitter, fail open or closed

Readiness: ready for retries, backoff, jitter, fail-open (Brooker, SRE, Stripe, AWS). Gap: fail-closed has no opened source; any "fail closed for risk checks" line is our own reasoning.

Vendor-only and disagreements: Fail-open is shown by Stripe and AWS as deliberate for limiter and health checks only.

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F91 | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | Marc Brooker, Amazon Builders' Library | Published Dec 5, 2019 | Footer "© 2026, Amazon Web Services, Inc", Site Terms; no reuse licence. Dated 2019. | post | "When failures are caused by overload, retries that increase load can make matters significantly worse." | Amazon 2019. |
| F92 | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | Marc Brooker, Amazon Builders' Library | Published Dec 5, 2019 | Footer "© 2026, Amazon Web Services, Inc", Site Terms; no reuse licence. Dated 2019. | post | "Jitter adds some amount of randomness to the backoff to spread the retries around in time." | Jitter. |
| F93 | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | Marc Brooker, Amazon Builders' Library | Published Dec 5, 2019 | Footer "© 2026, Amazon Web Services, Inc", Site Terms; no reuse licence. Dated 2019. | post | "limiting retries locally using a token bucket" | Retry budget. |
| F94 | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | Marc Brooker, Amazon Builders' Library | Published Dec 5, 2019 | Footer "© 2026, Amazon Web Services, Inc", Site Terms; no reuse licence. Dated 2019. | post | "we choose an acceptable rate of false timeouts" | Timeouts from a latency percentile (the example rate in the post is a labelled example). |
| F95 | https://sre.google/sre-book/addressing-cascading-failures/ | Google SRE book, chapter 22 | © 2017 | Footer: "Copyright © 2017 Google, Inc. ... Licensed under CC BY-NC-ND 4.0" (no derivatives; quote-only) | post | "Always use randomized exponential backoff when scheduling retries." | Google SRE 2017. |
| F96 | https://sre.google/sre-book/addressing-cascading-failures/ | Google SRE book, chapter 22 | © 2017 | Footer: "Copyright © 2017 Google, Inc. ... Licensed under CC BY-NC-ND 4.0" (no derivatives; quote-only) | post | "Consider having a server-wide retry budget." | Same. |
| F97 | https://stripe.com/blog/rate-limiters | Paul Tarjan, Stripe | March 30, 2017 | Footer "© 2026 Stripe, LLC"; no reuse licence | post | "any coding or operational errors would fail open and the API would still stay functional" | Stripe 2017: limiter fails open. |
| F98 | https://aws.amazon.com/builders-library/implementing-health-checks/ | Amazon Builders' Library | Published Dec 5, 2019 (as shown) | Footer "© 2026, Amazon Web Services, Inc", Site Terms; no reuse licence. Dated 2019. | post | "when all servers fail health checks at the same time, the load balancer fails open, allowing traffic to all servers" | Fail open in health checks. |
| F99 | https://docs.adyen.com/development-resources/api-idempotency/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "Fall back to non-idempotent processing by not submitting the idempotency-key HTTP header." | Fail-open choice offered to clients. |

Already in the repo for topic 11 (not re-read): Azure retry and circuit breaker pages (S22, S23) and https://sre.google/sre-book/handling-overload/ ; Brooker (S26).

## Topic 12: Authorization, capture and hold expiry

Readiness: ready for the holds and expiry of providers (Stripe, Adyen, Razorpay, Square). Gap: card network own documents (Mastercard rules PDF returned 403, Visa not tried); card-network behaviour is only reported through providers.

Vendor-only and disagreements: All windows are vendor or network specific. Providers disagree (Stripe 7 days online, Square 7 online and 36 hours in person, Razorpay 3 days).

| ID | URL | Author or company | Date | Terms line | Kind | Wording (exact) | Notes |
| - | - | - | - | - | - | - | - |
| F100 | https://docs.stripe.com/payments/place-a-hold-on-a-payment-method | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "If the authorization expires before you capture the funds, the funds are released" | Hold expiry. |
| F101 | https://docs.stripe.com/payments/place-a-hold-on-a-payment-method | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "The exact authorization window is 4 days and 18 hours, to allow time for clearing processes." | Table lists windows by card brand and by customer or merchant initiated; vendor table, say "typically". |
| F102 | https://docs.stripe.com/payments/place-a-hold-on-a-payment-method | Stripe | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "Card payments: The amount is typically on hold for 7 days for online payments and 2 days for in-person Terminal payments" | Stripe wording "typically". |
| F103 | https://docs.adyen.com/online-payments/capture/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "By default, payments are captured automatically without a delay, immediately after authorization of the payment request." | Default differs from Stripe. |
| F104 | https://docs.adyen.com/online-payments/adjust-authorisation/ | Adyen | no date shown | Footer "© 2026 Adyen", Terms & Conditions link; no reuse licence | reference | "The length of an authorization's validity depends on the card scheme." | No numbers on that page. |
| F105 | https://razorpay.com/docs/payments/payments/capture-settings/ | Razorpay | no date shown | No licence or terms line on the page; vendor documentation, quote-only | reference | "payments that are not captured within this period will be refunded automatically to customers" | Razorpay: 3 days (same page). |
| F106 | https://developer.squareup.com/docs/payments-api/take-payments/card-payments/delayed-capture | Square | no date shown | Footer "© 2026 Square, Inc."; no reuse licence | reference | "7 days for online (card not present) payments" | Square also gives 36 hours card present, default action cancel. |

## Dropped

- Mastercard Transaction Processing Rules PDF: HTTP 403 to curl. Visa rules not tried. Card networks have no direct source.
- Stripe lifecycle URL /payments/paymentintents/lifecycle: returned the PaymentIntents overview, no lifecycle text used.
- Adyen /online-payments/payment-result-codes and /reporting/settlement-details-report (guessed URLs): 404; the working URLs are in the table.
- Razorpay reconciliation URL guessed: 404. Razorpay late-authorisation rate (under 0.5 percent) and DynamoDB 3,000/1,000 limits: doc figures, kept out of use.
- ACM Digital Library Sagas page: 403. The Cornell-hosted scan is used; its text has OCR errors.
- Hohpe IEEE Software 2005 article: not opened, not claimed. ACM Queue Helland version: not opened (CIDR PDF used).
- Fail-closed for risk checks: no confirmed source.
- Wording dropped for failing the substring check: 0.
