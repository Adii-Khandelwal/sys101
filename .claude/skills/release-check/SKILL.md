---
name: release-check
description: Run the pre-push checklist for sys101 and write the hand-off (branch, checks, PR link, what to read before merging). Use when the user says commit, push, open the PR, ship, or deploy; and to check the live site after a merge.
---

# Release check

Work on a branch, never `main`. Push only when asked. Read `CLAUDE.md` "Verifying a change" and "Git and releases".

1. **Checks:** `npx tsc --noEmit`, `npm run lint`, `npm test`. If a dev server is up, a build with `NEXT_DIST_DIR=.next-build npx next build`, then `check-seo`, `check-news` and `check-diagram-overflow` with the same variable, then `rm -rf .next-build`. `npm run check:tour` and `npm run check:ui` when pages changed.
2. **Failing tests stop the push.** Never chain a push after a test command whose output you only `tail`: read the result first.
3. **Docs in the same commit:** the matching `.claude/rules/` file, `CLAUDE.md` for a project-wide rule, `README.md`. The final report says which changed (or "no change").
4. **Review:** run `/ponytail-review` on the diff and report what it found.
5. **Commit** with a message that says what changed and why, ending with the co-author line the session gives. Push the branch with `-u`.
6. **PR hand-off** (`gh` is at `/opt/homebrew/bin/gh`; always create the PR yourself with `gh pr create` after pushing, and give the PR link; open the compare URL `https://github.com/Adii-Khandelwal/sys101/compare/main...<branch>?expand=1` only if `gh` fails). The PR body is the description: title, what changed, checks run, anything to read before merging (permissions, brand rules, caveats).
7. **After the merge:** poll `https://sys101.vercel.app` until the new markup appears (`curl`, then an until-loop), then check the live site: status 200, the changed pages at 1440 and 390 with `BASE_URL=https://sys101.vercel.app npm run check:ui`, no console errors, assets return 200. Also run `npm run check:live-search` (the live search index must hold the whole site). Say plainly if it is not live yet.
