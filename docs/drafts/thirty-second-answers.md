# Say it in 30 seconds: three samples

Draft for the owner to judge the format. Every claim comes from the topic's own JSON; the only figures are copied from digest.numbers and name the company and the year of the post header. Nothing here is built into the site.

## Caching (content/topics/caching.json)

> A cache keeps a copy of hot data in memory beside the servers, so most reads skip the database. A read checks the cache; on a miss, the server reads the database and fills it. Writes go to the database and invalidate the old entry, with a TTL as backstop. The cost is stale data: a slow fill can land after a newer invalidation, so I store a version with each entry. Uber's 2024 post says Docstore, which serves over 40 million reads per second, uses an integrated cache.

- Source: sentence 1 lesson.why.body and lesson.mentalModel.body; sentence 2 lesson.howItWorks.steps[0] and [1]; sentence 3 steps[2], [3], [4]; sentence 4 lesson.howItWorks.steps[5] and mistakes[0]; sentence 5 posts[1] (Uber, published 2024-02-15) title, digest.numbers[0] (over 40 million per second, reads across all Docstore instances) and digest.tradeoffs.chosen (one cache built into the database's query layer)
- Word count: 89
- Spoken time: about 36 seconds at 150 words per minute (89/150 min)

## Consistent hashing (content/topics/consistent-hashing.json)

> Hash-mod-N breaks a cache cluster when N changes, because almost every key moves, nearly every read misses at once, and the database takes the full load. Consistent hashing puts servers and keys on a ring, and a key belongs to the next server clockwise, so adding a server moves only about one N-th of the keys. One point per server is uneven, so each server gets many points, which costs memory. Cloudflare's 2026 post cut points per server by 90% and reclaimed over 100TB of RAM.

- Source: sentence 1 lesson.why.body and mistakes[0]; sentence 2 lesson.mentalModel.body and lesson.howItWorks.steps[2] (one N-th of the keys); sentence 3 lesson.mentalModel.body (virtual nodes) and mistakes[2] (memory grows); sentence 4 posts[0] (Cloudflare, published 2026-09-18) digest.numbers[5] (90% fewer points per server) and digest.numbers[7] (over 100TB of RAM)
- Word count: 86
- Spoken time: about 34 seconds at 150 words per minute (86/150 min)

## Rate limiting (content/topics/rate-limiting.json)

> A rate limiter caps each client at so many requests in a period, so one runaway caller cannot use up shared capacity. I count per key, such as an API key, and reject requests over the limit, often with a 429. The hard part is that one key's requests reach many machines, so the count must be shared, and an exact shared count slows every request. I would accept a small overshoot to keep the check cheap. Cloudflare's 2017 post keeps two numbers per key, one increment per request.

- Source: sentence 1 lesson.why.body; sentence 2 lesson.howItWorks.steps[0] and [2] (HTTP 429); sentence 3 lesson.why.body (many machines) and lesson.howItWorks.steps[4] and [5]; sentence 4 lesson.howItWorks.steps[5] (accept some error) and posts[0].digest.tradeoffs.why (the estimate is cheap); sentence 5 posts[0] (Cloudflare, published 2017-06-07) digest.numbers[7] (2 numbers, 1 increment) and digest.tradeoffs.chosen (increments off the request path)
- Word count: 89
- Spoken time: about 36 seconds at 150 words per minute (89/150 min)

## Open questions for the owner

1. Where should the box sit: directly under the In short line at the top of the page, or at the end of the lesson as a recap before the quiz?
2. Should it count as a tracked unit (marked read) or stay untracked, so progress numbers do not change?
3. Add a build check that every digit in the box must appear in the topic JSON, and that any figure sits beside a company name and year? Words like "one N-th" and "a 429" would need the digits to appear in the JSON too, which they do here.
4. Effort for 35 topics: roughly one worker-strong pass plus a reviewer per batch of 5 to 6 topics, or hand-write them as each topic is next edited?
