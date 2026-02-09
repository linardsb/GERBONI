#!/bin/bash
# PostToolUse hook: Ensure conftest.py retains import app.models
# Prevents: BUG-012 (empty SQLAlchemy metadata, no tables created)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

[[ "$FILE_PATH" != *"conftest.py" ]] && exit 0

if [ -f "$FILE_PATH" ] && ! grep -q "import app.models" "$FILE_PATH"; then
  echo "conftest.py must contain 'import app.models' before Base.metadata.create_all. Without it, SQLAlchemy metadata is empty and no tables are created (BUG-012)." >&2
  exit 2
fi

exit 0
