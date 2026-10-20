import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildRemoteCommand, captureChain, captureStatus, EXCLUDED_KEY_FILES, LOW_DISK_MARGIN_BYTES, main, MAX_REMOTE_RESULT_BYTES,
  needKib, parseArgs, parseRemoteResult, readBoundedOutput, ROLLOUT_CHAINS, type Effects,
} from "../bin/chain-backup-remote.ts";

const SUBJECT = new URL("../bin/chain-backup-remote.ts", import.meta.url).pathname;
const FALLBACK = new URL("../bin/chain-backup-to-tigris.sh", import.meta.url).pathname;
const PRIVATE = "PRIVATE_SUBPROCESS_SENTINEL";
const URL_SENTINEL = `https://storage.invalid/fixture?signature=${PRIVATE}`;
const record = (tar: number | "NA" = 0, upload: number | "NA" = 0, http: number | "NA" = upload === "NA" ? "NA" : 200) =>
  `CHAIN_BACKUP_V2 tar=${tar} upload=${upload} http=${http === "NA" ? http : String(http).padStart(3, "0")}\n`;

function fakeEffects(overrides: Partial<Effects> = {}) {
  const calls: string[] = [];
  let sequence = 0;
  const effects: Effects = {
    captureId: () => `fixture-${sequence++}`,
    presign: (key) => { calls.push(`presign:${key}`); return URL_SENTINEL; },
    remote: async () => { calls.push("remote"); return { code: 0, stdout: record() }; },
    stat: async () => { calls.push("stat"); return { size: 64 }; },
    lastLandedBytes: async () => null,
    markLanded: async (chain, bytes, keyFiles) => { calls.push(`mark:${chain}:${bytes}:${keyFiles}`); },
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
import { appendFileSync, writeFileSync, readFileSync, mkdtempSync, rmSync, rmdirSync, fstatSync, statSync, readdirSync, writeSync } from "node:fs";
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
  writeFileSync(owned(args[index]), "synthetic archive, no real node bytes");
  console.log(noise); console.error(noise); process.exit(rc("TAR_RC"));
} else if (name === "curl") {
  readFileSync(owned(args[args.indexOf("-T") + 1]));
  // Like curl -o FILE -w FORMAT: the body goes to FILE; stdout gets only the write-out.
  if (args.includes("-w")) process.stdout.write(process.env.HTTP_WRITE_OUT ?? "200");
  else console.log(noise);
  console.error(noise); process.exit(rc("UPLOAD_RC"));
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
  for (const name of ["tar", "curl", "aws", "mktemp", "date", "df", "rm", "rmdir", "security", "flyctl", "ssh", "zeroned", "zstd"]) {
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
    const cases = [
      { mode: "present", code: 3, kills: 0, stats: 2 },
      { mode: "credentials-fail", code: 1, kills: 0, stats: 0 },
      { mode: "credentials-oversize", code: 1, kills: 1, stats: 0 },
      { mode: "remote-oversize", code: 1, kills: 2, stats: 0 },
      { mode: "ssh-fail", code: 1, kills: 0, stats: 2 },
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
    : (mode === "remote-oversize" ? "x".repeat(129) : ${JSON.stringify(record(1))});
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
globalThis.fetch = () => { throw new Error("prohibited network"); };
const { main } = await import(${JSON.stringify(SUBJECT)});
const logs: string[] = [];
const code = await main([], undefined, (line: string) => logs.push(line));
console.log(JSON.stringify({ code, logs, kills, stats, keys, presigns }));
`);
        const result = spawnSync(process.execPath, [harness], { cwd: f.base, env: f.env, encoding: "utf8", timeout: 10000 });
        expect(result.status).toBe(0);
        expect(result.stderr).toBe("");
        expect(result.stdout).not.toContain(PRIVATE);
        const summary = JSON.parse(result.stdout);
        expect(summary).toMatchObject({ code: c.code, kills: c.kills, stats: c.stats });
        expect(summary.logs).toHaveLength(2);
        expect(new Set(summary.keys).size).toBe(summary.keys.length);
        // Signed before the remote tar: it must outlive a throttled multi-hour capture.
        expect(summary.presigns).toEqual(summary.keys.map(() => ({ method: "PUT", expiresIn: 43200 })));
        if (c.mode === "present") expect(summary.presigns).toHaveLength(2);
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

describe("testnet-first rollout contract", () => {
  test("only testnet is in the rollout; mainnet's remote command is byte-identical to 2026-10-19", () => {
    expect(ROLLOUT_CHAINS).toEqual(["zerone-testnet-1"]);
    // sha256 of the 8079e93 (#105) builder's output for URL_SENTINEL.
    const pinned = "1bf1b28d0e2300e27511c1d5bd3e5d87ebed6512e41656782cdbf1a11d23be39";
    expect(createHash("sha256").update(buildRemoteCommand(URL_SENTINEL)).digest("hex")).toBe(pinned);
    expect(buildRemoteCommand(URL_SENTINEL, { excludeKeys: false, needKib: null })).toBe(buildRemoteCommand(URL_SENTINEL));
  });

  test("each chain is asked for the capture its rollout state allows", async () => {
    const commands = new Map<string, string>();
    const { effects } = fakeEffects({ remote: async (chain, command) => { commands.set(chain, command); return { code: 0, stdout: record(1) }; } });
    const { code, outcomes } = await runMain(effects, []);
    expect(code).toBe(3);
    expect(commands.get("zerone-1")).toBe(buildRemoteCommand(URL_SENTINEL));
    expect(commands.get("zerone-testnet-1")).toBe(buildRemoteCommand(URL_SENTINEL, { excludeKeys: true, needKib: needKib(null) }));
    expect(outcomes.map((o) => [o.chain, o.key_files, o.disk_need_kib])).toEqual([
      ["zerone-testnet-1", "EXCLUDED", needKib(null)], ["zerone-1", "INCLUDED", null],
    ]);
  });

  test("the pre-flight bound is the last landed archive plus 1 GiB, in KiB", async () => {
    expect(LOW_DISK_MARGIN_BYTES).toBe(GIB);
    expect(needKib(null)).toBe(1048576);
    expect(needKib(5 * GIB)).toBe(6 * 1048576);
    expect(needKib(5 * GIB + 1)).toBe(6 * 1048576 + 1);
    for (const bad of [0, -1, NaN, 0.5, Infinity]) expect(needKib(bad)).toBe(1048576);
    for (const [last, need] of [[async () => 3 * GIB, 4 * 1048576], [async () => { throw new Error(PRIVATE); }, 1048576]] as const) {
      const { outcomes, logs } = await runMain(fakeEffects({ lastLandedBytes: last }).effects, ["zerone-testnet-1"]);
      expect(outcomes[0].disk_need_kib).toBe(need);
      expect(logs.join("\n")).not.toContain(PRIVATE);
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
    // Mainnet never asked for a pre-flight; a mismatched bound is not believed either.
    for (const [chain, stdout] of [["zerone-1", skipRecord(500, 1048576)], ["zerone-testnet-1", skipRecord(500, 2097152)]] as const) {
      const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout }) });
      const { code, outcomes } = await runMain(effects, [chain]);
      expect(code).toBe(1);
      expect(outcomes[0]).toMatchObject({ error: "PROTOCOL_FAILED", landed_marker: "NOT_WRITTEN" });
      expect(calls.filter((c) => c === "stat" || c.startsWith("mark:"))).toEqual([]);
    }
  });

  test("a low-disk skip is red, uploads nothing and writes no marker", async () => {
    const { effects, calls } = fakeEffects({ remote: async () => ({ code: 0, stdout: skipRecord(700000, 1048576) }) });
    const { code, outcomes } = await runMain(effects, ["zerone-testnet-1"]);
    expect(code).toBe(1);
    expect(outcomes[0]).toMatchObject({
      capture_status: "SKIPPED", tar_exit: null, upload_status: "NOT_ATTEMPTED", object_status: "NOT_ATTEMPTED",
      disk_free_kib: 700000, disk_need_kib: 1048576, landed_marker: "NOT_WRITTEN", error: "SKIPPED_LOW_DISK",
    });
    expect(calls.filter((c) => c === "stat" || c.startsWith("mark:"))).toEqual([]);
  });

  test("the landed marker is written only after a clean landing, with the object's size", async () => {
    const landed = fakeEffects({ stat: async () => ({ size: 4096 }) });
    expect((await runMain(landed.effects, [])).outcomes.map((o) => o.landed_marker)).toEqual(["WRITTEN", "WRITTEN"]);
    expect(landed.calls.filter((c) => c.startsWith("mark:"))).toEqual(["mark:zerone-testnet-1:4096:EXCLUDED", "mark:zerone-1:4096:INCLUDED"]);
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
      const args = f.calls().find((c) => c.name === "tar")!.args;
      expect(args.filter((a) => a.startsWith("--exclude="))).toEqual(["--exclude=priv_validator_key.json", "--exclude=node_key.json"]);
    } finally { f.close(); }
  });

  test("production markers live under HOME, are atomic and feed the next pre-flight", () => {
    const f = shellFixture();
    try {
      const harness = join(f.base, "marker.ts");
      writeFileSync(harness, `
const commands: string[] = [];
Bun.spawn = (args: string[]) => {
  const credential = args[0] === "security";
  if (!credential) commands.push(args[args.length - 1]);
  const text = credential ? "fixture-credential" : ${JSON.stringify(record(1))};
  return { stdout: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(text)); c.close(); } }), exited: Promise.resolve(0), kill() {} };
};
Object.defineProperty(Bun, "S3Client", { value: class {
  presign() { return ${JSON.stringify(URL_SENTINEL)}; }
  async stat() { return { size: ${3 * GIB} }; }
} });
globalThis.fetch = () => { throw new Error("prohibited network"); };
const { main, buildRemoteCommand } = await import(${JSON.stringify(SUBJECT)});
const first = await main(["zerone-testnet-1"], undefined, () => {});
const second = await main(["zerone-testnet-1"], undefined, () => {});
console.log(JSON.stringify({ first, second, commands, expected: [
  buildRemoteCommand(${JSON.stringify(URL_SENTINEL)}, { excludeKeys: true, needKib: 1048576 }),
  buildRemoteCommand(${JSON.stringify(URL_SENTINEL)}, { excludeKeys: true, needKib: 4 * 1048576 }),
] }));
`);
      const result = spawnSync(process.execPath, [harness], { cwd: f.base, env: f.env, encoding: "utf8", timeout: 10000 });
      expect(result.stderr).toBe("");
      const summary = JSON.parse(result.stdout);
      expect([summary.first, summary.second]).toEqual([3, 3]);
      expect(summary.commands).toEqual(summary.expected);
      const dir = join(f.base, "home", ".kingdom", "state", "chain-backup");
      expect(readdirSync(dir)).toEqual(["zerone-testnet-1.landed"]);
      expect(JSON.parse(readFileSync(join(dir, "zerone-testnet-1.landed"), "utf8"))).toMatchObject({
        protocol: "kingdom.chain-backup.landed/1", chain: "zerone-testnet-1", bytes: 3 * GIB,
        capture_status: "RAW_UNVERIFIED", key_files: "EXCLUDED",
      });
    } finally { f.close(); }
  }, 15000);
});
