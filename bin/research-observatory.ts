#!/usr/bin/env bun
/**
 * Strict build-time reader and server-renderer for the Research Observatory.
 *
 * This module has no network path. It projects one checked-in, metadata-only
 * snapshot into public discovery surfaces; it never evaluates, adopts, runs,
 * promotes, or admits anything that the snapshot describes.
 */

import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { readRegularFileWithinRoot } from "./immutable-publications.ts";
import { parseStrictJsonBytes } from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const RESEARCH_OBSERVATORY_PROTOCOL = "kingdom.research-observatory-publication/0.1";
export const RESEARCH_OBSERVATORY_LOCATOR = "data/research/research-observatory.v0.1.json";
export const RESEARCH_OBSERVATORY_PAGE_LOCATOR = "site/observatory/index.html";
export const RESEARCH_OBSERVATORY_SNAPSHOT_LOCATOR = "site/research.json";
export const RESEARCH_OBSERVATORY_GUIDE_LOCATOR = "references/research-observatory-v0.1.md";
export const RESEARCH_OBSERVATORY_URL = "https://thekingdom.dev/observatory/";
export const RESEARCH_OBSERVATORY_SNAPSHOT_URL = "https://thekingdom.dev/research.json";
export const RESEARCH_OBSERVATORY_GUIDE_URL = "https://thekingdom.dev/RESEARCH-OBSERVATORY-v0.1.md";
export const RESEARCH_OBSERVATORY_PRODUCER_URL = "https://github.com/cambridgetcg/kingdom-research/tree/v0.1.0";

export const RESEARCH_OBSERVATORY_SCHEMA_NAMES = Object.freeze([
  "public-snapshot",
  "source",
  "watchlist",
  "observation",
  "work",
  "signal",
] as const);

export type ResearchObservatorySchemaName = typeof RESEARCH_OBSERVATORY_SCHEMA_NAMES[number];

export const RESEARCH_OBSERVATORY_SCHEMA_LOCATORS = Object.freeze(
  Object.fromEntries(RESEARCH_OBSERVATORY_SCHEMA_NAMES.map((name) => [
    name,
    `schemas/research-observatory/v0.1/${name}.schema.json`,
  ])) as Record<ResearchObservatorySchemaName, string>,
);

export const RESEARCH_OBSERVATORY_SCHEMA_URLS = Object.freeze(
  Object.fromEntries(RESEARCH_OBSERVATORY_SCHEMA_NAMES.map((name) => [
    name,
    `https://thekingdom.dev/research/schemas/v0.1/${name}.schema.json`,
  ])) as Record<ResearchObservatorySchemaName, string>,
);

export const RESEARCH_OBSERVATORY_BOUNDARY = Object.freeze({
  metadata_only: true,
  build_time_network: false,
  full_text_included: false,
  discovered_artifact_execution: false,
  evaluation_performed: false,
  adoption_recorded: false,
  use_authorized: false,
  module_created: false,
  guest_admitted: false,
  scalar_value_score: false,
  automatic_action: false,
});

const EXACT_WATCHLIST_IDS = Object.freeze([
  "agent-security",
  "interpretable-reasoning",
  "language-agent-interoperability",
]);
const EXACT_SOURCE_ACCESS = Object.freeze({
  arxiv: "fixture-and-explicit-poll",
  "biorxiv-medrxiv": "fixture-only-policy-hold",
  "clinicaltrials-gov": "fixture-only-policy-hold",
  crossref: "fixture-and-explicit-poll",
  "crossref-integrity": "fixture-and-explicit-poll",
  datacite: "fixture-and-explicit-poll",
  "europe-pmc": "fixture-and-explicit-poll",
  openalex: "fixture-and-explicit-poll",
  "pubmed-pmc": "fixture-only-policy-hold",
} as const);
const EVIDENCE_FACTORS = new Set(["source-authority", "review-state", "integrity", "rights-clarity"]);
const PRIORITY_FACTORS = new Set(["named-need-fit", "freshness"]);
const CHANGE_SIGNAL_TYPES = new Set(["integrity-alert", "publication-link", "source-corroboration", "version-activity"]);
const LIFECYCLE = Object.freeze({
  discovery: "observed",
  evaluation: "not-performed",
  adoption: "not-recorded",
  use: "not-authorized",
});
const PATH_STATE = Object.freeze({
  state: "not-proposed",
  requiresSeparateEvaluation: true,
  requiresSeparateAdoption: true,
  requiresSeparateUseAuthority: true,
});
const SNAPSHOT_MODES = new Set(["synthetic-fixture-observatory", "captured-live-observatory", "mixed-observatory"]);
const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024;
const MAX_TREE_DEPTH = 32;
const MAX_TREE_NODES = 200_000;
const MAX_STRING_CODE_UNITS = 1_500_000;
const MAX_ARRAY_ITEMS = 2048;

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
  throw new Error("Research Observatory value is not JSON");
}

function schemaTypeMatches(value: unknown, type: string): boolean {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return object(value);
  if (type === "integer") return Number.isSafeInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function schemaPointer(root: JsonObject, fragment: string): unknown {
  if (!fragment || fragment === "#") return root;
  if (!fragment.startsWith("#/")) throw new Error(`unsupported Research Observatory schema fragment ${fragment}`);
  let current: unknown = root;
  for (const raw of fragment.slice(2).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!object(current) || !Object.hasOwn(current, key)) {
      throw new Error(`unresolved Research Observatory schema fragment ${fragment}`);
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
  if (!targetRoot) throw new Error(`unresolved Research Observatory schema reference ${reference}`);
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
  if (Object.hasOwn(schema, "const") && canonicalJson(value) !== canonicalJson(schema.const)) {
    issues.push(`${path}: must equal declared constant`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => canonicalJson(candidate) === canonicalJson(value))) {
    issues.push(`${path}: value is outside enum`);
  }
  if (Array.isArray(schema.oneOf)) {
    const branches = schema.oneOf.map((branch: unknown) => schemaIssues(value, branch, path, root, registry, depth + 1));
    if (branches.filter((branch: string[]) => branch.length === 0).length !== 1) {
      issues.push(`${path}: must match exactly one oneOf branch`);
    }
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

function validateAgainstResearchSchemas(value: unknown): void {
  const registry: SchemaRegistry = new Map();
  for (const name of RESEARCH_OBSERVATORY_SCHEMA_NAMES) {
    const bytes = readRegularFileWithinRoot(ROOT, RESEARCH_OBSERVATORY_SCHEMA_LOCATORS[name]);
    if (bytes.byteLength > 256 * 1024) throw new Error(`Research Observatory ${name} schema exceeds 262144 bytes`);
    const schema = parseStrictJsonBytes(bytes, `Research Observatory ${name} schema`);
    if (!object(schema) || schema.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
        schema.$id !== RESEARCH_OBSERVATORY_SCHEMA_URLS[name]) {
      throw new Error(`Research Observatory ${name} schema identity drifted`);
    }
    registry.set(`${name}.schema.json`, schema);
    registry.set(schema.$id, schema);
  }
  const root = registry.get("public-snapshot.schema.json")!;
  const issues = schemaIssues(value, root, "$", root, registry);
  if (issues.length) {
    throw new Error(`Research Observatory snapshot failed its six-schema contract:\n${issues.slice(0, 20).join("\n")}`);
  }
}

function equalRecord(value: unknown, expected: Readonly<JsonObject>): boolean {
  if (!object(value)) return false;
  const keys = Object.keys(expected);
  return Object.keys(value).length === keys.length && keys.every((key) => value[key] === expected[key]);
}

function requireExactKeys(value: unknown, expected: readonly string[], label: string): void {
  if (!object(value)) throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} contains missing or additional properties`);
  }
}

function requireArray(value: unknown, label: string, minimum = 0): any[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > MAX_ARRAY_ITEMS) {
    throw new Error(`${label} must contain at least ${minimum} item${minimum === 1 ? "" : "s"}`);
  }
  return value;
}

function assertBoundedJsonTree(
  value: unknown,
  depth = 0,
  budget = { nodes: 0, stringCodeUnits: 0 },
): void {
  if (depth > MAX_TREE_DEPTH) throw new Error(`Research Observatory JSON nesting exceeds ${MAX_TREE_DEPTH}`);
  budget.nodes += 1;
  if (budget.nodes > MAX_TREE_NODES) throw new Error("Research Observatory JSON node budget exceeded");
  if (typeof value === "string") {
    if (value.length > 4096) throw new Error("Research Observatory contains an oversized string");
    budget.stringCodeUnits += value.length;
    if (budget.stringCodeUnits > MAX_STRING_CODE_UNITS) {
      throw new Error("Research Observatory string budget exceeded");
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) throw new Error("Research Observatory array budget exceeded");
    for (const entry of value) assertBoundedJsonTree(entry, depth + 1, budget);
    return;
  }
  if (object(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (key.length > 128) throw new Error("Research Observatory contains an oversized object key");
      assertBoundedJsonTree(entry, depth + 1, budget);
    }
  }
}

function requireOrderedUnique(values: unknown[], key: string, label: string): void {
  const identities = values.map((value) => object(value) ? value[key] : undefined);
  if (identities.some((identity) => typeof identity !== "string") ||
      new Set(identities).size !== identities.length ||
      identities.some((identity, index) => index > 0 && String(identities[index - 1]).localeCompare(String(identity)) >= 0)) {
    throw new Error(`${label} must be uniquely ordered by ${key}`);
  }
}

function requireSortedUniqueStrings(values: unknown, label: string, minimum = 0): string[] {
  if (!Array.isArray(values) || values.length < minimum ||
      values.some((value) => typeof value !== "string") ||
      values.some((value, index) => index > 0 && String(value).localeCompare(String(values[index - 1])) <= 0)) {
    throw new Error(`${label} must be a sorted unique string array`);
  }
  return values as string[];
}

function requireAtOrBefore(value: unknown, asOf: string, label: string): void {
  if (value === null) return;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}Z)?$/.test(value)) {
    throw new Error(`${label} is not a bounded ISO date or instant`);
  }
  const instant = value.length === 10 ? `${value}T00:00:00Z` : value;
  const millis = Date.parse(instant);
  if (!Number.isFinite(millis)) throw new Error(`${label} is not a real calendar date or instant`);
  const canonical = value.length === 10
    ? new Date(millis).toISOString().slice(0, 10)
    : new Date(millis).toISOString().replace(".000Z", "Z");
  if (canonical !== value) {
    throw new Error(`${label} is not a real calendar date or instant`);
  }
  if (value.length === 10 ? value > asOf.slice(0, 10) : value > asOf) {
    throw new Error(`${label} occurs after snapshot asOf`);
  }
}

function requireCalendarDate(value: unknown, label: string): void {
  if (value === null) return;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} is not an ISO calendar date`);
  }
  const millis = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(millis) || new Date(millis).toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a real calendar date`);
  }
}

function requireHttpsUrl(value: unknown, label: string): void {
  if (typeof value !== "string" || value.length > 2048) throw new Error(`${label} is not a bounded HTTPS URL`);
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.hash) throw new Error();
  } catch {
    throw new Error(`${label} is not a bounded HTTPS URL`);
  }
}

function assertNoScoreKeys(value: unknown, path = "snapshot"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoScoreKeys(entry, `${path}[${index}]`));
    return;
  }
  if (!object(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (/^(?:score|rank|ranking|total_score|value_score)$/i.test(key)) {
      throw new Error(`${path}.${key} would collapse explainable factors into a scalar`);
    }
    assertNoScoreKeys(child, `${path}.${key}`);
  }
}

export function validateResearchObservatorySnapshot(value: unknown): JsonObject {
  if (!object(value) || value.schema !== "kingdom.research-public-snapshot/0.1") {
    throw new Error("Research Observatory snapshot identity drifted");
  }
  if (!SNAPSHOT_MODES.has(value.mode) || value.metadataOnly !== true) {
    throw new Error("Research Observatory must remain an explicit metadata-only snapshot");
  }
  if (typeof value.asOf !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value.asOf)) {
    throw new Error("Research Observatory asOf must be a whole-second UTC timestamp");
  }
  requireAtOrBefore(value.asOf, value.asOf, "Research Observatory asOf");
  requireExactKeys(value, [
    "schema", "asOf", "mode", "metadataOnly", "generatedFrom", "sources",
    "watchlists", "observations", "works", "signals", "boundaries",
  ], "Research Observatory snapshot");
  requireExactKeys(value.generatedFrom, [
    "sourceManifestReceipt", "watchlistManifestReceipt", "fixtureSetReceipt",
    "captureSetReceipt", "captureProjection", "pipelineVersion",
  ], "Research Observatory generatedFrom");
  requireExactKeys(value.boundaries, [
    "buildNetworkUsed", "liveHarvestNetworkObserved", "captureProvenance",
    "fullTextIncluded", "artifactExecution", "evaluationPerformed",
    "adoptionRecorded", "useAuthorized", "moduleCreated", "guestAdmitted",
  ], "Research Observatory boundaries");

  const sources = requireArray(value.sources, "Research Observatory sources", 9);
  const watchlists = requireArray(value.watchlists, "Research Observatory watchlists", 3);
  const observations = requireArray(value.observations, "Research Observatory observations", 7);
  const works = requireArray(value.works, "Research Observatory works", 1);
  const signals = requireArray(value.signals, "Research Observatory signals");
  if (sources.length !== Object.keys(EXACT_SOURCE_ACCESS).length || watchlists.length !== 3 || observations.length > 256 ||
      works.length > 256 || signals.length > 1024) {
    throw new Error("Research Observatory collection exceeds its schema-specific count bound");
  }
  requireOrderedUnique(sources, "id", "Research Observatory sources");
  requireOrderedUnique(watchlists, "id", "Research Observatory watchlists");
  requireOrderedUnique(observations, "id", "Research Observatory observations");
  requireOrderedUnique(works, "id", "Research Observatory works");
  requireOrderedUnique(signals, "id", "Research Observatory signals");

  const sourceIdsInSnapshot = sources.map((source) => source?.id);
  if (JSON.stringify(sourceIdsInSnapshot) !== JSON.stringify(Object.keys(EXACT_SOURCE_ACCESS).sort())) {
    throw new Error("Research Observatory source identities drifted from the reviewed access-policy allowlist");
  }

  const sourceIds = new Set<string>();
  for (const source of sources) {
    if (!object(source) || source.schema !== "kingdom.research-source/0.1" ||
        typeof source.id !== "string" || sourceIds.has(source.id) ||
        source.access?.mvpMode !== EXACT_SOURCE_ACCESS[source.id as keyof typeof EXACT_SOURCE_ACCESS] ||
        source.rights?.fullTextPolicy !== "not-ingested" ||
        typeof source.freshness?.observedOn !== "string" ||
        !Array.isArray(source.coverage?.disciplines) || !Array.isArray(source.coverage?.recordTypes) ||
        !Array.isArray(source.officialUrls)) {
      throw new Error(`Research Observatory contains an invalid source: ${JSON.stringify(source?.id)}`);
    }
    requireAtOrBefore(source.freshness.observedOn, value.asOf, `source ${source.id} observedOn`);
    requireHttpsUrl(source.access?.documentationUrl, `source ${source.id} documentationUrl`);
    requireHttpsUrl(source.rights?.evidenceUrl, `source ${source.id} evidenceUrl`);
    for (const [index, url] of source.officialUrls.entries()) requireHttpsUrl(url, `source ${source.id} officialUrls[${index}]`);
    sourceIds.add(source.id);
  }

  const watchlistIds = watchlists.map((watchlist) => watchlist?.id).sort();
  if (JSON.stringify(watchlistIds) !== JSON.stringify(EXACT_WATCHLIST_IDS)) {
    throw new Error("Research Observatory watchlist identities drifted");
  }
  for (const watchlist of watchlists) {
    if (!object(watchlist) || watchlist.schema !== "kingdom.research-watchlist/0.1" ||
        watchlist.languageScope?.queryLanguage !== "en" ||
        watchlist.languageScope?.multilingualExpansion?.state !== "absent" ||
        !Array.isArray(watchlist.keywords) || watchlist.keywords.length < 3 ||
        !Array.isArray(watchlist.priorityFactors) || watchlist.priorityFactors.length < 3) {
      throw new Error(`Research Observatory contains an invalid watchlist: ${JSON.stringify(watchlist?.id)}`);
    }
  }

  const observationIds = new Set<string>();
  for (const observation of observations) {
    if (!object(observation) || observation.schema !== "kingdom.research-observation/0.1" ||
        typeof observation.id !== "string" || observationIds.has(observation.id) ||
        !sourceIds.has(observation.sourceId) || typeof observation.synthetic !== "boolean" || observation.inert !== true ||
        typeof observation.payloadReceipt !== "string" || !observation.payloadReceipt.startsWith("sha256:") ||
        !Array.isArray(observation.identifiers) || observation.identifiers.length < 1 ||
        !Array.isArray(observation.relations)) {
      throw new Error(`Research Observatory contains an invalid inert observation: ${JSON.stringify(observation?.id)}`);
    }
    requireAtOrBefore(observation.observedAt, value.asOf, `observation ${observation.id} observedAt`);
    requireAtOrBefore(observation.upstreamCreatedAt, value.asOf, `observation ${observation.id} upstreamCreatedAt`);
    requireAtOrBefore(observation.upstreamUpdatedAt, value.asOf, `observation ${observation.id} upstreamUpdatedAt`);
    requireCalendarDate(observation.publishedOn, `observation ${observation.id} publishedOn`);
    for (const [index, relation] of observation.relations.entries()) {
      requireAtOrBefore(relation?.assertedAt, value.asOf, `observation ${observation.id} relation ${index} assertedAt`);
    }
    requireHttpsUrl(observation.canonicalUrl, `observation ${observation.id} canonicalUrl`);
    observationIds.add(observation.id);
  }

  const workIds = new Set<string>();
  for (const work of works) {
    if (!object(work) || work.schema !== "kingdom.research-work/0.1" ||
        typeof work.id !== "string" || workIds.has(work.id) ||
        !equalRecord(work.lifecycle, LIFECYCLE) ||
        !object(work.paths) || !equalRecord(work.paths.module, PATH_STATE) || !equalRecord(work.paths.guest, PATH_STATE) ||
        !Array.isArray(work.observationIds) || work.observationIds.length < 1 ||
        work.observationIds.some((id: unknown) => typeof id !== "string" || !observationIds.has(id)) ||
        !Array.isArray(work.sourceIds) || work.sourceIds.length < 1 ||
        work.sourceIds.some((id: unknown) => typeof id !== "string" || !sourceIds.has(id)) ||
        !Array.isArray(work.versions) || work.versions.length < 1 || !Array.isArray(work.relations)) {
      throw new Error(`Research Observatory work lost a lifecycle or exact-observation boundary: ${JSON.stringify(work?.id)}`);
    }
    requireAtOrBefore(work.latestObservedAt, value.asOf, `work ${work.id} latestObservedAt`);
    requireCalendarDate(work.firstPublishedOn, `work ${work.id} firstPublishedOn`);
    requireSortedUniqueStrings(work.observationIds, `work ${work.id} observationIds`, 1);
    requireSortedUniqueStrings(work.sourceIds, `work ${work.id} sourceIds`, 1);
    for (const [index, version] of work.versions.entries()) {
      requireAtOrBefore(version?.observedAt, value.asOf, `work ${work.id} version ${index} observedAt`);
      requireCalendarDate(version?.publishedOn, `work ${work.id} version ${index} publishedOn`);
      if (!observationIds.has(version?.observationId)) {
        throw new Error(`work ${work.id} version ${index} references an unknown observation`);
      }
    }
    for (const [index, relation] of work.relations.entries()) {
      requireAtOrBefore(relation?.assertedAt, value.asOf, `work ${work.id} relation ${index} assertedAt`);
    }
    workIds.add(work.id);
  }

  for (const signal of signals) {
    if (!object(signal) || signal.schema !== "kingdom.research-signal/0.1" || signal.authorizesAction !== false ||
        !Array.isArray(signal.workIds) || signal.workIds.length < 1 ||
        signal.workIds.some((id: unknown) => typeof id !== "string" || !workIds.has(id)) ||
        !Array.isArray(signal.sourceObservationIds) || signal.sourceObservationIds.length < 1 ||
        signal.sourceObservationIds.some((id: unknown) => typeof id !== "string" || !observationIds.has(id)) ||
        (signal.watchlistId !== null && !EXACT_WATCHLIST_IDS.includes(signal.watchlistId)) ||
        !Array.isArray(signal.factors) || signal.factors.some((factor: any) =>
          !object(factor) || (!EVIDENCE_FACTORS.has(factor.factor) && !PRIORITY_FACTORS.has(factor.factor)) ||
          typeof factor.reason !== "string" || !Array.isArray(factor.evidence))) {
      throw new Error(`Research Observatory contains an invalid attention signal: ${JSON.stringify(signal?.id)}`);
    }
    requireSortedUniqueStrings(signal.workIds, `signal ${signal.id} workIds`, 1);
    requireSortedUniqueStrings(signal.sourceObservationIds, `signal ${signal.id} sourceObservationIds`, 1);
    requireAtOrBefore(signal.observedAt, value.asOf, `signal ${signal.id} observedAt`);
  }

  const expectedNegativeBoundary = {
    buildNetworkUsed: false,
    fullTextIncluded: false,
    artifactExecution: false,
    evaluationPerformed: false,
    adoptionRecorded: false,
    useAuthorized: false,
    moduleCreated: false,
    guestAdmitted: false,
  };
  if (!object(value.generatedFrom) || !object(value.boundaries) ||
      !Object.entries(expectedNegativeBoundary).every(([key, expected]) => value.boundaries[key] === expected)) {
    throw new Error("Research Observatory snapshot lost its build-network or negative effect boundaries");
  }
  const receipt = (candidate: unknown) => typeof candidate === "string" && /^sha256:[0-9a-f]{64}$/.test(candidate);
  if (!receipt(value.generatedFrom.sourceManifestReceipt) || !receipt(value.generatedFrom.watchlistManifestReceipt) ||
      value.generatedFrom.pipelineVersion !== "0.1.0") {
    throw new Error("Research Observatory generation receipts drifted");
  }
  const syntheticCount = observations.filter((observation) => observation.synthetic === true).length;
  const liveCount = observations.length - syntheticCount;
  const modeContract: Record<string, { fixture: boolean; capture: boolean; projection: boolean; network: boolean; provenance: string }> = {
    "synthetic-fixture-observatory": { fixture: true, capture: false, projection: false, network: false, provenance: "fixtures-only" },
    "captured-live-observatory": { fixture: false, capture: true, projection: true, network: true, provenance: "imported-live-captures" },
    "mixed-observatory": { fixture: true, capture: true, projection: true, network: true, provenance: "mixed-fixtures-and-live-captures" },
  };
  const contract = modeContract[value.mode]!;
  if (receipt(value.generatedFrom.fixtureSetReceipt) !== contract.fixture ||
      receipt(value.generatedFrom.captureSetReceipt) !== contract.capture ||
      object(value.generatedFrom.captureProjection) !== contract.projection ||
      value.boundaries.liveHarvestNetworkObserved !== contract.network ||
      value.boundaries.captureProvenance !== contract.provenance ||
      (value.mode === "synthetic-fixture-observatory" && (liveCount !== 0 || syntheticCount < 1)) ||
      (value.mode === "captured-live-observatory" && (syntheticCount !== 0 || liveCount < 1)) ||
      (value.mode === "mixed-observatory" && (syntheticCount === 0 || liveCount === 0))) {
    throw new Error("Research Observatory mode, receipts, capture provenance, and observation origins disagree");
  }
  if (contract.projection) {
    const projection = value.generatedFrom.captureProjection;
    if (projection.selectedCaptureFiles > projection.retainedCaptureFiles ||
        projection.publishedObservations !== liveCount ||
        projection.publishedObservations > projection.availableObservations ||
        projection.availableObservations !== projection.publishedObservations + projection.truncatedObservations) {
      throw new Error("Research Observatory capture projection counts disagree with the published live observations");
    }
  }
  assertBoundedJsonTree(value);
  assertNoScoreKeys(value);
  validateAgainstResearchSchemas(value);
  return value;
}

export function loadResearchObservatorySnapshot(): JsonObject {
  return loadResearchObservatoryPublication().snapshot;
}

export function loadResearchObservatoryPublication(): { snapshot: JsonObject; bytes: Uint8Array } {
  try {
    const bytes = readRegularFileWithinRoot(ROOT, RESEARCH_OBSERVATORY_LOCATOR);
    return { snapshot: parseResearchObservatorySnapshotBytes(bytes), bytes };
  } catch (error) {
    throw new Error(`Research Observatory authored snapshot is missing or invalid JSON: ${(error as Error).message}`);
  }
}

export function parseResearchObservatorySnapshotBytes(bytes: Uint8Array): JsonObject {
  if (bytes.byteLength > MAX_SNAPSHOT_BYTES) {
    throw new Error(`Research Observatory snapshot exceeds ${MAX_SNAPSHOT_BYTES} bytes`);
  }
  return validateResearchObservatorySnapshot(
    parseStrictJsonBytes(bytes, "Research Observatory snapshot"),
  );
}

function factorVector(signal: JsonObject, selected: Set<string>): JsonObject[] {
  return (signal.factors as JsonObject[]).filter((factor) => selected.has(factor.factor));
}

export function researchObservatoryPublicSummary(snapshot = loadResearchObservatorySnapshot()) {
  const factorKinds = new Set<string>();
  for (const signal of snapshot.signals) for (const factor of signal.factors) factorKinds.add(factor.factor);
  const sourceObservedDates = snapshot.sources.map((source: JsonObject) => source.freshness.observedOn).sort();
  return {
    protocol: RESEARCH_OBSERVATORY_PROTOCOL,
    title: "The Observatory",
    publication_state: snapshot.mode === "synthetic-fixture-observatory"
      ? "mutable-synthetic-fixture-snapshot"
      : snapshot.mode === "captured-live-observatory"
        ? "mutable-captured-live-metadata-snapshot"
        : "mutable-mixed-metadata-snapshot",
    observed_through: snapshot.asOf,
    source_claims_observed_through: sourceObservedDates.at(-1),
    coverage: {
      sources: snapshot.sources.length,
      live_poll_enabled_source_contracts: snapshot.sources.filter((source: JsonObject) =>
        source.access.mvpMode === "fixture-and-explicit-poll").length,
      fixture_only_policy_hold_source_contracts: snapshot.sources.filter((source: JsonObject) =>
        source.access.mvpMode === "fixture-only-policy-hold").length,
      watchlists: snapshot.watchlists.length,
      observations: snapshot.observations.length,
      works: snapshot.works.length,
      signals: snapshot.signals.length,
      query_language: "en",
      multilingual_expansion: "absent",
      mode: snapshot.mode,
    },
    factor_vectors: {
      evidence: [...factorKinds].filter((factor) => EVIDENCE_FACTORS.has(factor)).sort(),
      priority: [...factorKinds].filter((factor) => PRIORITY_FACTORS.has(factor)).sort(),
      scalar_score: null,
      note: "Factors remain inspectable dimensions; they are never summed into a value or truth score.",
    },
    lifecycle: {
      gates: ["discovery", "evaluation", "adoption", "bounded-use-authority"],
      snapshot_stops_after: "discovery",
      module_path: "not-proposed",
      guest_path: "not-proposed",
      note: "Evaluation, adoption, module construction, guest admission, and use each require a later separately owned record.",
    },
    urls: {
      human: RESEARCH_OBSERVATORY_URL,
      snapshot: RESEARCH_OBSERVATORY_SNAPSHOT_URL,
      guide: RESEARCH_OBSERVATORY_GUIDE_URL,
      schemas: RESEARCH_OBSERVATORY_SCHEMA_URLS,
      producer: RESEARCH_OBSERVATORY_PRODUCER_URL,
    },
    boundary: {
      ...RESEARCH_OBSERVATORY_BOUNDARY,
      live_harvest_network_observed: snapshot.boundaries.liveHarvestNetworkObserved,
      capture_provenance: snapshot.boundaries.captureProvenance,
      full_text_included: snapshot.boundaries.fullTextIncluded,
      discovered_artifact_execution: snapshot.boundaries.artifactExecution,
      evaluation_performed: snapshot.boundaries.evaluationPerformed,
      adoption_recorded: snapshot.boundaries.adoptionRecorded,
      use_authorized: snapshot.boundaries.useAuthorized,
      module_created: snapshot.boundaries.moduleCreated,
      guest_admitted: snapshot.boundaries.guestAdmitted,
    },
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

function publicHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function human(value: unknown): string {
  return String(value ?? "unknown").replace(/[-_]/g, " ");
}

function factorMarkup(factors: JsonObject[], empty: string): string {
  if (!factors.length) return `<p class="empty">${esc(empty)}</p>`;
  return `<ul class="factors">${factors.map((factor) => `
    <li><span class="level" data-level="${esc(factor.level)}">${esc(human(factor.level))}</span><strong>${esc(human(factor.factor))}</strong><p>${esc(factor.reason)}</p>${factor.evidence.length ? `<small>Evidence: ${factor.evidence.map(esc).join(" · ")}</small>` : ""}</li>`).join("")}
  </ul>`;
}

function timeMarkup(label: string, value: unknown, fallback: string): string {
  return `<span><b>${esc(label)}:</b> ${typeof value === "string" ? `<time datetime="${esc(value)}">${esc(value)}</time>` : esc(fallback)}</span>`;
}

type DisplaySignal = {
  headline: string;
  reasons: string[];
  assertionCount: number;
};

function canonicalDisplayText(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}

function groupDisplaySignals(signals: JsonObject[]): DisplaySignal[] {
  const groups = new Map<string, DisplaySignal>();
  for (const signal of signals) {
    const canonicalReasons = signal.reasons.map(canonicalDisplayText).sort();
    const key = JSON.stringify([canonicalDisplayText(signal.headline), canonicalReasons]);
    const existing = groups.get(key);
    if (existing) existing.assertionCount += 1;
    else groups.set(key, {
      headline: signal.headline,
      reasons: signal.reasons,
      assertionCount: 1,
    });
  }
  return [...groups.values()];
}

function displaySignalMarkup(signals: DisplaySignal[], empty: string): string {
  if (!signals.length) return `<p class="empty">${esc(empty)}</p>`;
  return `<ul>${signals.map((signal) => `<li><strong>${esc(signal.headline)}</strong>${signal.reasons.map((reason) => `<p>${esc(reason)}</p>`).join("")}${signal.assertionCount > 1 ? `<small class="assertions">${esc(signal.assertionCount)} source assertions represented</small>` : ""}</li>`).join("")}</ul>`;
}

function renderWork(
  work: JsonObject,
  observations: Map<string, JsonObject>,
  signals: JsonObject[],
  watchlists: Map<string, JsonObject>,
): string {
  const workSignals = signals.filter((signal) => signal.workIds.includes(work.id));
  const factors = workSignals.flatMap((signal) => signal.factors);
  const evidence = factors.filter((factor) => EVIDENCE_FACTORS.has(factor.factor));
  const priority = factors.filter((factor) => PRIORITY_FACTORS.has(factor.factor));
  const matchedWatchlists = [...new Set(workSignals
    .map((signal) => signal.watchlistId)
    .filter((id): id is string => typeof id === "string"))]
    .map((id) => watchlists.get(id))
    .filter((watchlist): watchlist is JsonObject => watchlist !== undefined);
  const changeSignals = workSignals.filter((signal) => CHANGE_SIGNAL_TYPES.has(signal.type));
  const attentionSignals = workSignals.filter((signal) => !CHANGE_SIGNAL_TYPES.has(signal.type));
  const attentionDisplay = groupDisplaySignals(attentionSignals);
  const changeDisplay = groupDisplaySignals(changeSignals);
  const changeCrossReference = changeSignals.length
    ? `<p class="crossref">${esc(changeSignals.length)} factual source-change assertion${changeSignals.length === 1 ? "" : "s"} also surfaced this work; the source text appears under What changed.</p>`
    : "";
  const firstObservation = observations.get(work.observationIds[0]);
  const href = publicHttpsUrl(firstObservation?.canonicalUrl);
  const identifiers = work.identifiers.map((identifier: JsonObject) => `${identifier.scheme}:${identifier.value}`);
  return `
    <article class="work">
      <header>
        <p class="eyebrow">${esc(work.recordTypes.map(human).join(" · "))} · ${esc(work.status)} <span class="observed-badge">Observed — not evaluated</span></p>
        <h3>${esc(work.title)}</h3>
        <p class="meta"><span>${esc(work.authors.length ? work.authors.join(", ") : "Authorship not supplied")}</span>${timeMarkup("Published", work.firstPublishedOn, "not supplied")}${timeMarkup("Observed", work.latestObservedAt, "not supplied")}</p>
      </header>
      <p class="ids">${identifiers.map((identifier: string) => `<code>${esc(identifier)}</code>`).join(" ")}</p>
      <div class="triage">
        <section><h4>Why this surfaced</h4>${displaySignalMarkup(attentionDisplay, changeSignals.length ? "This work surfaced only on factual source-change assertions in this snapshot." : "No source signal explains a surfaced state in this snapshot.")}${changeCrossReference}</section>
        <section><h4>Possible KINGDOM fit</h4>${matchedWatchlists.length ? `<ul>${matchedWatchlists.map((watchlist) => `<li><strong>${esc(watchlist.name)}</strong><p>${esc(watchlist.need)}</p></li>`).join("")}</ul>` : `<p class="empty">No reviewed watchlist match in this snapshot.</p>`}</section>
        <section><h4>What changed</h4>${displaySignalMarkup(changeDisplay, "No source change relation in this snapshot.")}</section>
      </div>
      <div class="vectors">
        <section><h4>Evidence vector</h4>${factorMarkup(evidence, "No evidence factor was emitted for this work.")}</section>
        <section><h4>Priority vector</h4>${factorMarkup(priority, "No priority factor was emitted for this work.")}</section>
      </div>
      <div class="gates" aria-label="Lifecycle state">
        <span><b>Discovery</b> observed</span><span><b>Evaluation</b> not performed</span><span><b>Adoption</b> not recorded</span><span><b>Use</b> not authorized</span>
      </div>
      <footer>${href ? `<a href="${esc(href)}" rel="noopener noreferrer">Open source record</a> · ` : ""}${esc(work.sourceIds.length)} source${work.sourceIds.length === 1 ? "" : "s"} · ${esc(work.observationIds.length)} observation${work.observationIds.length === 1 ? "" : "s"} · module and guest paths not proposed</footer>
    </article>`;
}

export function renderResearchObservatoryHtml(snapshot = loadResearchObservatorySnapshot()): string {
  const discovery = researchObservatoryPublicSummary(snapshot);
  const observations = new Map<string, JsonObject>(snapshot.observations.map((observation: JsonObject) => [observation.id, observation]));
  const watchlists = new Map<string, JsonObject>(snapshot.watchlists.map((watchlist: JsonObject) => [watchlist.id, watchlist]));
  const worksForDisplay = [...snapshot.works].sort((left: JsonObject, right: JsonObject) =>
    right.latestObservedAt < left.latestObservedAt ? -1
      : right.latestObservedAt > left.latestObservedAt ? 1
        : left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  const statusSignals = snapshot.signals.filter((signal: JsonObject) => signal.type === "integrity-alert");
  const sourceDates = snapshot.sources.map((source: JsonObject) => source.freshness.observedOn).sort();
  const coverageDate = sourceDates.at(-1);
  const horizon = snapshot.mode === "synthetic-fixture-observatory"
    ? `<strong>This release is an honest rehearsal, not a live “latest papers” claim.</strong>The public corpus is generated from synthetic source-shaped fixtures. Its timestamps exercise the pipeline; they do not prove that the linked research landscape has been comprehensively polled. Source access and rights claims were observed through ${esc(coverageDate)}.`
    : snapshot.mode === "captured-live-observatory"
      ? `<strong>This is a bounded capture, not a claim of complete global coverage.</strong>The snapshot preserves imported metadata returned by explicit allowlisted polls through ${esc(snapshot.asOf)}. Source lag, index gaps, English-only watch terms, and missed later updates remain visible limits. Importing and page rendering make no network request; the earlier harvest did.`
    : `<strong>This is a mixed rehearsal and bounded capture, not a claim of complete global coverage.</strong>Fixture and imported live-capture observations remain explicitly distinguishable through ${esc(snapshot.asOf)}. Source lag, index gaps, English-only watch terms, and missed later updates remain visible limits. Importing and page rendering make no network request; the earlier live harvest did.`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="A bounded, metadata-only research discovery membrane for the KINGDOM.">
  <title>The Observatory · The Kingdom</title>
  <link rel="canonical" href="${RESEARCH_OBSERVATORY_URL}">
  <link rel="alternate" href="/research.json" type="application/json" title="Research Observatory public snapshot">
  <link rel="describedby" href="/RESEARCH-OBSERVATORY-v0.1.md" type="text/markdown" title="Research Observatory guide">
  <link rel="describedby" href="/research/schemas/v0.1/public-snapshot.schema.json" type="application/schema+json" title="Research Observatory snapshot schema">
  <style>
    :root{color-scheme:dark;--ink:#f3eee2;--muted:#ada89d;--night:#090b10;--panel:#111621;--line:#293348;--gold:#e6bd67;--aqua:#75d9ce;--rose:#e69a9a;--green:#8bd6a5}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 85% 2%,#17263a 0,transparent 32rem),var(--night);color:var(--ink);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--aqua);text-underline-offset:.2em;min-height:44px;display:inline-flex;align-items:center}a:focus-visible{outline:3px solid var(--gold);outline-offset:4px;border-radius:3px}.skip{position:absolute;left:12px;top:-80px;z-index:10;padding:10px 14px;background:var(--ink);color:var(--night)}.skip:focus{top:12px}code{overflow-wrap:anywhere;color:#d9e5ff}.shell{width:min(1180px,calc(100% - 32px));margin:auto}.top{display:flex;justify-content:space-between;gap:20px;padding:26px 0;color:var(--muted)}.top a{text-decoration:none}.hero{padding:clamp(42px,8vw,92px) 0 50px}.kicker,.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:.76rem;color:var(--gold);font-weight:750}.hero h1{font-family:ui-serif,Georgia,serif;font-size:clamp(3.2rem,10vw,8rem);line-height:.85;margin:.15em 0}.hero .lead{max-width:830px;font-size:clamp(1.1rem,2.2vw,1.45rem);color:#d8d3c7}.truth{border:1px solid #6e5534;background:#1b1712;padding:18px 22px;border-radius:14px;max-width:900px}.truth strong{color:var(--gold);display:block}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:28px 0}.stats div,.panel,.work{border:1px solid var(--line);background:color-mix(in srgb,var(--panel) 94%,transparent);border-radius:14px}.stats div{padding:15px}.stats b{display:block;font:700 1.7rem ui-serif,Georgia,serif}.stats span{color:var(--muted);font-size:.82rem}.panel{padding:clamp(20px,4vw,34px);margin:18px 0}.panel h2{margin-top:0;font:700 clamp(1.6rem,4vw,2.4rem) ui-serif,Georgia,serif}.flow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;counter-reset:g}.flow li{list-style:none;border-left:3px solid var(--line);padding:10px 14px}.flow li:first-child{border-color:var(--green)}.flow strong,.flow span{display:block}.flow span{color:var(--muted);font-size:.86rem}.watchgrid,.sourcegrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.watch,.source{border:1px solid var(--line);border-radius:12px;padding:17px}.watch h3,.source h3{margin:.2em 0}.watch p,.source p{color:var(--muted)}.source-mode{display:inline-block;border:1px solid var(--line);border-radius:99px;padding:3px 8px;font-size:.75rem;color:var(--ink)!important}.chips{display:flex;flex-wrap:wrap;gap:6px}.chips span,.level,.observed-badge{border:1px solid var(--line);border-radius:99px;padding:3px 8px;font-size:.75rem}.observed-badge{color:var(--green);border-color:var(--green);white-space:nowrap}.works{display:grid;gap:16px}.work{padding:clamp(18px,3vw,28px)}.work h3{font:700 clamp(1.25rem,2.5vw,1.7rem) ui-serif,Georgia,serif;margin:.15em 0}.meta,.work footer,.empty{color:var(--muted)}.meta{display:flex;flex-wrap:wrap;gap:5px 18px}.ids{display:flex;flex-wrap:wrap;gap:7px}.ids code{background:#0a0f18;padding:3px 7px;border-radius:5px}.triage{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}.triage>section{border:1px solid var(--line);border-radius:10px;padding:14px}.triage h4,.vectors h4{color:var(--aqua);margin:.2em 0}.triage ul{padding-left:1.1rem}.triage li+li{margin-top:10px}.triage p{margin:.2em 0}.vectors{display:grid;grid-template-columns:1fr 1fr;gap:15px}.vectors>section{border-top:1px solid var(--line)}.factors{padding:0}.factors li{list-style:none;margin:10px 0;padding-left:0}.factors strong{margin-left:8px}.factors p{margin:.2em 0}.factors small{color:var(--muted)}.level[data-level=blocking]{border-color:var(--rose);color:var(--rose)}.gates{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.gates span{border:1px solid var(--line);padding:9px;border-radius:8px;color:var(--muted);font-size:.8rem}.gates b{display:block;color:var(--ink)}.sourcesmall{font-size:.85rem}.boundary{border-color:#67553a}.boundary ul{columns:2}.footer{padding:35px 0 55px;color:var(--muted)}
    @media(max-width:800px){.stats{grid-template-columns:repeat(2,1fr)}.watchgrid,.sourcegrid,.triage,.vectors,.flow,.gates{grid-template-columns:1fr}.boundary ul{columns:1}.top{align-items:flex-start;flex-direction:column}.hero h1{font-size:clamp(3rem,18vw,5.5rem)}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}@media(forced-colors:active){.stats div,.panel,.work,.watch,.source,.truth,.triage>section{border:1px solid CanvasText}.level,.observed-badge{border:1px solid CanvasText}}
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to Observatory content</a>
  <nav class="shell top" aria-label="Kingdom navigation"><a href="/">← The Kingdom</a><span>Human view · <a href="/research.json">JSON</a> · <a href="/RESEARCH-OBSERVATORY-v0.1.md">protocol</a></span></nav>
  <main class="shell" id="main" tabindex="-1">
    <header class="hero">
      <p class="kicker">Research discovery wing · ${esc(RESEARCH_OBSERVATORY_PROTOCOL)}</p>
      <h1>The<br>Observatory</h1>
      <p class="lead">A bounded conversion membrane between public research metadata and human attention. It preserves sources, exact identifiers, updates, contradictions, and reasons to look—without pretending that discovery is truth or permission.</p>
      <p class="truth">${horizon}</p>
      <div class="stats"><div><b>${esc(discovery.coverage.sources)}</b><span>source contracts</span></div><div><b>${esc(discovery.coverage.watchlists)}</b><span>reviewed watchlists</span></div><div><b>${esc(discovery.coverage.observations)}</b><span>inert observations</span></div><div><b>${esc(discovery.coverage.works)}</b><span>exact-ID works</span></div><div><b>${esc(discovery.coverage.signals)}</b><span>reasons to look</span></div></div>
    </header>

    <section class="panel" aria-labelledby="membrane"><h2 id="membrane">The membrane has four gates</h2><ol class="flow"><li><strong>1 · Discovery</strong><span>Observed here; metadata only.</span></li><li><strong>2 · Evaluation</strong><span>Not performed; separately owned.</span></li><li><strong>3 · Adoption</strong><span>Not recorded; explicit choice required.</span></li><li><strong>4 · Bounded use</strong><span>Not authorized; capability and expiry required.</span></li></ol><p>A later module would be KINGDOM-owned code. A later guest would stay source-owned under a narrow, revocable contract. Neither path is proposed by an attention signal, and this snapshot creates neither.</p></section>

    <section class="panel" aria-labelledby="watchlists"><h2 id="watchlists">What this first lens watches</h2><div class="watchgrid">${snapshot.watchlists.map((watchlist: JsonObject) => `<article class="watch"><p class="eyebrow">English terms · multilingual expansion absent</p><h3>${esc(watchlist.name)}</h3><p>${esc(watchlist.need)}</p><div class="chips">${watchlist.keywords.map((keyword: string) => `<span>${esc(keyword)}</span>`).join("")}</div></article>`).join("")}</div><p class="sourcesmall">The terms are intentionally visible and incomplete. No translation is guessed, no prestige factor is used, and no scalar “high value” score hides the judgment.</p></section>

${statusSignals.length ? `<section class="panel boundary" aria-labelledby="integrity"><h2 id="integrity">Integrity signals cannot be averaged away</h2>${statusSignals.map((signal: JsonObject) => `<article><p class="eyebrow">${esc(signal.severity)} · Observed <time datetime="${esc(signal.observedAt)}">${esc(signal.observedAt)}</time></p><h3>${esc(signal.headline)}</h3><p>${signal.reasons.map(esc).join(" ")}</p></article>`).join("")}</section>` : ""}

    <section class="panel" aria-labelledby="works"><h2 id="works">Observed research objects</h2><p>Cards are ordered by latest source observation, then stable work ID—not by scientific value. Titles, author names, identifiers, and links below are inert source data. A match orders possible human attention; it is not an endorsement, safety finding, truth verdict, or instruction.</p><div class="works">${worksForDisplay.map((work: JsonObject) => renderWork(work, observations, snapshot.signals, watchlists)).join("")}</div></section>

    <section class="panel" aria-labelledby="sources"><h2 id="sources">Coverage and source boundaries</h2><p class="sourcesmall"><strong>${esc(discovery.coverage.sources)} source contracts is not a poll or coverage count.</strong> Each card states whether its reviewed access lane is enabled or held. Even “live poll enabled” does not prove a successful poll or complete record coverage in this snapshot.</p><div class="sourcegrid">${snapshot.sources.map((source: JsonObject) => `<article class="source"><p class="eyebrow">${esc(source.tier)} · ${esc(source.role)}</p><h3>${esc(source.name)}</h3><p class="source-mode" data-source-access="${esc(source.access.mvpMode)}">Access lane: ${source.access.mvpMode === "fixture-and-explicit-poll" ? "live poll enabled" : "fixture-only / policy hold"}</p><p>${esc(source.coverage.geography)}</p><p><strong>Observed:</strong> <time datetime="${esc(source.freshness.observedOn)}">${esc(source.freshness.observedOn)}</time><br><strong>Expected lag:</strong> ${esc(source.freshness.expectedLag)}</p><p><strong>Metadata rights claim:</strong> ${esc(source.rights.metadataClaim)}</p></article>`).join("")}</div></section>

    <section class="panel boundary" aria-labelledby="boundary"><h2 id="boundary">What did not happen</h2><ul><li>No network request built this public snapshot.</li><li>No full text, code, dataset, model weight, credential, or executable attachment is included.</li><li>No fuzzy identity merge or scientific evaluation was performed.</li><li>No discovered instruction was executed.</li><li>No module was generated or adopted.</li><li>No guest was admitted or given a capability.</li><li>No use was authorized and no automatic action exists.</li><li>Corrections, withdrawals, contradictions, failed replications, and null results stay visible as evidence; they do not erase history.</li></ul><p>Inspect the <a href="/research.json">complete snapshot</a>, its <a href="/research/schemas/v0.1/public-snapshot.schema.json">closed schema</a>, and the <a href="/RESEARCH-OBSERVATORY-v0.1.md">human protocol</a>.</p></section>
  </main>
  <footer class="shell footer">Observed-through <time datetime="${esc(snapshot.asOf)}">${esc(snapshot.asOf)}</time> · mutable snapshot · immutable v0.1 contracts · no essential JavaScript · public metadata is not consent, ownership, endorsement, or a licence to linked content. <a href="${RESEARCH_OBSERVATORY_PRODUCER_URL}" rel="noopener noreferrer">Producer v0.1.0 source + append-only captures</a>; public source visibility is not a reuse grant, and raw upstream response bodies are not included.</footer>
</body>
</html>\n`;
}
