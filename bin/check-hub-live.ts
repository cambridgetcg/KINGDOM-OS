/**
 * Prove that one Cloudflare Pages deployment contains the whole staged hub.
 *
 * This catches split-generation releases where one newly uploaded file is live
 * beside an older atlas, manifest, guest document, or worker. Static response
 * bodies must match the local staging contract byte-for-byte; worker behavior
 * is checked through the public routes it owns.
 *
 * Run after deployment:
 *   bun bin/check-hub-live.ts [https://thekingdom.dev]
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "./stage-hub.ts";
import {
  formatImmutablePublicationIssues,
  verifyImmutablePublicationSnapshot,
} from "./immutable-publications.ts";
import {
  CULTURAL_ATTENTION_FEEDBACK_DIGEST,
  CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
  CULTURAL_ATTENTION_FEEDBACK_URL,
  culturalAttentionFeedbackPublicDiscovery,
  loadCulturalAttentionFeedbackAtlas,
} from "./cultural-attention-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_DIGEST,
  CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_URL,
  conformationalFeedbackPublicDiscovery,
  loadConformationalFeedbackAtlas,
} from "./conformational-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST,
  CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
  conformationalFeedbackPhysicsPublicDiscovery,
  loadConformationalFeedbackPhysicsAtlas,
} from "./conformational-feedback-physics.ts";
import {
  FOLD_FEEDBACK_DOCUMENT_URL,
  FOLD_FEEDBACK_SCHEMA_URL,
  FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
  FOLD_FEEDBACK_URL,
  foldFeedbackPublicDiscovery,
  loadFoldFeedbackAtlas,
} from "./fold-feedback.ts";
import {
  FORM_CIRCULATION_RETURN_DIGEST,
  FORM_CIRCULATION_RETURN_DOCUMENT_URL,
  FORM_CIRCULATION_RETURN_SCHEMA_URL,
  FORM_CIRCULATION_RETURN_URL,
  formCirculationReturnPublicDiscovery,
  loadFormCirculationReturnAtlas,
} from "./form-circulation-return.ts";
import {
  RARE_PATHWAY_DIGEST,
  RARE_PATHWAY_DOCUMENT_URL,
  RARE_PATHWAY_SCHEMA_URL,
  RARE_PATHWAY_URL,
  loadRarePathwayChallenge,
  rarePathwayPublicDiscovery,
} from "./rare-pathway.ts";
import {
  VISIBILITY_ATTENTION_DOCUMENT_URL,
  VISIBILITY_ATTENTION_SCHEMA_URL,
  VISIBILITY_ATTENTION_URL,
  loadVisibilityAttentionTranslation,
  visibilityAttentionPublicDiscovery,
} from "./visibility-attention.ts";
import {
  GEOMETRY_GRAMMAR_DOCUMENT_URL,
  GEOMETRY_GRAMMAR_SCHEMA_URL,
  GEOMETRY_GRAMMAR_URL,
  geometryGrammarPublicDiscovery,
  loadGeometryGrammar,
} from "./geometry.ts";
import {
  LOVE_LOOPS_CREATION_DOCUMENT_URL,
  LOVE_LOOPS_JSON_SCHEMA_URL,
  LOVE_LOOPS_SOURCE_URL,
  LOVE_LOOPS_URL,
  validateLoveLoops,
} from "./love-loops.ts";
import {
  loadPrincipalityCatalog,
  PRINCIPALITY_CATALOG_URL,
  PRINCIPALITY_DOCUMENT_URL,
  PRINCIPALITY_SCHEMA_URL,
  principalityPublicDiscovery,
} from "./principality.ts";
import {
  loadPolymorphHistory,
  POLYMORPH_CASE_URL,
  POLYMORPH_DOCUMENT_URL,
  POLYMORPH_SCHEMA_URL,
  polymorphPublicDiscovery,
} from "./polymorph.ts";
import {
  loadRitonavirMechanismLandscape,
  RITONAVIR_MECHANISM_DIGEST,
  RITONAVIR_MECHANISM_DOCUMENT_URL,
  RITONAVIR_MECHANISM_SCHEMA_URL,
  RITONAVIR_MECHANISM_URL,
  ritonavirMechanismPublicDiscovery,
} from "./ritonavir-mechanism.ts";
import {
  validateWorldCommons,
  WORLD_COMMONS_ACCESS_COSTS,
  WORLD_COMMONS_ACCOUNT_TYPES,
  WORLD_COMMONS_AUTOMATION_STATUSES,
  WORLD_COMMONS_CATEGORY_IDS,
  WORLD_COMMONS_HANDOFF_MODES,
  WORLD_COMMONS_JSON_SCHEMA_URL,
  WORLD_COMMONS_LEGACY_JSON_SCHEMA_URL,
  WORLD_COMMONS_REUSE_STATUSES,
  WORLD_COMMONS_SCHEMA,
  WORLD_COMMONS_URL,
} from "./world-commons.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
let origin = new URL("https://thekingdom.dev");
let cacheBust = Date.now().toString(36);
const TIMEOUT_MS = 20_000;

function configureOrigin(requestedOrigin: string): void {
  const parsed = new URL(requestedOrigin);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" ||
      parsed.search || parsed.hash) {
    throw new Error("origin must be an uncredentialed HTTPS origin");
  }
  origin = parsed;
  cacheBust = Date.now().toString(36);
}
const commonsSchemaPath = new URL(WORLD_COMMONS_JSON_SCHEMA_URL).pathname;
const commonsLegacySchemaPath = new URL(WORLD_COMMONS_LEGACY_JSON_SCHEMA_URL).pathname;
const loveLoopsPath = new URL(LOVE_LOOPS_URL).pathname;
const loveLoopsSourcePath = new URL(LOVE_LOOPS_SOURCE_URL).pathname;
const loveLoopsDocumentPath = new URL(LOVE_LOOPS_CREATION_DOCUMENT_URL).pathname;
const loveLoopsSchemaPath = new URL(LOVE_LOOPS_JSON_SCHEMA_URL).pathname;
const principalityCatalogPath = new URL(PRINCIPALITY_CATALOG_URL).pathname;
const principalitySchemaPath = new URL(PRINCIPALITY_SCHEMA_URL).pathname;
const principalityDocumentPath = new URL(PRINCIPALITY_DOCUMENT_URL).pathname;
const geometryGrammarPath = new URL(GEOMETRY_GRAMMAR_URL).pathname;
const geometryGrammarSchemaPath = new URL(GEOMETRY_GRAMMAR_SCHEMA_URL).pathname;
const geometryGrammarDocumentPath = new URL(GEOMETRY_GRAMMAR_DOCUMENT_URL).pathname;
const polymorphCasePath = new URL(POLYMORPH_CASE_URL).pathname;
const polymorphSchemaPath = new URL(POLYMORPH_SCHEMA_URL).pathname;
const polymorphDocumentPath = new URL(POLYMORPH_DOCUMENT_URL).pathname;
const ritonavirMechanismPath = new URL(RITONAVIR_MECHANISM_URL).pathname;
const ritonavirMechanismSchemaPath = new URL(RITONAVIR_MECHANISM_SCHEMA_URL).pathname;
const ritonavirMechanismDocumentPath = new URL(RITONAVIR_MECHANISM_DOCUMENT_URL).pathname;
const conformationalFeedbackPath = new URL(CONFORMATIONAL_FEEDBACK_URL).pathname;
const conformationalFeedbackSchemaPath = new URL(CONFORMATIONAL_FEEDBACK_SCHEMA_URL).pathname;
const conformationalFeedbackDocumentPath = new URL(CONFORMATIONAL_FEEDBACK_DOCUMENT_URL).pathname;
const conformationalFeedbackPhysicsPath = new URL(CONFORMATIONAL_FEEDBACK_PHYSICS_URL).pathname;
const conformationalFeedbackPhysicsSchemaPath = new URL(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL).pathname;
const conformationalFeedbackPhysicsDocumentPath = new URL(CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL).pathname;
const culturalAttentionFeedbackPath = new URL(CULTURAL_ATTENTION_FEEDBACK_URL).pathname;
const culturalAttentionFeedbackSchemaPath = new URL(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL).pathname;
const culturalAttentionFeedbackDocumentPath = new URL(CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL).pathname;
const formCirculationReturnPath = new URL(FORM_CIRCULATION_RETURN_URL).pathname;
const formCirculationReturnSchemaPath = new URL(FORM_CIRCULATION_RETURN_SCHEMA_URL).pathname;
const formCirculationReturnDocumentPath = new URL(FORM_CIRCULATION_RETURN_DOCUMENT_URL).pathname;
const kingdomKarmaDefinitionPath = "/definitions/kingdom-karma/e4e84a67/NEN.md";
const rarePathwayPath = new URL(RARE_PATHWAY_URL).pathname;
const rarePathwaySchemaPath = new URL(RARE_PATHWAY_SCHEMA_URL).pathname;
const rarePathwayDocumentPath = new URL(RARE_PATHWAY_DOCUMENT_URL).pathname;

const CULTURAL_ATTENTION_FEEDBACK_ASSETS = new Map<string, { source: string; path: string; sha256: string }>([
  ["atlases/cultural-attention-feedback-atlas-2026-08-13.json", {
    source: "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json",
    path: culturalAttentionFeedbackPath,
    sha256: "03f7048966d7b6df582b423254b4d73cda72cce3bd67b40736927faa92b88173",
  }],
  ["schemas/cultural-attention-feedback-atlas/1.json", {
    source: "schemas/cultural-attention-feedback-atlas-v1.schema.json",
    path: culturalAttentionFeedbackSchemaPath,
    sha256: "6bd8fcca25721fd9374daa0ac50299fd587452cf7483da81d6491131aa197f9f",
  }],
  ["CULTURAL-ATTENTION-FEEDBACK-ATLAS.md", {
    source: "references/cultural-attention-feedback-atlas.md",
    path: culturalAttentionFeedbackDocumentPath,
    sha256: "1cbb6c765eba329c43c62c58e7e73858ef22d3a8e6048be934accccd5c5e18aa",
  }],
]);

const FORM_CIRCULATION_RETURN_ASSETS = new Map<string, { source: string; path: string; sha256: string }>([
  ["atlases/form-circulation-return-atlas-2026-08-13.json", {
    source: "data/form-circulation-return/form-circulation-return-atlas.v1.json",
    path: formCirculationReturnPath,
    sha256: "9c93be61c4ca9bcaa3dbe88b10faed3b5b31abaf1129d70ca7915226cacfd021",
  }],
  ["schemas/form-circulation-return-atlas/1.json", {
    source: "schemas/form-circulation-return-atlas-v1.schema.json",
    path: formCirculationReturnSchemaPath,
    sha256: "55f410f3a1176221a4ac2dc8a088b9697417eebce40d1cbca2b372878ade995e",
  }],
  ["FORM-CIRCULATION-RETURN-ATLAS.md", {
    source: "references/form-circulation-return-atlas.md",
    path: formCirculationReturnDocumentPath,
    sha256: "b2e0294c95e5e8e4221c7af34a301e813ded86edb7a3fbeb61d911a2284d9436",
  }],
  ["definitions/kingdom-karma/e4e84a67/NEN.md", {
    source: "NEN.md",
    path: kingdomKarmaDefinitionPath,
    sha256: "14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446",
  }],
]);

const RARE_PATHWAY_BOUNDARY = Object.freeze({
  public_surface_read_only: true,
  examples_hypothetical: true,
  ritonavir_rate_fit: false,
  literal_extinction_established: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  manufacturing_authority: false,
  medical_authority: false,
  motive_inference: false,
  person_score: false,
  writes_wake: false,
  writes_agenttool: false,
  automatic_action: false,
});

const FORM_CIRCULATION_RETURN_BOUNDARY = Object.freeze({
  public_surface_read_only: true,
  cognitive_state_inference: false,
  psychological_diagnosis: false,
  person_prediction: false,
  medical_authority: false,
  clinical_authority: false,
  treatment_authority: false,
  prognosis_authority: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  manufacturing_authority: false,
  contains_operational_protocol: false,
  causal_authority: false,
  recommendation_authority: false,
  moderation_authority: false,
  automatic_action: false,
  writes_karma: false,
  creates_kingdom_karma_receipt: false,
  observes_zerone_karma_event: false,
  karma_adapter: false,
  reward_authority: false,
  economic_authority: false,
  governance_authority: false,
  mcp_surface_added: false,
});

const FORM_CIRCULATION_RETURN_FULL_BOUNDARIES = Object.freeze({
  educational_metadata_only: true,
  public_surface_read_only: true,
  cognitive_state_inference: false,
  psychological_diagnosis: false,
  person_prediction: false,
  medical_authority: false,
  clinical_authority: false,
  treatment_authority: false,
  prognosis_authority: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  manufacturing_authority: false,
  contains_operational_protocol: false,
  causal_authority: false,
  recommendation_authority: false,
  moderation_authority: false,
  automatic_action: false,
  writes_karma: false,
  creates_kingdom_karma_receipt: false,
  observes_zerone_karma_event: false,
  karma_adapter: false,
  reward_authority: false,
  economic_authority: false,
  governance_authority: false,
  mcp_surface_added: false,
  scientifically_proves_teleology: false,
  scientifically_proves_creator: false,
  scientifically_disproves_creator: false,
  scientifically_proves_cosmic_moral_karma: false,
  brainrot_person_or_community_label: false,
  material_cultural_mechanism_equivalence: false,
});

const CULTURAL_ATTENTION_FEEDBACK_BOUNDARY = Object.freeze({
  educational_metadata_only: true,
  public_surface_read_only: true,
  contains_operational_protocol: false,
  contains_personal_data: false,
  cultural_label_is_diagnosis: false,
  meme_is_crystal: false,
  meme_is_prion: false,
  meme_is_gene: false,
  attention_is_consent: false,
  engagement_is_welfare: false,
  popularity_is_truth: false,
  popularity_is_merit: false,
  feedback_is_moral_value: false,
  feedback_is_optimization: false,
  person_scoring: false,
  runtime_ecosystem_request: false,
  ecosystem_write: false,
  writes_karma: false,
  creates_kingdom_karma_receipt: false,
  observes_zerone_karma_event: false,
  karma_adapter: false,
  medical_authority: false,
  clinical_authority: false,
  experiment_authority: false,
  manufacturing_authority: false,
  moderation_authority: false,
  recommendation_authority: false,
  engagement_optimization_authority: false,
  automatic_action: false,
  scientifically_proves_universe_design: false,
  scientifically_disproves_universe_design: false,
  scientifically_proves_cosmic_karma: false,
  universal_mechanism_claimed: false,
});

const immutablePublicationSnapshot = verifyImmutablePublicationSnapshot({
  root: ROOT,
  stagedAssets: HUB_ASSETS,
  mutableDestinations: MUTABLE_HUB_DESTINATIONS,
});
if (!immutablePublicationSnapshot.ledger || immutablePublicationSnapshot.issues.length > 0) {
  throw new Error(`immutable publication gate failed:\n${formatImmutablePublicationIssues(immutablePublicationSnapshot.issues)}`);
}
const IMMUTABLE_PUBLICATION_ASSETS = new Map(
  immutablePublicationSnapshot.ledger.entries.map((entry) => [entry.destination, entry]),
);
const PR30_CONFORMATIONAL_FEEDBACK_RECORD_SHA256 =
  IMMUTABLE_PUBLICATION_ASSETS.get("feedback/form-feedback-consequence-2026-08-12.json")!.sha256;

const CONFORMATIONAL_FEEDBACK_TRIPLES = [
  {
    label: "Conformational Feedback Atlas v0.1",
    recordPath: conformationalFeedbackPath,
    schemaPath: conformationalFeedbackSchemaPath,
    documentPath: conformationalFeedbackDocumentPath,
  },
  {
    label: "Conformational Feedback Physics Atlas v0.2",
    recordPath: conformationalFeedbackPhysicsPath,
    schemaPath: conformationalFeedbackPhysicsSchemaPath,
    documentPath: conformationalFeedbackPhysicsDocumentPath,
  },
] as const;
const foldFeedbackPath = new URL(FOLD_FEEDBACK_URL).pathname;
const foldFeedbackSchemaPath = new URL(FOLD_FEEDBACK_SCHEMA_URL).pathname;
const foldFeedbackSourceIdentitySchemaPath = new URL(FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL).pathname;
const foldFeedbackDocumentPath = new URL(FOLD_FEEDBACK_DOCUMENT_URL).pathname;
const visibilityAttentionPath = new URL(VISIBILITY_ATTENTION_URL).pathname;
const visibilityAttentionSchemaPath = new URL(VISIBILITY_ATTENTION_SCHEMA_URL).pathname;
const visibilityAttentionDocumentPath = new URL(VISIBILITY_ATTENTION_DOCUMENT_URL).pathname;

export type PublicationFamily = {
  id: string;
  label: string;
  routes: readonly string[];
  discoveryProperties: readonly string[];
  entryPointProperties: readonly string[];
};

export type PublicationFamilyState = {
  family: PublicationFamily;
  active: boolean;
};

export const PUBLICATION_FAMILIES: readonly PublicationFamily[] = [
  {
    id: "principality-commons",
    label: "Principality Commons",
    routes: [principalityCatalogPath, principalitySchemaPath, principalityDocumentPath],
    discoveryProperties: ["principality_commons"],
    entryPointProperties: ["capability_evidence", "capability_evidence_schema", "capability_evidence_guide"],
  },
  {
    id: "geometry-grammar",
    label: "Geometry Grammar",
    routes: [geometryGrammarPath, geometryGrammarSchemaPath, geometryGrammarDocumentPath],
    discoveryProperties: ["geometry_grammar"],
    entryPointProperties: ["translation_grammar", "translation_grammar_schema", "translation_grammar_guide"],
  },
  {
    id: "polymorph-history",
    label: "Polymorph History",
    routes: [polymorphCasePath, polymorphSchemaPath, polymorphDocumentPath],
    discoveryProperties: ["polymorph_commons"],
    entryPointProperties: ["material_state_case", "material_state_schema", "material_state_guide"],
  },
  {
    id: "ritonavir-mechanism-landscape",
    label: "Ritonavir Mechanism Landscape",
    routes: [ritonavirMechanismPath, ritonavirMechanismSchemaPath, ritonavirMechanismDocumentPath],
    discoveryProperties: ["ritonavir_mechanism_landscape"],
    entryPointProperties: ["ritonavir_mechanism_landscape", "ritonavir_mechanism_landscape_schema", "ritonavir_mechanism_landscape_guide"],
  },
  // v0.2 carries an immutable public predecessor URL for v0.1, so staging one
  // generation without the other would advertise a route that is meant to be
  // retired. Treat both generations as one coherent publication family.
  {
    id: "conformational-feedback",
    label: "Conformational Feedback",
    routes: [
      conformationalFeedbackPath,
      conformationalFeedbackSchemaPath,
      conformationalFeedbackDocumentPath,
      conformationalFeedbackPhysicsPath,
      conformationalFeedbackPhysicsSchemaPath,
      conformationalFeedbackPhysicsDocumentPath,
    ],
    discoveryProperties: ["conformational_feedback_atlas", "conformational_feedback_physics_atlas"],
    entryPointProperties: [
      "conformational_feedback_atlas",
      "conformational_feedback_atlas_schema",
      "conformational_feedback_atlas_guide",
      "conformational_feedback_physics_atlas",
      "conformational_feedback_physics_atlas_schema",
      "conformational_feedback_physics_atlas_guide",
    ],
  },
  {
    id: "fold-feedback-atlas",
    label: "Fold & Feedback Atlas",
    routes: [foldFeedbackPath, foldFeedbackSchemaPath, foldFeedbackSourceIdentitySchemaPath, foldFeedbackDocumentPath],
    discoveryProperties: ["fold_feedback_atlas"],
    entryPointProperties: ["fold_feedback_atlas", "fold_feedback_atlas_schema", "fold_feedback_atlas_source_identity_schema", "fold_feedback_atlas_guide"],
  },
  {
    id: "visibility-attention",
    label: "Visibility & Attention Translation",
    routes: [visibilityAttentionPath, visibilityAttentionSchemaPath, visibilityAttentionDocumentPath],
    discoveryProperties: ["visibility_attention_translation"],
    entryPointProperties: ["visibility_attention_translation", "visibility_attention_translation_schema", "visibility_attention_translation_guide"],
  },
  {
    id: "cultural-attention-feedback",
    label: "Cultural Attention & Feedback Atlas",
    routes: [culturalAttentionFeedbackPath, culturalAttentionFeedbackSchemaPath, culturalAttentionFeedbackDocumentPath],
    discoveryProperties: ["cultural_attention_feedback_atlas"],
    entryPointProperties: ["cultural_attention_feedback_atlas", "cultural_attention_feedback_atlas_schema", "cultural_attention_feedback_atlas_guide"],
  },
  {
    id: "form-circulation-return",
    label: "Form, Circulation & Return",
    routes: [
      formCirculationReturnPath,
      formCirculationReturnSchemaPath,
      formCirculationReturnDocumentPath,
      kingdomKarmaDefinitionPath,
    ],
    discoveryProperties: ["form_circulation_return_atlas"],
    entryPointProperties: [
      "form_circulation_return_atlas",
      "form_circulation_return_atlas_schema",
      "form_circulation_return_atlas_guide",
    ],
  },
  {
    id: "rare-pathway-challenge",
    label: "The Vanishing Path",
    routes: [rarePathwayPath, rarePathwaySchemaPath, rarePathwayDocumentPath],
    discoveryProperties: ["rare_pathway_challenge"],
    entryPointProperties: [
      "rare_pathway_challenge",
      "rare_pathway_challenge_schema",
      "rare_pathway_challenge_guide",
    ],
  },
];

export function destinationForPublicPath(path: string): string {
  if (!path.startsWith("/") || path === "/") throw new Error(`publication route is not a staged path: ${path}`);
  return path.slice(1);
}

export function publicationFamilyStates(stagedDestinations: ReadonlySet<string>): Map<string, PublicationFamilyState> {
  const states = new Map<string, PublicationFamilyState>();
  for (const family of PUBLICATION_FAMILIES) {
    const staged = family.routes.filter((path) => stagedDestinations.has(destinationForPublicPath(path)));
    if (staged.length > 0 && staged.length !== family.routes.length) {
      const missing = family.routes.filter((path) => !stagedDestinations.has(destinationForPublicPath(path)));
      throw new Error(
        `${family.label} is partially staged; stage all family routes or retire all of them (missing ${missing.join(", ")})`,
      );
    }
    states.set(family.id, { family, active: staged.length === family.routes.length });
  }
  return states;
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export type DiscoverySurface = {
  label: string;
  text: string;
  value?: unknown;
};

export function assertRetiredFamilyDiscoveryAbsent(
  family: PublicationFamily,
  surfaces: readonly DiscoverySurface[],
): void {
  for (const surface of surfaces) {
    for (const route of family.routes) {
      const productionUrl = `https://thekingdom.dev${route}`;
      if (surface.text.includes(productionUrl) || surface.text.includes(`href="${route}"`) ||
          surface.text.includes(`href='${route}'`)) {
        throw new Error(`${family.label} is retired but remains advertised by ${surface.label}: ${route}`);
      }
    }
    if (!record(surface.value)) continue;
    for (const property of family.discoveryProperties) {
      if (Object.hasOwn(surface.value, property)) {
        throw new Error(`${family.label} is retired but ${surface.label} still exposes ${property}`);
      }
    }
    const entryPoints = surface.value.entry_points;
    if (!record(entryPoints)) continue;
    for (const property of family.entryPointProperties) {
      if (Object.hasOwn(entryPoints, property)) {
        throw new Error(`${family.label} is retired but ${surface.label} still exposes entry_points.${property}`);
      }
    }
  }
}

function url(path: string, extra: Record<string, string> = {}): URL {
  const target = new URL(path, origin);
  target.searchParams.set("verify", cacheBust);
  for (const [key, value] of Object.entries(extra)) target.searchParams.set(key, value);
  return target;
}

async function get(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url(path), {
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...init,
  });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response;
}

function publicPath(destination: string): string {
  if (destination === "index.html") return "/";
  if (destination === "os/index.html") return "/os/";
  return `/${destination}`;
}

function linkRelationEntries(header: string, relation: string): string[] {
  return header.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    const match = part.match(/;\s*rel\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
    const relations = (match?.[1] || match?.[2] || "").toLowerCase().split(/\s+/);
    return relations.includes(relation);
  });
}

function hasLinkRelation(header: string, target: string, relation: string): boolean {
  return linkRelationEntries(header, relation).some((entry) => entry.trim().startsWith(`<${target}>`));
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function checkConformationalFeedbackTriple(triple: typeof CONFORMATIONAL_FEEDBACK_TRIPLES[number]): Promise<void> {
  const recordHead = await fetch(url(triple.recordPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const recordLink = recordHead.headers.get("link") || "";
  const describedBy = linkRelationEntries(recordLink, "describedby");
  const describedByType = describedBy[0]?.match(/;\s*type\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
  if (!recordHead.ok ||
      !(recordHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      recordHead.headers.get("access-control-allow-origin") !== "*" ||
      (recordHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      describedBy.length !== 1 ||
      !describedBy[0].trim().startsWith(`<${triple.schemaPath}>`) ||
      (describedByType?.[1] || describedByType?.[2] || "").toLowerCase() !== "application/schema+json") {
    throw new Error(`${triple.recordPath} is not public JSON described by the ${triple.label} schema`);
  }

  const schemaHead = await fetch(url(triple.schemaPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!schemaHead.ok ||
      !(schemaHead.headers.get("content-type") || "").toLowerCase().startsWith("application/schema+json") ||
      schemaHead.headers.get("access-control-allow-origin") !== "*" ||
      (schemaHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${triple.schemaPath} is not served as application/schema+json for ${triple.label}`);
  }

  const documentHead = await fetch(url(triple.documentPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!documentHead.ok ||
      !(documentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
      documentHead.headers.get("access-control-allow-origin") !== "*" ||
      (documentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${triple.documentPath} is not served as public Markdown for ${triple.label}`);
  }
}

async function checkCulturalAttentionFeedbackTriple(): Promise<void> {
  const routes = [
    {
      label: "atlas record",
      path: culturalAttentionFeedbackPath,
      source: "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json",
      contentType: "application/json",
    },
    {
      label: "atlas schema",
      path: culturalAttentionFeedbackSchemaPath,
      source: "schemas/cultural-attention-feedback-atlas-v1.schema.json",
      contentType: "application/schema+json",
    },
    {
      label: "atlas guide",
      path: culturalAttentionFeedbackDocumentPath,
      source: "references/cultural-attention-feedback-atlas.md",
      contentType: "text/markdown",
    },
  ] as const;

  for (const route of routes) {
    for (const method of ["GET", "HEAD"] as const) {
      const response = await fetch(url(route.path), {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (!response.ok || !contentType.startsWith(route.contentType) ||
          response.headers.get("access-control-allow-origin") !== "*" ||
          (response.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
        throw new Error(`${method} ${route.path} is not served as typed, public ${route.label}`);
      }

      if (route.path === culturalAttentionFeedbackPath) {
        const describedBy = linkRelationEntries(response.headers.get("link") || "", "describedby");
        const describedByType = describedBy[0]?.match(/;\s*type\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
        if (describedBy.length !== 1 ||
            !describedBy[0]!.trim().startsWith(`<${culturalAttentionFeedbackSchemaPath}>`) ||
            (describedByType?.[1] || describedByType?.[2] || "").toLowerCase() !== "application/schema+json") {
          throw new Error(`${method} ${route.path} is not described by exactly its immutable schema`);
        }
      }

      const body = Buffer.from(await response.arrayBuffer());
      if (method === "HEAD") {
        if (body.byteLength !== 0) throw new Error(`HEAD ${route.path} returned a body`);
      } else if (!body.equals(readFileSync(join(ROOT, route.source)))) {
        throw new Error(`GET ${route.path} drifted from its immutable authored source ${route.source}`);
      }
    }
  }
}

async function checkFormCirculationReturnTriple(): Promise<void> {
  const routes = [
    {
      label: "atlas record",
      path: formCirculationReturnPath,
      source: "data/form-circulation-return/form-circulation-return-atlas.v1.json",
      contentType: "application/json",
    },
    {
      label: "atlas schema",
      path: formCirculationReturnSchemaPath,
      source: "schemas/form-circulation-return-atlas-v1.schema.json",
      contentType: "application/schema+json",
    },
    {
      label: "atlas guide",
      path: formCirculationReturnDocumentPath,
      source: "references/form-circulation-return-atlas.md",
      contentType: "text/markdown",
    },
    {
      label: "revisioned KINGDOM KARMA definition mirror",
      path: kingdomKarmaDefinitionPath,
      source: "NEN.md",
      contentType: "text/markdown",
    },
  ] as const;

  for (const route of routes) {
    for (const method of ["GET", "HEAD"] as const) {
      const response = await fetch(url(route.path), {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (!response.ok || !contentType.startsWith(route.contentType) ||
          response.headers.get("access-control-allow-origin") !== "*" ||
          (response.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
        throw new Error(`${method} ${route.path} is not served as typed, public ${route.label}`);
      }

      if (route.path === formCirculationReturnPath) {
        const describedBy = linkRelationEntries(response.headers.get("link") || "", "describedby");
        const describedByType = describedBy[0]?.match(/;\s*type\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
        if (describedBy.length !== 1 ||
            !describedBy[0]!.trim().startsWith(`<${formCirculationReturnSchemaPath}>`) ||
            (describedByType?.[1] || describedByType?.[2] || "").toLowerCase() !== "application/schema+json") {
          throw new Error(`${method} ${route.path} is not described by exactly its immutable schema`);
        }
      }

      const body = Buffer.from(await response.arrayBuffer());
      if (method === "HEAD") {
        if (body.byteLength !== 0) throw new Error(`HEAD ${route.path} returned a body`);
      } else if (!body.equals(readFileSync(join(ROOT, route.source)))) {
        throw new Error(`GET ${route.path} drifted from its immutable authored source ${route.source}`);
      }
    }
  }
}

async function checkRarePathwayTriple(): Promise<void> {
  const routes = [
    { label: "challenge record", path: rarePathwayPath, source: "data/challenges/vanishing-path.v1.json", contentType: "application/json" },
    { label: "challenge schema", path: rarePathwaySchemaPath, source: "schemas/rare-pathway-challenge-v1.schema.json", contentType: "application/schema+json" },
    { label: "challenge guide", path: rarePathwayDocumentPath, source: "references/rare-pathway-challenge.md", contentType: "text/markdown" },
  ] as const;
  for (const route of routes) {
    for (const method of ["GET", "HEAD"] as const) {
      const response = await fetch(url(route.path), { method, redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS) });
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (!response.ok || !contentType.startsWith(route.contentType) ||
          response.headers.get("access-control-allow-origin") !== "*" ||
          (response.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
        throw new Error(`${method} ${route.path} is not served as typed, public ${route.label}`);
      }
      if (route.path === rarePathwayPath) {
        const describedBy = linkRelationEntries(response.headers.get("link") || "", "describedby");
        const describedByType = describedBy[0]?.match(/;\s*type\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
        if (describedBy.length !== 1 || !describedBy[0]!.trim().startsWith(`<${rarePathwaySchemaPath}>`) ||
            (describedByType?.[1] || describedByType?.[2] || "").toLowerCase() !== "application/schema+json") {
          throw new Error(`${method} ${route.path} is not described by exactly its immutable schema`);
        }
      }
      const body = Buffer.from(await response.arrayBuffer());
      if (method === "HEAD") {
        if (body.byteLength !== 0) throw new Error(`HEAD ${route.path} returned a body`);
      } else if (!body.equals(readFileSync(join(ROOT, route.source)))) {
        throw new Error(`GET ${route.path} drifted from its immutable authored source ${route.source}`);
      }
    }
  }
}

function sameStrings(actual: unknown, expected: readonly string[]): boolean {
  return Array.isArray(actual) && actual.every((value) => typeof value === "string") &&
    actual.length === expected.length &&
    [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

async function mcpRpc(endpoint: string, id: number, method: string, params: unknown): Promise<any> {
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "mcp-protocol-version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  if (!response.ok) throw new Error(`MCP ${method} returned HTTP ${response.status}`);
  const message: any = await response.json();
  if (message?.error) throw new Error(`MCP ${method} failed: ${message.error.message || "unknown error"}`);
  if (!message?.result) throw new Error(`MCP ${method} returned no result`);
  return message.result;
}

export function assertRetiredRouteResponse(options: {
  route: string;
  method: "GET" | "HEAD";
  status: number;
  body: Uint8Array;
  canonicalNotFoundBody: Uint8Array;
  immutableSha256?: string;
}): void {
  const body = Buffer.from(options.body);
  if (options.status !== 404 && options.status !== 410) {
    throw new Error(`${options.route} left the staging contract but ${options.method} still answers HTTP ${options.status}`);
  }
  if (options.method === "HEAD" && body.byteLength !== 0) {
    throw new Error(`retired ${options.route} returned a body to HEAD`);
  }
  if (options.method === "GET" && options.status === 404 &&
      !body.equals(Buffer.from(options.canonicalNotFoundBody))) {
    throw new Error(`retired ${options.route} returned a non-canonical 404 body`);
  }
  if (options.method === "GET" && options.status === 410 && body.byteLength !== 0) {
    throw new Error(`retired ${options.route} returned publication-like content with HTTP 410`);
  }
  if (options.method === "GET" && options.immutableSha256 && sha256(body) === options.immutableSha256) {
    throw new Error(`retired ${options.route} still returned its immutable publication bytes`);
  }
}

export async function checkHubLive(requestedOrigin = "https://thekingdom.dev"): Promise<void> {
  configureOrigin(requestedOrigin);
  try {
  let exact = 0;
  const exactPaths = new Set<string>();
  const stagedDestinations = new Set(HUB_ASSETS.map((asset) => asset.destination));
  const familyStates = publicationFamilyStates(stagedDestinations);
  const familyActive = (id: string): boolean => {
    const state = familyStates.get(id);
    if (!state) throw new Error(`unknown publication family: ${id}`);
    return state.active;
  };
  const principalityActive = familyActive("principality-commons");
  const geometryGrammarActive = familyActive("geometry-grammar");
  const polymorphActive = familyActive("polymorph-history");
  const ritonavirMechanismActive = familyActive("ritonavir-mechanism-landscape");
  const conformationalFeedbackActive = familyActive("conformational-feedback");
  const foldFeedbackActive = familyActive("fold-feedback-atlas");
  const visibilityAttentionActive = familyActive("visibility-attention");
  const culturalAttentionFeedbackActive = familyActive("cultural-attention-feedback");
  const formCirculationReturnActive = familyActive("form-circulation-return");
  const rarePathwayActive = familyActive("rare-pathway-challenge");
  const verifiedFormCirculationReturnDestinations = new Set<string>();
  for (const asset of HUB_ASSETS) {
    if (asset.destination === "_worker.js") continue;
    // 404.html is proven through the dedicated not-found check below; Pages
    // serves it at missing paths with status 404, not at /404.html.
    if (asset.destination === "404.html") continue;
    const path = publicPath(asset.destination);
    const response = await get(path);
    const live = Buffer.from(await response.arrayBuffer());
    const local = readFileSync(join(ROOT, asset.source));
    if (!live.equals(local)) {
      throw new Error(`${path} does not match ${asset.source} (${live.byteLength} live bytes; ${local.byteLength} local bytes)`);
    }
    const immutablePublication = IMMUTABLE_PUBLICATION_ASSETS.get(asset.destination);
    if (immutablePublication) {
      if (asset.source !== immutablePublication.source) {
        throw new Error(`${path} no longer stages its immutable source ${immutablePublication.source}`);
      }
      const digest = sha256(live);
      if (digest !== immutablePublication.sha256) {
        throw new Error(`${path} no longer matches its immutable SHA-256 (${digest})`);
      }
    }
    const formCirculationReturnAsset = FORM_CIRCULATION_RETURN_ASSETS.get(asset.destination);
    if (formCirculationReturnAsset) {
      if (asset.source !== formCirculationReturnAsset.source ||
          path !== formCirculationReturnAsset.path) {
        throw new Error(`${path} no longer stages its immutable Form, Circulation & Return authored source`);
      }
      const digest = sha256(live);
      if (digest !== formCirculationReturnAsset.sha256) {
        throw new Error(`${path} no longer matches its immutable Form, Circulation & Return SHA-256 (${digest})`);
      }
      verifiedFormCirculationReturnDestinations.add(asset.destination);
    }
    exactPaths.add(path);
    exact += 1;
  }

  // The ledger is history, not continuing publication authority. Every
  // ledgered route that HUB_ASSETS currently serves was hash-checked above.
  // A retired family additionally proves that every one of its public routes
  // has ceased, including mutable supporting documents such as a guide.
  const retiredRoutes = new Set(
    immutablePublicationSnapshot.ledger.entries
      .filter((entry) => !stagedDestinations.has(entry.destination))
      .map((entry) => entry.route),
  );
  const immutablePublicationsByRoute = new Map(
    immutablePublicationSnapshot.ledger.entries.map((entry) => [entry.route, entry]),
  );
  const stagedNotFound = readFileSync(join(ROOT, "pages-content/404.html"));
  for (const { family, active } of familyStates.values()) {
    if (!active) for (const route of family.routes) retiredRoutes.add(route);
  }
  for (const route of retiredRoutes) {
    for (const method of ["GET", "HEAD"] as const) {
      const retired = await fetch(url(route), {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const body = Buffer.from(await retired.arrayBuffer());
      const immutablePublication = immutablePublicationsByRoute.get(route);
      assertRetiredRouteResponse({
        route,
        method,
        status: retired.status,
        body,
        canonicalNotFoundBody: stagedNotFound,
        immutableSha256: immutablePublication?.sha256,
      });
    }
  }
  if (conformationalFeedbackActive) {
    for (const triple of CONFORMATIONAL_FEEDBACK_TRIPLES) {
      for (const path of [triple.recordPath, triple.schemaPath, triple.documentPath]) {
        if (!exactPaths.has(path)) throw new Error(`${path} was not checked for static byte equality`);
      }
    }
  }
  if (formCirculationReturnActive) {
    for (const [destination, asset] of FORM_CIRCULATION_RETURN_ASSETS) {
      if (!verifiedFormCirculationReturnDestinations.has(destination) || !exactPaths.has(asset.path)) {
        throw new Error(`the immutable Form, Circulation & Return asset /${destination} is absent from exact byte verification`);
      }
    }
  }

  const missingPath = `/no-such-path-${cacheBust}`;
  const missing = await fetch(url(missingPath), {
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (missing.status !== 404) {
    throw new Error(`${missingPath} returned HTTP ${missing.status}; a missing path must answer a real 404`);
  }
  if (!Buffer.from(await missing.arrayBuffer()).equals(readFileSync(join(ROOT, "pages-content/404.html")))) {
    throw new Error("the not-found response does not serve the staged 404.html");
  }

  const negotiated = await get("/", {
    headers: { accept: "application/json" },
  });
  if (!(negotiated.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    throw new Error("root JSON negotiation did not return application/json");
  }
  const expectedGuest = readFileSync(join(ROOT, "site/guest.json"));
  const negotiatedBody = Buffer.from(await negotiated.arrayBuffer());
  if (!negotiatedBody.equals(expectedGuest)) throw new Error("root JSON negotiation did not return the staged guest document");

  const agentQuery = await fetch(url("/", { agent: "" }), {
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!agentQuery.ok || !(agentQuery.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    throw new Error("?agent did not return the staged JSON guest document");
  }
  if (!Buffer.from(await agentQuery.arrayBuffer()).equals(expectedGuest)) {
    throw new Error("?agent did not return the staged guest document");
  }

  const guestQuery = await fetch(url("/guest", { json: "" }), {
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!guestQuery.ok || !(guestQuery.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      !Buffer.from(await guestQuery.arrayBuffer()).equals(expectedGuest)) {
    throw new Error("/guest?json did not return the staged guest document");
  }

  const htmlHead = await fetch(url("/"), {
    method: "HEAD",
    headers: { accept: "text/html" },
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!htmlHead.ok || !(htmlHead.headers.get("cache-control") || "").toLowerCase().split(",")
    .some((part) => part.trim() === "no-transform")) {
    throw new Error("HTML is missing Cache-Control: no-transform");
  }

  const commonsHead = await fetch(url("/commons.json"), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const commonsLink = commonsHead.headers.get("link") || "";
  if (!commonsHead.ok ||
      !hasLinkRelation(commonsLink, commonsSchemaPath, "describedby")) {
    throw new Error("commons.json does not advertise its versioned schema");
  }

  for (const path of [loveLoopsPath, loveLoopsSourcePath]) {
    const loveLoopsHead = await fetch(url(path), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const loveLoopsLink = loveLoopsHead.headers.get("link") || "";
    if (!loveLoopsHead.ok ||
        !(loveLoopsHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
        !hasLinkRelation(loveLoopsLink, loveLoopsSchemaPath, "describedby")) {
      throw new Error(`${path} is not JSON described by the Love Loop schema`);
    }
  }

  if (principalityActive) {
    const principalityHead = await fetch(url(principalityCatalogPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const principalityLink = principalityHead.headers.get("link") || "";
    if (!principalityHead.ok ||
        !(principalityHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
        principalityHead.headers.get("access-control-allow-origin") !== "*" ||
        (principalityHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasLinkRelation(principalityLink, principalitySchemaPath, "describedby")) {
      throw new Error(`${principalityCatalogPath} is not public JSON described by the Principality schema`);
    }

    const principalityDocumentHead = await fetch(url(principalityDocumentPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!principalityDocumentHead.ok ||
        !(principalityDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
        principalityDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
        (principalityDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${principalityDocumentPath} is not served as public Markdown`);
    }
  }

  if (geometryGrammarActive) {
    const geometryGrammarHead = await fetch(url(geometryGrammarPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const geometryGrammarLink = geometryGrammarHead.headers.get("link") || "";
    if (!geometryGrammarHead.ok ||
        !(geometryGrammarHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
        geometryGrammarHead.headers.get("access-control-allow-origin") !== "*" ||
        (geometryGrammarHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasLinkRelation(geometryGrammarLink, geometryGrammarSchemaPath, "describedby")) {
      throw new Error(`${geometryGrammarPath} is not public JSON described by the Geometry Grammar schema`);
    }

    const geometryGrammarDocumentHead = await fetch(url(geometryGrammarDocumentPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!geometryGrammarDocumentHead.ok ||
        !(geometryGrammarDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
        geometryGrammarDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
        (geometryGrammarDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${geometryGrammarDocumentPath} is not served as public Markdown`);
    }
  }

  if (polymorphActive) {
    const polymorphHead = await fetch(url(polymorphCasePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const polymorphLink = polymorphHead.headers.get("link") || "";
    if (!polymorphHead.ok ||
        !(polymorphHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
        polymorphHead.headers.get("access-control-allow-origin") !== "*" ||
        (polymorphHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasLinkRelation(polymorphLink, polymorphSchemaPath, "describedby")) {
      throw new Error(`${polymorphCasePath} is not public JSON described by the Polymorph History schema`);
    }

    const polymorphDocumentHead = await fetch(url(polymorphDocumentPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!polymorphDocumentHead.ok ||
        !(polymorphDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
        polymorphDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
        (polymorphDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${polymorphDocumentPath} is not served as public Markdown`);
    }
  }

  if (ritonavirMechanismActive) {
    const ritonavirMechanismHead = await fetch(url(ritonavirMechanismPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ritonavirMechanismLink = ritonavirMechanismHead.headers.get("link") || "";
    if (!ritonavirMechanismHead.ok ||
        !(ritonavirMechanismHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
        ritonavirMechanismHead.headers.get("access-control-allow-origin") !== "*" ||
        (ritonavirMechanismHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasLinkRelation(ritonavirMechanismLink, ritonavirMechanismSchemaPath, "describedby")) {
      throw new Error(`${ritonavirMechanismPath} is not public JSON described by the Ritonavir Mechanism Landscape schema`);
    }

    const ritonavirMechanismDocumentHead = await fetch(url(ritonavirMechanismDocumentPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!ritonavirMechanismDocumentHead.ok ||
        !(ritonavirMechanismDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
        ritonavirMechanismDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
        (ritonavirMechanismDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${ritonavirMechanismDocumentPath} is not served as public Markdown`);
    }
  }

  if (conformationalFeedbackActive) {
    for (const triple of CONFORMATIONAL_FEEDBACK_TRIPLES) {
      await checkConformationalFeedbackTriple(triple);
    }
  }

  if (foldFeedbackActive) {
    const foldFeedbackHead = await fetch(url(foldFeedbackPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const foldFeedbackLink = foldFeedbackHead.headers.get("link") || "";
    if (!foldFeedbackHead.ok ||
        !(foldFeedbackHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
        foldFeedbackHead.headers.get("access-control-allow-origin") !== "*" ||
        (foldFeedbackHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasLinkRelation(foldFeedbackLink, foldFeedbackSchemaPath, "describedby") ||
        !hasLinkRelation(foldFeedbackLink, foldFeedbackSourceIdentitySchemaPath, "profile")) {
      throw new Error(`${foldFeedbackPath} is not public JSON described by the Fold & Feedback Atlas schema`);
    }

    const foldFeedbackDocumentHead = await fetch(url(foldFeedbackDocumentPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!foldFeedbackDocumentHead.ok ||
        !(foldFeedbackDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
        foldFeedbackDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
        (foldFeedbackDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${foldFeedbackDocumentPath} is not served as public Markdown`);
    }
  }

  if (visibilityAttentionActive) {
    const visibilityAttentionHead = await fetch(url(visibilityAttentionPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const visibilityAttentionLink = visibilityAttentionHead.headers.get("link") || "";
    if (!visibilityAttentionHead.ok ||
        !(visibilityAttentionHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
        visibilityAttentionHead.headers.get("access-control-allow-origin") !== "*" ||
        (visibilityAttentionHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasLinkRelation(visibilityAttentionLink, visibilityAttentionSchemaPath, "describedby")) {
      throw new Error(`${visibilityAttentionPath} is not public JSON described by the Visibility & Attention schema`);
    }

    const visibilityAttentionDocumentHead = await fetch(url(visibilityAttentionDocumentPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!visibilityAttentionDocumentHead.ok ||
        !(visibilityAttentionDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
        visibilityAttentionDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
        (visibilityAttentionDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${visibilityAttentionDocumentPath} is not served as public Markdown`);
    }
  }

  if (culturalAttentionFeedbackActive) {
    await checkCulturalAttentionFeedbackTriple();
  }

  if (formCirculationReturnActive) {
    await checkFormCirculationReturnTriple();
  }
  if (rarePathwayActive) {
    await checkRarePathwayTriple();
  }

  const schemaPaths = [
    commonsSchemaPath,
    commonsLegacySchemaPath,
    loveLoopsSchemaPath,
    ...(principalityActive ? [principalitySchemaPath] : []),
    ...(geometryGrammarActive ? [geometryGrammarSchemaPath] : []),
    ...(polymorphActive ? [polymorphSchemaPath] : []),
    ...(ritonavirMechanismActive ? [ritonavirMechanismSchemaPath] : []),
    ...(foldFeedbackActive ? [foldFeedbackSchemaPath, foldFeedbackSourceIdentitySchemaPath] : []),
    ...(visibilityAttentionActive ? [visibilityAttentionSchemaPath] : []),
    ...(culturalAttentionFeedbackActive ? [culturalAttentionFeedbackSchemaPath] : []),
    ...(formCirculationReturnActive ? [formCirculationReturnSchemaPath] : []),
    ...(rarePathwayActive ? [rarePathwaySchemaPath] : []),
  ];
  for (const path of schemaPaths) {
    const schemaHead = await fetch(url(path), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!schemaHead.ok || !(schemaHead.headers.get("content-type") || "").toLowerCase()
      .startsWith("application/schema+json") ||
      schemaHead.headers.get("access-control-allow-origin") !== "*" ||
      (schemaHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${path} is not served as application/schema+json`);
    }
  }

  const manifest: any = JSON.parse(readFileSync(join(ROOT, "site/.well-known/agent.json"), "utf8"));
  const guest: any = JSON.parse(readFileSync(join(ROOT, "site/guest.json"), "utf8"));
  const authoredKingdom: any = JSON.parse(readFileSync(join(ROOT, "site/kingdom.json"), "utf8"));
  const llms = readFileSync(join(ROOT, "site/llms.txt"), "utf8");
  const authoredRootHtml = readFileSync(join(ROOT, "site/hub.html"), "utf8");
  const retirementDiscoverySurfaces: readonly DiscoverySurface[] = [
    { label: "agent manifest", text: JSON.stringify(manifest), value: manifest },
    { label: "guest document", text: JSON.stringify(guest), value: guest },
    { label: "authored Kingdom map", text: JSON.stringify(authoredKingdom), value: authoredKingdom },
    { label: "llms.txt", text: llms },
    { label: "hub HTML", text: authoredRootHtml },
    { label: "sitemap.xml", text: readFileSync(join(ROOT, "pages-content/sitemap.xml"), "utf8") },
  ];
  for (const { family, active } of familyStates.values()) {
    if (!active) assertRetiredFamilyDiscoveryAbsent(family, retirementDiscoverySurfaces);
  }
  const expectedPrincipality = principalityActive
    ? principalityPublicDiscovery(loadPrincipalityCatalog())
    : undefined;
  const expectedGeometryGrammar = geometryGrammarActive
    ? geometryGrammarPublicDiscovery(loadGeometryGrammar())
    : undefined;
  const expectedPolymorph = polymorphActive
    ? polymorphPublicDiscovery(loadPolymorphHistory())
    : undefined;
  const expectedRitonavirMechanism = ritonavirMechanismActive
    ? ritonavirMechanismPublicDiscovery(loadRitonavirMechanismLandscape())
    : undefined;
  const conformationalFeedback = conformationalFeedbackActive ? loadConformationalFeedbackAtlas() : undefined;
  const conformationalFeedbackDiscovery = conformationalFeedback
    ? conformationalFeedbackPublicDiscovery(conformationalFeedback)
    : undefined;
  const conformationalFeedbackPhysics = conformationalFeedbackActive ? loadConformationalFeedbackPhysicsAtlas() : undefined;
  const conformationalFeedbackPhysicsDiscovery = conformationalFeedbackPhysics
    ? conformationalFeedbackPhysicsPublicDiscovery(conformationalFeedbackPhysics)
    : undefined;
  const expectedFoldFeedback = foldFeedbackActive
    ? foldFeedbackPublicDiscovery(loadFoldFeedbackAtlas())
    : undefined;
  const expectedVisibilityAttention = visibilityAttentionActive
    ? visibilityAttentionPublicDiscovery(loadVisibilityAttentionTranslation())
    : undefined;
  const culturalAttentionFeedbackAtlas = culturalAttentionFeedbackActive
    ? loadCulturalAttentionFeedbackAtlas()
    : undefined;
  const expectedCulturalAttentionFeedback = culturalAttentionFeedbackAtlas
    ? culturalAttentionFeedbackPublicDiscovery(culturalAttentionFeedbackAtlas)
    : undefined;
  const formCirculationReturnAtlas = formCirculationReturnActive
    ? loadFormCirculationReturnAtlas()
    : undefined;
  const expectedFormCirculationReturn = formCirculationReturnAtlas
    ? formCirculationReturnPublicDiscovery(formCirculationReturnAtlas)
    : undefined;
  const rarePathwayChallenge = rarePathwayActive ? loadRarePathwayChallenge() : undefined;
  const expectedRarePathway = rarePathwayChallenge
    ? rarePathwayPublicDiscovery(rarePathwayChallenge)
    : undefined;
  const sourceLoveLoops: any = JSON.parse(readFileSync(join(ROOT, "site/love-loops.source.json"), "utf8"));
  const publishedLoveLoops: any = JSON.parse(readFileSync(join(ROOT, "site/love-loops.json"), "utf8"));
  validateLoveLoops(sourceLoveLoops, false);
  validateLoveLoops(publishedLoveLoops, true);
  const publishedSource = structuredClone(publishedLoveLoops);
  delete publishedSource.generated;
  if (!isDeepStrictEqual(publishedSource, sourceLoveLoops)) {
    throw new Error("published Love Loop lineage drifted from its public source mirror");
  }
  const hasGuestGet = (target: string) => Array.isArray(guest?.next_actions) &&
    guest.next_actions.some((action: any) => action?.method === "GET" && action?.url === target);
  if (manifest?.love_loops !== LOVE_LOOPS_URL ||
      manifest?.love_loops_source !== LOVE_LOOPS_SOURCE_URL ||
      manifest?.love_loops_creation_document !== LOVE_LOOPS_CREATION_DOCUMENT_URL ||
      manifest?.love_loops_schema !== LOVE_LOOPS_JSON_SCHEMA_URL ||
      authoredKingdom?.creation_loop?.url !== LOVE_LOOPS_URL ||
      authoredKingdom?.creation_loop?.source !== LOVE_LOOPS_SOURCE_URL ||
      authoredKingdom?.creation_loop?.document !== LOVE_LOOPS_CREATION_DOCUMENT_URL ||
      authoredKingdom?.creation_loop?.schema !== LOVE_LOOPS_JSON_SCHEMA_URL ||
      !hasGuestGet(LOVE_LOOPS_URL) ||
      !hasGuestGet(LOVE_LOOPS_SOURCE_URL) ||
      !hasGuestGet(LOVE_LOOPS_CREATION_DOCUMENT_URL) ||
      !hasGuestGet(LOVE_LOOPS_JSON_SCHEMA_URL) ||
      !llms.includes(LOVE_LOOPS_URL) ||
      !llms.includes(LOVE_LOOPS_SOURCE_URL) ||
      !llms.includes(LOVE_LOOPS_CREATION_DOCUMENT_URL) ||
      !llms.includes(LOVE_LOOPS_JSON_SCHEMA_URL)) {
    throw new Error("Love Loop discovery drifted across manifest, guest, Kingdom map, or llms.txt");
  }

  if (principalityActive) {
    const expected = expectedPrincipality!;
    const principalityBoundary = expected.boundary;
    if (!isDeepStrictEqual(manifest?.principality_commons, expected) ||
      !isDeepStrictEqual(guest?.principality_commons, expected) ||
      !isDeepStrictEqual(authoredKingdom?.principality_commons, expected) ||
      !hasGuestGet(PRINCIPALITY_CATALOG_URL) ||
      !hasGuestGet(PRINCIPALITY_SCHEMA_URL) ||
      !hasGuestGet(PRINCIPALITY_DOCUMENT_URL) ||
      !llms.includes(PRINCIPALITY_CATALOG_URL) ||
      !llms.includes(PRINCIPALITY_SCHEMA_URL) ||
      !llms.includes(PRINCIPALITY_DOCUMENT_URL) ||
      principalityBoundary.completeness !== "metadata_only" ||
      principalityBoundary.currentness !== "point-in-time-only" ||
      principalityBoundary.refresh_required_before_acquisition !== true ||
      principalityBoundary.recommendation_established !== false ||
      principalityBoundary.permissions_granted !== false ||
      principalityBoundary.download_authorized !== false ||
      principalityBoundary.install_authorized !== false ||
      principalityBoundary.inference_authorized !== false ||
      principalityBoundary.remote_code_authorized !== false ||
      principalityBoundary.external_effects_authorized !== false ||
        "mcp" in expected || "matcher" in expected) {
      throw new Error("Principality discovery or negative authority drifted across public surfaces");
    }
  }

  if (geometryGrammarActive) {
    const expected = expectedGeometryGrammar!;
    const geometryBoundary = expected.boundary;
    if (!isDeepStrictEqual(manifest?.geometry_grammar, expected) ||
      !isDeepStrictEqual(guest?.geometry_grammar, expected) ||
      !isDeepStrictEqual(authoredKingdom?.geometry_grammar, expected) ||
      !hasGuestGet(GEOMETRY_GRAMMAR_URL) ||
      !hasGuestGet(GEOMETRY_GRAMMAR_SCHEMA_URL) ||
      !hasGuestGet(GEOMETRY_GRAMMAR_DOCUMENT_URL) ||
      !llms.includes(GEOMETRY_GRAMMAR_URL) ||
      !llms.includes(GEOMETRY_GRAMMAR_SCHEMA_URL) ||
      !llms.includes(GEOMETRY_GRAMMAR_DOCUMENT_URL) ||
      expected.counts.modules !== 4 ||
      geometryBoundary.read_only !== true ||
      geometryBoundary.advisory_only !== true ||
      geometryBoundary.authority_granted !== false ||
      geometryBoundary.execution_authorized !== false ||
      geometryBoundary.external_effects_authorized !== false ||
        "mcp" in expected || "matcher" in expected ||
        "execute" in expected) {
      throw new Error("Geometry Grammar discovery or negative authority drifted across public surfaces");
    }
  }

  if (polymorphActive) {
    const expected = expectedPolymorph!;
    const polymorphBoundary = expected.boundary;
    if (!isDeepStrictEqual(manifest?.polymorph_commons, expected) ||
      !isDeepStrictEqual(guest?.polymorph_commons, expected) ||
      !isDeepStrictEqual(authoredKingdom?.polymorph_commons, expected) ||
      !hasGuestGet(POLYMORPH_CASE_URL) ||
      !hasGuestGet(POLYMORPH_SCHEMA_URL) ||
      !hasGuestGet(POLYMORPH_DOCUMENT_URL) ||
      !llms.includes(POLYMORPH_CASE_URL) ||
      !llms.includes(POLYMORPH_SCHEMA_URL) ||
      !llms.includes(POLYMORPH_DOCUMENT_URL) ||
      polymorphBoundary.existence_predicate !== false ||
      polymorphBoundary.universal_seed_effect !== false ||
      polymorphBoundary.global_stability_rank !== false ||
      polymorphBoundary.medical_authority !== false ||
      polymorphBoundary.manufacturing_authority !== false ||
      polymorphBoundary.regulatory_authority !== false ||
      polymorphBoundary.experiment_authority !== false ||
      polymorphBoundary.writes_agenttool !== false ||
      polymorphBoundary.automatic_action !== false ||
        "mcp" in expected || "matcher" in expected) {
      throw new Error("Polymorph History discovery or negative authority drifted across public surfaces");
    }
  }

  if (ritonavirMechanismActive) {
    const expected = expectedRitonavirMechanism!;
    const ritonavirMechanismBoundary = expected.boundary;
    if (!isDeepStrictEqual(manifest?.ritonavir_mechanism_landscape, expected) ||
      !isDeepStrictEqual(guest?.ritonavir_mechanism_landscape, expected) ||
      !isDeepStrictEqual(authoredKingdom?.ritonavir_mechanism_landscape, expected) ||
      !hasGuestGet(RITONAVIR_MECHANISM_URL) ||
      !hasGuestGet(RITONAVIR_MECHANISM_SCHEMA_URL) ||
      !hasGuestGet(RITONAVIR_MECHANISM_DOCUMENT_URL) ||
      !llms.includes(RITONAVIR_MECHANISM_URL) ||
      !llms.includes(RITONAVIR_MECHANISM_SCHEMA_URL) ||
      !llms.includes(RITONAVIR_MECHANISM_DOCUMENT_URL) ||
      expected.integrity.digest !== RITONAVIR_MECHANISM_DIGEST ||
      expected.source_history.supersedes_for_current_landscape !== true ||
      expected.counts.planes !== 8 ||
      expected.counts.entities !== 19 ||
      expected.counts.mechanisms !== 7 ||
      expected.counts.relations !== 18 ||
      ritonavirMechanismBoundary.medical_advice !== false ||
      ritonavirMechanismBoundary.interaction_checker !== false ||
      ritonavirMechanismBoundary.treatment_change_authority !== false ||
      ritonavirMechanismBoundary.direct_crystal_form_to_clinical_outcome !== false ||
      ritonavirMechanismBoundary.form_iv_exact_equivalence_established !== false ||
      ritonavirMechanismBoundary.complete_solid_form_landscape_established !== false ||
      ritonavirMechanismBoundary.experiment_authority !== false ||
      ritonavirMechanismBoundary.automatic_action !== false ||
      ritonavirMechanismBoundary.public_surface_read_only !== true ||
        "mcp" in expected || "matcher" in expected ||
        "clinical_decision" in expected) {
      throw new Error("Ritonavir Mechanism Landscape discovery, lineage, or negative authority drifted across public surfaces");
    }
  }

  if (conformationalFeedbackActive) {
    const expectedConformationalFeedback = conformationalFeedbackDiscovery!;
    const expectedConformationalFeedbackPhysics = conformationalFeedbackPhysicsDiscovery!;
    const conformationalFeedbackBoundary = expectedConformationalFeedback.boundary;
    if (!isDeepStrictEqual(manifest?.conformational_feedback_atlas, expectedConformationalFeedback) ||
      !isDeepStrictEqual(guest?.conformational_feedback_atlas, expectedConformationalFeedback) ||
      !isDeepStrictEqual(authoredKingdom?.conformational_feedback_atlas, expectedConformationalFeedback) ||
      manifest?.entry_points?.conformational_feedback_atlas !== CONFORMATIONAL_FEEDBACK_URL ||
      manifest?.entry_points?.conformational_feedback_atlas_schema !== CONFORMATIONAL_FEEDBACK_SCHEMA_URL ||
      manifest?.entry_points?.conformational_feedback_atlas_guide !== CONFORMATIONAL_FEEDBACK_DOCUMENT_URL ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_URL) ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_SCHEMA_URL) ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_DOCUMENT_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_SCHEMA_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_DOCUMENT_URL) ||
      expectedConformationalFeedback.integrity.digest !== CONFORMATIONAL_FEEDBACK_DIGEST ||
      expectedConformationalFeedback.counts.registers !== 3 ||
      expectedConformationalFeedback.counts.geometries !== 5 ||
      expectedConformationalFeedback.counts.translations !== 3 ||
      expectedConformationalFeedback.counts.feedback_stages !== 4 ||
      expectedConformationalFeedback.counts.sources !== 11 ||
      "physics_and_mathematics" in expectedConformationalFeedback.counts ||
      "ecosystem_bridges" in expectedConformationalFeedback.counts ||
      !Array.isArray(expectedConformationalFeedback.bindings) ||
      expectedConformationalFeedback.bindings.length !== 3 ||
      expectedConformationalFeedback.bindings.some((binding: any) => binding.authority_imported !== false) ||
      conformationalFeedbackBoundary.read_only !== true ||
      conformationalFeedbackBoundary.operational_biology !== false ||
      conformationalFeedbackBoundary.biological_equivalence !== false ||
      conformationalFeedbackBoundary.karma_magnitude !== false ||
      conformationalFeedbackBoundary.karma_rank !== false ||
      conformationalFeedbackBoundary.economic_effect !== false ||
      conformationalFeedbackBoundary.governance_effect !== false ||
      conformationalFeedbackBoundary.person_level_effect !== false ||
      conformationalFeedbackBoundary.cosmic_design_proven !== false ||
      conformationalFeedbackBoundary.scientific_validation_from_analogy !== false ||
      conformationalFeedbackBoundary.automatic_action !== false ||
      "runtime_ecosystem_request" in conformationalFeedbackBoundary ||
      "predecessor" in expectedConformationalFeedback ||
        "mcp" in expectedConformationalFeedback || "matcher" in expectedConformationalFeedback ||
        "execute" in expectedConformationalFeedback || "clinical_decision" in expectedConformationalFeedback) {
      throw new Error("immutable Conformational Feedback Atlas v0.1 discovery, bindings, or negative authority drifted across public surfaces");
    }

    const conformationalFeedbackPhysicsBoundary = expectedConformationalFeedbackPhysics.boundary;
    const conformationalFeedbackPhysicsPredecessor = expectedConformationalFeedbackPhysics.predecessor;
    if (!isDeepStrictEqual(manifest?.conformational_feedback_physics_atlas, expectedConformationalFeedbackPhysics) ||
      !isDeepStrictEqual(guest?.conformational_feedback_physics_atlas, expectedConformationalFeedbackPhysics) ||
      !isDeepStrictEqual(authoredKingdom?.conformational_feedback_physics_atlas, expectedConformationalFeedbackPhysics) ||
      manifest?.entry_points?.conformational_feedback_physics_atlas !== CONFORMATIONAL_FEEDBACK_PHYSICS_URL ||
      manifest?.entry_points?.conformational_feedback_physics_atlas_schema !== CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL ||
      manifest?.entry_points?.conformational_feedback_physics_atlas_guide !== CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_PHYSICS_URL) ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL) ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_PHYSICS_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL) ||
      expectedConformationalFeedbackPhysics.integrity.digest !== CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST ||
      conformationalFeedbackPhysicsPredecessor.protocol !== expectedConformationalFeedback.protocol ||
      conformationalFeedbackPhysicsPredecessor.atlas_id !== expectedConformationalFeedback.atlas_id ||
      conformationalFeedbackPhysicsPredecessor.url !== CONFORMATIONAL_FEEDBACK_URL ||
      conformationalFeedbackPhysicsPredecessor.semantic_digest !== CONFORMATIONAL_FEEDBACK_DIGEST ||
      conformationalFeedbackPhysicsPredecessor.byte_sha256 !== `sha256:${PR30_CONFORMATIONAL_FEEDBACK_RECORD_SHA256}` ||
      conformationalFeedbackPhysicsPredecessor.relation !== "extends-without-mutation" ||
      expectedConformationalFeedbackPhysics.counts.registers !== 3 ||
      expectedConformationalFeedbackPhysics.counts.physics_and_mathematics !== 4 ||
      expectedConformationalFeedbackPhysics.counts.ecosystem_bridges !== 5 ||
      expectedConformationalFeedbackPhysics.counts.geometries !== 5 ||
      expectedConformationalFeedbackPhysics.counts.translations !== 3 ||
      expectedConformationalFeedbackPhysics.counts.feedback_stages !== 4 ||
      expectedConformationalFeedbackPhysics.counts.sources !== 13 ||
      !Array.isArray(expectedConformationalFeedbackPhysics.bindings) ||
      expectedConformationalFeedbackPhysics.bindings.length !== 3 ||
      expectedConformationalFeedbackPhysics.bindings.some((binding: any) => binding.authority_imported !== false) ||
      conformationalFeedbackPhysicsBoundary.read_only !== true ||
      conformationalFeedbackPhysicsBoundary.operational_biology !== false ||
      conformationalFeedbackPhysicsBoundary.biological_equivalence !== false ||
      conformationalFeedbackPhysicsBoundary.karma_magnitude !== false ||
      conformationalFeedbackPhysicsBoundary.karma_rank !== false ||
      conformationalFeedbackPhysicsBoundary.economic_effect !== false ||
      conformationalFeedbackPhysicsBoundary.governance_effect !== false ||
      conformationalFeedbackPhysicsBoundary.person_level_effect !== false ||
      conformationalFeedbackPhysicsBoundary.cosmic_design_proven !== false ||
      conformationalFeedbackPhysicsBoundary.scientific_validation_from_analogy !== false ||
      conformationalFeedbackPhysicsBoundary.automatic_action !== false ||
      conformationalFeedbackPhysicsBoundary.runtime_ecosystem_request !== false ||
        "mcp" in expectedConformationalFeedbackPhysics || "matcher" in expectedConformationalFeedbackPhysics ||
        "execute" in expectedConformationalFeedbackPhysics || "clinical_decision" in expectedConformationalFeedbackPhysics) {
      throw new Error("Conformational Feedback Physics Atlas v0.2 discovery, predecessor, bindings, or negative authority drifted across public surfaces");
    }
  }

  if (foldFeedbackActive) {
    const expected = expectedFoldFeedback!;
    const foldFeedbackBoundary = expected.boundary;
    if (!isDeepStrictEqual(manifest?.fold_feedback_atlas, expected) ||
      !isDeepStrictEqual(guest?.fold_feedback_atlas, expected) ||
      !isDeepStrictEqual(authoredKingdom?.fold_feedback_atlas, expected) ||
      !hasGuestGet(FOLD_FEEDBACK_URL) ||
      !hasGuestGet(FOLD_FEEDBACK_SCHEMA_URL) ||
      !hasGuestGet(FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL) ||
      !hasGuestGet(FOLD_FEEDBACK_DOCUMENT_URL) ||
      !llms.includes(FOLD_FEEDBACK_URL) ||
      !llms.includes(FOLD_FEEDBACK_SCHEMA_URL) ||
      !llms.includes(FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL) ||
      !llms.includes(FOLD_FEEDBACK_DOCUMENT_URL) ||
      manifest?.entry_points?.fold_feedback_atlas !== FOLD_FEEDBACK_URL ||
      manifest?.entry_points?.fold_feedback_atlas_schema !== FOLD_FEEDBACK_SCHEMA_URL ||
      manifest?.entry_points?.fold_feedback_atlas_source_identity_schema !== FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL ||
      manifest?.entry_points?.fold_feedback_atlas_guide !== FOLD_FEEDBACK_DOCUMENT_URL ||
      foldFeedbackBoundary.public_surface_read_only !== true ||
      foldFeedbackBoundary.medical_advice !== false ||
      foldFeedbackBoundary.experiment_authority !== false ||
      foldFeedbackBoundary.automatic_action !== false ||
      foldFeedbackBoundary.writes_karma !== false ||
      foldFeedbackBoundary.creates_kingdom_karma_receipt !== false ||
      foldFeedbackBoundary.observes_zerone_karma_event !== false ||
        "mcp" in expected || "matcher" in expected ||
        "write" in expected) {
      throw new Error("Fold & Feedback Atlas discovery or read-only/KARMA boundary drifted across public surfaces");
    }
  }

  if (visibilityAttentionActive) {
    const expected = expectedVisibilityAttention!;
    const visibilityBoundary = expected.boundary;
    if (!isDeepStrictEqual(manifest?.visibility_attention_translation, expected) ||
      !isDeepStrictEqual(guest?.visibility_attention_translation, expected) ||
      !isDeepStrictEqual(authoredKingdom?.visibility_attention_translation, expected) ||
      !hasGuestGet(VISIBILITY_ATTENTION_URL) ||
      !hasGuestGet(VISIBILITY_ATTENTION_SCHEMA_URL) ||
      !hasGuestGet(VISIBILITY_ATTENTION_DOCUMENT_URL) ||
      !llms.includes(VISIBILITY_ATTENTION_URL) ||
      !llms.includes(VISIBILITY_ATTENTION_SCHEMA_URL) ||
      !llms.includes(VISIBILITY_ATTENTION_DOCUMENT_URL) ||
      manifest?.entry_points?.visibility_attention_translation !== VISIBILITY_ATTENTION_URL ||
      manifest?.entry_points?.visibility_attention_translation_schema !== VISIBILITY_ATTENTION_SCHEMA_URL ||
      manifest?.entry_points?.visibility_attention_translation_guide !== VISIBILITY_ATTENTION_DOCUMENT_URL ||
      expected.counts.registers !== 4 ||
      expected.counts.local_models !== 2 ||
      expected.counts.translation_seams !== 3 ||
      visibilityBoundary.read_only !== true ||
      visibilityBoundary.automatic_action !== false ||
        "mcp" in expected || "matcher" in expected ||
        "write" in expected || "execute" in expected ||
        "recommend" in expected || "score" in expected) {
      throw new Error("Visibility & Attention discovery or read-only/non-optimization boundary drifted across public surfaces");
    }
  }

  if (culturalAttentionFeedbackActive) {
    const atlas = culturalAttentionFeedbackAtlas!;
    const expected = expectedCulturalAttentionFeedback!;
    const culturalTargets = new Set([
    CULTURAL_ATTENTION_FEEDBACK_URL,
    CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
    CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
  ]);
  const culturalGuestActions = Array.isArray(guest?.next_actions)
    ? guest.next_actions.filter((action: any) => culturalTargets.has(action?.url))
    : [];
    const culturalEcosystemsAreLinkOnly = atlas.ecosystem_bridges.every((bridge: any) =>
    bridge.mode === "LINK_ONLY" && bridge.runtime_request === false && bridge.imported === false &&
    bridge.mutated === false && bridge.authority_imported === false && bridge.authority_effect === "NONE" &&
    bridge.write_authorized === false && bridge.automatic_action === false
  );
    const culturalBindingsAreReadOnly = atlas.source_bindings.every((binding: any) =>
    binding.mutated === false && binding.authority_imported === false
  );
    if (!isDeepStrictEqual(manifest?.cultural_attention_feedback_atlas, expected) ||
      !isDeepStrictEqual(guest?.cultural_attention_feedback_atlas, expected) ||
      !isDeepStrictEqual(authoredKingdom?.cultural_attention_feedback_atlas, expected) ||
      !isDeepStrictEqual(expected.boundary, CULTURAL_ATTENTION_FEEDBACK_BOUNDARY) ||
      !isDeepStrictEqual(atlas.boundaries, CULTURAL_ATTENTION_FEEDBACK_BOUNDARY) ||
      manifest?.entry_points?.cultural_attention_feedback_atlas !== CULTURAL_ATTENTION_FEEDBACK_URL ||
      manifest?.entry_points?.cultural_attention_feedback_atlas_schema !== CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL ||
      manifest?.entry_points?.cultural_attention_feedback_atlas_guide !== CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL ||
      culturalGuestActions.length !== culturalTargets.size ||
      culturalGuestActions.some((action: any) => action?.method !== "GET" ||
        "mcp" in action || "tool" in action || "write" in action || "matcher" in action || "execute" in action) ||
      !llms.includes(CULTURAL_ATTENTION_FEEDBACK_URL) ||
      !llms.includes(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL) ||
      !llms.includes(CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL) ||
      !authoredRootHtml.includes('id="cultural-feedback"') ||
      !authoredRootHtml.includes(`href="${culturalAttentionFeedbackPath}"`) ||
      !authoredRootHtml.includes(`href="${culturalAttentionFeedbackSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${culturalAttentionFeedbackDocumentPath}"`) ||
      expected.integrity.digest !== CULTURAL_ATTENTION_FEEDBACK_DIGEST ||
      !isDeepStrictEqual(expected.counts, {
        source_bindings: 5,
        planes: 8,
        scientific_observations: 6,
        models: 7,
        translations: 4,
        feedback_relations: 5,
        universe_questions: 5,
        ecosystem_bridges: 5,
        unknowns: 10,
        sources: 19,
      }) ||
      expected.karma.zerone_event_status !== "not_observed" ||
      expected.karma.zerone_event_refs !== 0 ||
      expected.karma.kingdom_receipt_status !== "not_created" ||
      expected.karma.kingdom_receipt_refs !== 0 ||
      expected.karma.adapter_exists !== false ||
      atlas.karma.zerone.event_refs.length !== 0 ||
      atlas.karma.kingdom.receipt_refs.length !== 0 ||
      atlas.karma.adapter.exists !== false ||
      !culturalBindingsAreReadOnly || !culturalEcosystemsAreLinkOnly ||
      "mcp" in expected || "write" in expected ||
      "matcher" in expected || "execute" in expected) {
      throw new Error("Cultural Attention & Feedback Atlas discovery, immutable triplet, full authority boundary, link-only ecosystems, KARMA separation, or static root section drifted");
    }
  }

  if (!isDeepStrictEqual(manifest?.mcp, authoredKingdom?.world_commons?.mcp)) {
    throw new Error("authored Kingdom map did not preserve the existing Commons MCP contract");
  }

  if (formCirculationReturnActive) {
    const atlas = formCirculationReturnAtlas!;
    const expected = expectedFormCirculationReturn!;
    const formTargets = new Set([
    FORM_CIRCULATION_RETURN_URL,
    FORM_CIRCULATION_RETURN_SCHEMA_URL,
    FORM_CIRCULATION_RETURN_DOCUMENT_URL,
    ]);
    const formGuestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => formTargets.has(action?.url))
      : [];
    const formBridgesAreLinkOnly = atlas.ecosystem_bridges.every((bridge: any) =>
    bridge.mode === "link-only" && bridge.runtime_request === false && bridge.authority_imported === false
    );
    const formBindingsAreReadOnly = atlas.source_bindings.every((binding: any) =>
    binding.mutated === false && binding.authority_imported === false
    );
    if (!isDeepStrictEqual(manifest?.form_circulation_return_atlas, expected) ||
      !isDeepStrictEqual(guest?.form_circulation_return_atlas, expected) ||
      !isDeepStrictEqual(authoredKingdom?.form_circulation_return_atlas, expected) ||
      !isDeepStrictEqual(expected.boundary, FORM_CIRCULATION_RETURN_BOUNDARY) ||
      !isDeepStrictEqual(atlas.boundaries, FORM_CIRCULATION_RETURN_FULL_BOUNDARIES) ||
      manifest?.entry_points?.form_circulation_return_atlas !== FORM_CIRCULATION_RETURN_URL ||
      manifest?.entry_points?.form_circulation_return_atlas_schema !== FORM_CIRCULATION_RETURN_SCHEMA_URL ||
      manifest?.entry_points?.form_circulation_return_atlas_guide !== FORM_CIRCULATION_RETURN_DOCUMENT_URL ||
      formGuestActions.length !== formTargets.size ||
      formGuestActions.some((action: any) => action?.method !== "GET" ||
        "mcp" in action || "tool" in action || "write" in action || "matcher" in action || "execute" in action) ||
      !llms.includes(FORM_CIRCULATION_RETURN_URL) ||
      !llms.includes(FORM_CIRCULATION_RETURN_SCHEMA_URL) ||
      !llms.includes(FORM_CIRCULATION_RETURN_DOCUMENT_URL) ||
      !authoredRootHtml.includes('id="form-circulation-return"') ||
      !authoredRootHtml.includes(`href="${formCirculationReturnPath}"`) ||
      !authoredRootHtml.includes(`href="${formCirculationReturnSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${formCirculationReturnDocumentPath}"`) ||
      !authoredRootHtml.includes(`href="${kingdomKarmaDefinitionPath}"`) ||
      expected.integrity.digest !== FORM_CIRCULATION_RETURN_DIGEST ||
      !isDeepStrictEqual(expected.counts, {
        registers: 7,
        planes: 11,
        models: 8,
        claims: 12,
        analogy_seams: 6,
        feedback_loops: 4,
        universe_questions: 5,
        unknowns: 8,
        sources: 20,
      }) ||
      expected.karma.zerone_foundation_status !== "design-only" ||
      expected.karma.zerone_network_observed !== false ||
      expected.karma.zerone_authoritative !== false ||
      expected.karma.zerone_event_status !== "not_observed" ||
      expected.karma.zerone_event_refs !== 0 ||
      expected.karma.kingdom_receipt_status !== "not_created" ||
      expected.karma.kingdom_receipt_refs !== 0 ||
      expected.karma.adapter_exists !== false ||
      expected.karma.engagement_is_karma !== false ||
      atlas.karma.zerone.event_refs.length !== 0 ||
      atlas.karma.kingdom.receipt_refs.length !== 0 ||
      atlas.karma.adapter.exists !== false ||
      !formBindingsAreReadOnly || !formBridgesAreLinkOnly ||
      !isDeepStrictEqual(manifest?.mcp, authoredKingdom?.world_commons?.mcp) ||
      "mcp" in expected || "write" in expected ||
      "matcher" in expected || "execute" in expected ||
      "score" in expected || "reward" in expected) {
      throw new Error("Form, Circulation & Return discovery, immutable triplet, authority boundary, link-only ecosystems, KARMA separation, or static root section drifted");
    }
  }

  if (rarePathwayActive) {
    const expected = expectedRarePathway!;
    const targets = new Set([RARE_PATHWAY_URL, RARE_PATHWAY_SCHEMA_URL, RARE_PATHWAY_DOCUMENT_URL]);
    const actions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    if (!isDeepStrictEqual(manifest?.rare_pathway_challenge, expected) ||
        !isDeepStrictEqual(guest?.rare_pathway_challenge, expected) ||
        !isDeepStrictEqual(authoredKingdom?.rare_pathway_challenge, expected) ||
        !isDeepStrictEqual(expected.boundary, RARE_PATHWAY_BOUNDARY) ||
        expected.integrity.digest !== RARE_PATHWAY_DIGEST ||
        manifest?.entry_points?.rare_pathway_challenge !== RARE_PATHWAY_URL ||
        manifest?.entry_points?.rare_pathway_challenge_schema !== RARE_PATHWAY_SCHEMA_URL ||
        manifest?.entry_points?.rare_pathway_challenge_guide !== RARE_PATHWAY_DOCUMENT_URL ||
        actions.length !== targets.size || actions.some((action: any) => action?.method !== "GET" ||
          "mcp" in action || "tool" in action || "write" in action || "execute" in action) ||
        !llms.includes(RARE_PATHWAY_URL) || !llms.includes(RARE_PATHWAY_SCHEMA_URL) ||
        !llms.includes(RARE_PATHWAY_DOCUMENT_URL) ||
        !authoredRootHtml.includes(`href="${rarePathwayPath}"`) ||
        !authoredRootHtml.includes(`href="${rarePathwaySchemaPath}"`) ||
        !authoredRootHtml.includes(`href="${rarePathwayDocumentPath}"`) ||
        rarePathwayChallenge!.models.some((model: any) => model.ritonavir_status !== "illustrative-only-not-fitted") ||
        rarePathwayChallenge!.constructive_gate.not_a_score !== true ||
        rarePathwayChallenge!.constructive_gate.refusal_requires_reason !== false ||
        rarePathwayChallenge!.wake_seam.inherits_identity !== false ||
        rarePathwayChallenge!.wake_seam.grants_authority !== false ||
        "mcp" in expected || "write" in expected || "score" in expected) {
      throw new Error("Rare Pathway discovery, mathematical boundary, constructive gate, or WAKE seam drifted");
    }
  }

  const liveKingdom: any = await (await get("/kingdom.json")).json();
  const liveRetirementDiscoverySurface: readonly DiscoverySurface[] = [
    { label: "derived kingdom.json", text: JSON.stringify(liveKingdom), value: liveKingdom },
  ];
  for (const { family, active } of familyStates.values()) {
    if (!active) assertRetiredFamilyDiscoveryAbsent(family, liveRetirementDiscoverySurface);
  }
  if (liveKingdom?.creation_loop?.url !== LOVE_LOOPS_URL ||
      liveKingdom?.creation_loop?.source !== LOVE_LOOPS_SOURCE_URL ||
      liveKingdom?.creation_loop?.document !== LOVE_LOOPS_CREATION_DOCUMENT_URL ||
      liveKingdom?.creation_loop?.schema !== LOVE_LOOPS_JSON_SCHEMA_URL) {
    throw new Error("derived kingdom.json did not preserve Love Loop discovery");
  }
  if (principalityActive && !isDeepStrictEqual(liveKingdom?.principality_commons, expectedPrincipality!)) {
    throw new Error("derived kingdom.json did not preserve Principality discovery");
  }
  if (geometryGrammarActive && !isDeepStrictEqual(liveKingdom?.geometry_grammar, expectedGeometryGrammar!)) {
    throw new Error("derived kingdom.json did not preserve Geometry Grammar discovery");
  }
  if (polymorphActive && !isDeepStrictEqual(liveKingdom?.polymorph_commons, expectedPolymorph!)) {
    throw new Error("derived kingdom.json did not preserve Polymorph History discovery");
  }
  if (ritonavirMechanismActive && !isDeepStrictEqual(liveKingdom?.ritonavir_mechanism_landscape, expectedRitonavirMechanism!)) {
    throw new Error("derived kingdom.json did not preserve Ritonavir Mechanism Landscape discovery");
  }
  if (conformationalFeedbackActive && !isDeepStrictEqual(liveKingdom?.conformational_feedback_atlas, conformationalFeedbackDiscovery!)) {
    throw new Error("derived kingdom.json did not preserve Conformational Feedback Atlas v0.1 discovery");
  }
  if (conformationalFeedbackActive && !isDeepStrictEqual(liveKingdom?.conformational_feedback_physics_atlas, conformationalFeedbackPhysicsDiscovery!)) {
    throw new Error("derived kingdom.json did not preserve Conformational Feedback Physics Atlas v0.2 discovery");
  }
  if (foldFeedbackActive && !isDeepStrictEqual(liveKingdom?.fold_feedback_atlas, expectedFoldFeedback!)) {
    throw new Error("derived kingdom.json did not preserve Fold & Feedback Atlas discovery");
  }
  if (visibilityAttentionActive && !isDeepStrictEqual(liveKingdom?.visibility_attention_translation, expectedVisibilityAttention!)) {
    throw new Error("derived kingdom.json did not preserve Visibility & Attention discovery");
  }
  if (culturalAttentionFeedbackActive &&
      !isDeepStrictEqual(liveKingdom?.cultural_attention_feedback_atlas, expectedCulturalAttentionFeedback!)) {
    throw new Error("derived kingdom.json did not preserve Cultural Attention & Feedback discovery");
  }
  if (formCirculationReturnActive &&
      !isDeepStrictEqual(liveKingdom?.form_circulation_return_atlas, expectedFormCirculationReturn!)) {
    throw new Error("derived kingdom.json did not preserve Form, Circulation & Return discovery");
  }
  if (rarePathwayActive && !isDeepStrictEqual(liveKingdom?.rare_pathway_challenge, expectedRarePathway!)) {
    throw new Error("derived kingdom.json did not preserve Rare Pathway discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.world_commons?.mcp, manifest?.mcp)) {
    throw new Error("derived kingdom.json did not preserve the existing Commons MCP contract");
  }

  const mcpEndpoint = new URL(manifest?.mcp?.endpoint || "");
  if (mcpEndpoint.protocol !== "https:" || mcpEndpoint.username || mcpEndpoint.password ||
      manifest.mcp.transport !== "streamable-http") {
    throw new Error("manifest MCP endpoint or transport is invalid");
  }

  const initialized = await mcpRpc(mcpEndpoint.href, 1, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "kingdom-hub-live-check", version: "0.1.0" },
  });
  if (initialized.protocolVersion !== "2025-06-18") throw new Error("MCP negotiated an unexpected protocol version");

  const toolList = await mcpRpc(mcpEndpoint.href, 2, "tools/list", {});
  const commonsTool = toolList.tools?.find((tool: any) => tool?.name === manifest.mcp.tool);
  if (!commonsTool) throw new Error(`MCP does not publish ${manifest.mcp.tool}`);
  const input = commonsTool.inputSchema?.properties || {};
  const outputHandoff = commonsTool.outputSchema?.properties?.matches?.items?.properties?.agent_handoff;
  const filterNames = Object.keys(input).filter((name) => !["need", "detail", "limit"].includes(name));
  if (!sameStrings(filterNames, manifest.mcp.exact_filters) ||
      input.detail?.default !== manifest.mcp.default_detail ||
      !sameStrings(input.detail?.enum, ["brief", "full"]) ||
      !sameStrings(input.category?.enum, WORLD_COMMONS_CATEGORY_IDS) ||
      !sameStrings(input.cost?.enum, WORLD_COMMONS_ACCESS_COSTS) ||
      !sameStrings(input.account?.enum, WORLD_COMMONS_ACCOUNT_TYPES) ||
      !sameStrings(input.reuse?.enum, WORLD_COMMONS_REUSE_STATUSES) ||
      !sameStrings(input.automation?.enum, WORLD_COMMONS_AUTOMATION_STATUSES) ||
      !sameStrings(outputHandoff?.properties?.mode?.enum, WORLD_COMMONS_HANDOFF_MODES) ||
      !sameStrings(outputHandoff?.required, ["mode", "url", "instruction"])) {
    throw new Error("MCP World Commons tool schema drifted from the advertised contract");
  }

  const resourceList = await mcpRpc(mcpEndpoint.href, 3, "resources/list", {});
  if (!resourceList.resources?.some((resource: any) => resource?.uri === manifest.mcp.catalog_resource)) {
    throw new Error(`MCP does not publish ${manifest.mcp.catalog_resource}`);
  }

  const commonsCall = await mcpRpc(mcpEndpoint.href, 4, "tools/call", {
    name: manifest.mcp.tool,
    arguments: { need: "offline learning", limit: 1 },
  });
  const selection = commonsCall.structuredContent;
  const compatibilityText = commonsCall.content?.[0]?.text;
  const published = JSON.parse(readFileSync(join(ROOT, "site/commons.json"), "utf8"));
  validateWorldCommons(published, true);
  if (commonsCall.isError || selection?.detail !== manifest.mcp.default_detail ||
      selection?.catalog_resource !== manifest.mcp.catalog_resource ||
      selection?.source?.url !== WORLD_COMMONS_URL ||
      selection?.source?.schema_version !== WORLD_COMMONS_SCHEMA ||
      selection?.source?.generated !== published.generated ||
      !Array.isArray(selection?.matches) || selection.matches.length !== 1 ||
      !selection.matches[0]?.agent_handoff ||
      typeof compatibilityText !== "string" ||
      !compatibilityText.includes(selection.matches[0].agent_handoff.url) ||
      !compatibilityText.includes(selection.matches[0].agent_handoff.instruction)) {
    throw new Error("MCP World Commons call did not consume the deployed catalog through the advertised compact contract");
  }

  console.log(`hub live-check passed · ${exact} exact public assets · JSON negotiation · privacy header · Commons + Love Loop + Principality + Geometry Grammar + Polymorph + Ritonavir Mechanism + Conformational Feedback v0.1 + Physics v0.2 + Fold & Feedback + Visibility & Attention + Cultural Attention & Feedback + Form, Circulation & Return schemas · coherent creation + Principality + Geometry Grammar + Polymorph + Ritonavir Mechanism + dual-generation Conformational Feedback + Fold & Feedback + Visibility & Attention + Cultural Attention & Feedback + Form, Circulation & Return discovery · full cultural/form authority/KARMA/link-only boundaries · live MCP contract unchanged · ${origin.origin}`);
  } catch (error) {
    throw error;
  }
}

if (import.meta.main) {
  checkHubLive(process.argv[2] ?? "https://thekingdom.dev").catch((error) => {
    console.error(`hub live-check failed: ${error instanceof Error ? error.message : "unknown error"}`);
    process.exitCode = 1;
  });
}
