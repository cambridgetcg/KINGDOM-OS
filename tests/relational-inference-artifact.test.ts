import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, spyOn, test } from "bun:test";

import {
  RELATIONAL_SAFE_CLI_BOUNDARY,
  RELATIONAL_SAFE_CLI_MAX_FILE_BYTES,
  RELATIONAL_SAFE_CLI_MAX_PATH_BYTES,
  RELATIONAL_SAFE_CLI_MAX_PATH_CHARACTERS,
  RELATIONAL_SAFE_CLI_MAX_TOTAL_BYTES,
  runRelationalInferenceSafeCli,
} from "../bin/relational-inference-safe.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT = join(ROOT, "bridges/artifacts/relational-inference/0.1/relational-inference.mjs");
const MANIFEST = join(ROOT, "bridges/artifacts/relational-inference/0.1/manifest.json");
const VALID_CASE = join(ROOT, "bridges/examples/reasoning-to-word-inference.json");
const NODE_CANDIDATE = [
  "/usr/bin/node",
  "/usr/local/bin/node",
  "/opt/homebrew/bin/node",
  Bun.which("node"),
].find((candidate): candidate is string => typeof candidate === "string" && existsSync(candidate));
const FIXED_NODE = NODE_CANDIDATE === undefined ? undefined : realpathSync(NODE_CANDIDATE);
const MKFIFO_CANDIDATE = ["/usr/bin/mkfifo", "/bin/mkfifo", Bun.which("mkfifo")]
  .find((candidate): candidate is string => typeof candidate === "string" && existsSync(candidate));
const FIXED_MKFIFO = MKFIFO_CANDIDATE === undefined ? undefined : realpathSync(MKFIFO_CANDIDATE);

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true });
  }
});

function temporaryRoot(prefix: string): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function fileTree(root: string): Record<string, string> {
  const result: Record<string, string> = {};
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const relative = path.slice(root.length + 1);
      const entry = lstatSync(path);
      if (entry.isDirectory()) visit(path);
      else if (entry.isSymbolicLink()) result[relative] = "symlink";
      else result[relative] = sha256(readFileSync(path));
    }
  };
  visit(root);
  return result;
}

function artifactEnvironment(home: string, shadow: string): Record<string, string> {
  return {
    HOME: home,
    PATH: shadow,
    LANG: "C",
    LC_ALL: "C",
    NO_COLOR: "1",
    TERM: "dumb",
    HTTP_PROXY: "http://127.0.0.1:1",
    HTTPS_PROXY: "http://127.0.0.1:1",
    ALL_PROXY: "http://127.0.0.1:1",
    BUN_INSTALL: join(shadow, "private-bun"),
    BUN_RUNTIME_TRANSPILER_CACHE_PATH: join(shadow, "private-cache"),
    NODE_PATH: join(shadow, "private-node-modules"),
  };
}

function runArtifact(
  args: string[],
  cwd: string,
  environment: Record<string, string>,
): ReturnType<typeof Bun.spawnSync> {
  if (!FIXED_NODE) throw new Error("fixed Node executable is required");
  return Bun.spawnSync([FIXED_NODE, ARTIFACT, ...args], {
    cwd,
    env: environment,
    stdout: "pipe",
    stderr: "pipe",
  });
}

describe("self-contained relational inference artifact", () => {
  test("manifest pins every source byte, the artifact, build, runtime, and reuse boundary", () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
    const artifactBytes = readFileSync(ARTIFACT);

    expect(manifest.schema).toBe("kingdom.relational-inference-artifact/0.1");
    expect(manifest.source.canonical_url).toBe("https://github.com/cambridgetcg/KINGDOM-OS");
    expect(manifest.source.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(manifest.source.source_bytes_pinned).toBe(true);
    expect(manifest.artifact.path).toBe("bridges/artifacts/relational-inference/0.1/relational-inference.mjs");
    expect(manifest.artifact.bytes).toBe(artifactBytes.byteLength);
    expect(manifest.artifact.sha256).toBe(sha256(artifactBytes));
    expect(manifest.publication).toEqual({
      state: "consumer-pin-required",
      artifact_ref: null,
      artifact_url: null,
      remote_verification_in_manifest: false,
      consumer_must_bind_git_ref_and_sha256: true,
      note: "The commit containing this manifest cannot self-pin; each consumer must bind an exact containing Git ref and the artifact SHA-256.",
    });
    expect(manifest.runtime.node_floor).toBeNull();
    expect(manifest.runtime.node_floor_status).toBe("unestablished");
    expect(manifest.runtime.tested_environments).toEqual([]);
    expect(manifest.runtime.portability_outside_tested_environments).toBe("unestablished");
    expect(manifest.runtime.filesystem_requirement).toBe(
      "POSIX integer O_NOFOLLOW and O_NONBLOCK constants",
    );
    expect(manifest.build.tool).toBe("bun");
    expect(manifest.build.tool_version).toBe(Bun.version);
    expect(manifest.build.command).toBe(
      `bun scripts/build-relational-inference-artifact.ts --source-commit ${manifest.source.commit}`,
    );
    expect(manifest.build.bundle_equivalent).toBe(
      "bun build bin/relational-inference-standalone.ts --target=node --format=esm --outfile=bridges/artifacts/relational-inference/0.1/relational-inference.mjs",
    );
    expect(manifest.runtime.environment_required).toEqual({
      launcher: "fixed absolute Node executable under env -i",
      required_values: {
        PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
        LANG: "C",
        LC_ALL: "C",
        NO_COLOR: "1",
        TERM: "dumb",
      },
      forbidden_startup_variables: ["NODE_OPTIONS", "NODE_PATH", "NODE_V8_COVERAGE"],
      artifact_can_sanitize_node_startup_environment: false,
    });
    expect(manifest.reuse_basis).toEqual({
      actor: "workspace owner instruction",
      recorded_on: "2026-08-17",
      scopes: ["review", "copy", "vendor", "modify", "merge", "publish"],
      public_license: null,
      third_party_grant: false,
    });
    expect(manifest.contract).toEqual({
      mode: "structure-only",
      network_requests: false,
      application_content_writes: false,
      filesystem_metadata_side_effects: "unestablished; reads may update mount-managed access metadata",
      stdin: false,
      urls: false,
      globs: false,
      reflects_paths_or_data: false,
    });

    for (const source of manifest.source.files) {
      const bytes = readFileSync(join(ROOT, source.path));
      expect(source.bytes, source.path).toBe(bytes.byteLength);
      expect(source.sha256, source.path).toBe(sha256(bytes));
    }
    expect(manifest.conformance.files.map((entry: { path: string }) => entry.path)).toEqual([
      "tests/relational-inference.test.ts",
      "tests/semantic-transitions.test.ts",
      "tests/relational-inference-artifact.test.ts",
      "tests/dark-matter-observation-boundary.test.ts",
      "bridges/examples/claim-repair-inference.json",
      "bridges/examples/dark-matter-observation-to-latent-hypothesis.json",
      "bridges/examples/identity-to-shape-inference.json",
      "bridges/examples/reasoning-to-word-inference.json",
    ]);
    for (const file of manifest.conformance.files) {
      const bytes = readFileSync(join(ROOT, file.path));
      expect(file.bytes, file.path).toBe(bytes.byteLength);
      expect(file.sha256, file.path).toBe(sha256(bytes));
    }
  });

  test("two clean builds are byte-identical to each other and the checked artifact", () => {
    const root = temporaryRoot("kingdom-relational-build-");
    const first = join(root, "first");
    const second = join(root, "second");
    const home = join(root, "home");
    mkdirSync(home);
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
    const environment = {
      HOME: home,
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
      LANG: "C",
      LC_ALL: "C",
      NO_COLOR: "1",
      TERM: "dumb",
      BUN_RUNTIME_TRANSPILER_CACHE_PATH: "0",
    };
    for (const outputDirectory of [first, second]) {
      const result = Bun.spawnSync([
        process.execPath,
        join(ROOT, "scripts/build-relational-inference-artifact.ts"),
        "--source-commit",
        manifest.source.commit,
        "--outdir",
        outputDirectory,
      ], { cwd: ROOT, env: environment, stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode, result.stderr.toString()).toBe(0);
    }

    expect(readFileSync(join(first, "relational-inference.mjs")))
      .toEqual(readFileSync(join(second, "relational-inference.mjs")));
    expect(readFileSync(join(first, "relational-inference.mjs"))).toEqual(readFileSync(ARTIFACT));
    expect(readFileSync(join(first, "manifest.json"))).toEqual(readFileSync(join(second, "manifest.json")));
    expect(readFileSync(join(first, "manifest.json"))).toEqual(readFileSync(MANIFEST));
  });

  test("fixed Node accepts one MJS with only allowlisted builtins and no active side-effect doors", () => {
    expect(FIXED_NODE).toBeDefined();
    const nodeEntry = lstatSync(FIXED_NODE!);
    expect(nodeEntry.isFile()).toBe(true);
    expect(nodeEntry.mode & 0o111).not.toBe(0);
    const checked = Bun.spawnSync([FIXED_NODE!, "--check", ARTIFACT], {
      cwd: "/",
      env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", LANG: "C", LC_ALL: "C" },
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(checked.exitCode, checked.stderr.toString()).toBe(0);

    const source = readFileSync(ARTIFACT, "utf8");
    const imports = [...source.matchAll(/from "(node:[^"]+)"/gu)].map((match) => match[1]).sort();
    expect([...new Set(imports)]).toEqual(["node:buffer", "node:fs", "node:util"]);
    for (const forbidden of [
      /\bimport\s*\(/u,
      /node:(?:child_process|cluster|dgram|dns|http|https|net|tls|worker_threads)/u,
      /\b(?:fetch|WebSocket|XMLHttpRequest|eval)\s*\(/u,
      /\bnew\s+Function\b/u,
      /\bprocess\.env\b/u,
      /\bBun\./u,
    ]) expect(source).not.toMatch(forbidden);
    expect(source).toContain("O_NOFOLLOW");
    expect(source).toContain("O_NONBLOCK");
    expect(source).toContain("fatal: true");
    expect(source).toContain("urn:kingdom:schema:relational-inference-case:0.1");
    expect(source).toContain("urn:kingdom:semantic-transition:0.1");
    expect(source).toContain("bundled schema integrity failure");
  });

  test("runs from an empty foreign directory under a hostile ambient environment without writes", () => {
    const root = temporaryRoot("kingdom-relational-run-");
    const inputDirectory = join(root, "inputs");
    const cwd = join(root, "empty-cwd");
    const home = join(root, "empty-home");
    const shadow = join(root, "shadow");
    mkdirSync(inputDirectory);
    mkdirSync(cwd);
    mkdirSync(home);
    mkdirSync(shadow);
    const sentinel = join(root, "ambient-command-ran");
    for (const command of ["node", "curl", "git", "sh"]) {
      const path = join(shadow, command);
      writeFileSync(path, `#!/bin/sh\nprintf touched > ${JSON.stringify(sentinel)}\nexit 99\n`);
      chmodSync(path, 0o755);
    }
    const input = join(inputDirectory, "case.json");
    writeFileSync(input, readFileSync(VALID_CASE));
    const before = fileTree(root);

    const result = runArtifact(["validate", input], cwd, artifactEnvironment(home, shadow));

    expect(result.exitCode, result.stderr.toString()).toBe(0);
    expect(result.stderr.toString()).toBe("");
    expect(result.stdout.toString()).toBe([
      ...RELATIONAL_SAFE_CLI_BOUNDARY,
      "case 1: structurally valid",
      "",
    ].join("\n"));
    expect(readdirSync(cwd)).toEqual([]);
    expect(readdirSync(home)).toEqual([]);
    expect(existsSync(sentinel)).toBe(false);
    expect(fileTree(root)).toEqual(before);
  });

  test("invalid private paths and data never appear in safe diagnostics", () => {
    const root = temporaryRoot("kingdom-relational-private-");
    const cwd = join(root, "cwd");
    const home = join(root, "home");
    const shadow = join(root, "shadow");
    mkdirSync(cwd);
    mkdirSync(home);
    mkdirSync(shadow);
    const privateToken = "private-case-token-must-not-travel";
    const input = join(root, `${privateToken}.json`);
    writeFileSync(input, JSON.stringify({ id: privateToken, secret: privateToken }));

    const result = runArtifact(["validate", input], cwd, artifactEnvironment(home, shadow));
    const output = `${result.stdout.toString()}\n${result.stderr.toString()}`;

    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toBe("");
    expect(result.stderr.toString()).toContain("STRUCTURE ONLY");
    expect(result.stderr.toString()).toContain("case 1: structurally invalid");
    expect(output).not.toContain(root);
    expect(output).not.toContain(input);
    expect(output).not.toContain(privateToken);
  });

  test("rejects symlinks, directories, FIFOs, devices, oversized files, and invalid UTF-8 without reflection", () => {
    const root = temporaryRoot("kingdom-relational-input-");
    const cwd = join(root, "cwd");
    const home = join(root, "home");
    const shadow = join(root, "shadow");
    mkdirSync(cwd);
    mkdirSync(home);
    mkdirSync(shadow);
    const target = join(root, "private-target.json");
    const link = join(root, "private-link.json");
    const directory = join(root, "private-directory");
    const fifo = join(root, "private-fifo");
    const oversized = join(root, "private-oversized.json");
    const invalidUtf8 = join(root, "private-invalid-utf8.json");
    writeFileSync(target, readFileSync(VALID_CASE));
    symlinkSync(target, link);
    mkdirSync(directory);
    expect(FIXED_MKFIFO).toBeDefined();
    const mkfifoEntry = lstatSync(FIXED_MKFIFO!);
    expect(mkfifoEntry.isFile()).toBe(true);
    expect(mkfifoEntry.mode & 0o111).not.toBe(0);
    const madeFifo = Bun.spawnSync([FIXED_MKFIFO!, fifo], {
      cwd: "/",
      env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", LANG: "C", LC_ALL: "C" },
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(madeFifo.exitCode, madeFifo.stderr.toString()).toBe(0);
    writeFileSync(oversized, Buffer.alloc(RELATIONAL_SAFE_CLI_MAX_FILE_BYTES + 1, 0x20));
    writeFileSync(invalidUtf8, Buffer.from([0x7b, 0xc3, 0x28, 0x7d]));

    const inputs = [link, directory, fifo, oversized, invalidUtf8];
    if (existsSync("/dev/null")) inputs.push("/dev/null");
    for (const input of inputs) {
      const result = runArtifact(["validate", input], cwd, artifactEnvironment(home, shadow));
      const output = `${result.stdout.toString()}\n${result.stderr.toString()}`;
      expect(result.exitCode).toBe(1);
      expect(output).toContain("case 1:");
      expect(output).not.toContain(root);
      expect(output).not.toContain(input);
    }
  });

  test("rejects stdin, URL, glob, option, NUL, excess-count, and total-byte requests", () => {
    const root = temporaryRoot("kingdom-relational-request-");
    const cwd = join(root, "cwd");
    const home = join(root, "home");
    const shadow = join(root, "shadow");
    mkdirSync(cwd);
    mkdirSync(home);
    mkdirSync(shadow);
    const environment = artifactEnvironment(home, shadow);

    for (const supplied of ["-", "--private", "https://private.invalid/case", "private-*.json"]) {
      const result = runArtifact(["validate", supplied], cwd, environment);
      expect(result.exitCode).toBe(1);
      expect(`${result.stdout.toString()}${result.stderr.toString()}`).not.toContain(supplied);
      expect(result.stderr.toString()).toContain("case 1: input rejected");
    }

    const errors: string[] = [];
    const consoleError = spyOn(console, "error").mockImplementation((value?: unknown) => {
      errors.push(String(value));
    });
    try {
      for (const hostilePath of [
        "private\0case.json",
        "private\ncase.json",
        "private\u202ecase.json",
        "p".repeat(RELATIONAL_SAFE_CLI_MAX_PATH_CHARACTERS + 1),
        "é".repeat(Math.floor(RELATIONAL_SAFE_CLI_MAX_PATH_BYTES / 2) + 1),
      ]) {
        expect(runRelationalInferenceSafeCli(["validate", hostilePath])).toBe(1);
      }
    } finally {
      consoleError.mockRestore();
    }
    expect(errors.join("\n")).not.toContain("private");
    expect(errors.join("\n")).toContain("case 1: input rejected");

    const tooMany = runArtifact(
      ["validate", ...Array.from({ length: 33 }, (_, index) => `private-${index}.json`)],
      cwd,
      environment,
    );
    expect(tooMany.exitCode).toBe(64);
    expect(tooMany.stderr.toString()).not.toContain("private-");

    const oneMegabyte = join(root, "one-megabyte.json");
    writeFileSync(oneMegabyte, Buffer.alloc(RELATIONAL_SAFE_CLI_MAX_FILE_BYTES, 0x20));
    const repeated = Math.floor(RELATIONAL_SAFE_CLI_MAX_TOTAL_BYTES / RELATIONAL_SAFE_CLI_MAX_FILE_BYTES) + 1;
    const total = runArtifact(
      ["validate", ...Array.from({ length: repeated }, () => oneMegabyte)],
      cwd,
      environment,
    );
    expect(total.exitCode).toBe(1);
    expect(total.stderr.toString()).toContain(`case ${repeated}: input rejected`);
    expect(total.stderr.toString()).not.toContain(oneMegabyte);
  });
});
