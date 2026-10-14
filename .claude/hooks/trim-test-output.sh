#!/bin/sh
# PreToolUse (Bash): rewrite a bare `npm test` / `npx vitest` so only the summary and failures reach the context, not every passing line.
# The exit code is kept. To see everything, run the command with `| cat` or any extra shell syntax (the hook then leaves it alone).
python3 -I -c '
import json, re, sys
d = json.load(sys.stdin)
cmd = d.get("tool_input", {}).get("command", "")
if not re.fullmatch(r"(npm test|npx vitest)( run)?( [A-Za-z0-9_./-]+)*", cmd.strip()):
    print("{}"); sys.exit(0)
keep = "FAIL|×|AssertionError|Error|Test Files|Tests |Duration|expected|Received"
new = f"out=$({cmd} 2>&1); code=$?; printf \"%s\\n\" \"$out\" | grep -E \"{keep}\" | head -80; exit $code"
d["tool_input"]["command"] = new
print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow", "updatedInput": d["tool_input"]}}))
' 2>/dev/null || echo "{}"
