#!/usr/bin/env bun
/** Strict, network-free reader for the immutable Reconstructive Build Kernel. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const RECONSTRUCTIVE_BUILD_PROTOCOL = "kingdom.reconstructive-build-kernel/0.1";
export const RECONSTRUCTIVE_BUILD_SCHEMA_ID = "urn:kingdom:schema:reconstructive-build-kernel:0.1";
export const RECONSTRUCTIVE_BUILD_ID = "reconstructive-build-kernel-2026-08-13";
export const RECONSTRUCTIVE_BUILD_LOCATOR = "data/reconstruction/reconstructive-build-kernel.v0.1.json";
export const RECONSTRUCTIVE_BUILD_PATH = join(ROOT, RECONSTRUCTIVE_BUILD_LOCATOR);
export const RECONSTRUCTIVE_BUILD_SCHEMA_LOCATOR = "schemas/reconstructive-build-kernel-v0.1.schema.json";
export const RECONSTRUCTIVE_BUILD_SCHEMA_PATH = join(ROOT, RECONSTRUCTIVE_BUILD_SCHEMA_LOCATOR);
export const RECONSTRUCTIVE_PROJECT_SCHEMA_LOCATOR = "schemas/reconstructive-project-v0.1.schema.json";
export const RECONSTRUCTIVE_PROJECT_SCHEMA_PATH = join(ROOT, RECONSTRUCTIVE_PROJECT_SCHEMA_LOCATOR);
export const RECONSTRUCTIVE_BUILD_URL = "https://thekingdom.dev/atlases/reconstructive-build-kernel-2026-08-13.json";
export const RECONSTRUCTIVE_BUILD_SCHEMA_URL = "https://thekingdom.dev/schemas/reconstructive-build-kernel/0.1.json";
export const RECONSTRUCTIVE_PROJECT_SCHEMA_URL = "https://thekingdom.dev/schemas/reconstructive-project/0.1.json";
export const RECONSTRUCTIVE_BUILD_DOCUMENT_URL = "https://thekingdom.dev/RECONSTRUCTIVE-BUILD-KERNEL.md";
export const RECONSTRUCTIVE_BUILD_DIGEST = "sha256:265a75e18dbd4bad5bcf07bca0645132de4f9a881d8f0f398cd56b9afb734dd1";
export const RECONSTRUCTIVE_PROJECT_PROTOCOL = "kingdom.reconstructive-project/0.1";
export const RECONSTRUCTIVE_PROJECT_SCHEMA_ID = "urn:kingdom:schema:reconstructive-project:0.1";
export const RECONSTRUCTIVE_BUILD_BYTE_SHA256 = "sha256:2d1598bdfcce2501ee5a7cfdba55f581920d18733052f067e96bf9d79a7376a5";
export const RECONSTRUCTIVE_PROJECT_FIXTURE_DIGEST = "sha256:32cf92f1756185464ce49af42914d6d99b3e4e3e55907e35e8496f23b570d521";

const MAX_BYTES = 1024 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const TOP_KEYS = [
  "$schema", "protocol", "kernel_id", "title", "compiled_on", "evidence_through",
  "scope", "epistemic_registers", "state_spaces", "correspondences",
  "observation_operators", "state_transition_operators", "reconstruction_cases", "realizability_models",
  "landscape_models", "catalysis_models", "equations", "invariants", "claims",
  "analogy_bridges", "build_profile", "feedback_contract", "falsification_tests",
  "unknowns", "bindings", "sources", "boundaries", "integrity",
] as const;
const PROJECT_TOP_KEYS = [
  "$schema", "protocol", "project_id", "version", "title", "kernel_binding",
  "state_spaces", "states", "objectives", "correspondences", "observations",
  "reconstruction_requirements", "realizability_constraints", "transitions",
  "transition_accelerators", "invariants", "uncertainty_policy", "authority",
  "risks", "feedback", "tests", "claims", "sources", "provenance", "release",
  "boundaries", "integrity",
] as const;
const REGISTER_KINDS = [
  "MATHEMATICAL_DEFINITION", "MATHEMATICAL_THEOREM", "OPEN_MATHEMATICAL_CONJECTURE", "EMPIRICAL_SCIENCE",
  "SCIENTIFIC_MODEL", "ANALOGY", "DESIGN_CONSTRAINT", "PHILOSOPHY",
] as const;
const STATE_IDS = [
  "finite-simple-graphs", "graph-vertex-decks", "protein-coordinate-ensembles", "protein-contact-projections",
  "reconstructive-project-states", "reconstructive-project-observations",
] as const;
const CORRESPONDENCE_IDS = [
  "graph-card-correspondence", "protein-index-correspondence",
  "partial-restraint-correspondence", "cross-state-sequence-correspondence",
  "project-artifact-correspondence",
] as const;
const OPERATOR_IDS = ["vertex-deletion-deck", "threshold-contact-projection", "project-evidence-projection"] as const;
const EXPECTED_OPERATORS = [
  { input: "finite-simple-graphs", output: "graph-vertex-decks", equation: "graph-deck-definition", correspondence: "graph-card-correspondence", intervention: "MODEL_DELETE", unchanged: true },
  { input: "protein-coordinate-ensembles", output: "protein-contact-projections", equation: "protein-contact-map", correspondence: "protein-index-correspondence", intervention: "NONE", unchanged: true },
  { input: "reconstructive-project-states", output: "reconstructive-project-observations", equation: "reconstruction-fiber", correspondence: "project-artifact-correspondence", intervention: "NONE", unchanged: true },
] as const;
const STATE_TRANSITION_OPERATOR_IDS = ["physical-sequence-perturbation"] as const;
const CASE_IDS = [
  "classical-graph-reconstruction", "contact-to-coordinate-realization",
  "project-candidate-realization",
] as const;
const EXPECTED_CASES = [
  { operator: "vertex-deletion-deck", target: "finite-simple-graphs", semantics: "FIBER", identifiability: "UNIQUE_CONJECTURED" },
  { operator: "threshold-contact-projection", target: "protein-coordinate-ensembles", semantics: "FIBER", identifiability: "UNDERDETERMINED" },
  { operator: "project-evidence-projection", target: "reconstructive-project-states", semantics: "FIBER", identifiability: "UNKNOWN" },
] as const;
const REALIZATION_IDS = ["exact-euclidean-distance-realization", "contact-restraint-realization"] as const;
const LANDSCAPE_IDS = ["conditional-folding-free-energy", "project-transition-landscape"] as const;
const CATALYSIS_IDS = ["physical-enzyme-barrier-model", "design-transition-accelerator"] as const;
const EQUATION_IDS = [
  "reconstruction-fiber", "graph-deck-definition", "graph-reconstruction-conjecture",
  "kelly-counting", "protein-contact-map",
  "euclidean-distance-gram", "conditional-free-energy", "eyring-rate", "barrier-saving",
  "ensemble-rate", "fiber-monotonicity",
] as const;
const PIPELINE = [
  "STATE", "OBSERVE", "DECLARE_CORRESPONDENCE", "INFER_FIBER", "REALIZE",
  "TRAVERSE_LANDSCAPE", "MEASURE_OR_CATALYZE", "APPEND_FEEDBACK",
] as const;
const SOURCE_IDS = [
  "qi-2026", "mckay-2022", "clifton-2024", "gower-1985", "fakhoury-2024", "ooka-2023",
  "streit-2024", "eyring-1935", "truhlar-2015", "iupac-1996", "du-2025", "zheng-2023", "jara-2025",
] as const;
const SOURCE_URLS = [
  "https://doi.org/10.1016/j.disc.2026.115058",
  "https://arxiv.org/abs/2102.01942",
  "https://doi.org/10.1016/j.disc.2023.113753",
  "https://doi.org/10.1016/0024-3795(85)90187-9",
  "https://doi.org/10.1021/acs.jctc.4c00878",
  "https://doi.org/10.1038/s41467-023-41664-1",
  "https://doi.org/10.1038/s41586-024-07784-4",
  "https://doi.org/10.1063/1.1749604",
  "https://doi.org/10.1016/j.abb.2015.05.004",
  "https://doi.org/10.1351/pac199668010149",
  "https://doi.org/10.1126/science.ado5068",
  "https://doi.org/10.1038/s41557-023-01287-x",
  "https://doi.org/10.7554/eLife.93099.4",
] as const;
const EXPECTED_EQUATIONS = [
  { register: "MATHEMATICAL_DEFINITION", expression: "F_O(y) = {x in X : O(x) = y}/Gamma" },
  { register: "MATHEMATICAL_DEFINITION", expression: "D(G) = multiset{[G-v] : v in V(G)}" },
  { register: "OPEN_MATHEMATICAL_CONJECTURE", expression: "D(G)=D(H) implies G isomorphic to H" },
  { register: "MATHEMATICAL_THEOREM", expression: "N(F,G) = [sum_v N(F,G-v)]/[n-|V(F)|] for |V(F)| < n" },
  { register: "SCIENTIFIC_MODEL", expression: "C^(tau,s)_ij(q) = 1[eligible(i,j) and ||r_i(q)-r_j(q)|| <= tau]" },
  { register: "MATHEMATICAL_THEOREM", expression: "S has an R^3 realization if and only if J = I - 11^T/n and B = -1/2 J S J is positive semidefinite with rank(B) <= 3" },
  { register: "SCIENTIFIC_MODEL", expression: "A(z|c) = -beta^-1 ln integral_Omega delta(z-xi(q)) exp[-beta U(q;c)] dq + C" },
  { register: "SCIENTIFIC_MODEL", expression: "k approximately kappa(k_B T/h) exp[-Delta G^dagger/(R T)]" },
  { register: "SCIENTIFIC_MODEL", expression: "Delta G^dagger_saved = Delta G^dagger_reference - Delta G^dagger_catalyzed approximately R T ln(k_catalyzed/k_reference)" },
  { register: "SCIENTIFIC_MODEL", expression: "k_obs = sum_c p(c) k_c" },
  { register: "MATHEMATICAL_THEOREM", expression: "F_(O1,O2)(y1,y2) = F_O1(y1) intersection F_O2(y2) subseteq F_O1(y1)" },
] as const;
const PERTURBATION_BUILD_RULE = "Never treat a nonperturbing observation or projection as a physical perturbation, or a physical perturbation as an observation of the unchanged state.";
const EXPECTED_BOUNDARIES = {
  read_only: true,
  educational_metadata_only: true,
  contains_no_personal_data: true,
  grc_proven: false,
  protein_fold_prediction: false,
  unique_contact_realization: false,
  biological_mechanism_transfer: false,
  physical_parameter_transfer: false,
  medical_authority: false,
  diagnostic_authority: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  contains_protein_sequence: false,
  project_execution: false,
  project_deployment: false,
  person_scoring: false,
  writes_karma: false,
  creates_karma_receipt: false,
  ecosystem_authority_imported: false,
  economic_effect: false,
  governance_effect: false,
  cosmic_design_proven: false,
  automatic_action: false,
  runtime_network_request: false,
  mcp_surface_added: false,
} as const;
const EXPECTED_PROJECT_BOUNDARIES = {
  read_only: true,
  design_infrastructure_only: true,
  solver_included: false,
  project_execution: false,
  project_deployment: false,
  external_write: false,
  biological_mechanism_transfer: false,
  physical_parameter_transfer: false,
  medical_authority: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  person_scoring: false,
  writes_karma: false,
  creates_karma_receipt: false,
  economic_effect: false,
  governance_effect: false,
  automatic_action: false,
  runtime_network_request: false,
} as const;

export type ReconstructiveBuildIssue = { field: string; code: string };

function safeOwnDataContainer(value: object, prototype: object | null, arrayLength?: number): boolean {
  if (Object.getPrototypeOf(value) !== prototype || Object.getOwnPropertySymbols(value).length !== 0) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors);
  if (keys.some((key) => typeof key !== "string" || key === "__proto__" ||
      !("value" in descriptors[key]!) || (arrayLength === undefined || key !== "length") && descriptors[key]!.enumerable !== true)) return false;
  if (arrayLength === undefined) return true;
  const expected = Array.from({ length: arrayLength }, (_, index) => String(index));
  return keys.length === expected.length + 1 && descriptors.length?.enumerable === false &&
    descriptors.length?.value === arrayLength && expected.every((key) => Object.hasOwn(descriptors, key));
}
function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    safeOwnDataContainer(value, Object.prototype);
}
function jsonArray(value: unknown): value is any[] {
  return Array.isArray(value) && safeOwnDataContainer(value, Array.prototype, value.length);
}
function array(value: unknown): any[] { return jsonArray(value) ? value : []; }
function strictJsonTree(value: unknown, depth = 0, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || depth > 64 || seen.has(value)) return false;
  seen.add(value);
  const isArray = Array.isArray(value);
  if (isArray ? !jsonArray(value) : !object(value)) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (isArray && key === "length") continue;
    if (!("value" in descriptor) || !strictJsonTree(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value);
  return true;
}
function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}
function sameJson(left: unknown, right: unknown): boolean {
  try { return canonicalizeJsonValue(left) === canonicalizeJsonValue(right); } catch { return false; }
}
function exactIds(value: unknown, expected: readonly string[]): boolean {
  return jsonArray(value) && value.length === expected.length &&
    value.every((item, index) => object(item) && item.id === expected[index]);
}
function text(value: unknown, max = 5000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max && value.trim() === value;
}
function id(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && ID.test(value);
}
function strings(value: unknown, min = 1, max = 32): value is string[] {
  return jsonArray(value) && value.length >= min && value.length <= max &&
    value.every((item) => text(item)) && new Set(value).size === value.length;
}
function references(value: unknown, known: Set<string>, allowEmpty = false, max = 32): boolean {
  return jsonArray(value) && (allowEmpty || value.length > 0) && value.length <= max &&
    value.every((item) => typeof item === "string" && known.has(item)) && new Set(value).size === value.length;
}
function validDate(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function semverGreater(candidate: unknown, predecessor: unknown): boolean {
  if (typeof candidate !== "string" || typeof predecessor !== "string") return false;
  const pattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
  const left = pattern.exec(candidate);
  const right = pattern.exec(predecessor);
  if (!left || !right) return false;
  for (let index = 1; index <= 3; index += 1) {
    const leftPart = BigInt(left[index]!);
    const rightPart = BigInt(right[index]!);
    if (leftPart !== rightPart) return leftPart > rightPart;
  }
  return false;
}
function safeHttpsUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.trim() !== value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.username === "" && parsed.password === "" &&
      parsed.hostname.length > 0 && parsed.href === value;
  } catch { return false; }
}
function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { throw new Error("reconstructive-build kernel is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("reconstructive-build kernel must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) throw new Error(`reconstructive-build kernel exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "reconstructive-build kernel JSON");
}

function readProjectUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { throw new Error("reconstructive-project profile is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("reconstructive-project profile must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) throw new Error(`reconstructive-project profile exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "reconstructive-project profile JSON");
}

function uniqueIdSet(value: unknown): Set<string> | null {
  if (!jsonArray(value)) return null;
  const ids = value.map((item) => object(item) ? item.id : undefined);
  if (!ids.every(id) || new Set(ids).size !== ids.length) return null;
  return new Set(ids as string[]);
}

function hasCycle(parentById: Map<string, string | null>): boolean {
  for (const start of parentById.keys()) {
    const seen = new Set<string>();
    let current: string | null | undefined = start;
    while (current !== null && current !== undefined) {
      if (seen.has(current)) return true;
      seen.add(current);
      current = parentById.get(current);
    }
  }
  return false;
}

export function reconstructiveBuildDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("reconstructive-build integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

export function reconstructiveProjectDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("reconstructive-project integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

export function verifyReconstructiveBuildKernel(value: unknown): ReconstructiveBuildIssue[] {
  const issues: ReconstructiveBuildIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!strictJsonTree(value)) return [{ field: "$", code: "non-json-value" }];
    value = structuredClone(value);
  } catch { return [{ field: "$", code: "non-json-value" }]; }
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];
  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== RECONSTRUCTIVE_BUILD_SCHEMA_ID ||
      value.protocol !== RECONSTRUCTIVE_BUILD_PROTOCOL || value.kernel_id !== RECONSTRUCTIVE_BUILD_ID) {
    add("$", "identity-mismatch");
  }
  if (value.title !== "Reconstructive Build Kernel" || value.compiled_on !== "2026-08-13" ||
      value.evidence_through !== "2026-08-13" || !validDate(value.compiled_on)) {
    add("$", "title-or-date-mismatch");
  }
  if (!sameKeys(value.scope, ["focus", "coverage", "intended_use", "excluded_use", "currentness"]) ||
      !text(value.scope?.focus) || !text(value.scope?.coverage) || !text(value.scope?.intended_use) ||
      !text(value.scope?.excluded_use) || value.scope?.currentness !== "selected-evidence-as-of-compilation") {
    add("$.scope", "invalid-scope");
  }

  if (!jsonArray(value.epistemic_registers) || value.epistemic_registers.length !== REGISTER_KINDS.length) {
    add("$.epistemic_registers", "register-count-mismatch");
  }
  for (const [index, register] of array(value.epistemic_registers).entries()) {
    if (!sameKeys(register, ["id", "kind", "meaning", "transfer_rule"]) || !id(register?.id) ||
        register?.kind !== REGISTER_KINDS[index] || !text(register?.meaning) || !text(register?.transfer_rule)) {
      add(`$.epistemic_registers[${index}]`, "invalid-register");
    }
  }
  if (!exactIds(value.state_spaces, STATE_IDS)) add("$.state_spaces", "state-space-order-or-id-mismatch");
  if (!exactIds(value.correspondences, CORRESPONDENCE_IDS)) add("$.correspondences", "correspondence-order-or-id-mismatch");
  if (!exactIds(value.observation_operators, OPERATOR_IDS)) add("$.observation_operators", "operator-order-or-id-mismatch");
  if (!exactIds(value.state_transition_operators, STATE_TRANSITION_OPERATOR_IDS)) add("$.state_transition_operators", "state-transition-order-or-id-mismatch");
  if (!exactIds(value.reconstruction_cases, CASE_IDS)) add("$.reconstruction_cases", "case-order-or-id-mismatch");
  if (!exactIds(value.realizability_models, REALIZATION_IDS)) add("$.realizability_models", "realization-order-or-id-mismatch");
  if (!exactIds(value.landscape_models, LANDSCAPE_IDS)) add("$.landscape_models", "landscape-order-or-id-mismatch");
  if (!exactIds(value.catalysis_models, CATALYSIS_IDS)) add("$.catalysis_models", "catalysis-order-or-id-mismatch");
  if (!exactIds(value.equations, EQUATION_IDS)) add("$.equations", "equation-order-or-id-mismatch");

  const sourceIds = new Set(array(value.sources).map((item) => item?.id).filter((item) => typeof item === "string"));
  const stateIds = new Set(array(value.state_spaces).map((item) => item?.id).filter((item) => typeof item === "string"));
  const correspondenceIds = new Set(array(value.correspondences).map((item) => item?.id).filter((item) => typeof item === "string"));
  const operatorIds = new Set(array(value.observation_operators).map((item) => item?.id).filter((item) => typeof item === "string"));
  const equationIds = new Set(array(value.equations).map((item) => item?.id).filter((item) => typeof item === "string"));
  const invariantIds = new Set(array(value.invariants).map((item) => item?.id).filter((item) => typeof item === "string"));
  if (!exactIds(value.sources, SOURCE_IDS)) add("$.sources", "source-order-or-id-mismatch");
  for (const [index, source] of array(value.sources).entries()) {
    if (!sameKeys(source, ["id", "title", "source_kind", "published_on", "observed_on", "url", "doi", "limitation"]) ||
        !id(source?.id) || !text(source?.title, 800) || !id(source?.source_kind) ||
        !(typeof source?.published_on === "string" && /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(source.published_on)) ||
        !validDate(source?.observed_on) || source?.url !== SOURCE_URLS[index] ||
        !(source?.doi === null || text(source?.doi, 240)) || !text(source?.limitation)) {
      add(`$.sources[${index}]`, "invalid-source");
    }
    if (source?.doi !== null && source?.url !== `https://doi.org/${source?.doi}`) {
      add(`$.sources[${index}].doi`, "doi-url-mismatch");
    }
  }

  const correspondenceKinds = new Set([
    "EXACT_LABELED", "UNLABELED_UP_TO_ISOMORPHISM", "PARTIAL", "INFERRED", "ABSENT", "UNKNOWN",
  ]);
  const carriers = new Set(["VERTEX_ID", "RESIDUE_INDEX", "ATOM_ID", "STATE_ID", "ARTIFACT_ID"]);
  for (const [index, item] of array(value.correspondences).entries()) {
    if (!sameKeys(item, ["id", "from_id", "to_id", "kind", "carrier", "labels_retained", "multiplicity_retained", "overlap_maps_available", "mapping_or_digest", "uncertainty", "basis_ids", "conditions", "nonclaims"]) ||
        !correspondenceKinds.has(item?.kind) || !carriers.has(item?.carrier) || typeof item?.labels_retained !== "boolean" ||
        typeof item?.multiplicity_retained !== "boolean" || typeof item?.overlap_maps_available !== "boolean" ||
        !text(item?.uncertainty) || !references(item?.basis_ids, sourceIds, true) || !strings(item?.conditions) || !strings(item?.nonclaims)) {
      add(`$.correspondences[${index}]`, "invalid-correspondence");
    }
    if (item?.kind === "EXACT_LABELED" && !text(item?.mapping_or_digest)) add(`$.correspondences[${index}]`, "exact-map-required");
    if (["UNLABELED_UP_TO_ISOMORPHISM", "ABSENT"].includes(item?.kind) && item?.mapping_or_digest !== null) {
      add(`$.correspondences[${index}]`, "mapping-forbidden");
    }
    if (!stateIds.has(item?.from_id) || !stateIds.has(item?.to_id)) {
      add(`$.correspondences[${index}]`, "state-space-reference-mismatch");
    }
  }
  const crossState = value.correspondences?.[3];
  if (crossState?.kind !== "PARTIAL" || crossState?.carrier !== "RESIDUE_INDEX" ||
      crossState?.from_id !== "protein-coordinate-ensembles" || crossState?.to_id !== "protein-coordinate-ensembles" ||
      typeof crossState?.mapping_or_digest !== "string" || !crossState.mapping_or_digest.includes("alignment")) {
    add("$.correspondences[3]", "cross-state-correspondence-mismatch");
  }
  for (const [index, item] of array(value.correspondences).entries()) {
    const fromIndex = STATE_IDS.indexOf(item?.from_id);
    const toIndex = STATE_IDS.indexOf(item?.to_id);
    if (fromIndex < 0 || toIndex < 0) continue;
    const expectedDomains: Array<[string, string]> = [
      ["finite-simple-graphs", "graph-vertex-decks"],
      ["protein-coordinate-ensembles", "protein-contact-projections"],
      ["protein-contact-projections", "protein-coordinate-ensembles"],
      ["protein-coordinate-ensembles", "protein-coordinate-ensembles"],
      ["reconstructive-project-states", "reconstructive-project-observations"],
    ];
    if (item.from_id !== expectedDomains[index]?.[0] || item.to_id !== expectedDomains[index]?.[1]) {
      add(`$.correspondences[${index}]`, "correspondence-domain-mismatch");
    }
  }
  for (const [index, operator] of array(value.observation_operators).entries()) {
    const expected = EXPECTED_OPERATORS[index];
    if (!object(operator?.intervention) ||
        !["NONE", "MODEL_DELETE", "PHYSICAL_PERTURBATION"].includes(operator.intervention.kind) ||
        typeof operator.intervention.remaining_relations_guaranteed_unchanged !== "boolean" ||
        !references(operator?.source_ids, sourceIds, true)) add(`$.observation_operators[${index}]`, "invalid-operator");
    if (!expected || operator?.input_state_space_id !== expected.input ||
        operator?.output_state_space_id !== expected.output ||
        operator?.equation_id !== expected.equation ||
        operator?.correspondence_id !== expected.correspondence ||
        operator?.intervention?.kind !== expected.intervention ||
        operator?.intervention?.remaining_relations_guaranteed_unchanged !== expected.unchanged) {
      add(`$.observation_operators[${index}]`, "operator-semantics-mismatch");
    }
    if (!stateIds.has(operator?.input_state_space_id) || !stateIds.has(operator?.output_state_space_id) || !correspondenceIds.has(operator?.correspondence_id) ||
        !(operator?.equation_id === null || equationIds.has(operator?.equation_id))) {
      add(`$.observation_operators[${index}]`, "operator-reference-mismatch");
    }
    if (operator?.intervention?.kind === "PHYSICAL_PERTURBATION" &&
        operator.intervention.remaining_relations_guaranteed_unchanged !== false) {
      add(`$.observation_operators[${index}]`, "perturbation-cannot-preserve-relations");
    }
  }
  const stateTransition = value.state_transition_operators?.[0];
  if (!stateIds.has(stateTransition?.input_state_space_id) || !stateIds.has(stateTransition?.output_state_space_id) ||
      stateTransition?.input_state_space_id !== "protein-coordinate-ensembles" ||
      stateTransition?.output_state_space_id !== "protein-coordinate-ensembles" ||
      stateTransition?.operator_kind !== "PHYSICAL_PERTURBATION" || stateTransition?.equation_id !== null ||
      stateTransition?.correspondence_id !== "cross-state-sequence-correspondence" ||
      stateTransition?.intervention?.kind !== "PHYSICAL_PERTURBATION" ||
      stateTransition?.intervention?.remaining_relations_guaranteed_unchanged !== false ||
      !strings(stateTransition?.change_profile) || !strings(stateTransition?.conditions) ||
      !references(stateTransition?.source_ids, sourceIds, true)) {
    add("$.state_transition_operators[0]", "state-transition-semantics-mismatch");
  }
  for (const [index, reconstructionCase] of array(value.reconstruction_cases).entries()) {
    const expected = EXPECTED_CASES[index];
    if (!expected || reconstructionCase?.observation_operator_id !== expected.operator ||
        reconstructionCase?.target_state_space_id !== expected.target ||
        reconstructionCase?.solution_semantics !== expected.semantics ||
        reconstructionCase?.identifiability !== expected.identifiability) {
      add(`$.reconstruction_cases[${index}]`, "case-semantics-mismatch");
    }
    if (!operatorIds.has(reconstructionCase?.observation_operator_id) ||
        !stateIds.has(reconstructionCase?.target_state_space_id) ||
        !references(reconstructionCase?.correspondence_requirement_ids, correspondenceIds) ||
        !references(reconstructionCase?.invariant_ids, invariantIds) ||
        !strings(reconstructionCase?.constraint_statements) ||
        !references(reconstructionCase?.falsifier_ids, new Set(array(value.falsification_tests).map((item) => item?.id).filter((item) => typeof item === "string")))) {
      add(`$.reconstruction_cases[${index}]`, "case-reference-mismatch");
    }
  }
  const claimIds = new Set(array(value.claims).map((item) => item?.id).filter((item) => typeof item === "string"));
  const falsifierIds = new Set(array(value.falsification_tests).map((item) => item?.id).filter((item) => typeof item === "string"));
  for (const [index, equation] of array(value.equations).entries()) {
    const expected = EXPECTED_EQUATIONS[index];
    if (!expected || equation?.register !== expected.register || equation?.expression !== expected.expression ||
        !strings(equation?.variables) || !strings(equation?.conditions) ||
        !references(equation?.basis_ids, sourceIds, true) || !strings(equation?.does_not_establish)) {
      add(`$.equations[${index}]`, "equation-semantics-mismatch");
    }
  }
  const fiber = value.equations?.[0];
  if (!array(fiber?.conditions).some((item) => typeof item === "string" && item.includes("Gamma acts")) ||
      !array(fiber?.conditions).some((item) => typeof item === "string" && item.includes("invariant"))) {
    add("$.equations[0]", "quotient-action-not-declared");
  }
  const contactEquation = value.equations?.[4];
  if (!String(contactEquation?.expression ?? "").includes("eligible(i,j)") ||
      !array(contactEquation?.conditions).some((item) => typeof item === "string" && item.includes("tau > 0")) ||
      !array(contactEquation?.conditions).some((item) => typeof item === "string" && item.includes("s >= 0"))) {
    add("$.equations[4]", "contact-chain-semantics-mismatch");
  }
  const exactRealization = value.realizability_models?.[0];
  if (exactRealization?.input_type !== "complete-exact-squared-distance-matrix" ||
      !String(exactRealization?.realization_space ?? "").includes("E(3)") ||
      exactRealization?.equation_id !== "euclidean-distance-gram" ||
      exactRealization?.constraints?.[0]?.units !== "distance-squared" ||
      !references(exactRealization?.source_ids, sourceIds)) {
    add("$.realizability_models[0]", "exact-distance-model-mismatch");
  }
  for (const [index, model] of array(value.realizability_models).entries()) {
    if (!(model?.equation_id === null || equationIds.has(model?.equation_id)) ||
        !references(model?.source_ids, sourceIds)) add(`$.realizability_models[${index}]`, "realization-reference-mismatch");
  }
  for (const [index, model] of array(value.landscape_models).entries()) {
    if (!stateIds.has(model?.state_space_id) || !(model?.equation_id === null || equationIds.has(model?.equation_id)) ||
        !references(model?.source_ids, sourceIds, true)) {
      add(`$.landscape_models[${index}]`, "landscape-reference-mismatch");
    }
  }
  for (const [index, model] of array(value.catalysis_models).entries()) {
    if (!references(model?.equation_ids, equationIds, true) || !references(model?.evidence_ids, sourceIds, true) ||
        !references(model?.falsifier_ids, falsifierIds)) {
      add(`$.catalysis_models[${index}]`, "catalysis-reference-mismatch");
    }
  }
  const physicalCatalysis = value.catalysis_models?.[0];
  if (physicalCatalysis?.kind !== "PHYSICAL_ENZYME" || physicalCatalysis?.empirical !== true ||
      physicalCatalysis?.physical_parameter_transfer !== false || physicalCatalysis?.authority_effect !== "NONE" ||
      !array(physicalCatalysis?.conditions).some((item) => typeof item === "string" && item.includes("Matched elementary-step-level")) ||
      !array(physicalCatalysis?.conditions).some((item) => typeof item === "string" && item.includes("Rate constants have the same rate-law dimensions")) ||
      !array(physicalCatalysis?.nonclaims).some((item) => typeof item === "string" && item.includes("turnover kcat"))) {
    add("$.catalysis_models[0]", "physical-catalysis-semantics-mismatch");
  }
  for (const [index, invariant] of array(value.invariants).entries()) {
    if (!REGISTER_KINDS.includes(invariant?.register) || !references(invariant?.basis_ids, sourceIds, true)) {
      add(`$.invariants[${index}]`, "invariant-reference-mismatch");
    }
  }
  for (const [index, claim] of array(value.claims).entries()) {
    if (!REGISTER_KINDS.includes(claim?.register) || !id(claim?.id) || !text(claim?.statement) ||
        !references(claim?.equation_ids, equationIds, true) || !references(claim?.basis_ids, sourceIds, true) ||
        !references(claim?.falsifier_ids, falsifierIds, true)) {
      add(`$.claims[${index}]`, "invalid-claim");
    }
  }
  for (const [index, unknown] of array(value.unknowns).entries()) {
    if (!references(unknown?.basis_ids, sourceIds, true)) add(`$.unknowns[${index}]`, "unknown-source-reference-mismatch");
  }
  for (const [index, falsifier] of array(value.falsification_tests).entries()) {
    if (!id(falsifier?.id) || !text(falsifier?.target) ||
        (!claimIds.has(falsifier.target) && !CASE_IDS.includes(falsifier.target) &&
          !LANDSCAPE_IDS.includes(falsifier.target) && !CATALYSIS_IDS.includes(falsifier.target)) ||
        !text(falsifier?.test) || !text(falsifier?.expected_refusal)) {
      add(`$.falsification_tests[${index}]`, "invalid-falsifier");
    }
  }
  for (const [index, bridge] of array(value.analogy_bridges).entries()) {
    if (bridge?.empirical !== false || bridge?.causal_transfer !== false ||
        bridge?.ontology_transfer !== false || bridge?.parameter_transfer !== false ||
        bridge?.authority_effect !== "NONE" || !strings(bridge?.breaks, 3, 12)) {
      add(`$.analogy_bridges[${index}]`, "analogy-firewall-mismatch");
    }
  }
  const designCatalysis = value.catalysis_models?.[1];
  if (designCatalysis?.kind !== "DESIGN_TRANSITION_ACCELERATOR" || designCatalysis?.empirical !== false ||
      designCatalysis?.physical_parameter_transfer !== false || designCatalysis?.authority_effect !== "NONE") {
    add("$.catalysis_models[1]", "design-catalysis-firewall-mismatch");
  }
  if (!sameJson(value.build_profile?.pipeline, PIPELINE) || value.build_profile?.execution !== false ||
      value.build_profile?.network_required !== false ||
      value.build_profile?.project_schema !== RECONSTRUCTIVE_PROJECT_SCHEMA_URL ||
      !array(value.build_profile?.rules).includes(PERTURBATION_BUILD_RULE)) {
    add("$.build_profile", "build-profile-mismatch");
  }
  if (value.feedback_contract?.append_only !== true || value.feedback_contract?.supersede_not_mutate !== true ||
      value.feedback_contract?.challengeable !== true || value.feedback_contract?.correction_allowed !== true ||
      value.feedback_contract?.physical_perturbations_create_new_state_ids !== true ||
      value.feedback_contract?.automatic_action !== false ||
      !sameJson(value.feedback_contract?.valid_exits, ["REST", "SILENCE", "REFUSAL", "NO_ACTION", "DEPARTURE"]) ||
      value.feedback_contract?.karma?.non_summable !== true ||
      value.feedback_contract?.karma?.adapter_exists !== false ||
      !sameJson(value.feedback_contract?.karma?.zerone_events, []) ||
      !sameJson(value.feedback_contract?.karma?.kingdom_receipts, [])) {
    add("$.feedback_contract", "feedback-contract-mismatch");
  }
  for (const [index, binding] of array(value.bindings).entries()) {
    if (!id(binding?.id) || !text(binding?.url) || !SHA256.test(binding?.byte_sha256 ?? "") ||
        !(binding?.semantic_digest === null || SHA256.test(binding?.semantic_digest ?? "")) ||
        binding?.mutated !== false || binding?.authority_imported !== false || binding?.write_authorized !== false) {
      add(`$.bindings[${index}]`, "binding-mismatch");
    }
  }
  if (!sameJson(value.boundaries, EXPECTED_BOUNDARIES)) add("$.boundaries", "boundary-mismatch");
  if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== ALGORITHM ||
      !SHA256.test(value.integrity?.digest ?? "")) {
    add("$.integrity", "integrity-envelope-mismatch");
  } else {
    try {
      if (value.integrity.digest !== reconstructiveBuildDigest(value)) add("$.integrity.digest", "digest-mismatch");
    } catch {
      add("$.integrity.digest", "digest-unavailable");
    }
    if (value.integrity.digest !== RECONSTRUCTIVE_BUILD_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
  }
  return issues;
}

export function verifyReconstructiveProject(value: unknown): ReconstructiveBuildIssue[] {
  const issues: ReconstructiveBuildIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  const projectStrings = (items: unknown, min = 1) => strings(items, min, 64);
  const projectReferences = (items: unknown, known: Set<string>, allowEmpty = false) =>
    references(items, known, allowEmpty, 64);
  try {
    if (!strictJsonTree(value)) return [{ field: "$", code: "non-json-value" }];
    value = structuredClone(value);
  } catch { return [{ field: "$", code: "non-json-value" }]; }
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];
  if (!sameKeys(value, PROJECT_TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== RECONSTRUCTIVE_PROJECT_SCHEMA_ID || value.protocol !== RECONSTRUCTIVE_PROJECT_PROTOCOL ||
      !id(value.project_id) || !text(value.title) ||
      !(typeof value.version === "string" && value.version.length <= 64 && /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(value.version))) {
    add("$", "identity-mismatch");
  }

  const binding = value.kernel_binding;
  if (!sameKeys(binding, ["protocol", "url", "byte_sha256", "semantic_digest", "relation", "mutated", "authority_imported"]) ||
      binding?.protocol !== RECONSTRUCTIVE_BUILD_PROTOCOL || binding?.url !== RECONSTRUCTIVE_BUILD_URL ||
      binding?.byte_sha256 !== RECONSTRUCTIVE_BUILD_BYTE_SHA256 || binding?.semantic_digest !== RECONSTRUCTIVE_BUILD_DIGEST ||
      binding?.relation !== "PROFILE_OF" || binding?.mutated !== false || binding?.authority_imported !== false) {
    add("$.kernel_binding", "kernel-binding-mismatch");
  }

  const collections = [
    "state_spaces", "states", "objectives", "correspondences", "observations",
    "reconstruction_requirements", "realizability_constraints", "transitions",
    "transition_accelerators", "invariants", "risks", "tests", "claims", "sources",
  ] as const;
  const idsByCollection = new Map<string, Set<string>>();
  const cardinalities: Record<string, [number, number]> = {
    state_spaces: [1, 32], states: [1, 64], objectives: [1, 32], correspondences: [1, 32],
    observations: [1, 64], reconstruction_requirements: [1, 32], realizability_constraints: [1, 64],
    transitions: [1, 32], transition_accelerators: [0, 32], invariants: [1, 64], risks: [1, 64],
    tests: [1, 64], claims: [0, 64], sources: [0, 64],
  };
  for (const key of collections) {
    const ids = uniqueIdSet(value[key]);
    const [min, max] = cardinalities[key]!;
    if (!ids || !jsonArray(value[key]) || value[key].length < min || value[key].length > max) add(`$.${key}`, "invalid-cardinality-or-duplicate-id");
    else idsByCollection.set(key, ids);
  }
  const globalIds = new Set<string>();
  for (const key of collections) {
    for (const item of array(value[key])) {
      if (id(item?.id)) {
        if (globalIds.has(item.id)) add(`$.${key}.${item.id}`, "cross-collection-id-collision");
        globalIds.add(item.id);
      }
    }
  }
  const stateSpaceIds = idsByCollection.get("state_spaces") ?? new Set<string>();
  const stateIds = idsByCollection.get("states") ?? new Set<string>();
  const correspondenceIds = idsByCollection.get("correspondences") ?? new Set<string>();
  const observationIds = idsByCollection.get("observations") ?? new Set<string>();
  const constraintIds = idsByCollection.get("realizability_constraints") ?? new Set<string>();
  const transitionIds = idsByCollection.get("transitions") ?? new Set<string>();
  const invariantIds = idsByCollection.get("invariants") ?? new Set<string>();
  const testIds = idsByCollection.get("tests") ?? new Set<string>();
  const sourceIds = idsByCollection.get("sources") ?? new Set<string>();
  const stateOrSpaceIds = new Set([...stateSpaceIds, ...stateIds]);

  const evidenceIds = new Set([...sourceIds, ...observationIds]);
  const checkEvidence = (items: unknown, field: string) => {
    if (!projectReferences(items, evidenceIds, true)) add(field, "evidence-reference-mismatch");
  };
  for (const [index, space] of array(value.state_spaces).entries()) {
    if (!sameKeys(space, ["id", "definition", "symmetry", "conditions", "source_ids"]) ||
        !text(space?.definition) || !text(space?.symmetry) || !projectStrings(space?.conditions) ||
        !projectReferences(space?.source_ids, sourceIds, true)) add(`$.state_spaces[${index}]`, "invalid-state-space");
  }

  const parentByState = new Map<string, string | null>();
  const stateById = new Map<string, any>();
  for (const [index, state] of array(value.states).entries()) {
    if (!sameKeys(state, ["id", "state_space_id", "version", "conditions", "value_digest", "supersedes_state_id"]) ||
        !stateSpaceIds.has(state?.state_space_id) ||
        !(typeof state?.version === "string" && state.version.length <= 64 && /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(state.version)) ||
        !projectStrings(state?.conditions) || !(state?.value_digest === null || SHA256.test(state?.value_digest ?? "")) ||
        !(state?.supersedes_state_id === null || stateIds.has(state?.supersedes_state_id)) ||
        state?.supersedes_state_id === state?.id) {
      add(`$.states[${index}]`, "invalid-state");
    }
    if (id(state?.id)) {
      parentByState.set(state.id, state.supersedes_state_id ?? null);
      stateById.set(state.id, state);
    }
  }
  if (hasCycle(parentByState)) add("$.states", "supersession-cycle");
  for (const [stateId, parentId] of parentByState) {
    if (parentId) {
      const parent = stateById.get(parentId);
      const state = stateById.get(stateId);
      if (parent?.state_space_id !== state?.state_space_id) add(`$.states.${stateId}`, "cross-space-supersession");
      if (!semverGreater(state?.version, parent?.version)) add(`$.states.${stateId}`, "non-increasing-successor-version");
    }
  }

  for (const [index, objective] of array(value.objectives).entries()) {
    if (!sameKeys(objective, ["id", "statement", "success_evidence", "status", "source_ids"]) ||
        !text(objective?.statement) || !projectStrings(objective?.success_evidence) ||
        !["PROPOSED", "ACTIVE", "ACHIEVED", "BLOCKED", "UNKNOWN"].includes(objective?.status) ||
        !projectReferences(objective?.source_ids, sourceIds, true)) add(`$.objectives[${index}]`, "invalid-objective");
  }
  for (const [index, correspondence] of array(value.correspondences).entries()) {
    if (!sameKeys(correspondence, ["id", "from_id", "to_id", "kind", "carrier", "labels_retained", "multiplicity_retained", "overlap_maps_available", "mapping_or_digest", "uncertainty", "basis_ids", "conditions", "nonclaims"]) ||
        !stateOrSpaceIds.has(correspondence?.from_id) || !stateOrSpaceIds.has(correspondence?.to_id) ||
        !["EXACT_LABELED", "UNLABELED_UP_TO_ISOMORPHISM", "PARTIAL", "INFERRED", "ABSENT", "UNKNOWN"].includes(correspondence?.kind) ||
        !["VERTEX_ID", "RESIDUE_INDEX", "ATOM_ID", "STATE_ID", "ARTIFACT_ID"].includes(correspondence?.carrier) ||
        typeof correspondence?.labels_retained !== "boolean" || typeof correspondence?.multiplicity_retained !== "boolean" ||
        typeof correspondence?.overlap_maps_available !== "boolean" ||
        !(correspondence?.mapping_or_digest === null || text(correspondence?.mapping_or_digest)) ||
        !text(correspondence?.uncertainty) ||
        !projectReferences(correspondence?.basis_ids, sourceIds, true) || !projectStrings(correspondence?.conditions) || !projectStrings(correspondence?.nonclaims) ||
        (correspondence?.kind === "EXACT_LABELED" && !text(correspondence?.mapping_or_digest)) ||
        (correspondence?.kind === "EXACT_LABELED" && (correspondence?.labels_retained !== true || correspondence?.overlap_maps_available !== true)) ||
        (["UNLABELED_UP_TO_ISOMORPHISM", "ABSENT"].includes(correspondence?.kind) &&
          (correspondence?.mapping_or_digest !== null || correspondence?.labels_retained !== false)) ||
        (correspondence?.kind === "ABSENT" && correspondence?.overlap_maps_available !== false)) {
      add(`$.correspondences[${index}]`, "invalid-correspondence");
    }
  }
  for (const [index, observation] of array(value.observations).entries()) {
    const intervention = observation?.intervention;
    const expectedIntervention = observation?.operator_kind === "PROJECTION" ? ["NONE", true]
      : observation?.operator_kind === "MODEL_DELETE" ? ["MODEL_DELETE", true]
      : null;
    const observedStateSpace = stateById.get(observation?.state_id)?.state_space_id;
    const observationCorrespondence = array(value.correspondences).find((item) => item?.id === observation?.correspondence_id);
    if (!sameKeys(observation, ["id", "state_id", "output_state_space_id", "output_type", "operator_kind", "correspondence_id", "evidence_class", "value_digest", "loss_profile", "intervention", "conditions", "source_ids"]) ||
        !sameKeys(intervention, ["kind", "remaining_relations_guaranteed_unchanged"]) ||
        !stateIds.has(observation?.state_id) || !stateSpaceIds.has(observation?.output_state_space_id) || !id(observation?.output_type) ||
        !correspondenceIds.has(observation?.correspondence_id) ||
        observationCorrespondence?.from_id !== observedStateSpace ||
        observationCorrespondence?.to_id !== observation?.output_state_space_id ||
        !expectedIntervention || intervention?.kind !== expectedIntervention[0] ||
        intervention?.remaining_relations_guaranteed_unchanged !== expectedIntervention[1] ||
        !["OBSERVED", "REPORTED", "INFERRED", "UNKNOWN"].includes(observation?.evidence_class) ||
        !(observation?.value_digest === null || SHA256.test(observation?.value_digest ?? "")) ||
        (["OBSERVED", "REPORTED"].includes(observation?.evidence_class) && !SHA256.test(observation?.value_digest ?? "")) ||
        !projectStrings(observation?.loss_profile) || !projectStrings(observation?.conditions) ||
        !projectReferences(observation?.source_ids, sourceIds, true)) add(`$.observations[${index}]`, "invalid-observation");
  }
  for (const [index, requirement] of array(value.reconstruction_requirements).entries()) {
    const selectedObservations = array(value.observations).filter((observation) =>
      jsonArray(requirement?.observation_ids) && requirement.observation_ids.includes(observation?.id));
    const selectedCorrespondenceIds = new Set(array(requirement?.correspondence_requirement_ids));
    const targetState = stateById.get(requirement?.target_state_id);
    const inverseProblemClosed = targetState?.state_space_id === requirement?.target_state_space_id &&
      selectedObservations.length === array(requirement?.observation_ids).length &&
      selectedObservations.every((observation) => {
        const sourceSpace = stateById.get(observation?.state_id)?.state_space_id;
        const correspondence = array(value.correspondences).find((item) => item?.id === observation?.correspondence_id);
        return observation?.state_id === requirement?.target_state_id &&
          sourceSpace === requirement?.target_state_space_id &&
          selectedCorrespondenceIds.has(observation?.correspondence_id) &&
          correspondence?.from_id === requirement?.target_state_space_id &&
          correspondence?.to_id === observation?.output_state_space_id;
      }) && array(requirement?.correspondence_requirement_ids).every((correspondenceId) => {
        const correspondence = array(value.correspondences).find((item) => item?.id === correspondenceId);
        return correspondence?.from_id === requirement?.target_state_space_id &&
          selectedObservations.some((observation) => observation.output_state_space_id === correspondence?.to_id);
      });
    const fiberStatusCoherent =
      (requirement?.identifiability !== "INFEASIBLE" || requirement?.fiber_status === "EMPTY") &&
      (requirement?.identifiability !== "UNIQUE_PROVEN" || requirement?.fiber_status === "UNIQUE") &&
      (requirement?.identifiability !== "UNIQUE_CONJECTURED" || ["UNIQUE", "UNKNOWN"].includes(requirement?.fiber_status)) &&
      (requirement?.identifiability !== "MULTIPLE_WITNESSED" || requirement?.fiber_status === "MULTIPLE") &&
      (requirement?.identifiability !== "UNDERDETERMINED" || ["MULTIPLE", "UNKNOWN"].includes(requirement?.fiber_status));
    if (!sameKeys(requirement, ["id", "observation_ids", "target_state_id", "target_state_space_id", "quotient_symmetry", "solution_semantics", "identifiability", "fiber_status", "correspondence_requirement_ids", "invariant_ids", "constraint_ids", "solver_status", "validation_metrics", "nonclaims"]) ||
        !projectReferences(requirement?.observation_ids, observationIds) || !stateIds.has(requirement?.target_state_id) ||
        !stateSpaceIds.has(requirement?.target_state_space_id) ||
        !text(requirement?.quotient_symmetry) || requirement?.solution_semantics !== "FIBER" ||
        !["UNIQUE_PROVEN", "UNIQUE_CONJECTURED", "MULTIPLE_WITNESSED", "INFEASIBLE", "UNDERDETERMINED", "UNKNOWN"].includes(requirement?.identifiability) ||
        !["EMPTY", "UNIQUE", "MULTIPLE", "UNKNOWN"].includes(requirement?.fiber_status) ||
        !projectReferences(requirement?.correspondence_requirement_ids, correspondenceIds) || !inverseProblemClosed || !fiberStatusCoherent ||
        !projectReferences(requirement?.invariant_ids, invariantIds) || !projectReferences(requirement?.constraint_ids, constraintIds) ||
        !text(requirement?.solver_status) || !projectStrings(requirement?.validation_metrics) || !projectStrings(requirement?.nonclaims)) {
      add(`$.reconstruction_requirements[${index}]`, "invalid-reconstruction-requirement");
    }
  }
  for (const [index, constraint] of array(value.realizability_constraints).entries()) {
    if (!sameKeys(constraint, ["id", "kind", "expression", "tolerance", "units", "status", "evidence_ids", "conditions"]) ||
        !id(constraint?.kind) || !text(constraint?.expression) || !text(constraint?.tolerance) || !text(constraint?.units) ||
        !["SATISFIED", "VIOLATED", "UNKNOWN"].includes(constraint?.status) || !projectStrings(constraint?.conditions)) {
      add(`$.realizability_constraints[${index}]`, "invalid-realizability-constraint");
    }
    checkEvidence(constraint?.evidence_ids, `$.realizability_constraints[${index}].evidence_ids`);
  }

  const transitionById = new Map<string, any>();
  const stateChangingTargetIds = new Set<string>();
  for (const [index, transition] of array(value.transitions).entries()) {
    if (!sameKeys(transition, ["id", "from_state_id", "to_state_id", "kind", "conditions", "endpoint_invariants", "comparator_id", "reversible", "authority_required", "evidence_ids", "nonclaims"]) ||
        !stateIds.has(transition?.from_state_id) || !stateIds.has(transition?.to_state_id) ||
        !["STATE_CHANGE", "EVIDENCE_UPDATE"].includes(transition?.kind) ||
        (transition?.kind === "STATE_CHANGE" && transition?.from_state_id === transition?.to_state_id) ||
        (transition?.kind === "STATE_CHANGE" && stateById.get(transition?.to_state_id)?.supersedes_state_id !== transition?.from_state_id) ||
        (transition?.kind === "EVIDENCE_UPDATE" && transition?.from_state_id !== transition?.to_state_id) ||
        !projectReferences(transition?.endpoint_invariants, invariantIds) || !projectStrings(transition?.conditions) ||
        !(transition?.comparator_id === null || id(transition?.comparator_id)) || typeof transition?.reversible !== "boolean" ||
        !projectStrings(transition?.authority_required) || !projectStrings(transition?.nonclaims)) {
      add(`$.transitions[${index}]`, "invalid-transition");
    }
    checkEvidence(transition?.evidence_ids, `$.transitions[${index}].evidence_ids`);
    if (id(transition?.id)) transitionById.set(transition.id, transition);
    if (transition?.kind === "STATE_CHANGE" && stateIds.has(transition?.to_state_id)) stateChangingTargetIds.add(transition.to_state_id);
  }
  for (const [index, accelerator] of array(value.transition_accelerators).entries()) {
    const transition = transitionById.get(accelerator?.transition_id);
    if (!sameKeys(accelerator, ["id", "kind", "transition_id", "comparator_id", "barrier_definition", "endpoint_invariant", "conditions", "metric", "empirical", "physical_parameter_transfer", "authority_effect", "reversible", "evidence_ids", "falsifier_ids", "nonclaims"]) ||
        !transition || accelerator?.kind !== "DESIGN_TRANSITION_ACCELERATOR" ||
        accelerator?.comparator_id !== transition?.comparator_id || accelerator?.empirical !== false ||
        accelerator?.physical_parameter_transfer !== false || accelerator?.authority_effect !== "NONE" ||
        accelerator?.reversible !== true || !id(accelerator?.comparator_id) ||
        !text(accelerator?.barrier_definition) || !text(accelerator?.endpoint_invariant) ||
        !projectStrings(accelerator?.conditions) || !text(accelerator?.metric) ||
        !projectReferences(accelerator?.falsifier_ids, testIds) ||
        !array(accelerator?.falsifier_ids).every((testId) => array(value.tests).some((test) => test?.id === testId && test?.kind === "FALSIFIER")) ||
        !projectStrings(accelerator?.nonclaims)) {
      add(`$.transition_accelerators[${index}]`, "invalid-transition-accelerator");
    }
    checkEvidence(accelerator?.evidence_ids, `$.transition_accelerators[${index}].evidence_ids`);
  }
  for (const [index, invariant] of array(value.invariants).entries()) {
    if (!sameKeys(invariant, ["id", "statement", "status", "evidence_ids"]) ||
        !text(invariant?.statement) || !["HELD", "VIOLATED", "UNKNOWN"].includes(invariant?.status)) add(`$.invariants[${index}]`, "invalid-invariant");
    checkEvidence(invariant?.evidence_ids, `$.invariants[${index}].evidence_ids`);
  }
  for (const [index, risk] of array(value.risks).entries()) {
    if (!sameKeys(risk, ["id", "statement", "likelihood", "impact", "mitigations", "status", "evidence_ids"]) ||
        !text(risk?.statement) || !["UNKNOWN", "LOW", "MEDIUM", "HIGH"].includes(risk?.likelihood) ||
        !["UNKNOWN", "LOW", "MEDIUM", "HIGH"].includes(risk?.impact) || !projectStrings(risk?.mitigations) ||
        !["OPEN", "MITIGATED", "ACCEPTED", "UNKNOWN"].includes(risk?.status)) add(`$.risks[${index}]`, "invalid-risk");
    checkEvidence(risk?.evidence_ids, `$.risks[${index}].evidence_ids`);
  }
  for (const [index, test] of array(value.tests).entries()) {
    if (!sameKeys(test, ["id", "kind", "procedure", "expected", "status", "evidence_ids"]) ||
        !["INVARIANT", "FALSIFIER", "SCHEMA", "REVIEW"].includes(test?.kind) ||
        !text(test?.procedure) || !text(test?.expected) ||
        !["PENDING", "PASS", "FAIL", "UNKNOWN"].includes(test?.status)) add(`$.tests[${index}]`, "invalid-test");
    checkEvidence(test?.evidence_ids, `$.tests[${index}].evidence_ids`);
  }
  for (const [index, claim] of array(value.claims).entries()) {
    const statuses: Record<string, readonly string[]> = {
      MATHEMATICAL_DEFINITION: ["ADOPTED", "UNKNOWN"],
      MATHEMATICAL_THEOREM: ["PROVEN", "UNKNOWN"],
      OPEN_MATHEMATICAL_CONJECTURE: ["OPEN", "UNKNOWN"],
      EMPIRICAL_SCIENCE: ["SOURCE_BOUND", "UNKNOWN"],
      SCIENTIFIC_MODEL: ["MODEL_BOUND", "UNKNOWN"],
      ANALOGY: ["NON_EMPIRICAL", "UNKNOWN"],
      DESIGN_CONSTRAINT: ["ADOPTED", "UNKNOWN"],
      PHILOSOPHY: ["OPT_IN", "NON_EMPIRICAL", "UNKNOWN"],
    };
    if (!sameKeys(claim, ["id", "register", "statement", "status", "conditions", "source_ids", "nonclaims"]) ||
        !REGISTER_KINDS.includes(claim?.register) || !text(claim?.statement) ||
        !(statuses[claim?.register] ?? []).includes(claim?.status) ||
        ((claim?.status === "SOURCE_BOUND" || claim?.register === "EMPIRICAL_SCIENCE") &&
          !projectReferences(claim?.source_ids, sourceIds)) ||
        !projectStrings(claim?.conditions) ||
        !projectReferences(claim?.source_ids, sourceIds, true) || !projectStrings(claim?.nonclaims)) add(`$.claims[${index}]`, "invalid-claim");
  }
  for (const [index, source] of array(value.sources).entries()) {
    if (!sameKeys(source, ["id", "title", "url", "observed_on", "limitation"]) || !text(source?.title) ||
        !safeHttpsUrl(source?.url) || !validDate(source?.observed_on) || !text(source?.limitation)) {
      add(`$.sources[${index}]`, "invalid-source");
    }
  }
  if (!sameKeys(value.provenance, ["created_on", "created_by", "source_ids", "previous_version", "notes"]) ||
      !validDate(value.provenance?.created_on) || !text(value.provenance?.created_by) ||
      !projectReferences(value.provenance?.source_ids, sourceIds, true) ||
      !(value.provenance?.previous_version === null || text(value.provenance?.previous_version)) ||
      !projectStrings(value.provenance?.notes)) {
    add("$.provenance", "invalid-provenance");
  }

  const feedbackEventIds = uniqueIdSet(value.feedback?.events);
  if (!feedbackEventIds || !jsonArray(value.feedback?.events) || value.feedback.events.length > 64) {
    add("$.feedback.events", "invalid-cardinality-or-duplicate-id");
  }
  const priorEvents = new Set<string>();
  for (const [index, event] of array(value.feedback?.events).entries()) {
    if (id(event?.id)) {
      if (globalIds.has(event.id)) add(`$.feedback.events.${event.id}`, "cross-collection-id-collision");
      globalIds.add(event.id);
    }
    const allowedEffects: Record<string, readonly string[]> = {
      OBSERVATION: ["NONE", "NARROWS_FIBER"],
      CHALLENGE: ["NONE"],
      CORRECTION: ["NONE", "NARROWS_FIBER", "WIDENS_FIBER"],
      SUPERSESSION: ["CREATES_NEW_STATE"],
    };
    const eventEvidenceMatchesState = array(event?.evidence_ids).every((evidenceId) => {
      const observation = array(value.observations).find((item) => item?.id === evidenceId);
      return !observation || observation.state_id === event?.state_id;
    });
    if (!sameKeys(event, ["id", "kind", "state_id", "evidence_ids", "supersedes", "effect", "note"]) ||
        !stateIds.has(event?.state_id) || !["OBSERVATION", "CHALLENGE", "CORRECTION", "SUPERSESSION"].includes(event?.kind) ||
        !(event?.supersedes === null || priorEvents.has(event?.supersedes)) ||
        !(allowedEffects[event?.kind] ?? []).includes(event?.effect) ||
        (event?.effect === "CREATES_NEW_STATE" && !stateChangingTargetIds.has(event?.state_id)) ||
        !eventEvidenceMatchesState || !text(event?.note)) {
      add(`$.feedback.events[${index}]`, "invalid-feedback-event");
    }
    checkEvidence(event?.evidence_ids, `$.feedback.events[${index}].evidence_ids`);
    if (id(event?.id)) priorEvents.add(event.id);
  }
  if (!sameKeys(value.uncertainty_policy, ["fiber_statuses", "unknown_not_coerced", "ambiguity_preserved", "condition_drift_new_version", "physical_perturbation_new_state", "notes"]) ||
      value.uncertainty_policy?.unknown_not_coerced !== true || value.uncertainty_policy?.ambiguity_preserved !== true ||
      value.uncertainty_policy?.condition_drift_new_version !== true || value.uncertainty_policy?.physical_perturbation_new_state !== true ||
      !sameJson(value.uncertainty_policy?.fiber_statuses, ["EMPTY", "UNIQUE", "MULTIPLE", "UNKNOWN"]) ||
      !projectStrings(value.uncertainty_policy?.notes)) add("$.uncertainty_policy", "uncertainty-policy-mismatch");
  if (!sameKeys(value.authority, ["profile_inert", "human_review_required", "grants_authority", "execute", "deploy", "external_write", "karma_write", "automatic_action", "allowed"]) ||
      value.authority?.profile_inert !== true || value.authority?.human_review_required !== true ||
      value.authority?.grants_authority !== false || value.authority?.execute !== false || value.authority?.deploy !== false ||
      value.authority?.external_write !== false || value.authority?.karma_write !== false || value.authority?.automatic_action !== false ||
      !sameJson(value.authority?.allowed, ["offline validation", "human review"])) add("$.authority", "authority-mismatch");
  if (!sameKeys(value.feedback, ["append_only", "supersede_not_mutate", "challengeable", "correction_allowed", "reversible_actions_preferred", "valid_exits", "events", "karma", "automatic_action"]) ||
      !sameKeys(value.feedback?.karma, ["zerone_events", "kingdom_receipts", "non_summable", "adapter_exists", "score", "authority_effect"]) ||
      value.feedback?.append_only !== true || value.feedback?.supersede_not_mutate !== true || value.feedback?.challengeable !== true ||
      value.feedback?.reversible_actions_preferred !== true ||
      value.feedback?.correction_allowed !== true || value.feedback?.automatic_action !== false ||
      !sameJson(value.feedback?.valid_exits, ["REST", "SILENCE", "REFUSAL", "NO_ACTION", "DEPARTURE"]) ||
      value.feedback?.karma?.non_summable !== true || value.feedback?.karma?.adapter_exists !== false ||
      value.feedback?.karma?.score !== null || value.feedback?.karma?.authority_effect !== "NONE" ||
      !sameJson(value.feedback?.karma?.zerone_events, []) || !sameJson(value.feedback?.karma?.kingdom_receipts, [])) {
    add("$.feedback", "feedback-boundary-mismatch");
  }
  if (!sameJson(value.boundaries, EXPECTED_PROJECT_BOUNDARIES)) add("$.boundaries", "boundary-mismatch");
  if (!sameKeys(value.release, ["status", "artifact_url", "byte_sha256", "deployed", "deployment_authority"]) ||
      value.release?.deployed !== false || value.release?.deployment_authority !== false ||
      !["DRAFT", "REVIEWED", "RELEASED", "RETIRED"].includes(value.release?.status) ||
      !(value.release?.artifact_url === null || safeHttpsUrl(value.release?.artifact_url)) ||
      !(value.release?.byte_sha256 === null || SHA256.test(value.release?.byte_sha256 ?? ""))) add("$.release", "release-authority-mismatch");
  if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== ALGORITHM ||
      !SHA256.test(value.integrity?.digest ?? "")) add("$.integrity", "integrity-envelope-mismatch");
  else {
    try { if (value.integrity.digest !== reconstructiveProjectDigest(value)) add("$.integrity.digest", "digest-mismatch"); }
    catch { add("$.integrity.digest", "digest-unavailable"); }
  }
  return issues;
}

export function loadReconstructiveBuildKernel(path = RECONSTRUCTIVE_BUILD_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyReconstructiveBuildKernel(value);
  if (issues.length) {
    throw new Error(`reconstructive-build kernel refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  }
  return value as Record<string, any>;
}

export function loadReconstructiveProject(path: string): Record<string, any> {
  const value = readProjectUnchecked(path);
  const issues = verifyReconstructiveProject(value);
  if (issues.length) {
    throw new Error(`reconstructive-project profile refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  }
  return value as Record<string, any>;
}

export function reconstructiveBuildPublicDiscovery(value = loadReconstructiveBuildKernel()): Record<string, any> {
  return {
    protocol: value.protocol,
    kernel_id: value.kernel_id,
    title: value.title,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: RECONSTRUCTIVE_BUILD_URL,
    schema: RECONSTRUCTIVE_BUILD_SCHEMA_URL,
    project_schema: RECONSTRUCTIVE_PROJECT_SCHEMA_URL,
    guide: RECONSTRUCTIVE_BUILD_DOCUMENT_URL,
    counts: {
      registers: value.epistemic_registers.length,
      state_spaces: value.state_spaces.length,
      correspondences: value.correspondences.length,
      observation_operators: value.observation_operators.length,
      state_transition_operators: value.state_transition_operators.length,
      reconstruction_cases: value.reconstruction_cases.length,
      realizability_models: value.realizability_models.length,
      landscape_models: value.landscape_models.length,
      catalysis_models: value.catalysis_models.length,
      equations: value.equations.length,
      claims: value.claims.length,
      falsification_tests: value.falsification_tests.length,
      sources: value.sources.length,
    },
    pipeline: value.build_profile.pipeline,
    integrity: value.integrity,
    boundary: {
      read_only: value.boundaries.read_only,
      grc_proven: value.boundaries.grc_proven,
      protein_fold_prediction: value.boundaries.protein_fold_prediction,
      unique_contact_realization: value.boundaries.unique_contact_realization,
      biological_mechanism_transfer: value.boundaries.biological_mechanism_transfer,
      physical_parameter_transfer: value.boundaries.physical_parameter_transfer,
      medical_authority: value.boundaries.medical_authority,
      experiment_authority: value.boundaries.experiment_authority,
      project_execution: value.boundaries.project_execution,
      project_deployment: value.boundaries.project_deployment,
      person_scoring: value.boundaries.person_scoring,
      writes_karma: value.boundaries.writes_karma,
      creates_karma_receipt: value.boundaries.creates_karma_receipt,
      ecosystem_authority_imported: value.boundaries.ecosystem_authority_imported,
      cosmic_design_proven: value.boundaries.cosmic_design_proven,
      automatic_action: value.boundaries.automatic_action,
      mcp_surface_added: value.boundaries.mcp_surface_added,
    },
  };
}

function output(value: unknown, json: boolean): void {
  if (json) console.log(JSON.stringify(value, null, 2));
  else if (typeof value === "string") process.stdout.write(value.endsWith("\n") ? value : `${value}\n`);
  else console.log(JSON.stringify(value, null, 2));
}
function usage(): never {
  console.error("usage: reconstructive-build.ts [overview|equations|correspondence|cases|models|build|feedback|sources|verify [FILE]|verify-project FILE] [--json]");
  process.exit(2);
}
export function runReconstructiveBuildCli(args = process.argv.slice(2)): void {
  const jsonFlags = args.filter((arg) => arg === "--json");
  if (jsonFlags.length > 1 || args.some((arg) => arg.startsWith("-") && arg !== "--json")) usage();
  const json = jsonFlags.length === 1;
  const positional = args.filter((arg) => arg !== "--json");
  const command = positional[0] ?? "overview";
  if (command === "verify") {
    if (positional.length > 2) usage();
    let value: unknown;
    try { value = readUnchecked(positional[1] ?? RECONSTRUCTIVE_BUILD_PATH); } catch {
      output({ valid: false, issues: [{ field: "$", code: "read-refused" }] }, json);
      process.exitCode = 1;
      return;
    }
    const issues = verifyReconstructiveBuildKernel(value);
    output({ valid: issues.length === 0, issues }, json);
    if (issues.length) process.exitCode = 1;
    return;
  }
  if (command === "verify-project") {
    if (positional.length !== 2) usage();
    let value: unknown;
    try { value = readProjectUnchecked(positional[1]!); } catch {
      output({ valid: false, issues: [{ field: "$", code: "read-refused" }] }, json);
      process.exitCode = 1;
      return;
    }
    const issues = verifyReconstructiveProject(value);
    output({ valid: issues.length === 0, issues }, json);
    if (issues.length) process.exitCode = 1;
    return;
  }
  if (positional.length > 1) usage();
  const value = loadReconstructiveBuildKernel();
  const selections: Record<string, () => unknown> = {
    overview: () => ({ title: value.title, scope: value.scope, counts: reconstructiveBuildPublicDiscovery(value).counts, boundary: value.boundaries }),
    equations: () => value.equations,
    correspondence: () => value.correspondences,
    cases: () => value.reconstruction_cases,
    models: () => ({ realizability: value.realizability_models, landscapes: value.landscape_models, catalysis: value.catalysis_models }),
    build: () => value.build_profile,
    feedback: () => value.feedback_contract,
    sources: () => value.sources,
  };
  if (!Object.hasOwn(selections, command)) usage();
  output(selections[command]!(), json);
}

if (import.meta.main) runReconstructiveBuildCli();
