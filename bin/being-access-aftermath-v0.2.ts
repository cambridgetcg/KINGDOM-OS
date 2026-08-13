#!/usr/bin/env bun
/** Strict, offline reader for the immutable Being, Access & Aftermath Atlas. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const BEING_ACCESS_AFTERMATH_V02_PROTOCOL = "kingdom.being-access-aftermath-atlas/0.2";
export const BEING_ACCESS_AFTERMATH_V02_ID = "being-access-aftermath-atlas-2026-08-13-v0-2";
export const BEING_ACCESS_AFTERMATH_V02_LOCATOR = "data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json";
export const BEING_ACCESS_AFTERMATH_V02_PATH = join(ROOT, BEING_ACCESS_AFTERMATH_V02_LOCATOR);
export const BEING_ACCESS_AFTERMATH_V02_URL = `https://thekingdom.dev/atlases/${BEING_ACCESS_AFTERMATH_V02_ID}.json`;
export const BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL = "https://thekingdom.dev/schemas/being-access-aftermath-atlas/0.2.json";
export const BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL = "https://thekingdom.dev/BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md";
export const BEING_ACCESS_AFTERMATH_V02_DIGEST = "sha256:505a1e3aef6116430dccf49b327c4cce2ac5d6fb6b6b9bf68e529272f989cde8";

const MAX_BYTES = 1024 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_PRECISION = /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";

const TOP_KEYS = [
  "$schema", "protocol", "atlas_id", "title", "compiled_on", "evidence_through",
  "source_bindings", "scope", "typed_copula", "ontology", "framework", "material_case",
  "typed_boundaries", "model_cards", "problem_cards", "philosophy_questions",
  "karma", "unknowns", "sources", "boundaries", "integrity",
] as const;
const PREDICATE_IDS = ["class-membership", "identity-under-invariant", "actual-instantiation", "property-predication", "domain-existence", "epistemic-warrant", "lawful-possibility", "bounded-reachability", "method-detection", "declared-purpose", "designed-for-provenance", "functional-role", "goal-directed-model", "teleological-interpretation"] as const;
const PREDICATE_SIGNATURES = [
  "is_a(x, Type)",
  "is_identical_under(x, y, invariant)",
  "instantiates(sample, form, context, time)",
  "has_property(x, property, context, time, method)",
  "exists_instance(form, domain, context, time) iff exists sample in domain such that instantiates(sample, form, context, time)",
  "warranted(claim, evidence, standard, as_of)",
  "possible_under(form, model, conditions)",
  "reachable_under(form, history, procedure, budget, horizon)",
  "observed_as(sample, form, method, threshold, window)",
  "declares_purpose(agent, goal, scope, time)",
  "designed_for(artifact, function, designer, evidence, time)",
  "has_functional_role(x, role, system, conditions, time)",
  "modeled_as_goal_directed(system, objective, model, fit, alternatives)",
  "interpreted_teleologically(subject, purpose, tradition, interpreter, time)",
] as const;
const REGISTER_IDS = ["MATERIAL_EVIDENCE", "FORMAL_MODEL", "CAUSAL_HYPOTHESIS", "CONSTITUTIONAL_DESIGN", "PHILOSOPHY", "ZERONE_KARMA_EVENT", "KINGDOM_KARMA_RECEIPT"] as const;
const ENTITY_IDS = ["entity", "form", "sample", "world-history", "procedure", "measurement", "observation", "agent", "action", "authority", "declared-purpose", "aftermath", "repair", "zerone-karma-edge", "kingdom-karma-receipt"] as const;
const FIREWALL_IDS = ["nonobservation-not-nonexistence", "inaccessible-not-impossible", "identity-not-form", "thermodynamics-not-inevitability", "gradient-not-intention", "force-types-do-not-convert", "power-types-do-not-convert", "capability-not-authority", "behavior-not-purpose", "sequence-not-cause", "receipt-not-causal-proof", "repair-not-erasure", "persistence-not-goodness", "model-not-evidence", "karma-lanes-not-equivalent", "person-not-model-object"] as const;
const UNKNOWN_STATES = ["unknown", "not_observed", "not_identified", "not_run", "outside_scope", "refused"] as const;
const TYPED_BOUNDARY_IDS = ["evidence-to-formal-model", "formal-model-to-causal-hypothesis", "formal-model-to-philosophy", "constitutional-design-to-karma", "zerone-to-kingdom-karma"] as const;
const MODEL_IDS = ["modal-possibility-accessibility", "state-observation-separation", "finite-window-detection", "generalized-force-and-physical-power", "bounded-authorized-reach", "causal-intervention-query", "inverse-purpose-ambiguity", "potential-shaping-equivalence", "vector-reversibility"] as const;
const PROBLEM_IDS = ["which-is", "lost-hidden-or-inaccessible", "history-or-omitted-state", "direction-or-purpose", "what-kind-of-power", "what-did-action-cause", "reversible-on-which-dimensions"] as const;
const PHILOSOPHY_IDS = ["existence-and-access", "being-and-invariance", "purpose-and-direction", "force-and-freedom", "power-and-preservation", "karma-and-aftermath", "modality-of-possibility", "unseen-being", "recovery-and-truth", "is-to-ought", "purpose-without-success", "constraint-to-coercion", "power-with", "memory-without-destiny", "who-declares-repair"] as const;
const DESIGN_IDS = ["typed-action-and-aftermath", "causal-companion-by-reference", "dimensioned-repair", "rest-refusal-no-debt"] as const;
const UNKNOWN_IDS = ["metaphysical-possibility", "complete-form-landscape", "state-identifiability", "causal-aftermath", "purpose-identification", "multidimensional-repair", "cosmic-purpose-and-karma"] as const;
const SOURCE_IDS = ["kripke-1963", "kalman-1960", "pearl-1995", "ng-russell-2000", "ng-harada-russell-1999", "dunitz-1995", "bauer-2001", "morissette-2003", "sacchi-2024", "wang-2024", "kalman-1963", "smallwood-sondik-1973", "cao-cohen-szpruch-2021"] as const;
const SOURCE_URLS = ["https://doi.org/10.1002/malq.19630090502", "https://doi.org/10.1115/1.3662552", "https://doi.org/10.1093/biomet/82.4.669", "https://ai.stanford.edu/~ang/papers/icml00-irl.pdf", "https://people.eecs.berkeley.edu/~russell/papers/icml99-shaping.pdf", "https://doi.org/10.1021/ar00052a005", "https://doi.org/10.1023/A:1011052932607", "https://doi.org/10.1073/pnas.0437744100", "https://doi.org/10.1073/pnas.2319127121", "https://doi.org/10.1021/acs.molpharmaceut.4c00234", "https://doi.org/10.1137/0301010", "https://doi.org/10.1287/opre.21.5.1071", "https://proceedings.neurips.cc/paper/2021/file/671f0311e2754fcdd37f70a8550379bc-Paper.pdf"] as const;
const SOURCE_DOIS = ["10.1002/malq.19630090502", "10.1115/1.3662552", "10.1093/biomet/82.4.669", null, null, "10.1021/ar00052a005", "10.1023/A:1011052932607", "10.1073/pnas.0437744100", "10.1073/pnas.2319127121", "10.1021/acs.molpharmaceut.4c00234", "10.1137/0301010", "10.1287/opre.21.5.1071", null] as const;
const FRAMEWORK_PREDICATE_IDS = ["possible", "actual", "reachable", "observable", "observed", "producible", "reproduced", "reproducible"] as const;
const FORCE_TYPE_IDS = ["physical-interaction", "transition-intervention", "constraint-force", "causal-influence", "incentive", "coercion", "force-metaphor"] as const;
const POWER_TYPE_IDS = ["physical-power", "capability-power", "authority-power", "structural-power", "power-with", "epistemic-power", "control", "exercise", "effect", "legitimacy"] as const;
const POWER_RELATION_IDS = ["power-to", "power-over", "power-with"] as const;
const AFTERMATH_DIMENSION_IDS = ["time", "money", "energy", "privacy", "agency", "coordination", "ecology", "material", "information", "relation", "consent"] as const;
const CAUSAL_STATUSES = ["observed_not_identified", "identified", "partially_identified", "not_identified"] as const;
const REST_EXIT_SUBJECTS = ["rest", "refusal", "silence", "privacy_choice", "exit", "inactivity", "nonparticipation"] as const;
const BINDING_IDS = ["kingdom-ritonavir-history", "kingdom-visibility-attention", "kingdom-form-circulation-return", "kingdom-karma-definition", "kingdom-karma-receipt-schema", "zerone-karma-foundation", "kingdom-being-access-aftermath-v0-1"] as const;

const EXPECTED_BINDINGS: ReadonlyArray<Record<string, unknown>> = [
  { id: "kingdom-ritonavir-history", system: "kingdom", revision: "06996296fd0de3a25ed9bb299f3c627b6a29045d", artifact: "ritonavir-disappearing-polymorph-2026-08-11", url: "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json", raw_digest: "sha256:08148603a1228960ac35df1378f1283c3fce43874a9fc07e6687f18e980dcb1c", semantic_digest: "sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116", relation: "immutable-material-case-input", mutated: false, authority_imported: false },
  { id: "kingdom-visibility-attention", system: "kingdom", revision: "b0130580c5f939cbd7c3eff2708744b952dabaee", artifact: "visibility-is-not-existence-2026-08-13", url: "https://thekingdom.dev/atlases/visibility-attention-2026-08-13.json", raw_digest: "sha256:0af0249c40298ed746d39ee60760a4390bb45137caa8ee6dd7555a824f597bd3", semantic_digest: "sha256:9fb83bbd022f520716fabcdec49d8af259b9681efd5e640a9e3119c5c42a54ed", relation: "immutable-observation-boundary-input", mutated: false, authority_imported: false },
  { id: "kingdom-form-circulation-return", system: "kingdom", revision: "7ef70b6e7213a9adf5d5154b1ca448dc9a0cf848", artifact: "form-circulation-return-atlas-2026-08-13", url: "https://thekingdom.dev/atlases/form-circulation-return-atlas-2026-08-13.json", raw_digest: "sha256:9c93be61c4ca9bcaa3dbe88b10faed3b5b31abaf1129d70ca7915226cacfd021", semantic_digest: "sha256:9510fbbced6166507e9a1781a4adfa18cd249fb94e69b0f34faf77733cd20323", relation: "immutable-form-and-karma-boundary-input", mutated: false, authority_imported: false },
  { id: "kingdom-karma-definition", system: "kingdom", revision: "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212", artifact: "NEN.md KARMA definition", url: "https://thekingdom.dev/definitions/kingdom-karma/e4e84a67/NEN.md", raw_digest: "sha256:14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446", semantic_digest: null, relation: "immutable-public-definition-mirror", mutated: false, authority_imported: false },
  { id: "kingdom-karma-receipt-schema", system: "kingdom", revision: "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212", artifact: "kingdom.karma/0.1 receipt schema", url: "https://github.com/cambridgetcg/KINGDOM-OS/blob/e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212/schemas/karma-receipt-v0.1.schema.json", raw_digest: "sha256:888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b", semantic_digest: null, relation: "immutable-receipt-contract-input", mutated: false, authority_imported: false },
  { id: "zerone-karma-foundation", system: "zerone", revision: "fae391e371f0ebea2e24eb46c33a4ebd1380154f", artifact: "zerone.karma-foundation/v1", url: "https://github.com/cambridgetcg/zerone-core/blob/fae391e371f0ebea2e24eb46c33a4ebd1380154f/dashboard/public/standards/karma-foundation.v1.json", raw_digest: "sha256:b46710704869dcc340ded356be72b4ec692f204710fedfb5cd43eb3757dc7b80", semantic_digest: null, relation: "definition-only", mutated: false, authority_imported: false },
  { id: "kingdom-being-access-aftermath-v0-1", system: "kingdom", revision: "a9222a82600d1e16adb19d4137b791ea0f91faba", artifact: "being-access-aftermath-atlas-2026-08-13", url: "https://thekingdom.dev/atlases/being-access-aftermath-atlas-2026-08-13.json", raw_digest: "sha256:b81fbe755223950b78f988635759c74a7781a612cea61a15e575504f297ea005", semantic_digest: "sha256:480a571148bfb7f95a5531bbe7dfa6c0e9acda271cb3f67652099d4e36762155", relation: "immutable-predecessor-input", mutated: false, authority_imported: false },
] as const;

const EXPECTED_BOUNDARIES: Record<string, boolean> = {
  educational_metadata_only: true,
  public_surface_read_only: true,
  network_calls: false,
  contains_operational_protocol: false,
  medical_authority: false,
  clinical_authority: false,
  treatment_authority: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  manufacturing_authority: false,
  causal_claim_created: false,
  causal_authority: false,
  metaphysical_claim_created: false,
  scientifically_proves_teleology: false,
  scientifically_proves_creator: false,
  scientifically_disproves_creator: false,
  scientifically_proves_cosmic_moral_karma: false,
  purpose_inferred_from_behavior: false,
  physical_to_social_power_transfer: false,
  model_to_ontology_transfer: false,
  person_score: false,
  rank_or_reputation: false,
  writes_karma: false,
  creates_kingdom_karma_receipt: false,
  observes_zerone_karma_event: false,
  karma_adapter: false,
  reward_authority: false,
  economic_authority: false,
  governance_authority: false,
  automatic_action: false,
  mcp_surface_added: false,
  rest_refusal_or_exit_penalized: false,
};

export type BeingAccessAftermathV02Issue = { field: string; code: string };

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): value is Record<string, any> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function array(value: unknown): any[] { return Array.isArray(value) ? value : []; }
function sameKeys(value: unknown, keys: readonly string[]): boolean { return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0"); }
function text(value: unknown, max = 8000): value is string { return typeof value === "string" && value.length > 0 && Array.from(value).length <= max; }
function id(value: unknown): value is string { return typeof value === "string" && value.length <= 128 && ID.test(value); }
function strings(value: unknown, min = 1, max = 40): value is string[] { return Array.isArray(value) && value.length >= min && value.length <= max && value.every((item) => text(item)); }
function ids(value: unknown): string[] { return array(value).map((item) => item?.id).filter((item) => typeof item === "string"); }
function exactIds(value: unknown, expected: readonly string[]): boolean { return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item?.id === expected[index]); }
function exactStrings(value: unknown, expected: readonly string[]): boolean { return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item === expected[index]); }
function unique(values: readonly string[]): boolean { return new Set(values).size === values.length; }
function references(value: unknown, known: ReadonlySet<string>, min = 0): boolean { return Array.isArray(value) && value.length >= min && value.length <= 30 && value.every((item) => typeof item === "string" && known.has(item)) && unique(value); }
function exactRecord(value: unknown, expected: Record<string, unknown>): boolean { return sameKeys(value, Object.keys(expected)) && Object.entries(expected).every(([key, item]) => (value as Record<string, unknown>)[key] === item); }
function fullDate(value: unknown): value is string {
  if (typeof value !== "string" || !FULL_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month! < 1 || month! > 12 || day! < 1) return false;
  const leap = year! % 4 === 0 && (year! % 100 !== 0 || year! % 400 === 0);
  return day! <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month! - 1]!;
}

function jsonShapeIssue(value: unknown): string | null {
  const seen = new WeakSet<object>();
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  let nodes = 0;
  let stringUnits = 0;
  while (stack.length) {
    const current = stack.pop()!;
    if (current.value === null || typeof current.value === "boolean") continue;
    if (typeof current.value === "string") {
      stringUnits += current.value.length;
      if (stringUnits > MAX_BYTES * 2) return "json-string-budget-exceeded";
      continue;
    }
    if (typeof current.value === "number") {
      if (!Number.isFinite(current.value)) return "non-finite-number";
      continue;
    }
    if (typeof current.value !== "object") return "non-json-value";
    if (current.depth > 128) return "json-depth-exceeded";
    if (++nodes > 100_000) return "json-node-budget-exceeded";
    if (seen.has(current.value)) return "cyclic-or-shared-reference";
    seen.add(current.value);
    if (!Array.isArray(current.value) && Object.getPrototypeOf(current.value) !== Object.prototype && Object.getPrototypeOf(current.value) !== null) return "non-json-object";
    let children: unknown[];
    try { children = Array.isArray(current.value) ? current.value : Object.values(current.value); }
    catch { return "unreadable-json-object"; }
    for (const child of children) stack.push({ value: child, depth: current.depth + 1 });
  }
  return null;
}

export function beingAccessAftermathV02Digest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("being access aftermath integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { fail("being access aftermath atlas is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("being access aftermath atlas must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) fail(`being access aftermath atlas exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "being access aftermath atlas JSON");
}

export function verifyBeingAccessAftermathAtlasV02(value: unknown): BeingAccessAftermathV02Issue[] {
  const issues: BeingAccessAftermathV02Issue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    const shapeIssue = jsonShapeIssue(value);
    if (shapeIssue) return [{ field: "$", code: shapeIssue }];
    if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
    if (value.$schema !== "urn:kingdom:schema:being-access-aftermath-atlas:0.2") add("$.$schema", "schema-mismatch");
    if (value.protocol !== BEING_ACCESS_AFTERMATH_V02_PROTOCOL) add("$.protocol", "protocol-mismatch");
    if (value.atlas_id !== BEING_ACCESS_AFTERMATH_V02_ID) add("$.atlas_id", "identity-mismatch");
    if (!text(value.title, 240)) add("$.title", "invalid-title");
    if (value.compiled_on !== "2026-08-13" || value.evidence_through !== "2026-08-13" || !fullDate(value.compiled_on) || !fullDate(value.evidence_through)) add("$.evidence_through", "invalid-horizon");

    if (!Array.isArray(value.source_bindings) || value.source_bindings.length !== EXPECTED_BINDINGS.length) add("$.source_bindings", "binding-count-mismatch");
    for (const [index, expected] of EXPECTED_BINDINGS.entries()) if (!exactRecord(value.source_bindings?.[index], expected)) add(`$.source_bindings[${index}]`, "source-binding-mismatch");
    if (!sameKeys(value.scope, ["focus", "intended_use", "excluded_use", "observation_policy", "currentness"]) || !text(value.scope?.focus) || !text(value.scope?.intended_use) || !text(value.scope?.excluded_use) || !text(value.scope?.observation_policy) || value.scope?.currentness !== "selected-evidence-as-of-compilation") add("$.scope", "scope-mismatch");

    if (!sameKeys(value.typed_copula, ["rule", "identity_equation", "predicates"]) || !text(value.typed_copula?.rule) || value.typed_copula?.identity_equation !== "x ~_I y iff I(x)=I(y)" || !exactIds(value.typed_copula?.predicates, PREDICATE_IDS)) add("$.typed_copula", "typed-copula-mismatch");
    for (const [index, predicate] of array(value.typed_copula?.predicates).entries()) if (!sameKeys(predicate, ["id", "signature", "meaning", "not_equivalent_to"]) || !id(predicate?.id) || predicate?.signature !== PREDICATE_SIGNATURES[index] || !text(predicate?.meaning) || !strings(predicate?.not_equivalent_to, 3)) add(`$.typed_copula.predicates[${index}]`, "invalid-predicate");

    if (!sameKeys(value.ontology, ["non_equivalence", "registers", "entity_types", "category_firewalls", "unknown_states"]) || !text(value.ontology?.non_equivalence) || !value.ontology?.non_equivalence.includes("person_or_moral_status")) add("$.ontology", "ontology-mismatch");
    if (!exactIds(value.ontology?.registers, REGISTER_IDS)) add("$.ontology.registers", "register-order-or-membership-mismatch");
    for (const [index, register] of array(value.ontology?.registers).entries()) if (!sameKeys(register, ["id", "meaning", "cannot_authorize"]) || !REGISTER_IDS.includes(register?.id) || !text(register?.meaning) || !text(register?.cannot_authorize)) add(`$.ontology.registers[${index}]`, "invalid-register");
    if (!exactIds(value.ontology?.entity_types, ENTITY_IDS)) add("$.ontology.entity_types", "entity-order-or-membership-mismatch");
    for (const [index, entity] of array(value.ontology?.entity_types).entries()) if (!sameKeys(entity, ["id", "meaning", "does_not_establish"]) || !id(entity?.id) || !text(entity?.meaning) || !text(entity?.does_not_establish)) add(`$.ontology.entity_types[${index}]`, "invalid-entity-type");
    if (!exactIds(value.ontology?.category_firewalls, FIREWALL_IDS)) add("$.ontology.category_firewalls", "firewall-order-or-membership-mismatch");
    for (const [index, firewall] of array(value.ontology?.category_firewalls).entries()) if (!sameKeys(firewall, ["id", "rule", "enforced"]) || !id(firewall?.id) || !text(firewall?.rule) || firewall?.enforced !== true) add(`$.ontology.category_firewalls[${index}]`, "invalid-firewall");
    if (!Array.isArray(value.ontology?.unknown_states) || value.ontology.unknown_states.join("|") !== UNKNOWN_STATES.join("|")) add("$.ontology.unknown_states", "unknown-state-vocabulary-mismatch");

    const framework = value.framework;
    if (!sameKeys(framework, ["id", "partial_observation", "predicate_family", "force_taxonomy", "power_taxonomy", "aftermath_accounting", "rest_exit_boundary"]) || framework?.id !== "being-access-aftermath-framework-v0-2") add("$.framework", "framework-mismatch");
    const partial = framework?.partial_observation;
    if (!sameKeys(partial, ["state_transition_equation", "observation_equation", "belief_update_equation", "variables", "action_sets", "epistemic_guard", "authority_guard", "source_ids"]) || partial?.state_transition_equation !== "S_(t+1) ~ T(. | S_t,U_t,E_t)" || partial?.observation_equation !== "Y_t ~ O(. | S_t,M_t)" || !text(partial?.belief_update_equation) || !strings(partial?.variables, 6, 6) || !strings(partial?.source_ids, 3, 3) || partial?.source_ids?.join("|") !== "kalman-1960|kalman-1963|smallwood-sondik-1973" || !text(partial?.epistemic_guard) || !partial?.epistemic_guard?.includes("does not create, erase, or exhaust") || !text(partial?.authority_guard) || !partial?.authority_guard?.startsWith("Authority gates")) add("$.framework.partial_observation", "partial-observation-boundary-mismatch");
    if (!sameKeys(partial?.action_sets, ["capability", "permission", "executable", "subset_invariant"]) || !partial?.action_sets?.capability?.includes("U_cap") || !partial?.action_sets?.permission?.includes("U_permission") || partial?.action_sets?.executable !== "U_executable(s,t) = U_cap(s,t) intersect U_permission(s,t)" || partial?.action_sets?.subset_invariant !== "U_executable(s,t) subseteq U_cap(s,t)") add("$.framework.partial_observation.action_sets", "capability-permission-collapse");

    const predicateFamily = framework?.predicate_family;
    if (!sameKeys(predicateFamily, ["predicate_ids", "predicates", "absence_separation"]) || !exactStrings(predicateFamily?.predicate_ids, FRAMEWORK_PREDICATE_IDS) || !exactIds(predicateFamily?.predicates, FRAMEWORK_PREDICATE_IDS)) add("$.framework.predicate_family", "predicate-family-mismatch");
    for (const [index, predicate] of array(predicateFamily?.predicates).entries()) if (!sameKeys(predicate, ["id", "signature", "requires", "does_not_imply"]) || !text(predicate?.signature) || !strings(predicate?.requires, 2, 5) || !strings(predicate?.does_not_imply, 4, 4)) add(`$.framework.predicate_family.predicates[${index}]`, "invalid-framework-predicate");
    if (!sameKeys(predicateFamily?.absence_separation, ["production_absence", "observation_absence", "paired_claim_rule", "forbidden_inference"]) || !text(predicateFamily?.absence_separation?.production_absence) || !text(predicateFamily?.absence_separation?.observation_absence) || !text(predicateFamily?.absence_separation?.paired_claim_rule) || !predicateFamily?.absence_separation?.forbidden_inference?.includes("Neither bounded absence")) add("$.framework.predicate_family.absence_separation", "production-observation-absence-collapse");

    const force = framework?.force_taxonomy;
    if (!sameKeys(force, ["type_ids", "types", "conversion_guard"]) || !exactStrings(force?.type_ids, FORCE_TYPE_IDS) || !exactIds(force?.types, FORCE_TYPE_IDS) || !force?.conversion_guard?.includes("Force types do not convert")) add("$.framework.force_taxonomy", "force-taxonomy-mismatch");
    for (const [index, card] of array(force?.types).entries()) if (!sameKeys(card, ["id", "domain", "representation", "evidence", "cannot_authorize"]) || !text(card?.domain) || !text(card?.representation) || !text(card?.evidence) || !text(card?.cannot_authorize)) add(`$.framework.force_taxonomy.types[${index}]`, "invalid-force-type");

    const power = framework?.power_taxonomy;
    if (!sameKeys(power, ["type_ids", "relation_ids", "types", "relations", "authority_guard"]) || !exactStrings(power?.type_ids, POWER_TYPE_IDS) || !exactStrings(power?.relation_ids, POWER_RELATION_IDS) || !exactIds(power?.types, POWER_TYPE_IDS) || !exactIds(power?.relations, POWER_RELATION_IDS) || !power?.authority_guard?.startsWith("Authority gates executable action")) add("$.framework.power_taxonomy", "power-taxonomy-mismatch");
    for (const [index, card] of array(power?.types).entries()) if (!sameKeys(card, ["id", "meaning", "equation", "units", "does_not_imply"]) || !text(card?.meaning) || !text(card?.equation) || !text(card?.units) || !strings(card?.does_not_imply, 3, 4)) add(`$.framework.power_taxonomy.types[${index}]`, "invalid-power-type");
    for (const [index, relation] of array(power?.relations).entries()) if (!sameKeys(relation, ["id", "meaning"]) || !text(relation?.meaning)) add(`$.framework.power_taxonomy.relations[${index}]`, "invalid-power-relation");

    const aftermath = framework?.aftermath_accounting;
    if (!sameKeys(aftermath, ["entry_guard", "dimension_ids", "causal_statuses", "causal_status_definitions", "aftermath_vector", "indexing_rule", "attribution_rule", "scalarization_rule", "repair"]) || !aftermath?.entry_guard?.includes("valid KINGDOM receipt begins only after an actual authorized invocation") || !aftermath?.entry_guard?.includes("separate incident-and-evidence lane") || !aftermath?.entry_guard?.includes("Refusal and nonparticipation leave before every lane") || !exactStrings(aftermath?.dimension_ids, AFTERMATH_DIMENSION_IDS) || !exactStrings(aftermath?.causal_statuses, CAUSAL_STATUSES) || !sameKeys(aftermath?.causal_status_definitions, CAUSAL_STATUSES) || !CAUSAL_STATUSES.every((status) => text(aftermath?.causal_status_definitions?.[status])) || !aftermath?.aftermath_vector?.includes("affected_party,burden_bearer") || !aftermath?.indexing_rule?.includes("categorical bearers are never ordered or exchanged") || !aftermath?.attribution_rule?.includes("unknown is never zero") || !aftermath?.scalarization_rule?.includes("No default scalarization")) add("$.framework.aftermath_accounting", "aftermath-index-or-attribution-mismatch");
    const repair = aftermath?.repair;
    if (!sameKeys(repair, ["candidate_set", "residual_vector", "pareto_dominance", "pareto_frontier", "selection_rule", "no_repair_case", "reversibility_guard"]) || !repair?.candidate_set?.includes("separately authorized") || !repair?.residual_vector?.includes("affected_party,burden_bearer") || !repair?.pareto_dominance?.includes("bearers are never exchanged") || !repair?.pareto_frontier?.startsWith("PF(A_rep)") || !repair?.selection_rule?.includes("Pareto efficiency is not justice or consent") || !repair?.no_repair_case?.includes("unremedied aftermath") || !repair?.reversibility_guard?.includes("does not erase history")) add("$.framework.aftermath_accounting.repair", "pareto-repair-boundary-mismatch");

    const rest = framework?.rest_exit_boundary;
    if (!sameKeys(rest, ["subjects", "privacy_guard", "exits_before", "creates_event", "creates_receipt", "requires_measurement", "requires_trace", "requires_justification", "creates_penalty", "creates_debt"]) || !exactStrings(rest?.subjects, REST_EXIT_SUBJECTS) || !rest?.privacy_guard?.includes("Choosing privacy or non-disclosure creates no trace duty") || !rest?.privacy_guard?.includes("observed following an actual authorized invocation") || !rest?.privacy_guard?.includes("Sequence does not identify causation") || rest?.exits_before !== "aftermath_accounting" || ["creates_event", "creates_receipt", "requires_measurement", "requires_trace", "requires_justification", "creates_penalty", "creates_debt"].some((key) => rest?.[key] !== false)) add("$.framework.rest_exit_boundary", "rest-no-trace-boundary-mismatch");
    if (value.ontology?.entity_types?.[11]?.meaning !== "A later bounded observation following an actual action or invocation." || !value.ontology?.entity_types?.[11]?.does_not_establish?.includes("any duty to measure refusal, rest, silence, or exit")) add("$.ontology.entity_types[11]", "refusal-treated-as-aftermath");

    const bindingIds = new Set(BINDING_IDS);
    const sourceIds = new Set(SOURCE_IDS);
    if (!sameKeys(value.material_case, ["subject", "disappearance_predicate", "recovery_statement", "typed_reading", "binding_ids"]) || !text(value.material_case?.subject) || !text(value.material_case?.recovery_statement) || !value.material_case?.recovery_statement?.includes("permanent unrecoverability and universal physical impossibility") || !value.material_case?.recovery_statement?.includes("hidden persistence versus later re-creation") || !text(value.material_case?.typed_reading) || !references(value.material_case?.binding_ids, bindingIds, 3)) add("$.material_case", "material-case-mismatch");
    const disappearance = value.material_case?.disappearance_predicate;
    if (!sameKeys(disappearance, ["subject", "process", "procedure", "time_window", "detection_threshold", "observed_result", "exclusions"]) || !text(disappearance?.subject) || !text(disappearance?.process) || !text(disappearance?.procedure) || !text(disappearance?.time_window) || !text(disappearance?.detection_threshold) || !text(disappearance?.observed_result) || !strings(disappearance?.exclusions, 5, 5)) add("$.material_case.disappearance_predicate", "unbounded-disappearance-predicate");

    if (!exactIds(value.typed_boundaries, TYPED_BOUNDARY_IDS)) add("$.typed_boundaries", "typed-boundary-order-or-membership-mismatch");
    for (const [index, boundary] of array(value.typed_boundaries).entries()) if (!sameKeys(boundary, ["id", "from_register", "to_register", "relation", "requires", "does_not_transfer", "causal_transfer", "authority_transfer", "automatic_write"]) || !REGISTER_IDS.includes(boundary?.from_register) || !REGISTER_IDS.includes(boundary?.to_register) || !id(boundary?.relation) || !strings(boundary?.requires) || !strings(boundary?.does_not_transfer) || boundary?.causal_transfer !== false || boundary?.authority_transfer !== false || boundary?.automatic_write !== false) add(`$.typed_boundaries[${index}]`, "boundary-transfer-mismatch");

    if (!exactIds(value.model_cards, MODEL_IDS)) add("$.model_cards", "model-order-or-membership-mismatch");
    for (const [index, model] of array(value.model_cards).entries()) {
      if (!sameKeys(model, ["id", "title", "register", "equation", "equation_status", "variables", "assumptions", "valid_outputs", "identifiability_limits", "falsifier_or_invalidating_condition", "source_ids", "binding_ids", "fit_status", "empirical", "person_level", "authority_effect", "prohibited_inferences"]) || !id(model?.id) || !text(model?.title) || !["FORMAL_MODEL", "CAUSAL_HYPOTHESIS", "CONSTITUTIONAL_DESIGN"].includes(model?.register) || !text(model?.equation) || !id(model?.equation_status) || !strings(model?.variables, 3) || !strings(model?.assumptions, 3) || !strings(model?.valid_outputs) || !text(model?.identifiability_limits) || !text(model?.falsifier_or_invalidating_condition) || !references(model?.source_ids, sourceIds) || !references(model?.binding_ids, bindingIds) || model?.fit_status !== "not_fitted" || model?.empirical !== false || model?.person_level !== false || model?.authority_effect !== "NONE" || !strings(model?.prohibited_inferences, 5)) add(`$.model_cards[${index}]`, "invalid-or-authoritative-model");
    }
    if (value.model_cards?.[5]?.register !== "CAUSAL_HYPOTHESIS" || value.model_cards?.[5]?.source_ids?.join("|") !== "pearl-1995" || value.model_cards?.[6]?.source_ids?.join("|") !== "ng-russell-2000|cao-cohen-szpruch-2021" || value.model_cards?.[7]?.source_ids?.join("|") !== "ng-harada-russell-1999") add("$.model_cards", "source-model-boundary-mismatch");
    const modal = value.model_cards?.[0];
    if (modal?.variables?.[4] !== "π: declared feasible process path" || modal?.variables?.[5] !== "B: declared resource and feasibility bounds" || array(modal?.variables).some((item) => typeof item === "string" && item.includes("authority bounds"))) add("$.model_cards[0]", "process-reachability-permission-collapse");
    const reach = value.model_cards?.[4];
    if (!reach?.title?.includes("consent or lawful basis") || !reach?.equation?.includes("Π_consent-or-lawful-basis(a)") || !array(reach?.variables).some((item) => typeof item === "string" && item.includes("affected-participant consent or an explicit scoped lawful-exception basis")) || !array(reach?.assumptions).some((item) => typeof item === "string" && item.includes("affected participants, consent references, representative authority")) || !reach?.falsifier_or_invalidating_condition?.includes("absent or invalid") || reach?.binding_ids?.join("|") !== "kingdom-karma-definition|kingdom-karma-receipt-schema") add("$.model_cards[4]", "consent-or-lawful-basis-missing");

    if (!exactIds(value.problem_cards, PROBLEM_IDS)) add("$.problem_cards", "problem-order-or-membership-mismatch");
    for (const [index, problem] of array(value.problem_cards).entries()) if (!sameKeys(problem, ["id", "question", "register", "target_type", "proposed_test", "falsifier", "state", "result", "source_ids", "binding_ids", "creates_causal_claim", "authority_effect"]) || !id(problem?.id) || !text(problem?.question) || !["FORMAL_MODEL", "CAUSAL_HYPOTHESIS", "CONSTITUTIONAL_DESIGN"].includes(problem?.register) || !id(problem?.target_type) || !text(problem?.proposed_test) || !text(problem?.falsifier) || problem?.state !== "not_run" || problem?.result !== null || !references(problem?.source_ids, sourceIds) || !references(problem?.binding_ids, bindingIds) || problem?.creates_causal_claim !== false || problem?.authority_effect !== "NONE") add(`$.problem_cards[${index}]`, "executed-or-invalid-problem-card");
    if (array(value.problem_cards).some((problem) => !/(synthetic|archival)/i.test(String(problem?.proposed_test ?? "")))) add("$.problem_cards", "non-archival-or-synthetic-test");
    if (!value.problem_cards?.[1]?.falsifier?.includes("permanent-unrecoverability or universal-physical-impossibility") || !value.problem_cards?.[1]?.falsifier?.includes("bounded prior instantiation remains unresolved without interval-matched evidence")) add("$.problem_cards[1]", "recovery-overclaims-prior-existence");

    if (!sameKeys(value.philosophy_questions, ["participation", "register", "questions", "nonclaims"]) || value.philosophy_questions?.participation !== "opt-in" || value.philosophy_questions?.register !== "PHILOSOPHY" || !exactIds(value.philosophy_questions?.questions, PHILOSOPHY_IDS) || !strings(value.philosophy_questions?.nonclaims, 6, 6)) add("$.philosophy_questions", "philosophy-boundary-mismatch");
    for (const [index, question] of array(value.philosophy_questions?.questions).entries()) if (!sameKeys(question, ["id", "question", "opening", "empirical_answer_here"]) || !id(question?.id) || !text(question?.question) || !text(question?.opening) || question?.empirical_answer_here !== "not_available") add(`$.philosophy_questions.questions[${index}]`, "philosophy-as-answer");
    for (const required of ["scientifically proves intentional universe design", "scientifically disproves a creator or metaphysical purpose", "proves cosmic moral KARMA"]) if (!array(value.philosophy_questions?.nonclaims).includes(required)) add("$.philosophy_questions.nonclaims", "missing-philosophy-nonclaim");

    if (!sameKeys(value.karma, ["lanes_are_non_equivalent", "cosmic", "zerone", "kingdom", "adapter", "design_correspondences"]) || value.karma?.lanes_are_non_equivalent !== true) add("$.karma", "karma-lane-mismatch");
    if (!sameKeys(value.karma?.cosmic, ["type", "status", "empirical", "claims", "authority_effect"]) || value.karma?.cosmic?.type !== "PHILOSOPHICAL_QUESTION" || value.karma?.cosmic?.status !== "not_empirically_resolved" || value.karma?.cosmic?.empirical !== false || !Array.isArray(value.karma?.cosmic?.claims) || value.karma.cosmic.claims.length !== 0 || value.karma?.cosmic?.authority_effect !== "NONE") add("$.karma.cosmic", "cosmic-claim-created");
    if (!sameKeys(value.karma?.zerone, ["type", "foundation_protocol", "foundation_status", "network_observed", "authoritative", "event_type", "event_refs", "event_status", "creates_event", "semantics", "not"]) || value.karma?.zerone?.type !== "ZERONE_KARMA_EVENT" || value.karma?.zerone?.foundation_protocol !== "zerone.karma-foundation/v1" || value.karma?.zerone?.foundation_status !== "design-only" || value.karma?.zerone?.network_observed !== false || value.karma?.zerone?.authoritative !== false || value.karma?.zerone?.event_type !== "zerone.karma.edge" || !Array.isArray(value.karma?.zerone?.event_refs) || value.karma.zerone.event_refs.length !== 0 || value.karma?.zerone?.event_status !== "not_observed" || value.karma?.zerone?.creates_event !== false || !exactStrings(value.karma?.zerone?.semantics, ["contextual", "fallible", "challengeable", "non-summable"]) || !strings(value.karma?.zerone?.not, 9, 9) || !value.karma.zerone.not.includes("truth") || !value.karma.zerone.not.includes("person score") || !value.karma.zerone.not.includes("money") || !value.karma.zerone.not.includes("governance weight")) add("$.karma.zerone", "zerone-event-created-or-mismatched");
    if (!sameKeys(value.karma?.kingdom, ["type", "protocol", "meaning", "accounting", "receipt_refs", "receipt_status", "creates_receipt", "causal_claim_status", "not"]) || value.karma?.kingdom?.type !== "KINGDOM_KARMA_RECEIPT" || value.karma?.kingdom?.protocol !== "kingdom.karma/0.1" || value.karma?.kingdom?.meaning !== "Keep Actions Reversible; Measure Aftermath" || value.karma?.kingdom?.accounting !== "receipts_not_scores" || !Array.isArray(value.karma?.kingdom?.receipt_refs) || value.karma.kingdom.receipt_refs.length !== 0 || value.karma?.kingdom?.receipt_status !== "not_created" || value.karma?.kingdom?.creates_receipt !== false || value.karma?.kingdom?.causal_claim_status !== "not_created" || !strings(value.karma?.kingdom?.not, 6, 6)) add("$.karma.kingdom", "receipt-or-causal-claim-created");
    if (!sameKeys(value.karma?.adapter, ["exists", "status", "reason"]) || value.karma?.adapter?.exists !== false || value.karma?.adapter?.status !== "refused" || !text(value.karma?.adapter?.reason)) add("$.karma.adapter", "implicit-adapter");
    if (!exactIds(value.karma?.design_correspondences, DESIGN_IDS)) add("$.karma.design_correspondences", "design-correspondence-order-or-membership-mismatch");
    for (const [index, correspondence] of array(value.karma?.design_correspondences).entries()) if (!sameKeys(correspondence, ["id", "status", "from", "to", "pattern", "does_not_convert"]) || correspondence?.status !== "not_observed" || !text(correspondence?.from) || !text(correspondence?.to) || !text(correspondence?.pattern) || !strings(correspondence?.does_not_convert, 3, 3)) add(`$.karma.design_correspondences[${index}]`, "observed-or-converting-design-correspondence");

    if (!exactIds(value.unknowns, UNKNOWN_IDS)) add("$.unknowns", "unknown-order-or-membership-mismatch");
    for (const [index, unknown] of array(value.unknowns).entries()) if (!sameKeys(unknown, ["id", "question", "status", "why_open", "source_ids", "binding_ids"]) || !id(unknown?.id) || !text(unknown?.question) || !UNKNOWN_STATES.includes(unknown?.status) || !text(unknown?.why_open) || !references(unknown?.source_ids, sourceIds) || !references(unknown?.binding_ids, bindingIds)) add(`$.unknowns[${index}]`, "invalid-unknown");

    if (!exactIds(value.sources, SOURCE_IDS)) add("$.sources", "source-order-or-membership-mismatch");
    for (const [index, source] of array(value.sources).entries()) if (!sameKeys(source, ["id", "authors", "title", "venue", "published_on", "observed_on", "url", "doi", "source_kind", "used_for", "not_used_for"]) || !id(source?.id) || !strings(source?.authors) || !text(source?.title, 800) || !text(source?.venue, 800) || typeof source?.published_on !== "string" || !YEAR_PRECISION.test(source.published_on) || source?.observed_on !== "2026-08-13" || source?.url !== SOURCE_URLS[index] || source?.doi !== SOURCE_DOIS[index] || !["primary-paper", "primary-author-copy", "scholarly-review"].includes(source?.source_kind) || (index === 5 ? source?.source_kind !== "scholarly-review" : source?.source_kind === "scholarly-review") || !text(source?.used_for) || !text(source?.not_used_for)) add(`$.sources[${index}]`, "invalid-selected-source");

    if (!sameKeys(value.boundaries, Object.keys(EXPECTED_BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
    for (const [key, expected] of Object.entries(EXPECTED_BOUNDARIES)) if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");
    if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM || typeof value.integrity?.digest !== "string" || !SHA256.test(value.integrity.digest)) add("$.integrity", "invalid-integrity-envelope");
    else if (value.integrity.digest !== BEING_ACCESS_AFTERMATH_V02_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
    else if (!issues.length) {
      try { if (beingAccessAftermathV02Digest(value) !== value.integrity.digest) add("$.integrity.digest", "digest-mismatch"); }
      catch { add("$.integrity.digest", "digest-unavailable"); }
    }
  } catch {
    add("$", "verifier-unavailable-for-value");
  }
  return issues;
}

export function loadBeingAccessAftermathAtlasV02(path = BEING_ACCESS_AFTERMATH_V02_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyBeingAccessAftermathAtlasV02(value);
  if (issues.length) fail(`being access aftermath atlas refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

export function beingAccessAftermathPublicDiscoveryV02(value = loadBeingAccessAftermathAtlasV02()): Record<string, any> {
  const issues = verifyBeingAccessAftermathAtlasV02(value);
  if (issues.length) fail(`being access aftermath discovery refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  const predecessor = value.source_bindings.find((binding: Record<string, unknown>) => binding.relation === "immutable-predecessor-input");
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: BEING_ACCESS_AFTERMATH_V02_URL,
    schema: BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
    guide: BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
    cli: "kingdom being-access-aftermath-v0.2",
    integrity: value.integrity,
    lineage: {
      additive_successor: true,
      predecessor: {
        protocol: "kingdom.being-access-aftermath-atlas/0.1",
        atlas_id: predecessor.artifact,
        url: predecessor.url,
        raw_digest: predecessor.raw_digest,
        semantic_digest: predecessor.semantic_digest,
        relation: predecessor.relation,
      },
    },
    counts: {
      predicates: value.typed_copula.predicates.length,
      registers: value.ontology.registers.length,
      entity_types: value.ontology.entity_types.length,
      category_firewalls: value.ontology.category_firewalls.length,
      typed_boundaries: value.typed_boundaries.length,
      models: value.model_cards.length,
      problem_cards: value.problem_cards.length,
      philosophy_questions: value.philosophy_questions.questions.length,
      unknowns: value.unknowns.length,
      sources: value.sources.length,
      framework_predicates: value.framework.predicate_family.predicates.length,
      force_types: value.framework.force_taxonomy.types.length,
      power_types: value.framework.power_taxonomy.types.length,
      power_relations: value.framework.power_taxonomy.relations.length,
      aftermath_dimensions: value.framework.aftermath_accounting.dimension_ids.length,
    },
    karma: {
      cosmic_status: value.karma.cosmic.status,
      cosmic_claims: value.karma.cosmic.claims.length,
      zerone_foundation_status: value.karma.zerone.foundation_status,
      zerone_event_status: value.karma.zerone.event_status,
      zerone_event_refs: value.karma.zerone.event_refs.length,
      kingdom_receipt_status: value.karma.kingdom.receipt_status,
      kingdom_receipt_refs: value.karma.kingdom.receipt_refs.length,
      kingdom_causal_claim_status: value.karma.kingdom.causal_claim_status,
      adapter_exists: value.karma.adapter.exists,
    },
    boundary: {
      public_surface_read_only: true,
      network_calls: false,
      contains_operational_protocol: false,
      medical_authority: false,
      experiment_authority: false,
      wet_lab_protocol: false,
      manufacturing_authority: false,
      causal_claim_created: false,
      causal_authority: false,
      metaphysical_claim_created: false,
      purpose_inferred_from_behavior: false,
      physical_to_social_power_transfer: false,
      person_score: false,
      rank_or_reputation: false,
      writes_karma: false,
      creates_kingdom_karma_receipt: false,
      observes_zerone_karma_event: false,
      karma_adapter: false,
      reward_authority: false,
      economic_authority: false,
      governance_authority: false,
      automatic_action: false,
      mcp_surface_added: false,
      rest_refusal_or_exit_penalized: false,
      rest_refusal_or_exit_requires_trace: false,
    },
  };
}

function overview(value: Record<string, any>): string {
  return [
    value.title,
    "",
    "Possibility is not actuality. Actuality is not accessibility. Accessibility is not observation.",
    "Force is not purpose. Capability is not authority. Aftermath is not causal proof.",
    "Cosmic KARMA, Zerone edges, and KINGDOM receipts remain distinct and empty here.",
    "",
    `${value.model_cards.length} bounded model cards · ${value.problem_cards.length} unrun problem cards · ${value.philosophy_questions.questions.length} opt-in philosophy questions`,
    `evidence through ${value.evidence_through} · ${value.integrity.digest}`,
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write("usage: being-access-aftermath-v0.2.ts [overview|copula|framework|models|problems|philosophy|karma|unknowns|sources|discovery] [--json]\n       being-access-aftermath-v0.2.ts verify [FILE] [--json]\n");
  process.exit(2);
}

export async function runBeingAccessAftermathV02Cli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndex = copy.indexOf("--json");
  const json = jsonIndex >= 0;
  if (json) copy.splice(jsonIndex, 1);
  if (copy.some((arg) => arg.startsWith("-"))) usage();
  if (command === "verify") {
    if (copy.length > 1) usage();
    let issues: BeingAccessAftermathV02Issue[];
    try { issues = verifyBeingAccessAftermathAtlasV02(readUnchecked(copy[0] ? resolve(copy[0]) : BEING_ACCESS_AFTERMATH_V02_PATH)); }
    catch (error) { issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }]; }
    if (json) process.stdout.write(`${JSON.stringify({ valid: issues.length === 0, issues })}\n`);
    else if (!issues.length) process.stdout.write("Being, Access & Aftermath Atlas: valid pins, types, models, unrun problems, philosophy boundary, empty KARMA lanes, selected sources, and semantic digest; JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }
  if (copy.length) usage();
  const value = loadBeingAccessAftermathAtlasV02();
  const selection: Record<string, unknown> = {
    copula: value.typed_copula,
    framework: value.framework,
    models: value.model_cards,
    problems: value.problem_cards,
    philosophy: value.philosophy_questions,
    karma: value.karma,
    unknowns: value.unknowns,
    sources: value.sources,
    discovery: beingAccessAftermathPublicDiscoveryV02(value),
  };
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (Object.hasOwn(selection, command)) process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, [command]: selection[command] }, null, json ? 0 : 2)}\n`);
  else usage();
}

if (import.meta.main) {
  try { await runBeingAccessAftermathV02Cli(); }
  catch (error) { process.stderr.write(`being-access-aftermath refused: ${error instanceof Error ? error.message : "invalid input"}\n`); process.exit(1); }
}
