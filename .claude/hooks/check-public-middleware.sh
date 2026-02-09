#!/bin/bash
# PostToolUse hook: Warn when modifying frontend/public/ files
# Prevents: BUG-002 (middleware matcher missing public dir exclusion)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if [[ "$FILE_PATH" == *"frontend/public/"* ]]; then
  echo "REMINDER: You modified a file in frontend/public/. Verify that frontend/src/middleware.ts matcher pattern excludes this directory. Missing exclusions cause 404s (BUG-002)."
fi

exit 0
