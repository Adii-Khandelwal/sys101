# Homepage specification

Moved unchanged from CLAUDE.md. Read before editing the homepage.

- Order: masthead (wordmark, intro line, progress line, search), the map or Path view with the "All topics" index, Inside a topic (DNS), Try a question, Where the posts come from. Thin dividers, no cards, icons, or images. The top edge of the map stays visible without scrolling at 1440x800 and 390x844.
- Every homepage number, name, date, and excerpt is computed from data at build time (topics, quiz, posts). Never hardcode them; lib/homepage.test.ts scans the source.
- Under the intro: with nothing read, nothing (the map is the way in); once anything is read, "Next up", "Also ready", and the "x of N topics read" count (lib/nextUp.ts startVariant).
- Inside a topic: the real section names in order (lib/lessonOutline.ts, checked against TopicLesson.tsx) with real counts, generic wording (no topic name, no "Open" link), and a figure of the day: one digest figure from FEATURED_FIGURES, each with company, year, and its post linked. All are in the static HTML; the first shows without JavaScript and the reader's local date picks one after load. Each must exist in its digest (the build fails otherwise).
- Try a question: the DNS lesson quiz questions in order, looping. After an answer the result stays 5 seconds (paused while the pointer or focus is inside, and "Next question" skips it), then the next question fades in (opacity and transform only). Component state only; never reads or writes the progress store.
- Where the posts come from: companies alphabetical with post counts, plain text.
- "/" focuses search (not while typing or with Ctrl, Cmd, Alt); Escape clears and blurs. Footer "Report a mistake" mails REPORT_EMAIL in lib/site.ts.
