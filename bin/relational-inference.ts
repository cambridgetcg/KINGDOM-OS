/**
 * Read-only validator for opt-in relational inference cases.
 *
 * It checks finite graph structure, declared probe dependence, competing-model
 * coverage, provenance boundaries, and repairability. Passing does not prove a
 * hidden cause, truth, fidelity, identity, understanding, evidence adequacy,
 * causation, intent, authority, consent, deception, or declared independence.
 * Free text is unevaluated, untrusted data and is never executed.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { types as utilTypes } from "node:util";

import { parseSemanticTransitionJson } from "./semantic-transitions.ts";

export const RELATIONAL_INFERENCE_SCHEMA_VERSION = "kingdom.relational-inference/0.1";

export const RELATIONAL_PATTERN_CLAIM_TYPES = [
  "analogy",
  "partial-map",
  "lax-correspondence",
] as const;

export const RELATIONAL_TRANSLATION_KINDS = [
  "encode",
  "decode",
  "lexicalize",
  "translate",
  "infer",
  "visualize",
  "reconstruct",
  "compare",
] as const;

export const RELATIONAL_TRANSLATION_TEST_RESULTS = [
  "passed",
  "failed",
  "inconclusive",
  "not-run",
] as const;

export const RELATIONAL_PROBE_KINDS = [
  "intervention",
  "round-trip",
  "triangle",
  "external-observation",
  "counterexample",
  "correction-reach",
  "common-mode-difference",
] as const;

export const RELATIONAL_EPISTEMIC_ACCESS = ["direct", "reported", "inferred", "unknown"] as const;
export const RELATIONAL_PROBE_RUN_STATUSES = ["completed", "inconclusive", "not-run"] as const;
export const RELATIONAL_PROBE_DEPENDENCIES = [
  "independent",
  "partially-shared",
  "shared-systematic",
  "unknown",
] as const;
export const RELATIONAL_MODEL_ROLES = ["working", "alternative", "null", "unknown"] as const;
export const RELATIONAL_PROBE_ASSESSMENT_RESULTS = [
  "compatible",
  "tension",
  "contradicted-under-test",
  "unassessed",
] as const;
export const RELATIONAL_MODEL_STATUSES = [
  "live",
  "constrained",
  "contradicted-under-test",
  "unassessed",
] as const;
export const RELATIONAL_CONCLUSION_STATUSES = [
  "model-contrast",
  "bounded-inference",
  "underdetermined",
] as const;
export const RELATIONAL_CONFIDENCE_LEVELS = ["medium", "low", "unknown"] as const;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = join(ROOT, "bridges/schemas/relational-inference-case-0.1.json");
export const RELATIONAL_INFERENCE_JSON_SCHEMA = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));

type JsonRecord = Record<string, unknown>;

export type RelationalValidationOptions = { asOf?: string };

export type RelationalProbe = {
  id: string;
  kind: typeof RELATIONAL_PROBE_KINDS[number];
  description: string;
  context: string;
  scale: string;
  sensitivity_scope: string;
  backgrounds: string[];
  selection_effects: string[];
  shared_factors: string[];
  source_ref: string | null;
  observed_on: string | null;
  epistemic_access: typeof RELATIONAL_EPISTEMIC_ACCESS[number];
  run_status: typeof RELATIONAL_PROBE_RUN_STATUSES[number];
  result: string;
  limitations: string[];
};

export type RelationalProbeDependency = {
  probe_ids: [string, string];
  relationship: typeof RELATIONAL_PROBE_DEPENDENCIES[number];
  basis: string;
};

export type RelationalProbeAssessment = {
  probe_id: string;
  expectation: string;
  result: typeof RELATIONAL_PROBE_ASSESSMENT_RESULTS[number];
  residual: string;
};

export type RelationalCandidateModel = {
  id: string;
  role: typeof RELATIONAL_MODEL_ROLES[number];
  description: string;
  assumptions: string[];
  probe_assessments: RelationalProbeAssessment[];
  falsifier_or_refinement_condition: string;
  status: typeof RELATIONAL_MODEL_STATUSES[number];
};

export type RelationalInferenceCase = {
  schema_version: typeof RELATIONAL_INFERENCE_SCHEMA_VERSION;
  id: string;
  issued_on: string;
  state: "draft" | "issued";
  question: JsonRecord;
  pattern: JsonRecord;
  realizations: JsonRecord[];
  translations: JsonRecord[];
  probes: RelationalProbe[];
  probe_dependencies: RelationalProbeDependency[];
  candidate_models: RelationalCandidateModel[];
  inference: JsonRecord;
  boundaries: JsonRecord;
  harm_boundary: JsonRecord;
  repair: {
    relation: "original" | "corrects" | "supersedes" | "withdraws";
    target_case_id: string | null;
    reply_route: string;
    correction_route: string;
    carry_challenges_forward: true;
    retain_prior_nonsensitive_case: true;
  };
  safety: JsonRecord;
};

const MAX_CASE_DEPTH = 64;
const MAX_CASE_NODES = 20_000;

const FORBIDDEN_FIELD_NAMES = new Set([
  "biometrics",
  "chain_of_thought",
  "credentials",
  "deception_label",
  "deception_score",
  "essence",
  "guilt",
  "guilt_score",
  "hidden_cause",
  "identity_score",
  "inferred_intent",
  "intent_score",
  "liar",
  "lie_score",
  "mental_state",
  "moral_score",
  "person_score",
  "private_reasoning",
  "reputation_score",
  "risk_score",
  "true_model",
  "trust_score",
  "truth_score",
  "worthiness_score",
]);

function rejectNonJsonAndForbiddenFields(value: unknown): void {
  const seen = new WeakSet<object>();
  const stack: Array<{ value: unknown; path: string; depth: number }> = [
    { value, path: "Relational inference case", depth: 0 },
  ];
  let nodes = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (++nodes > MAX_CASE_NODES) throw new Error("Relational inference case is too large");
    if (current.depth > MAX_CASE_DEPTH) throw new Error("Relational inference case is nested too deeply");

    if (current.value === null || typeof current.value === "string" || typeof current.value === "boolean") continue;
    if (typeof current.value === "number") {
      if (!Number.isFinite(current.value)) throw new Error(`${current.path} must contain finite JSON numbers only`);
      continue;
    }
    if (typeof current.value !== "object") throw new Error(`${current.path} must contain JSON values only`);
    if (utilTypes.isProxy(current.value)) throw new Error(`${current.path} must not contain proxy objects`);
    if (seen.has(current.value)) throw new Error("Relational inference case must be an acyclic JSON tree");
    seen.add(current.value);

    if (Array.isArray(current.value)) {
      if (Object.getPrototypeOf(current.value) !== Array.prototype) {
        throw new Error(`${current.path} must use the standard Array prototype`);
      }
      if (current.value.length > MAX_CASE_NODES) throw new Error("Relational inference case is too large");
      const ownKeys = Reflect.ownKeys(current.value);
      const expectedKeys = new Set<string>(["length"]);
      for (let index = 0; index < current.value.length; index++) expectedKeys.add(String(index));
      if (ownKeys.some((key) => typeof key !== "string" || !expectedKeys.has(key))) {
        throw new Error(`${current.path} array must not contain hidden or named properties`);
      }
      for (let index = 0; index < current.value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(current.value, String(index));
        if (!descriptor || !("value" in descriptor)) throw new Error(`${current.path} must not contain holes or accessors`);
        stack.push({ value: descriptor.value, path: `${current.path}[${index}]`, depth: current.depth + 1 });
      }
      continue;
    }

    const prototype = Object.getPrototypeOf(current.value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`${current.path} must be a plain JSON object`);
    }
    for (const key of Reflect.ownKeys(current.value)) {
      if (typeof key !== "string") throw new Error(`${current.path} must not contain symbol keys`);
      const descriptor = Object.getOwnPropertyDescriptor(current.value, key)!;
      if (!("value" in descriptor) || descriptor.enumerable !== true) {
        throw new Error(`${current.path}.${key} must be an enumerable data field`);
      }
      if (FORBIDDEN_FIELD_NAMES.has(key.toLowerCase())) {
        throw new Error(`${current.path}.${key} is forbidden: cases compare models and artifacts, not private minds or people`);
      }
      stack.push({ value: descriptor.value, path: `${current.path}.${key}`, depth: current.depth + 1 });
    }
  }
}

function record(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly: ${expected.join(", ")}`);
  }
}

function text(value: unknown, label: string, minimum = 1, maximum = 2_000): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  const trimmed = value.trim();
  if ([...trimmed].length < minimum || [...value].length > maximum) {
    throw new Error(`${label} must contain ${minimum}-${maximum} characters`);
  }
  if (/[\u0000-\u0008\u000b-\u001f]/u.test(value)) throw new Error(`${label} must not contain control characters`);
  return value;
}

function identifier(value: unknown, label: string): string {
  const result = text(value, label, 1, 100);
  if (result !== result.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) {
    throw new Error(`${label} must be a lowercase hyphenated identifier`);
  }
  return result;
}

function isoDate(value: unknown, label: string): string {
  const result = text(value, label, 10, 10);
  const parsed = new Date(`${result}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.valueOf()) ||
      parsed.toISOString().slice(0, 10) !== result) {
    throw new Error(`${label} must be a real ISO date`);
  }
  return result;
}

function oneOf<T extends readonly string[]>(value: unknown, choices: T, label: string): T[number] {
  if (typeof value !== "string" || !choices.includes(value as T[number])) {
    throw new Error(`${label} must be one of: ${choices.join(", ")}`);
  }
  return value as T[number];
}

function array(value: unknown, label: string, minimum: number, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new Error(`${label} must contain ${minimum}-${maximum} entries`);
  }
  return value;
}

function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} entries must be unique`);
}

function textArray(value: unknown, label: string, minimum = 1, maximum = 32): string[] {
  const values = array(value, label, minimum, maximum)
    .map((entry, index) => text(entry, `${label} entry ${index + 1}`));
  unique(values.map((entry) => entry.trim()), label);
  return values;
}

function evidenceReference(value: unknown, label: string): string {
  const result = text(value, label);
  if (result !== result.trim() || /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(result)) {
    throw new Error(`${label} must not contain surrounding, control, or bidirectional formatting characters`);
  }
  if (/%(?:0[0-9a-f]|1[0-9a-f]|7f|2f|5c|25)/iu.test(result)) {
    throw new Error(`${label} must not contain encoded controls, DEL, slash, backslash, or percent`);
  }
  if (/%(?![0-9a-f]{2})/iu.test(result)) throw new Error(`${label} must not contain malformed percent encoding`);
  if (/[?#]/u.test(result)) throw new Error(`${label} must not contain URL query or fragment data`);
  if (/^(?:\/\/|\\\\|\/|\\|~(?:\/|$))/u.test(result)) {
    throw new Error(`${label} must not be protocol-relative or an absolute filesystem reference`);
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(result)) {
    if (result.includes("\\")) throw new Error(`${label} must use portable forward slashes`);
    const segments = result.split("/");
    if (segments.some((segment) => segment === "" || segment === "." || segment === ".." || /%2e/i.test(segment))) {
      throw new Error(`${label} must be a normalized relative reference without dot segments`);
    }
    return result;
  }

  let parsed: URL;
  try {
    parsed = new URL(result);
  } catch {
    throw new Error(`${label} URL is malformed`);
  }
  if (parsed.protocol === "https:") {
    if (!result.startsWith("https://") || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error(`${label} must be canonical HTTPS without credentials, query, or fragment data`);
    }
    if (result !== parsed.href) throw new Error(`${label} HTTPS input must equal its canonical URL href`);
    return result;
  }
  if (["artifact:", "report:", "urn:"].includes(parsed.protocol) && !parsed.search && !parsed.hash) {
    if (!result.startsWith(parsed.protocol)) throw new Error(`${label} opaque reference scheme must be lowercase canonical form`);
    return result;
  }
  throw new Error(`${label} must be a relative reference, HTTPS URL, artifact/report reference, or URN`);
}

function canonicalReferenceAlias(reference: string): string {
  const normalized = /^[a-z][a-z0-9+.-]*:/i.test(reference)
    ? (() => {
        const parsed = new URL(reference);
        return parsed.protocol === "https:" ? parsed.href : `${parsed.protocol}${reference.slice(reference.indexOf(":") + 1)}`;
      })()
    : reference;
  return normalized.normalize("NFC").replace(/%([0-9a-f]{2})/gi, (encoding, digits: string) => {
    const character = String.fromCharCode(Number.parseInt(digits, 16));
    return /^[A-Za-z0-9._~-]$/.test(character) ? character : encoding.toUpperCase();
  });
}

function sameMembers(actual: readonly string[], expected: readonly string[], label: string): void {
  unique(actual, label);
  const actualSet = new Set(actual);
  if (actual.length !== expected.length || expected.some((entry) => !actualSet.has(entry))) {
    throw new Error(`${label} must bind every declared role exactly once and no undeclared role`);
  }
}

function pairKey(first: string, second: string): string {
  return first < second ? `${first}\u0000${second}` : `${second}\u0000${first}`;
}

/** Reuse the strict duplicate-key/depth parser shared with semantic receipts. */
export function parseRelationalInferenceJson(source: string, label = "Relational inference JSON"): unknown {
  return parseSemanticTransitionJson(source, label);
}

/**
 * Validate structure and selected non-amplification invariants only.
 * No evidence is dereferenced and no epistemic or person-level verdict is made.
 */
export function validateRelationalInference(
  candidate: unknown,
  options: RelationalValidationOptions = {},
): asserts candidate is RelationalInferenceCase {
  rejectNonJsonAndForbiddenFields(candidate);
  const inferenceCase = record(candidate, "Relational inference case");
  exactKeys(inferenceCase, [
    "schema_version",
    "id",
    "issued_on",
    "state",
    "question",
    "pattern",
    "realizations",
    "translations",
    "probes",
    "probe_dependencies",
    "candidate_models",
    "inference",
    "boundaries",
    "harm_boundary",
    "repair",
    "safety",
  ], "Relational inference case");

  if (inferenceCase.schema_version !== RELATIONAL_INFERENCE_SCHEMA_VERSION) {
    throw new Error("Relational inference case schema_version is unsupported");
  }
  const caseId = identifier(inferenceCase.id, "Relational inference case id");
  const issuedOn = isoDate(inferenceCase.issued_on, "Relational inference case issued_on");
  const state = oneOf(inferenceCase.state, ["draft", "issued"] as const, "Relational inference case state");
  const asOf = options.asOf === undefined
    ? new Date().toISOString().slice(0, 10)
    : isoDate(options.asOf, "Relational inference validation asOf");
  if (state === "issued" && issuedOn > asOf) {
    throw new Error(`Issued relational inference case cannot be dated after validation asOf ${asOf}`);
  }

  const question = record(inferenceCase.question, "Relational inference question");
  exactKeys(question, ["text", "domain", "scope", "stakes", "intended_use", "non_goals"], "Relational inference question");
  text(question.text, "Relational inference question text");
  text(question.domain, "Relational inference question domain");
  text(question.scope, "Relational inference question scope");
  oneOf(question.stakes, ["low", "medium", "high"] as const, "Relational inference question stakes");
  text(question.intended_use, "Relational inference question intended_use");
  textArray(question.non_goals, "Relational inference question non_goals");

  const pattern = record(inferenceCase.pattern, "Relational inference pattern");
  exactKeys(pattern, ["id", "claim_type", "object_roles", "relation_roles", "constraints"], "Relational inference pattern");
  identifier(pattern.id, "Relational inference pattern id");
  oneOf(pattern.claim_type, RELATIONAL_PATTERN_CLAIM_TYPES, "Relational inference pattern claim_type");

  const objectRoleIds = array(pattern.object_roles, "Relational inference object_roles", 2, 32)
    .map((candidateRole, index) => {
      const role = record(candidateRole, `Relational inference object role ${index + 1}`);
      exactKeys(role, ["id", "type", "description"], `Relational inference object role ${index + 1}`);
      const id = identifier(role.id, `Relational inference object role ${index + 1} id`);
      text(role.type, `Relational inference object role ${id} type`);
      text(role.description, `Relational inference object role ${id} description`);
      return id;
    });
  unique(objectRoleIds, "Relational inference object role ids");
  const objectRoleSet = new Set(objectRoleIds);

  const relationRoleIds = array(pattern.relation_roles, "Relational inference relation_roles", 1, 32)
    .map((candidateRole, index) => {
      const role = record(candidateRole, `Relational inference relation role ${index + 1}`);
      exactKeys(role, ["id", "type", "sources", "targets", "description"], `Relational inference relation role ${index + 1}`);
      const id = identifier(role.id, `Relational inference relation role ${index + 1} id`);
      text(role.type, `Relational inference relation role ${id} type`);
      text(role.description, `Relational inference relation role ${id} description`);
      const sources = array(role.sources, `Relational inference relation role ${id} sources`, 1, 16)
        .map((source, sourceIndex) => identifier(source, `Relational inference relation role ${id} source ${sourceIndex + 1}`));
      const targets = array(role.targets, `Relational inference relation role ${id} targets`, 1, 16)
        .map((target, targetIndex) => identifier(target, `Relational inference relation role ${id} target ${targetIndex + 1}`));
      unique(sources, `Relational inference relation role ${id} sources`);
      unique(targets, `Relational inference relation role ${id} targets`);
      for (const roleId of [...sources, ...targets]) {
        if (!objectRoleSet.has(roleId)) {
          throw new Error(`Relational inference relation role ${id} references undeclared object role ${roleId}`);
        }
      }
      return id;
    });
  unique(relationRoleIds, "Relational inference relation role ids");
  const relationRoleSet = new Set(relationRoleIds);
  textArray(pattern.constraints, "Relational inference pattern constraints");

  const realizationIds = array(inferenceCase.realizations, "Relational inference realizations", 2, 16)
    .map((candidateRealization, index) => {
      const realization = record(candidateRealization, `Relational inference realization ${index + 1}`);
      exactKeys(realization, [
        "id", "domain", "context", "object_bindings", "relation_bindings", "known_omissions", "boundaries",
      ], `Relational inference realization ${index + 1}`);
      const id = identifier(realization.id, `Relational inference realization ${index + 1} id`);
      text(realization.domain, `Relational inference realization ${id} domain`);
      text(realization.context, `Relational inference realization ${id} context`);
      const validateBindings = (value: unknown, kind: "object" | "relation", expectedIds: readonly string[]) => {
        const bindings = array(value, `Relational inference realization ${id} ${kind}_bindings`, expectedIds.length, expectedIds.length)
          .map((candidateBinding, bindingIndex) => {
            const binding = record(candidateBinding, `Relational inference realization ${id} ${kind} binding ${bindingIndex + 1}`);
            exactKeys(binding, ["role_id", "binding"], `Relational inference realization ${id} ${kind} binding ${bindingIndex + 1}`);
            const roleId = identifier(binding.role_id, `Relational inference realization ${id} ${kind} binding ${bindingIndex + 1} role_id`);
            text(binding.binding, `Relational inference realization ${id} ${kind} binding ${roleId}`);
            return roleId;
          });
        sameMembers(bindings, expectedIds, `Relational inference realization ${id} ${kind} binding role_ids`);
      };
      validateBindings(realization.object_bindings, "object", objectRoleIds);
      validateBindings(realization.relation_bindings, "relation", relationRoleIds);
      textArray(realization.known_omissions, `Relational inference realization ${id} known_omissions`);
      text(realization.boundaries, `Relational inference realization ${id} boundaries`);
      return id;
    });
  unique(realizationIds, "Relational inference realization ids");
  const realizationIdSet = new Set(realizationIds);

  const incidentRealizationIds = new Set<string>();
  const translationIds = array(inferenceCase.translations, "Relational inference translations", 1, 32)
    .map((candidateTranslation, index) => {
      const translation = record(candidateTranslation, `Relational inference translation ${index + 1}`);
      exactKeys(translation, [
        "id", "source_realization_id", "target_realization_id", "kind", "preserved_relation_ids",
        "unpreserved_relation_ids", "tests",
        "known_losses", "introduced_assumptions", "counterexample", "stop_condition",
      ], `Relational inference translation ${index + 1}`);
      const id = identifier(translation.id, `Relational inference translation ${index + 1} id`);
      const sourceId = identifier(translation.source_realization_id, `Relational inference translation ${id} source_realization_id`);
      const targetId = identifier(translation.target_realization_id, `Relational inference translation ${id} target_realization_id`);
      if (!realizationIdSet.has(sourceId)) throw new Error(`Relational inference translation ${id} references missing source realization ${sourceId}`);
      if (!realizationIdSet.has(targetId)) throw new Error(`Relational inference translation ${id} references missing target realization ${targetId}`);
      if (sourceId === targetId) throw new Error(`Relational inference translation ${id} source and target must differ`);
      incidentRealizationIds.add(sourceId);
      incidentRealizationIds.add(targetId);
      oneOf(translation.kind, RELATIONAL_TRANSLATION_KINDS, `Relational inference translation ${id} kind`);

      const preservedIds = array(translation.preserved_relation_ids, `Relational inference translation ${id} preserved_relation_ids`, 0, 32)
        .map((roleId, roleIndex) => identifier(roleId, `Relational inference translation ${id} preserved relation ${roleIndex + 1}`));
      unique(preservedIds, `Relational inference translation ${id} preserved_relation_ids`);
      for (const roleId of preservedIds) {
        if (!relationRoleSet.has(roleId)) throw new Error(`Relational inference translation ${id} preserves undeclared relation role ${roleId}`);
      }
      const unpreservedIds = array(
        translation.unpreserved_relation_ids,
        `Relational inference translation ${id} unpreserved_relation_ids`,
        0,
        32,
      ).map((roleId, roleIndex) =>
        identifier(roleId, `Relational inference translation ${id} unpreserved relation ${roleIndex + 1}`));
      unique(unpreservedIds, `Relational inference translation ${id} unpreserved_relation_ids`);
      for (const roleId of unpreservedIds) {
        if (!relationRoleSet.has(roleId)) {
          throw new Error(`Relational inference translation ${id} marks undeclared relation role ${roleId} unpreserved`);
        }
      }
      const relationPartition = [...preservedIds, ...unpreservedIds];
      unique(relationPartition, `Relational inference translation ${id} preserved/unpreserved relation partition`);
      if (relationPartition.length !== relationRoleIds.length ||
          relationRoleIds.some((roleId) => !relationPartition.includes(roleId))) {
        throw new Error(`Relational inference translation ${id} preserved and unpreserved relation ids must cover every relation role exactly once`);
      }

      const testIds = array(translation.tests, `Relational inference translation ${id} tests`, 1, 32)
        .map((candidateTest, testIndex) => {
          const test = record(candidateTest, `Relational inference translation ${id} test ${testIndex + 1}`);
          exactKeys(test, ["id", "method", "acceptance", "result"], `Relational inference translation ${id} test ${testIndex + 1}`);
          const testId = identifier(test.id, `Relational inference translation ${id} test ${testIndex + 1} id`);
          text(test.method, `Relational inference translation ${id} test ${testId} method`);
          text(test.acceptance, `Relational inference translation ${id} test ${testId} acceptance`);
          oneOf(test.result, RELATIONAL_TRANSLATION_TEST_RESULTS, `Relational inference translation ${id} test ${testId} result`);
          return testId;
        });
      unique(testIds, `Relational inference translation ${id} test ids`);

      const lossNames = array(translation.known_losses, `Relational inference translation ${id} known_losses`, 0, 32)
        .map((candidateLoss, lossIndex) => {
          const loss = record(candidateLoss, `Relational inference translation ${id} loss ${lossIndex + 1}`);
          exactKeys(loss, ["name", "effect", "disclosed"], `Relational inference translation ${id} loss ${lossIndex + 1}`);
          const name = identifier(loss.name, `Relational inference translation ${id} loss ${lossIndex + 1} name`);
          text(loss.effect, `Relational inference translation ${id} loss ${name} effect`);
          if (loss.disclosed !== true) throw new Error(`Relational inference translation ${id} loss ${name} must be disclosed`);
          return name;
        });
      unique(lossNames, `Relational inference translation ${id} loss names`);
      if (unpreservedIds.length > 0 && lossNames.length === 0) {
        throw new Error(`Relational inference translation ${id} must disclose at least one known loss when relation roles are unpreserved`);
      }
      textArray(translation.introduced_assumptions, `Relational inference translation ${id} introduced_assumptions`, 0, 32);
      text(translation.counterexample, `Relational inference translation ${id} counterexample`);
      text(translation.stop_condition, `Relational inference translation ${id} stop_condition`);
      return id;
    });
  unique(translationIds, "Relational inference translation ids");
  for (const realizationId of realizationIds) {
    if (!incidentRealizationIds.has(realizationId)) {
      throw new Error(`Relational inference realization ${realizationId} must be incident to at least one translation`);
    }
  }

  const probes = array(inferenceCase.probes, "Relational inference probes", 2, 32)
    .map((candidateProbe, index): RelationalProbe => {
      const probe = record(candidateProbe, `Relational inference probe ${index + 1}`);
      exactKeys(probe, [
        "id", "kind", "description", "context", "scale", "sensitivity_scope", "backgrounds",
        "selection_effects", "shared_factors", "source_ref", "observed_on", "epistemic_access", "run_status",
        "result", "limitations",
      ], `Relational inference probe ${index + 1}`);
      const id = identifier(probe.id, `Relational inference probe ${index + 1} id`);
      const kind = oneOf(probe.kind, RELATIONAL_PROBE_KINDS, `Relational inference probe ${id} kind`);
      const description = text(probe.description, `Relational inference probe ${id} description`);
      const context = text(probe.context, `Relational inference probe ${id} context`);
      const scale = text(probe.scale, `Relational inference probe ${id} scale`);
      const sensitivityScope = text(probe.sensitivity_scope, `Relational inference probe ${id} sensitivity_scope`);
      const backgrounds = textArray(probe.backgrounds, `Relational inference probe ${id} backgrounds`);
      const selectionEffects = textArray(probe.selection_effects, `Relational inference probe ${id} selection_effects`);
      const sharedFactors = array(probe.shared_factors, `Relational inference probe ${id} shared_factors`, 1, 32)
        .map((factor, factorIndex) => identifier(
          factor,
          `Relational inference probe ${id} shared_factor ${factorIndex + 1}`,
        ));
      unique(sharedFactors, `Relational inference probe ${id} shared_factors`);
      const sourceRef = probe.source_ref === null ? null : evidenceReference(probe.source_ref, `Relational inference probe ${id} source_ref`);
      const observedOn = probe.observed_on === null ? null : isoDate(probe.observed_on, `Relational inference probe ${id} observed_on`);
      if (observedOn !== null && observedOn > issuedOn) throw new Error(`Relational inference probe ${id} cannot be observed after issuance`);
      if (observedOn !== null && observedOn > asOf) throw new Error(`Relational inference probe ${id} cannot be observed after validation asOf ${asOf}`);
      const access = oneOf(probe.epistemic_access, RELATIONAL_EPISTEMIC_ACCESS, `Relational inference probe ${id} epistemic_access`);
      const runStatus = oneOf(probe.run_status, RELATIONAL_PROBE_RUN_STATUSES, `Relational inference probe ${id} run_status`);
      if (runStatus === "not-run" && (sourceRef !== null || observedOn !== null || access !== "unknown")) {
        throw new Error(`Relational inference probe ${id} not-run status requires null source_ref, null observed_on, and unknown access`);
      }
      if (runStatus !== "not-run" && (sourceRef === null || observedOn === null || access === "unknown")) {
        throw new Error(`Relational inference probe ${id} completed or inconclusive status requires source_ref, observed_on, and non-unknown access`);
      }
      const result = text(probe.result, `Relational inference probe ${id} result`);
      const limitations = textArray(probe.limitations, `Relational inference probe ${id} limitations`);
      return {
        id,
        kind,
        description,
        context,
        scale,
        sensitivity_scope: sensitivityScope,
        backgrounds,
        selection_effects: selectionEffects,
        shared_factors: sharedFactors,
        source_ref: sourceRef,
        observed_on: observedOn,
        epistemic_access: access,
        run_status: runStatus,
        result,
        limitations,
      };
    });
  unique(probes.map((probe) => probe.id), "Relational inference probe ids");
  const probesById = new Map(probes.map((probe) => [probe.id, probe]));

  const dependencies = array(
    inferenceCase.probe_dependencies,
    "Relational inference probe_dependencies",
    1,
    496,
  ).map((candidateDependency, index): RelationalProbeDependency => {
    const dependency = record(candidateDependency, `Relational inference probe dependency ${index + 1}`);
    exactKeys(dependency, ["probe_ids", "relationship", "basis"], `Relational inference probe dependency ${index + 1}`);
    const probeIds = array(dependency.probe_ids, `Relational inference probe dependency ${index + 1} probe_ids`, 2, 2)
      .map((probeId, probeIndex) => identifier(probeId, `Relational inference probe dependency ${index + 1} probe_id ${probeIndex + 1}`)) as [string, string];
    if (probeIds[0] === probeIds[1]) throw new Error(`Relational inference probe dependency ${index + 1} cannot pair a probe with itself`);
    for (const probeId of probeIds) {
      if (!probesById.has(probeId)) throw new Error(`Relational inference probe dependency ${index + 1} references missing probe ${probeId}`);
    }
    const relationship = oneOf(
      dependency.relationship,
      RELATIONAL_PROBE_DEPENDENCIES,
      `Relational inference probe dependency ${index + 1} relationship`,
    );
    text(dependency.basis, `Relational inference probe dependency ${index + 1} basis`);
    const [first, second] = probeIds.map((probeId) => probesById.get(probeId)!);
    const firstFactors = new Set(first.shared_factors);
    const sharedFactorIntersection = second.shared_factors
      .filter((factor) => firstFactors.has(factor));
    if (relationship === "independent") {
      if (sharedFactorIntersection.length > 0) {
        throw new Error(`Relational inference probes ${probeIds.join(" and ")} share a declared factor and cannot be declared independent`);
      }
      if (first.source_ref !== null && second.source_ref !== null &&
          canonicalReferenceAlias(first.source_ref) === canonicalReferenceAlias(second.source_ref)) {
        throw new Error(`Relational inference probes ${probeIds.join(" and ")} use the same or canonically aliased source_ref and cannot be declared independent`);
      }
    }
    if (["partially-shared", "shared-systematic"].includes(relationship) && sharedFactorIntersection.length === 0) {
      throw new Error(`Relational inference probes ${probeIds.join(" and ")} declared ${relationship} must name at least one shared factor`);
    }
    return { probe_ids: probeIds, relationship, basis: dependency.basis as string };
  });

  const dependencyByPair = new Map<string, RelationalProbeDependency>();
  for (const dependency of dependencies) {
    const key = pairKey(dependency.probe_ids[0], dependency.probe_ids[1]);
    if (dependencyByPair.has(key)) throw new Error(`Relational inference probe dependency pair ${dependency.probe_ids.join(" / ")} is duplicated`);
    dependencyByPair.set(key, dependency);
  }
  const expectedDependencyCount = probes.length * (probes.length - 1) / 2;
  if (dependencies.length !== expectedDependencyCount) {
    throw new Error(`Relational inference probe_dependencies must cover all ${expectedDependencyCount} unordered probe pairs exactly once`);
  }
  for (let first = 0; first < probes.length; first++) {
    for (let second = first + 1; second < probes.length; second++) {
      if (!dependencyByPair.has(pairKey(probes[first].id, probes[second].id))) {
        throw new Error(`Relational inference probe_dependencies is missing pair ${probes[first].id} / ${probes[second].id}`);
      }
    }
  }

  const candidateModels = array(inferenceCase.candidate_models, "Relational inference candidate_models", 2, 16)
    .map((candidateModel, index): RelationalCandidateModel => {
      const model = record(candidateModel, `Relational inference candidate model ${index + 1}`);
      exactKeys(model, [
        "id", "role", "description", "assumptions", "probe_assessments",
        "falsifier_or_refinement_condition", "status",
      ], `Relational inference candidate model ${index + 1}`);
      const id = identifier(model.id, `Relational inference candidate model ${index + 1} id`);
      const role = oneOf(model.role, RELATIONAL_MODEL_ROLES, `Relational inference candidate model ${id} role`);
      text(model.description, `Relational inference candidate model ${id} description`);
      const assumptions = textArray(model.assumptions, `Relational inference candidate model ${id} assumptions`);
      const assessments = array(
        model.probe_assessments,
        `Relational inference candidate model ${id} probe_assessments`,
        probes.length,
        probes.length,
      ).map((candidateAssessment, assessmentIndex): RelationalProbeAssessment => {
        const assessment = record(candidateAssessment, `Relational inference candidate model ${id} assessment ${assessmentIndex + 1}`);
        exactKeys(assessment, ["probe_id", "expectation", "result", "residual"], `Relational inference candidate model ${id} assessment ${assessmentIndex + 1}`);
        const probeId = identifier(assessment.probe_id, `Relational inference candidate model ${id} assessment ${assessmentIndex + 1} probe_id`);
        if (!probesById.has(probeId)) throw new Error(`Relational inference candidate model ${id} assessment references missing probe ${probeId}`);
        text(assessment.expectation, `Relational inference candidate model ${id} assessment ${probeId} expectation`);
        const result = oneOf(
          assessment.result,
          RELATIONAL_PROBE_ASSESSMENT_RESULTS,
          `Relational inference candidate model ${id} assessment ${probeId} result`,
        );
        text(assessment.residual, `Relational inference candidate model ${id} assessment ${probeId} residual`);
        if (probesById.get(probeId)!.run_status === "not-run" && result !== "unassessed") {
          throw new Error(`Relational inference candidate model ${id} must leave not-run probe ${probeId} unassessed`);
        }
        return { probe_id: probeId, expectation: assessment.expectation as string, result, residual: assessment.residual as string };
      });
      sameMembers(
        assessments.map((assessment) => assessment.probe_id),
        probes.map((probe) => probe.id),
        `Relational inference candidate model ${id} assessment probe_ids`,
      );
      const falsifierOrRefinementCondition = text(
        model.falsifier_or_refinement_condition,
        `Relational inference candidate model ${id} falsifier_or_refinement_condition`,
      );
      const status = oneOf(model.status, RELATIONAL_MODEL_STATUSES, `Relational inference candidate model ${id} status`);
      const allUnassessed = assessments.every((assessment) => assessment.result === "unassessed");
      if ((status === "unassessed") !== allUnassessed) {
        throw new Error(`Relational inference candidate model ${id} status must be unassessed if and only if every assessment is unassessed`);
      }
      const nonUnassessed = assessments.filter((assessment) => assessment.result !== "unassessed");
      if (status === "live" &&
          (!nonUnassessed.some((assessment) => assessment.result === "compatible") ||
           nonUnassessed.every((assessment) => assessment.result === "contradicted-under-test"))) {
        throw new Error(`Relational inference candidate model ${id} live status requires a compatible non-unassessed assessment and cannot have every assessed probe contradicted`);
      }
      if (status === "constrained" &&
          !assessments.some((assessment) => ["tension", "contradicted-under-test"].includes(assessment.result))) {
        throw new Error(`Relational inference candidate model ${id} constrained status requires a tension or contradicted assessment`);
      }
      if (status === "contradicted-under-test" && !assessments.some((assessment) => assessment.result === "contradicted-under-test")) {
        throw new Error(`Relational inference candidate model ${id} contradicted status requires a contradicted assessment`);
      }
      return {
        id,
        role,
        description: model.description as string,
        assumptions,
        probe_assessments: assessments,
        falsifier_or_refinement_condition: falsifierOrRefinementCondition,
        status,
      };
    });
  unique(candidateModels.map((model) => model.id), "Relational inference candidate model ids");
  if (!candidateModels.some((model) =>
    model.role !== "working" && ["live", "constrained", "unassessed"].includes(model.status))) {
    throw new Error("Relational inference requires at least one non-working unresolved alternative, null, or unknown model");
  }

  const inference = record(inferenceCase.inference, "Relational inference conclusion");
  exactKeys(inference, [
    "method", "comparison_space", "current_conclusion", "conclusion_status", "declared_confidence",
    "confidence_basis", "unmodeled_alternatives", "next_discriminating_test", "stop_condition",
  ], "Relational inference conclusion");
  text(inference.method, "Relational inference method");
  text(inference.comparison_space, "Relational inference comparison_space");
  text(inference.current_conclusion, "Relational inference current_conclusion");
  const conclusionStatus = oneOf(
    inference.conclusion_status,
    RELATIONAL_CONCLUSION_STATUSES,
    "Relational inference conclusion_status",
  );
  const confidence = oneOf(inference.declared_confidence, RELATIONAL_CONFIDENCE_LEVELS, "Relational inference declared_confidence");
  text(inference.confidence_basis, "Relational inference confidence_basis");
  textArray(inference.unmodeled_alternatives, "Relational inference unmodeled_alternatives");
  text(inference.next_discriminating_test, "Relational inference next_discriminating_test");
  text(inference.stop_condition, "Relational inference stop_condition");

  const completedProbeIds = new Set(
    probes.filter((probe) => probe.run_status === "completed").map((probe) => probe.id),
  );
  const assessedCompletedByModel = new Map(candidateModels.map((model) => [
    model.id,
    new Set(model.probe_assessments
      .filter((assessment) =>
        assessment.result !== "unassessed" && completedProbeIds.has(assessment.probe_id))
      .map((assessment) => assessment.probe_id)),
  ]));
  if (conclusionStatus === "model-contrast") {
    const contrastedCommonProbe = [...completedProbeIds].some((probeId) =>
      [...assessedCompletedByModel.values()].filter((probeIds) => probeIds.has(probeId)).length >= 2,
    );
    if (!contrastedCommonProbe) {
      throw new Error("Model-contrast conclusion requires at least two candidate models assessed on one common completed probe; planned or unassessed contrasts are not conclusions");
    }
  }
  if (confidence === "medium") {
    const requiredModelCount = conclusionStatus === "model-contrast" ? 2 : 1;
    const sufficientPair = [...dependencyByPair.values()].some((dependency) => {
      if (!["independent", "partially-shared"].includes(dependency.relationship)) return false;
      const modelsAssessingBoth = [...assessedCompletedByModel.values()].filter((probeIds) =>
        probeIds.has(dependency.probe_ids[0]) && probeIds.has(dependency.probe_ids[1]));
      return modelsAssessingBoth.length >= requiredModelCount;
    });
    if (!sufficientPair) {
      throw new Error(`Medium declared confidence requires one sufficiently separated completed probe pair assessed within the same ${conclusionStatus === "model-contrast" ? "two candidate models" : "candidate model"}; the dependency and assessment declarations are not verified`);
    }
  }

  const boundaries = record(inferenceCase.boundaries, "Relational inference boundaries");
  exactKeys(boundaries, [
    "representation_scope", "privacy", "actionability", "authority_scope", "authority_basis", "authority_ref",
    "consent_status", "consent_subject", "consent_scope", "consent_basis", "consent_ref",
  ], "Relational inference boundaries");
  oneOf(
    boundaries.representation_scope,
    ["none", "artifact-public"] as const,
    "Relational inference representation_scope",
  );
  oneOf(
    boundaries.privacy,
    ["public-only", "redacted"] as const,
    "Relational inference privacy",
  );
  if (boundaries.actionability !== "descriptive") {
    throw new Error("Relational inference actionability must remain descriptive");
  }
  if (boundaries.consent_status !== "not-applicable") {
    throw new Error("Relational inference consent_status must remain not-applicable");
  }
  const provenanceKeys = [
    "authority_scope",
    "authority_basis",
    "authority_ref",
    "consent_subject",
    "consent_scope",
    "consent_basis",
    "consent_ref",
  ] as const;
  for (const key of provenanceKeys) {
    if (boundaries[key] !== null) {
      throw new Error(`Relational inference boundaries ${key} must remain null in the public descriptive v0.1 contract`);
    }
  }

  const harm = record(inferenceCase.harm_boundary, "Relational inference harm_boundary");
  exactKeys(harm, [
    "observable_effect", "causal_status", "duty_status", "intent_status", "affected_relations", "next_repair_action",
    "unobserved_is_not_deception", "privacy_is_not_deception", "protective_nondisclosure_may_be_permissible",
  ], "Relational inference harm_boundary");
  text(harm.observable_effect, "Relational inference harm observable_effect");
  oneOf(
    harm.causal_status,
    ["none-observed", "possible", "unknown"] as const,
    "Relational inference harm causal_status",
  );
  oneOf(
    harm.duty_status,
    ["not-assessed", "external-process-required"] as const,
    "Relational inference harm duty_status",
  );
  if (harm.intent_status !== "not-assessed") throw new Error("Relational inference harm intent_status must remain not-assessed");
  textArray(harm.affected_relations, "Relational inference harm affected_relations");
  text(harm.next_repair_action, "Relational inference harm next_repair_action");
  for (const key of [
    "unobserved_is_not_deception",
    "privacy_is_not_deception",
    "protective_nondisclosure_may_be_permissible",
  ] as const) {
    if (harm[key] !== true) throw new Error(`Relational inference harm ${key} must remain true`);
  }
  const repair = record(inferenceCase.repair, "Relational inference repair");
  exactKeys(repair, [
    "relation", "target_case_id", "reply_route", "correction_route", "carry_challenges_forward",
    "retain_prior_nonsensitive_case",
  ], "Relational inference repair");
  const repairRelation = oneOf(
    repair.relation,
    ["original", "corrects", "supersedes", "withdraws"] as const,
    "Relational inference repair relation",
  );
  const targetCaseId = repair.target_case_id === null
    ? null
    : identifier(repair.target_case_id, "Relational inference repair target_case_id");
  if ((repairRelation === "original") !== (targetCaseId === null)) {
    throw new Error("An original case must have a null target; a repair case must name a target case identifier");
  }
  if (targetCaseId === caseId) throw new Error("A relational inference case cannot repair itself");
  text(repair.reply_route, "Relational inference repair reply_route");
  text(repair.correction_route, "Relational inference repair correction_route");
  if (repair.carry_challenges_forward !== true) {
    throw new Error("Relational inference repair must carry material challenges forward");
  }
  if (repair.retain_prior_nonsensitive_case !== true) {
    throw new Error("Relational inference repair must retain the prior non-sensitive case");
  }

  const safety = record(inferenceCase.safety, "Relational inference safety");
  const safetyKeys = [
    "proves_truth",
    "proves_hidden_cause",
    "proves_causation",
    "proves_fidelity",
    "proves_identity",
    "proves_understanding",
    "infers_intent",
    "labels_deception",
    "rates_people",
    "grants_authority",
    "grants_consent",
    "permits_surveillance",
  ] as const;
  exactKeys(safety, safetyKeys, "Relational inference safety");
  for (const key of safetyKeys) {
    if (safety[key] !== false) throw new Error(`Relational inference safety ${key} must remain false`);
  }
}

export function validateRelationalInferenceFile(
  path: string,
  options: RelationalValidationOptions = {},
): RelationalInferenceCase {
  let candidate: unknown;
  try {
    candidate = parseRelationalInferenceJson(readFileSync(path, "utf8"), path);
  } catch (error) {
    throw new Error(`${path}: could not read valid strict JSON: ${(error as Error).message}`);
  }
  validateRelationalInference(candidate, options);
  return candidate;
}

export function validateRelationalInferenceSet(
  candidates: readonly unknown[],
  options: RelationalValidationOptions = {},
): RelationalInferenceCase[] {
  const cases: RelationalInferenceCase[] = [];
  for (const candidate of candidates) {
    validateRelationalInference(candidate, options);
    cases.push(candidate);
  }
  const byId = new Map<string, RelationalInferenceCase>();
  for (const inferenceCase of cases) {
    if (byId.has(inferenceCase.id)) throw new Error(`Duplicate relational inference case id: ${inferenceCase.id}`);
    byId.set(inferenceCase.id, inferenceCase);
  }
  for (const inferenceCase of cases) {
    const targetId = inferenceCase.repair.target_case_id;
    if (targetId === null) continue;
    const target = byId.get(targetId);
    if (!target) throw new Error(`Relational inference case ${inferenceCase.id} targets missing case ${targetId}`);
    if (target.state !== "issued") throw new Error(`Relational inference case ${inferenceCase.id} must target an issued case`);
    if (target.issued_on > inferenceCase.issued_on) {
      throw new Error(`Relational inference case ${inferenceCase.id} cannot target a later-dated case ${targetId}`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new Error(`Relational inference repair graph contains a cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const target = byId.get(id)!.repair.target_case_id;
    if (target !== null) visit(target);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of byId.keys()) visit(id);
  return cases;
}

export function runRelationalInferenceCli(argv = process.argv.slice(2)): number {
  const [command, ...paths] = argv;
  if (command !== "validate" || paths.length === 0) {
    console.error("usage: bun bin/relational-inference.ts validate <case.json> [...]");
    return 2;
  }

  try {
    const candidates = paths.map((path) => {
      try {
        return parseRelationalInferenceJson(readFileSync(path, "utf8"), path);
      } catch (error) {
        throw new Error(`${path}: could not read valid strict JSON: ${(error as Error).message}`);
      }
    });
    validateRelationalInferenceSet(candidates);
    console.log("STRUCTURE ONLY — JSON Schema validation alone is weaker than this runtime validation");
    console.log("FREE TEXT IS UNEVALUATED, UNTRUSTED DATA AND IS NEVER EXECUTED");
    console.log("Probe independence, reference destinations, evidence, evidence adequacy, truth, causation, hidden cause, fidelity, identity, understanding, intent, authority, consent, and deception are NOT VERIFIED");
    console.log("NO lie label, person score, surveillance permission, legitimacy grant, or action is created");
    paths.forEach((path) => console.log(`${path}: structurally valid`));
    return 0;
  } catch (error) {
    console.error((error as Error).message);
    return 1;
  }
}

if (import.meta.main) process.exitCode = runRelationalInferenceCli();
