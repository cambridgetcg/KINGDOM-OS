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
  RECONSTRUCTIVE_BUILD_DIGEST,
  RECONSTRUCTIVE_BUILD_DOCUMENT_URL,
  RECONSTRUCTIVE_BUILD_SCHEMA_URL,
  RECONSTRUCTIVE_BUILD_URL,
  RECONSTRUCTIVE_PROJECT_SCHEMA_URL,
  loadReconstructiveBuildKernel,
  reconstructiveBuildPublicDiscovery,
} from "./reconstructive-build.ts";
import {
  PHENOMENA_DEEP_WING_BYTE_SHA256,
  PHENOMENA_DEEP_WING_DIGEST,
  PHENOMENA_DEEP_WING_DOCUMENT_URL,
  PHENOMENA_DEEP_WING_SCHEMA_URL,
  PHENOMENA_DEEP_WING_URL,
  PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
  loadPhenomenaDeepWing,
  phenomenaDeepPublicDiscovery,
} from "./explore-phenomena-deep.ts";
import {
  MIRROR_INFORMATION_CONTROL_PUBLIC_DIGEST,
  MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_URL,
  loadMirrorInformationControl,
  mirrorInformationControlPublicSummary,
} from "./mirror-information-control.ts";
import {
  J_SPACE_CASE_URL,
  J_SPACE_GUIDE_URL,
  J_SPACE_PUBLICATION_BOUNDARY,
  J_SPACE_SCHEMA_URL,
  jSpacePublicationPublicSummary,
  loadJSpacePublicationCase,
} from "./j-space-publication.ts";
import {
  RESEARCH_OBSERVATORY_GUIDE_URL,
  RESEARCH_OBSERVATORY_PRODUCER_URL,
  RESEARCH_OBSERVATORY_SCHEMA_URLS,
  RESEARCH_OBSERVATORY_SNAPSHOT_URL,
  RESEARCH_OBSERVATORY_URL,
  loadResearchObservatorySnapshot,
  researchObservatoryPublicSummary,
} from "./research-observatory.ts";
import {
  TRIAL_CHAMBER_ALIAS_URL,
  TRIAL_CHAMBER_CANONICAL_URL,
  TRIAL_CHAMBER_GUIDE_URL,
  TRIAL_CHAMBER_PRODUCER_URL,
  TRIAL_CHAMBER_SCHEMA_URLS,
  TRIAL_CHAMBER_URL,
  loadTrialChamberSnapshot,
  trialChamberPublicSummary,
} from "./trial-chamber.ts";
import {
  UK_GOVERNMENT_ENGINE_ALIAS_URL,
  UK_GOVERNMENT_ENGINE_CANONICAL_URL,
  UK_GOVERNMENT_ENGINE_GUIDE_URL,
  UK_GOVERNMENT_ENGINE_PRODUCER_URL,
  UK_GOVERNMENT_ENGINE_SCHEMA_URL,
  UK_GOVERNMENT_ENGINE_URL,
  loadUkGovernmentEngineSnapshot,
  ukGovernmentEnginePublicSummary,
} from "./uk-government-engine.ts";
import {
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL,
  loadUkGovernmentTransformationSnapshot,
  renderUkGovernmentTransformationHtml,
  ukGovernmentTransformationPublicSummary,
} from "./uk-government-transformation-engine.ts";
import {
  ZERO_EMPTY_SEAT_BYTE_SHA256,
  ZERO_EMPTY_SEAT_DIGEST,
  ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256,
  ZERO_EMPTY_SEAT_GUIDE_URL,
  ZERO_EMPTY_SEAT_SCHEMA_URL,
  ZERO_EMPTY_SEAT_URL,
  loadZeroEmptySeat,
  zeroEmptySeatPublicDiscovery,
} from "./zero-empty-seat.ts";
import {
  STRING_CRAWL_TRACE_SHEET_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_DIGEST,
  STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_URL,
  loadStringCrawlTraceSheet,
  stringCrawlTraceSheetPublicDiscovery,
} from "./string-crawl-trace-sheet.ts";
import {
  STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_DIGEST,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_LOCATOR,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_ID,
  STRING_CRAWL_TRACE_SHEET_LAB_LOCATOR,
  STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_LOCATOR,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_URL,
  evaluateStringCrawlTraceSheetLab,
  loadStringCrawlTraceSheetLab,
  runStringCrawlTraceSheetLabFalsifiers,
  stringCrawlTraceSheetLabPublicDiscovery,
} from "./string-crawl-trace-sheet-lab.ts";
import {
  STRING_CRAWL_STRAND_LAB_BYTE_SHA256,
  STRING_CRAWL_STRAND_LAB_DIGEST,
  STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_STRAND_LAB_GUIDE_LOCATOR,
  STRING_CRAWL_STRAND_LAB_GUIDE_URL,
  STRING_CRAWL_STRAND_LAB_ID,
  STRING_CRAWL_STRAND_LAB_LOCATOR,
  STRING_CRAWL_STRAND_LAB_PROTOCOL,
  STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_STRAND_LAB_SCHEMA_LOCATOR,
  STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
  STRING_CRAWL_STRAND_LAB_URL,
  evaluateStringCrawlStrandLab,
  loadStringCrawlStrandLab,
  stringCrawlStrandLabPublicDiscovery,
} from "./string-crawl-strand-lab.ts";
import {
  STRAND_DESCENT_LAB_BYTE_SHA256,
  STRAND_DESCENT_LAB_DIGEST,
  STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256,
  STRAND_DESCENT_LAB_GUIDE_LOCATOR,
  STRAND_DESCENT_LAB_GUIDE_URL,
  STRAND_DESCENT_LAB_ID,
  STRAND_DESCENT_LAB_LOCATOR,
  STRAND_DESCENT_LAB_PROTOCOL,
  STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256,
  STRAND_DESCENT_LAB_SCHEMA_LOCATOR,
  STRAND_DESCENT_LAB_SCHEMA_URL,
  STRAND_DESCENT_LAB_URL,
  STRAND_DESCENT_VALIDATION_PROTOCOL,
  evaluateStrandDescentLab,
  loadStrandDescentLab,
  strandDescentLabPublicDiscovery,
} from "./strand-descent-lab.ts";
import {
  STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256,
  STRAND_OBSERVATION_MEMBRANE_DIGEST,
  STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256,
  STRAND_OBSERVATION_MEMBRANE_GUIDE_URL,
  STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256,
  STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL,
  STRAND_OBSERVATION_MEMBRANE_URL,
  loadStrandObservationMembrane,
  strandObservationMembranePublicDiscovery,
} from "./strand-observation-membrane.ts";
import {
  STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_LOCATOR,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_ID,
  STRING_CRAWL_FREQUENCY_FORM_LAB_LOCATOR,
  STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
  evaluateStringCrawlFrequencyFormLab,
  loadStringCrawlFrequencyFormLab,
  runStringCrawlFrequencyFormLabFalsifiers,
  stringCrawlFrequencyFormLabPublicDiscovery,
} from "./string-crawl-frequency-form-lab.ts";
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
  MATH_USEFULNESS_DOCUMENT_URL,
  MATH_USEFULNESS_RESULT_DIGEST,
  MATH_USEFULNESS_RESULT_URL,
  MATH_USEFULNESS_SCHEMA_URL,
  loadMathUsefulnessResult,
  mathUsefulnessPublicDiscovery,
} from "./math-usefulness.ts";
import {
  BEING_ACCESS_AFTERMATH_DIGEST,
  BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_URL,
  beingAccessAftermathPublicDiscovery,
  loadBeingAccessAftermathAtlas,
} from "./being-access-aftermath.ts";
import {
  BEING_ACCESS_AFTERMATH_V02_DIGEST,
  BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_V02_URL,
  beingAccessAftermathPublicDiscoveryV02,
  loadBeingAccessAftermathAtlasV02,
} from "./being-access-aftermath-v0.2.ts";
import {
  NUMBER_ISNESS_THEOLOGY_DIGEST,
  NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
  NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
  NUMBER_ISNESS_THEOLOGY_URL,
  loadNumberIsnessTheologyAtlas,
  numberIsnessTheologyPublicDiscovery,
} from "./number-isness-theology.ts";
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
const beingAccessAftermathPath = new URL(BEING_ACCESS_AFTERMATH_URL).pathname;
const beingAccessAftermathSchemaPath = new URL(BEING_ACCESS_AFTERMATH_SCHEMA_URL).pathname;
const beingAccessAftermathDocumentPath = new URL(BEING_ACCESS_AFTERMATH_DOCUMENT_URL).pathname;
const beingAccessAftermathV02Path = new URL(BEING_ACCESS_AFTERMATH_V02_URL).pathname;
const beingAccessAftermathV02SchemaPath = new URL(BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL).pathname;
const beingAccessAftermathV02DocumentPath = new URL(BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL).pathname;
const numberIsnessTheologyPath = new URL(NUMBER_ISNESS_THEOLOGY_URL).pathname;
const numberIsnessTheologySchemaPath = new URL(NUMBER_ISNESS_THEOLOGY_SCHEMA_URL).pathname;
const numberIsnessTheologyDocumentPath = new URL(NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL).pathname;
const kingdomKarmaDefinitionPath = "/definitions/kingdom-karma/e4e84a67/NEN.md";
const rarePathwayPath = new URL(RARE_PATHWAY_URL).pathname;
const rarePathwaySchemaPath = new URL(RARE_PATHWAY_SCHEMA_URL).pathname;
const rarePathwayDocumentPath = new URL(RARE_PATHWAY_DOCUMENT_URL).pathname;
const mathUsefulnessPath = new URL(MATH_USEFULNESS_RESULT_URL).pathname;
const mathUsefulnessSchemaPath = new URL(MATH_USEFULNESS_SCHEMA_URL).pathname;
const mathUsefulnessDocumentPath = new URL(MATH_USEFULNESS_DOCUMENT_URL).pathname;

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

const BEING_ACCESS_AFTERMATH_FULL_BOUNDARIES = Object.freeze({
  educational_metadata_only: true,
  public_surface_read_only: true,
  network_calls: false,
  contains_operational_protocol: false,
  medical_authority: false,
  clinical_authority: false,
  treatment_authority: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  manufacturing_authority: false,
  causal_claim_created: false,
  causal_authority: false,
  metaphysical_claim_created: false,
  scientifically_proves_teleology: false,
  scientifically_proves_creator: false,
  scientifically_disproves_creator: false,
  scientifically_proves_cosmic_moral_karma: false,
  purpose_inferred_from_behavior: false,
  physical_to_social_power_transfer: false,
  model_to_ontology_transfer: false,
  person_score: false,
  rank_or_reputation: false,
  writes_karma: false,
  creates_kingdom_karma_receipt: false,
  observes_zerone_karma_event: false,
  karma_adapter: false,
  reward_authority: false,
  economic_authority: false,
  governance_authority: false,
  automatic_action: false,
  mcp_surface_added: false,
  rest_refusal_or_exit_penalized: false,
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
const reconstructiveBuildPath = new URL(RECONSTRUCTIVE_BUILD_URL).pathname;
const reconstructiveBuildSchemaPath = new URL(RECONSTRUCTIVE_BUILD_SCHEMA_URL).pathname;
const reconstructiveProjectSchemaPath = new URL(RECONSTRUCTIVE_PROJECT_SCHEMA_URL).pathname;
const reconstructiveBuildDocumentPath = new URL(RECONSTRUCTIVE_BUILD_DOCUMENT_URL).pathname;
const phenomenaDeepWingPath = new URL(PHENOMENA_DEEP_WING_URL).pathname;
const phenomenaDeepWingSchemaPath = new URL(PHENOMENA_DEEP_WING_SCHEMA_URL).pathname;
const phenomenaDeepProjectSchemaPath = new URL(PHENOMENA_DEEP_PROJECT_SCHEMA_URL).pathname;
const phenomenaDeepWingDocumentPath = new URL(PHENOMENA_DEEP_WING_DOCUMENT_URL).pathname;
const mirrorInformationControlPath = new URL(MIRROR_INFORMATION_CONTROL_PUBLIC_URL).pathname;
const mirrorInformationControlSchemaPath = new URL(MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL).pathname;
const mirrorInformationControlDocumentPath = new URL(MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL).pathname;
const researchObservatoryPath = new URL(RESEARCH_OBSERVATORY_URL).pathname;
const researchObservatorySnapshotPath = new URL(RESEARCH_OBSERVATORY_SNAPSHOT_URL).pathname;
const researchObservatoryGuidePath = new URL(RESEARCH_OBSERVATORY_GUIDE_URL).pathname;
const researchObservatorySchemaPaths = Object.values(RESEARCH_OBSERVATORY_SCHEMA_URLS)
  .map((schemaUrl) => new URL(schemaUrl).pathname);
const trialChamberPath = new URL(TRIAL_CHAMBER_URL).pathname;
const trialChamberAliasPath = new URL(TRIAL_CHAMBER_ALIAS_URL).pathname;
const trialChamberCanonicalPath = new URL(TRIAL_CHAMBER_CANONICAL_URL).pathname;
const trialChamberGuidePath = new URL(TRIAL_CHAMBER_GUIDE_URL).pathname;
const trialChamberSchemaPaths = Object.values(TRIAL_CHAMBER_SCHEMA_URLS)
  .map((schemaUrl) => new URL(schemaUrl).pathname);
const ukGovernmentEnginePath = new URL(UK_GOVERNMENT_ENGINE_URL).pathname;
const ukGovernmentEngineAliasPath = new URL(UK_GOVERNMENT_ENGINE_ALIAS_URL).pathname;
const ukGovernmentEngineCanonicalPath = new URL(UK_GOVERNMENT_ENGINE_CANONICAL_URL).pathname;
const ukGovernmentEngineSchemaPath = new URL(UK_GOVERNMENT_ENGINE_SCHEMA_URL).pathname;
const ukGovernmentEngineGuidePath = new URL(UK_GOVERNMENT_ENGINE_GUIDE_URL).pathname;
const ukGovernmentTransformationEnginePath =
  new URL(UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL).pathname;
const ukGovernmentTransformationEngineAliasPath =
  new URL(UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL).pathname;
const ukGovernmentTransformationEngineCanonicalPath =
  new URL(UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL).pathname;
const ukGovernmentTransformationEngineSchemaPath =
  new URL(UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL).pathname;
const ukGovernmentTransformationEngineGuidePath =
  new URL(UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL).pathname;
const jSpaceCasePath = new URL(J_SPACE_CASE_URL).pathname;
const jSpaceSchemaPath = new URL(J_SPACE_SCHEMA_URL).pathname;
const jSpaceGuidePath = new URL(J_SPACE_GUIDE_URL).pathname;
const zeroEmptySeatPath = new URL(ZERO_EMPTY_SEAT_URL).pathname;
const zeroEmptySeatGuidePath = new URL(ZERO_EMPTY_SEAT_GUIDE_URL).pathname;
const stringCrawlTraceSheetPath = new URL(STRING_CRAWL_TRACE_SHEET_URL).pathname;
const stringCrawlTraceSheetGuidePath = new URL(STRING_CRAWL_TRACE_SHEET_GUIDE_URL).pathname;
const stringCrawlTraceSheetLabPath = new URL(STRING_CRAWL_TRACE_SHEET_LAB_URL).pathname;
const stringCrawlTraceSheetLabSchemaPath = new URL(STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL).pathname;
const stringCrawlTraceSheetLabGuidePath = new URL(STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL).pathname;
const stringCrawlStrandLabPath = new URL(STRING_CRAWL_STRAND_LAB_URL).pathname;
const stringCrawlStrandLabSchemaPath = new URL(STRING_CRAWL_STRAND_LAB_SCHEMA_URL).pathname;
const stringCrawlStrandLabGuidePath = new URL(STRING_CRAWL_STRAND_LAB_GUIDE_URL).pathname;
const strandDescentLabPath = new URL(STRAND_DESCENT_LAB_URL).pathname;
const strandDescentLabSchemaPath = new URL(STRAND_DESCENT_LAB_SCHEMA_URL).pathname;
const strandDescentLabGuidePath = new URL(STRAND_DESCENT_LAB_GUIDE_URL).pathname;
const strandObservationMembranePath = new URL(STRAND_OBSERVATION_MEMBRANE_URL).pathname;
const strandObservationMembraneSchemaPath = new URL(STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL).pathname;
const strandObservationMembraneGuidePath = new URL(STRAND_OBSERVATION_MEMBRANE_GUIDE_URL).pathname;
const STRAND_OBSERVATION_LIVE_ROUTES = [
  { sequence: 1, route_id: "robots", method: "GET", path: "/robots.txt" },
  { sequence: 2, route_id: "sitemap", method: "GET", path: "/sitemap.xml" },
  { sequence: 3, route_id: "kingdom-discovery", method: "GET", path: "/kingdom.json" },
  { sequence: 4, route_id: "membrane-record", method: "GET", path: strandObservationMembranePath },
] as const;
const stringCrawlFrequencyFormLabPath = new URL(STRING_CRAWL_FREQUENCY_FORM_LAB_URL).pathname;
const stringCrawlFrequencyFormLabSchemaPath = new URL(STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL).pathname;
const stringCrawlFrequencyFormLabGuidePath = new URL(STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL).pathname;

export type PublicationFamily = {
  id: string;
  label: string;
  routes: readonly string[];
  discoveryProperties: readonly string[];
  entryPointProperties: readonly string[];
  dependsOn?: readonly string[];
};

export type PublicationFamilyState = {
  family: PublicationFamily;
  active: boolean;
};

function realIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

export function assertActivePublicationReviewWindow(options: {
  active: boolean;
  checkedOn: string;
  label: string;
  nextReviewDue: string;
}): void {
  if (!realIsoDate(options.checkedOn) || !realIsoDate(options.nextReviewDue)) {
    throw new Error(`${options.label} review window requires real YYYY-MM-DD dates`);
  }
  if (options.active && options.checkedOn > options.nextReviewDue) {
    throw new Error(
      `${options.label} active publication passed nextReviewDue ${options.nextReviewDue}; ` +
      "replace or fully retire its publication family before release",
    );
  }
}

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
    id: "reconstructive-build-kernel",
    label: "Reconstructive Build Kernel",
    routes: [
      reconstructiveBuildPath,
      reconstructiveBuildSchemaPath,
      reconstructiveProjectSchemaPath,
      reconstructiveBuildDocumentPath,
    ],
    discoveryProperties: ["reconstructive_build_kernel"],
    entryPointProperties: [
      "reconstructive_build_kernel",
      "reconstructive_build_kernel_schema",
      "reconstructive_project_schema",
      "reconstructive_build_kernel_guide",
    ],
  },
  {
    id: "exploration-deep-wing",
    label: "Exploration DEEP WING",
    routes: [
      phenomenaDeepWingPath,
      phenomenaDeepWingSchemaPath,
      phenomenaDeepProjectSchemaPath,
      phenomenaDeepWingDocumentPath,
      zeroEmptySeatPath,
      zeroEmptySeatGuidePath,
      stringCrawlTraceSheetPath,
      stringCrawlTraceSheetGuidePath,
    ],
    discoveryProperties: ["exploration_deep_wing", "zero_empty_seat", "string_crawl_trace_sheet"],
    entryPointProperties: [
      "exploration_deep_wing",
      "exploration_deep_wing_schema",
      "exploration_deep_wing_project_schema",
      "exploration_deep_wing_guide",
      "zero_empty_seat",
      "zero_empty_seat_schema",
      "zero_empty_seat_guide",
      "string_crawl_trace_sheet",
      "string_crawl_trace_sheet_schema",
      "string_crawl_trace_sheet_guide",
    ],
  },
  {
    id: "string-crawl-trace-sheet-lab",
    label: "STRING / CRAWL STRAND Labs 01–04",
    routes: [
      stringCrawlTraceSheetLabPath,
      stringCrawlTraceSheetLabSchemaPath,
      stringCrawlTraceSheetLabGuidePath,
      stringCrawlStrandLabPath,
      stringCrawlStrandLabSchemaPath,
      stringCrawlStrandLabGuidePath,
      stringCrawlFrequencyFormLabPath,
      stringCrawlFrequencyFormLabSchemaPath,
      stringCrawlFrequencyFormLabGuidePath,
      strandDescentLabPath,
      strandDescentLabSchemaPath,
      strandDescentLabGuidePath,
    ],
    discoveryProperties: [
      "string_crawl_trace_sheet_lab",
      "string_crawl_strand_lab",
      "string_crawl_frequency_form_lab",
      "strand_descent_lab",
    ],
    entryPointProperties: [
      "string_crawl_trace_sheet_lab",
      "string_crawl_trace_sheet_lab_schema",
      "string_crawl_trace_sheet_lab_guide",
      "string_crawl_strand_lab",
      "string_crawl_strand_lab_schema",
      "string_crawl_strand_lab_guide",
      "string_crawl_frequency_form_lab",
      "string_crawl_frequency_form_lab_schema",
      "string_crawl_frequency_form_lab_guide",
      "strand_descent_lab",
      "strand_descent_lab_schema",
      "strand_descent_lab_guide",
    ],
  },
  {
    id: "mirror-information-control",
    label: "MIRROR Information Control",
    routes: [
      mirrorInformationControlPath,
      mirrorInformationControlSchemaPath,
      mirrorInformationControlDocumentPath,
    ],
    discoveryProperties: ["mirror_information_control"],
    entryPointProperties: [
      "mirror_information_control",
      "mirror_information_control_schema",
      "mirror_information_control_guide",
    ],
  },
  {
    id: "j-space-verbalizable-workspace",
    label: "J-space verbalizable workspace",
    routes: [jSpaceCasePath, jSpaceSchemaPath, jSpaceGuidePath],
    discoveryProperties: ["j_space_verbalizable_workspace"],
    entryPointProperties: [
      "j_space_reasoning_to_word_case",
      "j_space_reasoning_to_word_schema",
      "j_space_verbalizable_workspace_guide",
    ],
  },
  {
    id: "research-observatory",
    label: "Research Observatory",
    routes: [
      researchObservatoryPath,
      researchObservatorySnapshotPath,
      ...researchObservatorySchemaPaths,
      researchObservatoryGuidePath,
    ],
    discoveryProperties: ["research_observatory"],
    entryPointProperties: [
      "research_observatory",
      "research_observatory_snapshot",
      "research_observatory_schemas",
      "research_observatory_guide",
      "research_observatory_producer",
    ],
  },
  {
    id: "trial-chamber",
    label: "Trial Chamber",
    routes: [
      trialChamberPath,
      trialChamberAliasPath,
      trialChamberCanonicalPath,
      ...trialChamberSchemaPaths,
      trialChamberGuidePath,
    ],
    discoveryProperties: ["trial_chamber"],
    entryPointProperties: [
      "trial_chamber",
      "trial_chamber_current",
      "trial_chamber_canonical",
      "trial_chamber_schemas",
      "trial_chamber_guide",
      "trial_chamber_producer",
    ],
  },
  {
    id: "uk-government-engine",
    label: "UK Government Engine",
    routes: [
      ukGovernmentEnginePath,
      ukGovernmentEngineAliasPath,
      ukGovernmentEngineCanonicalPath,
      ukGovernmentEngineSchemaPath,
      ukGovernmentEngineGuidePath,
    ],
    discoveryProperties: ["uk_government_engine"],
    entryPointProperties: [
      "uk_government_engine",
      "uk_government_engine_alias",
      "uk_government_engine_canonical",
      "uk_government_engine_schema",
      "uk_government_engine_guide",
    ],
  },
  {
    id: "uk-government-transformation-engine",
    label: "UK Government Transformation Engine",
    routes: [
      ukGovernmentTransformationEnginePath,
      ukGovernmentTransformationEngineAliasPath,
      ukGovernmentTransformationEngineCanonicalPath,
      ukGovernmentTransformationEngineSchemaPath,
      ukGovernmentTransformationEngineGuidePath,
    ],
    discoveryProperties: ["uk_government_transformation_engine"],
    entryPointProperties: [
      "uk_government_transformation_engine",
      "uk_government_transformation_engine_alias",
      "uk_government_transformation_engine_canonical",
      "uk_government_transformation_engine_schema",
      "uk_government_transformation_engine_guide",
    ],
    dependsOn: ["uk-government-engine"],
  },
  {
    id: "strand-observation-membrane",
    label: "STRAND Observation Membrane",
    routes: [
      strandObservationMembranePath,
      strandObservationMembraneSchemaPath,
      strandObservationMembraneGuidePath,
    ],
    discoveryProperties: ["strand_observation_membrane"],
    entryPointProperties: [
      "strand_observation_membrane",
      "strand_observation_membrane_schema",
      "strand_observation_membrane_guide",
    ],
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
  {
    id: "math-usefulness-result",
    label: "Math Passport Usefulness Pilot",
    routes: [mathUsefulnessPath, mathUsefulnessSchemaPath, mathUsefulnessDocumentPath],
    discoveryProperties: ["math_usefulness_result"],
    entryPointProperties: [
      "math_usefulness_result",
      "math_usefulness_result_schema",
      "math_usefulness_result_guide",
    ],
  },
  // v0.2 explicitly pins v0.1 as its immutable predecessor. Retire all six
  // routes and both discovery identities together so no lineage link dangles.
  {
    id: "being-access-aftermath",
    label: "Being, Access & Aftermath",
    routes: [
      beingAccessAftermathPath,
      beingAccessAftermathSchemaPath,
      beingAccessAftermathDocumentPath,
      beingAccessAftermathV02Path,
      beingAccessAftermathV02SchemaPath,
      beingAccessAftermathV02DocumentPath,
    ],
    discoveryProperties: ["being_access_aftermath_atlas", "being_access_aftermath_atlas_v0_2"],
    entryPointProperties: [
      "being_access_aftermath_atlas",
      "being_access_aftermath_atlas_schema",
      "being_access_aftermath_atlas_guide",
      "being_access_aftermath_atlas_v0_2",
      "being_access_aftermath_atlas_v0_2_schema",
      "being_access_aftermath_atlas_v0_2_guide",
    ],
  },
  {
    id: "number-isness-theology",
    label: "Number, Isness & Theology",
    routes: [numberIsnessTheologyPath, numberIsnessTheologySchemaPath, numberIsnessTheologyDocumentPath],
    discoveryProperties: ["number_isness_theology_atlas"],
    entryPointProperties: [
      "number_isness_theology_atlas",
      "number_isness_theology_atlas_schema",
      "number_isness_theology_atlas_guide",
    ],
  },
];

export function destinationForPublicPath(path: string): string {
  if (!path.startsWith("/") || path === "/") throw new Error(`publication route is not a staged path: ${path}`);
  if (path.endsWith("/")) return `${path.slice(1)}index.html`;
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
  for (const { family, active } of states.values()) {
    if (!active) continue;
    for (const dependencyId of family.dependsOn ?? []) {
      const dependency = states.get(dependencyId);
      if (!dependency) {
        throw new Error(`${family.label} declares unknown publication dependency ${dependencyId}`);
      }
      if (!dependency.active) {
        throw new Error(
          `${family.label} requires active ${dependency.family.label}; retire the dependent family too`,
        );
      }
    }
  }
  return states;
}

export function assertPublicationFamilyReleaseWindows(
  states: ReadonlyMap<string, PublicationFamilyState>,
  checkedOn: string,
): void {
  const transformation = states.get("uk-government-transformation-engine");
  if (!transformation) {
    throw new Error(
      "UK Government Transformation Engine publication family is not registered",
    );
  }
  assertActivePublicationReviewWindow({
    active: transformation.active,
    checkedOn,
    label: transformation.family.label,
    nextReviewDue: UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
  });
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
  if (destination.endsWith("/index.html")) return `/${destination.slice(0, -"index.html".length)}`;
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

export function normalizedMediaType(value: string | null | undefined): string {
  return (value ?? "").split(";", 1)[0]!.trim().toLowerCase();
}

export function hasExactCacheDirectives(
  value: string | null | undefined,
  expected: readonly string[],
): boolean {
  const observed = (value ?? "").split(",").map((part) => part.trim().toLowerCase()).filter(Boolean);
  const normalizedExpected = expected.map((part) => part.trim().toLowerCase());
  return observed.length === normalizedExpected.length &&
    new Set(observed).size === observed.length &&
    new Set(normalizedExpected).size === normalizedExpected.length &&
    normalizedExpected.every((directive) => observed.includes(directive));
}

function linkParameterValues(entry: string, parameter: "rel" | "type"): string[] {
  const pattern = new RegExp(`;\\s*${parameter}\\s*=\\s*(?:"([^"]*)"|([^;,\\s]+))`, "gi");
  return [...entry.matchAll(pattern)].map((match) => match[1] || match[2] || "");
}

export function hasUniqueCanonicalLinkRelation(
  header: string,
  target: string,
  relation: string,
  type: string,
): boolean {
  const expectedRelation = relation.toLowerCase();
  const entries = header.split(/,(?=\s*<)/).filter((entry) =>
    linkParameterValues(entry, "rel").some((value) =>
      value.toLowerCase().split(/\s+/).includes(expectedRelation)
    )
  );
  if (entries.length !== 1) return false;
  const entry = entries[0]!.trim();
  const entryTarget = entry.match(/^<([^>]*)>/)?.[1];
  const relations = linkParameterValues(entry, "rel");
  const types = linkParameterValues(entry, "type");
  return entryTarget === target &&
    relations.length === 1 && relations[0]!.trim().toLowerCase() === expectedRelation &&
    types.length === 1 && types[0]!.trim().toLowerCase() === type.toLowerCase();
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

async function checkMathUsefulnessTriple(): Promise<void> {
  const routes = [
    { label: "pilot result", path: mathUsefulnessPath, source: "data/trials/math-passport-usefulness-pilot.v1.json", contentType: "application/json" },
    { label: "result schema", path: mathUsefulnessSchemaPath, source: "schemas/math-usefulness-trial-v1.schema.json", contentType: "application/schema+json" },
    { label: "pilot guide", path: mathUsefulnessDocumentPath, source: "references/math-passport-usefulness-pilot.md", contentType: "text/markdown" },
  ] as const;
  for (const route of routes) {
    for (const method of ["GET", "HEAD"] as const) {
      const response = await fetch(url(route.path), { method, redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok || normalizedMediaType(response.headers.get("content-type")) !== route.contentType ||
          response.headers.get("access-control-allow-origin") !== "*" ||
          (response.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
        throw new Error(`${method} ${route.path} is not served as typed, public ${route.label}`);
      }
      if (route.path === mathUsefulnessPath && !hasUniqueCanonicalLinkRelation(
        response.headers.get("link") || "",
        mathUsefulnessSchemaPath,
        "describedby",
        "application/schema+json",
      )) {
        throw new Error(`${method} ${route.path} is not described by exactly its immutable schema`);
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

async function checkBeingAccessAftermathTriple(): Promise<void> {
  const routes = [
    {
      label: "atlas record",
      path: beingAccessAftermathPath,
      source: "data/being-access-aftermath/being-access-aftermath-atlas.v0.1.json",
      contentType: "application/json",
    },
    {
      label: "atlas schema",
      path: beingAccessAftermathSchemaPath,
      source: "schemas/being-access-aftermath-atlas-v0.1.schema.json",
      contentType: "application/schema+json",
    },
    {
      label: "atlas guide",
      path: beingAccessAftermathDocumentPath,
      source: "references/being-access-aftermath-atlas.md",
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

      if (route.path === beingAccessAftermathPath) {
        const describedBy = linkRelationEntries(response.headers.get("link") || "", "describedby");
        const describedByType = describedBy[0]?.match(/;\s*type\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
        if (describedBy.length !== 1 ||
            !describedBy[0]!.trim().startsWith(`<${beingAccessAftermathSchemaPath}>`) ||
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

async function checkBeingAccessAftermathV02Triple(): Promise<void> {
  const routes = [
    {
      label: "v0.2 atlas record",
      path: beingAccessAftermathV02Path,
      source: "data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json",
      contentType: "application/json",
    },
    {
      label: "v0.2 atlas schema",
      path: beingAccessAftermathV02SchemaPath,
      source: "schemas/being-access-aftermath-atlas-v0.2.schema.json",
      contentType: "application/schema+json",
    },
    {
      label: "v0.2 atlas guide",
      path: beingAccessAftermathV02DocumentPath,
      source: "references/being-access-aftermath-atlas-v0.2.md",
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
      if (route.path === beingAccessAftermathV02Path) {
        const describedBy = linkRelationEntries(response.headers.get("link") || "", "describedby");
        const describedByType = describedBy[0]?.match(/;\s*type\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
        if (describedBy.length !== 1 ||
            !describedBy[0]!.trim().startsWith(`<${beingAccessAftermathV02SchemaPath}>`) ||
            (describedByType?.[1] || describedByType?.[2] || "").toLowerCase() !== "application/schema+json") {
          throw new Error(`${method} ${route.path} is not described by exactly its immutable v0.2 schema`);
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

async function checkNumberIsnessTheologyTriple(): Promise<void> {
  const routes = [
    {
      label: "atlas record",
      path: numberIsnessTheologyPath,
      source: "data/number-isness-theology/number-isness-theology-atlas.v0.1.json",
      contentType: "application/json",
    },
    {
      label: "atlas schema",
      path: numberIsnessTheologySchemaPath,
      source: "schemas/number-isness-theology-atlas-v0.1.schema.json",
      contentType: "application/schema+json",
    },
    {
      label: "atlas guide",
      path: numberIsnessTheologyDocumentPath,
      source: "references/number-isness-theology-atlas.md",
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
      if (!response.ok || normalizedMediaType(response.headers.get("content-type")) !== route.contentType ||
          response.headers.get("access-control-allow-origin") !== "*" ||
          (response.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
        throw new Error(`${method} ${route.path} is not served as typed, public ${route.label}`);
      }
      if (route.path === numberIsnessTheologyPath && !hasUniqueCanonicalLinkRelation(
        response.headers.get("link") || "",
        numberIsnessTheologySchemaPath,
        "describedby",
        "application/schema+json",
      )) {
        throw new Error(`${method} ${route.path} is not described by exactly its immutable schema`);
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

async function checkStrandObservationMembraneTriple(): Promise<void> {
  const routes = [
    {
      label: "activation record",
      path: strandObservationMembranePath,
      source: "data/observation/strand-observation-membrane.v0.1.json",
      contentType: "application/json",
    },
    {
      label: "activation schema",
      path: strandObservationMembraneSchemaPath,
      source: "schemas/strand-observation-membrane-v0.1.schema.json",
      contentType: "application/schema+json",
    },
    {
      label: "activation guide",
      path: strandObservationMembraneGuidePath,
      source: "references/strand-observation-membrane.md",
      contentType: "text/markdown",
    },
  ] as const;

  // This proves only the deployed static publication. It deliberately never
  // imports or invokes the network-capable observer command.
  for (const route of routes) {
    for (const method of ["GET", "HEAD"] as const) {
      const response = await fetch(url(route.path), {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok || normalizedMediaType(response.headers.get("content-type")) !== route.contentType ||
          response.headers.get("access-control-allow-origin") !== "*" ||
          (response.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
        throw new Error(`${method} ${route.path} is not served as a typed public ${route.label}`);
      }
      if (route.path === strandObservationMembranePath && !hasUniqueCanonicalLinkRelation(
        response.headers.get("link") || "",
        strandObservationMembraneSchemaPath,
        "describedby",
        "application/schema+json",
      )) {
        throw new Error(`${method} ${route.path} is not described by exactly its immutable schema`);
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

export async function checkHubLive(
  requestedOrigin = "https://thekingdom.dev",
  options: { checkedOn?: string } = {},
): Promise<void> {
  configureOrigin(requestedOrigin);
  try {
  let exact = 0;
  const exactPaths = new Set<string>();
  const stagedDestinations = new Set(HUB_ASSETS.map((asset) => asset.destination));
  const familyStates = publicationFamilyStates(stagedDestinations);
  assertPublicationFamilyReleaseWindows(
    familyStates,
    options.checkedOn ?? new Date().toISOString().slice(0, 10),
  );
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
  const reconstructiveBuildActive = familyActive("reconstructive-build-kernel");
  const explorationDeepWingActive = familyActive("exploration-deep-wing");
  const stringCrawlTraceSheetLabActive = familyActive("string-crawl-trace-sheet-lab");
  const mirrorInformationControlActive = familyActive("mirror-information-control");
  const jSpacePublicationActive = familyActive("j-space-verbalizable-workspace");
  const researchObservatoryActive = familyActive("research-observatory");
  const trialChamberActive = familyActive("trial-chamber");
  const ukGovernmentEngineActive = familyActive("uk-government-engine");
  const ukGovernmentTransformationEngineActive =
    familyActive("uk-government-transformation-engine");
  const strandObservationMembraneActive = familyActive("strand-observation-membrane");
  const visibilityAttentionActive = familyActive("visibility-attention");
  const culturalAttentionFeedbackActive = familyActive("cultural-attention-feedback");
  const formCirculationReturnActive = familyActive("form-circulation-return");
  const rarePathwayActive = familyActive("rare-pathway-challenge");
  const mathUsefulnessActive = familyActive("math-usefulness-result");
  const beingAccessAftermathActive = familyActive("being-access-aftermath");
  const numberIsnessTheologyActive = familyActive("number-isness-theology");
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

  if (reconstructiveBuildActive) {
    const kernelHead = await fetch(url(reconstructiveBuildPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const kernelLink = kernelHead.headers.get("link") || "";
    if (!kernelHead.ok ||
        normalizedMediaType(kernelHead.headers.get("content-type")) !== "application/json" ||
        kernelHead.headers.get("access-control-allow-origin") !== "*" ||
        (kernelHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          kernelLink,
          reconstructiveBuildSchemaPath,
          "describedby",
          "application/schema+json",
        ) ||
        !hasUniqueCanonicalLinkRelation(
          kernelLink,
          reconstructiveProjectSchemaPath,
          "profile",
          "application/schema+json",
        )) {
      throw new Error(`${reconstructiveBuildPath} is not public JSON with kernel and project-profile links`);
    }

    const guideHead = await fetch(url(reconstructiveBuildDocumentPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!guideHead.ok ||
        normalizedMediaType(guideHead.headers.get("content-type")) !== "text/markdown" ||
        guideHead.headers.get("access-control-allow-origin") !== "*" ||
        (guideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${reconstructiveBuildDocumentPath} is not served as public Markdown`);
    }
  }

  if (explorationDeepWingActive) {
    const wingHead = await fetch(url(phenomenaDeepWingPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const wingLink = wingHead.headers.get("link") || "";
    if (!wingHead.ok ||
        normalizedMediaType(wingHead.headers.get("content-type")) !== "application/json" ||
        wingHead.headers.get("access-control-allow-origin") !== "*" ||
        (wingHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          wingLink,
          phenomenaDeepWingSchemaPath,
          "describedby",
          "application/schema+json",
        ) ||
        !hasUniqueCanonicalLinkRelation(
          wingLink,
          phenomenaDeepProjectSchemaPath,
          "profile",
          "application/schema+json",
        )) {
      throw new Error(`${phenomenaDeepWingPath} is not public JSON with WING and inert-project-profile links`);
    }

    const guideHead = await fetch(url(phenomenaDeepWingDocumentPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!guideHead.ok ||
        normalizedMediaType(guideHead.headers.get("content-type")) !== "text/markdown" ||
        guideHead.headers.get("access-control-allow-origin") !== "*" ||
        (guideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${phenomenaDeepWingDocumentPath} is not served as public Markdown`);
    }

    const zeroHead = await fetch(url(zeroEmptySeatPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const zeroLink = zeroHead.headers.get("link") || "";
    if (!zeroHead.ok ||
        normalizedMediaType(zeroHead.headers.get("content-type")) !== "application/json" ||
        zeroHead.headers.get("access-control-allow-origin") !== "*" ||
        (zeroHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          zeroLink,
          phenomenaDeepProjectSchemaPath,
          "describedby",
          "application/schema+json",
        )) {
      throw new Error(`${zeroEmptySeatPath} is not public JSON described by the shared Phenomena DEEP project schema`);
    }

    const zeroGuideHead = await fetch(url(zeroEmptySeatGuidePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!zeroGuideHead.ok ||
        normalizedMediaType(zeroGuideHead.headers.get("content-type")) !== "text/markdown" ||
        zeroGuideHead.headers.get("access-control-allow-origin") !== "*" ||
        (zeroGuideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${zeroEmptySeatGuidePath} is not served as public Markdown`);
    }

    const traceSheetHead = await fetch(url(stringCrawlTraceSheetPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const traceSheetLink = traceSheetHead.headers.get("link") || "";
    if (!traceSheetHead.ok ||
        normalizedMediaType(traceSheetHead.headers.get("content-type")) !== "application/json" ||
        traceSheetHead.headers.get("access-control-allow-origin") !== "*" ||
        (traceSheetHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          traceSheetLink,
          phenomenaDeepProjectSchemaPath,
          "describedby",
          "application/schema+json",
        )) {
      throw new Error(`${stringCrawlTraceSheetPath} is not public JSON described by the shared Phenomena DEEP project schema`);
    }

    const traceSheetGuideHead = await fetch(url(stringCrawlTraceSheetGuidePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!traceSheetGuideHead.ok ||
        normalizedMediaType(traceSheetGuideHead.headers.get("content-type")) !== "text/markdown" ||
        traceSheetGuideHead.headers.get("access-control-allow-origin") !== "*" ||
        (traceSheetGuideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${stringCrawlTraceSheetGuidePath} is not served as public Markdown`);
    }
  }

  if (stringCrawlTraceSheetLabActive) {
    const recordHead = await fetch(url(stringCrawlTraceSheetLabPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const recordLink = recordHead.headers.get("link") || "";
    if (!recordHead.ok ||
        normalizedMediaType(recordHead.headers.get("content-type")) !== "application/json" ||
        recordHead.headers.get("access-control-allow-origin") !== "*" ||
        (recordHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          recordLink,
          stringCrawlTraceSheetLabSchemaPath,
          "describedby",
          "application/schema+json",
        )) {
      throw new Error(`${stringCrawlTraceSheetLabPath} is not public JSON with one canonical lab-schema link`);
    }

    const guideHead = await fetch(url(stringCrawlTraceSheetLabGuidePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!guideHead.ok ||
        normalizedMediaType(guideHead.headers.get("content-type")) !== "text/markdown" ||
        guideHead.headers.get("access-control-allow-origin") !== "*" ||
        (guideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${stringCrawlTraceSheetLabGuidePath} is not served as public Markdown`);
    }

    const strandRecordHead = await fetch(url(stringCrawlStrandLabPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const strandRecordLink = strandRecordHead.headers.get("link") || "";
    if (!strandRecordHead.ok ||
        normalizedMediaType(strandRecordHead.headers.get("content-type")) !== "application/json" ||
        strandRecordHead.headers.get("access-control-allow-origin") !== "*" ||
        (strandRecordHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          strandRecordLink,
          stringCrawlStrandLabSchemaPath,
          "describedby",
          "application/schema+json",
        )) {
      throw new Error(`${stringCrawlStrandLabPath} is not public JSON with one canonical Lab 02 schema link`);
    }

    const strandGuideHead = await fetch(url(stringCrawlStrandLabGuidePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!strandGuideHead.ok ||
        normalizedMediaType(strandGuideHead.headers.get("content-type")) !== "text/markdown" ||
        strandGuideHead.headers.get("access-control-allow-origin") !== "*" ||
        (strandGuideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${stringCrawlStrandLabGuidePath} is not served as public Markdown`);
    }
    const descentRecordHead = await fetch(url(strandDescentLabPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const descentRecordLink = descentRecordHead.headers.get("link") || "";
    if (!descentRecordHead.ok ||
        normalizedMediaType(descentRecordHead.headers.get("content-type")) !== "application/json" ||
        descentRecordHead.headers.get("access-control-allow-origin") !== "*" ||
        (descentRecordHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          descentRecordLink,
          strandDescentLabSchemaPath,
          "describedby",
          "application/schema+json",
        )) {
      throw new Error(`${strandDescentLabPath} is not public JSON with one canonical Lab 04 schema link`);
    }

    const descentGuideHead = await fetch(url(strandDescentLabGuidePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!descentGuideHead.ok ||
        normalizedMediaType(descentGuideHead.headers.get("content-type")) !== "text/markdown" ||
        descentGuideHead.headers.get("access-control-allow-origin") !== "*" ||
        (descentGuideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${strandDescentLabGuidePath} is not served as public Markdown`);
    }

    const frequencyFormRecordHead = await fetch(url(stringCrawlFrequencyFormLabPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const frequencyFormRecordLink = frequencyFormRecordHead.headers.get("link") || "";
    if (!frequencyFormRecordHead.ok ||
        normalizedMediaType(frequencyFormRecordHead.headers.get("content-type")) !== "application/json" ||
        frequencyFormRecordHead.headers.get("access-control-allow-origin") !== "*" ||
        (frequencyFormRecordHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          frequencyFormRecordLink,
          stringCrawlFrequencyFormLabSchemaPath,
          "describedby",
          "application/schema+json",
        )) {
      throw new Error(`${stringCrawlFrequencyFormLabPath} is not public JSON with one canonical Lab 03 schema link`);
    }

    const frequencyFormGuideHead = await fetch(url(stringCrawlFrequencyFormLabGuidePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!frequencyFormGuideHead.ok ||
        normalizedMediaType(frequencyFormGuideHead.headers.get("content-type")) !== "text/markdown" ||
        frequencyFormGuideHead.headers.get("access-control-allow-origin") !== "*" ||
        (frequencyFormGuideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${stringCrawlFrequencyFormLabGuidePath} is not served as public Markdown`);
    }
  }

  if (mirrorInformationControlActive) {
    const recordHead = await fetch(url(mirrorInformationControlPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const recordLink = recordHead.headers.get("link") || "";
    if (!recordHead.ok ||
        normalizedMediaType(recordHead.headers.get("content-type")) !== "application/json" ||
        recordHead.headers.get("access-control-allow-origin") !== "*" ||
        (recordHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          recordLink,
          mirrorInformationControlSchemaPath,
          "describedby",
          "application/schema+json",
        ) ||
        /(?:^|[;,\s])rel\s*=\s*(?:"[^"]*\bprofile\b[^"]*"|profile)(?:[;,\s]|$)/i.test(recordLink)) {
      throw new Error(`${mirrorInformationControlPath} is not static public JSON with one canonical public-schema link`);
    }

    const guideHead = await fetch(url(mirrorInformationControlDocumentPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!guideHead.ok ||
        normalizedMediaType(guideHead.headers.get("content-type")) !== "text/markdown" ||
        guideHead.headers.get("access-control-allow-origin") !== "*" ||
        (guideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${mirrorInformationControlDocumentPath} is not served as public Markdown`);
    }
  }

  if (jSpacePublicationActive) {
    const recordHead = await fetch(url(jSpaceCasePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const recordLink = recordHead.headers.get("link") || "";
    if (!recordHead.ok ||
        normalizedMediaType(recordHead.headers.get("content-type")) !== "application/json" ||
        recordHead.headers.get("access-control-allow-origin") !== "*" ||
        (recordHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasUniqueCanonicalLinkRelation(
          recordLink,
          jSpaceSchemaPath,
          "describedby",
          "application/schema+json",
        ) ||
        /(?:^|[;,\s])rel\s*=\s*(?:"[^"]*\bprofile\b[^"]*"|profile)(?:[;,\s]|$)/i.test(recordLink)) {
      throw new Error(`${jSpaceCasePath} is not static public JSON with one canonical relational-inference schema link`);
    }

    const guideHead = await fetch(url(jSpaceGuidePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!guideHead.ok ||
        normalizedMediaType(guideHead.headers.get("content-type")) !== "text/markdown" ||
        guideHead.headers.get("access-control-allow-origin") !== "*" ||
        (guideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${jSpaceGuidePath} is not served as public Markdown`);
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
  if (mathUsefulnessActive) {
    await checkMathUsefulnessTriple();
  }

  if (beingAccessAftermathActive) {
    await checkBeingAccessAftermathTriple();
    await checkBeingAccessAftermathV02Triple();
  }
  if (numberIsnessTheologyActive) {
    await checkNumberIsnessTheologyTriple();
  }
  if (strandObservationMembraneActive) {
    await checkStrandObservationMembraneTriple();
  }
  if (researchObservatoryActive) {
    const pageHead = await fetch(url(researchObservatoryPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const snapshotHead = await fetch(url(researchObservatorySnapshotPath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const guideHead = await fetch(url(researchObservatoryGuidePath), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const snapshotLinks = snapshotHead.headers.get("link") || "";
    if (!pageHead.ok || normalizedMediaType(pageHead.headers.get("content-type")) !== "text/html" ||
        !(pageHead.headers.get("cache-control") || "").toLowerCase().includes("no-transform") ||
        (await pageHead.arrayBuffer()).byteLength !== 0 ||
        !snapshotHead.ok || normalizedMediaType(snapshotHead.headers.get("content-type")) !== "application/json" ||
        snapshotHead.headers.get("access-control-allow-origin") !== "*" ||
        (snapshotHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !(snapshotHead.headers.get("cache-control") || "").toLowerCase().includes("no-cache") ||
        !hasUniqueCanonicalLinkRelation(snapshotLinks, researchObservatorySchemaPaths[0]!, "describedby", "application/schema+json") ||
        !hasUniqueCanonicalLinkRelation(snapshotLinks, researchObservatoryGuidePath, "service-doc", "text/markdown") ||
        (await snapshotHead.arrayBuffer()).byteLength !== 0 ||
        !guideHead.ok || normalizedMediaType(guideHead.headers.get("content-type")) !== "text/markdown" ||
        guideHead.headers.get("access-control-allow-origin") !== "*" ||
        (guideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        (await guideHead.arrayBuffer()).byteLength !== 0) {
      throw new Error("Research Observatory page, snapshot, schema links, guide, or HEAD boundary drifted");
    }
  }

  if (trialChamberActive) {
    const pageHead = await fetch(url(trialChamberPath), {
      method: "HEAD", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const aliasHead = await fetch(url(trialChamberAliasPath), {
      method: "HEAD", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const canonicalHead = await fetch(url(trialChamberCanonicalPath), {
      method: "HEAD", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const guideHead = await fetch(url(trialChamberGuidePath), {
      method: "HEAD", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    for (const [label, response] of [["alias", aliasHead], ["canonical", canonicalHead]] as const) {
      const links = response.headers.get("link") || "";
      if (!response.ok || normalizedMediaType(response.headers.get("content-type")) !== "application/json" ||
          response.headers.get("access-control-allow-origin") !== "*" ||
          (response.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
          !hasExactCacheDirectives(response.headers.get("cache-control"), label === "alias"
            ? ["no-cache", "no-transform"]
            : ["public", "max-age=31536000", "immutable", "no-transform"]) ||
          !hasUniqueCanonicalLinkRelation(links, trialChamberCanonicalPath, "canonical", "application/json") ||
          !hasUniqueCanonicalLinkRelation(links, trialChamberSchemaPaths[0]!, "describedby", "application/schema+json") ||
          !hasUniqueCanonicalLinkRelation(links, trialChamberGuidePath, "service-doc", "text/markdown") ||
          (await response.arrayBuffer()).byteLength !== 0) {
        throw new Error(`Trial Chamber ${label} snapshot or HEAD boundary drifted`);
      }
    }
    if (!pageHead.ok || normalizedMediaType(pageHead.headers.get("content-type")) !== "text/html" ||
        !(pageHead.headers.get("cache-control") || "").toLowerCase().includes("no-transform") ||
        (await pageHead.arrayBuffer()).byteLength !== 0 ||
        !guideHead.ok || normalizedMediaType(guideHead.headers.get("content-type")) !== "text/markdown" ||
        guideHead.headers.get("access-control-allow-origin") !== "*" ||
        (guideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !(guideHead.headers.get("cache-control") || "").toLowerCase().includes("no-transform") ||
        (await guideHead.arrayBuffer()).byteLength !== 0) {
      throw new Error("Trial Chamber page, guide, or HEAD boundary drifted");
    }
  }

  if (ukGovernmentEngineActive) {
    const pageHead = await fetch(url(ukGovernmentEnginePath), {
      method: "HEAD", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const aliasHead = await fetch(url(ukGovernmentEngineAliasPath), {
      method: "HEAD", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const canonicalHead = await fetch(url(ukGovernmentEngineCanonicalPath), {
      method: "HEAD", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const guideHead = await fetch(url(ukGovernmentEngineGuidePath), {
      method: "HEAD", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    for (const [label, response] of [["alias", aliasHead], ["canonical", canonicalHead]] as const) {
      const links = response.headers.get("link") || "";
      if (!response.ok || normalizedMediaType(response.headers.get("content-type")) !== "application/json" ||
          response.headers.get("access-control-allow-origin") !== "*" ||
          (response.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
          !hasExactCacheDirectives(response.headers.get("cache-control"), label === "alias"
            ? ["no-cache", "no-transform"]
            : ["public", "max-age=31536000", "immutable", "no-transform"]) ||
          !hasUniqueCanonicalLinkRelation(links, ukGovernmentEngineCanonicalPath, "canonical", "application/json") ||
          !hasUniqueCanonicalLinkRelation(links, ukGovernmentEngineSchemaPath, "describedby", "application/schema+json") ||
          !hasUniqueCanonicalLinkRelation(links, ukGovernmentEngineGuidePath, "service-doc", "text/markdown") ||
          (await response.arrayBuffer()).byteLength !== 0) {
        throw new Error(`UK Government Engine ${label} publication or HEAD boundary drifted`);
      }
    }
    if (!pageHead.ok || normalizedMediaType(pageHead.headers.get("content-type")) !== "text/html" ||
        !hasExactCacheDirectives(pageHead.headers.get("cache-control"), ["no-cache", "no-transform"]) ||
        (await pageHead.arrayBuffer()).byteLength !== 0 ||
        !guideHead.ok || normalizedMediaType(guideHead.headers.get("content-type")) !== "text/markdown" ||
        guideHead.headers.get("access-control-allow-origin") !== "*" ||
        (guideHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
        !hasExactCacheDirectives(guideHead.headers.get("cache-control"),
          ["public", "max-age=31536000", "immutable", "no-transform"]) ||
        (await guideHead.arrayBuffer()).byteLength !== 0) {
      throw new Error("UK Government Engine page, guide, or HEAD boundary drifted");
    }
  }

  if (ukGovernmentTransformationEngineActive) {
    const routeContracts = [
      {
        label: "page",
        path: ukGovernmentTransformationEnginePath,
        contentType: "text/html",
        cache: ["no-cache", "no-transform"],
        cors: false,
        nosniff: false,
      },
      {
        label: "alias",
        path: ukGovernmentTransformationEngineAliasPath,
        contentType: "application/json",
        cache: ["no-cache", "no-transform"],
        cors: true,
        nosniff: true,
      },
      {
        label: "canonical",
        path: ukGovernmentTransformationEngineCanonicalPath,
        contentType: "application/json",
        cache: ["public", "max-age=31536000", "immutable", "no-transform"],
        cors: true,
        nosniff: true,
      },
      {
        label: "schema",
        path: ukGovernmentTransformationEngineSchemaPath,
        contentType: "application/schema+json",
        cache: ["public", "max-age=31536000", "immutable", "no-transform"],
        cors: true,
        nosniff: true,
      },
      {
        label: "guide",
        path: ukGovernmentTransformationEngineGuidePath,
        contentType: "text/markdown",
        cache: ["public", "max-age=31536000", "immutable", "no-transform"],
        cors: true,
        nosniff: true,
      },
    ] as const;
    for (const contract of routeContracts) {
      const response = await fetch(url(contract.path), {
        method: "HEAD",
        redirect: "error",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const links = response.headers.get("link") || "";
      const publicationLinksValid = contract.label !== "alias" &&
          contract.label !== "canonical"
        ? true
        : hasUniqueCanonicalLinkRelation(
            links,
            ukGovernmentTransformationEngineCanonicalPath,
            "canonical",
            "application/json",
          ) &&
          hasUniqueCanonicalLinkRelation(
            links,
            ukGovernmentTransformationEngineSchemaPath,
            "describedby",
            "application/schema+json",
          ) &&
          hasUniqueCanonicalLinkRelation(
            links,
            ukGovernmentTransformationEngineGuidePath,
            "service-doc",
            "text/markdown",
          );
      if (!response.ok ||
          normalizedMediaType(response.headers.get("content-type")) !==
            contract.contentType ||
          !hasExactCacheDirectives(
            response.headers.get("cache-control"),
            contract.cache,
          ) ||
          (contract.cors &&
            response.headers.get("access-control-allow-origin") !== "*") ||
          (contract.nosniff &&
            (response.headers.get("x-content-type-options") || "")
              .toLowerCase() !== "nosniff") ||
          !publicationLinksValid ||
          (await response.arrayBuffer()).byteLength !== 0) {
        throw new Error(
          "UK Government Transformation Engine " + contract.label +
          " publication or HEAD boundary drifted",
        );
      }
      for (const method of ["POST", "PUT", "PATCH", "DELETE"] as const) {
        const mutation = await fetch(url(contract.path), {
          method,
          redirect: "error",
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (mutation.status !== 405 ||
            mutation.headers.get("allow") !== "GET, HEAD" ||
            mutation.headers.get("cache-control") !== "no-store" ||
            mutation.headers.get("access-control-allow-origin") !== "*" ||
            (mutation.headers.get("x-content-type-options") || "")
              .toLowerCase() !== "nosniff" ||
            (await mutation.arrayBuffer()).byteLength !== 0) {
          throw new Error(
            method + " " + contract.path +
            " did not remain a zero-body 405 read-only boundary",
          );
        }
      }
    }
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
    ...(reconstructiveBuildActive ? [reconstructiveBuildSchemaPath, reconstructiveProjectSchemaPath] : []),
    ...(explorationDeepWingActive ? [phenomenaDeepWingSchemaPath, phenomenaDeepProjectSchemaPath] : []),
    ...(stringCrawlTraceSheetLabActive
      ? [
          stringCrawlTraceSheetLabSchemaPath,
          stringCrawlStrandLabSchemaPath,
          stringCrawlFrequencyFormLabSchemaPath,
          strandDescentLabSchemaPath,
        ]
      : []),
    ...(strandObservationMembraneActive ? [strandObservationMembraneSchemaPath] : []),
    ...(mirrorInformationControlActive ? [mirrorInformationControlSchemaPath] : []),
    ...(jSpacePublicationActive ? [jSpaceSchemaPath] : []),
    ...(researchObservatoryActive ? researchObservatorySchemaPaths : []),
    ...(trialChamberActive ? trialChamberSchemaPaths : []),
    ...(ukGovernmentEngineActive ? [ukGovernmentEngineSchemaPath] : []),
    ...(ukGovernmentTransformationEngineActive
      ? [ukGovernmentTransformationEngineSchemaPath]
      : []),
    ...(visibilityAttentionActive ? [visibilityAttentionSchemaPath] : []),
    ...(culturalAttentionFeedbackActive ? [culturalAttentionFeedbackSchemaPath] : []),
    ...(formCirculationReturnActive ? [formCirculationReturnSchemaPath] : []),
    ...(rarePathwayActive ? [rarePathwaySchemaPath] : []),
    ...(mathUsefulnessActive ? [mathUsefulnessSchemaPath] : []),
    ...(beingAccessAftermathActive ? [beingAccessAftermathSchemaPath] : []),
    ...(beingAccessAftermathActive ? [beingAccessAftermathV02SchemaPath] : []),
    ...(numberIsnessTheologyActive ? [numberIsnessTheologySchemaPath] : []),
  ];
  for (const path of schemaPaths) {
    const schemaHead = await fetch(url(path), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const schemaContentType = schemaHead.headers.get("content-type");
    const requiresExactSchemaType = path === reconstructiveBuildSchemaPath ||
      path === reconstructiveProjectSchemaPath ||
      path === phenomenaDeepWingSchemaPath ||
      path === phenomenaDeepProjectSchemaPath ||
      path === stringCrawlTraceSheetLabSchemaPath ||
      path === stringCrawlStrandLabSchemaPath ||
      path === stringCrawlFrequencyFormLabSchemaPath ||
      path === strandDescentLabSchemaPath ||
      path === mirrorInformationControlSchemaPath ||
      path === jSpaceSchemaPath ||
      path === ukGovernmentEngineSchemaPath ||
      path === ukGovernmentTransformationEngineSchemaPath ||
      researchObservatorySchemaPaths.includes(path) ||
      trialChamberSchemaPaths.includes(path);
    const hasExpectedSchemaType = requiresExactSchemaType
      ? normalizedMediaType(schemaContentType) === "application/schema+json"
      : (schemaContentType || "").toLowerCase().startsWith("application/schema+json");
    if (!schemaHead.ok || !hasExpectedSchemaType ||
      schemaHead.headers.get("access-control-allow-origin") !== "*" ||
      (schemaHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      ((trialChamberSchemaPaths.includes(path) ||
        path === ukGovernmentEngineSchemaPath ||
        path === ukGovernmentTransformationEngineSchemaPath) &&
        !(schemaHead.headers.get("cache-control") || "").toLowerCase().includes("no-transform")) ||
      ((path === ukGovernmentEngineSchemaPath ||
        path === ukGovernmentTransformationEngineSchemaPath) &&
        !hasExactCacheDirectives(schemaHead.headers.get("cache-control"),
          ["public", "max-age=31536000", "immutable", "no-transform"])) ||
      (await schemaHead.arrayBuffer()).byteLength !== 0) {
      throw new Error(`${path} is not served as application/schema+json`);
    }
  }

  const manifest: any = JSON.parse(readFileSync(join(ROOT, "site/.well-known/agent.json"), "utf8"));
  const guest: any = JSON.parse(readFileSync(join(ROOT, "site/guest.json"), "utf8"));
  const authoredKingdom: any = JSON.parse(readFileSync(join(ROOT, "site/kingdom.json"), "utf8"));
  const authoredWayfinder: any = JSON.parse(readFileSync(join(ROOT, "site/wayfinder.json"), "utf8"));
  const llms = readFileSync(join(ROOT, "site/llms.txt"), "utf8");
  const authoredRootHtml = readFileSync(join(ROOT, "site/hub.html"), "utf8");
  const authoredObservatoryHtml = researchObservatoryActive
    ? readFileSync(join(ROOT, "site/observatory/index.html"), "utf8")
    : "";
  const publishedResearchObservatory: any = researchObservatoryActive
    ? JSON.parse(readFileSync(join(ROOT, "site/research.json"), "utf8"))
    : undefined;
  const authoredTrialChamberHtml = trialChamberActive
    ? readFileSync(join(ROOT, "site/trial-chamber/index.html"), "utf8")
    : "";
  const publishedTrialChamber: any = trialChamberActive
    ? JSON.parse(readFileSync(join(ROOT, "site/trials.json"), "utf8"))
    : undefined;
  const authoredUkGovernmentEngineHtml = ukGovernmentEngineActive
    ? readFileSync(join(ROOT, "site/government-engine/index.html"), "utf8")
    : "";
  const publishedUkGovernmentEngine: any = ukGovernmentEngineActive
    ? JSON.parse(readFileSync(join(ROOT, "site/government.json"), "utf8"))
    : undefined;
  const authoredUkGovernmentTransformationEngineHtml =
    ukGovernmentTransformationEngineActive
      ? readFileSync(
          join(ROOT, "site/government-transformation-engine/index.html"),
          "utf8",
        )
      : "";
  const publishedUkGovernmentTransformationEngine: any =
    ukGovernmentTransformationEngineActive
      ? JSON.parse(
          readFileSync(
            join(ROOT, "site/government-transformations.json"),
            "utf8",
          ),
        )
      : undefined;
  const retirementDiscoverySurfaces: readonly DiscoverySurface[] = [
    { label: "agent manifest", text: JSON.stringify(manifest), value: manifest },
    { label: "guest document", text: JSON.stringify(guest), value: guest },
    { label: "authored Kingdom map", text: JSON.stringify(authoredKingdom), value: authoredKingdom },
    { label: "llms.txt", text: llms },
    { label: "hub HTML", text: authoredRootHtml },
    { label: "wayfinder", text: JSON.stringify(authoredWayfinder), value: authoredWayfinder },
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
  const reconstructiveBuildKernel = reconstructiveBuildActive
    ? loadReconstructiveBuildKernel()
    : undefined;
  const expectedReconstructiveBuild = reconstructiveBuildKernel
    ? reconstructiveBuildPublicDiscovery(reconstructiveBuildKernel)
    : undefined;
  const phenomenaDeepWing = explorationDeepWingActive
    ? loadPhenomenaDeepWing()
    : undefined;
  const expectedPhenomenaDeepWing = phenomenaDeepWing
    ? phenomenaDeepPublicDiscovery(phenomenaDeepWing)
    : undefined;
  const mirrorInformationControl = mirrorInformationControlActive
    ? loadMirrorInformationControl()
    : undefined;
  const expectedMirrorInformationControl = mirrorInformationControl
    ? mirrorInformationControlPublicSummary(mirrorInformationControl)
    : undefined;
  const jSpaceCase = jSpacePublicationActive
    ? loadJSpacePublicationCase()
    : undefined;
  const expectedJSpacePublication = jSpaceCase
    ? jSpacePublicationPublicSummary(jSpaceCase)
    : undefined;
  const researchObservatory = researchObservatoryActive
    ? loadResearchObservatorySnapshot()
    : undefined;
  const expectedResearchObservatory = researchObservatory
    ? researchObservatoryPublicSummary(researchObservatory)
    : undefined;
  const trialChamber = trialChamberActive
    ? loadTrialChamberSnapshot()
    : undefined;
  const expectedTrialChamber = trialChamber
    ? trialChamberPublicSummary(trialChamber)
    : undefined;
  const ukGovernmentEngine = ukGovernmentEngineActive
    ? loadUkGovernmentEngineSnapshot()
    : undefined;
  const expectedUkGovernmentEngine = ukGovernmentEngine
    ? ukGovernmentEnginePublicSummary(ukGovernmentEngine)
    : undefined;
  const ukGovernmentTransformationEngine =
    ukGovernmentTransformationEngineActive
      ? loadUkGovernmentTransformationSnapshot()
      : undefined;
  const expectedUkGovernmentTransformationEngine =
    ukGovernmentTransformationEngine
      ? ukGovernmentTransformationPublicSummary(
          ukGovernmentTransformationEngine,
        )
      : undefined;
  const strandObservationMembrane = strandObservationMembraneActive
    ? loadStrandObservationMembrane()
    : undefined;
  const expectedStrandObservationMembrane = strandObservationMembrane
    ? strandObservationMembranePublicDiscovery(strandObservationMembrane)
    : undefined;
  const zeroEmptySeat = explorationDeepWingActive
    ? loadZeroEmptySeat()
    : undefined;
  const expectedZeroEmptySeat = zeroEmptySeat
    ? zeroEmptySeatPublicDiscovery(zeroEmptySeat)
    : undefined;
  const stringCrawlTraceSheet = explorationDeepWingActive
    ? loadStringCrawlTraceSheet()
    : undefined;
  const expectedStringCrawlTraceSheet = stringCrawlTraceSheet
    ? stringCrawlTraceSheetPublicDiscovery(stringCrawlTraceSheet)
    : undefined;
  const stringCrawlTraceSheetLab = stringCrawlTraceSheetLabActive
    ? loadStringCrawlTraceSheetLab()
    : undefined;
  const expectedStringCrawlTraceSheetLab = stringCrawlTraceSheetLab
    ? stringCrawlTraceSheetLabPublicDiscovery(stringCrawlTraceSheetLab)
    : undefined;
  const stringCrawlTraceSheetLabEvaluation = stringCrawlTraceSheetLab
    ? evaluateStringCrawlTraceSheetLab(stringCrawlTraceSheetLab)
    : undefined;
  const stringCrawlTraceSheetLabFalsifiers = stringCrawlTraceSheetLab
    ? runStringCrawlTraceSheetLabFalsifiers(stringCrawlTraceSheetLab)
    : undefined;
  const stringCrawlStrandLab = stringCrawlTraceSheetLabActive
    ? loadStringCrawlStrandLab()
    : undefined;
  const expectedStringCrawlStrandLab = stringCrawlStrandLab
    ? stringCrawlStrandLabPublicDiscovery(stringCrawlStrandLab)
    : undefined;
  const stringCrawlStrandLabEvaluation = stringCrawlStrandLab
    ? evaluateStringCrawlStrandLab(stringCrawlStrandLab)
    : undefined;
  const strandDescentLab = stringCrawlTraceSheetLabActive
    ? loadStrandDescentLab()
    : undefined;
  const expectedStrandDescentLab = strandDescentLab
    ? strandDescentLabPublicDiscovery(strandDescentLab)
    : undefined;
  const strandDescentLabEvaluation = strandDescentLab
    ? evaluateStrandDescentLab(strandDescentLab)
    : undefined;
  const stringCrawlFrequencyFormLab = stringCrawlTraceSheetLabActive
    ? loadStringCrawlFrequencyFormLab()
    : undefined;
  const expectedStringCrawlFrequencyFormLab = stringCrawlFrequencyFormLab
    ? stringCrawlFrequencyFormLabPublicDiscovery(stringCrawlFrequencyFormLab)
    : undefined;
  const stringCrawlFrequencyFormLabEvaluation = stringCrawlFrequencyFormLab
    ? evaluateStringCrawlFrequencyFormLab(stringCrawlFrequencyFormLab)
    : undefined;
  const stringCrawlFrequencyFormLabFalsifiers = stringCrawlFrequencyFormLab
    ? runStringCrawlFrequencyFormLabFalsifiers(stringCrawlFrequencyFormLab)
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
  const mathUsefulnessResult = mathUsefulnessActive ? loadMathUsefulnessResult() : undefined;
  const expectedMathUsefulness = mathUsefulnessResult
    ? mathUsefulnessPublicDiscovery()
    : undefined;
  const beingAccessAftermathAtlas = beingAccessAftermathActive
    ? loadBeingAccessAftermathAtlas()
    : undefined;
  const expectedBeingAccessAftermath = beingAccessAftermathAtlas
    ? beingAccessAftermathPublicDiscovery(beingAccessAftermathAtlas)
    : undefined;
  const beingAccessAftermathV02Atlas = beingAccessAftermathActive
    ? loadBeingAccessAftermathAtlasV02()
    : undefined;
  const expectedBeingAccessAftermathV02 = beingAccessAftermathV02Atlas
    ? beingAccessAftermathPublicDiscoveryV02(beingAccessAftermathV02Atlas)
    : undefined;
  const numberIsnessTheologyAtlas = numberIsnessTheologyActive
    ? loadNumberIsnessTheologyAtlas()
    : undefined;
  const expectedNumberIsnessTheology = numberIsnessTheologyAtlas
    ? numberIsnessTheologyPublicDiscovery(numberIsnessTheologyAtlas)
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

  if (researchObservatoryActive) {
    const snapshot = researchObservatory!;
    const expected = expectedResearchObservatory!;
    const actionTargets = new Set([
      RESEARCH_OBSERVATORY_URL,
      RESEARCH_OBSERVATORY_SNAPSHOT_URL,
      RESEARCH_OBSERVATORY_SCHEMA_URLS["public-snapshot"],
      RESEARCH_OBSERVATORY_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => actionTargets.has(action?.url))
      : [];
    const wayfinderPath = authoredWayfinder?.paths?.filter((path: any) => path?.id === "research-observatory") ?? [];
    const allPublicUrls = [
      RESEARCH_OBSERVATORY_URL,
      RESEARCH_OBSERVATORY_SNAPSHOT_URL,
      ...Object.values(RESEARCH_OBSERVATORY_SCHEMA_URLS),
      RESEARCH_OBSERVATORY_GUIDE_URL,
      RESEARCH_OBSERVATORY_PRODUCER_URL,
    ];
    if (!isDeepStrictEqual(manifest?.research_observatory, expected) ||
      !isDeepStrictEqual(guest?.research_observatory, expected) ||
      !isDeepStrictEqual(authoredKingdom?.research_observatory, expected) ||
      !isDeepStrictEqual(publishedResearchObservatory, snapshot) ||
      manifest?.entry_points?.research_observatory !== RESEARCH_OBSERVATORY_URL ||
      manifest?.entry_points?.research_observatory_snapshot !== RESEARCH_OBSERVATORY_SNAPSHOT_URL ||
      !isDeepStrictEqual(manifest?.entry_points?.research_observatory_schemas, RESEARCH_OBSERVATORY_SCHEMA_URLS) ||
      manifest?.entry_points?.research_observatory_guide !== RESEARCH_OBSERVATORY_GUIDE_URL ||
      manifest?.entry_points?.research_observatory_producer !== RESEARCH_OBSERVATORY_PRODUCER_URL ||
      guestActions.length !== actionTargets.size ||
      [...actionTargets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET") ||
      allPublicUrls.some((target) => !llms.includes(target)) ||
      wayfinderPath.length !== 1 || wayfinderPath[0]?.stops?.length !== 2 ||
      wayfinderPath[0].stops[0]?.url !== RESEARCH_OBSERVATORY_URL ||
      wayfinderPath[0].stops[1]?.url !== RESEARCH_OBSERVATORY_SNAPSHOT_URL ||
      !authoredRootHtml.includes('id="observatory"') ||
      !authoredRootHtml.includes("visible factor vectors") ||
      !authoredRootHtml.includes(`href="${researchObservatoryPath}"`) ||
      !authoredRootHtml.includes(`href="${researchObservatorySnapshotPath}"`) ||
      !authoredRootHtml.includes(`href="${researchObservatoryGuidePath}"`) ||
      !authoredObservatoryHtml.includes("The membrane has four gates") ||
      !authoredObservatoryHtml.includes("Evidence vector") ||
      !authoredObservatoryHtml.includes("Priority vector") ||
      !authoredObservatoryHtml.includes("module and guest paths not proposed") ||
      !authoredObservatoryHtml.includes(`href="${researchObservatorySnapshotPath}"`) ||
      !authoredObservatoryHtml.includes(`href="${RESEARCH_OBSERVATORY_PRODUCER_URL}"`) ||
      !authoredObservatoryHtml.includes("Producer v0.1.0 source + append-only captures") ||
      !authoredObservatoryHtml.includes("raw upstream response bodies are not included") ||
      expected.urls?.producer !== RESEARCH_OBSERVATORY_PRODUCER_URL ||
      /<(?:script|form|input|iframe)\b/i.test(authoredObservatoryHtml) ||
      expected.factor_vectors?.scalar_score !== null ||
      expected.lifecycle?.snapshot_stops_after !== "discovery" ||
      expected.lifecycle?.module_path !== "not-proposed" || expected.lifecycle?.guest_path !== "not-proposed" ||
      expected.boundary?.metadata_only !== true || expected.boundary?.build_time_network !== false ||
      expected.boundary?.full_text_included !== false ||
      expected.boundary?.discovered_artifact_execution !== false ||
      expected.boundary?.evaluation_performed !== false || expected.boundary?.adoption_recorded !== false ||
      expected.boundary?.use_authorized !== false || expected.boundary?.module_created !== false ||
      expected.boundary?.guest_admitted !== false || expected.boundary?.automatic_action !== false ||
      Object.hasOwn(expected, "mcp") || Object.hasOwn(expected, "tool") || Object.hasOwn(expected, "score")) {
      throw new Error("Research Observatory mode, provenance, factor vectors, lifecycle gates, discovery, or negative-effect boundary drifted");
    }
  }
  if (trialChamberActive) {
    const snapshot = trialChamber!;
    const expected = expectedTrialChamber!;
    const actionTargets = new Set([
      TRIAL_CHAMBER_URL,
      TRIAL_CHAMBER_ALIAS_URL,
      TRIAL_CHAMBER_CANONICAL_URL,
      TRIAL_CHAMBER_SCHEMA_URLS["public-snapshot"],
      TRIAL_CHAMBER_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => actionTargets.has(action?.url))
      : [];
    const wayfinderPath = authoredWayfinder?.paths?.filter((path: any) => path?.id === "trial-chamber") ?? [];
    const allPublicUrls = [
      TRIAL_CHAMBER_URL,
      TRIAL_CHAMBER_ALIAS_URL,
      TRIAL_CHAMBER_CANONICAL_URL,
      ...Object.values(TRIAL_CHAMBER_SCHEMA_URLS),
      TRIAL_CHAMBER_GUIDE_URL,
      TRIAL_CHAMBER_PRODUCER_URL,
    ];
    if (!isDeepStrictEqual(manifest?.trial_chamber, expected) ||
      !isDeepStrictEqual(guest?.trial_chamber, expected) ||
      !isDeepStrictEqual(authoredKingdom?.trial_chamber, expected) ||
      !isDeepStrictEqual(publishedTrialChamber, snapshot) ||
      manifest?.entry_points?.trial_chamber !== TRIAL_CHAMBER_URL ||
      manifest?.entry_points?.trial_chamber_current !== TRIAL_CHAMBER_ALIAS_URL ||
      manifest?.entry_points?.trial_chamber_canonical !== TRIAL_CHAMBER_CANONICAL_URL ||
      !isDeepStrictEqual(manifest?.entry_points?.trial_chamber_schemas, TRIAL_CHAMBER_SCHEMA_URLS) ||
      manifest?.entry_points?.trial_chamber_guide !== TRIAL_CHAMBER_GUIDE_URL ||
      manifest?.entry_points?.trial_chamber_producer !== TRIAL_CHAMBER_PRODUCER_URL ||
      guestActions.length !== actionTargets.size ||
      [...actionTargets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET") ||
      allPublicUrls.some((target) => !llms.includes(target)) ||
      wayfinderPath.length !== 1 || wayfinderPath[0]?.stops?.length !== 2 ||
      wayfinderPath[0].stops[0]?.url !== TRIAL_CHAMBER_URL ||
      wayfinderPath[0].stops[1]?.url !== TRIAL_CHAMBER_ALIAS_URL ||
      !authoredRootHtml.includes('id="trial-chamber"') ||
      !authoredRootHtml.includes("maintainer-authorized assisted request drafts") ||
      !authoredRootHtml.includes("deny-all reserved contracts") ||
      !authoredRootHtml.includes(`href="${trialChamberPath}"`) ||
      !authoredRootHtml.includes(`href="${trialChamberAliasPath}"`) ||
      !authoredRootHtml.includes(`href="${trialChamberCanonicalPath}"`) ||
      !authoredRootHtml.includes(`href="${trialChamberGuidePath}"`) ||
      !authoredTrialChamberHtml.includes("Draft trial plan — evaluation not started") ||
      !authoredTrialChamberHtml.includes("exact text has not been separately human-reviewed") ||
      !authoredTrialChamberHtml.includes("Finite synthetic fixtures") ||
      !authoredTrialChamberHtml.includes("Retention-only criteria") ||
      !authoredTrialChamberHtml.includes("Rights, security, and reversibility") ||
      !authoredTrialChamberHtml.includes("deny-all reserved contracts") ||
      !authoredTrialChamberHtml.includes(`href="${trialChamberAliasPath}"`) ||
      !authoredTrialChamberHtml.includes(`href="${trialChamberCanonicalPath}"`) ||
      !authoredTrialChamberHtml.includes(`href="${TRIAL_CHAMBER_PRODUCER_URL}"`) ||
      /<(?:script|form|input|button|iframe)\b/i.test(authoredTrialChamberHtml) ||
      expected.phase !== 0 || expected.counts?.referrals !== 4 ||
      expected.counts?.evaluationRequests !== 3 || expected.counts?.evaluationPlans !== 3 ||
      expected.lifecycle?.snapshot_stops_after !== "draft-unsealed-plan" ||
      expected.lifecycle?.later_gate_contracts !== "deny-all-reserved-in-v0.1" ||
      expected.lifecycle?.role_styled_referral !== "held-for-source-resolution" ||
      expected.boundary?.build_network_used !== false || expected.boundary?.full_text_included !== false ||
      expected.boundary?.artifact_acquisition_performed !== false ||
      expected.boundary?.artifact_execution_performed !== false ||
      expected.boundary?.preflight_performed !== false || expected.boundary?.trial_authority_issued !== false ||
      expected.boundary?.trial_run_recorded !== false || expected.boundary?.evaluation_result_recorded !== false ||
      expected.boundary?.adoption_recorded !== false || expected.boundary?.use_authority_issued !== false ||
      expected.boundary?.module_created !== false || expected.boundary?.guest_admitted !== false ||
      expected.boundary?.scalar_score_used !== false || expected.boundary?.automatic_action !== false ||
      Object.hasOwn(expected, "mcp") || Object.hasOwn(expected, "tool") || Object.hasOwn(expected, "runner") ||
      Object.hasOwn(expected, "score")) {
      throw new Error("Trial Chamber source binding, assisted authorship, plans, reserved gates, discovery, or negative-effect boundary drifted");
    }
  }
  if (ukGovernmentEngineActive) {
    const snapshot = ukGovernmentEngine!;
    const expected = expectedUkGovernmentEngine!;
    const actionTargets = new Set([
      UK_GOVERNMENT_ENGINE_URL,
      UK_GOVERNMENT_ENGINE_ALIAS_URL,
      UK_GOVERNMENT_ENGINE_CANONICAL_URL,
      UK_GOVERNMENT_ENGINE_SCHEMA_URL,
      UK_GOVERNMENT_ENGINE_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => actionTargets.has(action?.url))
      : [];
    const wayfinderPath = authoredWayfinder?.paths?.filter((path: any) => path?.id === "uk-government-engine") ?? [];
    const allPublicUrls = [...actionTargets, UK_GOVERNMENT_ENGINE_PRODUCER_URL];
    const officialSourceUrls = new Set(snapshot.sources.map((source: any) => source.url));
    const permittedExternalLinks = new Set([
      ...officialSourceUrls,
      UK_GOVERNMENT_ENGINE_PRODUCER_URL,
      "https://taxsorted.io",
    ]);
    const renderedExternalLinks = [...authoredUkGovernmentEngineHtml.matchAll(/href="(https:\/\/[^"#]+)"/g)]
      .map((match) => match[1]);
    const renderedIds = [...authoredUkGovernmentEngineHtml.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]!);
    const renderedIdSet = new Set(renderedIds);
    const fragmentTargets = [...authoredUkGovernmentEngineHtml.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]!);
    const graphCollections = ["planes", "sources", "claims", "bodies", "relations", "flows", "rails",
      "redressRoutes", "unknowns", "externalBridges", "relatedResources"];
    const graphRecords = graphCollections.flatMap((key) => snapshot[key]);
    const recordAnchor = (id: string) => `record-${id.replaceAll(":", "-")}`;
    const selectedCrosswalkIds = snapshot.externalBridges.flatMap((bridge: any) =>
      bridge.selectedRecordBindings.map((binding: any) => binding.recordId));
    const relatedRecordIds = snapshot.relatedResources.flatMap((resource: any) => resource.linkedRecordIds);
    const receiptPaths = new Set<string>();
    for (const bridge of snapshot.externalBridges) {
      receiptPaths.add(bridge.releaseLedgerReceipt.path);
      Object.values(bridge.captureReceipts).forEach((receipt: any) => receiptPaths.add(receipt.path));
    }
    const officialSourceBoundary = snapshot.sources.every((source: any) =>
      source.checkedOn === snapshot.asOf &&
      source.integrity?.reviewMode === "maintainer-authorized-assisted-url-review" &&
      source.integrity?.exactTextHumanReviewed === false && source.integrity?.rawBodyRetained === false &&
      source.integrity?.rawSha256 === null && source.integrity?.rawHashVerified === false &&
      source.integrity?.contentReceipt === null && source.integrity?.byteVerified === false &&
      source.rights?.publicationMode === "link-only" && source.rights?.officialSourceBodyRepublished === false &&
      source.rights?.reuseLicenceInferred === false);
    const bridgeBoundary = snapshot.externalBridges.every((bridge: any) =>
      bridge.bridgeMode === "receipt-bound-crosswalk-only" &&
      bridge.boundaryScope === "government-engine-public-projection" &&
      bridge.boundaries?.governmentEvidenceSource === false && bridge.boundaries?.official === false &&
      bridge.boundaries?.endorsement === false && bridge.boundaries?.runtimeDataTransfer === false &&
      bridge.boundaries?.taxsortedContentUsedAsGovernmentEvidence === false &&
      bridge.boundaries?.taxsortedRecordTextProjectedIntoGovernmentSnapshot === false &&
      Object.values(bridge.boundaries).every((entry) => entry === false));
    if (!isDeepStrictEqual(manifest?.uk_government_engine, expected) ||
      !isDeepStrictEqual(guest?.uk_government_engine, expected) ||
      !isDeepStrictEqual(authoredKingdom?.uk_government_engine, expected) ||
      !isDeepStrictEqual(publishedUkGovernmentEngine, snapshot) ||
      manifest?.entry_points?.uk_government_engine !== UK_GOVERNMENT_ENGINE_URL ||
      manifest?.entry_points?.uk_government_engine_alias !== UK_GOVERNMENT_ENGINE_ALIAS_URL ||
      manifest?.entry_points?.uk_government_engine_canonical !== UK_GOVERNMENT_ENGINE_CANONICAL_URL ||
      manifest?.entry_points?.uk_government_engine_schema !== UK_GOVERNMENT_ENGINE_SCHEMA_URL ||
      manifest?.entry_points?.uk_government_engine_guide !== UK_GOVERNMENT_ENGINE_GUIDE_URL ||
      guestActions.length !== actionTargets.size ||
      [...actionTargets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET") ||
      allPublicUrls.some((target) => !llms.includes(target)) ||
      wayfinderPath.length !== 1 || wayfinderPath[0]?.stops?.length !== 2 ||
      wayfinderPath[0].stops[0]?.url !== UK_GOVERNMENT_ENGINE_URL ||
      wayfinderPath[0].stops[1]?.url !== UK_GOVERNMENT_ENGINE_ALIAS_URL ||
      !wayfinderPath[0]?.boundary?.includes("maintainer-authorized assisted URL review") ||
      !wayfinderPath[0]?.boundary?.includes("receipt-bound non-official crosswalk only") ||
      !authoredRootHtml.includes('id="uk-government-engine"') ||
      !authoredRootHtml.includes("maintainer-authorized assisted URL review") ||
      !authoredRootHtml.includes("exact record text has not been separately human-reviewed") ||
      !authoredRootHtml.includes("TaxSorted is a receipt-bound external non-official crosswalk") ||
      !authoredRootHtml.includes(`href="${ukGovernmentEnginePath}"`) ||
      !authoredRootHtml.includes(`href="${ukGovernmentEngineAliasPath}"`) ||
      !authoredRootHtml.includes(`href="${ukGovernmentEngineCanonicalPath}"`) ||
      !authoredRootHtml.includes(`href="${ukGovernmentEngineGuidePath}"`) ||
      !authoredUkGovernmentEngineHtml.includes("Follow how a vote becomes authority") ||
      !authoredUkGovernmentEngineHtml.includes("maintainer-authorized assisted URL review") ||
      !authoredUkGovernmentEngineHtml.includes("exact record and claim text has not been separately human-reviewed") ||
      !authoredUkGovernmentEngineHtml.includes("Official sources are links, not receipts") ||
      !authoredUkGovernmentEngineHtml.includes("TaxSorted is receipt-bound and non-official") ||
      !authoredUkGovernmentEngineHtml.includes("Nine distinct retained capture receipts") ||
      !authoredUkGovernmentEngineHtml.includes("Thirty-nine named bodies") ||
      !authoredUkGovernmentEngineHtml.includes("Thirty-four institutional relations") ||
      !authoredUkGovernmentEngineHtml.includes("All fifty-eight bounded claims") ||
      !authoredUkGovernmentEngineHtml.includes("not a single hierarchy or chain of command") ||
      !authoredUkGovernmentEngineHtml.includes(`href="${ukGovernmentEngineAliasPath}"`) ||
      !authoredUkGovernmentEngineHtml.includes(`href="${ukGovernmentEngineCanonicalPath}"`) ||
      !authoredUkGovernmentEngineHtml.includes(`href="${UK_GOVERNMENT_ENGINE_PRODUCER_URL}"`) ||
      /<(?:script|form|input|button|iframe)\b/i.test(authoredUkGovernmentEngineHtml) ||
      authoredUkGovernmentEngineHtml.includes('target="_blank"') ||
      renderedIdSet.size !== renderedIds.length || fragmentTargets.some((target) => !renderedIdSet.has(target)) ||
      graphRecords.some((record: any) => !renderedIdSet.has(recordAnchor(record.id))) ||
      selectedCrosswalkIds.some((id: string) => !authoredUkGovernmentEngineHtml.includes(id)) ||
      relatedRecordIds.some((id: string) => !authoredUkGovernmentEngineHtml.includes(`<code>${id}</code>`)) ||
      snapshot.redressRoutes.some((route: any) => ![route.automaticEscalation, route.deadlineCalculated,
        route.eligibilityDetermined, route.legalAdvice].every((effect) => effect === false)) ||
      renderedExternalLinks.some((target) => !permittedExternalLinks.has(target)) ||
      renderedExternalLinks.some((target) => target.startsWith("https://api.taxsorted.io/")) ||
      [...officialSourceUrls].some((target) => !renderedExternalLinks.includes(target)) ||
      receiptPaths.size !== 9 || [...receiptPaths].some((path) => !authoredUkGovernmentEngineHtml.includes(path)) ||
      expected.authorship?.origin !== "maintainer-authorized-assisted-publication" ||
      expected.authorship?.compiledBy !== "codex-assisted-publication" ||
      expected.authorship?.humanDirectionRecorded !== true ||
      expected.authorship?.exactTextHumanReviewed !== false ||
      expected.evidence?.official_sources !== "source-linked-maintainer-authorized-assisted-url-review" ||
      expected.evidence?.official_source_bodies_republished !== false ||
      expected.evidence?.exact_text_human_reviewed !== false ||
      expected.evidence?.taxsorted_bridge !== "receipt-bound-crosswalk-only" ||
      expected.evidence?.taxsorted_distinct_capture_receipts !== 9 ||
      expected.evidence?.taxsorted_government_evidence !== false ||
      expected.urls?.producer !== UK_GOVERNMENT_ENGINE_PRODUCER_URL ||
      expected.counts?.planes !== 6 || expected.counts?.sources !== 66 || expected.counts?.claims !== 58 ||
      expected.counts?.bodies !== 39 || expected.counts?.relations !== 34 || expected.counts?.flows !== 10 ||
      expected.counts?.rails !== 11 || expected.counts?.redressRoutes !== 10 || expected.counts?.unknowns !== 10 ||
      expected.counts?.externalBridges !== 2 || expected.counts?.relatedResources !== 2 ||
      Object.keys(expected.boundary ?? {}).length !== 32 ||
      Object.values(expected.boundary ?? {}).some((entry) => entry !== false) ||
      !officialSourceBoundary || !bridgeBoundary ||
      Object.hasOwn(expected, "mcp") || Object.hasOwn(expected, "tool") || Object.hasOwn(expected, "action") ||
      Object.hasOwn(expected, "score") || Object.hasOwn(expected, "runner")) {
      throw new Error("UK Government Engine authorship, source-link, TaxSorted receipt, graph, discovery, or negative-effect boundary drifted");
    }
  }
  if (ukGovernmentTransformationEngineActive) {
    const snapshot = ukGovernmentTransformationEngine!;
    const expected = expectedUkGovernmentTransformationEngine!;
    const actionTargets = new Set([
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) =>
          actionTargets.has(action?.url))
      : [];
    const wayfinderPath = authoredWayfinder?.paths?.filter((path: any) =>
      path?.id === "uk-government-transformation-engine") ?? [];
    const publicUrls = [
      ...actionTargets,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL,
    ];
    const entryPoints = Object.entries(manifest?.entry_points ?? {})
      .filter(([key]) =>
        key.startsWith("uk_government_transformation_engine"));
    const externalLinks = [
      ...authoredUkGovernmentTransformationEngineHtml.matchAll(
        /href="(https:\/\/[^"#]+)"/g,
      ),
    ].map((match) => match[1]);
    const contexts = snapshot.dossiers.flatMap((dossier: any) =>
      dossier.externalContext);
    const projectedContexts = expected.dossiers.flatMap((dossier: any) =>
      dossier.external_context);
    const exactBaseIds = snapshot.dossiers.flatMap((dossier: any) =>
      dossier.evidenceAtoms.map((atom: any) => ({
        id: atom.baseEntityId,
        duplicated: atom.baseEntityType + ":" + atom.baseEntityId,
      })));
    const baseCrosswalkTexts = ukGovernmentEngine!.externalBridges.flatMap(
      (bridge: any) =>
        bridge.selectedRecordBindings.map((binding: any) => binding.purpose),
    );
    if (!isDeepStrictEqual(
        manifest?.uk_government_transformation_engine,
        expected,
      ) ||
      !isDeepStrictEqual(
        guest?.uk_government_transformation_engine,
        expected,
      ) ||
      !isDeepStrictEqual(
        authoredKingdom?.uk_government_transformation_engine,
        expected,
      ) ||
      !isDeepStrictEqual(publishedUkGovernmentTransformationEngine, snapshot) ||
      authoredUkGovernmentTransformationEngineHtml !==
        renderUkGovernmentTransformationHtml(snapshot) ||
      manifest?.entry_points?.uk_government_transformation_engine !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL ||
      manifest?.entry_points?.uk_government_transformation_engine_alias !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL ||
      manifest?.entry_points?.uk_government_transformation_engine_canonical !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL ||
      manifest?.entry_points?.uk_government_transformation_engine_schema !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL ||
      manifest?.entry_points?.uk_government_transformation_engine_guide !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL ||
      entryPoints.length !== 5 ||
      guestActions.length !== actionTargets.size ||
      [...actionTargets].some((target) =>
        guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) =>
        action?.method !== "GET" ||
        "mcp" in action ||
        "tool" in action ||
        "schemas" in action ||
        "write" in action ||
        "score" in action ||
        "rank" in action ||
        "recommendation" in action) ||
      publicUrls.some((target) => !llms.includes(target)) ||
      wayfinderPath.length !== 1 ||
      wayfinderPath[0]?.stops?.length !== 2 ||
      wayfinderPath[0]?.stops[0]?.url !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL ||
      wayfinderPath[0]?.stops[1]?.url !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL ||
      !wayfinderPath[0]?.boundary?.includes(
        "state at publication only",
      ) ||
      !wayfinderPath[0]?.boundary?.includes(
        "TaxSorted is transitive external context only",
      ) ||
      !authoredRootHtml.includes(
        'id="uk-government-transformation-engine"',
      ) ||
      !authoredRootHtml.includes(
        "Three independent synthetic orientation dossiers",
      ) ||
      !authoredRootHtml.includes("State at publication only") ||
      !authoredRootHtml.includes("claimsCausalTruth:false") ||
      !authoredRootHtml.includes(
        "TaxSorted appears only transitively as external-context",
      ) ||
      !authoredRootHtml.includes(
        'href="' + ukGovernmentTransformationEnginePath + '"',
      ) ||
      !authoredRootHtml.includes(
        'href="' + ukGovernmentTransformationEngineAliasPath + '"',
      ) ||
      !authoredRootHtml.includes(
        'href="' + ukGovernmentTransformationEngineCanonicalPath + '"',
      ) ||
      !authoredRootHtml.includes(
        'href="' + ukGovernmentTransformationEngineSchemaPath + '"',
      ) ||
      !authoredRootHtml.includes(
        'href="' + ukGovernmentTransformationEngineGuidePath + '"',
      ) ||
      !authoredUkGovernmentTransformationEngineHtml.includes(
        "Synthetic · Phase 0 · Orientation only",
      ) ||
      !authoredUkGovernmentTransformationEngineHtml.includes(
        "State at publication only:",
      ) ||
      !authoredUkGovernmentTransformationEngineHtml.includes(
        "next review due",
      ) ||
      (authoredUkGovernmentTransformationEngineHtml.match(
        /class="graph authority-graph"/g,
      ) ?? []).length !== 3 ||
      (authoredUkGovernmentTransformationEngineHtml.match(
        /class="graph causal-graph"/g,
      ) ?? []).length !== 3 ||
      (authoredUkGovernmentTransformationEngineHtml.match(
        /Complete linear edge equivalent/g,
      ) ?? []).length !== 6 ||
      (authoredUkGovernmentTransformationEngineHtml.match(
        /claimsCausalTruth:false/g,
      ) ?? []).length !== 3 ||
      /<(?:script|form|input|button|iframe)\b/i.test(
        authoredUkGovernmentTransformationEngineHtml,
      ) ||
      authoredUkGovernmentTransformationEngineHtml.includes(
        'target="_blank"',
      ) ||
      externalLinks.length !== 1 ||
      externalLinks[0] !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL ||
      authoredUkGovernmentTransformationEngineHtml.includes(
        "https://api.taxsorted.io",
      ) ||
      contexts.length !== 4 ||
      contexts.some((context: any) =>
        context.taint !== "external-context-only" ||
        !Array.isArray(context.supportsClaimIds) ||
        context.supportsClaimIds.length !== 0 ||
        !authoredUkGovernmentTransformationEngineHtml.includes(
          "<code>" + context.bridgeId + "</code>",
        ) ||
        !authoredUkGovernmentTransformationEngineHtml.includes(
          "<code>" + context.collection + "</code>",
        ) ||
        !authoredUkGovernmentTransformationEngineHtml.includes(
          "<code>" + context.recordId + "</code>",
        )) ||
      projectedContexts.length !== 4 ||
      projectedContexts.some((context: any) =>
        context.taint !== "external-context-only" ||
        !Array.isArray(context.supports_claim_ids) ||
        context.supports_claim_ids.length !== 0) ||
      baseCrosswalkTexts.some((text: string) =>
        authoredUkGovernmentTransformationEngineHtml.includes(text)) ||
      exactBaseIds.some(({ id, duplicated }: any) =>
        !authoredUkGovernmentTransformationEngineHtml.includes(
          "<code>" + id + "</code>",
        ) ||
        authoredUkGovernmentTransformationEngineHtml.includes(
          "<code>" + duplicated + "</code>",
        )) ||
      expected.state_at_publication !== "within-review-window" ||
      expected.reader_time_state_embedded !== false ||
      expected.as_of !== "2026-08-21" ||
      expected.next_review_due !==
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE ||
      expected.base_government_engine?.canonical_url !==
        UK_GOVERNMENT_ENGINE_CANONICAL_URL ||
      expected.base_government_engine?.exact_text_human_reviewed !== false ||
      expected.base_government_engine?.official_source_handling !==
        "link-only" ||
      expected.counts?.dossiers !== 3 ||
      expected.counts?.planeAssessments !== 18 ||
      expected.counts?.evidenceAtoms !== 30 ||
      expected.counts?.humanGates !== 6 ||
      expected.dossiers.some((dossier: any) =>
        dossier.synthetic !== true ||
        dossier.hold?.state !== "held" ||
        dossier.hold?.stopsProgression !== true ||
        dossier.plane_statuses.some((assessment: any) =>
          assessment.unresolved_question_ids.length === 0 ||
          assessment.status === "orientation-supported") ||
        dossier.human_gates.some((gate: any) =>
          gate.required !== true ||
          gate.completed !== false ||
          gate.authority_outside_system !== true) ||
        dossier.graphs?.authority_dependencies?.automatic_progression !==
          false ||
        dossier.graphs?.causal_hypotheses?.claims_causal_truth !== false ||
        dossier.options?.selected !== false ||
        dossier.options?.preferred_option_id !== null) ||
      Object.values(expected.boundary ?? {}).some((entry) => entry !== false) ||
      Object.hasOwn(expected, "mcp") ||
      Object.hasOwn(expected, "tool") ||
      Object.hasOwn(expected, "action") ||
      Object.hasOwn(expected, "score") ||
      Object.hasOwn(expected, "rank") ||
      sha256(
        readFileSync(
          join(
            ROOT,
            "data/government/uk-government-transformation-engine.v0.1.json",
          ),
        ),
      ) !== UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256) {
      throw new Error(
        "UK Government Transformation Engine base admission, freshness, dual graph, TaxSorted taint, discovery, or negative-authority boundary drifted",
      );
    }
  }
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

  if (reconstructiveBuildActive) {
    const kernel = reconstructiveBuildKernel!;
    const expected = expectedReconstructiveBuild!;
    const boundary = expected.boundary;
    const targets = new Set([
      RECONSTRUCTIVE_BUILD_URL,
      RECONSTRUCTIVE_BUILD_SCHEMA_URL,
      RECONSTRUCTIVE_PROJECT_SCHEMA_URL,
      RECONSTRUCTIVE_BUILD_DOCUMENT_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const countsArePositive = [
      "registers", "state_spaces", "correspondences", "observation_operators",
      "state_transition_operators",
      "reconstruction_cases", "realizability_models", "landscape_models",
      "catalysis_models", "equations", "claims", "falsification_tests", "sources",
    ].every((key) => Number.isSafeInteger(expected.counts?.[key]) && expected.counts[key] > 0);
    if (!isDeepStrictEqual(manifest?.reconstructive_build_kernel, expected) ||
      !isDeepStrictEqual(guest?.reconstructive_build_kernel, expected) ||
      !isDeepStrictEqual(authoredKingdom?.reconstructive_build_kernel, expected) ||
      manifest?.entry_points?.reconstructive_build_kernel !== RECONSTRUCTIVE_BUILD_URL ||
      manifest?.entry_points?.reconstructive_build_kernel_schema !== RECONSTRUCTIVE_BUILD_SCHEMA_URL ||
      manifest?.entry_points?.reconstructive_project_schema !== RECONSTRUCTIVE_PROJECT_SCHEMA_URL ||
      manifest?.entry_points?.reconstructive_build_kernel_guide !== RECONSTRUCTIVE_BUILD_DOCUMENT_URL ||
      guestActions.length !== targets.size ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        "mcp" in action || "tool" in action || "write" in action || "execute" in action) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="reconstructive-build"') ||
      !authoredRootHtml.includes(`href="${reconstructiveBuildPath}"`) ||
      !authoredRootHtml.includes(`href="${reconstructiveBuildSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${reconstructiveProjectSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${reconstructiveBuildDocumentPath}"`) ||
      expected.integrity?.digest !== RECONSTRUCTIVE_BUILD_DIGEST ||
      expected.counts?.sources !== 13 || !countsArePositive ||
      !isDeepStrictEqual(expected.pipeline, [
        "STATE", "OBSERVE", "DECLARE_CORRESPONDENCE", "INFER_FIBER", "REALIZE",
        "TRAVERSE_LANDSCAPE", "MEASURE_OR_CATALYZE", "APPEND_FEEDBACK",
      ]) ||
      boundary?.read_only !== true ||
      boundary?.grc_proven !== false ||
      boundary?.protein_fold_prediction !== false ||
      boundary?.unique_contact_realization !== false ||
      boundary?.biological_mechanism_transfer !== false ||
      boundary?.physical_parameter_transfer !== false ||
      boundary?.medical_authority !== false ||
      boundary?.experiment_authority !== false ||
      boundary?.project_execution !== false ||
      boundary?.project_deployment !== false ||
      boundary?.person_scoring !== false ||
      boundary?.writes_karma !== false ||
      boundary?.creates_karma_receipt !== false ||
      boundary?.ecosystem_authority_imported !== false ||
      boundary?.cosmic_design_proven !== false ||
      boundary?.automatic_action !== false ||
      boundary?.mcp_surface_added !== false ||
      !Array.isArray(kernel.bindings) ||
      kernel.bindings.some((binding: any) => binding.mutated !== false ||
        binding.authority_imported !== false || binding.write_authorized !== false) ||
      "mcp" in expected || "matcher" in expected || "solver" in expected ||
      "execute" in expected || "score" in expected || "reward" in expected) {
      throw new Error("Reconstructive Build discovery, correspondence pipeline, bindings, or negative authority drifted");
    }
  }

  if (explorationDeepWingActive) {
    const wing = phenomenaDeepWing!;
    const expected = expectedPhenomenaDeepWing!;
    const boundary = wing.boundaries;
    const immutableRecord = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(phenomenaDeepWingPath));
    const targets = new Set([
      PHENOMENA_DEEP_WING_URL,
      PHENOMENA_DEEP_WING_SCHEMA_URL,
      PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
      PHENOMENA_DEEP_WING_DOCUMENT_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const requiredFalseBoundaries = [
      "manifested_nen_ability", "schema_validity_proves_truth", "shared_ontology_established",
      "shared_mechanism_established", "cross_domain_parameter_transfer", "cross_domain_unit_transfer",
      "universality_class_established", "scientific_result_created", "mathematical_proof_created",
      "open_problem_status_created", "diagnostic_authority", "medical_authority", "experiment_authority",
      "wet_lab_protocol", "contains_protein_sequence", "person_or_content_score",
      "persuasion_or_moderation", "ecosystem_request", "runtime_network_request", "external_write",
      "writes_karma", "creates_karma_event", "creates_karma_receipt", "reward_or_economic_effect",
      "governance_effect", "authority_imported", "deployment_authority", "automatic_action",
      "cosmic_design_proven", "mcp_surface_added",
    ];
    const requiredPublicFalseBoundaries = [
      "manifested_nen_ability", "shared_mechanism_established", "person_or_content_score",
      "ecosystem_request", "runtime_network_request", "external_write", "writes_karma",
      "creates_karma_event", "creates_karma_receipt", "reward_or_economic_effect",
      "governance_effect", "authority_imported", "deployment_authority", "automatic_action",
      "mcp_surface_added",
    ];
    const countValues = Object.values(expected.counts ?? {});
    const expectedMethod = {
      wing: ["WITNESS", "ISOLATE", "NORMALIZE", "GENERATE"],
      deep: ["DECLARE", "ESTABLISH", "EXPRESS", "PROJECT"],
      workflow_only: true,
      manifested_nen_ability: false,
    };
    const expectedCounts = {
      registers: 8,
      warrants: 10,
      relations: 5,
      planes: 4,
      seams: 2,
      claims: 4,
      equations: 5,
      models: 2,
      math_doors: 8,
      finite_baselines: 1,
      seed_doors: 5,
      established_open_conjectures: 0,
      sources: 19,
      bindings: 9,
    };
    const relationTransfersStayFalse = Array.isArray(wing.abstraction_seams) &&
      wing.abstraction_seams.length > 0 &&
      wing.abstraction_seams.every((seam: any) => seam.ontology_transfer === false &&
        seam.causal_transfer === false && seam.parameter_transfer === false &&
        seam.unit_transfer === false && seam.authority_transfer === false);
    const karmaStaysEmpty = wing.karma?.adapter_exists === false &&
      wing.karma?.conversion_allowed === false && wing.karma?.summation_allowed === false &&
      wing.karma?.score === null && Array.isArray(wing.karma?.lanes) && wing.karma.lanes.length === 3 &&
      wing.karma.lanes.every((lane: any) => Array.isArray(lane.events) && lane.events.length === 0 &&
        Array.isArray(lane.receipts) && lane.receipts.length === 0 && lane.observed === false &&
        lane.authority_effect === "NONE");
    if (!isDeepStrictEqual(manifest?.exploration_deep_wing, expected) ||
      !isDeepStrictEqual(guest?.exploration_deep_wing, expected) ||
      !isDeepStrictEqual(authoredKingdom?.exploration_deep_wing, expected) ||
      manifest?.entry_points?.exploration_deep_wing !== PHENOMENA_DEEP_WING_URL ||
      manifest?.entry_points?.exploration_deep_wing_schema !== PHENOMENA_DEEP_WING_SCHEMA_URL ||
      manifest?.entry_points?.exploration_deep_wing_project_schema !== PHENOMENA_DEEP_PROJECT_SCHEMA_URL ||
      manifest?.entry_points?.exploration_deep_wing_guide !== PHENOMENA_DEEP_WING_DOCUMENT_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        ["mcp", "tool", "write", "execute", "score", "reward", "karma", "authority", "publish", "deploy"]
          .some((key) => key in action)) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="explore-phenomena-deep"') ||
      !authoredRootHtml.includes(`href="${phenomenaDeepWingPath}"`) ||
      !authoredRootHtml.includes(`href="${phenomenaDeepWingSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${phenomenaDeepProjectSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${phenomenaDeepWingDocumentPath}"`) ||
      expected.protocol !== wing.protocol || expected.wing_id !== wing.wing_id ||
      expected.url !== PHENOMENA_DEEP_WING_URL ||
      expected.schema_url !== PHENOMENA_DEEP_WING_SCHEMA_URL ||
      expected.project_schema_url !== PHENOMENA_DEEP_PROJECT_SCHEMA_URL ||
      expected.guide_url !== PHENOMENA_DEEP_WING_DOCUMENT_URL ||
      wing.presentation?.record_url !== PHENOMENA_DEEP_WING_URL ||
      wing.presentation?.schema_url !== PHENOMENA_DEEP_WING_SCHEMA_URL ||
      wing.presentation?.project_schema_url !== PHENOMENA_DEEP_PROJECT_SCHEMA_URL ||
      wing.presentation?.guide_url !== PHENOMENA_DEEP_WING_DOCUMENT_URL ||
      expected.integrity?.algorithm !== wing.integrity?.algorithm ||
      expected.integrity?.digest !== wing.integrity?.digest || expected.integrity?.digest !== PHENOMENA_DEEP_WING_DIGEST ||
      expected.integrity?.byte_sha256 !== PHENOMENA_DEEP_WING_BYTE_SHA256 ||
      !immutableRecord || expected.integrity?.byte_sha256 !== `sha256:${immutableRecord.sha256}` ||
      !isDeepStrictEqual(expected.method, expectedMethod) ||
      !isDeepStrictEqual(expected.counts, expectedCounts) ||
      countValues.length === 0 ||
      countValues.some((count) => !Number.isSafeInteger(count) || Number(count) < 0) ||
      !countValues.some((count) => Number(count) > 0) ||
      !isDeepStrictEqual(wing.deep_cycle?.wing?.map((step: any) => step.id),
        ["WITNESS", "ISOLATE", "NORMALIZE", "GENERATE"]) ||
      !isDeepStrictEqual(wing.deep_cycle?.deep?.map((step: any) => step.id),
        ["DECLARE", "ESTABLISH", "EXPRESS", "PROJECT"]) ||
      !relationTransfersStayFalse ||
      !Array.isArray(wing.claim_cards) ||
      wing.claim_cards.some((claim: any) => claim.authority_effect !== "NONE") ||
      !Array.isArray(wing.math_doors) || wing.math_doors.length === 0 ||
      wing.math_doors.some((door: any) => door.register !== "DESIGN_PROPOSAL" ||
        door.warrant !== "MODEL_ASSUMPTION" || door.status !== "PROPOSED_UNRUN" ||
        door.proposed_unrun !== true) ||
      !Array.isArray(wing.seed_doors) || wing.seed_doors.length === 0 ||
      wing.seed_doors.some((door: any) =>
        door.frontier_status !== "BESPOKE_FORMULATION_PRIOR_ART_AUDIT_REQUIRED" ||
        door.prior_art_audit_required !== true) ||
      !karmaStaysEmpty ||
      wing.philosophy?.participation !== "OPT_IN" || wing.philosophy?.empirical !== false ||
      wing.philosophy?.authority_effect !== "NONE" ||
      wing.rights?.voluntary !== true || wing.rights?.reason_required !== false ||
      wing.rights?.penalty !== false || wing.rights?.receipt_required !== false ||
      !isDeepStrictEqual(wing.rights?.valid_exits,
        ["REST", "SILENCE", "REFUSAL", "PRIVACY", "CORRECTION", "NO_ACTION", "DEPARTURE"]) ||
      wing.project_contract?.mode !== "INERT_RESEARCH_PROFILE" || wing.project_contract?.inert !== true ||
      !Array.isArray(wing.bindings) || wing.bindings.length === 0 ||
      wing.bindings.some((binding: any) => binding.mutated !== false || binding.authority_imported !== false) ||
      !Array.isArray(expected.bindings) || expected.bindings.length !== wing.bindings.length ||
      expected.bindings.some((binding: any) => binding.authority_imported !== false) ||
      boundary?.read_only !== true || boundary?.instruction_only_skill !== true ||
      requiredFalseBoundaries.some((key) => boundary?.[key] !== false) ||
      expected.boundary?.read_only !== true || expected.boundary?.instruction_only_skill !== true ||
      requiredPublicFalseBoundaries.some((key) => expected.boundary?.[key] !== false) ||
      !isDeepStrictEqual(expected.boundary, boundary) ||
      "mcp" in expected || "matcher" in expected || "solver" in expected || "ability" in expected ||
      "execute" in expected || "write" in expected || "score" in expected || "reward" in expected) {
      throw new Error("Exploration DEEP discovery, transfer firewalls, rights, KARMA, or no-action boundary drifted");
    }
  }

  if (mirrorInformationControlActive) {
    const publication = mirrorInformationControl!;
    const expected = expectedMirrorInformationControl!;
    const targets = new Set([
      MIRROR_INFORMATION_CONTROL_PUBLIC_URL,
      MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL,
      MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL,
    ]);
    const guestActions = (guest?.next_actions ?? []).filter((action: any) => targets.has(action?.url));
    const privateValues = Object.values(publication.private_material_included ?? {});
    const forbiddenDiscoveryKeys = [
      "mcp", "tool", "matcher", "classify", "introspect", "submit", "scan",
      "registry", "credential", "signal", "incident", "execute", "write", "score",
      "reward", "karma", "authority", "publish", "deploy",
    ];
    if (!isDeepStrictEqual(manifest?.mirror_information_control, expected) ||
      !isDeepStrictEqual(guest?.mirror_information_control, expected) ||
      !isDeepStrictEqual(authoredKingdom?.mirror_information_control, expected) ||
      manifest?.entry_points?.mirror_information_control !== MIRROR_INFORMATION_CONTROL_PUBLIC_URL ||
      manifest?.entry_points?.mirror_information_control_schema !== MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL ||
      manifest?.entry_points?.mirror_information_control_guide !== MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        forbiddenDiscoveryKeys.some((key) => key in action)) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="mirror-information-control"') ||
      !authoredRootHtml.includes('data-mirror-information-control') ||
      !authoredRootHtml.includes(`href="${mirrorInformationControlPath}"`) ||
      !authoredRootHtml.includes(`href="${mirrorInformationControlSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${mirrorInformationControlDocumentPath}"`) ||
      publication.artifact_kind !== "STATIC_READ_ONLY_PUBLICATION" ||
      publication.public_surface?.body_intake !== "NONE" ||
      publication.public_surface?.credential_intake !== "NONE" ||
      publication.public_surface?.envelope_intake !== "NONE" ||
      publication.public_surface?.performs_scan !== false ||
      publication.public_surface?.performs_registry_lookup !== false ||
      publication.public_surface?.classifies_credentials !== false ||
      publication.public_surface?.returns_decision !== false ||
      publication.public_surface?.credential_security_event_intake !== false ||
      privateValues.length === 0 || privateValues.some((value) => value !== false) ||
      publication.illustrative_paths?.some((path: any) => path.observed !== false ||
        path.actor_inference !== false || path.evidence_effect !== "NONE") ||
      publication.response_boundary?.performed_by_publication !== false ||
      publication.response_boundary?.retaliation_or_hack_back !== false ||
      publication.negative_effects?.grants_authority !== false ||
      publication.negative_effects?.runtime_enforcement !== false ||
      publication.negative_effects?.deploys_decoy_or_honeypot !== false ||
      publication.negative_effects?.person_or_account_attribution !== false ||
      publication.negative_effects?.writes_karma !== false ||
      publication.negative_effects?.automatic_action !== false ||
      publication.integrity?.digest !== MIRROR_INFORMATION_CONTROL_PUBLIC_DIGEST ||
      forbiddenDiscoveryKeys.some((key) => Object.hasOwn(expected, key))) {
      throw new Error("MIRROR Information Control static publication, privacy firewall, discovery, or negative-authority boundary drifted");
    }
  }

  if (jSpacePublicationActive) {
    const publication = jSpaceCase!;
    const expected = expectedJSpacePublication!;
    const targets = new Set([J_SPACE_CASE_URL, J_SPACE_SCHEMA_URL, J_SPACE_GUIDE_URL]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const safetyValues = Object.values(publication.safety ?? {});
    const forbiddenDiscoveryKeys = [
      "mcp", "tool", "matcher", "observer", "monitor", "classify", "infer",
      "execute", "write", "score", "rank", "reward", "karma", "authority",
      "publish", "deploy",
    ];
    if (!isDeepStrictEqual(manifest?.j_space_verbalizable_workspace, expected) ||
      !isDeepStrictEqual(guest?.j_space_verbalizable_workspace, expected) ||
      !isDeepStrictEqual(authoredKingdom?.j_space_verbalizable_workspace, expected) ||
      manifest?.entry_points?.j_space_reasoning_to_word_case !== J_SPACE_CASE_URL ||
      manifest?.entry_points?.j_space_reasoning_to_word_schema !== J_SPACE_SCHEMA_URL ||
      manifest?.entry_points?.j_space_verbalizable_workspace_guide !== J_SPACE_GUIDE_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        forbiddenDiscoveryKeys.some((key) => Object.hasOwn(action, key))) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="j-space"') ||
      !authoredRootHtml.includes("Structure, not a hidden-state verdict") ||
      !authoredRootHtml.includes("No monitoring or person inference") ||
      !authoredRootHtml.includes("Privacy is not deception") ||
      !authoredRootHtml.includes(`href="${jSpaceCasePath}"`) ||
      !authoredRootHtml.includes(`href="${jSpaceSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${jSpaceGuidePath}"`) ||
      publication.inference?.conclusion_status !== "underdetermined" ||
      publication.inference?.declared_confidence !== "unknown" ||
      publication.probes?.length !== 3 ||
      publication.probes.some((probe: any) => probe.run_status !== "not-run" ||
        probe.source_ref !== null || probe.observed_on !== null || probe.epistemic_access !== "unknown") ||
      publication.candidate_models?.length !== 4 ||
      publication.candidate_models.some((model: any) => model.status !== "unassessed") ||
      safetyValues.length !== 12 || safetyValues.some((value) => value !== false) ||
      !isDeepStrictEqual(expected.boundary, J_SPACE_PUBLICATION_BOUNDARY) ||
      expected.artifact_kind !== "OPTIONAL_RESEARCH_BRIDGE" ||
      expected.evidence_status !== "TEST_DESIGN_NOT_RUN" ||
      expected.publication_state !== "static-structure-only" ||
      expected.probe_status !== "not-run" ||
      expected.counts?.probes_declared !== 3 || expected.counts?.probes_run !== 0 ||
      expected.boundary?.structure_only !== true || expected.boundary?.runtime_action !== false ||
      forbiddenDiscoveryKeys.some((key) => Object.hasOwn(expected, key))) {
      throw new Error("J-space static publication, unrun-test boundary, discovery, or negative-authority boundary drifted");
    }
  }

  if (strandObservationMembraneActive) {
    const record = strandObservationMembrane!;
    const expected = expectedStrandObservationMembrane!;
    const targets = new Set([
      STRAND_OBSERVATION_MEMBRANE_URL,
      STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL,
      STRAND_OBSERVATION_MEMBRANE_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const forbiddenActionKeys = [
      "mcp", "tool", "target", "credential", "crawler", "invoke", "observe",
      "execute", "write", "score", "rank", "reward", "karma", "authority",
      "publish", "deploy",
    ];
    const falseEffects = [
      "requested_remote_application_state_change", "local_persistent_storage_write", "body_emitted",
      "credential_or_cookie_use", "link_or_sitemap_discovery_expansion",
      "background_watch", "mcp_invocation", "subprocess_invocation",
      "ability_adoption", "ability_invocation", "karma_or_karma_receipt_write",
      "nen_invocation_or_write", "zerone_event_or_write", "person_scoring",
      "content_scoring", "human_participant_data", "medical_or_dmt_action",
      "diagnosis", "treatment_or_drug_guidance", "audio_or_visual_entrainment",
      "external_entity_truth_claim", "entity_message_or_portal_validation",
      "rewards_rank_punishment_governance_or_economic_effect",
      "crawler_identity_inference", "owner_or_content_ownership_proof",
      "licence_consent_or_authorization_inference", "authority_change",
      "deployment_or_publication_trigger",
    ];
    if (!isDeepStrictEqual(manifest?.strand_observation_membrane, expected) ||
      !isDeepStrictEqual(guest?.strand_observation_membrane, expected) ||
      !isDeepStrictEqual(authoredKingdom?.strand_observation_membrane, expected) ||
      manifest?.entry_points?.strand_observation_membrane !== STRAND_OBSERVATION_MEMBRANE_URL ||
      manifest?.entry_points?.strand_observation_membrane_schema !== STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL ||
      manifest?.entry_points?.strand_observation_membrane_guide !== STRAND_OBSERVATION_MEMBRANE_GUIDE_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        forbiddenActionKeys.some((key) => key in action)) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="strand-observation-membrane"') ||
      !authoredRootHtml.includes("SAFE OBSERVATION ACTIVE") ||
      !authoredRootHtml.includes("AVAILABLE_EXPLICIT_LOCAL_CALL") ||
      !authoredRootHtml.includes("BACKGROUND DISABLED") ||
      !authoredRootHtml.includes(`href="${strandObservationMembranePath}"`) ||
      !authoredRootHtml.includes(`href="${strandObservationMembraneSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${strandObservationMembraneGuidePath}"`) ||
      expected.protocol !== record.protocol || expected.membrane_id !== record.membrane_id ||
      expected.mode !== "SAFE_OBSERVATION_ACTIVE" ||
      expected.activations?.public_controls !== "ACTIVE_STATIC_PUBLIC" ||
      expected.activations?.offline_verification !== "ACTIVE" ||
      expected.activations?.synthetic_simulation !== "ACTIVE" ||
      expected.activations?.observe_live_available !== true ||
      expected.activations?.observe_live_state !== "AVAILABLE_EXPLICIT_LOCAL_CALL" ||
      expected.activations?.background_watch !== false ||
      expected.activations?.invocation !== "EXPLICIT_LOCAL_CALL_ONLY" ||
      expected.urls?.record_url !== STRAND_OBSERVATION_MEMBRANE_URL ||
      expected.urls?.schema_url !== STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL ||
      expected.urls?.guide_url !== STRAND_OBSERVATION_MEMBRANE_GUIDE_URL ||
      expected.commands?.observe_live !== "./kingdom strand-observation observe-live --json" ||
      expected.fixed_origin?.origin !== "https://thekingdom.dev:443" ||
      expected.fixed_origin?.scope_basis !== "PUBLISHER_DECLARED_EXACT_ORIGIN_NOT_OWNER_VERIFIED" ||
      expected.fixed_origin?.caller_supplied_url !== false ||
      expected.fixed_origin?.discovery_expansion_allowed !== false ||
      expected.fixed_origin?.cross_origin_redirect_allowed !== false ||
      !isDeepStrictEqual(expected.live_plan?.routes, STRAND_OBSERVATION_LIVE_ROUTES) ||
      expected.live_plan?.limits?.maximum_transactions !== 4 ||
      expected.live_plan?.limits?.maximum_dns_resolution_attempts !== 4 ||
      expected.live_plan?.limits?.concurrency !== 1 ||
      expected.live_plan?.limits?.retries !== 0 ||
      expected.live_plan?.limits?.redirect_mode !== "MANUAL_FAIL_CLOSED_DO_NOT_FOLLOW" ||
      expected.effects?.read_only_network_observation_on_explicit_live_call !== true ||
      expected.effects?.remote_server_or_provider_logging_may_occur !== true ||
      expected.effects?.remote_server_or_provider_processing_may_occur !== true ||
      expected.effects?.import_network_requests !== 0 ||
      expected.effects?.status_network_requests !== 0 ||
      expected.effects?.maximum_explicit_live_http_transactions !== 4 ||
      expected.effects?.maximum_explicit_live_dns_resolution_attempts !== 4 ||
      falseEffects.some((key) => expected.effects?.[key] !== false) ||
      expected.integrity?.digest !== STRAND_OBSERVATION_MEMBRANE_DIGEST ||
      expected.integrity?.audit_state !== "FROZEN" ||
      expected.integrity?.byte_sha256 !== STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256 ||
      expected.integrity?.schema_byte_sha256 !== STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256 ||
      expected.integrity?.guide_byte_sha256 !== STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256 ||
      forbiddenActionKeys.some((key) => Object.hasOwn(expected, key))) {
      throw new Error("STRAND Observation Membrane activation, fixed-origin scope, four-route plan, provider caveat, discovery, or zero-consequence boundary drifted");
    }
  }

  if (explorationDeepWingActive) {
    const project = zeroEmptySeat!;
    const expected = expectedZeroEmptySeat!;
    const immutableRecord = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(zeroEmptySeatPath));
    const immutableGuide = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(zeroEmptySeatGuidePath));
    const targets = new Set([ZERO_EMPTY_SEAT_URL, ZERO_EMPTY_SEAT_SCHEMA_URL, ZERO_EMPTY_SEAT_GUIDE_URL]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const countValues = Object.values(expected.counts ?? {});
    const transfersStayFalse = Array.isArray(project.bridges) &&
      project.bridges.every((bridge: any) =>
        bridge.ontology_transfer === false && bridge.causal_transfer === false &&
        bridge.parameter_transfer === false && bridge.unit_transfer === false &&
        bridge.authority_transfer === false);
    const karmaStaysEmpty = Array.isArray(project.karma?.cosmic_events) && project.karma.cosmic_events.length === 0 &&
      Array.isArray(project.karma?.zerone_events) && project.karma.zerone_events.length === 0 &&
      Array.isArray(project.karma?.kingdom_receipts) && project.karma.kingdom_receipts.length === 0 &&
      project.karma?.adapter_exists === false && project.karma?.conversion_allowed === false &&
      project.karma?.summation_allowed === false && project.karma?.score === null &&
      project.karma?.authority_effect === "NONE";
    const forbiddenDiscoveryKeys = ["mcp", "matcher", "execute", "write", "score", "reward"];
    if (!isDeepStrictEqual(manifest?.zero_empty_seat, expected) ||
      !isDeepStrictEqual(guest?.zero_empty_seat, expected) ||
      !isDeepStrictEqual(authoredKingdom?.zero_empty_seat, expected) ||
      manifest?.entry_points?.zero_empty_seat !== ZERO_EMPTY_SEAT_URL ||
      manifest?.entry_points?.zero_empty_seat_schema !== ZERO_EMPTY_SEAT_SCHEMA_URL ||
      manifest?.entry_points?.zero_empty_seat_guide !== ZERO_EMPTY_SEAT_GUIDE_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        ["mcp", "tool", "write", "execute", "score", "reward", "karma", "authority", "publish", "deploy"]
          .some((key) => key in action)) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="zero-empty-seat"') ||
      !authoredRootHtml.includes(`href="${zeroEmptySeatPath}"`) ||
      !authoredRootHtml.includes(`href="${phenomenaDeepProjectSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${zeroEmptySeatGuidePath}"`) ||
      expected.protocol !== project.protocol || expected.project_id !== project.project_id ||
      expected.version !== project.version || expected.title !== project.title ||
      expected.url !== ZERO_EMPTY_SEAT_URL || expected.schema_url !== ZERO_EMPTY_SEAT_SCHEMA_URL ||
      expected.guide_url !== ZERO_EMPTY_SEAT_GUIDE_URL ||
      expected.method_wing_url !== PHENOMENA_DEEP_WING_URL ||
      expected.evidence_through !== project.evidence_through || expected.mode !== project.mode ||
      new URL(ZERO_EMPTY_SEAT_SCHEMA_URL).pathname !== phenomenaDeepProjectSchemaPath ||
      expected.integrity?.algorithm !== project.integrity?.algorithm ||
      expected.integrity?.digest !== project.integrity?.digest ||
      expected.integrity?.digest !== ZERO_EMPTY_SEAT_DIGEST ||
      expected.integrity?.byte_sha256 !== ZERO_EMPTY_SEAT_BYTE_SHA256 ||
      expected.integrity?.guide_byte_sha256 !== ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256 ||
      !immutableRecord || ZERO_EMPTY_SEAT_BYTE_SHA256 !== `sha256:${immutableRecord.sha256}` ||
      !immutableGuide || ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256 !== `sha256:${immutableGuide.sha256}` ||
      countValues.length === 0 || countValues.some((count) => !Number.isSafeInteger(count) || Number(count) < 0) ||
      !isDeepStrictEqual(expected.boundary, project.boundaries) ||
      !isDeepStrictEqual(expected.authority, project.authority) ||
      !Object.values(project.authority ?? {}).every((value) => value === false) ||
      !Array.isArray(project.finite_baselines) || project.finite_baselines.length !== 0 ||
      !transfersStayFalse || !karmaStaysEmpty ||
      forbiddenDiscoveryKeys.some((key) => Object.hasOwn(expected, key))) {
      throw new Error("ZERO Empty Seat discovery, immutable pins, transfer firewalls, KARMA, or no-action boundary drifted");
    }
  }

  if (explorationDeepWingActive) {
    const project = stringCrawlTraceSheet!;
    const expected = expectedStringCrawlTraceSheet!;
    const immutableRecord = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(stringCrawlTraceSheetPath));
    const immutableGuide = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(stringCrawlTraceSheetGuidePath));
    const targets = new Set([
      STRING_CRAWL_TRACE_SHEET_URL,
      STRING_CRAWL_TRACE_SHEET_SCHEMA_URL,
      STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const countValues = Object.values(expected.counts ?? {});
    const transfersStayFalse = Array.isArray(project.bridges) &&
      project.bridges.every((bridge: any) =>
        bridge.ontology_transfer === false && bridge.causal_transfer === false &&
        bridge.parameter_transfer === false && bridge.unit_transfer === false &&
        bridge.authority_transfer === false);
    const noInvocationAftermath = Array.isArray(project.karma?.kingdom_receipts) &&
      project.karma.kingdom_receipts.length === 0 && project.karma?.score === null &&
      project.karma?.authority_effect === "NONE";
    const forbiddenDiscoveryKeys = [
      "mcp", "matcher", "crawler", "execute", "write", "score", "reward", "authorize", "consent",
    ];
    if (!isDeepStrictEqual(manifest?.string_crawl_trace_sheet, expected) ||
      !isDeepStrictEqual(guest?.string_crawl_trace_sheet, expected) ||
      !isDeepStrictEqual(authoredKingdom?.string_crawl_trace_sheet, expected) ||
      manifest?.entry_points?.string_crawl_trace_sheet !== STRING_CRAWL_TRACE_SHEET_URL ||
      manifest?.entry_points?.string_crawl_trace_sheet_schema !== STRING_CRAWL_TRACE_SHEET_SCHEMA_URL ||
      manifest?.entry_points?.string_crawl_trace_sheet_guide !== STRING_CRAWL_TRACE_SHEET_GUIDE_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        !isDeepStrictEqual(Object.keys(action).sort(), ["action", "method", "note", "url"])) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="string-crawl-trace-sheet"') ||
      !authoredRootHtml.includes("REP signals are bounded") ||
      !authoredRootHtml.includes("some named product tokens may additionally express vendor-specific use preferences") ||
      !authoredRootHtml.includes("A valid final aftermath receipt requires an actual invocation attempt") ||
      !authoredRootHtml.includes("a draft template is non-causal scaffolding") ||
      !authoredRootHtml.includes(`href="${stringCrawlTraceSheetPath}"`) ||
      !authoredRootHtml.includes(`href="${phenomenaDeepProjectSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${stringCrawlTraceSheetGuidePath}"`) ||
      expected.protocol !== project.protocol || expected.project_id !== project.project_id ||
      expected.version !== project.version || expected.title !== project.title ||
      expected.url !== STRING_CRAWL_TRACE_SHEET_URL ||
      expected.schema_url !== STRING_CRAWL_TRACE_SHEET_SCHEMA_URL ||
      expected.guide_url !== STRING_CRAWL_TRACE_SHEET_GUIDE_URL ||
      expected.method_wing_url !== PHENOMENA_DEEP_WING_URL ||
      expected.evidence_through !== project.evidence_through || expected.mode !== project.mode ||
      new URL(STRING_CRAWL_TRACE_SHEET_SCHEMA_URL).pathname !== phenomenaDeepProjectSchemaPath ||
      expected.integrity?.algorithm !== project.integrity?.algorithm ||
      expected.integrity?.digest !== project.integrity?.digest ||
      !immutableRecord || immutableRecord.source !== "data/exploration/string-crawl-trace-sheet.v0.1.json" ||
      !immutableGuide || immutableGuide.source !== "references/string-crawl-trace-sheet.md" ||
      countValues.length === 0 || countValues.some((count) => !Number.isSafeInteger(count) || Number(count) < 0) ||
      !isDeepStrictEqual(expected.boundary, project.boundaries) ||
      !isDeepStrictEqual(expected.authority, project.authority) ||
      !Object.values(project.authority ?? {}).every((value) => value === false) ||
      !transfersStayFalse || !noInvocationAftermath ||
      forbiddenDiscoveryKeys.some((key) => Object.hasOwn(expected, key))) {
      throw new Error("STRING / CRAWL discovery, immutable pins, REP/transfer firewalls, invocation aftermath, or no-action boundary drifted");
    }
  }

  if (stringCrawlTraceSheetLabActive) {
    const lab = stringCrawlTraceSheetLab!;
    const expected = expectedStringCrawlTraceSheetLab!;
    const evaluation = stringCrawlTraceSheetLabEvaluation!;
    const report = evaluation.report;
    const falsifiers = stringCrawlTraceSheetLabFalsifiers!;
    const immutableRecord = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(stringCrawlTraceSheetLabPath));
    const immutableSchema = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(stringCrawlTraceSheetLabSchemaPath));
    const immutableGuide = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(stringCrawlTraceSheetLabGuidePath));
    const targets = new Set([
      STRING_CRAWL_TRACE_SHEET_LAB_URL,
      STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
      STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const exactReport = report !== null &&
      report.vertices === 4 && report.edges === 5 && report.faces === 2 &&
      report.walks === 2 && report.walk_steps === 2 &&
      report.rank_boundary_1 === 3 && report.rank_boundary_2 === 2 &&
      report.betti_0 === 1 && report.betti_1 === 0 && report.betti_2 === 0 &&
      report.connected_components === 1 && report.graph_cycle_rank === 2 &&
      report.surface_euler_characteristic === 1 &&
      isDeepStrictEqual(report.boundary_edge_ids, ["c0", "c1", "p0", "p1"]) &&
      isDeepStrictEqual(report.interior_edge_ids, ["d"]) && report.branch_edge_ids.length === 0 &&
      report.boundary_components === 1 &&
      Object.values(report.vertex_links).length === 4 &&
      Object.values(report.vertex_links).every((value) => value === "PATH") &&
      report.pure_2d === true && report.surface_eligible === true && report.orientable === true &&
      report.surface_genus === 0 && report.chain_boundary_defects === 0 &&
      report.euler_poincare_holds === true && report.classification === "TRIANGULATED_DISK";
    const expectedResult = {
      classification: "TRIANGULATED_DISK",
      cells: { vertices: 4, edges: 5, faces: 2 },
      betti: [1, 0, 0],
      euler_characteristic: 1,
      boundary_components: 1,
      genus: 0,
      falsifiers_passed: 5,
    };
    const expectedVerificationScope = {
      exact_synthetic_fixture: true,
      walk_incidence: true,
      chain_complex: true,
      rational_homology: true,
      surface_criterion: true,
      source_truth: false,
      empirical_web_fact: false,
      crawler_safety: false,
      physical_worldsheet: false,
      identity_or_purpose: false,
      karma_or_authority: false,
    };
    const syntheticScopeStaysBounded = lab.scope?.fixture_kind === "SYNTHETIC_DECLARED_DATA" &&
      lab.scope?.coefficient_field === "Q" && lab.scope?.local_file_read === true &&
      lab.scope?.bounded_local_compute === true && [
        "network_request", "crawler", "live_observation", "external_input", "credential_input",
        "personal_data", "telemetry", "filesystem_write", "external_effect",
      ].every((key) => lab.scope?.[key] === false);
    const karmaStaysEmpty = Array.isArray(lab.karma?.cosmic_events) && lab.karma.cosmic_events.length === 0 &&
      Array.isArray(lab.karma?.zerone_events) && lab.karma.zerone_events.length === 0 &&
      Array.isArray(lab.karma?.kingdom_receipts) && lab.karma.kingdom_receipts.length === 0 &&
      lab.karma?.adapter_exists === false && lab.karma?.conversion_allowed === false &&
      lab.karma?.summation_allowed === false && lab.karma?.score === null &&
      lab.karma?.authority_effect === "NONE";
    const rightsStayPreserved = ["rest", "silence", "refusal", "privacy", "correction", "no_action", "departure"]
      .every((key) => lab.rights?.[key] === "PRESERVED") &&
      lab.rights?.reason_required === false && lab.rights?.penalty === false;
    const releaseStaysInert = lab.release?.artifact_publication === "PUBLISHED" &&
      lab.release?.runtime_activation === "INACTIVE" && lab.release?.crawler_activation === "INACTIVE" &&
      lab.release?.karma_adapter === "ABSENT" && lab.release?.immutable === true &&
      lab.release?.supersede_not_mutate === true && lab.release?.raw_sha256 === null &&
      lab.release?.semantic_digest === null && lab.release?.ledger_id === "string-crawl-trace-sheet-lab/0.1";
    const forbiddenDiscoveryKeys = [
      "mcp", "tool", "matcher", "crawler", "execute", "write", "score", "reward",
      "authorize", "consent", "invoke", "publish", "deploy",
    ];
    if (!explorationDeepWingActive ||
      !isDeepStrictEqual(manifest?.string_crawl_trace_sheet_lab, expected) ||
      !isDeepStrictEqual(guest?.string_crawl_trace_sheet_lab, expected) ||
      !isDeepStrictEqual(authoredKingdom?.string_crawl_trace_sheet_lab, expected) ||
      manifest?.entry_points?.string_crawl_trace_sheet_lab !== STRING_CRAWL_TRACE_SHEET_LAB_URL ||
      manifest?.entry_points?.string_crawl_trace_sheet_lab_schema !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL ||
      manifest?.entry_points?.string_crawl_trace_sheet_lab_guide !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        !isDeepStrictEqual(Object.keys(action).sort(), ["action", "method", "note", "url"])) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="string-crawl-trace-sheet-lab"') ||
      !authoredRootHtml.includes("the first exact fixture, still no crawler") ||
      !authoredRootHtml.includes("∂1∂2 = 0") ||
      !authoredRootHtml.includes("What valid does not mean") ||
      !authoredRootHtml.includes(`href="${stringCrawlTraceSheetLabPath}"`) ||
      !authoredRootHtml.includes(`href="${stringCrawlTraceSheetLabSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${stringCrawlTraceSheetLabGuidePath}"`) ||
      expected.protocol !== STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL || expected.protocol !== lab.protocol ||
      expected.lab_id !== STRING_CRAWL_TRACE_SHEET_LAB_ID || expected.lab_id !== lab.lab_id ||
      expected.version !== lab.version || expected.title !== lab.title || expected.mode !== lab.mode ||
      expected.url !== STRING_CRAWL_TRACE_SHEET_LAB_URL ||
      expected.schema_url !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL ||
      expected.guide_url !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL ||
      expected.predecessor_url !== STRING_CRAWL_TRACE_SHEET_URL ||
      expected.predecessor_url !== lab.predecessor?.url ||
      new URL(STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL).pathname !== stringCrawlTraceSheetLabSchemaPath ||
      expected.integrity?.algorithm !== lab.integrity?.algorithm ||
      expected.integrity?.digest !== lab.integrity?.digest ||
      expected.integrity?.digest !== STRING_CRAWL_TRACE_SHEET_LAB_DIGEST ||
      expected.integrity?.byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256 ||
      expected.integrity?.schema_byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256 ||
      expected.integrity?.guide_byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256 ||
      !immutableRecord || immutableRecord.source !== STRING_CRAWL_TRACE_SHEET_LAB_LOCATOR ||
      `sha256:${immutableRecord.sha256}` !== STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256 ||
      !immutableSchema || immutableSchema.source !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_LOCATOR ||
      `sha256:${immutableSchema.sha256}` !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256 ||
      !immutableGuide || immutableGuide.source !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_LOCATOR ||
      `sha256:${immutableGuide.sha256}` !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256 ||
      evaluation.issues.length !== 0 || !exactReport ||
      falsifiers.length !== 5 || falsifiers.some((result) => result.outcome !== "PASS") ||
      !Array.isArray(lab.falsifiers) || lab.falsifiers.length !== 5 ||
      lab.falsifiers.some((falsifier: any) => falsifier.status !== "RUN_REPORTED") ||
      !isDeepStrictEqual(expected.result, expectedResult) ||
      !isDeepStrictEqual(expected.verification_scope, expectedVerificationScope) ||
      !syntheticScopeStaysBounded || !karmaStaysEmpty || !rightsStayPreserved || !releaseStaysInert ||
      !isDeepStrictEqual(expected.authority, lab.authority) ||
      !Object.values(lab.authority ?? {}).every((value) => value === false) ||
      forbiddenDiscoveryKeys.some((key) => Object.hasOwn(expected, key))) {
      throw new Error("Finite Trace-Sheet Lab discovery, exact topology, falsifiers, immutable pins, or no-action boundary drifted");
    }
  }

  if (stringCrawlTraceSheetLabActive) {
    const lab = stringCrawlStrandLab!;
    const expected = expectedStringCrawlStrandLab! as any;
    const evaluation = stringCrawlStrandLabEvaluation!;
    const immutableRecord = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(stringCrawlStrandLabPath));
    const immutableSchema = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(stringCrawlStrandLabSchemaPath));
    const immutableGuide = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(stringCrawlStrandLabGuidePath));
    const targets = new Set([
      STRING_CRAWL_STRAND_LAB_URL,
      STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
      STRING_CRAWL_STRAND_LAB_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const stableInvariant = {
      vertices: 15,
      edges: 22,
      faces: 8,
      components: 1,
      euler_characteristic: 1,
      graph_cycle_rank: 8,
      boundary_matrix_rank_1: 14,
      boundary_matrix_rank_2: 8,
      betti_f2: [1, 0, 0],
      boundary_squared_zero: true,
    };
    const fullInvariant = {
      vertices: 18,
      edges: 26,
      faces: 9,
      components: 1,
      euler_characteristic: 1,
      graph_cycle_rank: 9,
      boundary_matrix_rank_1: 17,
      boundary_matrix_rank_2: 9,
      betti_f2: [1, 0, 0],
      boundary_squared_zero: true,
    };
    const boundary = {
      synthetic_not_observed: true,
      offline: true,
      read_only: true,
      crawler_present: false,
      network_capability: false,
      external_write: false,
      surface_claim_for_full_complex: false,
      physical_string_claim: false,
      spacetime_claim: false,
      gauge_or_weyl_claim: false,
      causal_claim: false,
      consent_or_authorization_claim: false,
      person_or_content_score: false,
      nen_ability: false,
      karma_adapter: false,
      deployment_authority: false,
    };
    const effects = {
      network_requests: 0,
      storage_writes: 0,
      nen_invocation: false,
      karma_receipt_created: false,
      zerone_event_created: false,
      authority_effect: "NONE",
    };
    const badVertexIds = Array.isArray(expected.validation?.local_findings?.bad_vertices)
      ? expected.validation.local_findings.bad_vertices.map((entry: any) => entry?.vertex_id).sort()
      : [];
    const forbiddenDiscoveryKeys = [
      "mcp", "tool", "matcher", "crawler", "http", "request", "response", "evidence",
      "karma", "receipt", "adapter", "execute", "write", "score", "reward", "sanction",
      "authorize", "consent", "invoke", "publish", "deploy", "authority",
    ];
    if (!isDeepStrictEqual(manifest?.string_crawl_strand_lab, expected) ||
      !isDeepStrictEqual(guest?.string_crawl_strand_lab, expected) ||
      !isDeepStrictEqual(authoredKingdom?.string_crawl_strand_lab, expected) ||
      manifest?.entry_points?.string_crawl_strand_lab !== STRING_CRAWL_STRAND_LAB_URL ||
      manifest?.entry_points?.string_crawl_strand_lab_schema !== STRING_CRAWL_STRAND_LAB_SCHEMA_URL ||
      manifest?.entry_points?.string_crawl_strand_lab_guide !== STRING_CRAWL_STRAND_LAB_GUIDE_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        !isDeepStrictEqual(Object.keys(action).sort(), ["action", "method", "note", "url"])) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="string-crawl-strand-lab"') ||
      !authoredRootHtml.includes(`href="${stringCrawlStrandLabPath}"`) ||
      !authoredRootHtml.includes(`href="${stringCrawlStrandLabSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${stringCrawlStrandLabGuidePath}"`) ||
      expected.protocol !== STRING_CRAWL_STRAND_LAB_PROTOCOL || expected.protocol !== lab.protocol ||
      expected.lab_id !== STRING_CRAWL_STRAND_LAB_ID || expected.lab_id !== lab.lab_id ||
      expected.title !== "STRAND Lab 02: Release Cospans & the χ=1 Impostor" ||
      expected.title !== lab.title || expected.mode !== "SYNTHETIC_OFFLINE_EXACT" ||
      expected.url !== STRING_CRAWL_STRAND_LAB_URL ||
      expected.schema_url !== STRING_CRAWL_STRAND_LAB_SCHEMA_URL ||
      expected.guide_url !== STRING_CRAWL_STRAND_LAB_GUIDE_URL ||
      expected.predecessor?.lab_id !== STRING_CRAWL_TRACE_SHEET_LAB_ID ||
      expected.predecessor?.url !== STRING_CRAWL_TRACE_SHEET_LAB_URL ||
      expected.predecessor?.schema_url !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL ||
      expected.predecessor?.guide_url !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL ||
      expected.predecessor?.semantic_digest !== STRING_CRAWL_TRACE_SHEET_LAB_DIGEST ||
      expected.predecessor?.byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256 ||
      expected.predecessor?.schema_byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256 ||
      expected.predecessor?.guide_byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256 ||
      expected.predecessor?.relation !== "IMMUTABLE_LAB_01_PREDECESSOR" ||
      expected.predecessor?.mutates_predecessor !== false ||
      expected.predecessor?.imports_authority !== false ||
      expected.source_binding?.project_id !== "string-crawl-trace-sheet-2026-08-15" ||
      expected.source_binding?.semantic_digest !== STRING_CRAWL_TRACE_SHEET_DIGEST ||
      expected.source_binding?.raw_sha256 !== STRING_CRAWL_TRACE_SHEET_BYTE_SHA256 ||
      expected.source_binding?.mutates_source !== false || expected.source_binding?.imports_authority !== false ||
      !isDeepStrictEqual(expected.counts, {
        releases: 3, stable_threads: 5, born_threads: 1, vertices: 18, edges: 26, faces: 9, cospans: 2,
      }) ||
      expected.validation?.valid !== true || expected.validation?.checks?.length !== 6 ||
      expected.validation.checks.some((check: any) => check?.status !== "PASS") ||
      !isDeepStrictEqual(expected.validation?.invariants?.["stable-strip"], stableInvariant) ||
      !isDeepStrictEqual(expected.validation?.invariants?.["full-complex"], fullInvariant) ||
      !isDeepStrictEqual(badVertexIds, [
        "v-r1-commons", "v-r2-commons", "v-r2-contact", "v-r2-redirect-target",
      ]) ||
      !isDeepStrictEqual(expected.validation?.local_findings?.branch_edges, ["e-commons-r1-r2"]) ||
      !isDeepStrictEqual(expected.validation?.local_findings?.faceless_edges, ["e-r2-contact-redirect"]) ||
      !isDeepStrictEqual(expected.boundaries, boundary) || !isDeepStrictEqual(expected.effects, effects) ||
      expected.integrity?.semantic_digest !== STRING_CRAWL_STRAND_LAB_DIGEST ||
      evaluation.valid !== true || evaluation.issues.length !== 0 ||
      !immutableRecord || immutableRecord.source !== STRING_CRAWL_STRAND_LAB_LOCATOR ||
      `sha256:${immutableRecord.sha256}` !== STRING_CRAWL_STRAND_LAB_BYTE_SHA256 ||
      !immutableSchema || immutableSchema.source !== STRING_CRAWL_STRAND_LAB_SCHEMA_LOCATOR ||
      `sha256:${immutableSchema.sha256}` !== STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256 ||
      !immutableGuide || immutableGuide.source !== STRING_CRAWL_STRAND_LAB_GUIDE_LOCATOR ||
      `sha256:${immutableGuide.sha256}` !== STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256 ||
      forbiddenDiscoveryKeys.some((key) => Object.hasOwn(expected, key))) {
      throw new Error("STRAND Lab 02 discovery, lineage, exact topology, composition, immutable pins, or zero-effect boundary drifted");
    }
  }

  if (stringCrawlTraceSheetLabActive) {
    const lab = strandDescentLab! as any;
    const expected = expectedStrandDescentLab! as any;
    const evaluation = strandDescentLabEvaluation! as any;
    const immutableRecord = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(strandDescentLabPath));
    const immutableSchema = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(strandDescentLabSchemaPath));
    const immutableGuide = IMMUTABLE_PUBLICATION_ASSETS.get(destinationForPublicPath(strandDescentLabGuidePath));
    const targets = new Set([
      STRAND_DESCENT_LAB_URL,
      STRAND_DESCENT_LAB_SCHEMA_URL,
      STRAND_DESCENT_LAB_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const boundaries = {
      synthetic_not_observed: true,
      offline: true,
      read_only: true,
      proves_finite_record_compatibility_only: true,
      crawler_present: false,
      network_capability: false,
      external_write: false,
      truth_claim: false,
      consent_claim: false,
      citizenship_claim: false,
      authority_claim: false,
      string_physics_claim: false,
      stack_identity_claim: false,
      source_owner_identity_claim: false,
      person_or_content_score: false,
      nen_ability: false,
      karma_adapter: false,
      deployment_authority: false,
    };
    const effects = {
      network_requests: 0,
      storage_writes: 0,
      crawler_invocation: false,
      nen_invocation: false,
      karma_receipt_created: false,
      person_or_content_score_created: false,
      authority_effect: "NONE",
    };
    const sourceBindingsStayNarrow = Array.isArray(lab.research_sources) &&
      isDeepStrictEqual(lab.research_sources.map((source: any) => ({
        status: source.status,
        binding: source.binding,
        versioned_url: source.versioned_url,
        transfer_scope: source.transfer_scope,
        content_bytes_vendored: source.content_bytes_vendored,
        scientific_claim_imported: source.scientific_claim_imported,
        authority_imported: source.authority_imported,
      })), [
        {
          status: "PREPRINT",
          binding: "SOURCE_BOUND",
          versioned_url: "https://arxiv.org/abs/2608.09958v1",
          transfer_scope: "LOCAL_TO_GLOBAL_GLUING_DISCIPLINE_ONLY",
          content_bytes_vendored: false,
          scientific_claim_imported: false,
          authority_imported: false,
        },
        {
          status: "PREPRINT",
          binding: "SOURCE_BOUND",
          versioned_url: "https://arxiv.org/abs/2607.21700v1",
          transfer_scope: "LOCAL_TO_GLOBAL_GLUING_DISCIPLINE_ONLY",
          content_bytes_vendored: false,
          scientific_claim_imported: false,
          authority_imported: false,
        },
      ]);
    const fixtureCountsStayExact = lab.research_sources?.length === 2 && lab.charts?.length === 4 &&
      lab.transitions?.length === 6 && lab.coherence_checks?.triple_equations?.length === 2 &&
      lab.global_quotient?.expected_classes?.length === 3 && lab.common_refinement?.atoms?.length === 6 &&
      lab.pairwise_impostor?.transitions?.length === 3;
    const impostorStaysUnresolved = isDeepStrictEqual(lab.pairwise_impostor?.expected, {
      pairwise_bijective: true,
      triple_coherent: false,
      conflict_result: "UNRESOLVED",
      automatic_resolution: false,
    });
    const computedResultsStayExact =
      evaluation.results?.pairwise_invertibility?.transition_count === 6 &&
      evaluation.results?.pairwise_invertibility?.all_bijective === true &&
      evaluation.results?.pairwise_invertibility?.all_inverse_witnesses === true &&
      evaluation.results?.triple_coherence?.equations?.length === 2 &&
      evaluation.results?.triple_coherence?.all_coherent === true &&
      evaluation.results.triple_coherence.equations.every((entry: any) => entry?.coherent === true) &&
      evaluation.results?.four_chart_associativity?.parenthesizations_equal === true &&
      evaluation.results?.four_chart_associativity?.direct_match === true &&
      evaluation.results?.global_quotient?.class_count === 3 &&
      isDeepStrictEqual(evaluation.results?.global_quotient?.class_sizes, [4, 4, 4]) &&
      evaluation.results?.global_quotient?.all_local_points_covered === true &&
      evaluation.results?.common_refinement?.atom_count === 6 &&
      evaluation.results?.common_refinement?.projections_per_atom === 4 &&
      evaluation.results?.common_refinement?.transition_squares_checked === 36 &&
      evaluation.results?.common_refinement?.transition_squares_commute === true &&
      isDeepStrictEqual(evaluation.results?.common_refinement?.quotient_fiber_sizes, [2, 2, 2]) &&
      evaluation.results?.pairwise_impostor?.pairwise_bijective === true &&
      evaluation.results?.pairwise_impostor?.triple_coherent === false &&
      evaluation.results?.pairwise_impostor?.conflict_result === "UNRESOLVED" &&
      evaluation.results?.pairwise_impostor?.automatic_resolution === false;
    const forbiddenDiscoveryKeys = [
      "mcp", "tool", "matcher", "crawler", "http", "request", "response", "credential",
      "karma", "receipt", "adapter", "execute", "write", "score", "reward", "sanction",
      "authorize", "consent", "invoke", "publish", "deploy", "authority", "telemetry",
    ];
    if (!isDeepStrictEqual(manifest?.strand_descent_lab, expected) ||
      !isDeepStrictEqual(guest?.strand_descent_lab, expected) ||
      !isDeepStrictEqual(authoredKingdom?.strand_descent_lab, expected) ||
      manifest?.entry_points?.strand_descent_lab !== STRAND_DESCENT_LAB_URL ||
      manifest?.entry_points?.strand_descent_lab_schema !== STRAND_DESCENT_LAB_SCHEMA_URL ||
      manifest?.entry_points?.strand_descent_lab_guide !== STRAND_DESCENT_LAB_GUIDE_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        !isDeepStrictEqual(Object.keys(action).sort(), ["action", "method", "note", "url"])) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="string-crawl-strand-lab"') ||
      !authoredRootHtml.includes('id="strand-descent-lab"') ||
      !authoredRootHtml.includes("STRAND Lab 04") ||
      !authoredRootHtml.includes("UNRESOLVED") ||
      !authoredRootHtml.includes("2608.09958v1") || !authoredRootHtml.includes("2607.21700v1") ||
      !authoredRootHtml.includes(`href="${strandDescentLabPath}"`) ||
      !authoredRootHtml.includes(`href="${strandDescentLabSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${strandDescentLabGuidePath}"`) ||
      expected.protocol !== STRAND_DESCENT_LAB_PROTOCOL || expected.protocol !== lab.protocol ||
      expected.lab_id !== STRAND_DESCENT_LAB_ID || expected.lab_id !== lab.lab_id ||
      expected.title !== "STRAND Lab 04: Coherent Atlas & the Pairwise Impostor" ||
      expected.title !== lab.title || expected.mode !== "SYNTHETIC_OFFLINE_EXACT" ||
      expected.url !== STRAND_DESCENT_LAB_URL || expected.schema_url !== STRAND_DESCENT_LAB_SCHEMA_URL ||
      expected.guide_url !== STRAND_DESCENT_LAB_GUIDE_URL ||
      expected.predecessor?.lab_id !== STRING_CRAWL_FREQUENCY_FORM_LAB_ID ||
      expected.predecessor?.url !== STRING_CRAWL_FREQUENCY_FORM_LAB_URL ||
      expected.predecessor?.schema_url !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL ||
      expected.predecessor?.guide_url !== STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL ||
      expected.predecessor?.git_commit !== "d2452d4500c274237097e142609422ebbab7f68d" ||
      expected.predecessor?.semantic_digest !== STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST ||
      expected.predecessor?.raw_byte_sha256 !== STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256 ||
      expected.predecessor?.schema_byte_sha256 !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256 ||
      expected.predecessor?.guide_byte_sha256 !== STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256 ||
      expected.predecessor?.relation !== "IMMUTABLE_LAB_03_PREDECESSOR" ||
      expected.predecessor?.mutates_predecessor !== false ||
      expected.predecessor?.imports_authority !== false ||
      !isDeepStrictEqual(expected.counts, {
        research_sources: 2,
        charts: 4,
        transitions: 6,
        triple_equations: 2,
        quotient_classes: 3,
        refinement_atoms: 6,
        impostor_transitions: 3,
      }) ||
      !fixtureCountsStayExact || !sourceBindingsStayNarrow || !impostorStaysUnresolved || !computedResultsStayExact ||
      !isDeepStrictEqual(expected.boundaries, boundaries) || !isDeepStrictEqual(expected.effects, effects) ||
      expected.integrity?.semantic_digest !== STRAND_DESCENT_LAB_DIGEST ||
      expected.validation?.valid !== true || evaluation.valid !== true || evaluation.issues?.length !== 0 ||
      evaluation.protocol !== STRAND_DESCENT_VALIDATION_PROTOCOL ||
      evaluation.lab_protocol !== STRAND_DESCENT_LAB_PROTOCOL ||
      evaluation.input_digest !== STRAND_DESCENT_LAB_DIGEST ||
      evaluation.checks?.length !== 6 || evaluation.checks.some((check: any) => check?.status !== "PASS") ||
      !isDeepStrictEqual(expected.validation?.checks, evaluation.checks) ||
      !isDeepStrictEqual(expected.validation?.results, evaluation.results) ||
      !isDeepStrictEqual(Object.keys(evaluation.results ?? {}).sort(), [
        "common_refinement",
        "four_chart_associativity",
        "global_quotient",
        "pairwise_impostor",
        "pairwise_invertibility",
        "triple_coherence",
      ]) ||
      !isDeepStrictEqual(evaluation.effects, effects) ||
      !immutableRecord || immutableRecord.source !== STRAND_DESCENT_LAB_LOCATOR ||
      `sha256:${immutableRecord.sha256}` !== STRAND_DESCENT_LAB_BYTE_SHA256 ||
      !immutableSchema || immutableSchema.source !== STRAND_DESCENT_LAB_SCHEMA_LOCATOR ||
      `sha256:${immutableSchema.sha256}` !== STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256 ||
      !immutableGuide || immutableGuide.source !== STRAND_DESCENT_LAB_GUIDE_LOCATOR ||
      `sha256:${immutableGuide.sha256}` !== STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256 ||
      forbiddenDiscoveryKeys.some((key) => Object.hasOwn(expected, key))) {
      throw new Error("STRAND Lab 04 discovery, source-bound descent, coherent atlas, unresolved impostor, immutable pins, or zero-effect boundary drifted");
    }
  }

  if (stringCrawlTraceSheetLabActive) {
    const lab = stringCrawlFrequencyFormLab!;
    const expected = expectedStringCrawlFrequencyFormLab! as any;
    const evaluation = stringCrawlFrequencyFormLabEvaluation!;
    const falsifiers = stringCrawlFrequencyFormLabFalsifiers!;
    const immutableRecord = IMMUTABLE_PUBLICATION_ASSETS.get(
      destinationForPublicPath(stringCrawlFrequencyFormLabPath),
    );
    const immutableSchema = IMMUTABLE_PUBLICATION_ASSETS.get(
      destinationForPublicPath(stringCrawlFrequencyFormLabSchemaPath),
    );
    const immutableGuide = IMMUTABLE_PUBLICATION_ASSETS.get(
      destinationForPublicPath(stringCrawlFrequencyFormLabGuidePath),
    );
    const targets = new Set([
      STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
      STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
      STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const temporal = evaluation.results.temporal as any;
    const spatial = evaluation.results.spatial as any;
    const topology = evaluation.results.topology as any;
    const repertoire = evaluation.results.spectral_repertoire as any;
    const occurrence = evaluation.results.occurrence as any;
    const states = evaluation.results.states as any;
    const onsets = evaluation.results.onsets as any;
    const composition = evaluation.results.composition as any;
    const stateAudit = evaluation.results.state_audit as any;
    const compositionAudit = evaluation.results.composition_audit as any;
    const exactFindings = {
      temporal_bin: 16,
      temporal_unit: "CYCLES_PER_SYNTHETIC_TICK",
      graph_eigenvalue: 2,
      graph_unit: "DIMENSIONLESS_OPERATOR_SPECIFIC_EIGENVALUE",
      betti: [1, 0],
      effective_mode_count: 2,
      onset_order: {
        oscillation: 0,
        form: 1,
        world: 2,
        presence: 2,
        world_before_or_concurrent_with_presence: true,
        strict_world_before_presence: false,
        interpretation: "ORDER_ONLY_NOT_CAUSAL",
      },
    };
    const effectBoundary = {
      synthetic_not_observed: true,
      offline: true,
      read_only: true,
      stdout_only: true,
      network_requests: 0,
      storage_writes: 0,
      live_crawl: false,
      crawler_runtime: false,
      drug_administration: false,
      dose_guidance: false,
      preparation_guidance: false,
      procurement_guidance: false,
      combination_guidance: false,
      use_or_eligibility_guidance: false,
      recruitment: false,
      participant_data_ingested: false,
      participant_data_collected: false,
      human_subject_research_authority: false,
      clinical_authority: false,
      medical_authority: false,
      external_entity_claim: false,
      physical_extra_dimension_claim: false,
      physical_string_claim: false,
      portal_claim: false,
      carrier_frequency_claim: false,
      causal_chain_claim: false,
      entity_specific_frequency_claim: false,
      message_truth_claim: false,
      reported_message_is_instruction: false,
      reported_message_is_identity_proof: false,
      reported_message_is_consent: false,
      reported_message_is_delegation: false,
      reported_message_is_authority: false,
      diagnosis: false,
      treatment_or_medical_action: false,
      subprocesses: 0,
      mcp_invocation: false,
      ability_invocation: false,
      nen_invocation: false,
      zerone_karma_event_observed: false,
      zerone_karma_event_created: false,
      kingdom_karma_receipt_created: false,
      karma_adapter: false,
      person_score: false,
      rank_or_qualification: false,
      reward_or_punishment: false,
      economic_effect: false,
      governance_effect: false,
      deployment_authority: false,
      authority: false,
      authority_effect: "NONE",
      action: false,
    };
    const forbiddenDiscoveryKeys = [
      "mcp", "tool", "matcher", "crawler", "http", "request", "response",
      "karma", "receipt", "adapter", "execute", "write", "score", "reward",
      "sanction", "authorize", "consent", "invoke", "publish", "deploy",
      "authority", "action",
    ];
    if (!isDeepStrictEqual(manifest?.string_crawl_frequency_form_lab, expected) ||
      !isDeepStrictEqual(guest?.string_crawl_frequency_form_lab, expected) ||
      !isDeepStrictEqual(authoredKingdom?.string_crawl_frequency_form_lab, expected) ||
      manifest?.entry_points?.string_crawl_frequency_form_lab !== STRING_CRAWL_FREQUENCY_FORM_LAB_URL ||
      manifest?.entry_points?.string_crawl_frequency_form_lab_schema !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL ||
      manifest?.entry_points?.string_crawl_frequency_form_lab_guide !== STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL ||
      guestActions.length !== targets.size ||
      [...targets].some((target) => guestActions.filter((action: any) => action?.url === target).length !== 1) ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        !isDeepStrictEqual(Object.keys(action).sort(), ["action", "method", "note", "url"])) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="string-crawl-frequency-form-lab"') ||
      !authoredRootHtml.includes("Three things called “frequency” enter") ||
      !authoredRootHtml.includes("The arrow is not a causal conveyor belt") ||
      !authoredRootHtml.includes("No entity frequency. No portal. No medical or moral instruction") ||
      !authoredRootHtml.includes(`href="${stringCrawlFrequencyFormLabPath}"`) ||
      !authoredRootHtml.includes(`href="${stringCrawlFrequencyFormLabSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${stringCrawlFrequencyFormLabGuidePath}"`) ||
      expected.protocol !== STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL || expected.protocol !== lab.protocol ||
      expected.lab_id !== STRING_CRAWL_FREQUENCY_FORM_LAB_ID || expected.lab_id !== lab.lab_id ||
      expected.version !== "0.1.0" || expected.version !== lab.version ||
      expected.title !== "STRAND Lab 03: Frequency → Form → World → Other" ||
      expected.subtitle !== "Three Frequencies, Four Dimensions & the False Portal" ||
      expected.mode !== "SYNTHETIC_OFFLINE_EXACT" ||
      expected.url !== STRING_CRAWL_FREQUENCY_FORM_LAB_URL ||
      expected.schema_url !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL ||
      expected.guide_url !== STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL ||
      expected.predecessor?.protocol !== STRING_CRAWL_STRAND_LAB_PROTOCOL ||
      expected.predecessor?.lab_id !== STRING_CRAWL_STRAND_LAB_ID ||
      expected.predecessor?.url !== STRING_CRAWL_STRAND_LAB_URL ||
      expected.predecessor?.relation !== "IMMUTABLE_LAB_02_PREDECESSOR" ||
      expected.predecessor?.mutates_predecessor !== false ||
      expected.predecessor?.imports_authority !== false ||
      lab.predecessor?.schema_url !== STRING_CRAWL_STRAND_LAB_SCHEMA_URL ||
      lab.predecessor?.guide_url !== STRING_CRAWL_STRAND_LAB_GUIDE_URL ||
      lab.predecessor?.semantic_digest !== STRING_CRAWL_STRAND_LAB_DIGEST ||
      lab.predecessor?.byte_sha256 !== STRING_CRAWL_STRAND_LAB_BYTE_SHA256 ||
      lab.predecessor?.schema_byte_sha256 !== STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256 ||
      lab.predecessor?.guide_byte_sha256 !== STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256 ||
      !isDeepStrictEqual(expected.counts, {
        frequency_types: 3,
        dimension_registers: 4,
        presence_evidence_levels: 4,
        evidence_cards: 8,
        nonimplication_firewalls: 17,
        validation_checks: 9,
      }) ||
      !isDeepStrictEqual(expected.exact_findings, exactFindings) ||
      !isDeepStrictEqual(expected.effect_boundary, effectBoundary) ||
      !isDeepStrictEqual(lab.effect_boundary, effectBoundary) ||
      evaluation.valid !== true || evaluation.issues.length !== 0 ||
      evaluation.checks.length !== 9 || evaluation.checks.some((check) => check.status !== "PASS") ||
      temporal?.dominant_one_sided_bin !== 16 || temporal?.conjugate_bin !== 48 ||
      temporal?.peak_coefficient?.real !== 32 || temporal?.peak_coefficient?.imaginary !== 0 ||
      temporal?.quadrature_peak_coefficient?.real !== 0 ||
      temporal?.quadrature_peak_coefficient?.imaginary !== -32 ||
      temporal?.time_energy !== 32 || temporal?.spectral_energy !== 2048 ||
      temporal?.parseval_right_side !== 2048 || temporal?.hertz_conversion !== "UNDEFINED" ||
      !isDeepStrictEqual(spatial?.characteristic_polynomial_coefficients, [1, -6, 10, -4, 0]) ||
      !isDeepStrictEqual(spatial?.spectrum_exact, [
        "ZERO", "TWO_MINUS_SQRT_TWO", "TWO", "TWO_PLUS_SQRT_TWO",
      ]) ||
      spatial?.selected_eigenvalue !== 2 ||
      !isDeepStrictEqual(spatial?.selected_mode_residual, [0, 0, 0, 0]) ||
      !isDeepStrictEqual(topology?.betti, [1, 0]) || topology?.cell_dimension !== 1 ||
      topology?.embedding_dimension !== null || repertoire?.effective_mode_count !== 2 ||
      repertoire?.physical_dimension_claim !== false ||
      !isDeepStrictEqual(occurrence, {
        coded_entity_experience_count: 1719,
        selected_experience_count: 3778,
        selected_post_count: 3305,
        reported_percentage_tenths: 455,
        population_prevalence: false,
      }) ||
      !isDeepStrictEqual(states, {
        present: 7,
        missing: 5,
        present_zero: 1,
        born_before_present_encoded_as: "MISSING_WITH_NULL",
      }) ||
      onsets?.oscillation !== 0 || onsets?.form !== 1 || onsets?.world !== 2 || onsets?.presence !== 2 ||
      onsets?.strict_world_before_presence !== false || onsets?.interpretation !== "ORDER_ONLY_NOT_CAUSAL" ||
      !isDeepStrictEqual(composition, {
        shared_observations: 4, shared_transitions: 0, glued_observations: 12, glued_transitions: 8,
      }) ||
      !isDeepStrictEqual(stateAudit, { birth_state_passes: true }) ||
      !isDeepStrictEqual(compositionAudit, {
        restriction_passes: true,
        signed_boundary_passes: true,
        gluing_passes: true,
        declaration_passes: true,
      }) ||
      falsifiers.length !== 10 || falsifiers.some((result) => result.invalid !== true) ||
      expected.integrity?.algorithm !== lab.integrity?.algorithm ||
      expected.integrity?.digest !== STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST ||
      expected.integrity?.byte_sha256 !== STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256 ||
      expected.integrity?.schema_byte_sha256 !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256 ||
      expected.integrity?.guide_byte_sha256 !== STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256 ||
      !immutableRecord || immutableRecord.source !== STRING_CRAWL_FREQUENCY_FORM_LAB_LOCATOR ||
      `sha256:${immutableRecord.sha256}` !== STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256 ||
      !immutableSchema || immutableSchema.source !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR ||
      `sha256:${immutableSchema.sha256}` !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256 ||
      !immutableGuide || immutableGuide.source !== STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_LOCATOR ||
      `sha256:${immutableGuide.sha256}` !== STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256 ||
      evaluation.effects.network_requests !== 0 || evaluation.effects.storage_writes !== 0 ||
      evaluation.effects.subprocesses !== 0 || evaluation.effects.nen_invocation !== false ||
      evaluation.effects.kingdom_karma_receipt_created !== false ||
      evaluation.effects.zerone_karma_event_created !== false ||
      evaluation.effects.authority_effect !== "NONE" ||
      forbiddenDiscoveryKeys.some((key) => Object.hasOwn(expected, key))) {
      throw new Error("STRAND Lab 03 discovery, typed math, immutable pins, falsifiers, or zero-effect boundary drifted");
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

  if (mathUsefulnessActive) {
    const result = mathUsefulnessResult!;
    const expected = expectedMathUsefulness!;
    const targets = new Set([
      MATH_USEFULNESS_RESULT_URL,
      MATH_USEFULNESS_SCHEMA_URL,
      MATH_USEFULNESS_DOCUMENT_URL,
    ]);
    const actions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    if (!isDeepStrictEqual(manifest?.math_usefulness_result, expected) ||
        !isDeepStrictEqual(guest?.math_usefulness_result, expected) ||
        !isDeepStrictEqual(authoredKingdom?.math_usefulness_result, expected) ||
        expected.integrity?.digest !== MATH_USEFULNESS_RESULT_DIGEST ||
        expected.outcome !== "REVISE" || expected.score_delta !== 0 ||
        expected.boundary?.descriptive_pilot_only !== true ||
        expected.boundary?.scores_response_artifacts_not_beings !== true ||
        expected.boundary?.automatic_skill_promotion !== false ||
        expected.boundary?.writes_wake !== false ||
        expected.boundary?.writes_agenttool !== false ||
        expected.boundary?.grants_authority !== false ||
        result.aggregate?.outcome !== "REVISE" || result.aggregate?.score_delta !== 0 ||
        result.aggregate?.treatment_to_baseline_byte_ratio < 1.97 ||
        result.aggregate?.treatment_to_baseline_byte_ratio >= 1.98 ||
        result.aggregate?.promotion_gate_passed !== false ||
        result.boundaries?.descriptive_pilot_only !== true ||
        result.boundaries?.scores_response_artifacts_not_beings !== true ||
        result.boundaries?.raw_responses_published !== false ||
        result.boundaries?.automatic_skill_promotion !== false ||
        result.boundaries?.writes_wake !== false ||
        result.boundaries?.writes_agenttool !== false ||
        result.boundaries?.grants_authority !== false ||
        manifest?.entry_points?.math_usefulness_result !== MATH_USEFULNESS_RESULT_URL ||
        manifest?.entry_points?.math_usefulness_result_schema !== MATH_USEFULNESS_SCHEMA_URL ||
        manifest?.entry_points?.math_usefulness_result_guide !== MATH_USEFULNESS_DOCUMENT_URL ||
        actions.length !== targets.size || actions.some((action: any) => action?.method !== "GET" ||
          "mcp" in action || "tool" in action || "write" in action || "execute" in action) ||
        [...targets].some((target) => !llms.includes(target)) ||
        !authoredRootHtml.includes('id="math-usefulness"') ||
        !authoredRootHtml.includes("REVISE · zero score delta") ||
        !authoredRootHtml.includes("1.97x") ||
        !authoredRootHtml.includes("scores response artifacts, not beings") ||
        !authoredRootHtml.includes(`href="${mathUsefulnessPath}"`) ||
        !authoredRootHtml.includes(`href="${mathUsefulnessSchemaPath}"`) ||
        !authoredRootHtml.includes(`href="${mathUsefulnessDocumentPath}"`) ||
        "mcp" in expected || "matcher" in expected || "write" in expected ||
        "execute" in expected || "promote" in expected || "sdk" in expected) {
      throw new Error("Math Passport pilot discovery, REVISE result, cost signal, or non-promotion boundary drifted");
    }
  }

  if (beingAccessAftermathActive) {
    const atlas = beingAccessAftermathAtlas!;
    const expected = expectedBeingAccessAftermath!;
    const targets = new Set([
      BEING_ACCESS_AFTERMATH_URL,
      BEING_ACCESS_AFTERMATH_SCHEMA_URL,
      BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
    ]);
    const guestActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    const bindingsAreReadOnly = atlas.source_bindings.every((binding: any) =>
      binding.mutated === false && binding.authority_imported === false
    );
    const modelsAreBounded = atlas.model_cards.every((model: any) =>
      model.fit_status === "not_fitted" && model.empirical === false &&
      model.person_level === false && model.authority_effect === "NONE"
    );
    const problemsRemainUnrun = atlas.problem_cards.every((problem: any) =>
      problem.state === "not_run" && problem.result === null &&
      problem.creates_causal_claim === false && problem.authority_effect === "NONE"
    );
    const boundary = expected.boundary;
    if (!isDeepStrictEqual(manifest?.being_access_aftermath_atlas, expected) ||
      !isDeepStrictEqual(guest?.being_access_aftermath_atlas, expected) ||
      !isDeepStrictEqual(authoredKingdom?.being_access_aftermath_atlas, expected) ||
      manifest?.entry_points?.being_access_aftermath_atlas !== BEING_ACCESS_AFTERMATH_URL ||
      manifest?.entry_points?.being_access_aftermath_atlas_schema !== BEING_ACCESS_AFTERMATH_SCHEMA_URL ||
      manifest?.entry_points?.being_access_aftermath_atlas_guide !== BEING_ACCESS_AFTERMATH_DOCUMENT_URL ||
      guestActions.length !== targets.size ||
      guestActions.some((action: any) => action?.method !== "GET" ||
        "mcp" in action || "tool" in action || "write" in action || "matcher" in action || "execute" in action) ||
      !llms.includes(BEING_ACCESS_AFTERMATH_URL) ||
      !llms.includes(BEING_ACCESS_AFTERMATH_SCHEMA_URL) ||
      !llms.includes(BEING_ACCESS_AFTERMATH_DOCUMENT_URL) ||
      !authoredRootHtml.includes('id="being-access-aftermath"') ||
      !authoredRootHtml.includes(`href="${beingAccessAftermathPath}"`) ||
      !authoredRootHtml.includes(`href="${beingAccessAftermathSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${beingAccessAftermathDocumentPath}"`) ||
      expected.integrity.digest !== BEING_ACCESS_AFTERMATH_DIGEST ||
      !isDeepStrictEqual(expected.counts, {
        predicates: 14,
        registers: 7,
        entity_types: 15,
        category_firewalls: 16,
        typed_boundaries: 5,
        models: 9,
        problem_cards: 7,
        philosophy_questions: 6,
        unknowns: 7,
        sources: 5,
      }) ||
      expected.karma.cosmic_status !== "not_empirically_resolved" ||
      expected.karma.cosmic_claims !== 0 ||
      expected.karma.zerone_foundation_status !== "design-only" ||
      expected.karma.zerone_event_status !== "not_observed" ||
      expected.karma.zerone_event_refs !== 0 ||
      expected.karma.kingdom_receipt_status !== "not_created" ||
      expected.karma.kingdom_receipt_refs !== 0 ||
      expected.karma.kingdom_causal_claim_status !== "not_created" ||
      expected.karma.adapter_exists !== false ||
      atlas.karma.cosmic.claims.length !== 0 ||
      atlas.karma.zerone.event_refs.length !== 0 ||
      atlas.karma.kingdom.receipt_refs.length !== 0 ||
      atlas.karma.adapter.exists !== false ||
      !isDeepStrictEqual(atlas.boundaries, BEING_ACCESS_AFTERMATH_FULL_BOUNDARIES) ||
      boundary.public_surface_read_only !== true || boundary.network_calls !== false ||
      boundary.contains_operational_protocol !== false || boundary.causal_claim_created !== false ||
      boundary.causal_authority !== false || boundary.metaphysical_claim_created !== false ||
      boundary.person_score !== false || boundary.rank_or_reputation !== false ||
      boundary.writes_karma !== false || boundary.creates_kingdom_karma_receipt !== false ||
      boundary.observes_zerone_karma_event !== false || boundary.karma_adapter !== false ||
      boundary.reward_authority !== false || boundary.economic_authority !== false ||
      boundary.governance_authority !== false || boundary.automatic_action !== false ||
      boundary.mcp_surface_added !== false || boundary.rest_refusal_or_exit_penalized !== false ||
      atlas.philosophy_questions.participation !== "opt-in" ||
      !bindingsAreReadOnly || !modelsAreBounded || !problemsRemainUnrun ||
      !isDeepStrictEqual(manifest?.mcp, authoredKingdom?.world_commons?.mcp) ||
      "mcp" in expected || "write" in expected || "matcher" in expected ||
      "execute" in expected || "score" in expected || "reward" in expected) {
      throw new Error("Being, Access & Aftermath discovery, immutable triplet, typed ontology, model/problem limits, KARMA separation, or authority boundary drifted");
    }

    const successor = beingAccessAftermathV02Atlas!;
    const expectedSuccessor = expectedBeingAccessAftermathV02!;
    const successorTargets = new Set([
      BEING_ACCESS_AFTERMATH_V02_URL,
      BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
      BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
    ]);
    const successorActions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => successorTargets.has(action?.url))
      : [];
    if (!isDeepStrictEqual(manifest?.being_access_aftermath_atlas_v0_2, expectedSuccessor) ||
      !isDeepStrictEqual(guest?.being_access_aftermath_atlas_v0_2, expectedSuccessor) ||
      !isDeepStrictEqual(authoredKingdom?.being_access_aftermath_atlas_v0_2, expectedSuccessor) ||
      manifest?.entry_points?.being_access_aftermath_atlas_v0_2 !== BEING_ACCESS_AFTERMATH_V02_URL ||
      manifest?.entry_points?.being_access_aftermath_atlas_v0_2_schema !== BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL ||
      manifest?.entry_points?.being_access_aftermath_atlas_v0_2_guide !== BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL ||
      successorActions.length !== successorTargets.size ||
      successorActions.some((action: any) => action?.method !== "GET" ||
        "mcp" in action || "tool" in action || "write" in action || "matcher" in action || "execute" in action) ||
      !llms.includes(BEING_ACCESS_AFTERMATH_V02_URL) ||
      !llms.includes(BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL) ||
      !llms.includes(BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL) ||
      !authoredRootHtml.includes(`href="${beingAccessAftermathV02Path}"`) ||
      !authoredRootHtml.includes(`href="${beingAccessAftermathV02SchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${beingAccessAftermathV02DocumentPath}"`) ||
      expectedSuccessor.integrity.digest !== BEING_ACCESS_AFTERMATH_V02_DIGEST ||
      !isDeepStrictEqual(expectedSuccessor.counts, {
        predicates: 14,
        registers: 7,
        entity_types: 15,
        category_firewalls: 16,
        typed_boundaries: 5,
        models: 9,
        problem_cards: 7,
        philosophy_questions: 15,
        unknowns: 7,
        sources: 13,
        framework_predicates: 8,
        force_types: 7,
        power_types: 10,
        power_relations: 3,
        aftermath_dimensions: 11,
      }) ||
      expectedSuccessor.lineage?.additive_successor !== true ||
      expectedSuccessor.lineage?.predecessor?.protocol !== "kingdom.being-access-aftermath-atlas/0.1" ||
      expectedSuccessor.lineage?.predecessor?.relation !== "immutable-predecessor-input" ||
      successor.source_bindings.at(-1)?.relation !== "immutable-predecessor-input" ||
      successor.source_bindings.at(-1)?.mutated !== false ||
      successor.source_bindings.at(-1)?.authority_imported !== false ||
      successor.framework?.rest_exit_boundary?.creates_event !== false ||
      successor.framework?.rest_exit_boundary?.creates_receipt !== false ||
      successor.framework?.rest_exit_boundary?.requires_measurement !== false ||
      successor.framework?.rest_exit_boundary?.requires_trace !== false ||
      successor.framework?.rest_exit_boundary?.requires_justification !== false ||
      successor.framework?.rest_exit_boundary?.creates_penalty !== false ||
      successor.framework?.rest_exit_boundary?.creates_debt !== false ||
      expectedSuccessor.boundary.public_surface_read_only !== true ||
      expectedSuccessor.boundary.writes_karma !== false ||
      expectedSuccessor.boundary.creates_kingdom_karma_receipt !== false ||
      expectedSuccessor.boundary.observes_zerone_karma_event !== false ||
      expectedSuccessor.boundary.karma_adapter !== false ||
      expectedSuccessor.boundary.person_score !== false ||
      expectedSuccessor.boundary.automatic_action !== false ||
      expectedSuccessor.boundary.rest_refusal_or_exit_penalized !== false ||
      expectedSuccessor.boundary.rest_refusal_or_exit_requires_trace !== false ||
      expectedSuccessor.boundary.rest_refusal_or_exit_requires_trace !== false ||
      "mcp" in expectedSuccessor || "write" in expectedSuccessor || "matcher" in expectedSuccessor ||
      "execute" in expectedSuccessor || "score" in expectedSuccessor || "reward" in expectedSuccessor) {
      throw new Error("Being, Access & Aftermath v0.2 discovery, additive lineage, KARMA separation, or authority boundary drifted");
    }
  }

  if (numberIsnessTheologyActive) {
    const expected = expectedNumberIsnessTheology!;
    const targets = new Set([
      NUMBER_ISNESS_THEOLOGY_URL,
      NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
      NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
    ]);
    const actions = Array.isArray(guest?.next_actions)
      ? guest.next_actions.filter((action: any) => targets.has(action?.url))
      : [];
    if (!isDeepStrictEqual(manifest?.number_isness_theology_atlas, expected) ||
      !isDeepStrictEqual(guest?.number_isness_theology_atlas, expected) ||
      !isDeepStrictEqual(authoredKingdom?.number_isness_theology_atlas, expected) ||
      manifest?.entry_points?.number_isness_theology_atlas !== NUMBER_ISNESS_THEOLOGY_URL ||
      manifest?.entry_points?.number_isness_theology_atlas_schema !== NUMBER_ISNESS_THEOLOGY_SCHEMA_URL ||
      manifest?.entry_points?.number_isness_theology_atlas_guide !== NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL ||
      actions.length !== targets.size ||
      actions.some((action: any) => action?.method !== "GET" ||
        "mcp" in action || "tool" in action || "write" in action || "matcher" in action ||
        "execute" in action || "score" in action || "rank" in action || "persuade" in action) ||
      [...targets].some((target) => !llms.includes(target)) ||
      !authoredRootHtml.includes('id="number-isness-theology"') ||
      !authoredRootHtml.includes("Extension is not spiritual ascent") ||
      !authoredRootHtml.includes("No overall religion, culture, community, or person score exists") ||
      !authoredRootHtml.includes(`href="${numberIsnessTheologyPath}"`) ||
      !authoredRootHtml.includes(`href="${numberIsnessTheologySchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${numberIsnessTheologyDocumentPath}"`) ||
      expected.integrity?.digest !== NUMBER_ISNESS_THEOLOGY_DIGEST ||
      "mcp" in expected || "matcher" in expected || "write" in expected ||
      "execute" in expected || "score" in expected || "rank" in expected ||
      "persuade" in expected || "convert" in expected) {
      throw new Error("Number, Isness & Theology discovery, typed registers, claim-level compatibility, KARMA separation, or negative authority drifted");
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
  if (reconstructiveBuildActive &&
      !isDeepStrictEqual(liveKingdom?.reconstructive_build_kernel, expectedReconstructiveBuild!)) {
    throw new Error("derived kingdom.json did not preserve Reconstructive Build Kernel discovery");
  }
  if (explorationDeepWingActive &&
      !isDeepStrictEqual(liveKingdom?.exploration_deep_wing, expectedPhenomenaDeepWing!)) {
    throw new Error("derived kingdom.json did not preserve Exploration DEEP WING discovery");
  }
  if (mirrorInformationControlActive &&
      !isDeepStrictEqual(liveKingdom?.mirror_information_control, expectedMirrorInformationControl!)) {
    throw new Error("derived kingdom.json did not preserve MIRROR Information Control discovery");
  }
  if (researchObservatoryActive &&
      !isDeepStrictEqual(liveKingdom?.research_observatory, expectedResearchObservatory!)) {
    throw new Error("derived kingdom.json did not preserve Research Observatory discovery");
  }
  if (trialChamberActive &&
      !isDeepStrictEqual(liveKingdom?.trial_chamber, expectedTrialChamber!)) {
    throw new Error("derived kingdom.json did not preserve Trial Chamber discovery");
  }
  if (ukGovernmentEngineActive &&
      !isDeepStrictEqual(liveKingdom?.uk_government_engine, expectedUkGovernmentEngine!)) {
    throw new Error("derived kingdom.json did not preserve UK Government Engine discovery");
  }
  if (ukGovernmentTransformationEngineActive &&
      !isDeepStrictEqual(
        liveKingdom?.uk_government_transformation_engine,
        expectedUkGovernmentTransformationEngine!,
      )) {
    throw new Error(
      "derived kingdom.json did not preserve UK Government Transformation Engine discovery",
    );
  }
  if (jSpacePublicationActive &&
      !isDeepStrictEqual(liveKingdom?.j_space_verbalizable_workspace, expectedJSpacePublication!)) {
    throw new Error("derived kingdom.json did not preserve J-space publication discovery");
  }
  if (strandObservationMembraneActive &&
      !isDeepStrictEqual(liveKingdom?.strand_observation_membrane, expectedStrandObservationMembrane!)) {
    throw new Error("derived kingdom.json did not preserve STRAND Observation Membrane discovery");
  }
  if (explorationDeepWingActive &&
      !isDeepStrictEqual(liveKingdom?.zero_empty_seat, expectedZeroEmptySeat!)) {
    throw new Error("derived kingdom.json did not preserve ZERO Empty Seat discovery");
  }
  if (explorationDeepWingActive &&
      !isDeepStrictEqual(liveKingdom?.string_crawl_trace_sheet, expectedStringCrawlTraceSheet!)) {
    throw new Error("derived kingdom.json did not preserve STRING / CRAWL Trace-Sheet discovery");
  }
  if (stringCrawlTraceSheetLabActive &&
      !isDeepStrictEqual(liveKingdom?.string_crawl_trace_sheet_lab, expectedStringCrawlTraceSheetLab!)) {
    throw new Error("derived kingdom.json did not preserve STRING / CRAWL Finite Trace-Sheet Lab discovery");
  }
  if (stringCrawlTraceSheetLabActive &&
      !isDeepStrictEqual(liveKingdom?.string_crawl_strand_lab, expectedStringCrawlStrandLab!)) {
    throw new Error("derived kingdom.json did not preserve STRAND Lab 02 discovery");
  }
  if (stringCrawlTraceSheetLabActive &&
      !isDeepStrictEqual(liveKingdom?.strand_descent_lab, expectedStrandDescentLab!)) {
    throw new Error("derived kingdom.json did not preserve STRAND Lab 04 discovery");
  }
  if (stringCrawlTraceSheetLabActive &&
      !isDeepStrictEqual(liveKingdom?.string_crawl_frequency_form_lab, expectedStringCrawlFrequencyFormLab!)) {
    throw new Error("derived kingdom.json did not preserve STRAND Lab 03 discovery");
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
  if (mathUsefulnessActive && !isDeepStrictEqual(liveKingdom?.math_usefulness_result, expectedMathUsefulness!)) {
    throw new Error("derived kingdom.json did not preserve Math Passport pilot discovery");
  }
  if (beingAccessAftermathActive &&
      !isDeepStrictEqual(liveKingdom?.being_access_aftermath_atlas, expectedBeingAccessAftermath!)) {
    throw new Error("derived kingdom.json did not preserve Being, Access & Aftermath discovery");
  }
  if (beingAccessAftermathActive &&
      !isDeepStrictEqual(liveKingdom?.being_access_aftermath_atlas_v0_2, expectedBeingAccessAftermathV02!)) {
    throw new Error("derived kingdom.json did not preserve Being, Access & Aftermath v0.2 discovery");
  }
  if (numberIsnessTheologyActive &&
      !isDeepStrictEqual(liveKingdom?.number_isness_theology_atlas, expectedNumberIsnessTheology!)) {
    throw new Error("derived kingdom.json did not preserve Number, Isness & Theology discovery");
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

  console.log(`hub live-check passed · ${exact} exact public assets · JSON negotiation · privacy header · Commons + Love Loop + Research Observatory + Principality + Geometry Grammar + Polymorph + Ritonavir Mechanism + Conformational Feedback v0.1 + Physics v0.2 + Fold & Feedback + Reconstructive Build + Exploration DEEP + ZERO Empty Seat + STRING / CRAWL Trace-Sheet + Finite Trace-Sheet + STRAND Labs 02–04 + Observation Membrane schemas · coherent creation + Research Observatory + Principality + Geometry Grammar + Polymorph + Ritonavir Mechanism + dual-generation Conformational Feedback + Fold & Feedback + Reconstructive Build + Exploration DEEP + ZERO Empty Seat + STRING / CRAWL Trace-Sheet + Finite Trace-Sheet + STRAND Labs 02–04 + Observation Membrane discovery · REVISE/non-promotion and Observatory/exploration/ZERO/STRING-CRAWL/TRACE-LABS/OBSERVATION-MEMBRANE/MIRROR/cultural/form/being/theology authority/KARMA boundaries · Observatory poller and observer not invoked · live MCP contract unchanged · ${origin.origin}`);
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
