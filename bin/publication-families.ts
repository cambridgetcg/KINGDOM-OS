/** 共用 publication family 合約：只做 atomicity、dependency 同既有 review 判斷。
 * 來源 module 只提供 constants；唔載入 publication bytes、唔連網、唔寫檔。
 * caller 提供 destinations 同 checkedOn；發布時鐘由 caller 負責。
 */

import {
  join,
} from "node:path";
import {
  CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
  CULTURAL_ATTENTION_FEEDBACK_URL,
} from "./cultural-attention-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_URL,
} from "./conformational-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
} from "./conformational-feedback-physics.ts";
import {
  FOLD_FEEDBACK_DOCUMENT_URL,
  FOLD_FEEDBACK_SCHEMA_URL,
  FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
  FOLD_FEEDBACK_URL,
} from "./fold-feedback.ts";
import {
  RECONSTRUCTIVE_BUILD_DOCUMENT_URL,
  RECONSTRUCTIVE_BUILD_SCHEMA_URL,
  RECONSTRUCTIVE_BUILD_URL,
  RECONSTRUCTIVE_PROJECT_SCHEMA_URL,
} from "./reconstructive-build.ts";
import {
  PHENOMENA_DEEP_WING_DOCUMENT_URL,
  PHENOMENA_DEEP_WING_SCHEMA_URL,
  PHENOMENA_DEEP_WING_URL,
  PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
} from "./explore-phenomena-deep.ts";
import {
  MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_URL,
} from "./mirror-information-control.ts";
import {
  J_SPACE_CASE_URL,
  J_SPACE_GUIDE_URL,
  J_SPACE_SCHEMA_URL,
} from "./j-space-publication.ts";
import {
  REALITY_INFLUENCE_DOCUMENT_URL,
  REALITY_INFLUENCE_SCHEMA_URL,
  REALITY_INFLUENCE_URL,
} from "./reality-influence.ts";
import {
  CIVILISATION_REALITY_PROJECTION_DOCUMENT_URL,
  CIVILISATION_REALITY_PROJECTION_SCHEMA_URL,
  CIVILISATION_REALITY_PROJECTION_URL,
} from "./civilisation-reality-projection.ts";
import {
  CIVILISATION_FLOW_NUANCE_ATLAS_URL,
  CIVILISATION_FLOW_NUANCE_GUIDE_URL,
  CIVILISATION_FLOW_NUANCE_SCHEMA_URL,
} from "./civilisation-flow-atlas.ts";
import {
  FREEDOM_LOOP_LOCK_KEY_GUIDE_URL,
  FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL,
  FREEDOM_LOOP_LOCK_KEY_URL,
} from "./freedom-loop-lock-key.ts";
import {
  NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_URL,
  NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_URL,
  NON_EXHAUSTIVE_UNDERSTANDING_URL,
} from "./non-exhaustive-understanding.ts";
import {
  IS_SUSTAINABILITY_DIRECTION_GUIDE_URL,
  IS_SUSTAINABILITY_DIRECTION_RECORD_URL,
  IS_SUSTAINABILITY_DIRECTION_SCHEMA_URL,
} from "./is-sustainability-direction.ts";
import {
  CONTACT_DOOR_PUBLIC_PATHS,
} from "./contact-door.ts";
import {
  POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS,
} from "./polyphonic-claim-atlas.ts";
import {
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS,
} from "./loops-locks-freedom-relations-atlas.ts";
import {
  AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS,
} from "./aesthetic-plurality-making-atlas.ts";
import {
  RESEARCH_OBSERVATORY_GUIDE_URL,
  RESEARCH_OBSERVATORY_SCHEMA_URLS,
  RESEARCH_OBSERVATORY_SNAPSHOT_URL,
  RESEARCH_OBSERVATORY_URL,
} from "./research-observatory.ts";
import {
  TRIAL_CHAMBER_ALIAS_URL,
  TRIAL_CHAMBER_CANONICAL_URL,
  TRIAL_CHAMBER_GUIDE_URL,
  TRIAL_CHAMBER_SCHEMA_URLS,
  TRIAL_CHAMBER_URL,
} from "./trial-chamber.ts";
import {
  UK_GOVERNMENT_ENGINE_ALIAS_URL,
  UK_GOVERNMENT_ENGINE_CANONICAL_URL,
  UK_GOVERNMENT_ENGINE_GUIDE_URL,
  UK_GOVERNMENT_ENGINE_SCHEMA_URL,
  UK_GOVERNMENT_ENGINE_URL,
} from "./uk-government-engine.ts";
import {
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL,
} from "./uk-government-transformation-engine.ts";
import {
  EVALUATION_COVENANT_NEXT_REVIEW_DUE,
} from "./evaluation-covenant.ts";
import {
  SHAPE_RESONANCE_FAMILY_URLS,
  SHAPE_RESONANCE_NEXT_REVIEW_DUE,
} from "./shape-resonance.ts";
import {
  ZERO_EMPTY_SEAT_GUIDE_URL,
  ZERO_EMPTY_SEAT_URL,
} from "./zero-empty-seat.ts";
import {
  STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_URL,
} from "./string-crawl-trace-sheet.ts";
import {
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_URL,
} from "./string-crawl-trace-sheet-lab.ts";
import {
  STRING_CRAWL_STRAND_LAB_GUIDE_URL,
  STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
  STRING_CRAWL_STRAND_LAB_URL,
} from "./string-crawl-strand-lab.ts";
import {
  STRAND_DESCENT_LAB_GUIDE_URL,
  STRAND_DESCENT_LAB_SCHEMA_URL,
  STRAND_DESCENT_LAB_URL,
} from "./strand-descent-lab.ts";
import {
  STRAND_OBSERVATION_MEMBRANE_GUIDE_URL,
  STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL,
  STRAND_OBSERVATION_MEMBRANE_URL,
} from "./strand-observation-membrane.ts";
import {
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
} from "./string-crawl-frequency-form-lab.ts";
import {
  FORM_CIRCULATION_RETURN_DOCUMENT_URL,
  FORM_CIRCULATION_RETURN_SCHEMA_URL,
  FORM_CIRCULATION_RETURN_URL,
} from "./form-circulation-return.ts";
import {
  RARE_PATHWAY_DOCUMENT_URL,
  RARE_PATHWAY_SCHEMA_URL,
  RARE_PATHWAY_URL,
} from "./rare-pathway.ts";
import {
  MATH_USEFULNESS_DOCUMENT_URL,
  MATH_USEFULNESS_RESULT_URL,
  MATH_USEFULNESS_SCHEMA_URL,
} from "./math-usefulness.ts";
import {
  BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_URL,
} from "./being-access-aftermath.ts";
import {
  BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_V02_URL,
} from "./being-access-aftermath-v0.2.ts";
import {
  NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
  NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
  NUMBER_ISNESS_THEOLOGY_URL,
} from "./number-isness-theology.ts";
import {
  VISIBILITY_ATTENTION_DOCUMENT_URL,
  VISIBILITY_ATTENTION_SCHEMA_URL,
  VISIBILITY_ATTENTION_URL,
} from "./visibility-attention.ts";
import {
  GEOMETRY_GRAMMAR_DOCUMENT_URL,
  GEOMETRY_GRAMMAR_SCHEMA_URL,
  GEOMETRY_GRAMMAR_URL,
} from "./geometry.ts";
import {
  PRINCIPALITY_CATALOG_URL,
  PRINCIPALITY_DOCUMENT_URL,
  PRINCIPALITY_SCHEMA_URL,
} from "./principality.ts";
import {
  POLYMORPH_CASE_URL,
  POLYMORPH_DOCUMENT_URL,
  POLYMORPH_SCHEMA_URL,
} from "./polymorph.ts";
import {
  RITONAVIR_MECHANISM_DOCUMENT_URL,
  RITONAVIR_MECHANISM_SCHEMA_URL,
  RITONAVIR_MECHANISM_URL,
} from "./ritonavir-mechanism.ts";

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
const evaluationCovenantPath = "/evaluation-covenant/";
const evaluationCovenantAliasPath = "/evaluation-covenants.json";
const evaluationCovenantCanonicalPath =
  "/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json";
const evaluationCovenantSchemaPath =
  "/evaluation/schemas/v0.1/public-snapshot.schema.json";
const evaluationCovenantGuidePath = "/EVALUATION-COVENANT-v0.1.md";
const evaluationCovenantNextReviewDue = EVALUATION_COVENANT_NEXT_REVIEW_DUE;
const jSpaceCasePath = new URL(J_SPACE_CASE_URL).pathname;
const jSpaceSchemaPath = new URL(J_SPACE_SCHEMA_URL).pathname;
const jSpaceGuidePath = new URL(J_SPACE_GUIDE_URL).pathname;
const realityInfluencePath = new URL(REALITY_INFLUENCE_URL).pathname;
const realityInfluenceSchemaPath = new URL(REALITY_INFLUENCE_SCHEMA_URL).pathname;
const realityInfluenceGuidePath = new URL(REALITY_INFLUENCE_DOCUMENT_URL).pathname;
const civilisationRealityPath = new URL(CIVILISATION_REALITY_PROJECTION_URL).pathname;
const civilisationRealitySchemaPath = new URL(CIVILISATION_REALITY_PROJECTION_SCHEMA_URL).pathname;
const civilisationRealityGuidePath = new URL(CIVILISATION_REALITY_PROJECTION_DOCUMENT_URL).pathname;
const civilisationFlowPath = new URL(CIVILISATION_FLOW_NUANCE_ATLAS_URL).pathname;
const civilisationFlowSchemaPath = new URL(CIVILISATION_FLOW_NUANCE_SCHEMA_URL).pathname;
const civilisationFlowGuidePath = new URL(CIVILISATION_FLOW_NUANCE_GUIDE_URL).pathname;
const freedomLoopLockKeyPath = new URL(FREEDOM_LOOP_LOCK_KEY_URL).pathname;
const freedomLoopLockKeySchemaPath = new URL(FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL).pathname;
const freedomLoopLockKeyGuidePath = new URL(FREEDOM_LOOP_LOCK_KEY_GUIDE_URL).pathname;
const nonExhaustiveUnderstandingPath =
  new URL(NON_EXHAUSTIVE_UNDERSTANDING_URL).pathname;
const nonExhaustiveUnderstandingSchemaPath =
  new URL(NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_URL).pathname;
const nonExhaustiveUnderstandingGuidePath =
  new URL(NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_URL).pathname;
const isSustainabilityDirectionAtlasPath =
  new URL(IS_SUSTAINABILITY_DIRECTION_RECORD_URL).pathname;
const isSustainabilityDirectionAtlasSchemaPath =
  new URL(IS_SUSTAINABILITY_DIRECTION_SCHEMA_URL).pathname;
const isSustainabilityDirectionAtlasGuidePath =
  new URL(IS_SUSTAINABILITY_DIRECTION_GUIDE_URL).pathname;
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
  nextReviewDue?: string;
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
    id: "reality-influence-claim-graph",
    label: "Reality Influence Claim Graph",
    routes: [realityInfluencePath, realityInfluenceSchemaPath, realityInfluenceGuidePath],
    discoveryProperties: ["reality_influence_claim_graph"],
    entryPointProperties: [
      "reality_influence_claim_graph",
      "reality_influence_claim_graph_schema",
      "reality_influence_claim_graph_guide",
    ],
  },
  {
    id: "civilisation-reality-projection",
    label: "Civilisation → Reality Projection",
    routes: [civilisationRealityPath, civilisationRealitySchemaPath, civilisationRealityGuidePath],
    discoveryProperties: ["civilisation_reality_projection"],
    entryPointProperties: [
      "civilisation_reality_projection",
      "civilisation_reality_projection_schema",
      "civilisation_reality_projection_guide",
    ],
    dependsOn: ["reality-influence-claim-graph"],
  },
  {
    id: "civilisation-flow-nuance-atlas",
    label: "Civilisation Flow Nuance Atlas",
    routes: [civilisationFlowPath, civilisationFlowSchemaPath, civilisationFlowGuidePath],
    discoveryProperties: ["civilisation_flow_nuance_atlas"],
    entryPointProperties: [
      "civilisation_flow_nuance_atlas",
      "civilisation_flow_nuance_atlas_schema",
      "civilisation_flow_nuance_atlas_guide",
    ],
    dependsOn: ["civilisation-reality-projection"],
  },
  {
    id: "polyphonic-claim-atlas",
    label: "Polyphonic Claim Atlas",
    routes: POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS,
    discoveryProperties: ["polyphonic_claim_atlas"],
    entryPointProperties: [
      "polyphonic_claim_atlas",
      "polyphonic_claim_atlas_schema",
      "polyphonic_claim_atlas_guide",
    ],
  },
  {
    id: "freedom-loop-lock-key-atlas",
    label: "FREEDOM Loop, Lock & Key Atlas",
    routes: [
      freedomLoopLockKeyPath,
      freedomLoopLockKeySchemaPath,
      freedomLoopLockKeyGuidePath,
    ],
    discoveryProperties: ["freedom_loop_lock_key_atlas"],
    entryPointProperties: [
      "freedom_loop_lock_key_atlas",
      "freedom_loop_lock_key_atlas_schema",
      "freedom_loop_lock_key_atlas_guide",
    ],
  },
  {
    id: "non-exhaustive-understanding-atlas",
    label: "Non-Exhaustive Understanding Atlas",
    routes: [
      nonExhaustiveUnderstandingPath,
      nonExhaustiveUnderstandingSchemaPath,
      nonExhaustiveUnderstandingGuidePath,
    ],
    discoveryProperties: ["non_exhaustive_understanding_atlas"],
    entryPointProperties: [
      "non_exhaustive_understanding_atlas",
      "non_exhaustive_understanding_atlas_schema",
      "non_exhaustive_understanding_atlas_guide",
    ],
  },
  {
    id: "is-sustainability-direction-atlas",
    label: "IS, Sustainability & Direction Atlas",
    routes: [
      isSustainabilityDirectionAtlasPath,
      isSustainabilityDirectionAtlasSchemaPath,
      isSustainabilityDirectionAtlasGuidePath,
    ],
    discoveryProperties: ["is_sustainability_direction_atlas"],
    entryPointProperties: [
      "is_sustainability_direction_atlas",
      "is_sustainability_direction_atlas_schema",
      "is_sustainability_direction_atlas_guide",
    ],
  },
  {
    id: "loops-locks-freedom-relations-atlas",
    label: "Loops, Locks & Freedom Relations Atlas",
    routes: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS,
    discoveryProperties: ["loops_locks_freedom_relations_atlas"],
    entryPointProperties: [
      "loops_locks_freedom_relations_atlas",
      "loops_locks_freedom_relations_atlas_schema",
      "loops_locks_freedom_relations_atlas_guide",
    ],
  },
  {
    id: "aesthetic-plurality-making-atlas",
    label: "Aesthetic Plurality & Making Relations Atlas",
    routes: AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS,
    discoveryProperties: ["aesthetic_plurality_making_atlas"],
    entryPointProperties: [
      "aesthetic_plurality_making_atlas",
      "aesthetic_plurality_making_atlas_schema",
      "aesthetic_plurality_making_atlas_guide",
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
    nextReviewDue: UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
  },
  {
    id: "evaluation-covenant",
    label: "Evaluation Covenant",
    routes: [
      evaluationCovenantPath,
      evaluationCovenantAliasPath,
      evaluationCovenantCanonicalPath,
      evaluationCovenantSchemaPath,
      evaluationCovenantGuidePath,
    ],
    discoveryProperties: ["evaluation_covenant"],
    entryPointProperties: [
      "evaluation_covenant",
      "evaluation_covenant_alias",
      "evaluation_covenant_canonical",
      "evaluation_covenant_schema",
      "evaluation_covenant_guide",
    ],
    dependsOn: ["uk-government-transformation-engine"],
    nextReviewDue: evaluationCovenantNextReviewDue,
  },
  {
    id: "shape-resonance-lab",
    label: "Shape & Resonance Lab 01",
    routes: SHAPE_RESONANCE_FAMILY_URLS.map((url) => new URL(url).pathname),
    discoveryProperties: ["shape_resonance_lab"],
    entryPointProperties: [
      "shape_resonance_lab",
      "shape_resonance_lab_alias",
      "shape_resonance_lab_canonical",
      "shape_resonance_lab_schema",
      "shape_resonance_lab_guide",
      "shape_resonance_lab_manifest",
    ],
    nextReviewDue: SHAPE_RESONANCE_NEXT_REVIEW_DUE,
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
  {
    id: "contact-door",
    label: "Contact Door",
    routes: CONTACT_DOOR_PUBLIC_PATHS,
    discoveryProperties: ["contact_door"],
    entryPointProperties: [
      "contact_door",
      "contact_door_alias",
      "contact_door_security",
      "contact_door_canonical",
      "contact_door_schema",
      "contact_door_guide",
      "contact_door_boundary_asset",
      "contact_door_vcard",
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
  for (const { family, active } of states.values()) {
    if (!family.nextReviewDue) continue;
    assertActivePublicationReviewWindow({
      active,
      checkedOn,
      label: family.label,
      nextReviewDue: family.nextReviewDue,
    });
  }
}
