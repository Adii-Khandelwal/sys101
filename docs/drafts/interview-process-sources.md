# Interview process sources (official, first-party only)

Checked 31 Oct 2026. Each quote was matched against the raw page or PDF fetched with curl (browser-like headers; no model-written readings). "No date shown" means the page itself shows none; where the file carries a date in its own metadata that is noted, but it is not a published date. Quotes are at most 25 words, copied from the raw text (PDF hyphenation at line breaks joined). Figures such as minutes are the company's own.

Terms column: the page's own copyright or terms line. "none in raw page" means the fetched HTML or PDF contains no such line (footers are drawn by JavaScript or are absent).

## Confirmed

| # | Company | URL | Date | Terms | Exact wording | Covers |
| - | - | - | - | - | - | - |
| A1 | Amazon | https://amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep | no date shown | (c) 1996-2026 Amazon.com, Inc. or its affiliates; "Conditions of use" link | "Your loop will include four 55-minute interviews where you'll meet with members of our software development community." | stages, length (SDE II loop) |
| A2 | Amazon | same as A1 | no date shown | same | "Expect at least one question on software systems design." | stages (design is in the loop) |
| A3 | Amazon | same as A1 | no date shown | same | "Your interviewer will ask questions related to your design, and you should ask questions to complete and validate your design." | follow-up questions, communicating |
| A4 | Amazon | same as A1 | no date shown | same | List headed "Objectives": Practicality, Accuracy, Efficiency, Reliability, Optimization, Scalability (list items, not a sentence) | what is evaluated |
| A5 | Amazon | same as A1 | no date shown | same | "90 minutes to complete two technical questions followed by 20 minutes of Systems Design scenarios" | stages (online assessment) |
| A6 | Amazon | https://amazon.jobs/content/en/how-we-hire/sde-iii-interview-prep | no date shown | same | "Your loop will include five 55-minute interviews where you'll meet with members of our software development community." | stages, length (SDE III loop) |
| A7 | Amazon | same as A6 | no date shown | same | "Your technical phone screening will be with a senior leader on our team. It will last 60 minutes." | stages (SDE III phone screen) |
| A8 | Amazon | https://amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics | no date shown | same | "Most technical interviews require you to perform coding and system design white boarding exercises." | format |
| A9 | Amazon | same as A8 | no date shown | same | "They'll be looking for your ability to apply what you know to solve problems efficiently and effectively." | what is evaluated (not memorising) |
| M1 | Meta | https://www.metacareers.com/blog/preparing-for-your-software-engineering-interview-at-meta/ | Oct 06 2022 (page: "updated for 2022"; first published 27 Jun 2016) | none in raw page | "The design interview is 45 minutes long. These almost never involve coding." | length, format |
| M2 | Meta | same as M1 | Oct 06 2022 | none in raw page | "The purpose of the interview is to assess the candidate's ability to solve a non-trivial engineering design problem." | what is evaluated |
| M3 | Meta | same as M1 | Oct 06 2022 | none in raw page | "your interviewer will ask you a very broad design problem and evaluate your solution." | format (open-ended prompt) |
| M4 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Start with requirements." Example given: "How would you architect the backend for a messaging system?" then asks how many people, messages, latency, storage, push or pull | communicating, scoping |
| M5 | Meta | same as M1 | Oct 06 2022 | none in raw page | "A good solution compares and contrasts different approaches." | what is evaluated (trade-offs) |
| M6 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Your ability to anticipate and work around typical problems is part of that signal." | what is evaluated (anticipating failure) |
| M7 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Make it a conversation: Be sure to ask clarifying questions. But make sure you drive towards a good solution." | communicating |
| M8 | Meta | same as M1 | Oct 06 2022 | none in raw page | "There's not enough time to discuss every detail of the design, find the interesting and hard problems to focus the discussion on." | scoping |
| M9 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Think out loud." (given under coding; also "Thinking out loud gives the interviewer insight into your thinking process") | communicating (stated for coding) |
| M10 | Meta | https://www.metacareers.com/hiring-process/ | no date shown | none in raw page | "The typical interview process usually takes about 2 to 3 months." | stages, timeline |
| M11 | Meta | same as M10 | no date shown | none in raw page | "The process typically consists of a recruiter conversation, initial screening and a full loop interview." | stages |
| M12 | Meta | same as M10 | no date shown | none in raw page | "Design interviews will be conducted in CoderPad with Mermaid Markdown with the same AI assistant available in the coding interview." | format (current tooling) |
| M13 | Meta | https://www.metacareers.com/swe-prep-techscreen/ | no date shown | none in raw page | "The initial tech screen is a 45-minute conversation with an engineer" | stages (screen) |
| MS1 | Microsoft | https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing | no date shown (page metadata modifyDate 2026-09-10) | none in raw page | "Managing your time is important, given the short 45-minute interview round." | length |
| MS2 | Microsoft | same as MS1 | no date shown | none in raw page | "Ask clarifying questions for any ambiguities and come up with a plan before you implement a solution." | communicating, scoping |
| MS3 | Microsoft | same as MS1 | no date shown | none in raw page | "Knowledge of distributed systems, SOA, and n-tiered software architecture is very important in answering system design questions." | what is evaluated |
| MS4 | Microsoft | same as MS1 | no date shown | none in raw page | "Resiliency, high availability, auto-scaling, replication, CAP theory, partitioning, all may be included." | what is evaluated (topics) |
| MS5 | Microsoft | same as MS1 | no date shown | none in raw page | "understand what it takes to build or design a new system or platform from scratch." | what is evaluated |
| MS6 | Microsoft | https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips.html | no date shown (page metadata modifyDate 2026-09-10) | none in raw page | "start by asking clarifying questions and stating your assumptions. Talk us through your approach, including the tools you would use and why." | communicating |
| AT1 | Atlassian | https://wac-cdn.atlassian.com/dam/jcr:705fb1c3-fa29-4b1d-bcac-7ce8806fd0b6/P60%20Backend.pdf?cdnVersion=1203 (Principal Backend guide); same system-design text in jcr:cf9c7fc1-ab28-47d6-bb56-9c01fb09b871/P30-P50-Backend-Interview-Guide.pdf?cdnVersion=1968 | no date shown (PDF metadata created 2023-08-21; the P30-P50 file 2023-12-11) | none in the PDF | "The system design portion of the interview is 60 minutes." | length |
| AT2 | Atlassian | same two PDFs | as above | none in the PDF | "Your interviewer will be looking at your problem-solving thought process, decision making and operational considerations" (the PDF then gives performance and reliability as examples; its bracket characters did not extract cleanly, so they are not quoted) | what is evaluated |
| AT3 | Atlassian | same two PDFs | as above | none in the PDF | "starting with fundamentals and then building in complexity. Ask any clarifying questions upfront" | format, communicating |
| AT4 | Atlassian | same two PDFs | as above | none in the PDF | "continue to communicate with your interviewer as you progress towards a solution." | communicating |
| AT5 | Atlassian | same two PDFs | as above | none in the PDF | "Keep the customer in mind and how your solution might perform and scale." | what is evaluated |
| AT6 | Atlassian | https://wac-cdn.atlassian.com/dam/jcr:cf9c7fc1-ab28-47d6-bb56-9c01fb09b871/P30-P50-Backend-Interview-Guide.pdf?cdnVersion=1968 | PDF metadata created 2023-12-11 | none in the PDF | Stage list: "Two coding interviews", "One system design interview", "One management interview"; timings "System Design (60 min) Management (60 min) Values (45 min)" | stages |
| FK1 | Flipkart | https://www.flipkartcareers.com/assets/flipkart_pdf/SDE.pdf (SDE guide) | no date shown (PDF metadata created 2020-02-06, so about six years old) | none in the PDF | "ROUND 2.3: DESIGN (60 MINUTES) This round involves discussing and solving a non-trivial design problem." | stages, length |
| FK2 | Flipkart | same as FK1 | 2020 (metadata) | none in the PDF | "You are expected to create a scalable system with the trade-offs required to achieve that." | what is evaluated |
| FK3 | Flipkart | same as FK1 | 2020 (metadata) | none in the PDF | "it is more about the interviewer and the interviewee discussing the trade-offs and requirements and coming up with a solution" | format (a discussion, no fixed answer) |
| FK4 | Flipkart | same as FK1 | 2020 (metadata) | none in the PDF | "The problem will be very generic and so start with gathering all the specific requirements from the interviewer." | scoping, communicating |
| FK5 | Flipkart | same as FK1 | 2020 (metadata) | none in the PDF | "the design round is all about discussing different approaches at different stages and zeroing in on one" | communicating, changed direction across stages |
| FK6 | Flipkart | same as FK1 | 2020 (metadata) | none in the PDF | "You are expected to know about different types of data stores and when to choose one over the other." | what is evaluated (topics) |
| FK7 | Flipkart | same as FK1 | 2020 (metadata) | none in the PDF | "We don't necessarily look for absolute solutions. Instead, we'd like to know how you approach a problem." | what is evaluated |
| FK8 | Flipkart | same as FK1 | 2020 (metadata) | none in the PDF | "You can help the interviewers understand your thought process by thinking out loud." | communicating |
| FK9 | Flipkart | https://www.flipkartcareers.com/assets/flipkart_pdf/Architect.pdf (Architect guide) | no date shown (PDF metadata created 2020-02-06, modified 2020-02-20) | none in the PDF | "HIGH-LEVEL DESIGN/ARCHITECTURE (60 MINUTES) You will be given 1 or 2 scenarios for which you'll have to provide a fully detailed architectural solution" | stages, length (senior role) |
| FK10 | Flipkart | same as FK9 | 2020 (metadata) | none in the PDF | "be vocal about multiple acceptable solutions for the problem, and specifically why you rejected other solutions over the one you chose" | communicating, trade-offs |
| FK11 | Flipkart | same as FK9 | 2020 (metadata) | none in the PDF | Evaluation pivots listed: "Tech stack selection" and "Scalability of the solution Choosing between consistency, availability and partition tolerance" | what is evaluated |

Count by company: Amazon 9, Meta 13, Microsoft 6, Atlassian 6, Flipkart 11. Total 45.

## What the pages say on the five questions

- Stages: Amazon (online assessment, then a 4 or 5 round loop of 55 minutes), Meta (recruiter, 45-minute screen, full loop with a design interview), Flipkart (60-minute phone screen, then onsite rounds including design), Atlassian (two coding, one 60-minute system design, management or leadership, values).
- Length of the design round: Meta 45 minutes; Atlassian 60; Flipkart 60; Microsoft only says its interview round is 45 minutes (not specific to design); Amazon states 55 minutes for each loop interview, not design alone.
- What is evaluated: trade-offs, scalability, requirements gathering, operational considerations (Atlassian: performance and reliability), choosing data stores, CAP, distributed-systems basics.
- Follow-up or changed-constraint questions: no page says that interviewers change the constraints mid-round. The closest wording is Amazon A3 (interviewer asks questions about your design) and Flipkart FK5 (discuss approaches at different stages). The site must not claim more than that.
- Communicating: clarify first (Meta, Microsoft, Atlassian, Flipkart, Amazon), keep talking through your reasoning (Atlassian, Microsoft, Flipkart), focus on the hard parts (Meta).

## No official guidance found

- Google: the page https://www.google.com/about/careers/applications/how-we-hire/interview/ returned 200 but its body is drawn by JavaScript (the raw HTML has only navigation and footer), so nothing could be confirmed.
- Uber: uber.com/careers pages and jobs.uber.com returned HTTP 403 or 406 to curl; the only readable Uber page (https://www.uber.com/blog/uber-engineering-technical-interview-process/, 8 Dec 2015) is about the hiring market, not the design round.
- Netflix: the Netflix Tech Blog interview post returned 403 on both netflixtechblog.com and medium.com. The jobs.netflix.com new-grad page was not read.
- Stripe: stripe.com/jobs/interview is 404; no candidate-facing system design page was found, and the Atlas guide for founders was seen only as a search snippet, not opened.
- Apple: no interview-process page found.
- Rubrik: rubrik.com/company/careers returned 403 to curl; nothing found.
- Shopify: https://www.shopify.com/careers/faq opened, gives a 60-75 minute Craft Assessment but never names system design, so it is not used.

## Dropped

- Google interview page (JavaScript only, see above).
- Meta "Full Loop Interview Guide" and "Technical Screen Guide": the careers pages only link to downloads that were not opened.
- Amazon video transcripts and the "Question tips" panels: collapsed or video content, not in the raw HTML.
- Netflix backend interview post (403), Uber careers and jobs.uber.com (403), Rubrik (403), Stripe (404).
- Every third-party result from search (prep sites, forums, Glassdoor, Levels.fyi, blogs): out of scope. Search summaries were used only to find URLs; no claim comes from them.
- Flipkart statement that there are two kinds of design round (System Design and OOD): the PDF text extract dropped some words in that sentence, so it is not quoted. The page https://www.flipkartcareers.com/howwehire confirms a 6-month cooling period, which is not needed here.
