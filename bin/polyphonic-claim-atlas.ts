#!/usr/bin/env bun
/**
 * Exact, network-free wrapper for the frozen Polyphonic Claim Atlas triplet.
 *
 * The producer owns the three immutable bytes. This wrapper verifies their
 * reviewed byte receipts and exposes only the independently approved small
 * discovery projection. It is not a truth oracle, scorer, runtime, or action
 * surface.
 */

import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readRegularFileWithinRoot } from "./immutable-publications.ts";
import { parseStrictJsonBytes } from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const POLYPHONIC_CLAIM_ATLAS_PROTOCOL = "kingdom.truth-relations/0.1";
export const POLYPHONIC_CLAIM_ATLAS_ID = "polyphonic-claim-atlas-2026-08-26";
export const POLYPHONIC_CLAIM_ATLAS_VERSION = "0.1.0";
export const POLYPHONIC_CLAIM_ATLAS_AS_OF = "2026-08-26";
export const POLYPHONIC_CLAIM_ATLAS_TITLE =
  "KINGDOM Polyphonic Claim Atlas: Truth Relations Phase 0";
export const POLYPHONIC_CLAIM_ATLAS_DESCRIPTION =
  "A static synthetic atlas for inspecting typed relations among expression, claim, warrant, reasoning, narrative, provenance, institutional status, assessment and correction without producing a truth oracle.";

export const POLYPHONIC_CLAIM_ATLAS_LOCATOR =
  "public/truth/polyphonic-claim-atlas-2026-08-26.json";
export const POLYPHONIC_CLAIM_ATLAS_SCHEMA_LOCATOR =
  "public/truth/schemas/v0.1/public-snapshot.schema.json";
export const POLYPHONIC_CLAIM_ATLAS_GUIDE_LOCATOR =
  "public/POLYPHONIC-CLAIM-ATLAS-v0.1.md";

export const POLYPHONIC_CLAIM_ATLAS_LOCAL_PATH =
  join(ROOT, POLYPHONIC_CLAIM_ATLAS_LOCATOR);
export const POLYPHONIC_CLAIM_ATLAS_SCHEMA_LOCAL_PATH =
  join(ROOT, POLYPHONIC_CLAIM_ATLAS_SCHEMA_LOCATOR);
export const POLYPHONIC_CLAIM_ATLAS_GUIDE_LOCAL_PATH =
  join(ROOT, POLYPHONIC_CLAIM_ATLAS_GUIDE_LOCATOR);

export const POLYPHONIC_CLAIM_ATLAS_PATH =
  "/truth/polyphonic-claim-atlas-2026-08-26.json";
export const POLYPHONIC_CLAIM_ATLAS_SCHEMA_PATH =
  "/truth/schemas/v0.1/public-snapshot.schema.json";
export const POLYPHONIC_CLAIM_ATLAS_GUIDE_PATH =
  "/POLYPHONIC-CLAIM-ATLAS-v0.1.md";

export const POLYPHONIC_CLAIM_ATLAS_URL =
  `https://thekingdom.dev${POLYPHONIC_CLAIM_ATLAS_PATH}`;
export const POLYPHONIC_CLAIM_ATLAS_SCHEMA_URL =
  `https://thekingdom.dev${POLYPHONIC_CLAIM_ATLAS_SCHEMA_PATH}`;
export const POLYPHONIC_CLAIM_ATLAS_GUIDE_URL =
  `https://thekingdom.dev${POLYPHONIC_CLAIM_ATLAS_GUIDE_PATH}`;

export const POLYPHONIC_CLAIM_ATLAS_BYTE_SHA256 =
  "69d68faf0885cecf084bee3ff094c742786e7901f8d1da90fa510cce5194970b";
export const POLYPHONIC_CLAIM_ATLAS_SCHEMA_BYTE_SHA256 =
  "8244c3428ea810defd98da1ca7c1d0fec6541c0c175e3195b711b89af39cdb27";
export const POLYPHONIC_CLAIM_ATLAS_GUIDE_BYTE_SHA256 =
  "974cb357ad1f5a23fa3f8798e444bbfb4dc43b1bf8aa1d14609599877ed13126";

export const POLYPHONIC_CLAIM_ATLAS_SOURCE = Object.freeze({
  tag: "https://github.com/cambridgetcg/kingdom-polyphonic-claim-atlas/tree/v0.1.1",
  revision: "ca7bb37271853545a84bc1b8955ce63918da979b",
  relation: "SITE_AUTHORED_PINNED_SOURCE_LOCATOR",
  establishesTruth: false,
  importsAuthority: false,
  runtimeDependency: false,
  currentnessClaim: false,
});

export const POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS = Object.freeze([
  POLYPHONIC_CLAIM_ATLAS_PATH,
  POLYPHONIC_CLAIM_ATLAS_SCHEMA_PATH,
  POLYPHONIC_CLAIM_ATLAS_GUIDE_PATH,
] as const);

export const POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS = Object.freeze([
  POLYPHONIC_CLAIM_ATLAS_URL,
  POLYPHONIC_CLAIM_ATLAS_SCHEMA_URL,
  POLYPHONIC_CLAIM_ATLAS_GUIDE_URL,
] as const);

const FROZEN_FILES = Object.freeze([
  {
    label: "Polyphonic Claim Atlas",
    locator: POLYPHONIC_CLAIM_ATLAS_LOCATOR,
    bytes: 178_016,
    sha256: POLYPHONIC_CLAIM_ATLAS_BYTE_SHA256,
  },
  {
    label: "Polyphonic Claim Atlas schema",
    locator: POLYPHONIC_CLAIM_ATLAS_SCHEMA_LOCATOR,
    bytes: 62_109,
    sha256: POLYPHONIC_CLAIM_ATLAS_SCHEMA_BYTE_SHA256,
  },
  {
    label: "Polyphonic Claim Atlas guide",
    locator: POLYPHONIC_CLAIM_ATLAS_GUIDE_LOCATOR,
    bytes: 9_188,
    sha256: POLYPHONIC_CLAIM_ATLAS_GUIDE_BYTE_SHA256,
  },
] as const);

const CONSTITUTIONAL_BOUNDARY_KEYS = Object.freeze([
  "accessAdapter",
  "api",
  "automatedAction",
  "automatedVerdict",
  "canonicalStory",
  "censorshipOrSuppressionAction",
  "claimScore",
  "classifiesPeopleAsLiars",
  "communityScore",
  "consensusScore",
  "convertsCoherenceToTruth",
  "convertsConsensusToTruth",
  "convertsHashToTruth",
  "convertsMajorityToTruth",
  "convertsOfficialStatusToTruth",
  "convertsProvenanceToTruth",
  "convertsReceiptToTruth",
  "convertsSignatureToTruth",
  "credibilityScore",
  "determinesTruth",
  "enforcementAdapter",
  "globalTruthStatus",
  "governanceAdapter",
  "infersIntent",
  "infersPrivateReasoning",
  "institutionScore",
  "karmaAdapter",
  "mcpExposure",
  "misinformationFlag",
  "moderationAdapter",
  "moneyAdapter",
  "namedPersonClaims",
  "nenAdapter",
  "network",
  "personScore",
  "privateTestimonyImmutable",
  "propagandaScore",
  "ranksPeopleOrSources",
  "recommendation",
  "reputationEffect",
  "rewardOrPenalty",
  "runtime",
  "sourceScore",
  "storyScore",
  "storyWinner",
  "submission",
  "trustScore",
  "truthScore",
  "witnessScore",
  "zeroneAdapter",
] as const);

type JsonObject = Record<string, any>;

function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
  const boundaries = object(value) && object(value.constitutionalBoundaries)
    ? value.constitutionalBoundaries
    : undefined;
  if (!object(value) || value.title !== POLYPHONIC_CLAIM_ATLAS_TITLE ||
      value.description !== POLYPHONIC_CLAIM_ATLAS_DESCRIPTION ||
      value.protocol !== POLYPHONIC_CLAIM_ATLAS_PROTOCOL ||
      value.artifact?.id !== POLYPHONIC_CLAIM_ATLAS_ID ||
      value.artifact?.version !== POLYPHONIC_CLAIM_ATLAS_VERSION ||
      value.artifact?.asOf !== POLYPHONIC_CLAIM_ATLAS_AS_OF ||
      value.artifact?.phase !== "PHASE_0" ||
      value.artifact?.state !== "STATIC_SYNTHETIC_PHASE_0" ||
      value.artifact?.immutableHistoricalArtifact !== true ||
      value.artifact?.mutableAlias !== false ||
      value.artifact?.runtimeCurrentnessClaim !== false ||
      value.publicHandoff?.canonicalPath !== POLYPHONIC_CLAIM_ATLAS_PATH ||
      value.publicHandoff?.schemaPath !== POLYPHONIC_CLAIM_ATLAS_SCHEMA_PATH ||
      value.publicHandoff?.guidePath !== POLYPHONIC_CLAIM_ATLAS_GUIDE_PATH ||
      value.publicHandoff?.htmlPage !== false ||
      value.publicHandoff?.runtime !== false ||
      value.counts?.cases !== 24 ||
      value.counts?.claimRegimes !== 19 ||
      value.counts?.methods !== 19 ||
      value.scope?.claimsRuntimeCurrentness !== false ||
      value.scope?.personalData !== false ||
      value.scope?.liveClaims !== false ||
      value.scope?.networkInputs !== false ||
      value.scope?.realPeople !== false ||
      value.scope?.sourceBodies !== false ||
      value.scope?.datasetNature !== "SYNTHETIC_ONLY" ||
      value.authorship?.reviewState !== "INDEPENDENT_REVIEW_COMPLETE" ||
      value.authorship?.humanReviewCompleted !== false ||
      value.authorship?.publicationAuthorized !== true ||
      !boundaries ||
      Object.keys(boundaries).length !== CONSTITUTIONAL_BOUNDARY_KEYS.length ||
      CONSTITUTIONAL_BOUNDARY_KEYS.some((key) => boundaries[key] !== false)) {
    throw new Error("Polyphonic Claim Atlas identity or non-authority boundary drifted");
  }
}

function assertSiteAuthoredSourceLocator(value: unknown): asserts value is JsonObject {
  if (!object(value) || Object.keys(value).length !== 7 ||
      value.tag !== POLYPHONIC_CLAIM_ATLAS_SOURCE.tag ||
      value.revision !== POLYPHONIC_CLAIM_ATLAS_SOURCE.revision ||
      value.relation !== POLYPHONIC_CLAIM_ATLAS_SOURCE.relation ||
      value.establishesTruth !== false ||
      value.importsAuthority !== false ||
      value.runtimeDependency !== false ||
      value.currentnessClaim !== false) {
    throw new Error("Polyphonic Claim Atlas site-authored source locator drifted");
  }
}

export function loadPolyphonicClaimAtlas(sourceRoot = ROOT): JsonObject {
  const [atlasBytes] = FROZEN_FILES.map((file) => readFrozenFile(file, sourceRoot));
  const value = parseStrictJsonBytes(atlasBytes!, "Polyphonic Claim Atlas JSON");
  assertFrozenIdentity(value);
  return value;
}

export function polyphonicClaimAtlasPublicDiscovery(
  value: unknown = loadPolyphonicClaimAtlas(),
  source: unknown = POLYPHONIC_CLAIM_ATLAS_SOURCE,
) {
  assertFrozenIdentity(value);
  assertSiteAuthoredSourceLocator(source);
  return {
    title: value.title,
    description: value.description,
    protocol: value.protocol,
    artifact: {
      id: value.artifact.id,
      version: value.artifact.version,
      asOf: value.artifact.asOf,
      phase: value.artifact.phase,
      state: value.artifact.state,
      immutableHistoricalArtifact: value.artifact.immutableHistoricalArtifact,
      runtimeCurrentnessClaim: value.artifact.runtimeCurrentnessClaim,
    },
    publicHandoff: {
      canonicalPath: value.publicHandoff.canonicalPath,
      schemaPath: value.publicHandoff.schemaPath,
      guidePath: value.publicHandoff.guidePath,
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
      truth_oracle: false,
      global_truth_status: false,
      person_source_community_scores: false,
      lie_or_intent_inference: false,
      personal_data: false,
      live_claims: false,
      action_authority: false,
      zerone_karma_nen_adapter: false,
      runtime: false,
      mcp: false,
    },
  };
}
