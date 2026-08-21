#!/usr/bin/env bun
/**
 * Strict, network-free reader and renderer for the UK Government
 * Transformation Engine Phase-0 publication.
 *
 * The publication contains independent synthetic orientation dossiers. It
 * does not analyse, advise, approve, select, decide, adopt or act. The dated
 * immutable artifact records stateAtPublication only. Reader-time freshness is
 * enforced by release and live checks, never by changing historical bytes.
 */

import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { readRegularFileWithinRoot } from "./immutable-publications.ts";
import { parseStrictJsonBytes } from "./principality.ts";
import {
  UK_GOVERNMENT_ENGINE_BYTE_SHA256,
  UK_GOVERNMENT_ENGINE_CANONICAL_SHA256,
  UK_GOVERNMENT_ENGINE_CANONICAL_URL,
  UK_GOVERNMENT_ENGINE_GUIDE_URL,
  UK_GOVERNMENT_ENGINE_PROTOCOL,
  UK_GOVERNMENT_ENGINE_SCHEMA_URL,
  loadUkGovernmentEnginePublication,
  ukGovernmentEngineCanonicalJson,
} from "./uk-government-engine.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_PROTOCOL =
  "kingdom.government-transformation-orientation-public-snapshot/0.1";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_LOCATOR =
  "data/government/uk-government-transformation-engine.v0.1.json";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_PAGE_LOCATOR =
  "site/government-transformation-engine/index.html";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_LOCATOR =
  "site/government-transformations.json";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_LOCATOR =
  "schemas/government-transformation-engine/v0.1/public-snapshot.schema.json";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_LOCATOR =
  "references/uk-government-transformation-engine-v0.1.md";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL =
  "https://thekingdom.dev/government-transformation-engine/";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL =
  "https://thekingdom.dev/government-transformations.json";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL =
  "https://thekingdom.dev/government/uk-government-transformation-engine-2026-08-21.json";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL =
  "https://thekingdom.dev/government/transformations/schemas/v0.1/public-snapshot.schema.json";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL =
  "https://thekingdom.dev/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_REPOSITORY_URL =
  "https://github.com/cambridgetcg/kingdom-government-transformation-engine";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL =
  "https://github.com/cambridgetcg/kingdom-government-transformation-engine/tree/v0.1.0";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256 =
  "fef3ca1719cb7fd02c09c558db6f239cad29a173b921763a10a59e042a4cdf00";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_SHA256 =
  "7d9df6d5b6292b46abfbc076847f7e033b8d889be7a868dcbeac5d901b75c715";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_BYTE_SHA256 =
  "9949457e87db784c734b195195c7f3cdc2afb138ada400f61583ebd0a6cf7be6";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_CANONICAL_SHA256 =
  "b7118c1cd2f226b276b02f21bb080d3e3e5aae6aa26bc03e74277a5d1844c5c9";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_BYTE_SHA256 =
  "cf025c3ed0baaca5ef08dc5ba5187f50ae1aa8596878f1a28e34be7d62a1d9c8";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_AS_OF = "2026-08-21";
export const UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE = "2026-09-21";

const MAX_SNAPSHOT_BYTES = 256 * 1024;
const MAX_SCHEMA_BYTES = 128 * 1024;
const MAX_TREE_DEPTH = 40;
const MAX_TREE_NODES = 120_000;
const MAX_STRING_CODE_UNITS = 1_000_000;
const MAX_ARRAY_ITEMS = 2048;

const EXPECTED_COUNTS = Object.freeze({
  authorityDependencyEdges: 17,
  authorityDependencyNodes: 25,
  causalEdges: 24,
  causalNodes: 30,
  desiredOutcomes: 3,
  dossiers: 3,
  evidenceAtoms: 30,
  externalContextBindings: 4,
  humanGates: 6,
  jurisdictionBranches: 4,
  options: 9,
  planeAssessments: 18,
  routeOrientations: 4,
});

const PLANE_IDS = Object.freeze([
  "plane:delivery",
  "plane:jurisdiction",
  "plane:law",
  "plane:mandate",
  "plane:money",
  "plane:remedy",
]);
const DOSSIER_IDS = Object.freeze([
  "dossier:four-nation-public-service-information",
  "dossier:hmrc-decision-notice-explanatory-content",
  "dossier:public-money-transparency-information-service",
]);
const STATUS_VALUES = new Set([
  "not-assessed",
  "insufficient-evidence",
  "contested",
  "specialist-review-required",
  "orientation-supported",
]);
const DEPENDENCY_TYPES = new Set([
  "prerequisite",
  "parallel",
  "alternative",
  "feedback",
  "does-not-imply",
]);
const CAUSAL_NODE_TYPES = new Set([
  "intervention-option",
  "assumption",
  "output",
  "desired-outcome",
  "negative-pathway",
  "evaluation-need",
]);
const CAUSAL_EDGE_TYPES = new Set([
  "hypothesises-contribution",
  "depends-on",
  "may-undermine",
  "tests",
]);

type JsonObject = Record<string, any>;

function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function ukGovernmentTransformationCanonicalJson(value: unknown): string {
  return ukGovernmentEngineCanonicalJson(value);
}

function sameJson(left: unknown, right: unknown): boolean {
  return ukGovernmentTransformationCanonicalJson(left) ===
    ukGovernmentTransformationCanonicalJson(right);
}

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function validDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  return instant.getUTCFullYear() === year &&
    instant.getUTCMonth() === month - 1 &&
    instant.getUTCDate() === day;
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
  if (!reference.startsWith("#/")) {
    throw new Error("unsupported transformation schema reference " + reference);
  }
  let current: unknown = root;
  for (const raw of reference.slice(2).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!object(current) || !Object.hasOwn(current, key)) {
      throw new Error("unresolved transformation schema reference " + reference);
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
  if (depth > 72) return [path + ": schema nesting exceeds 72"];
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
  if (typeof value === "string") {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) {
      issues.push(path + ": string is too short");
    }
    if (schema.maxLength !== undefined && length > schema.maxLength) {
      issues.push(path + ": string is too long");
    }
    if (typeof schema.pattern === "string" &&
        !new RegExp(schema.pattern, "u").test(value)) {
      issues.push(path + ": string does not match pattern");
    }
    if (schema.format === "date" && !validDate(value)) {
      issues.push(path + ": string is not a real date");
    }
    if (schema.format === "uri" && !validUri(value)) {
      issues.push(path + ": string is not a URI");
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      issues.push(path + ": array has too few items");
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      issues.push(path + ": array has too many items");
    }
    if (schema.uniqueItems === true &&
        new Set(value.map(ukGovernmentTransformationCanonicalJson)).size !== value.length) {
      issues.push(path + ": array items must be unique");
    }
    if (schema.items !== undefined) {
      value.forEach((entry, index) => {
        issues.push(...schemaIssues(entry, schema.items, path + "/" + index, root, depth + 1));
      });
    }
  }
  if (object(value)) {
    const properties = object(schema.properties) ? schema.properties : {};
    for (const required of Array.isArray(schema.required) ? schema.required : []) {
      if (!Object.hasOwn(value, required)) {
        issues.push(path + "/" + required + ": required property is missing");
      }
    }
    for (const [key, entry] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) {
        issues.push(...schemaIssues(entry, properties[key], path + "/" + key, root, depth + 1));
      } else if (schema.additionalProperties === false) {
        issues.push(path + "/" + key + ": additional property is forbidden");
      } else if (object(schema.additionalProperties)) {
        issues.push(...schemaIssues(
          entry,
          schema.additionalProperties,
          path + "/" + key,
          root,
          depth + 1,
        ));
      }
    }
  }
  return issues;
}

function assertClosedSchemaDocument(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertClosedSchemaDocument(entry, path + "/" + index));
    return;
  }
  if (!object(value)) return;
  if (value.type === "object") {
    if (value.additionalProperties !== false || !object(value.properties) ||
        !Array.isArray(value.required) ||
        !sameJson([...value.required].sort(), Object.keys(value.properties).sort())) {
      throw new Error(path + ": transformation schema object is not closed with all properties required");
    }
  }
  for (const [key, entry] of Object.entries(value)) {
    assertClosedSchemaDocument(entry, path + "/" + key);
  }
}

function loadSchemaPublication(): JsonObject {
  const bytes = readRegularFileWithinRoot(
    ROOT,
    UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_LOCATOR,
  );
  if (bytes.byteLength !== 47_800 ||
      bytes.byteLength > MAX_SCHEMA_BYTES ||
      sha256(bytes) !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_BYTE_SHA256) {
    throw new Error("UK Government Transformation Engine schema byte receipt drifted");
  }
  const schema = parseStrictJsonBytes(
    bytes,
    "UK Government Transformation Engine public snapshot schema",
  );
  if (!object(schema) ||
      schema.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
      schema.$id !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL) {
    throw new Error("UK Government Transformation Engine schema identity drifted");
  }
  if (sha256(ukGovernmentTransformationCanonicalJson(schema)) !==
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_CANONICAL_SHA256) {
    throw new Error("UK Government Transformation Engine schema canonical receipt drifted");
  }
  assertClosedSchemaDocument(schema);
  return schema;
}

export function ukGovernmentTransformationSchemaIssues(value: unknown): string[] {
  const schema = loadSchemaPublication();
  return schemaIssues(value, schema, "$", schema);
}

function assertBoundedJsonTree(
  value: unknown,
  depth = 0,
  budget = { nodes: 0, strings: 0 },
): void {
  if (depth > MAX_TREE_DEPTH) {
    throw new Error("UK Government Transformation Engine JSON nesting exceeds " + MAX_TREE_DEPTH);
  }
  budget.nodes += 1;
  if (budget.nodes > MAX_TREE_NODES) {
    throw new Error("UK Government Transformation Engine JSON node budget exceeded");
  }
  if (typeof value === "string") {
    if (value.length > 16_384) {
      throw new Error("UK Government Transformation Engine contains an oversized string");
    }
    budget.strings += value.length;
    if (budget.strings > MAX_STRING_CODE_UNITS) {
      throw new Error("UK Government Transformation Engine string budget exceeded");
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) {
      throw new Error("UK Government Transformation Engine array budget exceeded");
    }
    value.forEach((entry) => assertBoundedJsonTree(entry, depth + 1, budget));
    return;
  }
  if (object(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (key.length > 128) {
        throw new Error("UK Government Transformation Engine contains an oversized object key");
      }
      assertBoundedJsonTree(entry, depth + 1, budget);
    }
  }
}

function requireOrderedUnique(values: JsonObject[], label: string): Set<string> {
  const ids = values.map((value) => value.id);
  if (ids.some((id) => typeof id !== "string") ||
      new Set(ids).size !== ids.length ||
      ids.some((id, index) => index > 0 && ids[index - 1].localeCompare(id) >= 0)) {
    throw new Error(label + " must be uniquely ordered by id");
  }
  return new Set(ids);
}

function requireReferences(
  values: unknown,
  allowed: Set<string>,
  label: string,
  allowEmpty = false,
): void {
  if (!Array.isArray(values) ||
      (!allowEmpty && values.length === 0) ||
      values.some((id) => typeof id !== "string" || !allowed.has(id))) {
    throw new Error(label + " contains an unresolved reference");
  }
}

function requireEmptyActions(value: unknown, label: string): void {
  const keys = ["decision", "evaluation", "implementation", "operational", "redress"];
  if (!object(value) ||
      !sameJson(Object.keys(value).sort(), keys) ||
      Object.values(value).some((entry) => !Array.isArray(entry) || entry.length !== 0)) {
    throw new Error(label + " action arrays must all exist and remain empty");
  }
}

function baseInventory(base: JsonObject): {
  typed: Map<string, Set<string>>;
  all: Set<string>;
} {
  const mappings: Record<string, JsonObject[]> = {
    body: base.bodies,
    claim: base.claims,
    flow: base.flows,
    plane: base.planes,
    rail: base.rails,
    redressRoute: base.redressRoutes,
    relation: base.relations,
    source: base.sources,
    unknown: base.unknowns,
  };
  const typed = new Map<string, Set<string>>();
  const all = new Set<string>();
  for (const [type, records] of Object.entries(mappings)) {
    const ids = new Set(records.map((record) => record.id));
    typed.set(type, ids);
    ids.forEach((id) => all.add(id));
  }
  return { typed, all };
}

function baseBridgeBindings(base: JsonObject): Set<string> {
  const bindings = new Set<string>();
  for (const bridge of base.externalBridges) {
    for (const binding of bridge.selectedRecordBindings) {
      bindings.add(bridge.id + "\u0000" + binding.collection + "\u0000" + binding.recordId);
    }
  }
  return bindings;
}

function graphReachable(
  edges: JsonObject[],
  fromId: string,
  target: (id: string) => boolean,
): boolean {
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const next = outgoing.get(edge.fromId) ?? [];
    next.push(edge.toId);
    outgoing.set(edge.fromId, next);
  }
  const visited = new Set([fromId]);
  const pending = [...(outgoing.get(fromId) ?? [])];
  while (pending.length) {
    const current = pending.shift()!;
    if (target(current)) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    pending.push(...(outgoing.get(current) ?? []));
  }
  return false;
}

function assertNoScalarOrDecisionFields(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoScalarOrDecisionFields(entry, path + "/" + index));
    return;
  }
  if (!object(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const falseBoundary = (path === "$/boundaries") && entry === false;
    if (!falseBoundary &&
        /^(?:score|rank|rating|recommendation|approved|authorised|eligible|funded|lawful|pass|ready)$/iu.test(key)) {
      throw new Error(path + "/" + key + ": forbidden scalar or decision field");
    }
    assertNoScalarOrDecisionFields(entry, path + "/" + key);
  }
}

function expectedBaseSnapshot(): JsonObject {
  return {
    admissionMode: "exact-immutable-vendored-snapshot-only",
    asOf: UK_GOVERNMENT_TRANSFORMATION_ENGINE_AS_OF,
    byteReceipt: "sha256:" + UK_GOVERNMENT_ENGINE_BYTE_SHA256,
    bytes: 196_005,
    canonicalReceipt: "sha256:" + UK_GOVERNMENT_ENGINE_CANONICAL_SHA256,
    canonicalUrl: UK_GOVERNMENT_ENGINE_CANONICAL_URL,
    contractVersion: "0.1.0",
    exactTextHumanReviewed: false,
    guideUrl: UK_GOVERNMENT_ENGINE_GUIDE_URL,
    nextReviewDue: UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
    officialSourceHandling: "link-only",
    path: "vendor/government-engine/government-2026-08-21.json",
    planeIds: [...PLANE_IDS],
    runtimeFetch: false,
    schema: UK_GOVERNMENT_ENGINE_PROTOCOL,
    schemaUrl: UK_GOVERNMENT_ENGINE_SCHEMA_URL,
  };
}

function expectedCountsFromDossiers(dossiers: JsonObject[]): JsonObject {
  const sum = (key: string) => dossiers.reduce((total, dossier) =>
    total + dossier[key].length, 0);
  return {
    authorityDependencyEdges: dossiers.reduce((total, dossier) =>
      total + dossier.authorityDependencyGraph.edges.length, 0),
    authorityDependencyNodes: dossiers.reduce((total, dossier) =>
      total + dossier.authorityDependencyGraph.nodes.length, 0),
    causalEdges: dossiers.reduce((total, dossier) =>
      total + dossier.causalChangeHypothesisGraph.edges.length, 0),
    causalNodes: dossiers.reduce((total, dossier) =>
      total + dossier.causalChangeHypothesisGraph.nodes.length, 0),
    desiredOutcomes: sum("desiredOutcomes"),
    dossiers: dossiers.length,
    evidenceAtoms: sum("evidenceAtoms"),
    externalContextBindings: sum("externalContext"),
    humanGates: sum("humanGates"),
    jurisdictionBranches: sum("jurisdictionBranches"),
    options: sum("options"),
    planeAssessments: sum("planeAssessments"),
    routeOrientations: sum("routeOrientations"),
  };
}

function assertDossier(
  dossier: JsonObject,
  base: JsonObject,
  inventory: ReturnType<typeof baseInventory>,
  bridgeBindings: Set<string>,
): void {
  if (dossier.synthetic !== true ||
      typeof dossier.title !== "string" ||
      !dossier.title.startsWith("Synthetic ")) {
    throw new Error(dossier.id + ": dossier must remain visibly synthetic");
  }
  if (!sameJson(dossier.adoption, {
    authorityLocation: "outside-this-system",
    state: "not-adopted",
  })) {
    throw new Error(dossier.id + ": adoption must remain outside this system and not adopted");
  }
  if (!sameJson(dossier.trialChamber, {
    compatibility: "unavailable",
    result: null,
    useAsAuthority: false,
  })) {
    throw new Error(dossier.id + ": Trial Chamber must remain unavailable and non-authoritative");
  }
  requireEmptyActions(dossier.actionArrays, dossier.id);
  if (dossier.hold.state !== "held" || dossier.hold.stopsProgression !== true ||
      typeof dossier.hold.reasonCode !== "string") {
    throw new Error(dossier.id + ": a named hold must stop progression");
  }
  if (dossier.selectionState !== "not-selected" ||
      dossier.preferredOptionId !== null) {
    throw new Error(dossier.id + ": no option may be preferred or selected");
  }

  const proposition = dossier.proposition;
  const { canonicalReceipt, ...propositionInput } = proposition;
  if (proposition.dossierId !== dossier.id ||
      proposition.kind !== "synthetic-exemplar" ||
      proposition.humanReviewed !== false ||
      proposition.officialProposal !== false ||
      proposition.personalDataPresent !== false ||
      proposition.sourceAuthorship !==
        "codex-assisted-publication-under-recorded-human-direction" ||
      typeof proposition.verbatimStatement !== "string" ||
      proposition.verbatimStatement.length < 40 ||
      !Array.isArray(proposition.outOfScope) ||
      proposition.outOfScope.length < 3 ||
      !Array.isArray(proposition.affectedTerritories) ||
      proposition.affectedTerritories.length < 1 ||
      canonicalReceipt !== "sha256:" +
        sha256(ukGovernmentTransformationCanonicalJson(propositionInput))) {
    throw new Error(dossier.id + ": synthetic proposition boundary or receipt drifted");
  }

  const evidenceIds = requireOrderedUnique(
    dossier.evidenceAtoms,
    dossier.id + " evidence atoms",
  );
  const assessmentIds = requireOrderedUnique(
    dossier.planeAssessments,
    dossier.id + " plane assessments",
  );
  const optionIds = requireOrderedUnique(dossier.options, dossier.id + " options");
  requireOrderedUnique(dossier.humanGates, dossier.id + " human gates");
  requireOrderedUnique(
    dossier.authorityDependencyGraph.nodes,
    dossier.id + " authority nodes",
  );
  const authorityEdgeIds = requireOrderedUnique(
    dossier.authorityDependencyGraph.edges,
    dossier.id + " authority edges",
  );
  requireOrderedUnique(
    dossier.causalChangeHypothesisGraph.nodes,
    dossier.id + " causal nodes",
  );
  requireOrderedUnique(
    dossier.causalChangeHypothesisGraph.edges,
    dossier.id + " causal edges",
  );
  requireOrderedUnique(dossier.desiredOutcomes, dossier.id + " desired outcomes");
  if (dossier.jurisdictionBranches.length) {
    requireOrderedUnique(dossier.jurisdictionBranches, dossier.id + " jurisdiction branches");
  }
  if (dossier.routeOrientations.length) {
    requireOrderedUnique(dossier.routeOrientations, dossier.id + " remedy orientations");
  }
  void authorityEdgeIds;

  if (dossier.options.length < 3 ||
      dossier.options.filter((option: JsonObject) =>
        option.kind === "business-as-usual").length !== 1 ||
      dossier.options.filter((option: JsonObject) =>
        option.kind === "alternative").length < 2 ||
      dossier.options.some((option: JsonObject) => option.selected !== false)) {
    throw new Error(dossier.id + ": options must be one BAU plus alternatives, all unselected");
  }
  if (dossier.humanGates.length === 0 ||
      dossier.humanGates.some((gate: JsonObject) =>
        gate.required !== true ||
        gate.completed !== false ||
        gate.authorityOutsideSystem !== true)) {
    throw new Error(dossier.id + ": all human gates must remain required, incomplete and outside-system");
  }

  if (dossier.planeAssessments.length !== 6 ||
      !sameJson(
        dossier.planeAssessments.map((assessment: JsonObject) =>
          assessment.planeId).sort(),
        [...PLANE_IDS],
      )) {
    throw new Error(dossier.id + ": exactly six typed plane assessments are required");
  }
  for (const assessment of dossier.planeAssessments) {
    if (!STATUS_VALUES.has(assessment.status)) {
      throw new Error(assessment.id + ": invalid assessment status");
    }
    requireReferences(
      assessment.evidenceAtomIds,
      evidenceIds,
      assessment.id + " evidenceAtomIds",
    );
    if (!Array.isArray(assessment.unresolvedQuestionIds) ||
        assessment.unresolvedQuestionIds.length === 0) {
      throw new Error(assessment.id + ": unresolved questions must remain visible");
    }
    if (assessment.status === "specialist-review-required" &&
        assessment.specialistReviewRequired !== true) {
      throw new Error(assessment.id + ": specialist status requires specialist review");
    }
    const applicableIncompleteGate = dossier.humanGates.some((gate: JsonObject) =>
      gate.planeIds.includes(assessment.planeId) && gate.completed !== true);
    const hasNonSupportingAtom = assessment.evidenceAtomIds.some((id: string) =>
      dossier.evidenceAtoms.find((atom: JsonObject) => atom.id === id)
        ?.supportsConclusion !== true);
    if (assessment.status === "orientation-supported" &&
        (assessment.specialistReviewRequired === true ||
          assessment.unresolvedQuestionIds.length > 0 ||
          applicableIncompleteGate ||
          hasNonSupportingAtom)) {
      throw new Error(assessment.id +
        ": orientation-supported conflicts with unresolved review or non-supporting evidence");
    }
  }
  const usedEvidence = new Set(
    dossier.planeAssessments.flatMap((assessment: JsonObject) =>
      assessment.evidenceAtomIds),
  );
  if (!sameJson([...usedEvidence].sort(), [...evidenceIds].sort())) {
    throw new Error(dossier.id + ": every evidence atom must be used by an assessment");
  }

  for (const atom of dossier.evidenceAtoms) {
    if (atom.baseSnapshotByteReceipt !==
        "sha256:" + UK_GOVERNMENT_ENGINE_BYTE_SHA256 ||
        atom.baseSnapshotCanonicalReceipt !==
        "sha256:" + UK_GOVERNMENT_ENGINE_CANONICAL_SHA256 ||
        atom.baseSnapshotCanonicalUrl !== UK_GOVERNMENT_ENGINE_CANONICAL_URL ||
        atom.evidenceUse !== "orientation-only" ||
        atom.officialSourceHandling !== "link-only" ||
        atom.exactTextHumanReviewed !== false ||
        atom.genericOfficialHostTrust !== false ||
        atom.supportsConclusion !== false) {
      throw new Error(atom.id + ": evidence limitation or base receipt drifted");
    }
    if (!inventory.typed.get(atom.baseEntityType)?.has(atom.baseEntityId)) {
      throw new Error(atom.id + ": unknown or mistyped admitted base entity");
    }
  }

  const authority = dossier.authorityDependencyGraph;
  const authorityNodeIds = new Set(
    authority.nodes.map((node: JsonObject) => node.id),
  );
  const assessmentById = new Map(
    dossier.planeAssessments.map((assessment: JsonObject) =>
      [assessment.id, assessment]),
  );
  if (authority.automaticProgression !== false ||
      !sameJson(
        [...new Set(authority.nodes.map((node: JsonObject) => node.planeId))].sort(),
        [...PLANE_IDS],
      )) {
    throw new Error(dossier.id + ": authority graph must cover six planes without progression");
  }
  for (const node of authority.nodes) {
    const assessment = assessmentById.get(node.assessmentId);
    if (!assessment || assessment.planeId !== node.planeId ||
        !PLANE_IDS.includes(node.planeId)) {
      throw new Error(node.id + ": authority node assessment or plane mismatch");
    }
    requireReferences(
      node.baseEntityIds,
      inventory.all,
      node.id + " baseEntityIds",
    );
  }
  for (const edge of authority.edges) {
    if (!authorityNodeIds.has(edge.fromId) ||
        !authorityNodeIds.has(edge.toId) ||
        edge.fromId === edge.toId ||
        !DEPENDENCY_TYPES.has(edge.type)) {
      throw new Error(edge.id + ": invalid typed authority dependency");
    }
  }

  const causal = dossier.causalChangeHypothesisGraph;
  const causalNodeIds = new Set(causal.nodes.map((node: JsonObject) => node.id));
  const causalNodeById = new Map(
    causal.nodes.map((node: JsonObject) => [node.id, node]),
  );
  if (causal.claimsCausalTruth !== false) {
    throw new Error(dossier.id + ": causal graph must state claimsCausalTruth false");
  }
  for (const node of causal.nodes) {
    if (!CAUSAL_NODE_TYPES.has(node.type) ||
        (node.type === "intervention-option"
          ? !optionIds.has(node.optionId)
          : node.optionId !== null)) {
      throw new Error(node.id + ": invalid causal node or option binding");
    }
  }
  const causalTypes = new Set(causal.nodes.map((node: JsonObject) => node.type));
  for (const required of [
    "assumption",
    "desired-outcome",
    "evaluation-need",
    "negative-pathway",
    "output",
  ]) {
    if (!causalTypes.has(required)) {
      throw new Error(dossier.id + ": causal graph lacks " + required);
    }
  }
  for (const edge of causal.edges) {
    const from = causalNodeById.get(edge.fromId);
    const to = causalNodeById.get(edge.toId);
    if (!causalNodeIds.has(edge.fromId) ||
        !causalNodeIds.has(edge.toId) ||
        edge.fromId === edge.toId ||
        !CAUSAL_EDGE_TYPES.has(edge.type)) {
      throw new Error(edge.id + ": invalid causal hypothesis edge");
    }
    if (edge.type === "depends-on" &&
        (from?.type !== "desired-outcome" || to?.type !== "assumption")) {
      throw new Error(edge.id + ": depends-on causal direction drifted");
    }
    if (edge.type === "may-undermine" &&
        (from?.type !== "negative-pathway" || to?.type !== "desired-outcome")) {
      throw new Error(edge.id + ": may-undermine causal direction drifted");
    }
    if (edge.type === "tests" &&
        (from?.type !== "evaluation-need" || to?.type !== "desired-outcome")) {
      throw new Error(edge.id + ": tests causal direction drifted");
    }
  }
  const optionById = new Map(
    dossier.options.map((option: JsonObject) => [option.id, option]),
  );
  const outputIds = new Set<string>();
  for (const intervention of causal.nodes.filter((node: JsonObject) =>
    node.type === "intervention-option")) {
    const outputs = causal.edges
      .filter((edge: JsonObject) =>
        edge.fromId === intervention.id &&
        edge.type === "hypothesises-contribution")
      .map((edge: JsonObject) => causalNodeById.get(edge.toId))
      .filter((node: JsonObject | undefined) => node?.type === "output");
    if (outputs.length !== 1 || outputIds.has(outputs[0].id)) {
      throw new Error(intervention.id + ": option must have one distinct hypothesised output");
    }
    outputIds.add(outputs[0].id);
    const reachesOutcome = graphReachable(
      causal.edges,
      outputs[0].id,
      (id) => causalNodeById.get(id)?.type === "desired-outcome",
    );
    const option = optionById.get(intervention.optionId);
    if ((option.kind === "business-as-usual" && reachesOutcome) ||
        (option.kind === "alternative" && !reachesOutcome)) {
      throw new Error(intervention.id + ": comparator or alternative causal path drifted");
    }
  }
  if (causal.nodes.filter((node: JsonObject) =>
    node.type === "intervention-option").length !== dossier.options.length) {
    throw new Error(dossier.id + ": every option must have one causal intervention node");
  }
  for (const outcome of dossier.desiredOutcomes) {
    const bindings: Array<[string, string]> = [
      ["assumptionNodeIds", "assumption"],
      ["negativePathwayNodeIds", "negative-pathway"],
      ["evaluationNeedNodeIds", "evaluation-need"],
    ];
    for (const [key, type] of bindings) {
      if (!Array.isArray(outcome[key]) ||
          outcome[key].length === 0 ||
          outcome[key].some((id: string) =>
            causalNodeById.get(id)?.type !== type)) {
        throw new Error(outcome.id + ": " + key + " reference mismatch");
      }
    }
  }

  for (const branch of dossier.jurisdictionBranches) {
    requireReferences(branch.baseBodyIds, inventory.typed.get("body")!, branch.id + " baseBodyIds");
    requireReferences(branch.baseClaimIds, inventory.typed.get("claim")!, branch.id + " baseClaimIds");
    if (branch.status !== "specialist-review-required") {
      throw new Error(branch.id + ": jurisdiction branch escaped specialist review");
    }
  }
  for (const route of dossier.routeOrientations) {
    if (!inventory.typed.get("redressRoute")!.has(route.baseRedressRouteId) ||
        route.relationship !== "parallel" ||
        route.deadlineDetermined !== false ||
        route.eligibilityDetermined !== false ||
        route.routeDetermined !== false) {
      throw new Error(route.id + ": remedy orientation became determinative");
    }
  }
  for (const context of dossier.externalContext) {
    const binding = context.bridgeId + "\u0000" +
      context.collection + "\u0000" + context.recordId;
    if (!bridgeBindings.has(binding) ||
        context.baseSnapshotByteReceipt !==
          "sha256:" + UK_GOVERNMENT_ENGINE_BYTE_SHA256 ||
        context.baseSnapshotCanonicalReceipt !==
          "sha256:" + UK_GOVERNMENT_ENGINE_CANONICAL_SHA256 ||
        context.baseSnapshotCanonicalUrl !== UK_GOVERNMENT_ENGINE_CANONICAL_URL ||
        context.taint !== "external-context-only" ||
        !Array.isArray(context.supportsClaimIds) ||
        context.supportsClaimIds.length !== 0) {
      throw new Error(dossier.id + ": external context escaped its non-evidence taint");
    }
  }
  void base;
}

export function validateUkGovernmentTransformationSnapshot(value: unknown): JsonObject {
  if (!object(value)) {
    throw new Error("UK Government Transformation Engine snapshot must be an object");
  }
  assertBoundedJsonTree(value);
  const schemaValidationIssues = ukGovernmentTransformationSchemaIssues(value);
  if (schemaValidationIssues.length) {
    throw new Error(
      "UK Government Transformation Engine snapshot failed its closed schema:\n" +
      schemaValidationIssues.slice(0, 40).join("\n"),
    );
  }
  if (value.schema !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_PROTOCOL ||
      value.contractVersion !== "0.1.0" ||
      value.title !== "Government Transformation Engine: United Kingdom" ||
      value.asOf !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_AS_OF ||
      !sameJson(value.jurisdiction, {
        code: "UK",
        label: "United Kingdom",
        scope: "orientation-only",
      })) {
    throw new Error("UK Government Transformation Engine publication identity drifted");
  }
  if (!sameJson(value.urls, {
    canonical: UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL,
    guide: UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL,
    human: UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL,
    mutableAlias: UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL,
    producer: UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL,
    repository: UK_GOVERNMENT_TRANSFORMATION_ENGINE_REPOSITORY_URL,
    schema: UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL,
  })) {
    throw new Error("UK Government Transformation Engine URL identity drifted");
  }
  if (!sameJson(value.authorship, {
    compiledBy: "codex-assisted-publication",
    exactTextHumanReviewed: false,
    humanDirectionRecorded: true,
    humanReviewCompleted: false,
    humanReviewRequired: true,
    origin: "maintainer-authorized-assisted-publication",
  })) {
    throw new Error("UK Government Transformation Engine authorship boundary drifted");
  }
  if (!sameJson(value.freshness, {
    automaticRuntimeEnforcement: false,
    expiredState: "hard-quarantined-historical-only",
    immutableAfterDeadline: "historical-orientation-only",
    inheritsBaseReviewWindow: true,
    mutableAliasPolicy: "retire-or-replace",
    nextReviewDue: UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
    readerTimeBehavior:
      "immutable-artifact-remains-available-but-must-be-treated-as-historical-only-after-review-deadline",
    readerTimeStateNotEmbedded: true,
    releaseGateRequired: true,
    stateAtPublication: "within-review-window",
  })) {
    throw new Error("UK Government Transformation Engine freshness contract drifted");
  }
  if (Object.values(value.boundaries).some((entry) => entry !== false)) {
    throw new Error("UK Government Transformation Engine capability boundaries must remain false");
  }
  if (!sameJson(value.adoption, {
    authorityLocation: "outside-this-system",
    state: "not-adopted",
  }) ||
      !sameJson(value.trialChamber, {
        compatibility: "unavailable",
        result: null,
        useAsAuthority: false,
      })) {
    throw new Error("UK Government Transformation Engine authority boundary drifted");
  }
  requireEmptyActions(value.actionArrays, "top-level");
  if (!sameJson(value.baseSnapshot, expectedBaseSnapshot())) {
    throw new Error("UK Government Transformation Engine base snapshot admission drifted");
  }
  if (!sameJson(value.counts, EXPECTED_COUNTS) ||
      !sameJson(expectedCountsFromDossiers(value.dossiers), EXPECTED_COUNTS)) {
    throw new Error("UK Government Transformation Engine count contract drifted");
  }
  if (!sameJson(value.buildProvenance, {
    deterministic: true,
    inputCanonicalReceipts: {
      config: "sha256:24cf7e2f470ba154a956c1665e9b4a130497410428720e521c6d3b8af34b8c4d",
      dossiers: "sha256:5e487ca2f1938bcaf8da13ca1db956eb356f587eade6a92ce179f70686759929",
    },
    networkUsed: false,
    schemaByteReceipt:
      "sha256:" + UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_BYTE_SHA256,
    schemaCanonicalReceipt:
      "sha256:" + UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_CANONICAL_SHA256,
  })) {
    throw new Error("UK Government Transformation Engine build provenance drifted");
  }
  const requiredCategoryPairs = [
    ["appropriation", "credit"],
    ["appropriation", "issue"],
    ["complaint", "appeal-or-deadline-protection"],
    ["estimate", "appropriation"],
    ["external-crosswalk", "official-evidence"],
    ["forecast", "appropriation"],
    ["forecast", "authority"],
    ["freshness", "legal-effect"],
    ["guidance", "law"],
    ["issue", "outturn"],
    ["mandate", "legal-power"],
    ["payment-rail", "authority"],
    ["payment-or-settlement", "liability"],
    ["payment-or-settlement", "spending-power"],
    ["plan", "appropriation"],
    ["plan", "estimate"],
    ["service-or-api", "decision-authority"],
    ["topic", "legislative-or-executive-competence"],
  ];
  const actualCategoryPairs = value.categoryErrorRules.map((rule: JsonObject) =>
    [rule.left, rule.right]);
  if (!sameJson(actualCategoryPairs, requiredCategoryPairs) ||
      value.categoryErrorRules.some((rule: JsonObject) =>
        rule.relation !== "does-not-imply")) {
    throw new Error("UK Government Transformation Engine category distinctions drifted");
  }

  const { snapshot: base } = loadUkGovernmentEnginePublication();
  if (base.urls.canonical !== UK_GOVERNMENT_ENGINE_CANONICAL_URL ||
      base.freshness.nextReviewDue !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE) {
    throw new Error("admitted Government Engine dependency drifted");
  }
  const inventory = baseInventory(base);
  const bridgeBindings = baseBridgeBindings(base);
  const dossierIds = requireOrderedUnique(value.dossiers, "transformation dossiers");
  if (!sameJson([...dossierIds], [...DOSSIER_IDS])) {
    throw new Error("UK Government Transformation Engine dossier inventory drifted");
  }
  value.dossiers.forEach((dossier: JsonObject) =>
    assertDossier(dossier, base, inventory, bridgeBindings));

  const dependencyTypes = new Set(
    value.dossiers.flatMap((dossier: JsonObject) =>
      dossier.authorityDependencyGraph.edges.map((edge: JsonObject) => edge.type)),
  );
  for (const type of DEPENDENCY_TYPES) {
    if (!dependencyTypes.has(type)) {
      throw new Error("authority graph inventory lacks dependency type " + type);
    }
  }
  const fourNation = value.dossiers.find((dossier: JsonObject) =>
    dossier.id === DOSSIER_IDS[0]);
  if (!sameJson(
    fourNation.jurisdictionBranches.map((branch: JsonObject) =>
      branch.jurisdiction).sort(),
    ["England", "Northern Ireland", "Scotland", "Wales"],
  )) {
    throw new Error("four-nation dossier branch inventory drifted");
  }
  const notice = value.dossiers.find((dossier: JsonObject) =>
    dossier.id === DOSSIER_IDS[1]);
  if (!sameJson(
    notice.routeOrientations.map((route: JsonObject) =>
      route.baseRedressRouteId).sort(),
    [
      "redress:hmrc-service-complaint",
      "redress:hmrc-statutory-review",
      "redress:judicial-review-england-wales",
      "redress:tax-tribunal-appeal",
    ],
  )) {
    throw new Error("HMRC remedy orientation inventory drifted");
  }
  assertNoScalarOrDecisionFields(value);
  return value;
}

export function parseUkGovernmentTransformationSnapshotBytes(
  bytes: Uint8Array,
): JsonObject {
  if (bytes.byteLength > MAX_SNAPSHOT_BYTES) {
    throw new Error(
      "UK Government Transformation Engine snapshot exceeds " +
      MAX_SNAPSHOT_BYTES + " bytes",
    );
  }
  return validateUkGovernmentTransformationSnapshot(
    parseStrictJsonBytes(bytes, "UK Government Transformation Engine snapshot"),
  );
}

export function loadUkGovernmentTransformationPublication(
  locator = UK_GOVERNMENT_TRANSFORMATION_ENGINE_LOCATOR,
): { snapshot: JsonObject; bytes: Uint8Array } {
  try {
    const bytes = readRegularFileWithinRoot(ROOT, locator);
    if (bytes.byteLength !== 83_915 ||
        sha256(bytes) !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256) {
      throw new Error("authored snapshot byte receipt drifted");
    }
    const snapshot = parseUkGovernmentTransformationSnapshotBytes(bytes);
    if (sha256(ukGovernmentTransformationCanonicalJson(snapshot)) !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_SHA256) {
      throw new Error("authored snapshot canonical receipt drifted");
    }
    return { snapshot, bytes };
  } catch (error) {
    throw new Error(
      "UK Government Transformation Engine authored snapshot is missing or invalid: " +
      (error as Error).message,
    );
  }
}

export function loadUkGovernmentTransformationSnapshot(): JsonObject {
  return loadUkGovernmentTransformationPublication().snapshot;
}

export function assertUkGovernmentTransformationActiveReviewWindow(
  checkedOn: string | Date,
  active = true,
): {
  active: boolean;
  checkedOn: string;
  nextReviewDue: string;
  state: "retired" | "within-review-window";
} {
  const date = checkedOn instanceof Date
    ? checkedOn.toISOString().slice(0, 10)
    : checkedOn;
  if (typeof date !== "string" || !validDate(date)) {
    throw new Error("UK Government Transformation Engine release date must be YYYY-MM-DD");
  }
  if (!active) {
    return {
      active,
      checkedOn: date,
      nextReviewDue: UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
      state: "retired",
    };
  }
  if (date > UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE) {
    throw new Error(
      "UK Government Transformation Engine active family is historical after " +
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE +
      "; replace or fully retire all five routes before deployment",
    );
  }
  return {
    active,
    checkedOn: date,
    nextReviewDue: UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
    state: "within-review-window",
  };
}

export function ukGovernmentTransformationPublicSummary(
  snapshot = loadUkGovernmentTransformationSnapshot(),
): JsonObject {
  validateUkGovernmentTransformationSnapshot(snapshot);
  return {
    protocol: UK_GOVERNMENT_TRANSFORMATION_ENGINE_PROTOCOL,
    title: snapshot.title,
    contract_version: snapshot.contractVersion,
    publication_state: "immutable-dated-snapshot-with-mutable-alias",
    state_at_publication: snapshot.freshness.stateAtPublication,
    reader_time_state_embedded: false,
    as_of: snapshot.asOf,
    next_review_due: snapshot.freshness.nextReviewDue,
    jurisdiction: snapshot.jurisdiction,
    authorship: snapshot.authorship,
    counts: snapshot.counts,
    base_government_engine: {
      canonical_url: snapshot.baseSnapshot.canonicalUrl,
      byte_receipt: snapshot.baseSnapshot.byteReceipt,
      canonical_receipt: snapshot.baseSnapshot.canonicalReceipt,
      exact_text_human_reviewed: false,
      official_source_handling: "link-only",
    },
    adoption: snapshot.adoption,
    trial_chamber: snapshot.trialChamber,
    dossiers: snapshot.dossiers.map((dossier: JsonObject) => ({
      id: dossier.id,
      title: dossier.title,
      synthetic: dossier.synthetic,
      hold: dossier.hold,
      plane_statuses: dossier.planeAssessments.map((assessment: JsonObject) => ({
        id: assessment.id,
        plane_id: assessment.planeId,
        status: assessment.status,
        specialist_review_required: assessment.specialistReviewRequired,
        unresolved_question_ids: [...assessment.unresolvedQuestionIds],
      })),
      human_gates: dossier.humanGates.map((gate: JsonObject) => ({
        id: gate.id,
        required: gate.required,
        completed: gate.completed,
        authority_outside_system: gate.authorityOutsideSystem,
      })),
      graphs: {
        authority_dependencies: {
          nodes: dossier.authorityDependencyGraph.nodes.length,
          edges: dossier.authorityDependencyGraph.edges.length,
          automatic_progression: false,
        },
        causal_hypotheses: {
          nodes: dossier.causalChangeHypothesisGraph.nodes.length,
          edges: dossier.causalChangeHypothesisGraph.edges.length,
          claims_causal_truth: false,
        },
      },
      options: {
        business_as_usual: dossier.options.filter((option: JsonObject) =>
          option.kind === "business-as-usual").length,
        alternatives: dossier.options.filter((option: JsonObject) =>
          option.kind === "alternative").length,
        selected: false,
        preferred_option_id: null,
      },
      external_context: dossier.externalContext.map((context: JsonObject) => ({
        bridge_id: context.bridgeId,
        collection: context.collection,
        record_id: context.recordId,
        taint: context.taint,
        supports_claim_ids: [...context.supportsClaimIds],
      })),
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
  return "transformation-" + id.replace(/[^a-z0-9]+/giu, "-").replace(/-+$/u, "");
}

function codeList(values: string[], label: string): string {
  return "<ul aria-label=\"" + esc(label) + "\">" +
    values.map((value) => "<li><code>" + esc(value) + "</code></li>").join("") +
    "</ul>";
}

function renderAssessment(
  assessment: JsonObject,
  atoms: Map<string, JsonObject>,
): string {
  return "<article class=\"facet\" id=\"" + esc(anchor(assessment.id)) + "\">" +
    "<p class=\"tag\"><code>" + esc(assessment.planeId) + "</code></p>" +
    "<h4>" + esc(assessment.question) + "</h4>" +
    "<p><strong>Held status:</strong> <code>" + esc(assessment.status) + "</code></p>" +
    "<p><code>specialistReviewRequired</code>: " +
      esc(assessment.specialistReviewRequired) + "</p>" +
    "<h5>Unresolved questions</h5>" +
    codeList(assessment.unresolvedQuestionIds, assessment.id + " unresolved questions") +
    "<h5>Link-only evidence atoms</h5><ul>" +
    assessment.evidenceAtomIds.map((id: string) => {
      const atom = atoms.get(id)!;
      return "<li><code>" + esc(atom.id) + "</code> — base type " +
        "<code>" + esc(atom.baseEntityType) + "</code>; exact base ID " +
        "<code>" + esc(atom.baseEntityId) +
        "</code>; <code>supportsConclusion:false</code>; exact text human reviewed: false.</li>";
    }).join("") +
    "</ul></article>";
}

function renderAuthorityGraph(dossier: JsonObject): string {
  const graph = dossier.authorityDependencyGraph;
  const nodes = new Map(
    graph.nodes.map((node: JsonObject) => [node.id, node]),
  );
  return "<section class=\"graph authority-graph\" aria-labelledby=\"" +
    esc(anchor(dossier.id) + "-authority") + "\">" +
    "<header><p class=\"tag\">Graph A · authority dependencies</p>" +
    "<h3 id=\"" + esc(anchor(dossier.id) + "-authority") +
    "\">Typed authority dependency graph</h3>" +
    "<p><code>automaticProgression:false</code>. Direction is from the named " +
    "condition to the named dependent question; it is not an approval path.</p></header>" +
    "<div class=\"node-grid\">" +
    graph.nodes.map((node: JsonObject) =>
      "<article class=\"node\"><p class=\"tag\"><code>" + esc(node.planeId) +
      "</code></p><h4>" + esc(node.label) + "</h4><p><code>" + esc(node.id) +
      "</code></p><p>Held assessment: <a href=\"#" +
      esc(anchor(node.assessmentId)) + "\"><code>" + esc(node.assessmentId) +
      "</code></a></p>" +
      codeList(node.baseEntityIds, node.id + " admitted base IDs") +
      "</article>").join("") +
    "</div><h4>Complete linear edge equivalent</h4><ol class=\"edges\">" +
    graph.edges.map((edge: JsonObject) => {
      const from = nodes.get(edge.fromId)!;
      const to = nodes.get(edge.toId)!;
      return "<li><p><strong>From:</strong> " + esc(from.label) +
        " (<code>" + esc(edge.fromId) + "</code>)</p>" +
        "<p><strong>Typed relationship:</strong> <code>" + esc(edge.type) +
        "</code></p><p><strong>To:</strong> " + esc(to.label) +
        " (<code>" + esc(edge.toId) + "</code>)</p>" +
        "<p>" + esc(edge.rationale) + "</p></li>";
    }).join("") +
    "</ol></section>";
}

function renderCausalGraph(dossier: JsonObject): string {
  const graph = dossier.causalChangeHypothesisGraph;
  const nodes = new Map(
    graph.nodes.map((node: JsonObject) => [node.id, node]),
  );
  return "<section class=\"graph causal-graph\" aria-labelledby=\"" +
    esc(anchor(dossier.id) + "-causal") + "\">" +
    "<header><p class=\"tag\">Graph B · causal hypotheses</p>" +
    "<h3 id=\"" + esc(anchor(dossier.id) + "-causal") +
    "\">Causal change hypothesis graph</h3>" +
    "<p><strong><code>claimsCausalTruth:false</code>.</strong> Every edge is a " +
    "synthetic hypothesis, not an impact claim or prediction.</p></header>" +
    "<div class=\"node-grid\">" +
    graph.nodes.map((node: JsonObject) =>
      "<article class=\"node\"><p class=\"tag\"><code>" + esc(node.type) +
      "</code></p><p>" + esc(node.statement) + "</p><p><code>" +
      esc(node.id) + "</code></p>" +
      (node.optionId === null ? "" : "<p>Option binding: <code>" +
        esc(node.optionId) + "</code></p>") +
      "</article>").join("") +
    "</div><h4>Complete linear edge equivalent</h4><ol class=\"edges\">" +
    graph.edges.map((edge: JsonObject) => {
      const from = nodes.get(edge.fromId)!;
      const to = nodes.get(edge.toId)!;
      return "<li><p><strong>From hypothesis:</strong> " +
        esc(from.statement) + " (<code>" + esc(edge.fromId) + "</code>)</p>" +
        "<p><strong>Hypothesis relationship:</strong> <code>" +
        esc(edge.type) + "</code></p><p><strong>To hypothesis:</strong> " +
        esc(to.statement) + " (<code>" + esc(edge.toId) +
        "</code>)</p></li>";
    }).join("") +
    "</ol></section>";
}

function renderDossier(dossier: JsonObject, snapshot: JsonObject): string {
  const atoms = new Map(
    dossier.evidenceAtoms.map((atom: JsonObject) => [atom.id, atom]),
  );
  return "<article class=\"dossier\" id=\"" + esc(anchor(dossier.id)) + "\">" +
    "<header><p class=\"tag\">Synthetic dossier · Phase 0</p><h2>" +
    esc(dossier.title) + "</h2><p><code>" + esc(dossier.id) +
    "</code></p><p class=\"proposition\">" +
    esc(dossier.proposition.verbatimStatement) + "</p></header>" +
    "<aside class=\"warning\"><strong>State at publication only:</strong> " +
    "<code>" + esc(snapshot.freshness.stateAtPublication) + "</code>, as of " +
    "<time datetime=\"" + esc(snapshot.asOf) + "\">" + esc(snapshot.asOf) +
    "</time>; next review due <time datetime=\"" +
    esc(snapshot.freshness.nextReviewDue) + "\">" +
    esc(snapshot.freshness.nextReviewDue) +
    "</time>. This dossier is held, incomplete and not current after that date " +
    "without a replacement review. It is independent and synthetic; not " +
    "government, analysis, advice, approval, readiness, adoption or action.</aside>" +
    "<section class=\"held\" aria-labelledby=\"" + esc(anchor(dossier.id) + "-held") +
    "\"><p class=\"tag\">Why held</p><h3 id=\"" +
    esc(anchor(dossier.id) + "-held") + "\">Progression stops here</h3>" +
    "<p><strong>Hold:</strong> <code>" + esc(dossier.hold.state) +
    "</code> · <code>" + esc(dossier.hold.reasonCode) +
    "</code> · <code>stopsProgression:true</code>.</p>" +
    "<p>Adoption is <code>not-adopted</code>; authority remains " +
    "<code>outside-this-system</code>. Trial Chamber compatibility is " +
    "<code>unavailable</code> and cannot be used as authority.</p></section>" +
    "<section aria-labelledby=\"" + esc(anchor(dossier.id) + "-facets") +
    "\"><p class=\"tag\">Six separate facets</p><h3 id=\"" +
    esc(anchor(dossier.id) + "-facets") +
    "\">Held assessments, not a progression conveyor</h3><div class=\"facet-grid\">" +
    dossier.planeAssessments.map((assessment: JsonObject) =>
      renderAssessment(assessment, atoms)).join("") +
    "</div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(dossier.id) + "-gates") +
    "\"><p class=\"tag\">Human gates</p><h3 id=\"" +
    esc(anchor(dossier.id) + "-gates") +
    "\">Required review remains incomplete</h3><div class=\"card-grid\">" +
    dossier.humanGates.map((gate: JsonObject) =>
      "<article class=\"card\"><h4>" + esc(gate.label) +
      "</h4><p><code>" + esc(gate.id) + "</code></p><p><code>required:true</code> · " +
      "<code>completed:false</code> · <code>authorityOutsideSystem:true</code></p>" +
      codeList(gate.planeIds, gate.id + " plane IDs") + "</article>").join("") +
    "</div></section>" +
    "<section aria-labelledby=\"" + esc(anchor(dossier.id) + "-limits") +
    "\"><p class=\"tag\">Evidence limitations</p><h3 id=\"" +
    esc(anchor(dossier.id) + "-limits") +
    "\">Links orient; they do not conclude</h3><p>All " +
    dossier.evidenceAtoms.length +
    " atoms bind exact IDs in the admitted immutable Government Engine. " +
    "Every atom is link-only, not exact-text human-reviewed, rejects generic " +
    "host trust and has <code>supportsConclusion:false</code>.</p>" +
    "<ul aria-label=\"" + esc(dossier.id + " evidence base IDs") + "\">" +
    dossier.evidenceAtoms.map((atom: JsonObject) =>
      "<li>Type <code>" + esc(atom.baseEntityType) +
      "</code>; exact ID <code>" + esc(atom.baseEntityId) +
      "</code></li>").join("") + "</ul></section>" +
    renderAuthorityGraph(dossier) +
    "<section aria-labelledby=\"" + esc(anchor(dossier.id) + "-options") +
    "\"><p class=\"tag\">Unselected synthetic comparators</p><h3 id=\"" +
    esc(anchor(dossier.id) + "-options") +
    "\">Business as usual and alternatives, without preference</h3>" +
    "<p><code>selectionState:not-selected</code> · " +
    "<code>preferredOptionId:null</code>. Placement does not indicate rank.</p>" +
    "<div class=\"card-grid\">" +
    dossier.options.map((option: JsonObject) =>
      "<article class=\"card\"><p class=\"tag\"><code>" + esc(option.kind) +
      "</code></p><h4>" + esc(option.label) + "</h4><p>" +
      esc(option.description) + "</p><p><code>" + esc(option.id) +
      "</code> · <code>selected:false</code></p></article>").join("") +
    "</div></section>" +
    renderCausalGraph(dossier) +
    "<section aria-labelledby=\"" + esc(anchor(dossier.id) + "-outcomes") +
    "\"><p class=\"tag\">Aspirational outcomes come last</p><h3 id=\"" +
    esc(anchor(dossier.id) + "-outcomes") +
    "\">Desired orientation outcomes remain hypotheses</h3>" +
    dossier.desiredOutcomes.map((outcome: JsonObject) =>
      "<article class=\"card\"><p>" + esc(outcome.statement) +
      "</p><p><code>" + esc(outcome.id) + "</code></p>" +
      codeList(outcome.assumptionNodeIds, outcome.id + " assumption nodes") +
      codeList(
        outcome.negativePathwayNodeIds,
        outcome.id + " negative pathway nodes",
      ) +
      codeList(
        outcome.evaluationNeedNodeIds,
        outcome.id + " evaluation need nodes",
      ) + "</article>").join("") + "</section>" +
    (dossier.jurisdictionBranches.length === 0 ? "" :
      "<section aria-labelledby=\"" + esc(anchor(dossier.id) + "-branches") +
      "\"><p class=\"tag\">Territorial branches</p><h3 id=\"" +
      esc(anchor(dossier.id) + "-branches") +
      "\">Four distinct specialist-held branches</h3><div class=\"card-grid\">" +
      dossier.jurisdictionBranches.map((branch: JsonObject) =>
        "<article class=\"card\"><h4>" + esc(branch.jurisdiction) +
        "</h4><p><code>" + esc(branch.id) +
        "</code> · <code>specialist-review-required</code></p>" +
        codeList(branch.baseBodyIds, branch.id + " base body IDs") +
        codeList(branch.baseClaimIds, branch.id + " base claim IDs") +
        "</article>").join("") + "</div></section>") +
    (dossier.routeOrientations.length === 0 ? "" :
      "<section aria-labelledby=\"" + esc(anchor(dossier.id) + "-remedy") +
      "\"><p class=\"tag\">Parallel remedy orientation</p><h3 id=\"" +
      esc(anchor(dossier.id) + "-remedy") +
      "\">No route, eligibility or deadline is determined</h3><div class=\"card-grid\">" +
      dossier.routeOrientations.map((route: JsonObject) =>
        "<article class=\"card\"><p><code>" + esc(route.id) +
        "</code></p><p>Base route: <code>" +
        esc(route.baseRedressRouteId) + "</code></p>" +
        "<p><code>relationship:parallel</code> · " +
        "<code>routeDetermined:false</code> · " +
        "<code>eligibilityDetermined:false</code> · " +
        "<code>deadlineDetermined:false</code></p></article>").join("") +
      "</div></section>") +
    (dossier.externalContext.length === 0 ? "" :
      "<section aria-labelledby=\"" + esc(anchor(dossier.id) + "-external") +
      "\"><p class=\"tag\">External context firewall</p><h3 id=\"" +
      esc(anchor(dossier.id) + "-external") +
      "\">TaxSorted IDs are transitive context only</h3>" +
      "<p>No TaxSorted text is imported. These IDs cannot support a claim, " +
      "assessment, option or outcome; no TaxSorted API is called or exposed.</p>" +
      "<ul class=\"external-context\">" +
      dossier.externalContext.map((context: JsonObject) =>
        "<li><p>Bridge <code>" + esc(context.bridgeId) +
        "</code> · collection <code>" + esc(context.collection) +
        "</code> · record <code>" + esc(context.recordId) +
        "</code></p><p><code>taint:external-context-only</code> · " +
        "<code>supportsClaimIds:[]</code></p></li>").join("") +
      "</ul></section>") +
    "</article>";
}

function producerLink(): string {
  const parsed = new URL(UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL);
  if (parsed.protocol !== "https:" ||
      parsed.hostname !== "github.com" ||
      parsed.username ||
      parsed.password ||
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL !==
        "https://github.com/cambridgetcg/kingdom-government-transformation-engine/tree/v0.1.0") {
    throw new Error("transformation producer link escaped its exact allowlist");
  }
  return "<a href=\"" + esc(UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL) +
    "\" rel=\"external\">pinned producer v0.1.0 source</a>";
}

export function renderUkGovernmentTransformationHtml(
  snapshot = loadUkGovernmentTransformationSnapshot(),
): string {
  validateUkGovernmentTransformationSnapshot(snapshot);
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "  <meta charset=\"utf-8\">",
    "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
    "  <meta name=\"description\" content=\"Independent synthetic Phase-0 UK government transformation orientation dossiers, held for human review.\">",
    "  <title>Synthetic · Phase 0 · Orientation only · UK Government Transformation Engine</title>",
    "  <link rel=\"canonical\" href=\"/government-transformation-engine/\">",
    "  <link rel=\"alternate\" href=\"/government-transformations.json\" type=\"application/json\" title=\"Mutable alias for the dated transformation snapshot\">",
    "  <link rel=\"alternate\" href=\"/government/uk-government-transformation-engine-2026-08-21.json\" type=\"application/json\" title=\"Immutable dated transformation snapshot\">",
    "  <link rel=\"describedby\" href=\"/government/transformations/schemas/v0.1/public-snapshot.schema.json\" type=\"application/schema+json\" title=\"Transformation snapshot schema\">",
    "  <link rel=\"service-doc\" href=\"/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md\" type=\"text/markdown\" title=\"Transformation Engine guide\">",
    "  <style>",
    "    :root{color-scheme:light dark;--paper:#f3efe6;--ink:#171c22;--muted:#5d6570;--line:#aaa59b;--panel:#fffaf0;--accent:#5c4d91;--focus:#8b5d00}",
    "    @media(prefers-color-scheme:dark){:root{--paper:#0d1218;--ink:#edf1f4;--muted:#aeb7c1;--line:#3b4650;--panel:#141d25;--accent:#c2b0ff;--focus:#f1c56d}}",
    "    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:1rem/1.62 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;overflow-wrap:anywhere}",
    "    a{color:var(--accent);text-underline-offset:.2em}a:focus-visible,summary:focus-visible{outline:.2rem solid var(--focus);outline-offset:.2rem}.skip{position:absolute;inset-inline-start:1rem;top:-8rem;background:var(--ink);color:var(--paper);padding:.7rem 1rem;z-index:10}.skip:focus{top:1rem}",
    "    .shell{width:min(74rem,calc(100% - 2rem));margin-inline:auto}.top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.8rem;padding:1.2rem 0;border-bottom:1px solid var(--line)}.top span{display:flex;flex-wrap:wrap;gap:1rem}",
    "    .hero{padding:clamp(2.8rem,8vw,6rem) 0 2.8rem}.kicker,.tag{text-transform:uppercase;letter-spacing:.1em;font-size:.76rem;font-weight:750;color:var(--accent)}h1,h2,h3,h4,h5{font-family:ui-serif,Georgia,serif;line-height:1.12}h1{font-size:clamp(2.7rem,8vw,6.5rem);max-width:68rem;margin:.18em 0}.lead{font-size:clamp(1.08rem,2.5vw,1.48rem);max-width:58rem}",
    "    .warning{border:.14rem solid var(--line);background:var(--panel);padding:1rem 1.2rem;border-radius:.7rem;max-width:64rem}.stats,.card-grid,.facet-grid,.node-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));gap:.8rem}.stats{margin-top:1.5rem}.stats div,.card,.facet,.node,.edges li,.external-context li{border:1px solid var(--line);background:var(--panel);padding:1rem;border-radius:.65rem}.stats b{display:block;font:700 1.8rem ui-serif,Georgia,serif}",
    "    .dossier{padding:3rem 0;border-top:.16rem solid var(--ink)}.dossier>header,.dossier>section,.dossier>aside{margin-bottom:2rem}.dossier h2{font-size:clamp(2rem,5vw,3.8rem);max-width:62rem}.proposition{font-size:1.14rem;max-width:58rem}.held{border-inline-start:.3rem solid var(--accent);padding-inline-start:1rem}.facet h4,.card h4,.node h4{margin:.2rem 0}.facet h5{margin-bottom:.2rem}.graph{border:1px solid var(--line);padding:clamp(1rem,3vw,2rem);border-radius:.8rem;background:color-mix(in srgb,var(--panel) 82%,transparent)}.graph+section,.authority-graph,.causal-graph{margin-top:2.5rem}.edges{padding-inline-start:1.5rem}.edges li{margin:.8rem 0}.edges p{margin:.25rem 0}.external-context{list-style:none;padding:0}.external-context li{margin:.7rem 0}.negative{columns:2}.footer{padding:2.5rem 0 4rem;color:var(--muted)}code{font-size:.9em}",
    "    @media(max-width:42rem){.top{display:block}.top span{margin-top:.7rem}.negative{columns:1}.shell{width:min(100% - 1rem,74rem)}}",
    "    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}",
    "    @media(forced-colors:active){.warning,.card,.facet,.node,.graph,.edges li,.external-context li{border:1px solid CanvasText}.held{border-inline-start:.3rem solid CanvasText}}",
    "  </style>",
    "</head>",
    "<body>",
    "  <a class=\"skip\" href=\"#main\">Skip to transformation dossiers</a>",
    "  <nav class=\"shell top\" aria-label=\"Kingdom navigation\"><a href=\"/\">← The Kingdom</a><span><a href=\"/government-engine/\">base Government Engine</a><a href=\"/government-transformations.json\">mutable JSON alias</a><a href=\"/government/uk-government-transformation-engine-2026-08-21.json\">dated immutable JSON</a><a href=\"/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md\">guide</a></span></nav>",
    "  <main class=\"shell\" id=\"main\" tabindex=\"-1\">",
    "    <header class=\"hero\"><p class=\"kicker\">Synthetic · Phase 0 · Orientation only</p><h1>UK Government Transformation Engine</h1><p class=\"lead\">Three independent synthetic orientation dossiers that keep authority dependencies, causal hypotheses, unresolved questions and human gates visibly separate.</p><aside class=\"warning\"><strong>State at publication only:</strong> <code>" + esc(snapshot.freshness.stateAtPublication) + "</code>, as of <time datetime=\"" + esc(snapshot.asOf) + "\">" + esc(snapshot.asOf) + "</time>; next review due <time datetime=\"" + esc(snapshot.freshness.nextReviewDue) + "\">" + esc(snapshot.freshness.nextReviewDue) + "</time>. After that date this immutable artifact is historical, not current. It is static, incomplete and not separately human-reviewed; independent from government; not official evidence, analysis, legal or tax advice, approval, a decision, readiness, adoption, implementation or action.</aside><div class=\"stats\"><div><b>" + snapshot.counts.dossiers + "</b><span>synthetic held dossiers</span></div><div><b>" + snapshot.counts.planeAssessments + "</b><span>separate plane assessments</span></div><div><b>" + snapshot.counts.humanGates + "</b><span>required incomplete human gates</span></div><div><b>2 × 3</b><span>separate graphs, two per dossier</span></div></div></header>",
    "    <section aria-labelledby=\"base\"><p class=\"tag\">Admitted foundation</p><h2 id=\"base\">Exact immutable UK Government Engine dependency</h2><p>Every evidence atom resolves by type and ID against the exact 196,005-byte base snapshot. Open the <a href=\"/government/uk-government-engine-2026-08-21.json\">admitted immutable Government Engine JSON</a>. Its official-source treatment remains link-only and its exact text is not separately human-reviewed.</p><p><code>sha256:" + esc(UK_GOVERNMENT_ENGINE_BYTE_SHA256) + "</code></p></section>",
    "    <section aria-labelledby=\"category-errors\"><p class=\"tag\">Category distinctions</p><h2 id=\"category-errors\">Does not imply</h2><p>These typed separations prevent orientation from being mistaken for authority or progression.</p><div class=\"card-grid\">" + snapshot.categoryErrorRules.map((rule: JsonObject) => "<article class=\"card\"><code>" + esc(rule.left) + "</code><p><strong>" + esc(rule.relation) + "</strong></p><code>" + esc(rule.right) + "</code></article>").join("") + "</div></section>",
    snapshot.dossiers.map((dossier: JsonObject) =>
      renderDossier(dossier, snapshot)).join(""),
    "    <section class=\"dossier\" aria-labelledby=\"boundary\"><p class=\"tag\">Negative authority</p><h2 id=\"boundary\">What this surface cannot do</h2><p>Every declared capability is false. The page has no JavaScript, form, input, upload, button, iframe, account access, request body, external fetch, API call, runtime network, MCP surface, selection or action.</p><ul class=\"negative\">" + Object.keys(snapshot.boundaries).sort().map((key) => "<li><code>" + esc(key) + "</code>: false</li>").join("") + "</ul><p>Inspect the <a href=\"/government-transformations.json\">mutable alias</a>, <a href=\"/government/uk-government-transformation-engine-2026-08-21.json\">immutable dated JSON</a>, <a href=\"/government/transformations/schemas/v0.1/public-snapshot.schema.json\">closed schema</a>, and <a href=\"/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md\">boundary guide</a>.</p></section>",
    "  </main>",
    "  <footer class=\"shell footer\">State at publication only · as of <time datetime=\"" + esc(snapshot.asOf) + "\">" + esc(snapshot.asOf) + "</time> · next review due <time datetime=\"" + esc(snapshot.freshness.nextReviewDue) + "\">" + esc(snapshot.freshness.nextReviewDue) + "</time> · " + producerLink() + " · immutable history is not a claim of reader-time currency.</footer>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}
