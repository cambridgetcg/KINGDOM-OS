#!/usr/bin/env bun
/**
 * Exact, network-free wrapper for the frozen Loops, Locks & Freedom Relations
 * Atlas triplet.
 *
 * The producer owns the three immutable bytes. This wrapper verifies their
 * independently reviewed receipts and constitutional boundary before exposing
 * one small, read-only discovery projection. It is not a model, training loop,
 * score, credential surface, access decision, runtime, or action authority.
 */

import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readRegularFileWithinRoot } from "./immutable-publications.ts";
import {
  canonicalizePrincipalityValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PROTOCOL =
  "kingdom.loops-locks-freedom-relations/0.1";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_ID =
  "kingdom-loops-locks-freedom-relations-atlas-2026-08-28";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_AS_OF = "2026-08-28";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_TITLE =
  "KINGDOM Loops, Locks & Freedom Relations Atlas — Phase 0";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LIFECYCLE =
  "FROZEN_STATIC_FIXTURE";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_RELEASE_STATE =
  "FROZEN_FOR_IMMUTABLE_HANDOFF";

export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCATOR =
  "public/atlases/loops-locks-freedom-relations-atlas-2026-08-28.json";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCATOR =
  "public/schemas/loops-locks-freedom-relations-atlas/0.1.json";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LOCATOR =
  "public/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md";

export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCAL_PATH =
  join(ROOT, LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCATOR);
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCAL_PATH =
  join(ROOT, LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCATOR);
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LOCAL_PATH =
  join(ROOT, LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LOCATOR);

export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH =
  "/atlases/loops-locks-freedom-relations-atlas-2026-08-28.json";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH =
  "/schemas/loops-locks-freedom-relations-atlas/0.1.json";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH =
  "/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md";

export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_URL =
  `https://thekingdom.dev${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH}`;
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_URL =
  `https://thekingdom.dev${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH}`;
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_URL =
  `https://thekingdom.dev${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH}`;

export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_BYTE_SHA256 =
  "029221e1e39273de5b5f2cb1026f66ec21e5be42145e74fc4f5bfe60df155077";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_BYTE_SHA256 =
  "9c6ea5c3db37b0c42ec34831a917b465adcf9ca7b8915c6124e44ad32628d475";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_BYTE_SHA256 =
  "d7c67a3e97fbcdcf23b85835fced2b6f7a290ca5e8a44243bec6f9006a6e8128";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_REVIEW_CORE_SHA256 =
  "d0ebf30fc83e7716d20326f8f0a8fe348e4dbfa83f75471b16ddfbbb5ac01335";
export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SEMANTIC_PAYLOAD_SHA256 =
  "49a1b4f31a5223cc931e978a03ed08e441ceae03b872f4619cc4ba6a084b32b2";

export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE = Object.freeze({
  tag: "https://github.com/cambridgetcg/kingdom-loops-locks-freedom-relations-atlas/tree/v0.1.1",
  revision: "d8534096224d9e82825653af0f9e12fd123e85b5",
  relation: "SITE_AUTHORED_PINNED_SOURCE_LOCATOR",
  establishesTruth: false,
  importsAuthority: false,
  runtimeDependency: false,
  currentnessClaim: false,
});

export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS = Object.freeze([
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH,
] as const);

export const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS = Object.freeze([
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_URL,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_URL,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_URL,
] as const);

const FROZEN_FILES = Object.freeze([
  {
    label: "Loops, Locks & Freedom Relations Atlas",
    locator: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCATOR,
    bytes: 200_064,
    sha256: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_BYTE_SHA256,
  },
  {
    label: "Loops, Locks & Freedom Relations Atlas schema",
    locator: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCATOR,
    bytes: 58_486,
    sha256: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_BYTE_SHA256,
  },
  {
    label: "Loops, Locks & Freedom Relations Atlas guide",
    locator: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LOCATOR,
    bytes: 16_519,
    sha256: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_BYTE_SHA256,
  },
] as const);

const EXPECTED_COUNTS = Object.freeze({
  conversions: 5,
  equationCards: 15,
  freedomRelevantEnvelopes: 2,
  governanceFixtures: 18,
  kingdomSemanticOrientations: 9,
  lanes: 14,
  lockKinds: 6,
  mathematicalFixtures: 13,
  nonEquivalences: 55,
  sourceBindings: 17,
  syntheticFixtures: 31,
  terms: 15,
});

const SCOPE_FALSE_KEYS = Object.freeze([
  "accessDecision", "alignmentScore", "authenticationAdapter",
  "authorizationAdapter", "automaticAction", "behavioralDiagnosis",
  "censorship", "communityScore", "consciousnessInference",
  "controlActuation", "credentials", "enforcementAdapter", "freedomScore",
  "humanTraining", "intentInference", "keyGeneration", "liveObservation",
  "liveOptimization", "lockStrengthScore", "mcp", "moralScore", "network",
  "personScore", "personalData", "policyDeployment", "privateKeys",
  "punishmentRecommendation", "realPeople", "recommendation",
  "reinforcementScore", "rewardRuntime", "runtimeAgent", "unconstrainedAction",
] as const);

const LOCK_KIND_IDS = Object.freeze([
  "TECHNICAL_CAPABILITY_GUARD",
  "CRYPTOGRAPHIC_TRANSFORM_LOCK",
  "POLICY_DENY_LOCK",
  "PHYSICAL_CONSTRAINT_LABEL",
  "METAPHORICAL_LOCK_LABEL",
  "DEPENDENCY_LOCK_IN",
] as const);

const KEY_KIND_IDS = Object.freeze([
  "SIGNING_PRIVATE_KEY_SYMBOL",
  "VERIFICATION_PUBLIC_KEY_SYMBOL",
  "DECRYPTION_KEY_SYMBOL",
  "AUTHENTICATOR_SECRET_REFERENCE",
] as const);

const SECTION_SHA256 = Object.freeze({
  counts: "adfae692389cdcf267fea314087ae1f40b4e09ccf73107e8b3479e39c9135825",
  scope: "bfe7662b254e06870ad2562703da95a8ec187a42c746f11af3cff451235f3bc4",
  locks: "36164e65789c71f528e1653f884abb84255c10a1b70164ebc9d68a47d7dc993a",
  keys: "2960eab018acd4ad28e024a4d668b8fee2ec613bdaec16fb56d0d0d7c7bf6437",
  nonEquivalences: "327d05c3f497b2321cecf63ba60c1148505e65875a25ba643ee931d5819fe36a",
  generatorInputReceipts: "ee2c529b51d4804c5d6797a44fb4d870bc7da232ded2fcee4766fc044b1b6516",
  orientations: "d63e305b3e55d059f849e6a04b35ce4f85330389c015bff4a4765d93ecbfdf74",
  constitutionalBoundaries: "4df726ab8325773036ca813ca1415c98930ce7e1970da3240df2c7709a912dec",
});

type JsonObject = Record<string, any>;

function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameKeys(value: JsonObject, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index]);
}

function sameJson(left: unknown, right: unknown): boolean {
  return canonicalizePrincipalityValue(left) === canonicalizePrincipalityValue(right);
}

function canonicalSha256(value: unknown): string {
  return createHash("sha256")
    .update(canonicalizePrincipalityValue(value))
    .digest("hex");
}

function readFrozenFile(
  file: typeof FROZEN_FILES[number],
  sourceRoot: string,
): Buffer {
  const bytes = readRegularFileWithinRoot(sourceRoot, file.locator);
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== file.bytes || digest !== file.sha256) {
    throw new Error(`${file.label} no longer matches its independently reviewed byte receipt`);
  }
  return bytes;
}

function assertFrozenIdentity(value: unknown): asserts value is JsonObject {
  try {
    if (!object(value) || !sameKeys(value, [
      "$schema", "artifact", "buildReceipt", "constitutionalBoundaries",
      "conversionRegister", "counts", "equationCards", "freedomRelevantEnvelopes",
      "kingdomSemanticOrientations", "nonEquivalences", "protocol", "publicHandoff",
      "scope", "sourceBindings", "syntheticFixtures", "vocabularies",
    ])) throw new Error("shape");
    if (value.$schema !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_URL ||
        value.protocol !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PROTOCOL ||
        !object(value.artifact) ||
        !sameKeys(value.artifact, [
          "asOf", "authorship", "id", "immutableCandidate", "lifecyclePhase",
          "releaseState", "synthetic", "title",
        ]) || value.artifact.id !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_ID ||
        value.artifact.title !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_TITLE ||
        value.artifact.asOf !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_AS_OF ||
        value.artifact.lifecyclePhase !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LIFECYCLE ||
        value.artifact.releaseState !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_RELEASE_STATE ||
        value.artifact.synthetic !== true || value.artifact.immutableCandidate !== true) {
      throw new Error("identity");
    }

    const authorship = value.artifact.authorship;
    if (!object(authorship) || !sameKeys(authorship, [
      "assistanceDisclosure", "humanDirected", "humanReviewCompleted",
      "independentModelReviewCompleted", "modelAssisted", "releaseGateSatisfied",
      "userPublicationPermissionRecorded",
    ]) || authorship.humanDirected !== true || authorship.modelAssisted !== true ||
        authorship.independentModelReviewCompleted !== true ||
        authorship.humanReviewCompleted !== false ||
        authorship.releaseGateSatisfied !== true ||
        authorship.userPublicationPermissionRecorded !== true) {
      throw new Error("authorship");
    }

    if (!object(value.scope) ||
        !sameKeys(value.scope, ["staticArtifact", "syntheticOnly", ...SCOPE_FALSE_KEYS]) ||
        canonicalSha256(value.scope) !== SECTION_SHA256.scope ||
        value.scope.staticArtifact !== true || value.scope.syntheticOnly !== true ||
        SCOPE_FALSE_KEYS.some((key) => value.scope[key] !== false)) {
      throw new Error("scope");
    }

    if (!sameJson(value.counts, EXPECTED_COUNTS) ||
        canonicalSha256(value.counts) !== SECTION_SHA256.counts ||
        !Array.isArray(value.conversionRegister) || value.conversionRegister.length !== 5 ||
        !Array.isArray(value.equationCards) || value.equationCards.length !== 15 ||
        !Array.isArray(value.freedomRelevantEnvelopes) ||
          value.freedomRelevantEnvelopes.length !== 2 ||
        !Array.isArray(value.kingdomSemanticOrientations) ||
          value.kingdomSemanticOrientations.length !== 9 ||
        !Array.isArray(value.nonEquivalences) || value.nonEquivalences.length !== 55 ||
        !Array.isArray(value.sourceBindings) || value.sourceBindings.length !== 17 ||
        !Array.isArray(value.syntheticFixtures) || value.syntheticFixtures.length !== 31 ||
        value.syntheticFixtures.filter((entry: any) => entry?.kind === "GOVERNANCE").length !== 18 ||
        value.syntheticFixtures.filter((entry: any) => entry?.kind === "MATHEMATICAL").length !== 13 ||
        !object(value.vocabularies) || !Array.isArray(value.vocabularies.lanes) ||
        value.vocabularies.lanes.length !== 14 || !Array.isArray(value.vocabularies.terms) ||
        value.vocabularies.terms.length !== 15) {
      throw new Error("counts");
    }

    if (!Array.isArray(value.vocabularies.lockKinds) ||
        canonicalSha256(value.vocabularies.lockKinds) !== SECTION_SHA256.locks ||
        !sameJson(value.vocabularies.lockKinds.map((entry: any) => entry?.id), LOCK_KIND_IDS) ||
        value.vocabularies.lockKinds.some((entry: any) => !object(entry) ||
          entry.containsMechanism !== false || entry.executable !== false) ||
        !Array.isArray(value.vocabularies.keyAndAuthenticatorKinds) ||
        canonicalSha256(value.vocabularies.keyAndAuthenticatorKinds) !== SECTION_SHA256.keys ||
        !sameJson(value.vocabularies.keyAndAuthenticatorKinds.map((entry: any) => entry?.id), KEY_KIND_IDS) ||
        value.vocabularies.keyAndAuthenticatorKinds.some((entry: any) => !object(entry) ||
          entry.containsMaterial !== false || entry.executable !== false)) {
      throw new Error("locks-or-keys");
    }

    if (canonicalSha256(value.nonEquivalences) !== SECTION_SHA256.nonEquivalences ||
        value.nonEquivalences.some((entry: any) => !object(entry) ||
          entry.relation !== "NON_EQUIVALENT" || !Array.isArray(entry.declaredAssumptions) ||
          entry.declaredAssumptions.length === 0 || !Array.isArray(entry.informationLost) ||
          entry.informationLost.length === 0 || !Array.isArray(entry.fixtureIds) ||
          entry.fixtureIds.length === 0)) {
      throw new Error("non-equivalences");
    }

    const sourceFalseKeys = [
      "copiesContent", "endorsementClaimed", "establishesCompliance",
      "establishesCurrentness", "establishesTruth", "importsAuthority",
    ];
    if (value.sourceBindings.some((entry: any) => !object(entry) ||
        entry.use !== "LINK_ONLY_ORIENTATION" ||
        sourceFalseKeys.some((key) => entry[key] !== false))) {
      throw new Error("sources");
    }

    if (canonicalSha256(value.kingdomSemanticOrientations) !== SECTION_SHA256.orientations ||
        value.kingdomSemanticOrientations.some((entry: any) => !object(entry) ||
          entry.repository !== "cambridgetcg/KINGDOM-OS" ||
          entry.baseCommit !== "9b07ac26da03cac79709437aeea3f53b808321e1" ||
          entry.baseTree !== "d99577d666551e605271ead5c49482213347c071" ||
          entry.copiesContent !== false || entry.importsAuthority !== false ||
          entry.establishesTruth !== false || entry.runtimeDependency !== false ||
          entry.hasDirectPublicRoute !== (entry.publicRoute !== "NONE"))) {
      throw new Error("orientations");
    }

    if (value.syntheticFixtures.some((entry: any) => !object(entry) ||
        entry.synthetic !== true || entry.executableAction !== false ||
        entry.humanSubjects !== false)) {
      throw new Error("fixtures");
    }

    const boundaries = value.constitutionalBoundaries;
    if (!object(boundaries) || canonicalSha256(boundaries) !==
        SECTION_SHA256.constitutionalBoundaries || !sameKeys(boundaries, [
      "assertions", "declaredRightsRegister", "forbiddenCapabilities",
      "forbiddenFieldNames", "freedomFoundation", "lifecycle",
      "nonCompensableFloors", "precedence",
    ]) || !object(boundaries.lifecycle) ||
        boundaries.lifecycle.activeRuntimeAllowed !== false ||
        boundaries.lifecycle.current !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LIFECYCLE ||
        !Array.isArray(boundaries.declaredRightsRegister) ||
        boundaries.declaredRightsRegister.length !== 3 ||
        boundaries.declaredRightsRegister.some((entry: any) => !object(entry) ||
          entry.legalAuthority !== false ||
          entry.applicabilityToRealCaseDetermined !== false)) {
      throw new Error("constitution");
    }

    const handoff = value.publicHandoff;
    const expectedRoutes = [
      { absoluteUrl: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_URL, immutable: true, mimeType: "application/json; charset=utf-8", role: "CANONICAL_RECORD", route: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH },
      { absoluteUrl: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_URL, immutable: true, mimeType: "application/json; charset=utf-8", role: "CLOSED_SCHEMA", route: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH },
      { absoluteUrl: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_URL, immutable: true, mimeType: "text/markdown; charset=utf-8", role: "ACCESSIBLE_LINEAR_GUIDE", route: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH },
    ];
    if (!object(handoff) || !sameKeys(handoff, [
      "currentState", "mutableAlias", "page", "publicationAuthorized",
      "reviewGate", "routes", "runtime",
    ]) || handoff.currentState !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_RELEASE_STATE ||
        handoff.mutableAlias !== false || handoff.page !== false || handoff.runtime !== false ||
        handoff.publicationAuthorized !== true ||
        handoff.reviewGate !== "INDEPENDENT_MODEL_GREEN_AND_RELEASE_OWNER_EXACT_BYTE_CONFIRMATION" ||
        !sameJson(handoff.routes, expectedRoutes)) {
      throw new Error("handoff");
    }

    const receipt = value.buildReceipt;
    if (!object(receipt) || !sameKeys(receipt, [
      "arithmetic", "clockRead", "externalInputUsed", "generatorInputReceipts",
      "networkUsed", "semanticPayloadSha256", "verifiedFixtureCount", "verifierState",
    ]) || receipt.arithmetic !== "EXACT_BOUNDED_BIGINT_RATIONAL_AND_FINITE_SYMBOLIC_RULES" ||
        receipt.clockRead !== false || receipt.externalInputUsed !== false ||
        receipt.networkUsed !== false || receipt.verifiedFixtureCount !== 31 ||
        receipt.verifierState !== "ALL_STATIC_SYNTHETIC_FIXTURES_RECOMPUTED" ||
        receipt.semanticPayloadSha256 !==
          `sha256:${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SEMANTIC_PAYLOAD_SHA256}` ||
        canonicalSha256(receipt.generatorInputReceipts) !==
          SECTION_SHA256.generatorInputReceipts) {
      throw new Error("build-receipt");
    }

    const semanticPayload = structuredClone(value);
    delete semanticPayload.buildReceipt;
    if (canonicalSha256(semanticPayload) !==
        LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SEMANTIC_PAYLOAD_SHA256) {
      throw new Error("semantic-payload");
    }

    const reviewCore = structuredClone(value);
    delete reviewCore.artifact.lifecyclePhase;
    delete reviewCore.artifact.releaseState;
    delete reviewCore.artifact.authorship.independentModelReviewCompleted;
    delete reviewCore.artifact.authorship.releaseGateSatisfied;
    delete reviewCore.constitutionalBoundaries.lifecycle.current;
    delete reviewCore.publicHandoff.publicationAuthorized;
    delete reviewCore.publicHandoff.currentState;
    delete reviewCore.buildReceipt;
    if (canonicalSha256(reviewCore) !==
        LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_REVIEW_CORE_SHA256) {
      throw new Error("review-core");
    }
  } catch {
    throw new Error(
      "Loops, Locks & Freedom Relations Atlas identity or constitutional boundary drifted",
    );
  }
}

function assertSiteAuthoredSourceLocator(value: unknown): asserts value is JsonObject {
  if (!object(value) || !sameKeys(value, [
    "tag", "revision", "relation", "establishesTruth", "importsAuthority",
    "runtimeDependency", "currentnessClaim",
  ]) || value.tag !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag ||
      value.revision !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.revision ||
      value.relation !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.relation ||
      value.establishesTruth !== false || value.importsAuthority !== false ||
      value.runtimeDependency !== false || value.currentnessClaim !== false) {
    throw new Error(
      "Loops, Locks & Freedom Relations Atlas site-authored source locator drifted",
    );
  }
}

export function loadLoopsLocksFreedomRelationsAtlas(sourceRoot = ROOT): JsonObject {
  const [atlasBytes, schemaBytes] = FROZEN_FILES.map((file) =>
    readFrozenFile(file, sourceRoot));
  const value = parseStrictJsonBytes(
    atlasBytes!,
    "Loops, Locks & Freedom Relations Atlas JSON",
  );
  const schema = parseStrictJsonBytes(
    schemaBytes!,
    "Loops, Locks & Freedom Relations Atlas schema JSON",
  );
  if (!object(schema) || schema.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
      schema.$id !== LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_URL) {
    throw new Error("Loops, Locks & Freedom Relations Atlas schema identity drifted");
  }
  assertFrozenIdentity(value);
  return value;
}

export function loopsLocksFreedomRelationsAtlasPublicDiscovery(
  value: unknown = loadLoopsLocksFreedomRelationsAtlas(),
  source: unknown = LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE,
) {
  assertFrozenIdentity(value);
  assertSiteAuthoredSourceLocator(source);
  return {
    title: value.artifact.title,
    protocol: value.protocol,
    artifact: {
      id: value.artifact.id,
      asOf: value.artifact.asOf,
      lifecyclePhase: value.artifact.lifecyclePhase,
      releaseState: value.artifact.releaseState,
      synthetic: value.artifact.synthetic,
    },
    publicHandoff: {
      recordPath: value.publicHandoff.routes[0].route,
      schemaPath: value.publicHandoff.routes[1].route,
      guidePath: value.publicHandoff.routes[2].route,
    },
    source: {
      tag: source.tag,
      revision: source.revision,
      relation: source.relation,
      establishesTruth: source.establishesTruth,
      importsAuthority: source.importsAuthority,
      runtimeDependency: source.runtimeDependency,
      currentnessClaim: source.currentnessClaim,
    },
    boundary: {
      real_people_or_personal_data: false,
      live_observation_or_human_training: false,
      live_optimization_or_reward_runtime: false,
      score_or_recommendation: false,
      credential_or_key_material: false,
      authentication_authorization_enforcement_adapter: false,
      policy_deployment_or_action_authority: false,
      network: false,
      runtime: false,
      mcp: false,
    },
  };
}
