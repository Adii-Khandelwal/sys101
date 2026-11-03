# Design sources, batch A (partial, stopped early on coordinator instruction)

Only Bitly was read in full. No new fetches after the stop message. Raw pages are saved in the scratchpad `h/` folder (HTML and text) for the next agent.

## Source rows

| Question | URL | Full text read on raw page | Terms line on page | Date shown (page metadata) | Status |
| - | - | - | - | - | - |
| Bitly | https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly | Yes, whole page via curl (Mozilla UA), HTML converted to text | "© 2026 Optick Labs Inc. All rights reserved." footer, with a link to "Terms and Conditions"; page also carries a premium upsell (nothing visible was cut off) | published 2024-07-25, modified 2026-02-14 (visible "Updated" label was blank) | Confirmed reference source 1 of 2 needed |
| Ticketmaster | https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster | Fetched (HTTP 200), not read | same footer | published 2024-07-26, modified 2026-02-15 | not researched |
| Uber | .../problem-breakdowns/uber | Fetched, not read | same footer | published 2024-07-18, modified 2026-02-15 | not researched |
| WhatsApp | .../problem-breakdowns/whatsapp | Fetched, not read | same footer | published 2024-07-17, modified 2026-02-16 | not researched |
| Delivery framework | .../in-a-hurry/delivery | Fetched, only grepped, not read | same footer | published and modified 2024-07-07 | not researched |
| Introduction | .../in-a-hurry/introduction | Fetched, not read | same footer | 2024-02-05 | not researched |
| Dropbox, Local Delivery Service, FB News Feed, Tinder, LeetCode | not fetched | no | no | no | not researched |

## Bitly: claims confirmed on the raw page (own words, no figures taken)

- Scope: the page picks a few core features (shorten a link, optional custom alias, optional expiry, redirect) and names account management and click analytics as out of scope, calling them extras that add complexity.
- Non-functional: uniqueness of codes, fast redirect, high availability favoured over consistency, and scale. It stresses a very read-heavy workload as the driver of the design.
- Entities as a short list first, columns later. API maps one endpoint per functional requirement (create with POST, redirect with GET).
- Redirect type: a temporary redirect is preferred over a permanent one because browsers do not cache it, so the service keeps control over expiry and changes.
- Code generation compared: using a URL prefix (breaks uniqueness), hashing plus base62 encoding (collisions, needs a unique constraint and retries), a shared atomic counter encoded in base62 (no collisions, but needs coordination and gives guessable codes).
- Fast redirects: index on the code, then an in-memory cache, then CDN or edge redirects; each with a stated cost (invalidation, warm-up, complexity, price).
- Scaling: most databases would do because writes are rare; replication and backups for availability; split read and write services; batch counter ranges per write instance; disjoint counter ranges per region.
- Page ends with expectations for mid-level, senior and staff candidates.

Not usable from this page: any digit or number word (its numbers are teaching assumptions).

## Gaps

- Only one of the two independent teaching sources needed for Bitly is confirmed. Another open source (for example system-design-primer, CC BY 4.0, or ByteByteGo free pages) is not researched.
- The teaching-pattern spec (`docs/drafts/design-teaching-pattern.md`) was not written; Ticketmaster, Uber, WhatsApp, delivery and level pages were not read.
- Alex Xu step-by-step style: not researched.
