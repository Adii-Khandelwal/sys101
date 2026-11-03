# Report: "How an interview goes" draft (31 Oct 2026)

Claim ids are section id plus position (stages-1 is the first claim in stages). Row ids are from docs/drafts/interview-process-sources.md.

| Claim | Row | R2 wording used |
| - | - | - |
| stages-1 | A1 | "four 55-minute interviews where you'll meet with members of our software development community" |
| stages-2 | A2 | "Expect at least one question on software systems design." |
| stages-3 | A5 | "90 minutes to complete two technical questions followed by 20 minutes of Systems Design scenarios" |
| stages-4 | A6 | "five 55-minute interviews" |
| stages-5 | A7 | "technical phone screening will be with a senior leader ... 60 minutes" |
| stages-6 | M11 | "a recruiter conversation, initial screening and a full loop interview" |
| stages-7 | M10 | "usually takes about 2 to 3 months" |
| stages-8 | M13 | "45-minute conversation with an engineer" |
| stages-9 | AT6 | "Two coding interviews", "One system design interview", "One management interview"; values interview from the timings text "Values (45 min)" |
| stages-10 | AT6 | "System Design (60 min) Management (60 min) Values (45 min)" |
| stages-11 | FK1 | "ROUND 2.3: DESIGN (60 MINUTES) ... discussing and solving a non-trivial design problem" (length is in length-3) |
| length-1 | M1 | "The design interview is 45 minutes long. These almost never involve coding." |
| length-2 | AT1 | "The system design portion of the interview is 60 minutes." |
| length-3 | FK1 | "DESIGN (60 MINUTES)" |
| length-4 | FK9 | "HIGH-LEVEL DESIGN/ARCHITECTURE (60 MINUTES) You will be given 1 or 2 scenarios ..." |
| length-5 | MS1 | "the short 45-minute interview round" (R2: not specific to design) |
| length-6 | A1 | "four 55-minute interviews" (SDE II; R2: not design alone) |
| length-7 | A6 | "five 55-minute interviews" (SDE III; R2: not design alone) |
| looks-for-1 | M2 | "assess the candidate's ability to solve a non-trivial engineering design problem" |
| looks-for-2 | M5 | "A good solution compares and contrasts different approaches." |
| looks-for-3 | M6 | "anticipate and work around typical problems is part of that signal" |
| looks-for-4 | A4 | Objectives list (list items, not a sentence) |
| looks-for-5 | A9 | "apply what you know to solve problems efficiently and effectively" |
| looks-for-6 | MS3 | "Knowledge of distributed systems, SOA, and n-tiered software architecture is very important ..." |
| looks-for-7 | MS4 | "Resiliency, high availability, auto-scaling, replication, CAP theory, partitioning, all may be included." |
| looks-for-8 | MS5 | "understand what it takes to build or design a new system or platform from scratch" |
| looks-for-9 | AT2 | "problem-solving thought process, decision making and operational considerations" |
| looks-for-10 | AT5 | "Keep the customer in mind and how your solution might perform and scale." |
| looks-for-11 | FK2, FK6 | "scalable system with the trade-offs required"; "different types of data stores and when to choose one over the other" |
| looks-for-12 | FK7 (labelled general interview tips) | "We don't necessarily look for absolute solutions. Instead, we'd like to know how you approach a problem." (quoted in part) |
| looks-for-13 | FK11 | "Tech stack selection", "Scalability of the solution Choosing between consistency, availability and partition tolerance" |
| start-1 | M4 | "Start with requirements." plus the messaging example and its question list |
| start-2 | MS2 | "Ask clarifying questions for any ambiguities and come up with a plan ..." |
| start-3 | MS6 | "start by asking clarifying questions and stating your assumptions. Talk us through your approach ..." |
| start-4 | AT3 | "starting with fundamentals and then building in complexity. Ask any clarifying questions upfront" |
| start-5 | FK4 | "The problem will be very generic and so start with gathering all the specific requirements from the interviewer." |
| driven-1 | A3 | "Your interviewer will ask questions related to your design, and you should ask questions to complete and validate your design." (exact scope kept) |
| driven-2 | M3 | "your interviewer will ask you a very broad design problem and evaluate your solution." |
| driven-3 | M7 | "Make it a conversation ... drive towards a good solution." |
| driven-4 | M8 | "There's not enough time to discuss every detail ... find the interesting and hard problems" |
| driven-5 | AT4 | "continue to communicate with your interviewer as you progress towards a solution." |
| driven-6 | FK3 | "interviewer and the interviewee discussing the trade-offs and requirements and coming up with a solution" |
| driven-7 | FK5 | "discussing different approaches at different stages and zeroing in on one" (FK8 "thinking out loud" dropped: general tips, not the design round) |
| driven-8 | FK10 | "be vocal about multiple acceptable solutions ... why you rejected other solutions" |
| tooling-1 | M12 | "Design interviews will be conducted in CoderPad with Mermaid Markdown with the same AI assistant ..." |
| tooling-2 | A8 | "coding and system design white boarding exercises" |

## Counts per company (claims)
Meta 12, Amazon 11, Flipkart 10, Atlassian 7, Microsoft 6. Total 46 claims. One quote, from fk-sde (looks-for-12).

## Not used, with reason
- M9 (think out loud): R2 says it is stated under coding; it is not used for design.
- Flipkart 60-minute phone screen and the Atlassian "values" interview detail beyond AT6: R2's "what the pages say" line mentions a phone screen but has no confirmed row.
- Amazon video, "Question tips" panels, Meta full loop and tech screen PDFs: R2 dropped them.
- Flipkart two-kinds-of-design-round sentence: R2 dropped it (extract incomplete).

## Gaps carried
- Google, Uber, Netflix, Rubrik, Apple, Stripe, Shopify are in noGuidance with R2's reasons.
- No official page says interviewers change constraints; none is claimed. Closest wording is A3 and FK5, kept at their exact scope.
- Most dates are "no date shown"; the edition field records only file metadata where R2 saw it, flagged as not a published date. Only Meta's blog shows a date (6 Oct 2022).
- Microsoft's and Amazon's lengths are for the interview round or each loop interview, stated as such.
- Terms lines are copied from R2 per source in the JSON.
