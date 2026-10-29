# Copy pass, 29 Oct 2026

Reviewed titles, descriptions, headings, tour text, empty states and button labels across home, topic, learn, capstone, list and text pages, 404, footer and nav. Most wording already met the rules and was left alone.

| Page | Old | New | Why |
| - | - | - | - |
| /posts lead | Each row opens the section of our topic page that explains it; the original is linked beside it. Great reads are kept apart. | Each row opens the topic section that explains the post, with the original linked beside it. For posts that fit no single topic, see Great reads. | Shorter, says why reads differ |
| /reads lead | chose because others adopted what they introduced, or because they are simply excellent | picked because other teams adopted their ideas, or because they are unusually well written | Plainer, more specific claim |
| /reads meta description | chosen because others adopted what they introduced, or ... simply excellent | chosen because other teams adopted their ideas, or ... unusually well written | Matches page lead |
| 404 | There is no page at this address. | This address leads nowhere, perhaps because the page moved or the link has a typo. | Gives likely reasons |
| /posts empty state | No posts match "x". | No posts match "x". Clear the filter to see every post. | Tells next step |

## Round two (29 Oct 2026)

Read every page type as rendered HTML from the dev server (home, topic, learn, capstones, one capstone, posts, reads, glossary, background, data, about, terms, privacy, 404) plus tour steps. Most headings and leads already read well and were left alone. Hand-written content JSON was not touched.

| Page | Old | New |
| - | - | - |
| Home (link under the start button) | Why I made this | Why I made it (matches the About heading) |
| 404 meta description | (the home page description) | This page does not exist. Go back to the sys101 map to pick a topic. |
| Privacy, No accounts | We don't ask for your name ... our analytics tool | I don't ask for your name ... the site's analytics tool (Terms already speaks as "I") |
| Privacy, progress | It is never sent to us. | It is never sent anywhere. |
| Privacy, server logs | We don't use them | I don't use them |
| Privacy, page views | We use Vercel Web Analytics | The site uses Vercel Web Analytics |
| Privacy, links | The posts we link to | The posts linked here |
| Reads lead | They are not tied to one topic and are not the sources the topics are built on (those are under Blogs). | They fit no single topic, and they are separate from the posts the topics are built on (see Blogs). |
| Background lead | The posts on each topic assume a few things the topic itself does not teach. They are listed here, each with the sentence that assumes it. A concept marked Taught later comes up in a later topic | Each topic's posts take a few ideas for granted that the topic does not teach. Every idea is listed here with the sentence that assumes it. A concept marked Taught later has its own topic further along |
| Map and Path legend | not started | unread (same word as About and the tour) |
| Capstone card and page, before JS | 6 topics needed | Builds on 6 topics |
| Capstone h2 and its link | What you need | Topics it builds on |
| About h2 | How it works | How the map works |
| About h2 | About the write-ups | How the write-ups are made |
| About h2 | Questions | Common questions |
| Your data, empty state | Nothing has been saved in this browser yet. | Nothing saved in this browser yet. Mark a section done and it will show here. |
| Tour step (home) | Look around | Find your way around |
| Tour step (home) | Put it together | Whole systems |
| Tour step (topic) | Two halves | Idea first, then the real world |
| Tour step (topic) | The posts | Posts in plain words |

Anchors and tour targets are unchanged. `.claude/rules/capstones.md` and `graph.md` and `lib/background.test.ts` were updated to match.
