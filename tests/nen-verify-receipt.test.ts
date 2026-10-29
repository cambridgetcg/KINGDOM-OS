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

// verify-receipt reads local files and local Git objects only. The CLI runs as
// a child process, so the fetch stub below guards this test process; the
// partial-clone fixture is what shows the child never fetches.

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RECORD_1027 = "records/2026-10-27-dark-continent-hf-pin-drift";
const RECEIPT_1027 = join(REPO_ROOT, RECORD_1027, "karma-receipt.json");
const REVISION_1027 = "b719f2546c8765238a8f0ca0cfee9884669864c0";
const FIXTURE_SKILL = "shape-kingdom-nen";
const FIXTURE_FILES = [
  "bin/nen.mjs",
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

const tempRoots: string[] = [];
const realFetch = globalThis.fetch;

function sha256(bytes: Buffer | string): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function git(root: string, args: string[]): string {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", env: GIT_ENV });
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

function run(cli: string, args: string[]) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: CHILD_ENV });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function verify(cli: string, receipt: string, ...flags: string[]) {
  const result = run(cli, ["verify-receipt", receipt, ...flags, "--json"]);
  return { status: result.status, payload: JSON.parse(result.stdout) };
}

// A small suite repository: two commits of one skill, so a receipt bound to
// the first no longer matches the working tree. It is configured as a partial
// clone whose promisor remote holds a commit the fixture does not, which is
// exactly where an unguarded Git would fetch on demand.
type Fixture = {
  root: string;
  cli: string;
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

  return { root, cli, first, second, remoteOnly, template, skillAtFirst };
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
      path: "notes.txt",
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
    expect(own.payload.suite).toEqual({ source: "git_revision", revision: fixture.first, status: "read" });
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
    expect(result.payload.digests.mismatched).toBe(2);
    expect(entry(result.payload, "$.inputs[2]").status).toBe("match");
  });

  test("entries that cannot be read here are listed with a reason, never counted as passing", () => {
    const outside = tempRoot("nen-verify-outside.");
    writeFileSync(join(outside, "target.json"), "{}\n");
    const receipt = writeRecord("unreachable", (value, directory) => {
      symlinkSync(join(outside, "target.json"), join(directory, "linked.json"));
      value.outputs.push(
        { reference: "a description with no leading path", digest: `sha256:${"b".repeat(64)}` },
        { reference: `skills/${FIXTURE_SKILL}/SKILL.md: outside this record`, digest: `sha256:${"c".repeat(64)}` },
        { reference: "linked.json: a symlink beside the receipt", digest: sha256("{}\n") },
      );
      value.inputs.push({
        ...value.inputs[0],
        revision: fixture.remoteOnly,
        path: "elsewhere.txt",
      });
    });

    const result = verify(fixture.cli, receipt, "--at-revision");
    expect(result.status).toBe(0);
    expect(result.payload.digests.recomputed).toBe(3);
    expect(result.payload.digests.not_recomputed).toBe(5);
    expect(entry(result.payload, "$.outputs[1]").reason).toBe("not_a_path");
    expect(entry(result.payload, "$.outputs[2]").reason).toBe("not_in_record_directory");
    expect(entry(result.payload, "$.outputs[3]").reason).toBe("not_a_regular_file");
    expect(entry(result.payload, "$.inputs[1]").reason).toBe("remote_boundary");
    expect(entry(result.payload, "$.inputs[3]").reason).toBe("revision_not_in_local_objects");

    const text = run(fixture.cli, ["verify-receipt", receipt, "--at-revision"]);
    expect(text.stdout).toContain(
      "Digests: 3 recomputed · 0 mismatched · 5 not recomputed (1 not_a_path, 1 not_a_regular_file, 1 not_in_record_directory, 1 remote_boundary, 1 revision_not_in_local_objects)",
    );
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
      suite: { source: "git_revision", revision: fixture.remoteOnly, status: "revision_not_present_locally" },
      digests: null,
      issues: [{ file: "karma-receipt.json", field: "$.ability_revision", code: "revision-not-present-locally" }],
    });
    expect(hasLocalCommit(fixture.root, fixture.remoteOnly)).toBe(false);
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
    expect(result.payload.suite).toEqual({ source: "git_revision", revision: REVISION_1027, status: "read" });
    expect(result.payload.digests.recomputed).toBe(4);
    expect(result.payload.digests.mismatched).toBe(0);
    expect(entry(result.payload, "$.inputs[0]")).toEqual({
      field: "$.inputs[0]", status: "match", basis: "git_revision", reason: null,
    });
    const reasons = result.payload.digests.entries
      .filter((candidate: any) => candidate.status === "not_recomputed")
      .map((candidate: any) => candidate.reason);
    expect(reasons.filter((reason: string) => reason === "remote_boundary")).toHaveLength(35);
    expect(reasons.filter((reason: string) => reason === "revision_not_in_local_objects")).toHaveLength(4);
  });
});
