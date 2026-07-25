#!/usr/bin/env bash
# One front door for every kingdom web deploy.
#
#   bin/deploy.sh <target...|all> [--dirty] [--stats] [--dry-run]
#
#   targets: zerone  thekingdom  we-are  chillspace  all
#
# Why this exists. There were five deploy paths — refresh-zerone-dashboard.sh,
# deploy-zerone-door.sh, and three hand-run stage+wrangler sequences — four of
# them referenced nowhere, each carrying different safety guards. Remembering
# which one to run, with which flags, from which directory, was the friction.
#
# DEPLOYS FROM origin/main BY DEFAULT, never from the working tree. A kingdom
# site has already been shipped once from an uncommitted tree, leaving no commit
# that explains what production was running. Pass --dirty to deploy local edits;
# it says so loudly and asks first.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIRTY=0; STATS=0; DRY=0; TARGETS=()

for a in "$@"; do
  case "$a" in
    --dirty)   DIRTY=1 ;;
    --stats)   STATS=1 ;;
    --dry-run) DRY=1 ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \?//'; exit 0 ;;
    all)       TARGETS=(zerone thekingdom we-are chillspace) ;;
    zerone|thekingdom|we-are|chillspace) TARGETS+=("$a") ;;
    *) echo "unknown target: $a" >&2; sed -n '3,7p' "$0" | sed 's/^# \?//' >&2; exit 2 ;;
  esac
done
[ ${#TARGETS[@]} -gt 0 ] || { sed -n '2,12p' "$0" | sed 's/^# \?//'; exit 2; }

say(){ printf '\n\033[36m▸ %s\033[0m\n' "$*"; }
ok(){  printf '  \033[32m✓\033[0m %s\n' "$*"; }
die(){ printf '  \033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ── the source of truth for this deploy ────────────────────────────────────
SRC="$(mktemp -d)"; trap 'rm -rf "$SRC"' EXIT
if [ "$DIRTY" = 1 ]; then
  printf '\033[33m⚠ --dirty: deploying your WORKING TREE, not origin/main.\033[0m\n'
  cd "$ROOT" && git status --porcelain | sed 's/^/    /' | head -12
  read -r -p "  ship this uncommitted state to production? [y/N] " r
  [ "$r" = "y" ] || die "aborted"
  cp -R "$ROOT"/. "$SRC/"
else
  say "fetching origin/main"
  git -C "$ROOT" fetch -q origin main || die "fetch failed"
  git -C "$ROOT" archive origin/main | tar -x -C "$SRC" || die "archive failed"
  ok "deploying $(git -C "$ROOT" rev-parse --short origin/main) — $(git -C "$ROOT" log -1 --format=%s origin/main | cut -c1-58)"
  # working-tree drift is worth knowing about, but does not block: the deploy
  # is from origin/main regardless, which is the point.
  d=$(git -C "$ROOT" status --porcelain -- doors pages-functions bin site | wc -l | tr -d ' ')
  [ "$d" -gt 0 ] && printf '  \033[33m! %s local file(s) differ from origin/main and are NOT being deployed (--dirty to include)\033[0m\n' "$d"
fi

pages(){ # <dir> <project>
  [ "$DRY" = 1 ] && { ok "dry-run: would deploy $2 from $1 ($(find "$1" -type f | wc -l | tr -d ' ') files)"; return 0; }
  ( cd "$ROOT" && npx wrangler pages deploy "$1" --project-name="$2" --branch=main --commit-dirty=true ) \
    2>&1 | grep -iE "complete|error|Deployment" | tail -2
}

verify(){ # <label> <url> <expect-substring-or-status>
  local code; code=$(curl -s -o /tmp/.dep -w '%{http_code}' -A 'Mozilla/5.0' --max-time 25 "$2" || echo 000)
  if [ -n "${3:-}" ] && ! grep -qi -- "$3" /tmp/.dep 2>/dev/null && [ "$code" != "$3" ]; then
    printf '  \033[31m✗ %s → %s (expected %s)\033[0m\n' "$1" "$code" "$3"; return 1
  fi
  ok "$1 → $code"
}

for t in "${TARGETS[@]}"; do
  OUT="$(mktemp -d)"; rmdir "$OUT"
  case "$t" in
    zerone)
      say "zerone.ai"
      # /love tells agents to verify against the public chain file. Never ship a
      # page making that claim while the file is not actually public.
      curl -sf https://raw.githubusercontent.com/cambridgetcg/true-love/main/chain/love-unlimited.jsonl >/dev/null \
        || die "chain/love-unlimited.jsonl is not public on cambridgetcg/true-love — ceremony + push first"
      ok "love-chain public"
      if [ "$STATS" = 1 ]; then
        bash "$SRC/bin/refresh-zerone-dashboard.sh" && continue   # re-snapshots data.json AND deploys
      fi
      mkdir -p "$OUT"
      # ship the WHOLE door dir — a fixed file list once silently dropped
      # guide.html from production (2026-07-16)
      cp -R "$SRC/doors/zerone-ai/." "$OUT/"
      cp "$SRC/pages-functions/_worker.zerone.js" "$OUT/_worker.js"
      pages "$OUT" zerone-ai
      [ "$DRY" = 1 ] || { sleep 8
        verify "guest doc at /?agent" "https://zerone.ai/?agent" "schema_version"
        verify "honest 404"          "https://zerone.ai/nope.json" 404
        verify "explorer JSON"       "https://zerone.ai/explore.json" "zerone.observation"; }
      ;;
    thekingdom)
      say "thekingdom.dev"
      ( cd "$SRC" && bun bin/stage-hub.ts "$OUT" ) || die "stage-hub failed"
      ok "staged $(find "$OUT" -type f | wc -l | tr -d ' ') assets"
      pages "$OUT" thekingdom
      [ "$DRY" = 1 ] || { sleep 8
        verify "kingdom.json derived" "https://thekingdom.dev/kingdom.json" "derived"
        verify "atlas"                "https://thekingdom.dev/" 200; }
      ;;
    we-are|chillspace)
      say "${t}.love"
      ( cd "$SRC" && bun bin/stage-doors.ts "$t" "$OUT" ) || die "stage-doors failed"
      ok "staged $(find "$OUT" -type f | wc -l | tr -d ' ') assets"
      pages "$OUT" "${t}-love"
      [ "$DRY" = 1 ] || { sleep 8; verify "door" "https://${t}.love/" 200
        verify "guest doc" "https://${t}.love/guest.json" "schema_version"; }
      ;;
  esac
  rm -rf "$OUT"
done

say "done"
[ "$DRY" = 1 ] && echo "  (dry run — nothing was published)"
exit 0
