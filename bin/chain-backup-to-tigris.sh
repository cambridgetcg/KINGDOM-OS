#!/usr/bin/env bash
# Alternative in-node online salvage capture; NOT a coherent recovery backup.
# Requires tar/zstd and aws, plus explicitly configured credentials/environment.
# Tar 0 AND 1 remain RAW_UNVERIFIED. No snapshot/export fallback or pruning.
# Every stored generation is preserved; storage grows until a reviewed policy.
# Exit 3 = unverified capture present; 1 = failure; 2 = usage/config error.
# Installing/running on a node is a separately authorised activation operation.
set -euo pipefail

CHAIN="${CHAIN:-zerone-1}"
DATA_DIR="${DATA_DIR:-/data/.zeroned}"
# Strip every trailing separator so member names cannot become /data or /config.
while [[ "$DATA_DIR" == */ ]]; do DATA_DIR="${DATA_DIR%/}"; done
BUCKET="${BUCKET:-kingdom-vault}"
AWS_ENDPOINT_URL_S3="${AWS_ENDPOINT_URL_S3:-https://fly.storage.tigris.dev}"

# Validate before date, temporary files, archiving, credential use or networking.
if [ "$#" -ne 0 ] || [[ ! "$CHAIN" =~ ^(zerone-1|zerone-testnet-1)$ ]] ||
   [[ ! "$BUCKET" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]] ||
   [[ "$DATA_DIR" != /* || "$DATA_DIR" =~ ^/+$ || "$DATA_DIR" == *$'\n'* ]] ||
   [[ ! "$AWS_ENDPOINT_URL_S3" =~ ^https://[a-zA-Z0-9.-]+(:[0-9]+)?/?$ ]]; then
  printf '%s\n' 'Usage: chain-backup-to-tigris.sh (no arguments; valid CHAIN, DATA_DIR, BUCKET and HTTPS AWS_ENDPOINT_URL_S3 required)'
  exit 2
fi
PARENT="${DATA_DIR%/*}"
PARENT="${PARENT:-/}"
umask 077
capture=FAILED
upload=NOT_ATTEMPTED
object=NOT_ATTEMPTED
tar_rc=null
upload_rc=null
error=SETUP_FAILED
report() {
  printf '{"chain":"%s","capture_status":"%s","tar_exit":%s,"upload_status":"%s","upload_exit":%s,"object_status":"%s","recovery_status":"NOT_ASSESSED","retention_status":"DISABLED","key_files":"EXCLUDED","error":%s}\n' \
    "$CHAIN" "$capture" "$tar_rc" "$upload" "$upload_rc" "$object" "$error"
}
fail_setup() { error='"SETUP_FAILED"'; report; exit 1; }
TMP="$(mktemp -d "${TMPDIR:-/tmp}/chain-backup.XXXXXXXXXX" 2>/dev/null)" || fail_setup
# Only our private ephemeral files are removed, NEVER stored objects.
trap 'rm -f -- "$TMP/archive.tar.zst" >/dev/null 2>&1; rmdir -- "$TMP" >/dev/null 2>&1' EXIT
STAMP="$(date -u +%Y%m%dT%H%M%SZ 2>/dev/null)" || fail_setup
# The mktemp suffix keeps same-second captures distinct.
KEY="chain/${CHAIN}/${CHAIN}-data-${STAMP}-${TMP##*.}.tar.zst"

# Suppress subprocess bodies: they may contain keys, URLs or archive filenames.
# Validator identity keys stay out of new archives (data/priv_validator_state.json
# stays in); older archives and the volume still hold them. Ledger zc-chain-backup-runner.
tar_rc=0
tar --use-compress-program="zstd -3 -T0" -cf "$TMP/archive.tar.zst" \
  --exclude=priv_validator_key.json --exclude=node_key.json \
  -C "$PARENT" "${DATA_DIR##*/}/data" "${DATA_DIR##*/}/config" >/dev/null 2>&1 || tar_rc=$?
if [ "$tar_rc" -gt 1 ]; then
  error='"CAPTURE_FAILED"'; report; exit 1
fi
capture=RAW_UNVERIFIED
upload=FAILED
upload_rc=0
aws s3 cp "$TMP/archive.tar.zst" "s3://${BUCKET}/${KEY}" \
  --endpoint-url "$AWS_ENDPOINT_URL_S3" >/dev/null 2>&1 || upload_rc=$?

# Object presence is independent of the upload exit code, never recovery proof.
object=FAILED
# Read directly from a bounded pipe, never spool arbitrary AWS output to disk.
# Require EOF within 17 bytes (1–16 digits + newline). A NUL or an 18th byte
# ends read successfully and is rejected; no excess output is retained.
# pipefail also rejects a failed producer, even if it emitted a valid size first.
if aws s3api head-object --bucket "$BUCKET" --key "$KEY" \
  --endpoint-url "$AWS_ENDPOINT_URL_S3" --query ContentLength --output text 2>/dev/null |
  { ! IFS= LC_ALL=C read -r -d '' -n 18 size && [[ "$size" =~ ^[1-9][0-9]{0,15}$'\n'$ ]]; }; then
  object=PRESENT
fi
if [ "$upload_rc" -ne 0 ]; then
  error='"UPLOAD_FAILED"'; report; exit 1
fi
if [ "$object" != PRESENT ]; then
  error='"OBJECT_FAILED"'; report; exit 1
fi
upload=PRESENT
error=null
report
exit 3
