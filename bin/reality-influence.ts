#!/usr/bin/env bun
/**
 * Strict, offline reader for the Reality Influence Claim Graph.
 *
 * This is a reviewed static claim-boundary atlas. It does not dereference
 * sources, accept live claims, authenticate authority or consent, execute an
 * action, observe an outcome, identify causation, or assess goodness.
 * Human-authored prose is untrusted data and is never executed.
 */

import { createHash } from "node:crypto";
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const REALITY_INFLUENCE_PROTOCOL = "kingdom.reality-influence-claim-graph/0.1";
export const REALITY_INFLUENCE_SCHEMA_ID = "urn:kingdom:schema:reality-influence-claim-graph:0.1";
export const REALITY_INFLUENCE_MAP_ID = "reality-influence-claim-graph-2026-08-21";
export const REALITY_INFLUENCE_LOCATOR = "data/reality/reality-influence-map.v0.1.json";
export const REALITY_INFLUENCE_PATH = join(ROOT, REALITY_INFLUENCE_LOCATOR);
export const REALITY_INFLUENCE_SCHEMA_LOCATOR = "schemas/reality-influence-map-v0.1.schema.json";
export const REALITY_INFLUENCE_SCHEMA_PATH = join(ROOT, REALITY_INFLUENCE_SCHEMA_LOCATOR);
export const REALITY_INFLUENCE_REVIEWED_DIGEST = "sha256:7b18c3372d08a680d94bc2d243d09624dbe21ad8575b4f3d2dec9fab878ecd4a";

const MAX_BYTES = 1024 * 1024;
const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UPPER_ID = /^[A-Z]+(?:_[A-Z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REPO_REF = /^repo:[A-Za-z0-9._/-]+$/;

const TOP_KEYS = [
  "$schema", "protocol", "map_id", "version", "title", "compiled_on",
  "evidence_through", "state", "scope", "source_bindings", "sources",
  "claim_registers", "type_firewall", "reality_domains",
  "influence_dimensions", "claim_node_types", "relation_vocabulary",
  "claim_ladder", "action_gate", "pathway_templates", "feedback_loops",
  "kingdom_influence_map", "agent_specialisations", "unknowns",
  "boundaries", "integrity",
] as const;

const SCOPE_KEYS = [
  "question", "definition_of_reality", "intended_use", "excluded_use",
  "unit_of_analysis", "data_classification", "operating_state",
] as const;
const BINDING_KEYS = ["id", "protocol", "locator", "raw_digest", "semantic_digest", "relation", "mutated", "authority_imported"] as const;
const SOURCE_KEYS = ["id", "title", "locator", "kind", "observed_on", "claim_scope", "limitations"] as const;
const REGISTER_KEYS = ["id", "meaning", "does_not_establish"] as const;
const DOMAIN_KEYS = ["id", "label", "definition", "observable_examples", "not_equivalent_to"] as const;
const DIMENSION_KEYS = ["id", "meaning", "aggregate_weight", "rank"] as const;
const NODE_KEYS = ["id", "meaning", "allowed_statuses", "required_fields", "does_not_establish"] as const;
const RELATION_KEYS = ["id", "from_kind_ids", "to_kind_ids", "meaning", "transitive", "default_claim_status", "does_not_establish"] as const;
const LADDER_KEYS = ["level", "id", "claim", "minimum_evidence", "cannot_establish"] as const;
const ACTION_GATE_KEYS = [
  "status", "fail_closed", "required_gate_inputs", "refusing_states",
  "phase_order", "pre_invocation_non_actions", "post_attempt_terminal_states",
  "authority_verification", "consent_and_lawful_basis_verification",
  "affected_party_completeness", "execution_available",
  "feedback_can_open_review_only", "repair_requires_fresh_gate",
] as const;
const PATHWAY_KEYS = [
  "id", "title", "stage_ids", "relation_ids", "influence_dimension_ids",
  "enabling_conditions", "blockers", "affected_party_categories", "status",
  "action_attempted", "external_effect_claimed", "causal_effect_claimed",
  "authority_granted",
] as const;
const FEEDBACK_KEYS = [
  "id", "title", "sequence", "source_ids", "mechanism_status",
  "metric_endogenous_after_targeting", "automatic_action",
  "causal_effect_claimed", "risks", "stop_condition",
] as const;
const KINGDOM_KEYS = [
  "id", "surface", "immediate_change", "possible_mediated_path",
  "required_next_gate", "primary_risks", "status",
  "external_effect_claimed", "authority_granted",
] as const;
const AGENT_KEYS = [
  "id", "role", "required_inputs", "allowed_outputs", "forbidden_outputs",
  "status", "can_dispatch", "can_authorize", "can_act",
] as const;
const UNKNOWN_KEYS = ["id", "question", "why_unknown", "needed_evidence", "stop_condition"] as const;
const INTEGRITY_KEYS = ["algorithm", "digest", "digest_field_zeroed"] as const;

const REGISTER_IDS = [
  "PRIMARY_RECORD", "EMPIRICAL_CAUSAL", "EMPIRICAL_ASSOCIATION",
  "FORMAL_MODEL_OR_METHOD", "PHILOSOPHICAL_OR_INSTITUTIONAL_THEORY",
  "TECHNICAL_STANDARD_OR_GUIDANCE", "LEGAL_OR_NORMATIVE_INSTRUMENT",
  "ANALOGY", "DESIGN_COMMITMENT", "OPEN_QUESTION", "BOUNDARY",
] as const;
const SOURCE_IDS = [
  "w3c-prov-dm", "nist-ai-rmf", "hernan-robins-what-if",
  "meadows-leverage-points", "ostrom-polycentric-governance", "ohchr-ungp",
  "bond-mobilization", "muchnik-social-influence", "salganik-cultural-market",
  "ensign-predictive-policing", "goodhart-source-record",
  "campbell-social-indicators", "sagas-compensation", "rfc-6749", "rfc-9700",
  "saltzer-schroeder", "searle-social-ontology",
] as const;
const DOMAIN_IDS = [
  "semantic-symbolic", "informational-record", "attention-exposure",
  "social-relational", "institutional-status", "legal-jurisdictional",
  "economic-resource", "digital-computational", "material-cyberphysical",
  "embodied-health", "ecological", "normative-public",
] as const;
const DIMENSION_IDS = [
  "semantic-legibility", "provenance-traceability", "discoverability",
  "attention-allocation", "interpretive-framing", "coordination",
  "institutional-selection", "authorized-reach", "operational-capability",
  "digital-or-material-state-change", "distributional-aftermath",
  "path-dependence", "feedback-sensitivity", "repair-capacity",
] as const;
const NODE_IDS = [
  "EXPRESSION", "ARTIFACT", "DISTRIBUTION_OBSERVATION",
  "ATTENTION_OBSERVATION", "PUBLIC_RESPONSE_RECORD", "CLAIM_ASSESSMENT",
  "ASSOCIATION_OBSERVATION", "ACTION_PROPOSAL", "DECISION_RECORD",
  "AUTHORITY_GRANT_CLAIM", "AFFECTED_PARTY_REGISTER", "CONSENT_RECORD",
  "LAWFUL_BASIS_CLAIM", "RIGHTS_ASSESSMENT", "CAPABILITY_EVIDENCE",
  "INVOCATION_ATTEMPT", "ACTION_EXECUTION", "OUTCOME_OBSERVATION",
  "CAUSAL_ESTIMAND", "CAUSAL_ASSESSMENT", "NORMATIVE_ASSESSMENT",
  "FEEDBACK_ITEM", "REPAIR_PROPOSAL", "REPAIR_ATTEMPT", "NON_ACTION",
] as const;
const RELATION_IDS = [
  "EXPRESSES", "EMBODIES_EXPRESSION", "DERIVES_FROM",
  "DISTRIBUTES_ARTIFACT", "MEASURES_EXPOSURE_TO",
  "REPORTS_PUBLIC_RESPONSE_TO", "ASSOCIATED_WITH", "SELECTS_PROPOSAL",
  "CLAIMS_AUTHORITY_FOR", "RECORDS_CONSENT_TO",
  "CLAIMS_LAWFUL_BASIS_FOR", "TECHNICALLY_ENABLES", "POTENTIALLY_AFFECTS",
  "ATTEMPTS", "EXECUTES_ATTEMPT", "PRECEDES_OUTCOME",
  "DEFINES_ESTIMAND_FOR", "ASSESSES_CAUSAL_EFFECT",
  "ASSESSES_UNDER_FRAMEWORK", "CHALLENGES", "CORRECTS", "SUPERSEDES",
  "WITHDRAWS", "RESPONDS_WITH_REPAIR",
] as const;
const LADDER_IDS = [
  "expression-recorded", "artifact-versioned", "distribution-witnessed",
  "exposure-measured", "public-response-attributed", "proposal-recorded",
  "decision-recorded", "authority-claim-verified",
  "affected-party-basis-reviewed", "capability-verified",
  "invocation-attempt-witnessed", "execution-status-witnessed",
  "outcome-observed", "causal-effect-assessed",
  "normative-assessment-separated", "repair-proposed",
  "repair-outcome-reviewed",
] as const;
const PATHWAY_IDS = [
  "expression-to-public-deliberation", "research-to-bounded-use",
  "software-to-external-aftermath", "challenge-to-repair",
] as const;
const FEEDBACK_IDS = [
  "attention-selection-return", "metric-target-adaptation",
  "institution-rule-behavior", "action-outcome-learning",
  "challenge-repair-learning",
] as const;
const KINGDOM_IDS = [
  "semantic-receipts", "language-and-story-maps", "research-observatory",
  "trial-chamber", "wake-work-witness", "being-access-aftermath",
  "communication-conventions", "reality-influence-claim-graph",
] as const;
const AGENT_IDS = [
  "provenance-curator", "expression-shape-steward",
  "attention-and-metric-auditor", "countermodel-steward",
  "authority-rights-and-consent-verifier", "execution-witness-steward",
  "causal-inference-skeptic", "affected-party-and-externality-reviewer",
  "repair-and-retirement-steward",
] as const;
const UNKNOWN_IDS = [
  "complete-mediation-path", "affected-party-completeness",
  "authority-authenticity", "consent-and-lawful-basis-validity",
  "metric-endogeneity", "distributional-aftermath", "repair-adequacy",
  "kingdom-external-effect",
] as const;

const EXPECTED_BINDINGS = [
  ["word-story-religion-civilisation", "kingdom.word-story-religion-civilisation-map/0.1", "repo:data/language/word-story-religion-civilisation-map.v0.1.json", "sha256:a4a87b7b23dbdf7e7e6689b5083f76a746c7f41bc56f2124281dfda609a62479", "sha256:0c791b2491ebdcd85cf58e26e41e8b35b883781fd26bccc19dfd3f7853c7855a"],
  ["language-civilisation-task-fusion", "kingdom.language-civilisation-task-fusion/0.1", "repo:data/language/language-civilisation-task-fusion.v0.1.json", "sha256:ef26859f84d8e2a1bc5e73f88594a354c49594e28486aae5aa340ed207aa0e25", "sha256:fb37df061bca86357b46e5538664d72e8938def8cfff341c3aa9596abc84d296"],
  ["being-access-aftermath-v0-2", "kingdom.being-access-aftermath-atlas/0.2", "repo:data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json", "sha256:9678e5269e8db62beb36abee691087cddbc4f98703190c5fa3788b68c89ab29e", "sha256:505a1e3aef6116430dccf49b327c4cce2ac5d6fb6b6b9bf68e529272f989cde8"],
  ["cultural-attention-feedback", "kingdom.cultural-attention-feedback-atlas/0.1", "repo:data/cultural-feedback/cultural-attention-feedback-atlas.v1.json", "sha256:03f7048966d7b6df582b423254b4d73cda72cce3bd67b40736927faa92b88173", "sha256:2f6ecadc131a54cdd500b001dbcc47fb036e5e411def918245fec963b9769e4d"],
  ["form-circulation-return", "kingdom.form-circulation-return-atlas/0.1", "repo:data/form-circulation-return/form-circulation-return-atlas.v1.json", "sha256:9c93be61c4ca9bcaa3dbe88b10faed3b5b31abaf1129d70ca7915226cacfd021", "sha256:9510fbbced6166507e9a1781a4adfa18cd249fb94e69b0f34faf77733cd20323"],
  ["semantic-transition-schema", "kingdom.semantic-transition/0.1", "repo:bridges/schemas/semantic-transition-receipt-0.1.json", "sha256:bcdd99f0247f2a43bb84e227865c2d02f12dcc9f09e4c15b29c36a90ac8f0dc2", null],
  ["relational-inference-schema", "kingdom.relational-inference/0.1", "repo:bridges/schemas/relational-inference-case-0.1.json", "sha256:c244cc072eb20396bbc1de9ee2d8a30510e78c7a25a3fecef53ae1bd6a34fa7c", null],
  ["research-observatory-guide", "kingdom.research-observatory-guide/0.1", "repo:references/research-observatory-v0.1.md", "sha256:f1b11fd810049c884eb6205360c42dae17ea8faddca9e0f7ff374e1bc65e99a0", null],
  ["trial-chamber-phase-zero", "kingdom.trial-public-snapshot/0.1", "repo:data/trials/research-trial-chamber.v0.1.json", "sha256:6e59bf134d129b17fc0f02949d9ef383de6787e2bc39e1714a3c6f01376b1d34", null],
  ["wake-work-witness", "kingdom.wake-work-witness-atlas/0.1", "repo:data/economy/wake-work-witness-atlas.v0.1.json", "sha256:a951a3529758f11a5bd3a83ae3c46272226b191c1d3b4768af1b562eabcb164c", "sha256:0b2eb18f9a59a3e44371f31d366a95382eb4f4ab7f6a4583b3e63d50aace3433"],
] as const;

const FIREWALL = {
  word_is_not_world_state: true,
  story_genre_is_not_truth_or_falsehood: true,
  expression_is_not_artifact: true,
  artifact_is_not_distribution: true,
  availability_is_not_exposure: true,
  exposure_is_not_attention_agreement_or_belief: true,
  public_response_is_not_private_mental_state: true,
  proposal_is_not_decision: true,
  decision_is_not_authority: true,
  authority_is_not_consent_or_lawful_basis: true,
  authority_is_not_capability: true,
  capability_is_not_permission: true,
  attempt_is_not_execution: true,
  execution_is_not_success: true,
  sequence_is_not_causation: true,
  outcome_is_not_causal_effect: true,
  causal_effect_is_not_goodness_legitimacy_or_justice: true,
  measurement_is_not_value: true,
  popularity_is_not_consensus_or_consent: true,
  silence_refusal_privacy_and_rest_are_not_consent: true,
  provenance_is_not_truth_causation_or_authority: true,
  repair_is_not_erasure_absolution_or_restored_consent: true,
  kingdom_receipt_is_not_external_world_fact: true,
} as const;

const BOUNDARIES = {
  read_only: true,
  structure_only: true,
  research_local: true,
  static_atlas: true,
  public_or_safely_redacted_only: true,
  network: false,
  filesystem_write: false,
  source_dereference: false,
  live_claim_intake: false,
  model_or_tokenizer_run: false,
  agent_dispatch: false,
  mcp_or_nen_ability: false,
  publication: false,
  deployment: false,
  trial_requested: false,
  adoption_recorded: false,
  use_authority_issued: false,
  authority_granted: false,
  consent_granted_or_inferred: false,
  lawful_basis_established: false,
  capability_granted: false,
  action_proposed_by_runtime: false,
  action_attempted: false,
  action_executed: false,
  external_effect_claimed: false,
  causal_effect_identified: false,
  goodness_legitimacy_or_justice_proved: false,
  belief_identity_intent_or_deception_inferred: false,
  person_or_community_score: false,
  persuasion_or_behavioral_targeting: false,
  writes_wake: false,
  writes_karma: false,
  economic_legal_medical_governance_or_physical_authority: false,
  automatic_action: false,
  feedback_opens_review_only: true,
  non_action_has_no_adverse_inference: true,
  affected_party_disagreement_retained: true,
  repair_requires_fresh_gate: true,
  repair_preserves_history_and_residuals: true,
} as const;

const SOURCE_KINDS = new Set([
  "technical-standard", "authoritative-guidance", "scholarly-method",
  "systems-essay", "scholarly-lecture", "normative-instrument",
  "peer-reviewed-experiment", "formal-model",
  "institutional-bibliographic-record", "computer-science-model",
  "computer-security-paper", "philosophical-theory",
]);

export type RealityInfluenceIssue = { field: string; code: string };
export type RealityInfluenceValidationOptions = { asOf?: string; canonical?: boolean };

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}
function text(value: unknown, max = 16_000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}
function stringArray(value: unknown, min = 0, max = 128): value is string[] {
  return Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype &&
    value.length >= min && value.length <= max && new Set(value).size === value.length &&
    value.every((entry) => text(entry, 8_000));
}
function exactStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry === expected[index]);
}
function itemIds(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => entry?.id).filter((entry) => typeof entry === "string") : [];
}
function exactIds(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry?.id === expected[index]);
}
function references(value: unknown, universe: ReadonlySet<string>, min = 0): boolean {
  return stringArray(value, min) && value.every((entry) => universe.has(entry));
}
function realDate(value: unknown): value is string {
  if (typeof value !== "string" || !FULL_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function canonicalHttps(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.search && !url.hash && url.href === value;
  } catch { return false; }
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
      if (!Number.isFinite(current.value) || Object.is(current.value, -0)) return "invalid-json-number";
      continue;
    }
    if (typeof current.value !== "object") return "non-json-value";
    if (current.depth > 96) return "json-depth-exceeded";
    if (++nodes > 100_000) return "json-node-budget-exceeded";
    if (seen.has(current.value)) return "cyclic-or-shared-reference";
    seen.add(current.value);
    if (Object.getOwnPropertySymbols(current.value).length !== 0) return "symbol-key-forbidden";
    const prototype = Object.getPrototypeOf(current.value);
    if (Array.isArray(current.value)) {
      if (prototype !== Array.prototype) return "non-json-array";
      const keys = Object.keys(current.value);
      const names = Object.getOwnPropertyNames(current.value);
      if (keys.length !== current.value.length || keys.some((key, index) => key !== String(index)) ||
          names.length !== current.value.length + 1 || names.at(-1) !== "length") return "sparse-or-extended-array";
    } else if (prototype !== Object.prototype && prototype !== null) return "non-json-object";
    else if (Object.getOwnPropertyNames(current.value).length !== Object.keys(current.value).length) return "non-enumerable-property";
    const descriptors = Object.getOwnPropertyDescriptors(current.value);
    if (Object.values(descriptors).some((descriptor) => typeof descriptor.get === "function" || typeof descriptor.set === "function")) return "accessor-property";
    for (const descriptor of Object.values(descriptors)) if (Object.hasOwn(descriptor, "value")) stack.push({ value: descriptor.value, depth: current.depth + 1 });
  }
  return null;
}

export function realityInfluenceDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("reality-influence integrity envelope is missing");
  material.integrity.digest = ZERO_DIGEST;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let pathStat;
  try { pathStat = lstatSync(absolute); } catch { fail("reality-influence map is unavailable"); }
  if (!pathStat.isFile() || pathStat.isSymbolicLink()) fail("reality-influence map must be a regular non-symlink file");
  if (pathStat.size > MAX_BYTES) fail(`reality-influence map exceeds ${MAX_BYTES} bytes`);
  if (typeof fsConstants.O_NOFOLLOW !== "number" || typeof fsConstants.O_NONBLOCK !== "number") fail("reality-influence safe-open flags are unavailable");
  let descriptor: number;
  try { descriptor = openSync(absolute, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK); }
  catch { fail("reality-influence map could not be opened safely"); }
  try {
    const before = fstatSync(descriptor);
    if (!before.isFile() || before.dev !== pathStat.dev || before.ino !== pathStat.ino || before.size !== pathStat.size) fail("reality-influence map changed while opening");
    if (before.size > MAX_BYTES) fail(`reality-influence map exceeds ${MAX_BYTES} bytes`);
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor);
    if (after.dev !== before.dev || after.ino !== before.ino || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) fail("reality-influence map changed while reading");
    if (bytes.byteLength > MAX_BYTES) fail(`reality-influence map exceeds ${MAX_BYTES} bytes`);
    return parseStrictJsonBytes(bytes, "reality-influence map JSON");
  } finally { closeSync(descriptor); }
}

export function validateRealityInfluenceMap(
  value: unknown,
  options: RealityInfluenceValidationOptions = {},
): RealityInfluenceIssue[] {
  const issues: RealityInfluenceIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  const asOf = options.asOf ?? "2026-08-21";
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    const shape = jsonShapeIssue(value);
    if (shape) return [{ field: "$", code: shape }];
    if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
    if (value.$schema !== REALITY_INFLUENCE_SCHEMA_ID) add("$.$schema", "schema-mismatch");
    if (value.protocol !== REALITY_INFLUENCE_PROTOCOL) add("$.protocol", "protocol-mismatch");
    if (value.map_id !== REALITY_INFLUENCE_MAP_ID || value.version !== "0.1.0") add("$.map_id", "identity-mismatch");
    if (!text(value.title) || value.state !== "reviewed-static-claim-boundary-atlas") add("$.state", "state-mismatch");
    if (!realDate(value.compiled_on) || !realDate(value.evidence_through) || !realDate(asOf) ||
        value.evidence_through > value.compiled_on || value.compiled_on > asOf) add("$.evidence_through", "invalid-or-future-horizon");

    if (!sameKeys(value.scope, SCOPE_KEYS) || !Object.values(value.scope ?? {}).every((entry) => text(entry))) add("$.scope", "invalid-scope");
    if (value.scope?.data_classification !== "public-attributed-source-metadata-and-design-only" || value.scope?.operating_state !== "static-structure-only-no-live-claims-no-execution") add("$.scope", "operating-boundary-mismatch");

    const bindings = Array.isArray(value.source_bindings) ? value.source_bindings : [];
    if (bindings.length !== EXPECTED_BINDINGS.length || !exactStrings(itemIds(bindings), EXPECTED_BINDINGS.map((entry) => entry[0]))) add("$.source_bindings", "binding-order-or-membership-mismatch");
    for (const [index, binding] of bindings.entries()) {
      if (!sameKeys(binding, BINDING_KEYS) || !ID.test(binding?.id ?? "") || !text(binding?.protocol) || !REPO_REF.test(binding?.locator ?? "") || !SHA256.test(binding?.raw_digest ?? "") || !(binding?.semantic_digest === null || SHA256.test(binding.semantic_digest)) || !text(binding?.relation) || binding?.mutated !== false || binding?.authority_imported !== false) add(`$.source_bindings[${index}]`, "invalid-source-binding");
      const expected = EXPECTED_BINDINGS[index];
      if (!expected || binding?.id !== expected[0] || binding?.protocol !== expected[1] || binding?.locator !== expected[2] || binding?.raw_digest !== expected[3] || binding?.semantic_digest !== expected[4]) add(`$.source_bindings[${index}]`, "source-binding-mismatch");
    }

    const sources = Array.isArray(value.sources) ? value.sources : [];
    const sourceIds = new Set<string>(itemIds(sources));
    if (!exactIds(sources, SOURCE_IDS)) add("$.sources", "source-order-or-membership-mismatch");
    for (const [index, source] of sources.entries()) {
      if (!sameKeys(source, SOURCE_KEYS) || !ID.test(source?.id ?? "") || !text(source?.title) || !canonicalHttps(source?.locator) || !SOURCE_KINDS.has(source?.kind) || !realDate(source?.observed_on) || source.observed_on > value.evidence_through || !text(source?.claim_scope) || !stringArray(source?.limitations, 1)) add(`$.sources[${index}]`, "invalid-source");
    }

    const registers = Array.isArray(value.claim_registers) ? value.claim_registers : [];
    if (!exactIds(registers, REGISTER_IDS)) add("$.claim_registers", "register-order-or-membership-mismatch");
    for (const [index, register] of registers.entries()) if (!sameKeys(register, REGISTER_KEYS) || !UPPER_ID.test(register?.id ?? "") || !text(register?.meaning) || !text(register?.does_not_establish)) add(`$.claim_registers[${index}]`, "invalid-register");

    if (!sameKeys(value.type_firewall, Object.keys(FIREWALL))) add("$.type_firewall", "firewall-set-mismatch");
    for (const [key, expected] of Object.entries(FIREWALL)) if (value.type_firewall?.[key] !== expected) add(`$.type_firewall.${key}`, "firewall-mismatch");

    const domains = Array.isArray(value.reality_domains) ? value.reality_domains : [];
    if (!exactIds(domains, DOMAIN_IDS)) add("$.reality_domains", "domain-order-or-membership-mismatch");
    for (const [index, domain] of domains.entries()) if (!sameKeys(domain, DOMAIN_KEYS) || !ID.test(domain?.id ?? "") || !text(domain?.label) || !text(domain?.definition) || !stringArray(domain?.observable_examples, 1) || !stringArray(domain?.not_equivalent_to, 1)) add(`$.reality_domains[${index}]`, "invalid-domain");

    const dimensions = Array.isArray(value.influence_dimensions) ? value.influence_dimensions : [];
    const dimensionIds = new Set<string>(itemIds(dimensions));
    if (!exactIds(dimensions, DIMENSION_IDS)) add("$.influence_dimensions", "dimension-order-or-membership-mismatch");
    for (const [index, dimension] of dimensions.entries()) if (!sameKeys(dimension, DIMENSION_KEYS) || !ID.test(dimension?.id ?? "") || !text(dimension?.meaning) || dimension?.aggregate_weight !== null || dimension?.rank !== null) add(`$.influence_dimensions[${index}]`, "scalar-or-rank-influence-forbidden");

    const nodes = Array.isArray(value.claim_node_types) ? value.claim_node_types : [];
    const nodeIds = new Set<string>(itemIds(nodes));
    if (!exactIds(nodes, NODE_IDS)) add("$.claim_node_types", "node-order-or-membership-mismatch");
    for (const [index, node] of nodes.entries()) if (!sameKeys(node, NODE_KEYS) || !UPPER_ID.test(node?.id ?? "") || !text(node?.meaning) || !stringArray(node?.allowed_statuses, 1) || !stringArray(node?.required_fields, 1) || !text(node?.does_not_establish)) add(`$.claim_node_types[${index}]`, "invalid-node-type");

    const relations = Array.isArray(value.relation_vocabulary) ? value.relation_vocabulary : [];
    const relationIds = new Set<string>(itemIds(relations));
    if (!exactIds(relations, RELATION_IDS)) add("$.relation_vocabulary", "relation-order-or-membership-mismatch");
    for (const [index, relation] of relations.entries()) {
      if (!sameKeys(relation, RELATION_KEYS) || !UPPER_ID.test(relation?.id ?? "") || !references(relation?.from_kind_ids, nodeIds, 1) || !references(relation?.to_kind_ids, nodeIds, 1) || !text(relation?.meaning) || relation?.transitive !== false || !text(relation?.default_claim_status) || !text(relation?.does_not_establish)) add(`$.relation_vocabulary[${index}]`, "invalid-relation-type");
      if (["INFLUENCES", "CAUSES", "AUTHORIZES", "CONSENTS", "GOOD", "PROVES"].includes(relation?.id)) add(`$.relation_vocabulary[${index}]`, "generic-authority-or-causation-edge-forbidden");
      if (relation?.id === "ASSOCIATED_WITH" && relation?.default_claim_status !== "empirical-association") add(`$.relation_vocabulary[${index}]`, "association-promoted-to-causation");
      if (relation?.id === "PRECEDES_OUTCOME" && relation?.default_claim_status !== "descriptive-sequence") add(`$.relation_vocabulary[${index}]`, "sequence-promoted-to-causation");
      if (relation?.id === "ASSESSES_CAUSAL_EFFECT" && relation?.default_claim_status !== "identified-under-declared-assumptions") add(`$.relation_vocabulary[${index}]`, "causal-assessment-status-mismatch");
    }

    const ladder = Array.isArray(value.claim_ladder) ? value.claim_ladder : [];
    const ladderIds = new Set<string>(itemIds(ladder));
    if (!exactIds(ladder, LADDER_IDS)) add("$.claim_ladder", "ladder-order-or-membership-mismatch");
    for (const [index, rung] of ladder.entries()) if (!sameKeys(rung, LADDER_KEYS) || rung?.level !== index || !ID.test(rung?.id ?? "") || !text(rung?.claim) || !stringArray(rung?.minimum_evidence, 1) || !text(rung?.cannot_establish)) add(`$.claim_ladder[${index}]`, "invalid-claim-ladder-rung");

    const gate = value.action_gate;
    if (!sameKeys(gate, ACTION_GATE_KEYS) || gate?.status !== "not-implemented-static-boundary" || gate?.fail_closed !== true || !stringArray(gate?.required_gate_inputs, 8) || !exactStrings(gate?.refusing_states, ["UNKNOWN", "EXPIRED", "REVOKED", "CONFLICTED", "FAILED"]) || !exactStrings(gate?.phase_order, ["DRAFT", "REVIEWED_PROPOSAL", "GATE_REVIEW", "INVOCATION_ATTEMPTED", "EXECUTION_STATUS", "OUTCOME_OBSERVED", "CAUSAL_ASSESSMENT", "NORMATIVE_ASSESSMENT", "REPAIR_REVIEW"]) || !exactStrings(gate?.pre_invocation_non_actions, ["REST", "REFUSAL", "SILENCE", "PRIVACY", "DEFER", "EXPIRE", "WITHDRAW"]) || !exactStrings(gate?.post_attempt_terminal_states, ["REFUSED_AFTER_ATTEMPT", "CANCELLED", "FAILED", "PARTIAL", "COMPLETED"]) || gate?.authority_verification !== "external-and-unimplemented" || gate?.consent_and_lawful_basis_verification !== "external-and-unimplemented" || gate?.affected_party_completeness !== "external-review-required-and-unknown-permitted-only-if-explicit" || gate?.execution_available !== false || gate?.feedback_can_open_review_only !== true || gate?.repair_requires_fresh_gate !== true) add("$.action_gate", "action-gate-or-non-action-boundary-mismatch");

    const pathways = Array.isArray(value.pathway_templates) ? value.pathway_templates : [];
    if (!exactIds(pathways, PATHWAY_IDS)) add("$.pathway_templates", "pathway-order-or-membership-mismatch");
    for (const [index, pathway] of pathways.entries()) {
      if (!sameKeys(pathway, PATHWAY_KEYS) || !ID.test(pathway?.id ?? "") || !text(pathway?.title) || !references(pathway?.stage_ids, ladderIds, 1) || !references(pathway?.relation_ids, relationIds, 1) || !references(pathway?.influence_dimension_ids, dimensionIds, 1) || !stringArray(pathway?.enabling_conditions, 1) || !stringArray(pathway?.blockers, 1) || !stringArray(pathway?.affected_party_categories, 1) || pathway?.status !== "template-not-run" || pathway?.action_attempted !== false || pathway?.external_effect_claimed !== false || pathway?.causal_effect_claimed !== false || pathway?.authority_granted !== false) add(`$.pathway_templates[${index}]`, "invalid-or-promoted-pathway");
    }

    const loops = Array.isArray(value.feedback_loops) ? value.feedback_loops : [];
    if (!exactIds(loops, FEEDBACK_IDS)) add("$.feedback_loops", "feedback-order-or-membership-mismatch");
    for (const [index, loop] of loops.entries()) if (!sameKeys(loop, FEEDBACK_KEYS) || !ID.test(loop?.id ?? "") || !text(loop?.title) || !stringArray(loop?.sequence, 2) || !references(loop?.source_ids, sourceIds, 1) || !text(loop?.mechanism_status) || typeof loop?.metric_endogenous_after_targeting !== "boolean" || loop?.automatic_action !== false || loop?.causal_effect_claimed !== false || !stringArray(loop?.risks, 1) || !text(loop?.stop_condition)) add(`$.feedback_loops[${index}]`, "invalid-or-automatic-feedback-loop");

    const kingdom = Array.isArray(value.kingdom_influence_map) ? value.kingdom_influence_map : [];
    if (!exactIds(kingdom, KINGDOM_IDS)) add("$.kingdom_influence_map", "kingdom-map-order-or-membership-mismatch");
    for (const [index, entry] of kingdom.entries()) if (!sameKeys(entry, KINGDOM_KEYS) || !ID.test(entry?.id ?? "") || !text(entry?.surface) || !text(entry?.immediate_change) || !stringArray(entry?.possible_mediated_path, 1) || !text(entry?.required_next_gate) || !stringArray(entry?.primary_risks, 1) || !text(entry?.status) || entry?.external_effect_claimed !== false || entry?.authority_granted !== false) add(`$.kingdom_influence_map[${index}]`, "invalid-or-promoted-kingdom-influence");

    const agents = Array.isArray(value.agent_specialisations) ? value.agent_specialisations : [];
    if (!exactIds(agents, AGENT_IDS)) add("$.agent_specialisations", "agent-order-or-membership-mismatch");
    for (const [index, agent] of agents.entries()) if (!sameKeys(agent, AGENT_KEYS) || !ID.test(agent?.id ?? "") || !text(agent?.role) || !stringArray(agent?.required_inputs, 1) || !stringArray(agent?.allowed_outputs, 1) || !stringArray(agent?.forbidden_outputs, 1) || agent?.status !== "future-role-design-only" || agent?.can_dispatch !== false || agent?.can_authorize !== false || agent?.can_act !== false) add(`$.agent_specialisations[${index}]`, "invalid-or-promoted-agent-role");

    const unknowns = Array.isArray(value.unknowns) ? value.unknowns : [];
    if (!exactIds(unknowns, UNKNOWN_IDS)) add("$.unknowns", "unknown-order-or-membership-mismatch");
    for (const [index, unknown] of unknowns.entries()) if (!sameKeys(unknown, UNKNOWN_KEYS) || !ID.test(unknown?.id ?? "") || !text(unknown?.question) || !text(unknown?.why_unknown) || !stringArray(unknown?.needed_evidence, 1) || !text(unknown?.stop_condition)) add(`$.unknowns[${index}]`, "invalid-unknown");

    if (!sameKeys(value.boundaries, Object.keys(BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
    for (const [key, expected] of Object.entries(BOUNDARIES)) if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");

    if (!sameKeys(value.integrity, INTEGRITY_KEYS) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM || !SHA256.test(value.integrity?.digest ?? "") || value.integrity?.digest_field_zeroed !== true) add("$.integrity", "invalid-integrity-envelope");
    else {
      const computed = realityInfluenceDigest(value);
      if (value.integrity.digest !== computed) add("$.integrity.digest", "digest-mismatch");
      if (value.integrity.digest !== REALITY_INFLUENCE_REVIEWED_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
    }
  } catch {
    add("$", "validator-unavailable-for-value");
  }
  return issues;
}

export function loadRealityInfluenceMap(path = REALITY_INFLUENCE_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = validateRealityInfluenceMap(value, { canonical: resolve(path) === resolve(REALITY_INFLUENCE_PATH) });
  if (issues.length) fail(`reality-influence map refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

function overview(value: Record<string, any>): string {
  return [
    value.title,
    "",
    "KINGDOM can directly change its own versioned artifacts. Any external influence remains mediated through distribution, attributed response, decision, separate authority and rights gates, capability, execution, outcome observation, causal assessment, and plural aftermath review.",
    "No relation in this atlas is a generic INFLUENCES, CAUSES, AUTHORIZES, CONSENTS, PROVES, or GOOD edge.",
    "Influence is a non-summable vector; non-action, dissent, externality, residual harm, and repair remain first-class.",
    "",
    `${value.reality_domains.length} reality domains · ${value.influence_dimensions.length} non-summable dimensions · ${value.claim_node_types.length} claim-node types · ${value.relation_vocabulary.length} endpoint-safe relations · ${value.claim_ladder.length} evidence rungs`,
    `${value.pathway_templates.length} unrun pathway templates · ${value.feedback_loops.length} feedback templates · ${value.agent_specialisations.length} future non-operational roles`,
    `evidence through ${value.evidence_through} · ${value.integrity.digest}`,
    "",
    "STRUCTURE ONLY — sources and prose are not verified; no truth, authority, consent, lawful basis, capability, action, external effect, causation, goodness, legitimacy, justice, repair, publication, or deployment is established.",
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write("usage: bun bin/reality-influence.ts [overview|domains|nodes|relations|ladder|gate|pathways|feedback|kingdom|agents|unknowns|boundaries|verify] [--json]\n");
  process.exit(2);
}

export async function runRealityInfluenceCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndexes = copy.flatMap((entry, index) => entry === "--json" ? [index] : []);
  if (jsonIndexes.length > 1) usage();
  const json = jsonIndexes.length === 1;
  if (json) copy.splice(jsonIndexes[0]!, 1);
  if (copy.length) usage();
  if (command === "verify") {
    let issues: RealityInfluenceIssue[];
    try { issues = validateRealityInfluenceMap(readUnchecked(REALITY_INFLUENCE_PATH), { canonical: true }); }
    catch (error) { issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }]; }
    const report = {
      valid: issues.length === 0,
      protocol: REALITY_INFLUENCE_PROTOCOL,
      structure_only: true,
      schema_checked: false,
      source_dereferenced: false,
      live_claims_evaluated: false,
      authority_or_consent_verified: false,
      action_or_external_effect_created: false,
      causation_or_goodness_established: false,
      issues,
    };
    if (json) process.stdout.write(`${JSON.stringify(report)}\n`);
    else if (!issues.length) process.stdout.write("Reality Influence Claim Graph: valid static structure, endpoint-safe relations, non-summable influence, fail-closed gates, non-grants, and semantic digest; sources and JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }
  const value = loadRealityInfluenceMap();
  const selection: Record<string, unknown> = {
    domains: { reality_domains: value.reality_domains, influence_dimensions: value.influence_dimensions },
    nodes: value.claim_node_types,
    relations: value.relation_vocabulary,
    ladder: value.claim_ladder,
    gate: value.action_gate,
    pathways: value.pathway_templates,
    feedback: value.feedback_loops,
    kingdom: value.kingdom_influence_map,
    agents: value.agent_specialisations,
    unknowns: value.unknowns,
    boundaries: value.boundaries,
  };
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (Object.hasOwn(selection, command)) process.stdout.write(`${JSON.stringify({ map_id: value.map_id, [command]: selection[command] }, null, json ? 0 : 2)}\n`);
  else usage();
}

if (import.meta.main) {
  try { await runRealityInfluenceCli(); }
  catch (error) {
    process.stderr.write(`reality-influence refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
