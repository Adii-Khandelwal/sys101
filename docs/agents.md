# Multi-agent way of working

The main session is the admin. It splits the task, assigns pieces, merges results, runs the final checks itself (tsc, lint, tests, check-seo, verify:figures, Pagefind, overflow, crossing tests) and decides. It does not do the pieces itself.

## Agents (`.claude/agents/`)

| Agent | Model | Use for |
| - | - | - |
| worker-cheap | Haiku | grep, listing, renames, counts, formatting, running checks, collecting URLs and dates |
| worker-strong | Sonnet | explanations, quizzes, exercises, choosing and reading posts, design, anything touching accuracy |
| reviewer | Opus | independent check of content and design output |

worker-strong is Sonnet, not Opus: the reviewer is the accuracy gate, so the writer does not need the dearest model. Switch it to Opus in its frontmatter if reviews keep failing on judgment.

## Workflow

- Content and design: worker-strong, then reviewer, then back to the worker if FAIL. Stop after 2 rounds and report what still fails.
- Run every script check first (tests, `check-topic`, `verify:figures`): they cost no tokens and catch most of what a reviewer would. The reviewer then judges only what a script cannot (own words, accuracy of concept text, clarity, design), from the raw copies in the scratchpad, never re-fetching.
- The reviewer gets the output files and DONE WHEN only, never the worker's reasoning. A second round is the admin checking the listed fixes with grep or the same scripts, not another Opus run.
- Fetch each raw page once into the scratchpad and hand the path to every later agent. Research and writing of one piece (posts, learn page) go to one agent, resumed with SendMessage after the user approves, not two cold ones.
- Agents in `.claude/agents/` are read when the session starts: after adding or editing one, restart the session, or the Agent tool answers "not found" and the work falls back to general-purpose agents with long prompts.
- Mechanical work (counts, renames, config): worker-cheap, no reviewer; the admin verifies by running the scripts.
- Parallel only when workers touch different files; otherwise sequential, or one git worktree each. At most 3 at once.
- Trivial tasks (a typo, one config line): the admin does it directly.
- Big tasks: show a plan table (piece, model, files, what the reviewer checks) and wait for "go". Small and medium: just start.
- Never push unasked. Commit only on a branch.

## Cost rules

- Cheapest model that can do the piece. Give each agent only its files and the relevant rules.
- Batch menial work into one Haiku call.

## Reporting

Every report has one line: which agent did what, what the reviewer rejected, rough tokens per model.

After the first 3 tasks run this way, say honestly whether it saved tokens or time against the old way, and what to change if not.

Tasks so far: 1 of 3. Task 1 (the HTTP, TCP and TLS topic) ran on general-purpose fallbacks because the agents were not loaded: about 670k subagent tokens (477k Sonnet, 191k Opus), of which roughly 40% was repeated work (the same raw pages read five times, two Opus review rounds that scripts could have narrowed, learn research and writing in two cold agents, a layout failure found after the lesson was written). The rules above are the fix; compare the next topic against that number.
