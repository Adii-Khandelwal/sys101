---
paths:
  - "content/learn/**"
  - "lib/learn.ts"
  - "lib/learn.test.ts"
  - "components/Learn*.tsx"
  - "components/VideoEmbed.tsx"
  - "app/topic/**/learn/**"
---

# Learn pages (start from zero)

Applies when editing /topic/<slug>/learn or content/learn.

## Standing rules

- Every topic has a second page at /topic/<slug>/learn, titled "Start from zero: <Topic>", for a complete beginner. Not counted in "topic read"; never touches the progress store. A new topic is not done until its learn page exists.
- Content lives in content/learn/<slug>.json, typed in lib. Pagefind indexes it with a "Start from zero" label.
- Official sources only. Any number, default, limit, or command must be confirmed in an opened source; cite the page that says it. A source year is a four-digit year, "no date shown", or "page shows last updated YYYY-MM-DD", only if the page shows it (build check).
- Try it commands appear on the cited page, with no "> " or "$ " prompt; risky ones carry a visible `warning`; invented names go in `exampleNames` (build checks).
- Get approval for candidate sources and videos before saving.

## Specification

- Every topic, current and future, has a second page at /topic/<slug>/learn, titled "Start from zero: <Topic>", teaching it from 0 to 100 for a complete beginner. Not counted in "topic read"; never touches the progress store.
- Structure: promise line ("After this you can follow the topic page and the posts"); Before you start (link prerequisite topics plus the few terms needed); 4 stages (Basics, How it works, Going deeper, In practice and trade-offs), each with an explanation in our own words, key terms, official reading (a specific section and what to read in it), an optional original SVG diagram in the site style (same build rules as topic diagrams; on any stage, ideally one per stage), an optional video, and an untracked "You can now" list; then Common misconceptions, Try it (commands only if confirmed in an official source, shown as scrollable pre blocks), Where to go next (back to the topic page and its posts), and Sources.
- Content lives in content/learn/<slug>.json, typed in lib. Pagefind indexes it with a "Start from zero" label.
- A new topic is not done until its learn page exists.

## Official sources (learn pages)

- Learn pages use only official sources: standards and specs (IETF, W3C, ISO), a project's or vendor's own documentation, a university's own course pages; for video, the official channel of one of those, or a recognized conference or university.
- Open every source before use. Record publisher, kind, year, and verifiedOn. Never invent a URL, video, or quote. Never copy docs text: paraphrase and link.
- Any specific number, default, limit, or command must be confirmed in an opened official source and cite its source id. If not confirmed, state it generally or leave it out.
- Claude cannot watch videos. Show each candidate video (title, channel, year, length, why it fits) and get approval before saving. Label every video with channel, length, and year. The facade label says "optional", adds "long" at 20 minutes or more, and shows an optional `tag` such as "company talk, advanced"; it also says it is not reviewed by the author.
- Show candidate sources in a table and wait for approval before writing, as with posts.
- Learn text may link to our own pages as `[text](/path)`. An Internet-Draft source must say in its note that it is a work in progress, not a standard, with its version and expiry; the build fails otherwise.
- Build fails on: an empty stage, a stage with no official source, an unknown source id, a missing publisher, kind, year or verifiedOn, or a video without channel, length or year. The weekly link check covers these URLs too.


## Checks added in the October 2026 review

- Every Try it command must appear in the cited page or a page it links to. Commands never start with a prompt character. A command that changes or interrupts something real (matched by RISKY_COMMAND in lib/learn.ts) needs a `warning` saying what it does and to run it only on a test system. Names we made up are listed in `exampleNames` and shown as "example names, not from the docs". Example files a command reads (our own adaptation of a cited page) go in the optional `tryIt.files` (`name`, `content`), shown before the commands as scrollable code labelled "our adaptation, not from the docs"; never paste file contents into the intro text.
- A source `year` is a four-digit year, "no date shown", or "page shows last updated YYYY-MM-DD" (VALID_SOURCE_YEAR), recorded only when the page shows it. Microsoft Learn pages render their date with script, so read them in a browser.
