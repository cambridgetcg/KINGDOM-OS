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

  test("thread identity is exact kind:id and permits cross-kind ID reuse", () => {
    const braid = documentedBraid();
    braid.threads.carry[0].id = braid.threads.anchors[0].id;
    braid.thread_dispositions.find((entry: any) => entry.thread_kind === "carry").thread_id = braid.threads.anchors[0].id;

    expect(validateContinuityBraidRelations(braid)).toEqual([]);

    const sameKindDuplicate = resumableBraid();
    sameKindDuplicate.threads.openings.push(structuredClone(sameKindDuplicate.threads.openings[0]));
    expect(issueCodes(sameKindDuplicate)).toContain("thread-address-not-unique");
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

describe("WAKEWEAVER own-data capture boundary", () => {
  test("rejects getters without invoking them", () => {
    const braid = documentedBraid();
    let getterCalls = 0;
    Object.defineProperty(braid, "sources", {
      enumerable: true,
      configurable: true,
      get() {
        getterCalls += 1;
        throw new Error("must not run");
      },
    });

    expect(issueCodes(braid)).toEqual(["capture-accessor"]);
    expect(getterCalls).toBe(0);
  });

  test("rejects caller array methods and inherited data without invoking them", () => {
    const customMap = documentedBraid();
    let mapCalls = 0;
    Object.defineProperty(customMap.sources, "map", {
      enumerable: true,
      configurable: true,
      value() {
        mapCalls += 1;
        throw new Error("must not run");
      },
    });
    expect(issueCodes(customMap)).toEqual(["capture-custom-array-property"]);
    expect(mapCalls).toBe(0);

    const inheritedMap = documentedBraid();
    const customArrayPrototype = Object.create(Array.prototype);
    customArrayPrototype.map = () => {
      mapCalls += 1;
      throw new Error("must not run");
    };
    Object.setPrototypeOf(inheritedMap.sources, customArrayPrototype);
    expect(issueCodes(inheritedMap)).toEqual(["capture-custom-prototype"]);
    expect(mapCalls).toBe(0);

    const braid = documentedBraid();
    const { sources, ...own } = braid;
    const inherited = Object.assign(Object.create({ sources }), own);
    expect(issueCodes(inherited)).toEqual(["capture-custom-prototype"]);
  });

  test("rejects non-enumerable and symbol properties", () => {
    const nonEnumerable = documentedBraid();
    Object.defineProperty(nonEnumerable, "hidden", {
      value: "not part of a JSON-like tree",
      enumerable: false,
    });
    expect(issueCodes(nonEnumerable)).toEqual(["capture-non-enumerable-property"]);

    const symbol = documentedBraid();
    symbol[Symbol("hidden")] = true;
    expect(issueCodes(symbol)).toEqual(["capture-symbol-key"]);
  });

  test("rejects sparse arrays, cycles, and shared object references", () => {
    const sparse = documentedBraid();
    sparse.sources = new Array(1);
    expect(issueCodes(sparse)).toEqual(["capture-sparse-array"]);

    const cyclic: any = documentedBraid();
    cyclic.loop = cyclic;
    expect(issueCodes(cyclic)).toEqual(["capture-cycle"]);

    const shared = documentedBraid();
    shared.shared = shared.scope;
    expect(issueCodes(shared)).toEqual(["capture-shared-reference"]);
  });

  test("bounds depth, arrays, strings, and the total captured graph", () => {
    const deep: any = {};
    let cursor = deep;
    for (let depth = 0; depth < 34; depth += 1) {
      cursor.next = {};
      cursor = cursor.next;
    }
    expect(issueCodes(deep)).toEqual(["capture-depth-limit"]);

    expect(issueCodes({ oversized: new Array(1_025) })).toEqual(["capture-array-limit"]);
    expect(issueCodes({ oversized: "x".repeat(4_097) })).toEqual(["capture-string-limit"]);

    const many: any = { branches: [] };
    for (let branchIndex = 0; branchIndex < 65; branchIndex += 1) {
      const branch: number[] = [];
      for (let itemIndex = 0; itemIndex < 1_024; itemIndex += 1) branch[itemIndex] = itemIndex;
      many.branches[branchIndex] = branch;
    }
    expect(issueCodes(many)).toEqual(["capture-node-limit"]);
  });

  test("rejects direct, nested, and revoked Proxies without entering caller traps", () => {
    let trapCalls = 0;
    const hostile = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error("must not run");
      },
      ownKeys() {
        trapCalls += 1;
        throw new Error("must not run");
      },
      getOwnPropertyDescriptor() {
        trapCalls += 1;
        throw new Error("must not run");
      },
    });
    expect(() => validateContinuityBraidRelations(hostile)).not.toThrow();
    expect(issueCodes(hostile)).toEqual(["capture-proxy"]);

    const nested = documentedBraid();
    nested.hostile = hostile;
    expect(issueCodes(nested)).toEqual(["capture-proxy"]);

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() => validateContinuityBraidRelations(revoked.proxy)).not.toThrow();
    expect(issueCodes(revoked.proxy)).toEqual(["capture-proxy"]);
    expect(trapCalls).toBe(0);
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
