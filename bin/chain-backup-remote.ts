#!/usr/bin/env bun
/**
 * Online salvage capture, NOT a coherent or recovery-verified backup.
 * Tar 0 and 1 both remain RAW_UNVERIFIED. Object presence proves only storage.
 * No listing/pruning: every existing object is preserved; storage will grow.
 *
 * Run: bun bin/chain-backup-remote.ts [zerone-1|zerone-testnet-1]
 * Exit: 3 unverified capture(s) present, 1 operational failure (including a
 * low-disk skip on either chain), 2 usage error.
 * Installation/launchd activation is a separate authorised operation.
 */

import { createHash, createHmac } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

const ENDPOINT = "https://fly.storage.tigris.dev";
const BUCKET = "kingdom-vault";
const REGION = "auto";
const CHAINS = ["zerone-testnet-1", "zerone-1"] as const;
// The URL is signed before the remote tar starts. A CPU-credit-throttled Fly
// machine has spent over 2 h in tar alone, so a 2 h URL expired before curl began.
export const UPLOAD_URL_TTL_SECONDS = 12 * 60 * 60;
export type Chain = typeof CHAINS[number];
export const MAX_REMOTE_RESULT_BYTES = 128;
// Validator identity keys stay out of NEW archives; data/priv_validator_state.json
// stays in. Older archives, the Fly volume and its snapshots still hold the keys,
// so no copy is lost. With one validator, restoring a key-bearing archive onto a
// second machine would double-sign.
export const EXCLUDED_KEY_FILES = ["priv_validator_key.json", "node_key.json"] as const;
// Staging is on the validator's small rootfs. Skip rather than fill it when free
// space is below the last landed archive plus this margin.
export const LOW_DISK_MARGIN_BYTES = 1024 ** 3;
// The capture changes above (key exclusion, low-disk pre-flight) apply only to
// these chains. Testnet went first; mainnet joined after testnet's clean night of
// 2026-10-21 (ledger zc-chain-backup-runner). A chain outside this list would run
// the 2026-10-19 capture unchanged.
export const ROLLOUT_CHAINS: readonly Chain[] = ["zerone-testnet-1", "zerone-1"];
// Streamed multipart capture: tar's gzip stream is cut into fixed parts on the
// remote and each part goes straight to a presigned UploadPart URL. Tigris
// refuses a chunked (unknown-length) PUT with 411, so each part is buffered as one
// file of at most PART_BYTES before its PUT: peak rootfs use is one part, not
// the whole archive. Testnet rehearses it for several nights before mainnet
// joins (ledger zc-chain-backup-runner). A rollout chain outside this list keeps
// the staged capture, byte for byte.
export const STREAM_CHAINS: readonly Chain[] = ["zerone-testnet-1"];
export const PART_BYTES = 256 * 1024 ** 2;
// 64 parts = a 16 GiB ceiling; testnet's 2026-10-27 archive was 6876956202 bytes (26 parts).
export const MAX_PARTS = 64;
// Every part URL rides in the one bash -c argument; Linux caps one argument at 128 KiB.
export const MAX_REMOTE_COMMAND_BYTES = 96 * 1024;
const MAX_S3_RESPONSE_BYTES = 256 * 1024;
const S3_TIMEOUT_MS = 120_000;

type StreamUpload = number | "OVER" | "STAGE" | null;
type RemoteResult =
  | { kind: "capture"; tarExit: number | null; uploadExit: number | null; uploadHttp: number | null }
  | { kind: "skip"; freeKib: number | null; needKib: number }
  | { kind: "stream"; tarExit: number | null; parts: number; upload: StreamUpload; uploadHttp: number | null };
type Presence = "PRESENT" | "FAILED" | "NOT_ATTEMPTED";
export type Outcome = {
  chain: Chain;
  capture_status: "RAW_UNVERIFIED" | "FAILED" | "SKIPPED";
  tar_exit: number | null;
  upload_status: Presence;
  upload_exit: number | null;
  upload_http: number | null; // curl's %{http_code}; 0 = no HTTP response
  object_status: Presence;
  ssh_exit: number | null;
  recovery_status: "NOT_ASSESSED";
  retention_status: "DISABLED";
  key_files: "EXCLUDED" | "INCLUDED"; // what this capture was asked to archive
  disk_free_kib: number | null; // reported only by a low-disk skip
  disk_need_kib: number | null; // last landed archive + margin; null = no pre-flight
  landed_marker: "WRITTEN" | "FAILED" | "NOT_WRITTEN";
  capture_mode: "STAGED" | "STREAMED_MULTIPART";
  parts: number | null; // streamed: parts the remote reports uploaded
  // OPEN: created and never completed (a skip or a torn stream); UNKNOWN: the
  // complete call failed, so whether the object exists is for stat to say.
  multipart_status: "NOT_STARTED" | "OPEN" | "COMPLETED" | "UNKNOWN";
  error: "SETUP_FAILED" | "REMOTE_FAILED" | "PROTOCOL_FAILED" | "CAPTURE_FAILED" | "UPLOAD_FAILED" | "MULTIPART_FAILED" | "OBJECT_FAILED" | "SKIPPED_LOW_DISK" | null;
};

export type UploadedPart = { partNumber: number; etag: string; size: number };

// Deliberately no capability to list or delete stored generations in this lane.
// Multipart calls touch only the one upload this run created; an upload left
// OPEN is never aborted here. The landed marker is local state: written only
// after an upload lands, read for its byte count.
export type Effects = {
  captureId(): string;
  presign(key: string): string;
  remote(chain: Chain, command: string): Promise<{ code: number; stdout: string | null }>;
  stat(key: string): Promise<{ size: number }>;
  lastLandedBytes(chain: Chain): Promise<number | null>;
  markLanded(chain: Chain, bytes: number, keyFiles: Outcome["key_files"]): Promise<void>;
  multipart: {
    create(key: string): Promise<string>;
    presignPart(key: string, uploadId: string, partNumber: number): string;
    listParts(key: string, uploadId: string): Promise<UploadedPart[]>;
    complete(key: string, uploadId: string, parts: readonly UploadedPart[]): Promise<void>;
  };
};

export type CaptureOptions = { excludeKeys: boolean; needKib: number | null };
export type StreamOptions = { excludeKeys: boolean; needKib: number; partBytes?: number };

export function needKib(lastLandedBytes: number | null): number {
  const last = Number.isSafeInteger(lastLandedBytes) && lastLandedBytes! > 0 ? lastLandedBytes! : 0;
  return Math.ceil((last + LOW_DISK_MARGIN_BYTES) / 1024);
}

// A streamed capture stages one part at a time, so its bound no longer grows
// with the archive: one part plus the same margin.
export function streamNeedKib(partBytes: number = PART_BYTES): number {
  return Math.ceil((partBytes + LOW_DISK_MARGIN_BYTES) / 1024);
}

export function parseArgs(args: string[]): readonly Chain[] | null {
  if (args.length === 0) return CHAINS;
  if (args.length === 1 && CHAINS.includes(args[0] as Chain)) return [args[0] as Chain];
  return null;
}

export function captureStatus(tarExit: number | null): Outcome["capture_status"] {
  return tarExit === 0 || tarExit === 1 ? "RAW_UNVERIFIED" : "FAILED";
}

export function parseRemoteResult(output: string | null): RemoteResult | null {
  if (output === null || output.length > MAX_REMOTE_RESULT_BYTES) return null;
  // Exactly one ASCII record; no banners, duplicate results, raw stderr or suffixes.
  const skip = /^CHAIN_BACKUP_V2 skip=LOW_DISK free_kib=(NA|0|[1-9][0-9]{0,15}) need_kib=([1-9][0-9]{0,15})\n$/.exec(output);
  if (skip && skip[0] === output) {
    const freeKib = skip[1] === "NA" ? null : Number(skip[1]);
    const needKib = Number(skip[2]);
    if ((freeKib !== null && !Number.isSafeInteger(freeKib)) || !Number.isSafeInteger(needKib)) return null;
    // A skip with room to spare is invented; refuse it rather than log it.
    if (freeKib !== null && freeKib >= needKib) return null;
    return { kind: "skip", freeKib, needKib };
  }
  const stream = /^CHAIN_BACKUP_V3 tar=(NA|0|[1-9][0-9]{0,2}) parts=(0|[1-9][0-9]{0,4}) upload=(NA|OVER|STAGE|0|[1-9][0-9]{0,2}) http=(NA|[0-9]{3})\n$/.exec(output);
  if (stream && stream[0] === output) {
    const tarExit = stream[1] === "NA" ? null : Number(stream[1]);
    const parts = Number(stream[2]);
    const upload: StreamUpload = stream[3] === "NA" ? null : stream[3] === "OVER" || stream[3] === "STAGE" ? stream[3] : Number(stream[3]);
    const uploadHttp = stream[4] === "NA" ? null : Number(stream[4]);
    if ((tarExit !== null && tarExit > 255) || (typeof upload === "number" && upload > 255)) return null;
    // Setup failure: nothing ran, so nothing can be reported beside it.
    if (tarExit === null && (parts !== 0 || upload !== null || uploadHttp !== null)) return null;
    // No part attempted: no count and no status.
    if (upload === null && (parts !== 0 || uploadHttp !== null)) return null;
    // A clean finish needs at least one landed part; OVER only follows a full set.
    if ((upload === 0 || upload === "OVER") && parts === 0) return null;
    // A status belongs to an attempt: the failing one, or the last landed part.
    if (uploadHttp !== null && typeof upload !== "number" && parts === 0) return null;
    return { kind: "stream", tarExit, parts, upload, uploadHttp };
  }
  const match = /^CHAIN_BACKUP_V2 tar=(NA|0|[1-9][0-9]{0,2}) upload=(NA|0|[1-9][0-9]{0,2}) http=(NA|[0-9]{3})\n$/.exec(output);
  if (!match || match[0] !== output) return null;
  const tarExit = match[1] === "NA" ? null : Number(match[1]);
  const uploadExit = match[2] === "NA" ? null : Number(match[2]);
  const uploadHttp = match[3] === "NA" ? null : Number(match[3]);
  if ((tarExit !== null && tarExit > 255) || (uploadExit !== null && uploadExit > 255)) return null;
  if ((tarExit === null || tarExit > 1) !== (uploadExit === null)) return null;
  // A status without an upload attempt is invented; an attempt may lack one.
  if (uploadExit === null && uploadHttp !== null) return null;
  return { kind: "capture", tarExit, uploadExit, uploadHttp };
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function excludeFlags(excludeKeys: boolean): string {
  return excludeKeys ? EXCLUDED_KEY_FILES.map((name) => ` --exclude=${name}`).join("") : "";
}

function preflightLines(need: number): string[] {
  return [
    // Free KiB on the staging filesystem, from df's last line; anything else is unknown.
    "free=NA",
    'while read -r _ _ _ avail _; do free=$avail; done < <(df -Pk -- "$tmp" 2>/dev/null)',
    'case "$free" in ""|*[!0-9]*) free=NA ;; esac',
    `if [ "$free" = NA ] || [ "$free" -lt ${need} ]; then printf "CHAIN_BACKUP_V2 skip=LOW_DISK free_kib=%s need_kib=%s\\n" "$free" ${need}; exit 0; fi`,
  ];
}

export function buildRemoteCommand(
  putUrl: string,
  options: CaptureOptions = { excludeKeys: false, needKib: null },
): string {
  // Tigris PUT needs Content-Length; use a private ephemeral file, not a pipe.
  // The URL is shell-quoted data, never printed. No remote command output escapes:
  // curl's stdout carries only the write-out, and only three digits are kept.
  const need = options.needKib;
  if (need !== null && (!Number.isSafeInteger(need) || need <= 0)) throw new Error("invalid pre-flight bound");
  // GNU tar exclusion patterns are unanchored: these names are dropped wherever
  // they sit, while data/priv_validator_state.json is kept.
  const excludes = excludeFlags(options.excludeKeys);
  const preflight = need === null ? [] : preflightLines(need);
  const script = [
    "umask 077",
    'tmp=$(mktemp -d "${TMPDIR:-/tmp}/chain-backup.XXXXXXXXXX" 2>/dev/null) || { printf "CHAIN_BACKUP_V2 tar=NA upload=NA http=NA\\n"; exit 0; }',
    `trap 'rm -f -- "$tmp/archive.tar.gz" >/dev/null 2>&1; rmdir -- "$tmp" >/dev/null 2>&1' EXIT`,
    ...preflight,
    `tar czf "$tmp/archive.tar.gz" --warning=no-file-changed${excludes} -C /data .zeroned/data .zeroned/config >/dev/null 2>&1`,
    "tar_rc=$?",
    "upload_rc=NA",
    "http=NA",
    'if [ "$tar_rc" -le 1 ]; then',
    `  code=$(curl -sS --fail -o /dev/null -w "%{http_code}" -X PUT -T "$tmp/archive.tar.gz" -- ${shellQuote(putUrl)} 2>/dev/null)`,
    "  upload_rc=$?",
    '  case "$code" in [0-9][0-9][0-9]) http=$code ;; esac',
    "fi",
    'printf "CHAIN_BACKUP_V2 tar=%s upload=%s http=%s\\n" "$tar_rc" "$upload_rc" "$http"',
  ].join("\n");
  return `bash -c ${shellQuote(script)}`;
}

export function buildStreamedRemoteCommand(partUrls: readonly string[], options: StreamOptions): string {
  // tar's stdout is the archive; it never reaches SSH. head -c (GNU) reads
  // exactly one part from the pipe into the private directory, curl -T sends it
  // with a Content-Length, and the part is overwritten by the next one. Only the
  // one fixed-format record leaves the machine, as in the staged capture.
  const need = options.needKib;
  const part = options.partBytes ?? PART_BYTES;
  if (!Number.isSafeInteger(need) || need <= 0) throw new Error("invalid pre-flight bound");
  // S3 multipart: 5 MiB to 5 GiB per part (only the last may be smaller); tests use tiny parts.
  if (!Number.isSafeInteger(part) || part <= 0 || part > 5 * 1024 ** 3) throw new Error("invalid part size");
  if (partUrls.length < 1 || partUrls.length > 10000) throw new Error("invalid part count");
  const script = [
    "umask 077",
    'tmp=$(mktemp -d "${TMPDIR:-/tmp}/chain-backup.XXXXXXXXXX" 2>/dev/null) || { printf "CHAIN_BACKUP_V3 tar=NA parts=0 upload=NA http=NA\\n"; exit 0; }',
    `trap 'rm -f -- "$tmp/part" >/dev/null 2>&1; rmdir -- "$tmp" >/dev/null 2>&1' EXIT`,
    ...preflightLines(need),
    `u=(${partUrls.map(shellQuote).join(" ")})`,
    // The loop's counters and then tar's status (PIPESTATUS[0]) come back as one
    // captured line. An early break closes the pipe under tar, so a torn stream
    // reports tar > 1.
    `r=$(tar czf - --warning=no-file-changed${excludeFlags(options.excludeKeys)} -C /data .zeroned/data .zeroned/config 2>/dev/null | {`,
    "  parts=0 upload=NA http=NA",
    "  while :; do",
    `    head -c ${part} > "$tmp/part" 2>/dev/null || { upload=STAGE; break; }`,
    '    [ -s "$tmp/part" ] || break',
    `    if [ "$parts" -ge ${partUrls.length} ]; then upload=OVER; break; fi`,
    '    code=$(curl -sS --fail -o /dev/null -w "%{http_code}" -X PUT -T "$tmp/part" -- "${u[$parts]}" 2>/dev/null </dev/null)',
    "    upload=$?",
    // "(pattern)" form: a bare ")" would close the $( ) early in bash 3.2 and 5.x.
    '    http=NA; case "$code" in ([0-9][0-9][0-9]) http=$code ;; esac',
    '    [ "$upload" -eq 0 ] || break',
    "    parts=$((parts + 1))",
    "  done",
    '  printf "%s %s %s" "$parts" "$upload" "$http"',
    '}; printf " %s" "${PIPESTATUS[0]}")',
    "set -f; set -- $r; parts=$1 upload=$2 http=$3 tar_rc=$4",
    'rm -f -- "$tmp/part" >/dev/null 2>&1',
    'printf "CHAIN_BACKUP_V3 tar=%s parts=%s upload=%s http=%s\\n" "${tar_rc:-NA}" "${parts:-0}" "${upload:-NA}" "${http:-NA}"',
  ].join("\n");
  const command = `bash -c ${shellQuote(script)}`;
  if (command.length > MAX_REMOTE_COMMAND_BYTES) throw new Error("remote command too long");
  return command;
}

// Bound memory while reading, not only after buffering all subprocess output.
// The caller terminates its own child on overflow; no raw bytes reach the log.
export async function readBoundedOutput(stream: ReadableStream<Uint8Array>, limit: number): Promise<string | null> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function emptyOutcome(chain: Chain): Outcome {
  return {
    chain, capture_status: "FAILED", tar_exit: null,
    upload_status: "NOT_ATTEMPTED", upload_exit: null, upload_http: null, object_status: "NOT_ATTEMPTED",
    ssh_exit: null, recovery_status: "NOT_ASSESSED", retention_status: "DISABLED",
    key_files: ROLLOUT_CHAINS.includes(chain) ? "EXCLUDED" : "INCLUDED",
    disk_free_kib: null, disk_need_kib: null, landed_marker: "NOT_WRITTEN",
    capture_mode: ROLLOUT_CHAINS.includes(chain) && STREAM_CHAINS.includes(chain) ? "STREAMED_MULTIPART" : "STAGED",
    parts: null, multipart_status: "NOT_STARTED", error: "SETUP_FAILED",
  };
}

// The listing must be exactly the parts the remote reports, in order: every part
// but the last is one full part, and the last holds 1 byte to one full part.
export function partsAreWhole(listed: readonly UploadedPart[], count: number, partBytes: number = PART_BYTES): boolean {
  if (!Array.isArray(listed) || count < 1 || listed.length !== count) return false;
  return listed.every((part, index) =>
    part.partNumber === index + 1 &&
    typeof part.etag === "string" && /^[\x21-\x7e]{1,256}$/.test(part.etag) &&
    Number.isSafeInteger(part.size) &&
    (index < count - 1 ? part.size === partBytes : part.size >= 1 && part.size <= partBytes));
}

export async function captureChain(chain: Chain, effects: Effects): Promise<Outcome> {
  const result = emptyOutcome(chain);
  const streamed = result.capture_mode === "STREAMED_MULTIPART";
  let key: string;
  let command: string;
  let uploadId = "";
  let partLimit = 0;
  try {
    const id = effects.captureId();
    if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) return result;
    key = `chain/${chain}/${chain}-data-${id}.tar.gz`;
    if (streamed) {
      // The bound is one part plus the margin; the landed marker no longer sizes it.
      result.disk_need_kib = streamNeedKib();
      uploadId = await effects.multipart.create(key);
      if (typeof uploadId !== "string" || !/^[\x21-\x7e]{1,1024}$/.test(uploadId)) return result;
      result.multipart_status = "OPEN";
      const urls = Array.from({ length: MAX_PARTS }, (_, index) => effects.multipart.presignPart(key, uploadId, index + 1));
      partLimit = urls.length;
      command = buildStreamedRemoteCommand(urls, { excludeKeys: true, needKib: result.disk_need_kib });
    } else {
      let options: CaptureOptions = { excludeKeys: false, needKib: null };
      if (ROLLOUT_CHAINS.includes(chain)) {
        let last: number | null = null;
        try { last = await effects.lastLandedBytes(chain); } catch { /* unknown: margin only */ }
        options = { excludeKeys: true, needKib: needKib(last) };
        result.disk_need_kib = options.needKib;
      }
      command = buildRemoteCommand(effects.presign(key), options);
    }
  } catch {
    return result;
  }

  let remote: Awaited<ReturnType<Effects["remote"]>>;
  // On transport/protocol failure upload may have occurred; never call it absent.
  result.upload_status = "FAILED";
  result.error = "REMOTE_FAILED";
  try {
    remote = await effects.remote(chain, command);
    result.ssh_exit = Number.isInteger(remote.code) && remote.code >= 0 && remote.code <= 255 ? remote.code : null;
  } catch {
    return result;
  }
  const report = parseRemoteResult(remote.stdout);
  // A skip record is only believed from a chain that was asked to pre-flight,
  // and a capture record only in the protocol this chain was sent.
  if (!report || (report.kind === "skip" && report.needKib !== result.disk_need_kib) ||
      (report.kind === "stream" && (!streamed || report.parts > partLimit || (report.upload === "OVER" && report.parts !== partLimit))) ||
      (report.kind === "capture" && streamed)) {
    result.error = "PROTOCOL_FAILED";
    return result;
  }
  if (report.kind === "skip") {
    // Nothing was archived or uploaded; the rootfs was left alone. A streamed
    // chain's upload stays OPEN with no parts.
    result.capture_status = "SKIPPED";
    result.upload_status = "NOT_ATTEMPTED";
    result.disk_free_kib = report.freeKib;
    result.error = "SKIPPED_LOW_DISK";
    return result;
  }
  if (report.kind === "stream") return finishStream(chain, result, report, key, uploadId, effects);
  result.tar_exit = report.tarExit;
  result.capture_status = captureStatus(report.tarExit);
  result.upload_exit = report.uploadExit;
  result.upload_http = report.uploadHttp;
  result.error = result.ssh_exit === 0 ? null : "REMOTE_FAILED";
  if (report.uploadExit === null) {
    result.upload_status = "NOT_ATTEMPTED";
    result.error ??= report.tarExit === null ? "SETUP_FAILED" : "CAPTURE_FAILED";
    return result;
  }

  // Check independently even if curl or SSH reported failure: presence cannot
  // erase either failure, and a failed check does not prove an object is absent.
  result.object_status = "FAILED";
  let size = 0;
  try {
    const stat = await effects.stat(key);
    if (Number.isSafeInteger(stat.size) && stat.size > 0) {
      result.object_status = "PRESENT";
      size = stat.size;
    }
  } catch { /* fixed status only; SDK errors can include signed request URLs */ }
  if (report.uploadExit !== 0) result.error ??= "UPLOAD_FAILED";
  else if (result.object_status !== "PRESENT") result.error ??= "OBJECT_FAILED";
  else result.upload_status = "PRESENT";
  // The landed marker is pulse's per-chain heartbeat and the next pre-flight's
  // size: only a clean landing writes it. Its failure is reported, not hidden.
  if (result.error === null && result.upload_status === "PRESENT") {
    try {
      await effects.markLanded(chain, size, result.key_files);
      result.landed_marker = "WRITTEN";
    } catch {
      result.landed_marker = "FAILED";
    }
  }
  return result;
}

async function finishStream(
  chain: Chain, result: Outcome, report: Extract<RemoteResult, { kind: "stream" }>,
  key: string, uploadId: string, effects: Effects,
): Promise<Outcome> {
  result.tar_exit = report.tarExit;
  result.capture_status = captureStatus(report.tarExit);
  result.upload_exit = typeof report.upload === "number" ? report.upload : null;
  result.upload_http = report.uploadHttp;
  result.parts = report.parts;
  result.error = result.ssh_exit === 0 ? null : "REMOTE_FAILED";
  if (report.upload === null) {
    result.upload_status = "NOT_ATTEMPTED";
    result.error ??= report.tarExit === null ? "SETUP_FAILED" : "CAPTURE_FAILED";
    return result;
  }
  // Only a whole stream (every part landed, tar 0 or 1) is completed. A torn one
  // stays OPEN: never completed into a truncated archive, never aborted here.
  if (report.upload !== 0) result.error ??= "UPLOAD_FAILED";
  else if (report.tarExit === null || report.tarExit > 1) result.error ??= "CAPTURE_FAILED";
  if (report.upload !== 0 || report.tarExit === null || report.tarExit > 1) return result;

  let listed: UploadedPart[];
  try {
    listed = await effects.multipart.listParts(key, uploadId);
    if (!partsAreWhole(listed, report.parts)) throw new Error("parts");
  } catch {
    result.error ??= "MULTIPART_FAILED";
    return result;
  }
  const expected = listed.reduce((total, part) => total + part.size, 0);
  try {
    await effects.multipart.complete(key, uploadId, listed);
    result.multipart_status = "COMPLETED";
  } catch {
    // The object may still have been assembled; stat decides presence below.
    result.multipart_status = "UNKNOWN";
    result.error ??= "MULTIPART_FAILED";
  }
  // As in the staged capture: presence cannot erase a failure, and a failed
  // check does not prove the object absent. The size must equal the parts' sum.
  result.object_status = "FAILED";
  try {
    const stat = await effects.stat(key);
    if (Number.isSafeInteger(stat.size) && stat.size > 0 && stat.size === expected) result.object_status = "PRESENT";
  } catch { /* fixed status only */ }
  if (result.object_status !== "PRESENT") result.error ??= "OBJECT_FAILED";
  else {
    result.upload_status = "PRESENT";
    if (result.multipart_status === "UNKNOWN") result.multipart_status = "COMPLETED";
  }
  if (result.error === null && result.upload_status === "PRESENT") {
    try {
      await effects.markLanded(chain, expected, result.key_files);
      result.landed_marker = "WRITTEN";
    } catch {
      result.landed_marker = "FAILED";
    }
  }
  return result;
}

export async function main(
  args: string[],
  createEffects: () => Promise<Effects> = productionEffects,
  log: (line: string) => void = console.log,
): Promise<1 | 2 | 3> {
  const chains = parseArgs(args);
  if (!chains) {
    log("Usage: bun bin/chain-backup-remote.ts [zerone-1|zerone-testnet-1]");
    return 2;
  }
  let effects: Effects;
  try {
    effects = await createEffects();
  } catch {
    for (const chain of chains) log(JSON.stringify(emptyOutcome(chain)));
    return 1;
  }
  let failed = false;
  for (const chain of chains) {
    const result = await captureChain(chain, effects);
    log(JSON.stringify(result));
    failed ||= result.error !== null;
  }
  return failed ? 1 : 3;
}

// AWS Signature V4, only for the multipart calls Bun.S3Client does not expose
// (create, presigned UploadPart, list one upload's parts, complete). Same shape
// as Bun's own requests: path-style, UNSIGNED-PAYLOAD, region "auto".
export function awsUriEncode(value: string, keepSlash = false): string {
  let out = "";
  for (const byte of new TextEncoder().encode(value)) {
    const char = String.fromCharCode(byte);
    out += /[A-Za-z0-9_.~-]/.test(char) || (keepSlash && char === "/") ? char : `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  return out;
}

function canonicalQuery(query: Record<string, string>): string {
  return Object.entries(query)
    .map(([name, value]) => [awsUriEncode(name), awsUriEncode(value)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`).join("&");
}

export type SigningRequest = {
  method: string; host: string; path: string; query: Record<string, string>;
  headers: Record<string, string>; payloadHash: string; amzDate: string;
  region: string; accessKeyId: string; secretAccessKey: string;
};

export function sigv4(request: SigningRequest): { signature: string; signedHeaders: string; scope: string } {
  if (!/^[0-9]{8}T[0-9]{6}Z$/.test(request.amzDate)) throw new Error("invalid signing date");
  const headers = new Map(Object.entries(request.headers).map(([name, value]) => [name.toLowerCase(), value.trim().replace(/\s+/g, " ")]));
  const names = [...headers.keys()].sort();
  const signedHeaders = names.join(";");
  const canonical = [
    request.method, awsUriEncode(request.path, true), canonicalQuery(request.query),
    names.map((name) => `${name}:${headers.get(name)}\n`).join(""), signedHeaders, request.payloadHash,
  ].join("\n");
  const day = request.amzDate.slice(0, 8);
  const scope = `${day}/${request.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", request.amzDate, scope, createHash("sha256").update(canonical).digest("hex")].join("\n");
  let key: Buffer = createHmac("sha256", `AWS4${request.secretAccessKey}`).update(day).digest();
  for (const part of [request.region, "s3", "aws4_request"]) key = createHmac("sha256", key).update(part).digest();
  return { signature: createHmac("sha256", key).update(toSign).digest("hex"), signedHeaders, scope };
}

export type Signer = { endpoint: string; bucket: string; region: string; accessKeyId: string; secretAccessKey: string };

export function presignS3Url(
  signer: Signer, method: string, key: string, query: Record<string, string>, expiresIn: number, amzDate: string,
): string {
  const path = `/${signer.bucket}/${key}`;
  const host = new URL(signer.endpoint).host;
  const signed = {
    ...query,
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${signer.accessKeyId}/${amzDate.slice(0, 8)}/${signer.region}/s3/aws4_request`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  };
  const { signature } = sigv4({ method, host, path, query: signed, headers: { host }, payloadHash: "UNSIGNED-PAYLOAD", amzDate, ...signer });
  return `${signer.endpoint}${awsUriEncode(path, true)}?${canonicalQuery({ ...signed, "X-Amz-Signature": signature })}`;
}

function xmlUnescape(text: string): string {
  return text.replace(/&(quot|amp|lt|gt|apos|#34|#39);/g, (_, name: string) =>
    ({ quot: '"', amp: "&", lt: "<", gt: ">", apos: "'", "#34": '"', "#39": "'" })[name]!);
}

function xmlEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function parseUploadId(xml: string): string | null {
  const match = /<UploadId>([^<]{1,1024})<\/UploadId>/.exec(xml);
  return match ? xmlUnescape(match[1]) : null;
}

export function parseListParts(xml: string): UploadedPart[] | null {
  if (/<IsTruncated>\s*true\s*<\/IsTruncated>/.test(xml) || /<Error>/.test(xml)) return null;
  const parts: UploadedPart[] = [];
  for (const block of xml.matchAll(/<Part>([\s\S]*?)<\/Part>/g)) {
    const field = (name: string) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(block[1])?.[1] ?? null;
    const number = field("PartNumber");
    const size = field("Size");
    const etag = field("ETag");
    if (!number || !/^[1-9][0-9]{0,4}$/.test(number) || !size || !/^(0|[1-9][0-9]{0,15})$/.test(size) || !etag) return null;
    parts.push({ partNumber: Number(number), etag: xmlUnescape(etag), size: Number(size) });
  }
  return parts.sort((a, b) => a.partNumber - b.partNumber);
}

export function completeBody(parts: readonly UploadedPart[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">${
    parts.map((part) => `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${xmlEscape(part.etag)}</ETag></Part>`).join("")
  }</CompleteMultipartUpload>`;
}

const amzNow = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.[0-9]+Z$/, "Z");

// Header-signed calls through fetch. Responses are read bounded; errors are
// replaced by fixed ones, because fetch errors can carry request URLs.
export function multipartEffects(signer: Signer, request: typeof fetch = fetch, now: () => string = amzNow): Effects["multipart"] {
  async function call(method: string, key: string, query: Record<string, string>, body?: string): Promise<{ status: number; text: string | null }> {
    try {
      const path = `/${signer.bucket}/${key}`;
      const amzDate = now();
      const headers = { host: new URL(signer.endpoint).host, "x-amz-content-sha256": "UNSIGNED-PAYLOAD", "x-amz-date": amzDate };
      const { signature, signedHeaders, scope } = sigv4({ method, host: headers.host, path, query, headers, payloadHash: "UNSIGNED-PAYLOAD", amzDate, ...signer });
      const response = await request(`${signer.endpoint}${awsUriEncode(path, true)}?${canonicalQuery(query)}`, {
        method, body, signal: AbortSignal.timeout(S3_TIMEOUT_MS),
        headers: {
          "x-amz-content-sha256": "UNSIGNED-PAYLOAD", "x-amz-date": amzDate,
          authorization: `AWS4-HMAC-SHA256 Credential=${signer.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
        },
      });
      const text = response.body ? await readBoundedOutput(response.body, MAX_S3_RESPONSE_BYTES) : "";
      return { status: response.status, text };
    } catch {
      throw new Error("multipart request failed");
    }
  }
  return {
    async create(key) {
      const { status, text } = await call("POST", key, { uploads: "" });
      const uploadId = status === 200 && text !== null ? parseUploadId(text) : null;
      if (uploadId === null) throw new Error("multipart create failed");
      return uploadId;
    },
    presignPart: (key, uploadId, partNumber) =>
      presignS3Url(signer, "PUT", key, { partNumber: String(partNumber), uploadId }, UPLOAD_URL_TTL_SECONDS, now()),
    async listParts(key, uploadId) {
      const { status, text } = await call("GET", key, { uploadId, "max-parts": "1000" });
      const parts = status === 200 && text !== null ? parseListParts(text) : null;
      if (parts === null) throw new Error("multipart list failed");
      return parts;
    },
    async complete(key, uploadId, parts) {
      const { status, text } = await call("POST", key, { uploadId }, completeBody(parts));
      // S3 can answer 200 with an <Error> body; only a result element is success.
      if (status !== 200 || text === null || !text.includes("<CompleteMultipartUploadResult") || text.includes("<Error>")) {
        throw new Error("multipart complete failed");
      }
    },
  };
}

async function productionEffects(): Promise<Effects> {
  async function keychain(service: string): Promise<string> {
    const proc = Bun.spawn(["security", "find-generic-password", "-s", service, "-w"], { stdout: "pipe", stderr: "ignore" });
    const output = await readBoundedOutput(proc.stdout, 4096);
    if (output === null) proc.kill();
    if ((await proc.exited) !== 0 || !output?.trim()) throw new Error("credential unavailable");
    return output.trim();
  }
  const signer: Signer = {
    endpoint: ENDPOINT, bucket: BUCKET, region: REGION,
    accessKeyId: await keychain("agenttool-tigris-access-key"),
    secretAccessKey: await keychain("agenttool-tigris-secret-key"),
  };
  const s3 = new Bun.S3Client({
    accessKeyId: signer.accessKeyId,
    secretAccessKey: signer.secretAccessKey,
    endpoint: ENDPOINT, bucket: BUCKET, region: "auto",
  });
  const home = process.env.HOME;
  if (!home || !home.startsWith("/")) throw new Error("HOME unavailable");
  const markerDir = `${home}/.kingdom/state/chain-backup`;
  const markerPath = (chain: Chain) => `${markerDir}/${chain}.landed`;
  return {
    async lastLandedBytes(chain) {
      const text = await readFile(markerPath(chain), "utf8").catch(() => null);
      if (text === null || text.length > 4096) return null;
      try {
        const marker = JSON.parse(text);
        return marker?.chain === chain && Number.isSafeInteger(marker.bytes) && marker.bytes > 0 ? marker.bytes : null;
      } catch {
        return null;
      }
    },
    async markLanded(chain, bytes, keyFiles) {
      await mkdir(markerDir, { recursive: true, mode: 0o700 });
      const body = JSON.stringify({
        protocol: "kingdom.chain-backup.landed/1", chain, landed_at: new Date().toISOString(),
        bytes, capture_status: "RAW_UNVERIFIED", key_files: keyFiles,
      }) + "\n";
      // Same-directory rename: pulse never sees a half-written marker.
      const staging = `${markerPath(chain)}.${process.pid}.tmp`;
      await writeFile(staging, body, { mode: 0o600 });
      await rename(staging, markerPath(chain));
    },
    // UUID prevents same-second invocations from overwriting earlier captures.
    captureId: () => `${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z")}-${crypto.randomUUID()}`,
    presign: (key) => s3.presign(key, { method: "PUT", expiresIn: UPLOAD_URL_TTL_SECONDS }),
    stat: (key) => s3.stat(key),
    multipart: multipartEffects(signer),
    async remote(chain, command) {
      const proc = Bun.spawn(["flyctl", "ssh", "console", "-a", chain, "-C", command], { stdout: "pipe", stderr: "ignore" });
      const stdout = await readBoundedOutput(proc.stdout, MAX_REMOTE_RESULT_BYTES);
      if (stdout === null) proc.kill();
      return { code: await proc.exited, stdout };
    },
  };
}

if (import.meta.main) {
  process.exitCode = await main(process.argv.slice(2));
}
