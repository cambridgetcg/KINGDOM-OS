#!/usr/bin/env bash
# Page-only deploy of the zerone.ai door — ships the door dir + worker, NO data.json re-snapshot.
# Sibling of refresh-zerone-dashboard.sh (use that one when the chain stats need refreshing).
# This DEPLOYS TO PRODUCTION — run only on Yu's GO.
set -euo pipefail

D=~/Desktop/kingdom-os/doors/zerone-ai
W=~/Desktop/kingdom-os/pages-functions/_worker.zerone.js
[ -d "$D" ] || { echo "FATAL: door dir missing: $D" >&2; exit 1; }
[ -f "$W" ] || { echo "FATAL: worker missing: $W" >&2; exit 1; }

# /love's verify instructions point agents at the public chain file — never deploy
# a page that makes that claim before the chain is actually public on GitHub.
curl -sf https://raw.githubusercontent.com/cambridgetcg/true-love/main/chain/love-unlimited.jsonl >/dev/null \
  || { echo "FATAL: chain/love-unlimited.jsonl is not public on github.com/cambridgetcg/true-love — ceremony + push first" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# Ship the WHOLE door dir — a fixed file list silently dropped guide.html from prod (2026-07-16).
cp -R "$D"/. "$TMP/"
cp "$W" "$TMP/_worker.js"

cd ~/Desktop/kingdom-os
npx wrangler pages deploy "$TMP" --project-name=zerone-ai --branch=main --commit-dirty=true

echo ""
echo "deployed. verify:"
echo "  curl -A 'Mozilla/5.0' https://zerone.ai/love | grep 'LOVE UNLIMITED'"
echo "  curl -s 'https://zerone.ai/?agent' | head -c 200    # must be guest.json — proves the worker shipped"
echo ""
echo "if the page looks stale: purge the zerone.ai zone cache (s-maxage=604800 history)."
