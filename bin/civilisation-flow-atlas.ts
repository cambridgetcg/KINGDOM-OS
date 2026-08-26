#!/usr/bin/env bun
/**
 * Strict, bounded, network-free reader for the Civilisation Flow Nuance Atlas.
 *
 * The atlas is a static directed seam-and-overlay design lens. It does not instantiate a
 * mechanism, infer a person or group state, estimate an effect, grant authority,
 * choose a target, optimize persuasion, or execute an action.
 */

import { createHash } from "node:crypto";
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const CIVILISATION_FLOW_NUANCE_ATLAS_PROTOCOL = "kingdom.civilisation-flow-nuance-atlas/0.1";
export const CIVILISATION_FLOW_NUANCE_ATLAS_SCHEMA_ID = "urn:kingdom:schema:civilisation-flow-nuance-atlas:0.1";
export const CIVILISATION_FLOW_NUANCE_ATLAS_ID = "civilisation-flow-nuance-atlas-2026-08-26";
export const CIVILISATION_FLOW_NUANCE_ATLAS_LOCATOR = "data/reality/civilisation-flow-atlas.v0.1.json";
export const CIVILISATION_FLOW_NUANCE_ATLAS_PATH = join(ROOT, CIVILISATION_FLOW_NUANCE_ATLAS_LOCATOR);
export const CIVILISATION_FLOW_NUANCE_SCHEMA_LOCATOR = "schemas/civilisation-flow-atlas-v0.1.schema.json";
export const CIVILISATION_FLOW_NUANCE_SCHEMA_PATH = join(ROOT, CIVILISATION_FLOW_NUANCE_SCHEMA_LOCATOR);
export const CIVILISATION_FLOW_NUANCE_ATLAS_URL = "https://thekingdom.dev/atlases/civilisation-flow-nuance-atlas-2026-08-26.json";
export const CIVILISATION_FLOW_NUANCE_SCHEMA_URL = "https://thekingdom.dev/schemas/civilisation-flow-nuance-atlas/0.1.json";
export const CIVILISATION_FLOW_NUANCE_GUIDE_URL = "https://thekingdom.dev/CIVILISATION-FLOW-NUANCE-ATLAS.md";
export const CIVILISATION_FLOW_NUANCE_REVIEWED_SEMANTIC_SHA256 = "sha256:3d304d7c20787bc3f8b3587b9efca64f61fc4578000570b38acec84d49b84a50";

/**
 * Bytes, JSON-value nodes (including a conservative array-length descriptor),
 * and string units have 25% headroom over the sealed record. Depth has four
 * levels of headroom. String length and array fanout are closed schema caps.
 */
export const CIVILISATION_FLOW_NUANCE_LIMITS = Object.freeze({
  bytes: 1_108_194,
  json_nodes: 27_409,
  total_string_units: 470_320,
  max_string_units: 2_000,
  max_array_fanout: 64,
  max_depth: 12,
  schema_bytes: 128 * 1024,
});

const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const SHA256 = /^sha256:[a-f0-9]{64}$/;

const STAGE_IDS = [
  "word-or-expression",
  "shared-story-artifact",
  "circulation-exposure-response",
  "institutional-selection-context",
  "action-proposal",
  "decision-record",
  "authorization-rights-and-affected-party-gate",
  "capability-and-resources",
  "attempt",
  "execution-or-action",
  "outcome-observation",
  "aftermath-causal-and-normative-assessment",
  "feedback-challenge-and-counterflow",
  "repair-review-and-retirement",
] as const;

const TRANSITION_IDS = [
  "expression-to-shared-story",
  "story-to-circulation",
  "circulation-to-institutional-context",
  "institution-to-proposal",
  "proposal-to-decision",
  "decision-to-authorization-gate",
  "authorization-gate-to-capability",
  "capability-to-attempt",
  "attempt-to-execution",
  "execution-to-outcome",
  "outcome-to-aftermath-assessment",
  "assessment-to-feedback",
  "feedback-to-repair-review",
] as const;

const OVERLAY_IDS = [
  "naming-to-expression",
  "story-to-public-deliberation",
  "canon-to-selection-feedback",
  "legitimation-to-decision-authority-separation",
  "translation-to-claim-assessment",
  "counterstory-to-challenge-repair",
] as const;

const OPEN_DOMAIN_IDS = [
  "war-and-organised-violence",
  "coercion-and-security-capacity",
  "class-and-resource-asymmetry",
  "status-hierarchy-and-elite-fracture",
  "collective-emotion-and-affect",
  "revolution-and-regime-change",
  "fiscal-and-economic-shocks",
  "propaganda-media-and-information-power",
  "citizen-governance-dynamics",
] as const;

const FIXED_REGISTRY_IDS = Object.freeze({
  nuance_dimensions: [
    "carriers", "transformations", "gates", "temporal-profile",
    "accumulation-profile", "observables", "affected-parties", "distribution",
    "emotion", "social-position", "power-asymmetry", "material-conditions",
    "flow-dynamics", "topology", "negative-or-missing-flow", "distortions",
    "counterflows", "failure-modes", "repair", "evidence", "uncertainty",
    "alternatives", "stop-and-stall", "reversibility-and-nonimplication",
  ],
  affected_party_vocabulary: [
    "expression-originators", "translators-curators-and-stewards",
    "source-communities-and-traditions", "audiences-and-non-audiences",
    "institutional-participants", "decision-subjects", "operators-and-labor",
    "resource-providers", "directly-affected-parties",
    "indirect-non-user-and-bystander-parties", "future-parties", "ecological-systems",
  ],
  flow_dynamics_vocabulary: [
    "continuous-or-episodic", "threshold-or-tipping", "delay-or-latency",
    "accumulation-or-memory", "path-dependence-or-hysteresis",
    "branching-or-convergence", "leakage-substitution-or-displacement",
    "coupling-or-decoupling", "reinforcing-feedback", "balancing-feedback",
  ],
  topology_vocabulary: [
    "fork", "join", "parallel-path", "bottleneck", "leakage", "substitution",
    "interruption", "reversal", "recurrence", "reinforcing-loop", "balancing-loop",
  ],
  negative_flow_vocabulary: [
    "not-observed", "detection-bounded-absence", "no-opportunity", "blocked",
    "censored", "destroyed-or-lost", "inaccessible", "private-or-refused",
    "excluded", "measurement-failure", "unknown",
  ],
  material_condition_vocabulary: [
    "body-and-care", "labor-and-time", "land-and-geography", "energy-and-resources",
    "climate-and-ecology", "money-credit-and-property",
    "infrastructure-and-logistics", "data-and-technology",
  ],
  emotion_observation_vocabulary: [
    "self-report", "attributed-expression", "behavioral-observation", "physiology",
    "cultural-vocabulary", "institutional-framing",
  ],
  affect_context_vocabulary: [
    "fear-or-threat", "anger-or-outrage", "humiliation-or-status-injury",
    "grief-or-loss", "hope-or-efficacy", "love-care-or-solidarity",
    "hate-or-moral-exclusion", "belonging-or-identity-security", "shame-or-guilt",
  ],
  social_position_vocabulary: [
    "economic-resources-ownership-labor-and-debt", "status", "office",
    "network-position", "agenda-control", "coercive-capacity", "discursive-power",
  ],
  power_asymmetry_vocabulary: [
    "naming-and-interpretive", "attention-and-distribution", "canon-and-curriculum",
    "agenda-and-procedure", "legal-jurisdiction-and-coercion", "resources-and-class",
    "status-and-hierarchy", "technical-and-infrastructure",
    "epistemic-and-measurement", "temporal-path-and-exit",
  ],
  evidence_uncertainty_vocabulary: [
    "source", "measurement", "selection-and-missingness", "temporal",
    "identification-and-model", "transport", "affected-party-incompleteness",
    "normative-disagreement", "authority-and-jurisdiction",
  ],
  action_gate_vocabulary: [
    "attribution-and-provenance", "publication-and-access", "reviewed-proposal",
    "decision-procedure", "current-authority-and-jurisdiction",
    "affected-party-register", "rights-assessment", "consent-or-lawful-basis",
    "capability-and-resources", "budget-and-horizon", "safety-and-stop-route",
    "repair-readiness",
  ],
  unknowns: [
    "observation-coverage-and-detection", "carrier-and-version-provenance",
    "temporal-order-latency-and-censoring",
    "affected-party-completeness-and-distribution",
    "authority-rights-and-jurisdiction", "material-capability-and-constraint",
    "affect-and-private-state", "power-position-and-boundary-displacement",
    "causal-identification-and-transport",
    "repair-residuals-recurrence-and-fresh-gate",
  ],
} as const);

const PREDECESSORS = [
  {
    id: "word-story-religion-civilisation",
    protocol: "kingdom.word-story-religion-civilisation-map/0.1",
    map_id: "word-story-religion-civilisation-2026-08-20",
    locator: "repo:data/language/word-story-religion-civilisation-map.v0.1.json",
    path: join(ROOT, "data/language/word-story-religion-civilisation-map.v0.1.json"),
    raw_digest: "sha256:a4a87b7b23dbdf7e7e6689b5083f76a746c7f41bc56f2124281dfda609a62479",
    semantic_digest: "sha256:0c791b2491ebdcd85cf58e26e41e8b35b883781fd26bccc19dfd3f7853c7855a",
    relation: "historical-language-story-and-institution-concept-predecessor",
  },
  {
    id: "reality-influence-claim-graph",
    protocol: "kingdom.reality-influence-claim-graph/0.1",
    map_id: "reality-influence-claim-graph-2026-08-21",
    locator: "repo:data/reality/reality-influence-map.v0.1.json",
    path: join(ROOT, "data/reality/reality-influence-map.v0.1.json"),
    raw_digest: "sha256:4d68be39226c8d5451c8d9166fa74ba54bb793b7655f119d8765090cbbcf890e",
    semantic_digest: "sha256:45d4323d1a6190b3c333f02f2c744858e8da27944fbcb2042fbae492ca6e31ac",
    relation: "typed-claim-stage-gate-aftermath-and-repair-predecessor",
  },
  {
    id: "civilisation-reality-projection",
    protocol: "kingdom.civilisation-reality-projection/0.1",
    map_id: "civilisation-reality-projection-2026-08-25",
    locator: "repo:data/reality/civilisation-reality-projection.v0.1.json",
    path: join(ROOT, "data/reality/civilisation-reality-projection.v0.1.json"),
    raw_digest: "sha256:acc5d16b0981266fe9908714af4791fe2266d063a363f89e43f7a208b0b4b48e",
    semantic_digest: "sha256:03c20d3976a7b449c009cac7736ab73aa9f17fa619951d3753ecbb69bcc1496b",
    relation: "six-crosswalk-and-open-domain-design-predecessor",
  },
] as const;

const TEMPLATE_FAMILIES = Object.freeze({
  dimension: "dimension-boundary",
  negative: "negative-flow",
  aftermath: "party-aftermath",
  repair: "repair",
  profiles: "translation-threshold-path",
  evidence: "promotion-evidence",
});

export type CivilisationFlowNuanceIssue = { field: string; code: string };
export type CivilisationFlowNuanceValidationOptions = { canonical?: boolean };
export type CivilisationFlowNuanceMetrics = {
  bytes?: number;
  json_nodes: number;
  total_string_units: number;
  max_string_units: number;
  max_array_fanout: number;
  max_depth: number;
};

function fail(message: string): never {
  throw new Error(message);
}

function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function ids(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => entry?.id).filter((entry): entry is string => typeof entry === "string")
    : [];
}

function exactStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry === expected[index]);
}

function uniqueStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string") &&
    new Set(value).size === value.length;
}

function deepEqual(a: unknown, b: unknown): boolean {
  try { return canonicalizeJsonValue(a) === canonicalizeJsonValue(b); }
  catch { return false; }
}

export function civilisationFlowNuanceShapeMetrics(value: unknown, bytes?: number): CivilisationFlowNuanceMetrics {
  const seen = new WeakSet<object>();
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  const metrics: CivilisationFlowNuanceMetrics = {
    ...(bytes === undefined ? {} : { bytes }),
    json_nodes: 0,
    total_string_units: 0,
    max_string_units: 0,
    max_array_fanout: 0,
    max_depth: 0,
  };
  while (stack.length) {
    const current = stack.pop()!;
    metrics.json_nodes += 1;
    metrics.max_depth = Math.max(metrics.max_depth, current.depth);
    if (current.value === null || typeof current.value === "boolean") continue;
    if (typeof current.value === "string") {
      metrics.total_string_units += current.value.length;
      metrics.max_string_units = Math.max(metrics.max_string_units, current.value.length);
      continue;
    }
    if (typeof current.value === "number") {
      if (!Number.isFinite(current.value) || Object.is(current.value, -0)) fail("invalid-json-number");
      continue;
    }
    if (typeof current.value !== "object") fail("non-json-value");
    if (seen.has(current.value)) fail("cyclic-or-shared-reference");
    seen.add(current.value);
    if (Array.isArray(current.value)) {
      if (Object.getPrototypeOf(current.value) !== Array.prototype) fail("non-json-array");
      const keys = Object.keys(current.value);
      const names = Object.getOwnPropertyNames(current.value);
      if (keys.length !== current.value.length || keys.some((key, index) => key !== String(index)) ||
          names.length !== current.value.length + 1 || names.at(-1) !== "length") fail("sparse-or-extended-array");
      metrics.max_array_fanout = Math.max(metrics.max_array_fanout, current.value.length);
    } else if (Object.getPrototypeOf(current.value) !== Object.prototype && Object.getPrototypeOf(current.value) !== null) {
      fail("non-json-object");
    } else if (Object.getOwnPropertyNames(current.value).length !== Object.keys(current.value).length) {
      fail("non-enumerable-property");
    }
    if (Object.getOwnPropertySymbols(current.value).length) fail("symbol-key-forbidden");
    const descriptors = Object.getOwnPropertyDescriptors(current.value);
    for (const descriptor of Object.values(descriptors)) {
      if (typeof descriptor.get === "function" || typeof descriptor.set === "function") fail("accessor-property");
      if (Object.hasOwn(descriptor, "value")) stack.push({ value: descriptor.value, depth: current.depth + 1 });
    }
  }
  return metrics;
}

export function civilisationFlowNuanceBudgetIssue(metrics: CivilisationFlowNuanceMetrics): string | null {
  if (metrics.bytes !== undefined && metrics.bytes > CIVILISATION_FLOW_NUANCE_LIMITS.bytes) return "json-byte-budget-exceeded";
  if (metrics.json_nodes > CIVILISATION_FLOW_NUANCE_LIMITS.json_nodes) return "json-node-budget-exceeded";
  if (metrics.total_string_units > CIVILISATION_FLOW_NUANCE_LIMITS.total_string_units) return "json-string-budget-exceeded";
  if (metrics.max_string_units > CIVILISATION_FLOW_NUANCE_LIMITS.max_string_units) return "json-max-string-exceeded";
  if (metrics.max_array_fanout > CIVILISATION_FLOW_NUANCE_LIMITS.max_array_fanout) return "json-array-fanout-exceeded";
  if (metrics.max_depth > CIVILISATION_FLOW_NUANCE_LIMITS.max_depth) return "json-depth-exceeded";
  return null;
}

function readBoundedStrictJson(path: string, label: string, maxBytes: number): { value: unknown; rawDigest: string; bytes: number } {
  const absolute = resolve(path);
  let pathStat;
  try { pathStat = lstatSync(absolute); } catch { fail(`${label} is unavailable`); }
  if (!pathStat.isFile() || pathStat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  if (pathStat.size > maxBytes) fail(`${label} exceeds ${maxBytes} bytes`);
  if (typeof fsConstants.O_NOFOLLOW !== "number" || typeof fsConstants.O_NONBLOCK !== "number") fail(`${label} safe-open flags are unavailable`);
  let descriptor: number;
  try { descriptor = openSync(absolute, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK); }
  catch { fail(`${label} could not be opened safely`); }
  try {
    const before = fstatSync(descriptor);
    if (!before.isFile() || before.dev !== pathStat.dev || before.ino !== pathStat.ino || before.size !== pathStat.size) fail(`${label} changed while opening`);
    const bytes = Buffer.allocUnsafe(before.size);
    let offset = 0;
    while (offset < bytes.byteLength) {
      const count = readSync(descriptor, bytes, offset, bytes.byteLength - offset, null);
      if (count === 0) fail(`${label} ended before its declared size`);
      offset += count;
    }
    const after = fstatSync(descriptor);
    if (after.dev !== before.dev || after.ino !== before.ino || after.size !== before.size ||
        after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) fail(`${label} changed while reading`);
    if (bytes.byteLength > maxBytes) fail(`${label} exceeds ${maxBytes} bytes`);
    return {
      value: parseStrictJsonBytes(bytes, `${label} JSON`),
      rawDigest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
      bytes: bytes.byteLength,
    };
  } finally {
    closeSync(descriptor);
  }
}

let schemaCache: Record<string, any> | undefined;
function atlasSchema(): Record<string, any> {
  if (!schemaCache) {
    const loaded = readBoundedStrictJson(
      CIVILISATION_FLOW_NUANCE_SCHEMA_PATH,
      "civilisation flow nuance schema",
      CIVILISATION_FLOW_NUANCE_LIMITS.schema_bytes,
    );
    if (!object(loaded.value)) fail("civilisation flow nuance schema must be an object");
    schemaCache = loaded.value;
  }
  return schemaCache;
}

function resolveSchemaRef(ref: string, root: Record<string, any>): unknown {
  if (!ref.startsWith("#/")) fail(`unsupported schema ref ${ref}`);
  let current: any = root;
  for (const raw of ref.slice(2).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!object(current) || !Object.hasOwn(current, key)) fail(`unresolved schema ref ${ref}`);
    current = current[key];
  }
  return current;
}

function schemaConformance(value: unknown, schema: unknown, root: Record<string, any>, path: string, out: CivilisationFlowNuanceIssue[]): void {
  if (!object(schema)) return;
  if (typeof schema.$ref === "string") {
    schemaConformance(value, resolveSchemaRef(schema.$ref, root), root, path, out);
    return;
  }
  const probe = (candidate: unknown): boolean => {
    const local: CivilisationFlowNuanceIssue[] = [];
    schemaConformance(value, candidate, root, path, local);
    return local.length === 0;
  };
  if (Array.isArray(schema.allOf)) for (const part of schema.allOf) schemaConformance(value, part, root, path, out);
  if (Array.isArray(schema.anyOf) && !schema.anyOf.some(probe)) out.push({ field: path, code: "schema-any-of-mismatch" });
  if (Array.isArray(schema.oneOf) && schema.oneOf.filter(probe).length !== 1) out.push({ field: path, code: "schema-one-of-mismatch" });
  if (object(schema.if)) schemaConformance(value, probe(schema.if) ? schema.then : schema.else, root, path, out);
  if (Object.hasOwn(schema, "const") && !deepEqual(value, schema.const)) out.push({ field: path, code: "schema-const-mismatch" });
  if (Array.isArray(schema.enum) && !schema.enum.some((entry: unknown) => deepEqual(value, entry))) out.push({ field: path, code: "schema-enum-mismatch" });

  if (typeof schema.type === "string") {
    const matches = schema.type === "object" ? object(value)
      : schema.type === "array" ? Array.isArray(value)
      : schema.type === "string" ? typeof value === "string"
      : schema.type === "boolean" ? typeof value === "boolean"
      : schema.type === "null" ? value === null
      : schema.type === "number" ? typeof value === "number" && Number.isFinite(value)
      : schema.type === "integer" ? Number.isInteger(value)
      : true;
    if (!matches) {
      out.push({ field: path, code: `schema-type-${schema.type}` });
      return;
    }
  }
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) out.push({ field: path, code: "schema-min-length" });
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) out.push({ field: path, code: "schema-max-length" });
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern, "u").test(value)) out.push({ field: path, code: "schema-pattern" });
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) out.push({ field: path, code: "schema-min-items" });
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) out.push({ field: path, code: "schema-max-items" });
    if (schema.uniqueItems === true) {
      const keys = value.map((entry) => { try { return canonicalizeJsonValue(entry); } catch { return "!invalid"; } });
      if (new Set(keys).size !== keys.length) out.push({ field: path, code: "schema-unique-items" });
    }
    const prefix = Array.isArray(schema.prefixItems) ? schema.prefixItems : [];
    for (let index = 0; index < Math.min(prefix.length, value.length); index++) {
      schemaConformance(value[index], prefix[index], root, `${path}[${index}]`, out);
    }
    if (schema.items === false && value.length > prefix.length) out.push({ field: path, code: "schema-items-forbidden" });
    else if (object(schema.items)) {
      for (let index = prefix.length; index < value.length; index++) schemaConformance(value[index], schema.items, root, `${path}[${index}]`, out);
    }
  }
  if (object(value)) {
    const properties = object(schema.properties) ? schema.properties : {};
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) if (typeof key === "string" && !Object.hasOwn(value, key)) out.push({ field: `${path}.${key}`, code: "schema-required" });
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!Object.hasOwn(properties, key)) out.push({ field: `${path}.${key}`, code: "schema-additional-property" });
    }
    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.hasOwn(value, key)) schemaConformance(value[key], childSchema, root, `${path}.${key}`, out);
    }
  }
}

export function civilisationFlowNuanceAtlasDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("civilisation flow nuance atlas integrity envelope is missing");
  material.integrity.digest = ZERO_DIGEST;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function addClosureIssues(
  value: unknown,
  universe: ReadonlySet<string>,
  field: string,
  code: string,
  add: (field: string, code: string) => void,
): void {
  if (!uniqueStrings(value)) {
    add(field, `${code}-not-unique-string-array`);
    return;
  }
  for (const id of value) if (!universe.has(id)) add(field, code);
}

function verifyCanonicalPredecessors(
  atlas: Record<string, any>,
  add: (field: string, code: string) => void,
): void {
  const loaded = new Map<string, Record<string, any>>();
  for (const [index, expected] of PREDECESSORS.entries()) {
    try {
      const result = readBoundedStrictJson(expected.path, `${expected.id} predecessor`, CIVILISATION_FLOW_NUANCE_LIMITS.bytes);
      if (result.rawDigest !== expected.raw_digest) add(`$.predecessor_bindings[${index}].raw_digest`, "local-predecessor-raw-digest-mismatch");
      const localIdentity = object(result.value) ? (result.value.map_id ?? result.value.projection_id) : undefined;
      if (!object(result.value) || result.value.protocol !== expected.protocol || localIdentity !== expected.map_id) {
        add(`$.predecessor_bindings[${index}]`, "local-predecessor-identity-mismatch");
      }
      if (!object(result.value?.integrity) || result.value.integrity.digest !== expected.semantic_digest) {
        add(`$.predecessor_bindings[${index}].semantic_digest`, "local-predecessor-semantic-digest-mismatch");
      }
      if (object(result.value)) loaded.set(expected.id, result.value);
    } catch {
      add(`$.predecessor_bindings[${index}]`, "local-predecessor-read-refused");
    }
  }

  const reality = loaded.get("reality-influence-claim-graph");
  if (!reality) return;
  const domains = new Set(ids(reality.reality_domains));
  const dimensions = new Set(ids(reality.influence_dimensions));
  const nodes = new Set(ids(reality.claim_node_types));
  const ladders = new Set(ids(reality.claim_ladder));
  const relations = new Map<string, Record<string, any>>(
    Array.isArray(reality.relation_vocabulary)
      ? reality.relation_vocabulary.map((entry: Record<string, any>) => [entry.id, entry])
      : [],
  );
  const stages = Array.isArray(atlas.stages) ? atlas.stages : [];
  const stageById = new Map<string, Record<string, any>>(stages.map((entry: Record<string, any>) => [entry.id, entry]));
  for (const [index, stage] of stages.entries()) {
    addClosureIssues(stage.predecessor_domain_ids, domains, `$.stages[${index}].predecessor_domain_ids`, "reality-domain-ref-not-closed", add);
    addClosureIssues(stage.predecessor_dimension_ids, dimensions, `$.stages[${index}].predecessor_dimension_ids`, "reality-dimension-ref-not-closed", add);
    addClosureIssues(stage.predecessor_node_type_ids, nodes, `$.stages[${index}].predecessor_node_type_ids`, "reality-node-ref-not-closed", add);
    addClosureIssues(stage.predecessor_ladder_ids, ladders, `$.stages[${index}].predecessor_ladder_ids`, "reality-ladder-ref-not-closed", add);
  }
  const nodeUnion = (stageIds: unknown): Set<string> => {
    const result = new Set<string>();
    if (Array.isArray(stageIds)) for (const stageId of stageIds) {
      for (const nodeId of stageById.get(stageId)?.predecessor_node_type_ids ?? []) result.add(nodeId);
    }
    return result;
  };
  for (const [index, transition] of (atlas.transitions ?? []).entries()) {
    const fromNodes = nodeUnion(transition.from_stage_ids);
    const toNodes = nodeUnion(transition.to_stage_ids);
    for (const relationId of transition.predecessor_relation_ids ?? []) {
      const relation = relations.get(relationId);
      if (!relation) {
        add(`$.transitions[${index}].predecessor_relation_ids`, "reality-relation-ref-not-closed");
        continue;
      }
      const forward = relation.from_kind_ids?.some((id: string) => fromNodes.has(id)) &&
        relation.to_kind_ids?.some((id: string) => toNodes.has(id));
      const reverse = relation.from_kind_ids?.some((id: string) => toNodes.has(id)) &&
        relation.to_kind_ids?.some((id: string) => fromNodes.has(id));
      if (!forward && !reverse) add(`$.transitions[${index}].predecessor_relation_ids`, "relation-does-not-cross-transition-partition");
    }
  }

  const projection = loaded.get("civilisation-reality-projection");
  if (!projection) return;
  const crosswalkIds = new Set(ids(projection.crosswalks));
  const openIds = new Set(ids(projection.open_domains));
  for (const [index, overlay] of (atlas.crosswalk_flow_overlays ?? []).entries()) {
    if (!crosswalkIds.has(overlay.projection_crosswalk_id) || overlay.projection_crosswalk_id !== overlay.id) {
      add(`$.crosswalk_flow_overlays[${index}].projection_crosswalk_id`, "projection-crosswalk-ref-not-closed");
    }
  }
  for (const [index, domain] of (atlas.open_domain_bindings ?? []).entries()) {
    if (!openIds.has(domain.projection_open_domain_id) || domain.projection_open_domain_id !== domain.id) {
      add(`$.open_domain_bindings[${index}].projection_open_domain_id`, "projection-open-domain-ref-not-closed");
    }
  }
}

function validateNuanceSemantics(
  nuance: Record<string, any>,
  path: string,
  universes: Record<string, Set<string>>,
  policyFamily: Map<string, string>,
  add: (field: string, code: string) => void,
): void {
  const family = (refs: unknown, expected: string, field: string) => {
    if (!uniqueStrings(refs)) {
      add(field, "policy-template-ref-not-unique-string-array");
      return;
    }
    for (const ref of refs) if (policyFamily.get(ref) !== expected) add(field, `policy-template-ref-wrong-family-${expected}`);
  };
  const familyOne = (ref: unknown, expected: string, field: string) => {
    if (typeof ref !== "string" || policyFamily.get(ref) !== expected) add(field, `policy-template-ref-wrong-family-${expected}`);
  };
  const selection = (key: string, universe: Set<string>) => {
    const value = nuance[key];
    if (!object(value)) return;
    familyOne(value.reason_ref, TEMPLATE_FAMILIES.dimension, `${path}.${key}.reason_ref`);
    familyOne(value.boundary_ref, TEMPLATE_FAMILIES.dimension, `${path}.${key}.boundary_ref`);
    if (value.status === "applicable-question") {
      addClosureIssues(value.refs, universe, `${path}.${key}.refs`, `${key}-vocabulary-ref-not-closed`, add);
      family(value.evidence_requirements, TEMPLATE_FAMILIES.dimension, `${path}.${key}.evidence_requirements`);
    } else if (Object.hasOwn(value, "refs") || Object.hasOwn(value, "evidence_requirements")) {
      add(`${path}.${key}`, "inactive-dimension-must-not-carry-refs");
    }
  };
  selection("emotion_observation", universes.emotion);
  selection("affect_context", universes.affect);
  selection("social_position", universes.social);
  selection("power_asymmetry", universes.power);
  selection("material_conditions", universes.material);
  selection("flow_dynamics", universes.dynamics);
  selection("topology", universes.topology);
  selection("negative_flow", universes.negative);
  selection("evidence_uncertainty", universes.uncertainty);

  const parties = Array.isArray(nuance.affected_party_ids) ? nuance.affected_party_ids : [];
  addClosureIssues(parties, universes.parties, `${path}.affected_party_ids`, "affected-party-ref-not-closed", add);
  const aftermathIds = Array.isArray(nuance.affected_party_aftermath)
    ? nuance.affected_party_aftermath.map((entry: Record<string, any>) => entry?.affected_party_id)
    : [];
  if (!exactStrings(aftermathIds, parties)) add(`${path}.affected_party_aftermath`, "aftermath-parties-must-exactly-match-selected-parties");
  for (const [index, aftermath] of (nuance.affected_party_aftermath ?? []).entries()) {
    const base = `${path}.affected_party_aftermath[${index}]`;
    familyOne(aftermath.reason_ref, TEMPLATE_FAMILIES.aftermath, `${base}.reason_ref`);
    for (const key of ["benefits", "burdens", "risks", "option_voice_and_exit_effects", "horizon", "unknowns", "residuals"]) {
      family(aftermath[key], TEMPLATE_FAMILIES.aftermath, `${base}.${key}`);
    }
  }

  const selectedNegative = nuance.negative_flow?.status === "applicable-question" ? nuance.negative_flow.refs : [];
  const profileNegative = Array.isArray(nuance.negative_flow_profiles)
    ? nuance.negative_flow_profiles.map((entry: Record<string, any>) => entry?.status_ref)
    : [];
  if (!exactStrings(profileNegative, selectedNegative)) add(`${path}.negative_flow_profiles`, "negative-profiles-must-exactly-match-selected-statuses");
  for (const [index, profile] of (nuance.negative_flow_profiles ?? []).entries()) {
    const base = `${path}.negative_flow_profiles[${index}]`;
    if (!universes.negative.has(profile.status_ref)) add(`${base}.status_ref`, "negative-status-ref-not-closed");
    for (const key of ["expected_trace", "opportunity_or_at_risk_set", "horizon", "method", "coverage_and_sensitivity", "access_limits", "reason_ref"]) {
      familyOne(profile[key], TEMPLATE_FAMILIES.negative, `${base}.${key}`);
    }
    family(profile.alternatives, TEMPLATE_FAMILIES.negative, `${base}.alternatives`);
  }

  const translation = nuance.translation_profile;
  if (translation?.status === "applicable-question") {
    familyOne(translation.reason_ref, TEMPLATE_FAMILIES.profiles, `${path}.translation_profile.reason_ref`);
    for (const key of ["preserved", "changed", "introduced", "omitted", "untranslatable", "counterreadings", "rights_and_access"]) {
      family(translation[key], TEMPLATE_FAMILIES.profiles, `${path}.translation_profile.${key}`);
    }
    const positions = new Set([...universes.social, ...universes.power]);
    addClosureIssues(translation.translator_position_refs, positions, `${path}.translation_profile.translator_position_refs`, "translator-position-ref-not-closed", add);
    addClosureIssues(translation.patron_position_refs, positions, `${path}.translation_profile.patron_position_refs`, "patron-position-ref-not-closed", add);
    addClosureIssues(translation.audience_party_refs, universes.parties, `${path}.translation_profile.audience_party_refs`, "translation-audience-party-ref-not-closed", add);
  } else if (object(translation)) {
    familyOne(translation.reason_ref, TEMPLATE_FAMILIES.profiles, `${path}.translation_profile.reason_ref`);
    familyOne(translation.boundary_ref, TEMPLATE_FAMILIES.profiles, `${path}.translation_profile.boundary_ref`);
  }
  for (const [profileKey, fields] of [
    ["threshold_profile", ["trigger", "unit", "population", "opportunity_set", "heterogeneous_distribution", "observation_horizon", "reset_or_hysteresis", "evidence"]],
    ["path_dependence_profile", ["reinforcement_mechanism", "switching_cost", "sunk_resource", "option_loss", "alternative_timing", "reversal_evidence", "evidence"]],
  ] as const) {
    const profile = nuance[profileKey];
    if (profile?.status === "applicable-question") {
      familyOne(profile.reason_ref, TEMPLATE_FAMILIES.profiles, `${path}.${profileKey}.reason_ref`);
      for (const key of fields) family(profile[key], TEMPLATE_FAMILIES.profiles, `${path}.${profileKey}.${key}`);
    } else if (object(profile)) {
      familyOne(profile.reason_ref, TEMPLATE_FAMILIES.profiles, `${path}.${profileKey}.reason_ref`);
      familyOne(profile.boundary_ref, TEMPLATE_FAMILIES.profiles, `${path}.${profileKey}.boundary_ref`);
    }
  }

  const repair = nuance.repair_profile;
  if (repair?.status === "applicable-question") {
    familyOne(repair.reason_ref, TEMPLATE_FAMILIES.repair, `${path}.repair_profile.reason_ref`);
    addClosureIssues(repair.fresh_gate_refs, universes.gates, `${path}.repair_profile.fresh_gate_refs`, "repair-gate-ref-not-closed", add);
    for (const key of ["attempt", "execution_or_outcome_observation", "dissent", "recurrence", "review_or_retirement"]) {
      family(repair[key], TEMPLATE_FAMILIES.repair, `${path}.repair_profile.${key}`);
    }
    const residualParties = (repair.party_indexed_residuals ?? []).map((entry: Record<string, any>) => entry?.affected_party_id);
    if (!exactStrings(residualParties, parties)) add(`${path}.repair_profile.party_indexed_residuals`, "repair-residual-parties-must-exactly-match-selected-parties");
    for (const [index, residual] of (repair.party_indexed_residuals ?? []).entries()) {
      family(residual.evidence_or_unknowns, TEMPLATE_FAMILIES.repair, `${path}.repair_profile.party_indexed_residuals[${index}].evidence_or_unknowns`);
    }
  } else if (object(repair)) {
    familyOne(repair.reason_ref, TEMPLATE_FAMILIES.repair, `${path}.repair_profile.reason_ref`);
    familyOne(repair.boundary_ref, TEMPLATE_FAMILIES.repair, `${path}.repair_profile.boundary_ref`);
  }
}

function validateEvidenceSemantics(
  evidence: Record<string, any>,
  path: string,
  policyFamily: Map<string, string>,
  add: (field: string, code: string) => void,
): void {
  const one = (ref: unknown, field: string) => {
    if (typeof ref !== "string" || policyFamily.get(ref) !== TEMPLATE_FAMILIES.evidence) {
      add(field, `policy-template-ref-wrong-family-${TEMPLATE_FAMILIES.evidence}`);
    }
  };
  const many = (refs: unknown, field: string) => {
    if (!uniqueStrings(refs)) {
      add(field, "evidence-policy-template-refs-not-unique");
      return;
    }
    for (const ref of refs) one(ref, field);
  };
  many(evidence.counterevidence, `${path}.counterevidence`);
  many(evidence.falsifiers, `${path}.falsifiers`);
  many(evidence.transport_bounds, `${path}.transport_bounds`);
  one(evidence.promotion_requirement, `${path}.promotion_requirement`);
  for (const key of ["expected_traces", "negative_cases"]) {
    const link = evidence[key];
    if (link?.source === "policy-templates") many(link.prompt_refs, `${path}.${key}.prompt_refs`);
    else if (Array.isArray(link?.prompt_refs) && link.prompt_refs.length) add(`${path}.${key}.prompt_refs`, "card-source-must-not-carry-policy-refs");
  }
}

export function validateCivilisationFlowNuanceAtlas(
  value: unknown,
  options: CivilisationFlowNuanceValidationOptions = {},
): CivilisationFlowNuanceIssue[] {
  const issues: CivilisationFlowNuanceIssue[] = [];
  const issueKeys = new Set<string>();
  const add = (field: string, code: string) => {
    const key = `${field}\u0000${code}`;
    if (!issueKeys.has(key)) {
      issueKeys.add(key);
      issues.push({ field, code });
    }
  };
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    let metrics: CivilisationFlowNuanceMetrics;
    try { metrics = civilisationFlowNuanceShapeMetrics(value); }
    catch (error) { return [{ field: "$", code: error instanceof Error ? error.message : "invalid-json-shape" }]; }
    const budget = civilisationFlowNuanceBudgetIssue(metrics);
    if (budget) return [{ field: "$", code: budget }];

    const schema = atlasSchema();
    schemaConformance(value, schema, schema, "$", issues);

    if (value.$schema !== CIVILISATION_FLOW_NUANCE_ATLAS_SCHEMA_ID) add("$.$schema", "schema-id-mismatch");
    if (value.protocol !== CIVILISATION_FLOW_NUANCE_ATLAS_PROTOCOL) add("$.protocol", "protocol-mismatch");
    if (value.atlas_id !== CIVILISATION_FLOW_NUANCE_ATLAS_ID || value.version !== "0.1.0" ||
        value.compiled_on !== "2026-08-26" || value.evidence_through !== "2026-08-21" ||
        value.state !== "reviewed-static-flow-nuance-atlas") add("$.atlas_id", "identity-or-horizon-mismatch");
    if (value.scope?.new_vocabulary_register !== "DESIGN_COMMITMENT" ||
        value.scope?.external_empirical_sources_added !== false ||
        value.scope?.evidence_horizon_scope !== "predecessor-claims-only") {
      add("$.scope", "source-status-boundary-mismatch");
    }

    if (!exactStrings(value.flow?.stage_ids, STAGE_IDS) || !exactStrings(ids(value.stages), STAGE_IDS)) {
      add("$.stages", "stage-order-or-membership-mismatch");
    }
    if (!exactStrings(value.flow?.transition_ids, TRANSITION_IDS) || !exactStrings(ids(value.transitions), TRANSITION_IDS)) {
      add("$.transitions", "transition-order-or-membership-mismatch");
    }
    if (!exactStrings(ids(value.crosswalk_flow_overlays), OVERLAY_IDS)) add("$.crosswalk_flow_overlays", "overlay-order-or-membership-mismatch");
    if (!exactStrings(ids(value.open_domain_bindings), OPEN_DOMAIN_IDS)) add("$.open_domain_bindings", "open-domain-order-or-membership-mismatch");
    for (const [field, expected] of Object.entries(FIXED_REGISTRY_IDS)) {
      if (!exactStrings(ids(value[field]), expected)) add(`$.${field}`, "fixed-registry-id-order-or-membership-mismatch");
    }

    const policyFamily = new Map<string, string>();
    for (const [index, template] of (value.policy_templates ?? []).entries()) {
      if (typeof template?.id !== "string" || policyFamily.has(template.id)) add(`$.policy_templates[${index}].id`, "duplicate-policy-template-id");
      else policyFamily.set(template.id, template.family);
    }
    const familyCounts = new Map<string, number>();
    for (const family of policyFamily.values()) familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
    for (const family of Object.values(TEMPLATE_FAMILIES)) if (!familyCounts.get(family)) add("$.policy_templates", `missing-policy-template-family-${family}`);

    const universes = {
      parties: new Set(ids(value.affected_party_vocabulary)),
      dynamics: new Set(ids(value.flow_dynamics_vocabulary)),
      topology: new Set(ids(value.topology_vocabulary)),
      negative: new Set(ids(value.negative_flow_vocabulary)),
      material: new Set(ids(value.material_condition_vocabulary)),
      emotion: new Set(ids(value.emotion_observation_vocabulary)),
      affect: new Set(ids(value.affect_context_vocabulary)),
      social: new Set(ids(value.social_position_vocabulary)),
      power: new Set(ids(value.power_asymmetry_vocabulary)),
      uncertainty: new Set(ids(value.evidence_uncertainty_vocabulary)),
      gates: new Set(ids(value.action_gate_vocabulary)),
    };
    const stageSet = new Set<string>(STAGE_IDS);
    const transitionSet = new Set<string>(TRANSITION_IDS);
    const touchpointSet = new Set<string>([...STAGE_IDS, ...TRANSITION_IDS]);
    const cards: Array<{ card: Record<string, any>; path: string; template?: string }> = [];
    for (const [index, stage] of (value.stages ?? []).entries()) cards.push({ card: stage, path: `$.stages[${index}]` });
    for (const [index, transition] of (value.transitions ?? []).entries()) {
      cards.push({ card: transition, path: `$.transitions[${index}]`, template: "transition-default" });
      addClosureIssues(transition.from_stage_ids, stageSet, `$.transitions[${index}].from_stage_ids`, "transition-stage-ref-not-closed", add);
      addClosureIssues(transition.to_stage_ids, stageSet, `$.transitions[${index}].to_stage_ids`, "transition-stage-ref-not-closed", add);
      if (transition.relation_gap_status === "typed-predecessor-relations-listed" && !(transition.predecessor_relation_ids?.length > 0)) {
        add(`$.transitions[${index}].relation_gap_status`, "typed-relation-status-requires-relation");
      }
      if (transition.relation_gap_status === "no-direct-predecessor-relation" && transition.predecessor_relation_ids?.length !== 0) {
        add(`$.transitions[${index}].relation_gap_status`, "relation-gap-status-requires-empty-relations");
      }
    }
    for (const [index, overlay] of (value.crosswalk_flow_overlays ?? []).entries()) {
      cards.push({ card: overlay, path: `$.crosswalk_flow_overlays[${index}]`, template: "overlay-default" });
      addClosureIssues(overlay.stage_ids, stageSet, `$.crosswalk_flow_overlays[${index}].stage_ids`, "overlay-stage-ref-not-closed", add);
      addClosureIssues(overlay.transition_ids, transitionSet, `$.crosswalk_flow_overlays[${index}].transition_ids`, "overlay-transition-ref-not-closed", add);
      if (overlay.projection_binding_id !== "civilisation-reality-projection" || overlay.projection_crosswalk_id !== overlay.id ||
          overlay.new_claim_created !== false || overlay.authority_granted !== false || overlay.external_effect_claimed !== false) {
        add(`$.crosswalk_flow_overlays[${index}]`, "overlay-binding-or-non-grant-mismatch");
      }
    }
    for (const { card, path, template } of cards) {
      if (!object(card?.nuance) || !object(card?.evidence_profile)) continue;
      if (template && card.nuance.template_ref !== template) add(`${path}.nuance.template_ref`, "nuance-template-family-mismatch");
      if (template && card.authority_dependency?.template_ref !== (template === "transition-default" ? "transition-authority" : "overlay-authority")) {
        add(`${path}.authority_dependency.template_ref`, "authority-template-family-mismatch");
      }
      if (template && card.causal_influence?.template_ref !== (template === "transition-default" ? "transition-causal" : "overlay-causal")) {
        add(`${path}.causal_influence.template_ref`, "causal-template-family-mismatch");
      }
      addClosureIssues(card.authority_dependency?.gate_input_ids, universes.gates, `${path}.authority_dependency.gate_input_ids`, "authority-gate-ref-not-closed", add);
      validateNuanceSemantics(card.nuance, `${path}.nuance`, universes, policyFamily, add);
      validateEvidenceSemantics(card.evidence_profile, `${path}.evidence_profile`, policyFamily, add);
      if (card.evidence_profile.claim_register !== "DESIGN_COMMITMENT" ||
          card.evidence_profile.claim_status !== "design-question-not-observed" ||
          card.evidence_profile.causal_status !== "formal-mechanism-not-instantiated" ||
          card.evidence_profile.external_empirical_support_claimed !== false ||
          card.evidence_profile.mechanism_promoted !== false) add(`${path}.evidence_profile`, "evidence-profile-promoted-beyond-source-horizon");
    }
    for (const [index, domain] of (value.open_domain_bindings ?? []).entries()) {
      addClosureIssues(domain.flow_touchpoint_ids, touchpointSet, `$.open_domain_bindings[${index}].flow_touchpoint_ids`, "open-domain-touchpoint-ref-not-closed", add);
      if (domain.projection_binding_id !== "civilisation-reality-projection" || domain.projection_open_domain_id !== domain.id ||
          domain.status !== "remains-open-no-mechanism-added") add(`$.open_domain_bindings[${index}]`, "open-domain-filled-or-binding-mismatch");
    }

    if (!object(value.integrity) || value.integrity.algorithm !== INTEGRITY_ALGORITHM ||
        !SHA256.test(value.integrity.digest ?? "") || value.integrity.digest_field_zeroed !== true) {
      add("$.integrity", "invalid-integrity-envelope");
    } else {
      const computed = civilisationFlowNuanceAtlasDigest(value);
      if (value.integrity.digest !== computed) add("$.integrity.digest", "digest-mismatch");
      if (value.integrity.digest !== CIVILISATION_FLOW_NUANCE_REVIEWED_SEMANTIC_SHA256) add("$.integrity.digest", "reviewed-digest-mismatch");
    }
    if (options.canonical) verifyCanonicalPredecessors(value, add);
  } catch (error) {
    add("$", error instanceof Error ? `validator-unavailable:${error.message}` : "validator-unavailable");
  }
  return issues;
}

export function loadCivilisationFlowNuanceAtlas(
  path = CIVILISATION_FLOW_NUANCE_ATLAS_PATH,
): Record<string, any> {
  const loaded = readBoundedStrictJson(path, "civilisation flow nuance atlas", CIVILISATION_FLOW_NUANCE_LIMITS.bytes);
  const budget = civilisationFlowNuanceBudgetIssue(civilisationFlowNuanceShapeMetrics(loaded.value, loaded.bytes));
  if (budget) fail(`civilisation flow nuance atlas refused: $:${budget}`);
  const canonical = resolve(path) === resolve(CIVILISATION_FLOW_NUANCE_ATLAS_PATH);
  const issues = validateCivilisationFlowNuanceAtlas(loaded.value, { canonical });
  if (issues.length) fail(`civilisation flow nuance atlas refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return loaded.value as Record<string, any>;
}

export function civilisationFlowNuancePublicDiscovery(
  value = loadCivilisationFlowNuanceAtlas(),
): Record<string, any> {
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    title: value.title,
    publication_state: "immutable-versioned-static-family",
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    urls: {
      atlas: CIVILISATION_FLOW_NUANCE_ATLAS_URL,
      schema: CIVILISATION_FLOW_NUANCE_SCHEMA_URL,
      guide: CIVILISATION_FLOW_NUANCE_GUIDE_URL,
    },
    integrity: value.integrity,
    counts: {
      predecessor_bindings: value.predecessor_bindings.length,
      stages: value.stages.length,
      transitions: value.transitions.length,
      crosswalk_flow_overlays: value.crosswalk_flow_overlays.length,
      open_domain_bindings: value.open_domain_bindings.length,
      unknowns: value.unknowns.length,
      policy_templates: value.policy_templates.length,
    },
    boundary: {
      static_read_only: value.boundaries.read_only,
      structure_only: value.boundaries.structure_only,
      public_static_publication_family: value.boundaries.public_static_publication_family,
      source_dereference: value.boundaries.source_dereference,
      predecessor_mutation: value.boundaries.predecessor_mutation,
      predecessor_republication: value.boundaries.predecessor_republication,
      unsupported_domains_filled: value.boundaries.unsupported_domains_filled,
      score_or_rank: value.boundaries.score_or_rank,
      causal_effect_identified: value.boundaries.causal_effect_identified,
      metaphysical_verdict: value.boundaries.metaphysical_verdict,
      authority_granted: value.boundaries.authority_granted,
      targeting: value.boundaries.targeting,
      persuasion_optimization: value.boundaries.persuasion_optimization,
      action_attempted: value.boundaries.action_attempted,
      action_executed: value.boundaries.action_executed,
      external_effect_claimed: value.boundaries.external_effect_claimed,
      publication_trigger: value.boundaries.publication_trigger,
      deployment_trigger: value.boundaries.deployment_trigger,
      automatic_action: value.boundaries.automatic_action,
    },
  };
}

function overview(value: Record<string, any>): string {
  return [
    value.title,
    "",
    "A static, source-bounded audit atlas for a possible path from word or expression through shared story, institution, decision, authorization, capability, action, aftermath, feedback, and repair.",
    "Every stage and transition keeps carriers, gates, delays, affected parties, qualitative dynamics, material context, asymmetry, missing flow, alternatives, evidence, and non-implications visible.",
    "The chain may fork, join, skip, stall, stop, reverse, recur, or never begin; represented topology is not occurrence and sequence is not causation.",
    "",
    `Lineage: ${value.predecessor_bindings.map((binding: Record<string, any>) => binding.id).join(" → ")}`,
    `${value.stages.length} stages · ${value.transitions.length} non-automatic transitions · ${value.crosswalk_flow_overlays.length} projection overlays · ${value.open_domain_bindings.length} open domains · ${value.unknowns.length} unknowns`,
    `${value.state} · ${value.integrity.digest}`,
    "",
    "STRUCTURE ONLY — no score, private-state inference, effect estimate, prediction, target, persuasion optimization, metaphysical verdict, authority, consent, action, publication trigger, deployment trigger, or external effect.",
  ].join("\n") + "\n";
}

function overviewProjection(value: Record<string, any>): Record<string, any> {
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    title: value.title,
    state: value.state,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    scope: value.scope,
    predecessor_bindings: value.predecessor_bindings,
    counts: {
      stages: value.stages.length,
      transitions: value.transitions.length,
      crosswalk_flow_overlays: value.crosswalk_flow_overlays.length,
      open_domain_bindings: value.open_domain_bindings.length,
      unknowns: value.unknowns.length,
      policy_templates: value.policy_templates.length,
    },
    boundaries: value.boundaries,
    integrity: value.integrity,
  };
}

const COMMANDS = [
  "overview", "chain", "stages", "transitions", "crosswalks", "dynamics",
  "topology", "materials", "emotions", "power", "negative-flow",
  "open-domains", "unknowns", "templates", "rules", "boundaries", "discovery", "verify",
] as const;

function usage(): never {
  process.stderr.write(`usage: bun bin/civilisation-flow-atlas.ts [${COMMANDS.join("|")}] [--json]\n`);
  process.exit(2);
}

function writeSection(value: unknown, json: boolean): void {
  process.stdout.write(`${JSON.stringify(value, null, json ? 0 : 2)}\n`);
}

export async function runCivilisationFlowNuanceAtlasCli(
  args = process.argv.slice(2),
): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndexes = copy.flatMap((entry, index) => entry === "--json" ? [index] : []);
  if (jsonIndexes.length > 1) usage();
  const json = jsonIndexes.length === 1;
  if (json) copy.splice(jsonIndexes[0]!, 1);
  if (copy.length || !COMMANDS.includes(command as typeof COMMANDS[number])) usage();

  if (command === "verify") {
    let issues: CivilisationFlowNuanceIssue[];
    let metrics: CivilisationFlowNuanceMetrics | null = null;
    try {
      const loaded = readBoundedStrictJson(
        CIVILISATION_FLOW_NUANCE_ATLAS_PATH,
        "civilisation flow nuance atlas",
        CIVILISATION_FLOW_NUANCE_LIMITS.bytes,
      );
      metrics = civilisationFlowNuanceShapeMetrics(loaded.value, loaded.bytes);
      const budget = civilisationFlowNuanceBudgetIssue(metrics);
      issues = budget ? [{ field: "$", code: budget }] : validateCivilisationFlowNuanceAtlas(loaded.value, { canonical: true });
    } catch (error) {
      issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }];
    }
    const report = {
      valid: issues.length === 0,
      protocol: CIVILISATION_FLOW_NUANCE_ATLAS_PROTOCOL,
      structure_only: true,
      draft_2020_12_schema_checked: true,
      predecessor_files_digest_checked: true,
      predecessor_claims_only: true,
      external_empirical_sources_added: false,
      mechanism_or_causal_effect_established: false,
      score_prediction_target_or_optimization_created: false,
      authority_consent_action_or_external_effect_created: false,
      budgets: CIVILISATION_FLOW_NUANCE_LIMITS,
      metrics,
      issues,
    };
    if (json) process.stdout.write(`${JSON.stringify(report)}\n`);
    else if (!issues.length) process.stdout.write("Civilisation Flow Nuance Atlas: valid static seam-and-overlay atlas, closed template references, exact predecessor pins, source boundary, non-grants, budgets, schema, and semantic digest\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }

  const value = loadCivilisationFlowNuanceAtlas();
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(overviewProjection(value))}\n` : overview(value));
  else if (command === "chain") writeSection({ atlas_id: value.atlas_id, flow: value.flow }, json);
  else if (command === "stages") writeSection({ atlas_id: value.atlas_id, stages: value.stages }, json);
  else if (command === "transitions") writeSection({ atlas_id: value.atlas_id, transitions: value.transitions }, json);
  else if (command === "crosswalks") writeSection({ atlas_id: value.atlas_id, crosswalk_flow_overlays: value.crosswalk_flow_overlays }, json);
  else if (command === "dynamics") writeSection({ atlas_id: value.atlas_id, flow_dynamics_vocabulary: value.flow_dynamics_vocabulary }, json);
  else if (command === "topology") writeSection({ atlas_id: value.atlas_id, topology_vocabulary: value.topology_vocabulary }, json);
  else if (command === "materials") writeSection({ atlas_id: value.atlas_id, material_condition_vocabulary: value.material_condition_vocabulary }, json);
  else if (command === "emotions") writeSection({ atlas_id: value.atlas_id, emotion_observation_vocabulary: value.emotion_observation_vocabulary, affect_context_vocabulary: value.affect_context_vocabulary }, json);
  else if (command === "power") writeSection({ atlas_id: value.atlas_id, social_position_vocabulary: value.social_position_vocabulary, power_asymmetry_vocabulary: value.power_asymmetry_vocabulary }, json);
  else if (command === "negative-flow") writeSection({ atlas_id: value.atlas_id, negative_flow_vocabulary: value.negative_flow_vocabulary }, json);
  else if (command === "open-domains") writeSection({ atlas_id: value.atlas_id, open_domain_bindings: value.open_domain_bindings }, json);
  else if (command === "unknowns") writeSection({ atlas_id: value.atlas_id, unknowns: value.unknowns }, json);
  else if (command === "templates") writeSection({ atlas_id: value.atlas_id, policy_templates: value.policy_templates, nuance_templates: value.nuance_templates, contract_templates: value.contract_templates }, json);
  else if (command === "rules") writeSection({ atlas_id: value.atlas_id, flow_rules: value.flow_rules }, json);
  else if (command === "boundaries") writeSection({ atlas_id: value.atlas_id, boundaries: value.boundaries }, json);
  else if (command === "discovery") writeSection(civilisationFlowNuancePublicDiscovery(value), json);
  else usage();
}

if (import.meta.main) {
  try {
    await runCivilisationFlowNuanceAtlasCli();
  } catch (error) {
    process.stderr.write(`civilisation flow nuance atlas refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
