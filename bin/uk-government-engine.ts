#!/usr/bin/env bun
/**
 * Strict, network-free reader and server renderer for the UK Government Engine.
 *
 * The authored snapshot is a dated, independent institutional atlas. Official
 * sources are link-only records from a maintainer-authorized assisted URL
 * review; they are not exact-byte captures. TaxSorted is the inverse boundary:
 * exact captured bytes support a non-official crosswalk only and never support
 * a government claim. Nothing in this module files, pays, signs in, advises,
 * decides, transfers data, calls an API, or exposes an MCP/control surface.
 */

import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { readRegularFileWithinRoot } from "./immutable-publications.ts";
import { parseStrictJsonBytes } from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const UK_GOVERNMENT_ENGINE_PROTOCOL = "kingdom.government-engine-public-snapshot/0.1";
export const UK_GOVERNMENT_ENGINE_LOCATOR = "data/government/uk-government-engine.v0.1.json";
export const UK_GOVERNMENT_ENGINE_PAGE_LOCATOR = "site/government-engine/index.html";
export const UK_GOVERNMENT_ENGINE_ALIAS_LOCATOR = "site/government.json";
export const UK_GOVERNMENT_ENGINE_SCHEMA_LOCATOR = "schemas/government-engine/v0.1/public-snapshot.schema.json";
export const UK_GOVERNMENT_ENGINE_GUIDE_LOCATOR = "references/uk-government-engine-v0.1.md";
export const UK_GOVERNMENT_ENGINE_URL = "https://thekingdom.dev/government-engine/";
export const UK_GOVERNMENT_ENGINE_ALIAS_URL = "https://thekingdom.dev/government.json";
export const UK_GOVERNMENT_ENGINE_CANONICAL_URL = "https://thekingdom.dev/government/uk-government-engine-2026-08-21.json";
export const UK_GOVERNMENT_ENGINE_SCHEMA_URL = "https://thekingdom.dev/government/schemas/v0.1/public-snapshot.schema.json";
export const UK_GOVERNMENT_ENGINE_GUIDE_URL = "https://thekingdom.dev/UK-GOVERNMENT-ENGINE-v0.1.md";
export const UK_GOVERNMENT_ENGINE_PRODUCER_URL = "https://github.com/cambridgetcg/kingdom-government-engine/tree/v0.1.0";
export const UK_GOVERNMENT_ENGINE_BYTE_SHA256 = "1751b2ac331d6a1283cbf57b5b6961d9071f528298f97589fcbd7cf36407e139";
export const UK_GOVERNMENT_ENGINE_CANONICAL_SHA256 = "cc2c22e356cef0160ed5da1e2fd756bad5801f574c4cb064dec157b9207b9739";
export const UK_GOVERNMENT_ENGINE_SCHEMA_BYTE_SHA256 = "2f646d15e4a1d7b96e9bcefdfe90b9e9d170a860fd2eca83f2120a67ece20c50";
export const UK_GOVERNMENT_ENGINE_SCHEMA_CANONICAL_SHA256 = "e7748b8341f28610cf569ebe57d376f7c045a58531b294ad3fd580ff21ed4e11";
export const UK_GOVERNMENT_ENGINE_GUIDE_BYTE_SHA256 = "d048260d9837e25a3f62c367cb66fd941d7cf6d29fa33eea74b6d260a2ed54cc";

const MAX_SNAPSHOT_BYTES = 512 * 1024;
const MAX_SCHEMA_BYTES = 128 * 1024;
const MAX_TREE_DEPTH = 36;
const MAX_TREE_NODES = 160_000;
const MAX_STRING_CODE_UNITS = 1_500_000;
const MAX_ARRAY_ITEMS = 2048;

const EXPECTED_COUNTS = Object.freeze({
  bodies: 39,
  claims: 58,
  externalBridges: 2,
  flows: 10,
  planes: 6,
  rails: 11,
  redressRoutes: 10,
  relatedResources: 2,
  relations: 34,
  sources: 66,
  unknowns: 10,
});

const EXPECTED_TAXSORTED_RECEIPTS = Object.freeze([
  { bytes: 7_833, path: "vendor/captures/taxsorted/open-data-releases.json", sha256: "sha256:b2378e2052e8aeae169f2ce3827fdc45b45cbc7719ad0a348a38efff1ac704f9", url: "https://api.taxsorted.io/v1/open-data/releases" },
  { bytes: 66_953, path: "vendor/captures/taxsorted/uk-public-funding/dictionary.json", sha256: "sha256:e125ea0231a694bcbea9d7d817f74206ca32f95a90a62811843e1d04c38dc9ce", url: "https://api.taxsorted.io/v1/public-funding/uk/dictionary" },
  { bytes: 326_995, path: "vendor/captures/taxsorted/uk-public-funding/graph.json", sha256: "sha256:8100d03e8d1d095ea2d3eea1cd237424d3b0bf11e13901018fdd52f55ec0d801", url: "https://api.taxsorted.io/v1/public-funding/uk/graph" },
  { bytes: 1_293, path: "vendor/captures/taxsorted/uk-public-funding/manifest.json", sha256: "sha256:845f99da64fd9217a982f713db5a6dca863949fbcce11515e563453106fa579d", url: "https://api.taxsorted.io/v1/public-funding/uk/manifest" },
  { bytes: 24_876, path: "vendor/captures/taxsorted/uk-public-funding/schema.json", sha256: "sha256:5e6b15e720f4f65b9439f5c5688fced7c9c8c7f12ead9d9b23efb6503017bf54", url: "https://api.taxsorted.io/v1/public-funding/uk/schema" },
  { bytes: 49_611, path: "vendor/captures/taxsorted/uk-tax-system/dictionary.json", sha256: "sha256:4abfd3174aee765590c718f72ac367e9783a92dfea1e992075464372f2e227d2", url: "https://api.taxsorted.io/v1/tax-system/uk/dictionary" },
  { bytes: 286_808, path: "vendor/captures/taxsorted/uk-tax-system/graph.json", sha256: "sha256:400bbe40cad2cfad3a755cb248263822e53d633c22ceb42f2f7d4b84ecd0cb99", url: "https://api.taxsorted.io/v1/tax-system/uk/graph" },
  { bytes: 1_021, path: "vendor/captures/taxsorted/uk-tax-system/manifest.json", sha256: "sha256:d94d25936dcceaeb7fca98d271db37a9b64dc0105621a64b940331456edf1ad1", url: "https://api.taxsorted.io/v1/tax-system/uk/manifest" },
  { bytes: 18_273, path: "vendor/captures/taxsorted/uk-tax-system/schema.json", sha256: "sha256:5fd46932c26c217335510ba308d0603e600acbf6952ecfbc07e4fddb4c9ace3f", url: "https://api.taxsorted.io/v1/tax-system/uk/schema" },
]);

const OFFICIAL_SOURCE_HOSTS = new Set([
  "assets.publishing.service.gov.uk",
  "committees.parliament.uk",
  "ico.org.uk",
  "obr.uk",
  "uksa.statisticsauthority.gov.uk",
  "www.api.gov.uk",
  "www.bankofengland.co.uk",
  "www.data.gov.uk",
  "www.forms.service.gov.uk",
  "www.gov.scot",
  "www.gov.uk",
  "www.gov.wales",
  "www.judiciary.uk",
  "www.justice.gov.uk",
  "www.legislation.gov.uk",
  "www.lgo.org.uk",
  "www.nao.org.uk",
  "www.nationalarchives.gov.uk",
  "www.nidirect.gov.uk",
  "www.nipso.org.uk",
  "www.notifications.service.gov.uk",
  "www.ombudsman.org.uk",
  "www.ombudsman.wales",
  "www.ons.gov.uk",
  "www.parliament.uk",
  "www.payments.service.gov.uk",
  "www.psr.org.uk",
  "www.sign-in.service.gov.uk",
  "www.spso.org.uk",
  "www.supremecourt.uk",
]);

type JsonObject = Record<string, any>;

function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function ukGovernmentEngineCanonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(ukGovernmentEngineCanonicalJson).join(",")}]`;
  if (object(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${ukGovernmentEngineCanonicalJson(value[key])}`).join(",")}}`;
  }
  throw new Error("UK Government Engine value is not JSON");
}

function sameJson(left: unknown, right: unknown): boolean {
  return ukGovernmentEngineCanonicalJson(left) === ukGovernmentEngineCanonicalJson(right);
}

function schemaTypeMatches(value: unknown, type: string): boolean {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return object(value);
  if (type === "integer") return Number.isSafeInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function validDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  return instant.getUTCFullYear() === year && instant.getUTCMonth() === month - 1 && instant.getUTCDate() === day;
}

function validUri(value: string): boolean {
  try {
    const parsed = new URL(value);
    return !!parsed.protocol && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function schemaPointer(root: JsonObject, reference: string): unknown {
  if (reference === "#") return root;
  if (!reference.startsWith("#/")) throw new Error(`unsupported UK Government Engine schema reference ${reference}`);
  let current: unknown = root;
  for (const raw of reference.slice(2).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!object(current) || !Object.hasOwn(current, key)) {
      throw new Error(`unresolved UK Government Engine schema reference ${reference}`);
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
  if (depth > 64) return [`${path}: schema nesting exceeds 64`];
  if (schema === true) return [];
  if (schema === false) return [`${path}: value is forbidden`];
  if (!object(schema)) return [`${path}: invalid schema node`];
  if (typeof schema.$ref === "string") {
    return schemaIssues(value, schemaPointer(root, schema.$ref), path, root, depth + 1);
  }
  const issues: string[] = [];
  if (Object.hasOwn(schema, "const") && !sameJson(value, schema.const)) {
    issues.push(`${path}: must equal declared constant`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => sameJson(candidate, value))) {
    issues.push(`${path}: value is outside enum`);
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
    if (schema.format === "date" && !validDate(value)) issues.push(`${path}: string is not a real date`);
    if (schema.format === "uri" && !validUri(value)) issues.push(`${path}: string is not a URI`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) issues.push(`${path}: number is below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) issues.push(`${path}: number is above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) issues.push(`${path}: array has too few items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) issues.push(`${path}: array has too many items`);
    if (schema.uniqueItems === true && new Set(value.map(ukGovernmentEngineCanonicalJson)).size !== value.length) {
      issues.push(`${path}: array items must be unique`);
    }
    if (schema.items !== undefined) value.forEach((entry, index) => {
      issues.push(...schemaIssues(entry, schema.items, `${path}/${index}`, root, depth + 1));
    });
  }
  if (object(value)) {
    const properties = object(schema.properties) ? schema.properties : {};
    for (const required of Array.isArray(schema.required) ? schema.required : []) {
      if (!Object.hasOwn(value, required)) issues.push(`${path}/${required}: required property is missing`);
    }
    for (const [key, entry] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) {
        issues.push(...schemaIssues(entry, properties[key], `${path}/${key}`, root, depth + 1));
      } else if (schema.additionalProperties === false) {
        issues.push(`${path}/${key}: additional property is forbidden`);
      } else if (object(schema.additionalProperties)) {
        issues.push(...schemaIssues(entry, schema.additionalProperties, `${path}/${key}`, root, depth + 1));
      }
    }
  }
  return issues;
}

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function loadSchemaPublication(): { schema: JsonObject; bytes: Uint8Array } {
  const bytes = readRegularFileWithinRoot(ROOT, UK_GOVERNMENT_ENGINE_SCHEMA_LOCATOR);
  if (bytes.byteLength > MAX_SCHEMA_BYTES) throw new Error(`UK Government Engine schema exceeds ${MAX_SCHEMA_BYTES} bytes`);
  if (sha256(bytes) !== UK_GOVERNMENT_ENGINE_SCHEMA_BYTE_SHA256) {
    throw new Error("UK Government Engine schema byte receipt drifted");
  }
  const schema = parseStrictJsonBytes(bytes, "UK Government Engine public snapshot schema");
  if (!object(schema) || schema.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
      schema.$id !== UK_GOVERNMENT_ENGINE_SCHEMA_URL) {
    throw new Error("UK Government Engine schema identity drifted");
  }
  if (sha256(ukGovernmentEngineCanonicalJson(schema)) !== UK_GOVERNMENT_ENGINE_SCHEMA_CANONICAL_SHA256) {
    throw new Error("UK Government Engine schema canonical receipt drifted");
  }
  return { schema, bytes };
}

export function ukGovernmentEngineSchemaIssues(value: unknown): string[] {
  const { schema } = loadSchemaPublication();
  return schemaIssues(value, schema, "$", schema);
}

function assertBoundedJsonTree(value: unknown, depth = 0, budget = { nodes: 0, strings: 0 }): void {
  if (depth > MAX_TREE_DEPTH) throw new Error(`UK Government Engine JSON nesting exceeds ${MAX_TREE_DEPTH}`);
  budget.nodes += 1;
  if (budget.nodes > MAX_TREE_NODES) throw new Error("UK Government Engine JSON node budget exceeded");
  if (typeof value === "string") {
    if (value.length > 16_384) throw new Error("UK Government Engine contains an oversized string");
    budget.strings += value.length;
    if (budget.strings > MAX_STRING_CODE_UNITS) throw new Error("UK Government Engine string budget exceeded");
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) throw new Error("UK Government Engine array budget exceeded");
    value.forEach((entry) => assertBoundedJsonTree(entry, depth + 1, budget));
    return;
  }
  if (object(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (key.length > 128) throw new Error("UK Government Engine contains an oversized object key");
      assertBoundedJsonTree(entry, depth + 1, budget);
    }
  }
}

function requireOrderedUnique(values: JsonObject[], label: string): void {
  const ids = values.map((value) => value.id);
  if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length ||
      ids.some((id, index) => index > 0 && ids[index - 1].localeCompare(id) >= 0)) {
    throw new Error(`${label} must be uniquely ordered by id`);
  }
}

function requireReferences(values: unknown, allowed: Set<string>, label: string, allowEmpty = false): void {
  if (!Array.isArray(values) || (!allowEmpty && values.length === 0) ||
      values.some((id) => typeof id !== "string" || !allowed.has(id))) {
    throw new Error(`${label} contains an unresolved reference`);
  }
}

function parseSafeHttps(value: unknown, label: string): URL {
  if (typeof value !== "string") throw new Error(`${label} is not an HTTPS URL`);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not an HTTPS URL`);
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error(`${label} is not a credential-free HTTPS URL`);
  }
  return parsed;
}

function assertOfficialSourceUrl(value: unknown, label: string): void {
  const parsed = parseSafeHttps(value, label);
  if (!OFFICIAL_SOURCE_HOSTS.has(parsed.hostname)) {
    throw new Error(`${label} left the reviewed official-source host set`);
  }
}

function assertCounts(snapshot: JsonObject): void {
  if (!sameJson(snapshot.counts, EXPECTED_COUNTS)) throw new Error("UK Government Engine count contract drifted");
  for (const [key, count] of Object.entries(EXPECTED_COUNTS)) {
    if (!Array.isArray(snapshot[key]) || snapshot[key].length !== count) {
      throw new Error(`UK Government Engine ${key} cardinality drifted`);
    }
  }
}

function assertNoScalarCollapse(value: unknown, path = "snapshot"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoScalarCollapse(entry, `${path}[${index}]`));
    return;
  }
  if (!object(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    if (/^(?:score|rank|ranking|totalScore|total_score)$/i.test(key)) {
      throw new Error(`${path}.${key} would collapse institutional evidence into a scalar`);
    }
    assertNoScalarCollapse(entry, `${path}.${key}`);
  }
}

export function validateUkGovernmentEngineSnapshot(value: unknown): JsonObject {
  if (!object(value)) throw new Error("UK Government Engine snapshot must be an object");
  assertBoundedJsonTree(value);
  const issues = ukGovernmentEngineSchemaIssues(value);
  if (issues.length) {
    throw new Error(`UK Government Engine snapshot failed its closed schema:\n${issues.slice(0, 32).join("\n")}`);
  }
  if (value.schema !== UK_GOVERNMENT_ENGINE_PROTOCOL || value.contractVersion !== "0.1.0" ||
      value.title !== "Government Engine: United Kingdom" || value.asOf !== "2026-08-21" ||
      value.jurisdiction !== "United Kingdom") {
    throw new Error("UK Government Engine publication identity drifted");
  }
  if (!sameJson(value.urls, {
    canonical: UK_GOVERNMENT_ENGINE_CANONICAL_URL,
    guide: UK_GOVERNMENT_ENGINE_GUIDE_URL,
    human: UK_GOVERNMENT_ENGINE_URL,
    mutableAlias: UK_GOVERNMENT_ENGINE_ALIAS_URL,
    producer: UK_GOVERNMENT_ENGINE_PRODUCER_URL,
  })) throw new Error("UK Government Engine URL identity drifted");
  if (!sameJson(value.authorship, {
    compiledBy: "codex-assisted-publication",
    exactTextHumanReviewed: false,
    humanDirectionRecorded: true,
    origin: "maintainer-authorized-assisted-publication",
  })) throw new Error("UK Government Engine assisted-authorship boundary drifted");
  if (value.freshness?.mode !== "dated-static-snapshot" || value.freshness?.sourceCheckedOn !== value.asOf ||
      value.freshness?.nextReviewDue !== "2026-09-21" || value.freshness?.taxsortedUpstreamReviewAlarm !== true) {
    throw new Error("UK Government Engine dated freshness contract drifted");
  }
  if (value.sourceLedgerPolicy?.reviewMode !== "maintainer-authorized-assisted-url-review" ||
      value.sourceLedgerPolicy?.integrity?.exactTextHumanReviewed !== false ||
      value.sourceLedgerPolicy?.integrity?.rawBodyRetained !== false ||
      value.sourceLedgerPolicy?.integrity?.rawSha256 !== null ||
      value.sourceLedgerPolicy?.integrity?.rawHashVerified !== false ||
      value.sourceLedgerPolicy?.integrity?.contentReceipt !== null ||
      value.sourceLedgerPolicy?.integrity?.byteVerified !== false ||
      value.sourceLedgerPolicy?.rights?.publicationMode !== "link-only" ||
      value.sourceLedgerPolicy?.rights?.officialSourceBodyRepublished !== false ||
      value.sourceLedgerPolicy?.rights?.reuseLicenceInferred !== false) {
    throw new Error("UK Government Engine official-source link-only boundary drifted");
  }
  if (Object.keys(value.boundaries).length !== 32 || Object.values(value.boundaries).some((entry) => entry !== false)) {
    throw new Error("UK Government Engine negative-effect boundary drifted");
  }
  if (value.buildProvenance?.networkUsed !== false ||
      value.buildProvenance?.schemaByteReceipt !== `sha256:${UK_GOVERNMENT_ENGINE_SCHEMA_BYTE_SHA256}` ||
      value.buildProvenance?.schemaCanonicalReceipt !== `sha256:${UK_GOVERNMENT_ENGINE_SCHEMA_CANONICAL_SHA256}`) {
    throw new Error("UK Government Engine build provenance drifted");
  }
  assertCounts(value);

  const collections = ["planes", "sources", "claims", "bodies", "relations", "flows", "rails",
    "redressRoutes", "unknowns", "externalBridges", "relatedResources"] as const;
  collections.forEach((key) => requireOrderedUnique(value[key], `UK Government Engine ${key}`));
  const ids = Object.fromEntries(collections.map((key) => [key, new Set<string>(value[key].map((entry: JsonObject) => entry.id))])) as
    Record<typeof collections[number], Set<string>>;
  const localIds = new Set<string>(collections.flatMap((key) => [...ids[key]]));

  const sourceUrls = new Set<string>();
  for (const source of value.sources) {
    assertOfficialSourceUrl(source.url, `official source ${source.id}`);
    sourceUrls.add(source.url);
    if (source.checkedOn !== value.asOf || !sameJson(source.integrity, value.sourceLedgerPolicy.integrity) ||
        !sameJson(source.rights, value.sourceLedgerPolicy.rights)) {
      throw new Error(`official source lost assisted link-only parity: ${source.id}`);
    }
  }
  for (const claim of value.claims) {
    requireReferences(claim.sourceIds, ids.sources, `claim ${claim.id} sourceIds`);
    if (claim.checkedOn !== value.asOf) throw new Error(`claim review date drifted: ${claim.id}`);
  }
  for (const plane of value.planes) requireReferences(plane.claimIds, ids.claims, `plane ${plane.id} claimIds`);
  for (const body of value.bodies) {
    requireReferences(body.planeIds, ids.planes, `body ${body.id} planeIds`);
    requireReferences(body.claimIds, ids.claims, `body ${body.id} claimIds`);
  }
  for (const relation of value.relations) {
    requireReferences([relation.fromId, relation.toId], ids.bodies, `relation ${relation.id} body endpoints`);
    requireReferences(relation.planeIds, ids.planes, `relation ${relation.id} planeIds`);
    requireReferences(relation.claimIds, ids.claims, `relation ${relation.id} claimIds`);
  }
  for (const flow of value.flows) {
    requireReferences(flow.planeIds, ids.planes, `flow ${flow.id} planeIds`);
    const expectedOrders = flow.steps.map((_: unknown, index: number) => index + 1);
    if (!sameJson(flow.steps.map((step: JsonObject) => step.order), expectedOrders)) {
      throw new Error(`flow ${flow.id} steps are not a contiguous order`);
    }
    for (const step of flow.steps) {
      requireReferences(step.bodyIds, ids.bodies, `flow ${flow.id} step ${step.order} bodyIds`);
      requireReferences(step.claimIds, ids.claims, `flow ${flow.id} step ${step.order} claimIds`);
    }
  }
  for (const rail of value.rails) {
    requireReferences(rail.bodyIds, ids.bodies, `rail ${rail.id} bodyIds`);
    requireReferences(rail.claimIds, ids.claims, `rail ${rail.id} claimIds`);
  }
  for (const route of value.redressRoutes) {
    assertOfficialSourceUrl(route.startUrl, `redress route ${route.id}`);
    if (!sourceUrls.has(route.startUrl)) throw new Error(`redress route ${route.id} is not bound to an official source record`);
    requireReferences(route.bodyIds, ids.bodies, `redress route ${route.id} bodyIds`);
    requireReferences(route.claimIds, ids.claims, `redress route ${route.id} claimIds`);
    if ([route.automaticEscalation, route.deadlineCalculated, route.eligibilityDetermined, route.legalAdvice]
      .some((entry) => entry !== false)) throw new Error(`redress route ${route.id} acquired decision authority`);
  }
  for (const unknown of value.unknowns) {
    requireReferences(unknown.sourceIds, ids.sources, `unknown ${unknown.id} sourceIds`, true);
  }

  const expectedBridgeIds = ["bridge:taxsorted-public-funding", "bridge:taxsorted-tax-system"];
  const expectedDatasets = ["taxsorted:uk-public-funding", "taxsorted:uk-tax-system"];
  if (!sameJson(value.externalBridges.map((bridge: JsonObject) => bridge.id), expectedBridgeIds) ||
      !sameJson(value.externalBridges.map((bridge: JsonObject) => bridge.datasetId), expectedDatasets)) {
    throw new Error("UK Government Engine TaxSorted bridge identity drifted");
  }
  const receiptFiles: JsonObject[] = [];
  const selectedRecordIds = new Set<string>();
  let releaseLedger: JsonObject | undefined;
  for (const bridge of value.externalBridges) {
    if (bridge.bridgeMode !== "receipt-bound-crosswalk-only" || bridge.boundaryScope !== "government-engine-public-projection" ||
        bridge.resourceId !== "resource:taxsorted-uk-system" ||
        bridge.captureManifestCanonicalReceipt !== value.buildProvenance.taxsortedCaptureManifestCanonicalReceipt ||
        Object.values(bridge.boundaries).some((entry) => entry !== false) ||
        bridge.rights?.declarationIndependentlyVerified !== false ||
        bridge.rights?.upstreamSourceBodiesRepublished !== false ||
        bridge.rights?.upstreamSourceRightsNotGrantedByThisCapture !== true ||
        bridge.provenance?.immutableSnapshot !== null || bridge.provenance?.notComplete !== true ||
        bridge.provenance?.upstreamReviewAlarm !== true ||
        bridge.sourceFreshnessAtCapture?.allSourcesCurrentGuaranteed !== false) {
      throw new Error(`TaxSorted crosswalk boundary drifted: ${bridge.id}`);
    }
    if (bridge.graphManifestDatasetHash !== bridge.captureReceipts.graph.sha256) {
      throw new Error(`TaxSorted graph receipt drifted: ${bridge.id}`);
    }
    if (releaseLedger && !sameJson(releaseLedger, bridge.releaseLedgerReceipt)) {
      throw new Error("TaxSorted bridges no longer share one release-ledger receipt");
    }
    releaseLedger = bridge.releaseLedgerReceipt;
    receiptFiles.push(bridge.releaseLedgerReceipt, ...Object.values(bridge.captureReceipts) as JsonObject[]);
    for (const binding of bridge.selectedRecordBindings) {
      if (selectedRecordIds.has(binding.recordId)) throw new Error(`duplicate TaxSorted selected record ${binding.recordId}`);
      selectedRecordIds.add(binding.recordId);
      requireReferences(binding.localIds, localIds, `TaxSorted binding ${binding.recordId} localIds`);
    }
  }
  const distinctReceipts = new Map(receiptFiles.map((receipt) => [receipt.path, receipt]));
  const sortedReceipts = [...distinctReceipts.values()].sort((left, right) => left.path.localeCompare(right.path));
  if (!sameJson(sortedReceipts, EXPECTED_TAXSORTED_RECEIPTS) || sortedReceipts.some((receipt) =>
      parseSafeHttps(receipt.url, `TaxSorted receipt ${receipt.path}`).hostname !== "api.taxsorted.io")) {
    throw new Error("TaxSorted nine-file receipt set drifted");
  }
  if (!sameJson(value.relatedResources, [
    {
      duplicatedContent: false,
      id: "resource:taxsorted-uk-system",
      linkedRecordIds: expectedBridgeIds,
      relationship: "independent-non-official-receipt-bound-crosswalk",
      title: "TaxSorted UK system maps",
      url: "https://taxsorted.io",
    },
    {
      duplicatedContent: false,
      id: "resource:world-commons",
      linkedRecordIds: ["companies-house", "uk-ons", "uk-small-business-desk", "uk-trade-tariff"],
      relationship: "related-jurisdiction-and-commons-context",
      title: "KINGDOM World Commons",
      url: "https://thekingdom.dev/commons.json",
    },
  ])) {
    throw new Error("UK Government Engine related-resource firewall drifted");
  }
  assertNoScalarCollapse(value);
  return value;
}

export function parseUkGovernmentEngineSnapshotBytes(bytes: Uint8Array): JsonObject {
  if (bytes.byteLength > MAX_SNAPSHOT_BYTES) throw new Error(`UK Government Engine snapshot exceeds ${MAX_SNAPSHOT_BYTES} bytes`);
  return validateUkGovernmentEngineSnapshot(parseStrictJsonBytes(bytes, "UK Government Engine snapshot"));
}

export function loadUkGovernmentEnginePublication(
  locator = UK_GOVERNMENT_ENGINE_LOCATOR,
): { snapshot: JsonObject; bytes: Uint8Array } {
  try {
    const bytes = readRegularFileWithinRoot(ROOT, locator);
    if (bytes.byteLength !== 196_005 || sha256(bytes) !== UK_GOVERNMENT_ENGINE_BYTE_SHA256) {
      throw new Error("authored snapshot byte receipt drifted");
    }
    const snapshot = parseUkGovernmentEngineSnapshotBytes(bytes);
    if (sha256(ukGovernmentEngineCanonicalJson(snapshot)) !== UK_GOVERNMENT_ENGINE_CANONICAL_SHA256) {
      throw new Error("authored snapshot canonical receipt drifted");
    }
    return { snapshot, bytes };
  } catch (error) {
    throw new Error(`UK Government Engine authored snapshot is missing or invalid: ${(error as Error).message}`);
  }
}

export function loadUkGovernmentEngineSnapshot(): JsonObject {
  return loadUkGovernmentEnginePublication().snapshot;
}

export function ukGovernmentEnginePublicSummary(snapshot = loadUkGovernmentEngineSnapshot()) {
  validateUkGovernmentEngineSnapshot(snapshot);
  const capturePaths = new Set<string>();
  for (const bridge of snapshot.externalBridges) {
    capturePaths.add(bridge.releaseLedgerReceipt.path);
    Object.values(bridge.captureReceipts).forEach((receipt: any) => capturePaths.add(receipt.path));
  }
  return {
    protocol: UK_GOVERNMENT_ENGINE_PROTOCOL,
    title: snapshot.title,
    contract_version: snapshot.contractVersion,
    publication_state: "immutable-dated-snapshot-with-mutable-alias",
    as_of: snapshot.asOf,
    jurisdiction: snapshot.jurisdiction,
    authorship: snapshot.authorship,
    freshness: snapshot.freshness,
    counts: snapshot.counts,
    evidence: {
      official_sources: "source-linked-maintainer-authorized-assisted-url-review",
      official_source_bodies_republished: false,
      exact_text_human_reviewed: false,
      taxsorted_bridge: "receipt-bound-crosswalk-only",
      taxsorted_distinct_capture_receipts: capturePaths.size,
      taxsorted_government_evidence: false,
    },
    urls: {
      ...snapshot.urls,
      schema: UK_GOVERNMENT_ENGINE_SCHEMA_URL,
    },
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

function externalLink(url: string, label: unknown, kind: "official" | "producer" | "taxsorted"): string {
  const parsed = parseSafeHttps(url, `${kind} link`);
  if (kind === "official" && !OFFICIAL_SOURCE_HOSTS.has(parsed.hostname)) throw new Error(`unapproved official link ${url}`);
  if (kind === "producer" && (parsed.hostname !== "github.com" || url !== UK_GOVERNMENT_ENGINE_PRODUCER_URL)) {
    throw new Error(`unapproved producer link ${url}`);
  }
  if (kind === "taxsorted" && url !== "https://taxsorted.io") throw new Error(`unapproved TaxSorted link ${url}`);
  return `<a href="${esc(url)}" rel="external">${esc(label)}</a>`;
}

function renderClaimSources(claim: JsonObject, sources: Map<string, JsonObject>): string {
  return `<ul class="source-links">${claim.sourceIds.map((id: string) => {
    const source = sources.get(id)!;
    return `<li>${externalLink(source.url, source.title, "official")}<span>${esc(source.publisher)} · assisted URL observation <time datetime="${esc(source.checkedOn)}">${esc(source.checkedOn)}</time></span></li>`;
  }).join("")}</ul>`;
}

function renderClaim(claim: JsonObject, sources: Map<string, JsonObject>): string {
  return `<article class="claim" id="${esc(recordAnchor(claim.id))}"><p class="tag">${esc(human(claim.claimType))} · <code>${esc(claim.id)}</code></p><p>${esc(claim.text)}</p><p class="limit"><strong>Limit:</strong> ${esc(claim.limitation)}</p><details><summary>Official source links (${claim.sourceIds.length})</summary>${renderClaimSources(claim, sources)}</details></article>`;
}

function recordAnchor(id: string): string {
  return `record-${id.replaceAll(":", "-")}`;
}

function renderRecordReferences(ids: string[], records: Map<string, JsonObject>, label: string): string {
  return `<ul class="record-refs" aria-label="${esc(label)}">${ids.map((id) => {
    const record = records.get(id)!;
    return `<li><a href="#${esc(recordAnchor(id))}"><code>${esc(id)}</code> · ${esc(record.name ?? record.title ?? record.text ?? id)}</a></li>`;
  }).join("")}</ul>`;
}

function renderFlow(flow: JsonObject, claims: Map<string, JsonObject>, bodies: Map<string, JsonObject>): string {
  return `<article class="flow" id="${esc(recordAnchor(flow.id))}"><header><p class="tag">${esc(flow.jurisdiction)} · ${flow.steps.length} finite steps · <code>${esc(flow.id)}</code></p><h3>${esc(flow.name)}</h3><p><strong>Plane IDs:</strong> ${flow.planeIds.map((id: string) => `<code>${esc(id)}</code>`).join(" · ")}</p><p><strong>Entry:</strong> ${esc(flow.entry)}</p><p><strong>Exit:</strong> ${esc(flow.exit)}</p></header><ol>${flow.steps.map((step: JsonObject) =>
    `<li><h4>${esc(step.name)}</h4><p>${esc(step.caveat)}</p><details><summary>Institutions named in this step (${step.bodyIds.length})</summary>${renderRecordReferences(step.bodyIds, bodies, "institution references")}</details><details><summary>Source-linked claims used by this step (${step.claimIds.length})</summary>${renderRecordReferences(step.claimIds, claims, "claim references")}</details></li>`).join("")}</ol></article>`;
}

function renderPlane(plane: JsonObject, claims: Map<string, JsonObject>): string {
  return `<article class="card" id="${esc(recordAnchor(plane.id))}"><p class="tag"><code>${esc(plane.id)}</code></p><h3>${esc(plane.name)}</h3><p class="question">${esc(plane.question)}</p><p>${esc(plane.description)}</p><details><summary>Claims attached to this plane (${plane.claimIds.length})</summary>${renderRecordReferences(plane.claimIds, claims, "plane claim references")}</details></article>`;
}

function renderBody(body: JsonObject, claims: Map<string, JsonObject>): string {
  return `<article class="institution" id="${esc(recordAnchor(body.id))}"><p class="tag">${esc(human(body.bodyType))} · ${esc(body.jurisdiction)}</p><h3>${esc(body.name)}</h3><p><code>${esc(body.id)}</code></p><p><strong>Plane IDs:</strong> ${body.planeIds.map((id: string) => `<code>${esc(id)}</code>`).join(" · ")}</p><details><summary>Claims attached to this institution (${body.claimIds.length})</summary>${renderRecordReferences(body.claimIds, claims, "institution claim references")}</details></article>`;
}

function renderRelation(relation: JsonObject, bodies: Map<string, JsonObject>, claims: Map<string, JsonObject>): string {
  const from = bodies.get(relation.fromId)!;
  const to = bodies.get(relation.toId)!;
  return `<article class="relation" id="${esc(recordAnchor(relation.id))}"><p class="tag"><code>${esc(relation.id)}</code></p><h3>${esc(from.name)} <span aria-hidden="true">→</span> ${esc(to.name)}</h3><p><strong>Typed relation:</strong> <code>${esc(relation.relationType)}</code></p><p><strong>Endpoints:</strong> <a href="#${esc(recordAnchor(from.id))}"><code>${esc(from.id)}</code></a> → <a href="#${esc(recordAnchor(to.id))}"><code>${esc(to.id)}</code></a></p><p><strong>Plane IDs:</strong> ${relation.planeIds.map((id: string) => `<code>${esc(id)}</code>`).join(" · ")}</p><details><summary>Claims supporting this typed edge (${relation.claimIds.length})</summary>${renderRecordReferences(relation.claimIds, claims, "relation claim references")}</details></article>`;
}

function renderRail(rail: JsonObject, bodies: Map<string, JsonObject>, claims: Map<string, JsonObject>): string {
  return `<article class="card" id="${esc(recordAnchor(rail.id))}"><p class="tag">${esc(human(rail.railType))} · <code>${esc(rail.id)}</code></p><h3>${esc(rail.name)}</h3><p>${esc(rail.description)}</p><p class="limit"><strong>Authority boundary:</strong> ${esc(rail.authorityBoundary)}</p><details><summary>Institutions on this rail (${rail.bodyIds.length})</summary>${renderRecordReferences(rail.bodyIds, bodies, "rail institution references")}</details><details><summary>Claims attached to this rail (${rail.claimIds.length})</summary>${renderRecordReferences(rail.claimIds, claims, "rail claim references")}</details></article>`;
}

function renderRedressRoute(route: JsonObject, bodies: Map<string, JsonObject>, claims: Map<string, JsonObject>): string {
  const effects = ["automaticEscalation", "deadlineCalculated", "eligibilityDetermined", "legalAdvice"];
  return `<article class="route" id="${esc(recordAnchor(route.id))}"><p class="tag">${esc(human(route.routeType))} · ${esc(route.jurisdiction)}</p><h3>${esc(route.name)}</h3><p><code>${esc(route.id)}</code></p><p>${externalLink(route.startUrl, "Open the official start page", "official")}</p><p><strong>Prerequisites shown by the map:</strong> ${esc(route.prerequisites.join(" · "))}</p><p class="limit"><strong>Deadline rule:</strong> ${esc(route.deadlineRule)}</p><details><summary>Institutions named by this route (${route.bodyIds.length})</summary>${renderRecordReferences(route.bodyIds, bodies, "redress institution references")}</details><details><summary>Claims attached to this route (${route.claimIds.length})</summary>${renderRecordReferences(route.claimIds, claims, "redress claim references")}</details><ul aria-label="route negative effects">${effects.map((key) => `<li><code>${esc(key)}</code>: ${esc(route[key])}</li>`).join("")}</ul></article>`;
}

function renderUnknown(unknown: JsonObject, sources: Map<string, JsonObject>): string {
  return `<article class="unknown" id="${esc(recordAnchor(unknown.id))}"><p class="tag">${esc(unknown.scope)}</p><h3>${esc(unknown.question)}</h3><p><code>${esc(unknown.id)}</code></p><p>${esc(unknown.reason)}</p><p class="limit"><strong>Review trigger:</strong> ${esc(unknown.reviewTrigger)}</p><details><summary>Official source links bearing on this unknown (${unknown.sourceIds.length})</summary>${renderRecordReferences(unknown.sourceIds, sources, "unknown source references")}</details></article>`;
}

function renderSource(source: JsonObject): string {
  return `<article class="source" id="${esc(recordAnchor(source.id))}"><div><p class="tag">${esc(human(source.sourceClass))}</p><p><code>${esc(source.id)}</code></p>${externalLink(source.url, source.title, "official")}<p class="muted">${esc(source.publisher)} · ${esc(source.jurisdiction)} · assisted URL observation <time datetime="${esc(source.checkedOn)}">${esc(source.checkedOn)}</time></p></div><div><p><strong>Status caveat:</strong> ${esc(source.statusCaveat)}</p><details><summary>What this URL observation does not prove</summary><ul>${source.doesNotProve.map((limit: string) => `<li>${esc(limit)}</li>`).join("")}</ul><p><code>exactTextHumanReviewed</code>: false · <code>rawBodyRetained</code>: false · <code>contentReceipt</code>: null · <code>publicationMode</code>: link-only</p></details></div></article>`;
}

function renderBridge(
  bridge: JsonObject,
  records: Map<string, JsonObject>,
): string {
  return `<article class="bridge" id="${esc(recordAnchor(bridge.id))}"><p class="tag">${esc(bridge.bridgeMode)} · <code>${esc(bridge.id)}</code></p><h3>${esc(bridge.datasetId)}</h3><p><strong>Related-resource ID:</strong> <a href="#${esc(recordAnchor(bridge.resourceId))}"><code>${esc(bridge.resourceId)}</code></a></p><p>Captured version <strong>${esc(bridge.provenance.version)}</strong> on <time datetime="${esc(bridge.provenance.acquiredOn)}">${esc(bridge.provenance.acquiredOn)}</time>; ${bridge.selectedRecordBindings.length} selected crosswalk bindings. ${bridge.sourceFreshnessAtCapture.pastReviewAfterCount} of ${bridge.sourceFreshnessAtCapture.totalSourceRecords} upstream locator records were already past their declared review-after date.</p><p class="limit">No publisher authentication, truth proof, availability guarantee, signature, full provider-schema validation, official status, government evidence, endorsement, runtime transfer or upstream rights grant is inferred.</p><details><summary>Selected record-ID crosswalks (${bridge.selectedRecordBindings.length})</summary><ol>${bridge.selectedRecordBindings.map((binding: JsonObject) => `<li><p><code>${esc(binding.collection)}:${esc(binding.recordId)}</code></p><p>${esc(binding.purpose)}</p>${renderRecordReferences(binding.localIds, records, "local Government Engine references")}</li>`).join("")}</ol></details><details><summary>Bridge capability boundary</summary><ul>${Object.keys(bridge.boundaries).sort().map((key) => `<li><code>${esc(key)}</code>: false</li>`).join("")}</ul></details></article>`;
}

function renderRelatedResource(resource: JsonObject, records: Map<string, JsonObject>): string {
  const linked = resource.id === "resource:taxsorted-uk-system"
    ? renderRecordReferences(resource.linkedRecordIds, records, "linked Government Engine bridge records")
    : `<ul aria-label="linked World Commons record IDs">${resource.linkedRecordIds.map((id: string) => `<li><code>${esc(id)}</code></li>`).join("")}</ul>`;
  const link = resource.url === "https://taxsorted.io"
    ? externalLink(resource.url, resource.title, "taxsorted")
    : `<a href="/commons.json">${esc(resource.title)}</a>`;
  return `<article class="card" id="${esc(recordAnchor(resource.id))}"><p class="tag"><code>${esc(resource.id)}</code></p><h3>${link}</h3><p><strong>Relationship:</strong> <code>${esc(resource.relationship)}</code></p><p><code>duplicatedContent</code>: ${esc(resource.duplicatedContent)}</p>${linked}</article>`;
}

function renderReceipt(receipt: JsonObject): string {
  return `<li><code>${esc(receipt.path)}</code><span>${esc(receipt.bytes)} bytes</span><code>${esc(receipt.sha256)}</code></li>`;
}

export function renderUkGovernmentEngineHtml(snapshot = loadUkGovernmentEngineSnapshot()): string {
  validateUkGovernmentEngineSnapshot(snapshot);
  const summary = ukGovernmentEnginePublicSummary(snapshot);
  const sources = new Map<string, JsonObject>(snapshot.sources.map((source: JsonObject) => [source.id, source]));
  const claims = new Map<string, JsonObject>(snapshot.claims.map((claim: JsonObject) => [claim.id, claim]));
  const bodies = new Map<string, JsonObject>(snapshot.bodies.map((body: JsonObject) => [body.id, body]));
  const records = new Map<string, JsonObject>([
    ...snapshot.planes,
    ...snapshot.sources,
    ...snapshot.claims,
    ...snapshot.bodies,
    ...snapshot.relations,
    ...snapshot.flows,
    ...snapshot.rails,
    ...snapshot.redressRoutes,
    ...snapshot.unknowns,
    ...snapshot.externalBridges,
    ...snapshot.relatedResources,
  ].map((record: JsonObject) => [record.id, record]));
  const captureReceipts = new Map<string, JsonObject>();
  for (const bridge of snapshot.externalBridges) {
    captureReceipts.set(bridge.releaseLedgerReceipt.path, bridge.releaseLedgerReceipt);
    Object.values(bridge.captureReceipts).forEach((receipt: any) => captureReceipts.set(receipt.path, receipt));
  }
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="An independent, dated and read-only atlas of selected UK government authority, law, money, delivery, scrutiny and remedy routes.">
  <title>UK Government Engine · The Kingdom</title>
  <link rel="canonical" href="/government-engine/">
  <link rel="alternate" href="/government.json" type="application/json" title="Mutable alias for the dated UK Government Engine snapshot">
  <link rel="alternate" href="/government/uk-government-engine-2026-08-21.json" type="application/json" title="Immutable dated UK Government Engine snapshot">
  <link rel="describedby" href="/government/schemas/v0.1/public-snapshot.schema.json" type="application/schema+json" title="UK Government Engine public snapshot schema">
  <link rel="service-doc" href="/UK-GOVERNMENT-ENGINE-v0.1.md" type="text/markdown" title="UK Government Engine guide">
  <style>
    :root{color-scheme:light dark;--paper:#f4f0e8;--ink:#171a20;--muted:#5e6470;--line:#b8b1a5;--panel:#fffaf1;--blue:#285a74;--gold:#9b6818;--red:#8a3d37;--green:#27664b}@media(prefers-color-scheme:dark){:root{--paper:#0b1117;--ink:#edf1f4;--muted:#aab3bd;--line:#35424d;--panel:#111b24;--blue:#8ac6df;--gold:#e7be6d;--red:#efaaa4;--green:#86d2ad}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.62 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--blue);text-underline-offset:.2em}a:focus-visible,summary:focus-visible{outline:3px solid var(--gold);outline-offset:4px;border-radius:3px}.skip{position:absolute;left:12px;top:-100px;background:var(--ink);color:var(--paper);padding:10px 14px;z-index:20}.skip:focus{top:12px}.shell{width:min(1180px,calc(100% - 32px));margin:auto}.top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;padding:20px 0;border-bottom:1px solid var(--line)}.top span{display:flex;flex-wrap:wrap;gap:14px}.hero{padding:clamp(42px,8vw,90px) 0 44px}.kicker,.tag{text-transform:uppercase;letter-spacing:.11em;font-size:.74rem;font-weight:760;color:var(--gold)}h1,h2,h3{font-family:ui-serif,Georgia,serif;line-height:1.08}h1{font-size:clamp(3.1rem,9vw,7.3rem);max-width:950px;margin:.16em 0}.lead{font-size:clamp(1.15rem,2.4vw,1.55rem);max-width:940px}.truth{max-width:1000px;border:2px solid var(--gold);background:var(--panel);padding:18px 22px;border-radius:12px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:28px 0}.stats div,.card,.flow,.route,.source,.bridge,.unknown,.institution,.relation{border:1px solid var(--line);background:var(--panel);border-radius:12px;padding:16px}.stats b{display:block;font:700 1.9rem ui-serif,Georgia,serif}.stats span,.muted,.source span{color:var(--muted);font-size:.88rem}.section{padding:34px 0;border-top:1px solid var(--line)}.section>header{max-width:880px;margin-bottom:22px}.section h2{font-size:clamp(2rem,5vw,3.7rem);margin:.1em 0}.grid,.record-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.record-grid{align-items:start}.card h3,.route h3,.unknown h3,.institution h3,.relation h3{margin:.15em 0}.question{font-weight:700;color:var(--green)}.flow{margin:16px 0;padding:clamp(18px,4vw,34px)}.flow>ol{padding-left:1.5rem}.flow>ol>li{padding:12px 0 22px 10px;border-bottom:1px solid var(--line)}.flow h4{font-size:1.1rem;margin:.2em 0}.record-refs{padding-left:1.2rem}.record-refs li{margin:.35em 0}.claim{border-left:3px solid var(--blue);padding:9px 13px;margin:10px 0;background:color-mix(in srgb,var(--panel) 88%,var(--blue) 12%)}.claim p{margin:.35em 0}.limit{color:var(--muted)}summary{cursor:pointer;font-weight:700;padding:8px 0}.source-links{padding-left:1.2rem}.source-links li{margin:8px 0}.source-links span{display:block;color:var(--muted);font-size:.8rem}.routes{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.route{border-left:4px solid var(--red)}.warning{border-left:4px solid var(--red);padding:12px 16px;background:var(--panel)}.sources{display:grid;gap:8px}.source{display:grid;grid-template-columns:minmax(220px,1fr) 2fr;gap:12px}.source p{margin:.15em 0}.bridges{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bridge{border-color:var(--gold)}.receipts{list-style:none;padding:0}.receipts li{display:grid;gap:3px;border-top:1px solid var(--line);padding:10px 0}.receipts code{overflow-wrap:anywhere;font-size:.77rem}.negative{columns:2}.footer{padding:40px 0 60px;color:var(--muted)}code{overflow-wrap:anywhere}@media(max-width:850px){.grid,.record-grid,.bridges{grid-template-columns:repeat(2,1fr)}.source{grid-template-columns:1fr}}@media(max-width:620px){.stats,.grid,.record-grid,.routes,.bridges{grid-template-columns:1fr}.negative{columns:1}.top{display:block}.top span{margin-top:10px}h1{font-size:clamp(3rem,17vw,5.4rem)}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media(forced-colors:active){.truth,.stats div,.card,.flow,.route,.source,.bridge,.unknown,.claim,.institution,.relation{border:1px solid CanvasText}.claim,.route,.warning{border-left:4px solid CanvasText}}
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to UK Government Engine content</a>
  <nav class="shell top" aria-label="Kingdom navigation"><a href="/">← The Kingdom</a><span><a href="/government.json">mutable JSON alias</a><a href="/government/uk-government-engine-2026-08-21.json">dated immutable JSON</a><a href="/UK-GOVERNMENT-ENGINE-v0.1.md">guide</a></span></nav>
  <main class="shell" id="main" tabindex="-1">
    <header class="hero"><p class="kicker">Independent institutional atlas · ${esc(summary.protocol)}</p><h1>UK Government<br>Engine</h1><p class="lead">Follow how a vote becomes authority, authority becomes law and money, money becomes service, and a decision can return through scrutiny or remedy.</p><p class="truth"><strong>This is an independent atlas from a maintainer-authorized assisted URL review as of <time datetime="${esc(snapshot.asOf)}">${esc(snapshot.asOf)}</time>; exact record and claim text has not been separately human-reviewed.</strong> It is not government, official, complete, automatically current, legal or tax advice, an eligibility or liability decision, a filing or payment facility, an account surface, or a control plane.</p><div class="stats"><div><b>${summary.counts.planes}</b><span>separately typed planes</span></div><div><b>${summary.counts.sources}</b><span>official link-only sources</span></div><div><b>${summary.counts.flows}</b><span>finite explanatory flows</span></div><div><b>${summary.counts.redressRoutes}</b><span>typed redress start doors</span></div></div></header>

    <section class="section" aria-labelledby="planes"><header><p class="tag">The map</p><h2 id="planes">Six planes that do not collapse into one another</h2><p>Authority, jurisdiction, law, public money, delivery and remedy answer different questions. A connection records a reviewed orientation path, not a live determination.</p></header><div class="grid">${snapshot.planes.map((plane: JsonObject) => renderPlane(plane, claims)).join("")}</div></section>

    <section class="section" aria-labelledby="institutions"><header><p class="tag">Institutions</p><h2 id="institutions">Thirty-nine named bodies</h2><p>Each body record exposes its stable ID, type, jurisdiction, planes and claim references. Inclusion records a role in this dated atlas; it does not imply endorsement, supremacy or generic control over another institution.</p></header><div class="record-grid">${snapshot.bodies.map((body: JsonObject) => renderBody(body, claims)).join("")}</div></section>

    <section class="section" aria-labelledby="relations"><header><p class="tag">Typed connections</p><h2 id="relations">Thirty-four institutional relations</h2><p>Every edge is explicitly typed and source-linked. These edges are not a single hierarchy or chain of command, and they do not imply a general control relationship beyond the stated relation type.</p></header><div class="record-grid">${snapshot.relations.map((relation: JsonObject) => renderRelation(relation, bodies, claims)).join("")}</div></section>

    <section class="section" aria-labelledby="flows"><header><p class="tag">Transformation paths</p><h2 id="flows">Ten finite flows</h2><p>Each step names its institution IDs and names, its caveat, and the source-linked claim IDs used to describe it. Every flow stops before a personal fact, current rate, discretionary judgment, eligibility decision or transaction would be required.</p></header>${snapshot.flows.map((flow: JsonObject) => renderFlow(flow, claims, bodies)).join("")}</section>

    <section class="section" aria-labelledby="rails"><header><p class="tag">Typed infrastructure</p><h2 id="rails">Eleven rails</h2><p>A service rail cannot mint legal authority; a payment rail cannot create liability or spending power; an oversight rail is not an operational account.</p></header><div class="grid">${snapshot.rails.map((rail: JsonObject) => renderRail(rail, bodies, claims)).join("")}</div></section>

    <section class="section" aria-labelledby="redress"><header><p class="tag">Return paths</p><h2 id="redress">Redress is typed, not automatic</h2><p class="warning"><strong>These routes are alternatives, not a universal escalation ladder.</strong> This atlas calculates no deadline and determines no eligibility. A complaint may not protect an appeal deadline. Check the exact notice and current official procedure.</p></header><div class="routes">${snapshot.redressRoutes.map((route: JsonObject) => renderRedressRoute(route, bodies, claims)).join("")}</div></section>

    <section class="section" aria-labelledby="unknowns"><header><p class="tag">Visible limits</p><h2 id="unknowns">Ten questions the map does not answer</h2><p>Unknown is a first-class state here. It is not silently converted into a guess, a recommendation or a default route.</p></header><div class="grid">${snapshot.unknowns.map((unknown: JsonObject) => renderUnknown(unknown, sources)).join("")}</div></section>

    <section class="section" aria-labelledby="claims"><header><p class="tag">Claim and evidence ledger</p><h2 id="claims">All fifty-eight bounded claims</h2><p>Every claim record appears once with its stable ID, exact publication text, explicit limitation and official source links. The text comes from a maintainer-authorized assisted publication and has not been separately human-reviewed; a linked URL is not an exact-body receipt.</p></header>${snapshot.claims.map((claim: JsonObject) => renderClaim(claim, sources)).join("")}</section>

    <section class="section" aria-labelledby="sources"><header><p class="tag">Evidence contract</p><h2 id="sources">Official sources are links, not receipts</h2><p>All ${snapshot.sources.length} source records are maintainer-authorized assisted URL observations dated <time datetime="${esc(snapshot.asOf)}">${esc(snapshot.asOf)}</time>. No official response body or raw hash is retained here; link presence does not prove current legal effect, completeness, continued availability or endorsement.</p></header><div class="sources">${snapshot.sources.map((source: JsonObject) => renderSource(source)).join("")}</div></section>

    <section class="section" aria-labelledby="crosswalk"><header><p class="tag">External bridge firewall</p><h2 id="crosswalk">TaxSorted is receipt-bound and non-official</h2><p><strong>${externalLink("https://taxsorted.io", "TaxSorted", "taxsorted")} is an independent external crosswalk, not government evidence.</strong> Exact retained captures bind selected TaxSorted record IDs to local map IDs without projecting TaxSorted record text into government claims. There is no runtime dependency, API call, query prefill, user-data transfer, affiliation or endorsement.</p></header><div class="bridges">${snapshot.externalBridges.map((bridge: JsonObject) => renderBridge(bridge, records)).join("")}</div><details><summary>Nine distinct retained capture receipts (paths, byte lengths and hashes only)</summary><ul class="receipts">${[...captureReceipts.values()].sort((left, right) => left.path.localeCompare(right.path)).map(renderReceipt).join("")}</ul></details></section>

    <section class="section" aria-labelledby="related"><header><p class="tag">Bounded adjacencies</p><h2 id="related">Two related resources</h2><p>These links preserve explicit relationships without copying their content or treating an adjacent project as official authority.</p></header><div class="grid">${snapshot.relatedResources.map((resource: JsonObject) => renderRelatedResource(resource, records)).join("")}</div></section>

    <section class="section" aria-labelledby="boundary"><header><p class="tag">Negative authority</p><h2 id="boundary">What this surface cannot do</h2><p>The public schema keeps every capability below false. The page has no JavaScript, form, input, button, iframe, credential path, request body, account session or automatic action.</p></header><ul class="negative">${Object.keys(snapshot.boundaries).sort().map((key) => `<li><code>${esc(key)}</code>: false</li>`).join("")}</ul><p>Inspect the <a href="/government.json">mutable alias of this dated publication</a>, <a href="/government/uk-government-engine-2026-08-21.json">immutable snapshot</a>, <a href="/government/schemas/v0.1/public-snapshot.schema.json">closed schema</a>, and <a href="/UK-GOVERNMENT-ENGINE-v0.1.md">source and boundary guide</a>.</p></section>
  </main>
  <footer class="shell footer">Dated <time datetime="${esc(snapshot.asOf)}">${esc(snapshot.asOf)}</time> · next scheduled review <time datetime="${esc(snapshot.freshness.nextReviewDue)}">${esc(snapshot.freshness.nextReviewDue)}</time> · exact text separately human-reviewed: <strong>${esc(snapshot.authorship.exactTextHumanReviewed)}</strong> · <a href="${esc(UK_GOVERNMENT_ENGINE_PRODUCER_URL)}" rel="external">producer v0.1.0 source</a> · public visibility is not authority or a reuse grant.</footer>
</body>
</html>\n`;
}
