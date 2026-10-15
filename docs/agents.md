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
- The reviewer gets the output files and DONE WHEN only, never the worker's reasoning.
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

Tasks so far: 0 of 3.
