import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PHENOMENA_DEEP_PROJECT_PROTOCOL,
  PHENOMENA_DEEP_PROJECT_SCHEMA_ID,
  PHENOMENA_DEEP_PROJECT_SCHEMA_PATH,
  PHENOMENA_DEEP_WING_BYTE_SHA256,
  PHENOMENA_DEEP_WING_DIGEST,
  PHENOMENA_DEEP_WING_ID,
  PHENOMENA_DEEP_WING_PATH,
  PHENOMENA_DEEP_WING_PROTOCOL,
  PHENOMENA_DEEP_WING_SCHEMA_ID,
  PHENOMENA_DEEP_WING_SCHEMA_PATH,
  loadPhenomenaDeepProject,
  loadPhenomenaDeepWing,
  phenomenaDeepProjectDigest,
  phenomenaDeepPublicDiscovery,
  phenomenaDeepWingDigest,
  scaffoldPhenomenaDeepProject,
  verifyPhenomenaDeepProject,
  verifyPhenomenaDeepWing,
} from "../bin/explore-phenomena-deep.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "bin/explore-phenomena-deep.ts");
const parse = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const cloneWing = () => structuredClone(loadPhenomenaDeepWing());
const rawSha256 = (path: string) => `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;

function signWing(value: Record<string, any>): Record<string, any> {
  value.integrity.digest = phenomenaDeepWingDigest(value);
  return value;
}

function signProject(value: Record<string, any>): Record<string, any> {
  value.integrity.digest = phenomenaDeepProjectDigest(value);
  return value;
}

function populatedProject(): Record<string, any> {
  const value = scaffoldPhenomenaDeepProject();
  value.source_manifest = [{
    id: "source-one",
    title: "Bounded source",
    url: "https://example.com/bounded-source",
    observed_on: "2026-08-14",
    claim_targets: ["claim-one"],
    authority_note: "Evidence for one local claim only; no action authority is imported.",
  }];
  value.claims = [{
    claim_id: "claim-one",
    statement: "A source-domain observation is reported under declared conditions.",
    domain: "source-domain",
    register: "EMPIRICAL_OBSERVATION",
    warrant: "SOURCE_BOUND",
    scope_and_conditions: "Only the declared source, observation operator, and evidence horizon.",
    variables_and_units: ["x: declared source observable in declared source units"],
    sources: ["source-one"],
    status_checked_on: "2026-08-14",
    derivation_or_model: "Directly represented from the bounded source.",
    limitations: ["No target-domain mechanism follows."],
    falsifier: "An independent observation under the same conditions disagrees.",
    authority_effect: "NONE",
  }];
  value.bridges = [{
    source_domain: "source-domain",
    target_domain: "target-domain",
    relation: "LOSSY_CORRESPONDENCE",
    source_objects: ["source states"],
    target_objects: ["target states"],
    correspondence: "Only a named accessibility relation is proposed.",
    preserved_structure: ["condition-indexed accessibility"],
    broken_or_lost_structure: ["entities, units, and mechanisms remain local"],
    source_variables_and_units: ["x in declared source units"],
    target_variables_and_units: ["y in declared target units"],
    assumptions: ["both domains remain separately specified"],
    ontology_transfer: false,
    causal_transfer: false,
    parameter_transfer: false,
    unit_transfer: false,
    authority_transfer: false,
    falsifiers: ["matched perturbations do not preserve the proposed relation"],
  }];
  return signProject(value);
}

const PYTHON = process.env.PHENOMENA_DEEP_SCHEMA_PYTHON || "python3";
const pythonProbe = Bun.spawnSync({ cmd: [PYTHON, "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
const schemaTest = pythonProbe.exitCode === 0 ? test : test.skip;

function validateWithPython(schemaPath: string, values: unknown[]): { schema_ok: boolean; valid: boolean[]; errors: string[][] } {
  const script = [
    "import json,sys",
    "from jsonschema import Draft202012Validator,FormatChecker",
    "schema=json.load(open(sys.argv[1],encoding='utf-8'))",
    "Draft202012Validator.check_schema(schema)",
    "validator=Draft202012Validator(schema,format_checker=FormatChecker())",
    "values=json.load(sys.stdin)",
    "errors=[]",
    "for value in values:",
    "  current=[]",
    "  for error in sorted(validator.iter_errors(value),key=lambda e:list(e.absolute_path)):",
    "    current.append('/'.join(map(str,error.absolute_path))+': '+error.message)",
    "  errors.append(current)",
    "print(json.dumps({'schema_ok':True,'valid':[not current for current in errors],'errors':errors}))",
  ].join("\n");
  const result = Bun.spawnSync({
    cmd: [PYTHON, "-c", script, schemaPath],
    stdin: Buffer.from(JSON.stringify(values)),
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      ALL_PROXY: "http://127.0.0.1:9",
      NO_PROXY: "*",
    },
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
  return JSON.parse(result.stdout.toString());
}

describe("Exploration DEEP WING and inert project contract", () => {
  test("loads the exact record, semantic digest, raw pin, and machine discovery", () => {
    const wing = loadPhenomenaDeepWing();
    expect(wing.protocol).toBe(PHENOMENA_DEEP_WING_PROTOCOL);
    expect(wing.wing_id).toBe(PHENOMENA_DEEP_WING_ID);
    expect(wing.$schema).toBe(PHENOMENA_DEEP_WING_SCHEMA_ID);
    expect(wing.compiled_on).toBe("2026-08-14");
    expect(wing.evidence_through).toBe("2026-08-14");
    expect(phenomenaDeepWingDigest(wing)).toBe(PHENOMENA_DEEP_WING_DIGEST);
    expect(wing.integrity.digest).toBe(PHENOMENA_DEEP_WING_DIGEST);
    expect(rawSha256(PHENOMENA_DEEP_WING_PATH)).toBe(PHENOMENA_DEEP_WING_BYTE_SHA256);
    expect(verifyPhenomenaDeepWing(wing)).toEqual([]);

    expect(wing.source_audit.open_problem_requirements).toHaveLength(8);
    expect(wing.source_audit.failure_modes).toHaveLength(5);
    expect(wing.source_audit.open_problem_requirements).toContain(
      "exact section, page, theorem discussion, or locator where that source explicitly states the status",
    );
    expect(Object.keys(wing.claim_cards[0])).toHaveLength(13);
    expect(Object.keys(wing.abstraction_seams[0])).toHaveLength(17);
    expect(Object.keys(wing.math_doors[0])).toEqual([
      "id", "title", "family", "register", "warrant", "status", "proposed_unrun",
      "question", "smallest_model", "conditions", "deliverable", "stop_rule",
      "does_not_establish", "source_ids",
    ]);

    const discovery = phenomenaDeepPublicDiscovery(wing);
    expect(discovery.method).toEqual({
      wing: ["WITNESS", "ISOLATE", "NORMALIZE", "GENERATE"],
      deep: ["DECLARE", "ESTABLISH", "EXPRESS", "PROJECT"],
      workflow_only: true,
      manifested_nen_ability: false,
    });
    expect(discovery.counts).toEqual({
      registers: 8,
      warrants: 10,
      relations: 5,
      planes: 4,
      seams: 2,
      claims: 4,
      equations: 5,
      models: 2,
      math_doors: 8,
      finite_baselines: 1,
      seed_doors: 5,
      established_open_conjectures: 0,
      sources: 19,
      bindings: 9,
    });
    expect(discovery.integrity).toEqual({
      algorithm: "sha256-recursive-sorted-json-keys-v1",
      digest: PHENOMENA_DEEP_WING_DIGEST,
      byte_sha256: PHENOMENA_DEEP_WING_BYTE_SHA256,
    });
    expect(discovery.bindings.every((entry: any) => entry.authority_imported === false)).toBe(true);
    expect(discovery.boundary).toEqual(wing.boundaries);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("execute");
    expect(discovery).not.toHaveProperty("score");
  });

  test("publishes distinct, recursively closed schema identities without claiming digest recomputation", () => {
    const wingSchema = parse(PHENOMENA_DEEP_WING_SCHEMA_PATH);
    const projectSchema = parse(PHENOMENA_DEEP_PROJECT_SCHEMA_PATH);
    expect(wingSchema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(wingSchema.$id).toBe(PHENOMENA_DEEP_WING_SCHEMA_ID);
    expect(projectSchema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(projectSchema.$id).toBe(PHENOMENA_DEEP_PROJECT_SCHEMA_ID);
    expect(wingSchema.$comment).toContain("cannot recompute");
    expect(wingSchema.$comment).toContain("cross-collection references");
    expect(projectSchema.$comment).toContain("cannot recompute");
    expect(projectSchema.$comment).toContain("not a source fetcher, solver");
    expect(wingSchema.$defs.integrity.properties.digest.const).toBe(PHENOMENA_DEEP_WING_DIGEST);
    expect(wingSchema.$defs.claimCard.required).toHaveLength(13);
    expect(wingSchema.$defs.bridge.required).toHaveLength(17);
    expect(wingSchema.$defs.mathDoor.required).toHaveLength(14);
    expect(projectSchema.$defs.claimCard.required).toHaveLength(13);
    expect(projectSchema.$defs.bridge.required).toHaveLength(17);
    expect(projectSchema.$defs.mathDoor.required).toHaveLength(14);
    expect(wingSchema.properties.epistemic_registers).toMatchObject({ minItems: 23, maxItems: 23 });
    expect(wingSchema.properties.source_audit.$ref).toBe("#/$defs/sourceAudit");
    expect(wingSchema.$defs.sourceAudit.properties.open_problem_requirements).toMatchObject({ minItems: 8, maxItems: 8 });
    expect(wingSchema.$defs.sourceAudit.properties.failure_modes).toMatchObject({ minItems: 5, maxItems: 5 });

    const visit = (value: unknown, path = "$", seen = new Set<unknown>()) => {
      if (value === null || typeof value !== "object" || seen.has(value)) return;
      seen.add(value);
      const record = value as Record<string, any>;
      if (record.type === "object") expect(record.additionalProperties, path).toBe(false);
      for (const [key, child] of Object.entries(record)) visit(child, `${path}.${key}`, seen);
    };
    visit(wingSchema);
    visit(projectSchema);
  });

  schemaTest("executes Draft 2020-12 validation against the record and scaffold", () => {
    const wingResult = validateWithPython(PHENOMENA_DEEP_WING_SCHEMA_PATH, [parse(PHENOMENA_DEEP_WING_PATH)]);
    expect(wingResult.schema_ok).toBe(true);
    expect(wingResult.valid, JSON.stringify(wingResult.errors)).toEqual([true]);
    const projectResult = validateWithPython(PHENOMENA_DEEP_PROJECT_SCHEMA_PATH, [scaffoldPhenomenaDeepProject(), populatedProject()]);
    expect(projectResult.schema_ok).toBe(true);
    expect(projectResult.valid, JSON.stringify(projectResult.errors)).toEqual([true, true]);
  });

  schemaTest("schemas reject unknown fields, transfer or authority flips, malformed cards, and each other", () => {
    const wingValues: any[] = [];
    const wingMutation = (mutate: (value: any) => void) => { const value = cloneWing(); mutate(value); wingValues.push(value); };
    wingMutation((value) => { value.extra = true; });
    wingMutation((value) => { value.abstraction_seams[0].causal_transfer = true; });
    wingMutation((value) => { value.claim_cards[0].execute = true; });
    wingMutation((value) => { delete value.math_doors[0].smallest_model; });
    wingMutation((value) => { value.source_audit.open_problem_requirements.pop(); });
    wingMutation((value) => { value.boundaries.automatic_action = true; });
    wingMutation((value) => { value.integrity.digest = `sha256:${"0".repeat(64)}`; });
    const wingResult = validateWithPython(PHENOMENA_DEEP_WING_SCHEMA_PATH, wingValues);
    expect(wingResult.valid).toEqual(wingValues.map(() => false));

    const projectValues: any[] = [];
    const projectMutation = (mutate: (value: any) => void) => { const value = scaffoldPhenomenaDeepProject(); mutate(value); projectValues.push(value); };
    projectMutation((value) => { value.extra = true; });
    projectMutation((value) => { value.domains[0].execute = true; });
    projectMutation((value) => { value.authority.deploy = true; });
    projectMutation((value) => { value.karma.cosmic_events = [{}]; });
    projectMutation((value) => { value.rights.valid_exits.pop(); });
    projectMutation((value) => { value.boundaries.profile_inert = false; });
    const projectResult = validateWithPython(PHENOMENA_DEEP_PROJECT_SCHEMA_PATH, projectValues);
    expect(projectResult.valid).toEqual(projectValues.map(() => false));
    expect(validateWithPython(PHENOMENA_DEEP_WING_SCHEMA_PATH, [scaffoldPhenomenaDeepProject()]).valid).toEqual([false]);
    expect(validateWithPython(PHENOMENA_DEEP_PROJECT_SCHEMA_PATH, [cloneWing()]).valid).toEqual([false]);
  });

  test("scaffolds and reloads a valid inert project without producing effects", () => {
    const scaffold = scaffoldPhenomenaDeepProject();
    expect(scaffold.protocol).toBe(PHENOMENA_DEEP_PROJECT_PROTOCOL);
    expect(scaffold.$schema).toBe(PHENOMENA_DEEP_PROJECT_SCHEMA_ID);
    expect(scaffold.mode).toBe("ANALYZE_ONLY");
    expect(scaffold.domains).toHaveLength(2);
    expect(scaffold.integrity.digest).toBe(phenomenaDeepProjectDigest(scaffold));
    expect(verifyPhenomenaDeepProject(scaffold)).toEqual([]);
    expect(scaffold.karma).toMatchObject({
      cosmic_events: [],
      zerone_events: [],
      kingdom_receipts: [],
      adapter_exists: false,
      score: null,
      authority_effect: "NONE",
    });
    expect(Object.values(scaffold.authority).every((entry) => entry === false)).toBe(true);
    expect(scaffold.boundaries).toMatchObject({ read_only: true, profile_inert: true, writes_karma: false, deployment_authority: false, automatic_action: false });

    const temporary = mkdtempSync(join(tmpdir(), "kingdom-phenomena-project-"));
    const path = join(temporary, "project.json");
    writeFileSync(path, `${JSON.stringify(scaffold, null, 2)}\n`);
    expect(loadPhenomenaDeepProject(path)).toEqual(scaffold);
  });

  test("rejects unknown fields and dangling cross-references after attacker re-signing", () => {
    const mutations: Array<(value: any) => void> = [
      (value) => { value.extra = true; },
      (value) => { value.scope.execute = true; },
      (value) => { value.planes[0].source_ids = ["missing-source"]; },
      (value) => { value.abstraction_seams[0].source_domain = "missing-plane"; },
      (value) => { value.abstraction_seams[0].falsifiers = ["missing-falsifier"]; },
      (value) => { value.claim_cards[0].sources = ["missing-source"]; },
      (value) => { value.equations[0].plane_id = "missing-plane"; },
      (value) => { value.equations[0].source_ids = ["missing-source"]; },
      (value) => { value.model_cards[0].equation_ids = ["missing-equation"]; },
      (value) => { value.model_cards[0].falsifier_ids = ["missing-falsifier"]; },
      (value) => { value.seed_doors[0].target_plane_ids = ["missing-plane"]; },
      (value) => { value.sources[1].id = value.sources[0].id; },
    ];
    for (const mutate of mutations) {
      const changed = cloneWing();
      mutate(changed);
      signWing(changed);
      const issues = verifyPhenomenaDeepWing(changed);
      expect(issues.some((issue) => issue.field !== "$.integrity.digest"), JSON.stringify(issues)).toBe(true);
    }

    const projectMutations: Array<(value: any) => void> = [
      (value) => { value.extra = true; },
      (value) => { value.domains[0].execute = true; },
      (value) => { value.domains[1].id = value.domains[0].id; },
      (value) => { value.bridges[0].source_domain = "missing-domain"; },
      (value) => { value.claims[0].sources = ["missing-source"]; },
    ];
    for (const mutate of projectMutations) {
      const changed = populatedProject();
      mutate(changed);
      signProject(changed);
      expect(verifyPhenomenaDeepProject(changed).length).toBeGreaterThan(0);
    }
  });

  test("rejects mechanism-transfer, KARMA, rights, and authority escalation after re-signing", () => {
    const wingMutations: Array<(value: any) => void> = [
      ...["ontology_transfer", "causal_transfer", "parameter_transfer", "unit_transfer", "authority_transfer"].map(
        (key) => (value: any) => { value.abstraction_seams[0][key] = true; },
      ),
      (value) => { value.model_cards[0].universal = true; },
      (value) => { value.model_cards[0].person_level = true; },
      (value) => { value.karma.adapter_exists = true; },
      (value) => { value.karma.lanes[0].events = [{ execute: true }]; },
      (value) => { value.rights.valid_exits.pop(); },
      (value) => { value.rights.penalty = true; },
      (value) => { value.bindings[0].authority_imported = true; },
      (value) => { value.boundaries.shared_mechanism_established = true; },
      (value) => { value.boundaries.writes_karma = true; },
      (value) => { value.boundaries.automatic_action = true; },
    ];
    for (const mutate of wingMutations) {
      const changed = cloneWing();
      mutate(changed);
      signWing(changed);
      const issues = verifyPhenomenaDeepWing(changed);
      expect(issues.some((issue) => issue.field !== "$.integrity.digest"), JSON.stringify(issues)).toBe(true);
    }

    const projectMutations: Array<(value: any) => void> = [
      ...["ontology_transfer", "causal_transfer", "parameter_transfer", "unit_transfer", "authority_transfer"].map(
        (key) => (value: any) => { value.bridges[0][key] = true; },
      ),
      (value) => { value.karma.adapter_exists = true; },
      (value) => { value.karma.kingdom_receipts = [{ receipt: true }]; },
      (value) => { value.rights.valid_exits.pop(); },
      (value) => { value.rights.penalty = true; },
      (value) => { value.authority.deploy = true; },
      (value) => { value.authority.karma_write = true; },
      (value) => { value.boundaries.profile_inert = false; },
      (value) => { value.boundaries.automatic_action = true; },
    ];
    for (const mutate of projectMutations) {
      const changed = populatedProject();
      mutate(changed);
      signProject(changed);
      expect(verifyPhenomenaDeepProject(changed).length).toBeGreaterThan(0);
    }
  });

  test("distinguishes immutable record self-signing from legitimate local project signing", () => {
    const changedWing = cloneWing();
    changedWing.scope.purpose = "Attacker-authored replacement purpose.";
    changedWing.integrity.digest = phenomenaDeepWingDigest(changedWing);
    expect(changedWing.integrity.digest).not.toBe(PHENOMENA_DEEP_WING_DIGEST);
    expect(verifyPhenomenaDeepWing(changedWing)).toContainEqual({ field: "$.integrity.digest", code: "digest-mismatch" });

    const changedProject = scaffoldPhenomenaDeepProject();
    changedProject.title = "A different bounded local inquiry";
    changedProject.question = "Which exact relation survives this separately declared comparison?";
    signProject(changedProject);
    expect(verifyPhenomenaDeepProject(changedProject)).toEqual([]);
  });

  test("strictly refuses duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const temporary = mkdtempSync(join(tmpdir(), "kingdom-phenomena-strict-"));
    const raw = readFileSync(PHENOMENA_DEEP_WING_PATH, "utf8");
    const duplicate = join(temporary, "duplicate.json");
    writeFileSync(duplicate, raw.replace('{\n  "$schema"', '{\n  "protocol": "collision",\n  "$schema"'));
    expect(() => loadPhenomenaDeepWing(duplicate)).toThrow(/duplicate/i);

    const invalidUtf8 = join(temporary, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]));
    expect(() => loadPhenomenaDeepWing(invalidUtf8)).toThrow(/UTF-8/i);

    const symlink = join(temporary, "wing-link.json");
    symlinkSync(PHENOMENA_DEEP_WING_PATH, symlink);
    expect(() => loadPhenomenaDeepWing(symlink)).toThrow(/non-symlink/);

    const oversized = join(temporary, "oversized.json");
    writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));
    expect(() => loadPhenomenaDeepWing(oversized)).toThrow("exceeds 1048576 bytes");
  });

  test("rejects non-JSON inherited containers without invoking accessors", () => {
    const inherited = cloneWing();
    Object.setPrototypeOf(inherited.scope, { execute: true });
    expect(verifyPhenomenaDeepWing(inherited)).toEqual([{ field: "$", code: "non-json-value" }]);

    const accessor = cloneWing();
    Object.defineProperty(accessor.scope, "purpose", {
      get: () => { throw new Error("getter must not execute"); },
      enumerable: true,
    });
    expect(() => verifyPhenomenaDeepWing(accessor)).not.toThrow();
    expect(verifyPhenomenaDeepWing(accessor)).toEqual([{ field: "$", code: "non-json-value" }]);

  });

  test("CLI is CWD-independent, network-free, and rejects surplus or inherited commands", () => {
    const temporary = mkdtempSync(join(tmpdir(), "kingdom-phenomena-cli-"));
    const projectPath = join(temporary, "project.json");
    writeFileSync(projectPath, `${JSON.stringify(scaffoldPhenomenaDeepProject(), null, 2)}\n`);
    const env = {
      ...process.env,
      HTTP_PROXY: "http://127.0.0.1:1",
      HTTPS_PROXY: "http://127.0.0.1:1",
      ALL_PROXY: "http://127.0.0.1:1",
      NO_PROXY: "*",
    };
    const run = (args: string[]) => Bun.spawnSync({
      cmd: ["bun", CLI, ...args],
      cwd: temporary,
      env,
      stdout: "pipe",
      stderr: "pipe",
    });

    const verify = run(["verify", "--json"]);
    expect(verify.exitCode, verify.stderr.toString()).toBe(0);
    expect(JSON.parse(verify.stdout.toString())).toMatchObject({
      valid: true,
      protocol: PHENOMENA_DEEP_WING_PROTOCOL,
      wing_id: PHENOMENA_DEEP_WING_ID,
      digest: PHENOMENA_DEEP_WING_DIGEST,
      byte_sha256: PHENOMENA_DEEP_WING_BYTE_SHA256,
      issues: [],
    });

    const scaffold = run(["scaffold", "--json"]);
    expect(scaffold.exitCode, scaffold.stderr.toString()).toBe(0);
    expect(JSON.parse(scaffold.stdout.toString())).toEqual(scaffoldPhenomenaDeepProject());
    const verifyProject = run(["verify-project", projectPath, "--json"]);
    expect(verifyProject.exitCode, verifyProject.stderr.toString()).toBe(0);
    expect(JSON.parse(verifyProject.stdout.toString())).toMatchObject({ valid: true, protocol: PHENOMENA_DEEP_PROJECT_PROTOCOL, issues: [] });

    for (const args of [["constructor"], ["toString"], ["__proto__"], ["hasOwnProperty"], ["scaffold", "surplus", "--json"]]) {
      expect(run(args).exitCode, args.join(" ")).toBe(2);
    }
    for (const args of [["verify", "surplus", "--json"], ["verify-project", "--json"], ["verify-project", projectPath, "surplus", "--json"]]) {
      expect(run(args).exitCode, args.join(" ")).toBe(1);
    }
    expect(readdirSync(temporary).sort()).toEqual(["project.json"]);
  });
});
