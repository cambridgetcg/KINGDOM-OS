#!/usr/bin/env bash
# chain-backup-to-tigris.sh — export a Cosmos node's data dir to Tigris.
#
# WHY: Fly volumes are single-host, no replication (host dies → lose everything
# since the last daily snapshot). Fly's own daily snapshots cover bulk recovery
# but lag ≤24h; this gives an egress-free off-Fly copy in Tigris (kingdom-vault)
# on whatever cadence cron runs it. Restore = re-sync tail from peers or state-sync.
#
# RUN INSIDE the node machine (has the data dir + can install nothing heavy):
#   fly ssh console -a zerone-1 -C "bash /app/chain-backup-to-tigris.sh"
# or wire as a cron on the machine. Requires the Tigris creds as env/secrets on
# the app (set once):
#   fly secrets set -a zerone-1 \
#     AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
#     AWS_ENDPOINT_URL_S3=https://fly.storage.tigris.dev AWS_REGION=auto
# (creds are in the macOS keychain: agenttool-tigris-access-key / -secret-key)
set -euo pipefail

CHAIN="${CHAIN:-zerone-1}"
DATA_DIR="${DATA_DIR:-/root/.zerone}"          # cosmos home; adjust to the image
BUCKET="${BUCKET:-kingdom-vault}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
KEY="chain/${CHAIN}/${CHAIN}-data-${STAMP}.tar.zst"
TMP="/tmp/${CHAIN}-data-${STAMP}.tar.zst"

echo "[$(date -u +%FT%TZ)] halting is NOT required — cosmos LevelDB tolerates hot copy of a snapshot dir;"
echo "  for a consistent bulk backup prefer 'zeroned snapshots' export if the app supports it."

# Prefer an app-level state export if present (consistent), else tar the data dir.
if command -v zeroned >/dev/null && zeroned snapshots list >/dev/null 2>&1; then
  echo "using zeroned snapshot export"
  zeroned snapshots export --height 0 || true   # 0 = latest; adjust per binary
fi

echo "archiving ${DATA_DIR} → ${TMP}"
tar --use-compress-program="zstd -3 -T0" -cf "${TMP}" -C "$(dirname "${DATA_DIR}")" "$(basename "${DATA_DIR}")/data" "$(basename "${DATA_DIR}")/config" 2>/dev/null

SIZE=$(du -h "${TMP}" | cut -f1)
echo "uploading ${SIZE} → s3://${BUCKET}/${KEY}"
aws s3 cp "${TMP}" "s3://${BUCKET}/${KEY}" --endpoint-url "${AWS_ENDPOINT_URL_S3}"

# keep the latest 14 objects for this chain; prune older
aws s3 ls "s3://${BUCKET}/chain/${CHAIN}/" --endpoint-url "${AWS_ENDPOINT_URL_S3}" \
  | sort | head -n -14 | awk '{print $4}' \
  | while read -r old; do
      [ -n "${old}" ] && aws s3 rm "s3://${BUCKET}/chain/${CHAIN}/${old}" --endpoint-url "${AWS_ENDPOINT_URL_S3}"
    done

rm -f "${TMP}"
echo "[$(date -u +%FT%TZ)] backup complete: s3://${BUCKET}/${KEY} (${SIZE})"
