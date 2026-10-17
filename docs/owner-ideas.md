# Owner's ideas (the log)

Moved out of CLAUDE.md to keep it short. Every idea or preference the owner states is written here as one line and in full in the matching rule file, so none is lost. Newest last.

- Great reads (`/reads`, `reads.md`): a curated list of influential or excellent posts and papers, chosen by the owner, kept apart from the topic sources; each row says post or paper; the title is the link; no read-state in v1, later a small "Read" toggle (`progress-tracking.md`).
- Filters on /reads: All/Posts/Papers, a Topic row under its own "Topic" heading, a text filter. The count line shows only while filtering.
- Every search or filter box has the homepage search's behaviour: "/" focus, Escape, Enter to the first result, word-start matching ("uber" must not find "Kubernetes") (`accessibility-and-chrome.md`).
- Links are not underlined unless inside a running sentence; hover turns them a colour (rust, ink in side lists), on every list of links (`accessibility-and-chrome.md`). No blue tap flash on a phone.
- The homepage "Companies we learn from" list links each company to `/posts#<company>` and shows no counts (`homepage.md`).
- The top bar: only the homepage "sys101" flies letter by letter. Elsewhere the page name fades in, then a thin rule and the current section name, lighter, replaced by each new section heading going down and back up; no rule before the page name; at the very end of a page only the last section shows (`motion.md`, lib/headerFade.ts).
- The top bar shows no section names on About, Terms, Privacy and Your data.
- Links to a section glide down to it (same page), or open the other page at its top and then glide down (`motion.md`, lib/glide.ts).
- Start button text must stay visible on hover.
- The homepage sources section is a static, wrapped row of dimmed marks and names titled "Companies we learn from" (no marquee, no exception to the banned list); its note says etcd is a project, not a company (`homepage.md`).
- Homepage copy is short and made to make a visitor want to explore: no numbers in the intro, no "linked and dated" reassurance (`homepage.md`).
- No post counts beside company, topic or year headings on /posts; the totals line sits at the bottom, and only the filter count shows at the top while filtering (`homepage.md`).
- The content pages (Glossary, Blogs, Great reads, What's new; "Blogs" is the label for the /posts page, which also holds a few papers and docs) live in the header bar as a nav, a Menu button on narrow screens, because nobody scrolls to the footer to find them (`accessibility-and-chrome.md`).
- The site's own logo mark sits beside the big homepage wordmark and at the start of the footer (`homepage.md`, `accessibility-and-chrome.md`). (`homepage.md`).
- What's new (`/new`, `news.md`): a monthly page over every topic's news items, grouped by the month they were added, with a monthly routine run that sources them from the allowlisted sites only (`docs/routines/whats-new-monthly.md`).
- Offline: after one online visit the whole site works with no connection, external links aside (`offline.md`).
- Opening screen: on every load of the homepage only, one node of the mark comes on, two come out of it, and the name "sys101" comes on like a bulb (on, dim, off, on), then the site; a slow link to another page shows the mark breathing (`motion.md`).
- Opening screen: when the loader has fully drawn the logo, the mark and "sys101" move into the homepage masthead's own mark and name (`motion.md`).
- What's new page (`/new`): hidden for now, code kept (app/_new, commented nav item, sitemap entry and test lines) so it can come back; the per-topic What's new sections stay (`news.md`).
- Phone view: no "Mark group read" button in the Path view (still on laptop widths) (`progress-tracking.md`).
- Future plan: research all sensible next topics with their tech blogs, record them in CLAUDE.md ("Future plan", detail in `docs/roadmap.md`), aiming at a ready-to-announce version of the site (batches 1 and 2 plus the chat capstone).
- Pull requests: after every push, create the PR with `gh pr create` and give the link; never leave the compare page for the owner to fill in (`CLAUDE.md` "Git and releases").
- Roadmap revision: merge consistency models into time and clocks, fold CDC into log-based streaming, no separate search node (add a post to Indexing and Search), each source in one place only; accept papers by teams that ran the system, MongoDB Atlas and the CrowdStrike RCA, not Confluent or Debezium (`docs/roadmap.md`, CLAUDE.md "Future plan").
- Glossary terms in lesson text: the first use of each of a topic's own terms per section is a dotted-underline term that opens a definition popover with a link to /glossary (`topic-pages.md`); the /glossary contents rail scrolls inside the viewport when it is long.
- Capstone page type: interactive and learning-heavy, combining finished topics (design it first, sizing calculator, clickable system diagram, break it, compare, quiz), with readiness from topic progress (`.claude/rules/capstones.md`).
