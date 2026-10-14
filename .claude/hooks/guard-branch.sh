#!/bin/sh
# PreToolUse (Bash): block `git commit` and `git push` on main, or on a branch whose remote copy is already merged into origin/main.
# Work on a merged branch ends up on no open PR, so start a new branch from origin/main first. Exit 2 blocks and sends stderr back to Claude.
# Limit: a squash or rebase merge leaves no merge commit to find, so check the PR state by hand for those.
cmd=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)
case "$cmd" in
  *"git commit"*|*"git push"*) ;;
  *) exit 0 ;;
esac
case "$cmd" in
  *"checkout -b"*|*"switch -c"*|*"switch --create"*) exit 0 ;; # the command makes its own branch
esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git fetch -q origin 2>/dev/null
branch=$(git branch --show-current)
case "$branch" in
  main|master)
    echo "On $branch: never commit or push here (CLAUDE.md, Git and releases). Start a branch: git switch -c <name> origin/main" >&2
    exit 2 ;;
esac
# A PR from this branch was merged (merge commit "Merge pull request #N from owner/<branch>"), or its remote tip is already inside main.
merged=$(git log origin/main --merges -1 --format=%h --grep="Merge pull request #[0-9]* from [^/]*/$branch\$")
if [ -z "$merged" ] && git rev-parse -q --verify "refs/remotes/origin/$branch" >/dev/null && git merge-base --is-ancestor "refs/remotes/origin/$branch" origin/main; then merged=tip; fi
if [ -n "$merged" ]; then
  echo "Branch $branch was already merged into origin/main ($merged), so a new commit or push reaches no open PR. Start a new branch from the current main: git switch -c <name> origin/main" >&2
  exit 2
fi
exit 0
