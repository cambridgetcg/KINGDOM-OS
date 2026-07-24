#!/bin/sh
# Machine binding for the canonical KINGDOM OS heartbeat.
# The canonical supervisor owns the narrow environment and 30-second ceiling.

set -eu

exec /Users/yu/codeberg/zerone-dev/KINGDOM-OS/bin/heartbeat-ceiling.sh \
  /Users/yu \
  /Users/yu/.local/bin/node \
  /Users/yu/codeberg/zerone-dev/KINGDOM-OS/bin/heartbeat.mjs \
  30
