---
paths:
  - "content/background/**"
  - "app/background/**"
  - "lib/background*.ts"
  - "scripts/verify-background.mjs"
  - "components/HighlightTarget.tsx"
---

# Background page

Applies when editing /background or its data.

## Specification

- One page, `/background`: what the curated posts of each topic assume the reader already knows, beyond the topic itself. One section per topic that has a file, `id` = topic slug (`/background#caching`). Static HTML; the only client code is `HighlightTarget`, which highlights the section the URL fragment points at.
- Data: `content/background/<topic-slug>.json` is `{ topic, updatedOn, items }`. An item has `id`, `name`, `explanation`, `assumedBy` (one `{ postId, quote }` per post, the quote copied from that post's page), `topicPage?` (our own page for the concept) and `sources?` (`{ title, publisher, url, year, verifiedOn }`).
- A concept taught on one of our later topic pages is labelled "Taught later" and gets a one-line gist of its own (at most 32 words); the page legend already says the gist is enough, so the line does not repeat it. It takes no source. The page does not say where it is taught and does not link to our topic page: `topicPage` stays in the data only so the order (`topicOrder`, never hardcoded) can decide "later". A concept with no topic page, or whose topic page comes earlier (atomic transactions), needs at least one official source with publisher and year, and shows just that.
- Source years follow the learn-page rule: a four-digit year, "no date shown", or "page shows last updated YYYY-MM-DD", only if the page shows it. The page shows the publisher and the year, and nothing for "no date shown". `verifiedOn` stays in the data; the page carries one "Page last updated" line (the newest `updatedOn`).
- Checks: `validateBackground` in lib/background.ts runs at load, so a bad file fails the build. lib/background.test.ts checks post ids, links, anchors, sections, the "Taught later" labels, the sitemap entry and the topic-page link. `npm run verify:background` (network, not in the build) confirms each quote is in the post's page text and each source answers.
- The topic page shows "Before you read these posts: Background for this topic" at the top of the posts section, directly above the first post, only when its topic has a file (`backgroundHref`).
- A background item may add an optional `diagram` (shown under its explanation), only where the concept is a shape or a process; it must follow the topic-page diagram rules.
- Highlight: an overlay's opacity fades over `--dur-slow` after `DURATION.pulse`; under `prefers-reduced-motion` it appears and disappears instantly. Without JavaScript the page still scrolls to the section.
- Not in the footer. The way in is the topic page link and the sitemap.
- /background has the same scroll-only side rail as learn pages (LearnRail, `scope="section"`): one entry per topic, and its bar restarts at 0% when the next topic section begins. No progress store.
- Every topic has a file. Per topic: concepts the topic's own page teaches are left out; each quote comes from the raw post text; each sourced concept names an official page that was opened.
