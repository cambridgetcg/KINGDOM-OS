#!/usr/bin/env bun
/**
 * Strict, network-free reader and accessible renderer for Evaluation Covenant.
 *
 * The frozen publication contains synthetic Phase-0 evaluation designs. It
 * creates no seal, registration, run, data, participant, result, observed
 * outcome, selection, decision, action or authority. Desired-outcome IDs are
 * inherited hypotheses, not observations. Historical bytes never depend on
 * the reader's clock; release and live checks enforce the active review window.
 */

import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { readRegularFileWithinRoot } from "./immutable-publications.ts";
import { parseStrictJsonBytes } from "./principality.ts";
import {
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_AS_OF,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_BYTE_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_PROTOCOL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_BYTE_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL,
  loadUkGovernmentTransformationPublication,
  ukGovernmentTransformationCanonicalJson,
} from "./uk-government-transformation-engine.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const EVALUATION_COVENANT_PROTOCOL =
  "kingdom.evaluation-covenant-public-snapshot/0.1";
export const EVALUATION_COVENANT_LOCATOR =
  "data/evaluation/uk-government-transformation-evaluation-covenants.v0.1.json";
export const EVALUATION_COVENANT_PAGE_LOCATOR =
  "site/evaluation-covenant/index.html";
export const EVALUATION_COVENANT_ALIAS_LOCATOR =
  "site/evaluation-covenants.json";
export const EVALUATION_COVENANT_SCHEMA_LOCATOR =
  "schemas/evaluation-covenant/v0.1/public-snapshot.schema.json";
export const EVALUATION_COVENANT_GUIDE_LOCATOR =
  "references/evaluation-covenant-v0.1.md";
export const EVALUATION_COVENANT_URL =
  "https://thekingdom.dev/evaluation-covenant/";
export const EVALUATION_COVENANT_ALIAS_URL =
  "https://thekingdom.dev/evaluation-covenants.json";
export const EVALUATION_COVENANT_CANONICAL_URL =
  "https://thekingdom.dev/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json";
export const EVALUATION_COVENANT_SCHEMA_URL =
  "https://thekingdom.dev/evaluation/schemas/v0.1/public-snapshot.schema.json";
export const EVALUATION_COVENANT_GUIDE_URL =
  "https://thekingdom.dev/EVALUATION-COVENANT-v0.1.md";
export const EVALUATION_COVENANT_REPOSITORY_URL =
  "https://github.com/cambridgetcg/kingdom-evaluation-covenant";
export const EVALUATION_COVENANT_PRODUCER_URL =
  "https://github.com/cambridgetcg/kingdom-evaluation-covenant/tree/v0.1.0";
export const EVALUATION_COVENANT_BYTE_SHA256 =
  "674197eab23bb70501bcf50aa4b0a6f09b25e89829e5e7e706a98e4a9fcc2328";
export const EVALUATION_COVENANT_CANONICAL_SHA256 =
  "04a0c4a249e0eb02bf07643ae5c609488c6de1cd5288a7ed0056469f63a6a3f9";
export const EVALUATION_COVENANT_SCHEMA_BYTE_SHA256 =
  "aa737bf4c9efa8bbdf477dae5347d9bd28677565e7903b3942f22844574e0a6c";
export const EVALUATION_COVENANT_SCHEMA_CANONICAL_SHA256 =
  "264acc2f3e0075b1952768b1ecf810fa4e3204d37a178d6fcd87ad26a78615f1";
export const EVALUATION_COVENANT_GUIDE_BYTE_SHA256 =
  "f8bf8cc7084623c7a0f2fc3722073aa9ea5e27071f25d3751318bc14ed3fe5dc";
export const EVALUATION_COVENANT_AS_OF = "2026-08-23";
export const EVALUATION_COVENANT_NEXT_REVIEW_DUE = "2026-09-21";

const MAX_SNAPSHOT_BYTES = 256 * 1024;
const MAX_SCHEMA_BYTES = 384 * 1024;
const MAX_TREE_DEPTH = 48;
const MAX_TREE_NODES = 180_000;
const MAX_STRING_CODE_UNITS = 1_500_000;
const MAX_ARRAY_ITEMS = 4096;

const EXPECTED_COUNTS = Object.freeze({
  affectedPartyClasses: 10,
  comparators: 9,
  designs: 3,
  deviations: 0,
  estimands: 10,
  evaluationQuestions: 9,
  guardrails: 9,
  humanGates: 18,
  measures: 14,
  methodSources: 10,
  stopRules: 10,
});

const EXPECTED_STATE = Object.freeze({
  adoptionEffect: "NONE",
  approvalState: "NOT-APPROVED",
  designState: "DRAFT",
  registrationState: "UNREGISTERED",
  resultState: "NO-RESULT",
  runState: "NO-RUN",
  sealState: "UNSEALED",
  useAuthorityEffect: "NONE",
});

const DESIGN_IDS = Object.freeze([
  "design:four-nation-information-orientation",
  "design:hmrc-notice-route-orientation",
  "design:public-money-category-orientation",
]);

const SOURCE_URLS = new Map<string, string>([
  ["source:aqua-book-2025", "https://www.gov.uk/guidance/the-aqua-book"],
  ["source:consultation-principles-2018", "https://www.gov.uk/government/publications/consultation-principles-guidance/consultation-principles-2018"],
  ["source:data-and-ai-ethics-framework-2025", "https://www.gov.uk/government/publications/data-ethics-framework/data-and-ai-ethics-framework"],
  ["source:evaluation-registry-guidance", "https://www.gov.uk/guidance/guidance-on-using-the-evaluation-registry"],
  ["source:green-book-2026", "https://www.gov.uk/government/publications/the-green-book-appraisal-and-evaluation-in-central-government/the-green-book-2026"],
  ["source:gsr-publication-protocol", "https://www.gov.uk/government/publications/government-social-research-publication-protocols"],
  ["source:ico-data-protection-by-design", "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/"],
  ["source:magenta-book-2026", "https://www.gov.uk/government/publications/the-magenta-book/magenta-book-central-government-guidance-on-evaluation-html"],
  ["source:qpie-2026", "https://www.gov.uk/government/publications/the-magenta-book/quality-in-policy-impact-evaluation-qpie-html"],
  ["source:tiger-2026", "https://www.gov.uk/government/publications/the-magenta-book/transparency-in-government-evaluation-research-t-i-g-e-r-html"],
]);

const SOURCE_CANONICAL_SHA256 = new Map<string, string>([
  ["source:aqua-book-2025", "cbcadcd9a3d2eea127bd2e0c07aa6e32e0b0ceeb31c420c781a170f7a1d1c565"],
  ["source:consultation-principles-2018", "425263bf94a30ca3e79c11297ee3b617d1bbf17a860774ff0c05041b564efa8f"],
  ["source:data-and-ai-ethics-framework-2025", "b2ed95d9483e2067a538e13c48b754cd5cea5053d4139c5fb202aea72add7564"],
  ["source:evaluation-registry-guidance", "54ccb2e571909c6fc79bfa73c2bab3888303af71e747a452f726ecbf26b010da"],
  ["source:green-book-2026", "61dc868608fdb1e53fee5bc089c4b0066a0becb2f8c3e70a85a91513a6307b86"],
  ["source:gsr-publication-protocol", "aa7b98081aae43c742e2cf85893af4e8b02c62dbc066b1713c44c38871ea2f5d"],
  ["source:ico-data-protection-by-design", "ea3fe95baf0c44504d9eb7ba7f5a311ac41b7d33d2f93ef04e638ebe6984e103"],
  ["source:magenta-book-2026", "ccd9ec16733a475db1428c3a05af72487e9428dcb10c21eb118d3b72d895e268"],
  ["source:qpie-2026", "c9e93605de2d54e523ec58fe7d23d57fc799bd1d908738543dc12b1250cdd6df"],
  ["source:tiger-2026", "3e7856efb97a94394c9d16f70eb260b7964e1c228b1f3e127b50cfcdb65fbaaf"],
]);

const QUESTION_TYPES = Object.freeze(["economic", "impact", "process"]);
const MEASURE_ROLES = new Set(["economic", "outcome", "process", "qualitative"]);
const FORBIDDEN_TRIAL_FIELDS = new Set([
  "artifact", "artifactPin", "criterionRules", "evaluationPlanId",
  "evaluationRequestId", "execution", "fixtures", "passingEffect", "preflight",
  "referralId", "resourceEnvelope", "runner", "trialAuthority", "trialRun",
]);
const POSSIBLE_PERSONAL_KEYS =
  /(?:^|_)(?:email|name|nationalInsurance|niNumber|nino|postcode|testimony|utr|username|handle|caseId|contact)(?:$|_)/iu;
const POSSIBLE_PERSONAL_VALUES =
  /(?:\b[A-Z]{2}\d{6}[A-D]\b|\b\d{10}\b|\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b|mailto:|@[a-z0-9_.-]+)/iu;

const EXPECTED_DISTRIBUTION_DIMENSIONS = new Map<string, string[]>([
  ["design:four-nation-information-orientation", ["access-needs", "digital-exclusion", "language", "service-familiarity"]],
  ["design:hmrc-notice-route-orientation", ["access-needs", "digital-exclusion", "language-and-literacy", "route-familiarity"]],
  ["design:public-money-category-orientation", ["access-needs", "digital-exclusion", "financial-system-familiarity", "language"]],
]);

const EXPECTED_GATE_IDS = new Map<string, string[]>([
  ["design:four-nation-information-orientation", [
    "gate:covenant-four-nation-affected-party-review",
    "gate:covenant-four-nation-analytical-qa",
    "gate:covenant-four-nation-independent-design-review",
    "gate:covenant-four-nation-privacy-ethics-rights",
    "gate:four-nation-competence-review",
    "gate:four-nation-service-review",
  ]],
  ["design:hmrc-notice-route-orientation", [
    "gate:covenant-notice-affected-party-review",
    "gate:covenant-notice-analytical-qa",
    "gate:covenant-notice-independent-design-review",
    "gate:covenant-notice-privacy-ethics-rights",
    "gate:notice-accessibility-research",
    "gate:notice-specialist-tax-legal-review",
  ]],
  ["design:public-money-category-orientation", [
    "gate:covenant-money-affected-party-review",
    "gate:covenant-money-analytical-qa",
    "gate:covenant-money-independent-design-review",
    "gate:covenant-money-privacy-ethics-rights",
    "gate:money-evaluation-design",
    "gate:money-public-authority-review",
  ]],
]);

const EXPECTED_MISSINGNESS_PLAN = Object.freeze({
  completeCaseDefault: false,
  expectedSources: ["future-authorized-aggregate-protocol-only"],
  imputationState: "NOT-DESIGNED",
  kinds: ["attrition", "measurement-failure", "non-response", "not-covered", "suppressed-for-privacy", "unknown"],
  missingNotNoEffect: true,
  missingNotZero: true,
  results: [],
  sensitivityAnalysisState: "NOT-DESIGNED",
  stopIfCriticalClassUnobserved: true,
});

type JsonObject = Record<string, any>;

function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function evaluationCovenantCanonicalJson(value: unknown): string {
  return ukGovernmentTransformationCanonicalJson(value);
}

function sameJson(left: unknown, right: unknown): boolean {
  return evaluationCovenantCanonicalJson(left) === evaluationCovenantCanonicalJson(right);
}

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function validDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const instant = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return instant.toISOString().slice(0, 10) === value;
}

function validUri(value: string): boolean {
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function schemaTypeMatches(value: unknown, type: string): boolean {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return object(value);
  if (type === "integer") return Number.isSafeInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function schemaPointer(root: JsonObject, reference: string): unknown {
  if (reference === "#") return root;
  if (!reference.startsWith("#/")) throw new Error("unsupported covenant schema reference " + reference);
  let current: unknown = root;
  for (const raw of reference.slice(2).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!object(current) || !Object.hasOwn(current, key)) {
      throw new Error("unresolved covenant schema reference " + reference);
    }
    current = current[key];
  }
  return current;
}

function schemaIssues(
  value: unknown,
  schema: unknown,
  path: string,
  root: JsonObject,
  depth = 0,
): string[] {
  if (depth > 80) return [path + ": schema nesting exceeds 80"];
  if (schema === true) return [];
  if (schema === false) return [path + ": value is forbidden"];
  if (!object(schema)) return [path + ": invalid schema node"];
  if (typeof schema.$ref === "string") {
    return schemaIssues(value, schemaPointer(root, schema.$ref), path, root, depth + 1);
  }
  const issues: string[] = [];
  if (Object.hasOwn(schema, "const") && !sameJson(value, schema.const)) {
    issues.push(path + ": must equal declared constant");
  }
  if (Array.isArray(schema.enum) &&
      !schema.enum.some((candidate) => sameJson(candidate, value))) {
    issues.push(path + ": value is outside enum");
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type: string) => schemaTypeMatches(value, type))) {
      issues.push(path + ": expected " + types.join("|"));
      return issues;
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) issues.push(path + ": number is below minimum");
    if (schema.maximum !== undefined && value > schema.maximum) issues.push(path + ": number is above maximum");
  }
  if (typeof value === "string") {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) issues.push(path + ": string is too short");
    if (schema.maxLength !== undefined && length > schema.maxLength) issues.push(path + ": string is too long");
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern, "u").test(value)) {
      issues.push(path + ": string does not match pattern");
    }
    if (schema.format === "date" && !validDate(value)) issues.push(path + ": string is not a real date");
    if (schema.format === "uri" && !validUri(value)) issues.push(path + ": string is not a URI");
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) issues.push(path + ": array has too few items");
    if (schema.maxItems !== undefined && value.length > schema.maxItems) issues.push(path + ": array has too many items");
    if (schema.uniqueItems === true &&
        new Set(value.map(evaluationCovenantCanonicalJson)).size !== value.length) {
      issues.push(path + ": array items must be unique");
    }
    if (schema.items !== undefined) {
      value.forEach((entry, index) =>
        issues.push(...schemaIssues(entry, schema.items, path + "/" + index, root, depth + 1)));
    }
  }
  if (object(value)) {
    const properties = object(schema.properties) ? schema.properties : {};
    for (const required of Array.isArray(schema.required) ? schema.required : []) {
      if (!Object.hasOwn(value, required)) issues.push(path + "/" + required + ": required property is missing");
    }
    for (const [key, entry] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) {
        issues.push(...schemaIssues(entry, properties[key], path + "/" + key, root, depth + 1));
      } else if (schema.additionalProperties === false) {
        issues.push(path + "/" + key + ": additional property is forbidden");
      } else if (object(schema.additionalProperties)) {
        issues.push(...schemaIssues(entry, schema.additionalProperties, path + "/" + key, root, depth + 1));
      }
    }
  }
  return issues;
}

function assertClosedSchemaDocument(value: unknown, path = "$", seen = new Set<unknown>()): void {
  if ((object(value) || Array.isArray(value)) && seen.has(value)) return;
  if (object(value) || Array.isArray(value)) seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertClosedSchemaDocument(entry, path + "/" + index, seen));
    return;
  }
  if (!object(value)) return;
  if (value.type === "object") {
    if (value.additionalProperties !== false || !object(value.properties) ||
        !Array.isArray(value.required) ||
        !sameJson([...value.required].sort(), Object.keys(value.properties).sort())) {
      throw new Error(path + ": covenant schema object is not closed with all properties required");
    }
  }
  for (const [key, entry] of Object.entries(value)) {
    assertClosedSchemaDocument(entry, path + "/" + key, seen);
  }
}

function loadSchemaPublication(): JsonObject {
  const bytes = readRegularFileWithinRoot(ROOT, EVALUATION_COVENANT_SCHEMA_LOCATOR);
  if (bytes.byteLength !== 257_226 || bytes.byteLength > MAX_SCHEMA_BYTES ||
      sha256(bytes) !== EVALUATION_COVENANT_SCHEMA_BYTE_SHA256) {
    throw new Error("Evaluation Covenant schema byte receipt drifted");
  }
  const schema = parseStrictJsonBytes(bytes, "Evaluation Covenant public snapshot schema");
  if (!object(schema) || schema.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
      schema.$id !== EVALUATION_COVENANT_SCHEMA_URL) {
    throw new Error("Evaluation Covenant schema identity drifted");
  }
  if (sha256(evaluationCovenantCanonicalJson(schema)) !== EVALUATION_COVENANT_SCHEMA_CANONICAL_SHA256) {
    throw new Error("Evaluation Covenant schema canonical receipt drifted");
  }
  assertClosedSchemaDocument(schema);
  return schema;
}

export function evaluationCovenantSchemaIssues(value: unknown): string[] {
  const schema = loadSchemaPublication();
  return schemaIssues(value, schema, "$", schema);
}

function assertBoundedJsonTree(value: unknown, depth = 0, budget = { nodes: 0, strings: 0 }): void {
  if (depth > MAX_TREE_DEPTH) throw new Error("Evaluation Covenant JSON nesting exceeds " + MAX_TREE_DEPTH);
  if (++budget.nodes > MAX_TREE_NODES) throw new Error("Evaluation Covenant JSON node budget exceeded");
  if (typeof value === "string") {
    if (value.length > 24_576) throw new Error("Evaluation Covenant contains an oversized string");
    budget.strings += value.length;
    if (budget.strings > MAX_STRING_CODE_UNITS) throw new Error("Evaluation Covenant string budget exceeded");
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) throw new Error("Evaluation Covenant array budget exceeded");
    value.forEach((entry) => assertBoundedJsonTree(entry, depth + 1, budget));
    return;
  }
  if (object(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (key.length > 160) throw new Error("Evaluation Covenant contains an oversized object key");
      assertBoundedJsonTree(entry, depth + 1, budget);
    }
  }
}

function orderedIds(values: JsonObject[], label: string): Set<string> {
  const ids = values.map((value) => value.id);
  if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length ||
      ids.some((id, index) => index > 0 && ids[index - 1].localeCompare(id) >= 0)) {
    throw new Error(label + " must be uniquely ordered by id");
  }
  return new Set(ids);
}

function references(values: unknown, allowed: Set<string>, label: string, allowEmpty = false): void {
  if (!Array.isArray(values) || (!allowEmpty && values.length === 0) ||
      values.some((id) => typeof id !== "string" || !allowed.has(id)) ||
      new Set(values).size !== values.length) {
    throw new Error(label + " contains an unresolved or duplicate reference");
  }
}

function allFalse(value: unknown, label: string): void {
  if (!object(value) || Object.values(value).some((entry) => entry !== false)) {
    throw new Error(label + " must remain an all-false boundary");
  }
}

function assertNoDecisionOrScoreFields(value: unknown, path = "$", seen = new Set<unknown>()): void {
  if ((object(value) || Array.isArray(value)) && seen.has(value)) return;
  if (object(value) || Array.isArray(value)) seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoDecisionOrScoreFields(entry, path + "/" + index, seen));
    return;
  }
  if (!object(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const declaredNegativeBoundary = path.endsWith("/boundaries") && entry === false;
    if (!declaredNegativeBoundary &&
        /^(?:score|rank|rating|recommendation|preferredOptionId|winner|readiness)$/iu.test(key)) {
      throw new Error(path + "/" + key + ": forbidden score, rank or decision field");
    }
    assertNoDecisionOrScoreFields(entry, path + "/" + key, seen);
  }
}

function assertNoForbiddenTrialFields(value: unknown, path = "$", seen = new Set<unknown>()): void {
  if ((object(value) || Array.isArray(value)) && seen.has(value)) return;
  if (object(value) || Array.isArray(value)) seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenTrialFields(entry, path + "/" + index, seen));
    return;
  }
  if (!object(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const falseBoundary = path.endsWith("/boundaries") && entry === false;
    const declaredNames = path.endsWith("/trialChamberSeparation");
    if (FORBIDDEN_TRIAL_FIELDS.has(key) && !falseBoundary && !declaredNames) {
      throw new Error(path + "/" + key + ": Trial Chamber plan field is forbidden");
    }
    assertNoForbiddenTrialFields(entry, path + "/" + key, seen);
  }
}

function assertNoPersonalRecordShapes(value: unknown, path = "$", seen = new Set<unknown>()): void {
  if (typeof value === "string") {
    if (POSSIBLE_PERSONAL_VALUES.test(value)) {
      throw new Error(path + ": possible personal identifier is forbidden");
    }
    return;
  }
  if (value === null || typeof value === "boolean" || typeof value === "number") return;
  if ((object(value) || Array.isArray(value)) && seen.has(value)) return;
  if (object(value) || Array.isArray(value)) seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoPersonalRecordShapes(entry, path + "/" + index, seen));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    const explicitNegative = entry === false &&
      ["personalData", "personalDataCollection", "personalRecords"].includes(key);
    if (POSSIBLE_PERSONAL_KEYS.test(key) && !explicitNegative) {
      throw new Error(path + "/" + key + ": personal-record-shaped key is forbidden");
    }
    assertNoPersonalRecordShapes(entry, path + "/" + key, seen);
  }
}

function assertNoRealityOrJSpaceBindings(value: unknown, path = "$", seen = new Set<unknown>()): void {
  if (typeof value === "string") {
    if (/(?:\bj[- ]?space\b|\breality[ _-]influence\b)/iu.test(value)) {
      throw new Error(path + ": Reality Influence and J-space are forbidden Covenant bindings");
    }
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoRealityOrJSpaceBindings(entry, path + "/" + index, seen));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (/(?:j[-_ ]?space|reality[-_ ]?influence)/iu.test(key)) {
      throw new Error(path + "/" + key + ": Reality Influence and J-space fields are forbidden");
    }
    assertNoRealityOrJSpaceBindings(entry, path + "/" + key, seen);
  }
}

function computedCounts(snapshot: JsonObject): JsonObject {
  const sum = (path: (design: JsonObject) => unknown[]) =>
    snapshot.designs.reduce((total: number, design: JsonObject) => total + path(design).length, 0);
  return {
    affectedPartyClasses: sum((design) => design.affectedPartyPlan.classes),
    comparators: sum((design) => design.comparators),
    designs: snapshot.designs.length,
    deviations: sum((design) => design.deviations),
    estimands: sum((design) => design.estimands),
    evaluationQuestions: sum((design) => design.evaluationQuestions),
    guardrails: sum((design) => design.guardrails),
    humanGates: sum((design) => design.humanGates),
    measures: sum((design) => design.measures),
    methodSources: snapshot.sources.length,
    stopRules: sum((design) => design.stopRules),
  };
}

function expectedUrls(): JsonObject {
  return {
    canonical: EVALUATION_COVENANT_CANONICAL_URL,
    guide: EVALUATION_COVENANT_GUIDE_URL,
    human: EVALUATION_COVENANT_URL,
    mutableAlias: EVALUATION_COVENANT_ALIAS_URL,
    producer: EVALUATION_COVENANT_PRODUCER_URL,
    repository: EVALUATION_COVENANT_REPOSITORY_URL,
    schema: EVALUATION_COVENANT_SCHEMA_URL,
  };
}

function validateSourceLedger(snapshot: JsonObject): void {
  const ids = orderedIds(snapshot.sources, "Evaluation Covenant sources");
  if (!sameJson([...ids], [...SOURCE_URLS.keys()])) throw new Error("Evaluation Covenant source inventory drifted");
  for (const source of snapshot.sources) {
    if (sha256(evaluationCovenantCanonicalJson(source)) !== SOURCE_CANONICAL_SHA256.get(source.id) ||
        source.url !== SOURCE_URLS.get(source.id) || source.checkedOn !== EVALUATION_COVENANT_AS_OF ||
        source.role !== "method-or-governance-orientation-only" || source.bodyReceipt !== null ||
        source.bodyRetained !== false || source.exactTextHumanReviewed !== false ||
        source.genericOfficialHostIsEvidence !== false || source.rightsOrReuseInferred !== false ||
        source.supportsAuthority !== false || source.supportsDossierOutcome !== false ||
        source.supportsEstimand !== false || source.supportsResult !== false) {
      throw new Error(source.id + ": source escaped method-only non-evidence handling");
    }
  }
  if (Object.entries(snapshot.sourceLedgerPolicy).some(([key, value]) =>
      ["methodOrGovernanceOrientationOnly", "sourceCannotSupplyEmpiricalEstimandOrIdentification", "sourceMayOrientEstimandSpecification"].includes(key)
        ? value !== true
        : value !== false)) {
    throw new Error("Evaluation Covenant source-ledger policy drifted");
  }
}

function validateParentLineage(snapshot: JsonObject): Map<string, JsonObject> {
  const parentPublication = loadUkGovernmentTransformationPublication();
  const parent = parentPublication.snapshot;
  const lineage = snapshot.lineage;
  if (lineage.mode !== "exact-synthetic-design-context-only" || lineage.useAsEvidence !== false ||
      lineage.transformationSnapshot.schema !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_PROTOCOL ||
      lineage.transformationSnapshot.asOf !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_AS_OF ||
      lineage.transformationSnapshot.bytes !== 83_915 ||
      lineage.transformationSnapshot.byteReceipt !== "sha256:" + UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256 ||
      lineage.transformationSnapshot.canonicalReceipt !== "sha256:" + UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_SHA256 ||
      lineage.transformationSnapshot.canonicalUrl !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL ||
      lineage.transformationSnapshot.producerTag !== "https://github.com/cambridgetcg/kingdom-government-transformation-engine/tree/v0.1.0" ||
      lineage.transformationSchema.bytes !== 47_800 ||
      lineage.transformationSchema.byteReceipt !== "sha256:" + UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_BYTE_SHA256 ||
      lineage.transformationSchema.url !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL ||
      lineage.transformationGuide.bytes !== 6_770 ||
      lineage.transformationGuide.byteReceipt !== "sha256:" + UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_BYTE_SHA256 ||
      lineage.transformationGuide.url !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL) {
    throw new Error("Evaluation Covenant Transformation lineage receipt drifted");
  }
  if (parentPublication.bytes.byteLength !== lineage.transformationSnapshot.bytes ||
      sha256(parentPublication.bytes) !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256 ||
      sha256(evaluationCovenantCanonicalJson(parent)) !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_SHA256) {
    throw new Error("Evaluation Covenant admitted parent bytes drifted");
  }
  const dossiers = new Map(parent.dossiers.map((dossier: JsonObject) => [dossier.id, dossier]));
  const bindingIdList = lineage.dossierBindings.map((binding: JsonObject) => binding.dossierId);
  const bindingIds = new Set<string>(bindingIdList);
  if (bindingIds.size !== bindingIdList.length ||
      bindingIdList.some((id: string, index: number) =>
        index > 0 && bindingIdList[index - 1].localeCompare(id) >= 0) ||
      bindingIds.size !== parent.dossiers.length || [...bindingIds].some((id) => !dossiers.has(id))) {
    throw new Error("Evaluation Covenant dossier binding inventory drifted");
  }
  for (const binding of lineage.dossierBindings) {
    const dossier = dossiers.get(binding.dossierId)!;
    const nodeIds = new Set(dossier.causalChangeHypothesisGraph.nodes.map((node: JsonObject) => node.id));
    const optionIds = new Set(dossier.options.map((option: JsonObject) => option.id));
    const gateIds = new Set(dossier.humanGates.map((gate: JsonObject) => gate.id));
    const outcomeIds = new Set(dossier.desiredOutcomes.map((outcome: JsonObject) => outcome.id));
    if (binding.dossierCanonicalReceipt !== "sha256:" + sha256(evaluationCovenantCanonicalJson(dossier)) ||
        binding.propositionCanonicalReceipt !== dossier.proposition.canonicalReceipt ||
        !outcomeIds.has(binding.outcomeId)) {
      throw new Error(binding.dossierId + ": frozen dossier or proposition receipt drifted");
    }
    references(binding.optionIds, optionIds, binding.dossierId + " option IDs");
    references(binding.gateIds, gateIds, binding.dossierId + " gate IDs");
    references(binding.assumptionNodeIds, nodeIds, binding.dossierId + " assumption nodes");
    references(binding.negativePathwayNodeIds, nodeIds, binding.dossierId + " negative pathway nodes");
    references([binding.evaluationNeedNodeId], nodeIds, binding.dossierId + " evaluation need node");
  }
  return dossiers;
}

function validateDesign(
  design: JsonObject,
  snapshot: JsonObject,
  parentDossiers: Map<string, JsonObject>,
  sourceIds: Set<string>,
): void {
  if (design.synthetic !== true || typeof design.title !== "string" || !design.title.startsWith("Synthetic ") ||
      !sameJson(design.state, EXPECTED_STATE)) {
    throw new Error(design.id + ": design must remain visibly synthetic and non-progressing");
  }
  allFalse(design.boundaries, design.id + " boundaries");
  const { canonicalReceipt, ...receiptInput } = design;
  if (canonicalReceipt !== "sha256:" + sha256(evaluationCovenantCanonicalJson(receiptInput))) {
    throw new Error(design.id + ": canonical design receipt drifted");
  }
  if (design.deviations.length !== 0) throw new Error(design.id + ": deviations must remain empty before a run");

  const questions = orderedIds(design.evaluationQuestions, design.id + " questions");
  const measures = orderedIds(design.measures, design.id + " measures");
  const comparators = orderedIds(design.comparators, design.id + " comparators");
  const estimands = orderedIds(design.estimands, design.id + " estimands");
  const guardrails = orderedIds(design.guardrails, design.id + " guardrails");
  const classes = orderedIds(design.affectedPartyPlan.classes, design.id + " affected-party classes");
  orderedIds(design.humanGates, design.id + " human gates");
  orderedIds(design.stopRules, design.id + " stop rules");
  if (design.evaluationQuestions.length !== 3 ||
      !sameJson(design.evaluationQuestions.map((question: JsonObject) => question.type).sort(), QUESTION_TYPES) ||
      !sameJson(design.evaluationTypeContract, {
        distinctQuestionTypes: ["economic", "impact", "process"],
        economicCannotSatisfyImpact: true,
        impactCannotEstablishValueForMoney: true,
        oneTypeCannotSatisfyAnother: true,
        processCannotEstablishCausality: true,
        processCannotEstablishImpact: true,
      })) {
    throw new Error(design.id + ": exactly one process, impact and economic question is required");
  }

  const parent = parentDossiers.get(design.transformationBinding.dossierId);
  const rootBinding = snapshot.lineage.dossierBindings.find((binding: JsonObject) =>
    binding.dossierId === design.transformationBinding.dossierId);
  if (!parent || !rootBinding || design.transformationBinding.useAsEvidence !== false ||
      design.transformationBinding.dossierCanonicalReceipt !==
        "sha256:" + sha256(evaluationCovenantCanonicalJson(parent)) ||
      design.transformationBinding.propositionCanonicalReceipt !== parent.proposition.canonicalReceipt ||
      design.transformationBinding.transformationOutcomeId !== rootBinding.outcomeId ||
      !sameJson(design.transformationBinding.assumptionNodeIds, rootBinding.assumptionNodeIds) ||
      !sameJson(design.transformationBinding.negativePathwayNodeIds, rootBinding.negativePathwayNodeIds) ||
      design.transformationBinding.evaluationNeedNodeId !== rootBinding.evaluationNeedNodeId ||
      !sameJson(design.transformationBinding.optionIds, rootBinding.optionIds) ||
      !sameJson(design.transformationBinding.humanGateIds, rootBinding.gateIds)) {
    throw new Error(design.id + ": Transformation binding drifted");
  }
  const parentNodes = new Map(parent.causalChangeHypothesisGraph.nodes.map((node: JsonObject) => [node.id, node]));
  const parentEdges = new Map(parent.causalChangeHypothesisGraph.edges.map((edge: JsonObject) => [edge.id, edge]));
  if (design.theoryBinding.claimsCausalTruth !== false || design.theoryBinding.copiedNarrative !== false ||
      design.theoryBinding.tested !== false || design.theoryBinding.theoryValidated !== false ||
      design.theoryBinding.desiredOutcomeId !== design.transformationBinding.transformationOutcomeId ||
      !sameJson(design.theoryBinding.assumptionNodeIds, design.transformationBinding.assumptionNodeIds) ||
      !sameJson(design.theoryBinding.negativePathwayNodeIds, design.transformationBinding.negativePathwayNodeIds) ||
      design.theoryBinding.evaluationNeedNodeId !== design.transformationBinding.evaluationNeedNodeId) {
    throw new Error(design.id + ": desired-outcome theory escaped hypothesis-only state");
  }
  if (design.theoryBinding.optionToOutputEdges.length !== 3) {
    throw new Error(design.id + ": exactly three inherited option-to-output hypothesis edges are required");
  }
  for (const edgeBinding of design.theoryBinding.optionToOutputEdges) {
    const edge = parentEdges.get(edgeBinding.edgeId);
    if (!edge || edge.fromId !== edgeBinding.fromId || edge.toId !== edgeBinding.toId ||
        edge.type !== "hypothesises-contribution" ||
        !parentNodes.has(edge.fromId) || !parentNodes.has(edge.toId)) {
      throw new Error(design.id + ": option-to-output hypothesis edge did not resolve exactly");
    }
  }

  for (const question of design.evaluationQuestions) {
    if (question.answerState !== "NOT-ANSWERED" || question.result !== null || question.authorityEffect !== "NONE") {
      throw new Error(question.id + ": question acquired an answer, result or authority");
    }
    references(question.measureIds, measures, question.id + " measures");
    references(question.affectedPartyClassIds, classes, question.id + " affected parties");
    const roles = question.measureIds.map((id: string) =>
      design.measures.find((measure: JsonObject) => measure.id === id)?.role);
    if ((question.type === "process" && roles.some((role: string) =>
        !["process", "qualitative"].includes(role))) ||
        (question.type === "impact" && roles.some((role: string) => role !== "outcome")) ||
        (question.type === "economic" && roles.some((role: string) => role !== "economic"))) {
      throw new Error(question.id + ": measure roles do not match the question type");
    }
    if (!sameJson(question.transformationOutcomeIds, [design.transformationBinding.transformationOutcomeId])) {
      throw new Error(question.id + ": desired-outcome hypothesis binding drifted");
    }
  }
  for (const measure of design.measures) {
    if (!MEASURE_ROLES.has(measure.role) || measure.value !== null || measure.definitionFrozen !== false ||
        measure.targetStatus !== "NOT-A-TARGET" || measure.authorityEffect !== "NONE" ||
        measure.sourceRefs.length !== 0 || measure.numeratorDefinition !== null ||
        measure.denominatorDefinition !== null) {
      throw new Error(measure.id + ": measure state, target, value, definition or source firewall drifted");
    }
    references(measure.questionIds, questions, measure.id + " questions");
    references(measure.guardrailIds, guardrails, measure.id + " guardrails", true);
    references(measure.sourceRefs, sourceIds, measure.id + " method sources", true);
    const questionsUsingMeasure = design.evaluationQuestions
      .filter((question: JsonObject) => question.measureIds.includes(measure.id))
      .map((question: JsonObject) => question.id).sort();
    if (!sameJson([...measure.questionIds].sort(), questionsUsingMeasure)) {
      throw new Error(measure.id + ": bidirectional question coverage drifted");
    }
    if (measure.role === "outcome" &&
        (measure.gamingHazardIds.length === 0 || measure.guardrailIds.length === 0)) {
      throw new Error(measure.id + ": outcome measures require gaming hazards and guardrails");
    }
  }
  const usedMeasures = new Set(design.evaluationQuestions.flatMap((question: JsonObject) => question.measureIds));
  if (!sameJson([...usedMeasures].sort(), [...measures].sort())) {
    throw new Error(design.id + ": every and only declared measure must be used by a question");
  }
  const parentOptions = new Set(parent.options.map((option: JsonObject) => option.id));
  if (design.comparators.length !== 3 ||
      design.comparators.filter((comparator: JsonObject) => comparator.role === "business-as-usual").length !== 1 ||
      design.comparators.filter((comparator: JsonObject) => comparator.role === "candidate-alternative").length !== 2 ||
      !sameJson(
        design.comparators.map((comparator: JsonObject) => comparator.transformationOptionId),
        design.transformationBinding.optionIds,
      )) {
    throw new Error(design.id + ": exact BAU and two-alternative parent option mapping drifted");
  }
  for (const comparator of design.comparators) {
    if (comparator.assigned !== false || comparator.implemented !== false || comparator.selected !== false ||
        comparator.exposureState !== "NONE" || !parentOptions.has(comparator.transformationOptionId)) {
      throw new Error(comparator.id + ": comparator acquired assignment, implementation, selection or exposure");
    }
  }
  const impactQuestion = design.evaluationQuestions.find((question: JsonObject) => question.type === "impact")!;
  const bauComparator = design.comparators.find((comparator: JsonObject) => comparator.role === "business-as-usual")!;
  const alternativeComparators = design.comparators.filter((comparator: JsonObject) =>
    comparator.role === "candidate-alternative");
  const requiredEstimandPairs = new Set(alternativeComparators.flatMap((comparator: JsonObject) =>
    impactQuestion.measureIds.map((measureId: string) => comparator.id + "\u0000" + measureId)));
  const actualEstimandPairs = new Set<string>();
  for (const estimand of design.estimands) {
    if (estimand.estimate !== null || estimand.uncertainty !== null || estimand.causalStatus !== "NOT-CLAIMED" ||
        estimand.identificationState !== "NOT-ASSESSED" ||
        estimand.impactQuestionId !== impactQuestion.id ||
        estimand.referenceComparatorId !== bauComparator.id ||
        !alternativeComparators.some((comparator: JsonObject) => comparator.id === estimand.treatmentComparatorId) ||
        !impactQuestion.measureIds.includes(estimand.outcomeMeasureId)) {
      throw new Error(estimand.id + ": estimand acquired an estimate or causal claim");
    }
    references([estimand.impactQuestionId], questions, estimand.id + " impact question");
    references([estimand.outcomeMeasureId], measures, estimand.id + " outcome measure");
    references([estimand.referenceComparatorId, estimand.treatmentComparatorId], comparators, estimand.id + " comparators");
    actualEstimandPairs.add(estimand.treatmentComparatorId + "\u0000" + estimand.outcomeMeasureId);
  }
  if (actualEstimandPairs.size !== design.estimands.length ||
      !sameJson([...actualEstimandPairs].sort(), [...requiredEstimandPairs].sort())) {
    throw new Error(design.id + ": each alternative × outcome-measure pair needs one estimand against BAU");
  }
  const coveredNegativePathways = new Set<string>();
  const measuresWithGuardrails = new Set<string>();
  for (const guardrail of design.guardrails) {
    if (guardrail.result !== null || guardrail.threshold !== null ||
        guardrail.breachState !== "NOT-OBSERVED" || guardrail.stopsInterpretation !== true ||
        guardrail.linkedMeasureIds.length === 0) {
      throw new Error(guardrail.id + ": guardrail acquired an observed result or lost its stop");
    }
    references(guardrail.linkedMeasureIds, measures, guardrail.id + " measures", true);
    references(
      guardrail.protectsAgainst,
      new Set(design.transformationBinding.negativePathwayNodeIds),
      guardrail.id + " exact negative pathways",
    );
    guardrail.protectsAgainst.forEach((id: string) => coveredNegativePathways.add(id));
    guardrail.linkedMeasureIds.forEach((id: string) => measuresWithGuardrails.add(id));
  }
  if (!sameJson(
      [...coveredNegativePathways].sort(),
      [...design.transformationBinding.negativePathwayNodeIds].sort(),
    )) {
    throw new Error(design.id + ": every and only bound negative pathway must be guardrail-covered");
  }
  for (const measure of design.measures.filter((candidate: JsonObject) => candidate.role === "outcome")) {
    if (!measuresWithGuardrails.has(measure.id)) {
      throw new Error(measure.id + ": outcome measure lacks a covering guardrail");
    }
  }
  if (!sameJson(design.distributionPlan.territories, parent.proposition.affectedTerritories) ||
      !sameJson(design.distributionPlan.affectedPartyClassIds, [...classes]) ||
      !sameJson(design.distributionPlan.dimensions, EXPECTED_DISTRIBUTION_DIMENSIONS.get(design.id)) ||
      design.distributionPlan.aggregateCanOverrideHarm !== false ||
      design.distributionPlan.weightedCanReplaceUnweighted !== false ||
      design.distributionPlan.missingOrHarmCanBeAveragedAway !== false ||
      design.distributionPlan.results.length !== 0 ||
      design.distributionPlan.protectedCharacteristicAnalysisState !== "NOT-DESIGNED" ||
      design.distributionPlan.intersectionalAnalysisState !== "NOT-DESIGNED" ||
      design.distributionPlan.smallCellPolicy !== "SUPPRESS-NOT-INFER" ||
      design.distributionPlan.coverageState !== "PLANNED-ONLY" ||
      !sameJson(design.missingnessPlan, EXPECTED_MISSINGNESS_PLAN)) {
    throw new Error(design.id + ": exact distribution or missingness covenant drifted");
  }
  for (const affected of design.affectedPartyPlan.classes) {
    if (affected.representationState !== "MAPPED-NOT-ENGAGED" ||
        affected.engagementState !== "NOT-DESIGNED" ||
        affected.accessibilityState !== "NOT-ASSESSED" ||
        affected.languageState !== "NOT-ASSESSED" || affected.burdenState !== "NOT-ASSESSED" ||
        affected.compensationState !== "NOT-ASSESSED" || affected.dissentPreserved !== true ||
        affected.personalRecords !== false) {
      throw new Error(affected.id + ": affected-party Phase-0 state drifted");
    }
  }
  if (!sameJson(
      design.humanGates.map((gate: JsonObject) => gate.id),
      EXPECTED_GATE_IDS.get(design.id),
    ) || !sameJson(
      design.humanGates.slice(0, 4).map((gate: JsonObject) => gate.kind),
      [
        "affected-party-accessibility-distribution-review",
        "analytical-qa-assurer-distinct-from-analyst",
        "independent-design-reviewer",
        "privacy-ethics-rights-review",
      ],
    ) || design.humanGates.slice(4).some((gate: JsonObject) =>
      gate.kind !== "inherited-transformation-domain-gate") ||
      !sameJson(
        design.humanGates.slice(4).map((gate: JsonObject) => gate.id),
        design.transformationBinding.humanGateIds,
      )) {
    throw new Error(design.id + ": exact local and inherited human-gate inventory drifted");
  }
  for (const gate of design.humanGates) {
    if (gate.required !== true || gate.completed !== false || gate.authorityOutsideSystem !== true ||
        gate.authorityEffect !== "NONE") throw new Error(gate.id + ": human gate progressed or gained authority");
  }
  for (const stop of design.stopRules) {
    if (stop.automatic !== false || stop.observed !== false || stop.authorityEffect !== "NONE" ||
        stop.owner !== "OUTSIDE-SYSTEM" || stop.correctionOrWithdrawalState !== "NOT-ACTIVATED") {
      throw new Error(stop.id + ": stop rule became automatic, observed or activated");
    }
  }

  const plans = design;
  if (plans.processEvaluationPlan.state !== "DESIGN-DRAFT" ||
      !sameJson(plans.processEvaluationPlan.domains, ["accessibility", "comprehension", "fidelity", "implementation", "reach"]) ||
      plans.processEvaluationPlan.canEstablishImpact !== false ||
      plans.processEvaluationPlan.canEstablishCausality !== false ||
      plans.impactEvaluationPlan.state !== "DESIGN-DRAFT" ||
      plans.impactEvaluationPlan.methodSelected !== false ||
      plans.impactEvaluationPlan.canClaimAttribution !== false ||
      plans.impactEvaluationPlan.comparatorFeasibility !== "UNKNOWN" ||
      plans.impactEvaluationPlan.assignmentFeasibility !== "UNKNOWN" ||
      plans.economicEvaluationPlan.state !== "DESIGN-DRAFT" ||
      plans.economicEvaluationPlan.valueForMoneyConclusion !== false ||
      plans.economicEvaluationPlan.spendingAuthority !== false) {
    throw new Error(design.id + ": evaluation-type claim firewall drifted");
  }
  const privacy = plans.privacyEthicsPlan;
  if (privacy.personalData !== false || privacy.specialCategoryData !== false ||
      privacy.criminalOffenceData !== false || privacy.humanParticipants !== false ||
      privacy.dpiaState !== "NOT-STARTED" || privacy.lawfulBasisState !== "NOT-ASSESSED" ||
      privacy.purposeCompatibilityState !== "NOT-ASSESSED" ||
      privacy.ethicsState !== "REQUIRED-NOT-COMPLETED" ||
      privacy.consentState !== "NOT-APPLICABLE-PHASE-0" ||
      privacy.reidentificationRiskState !== "NOT-ASSESSED" || privacy.publicMicrodata !== false ||
      privacy.rawFeedback !== false || privacy.futureChangeRequiresNewMajorContract !== true) {
    throw new Error(design.id + ": privacy and ethics Phase-0 boundary drifted");
  }
  const affected = plans.affectedPartyPlan;
  if (affected.state !== "MAPPED-NOT-ENGAGED" ||
      affected.participationIsRepresentation !== false || affected.participationIsConsent !== false ||
      affected.participationIsEndorsement !== false || affected.silenceIsAcceptance !== false) {
    throw new Error(design.id + ": affected-party participation contract drifted");
  }
  const qa = plans.qualityAssurancePlan;
  if (qa.state !== "NOT-PERFORMED" || qa.analystAndAssurerDistinct !== true ||
      qa.reproducibilityPlanState !== "NOT-DESIGNED" || qa.peerReviewState !== "NOT-PERFORMED" ||
      qa.signOffState !== "NOT-PERFORMED" || qa.qualityAssuranceIsApproval !== false ||
      qa.records.length !== 0 || qa.analystRole === qa.assurerRole) {
    throw new Error(design.id + ": independent analytical QA contract drifted");
  }
  const publication = plans.publicationPlan;
  const withholding = publication.withholdingPolicy;
  if (publication.resultsExist !== false || publication.protocolRegistered !== false ||
      publication.resultRoutes.length !== 0 || publication.technicalAnnexRequired !== true ||
      publication.methodDeviationsRequired !== true || publication.uncertaintyRequired !== true ||
      publication.distributionRequired !== true || publication.negativeAndNullResultsInScope !== true ||
      publication.publicationAuthority !== "OUTSIDE-SYSTEM" || publication.publicationDecisionRecords.length !== 0 ||
      withholding.phase0ResultsExist !== false || withholding.rawDataPublished !== false ||
      withholding.outcomeDirectionIsAllowedGround !== false || withholding.reasonAndScopeMustBeRecorded !== true ||
      withholding.minimumNecessaryWithholding !== true ||
      withholding.redactionAggregationOrPartialPublicationMustBeConsidered !== true ||
      withholding.humanReviewRequired !== true || withholding.humanReviewCompleted !== false ||
      withholding.decisionAuthority !== "OUTSIDE-SYSTEM" ||
      withholding.withholdingDecisionState !== "NOT-APPLICABLE-NO-RESULT" ||
      withholding.publicNoticeState !== "NOT-APPLICABLE-PHASE-0" ||
      !sameJson(withholding.allowedGrounds, [
        "confidentiality", "legal-restriction", "privacy-and-data-protection",
        "rights-and-licensing", "risk-of-harm", "security",
      ])) {
    throw new Error(design.id + ": publication or governed-withholding contract drifted");
  }
  const nulls = plans.nullResultPolicy;
  if (nulls.outcomeBasedSuppressionAllowed !== false ||
      nulls.negativeOrNullOutcomeAloneCannotJustifySuppression !== true ||
      nulls.selectiveOutcomeReportingForbidden !== true ||
      nulls.publicationSubjectToGovernedWithholding !== true ||
      nulls.privacyRightsLegalSecurityPrecedence !== true ||
      nulls.restrictedMaterialCannotBeReplacedByMisleadingPositiveSummary !== true ||
      nulls.noResultIsNullResult !== false || nulls.nullIsNoEffect !== false ||
      nulls.nullIsFailure !== false || nulls.nullIsSuccess !== false ||
      nulls.equivalenceRequiresMarginAndDesign !== true || nulls.inconclusivePreserved !== true ||
      nulls.interpretationRequiresHumanReview !== true) {
    throw new Error(design.id + ": null-result and outcome-neutral transparency contract drifted");
  }
  if (plans.threatModel.hostilePromptTextInert !== true || plans.threatModel.htmlTextInert !== true ||
      plans.threatModel.urlTextInert !== true || plans.threatModel.consumerMustEscapeUntrustedText !== true ||
      plans.threatModel.sourceUrlAllowlistEnforced !== true ||
      plans.threatModel.forbiddenTrialFieldScannerApplied !== true ||
      plans.threatModel.actionSurface !== "NONE") {
    throw new Error(design.id + ": inert-content threat model drifted");
  }
  if (plans.dataPlan.dataCollection !== false || plans.dataPlan.datasetRefs.length !== 0 ||
      plans.dataPlan.administrativeData !== false || plans.dataPlan.monitoringData !== false ||
      plans.dataPlan.qualitativeData !== false || plans.dataPlan.surveyData !== false || plans.dataPlan.linkage !== false ||
      plans.affectedPartyPlan.participantRecords.length !== 0 || plans.affectedPartyPlan.contactRecords.length !== 0 ||
      plans.affectedPartyPlan.engagementRecords.length !== 0 || plans.affectedPartyPlan.state !== "MAPPED-NOT-ENGAGED" ||
      plans.privacyEthicsPlan.humanParticipants !== false || plans.privacyEthicsPlan.personalData !== false ||
      plans.impactEvaluationPlan.result !== null || plans.impactEvaluationPlan.methodSelected !== false ||
      plans.impactEvaluationPlan.canClaimAttribution !== false || plans.processEvaluationPlan.result !== null ||
      plans.processEvaluationPlan.canEstablishCausality !== false || plans.processEvaluationPlan.canEstablishImpact !== false ||
      plans.economicEvaluationPlan.result !== null || plans.economicEvaluationPlan.benefitCostRatio !== null ||
      plans.economicEvaluationPlan.netPresentValue !== null || plans.economicEvaluationPlan.valueForMoneyConclusion !== false ||
      Object.values(plans.economicEvaluationPlan.amounts).some((value) => value !== null) ||
      plans.missingnessPlan.results.length !== 0 || plans.distributionPlan.results.length !== 0 ||
      plans.publicationPlan.resultsExist !== false || plans.publicationPlan.resultRoutes.length !== 0 ||
      plans.publicationPlan.publicationDecisionRecords.length !== 0 || plans.publicationPlan.protocolRegistered !== false ||
      plans.qualityAssurancePlan.records.length !== 0 || plans.nullResultPolicy.noResultIsNullResult !== false) {
    throw new Error(design.id + ": Phase-0 no-data/no-participant/no-result firewall drifted");
  }
}

export function validateEvaluationCovenantSnapshot(value: unknown): JsonObject {
  assertBoundedJsonTree(value);
  const issues = evaluationCovenantSchemaIssues(value);
  if (issues.length) throw new Error("Evaluation Covenant schema validation failed: " + issues.slice(0, 8).join("; "));
  if (!object(value)) throw new Error("Evaluation Covenant snapshot must be an object");
  if (value.contractVersion !== "0.1.0" || value.schema !== EVALUATION_COVENANT_PROTOCOL ||
      value.title !== "KINGDOM Evaluation Covenant: Synthetic Transformation Designs" ||
      value.asOf !== EVALUATION_COVENANT_AS_OF ||
      !sameJson(value.phase, { id: "0-static-synthetic-design", scope: "evaluation-design-only" }) ||
      !sameJson(value.covenantState, EXPECTED_STATE) || !sameJson(value.urls, expectedUrls())) {
    throw new Error("Evaluation Covenant snapshot identity or state drifted");
  }
  if (!sameJson(value.freshness, {
    historicalStateAfterDeadline: "HISTORICAL-DESIGN-ONLY",
    mutableAliasPolicy: "REPLACE-OR-RETIRE",
    nextReviewDue: EVALUATION_COVENANT_NEXT_REVIEW_DUE,
    readerClockEmbedded: false,
    releaseGateRequired: true,
    reviewDeadlineInheritedFromTransformation: true,
    stateAtPublication: "WITHIN-REVIEW-WINDOW",
  })) throw new Error("Evaluation Covenant freshness contract drifted");
  if (value.authorship.exactTextHumanReviewed !== false || value.authorship.humanReviewCompleted !== false ||
      value.authorship.humanReviewRequired !== true || value.authorship.compiledBy !== "codex-assisted-publication") {
    throw new Error("Evaluation Covenant authorship boundary drifted");
  }
  allFalse(value.boundaries, "Evaluation Covenant root boundaries");
  if (!sameJson(value.counts, EXPECTED_COUNTS) || !sameJson(value.counts, computedCounts(value))) {
    throw new Error("Evaluation Covenant declared or computed counts drifted");
  }
  if (!sameJson(value.designs.map((design: JsonObject) => design.id), DESIGN_IDS)) {
    throw new Error("Evaluation Covenant design inventory drifted");
  }
  if (value.buildProvenance.networkUsed !== false || value.buildProvenance.offline !== true ||
      value.buildProvenance.clockRead !== false || value.buildProvenance.deterministic !== true ||
      value.buildProvenance.schemaByteReceipt !== "sha256:" + EVALUATION_COVENANT_SCHEMA_BYTE_SHA256 ||
      value.buildProvenance.schemaCanonicalReceipt !== "sha256:" + EVALUATION_COVENANT_SCHEMA_CANONICAL_SHA256 ||
      value.buildProvenance.transformationSnapshotByteReceipt !== "sha256:" + UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256 ||
      value.buildProvenance.transformationSnapshotCanonicalReceipt !== "sha256:" + UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_SHA256) {
    throw new Error("Evaluation Covenant build provenance drifted");
  }
  validateSourceLedger(value);
  const parentDossiers = validateParentLineage(value);
  const sourceIds = new Set(value.sources.map((source: JsonObject) => source.id));
  value.designs.forEach((design: JsonObject) => validateDesign(design, value, parentDossiers, sourceIds));
  if (!sameJson(value.trialChamberSeparation, {
    duplicatesTrialPlan: false,
    evaluationCovenantOwns: "intervention-level-evaluation-design-only",
    forbiddenTrialPlanFields: [...FORBIDDEN_TRIAL_FIELDS],
    trialChamberCompatibility: "not-applicable",
    trialChamberOwns: "artifact-and-source-trial-planning",
    trialChamberPlanRefs: [],
  })) {
    throw new Error("Evaluation Covenant crossed into Trial Chamber planning");
  }
  if (!sameJson(value.relatedResources, [
    {
      authority: false,
      contentProjected: false,
      duplicatedContent: false,
      evidence: false,
      id: "related:transformation-engine",
      navigationOnly: true,
      relationship: "frozen-design-context-producer",
      url: "https://github.com/cambridgetcg/kingdom-government-transformation-engine/tree/v0.1.0",
    },
    {
      authority: false,
      contentProjected: false,
      duplicatedContent: false,
      evidence: false,
      id: "related:trial-chamber",
      navigationOnly: true,
      relationship: "adjacent-artifact-trial-planning-system",
      url: "https://thekingdom.dev/trials.json",
    },
  ])) throw new Error("Evaluation Covenant exact related-resource inventory drifted");
  assertNoDecisionOrScoreFields(value);
  assertNoForbiddenTrialFields(value);
  assertNoPersonalRecordShapes(value);
  assertNoRealityOrJSpaceBindings(value);
  return value;
}

export function parseEvaluationCovenantSnapshotBytes(bytes: Uint8Array): JsonObject {
  if (bytes.byteLength > MAX_SNAPSHOT_BYTES) {
    throw new Error("Evaluation Covenant snapshot exceeds " + MAX_SNAPSHOT_BYTES + " bytes");
  }
  return validateEvaluationCovenantSnapshot(parseStrictJsonBytes(bytes, "Evaluation Covenant snapshot"));
}

export function loadEvaluationCovenantPublication(
  locator = EVALUATION_COVENANT_LOCATOR,
): { snapshot: JsonObject; bytes: Uint8Array } {
  try {
    const bytes = readRegularFileWithinRoot(ROOT, locator);
    if (bytes.byteLength !== 127_383 || sha256(bytes) !== EVALUATION_COVENANT_BYTE_SHA256) {
      throw new Error("authored snapshot byte receipt drifted");
    }
    const snapshot = parseEvaluationCovenantSnapshotBytes(bytes);
    if (sha256(evaluationCovenantCanonicalJson(snapshot)) !== EVALUATION_COVENANT_CANONICAL_SHA256) {
      throw new Error("authored snapshot canonical receipt drifted");
    }
    return { snapshot, bytes };
  } catch (error) {
    throw new Error("Evaluation Covenant authored snapshot is missing or invalid: " + (error as Error).message);
  }
}

export function loadEvaluationCovenantSnapshot(): JsonObject {
  return loadEvaluationCovenantPublication().snapshot;
}

export function assertEvaluationCovenantActiveReviewWindow(
  checkedOn: string | Date,
  active = true,
): { active: boolean; checkedOn: string; nextReviewDue: string; state: "retired" | "within-review-window" } {
  const date = checkedOn instanceof Date ? checkedOn.toISOString().slice(0, 10) : checkedOn;
  if (typeof date !== "string" || !validDate(date)) {
    throw new Error("Evaluation Covenant release date must be YYYY-MM-DD");
  }
  if (!active) return { active, checkedOn: date, nextReviewDue: EVALUATION_COVENANT_NEXT_REVIEW_DUE, state: "retired" };
  if (date > EVALUATION_COVENANT_NEXT_REVIEW_DUE) {
    throw new Error("Evaluation Covenant active family is historical after " + EVALUATION_COVENANT_NEXT_REVIEW_DUE +
      "; replace or fully retire all five routes before deployment");
  }
  return { active, checkedOn: date, nextReviewDue: EVALUATION_COVENANT_NEXT_REVIEW_DUE, state: "within-review-window" };
}

export function evaluationCovenantPublicSummary(
  snapshot = loadEvaluationCovenantSnapshot(),
): JsonObject {
  validateEvaluationCovenantSnapshot(snapshot);
  return {
    protocol: EVALUATION_COVENANT_PROTOCOL,
    title: "Evaluation Covenant",
    contract_version: snapshot.contractVersion,
    publication_state: "immutable-dated-snapshot-with-mutable-alias",
    state_at_publication: snapshot.freshness.stateAtPublication,
    reader_time_state_embedded: false,
    as_of: snapshot.asOf,
    next_review_due: snapshot.freshness.nextReviewDue,
    phase: snapshot.phase,
    covenant_state: snapshot.covenantState,
    authorship: snapshot.authorship,
    counts: snapshot.counts,
    question: "What would count as evidence—before results can tempt us?",
    parent_transformation_engine: {
      canonical_url: snapshot.lineage.transformationSnapshot.canonicalUrl,
      byte_receipt: snapshot.lineage.transformationSnapshot.byteReceipt,
      canonical_receipt: snapshot.lineage.transformationSnapshot.canonicalReceipt,
      use_as_evidence: false,
    },
    designs: snapshot.designs.map((design: JsonObject) => ({
      id: design.id,
      title: design.title,
      synthetic: design.synthetic,
      state: design.state,
      parent_dossier_id: design.transformationBinding.dossierId,
      desired_outcome_hypothesis_id: design.theoryBinding.desiredOutcomeId,
      claims_causal_truth: false,
      questions: design.evaluationQuestions.map((question: JsonObject) => ({
        id: question.id,
        type: question.type,
        answer_state: question.answerState,
        result: null,
      })),
      human_gates: design.humanGates.map((gate: JsonObject) => ({
        id: gate.id,
        required: true,
        completed: false,
        authority_outside_system: true,
      })),
      no_data: design.dataPlan.dataCollection === false,
      no_participants: design.privacyEthicsPlan.humanParticipants === false,
      no_observed_outcome: true,
    })),
    urls: snapshot.urls,
    boundary: snapshot.boundaries,
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

function anchor(id: string): string {
  return "covenant-" + id.replace(/[^a-z0-9]+/giu, "-").replace(/-+$/u, "");
}

function codeList(values: string[], label: string): string {
  return "<ul aria-label=\"" + esc(label) + "\">" +
    values.map((value) => "<li><code>" + esc(value) + "</code></li>").join("") + "</ul>";
}

function factRows(value: unknown, path: string): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "<li><code>" + esc(path) + "</code>: <code>[]</code></li>";
    return "<li><code>" + esc(path) + "</code><ol>" +
      value.map((entry, index) => factRows(entry, path + "[" + index + "]")).join("") +
      "</ol></li>";
  }
  if (object(value)) {
    return "<li><code>" + esc(path) + "</code><ul>" +
      Object.entries(value).map(([key, entry]) =>
        factRows(entry, path + "." + key)).join("") + "</ul></li>";
  }
  const rendered = value === null ? "null" : String(value);
  return "<li><code>" + esc(path) + "</code>: <code>" + esc(rendered) + "</code></li>";
}

function renderFacts(value: unknown, label: string): string {
  return "<ul class=\"facts\" aria-label=\"" + esc(label) + "\">" +
    factRows(value, label) + "</ul>";
}

function methodSourceLink(source: JsonObject): string {
  if (SOURCE_URLS.get(source.id) !== source.url) {
    throw new Error(source.id + ": method-source link escaped its exact allowlist");
  }
  const parsed = new URL(source.url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
      !["www.gov.uk", "ico.org.uk"].includes(parsed.hostname)) {
    throw new Error(source.id + ": method-source URL is not an allowlisted HTTPS host");
  }
  return "<a href=\"" + esc(source.url) + "\" rel=\"external\">" + esc(source.title) + "</a>";
}

function renderDesign(design: JsonObject, snapshot: JsonObject): string {
  const measures = new Map(design.measures.map((measure: JsonObject) => [measure.id, measure]));
  const comparators = new Map(design.comparators.map((comparator: JsonObject) => [comparator.id, comparator]));
  const { classes: _classes, ...affectedPartyRules } = design.affectedPartyPlan;
  return "<article class=\"design\" id=\"" + esc(anchor(design.id)) + "\">" +
    "<header><p class=\"tag\">Synthetic evaluation design · Phase 0</p><h2>" + esc(design.title) +
    "</h2><p><code>" + esc(design.id) + "</code></p><p class=\"purpose\">" + esc(design.purpose) + "</p></header>" +
    "<aside class=\"warning\"><strong>State at publication only:</strong> <code>" +
    esc(snapshot.freshness.stateAtPublication) + "</code>, as of <time datetime=\"" + esc(snapshot.asOf) + "\">" +
    esc(snapshot.asOf) + "</time>; next review due <time datetime=\"" + esc(snapshot.freshness.nextReviewDue) + "\">" +
    esc(snapshot.freshness.nextReviewDue) + "</time>. This design is draft, unsealed, unregistered and unrun. It has no data, participants, result or observed outcome; it is not current after the deadline without replacement.</aside>" +
    "<section class=\"held\" aria-labelledby=\"" + esc(anchor(design.id) + "-held") + "\"><p class=\"tag\">Why held</p><h3 id=\"" +
    esc(anchor(design.id) + "-held") + "\">Human review and evidence are missing</h3><p><code>DRAFT</code> · <code>UNSEALED</code> · <code>UNREGISTERED</code> · <code>NO-RUN</code> · <code>NO-RESULT</code>. Publication cannot progress any state.</p><div class=\"card-grid\">" +
    design.humanGates.map((gate: JsonObject) => "<article class=\"card\"><p class=\"tag\">Human gate</p><h4>" + esc(human(gate.kind)) +
      "</h4><p><code>" + esc(gate.id) + "</code></p><p><code>required:true</code> · <code>completed:false</code> · <code>authorityOutsideSystem:true</code></p></article>").join("") +
    "</div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-parent") + "\"><p class=\"tag\">Frozen parent hypothesis</p><h3 id=\"" +
    esc(anchor(design.id) + "-parent") + "\">Transformation lineage, not evidence</h3><p>Parent dossier <code>" +
    esc(design.transformationBinding.dossierId) + "</code>; desired-outcome hypothesis <code>" +
    esc(design.theoryBinding.desiredOutcomeId) + "</code>. <code>useAsEvidence:false</code> · <code>claimsCausalTruth:false</code> · <code>tested:false</code> · <code>theoryValidated:false</code>.</p><p><a href=\"/government/uk-government-transformation-engine-2026-08-21.json\">Inspect the admitted immutable Transformation Engine snapshot</a>.</p></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-questions") + "\"><p class=\"tag\">Questions before results</p><h3 id=\"" +
    esc(anchor(design.id) + "-questions") + "\">Process, impact and economic questions remain distinct</h3><div class=\"card-grid\">" +
    design.evaluationQuestions.map((question: JsonObject) => "<article class=\"card\"><p class=\"tag\"><code>" + esc(question.type) +
      "</code></p><h4>" + esc(question.text) + "</h4><p><code>" + esc(question.id) + "</code></p><p><code>answerState:NOT-ANSWERED</code> · <code>result:null</code> · <code>authorityEffect:NONE</code></p>" +
      codeList(question.measureIds, question.id + " proposed measure IDs") + "</article>").join("") + "</div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-plans") + "\"><p class=\"tag\">Evaluation types stay separate</p><h3 id=\"" +
    esc(anchor(design.id) + "-plans") + "\">Process, impact and economic plans remain draft and result-free</h3><p>Method candidates are design possibilities only. No method, assignment, comparator, identification strategy, attribution, spending authority or value-for-money conclusion is selected or established.</p><div class=\"fact-grid\"><article class=\"fact-panel\"><h4>Evaluation-type contract</h4>" +
    renderFacts(design.evaluationTypeContract, design.id + " evaluationTypeContract") +
    "</article><article class=\"fact-panel\"><h4>Process evaluation plan</h4>" +
    renderFacts(design.processEvaluationPlan, design.id + " processEvaluationPlan") +
    "</article><article class=\"fact-panel\"><h4>Impact evaluation plan</h4>" +
    renderFacts(design.impactEvaluationPlan, design.id + " impactEvaluationPlan") +
    "</article><article class=\"fact-panel\"><h4>Economic evaluation plan</h4>" +
    renderFacts(design.economicEvaluationPlan, design.id + " economicEvaluationPlan") + "</article></div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-measures") + "\"><p class=\"tag\">Measures are not targets</p><h3 id=\"" +
    esc(anchor(design.id) + "-measures") + "\">Definitions remain unsealed and valueless</h3><div class=\"card-grid\">" +
    design.measures.map((measure: JsonObject) => "<article class=\"card\"><p class=\"tag\"><code>" + esc(measure.role) +
      "</code></p><h4>" + esc(measure.label) + "</h4><p>" + esc(measure.definition) + "</p><p><code>" + esc(measure.id) +
      "</code></p><p><code>value:null</code> · <code>targetStatus:NOT-A-TARGET</code> · <code>definitionFrozen:false</code></p><p><strong>Limitation:</strong> " +
      esc(measure.limitations) + "</p>" +
      codeList(measure.gamingHazardIds, measure.id + " gaming-hazard IDs") +
      codeList(measure.guardrailIds, measure.id + " guardrail IDs") +
      codeList(measure.sourceRefs, measure.id + " method-source IDs") + "</article>").join("") + "</div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-comparators") + "\"><p class=\"tag\">Synthetic comparators</p><h3 id=\"" +
    esc(anchor(design.id) + "-comparators") + "\">No assignment, exposure, implementation or selection</h3><p>Order and placement do not indicate preference or rank.</p><div class=\"card-grid\">" +
    design.comparators.map((comparator: JsonObject) => "<article class=\"card\"><p class=\"tag\"><code>" + esc(comparator.role) +
      "</code></p><h4>" + esc(comparator.description) + "</h4><p><code>" + esc(comparator.id) + "</code> → parent option <code>" +
      esc(comparator.transformationOptionId) + "</code></p><p><code>assigned:false</code> · <code>implemented:false</code> · <code>selected:false</code> · <code>exposureState:NONE</code></p></article>").join("") +
    "</div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-estimands") + "\"><p class=\"tag\">Estimands are specifications, not estimates</p><h3 id=\"" +
    esc(anchor(design.id) + "-estimands") + "\">Identification remains unassessed</h3><div class=\"card-grid\">" +
    design.estimands.map((estimand: JsonObject) => "<article class=\"card\"><h4>" + esc(estimand.label) + "</h4><p>" + esc(estimand.contrast) +
      "</p><p><code>" + esc(estimand.id) + "</code></p><p>Outcome-measure design: <code>" + esc(measures.get(estimand.outcomeMeasureId)?.id) +
      "</code>. Reference: <code>" + esc(comparators.get(estimand.referenceComparatorId)?.id) + "</code>; treatment: <code>" +
      esc(comparators.get(estimand.treatmentComparatorId)?.id) + "</code>.</p><p><code>estimate:null</code> · <code>uncertainty:null</code> · <code>causalStatus:NOT-CLAIMED</code></p></article>").join("") + "</div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-distribution") + "\"><p class=\"tag\">Distribution and missingness before aggregation</p><h3 id=\"" +
    esc(anchor(design.id) + "-distribution") + "\">Missing, unrepresented and harmed groups cannot be averaged away</h3><p><code>aggregateCanOverrideHarm:false</code> · <code>missingOrHarmCanBeAveragedAway:false</code> · <code>missingNotZero:true</code> · <code>missingNotNoEffect:true</code>. Exact territories, dimensions, small-cell handling, weighting limits, missingness kinds and the critical-class stop remain visible below.</p><div class=\"fact-grid\"><article class=\"fact-panel\"><h4>Distribution plan</h4>" +
    renderFacts(design.distributionPlan, design.id + " distributionPlan") +
    "</article><article class=\"fact-panel\"><h4>Missingness plan</h4>" +
    renderFacts(design.missingnessPlan, design.id + " missingnessPlan") +
    "</article><article class=\"fact-panel\"><h4>Affected-party rules</h4>" +
    renderFacts(affectedPartyRules, design.id + " affectedPartyPlan rules") + "</article></div><div class=\"card-grid\">" +
    design.affectedPartyPlan.classes.map((party: JsonObject) => "<article class=\"card\"><p class=\"tag\">Mapped, not engaged</p><h4>" +
      esc(human(party.roleClass)) + "</h4><p><code>" + esc(party.id) + "</code></p><p>" + esc(party.howAffectedHypothesis) +
      "</p><p><strong>Unrepresented risk:</strong> " + esc(party.unrepresentedRisk) + "</p></article>").join("") + "</div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-governance") + "\"><p class=\"tag\">No data, participants or analytical assurance</p><h3 id=\"" +
    esc(anchor(design.id) + "-governance") + "\">Future changes require new authority and a new major contract</h3><div class=\"fact-grid\"><article class=\"fact-panel\"><h4>Data plan</h4>" +
    renderFacts(design.dataPlan, design.id + " dataPlan") +
    "</article><article class=\"fact-panel\"><h4>Privacy and ethics plan</h4>" +
    renderFacts(design.privacyEthicsPlan, design.id + " privacyEthicsPlan") +
    "</article><article class=\"fact-panel\"><h4>Quality-assurance plan</h4>" +
    renderFacts(design.qualityAssurancePlan, design.id + " qualityAssurancePlan") + "</article></div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-stops") + "\"><p class=\"tag\">Guardrails and stop rules</p><h3 id=\"" +
    esc(anchor(design.id) + "-stops") + "\">Interpretation must stop before a tempting result</h3><div class=\"card-grid\">" +
    design.guardrails.map((guardrail: JsonObject) => "<article class=\"card\"><p class=\"tag\">Guardrail</p><h4>" + esc(guardrail.forbiddenInference) +
      "</h4><p><code>" + esc(guardrail.id) + "</code> · <code>breachState:NOT-OBSERVED</code> · <code>result:null</code> · <code>stopsInterpretation:true</code></p><p><strong>Observation rule:</strong> " + esc(guardrail.observationRule) + "</p><p><strong>Threshold:</strong> <code>" + esc(guardrail.threshold === null ? "null" : guardrail.threshold) + "</code></p>" +
      codeList(guardrail.linkedMeasureIds, guardrail.id + " linked measure IDs") +
      codeList(guardrail.protectsAgainst, guardrail.id + " negative-pathway IDs") + "</article>").join("") +
    design.stopRules.map((stop: JsonObject) => "<article class=\"card\"><p class=\"tag\">Human-owned stop</p><h4>" + esc(stop.trigger) +
      "</h4><p><code>" + esc(stop.id) + "</code> · <code>effect:" + esc(stop.effect) + "</code> · <code>automatic:false</code> · <code>observed:false</code> · <code>owner:OUTSIDE-SYSTEM</code> · <code>correctionOrWithdrawalState:" + esc(stop.correctionOrWithdrawalState) + "</code></p></article>").join("") +
    "</div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(design.id) + "-publication") + "\"><p class=\"tag\">Publication and null-result covenant</p><h3 id=\"" +
    esc(anchor(design.id) + "-publication") + "\">Null, negative and inconclusive findings cannot be selectively erased</h3><p>No result is not a null result. Outcome direction alone is never a withholding ground. Any future restriction remains human-governed, minimum necessary, reasoned and bounded by privacy, rights, legal, confidentiality, harm and security obligations.</p><div class=\"fact-grid\"><article class=\"fact-panel\"><h4>Publication plan and governed withholding</h4>" +
    renderFacts(design.publicationPlan, design.id + " publicationPlan") +
    "</article><article class=\"fact-panel\"><h4>Null-result policy</h4>" +
    renderFacts(design.nullResultPolicy, design.id + " nullResultPolicy") +
    "</article><article class=\"fact-panel\"><h4>Design interpretation and threat model</h4>" +
    renderFacts(design.interpretationRules, design.id + " interpretationRules") +
    renderFacts(design.threatModel, design.id + " threatModel") + "</article></div></section>" +
    "<section class=\"aspiration\" aria-labelledby=\"" + esc(anchor(design.id) + "-hypothesis") + "\"><p class=\"tag\">Desired outcome comes last</p><h3 id=\"" +
    esc(anchor(design.id) + "-hypothesis") + "\">A hypothesis ID, not an observed outcome</h3><p><code>" + esc(design.theoryBinding.desiredOutcomeId) +
    "</code> is bound only to preserve what a future evaluation might examine. It is not an observation, result, impact claim, prediction, recommendation or decision.</p>" +
    renderFacts(design.theoryBinding.optionToOutputEdges, design.id + " inherited option-to-output hypothesis edges") +
    codeList(design.theoryBinding.assumptionNodeIds, design.id + " inherited assumption nodes") +
    codeList(design.theoryBinding.negativePathwayNodeIds, design.id + " inherited negative pathway nodes") + "</section></article>";
}

function producerLink(): string {
  const parsed = new URL(EVALUATION_COVENANT_PRODUCER_URL);
  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || parsed.username || parsed.password ||
      EVALUATION_COVENANT_PRODUCER_URL !== "https://github.com/cambridgetcg/kingdom-evaluation-covenant/tree/v0.1.0") {
    throw new Error("Evaluation Covenant producer link escaped its exact allowlist");
  }
  return "<a href=\"" + esc(EVALUATION_COVENANT_PRODUCER_URL) + "\" rel=\"external\">pinned producer v0.1.0 source</a>";
}

export function renderEvaluationCovenantHtml(
  snapshot = loadEvaluationCovenantSnapshot(),
): string {
  validateEvaluationCovenantSnapshot(snapshot);
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "  <meta charset=\"utf-8\">",
    "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
    "  <meta name=\"description\" content=\"Independent synthetic Phase-0 Evaluation Covenant designs: draft, unsealed, unregistered and unrun.\">",
    "  <title>Evaluation Covenant · Phase 0 · Draft · Unsealed · Unregistered · No Run</title>",
    "  <link rel=\"canonical\" href=\"/evaluation-covenant/\">",
    "  <link rel=\"alternate\" href=\"/evaluation-covenants.json\" type=\"application/json\" title=\"Mutable alias for the dated Evaluation Covenant snapshot\">",
    "  <link rel=\"alternate\" href=\"/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json\" type=\"application/json\" title=\"Immutable dated Evaluation Covenant snapshot\">",
    "  <link rel=\"describedby\" href=\"/evaluation/schemas/v0.1/public-snapshot.schema.json\" type=\"application/schema+json\" title=\"Evaluation Covenant snapshot schema\">",
    "  <link rel=\"service-doc\" href=\"/EVALUATION-COVENANT-v0.1.md\" type=\"text/markdown\" title=\"Evaluation Covenant guide\">",
    "  <style>",
    "    :root{color-scheme:light dark;--paper:#f2eee5;--ink:#17201f;--muted:#596461;--line:#a8aaa2;--panel:#fffaf0;--accent:#006c67;--focus:#8a4f00}",
    "    @media(prefers-color-scheme:dark){:root{--paper:#0b1414;--ink:#edf3f0;--muted:#acb8b4;--line:#3b4b48;--panel:#121e1d;--accent:#72d8d0;--focus:#ffd078}}",
    "    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:1rem/1.65 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;overflow-wrap:anywhere}",
    "    a{color:var(--accent);text-underline-offset:.2em}a:focus-visible{outline:.2rem solid var(--focus);outline-offset:.2rem}.skip{position:absolute;inset-inline-start:1rem;top:-8rem;background:var(--ink);color:var(--paper);padding:.7rem 1rem;z-index:10}.skip:focus{top:1rem}",
    "    .shell{width:min(76rem,calc(100% - 2rem));margin-inline:auto}.top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.8rem;padding:1.2rem 0;border-bottom:1px solid var(--line)}.top span{display:flex;flex-wrap:wrap;gap:1rem}",
    "    .hero{padding:clamp(2.8rem,8vw,6rem) 0 3rem}.kicker,.tag{text-transform:uppercase;letter-spacing:.1em;font-size:.75rem;font-weight:780;color:var(--accent)}h1,h2,h3,h4{font-family:ui-serif,Georgia,serif;line-height:1.14}h1{font-size:clamp(2.8rem,8vw,6.8rem);max-width:70rem;margin:.16em 0}.lead{font-size:clamp(1.12rem,2.5vw,1.55rem);max-width:60rem}.question{font:700 clamp(1.3rem,3vw,2rem)/1.3 ui-serif,Georgia,serif;max-width:58rem}",
    "    .warning{border:.14rem solid var(--line);background:var(--panel);padding:1rem 1.2rem;border-radius:.7rem;max-width:68rem}.stats,.card-grid,.fact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));gap:.8rem}.stats{margin-top:1.5rem}.stats div,.card,.fact-panel{border:1px solid var(--line);background:var(--panel);padding:1rem;border-radius:.65rem}.stats b{display:block;font:700 1.8rem ui-serif,Georgia,serif}.facts,.facts ul,.facts ol{padding-inline-start:1.2rem}.facts li{margin:.22rem 0}",
    "    .design{padding:3.2rem 0;border-top:.16rem solid var(--ink)}.design>header,.design>section,.design>aside{margin-bottom:2.2rem}.design h2{font-size:clamp(2rem,5vw,4rem);max-width:66rem}.purpose{font-size:1.14rem;max-width:62rem}.held{border-inline-start:.35rem solid var(--accent);padding-inline-start:1rem}.card h4{margin:.2rem 0}.aspiration{border:1px dashed var(--line);padding:1rem;border-radius:.7rem}.negative{columns:2}.footer{padding:2.5rem 0 4rem;color:var(--muted)}code{font-size:.9em}",
    "    @media(max-width:42rem){.top{display:block}.top span{margin-top:.7rem}.negative{columns:1}.shell{width:min(100% - 1rem,76rem)}}",
    "    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}",
    "    @media(forced-colors:active){.warning,.card,.fact-panel,.aspiration{border:1px solid CanvasText}.held{border-inline-start:.35rem solid CanvasText}}",
    "  </style>",
    "</head>",
    "<body>",
    "  <a class=\"skip\" href=\"#main\">Skip to Evaluation Covenant designs</a>",
    "  <nav class=\"shell top\" aria-label=\"Kingdom navigation\"><a href=\"/\">← The Kingdom</a><span><a href=\"/government-transformation-engine/\">parent Transformation Engine</a><a href=\"/evaluation-covenants.json\">mutable JSON alias</a><a href=\"/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json\">dated immutable JSON</a><a href=\"/EVALUATION-COVENANT-v0.1.md\">guide</a></span></nav>",
    "  <main class=\"shell\" id=\"main\" tabindex=\"-1\">",
    "    <header class=\"hero\"><p class=\"kicker\">Evaluation Covenant · Phase 0 · Draft · Unsealed · Unregistered · No Run</p><h1>Design the learning before the result exists.</h1><p class=\"question\">What would count as evidence—before results can tempt us?</p><p class=\"lead\">Three independent synthetic designs make questions, distinctions, missingness, distribution, guardrails and human gates explicit and receipt-visible before any run can produce a result.</p><aside class=\"warning\"><strong>State at publication only:</strong> <code>" + esc(snapshot.freshness.stateAtPublication) + "</code>, as of <time datetime=\"" + esc(snapshot.asOf) + "\">" + esc(snapshot.asOf) + "</time>; next review due <time datetime=\"" + esc(snapshot.freshness.nextReviewDue) + "\">" + esc(snapshot.freshness.nextReviewDue) + "</time>. After that date this immutable artifact is historical, not current. Assisted exact text has not been separately human-reviewed. There is no seal, registration, run, data, participant, result, observed outcome, selection, decision, action or authority. Desired-outcome IDs are inherited hypotheses, not observations.</aside><div class=\"stats\"><div><b>" + snapshot.counts.designs + "</b><span>synthetic draft designs</span></div><div><b>" + snapshot.counts.evaluationQuestions + "</b><span>unanswered questions</span></div><div><b>" + snapshot.counts.estimands + "</b><span>specifications with no estimates</span></div><div><b>" + snapshot.counts.humanGates + "</b><span>required incomplete human gates</span></div></div></header>",
    "    <section aria-labelledby=\"foundation\"><p class=\"tag\">Admitted dependency</p><h2 id=\"foundation\">Exact immutable Transformation Engine context</h2><p>The covenant resolves every dossier, proposition, option, desired-outcome hypothesis, causal node and human gate against the frozen 83,915-byte parent snapshot. That context is not evidence and does not become causal truth. <a href=\"/government/uk-government-transformation-engine-2026-08-21.json\">Inspect the admitted immutable parent JSON</a>.</p><p><code>sha256:" + esc(UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256) + "</code></p></section>",
    "    <section aria-labelledby=\"distinctions\"><p class=\"tag\">Category distinctions</p><h2 id=\"distinctions\">Design is not registration, monitoring is not evaluation, and change is not attribution</h2><div class=\"card-grid\">" + snapshot.interpretationRules.map((rule: string) => "<article class=\"card\"><code>" + esc(rule) + "</code></article>").join("") + "</div></section>",
    "    <section aria-labelledby=\"separation\"><p class=\"tag\">Separation boundaries</p><h2 id=\"separation\">Not a Trial Chamber plan; no Reality Influence or J-space import</h2><p>The Covenant duplicates no Trial Chamber plan. Trial-plan references are exactly empty, compatibility is <code>not-applicable</code>, and artifact, runner, execution, criterion, referral and trial-authority fields are forbidden. The Reality Influence research map is untrusted related research and is not imported, bound, projected, evidence or authority. J-space is not imported or depended on.</p>" + renderFacts(snapshot.trialChamberSeparation, "trialChamberSeparation") + "</section>",
    snapshot.designs.map((design: JsonObject) => renderDesign(design, snapshot)).join(""),
    "    <section class=\"design\" aria-labelledby=\"sources\"><p class=\"tag\">Method orientation only</p><h2 id=\"sources\">Source URLs are inspectable links, not evidence receipts</h2><p>No source body is retained or reproduced; exact text has not been separately human-reviewed. A generic official host does not support an estimand, result, desired-outcome hypothesis or authority.</p><ul>" + snapshot.sources.map((source: JsonObject) => "<li><code>" + esc(source.id) + "</code> — " + methodSourceLink(source) + "; <code>supportsResult:false</code> · <code>supportsEstimand:false</code> · <code>supportsDossierOutcome:false</code> · <code>supportsAuthority:false</code></li>").join("") + "</ul></section>",
    "    <section class=\"design\" aria-labelledby=\"boundary\"><p class=\"tag\">Negative authority</p><h2 id=\"boundary\">What this surface cannot do</h2><p>Every declared capability is false. The page has no JavaScript, form, input, upload, button, iframe, account access, request body, external fetch, runtime network, MCP surface, selection or action. It does not seal, register, recruit, collect, run, observe, estimate, evaluate, approve, choose, adopt, implement or act.</p><ul class=\"negative\">" + Object.keys(snapshot.boundaries).sort().map((key) => "<li><code>" + esc(key) + "</code>: false</li>").join("") + "</ul><p>Inspect the <a href=\"/evaluation-covenants.json\">mutable alias</a>, <a href=\"/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json\">immutable dated JSON</a>, <a href=\"/evaluation/schemas/v0.1/public-snapshot.schema.json\">closed schema</a>, and <a href=\"/EVALUATION-COVENANT-v0.1.md\">design and boundary guide</a>.</p></section>",
    "  </main>",
    "  <footer class=\"shell footer\">State at publication only · as of <time datetime=\"" + esc(snapshot.asOf) + "\">" + esc(snapshot.asOf) + "</time> · next review due <time datetime=\"" + esc(snapshot.freshness.nextReviewDue) + "\">" + esc(snapshot.freshness.nextReviewDue) + "</time> · " + producerLink() + " · immutable history is not a claim of reader-time currency.</footer>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}
