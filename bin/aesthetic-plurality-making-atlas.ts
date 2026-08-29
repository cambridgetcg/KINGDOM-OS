#!/usr/bin/env bun
/**
 * Exact, network-free wrapper for the frozen Aesthetic Plurality & Making
 * Relations Atlas triplet.
 *
 * The producer supplies the three exact frozen files under file-scoped
 * publication authorization. This wrapper verifies their independently
 * reviewed receipts and constitutional boundary before exposing
 * one small, read-only discovery projection. It is not a Beauty framework,
 * aesthetic evaluator, ranking or recommendation surface, runtime, or action
 * authority.
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

export const AESTHETIC_PLURALITY_MAKING_ATLAS_PROTOCOL =
  "kingdom.aesthetic-plurality-making/0.1";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_ID =
  "kingdom-aesthetic-plurality-making-atlas-phase-0-2026-08-29";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_AS_OF = "2026-08-29";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_TITLE =
  "KINGDOM Aesthetic Plurality & Making Relations Atlas — Phase 0";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_KIND =
  "STATIC_SYNTHETIC_RELATION_ATLAS";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_LIFECYCLE =
  "FROZEN_STATIC_FIXTURE";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_REVIEW_STATE =
  "INDEPENDENT_REVIEW_GREEN_EXACT_BYTE_HANDOFF";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_RELEASE_STATE =
  "FROZEN_FOR_IMMUTABLE_HANDOFF";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_DESCRIPTION =
  "A frozen static synthetic relation atlas that keeps form, making, attributed response, aesthetic judgment, context and tradition, institutional selection, publication, adoption, and aftermath distinct without producing a Beauty verdict.";

export const AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR =
  "public/atlases/aesthetic-plurality-making-atlas-2026-08-29.json";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR =
  "public/schemas/aesthetic-plurality-making-atlas/0.1.json";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR =
  "public/AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md";

export const AESTHETIC_PLURALITY_MAKING_ATLAS_LOCAL_PATH =
  join(ROOT, AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR);
export const AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCAL_PATH =
  join(ROOT, AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR);
export const AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCAL_PATH =
  join(ROOT, AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR);

export const AESTHETIC_PLURALITY_MAKING_ATLAS_PATH =
  "/atlases/aesthetic-plurality-making-atlas-2026-08-29.json";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_PATH =
  "/schemas/aesthetic-plurality-making-atlas/0.1.json";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_PATH =
  "/AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md";

export const AESTHETIC_PLURALITY_MAKING_ATLAS_URL =
  `https://thekingdom.dev${AESTHETIC_PLURALITY_MAKING_ATLAS_PATH}`;
export const AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_URL =
  `https://thekingdom.dev${AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_PATH}`;
export const AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_URL =
  `https://thekingdom.dev${AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_PATH}`;

export const AESTHETIC_PLURALITY_MAKING_ATLAS_BYTE_SHA256 =
  "452880f1251fe1a7918b7c76578bbdc558f423b2f5c0bba038ad058566f4f558";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_CANONICAL_JSON_SHA256 =
  "b43be587ed59550419bf431632326a1b9119c0f5be78f5d329cf96df6b5405e2";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_BYTE_SHA256 =
  "565695c61526a0e9cb25f445aa447cf7f720bf41b5474e5c880975d97fe6477d";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_CANONICAL_JSON_SHA256 =
  "981ce6aba6de7b34e3ccde190f215f8127d59181ba2daa70bedcc7bc47afc023";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_BYTE_SHA256 =
  "8f09e20817432b4f3b3d5725fa069c9aa3a24e99b56e01dfead3a7397e48cf10";
// Site-authored audit note only. The producer's review lock is nonpublic and is
// deliberately not copied, projected, or treated as a loader-verifiable proof.
// The executable gate below relies only on the authorized public triplet, its
// embedded authorization receipt, and a site-pinned recomputation of the
// independently supplied review-core digest.
export const AESTHETIC_PLURALITY_MAKING_ATLAS_SITE_AUDIT_RECORDED_REVIEW_LOCK_BYTE_SHA256 =
  "b54d86af400207110fd90a70ea4623d976d29b0c2f57450da9777f6200f19c79";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_AUTHORIZATION_BYTE_SHA256 =
  "5a9de5fa37ebe5d64577a14017f2a089423b750675f95b2dc621ff400768fe6e";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_REVIEW_CORE_SHA256 =
  "3989011350fdd512e8fa61759548457c97c4a064feeb266a4507c3dbe3c0e32f";
export const AESTHETIC_PLURALITY_MAKING_ATLAS_SEMANTIC_PAYLOAD_SHA256 =
  "31910cdeca51dbd7a14bc9cb468cf4e9fbd62933a09b62bd47645bc3626162b4";

export const AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS = Object.freeze([
  AESTHETIC_PLURALITY_MAKING_ATLAS_PATH,
  AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_PATH,
  AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_PATH,
] as const);

export const AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS = Object.freeze([
  AESTHETIC_PLURALITY_MAKING_ATLAS_URL,
  AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_URL,
  AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_URL,
] as const);

export const AESTHETIC_PLURALITY_MAKING_ATLAS_LANE_NAMES = Object.freeze([
  "Form",
  "Making event",
  "Maker statement",
  "Attributed response",
  "Aesthetic judgment",
  "Context and tradition",
  "Institutional selection",
  "Publication",
  "Adoption",
  "Aftermath",
] as const);

export const AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_BOUNDARY_KEYS = Object.freeze([
  "beauty_verdict",
  "scalar_aesthetic_evaluation",
  "artifact_evaluation",
  "person_evaluation",
  "culture_evaluation",
  "automated_ranking",
  "automated_recommendation",
  "moderation_decision",
  "action_authority",
  "truth_conversion",
  "goodness_conversion",
  "justice_conversion",
  "completion_conversion",
  "private_data",
  "participant_data",
  "personal_appearance_assessment",
  "kingdom_doctrine_import",
  "source_truth_import",
  "source_authority_import",
  "source_currentness_import",
  "mutable_alias",
  "html_page",
  "network",
  "api",
  "runtime",
  "mcp",
] as const);

const LANE_IDS = Object.freeze([
  "FORM",
  "MAKING_EVENT",
  "MAKER_STATEMENT",
  "ATTRIBUTED_RESPONSE",
  "AESTHETIC_JUDGMENT",
  "CONTEXT_TRADITION",
  "INSTITUTIONAL_SELECTION",
  "PUBLICATION",
  "ADOPTION",
  "AFTERMATH",
] as const);

const FROZEN_FILES = Object.freeze([
  {
    label: "Aesthetic Plurality & Making Relations Atlas",
    locator: AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR,
    bytes: 62_188,
    sha256: AESTHETIC_PLURALITY_MAKING_ATLAS_BYTE_SHA256,
  },
  {
    label: "Aesthetic Plurality & Making Relations Atlas schema",
    locator: AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR,
    bytes: 225_293,
    sha256: AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_BYTE_SHA256,
  },
  {
    label: "Aesthetic Plurality & Making Relations Atlas guide",
    locator: AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR,
    bytes: 14_497,
    sha256: AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_BYTE_SHA256,
  },
] as const);

const EXPECTED_COUNTS = Object.freeze({
  equationCards: 9,
  kingdomOrientations: 0,
  lanes: 10,
  mathematicalFixtures: 9,
  mathematicalRegisters: 2,
  nonEquivalences: 21,
  relationTypes: 15,
  relationalFixtures: 9,
  sourceBindings: 14,
  syntheticFixtures: 18,
  terms: 12,
});

const SCOPE_FALSE_KEYS = Object.freeze([
  "accessDecision", "account", "api", "artifactEvaluation",
  "authorityConversion", "automatedRanking", "automatedRecommendation",
  "automaticAction", "completionConversion", "cultureEvaluation",
  "enforcementDecision", "formInput", "goodnessConversion",
  "governanceDecision", "justiceConversion", "legalConclusion", "liveInput",
  "livingTraditionFixture", "mcp", "moderationDecision", "network",
  "ownershipConversion", "participantData", "permissionConversion",
  "personEvaluation", "personalAppearanceAssessment", "privateData",
  "protectedExpressionFixture", "publicationDecision", "realPeople",
  "recognizableThirdPartyWork", "runtime", "scalarAestheticEvaluation",
  "truthConversion", "wcagConformanceClaim",
] as const);

const SOURCE_BINDING_FALSE_KEYS = Object.freeze([
  "authorityImported", "complianceImported", "currentnessImported",
  "downloadedAtBuild", "endorsementImported", "licenceImported",
  "permissionImported", "reuseRightImported", "sourceTextImported",
  "truthImported",
] as const);

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

function reviewInvariantSemanticCore(value: JsonObject): JsonObject {
  const core = structuredClone(value);
  delete core.buildReceipt;
  for (const key of [
    "phase", "reviewState", "frozen", "independentReviewGreen",
    "publicationAuthorized", "releaseGateSatisfied",
  ]) delete core.artifact.lifecycle[key];
  for (const key of ["currentState", "publicationAuthorized"]) {
    delete core.publicHandoff[key];
  }
  return core;
}

function assertFrozenIdentity(value: unknown): asserts value is JsonObject {
  try {
    if (!object(value) || !sameKeys(value, [
      "$schema", "artifact", "buildReceipt", "constitutionalBoundaries",
      "counts", "equationCards", "kingdomOrientations", "nonEquivalences",
      "protocol", "publicHandoff", "scope", "sourceBindingInvariants",
      "sourceBindings", "syntheticFixtures", "vocabularies",
    ]) || canonicalSha256(value) !==
      AESTHETIC_PLURALITY_MAKING_ATLAS_CANONICAL_JSON_SHA256) {
      throw new Error("record");
    }

    const artifact = value.artifact;
    const authorship = object(artifact) ? artifact.authorship : undefined;
    const lifecycle = object(artifact) ? artifact.lifecycle : undefined;
    if (value.$schema !== AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_URL ||
        value.protocol !== AESTHETIC_PLURALITY_MAKING_ATLAS_PROTOCOL ||
        !object(artifact) || !sameKeys(artifact, [
          "asOf", "authorship", "id", "kind", "lifecycle", "title",
        ]) || artifact.id !== AESTHETIC_PLURALITY_MAKING_ATLAS_ID ||
        artifact.title !== AESTHETIC_PLURALITY_MAKING_ATLAS_TITLE ||
        artifact.asOf !== AESTHETIC_PLURALITY_MAKING_ATLAS_AS_OF ||
        artifact.kind !== AESTHETIC_PLURALITY_MAKING_ATLAS_KIND ||
        !object(authorship) || !sameKeys(authorship, [
          "assistanceDisclosure", "humanDirected", "modelAssisted",
        ]) || authorship.humanDirected !== true || authorship.modelAssisted !== true ||
        authorship.assistanceDisclosure !==
          "Human-directed request; model-assisted research synthesis, original synthetic fixture authorship, implementation, and prefreeze verification. Independent review and release authorization remain separate recorded events." ||
        !object(lifecycle) || !sameKeys(lifecycle, [
          "externalPublicationPerformed", "frozen", "humanReviewCompleted",
          "independentReviewGreen", "phase", "publicationAuthorized",
          "releaseGateSatisfied", "reviewState",
        ]) || lifecycle.phase !== AESTHETIC_PLURALITY_MAKING_ATLAS_LIFECYCLE ||
        lifecycle.reviewState !== AESTHETIC_PLURALITY_MAKING_ATLAS_REVIEW_STATE ||
        lifecycle.frozen !== true || lifecycle.independentReviewGreen !== true ||
        lifecycle.publicationAuthorized !== true || lifecycle.releaseGateSatisfied !== true ||
        lifecycle.humanReviewCompleted !== false ||
        lifecycle.externalPublicationPerformed !== false) {
      throw new Error("identity");
    }

    if (!object(value.scope) ||
        !sameKeys(value.scope, ["staticArtifact", "syntheticOnly", ...SCOPE_FALSE_KEYS]) ||
        value.scope.staticArtifact !== true || value.scope.syntheticOnly !== true ||
        SCOPE_FALSE_KEYS.some((key) => value.scope[key] !== false)) {
      throw new Error("scope");
    }

    const expectedRoutes = [
      {
        absoluteUrl: AESTHETIC_PLURALITY_MAKING_ATLAS_URL,
        immutable: true,
        mimeType: "application/json; charset=utf-8",
        role: "CANONICAL_RECORD",
        route: AESTHETIC_PLURALITY_MAKING_ATLAS_PATH,
      },
      {
        absoluteUrl: AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_URL,
        immutable: true,
        mimeType: "application/json; charset=utf-8",
        role: "CLOSED_SCHEMA",
        route: AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_PATH,
      },
      {
        absoluteUrl: AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_URL,
        immutable: true,
        mimeType: "text/markdown; charset=utf-8",
        role: "ACCESSIBLE_LINEAR_GUIDE",
        route: AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_PATH,
      },
    ];
    const handoff = value.publicHandoff;
    if (!object(handoff) || !sameKeys(handoff, [
      "currentState", "htmlPage", "mutableAlias", "publicationAuthorized",
      "reviewGate", "routes", "runtime",
    ]) || handoff.currentState !== AESTHETIC_PLURALITY_MAKING_ATLAS_RELEASE_STATE ||
        handoff.reviewGate !==
          "INDEPENDENT_REVIEW_GREEN_THEN_RELEASE_OWNER_EXACT_BYTE_AUTHORIZATION" ||
        handoff.publicationAuthorized !== true || handoff.htmlPage !== false ||
        handoff.mutableAlias !== false || handoff.runtime !== false ||
        !sameJson(handoff.routes, expectedRoutes)) {
      throw new Error("handoff");
    }

    if (!sameJson(value.counts, EXPECTED_COUNTS) ||
        !Array.isArray(value.equationCards) || value.equationCards.length !== 9 ||
        !Array.isArray(value.kingdomOrientations) || value.kingdomOrientations.length !== 0 ||
        !Array.isArray(value.nonEquivalences) || value.nonEquivalences.length !== 21 ||
        !Array.isArray(value.sourceBindings) || value.sourceBindings.length !== 14 ||
        !Array.isArray(value.syntheticFixtures) || value.syntheticFixtures.length !== 18 ||
        value.syntheticFixtures.filter((entry: any) => entry?.kind === "MATHEMATICAL")
          .length !== 9 ||
        value.syntheticFixtures.filter((entry: any) => entry?.kind === "RELATIONAL")
          .length !== 9 ||
        value.syntheticFixtures.some((entry: any) => !object(entry) ||
          entry.synthetic !== true) ||
        !object(value.vocabularies) || !sameKeys(value.vocabularies, [
          "lanes", "mathematicalRegisters", "relationTypes", "terms",
        ]) || !Array.isArray(value.vocabularies.lanes) ||
        !sameJson(value.vocabularies.lanes.map((entry: any) => entry?.id), LANE_IDS) ||
        !sameJson(
          value.vocabularies.lanes.map((entry: any) => entry?.label),
          AESTHETIC_PLURALITY_MAKING_ATLAS_LANE_NAMES,
        ) || !Array.isArray(value.vocabularies.mathematicalRegisters) ||
        value.vocabularies.mathematicalRegisters.length !== 2 ||
        value.vocabularies.mathematicalRegisters.some((entry: any) => !object(entry) ||
          entry.artifactRelation !== false || entry.aestheticJudgmentRelation !== false ||
          entry.selectionRelation !== false || entry.choiceRule !== false) ||
        !Array.isArray(value.vocabularies.relationTypes) ||
        value.vocabularies.relationTypes.length !== 15 ||
        !Array.isArray(value.vocabularies.terms) || value.vocabularies.terms.length !== 12) {
      throw new Error("structure");
    }

    const boundaries = value.constitutionalBoundaries;
    if (!object(boundaries) || !sameKeys(boundaries, [
      "fixtureSafety", "forbiddenConversions", "forbiddenFieldNames",
      "noAutomaticConversion", "notBeautyFramework", "opening",
      "separatelyOwnedBeautyDoctrineImported",
    ]) || boundaries.noAutomaticConversion !== true ||
        boundaries.notBeautyFramework !== true ||
        boundaries.separatelyOwnedBeautyDoctrineImported !== false ||
        canonicalSha256(boundaries) !==
          "a7aaacc5fe7ca2134189dcf194d094a41a757138064d6d8d7b24c69bde49e148") {
      throw new Error("constitution");
    }

    const sourceInvariants = value.sourceBindingInvariants;
    if (!object(sourceInvariants) || !sameKeys(sourceInvariants, [
      "linkOnly", ...SOURCE_BINDING_FALSE_KEYS,
    ]) || sourceInvariants.linkOnly !== true ||
        SOURCE_BINDING_FALSE_KEYS.some((key) => sourceInvariants[key] !== false) ||
        value.sourceBindings.some((entry: any) => !object(entry) ||
          typeof entry.url !== "string" || !entry.url.startsWith("https://") ||
          !["PRIMARY_TECHNICAL_SOURCE", "OFFICIAL_NORMATIVE_CONTEXT"]
            .includes(entry.class))) {
      throw new Error("sources");
    }

    const receipt = value.buildReceipt;
    const authorizationReceipt = object(receipt) && Array.isArray(receipt.generatorInputReceipts)
      ? receipt.generatorInputReceipts.find((entry: any) =>
        object(entry) && entry.path === "PUBLICATION-AUTHORIZATION.md")
      : undefined;
    if (!object(receipt) || !sameKeys(receipt, [
      "arithmetic", "clockRead", "externalInputUsed", "generatorInputReceipts",
      "networkUsed", "randomnessUsed", "semanticPayloadSha256",
      "verifiedFixtureCount", "verifierState",
    ]) || receipt.arithmetic !==
      "EXACT_BOUNDED_SAFE_INTEGER_RATIONAL_FINITE_SET_AND_FINITE_GRAPH" ||
        receipt.clockRead !== false || receipt.externalInputUsed !== false ||
        receipt.networkUsed !== false || receipt.randomnessUsed !== false ||
        receipt.semanticPayloadSha256 !==
          `sha256:${AESTHETIC_PLURALITY_MAKING_ATLAS_SEMANTIC_PAYLOAD_SHA256}` ||
        receipt.verifiedFixtureCount !== 18 ||
        receipt.verifierState !== "ALL_STATIC_SYNTHETIC_FIXTURES_RECOMPUTED" ||
        !object(authorizationReceipt) || authorizationReceipt.bytes !== 779 ||
        authorizationReceipt.byteSha256 !==
          `sha256:${AESTHETIC_PLURALITY_MAKING_ATLAS_AUTHORIZATION_BYTE_SHA256}` ||
        !sameKeys(authorizationReceipt, ["byteSha256", "bytes", "path"]) ||
        canonicalSha256(reviewInvariantSemanticCore(value)) !==
          AESTHETIC_PLURALITY_MAKING_ATLAS_REVIEW_CORE_SHA256) {
      throw new Error("receipts");
    }
  } catch {
    throw new Error(
      "Aesthetic Plurality & Making Relations Atlas identity or non-authority boundary drifted",
    );
  }
}

export function loadAestheticPluralityMakingAtlas(sourceRoot = ROOT): JsonObject {
  const [atlasBytes, schemaBytes] = FROZEN_FILES.map((file) =>
    readFrozenFile(file, sourceRoot));
  const schema = parseStrictJsonBytes(
    schemaBytes!,
    "Aesthetic Plurality & Making Relations Atlas schema JSON",
  );
  if (!object(schema) ||
      schema.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
      schema.$id !== AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_URL ||
      schema.additionalProperties !== false ||
      canonicalSha256(schema) !==
        AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_CANONICAL_JSON_SHA256) {
    throw new Error("Aesthetic Plurality & Making Relations Atlas schema identity drifted");
  }
  const value = parseStrictJsonBytes(
    atlasBytes!,
    "Aesthetic Plurality & Making Relations Atlas JSON",
  );
  assertFrozenIdentity(value);
  return value;
}

export function aestheticPluralityMakingAtlasPublicDiscovery(
  value: unknown = loadAestheticPluralityMakingAtlas(),
) {
  assertFrozenIdentity(value);
  return {
    title: value.artifact.title,
    description: AESTHETIC_PLURALITY_MAKING_ATLAS_DESCRIPTION,
    protocol: value.protocol,
    artifact: {
      id: value.artifact.id,
      asOf: value.artifact.asOf,
      kind: value.artifact.kind,
      phase: value.artifact.lifecycle.phase,
      reviewState: value.artifact.lifecycle.reviewState,
      staticArtifact: value.scope.staticArtifact,
      syntheticOnly: value.scope.syntheticOnly,
      immutable: value.artifact.lifecycle.frozen,
    },
    lanes: value.vocabularies.lanes.map((entry: JsonObject) => entry.label),
    publicHandoff: {
      recordPath: value.publicHandoff.routes[0].route,
      schemaPath: value.publicHandoff.routes[1].route,
      guidePath: value.publicHandoff.routes[2].route,
    },
    boundary: {
      beauty_verdict: false,
      scalar_aesthetic_evaluation: value.scope.scalarAestheticEvaluation,
      artifact_evaluation: value.scope.artifactEvaluation,
      person_evaluation: value.scope.personEvaluation,
      culture_evaluation: value.scope.cultureEvaluation,
      automated_ranking: value.scope.automatedRanking,
      automated_recommendation: value.scope.automatedRecommendation,
      moderation_decision: value.scope.moderationDecision,
      action_authority: false,
      truth_conversion: value.scope.truthConversion,
      goodness_conversion: value.scope.goodnessConversion,
      justice_conversion: value.scope.justiceConversion,
      completion_conversion: value.scope.completionConversion,
      private_data: value.scope.privateData,
      participant_data: value.scope.participantData,
      personal_appearance_assessment: value.scope.personalAppearanceAssessment,
      kingdom_doctrine_import: value.constitutionalBoundaries
        .separatelyOwnedBeautyDoctrineImported,
      source_truth_import: value.sourceBindingInvariants.truthImported,
      source_authority_import: value.sourceBindingInvariants.authorityImported,
      source_currentness_import: value.sourceBindingInvariants.currentnessImported,
      mutable_alias: value.publicHandoff.mutableAlias,
      html_page: value.publicHandoff.htmlPage,
      network: value.scope.network,
      api: value.scope.api,
      runtime: value.scope.runtime,
      mcp: value.scope.mcp,
    },
  };
}
