/**
 * Reproducibly build the self-contained relational inference Node artifact.
 *
 * The source commit must already contain every listed source byte. This makes
 * the generated manifest a binding to an immutable source commit rather than
 * a description of an uncommitted working tree.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_BUN_VERSION = "1.3.13";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = join(ROOT, "bin/relational-inference-standalone.ts");
const DEFAULT_OUTPUT_DIRECTORY = join(ROOT, "bridges/artifacts/relational-inference/0.1");
const CANONICAL_ARTIFACT_PATH = "bridges/artifacts/relational-inference/0.1/relational-inference.mjs";
const SOURCE_FILES = Object.freeze([
  "bin/relational-inference-standalone.ts",
  "bin/relational-inference-safe.ts",
  "bin/relational-inference.ts",
  "bin/semantic-transitions.ts",
  "bridges/schemas/relational-inference-case-0.1.json",
  "bridges/schemas/semantic-transition-receipt-0.1.json",
  "scripts/build-relational-inference-artifact.ts",
]);
const CONFORMANCE_FILES = Object.freeze([
  "tests/relational-inference.test.ts",
  "tests/semantic-transitions.test.ts",
  "tests/relational-inference-artifact.test.ts",
  "bridges/examples/claim-repair-inference.json",
  "bridges/examples/dark-matter-observation-to-latent-hypothesis.json",
  "bridges/examples/identity-to-shape-inference.json",
  "bridges/examples/reasoning-to-word-inference.json",
]);
const COMMIT = /^[0-9a-f]{40}$/u;

function fail(message: string): never {
  console.error(`relational inference artifact build: ${message}`);
  process.exit(1);
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function gitObject(args: string[], limit = 2_000_000): Buffer {
  const result = spawnSync("/usr/bin/git", ["-C", ROOT, ...args], {
    cwd: "/",
    env: {
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_NO_LAZY_FETCH: "1",
      GIT_NO_REPLACE_OBJECTS: "1",
      GIT_OPTIONAL_LOCKS: "0",
      GIT_PROTOCOL_FROM_USER: "0",
      GIT_TERMINAL_PROMPT: "0",
      HOME: "/",
      LANG: "C",
      LC_ALL: "C",
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
    },
    encoding: "buffer",
    maxBuffer: limit,
    timeout: 5_000,
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0) fail("source commit or blob is unavailable");
  return result.stdout;
}

function parseArguments(argv: string[]): { sourceCommit: string; outputDirectory: string } {
  let sourceCommit: string | null = null;
  let outputDirectory = DEFAULT_OUTPUT_DIRECTORY;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source-commit" && sourceCommit === null && index + 1 < argv.length) {
      sourceCommit = argv[++index];
    } else if (argument === "--outdir" && outputDirectory === DEFAULT_OUTPUT_DIRECTORY && index + 1 < argv.length) {
      outputDirectory = resolve(argv[++index]);
    } else {
      fail("usage: bun scripts/build-relational-inference-artifact.ts --source-commit COMMIT [--outdir DIRECTORY]");
    }
  }
  if (sourceCommit === null || !COMMIT.test(sourceCommit)) {
    fail("--source-commit must be one 40-character lowercase Git commit id");
  }
  return { sourceCommit, outputDirectory };
}

async function main(): Promise<void> {
  if (Bun.version !== EXPECTED_BUN_VERSION) {
    fail(`Bun ${EXPECTED_BUN_VERSION} is required`);
  }
  const { sourceCommit, outputDirectory } = parseArguments(process.argv.slice(2));
  if (gitObject(["cat-file", "-t", sourceCommit], 32).toString("ascii").trim() !== "commit") {
    fail("--source-commit does not identify a commit object");
  }

  const sourceFiles = SOURCE_FILES.map((path) => {
    const workingBytes = readFileSync(join(ROOT, path));
    const committedBytes = gitObject(["cat-file", "blob", `${sourceCommit}:${path}`]);
    if (!workingBytes.equals(committedBytes)) {
      fail("listed source bytes differ from --source-commit");
    }
    return { path, bytes: workingBytes.byteLength, sha256: digest(workingBytes) };
  });
  const conformanceFiles = CONFORMANCE_FILES.map((path) => {
    const workingBytes = readFileSync(join(ROOT, path));
    const committedBytes = gitObject(["cat-file", "blob", `${sourceCommit}:${path}`]);
    if (!workingBytes.equals(committedBytes)) {
      fail("listed conformance bytes differ from --source-commit");
    }
    return { path, bytes: workingBytes.byteLength, sha256: digest(workingBytes) };
  });

  const build = await Bun.build({
    entrypoints: [ENTRY],
    format: "esm",
    minify: false,
    root: ROOT,
    sourcemap: "none",
    target: "node",
    write: false,
  });
  if (!build.success || build.outputs.length !== 1) {
    fail("Bun did not produce exactly one successful artifact");
  }
  const artifactBytes = Buffer.from(await build.outputs[0].arrayBuffer());
  const manifest = {
    schema: "kingdom.relational-inference-artifact/0.1",
    artifact: {
      path: CANONICAL_ARTIFACT_PATH,
      format: "node-esm-self-contained",
      bytes: artifactBytes.byteLength,
      sha256: digest(artifactBytes),
      strict_parser_bundled: true,
      schemas_bundled: [
        "kingdom.relational-inference/0.1",
        "kingdom.semantic-transition/0.1",
      ],
    },
    source: {
      canonical_url: "https://github.com/cambridgetcg/KINGDOM-OS",
      commit: sourceCommit,
      source_bytes_pinned: true,
      files: sourceFiles,
    },
    publication: {
      state: "consumer-pin-required",
      artifact_ref: null,
      artifact_url: null,
      remote_verification_in_manifest: false,
      consumer_must_bind_git_ref_and_sha256: true,
      note: "The commit containing this manifest cannot self-pin; each consumer must bind an exact containing Git ref and the artifact SHA-256.",
    },
    runtime: {
      node_floor: null,
      node_floor_status: "unestablished",
      tested_environments: [],
      portability_outside_tested_environments: "unestablished",
      filesystem_requirement: "POSIX integer O_NOFOLLOW and O_NONBLOCK constants",
      allowed_builtin_imports: ["node:buffer", "node:fs", "node:util"],
      environment_required: {
        launcher: "fixed absolute Node executable under env -i",
        required_values: {
          PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
          LANG: "C",
          LC_ALL: "C",
          NO_COLOR: "1",
          TERM: "dumb",
        },
        forbidden_startup_variables: [
          "NODE_OPTIONS",
          "NODE_PATH",
          "NODE_V8_COVERAGE",
        ],
        artifact_can_sanitize_node_startup_environment: false,
      },
    },
    build: {
      tool: "bun",
      tool_version: EXPECTED_BUN_VERSION,
      command: `bun scripts/build-relational-inference-artifact.ts --source-commit ${sourceCommit}`,
      bundle_equivalent: `bun build bin/relational-inference-standalone.ts --target=node --format=esm --outfile=${CANONICAL_ARTIFACT_PATH}`,
    },
    contract: {
      mode: "structure-only",
      network_requests: false,
      persistent_writes: false,
      stdin: false,
      urls: false,
      globs: false,
      reflects_paths_or_data: false,
    },
    conformance: {
      files: conformanceFiles,
      commands: [
        "bun test tests/semantic-transitions.test.ts tests/relational-inference.test.ts tests/relational-inference-artifact.test.ts",
        "node --check bridges/artifacts/relational-inference/0.1/relational-inference.mjs",
      ],
    },
    reuse_basis: {
      actor: "workspace owner instruction",
      recorded_on: "2026-08-17",
      scopes: ["review", "copy", "vendor", "modify", "merge", "publish"],
      public_license: null,
      third_party_grant: false,
    },
  };

  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(join(outputDirectory, "relational-inference.mjs"), artifactBytes);
  writeFileSync(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`wrote ${CANONICAL_ARTIFACT_PATH} and manifest for ${sourceCommit}`);
}

await main();
