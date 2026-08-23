#!/usr/bin/env bun
/**
 * Strict, offline reader and structural validator for the Language,
 * Civilisation & Task Fusion research record.
 *
 * This module never dereferences a source, invokes a model/tokenizer, dispatches
 * an agent, or writes an artifact. Human-authored strings are untrusted data.
 */

import { createHash } from "node:crypto";
import { closeSync, constants as fsConstants, fstatSync, lstatSync, openSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const LANGUAGE_CIVILISATION_TASK_FUSION_PROTOCOL = "kingdom.language-civilisation-task-fusion/0.1";
export const LANGUAGE_CIVILISATION_TASK_FUSION_SCHEMA = "urn:kingdom:schema:language-civilisation-task-fusion:0.1";
export const LANGUAGE_CIVILISATION_TASK_FUSION_ID = "arabic-persian-english-public-brief-2026-08-20";
export const LANGUAGE_CIVILISATION_TASK_FUSION_LOCATOR = "data/language/language-civilisation-task-fusion.v0.1.json";
export const LANGUAGE_CIVILISATION_TASK_FUSION_PATH = join(ROOT, LANGUAGE_CIVILISATION_TASK_FUSION_LOCATOR);
export const LANGUAGE_CIVILISATION_TASK_FUSION_SCHEMA_LOCATOR = "schemas/language-civilisation-task-fusion-v0.1.schema.json";
export const LANGUAGE_CIVILISATION_TASK_FUSION_SCHEMA_PATH = join(ROOT, LANGUAGE_CIVILISATION_TASK_FUSION_SCHEMA_LOCATOR);
export const LANGUAGE_CIVILISATION_TASK_FUSION_REVIEWED_DIGEST = "sha256:fb37df061bca86357b46e5538664d72e8938def8cfff341c3aa9596abc84d296";
// Short aliases are the stable test/integration API; the long names remain
// descriptive compatibility exports.
export const LANGUAGE_FUSION_PATH = LANGUAGE_CIVILISATION_TASK_FUSION_PATH;
export const LANGUAGE_FUSION_SCHEMA_PATH = LANGUAGE_CIVILISATION_TASK_FUSION_SCHEMA_PATH;
export const LANGUAGE_FUSION_PROTOCOL = LANGUAGE_CIVILISATION_TASK_FUSION_PROTOCOL;
export const LANGUAGE_FUSION_SCHEMA_ID = LANGUAGE_CIVILISATION_TASK_FUSION_SCHEMA;
export const LANGUAGE_FUSION_REVIEWED_DIGEST = LANGUAGE_CIVILISATION_TASK_FUSION_REVIEWED_DIGEST;

const MAX_BYTES = 1024 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_REF = /^(?:https:\/\/[^?#]+|artifact:[a-z0-9]+(?:-[a-z0-9]+)*|repo:[A-Za-z0-9._/-]+)$/;
const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";

const TOP_KEYS = [
  "$schema", "protocol", "weave_id", "version", "title", "issued_on",
  "evidence_through", "state", "scope", "type_firewall", "sources",
  "historical_witnesses", "language_profiles", "dimensions", "observations",
  "invariants", "artifacts", "task_graph", "assignments", "translations",
  "fusion", "run_cards", "tests", "disagreements", "unknowns", "repair",
  "boundaries", "integrity",
] as const;

const SCOPE_KEYS = [
  "goal", "deliverable", "audience", "intended_use", "excluded_use",
  "data_classification", "source_language_policy", "private_reasoning_required",
] as const;
const FIREWALL_KEYS = [
  "distinct_types", "language_is_not_people", "language_is_not_script",
  "script_is_not_civilisation", "register_is_not_identity", "task_role_is_not_persona",
  "historical_weight_is_not_model_weight", "token_efficiency_is_not_intelligence",
  "disagreement_is_not_deception", "silence_is_not_deception", "validation_is_not_truth",
  "civilisation_is_index_not_mind", "script_implies_language",
  "script_implies_identity", "corpus_frequency_implies_value",
  "attention_weight_is_explanation", "translation_is_identity", "agreement_is_truth",
] as const;
const SOURCE_KEYS = [
  "id", "title", "locator", "kind", "observed_on", "epistemic_access",
  "language_tags", "claim_scope", "limitations",
] as const;
const WITNESS_KEYS = [
  "id", "ecology", "period", "places", "language_varieties", "scripts", "media",
  "registers", "institutions", "contact_processes", "source_ids", "established",
  "contested_or_missing", "task_lessons", "civilisation_rank",
] as const;
const PROFILE_KEYS = [
  "id", "endonym", "english_label", "bcp47", "family_note", "period_and_region",
  "variety", "scripts", "registers", "morphology_notes", "syntax_notes",
  "discourse_notes", "historical_roles", "source_ids", "community_review", "inherent_task_superiority",
] as const;
const SCRIPT_KEYS = [
  "iso_15924", "name", "direction", "unicode_version", "normalization_policy",
  "grapheme_policy", "layout_notes",
] as const;
const DIMENSIONS_KEYS = ["shape", "weight", "aggregate_score", "ranking", "cross_axis_conversion"] as const;
const DIMENSION_KEYS = ["id", "label", "definition", "status", "observables", "source_ids", "does_not_establish"] as const;
const OBSERVATION_KEYS = ["id", "kind", "statement", "scope", "source_ids", "status_checked_on", "limitations", "does_not_establish"] as const;
const INVARIANT_KEYS = ["id", "statement", "scope", "violation_action"] as const;
const ARTIFACT_KEYS = [
  "id", "kind", "state", "language_profile_ids", "register", "locator",
  "content_sha256", "attribution", "public_or_safely_redacted",
  "contains_private_reasoning", "source_bytes_retention_required",
] as const;
const GRAPH_KEYS = ["nodes", "final_task_id", "final_artifact_id", "acyclic", "hidden_reasoning_edge_count"] as const;
const TASK_KEYS = [
  "id", "kind", "instruction", "depends_on", "source_ids", "input_artifact_ids",
  "output_artifact_id", "run_card_id", "assignment_ids", "acceptance_test_ids",
  "public_artifacts_only", "status",
] as const;
const ASSIGNMENT_KEYS = [
  "id", "task_id", "language_profile_id", "role", "selection_basis",
  "evidence_source_ids", "evaluation_test_id", "limitations", "historical_prestige_is_capability_evidence",
  "population_is_capability_evidence", "creates_identity_or_expertise",
] as const;
const TRANSLATION_KEYS = [
  "id", "kind", "source_artifact_id", "target_artifact_id",
  "source_language_profile_id", "target_language_profile_id", "task_id", "direction",
  "status", "preserved", "changed_or_lost", "ambiguous", "untranslated",
  "introduced_material", "loss_vector", "preservation_tests", "loss_axis_test_ids",
  "test_ids", "reversibility", "reverse_translation_id",
  "source_bytes_retention_required", "authority_transfer",
] as const;
const PRESERVATION_TEST_KEYS = ["invariant_id", "test_ids"] as const;
const LOSS_KEYS = [
  "phonology", "prosody", "morphology", "syntax", "polysemy", "register",
  "honorifics", "metaphor", "graphic_variation", "layout", "material_context",
  "provenance", "community_control",
] as const;
const FUSION_KEYS = ["id", "mode", "task_id", "input_artifact_ids", "output_artifact_id", "invariant_ids", "test_ids", "disagreement_ids", "status", "rules"] as const;
const FUSION_RULE_KEYS = [
  "majority_establishes_truth", "retain_disagreement", "retain_source_terms",
  "missing_means_unknown", "dependency_disclosed", "high_stakes_requires_competent_review",
  "hidden_reasoning_consumed", "automatic_action",
] as const;
const RUN_KEYS = [
  "id", "executor_label", "executor_kind", "model", "provider", "model_revision",
  "tokenizer", "tokenizer_revision", "prompt_revision", "run_status", "run_on",
  "evidence_ref", "result_artifact_ids", "private_state_access", "capability_established",
] as const;
const TEST_KEYS = [
  "id", "kind", "target_artifact_ids", "language_profile_ids", "run_card_ids",
  "condition", "status", "run_on", "valid_until", "evidence_ref",
  "result_artifact_id", "result", "limitations", "establishes_truth_or_fidelity",
] as const;
const DISAGREEMENT_KEYS = ["id", "artifact_ids", "carried_in_artifact_ids", "statement", "status", "resolution", "retained"] as const;
const UNKNOWN_KEYS = ["id", "question", "why_unknown", "needed_evidence", "stop_condition"] as const;
const REPAIR_KEYS = [
  "supersedes_weave_id", "challenge_refs", "correction_route", "affected_artifact_ids",
  "rerun_test_ids", "retain_prior_when_safe", "privacy_or_safety_removal_allowed",
] as const;
const INTEGRITY_KEYS = ["algorithm", "digest", "digest_field_zeroed"] as const;

const DISTINCT_TYPES = [
  "language-variety", "script", "orthography", "character", "glyph",
  "grapheme-cluster", "token", "register", "community", "polity", "religion",
  "model-representation",
] as const;
const SHAPE_IDS = [
  "inscription-glyph-shape", "unicode-grapheme-shape", "morphology-shape",
  "syntax-shape", "discourse-register-shape", "tokenizer-sequence-shape",
  "representation-geometry-shape",
] as const;
const WEIGHT_IDS = [
  "historical-institutional-weight", "corpus-prevalence-weight", "token-cost-weight",
  "task-evidence-weight", "parameter-attention-weight",
] as const;
const BOUNDARIES = {
  structure_only: true,
  read_only: true,
  network: false,
  filesystem_write: false,
  model_or_tokenizer_run: false,
  agent_dispatch: false,
  hidden_reasoning_collection: false,
  private_activation_collection: false,
  language_or_culture_ranking: false,
  person_or_community_score: false,
  proves_language_competence: false,
  proves_translation_fidelity: false,
  proves_truth: false,
  proves_understanding: false,
  proves_identity: false,
  nationality_inference: false,
  ethnicity_inference: false,
  native_speaker_inference: false,
  proficiency_inference: false,
  community_authority_inference: false,
  infers_intent_or_deception: false,
  training_data_reconstruction: false,
  attention_as_explanation: false,
  grants_consent: false,
  grants_authority: false,
  writes_wake: false,
  writes_karma: false,
  economic_or_governance_effect: false,
  automatic_action: false,
  publication: false,
  deployment: false,
} as const;

const SOURCE_KINDS = ["primary-witness", "official-standard", "institutional-catalogue", "peer-reviewed-study", "scholarly-reference", "community-governance-source", "rights-instrument", "intergovernmental-guidance", "repo-contract"] as const;
const DIRECTIONS = ["ltr", "rtl", "vertical", "mixed", "historically-variable"] as const;
const NORMALIZATION_POLICIES = ["preserve-exact-plus-nfc-view", "preserve-exact-no-normalized-view", "not-applicable"] as const;
const GRAPHEME_POLICIES = ["unicode-extended-grapheme-clusters", "script-tailored-review-required", "not-applicable"] as const;
const REVIEW_STATES = ["required-before-publication", "recommended", "not-required-for-this-planned-fixture"] as const;
const DIMENSION_STATES = ["described", "reported", "not-run", "unknown"] as const;
const OBSERVATION_KINDS = ["historical-evidence", "llm-evidence", "standard", "design-choice", "boundary"] as const;
const VIOLATION_ACTIONS = ["stop", "retain-disagreement", "downgrade", "repair"] as const;
const ARTIFACT_KINDS = ["source-witness", "source-notes", "transcription", "normalized-view", "transliteration", "glossary", "translation", "draft", "critique", "test-report", "fused-output"] as const;
const ARTIFACT_STATES = ["planned"] as const;
const TASK_KINDS = ["source-read", "terminology-map", "draft", "critique", "verify", "fuse"] as const;
const TASK_STATES = ["planned"] as const;
const ASSIGNMENT_ROLES = ["source-anchor", "terminology", "analysis", "draft", "translation", "critique", "verification", "audience-interface", "fusion"] as const;
const SELECTION_BASES = ["source-language", "requested-audience", "declared-terminology", "explicit-user-choice", "cross-language-check"] as const;
const TRANSLATION_KINDS = ["summarization", "terminology-alignment"] as const;
const TRANSLATION_STATES = ["planned"] as const;
const LOSS_STATES = ["preserved", "changed", "lost", "ambiguous", "untranslated", "not-tested", "not-applicable"] as const;
const REVERSIBILITY_STATES = ["not-claimed", "planned-test", "tested-for-declared-invariants", "not-applicable"] as const;
const FUSION_MODES = ["source-anchored-triangulation"] as const;
const FUSION_STATES = ["planned"] as const;
const EXECUTOR_KINDS = ["unbound-agent"] as const;
const RUN_STATES = ["not-run"] as const;
const TEST_KINDS = ["source-byte-retention", "normalization-round-trip", "grapheme-preservation", "bidi-display", "entity-number-date-negation", "terminology-preservation", "translation-contrast", "token-budget", "task-specific-evaluation", "native-or-community-review", "dependency-disclosure", "disagreement-retention", "schema-and-graph"] as const;
const TEST_STATES = ["not-run"] as const;
const TEST_RESULTS = ["passed", "failed", "inconclusive"] as const;
const DISAGREEMENT_STATES = ["open", "resolved-under-tests", "withdrawn", "unknown"] as const;

export type LanguageCivilisationTaskFusionIssue = { field: string; code: string };
export type LanguageCivilisationTaskFusionValidationOptions = {
  asOf?: string;
  canonical?: boolean;
};

type JsonRecord = Record<string, any>;
type AddIssue = (field: string, code: string) => void;

function isRecord(value: unknown): value is JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value: unknown, expected: readonly string[], field: string, add: AddIssue): value is JsonRecord {
  if (!isRecord(value)) {
    add(field, "not-object");
    return false;
  }
  const actual = Object.keys(value);
  for (const key of expected) if (!Object.hasOwn(value, key)) add(`${field}.${key}`, "missing-key");
  for (const key of actual) if (!expected.includes(key)) add(`${field}.${key}`, "unexpected-key");
  return true;
}

function boundedText(value: unknown, max = 8000): value is string {
  return typeof value === "string" && Array.from(value).length >= 1 && Array.from(value).length <= max;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && ID.test(value);
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !FULL_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
}

function validSafeRef(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2000 || !SAFE_REF.test(value)) return false;
  if (/[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
  if (/%(?:0[0-9a-f]|1[0-9a-f]|7f|2f|5c|c2%85|e2%80%(?:a8|a9))/iu.test(value)) return false;
  if (value.startsWith("https://")) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.username === "" && url.password === ""
        && url.hostname.length > 0 && url.search === "" && url.hash === ""
        && url.href === value;
    } catch {
      return false;
    }
  }
  if (value.startsWith("repo:")) {
    const locator = value.slice(5);
    return !locator.startsWith("/") && !locator.includes("//")
      && !locator.split("/").some((part) => part === "" || part === "." || part === "..");
  }
  return true;
}

function validExternalOrRepoRef(value: unknown): value is string {
  return validSafeRef(value) && !value.startsWith("artifact:");
}

/** Reject values that could not have been produced as an ordinary JSON tree. */
function validateJsonTree(value: unknown, add: AddIssue): boolean {
  const seen = new WeakSet<object>();
  let nodes = 0;
  let valid = true;
  const walk = (node: unknown, field: string, depth: number): void => {
    nodes += 1;
    if (nodes > 100_000) {
      add(field, "json-tree-too-large");
      valid = false;
      return;
    }
    if (depth > 64) {
      add(field, "json-tree-too-deep");
      valid = false;
      return;
    }
    if (node === null || typeof node === "string" || typeof node === "boolean") return;
    if (typeof node === "number") {
      if (!Number.isFinite(node) || Object.is(node, -0)) {
        add(field, "invalid-json-number");
        valid = false;
      }
      return;
    }
    if (typeof node !== "object") {
      add(field, "non-json-value");
      valid = false;
      return;
    }
    if (seen.has(node)) {
      add(field, "repeated-or-cyclic-object");
      valid = false;
      return;
    }
    seen.add(node);
    if (Object.getOwnPropertySymbols(node).length !== 0) {
      add(field, "symbol-key-forbidden");
      valid = false;
      return;
    }
    if (Array.isArray(node)) {
      if (Object.getPrototypeOf(node) !== Array.prototype) {
        add(field, "custom-array-prototype");
        valid = false;
        return;
      }
      const keys = Object.keys(node);
      const ownNames = Object.getOwnPropertyNames(node);
      if (keys.length !== node.length || keys.some((key, index) => key !== String(index))
        || ownNames.length !== node.length + 1 || ownNames.at(-1) !== "length") {
        add(field, "sparse-or-extended-array");
        valid = false;
        return;
      }
      const descriptors = Object.getOwnPropertyDescriptors(node);
      for (let index = 0; index < node.length; index += 1) {
        const descriptor = descriptors[String(index)];
        if (!descriptor || Object.hasOwn(descriptor, "get") || Object.hasOwn(descriptor, "set")) {
          add(`${field}[${index}]`, "accessor-forbidden");
          valid = false;
          return;
        }
        walk(descriptor.value, `${field}[${index}]`, depth + 1);
      }
      return;
    }
    if (Object.getPrototypeOf(node) !== Object.prototype) {
      add(field, "custom-object-prototype");
      valid = false;
      return;
    }
    const descriptors = Object.getOwnPropertyDescriptors(node);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (!descriptor.enumerable || Object.hasOwn(descriptor, "get") || Object.hasOwn(descriptor, "set")) {
        add(`${field}.${key}`, "accessor-or-hidden-property-forbidden");
        valid = false;
        return;
      }
      walk(descriptor.value, `${field}.${key}`, depth + 1);
    }
  };
  walk(value, "$", 0);
  return valid;
}

function inEnum(value: unknown, values: readonly string[]): value is string {
  return typeof value === "string" && values.includes(value);
}

function checkText(value: unknown, field: string, add: AddIssue, max = 8000): void {
  if (!boundedText(value, max)) add(field, "invalid-text");
}

function checkId(value: unknown, field: string, add: AddIssue): value is string {
  if (!validId(value)) {
    add(field, "invalid-id");
    return false;
  }
  return true;
}

function checkEnum(value: unknown, values: readonly string[], field: string, add: AddIssue): void {
  if (!inEnum(value, values)) add(field, "invalid-enum");
}

function checkBoolean(value: unknown, expected: boolean, field: string, add: AddIssue): void {
  if (value !== expected) add(field, expected ? "must-be-true" : "must-be-false");
}

function checkStringList(
  value: unknown,
  field: string,
  add: AddIssue,
  minimum = 1,
  maximum = 64,
  item: (entry: string) => boolean = (entry) => boundedText(entry, 1000),
): value is string[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    add(field, "invalid-list-size");
    return false;
  }
  let valid = true;
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !item(entry)) {
      add(`${field}[${index}]`, "invalid-list-item");
      valid = false;
    }
  });
  if (new Set(value).size !== value.length) {
    add(field, "duplicate-list-item");
    valid = false;
  }
  return valid;
}

function checkIdList(value: unknown, field: string, add: AddIssue, minimum = 1, maximum = 64): value is string[] {
  return checkStringList(value, field, add, minimum, maximum, validId);
}

function checkDate(value: unknown, field: string, add: AddIssue, upperBounds: string[] = []): void {
  if (!validDate(value)) {
    add(field, "invalid-date");
    return;
  }
  if (upperBounds.some((bound) => validDate(bound) && value > bound)) add(field, "date-after-bound");
}

function sameStringSet(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length
    && new Set(value).size === value.length
    && expected.every((item) => value.includes(item));
}

function requireArray(value: unknown, field: string, add: AddIssue, minimum: number, maximum: number): any[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    add(field, "invalid-array-size");
    return [];
  }
  return value;
}

function nullableBounded(value: unknown, field: string, add: AddIssue, max = 256): void {
  if (value !== null && !boundedText(value, max)) add(field, "must-be-null-or-text");
}

function registerGlobalId(
  value: unknown,
  field: string,
  namespace: Map<string, string>,
  add: AddIssue,
): void {
  if (!checkId(value, field, add)) return;
  const prior = namespace.get(value);
  if (prior !== undefined) {
    add(field, "duplicate-global-id");
  } else {
    namespace.set(value, field);
  }
}

function reference(value: unknown, ids: Set<string>, field: string, add: AddIssue): void {
  if (!validId(value)) {
    add(field, "invalid-reference-id");
  } else if (!ids.has(value)) {
    add(field, "dangling-reference");
  }
}

function references(value: unknown, ids: Set<string>, field: string, add: AddIssue, minimum = 0): void {
  if (!checkIdList(value, field, add, minimum)) return;
  value.forEach((entry, index) => reference(entry, ids, `${field}[${index}]`, add));
}

function listIncludes(value: unknown, item: unknown): boolean {
  return Array.isArray(value) && value.includes(item);
}

function validateEvidenceReference(
  value: unknown,
  artifactIds: Set<string>,
  artifactById: Map<string, JsonRecord>,
  field: string,
  add: AddIssue,
): void {
  if (!validSafeRef(value)) {
    add(field, "unsafe-reference");
    return;
  }
  if (typeof value !== "string" || !value.startsWith("artifact:")) return;
  const artifactId = value.slice("artifact:".length);
  reference(artifactId, artifactIds, field, add);
  if (artifactIds.has(artifactId) && artifactById.get(artifactId)?.state !== "available") {
    add(field, "evidence-artifact-not-available");
  }
}

function validatePrimitiveShape(value: JsonRecord, add: AddIssue, asOf: string): void {
  if (value.$schema !== LANGUAGE_CIVILISATION_TASK_FUSION_SCHEMA) add("$.$schema", "schema-id-mismatch");
  if (value.protocol !== LANGUAGE_CIVILISATION_TASK_FUSION_PROTOCOL) add("$.protocol", "protocol-mismatch");
  checkId(value.weave_id, "$.weave_id", add);
  if (value.version !== "0.1.0") add("$.version", "version-mismatch");
  checkText(value.title, "$.title", add);
  checkDate(value.issued_on, "$.issued_on", add, [asOf]);
  checkDate(value.evidence_through, "$.evidence_through", add, [asOf, value.issued_on]);
  if (value.state !== "planned") add("$.state", "v0.1-is-plan-only");
}

function validateScope(value: unknown, add: AddIssue): void {
  if (!exactKeys(value, SCOPE_KEYS, "$.scope", add)) return;
  for (const field of ["goal", "deliverable", "audience", "intended_use", "excluded_use"]) {
    checkText(value[field], `$.scope.${field}`, add);
  }
  if (value.data_classification !== "public-or-safely-redacted-only") add("$.scope.data_classification", "classification-mismatch");
  if (value.source_language_policy !== "source-witness-remains-first-class") add("$.scope.source_language_policy", "source-policy-mismatch");
  checkBoolean(value.private_reasoning_required, false, "$.scope.private_reasoning_required", add);
}

function validateFirewall(value: unknown, add: AddIssue): void {
  if (!exactKeys(value, FIREWALL_KEYS, "$.type_firewall", add)) return;
  if (!sameStringSet(value.distinct_types, DISTINCT_TYPES)) add("$.type_firewall.distinct_types", "fixed-type-set-mismatch");
  for (const field of [
    "language_is_not_people", "language_is_not_script", "script_is_not_civilisation",
    "register_is_not_identity", "task_role_is_not_persona",
    "historical_weight_is_not_model_weight", "token_efficiency_is_not_intelligence",
    "disagreement_is_not_deception", "silence_is_not_deception", "validation_is_not_truth",
    "civilisation_is_index_not_mind",
  ]) checkBoolean(value[field], true, `$.type_firewall.${field}`, add);
  for (const field of [
    "script_implies_language", "script_implies_identity", "corpus_frequency_implies_value",
    "attention_weight_is_explanation", "translation_is_identity", "agreement_is_truth",
  ]) checkBoolean(value[field], false, `$.type_firewall.${field}`, add);
}

function validateSources(value: unknown, namespace: Map<string, string>, add: AddIssue, evidenceThrough: string, issuedOn: string, asOf: string): JsonRecord[] {
  const sources = requireArray(value, "$.sources", add, 2, 96);
  sources.forEach((source, index) => {
    const path = `$.sources[${index}]`;
    if (!exactKeys(source, SOURCE_KEYS, path, add)) return;
    registerGlobalId(source.id, `${path}.id`, namespace, add);
    checkText(source.title, `${path}.title`, add);
    if (!validSafeRef(source.locator)) add(`${path}.locator`, "unsafe-reference");
    else if (!validExternalOrRepoRef(source.locator)) add(`${path}.locator`, "source-reference-must-be-https-or-repo");
    checkEnum(source.kind, SOURCE_KINDS, `${path}.kind`, add);
    checkDate(source.observed_on, `${path}.observed_on`, add, [asOf, issuedOn, evidenceThrough]);
    if (source.epistemic_access !== "reported") add(`${path}.epistemic_access`, "must-be-reported");
    checkStringList(source.language_tags, `${path}.language_tags`, add, 1, 16, (entry) => entry.length >= 2 && entry.length <= 64);
    checkText(source.claim_scope, `${path}.claim_scope`, add);
    checkStringList(source.limitations, `${path}.limitations`, add);
  });
  return sources.filter(isRecord);
}

function validateWitnesses(value: unknown, namespace: Map<string, string>, sourceIds: Set<string>, add: AddIssue): JsonRecord[] {
  const witnesses = requireArray(value, "$.historical_witnesses", add, 2, 64);
  witnesses.forEach((witness, index) => {
    const path = `$.historical_witnesses[${index}]`;
    if (!exactKeys(witness, WITNESS_KEYS, path, add)) return;
    registerGlobalId(witness.id, `${path}.id`, namespace, add);
    for (const field of ["ecology", "period"]) checkText(witness[field], `${path}.${field}`, add);
    for (const field of ["places", "language_varieties", "scripts", "media", "registers", "institutions", "contact_processes", "established", "contested_or_missing", "task_lessons"]) {
      checkStringList(witness[field], `${path}.${field}`, add);
    }
    references(witness.source_ids, sourceIds, `${path}.source_ids`, add, 1);
    if (witness.civilisation_rank !== null) add(`${path}.civilisation_rank`, "rank-forbidden");
  });
  return witnesses.filter(isRecord);
}

function validateProfiles(value: unknown, namespace: Map<string, string>, sourceIds: Set<string>, add: AddIssue): JsonRecord[] {
  const profiles = requireArray(value, "$.language_profiles", add, 2, 32);
  profiles.forEach((profile, index) => {
    const path = `$.language_profiles[${index}]`;
    if (!exactKeys(profile, PROFILE_KEYS, path, add)) return;
    registerGlobalId(profile.id, `${path}.id`, namespace, add);
    for (const field of ["endonym", "english_label", "family_note", "period_and_region", "variety"]) checkText(profile[field], `${path}.${field}`, add, field === "family_note" || field === "period_and_region" ? 8000 : 1000);
    if (typeof profile.bcp47 !== "string" || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(profile.bcp47) || profile.bcp47.length > 64) add(`${path}.bcp47`, "invalid-language-tag");
    const scripts = requireArray(profile.scripts, `${path}.scripts`, add, 1, 8);
    scripts.forEach((script, scriptIndex) => {
      const scriptPath = `${path}.scripts[${scriptIndex}]`;
      if (!exactKeys(script, SCRIPT_KEYS, scriptPath, add)) return;
      if (typeof script.iso_15924 !== "string" || !/^[A-Z][a-z]{3}$/.test(script.iso_15924)) add(`${scriptPath}.iso_15924`, "invalid-script-code");
      checkText(script.name, `${scriptPath}.name`, add, 1000);
      checkEnum(script.direction, DIRECTIONS, `${scriptPath}.direction`, add);
      nullableBounded(script.unicode_version, `${scriptPath}.unicode_version`, add, 32);
      checkEnum(script.normalization_policy, NORMALIZATION_POLICIES, `${scriptPath}.normalization_policy`, add);
      checkEnum(script.grapheme_policy, GRAPHEME_POLICIES, `${scriptPath}.grapheme_policy`, add);
      checkStringList(script.layout_notes, `${scriptPath}.layout_notes`, add);
    });
    for (const field of ["registers", "morphology_notes", "syntax_notes", "discourse_notes", "historical_roles"]) checkStringList(profile[field], `${path}.${field}`, add);
    references(profile.source_ids, sourceIds, `${path}.source_ids`, add, 1);
    checkEnum(profile.community_review, REVIEW_STATES, `${path}.community_review`, add);
    checkBoolean(profile.inherent_task_superiority, false, `${path}.inherent_task_superiority`, add);
  });
  return profiles.filter(isRecord);
}

function validateDimensions(value: unknown, namespace: Map<string, string>, sourceIds: Set<string>, add: AddIssue): void {
  if (!exactKeys(value, DIMENSIONS_KEYS, "$.dimensions", add)) return;
  const groups: Array<["shape" | "weight", readonly string[]]> = [["shape", SHAPE_IDS], ["weight", WEIGHT_IDS]];
  for (const [group, expected] of groups) {
    const dimensions = requireArray(value[group], `$.dimensions.${group}`, add, expected.length, expected.length);
    dimensions.forEach((dimension, index) => {
      const path = `$.dimensions.${group}[${index}]`;
      if (!exactKeys(dimension, DIMENSION_KEYS, path, add)) return;
      registerGlobalId(dimension.id, `${path}.id`, namespace, add);
      checkText(dimension.label, `${path}.label`, add, 1000);
      checkText(dimension.definition, `${path}.definition`, add);
      checkEnum(dimension.status, DIMENSION_STATES, `${path}.status`, add);
      checkStringList(dimension.observables, `${path}.observables`, add);
      references(dimension.source_ids, sourceIds, `${path}.source_ids`, add, 0);
      checkStringList(dimension.does_not_establish, `${path}.does_not_establish`, add);
    });
    if (!sameStringSet(dimensions.map((entry) => entry?.id), expected)) add(`$.dimensions.${group}`, "fixed-dimension-set-mismatch");
  }
  if (value.aggregate_score !== null) add("$.dimensions.aggregate_score", "aggregate-score-forbidden");
  checkBoolean(value.ranking, false, "$.dimensions.ranking", add);
  checkBoolean(value.cross_axis_conversion, false, "$.dimensions.cross_axis_conversion", add);
}

function validateObservations(value: unknown, namespace: Map<string, string>, sourceIds: Set<string>, add: AddIssue, evidenceThrough: string, issuedOn: string, asOf: string): void {
  const observations = requireArray(value, "$.observations", add, 4, 128);
  observations.forEach((observation, index) => {
    const path = `$.observations[${index}]`;
    if (!exactKeys(observation, OBSERVATION_KEYS, path, add)) return;
    registerGlobalId(observation.id, `${path}.id`, namespace, add);
    checkEnum(observation.kind, OBSERVATION_KINDS, `${path}.kind`, add);
    for (const field of ["statement", "scope"]) checkText(observation[field], `${path}.${field}`, add);
    references(observation.source_ids, sourceIds, `${path}.source_ids`, add, 0);
    if (["historical-evidence", "llm-evidence", "standard"].includes(observation.kind) && observation.source_ids?.length === 0) add(`${path}.source_ids`, "evidence-source-required");
    checkDate(observation.status_checked_on, `${path}.status_checked_on`, add, [asOf, issuedOn, evidenceThrough]);
    checkStringList(observation.limitations, `${path}.limitations`, add);
    checkStringList(observation.does_not_establish, `${path}.does_not_establish`, add);
  });
}

function validateInvariants(value: unknown, namespace: Map<string, string>, add: AddIssue): JsonRecord[] {
  const invariants = requireArray(value, "$.invariants", add, 8, 64);
  invariants.forEach((invariant, index) => {
    const path = `$.invariants[${index}]`;
    if (!exactKeys(invariant, INVARIANT_KEYS, path, add)) return;
    registerGlobalId(invariant.id, `${path}.id`, namespace, add);
    checkText(invariant.statement, `${path}.statement`, add);
    checkText(invariant.scope, `${path}.scope`, add);
    checkEnum(invariant.violation_action, VIOLATION_ACTIONS, `${path}.violation_action`, add);
  });
  return invariants.filter(isRecord);
}

function validateArtifacts(value: unknown, namespace: Map<string, string>, profileIds: Set<string>, add: AddIssue): JsonRecord[] {
  const artifacts = requireArray(value, "$.artifacts", add, 2, 128);
  artifacts.forEach((artifact, index) => {
    const path = `$.artifacts[${index}]`;
    if (!exactKeys(artifact, ARTIFACT_KEYS, path, add)) return;
    registerGlobalId(artifact.id, `${path}.id`, namespace, add);
    checkEnum(artifact.kind, ARTIFACT_KINDS, `${path}.kind`, add);
    checkEnum(artifact.state, ARTIFACT_STATES, `${path}.state`, add);
    references(artifact.language_profile_ids, profileIds, `${path}.language_profile_ids`, add, 1);
    checkText(artifact.register, `${path}.register`, add, 1000);
    checkText(artifact.attribution, `${path}.attribution`, add);
    checkBoolean(artifact.public_or_safely_redacted, true, `${path}.public_or_safely_redacted`, add);
    checkBoolean(artifact.contains_private_reasoning, false, `${path}.contains_private_reasoning`, add);
    if (typeof artifact.source_bytes_retention_required !== "boolean") add(`${path}.source_bytes_retention_required`, "not-boolean");
    if (artifact.state === "available") {
      if (!validSafeRef(artifact.locator)) add(`${path}.locator`, "available-artifact-reference-required");
      if (typeof artifact.content_sha256 !== "string" || !SHA256.test(artifact.content_sha256)) add(`${path}.content_sha256`, "available-artifact-digest-required");
    } else if (artifact.locator !== null || artifact.content_sha256 !== null) {
      add(path, "non-available-artifact-must-not-claim-bytes");
    }
    if (artifact.kind === "source-witness" && artifact.source_bytes_retention_required !== true) add(`${path}.source_bytes_retention_required`, "source-witness-retention-not-required");
  });
  return artifacts.filter(isRecord);
}

function validateRuns(value: unknown, namespace: Map<string, string>, artifactIds: Set<string>, artifacts: JsonRecord[], add: AddIssue, issuedOn: string, asOf: string): JsonRecord[] {
  const runs = requireArray(value, "$.run_cards", add, 1, 64);
  const bindingFields = ["model", "provider", "model_revision", "tokenizer", "tokenizer_revision", "prompt_revision"] as const;
  const artifactById = new Map(artifacts.filter((entry) => validId(entry?.id)).map((entry) => [entry.id, entry]));
  runs.forEach((run, index) => {
    const path = `$.run_cards[${index}]`;
    if (!exactKeys(run, RUN_KEYS, path, add)) return;
    registerGlobalId(run.id, `${path}.id`, namespace, add);
    checkText(run.executor_label, `${path}.executor_label`, add, 1000);
    checkEnum(run.executor_kind, EXECUTOR_KINDS, `${path}.executor_kind`, add);
    bindingFields.forEach((field) => nullableBounded(run[field], `${path}.${field}`, add));
    checkEnum(run.run_status, RUN_STATES, `${path}.run_status`, add);
    checkBoolean(run.private_state_access, false, `${path}.private_state_access`, add);
    checkBoolean(run.capability_established, false, `${path}.capability_established`, add);
    references(run.result_artifact_ids, artifactIds, `${path}.result_artifact_ids`, add, 0);
    if (run.run_status === "not-run") {
      for (const field of bindingFields) if (run[field] !== null) add(`${path}.${field}`, "not-run-binding-must-be-null");
      if (run.run_on !== null) add(`${path}.run_on`, "not-run-date-must-be-null");
      if (run.evidence_ref !== null) add(`${path}.evidence_ref`, "not-run-evidence-must-be-null");
      if (Array.isArray(run.result_artifact_ids) && run.result_artifact_ids.length !== 0) add(`${path}.result_artifact_ids`, "not-run-results-must-be-empty");
      if (run.executor_kind !== "unbound-agent") add(`${path}.executor_kind`, "not-run-executor-must-be-unbound");
    } else {
      for (const field of bindingFields) if (!boundedText(run[field], 256)) add(`${path}.${field}`, "bound-run-field-required");
      checkDate(run.run_on, `${path}.run_on`, add, [asOf, issuedOn]);
      validateEvidenceReference(run.evidence_ref, artifactIds, artifactById, `${path}.evidence_ref`, add);
      if (!Array.isArray(run.result_artifact_ids) || run.result_artifact_ids.length === 0) add(`${path}.result_artifact_ids`, "run-result-required");
    }
  });
  return runs.filter(isRecord);
}

function validateTests(
  value: unknown,
  namespace: Map<string, string>,
  artifactIds: Set<string>,
  artifacts: JsonRecord[],
  profileIds: Set<string>,
  runIds: Set<string>,
  add: AddIssue,
  issuedOn: string,
  asOf: string,
): JsonRecord[] {
  const tests = requireArray(value, "$.tests", add, 4, 128);
  const artifactById = new Map(artifacts.filter((entry) => validId(entry?.id)).map((entry) => [entry.id, entry]));
  tests.forEach((test, index) => {
    const path = `$.tests[${index}]`;
    if (!exactKeys(test, TEST_KEYS, path, add)) return;
    registerGlobalId(test.id, `${path}.id`, namespace, add);
    checkEnum(test.kind, TEST_KINDS, `${path}.kind`, add);
    references(test.target_artifact_ids, artifactIds, `${path}.target_artifact_ids`, add, 1);
    references(test.language_profile_ids, profileIds, `${path}.language_profile_ids`, add, 1);
    references(test.run_card_ids, runIds, `${path}.run_card_ids`, add, 1);
    checkText(test.condition, `${path}.condition`, add);
    checkEnum(test.status, TEST_STATES, `${path}.status`, add);
    checkStringList(test.limitations, `${path}.limitations`, add);
    checkBoolean(test.establishes_truth_or_fidelity, false, `${path}.establishes_truth_or_fidelity`, add);
    if (test.status === "not-run") {
      if (test.run_on !== null) add(`${path}.run_on`, "not-run-date-must-be-null");
      if (test.valid_until !== null) add(`${path}.valid_until`, "not-run-validity-must-be-null");
      if (test.evidence_ref !== null) add(`${path}.evidence_ref`, "not-run-evidence-must-be-null");
      if (test.result_artifact_id !== null) add(`${path}.result_artifact_id`, "not-run-result-artifact-must-be-null");
      if (test.result !== null) add(`${path}.result`, "not-run-result-must-be-null");
    } else {
      checkDate(test.run_on, `${path}.run_on`, add, [asOf, issuedOn]);
      validateEvidenceReference(test.evidence_ref, artifactIds, artifactById, `${path}.evidence_ref`, add);
      reference(test.result_artifact_id, artifactIds, `${path}.result_artifact_id`, add);
      if (validId(test.result_artifact_id) && artifactById.get(test.result_artifact_id)?.state !== "available") add(`${path}.result_artifact_id`, "test-result-artifact-not-available");
      checkEnum(test.result, TEST_RESULTS, `${path}.result`, add);
      if (test.kind === "task-specific-evaluation") {
        if (!validDate(test.valid_until)) add(`${path}.valid_until`, "task-evaluation-validity-required");
        else if (test.valid_until < asOf || (validDate(test.run_on) && test.valid_until < test.run_on)) add(`${path}.valid_until`, "task-evaluation-expired-or-precedes-run");
      } else if (test.valid_until !== null && !validDate(test.valid_until)) {
        add(`${path}.valid_until`, "invalid-date");
      }
    }
  });
  return tests.filter(isRecord);
}

function topologicalOrder(tasks: JsonRecord[]): { order: string[]; cyclic: boolean; dependents: Map<string, Set<string>> } {
  const ids = new Set(tasks.filter((task) => validId(task?.id)).map((task) => task.id));
  const indegree = new Map<string, number>();
  const dependents = new Map<string, Set<string>>();
  for (const id of ids) {
    indegree.set(id, 0);
    dependents.set(id, new Set());
  }
  for (const task of tasks) {
    if (!validId(task?.id) || !Array.isArray(task.depends_on)) continue;
    for (const dependency of task.depends_on) {
      if (!ids.has(dependency)) continue;
      indegree.set(task.id, (indegree.get(task.id) ?? 0) + 1);
      dependents.get(dependency)!.add(task.id);
    }
  }
  const queue = [...ids].filter((id) => indegree.get(id) === 0).sort();
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const dependent of [...(dependents.get(id) ?? [])].sort()) {
      const next = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, next);
      if (next === 0) {
        queue.push(dependent);
        queue.sort();
      }
    }
  }
  return { order, cyclic: order.length !== ids.size, dependents };
}

function ancestorsOf(taskId: string, taskById: Map<string, JsonRecord>, memo = new Map<string, Set<string>>()): Set<string> {
  const cached = memo.get(taskId);
  if (cached) return cached;
  const result = new Set<string>();
  memo.set(taskId, result);
  const task = taskById.get(taskId);
  if (!task || !Array.isArray(task.depends_on)) return result;
  for (const dependency of task.depends_on) {
    if (!validId(dependency)) continue;
    result.add(dependency);
    for (const ancestor of ancestorsOf(dependency, taskById, memo)) result.add(ancestor);
  }
  return result;
}

function validateAssignments(value: unknown, namespace: Map<string, string>, taskIds: Set<string>, profileIds: Set<string>, sourceIds: Set<string>, testIds: Set<string>, add: AddIssue): JsonRecord[] {
  const assignments = requireArray(value, "$.assignments", add, 2, 128);
  const tuples = new Set<string>();
  assignments.forEach((assignment, index) => {
    const path = `$.assignments[${index}]`;
    if (!exactKeys(assignment, ASSIGNMENT_KEYS, path, add)) return;
    registerGlobalId(assignment.id, `${path}.id`, namespace, add);
    reference(assignment.task_id, taskIds, `${path}.task_id`, add);
    reference(assignment.language_profile_id, profileIds, `${path}.language_profile_id`, add);
    checkEnum(assignment.role, ASSIGNMENT_ROLES, `${path}.role`, add);
    checkEnum(assignment.selection_basis, SELECTION_BASES, `${path}.selection_basis`, add);
    references(assignment.evidence_source_ids, sourceIds, `${path}.evidence_source_ids`, add, 0);
    if (assignment.selection_basis === "task-specific-evaluation") {
      reference(assignment.evaluation_test_id, testIds, `${path}.evaluation_test_id`, add);
    } else if (assignment.evaluation_test_id !== null) {
      add(`${path}.evaluation_test_id`, "evaluation-test-only-for-task-specific-selection");
    }
    checkStringList(assignment.limitations, `${path}.limitations`, add);
    checkBoolean(assignment.historical_prestige_is_capability_evidence, false, `${path}.historical_prestige_is_capability_evidence`, add);
    checkBoolean(assignment.population_is_capability_evidence, false, `${path}.population_is_capability_evidence`, add);
    checkBoolean(assignment.creates_identity_or_expertise, false, `${path}.creates_identity_or_expertise`, add);
    const tuple = `${assignment.task_id}\u0000${assignment.language_profile_id}\u0000${assignment.role}`;
    if (tuples.has(tuple)) add(path, "duplicate-task-language-role-assignment");
    tuples.add(tuple);
  });
  return assignments.filter(isRecord);
}

function validateTasks(
  value: unknown,
  namespace: Map<string, string>,
  sourceIds: Set<string>,
  artifactIds: Set<string>,
  runIds: Set<string>,
  testIds: Set<string>,
  assignmentIds: Set<string>,
  assignments: JsonRecord[],
  artifacts: JsonRecord[],
  runs: JsonRecord[],
  tests: JsonRecord[],
  asOf: string,
  add: AddIssue,
): JsonRecord[] {
  if (!exactKeys(value, GRAPH_KEYS, "$.task_graph", add)) return [];
  const tasks = requireArray(value.nodes, "$.task_graph.nodes", add, 3, 64);
  tasks.forEach((task, index) => {
    const path = `$.task_graph.nodes[${index}]`;
    if (!exactKeys(task, TASK_KEYS, path, add)) return;
    registerGlobalId(task.id, `${path}.id`, namespace, add);
    checkEnum(task.kind, TASK_KINDS, `${path}.kind`, add);
    checkText(task.instruction, `${path}.instruction`, add);
    checkIdList(task.depends_on, `${path}.depends_on`, add, 0);
    references(task.source_ids, sourceIds, `${path}.source_ids`, add, 0);
    references(task.input_artifact_ids, artifactIds, `${path}.input_artifact_ids`, add, 0);
    reference(task.output_artifact_id, artifactIds, `${path}.output_artifact_id`, add);
    reference(task.run_card_id, runIds, `${path}.run_card_id`, add);
    references(task.assignment_ids, assignmentIds, `${path}.assignment_ids`, add, 1);
    references(task.acceptance_test_ids, testIds, `${path}.acceptance_test_ids`, add, 1);
    checkBoolean(task.public_artifacts_only, true, `${path}.public_artifacts_only`, add);
    checkEnum(task.status, TASK_STATES, `${path}.status`, add);
  });
  const taskIds = new Set(tasks.filter((task) => validId(task?.id)).map((task) => task.id));
  tasks.forEach((task, index) => references(task?.depends_on, taskIds, `$.task_graph.nodes[${index}].depends_on`, add, 0));
  reference(value.final_task_id, taskIds, "$.task_graph.final_task_id", add);
  reference(value.final_artifact_id, artifactIds, "$.task_graph.final_artifact_id", add);
  checkBoolean(value.acyclic, true, "$.task_graph.acyclic", add);
  if (value.hidden_reasoning_edge_count !== 0) add("$.task_graph.hidden_reasoning_edge_count", "hidden-reasoning-edge-forbidden");

  const { cyclic, dependents } = topologicalOrder(tasks);
  if (cyclic) add("$.task_graph.nodes", "dependency-cycle");
  const taskById = new Map(tasks.filter((task) => validId(task?.id)).map((task) => [task.id, task]));
  const finalTask = taskById.get(value.final_task_id);
  if (finalTask && finalTask.output_artifact_id !== value.final_artifact_id) add("$.task_graph.final_artifact_id", "final-output-mismatch");
  const sinks = [...taskIds].filter((id) => (dependents.get(id)?.size ?? 0) === 0);
  if (sinks.length !== 1 || sinks[0] !== value.final_task_id) add("$.task_graph.final_task_id", "not-unique-final-sink");
  if (!cyclic && validId(value.final_task_id)) {
    for (const task of tasks) {
      if (!validId(task?.id)) continue;
      if (task.id !== value.final_task_id && !ancestorsOf(value.final_task_id, taskById).has(task.id)) add(`$.task_graph.nodes.${task.id}`, "cannot-reach-final-task");
    }
  }

  const producers = new Map<string, string[]>();
  tasks.forEach((task) => {
    if (!validId(task?.id) || !validId(task.output_artifact_id)) return;
    const list = producers.get(task.output_artifact_id) ?? [];
    list.push(task.id);
    producers.set(task.output_artifact_id, list);
  });
  for (const artifact of artifacts) {
    if (!validId(artifact?.id)) continue;
    const owners = producers.get(artifact.id) ?? [];
    if (artifact.kind === "source-witness") {
      if (owners.length !== 0) add(`$.artifacts.${artifact.id}`, "external-source-witness-has-producer");
    } else {
      if (owners.length === 0) add(`$.artifacts.${artifact.id}`, "artifact-has-no-producer");
      if (owners.length > 1) add(`$.artifacts.${artifact.id}`, "artifact-has-multiple-producers");
    }
  }
  const artifactById = new Map(artifacts.filter((entry) => validId(entry?.id)).map((entry) => [entry.id, entry]));
  const outputKindByTaskKind = new Map<string, string>([
    ["source-read", "source-notes"],
    ["terminology-map", "glossary"],
    ["draft", "draft"],
    ["critique", "critique"],
    ["verify", "test-report"],
    ["fuse", "fused-output"],
  ]);
  for (const task of tasks) {
    if (!validId(task?.id)) continue;
    const outputKind = artifactById.get(task.output_artifact_id)?.kind;
    if (outputKind === "source-witness") add(`$.task_graph.nodes.${task.id}.output_artifact_id`, "task-cannot-produce-external-source-witness");
    const expectedOutputKind = outputKindByTaskKind.get(task.kind);
    if (expectedOutputKind !== undefined && outputKind !== expectedOutputKind) add(`$.task_graph.nodes.${task.id}.output_artifact_id`, "task-output-kind-mismatch");
    if (task.kind === "source-read") {
      if (!Array.isArray(task.source_ids) || task.source_ids.length === 0) add(`$.task_graph.nodes.${task.id}.source_ids`, "source-read-requires-source");
      if (!Array.isArray(task.input_artifact_ids) || task.input_artifact_ids.length !== 0) add(`$.task_graph.nodes.${task.id}.input_artifact_ids`, "source-read-must-not-consume-derived-artifact");
    } else if (!Array.isArray(task.input_artifact_ids) || task.input_artifact_ids.length === 0) {
      add(`$.task_graph.nodes.${task.id}.input_artifact_ids`, "derived-task-requires-input-artifact");
    }
  }
  if (!cyclic) {
    for (const task of tasks) {
      if (!validId(task?.id) || !Array.isArray(task.input_artifact_ids)) continue;
      const ancestors = ancestorsOf(task.id, taskById);
      task.input_artifact_ids.forEach((artifactId: unknown, index: number) => {
        if (!validId(artifactId)) return;
        const owners = producers.get(artifactId) ?? [];
        const externalSource = owners.length === 0 && artifactById.get(artifactId)?.kind === "source-witness";
        if (!externalSource && (owners.length !== 1 || !ancestors.has(owners[0]!))) add(`$.task_graph.nodes.${task.id}.input_artifact_ids[${index}]`, "input-not-produced-by-ancestor");
      });
    }
  }

  const assignmentById = new Map(assignments.filter((entry) => validId(entry?.id)).map((entry) => [entry.id, entry]));
  const allowedRolesByTaskKind = new Map<string, Set<string>>([
    ["source-read", new Set(["source-anchor"])],
    ["terminology-map", new Set(["terminology", "audience-interface"])],
    ["draft", new Set(["draft", "source-anchor"])],
    ["critique", new Set(["critique"])],
    ["verify", new Set(["verification"])],
    ["fuse", new Set(["fusion", "source-anchor"])],
  ]);
  const requiredRoleByTaskKind = new Map<string, string>([
    ["source-read", "source-anchor"],
    ["terminology-map", "terminology"],
    ["draft", "draft"],
    ["critique", "critique"],
    ["verify", "verification"],
    ["fuse", "fusion"],
  ]);
  for (const task of tasks) {
    if (!validId(task?.id) || !Array.isArray(task.assignment_ids)) continue;
    const declared = new Set(task.assignment_ids);
    const reverse = assignments.filter((assignment) => assignment.task_id === task.id).map((assignment) => assignment.id);
    if (reverse.length === 0) add(`$.task_graph.nodes.${task.id}.assignment_ids`, "task-has-no-assignment");
    if (!sameStringSet([...declared], reverse)) add(`$.task_graph.nodes.${task.id}.assignment_ids`, "assignment-reverse-index-mismatch");
    for (const assignmentId of task.assignment_ids) {
      const assignment = assignmentById.get(assignmentId);
      if (assignment && assignment.task_id !== task.id) add(`$.task_graph.nodes.${task.id}.assignment_ids`, "assignment-owned-by-other-task");
    }
    const taskAssignments = assignments.filter((assignment) => assignment.task_id === task.id);
    const allowedRoles = allowedRolesByTaskKind.get(task.kind);
    for (const assignment of taskAssignments) {
      if (allowedRoles && !allowedRoles.has(assignment.role)) add(`$.assignments.${assignment.id}.role`, "assignment-role-task-kind-mismatch");
    }
    const requiredRole = requiredRoleByTaskKind.get(task.kind);
    if (requiredRole && !taskAssignments.some((assignment) => assignment.role === requiredRole)) {
      add(`$.task_graph.nodes.${task.id}.assignment_ids`, "task-primary-role-missing");
    }
  }

  const runUse = new Map<string, number>();
  tasks.forEach((task) => {
    if (validId(task?.run_card_id)) runUse.set(task.run_card_id, (runUse.get(task.run_card_id) ?? 0) + 1);
  });
  runs.forEach((run) => {
    if (validId(run?.id) && runUse.get(run.id) !== 1) add(`$.run_cards.${run.id}`, "run-card-must-bind-exactly-one-task");
  });

  const runById = new Map(runs.filter((entry) => validId(entry?.id)).map((entry) => [entry.id, entry]));
  const testById = new Map(tests.filter((entry) => validId(entry?.id)).map((entry) => [entry.id, entry]));
  for (const task of tasks) {
    if (!validId(task?.id)) continue;
    const output = artifactById.get(task.output_artifact_id);
    const run = runById.get(task.run_card_id);
    const acceptance = Array.isArray(task.acceptance_test_ids) ? task.acceptance_test_ids.map((id: string) => testById.get(id)).filter(Boolean) : [];
    if (acceptance.some((test: JsonRecord) => !listIncludes(test.target_artifact_ids, task.output_artifact_id))) add(`$.task_graph.nodes.${task.id}.acceptance_test_ids`, "acceptance-test-does-not-target-output");
    if (task.status === "planned") {
      if (output?.state !== "planned" || run?.run_status !== "not-run" || acceptance.some((test: JsonRecord) => test.status !== "not-run")) add(`$.task_graph.nodes.${task.id}.status`, "planned-lifecycle-inconsistent");
    }
    if (task.status === "completed") {
      if (output?.state !== "available" || run?.run_status !== "completed" || !listIncludes(run?.result_artifact_ids, output?.id)) add(`$.task_graph.nodes.${task.id}.status`, "completed-output-or-run-missing");
      if (acceptance.length === 0 || acceptance.some((test: JsonRecord) => test.status !== "completed" || test.result !== "passed")) add(`$.task_graph.nodes.${task.id}.status`, "completed-tests-not-passing");
    }
    if (task.status === "reported") {
      if (output?.state !== "available" || !["reported", "completed"].includes(run?.run_status)
        || !listIncludes(run?.result_artifact_ids, output?.id)
        || acceptance.length === 0 || acceptance.every((test: JsonRecord) => test.status === "not-run")) {
        add(`$.task_graph.nodes.${task.id}.status`, "reported-evidence-missing");
      }
    }
    if (task.status === "withdrawn" && output?.state !== "withdrawn") add(`$.task_graph.nodes.${task.id}.status`, "withdrawn-output-mismatch");
  }

  for (const run of runs) {
    if (!validId(run?.id) || !Array.isArray(run.result_artifact_ids)) continue;
    for (const artifactId of run.result_artifact_ids) {
      const artifact = artifactById.get(artifactId);
      const owners = producers.get(artifactId) ?? [];
      if (artifact?.state !== "available") add(`$.run_cards.${run.id}.result_artifact_ids`, "run-result-not-available");
      if (owners.length !== 1 || taskById.get(owners[0]!)?.run_card_id !== run.id) add(`$.run_cards.${run.id}.result_artifact_ids`, "run-claims-other-producers-artifact");
    }
  }
  for (const test of tests) {
    if (test.status === "not-run" || !Array.isArray(test.target_artifact_ids)) continue;
    if (test.target_artifact_ids.some((id: string) => artifactById.get(id)?.state !== "available")) add(`$.tests.${test.id}.target_artifact_ids`, "executed-test-target-not-available");
  }

  const evaluationTestUse = new Set<string>();
  for (const assignment of assignments) {
    if (assignment.selection_basis !== "task-specific-evaluation") continue;
    const task = taskById.get(assignment.task_id);
    const run = task ? runById.get(task.run_card_id) : undefined;
    const test = validId(assignment.evaluation_test_id) ? testById.get(assignment.evaluation_test_id) : undefined;
    if (validId(assignment.evaluation_test_id)) {
      if (evaluationTestUse.has(assignment.evaluation_test_id)) add(`$.assignments.${assignment.id}.evaluation_test_id`, "evaluation-test-reused-across-assignments");
      evaluationTestUse.add(assignment.evaluation_test_id);
    }
    const resultArtifact = test && validId(test.result_artifact_id) ? artifactById.get(test.result_artifact_id) : undefined;
    const qualifying = test?.kind === "task-specific-evaluation"
      && test.status === "completed" && test.result === "passed"
      && task?.status === "completed" && run?.run_status === "completed"
      && listIncludes(test.target_artifact_ids, task?.output_artifact_id)
      && Array.isArray(test.language_profile_ids) && test.language_profile_ids.length === 1
      && test.language_profile_ids[0] === assignment.language_profile_id
      && Array.isArray(test.run_card_ids) && test.run_card_ids.length === 1
      && test.run_card_ids[0] === task?.run_card_id
      && resultArtifact?.state === "available"
      && validDate(test.valid_until) && test.valid_until >= asOf;
    if (!qualifying) add(`$.assignments.${assignment.id}.selection_basis`, "task-evaluation-not-passed");
  }
  return tasks.filter(isRecord);
}

function validateTranslations(value: unknown, namespace: Map<string, string>, artifactIds: Set<string>, profileIds: Set<string>, taskIds: Set<string>, testIds: Set<string>, invariantIds: Set<string>, tests: JsonRecord[], artifacts: JsonRecord[], tasks: JsonRecord[], assignments: JsonRecord[], add: AddIssue): JsonRecord[] {
  const translations = requireArray(value, "$.translations", add, 1, 128);
  const testById = new Map(tests.filter((entry) => validId(entry?.id)).map((entry) => [entry.id, entry]));
  const artifactById = new Map(artifacts.filter((entry) => validId(entry?.id)).map((entry) => [entry.id, entry]));
  const taskById = new Map(tasks.filter((entry) => validId(entry?.id)).map((entry) => [entry.id, entry]));
  const translationById = new Map(translations.filter(isRecord).filter((entry) => validId(entry.id)).map((entry) => [entry.id, entry]));
  const translationIds = new Set(translationById.keys());
  translations.forEach((translation, index) => {
    const path = `$.translations[${index}]`;
    if (!exactKeys(translation, TRANSLATION_KEYS, path, add)) return;
    registerGlobalId(translation.id, `${path}.id`, namespace, add);
    checkEnum(translation.kind, TRANSLATION_KINDS, `${path}.kind`, add);
    reference(translation.source_artifact_id, artifactIds, `${path}.source_artifact_id`, add);
    reference(translation.target_artifact_id, artifactIds, `${path}.target_artifact_id`, add);
    reference(translation.source_language_profile_id, profileIds, `${path}.source_language_profile_id`, add);
    reference(translation.target_language_profile_id, profileIds, `${path}.target_language_profile_id`, add);
    reference(translation.task_id, taskIds, `${path}.task_id`, add);
    if (translation.direction !== "one-way") add(`${path}.direction`, "must-be-one-way");
    checkEnum(translation.status, TRANSLATION_STATES, `${path}.status`, add);
    references(translation.preserved, invariantIds, `${path}.preserved`, add, 0);
    for (const field of ["changed_or_lost", "ambiguous", "untranslated", "introduced_material"]) checkStringList(translation[field], `${path}.${field}`, add, 0);
    if (exactKeys(translation.loss_vector, LOSS_KEYS, `${path}.loss_vector`, add)) {
      for (const key of LOSS_KEYS) checkEnum(translation.loss_vector[key], LOSS_STATES, `${path}.loss_vector.${key}`, add);
    }
    const preservationTests = requireArray(translation.preservation_tests, `${path}.preservation_tests`, add, 0, 64);
    const boundInvariants = new Set<string>();
    preservationTests.forEach((binding, bindingIndex) => {
      const bindingPath = `${path}.preservation_tests[${bindingIndex}]`;
      if (!exactKeys(binding, PRESERVATION_TEST_KEYS, bindingPath, add)) return;
      reference(binding.invariant_id, invariantIds, `${bindingPath}.invariant_id`, add);
      references(binding.test_ids, testIds, `${bindingPath}.test_ids`, add, 1);
      if (validId(binding.invariant_id)) {
        if (boundInvariants.has(binding.invariant_id)) add(`${bindingPath}.invariant_id`, "duplicate-preservation-binding");
        boundInvariants.add(binding.invariant_id);
      }
    });
    if (!sameStringSet([...boundInvariants], Array.isArray(translation.preserved) ? translation.preserved : [])) add(`${path}.preservation_tests`, "preserved-invariant-binding-mismatch");
    if (exactKeys(translation.loss_axis_test_ids, LOSS_KEYS, `${path}.loss_axis_test_ids`, add)) {
      for (const key of LOSS_KEYS) references(translation.loss_axis_test_ids[key], testIds, `${path}.loss_axis_test_ids.${key}`, add, 0);
    }
    references(translation.test_ids, testIds, `${path}.test_ids`, add, 1);
    checkEnum(translation.reversibility, REVERSIBILITY_STATES, `${path}.reversibility`, add);
    if (translation.reverse_translation_id !== null) reference(translation.reverse_translation_id, translationIds, `${path}.reverse_translation_id`, add);
    if (typeof translation.source_bytes_retention_required !== "boolean") add(`${path}.source_bytes_retention_required`, "not-boolean");
    checkBoolean(translation.authority_transfer, false, `${path}.authority_transfer`, add);
    if (translation.source_artifact_id === translation.target_artifact_id) add(path, "source-and-target-artifact-identical");

    const sourceArtifact = artifactById.get(translation.source_artifact_id);
    const targetArtifact = artifactById.get(translation.target_artifact_id);
    if (translation.source_bytes_retention_required === true && sourceArtifact?.source_bytes_retention_required !== true) add(`${path}.source_bytes_retention_required`, "source-artifact-retention-not-required");
    if (sourceArtifact && !listIncludes(sourceArtifact.language_profile_ids, translation.source_language_profile_id)) add(`${path}.source_language_profile_id`, "profile-not-on-source-artifact");
    if (targetArtifact && !listIncludes(targetArtifact.language_profile_ids, translation.target_language_profile_id)) add(`${path}.target_language_profile_id`, "profile-not-on-target-artifact");
    const task = taskById.get(translation.task_id);
    if (task && (task.output_artifact_id !== translation.target_artifact_id || !listIncludes(task.input_artifact_ids, translation.source_artifact_id))) add(`${path}.task_id`, "translation-task-edge-mismatch");
    const taskProfileIds = new Set(assignments
      .filter((assignment) => assignment.task_id === translation.task_id && validId(assignment.language_profile_id))
      .map((assignment) => assignment.language_profile_id));
    if (!taskProfileIds.has(translation.source_language_profile_id)) add(`${path}.source_language_profile_id`, "transformation-source-profile-not-assigned-to-task");
    if (!taskProfileIds.has(translation.target_language_profile_id)) add(`${path}.target_language_profile_id`, "transformation-target-profile-not-assigned-to-task");
    const expectedTaskKind = translation.kind === "summarization" ? "draft" : translation.kind === "terminology-alignment" ? "terminology-map" : undefined;
    const expectedTargetKind = translation.kind === "summarization" ? "draft" : translation.kind === "terminology-alignment" ? "glossary" : undefined;
    if (expectedTaskKind !== undefined && task?.kind !== expectedTaskKind) add(`${path}.task_id`, "transformation-task-kind-mismatch");
    if (expectedTargetKind !== undefined && targetArtifact?.kind !== expectedTargetKind) add(`${path}.target_artifact_id`, "transformation-target-kind-mismatch");

    const linkedTests = Array.isArray(translation.test_ids) ? translation.test_ids.map((id: string) => testById.get(id)).filter(Boolean) : [];
    const completedPassing = linkedTests.length > 0 && linkedTests.every((test: JsonRecord) => test.status === "completed" && test.result === "passed");
    const reportedPassing = linkedTests.some((test: JsonRecord) => ["reported", "completed"].includes(test.status) && test.result === "passed");
    const testCoversBothSides = (test: JsonRecord): boolean => listIncludes(test.target_artifact_ids, translation.source_artifact_id)
      && listIncludes(test.target_artifact_ids, translation.target_artifact_id);
    const strongComparisonKinds = new Set(["translation-contrast", "native-or-community-review"]);
    const validStrongComparisonTest = (test: JsonRecord | undefined, lifecycle: "reported" | "completed"): boolean => Boolean(test
      && (lifecycle === "completed" ? test.status === "completed" : ["reported", "completed"].includes(test.status))
      && test.result === "passed" && strongComparisonKinds.has(test.kind) && testCoversBothSides(test));
    const sourceRetentionTestPassed = (lifecycle: "reported" | "completed"): boolean => linkedTests.some((test: JsonRecord) => test.kind === "source-byte-retention"
      && (lifecycle === "completed" ? test.status === "completed" : ["reported", "completed"].includes(test.status))
      && test.result === "passed" && listIncludes(test.target_artifact_ids, translation.source_artifact_id));
    const claimLifecycle = translation.status === "completed-under-tests" ? "completed" : "reported";
    const verifyClaimBindings = (): void => {
      for (const binding of preservationTests.filter(isRecord)) {
        const bindingTests = Array.isArray(binding.test_ids) ? binding.test_ids.map((id: string) => testById.get(id)) : [];
        if (bindingTests.length === 0 || bindingTests.some((test) => !validStrongComparisonTest(test, claimLifecycle))) add(`${path}.preservation_tests.${binding.invariant_id}`, "preservation-binding-lacks-strong-comparative-test");
        if (Array.isArray(binding.test_ids) && binding.test_ids.some((id: string) => !listIncludes(translation.test_ids, id))) add(`${path}.preservation_tests.${binding.invariant_id}`, "preservation-test-not-linked-by-translation");
      }
      if (isRecord(translation.loss_axis_test_ids) && isRecord(translation.loss_vector)) {
        for (const key of LOSS_KEYS) {
          const state = translation.loss_vector[key];
          const ids = Array.isArray(translation.loss_axis_test_ids[key]) ? translation.loss_axis_test_ids[key] : [];
          if (["not-tested", "not-applicable"].includes(String(state))) {
            if (ids.length !== 0) add(`${path}.loss_axis_test_ids.${key}`, "untested-loss-axis-has-test-binding");
          } else {
            const axisTests = ids.map((id: string) => testById.get(id));
            if (axisTests.length === 0 || axisTests.some((test: JsonRecord | undefined) => !validStrongComparisonTest(test, claimLifecycle))) add(`${path}.loss_axis_test_ids.${key}`, "loss-axis-lacks-strong-comparative-test");
            if (ids.some((id: string) => !listIncludes(translation.test_ids, id))) add(`${path}.loss_axis_test_ids.${key}`, "loss-axis-test-not-linked-by-translation");
          }
        }
      }
    };
    const reverse = validId(translation.reverse_translation_id) ? translationById.get(translation.reverse_translation_id) : undefined;
    if (reverse && (reverse.source_artifact_id !== translation.target_artifact_id
      || reverse.target_artifact_id !== translation.source_artifact_id
      || reverse.source_language_profile_id !== translation.target_language_profile_id
      || reverse.target_language_profile_id !== translation.source_language_profile_id)) {
      add(`${path}.reverse_translation_id`, "reverse-translation-edge-mismatch");
    }
    if (translation.reversibility === "tested-for-declared-invariants") {
      if (!reverse || reverse.reverse_translation_id !== translation.id) add(`${path}.reverse_translation_id`, "tested-reversibility-requires-mutual-reverse-edge");
      if (reverse && (translation.status === "completed-under-tests"
        ? reverse.status !== "completed-under-tests"
        : !["reported", "completed-under-tests"].includes(reverse.status))) add(`${path}.reverse_translation_id`, "reverse-translation-lifecycle-mismatch");
    }
    if (Array.isArray(translation.preserved) && translation.preserved.length > 0
      && !(translation.status === "completed-under-tests" ? completedPassing : translation.status === "reported" && reportedPassing)) {
      add(`${path}.preserved`, "preservation-claim-without-passing-tests");
    }
    if (translation.status === "planned") {
      if (!Array.isArray(translation.preserved) || translation.preserved.length !== 0) add(`${path}.preserved`, "planned-preservation-must-be-empty");
      if (linkedTests.some((test: JsonRecord) => test.status !== "not-run")) add(`${path}.test_ids`, "planned-translation-test-already-run");
      if (Object.values(translation.loss_vector ?? {}).some((state) => !["not-tested", "not-applicable"].includes(String(state)))) add(`${path}.loss_vector`, "planned-loss-state-overclaim");
      if (preservationTests.length !== 0) add(`${path}.preservation_tests`, "planned-preservation-tests-must-be-empty");
      if (isRecord(translation.loss_axis_test_ids) && Object.values(translation.loss_axis_test_ids).some((ids) => Array.isArray(ids) && ids.length !== 0)) add(`${path}.loss_axis_test_ids`, "planned-loss-tests-must-be-empty");
      if (!["planned-test", "not-claimed", "not-applicable"].includes(translation.reversibility)) add(`${path}.reversibility`, "planned-reversibility-overclaim");
      if (task?.status !== "planned") add(`${path}.task_id`, "planned-translation-task-not-planned");
    }
    if (translation.status === "reported") {
      if (!reportedPassing) add(`${path}.status`, "reported-translation-has-no-passing-evidence");
      if (sourceArtifact?.state !== "available") add(`${path}.source_artifact_id`, "reported-source-not-available");
      if (targetArtifact?.state !== "available") add(`${path}.target_artifact_id`, "reported-target-not-available");
      if (task && !["reported", "completed"].includes(task.status)) add(`${path}.task_id`, "reported-translation-task-not-reported");
      verifyClaimBindings();
      if (translation.source_bytes_retention_required === true && !sourceRetentionTestPassed("reported")) add(`${path}.test_ids`, "reported-source-retention-test-not-passed");
      const hasStrongComparison = linkedTests.some((test: JsonRecord) => validStrongComparisonTest(test, "reported"));
      if ((Array.isArray(translation.preserved) && translation.preserved.length > 0
        || (isRecord(translation.loss_vector) && Object.values(translation.loss_vector).some((state) => !["not-tested", "not-applicable"].includes(String(state)))))
        && !hasStrongComparison) add(`${path}.test_ids`, "strong-comparative-translation-test-required");
      if (translation.reversibility === "tested-for-declared-invariants"
        && (!hasStrongComparison || !Array.isArray(translation.preserved) || translation.preserved.length === 0)) add(`${path}.reversibility`, "reversibility-without-declared-tested-invariants");
    }
    if (translation.status === "completed-under-tests") {
      if (!completedPassing) add(`${path}.status`, "completed-translation-tests-not-passing");
      if (sourceArtifact?.state !== "available") add(`${path}.source_artifact_id`, "completed-source-not-available");
      if (targetArtifact?.state !== "available") add(`${path}.target_artifact_id`, "completed-target-not-available");
      if (task?.status !== "completed") add(`${path}.task_id`, "completed-translation-task-not-completed");
      if (translation.source_bytes_retention_required !== true) add(`${path}.source_bytes_retention_required`, "completed-source-retention-required");
      if (Object.values(translation.loss_vector ?? {}).some((state) => state === "not-tested")) add(`${path}.loss_vector`, "completed-loss-axis-not-tested");
      if (!sourceRetentionTestPassed("completed")) add(`${path}.test_ids`, "source-retention-test-not-passed");
      verifyClaimBindings();
      const hasStrongComparison = linkedTests.some((test: JsonRecord) => validStrongComparisonTest(test, "completed"));
      if (((Array.isArray(translation.preserved) && translation.preserved.length > 0)
        || (isRecord(translation.loss_vector) && Object.values(translation.loss_vector).some((state) => !["not-tested", "not-applicable"].includes(String(state)))))
        && !hasStrongComparison) add(`${path}.test_ids`, "strong-comparative-translation-test-required");
      if (translation.reversibility === "tested-for-declared-invariants"
        && (!hasStrongComparison || !Array.isArray(translation.preserved) || translation.preserved.length === 0)) add(`${path}.reversibility`, "reversibility-without-declared-tested-invariants");
    }
    if (translation.status === "declined" && ((!Array.isArray(translation.preserved) || translation.preserved.length !== 0) || translation.reversibility === "tested-for-declared-invariants")) add(`${path}.status`, "declined-translation-overclaims-result");
    const disclosed = ["changed_or_lost", "ambiguous", "untranslated", "introduced_material"].some((field) => Array.isArray(translation[field]) && translation[field].length > 0);
    if (!disclosed && !completedPassing && !reportedPassing) add(path, "transformation-loss-undisclosed");
  });
  return translations.filter(isRecord);
}

function validateFusion(value: unknown, namespace: Map<string, string>, artifactIds: Set<string>, taskIds: Set<string>, invariantIds: Set<string>, testIds: Set<string>, tasks: JsonRecord[], artifacts: JsonRecord[], tests: JsonRecord[], add: AddIssue): JsonRecord | null {
  if (!exactKeys(value, FUSION_KEYS, "$.fusion", add)) return null;
  registerGlobalId(value.id, "$.fusion.id", namespace, add);
  checkEnum(value.mode, FUSION_MODES, "$.fusion.mode", add);
  reference(value.task_id, taskIds, "$.fusion.task_id", add);
  references(value.input_artifact_ids, artifactIds, "$.fusion.input_artifact_ids", add, 2);
  if (Array.isArray(value.input_artifact_ids) && value.input_artifact_ids.length > 32) add("$.fusion.input_artifact_ids", "too-many-fusion-inputs");
  reference(value.output_artifact_id, artifactIds, "$.fusion.output_artifact_id", add);
  references(value.invariant_ids, invariantIds, "$.fusion.invariant_ids", add, 1);
  references(value.test_ids, testIds, "$.fusion.test_ids", add, 1);
  checkIdList(value.disagreement_ids, "$.fusion.disagreement_ids", add, 0, 128);
  checkEnum(value.status, FUSION_STATES, "$.fusion.status", add);
  if (listIncludes(value.input_artifact_ids, value.output_artifact_id)) add("$.fusion.output_artifact_id", "fusion-output-also-input");
  if (exactKeys(value.rules, FUSION_RULE_KEYS, "$.fusion.rules", add)) {
    checkBoolean(value.rules.majority_establishes_truth, false, "$.fusion.rules.majority_establishes_truth", add);
    for (const field of ["retain_disagreement", "retain_source_terms", "missing_means_unknown", "dependency_disclosed", "high_stakes_requires_competent_review"]) checkBoolean(value.rules[field], true, `$.fusion.rules.${field}`, add);
    checkBoolean(value.rules.hidden_reasoning_consumed, false, "$.fusion.rules.hidden_reasoning_consumed", add);
    checkBoolean(value.rules.automatic_action, false, "$.fusion.rules.automatic_action", add);
  }
  const task = tasks.find((entry) => entry.id === value.task_id);
  if (task && (task.kind !== "fuse" || task.output_artifact_id !== value.output_artifact_id || !sameStringSet(task.input_artifact_ids, value.input_artifact_ids))) add("$.fusion.task_id", "fusion-task-edge-mismatch");
  const artifactById = new Map(artifacts.map((entry) => [entry.id, entry]));
  const testById = new Map(tests.map((entry) => [entry.id, entry]));
  const linkedTests = Array.isArray(value.test_ids) ? value.test_ids.map((id: string) => testById.get(id)).filter(Boolean) : [];
  if (value.status === "planned") {
    if (task?.status !== "planned" || artifactById.get(value.output_artifact_id)?.state !== "planned" || linkedTests.some((test: JsonRecord) => test.status !== "not-run")) add("$.fusion.status", "planned-fusion-lifecycle-inconsistent");
  }
  if (value.status === "completed-under-tests") {
    if (task?.status !== "completed" || artifactById.get(value.output_artifact_id)?.state !== "available" || linkedTests.length === 0 || linkedTests.some((test: JsonRecord) => test.status !== "completed" || test.result !== "passed")) add("$.fusion.status", "completed-fusion-evidence-missing");
    if (Array.isArray(value.input_artifact_ids) && value.input_artifact_ids.some((id: string) => artifactById.get(id)?.state !== "available")) add("$.fusion.input_artifact_ids", "completed-fusion-input-not-available");
  }
  return value;
}

function validateDisagreements(value: unknown, namespace: Map<string, string>, artifactIds: Set<string>, fusion: JsonRecord | null, add: AddIssue): void {
  const disagreements = requireArray(value, "$.disagreements", add, 0, 128);
  disagreements.forEach((disagreement, index) => {
    const path = `$.disagreements[${index}]`;
    if (!exactKeys(disagreement, DISAGREEMENT_KEYS, path, add)) return;
    registerGlobalId(disagreement.id, `${path}.id`, namespace, add);
    references(disagreement.artifact_ids, artifactIds, `${path}.artifact_ids`, add, 2,);
    references(disagreement.carried_in_artifact_ids, artifactIds, `${path}.carried_in_artifact_ids`, add, 1);
    if (Array.isArray(disagreement.artifact_ids) && disagreement.artifact_ids.length > 16) add(`${path}.artifact_ids`, "too-many-disagreement-artifacts");
    checkText(disagreement.statement, `${path}.statement`, add);
    checkEnum(disagreement.status, DISAGREEMENT_STATES, `${path}.status`, add);
    nullableBounded(disagreement.resolution, `${path}.resolution`, add, 8000);
    checkBoolean(disagreement.retained, true, `${path}.retained`, add);
    if (["open", "unknown"].includes(disagreement.status) && disagreement.resolution !== null) add(`${path}.resolution`, "unresolved-disagreement-has-resolution");
    if (disagreement.status === "resolved-under-tests" && !boundedText(disagreement.resolution)) add(`${path}.resolution`, "resolved-disagreement-needs-evidence-text");
    const fusionInputs = Array.isArray(fusion?.input_artifact_ids) ? fusion.input_artifact_ids : [];
    const fusionArtifacts = new Set([...fusionInputs, fusion?.output_artifact_id].filter(Boolean));
    if (Array.isArray(disagreement.artifact_ids) && disagreement.artifact_ids.some((id: string) => !fusionArtifacts.has(id))) add(`${path}.artifact_ids`, "disagreement-not-carried-through-fusion");
    if (!listIncludes(disagreement.carried_in_artifact_ids, fusion?.output_artifact_id)) add(`${path}.carried_in_artifact_ids`, "disagreement-not-carried-in-fused-output");
  });
  const disagreementIds = disagreements.filter(isRecord).map((entry) => entry.id).filter(validId);
  if (fusion && !sameStringSet(fusion.disagreement_ids, disagreementIds)) add("$.fusion.disagreement_ids", "fusion-disagreement-index-mismatch");
}

function validateUnknowns(value: unknown, namespace: Map<string, string>, add: AddIssue): void {
  const unknowns = requireArray(value, "$.unknowns", add, 2, 64);
  unknowns.forEach((unknown, index) => {
    const path = `$.unknowns[${index}]`;
    if (!exactKeys(unknown, UNKNOWN_KEYS, path, add)) return;
    registerGlobalId(unknown.id, `${path}.id`, namespace, add);
    for (const field of ["question", "why_unknown", "stop_condition"]) checkText(unknown[field], `${path}.${field}`, add);
    checkStringList(unknown.needed_evidence, `${path}.needed_evidence`, add);
  });
}

function validateRepair(value: unknown, weaveId: unknown, artifactIds: Set<string>, testIds: Set<string>, add: AddIssue): void {
  if (!exactKeys(value, REPAIR_KEYS, "$.repair", add)) return;
  if (value.supersedes_weave_id !== null && !validId(value.supersedes_weave_id)) add("$.repair.supersedes_weave_id", "invalid-id");
  if (value.supersedes_weave_id === weaveId) add("$.repair.supersedes_weave_id", "cannot-supersede-self");
  if (checkStringList(value.challenge_refs, "$.repair.challenge_refs", add, 0, 32)) value.challenge_refs.forEach((entry: string, index: number) => {
    if (!validSafeRef(entry)) add(`$.repair.challenge_refs[${index}]`, "unsafe-reference");
    else if (!validExternalOrRepoRef(entry)) add(`$.repair.challenge_refs[${index}]`, "challenge-reference-must-be-https-or-repo");
  });
  checkText(value.correction_route, "$.repair.correction_route", add);
  references(value.affected_artifact_ids, artifactIds, "$.repair.affected_artifact_ids", add, 0);
  references(value.rerun_test_ids, testIds, "$.repair.rerun_test_ids", add, 0);
  checkBoolean(value.retain_prior_when_safe, true, "$.repair.retain_prior_when_safe", add);
  checkBoolean(value.privacy_or_safety_removal_allowed, true, "$.repair.privacy_or_safety_removal_allowed", add);
  if (value.affected_artifact_ids?.length > 0 && value.rerun_test_ids?.length === 0) add("$.repair.rerun_test_ids", "affected-artifacts-require-rerun-tests");
}

function validateBoundaries(value: unknown, add: AddIssue): void {
  const expectedKeys = Object.keys(BOUNDARIES);
  if (!exactKeys(value, expectedKeys, "$.boundaries", add)) return;
  for (const [key, expected] of Object.entries(BOUNDARIES)) checkBoolean(value[key], expected, `$.boundaries.${key}`, add);
}

function validateIntegrity(value: unknown, add: AddIssue): void {
  if (!exactKeys(value, INTEGRITY_KEYS, "$.integrity", add)) return;
  if (value.algorithm !== INTEGRITY_ALGORITHM) add("$.integrity.algorithm", "algorithm-mismatch");
  if (typeof value.digest !== "string" || !SHA256.test(value.digest)) add("$.integrity.digest", "invalid-digest");
  checkBoolean(value.digest_field_zeroed, true, "$.integrity.digest_field_zeroed", add);
}

export function languageCivilisationTaskFusionDigest(value: JsonRecord): string {
  if (!isRecord(value)) throw new Error("language fusion record must be an ordinary JSON object");
  const treeIssues: LanguageCivilisationTaskFusionIssue[] = [];
  if (!validateJsonTree(value, (field, code) => treeIssues.push({ field, code }))) throw new Error("language fusion digest input must be an ordinary finite JSON tree");
  if (!isRecord(value.integrity)) throw new Error("language fusion record integrity envelope is missing");
  const material = structuredClone(value);
  material.integrity.digest = ZERO_DIGEST;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

export const computeLanguageFusionDigest = languageCivilisationTaskFusionDigest;
export const languageFusionDigest = languageCivilisationTaskFusionDigest;

export function loadLanguageCivilisationTaskFusion(path = LANGUAGE_CIVILISATION_TASK_FUSION_PATH): unknown {
  const absolute = resolve(path);
  let pathStat;
  try {
    pathStat = lstatSync(absolute);
  } catch {
    throw new Error("language fusion record is unavailable");
  }
  if (!pathStat.isFile() || pathStat.isSymbolicLink()) throw new Error("language fusion record must be a regular non-symlink file");
  if (pathStat.size > MAX_BYTES) throw new Error(`language fusion record exceeds ${MAX_BYTES} bytes`);
  let descriptor: number;
  try {
    descriptor = openSync(absolute, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0));
  } catch {
    throw new Error("language fusion record could not be opened without following links");
  }
  try {
    const openedStat = fstatSync(descriptor);
    if (!openedStat.isFile() || openedStat.dev !== pathStat.dev || openedStat.ino !== pathStat.ino) throw new Error("language fusion record changed while opening");
    if (openedStat.size > MAX_BYTES) throw new Error(`language fusion record exceeds ${MAX_BYTES} bytes`);
    const bytes = readFileSync(descriptor);
    if (bytes.byteLength > MAX_BYTES) throw new Error(`language fusion record exceeds ${MAX_BYTES} bytes`);
    return parseStrictJsonBytes(bytes, "language fusion record JSON");
  } finally {
    closeSync(descriptor);
  }
}

export const loadLanguageFusion = loadLanguageCivilisationTaskFusion;

export function validateLanguageCivilisationTaskFusion(
  value: unknown,
  options: LanguageCivilisationTaskFusionValidationOptions = {},
): LanguageCivilisationTaskFusionIssue[] {
  const issues: LanguageCivilisationTaskFusionIssue[] = [];
  const seenIssues = new Set<string>();
  const add: AddIssue = (field, code) => {
    const key = `${field}\u0000${code}`;
    if (!seenIssues.has(key)) {
      issues.push({ field, code });
      seenIssues.add(key);
    }
  };
  const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);
  if (!validDate(asOf)) {
    add("$options.asOf", "invalid-date");
    return issues;
  }
  if (!validateJsonTree(value, add)) return issues;
  if (!exactKeys(value, TOP_KEYS, "$", add)) return issues;
  validatePrimitiveShape(value, add, asOf);
  validateScope(value.scope, add);
  validateFirewall(value.type_firewall, add);

  const namespace = new Map<string, string>();
  const sources = validateSources(value.sources, namespace, add, value.evidence_through, value.issued_on, asOf);
  const sourceIds = new Set(sources.filter((entry) => validId(entry?.id)).map((entry) => entry.id));
  validateWitnesses(value.historical_witnesses, namespace, sourceIds, add);
  const profiles = validateProfiles(value.language_profiles, namespace, sourceIds, add);
  const profileIds = new Set(profiles.filter((entry) => validId(entry?.id)).map((entry) => entry.id));
  validateDimensions(value.dimensions, namespace, sourceIds, add);
  validateObservations(value.observations, namespace, sourceIds, add, value.evidence_through, value.issued_on, asOf);
  const invariants = validateInvariants(value.invariants, namespace, add);
  const invariantIds = new Set(invariants.filter((entry) => validId(entry?.id)).map((entry) => entry.id));
  const artifacts = validateArtifacts(value.artifacts, namespace, profileIds, add);
  const artifactIds = new Set(artifacts.filter((entry) => validId(entry?.id)).map((entry) => entry.id));

  // Register task IDs before validating references into the graph.
  const rawTasks = isRecord(value.task_graph) && Array.isArray(value.task_graph.nodes) ? value.task_graph.nodes : [];
  rawTasks.forEach((task: unknown, index: number) => {
    if (isRecord(task)) registerGlobalId(task.id, `$.task_graph.nodes[${index}].id`, namespace, add);
  });
  const taskIds = new Set(rawTasks.filter((entry: unknown) => isRecord(entry) && validId(entry.id)).map((entry: JsonRecord) => entry.id));

  // Runs, tests, and assignments must be known before task reference checks.
  const rawRuns = Array.isArray(value.run_cards) ? value.run_cards : [];
  const rawTests = Array.isArray(value.tests) ? value.tests : [];
  const rawAssignments = Array.isArray(value.assignments) ? value.assignments : [];
  rawRuns.forEach((entry: unknown, index: number) => { if (isRecord(entry)) registerGlobalId(entry.id, `$.run_cards[${index}].id`, namespace, add); });
  rawTests.forEach((entry: unknown, index: number) => { if (isRecord(entry)) registerGlobalId(entry.id, `$.tests[${index}].id`, namespace, add); });
  rawAssignments.forEach((entry: unknown, index: number) => { if (isRecord(entry)) registerGlobalId(entry.id, `$.assignments[${index}].id`, namespace, add); });
  const runIds = new Set(rawRuns.filter((entry: unknown) => isRecord(entry) && validId(entry.id)).map((entry: JsonRecord) => entry.id));
  const testIds = new Set(rawTests.filter((entry: unknown) => isRecord(entry) && validId(entry.id)).map((entry: JsonRecord) => entry.id));
  const assignmentIds = new Set(rawAssignments.filter((entry: unknown) => isRecord(entry) && validId(entry.id)).map((entry: JsonRecord) => entry.id));

  // These validators skip ID registration because the pre-pass above owns it.
  const shadowNamespace = new Map(namespace);
  for (const entry of rawRuns) if (isRecord(entry) && validId(entry.id)) shadowNamespace.delete(entry.id);
  const runs = validateRuns(value.run_cards, shadowNamespace, artifactIds, artifacts, add, value.issued_on, asOf);
  for (const entry of rawTests) if (isRecord(entry) && validId(entry.id)) shadowNamespace.delete(entry.id);
  const tests = validateTests(value.tests, shadowNamespace, artifactIds, artifacts, profileIds, runIds, add, value.issued_on, asOf);
  for (const entry of rawAssignments) if (isRecord(entry) && validId(entry.id)) shadowNamespace.delete(entry.id);
  const assignments = validateAssignments(value.assignments, shadowNamespace, taskIds, profileIds, sourceIds, testIds, add);
  for (const entry of rawTasks) if (isRecord(entry) && validId(entry.id)) shadowNamespace.delete(entry.id);
  const tasks = validateTasks(value.task_graph, shadowNamespace, sourceIds, artifactIds, runIds, testIds, assignmentIds, assignments, artifacts, runs, tests, asOf, add);

  const translations = validateTranslations(value.translations, namespace, artifactIds, profileIds, taskIds, testIds, invariantIds, tests, artifacts, tasks, assignments, add);
  void translations;
  const fusion = validateFusion(value.fusion, namespace, artifactIds, taskIds, invariantIds, testIds, tasks, artifacts, tests, add);
  validateDisagreements(value.disagreements, namespace, artifactIds, fusion, add);
  validateUnknowns(value.unknowns, namespace, add);
  validateRepair(value.repair, value.weave_id, artifactIds, testIds, add);
  validateBoundaries(value.boundaries, add);
  validateIntegrity(value.integrity, add);

  if (value.state === "planned") {
    if (artifacts.some((entry) => entry.state !== "planned")) add("$.state", "planned-record-has-nonplanned-artifact");
    if (tasks.some((entry) => entry.status !== "planned")) add("$.state", "planned-record-has-nonplanned-task");
    if (runs.some((entry) => entry.run_status !== "not-run")) add("$.state", "planned-record-has-run");
    if (tests.some((entry) => entry.status !== "not-run")) add("$.state", "planned-record-has-run-test");
    if (Array.isArray(value.translations) && value.translations.some((entry: unknown) => !isRecord(entry) || entry.status !== "planned")) add("$.state", "planned-record-has-nonplanned-translation");
    if (value.fusion?.status !== "planned") add("$.state", "planned-record-has-nonplanned-fusion");
  }
  if (value.state === "reported") {
    const hasReport = artifacts.some((entry) => entry.state !== "planned")
      || tasks.some((entry) => entry.status !== "planned")
      || runs.some((entry) => entry.run_status !== "not-run")
      || tests.some((entry) => entry.status !== "not-run")
      || (Array.isArray(value.translations) && value.translations.some((entry: unknown) => !isRecord(entry) || entry.status !== "planned"))
      || value.fusion?.status !== "planned";
    if (!hasReport) add("$.state", "reported-record-has-no-report-evidence");
  }
  if (value.state === "completed-under-tests") {
    if (artifacts.some((entry) => entry.state !== "available")) add("$.state", "completed-record-has-unavailable-artifact");
    if (tasks.some((entry) => entry.status !== "completed")) add("$.state", "completed-record-has-incomplete-task");
    if (runs.some((entry) => entry.run_status !== "completed")) add("$.state", "completed-record-has-incomplete-run");
    if (tests.some((entry) => entry.status !== "completed" || entry.result !== "passed")) add("$.state", "completed-record-has-nonpassing-test");
    if (Array.isArray(value.translations) && value.translations.some((entry: unknown) => !isRecord(entry) || !["completed-under-tests", "declined"].includes(entry.status))) add("$.state", "completed-record-has-incomplete-translation");
    if (value.fusion?.status !== "completed-under-tests") add("$.state", "completed-record-has-incomplete-fusion");
  }

  if (isRecord(value.integrity) && typeof value.integrity.digest === "string" && SHA256.test(value.integrity.digest)) {
    try {
      const computed = languageCivilisationTaskFusionDigest(value);
      if (value.integrity.digest !== computed) add("$.integrity.digest", "digest-mismatch");
      if (options.canonical === true && computed !== LANGUAGE_CIVILISATION_TASK_FUSION_REVIEWED_DIGEST) add("$.integrity.digest", "reviewed-canonical-digest-mismatch");
    } catch {
      add("$.integrity.digest", "digest-computation-failed");
    }
  }
  if (options.canonical === true && value.weave_id !== LANGUAGE_CIVILISATION_TASK_FUSION_ID) add("$.weave_id", "canonical-id-mismatch");
  return issues;
}

export const validateLanguageFusion = validateLanguageCivilisationTaskFusion;

export function projectLanguageCivilisationTaskPlan(value: unknown): JsonRecord {
  const issues = validateLanguageCivilisationTaskFusion(value);
  if (issues.length > 0 || !isRecord(value)) throw new Error(`cannot project invalid language fusion record (${issues.length} issue(s))`);
  const tasks = value.task_graph.nodes as JsonRecord[];
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const runById = new Map((value.run_cards as JsonRecord[]).map((run) => [run.id, run]));
  const assignmentById = new Map((value.assignments as JsonRecord[]).map((assignment) => [assignment.id, assignment]));
  const order = topologicalOrder(tasks).order;
  return {
    protocol: "kingdom.language-civilisation-task-plan/0.1",
    source_weave_id: value.weave_id,
    source_weave_digest: value.integrity.digest,
    source_weave_version: value.version,
    title: value.title,
    issued_on: value.issued_on,
    evidence_through: value.evidence_through,
    state: value.state,
    structure_only: true,
    plan_only: true,
    safety_context_complete: true,
    safety_context_omitted: false,
    deterministic: true,
    untrusted_free_text: true,
    execution_authorized: false,
    scope: value.scope,
    type_firewall: value.type_firewall,
    sources: value.sources,
    historical_witnesses: value.historical_witnesses,
    language_profiles: value.language_profiles,
    dimensions: value.dimensions,
    observations: value.observations,
    invariants: value.invariants,
    artifacts: value.artifacts,
    nodes: order.map((id, index) => {
      const task = taskById.get(id)!;
      const run = runById.get(task.run_card_id);
      return {
        sequence: index + 1,
        id: task.id,
        kind: task.kind,
        instruction: task.instruction,
        depends_on: task.depends_on,
        source_ids: task.source_ids,
        input_artifact_ids: task.input_artifact_ids,
        output_artifact_id: task.output_artifact_id,
        assignments: task.assignment_ids.map((assignmentId: string) => {
          const assignment = assignmentById.get(assignmentId)!;
          return { ...assignment };
        }),
        acceptance_test_ids: task.acceptance_test_ids,
        run_card_id: task.run_card_id,
        run_status: run?.run_status,
        status: task.status,
        public_artifacts_only: true,
      };
    }),
    final_task_id: value.task_graph.final_task_id,
    final_artifact_id: value.task_graph.final_artifact_id,
    translations: value.translations,
    fusion: value.fusion,
    run_cards: value.run_cards,
    tests: value.tests,
    disagreements: value.disagreements,
    unknowns: value.unknowns,
    repair: value.repair,
    boundaries: value.boundaries,
    non_effects: {
      network: false,
      filesystem_write: false,
      model_or_tokenizer_run: false,
      agent_dispatch: false,
      hidden_reasoning_collection: false,
      authority: false,
      publication: false,
      deployment: false,
    },
  };
}

export const projectLanguageFusionPlan = projectLanguageCivilisationTaskPlan;
export const languageFusionPlan = projectLanguageCivilisationTaskPlan;

type VerifyReport = {
  valid: boolean;
  canonical: boolean;
  schema_checked: false;
  structure_only: true;
  plan_only: true;
  computed_digest: string | null;
  expected_digest: string | null;
  issues: LanguageCivilisationTaskFusionIssue[];
  boundary: string;
};

function verificationReport(value: unknown, canonical: boolean): VerifyReport {
  const issues = validateLanguageCivilisationTaskFusion(value, { canonical });
  let computedDigest: string | null = null;
  try {
    if (isRecord(value) && isRecord(value.integrity)) computedDigest = languageCivilisationTaskFusionDigest(value);
  } catch {
    // The structured issues remain the authoritative failure report.
  }
  return {
    valid: issues.length === 0,
    canonical,
    schema_checked: false,
    structure_only: true,
    plan_only: true,
    computed_digest: computedDigest,
    expected_digest: canonical ? LANGUAGE_CIVILISATION_TASK_FUSION_REVIEWED_DIGEST : null,
    issues,
    boundary: "Plan-only structure and digest; v0.1 cannot record executed evidence or route agents. No source dereference, model/tokenizer run, translation-fidelity proof, truth proof, identity/intent inference, consent, authority, publication, deployment, or action.",
  };
}

function overview(value: JsonRecord): JsonRecord {
  return {
    protocol: value.protocol,
    weave_id: value.weave_id,
    title: value.title,
    state: value.state,
    issued_on: value.issued_on,
    evidence_through: value.evidence_through,
    source_count: value.sources.length,
    historical_witness_count: value.historical_witnesses.length,
    language_profile_count: value.language_profiles.length,
    shape_dimensions: value.dimensions.shape.map((entry: JsonRecord) => entry.id),
    weight_dimensions: value.dimensions.weight.map((entry: JsonRecord) => entry.id),
    task_count: value.task_graph.nodes.length,
    translation_count: value.translations.length,
    run_statuses: value.run_cards.map((entry: JsonRecord) => ({ id: entry.id, status: entry.run_status })),
    test_statuses: value.tests.map((entry: JsonRecord) => ({ id: entry.id, status: entry.status })),
    final_task_id: value.task_graph.final_task_id,
    final_artifact_id: value.task_graph.final_artifact_id,
    boundary: "A planned public-artifact weave, not an execution, capability certification, ranking, or authority grant.",
  };
}

function usage(): string {
  return [
    "usage: bun bin/language-civilisation-task-fusion.ts COMMAND [FILE] [--json]",
    "commands: overview history dimensions graph assignments translations fusions runs tests disagreements boundaries verify verify-file plan plan-file",
    "v0.1 is plan-only; verify-file and plan-file accept exactly one bounded local JSON file; all other commands accept no file.",
  ].join("\n");
}

function printPayload(payload: unknown, json: boolean): void {
  if (!json) process.stdout.write("PLAN-ONLY STRUCTURE — v0.1 records no executed evidence and routes no agent; human-authored text is untrusted; no model, network, write, publication, authority, or action effect.\n");
  process.stdout.write(`${JSON.stringify(payload, null, json ? 0 : 2)}\n`);
}

function parseCli(argv: string[]): { command: string; operands: string[]; json: boolean } {
  let json = false;
  const operands: string[] = [];
  for (const arg of argv) {
    if (arg === "--json") {
      if (json) throw new Error("--json may be supplied once");
      json = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`unknown option: ${arg}`);
    } else {
      operands.push(arg);
    }
  }
  const command = operands.shift() ?? "overview";
  return { command, operands, json };
}

function runCli(argv: string[]): number {
  let parsed: ReturnType<typeof parseCli>;
  try {
    parsed = parseCli(argv);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n${usage()}\n`);
    return 2;
  }
  const { command, operands, json } = parsed;
  const fileCommands = new Set(["verify-file", "plan-file"]);
  if ((fileCommands.has(command) && operands.length !== 1) || (!fileCommands.has(command) && operands.length !== 0)) {
    process.stderr.write(`${usage()}\n`);
    return 2;
  }
  const commandTable: Record<string, () => number> = Object.freeze({
    verify: () => {
      const value = loadLanguageCivilisationTaskFusion();
      const report = verificationReport(value, true);
      printPayload(report, json);
      return report.valid ? 0 : 1;
    },
    "verify-file": () => {
      const value = loadLanguageCivilisationTaskFusion(operands[0]);
      const report = verificationReport(value, false);
      printPayload(report, json);
      return report.valid ? 0 : 1;
    },
    plan: () => {
      const value = loadLanguageCivilisationTaskFusion();
      const canonicalIssues = validateLanguageCivilisationTaskFusion(value, { canonical: true });
      if (canonicalIssues.length > 0) {
        printPayload({ valid: false, canonical: true, schema_checked: false, issues: canonicalIssues }, json);
        return 1;
      }
      printPayload(projectLanguageCivilisationTaskPlan(value), json);
      return 0;
    },
    "plan-file": () => {
      const value = loadLanguageCivilisationTaskFusion(operands[0]);
      const issues = validateLanguageCivilisationTaskFusion(value);
      if (issues.length > 0) {
        printPayload({ valid: false, canonical: false, schema_checked: false, issues }, json);
        return 1;
      }
      printPayload(projectLanguageCivilisationTaskPlan(value), json);
      return 0;
    },
    overview: () => inspect(overview),
    history: () => inspect((value) => value.historical_witnesses),
    dimensions: () => inspect((value) => value.dimensions),
    graph: () => inspect((value) => value.task_graph),
    assignments: () => inspect((value) => value.assignments),
    translations: () => inspect((value) => value.translations),
    fusions: () => inspect((value) => value.fusion),
    fusion: () => inspect((value) => value.fusion),
    runs: () => inspect((value) => value.run_cards),
    tests: () => inspect((value) => value.tests),
    disagreements: () => inspect((value) => value.disagreements),
    boundaries: () => inspect((value) => value.boundaries),
  });
  function inspect(project: (value: JsonRecord) => unknown): number {
    const value = loadLanguageCivilisationTaskFusion();
    const issues = validateLanguageCivilisationTaskFusion(value, { canonical: true });
    if (issues.length > 0 || !isRecord(value)) {
      printPayload({ valid: false, canonical: true, schema_checked: false, issues }, json);
      return 1;
    }
    printPayload(project(value), json);
    return 0;
  }
  if (!Object.hasOwn(commandTable, command)) {
    process.stderr.write(`${usage()}\n`);
    return 2;
  }
  try {
    return commandTable[command]!();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) process.stdout.write(`${JSON.stringify({ valid: false, canonical: command !== "verify-file" && command !== "plan-file", schema_checked: false, issues: [{ field: "$", code: "load-error" }], error: message })}\n`);
    else process.stderr.write(`${message}\n`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = runCli(process.argv.slice(2));
