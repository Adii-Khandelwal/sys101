# Learn page specification

Moved unchanged from CLAUDE.md. Read before editing learn pages or their content.

- Every topic, current and future, has a second page at /topic/<slug>/learn, titled "Start from zero: <Topic>", teaching it from 0 to 100 for a complete beginner. Not counted in "topic read"; never touches the progress store.
- Structure: promise line ("After this you can follow the topic page and the posts"); Before you start (link prerequisite topics plus the few terms needed); 4 stages (Basics, How it works, Going deeper, In practice and trade-offs), each with an explanation in our own words, key terms, official reading (a specific section and what to read in it), an optional original SVG diagram in the site style (same build rules as topic diagrams; usually on How it works), an optional video, and an untracked "You can now" list; then Common misconceptions, Try it (commands only if confirmed in an official source, shown as scrollable pre blocks), Where to go next (back to the topic page and its posts), and Sources.
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
