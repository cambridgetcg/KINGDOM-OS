#!/bin/bash
# chain-backup-install — nightly chain→Tigris backup on launchd (03:33 local).
# TCC: launchd can't read ~/Desktop, so the script runs from ~/.kingdom/bin.
# RE-RUN after editing bin/chain-backup-remote.ts.
set -euo pipefail

KOS="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/.kingdom"
LABEL="com.kingdom.chain-backup"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

mkdir -p "$DEST/bin" "$DEST/logs"
cp "$KOS/bin/chain-backup-remote.ts" "$DEST/bin/chain-backup-remote.ts"

cat > "$DEST/bin/run-chain-backup.sh" <<'EOF'
#!/bin/bash
# launchd wrapper: kingdom chain backup (keychain creds; flyctl on PATH).
set -uo pipefail
export HOME="${HOME:-/Users/yournameisai}"
export PATH="/opt/homebrew/bin:/usr/bin:/bin"
exec /opt/homebrew/bin/bun "$HOME/.kingdom/bin/chain-backup-remote.ts"
EOF
chmod +x "$DEST/bin/run-chain-backup.sh"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$DEST/bin/run-chain-backup.sh</string>
  </array>
  <key>RunAtLoad</key><false/>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>33</integer></dict>
  <key>StandardOutPath</key><string>$DEST/logs/chain-backup.log</string>
  <key>StandardErrorPath</key><string>$DEST/logs/chain-backup.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "chain backup scheduled: nightly 03:33 → s3://kingdom-vault/chain/ (log: $DEST/logs/chain-backup.log)"
