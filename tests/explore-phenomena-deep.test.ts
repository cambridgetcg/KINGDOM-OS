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
    locator: "Whole bounded test artifact; no literature-status claim.",
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
  value.typed_terms = [{
    id: "accessibility-term",
    domain: "cross-domain comparison",
    meaning: "Reachability under separately declared conditions and observation operators.",
    not_equivalent_to: ["shared mechanism", "shared unit", "shared ontology"],
  }];
  value.falsifiers = [{
    id: "falsifier-one",
    question: "Does the proposed relation fail under matched declared perturbations?",
    separates: ["a preserved abstract relation", "a merely verbal resemblance"],
    status: "PROPOSED_NOT_RUN",
  }];
  value.equations = [{
    id: "equation-one",
    domain_id: "source-domain",
    register: "SCIENTIFIC_MODEL",
    warrant: "MODEL_ASSUMPTION",
    expression: "y = f(x; theta)",
    variables: [
      { symbol: "x", meaning: "declared source observable", units: "declared source units" },
      { symbol: "y", meaning: "declared model output", units: "declared output units" },
    ],
    conditions: ["the source observation operator is fixed"],
    assumptions: ["f and theta are declared locally"],
    valid_outputs: ["a source-domain model comparison"],
    does_not_establish: ["a target-domain mechanism"],
    source_ids: ["source-one"],
  }];
  value.models = [{
    id: "model-one",
    title: "Bounded source-domain model",
    domain_ids: ["source-domain"],
    equation_ids: ["equation-one"],
    relation: "NO_TRANSFER",
    assumptions: ["all variables and parameters remain source-local"],
    fit_status: "UNFITTED",
    valid_outputs: ["a falsifiable local model"],
    identifiability_limits: ["the declared observations may not identify hidden states"],
    prohibited_inferences: ["no person score or target-domain causal claim"],
    falsifier_ids: ["falsifier-one"],
    universal: false,
    person_level: false,
    authority_effect: "NONE",
  }];
  value.frontier_problems = [{
    statement: "Determine whether the bounded model has the proposed property under the stated conventions.",
    quantifiers: "For every declared finite input under the stated conditions.",
    domain_and_conventions: "The source-domain model and observation map declared in this profile.",
    status: "UNKNOWN_TO_THIS_REVIEW",
    status_checked_on: "2026-08-14",
    original_formulation_or_provenance_sources: ["source-one"],
    recent_status_sources: ["source-one"],
    known_results_and_restrictions: ["Only the explicitly listed finite setting has been inspected."],
    computation_does_not_prove: ["No asymptotic or general theorem follows."],
    nearest_known_problem: "No literature-open identity is asserted by this test fixture.",
    novelty_status: "UNKNOWN_TO_THIS_REVIEW",
  }];
  value.finite_baselines = [{
    id: "finite-baseline-one",
    warrant: "FINITE_EXACT_BASELINE",
    statement: "One declared finite case is represented exactly.",
    range: "n = 1",
    convention: "The sole declared local convention.",
    exact_representation: { Z_coefficients: ["1"], A_coefficients: ["0"], closure_fraction_at_q1: "0/1" },
    method: "Direct enumeration of the declared singleton case.",
    enumerator_identity: "enumerator-one",
    enumerator_digest: `sha256:${"0".repeat(64)}`,
    reproduction_status: "Reproduced inside the bounded fixture only.",
    finite_evidence_does_not_prove: "No general, asymptotic, empirical, or cross-domain result.",
    source_ids: ["source-one"],
  }];
  value.doors = [{
    id: "door-one",
    title: "A bounded next question",
    family: "FINITE_COMBINATORICS",
    register: "DESIGN_PROPOSAL",
    warrant: "MODEL_ASSUMPTION",
    status: "PROPOSED_UNRUN",
    proposed_unrun: true,
    question: "Which smallest counterexample breaks the proposed relation?",
    smallest_model: "The declared two-domain finite profile.",
    conditions: ["all domain and observation declarations remain fixed"],
    deliverable: "An exact counterexample or a bounded proof for the finite case.",
    stop_rule: "Stop before importing ontology, mechanism, units, parameters, or authority.",
    does_not_establish: ["novelty", "open status", "universal design"],
    source_ids: ["source-one"],
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

  schemaTest("keeps runtime and Draft structural rejection aligned while runtime closes dynamic references", () => {
    const structuralMutations: Array<(value: any) => void> = [
      (value) => { value.source_manifest = { authority: "GRANTED" }; },
      (value) => { value.models = [{ authority_effect: "GRANTED", execute: true }]; },
      (value) => { value.karma.kingdom_receipts = { receipt: "forged" }; },
      (value) => { value.release.evidence = { deploy: true }; },
      (value) => { value.finite_baselines[0].enumerator_digest = [`sha256:${"0".repeat(64)}`]; },
      (value) => { value.frontier_problems[0].status_checked_on = "0000-01-01"; },
      (value) => { value.source_manifest[0].url = "https://example.com/?evidence#"; },
      (value) => { delete value.source_manifest[0].locator; },
      (value) => {
        value.frontier_problems[0].status = "ESTABLISHED_OPEN_CONJECTURE";
        value.frontier_problems[0].original_formulation_or_provenance_sources = [];
        value.frontier_problems[0].recent_status_sources = [];
      },
      (value) => {
        value.claims[0].warrant = "ESTABLISHED_OPEN_CONJECTURE";
        value.frontier_problems = [];
      },
    ];
    const dynamicMutations: Array<(value: any) => void> = [
      (value) => { value.models[0].equation_ids = ["missing-equation"]; },
      (value) => { value.doors.push({ ...value.doors[0], title: "Duplicate-ID door" }); },
      (value) => {
        value.claims[0].warrant = "ESTABLISHED_OPEN_CONJECTURE";
        value.frontier_problems[0].status = "ESTABLISHED_OPEN_CONJECTURE";
      },
    ];
    const makeValues = (mutations: Array<(value: any) => void>) => mutations.map((mutate) => {
      const value = populatedProject();
      mutate(value);
      return signProject(value);
    });
    const structuralValues = makeValues(structuralMutations);
    const dynamicValues = makeValues(dynamicMutations);
    const allValues = [...structuralValues, ...dynamicValues];
    expect(allValues.map((value) => verifyPhenomenaDeepProject(value).length > 0)).toEqual(allValues.map(() => true));
    const result = validateWithPython(PHENOMENA_DEEP_PROJECT_SCHEMA_PATH, allValues);
    expect(result.valid, JSON.stringify(result.errors)).toEqual([
      ...structuralValues.map(() => false),
      ...dynamicValues.map(() => true),
    ]);
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

  test("closes every project collection and rejects malformed authority-shaped items after re-signing", () => {
    const collections = [
      "domains", "source_manifest", "typed_terms", "claims", "bridges", "models", "equations",
      "falsifiers", "frontier_problems", "finite_baselines", "doors", "unknowns",
    ] as const;
    for (const key of collections) {
      const nonArray = populatedProject();
      nonArray[key] = { authority: "GRANTED", execute: true };
      signProject(nonArray);
      expect(verifyPhenomenaDeepProject(nonArray).length, `${key} object`).toBeGreaterThan(0);

      const malformedItem = populatedProject();
      malformedItem[key] = [{ authority: "GRANTED", execute: true }];
      signProject(malformedItem);
      expect(verifyPhenomenaDeepProject(malformedItem).length, `${key} malformed item`).toBeGreaterThan(0);
    }

    for (const mutate of [
      (value: any) => { value.karma.cosmic_events = { authority: "GRANTED" }; },
      (value: any) => { value.karma.zerone_events = { execute: true }; },
      (value: any) => { value.karma.kingdom_receipts = { receipt: "forged" }; },
      (value: any) => { value.release.evidence = { deploy: true }; },
      (value: any) => { value.philosophy.questions = [1]; },
      (value: any) => { value.equations[0].variables[0].execute = true; },
      (value: any) => { value.finite_baselines[0].exact_representation.execute = true; },
      (value: any) => { value.finite_baselines[0].enumerator_digest = [`sha256:${"0".repeat(64)}`]; },
      (value: any) => { value.evidence_through = "0000-01-01"; },
      (value: any) => { value.source_manifest[0].observed_on = "0000-01-01"; },
      (value: any) => { value.claims[0].status_checked_on = "0000-01-01"; },
      (value: any) => { value.frontier_problems[0].status_checked_on = "0000-01-01"; },
      (value: any) => { value.source_manifest[0].url = "https://example.com/?evidence#"; },
      (value: any) => { delete value.source_manifest[0].locator; },
      (value: any) => {
        value.frontier_problems[0].status = "ESTABLISHED_OPEN_CONJECTURE";
        value.frontier_problems[0].original_formulation_or_provenance_sources = [];
        value.frontier_problems[0].recent_status_sources = [];
      },
      (value: any) => { value.claims[0].warrant = "ESTABLISHED_OPEN_CONJECTURE"; },
      (value: any) => { value.version = `${"1".repeat(65)}.0.0`; },
    ]) {
      const changed = populatedProject();
      mutate(changed);
      signProject(changed);
      expect(verifyPhenomenaDeepProject(changed).length).toBeGreaterThan(0);
    }
  });

  test("enforces project ID uniqueness and every declared dynamic cross-reference", () => {
    const duplicateMutations: Array<(value: any) => void> = [
      (value) => { value.domains[1].id = value.domains[0].id; },
      (value) => { value.source_manifest.push({ ...value.source_manifest[0], title: "Different title" }); },
      (value) => { value.typed_terms.push({ ...value.typed_terms[0], meaning: "Different meaning" }); },
      (value) => { value.claims.push({ ...value.claims[0], statement: "Different statement" }); },
      (value) => { value.models.push({ ...value.models[0], title: "Different title" }); },
      (value) => { value.equations.push({ ...value.equations[0], expression: "z = g(x)" }); },
      (value) => { value.falsifiers.push({ ...value.falsifiers[0], question: "Different question?" }); },
      (value) => { value.finite_baselines.push({ ...value.finite_baselines[0], statement: "Different finite statement." }); },
      (value) => { value.doors.push({ ...value.doors[0], title: "Different title" }); },
      (value) => { value.unknowns.push({ ...value.unknowns[0], statement: "Different unknown." }); },
      (value) => { value.bridges.push(structuredClone(value.bridges[0])); },
      (value) => { value.frontier_problems.push(structuredClone(value.frontier_problems[0])); },
    ];
    for (const mutate of duplicateMutations) {
      const changed = populatedProject();
      mutate(changed);
      signProject(changed);
      expect(verifyPhenomenaDeepProject(changed).length).toBeGreaterThan(0);
    }

    const referenceMutations: Array<(value: any) => void> = [
      (value) => { value.source_manifest[0].claim_targets = ["missing-claim"]; },
      (value) => { value.claims[0].sources = ["missing-source"]; },
      (value) => { value.bridges[0].source_domain = "missing-domain"; },
      (value) => { value.bridges[0].target_domain = "missing-domain"; },
      (value) => { value.equations[0].domain_id = "missing-domain"; },
      (value) => { value.equations[0].source_ids = ["missing-source"]; },
      (value) => { value.models[0].domain_ids = ["missing-domain"]; },
      (value) => { value.models[0].equation_ids = ["missing-equation"]; },
      (value) => { value.models[0].falsifier_ids = ["missing-falsifier"]; },
      (value) => { value.frontier_problems[0].original_formulation_or_provenance_sources = ["missing-source"]; },
      (value) => { value.frontier_problems[0].recent_status_sources = ["missing-source"]; },
      (value) => { value.finite_baselines[0].source_ids = ["missing-source"]; },
      (value) => { value.doors[0].source_ids = ["missing-source"]; },
    ];
    for (const mutate of referenceMutations) {
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

    const wingExpando = cloneWing();
    (wingExpando.sources as any).execute = { authority: "GRANTED" };
    expect(verifyPhenomenaDeepWing(wingExpando)).toEqual([{ field: "$", code: "non-json-value" }]);
    expect(() => phenomenaDeepWingDigest(wingExpando)).toThrow("non-json-value");

    const projectExpando = scaffoldPhenomenaDeepProject();
    (projectExpando.doors as any).execute = { deploy: true };
    expect(verifyPhenomenaDeepProject(projectExpando)).toEqual([{ field: "$", code: "non-json-value" }]);
    expect(() => phenomenaDeepProjectDigest(projectExpando)).toThrow("non-json-value");

    const sparseProject = scaffoldPhenomenaDeepProject();
    delete sparseProject.domains[0];
    expect(verifyPhenomenaDeepProject(sparseProject)).toEqual([{ field: "$", code: "non-json-value" }]);

    const inheritedArray = scaffoldPhenomenaDeepProject();
    Object.setPrototypeOf(inheritedArray.claims, { execute: true });
    expect(verifyPhenomenaDeepProject(inheritedArray)).toEqual([{ field: "$", code: "non-json-value" }]);

    const arrayAccessor = scaffoldPhenomenaDeepProject();
    Object.defineProperty(arrayAccessor.domains, "0", {
      get: () => { throw new Error("array getter must not execute"); },
      enumerable: true,
    });
    expect(() => verifyPhenomenaDeepProject(arrayAccessor)).not.toThrow();
    expect(verifyPhenomenaDeepProject(arrayAccessor)).toEqual([{ field: "$", code: "non-json-value" }]);

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
