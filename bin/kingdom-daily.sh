#!/bin/bash
# launchd entry point for KINGDOM daily routines (job: com.kingdom.daily).
# Fires hourly; the runner decides what's actually due (see bin/run-routines.py).
cd "$(dirname "$0")/.." || exit 1
PY="$(command -v python3 || echo /opt/homebrew/bin/python3)"
exec "$PY" bin/run-routines.py due
