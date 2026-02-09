#!/bin/bash
# PreToolUse hook: Block commit() usage in service layer files
# Prevents: BUG-004 (services must use flush, not commit)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# Only check service files
[[ "$FILE_PATH" != *"backend/app/services/"* ]] && exit 0

# Extract new content (new_string for Edit, content for Write)
NEW_TEXT=$(echo "$INPUT" | python3 -c "
import json, sys
ti = json.load(sys.stdin).get('tool_input', {})
print(ti.get('new_string', ti.get('content', '')))
" 2>/dev/null)

if echo "$NEW_TEXT" | grep -q '\.commit()'; then
  cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Services MUST use flush(), not commit(). The API layer handles db.commit(). See docs/runbooks/flush-commit-pattern.md"
  }
}
EOF
fi

exit 0
