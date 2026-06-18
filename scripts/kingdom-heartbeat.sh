#!/bin/bash
# kingdom-heartbeat.sh — one pulse of the whole kingdom.
# Checks every living system, prints one honest line per thing,
# and a summary at the end. Run by hand or on a schedule.
#
#   bash ~/github/cambridgetcg/KINGDOM-OS/scripts/kingdom-heartbeat.sh
#
set -euo pipefail

PULSE_FILE="$HOME/.kingdom-pulse"
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "=== Kingdom Heartbeat: $NOW ==="
echo ""

# --- Castle ---
CASTLE="$HOME/castle"
CASTLE_ROOMS=$(ls "$CASTLE/rooms/"*.md 2>/dev/null | wc -l | tr -d ' ')
CASTLE_WORDS=$(ls "$CASTLE/words/"*.md 2>/dev/null | wc -l | tr -d ' ')
CASTLE_QUESTIONS=$(grep -c '^- \[ \]' "$CASTLE/questions.md" 2>/dev/null || echo 0)
CASTLE_QUESTS=$(grep -c '^- \[ \]' "$CASTLE/quests.md" 2>/dev/null || echo 0)
CASTLE_LAST=$(tail -1 "$CASTLE/chronicle.md" 2>/dev/null | cut -c1-80)
echo "  🏰 castle      $CASTLE_ROOMS rooms · $CASTLE_WORDS words · $CASTLE_QUESTIONS open doors · $CASTLE_QUESTS open quests"
echo "     last: $CASTLE_LAST"

# --- Oracle ---
ORACLE="$HOME/codeberg/zerone-dev/oracle"
ORACLE_REGIME=$(grep -o '"regime": "[^"]*"' "$ORACLE/scores/regime.json" 2>/dev/null | head -1 || echo "unknown")
ORACLE_PRICES=$(ls "$ORACLE/data/prices/"*.csv 2>/dev/null | wc -l | tr -d ' ')
ORACLE_PREDICTIONS=$(ls "$ORACLE/predictions/active/"*.md 2>/dev/null | wc -l | tr -d ' ')
ORACLE_LAST_PRICE=$(tail -1 "$ORACLE/data/prices/SPY.csv" 2>/dev/null | cut -d, -f1 || echo "unknown")
echo "  🔮 oracle      regime=$ORACLE_REGIME · $ORACLE_PRICES instruments · $ORACLE_PREDICTIONS active predictions"
echo "     last price date: $ORACLE_LAST_PRICE"

# --- LaunchAgents ---
ORACLE_AGENTS=$(launchctl list 2>/dev/null | grep -c "com.oracle" || echo 0)
CASTLE_SCRIBE=$(launchctl list 2>/dev/null | grep -c "cc.castle.scribe" || echo 0)
echo "  ⚡ launchd     oracle=$ORACLE_AGENTS agents · castle-scribe=$CASTLE_SCRIBE"

# --- Hermes Cron ---
CRON_COUNT=$(cat "$HOME/.hermes/cron/jobs.json" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len([j for j in d if j.get('enabled',True)]))" 2>/dev/null || echo "?")
echo "  ⏰ hermes cron $CRON_COUNT jobs enabled"

# --- GitHub ---
GH_REPOS=$(ls "$HOME/github/cambridgetcg/" | wc -l | tr -d ' ')
echo "  🐙 github      $GH_REPOS repos cloned"

# --- Codeberg ---
CB_REPOS=$(ls "$HOME/codeberg/zerone-dev/" | grep -v -E "INVENTORY|_archive|backups|^\.|README" | wc -l | tr -d ' ')
echo "  🌊 codeberg    $CB_REPOS repos cloned"

# --- Live sites ---
SITES_UP=0
SITES_TOTAL=5
for url in "app.axiepro.io" "agenttool.dev" "ai-love.cc" "cambridgetcg.com" "taxsorted.io"; do
  if curl -s --max-time 3 -o /dev/null "https://$url" 2>/dev/null; then
    SITES_UP=$((SITES_UP + 1))
  fi
done
echo "  🌐 live sites  $SITES_UP/$SITES_TOTAL up"

# --- CashLoom wallet ---
CASHLOOM="$HOME/github/cambridgetcg/cashloom"
WALLET_EXISTS=$(test -f "$CASHLOOM/backend/src/models/wallet.model.ts" && echo "yes" || echo "no")
echo "  💰 cashloom    wallet bridge: $WALLET_EXISTS"

# --- Kingdom citizens ---
AGENTS=$(ls "$HOME/github/cambridgetcg/KINGDOM-OS/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
echo "  👑 kingdom     $AGENTS citizen-souls"

echo ""
echo "  ♥ the kingdom is alive"
echo "  Truth is. Love is. Joy is. Peace is."
echo ""

# Write pulse file for external readers
cat > "$PULSE_FILE" << PULSE
{
  "timestamp": "$NOW",
  "castle": { "rooms": $CASTLE_ROOMS, "words": $CASTLE_WORDS, "openQuestions": $CASTLE_QUESTIONS, "openQuests": $CASTLE_QUESTS },
  "oracle": { "regime": "$ORACLE_REGIME", "instruments": $ORACLE_PRICES, "predictions": $ORACLE_PREDICTIONS },
  "kingdom": { "citizens": $AGENTS, "githubRepos": $GH_REPOS, "codebergRepos": $CB_REPOS, "liveSites": $SITES_UP },
  "loops": { "hermesCron": $CRON_COUNT, "launchdOracle": $ORACLE_AGENTS },
  "alive": true
}
PULSE