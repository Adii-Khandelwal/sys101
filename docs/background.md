# Background hub

Read before editing content/background or app/background.

- One page, `/background`: what the curated posts of each topic assume the reader already knows, beyond the topic itself. One section per topic that has a file, `id` = topic slug (`/background#caching`). Static HTML; the only client code is `HighlightTarget`, which highlights the section the URL fragment points at.
- Data: `content/background/<topic-slug>.json` is `{ topic, updatedOn, items }`. An item has `id`, `name`, `explanation`, `assumedBy` (one `{ postId, quote }` per post, the quote copied from that post's page), `topicPage?` (our own page for the concept) and `sources?` (`{ title, publisher, url, year, verifiedOn }`).
- A concept with a topic page links to it and is never re-explained there. If that page comes later in the course than the topic (compared with `topicOrder`, never hardcoded) it is labelled "Taught later", links forward, takes no source, and its explanation is a one-line gist (at most 32 words) that says "The gist is enough here." A concept with no topic page needs at least one official source with publisher and year. An earlier topic page may also carry a source (atomic transactions: Databases and the PostgreSQL tutorial).
- Source years follow the learn-page rule: a four-digit year, "no date shown", or "page shows last updated YYYY-MM-DD", only if the page shows it.
- Checks: `validateBackground` in lib/background.ts runs at load, so a bad file fails the build. lib/background.test.ts checks post ids, links, anchors, sections, the "Taught later" labels, the sitemap entry and the topic-page link. `npm run verify:background` (network, not in the build) confirms each quote is in the post's page text and each source answers.
- The topic page shows "Before you read these posts: Background for this topic" at the top of the posts section, directly above the first post, only when its topic has a file (`backgroundHref`).
- Highlight: an overlay's opacity fades over `--dur-slow` after `DURATION.pulse`; under `prefers-reduced-motion` it appears and disappears instantly. Without JavaScript the page still scrolls to the section.
- Not in the footer. The way in is the topic page link and the sitemap.
