#!/bin/bash
# kingdom ask [packet options] -- <task> — compile intent, then ask Claude.
#
# Backend priority (the kingdom stores NO keys — it only reads your environment):
#   1. Claude Code headless (`claude -p`) — uses your existing login, no API key.
#   2. Anthropic API — only if ANTHROPIC_API_KEY is already set in your env.
set -o pipefail
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

if command -v claude >/dev/null 2>&1; then
  binding="claude-cli"
elif [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  binding="anthropic-api"
else
  echo "kingdom ask needs a brain. Either:"
  echo "  • have Claude Code installed & logged in (the 'claude' command), or"
  echo "  • provide ANTHROPIC_API_KEY through a scoped command wrapper or credential environment"
  exit 2
fi

# Provider transmission never inherits ambient repository metadata. A caller
# may deliberately override this default with --project PATH before -- TASK.
packet="$(bun "$SELF_DIR/prompt-packet.ts" --render --binding "$binding" --no-project "$@")" || exit $?

if [ "$binding" = "claude-cli" ]; then
  printf '%s\n' "$packet" | claude -p
  exit $?
else
  printf '%s\n' "$packet" | exec python3 "$SELF_DIR/anthropic-ask.py"
fi
