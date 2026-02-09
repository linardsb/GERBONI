#!/bin/bash
# PostToolUse hook: Warn when editing one locale file without the other
# Prevents: BUG-001 (untranslated strings)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if [[ "$FILE_PATH" == *"/messages/en.json" ]]; then
  echo "REMINDER: You edited en.json — also update frontend/src/messages/lv.json to keep translations in sync."
elif [[ "$FILE_PATH" == *"/messages/lv.json" ]]; then
  echo "REMINDER: You edited lv.json — also update frontend/src/messages/en.json to keep translations in sync."
fi

exit 0
