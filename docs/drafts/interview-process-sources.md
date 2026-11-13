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

### Added 13 Nov 2026 (extra facts, each matched in the full raw page or PDF)

The wording column gives a short stretch of the raw text (PDF line-break hyphens joined); the site claim restates it in plain words. The last column is the page section the claim sits in. Ids continue each company's list above. The Meta screen claim about further requirements matches raw wording that uses the word constraints; the site text avoids that word on purpose.

| # | Company | URL | Date | Terms | Raw wording found | Section |
| - | - | - | - | - | - | - |
| A10 | Amazon | same as A1 | no date shown | same | "If your online assessment is successful, a recruiter will contact you to arrange an interview loop" | stages |
| A11 | Amazon | same as A1 | no date shown | same | "8-minute multiple choice Work Style Survey related to our Leadership Principles" | stages |
| A12 | Amazon | same as A1 | no date shown | same | "which different interviewers will be assigned to evaluate" | stages |
| A13 | Amazon | same as A1 | no date shown | same | "Expect to be asked to write syntactically correct code" | other-rounds |
| A14 | Amazon | same as A1 | no date shown | same | "scalable, robust, and well-tested code. These are the main evaluation criteria" | other-rounds |
| A15 | Amazon | same as A1 | no date shown | same | "We won’t ask brain teasers" | other-rounds |
| A16 | Amazon | same as A1 | no date shown | same | "two or three behavioral-based questions" | other-rounds |
| A17 | Amazon | same as A1 | no date shown | same | "Learn about interviewing using Bluescape" | tooling |
| A18 | Amazon | same as A1 | no date shown | same | "your answers should include metrics or data where applicable" | preparation |
| A19 | Amazon | same as A1 | no date shown | same | "Use the STAR method to frame your responses" | preparation |
| A20 | Amazon | same as A1 | no date shown | same | "Learn how to approach high-level design in your interview" | preparation |
| A21 | Amazon | same as A1 | no date shown | same | "Interview Outcome (within 5 business days)" | after |
| A22 | Amazon | same as A6 | no date shown | same | "If your technical phone screening is successful, a recruiter will contact you to arrange an interview loop" | stages |
| A23 | Amazon | same as A6 | no date shown | same | "Half of the time will be spent on questions that focus on our Leadership Principles" | stages |
| A24 | Amazon | same as A6 | no date shown | same | "which different interviewers will be assigned to evaluate" | stages |
| A25 | Amazon | same as A6 | no date shown | same | "Learn how to approach low level-design in your interview" | design-types |
| A26 | Amazon | same as A6 | no date shown | same | "Efficiency Reliability Robustness Portability Maintainability Readability" | other-rounds |
| A27 | Amazon | same as A6 | no date shown | same | "two or three behavioral-based questions" | other-rounds |
| A28 | Amazon | same as A6 | no date shown | same | "Your technical phone screening will be with a senior leader on our team" | level |
| A29 | Amazon | same as A6 | no date shown | same | "Interview Outcome (within 5 business days)" | after |
| A30 | Amazon | same as A8 | no date shown | same | "connect with your recruiting point of contact" | preparation |
| A31 | Amazon | same as A8 | no date shown | same | "You can click through this as many times as you’d like" | preparation |
| A32 | Amazon | same as A8 | no date shown | same | "won’t be evaluating your ability to memorize all of the details" | preparation |
| A33 | Amazon | same as A8 | no date shown | same | "practicing coding outside of an integrated development environment" | preparation |
| A34 | Amazon | same as A8 | no date shown | same | "Distributed computing" | preparation |
| A35 | Amazon | same as A8 | no date shown | same | "keep the customer top of mind" | preparation |
| A36 | Amazon | same as A8 | no date shown | same | "tackles a system design example" | preparation |
| M14 | Meta | same as M1 | Oct 06 2022 | none in raw page | "determines whether you'll continue with the full interview cycle" | stages |
| M15 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Your recruiter will let you know whether your initial technical screen will be conducted over video chat or in person" | stages |
| M16 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Coding (35 minutes)" | stages |
| M17 | Meta | same as M1 | Oct 06 2022 | none in raw page | "The behavioral interview: where you’ll talk through your previous work experience" | stages |
| M18 | Meta | same as M1 | Oct 06 2022 | none in raw page | "The coding interview is typically harder than the initial interview" | stages |
| M19 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Meta's behavioral interview is 45 minutes long" | stages |
| M20 | Meta | same as M1 | Oct 06 2022 | none in raw page | "There are two types of design interviews: systems design and product design" | design-types |
| M21 | Meta | same as M1 | Oct 06 2022 | none in raw page | "we'll try to match you with an interviewer of a similar background" | design-types |
| M22 | Meta | same as M1 | Oct 06 2022 | none in raw page | "slightly familiar to you" | design-types |
| M23 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Tell me how you'd design an email server" | design-types |
| M24 | Meta | same as M1 | Oct 06 2022 | none in raw page | "design a client-server API to build a rich document editor" | design-types |
| M25 | Meta | same as M1 | Oct 06 2022 | none in raw page | "the interviewer will typically save the last five minutes for your questions" | length |
| M26 | Meta | same as M1 | Oct 06 2022 | none in raw page | "whether you've learned how to build large systems through hard experience" | looks-for |
| M27 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Move effortlessly from the goals to the high-level approach to the precise details and back again" | looks-for |
| M28 | Meta | same as M1 | Oct 06 2022 | none in raw page | "At the onset, this question sounds vague" | start |
| M29 | Meta | same as M1 | Oct 06 2022 | none in raw page | "outline it then think about how it can be broken down into subparts" | driven |
| M30 | Meta | same as M1 | Oct 06 2022 | none in raw page | "A pub-sub queue makes sense here because" | driven |
| M31 | Meta | same as M1 | Oct 06 2022 | none in raw page | "The last five minutes are for questions" | driven |
| M32 | Meta | same as M1 | Oct 06 2022 | none in raw page | "you'll spend the interview talking and drawing on the whiteboard" | tooling |
| M33 | Meta | same as M1 | Oct 06 2022 | none in raw page | "online collaborative editor shared between you and the interviewer" | tooling |
| M34 | Meta | same as M1 | Oct 06 2022 | none in raw page | "We typically don't ask estimation or trick questions" | other-rounds |
| M35 | Meta | same as M1 | Oct 06 2022 | none in raw page | "further constraints or requirements" | other-rounds |
| M36 | Meta | same as M1 | Oct 06 2022 | none in raw page | "You'll solve two coding problems" | other-rounds |
| M37 | Meta | same as M1 | Oct 06 2022 | none in raw page | "what kind of impact you want to make" | other-rounds |
| M38 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Prepare a concise, interesting description of who you are" | preparation |
| M39 | Meta | same as M1 | Oct 06 2022 | none in raw page | "What would you change about your approach if you did it all over again" | preparation |
| M40 | Meta | same as M1 | Oct 06 2022 | none in raw page | "how you'd design a system that Meta already has" | preparation |
| M41 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Read engineering blogs about approaches that work" | preparation |
| M42 | Meta | same as M1 | Oct 06 2022 | none in raw page | "without syntax highlighting or auto-completion" | preparation |
| M43 | Meta | same as M1 | Oct 06 2022 | none in raw page | "have a mock interview with a friend" | preparation |
| M44 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Be able to discuss the big-O complexity" | preparation |
| M45 | Meta | same as M1 | Oct 06 2022 | none in raw page | "can be as important as having the right answer" | preparation |
| M46 | Meta | same as M1 | Oct 06 2022 | none in raw page | "use the programming language you're best at" | preparation |
| M47 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Some interviews end without any coding" | preparation |
| M48 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Find and fix the bugs by yourself" | preparation |
| M49 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Avoid theoretical answers" | preparation |
| M50 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Come prepared with questions to learn about working at Meta as an engineer" | preparation |
| M51 | Meta | same as M1 | Oct 06 2022 | none in raw page | "six core values" | preparation |
| M52 | Meta | same as M1 | Oct 06 2022 | none in raw page | "Headphones will leave both hands free for coding" | logistics |
| M53 | Meta | same as M1 | Oct 06 2022 | none in raw page | "if you can't hear the interviewer clearly, let them know" | logistics |
| M54 | Meta | same as M1 | Oct 06 2022 | none in raw page | "take you to lunch" | logistics |
| M55 | Meta | same as M10 | no date shown | none in raw page | "an initial call with a recruiter" | stages |
| M56 | Meta | same as M10 | no date shown | none in raw page | "initial prescreen form via Career Profile" | stages |
| M57 | Meta | same as M10 | no date shown | none in raw page | "creating a case study" | stages |
| M58 | Meta | same as M10 | no date shown | none in raw page | "peers, cross-functional partners and leaders" | stages |
| M59 | Meta | same as M10 | no date shown | none in raw page | "Candidates are expected to use this AI assistant" | tooling |
| M60 | Meta | same as M10 | no date shown | none in raw page | "You can select your preferred model during the interview" | tooling |
| M61 | Meta | same as M10 | no date shown | none in raw page | "No outside AI tools or assistance are authorized" | tooling |
| M62 | Meta | same as M10 | no date shown | none in raw page | "You will select your preferred language" | tooling |
| M63 | Meta | same as M10 | no date shown | none in raw page | "problem-solving, coding, debugging, and collaboration skills" | looks-for |
| M64 | Meta | same as M10 | no date shown | none in raw page | "Research your interviewers" | preparation |
| M65 | Meta | same as M10 | no date shown | none in raw page | "a practice session in the same tool we use for the interview" | preparation |
| M66 | Meta | same as M10 | no date shown | none in raw page | "team dynamics, role specifics and the next steps" | preparation |
| M67 | Meta | same as M10 | no date shown | none in raw page | "upcoming interviews, access role-specific prep guides" | logistics |
| M68 | Meta | same as M10 | no date shown | none in raw page | "Protect your interviewing time" | logistics |
| M69 | Meta | same as M10 | no date shown | none in raw page | "sincerely held religious beliefs" | logistics |
| M70 | Meta | same as M10 | no date shown | none in raw page | "your recruiter is your best point of contact" | logistics |
| M71 | Meta | same as M10 | no date shown | none in raw page | "only one resume per applicant" | logistics |
| M72 | Meta | same as M10 | no date shown | none in raw page | "send personalized messages via your career profile to each interviewer" | after |
| M73 | Meta | same as M10 | no date shown | none in raw page | "competing offers or timelines" | after |
| M74 | Meta | same as M10 | no date shown | none in raw page | "because of holidays and other factors" | after |
| M75 | Meta | same as M10 | no date shown | none in raw page | "you'll hear back from the recruiter regarding the status of your application" | after |
| M76 | Meta | same as M13 | no date shown | none in raw page | "designed to assess your technical skills" | stages |
| MS7 | Microsoft | same as MS1 | no date shown | none in raw page | "think strategically to solve complex problems" | looks-for |
| MS8 | Microsoft | same as MS1 | no date shown | none in raw page | "how you put yourself in the customer’s shoes" | looks-for |
| MS9 | Microsoft | same as MS1 | no date shown | none in raw page | "how you would approach role-related scenarios" | other-rounds |
| MS10 | Microsoft | same as MS1 | no date shown | none in raw page | "third-party coding tool where you can run and compile your code" | other-rounds |
| MS11 | Microsoft | same as MS1 | no date shown | none in raw page | "Be sure to point out your corner cases" | other-rounds |
| MS12 | Microsoft | same as MS1 | no date shown | none in raw page | "representative, not exhaustive" | other-rounds |
| MS13 | Microsoft | same as MS1 | no date shown | none in raw page | "at least one n*log(n) sorting algorithm, preferably two" | other-rounds |
| MS14 | Microsoft | same as MS1 | no date shown | none in raw page | "Practice, practice, practice" | preparation |
| MS15 | Microsoft | same as MS1 | no date shown | none in raw page | "make sure to review them before your interview" | preparation |
| MS16 | Microsoft | same as MS1 | no date shown | none in raw page | "submit an accessibility request" | logistics |
| MS17 | Microsoft | same as MS6 | no date shown | none in raw page | "portfolio review, or presenting other work samples" | stages |
| MS18 | Microsoft | same as MS6 | no date shown | none in raw page | "Your recruiter will help you understand the format and timeline" | stages |
| MS19 | Microsoft | same as MS6 | no date shown | none in raw page | "We don’t expect you to know everything" | looks-for |
| MS20 | Microsoft | same as MS6 | no date shown | none in raw page | "Customer obsession" | looks-for |
| MS21 | Microsoft | same as MS6 | no date shown | none in raw page | "ask clarifying questions that show your integrity, collaboration, and ability to be resourceful" | driven |
| MS22 | Microsoft | same as MS6 | no date shown | none in raw page | "Make sure to prepare questions to ask during your interview" | preparation |
| MS23 | Microsoft | same as MS6 | no date shown | none in raw page | "Prepare specific examples from your experience" | preparation |
| MS24 | Microsoft | same as MS6 | no date shown | none in raw page | "how you have applied feedback, worked with others, and adapted your approach" | preparation |
| MS25 | Microsoft | same as MS6 | no date shown | none in raw page | "STAR(R) model" | preparation |
| MS26 | Microsoft | same as MS6 | no date shown | none in raw page | "you don’t need to dress up to impress us" | logistics |
| MS27 | Microsoft | same as MS6 | no date shown | none in raw page | "submit an accessibility request" | logistics |
| MS28 | Microsoft | same as MS6 | no date shown | none in raw page | "Ask for the interview timeline" | after |
| MS29 | Microsoft | same as MS6 | no date shown | none in raw page | "who will forward it to the hiring manager and interviewers" | after |
| AT7 | Atlassian | same as AT1 (Principal guide) | as above | none in the PDF | "One leadership craft interview" | stages |
| AT8 | Atlassian | same as AT1 (Principal guide) | as above | none in the PDF | "Leadership Craft Interview is a 60-minute interview" | stages |
| AT9 | Atlassian | same as AT1 (Principal guide) | as above | none in the PDF | "one of our engineering managers" | level |
| AT10 | Atlassian | same as AT1 (Principal guide) | as above | none in the PDF | "improved ways of working" | level |
| AT11 | Atlassian | same as AT1 (Principal guide) | as above | none in the PDF | "not intended to go deep on technical architecture" | level |
| AT12 | Atlassian | same as AT1 (Principal guide) | as above | none in the PDF | "measurable organisational impact" | level |
| AT13 | Atlassian | same as AT1 (Principal guide) | as above | none in the PDF | "Have you ever had to put the team’s goals above personal ambitions" | preparation |
| AT14 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "broken up in to three stages" | stages |
| AT15 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "reviewing each email your coordinator sends" | stages |
| AT16 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "scenario-based, so please come prepared with examples" | stages |
| AT17 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "core set of company values" | stages |
| AT18 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "CodePair environment ready for you" | tooling |
| AT19 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "whether this is onsite or remote" | tooling |
| AT20 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "screen share an editor or drawing tool of your choice" | tooling |
| AT21 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "navigating blockers, and communication style" | other-rounds |
| AT22 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "equally important as the end result" | other-rounds |
| AT23 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "TDD approach" | other-rounds |
| AT24 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "showcase all possible solutions" | other-rounds |
| AT25 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "How you take initiative, lead and inspire in your role" | level |
| AT26 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "technical depth, breadth, and proficiency" | looks-for |
| AT27 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "draw from past experiences when designing something new" | looks-for |
| AT28 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "Log on ~10 minutes early" | preparation |
| AT29 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "Come prepared with relevant examples" | preparation |
| AT30 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "reviewing your interviewers on LinkedIn" | preparation |
| AT31 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "reach out to your recruiter or coordinator" | preparation |
| AT32 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "let us know if you need any accommodations or adjustments" | logistics |
| AT33 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "unbiased Hiring Committee" | after |
| AT34 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "24 hour time frame to make a decision" | after |
| AT35 | Atlassian | same as AT6 (P30-P50 guide) | as above | none in the PDF | "may be subject to change" | after |
| FK12 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "EXPLORATORY DISCUSSION (30 MINUTES)" | stages |
| FK13 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "TECHNICAL PHONE SCREENING (60 MINUTES)" | stages |
| FK14 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "case-to-case basis" | stages |
| FK15 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "CUL TURE FITMENT ROUND (60 MINUTES)" | stages |
| FK16 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "Design a Parking Lot" | design-types |
| FK17 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "maintainable and extensible" | design-types |
| FK18 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "There is no specific answer expected in this round" | looks-for |
| FK19 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "There are no right or wrong answers" | looks-for |
| FK20 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "stakeholder management" | looks-for |
| FK21 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "This is the most important thing to do in the design interview" | start |
| FK22 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "decide upon the structure of the design before drawing the class diagram" | start |
| FK23 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "Make the interview as interactive as possible" | driven |
| FK24 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "It’s not an interrogation, it’s a discussion" | driven |
| FK25 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "It’s okay if you need a few minutes to collate your thoughts" | driven |
| FK26 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "on paper/white" | tooling |
| FK27 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "1 or 2 checkpoints" | other-rounds |
| FK28 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "Interviewer will key in multiple test-cases" | other-rounds |
| FK29 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "1 to 3 problems on common data structures and algorithms" | other-rounds |
| FK30 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "Backtracking" | other-rounds |
| FK31 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "Have a brief introduction of your experience ready" | preparation |
| FK32 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "charter, scope, kind of work" | preparation |
| FK33 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "High Scalability" | preparation |
| FK34 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "Practice a few design problems" | preparation |
| FK35 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "knowing the basics of the Internet as well as OS topics" | preparation |
| FK36 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "dry run your solution before and after coding" | preparation |
| FK37 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "time and space complexity" | preparation |
| FK38 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "practice coding on online coding platforms" | preparation |
| FK39 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "how and why you stand out" | preparation |
| FK40 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "intent and commitment over success" | preparation |
| FK41 | Flipkart | same as FK1 (SDE guide) | 2020 (metadata) | none in the PDF | "Audacity, Bias for Action, Customer First and Integrity" | preparation |
| FK42 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "ROUND 1.1: EXPLORATORY DISCUSSION (30 MINUTES)" | stages |
| FK43 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "depends on a case-to-case basis" | stages |
| FK44 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "CUL TURE FITMENT ROUND (60 MINUTES)" | stages |
| FK45 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "Knowledge of UML is not a" | design-types |
| FK46 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "static view modelling (class diagrams)" | design-types |
| FK47 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "take an opinionated view on the recommended approach" | design-types |
| FK48 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "sequence diagrams for important use-cases" | design-types |
| FK49 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "web service framework, queue-processor" | looks-for |
| FK50 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "access patterns and limitations" | looks-for |
| FK51 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "positively influence design and architecture" | looks-for |
| FK52 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "there is no 'single expected answer'" | level |
| FK53 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "internal implementation of these data structures" | level |
| FK54 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "bring your own laptop" | level |
| FK55 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "may or may not be available" | preparation |
| FK56 | Flipkart | same as FK9 (Architect guide) | 2020 (metadata) | none in the PDF | "awesome-scalability" | preparation |

Count by company: the 45 first claims above plus 187 added rows (ids continue each prefix). Total 232 rows.

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
