import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as runtime from "../bin/is-sustainability-direction.ts";
import {
  IS_SUSTAINABILITY_DIRECTION_ATLAS_ID,
  IS_SUSTAINABILITY_DIRECTION_GUIDE_PATH,
  IS_SUSTAINABILITY_DIRECTION_LIMITS,
  IS_SUSTAINABILITY_DIRECTION_PROTOCOL,
  IS_SUSTAINABILITY_DIRECTION_RECORD_PATH,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
  IS_SUSTAINABILITY_DIRECTION_SCHEMA_ID,
  IS_SUSTAINABILITY_DIRECTION_SCHEMA_PATH,
  IS_SUSTAINABILITY_DIRECTION_UNSEALED_SHA256,
  REVIEWED_GUIDE_RAW_SHA256,
  REVIEWED_RECORD_RAW_SHA256,
  REVIEWED_SCHEMA_RAW_SHA256,
  isSustainabilityDirectionDigest,
  isSustainabilityDirectionPublicDiscovery,
  isSustainabilityDirectionShapeMetrics,
  loadIsSustainabilityDirectionAtlas,
  loadReviewedIsSustainabilityDirectionAtlas,
  readIsSustainabilityDirectionAtlas,
  runIsSustainabilityDirectionReleaseSchemaValidation,
  validateIsSustainabilityDirectionAtlas,
  validateIsSustainabilityDirectionSchemaClosure,
} from "../bin/is-sustainability-direction.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BIN = join(ROOT, "bin/is-sustainability-direction.ts");
const KINGDOM = join(ROOT, "kingdom");
const ZERO = `sha256:${"0".repeat(64)}`;
const REVIEWED_SEMANTIC = "sha256:b415203eb248221544ae160233fcd75d7a58084b76028d3e27f35a6b036891b5";
const REVIEWED_RECORD_RAW = "sha256:19d70dfa187366bb10cc1bdbbc6a558e82f3c9057e21872aa593f4d960ac77c3";
const REVIEWED_SCHEMA_RAW = "sha256:314a92b146c0c99c71ee5bd26f037deaec91fb4b9b157e0654a569675e928f8d";
const REVIEWED_GUIDE_RAW = "sha256:8614020ed497d6627f7b503a883ac1bfa86d2609a97794ac33fe465e01868405";

function atlas(): Record<string, any> {
  return JSON.parse(readFileSync(IS_SUSTAINABILITY_DIRECTION_RECORD_PATH, "utf8"));
}

function schema(): Record<string, any> {
  return JSON.parse(readFileSync(IS_SUSTAINABILITY_DIRECTION_SCHEMA_PATH, "utf8"));
}

function issueCodes(value: unknown): string[] {
  return validateIsSustainabilityDirectionAtlas(value, {
    allowUnsealed: true,
    verifyPredecessors: false,
  }).map(({ code }) => code);
}

function fullyResigned(mutator: (value: Record<string, any>) => void) {
  const value = atlas();
  mutator(value);
  value.state = "static-reviewed-interpretive-design-companion";
  value.integrity.review_state = "REVIEWED";
  value.integrity.digest = ZERO;
  value.integrity.reviewed_digest = ZERO;
  const selfDerived = isSustainabilityDirectionDigest(value);
  value.integrity.digest = selfDerived;
  value.integrity.reviewed_digest = selfDerived;
  return validateIsSustainabilityDirectionAtlas(value, {
    allowUnsealed: true,
    verifyPredecessors: false,
  });
}

function mutateFirstSemanticLeaf(value: unknown): void {
  if (!value || typeof value !== "object") throw new Error("semantic object required");
  const stack: any[] = [value];
  while (stack.length) {
    const current = stack.pop();
    if (Array.isArray(current)) {
      for (let index = current.length - 1; index >= 0; index -= 1) {
        if (typeof current[index] === "string" && current[index].length > 20) {
          current[index] = `${current[index]}!`;
          return;
        }
        if (current[index] && typeof current[index] === "object") stack.push(current[index]);
      }
      continue;
    }
    for (const key of Object.keys(current).reverse()) {
      if (typeof current[key] === "string" && current[key].length > 20) {
        current[key] = `${current[key]}!`;
        return;
      }
      if (current[key] && typeof current[key] === "object") stack.push(current[key]);
    }
  }
  const booleanKey = Object.keys(value).find((key) => typeof (value as any)[key] === "boolean");
  if (!booleanKey) throw new Error("mutable semantic leaf required");
  (value as any)[booleanKey] = !(value as any)[booleanKey];
}

function sha256(path: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

describe("IS, Sustainability & Direction Atlas identity and boundaries", () => {
  test("loads the exact independently reviewed, non-amending, non-operative artifact", () => {
    const value = loadIsSustainabilityDirectionAtlas();
    expect(value).toMatchObject({
      $schema: IS_SUSTAINABILITY_DIRECTION_SCHEMA_ID,
      protocol: IS_SUSTAINABILITY_DIRECTION_PROTOCOL,
      atlas_id: IS_SUSTAINABILITY_DIRECTION_ATLAS_ID,
      title: "IS, Sustainability & Direction Atlas",
      state: "static-reviewed-interpretive-design-companion",
      status: {
        foundation_amendment: false,
        conformance_claim: false,
        authority_imported: false,
        runtime_or_effect: false,
      },
    });
    expect(IS_SUSTAINABILITY_DIRECTION_UNSEALED_SHA256).toBe(ZERO);
    expect(IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256).toBe(REVIEWED_SEMANTIC);
    expect(IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256).toBe(REVIEWED_RECORD_RAW);
    expect(IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256).toBe(REVIEWED_SCHEMA_RAW);
    expect(IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256).toBe(REVIEWED_GUIDE_RAW);
    expect(REVIEWED_RECORD_RAW_SHA256).toBe(REVIEWED_RECORD_RAW);
    expect(REVIEWED_SCHEMA_RAW_SHA256).toBe(REVIEWED_SCHEMA_RAW);
    expect(REVIEWED_GUIDE_RAW_SHA256).toBe(REVIEWED_GUIDE_RAW);
    expect(sha256(IS_SUSTAINABILITY_DIRECTION_RECORD_PATH)).toBe(REVIEWED_RECORD_RAW);
    expect(sha256(IS_SUSTAINABILITY_DIRECTION_SCHEMA_PATH)).toBe(REVIEWED_SCHEMA_RAW);
    expect(sha256(IS_SUSTAINABILITY_DIRECTION_GUIDE_PATH)).toBe(REVIEWED_GUIDE_RAW);
    expect(value.integrity).toMatchObject({
      digest: REVIEWED_SEMANTIC,
      reviewed_digest: REVIEWED_SEMANTIC,
      review_state: "REVIEWED",
    });
    expect(validateIsSustainabilityDirectionAtlas(value, {
      allowUnsealed: true,
      verifyPredecessors: true,
    })).toEqual([]);
    expect(validateIsSustainabilityDirectionAtlas(value)).toEqual([]);
    expect(loadReviewedIsSustainabilityDirectionAtlas()).toEqual(value);
    expect(isSustainabilityDirectionPublicDiscovery()).toMatchObject({
      integrity_status: "REVIEWED",
      semantic_digest: REVIEWED_SEMANTIC,
      reviewed_digest: REVIEWED_SEMANTIC,
      foundation_amendment: false,
      runtime_or_effect: false,
    });
    expect((runtime as any).simulateIsSustainabilityDirectionSeal).toBeUndefined();
  });

  test("has exact closed families and no live verdict", () => {
    const value = atlas();
    expect(value.referents.map((item: any) => item.kind)).toEqual([
      "SOURCE_ARTIFACT", "OPERATING_PRACTICE", "VOLUNTARY_RELATION",
      "INSTITUTIONAL_ARRANGEMENT", "ASPIRATIONAL_DIRECTION", "OBSERVED_EFFECT",
      "VERSIONED_LINEAGE",
    ]);
    expect(value.sustainability_relations).toHaveLength(7);
    expect(value.sustainability_relations.every((item: any) =>
      item.status === "NOT_EVALUATED" && item.statement_kind === "EXPECTATION"
    )).toBe(true);
    expect(value.is_types).toHaveLength(10);
    expect(value.is_types[5]).toMatchObject({
      id: "truth-in-model",
      illustrative_statement_kinds: ["CONSEQUENCE", "INTERPRETATION"],
    });
    expect(value.statement_kind_contract.is_type_examples_are_non_exhaustive).toBe(true);
    expect(value.direction_taxonomy).toHaveLength(10);
    expect(value.feedback_contract.type_registry).toHaveLength(6);
    expect(value.mathematical_core.models).toHaveLength(7);
    expect(value.profile_model.dimensions).toHaveLength(12);
    expect(value.temporal_capacities).toHaveLength(9);
    expect(value.counterexamples).toHaveLength(8);
    expect(value.concept_catalog).toHaveLength(18);
    expect(value.edge_registry).toHaveLength(28);
    expect(value.source_registry).toHaveLength(15);
    expect(value.predecessor_bindings).toHaveLength(6);
  });

  test("keeps feedback evidence lanes and update targets non-convertible", () => {
    const value = atlas();
    expect(Object.fromEntries(value.feedback_contract.type_registry.map((item: any) =>
      [item.id, item.allowed_update_targets]
    ))).toEqual({
      CONTROL_RETURN_SIGNAL: ["MODEL", "PROPOSAL"],
      RL_REWARD_SIGNAL: ["LEARNER_STATE"],
      BEHAVIORAL_REINFORCER_CANDIDATE: ["RECORD", "MODEL"],
      AFFECTED_PARTY_INPUT: ["RECORD", "BELIEF", "PROPOSAL"],
      MONITORING_OBSERVATION: ["RECORD", "MODEL"],
      CORRECTION_OR_FALSIFIER: ["RECORD", "BELIEF", "MODEL", "PROPOSAL"],
    });
    expect(value.standard_isness_i6_mapping).toMatchObject({
      relationship: "EXPLICIT_TYPED_MAPPING_NOT_SUPERSESSION",
      freedom_meanings_reused: true,
      second_feedback_ontology: false,
      replacement_or_amendment: false,
    });
    expect(value.standard_isness_i6_mapping.target_mapping.find((item: any) =>
      item.source_target === "CONTEXT"
    )).toMatchObject({ atlas_target: "OMITTED", relation: "OPEN_DELTA_NOT_EQUIVALENT" });
  });

  test("states robust information-compatible mathematics without importing K or stationarity", () => {
    const models = Object.fromEntries(atlas().mathematical_core.models.map((item: any) => [item.id, item]));
    expect(models["state-and-partial-observation"].expression)
      .toContain("I_t=sigma(y_{0:t},u_{0:t-1})");
    expect(models["state-and-partial-observation"].expression)
      .toContain("xi_s=(w_s,nu_{s+1}) in Xi_s for s>=t");
    expect(models["robust-finite-horizon-viability-kernel"].expression)
      .toContain("Π_{s=0}^{H-1} Xi_s");
    expect(models["robust-finite-horizon-viability-kernel"].expression)
      .toContain("u_s=pi_s(I_s) before xi_s");
    expect(models["present-viable-action-key-set"].expression)
      .toContain("for all s in {t,...,t+H}, x_s in K");
    expect(models["reach-avoid-safe-terminal-handoff"].expression)
      .toContain("one stopping functional tau adapted to post-observation I_s");
    expect(models["barrier-constrained-direction"].expression)
      .toContain("argmin_{u in U(x)}");
    expect(models["barrier-constrained-direction"].expression)
      .toEndWith("for every x in D");
    expect(models["barrier-constrained-direction"].assumptions).toContain(
      "for every relevant x in D, U(x) and the barrier inequality are jointly feasible",
    );
    expect(models["barrier-constrained-direction"].assumptions).toContain(
      "the optimizer or declared selection k(x) is a locally Lipschitz feedback satisfying k(x) in U(x) and the barrier inequality throughout D",
    );
    expect(models["barrier-constrained-direction"].assumptions).toContain(
      "closed-loop solutions under k exist on the declared interval and remain in D",
    );
    for (const conceptId of ["viability-kernel", "key-set", "reach-avoid-handoff"]) {
      const concept = atlas().concept_catalog.find((item: any) => item.id === conceptId);
      expect(concept.definition).toContain("xi_s=(w_s,nu_{s+1})");
    }
    expect(atlas().edge_registry.find((item: any) => item.id === "edge-01").support)
      .toContain("xi_s=(w_s,nu_{s+1})");
    expect(atlas().mathematical_core.constraint_set_rule).toStartWith("K is declared");
  });
});

describe("semantic mutation firewalls", () => {
  const pinnedSections = [
    "status", "scope", "epistemic_registers", "statement_kind_contract", "is_types",
    "being_boundary", "referents", "sustainability_relations", "sustainability_contract",
    "direction_taxonomy", "direction_firewall", "feedback_contract", "mathematical_core",
    "profile_model", "temporal_capacities", "rights_invariant", "ecology_intergenerational",
    "philosophy_lenses", "counterexamples", "concept_catalog", "edge_registry",
    "open_questions", "isness_protocol_collision", "standard_isness_document_pin", "non_grants",
  ] as const;

  for (const section of pinnedSections) {
    test(`rejects a fully re-signed ${section} inversion`, () => {
      const issues = fullyResigned((value) => mutateFirstSemanticLeaf(value[section]));
      expect(issues.map(({ code }) => code)).toContain(
        `${section.replaceAll("_", "-")}-semantic-contract-mismatch`,
      );
    });
  }

  test("pins thesis, design heart, I6, I8, relation extensions, sources and predecessors", () => {
    const cases: Array<[(value: any) => void, string]> = [
      [(value) => { value.thesis.text = `${value.thesis.text}!`; }, "normative-thesis-contract-mismatch"],
      [(value) => { value.design_commitments[1].text = `${value.design_commitments[1].text}!`; }, "design-heart-inversion"],
      [(value) => { value.standard_isness_i6_mapping.second_feedback_ontology = true; }, "standard-isness-i6-mapping-mismatch"],
      [(value) => { value.standard_isness_i8_mapping.unmapped_or_open_deltas.pop(); }, "standard-isness-i8-mapping-mismatch"],
      [(value) => { value.relation_extension_contracts[0].assessment_aim.authority_claimed = true; }, "relation-extension-contract-mismatch"],
      [(value) => { value.source_registry[0].limit = `${value.source_registry[0].limit}!`; }, "source-registry-contract-mismatch"],
      [(value) => { value.predecessor_bindings[5].branch_status = "MAIN"; }, "predecessor-binding-contract-mismatch"],
    ];
    for (const [mutate, code] of cases) {
      expect(fullyResigned(mutate).map((issue) => issue.code)).toContain(code);
    }
  });

  test("rejects reference, register, update-target, quantifier, and source-scope drift", () => {
    const cases: Array<[(value: any) => void, string]> = [
      [(value) => { value.edge_registry[5].evidence_refs[0] = "pred-isness"; }, "evidence-reference-dangling"],
      [(value) => { value.counterexamples[4].register = "REPORTED_EMPIRICAL_CLAIM"; }, "counterexample-register-or-contract-mismatch"],
      [(value) => { value.feedback_contract.type_registry[1].allowed_update_targets = ["MODEL"]; }, "feedback-type-target-mismatch"],
      [(value) => { value.mathematical_core.models[1].expression = value.mathematical_core.models[1].expression.replace("exists one policy pi with u_s=pi_s(I_s) before xi_s, for all x_0", "for all x_0, exists one policy pi with u_s=pi_s(I_s) before xi_s"); }, "mathematical-expression-mismatch"],
      [(value) => { value.profile_model.dimensions[9].evidence_refs = ["src-meadows"]; }, "succession-handoff-source-scope-inversion"],
      [(value) => { value.sustainability_contract.cross_kind_implication = true; }, "sustainability-contract-inversion"],
    ];
    for (const [mutate, code] of cases) expect(fullyResigned(mutate).map((item) => item.code)).toContain(code);
  });
});

describe("total hostile-input and resource-bound handling", () => {
  test("returns field-coded issues for malformed, cyclic, accessor and exotic values", () => {
    const cyclic: any = {};
    cyclic.self = cyclic;
    const accessor: any = {};
    Object.defineProperty(accessor, "hidden", { enumerable: true, get() { throw new Error("no"); } });
    const nonEnumerable: any = {};
    Object.defineProperty(nonEnumerable, "hidden", { enumerable: false, value: "x" });
    const customArray: any[] = [];
    Object.setPrototypeOf(customArray, Object.create(Array.prototype));
    const sparse = new Array(2);
    sparse[1] = null;
    const symbolObject: any = {};
    symbolObject[Symbol("x")] = true;
    const cases: Array<[unknown, string]> = [
      [undefined, "non-json-value"], [1n, "non-json-value"], [Number.NaN, "non-finite-number"],
      [cyclic, "cyclic-or-shared-reference"], [accessor, "accessor-property-refused"],
      [nonEnumerable, "non-enumerable-property-refused"], [customArray, "non-json-array-prototype"],
      [sparse, "sparse-or-extra-array-property-refused"], [symbolObject, "symbol-key-refused"],
    ];
    for (const [value, code] of cases) {
      expect(issueCodes(value)).toContain(code);
      expect(() => isSustainabilityDirectionShapeMetrics(value)).toThrow();
    }
  });

  test("computes public byte metrics itself and enforces modest measured headroom", () => {
    const value = atlas();
    const metrics = isSustainabilityDirectionShapeMetrics(value);
    const rawBytes = statSync(IS_SUSTAINABILITY_DIRECTION_RECORD_PATH).size;
    expect((isSustainabilityDirectionShapeMetrics as any)(value, 0).bytes).toBe(metrics.bytes);
    expect(metrics).toEqual({
      bytes: expect.any(Number), json_nodes: expect.any(Number), total_string_units: expect.any(Number),
      max_string_units: expect.any(Number), max_array_fanout: expect.any(Number),
      max_object_fanout: expect.any(Number), max_depth: expect.any(Number),
    });
    expect(IS_SUSTAINABILITY_DIRECTION_LIMITS.bytes / rawBytes).toBeGreaterThanOrEqual(1.24);
    for (const key of ["json_nodes", "total_string_units", "max_string_units", "max_array_fanout", "max_object_fanout"] as const) {
      expect(IS_SUSTAINABILITY_DIRECTION_LIMITS[key] / metrics[key], key).toBeGreaterThanOrEqual(1.24);
      expect(IS_SUSTAINABILITY_DIRECTION_LIMITS[key] / metrics[key], key).toBeLessThanOrEqual(1.30);
    }
    expect(metrics.max_depth).toBeLessThanOrEqual(IS_SUSTAINABILITY_DIRECTION_LIMITS.max_depth);
    expect(value.resource_budget).toEqual(IS_SUSTAINABILITY_DIRECTION_LIMITS);
  });

  test("enforces near-limit and one-over string, array, object, depth, node and total-string budgets", () => {
    expect(isSustainabilityDirectionShapeMetrics("x".repeat(675)).max_string_units).toBe(675);
    expect(() => isSustainabilityDirectionShapeMetrics("x".repeat(676))).toThrow("max-string-units-exceeded");
    expect(isSustainabilityDirectionShapeMetrics(new Array(35).fill(null)).max_array_fanout).toBe(35);
    expect(() => isSustainabilityDirectionShapeMetrics(new Array(36).fill(null))).toThrow("max-array-fanout-exceeded");
    const object54 = Object.fromEntries(Array.from({ length: 54 }, (_, index) => [`k${index}`, null]));
    const object55 = { ...object54, over: null };
    expect(isSustainabilityDirectionShapeMetrics(object54).max_object_fanout).toBe(54);
    expect(() => isSustainabilityDirectionShapeMetrics(object55)).toThrow("max-object-fanout-exceeded");
    let depth7: any = null;
    for (let index = 0; index < 7; index += 1) depth7 = [depth7];
    expect(isSustainabilityDirectionShapeMetrics(depth7).max_depth).toBe(7);
    expect(() => isSustainabilityDirectionShapeMetrics([depth7])).toThrow("max-depth-exceeded");

    const nodeTree = Array.from({ length: 35 }, () => new Array(35).fill(null));
    let replacements = 0;
    for (const row of nodeTree) for (let index = 0; index < row.length && replacements < 75; index += 1) {
      row[index] = new Array(35).fill(null);
      replacements += 1;
    }
    nodeTree[3][5] = new Array(14).fill(null);
    expect(isSustainabilityDirectionShapeMetrics(nodeTree).json_nodes).toBe(3900);
    nodeTree[3][5].push(null);
    expect(() => isSustainabilityDirectionShapeMetrics(nodeTree)).toThrow("json-node-budget-exceeded");

    const strings = Array.from({ length: 198 }, () => "x".repeat(675));
    strings.push("x".repeat(650));
    const stringTree = Array.from({ length: 6 }, (_, index) => strings.slice(index * 35, (index + 1) * 35));
    expect(isSustainabilityDirectionShapeMetrics(stringTree).total_string_units).toBe(134300);
    stringTree[5][23] += "x";
    expect(() => isSustainabilityDirectionShapeMetrics(stringTree)).toThrow("total-string-budget-exceeded");
  });

  test("refuses symlinks, duplicate keys, fatal UTF-8, and raw-byte overrun", () => {
    const directory = mkdtempSync(join(tmpdir(), "is-sustainability-safe-open-"));
    try {
      const valid = join(directory, "valid.json");
      writeFileSync(valid, "{}", "utf8");
      const link = join(directory, "link.json");
      symlinkSync(valid, link);
      expect(() => readIsSustainabilityDirectionAtlas(link)).toThrow();
      const duplicate = join(directory, "duplicate.json");
      writeFileSync(duplicate, '{"x":1,"x":2}', "utf8");
      expect(() => readIsSustainabilityDirectionAtlas(duplicate)).toThrow();
      const invalidUtf8 = join(directory, "invalid-utf8.json");
      writeFileSync(invalidUtf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]));
      expect(() => readIsSustainabilityDirectionAtlas(invalidUtf8)).toThrow();
      const exact = join(directory, "exact.json");
      writeFileSync(exact, `{}${" ".repeat(IS_SUSTAINABILITY_DIRECTION_LIMITS.bytes - 2)}`);
      expect(readIsSustainabilityDirectionAtlas(exact).bytes).toBe(IS_SUSTAINABILITY_DIRECTION_LIMITS.bytes);
      const over = join(directory, "over.json");
      writeFileSync(over, `{}${" ".repeat(IS_SUSTAINABILITY_DIRECTION_LIMITS.bytes - 1)}`);
      expect(() => readIsSustainabilityDirectionAtlas(over)).toThrow("atlas-byte-budget-exceeded");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe("schema, CLI, and foreign-CWD release behavior", () => {
  test("has a compact deeply closed supported-keyword Draft 2020-12 schema", () => {
    const value = schema();
    expect(statSync(IS_SUSTAINABILITY_DIRECTION_SCHEMA_PATH).size).toBeLessThan(100_000);
    expect(validateIsSustainabilityDirectionSchemaClosure(value)).toEqual([]);
    expect(value.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(value.$id).toBe(IS_SUSTAINABILITY_DIRECTION_SCHEMA_ID);
    expect(value.$defs.resourceBudget.properties).toEqual({
      bytes: { const: 156500 }, json_nodes: { const: 3900 },
      total_string_units: { const: 134300 }, max_string_units: { const: 675 },
      max_array_fanout: { const: 35 }, max_object_fanout: { const: 54 }, max_depth: { const: 7 },
    });
  });

  test("closure fallback refuses malformed dialect, nodes, refs, object contracts, arrays and bounds", () => {
    const cases: Array<[(copy: any) => void, string]> = [
      [(copy) => { copy.$schema = "draft-wrong"; }, "schema-draft-mismatch"],
      [(copy) => { copy.$id = "https://example.invalid/wrong"; }, "schema-id-mismatch"],
      [(copy) => { copy.$defs.text = { maxLength: 675 }; }, "schema-node-without-supported-assertion"],
      [(copy) => { delete copy.$defs.scope.additionalProperties; }, "schema-object-not-deeply-closed"],
      [(copy) => { copy.$defs.scope.required.push(copy.$defs.scope.required[0]); }, "schema-required-unique-string-array-required"],
      [(copy) => { delete copy.$defs.stringList.items; }, "schema-array-items-required"],
      [(copy) => { copy.$defs.stringList.maxItems = -1; }, "schema-array-bounds-required"],
      [(copy) => { copy.properties.scope.extra = true; }, "schema-ref-siblings-refused"],
      [(copy) => { copy.$defs.text.not = {}; }, "schema-keyword-not-supported-by-fallback"],
    ];
    for (const [mutate, code] of cases) {
      const copy = schema();
      mutate(copy);
      expect(validateIsSustainabilityDirectionSchemaClosure(copy).map((issue) => issue.code)).toContain(code);
    }
  });

  test("runs pinned Draft validation when the explicit interpreter is provided", () => {
    const result = runIsSustainabilityDirectionReleaseSchemaValidation();
    const configured = process.env.IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON;
    if (configured && isAbsolute(configured)) {
      const executable = lstatSync(configured);
      if (!executable.isSymbolicLink() && executable.isFile() && (executable.mode & 0o111) !== 0) {
        expect(result).toMatchObject({ valid: true, jsonschema_version: "4.26.0", instance_errors: 0, recursive_closure_errors: 0 });
      } else {
        expect(result).toMatchObject({ valid: false, code: "pinned-jsonschema-validator-path-refused" });
      }
    } else if (configured) {
      expect(result).toMatchObject({ valid: false, code: "pinned-jsonschema-validator-path-refused" });
    } else {
      expect(result).toMatchObject({ valid: false, code: "pinned-jsonschema-validator-unavailable" });
    }
  });

  test("refuses PATH shadows, relative interpreters, symlinks, and non-executables", () => {
    const directory = mkdtempSync(join(tmpdir(), "is-sustainability-validator-"));
    const previousPython = process.env.IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON;
    const previousPath = process.env.PATH;
    try {
      const sentinel = join(directory, "shadow-ran");
      const shadow = join(directory, "python");
      writeFileSync(shadow, `#!/bin/sh\nprintf x > "${sentinel}"\n`, "utf8");
      chmodSync(shadow, 0o755);
      process.env.PATH = directory;
      process.env.IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON = "python";
      expect(runIsSustainabilityDirectionReleaseSchemaValidation()).toMatchObject({
        valid: false,
        code: "pinned-jsonschema-validator-path-refused",
      });
      expect(existsSync(sentinel)).toBe(false);

      const link = join(directory, "python-link");
      symlinkSync(shadow, link);
      process.env.IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON = link;
      expect(runIsSustainabilityDirectionReleaseSchemaValidation()).toMatchObject({
        valid: false,
        code: "pinned-jsonschema-validator-path-refused",
      });
      expect(existsSync(sentinel)).toBe(false);

      const nonExecutable = join(directory, "python-copy-not-executable");
      writeFileSync(nonExecutable, "not an executable", "utf8");
      chmodSync(nonExecutable, 0o600);
      process.env.IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON = nonExecutable;
      expect(runIsSustainabilityDirectionReleaseSchemaValidation()).toMatchObject({
        valid: false,
        code: "pinned-jsonschema-validator-path-refused",
      });
    } finally {
      if (previousPython === undefined) delete process.env.IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON;
      else process.env.IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON = previousPython;
      if (previousPath === undefined) delete process.env.PATH;
      else process.env.PATH = previousPath;
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("rejects raw record drift even when canonical semantic identity is unchanged", () => {
    const directory = mkdtempSync(join(tmpdir(), "is-sustainability-raw-triplet-"));
    try {
      const original = readIsSustainabilityDirectionAtlas();
      const reversed = Object.fromEntries(Object.entries(original.value as Record<string, any>).reverse());
      const reorderedPath = join(directory, "reordered.json");
      writeFileSync(reorderedPath, `${JSON.stringify(reversed)}\n`, "utf8");
      const reordered = readIsSustainabilityDirectionAtlas(reorderedPath);
      expect(reordered.rawDigest).not.toBe(original.rawDigest);
      expect(isSustainabilityDirectionDigest(reordered.value as Record<string, any>))
        .toBe(isSustainabilityDirectionDigest(original.value as Record<string, any>));
      expect(() => loadReviewedIsSustainabilityDirectionAtlas(reorderedPath)).toThrow();
      const source = readFileSync(BIN, "utf8");
      expect(source).toContain("reviewedRawTripletIssues(loaded.rawDigest)");
      expect(source).toContain("reviewed-record-raw-digest-mismatch");
      expect(source).toContain("reviewed-schema-raw-digest-mismatch");
      expect(source).toContain("reviewed-guide-raw-digest-mismatch");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("supports every read-only projection and reviewed verification from a foreign CWD", () => {
    const directory = mkdtempSync(join(tmpdir(), "is-sustainability-cwd-"));
    try {
      const commands = [
        "overview", "referents", "is", "being", "feedback", "direction", "viability",
        "sustainability", "profile", "resilience", "transformation", "endings", "ecology",
        "philosophy", "counterexamples", "open-questions", "sources", "predecessors", "non-grants",
      ];
      for (const command of commands) {
        const run = spawnSync("bun", [BIN, command, "--json"], { cwd: directory, encoding: "utf8" });
        expect(run.status, `${command}: ${run.stderr}`).toBe(0);
        expect(() => JSON.parse(run.stdout)).not.toThrow();
      }
      const verify = spawnSync("bun", [BIN, "verify", "--json"], { cwd: directory, encoding: "utf8" });
      expect(verify.status).toBe(0);
      expect(JSON.parse(verify.stdout)).toMatchObject({
        valid: true,
        structurally_valid: true,
        unsealed: false,
        semantic_digest: REVIEWED_SEMANTIC,
        reviewed_digest: REVIEWED_SEMANTIC,
        issues: [],
      });
      const dispatch = spawnSync(KINGDOM, ["is-sustainability-direction", "overview", "--json"], { cwd: directory, encoding: "utf8" });
      expect(dispatch.status, dispatch.stderr).toBe(0);
      expect(JSON.parse(dispatch.stdout).state).toBe("static-reviewed-interpretive-design-companion");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("keeps source artifacts present, static, and network/write free", () => {
    expect(statSync(IS_SUSTAINABILITY_DIRECTION_GUIDE_PATH).isFile()).toBe(true);
    expect(sha256(IS_SUSTAINABILITY_DIRECTION_RECORD_PATH)).toMatch(/^sha256:[a-f0-9]{64}$/);
    const source = readFileSync(BIN, "utf8");
    expect(source).not.toContain("fetch(");
    expect(source).not.toMatch(/writeFile|appendFile|createWriteStream/);
    expect(source).not.toContain("simulateIsSustainabilityDirectionSeal");
  });

  test("keeps the bounded guide aligned with the reviewed local machine contract", () => {
    const guide = readFileSync(IS_SUSTAINABILITY_DIRECTION_GUIDE_PATH, "utf8");
    expect(guide.split("\n").length).toBeGreaterThan(500);
    expect(guide.split("\n").length).toBeLessThan(600);
    for (const marker of [
      "independently **REVIEWED**; not published or deployed",
      "**NORMATIVE_DESIGN:**",
      "contains 7 referents and 7 unevaluated sustainability",
      "S(rho, Sigma)",
      "`CONTEXT` is an explicit open omission",
      "`MODEL` is an atlas addition and is not equivalent to that omitted context",
      "product_(s=0)^(H-1) Xi_s",
      "xi_s    = (w_s, nu_(s+1)) in Xi_s, for s >= t",
      "stopping functional with tau_t = tau(I_(0:t))",
      "every relevant state of the closed-loop domain—not merely at one evaluated",
      "c1b8430c8b83bd4cb3f9981efef615ba4885cfa3",
      "170381d37770c5c1ebc44b722f079c2985d903b5",
      "without adding a verdict, source finding, authority, effect, or Foundation",
      "document still describes a local static companion only",
      "release, deployment, Foundation amendment",
      "./kingdom is-sustainability-direction verify-schema-release --json",
    ]) expect(guide).toContain(marker);
  });
});
