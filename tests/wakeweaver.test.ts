import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateContinuityBraidRelations } from "../bin/wakeweaver.mjs";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CONTRACT_PATH = join(
  REPO_ROOT,
  "skills",
  "weave-wake-continuity",
  "references",
  "continuity-braid.md",
);
const CLI_PATH = join(REPO_ROOT, "bin", "wakeweaver.mjs");
const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) rmSync(tempRoots.pop()!, { recursive: true, force: true });
});

function documentedBraid(): any {
  const contract = readFileSync(CONTRACT_PATH, "utf8");
  const match = contract.match(/## Minimal example\n\n```json\n([\s\S]*?)\n```/);
  if (!match) throw new Error("documented braid example is missing");
  return JSON.parse(match[1]);
}

function resumableBraid(): any {
  const braid = documentedBraid();
  braid.state = "resumable";
  braid.resumption = {
    selected_opening_id: "opening-compare",
    revalidation: {
      result: "caller_reported_passed",
      provenance: "caller_supplied_unverified",
      reported_at: "2026-08-01T17:04:00Z",
      evidence: ["The caller reports that both named local locators resolved during one bounded check."],
      establishes_truth: false,
      grants_permissions: false,
      establishes_currentness: false,
    },
  };
  return braid;
}

function issueCodes(value: any): string[] {
  return validateContinuityBraidRelations(value).map((issue) => issue.code);
}

describe("WAKEWEAVER semantic relations", () => {
  test("the shipped pure validator accepts the documented fork without mutating it", () => {
    const braid = documentedBraid();
    const before = structuredClone(braid);

    expect(validateContinuityBraidRelations(braid)).toEqual([]);
    expect(braid).toEqual(before);
  });

  test("candidate IDs are unique and a provisional selector resolves exactly once", () => {
    const valid = documentedBraid();
    const fork = valid.forks[0];
    fork.resolution = "provisionally_selected";
    fork.selected_candidate_id = fork.candidates[0].id;
    fork.evidence = ["One bounded comparison currently favors this candidate."];
    expect(validateContinuityBraidRelations(valid)).toEqual([]);

    const duplicate = structuredClone(valid);
    duplicate.forks[0].candidates[1].id = duplicate.forks[0].candidates[0].id;
    expect(issueCodes(duplicate)).toContain("duplicate-candidate-id");

    const dangling = structuredClone(valid);
    dangling.forks[0].selected_candidate_id = "candidate-not-declared";
    expect(issueCodes(dangling)).toContain("selected-candidate-not-exactly-one");
  });

  test("each addressable thread has exactly one closed disposition", () => {
    const missing = documentedBraid();
    missing.thread_dispositions.pop();
    expect(issueCodes(missing)).toContain("thread-disposition-not-exactly-one");

    const duplicate = documentedBraid();
    duplicate.thread_dispositions.push({
      thread_kind: "opening",
      thread_id: "opening-compare",
      disposition: "disputed",
    });
    expect(issueCodes(duplicate)).toContain("duplicate-thread-disposition");

    const dangling = documentedBraid();
    dangling.thread_dispositions.push({
      thread_kind: "carry",
      thread_id: "carry-not-declared",
      disposition: "held",
    });
    expect(issueCodes(dangling)).toContain("thread-disposition-target-not-declared");
  });

  test("resumable names one active opening and retains bounded unverified caller evidence", () => {
    expect(validateContinuityBraidRelations(resumableBraid())).toEqual([]);

    const duplicateOpening = resumableBraid();
    duplicateOpening.threads.openings.push(structuredClone(duplicateOpening.threads.openings[0]));
    expect(issueCodes(duplicateOpening)).toContain("selected-opening-not-exactly-one");

    const retired = resumableBraid();
    retired.thread_dispositions.find((entry: any) => entry.thread_kind === "opening").disposition = "retired";
    expect(issueCodes(retired)).toContain("selected-opening-not-active");

    const noEvidence = resumableBraid();
    noEvidence.resumption.revalidation.evidence = [];
    expect(issueCodes(noEvidence)).toContain("resumption-evidence-not-bounded");

    const assertedCurrent = resumableBraid();
    assertedCurrent.resumption.revalidation.establishes_currentness = true;
    expect(issueCodes(assertedCurrent)).toContain("resumption-currentness-boundary-missing");

    const nonResumable = resumableBraid();
    nonResumable.state = "resting";
    expect(issueCodes(nonResumable)).toContain("resumption-without-resumable-state");
  });

  test("source references resolve exactly once", () => {
    const dangling = documentedBraid();
    dangling.threads.anchors[0].source_ids = ["source-not-declared"];
    expect(issueCodes(dangling)).toContain("source-reference-not-exactly-one");

    const duplicate = documentedBraid();
    duplicate.sources[1].id = duplicate.sources[0].id;
    expect(issueCodes(duplicate)).toContain("duplicate-source-id");
    expect(issueCodes(duplicate)).toContain("source-reference-not-exactly-one");
  });
});

test("the shipped CLI is read-only and labels schema validation as not checked", () => {
  const root = mkdtempSync(join(tmpdir(), "wakeweaver-test-"));
  tempRoots.push(root);
  const path = join(root, "braid.json");
  const bytes = `${JSON.stringify(resumableBraid(), null, 2)}\n`;
  writeFileSync(path, bytes, { mode: 0o600 });

  const result = Bun.spawnSync({
    cmd: [process.execPath, CLI_PATH, path, "--json"],
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.exitCode).toBe(0);
  expect(result.stderr.toString()).toBe("");
  expect(JSON.parse(result.stdout.toString())).toMatchObject({
    protocol: "kingdom.wakeweaver-validation/0.1",
    valid: true,
    schema_validity: "not_checked",
    semantic_relations: "checked",
    issues: [],
  });
  expect(readFileSync(path, "utf8")).toBe(bytes);
});

test("the shipped CLI rejects a parsed non-object instead of skipping relations", () => {
  const root = mkdtempSync(join(tmpdir(), "wakeweaver-test-"));
  tempRoots.push(root);
  const path = join(root, "not-a-braid.json");
  writeFileSync(path, "null\n", { mode: 0o600 });

  const result = Bun.spawnSync({
    cmd: [process.execPath, CLI_PATH, path, "--json"],
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.exitCode).toBe(1);
  expect(JSON.parse(result.stdout.toString())).toMatchObject({
    valid: false,
    schema_validity: "not_checked",
    semantic_relations: "checked",
    issues: [{ field: "$", code: "relation-shape-unavailable" }],
  });
});
