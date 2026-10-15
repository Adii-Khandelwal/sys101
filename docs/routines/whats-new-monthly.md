# Monthly run: What's new for the last month

The same routine as `docs/routines/whats-new.md`, run once a month so that `/new` has a month to show. Nothing new is allowed: the same two paths, the same allowlist, the same checks, the same pull request guard. Only the schedule and how topics are picked change.

## Schedule

Monthly, for example the 2nd at 07:00 UTC, in the routine from `docs/routines/README.md` (section 5): a monthly trigger instead of the weekly one. Run it by hand first and read the pull request, as for the weekly one. There is no backend and no new workflow; the routine is the only thing that looks at the internet.

## Prompt

Paste the whole prompt from `docs/routines/whats-new.md`, then add this block at the end of it. Where the two disagree, this block wins.

---

## This run is the monthly one

- Before step 1, run `node scripts/news-month.mjs` (offline, writes nothing). It prints, for last month, every topic that has an allowlist with its sites, what is already listed and how many of its 3 places are free. It is a brief, not a source: the pages you open are still the only evidence.
- In step 1, take the 6 topics at the top of that list (the oldest `lastChecked`) instead of 3. Look for pages whose date falls in last month, or is newer than the topic's `asOf`. All other steps, limits and rules are unchanged: at most 3 items per topic, drop the oldest when more qualify, remove items older than 12 months, update `lastChecked` and `asOf` for every topic you looked at.
- `addedOn` is the run date, which puts each item in the month it was added on the `/new` page. A quiet month is fine: leave a topic at zero or unchanged and say so in the pull request body. Never fill a month with a weak page.
- Papers are not in scope yet: only the four kinds in the data (`release`, `engineering-post`, `standard`, `docs`) and only the allowlisted sites.

---

## After the pull request

1. Read the table as for the weekly run: the checks do not prove a summary says what the page says.
2. After the merge, open `/new` on the live site and check that the month shows the items and that a quiet topic is not listed.
3. With 18 topics and 6 per run, every topic is looked at every 3 months. To cover all of them each month, run the routine more than once in the month; the helper always starts from the topic checked longest ago.
