import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// verify-receipt reads local files and local Git objects only. The CLI and the
// MCP server run as child processes, so the fetch stub below guards this test
// process; the partial-clone fixture is what shows the children never fetch.

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RECORD_1027 = "records/2026-10-27-dark-continent-hf-pin-drift";
const RECEIPT_1027 = join(REPO_ROOT, RECORD_1027, "karma-receipt.json");
const REVISION_1027 = "b719f2546c8765238a8f0ca0cfee9884669864c0";
const FIXTURE_SKILL = "shape-kingdom-nen";
const FIXTURE_FILES = [
  "bin/nen.mjs",
  "bin/nen-mcp.mjs",
  "schemas/karma-receipt-v0.1.schema.json",
  "schemas/nen-ability-v0.1.schema.json",
  "schemas/nen-manifestation-receipt-v0.1.schema.json",
  "references/xenia-rights-0.1.md",
];
const CHILD_ENV = {
  PATH: process.env.PATH ?? "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
};
const GIT_ENV = {
  ...CHILD_ENV,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_NO_LAZY_FETCH: "1",
  GIT_AUTHOR_NAME: "Nen fixture",
  GIT_AUTHOR_EMAIL: "nen-fixture@example.invalid",
  GIT_AUTHOR_DATE: "2026-10-29T00:00:00Z",
  GIT_COMMITTER_NAME: "Nen fixture",
  GIT_COMMITTER_EMAIL: "nen-fixture@example.invalid",
  GIT_COMMITTER_DATE: "2026-10-29T00:00:00Z",
};
const MODERN_META = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientInfo": { name: "nen-verify-test", version: "1.0.0" },
  "io.modelcontextprotocol/clientCapabilities": {},
};

const tempRoots: string[] = [];
const realFetch = globalThis.fetch;

function sha256(bytes: Buffer | string): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function git(root: string, args: string[], options: { env?: Record<string, string>; input?: string } = {}): string {
  const result = spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    env: { ...GIT_ENV, ...options.env },
    input: options.input,
  });
  if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function hasLocalCommit(root: string, revision: string): boolean {
  const result = spawnSync("git", ["-C", root, "cat-file", "-t", revision], { encoding: "utf8", env: GIT_ENV });
  return result.status === 0 && result.stdout.trim() === "commit";
}

function commitAll(root: string, message: string): string {
  git(root, ["add", "-A"]);
  git(root, ["-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "-q", "-m", message]);
  return git(root, ["rev-parse", "HEAD"]);
}

function tempRoot(prefix: string): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  tempRoots.push(root);
  return root;
}

function run(cli: string, args: string[], env: Record<string, string> = CHILD_ENV) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function verify(cli: string, receipt: string, ...flags: string[]) {
  const result = run(cli, ["verify-receipt", receipt, ...flags, "--json"]);
  return { status: result.status, payload: JSON.parse(result.stdout) };
}

// A commit made from the first fixture commit's tree with some files
// replaced, and no ref pointing at it until the caller adds one.
function commitBesideFirst(message: string, replace: Record<string, string> = {}): string {
  const index = join(tempRoot("nen-verify-index."), "index");
  const env = { GIT_INDEX_FILE: index };
  git(fixture.root, ["read-tree", fixture.first], { env });
  for (const [path, content] of Object.entries(replace)) {
    const blob = git(fixture.root, ["hash-object", "-w", "--stdin"], { input: content });
    git(fixture.root, ["update-index", "--add", "--cacheinfo", `100644,${blob},${path}`], { env });
  }
  const tree = git(fixture.root, ["write-tree"], { env });
  return git(fixture.root, ["commit-tree", tree, "-p", fixture.first, "-m", message]);
}

function mcp(server: string, requests: object[]): Map<unknown, any> {
  const input = `${requests.map((request) => JSON.stringify(request)).join("\n")}\n`;
  const result = spawnSync(process.execPath, [server], { input, encoding: "utf8", env: CHILD_ENV });
  expect(result.status).toBe(0);
  expect(result.stderr).toBe("");
  const responses = new Map<unknown, any>();
  for (const line of result.stdout.split("\n").filter(Boolean)) {
    const message = JSON.parse(line);
    responses.set(message.id, message);
  }
  return responses;
}

function verifyCall(id: number, argumentsValue: object) {
  return {
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { _meta: MODERN_META, name: "kingdom_karma_receipt_verify", arguments: argumentsValue },
  };
}

// A small suite repository: two commits of one skill, so a receipt bound to
// the first no longer matches the working tree. It is configured as a partial
// clone whose promisor remote holds a commit the fixture does not, which is
// exactly where an unguarded Git would fetch on demand.
type Fixture = {
  root: string;
  cli: string;
  server: string;
  first: string;
  second: string;
  remoteOnly: string;
  template: any;
  skillAtFirst: Buffer;
};

let fixture: Fixture;

function buildFixture(): Fixture {
  const root = tempRoot("nen-verify-fixture.");
  for (const file of FIXTURE_FILES) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    cpSync(join(REPO_ROOT, file), join(root, file));
  }
  cpSync(join(REPO_ROOT, "skills", FIXTURE_SKILL), join(root, "skills", FIXTURE_SKILL), { recursive: true });
  git(root, ["-c", "init.defaultBranch=main", "init", "-q"]);
  const first = commitAll(root, "fixture suite");

  const cli = join(root, "bin", "nen.mjs");
  const drafted = run(cli, ["receipt-template", FIXTURE_SKILL]);
  expect(drafted.status).toBe(0);
  const template = JSON.parse(drafted.stdout);
  const skillAtFirst = readFileSync(join(root, "skills", FIXTURE_SKILL, "SKILL.md"));

  writeFileSync(
    join(root, "skills", FIXTURE_SKILL, "references", "fixture-successor.md"),
    "A later revision adds this file, so the bundle digest moves.\n",
  );
  const second = commitAll(root, "fixture successor");

  const upstream = tempRoot("nen-verify-upstream.");
  git(upstream, ["-c", "init.defaultBranch=main", "init", "-q"]);
  writeFileSync(join(upstream, "elsewhere.txt"), "only the promisor remote has this commit\n");
  const remoteOnly = commitAll(upstream, "remote only");
  git(root, ["config", "core.repositoryformatversion", "1"]);
  git(root, ["config", "extensions.partialClone", "origin"]);
  git(root, ["config", "remote.origin.url", upstream]);
  git(root, ["config", "remote.origin.promisor", "true"]);

  return { root, cli, server: join(root, "bin", "nen-mcp.mjs"), first, second, remoteOnly, template, skillAtFirst };
}

function finalReceipt(revision: string): any {
  const receipt = structuredClone(fixture.template);
  return {
    ...receipt,
    state: "final",
    receipt_id: "receipt-fixture-1",
    invocation_id: "invocation-fixture-1",
    ability_revision: revision,
    started_at: "2026-10-29T00:00:00.000Z",
    finished_at: "2026-10-29T00:00:01.000Z",
    authority: { ...receipt.authority, authority_reference: "Local fixture; no external action." },
    predicted_effects: ["No external effect."],
    observed_effects: ["No external effect observed."],
    uncertainty: ["Fixture only."],
    result: "completed",
  };
}

// One record directory per test: an output in evidence/, an input bound to the
// first fixture commit, a remote input, and an input kept beside the receipt.
// Paths in the record name it from the repository root, which is the only form
// the verifier resolves into a record directory.
function writeRecord(name: string, change: (receipt: any, directory: string) => void = () => {}): string {
  const directory = join(fixture.root, "records", name);
  mkdirSync(join(directory, "evidence"), { recursive: true });
  const observations = Buffer.from('{"observed":"fixture"}\n');
  const notes = Buffer.from("fixture notes\n");
  writeFileSync(join(directory, "evidence", "observations.json"), observations);
  writeFileSync(join(directory, "notes.txt"), notes);
  const receipt = finalReceipt(fixture.first);
  receipt.outputs = [
    { reference: `records/${name}/evidence/observations.json: fixture observations`, digest: sha256(observations) },
  ];
  receipt.inputs = [
    {
      source: "fixture suite repository",
      revision: fixture.first,
      path: `skills/${FIXTURE_SKILL}/SKILL.md`,
      license_assertion: "not-applicable: local fixture",
      bytes: { value: String(fixture.skillAtFirst.byteLength), basis: "observed" },
      digest: sha256(fixture.skillAtFirst),
      boundary: "local",
      assurance: "untrusted_evidence",
    },
    {
      source: "a public endpoint this test never contacts",
      revision: "mutable head",
      path: "/api/fixture",
      license_assertion: "not-applicable: fixture",
      bytes: { value: "12", basis: "observed" },
      digest: `sha256:${"a".repeat(64)}`,
      boundary: "remote_public",
      assurance: "untrusted_evidence",
    },
    {
      source: "this record directory",
      revision: "working copy",
      path: `records/${name}/notes.txt`,
      license_assertion: "not-applicable: local fixture",
      bytes: { value: String(notes.byteLength), basis: "observed" },
      digest: sha256(notes),
      boundary: "local",
      assurance: "untrusted_evidence",
    },
  ];
  change(receipt, directory);
  const path = join(directory, "karma-receipt.json");
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);
  return path;
}

function entry(payload: any, field: string) {
  return payload.digests.entries.find((candidate: any) => candidate.field === field);
}

beforeAll(() => {
  globalThis.fetch = (() => {
    throw new Error("receipt verification makes no network request");
  }) as unknown as typeof fetch;
  fixture = buildFixture();
});

afterAll(() => {
  globalThis.fetch = realFetch;
  while (tempRoots.length > 0) rmSync(tempRoots.pop()!, { recursive: true, force: true });
});

describe("verify-receipt at the receipt's own revision", () => {
  test("a receipt bound to an earlier revision fails on the current tree and verifies at that revision", () => {
    const receipt = writeRecord("bound-to-first");

    const current = verify(fixture.cli, receipt);
    expect(current.status).toBe(1);
    expect(current.payload.issues).toEqual([
      { file: "karma-receipt.json", field: "$.ability_bundle_sha256", code: "ability-digest-mismatch" },
    ]);
    expect(current.payload.suite).toEqual({ source: "working_tree" });
    // The working-tree mode reads no Git objects, so the input bound to a
    // revision is named as not read rather than passed.
    expect(entry(current.payload, "$.inputs[0]")).toEqual({
      field: "$.inputs[0]", status: "not_recomputed", basis: null, reason: "revision_not_read",
    });

    const own = verify(fixture.cli, receipt, "--at-revision");
    expect(own.status).toBe(0);
    expect(own.payload.valid).toBe(true);
    expect(own.payload.issues).toEqual([]);
    expect(own.payload.suite).toEqual({
      source: "git_revision", revision: fixture.first, status: "read", reachable_from: "HEAD",
    });
    // The receipt is judged by this checkout's receipt schema in both modes.
    expect(own.payload.receipt_schema_sha256).toBe(current.payload.receipt_schema_sha256);
    expect(own.payload.digests).toEqual({
      recomputed: 3,
      mismatched: 0,
      not_recomputed: 1,
      entries: [
        { field: "$.outputs[0]", status: "match", basis: "record_directory", reason: null },
        { field: "$.inputs[0]", status: "match", basis: "git_revision", reason: null },
        { field: "$.inputs[1]", status: "not_recomputed", basis: null, reason: "remote_boundary" },
        { field: "$.inputs[2]", status: "match", basis: "record_directory", reason: null },
      ],
    });

    const later = verify(fixture.cli, writeRecord("bound-to-second", (value) => {
      value.ability_revision = fixture.second;
    }), "--at-revision");
    expect(later.payload.issues).toEqual([
      { file: "karma-receipt.json", field: "$.ability_bundle_sha256", code: "ability-digest-mismatch" },
    ]);
  });

  test("each recomputed mismatch has its own issue code", () => {
    const receipt = writeRecord("tampered", (value) => {
      value.inputs[0].digest = sha256("not the committed SKILL.md");
      value.inputs[2].bytes.value = "999";
    });
    // Bound evidence edited after its digest was taken.
    writeFileSync(join(dirname(receipt), "evidence", "observations.json"), "edited after the receipt was final\n");

    const result = verify(fixture.cli, receipt, "--at-revision");
    expect(result.status).toBe(1);
    expect(result.payload.issues).toEqual([
      { file: "karma-receipt.json", field: "$.inputs[0].digest", code: "input-digest-mismatch" },
      { file: "karma-receipt.json", field: "$.inputs[2].bytes", code: "input-bytes-mismatch" },
      { file: "karma-receipt.json", field: "$.outputs[0].digest", code: "output-digest-mismatch" },
    ]);
    // A matching digest with a wrong byte count is still a mismatch, so the
    // summary agrees with the issues.
    expect(entry(result.payload, "$.inputs[2]").status).toBe("bytes_mismatch");
    expect(result.payload.digests.mismatched).toBe(3);
    expect(run(fixture.cli, ["verify-receipt", receipt, "--at-revision"]).stdout).toContain(
      "Digests: 3 recomputed · 3 mismatched · 1 not recomputed (1 remote_boundary)",
    );
  });

  test("entries that cannot be read here are listed with a reason, never counted as passing", () => {
    const outside = tempRoot("nen-verify-outside.");
    writeFileSync(join(outside, "target.json"), "{}\n");
    const receipt = writeRecord("unreachable", (value, directory) => {
      symlinkSync(join(outside, "target.json"), join(directory, "linked.json"));
      value.outputs.push(
        { reference: "a description with no leading path", digest: `sha256:${"b".repeat(64)}` },
        { reference: `skills/${FIXTURE_SKILL}/SKILL.md: outside this record`, digest: `sha256:${"c".repeat(64)}` },
        { reference: "records/unreachable/linked.json: a symlink beside the receipt", digest: sha256("{}\n") },
        { reference: "records/unreachable/evidence/cleaned-up.json: removed after the run", digest: `sha256:${"d".repeat(64)}` },
      );
      value.inputs.push(
        { ...value.inputs[0], revision: fixture.remoteOnly, path: "elsewhere.txt" },
        { ...value.inputs[0], path: "committed tree (git ls-tree -r listing digested)" },
      );
    });

    const result = verify(fixture.cli, receipt, "--at-revision");
    expect(result.status).toBe(0);
    expect(result.payload.digests.recomputed).toBe(3);
    expect(result.payload.digests.not_recomputed).toBe(7);
    expect(entry(result.payload, "$.outputs[1]").reason).toBe("not_a_path");
    expect(entry(result.payload, "$.outputs[2]").reason).toBe("location_ambiguous");
    expect(entry(result.payload, "$.outputs[3]").reason).toBe("not_a_regular_file");
    expect(entry(result.payload, "$.outputs[4]").reason).toBe("missing_file");
    expect(entry(result.payload, "$.inputs[1]").reason).toBe("remote_boundary");
    expect(entry(result.payload, "$.inputs[3]").reason).toBe("revision_not_present_locally");
    // A description with spaces is not a file name, even at an exact revision.
    expect(entry(result.payload, "$.inputs[4]").reason).toBe("not_a_path");

    const text = run(fixture.cli, ["verify-receipt", receipt, "--at-revision"]);
    expect(text.stdout).toContain(
      "Digests: 3 recomputed · 0 mismatched · 7 not recomputed (1 location_ambiguous, 1 missing_file, 2 not_a_path, 1 not_a_regular_file, 1 remote_boundary, 1 revision_not_present_locally)",
    );
  });

  test("a bare relative path is never guessed into the record directory", () => {
    // A lookback-lamp style receipt cites a predecessor's evidence file by the
    // same relative path as its own, with the predecessor's digest. Hashing
    // the new record's file would call a correct receipt tampered.
    const predecessor = Buffer.from('{"observed":"the predecessor"}\n');
    const receipt = writeRecord("lookback", (value) => {
      value.inputs.push(
        {
          ...value.inputs[2],
          source: "predecessor record records/bound-to-first (working copy)",
          path: "evidence/observations.json",
          bytes: { value: String(predecessor.byteLength), basis: "observed" },
          digest: sha256(predecessor),
        },
        {
          ...value.inputs[2],
          source: "another repository (working copy, uncommitted)",
          path: "notes.txt",
          digest: sha256("another repository's notes\n"),
        },
      );
    });

    for (const flags of [[], ["--at-revision"]]) {
      const result = verify(fixture.cli, receipt, ...flags);
      expect(result.payload.issues.filter((item: any) => item.field.startsWith("$.inputs"))).toEqual([]);
      expect(entry(result.payload, "$.inputs[3]")).toEqual({
        field: "$.inputs[3]", status: "not_recomputed", basis: null, reason: "location_ambiguous",
      });
      expect(entry(result.payload, "$.inputs[4]").reason).toBe("location_ambiguous");
      expect(result.payload.digests.mismatched).toBe(0);
    }
  });

  test("a receipt that is not a JSON object fails in both modes", () => {
    const directory = join(fixture.root, "records", "not-an-object");
    mkdirSync(directory, { recursive: true });
    for (const value of ["[]", '"x"', "1", "null", "false"]) {
      const receipt = join(directory, "karma-receipt.json");
      writeFileSync(receipt, `${value}\n`);
      for (const flags of [[], ["--at-revision"]]) {
        const result = verify(fixture.cli, receipt, ...flags);
        expect(result.status).toBe(1);
        expect(result.payload.valid).toBe(false);
        expect(result.payload.issues).toEqual([{ file: "karma-receipt.json", field: "$", code: "invalid-type" }]);
      }
    }
  });

  test("a revision missing from local objects fails and is not fetched, even from a promisor remote", () => {
    const receipt = writeRecord("missing-revision", (value) => {
      value.ability_revision = fixture.remoteOnly;
    });

    const text = run(fixture.cli, ["verify-receipt", receipt, "--at-revision"]);
    expect(text.status).toBe(1);
    expect(text.stdout).toContain(
      `Suite: Git revision ${fixture.remoteOnly} is not in this repository's local objects; nothing was fetched`,
    );
    expect(text.stderr).toBe("karma-receipt.json $.ability_revision revision-not-present-locally\n");

    const result = verify(fixture.cli, receipt, "--at-revision");
    expect(result.payload).toMatchObject({
      valid: false,
      suite: {
        source: "git_revision",
        revision: fixture.remoteOnly,
        status: "revision_not_present_locally",
        reachable_from: null,
      },
      issues: [{ file: "karma-receipt.json", field: "$.ability_revision", code: "revision-not-present-locally" }],
    });
    // The receipt schema does not depend on the revision, so the receipt and
    // its record are still checked; only the ability comparison is skipped.
    expect(result.payload.digests.mismatched).toBe(0);
    expect(hasLocalCommit(fixture.root, fixture.remoteOnly)).toBe(false);
  });

  test("a lookup that fails is reported as failed, never as an absent revision", () => {
    // A git that fails `cat-file -e` with an exit other than 1 stands in for a
    // timeout, a signal or a broken repository.
    const shim = tempRoot("nen-verify-git-shim.");
    const realGit = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8", env: CHILD_ENV }).stdout.trim();
    writeFileSync(
      join(shim, "git"),
      `#!/bin/sh\nfor argument in "$@"; do [ "$argument" = "-e" ] && exit 3; done\nexec "${realGit}" "$@"\n`,
      { mode: 0o755 },
    );
    const receipt = writeRecord("lookup-failed");
    const env = { ...CHILD_ENV, PATH: `${shim}:${CHILD_ENV.PATH}` };

    const result = run(fixture.cli, ["verify-receipt", receipt, "--at-revision", "--json"], env);
    expect(result.status).toBe(1);
    const payload = JSON.parse(result.stdout);
    expect(payload.suite).toMatchObject({ revision: fixture.first, status: "lookup_failed" });
    expect(payload.issues).toEqual([
      { file: "karma-receipt.json", field: "$.ability_revision", code: "revision-lookup-failed" },
    ]);
    expect(entry(payload, "$.inputs[0]").reason).toBe("revision_lookup_failed");

    const text = run(fixture.cli, ["verify-receipt", receipt, "--at-revision"], env);
    expect(text.stdout).toContain("this says nothing about whether it is present, and nothing was fetched");
    expect(text.stdout).not.toContain("is not in this repository's local objects");
  });

  test("a revision no ref reaches is not read until a ref holds it", () => {
    const dangling = commitBesideFirst("dangling suite");
    const receipt = writeRecord("dangling", (value) => {
      value.ability_revision = dangling;
    });

    const unheld = verify(fixture.cli, receipt, "--at-revision");
    expect(unheld.status).toBe(1);
    expect(unheld.payload.suite).toEqual({
      source: "git_revision", revision: dangling, status: "revision_not_reachable", reachable_from: null,
    });
    expect(unheld.payload.issues).toEqual([
      { file: "karma-receipt.json", field: "$.ability_revision", code: "revision-not-reachable" },
    ]);

    git(fixture.root, ["update-ref", "refs/heads/held", dangling]);
    const held = verify(fixture.cli, receipt, "--at-revision");
    expect(held.status).toBe(0);
    expect(held.payload.suite).toEqual({
      source: "git_revision", revision: dangling, status: "read", reachable_from: "refs/heads/held",
    });
  });

  test("a revision cannot loosen the receipt schema it is judged by", () => {
    const schemaPath = "schemas/karma-receipt-v0.1.schema.json";
    const schema = JSON.parse(readFileSync(join(fixture.root, schemaPath), "utf8"));
    expect(schema.properties.inputs.items.properties.assurance).toEqual({ const: "untrusted_evidence" });
    schema.properties.inputs.items.properties.assurance = { enum: ["untrusted_evidence", "trusted"] };
    const loosened = commitBesideFirst("loosened receipt schema", {
      [schemaPath]: `${JSON.stringify(schema, null, 2)}\n`,
    });
    git(fixture.root, ["update-ref", "refs/heads/loosened", loosened]);
    const receipt = writeRecord("loosened", (value) => {
      value.ability_revision = loosened;
      value.inputs[0].assurance = "trusted";
    });

    const result = verify(fixture.cli, receipt, "--at-revision");
    expect(result.status).toBe(1);
    expect(result.payload.suite.status).toBe("read");
    expect(result.payload.issues).toEqual([
      { file: "karma-receipt.json", field: "$.inputs[0].assurance", code: "invalid-const" },
    ]);
  });

  test("only an exact commit ID is resolved, and only in the suite's own repository", () => {
    const named = writeRecord("named-revision", (value) => {
      value.ability_revision = "main";
    });
    const result = verify(fixture.cli, named, "--at-revision");
    expect(result.payload.issues).toEqual([
      { file: "karma-receipt.json", field: "$.ability_revision", code: "revision-not-exact" },
    ]);
    expect(run(fixture.cli, ["verify-receipt", named, "--at-revision"]).stdout).toContain(
      "Suite: ability_revision is not an exact commit ID; no revision was read",
    );

    const copy = tempRoot("nen-verify-no-history.");
    for (const file of FIXTURE_FILES) {
      mkdirSync(dirname(join(copy, file)), { recursive: true });
      cpSync(join(fixture.root, file), join(copy, file));
    }
    const detached = verify(join(copy, "bin", "nen.mjs"), writeRecord("no-history"), "--at-revision");
    expect(detached.payload.issues).toEqual([
      { file: "karma-receipt.json", field: "$.ability_revision", code: "suite-repository-unavailable" },
    ]);
  });

  test("verification writes nothing to the repository or its object store", () => {
    const receipt = writeRecord("non-mutation");
    const before = [
      git(fixture.root, ["status", "--porcelain=v1", "--untracked-files=all"]),
      git(fixture.root, ["count-objects", "-v"]),
      readFileSync(receipt, "utf8"),
    ];
    verify(fixture.cli, receipt);
    verify(fixture.cli, receipt, "--at-revision");
    run(fixture.cli, ["verify-receipt", receipt, "--at-revision"]);
    expect([
      git(fixture.root, ["status", "--porcelain=v1", "--untracked-files=all"]),
      git(fixture.root, ["count-objects", "-v"]),
      readFileSync(receipt, "utf8"),
    ]).toEqual(before);
  });

  test("--at-revision is a verify-receipt mode and does not combine with another skills root", () => {
    const receipt = writeRecord("usage");
    expect(run(fixture.cli, ["--skills-root", join(fixture.root, "skills"), "verify-receipt", receipt, "--at-revision"]).status).toBe(2);
    expect(run(fixture.cli, ["verify-receipt", receipt, "--at-revision", "--at-revision"]).status).toBe(2);
    expect(run(fixture.cli, ["list", "--at-revision"]).status).toBe(2);
  });
});

describe("the 2026-10-27 Dark Continent receipt", () => {
  const history = hasLocalCommit(REPO_ROOT, REVISION_1027);

  test("fails on the current tree with ability-digest-mismatch while its evidence still matches", () => {
    const result = verify(join(REPO_ROOT, "bin", "nen.mjs"), RECEIPT_1027);
    expect(result.status).toBe(1);
    expect(result.payload.issues).toEqual([
      { file: "karma-receipt.json", field: "$.ability_bundle_sha256", code: "ability-digest-mismatch" },
    ]);
    expect(result.payload.digests.mismatched).toBe(0);
    for (const field of ["$.outputs[0]", "$.outputs[1]", "$.outputs[2]"]) {
      expect(entry(result.payload, field)).toEqual({ field, status: "match", basis: "record_directory", reason: null });
    }
  });

  // CI checks out full history (fetch-depth: 0). A shallow or extracted copy
  // lacks b719f254, and this test then skips instead of fetching it.
  test.skipIf(!history)("verifies at its own revision, b719f254, from local Git objects", () => {
    const result = verify(join(REPO_ROOT, "bin", "nen.mjs"), RECEIPT_1027, "--at-revision");
    expect(result.status).toBe(0);
    expect(result.payload.valid).toBe(true);
    // b719f254 is an ancestor of main, so HEAD or a remote-tracking ref holds
    // it in any full-history checkout; which one depends on the checkout.
    expect(result.payload.suite).toMatchObject({ source: "git_revision", revision: REVISION_1027, status: "read" });
    expect(typeof result.payload.suite.reachable_from).toBe("string");
    expect(result.payload.digests.recomputed).toBe(4);
    expect(result.payload.digests.mismatched).toBe(0);
    expect(entry(result.payload, "$.inputs[0]")).toEqual({
      field: "$.inputs[0]", status: "match", basis: "git_revision", reason: null,
    });
    const reasons = result.payload.digests.entries
      .filter((candidate: any) => candidate.status === "not_recomputed")
      .map((candidate: any) => candidate.reason);
    expect(reasons.filter((reason: string) => reason === "remote_boundary")).toHaveLength(35);
    // Three inputs are agenttool commits, which this repository never holds;
    // the fourth is a description of a listing, not a path.
    expect(reasons.filter((reason: string) => reason === "revision_not_present_locally")).toHaveLength(3);
    expect(reasons.filter((reason: string) => reason === "not_a_path")).toHaveLength(1);
  });
});

describe("kingdom_karma_receipt_verify over MCP", () => {
  test("is listed read-only with a bounded receipt path, and the instructions name it", () => {
    const responses = mcp(join(REPO_ROOT, "bin", "nen-mcp.mjs"), [
      { jsonrpc: "2.0", id: 1, method: "server/discover", params: { _meta: MODERN_META } },
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: { _meta: MODERN_META } },
    ]);
    expect(responses.get(1).result.instructions).toContain("KARMA receipt verification");
    expect(responses.get(1).result.instructions).toContain("not that a finding is true or that anything is permitted");
    const tools = responses.get(2).result.tools;
    expect(tools.map((tool: any) => tool.name)).toEqual([
      "kingdom_nen_list",
      "kingdom_nen_validate",
      "kingdom_nen_show",
      "kingdom_nen_types",
      "kingdom_karma_receipt_template",
      "kingdom_karma_receipt_verify",
    ]);
    const verifyTool = tools.at(-1);
    expect(verifyTool.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(verifyTool.inputSchema).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: ["receipt_path"],
    });
    expect(Object.keys(verifyTool.inputSchema.properties).sort()).toEqual(["at_revision", "receipt_path"]);
  });

  test("returns the same verdicts as the CLI and rejects paths outside records/", () => {
    const relative = `${RECORD_1027}/karma-receipt.json`;
    const responses = mcp(join(REPO_ROOT, "bin", "nen-mcp.mjs"), [
      verifyCall(1, { receipt_path: relative }),
      verifyCall(2, { receipt_path: "records/../NEN.json" }),
      verifyCall(3, { receipt_path: "/etc/karma-receipt.json" }),
      verifyCall(4, { receipt_path: "skills/karma-receipt.json" }),
      verifyCall(5, { receipt_path: relative, at_revision: "yes" }),
      verifyCall(6, { receipt_path: relative, path: "elsewhere" }),
    ]);
    const current = responses.get(1).result;
    expect(current.isError).toBe(true);
    expect(current.structuredContent.result.issues).toEqual([
      { file: "karma-receipt.json", field: "$.ability_bundle_sha256", code: "ability-digest-mismatch" },
    ]);
    for (const id of [2, 3, 4, 5, 6]) expect(responses.get(id).error.code).toBe(-32602);
  });

  test("verifies at a revision and refuses a receipt reached through a symlink", () => {
    writeRecord("over-mcp");
    const outside = tempRoot("nen-verify-mcp-outside.");
    cpSync(join(fixture.root, "records", "over-mcp"), join(outside, "over-mcp"), { recursive: true });
    symlinkSync(join(outside, "over-mcp"), join(fixture.root, "records", "linked"));

    const responses = mcp(fixture.server, [
      verifyCall(1, { receipt_path: "records/over-mcp/karma-receipt.json", at_revision: true }),
      verifyCall(2, { receipt_path: "records/linked/karma-receipt.json", at_revision: true }),
      verifyCall(3, { receipt_path: "records/absent/karma-receipt.json" }),
    ]);
    expect(responses.get(1).result.isError).toBe(false);
    expect(responses.get(1).result.structuredContent).toMatchObject({
      valid: true,
      suite: { source: "git_revision", revision: fixture.first, status: "read" },
    });
    for (const id of [2, 3]) {
      expect(responses.get(id).result.isError).toBe(true);
      expect(responses.get(id).result.structuredContent.code).toBe("receipt-path-unavailable");
    }
  });
});
