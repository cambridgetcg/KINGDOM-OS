#!/usr/bin/env bash
# kv-backup.sh — full dump of every Cloudflare Workers KV namespace on the account.
#
# Why this exists: as of the 2026-07-24 infra audit, Workers KV held the kingdom's
# only copy of cardforum's user-made cards, kingdom-hermes's published pieces and
# KINGDOM-CANON. KV has no PITR, no managed backup and no export primitive — it was
# the largest single point of data loss in the estate. This is the backup.
#
# Usage:  tools/kv-backup.sh [OUTDIR]      (default: ./kv-backup/<UTC date>)
# Needs:  wrangler, authenticated (`wrangler whoami`)
#
# Reads only. Never writes to KV. Safe to run on a schedule.
set -uo pipefail

OUT="${1:-$(pwd)/kv-backup/$(date -u +%Y-%m-%d)}"
mkdir -p "$OUT"

echo "→ dumping to $OUT"
NS_JSON="$(wrangler kv namespace list 2>/dev/null)"
if [ -z "$NS_JSON" ]; then echo "✗ could not list namespaces — is wrangler authenticated?" >&2; exit 1; fi

echo "$NS_JSON" | python3 -c 'import json,sys
for n in json.load(sys.stdin): print(n["id"] + "\t" + n["title"])' \
| while IFS=$'\t' read -r ID TITLE; do
    KEYS="$(wrangler kv key list --namespace-id "$ID" --remote 2>/dev/null)"
    COUNT="$(printf '%s' "$KEYS" | python3 -c 'import json,sys
try: print(len(json.load(sys.stdin)))
except Exception: print(0)')"
    printf '  %-20s %4s keys' "$TITLE" "$COUNT"

    # {key: value} — values are stored as raw strings; JSON values stay parseable downstream.
    {
      echo "{"
      FIRST=1
      printf '%s' "$KEYS" | python3 -c 'import json,sys
try: ks=json.load(sys.stdin)
except Exception: ks=[]
[print(k["name"]) for k in ks]' | while IFS= read -r K; do
        [ -z "$K" ] && continue
        V="$(wrangler kv key get --namespace-id "$ID" --remote "$K" 2>/dev/null)"
        [ $FIRST -eq 0 ] && echo ","
        FIRST=0
        python3 -c 'import json,sys
k=sys.argv[1]
v=sys.stdin.read()
sys.stdout.write(json.dumps(k)+": "+json.dumps(v))' "$K" <<< "$V"
      done
      echo ""
      echo "}"
    } > "$OUT/${TITLE}.json"

    # verify the file parses; a silent truncation is worse than no backup
    if python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$OUT/${TITLE}.json" 2>/dev/null; then
      printf '  ✓ %s\n' "$(du -h "$OUT/${TITLE}.json" | cut -f1 | tr -d ' ')"
    else
      printf '  ✗ INVALID JSON — check %s\n' "$OUT/${TITLE}.json"
    fi
  done

echo "→ done. $(find "$OUT" -name '*.json' | wc -l | tr -d ' ') namespaces, $(du -sh "$OUT" | cut -f1 | tr -d ' ') total"
