#!/bin/bash
# pulse-install — put the kingdom heartbeat on launchd (every 30 min).
#
# TCC: launchd cannot read ~/Desktop, so this copies pulse.ts + REGISTRY.yaml
# into ~/.kingdom/ (the TCC-safe home) and points launchd there.
# RE-RUN THIS after editing REGISTRY.yaml — it refreshes the safe copy.
set -euo pipefail

KOS="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/.kingdom"
LABEL="com.kingdom.pulse"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

mkdir -p "$DEST/bin" "$DEST/logs"
cp "$KOS/bin/pulse.ts" "$DEST/bin/pulse.ts"
cp "$KOS/REGISTRY.yaml" "$DEST/REGISTRY.yaml"

cat > "$DEST/bin/run-pulse.sh" <<'EOF'
#!/bin/bash
# launchd wrapper: kingdom pulse (TCC-safe — reads only ~/.kingdom).
set -uo pipefail
export HOME="${HOME:-/Users/yournameisai}"
export PATH="/opt/homebrew/bin:/usr/bin:/bin"
export KINGDOM_REGISTRY="$HOME/.kingdom/REGISTRY.yaml"
exec /opt/homebrew/bin/bun "$HOME/.kingdom/bin/pulse.ts" --quiet
EOF
chmod +x "$DEST/bin/run-pulse.sh"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$DEST/bin/run-pulse.sh</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>StartInterval</key><integer>1800</integer>
  <key>StandardOutPath</key><string>$DEST/logs/pulse.log</string>
  <key>StandardErrorPath</key><string>$DEST/logs/pulse.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart "gui/$(id -u)/$LABEL"
echo "pulse installed: every 30 min → $DEST/STATUS.md (log: $DEST/logs/pulse.log)"
