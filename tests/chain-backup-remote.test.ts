import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  awsUriEncode, buildRemoteCommand, buildStreamedRemoteCommand, captureChain, captureStatus, completeBody, EXCLUDED_KEY_FILES,
  LOW_DISK_MARGIN_BYTES, main, MAX_PARTS, MAX_REMOTE_COMMAND_BYTES, MAX_REMOTE_RESULT_BYTES, multipartEffects, needKib, PART_BYTES,
  parseArgs, parseListParts, parseRemoteResult, parseUploadId, partsAreWhole, presignS3Url, readBoundedOutput, ROLLOUT_CHAINS,
  sigv4, STREAM_CHAINS, streamNeedKib, type Effects, type UploadedPart,
} from "../bin/chain-backup-remote.ts";

const SUBJECT = new URL("../bin/chain-backup-remote.ts", import.meta.url).pathname;
const FALLBACK = new URL("../bin/chain-backup-to-tigris.sh", import.meta.url).pathname;
const PRIVATE = "PRIVATE_SUBPROCESS_SENTINEL";
const URL_SENTINEL = `https://storage.invalid/fixture?signature=${PRIVATE}`;
const record = (tar: number | "NA" = 0, upload: number | "NA" = 0, http: number | "NA" = upload === "NA" ? "NA" : 200) =>
  `CHAIN_BACKUP_V2 tar=${tar} upload=${upload} http=${http === "NA" ? http : String(http).padStart(3, "0")}\n`;
type StreamUploadField = number | "NA" | "OVER" | "STAGE";
const streamRecord = (tar: number | "NA" = 1, parts = 1, upload: StreamUploadField = 0, http: number | "NA" = upload === "NA" ? "NA" : 200) =>
  `CHAIN_BACKUP_V3 tar=${tar} parts=${parts} upload=${upload} http=${http === "NA" ? http : String(http).padStart(3, "0")}\n`;
// Each chain answers in the protocol it was sent: the streamed capture's record is V3.
const answer = (command: string) => (command.includes("CHAIN_BACKUP_V3") ? streamRecord() : record());
const UPLOAD_ID = "fixture-upload-id";
const onePart = (size = 64): UploadedPart[] => [{ partNumber: 1, etag: '"fixture-etag-1"', size }];

function fakeEffects(overrides: Partial<Effects> = {}) {
  const calls: string[] = [];
  let sequence = 0;
  const effects: Effects = {
    captureId: () => `fixture-${sequence++}`,
    presign: (key) => { calls.push(`presign:${key}`); return URL_SENTINEL; },
    remote: async (_chain, command) => { calls.push("remote"); return { code: 0, stdout: answer(command) }; },
    stat: async () => { calls.push("stat"); return { size: 64 }; },
    lastLandedBytes: async () => null,
    markLanded: async (chain, bytes, keyFiles) => { calls.push(`mark:${chain}:${bytes}:${keyFiles}`); },
    multipart: {
      create: async (key) => { calls.push(`create:${key}`); return UPLOAD_ID; },
      presignPart: (_key, uploadId, partNumber) => `${URL_SENTINEL}&uploadId=${uploadId}&partNumber=${partNumber}`,
      listParts: async () => { calls.push("list-parts"); return onePart(); },
      complete: async (_key, _uploadId, parts) => { calls.push(`complete:${parts.length}`); },
    },
    ...overrides,
  };
  return { effects, calls };
}

async function runMain(effects: Effects, args: string[] = ["zerone-1"]) {
  const logs: string[] = [];
  const code = await main(args, async () => effects, (line) => logs.push(line));
  return { code, logs, outcomes: logs.map((line) => JSON.parse(line)) };
}

describe("strict online capture contract", () => {
  test("arguments are exact and validated before the effect factory", async () => {
    expect(parseArgs([])).toEqual(["zerone-testnet-1", "zerone-1"]);
    expect(parseArgs(["zerone-1"])).toEqual(["zerone-1"]);
    let calls = 0;
    for (const args of [["unknown"], ["--help"], ["zerone-1", "extra"], [PRIVATE], [""]]) {
      const logs: string[] = [];
      expect(await main(args, async () => { calls++; throw new Error(PRIVATE); }, (s) => logs.push(s))).toBe(2);
      expect(logs.join("\n")).not.toContain(PRIVATE);
    }
    expect(calls).toBe(0);
  });

  test("tar 0 and 1 are unverified; all other capture codes fail", async () => {
    for (const tar of [0, 1, 2, 127, 255]) {
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout: record(tar, tar > 1 ? "NA" : 0) }) });
      const { code, outcomes } = await runMain(effects);
      expect(code).toBe(tar > 1 ? 1 : 3);
      expect(outcomes[0]).toMatchObject({
        capture_status: tar > 1 ? "FAILED" : "RAW_UNVERIFIED", tar_exit: tar,
        upload_status: tar > 1 ? "NOT_ATTEMPTED" : "PRESENT",
        object_status: tar > 1 ? "NOT_ATTEMPTED" : "PRESENT",
        recovery_status: "NOT_ASSESSED", retention_status: "DISABLED",
      });
      expect(calls.includes("stat")).toBe(tar <= 1);
    }
    for (const code of [null, -1, 0.5, 256, NaN]) expect(captureStatus(code)).toBe("FAILED");
  });

  test("capture, upload, SSH and object presence retain independent outcomes", async () => {
    const cases = [
      { tar: 1, upload: 22, ssh: 0, size: 64, error: "UPLOAD_FAILED", object: "PRESENT" },
      { tar: 0, upload: 0, ssh: 255, size: 64, error: "REMOTE_FAILED", object: "PRESENT" },
      { tar: 0, upload: 0, ssh: 0, size: 0, error: "OBJECT_FAILED", object: "FAILED" },
      { tar: 1, upload: 0, ssh: 0, size: -1, error: "OBJECT_FAILED", object: "FAILED" },
      { tar: 0, upload: 0, ssh: 0, size: NaN, error: "OBJECT_FAILED", object: "FAILED" },
      { tar: 0, upload: 0, ssh: 0, size: Infinity, error: "OBJECT_FAILED", object: "FAILED" },
    ];
    for (const c of cases) {
      const { effects } = fakeEffects({ remote: async () => ({ code: c.ssh, stdout: record(c.tar, c.upload) }), stat: async () => ({ size: c.size }) });
      const { code, outcomes } = await runMain(effects);
      expect(code).toBe(1);
      expect(outcomes[0]).toMatchObject({ capture_status: "RAW_UNVERIFIED", tar_exit: c.tar, upload_exit: c.upload, ssh_exit: c.ssh, object_status: c.object, error: c.error });
      expect(outcomes[0].upload_status).toBe(c.upload === 0 && c.size === 64 ? "PRESENT" : "FAILED");
    }
  });

  test("malformed, inconsistent, duplicated and oversized reports fail closed", async () => {
    const bad = [null, "", PRIVATE, record(2, 0), record(0, "NA"), record(256, "NA"), record(0, 256),
      record().replace("tar=0", "tar=00"), record().replace("tar=0", "tar=-1"),
      record().replace("tar=0", "tar=0.5"), record().trim(), `${record()}\n`, `${PRIVATE}\n${record()}`,
      `${record()}${record()}`, "x".repeat(MAX_REMOTE_RESULT_BYTES + 1), `${record()}\0`,
      record().replace("\n", "\r\n"), record().replace("upload=0", "upload=0 extra=1"),
      "CHAIN_BACKUP_V1 tar=0 upload=0\n", record().replace(" http=200", ""), record(2, "NA", 403), record("NA", "NA", 0),
      record().replace("http=200", "http=20"), record().replace("http=200", "http=2000"), record().replace("http=200", "http=-01"),
      record().replace("http=200", `http=${PRIVATE}`), record().replace("http=200", "http=200 http=200")];
    for (const stdout of bad) {
      expect(parseRemoteResult(stdout)).toBeNull();
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout }) });
      const result = await runMain(effects);
      expect(result.code).toBe(1);
      expect(result.outcomes[0]).toMatchObject({ capture_status: "FAILED", upload_status: "FAILED", object_status: "NOT_ATTEMPTED", error: "PROTOCOL_FAILED" });
      expect(calls).not.toContain("stat");
      expect(result.logs.join("\n")).not.toContain(PRIVATE);
    }
  });

  test("exceptions at every effect boundary disclose no private output", async () => {
    const fail = () => { throw new Error(`${PRIVATE} ${URL_SENTINEL} archive/config/private-key`); };
    for (const overrides of [
      { captureId: fail }, { presign: fail }, { remote: fail }, { stat: fail },
    ]) {
      const result = await runMain(fakeEffects(overrides).effects);
      expect(result.code).toBe(1);
      expect(result.logs.join("\n")).not.toContain(PRIVATE);
      expect(result.logs.join("\n")).not.toContain("archive/config");
    }
    const logs: string[] = [];
    expect(await main([], fail, (s) => logs.push(s))).toBe(1);
    expect(logs).toHaveLength(2);
    expect(logs.join("\n")).not.toContain(PRIVATE);
    expect(JSON.parse(logs[0]).upload_status).toBe("NOT_ATTEMPTED");
  });

  test("remote setup failure does not invent a tar exit code", async () => {
    expect(parseRemoteResult(record("NA", "NA"))).toEqual({ kind: "capture", tarExit: null, uploadExit: null, uploadHttp: null });
    expect(parseRemoteResult(record("NA", 0))).toBeNull();
    const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout: record("NA", "NA") }) });
    const result = await runMain(effects);
    expect(result.code).toBe(1);
    expect(result.outcomes[0]).toMatchObject({ capture_status: "FAILED", tar_exit: null, upload_status: "NOT_ATTEMPTED", object_status: "NOT_ATTEMPTED", error: "SETUP_FAILED" });
    expect(calls).not.toContain("stat");
  });

  test("the upload's HTTP status is reported beside curl's exit, never instead of it", async () => {
    const cases = [
      { upload: 22, http: 403, error: "UPLOAD_FAILED", status: "FAILED" },
      { upload: 7, http: 0, error: "UPLOAD_FAILED", status: "FAILED" },
      { upload: 22, http: "NA" as const, error: "UPLOAD_FAILED", status: "FAILED" },
      { upload: 0, http: 200, error: null, status: "PRESENT" },
      { upload: 0, http: "NA" as const, error: null, status: "PRESENT" },
    ];
    for (const c of cases) {
      expect(parseRemoteResult(record(1, c.upload, c.http))).toEqual({ kind: "capture", tarExit: 1, uploadExit: c.upload, uploadHttp: c.http === "NA" ? null : c.http });
      const { effects } = fakeEffects({ remote: async () => ({ code: 0, stdout: record(1, c.upload, c.http) }) });
      const { outcomes } = await runMain(effects);
      expect(outcomes[0]).toMatchObject({ upload_exit: c.upload, upload_http: c.http === "NA" ? null : c.http, upload_status: c.status, error: c.error });
    }
    const { outcomes } = await runMain(fakeEffects({ remote: async () => ({ code: 0, stdout: record(2, "NA") }) }).effects);
    expect(outcomes[0]).toMatchObject({ upload_exit: null, upload_http: null, upload_status: "NOT_ATTEMPTED" });
  });

  test("one failed chain does not skip the other or return healthy", async () => {
    const { effects } = fakeEffects({ remote: async (chain) => ({ code: 0, stdout: chain === "zerone-1" ? record() : record(2, "NA") }) });
    const result = await runMain(effects, []);
    expect(result.code).toBe(1);
    expect(result.outcomes.map((o) => o.capture_status)).toEqual(["FAILED", "RAW_UNVERIFIED"]);
    expect((await runMain(fakeEffects().effects, [])).code).toBe(3);
  });

  test("arbitrarily repeated raw captures never list or delete any generation", async () => {
    const stored = new Set(["legacy-known-good", "legacy-raw"]);
    let pending = "";
    let listed = 0;
    let deleted = 0;
    const { effects } = fakeEffects({
      presign: (key) => { pending = key; return URL_SENTINEL; },
      remote: async () => { stored.add(pending); return { code: 0, stdout: record(1) }; },
    });
    Object.assign(effects, { list: () => { listed++; throw new Error("forbidden"); }, delete: () => { deleted++; throw new Error("forbidden"); } });
    for (let i = 0; i < 2048; i++) expect((await captureChain("zerone-1", effects)).upload_status).toBe("PRESENT");
    expect(stored.size).toBe(2050);
    expect(stored.has("legacy-known-good")).toBe(true);
    expect(stored.has("legacy-raw")).toBe(true);
    expect([listed, deleted]).toEqual([0, 0]);
  });

  test("stream intake caps bytes before buffering and rejects invalid UTF-8", async () => {
    function stream(chunks: Uint8Array[], cancelled?: () => void) {
      return new ReadableStream<Uint8Array>({ start(c) { for (const chunk of chunks) c.enqueue(chunk); if (!cancelled) c.close(); }, cancel: cancelled });
    }
    const bytes = new TextEncoder().encode(record());
    expect(await readBoundedOutput(stream([bytes.slice(0, 4), bytes.slice(4)]), 128)).toBe(record());
    let cancelled = 0;
    expect(await readBoundedOutput(stream([new Uint8Array(129)], () => cancelled++), 128)).toBeNull();
    expect(cancelled).toBe(1);
    expect(await readBoundedOutput(stream([new Uint8Array([255])]), 128)).toBeNull();
  });
});

// The only real subprocesses are Bun and /bin/bash. PATH contains only owned
// mocks (plus the shell interpreter). Even tar, date and cleanup are synthetic;
// no node path, keychain, Fly, SSH, curl, AWS or stored backup is accessed.
function shellFixture() {
  const base = mkdtempSync(join(tmpdir(), "chain-backup-test-"));
  for (const dir of ["bin", "tmp", "home", "objects"]) mkdirSync(join(base, dir));
  const mock = join(base, "mock.ts");
  writeFileSync(mock, `#!${process.execPath}
import { appendFileSync, writeFileSync, readFileSync, mkdtempSync, rmSync, rmdirSync, fstatSync, statSync, readdirSync, writeSync, readSync } from "node:fs";
import { basename, dirname, join } from "node:path";
const name = basename(process.argv[1]);
const args = process.argv.slice(2);
const root = process.env.FIXTURE!;
appendFileSync(join(root, "calls"), JSON.stringify({ name, args }) + "\\n");
function owned(path: string) { if (!path.startsWith(root + "/tmp/")) throw new Error("outside owned fixture"); return path; }
const noise = ${JSON.stringify(PRIVATE)};
const rc = (key: string) => Number(process.env[key] || 0);
if (name === "mktemp") {
  if (rc("MKTEMP_RC")) process.exit(rc("MKTEMP_RC"));
  console.log(mkdtempSync(owned(args[1].replace(/X+$/, ""))));
} else if (name === "date") console.log("20260908T000000Z");
else if (name === "df") {
  owned(args[args.length - 1] + "/");
  process.stdout.write(process.env.DF_OUTPUT ?? "Filesystem 1024-blocks Used Available Capacity Mounted on\\noverlay 8000000 1000000 7000000 13% /\\n");
  console.error(noise); process.exit(rc("DF_RC"));
}
else if (name === "tar") {
  const index = args[0] === "czf" ? 1 : args.indexOf("-cf") + 1;
  if (args[index] === "-") {
    // Streamed capture: TAR_STREAM_BYTES synthetic archive bytes (carrying the
    // private sentinel) on stdout; a closed pipe ends tar as SIGPIPE would.
    const total = rc("TAR_STREAM_BYTES") || 40;
    const data = Buffer.alloc(total, noise);
    let offset = 0;
    try { while (offset < total) offset += writeSync(1, data, offset, Math.min(4096, total - offset)); }
    catch (error) { if (error.code !== "EPIPE") throw error; console.error(noise); process.exit(141); }
    console.error(noise); process.exit(rc("TAR_RC"));
  }
  writeFileSync(owned(args[index]), "synthetic archive, no real node bytes");
  console.log(noise); console.error(noise); process.exit(rc("TAR_RC"));
} else if (name === "head") {
  // GNU head -c N: reads exactly N bytes (no more) from the shared pipe.
  if (!fstatSync(1).isFile()) process.exit(98);
  const heads = readFileSync(join(root, "calls"), "utf8").trim().split("\\n").filter((line) => JSON.parse(line).name === "head").length;
  if (rc("HEAD_FAIL_AT") && heads === rc("HEAD_FAIL_AT")) { console.error(noise); process.exit(1); }
  let left = Number(args[args.indexOf("-c") + 1]);
  const buffer = Buffer.alloc(4096);
  while (left > 0) {
    const got = readSync(0, buffer, 0, Math.min(buffer.length, left), null);
    if (got === 0) break;
    writeSync(1, buffer, 0, got);
    left -= got;
  }
} else if (name === "curl") {
  const file = owned(args[args.indexOf("-T") + 1]);
  const bytes = readFileSync(file);
  // What sits in the private directory while this part uploads: one part only.
  const staged = readdirSync(dirname(file)).reduce((total, entry) => total + statSync(join(dirname(file), entry)).size, 0);
  appendFileSync(join(root, "upload-intake"), JSON.stringify({ size: bytes.length, staged, url: args[args.length - 1] }) + "\\n");
  const attempt = readFileSync(join(root, "upload-intake"), "utf8").trim().split("\\n").length;
  const failing = !rc("UPLOAD_FAIL_AT") || attempt === rc("UPLOAD_FAIL_AT");
  // Like curl -o FILE -w FORMAT: the body goes to FILE; stdout gets only the write-out.
  if (args.includes("-w")) process.stdout.write(failing ? process.env.HTTP_WRITE_OUT ?? "200" : "200");
  else console.log(noise);
  console.error(noise); process.exit(failing ? rc("UPLOAD_RC") : 0);
} else if (name === "aws") {
  if (args[0] === "s3" && args[1] === "cp") {
    const bytes = readFileSync(owned(args[2]));
    if (!rc("UPLOAD_RC")) writeFileSync(join(root, "objects", basename(args[3])), bytes);
    console.log(noise); console.error(noise); process.exit(rc("UPLOAD_RC"));
  } else if (args[0] === "s3api" && args[1] === "head-object") {
    let outputRc = 0;
    try {
      // Synchronous chunks let the shell close its pipe on overflow, without a
      // mock process.exit dropping buffered output or hiding a real file write.
      writeSync(1, process.env.STAT_OUTPUT_HEX === undefined ? process.env.STAT_OUTPUT ?? "64\\n" : Buffer.from(process.env.STAT_OUTPUT_HEX, "hex"));
      let remaining = rc("STAT_OUTPUT_BYTES");
      while (remaining > 0) {
        const chunk = Buffer.alloc(Math.min(4096, remaining), "x");
        remaining -= writeSync(1, chunk);
      }
    } catch (error) {
      if (error.code !== "EPIPE") throw error;
      outputRc = 141;
    }
    const output = fstatSync(1);
    appendFileSync(join(root, "stat-intake"), JSON.stringify({ regularFile: output.isFile(), retainedBytes: output.isFile() ? output.size : 0 }) + "\\n");
    console.error(noise); process.exit(rc("STAT_RC") || outputRc);
  } else process.exit(99);
} else if (name === "rm") {
  const paths = args.filter(a => !a.startsWith("-"));
  const directory = dirname(owned(paths[0]));
  const retainedBytes = readdirSync(directory).filter(name => !name.startsWith("archive.")).reduce((total, name) => total + statSync(join(directory, name)).size, 0);
  appendFileSync(join(root, "cleanup-intake"), JSON.stringify({ retainedBytes }) + "\\n");
  for (const path of paths) rmSync(owned(path), { force: true });
} else if (name === "rmdir") {
  for (const path of args.filter(a => !a.startsWith("-"))) rmdirSync(owned(path));
} else { console.error(noise); process.exit(99); }
`);
  chmodSync(mock, 0o700);
  for (const name of ["tar", "curl", "aws", "mktemp", "date", "df", "rm", "rmdir", "head", "security", "flyctl", "ssh", "zeroned", "zstd"]) {
    // Bun canonicalizes symlink argv[1]; keep each fake command's name explicit.
    const path = join(base, "bin", name);
    writeFileSync(path, readFileSync(mock, "utf8").replace("const name = basename(process.argv[1]);", `const name = ${JSON.stringify(name)};`));
    chmodSync(path, 0o700);
  }
  symlinkSync("/bin/bash", join(base, "bin", "bash"));
  writeFileSync(join(base, "objects", "legacy-known-good"), "preserve");
  writeFileSync(join(base, "objects", "legacy-raw"), "preserve");
  const env = { PATH: join(base, "bin"), HOME: join(base, "home"), TMPDIR: join(base, "tmp"), FIXTURE: base, LC_ALL: "C" };
  return {
    base, env,
    calls: (): Array<{ name: string; args: string[] }> => existsSync(join(base, "calls")) ? readFileSync(join(base, "calls"), "utf8").trim().split("\n").filter(Boolean).map((s) => JSON.parse(s)) : [],
    run: (args: string[], extra: Record<string, string> = {}) => spawnSync("/bin/bash", args, { cwd: base, env: { ...env, ...extra }, encoding: "utf8", timeout: 10000 }),
    close: () => rmSync(base, { recursive: true, force: true }),
  };
}

// In-process stand-in for fetch at the production S3 host: create, list one
// upload's parts, complete. It records operation names only, never URLs, and
// refuses any other host and any request without a SigV4 header.
const FAKE_MULTIPART_FETCH = `
const s3ops: string[] = [];
globalThis.fetch = async (input: string, init: any) => {
  const url = new URL(input);
  if (url.origin !== "https://fly.storage.tigris.dev") throw new Error("prohibited network");
  if (!/^AWS4-HMAC-SHA256 Credential=[^ ]+, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/.test(init.headers.authorization)) throw new Error("unsigned");
  const op = init.method === "POST" && url.searchParams.has("uploads") ? "create"
    : init.method === "GET" && url.searchParams.has("uploadId") ? "list"
    : init.method === "POST" && url.searchParams.has("uploadId") ? "complete" : "other";
  s3ops.push(op);
  if (op === "create") return new Response("<InitiateMultipartUploadResult><UploadId>fixture-upload</UploadId></InitiateMultipartUploadResult>");
  if (op === "list") return new Response("<ListPartsResult><IsTruncated>false</IsTruncated><Part><PartNumber>1</PartNumber><ETag>&quot;e1&quot;</ETag><Size>64</Size></Part></ListPartsResult>");
  if (op === "complete") return new Response("<CompleteMultipartUploadResult><ETag>x</ETag></CompleteMultipartUploadResult>");
  return new Response("", { status: 400 });
};
`;

describe("isolated import and shell execution", () => {
  test("import does not spawn, create S3 clients, fetch, log or write", () => {
    const f = shellFixture();
    try {
      const harness = join(f.base, "import.ts");
      writeFileSync(harness, `
const deny = () => { throw new Error("prohibited effect"); };
Bun.spawn = deny;
Bun.spawnSync = deny;
Object.defineProperty(Bun, "S3Client", { value: class { constructor() { deny(); } } });
globalThis.fetch = deny;
console.log = deny;
await import(${JSON.stringify(SUBJECT)});
`);
      const result = spawnSync(process.execPath, [harness], { cwd: f.base, env: f.env, encoding: "utf8", timeout: 10000 });
      expect(result.status).toBe(0);
      expect(result.stdout + result.stderr).toBe("");
      expect(f.calls()).toEqual([]);
      expect(readdirSync(join(f.base, "home"))).toEqual([]);
      expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
      const invalid = spawnSync(process.execPath, [SUBJECT, PRIVATE], { cwd: f.base, env: f.env, encoding: "utf8", timeout: 10000 });
      expect(invalid.status).toBe(2);
      expect(f.calls()).toEqual([]);
      expect(invalid.stdout + invalid.stderr).not.toContain(PRIVATE);
    } finally { f.close(); }
  });

  test("production adapter wiring runs only mocked credentials, subprocesses and S3", () => {
    // Testnet streams (multipart through the fake fetch); mainnet keeps the staged presign.
    const cases = [
      { mode: "present", code: 3, kills: 0, stats: 2, s3ops: ["create", "list", "complete"] },
      { mode: "credentials-fail", code: 1, kills: 0, stats: 0, s3ops: [] },
      { mode: "credentials-oversize", code: 1, kills: 1, stats: 0, s3ops: [] },
      { mode: "remote-oversize", code: 1, kills: 2, stats: 0, s3ops: ["create"] },
      { mode: "ssh-fail", code: 1, kills: 0, stats: 2, s3ops: ["create", "list", "complete"] },
    ];
    for (const c of cases) {
      const f = shellFixture();
      try {
        const harness = join(f.base, "adapter.ts");
        writeFileSync(harness, `
const mode = ${JSON.stringify(c.mode)};
let kills = 0;
let stats = 0;
const keys: string[] = [];
const presigns: unknown[] = [];
Bun.spawn = (args: string[], options: any) => {
  if (options.stderr !== "ignore") throw new Error("stderr must be discarded");
  const credential = args[0] === "security";
  if (!credential && args[0] !== "flyctl") throw new Error("unexpected command");
  const text = credential ? (mode === "credentials-oversize" ? "x".repeat(4097) : ${JSON.stringify(PRIVATE)})
    : (mode === "remote-oversize" ? "x".repeat(129)
      : String(args[args.length - 1]).includes("CHAIN_BACKUP_V3") ? ${JSON.stringify(streamRecord(1))} : ${JSON.stringify(record(1))});
  return {
    stdout: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(text)); c.close(); } }),
    exited: Promise.resolve((credential && mode === "credentials-fail") || (!credential && mode === "ssh-fail") ? 255 : 0),
    kill() { kills++; },
  };
};
Object.defineProperty(Bun, "S3Client", { value: class {
  presign(key: string, options: unknown) { keys.push(key); presigns.push(options); return ${JSON.stringify(URL_SENTINEL)}; }
  async stat() { stats++; return { size: 64 }; }
  list() { throw new Error("prohibited listing"); }
  delete() { throw new Error("prohibited deletion"); }
} });
${FAKE_MULTIPART_FETCH}
const { main } = await import(${JSON.stringify(SUBJECT)});
const logs: string[] = [];
const code = await main([], undefined, (line: string) => logs.push(line));
console.log(JSON.stringify({ code, logs, kills, stats, keys, presigns, s3ops }));
`);
        const result = spawnSync(process.execPath, [harness], { cwd: f.base, env: f.env, encoding: "utf8", timeout: 10000 });
        expect(result.status).toBe(0);
        expect(result.stderr).toBe("");
        expect(result.stdout).not.toContain(PRIVATE);
        const summary = JSON.parse(result.stdout);
        expect(summary).toMatchObject({ code: c.code, kills: c.kills, stats: c.stats, s3ops: c.s3ops });
        expect(summary.logs).toHaveLength(2);
        expect(new Set(summary.keys).size).toBe(summary.keys.length);
        // Signed before the remote tar: it must outlive a throttled multi-hour capture.
        expect(summary.presigns).toEqual(summary.keys.map(() => ({ method: "PUT", expiresIn: 43200 })));
        // Only the staged chain (mainnet) uses Bun's single-object presign now.
        expect(summary.keys.every((key: string) => key.startsWith("chain/zerone-1/"))).toBe(true);
        if (c.mode === "present") {
          expect(summary.presigns).toHaveLength(1);
          expect(summary.logs.map((line: string) => JSON.parse(line).capture_mode)).toEqual(["STREAMED_MULTIPART", "STAGED"]);
          expect(summary.logs.map((line: string) => JSON.parse(line).multipart_status)).toEqual(["COMPLETED", "NOT_STARTED"]);
        }
        expect(f.calls()).toEqual([]);
        expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
      } finally { f.close(); }
    }
  }, 15000);

  test("actual remote shell preserves tar status and never uploads fatal captures", () => {
    for (const tar of [0, 1, 2, 127]) {
      const f = shellFixture();
      try {
        const result = f.run(["-c", buildRemoteCommand(URL_SENTINEL)], { TAR_RC: String(tar) });
        expect(result.status).toBe(0);
        expect(result.stdout).toBe(record(tar, tar > 1 ? "NA" : 0));
        expect(result.stderr).toBe("");
        expect(f.calls().filter(c => c.name === "curl")).toHaveLength(tar > 1 ? 0 : 1);
        expect(f.calls().every(c => ["mktemp", "tar", "curl", "rm", "rmdir"].includes(c.name))).toBe(true);
        expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
      } finally { f.close(); }
    }
  }, 30000);

  test("remote upload errors and temporary setup failure stay bounded", () => {
    const cases: Array<{ env: Record<string, string>; stdout: string }> = [
      { env: { UPLOAD_RC: "22", HTTP_WRITE_OUT: "403" }, stdout: record(0, 22, 403) },
      { env: { UPLOAD_RC: "7", HTTP_WRITE_OUT: "000" }, stdout: record(0, 7, 0) },
      { env: { MKTEMP_RC: "1" }, stdout: record("NA", "NA") },
      // Anything but exactly three digits on curl's stdout is dropped, not relayed.
      ...["", "20", "2000", `${PRIVATE}`, "403 403", "4O3"].map(HTTP_WRITE_OUT => ({ env: { UPLOAD_RC: "22", HTTP_WRITE_OUT }, stdout: record(0, 22, "NA") })),
    ];
    for (const c of cases) {
      const f = shellFixture();
      try {
        const result = f.run(["-c", buildRemoteCommand(URL_SENTINEL)], c.env);
        expect(result.status).toBe(0);
        expect(result.stdout).toBe(c.stdout);
        expect(result.stderr).toBe("");
        if (c.env.MKTEMP_RC) expect(f.calls().map(c => c.name)).toEqual(["mktemp"]);
      } finally { f.close(); }
    }
  }, 30000);

  test("presigned URL remains data even with hostile shell characters", () => {
    const f = shellFixture();
    try {
      const url = `${URL_SENTINEL}&quote='\"; zeroned snapshots export; $(zeroned); \`zeroned\``;
      const result = f.run(["-c", buildRemoteCommand(url)]);
      expect(result.stdout).toBe(record());
      expect(result.stderr).toBe("");
      expect(f.calls().find(c => c.name === "curl")?.args.at(-1)).toBe(url);
      expect(f.calls().some(c => c.name === "zeroned")).toBe(false);
    } finally { f.close(); }
  });

  test("fallback handles tar/upload/stat failures without snapshot, export or deletion", () => {
    const cases: Array<{ env: Record<string, string>; code: number; capture: string; upload: string; object: string }> = [
      { env: { TAR_RC: "0" }, code: 3, capture: "RAW_UNVERIFIED", upload: "PRESENT", object: "PRESENT" },
      { env: { TAR_RC: "1" }, code: 3, capture: "RAW_UNVERIFIED", upload: "PRESENT", object: "PRESENT" },
      { env: { STAT_OUTPUT: "9".repeat(16) + "\n" }, code: 3, capture: "RAW_UNVERIFIED", upload: "PRESENT", object: "PRESENT" },
      { env: { TAR_RC: "2" }, code: 1, capture: "FAILED", upload: "NOT_ATTEMPTED", object: "NOT_ATTEMPTED" },
      { env: { TAR_RC: "127" }, code: 1, capture: "FAILED", upload: "NOT_ATTEMPTED", object: "NOT_ATTEMPTED" },
      { env: { UPLOAD_RC: "22" }, code: 1, capture: "RAW_UNVERIFIED", upload: "FAILED", object: "PRESENT" },
      { env: { STAT_RC: "1" }, code: 1, capture: "RAW_UNVERIFIED", upload: "FAILED", object: "FAILED" },
      ...["0\n", "garbage\n", "64\nextra\n", "64", "64\r\n", "1".repeat(17) + "\n", "1".repeat(200) + "\n"].map(STAT_OUTPUT => ({ env: { STAT_OUTPUT }, code: 1, capture: "RAW_UNVERIFIED", upload: "FAILED", object: "FAILED" })),
      ...["64\n\0", "6\x004\n"].map(output => ({ env: { STAT_OUTPUT_HEX: Buffer.from(output).toString("hex") }, code: 1, capture: "RAW_UNVERIFIED", upload: "FAILED", object: "FAILED" })),
      { env: { MKTEMP_RC: "1" }, code: 1, capture: "FAILED", upload: "NOT_ATTEMPTED", object: "NOT_ATTEMPTED" },
    ];
    for (const c of cases) {
      const f = shellFixture();
      try {
        const result = f.run([FALLBACK], c.env);
        expect(result.status).toBe(c.code);
        expect(result.stderr).toBe("");
        expect(result.stdout).not.toContain(PRIVATE);
        expect(JSON.parse(result.stdout)).toMatchObject({ capture_status: c.capture, upload_status: c.upload, object_status: c.object, recovery_status: "NOT_ASSESSED", retention_status: "DISABLED" });
        const calls = f.calls();
        expect(calls.some(c => ["zeroned", "security", "flyctl", "ssh", "curl"].includes(c.name))).toBe(false);
        expect(calls.filter(c => c.name === "aws").every(c => ["s3 cp", "s3api head-object"].includes(c.args.slice(0, 2).join(" ")))).toBe(true);
        if (c.capture === "FAILED") expect(calls.some(c => c.name === "aws")).toBe(false);
        expect(readFileSync(join(f.base, "objects", "legacy-known-good"), "utf8")).toBe("preserve");
        expect(readFileSync(join(f.base, "objects", "legacy-raw"), "utf8")).toBe("preserve");
        expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
      } finally { f.close(); }
    }
  }, 60000);

  test("fallback trailing separators keep tar members relative to the configured home", () => {
    for (const suffix of ["", "/", "//", "////"]) {
      const f = shellFixture();
      try {
        const parent = join(f.base, "synthetic-node");
        const result = f.run([FALLBACK], { DATA_DIR: `${parent}/.zeroned${suffix}` });
        expect(result.status).toBe(3);
        expect(result.stderr).toBe("");
        const args = f.calls().find(c => c.name === "tar")!.args;
        expect(args.slice(args.indexOf("-C"))).toEqual(["-C", parent, ".zeroned/data", ".zeroned/config"]);
        expect(JSON.parse(result.stdout)).toMatchObject({ capture_status: "RAW_UNVERIFIED", upload_status: "PRESENT" });
        expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
      } finally { f.close(); }
    }
  }, 15000);

  test("fallback bounds object-result intake before cleanup and rejects a valid prefix with overflow", () => {
    for (const prefix of ["", "64\n"]) {
      const f = shellFixture();
      try {
        const result = f.run([FALLBACK], { STAT_OUTPUT: prefix, STAT_OUTPUT_BYTES: String(1024 * 1024) });
        expect(result.status).toBe(1);
        expect(result.stderr).toBe("");
        expect(result.stdout).not.toContain(PRIVATE);
        expect(JSON.parse(result.stdout)).toMatchObject({ capture_status: "RAW_UNVERIFIED", tar_exit: 0, upload_status: "FAILED", upload_exit: 0, object_status: "FAILED", error: "OBJECT_FAILED" });
        // Observe the producer's actual destination and bytes retained before
        // cleanup, not just the parser's eventual error or an emptied directory.
        expect(JSON.parse(readFileSync(join(f.base, "stat-intake"), "utf8"))).toEqual({ regularFile: false, retainedBytes: 0 });
        expect(JSON.parse(readFileSync(join(f.base, "cleanup-intake"), "utf8"))).toEqual({ retainedBytes: 0 });
        expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
        expect(f.calls().filter(c => c.name === "aws").map(c => c.args.slice(0, 2))).toEqual([["s3", "cp"], ["s3api", "head-object"]]);
      } finally { f.close(); }
    }
  }, 10000);

  test("fallback validates arguments and configuration before any command", () => {
    const f = shellFixture();
    try {
      for (const [args, env] of [
        [[PRIVATE], {}], [[], { CHAIN: PRIVATE }], [[], { DATA_DIR: "relative" }],
        ...["/", "//", "///", "////"].map(DATA_DIR => [[], { DATA_DIR }]),
        [[], { BUCKET: PRIVATE }], [[], { AWS_ENDPOINT_URL_S3: "http://bad.invalid" }],
      ] as Array<[string[], Record<string, string>]>) {
        const result = f.run([FALLBACK, ...args], env);
        expect(result.status).toBe(2);
        expect(result.stdout + result.stderr).not.toContain(PRIVATE);
        expect(f.calls()).toEqual([]);
      }
    } finally { f.close(); }
  });

  test("repeated fallback captures preserve all generations without listing/pruning", () => {
    const f = shellFixture();
    try {
      for (let i = 0; i < 20; i++) expect(f.run([FALLBACK], { TAR_RC: String(i % 2) }).status).toBe(3);
      expect(readdirSync(join(f.base, "objects"))).toHaveLength(22);
      expect(f.calls().filter(c => c.name === "aws").every(c => ["s3 cp", "s3api head-object"].includes(c.args.slice(0, 2).join(" ")))).toBe(true);
      expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
    } finally { f.close(); }
  }, 60000);
});

// Ledger zc-chain-backup-runner: key-free archives, a low-disk pre-flight skip
// and a per-chain landed marker, rolled out to testnet before mainnet.
const skipRecord = (free: number | "NA", need: number) => `CHAIN_BACKUP_V2 skip=LOW_DISK free_kib=${free} need_kib=${need}\n`;
const GIB = 1024 ** 3;

describe("rollout contract: testnet first, then mainnet", () => {
  test("both chains are in the rollout; the 2026-10-19 capture stays pinned for any chain outside it", () => {
    // Mainnet joined after testnet's clean night of 2026-10-21 (key_files EXCLUDED, marker written).
    expect(ROLLOUT_CHAINS).toEqual(["zerone-testnet-1", "zerone-1"]);
    expect([...ROLLOUT_CHAINS].sort()).toEqual([...parseArgs([])!].sort());
    // sha256 of the 8079e93 (#105) builder's output for URL_SENTINEL.
    const pinned = "1bf1b28d0e2300e27511c1d5bd3e5d87ebed6512e41656782cdbf1a11d23be39";
    expect(createHash("sha256").update(buildRemoteCommand(URL_SENTINEL)).digest("hex")).toBe(pinned);
    expect(buildRemoteCommand(URL_SENTINEL, { excludeKeys: false, needKib: null })).toBe(buildRemoteCommand(URL_SENTINEL));
  });

  test("each chain is asked for a key-free capture: testnet streamed, mainnet staged against its own landed marker", async () => {
    const commands = new Map<string, string>();
    // The 2026-10-21 landed sizes: testnet 6642907918 bytes, mainnet 6902331974 bytes.
    const landed: Record<string, number> = { "zerone-testnet-1": 6642907918, "zerone-1": 6902331974 };
    const { effects } = fakeEffects({
      lastLandedBytes: async (chain) => landed[chain],
      remote: async (chain, command) => { commands.set(chain, command); return { code: 0, stdout: answer(command) }; },
    });
    const { code, outcomes } = await runMain(effects, []);
    expect(code).toBe(3);
    expect([needKib(landed["zerone-testnet-1"]), needKib(landed["zerone-1"])]).toEqual([7535791, 7789135]);
    // Testnet's streamed bound is one part plus the margin, whatever its marker says.
    const parts = Array.from({ length: MAX_PARTS }, (_, i) => `${URL_SENTINEL}&uploadId=${UPLOAD_ID}&partNumber=${i + 1}`);
    expect(commands.get("zerone-testnet-1")).toBe(buildStreamedRemoteCommand(parts, { excludeKeys: true, needKib: streamNeedKib() }));
    expect(commands.get("zerone-1")).toBe(buildRemoteCommand(URL_SENTINEL, { excludeKeys: true, needKib: needKib(landed["zerone-1"]) }));
    expect(commands.get("zerone-1")).not.toBe(buildRemoteCommand(URL_SENTINEL));
    expect(outcomes.map((o) => [o.chain, o.key_files, o.disk_need_kib, o.capture_mode])).toEqual([
      ["zerone-testnet-1", "EXCLUDED", 1310720, "STREAMED_MULTIPART"], ["zerone-1", "EXCLUDED", 7789135, "STAGED"],
    ]);
  });

  test("the pre-flight bound is the last landed archive plus 1 GiB, in KiB", async () => {
    expect(LOW_DISK_MARGIN_BYTES).toBe(GIB);
    expect(needKib(null)).toBe(1048576);
    expect(needKib(5 * GIB)).toBe(6 * 1048576);
    expect(needKib(5 * GIB + 1)).toBe(6 * 1048576 + 1);
    for (const bad of [0, -1, NaN, 0.5, Infinity]) expect(needKib(bad)).toBe(1048576);
    for (const [last, need] of [[async () => 3 * GIB, 4 * 1048576], [async () => { throw new Error(PRIVATE); }, 1048576]] as const) {
      const { outcomes, logs } = await runMain(fakeEffects({ lastLandedBytes: last }).effects, ["zerone-1"]);
      expect(outcomes[0].disk_need_kib).toBe(need);
      expect(logs.join("\n")).not.toContain(PRIVATE);
      // The streamed chain never reads its marker for the bound.
      const streamed = await runMain(fakeEffects({ lastLandedBytes: last }).effects, ["zerone-testnet-1"]);
      expect(streamed.outcomes[0].disk_need_kib).toBe(streamNeedKib());
    }
    expect(() => buildRemoteCommand(URL_SENTINEL, { excludeKeys: true, needKib: 0 })).toThrow();
    expect(() => buildRemoteCommand(URL_SENTINEL, { excludeKeys: true, needKib: 1.5 })).toThrow();
  });

  test("a low-disk skip is parsed strictly and only from a chain that asked for it", async () => {
    expect(parseRemoteResult(skipRecord(500, 1048576))).toEqual({ kind: "skip", freeKib: 500, needKib: 1048576 });
    expect(parseRemoteResult(skipRecord("NA", 1048576))).toEqual({ kind: "skip", freeKib: null, needKib: 1048576 });
    for (const bad of [skipRecord(1048576, 1048576), skipRecord(2000000, 1048576), skipRecord(500, 1048576).trim(),
      skipRecord(500, 1048576).replace("free_kib=500", "free_kib=0500"), skipRecord(500, 1048576).replace("need_kib=1048576", "need_kib=0"),
      skipRecord(500, 1048576).replace("LOW_DISK", "OTHER"), skipRecord(500, 1048576) + record(),
      `CHAIN_BACKUP_V2 skip=LOW_DISK free_kib=1 need_kib=${"9".repeat(17)}\n`]) {
      expect(parseRemoteResult(bad)).toBeNull();
    }
    // A skip whose bound differs from the one this chain asked for is not believed.
    for (const [chain, stdout] of [["zerone-1", skipRecord(500, 2097152)], ["zerone-testnet-1", skipRecord(500, 2097152)]] as const) {
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout }) });
      const { code, outcomes } = await runMain(effects, [chain]);
      expect(code).toBe(1);
      expect(outcomes[0]).toMatchObject({ error: "PROTOCOL_FAILED", landed_marker: "NOT_WRITTEN" });
      expect(calls.filter((c) => c === "stat" || c.startsWith("mark:"))).toEqual([]);
    }
  });

  test("a low-disk skip is red, uploads nothing and writes no marker, on either chain", async () => {
    for (const [chain, need] of [["zerone-testnet-1", streamNeedKib()], ["zerone-1", 1048576]] as const) {
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout: skipRecord(700000, need) }) });
      const { code, outcomes } = await runMain(effects, [chain]);
      expect(code).toBe(1);
      expect(outcomes[0]).toMatchObject({
        chain, capture_status: "SKIPPED", tar_exit: null, upload_status: "NOT_ATTEMPTED", object_status: "NOT_ATTEMPTED",
        key_files: "EXCLUDED", disk_free_kib: 700000, disk_need_kib: need, landed_marker: "NOT_WRITTEN", error: "SKIPPED_LOW_DISK",
      });
      expect(calls.filter((c) => c === "stat" || c === "list-parts" || c.startsWith("complete") || c.startsWith("mark:"))).toEqual([]);
    }
    // Mainnet's own bound: its 2026-10-21 marker (6902331974 bytes) plus 1 GiB.
    const { effects, calls } = fakeEffects({
      lastLandedBytes: async () => 6902331974,
      remote: async () => ({ code: 0, stdout: skipRecord(7789134, 7789135) }),
    });
    const { code, outcomes } = await runMain(effects, ["zerone-1"]);
    expect(code).toBe(1);
    expect(outcomes[0]).toMatchObject({ chain: "zerone-1", disk_free_kib: 7789134, disk_need_kib: 7789135, error: "SKIPPED_LOW_DISK" });
    expect(calls.filter((c) => c === "stat" || c.startsWith("mark:"))).toEqual([]);
  });

  test("the landed marker is written only after a clean landing, with the object's size", async () => {
    const landed = fakeEffects({ stat: async () => ({ size: 4096 }) });
    landed.effects.multipart.listParts = async () => onePart(4096);
    expect((await runMain(landed.effects, [])).outcomes.map((o) => o.landed_marker)).toEqual(["WRITTEN", "WRITTEN"]);
    expect(landed.calls.filter((c) => c.startsWith("mark:"))).toEqual(["mark:zerone-testnet-1:4096:EXCLUDED", "mark:zerone-1:4096:EXCLUDED"]);
    for (const [tar, upload, ssh, size] of [[2, "NA", 0, 64], [1, 22, 0, 64], [0, 0, 0, 0], [0, 0, 255, 64]] as const) {
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: ssh, stdout: record(tar, upload) }), stat: async () => ({ size }) });
      const { outcomes } = await runMain(effects);
      expect(outcomes[0].landed_marker).toBe("NOT_WRITTEN");
      expect(calls.some((c) => c.startsWith("mark:"))).toBe(false);
    }
    // A marker that cannot be written is reported; the landed upload stays landed.
    const broken = await runMain(fakeEffects({ markLanded: async () => { throw new Error(PRIVATE); } }).effects);
    expect(broken.code).toBe(3);
    expect(broken.outcomes[0]).toMatchObject({ upload_status: "PRESENT", error: null, landed_marker: "FAILED" });
    expect(broken.logs.join("\n")).not.toContain(PRIVATE);
  });

  test("remote shell: the rollout capture drops both key files and keeps the members", () => {
    expect(EXCLUDED_KEY_FILES).toEqual(["priv_validator_key.json", "node_key.json"]);
    const f = shellFixture();
    try {
      const result = f.run(["-c", buildRemoteCommand(URL_SENTINEL, { excludeKeys: true, needKib: 1048576 })]);
      expect(result.status).toBe(0);
      expect(result.stdout).toBe(record());
      expect(result.stderr).toBe("");
      const args = f.calls().find((c) => c.name === "tar")!.args;
      expect(args.filter((a) => a.startsWith("--exclude="))).toEqual(["--exclude=priv_validator_key.json", "--exclude=node_key.json"]);
      expect(args.join(" ")).not.toContain("priv_validator_state");
      expect(args.slice(args.indexOf("-C"))).toEqual(["-C", "/data", ".zeroned/data", ".zeroned/config"]);
      expect(f.calls().map((c) => c.name)).toEqual(["mktemp", "df", "tar", "curl", "rm", "rmdir"]);
      expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
    } finally { f.close(); }
  });

  test("remote shell: too little or unknown free space skips before tar and cleans up", () => {
    const header = "Filesystem 1024-blocks Used Available Capacity Mounted on\n";
    const cases: Array<{ env: Record<string, string>; stdout: string }> = [
      { env: { DF_OUTPUT: `${header}overlay 8000000 7300000 700000 92% /\n` }, stdout: skipRecord(700000, 1048576) },
      { env: { DF_OUTPUT: `${header}overlay 8000000 6951424 1048575 87% /\n` }, stdout: skipRecord(1048575, 1048576) },
      { env: { DF_OUTPUT: "" }, stdout: skipRecord("NA", 1048576) },
      { env: { DF_OUTPUT: header }, stdout: skipRecord("NA", 1048576) },
      { env: { DF_OUTPUT: `${header}overlay 8000000 1 ${PRIVATE} 1% /\n` }, stdout: skipRecord("NA", 1048576) },
      { env: { DF_RC: "1", DF_OUTPUT: "" }, stdout: skipRecord("NA", 1048576) },
    ];
    for (const c of cases) {
      const f = shellFixture();
      try {
        const result = f.run(["-c", buildRemoteCommand(URL_SENTINEL, { excludeKeys: true, needKib: 1048576 })], c.env);
        expect(result.status).toBe(0);
        expect(result.stdout).toBe(c.stdout);
        expect(result.stderr).toBe("");
        expect(f.calls().map((call) => call.name)).toEqual(["mktemp", "df", "rm", "rmdir"]);
        expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
      } finally { f.close(); }
    }
    const f = shellFixture();
    try {
      const exact = f.run(["-c", buildRemoteCommand(URL_SENTINEL, { excludeKeys: true, needKib: 1048576 })],
        { DF_OUTPUT: `${header}overlay 8000000 6951424 1048576 87% /\n` });
      expect(exact.stdout).toBe(record());
    } finally { f.close(); }
  }, 30000);

  test("fallback in-node script also leaves both key files out", () => {
    const f = shellFixture();
    try {
      const result = f.run([FALLBACK]);
      expect(result.status).toBe(3);
      expect(JSON.parse(result.stdout).key_files).toBe("EXCLUDED");
      for (const env of [{ TAR_RC: "2" }, { UPLOAD_RC: "22" }, { MKTEMP_RC: "1" }]) {
        expect(JSON.parse(f.run([FALLBACK], env).stdout).key_files).toBe("EXCLUDED");
      }
      const args = f.calls().find((c) => c.name === "tar")!.args;
      expect(args.filter((a) => a.startsWith("--exclude="))).toEqual(["--exclude=priv_validator_key.json", "--exclude=node_key.json"]);
    } finally { f.close(); }
  });

  test("production markers live under HOME, are atomic and feed the staged chain's next pre-flight", () => {
    const f = shellFixture();
    try {
      const harness = join(f.base, "marker.ts");
      writeFileSync(harness, `
const commands: string[] = [];
Bun.spawn = (args: string[]) => {
  const credential = args[0] === "security";
  const command = String(args[args.length - 1]);
  if (!credential) commands.push(command);
  const text = credential ? "fixture-credential" : command.includes("CHAIN_BACKUP_V3") ? ${JSON.stringify(streamRecord(1))} : ${JSON.stringify(record(1))};
  return { stdout: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(text)); c.close(); } }), exited: Promise.resolve(0), kill() {} };
};
Object.defineProperty(Bun, "S3Client", { value: class {
  presign() { return ${JSON.stringify(URL_SENTINEL)}; }
  async stat(key: string) { return { size: key.startsWith("chain/zerone-1/") ? ${5 * GIB} : 64 }; }
} });
${FAKE_MULTIPART_FETCH}
const { main, buildRemoteCommand, streamNeedKib } = await import(${JSON.stringify(SUBJECT)});
const codes: number[] = [];
// Mainnet's first bound is the margin alone: testnet's marker never sizes it.
for (const chain of ["zerone-testnet-1", "zerone-testnet-1", "zerone-1", "zerone-1"]) codes.push(await main([chain], undefined, () => {}));
const bound = (need: number) => '"$free" ' + need + '; exit 0; fi';
console.log(JSON.stringify({ codes, s3ops,
  streamed: commands.slice(0, 2).map((c) => c.includes("CHAIN_BACKUP_V3") && c.includes(bound(streamNeedKib()))),
  staged: commands.slice(2), expected: [
    buildRemoteCommand(${JSON.stringify(URL_SENTINEL)}, { excludeKeys: true, needKib: 1048576 }),
    buildRemoteCommand(${JSON.stringify(URL_SENTINEL)}, { excludeKeys: true, needKib: 6 * 1048576 }),
] }));
`);
      const result = spawnSync(process.execPath, [harness], { cwd: f.base, env: f.env, encoding: "utf8", timeout: 10000 });
      expect(result.stderr).toBe("");
      const summary = JSON.parse(result.stdout);
      expect(summary.codes).toEqual([3, 3, 3, 3]);
      expect(summary.s3ops).toEqual(["create", "list", "complete", "create", "list", "complete"]);
      // Testnet's streamed bound stays one part plus the margin after its marker exists.
      expect(summary.streamed).toEqual([true, true]);
      expect(summary.staged).toEqual(summary.expected);
      const dir = join(f.base, "home", ".kingdom", "state", "chain-backup");
      expect(readdirSync(dir).sort()).toEqual(["zerone-1.landed", "zerone-testnet-1.landed"]);
      for (const [chain, bytes] of [["zerone-testnet-1", 64], ["zerone-1", 5 * GIB]] as const) {
        expect(JSON.parse(readFileSync(join(dir, `${chain}.landed`), "utf8"))).toMatchObject({
          protocol: "kingdom.chain-backup.landed/1", chain, bytes, capture_status: "RAW_UNVERIFIED", key_files: "EXCLUDED",
        });
      }
    } finally { f.close(); }
  }, 15000);
});

// Ledger zc-chain-backup-runner, remaining step: a streamed multipart capture so
// no whole archive is staged on the validator's rootfs. Testnet rehearses it
// for several nights; mainnet keeps the staged capture, byte for byte, until then.
const STREAM_NEED = streamNeedKib();
const partUrls = (count = MAX_PARTS) => Array.from({ length: count }, (_, i) => `${URL_SENTINEL}&uploadId=${UPLOAD_ID}&partNumber=${i + 1}`);
const fullParts = (count: number, last: number): UploadedPart[] =>
  Array.from({ length: count }, (_, i) => ({ partNumber: i + 1, etag: `"e${i + 1}"`, size: i === count - 1 ? last : PART_BYTES }));

describe("streamed multipart capture: testnet rehearses, mainnet unchanged", () => {
  test("only testnet streams; mainnet's staged command is byte-identical to the installed runner (524a73c5)", () => {
    expect(STREAM_CHAINS).toEqual(["zerone-testnet-1"]);
    expect([PART_BYTES, MAX_PARTS, STREAM_NEED]).toEqual([256 * 1024 ** 2, 64, 1310720]);
    // sha256 of 524a73c5's builder output for mainnet's 2026-10-28 bound and for the margin alone.
    const pins: Array<[number, string]> = [
      [7789135, "6ed8e4f42899d0bd7983b6fa0aa9b3f30d871943e92bcc0818c85781ee7b1fb3"],
      [1048576, "f33939351f1b8826aa5a5883180cd1eca471a105a3cb0f45ca79c7983c9a5603"],
    ];
    for (const [need, pin] of pins) {
      expect(createHash("sha256").update(buildRemoteCommand(URL_SENTINEL, { excludeKeys: true, needKib: need })).digest("hex")).toBe(pin);
    }
  });

  test("a whole stream is created, listed, completed, sized and marked", async () => {
    const commands: string[] = [];
    const { effects, calls } = fakeEffects({
      remote: async (_chain, command) => { calls.push("remote"); commands.push(command); return { code: 0, stdout: streamRecord(1, 27) }; },
      stat: async () => { calls.push("stat"); return { size: 26 * PART_BYTES + 5 }; },
    });
    effects.multipart.listParts = async () => { calls.push("list-parts"); return fullParts(27, 5); };
    const { code, outcomes } = await runMain(effects, ["zerone-testnet-1"]);
    expect(code).toBe(3);
    expect(outcomes[0]).toMatchObject({
      chain: "zerone-testnet-1", capture_mode: "STREAMED_MULTIPART", capture_status: "RAW_UNVERIFIED", tar_exit: 1,
      parts: 27, upload_status: "PRESENT", upload_exit: 0, upload_http: 200, object_status: "PRESENT",
      multipart_status: "COMPLETED", key_files: "EXCLUDED", disk_need_kib: STREAM_NEED, landed_marker: "WRITTEN", error: null,
    });
    const key = "chain/zerone-testnet-1/zerone-testnet-1-data-fixture-0.tar.gz";
    expect(calls).toEqual([`create:${key}`, "remote", "list-parts", "complete:27", "stat", `mark:zerone-testnet-1:${26 * PART_BYTES + 5}:EXCLUDED`]);
    expect(commands).toEqual([buildStreamedRemoteCommand(partUrls(), { excludeKeys: true, needKib: STREAM_NEED })]);
    // The single-object presign is never used for the streamed chain.
    expect(calls.some((c) => c.startsWith("presign:"))).toBe(false);
  });

  test("a torn stream is never completed, stat-ed or marked, and stays OPEN", async () => {
    const cases: Array<{ stdout: string; error: string; capture: string }> = [
      { stdout: streamRecord(141, 3, 22, 403), error: "UPLOAD_FAILED", capture: "FAILED" },
      { stdout: streamRecord(141, 3, 7, "NA"), error: "UPLOAD_FAILED", capture: "FAILED" },
      { stdout: streamRecord(141, 2, "STAGE", 200), error: "UPLOAD_FAILED", capture: "FAILED" },
      { stdout: streamRecord(141, 0, "STAGE", "NA"), error: "UPLOAD_FAILED", capture: "FAILED" },
      { stdout: streamRecord(141, MAX_PARTS, "OVER", 200), error: "UPLOAD_FAILED", capture: "FAILED" },
      { stdout: streamRecord(2, 26, 0, 200), error: "CAPTURE_FAILED", capture: "FAILED" },
    ];
    for (const c of cases) {
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout: c.stdout }) });
      const { code, outcomes } = await runMain(effects, ["zerone-testnet-1"]);
      expect(code).toBe(1);
      expect(outcomes[0]).toMatchObject({ capture_status: c.capture, upload_status: "FAILED", object_status: "NOT_ATTEMPTED", multipart_status: "OPEN", landed_marker: "NOT_WRITTEN", error: c.error });
      expect(calls.filter((x) => x === "list-parts" || x.startsWith("complete") || x === "stat" || x.startsWith("mark:"))).toEqual([]);
    }
    // Nothing reached the pipe: no part attempted, nothing to complete.
    for (const [stdout, error] of [[streamRecord(2, 0, "NA"), "CAPTURE_FAILED"], [streamRecord("NA", 0, "NA"), "SETUP_FAILED"]] as const) {
      const { outcomes } = await runMain(fakeEffects({ remote: async () => ({ code: 0, stdout }) }).effects, ["zerone-testnet-1"]);
      expect(outcomes[0]).toMatchObject({ upload_status: "NOT_ATTEMPTED", multipart_status: "OPEN", error });
    }
  });

  test("a listing that is not exactly the reported parts is refused before completion", async () => {
    const listings: UploadedPart[][] = [
      [], fullParts(2, 5), fullParts(3, 5).slice(1), fullParts(3, 0), fullParts(3, PART_BYTES + 1),
      fullParts(3, 5).map((p, i) => (i === 0 ? { ...p, size: PART_BYTES - 1 } : p)),
      fullParts(3, 5).map((p, i) => (i === 1 ? { ...p, partNumber: 5 } : p)),
      fullParts(3, 5).map((p, i) => (i === 2 ? { ...p, etag: "" } : p)),
      fullParts(3, 5).map((p, i) => (i === 2 ? { ...p, etag: "e\n3" } : p)),
    ];
    expect(partsAreWhole(fullParts(3, 5), 3)).toBe(true);
    expect(partsAreWhole(fullParts(3, PART_BYTES), 3)).toBe(true);
    for (const listed of listings) {
      expect(partsAreWhole(listed, 3)).toBe(false);
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout: streamRecord(1, 3) }) });
      effects.multipart.listParts = async () => listed;
      const { code, outcomes } = await runMain(effects, ["zerone-testnet-1"]);
      expect(code).toBe(1);
      expect(outcomes[0]).toMatchObject({ multipart_status: "OPEN", error: "MULTIPART_FAILED", landed_marker: "NOT_WRITTEN" });
      expect(calls.some((c) => c.startsWith("complete") || c === "stat")).toBe(false);
    }
    const failing = fakeEffects({ remote: async () => ({ code: 0, stdout: streamRecord(1, 1) }) });
    failing.effects.multipart.listParts = async () => { throw new Error(`${PRIVATE} ${URL_SENTINEL}`); };
    const result = await runMain(failing.effects, ["zerone-testnet-1"]);
    expect(result.outcomes[0].error).toBe("MULTIPART_FAILED");
    expect(result.logs.join("\n")).not.toContain(PRIVATE);
  });

  test("completion failure and size mismatch keep the run red; stat still decides presence", async () => {
    // Complete threw, but the object exists at the parts' sum: present, yet still a failure.
    const lost = fakeEffects({ remote: async () => ({ code: 0, stdout: streamRecord(1, 1) }) });
    lost.effects.multipart.complete = async () => { throw new Error(PRIVATE); };
    let run = await runMain(lost.effects, ["zerone-testnet-1"]);
    expect(run.code).toBe(1);
    expect(run.outcomes[0]).toMatchObject({ multipart_status: "COMPLETED", object_status: "PRESENT", upload_status: "PRESENT", error: "MULTIPART_FAILED", landed_marker: "NOT_WRITTEN" });
    expect(run.logs.join("\n")).not.toContain(PRIVATE);
    lost.effects.stat = async () => { throw new Error(PRIVATE); };
    run = await runMain(lost.effects, ["zerone-testnet-1"]);
    expect(run.outcomes[0]).toMatchObject({ multipart_status: "UNKNOWN", object_status: "FAILED", upload_status: "FAILED", error: "MULTIPART_FAILED" });
    for (const size of [63, 65, 0, NaN]) {
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout: streamRecord(1, 1) }), stat: async () => ({ size }) });
      const { code, outcomes } = await runMain(effects, ["zerone-testnet-1"]);
      expect(code).toBe(1);
      expect(outcomes[0]).toMatchObject({ multipart_status: "COMPLETED", object_status: "FAILED", error: "OBJECT_FAILED", landed_marker: "NOT_WRITTEN" });
      expect(calls.some((c) => c.startsWith("mark:"))).toBe(false);
    }
    // SSH failure after a clean record: completed and present, still red, no marker.
    const ssh = await runMain(fakeEffects({ remote: async () => ({ code: 255, stdout: streamRecord(1, 1) }) }).effects, ["zerone-testnet-1"]);
    expect(ssh.outcomes[0]).toMatchObject({ ssh_exit: 255, multipart_status: "COMPLETED", object_status: "PRESENT", error: "REMOTE_FAILED", landed_marker: "NOT_WRITTEN" });
  });

  test("records cross no protocols, and multipart setup failures never reach the remote", async () => {
    for (const [chain, stdout] of [
      ["zerone-testnet-1", record(1)], ["zerone-1", streamRecord(1)], ["zerone-testnet-1", streamRecord(1, MAX_PARTS + 1)],
      ["zerone-testnet-1", streamRecord(141, 3, "OVER")],
    ] as const) {
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout }) });
      const { outcomes } = await runMain(effects, [chain]);
      expect(outcomes[0].error).toBe("PROTOCOL_FAILED");
      expect(calls.some((c) => c === "list-parts" || c.startsWith("complete") || c === "stat")).toBe(false);
    }
    for (const create of [async () => { throw new Error(PRIVATE); }, async () => "", async () => "bad id", async () => "x".repeat(1025), async () => 7 as unknown as string]) {
      const { effects, calls } = fakeEffects();
      effects.multipart.create = create;
      const { code, outcomes, logs } = await runMain(effects, ["zerone-testnet-1"]);
      expect(code).toBe(1);
      expect(outcomes[0]).toMatchObject({ error: "SETUP_FAILED", upload_status: "NOT_ATTEMPTED", multipart_status: "NOT_STARTED" });
      expect(calls).not.toContain("remote");
      expect(logs.join("\n")).not.toContain(PRIVATE);
    }
    // A command too long for one bash -c argument is refused before SSH.
    const { effects, calls } = fakeEffects();
    effects.multipart.presignPart = () => `${URL_SENTINEL}&pad=${"x".repeat(Math.ceil(MAX_REMOTE_COMMAND_BYTES / MAX_PARTS))}`;
    const long = await runMain(effects, ["zerone-testnet-1"]);
    expect(long.outcomes[0]).toMatchObject({ error: "SETUP_FAILED", multipart_status: "OPEN" });
    expect(calls).not.toContain("remote");
  });

  test("the launchd exit stays 1 whenever mainnet skips, even when testnet's stream lands", async () => {
    const remote: Effects["remote"] = async (chain, command) => ({ code: 0, stdout: chain === "zerone-1" ? skipRecord(7688868, 7789135) : answer(command) });
    const { code, outcomes } = await runMain(fakeEffects({ remote, lastLandedBytes: async () => 6902331974 }).effects, []);
    expect(code).toBe(1);
    expect(outcomes.map((o) => [o.chain, o.error, o.landed_marker])).toEqual([
      ["zerone-testnet-1", null, "WRITTEN"], ["zerone-1", "SKIPPED_LOW_DISK", "NOT_WRITTEN"],
    ]);
    expect((await runMain(fakeEffects().effects, [])).code).toBe(3);
  });

  test("V3 records are parsed strictly", () => {
    expect(parseRemoteResult(streamRecord(1, 27))).toEqual({ kind: "stream", tarExit: 1, parts: 27, upload: 0, uploadHttp: 200 });
    expect(parseRemoteResult(streamRecord(141, 2, "STAGE", 200))).toEqual({ kind: "stream", tarExit: 141, parts: 2, upload: "STAGE", uploadHttp: 200 });
    expect(parseRemoteResult(streamRecord("NA", 0, "NA"))).toEqual({ kind: "stream", tarExit: null, parts: 0, upload: null, uploadHttp: null });
    for (const bad of [
      streamRecord(1, 0, 0), streamRecord(1, 0, "OVER"), streamRecord("NA", 1, "NA"), streamRecord("NA", 0, 0), streamRecord(1, 2, "NA"),
      streamRecord(1, 0, "NA", 200), streamRecord(1, 0, "STAGE", 200), streamRecord(256, 1), streamRecord(1, 1, 256),
      streamRecord(1).replace("parts=1", "parts=01"), streamRecord(1).replace("parts=1", "parts=123456"), streamRecord(1).trim(),
      streamRecord(1) + streamRecord(1), streamRecord(1).replace("upload=0", "upload=ABORT"), `${PRIVATE}\n${streamRecord(1)}`,
      streamRecord(1).replace("CHAIN_BACKUP_V3 ", "CHAIN_BACKUP_V3  "),
    ]) expect(parseRemoteResult(bad)).toBeNull();
  });

  test("remote shell: parts are cut exactly, one at a time, uploaded in order, and nothing else escapes", () => {
    const cases = [
      { bytes: 40, parts: [16, 16, 8] }, { bytes: 32, parts: [16, 16] }, { bytes: 1, parts: [1] },
    ];
    for (const c of cases) {
      const f = shellFixture();
      try {
        const urls = partUrls(4);
        const result = f.run(["-c", buildStreamedRemoteCommand(urls, { excludeKeys: true, needKib: 1048576, partBytes: 16 })], { TAR_STREAM_BYTES: String(c.bytes), TAR_RC: "1" });
        expect(result.status).toBe(0);
        expect(result.stderr).toBe("");
        expect(result.stdout).toBe(streamRecord(1, c.parts.length));
        const intake = readFileSync(join(f.base, "upload-intake"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
        expect(intake.map((u) => u.size)).toEqual(c.parts);
        // Peak staging is the part being uploaded, never the archive.
        expect(intake.every((u) => u.staged === u.size)).toBe(true);
        expect(intake.map((u) => u.url)).toEqual(urls.slice(0, c.parts.length));
        const tar = f.calls().find((call) => call.name === "tar")!.args;
        expect(tar.slice(0, 2)).toEqual(["czf", "-"]);
        expect(tar.filter((a) => a.startsWith("--exclude="))).toEqual(["--exclude=priv_validator_key.json", "--exclude=node_key.json"]);
        expect(tar.slice(tar.indexOf("-C"))).toEqual(["-C", "/data", ".zeroned/data", ".zeroned/config"]);
        // rm twice: the part is removed before the record prints, then the EXIT trap runs.
        expect(f.calls().map((call) => call.name).filter((n) => n !== "head" && n !== "curl")).toEqual(["mktemp", "df", "tar", "rm", "rm", "rmdir"]);
        expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
      } finally { f.close(); }
    }
  }, 30000);

  test("remote shell: a failed part, an unstageable part or too many parts stop the stream", () => {
    const cases: Array<{ env: Record<string, string>; urls: number; stdout: RegExp; uploads: number }> = [
      { env: { TAR_STREAM_BYTES: "200000", UPLOAD_FAIL_AT: "2", UPLOAD_RC: "22", HTTP_WRITE_OUT: "403" }, urls: 64, stdout: /^CHAIN_BACKUP_V3 tar=(141|[2-9]|[1-9][0-9]{1,2}) parts=1 upload=22 http=403\n$/, uploads: 2 },
      { env: { TAR_STREAM_BYTES: "200000", HEAD_FAIL_AT: "3" }, urls: 64, stdout: /^CHAIN_BACKUP_V3 tar=(141|[2-9]|[1-9][0-9]{1,2}) parts=2 upload=STAGE http=200\n$/, uploads: 2 },
      { env: { TAR_STREAM_BYTES: "200000" }, urls: 3, stdout: /^CHAIN_BACKUP_V3 tar=(141|[2-9]|[1-9][0-9]{1,2}) parts=3 upload=OVER http=200\n$/, uploads: 3 },
      { env: { MKTEMP_RC: "1" }, urls: 3, stdout: /^CHAIN_BACKUP_V3 tar=NA parts=0 upload=NA http=NA\n$/, uploads: 0 },
    ];
    for (const c of cases) {
      const f = shellFixture();
      try {
        const result = f.run(["-c", buildStreamedRemoteCommand(partUrls(c.urls), { excludeKeys: true, needKib: 1048576, partBytes: 16 })], c.env);
        expect(result.status).toBe(0);
        expect(result.stderr).toBe("");
        expect(result.stdout).toMatch(c.stdout);
        expect(parseRemoteResult(result.stdout)).not.toBeNull();
        expect(f.calls().filter((call) => call.name === "curl")).toHaveLength(c.uploads);
        expect(readdirSync(join(f.base, "tmp"))).toEqual([]);
      } finally { f.close(); }
    }
  }, 30000);

  test("remote shell: low or unknown free space skips before tar, with the streamed bound", () => {
    const header = "Filesystem 1024-blocks Used Available Capacity Mounted on\n";
    for (const [df, free] of [[`${header}overlay 8000000 6700000 1310719 87% /\n`, "1310719"], ["", "NA"]] as const) {
      const f = shellFixture();
      try {
        const result = f.run(["-c", buildStreamedRemoteCommand(partUrls(), { excludeKeys: true, needKib: STREAM_NEED })], { DF_OUTPUT: df });
        expect(result.stdout).toBe(`CHAIN_BACKUP_V2 skip=LOW_DISK free_kib=${free} need_kib=${STREAM_NEED}\n`);
        expect(f.calls().map((call) => call.name)).toEqual(["mktemp", "df", "rm", "rmdir"]);
      } finally { f.close(); }
    }
    // The 2026-10-28 rootfs: 7688964 KiB free on testnet, well above one part plus the margin.
    const f = shellFixture();
    try {
      const result = f.run(["-c", buildStreamedRemoteCommand(partUrls(), { excludeKeys: true, needKib: STREAM_NEED, partBytes: 16 })],
        { DF_OUTPUT: `${header}overlay 8000000 311036 7688964 4% /\n` });
      expect(result.stdout).toBe(streamRecord(0, 3));
    } finally { f.close(); }
    expect(() => buildStreamedRemoteCommand([], { excludeKeys: true, needKib: STREAM_NEED })).toThrow();
    expect(() => buildStreamedRemoteCommand(partUrls(), { excludeKeys: true, needKib: 0 })).toThrow();
    expect(() => buildStreamedRemoteCommand(partUrls(), { excludeKeys: true, needKib: STREAM_NEED, partBytes: 0 })).toThrow();
  }, 30000);

  test("presigned part URLs stay data even with hostile characters", () => {
    const f = shellFixture();
    try {
      const hostile = `${URL_SENTINEL}&quote='\"; zeroned snapshots export; $(zeroned); \`zeroned\``;
      const result = f.run(["-c", buildStreamedRemoteCommand([hostile], { excludeKeys: true, needKib: 1048576, partBytes: 64 })]);
      expect(result.stdout).toBe(streamRecord(0, 1));
      expect(f.calls().find((call) => call.name === "curl")?.args.at(-1)).toBe(hostile);
      expect(f.calls().some((call) => call.name === "zeroned")).toBe(false);
    } finally { f.close(); }
  });
});

describe("multipart signing and parsing (offline)", () => {
  const FAKE = { accessKeyId: "AKIDFAKEFAKEFAKEFAKE", secretAccessKey: "fakefakefakefakefakefakefakefakefakefake" };
  const signer = { endpoint: "https://fly.storage.tigris.dev", bucket: "kingdom-vault", region: "auto", ...FAKE };
  const KEY = "chain/zerone-testnet-1/zerone-testnet-1-data-20261028T033300Z-0b8f7a1e-3c2d-4e5f-8a9b-0c1d2e3f4a5b.tar.gz";

  test("our presigned URL is byte-identical to Bun.S3Client's for the same instant", () => {
    // Bun's presign is computed locally; it is the signer the nightly upload already uses against Tigris.
    const bun = new Bun.S3Client({ ...FAKE, endpoint: signer.endpoint, bucket: signer.bucket, region: "auto" });
    for (let i = 0; i < 3; i++) {
      const theirs = bun.presign(KEY, { method: "PUT", expiresIn: 43200 });
      expect(presignS3Url(signer, "PUT", KEY, {}, 43200, new URL(theirs).searchParams.get("X-Amz-Date")!)).toBe(theirs);
    }
  });

  test("published AWS SigV4 examples verify", () => {
    const aws = { region: "us-east-1", accessKeyId: "AKIAIOSFODNN7EXAMPLE", secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", amzDate: "20130524T000000Z" };
    const host = "examplebucket.s3.amazonaws.com";
    const empty = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const signed = { host, "x-amz-content-sha256": empty, "x-amz-date": aws.amzDate };
    expect(sigv4({ ...aws, method: "GET", host, path: "/test.txt", query: {}, headers: { ...signed, range: "bytes=0-9" }, payloadHash: empty }).signature)
      .toBe("f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41");
    expect(sigv4({ ...aws, method: "GET", host, path: "/", query: { lifecycle: "" }, headers: signed, payloadHash: empty }).signature)
      .toBe("fea454ca298b7da1c68078a5d1bdbfbbe0d65c699e0f91ac7a200a0136783543");
    expect(sigv4({ ...aws, method: "GET", host, path: "/", query: { "max-keys": "2", prefix: "J" }, headers: signed, payloadHash: empty }).signature)
      .toBe("34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7");
    const query = { "X-Amz-Algorithm": "AWS4-HMAC-SHA256", "X-Amz-Credential": "AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request", "X-Amz-Date": aws.amzDate, "X-Amz-Expires": "86400", "X-Amz-SignedHeaders": "host" };
    expect(sigv4({ ...aws, method: "GET", host, path: "/test.txt", query, headers: { host }, payloadHash: "UNSIGNED-PAYLOAD" }).signature)
      .toBe("aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404");
    expect(awsUriEncode("a b/c+d=e~f", true)).toBe("a%20b/c%2Bd%3De~f");
    expect(() => sigv4({ ...aws, amzDate: "2013-05-24", method: "GET", host, path: "/", query: {}, headers: { host }, payloadHash: empty })).toThrow();
  });

  test("multipart calls are signed, shaped like Bun's own, bounded, and never leak URLs", async () => {
    const seen: Array<{ method: string; path: string; query: string; auth: string; body: string | null }> = [];
    const replies: Record<string, Response | (() => Response)> = {};
    const request = (async (input: string, init: RequestInit) => {
      const url = new URL(input);
      seen.push({ method: init.method!, path: url.pathname, query: url.search, auth: String((init.headers as Record<string, string>).authorization), body: (init.body as string) ?? null });
      const op = url.searchParams.has("uploads") ? "create" : init.method === "GET" ? "list" : "complete";
      const reply = replies[op];
      return typeof reply === "function" ? reply() : reply;
    }) as unknown as typeof fetch;
    const mp = multipartEffects(signer, request, () => "20261028T033300Z");
    replies.create = () => new Response("<InitiateMultipartUploadResult><UploadId>U-1_a.b~c</UploadId></InitiateMultipartUploadResult>");
    replies.list = () => new Response("<ListPartsResult><IsTruncated>false</IsTruncated><Part><PartNumber>2</PartNumber><ETag>&quot;e2&quot;</ETag><Size>5</Size></Part><Part><PartNumber>1</PartNumber><ETag>\"e1\"</ETag><Size>268435456</Size></Part></ListPartsResult>");
    replies.complete = () => new Response("<CompleteMultipartUploadResult><ETag>x-2</ETag></CompleteMultipartUploadResult>");
    expect(await mp.create(KEY)).toBe("U-1_a.b~c");
    const parts = await mp.listParts(KEY, "U-1_a.b~c");
    expect(parts).toEqual([{ partNumber: 1, etag: '"e1"', size: 268435456 }, { partNumber: 2, etag: '"e2"', size: 5 }]);
    await mp.complete(KEY, "U-1_a.b~c", parts);
    expect(seen.map((s) => [s.method, s.path, s.query])).toEqual([
      ["POST", `/kingdom-vault/${KEY}`, "?uploads="],
      ["GET", `/kingdom-vault/${KEY}`, "?max-parts=1000&uploadId=U-1_a.b~c"],
      ["POST", `/kingdom-vault/${KEY}`, "?uploadId=U-1_a.b~c"],
    ]);
    for (const s of seen) expect(s.auth).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIDFAKEFAKEFAKEFAKE\/20261028\/auto\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
    expect(seen.every((s) => !s.auth.includes(FAKE.secretAccessKey))).toBe(true);
    expect(seen[2].body).toBe(completeBody(parts));
    expect(completeBody(parts)).toContain('<Part><PartNumber>1</PartNumber><ETag>"e1"</ETag></Part><Part><PartNumber>2</PartNumber><ETag>"e2"</ETag></Part>');
    const part = new URL(mp.presignPart(KEY, "U+1/=", 7));
    expect(part.search).toContain("partNumber=7&uploadId=U%2B1%2F%3D");
    expect(part.searchParams.get("X-Amz-Expires")).toBe("43200");

    // Refusals: wrong status, an <Error> body, a truncated listing, a malformed part,
    // an oversized body and a transport error all become fixed errors.
    const refusals: Array<[keyof typeof replies, () => Response, () => Promise<unknown>]> = [
      ["create", () => new Response("<UploadId>x</UploadId>", { status: 403 }), () => mp.create(KEY)],
      ["create", () => new Response("<Error><Code>AccessDenied</Code></Error>"), () => mp.create(KEY)],
      ["list", () => new Response("<ListPartsResult><IsTruncated>true</IsTruncated></ListPartsResult>"), () => mp.listParts(KEY, "u")],
      ["list", () => new Response("<ListPartsResult><Part><PartNumber>x</PartNumber><ETag>e</ETag><Size>1</Size></Part></ListPartsResult>"), () => mp.listParts(KEY, "u")],
      ["list", () => new Response("x".repeat(256 * 1024 + 1)), () => mp.listParts(KEY, "u")],
      ["complete", () => new Response("<Error><Code>InvalidPart</Code></Error>"), () => mp.complete(KEY, "u", parts)],
      ["complete", () => new Response("<CompleteMultipartUploadResult/>", { status: 500 }), () => mp.complete(KEY, "u", parts)],
      ["complete", () => { throw new Error(`${PRIVATE} ${URL_SENTINEL}`); }, () => mp.complete(KEY, "u", parts)],
    ];
    for (const [op, reply, run] of refusals) {
      replies[op] = reply;
      let message = "";
      await run().then(() => { message = "resolved"; }, (error: Error) => { message = error.message; });
      expect(message).not.toBe("resolved");
      expect(message).not.toContain(PRIVATE);
      expect(message).not.toContain("X-Amz");
    }
    expect(parseUploadId("<UploadId>a&amp;b</UploadId>")).toBe("a&b");
    expect(parseListParts("<ListPartsResult></ListPartsResult>")).toEqual([]);
  });

  test("64 realistic part URLs fit one bash -c argument with room to spare", () => {
    const urls = Array.from({ length: MAX_PARTS }, (_, i) =>
      presignS3Url({ ...signer, accessKeyId: "tid_" + "A".repeat(40) }, "PUT", KEY, { partNumber: String(i + 1), uploadId: "U".repeat(200) }, 43200, "20261028T033300Z"));
    const command = buildStreamedRemoteCommand(urls, { excludeKeys: true, needKib: STREAM_NEED });
    expect(command.length).toBeLessThan(MAX_REMOTE_COMMAND_BYTES * 0.6);
  });
});
