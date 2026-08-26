#!/usr/bin/env bun
/**
 * Strict, bounded, network-free reader for the Civilisation → Reality Projection.
 *
 * The projection is a thin crosswalk between two immutable predecessors. It
 * does not republish either predecessor, fill open domains, score a person or
 * civilisation, infer belief or emotion, establish causation or metaphysics,
 * grant authority, propose an action, or change the world.
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

export const CIVILISATION_REALITY_PROJECTION_PROTOCOL = "kingdom.civilisation-reality-projection/0.1";
export const CIVILISATION_REALITY_PROJECTION_SCHEMA_ID = "urn:kingdom:schema:civilisation-reality-projection:0.1";
export const CIVILISATION_REALITY_PROJECTION_ID = "civilisation-reality-projection-2026-08-25";
export const CIVILISATION_REALITY_PROJECTION_LOCATOR = "data/reality/civilisation-reality-projection.v0.1.json";
export const CIVILISATION_REALITY_PROJECTION_PATH = join(ROOT, CIVILISATION_REALITY_PROJECTION_LOCATOR);
export const CIVILISATION_REALITY_PROJECTION_SCHEMA_LOCATOR = "schemas/civilisation-reality-projection-v0.1.schema.json";
export const CIVILISATION_REALITY_PROJECTION_SCHEMA_PATH = join(ROOT, CIVILISATION_REALITY_PROJECTION_SCHEMA_LOCATOR);
export const CIVILISATION_REALITY_PROJECTION_URL = "https://thekingdom.dev/atlases/civilisation-reality-projection-2026-08-25.json";
export const CIVILISATION_REALITY_PROJECTION_SCHEMA_URL = "https://thekingdom.dev/schemas/civilisation-reality-projection/0.1.json";
export const CIVILISATION_REALITY_PROJECTION_DOCUMENT_URL = "https://thekingdom.dev/CIVILISATION-REALITY-PROJECTION.md";
export const CIVILISATION_REALITY_PROJECTION_REVIEWED_DIGEST = "sha256:03c20d3976a7b449c009cac7736ab73aa9f17fa619951d3753ecbb69bcc1496b";

const MAX_BYTES = 512 * 1024;
const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

const TOP_KEYS = [
  "$schema", "protocol", "projection_id", "version", "title", "compiled_on",
  "evidence_through", "state", "scope", "projection_rules",
  "predecessor_bindings", "crosswalks", "open_domains", "boundaries",
  "integrity",
] as const;
const SCOPE_KEYS = [
  "question", "intended_use", "excluded_use", "unit_of_analysis",
  "projection_rule", "open_domain_rule", "data_classification",
] as const;
const PREDECESSOR_KEYS = [
  "id", "protocol", "map_id", "locator", "raw_digest", "semantic_digest",
  "relation", "mutated", "republished", "authority_imported",
] as const;
const PROJECTION_RULE_KEYS = [
  "source_claims_remain_in_predecessor",
  "qualified_predecessor_ids_required",
  "no_transitive_influence",
  "no_cross_register_promotion",
  "association_is_not_causation",
  "historical_claim_is_not_design_mandate",
  "design_commitment_is_not_historical_finding",
  "metaphysical_non_adjudication",
  "influence_is_non_summable",
  "no_person_community_religion_or_civilisation_score",
] as const;
const CROSSWALK_KEYS = [
  "id", "source_binding_ids", "source_relation_ids", "source_insight_ids", "target_domain_ids",
  "target_node_type_ids", "target_relation_ids", "target_ladder_ids",
  "target_pathway_ids", "register", "transfer_status", "statement",
  "preserved_distinctions", "required_evidence", "alternative_paths",
  "stop_conditions", "external_effect_claimed", "authority_granted",
] as const;
const OPEN_DOMAIN_KEYS = [
  "id", "question", "coverage_status", "why_not_projectable",
  "needed_evidence", "stop_condition",
] as const;
const INTEGRITY_KEYS = ["algorithm", "digest", "digest_field_zeroed"] as const;

const PREDECESSORS = [
  {
    id: "word-story-religion-civilisation",
    protocol: "kingdom.word-story-religion-civilisation-map/0.1",
    map_id: "word-story-religion-civilisation-2026-08-20",
    locator: "repo:data/language/word-story-religion-civilisation-map.v0.1.json",
    path: join(ROOT, "data/language/word-story-religion-civilisation-map.v0.1.json"),
    raw_digest: "sha256:a4a87b7b23dbdf7e7e6689b5083f76a746c7f41bc56f2124281dfda609a62479",
    semantic_digest: "sha256:0c791b2491ebdcd85cf58e26e41e8b35b883781fd26bccc19dfd3f7853c7855a",
    relation: "source-concept-predecessor",
  },
  {
    id: "reality-influence-claim-graph",
    protocol: "kingdom.reality-influence-claim-graph/0.1",
    map_id: "reality-influence-claim-graph-2026-08-21",
    locator: "repo:data/reality/reality-influence-map.v0.1.json",
    path: join(ROOT, "data/reality/reality-influence-map.v0.1.json"),
    raw_digest: "sha256:4d68be39226c8d5451c8d9166fa74ba54bb793b7655f119d8765090cbbcf890e",
    semantic_digest: "sha256:45d4323d1a6190b3c333f02f2c744858e8da27944fbcb2042fbae492ca6e31ac",
    relation: "target-claim-boundary-predecessor",
  },
] as const;

const CROSSWALKS = [
  {
    id: "naming-to-expression",
    sourceBindings: ["word-story-religion-civilisation"],
    sourceRelations: ["articulation-and-naming"],
    sourceInsights: ["coordinate-words-remain-expanded"],
    targetDomains: ["semantic-symbolic", "informational-record"],
    targetNodes: ["EXPRESSION", "CLAIM_ASSESSMENT"],
    targetRelations: ["EXPRESSES"],
    targetLadder: ["expression-recorded"],
    targetPathways: ["expression-to-public-deliberation"],
  },
  {
    id: "story-to-public-deliberation",
    sourceBindings: ["word-story-religion-civilisation"],
    sourceRelations: ["story-performance-memory"],
    sourceInsights: ["story-orients-without-proving"],
    targetDomains: ["semantic-symbolic", "informational-record", "attention-exposure", "normative-public"],
    targetNodes: ["EXPRESSION", "ARTIFACT", "DISTRIBUTION_OBSERVATION", "ATTENTION_OBSERVATION", "PUBLIC_RESPONSE_RECORD"],
    targetRelations: ["EMBODIES_EXPRESSION", "DISTRIBUTES_ARTIFACT", "MEASURES_EXPOSURE_TO", "REPORTS_PUBLIC_RESPONSE_TO"],
    targetLadder: ["expression-recorded", "artifact-versioned", "distribution-witnessed", "exposure-measured", "public-response-attributed"],
    targetPathways: ["expression-to-public-deliberation"],
  },
  {
    id: "canon-to-selection-feedback",
    sourceBindings: ["word-story-religion-civilisation"],
    sourceRelations: ["canon-curriculum-selection"],
    sourceInsights: ["canon-is-governance-transform", "attention-and-persistence-are-not-truth"],
    targetDomains: ["attention-exposure", "social-relational", "institutional-status", "normative-public"],
    targetNodes: ["ARTIFACT", "DISTRIBUTION_OBSERVATION", "ATTENTION_OBSERVATION", "ACTION_PROPOSAL", "DECISION_RECORD", "FEEDBACK_ITEM"],
    targetRelations: ["DERIVES_FROM", "SELECTS_PROPOSAL", "CHALLENGES", "CORRECTS", "SUPERSEDES", "WITHDRAWS"],
    targetLadder: ["artifact-versioned", "distribution-witnessed", "exposure-measured", "proposal-recorded", "decision-recorded"],
    targetPathways: ["expression-to-public-deliberation", "research-to-bounded-use"],
  },
  {
    id: "legitimation-to-decision-authority-separation",
    sourceBindings: ["word-story-religion-civilisation"],
    sourceRelations: ["sacred-order-legitimation-and-critique"],
    sourceInsights: ["counterauthority-before-synthesis", "story-orients-without-proving"],
    targetDomains: ["institutional-status", "legal-jurisdictional", "normative-public"],
    targetNodes: ["ACTION_PROPOSAL", "DECISION_RECORD", "AUTHORITY_GRANT_CLAIM", "AFFECTED_PARTY_REGISTER", "CONSENT_RECORD", "LAWFUL_BASIS_CLAIM", "RIGHTS_ASSESSMENT", "CAPABILITY_EVIDENCE"],
    targetRelations: ["SELECTS_PROPOSAL", "CLAIMS_AUTHORITY_FOR", "RECORDS_CONSENT_TO", "CLAIMS_LAWFUL_BASIS_FOR", "POTENTIALLY_AFFECTS", "TECHNICALLY_ENABLES"],
    targetLadder: ["proposal-recorded", "decision-recorded", "authority-claim-verified", "affected-party-basis-reviewed", "capability-verified"],
    targetPathways: ["research-to-bounded-use"],
  },
  {
    id: "translation-to-claim-assessment",
    sourceBindings: ["word-story-religion-civilisation"],
    sourceRelations: ["translation-contact-remaking"],
    sourceInsights: ["translation-preserves-seams", "polyphonic-fusion-not-unification"],
    targetDomains: ["semantic-symbolic", "informational-record", "normative-public"],
    targetNodes: ["EXPRESSION", "ARTIFACT", "CLAIM_ASSESSMENT", "NORMATIVE_ASSESSMENT", "ACTION_PROPOSAL"],
    targetRelations: ["DERIVES_FROM", "ASSESSES_UNDER_FRAMEWORK", "CHALLENGES", "CORRECTS"],
    targetLadder: ["expression-recorded", "artifact-versioned", "normative-assessment-separated", "proposal-recorded"],
    targetPathways: [],
  },
  {
    id: "counterstory-to-challenge-repair",
    sourceBindings: ["word-story-religion-civilisation"],
    sourceRelations: ["suppression-counterstory-revival"],
    sourceInsights: ["counterauthority-before-synthesis", "community-access-precedes-convenience"],
    targetDomains: ["semantic-symbolic", "informational-record", "attention-exposure", "social-relational", "institutional-status", "normative-public"],
    targetNodes: ["EXPRESSION", "ARTIFACT", "CLAIM_ASSESSMENT", "OUTCOME_OBSERVATION", "NORMATIVE_ASSESSMENT", "FEEDBACK_ITEM", "REPAIR_PROPOSAL", "REPAIR_ATTEMPT", "ACTION_PROPOSAL", "NON_ACTION"],
    targetRelations: ["CHALLENGES", "CORRECTS", "SUPERSEDES", "WITHDRAWS", "RESPONDS_WITH_REPAIR", "ASSESSES_UNDER_FRAMEWORK"],
    targetLadder: ["expression-recorded", "artifact-versioned", "outcome-observed", "normative-assessment-separated", "repair-proposed", "repair-outcome-reviewed", "proposal-recorded"],
    targetPathways: ["challenge-to-repair"],
  },
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

const BOUNDARIES = {
  read_only: true,
  structure_only: true,
  public_static_publication_family: true,
  network: false,
  filesystem_write: false,
  source_dereference: false,
  predecessor_files_read_for_verification: true,
  predecessor_mutation: false,
  predecessor_republication: false,
  historical_completeness_claimed: false,
  unsupported_domains_filled: false,
  score_or_rank: false,
  causal_claim_created: false,
  metaphysical_verdict: false,
  belief_identity_intent_or_emotion_inferred: false,
  person_or_group_targeting: false,
  persuasion_or_propaganda_design: false,
  prediction_or_simulation: false,
  authority_granted: false,
  consent_or_lawful_basis_established: false,
  action_proposed: false,
  action_attempted: false,
  action_executed: false,
  external_effect_claimed: false,
  writes_wake: false,
  writes_karma: false,
  publication_trigger: false,
  deployment_trigger: false,
  automatic_action: false,
} as const;

export type CivilisationRealityProjectionIssue = { field: string; code: string };
export type CivilisationRealityProjectionValidationOptions = { canonical?: boolean };

function fail(message: string): never {
  throw new Error(message);
}

function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, max = 2_000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function stringArray(value: unknown, min = 0, max = 24): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max &&
    value.every((entry) => text(entry));
}

function sameKeys(value: unknown, expected: readonly string[]): boolean {
  return object(value) && Object.keys(value).length === expected.length &&
    Object.keys(value).every((key) => expected.includes(key));
}

function exactStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry === expected[index]);
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
    if (current.depth > 64) return "json-depth-exceeded";
    if (++nodes > 20_000) return "json-node-budget-exceeded";
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
    for (const descriptor of Object.values(descriptors)) {
      if (Object.hasOwn(descriptor, "value")) stack.push({ value: descriptor.value, depth: current.depth + 1 });
    }
  }
  return null;
}

function readBoundedStrictJson(path: string, label: string): { value: unknown; rawDigest: string } {
  const absolute = resolve(path);
  let pathStat;
  try { pathStat = lstatSync(absolute); } catch { fail(`${label} is unavailable`); }
  if (!pathStat.isFile() || pathStat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  if (pathStat.size > MAX_BYTES) fail(`${label} exceeds ${MAX_BYTES} bytes`);
  if (typeof fsConstants.O_NOFOLLOW !== "number" || typeof fsConstants.O_NONBLOCK !== "number") fail(`${label} safe-open flags are unavailable`);
  let descriptor: number;
  try { descriptor = openSync(absolute, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK); }
  catch { fail(`${label} could not be opened safely`); }
  try {
    const before = fstatSync(descriptor);
    if (!before.isFile() || before.dev !== pathStat.dev || before.ino !== pathStat.ino || before.size !== pathStat.size) fail(`${label} changed while opening`);
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor);
    if (after.dev !== before.dev || after.ino !== before.ino || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) fail(`${label} changed while reading`);
    if (bytes.byteLength > MAX_BYTES) fail(`${label} exceeds ${MAX_BYTES} bytes`);
    return {
      value: parseStrictJsonBytes(bytes, `${label} JSON`),
      rawDigest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    };
  } finally {
    closeSync(descriptor);
  }
}

export function civilisationRealityProjectionDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("civilisation-reality projection integrity envelope is missing");
  material.integrity.digest = ZERO_DIGEST;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => entry?.id).filter((entry) => typeof entry === "string") : [];
}

function verifyCanonicalPredecessors(
  projection: Record<string, any>,
  add: (field: string, code: string) => void,
): void {
  const loadedByBinding = new Map<string, Record<string, any>>();
  for (const [index, expected] of PREDECESSORS.entries()) {
    try {
      const loaded = readBoundedStrictJson(expected.path, `${expected.id} predecessor`);
      if (loaded.rawDigest !== expected.raw_digest) add(`$.predecessor_bindings[${index}].raw_digest`, "local-predecessor-raw-digest-mismatch");
      if (!object(loaded.value) || loaded.value.protocol !== expected.protocol || loaded.value.map_id !== expected.map_id) {
        add(`$.predecessor_bindings[${index}]`, "local-predecessor-identity-mismatch");
      }
      if (!object(loaded.value?.integrity) || loaded.value.integrity.digest !== expected.semantic_digest) {
        add(`$.predecessor_bindings[${index}].semantic_digest`, "local-predecessor-semantic-digest-mismatch");
      }
      if (object(loaded.value)) loadedByBinding.set(expected.id, loaded.value);
    } catch {
      add(`$.predecessor_bindings[${index}]`, "local-predecessor-read-refused");
    }
  }

  const target = loadedByBinding.get("reality-influence-claim-graph");
  const targetVocabularies = target ? {
    target_domain_ids: new Set(ids(target.reality_domains)),
    target_node_type_ids: new Set(ids(target.claim_node_types)),
    target_relation_ids: new Set(ids(target.relation_vocabulary)),
    target_ladder_ids: new Set(ids(target.claim_ladder)),
    target_pathway_ids: new Set(ids(target.pathway_templates)),
  } : null;
  const targetRelationCards = new Map<string, Record<string, any>>(
    Array.isArray(target?.relation_vocabulary)
      ? target.relation_vocabulary.map((relation: Record<string, any>) => [relation.id, relation])
      : [],
  );

  const canonicalCrosswalks = Array.isArray(projection.crosswalks) ? projection.crosswalks : [];
  for (const [index, crosswalk] of canonicalCrosswalks.entries()) {
    const sourceBindings = Array.isArray(crosswalk?.source_binding_ids) ? crosswalk.source_binding_ids : [];
    for (const [field, collection] of [
      ["source_relation_ids", "influence_relations"],
      ["source_insight_ids", "kingdom_insights"],
    ] as const) {
      for (const nativeId of crosswalk?.[field] ?? []) {
        const owners = sourceBindings.filter((bindingId: string) => {
          const binding = loadedByBinding.get(bindingId);
          return binding ? ids(binding[collection]).includes(nativeId) : false;
        });
        if (owners.length !== 1) add(`$.crosswalks[${index}].${field}`, "source-id-missing-or-ambiguous-within-qualified-bindings");
      }
    }
    if (!targetVocabularies) {
      add(`$.crosswalks[${index}]`, "target-predecessor-unavailable");
      continue;
    }
    for (const field of Object.keys(targetVocabularies) as Array<keyof typeof targetVocabularies>) {
      for (const nativeId of crosswalk?.[field] ?? []) {
        if (!targetVocabularies[field].has(nativeId)) add(`$.crosswalks[${index}].${field}`, "target-id-not-owned-by-reality-binding");
      }
    }
    const listedNodes = new Set<string>(crosswalk?.target_node_type_ids ?? []);
    for (const relationId of crosswalk?.target_relation_ids ?? []) {
      const relation = targetRelationCards.get(relationId);
      if (!relation) continue;
      const fromClosed = Array.isArray(relation.from_kind_ids) &&
        relation.from_kind_ids.some((nodeId: string) => listedNodes.has(nodeId));
      const toClosed = Array.isArray(relation.to_kind_ids) &&
        relation.to_kind_ids.some((nodeId: string) => listedNodes.has(nodeId));
      if (!fromClosed || !toClosed) {
        add(`$.crosswalks[${index}].target_relation_ids`, "relation-endpoints-not-represented-by-crosswalk-node-set");
      }
    }
  }
}

export function validateCivilisationRealityProjection(
  value: unknown,
  options: CivilisationRealityProjectionValidationOptions = {},
): CivilisationRealityProjectionIssue[] {
  const issues: CivilisationRealityProjectionIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    const shape = jsonShapeIssue(value);
    if (shape) return [{ field: "$", code: shape }];
    if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
    if (value.$schema !== CIVILISATION_REALITY_PROJECTION_SCHEMA_ID) add("$.$schema", "schema-mismatch");
    if (value.protocol !== CIVILISATION_REALITY_PROJECTION_PROTOCOL) add("$.protocol", "protocol-mismatch");
    if (value.projection_id !== CIVILISATION_REALITY_PROJECTION_ID || value.version !== "0.1.0" ||
        value.compiled_on !== "2026-08-25" || value.evidence_through !== "2026-08-21") add("$.projection_id", "identity-or-horizon-mismatch");
    if (!text(value.title, 200) || value.state !== "reviewed-thin-additive-crosswalk") add("$.state", "state-mismatch");

    if (!sameKeys(value.scope, SCOPE_KEYS) || !text(value.scope?.question) ||
        !stringArray(value.scope?.intended_use, 1) || !stringArray(value.scope?.excluded_use, 1) ||
        !text(value.scope?.unit_of_analysis) || !text(value.scope?.projection_rule) ||
        !text(value.scope?.open_domain_rule) || value.scope?.data_classification !== "public-static-research-crosswalk") {
      add("$.scope", "invalid-or-promoted-scope");
    }

    if (!sameKeys(value.projection_rules, PROJECTION_RULE_KEYS) ||
        !PROJECTION_RULE_KEYS.every((key) => value.projection_rules?.[key] === true)) {
      add("$.projection_rules", "projection-rule-firewall-mismatch");
    }

    const predecessors = Array.isArray(value.predecessor_bindings) ? value.predecessor_bindings : [];
    if (predecessors.length !== PREDECESSORS.length) add("$.predecessor_bindings", "predecessor-count-mismatch");
    for (const [index, expected] of PREDECESSORS.entries()) {
      const predecessor = predecessors[index];
      if (!sameKeys(predecessor, PREDECESSOR_KEYS) || predecessor?.id !== expected.id ||
          predecessor?.protocol !== expected.protocol || predecessor?.map_id !== expected.map_id ||
          predecessor?.locator !== expected.locator || predecessor?.raw_digest !== expected.raw_digest ||
          predecessor?.semantic_digest !== expected.semantic_digest || predecessor?.relation !== expected.relation ||
          predecessor?.mutated !== false || predecessor?.republished !== false || predecessor?.authority_imported !== false) {
        add(`$.predecessor_bindings[${index}]`, "predecessor-binding-mismatch");
      }
    }

    const crosswalks = Array.isArray(value.crosswalks) ? value.crosswalks : [];
    if (crosswalks.length !== CROSSWALKS.length) add("$.crosswalks", "crosswalk-count-mismatch");
    for (const [index, expected] of CROSSWALKS.entries()) {
      const crosswalk = crosswalks[index];
      if (!sameKeys(crosswalk, CROSSWALK_KEYS) || crosswalk?.id !== expected.id || !ID.test(crosswalk?.id ?? "") ||
          !exactStrings(crosswalk?.source_binding_ids, expected.sourceBindings) ||
          !exactStrings(crosswalk?.source_relation_ids, expected.sourceRelations) ||
          !exactStrings(crosswalk?.source_insight_ids, expected.sourceInsights) ||
          !exactStrings(crosswalk?.target_domain_ids, expected.targetDomains) ||
          !exactStrings(crosswalk?.target_node_type_ids, expected.targetNodes) ||
          !exactStrings(crosswalk?.target_relation_ids, expected.targetRelations) ||
          !exactStrings(crosswalk?.target_ladder_ids, expected.targetLadder) ||
          !exactStrings(crosswalk?.target_pathway_ids, expected.targetPathways) ||
          crosswalk?.register !== "DESIGN_COMMITMENT" ||
          crosswalk?.transfer_status !== "projection-not-historical-or-causal-finding" ||
          !text(crosswalk?.statement) || !stringArray(crosswalk?.preserved_distinctions, 1) ||
          !stringArray(crosswalk?.required_evidence, 1) || !stringArray(crosswalk?.alternative_paths, 1) ||
          !stringArray(crosswalk?.stop_conditions, 1) || crosswalk?.external_effect_claimed !== false ||
          crosswalk?.authority_granted !== false) {
        add(`$.crosswalks[${index}]`, "crosswalk-mismatch-or-claim-promotion");
      }
    }

    const openDomains = Array.isArray(value.open_domains) ? value.open_domains : [];
    if (openDomains.length !== OPEN_DOMAIN_IDS.length ||
        !openDomains.every((entry, index) => entry?.id === OPEN_DOMAIN_IDS[index])) {
      add("$.open_domains", "open-domain-order-or-membership-mismatch");
    }
    for (const [index, domain] of openDomains.entries()) {
      if (!sameKeys(domain, OPEN_DOMAIN_KEYS) || !ID.test(domain?.id ?? "") || !text(domain?.question) ||
          domain?.coverage_status !== "not-supported-by-pinned-predecessors" ||
          !text(domain?.why_not_projectable) || !stringArray(domain?.needed_evidence, 1) ||
          !text(domain?.stop_condition)) {
        add(`$.open_domains[${index}]`, "invalid-or-filled-open-domain");
      }
    }

    if (!sameKeys(value.boundaries, Object.keys(BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
    for (const [key, expected] of Object.entries(BOUNDARIES)) {
      if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");
    }

    if (!sameKeys(value.integrity, INTEGRITY_KEYS) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM ||
        !SHA256.test(value.integrity?.digest ?? "") || value.integrity?.digest_field_zeroed !== true) {
      add("$.integrity", "invalid-integrity-envelope");
    } else {
      const computed = civilisationRealityProjectionDigest(value);
      if (value.integrity.digest !== computed) add("$.integrity.digest", "digest-mismatch");
      if (value.integrity.digest !== CIVILISATION_REALITY_PROJECTION_REVIEWED_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
    }

    if (options.canonical) verifyCanonicalPredecessors(value, add);
  } catch {
    add("$", "validator-unavailable-for-value");
  }
  return issues;
}

export function loadCivilisationRealityProjection(
  path = CIVILISATION_REALITY_PROJECTION_PATH,
): Record<string, any> {
  const loaded = readBoundedStrictJson(path, "civilisation-reality projection");
  const canonical = resolve(path) === resolve(CIVILISATION_REALITY_PROJECTION_PATH);
  const issues = validateCivilisationRealityProjection(loaded.value, { canonical });
  if (issues.length) {
    fail(`civilisation-reality projection refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  }
  return loaded.value as Record<string, any>;
}

export function civilisationRealityPublicDiscovery(
  value = loadCivilisationRealityProjection(),
): Record<string, any> {
  return {
    protocol: value.protocol,
    projection_id: value.projection_id,
    title: value.title,
    publication_state: "immutable-versioned-static-family",
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    urls: {
      atlas: CIVILISATION_REALITY_PROJECTION_URL,
      schema: CIVILISATION_REALITY_PROJECTION_SCHEMA_URL,
      guide: CIVILISATION_REALITY_PROJECTION_DOCUMENT_URL,
    },
    integrity: value.integrity,
    counts: {
      predecessor_bindings: value.predecessor_bindings.length,
      crosswalks: value.crosswalks.length,
      open_domains: value.open_domains.length,
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
      causal_claim_created: value.boundaries.causal_claim_created,
      metaphysical_verdict: value.boundaries.metaphysical_verdict,
      authority_granted: value.boundaries.authority_granted,
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
    "A thin, explicitly lossy crosswalk between the immutable Word, Story, Religion & Civilisation map and the immutable Reality Influence Claim Graph.",
    "It maps six seams: naming/expression; story/public deliberation; canon/selection feedback; legitimation/decision ≠ authority; translation/claim assessment; suppression-counterstory/challenge-repair.",
    "War, coercion, class, status, emotion, revolution, fiscal shocks, propaganda/media, and citizen–governance dynamics remain open because these two predecessors do not support them.",
    "",
    `${value.predecessor_bindings.length} exact predecessor bindings · ${value.crosswalks.length} interpretive crosswalks · ${value.open_domains.length} open domains`,
    `${value.state} · ${value.integrity.digest}`,
    "",
    "STRUCTURE ONLY — no score, causal claim, metaphysical verdict, authority, consent, action, prediction, persuasion system, publication trigger, deployment trigger, or external effect.",
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write("usage: bun bin/civilisation-reality-projection.ts [overview|crosswalks|open-domains|boundaries|discovery|verify] [--json]\n");
  process.exit(2);
}

export async function runCivilisationRealityProjectionCli(
  args = process.argv.slice(2),
): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndexes = copy.flatMap((entry, index) => entry === "--json" ? [index] : []);
  if (jsonIndexes.length > 1) usage();
  const json = jsonIndexes.length === 1;
  if (json) copy.splice(jsonIndexes[0]!, 1);
  if (copy.length) usage();

  if (command === "verify") {
    let issues: CivilisationRealityProjectionIssue[];
    try {
      const loaded = readBoundedStrictJson(CIVILISATION_REALITY_PROJECTION_PATH, "civilisation-reality projection");
      issues = validateCivilisationRealityProjection(loaded.value, { canonical: true });
    } catch (error) {
      issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }];
    }
    const report = {
      valid: issues.length === 0,
      protocol: CIVILISATION_REALITY_PROJECTION_PROTOCOL,
      structure_only: true,
      schema_checked: false,
      predecessor_files_digest_checked: true,
      source_dereferenced: false,
      unsupported_domains_filled: false,
      score_causation_metaphysics_or_authority_established: false,
      action_or_external_effect_created: false,
      issues,
    };
    if (json) process.stdout.write(`${JSON.stringify(report)}\n`);
    else if (!issues.length) process.stdout.write("Civilisation → Reality Projection: valid thin crosswalk, exact local predecessor pins, explicit open domains, fixed non-grants, and semantic digest; external sources and JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }

  const value = loadCivilisationRealityProjection();
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (command === "crosswalks") process.stdout.write(`${JSON.stringify({ projection_id: value.projection_id, crosswalks: value.crosswalks }, null, json ? 0 : 2)}\n`);
  else if (command === "open-domains") process.stdout.write(`${JSON.stringify({ projection_id: value.projection_id, open_domains: value.open_domains }, null, json ? 0 : 2)}\n`);
  else if (command === "boundaries") process.stdout.write(`${JSON.stringify({ projection_id: value.projection_id, boundaries: value.boundaries }, null, json ? 0 : 2)}\n`);
  else if (command === "discovery") process.stdout.write(`${JSON.stringify(civilisationRealityPublicDiscovery(value), null, json ? 0 : 2)}\n`);
  else usage();
}

if (import.meta.main) {
  try {
    await runCivilisationRealityProjectionCli();
  } catch (error) {
    process.stderr.write(`civilisation-reality projection refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
