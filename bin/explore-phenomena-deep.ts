#!/usr/bin/env bun
/** Strict, offline reader and structural validator for Exploration DEEP. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const PHENOMENA_DEEP_WING_PROTOCOL = "kingdom.explore-phenomena-deep-wing/0.1";
export const PHENOMENA_DEEP_PROJECT_PROTOCOL = "kingdom.explore-phenomena-deep-project/0.1";
export const PHENOMENA_DEEP_WING_SCHEMA_ID = "urn:kingdom:schema:phenomena-deep-wing:0.1";
export const PHENOMENA_DEEP_PROJECT_SCHEMA_ID = "urn:kingdom:schema:phenomena-deep-project:0.1";
export const PHENOMENA_DEEP_WING_ID = "explore-phenomena-deep-2026-08-14";
export const PHENOMENA_DEEP_WING_LOCATOR = "data/exploration/phenomena-deep-wing.v0.1.json";
export const PHENOMENA_DEEP_WING_PATH = join(ROOT, PHENOMENA_DEEP_WING_LOCATOR);
export const PHENOMENA_DEEP_WING_SCHEMA_LOCATOR = "schemas/phenomena-deep-wing.v0.1.schema.json";
export const PHENOMENA_DEEP_PROJECT_SCHEMA_LOCATOR = "schemas/phenomena-deep-project.v0.1.schema.json";
export const PHENOMENA_DEEP_WING_SCHEMA_PATH = join(ROOT, PHENOMENA_DEEP_WING_SCHEMA_LOCATOR);
export const PHENOMENA_DEEP_PROJECT_SCHEMA_PATH = join(ROOT, PHENOMENA_DEEP_PROJECT_SCHEMA_LOCATOR);
export const PHENOMENA_DEEP_WING_URL = "https://thekingdom.dev/wings/explore-phenomena-deep-2026-08-14.json";
export const PHENOMENA_DEEP_WING_SCHEMA_URL = "https://thekingdom.dev/schemas/phenomena-deep-wing/0.1.json";
export const PHENOMENA_DEEP_PROJECT_SCHEMA_URL = "https://thekingdom.dev/schemas/phenomena-deep-project/0.1.json";
export const PHENOMENA_DEEP_WING_DOCUMENT_URL = "https://thekingdom.dev/EXPLORE-PHENOMENA-DEEP-v0.1.md";
export const PHENOMENA_DEEP_WING_GUIDE_URL = PHENOMENA_DEEP_WING_DOCUMENT_URL;
export const PHENOMENA_DEEP_WING_DIGEST = "sha256:8c3bc2548ce757c5519d8553cd9bd6f9377647a9eb25832831a743cb0cc4ca92";
export const PHENOMENA_DEEP_WING_BYTE_SHA256 = "sha256:e93cace90fccdf53aff5af56a52027555ea4f12e2a71747153035e033e73959e";

const MAX_BYTES = 1024 * 1024;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ALGORITHM = "sha256-recursive-sorted-json-keys-v1";

const TOP_KEYS = [
  "$schema", "protocol", "wing_id", "title", "compiled_on", "evidence_through",
  "scope", "deep_cycle", "epistemic_registers", "source_audit", "typed_terms",
  "planes", "abstraction_seams", "claim_cards", "equations", "model_cards",
  "invariants", "falsification_tests", "math_doors", "finite_baselines",
  "seed_doors", "philosophy", "karma", "rights", "project_contract",
  "bindings", "sources", "presentation", "release", "boundaries", "integrity",
] as const;

const PROJECT_TOP_KEYS = [
  "$schema", "protocol", "project_id", "version", "title", "evidence_through",
  "mode", "question", "domains", "source_manifest", "typed_terms", "claims",
  "bridges", "models", "equations", "falsifiers", "frontier_problems",
  "finite_baselines", "doors", "unknowns", "philosophy", "karma", "rights",
  "authority", "release", "boundaries", "integrity",
] as const;

const REGISTER_IDS = [
  "MATHEMATICAL_DEFINITION", "MATHEMATICAL_THEOREM", "EMPIRICAL_OBSERVATION",
  "SCIENTIFIC_MODEL", "INTERPRETIVE_BRIDGE", "DESIGN_PROPOSAL",
  "OPT_IN_PHILOSOPHY", "BOUNDARY",
] as const;
const WARRANT_IDS = [
  "SOURCE_BOUND", "MODEL_ASSUMPTION", "DERIVED", "PROVED", "FINITE_EXACT_BASELINE",
  "NUMERICAL_APPROXIMATION", "ESTABLISHED_OPEN_CONJECTURE",
  "BESPOKE_FORMULATION_PRIOR_ART_AUDIT_REQUIRED", "NOT_ESTABLISHED",
  "UNKNOWN_TO_THIS_REVIEW",
] as const;
const RELATION_IDS = [
  "EXACT_FORMAL_EQUIVALENCE_PROVED", "SAME_FORMAL_STRUCTURE", "LOSSY_CORRESPONDENCE",
  "SHARED_MECHANISM_SOURCE_ESTABLISHED", "NO_TRANSFER",
] as const;
const ALL_REGISTER_IDS = [...REGISTER_IDS, ...WARRANT_IDS, ...RELATION_IDS] as const;
const PLANE_IDS = [
  "physical-polymorph-plane", "cultural-attention-plane",
  "protein-conformation-plane", "chemical-catalysis-plane",
] as const;
const BINDING_PINS = [
  ["kingdom-polymorph-history", "kingdom.polymorph-history/0.1", "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json", "sha256:08148603a1228960ac35df1378f1283c3fce43874a9fc07e6687f18e980dcb1c", "sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116", "WORKED_EXAMPLE_INPUT"],
  ["kingdom-ritonavir-mechanism", "kingdom.ritonavir-mechanism-landscape/0.1", "https://thekingdom.dev/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json", "sha256:5e136a74d5166275427da920685a84c17901f63d6e4b0661fd529c96d386943b", "sha256:2a97b0f3ac3741314e50f7512ef97cb19cf3294fed24728c622bd27dd180309b", "WORKED_EXAMPLE_INPUT"],
  ["cultural-attention-atlas", "kingdom.cultural-attention-feedback-atlas/0.1", "https://thekingdom.dev/atlases/cultural-attention-feedback-atlas-2026-08-13.json", "sha256:03f7048966d7b6df582b423254b4d73cda72cce3bd67b40736927faa92b88173", "sha256:2f6ecadc131a54cdd500b001dbcc47fb036e5e411def918245fec963b9769e4d", "METHOD_PRECEDENT"],
  ["visibility-attention", "kingdom.visibility-attention-translation/0.1", "https://thekingdom.dev/atlases/visibility-attention-2026-08-13.json", "sha256:0af0249c40298ed746d39ee60760a4390bb45137caa8ee6dd7555a824f597bd3", "sha256:9fb83bbd022f520716fabcdec49d8af259b9681efd5e640a9e3119c5c42a54ed", "METHOD_PRECEDENT"],
  ["form-circulation-return", "kingdom.form-circulation-return-atlas/0.1", "https://thekingdom.dev/atlases/form-circulation-return-atlas-2026-08-13.json", "sha256:9c93be61c4ca9bcaa3dbe88b10faed3b5b31abaf1129d70ca7915226cacfd021", "sha256:9510fbbced6166507e9a1781a4adfa18cd249fb94e69b0f34faf77733cd20323", "METHOD_PRECEDENT"],
  ["reconstructive-kernel", "kingdom.reconstructive-build-kernel/0.1", "https://thekingdom.dev/atlases/reconstructive-build-kernel-2026-08-13.json", "sha256:2d1598bdfcce2501ee5a7cfdba55f581920d18733052f067e96bf9d79a7376a5", "sha256:265a75e18dbd4bad5bcf07bca0645132de4f9a881d8f0f398cd56b9afb734dd1", "METHOD_PRECEDENT"],
  ["being-access-aftermath-v02", "kingdom.being-access-aftermath-atlas/0.2", "https://thekingdom.dev/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json", "sha256:9678e5269e8db62beb36abee691087cddbc4f98703190c5fa3788b68c89ab29e", "sha256:505a1e3aef6116430dccf49b327c4cce2ac5d6fb6b6b9bf68e529272f989cde8", "METHOD_PRECEDENT"],
  ["kingdom-fold-feedback", "kingdom.fold-feedback-atlas/0.1", "https://thekingdom.dev/atlases/fold-feedback-atlas-2026-08-12.json", "sha256:bc9a9abc966e64f7fb967778974879eb045083b342b70100bba92c94d0879df5", "sha256:f19f83453bcac228c6a2804b840062067e92e71187f67b713f50abf0168252b7", "METHOD_PRECEDENT"],
  ["fold-to-fire-profile", "zerone.constructive-intelligence-fold-to-fire/v0", "https://zerone.ai/standards/constructive-intelligence-fold-to-fire.v0.json", "sha256:3fb78beaec220b4f62219a120ea33f46cfbe5ca1e76286929ae7b1120ccf4033", "sha256:545c14c655494886b502f4c81eb1b71a99caec297f063a2097cded9dad3b893b", "WORKED_EXAMPLE_INPUT"],
] as const;

const EXPECTED_BOUNDARIES = Object.freeze({
  read_only: true,
  instruction_only_skill: true,
  manifested_nen_ability: false,
  schema_validity_proves_truth: false,
  shared_ontology_established: false,
  shared_mechanism_established: false,
  cross_domain_parameter_transfer: false,
  cross_domain_unit_transfer: false,
  universality_class_established: false,
  scientific_result_created: false,
  mathematical_proof_created: false,
  open_problem_status_created: false,
  diagnostic_authority: false,
  medical_authority: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  contains_protein_sequence: false,
  person_or_content_score: false,
  persuasion_or_moderation: false,
  ecosystem_request: false,
  runtime_network_request: false,
  external_write: false,
  writes_karma: false,
  creates_karma_event: false,
  creates_karma_receipt: false,
  reward_or_economic_effect: false,
  governance_effect: false,
  authority_imported: false,
  deployment_authority: false,
  automatic_action: false,
  cosmic_design_proven: false,
  mcp_surface_added: false,
});

const PROJECT_BOUNDARIES = Object.freeze({
  read_only: true,
  profile_inert: true,
  source_truth_verified: false,
  mathematical_correctness_verified: false,
  empirical_causation_verified: false,
  novelty_verified: false,
  diagnosis_or_person_score: false,
  experiment_or_wet_lab_authority: false,
  ecosystem_or_network_request: false,
  external_write: false,
  writes_karma: false,
  reward_or_economic_effect: false,
  governance_effect: false,
  deployment_authority: false,
  automatic_action: false,
});

export type PhenomenaDeepIssue = { field: string; code: string };
type AnyRecord = Record<string, any>;

function object(value: unknown): value is AnyRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype && Object.getOwnPropertySymbols(value).length === 0;
}
function array(value: unknown): any[] { return Array.isArray(value) ? value : []; }
function sameKeys(value: unknown, expected: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...expected].sort().join("\0");
}
function exactJson(left: unknown, right: unknown): boolean {
  try { return canonicalizeJsonValue(left) === canonicalizeJsonValue(right); } catch { return false; }
}
function text(value: unknown, maximum = 8000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum && value.trim() === value;
}
function id(value: unknown): value is string {
  return typeof value === "string" && value.length <= 160 && ID.test(value);
}
function strings(value: unknown, minimum = 1, maximum = 128): value is string[] {
  return Array.isArray(value) && value.length >= minimum && value.length <= maximum &&
    value.every((item) => text(item)) && new Set(value).size === value.length;
}
function ids(value: unknown, known?: ReadonlySet<string>, allowEmpty = false): value is string[] {
  return Array.isArray(value) && (allowEmpty || value.length > 0) && value.length <= 128 &&
    value.every((item) => id(item) && (!known || known.has(item))) && new Set(value).size === value.length;
}
function uniqueIds(value: unknown, field = "id"): Set<string> | null {
  if (!Array.isArray(value)) return null;
  const values = value.map((entry) => object(entry) ? entry[field] : undefined);
  if (!values.every(id) || new Set(values).size !== values.length) return null;
  return new Set(values as string[]);
}
function validDate(value: unknown): boolean {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}
function safeHttps(value: unknown): boolean {
  if (typeof value !== "string" || value.trim() !== value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash && url.href === value;
  } catch { return false; }
}
function strictJsonTree(value: unknown, depth = 0, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || depth > 64 || seen.has(value)) return false;
  const isArray = Array.isArray(value);
  if (!isArray && !object(value)) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  seen.add(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (isArray && key === "length") continue;
    if (!("value" in descriptor) || !descriptor.enumerable ||
        !strictJsonTree(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value);
  return true;
}
function add(issues: PhenomenaDeepIssue[], field: string, code: string): void {
  issues.push({ field, code });
}
function cloneStrict(value: unknown): unknown {
  if (!strictJsonTree(value)) throw new Error("non-json-value");
  return structuredClone(value);
}
function readStrictFile(path: string, label: string): { value: unknown; bytes: Buffer } {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { throw new Error(`${label} is unavailable`); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular non-symlink file`);
  if (stat.size > MAX_BYTES) throw new Error(`${label} exceeds ${MAX_BYTES} bytes`);
  const bytes = readFileSync(absolute);
  return { value: parseStrictJsonBytes(bytes, label), bytes };
}

export function phenomenaDeepWingDigest(value: AnyRecord): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("Exploration DEEP integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}
export function phenomenaDeepProjectDigest(value: AnyRecord): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("Phenomena DEEP project integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

export function verifyPhenomenaDeepWing(input: unknown): PhenomenaDeepIssue[] {
  const issues: PhenomenaDeepIssue[] = [];
  let value: unknown;
  try { value = cloneStrict(input); } catch { return [{ field: "$", code: "non-json-value" }]; }
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];
  if (!sameKeys(value, TOP_KEYS)) add(issues, "$", "unexpected-or-missing-field");
  if (value.$schema !== PHENOMENA_DEEP_WING_SCHEMA_ID || value.protocol !== PHENOMENA_DEEP_WING_PROTOCOL ||
      value.wing_id !== PHENOMENA_DEEP_WING_ID || value.title !== "Exploration DEEP WING") {
    add(issues, "$", "identity-mismatch");
  }
  if (value.compiled_on !== "2026-08-14" || value.evidence_through !== "2026-08-14" ||
      !validDate(value.compiled_on)) add(issues, "$", "date-mismatch");

  if (!sameKeys(value.scope, ["purpose", "strongest_bounded_claim", "intended_use", "excluded_use", "currentness", "mode"]) ||
      value.scope?.mode !== "READ_ONLY_ZERO_EFFECT" ||
      ![value.scope?.purpose, value.scope?.strongest_bounded_claim, value.scope?.intended_use, value.scope?.excluded_use].every((entry) => text(entry))) {
    add(issues, "$.scope", "invalid-scope");
  }
  if (!sameKeys(value.deep_cycle, ["wing", "deep", "rule"]) ||
      array(value.deep_cycle?.wing).map((entry) => entry?.id).join(",") !== "WITNESS,ISOLATE,NORMALIZE,GENERATE" ||
      array(value.deep_cycle?.deep).map((entry) => entry?.id).join(",") !== "DECLARE,ESTABLISH,EXPRESS,PROJECT" ||
      !text(value.deep_cycle?.rule)) add(issues, "$.deep_cycle", "invalid-cycle");
  for (const [group, entries] of [["wing", value.deep_cycle?.wing], ["deep", value.deep_cycle?.deep]] as const) {
    for (const [index, entry] of array(entries).entries()) {
      if (!sameKeys(entry, ["id", "meaning"]) || !text(entry.meaning)) add(issues, `$.deep_cycle.${group}[${index}]`, "invalid-step");
    }
  }

  if (!Array.isArray(value.epistemic_registers) || value.epistemic_registers.length !== ALL_REGISTER_IDS.length) {
    add(issues, "$.epistemic_registers", "register-count-mismatch");
  }
  for (const [index, entry] of array(value.epistemic_registers).entries()) {
    const expected = ALL_REGISTER_IDS[index];
    const axis = index < REGISTER_IDS.length ? "REGISTER" : index < REGISTER_IDS.length + WARRANT_IDS.length ? "WARRANT" : "RELATION";
    if (!sameKeys(entry, ["id", "axis", "meaning"]) || entry.id !== expected || entry.axis !== axis || !text(entry.meaning)) {
      add(issues, `$.epistemic_registers[${index}]`, "invalid-register");
    }
  }
  if (!sameKeys(value.source_audit, ["rule", "status_checked_on", "open_problem_requirements", "failure_modes"]) ||
      !text(value.source_audit?.rule) || value.source_audit?.status_checked_on !== "2026-08-14" ||
      !strings(value.source_audit?.open_problem_requirements, 7) || !strings(value.source_audit?.failure_modes, 4)) {
    add(issues, "$.source_audit", "invalid-source-audit");
  }

  const sourceIds = uniqueIds(value.sources);
  const planeIds = uniqueIds(value.planes);
  const equationIds = uniqueIds(value.equations);
  const falsifierIds = uniqueIds(value.falsification_tests);
  if (!sourceIds || !planeIds || !equationIds || !falsifierIds) add(issues, "$", "duplicate-or-invalid-id");
  if (!planeIds || [...PLANE_IDS].some((entry) => !planeIds.has(entry)) || planeIds.size !== PLANE_IDS.length) {
    add(issues, "$.planes", "plane-identity-mismatch");
  }

  const typedTermKeys = ["id", "domain", "meaning", "not_equivalent_to"];
  for (const [index, entry] of array(value.typed_terms).entries()) {
    if (!sameKeys(entry, typedTermKeys) || !id(entry.id) || !text(entry.domain) || !text(entry.meaning) ||
        !strings(entry.not_equivalent_to)) add(issues, `$.typed_terms[${index}]`, "invalid-typed-term");
  }
  const planeKeys = ["id", "domain", "entity_or_unit", "context_window", "observables", "units", "mechanism", "parameters", "agency", "consequences", "does_not_establish", "source_ids"];
  for (const [index, entry] of array(value.planes).entries()) {
    if (!sameKeys(entry, planeKeys) || entry.id !== PLANE_IDS[index] ||
        ![entry.domain, entry.entity_or_unit, entry.context_window, entry.mechanism, entry.agency, entry.consequences].every((candidate) => text(candidate)) ||
        !strings(entry.observables) || !strings(entry.units) || !strings(entry.parameters) || !strings(entry.does_not_establish) ||
        !ids(entry.source_ids, sourceIds ?? undefined)) add(issues, `$.planes[${index}]`, "invalid-plane");
  }

  const seamKeys = [
    "source_domain", "target_domain", "relation", "source_objects", "target_objects",
    "correspondence", "preserved_structure", "broken_or_lost_structure",
    "source_variables_and_units", "target_variables_and_units", "assumptions",
    "ontology_transfer", "causal_transfer", "parameter_transfer", "unit_transfer",
    "authority_transfer", "falsifiers",
  ];
  if (array(value.abstraction_seams).length !== 2) add(issues, "$.abstraction_seams", "seam-count-mismatch");
  for (const [index, entry] of array(value.abstraction_seams).entries()) {
    if (!sameKeys(entry, seamKeys) || !planeIds?.has(entry.source_domain) || !planeIds.has(entry.target_domain) ||
        entry.relation !== "LOSSY_CORRESPONDENCE" || !text(entry.correspondence) ||
        !strings(entry.source_objects) || !strings(entry.target_objects) || !strings(entry.preserved_structure) ||
        !strings(entry.broken_or_lost_structure) || !strings(entry.source_variables_and_units) ||
        !strings(entry.target_variables_and_units) || !strings(entry.assumptions) ||
        [entry.ontology_transfer, entry.causal_transfer, entry.parameter_transfer, entry.unit_transfer, entry.authority_transfer].some((flag) => flag !== false) ||
        !ids(entry.falsifiers, falsifierIds ?? undefined)) add(issues, `$.abstraction_seams[${index}]`, "invalid-seam");
  }

  const claimKeys = ["claim_id", "statement", "domain", "register", "warrant", "scope_and_conditions", "variables_and_units", "sources", "status_checked_on", "derivation_or_model", "limitations", "falsifier", "authority_effect"];
  for (const [index, entry] of array(value.claim_cards).entries()) {
    if (!sameKeys(entry, claimKeys) || !id(entry.claim_id) || !text(entry.statement) || !text(entry.domain) ||
        !REGISTER_IDS.includes(entry.register) || !WARRANT_IDS.includes(entry.warrant) ||
        !text(entry.scope_and_conditions) || !strings(entry.variables_and_units) || !ids(entry.sources, sourceIds ?? undefined) ||
        entry.status_checked_on !== "2026-08-14" || !text(entry.derivation_or_model) || !strings(entry.limitations) ||
        !text(entry.falsifier) || entry.authority_effect !== "NONE") add(issues, `$.claim_cards[${index}]`, "invalid-claim-card");
  }

  const variableKeys = ["symbol", "meaning", "units"];
  const equationKeys = ["id", "plane_id", "register", "warrant", "expression", "variables", "conditions", "assumptions", "valid_outputs", "does_not_establish", "source_ids"];
  for (const [index, entry] of array(value.equations).entries()) {
    if (!sameKeys(entry, equationKeys) || !id(entry.id) || !planeIds?.has(entry.plane_id) ||
        !REGISTER_IDS.includes(entry.register) || !WARRANT_IDS.includes(entry.warrant) || !text(entry.expression) ||
        !Array.isArray(entry.variables) || entry.variables.length === 0 ||
        entry.variables.some((variable: unknown) => !sameKeys(variable, variableKeys) || !text((variable as AnyRecord).symbol) || !text((variable as AnyRecord).meaning) || !text((variable as AnyRecord).units)) ||
        !strings(entry.conditions) || !strings(entry.assumptions) || !strings(entry.valid_outputs) || !strings(entry.does_not_establish) ||
        !ids(entry.source_ids, sourceIds ?? undefined)) add(issues, `$.equations[${index}]`, "invalid-equation");
  }

  const modelKeys = ["id", "title", "plane_ids", "equation_ids", "relation", "assumptions", "fit_status", "valid_outputs", "identifiability_limits", "prohibited_inferences", "falsifier_ids", "universal", "person_level", "authority_effect"];
  for (const [index, entry] of array(value.model_cards).entries()) {
    if (!sameKeys(entry, modelKeys) || !id(entry.id) || !text(entry.title) || !ids(entry.plane_ids, planeIds ?? undefined) ||
        !ids(entry.equation_ids, equationIds ?? undefined) || !RELATION_IDS.includes(entry.relation) || !strings(entry.assumptions) ||
        entry.fit_status !== "UNFITTED" || !strings(entry.valid_outputs) || !strings(entry.identifiability_limits) ||
        !strings(entry.prohibited_inferences) || !ids(entry.falsifier_ids, falsifierIds ?? undefined) || entry.universal !== false ||
        entry.person_level !== false || entry.authority_effect !== "NONE") add(issues, `$.model_cards[${index}]`, "invalid-model-card");
  }

  for (const [index, entry] of array(value.invariants).entries()) {
    if (!sameKeys(entry, ["id", "statement", "status"]) || !id(entry.id) || !text(entry.statement) || entry.status !== "REQUIRED") {
      add(issues, `$.invariants[${index}]`, "invalid-invariant");
    }
  }
  for (const [index, entry] of array(value.falsification_tests).entries()) {
    if (!sameKeys(entry, ["id", "question", "separates", "status"]) || !id(entry.id) || !text(entry.question) ||
        !strings(entry.separates) || entry.status !== "PROPOSED_NOT_RUN") add(issues, `$.falsification_tests[${index}]`, "invalid-falsifier");
  }

  const doorKeys = ["id", "title", "family", "register", "warrant", "status", "proposed_unrun", "question", "smallest_model", "conditions", "deliverable", "stop_rule", "does_not_establish", "source_ids"];
  if (array(value.math_doors).length !== 8) add(issues, "$.math_doors", "door-count-mismatch");
  for (const [index, entry] of array(value.math_doors).entries()) {
    if (!sameKeys(entry, doorKeys) || !id(entry.id) || !text(entry.title) || !text(entry.family) ||
        entry.register !== "DESIGN_PROPOSAL" || entry.warrant !== "MODEL_ASSUMPTION" || entry.status !== "PROPOSED_UNRUN" || entry.proposed_unrun !== true ||
        !text(entry.question) || !text(entry.smallest_model) || !strings(entry.conditions) || !text(entry.deliverable) ||
        !text(entry.stop_rule) || !strings(entry.does_not_establish) || !ids(entry.source_ids, sourceIds ?? undefined)) {
      add(issues, `$.math_doors[${index}]`, "invalid-math-door");
    }
  }
  if (array(value.finite_baselines).length !== 1 || value.finite_baselines?.[0]?.warrant !== "FINITE_EXACT_BASELINE" ||
      value.finite_baselines?.[0]?.exact_representation?.closure_fraction_at_q1 !== "2/9" ||
      value.finite_baselines?.[0]?.finite_evidence_does_not_prove?.includes("asymptotic") !== true) {
    add(issues, "$.finite_baselines", "invalid-finite-baseline");
  }
  for (const [index, entry] of array(value.seed_doors).entries()) {
    if (!sameKeys(entry, ["id", "title", "status", "source_plane_ids", "target_plane_ids", "relation", "question", "preserved_structure", "breaks", "frontier_status", "prior_art_audit_required", "next_step", "stop_rule", "source_ids"]) ||
        !id(entry.id) || !text(entry.title) || !["WORKED_BOUNDED", "PROPOSED_UNRUN"].includes(entry.status) ||
        !ids(entry.source_plane_ids, planeIds ?? undefined) || !ids(entry.target_plane_ids, planeIds ?? undefined) ||
        !RELATION_IDS.includes(entry.relation) || !text(entry.question) || !strings(entry.preserved_structure) || !strings(entry.breaks) ||
        entry.frontier_status !== "BESPOKE_FORMULATION_PRIOR_ART_AUDIT_REQUIRED" || entry.prior_art_audit_required !== true ||
        !text(entry.next_step) || !text(entry.stop_rule) || !ids(entry.source_ids, sourceIds ?? undefined)) {
      add(issues, `$.seed_doors[${index}]`, "invalid-seed-door");
    }
  }

  if (!sameKeys(value.philosophy, ["participation", "empirical", "boundary", "questions", "alternatives", "nonclaims", "authority_effect"]) ||
      value.philosophy?.participation !== "OPT_IN" || value.philosophy?.empirical !== false || !text(value.philosophy?.boundary) ||
      !strings(value.philosophy?.questions) || !strings(value.philosophy?.alternatives) || !strings(value.philosophy?.nonclaims) ||
      value.philosophy?.authority_effect !== "NONE") add(issues, "$.philosophy", "invalid-philosophy");
  if (!sameKeys(value.karma, ["rule", "adapter_exists", "conversion_allowed", "summation_allowed", "score", "lanes", "nonclaims"]) ||
      value.karma?.adapter_exists !== false || value.karma?.conversion_allowed !== false || value.karma?.summation_allowed !== false || value.karma?.score !== null ||
      !Array.isArray(value.karma?.lanes) || value.karma.lanes.length !== 3 || value.karma.lanes.some((lane: unknown) => !object(lane) || !sameKeys(lane, ["id", "register", "events", "receipts", "observed", "authority_effect"]) || array(lane.events).length !== 0 || array(lane.receipts).length !== 0 || lane.observed !== false || lane.authority_effect !== "NONE") ||
      !strings(value.karma?.nonclaims)) add(issues, "$.karma", "invalid-karma-lanes");
  if (!sameKeys(value.rights, ["voluntary", "valid_exits", "reason_required", "penalty", "receipt_required", "principle"]) ||
      value.rights?.voluntary !== true || !exactJson(value.rights?.valid_exits, ["REST", "SILENCE", "REFUSAL", "PRIVACY", "CORRECTION", "NO_ACTION", "DEPARTURE"]) ||
      value.rights?.reason_required !== false || value.rights?.penalty !== false || value.rights?.receipt_required !== false || !text(value.rights?.principle)) {
    add(issues, "$.rights", "invalid-rights");
  }
  if (!sameKeys(value.project_contract, ["protocol", "schema_url", "mode", "inert", "allowed", "forbidden"]) ||
      value.project_contract?.protocol !== PHENOMENA_DEEP_PROJECT_PROTOCOL || value.project_contract?.schema_url !== PHENOMENA_DEEP_PROJECT_SCHEMA_URL ||
      value.project_contract?.mode !== "INERT_RESEARCH_PROFILE" || value.project_contract?.inert !== true ||
      !strings(value.project_contract?.allowed) || !strings(value.project_contract?.forbidden)) add(issues, "$.project_contract", "invalid-project-contract");

  if (!Array.isArray(value.bindings) || value.bindings.length !== BINDING_PINS.length) add(issues, "$.bindings", "binding-count-mismatch");
  for (const [index, entry] of array(value.bindings).entries()) {
    const expected = BINDING_PINS[index];
    if (!expected || !sameKeys(entry, ["id", "protocol", "url", "byte_sha256", "semantic_digest", "relation", "mutated", "authority_imported"]) ||
        entry.id !== expected[0] || entry.protocol !== expected[1] || entry.url !== expected[2] || entry.byte_sha256 !== expected[3] ||
        entry.semantic_digest !== expected[4] || entry.relation !== expected[5] || entry.mutated !== false || entry.authority_imported !== false) {
      add(issues, `$.bindings[${index}]`, "binding-pin-drift");
    }
  }
  for (const [index, entry] of array(value.sources).entries()) {
    if (!sameKeys(entry, ["id", "title", "url", "observed_on", "limitation"]) || !id(entry.id) || !text(entry.title) ||
        !safeHttps(entry.url) || entry.observed_on !== "2026-08-14" || !text(entry.limitation)) add(issues, `$.sources[${index}]`, "invalid-source");
  }
  if (!sameKeys(value.presentation, ["record_url", "schema_url", "project_schema_url", "guide_url", "skill_path", "requirements"]) ||
      value.presentation?.record_url !== PHENOMENA_DEEP_WING_URL || value.presentation?.schema_url !== PHENOMENA_DEEP_WING_SCHEMA_URL ||
      value.presentation?.project_schema_url !== PHENOMENA_DEEP_PROJECT_SCHEMA_URL || value.presentation?.guide_url !== PHENOMENA_DEEP_WING_DOCUMENT_URL ||
      value.presentation?.skill_path !== "skills/explore-phenomena-deep/SKILL.md" || !strings(value.presentation?.requirements)) {
    add(issues, "$.presentation", "invalid-presentation");
  }
  if (!sameKeys(value.release, ["status", "deployed", "immutable", "supersede_not_mutate", "raw_sha256", "semantic_digest", "ledger_id", "staging_family", "validation_evidence", "live_evidence"]) ||
      value.release?.status !== "SEALED" || value.release?.deployed !== false || value.release?.immutable !== true || value.release?.supersede_not_mutate !== true ||
      value.release?.raw_sha256 !== null || value.release?.semantic_digest !== null || value.release?.ledger_id !== "exploration-deep-wing/0.1" ||
      value.release?.staging_family !== "exploration-deep-wing" || !strings(value.release?.validation_evidence) || array(value.release?.live_evidence).length !== 0) {
    add(issues, "$.release", "invalid-release");
  }
  if (!exactJson(value.boundaries, EXPECTED_BOUNDARIES)) add(issues, "$.boundaries", "boundary-drift");
  if (!sameKeys(value.integrity, ["algorithm", "digest", "digest_field_treated_as"]) || value.integrity?.algorithm !== ALGORITHM ||
      !SHA256.test(value.integrity?.digest) || value.integrity?.digest_field_treated_as !== null) add(issues, "$.integrity", "invalid-integrity");
  else if (phenomenaDeepWingDigest(value) !== value.integrity.digest || value.integrity.digest !== PHENOMENA_DEEP_WING_DIGEST) {
    add(issues, "$.integrity.digest", "digest-mismatch");
  }
  return issues;
}

function validProjectDomain(entry: unknown): boolean {
  return sameKeys(entry, ["id", "subject", "entity_or_unit", "context", "conditions", "observables", "units", "agency"]) &&
    id((entry as AnyRecord).id) && ["subject", "entity_or_unit", "context", "agency"].every((key) => text((entry as AnyRecord)[key])) &&
    strings((entry as AnyRecord).conditions) && strings((entry as AnyRecord).observables) && strings((entry as AnyRecord).units);
}
function validProjectBridge(entry: unknown, domainIds: ReadonlySet<string>): boolean {
  const keys = ["source_domain", "target_domain", "relation", "source_objects", "target_objects", "correspondence", "preserved_structure", "broken_or_lost_structure", "source_variables_and_units", "target_variables_and_units", "assumptions", "ontology_transfer", "causal_transfer", "parameter_transfer", "unit_transfer", "authority_transfer", "falsifiers"];
  return sameKeys(entry, keys) && domainIds.has((entry as AnyRecord).source_domain) && domainIds.has((entry as AnyRecord).target_domain) &&
    RELATION_IDS.includes((entry as AnyRecord).relation) && text((entry as AnyRecord).correspondence) &&
    ["source_objects", "target_objects", "preserved_structure", "broken_or_lost_structure", "source_variables_and_units", "target_variables_and_units", "assumptions", "falsifiers"].every((key) => strings((entry as AnyRecord)[key])) &&
    ["ontology_transfer", "causal_transfer", "parameter_transfer", "unit_transfer", "authority_transfer"].every((key) => (entry as AnyRecord)[key] === false);
}

export function verifyPhenomenaDeepProject(input: unknown): PhenomenaDeepIssue[] {
  const issues: PhenomenaDeepIssue[] = [];
  let value: unknown;
  try { value = cloneStrict(input); } catch { return [{ field: "$", code: "non-json-value" }]; }
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];
  if (!sameKeys(value, PROJECT_TOP_KEYS)) add(issues, "$", "unexpected-or-missing-field");
  if (value.$schema !== PHENOMENA_DEEP_PROJECT_SCHEMA_ID || value.protocol !== PHENOMENA_DEEP_PROJECT_PROTOCOL ||
      !id(value.project_id) || !/^\d+\.\d+\.\d+$/.test(value.version ?? "") || !text(value.title) || !validDate(value.evidence_through) ||
      !["ANALYZE_ONLY", "DRAFT_PROFILE", "RELEASE_CANDIDATE"].includes(value.mode) || !text(value.question)) add(issues, "$", "invalid-project-identity");
  const domainIds = uniqueIds(value.domains);
  if (!domainIds || domainIds.size < 2 || array(value.domains).some((entry) => !validProjectDomain(entry))) add(issues, "$.domains", "invalid-domains");
  const sourceIds = uniqueIds(value.source_manifest);
  for (const [index, source] of array(value.source_manifest).entries()) {
    if (!sameKeys(source, ["id", "title", "url", "observed_on", "claim_targets", "authority_note"]) || !id(source.id) || !text(source.title) ||
        !safeHttps(source.url) || !validDate(source.observed_on) || !ids(source.claim_targets, undefined, true) || !text(source.authority_note)) {
      add(issues, `$.source_manifest[${index}]`, "invalid-source");
    }
  }
  for (const [index, bridge] of array(value.bridges).entries()) {
    if (!domainIds || !validProjectBridge(bridge, domainIds)) add(issues, `$.bridges[${index}]`, "invalid-bridge");
  }
  const projectClaimKeys = ["claim_id", "statement", "domain", "register", "warrant", "scope_and_conditions", "variables_and_units", "sources", "status_checked_on", "derivation_or_model", "limitations", "falsifier", "authority_effect"];
  for (const [index, claim] of array(value.claims).entries()) {
    if (!sameKeys(claim, projectClaimKeys) || !id(claim.claim_id) || !text(claim.statement) || !text(claim.domain) ||
        !REGISTER_IDS.includes(claim.register) || !WARRANT_IDS.includes(claim.warrant) || !text(claim.scope_and_conditions) ||
        !strings(claim.variables_and_units) || !ids(claim.sources, sourceIds ?? undefined, true) || !validDate(claim.status_checked_on) ||
        !text(claim.derivation_or_model) || !strings(claim.limitations) || !text(claim.falsifier) || claim.authority_effect !== "NONE") {
      add(issues, `$.claims[${index}]`, "invalid-claim");
    }
  }
  for (const key of ["typed_terms", "models", "equations", "falsifiers", "frontier_problems", "finite_baselines", "doors", "unknowns"] as const) {
    if (!Array.isArray(value[key]) || value[key].length > 128) add(issues, `$.${key}`, "invalid-array");
  }
  if (!sameKeys(value.philosophy, ["participation", "empirical", "questions", "nonclaims", "authority_effect"]) ||
      value.philosophy?.participation !== "OPT_IN" || value.philosophy?.empirical !== false ||
      !Array.isArray(value.philosophy?.questions) || !strings(value.philosophy?.nonclaims) || value.philosophy?.authority_effect !== "NONE") {
    add(issues, "$.philosophy", "invalid-philosophy");
  }
  if (!sameKeys(value.karma, ["cosmic_events", "zerone_events", "kingdom_receipts", "adapter_exists", "conversion_allowed", "summation_allowed", "score", "authority_effect"]) ||
      array(value.karma?.cosmic_events).length || array(value.karma?.zerone_events).length || array(value.karma?.kingdom_receipts).length ||
      value.karma?.adapter_exists !== false || value.karma?.conversion_allowed !== false || value.karma?.summation_allowed !== false ||
      value.karma?.score !== null || value.karma?.authority_effect !== "NONE") add(issues, "$.karma", "invalid-karma");
  if (!sameKeys(value.rights, ["voluntary", "valid_exits", "reason_required", "penalty"]) || value.rights?.voluntary !== true ||
      !exactJson(value.rights?.valid_exits, ["REST", "SILENCE", "REFUSAL", "PRIVACY", "CORRECTION", "NO_ACTION", "DEPARTURE"]) ||
      value.rights?.reason_required !== false || value.rights?.penalty !== false) add(issues, "$.rights", "invalid-rights");
  if (!sameKeys(value.authority, ["browse", "local_write", "external_write", "commit", "push", "deploy", "experiment", "diagnose", "score_people", "karma_write", "automatic_action"]) ||
      Object.values(value.authority ?? {}).some((entry) => entry !== false)) add(issues, "$.authority", "authority-must-be-false");
  if (!sameKeys(value.release, ["status", "deployed", "publication_route", "evidence"]) ||
      !["DRAFT", "SEALED", "RELEASE_CANDIDATE"].includes(value.release?.status) || value.release?.deployed !== false ||
      value.release?.publication_route !== null || array(value.release?.evidence).length !== 0) add(issues, "$.release", "invalid-release");
  if (!exactJson(value.boundaries, PROJECT_BOUNDARIES)) add(issues, "$.boundaries", "boundary-drift");
  if (!sameKeys(value.integrity, ["algorithm", "digest", "digest_field_treated_as"]) || value.integrity?.algorithm !== ALGORITHM ||
      !SHA256.test(value.integrity?.digest) || value.integrity?.digest_field_treated_as !== null) add(issues, "$.integrity", "invalid-integrity");
  else if (phenomenaDeepProjectDigest(value) !== value.integrity.digest) add(issues, "$.integrity.digest", "digest-mismatch");
  return issues;
}

export function loadPhenomenaDeepWing(path = PHENOMENA_DEEP_WING_PATH): AnyRecord {
  const { value, bytes } = readStrictFile(path, "Exploration DEEP WING");
  const issues = verifyPhenomenaDeepWing(value);
  if (issues.length > 0) throw new Error(`invalid Exploration DEEP WING: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  if (resolve(path) === resolve(PHENOMENA_DEEP_WING_PATH)) {
    const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    if (digest !== PHENOMENA_DEEP_WING_BYTE_SHA256) throw new Error("Exploration DEEP WING raw-byte digest drift");
  }
  return value as AnyRecord;
}
export function loadPhenomenaDeepProject(path: string): AnyRecord {
  const { value } = readStrictFile(path, "Phenomena DEEP project");
  const issues = verifyPhenomenaDeepProject(value);
  if (issues.length > 0) throw new Error(`invalid Phenomena DEEP project: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as AnyRecord;
}

export function phenomenaDeepPublicDiscovery(wing = loadPhenomenaDeepWing()): AnyRecord {
  const issues = verifyPhenomenaDeepWing(wing);
  if (issues.length > 0) throw new Error("cannot project discovery from an invalid Exploration DEEP WING");
  const countByAxis = (axis: string) => wing.epistemic_registers.filter((entry: AnyRecord) => entry.axis === axis).length;
  return {
    protocol: wing.protocol,
    wing_id: wing.wing_id,
    title: wing.title,
    url: PHENOMENA_DEEP_WING_URL,
    schema_url: PHENOMENA_DEEP_WING_SCHEMA_URL,
    project_schema_url: PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
    guide_url: PHENOMENA_DEEP_WING_DOCUMENT_URL,
    method: {
      wing: wing.deep_cycle.wing.map((entry: AnyRecord) => entry.id),
      deep: wing.deep_cycle.deep.map((entry: AnyRecord) => entry.id),
      workflow_only: true,
      manifested_nen_ability: false,
    },
    counts: {
      registers: countByAxis("REGISTER"),
      warrants: countByAxis("WARRANT"),
      relations: countByAxis("RELATION"),
      planes: wing.planes.length,
      seams: wing.abstraction_seams.length,
      claims: wing.claim_cards.length,
      equations: wing.equations.length,
      models: wing.model_cards.length,
      math_doors: wing.math_doors.length,
      finite_baselines: wing.finite_baselines.length,
      seed_doors: wing.seed_doors.length,
      established_open_conjectures: wing.seed_doors.filter((entry: AnyRecord) => entry.frontier_status === "ESTABLISHED_OPEN_CONJECTURE").length,
      sources: wing.sources.length,
      bindings: wing.bindings.length,
    },
    integrity: {
      algorithm: wing.integrity.algorithm,
      digest: wing.integrity.digest,
      byte_sha256: PHENOMENA_DEEP_WING_BYTE_SHA256,
    },
    bindings: wing.bindings.map((entry: AnyRecord) => ({ id: entry.id, url: entry.url, relation: entry.relation, authority_imported: entry.authority_imported })),
    boundary: structuredClone(wing.boundaries),
  };
}

export function scaffoldPhenomenaDeepProject(): AnyRecord {
  const project: AnyRecord = {
    $schema: PHENOMENA_DEEP_PROJECT_SCHEMA_ID,
    protocol: PHENOMENA_DEEP_PROJECT_PROTOCOL,
    project_id: "bounded-cross-domain-inquiry",
    version: "0.1.0",
    title: "Bounded cross-domain inquiry",
    evidence_through: "2026-08-14",
    mode: "ANALYZE_ONLY",
    question: "Which named mathematical structure, if any, survives between these two separately defined phenomena?",
    domains: [
      { id: "source-domain", subject: "Declare the source phenomenon", entity_or_unit: "Declare its entities or units", context: "Declare conditions, population, scale, and time window", conditions: ["source conditions are explicit"], observables: ["source observation operator is explicit"], units: ["source units are explicit"], agency: "Declare agency or its absence" },
      { id: "target-domain", subject: "Declare the target phenomenon", entity_or_unit: "Declare its entities or units", context: "Declare conditions, population, scale, and time window", conditions: ["target conditions are explicit"], observables: ["target observation operator is explicit"], units: ["target units are explicit"], agency: "Declare agency or its absence" },
    ],
    source_manifest: [], typed_terms: [], claims: [], bridges: [], models: [], equations: [], falsifiers: [],
    frontier_problems: [], finite_baselines: [], doors: [],
    unknowns: [{ id: "initial-unknown", kind: "UNMAPPED", statement: "No cross-domain relation is established until evidence and a bridge card survive pressure-testing." }],
    philosophy: { participation: "OPT_IN", empirical: false, questions: [], nonclaims: ["No philosophical conclusion is established by this profile."], authority_effect: "NONE" },
    karma: { cosmic_events: [], zerone_events: [], kingdom_receipts: [], adapter_exists: false, conversion_allowed: false, summation_allowed: false, score: null, authority_effect: "NONE" },
    rights: { voluntary: true, valid_exits: ["REST", "SILENCE", "REFUSAL", "PRIVACY", "CORRECTION", "NO_ACTION", "DEPARTURE"], reason_required: false, penalty: false },
    authority: { browse: false, local_write: false, external_write: false, commit: false, push: false, deploy: false, experiment: false, diagnose: false, score_people: false, karma_write: false, automatic_action: false },
    release: { status: "DRAFT", deployed: false, publication_route: null, evidence: [] },
    boundaries: structuredClone(PROJECT_BOUNDARIES),
    integrity: { algorithm: ALGORITHM, digest: null, digest_field_treated_as: null },
  };
  project.integrity.digest = phenomenaDeepProjectDigest(project);
  return project;
}

function usage(): string {
  return [
    "Usage: ./kingdom explore-deep <command> [arguments] [--json]",
    "",
    "Commands:",
    "  overview | cycle | registers | seams | models | doors | karma | sources | discovery",
    "  verify [--json]",
    "  verify-project FILE [--json]",
    "  scaffold [--json]        print an inert, valid project profile to stdout",
    "",
    "Offline and read-only. Validation proves structure and digest, not truth, novelty, safety, or authority.",
  ].join("\n");
}
function output(value: unknown): void { console.log(JSON.stringify(value, null, 2)); }
function verificationPayload(valid: boolean, issues: PhenomenaDeepIssue[], extra: AnyRecord): AnyRecord {
  return { valid, ...extra, issues };
}

export function runExplorePhenomenaDeepCli(argv = process.argv.slice(2)): number {
  const [command, ...rest] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(usage());
    return command ? 0 : 2;
  }
  const known = new Set(["overview", "cycle", "registers", "seams", "models", "doors", "karma", "sources", "discovery", "verify", "verify-project", "scaffold"]);
  if (!known.has(command) || command === "constructor" || command === "toString" || command === "__proto__") {
    console.error(usage());
    return 2;
  }
  try {
    if (command === "scaffold") {
      if (rest.some((entry) => entry !== "--json")) throw new Error("scaffold accepts only --json");
      output(scaffoldPhenomenaDeepProject());
      return 0;
    }
    if (command === "verify-project") {
      const args = rest.filter((entry) => entry !== "--json");
      if (args.length !== 1) throw new Error("verify-project requires exactly one file");
      const { value } = readStrictFile(args[0]!, "Phenomena DEEP project");
      const issues = verifyPhenomenaDeepProject(value);
      output(verificationPayload(issues.length === 0, issues, { protocol: object(value) ? value.protocol : null, project_id: object(value) ? value.project_id : null, digest: object(value) ? value.integrity?.digest ?? null : null }));
      return issues.length === 0 ? 0 : 1;
    }
    if (rest.some((entry) => entry !== "--json")) throw new Error(`${command} accepts only --json`);
    const wing = loadPhenomenaDeepWing();
    if (command === "verify") {
      const issues = verifyPhenomenaDeepWing(wing);
      output(verificationPayload(issues.length === 0, issues, { protocol: wing.protocol, wing_id: wing.wing_id, digest: wing.integrity.digest, byte_sha256: PHENOMENA_DEEP_WING_BYTE_SHA256 }));
      return issues.length === 0 ? 0 : 1;
    }
    const views: Record<string, () => unknown> = Object.create(null);
    views.overview = () => ({ protocol: wing.protocol, wing_id: wing.wing_id, title: wing.title, scope: wing.scope, counts: phenomenaDeepPublicDiscovery(wing).counts, boundaries: wing.boundaries });
    views.cycle = () => wing.deep_cycle;
    views.registers = () => wing.epistemic_registers;
    views.seams = () => wing.abstraction_seams;
    views.models = () => ({ equations: wing.equations, model_cards: wing.model_cards, finite_baselines: wing.finite_baselines });
    views.doors = () => ({ math_doors: wing.math_doors, seed_doors: wing.seed_doors, source_audit: wing.source_audit });
    views.karma = () => ({ philosophy: wing.philosophy, karma: wing.karma, rights: wing.rights, boundaries: wing.boundaries });
    views.sources = () => ({ bindings: wing.bindings, sources: wing.sources });
    views.discovery = () => phenomenaDeepPublicDiscovery(wing);
    if (!Object.hasOwn(views, command)) throw new Error("unknown command");
    output(views[command]!());
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(JSON.stringify({ valid: false, error: message }));
    return command === "verify" || command === "verify-project" ? 1 : 2;
  }
}

if (import.meta.main) process.exitCode = runExplorePhenomenaDeepCli();
