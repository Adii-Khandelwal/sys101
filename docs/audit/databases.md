# Content audit: Databases

Audit only. No content file was edited. Run on 2026-10-13, same method and rules as docs/audit/caching.md.

## Scope and method

Files read in full:
- `content/topics/databases.json` (concept, summary, 2 posts, glossary, mistakes, comparison, lesson, quiz, exercises)
- `content/learn/databases.json`
- `content/background/databases.json`
- There is no `content/news/databases.json`.

Sources fetched raw with curl (browser UA, `Accept: text/html`, `--compressed`) and converted to text on 2026-10-13: Uber 2016 post, GitHub 2023 post, PostgreSQL docs (Concepts, MVCC intro, Transaction Isolation, Transactions tutorial, Using EXPLAIN, Routine Vacuuming), SQLite (Architecture, Transactional, Atomic Commit), CMU 15-445 Fall 2024 page, Linux kernel memory concepts, PgBouncer features, Google SRE book chapter 4. All 11 Background quotes were checked by script against the raw post text (curly quotes normalised): all 11 are verbatim.

Finding IDs: T = topic page, L = learn page, B = background. Severity: wrong, misleading, weak, style.

## Summary

| Severity | Count |
|---|---|
| wrong | 2 |
| misleading | 19 |
| weak | 17 |
| style | 5 |

43 findings, counted once each under their first severity label (a few IDs carry a second label for another sentence).

Verified clean (no finding): all 11 Background quotes; Uber figures 768 GB, about 25 GB vs over 700 GB, "at least four" writes, 12 indexes, a few hundred vs about 10,000 connections, 9.2 vs 9.5; GitHub figures 1,200+ hosts, 300+ TB, 5.5 million queries per second, 50+ clusters up from 5, over a year from July 2022, 24-hour cycle, 8.0.28; post titles and dates (Uber 2016-07-26, GitHub 2023-12-07); the Postgres docs claims on Read Committed as default, Repeatable Read retry, MVCC "reading never blocks writing", EXPLAIN example (`Seq Scan on tenk1 ... rows=10000`), BEGIN/COMMIT/ROLLBACK and implicit transactions; the SQLite claims on ACID, bytecode and virtual machine, hot rollback journal; the CMU topics line; no em dashes; no "It's not X, it's Y" phrasing.

Highest priority: the "wrong" items (T8, T20), then T12 (the comparison credits GitHub with a fact only Uber states), T3 and T4 (what Uber rejected, and what the bug damaged), T9 (character set vs collation), L4 and L11.

---

## A. Topic page: `content/topics/databases.json`

### A1. Uber 2016 digest

**T1** `digest.problem`, last sentence. Severity: style.
- Current: "The post is useful mostly for how carefully it explains what a database does underneath."
- Problem: our opinion of the post, in the digest, with no source. Reads as filler praise.
- Rewrite: delete. The `ageNote` already says why the post is here.

**T2** `digest.walkthrough[5]` "InnoDB points at the primary key". Severity: weak.
- Current: "the primary key index holds the row itself, secondary indexes store the primary key, and old versions go to an undo area."
- Source: "InnoDB secondary index records hold a pointer to the primary key value"; "the primary index itself holds the on-disk row locations"; "MySQL copies the old row into a special area called the rollback segment."
- Problem: "holds the row itself" is stronger than the post (it says the primary index holds row locations). "Undo area" is our term; the post says rollback segment.
- Rewrite: "In MySQL's InnoDB, secondary indexes store the primary key, and the primary index holds the on-disk row locations. Updates happen in place, and old versions are copied to a rollback segment. An update touches only the indexes whose columns changed, at the cost of two lookups for a read through a secondary index."

**T3** `digest.tradeoffs.rejected` and `.why`. Severity: misleading.
- Current rejected: "Keeping Postgres and working around it with cascading replication, connection poolers, and the pglogical extension..."
- Source: Uber did use cascading replication ("Cascading replication limits the inter-data center bandwidth..."), and pgbouncer ("using pgbouncer to do connection pooling with Postgres has been generally successful for us"). Only pglogical is described as not an option.
- Problem: listing poolers and cascading replication as "rejected" says Uber declined them. It used them and found them not enough.
- Current why: "...which no workaround removed." / "in exchange for slower reads through secondary indexes".
- Source: InnoDB is "at a slight disadvantage" on secondary-key lookups. "no workaround removed" is not in the post.
- Rewrite rejected: "Staying on Postgres. Uber already used cascading replication and pgbouncer as workarounds, and pglogical was not an option on 9.2 and not part of core Postgres." Rewrite why: "Uber's problems came from physical replication and from every index pointing at a row's location. MySQL's logical log and primary-key indexes cut write and replication volume and made upgrades possible without rebuilding every replica, in exchange for a slight disadvantage on secondary-index lookups and a more complicated memory design."

**T4** `digest.failures` (first sentence), `comparison` paragraph 2, and `lesson.workedExample.steps[1]`. Severity: misleading.
- Current: "Because replication was physical, the damage was in every replica's files"; "spread a bug to all of them"; "the damage was in every copy's files and they had to be rebuilt".
- Source: "Replicas followed timeline switches incorrectly, causing some of them to misapply some WAL records." And: "we were unsure about the number of replicas with corrupted data and about whether the problem had affected the master." The post warns the class of bug "has the potential to spread into all of the databases in a replication hierarchy". Uber resynced "all of them" from a new snapshot, but that was the remedy.
- Problem: the bug hit some replicas, and Uber could not tell how many. "Every" and "all of them" state the worst case as the fact.
- Rewrite failures: "...made some replicas misapply log records, so rows that should have been dead stayed visible and queries returned duplicates. Because replication was physical, the damage was in the replicas' files, and Uber could not tell how many were affected. It resynced all of them from a fresh snapshot, a few at a time." Rewrite comparison: "...tied every replica to the primary's version and let one bug reach several replicas." Rewrite step: "When a 9.2 bug made some replicas misapply the log, the damage was in their files, and Uber resynced all of them from a fresh snapshot."

**T5** `digest.takeaways`. Severity: misleading.
- Current: "physical replication copies disk pages and inherits every bug and layout detail... Every index is another write on every update."
- Source: Postgres 9.2 updated every index on an update; InnoDB updates "only index records that are actually changed". The post says the bug class "has the potential to spread".
- Problem: "every index... on every update" is true for the Postgres picture only, and the same page's mistake 1 says so. "inherits every bug" overstates "has the potential to spread".
- Rewrite: "...physical replication copies disk pages, so a layout bug can reach replicas, while logical replication copies row changes and lets versions differ. In Postgres 9.2 an update wrote to every index; InnoDB wrote only to indexes on changed columns."

### A2. GitHub 2023 digest

**T6** `digest.constraints`, "GitHub's own hardware". Severity: style.
- Source: "a combination of Azure Virtual Machines and bare metal hosts in our data center."
- Rewrite: "on Azure virtual machines and bare metal hosts in its data center".

**T7** `digest.walkthrough[3]` "Build a two-way topology". Severity: misleading.
- Current: "An 8.0 replica became the next primary."
- Source: "An 8.0 primary candidate was configured to replicate directly under the current 5.7 primary." The promotion is Step 3, a separate step.
- Problem: it makes the 8.0 host the primary one step early, and the next step is "fail over".
- Rewrite: "An 8.0 primary candidate replicated from the 5.7 primary. Below it ran a chain of 8.0 replicas serving traffic and a chain of 5.7 replicas, idle but ready for a rollback."

**T8** `digest.diagram`, label "broke within hours on some busy clusters". Severity: wrong.
- Source: "for some of our MySQL clusters with connections from multiple different clients in different frameworks/languages, we saw backwards replication break in a matter of hours."
- Problem: the cause named in the post is many different clients, not load. The caption invents "busy". (The digest `failures` text says it correctly.)
- Rewrite: "broke within hours where many client types connected".

**T9** `digest.tradeoffs.rejected`, `.why`, `failures`, and `walkthrough[0]` (character set). Severity: misleading.
- Current: "adopting 8.0's newer default character set, which 5.7 could not replicate"; "an older character set for a while"; "because of the character set and of permission statements 5.7 could not apply"; "character sets and client settings were standardized".
- Source: "utf8mb4 is the default character set and uses a more modern utf8mb4_0900_ai_ci collation... 5.7 supported the utf8mb4_unicode_520_ci collation but not the latest... To address the character collation incompatibility, we had to set the default character encoding to utf8 and collation to utf8_unicode_ci."
- Problem: the blocker is the 8.0 default collation, which 5.7 lacks. Calling it the character set is imprecise. "For a while" is not in the post.
- Rewrite: "adopting 8.0's default collation, which 5.7 did not support"; "an older character set and collation"; "because of the collation and of permission statements 5.7 could not apply"; "standardized the character set and collation, and client settings".

**T10** `digest.tradeoffs.why`, "replication was the only practical way back". Severity: weak.
- Source: "in order to roll back without data loss or service disruption, we needed to be able to maintain backwards data replication between 8.0 and 5.7."
- Problem: the post says backward replication was needed to roll back without data loss; it does not compare it with other ways back.
- Rewrite: "Every step had to be reversible, and rolling back the primary without data loss meant keeping backward replication from 8.0 to 5.7. That meant idle 5.7 hosts, an older collation, and a long, cluster-by-cluster schedule."

**T11** `digest.failures`, "A MySQL bug could hang replicas under heavy load until 8.0.28 fixed it." Severity: weak.
- Source: the bug hit a replica "with the system variable replica_preserve_commit_order = 1 set... under intensive load for a long period"; GitHub says it met every condition because it uses GTID-based replication.
- Problem: drops the setting that triggers it, so it reads as any replica under load.
- Rewrite: "A MySQL bug, fixed in 8.0.28, could hang replicas that preserve commit order under intensive load for a long time, and GitHub met those conditions."

### A3. Where they differ, glossary, mistakes, summary

**T12** `comparison`. Severity: misleading.
- Current: "GitHub's 2023 post shows the operational side: MySQL replicas apply a log of row or statement changes rather than disk pages, and GitHub relied on replicating that log, even backwards from 8.0 to 5.7... though that broke within hours on some clusters."
- Source: the row-or-statement log description is in Uber's post. GitHub's post never mentions row or statement logs or disk pages. GitHub also says "we didn't have an instance where the replication broke before we needed to rollback."
- Problem: attributes Uber's explanation to GitHub, and leaves out that no rollback was cut off.
- Also: "The common thread is that the replication log decides how freely you can upgrade, recover and roll back." is our thesis. Neither post says it.
- Rewrite paragraph 2: "...GitHub's 2023 post shows the operational side: it upgraded replicas first and kept 5.7 replicas fed by replicating backwards from the 8.0 primary, so it could run both versions and keep a path back. On clusters with many client types that backward replication broke within hours, but GitHub says it never broke before a rollback was needed." Paragraph 3: "Read together, the posts suggest that how replication works shapes how freely you can upgrade and roll back." (mark as our reading).

**T13** `mistakes[0]`. Severity: misleading.
- Current: "Every index is another write on every update, and in the Postgres version Uber described, an update touched every index on the table."
- Source: InnoDB updates "only index records that are actually changed".
- Problem: the first clause is false for InnoDB, and the second clause says the Postgres case separately.
- Rewrite: "Adding indexes as if they were free. Every index adds write work when an indexed column changes, and in the Postgres version Uber described, an update touched every index on the table."

**T14** `mistakes[1]`. Severity: misleading.
- Current: "...In Uber's account this tied up connections on the primary and could get queries on replicas cancelled."
- Source: the replica point is the email-receipt example, where a transaction held open during blocking I/O can be killed on a replica. The connection point is separate: application bugs opened more active connections, "usually 'idle in transaction'", and "caused extended downtimes". The post does not tie the two to the same cause.
- Rewrite: "Holding a transaction open while doing unrelated work, such as sending an email. In Uber's account, a long transaction on a replica can block log replay and get cancelled, and application bugs that left transactions idle caused extended downtimes."

**T15** `lesson.mistakesOutcome`. Severity: misleading. "the three most common database mistakes" has no source. Rewrite: "After this you can avoid three database mistakes."

**T16** `concept` first sentence group. Severity: weak.
- Current: "Most relational databases share the same core: a change is written to a log before it touches the data files, a commit is the moment that log record is safely on disk, and copies on other machines, called replicas, stay current by replaying the primary's log."
- Problem: "Most relational databases" has no source; the learn page's own SQLite source describes a rollback journal, not a write-ahead log, as its mode; MySQL replicas apply a logical binary log, which the lesson says later. The line also pre-loads the summary points.
- Rewrite: "In Postgres, as Uber's account shows, a change is written to a write-ahead log before it reaches the data files, and that log is replayed to recover after a crash and shipped to replicas."

**T17** `lesson.why.body`, "every client sees a consistent picture". Severity: misleading.
- Problem: contradicted by the learn page, where isolation levels decide what a client sees (PostgreSQL's default Read Committed lets a repeated SELECT see different data).
- Rewrite: "Once it says a change is committed, the change survives a crash, and the database controls what each client can see of other clients' unfinished work."

**T18** `lesson.mentalModel.body`. Severity: weak.
- Current: "...The data files can be updated later, at leisure." and "they replay the primary's log, in the same order."
- Problem: "at leisure" is filler. "in the same order" is not in either post.
- Rewrite: "The data files can be updated later." and "they replay the primary's log."

**T19** `lesson.workedExample.diagram` title. Severity: weak.
- Current: "...giving more freedom at the cost of a safety check."
- Problem: "a safety check" is not in either post and means nothing on the page.
- Rewrite: "...while a logical log describes the change, so replicas can run different versions, as GitHub's upgrade relied on."

### A4. Quiz and exercises

**T20** Quiz Q6 `wrong[0]`. Severity: wrong.
- Current: "A restore would lose recent writes and take hours."
- Source: the post does not mention backups or restores. "Hours" appears only in the Uber post about `pg_upgrade` and snapshots.
- Rewrite: "The post does not rely on restores; it says rolling back the primary without data loss meant keeping backward replication." Q6 `why`: "Replication, not backups, was the practical rollback path." → "The post says rolling back without data loss meant maintaining backward replication from 8.0 to 5.7."

**T21** Quiz Q3 stem and options. Severity: weak.
- Current: "Why does adding an index slow down writes?" / "Every index is another structure to update and log on each write".
- Problem: "on each write" overstates (InnoDB updates only affected indexes). Distractors "Indexes lock the whole table" and "Indexes are stored on replicas only" are not plausible and teach nothing.
- Rewrite option: "Every index is another structure to update and log when a write changes an indexed column". Replace "stored on replicas only" with "Indexes are rebuilt from scratch on every write", explanation: "Indexes are updated in place."

**T22** Exercise 1 (apply). Severity: misleading.
- Current answer: "Every index is another write and log record on each update, so drop unused ones and serve heavy reports from a replica." Tradeoffs: "reports on a replica see slightly old data."
- Source: Uber's account of Postgres 9.2: a long-running query on a replica blocks log replay and gets killed after a timeout; replicas "can routinely lag seconds behind". The page's own mistake 2 says so.
- Problem: advising heavy reports on a replica without the cancellation risk contradicts the page.
- Rewrite: answer "...so drop unused ones. If reports must move off the primary, run them on a replica, but long queries there can be cancelled or fall behind (in Uber's Postgres 9.2 account)." Tradeoffs: "Fewer indexes make some reads slower; reports on a replica can see old data or be cancelled."
- `wrongAnswers[0]` ("Treating indexes as free.") is a belief, not an answer to "what do you check and change?". Rewrite: "Leaving the indexes alone and adding hardware."

**T23** Exercise 3 (scale). Severity: misleading.
- Current: "Automate each step, upgrade cluster by cluster, throttle writes when replicas lag..."
- Source: "we still had too many steps in the upgrade process that required manual intervention and we want to reduce the effort"; "we had to invest in observability, tooling, and processes for managing the fleet."
- Problem: GitHub says it did not automate every step; automation is its goal.
- Rewrite: "Invest in observability, tooling and processes for the fleet, upgrade cluster by cluster, throttle writes when replicas lag, and expect long periods of mixed versions. GitHub says automation is still its goal."

**T24** Exercise `wrongAnswers` form. Severity: style. Items mix beliefs ("Treating indexes as free."), gerund phrases, and fragments ("No rollback path."). Make each a short wrong action in the same form.

---

## B. Learn page: `content/learn/databases.json`

**L1** `stages[0].body[0]`, `body[1]`. Severity: weak (near-copy, filler).
- Current: "PostgreSQL describes itself as a relational database management system: data is stored in relations, which is essentially a mathematical term for tables, and each table is a named collection of rows with the same set of named columns" and "SQLite says a transactional database is one in which all changes and queries appear to be atomic, consistent, isolated and durable (ACID), and that all changes within a single transaction either occur completely or not at all, even if the write to disk is interrupted by a program crash, an operating system crash or a power failure".
- Source: "PostgreSQL is a relational database management system (RDBMS)... Relation is essentially a mathematical term for table... Each table is a named collection of rows. Each row of a given table has the same set of named columns"; "A transactional database is one in which all changes and queries appear to be Atomic, Consistent, Isolated, and Durable (ACID)... All changes within a single transaction in SQLite either occur completely or not at all, even if the act of writing the change out to the disk is interrupted by a program crash, an operating system crash, or a power failure."
- Problem: both are close to word for word without quote marks. "whose whole job is" is filler.
- Rewrite: "A database stores data safely and answers questions about it, so your application does not have to. PostgreSQL's docs explain a relational database as data kept in tables, each a named collection of rows that share the same named columns [[pg-concepts]]." and "What makes a database more than a file is a promise about correctness. SQLite promises that a transaction's changes happen completely or not at all, even if the machine crashes or loses power partway through a write [[sqlite-transactional]]."

**L2** `stages[0].body[2]`, `stages[1].body[1]`, reading `section`. Severity: misleading.
- Current: "storage components such as a B-tree and a pager"; "a pager that handles reading and writing pages of the database file"; reading section "Overview, Tokenizer, Parser, Code Generator, and the B-Tree and Pager sections".
- Source: the SQLite architecture page has sections "B-Tree", "Page Cache" and "OS Interface"; "pager.c" is a file name. "The page cache is responsible for reading, writing, and caching these pages."
- Problem: there is no "Pager" section, and the layer is called the page cache.
- Rewrite: "storage components such as a B-tree and a page cache"; "a page cache that reads, writes and caches pages of the database file"; section "Overview, Tokenizer, Parser, Code Generator, B-Tree and Page Cache". Also delete "Reading how these parts fit together is a good way to stop treating the database as a black box." (filler).

**L3** `stages[1].body[1]`, 2nd and 3rd sentences. Severity: weak.
- Current: "Databases generally keep recently used pages in memory so that common reads do not touch the disk; getting a change safely onto disk is the hard part the database handles for you."
- Source: SQLite says the page cache "is responsible for reading, writing, and caching" pages; the "generally" claim and "the hard part" are not on the page.
- Rewrite: "SQLite's page cache keeps pages in memory so that repeated reads can skip the disk [[sqlite-arch]]." and drop "the hard part" sentence.

**L4** `stages[1].body[2]` and the "Write-ahead log" term and `canNow`. Severity: misleading.
- Current: "SQLite in its default rollback mode creates a rollback journal file before it changes the database file..."; term "Write-ahead log: A durable record of a change written before the change itself"; canNow "Explain why a database writes a log before it writes the data."
- Source: "The information in this article applies only when SQLite is operating in 'rollback mode', or in other words when SQLite is not using a write-ahead log." The page does not say rollback mode is the default.
- Problem: the only cited source describes a rollback journal, which the source itself contrasts with a write-ahead log. The page then teaches write-ahead logging with no source. "Default" is not on the page.
- Rewrite: say "SQLite in rollback mode (the page's wording for when it is not using a write-ahead log)"; cite a source for write-ahead logging (SQLite's WAL page, or PostgreSQL's WAL introduction) before keeping the term and the canNow line, or change the canNow to "Explain how a rollback journal lets SQLite undo a half-finished transaction."

**L5** `stages[1].body[3]`. Severity: weak.
- Current: "atomic (all or nothing), consistent (it leaves the data valid), isolated (concurrent transactions do not interfere), and durable (once committed, it survives a crash) [[sqlite-transactional]]."
- Problem: the cited page names the four properties but does not define "consistent" or "isolated" in these words. The definitions are ours under a citation.
- Rewrite: add "In our words:" before the parentheses, or cite PostgreSQL's isolation page for the isolation part.

**L6** `stages[2].body[0]`. Severity: misleading.
- Current: "The database controls this with isolation levels, which trade strictness for speed."
- Source: the PostgreSQL isolation page says stricter levels forbid more phenomena and that Repeatable Read and Serializable applications "must be prepared to retry transactions due to serialization failures". It does not say levels trade strictness for speed.
- Rewrite: "The database controls this with isolation levels: stricter levels forbid more of these anomalies, but applications may have to retry transactions."

**L7** `stages[2].body[1]`, first sentence. Severity: weak.
- Current: "The old way to isolate transactions was locking: block anyone from touching a row you are using."
- Source: "MVCC, by eschewing the locking methodologies of traditional database systems".
- Rewrite: "Traditional systems isolate transactions with locking: block anyone from touching a row you are using."

**L8** `stages[2].body[2]`, "The important and surprising point". Severity: style. Filler emphasis. Rewrite: "The top isolation level is not the default."

**L9** `stages[3].body[0]`. Severity: misleading.
- Current: "...notes that stricter levels leave applications to retry on serialization failures, which is why the default is a middle level [[pg-iso]]." and "The practical levers on a single-machine database are the ones from the last stage".
- Source: the page says Read Committed is the default and that Repeatable Read and Serializable applications must be ready to retry. It does not say that is why Read Committed is the default.
- Rewrite: "PostgreSQL lists the phenomena each level prevents, and says applications using the stricter levels must be prepared to retry on serialization failures. Its default is Read Committed [[pg-iso]]." Drop "the practical levers" sentence.

**L10** `stages[3].body[1]`, first sentence. Severity: weak (flow). "Isolation also shows up in how you write transactions." introduces a paragraph about BEGIN, COMMIT and ROLLBACK, which is not about isolation. Rewrite: "A transaction is something you write explicitly."

**L11** `stages[3].body[2]`. Severity: misleading.
- Current: "The moment data no longer fits on one machine, it has to be copied and split, and replication, sharding and consistent hashing are all about keeping these same transaction and isolation promises once there is more than one copy and more than one machine."
- Problem: no cited source supports it, and it overclaims. Replication is not caused only by size, and consistent hashing is about spreading keys, not transaction promises.
- Rewrite: "Later topics deal with data spread over more than one machine: replication keeps copies, and sharding splits data. They build on these ideas." (our framing, no claim about promises).

**L12** terms "Snapshot" and "Phantom read" and "Primary key". Severity: misleading (Snapshot), weak (others).
- Snapshot current: "A consistent view of the data as it stood at one moment, used for the length of a transaction." Source: at Read Committed, "a SELECT query sees a snapshot of the database as of the instant the query begins to run"; at Repeatable Read the snapshot lasts for the transaction. The page's own `deeper[1]` says "each SQL statement sees a snapshot".
- Rewrite: "A consistent view of the data as it stood at one moment. In PostgreSQL's default level a new one is taken for each query; at Repeatable Read, one for the whole transaction."
- Phantom read current: "returns extra rows because another transaction inserted some in between." Source: "finds that the set of rows satisfying the condition has changed due to another recently-committed transaction." Rewrite: "returns a different set of rows because another transaction committed a change in between."
- Primary key current: "A column whose value uniquely identifies each row". Rewrite: "A column, or set of columns, whose values uniquely identify each row."

**L13** `misconceptions[2]`. Severity: weak.
- Current: myth "A query always runs the way you wrote it." / truth: "PostgreSQL's EXPLAIN shows the plan the planner chose for a query; the page's first example shows a sequential scan..."
- Problem: the truth shows EXPLAIN exists but never says the plan can differ from how the query was written. The myth is not rebutted.
- Rewrite truth: "SQL says what you want, not how to get it; the planner chooses a plan, and EXPLAIN shows it. The page's first example is a sequential scan over a table, with an estimated cost and row count [[pg-explain]]." (the first clause is general knowledge; label it ours or drop it).

**L14** `tryIt.intro`. Severity: misleading.
- Current: "These use psql, the terminal client that ships with PostgreSQL."
- Source: neither cited page (pg-transactions, pg-explain) mentions psql. The learn rules require specifics to be confirmed in a cited source.
- Rewrite: "These are SQL statements for a PostgreSQL database; run them in the SQL client you use." or cite the psql page and confirm the sentence there.

**L15** `promise`, `next`. Severity: weak.
- Current promise: "After this you can follow the topic page and the posts." Says nothing about databases. Same text in the Caching page, already fixed there.
- Rewrite: "After this you can explain what a database guarantees, how a transaction survives a crash, and how isolation levels trade strictness for retries."
- Current next: "...then read the two company posts on how a real database was run and scaled." The Uber post explains why it left Postgres; GitHub's covers an upgrade.
- Rewrite: "...then read the two company posts, one on what Postgres and MySQL do underneath at Uber and one on upgrading MySQL at GitHub."

---

## C. Background: `content/background/databases.json`

All 11 quotes verbatim. Every `assumedBy` quote contains the idea it is filed under.

**B1** Taught-later gists: "b-tree-indexes", "sharding", "promoting-a-replica", "failover". Severity: style.
- Problem: each ends with "The gist is enough here." The Caching audit removed this line (the Background page legend already says it, and lib/background.ts no longer requires it). Four items here still carry it.
- Rewrite: delete the sentence from each of the four.

**B2** `promoting-a-replica` GitHub quote. Severity: weak.
- Current: "An 8.0 primary candidate was configured to replicate directly under the current 5.7 primary."
- Problem: shows a primary candidate placed under the current primary, not a promotion. The Uber quote carries the term.
- Rewrite: use the GitHub sentence "Instead, we would promote a MySQL 8.0 replica to primary through a graceful failover performed with Orchestrator." (verbatim in the post).

**B3** `failover.explanation`. Severity: weak.
- Current: "Noticing that a primary is gone and switching traffic to a stand-in, without waiting for a person."
- Problem: the GitHub quote is about blocking an accidental rollback during an unplanned failover. "Without waiting for a person" is general knowledge, not in the quoted line; fine for a gist but it is the only claim, so say it plainly.
- Rewrite: "Switching to another copy when the primary is lost, so writes can continue." (shorter, nothing beyond the quote).

**B4** `connection-pooling.explanation`. Severity: weak.
- Source (PgBouncer features): session pooling assigns a server connection for the whole time a client stays connected; transaction pooling only for the length of a transaction. "A pooler shares a few real connections among many clients" is true for transaction pooling, but the page says session pooling keeps one server connection per client.
- Rewrite: "A pooler sits between the applications and the database and reuses a limited set of real connections. In transaction pooling a server connection is lent to a client only for one transaction."

Verified, no finding: vacuum, page-cache, service-level-objectives explanations against PostgreSQL routine vacuuming ("removes dead row versions in tables and indexes and marks the space available for future reuse"), Linux page cache ("Whenever a file is read, the data is put into the page cache to avoid expensive disk access on the subsequent reads") and the SRE book ("An SLO is a service level objective: a target value or range of values for a service level that is measured by an SLI"); SRE year 2017 on the page.

---

## Could not verify

- **"Commit = log record safely on disk"**, the "Pages in memory are written to the data files in the background" step, and the lesson quiz Q1 distractor "a commit on the primary does not wait for replicas unless configured to": general database knowledge. Uber says only that the WAL "allows the atomicity and durability aspects of ACID". None of the cited sources defines commit.
- **"Undo area" for InnoDB**: not a term in the Uber post (it says rollback segment). Not checked against MySQL docs.
- **PostgreSQL docs version**: the `pg-concepts` note says the page shown was PostgreSQL 18. The fetched page text shows a version selector but not a visible version heading, so this note was not confirmed.
- **GitHub "Updated May 21, 2024"**: the page shows an update date after the 2023-12-07 publication. The topic page shows only 2023-12-07. I did not diff the 2024 update against the text we summarised, so I cannot say whether the update changed any figure.
- **CMU 15-445 "shape of the field"**: the course topic list is on the page, and it is an archived Fall 2024 offering (the page says so). Whether it counts as an official source for the topic is a policy call, not a text check.
- **Uber URL locale** (`/en-ES/`): the page loads; not checked that other locales have identical text.
- **Learn-page statements with no cited source**: "recently used pages in memory" (L3), "the old way" (L7), and the replication/sharding/consistent-hashing framing (L11).
- **Meta description, reading time, daily figure, JSON-LD, sitemap dates**: generated at build time from the content above; not audited separately. Fixing T5, T9 and T10 fixes any daily-figure text built from those rows.
- **About page, Terms, Privacy, homepage**: out of scope for a per-topic run.
