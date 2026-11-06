#!/usr/bin/env bun
/**
 * Online salvage capture, NOT a coherent or recovery-verified backup.
 * Tar 0 and 1 both remain RAW_UNVERIFIED. Object presence proves only storage.
 * No listing/pruning: every existing object is preserved; storage will grow.
 *
 * Run: bun bin/chain-backup-remote.ts [zerone-1|zerone-testnet-1]
 * Exit: 3 unverified capture(s) present, 1 operational failure (including a
 * low-disk skip on either chain or a timeout), 2 usage error.
 * Every child has a hard wall-clock bound, and the whole run exits by RUN_DEADLINE_MS.
 * Installation/launchd activation is a separate authorised operation.
 */

import { createHash, createHmac } from "node:crypto";
import { closeSync, mkdirSync, openSync, writeSync } from "node:fs";
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

// Hard bounds (ledger zc-chain-backup-runner, 2026-11-05). The 2026-10-29 run hung
// for 7 days: testnet's flyctl ssh session never returned although nothing was left
// running on the remote, and it blocked every later night for both chains.
// One flyctl ssh session is one whole remote capture. Testnet's slowest observed:
// 2h14m staged (2026-10-27, landed 05:47 after a 03:33 start) and about 2h34m
// streamed (2026-10-29, the remote's /tmp last changed at 06:07); on CPU-throttled
// nights tar alone took 2h05-2h19. 4 h is about 1.5 times the slowest.
export const SSH_TIMEOUT_MS = 4 * 60 * 60 * 1000;
// A keychain read answers at once or not at all.
export const CREDENTIAL_TIMEOUT_MS = 60_000;
// On expiry the child's whole process group gets SIGTERM, then SIGKILL this long
// after. Also how long a child's pipes may stay open, held by a descendant, after
// the child itself has exited.
export const KILL_GRACE_MS = 10_000;
// The whole run ends by then, leaving the next 03:33 free: room for both chains'
// full SSH bounds. No child runs, and no chain starts, in the last
// FINISH_RESERVE_MS, which are kept for the S3 calls (2 min each at most) that
// finish a capture. At the deadline every unfinished chain is logged as
// TIMEOUT_DEADLINE and the process exits.
export const RUN_DEADLINE_MS = 8 * 60 * 60 * 1000;
export const FINISH_RESERVE_MS = 10 * 60 * 1000;
// Timers pause while the Mac sleeps; deadlines re-read the wall clock this often.
const CLOCK_TICK_MS = 60_000;
export type Limits = {
  sshMs: number; credentialMs: number; killGraceMs: number; runDeadlineMs: number; finishReserveMs: number; tickMs: number;
  clock?: Clock; // tests only: the system clock otherwise
};
export const LIMITS: Readonly<Limits> = {
  sshMs: SSH_TIMEOUT_MS, credentialMs: CREDENTIAL_TIMEOUT_MS, killGraceMs: KILL_GRACE_MS,
  runDeadlineMs: RUN_DEADLINE_MS, finishReserveMs: FINISH_RESERVE_MS, tickMs: CLOCK_TICK_MS,
};
// Each SSH session's own words (both streams, redacted) are kept here per capture,
// named like the object: <chain>-data-<capture id>.log.
export const TRANSCRIPT_DIR = ".kingdom/logs/chain-backup-runs";
const MAX_TRANSCRIPT_BYTES = 1024 * 1024;
const MAX_TRANSCRIPT_LINE = 16 * 1024;

type StreamUpload = number | "OVER" | "STAGE" | null;
// Why a streamed capture was refused before anything ran: head is not GNU
// coreutils (BSD/macOS head -c over-reads a pipe and drops the excess), or the
// remote cannot count the tar stream's bytes independently of head.
type StreamRefusal = "HEAD_NOT_GNU" | "NO_BYTE_COUNT";
type RemoteResult =
  | { kind: "capture"; tarExit: number | null; uploadExit: number | null; uploadHttp: number | null }
  | { kind: "skip"; freeKib: number | null; needKib: number }
  | { kind: "refuse"; reason: StreamRefusal }
  | { kind: "stream"; tarExit: number | null; parts: number; bytes: number | null; upload: StreamUpload; uploadHttp: number | null };
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
  // Streamed: the tar stream's bytes as counted on the remote by tee | wc -c,
  // independently of head. null: not counted (staged, refused, torn, unreadable).
  stream_bytes: number | null;
  // OPEN: created and never completed (a skip, a refusal or a torn stream);
  // UNKNOWN: the complete call failed, so whether the object exists is for stat to say.
  multipart_status: "NOT_STARTED" | "OPEN" | "COMPLETED" | "UNKNOWN";
  // TIMEOUT_SSH: the SSH session ran past its bound and was killed; any record it
  // printed first is still read. TIMEOUT_DEADLINE: the run's deadline ended this
  // chain, or came before it started. Neither ever writes a landed marker.
  error: "SETUP_FAILED" | "REMOTE_FAILED" | "PROTOCOL_FAILED" | "CAPTURE_FAILED" | "UPLOAD_FAILED" | "MULTIPART_FAILED"
    | "STREAM_MISMATCH" | "OBJECT_FAILED" | "SKIPPED_LOW_DISK" | `REFUSED_${StreamRefusal}` | "TIMEOUT_SSH" | "TIMEOUT_DEADLINE" | null;
};

export type UploadedPart = { partNumber: number; etag: string; size: number };

// Deliberately no capability to list or delete stored generations in this lane.
// Multipart calls touch only the one upload this run created; an upload left
// OPEN is never aborted here. The landed marker is local state: written only
// after an upload lands, read for its byte count.
export type Effects = {
  captureId(): string;
  presign(key: string): string;
  // timedOut: the session was killed at its bound; stdout is what arrived before.
  remote(chain: Chain, command: string, captureId?: string): Promise<{ code: number | null; stdout: string | null; timedOut?: boolean }>;
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
  const refuse = /^CHAIN_BACKUP_V3 refuse=(HEAD_NOT_GNU|NO_BYTE_COUNT)\n$/.exec(output);
  if (refuse && refuse[0] === output) return { kind: "refuse", reason: refuse[1] as StreamRefusal };
  const stream = /^CHAIN_BACKUP_V3 tar=(NA|0|[1-9][0-9]{0,2}) parts=(0|[1-9][0-9]{0,4}) bytes=(NA|0|[1-9][0-9]{0,15}) upload=(NA|OVER|STAGE|0|[1-9][0-9]{0,2}) http=(NA|[0-9]{3})\n$/.exec(output);
  if (stream && stream[0] === output) {
    const tarExit = stream[1] === "NA" ? null : Number(stream[1]);
    const parts = Number(stream[2]);
    const bytes = stream[3] === "NA" ? null : Number(stream[3]);
    const upload: StreamUpload = stream[4] === "NA" ? null : stream[4] === "OVER" || stream[4] === "STAGE" ? stream[4] : Number(stream[4]);
    const uploadHttp = stream[5] === "NA" ? null : Number(stream[5]);
    if ((tarExit !== null && tarExit > 255) || (typeof upload === "number" && upload > 255)) return null;
    if (bytes !== null && !Number.isSafeInteger(bytes)) return null;
    // Setup failure: nothing ran, so nothing can be reported beside it.
    if (tarExit === null && (parts !== 0 || bytes !== null || upload !== null || uploadHttp !== null)) return null;
    // No part attempted: no count and no status.
    if (upload === null && (parts !== 0 || uploadHttp !== null)) return null;
    // A clean finish needs at least one landed part; OVER only follows a full set.
    if ((upload === 0 || upload === "OVER") && parts === 0) return null;
    // A status belongs to an attempt: the failing one, or the last landed part.
    if (uploadHttp !== null && typeof upload !== "number" && parts === 0) return null;
    return { kind: "stream", tarExit, parts, bytes, upload, uploadHttp };
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
  // tar's stdout is the archive; it never reaches SSH. head -c reads one part
  // from the pipe into the private directory, curl -T sends it with a
  // Content-Length, and the part is overwritten by the next one. Only the one
  // fixed-format record leaves the machine, as in the staged capture.
  //
  // Cutting parts is only sound if head reads exactly N bytes and no more. GNU
  // head does; BSD/macOS head reads a whole stdio buffer and drops the excess,
  // and the parts still look whole. So the capture is refused unless head is GNU
  // coreutils, and tee also hands every byte of the stream to wc -c, a count
  // independent of head that the Mac must find equal to the parts' sum and the
  // object's size before it writes a landed marker. The counter's own plumbing
  // (tee writing /dev/fd/3 into wc) is proven on five bytes before tar starts.
  const need = options.needKib;
  const part = options.partBytes ?? PART_BYTES;
  if (!Number.isSafeInteger(need) || need <= 0) throw new Error("invalid pre-flight bound");
  // S3 multipart: 5 MiB to 5 GiB per part (only the last may be smaller); tests use tiny parts.
  if (!Number.isSafeInteger(part) || part <= 0 || part > 5 * 1024 ** 3) throw new Error("invalid part size");
  if (partUrls.length < 1 || partUrls.length > 10000) throw new Error("invalid part count");
  const script = [
    "umask 077",
    // Before anything is created: GNU head, and a working independent byte counter.
    'case "$(head --version 2>/dev/null </dev/null)" in ("head (GNU coreutils) "*) ;; (*) printf "CHAIN_BACKUP_V3 refuse=HEAD_NOT_GNU\\n"; exit 0 ;; esac',
    "probe=$({ printf 12345 | tee /dev/fd/3 >/dev/null 2>&1; } 3>&1 | wc -c 2>/dev/null)",
    '[ "$probe" -eq 5 ] 2>/dev/null || { printf "CHAIN_BACKUP_V3 refuse=NO_BYTE_COUNT\\n"; exit 0; }',
    'tmp=$(mktemp -d "${TMPDIR:-/tmp}/chain-backup.XXXXXXXXXX" 2>/dev/null) || { printf "CHAIN_BACKUP_V3 tar=NA parts=0 bytes=NA upload=NA http=NA\\n"; exit 0; }',
    `trap 'rm -f -- "$tmp/part" "$tmp/count" >/dev/null 2>&1; rmdir -- "$tmp" >/dev/null 2>&1' EXIT`,
    ...preflightLines(need),
    `u=(${partUrls.map(shellQuote).join(" ")})`,
    // The loop's counters, then tar's and tee's statuses (PIPESTATUS), come back
    // as one line on fd 4. An early break closes the pipe under tee and tar, so
    // a torn stream reports tar > 1. tee's second copy goes to fd 3, the pipe
    // into wc -c; nothing else writes there, and bash waits for wc.
    `r=$( { { tar czf - --warning=no-file-changed${excludeFlags(options.excludeKeys)} -C /data .zeroned/data .zeroned/config 2>/dev/null | tee /dev/fd/3 2>/dev/null | {`,
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
    '} >&4; printf " %s %s" "${PIPESTATUS[0]}" "${PIPESTATUS[1]}" >&4; } 3>&1 | wc -c > "$tmp/count" 2>/dev/null; } 4>&1)',
    "set -f; set -- $r; parts=$1 upload=$2 http=$3 tar_rc=$4 tee_rc=$5",
    // The count is believed only from a tee that copied the whole stream (exit 0)
    // and a plain decimal from wc; anything else is NA, which the Mac refuses.
    'bytes=NA; if [ "$tee_rc" = 0 ] && read -r n < "$tmp/count"; then case "$n" in ""|*[!0-9]*|0?*) ;; *) bytes=$n ;; esac; fi 2>/dev/null',
    'rm -f -- "$tmp/part" "$tmp/count" >/dev/null 2>&1',
    'printf "CHAIN_BACKUP_V3 tar=%s parts=%s bytes=%s upload=%s http=%s\\n" "${tar_rc:-NA}" "${parts:-0}" "$bytes" "${upload:-NA}" "${http:-NA}"',
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

export type Clock = { wall(): number; mono(): number };
const systemClock: Clock = { wall: () => Date.now(), mono: () => performance.now() };
export type Deadline = { signal: AbortSignal; remainingMs(): number; cancel(): void };

// Expires when either clock has run ms. The wall clock keeps counting while the
// Mac sleeps, which a timer alone does not; the monotonic clock ignores the wall
// clock being set back. Re-checked at least every tickMs.
export function startDeadline(ms: number, tickMs: number = CLOCK_TICK_MS, clock: Clock = systemClock): Deadline {
  const wallEnd = clock.wall() + ms;
  const monoEnd = clock.mono() + ms;
  const controller = new AbortController();
  const remainingMs = () => Math.max(0, Math.min(wallEnd - clock.wall(), monoEnd - clock.mono()));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const check = () => {
    const left = remainingMs();
    if (left <= 0) controller.abort();
    else timer = setTimeout(check, Math.max(1, Math.min(left, tickMs)));
  };
  check();
  return { signal: controller.signal, remainingMs, cancel: () => clearTimeout(timer) };
}

function delay(ms: number): { promise: Promise<void>; cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<void>((resolve) => { timer = setTimeout(resolve, Math.max(0, ms)); });
  return { promise, cancel: () => clearTimeout(timer) };
}

async function settlesWithin(work: Promise<unknown>, ms: number): Promise<boolean> {
  const wait = delay(ms);
  try {
    return await Promise.race([work.then(() => true, () => true), wait.promise.then(() => false)]);
  } finally {
    wait.cancel();
  }
}

async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  const wait = delay(ms);
  try {
    return await Promise.race([Promise.resolve(work), wait.promise.then((): never => { throw new Error("timed out"); })]);
  } finally {
    wait.cancel();
  }
}

export type ChildResult = { code: number | null; stdout: string | null; timedOut: boolean };
export type ChildOptions = {
  timeoutMs: number; killGraceMs: number; stdoutLimit: number; stderr: "ignore" | "pipe";
  onOutput?: (stream: "stdout" | "stderr", chunk: Uint8Array) => void; tickMs?: number; clock?: Clock;
};

// Each child leads its own group, so nothing outside the runner ends it: not
// launchd's job cleanup, not the runner's exit. Two things do. Every way out of
// main (a return, the deadline, an exception) first stops the groups still in
// this set. And each group has a lifeline that ends it if the runner is gone
// without doing that (a signal, SIGKILL, a crash).
const activeChildren = new Set<() => Promise<void>>();

// SIGTERM, then SIGKILL after the grace, to every child group still running.
// Bounded, so a process the kernel cannot end yet never holds up the exit.
export async function stopChildren(killGraceMs: number): Promise<void> {
  if (activeChildren.size === 0) return;
  await settlesWithin(Promise.all([...activeChildren].map((stop) => stop())), 2 * killGraceMs + 1000);
}

export function activeChildCount(): number {
  return activeChildren.size;
}

// A detached bash that reads a pipe only this runner holds open. The kernel
// closes it however the runner ends; then the lifeline sends the child's group
// SIGTERM and, after the grace, SIGKILL. It never acts on a group already gone.
// Its arguments are a group id and a count, nothing private.
const LIFELINE = 'read -r _; g="-$1"; kill -0 -- "$g" 2>/dev/null || exit 0; kill -TERM -- "$g" 2>/dev/null; i=0; ' +
  'while [ "$i" -lt "$2" ] && kill -0 -- "$g" 2>/dev/null; do /bin/sleep 0.1; i=$((i + 1)); done; kill -KILL -- "$g" 2>/dev/null; exit 0';

function startLifeline(group: number, killGraceMs: number): { end(): Promise<void> } | null {
  try {
    const keeper = Bun.spawn(["/bin/bash", "-c", LIFELINE, "chain-backup-lifeline", String(group), String(Math.max(1, Math.ceil(killGraceMs / 100)))],
      { stdin: "pipe", stdout: "ignore", stderr: "ignore", detached: true });
    let ended: Promise<void> | null = null;
    // Ended by SIGKILL, never by closing the pipe: once the group is gone its id could be reused.
    return {
      end: () => ended ??= (async () => {
        try { keeper.kill("SIGKILL"); } catch { /* already gone */ }
        await settlesWithin(Promise.resolve(keeper.exited), 1000);
      })(),
    };
  } catch {
    return null; // the runner's own exit paths still stop the group
  }
}

// Every child of the runner: its own process group, a hard wall-clock bound and
// bounded stdout. At the bound, on stdout overflow, or when its pipes stay open
// after it exits (held by a descendant), the whole group gets SIGTERM and then,
// after the grace, SIGKILL. This returns only once that is done, with the stdout
// that arrived before; every chunk of both streams also goes to onOutput.
export async function runBounded(argv: string[], options: ChildOptions): Promise<ChildResult> {
  if (!(options.timeoutMs > 0)) return { code: null, stdout: null, timedOut: true };
  const proc = Bun.spawn(argv, { stdout: "pipe", stderr: options.stderr, detached: true });
  const pid = proc.pid;
  // Never 0 or 1 as a group: kill(0) is this runner's own group, kill(-1) everything.
  const ownGroup = Number.isSafeInteger(pid) && pid > 1;
  let alive = true;
  const exited: Promise<number | null> = Promise.resolve(proc.exited).then(
    (code) => { alive = false; return Number.isSafeInteger(code) ? code : null; },
    () => { alive = false; return null; },
  );
  const send = (signal: "SIGTERM" | "SIGKILL" | 0): boolean => {
    try {
      if (ownGroup) process.kill(-pid, signal);
      else if (signal !== 0) proc.kill(signal);
      else return false;
      return true;
    } catch {
      return false; // the group is gone
    }
  };
  const lingering = () => alive || send(0);
  let terminating: Promise<void> | null = null;
  const terminate = () => terminating ??= (async () => {
    send("SIGTERM");
    const until = Date.now() + options.killGraceMs;
    while (lingering() && Date.now() < until) await delay(Math.min(50, options.killGraceMs)).promise;
    if (lingering()) send("SIGKILL");
    // A member forked while the group was being killed escapes one SIGKILL:
    // repeat it, bounded, while any member is left.
    for (let i = 0; i < 40 && send(0); i++) { send("SIGKILL"); await delay(25).promise; }
    await exited;
  })();
  const lifeline = ownGroup ? startLifeline(pid, options.killGraceMs) : null;
  const stop = async () => {
    await terminate();
    await lifeline?.end();
  };
  activeChildren.add(stop);
  const timer = startDeadline(options.timeoutMs, options.tickMs, options.clock);
  try {
    let timedOut = false;
    const onExpiry = () => { if (alive) { timedOut = true; void terminate(); } };
    if (timer.signal.aborted) onExpiry();
    else timer.signal.addEventListener("abort", onExpiry, { once: true });

    const chunks: Uint8Array[] = [];
    let size = 0;
    let overflow = false;
    const readers: Array<ReadableStreamDefaultReader<Uint8Array>> = [];
    const pump = async (stream: unknown, name: "stdout" | "stderr") => {
      if (!(stream instanceof ReadableStream)) return;
      const reader = (stream as ReadableStream<Uint8Array>).getReader();
      readers.push(reader);
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) return;
          try { options.onOutput?.(name, value); } catch { /* a transcript never stops intake */ }
          if (name !== "stdout" || overflow) continue;
          size += value.byteLength;
          // Past the record's bound nothing is kept for parsing, and the child is ended.
          if (size > options.stdoutLimit) {
            overflow = true;
            chunks.length = 0;
            void terminate();
          } else chunks.push(value);
        }
      } catch { /* a cancelled or broken pipe ends intake */ }
    };
    const intake = Promise.all([pump(proc.stdout, "stdout"), pump(options.stderr === "pipe" ? proc.stderr : null, "stderr")]);
    const code = await exited;
    timer.cancel();
    if (!(await settlesWithin(intake, options.killGraceMs))) {
      await terminate();
      if (!(await settlesWithin(intake, options.killGraceMs))) for (const reader of readers) reader.cancel().catch(() => {});
    }
    if (terminating) await terminating;
    let stdout: string | null = null;
    if (!overflow) {
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      try { stdout = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { stdout = null; }
    }
    return { code, stdout, timedOut };
  } finally {
    timer.cancel();
    // Whatever the way out: a member left in the group, even after the child
    // itself exited cleanly, is ended before the lifeline and the entry go.
    if (lingering()) await terminate();
    await lifeline?.end();
    activeChildren.delete(stop);
  }
}

// For the transcript only; the main log never holds raw output. Removes control
// sequences, URLs (presigned ones carry their signature), credential-shaped
// parameters, headers and tokens, the given literals, and any long opaque run.
export function redactLine(line: string, literals: readonly string[] = []): string {
  let text = line.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
  for (const literal of literals) if (literal.length >= 8) text = text.split(literal).join("[redacted]");
  return text
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"<>`]+/gi, "[url]")
    .replace(/\b(authorization|proxy-authorization|cookie|set-cookie|x-amz-security-token)\b\s*[:=].*/gi, "$1: [redacted]")
    .replace(/\b(bearer|basic|flyv1)\s+[^\s,;]+/gi, "$1 [redacted]")
    .replace(/\b(x-amz-[a-z-]+|signature|credential|uploadid|access_?key_?id|secret_?access_?key|password|token|secret|key)=[^&\s'"]*/gi, "$1=[redacted]")
    .replace(/\b(fm[12]|fo1|tid|tsec)_[A-Za-z0-9_+/=-]+/g, "[token]")
    .replace(/[A-Za-z0-9+/=_%-]{40,}/g, "[redacted]");
}

export type Transcript = { write(stream: "stdout" | "stderr", chunk: Uint8Array): void; close(result: ChildResult): void };

// One SSH session's own words, kept even when it fails or times out: both streams
// line by line, each redacted and stamped with seconds since the start, at most
// MAX_TRANSCRIPT_BYTES, mode 0600. Never the command, which carries presigned
// URLs. Any failure here only loses the transcript, never the capture.
export function openTranscript(path: string, header: string, literals: readonly string[] = [], now: () => number = Date.now): Transcript {
  let fd: number | null = null;
  try { fd = openSync(path, "wx", 0o600); } catch { fd = null; }
  const started = now();
  let kept = 0;
  let dropped = 0;
  const emit = (text: string, always = false) => {
    if (fd === null) return;
    const bytes = Buffer.from(text, "utf8");
    if (!always && kept + bytes.byteLength > MAX_TRANSCRIPT_BYTES) { dropped += bytes.byteLength; return; }
    try { writeSync(fd, bytes); kept += bytes.byteLength; } catch { fd = null; }
  };
  const stamp = () => `+${((now() - started) / 1000).toFixed(1)}s`;
  const tag = { stdout: "out", stderr: "err" } as const;
  const decoders = { stdout: new TextDecoder(), stderr: new TextDecoder() };
  const pending = { stdout: "", stderr: "" };
  // An over-long line is dropped whole, never cut: once its start is dropped, the
  // rest of it is skipped up to the next newline.
  const skipping = { stdout: false, stderr: false };
  const tooLong = (name: "stdout" | "stderr", text: string) => {
    dropped += Buffer.byteLength(text);
    if (!skipping[name]) emit(`${stamp()} ${tag[name]} [line over ${MAX_TRANSCRIPT_LINE} characters not kept]\n`);
  };
  const take = (name: "stdout" | "stderr", text: string, final: boolean) => {
    const lines = (pending[name] + text).split("\n");
    pending[name] = final ? "" : lines.pop()!;
    if (final && lines[lines.length - 1] === "") lines.pop();
    for (const line of lines) {
      if (line.length > MAX_TRANSCRIPT_LINE) tooLong(name, line);
      else if (skipping[name]) dropped += Buffer.byteLength(line);
      else emit(`${stamp()} ${tag[name]} ${redactLine(line, literals)}\n`);
      skipping[name] = false;
    }
    if (pending[name].length > MAX_TRANSCRIPT_LINE) {
      tooLong(name, pending[name]);
      skipping[name] = true;
      pending[name] = "";
    }
  };
  emit(`# kingdom.chain-backup.transcript/1 ${header}\n`, true);
  return {
    write: (name, chunk) => take(name, decoders[name].decode(chunk, { stream: true }), false),
    close(result) {
      for (const name of ["stdout", "stderr"] as const) take(name, decoders[name].decode(), true);
      emit(`# exit=${result.code ?? "NA"} timed_out=${result.timedOut} elapsed_s=${((now() - started) / 1000).toFixed(1)} kept_bytes=${kept} dropped_bytes=${dropped}\n`, true);
      if (fd !== null) try { closeSync(fd); } catch { /* nothing more to keep */ }
      fd = null;
    },
  };
}

function emptyOutcome(chain: Chain): Outcome {
  return {
    chain, capture_status: "FAILED", tar_exit: null,
    upload_status: "NOT_ATTEMPTED", upload_exit: null, upload_http: null, object_status: "NOT_ATTEMPTED",
    ssh_exit: null, recovery_status: "NOT_ASSESSED", retention_status: "DISABLED",
    key_files: ROLLOUT_CHAINS.includes(chain) ? "EXCLUDED" : "INCLUDED",
    disk_free_kib: null, disk_need_kib: null, landed_marker: "NOT_WRITTEN",
    capture_mode: ROLLOUT_CHAINS.includes(chain) && STREAM_CHAINS.includes(chain) ? "STREAMED_MULTIPART" : "STAGED",
    parts: null, stream_bytes: null, multipart_status: "NOT_STARTED", error: "SETUP_FAILED",
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

// cutoff: once aborted (the run's deadline), no landed marker is written. result
// is filled in place, so a caller that stops waiting still logs what happened.
export async function captureChain(
  chain: Chain, effects: Effects, cutoff?: AbortSignal, result: Outcome = emptyOutcome(chain),
): Promise<Outcome> {
  const streamed = result.capture_mode === "STREAMED_MULTIPART";
  let id: string;
  let key: string;
  let command: string;
  let uploadId = "";
  let partLimit = 0;
  try {
    id = effects.captureId();
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
    remote = await effects.remote(chain, command, id);
    result.ssh_exit = Number.isInteger(remote.code) && remote.code! >= 0 && remote.code! <= 255 ? remote.code : null;
  } catch {
    return result;
  }
  // A session killed at its bound keeps that as its error, whatever else is
  // reported. A record that arrived before the bound is still read, and checked
  // like any other, but a timed-out capture never writes a landed marker.
  const timedOut = remote.timedOut === true;
  const report = parseRemoteResult(remote.stdout);
  // A skip record is only believed from a chain that was asked to pre-flight,
  // and a capture record only in the protocol this chain was sent.
  if (!report || (report.kind === "skip" && report.needKib !== result.disk_need_kib) ||
      (report.kind === "stream" && (!streamed || report.parts > partLimit || (report.upload === "OVER" && report.parts !== partLimit))) ||
      (report.kind === "refuse" && !streamed) || (report.kind === "capture" && streamed)) {
    result.error = timedOut ? "TIMEOUT_SSH" : "PROTOCOL_FAILED";
    return result;
  }
  if (report.kind === "skip" || report.kind === "refuse") {
    // Nothing was archived or uploaded; the rootfs was left alone. A streamed
    // chain's upload stays OPEN with no parts.
    result.capture_status = "SKIPPED";
    result.upload_status = "NOT_ATTEMPTED";
    if (report.kind === "skip") {
      result.disk_free_kib = report.freeKib;
      result.error = "SKIPPED_LOW_DISK";
    } else result.error = `REFUSED_${report.reason}`;
    if (timedOut) result.error = "TIMEOUT_SSH";
    return result;
  }
  const sessionError: Outcome["error"] = timedOut ? "TIMEOUT_SSH" : result.ssh_exit === 0 ? null : "REMOTE_FAILED";
  if (report.kind === "stream") return finishStream(chain, result, report, key, uploadId, effects, sessionError, cutoff);
  result.tar_exit = report.tarExit;
  result.capture_status = captureStatus(report.tarExit);
  result.upload_exit = report.uploadExit;
  result.upload_http = report.uploadHttp;
  result.error = sessionError;
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
  if (cutoff?.aborted) result.error ??= "TIMEOUT_DEADLINE";
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
  key: string, uploadId: string, effects: Effects, sessionError: Outcome["error"], cutoff?: AbortSignal,
): Promise<Outcome> {
  result.tar_exit = report.tarExit;
  result.capture_status = captureStatus(report.tarExit);
  result.upload_exit = typeof report.upload === "number" ? report.upload : null;
  result.upload_http = report.uploadHttp;
  result.parts = report.parts;
  result.stream_bytes = report.bytes;
  result.error = sessionError;
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
  // Whole-looking parts are not enough: a head that over-reads drops bytes
  // between parts and every part still looks full. The remote's own count of
  // the tar stream must equal the parts' sum, or the upload is never completed.
  if (report.bytes === null || report.bytes !== expected) {
    result.error ??= "STREAM_MISMATCH";
    return result;
  }
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
  if (cutoff?.aborted) result.error ??= "TIMEOUT_DEADLINE";
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

// The run's deadline: production effects cut every child at it (less the finish
// reserve), and main stops waiting at it.
export type RunContext = { deadline: Deadline; limits: Readonly<Limits> };

export async function main(
  args: string[],
  createEffects: (run: RunContext) => Promise<Effects> = productionEffects,
  log: (line: string) => void = console.log,
  limits: Readonly<Limits> = LIMITS,
): Promise<1 | 2 | 3> {
  const chains = parseArgs(args);
  if (!chains) {
    log("Usage: bun bin/chain-backup-remote.ts [zerone-1|zerone-testnet-1]");
    return 2;
  }
  const deadline = startDeadline(limits.runDeadlineMs, limits.tickMs, limits.clock);
  const expired = new Promise<"expired">((resolve) => {
    if (deadline.signal.aborted) resolve("expired");
    else deadline.signal.addEventListener("abort", () => resolve("expired"), { once: true });
  });
  const deadlineOutcome = (chain: Chain): Outcome => ({ ...emptyOutcome(chain), error: "TIMEOUT_DEADLINE" });
  try {
    let effects: Effects;
    try {
      const made = await Promise.race([createEffects({ deadline, limits }), expired]);
      if (made === "expired") throw new Error("deadline");
      effects = made;
    } catch {
      for (const chain of chains) log(JSON.stringify(deadline.signal.aborted ? deadlineOutcome(chain) : emptyOutcome(chain)));
      return 1;
    }
    let failed = false;
    for (const chain of chains) {
      let result: Outcome;
      // The reserve is for finishing a capture, never for starting one.
      if (deadline.remainingMs() <= limits.finishReserveMs) result = deadlineOutcome(chain);
      else {
        result = emptyOutcome(chain);
        // Whatever is still pending at the deadline is logged as it stands at
        // that instant; the cutoff keeps it from writing a marker afterwards,
        // and its child groups are stopped below before main returns.
        if ((await Promise.race([captureChain(chain, effects, deadline.signal, result), expired])) === "expired") {
          result.error = "TIMEOUT_DEADLINE";
        }
      }
      log(JSON.stringify(result));
      failed ||= result.error !== null;
    }
    return failed ? 1 : 3;
  } finally {
    deadline.cancel();
    // Every way out of main, the deadline included: no child group outlives it.
    // On a wake past both deadlines a child may be untouched, or inside its
    // SIGKILL grace; either way it is ended here, not abandoned at exit.
    await stopChildren(limits.killGraceMs);
  }
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

async function productionEffects(run: RunContext): Promise<Effects> {
  const { deadline, limits } = run;
  // No child outlives the run: each is cut where the finish reserve begins.
  const bound = (ms: number) => Math.min(ms, deadline.remainingMs() - limits.finishReserveMs);
  const child = (argv: string[], timeoutMs: number, stdoutLimit: number, stderr: "ignore" | "pipe", onOutput?: ChildOptions["onOutput"]) =>
    runBounded(argv, { timeoutMs, killGraceMs: limits.killGraceMs, stdoutLimit, stderr, onOutput, tickMs: limits.tickMs, clock: limits.clock });
  async function keychain(service: string): Promise<string> {
    // A credential is never transcribed: no onOutput, stderr discarded.
    const result = await child(["security", "find-generic-password", "-s", service, "-w"], bound(limits.credentialMs), 4096, "ignore");
    if (result.timedOut || result.code !== 0 || !result.stdout?.trim()) throw new Error("credential unavailable");
    return result.stdout.trim();
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
  const transcriptDir = `${home}/${TRANSCRIPT_DIR}`;
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
    stat: (key) => withTimeout(s3.stat(key), S3_TIMEOUT_MS),
    multipart: multipartEffects(signer),
    async remote(chain, command, captureId) {
      const id = typeof captureId === "string" && /^[A-Za-z0-9-]{1,100}$/.test(captureId)
        ? captureId : `${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z")}-${process.pid}`;
      const timeoutMs = bound(limits.sshMs);
      try { mkdirSync(transcriptDir, { recursive: true, mode: 0o700 }); } catch { /* the transcript is lost, not the capture */ }
      const transcript = openTranscript(`${transcriptDir}/${chain}-data-${id}.log`,
        `chain=${chain} capture=${id} started=${new Date().toISOString()} bound_s=${Math.max(0, Math.round(timeoutMs / 1000))}`,
        [signer.accessKeyId, signer.secretAccessKey]);
      // stdout is the one record (bounded); flyctl's and the remote's stderr reach only the transcript.
      let result: ChildResult = { code: null, stdout: null, timedOut: false };
      try {
        result = await child(["flyctl", "ssh", "console", "-a", chain, "-C", command], timeoutMs, MAX_REMOTE_RESULT_BYTES, "pipe", transcript.write);
        return result;
      } finally {
        transcript.close(result);
      }
    },
  };
}

if (import.meta.main) {
  // main has stopped every child group by now. Exit outright: a request still
  // pending past its bound must not keep the job alive.
  process.exit(await main(process.argv.slice(2)));
}
