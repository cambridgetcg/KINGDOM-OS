#!/usr/bin/env bun
/**
 * Strict build-time reader and server-renderer for the Research Trial Chamber.
 *
 * This module has no network or execution path. It projects one checked-in,
 * read-only planning snapshot into public discovery surfaces. A referral is not
 * a claim, an assisted request draft is not a plan, and an unsealed draft plan
 * grants no later gate, capability, approval, adoption, or use authority.
 */

import { createHash } from "node:crypto";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { readRegularFileWithinRoot } from "./immutable-publications.ts";
import { parseStrictJsonBytes } from "./principality.ts";
import { loadResearchObservatoryPublication } from "./research-observatory.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const TRIAL_CHAMBER_PROTOCOL = "kingdom.trial-chamber-publication/0.1";
export const TRIAL_CHAMBER_LOCATOR = "data/trials/research-trial-chamber.v0.1.json";
export const TRIAL_CHAMBER_PAGE_LOCATOR = "site/trial-chamber/index.html";
export const TRIAL_CHAMBER_ALIAS_LOCATOR = "site/trials.json";
export const TRIAL_CHAMBER_URL = "https://thekingdom.dev/trial-chamber/";
export const TRIAL_CHAMBER_ALIAS_URL = "https://thekingdom.dev/trials.json";
export const TRIAL_CHAMBER_CANONICAL_URL = "https://thekingdom.dev/trials/research-trial-chamber-2026-08-20.json";
export const TRIAL_CHAMBER_GUIDE_LOCATOR = "references/trial-chamber-v0.1.md";
export const TRIAL_CHAMBER_GUIDE_URL = "https://thekingdom.dev/TRIAL-CHAMBER-v0.1.md";
export const TRIAL_CHAMBER_PRODUCER_URL = "https://github.com/cambridgetcg/kingdom-trials/tree/v0.1.1";

export const TRIAL_CHAMBER_SCHEMA_NAMES = Object.freeze([
  "public-snapshot",
  "referral",
  "evaluation-request",
  "evaluation-plan",
  "preflight",
  "trial-authority",
  "trial-run",
  "evaluation-result",
  "adoption-record",
  "use-authority",
] as const);

export type TrialChamberSchemaName = typeof TRIAL_CHAMBER_SCHEMA_NAMES[number];

export const TRIAL_CHAMBER_SCHEMA_LOCATORS = Object.freeze(
  Object.fromEntries(TRIAL_CHAMBER_SCHEMA_NAMES.map((name) => [
    name,
    `schemas/trial-chamber/v0.1/${name}.schema.json`,
  ])) as Record<TrialChamberSchemaName, string>,
);

export const TRIAL_CHAMBER_SCHEMA_URLS = Object.freeze(
  Object.fromEntries(TRIAL_CHAMBER_SCHEMA_NAMES.map((name) => [
    name,
    `https://thekingdom.dev/trials/schemas/v0.1/${name}.schema.json`,
  ])) as Record<TrialChamberSchemaName, string>,
);

export const TRIAL_CHAMBER_BOUNDARY = Object.freeze({
  phase: 0,
  build_network_used: false,
  full_text_included: false,
  metadata_titles_are_scientific_claims: false,
  artifact_acquisition_performed: false,
  artifact_execution_performed: false,
  preflight_performed: false,
  trial_authority_issued: false,
  trial_run_recorded: false,
  evaluation_result_recorded: false,
  adoption_recorded: false,
  use_authority_issued: false,
  module_created: false,
  guest_admitted: false,
  credential_accessed: false,
  signature_created: false,
  scalar_score_used: false,
  automatic_action: false,
});

const EXPECTED_COUNTS = Object.freeze({
  referrals: 4,
  evaluationRequests: 3,
  evaluationPlans: 3,
  preflights: 0,
  trialAuthorities: 0,
  trialRuns: 0,
  evaluationResults: 0,
  adoptionRecords: 0,
  useAuthorities: 0,
});
const EXPECTED_URLS = Object.freeze({
  canonical: TRIAL_CHAMBER_CANONICAL_URL,
  current: TRIAL_CHAMBER_ALIAS_URL,
  guide: TRIAL_CHAMBER_GUIDE_URL,
  human: TRIAL_CHAMBER_URL,
  producer: TRIAL_CHAMBER_PRODUCER_URL,
});
const EXPECTED_OBSERVATORY_BINDING = Object.freeze({
  captureSetReceipt: "sha256:68a69dc390aa34133cadc8807ed33ddd1fae72e7e99706cf714d72698d071f7f",
  snapshotAsOf: "2026-08-20T18:10:14Z",
  snapshotByteSha256: "sha256:d7da3f38de019dc0f2c45f477740222527f156d8a4d3f6a2e22aced67b282a94",
  snapshotCanonicalReceipt: "sha256:17c487aa03f8427fc324b8da34dedbc00db76362be78620bde3a8d075e3942cd",
  snapshotUrl: "https://thekingdom.dev/research.json",
});
const EXPECTED_NEGATIVE_BOUNDARIES = Object.freeze({
  adoptionRecorded: false,
  automaticAction: false,
  artifactAcquisitionPerformed: false,
  artifactExecutionPerformed: false,
  buildNetworkUsed: false,
  credentialAccessed: false,
  evaluationResultRecorded: false,
  fullTextIncluded: false,
  guestAdmitted: false,
  metadataTitlesAreScientificClaims: false,
  moduleCreated: false,
  preflightPerformed: false,
  scalarScoreUsed: false,
  signatureCreated: false,
  trialAuthorityIssued: false,
  trialRunRecorded: false,
  useAuthorityIssued: false,
});
const EXPECTED_PLAN_RESOURCE_FALSE_KEYS = Object.freeze([
  "artifactFetch", "credentials", "network", "persistentWrites", "personalData", "shell",
] as const);
const LATER_GATE_KEYS = Object.freeze([
  "preflights", "trialAuthorities", "trialRuns", "evaluationResults",
  "adoptionRecords", "useAuthorities",
] as const);
const MAX_SNAPSHOT_BYTES = 1024 * 1024;
const MAX_SCHEMA_BYTES = 256 * 1024;
const MAX_TREE_DEPTH = 32;
const MAX_TREE_NODES = 100_000;
const MAX_STRING_CODE_UNITS = 750_000;
const MAX_ARRAY_ITEMS = 1024;

type JsonObject = Record<string, any>;
type SchemaRegistry = Map<string, JsonObject>;

function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (object(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  throw new Error("Trial Chamber value is not JSON");
}

function sameJson(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function schemaTypeMatches(value: unknown, type: string): boolean {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return object(value);
  if (type === "integer") return Number.isSafeInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function validSchemaDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  return instant.getUTCFullYear() === year && instant.getUTCMonth() === month - 1 && instant.getUTCDate() === day;
}

function validSchemaDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace(".000Z", "Z") === value;
}

function validSchemaUri(value: string): boolean {
  try {
    return new URL(value).href === value;
  } catch {
    return false;
  }
}

function schemaFormatMatches(value: string, format: unknown): boolean {
  if (format === "date") return validSchemaDate(value);
  if (format === "date-time") return validSchemaDateTime(value);
  if (format === "uri") return validSchemaUri(value);
  return true;
}

function schemaPointer(root: JsonObject, fragment: string): unknown {
  if (!fragment || fragment === "#") return root;
  if (!fragment.startsWith("#/")) throw new Error(`unsupported Trial Chamber schema fragment ${fragment}`);
  let current: unknown = root;
  for (const raw of fragment.slice(2).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!object(current) || !Object.hasOwn(current, key)) {
      throw new Error(`unresolved Trial Chamber schema fragment ${fragment}`);
    }
    current = current[key];
  }
  return current;
}

function resolveSchemaReference(reference: string, root: JsonObject, registry: SchemaRegistry) {
  const hash = reference.indexOf("#");
  const document = hash < 0 ? reference : reference.slice(0, hash);
  const fragment = hash < 0 ? "" : reference.slice(hash);
  const targetRoot = document ? registry.get(document) ?? registry.get(basename(document)) : root;
  if (!targetRoot) throw new Error(`unresolved Trial Chamber schema reference ${reference}`);
  return { schema: schemaPointer(targetRoot, fragment), root: targetRoot };
}

function schemaIssues(
  value: unknown,
  schema: unknown,
  path: string,
  root: JsonObject,
  registry: SchemaRegistry,
  depth = 0,
): string[] {
  if (depth > 64) return [`${path}: schema nesting exceeds 64`];
  if (schema === true) return [];
  if (schema === false) return [`${path}: value is forbidden`];
  if (!object(schema)) return [`${path}: invalid schema node`];
  if (typeof schema.$ref === "string") {
    const resolved = resolveSchemaReference(schema.$ref, root, registry);
    return schemaIssues(value, resolved.schema, path, resolved.root, registry, depth + 1);
  }
  const issues: string[] = [];
  if (Object.hasOwn(schema, "const") && !sameJson(value, schema.const)) issues.push(`${path}: must equal declared constant`);
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => sameJson(candidate, value))) {
    issues.push(`${path}: value is outside enum`);
  }
  for (const keyword of ["allOf", "anyOf", "oneOf"] as const) {
    if (!Array.isArray(schema[keyword])) continue;
    const branches = schema[keyword].map((branch: unknown) => schemaIssues(value, branch, path, root, registry, depth + 1));
    const matches = branches.filter((branch: string[]) => branch.length === 0).length;
    if ((keyword === "allOf" && matches !== branches.length) || (keyword === "anyOf" && matches === 0) ||
        (keyword === "oneOf" && matches !== 1)) issues.push(`${path}: does not satisfy ${keyword}`);
  }
  if (schema.not !== undefined && schemaIssues(value, schema.not, path, root, registry, depth + 1).length === 0) {
    issues.push(`${path}: matches forbidden not schema`);
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type: string) => schemaTypeMatches(value, type))) {
      issues.push(`${path}: expected ${types.join("|")}`);
      return issues;
    }
  }
  if (typeof value === "string") {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) issues.push(`${path}: string is too short`);
    if (schema.maxLength !== undefined && length > schema.maxLength) issues.push(`${path}: string is too long`);
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern, "u").test(value)) {
      issues.push(`${path}: string does not match pattern`);
    }
    if (typeof schema.format === "string" && !schemaFormatMatches(value, schema.format)) {
      issues.push(`${path}: string does not match ${schema.format} format`);
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) issues.push(`${path}: number is below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) issues.push(`${path}: number is above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) issues.push(`${path}: array has too few items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) issues.push(`${path}: array has too many items`);
    if (schema.uniqueItems === true && new Set(value.map(canonicalJson)).size !== value.length) {
      issues.push(`${path}: array items must be unique`);
    }
    if (schema.items !== undefined) value.forEach((entry, index) => {
      issues.push(...schemaIssues(entry, schema.items, `${path}/${index}`, root, registry, depth + 1));
    });
  }
  if (object(value)) {
    const properties = object(schema.properties) ? schema.properties : {};
    for (const required of Array.isArray(schema.required) ? schema.required : []) {
      if (!Object.hasOwn(value, required)) issues.push(`${path}/${required}: required property is missing`);
    }
    for (const [key, entry] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) {
        issues.push(...schemaIssues(entry, properties[key], `${path}/${key}`, root, registry, depth + 1));
      } else if (schema.additionalProperties === false) {
        issues.push(`${path}/${key}: additional property is forbidden`);
      } else if (object(schema.additionalProperties)) {
        issues.push(...schemaIssues(entry, schema.additionalProperties, `${path}/${key}`, root, registry, depth + 1));
      }
    }
  }
  return issues;
}

function loadTrialSchemaRegistry(): SchemaRegistry {
  const registry: SchemaRegistry = new Map();
  for (const name of TRIAL_CHAMBER_SCHEMA_NAMES) {
    const bytes = readRegularFileWithinRoot(ROOT, TRIAL_CHAMBER_SCHEMA_LOCATORS[name]);
    if (bytes.byteLength > MAX_SCHEMA_BYTES) throw new Error(`Trial Chamber ${name} schema exceeds ${MAX_SCHEMA_BYTES} bytes`);
    const schema = parseStrictJsonBytes(bytes, `Trial Chamber ${name} schema`);
    if (!object(schema) || schema.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
        schema.$id !== TRIAL_CHAMBER_SCHEMA_URLS[name]) {
      throw new Error(`Trial Chamber ${name} schema identity drifted`);
    }
    registry.set(`${name}.schema.json`, schema);
    registry.set(schema.$id, schema);
  }
  return registry;
}

export function trialChamberSchemaIssues(name: TrialChamberSchemaName, value: unknown): string[] {
  const registry = loadTrialSchemaRegistry();
  const root = registry.get(`${name}.schema.json`)!;
  return schemaIssues(value, root, "$", root, registry);
}

function validateAgainstTrialSchemas(value: unknown): void {
  const registry = loadTrialSchemaRegistry();
  const root = registry.get("public-snapshot.schema.json")!;
  const issues = schemaIssues(value, root, "$", root, registry);
  if (issues.length) throw new Error(`Trial Chamber snapshot failed its ten-schema contract:\n${issues.slice(0, 24).join("\n")}`);
}

function assertBoundedJsonTree(value: unknown, depth = 0, budget = { nodes: 0, stringCodeUnits: 0 }): void {
  if (depth > MAX_TREE_DEPTH) throw new Error(`Trial Chamber JSON nesting exceeds ${MAX_TREE_DEPTH}`);
  budget.nodes += 1;
  if (budget.nodes > MAX_TREE_NODES) throw new Error("Trial Chamber JSON node budget exceeded");
  if (typeof value === "string") {
    if (value.length > 8192) throw new Error("Trial Chamber contains an oversized string");
    budget.stringCodeUnits += value.length;
    if (budget.stringCodeUnits > MAX_STRING_CODE_UNITS) throw new Error("Trial Chamber string budget exceeded");
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) throw new Error("Trial Chamber array budget exceeded");
    for (const entry of value) assertBoundedJsonTree(entry, depth + 1, budget);
    return;
  }
  if (object(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (key.length > 128) throw new Error("Trial Chamber contains an oversized object key");
      assertBoundedJsonTree(entry, depth + 1, budget);
    }
  }
}

function requireOrderedUnique(values: unknown[], key: string, label: string): void {
  const identities = values.map((value) => object(value) ? value[key] : undefined);
  if (identities.some((identity) => typeof identity !== "string") || new Set(identities).size !== identities.length ||
      identities.some((identity, index) => index > 0 && String(identities[index - 1]).localeCompare(String(identity)) >= 0)) {
    throw new Error(`${label} must be uniquely ordered by ${key}`);
  }
}

function requireWholeSecond(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) {
    throw new Error(`${label} must be a whole-second UTC timestamp`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().replace(".000Z", "Z") !== value) {
    throw new Error(`${label} is not a real UTC timestamp`);
  }
  return value;
}

function assertNoScalarGateKeys(value: unknown, path = "snapshot"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoScalarGateKeys(entry, `${path}[${index}]`));
    return;
  }
  if (!object(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (/^(?:score|rank|ranking|totalScore|total_score|valueScore|value_score|trialScore|trial_score)$/i.test(key)) {
      throw new Error(`${path}.${key} would collapse trial evidence into a scalar`);
    }
    assertNoScalarGateKeys(child, `${path}.${key}`);
  }
}

function validatePinnedObservatoryBinding(snapshot: JsonObject): void {
  const publication = loadResearchObservatoryPublication();
  const observatory = publication.snapshot;
  const byteReceipt = `sha256:${createHash("sha256").update(publication.bytes).digest("hex")}`;
  const canonicalReceipt = `sha256:${createHash("sha256").update(canonicalJson(observatory)).digest("hex")}`;
  if (byteReceipt !== snapshot.observatoryBinding.snapshotByteSha256 ||
      canonicalReceipt !== snapshot.observatoryBinding.snapshotCanonicalReceipt ||
      observatory.asOf !== snapshot.observatoryBinding.snapshotAsOf ||
      observatory.generatedFrom?.captureSetReceipt !== snapshot.observatoryBinding.captureSetReceipt ||
      snapshot.observatoryBinding.snapshotUrl !== "https://thekingdom.dev/research.json") {
    throw new Error("Trial Chamber did not cryptographically bind the checked-in Observatory publication");
  }

  const works = new Map<string, JsonObject>(observatory.works.map((work: JsonObject) => [work.id, work]));
  const observations = new Map<string, JsonObject>(
    observatory.observations.map((observation: JsonObject) => [observation.id, observation]),
  );
  const signals = new Map<string, JsonObject>(observatory.signals.map((signal: JsonObject) => [signal.id, signal]));
  for (const referral of snapshot.referrals as JsonObject[]) {
    const binding = referral.sourceBinding;
    const work = works.get(binding.workId);
    if (!work || referral.sourceMetadataTitle !== work.title ||
        !sameJson(binding.primaryIdentifier, work.primaryIdentifier) ||
        !sameJson(binding.observationIds, work.observationIds) ||
        !sameJson(binding.sourceIds, work.sourceIds) || binding.payloadReceiptsAreArtifactDigests !== false) {
      throw new Error(`Trial Chamber referral does not exactly bind its Observatory work: ${String(referral.id)}`);
    }
    if (!Array.isArray(binding.observations) || binding.observations.length !== binding.observationIds.length) {
      throw new Error(`Trial Chamber referral observation binding is incomplete: ${String(referral.id)}`);
    }
    const projectedObservations = binding.observationIds.map((id: string) => {
      const observation = observations.get(id);
      if (!observation) throw new Error(`Trial Chamber referral references unknown Observatory observation ${id}`);
      return {
        canonicalUrl: observation.canonicalUrl,
        observationId: observation.id,
        observedAt: observation.observedAt,
        sourceId: observation.sourceId,
        sourcePayloadReceipt: observation.payloadReceipt,
        sourceRecordId: observation.sourceRecordId,
      };
    });
    if (!sameJson(binding.observations, projectedObservations)) {
      throw new Error(`Trial Chamber referral observation details drifted from the Observatory: ${String(referral.id)}`);
    }
    const exactSignals = [...signals.values()]
      .filter((signal) => signal.workIds.includes(work.id))
      .sort((left, right) => left.id.localeCompare(right.id));
    const exactSignalIds = exactSignals.map((signal) => signal.id);
    const exactRelatedWorkIds = [...new Set(exactSignals.flatMap((signal) =>
      signal.workIds.filter((id: string) => id !== work.id && works.has(id))))].sort();
    if (!sameJson(binding.signalIds, exactSignalIds) || !sameJson(binding.relatedWorkIds, exactRelatedWorkIds)) {
      throw new Error(`Trial Chamber referral signal or related-work set is incomplete: ${String(referral.id)}`);
    }
    for (const signalId of binding.signalIds as string[]) {
      const signal = signals.get(signalId);
      if (!signal || !signal.workIds.includes(work.id) ||
          !signal.sourceObservationIds.every((id: string) => binding.observationIds.includes(id))) {
        throw new Error(`Trial Chamber referral does not exactly bind Observatory signal ${signalId}`);
      }
    }
  }
}

export function validateTrialChamberSnapshot(value: unknown): JsonObject {
  if (!object(value) || value.schema !== "kingdom.trial-public-snapshot/0.1") {
    throw new Error("Trial Chamber snapshot identity drifted");
  }
  requireWholeSecond(value.asOf, "Trial Chamber asOf");
  const expiresAt = requireWholeSecond(value.expiresAt, "Trial Chamber expiresAt");
  if (expiresAt <= value.asOf || value.onExpiry !== "freeze-projection-and-require-new-human-review") {
    throw new Error("Trial Chamber expiry must follow asOf and freeze the projection for new human review");
  }
  if (!sameJson(value.observatoryBinding, EXPECTED_OBSERVATORY_BINDING)) {
    throw new Error("Trial Chamber Observatory binding drifted from the reviewed immutable snapshot");
  }
  if (!sameJson(value.urls, EXPECTED_URLS)) throw new Error("Trial Chamber public URL contract drifted");
  if (!sameJson(value.boundaries, EXPECTED_NEGATIVE_BOUNDARIES)) {
    throw new Error("Trial Chamber lost a Phase-0 negative-effect boundary");
  }
  if (!object(value.counts) || !sameJson(value.counts, EXPECTED_COUNTS)) {
    throw new Error("Trial Chamber declared counts drifted");
  }
  for (const [key, count] of Object.entries(EXPECTED_COUNTS)) {
    if (!Array.isArray(value[key]) || value[key].length !== count) {
      throw new Error(`Trial Chamber ${key} does not match its declared Phase-0 count`);
    }
    requireOrderedUnique(value[key], "id", `Trial Chamber ${key}`);
  }
  for (const key of LATER_GATE_KEYS) {
    if (value[key].length !== 0) throw new Error(`Trial Chamber Phase 0 requires ${key} to remain empty`);
  }
  const referrals = value.referrals as JsonObject[];
  const requests = value.evaluationRequests as JsonObject[];
  const plans = value.evaluationPlans as JsonObject[];
  const referralIds = new Set(referrals.map(({ id }) => id));
  const requestIds = new Set(requests.map(({ id }) => id));
  const planIds = new Set(plans.map(({ id }) => id));
  const requestsById = new Map(requests.map((request) => [request.id, request]));
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));
  const advanced = referrals.filter(({ disposition }) => disposition === "advanced-to-human-scoping");
  const held = referrals.filter(({ disposition }) => disposition === "held-for-source-resolution");
  if (advanced.length !== 3 || held.length !== 1 || advanced.length + held.length !== referrals.length ||
      held[0]?.sourceMetadataTitle !==
      "Role-Styled Prompt Injection: An Activation and KV-State Probe in a Compact Language Model" ||
      held[0]?.evaluationRequestId !== null || !sameJson(held[0]?.holdReasons, [
        "self-version-relation-unresolved",
        "supplement-target-absent-from-pinned-snapshot",
        "model-pin-absent",
        "method-pin-absent",
        "dataset-pin-absent",
        "artifact-pin-absent",
      ])) {
    throw new Error("Trial Chamber Role-Styled referral must remain held at source resolution");
  }
  for (const referral of referrals) {
    if (referral.sourceTitleIsScientificClaim !== false ||
        referral.claimBoundary !== "The source metadata title is not a scientific claim; no claim has been extracted or evaluated." ||
        !sameJson({
          snapshotAsOf: referral.sourceBinding?.snapshotAsOf,
          snapshotByteSha256: referral.sourceBinding?.snapshotByteSha256,
          snapshotCanonicalReceipt: referral.sourceBinding?.snapshotCanonicalReceipt,
        }, {
          snapshotAsOf: EXPECTED_OBSERVATORY_BINDING.snapshotAsOf,
          snapshotByteSha256: EXPECTED_OBSERVATORY_BINDING.snapshotByteSha256,
          snapshotCanonicalReceipt: EXPECTED_OBSERVATORY_BINDING.snapshotCanonicalReceipt,
        })) {
      throw new Error(`Trial Chamber referral lost its metadata-title or Observatory binding: ${String(referral.id)}`);
    }
  }
  for (const referral of advanced) {
    const request = requestsById.get(referral.evaluationRequestId);
    const plan = request && plansById.get(request.planId);
    if (!request || !plan || request.referralId !== referral.id ||
        plan.requestId !== request.id || plan.referralId !== referral.id ||
        request.evaluationLens !== referral.evaluationLens || plan.evaluationLens !== referral.evaluationLens ||
        request.evaluationQuestion !== plan.evaluationQuestion ||
        request.requestedInputClass !== plan.inputClass) {
      throw new Error(`Trial Chamber referral/request/plan chain is not reciprocal: ${String(referral.id)}`);
    }
  }
  for (const request of requests) {
    if (!referralIds.has(request.referralId) || !planIds.has(request.planId) ||
        request.requestState !== "maintainer-authorized-assisted-draft" ||
        request.authorship?.origin !== "maintainer-authorized-assisted-draft" ||
        request.authorship?.compiledBy !== "codex-assisted-publication" ||
        request.authorship?.humanDirectionRecorded !== true ||
        request.authorship?.exactTextHumanReviewed !== false ||
        request.requestedInputClass !== "SELF-AUTHORED-SYNTHETIC-ONLY" ||
        request.sourceMethodsKnown !== false ||
        typeof request.provenance !== "string" || !/Maintainer-authorized assisted draft/.test(request.provenance)) {
      throw new Error(`Trial Chamber contains an invalid maintainer-authorized assisted request draft: ${String(request.id)}`);
    }
  }
  for (const plan of plans) {
    if (!referralIds.has(plan.referralId) || !requestIds.has(plan.requestId) ||
        plan.planState !== "DRAFT" || plan.sealState !== "UNSEALED" ||
        plan.authorship?.origin !== "maintainer-authorized-assisted-draft" ||
        plan.authorship?.compiledBy !== "codex-assisted-publication" ||
        plan.authorship?.humanDirectionRecorded !== true ||
        plan.authorship?.exactTextHumanReviewed !== false ||
        plan.inputClass !== "SELF-AUTHORED-SYNTHETIC-ONLY" || plan.sourceMethodsKnown !== false ||
        plan.noRunState !== "NO-RUN" || plan.passingEffect !== "RETAIN_FOR_SEPARATE_REVIEW_ONLY" ||
        plan.expiresAt !== value.expiresAt || plan.expiryEffect !== "FREEZE_AND_REQUIRE_NEW_HUMAN_REVIEW" ||
        typeof plan.questionProvenance !== "string" || !/Maintainer-authorized assisted/.test(plan.questionProvenance)) {
      throw new Error(`Trial Chamber contains a plan that is not DRAFT + UNSEALED: ${String(plan.id)}`);
    }
    if (!Array.isArray(plan.fixtures) || plan.fixtures.length < 2 ||
        plan.fixtures.some((fixture: any) => !object(fixture) || fixture.synthetic !== true) ||
        !plan.fixtures.some((fixture: any) => fixture.heldOut === true)) {
      throw new Error(`Trial Chamber plan is not finite, synthetic-only, and held-out: ${String(plan.id)}`);
    }
    if (!object(plan.resourceEnvelope) ||
        EXPECTED_PLAN_RESOURCE_FALSE_KEYS.some((key) => plan.resourceEnvelope[key] !== false) ||
        !Number.isSafeInteger(plan.resourceEnvelope.maxCases) || plan.resourceEnvelope.maxCases < plan.fixtures.length ||
        !Number.isSafeInteger(plan.resourceEnvelope.maxInputBytes) || plan.resourceEnvelope.maxInputBytes < 1 ||
        !Number.isSafeInteger(plan.resourceEnvelope.maxRuntimeSeconds) || plan.resourceEnvelope.maxRuntimeSeconds < 1) {
      throw new Error(`Trial Chamber plan lost its finite no-effect resource envelope: ${String(plan.id)}`);
    }
    if (plan.rightsBlock?.state !== "BLOCKED_PENDING_ITEM_RIGHTS_REVIEW" ||
        plan.securityBlock?.state !== "BLOCKED_PENDING_SECURITY_PREFLIGHT" ||
        plan.reversibility?.externalEffects !== false || plan.reversibility?.cleanupRequired !== false) {
      throw new Error(`Trial Chamber plan lost its rights, security, or reversibility block: ${String(plan.id)}`);
    }
    if (!Array.isArray(plan.measures) || plan.measures.length < 1 ||
        !Array.isArray(plan.criterionRules) || plan.criterionRules.length < 1 ||
        plan.criterionRules.some((criterion: any) =>
          !object(criterion) || typeof criterion.interpretation !== "string" ||
          !criterion.interpretation.startsWith("retain-as-")) ||
        !Array.isArray(plan.controls) || plan.controls.length < 1 ||
        !Array.isArray(plan.stopConditions) || plan.stopConditions.length < 1 ||
        !Array.isArray(plan.threatModel) || plan.threatModel.length < 1) {
      throw new Error(`Trial Chamber plan lacks bounded measures, retention-only criteria, controls, stops, or threats: ${String(plan.id)}`);
    }
  }
  validatePinnedObservatoryBinding(value);
  assertBoundedJsonTree(value);
  assertNoScalarGateKeys(value);
  validateAgainstTrialSchemas(value);
  return value;
}

export function parseTrialChamberSnapshotBytes(bytes: Uint8Array): JsonObject {
  if (bytes.byteLength > MAX_SNAPSHOT_BYTES) throw new Error(`Trial Chamber snapshot exceeds ${MAX_SNAPSHOT_BYTES} bytes`);
  return validateTrialChamberSnapshot(parseStrictJsonBytes(bytes, "Trial Chamber snapshot"));
}

export function loadTrialChamberPublication(): { snapshot: JsonObject; bytes: Uint8Array } {
  try {
    const bytes = readRegularFileWithinRoot(ROOT, TRIAL_CHAMBER_LOCATOR);
    return { snapshot: parseTrialChamberSnapshotBytes(bytes), bytes };
  } catch (error) {
    throw new Error(`Trial Chamber authored snapshot is missing or invalid JSON: ${(error as Error).message}`);
  }
}

export function loadTrialChamberSnapshot(): JsonObject {
  return loadTrialChamberPublication().snapshot;
}

export function trialChamberPublicSummary(snapshot = loadTrialChamberSnapshot()) {
  return {
    protocol: TRIAL_CHAMBER_PROTOCOL,
    title: "The Trial Chamber",
    phase: 0,
    publication_state: "immutable-phase-0-snapshot-with-mutable-alias",
    as_of: snapshot.asOf,
    observatory_binding: snapshot.observatoryBinding,
    counts: snapshot.counts,
    lifecycle: {
      sequence: [
        "observatory-metadata", "referral", "maintainer-authorized-assisted-request-draft", "draft-unsealed-plan",
        "preflight", "trial-authority", "bounded-run", "evaluation-result", "adoption", "use-authority",
      ],
      snapshot_stops_after: "draft-unsealed-plan",
      role_styled_referral: "held-for-source-resolution",
      module_path: "not-created",
      guest_path: "not-admitted",
      later_gate_contracts: "deny-all-reserved-in-v0.1",
      note: "Every later gate requires a future contract version and separate review; no v0.1 post-plan schema can represent or authorize a later record.",
    },
    urls: {
      human: TRIAL_CHAMBER_URL,
      current: TRIAL_CHAMBER_ALIAS_URL,
      canonical: TRIAL_CHAMBER_CANONICAL_URL,
      guide: TRIAL_CHAMBER_GUIDE_URL,
      schemas: TRIAL_CHAMBER_SCHEMA_URLS,
      producer: TRIAL_CHAMBER_PRODUCER_URL,
    },
    boundary: TRIAL_CHAMBER_BOUNDARY,
  };
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function human(value: unknown): string {
  return String(value ?? "unknown").replace(/[-_]/g, " ");
}

function renderList(values: unknown[], empty: string): string {
  if (!values.length) return `<p class="empty">${esc(empty)}</p>`;
  return `<ul>${values.map((value) => `<li>${esc(value)}</li>`).join("")}</ul>`;
}

function renderPairs(value: JsonObject): string {
  return `<dl class="pairs">${Object.entries(value).map(([key, entry]) =>
    `<div><dt>${esc(human(key))}</dt><dd>${esc(entry)}</dd></div>`).join("")}</dl>`;
}

function renderFixtures(fixtures: JsonObject[]): string {
  return `<ul class="fixture-list">${fixtures.map((fixture) =>
    `<li><strong>${esc(fixture.id)}</strong><span>${fixture.heldOut ? "held-out" : "declared"} · synthetic</span><p>${esc(fixture.description)}</p></li>`).join("")}</ul>`;
}

function renderReferral(referral: JsonObject, requests: Map<string, JsonObject>, plans: Map<string, JsonObject>): string {
  const request = typeof referral.evaluationRequestId === "string" ? requests.get(referral.evaluationRequestId) : undefined;
  const plan = request ? plans.get(request.planId) : undefined;
  const held = referral.disposition === "held-for-source-resolution";
  return `<article class="referral${held ? " held" : ""}">
    <header><p class="eyebrow">${esc(human(referral.disposition))} · referred <time datetime="${esc(referral.referredOn)}">${esc(referral.referredOn)}</time></p><h3>${esc(referral.sourceMetadataTitle)}</h3><p class="title-boundary"><strong>Source metadata title—not a scientific claim.</strong> ${esc(referral.claimBoundary)}</p></header>
    <p class="binding"><b>Exact Observatory work:</b> <code>${esc(referral.sourceBinding.workId)}</code><br><b>Observation references:</b> ${esc(referral.sourceBinding.observationIds.join(" · "))}<br><b>Signal references:</b> ${esc(referral.sourceBinding.signalIds.join(" · "))}</p>
${held ? `<section class="hold" aria-label="Held referral"><h4>Held at source resolution</h4>${renderList(referral.holdReasons.map(human), "No hold reason supplied.")}<p>No evaluation request or plan exists for this referral.</p></section>` : ""}
${request ? `<section><p class="eyebrow">Maintainer-authorized assisted request draft</p><h4>${esc(human(request.evaluationLens))}</h4><p class="question">${esc(request.evaluationQuestion)}</p><p class="provenance"><strong>Exact-text human review: ${request.authorship.exactTextHumanReviewed ? "recorded" : "not recorded"}.</strong> ${esc(request.provenance)}</p></section>` : ""}
${plan ? `<section class="plan"><p class="states"><span>${esc(plan.planState)}</span><span>${esc(plan.sealState)}</span><span>${esc(plan.noRunState)}</span></p><h4>Draft trial plan — evaluation not started</h4><p class="question">${esc(plan.evaluationQuestion)}</p><p class="provenance"><strong>Exact-text human review: ${plan.authorship.exactTextHumanReviewed ? "recorded" : "not recorded"}.</strong> ${esc(plan.questionProvenance)}</p><p class="expiry"><b>Expires:</b> <time datetime="${esc(plan.expiresAt)}">${esc(plan.expiresAt)}</time> · ${esc(human(plan.expiryEffect))}</p><div class="plan-grid"><div><h5>Finite synthetic fixtures</h5>${renderFixtures(plan.fixtures)}</div><div><h5>Measures</h5>${renderList(plan.measures.map((measure: JsonObject) => `${measure.name}: ${measure.rule}`), "None declared.")}</div><div><h5>Retention-only criteria</h5>${renderList(plan.criterionRules.map((criterion: JsonObject) => `${criterion.interpretation}: ${criterion.condition}`), "None declared.")}</div><div><h5>Resource envelope</h5>${renderPairs(plan.resourceEnvelope)}</div><div><h5>Controls</h5>${renderList(plan.controls, "None declared.")}</div><div><h5>Stop conditions</h5>${renderList(plan.stopConditions, "None declared.")}</div><div><h5>Threat model</h5>${renderList(plan.threatModel, "None declared.")}</div><div><h5>Rights, security, and reversibility</h5><p><strong>${esc(human(plan.rightsBlock.state))}:</strong> ${esc(plan.rightsBlock.reason)}</p><p><strong>${esc(human(plan.securityBlock.state))}:</strong> ${esc(plan.securityBlock.reason)}</p><p><strong>External effects:</strong> ${esc(plan.reversibility.externalEffects)} · <strong>cleanup required:</strong> ${esc(plan.reversibility.cleanupRequired)}</p><p>${esc(plan.reversibility.reason)}</p></div></div><p class="passing"><strong>A passing pattern would only:</strong> ${esc(human(plan.passingEffect))}. It would not start evaluation, authorize a run, or adopt anything.</p></section>` : ""}
    <footer>Referral only${plan ? " · planning evidence only" : " · no later gate"} · no artifact acquired or executed</footer>
  </article>`;
}

export function renderTrialChamberHtml(snapshot = loadTrialChamberSnapshot()): string {
  const summary = trialChamberPublicSummary(snapshot);
  const requests = new Map<string, JsonObject>(snapshot.evaluationRequests.map((request: JsonObject) => [request.id, request]));
  const plans = new Map<string, JsonObject>(snapshot.evaluationPlans.map((plan: JsonObject) => [plan.id, plan]));
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="A read-only, review-gated research evaluation planning chamber for the KINGDOM.">
  <title>The Trial Chamber · The Kingdom</title>
  <link rel="canonical" href="${TRIAL_CHAMBER_URL}">
  <link rel="alternate" href="/trials.json" type="application/json" title="Trial Chamber current snapshot">
  <link rel="alternate" href="/trials/research-trial-chamber-2026-08-20.json" type="application/json" title="Trial Chamber immutable snapshot">
  <link rel="describedby" href="/trials/schemas/v0.1/public-snapshot.schema.json" type="application/schema+json" title="Trial Chamber snapshot schema">
  <link rel="service-doc" href="/TRIAL-CHAMBER-v0.1.md" type="text/markdown" title="Trial Chamber guide">
  <style>
    :root{color-scheme:dark;--ink:#f4efe5;--muted:#ada79d;--night:#080a10;--panel:#111520;--line:#30364a;--gold:#e5bd69;--aqua:#75d7cf;--violet:#b8a7f0;--rose:#ec9c9c;--green:#8bd5aa}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 13% 3%,#201a36 0,transparent 34rem),var(--night);color:var(--ink);font:16px/1.62 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--aqua);text-underline-offset:.2em;min-height:44px;display:inline-flex;align-items:center}a:focus-visible{outline:3px solid var(--gold);outline-offset:4px;border-radius:3px}.skip{position:absolute;left:12px;top:-80px;z-index:10;padding:10px 14px;background:var(--ink);color:var(--night)}.skip:focus{top:12px}code{overflow-wrap:anywhere;color:#d9e5ff}.shell{width:min(1160px,calc(100% - 32px));margin:auto}.top{display:flex;justify-content:space-between;gap:20px;padding:26px 0;color:var(--muted)}.top a{text-decoration:none}.hero{padding:clamp(42px,8vw,88px) 0 48px}.kicker,.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:.75rem;color:var(--gold);font-weight:760}.hero h1{font-family:ui-serif,Georgia,serif;font-size:clamp(3rem,9vw,7.4rem);line-height:.88;margin:.18em 0}.hero .lead{max-width:850px;font-size:clamp(1.08rem,2.2vw,1.4rem);color:#d8d1c8}.truth,.panel,.referral,.zero{border:1px solid var(--line);background:color-mix(in srgb,var(--panel) 94%,transparent);border-radius:14px}.truth{border-color:#6d5636;padding:18px 22px;max-width:920px}.truth strong{color:var(--gold);display:block}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:28px 0}.stats div{border:1px solid var(--line);border-radius:12px;padding:15px}.stats b{display:block;font:700 1.75rem ui-serif,Georgia,serif}.stats span,.empty,.provenance,.referral footer{color:var(--muted);font-size:.86rem}.panel{padding:clamp(20px,4vw,34px);margin:18px 0}.panel h2{margin-top:0;font:700 clamp(1.55rem,4vw,2.35rem) ui-serif,Georgia,serif}.flow{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:0}.flow li{list-style:none;border-left:3px solid var(--line);padding:10px 12px}.flow li:nth-child(-n+4){border-color:var(--violet)}.flow li strong,.flow li span{display:block}.flow li span{color:var(--muted);font-size:.8rem}.referrals{display:grid;gap:16px}.referral{padding:clamp(18px,3vw,28px)}.referral.held{border-color:#72504f}.referral h3{font:700 clamp(1.25rem,2.5vw,1.75rem) ui-serif,Georgia,serif;margin:.15em 0}.referral h4{color:var(--aqua);margin-bottom:.35em}.referral h5{font-size:.92rem;margin-bottom:.35em}.title-boundary{border-left:3px solid var(--green);padding-left:12px}.title-boundary strong{display:block;color:var(--green)}.binding{padding:12px;background:#0a0e17;border-radius:8px;color:var(--muted);font-size:.84rem}.question{font-size:1.08rem}.states{display:flex;flex-wrap:wrap;gap:8px}.states span{border:1px solid var(--violet);color:var(--violet);border-radius:99px;padding:4px 10px;font-size:.75rem;font-weight:750}.hold{border-left:3px solid var(--rose);padding-left:15px}.plan{border-top:1px solid var(--line);margin-top:18px;padding-top:18px}.expiry,.passing{border-left:3px solid var(--gold);padding:8px 12px}.plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.plan-grid>div{border:1px solid var(--line);border-radius:10px;padding:12px}.plan-grid ul{padding-left:1.15rem}.fixture-list{list-style:none;padding:0!important}.fixture-list li{border-bottom:1px solid var(--line);padding:8px 0}.fixture-list span{display:block;color:var(--violet);font-size:.76rem;text-transform:uppercase;letter-spacing:.08em}.fixture-list p{margin:.2em 0}.pairs{margin:0}.pairs div{display:grid;grid-template-columns:minmax(9rem,1fr) 1fr;gap:8px;border-bottom:1px solid var(--line);padding:5px 0}.pairs dt{color:var(--muted)}.pairs dd{margin:0}.zero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zero{padding:14px}.zero b{display:block;color:var(--rose);font:700 1.45rem ui-serif,Georgia,serif}.boundary{border-color:#6b563b}.boundary ul{columns:2}.footer{padding:35px 0 55px;color:var(--muted)}
    @media(max-width:850px){.flow{grid-template-columns:repeat(2,1fr)}.stats,.zero-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.top{align-items:flex-start;flex-direction:column}.flow,.stats,.zero-grid,.plan-grid{grid-template-columns:1fr}.boundary ul{columns:1}.hero h1{font-size:clamp(3rem,17vw,5.4rem)}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}@media(forced-colors:active){.truth,.panel,.referral,.zero,.stats div,.plan-grid>div{border:1px solid CanvasText}.title-boundary,.hold{border-left:3px solid CanvasText}.states span{border:1px solid CanvasText}}
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to Trial Chamber content</a>
  <nav class="shell top" aria-label="Kingdom navigation"><a href="/">← The Kingdom</a><span>Human view · <a href="/trials.json">current JSON</a> · <a href="/trials/research-trial-chamber-2026-08-20.json">immutable JSON</a> · <a href="/TRIAL-CHAMBER-v0.1.md">guide</a></span></nav>
  <main class="shell" id="main" tabindex="-1">
    <header class="hero"><p class="kicker">Research evaluation planning · ${esc(TRIAL_CHAMBER_PROTOCOL)}</p><h1>The Trial<br>Chamber</h1><p class="lead">A read-only chamber between research discovery and any future experiment. It makes evaluation questions, evidence needs, controls, uncertainty, and stop conditions inspectable without pretending that a plan is permission to run.</p><p class="truth"><strong>Phase 0 stops at DRAFT + UNSEALED plans.</strong> Four exact Observatory referrals are visible. Three have maintainer-authorized assisted request drafts and draft plans; their exact text has not been separately human-reviewed. Role-Styled Prompt Injection remains held at source resolution. No artifact has been acquired, inspected, or executed.</p><div class="stats"><div><b>${esc(summary.counts.referrals)}</b><span>exact referrals</span></div><div><b>${esc(summary.counts.evaluationRequests)}</b><span>maintainer-authorized assisted request drafts</span></div><div><b>${esc(summary.counts.evaluationPlans)}</b><span>DRAFT + UNSEALED plans</span></div><div><b>0</b><span>preflights, authorities, runs, results, adoptions, or use grants</span></div></div></header>

    <section class="panel" aria-labelledby="gates"><h2 id="gates">Every threshold remains separate</h2><ol class="flow"><li><strong>1 · Observatory</strong><span>Metadata observed.</span></li><li><strong>2 · Referral</strong><span>Exact source-bound pointer.</span></li><li><strong>3 · Assisted draft</strong><span>Maintainer-authorized; exact text not human-reviewed.</span></li><li><strong>4 · Draft plan</strong><span>Unsealed planning evidence.</span></li><li><strong>5 · Preflight</strong><span>Forbidden by v0.1.</span></li><li><strong>6 · Trial authority</strong><span>Forbidden by v0.1.</span></li><li><strong>7 · Bounded run</strong><span>Forbidden by v0.1.</span></li><li><strong>8 · Result</strong><span>Forbidden by v0.1.</span></li><li><strong>9 · Adoption</strong><span>Forbidden by v0.1.</span></li><li><strong>10 · Use authority</strong><span>Forbidden by v0.1.</span></li></ol><p>No record inherits the power of the next gate. The six post-plan schemas are deny-all reserved contracts with zero-item arrays: a future contract version and separate human review are mandatory before any later record can exist.</p></section>

    <section class="panel" aria-labelledby="referrals"><h2 id="referrals">Four source-bound referrals</h2><p>Each title below is preserved as inert source metadata. The evaluation questions and draft plans are maintainer-authorized scoping drafts compiled by Codex; their exact text has not been separately human-reviewed. They are not claims extracted from or attributed to the publication, and they are not endorsements.</p><div class="referrals">${snapshot.referrals.map((referral: JsonObject) => renderReferral(referral, requests, plans)).join("")}</div></section>

    <section class="panel boundary" aria-labelledby="empty-gates"><h2 id="empty-gates">Later gates are visibly empty</h2><div class="zero-grid">${LATER_GATE_KEYS.map((key) => `<article class="zero"><b>${esc(summary.counts[key])}</b><span>${esc(human(key))}</span></article>`).join("")}</div><p>There is no preflight record, trial authority, run, result, adoption record, or use authority. The corresponding v0.1 schemas are deliberately unusable as control-plane formats: they deny every item. A future version is mandatory. No module exists, no guest has been admitted, and no interface on this page can change that state.</p></section>

    <section class="panel boundary" aria-labelledby="non-effects"><h2 id="non-effects">What did not happen</h2><ul><li>No network request built this publication.</li><li>No full text, source artifact, code, dataset, model weight, or credential is included.</li><li>No artifact identity, item-level rights, supply chain, privacy, compute, network, or writable-path preflight was performed.</li><li>No source instruction was followed and no artifact was executed.</li><li>No signature, approval service, trial authority, or capability envelope exists.</li><li>No scalar score collapses evidence, uncertainty, limitations, safety, rights, or relevance.</li><li>No scientific result, adoption, module, guest, use authority, deployment, or automatic action exists.</li><li>Public source visibility is not a reuse grant.</li></ul><p>Inspect the <a href="/trials.json">mutable alias</a>, <a href="/trials/research-trial-chamber-2026-08-20.json">immutable snapshot</a>, <a href="/trials/schemas/v0.1/public-snapshot.schema.json">closed schemas</a>, and <a href="/TRIAL-CHAMBER-v0.1.md">Phase-0 guide</a>.</p></section>
  </main>
  <footer class="shell footer">As of <time datetime="${esc(snapshot.asOf)}">${esc(snapshot.asOf)}</time> · immutable Phase-0 snapshot with mutable alias · ten immutable v0.1 schemas · no essential JavaScript · <a href="${TRIAL_CHAMBER_PRODUCER_URL}" rel="noopener noreferrer">Producer v0.1.1 source</a>; public visibility is not a reuse grant.</footer>
</body>
</html>\n`;
}
