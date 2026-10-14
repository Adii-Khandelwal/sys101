#!/bin/sh
# PreToolUse (Bash): block a production build while a dev server owns .next. `next build` overwrites .next under `next dev` and breaks it.
# Reads the tool call as JSON on stdin; exit 2 blocks and sends stderr back to Claude.
cmd=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)
case "$cmd" in
  *"next build"*|*"npm run build"*|*"npm run search:index"*) ;;
  *) exit 0 ;;
esac
case "$cmd" in
  *NEXT_DIST_DIR=*) exit 0 ;;
esac
if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "A dev server is running on :3000 and a build into .next would break it. Build elsewhere: NEXT_DIST_DIR=.next-build npx next build, then run the checks with the same variable (NEXT_DIST_DIR=.next-build node scripts/check-seo.mjs), then rm -rf .next-build. See CLAUDE.md, Working in this repo." >&2
  exit 2
fi
exit 0
