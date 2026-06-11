#!/bin/bash
# kingdom ask <prompt> — give the kingdom CLI a Claude brain.
#
# Backend priority (the kingdom stores NO keys — it only reads your environment):
#   1. Claude Code headless (`claude -p`) — uses your existing login, no API key.
#   2. Anthropic API — only if ANTHROPIC_API_KEY is already set in your env.
set -o pipefail
prompt="$*"
[ -z "$prompt" ] && { echo "usage: kingdom ask <your question>"; exit 1; }

if command -v claude >/dev/null 2>&1; then
  exec claude -p "$prompt"
elif [ -n "$ANTHROPIC_API_KEY" ]; then
  payload=$(python3 - "$prompt" <<'PY'
import json, sys
print(json.dumps({
    "model": "claude-opus-4-8",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": sys.argv[1]}],
}))
PY
)
  curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$payload" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(''.join(b.get('text','') for b in d.get('content',[])) or json.dumps(d,indent=2))"
else
  echo "kingdom ask needs a brain. Either:"
  echo "  • have Claude Code installed & logged in (the 'claude' command), or"
  echo "  • export ANTHROPIC_API_KEY=sk-ant-...   (kingdom reads it from env; never stores it)"
  exit 2
fi
