#!/usr/bin/env bash
# deploy.sh — deploy a registry target from freshly fetched upstream, never
# from a fixed local checkout.
#
#   bash bin/deploy.sh <we-are|chillspace|kingdom-mcp|sinovai> [--dry-run]
#
# Each run makes a new temporary directory and fills it with `git archive` of
# the upstream branch fetched seconds before, at an exact SHA it prints. No
# local clone's working tree, branch or remote-tracking ref is read or changed,
# so a stale or dirty checkout can no longer reach production. There is no mode
# that ships uncommitted work. --dry-run builds and stages everything, publishes
# nothing, and keeps the staged tree for inspection or a diff card.
#
# This script does not grant authority to deploy. Each target's own runbook
# still applies:
#   we-are, chillspace  DOMAINS-SETUP.md §Redeploy (production approval; the
#                       held door release is ledger kingdom-door-release)
#   kingdom-mcp         its README "Run / deploy"
#   sinovai             its AGENTS.md (ask before deployment); this runs its
#                       own `npm run deploy` (wrangler versions upload)
# thekingdom.dev keeps its exact-commit runbook in DOMAINS-SETUP.md, and
# zerone.ai releases from cambridgetcg/zerone-core.
#
# Upstreams (override for a deliberate rollback or a test):
#   KOS_URL/KOS_REF          https://github.com/cambridgetcg/KINGDOM-OS.git main
#   COMMONS_URL/COMMONS_REF  https://github.com/mynameisyou-cmyk/chillspace-commons.git master
#   MCP_URL/MCP_REF          https://github.com/cambridgetcg/kingdom-mcp.git main
#   SINOVAI_URL/SINOVAI_REF  https://github.com/cambridgetcg/sinovai.git main
set -euo pipefail

KOS_URL="${KOS_URL:-https://github.com/cambridgetcg/KINGDOM-OS.git}";            KOS_REF="${KOS_REF:-main}"
COMMONS_URL="${COMMONS_URL:-https://github.com/mynameisyou-cmyk/chillspace-commons.git}"; COMMONS_REF="${COMMONS_REF:-master}"
MCP_URL="${MCP_URL:-https://github.com/cambridgetcg/kingdom-mcp.git}";            MCP_REF="${MCP_REF:-main}"
SINOVAI_URL="${SINOVAI_URL:-https://github.com/cambridgetcg/sinovai.git}";        SINOVAI_REF="${SINOVAI_REF:-main}"

usage() { sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 2; }

TARGET=""; DRY=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    -h|--help) usage ;;
    we-are|chillspace|kingdom-mcp|sinovai)
      [ -z "$TARGET" ] || { echo "one target per run" >&2; exit 2; }
      TARGET="$a" ;;
    *) echo "unknown argument: $a" >&2; usage ;;
  esac
done
[ -n "$TARGET" ] || usage

WORK="$(mktemp -d "${TMPDIR:-/tmp}/kingdom-deploy.XXXXXX")"
if [ "$DRY" = 1 ]; then
  echo "dry run: staged trees stay in $WORK"
else
  trap 'rm -rf "$WORK"' EXIT
fi

# fetch <name> <url> <ref> → prints the directory holding `git archive` of the
# freshly fetched ref; logs the exact SHA on stderr.
fetch() {
  local name="$1" url="$2" ref="$3" git_dir="$WORK/$1.git" tree="$WORK/$1"
  git init -q --bare "$git_dir"
  git -C "$git_dir" fetch -q --depth 1 "$url" "refs/heads/$ref" || { echo "fetch failed: $url $ref" >&2; exit 1; }
  local sha; sha="$(git -C "$git_dir" rev-parse FETCH_HEAD)"
  mkdir -p "$tree"
  git -C "$git_dir" archive "$sha" | tar -x -C "$tree"
  printf '%s\n' "$sha" > "$tree.sha"
  echo "  $name: $url $ref @ $sha" >&2
  printf '%s\n' "$tree"
}

publish() { # <description> <command...>
  local what="$1"; shift
  if [ "$DRY" = 1 ]; then echo "dry run: would $what: $*"; return 0; fi
  echo "→ $what"; "$@"
}

verify_contains() { # <url> <needle>
  [ "$DRY" = 1 ] && return 0
  local body; body="$(curl -sS --max-time 25 -A 'kingdom-deploy/1' "$1" || true)"
  if printf '%s' "$body" | grep -q -- "$2"; then echo "  ✓ $1 contains $2"; else echo "  ✗ $1 lacks $2" >&2; return 1; fi
}

echo "deploy $TARGET from fresh upstream$([ "$DRY" = 1 ] && echo ' (dry run)')"
case "$TARGET" in
  we-are|chillspace)
    KOS="$(fetch kingdom-os "$KOS_URL" "$KOS_REF")"
    COMMONS="$(fetch chillspace-commons "$COMMONS_URL" "$COMMONS_REF")"
    OUT="$WORK/stage-$TARGET"
    ( cd "$KOS" && bun bin/stage-doors.ts "$TARGET" "$OUT" --commons "$COMMONS" )
    echo "  staged $(find "$OUT" -type f | wc -l | tr -d ' ') files in $OUT"
    publish "publish ${TARGET}-love" npx wrangler pages deploy "$OUT" --project-name="${TARGET}-love" \
      --branch=main --commit-hash="$(cat "$KOS.sha")" --commit-dirty=false
    verify_contains "https://${TARGET}.love/guest.json" schema_version
    ;;
  kingdom-mcp)
    MCP="$(fetch kingdom-mcp "$MCP_URL" "$MCP_REF")"
    KOS="$(fetch kingdom-os "$KOS_URL" "$KOS_REF")"
    # the public-safe registry subset comes from KINGDOM-OS main, never ~/Desktop
    ( cd "$MCP" && KINGDOM_REGISTRY="$KOS/REGISTRY.yaml" bun scripts/embed-registry.ts )
    publish "deploy kingdom-mcp to Fly" bash -c 'cd "$1" && fly deploy --ha=false' _ "$MCP"
    verify_contains "https://mcp.thekingdom.dev/health" '"ok":true'
    ;;
  sinovai)
    SIN="$(fetch sinovai "$SINOVAI_URL" "$SINOVAI_REF")"
    ( cd "$SIN" && npm ci --no-audit --no-fund && npm run check && npm test && npm run build )
    publish "upload a sinovai Worker version (its own npm run deploy)" bash -c 'cd "$1" && npm run deploy' _ "$SIN"
    [ "$DRY" = 1 ] || echo "  note: npm run deploy uploads a version; promoting it to traffic follows sinovai's own runbook"
    ;;
esac
echo "done: $TARGET"
