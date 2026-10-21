#!/usr/bin/env bun
/**
 * Online salvage capture, NOT a coherent or recovery-verified backup.
 * Tar 0 and 1 both remain RAW_UNVERIFIED. Object presence proves only storage.
 * No listing/pruning: every existing object is preserved; storage will grow.
 *
 * Run: bun bin/chain-backup-remote.ts [zerone-1|zerone-testnet-1]
 * Exit: 3 unverified capture(s) present, 1 operational failure (including a
 * low-disk skip), 2 usage error.
 * Installation/launchd activation is a separate authorised operation.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

const ENDPOINT = "https://fly.storage.tigris.dev";
const BUCKET = "kingdom-vault";
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

type RemoteResult =
  | { kind: "capture"; tarExit: number | null; uploadExit: number | null; uploadHttp: number | null }
  | { kind: "skip"; freeKib: number | null; needKib: number };
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
  error: "SETUP_FAILED" | "REMOTE_FAILED" | "PROTOCOL_FAILED" | "CAPTURE_FAILED" | "UPLOAD_FAILED" | "OBJECT_FAILED" | "SKIPPED_LOW_DISK" | null;
};

// Deliberately no list/delete capability in this lane. The landed marker is
// local state: written only after an upload lands, read for its byte count.
export type Effects = {
  captureId(): string;
  presign(key: string): string;
  remote(chain: Chain, command: string): Promise<{ code: number; stdout: string | null }>;
  stat(key: string): Promise<{ size: number }>;
  lastLandedBytes(chain: Chain): Promise<number | null>;
  markLanded(chain: Chain, bytes: number, keyFiles: Outcome["key_files"]): Promise<void>;
};

export type CaptureOptions = { excludeKeys: boolean; needKib: number | null };

export function needKib(lastLandedBytes: number | null): number {
  const last = Number.isSafeInteger(lastLandedBytes) && lastLandedBytes! > 0 ? lastLandedBytes! : 0;
  return Math.ceil((last + LOW_DISK_MARGIN_BYTES) / 1024);
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
  const excludes = options.excludeKeys ? EXCLUDED_KEY_FILES.map((name) => ` --exclude=${name}`).join("") : "";
  const preflight = need === null ? [] : [
    // Free KiB on the staging filesystem, from df's last line; anything else is unknown.
    "free=NA",
    'while read -r _ _ _ avail _; do free=$avail; done < <(df -Pk -- "$tmp" 2>/dev/null)',
    'case "$free" in ""|*[!0-9]*) free=NA ;; esac',
    `if [ "$free" = NA ] || [ "$free" -lt ${need} ]; then printf "CHAIN_BACKUP_V2 skip=LOW_DISK free_kib=%s need_kib=%s\\n" "$free" ${need}; exit 0; fi`,
  ];
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
    disk_free_kib: null, disk_need_kib: null, landed_marker: "NOT_WRITTEN", error: "SETUP_FAILED",
  };
}

export async function captureChain(chain: Chain, effects: Effects): Promise<Outcome> {
  const result = emptyOutcome(chain);
  let key: string;
  let command: string;
  try {
    const id = effects.captureId();
    if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) return result;
    let options: CaptureOptions = { excludeKeys: false, needKib: null };
    if (ROLLOUT_CHAINS.includes(chain)) {
      let last: number | null = null;
      try { last = await effects.lastLandedBytes(chain); } catch { /* unknown: margin only */ }
      options = { excludeKeys: true, needKib: needKib(last) };
      result.disk_need_kib = options.needKib;
    }
    key = `chain/${chain}/${chain}-data-${id}.tar.gz`;
    command = buildRemoteCommand(effects.presign(key), options);
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
  // A skip record is only believed from a chain that was asked to pre-flight.
  if (!report || (report.kind === "skip" && report.needKib !== result.disk_need_kib)) {
    result.error = "PROTOCOL_FAILED";
    return result;
  }
  if (report.kind === "skip") {
    // Nothing was archived or uploaded; the rootfs was left alone.
    result.capture_status = "SKIPPED";
    result.upload_status = "NOT_ATTEMPTED";
    result.disk_free_kib = report.freeKib;
    result.error = "SKIPPED_LOW_DISK";
    return result;
  }
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

async function productionEffects(): Promise<Effects> {
  async function keychain(service: string): Promise<string> {
    const proc = Bun.spawn(["security", "find-generic-password", "-s", service, "-w"], { stdout: "pipe", stderr: "ignore" });
    const output = await readBoundedOutput(proc.stdout, 4096);
    if (output === null) proc.kill();
    if ((await proc.exited) !== 0 || !output?.trim()) throw new Error("credential unavailable");
    return output.trim();
  }
  const s3 = new Bun.S3Client({
    accessKeyId: await keychain("agenttool-tigris-access-key"),
    secretAccessKey: await keychain("agenttool-tigris-secret-key"),
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
