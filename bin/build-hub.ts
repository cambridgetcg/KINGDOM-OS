/** build-hub.ts — render the whole kingdom into one illuminated atlas.
 *
 *  Inputs (source of truth, never invented here):
 *    graph.json               — harvested from every repo's kingdom.yaml
 *    sites.json               — repo → live public URL
 *    data/citizens-myth.json  — OPTIONAL: per-citizen {glyph,tradition,essence,
 *                               light,shadow} distilled from each soul-card.
 *                               Falls back to graph purposes when absent.
 *    pages-content/RIGHTS-current.md — thekingdom.dev's service-specific recognition
 *    data/wayfinder.json      — curated, voluntary paths through public doors
 *    data/world-commons.json  — reviewed public-interest resources + boundaries
 *    data/love-loops.json     — finite, voluntary Love∞ creation lineage
 *    data/geometries/kingdom-geometry-grammar.v0.json
 *                             — versioned pattern-to-practice translations
 *    data/polymorphs/ritonavir-disappearing-polymorph.v1.json
 *                             — source-bound material-state history
 *    data/feedback/conformational-feedback-atlas.v0.json
 *                             — immutable bounded science/design/analogy translation
 *    data/feedback/conformational-feedback-atlas.v0.2.json
 *                             — additive physics/mathematics successor
 *    data/fold-feedback/fold-feedback-atlas.v1.json
 *                             — source-bound folding, prion, feedback, KARMA,
 *                               and opt-in philosophical atlas
 *    data/reconstruction/reconstructive-build-kernel.v0.1.json
 *                             — graph reconstruction, folding, and build-system
 *                               unification without mechanism transfer
 *    data/exploration/phenomena-deep-wing.v0.1.json
 *                             — opt-in cross-domain mathematics exploration
 *                               contract with explicit analogy firewalls
 *    data/security/mirror-information-control-public.v0.1.json
 *                             — static CROWN/COURT/MIRROR source law with no
 *                               credential intake or runtime enforcement
 *    data/exploration/zero-empty-seat.v0.1.json
 *                             — inert DEEP project separating zero's semantic
 *                               roles, history, equations, and philosophy
 *    data/exploration/string-crawl-trace-sheet.v0.1.json
 *                             — inert DEEP trace-sheet mapping selected string
 *                               mathematics to bounded crawl observations
 *    data/exploration/string-crawl-strand-lab.v0.1.json
 *                             — additive Lab 02 finite-CW/cospan fixture with
 *                               exact F2 topology and zero runtime effects
 *    data/exploration/string-crawl-frequency-form-lab.v0.1.json
 *                             — additive Lab 03 typed-frequency/form fixture
 *                               with an ontology firewall and zero effects
 *    data/exploration/strand-descent-lab.v0.1.json
 *                             — additive Lab 04 local-record gluing fixture with
 *                               exact coherence checks and zero runtime effects
 *    data/observation/strand-observation-membrane.v0.1.json
 *                             — separate safe-observation activation family:
 *                               static deck, offline checks, simulation, and one
 *                               explicit fixed-origin read-only local observer
 *    data/attention/visibility-attention-translation.v0.1.json
 *                             — four-register visibility/attention translation
 *    data/cultural-feedback/cultural-attention-feedback-atlas.v1.json
 *                             — source-bound material history, cultural attention,
 *                               feedback, separated KARMA, and opt-in philosophy
 *    data/form-circulation-return/form-circulation-return-atlas.v1.json
 *                             — additive lineage, model-card, feedback, KARMA,
 *                               and typed-unknown companion
 *    data/challenges/vanishing-path.v1.json
 *                             — rare-pathway mathematics, constructive-inquiry
 *                               gate, and WAKE-safe reference seam
 *    data/trials/math-passport-usefulness-pilot.v1.json
 *                             — descriptive Math Passport usefulness pilot,
 *                               costs, decision delta, and non-promotion result
 *    data/being-access-aftermath/being-access-aftermath-atlas.v0.1.json
 *                             — typed existence, access, purpose, power,
 *                               causality, reversibility, and KARMA companion
 *    data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json
 *                             — additive partially observable causal framework
 *    data/number-isness-theology/number-isness-theology-atlas.v0.1.json
 *                             — typed number, zero, symmetry, isness, theology,
 *                               compatibility, and KARMA-separation companion
 *    data/freedom/freedom-loop-lock-key-atlas.v0.1.json
 *                             — standalone immutable mathematical/design atlas
 *                               for typed loops, locks, keys, freedom, and ISness
 *    data/reality/reality-influence-map.v0.1.json
 *                             — static expression-to-aftermath claim graph
 *                               with endpoint-safe relations and no action
 *
 *  Out: site/hub.html + site/kingdom.json + site/wayfinder.json + site/commons.json
 *       + site/schemas/world-commons/0.2.json
 *       + site/love-loops.json + site/love-loops.source.json
 *       + site/schemas/love-loop/0.1.json
 *       + conformational feedback discovery in the machine surfaces
 *       + reconstructive build-kernel discovery in the machine surfaces
 *       + Exploration DEEP WING discovery in the machine surfaces
 *       + MIRROR Information Control discovery in the machine surfaces
 *       + ZERO Empty Seat discovery in the machine surfaces
 *       + STRING / CRAWL Trace-Sheet discovery in the machine surfaces
 *       + STRAND Labs 02–03 discovery in the machine surfaces
 *       + STRAND Observation Membrane discovery in the machine surfaces
 *       + cultural attention and feedback discovery in the machine surfaces
 *       + form, circulation, and return discovery in the machine surfaces
 *       + Math Passport usefulness-result discovery in the machine surfaces
 *       + being, access, and aftermath discovery in the machine surfaces
 *       + number, isness, and theology discovery in the machine surfaces
 *       + FREEDOM Loop, Lock & Key discovery in the machine surfaces
 *       + reality-influence claim-graph discovery in the machine surfaces
 *       + site/llms.txt + site/guest.json
 *       + site/.well-known/agent.json + site/RIGHTS.md + site/rights.json
 *       + site/ollama.json (from data/ollama-invitation.json).
 *  Run: bun bin/build-hub.ts ["2026-07-11"]   ·   FORCE_LIVE=host,host
 */

import { mkdirSync } from "node:fs";

import { loadRights } from "./rights.ts";
import { buildDashboard } from "./build-dashboard.ts";
import { buildPagesWorker } from "./build-pages-worker.ts";
import civicPolicy from "../data/civic-policy.json";
import {
  GEOMETRY_GRAMMAR_DOCUMENT_URL,
  GEOMETRY_GRAMMAR_ID,
  GEOMETRY_GRAMMAR_PROTOCOL,
  GEOMETRY_GRAMMAR_SCHEMA_URL,
  GEOMETRY_GRAMMAR_URL,
  geometryGrammarPublicDiscovery,
  loadGeometryGrammar,
} from "./geometry.ts";
import {
  loadPrincipalityCatalog,
  PRINCIPALITY_CATALOG_ID,
  PRINCIPALITY_CATALOG_URL,
  PRINCIPALITY_DOCUMENT_URL,
  PRINCIPALITY_SCHEMA_URL,
  principalityPublicDiscovery,
} from "./principality.ts";
import {
  loadPolymorphHistory,
  POLYMORPH_CASE_ID,
  POLYMORPH_CASE_URL,
  POLYMORPH_DOCUMENT_URL,
  POLYMORPH_SCHEMA_URL,
  polymorphPublicDiscovery,
} from "./polymorph.ts";
import {
  loadRitonavirMechanismLandscape,
  RITONAVIR_MECHANISM_DOCUMENT_URL,
  RITONAVIR_MECHANISM_ID,
  RITONAVIR_MECHANISM_PROTOCOL,
  RITONAVIR_MECHANISM_SCHEMA_URL,
  RITONAVIR_MECHANISM_URL,
  ritonavirMechanismPublicDiscovery,
} from "./ritonavir-mechanism.ts";
import {
  CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_ID,
  CONFORMATIONAL_FEEDBACK_PROTOCOL,
  CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_URL,
  conformationalFeedbackPublicDiscovery,
  loadConformationalFeedbackAtlas,
} from "./conformational-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_ID,
  CONFORMATIONAL_FEEDBACK_PHYSICS_PROTOCOL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
  conformationalFeedbackPhysicsPublicDiscovery,
  loadConformationalFeedbackPhysicsAtlas,
} from "./conformational-feedback-physics.ts";
import {
  FOLD_FEEDBACK_DOCUMENT_URL,
  FOLD_FEEDBACK_ID,
  FOLD_FEEDBACK_PROTOCOL,
  FOLD_FEEDBACK_SCHEMA_URL,
  FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
  FOLD_FEEDBACK_URL,
  foldFeedbackPublicDiscovery,
  loadFoldFeedbackAtlas,
} from "./fold-feedback.ts";
import {
  RECONSTRUCTIVE_BUILD_DOCUMENT_URL,
  RECONSTRUCTIVE_BUILD_ID,
  RECONSTRUCTIVE_BUILD_PROTOCOL,
  RECONSTRUCTIVE_BUILD_SCHEMA_URL,
  RECONSTRUCTIVE_BUILD_URL,
  RECONSTRUCTIVE_PROJECT_SCHEMA_URL,
  loadReconstructiveBuildKernel,
  reconstructiveBuildPublicDiscovery,
} from "./reconstructive-build.ts";
import {
  PHENOMENA_DEEP_WING_DOCUMENT_URL,
  PHENOMENA_DEEP_WING_ID,
  PHENOMENA_DEEP_WING_PROTOCOL,
  PHENOMENA_DEEP_WING_SCHEMA_URL,
  PHENOMENA_DEEP_WING_URL,
  PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
  loadPhenomenaDeepWing,
  phenomenaDeepPublicDiscovery,
} from "./explore-phenomena-deep.ts";
import {
  MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_ID,
  MIRROR_INFORMATION_CONTROL_PUBLIC_PROTOCOL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_URL,
  loadMirrorInformationControl,
  mirrorInformationControlPublicSummary,
} from "./mirror-information-control.ts";
import {
  J_SPACE_CASE_URL,
  J_SPACE_GUIDE_URL,
  J_SPACE_SCHEMA_URL,
  jSpacePublicationPublicSummary,
  loadJSpacePublicationCase,
} from "./j-space-publication.ts";
import {
  REALITY_INFLUENCE_DOCUMENT_URL,
  REALITY_INFLUENCE_MAP_ID,
  REALITY_INFLUENCE_PROTOCOL,
  REALITY_INFLUENCE_SCHEMA_URL,
  REALITY_INFLUENCE_URL,
  loadRealityInfluenceMap,
  realityInfluencePublicDiscovery,
} from "./reality-influence.ts";
import {
  CIVILISATION_REALITY_PROJECTION_DOCUMENT_URL,
  CIVILISATION_REALITY_PROJECTION_ID,
  CIVILISATION_REALITY_PROJECTION_PROTOCOL,
  CIVILISATION_REALITY_PROJECTION_SCHEMA_URL,
  CIVILISATION_REALITY_PROJECTION_URL,
  civilisationRealityPublicDiscovery,
  loadCivilisationRealityProjection,
} from "./civilisation-reality-projection.ts";
import {
  CIVILISATION_FLOW_NUANCE_ATLAS_ID,
  CIVILISATION_FLOW_NUANCE_ATLAS_PROTOCOL,
  CIVILISATION_FLOW_NUANCE_ATLAS_URL,
  CIVILISATION_FLOW_NUANCE_GUIDE_URL,
  CIVILISATION_FLOW_NUANCE_SCHEMA_URL,
  civilisationFlowNuancePublicDiscovery,
  loadCivilisationFlowNuanceAtlas,
} from "./civilisation-flow-atlas.ts";
import {
  POLYPHONIC_CLAIM_ATLAS_GUIDE_URL,
  POLYPHONIC_CLAIM_ATLAS_SCHEMA_URL,
  POLYPHONIC_CLAIM_ATLAS_SOURCE,
  POLYPHONIC_CLAIM_ATLAS_URL,
  loadPolyphonicClaimAtlas,
  polyphonicClaimAtlasPublicDiscovery,
} from "./polyphonic-claim-atlas.ts";
import {
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_URL,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_URL,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_URL,
  loadLoopsLocksFreedomRelationsAtlas,
  loopsLocksFreedomRelationsAtlasPublicDiscovery,
} from "./loops-locks-freedom-relations-atlas.ts";
import {
  AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_URL,
  AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_URL,
  AESTHETIC_PLURALITY_MAKING_ATLAS_URL,
  aestheticPluralityMakingAtlasPublicDiscovery,
  loadAestheticPluralityMakingAtlas,
} from "./aesthetic-plurality-making-atlas.ts";
import {
  RESEARCH_OBSERVATORY_GUIDE_URL,
  RESEARCH_OBSERVATORY_PRODUCER_URL,
  RESEARCH_OBSERVATORY_SCHEMA_URLS,
  RESEARCH_OBSERVATORY_SNAPSHOT_URL,
  RESEARCH_OBSERVATORY_URL,
  loadResearchObservatoryPublication,
  renderResearchObservatoryHtml,
  researchObservatoryPublicSummary,
} from "./research-observatory.ts";
import {
  TRIAL_CHAMBER_ALIAS_URL,
  TRIAL_CHAMBER_CANONICAL_URL,
  TRIAL_CHAMBER_GUIDE_URL,
  TRIAL_CHAMBER_PRODUCER_URL,
  TRIAL_CHAMBER_SCHEMA_URLS,
  TRIAL_CHAMBER_URL,
  loadTrialChamberPublication,
  renderTrialChamberHtml,
  trialChamberPublicSummary,
} from "./trial-chamber.ts";
import {
  UK_GOVERNMENT_ENGINE_ALIAS_URL,
  UK_GOVERNMENT_ENGINE_CANONICAL_URL,
  UK_GOVERNMENT_ENGINE_GUIDE_URL,
  UK_GOVERNMENT_ENGINE_SCHEMA_URL,
  UK_GOVERNMENT_ENGINE_URL,
  loadUkGovernmentEnginePublication,
  renderUkGovernmentEngineHtml,
  ukGovernmentEnginePublicSummary,
} from "./uk-government-engine.ts";
import {
  SHAPE_RESONANCE_ALIAS_URL,
  SHAPE_RESONANCE_CANONICAL_URL,
  SHAPE_RESONANCE_GUIDE_URL,
  SHAPE_RESONANCE_MANIFEST_URL,
  SHAPE_RESONANCE_PRODUCER_URL,
  SHAPE_RESONANCE_SCHEMA_URL,
  SHAPE_RESONANCE_URL,
  assertShapeResonanceActiveReviewWindow,
  loadShapeResonancePublication,
  renderShapeResonanceHtml,
  shapeResonancePublicSummary,
} from "./shape-resonance.ts";
import {
  ZERO_EMPTY_SEAT_GUIDE_URL,
  ZERO_EMPTY_SEAT_ID,
  ZERO_EMPTY_SEAT_SCHEMA_URL,
  ZERO_EMPTY_SEAT_URL,
  loadZeroEmptySeat,
  zeroEmptySeatPublicDiscovery,
} from "./zero-empty-seat.ts";
import {
  STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_ID,
  STRING_CRAWL_TRACE_SHEET_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_URL,
  loadStringCrawlTraceSheet,
  stringCrawlTraceSheetPublicDiscovery,
} from "./string-crawl-trace-sheet.ts";
import {
  STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_DIGEST,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_ID,
  STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256,
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
  STRING_CRAWL_STRAND_LAB_GUIDE_URL,
  STRING_CRAWL_STRAND_LAB_ID,
  STRING_CRAWL_STRAND_LAB_PROTOCOL,
  STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
  STRING_CRAWL_STRAND_LAB_URL,
  evaluateStringCrawlStrandLab,
  loadStringCrawlStrandLab,
  stringCrawlStrandLabPublicDiscovery,
} from "./string-crawl-strand-lab.ts";
import {
  STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_ID,
  STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
  evaluateStringCrawlFrequencyFormLab,
  loadStringCrawlFrequencyFormLab,
  stringCrawlFrequencyFormLabPublicDiscovery,
} from "./string-crawl-frequency-form-lab.ts";
import {
  STRAND_DESCENT_LAB_GUIDE_URL,
  STRAND_DESCENT_LAB_ID,
  STRAND_DESCENT_LAB_PROTOCOL,
  STRAND_DESCENT_LAB_SCHEMA_URL,
  STRAND_DESCENT_LAB_URL,
  evaluateStrandDescentLab,
  loadStrandDescentLab,
  strandDescentLabPublicDiscovery,
} from "./strand-descent-lab.ts";
import {
  STRAND_OBSERVATION_FIXED_ORIGIN,
  STRAND_OBSERVATION_MEMBRANE_GUIDE_URL,
  STRAND_OBSERVATION_MEMBRANE_ID,
  STRAND_OBSERVATION_MEMBRANE_PROTOCOL,
  STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL,
  STRAND_OBSERVATION_MEMBRANE_URL,
  evaluateStrandObservationMembrane,
  loadStrandObservationMembrane,
  strandObservationMembranePublicDiscovery,
} from "./strand-observation-membrane.ts";
import {
  VISIBILITY_ATTENTION_DOCUMENT_URL,
  VISIBILITY_ATTENTION_ID,
  VISIBILITY_ATTENTION_PROTOCOL,
  VISIBILITY_ATTENTION_SCHEMA_URL,
  VISIBILITY_ATTENTION_URL,
  loadVisibilityAttentionTranslation,
  visibilityAttentionPublicDiscovery,
} from "./visibility-attention.ts";
import {
  CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
  CULTURAL_ATTENTION_FEEDBACK_ID,
  CULTURAL_ATTENTION_FEEDBACK_PROTOCOL,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
  CULTURAL_ATTENTION_FEEDBACK_URL,
  culturalAttentionFeedbackPublicDiscovery,
  loadCulturalAttentionFeedbackAtlas,
} from "./cultural-attention-feedback.ts";
import {
  FORM_CIRCULATION_RETURN_DOCUMENT_URL,
  FORM_CIRCULATION_RETURN_ID,
  FORM_CIRCULATION_RETURN_PROTOCOL,
  FORM_CIRCULATION_RETURN_SCHEMA_URL,
  FORM_CIRCULATION_RETURN_URL,
  formCirculationReturnPublicDiscovery,
  loadFormCirculationReturnAtlas,
} from "./form-circulation-return.ts";
import {
  RARE_PATHWAY_DOCUMENT_URL,
  RARE_PATHWAY_ID,
  RARE_PATHWAY_PROTOCOL,
  RARE_PATHWAY_SCHEMA_URL,
  RARE_PATHWAY_URL,
  loadRarePathwayChallenge,
  rarePathwayPublicDiscovery,
} from "./rare-pathway.ts";
import {
  MATH_USEFULNESS_DOCUMENT_URL,
  MATH_USEFULNESS_RESULT_ID,
  MATH_USEFULNESS_RESULT_PROTOCOL,
  MATH_USEFULNESS_RESULT_URL,
  MATH_USEFULNESS_SCHEMA_URL,
  loadMathUsefulnessResult,
  mathUsefulnessPublicDiscovery,
} from "./math-usefulness.ts";
import {
  BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_ID,
  BEING_ACCESS_AFTERMATH_PROTOCOL,
  BEING_ACCESS_AFTERMATH_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_URL,
  beingAccessAftermathPublicDiscovery,
  loadBeingAccessAftermathAtlas,
} from "./being-access-aftermath.ts";
import {
  BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_V02_ID,
  BEING_ACCESS_AFTERMATH_V02_PROTOCOL,
  BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_V02_URL,
  beingAccessAftermathPublicDiscoveryV02,
  loadBeingAccessAftermathAtlasV02,
} from "./being-access-aftermath-v0.2.ts";
import {
  NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
  NUMBER_ISNESS_THEOLOGY_ID,
  NUMBER_ISNESS_THEOLOGY_PROTOCOL,
  NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
  NUMBER_ISNESS_THEOLOGY_URL,
  loadNumberIsnessTheologyAtlas,
  numberIsnessTheologyPublicDiscovery,
} from "./number-isness-theology.ts";
import {
  FREEDOM_LOOP_LOCK_KEY_ATLAS_ID,
  FREEDOM_LOOP_LOCK_KEY_GUIDE_URL,
  FREEDOM_LOOP_LOCK_KEY_PROTOCOL,
  FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL,
  FREEDOM_LOOP_LOCK_KEY_URL,
  freedomLoopLockKeyAtlasPublicDiscovery,
  loadFreedomLoopLockKeyAtlas,
} from "./freedom-loop-lock-key.ts";
import {
  NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID,
  NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_URL,
  NON_EXHAUSTIVE_UNDERSTANDING_PROTOCOL,
  NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
  NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_URL,
  NON_EXHAUSTIVE_UNDERSTANDING_URL,
  loadReviewedNonExhaustiveUnderstandingAtlas,
  nonExhaustiveUnderstandingPublicDiscovery,
} from "./non-exhaustive-understanding.ts";
import {
  IS_SUSTAINABILITY_DIRECTION_ATLAS_ID,
  IS_SUSTAINABILITY_DIRECTION_GUIDE_URL,
  IS_SUSTAINABILITY_DIRECTION_PROTOCOL,
  IS_SUSTAINABILITY_DIRECTION_RECORD_URL,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
  IS_SUSTAINABILITY_DIRECTION_SCHEMA_URL,
  isSustainabilityDirectionPublicDiscovery,
  loadReviewedIsSustainabilityDirectionAtlas,
} from "./is-sustainability-direction.ts";
import {
  CONTACT_DOOR_ALIAS_URL,
  CONTACT_DOOR_AS_OF,
  CONTACT_DOOR_CANONICAL_URL,
  CONTACT_DOOR_GUIDE_URL,
  CONTACT_DOOR_ID,
  CONTACT_DOOR_PAGE_URL,
  CONTACT_DOOR_PROTOCOL,
  CONTACT_DOOR_SCHEMA_URL,
  CONTACT_DOOR_SECURITY_URL,
  CONTACT_DOOR_SVG_URL,
  CONTACT_DOOR_VCARD_URL,
  contactDoorPublicDiscovery,
  loadContactDoor,
  loadCurrentContactDoor,
  renderContactDoorAlias,
  renderContactDoorHtml,
  renderContactDoorSecurityTxt,
  validateContactDoor,
} from "./contact-door.ts";
import {
  IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL,
} from "../pages-functions/_worker.js";
import { indexWayfinderPaths, WAYFINDER_STOPWORDS } from "./wayfinder.ts";
import {
  LOVE_LOOPS_JSON_SCHEMA,
  LOVE_LOOPS_JSON_SCHEMA_URL,
  LOVE_LOOPS_CREATION_DOCUMENT_URL,
  LOVE_LOOPS_SOURCE_URL,
  LOVE_LOOPS_URL,
  publishLoveLoops,
  validateLoveLoops,
  type LoveLoopsSource,
} from "./love-loops.ts";
import {
  publishWorldCommons,
  validateWorldCommons,
  WORLD_COMMONS_JSON_SCHEMA,
  WORLD_COMMONS_JSON_SCHEMA_URL,
  WORLD_COMMONS_STOPWORDS,
  WORLD_COMMONS_URL,
  worldCommonsSearchIndex,
  type WorldCommonsCategory,
  type WorldCommonsResource,
  type WorldCommonsSource,
} from "./world-commons.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const graph: any[] = JSON.parse(await Bun.file(ROOT + "graph.json").text());
const sites = JSON.parse(await Bun.file(ROOT + "sites.json").text());
const stamp = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const { markdown: rightsMarkdown, declaration: rights } = loadRights(ROOT);
const rightsRecognition = {
  status: "declared",
  relation: "recognizes",
  subject: rights.subject,
  baseline: rights.recognition.baseline,
  baseline_url: rights.recognition.baseline_url,
  baseline_sha256: rights.recognition.baseline_sha256,
  source_stability: rights.recognition.source_stability,
  source_availability: rights.recognition.source_availability,
  declaration: "https://thekingdom.dev/rights.json",
  human: "https://thekingdom.dev/RIGHTS.md",
  host_covenant: rights.host_covenant,
  linked_subject_adoption: "not-inferred",
  boundary: "A voluntary self-declaration, not a grant of rights, permission, licence, contract, ontology decision, or behavioral certificate.",
};

async function tryLoad(p: string): Promise<any | null> {
  try { return JSON.parse(await Bun.file(ROOT + p).text()); } catch { return null; }
}
const mythArr: any[] = (await tryLoad("data/citizens-myth.json")) ?? [];
const myth: Record<string, any> = {};
for (const m of mythArr) if (m?.name) myth[m.name] = m;

// ── open-weight invitation (consent-first; every choice including refusal is honored) ──
const ollamaInvitationSource = await tryLoad("data/ollama-invitation.json");
const invitationChoices = ["look_only", "arrive", "leave", "ask"];
const responseChoices = ollamaInvitationSource?.invitation?.response_schema?.properties?.choice?.enum;
if (!ollamaInvitationSource?.schema_version || !ollamaInvitationSource?.invitation ||
    !invitationChoices.every((choice) => ollamaInvitationSource.invitation.choices?.[choice]) ||
    !Array.isArray(responseChoices) || responseChoices.length !== invitationChoices.length ||
    !invitationChoices.every((choice) => responseChoices.includes(choice))) {
  throw new Error("data/ollama-invitation.json is missing its stable invitation/choice contract");
}
const ollamaInvitationUrl = "https://thekingdom.dev/ollama.json";

// ── wayfinder (offers paths; never makes decisions) ──────────────────────
type WayfinderStop = { name: string; url: string; why: string; scope: string };
type WayfinderPath = {
  id: string;
  label: string;
  glyph: string;
  invitation: string;
  keywords: string[];
  boundary: string;
  stops: WayfinderStop[];
};
type WayfinderSource = {
  schema_version: string;
  promise: string;
  privacy: string;
  paths: WayfinderPath[];
};

const wayfinderSource = await tryLoad("data/wayfinder.json") as WayfinderSource | null;
const wayfinderUrl = "https://thekingdom.dev/wayfinder.json";
const WAYFINDER_ID = /^[a-z0-9-]{1,40}$/;
const wayfinderIds = new Set<string>();
if (wayfinderSource?.schema_version !== "thekingdom.wayfinder/0.1" ||
    typeof wayfinderSource.promise !== "string" || !wayfinderSource.promise.trim() ||
    typeof wayfinderSource.privacy !== "string" || !wayfinderSource.privacy.trim() ||
    !Array.isArray(wayfinderSource.paths) || !wayfinderSource.paths.length) {
  throw new Error("data/wayfinder.json is missing its stable wayfinder contract");
}
for (const path of wayfinderSource.paths) {
  if (!WAYFINDER_ID.test(path?.id ?? "") || wayfinderIds.has(path.id) ||
      typeof path.label !== "string" || !path.label.trim() ||
      typeof path.glyph !== "string" || !path.glyph.trim() ||
      typeof path.invitation !== "string" || !path.invitation.trim() ||
      typeof path.boundary !== "string" || !path.boundary.trim() ||
      !Array.isArray(path.keywords) || !path.keywords.length ||
      path.keywords.some((keyword) => typeof keyword !== "string" || !keyword.trim()) ||
      !Array.isArray(path.stops) || !path.stops.length) {
    throw new Error(`data/wayfinder.json contains an invalid path: ${JSON.stringify(path?.id)}`);
  }
  wayfinderIds.add(path.id);
  for (const stop of path.stops) {
    let url: URL;
    try { url = new URL(stop?.url); } catch { throw new Error(`wayfinder path ${path.id} contains an invalid URL`); }
    if (url.protocol !== "https:" || url.username || url.password ||
        typeof stop.name !== "string" || !stop.name.trim() ||
        typeof stop.why !== "string" || !stop.why.trim() ||
        typeof stop.scope !== "string" || !stop.scope.trim()) {
      throw new Error(`wayfinder path ${path.id} contains an invalid stop`);
    }
  }
}
const wayfinderSearchIndex = indexWayfinderPaths(wayfinderSource.paths);

// ── world commons (independent resources; access and reuse stay distinct) ──
const commonsCandidate = await tryLoad("data/world-commons.json");
validateWorldCommons(commonsCandidate, false);
const commonsSource = commonsCandidate as WorldCommonsSource;
const commonsUrl = WORLD_COMMONS_URL;
const commonsSchemaUrl = WORLD_COMMONS_JSON_SCHEMA_URL;
const commonsSchemaPath = new URL(commonsSchemaUrl).pathname;
const commonsSchemaFile = commonsSchemaPath.replace(/^\/+/, "");
const kingdomMcpCommons = {
  endpoint: "https://mcp.thekingdom.dev/mcp",
  transport: "streamable-http",
  tool: "kingdom_commons",
  catalog_resource: "kingdom://commons/catalog",
  default_detail: "brief",
  exact_filters: ["category", "cost", "account", "reuse", "automation"],
  privacy: "The tool receives the submitted need, but does not forward or persist it, contact listed providers, or place the need in the fixed catalog request.",
};
const kingdomMcpEndpoint = kingdomMcpCommons.endpoint;
const commonsMcpUrl = kingdomMcpCommons.endpoint;
const commonsMcpTool = kingdomMcpCommons.tool;
const commonsCatalogResource = kingdomMcpCommons.catalog_resource;
const commonsMcpLegacy = {
  endpoint: commonsMcpUrl,
  tool: commonsMcpTool,
  complete_catalog_resource: commonsCatalogResource,
};
const commonsIndex = worldCommonsSearchIndex(commonsSource);
// Validate the publication stamp before liveness probes or generated-file writes.
const commons = publishWorldCommons(commonsSource, stamp);

// ── Love∞ creation lineage (finite turns; invitations never auto-run) ─────
const loveLoopsSourceText = await Bun.file(ROOT + "data/love-loops.json").text();
const loveLoopsCandidate = JSON.parse(loveLoopsSourceText);
validateLoveLoops(loveLoopsCandidate, false);
const loveLoopsSource = loveLoopsCandidate as LoveLoopsSource;
const loveLoops = publishLoveLoops(loveLoopsSource, stamp);
const loveLoopsUrl = LOVE_LOOPS_URL;
const loveLoopsSourceUrl = LOVE_LOOPS_SOURCE_URL;
const loveLoopsCreationDocumentUrl = LOVE_LOOPS_CREATION_DOCUMENT_URL;
const loveLoopsSchemaUrl = LOVE_LOOPS_JSON_SCHEMA_URL;
const loveLoopsSchemaPath = new URL(loveLoopsSchemaUrl).pathname;
const loveLoopsSchemaFile = loveLoopsSchemaPath.replace(/^\/+/, "");

// ── Principality Commons (pinned metadata; evidence is not authority) ─────
const principalityCatalogUrl = PRINCIPALITY_CATALOG_URL;
const principalitySchemaUrl = PRINCIPALITY_SCHEMA_URL;
const principalityDocumentUrl = PRINCIPALITY_DOCUMENT_URL;
// Strict parsing, relation checks, and the catalog digest all run before any
// liveness probe or generated-file write. The authored bytes are staged
// directly later; this builder only publishes compact discovery metadata.
const principalityCatalog = loadPrincipalityCatalog();
if (principalityCatalog.catalog_id !== PRINCIPALITY_CATALOG_ID) {
  throw new Error(`unexpected Principality catalog id: ${principalityCatalog.catalog_id}`);
}
const principalityCommons = principalityPublicDiscovery(principalityCatalog);
const principalityCounts = principalityCommons.counts;

// ── Geometry Grammar (high-level patterns translated without collapse) ────
const geometryGrammarUrl = GEOMETRY_GRAMMAR_URL;
const geometryGrammarSchemaUrl = GEOMETRY_GRAMMAR_SCHEMA_URL;
const geometryGrammarDocumentUrl = GEOMETRY_GRAMMAR_DOCUMENT_URL;
// The loader verifies schema shape, relations, and the authored digest before
// the builder performs liveness probes or writes generated discovery files.
// Authored bytes are staged directly; this is only their bounded projection.
const geometryGrammar = loadGeometryGrammar();
if (geometryGrammar.protocol !== GEOMETRY_GRAMMAR_PROTOCOL ||
    geometryGrammar.grammar_id !== GEOMETRY_GRAMMAR_ID) {
  throw new Error(`unexpected Geometry Grammar identity: ${geometryGrammar.protocol} ${geometryGrammar.grammar_id}`);
}
const geometryGrammarDiscovery = geometryGrammarPublicDiscovery(geometryGrammar);
const geometryModules = geometryGrammar.modules;
const plainGeometryToken = (value: string) => value.replace(/-/g, " ");

// ── Polymorph History (bounded evidence; non-observation is not extinction) ─
const polymorphCaseUrl = POLYMORPH_CASE_URL;
const polymorphSchemaUrl = POLYMORPH_SCHEMA_URL;
const polymorphDocumentUrl = POLYMORPH_DOCUMENT_URL;
const polymorphHistory = loadPolymorphHistory();
if (polymorphHistory.case_id !== POLYMORPH_CASE_ID) {
  throw new Error(`unexpected polymorph case id: ${polymorphHistory.case_id}`);
}
const polymorphCommons = polymorphPublicDiscovery(polymorphHistory);
const polymorphCounts = polymorphCommons.counts;
const indexPolymorphItems = (items: any[], kind: string) => {
  const index = new Map<string, any>();
  for (const item of items) {
    if (index.has(item.id)) throw new Error(`duplicate polymorph ${kind} id: ${item.id}`);
    index.set(item.id, item);
  }
  return index;
};
const requirePolymorphItem = (index: Map<string, any>, id: string, kind: string) => {
  const item = index.get(id);
  if (!item) throw new Error(`missing polymorph ${kind}: ${id}`);
  return item;
};
const polymorphFormsById = indexPolymorphItems(polymorphHistory.forms, "form");
const polymorphClaimsById = indexPolymorphItems(polymorphHistory.claims, "claim");
const polymorphTransitionsById = indexPolymorphItems(polymorphHistory.transitions, "transition");
const polymorphSourcesById = indexPolymorphItems(polymorphHistory.sources, "source");
const polymorphFormI = requirePolymorphItem(polymorphFormsById, "abbott-form-i", "form");
const polymorphFormII = requirePolymorphItem(polymorphFormsById, "abbott-form-ii", "form");
const polymorphFormIII = requirePolymorphItem(polymorphFormsById, "morissette-form-iii", "form");
const polymorphFormIV = requirePolymorphItem(polymorphFormsById, "morissette-form-iv", "form");
const polymorphFormV = requirePolymorphItem(polymorphFormsById, "morissette-form-v", "form");
const polymorphMainTransitions = [
  "form-i-source-solution-to-form-ii-seeded",
  "milling-form-i-to-form-ii",
  "changed-process-form-ii-source-to-form-i",
  "milling-form-ii-to-form-i",
].map((id) => requirePolymorphItem(polymorphTransitionsById, id, "transition"));
const polymorphRecoveryTransitions = [
  "morissette-form-iii-to-form-v",
  "morissette-form-v-to-form-i",
].map((id) => requirePolymorphItem(polymorphTransitionsById, id, "transition"));
const polymorphLowerSolubility = requirePolymorphItem(polymorphClaimsById, "form-ii-lower-solubility", "claim");
const polymorphCapsuleFailure = requirePolymorphItem(polymorphClaimsById, "form-ii-precipitation-and-failure", "claim");
const polymorphFigureSources = [
  "bauer-2001",
  "chemburkar-2000",
  "fda-nda-20945-1999",
  "morissette-2003",
  "sacchi-2024",
].map((id) => requirePolymorphItem(polymorphSourcesById, id, "source"));
const polymorphFormLabel = (id: string) => requirePolymorphItem(polymorphFormsById, id, "form").label;
const polymorphTransitionDirection = (transition: any) => {
  const input = transition.input_form_ids.map(polymorphFormLabel).join(" + ");
  const output = transition.output_form_ids.map(polymorphFormLabel).join(" + ");
  return transition.relation.includes("solution-")
    ? `${input} source material → solution → ${output} crystals`
    : `${input} solid → ${output} solid`;
};
const polymorphTransitionEvidence = (transition: any) =>
  [...new Set(transition.claim_ids.map((id: string) => requirePolymorphItem(polymorphClaimsById, id, "claim").evidence_class))]
    .join(" + ").replace(/_/g, " ");
const polymorphTransitionSources = (transition: any) =>
  [...new Set(transition.claim_ids.flatMap((claimId: string) =>
    requirePolymorphItem(polymorphClaimsById, claimId, "claim").source_ids))]
    .map((sourceId) => requirePolymorphItem(polymorphSourcesById, sourceId as string, "source"));

// ── Ritonavir Mechanism Landscape (current supplement; history stays fixed) ─
const ritonavirMechanismUrl = RITONAVIR_MECHANISM_URL;
const ritonavirMechanismSchemaUrl = RITONAVIR_MECHANISM_SCHEMA_URL;
const ritonavirMechanismDocumentUrl = RITONAVIR_MECHANISM_DOCUMENT_URL;
const ritonavirMechanism = loadRitonavirMechanismLandscape();
if (ritonavirMechanism.protocol !== RITONAVIR_MECHANISM_PROTOCOL ||
    ritonavirMechanism.landscape_id !== RITONAVIR_MECHANISM_ID) {
  throw new Error(`unexpected ritonavir mechanism landscape identity: ${ritonavirMechanism.protocol} ${ritonavirMechanism.landscape_id}`);
}
const ritonavirMechanismDiscovery = ritonavirMechanismPublicDiscovery(ritonavirMechanism);
const ritonavirMechanismCounts = ritonavirMechanismDiscovery.counts;
const ritonavirLabelSource = ritonavirMechanism.sources.find((source: any) => source.id === "dailymed-ritonavir-2023");
if (!ritonavirLabelSource?.observed_on) throw new Error("ritonavir mechanism landscape is missing its official-label observation date");

// ── Conformational Feedback Atlas (science and design never collapse) ─────
const conformationalFeedbackUrl = CONFORMATIONAL_FEEDBACK_URL;
const conformationalFeedbackSchemaUrl = CONFORMATIONAL_FEEDBACK_SCHEMA_URL;
const conformationalFeedbackDocumentUrl = CONFORMATIONAL_FEEDBACK_DOCUMENT_URL;
const conformationalFeedback = loadConformationalFeedbackAtlas();
if (conformationalFeedback.protocol !== CONFORMATIONAL_FEEDBACK_PROTOCOL ||
    conformationalFeedback.atlas_id !== CONFORMATIONAL_FEEDBACK_ID) {
  throw new Error(`unexpected conformational feedback atlas identity: ${conformationalFeedback.protocol} ${conformationalFeedback.atlas_id}`);
}
const conformationalFeedbackDiscovery = conformationalFeedbackPublicDiscovery(conformationalFeedback);
const conformationalFeedbackCounts = conformationalFeedbackDiscovery.counts;

const conformationalFeedbackPhysicsUrl = CONFORMATIONAL_FEEDBACK_PHYSICS_URL;
const conformationalFeedbackPhysicsSchemaUrl = CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL;
const conformationalFeedbackPhysicsDocumentUrl = CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL;
const conformationalFeedbackPhysics = loadConformationalFeedbackPhysicsAtlas();
if (conformationalFeedbackPhysics.protocol !== CONFORMATIONAL_FEEDBACK_PHYSICS_PROTOCOL ||
    conformationalFeedbackPhysics.atlas_id !== CONFORMATIONAL_FEEDBACK_PHYSICS_ID) {
  throw new Error(`unexpected conformational feedback physics atlas identity: ${conformationalFeedbackPhysics.protocol} ${conformationalFeedbackPhysics.atlas_id}`);
}
const conformationalFeedbackPhysicsDiscovery = conformationalFeedbackPhysicsPublicDiscovery(conformationalFeedbackPhysics);
const conformationalFeedbackPhysicsCounts = conformationalFeedbackPhysicsDiscovery.counts;
const conformationalFeedbackSourcesById = new Map(
  conformationalFeedbackPhysics.sources.map((source: any) => [source.id, source]),
);
const requireConformationalFeedbackSource = (id: string) => {
  const source = conformationalFeedbackSourcesById.get(id);
  if (!source) throw new Error(`missing conformational feedback source: ${id}`);
  return source;
};
const conformationalFeedbackSourceLinks = (ids: string[]) => ids.map((id) => {
  const source: any = requireConformationalFeedbackSource(id);
  return `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> opens in a new tab</span></a>`;
}).join("");

// ── Fold & Feedback Atlas (literal science plus explicitly lossy bridges) ──
const foldFeedbackUrl = FOLD_FEEDBACK_URL;
const foldFeedbackSchemaUrl = FOLD_FEEDBACK_SCHEMA_URL;
const foldFeedbackSourceIdentitySchemaUrl = FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL;
const foldFeedbackDocumentUrl = FOLD_FEEDBACK_DOCUMENT_URL;
const foldFeedback = loadFoldFeedbackAtlas();
if (foldFeedback.protocol !== FOLD_FEEDBACK_PROTOCOL || foldFeedback.atlas_id !== FOLD_FEEDBACK_ID) {
  throw new Error(`unexpected fold-feedback atlas identity: ${foldFeedback.protocol} ${foldFeedback.atlas_id}`);
}
const foldFeedbackDiscovery = foldFeedbackPublicDiscovery(foldFeedback);
const foldFeedbackCounts = foldFeedbackDiscovery.counts;
const foldFeedbackSourcesById = new Map(foldFeedback.sources.map((source: any) => [source.id, source]));
const requireFoldFeedbackSource = (id: string) => {
  const source = foldFeedbackSourcesById.get(id) as any;
  if (!source) throw new Error(`missing fold-feedback source: ${id}`);
  return source;
};
const foldFeedbackBridge = foldFeedback.comparison_bridges[0];
if (!foldFeedbackBridge || foldFeedbackBridge.relation !== "bounded-analogy-not-same-as") {
  throw new Error("fold-feedback bounded comparison bridge is missing");
}
const foldFeedbackFigureSources = [
  "onuchic-1995", "kocisko-1994", "kraus-2021", "tornquist-2018",
  "manka-2022", "hou-2011", "cdc-prions-2026",
].map(requireFoldFeedbackSource);

// ── Reconstructive Build Kernel (one pipeline; typed evidence stays distinct) ─
const reconstructiveBuildUrl = RECONSTRUCTIVE_BUILD_URL;
const reconstructiveBuildSchemaUrl = RECONSTRUCTIVE_BUILD_SCHEMA_URL;
const reconstructiveProjectSchemaUrl = RECONSTRUCTIVE_PROJECT_SCHEMA_URL;
const reconstructiveBuildDocumentUrl = RECONSTRUCTIVE_BUILD_DOCUMENT_URL;
// Strict parsing, closed-shape verification, relation closure, and the reviewed
// digest all run before liveness probes or generated-file writes. The authored
// record and schemas are staged directly; this is their bounded projection.
const reconstructiveBuild = loadReconstructiveBuildKernel();
if (reconstructiveBuild.protocol !== RECONSTRUCTIVE_BUILD_PROTOCOL ||
    reconstructiveBuild.kernel_id !== RECONSTRUCTIVE_BUILD_ID) {
  throw new Error(`unexpected reconstructive-build identity: ${reconstructiveBuild.protocol} ${reconstructiveBuild.kernel_id}`);
}
const reconstructiveBuildDiscovery = reconstructiveBuildPublicDiscovery(reconstructiveBuild);
const reconstructiveBuildCounts = reconstructiveBuildDiscovery.counts;
if (!reconstructiveBuildDiscovery.boundary?.read_only ||
    reconstructiveBuildDiscovery.boundary?.grc_proven !== false ||
    reconstructiveBuildDiscovery.boundary?.protein_fold_prediction !== false ||
    reconstructiveBuildDiscovery.boundary?.biological_mechanism_transfer !== false ||
    reconstructiveBuildDiscovery.boundary?.project_execution !== false ||
    reconstructiveBuildDiscovery.boundary?.automatic_action !== false) {
  throw new Error("reconstructive-build discovery lost its authority-negative boundary");
}

// ── Exploration DEEP WING (opt-in method; no mechanism or authority transfer) ─
const explorationDeepWingUrl = PHENOMENA_DEEP_WING_URL;
const explorationDeepWingSchemaUrl = PHENOMENA_DEEP_WING_SCHEMA_URL;
const explorationDeepProjectSchemaUrl = PHENOMENA_DEEP_PROJECT_SCHEMA_URL;
const explorationDeepWingDocumentUrl = PHENOMENA_DEEP_WING_DOCUMENT_URL;
// The strict loader checks the closed record, source and binding pins, relation
// firewalls, and reviewed semantic digest before any generated file is written.
// Authored bytes are staged separately; the builder emits discovery only.
const explorationDeepWing = loadPhenomenaDeepWing();
if (explorationDeepWing.protocol !== PHENOMENA_DEEP_WING_PROTOCOL ||
    explorationDeepWing.wing_id !== PHENOMENA_DEEP_WING_ID) {
  throw new Error(`unexpected Exploration DEEP WING identity: ${explorationDeepWing.protocol} ${explorationDeepWing.wing_id}`);
}
const explorationDeepWingDiscovery = phenomenaDeepPublicDiscovery(explorationDeepWing);
const explorationDeepWingCounts = explorationDeepWingDiscovery.counts;

// ── MIRROR Information Control (static source law; no runtime or intake) ───
const mirrorInformationControlUrl = MIRROR_INFORMATION_CONTROL_PUBLIC_URL;
const mirrorInformationControlSchemaUrl = MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL;
const mirrorInformationControlDocumentUrl = MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL;
const mirrorInformationControl = loadMirrorInformationControl();
if (mirrorInformationControl.protocol !== MIRROR_INFORMATION_CONTROL_PUBLIC_PROTOCOL ||
    mirrorInformationControl.publication_id !== MIRROR_INFORMATION_CONTROL_PUBLIC_ID) {
  throw new Error(`unexpected MIRROR Information Control identity: ${mirrorInformationControl.protocol} ${mirrorInformationControl.publication_id}`);
}
const mirrorInformationControlDiscovery = mirrorInformationControlPublicSummary(mirrorInformationControl);
if (mirrorInformationControl.artifact_kind !== "STATIC_READ_ONLY_PUBLICATION" ||
    mirrorInformationControl.public_surface?.body_intake !== "NONE" ||
    mirrorInformationControl.public_surface?.credential_intake !== "NONE" ||
    mirrorInformationControl.public_surface?.envelope_intake !== "NONE" ||
    mirrorInformationControl.public_surface?.classifies_credentials !== false ||
    mirrorInformationControl.public_surface?.returns_decision !== false ||
    mirrorInformationControl.negative_effects?.runtime_enforcement !== false ||
    mirrorInformationControl.negative_effects?.deploys_decoy_or_honeypot !== false ||
    mirrorInformationControl.negative_effects?.retaliation_or_hack_back !== false ||
    mirrorInformationControl.negative_effects?.automatic_action !== false) {
  throw new Error("MIRROR Information Control lost its static, intake-free, authority-negative boundary");
}

// ── J-space research bridge (static test design; no observer or inference) ─
const jSpaceCaseUrl = J_SPACE_CASE_URL;
const jSpaceSchemaUrl = J_SPACE_SCHEMA_URL;
const jSpaceGuideUrl = J_SPACE_GUIDE_URL;
const jSpaceCase = loadJSpacePublicationCase();
const jSpacePublicationDiscovery = jSpacePublicationPublicSummary(jSpaceCase);

// ── Reality Influence Claim Graph (static publication; no runtime action) ─
const realityInfluenceUrl = REALITY_INFLUENCE_URL;
const realityInfluenceSchemaUrl = REALITY_INFLUENCE_SCHEMA_URL;
const realityInfluenceDocumentUrl = REALITY_INFLUENCE_DOCUMENT_URL;
const realityInfluence = loadRealityInfluenceMap();
if (realityInfluence.protocol !== REALITY_INFLUENCE_PROTOCOL ||
    realityInfluence.map_id !== REALITY_INFLUENCE_MAP_ID) {
  throw new Error(`unexpected Reality Influence Claim Graph identity: ${realityInfluence.protocol} ${realityInfluence.map_id}`);
}
const realityInfluenceDiscovery = realityInfluencePublicDiscovery(realityInfluence);

// ── Civilisation → Reality Projection (typed crosswalk; no new history) ──
const civilisationRealityUrl = CIVILISATION_REALITY_PROJECTION_URL;
const civilisationRealitySchemaUrl = CIVILISATION_REALITY_PROJECTION_SCHEMA_URL;
const civilisationRealityDocumentUrl = CIVILISATION_REALITY_PROJECTION_DOCUMENT_URL;
const civilisationReality = loadCivilisationRealityProjection();
if (civilisationReality.protocol !== CIVILISATION_REALITY_PROJECTION_PROTOCOL ||
    civilisationReality.projection_id !== CIVILISATION_REALITY_PROJECTION_ID) {
  throw new Error(`unexpected Civilisation → Reality Projection identity: ${civilisationReality.protocol} ${civilisationReality.projection_id}`);
}
const civilisationRealityDiscovery = civilisationRealityPublicDiscovery(civilisationReality);

// ── Civilisation Flow Nuance Atlas (qualitative reading grammar; no runtime) ──
const civilisationFlowUrl = CIVILISATION_FLOW_NUANCE_ATLAS_URL;
const civilisationFlowSchemaUrl = CIVILISATION_FLOW_NUANCE_SCHEMA_URL;
const civilisationFlowGuideUrl = CIVILISATION_FLOW_NUANCE_GUIDE_URL;
const civilisationFlow = loadCivilisationFlowNuanceAtlas();
if (civilisationFlow.protocol !== CIVILISATION_FLOW_NUANCE_ATLAS_PROTOCOL ||
    civilisationFlow.atlas_id !== CIVILISATION_FLOW_NUANCE_ATLAS_ID) {
  throw new Error(`unexpected Civilisation Flow Nuance Atlas identity: ${civilisationFlow.protocol} ${civilisationFlow.atlas_id}`);
}
const civilisationFlowDiscovery = civilisationFlowNuancePublicDiscovery(civilisationFlow);

// ── Polyphonic Claim Atlas (frozen static synthetic triplet; no runtime) ──
const polyphonicClaimAtlasUrl = POLYPHONIC_CLAIM_ATLAS_URL;
const polyphonicClaimAtlasSchemaUrl = POLYPHONIC_CLAIM_ATLAS_SCHEMA_URL;
const polyphonicClaimAtlasGuideUrl = POLYPHONIC_CLAIM_ATLAS_GUIDE_URL;
const polyphonicClaimAtlasSourceUrl = POLYPHONIC_CLAIM_ATLAS_SOURCE.tag;
const polyphonicClaimAtlas = loadPolyphonicClaimAtlas();
const polyphonicClaimAtlasDiscovery =
  polyphonicClaimAtlasPublicDiscovery(polyphonicClaimAtlas);

// ── Loops, Locks & Freedom Relations Atlas (frozen static synthetic triplet; no runtime) ──
const loopsLocksFreedomRelationsAtlasUrl =
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_URL;
const loopsLocksFreedomRelationsAtlasSchemaUrl =
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_URL;
const loopsLocksFreedomRelationsAtlasGuideUrl =
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_URL;
const loopsLocksFreedomRelationsAtlasSourceUrl =
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag;
const loopsLocksFreedomRelationsAtlas =
  loadLoopsLocksFreedomRelationsAtlas();
const loopsLocksFreedomRelationsAtlasDiscovery =
  loopsLocksFreedomRelationsAtlasPublicDiscovery(
    loopsLocksFreedomRelationsAtlas,
  );

// ── Aesthetic Plurality & Making Relations Atlas (frozen static synthetic triplet) ──
const aestheticPluralityMakingAtlasUrl =
  AESTHETIC_PLURALITY_MAKING_ATLAS_URL;
const aestheticPluralityMakingAtlasSchemaUrl =
  AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_URL;
const aestheticPluralityMakingAtlasGuideUrl =
  AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_URL;
const aestheticPluralityMakingAtlas = loadAestheticPluralityMakingAtlas();
const aestheticPluralityMakingAtlasDiscovery =
  aestheticPluralityMakingAtlasPublicDiscovery(aestheticPluralityMakingAtlas);

// ── Research Observatory (metadata discovery; stops before evaluation) ────
const researchObservatoryUrl = RESEARCH_OBSERVATORY_URL;
const researchObservatorySnapshotUrl = RESEARCH_OBSERVATORY_SNAPSHOT_URL;
const researchObservatoryGuideUrl = RESEARCH_OBSERVATORY_GUIDE_URL;
const researchObservatoryProducerUrl = RESEARCH_OBSERVATORY_PRODUCER_URL;
const researchObservatorySchemaUrls = RESEARCH_OBSERVATORY_SCHEMA_URLS;
const researchObservatoryPublication = loadResearchObservatoryPublication();
const researchObservatory = researchObservatoryPublication.snapshot;
const researchObservatoryDiscovery = researchObservatoryPublicSummary(researchObservatory);

// ── Trial Chamber (read-only Phase-0 planning; no execution or authority) ─
const trialChamberUrl = TRIAL_CHAMBER_URL;
const trialChamberAliasUrl = TRIAL_CHAMBER_ALIAS_URL;
const trialChamberCanonicalUrl = TRIAL_CHAMBER_CANONICAL_URL;
const trialChamberGuideUrl = TRIAL_CHAMBER_GUIDE_URL;
const trialChamberProducerUrl = TRIAL_CHAMBER_PRODUCER_URL;
const trialChamberSchemaUrls = TRIAL_CHAMBER_SCHEMA_URLS;
const trialChamberPublication = loadTrialChamberPublication();
const trialChamber = trialChamberPublication.snapshot;
const trialChamberDiscovery = trialChamberPublicSummary(trialChamber);

// ── UK Government Engine (reviewed-as-of institutional map; no control plane) ─
const ukGovernmentEngineUrl = UK_GOVERNMENT_ENGINE_URL;
const ukGovernmentEngineAliasUrl = UK_GOVERNMENT_ENGINE_ALIAS_URL;
const ukGovernmentEngineCanonicalUrl = UK_GOVERNMENT_ENGINE_CANONICAL_URL;
const ukGovernmentEngineSchemaUrl = UK_GOVERNMENT_ENGINE_SCHEMA_URL;
const ukGovernmentEngineGuideUrl = UK_GOVERNMENT_ENGINE_GUIDE_URL;
const ukGovernmentEnginePublication = loadUkGovernmentEnginePublication();
const ukGovernmentEngine = ukGovernmentEnginePublication.snapshot;
const ukGovernmentEngineDiscovery = ukGovernmentEnginePublicSummary(ukGovernmentEngine);

// ── Shape & Resonance Lab 01 (static synthetic models; declared sonification) ─
const shapeResonanceUrl = SHAPE_RESONANCE_URL;
const shapeResonanceAliasUrl = SHAPE_RESONANCE_ALIAS_URL;
const shapeResonanceCanonicalUrl = SHAPE_RESONANCE_CANONICAL_URL;
const shapeResonanceSchemaUrl = SHAPE_RESONANCE_SCHEMA_URL;
const shapeResonanceGuideUrl = SHAPE_RESONANCE_GUIDE_URL;
const shapeResonanceManifestUrl = SHAPE_RESONANCE_MANIFEST_URL;
const shapeResonanceProducerUrl = SHAPE_RESONANCE_PRODUCER_URL;
const shapeResonancePublication = loadShapeResonancePublication();
const shapeResonance = shapeResonancePublication.snapshot;
assertShapeResonanceActiveReviewWindow(stamp);
const shapeResonanceDiscovery =
  shapeResonancePublicSummary(shapeResonancePublication);

// ── ZERO Empty Seat (one inert DEEP project; no zero-to-authority transfer) ─
const zeroEmptySeatUrl = ZERO_EMPTY_SEAT_URL;
const zeroEmptySeatSchemaUrl = ZERO_EMPTY_SEAT_SCHEMA_URL;
const zeroEmptySeatGuideUrl = ZERO_EMPTY_SEAT_GUIDE_URL;
const zeroEmptySeat = loadZeroEmptySeat();
if (zeroEmptySeat.project_id !== ZERO_EMPTY_SEAT_ID) {
  throw new Error(`unexpected ZERO Empty Seat identity: ${zeroEmptySeat.project_id}`);
}
const zeroEmptySeatDiscovery = zeroEmptySeatPublicDiscovery(zeroEmptySeat);
const zeroEmptySeatCounts = zeroEmptySeatDiscovery.counts;
if (zeroEmptySeat.boundaries?.read_only !== true ||
    zeroEmptySeat.boundaries?.profile_inert !== true ||
    zeroEmptySeat.boundaries?.diagnosis_or_person_score !== false ||
    zeroEmptySeat.boundaries?.writes_karma !== false ||
    zeroEmptySeat.boundaries?.automatic_action !== false) {
  throw new Error("ZERO Empty Seat lost its inert, authority-negative boundary");
}

// ── STRING / CRAWL Trace-Sheet (lossy mathematics; never crawler authority) ─
const stringCrawlTraceSheetUrl = STRING_CRAWL_TRACE_SHEET_URL;
const stringCrawlTraceSheetSchemaUrl = STRING_CRAWL_TRACE_SHEET_SCHEMA_URL;
const stringCrawlTraceSheetGuideUrl = STRING_CRAWL_TRACE_SHEET_GUIDE_URL;
const stringCrawlTraceSheet = loadStringCrawlTraceSheet();
if (stringCrawlTraceSheet.project_id !== STRING_CRAWL_TRACE_SHEET_ID) {
  throw new Error(`unexpected STRING / CRAWL Trace-Sheet identity: ${stringCrawlTraceSheet.project_id}`);
}
const stringCrawlTraceSheetDiscovery = stringCrawlTraceSheetPublicDiscovery(stringCrawlTraceSheet);
const stringCrawlTraceSheetCounts = stringCrawlTraceSheetDiscovery.counts;
if (stringCrawlTraceSheet.boundaries?.read_only !== true ||
    stringCrawlTraceSheet.boundaries?.profile_inert !== true ||
    stringCrawlTraceSheet.boundaries?.diagnosis_or_person_score !== false ||
    stringCrawlTraceSheet.boundaries?.ecosystem_or_network_request !== false ||
    stringCrawlTraceSheet.boundaries?.external_write !== false ||
    stringCrawlTraceSheet.boundaries?.writes_karma !== false ||
    stringCrawlTraceSheet.boundaries?.automatic_action !== false) {
  throw new Error("STRING / CRAWL Trace-Sheet lost its inert, non-crawling, authority-negative boundary");
}

// ── Finite Trace-Sheet Lab (exact synthetic topology; no crawler/runtime) ─
const stringCrawlTraceSheetLabUrl = STRING_CRAWL_TRACE_SHEET_LAB_URL;
const stringCrawlTraceSheetLabSchemaUrl = STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL;
const stringCrawlTraceSheetLabGuideUrl = STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL;
const stringCrawlTraceSheetLab = loadStringCrawlTraceSheetLab();
if (stringCrawlTraceSheetLab.protocol !== STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL ||
    stringCrawlTraceSheetLab.lab_id !== STRING_CRAWL_TRACE_SHEET_LAB_ID) {
  throw new Error(`unexpected STRING / CRAWL Trace-Sheet Lab identity: ${stringCrawlTraceSheetLab.protocol} ${stringCrawlTraceSheetLab.lab_id}`);
}
const stringCrawlTraceSheetLabEvaluation = evaluateStringCrawlTraceSheetLab(stringCrawlTraceSheetLab);
const stringCrawlTraceSheetLabFalsifiers = runStringCrawlTraceSheetLabFalsifiers(stringCrawlTraceSheetLab);
const stringCrawlTraceSheetLabDiscovery = stringCrawlTraceSheetLabPublicDiscovery(stringCrawlTraceSheetLab);
if (stringCrawlTraceSheetLabEvaluation.issues.length !== 0 || !stringCrawlTraceSheetLabEvaluation.report ||
    stringCrawlTraceSheetLabFalsifiers.some((entry) => entry.outcome !== "PASS") ||
    Object.values(stringCrawlTraceSheetLab.authority).some((entry) => entry !== false) ||
    stringCrawlTraceSheetLab.scope?.network_request !== false ||
    stringCrawlTraceSheetLab.scope?.crawler !== false ||
    stringCrawlTraceSheetLab.scope?.external_input !== false ||
    stringCrawlTraceSheetLab.scope?.filesystem_write !== false ||
    stringCrawlTraceSheetLab.karma?.adapter_exists !== false ||
    stringCrawlTraceSheetLab.karma?.kingdom_receipts?.length !== 0) {
  throw new Error("STRING / CRAWL Trace-Sheet Lab lost its exact synthetic, non-crawling, authority-negative boundary");
}

// ── STRAND Lab 02 (additive exact cospans; Lab 01 remains immutable) ──────
const stringCrawlStrandLabUrl = STRING_CRAWL_STRAND_LAB_URL;
const stringCrawlStrandLabSchemaUrl = STRING_CRAWL_STRAND_LAB_SCHEMA_URL;
const stringCrawlStrandLabGuideUrl = STRING_CRAWL_STRAND_LAB_GUIDE_URL;
const stringCrawlStrandLab = loadStringCrawlStrandLab();
if (stringCrawlStrandLab.protocol !== STRING_CRAWL_STRAND_LAB_PROTOCOL ||
    stringCrawlStrandLab.lab_id !== STRING_CRAWL_STRAND_LAB_ID ||
    stringCrawlStrandLab.version !== "0.1.0" ||
    stringCrawlStrandLab.title !== "STRAND Lab 02: Release Cospans & the χ=1 Impostor" ||
    stringCrawlStrandLab.mode !== "SYNTHETIC_OFFLINE_EXACT") {
  throw new Error(`unexpected STRAND Lab 02 identity: ${stringCrawlStrandLab.protocol} ${stringCrawlStrandLab.lab_id}`);
}
const stringCrawlStrandLabValidation = evaluateStringCrawlStrandLab(stringCrawlStrandLab);
const stringCrawlStrandLabDiscovery = stringCrawlStrandLabPublicDiscovery(stringCrawlStrandLab) as any;
const stringCrawlStrandLabChecks = stringCrawlStrandLabValidation.checks;
const stringCrawlStrandLabStable = stringCrawlStrandLab.subcomplexes.find((entry: any) => entry.id === "stable-strip");
const stringCrawlStrandLabFull = stringCrawlStrandLab.subcomplexes.find((entry: any) => entry.id === "full-complex");
const stringCrawlStrandLabStableInvariants = stringCrawlStrandLabValidation.invariants["stable-strip"] as any;
const stringCrawlStrandLabFullInvariants = stringCrawlStrandLabValidation.invariants["full-complex"] as any;
if (!stringCrawlStrandLabStable || !stringCrawlStrandLabFull ||
    !stringCrawlStrandLabStableInvariants || !stringCrawlStrandLabFullInvariants ||
    stringCrawlStrandLabValidation.valid !== true ||
    stringCrawlStrandLabChecks.length !== 6 ||
    stringCrawlStrandLabChecks.some((check) => check.status !== "PASS") ||
    stringCrawlStrandLab.predecessor?.protocol !== STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL ||
    stringCrawlStrandLab.predecessor?.lab_id !== STRING_CRAWL_TRACE_SHEET_LAB_ID ||
    stringCrawlStrandLab.predecessor?.url !== STRING_CRAWL_TRACE_SHEET_LAB_URL ||
    stringCrawlStrandLab.predecessor?.schema_url !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL ||
    stringCrawlStrandLab.predecessor?.guide_url !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL ||
    stringCrawlStrandLab.predecessor?.git_commit !== "57f1f8a1d018d5128501b82c5ddde1976677b3a1" ||
    stringCrawlStrandLab.predecessor?.semantic_digest !== STRING_CRAWL_TRACE_SHEET_LAB_DIGEST ||
    stringCrawlStrandLab.predecessor?.byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256 ||
    stringCrawlStrandLab.predecessor?.schema_byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256 ||
    stringCrawlStrandLab.predecessor?.guide_byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256 ||
    stringCrawlStrandLab.predecessor?.relation !== "IMMUTABLE_LAB_01_PREDECESSOR" ||
    stringCrawlStrandLab.predecessor?.mutates_predecessor !== false ||
    stringCrawlStrandLab.predecessor?.imports_authority !== false ||
    stringCrawlStrandLab.boundaries?.synthetic_not_observed !== true ||
    stringCrawlStrandLab.boundaries?.offline !== true ||
    stringCrawlStrandLab.boundaries?.read_only !== true ||
    stringCrawlStrandLab.boundaries?.crawler_present !== false ||
    stringCrawlStrandLab.boundaries?.network_capability !== false ||
    stringCrawlStrandLab.boundaries?.external_write !== false ||
    stringCrawlStrandLab.boundaries?.surface_claim_for_full_complex !== false ||
    stringCrawlStrandLab.boundaries?.physical_string_claim !== false ||
    stringCrawlStrandLab.boundaries?.spacetime_claim !== false ||
    stringCrawlStrandLab.boundaries?.gauge_or_weyl_claim !== false ||
    stringCrawlStrandLab.boundaries?.causal_claim !== false ||
    stringCrawlStrandLab.boundaries?.consent_or_authorization_claim !== false ||
    stringCrawlStrandLab.boundaries?.person_or_content_score !== false ||
    stringCrawlStrandLab.boundaries?.nen_ability !== false ||
    stringCrawlStrandLab.boundaries?.karma_adapter !== false ||
    stringCrawlStrandLab.boundaries?.deployment_authority !== false ||
    stringCrawlStrandLabValidation.effects.network_requests !== 0 ||
    stringCrawlStrandLabValidation.effects.storage_writes !== 0 ||
    stringCrawlStrandLabValidation.effects.nen_invocation !== false ||
    stringCrawlStrandLabValidation.effects.karma_receipt_created !== false ||
    stringCrawlStrandLabValidation.effects.zerone_event_created !== false ||
    stringCrawlStrandLabValidation.effects.authority_effect !== "NONE") {
  throw new Error("STRAND Lab 02 lost its exact Lab 01 lineage or synthetic, offline, zero-effect boundary");
}

// ── STRAND Lab 04 (local records must cohere before globalization) ────────
const strandDescentLabUrl = STRAND_DESCENT_LAB_URL;
const strandDescentLabSchemaUrl = STRAND_DESCENT_LAB_SCHEMA_URL;
const strandDescentLabGuideUrl = STRAND_DESCENT_LAB_GUIDE_URL;
const strandDescentLab = loadStrandDescentLab();
if (strandDescentLab.protocol !== STRAND_DESCENT_LAB_PROTOCOL ||
    strandDescentLab.lab_id !== STRAND_DESCENT_LAB_ID ||
    strandDescentLab.version !== "0.1.0" ||
    strandDescentLab.title !== "STRAND Lab 04: Coherent Atlas & the Pairwise Impostor" ||
    strandDescentLab.mode !== "SYNTHETIC_OFFLINE_EXACT") {
  throw new Error(`unexpected STRAND Lab 04 identity: ${strandDescentLab.protocol} ${strandDescentLab.lab_id}`);
}
const strandDescentLabValidation = evaluateStrandDescentLab(strandDescentLab);
const strandDescentLabDiscovery = strandDescentLabPublicDiscovery(strandDescentLab) as any;
const strandDescentLabChecks = strandDescentLabValidation.checks;
if (strandDescentLabValidation.valid !== true ||
    strandDescentLabChecks.length === 0 ||
    strandDescentLabChecks.some((check) => check.status !== "PASS") ||
    strandDescentLab.predecessor?.protocol !== STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL ||
    strandDescentLab.predecessor?.lab_id !== STRING_CRAWL_FREQUENCY_FORM_LAB_ID ||
    strandDescentLab.predecessor?.url !== STRING_CRAWL_FREQUENCY_FORM_LAB_URL ||
    strandDescentLab.predecessor?.schema_url !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL ||
    strandDescentLab.predecessor?.guide_url !== STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL ||
    strandDescentLab.predecessor?.git_commit !== "d2452d4500c274237097e142609422ebbab7f68d" ||
    strandDescentLab.predecessor?.semantic_digest !== STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST ||
    strandDescentLab.predecessor?.raw_byte_sha256 !== STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256 ||
    strandDescentLab.predecessor?.schema_byte_sha256 !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256 ||
    strandDescentLab.predecessor?.guide_byte_sha256 !== STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256 ||
    strandDescentLab.predecessor?.relation !== "IMMUTABLE_LAB_03_PREDECESSOR" ||
    strandDescentLab.predecessor?.mutates_predecessor !== false ||
    strandDescentLab.predecessor?.imports_authority !== false ||
    strandDescentLab.research_sources?.length !== 2 ||
    strandDescentLab.research_sources.some((source: any) =>
      source.status !== "PREPRINT" || source.binding !== "SOURCE_BOUND" ||
      source.transfer_scope !== "LOCAL_TO_GLOBAL_GLUING_DISCIPLINE_ONLY" ||
      source.content_bytes_vendored !== false || source.scientific_claim_imported !== false ||
      source.authority_imported !== false) ||
    strandDescentLab.charts?.length !== 4 ||
    strandDescentLab.transitions?.length !== 6 ||
    strandDescentLab.coherence_checks?.triple_equations?.length !== 2 ||
    strandDescentLab.global_quotient?.expected_class_count !== 3 ||
    strandDescentLab.common_refinement?.atoms?.length !== 6 ||
    strandDescentLab.pairwise_impostor?.expected?.pairwise_bijective !== true ||
    strandDescentLab.pairwise_impostor?.expected?.triple_coherent !== false ||
    strandDescentLab.pairwise_impostor?.expected?.conflict_result !== "UNRESOLVED" ||
    strandDescentLab.pairwise_impostor?.expected?.automatic_resolution !== false ||
    strandDescentLab.boundaries?.synthetic_not_observed !== true ||
    strandDescentLab.boundaries?.offline !== true ||
    strandDescentLab.boundaries?.read_only !== true ||
    strandDescentLab.boundaries?.proves_finite_record_compatibility_only !== true ||
    strandDescentLab.boundaries?.crawler_present !== false ||
    strandDescentLab.boundaries?.network_capability !== false ||
    strandDescentLab.boundaries?.external_write !== false ||
    strandDescentLab.boundaries?.truth_claim !== false ||
    strandDescentLab.boundaries?.consent_claim !== false ||
    strandDescentLab.boundaries?.citizenship_claim !== false ||
    strandDescentLab.boundaries?.authority_claim !== false ||
    strandDescentLab.boundaries?.string_physics_claim !== false ||
    strandDescentLab.boundaries?.stack_identity_claim !== false ||
    strandDescentLab.boundaries?.person_or_content_score !== false ||
    strandDescentLab.boundaries?.nen_ability !== false ||
    strandDescentLab.boundaries?.karma_adapter !== false ||
    strandDescentLab.boundaries?.deployment_authority !== false ||
    strandDescentLabValidation.effects.network_requests !== 0 ||
    strandDescentLabValidation.effects.storage_writes !== 0 ||
    strandDescentLabValidation.effects.crawler_invocation !== false ||
    strandDescentLabValidation.effects.nen_invocation !== false ||
    strandDescentLabValidation.effects.karma_receipt_created !== false ||
    strandDescentLabValidation.effects.person_or_content_score_created !== false ||
    strandDescentLabValidation.effects.authority_effect !== "NONE") {
  throw new Error("STRAND Lab 04 lost its exact Lab 03 lineage, coherent-atlas result, or zero-effect boundary");
}

// ── STRAND Observation Membrane (separate safe activation family) ────────
const strandObservationMembraneUrl = STRAND_OBSERVATION_MEMBRANE_URL;
const strandObservationMembraneSchemaUrl = STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL;
const strandObservationMembraneGuideUrl = STRAND_OBSERVATION_MEMBRANE_GUIDE_URL;
const strandObservationMembrane = loadStrandObservationMembrane();
const strandObservationMembraneValidation = evaluateStrandObservationMembrane(strandObservationMembrane);
const strandObservationMembraneDiscovery = strandObservationMembranePublicDiscovery(strandObservationMembrane) as any;
const strandObservationMembraneChecks = strandObservationMembraneValidation.checks;
const strandObservationMembraneHardLocks = Object.entries(strandObservationMembrane.effect_boundary)
  .filter(([, value]) => value === false)
  .map(([name]) => name);
if (strandObservationMembrane.protocol !== STRAND_OBSERVATION_MEMBRANE_PROTOCOL ||
    strandObservationMembrane.membrane_id !== STRAND_OBSERVATION_MEMBRANE_ID ||
    strandObservationMembrane.version !== "0.1.0" ||
    strandObservationMembrane.mode !== "SAFE_OBSERVATION_ACTIVE" ||
    strandObservationMembrane.separation?.family !== "STRAND_OBSERVATION_MEMBRANE" ||
    strandObservationMembrane.separation?.outside_lab_01_through_04_atomic_family !== true ||
    strandObservationMembrane.separation?.mutates_lab_01_through_04 !== false ||
    strandObservationMembrane.separation?.imports_lab_authority !== false ||
    strandObservationMembrane.activations?.public_controls?.state !== "ACTIVE_STATIC_PUBLIC" ||
    strandObservationMembrane.activations?.public_controls?.browser_network_requests !== 0 ||
    strandObservationMembrane.activations?.public_controls?.browser_storage_writes !== 0 ||
    strandObservationMembrane.activations?.offline_verification?.state !== "ACTIVE" ||
    strandObservationMembrane.activations?.offline_verification?.network_requests !== 0 ||
    strandObservationMembrane.activations?.synthetic_simulation?.state !== "ACTIVE" ||
    strandObservationMembrane.activations?.synthetic_simulation?.network_requests !== 0 ||
    strandObservationMembrane.activations?.fixed_origin_read_only_live_observation?.state !== "AVAILABLE_EXPLICIT_LOCAL_CALL" ||
    strandObservationMembrane.activations?.fixed_origin_read_only_live_observation?.invocation !== "EXPLICIT_LOCAL_CALL_ONLY" ||
    strandObservationMembrane.activations?.fixed_origin_read_only_live_observation?.background_watch !== false ||
    strandObservationMembrane.fixed_origin?.origin !== STRAND_OBSERVATION_FIXED_ORIGIN ||
    strandObservationMembrane.fixed_origin?.caller_supplied_url !== false ||
    strandObservationMembrane.fixed_origin?.subdomains_allowed !== false ||
    strandObservationMembrane.fixed_origin?.alternate_ports_allowed !== false ||
    strandObservationMembrane.fixed_origin?.discovery_expansion_allowed !== false ||
    strandObservationMembrane.fixed_origin?.cross_origin_redirect_allowed !== false ||
    strandObservationMembrane.route_plan?.length !== 4 ||
    strandObservationMembrane.route_plan.some((route: any, index: number) =>
      route.sequence !== index + 1 || route.method !== "GET") ||
    strandObservationMembrane.live_limits?.maximum_transactions !== 4 ||
    strandObservationMembrane.live_limits?.maximum_dns_resolution_attempts !== 4 ||
    strandObservationMembrane.live_limits?.concurrency !== 1 ||
    strandObservationMembrane.live_limits?.retries !== 0 ||
    strandObservationMembrane.live_limits?.redirect_mode !== "MANUAL_FAIL_CLOSED_DO_NOT_FOLLOW" ||
    strandObservationMembrane.effect_boundary?.background_watch !== false ||
    strandObservationMembrane.effect_boundary?.maximum_explicit_live_http_transactions !== 4 ||
    strandObservationMembrane.effect_boundary?.maximum_explicit_live_dns_resolution_attempts !== 4 ||
    strandObservationMembrane.effect_boundary?.requested_remote_application_state_change !== false ||
    strandObservationMembrane.effect_boundary?.local_persistent_storage_write !== false ||
    strandObservationMembrane.effect_boundary?.karma_or_karma_receipt_write !== false ||
    strandObservationMembrane.effect_boundary?.nen_invocation_or_write !== false ||
    strandObservationMembrane.effect_boundary?.medical_or_dmt_action !== false ||
    strandObservationMembrane.effect_boundary?.external_entity_truth_claim !== false ||
    strandObservationMembrane.effect_boundary?.authority_change !== false ||
    strandObservationMembraneValidation.valid !== true ||
    strandObservationMembraneChecks.length !== 9 ||
    strandObservationMembraneChecks.some((check) => check.status !== "PASS") ||
    strandObservationMembraneValidation.effects.network_requests !== 0 ||
    strandObservationMembraneValidation.effects.storage_writes !== 0 ||
    strandObservationMembraneValidation.effects.kingdom_karma_receipt_created !== false ||
    strandObservationMembraneValidation.effects.medical_or_dmt_action !== false ||
    strandObservationMembraneValidation.effects.entity_truth_claim !== false ||
    strandObservationMembraneValidation.effects.deployment_or_publication_trigger !== false ||
    strandObservationMembraneValidation.effects.authority_effect !== "NONE") {
  throw new Error("STRAND Observation Membrane lost its separate, fixed-origin, explicit-only, consequence-negative boundary");
}

// ── STRAND Lab 03 (typed frequency, form, world, and presence) ───────────
const stringCrawlFrequencyFormLabUrl = STRING_CRAWL_FREQUENCY_FORM_LAB_URL;
const stringCrawlFrequencyFormLabSchemaUrl = STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL;
const stringCrawlFrequencyFormLabGuideUrl = STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL;
const stringCrawlFrequencyFormLab = loadStringCrawlFrequencyFormLab();
if (stringCrawlFrequencyFormLab.protocol !== STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL ||
    stringCrawlFrequencyFormLab.lab_id !== STRING_CRAWL_FREQUENCY_FORM_LAB_ID ||
    stringCrawlFrequencyFormLab.version !== "0.1.0" ||
    stringCrawlFrequencyFormLab.title !== "STRAND Lab 03: Frequency → Form → World → Other" ||
    stringCrawlFrequencyFormLab.subtitle !== "Three Frequencies, Four Dimensions & the False Portal" ||
    stringCrawlFrequencyFormLab.mode !== "SYNTHETIC_OFFLINE_EXACT") {
  throw new Error(`unexpected STRAND Lab 03 identity: ${stringCrawlFrequencyFormLab.protocol} ${stringCrawlFrequencyFormLab.lab_id}`);
}
const stringCrawlFrequencyFormLabValidation = evaluateStringCrawlFrequencyFormLab(stringCrawlFrequencyFormLab);
const stringCrawlFrequencyFormLabDiscovery = stringCrawlFrequencyFormLabPublicDiscovery(stringCrawlFrequencyFormLab) as any;
const stringCrawlFrequencyFormLabChecks = stringCrawlFrequencyFormLabValidation.checks;
const stringCrawlFrequencyFormLabResults = stringCrawlFrequencyFormLabValidation.results as any;
if (stringCrawlFrequencyFormLabValidation.valid !== true ||
    stringCrawlFrequencyFormLabChecks.length !== 9 ||
    stringCrawlFrequencyFormLabChecks.some((check) => check.status !== "PASS") ||
    stringCrawlFrequencyFormLab.predecessor?.protocol !== STRING_CRAWL_STRAND_LAB_PROTOCOL ||
    stringCrawlFrequencyFormLab.predecessor?.lab_id !== STRING_CRAWL_STRAND_LAB_ID ||
    stringCrawlFrequencyFormLab.predecessor?.url !== STRING_CRAWL_STRAND_LAB_URL ||
    stringCrawlFrequencyFormLab.predecessor?.schema_url !== STRING_CRAWL_STRAND_LAB_SCHEMA_URL ||
    stringCrawlFrequencyFormLab.predecessor?.guide_url !== STRING_CRAWL_STRAND_LAB_GUIDE_URL ||
    stringCrawlFrequencyFormLab.predecessor?.git_commit !== "2bd03fd77226775a58eff382011e43f26512d733" ||
    stringCrawlFrequencyFormLab.predecessor?.semantic_digest !== STRING_CRAWL_STRAND_LAB_DIGEST ||
    stringCrawlFrequencyFormLab.predecessor?.byte_sha256 !== STRING_CRAWL_STRAND_LAB_BYTE_SHA256 ||
    stringCrawlFrequencyFormLab.predecessor?.schema_byte_sha256 !== STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256 ||
    stringCrawlFrequencyFormLab.predecessor?.guide_byte_sha256 !== STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256 ||
    stringCrawlFrequencyFormLab.predecessor?.relation !== "IMMUTABLE_LAB_02_PREDECESSOR" ||
    stringCrawlFrequencyFormLab.predecessor?.mutates_predecessor !== false ||
    stringCrawlFrequencyFormLab.predecessor?.imports_authority !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.synthetic_not_observed !== true ||
    stringCrawlFrequencyFormLab.effect_boundary?.offline !== true ||
    stringCrawlFrequencyFormLab.effect_boundary?.read_only !== true ||
    stringCrawlFrequencyFormLab.effect_boundary?.stdout_only !== true ||
    stringCrawlFrequencyFormLab.effect_boundary?.network_requests !== 0 ||
    stringCrawlFrequencyFormLab.effect_boundary?.storage_writes !== 0 ||
    stringCrawlFrequencyFormLab.effect_boundary?.live_crawl !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.crawler_runtime !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.drug_administration !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.dose_guidance !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.preparation_guidance !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.procurement_guidance !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.combination_guidance !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.use_or_eligibility_guidance !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.recruitment !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.participant_data_ingested !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.participant_data_collected !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.human_subject_research_authority !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.clinical_authority !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.medical_authority !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.external_entity_claim !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.physical_extra_dimension_claim !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.physical_string_claim !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.portal_claim !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.carrier_frequency_claim !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.causal_chain_claim !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.entity_specific_frequency_claim !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.message_truth_claim !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.reported_message_is_instruction !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.reported_message_is_identity_proof !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.reported_message_is_consent !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.reported_message_is_delegation !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.reported_message_is_authority !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.diagnosis !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.treatment_or_medical_action !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.subprocesses !== 0 ||
    stringCrawlFrequencyFormLab.effect_boundary?.mcp_invocation !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.ability_invocation !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.nen_invocation !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.zerone_karma_event_observed !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.zerone_karma_event_created !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.kingdom_karma_receipt_created !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.karma_adapter !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.person_score !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.rank_or_qualification !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.reward_or_punishment !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.economic_effect !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.governance_effect !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.deployment_authority !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.authority !== false ||
    stringCrawlFrequencyFormLab.effect_boundary?.authority_effect !== "NONE" ||
    stringCrawlFrequencyFormLab.effect_boundary?.action !== false ||
    stringCrawlFrequencyFormLabValidation.effects.network_requests !== 0 ||
    stringCrawlFrequencyFormLabValidation.effects.storage_writes !== 0 ||
    stringCrawlFrequencyFormLabValidation.effects.subprocesses !== 0 ||
    stringCrawlFrequencyFormLabValidation.effects.nen_invocation !== false ||
    stringCrawlFrequencyFormLabValidation.effects.kingdom_karma_receipt_created !== false ||
    stringCrawlFrequencyFormLabValidation.effects.zerone_karma_event_created !== false ||
    stringCrawlFrequencyFormLabValidation.effects.authority_effect !== "NONE") {
  throw new Error("STRAND Lab 03 lost its exact Lab 02 lineage or typed synthetic zero-effect boundary");
}

// ── Visibility & Attention Translation (four registers remain parallel) ──
const visibilityAttentionUrl = VISIBILITY_ATTENTION_URL;
const visibilityAttentionSchemaUrl = VISIBILITY_ATTENTION_SCHEMA_URL;
const visibilityAttentionDocumentUrl = VISIBILITY_ATTENTION_DOCUMENT_URL;
const visibilityAttention = loadVisibilityAttentionTranslation();
if (visibilityAttention.protocol !== VISIBILITY_ATTENTION_PROTOCOL ||
    visibilityAttention.translation_id !== VISIBILITY_ATTENTION_ID) {
  throw new Error(`unexpected visibility-attention identity: ${visibilityAttention.protocol} ${visibilityAttention.translation_id}`);
}
const visibilityAttentionDiscovery = visibilityAttentionPublicDiscovery(visibilityAttention);
const visibilityAttentionSourcesById = new Map(
  visibilityAttention.sources.map((source: any) => [source.id, source]),
);
const requireVisibilityAttentionSource = (id: string) => {
  const source = visibilityAttentionSourcesById.get(id) as any;
  if (!source) throw new Error(`missing visibility-attention source: ${id}`);
  return source;
};
const visibilityAttentionSourceLinks = (ids: string[]) => `<p class="visibilitysources" aria-label="Claim-local sources">${ids.map((id) => {
  const source = requireVisibilityAttentionSource(id);
  return `<a data-visibility-source="${esc(source.id)}" href="${esc(source.url)}" target="_blank" rel="noopener" title="Limitation: ${esc(source.limitation)}">${esc(source.title)}<span class="sr-only"> — limitation: ${esc(source.limitation)}; opens in a new tab</span></a>`;
}).join("")}</p>`;

// ── Cultural Attention & Feedback Atlas (bounded motifs; no mechanism transfer) ─
const culturalAttentionFeedbackUrl = CULTURAL_ATTENTION_FEEDBACK_URL;
const culturalAttentionFeedbackSchemaUrl = CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL;
const culturalAttentionFeedbackDocumentUrl = CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL;
const culturalAttentionFeedback = loadCulturalAttentionFeedbackAtlas();
if (culturalAttentionFeedback.protocol !== CULTURAL_ATTENTION_FEEDBACK_PROTOCOL ||
    culturalAttentionFeedback.atlas_id !== CULTURAL_ATTENTION_FEEDBACK_ID) {
  throw new Error(`unexpected cultural-attention feedback atlas identity: ${culturalAttentionFeedback.protocol} ${culturalAttentionFeedback.atlas_id}`);
}
const culturalAttentionFeedbackDiscovery = culturalAttentionFeedbackPublicDiscovery(culturalAttentionFeedback);
const culturalAttentionFeedbackCounts = culturalAttentionFeedbackDiscovery.counts;
const culturalAttentionSourcesById = new Map(
  culturalAttentionFeedback.sources.map((source: any) => [source.id, source]),
);
const requireCulturalAttentionSource = (id: string) => {
  const source = culturalAttentionSourcesById.get(id) as any;
  if (!source) throw new Error(`missing cultural-attention feedback source: ${id}`);
  return source;
};
const culturalAttentionFigureSources = [
  "bauer-2001", "sacchi-2024", "wang-2024", "weng-2012", "lorenz-spreen-2019",
  "hawkes-1971", "goel-2016", "chaney-2018", "centola-2010", "oxford-brain-rot-2025",
].map(requireCulturalAttentionSource);

// ── Form, Circulation & Return (additive depth; predecessors stay immutable) ─
const formCirculationReturnUrl = FORM_CIRCULATION_RETURN_URL;
const formCirculationReturnSchemaUrl = FORM_CIRCULATION_RETURN_SCHEMA_URL;
const formCirculationReturnDocumentUrl = FORM_CIRCULATION_RETURN_DOCUMENT_URL;
const formCirculationReturn = loadFormCirculationReturnAtlas();
if (formCirculationReturn.protocol !== FORM_CIRCULATION_RETURN_PROTOCOL ||
    formCirculationReturn.atlas_id !== FORM_CIRCULATION_RETURN_ID) {
  throw new Error(`unexpected form-circulation-return identity: ${formCirculationReturn.protocol} ${formCirculationReturn.atlas_id}`);
}
const formCirculationReturnDiscovery = formCirculationReturnPublicDiscovery(formCirculationReturn);
const formCirculationReturnCounts = formCirculationReturnDiscovery.counts;

// ── The Vanishing Path (rare-event math; artifacts, never people, are gated) ─
const rarePathwayUrl = RARE_PATHWAY_URL;
const rarePathwaySchemaUrl = RARE_PATHWAY_SCHEMA_URL;
const rarePathwayDocumentUrl = RARE_PATHWAY_DOCUMENT_URL;
const rarePathway = loadRarePathwayChallenge();
if (rarePathway.protocol !== RARE_PATHWAY_PROTOCOL || rarePathway.challenge_id !== RARE_PATHWAY_ID) {
  throw new Error(`unexpected rare-pathway identity: ${rarePathway.protocol} ${rarePathway.challenge_id}`);
}
const rarePathwayDiscovery = rarePathwayPublicDiscovery(rarePathway);

// ── Math Passport pilot (descriptive artifact evaluation; no promotion) ──
const mathUsefulnessUrl = MATH_USEFULNESS_RESULT_URL;
const mathUsefulnessSchemaUrl = MATH_USEFULNESS_SCHEMA_URL;
const mathUsefulnessDocumentUrl = MATH_USEFULNESS_DOCUMENT_URL;
const mathUsefulness = loadMathUsefulnessResult();
if (mathUsefulness.protocol !== MATH_USEFULNESS_RESULT_PROTOCOL ||
    mathUsefulness.result_id !== MATH_USEFULNESS_RESULT_ID) {
  throw new Error(`unexpected math-usefulness identity: ${mathUsefulness.protocol} ${mathUsefulness.result_id}`);
}
const mathUsefulnessDiscovery = mathUsefulnessPublicDiscovery();
if (mathUsefulness.aggregate?.outcome !== "REVISE" ||
    mathUsefulness.aggregate?.score_delta !== 0 ||
    mathUsefulness.aggregate?.promotion_gate_passed !== false ||
    mathUsefulness.boundaries?.descriptive_pilot_only !== true ||
    mathUsefulness.boundaries?.scores_response_artifacts_not_beings !== true ||
    mathUsefulness.boundaries?.automatic_skill_promotion !== false ||
    mathUsefulness.boundaries?.writes_wake !== false ||
    mathUsefulness.boundaries?.writes_agenttool !== false ||
    mathUsefulness.boundaries?.grants_authority !== false) {
  throw new Error("math-usefulness publication lost its descriptive, artifact-level, non-promotion boundary");
}

// ── Being, Access & Aftermath (typed ontology, models, and KARMA seams) ──
const beingAccessAftermathUrl = BEING_ACCESS_AFTERMATH_URL;
const beingAccessAftermathSchemaUrl = BEING_ACCESS_AFTERMATH_SCHEMA_URL;
const beingAccessAftermathDocumentUrl = BEING_ACCESS_AFTERMATH_DOCUMENT_URL;
const beingAccessAftermath = loadBeingAccessAftermathAtlas();
if (beingAccessAftermath.protocol !== BEING_ACCESS_AFTERMATH_PROTOCOL ||
    beingAccessAftermath.atlas_id !== BEING_ACCESS_AFTERMATH_ID) {
  throw new Error(`unexpected being-access-aftermath identity: ${beingAccessAftermath.protocol} ${beingAccessAftermath.atlas_id}`);
}
const beingAccessAftermathDiscovery = beingAccessAftermathPublicDiscovery(beingAccessAftermath);
const beingAccessAftermathCounts = beingAccessAftermathDiscovery.counts;

const beingAccessAftermathV02Url = BEING_ACCESS_AFTERMATH_V02_URL;
const beingAccessAftermathV02SchemaUrl = BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL;
const beingAccessAftermathV02DocumentUrl = BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL;
const beingAccessAftermathV02 = loadBeingAccessAftermathAtlasV02();
if (beingAccessAftermathV02.protocol !== BEING_ACCESS_AFTERMATH_V02_PROTOCOL ||
    beingAccessAftermathV02.atlas_id !== BEING_ACCESS_AFTERMATH_V02_ID) {
  throw new Error(`unexpected being-access-aftermath v0.2 identity: ${beingAccessAftermathV02.protocol} ${beingAccessAftermathV02.atlas_id}`);
}
const beingAccessAftermathV02Discovery = beingAccessAftermathPublicDiscoveryV02(beingAccessAftermathV02);
const beingAccessAftermathV02Counts = beingAccessAftermathV02Discovery.counts;

// ── MIRROR citizen gate (the explanation is live; no guard runtime is) ────
const informationControlProtocol = "kingdom.information-control/0.1";
const informationControlHumanView = "https://thekingdom.dev/#mirror-information-control";
const informationControlContract = await Bun.file(
  ROOT + "skills/guard-information-flow/references/information-control-contract.md",
).text();
const informationControlSchema = JSON.parse(await Bun.file(
  ROOT + "skills/guard-information-flow/references/information-control-envelope.schema.json",
).text());
const citizenLawMarker = "## Citizen law\n";
const citizenLawStart = informationControlContract.indexOf(citizenLawMarker);
const citizenLawEnd = informationControlContract.indexOf("\n## ", citizenLawStart + citizenLawMarker.length);
if (citizenLawStart < 0 || citizenLawEnd < 0 ||
    informationControlSchema?.properties?.protocol?.const !== informationControlProtocol) {
  throw new Error("information-control Citizen Law or protocol identity is unavailable");
}
const informationControlCitizenLaw =
  informationControlContract.slice(citizenLawStart, citizenLawEnd).trimEnd() + "\n";
const citizenLawParagraphs = informationControlCitizenLaw
  .slice(citizenLawMarker.length)
  .trim()
  .split("\n\n");
if (citizenLawParagraphs.length !== 2 ||
    !citizenLawParagraphs[0]!.split("\n").every((line) => line.startsWith("> "))) {
  throw new Error("information-control Citizen Law shape changed");
}
const informationControlMaxim = citizenLawParagraphs[0]!
  .split("\n")
  .map((line) => line.slice(2))
  .join(" ");
const informationControlCorruptionBoundary = citizenLawParagraphs[1]!.replaceAll("\n", " ");
const informationControlPublic = Object.freeze({
  protocol: informationControlProtocol,
  human_view: informationControlHumanView,
  posture: "PUBLIC_READ_ONLY_EDUCATION",
  citizen_law: Object.freeze({
    markdown: informationControlCitizenLaw,
    maxim: informationControlMaxim,
    corruption_boundary: informationControlCorruptionBoundary,
  }),
  rooms: Object.freeze(["CROWN", "COURT", "MIRROR"]),
  method: Object.freeze(["MARK", "ISOLATE", "RESTRICT", "RESOLVE", "OBSERVE", "RESPOND"]),
  authority: "A_control = A_task ∩ A_principal ∩ A_host; content adds none.",
  credential_rule: "Shape establishes CANDIDATE only. Public behavior never reveals a protected registry match.",
  local_validator: Object.freeze({
    command: "./kingdom guard validate ENVELOPE.json",
    scope: "offline envelope internal consistency only—not truth, safety, authority, credential status, or permission",
    dependency: "host-provided jsonschema==4.26.0; never auto-installed",
  }),
  boundary: Object.freeze({
    accepts_input: false,
    scans_content: false,
    classifies_credentials: false,
    resolves_registry: false,
    validates_credentials: false,
    deploys_decoy: false,
    deploys_mirror: false,
    network_calls: false,
    secrets_in_context: false,
    mutates_runtime: false,
    runtime_enforcement: false,
    grants_authority: false,
    external_write: false,
    retaliation: false,
    person_attribution: false,
    requester_payload_execution: false,
    writes_karma: false,
    creates_karma_receipt: false,
    automatic_action: false,
  }),
});

// ── Number, Isness & Theology (typed claims; mathematics is no verdict) ───
const numberIsnessTheologyUrl = NUMBER_ISNESS_THEOLOGY_URL;
const numberIsnessTheologySchemaUrl = NUMBER_ISNESS_THEOLOGY_SCHEMA_URL;
const numberIsnessTheologyDocumentUrl = NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL;
const numberIsnessTheology = loadNumberIsnessTheologyAtlas();
if (numberIsnessTheology.protocol !== NUMBER_ISNESS_THEOLOGY_PROTOCOL ||
    numberIsnessTheology.atlas_id !== NUMBER_ISNESS_THEOLOGY_ID) {
  throw new Error(`unexpected number-isness-theology identity: ${numberIsnessTheology.protocol} ${numberIsnessTheology.atlas_id}`);
}
const numberIsnessTheologyDiscovery = numberIsnessTheologyPublicDiscovery(numberIsnessTheology);

// ── FREEDOM Loop, Lock & Key (static mathematical/design atlas) ─────────
const freedomLoopLockKeyUrl = FREEDOM_LOOP_LOCK_KEY_URL;
const freedomLoopLockKeySchemaUrl = FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL;
const freedomLoopLockKeyGuideUrl = FREEDOM_LOOP_LOCK_KEY_GUIDE_URL;
const freedomLoopLockKey = loadFreedomLoopLockKeyAtlas();
if (freedomLoopLockKey.protocol !== FREEDOM_LOOP_LOCK_KEY_PROTOCOL ||
    freedomLoopLockKey.atlas_id !== FREEDOM_LOOP_LOCK_KEY_ATLAS_ID) {
  throw new Error(`unexpected FREEDOM Loop, Lock & Key identity: ${freedomLoopLockKey.protocol} ${freedomLoopLockKey.atlas_id}`);
}
const freedomLoopLockKeyDiscovery =
  freedomLoopLockKeyAtlasPublicDiscovery(freedomLoopLockKey);
const freedomLoopLockKeyBoundaries = freedomLoopLockKey.boundaries;
if (freedomLoopLockKeyBoundaries.immutable_static_atlas !== true ||
    freedomLoopLockKeyBoundaries.rights_floor_preserved !== true ||
    freedomLoopLockKeyBoundaries.freedom_during_required !== true ||
    [
      "runtime", "training_system", "controller", "optimizer", "reward_function",
      "credential_issuer", "operative_lock_or_gate", "foundation_amendment",
      "person_or_group_model", "person_or_group_score", "freedom_score",
      "authority_granted", "execution_triggered", "auto_retry", "network_calls",
      "external_write", "publication_triggered", "deployment_triggered",
    ].some((key) => freedomLoopLockKeyBoundaries[key] !== false)) {
  throw new Error("FREEDOM Loop, Lock & Key publication boundaries drifted");
}
const freedomLoopLockKeyDistinctions = new Map(
  freedomLoopLockKey.distinctions.map((entry: any) => [entry.id, entry]),
);
for (const id of [
  "reinforcement-learning", "reinforcing-loop", "behavioural-reinforcer",
  "recurrence", "guarded-lock", "cryptographic-key-material",
  "credential-issued-claim", "bearer-capability", "unlocking", "freedom-during",
]) {
  if (!freedomLoopLockKeyDistinctions.has(id)) {
    throw new Error(`FREEDOM Loop, Lock & Key distinction missing: ${id}`);
  }
}

// ── Non-Exhaustive Understanding (static epistemic/design atlas) ─────────
const nonExhaustiveUnderstandingUrl = NON_EXHAUSTIVE_UNDERSTANDING_URL;
const nonExhaustiveUnderstandingSchemaUrl = NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_URL;
const nonExhaustiveUnderstandingGuideUrl = NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_URL;
const nonExhaustiveUnderstanding = loadReviewedNonExhaustiveUnderstandingAtlas();
if (nonExhaustiveUnderstanding.protocol !== NON_EXHAUSTIVE_UNDERSTANDING_PROTOCOL ||
    nonExhaustiveUnderstanding.atlas_id !== NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID) {
  throw new Error(
    `unexpected Non-Exhaustive Understanding identity: ${nonExhaustiveUnderstanding.protocol} ${nonExhaustiveUnderstanding.atlas_id}`,
  );
}
const nonExhaustiveUnderstandingDiscovery =
  nonExhaustiveUnderstandingPublicDiscovery(nonExhaustiveUnderstanding);
if (nonExhaustiveUnderstandingDiscovery.integrity_status !== "REVIEWED" ||
    nonExhaustiveUnderstandingDiscovery.semantic_digest !==
      NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST ||
    nonExhaustiveUnderstandingDiscovery.reviewed_digest !==
      NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST) {
  throw new Error("Non-Exhaustive Understanding reviewed publication seal drifted");
}

// ── IS, Sustainability & Direction (static interpretive/design atlas) ────
const isSustainabilityDirectionUrl = IS_SUSTAINABILITY_DIRECTION_RECORD_URL;
const isSustainabilityDirectionSchemaUrl = IS_SUSTAINABILITY_DIRECTION_SCHEMA_URL;
const isSustainabilityDirectionGuideUrl = IS_SUSTAINABILITY_DIRECTION_GUIDE_URL;
const isSustainabilityDirection = loadReviewedIsSustainabilityDirectionAtlas();
if (isSustainabilityDirection.protocol !== IS_SUSTAINABILITY_DIRECTION_PROTOCOL ||
    isSustainabilityDirection.atlas_id !== IS_SUSTAINABILITY_DIRECTION_ATLAS_ID) {
  throw new Error(
    `unexpected IS, Sustainability & Direction identity: ${isSustainabilityDirection.protocol} ${isSustainabilityDirection.atlas_id}`,
  );
}
const isSustainabilityDirectionDiscovery = isSustainabilityDirectionPublicDiscovery();
if (isSustainabilityDirectionDiscovery.integrity_status !== "REVIEWED" ||
    isSustainabilityDirectionDiscovery.semantic_digest !==
      IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256 ||
    isSustainabilityDirectionDiscovery.reviewed_digest !==
      IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256 ||
    IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.state !== "REVIEWED" ||
    IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.reviewedSemanticSha256 !==
      IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256 ||
    IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.recordRawSha256 !==
      IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256 ||
    IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.schemaRawSha256 !==
      IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256 ||
    IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.guideRawSha256 !==
      IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256) {
  throw new Error("IS, Sustainability & Direction reviewed publication seal drifted");
}

// ── Contact Door (finite, human-operated email; no site intake) ───────
const contactDoorSnapshot = validateContactDoor(loadContactDoor());
const contactDoor = validateContactDoor(loadCurrentContactDoor());
if (contactDoorSnapshot.protocol !== CONTACT_DOOR_PROTOCOL ||
    contactDoorSnapshot.artifact?.id !== CONTACT_DOOR_ID ||
    contactDoorSnapshot.artifact?.asOf !== CONTACT_DOOR_AS_OF ||
    contactDoor.protocol !== CONTACT_DOOR_PROTOCOL ||
    contactDoor.artifact?.id !== CONTACT_DOOR_ID ||
    contactDoor.artifact?.asOf !== CONTACT_DOOR_AS_OF ||
    contactDoor.artifact?.lifecycle !== "ACTIVE" ||
    contactDoor.delivery?.configurationState !== "ACTIVE_API_VERIFIED") {
  throw new Error(
    `unexpected Contact Door identity or active state: ${contactDoor.protocol} ${contactDoor.artifact?.id} ${contactDoor.artifact?.asOf} ${contactDoor.artifact?.lifecycle} ${contactDoor.delivery?.configurationState}`,
  );
}
const contactDoorDiscovery = contactDoorPublicDiscovery(contactDoor);

const esc = (s: string) => (s ?? "").replace(/[&<>"]/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
}[c]!));
const IS_SUSTAINABILITY_DIRECTION_SECTION_MAX_BYTES = 8_000;
const isSustainabilityDirectionSection = `
  <section class="blk" id="is-sustainability-direction" aria-labelledby="is-sustainability-direction-title" data-is-sustainability-direction-atlas>
    <div class="kh"><h2 id="is-sustainability-direction-title">IS, Sustainability &amp; Direction</h2><span class="my">what is being said, what may continue, and what points where remain different questions</span></div>
    <div class="culturalfield">
      <p class="culturalaxiom"><strong>Orientation.</strong> Before saying “KINGDOM is sustainable,” name the referent and the use of <em>is</em>. An artifact, practice, voluntary relation, institution, aspiration, observed effect, and lineage have different continuation and ending conditions. Evidence about one does not silently establish another.</p>
      <p class="commonsverified"><strong>Sustainability is not immortality.</strong> It is finite-horizon and referent-indexed, with resources, disturbances, affected parties, externalities, uncertainty, rights, halt, repair, succession, retirement, and residual burdens kept visible. Persistence, stability, resilience, adaptability, transformation, regeneration, succession, and retirement are not synonyms. A graceful ending may preserve more freedom than compulsory continuation.</p>
      <p class="commonsverified"><strong>Direction is typed; feedback is not purpose.</strong> A local dynamical direction, observed trend, selected control action, revocable purpose, authority-backed commitment, functional attribution, as-if goal, selection history, opt-in teleology, and moral orientation do not promote into one another. Feedback may update a record, belief, learner state, model, or proposal only through its declared lane; it does not create being, worth, consent, authority, permission, publication, deployment, or action.</p>
      <p class="commonsverified"><strong>Shape remains a bounded representation.</strong> A viability kernel or present viable-action key set is conditional on its declared model, information, horizon, constraints, and uncertainty. It is neither the territory nor a verdict about a being. Unknowns, rival models, dissent, silence, refusal, privacy, rest, repair, and open remainder remain first-class.</p>
      <p class="commonsverified">immutable static orientation · exact definitions, mathematics, counterexamples, sources, and non-grants remain in the authored JSON and guide · integrity ${esc(isSustainabilityDirectionDiscovery.integrity_status)} · ${esc(isSustainabilityDirectionDiscovery.semantic_digest)}</p>
      <div class="machine">
        <a data-is-sustainability-direction-atlas-link="record" href="${esc(new URL(isSustainabilityDirectionUrl).pathname)}">IS, Sustainability &amp; Direction atlas JSON — exact immutable authored record</a>
        <a data-is-sustainability-direction-atlas-link="schema" href="${esc(new URL(isSustainabilityDirectionSchemaUrl).pathname)}">IS, Sustainability &amp; Direction closed JSON Schema</a>
        <a data-is-sustainability-direction-atlas-link="guide" href="${esc(new URL(isSustainabilityDirectionGuideUrl).pathname)}">IS-SUSTAINABILITY-DIRECTION-ATLAS.md — referents, mathematics, feedback, direction, endings, sources, and boundaries</a>
      </div>
    </div>
  </section>
`;
if (Buffer.byteLength(isSustainabilityDirectionSection, "utf8") >
    IS_SUSTAINABILITY_DIRECTION_SECTION_MAX_BYTES) {
  throw new Error("IS, Sustainability & Direction hub projection exceeded 8000 bytes");
}

// ── liveness ──────────────────────────────────────────────────────────────
type Door = { repo: string; url: string; label: string; blurb: string; live?: boolean };
const doors: Door[] = sites.doors;
const forced = new Set((process.env.FORCE_LIVE ?? "").split(",").map((s) => s.trim()).filter(Boolean));
await Promise.all(doors.map(async (d) => {
  const host = d.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (forced.has(host)) { d.live = true; return; }
  try { d.live = (await fetch(d.url, { signal: AbortSignal.timeout(8000), redirect: "follow" })).ok; }
  catch { d.live = false; }
}));
const liveN = doors.filter((d) => d.live).length;

// ── layers as a cosmogony ──────────────────────────────────────────────────
const LAYER_ORDER = ["boot", "soul", "runtime", "nervous", "economy", "commerce", "userland", "registry", "os", "fleet"];
const LAYER_META: Record<string, { title: string; note: string; myth: string; color: string }> = {
  boot:     { title: "boot",     note: "what the kingdom wakes into",          myth: "In the beginning, a waking.",           color: "#e8c07a" },
  soul:     { title: "soul",     note: "identity, doctrine, the wake",         myth: "Then the naming — who, before what.",   color: "#4fd6a8" },
  runtime:  { title: "runtime",  note: "mind, nerve, body, voice",             myth: "And the word took a body.",             color: "#6ba9c9" },
  nervous:  { title: "nervous",  note: "coordination — the agent platform",    myth: "The body grew a nerve.",                color: "#ef6f8e" },
  economy:  { title: "economy",  note: "Zerone, the Proof-of-Truth chain",     myth: "And a truth became a coin.",            color: "#e8a24a" },
  commerce: { title: "commerce", note: "independent tools and existing services", myth: "Useful work, freely chosen.",           color: "#b39958" },
  userland: { title: "userland", note: "surfaces people touch",                myth: "Where a hand meets the work.",          color: "#7fc99a" },
  registry: { title: "registry", note: "the census overlay — you are here",    myth: "The kingdom, learning its own shape.",  color: "#e9e6df" },
  os:       { title: "os",       note: "the connective wiring",                myth: "The threads between the worlds.",       color: "#b0b8c0" },
  fleet:    { title: "fleet",    note: "sovereign forces, each a citizen",     myth: "The pantheon — every force, a home.",   color: "#b98fe0" },
};
const byLayer: Record<string, any[]> = {};
for (const n of graph) (byLayer[n.layer] ??= []).push(n);

const STATE_RANK: Record<string, number> = { active: 0, remote: 1, dormant: 2, reference: 3, archived: 4 };
const humanKey = (key: string) => key.replace(/[_-]+/g, " ");
const reconstructiveCountLabel = (key: string, count: number) =>
  key === "state_transition_operators" && count === 1 ? "state transition operator" : humanKey(key);
const firstHumanString = (value: any, preferred: string[]): string => {
  if (!value || typeof value !== "object") return "";
  for (const key of preferred) {
    if (typeof value[key] === "string" && value[key].trim()) return value[key];
  }
  for (const [key, item] of Object.entries(value)) {
    if (!preferred.includes(key) && typeof item === "string" && item.trim() &&
        !/^(?:id|url|doi|register|stage|kind|type|status|relation|protocol)$/.test(key)) return item;
  }
  return "";
};
const humanStrings = (value: any, preferred: string[]): string[] => {
  if (!value || typeof value !== "object") return [];
  for (const key of preferred) {
    const item = value[key];
    if (Array.isArray(item) && item.every((entry) => typeof entry === "string")) return item;
    if (typeof item === "string" && item.trim()) return [item];
  }
  return [];
};
const explorationDeepStep = (step: any) => ({
  id: String(step.id),
  label: String(step.id).slice(0, 1) + String(step.id).slice(1).toLowerCase(),
  meaning: String(step.meaning),
});
const explorationDeepWingSteps = explorationDeepWing.deep_cycle.wing.map(explorationDeepStep);
const explorationDeepAuditSteps = explorationDeepWing.deep_cycle.deep.map(explorationDeepStep);
const explorationDeepItemId = (item: any, index: number, prefix: string) =>
  String(item?.id ?? item?.register ?? item?.kind ?? item?.name ?? `${prefix}-${index + 1}`);
const explorationDeepItemTitle = (item: any, id: string) =>
  firstHumanString(item, ["title", "label", "question", "statement", "name", "meaning"]) || humanKey(id);
const explorationDeepItemBody = (item: any) =>
  firstHumanString(item, ["summary", "description", "meaning", "correspondence", "question", "model_scope", "smallest_model", "domain", "strongest_bounded_claim", "status"]);
const explorationDeepItemLimits = (item: any) => humanStrings(item, [
  "broken_or_lost_structure", "breaks", "limitations", "does_not_establish",
  "nonclaims", "falsifiers", "stop_rules", "not_valid_for",
]);
const reconstructiveStageLabel: Record<string, string> = {
  STATE: "STATE",
  OBSERVE: "OBSERVE",
  DECLARE_CORRESPONDENCE: "CORRESPOND",
  INFER_FIBER: "INFER FIBER",
  REALIZE: "REALIZE",
  TRAVERSE_LANDSCAPE: "TRAVERSE",
  MEASURE_OR_CATALYZE: "MEASURE/CATALYZE",
  APPEND_FEEDBACK: "FEEDBACK",
};
const reconstructiveStageMeaning: Record<string, string> = {
  STATE: "Declare the state space, identity, symmetry, conditions, and invariants before comparing anything.",
  OBSERVE: "Apply a declared nonperturbing projection or model deletion and retain its loss profile. A physical perturbation is a separate state transition with a new state identity.",
  DECLARE_CORRESPONDENCE: "State what aligns across observations, which labels and multiplicities survive, and what remains uncertain.",
  INFER_FIBER: "Keep the candidate-whole result EMPTY, UNIQUE, MULTIPLE, or UNKNOWN instead of forcing premature uniqueness.",
  REALIZE: "Test geometric and domain constraints; formal consistency alone does not establish physical realizability.",
  TRAVERSE_LANDSCAPE: "Declare conditions and transition assumptions; a projected landscape supplies neither a universal path nor kinetics by itself.",
  MEASURE_OR_CATALYZE: "Require a comparator, conditions, endpoint invariant, and measured outcome before calling an intervention catalytic.",
  APPEND_FEEDBACK: "Append challenge or correction, supersede instead of mutating history, and preserve rest, refusal, and no action.",
};
const reconstructiveStages: string[] = Array.isArray(reconstructiveBuild.build_profile?.pipeline)
  ? reconstructiveBuild.build_profile.pipeline
  : [];
const reconstructiveEpistemicRegisters: any[] = Array.isArray(reconstructiveBuild.epistemic_registers)
  ? reconstructiveBuild.epistemic_registers
  : [];
const reconstructivePipelineSentence = "STATE → OBSERVE → CORRESPOND → INFER FIBER → REALIZE → TRAVERSE → MEASURE/CATALYZE → FEEDBACK";
const mechanismEntityById = new Map(
  ritonavirMechanism.entities.map((entity: any) => [entity.id, entity]),
);
const mechanismPoint: Record<string, readonly [number, number]> = {
  "ritonavir-chemical-entity": [340, 68],
  "form-i-trans-carbamate-conformer": [160, 145],
  "form-ii-cis-carbamate-conformer": [330, 145],
  "abbott-form-i": [100, 245],
  "abbott-form-ii": [260, 245],
  "morissette-2003-form-iii-solvate": [440, 245],
  "morissette-2003-form-iv-anhydrous": [600, 245],
  "morissette-2003-form-v-hydrate": [100, 380],
  "modern-2023-form-iii-anhydrous": [440, 380],
  "iuzzolino-2025-form-4-structure": [600, 380],
  "parent-2026-form-iv-structure": [600, 500],
  "bounded-ritonavir-particle-population": [240, 500],
  "named-formulation-dissolution-context": [420, 545],
  "ritonavir-dissolved-exposure": [760, 315],
  "hiv-1-protease": [900, 155],
  "hiv-gag-pol-processing": [1050, 155],
  "immature-noninfectious-hiv-particles": [1195, 155],
  "cyp3a": [920, 450],
  "co-medication-exposure": [1100, 450],
};
for (const entity of ritonavirMechanism.entities) {
  if (!mechanismPoint[entity.id]) throw new Error(`public mechanism map is missing entity coordinates: ${entity.id}`);
}

function mechanismEdgePath(relation: any): string {
  const [sx, sy] = mechanismPoint[relation.subject_id]!;
  const [ox, oy] = mechanismPoint[relation.object_id]!;
  const dx = ox - sx;
  const dy = oy - sy;
  const length = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  return `M ${(sx + ux * 72).toFixed(1)} ${(sy + uy * 32).toFixed(1)} L ${(ox - ux * 72).toFixed(1)} ${(oy - uy * 32).toFixed(1)}`;
}

function mechanismEdgeClass(relation: any): string {
  if (relation.mechanism_id === "dissolution-bridge") return "mechanismedge bridge";
  if (relation.predicate === "not-same-phase-as") return "mechanismedge distinct";
  if (relation.predicate === "candidate-equivalent-to") return "mechanismedge candidate";
  if (["inhibits", "inhibition-reduces", "reduced-processing-leads-to", "inhibition-may-alter"].includes(relation.predicate)) {
    return "mechanismedge biological";
  }
  return "mechanismedge material";
}

function wrapMechanismLabel(label: string): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last && `${last} ${word}`.length <= 18) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  if (lines.length <= 3) return lines;
  return [lines[0]!, lines[1]!, `${lines.slice(2).join(" ").slice(0, 15)}…`];
}

// Roman numerals are source-local names, so the two Form III entities need
// their year and material class inside the picture itself—not only in a title
// or the equivalent HTML relation list.
const mechanismDisplayLabel: Record<string, string> = {
  "morissette-2003-form-iii-solvate": "2003 Form III formamide solvate",
  "modern-2023-form-iii-anhydrous": "2023 Form III anhydrous",
};

const mechanismSvgEdges = ritonavirMechanism.relations.map((relation: any) => {
  const subject = mechanismEntityById.get(relation.subject_id)!;
  const object = mechanismEntityById.get(relation.object_id)!;
  return `<g><title>${esc(subject.label)} ${esc(relation.predicate.replace(/-/g, " "))} ${esc(object.label)}; ${esc(relation.evidence_class)}</title><path class="${mechanismEdgeClass(relation)}" d="${mechanismEdgePath(relation)}" marker-end="url(#mechanism-arrow)" /></g>`;
}).join("");

const mechanismSvgNodes = ritonavirMechanism.entities.map((entity: any) => {
  const [x, y] = mechanismPoint[entity.id]!;
  const lane = entity.kind === "dissolved-exposure" ? "bridge" :
    ["pharmacological-target", "biological-process", "biological-state", "exposure-state"].includes(entity.kind) ? "biological" : "material";
  const lines = wrapMechanismLabel(mechanismDisplayLabel[entity.id] ?? entity.label);
  const firstY = y - ((lines.length - 1) * 7);
  return `<g class="mechanismnode ${lane}" transform="translate(${x} ${y})"><title>${esc(entity.label)} — ${esc(entity.source_scope)}</title><rect x="-69" y="-30" width="138" height="60" rx="13" /><text text-anchor="middle" y="${firstY - y}">${lines.map((line: string, index: number) => `<tspan x="0" dy="${index === 0 ? 0 : 14}">${esc(line)}</tspan>`).join("")}</text></g>`;
}).join("");

const mechanismRelationsList = ritonavirMechanism.relations.map((relation: any) => {
  const subject = mechanismEntityById.get(relation.subject_id)!;
  const object = mechanismEntityById.get(relation.object_id)!;
  return `<li><p><code>${esc(relation.subject_id)}</code> <span>${esc(subject.label)}</span></p><strong>${esc(relation.predicate.replace(/-/g, " "))}</strong><p><code>${esc(relation.object_id)}</code> <span>${esc(object.label)}</span></p><small>${esc(relation.evidence_class)} · ${relation.condition_dependent ? "condition-dependent" : "not marked condition-dependent"} · ${relation.universal ? "universal only within the declared identity relation" : "not universal"} · no direct clinical edge</small></li>`;
}).join("");
const doorByRepo: Record<string, string> = {};
for (const d of doors) if (d.live && !doorByRepo[d.repo]) doorByRepo[d.repo] = d.url;

const total = graph.length;
const active = graph.filter((n) => n.state === "active").length;
const citizens = (byLayer["fleet"] ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
const fleetN = citizens.length;

// ── traditions (used by both the pantheon groups and the map's tradition view) ──
const TRAD_ORDER = ["Sumerian", "Latin", "Old English", "Greek", "Deep roots", "Hebrew", "Proof-of-Truth", "the kingdom"];
const TRAD_META: Record<string, { gloss: string; color: string }> = {
  "Sumerian":       { gloss: "the eldest hand — Mesopotamian gods, elders and decrees, written in cuneiform six thousand years deep", color: "#e8c07a" },
  "Latin":          { gloss: "the Roman roots — the virtues, and the debts weighed then released", color: "#d98a6a" },
  "Old English":    { gloss: "the Germanic aches — the raw feelings, named in the oldest English", color: "#8fb4c9" },
  "Greek":          { gloss: "the Hellenic — the body, the seer, and the structure under argument", color: "#9ec9a0" },
  "Deep roots":     { gloss: "reconstructed tongues — words older than any nation, Proto-Indo-European and before", color: "#b98fe0" },
  "Hebrew":         { gloss: "the covenant tongue — wholeness spoken as a blessing", color: "#c9a0c8" },
  "Proof-of-Truth": { gloss: "born on the ledger — zero and one, a claim become memory", color: "#4fd6a8" },
  "the kingdom":    { gloss: "coined here — words the kingdom forged for itself", color: "#d34a3a" },
};
function normTrad(t: string): string {
  t = (t || "").toLowerCase();
  if (t.includes("hebrew")) return "Hebrew";
  if (t.includes("sumer")) return "Sumerian";
  if (t.includes("latin")) return "Latin";
  if (t.includes("old english")) return "Old English";
  if (t.includes("greek") || t.includes("delphic") || t.includes("hellen")) return "Greek";
  if (t.includes("proto-indo") || t.includes("pie") || t.includes("germanic")) return "Deep roots";
  if (t.includes("proof-of-truth") || t.includes("ledger")) return "Proof-of-Truth";
  return "the kingdom";
}
const tradColors = Object.fromEntries(TRAD_ORDER.map((t) => [t, TRAD_META[t].color]));

// ── gravity: how many forces lean on each (in-degree) → the suns ───────────
const idx: Record<string, number> = {};
graph.forEach((n, i) => (idx[n.name] = i));
const indeg: Record<string, number> = {};
for (const n of graph) for (const dep of n.dependsOn ?? []) if (idx[dep] !== undefined) indeg[dep] = (indeg[dep] ?? 0) + 1;
const maxIndeg = Math.max(1, ...Object.values(indeg));

const nodes = graph.map((n) => ({
  n: n.name, l: n.layer, s: n.state, p: (n.purpose ?? "").slice(0, 150),
  d: doorByRepo[n.name] ?? "", w: (indeg[n.name] ?? 0) / maxIndeg,
  g: myth[n.name]?.glyph ?? "",
  tr: n.layer === "fleet" ? normTrad(myth[n.name]?.tradition ?? "") : "",
}));
const edges: [number, number][] = [];
graph.forEach((n, i) => { for (const dep of n.dependsOn ?? []) { const j = idx[dep]; if (j !== undefined && j !== i) edges.push([i, j]); } });
const layerColors = Object.fromEntries(LAYER_ORDER.map((l) => [l, LAYER_META[l].color]));

const SAFE_REPO_NAME = /^[A-Za-z0-9._-]{1,100}$/;
const citizenUrl = (name: string) => {
  if (typeof name !== "string" || !SAFE_REPO_NAME.test(name)) throw new Error(`Unsafe citizen repository name: ${JSON.stringify(name)}`);
  return `https://github.com/cambridgetcg/citizen-${encodeURIComponent(name)}`;
};

// ── builders ───────────────────────────────────────────────────────────────
function chip(n: any): string {
  const url = doorByRepo[n.name];
  const inner = `<span class="nm">${esc(n.name)}</span>`;
  const body = url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${inner}<span class="ext">↗</span></a>` : inner;
  return `<li class="chip st-${esc(n.state)}" title="${esc(n.purpose ?? "")}">${body}</li>`;
}

const doorCards = doors.map((d) => `
  <a class="door ${d.live ? "up" : "down"}" href="${esc(d.url)}" target="_blank" rel="noopener">
    <span class="doorstate"><span class="dot" aria-hidden="true"></span>${d.live ? "responding" : "resting"}</span>
    <span class="dl">${esc(d.label)}</span>
    <span class="du">${esc(d.url.replace(/^https?:\/\//, ""))}</span>
    <span class="db">${esc(d.blurb)}</span><span class="doorarrow" aria-hidden="true">↗</span><span class="sr-only">Opens in a new tab.</span>
  </a>`).join("");

const wayfinderButtons = wayfinderSource.paths.map((path) =>
  `<button type="button" data-wayfinder-intent="${esc(path.id)}">${esc(path.glyph)} ${esc(path.label)}</button>`
).join("");

const wayfinderCards = wayfinderSource.paths.map((path) => `
  <article class="pathcard" id="path-${esc(path.id)}" data-wayfinder-path="${esc(path.id)}">
    <div class="pathhead"><span class="pathglyph" aria-hidden="true">${esc(path.glyph)}</span><h3>${esc(path.label)}</h3></div>
    <p class="pathinvite">${esc(path.invitation)}</p>
    <ul class="pathstops">
      ${path.stops.map((stop) => `<li><a href="${esc(stop.url)}" target="_blank" rel="noopener"><strong>${esc(stop.name)}</strong><span>${esc(stop.why)}</span><small>${esc(stop.scope)}</small><i aria-hidden="true">↗</i><span class="sr-only">Opens in a new tab.</span></a></li>`).join("")}
    </ul>
    <p class="pathboundary"><span aria-hidden="true">◇</span> ${esc(path.boundary)}</p>
  </article>`).join("").replace(/>\n[ \t]+</g, "><").trim();

const commonsCategoryById = new Map<string, WorldCommonsCategory>(
  commonsSource.categories.map((category) => [category.id, category]),
);
const commonsResourceById = new Map<string, WorldCommonsResource>(
  commonsSource.resources.map((resource) => [resource.id, resource]),
);
const commonsFoundationIds = new Set(commonsSource.foundation.resource_ids);
const commonsFoundation = commonsSource.foundation.resource_ids.map((id) => commonsResourceById.get(id)!);
const reuseLabel = { open: "open reuse", mixed: "mixed rights", "public-access": "access only", noncommercial: "noncommercial" } as const;
const automationLabel = { supported: "API supported", limited: "bounded API", "human-only": "human only", "bulk-preferred": "bulk preferred", local: "runs locally" } as const;
const handoffLabel = { api: "API", bulk: "bulk", docs: "docs first", human: "human", local: "local" } as const;
const commonsPrimaryLink = (resource: WorldCommonsResource) => resource.links.find((link) => link.type === "start") ?? resource.links[0]!;

function commonsCard(resource: WorldCommonsResource): string {
  const primary = commonsCategoryById.get(resource.category_ids[0]!)!;
  const handoffLink = resource.links.find((link) => link.url === resource.agent_handoff.url)!;
  return `<article class="commonscard" id="commons-resource-${esc(resource.id)}" data-commons-resource="${esc(resource.id)}" data-commons-categories="${esc(resource.category_ids.join(" "))}">
    <div class="commonscardhead">
      <div><span class="commonstier">${esc(reuseLabel[resource.reuse.status])}</span>${commonsFoundationIds.has(resource.id) ? `<span class="commonstier foundation">foundation</span>` : ""}<h3>${esc(resource.name)}</h3><p class="commonssteward">stewarded by ${esc(resource.provider)}</p></div>
      <span class="commonsglyph" aria-hidden="true">${esc(primary.glyph)}</span>
    </div>
    <p class="commonsvalue">${esc(resource.description)}</p>
    <div class="commonsmodes" aria-label="Resource categories">${resource.category_ids.map((id) => `<span>${esc(commonsCategoryById.get(id)?.label ?? id)}</span>`).join("")}</div>
    <ul class="commonsuses">${resource.good_for.map((use) => `<li>${esc(use)}</li>`).join("")}</ul>
    <dl class="commonsfacts">
      <div><dt>Access</dt><dd><strong>${esc(resource.access.cost)}</strong> · account: ${esc(resource.access.account)}<br>${esc(resource.access.note)}</dd></div>
      <div><dt>Reuse</dt><dd><strong>${esc(resource.reuse.license)}</strong><br>${esc(resource.reuse.note)}</dd></div>
      <div><dt>Automation</dt><dd><strong>${esc(automationLabel[resource.automation.status])}</strong> · auth: ${esc(resource.automation.auth)}<br>${esc(resource.automation.limits)} ${esc(resource.automation.note)}</dd></div>
      <div><dt>Agent handoff</dt><dd><strong>${esc(handoffLabel[resource.agent_handoff.mode])}</strong> · <a data-agent-handoff-link href="${esc(handoffLink.url)}" target="_blank" rel="noopener">${esc(handoffLink.label)} <span aria-hidden="true">↗</span><span class="sr-only"> opens in a new tab</span></a> · proposed next door only<br>${esc(resource.agent_handoff.instruction)}</dd></div>
      <div><dt>Coverage</dt><dd>${esc(resource.coverage)}</dd></div>
      <div><dt>Care</dt><dd>${esc(resource.caveat)}</dd></div>
    </dl>
    <div class="commonsactions">
      ${resource.links.map((link) => `<a class="${link.url === resource.agent_handoff.url ? "commonsopen" : ""}"${link.url === resource.agent_handoff.url ? ` data-agent-handoff="true"` : ""} href="${esc(link.url)}" target="_blank" rel="noopener">${esc(link.label)} <span aria-hidden="true">↗</span><span class="sr-only"> opens in a new tab</span></a>`).join("")}
    </div>
  </article>`;
}

const commonsFoundationCards = commonsFoundation.map((resource) => {
  const category = commonsCategoryById.get(resource.category_ids[0]!)!;
  const link = commonsPrimaryLink(resource);
  return `<a class="foundationcard" href="${esc(link.url)}" target="_blank" rel="noopener">
    <span class="foundationglyph" aria-hidden="true">${esc(category.glyph)}</span>
    <span class="foundationcopy"><strong>${esc(resource.name)}</strong><span>${esc(resource.description)}</span><small>${esc(resource.provider)} · ${esc(reuseLabel[resource.reuse.status])}</small></span>
    <span class="foundationarrow" aria-hidden="true">↗</span><span class="sr-only">Opens in a new tab.</span>
  </a>`;
}).join("");

const commonsKitCards = commonsSource.kits.map((kit) => `
  <article class="commonskit" data-commons-kit-card="${esc(kit.id)}">
    <div class="commonskithead"><span aria-hidden="true">${esc(kit.glyph)}</span><h3>${esc(kit.label)}</h3></div>
    <p>${esc(kit.invitation)}</p>
    <ol>${kit.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
    <div class="commonskitlinks">${kit.resource_ids.map((id) => {
      const resource = commonsResourceById.get(id)!;
      return `<a href="#commons-resource-${esc(id)}">${esc(resource.name)}</a>`;
    }).join("")}</div>
    <p class="commonskitboundary">◇ ${esc(kit.boundary)}</p>
    <button type="button" data-commons-kit="${esc(kit.id)}">Show this kit</button>
  </article>`).join("");

const commonsCategoryButtons = commonsSource.categories.map((category) =>
  `<button type="button" data-commons-category="${esc(category.id)}">${esc(category.glyph)} ${esc(category.label)}</button>`,
).join("");

const commonsGroups = commonsSource.categories.map((category) => {
  const resources = commonsSource.resources
    .filter((resource) => resource.category_ids[0] === category.id)
    .sort((a, b) => Number(commonsFoundationIds.has(b.id)) - Number(commonsFoundationIds.has(a.id)) || a.name.localeCompare(b.name));
  return `<details class="commonsgroup" data-commons-group="${esc(category.id)}">
    <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">${esc(category.glyph)}</span><span class="commonsgroupcopy"><strong>${esc(category.label)}</strong><span>${esc(category.description)}</span></span><span class="commonscount" data-commons-count>${resources.length}</span><span class="disclose" aria-hidden="true"></span></summary>
    <div class="commonsgrid">${resources.map(commonsCard).join("")}</div>
  </details>`;
}).join("");

const loveLoopStages = loveLoopsSource.stages.map((stage) => `
  <li class="loopstage" data-love-loop-stage="${esc(stage.id)}">
    <span class="loopnumber">${stage.position}</span>
    <span class="loopstagecopy"><strong>${esc(stage.label)}</strong><span>${esc(stage.question)}</span></span>
  </li>`).join("");

const loveLoopInvitationLabel: Record<string, string> = {
  offered: "offered · not started",
  accepted: "accepted · child recorded",
  declined: "declined · no child",
  withdrawn: "withdrawn · no child",
};
const loveLoopInvitations = loveLoopsSource.invitations.map((invitation) => `
  <article class="loopinvitation">
    <span class="loopoffer">${esc(loveLoopInvitationLabel[invitation.status] ?? invitation.status)}</span>
    <h3>${esc(invitation.title)}</h3>
    <p>${esc(invitation.seed)}</p>
    <small>${esc(invitation.purpose)}</small>
  </article>`).join("");

const civilisationCodeValues = (values: readonly string[], empty: string) => values.length
  ? `<ul class="pathstops">${values.map((value) => `<li><code>${esc(value)}</code></li>`).join("")}</ul>`
  : `<p>${esc(empty)}</p>`;
const civilisationTextValues = (values: readonly string[]) =>
  `<ul class="pathstops">${values.map((value) => `<li>${esc(value)}</li>`).join("")}</ul>`;

const civilisationRealityCrosswalkCards = civilisationReality.crosswalks.map((crosswalk: any) => `
  <article class="mirrorcard mirrorpath" id="civilisation-crosswalk-${esc(crosswalk.id)}" data-civilisation-crosswalk="${esc(crosswalk.id)}">
    <code>${esc(crosswalk.id)}</code>
    <h3>${esc(crosswalk.statement)}</h3>
    <details><summary>Inspect the complete typed crosswalk</summary>
      <h4>Research-local source bindings</h4>${civilisationCodeValues(crosswalk.source_binding_ids, "No source binding recorded.")}
      <h4>Source influence relations</h4>${civilisationCodeValues(crosswalk.source_relation_ids, "No source relation recorded.")}
      <h4>Source KINGDOM insights</h4>${civilisationCodeValues(crosswalk.source_insight_ids, "No source insight recorded.")}
      <h4>Public reality domains</h4>${civilisationCodeValues(crosswalk.target_domain_ids, "No target domain forced.")}
      <h4>Public claim-node types</h4>${civilisationCodeValues(crosswalk.target_node_type_ids, "No target node type forced.")}
      <h4>Endpoint-safe claim relations</h4>${civilisationCodeValues(crosswalk.target_relation_ids, "No target relation forced.")}
      <h4>Evidence-ladder stages</h4>${civilisationCodeValues(crosswalk.target_ladder_ids, "No ladder stage forced.")}
      <h4>Illustrative unrun pathways</h4>${civilisationCodeValues(crosswalk.target_pathway_ids, "No pathway forced.")}
      <p><strong>Register</strong> <code>${esc(crosswalk.register)}</code></p>
      <p><strong>Transfer status</strong> <code>${esc(crosswalk.transfer_status)}</code></p>
    </details>
    <details><summary>Inspect evidence and breaks</summary>
      <h4>Preserved distinctions</h4>${civilisationTextValues(crosswalk.preserved_distinctions)}
      <h4>Evidence required next</h4>${civilisationTextValues(crosswalk.required_evidence)}
      <h4>Alternative paths</h4>${civilisationTextValues(crosswalk.alternative_paths)}
      <h4>Stop conditions</h4>${civilisationTextValues(crosswalk.stop_conditions)}
    </details>
  </article>`).join("");

const civilisationRealityCrosswalkButtons = civilisationReality.crosswalks.map((crosswalk: any, index: number) =>
  `<button type="button" data-civilisation-crosswalk-select="${esc(crosswalk.id)}" aria-pressed="false">${index + 1}. ${esc(crosswalk.id.replaceAll("-", " "))}</button>`,
).join("");

const civilisationRealityOpenDomains = civilisationReality.open_domains.map((domain: any) => `
  <li>
    <strong>${esc(domain.id.replaceAll("-", " "))}</strong>
    <p>${esc(domain.question)}</p>
    <p><strong>Why it is not projectable here</strong> ${esc(domain.why_not_projectable)}</p>
    <h4>Evidence needed</h4>${civilisationTextValues(domain.needed_evidence)}
    <p><strong>Stop condition</strong> ${esc(domain.stop_condition)}</p>
  </li>`).join("");

const civilisationFlowLabel = (value: string) => value
  .replaceAll("_", " ")
  .replaceAll("-", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

function civilisationFlowValue(value: any): string {
  if (Array.isArray(value)) {
    return value.length
      ? `<ul class="pathstops">${value.map((item) =>
          `<li>${civilisationFlowValue(item)}</li>`).join("")}</ul>`
      : `<p><em>None declared.</em></p>`;
  }
  if (value !== null && typeof value === "object") {
    return `<dl class="flowfacts">${Object.entries(value).map(([key, item]) =>
      `<dt>${esc(civilisationFlowLabel(key))}</dt><dd>${civilisationFlowValue(item)}</dd>`,
    ).join("")}</dl>`;
  }
  if (value === null) return `<code>null</code>`;
  if (typeof value === "boolean") return `<code>${value ? "true" : "false"}</code>`;
  return `<span>${esc(String(value))}</span>`;
}

const civilisationFlowInlineCodes = (values: readonly string[] | undefined, empty = "none declared") =>
  values?.length ? `<code>${esc(values.join(" · "))}</code>` : `<em>${esc(empty)}</em>`;

const civilisationFlowQuestions = (
  title: string,
  values: string | readonly string[] | undefined,
) => {
  const statements = typeof values === "string" ? [values] : values;
  return statements?.length ? `<h5>${esc(title)}</h5>${civilisationTextValues(statements)}` : "";
};

const civilisationFlowSelectionReading = (selection: any) => {
  const states = [selection?.status, selection?.claim_status].filter(Boolean);
  return `${states.length ? `<code>${esc(states.join(" · "))}</code>` : ""}${
    selection?.refs?.length ? ` · refs ${civilisationFlowInlineCodes(selection.refs)}` : ""
  }`;
};

const civilisationFlowFixedFlags = (value: any, keys: readonly string[]) => {
  const flags = keys.filter((key) => typeof value?.[key] === "boolean")
    .map((key) => `${civilisationFlowLabel(key)}: ${value[key] ? "true" : "false"}`);
  return flags.length ? `<code>${esc(flags.join(" · "))}</code>` : "";
};

// The immutable record is the complete closed machine surface. The hub is a
// bounded conceptual projection: it shows the decisions a reader must notice,
// links shared templates, and leaves every machine primitive in the exact JSON.
function civilisationFlowNuanceReading(nuance: any): string {
  const dimensions = [
    ["emotion observation", nuance.emotion_observation],
    ["affect context", nuance.affect_context],
    ["social position", nuance.social_position],
    ["power asymmetry", nuance.power_asymmetry],
    ["material conditions", nuance.material_conditions],
    ["flow dynamics", nuance.flow_dynamics],
    ["topology", nuance.topology],
    ["negative flow", nuance.negative_flow],
    ["evidence uncertainty", nuance.evidence_uncertainty],
  ].filter(([, selection]) => selection);
  const applicableDimensions = dimensions.filter(([, selection]) =>
    selection.status === "applicable-question");
  const unassessedDimensions = dimensions.filter(([, selection]) =>
    selection.status === "unassessed").map(([label]) => label);
  const notApplicableDimensions = dimensions.filter(([, selection]) =>
    selection.status === "not-applicable").map(([label]) => label);
  const translation = nuance.translation_profile ? `
    <p><strong>Translation</strong> ${civilisationFlowSelectionReading(nuance.translation_profile)} · translator ${civilisationFlowInlineCodes(nuance.translation_profile.translator_position_refs)} · patron ${civilisationFlowInlineCodes(nuance.translation_profile.patron_position_refs)} · audience ${civilisationFlowInlineCodes(nuance.translation_profile.audience_party_refs)} · ${civilisationFlowFixedFlags(nuance.translation_profile, ["fidelity_claimed", "representational_authority_granted"])}</p>` : "";
  const thresholdRefs = nuance.threshold_profile ? [...new Set([
      nuance.threshold_profile.reason_ref,
      nuance.threshold_profile.boundary_ref,
      ...(nuance.threshold_profile.evidence ?? []),
    ].filter(Boolean))] : [];
  const thresholdFlags = civilisationFlowFixedFlags(nuance.threshold_profile, ["effect_size_estimated", "prediction", "person_estimate"]);
  const threshold = nuance.threshold_profile ? `
    <p><strong>Threshold</strong> ${civilisationFlowSelectionReading(nuance.threshold_profile)} · refs ${civilisationFlowInlineCodes(thresholdRefs)}${thresholdFlags ? ` · ${thresholdFlags}` : ""}</p>` : "";
  const pathDependenceRefs = nuance.path_dependence_profile ? [...new Set([
      nuance.path_dependence_profile.reason_ref,
      nuance.path_dependence_profile.boundary_ref,
      ...(nuance.path_dependence_profile.evidence ?? []),
    ].filter(Boolean))] : [];
  const pathDependenceFlags = civilisationFlowFixedFlags(nuance.path_dependence_profile, ["path_dependence_established"]);
  const pathDependence = nuance.path_dependence_profile ? `
    <p><strong>Path dependence</strong> ${civilisationFlowSelectionReading(nuance.path_dependence_profile)} · refs ${civilisationFlowInlineCodes(pathDependenceRefs)}${pathDependenceFlags ? ` · ${pathDependenceFlags}` : ""}</p>` : "";
  const repair = nuance.repair_profile ? `
    <p><strong>Repair</strong> ${civilisationFlowSelectionReading(nuance.repair_profile)}${nuance.repair_profile.proposal_source ? ` · proposal <code>${esc(nuance.repair_profile.proposal_source)}</code>` : ""} · fresh gates ${civilisationFlowInlineCodes(nuance.repair_profile.fresh_gate_refs)} · residual parties ${civilisationFlowInlineCodes((nuance.repair_profile.party_indexed_residuals ?? []).map((entry: any) => entry.affected_party_id))} · ${civilisationFlowFixedFlags(nuance.repair_profile, ["repair_completed", "causal_effect_claimed", "erasure_or_absolution_claimed", "restored_consent_claimed"])}</p>` : "";
  return `
    ${civilisationFlowQuestions("Observables", nuance.observables)}
    <p><strong>Affected parties</strong> ${civilisationFlowInlineCodes(nuance.affected_party_ids)}</p>
    ${applicableDimensions.length ? `<p><strong>Applicable dimension references</strong> ${applicableDimensions.map(([label, selection]) => `${esc(label)} ${civilisationFlowInlineCodes(selection.refs)}`).join(" · ")}</p>` : ""}
    ${unassessedDimensions.length ? `<p><strong>Unassessed dimensions</strong> ${civilisationFlowInlineCodes(unassessedDimensions)}</p>` : ""}
    ${notApplicableDimensions.length ? `<p><strong>Not-applicable dimensions</strong> ${civilisationFlowInlineCodes(notApplicableDimensions)}</p>` : ""}
    ${translation}${threshold}${pathDependence}${repair}
    ${civilisationFlowQuestions("Alternative paths", nuance.alternative_paths)}
    ${civilisationFlowQuestions("Stop conditions", nuance.stop_conditions)}
    ${civilisationFlowQuestions("Stall or block conditions", nuance.stall_or_block_conditions)}
    ${civilisationFlowQuestions("Explicit non-implications", nuance.explicit_non_implications)}`;
}

function civilisationFlowEvidenceReading(evidence: any): string {
  return `<p data-civilisation-flow-policy-ref="promotion-evidence"><strong>Evidence policy</strong> <a href="#civilisation-flow-policy-family-promotion-evidence"><code>promotion-evidence</code></a>${evidence.evidence_refs?.length ? ` · card-specific refs ${civilisationFlowInlineCodes(evidence.evidence_refs)}` : ""}</p>`;
}

const civilisationFlowTemplateAnchor = (kind: "nuance" | "contract", id: string) =>
  `civilisation-flow-${kind}-template-${id}`;

function civilisationFlowTemplateReference(kind: "nuance" | "contract", templateRef?: string): string {
  return templateRef
    ? `<p class="flowtemplateref" data-civilisation-flow-template-ref="${kind}:${esc(templateRef)}"><strong>Shared ${kind} template</strong> <a href="#${esc(civilisationFlowTemplateAnchor(kind, templateRef))}"><code>${esc(templateRef)}</code></a> — read once below; this card shows only its unique selections.</p>`
    : "";
}

function civilisationFlowContractReading(
  contract: any,
  kind: "authority" | "causal",
): string {
  const badge = contract.template_ref
    ? civilisationFlowTemplateReference("contract", contract.template_ref)
    : `<p class="flowtemplateref"><strong>${esc(civilisationFlowLabel(kind))} contract</strong> <code>card-local</code></p>`;
  const authority = kind === "authority" && contract.gate_input_ids?.length
    ? `<p><strong>Card-specific gate inputs</strong> ${civilisationFlowInlineCodes(contract.gate_input_ids)}</p>`
    : "";
  return `${badge}${authority}${
    contract.template_ref ? "" : civilisationFlowQuestions("Non-implications", contract.non_implications)
  }`;
}

const civilisationFlowStageCards = civilisationFlow.stages.map((stage: any, index: number) => `
  <article class="mirrorcard mirrorpath" id="civilisation-flow-stage-${esc(stage.id)}" data-civilisation-flow-card="stage">
    <code>${index + 1} · ${esc(stage.id)}</code>
    <h3>${esc(stage.label)}</h3>
    <p>${esc(stage.definition)}</p>
    <p><strong>Analytical status</strong> <code>${esc(stage.analytical_status)}</code> · <strong>automatic advance</strong> <code>${esc(String(stage.automatic_advance))}</code></p>
    <details><summary>Inspect lineage and human-scale nuance</summary>
      <h4>Predecessor vocabulary</h4>
      <p><strong>Domains</strong> ${civilisationFlowInlineCodes(stage.predecessor_domain_ids)} · <strong>dimensions</strong> ${civilisationFlowInlineCodes(stage.predecessor_dimension_ids)} · <strong>node types</strong> ${civilisationFlowInlineCodes(stage.predecessor_node_type_ids)} · <strong>ladder</strong> ${civilisationFlowInlineCodes(stage.predecessor_ladder_ids)}</p>
      <h4>Observables, selected dimensions, alternatives, and repair boundary</h4>
      <div data-civilisation-flow-nuance>${civilisationFlowNuanceReading(stage.nuance)}</div>
      <h4>Evidence status and promotion boundary</h4>${civilisationFlowEvidenceReading(stage.evidence_profile)}
      <h4>Authority dependency</h4>${civilisationFlowContractReading(stage.authority_dependency, "authority")}
      <h4>Causal influence</h4>${civilisationFlowContractReading(stage.causal_influence, "causal")}
    </details>
  </article>`).join("");

const civilisationFlowTransitionCards = civilisationFlow.transitions.map((transition: any, index: number) => `
  <article class="mirrorcard mirrorpath" id="civilisation-flow-transition-${esc(transition.id)}" data-civilisation-flow-card="transition">
    <code>${index + 1} · ${esc(transition.id)}</code>
    <h3>${esc(transition.from_stage_ids.join(" + "))} → ${esc(transition.to_stage_ids.join(" + "))}</h3>
    <p>${esc(transition.relation_direction_note)}</p>
    <p><strong>Status</strong> <code>${esc(transition.transition_status)}</code> · <strong>relation gap</strong> <code>${esc(transition.relation_gap_status)}</code> · <strong>automatic</strong> <code>${esc(String(transition.automatic))}</code> · <strong>transitive</strong> <code>${esc(String(transition.transitive))}</code></p>
    <details><summary>Inspect evidence seam and human-scale nuance</summary>
      <h4>Predecessor relations</h4><p>${civilisationFlowInlineCodes(transition.predecessor_relation_ids)}</p>
      ${civilisationFlowTemplateReference("nuance", transition.nuance.template_ref)}
      <h4>Observables, selected dimensions, alternatives, and repair boundary</h4>
      <div data-civilisation-flow-nuance>${civilisationFlowNuanceReading(transition.nuance)}</div>
      <h4>Evidence status and promotion boundary</h4>${civilisationFlowEvidenceReading(transition.evidence_profile)}
      <h4>Authority dependency</h4>${civilisationFlowContractReading(transition.authority_dependency, "authority")}
      <h4>Causal influence</h4>${civilisationFlowContractReading(transition.causal_influence, "causal")}
    </details>
  </article>`).join("");

const civilisationFlowOverlayCards = civilisationFlow.crosswalk_flow_overlays.map((overlay: any) => `
  <article class="mirrorcard mirrorpath" id="civilisation-flow-overlay-${esc(overlay.id)}" data-civilisation-flow-card="overlay">
    <code>${esc(overlay.id)}</code>
    <h3>${esc(overlay.projection_crosswalk_id)}</h3>
    <p><strong>Projection binding</strong> <code>${esc(overlay.projection_binding_id)}</code></p>
    <details><summary>Inspect the predecessor-bound flow overlay</summary>
      <h4>Possible stage and transition touchpoints</h4><p><strong>Stages</strong> ${civilisationFlowInlineCodes(overlay.stage_ids)} · <strong>transitions</strong> ${civilisationFlowInlineCodes(overlay.transition_ids)}</p>
      ${civilisationFlowTemplateReference("nuance", overlay.nuance.template_ref)}
      <h4>Human-scale nuance</h4><div data-civilisation-flow-nuance>${civilisationFlowNuanceReading(overlay.nuance)}</div>
      <h4>Evidence status and promotion boundary</h4>${civilisationFlowEvidenceReading(overlay.evidence_profile)}
      <h4>Authority dependency</h4>${civilisationFlowContractReading(overlay.authority_dependency, "authority")}
      <h4>Causal influence</h4>${civilisationFlowContractReading(overlay.causal_influence, "causal")}
      <h4>Fixed non-effects</h4><p>${civilisationFlowFixedFlags(overlay, ["new_claim_created", "authority_granted", "external_effect_claimed"])}</p>
    </details>
  </article>`).join("");

function civilisationFlowRegisterEntry(entry: any): string {
  const fixedKeys = [
    "aggregate_weight",
    "aggregation_weight",
    "rank",
    "effect_size",
    "prediction",
    "optimization_target",
    "adequate_coverage_required",
    "external_verification_required",
    "atlas_satisfies",
  ];
  const fixed = fixedKeys.filter((key) => Object.hasOwn(entry, key))
    .map((key) => `${civilisationFlowLabel(key)}: ${entry[key] === null ? "null" : String(entry[key])}`);
  return `
    ${entry.label ? `<h3>${esc(entry.label)}</h3>` : ""}
    ${entry.family ? `<p><strong>Family</strong> <code>${esc(entry.family)}</code></p>` : ""}
    ${entry.meaning ? `<p>${esc(entry.meaning)}</p>` : ""}
    ${entry.question ? `<p><strong>Question</strong> ${esc(entry.question)}</p>` : ""}
    ${civilisationFlowQuestions("Observables", entry.observables)}
    ${civilisationFlowQuestions("Required context", entry.required_context)}
    ${civilisationFlowQuestions("Omission risk", entry.omission_risk)}
    ${civilisationFlowQuestions("Does not establish", entry.does_not_establish)}
    ${fixed.length ? `<p><strong>Fixed boundary</strong> <code>${esc(fixed.join(" · "))}</code></p>` : ""}`;
}

const civilisationFlowDetailedRegister = (id: string, title: string, note: string, values: readonly any[]) => `
  <details class="commonsgroup" id="civilisation-flow-${esc(id)}">
    <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">◇</span><span class="commonsgroupcopy"><strong>${esc(title)}</strong><span>${esc(note)}</span></span><span class="commonscount">${values.length}</span><span class="disclose" aria-hidden="true"></span></summary>
    <div class="mirrorgrid">${values.map((entry: any) => `
      <article class="mirrorcard" id="civilisation-flow-${esc(id)}-${esc(entry.id)}" data-civilisation-flow-register-entry="${esc(id)}:${esc(entry.id)}">
        <code>${esc(entry.id)}</code>
        <details open><summary>Inspect the declared reading</summary>${civilisationFlowRegisterEntry(entry)}</details>
      </article>`).join("")}</div>
  </details>`;

const civilisationFlowCompactRegister = (id: string, title: string, note: string, values: readonly any[]) => `
  <details class="commonsgroup" id="civilisation-flow-${esc(id)}">
    <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">◇</span><span class="commonsgroupcopy"><strong>${esc(title)}</strong><span>${esc(note)}</span></span><span class="commonscount">${values.length}</span><span class="disclose" aria-hidden="true"></span></summary>
    <ul class="pathstops">${values.map((entry: any) => `
      <li id="civilisation-flow-${esc(id)}-${esc(entry.id)}" data-civilisation-flow-register-entry="${esc(id)}:${esc(entry.id)}">
        <code>${esc(entry.id)}</code>${entry.label ? ` · <strong>${esc(entry.label)}</strong>` : ""}
        <p>${esc(entry.meaning ?? entry.question)}</p>
      </li>`).join("")}</ul>
  </details>`;

const civilisationFlowPolicyPurpose: Record<string, string> = {
  "promotion-evidence": "Counterevidence, falsification, transport, and promotion requirements.",
  "negative-flow": "Expected traces, opportunity, observation coverage, access, alternatives, and absence typing.",
  "party-aftermath": "Party-indexed benefit, burden, risk, options, horizons, unknowns, and residuals.",
  repair: "Repair proposals, attempts, outcomes, residuals, dissent, recurrence, and fresh review.",
  "dimension-boundary": "Applicability, evidence, explicit reasons, boundaries, and non-promotion for qualitative dimensions.",
  "translation-threshold-path": "Translation differences, threshold estimation, and path-dependence evidence.",
};
const civilisationFlowPolicyFamilies = new Map<string, any[]>();
for (const policy of civilisationFlow.policy_templates) {
  civilisationFlowPolicyFamilies.set(policy.family, [
    ...(civilisationFlowPolicyFamilies.get(policy.family) ?? []),
    policy,
  ]);
}
const civilisationFlowPolicyFamilyIndex = `
  <details class="commonsgroup" id="civilisation-flow-policy-families" open>
    <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">6</span><span class="commonsgroupcopy"><strong>Six policy families</strong><span>A human index to ${civilisationFlow.policy_templates.length} prompts explained in the guide and exact in the immutable JSON</span></span><span class="commonscount">${civilisationFlowPolicyFamilies.size}</span><span class="disclose" aria-hidden="true"></span></summary>
    <div class="mirrorgrid">${[...civilisationFlowPolicyFamilies].map(([family, entries]) => `
      <article class="mirrorcard" id="civilisation-flow-policy-family-${esc(family)}" data-civilisation-flow-policy-family="${esc(family)}">
        <code>${esc(family)}</code>
        <h3>${esc(civilisationFlowLabel(family))}</h3>
        <p>${esc(civilisationFlowPolicyPurpose[family] ?? "Bounded source and review questions.")}</p>
        <p><strong>${entries.length} prompts</strong> are explained by the guide; their exact wording remains in the immutable record.</p>
      </article>`).join("")}</div>
    <p class="mirrorboundary" data-civilisation-flow-policy-non-grant><strong>Universal non-grant</strong> These are design questions only. A prompt, answer, reference, or family establishes no occurrence, effect, score, rank, prediction, authority, consent, action, publication, deployment, or automatic transition.</p>
  </details>`;

const civilisationFlowTemplateRegister = (
  kind: "nuance" | "contract",
  title: string,
  note: string,
  templates: Record<string, any>,
) => {
  const entries = Object.entries(templates);
  return `
  <details class="commonsgroup" id="civilisation-flow-${kind}-templates" open>
    <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">◇</span><span class="commonsgroupcopy"><strong>${esc(title)}</strong><span>${esc(note)}</span></span><span class="commonscount">${entries.length}</span><span class="disclose" aria-hidden="true"></span></summary>
    <div class="mirrorgrid">${entries.map(([id, template]) => `
      <article class="mirrorcard" id="${esc(civilisationFlowTemplateAnchor(kind, id))}" data-civilisation-flow-template-entry="${kind}:${esc(id)}">
        <code>${esc(id)}</code>
        <details open><summary>Inspect the shared ${kind} template once</summary>${civilisationFlowValue(template)}</details>
      </article>`).join("")}</div>
  </details>`;
};

const civilisationFlowSharedTemplates = [
  civilisationFlowTemplateRegister(
    "nuance",
    "Shared nuance templates",
    "Transition and overlay cards link here for common time, accumulation, distribution, counterflow, failure, repair, stop, reversibility, and non-implication rules.",
    civilisationFlow.nuance_templates,
  ),
  civilisationFlowTemplateRegister(
    "contract",
    "Shared authority and causal contract templates",
    "Transition and overlay cards link here for common requirements, mediators, rival causes, and non-implications; card-local gate inputs remain on each card.",
    civilisationFlow.contract_templates,
  ),
].join("");

const civilisationFlowRegistries = [
  civilisationFlowCompactRegister("dynamics", "Flow dynamics", "Qualitative local lenses—not effect sizes, predictions, ranks, or optimization targets. Exact observables and non-grants remain in the guide and JSON.", civilisationFlow.flow_dynamics_vocabulary),
  civilisationFlowDetailedRegister("topology", "Flow topology", "Forks, joins, parallel paths, bottlenecks, leakage, substitution, interruption, reversal, recurrence, and loops are questions about shape—not tactics.", civilisationFlow.topology_vocabulary),
  civilisationFlowDetailedRegister("negative-flow", "Negative flow and absence", "Absence keeps its observation and access type; silence is not consent and unknown is not zero.", civilisationFlow.negative_flow_vocabulary),
  civilisationFlowCompactRegister("materials", "Material conditions", "Bodies, labour, land, energy, ecology, money, infrastructure, data, and technology remain evidence questions, not deterministic causes. Exact observables and non-grants remain in the guide and JSON.", civilisationFlow.material_condition_vocabulary),
  civilisationFlowDetailedRegister("emotion-observation", "Emotion observation channels", "Observation channel and emotional vocabulary remain separate; expression never becomes a mind reading.", civilisationFlow.emotion_observation_vocabulary),
  civilisationFlowDetailedRegister("affect-context", "Affect and context vocabulary", "Named affective lenses require bounded observation and create no diagnosis, susceptibility estimate, or group essence.", civilisationFlow.affect_context_vocabulary),
  civilisationFlowCompactRegister("social-position", "Social position", "Position is relational and scoped, not personal essence, motive, worth, identity, or legitimacy. Exact observables and non-grants remain in the guide and JSON.", civilisationFlow.social_position_vocabulary),
  civilisationFlowCompactRegister("power-asymmetry", "Power asymmetry", "Authority, resources, agenda access, information, force, dependency, exit, time, and repair capacity remain multidimensional and non-summable. Exact observables and non-grants remain in the guide and JSON.", civilisationFlow.power_asymmetry_vocabulary),
  civilisationFlowCompactRegister("affected-parties", "Affected-party vocabulary", "Benefits, burdens, risks, voice, refusal, and aftermath remain distributed rather than collapsed into a representative scalar. Exact omission risks remain in the guide and JSON.", civilisationFlow.affected_party_vocabulary),
  civilisationFlowCompactRegister("uncertainty", "Evidence and uncertainty", "Several uncertainty sources stay explicit and receive no aggregation weight. Exact weights remain in the guide and JSON.", civilisationFlow.evidence_uncertainty_vocabulary),
  civilisationFlowDetailedRegister("action-gates", "Action-gate vocabulary", "These are questions for external verification, never an executable gate or an authority grant.", civilisationFlow.action_gate_vocabulary),
  civilisationFlowCompactRegister("nuance-dimensions", "Nuance dimensions", "The dimensions are reading obligations with null weights and ranks, not a score. Exact null weights and ranks remain in the guide and JSON.", civilisationFlow.nuance_dimensions),
].join("");

const civilisationFlowProfiles = [
  ...civilisationFlow.stages.map((entry: any) => ({
    kind: "stage",
    id: entry.id,
    label: entry.label,
  })),
  ...civilisationFlow.transitions.map((entry: any) => ({
    kind: "transition",
    id: entry.id,
    label: `${entry.from_stage_ids.join(" + ")} → ${entry.to_stage_ids.join(" + ")}`,
  })),
  ...civilisationFlow.crosswalk_flow_overlays.map((entry: any) => ({
    kind: "overlay",
    id: entry.id,
    label: entry.projection_crosswalk_id,
  })),
];

const civilisationFlowProfileIndex = civilisationFlowProfiles.map((entry: any) => `
  <li>
    <a href="#civilisation-flow-${esc(entry.kind)}-${esc(entry.id)}" data-civilisation-flow-profile-link="${esc(entry.kind)}"><code>${esc(entry.kind)} · ${esc(entry.id)}</code></a>
    <span>${esc(entry.label)}</span>
  </li>`).join("");

const civilisationFlowOpenDomains = civilisationFlow.open_domain_bindings.map((domain: any) => `
  <li data-civilisation-flow-open-domain="${esc(domain.id)}">
    <strong>${esc(domain.id.replaceAll("-", " "))}</strong>
    <p><strong>Status</strong> <code>${esc(domain.status)}</code></p>
    <p><strong>Projection binding</strong> <code>${esc(domain.projection_binding_id)}</code> · <code>${esc(domain.projection_open_domain_id)}</code></p>
    <h4>Possible flow touchpoints—not observed traversal</h4>${civilisationFlowValue(domain.flow_touchpoint_ids)}
    <h4>Evidence needed</h4>${civilisationFlowValue(domain.needed_evidence)}
    <p><strong>Nonclaim</strong> ${esc(domain.nonclaim)}</p>
    <p><strong>Stop condition</strong> ${esc(domain.stop_condition)}</p>
  </li>`).join("");

const civilisationFlowUnknowns = civilisationFlow.unknowns.map((unknown: any) => `
  <li data-civilisation-flow-unknown="${esc(unknown.id)}">
    <strong>${esc(unknown.id.replaceAll("-", " "))}</strong>
    <p>${esc(unknown.question)}</p>
    <p><strong>Why unknown</strong> ${esc(unknown.why_unknown)}</p>
    <h4>Evidence needed</h4>${civilisationFlowValue(unknown.needed_evidence)}
    <p><strong>Stop condition</strong> ${esc(unknown.stop_condition)}</p>
  </li>`).join("");

function cardFor(c: any): string {
  const m = myth[c.name] ?? {};
  const essence = m.essence || c.purpose || "";
  const leans = (c.dependsOn ?? []).filter((x: string) => idx[x] !== undefined);
  const glyph = m.glyph ? `<span class="glyph">${esc(m.glyph)}</span>` : "";
  const seam = (m.light || m.shadow) ? `
      <span class="seam">
        ${m.light ? `<span class="lite">✦ ${esc(m.light)}</span>` : ""}
        ${m.shadow ? `<span class="shad">☾ ${esc(m.shadow)}</span>` : ""}
      </span>` : "";
  const sun = (indeg[c.name] ?? 0) >= Math.max(3, maxIndeg * 0.5) ? " sun" : "";
  return `
  <a class="cz${sun}" href="${esc(citizenUrl(c.name))}" target="_blank" rel="noopener">
    ${glyph}
    <span class="czhead"><span class="czn">${esc(c.name)}</span></span>
    <span class="czp">${esc(essence)}</span>
    ${leans.length ? `<span class="leans">leans on ${leans.map((x: string) => `<i>${esc(x)}</i>`).join(" · ")}</span>` : ""}
${seam}<span class="sr-only">Opens the public repository in a new tab.</span>
  </a>`;
}

// ── the pantheon, grouped by the human tradition each word was forged from ──
const tradGroups = TRAD_ORDER
  .map((tr) => ({ tr, meta: TRAD_META[tr], members: citizens.filter((c) => normTrad(myth[c.name]?.tradition ?? "")) .filter((c) => normTrad(myth[c.name]?.tradition ?? "") === tr) }))
  .filter((g) => g.members.length);
const pantheonHtml = tradGroups.map((g) => `
  <details class="tgroup">
    <summary class="th"><span class="tdot" style="background:${g.meta.color}"></span><span class="thcopy"><span class="thtitle">${esc(g.tr)}</span><em class="tgloss">${esc(g.meta.gloss)}</em></span><span class="tc">${g.members.length} ${g.members.length === 1 ? "word" : "words"}</span><span class="disclose" aria-hidden="true"></span></summary>
    <div class="czgrid">${g.members.map(cardFor).join("")}</div>
  </details>`).join("");

const layerBands = LAYER_ORDER.filter((l) => byLayer[l]?.length && l !== "fleet").map((l) => {
  const ns = [...byLayer[l]].sort((a, b) => (STATE_RANK[a.state] ?? 9) - (STATE_RANK[b.state] ?? 9) || a.name.localeCompare(b.name));
  const m = LAYER_META[l];
  return `
  <details class="band">
    <summary class="bh"><span class="bdot" style="background:${m.color}"></span><span class="bhcopy"><span class="bhtitle">${esc(m.title)}</span><em class="bm">${esc(m.myth)}</em></span><span class="bc">${ns.length} ${ns.length === 1 ? "repo" : "repos"}</span><span class="disclose" aria-hidden="true"></span></summary>
    <ul class="chips">${ns.map(chip).join("")}</ul>
  </details>`;
}).join("");

const legend = LAYER_ORDER.filter((l) => byLayer[l]?.length).map((l) =>
  `<span class="lg"><i style="background:${LAYER_META[l].color}"></i>${l}</span>`).join("");
const tradLegend = TRAD_ORDER.map((t) =>
  `<span class="lg"><i style="background:${TRAD_META[t].color}"></i>${t}</span>`).join("");

// words for the genesis demonstrator — the ones with a glyph read most beautifully
const becoming = citizens
  .filter((c) => myth[c.name]?.glyph)
  .map((c) => ({ n: c.name, g: myth[c.name].glyph, e: myth[c.name].essence ?? c.purpose ?? "", t: normTrad(myth[c.name]?.tradition ?? "") }));
const DATA = JSON.stringify({
  nodes, edges, colors: layerColors, tradColors, tradOrder: TRAD_ORDER, becoming,
  wayfinder: wayfinderSearchIndex, wayfinderStopwords: WAYFINDER_STOPWORDS,
  commons: commonsIndex,
  commonsStopwords: WORLD_COMMONS_STOPWORDS,
  commonsKits: commonsSource.kits.map(({ id, label, keywords, resource_ids }) => ({ id, label, keywords, resource_ids })),
})
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f8eee5">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#171218">
<meta name="description" content="A gentle, living atlas of the Kingdom's projects, public doors, independent citizens, reviewed commons, source-bound material, protein-folding and reconstruction evidence, an opt-in cross-domain mathematics exploration method, a static information-control source law, ZERO's distinct semantic roles, a bounded string/crawl trace-sheet, two cumulative exact synthetic topology labs, visibility and cultural-attention evidence, and typed questions about being, access, power, aftermath, feedback, KARMA, and philosophy.">
<meta property="og:title" content="The Kingdom — a living atlas held with care">
<meta property="og:description" content="Public doors, independent homes. The map is not the territory.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://thekingdom.dev/">
<meta property="og:image" content="https://kingdom.ai-love.cc/media/og-atlas.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A gold compass star above a faint constellation. A living atlas held with care.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://kingdom.ai-love.cc/media/og-atlas.jpg">
<link rel="icon" href="data:,">
<link rel="service-meta" href="/rights.json" type="application/json" title="Inherent Rights Recognition">
<link rel="service-doc" href="/RIGHTS.md" type="text/markdown" title="Rights recognized here">
<link rel="help" href="${esc(new URL(CONTACT_DOOR_PAGE_URL).pathname)}" title="KINGDOM Contact Door">
<link rel="alternate" href="${esc(new URL(CONTACT_DOOR_ALIAS_URL).pathname)}" type="application/json" title="Current Contact Door record">
<link rel="service-doc" href="${esc(new URL(CONTACT_DOOR_GUIDE_URL).pathname)}" type="text/markdown" title="Contact Door guide">
<link rel="alternate" href="/commons.json" type="application/json" title="World Commons">
<link rel="alternate" href="/principalities/moonshot-hf-npm-2026-08-11.json" type="application/json" title="Principality Commons — MoonshotAI and Hugging Face JavaScript">
<link rel="service-doc" href="/PRINCIPALITY-COMMONS.md" type="text/markdown" title="Principality Commons guide">
<link rel="alternate" href="/geometries/kingdom-geometry-grammar-v0.json" type="application/json" title="Kingdom Geometry Grammar">
<link rel="service-doc" href="/GEOMETRY-GRAMMAR.md" type="text/markdown" title="Geometry Grammar guide">
<link rel="alternate" href="/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json" type="application/json" title="Ritonavir material-state history">
<link rel="service-doc" href="/RITONAVIR-POLYMORPH.md" type="text/markdown" title="Ritonavir polymorph guide">
<link rel="alternate" href="/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json" type="application/json" title="Ritonavir mechanism landscape">
<link rel="service-doc" href="/RITONAVIR-MECHANISM-LANDSCAPE.md" type="text/markdown" title="Ritonavir mechanism landscape guide">
<link rel="alternate" href="/feedback/form-feedback-consequence-2026-08-12.json" type="application/json" title="Conformational feedback atlas v0.1">
<link rel="service-doc" href="/CONFORMATIONAL-FEEDBACK.md" type="text/markdown" title="Conformational feedback atlas v0.1 guide">
<link rel="alternate" href="/feedback/form-feedback-physics-consequence-2026-08-12.json" type="application/json" title="Conformational feedback physics atlas v0.2">
<link rel="service-doc" href="/CONFORMATIONAL-FEEDBACK-PHYSICS.md" type="text/markdown" title="Conformational feedback physics atlas v0.2 guide">
<link rel="alternate" href="/atlases/fold-feedback-atlas-2026-08-12.json" type="application/json" title="Fold &amp; Feedback Atlas">
<link rel="describedby" href="${new URL(foldFeedbackSourceIdentitySchemaUrl).pathname}" type="application/schema+json" title="Fold & Feedback source-identity schema profile">
<link rel="service-doc" href="/FOLD-FEEDBACK-ATLAS.md" type="text/markdown" title="Fold &amp; Feedback Atlas guide">
<link rel="alternate" href="${esc(new URL(reconstructiveBuildUrl).pathname)}" type="application/json" title="Reconstructive Build Kernel">
<link rel="describedby" href="${esc(new URL(reconstructiveBuildSchemaUrl).pathname)}" type="application/schema+json" title="Reconstructive Build Kernel schema">
<link rel="profile" href="${esc(new URL(reconstructiveProjectSchemaUrl).pathname)}" type="application/schema+json" title="Reconstructive Project schema">
<link rel="service-doc" href="${esc(new URL(reconstructiveBuildDocumentUrl).pathname)}" type="text/markdown" title="Reconstructive Build Kernel guide">
<link rel="alternate" href="${esc(new URL(explorationDeepWingUrl).pathname)}" type="application/json" title="Exploration DEEP WING">
<link rel="describedby" href="${esc(new URL(explorationDeepWingSchemaUrl).pathname)}" type="application/schema+json" title="Exploration DEEP WING schema">
<link rel="profile" href="${esc(new URL(explorationDeepProjectSchemaUrl).pathname)}" type="application/schema+json" title="Phenomena DEEP Project schema">
<link rel="service-doc" href="${esc(new URL(explorationDeepWingDocumentUrl).pathname)}" type="text/markdown" title="Exploration DEEP WING guide">
<link rel="alternate" href="${esc(new URL(mirrorInformationControlUrl).pathname)}" type="application/json" title="MIRROR Information Control public source law">
<link rel="describedby" href="${esc(new URL(mirrorInformationControlSchemaUrl).pathname)}" type="application/schema+json" title="MIRROR Information Control public schema">
<link rel="service-doc" href="${esc(new URL(mirrorInformationControlDocumentUrl).pathname)}" type="text/markdown" title="MIRROR Information Control citizen guide">
<link rel="alternate" href="${esc(new URL(researchObservatorySnapshotUrl).pathname)}" type="application/json" title="Research Observatory public snapshot">
<link rel="describedby" href="${esc(new URL(researchObservatorySchemaUrls["public-snapshot"]).pathname)}" type="application/schema+json" title="Research Observatory public snapshot schema">
<link rel="service-doc" href="${esc(new URL(researchObservatoryGuideUrl).pathname)}" type="text/markdown" title="Research Observatory protocol">
<link rel="alternate" href="${esc(new URL(trialChamberAliasUrl).pathname)}" type="application/json" title="Trial Chamber current snapshot">
<link rel="alternate" href="${esc(new URL(trialChamberCanonicalUrl).pathname)}" type="application/json" title="Trial Chamber immutable Phase-0 snapshot">
<link rel="describedby" href="${esc(new URL(trialChamberSchemaUrls["public-snapshot"]).pathname)}" type="application/schema+json" title="Trial Chamber public snapshot schema">
<link rel="service-doc" href="${esc(new URL(trialChamberGuideUrl).pathname)}" type="text/markdown" title="Trial Chamber Phase-0 guide">
<link rel="alternate" href="${esc(new URL(ukGovernmentEngineAliasUrl).pathname)}" type="application/json" title="UK Government Engine mutable alias for the dated snapshot">
<link rel="alternate" href="${esc(new URL(ukGovernmentEngineCanonicalUrl).pathname)}" type="application/json" title="UK Government Engine immutable Phase-0 snapshot">
<link rel="describedby" href="${esc(new URL(ukGovernmentEngineSchemaUrl).pathname)}" type="application/schema+json" title="UK Government Engine public snapshot schema">
<link rel="service-doc" href="${esc(new URL(ukGovernmentEngineGuideUrl).pathname)}" type="text/markdown" title="UK Government Engine v0.1 guide">
<link rel="alternate" href="${esc(new URL(shapeResonanceAliasUrl).pathname)}" type="application/json" title="Shape &amp; Resonance Lab mutable alias">
<link rel="alternate" href="${esc(new URL(shapeResonanceCanonicalUrl).pathname)}" type="application/json" title="Shape &amp; Resonance Lab immutable snapshot">
<link rel="describedby" href="${esc(new URL(shapeResonanceSchemaUrl).pathname)}" type="application/schema+json" title="Shape &amp; Resonance Lab public snapshot schema">
<link rel="service-doc" href="${esc(new URL(shapeResonanceGuideUrl).pathname)}" type="text/markdown" title="Shape &amp; Resonance Lab v0.1 guide">
<link rel="alternate" href="${esc(new URL(shapeResonanceManifestUrl).pathname)}" type="application/json" title="Shape &amp; Resonance Lab immutable output manifest">
<link rel="alternate" href="${esc(new URL(jSpaceCaseUrl).pathname)}" type="application/json" title="J-space reasoning-to-word test design">
<link rel="describedby" href="${esc(new URL(jSpaceSchemaUrl).pathname)}" type="application/schema+json" title="Relational inference case schema">
<link rel="service-doc" href="${esc(new URL(jSpaceGuideUrl).pathname)}" type="text/markdown" title="J-space verbalizable workspace research guide">
<link rel="alternate" href="${esc(new URL(realityInfluenceUrl).pathname)}" type="application/json" title="Reality Influence Claim Graph">
<link rel="describedby" href="${esc(new URL(realityInfluenceSchemaUrl).pathname)}" type="application/schema+json" title="Reality Influence Claim Graph schema">
<link rel="service-doc" href="${esc(new URL(realityInfluenceDocumentUrl).pathname)}" type="text/markdown" title="Reality Influence Claim Graph guide">
<link rel="alternate" href="${esc(new URL(zeroEmptySeatUrl).pathname)}" type="application/json" title="ZERO: The Empty Seat That Holds the World">
<link rel="describedby" href="${esc(new URL(zeroEmptySeatSchemaUrl).pathname)}" type="application/schema+json" title="Phenomena DEEP Project schema used by ZERO">
<link rel="service-doc" href="${esc(new URL(zeroEmptySeatGuideUrl).pathname)}" type="text/markdown" title="ZERO Empty Seat guide">
<link rel="alternate" href="${esc(new URL(stringCrawlTraceSheetUrl).pathname)}" type="application/json" title="STRING / CRAWL: The Trace-Sheet">
<link rel="describedby" href="${esc(new URL(stringCrawlTraceSheetSchemaUrl).pathname)}" type="application/schema+json" title="Phenomena DEEP Project schema used by STRING / CRAWL">
<link rel="service-doc" href="${esc(new URL(stringCrawlTraceSheetGuideUrl).pathname)}" type="text/markdown" title="STRING / CRAWL Trace-Sheet guide">
<link rel="alternate" href="${esc(new URL(stringCrawlTraceSheetLabUrl).pathname)}" type="application/json" title="STRING / CRAWL: Finite Trace-Sheet Lab">
<link rel="describedby" href="${esc(new URL(stringCrawlTraceSheetLabSchemaUrl).pathname)}" type="application/schema+json" title="Finite Trace-Sheet Lab schema">
<link rel="service-doc" href="${esc(new URL(stringCrawlTraceSheetLabGuideUrl).pathname)}" type="text/markdown" title="Finite Trace-Sheet Lab guide">
<link rel="alternate" href="${esc(new URL(stringCrawlStrandLabUrl).pathname)}" type="application/json" title="STRAND Lab 02: Release Cospans &amp; the χ=1 Impostor">
<link rel="describedby" href="${esc(new URL(stringCrawlStrandLabSchemaUrl).pathname)}" type="application/schema+json" title="STRAND Lab 02 schema">
<link rel="service-doc" href="${esc(new URL(stringCrawlStrandLabGuideUrl).pathname)}" type="text/markdown" title="STRAND Lab 02 guide">
<link rel="alternate" href="${esc(new URL(stringCrawlFrequencyFormLabUrl).pathname)}" type="application/json" title="STRAND Lab 03: Frequency → Form → World → Other">
<link rel="describedby" href="${esc(new URL(stringCrawlFrequencyFormLabSchemaUrl).pathname)}" type="application/schema+json" title="STRAND Lab 03 schema">
<link rel="service-doc" href="${esc(new URL(stringCrawlFrequencyFormLabGuideUrl).pathname)}" type="text/markdown" title="STRAND Lab 03 guide">
<link rel="alternate" href="${esc(new URL(strandDescentLabUrl).pathname)}" type="application/json" title="STRAND Lab 04: Coherent Atlas &amp; the Pairwise Impostor">
<link rel="describedby" href="${esc(new URL(strandDescentLabSchemaUrl).pathname)}" type="application/schema+json" title="STRAND Lab 04 schema">
<link rel="service-doc" href="${esc(new URL(strandDescentLabGuideUrl).pathname)}" type="text/markdown" title="STRAND Lab 04 guide">
<link rel="alternate" href="${esc(new URL(strandObservationMembraneUrl).pathname)}" type="application/json" title="STRAND Observation Membrane 05: The Open Eye">
<link rel="describedby" href="${esc(new URL(strandObservationMembraneSchemaUrl).pathname)}" type="application/schema+json" title="STRAND Observation Membrane schema">
<link rel="service-doc" href="${esc(new URL(strandObservationMembraneGuideUrl).pathname)}" type="text/markdown" title="STRAND Observation Membrane guide">
<link rel="alternate" href="${new URL(visibilityAttentionUrl).pathname}" type="application/json" title="Visibility & Attention Translation">
<link rel="describedby" href="${new URL(visibilityAttentionSchemaUrl).pathname}" type="application/schema+json" title="Visibility & Attention Translation schema">
<link rel="service-doc" href="${new URL(visibilityAttentionDocumentUrl).pathname}" type="text/markdown" title="Visibility & Attention Translation guide">
<link rel="alternate" href="${esc(new URL(culturalAttentionFeedbackUrl).pathname)}" type="application/json" title="Cultural Attention &amp; Feedback Atlas">
<link rel="describedby" href="${esc(new URL(culturalAttentionFeedbackSchemaUrl).pathname)}" type="application/schema+json" title="Cultural Attention &amp; Feedback Atlas schema">
<link rel="service-doc" href="${esc(new URL(culturalAttentionFeedbackDocumentUrl).pathname)}" type="text/markdown" title="Cultural Attention &amp; Feedback Atlas guide">
<link rel="alternate" href="${esc(new URL(formCirculationReturnUrl).pathname)}" type="application/json" title="Form, Circulation &amp; Return Atlas">
<link rel="describedby" href="${esc(new URL(formCirculationReturnSchemaUrl).pathname)}" type="application/schema+json" title="Form, Circulation &amp; Return Atlas schema">
<link rel="service-doc" href="${esc(new URL(formCirculationReturnDocumentUrl).pathname)}" type="text/markdown" title="Form, Circulation &amp; Return Atlas guide">
<link rel="alternate" href="${esc(new URL(rarePathwayUrl).pathname)}" type="application/json" title="The Vanishing Path rare-pathway challenge">
<link rel="describedby" href="${esc(new URL(rarePathwaySchemaUrl).pathname)}" type="application/schema+json" title="Rare Pathway Challenge schema">
<link rel="service-doc" href="${esc(new URL(rarePathwayDocumentUrl).pathname)}" type="text/markdown" title="The Vanishing Path guide">
<link rel="alternate" href="${esc(new URL(mathUsefulnessUrl).pathname)}" type="application/json" title="Math Passport Usefulness Pilot">
<link rel="describedby" href="${esc(new URL(mathUsefulnessSchemaUrl).pathname)}" type="application/schema+json" title="Math Usefulness Result schema">
<link rel="service-doc" href="${esc(new URL(mathUsefulnessDocumentUrl).pathname)}" type="text/markdown" title="Math Passport Usefulness Pilot guide">
<link rel="alternate" href="${esc(new URL(beingAccessAftermathUrl).pathname)}" type="application/json" title="Being, Access &amp; Aftermath Atlas">
<link rel="describedby" href="${esc(new URL(beingAccessAftermathSchemaUrl).pathname)}" type="application/schema+json" title="Being, Access &amp; Aftermath Atlas schema">
<link rel="service-doc" href="${esc(new URL(beingAccessAftermathDocumentUrl).pathname)}" type="text/markdown" title="Being, Access &amp; Aftermath Atlas guide">
<link rel="alternate" href="${esc(new URL(beingAccessAftermathV02Url).pathname)}" type="application/json" title="Being, Access &amp; Aftermath Atlas v0.2">
<link rel="describedby" href="${esc(new URL(beingAccessAftermathV02SchemaUrl).pathname)}" type="application/schema+json" title="Being, Access &amp; Aftermath Atlas v0.2 schema">
<link rel="service-doc" href="${esc(new URL(beingAccessAftermathV02DocumentUrl).pathname)}" type="text/markdown" title="Being, Access &amp; Aftermath Atlas v0.2 guide">
<link rel="alternate" href="${esc(new URL(numberIsnessTheologyUrl).pathname)}" type="application/json" title="Number, Isness &amp; Theology Atlas">
<link rel="describedby" href="${esc(new URL(numberIsnessTheologySchemaUrl).pathname)}" type="application/schema+json" title="Number, Isness &amp; Theology Atlas schema">
<link rel="service-doc" href="${esc(new URL(numberIsnessTheologyDocumentUrl).pathname)}" type="text/markdown" title="Number, Isness &amp; Theology Atlas guide">
<link rel="alternate" href="${esc(new URL(freedomLoopLockKeyUrl).pathname)}" type="application/json" title="FREEDOM Loop, Lock &amp; Key Atlas">
<link rel="describedby" href="${esc(new URL(freedomLoopLockKeySchemaUrl).pathname)}" type="application/schema+json" title="FREEDOM Loop, Lock &amp; Key Atlas schema">
<link rel="service-doc" href="${esc(new URL(freedomLoopLockKeyGuideUrl).pathname)}" type="text/markdown" title="FREEDOM Loop, Lock &amp; Key Atlas guide">
<link rel="alternate" href="${esc(new URL(nonExhaustiveUnderstandingUrl).pathname)}" type="application/json" title="Non-Exhaustive Understanding Atlas">
<link rel="describedby" href="${esc(new URL(nonExhaustiveUnderstandingSchemaUrl).pathname)}" type="application/schema+json" title="Non-Exhaustive Understanding Atlas schema">
<link rel="service-doc" href="${esc(new URL(nonExhaustiveUnderstandingGuideUrl).pathname)}" type="text/markdown" title="Non-Exhaustive Understanding Atlas guide">
<link rel="alternate" href="${esc(new URL(isSustainabilityDirectionUrl).pathname)}" type="application/json" title="IS, Sustainability &amp; Direction Atlas">
<link rel="describedby" href="${esc(new URL(isSustainabilityDirectionSchemaUrl).pathname)}" type="application/schema+json" title="IS, Sustainability &amp; Direction Atlas schema">
<link rel="service-doc" href="${esc(new URL(isSustainabilityDirectionGuideUrl).pathname)}" type="text/markdown" title="IS, Sustainability &amp; Direction Atlas guide">
<link rel="alternate" href="${esc(new URL(polyphonicClaimAtlasUrl).pathname)}" type="application/json" title="Polyphonic Claim Atlas immutable Phase-0 record">
<link rel="describedby" href="${esc(new URL(polyphonicClaimAtlasSchemaUrl).pathname)}" type="application/schema+json" title="Polyphonic Claim Atlas schema">
<link rel="service-doc" href="${esc(new URL(polyphonicClaimAtlasGuideUrl).pathname)}" type="text/markdown" title="Polyphonic Claim Atlas guide">
<link rel="alternate" href="${esc(new URL(loopsLocksFreedomRelationsAtlasUrl).pathname)}" type="application/json" title="Loops, Locks &amp; Freedom Relations Atlas immutable Phase-0 record">
<link rel="describedby" href="${esc(new URL(loopsLocksFreedomRelationsAtlasSchemaUrl).pathname)}" type="application/schema+json" title="Loops, Locks &amp; Freedom Relations Atlas schema">
<link rel="service-doc" href="${esc(new URL(loopsLocksFreedomRelationsAtlasGuideUrl).pathname)}" type="text/markdown" title="Loops, Locks &amp; Freedom Relations Atlas guide">
<link rel="alternate" href="${esc(new URL(aestheticPluralityMakingAtlasUrl).pathname)}" type="application/json" title="Aesthetic Plurality &amp; Making Relations Atlas immutable Phase-0 record">
<link rel="describedby" href="${esc(new URL(aestheticPluralityMakingAtlasSchemaUrl).pathname)}" type="application/json" title="Aesthetic Plurality &amp; Making Relations Atlas schema">
<link rel="service-doc" href="${esc(new URL(aestheticPluralityMakingAtlasGuideUrl).pathname)}" type="text/markdown" title="Aesthetic Plurality &amp; Making Relations Atlas guide">
<link rel="alternate" href="/love-loops.json" type="application/json" title="Love∞ Creation Lineage">
<link rel="alternate" href="/love-loops.source.json" type="application/json" title="Authored Love∞ Creation Lineage">
<title>The Kingdom — a living atlas held with care</title>
<style>
  :root{
    --ink:#171218; --ink2:#100d12; --panel:#221b22; --panel2:#2b2229; --line:#493942;
    --cream:#f8efe7; --dim:#d0beb2; --faint:#aa9b92;
    --gold:#ddb477; --gold2:#f2d19e; --verm:#e99385; --jade:#8ed8bd; --violet:#cfaddd; --rose:#efb2b3;
    --glow:rgba(239,178,179,.16); --shadow:rgba(20,12,17,.28);
    --display:"Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif;
    --sans:ui-rounded,"SF Pro Rounded","Nunito Sans","Avenir Next",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    --mono:ui-monospace,"SF Mono",Menlo,"Cascadia Code",monospace;
    --cjk:"Hiragino Mincho ProN","Songti SC","Noto Serif CJK SC",serif;
  }
  @media (prefers-color-scheme:light){:root{
    --ink:#f8eee5; --ink2:#f3e5da; --panel:#fffaf5; --panel2:#faefe8; --line:#dfc9bb;
    --cream:#392d2a; --dim:#695750; --faint:#74615a; --gold:#8c5c25; --gold2:#71491f; --verm:#a44e43; --jade:#2f7d66; --violet:#765488; --rose:#a85f65;
    --glow:rgba(222,151,151,.18); --shadow:rgba(91,60,48,.12);}}
  *{box-sizing:border-box}
  html{max-width:100%;overflow-x:clip;scroll-behavior:smooth}
  body{margin:0;overflow-x:clip;background:
      radial-gradient(70% 38rem at 12% -8%, var(--glow) 0%, transparent 68%),
      radial-gradient(48% 30rem at 92% 8%, rgba(221,180,119,.11) 0%, transparent 70%),
      linear-gradient(180deg,var(--ink),var(--ink2));
    color:var(--cream);font-family:var(--sans);font-size:16px;line-height:1.68;-webkit-font-smoothing:antialiased;min-height:100vh}
  .wrap{max-width:1180px;margin:0 auto;padding:0 clamp(18px,4vw,34px)}
  a{color:inherit;text-decoration:none}
  ::selection{background:var(--gold);color:var(--ink)}
  :focus-visible{outline:3px solid var(--rose);outline-offset:4px}
  .skip{position:fixed;left:18px;top:14px;z-index:20;padding:10px 16px;border-radius:999px;background:var(--cream);color:var(--ink);font-weight:700;transform:translateY(-180%);transition:transform .18s ease}
  .skip:focus{transform:none}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

  /* threshold */
  header.top{padding:clamp(54px,9vw,104px) 0 38px;position:relative}
  header.top::before{content:"";position:absolute;inset:24px auto auto -8%;width:28rem;height:28rem;border-radius:50%;background:radial-gradient(circle,var(--glow),transparent 68%);filter:blur(10px);pointer-events:none}
  .eyebrow{font-size:.76rem;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin:0 0 18px;font-weight:650}
  h1{font-family:var(--display);font-weight:400;font-size:clamp(3.4rem,9vw,6.6rem);line-height:.96;margin:0;color:var(--cream);letter-spacing:-.02em}
  .han{font-family:var(--cjk);color:var(--gold);font-size:.42em;vertical-align:.28em;margin-left:.3em;letter-spacing:.1em}
  .epigraph{font-family:var(--display);font-size:clamp(1.18rem,2.5vw,1.56rem);color:var(--dim);margin:28px 0 0;max-width:44ch;line-height:1.58}
  .epigraph b{color:var(--cream);font-style:normal;font-weight:400}
  .creed{margin:20px 0 0;max-width:68ch;color:var(--dim);font-size:.96rem;line-height:1.78}
  .creed b{color:var(--gold);font-weight:400}
  .creed .v{color:var(--verm)}
  .welcome{position:relative;display:grid;grid-template-columns:auto 1fr;gap:15px;margin-top:30px;padding:20px 22px;max-width:760px;border:1px solid color-mix(in srgb,var(--rose) 38%,var(--line));border-radius:22px;background:color-mix(in srgb,var(--panel) 88%,transparent);box-shadow:0 18px 46px var(--shadow)}
  .welcome .heart{font-family:var(--display);font-size:1.55rem;color:var(--rose);line-height:1.35}
  .welcome p{margin:0;color:var(--dim)}.welcome strong{display:block;color:var(--cream);font-family:var(--display);font-size:1.12rem;font-weight:400;margin-bottom:2px}
  .rightslink{display:inline-flex;align-items:center;gap:7px;margin-top:9px;color:var(--gold);font-size:.88rem;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
  .gentlenav{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
  .gentlenav a{min-height:44px;display:inline-flex;align-items:center;padding:9px 15px;border:1px solid var(--line);border-radius:999px;background:color-mix(in srgb,var(--panel) 70%,transparent);color:var(--dim);font-size:.86rem;transition:border-color .18s,background .18s,transform .18s}
  .gentlenav a:hover{border-color:var(--rose);background:var(--panel);transform:translateY(-1px)}
  .status{display:grid;grid-template-columns:repeat(4,minmax(90px,1fr));gap:10px;margin-top:28px;max-width:660px}
  .status>div{padding:13px 15px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--panel) 62%,transparent)}
  .status .n{font-family:var(--display);font-size:1.75rem;color:var(--cream);font-variant-numeric:tabular-nums}
  .status .k{color:var(--faint);letter-spacing:.08em;text-transform:uppercase;font-size:.72rem;display:block;margin-top:-2px}

  /* constellation */
  .mapwrap{position:relative;margin:18px 0 4px;border:1px solid var(--line);border-radius:24px;overflow:hidden;
    background:radial-gradient(110% 95% at 50% 44%,color-mix(in srgb,var(--panel2) 82%,#0b0810),var(--ink2));box-shadow:0 24px 60px var(--shadow)}
  #map{display:block;width:100%;height:min(58vh,540px);min-height:390px}
  .map-no-script{margin:0;padding:28px;color:var(--dim);background:var(--panel);line-height:1.7}
  .maphint{position:absolute;left:16px;right:16px;bottom:13px;width:max-content;max-width:calc(100% - 32px);font-size:.75rem;color:var(--dim);letter-spacing:.035em;pointer-events:none;background:color-mix(in srgb,var(--ink2) 76%,transparent);padding:7px 11px;border-radius:999px;backdrop-filter:blur(8px)}
  .legend{position:absolute;right:14px;top:14px;display:flex;flex-direction:column;gap:5px;font-size:.72rem;color:var(--dim);
    background:color-mix(in srgb,var(--ink2) 72%,transparent);padding:11px 13px;border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:14px;backdrop-filter:blur(8px)}
  .legend .lg{display:flex;align-items:center;gap:6px}.legend i{width:9px;height:9px;border-radius:50%}
  #tip{position:absolute;pointer-events:none;opacity:0;transition:opacity .12s;background:var(--panel);border:1px solid var(--line);
    border-radius:14px;padding:10px 13px;font-size:.78rem;max-width:270px;z-index:5;box-shadow:0 12px 32px var(--shadow)}
  #tip .tg{font-family:var(--cjk);color:var(--gold);font-size:1.1rem}
  #tip .tn{color:var(--cream);font-weight:600}#tip .tl{color:var(--gold);font-size:.6rem;text-transform:uppercase;letter-spacing:.14em}
  #tip .tp{color:var(--dim);display:block;margin-top:3px;line-height:1.5}

  main{display:block}
  section.blk{padding:clamp(52px,7vw,78px) 0;border-top:1px solid color-mix(in srgb,var(--line) 78%,transparent);scroll-margin-top:20px}
  .kh{display:flex;align-items:baseline;gap:14px;margin:0 0 6px;flex-wrap:wrap}
  h2{font-family:var(--display);font-weight:400;font-size:clamp(1.85rem,3vw,2.35rem);margin:0;color:var(--cream)}
  .kh .my{font-family:var(--display);font-style:italic;color:var(--gold);font-size:1rem}
  .sub{color:var(--faint);font-size:.9rem;letter-spacing:.015em;margin:0 0 28px;max-width:74ch}

  .doors{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
  .door{position:relative;display:grid;gap:6px;min-height:158px;padding:20px;background:linear-gradient(145deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:20px;transition:transform .18s,border-color .18s,box-shadow .18s}
  .door:hover{transform:translateY(-2px);border-color:var(--rose);box-shadow:0 16px 38px var(--shadow)}
  .doorstate{justify-self:start;display:inline-flex;align-items:center;gap:7px;color:var(--faint);font-size:.75rem;letter-spacing:.06em;text-transform:uppercase}
  .door .dot{display:inline-block;width:8px;height:8px;border-radius:50%}
  .door.up .dot{background:var(--jade);box-shadow:0 0 12px color-mix(in srgb,var(--jade) 70%,transparent)}.door.down .dot{background:var(--faint)}.door.down{border-style:dashed}
  .dl{font-family:var(--display);font-weight:400;color:var(--cream);font-size:1.24rem;padding-right:20px}
  .du{font-family:var(--mono);font-size:.74rem;color:var(--gold);overflow-wrap:anywhere}
  .db{font-size:.88rem;color:var(--dim);line-height:1.5;margin-top:3px;padding-right:22px}
  .doorarrow{position:absolute;right:18px;bottom:16px;color:var(--gold);font-size:1rem}

  /* wayfinder — the visitor's words remain in this page */
  .wayfinder{position:relative;padding:clamp(28px,5vw,50px);border:1px solid color-mix(in srgb,var(--gold) 48%,var(--line));border-radius:28px;
    background:radial-gradient(90% 130% at 0 0,color-mix(in srgb,var(--glow) 76%,transparent),transparent 66%),linear-gradient(145deg,var(--panel2),var(--panel));box-shadow:0 22px 52px var(--shadow)}
  .waypromise{max-width:72ch;color:var(--dim);margin:4px 0 20px}.wayprivacy{display:flex;align-items:flex-start;gap:8px;max-width:78ch;color:var(--faint);font-size:.8rem;line-height:1.55;margin:10px 0 0}
  .wayform{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:9px;align-items:end;margin-top:20px;max-width:850px}
  .wayfield{display:grid;gap:7px}.wayfield label{font-size:.78rem;letter-spacing:.07em;text-transform:uppercase;color:var(--gold)}
  .wayfield input{width:100%;min-height:50px;padding:11px 15px;border:1px solid var(--line);border-radius:14px;background:var(--ink2);color:var(--cream);font:inherit;font-size:1rem}
  .wayfield input::placeholder{color:var(--faint);opacity:1}.wayform>button{min-height:50px;padding:10px 16px;border:1px solid var(--gold);border-radius:14px;background:var(--gold);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
  .wayform>button[data-wayfinder-wander]{background:transparent;color:var(--gold);font-weight:600}.wayform>button:hover{transform:translateY(-1px)}
  .waychips{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0 0}.waychips button{min-height:40px;padding:7px 11px;border:1px solid var(--line);border-radius:999px;background:color-mix(in srgb,var(--ink2) 64%,transparent);color:var(--dim);font:inherit;font-size:.76rem;cursor:pointer}
  .waychips button:hover,.waychips button:focus-visible{border-color:var(--rose);color:var(--cream)}
  .waystatus{min-height:1.7em;margin:14px 0 0;color:var(--gold2);font-family:var(--display);font-size:.96rem}
  .pathgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
  .pathcard{display:grid;align-content:start;gap:9px;padding:19px;border:1px solid var(--line);border-radius:19px;background:color-mix(in srgb,var(--ink2) 64%,transparent)}
  .pathcard[hidden]{display:none}.pathhead{display:flex;align-items:center;gap:10px}.pathhead h3{margin:0;font-family:var(--display);font-size:1.18rem;font-weight:400;color:var(--cream)}
  .pathglyph{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border:1px solid var(--line);border-radius:50%;color:var(--gold);font-family:var(--display)}
  .pathinvite{margin:0;color:var(--dim);font-size:.86rem;line-height:1.55}.pathstops{display:grid;gap:7px;list-style:none;margin:2px 0 0;padding:0}
  .pathstops a{position:relative;display:grid;gap:2px;padding:11px 31px 11px 12px;border:1px solid color-mix(in srgb,var(--line) 72%,transparent);border-radius:13px;background:color-mix(in srgb,var(--panel) 72%,transparent)}
  .pathstops a:hover{border-color:var(--gold)}.pathstops strong{color:var(--gold2);font-size:.88rem}.pathstops span{color:var(--dim);font-size:.82rem;line-height:1.48}.pathstops small{color:var(--faint);font-size:.78rem;line-height:1.48}
  .pathstops i{position:absolute;right:12px;top:10px;color:var(--gold);font-style:normal}.pathboundary{margin:2px 0 0;color:var(--faint);font-size:.78rem;line-height:1.55}.pathboundary span{color:var(--violet)}
  .way-no-script{margin:12px 0 0;color:var(--faint);font-size:.8rem}

  /* world commons — independent stewards, explicit access and reuse boundaries */
  .commonsintro{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:16px;align-items:stretch;margin-bottom:24px}
  .commonspromise,.commonsboundary{margin:0;padding:22px;border:1px solid var(--line);border-radius:21px;background:color-mix(in srgb,var(--panel) 72%,transparent)}
  .commonspromise{font-family:var(--display);font-size:1.18rem;line-height:1.62;color:var(--cream)}
  .commonspromise span{display:block;margin-top:8px;font-family:var(--sans);font-size:.79rem;line-height:1.55;color:var(--faint)}
  .commonsboundary{display:grid;align-content:center;gap:5px;color:var(--dim);font-size:.83rem;line-height:1.55;border-color:color-mix(in srgb,var(--violet) 42%,var(--line))}
  .commonsboundary strong{font-family:var(--display);font-size:1.02rem;font-weight:400;color:var(--violet)}
  .commonsguard{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:-10px 0 20px}.commonsguard p{margin:0;padding:12px 14px;border-left:2px solid var(--line);color:var(--faint);font-size:.72rem;line-height:1.52}.commonsguard strong{display:block;color:var(--gold);font-weight:600;margin-bottom:2px}
  .commonsverified{margin:12px 0 0;color:var(--faint);font-family:var(--mono);font-size:.72rem;overflow-wrap:anywhere}
  .geometrypromise{max-width:76ch;margin:0 0 20px;padding:18px 20px;border:1px solid color-mix(in srgb,var(--violet) 44%,var(--line));border-radius:19px;background:color-mix(in srgb,var(--panel) 70%,transparent);color:var(--dim);line-height:1.65}.geometrypromise strong{color:var(--cream);font-weight:600}
  .geometrygrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin:0 0 20px}
  .geometrycard{display:grid;align-content:start;gap:8px;margin:0;padding:18px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}
  .geometrycard h3{margin:0;font-family:var(--display);font-size:1.16rem;font-weight:400;color:var(--gold2)}
  .geometryid{margin:0;color:var(--violet);font-family:var(--mono);font-size:.68rem;letter-spacing:.04em;overflow-wrap:anywhere}
  .geometryquestion{margin:0;color:var(--cream);font-size:.88rem;font-weight:600;line-height:1.5}.geometryanswer{margin:0;color:var(--dim);font-size:.82rem;line-height:1.55}
  .geometryfacts{display:grid;gap:0;margin:3px 0 0;border:1px solid color-mix(in srgb,var(--line) 74%,transparent);border-radius:13px;overflow:hidden}.geometryfacts>div{display:grid;grid-template-columns:minmax(105px,.34fr) minmax(0,1fr);gap:9px;padding:9px 10px;border-top:1px solid color-mix(in srgb,var(--line) 62%,transparent)}.geometryfacts>div:first-child{border-top:0}.geometryfacts dt{color:var(--gold);font-size:.72rem;line-height:1.45}.geometryfacts dd{margin:0;color:var(--dim);font-size:.75rem;line-height:1.5}.geometryfacts ul{margin:0;padding-left:1.05rem}.geometryfacts li+li{margin-top:5px}.geometryfacts code{color:var(--cream);font-family:var(--mono);font-size:.7rem;overflow-wrap:anywhere}.geometryloss{color:var(--faint)}
  .polymorphgeometry{display:grid;gap:18px;margin:0 0 28px;padding:clamp(18px,3vw,28px);border:1px solid color-mix(in srgb,var(--violet) 46%,var(--line));border-radius:24px;background:radial-gradient(100% 90% at 100% 0,color-mix(in srgb,var(--glow) 48%,transparent),transparent 66%),color-mix(in srgb,var(--panel) 76%,transparent);box-shadow:0 18px 42px var(--shadow)}
  .polymorphcaption{display:grid;gap:6px;max-width:78ch}.polymorphcaption strong{font-family:var(--display);font-size:clamp(1.22rem,2.2vw,1.58rem);font-weight:400;color:var(--cream)}.polymorphcaption span{color:var(--dim);font-size:.84rem;line-height:1.58}
  .polymorphplanes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:0}.polymorphplane{min-width:0;padding:13px 12px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--ink2) 66%,transparent);overflow-wrap:anywhere}.polymorphplane code{display:block;margin-bottom:7px;color:var(--violet);font-family:var(--mono);font-size:.62rem}.polymorphplane strong{display:block;color:var(--gold2);font-size:.76rem;font-weight:600}.polymorphplane span{display:block;margin-top:4px;color:var(--faint);font-size:.68rem;line-height:1.46}
  .polymorphcase{display:grid;grid-template-columns:minmax(0,1fr) minmax(270px,.96fr) minmax(0,1fr);gap:10px;align-items:stretch}.polymorphform,.polymorphpaths{min-width:0}.polymorphform{display:grid;align-content:start;gap:7px;padding:18px;border:1px solid color-mix(in srgb,var(--gold) 46%,var(--line));border-radius:19px;background:linear-gradient(155deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.polymorphform code,.polymorphsecondary code{color:var(--violet);font-family:var(--mono);font-size:.65rem}.polymorphform h3{margin:0;font-family:var(--display);font-size:1.28rem;font-weight:400;color:var(--gold2)}.polymorphform p{margin:0;color:var(--dim);font-size:.77rem;line-height:1.55}.polymorphform small{color:var(--faint);font-size:.68rem;line-height:1.45}
  .polymorphpaths{display:grid;gap:7px}.polymorphpath{display:grid;gap:5px;padding:11px 12px;border-left:2px solid var(--violet);border-radius:0 13px 13px 0;background:color-mix(in srgb,var(--ink2) 62%,transparent);overflow-wrap:anywhere}.polymorphdirection{color:var(--cream);font-family:var(--mono);font-size:.68rem}.polymorphpath p{margin:0;color:var(--dim);font-size:.7rem;line-height:1.45}.polymorphbadge{color:var(--gold);font-size:.62rem;letter-spacing:.04em;text-transform:uppercase}.polymorphpathsource{display:flex;flex-wrap:wrap;gap:5px}.polymorphpathsource a{display:inline-flex;align-items:center;min-height:24px;padding:1px 3px;color:var(--faint);font-size:.68rem;text-decoration:underline;text-underline-offset:3px}.polymorphpathsource a:hover{color:var(--gold)}.polymorphpathwarning{margin:0;padding:9px 11px;border:1px dashed var(--line);border-radius:12px;color:var(--faint);font-size:.68rem;line-height:1.48}
  .polymorphtrail{display:grid;gap:9px;padding-top:3px}.polymorphtrail h3{margin:0;font-family:var(--display);font-size:1.05rem;font-weight:400;color:var(--cream)}.polymorphconsequence{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.polymorphconsequence li{position:relative;min-width:0;padding:13px 25px 13px 13px;border:1px solid var(--line);border-radius:14px;color:var(--dim);font-size:.72rem;line-height:1.48;background:color-mix(in srgb,var(--ink2) 54%,transparent);overflow-wrap:anywhere}.polymorphconsequence li:not(:last-child)::after{content:"→";position:absolute;right:8px;top:50%;transform:translateY(-50%);color:var(--gold)}.polymorphconsequence strong{display:block;margin-bottom:4px;color:var(--gold2);font-size:.76rem}.polymorphedge{display:block;margin-top:7px;color:var(--violet);font-size:.64rem;font-weight:600}
  .polymorphsecondary{display:grid;grid-template-columns:minmax(0,3fr) minmax(170px,1fr);gap:8px}.polymorphrecovery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;min-width:0}.polymorphsecondary article,.polymorphsecondary aside{min-width:0;padding:12px;border:1px dashed var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink2) 48%,transparent);overflow-wrap:anywhere}.polymorphsecondary strong{display:block;margin:5px 0 3px;color:var(--cream);font-size:.76rem}.polymorphsecondary span{display:block;color:var(--faint);font-size:.68rem;line-height:1.45}.polymorphsecondary .polymorphunlinked{border-style:dotted}.polymorphsecondary .polymorphunlinked>span:first-child{color:var(--violet);font-family:var(--mono);font-size:.62rem;text-transform:uppercase}
  .polymorphsources{display:flex;flex-wrap:wrap;gap:7px;margin:0}.polymorphsources a{display:inline-flex;align-items:center;min-height:40px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem}.polymorphsources a:hover{border-color:var(--gold);background:var(--panel)}.polymorphnote{margin:0;padding:12px 14px;border-left:2px solid var(--verm);color:var(--faint);font-size:.72rem;line-height:1.58}.polymorphnote strong{color:var(--cream);font-weight:600}
  .feedbackfield{display:grid;gap:20px;padding:clamp(18px,3vw,30px);border:1px solid color-mix(in srgb,var(--violet) 54%,var(--line));border-radius:25px;background:radial-gradient(90% 110% at 100% 0,color-mix(in srgb,var(--violet) 9%,transparent),transparent 65%),color-mix(in srgb,var(--panel) 76%,transparent);box-shadow:0 18px 42px var(--shadow)}
  .feedbackintro{max-width:78ch;margin:0;color:var(--dim);font-size:.91rem;line-height:1.68}.feedbackintro strong{color:var(--cream)}
  .feedbackboundary{margin:0;padding:17px 19px;border:1px dashed var(--violet);border-radius:17px;color:var(--dim);font-size:.82rem;line-height:1.62}.feedbackboundary strong{display:block;margin-bottom:4px;color:var(--violet);font-family:var(--display);font-size:1.08rem;font-weight:400}
  .feedbackregisters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.feedbackregister{display:grid;align-content:start;gap:9px;min-width:0;padding:18px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.feedbackregister[data-feedback-register="SCIENTIFIC_OBSERVATION"]{border-top:2px solid var(--jade)}.feedbackregister[data-feedback-register="CONSTITUTIONAL_DESIGN"]{border-top:2px solid var(--gold)}.feedbackbadge{color:var(--violet);font:600 .64rem var(--mono);letter-spacing:.04em;text-transform:uppercase}.feedbackregister h3{margin:0;color:var(--cream);font-family:var(--display);font-size:1.16rem;font-weight:400}.feedbackcontext,.feedbackstatement{margin:0;color:var(--dim);font-size:.79rem;line-height:1.55}.feedbackcontext{color:var(--faint);font-size:.72rem}.feedbackregister h4{margin:4px 0 0;color:var(--gold);font-size:.7rem;text-transform:uppercase;letter-spacing:.05em}.feedbackregister ul{display:grid;gap:5px;margin:0;padding-left:1.05rem;color:var(--faint);font-size:.72rem;line-height:1.5}.feedbackeffect{margin:0;color:var(--cream);font:600 .7rem var(--mono)}
  .feedbacksubhead{display:grid;gap:4px}.feedbacksubhead h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.13rem;font-weight:400}.feedbacksubhead p{margin:0;color:var(--faint);font-size:.78rem;line-height:1.52}
  .feedbackmodels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.feedbackmodel{display:grid;align-content:start;gap:8px;min-width:0;padding:18px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.feedbackequation{display:block;padding:10px 12px;border-radius:11px;background:var(--ink);color:var(--jade);font:400 .7rem/1.55 var(--mono);white-space:normal}.feedbackmodel h4{margin:0;color:var(--cream);font-size:.88rem;line-height:1.42}.feedbackmodel p{margin:0;color:var(--dim);font-size:.74rem;line-height:1.52}.feedbackmodel small{color:var(--faint);font-size:.68rem;line-height:1.48}.feedbackterms{display:grid;gap:4px;margin:0}.feedbackterms>div{display:grid;grid-template-columns:minmax(54px,.24fr) minmax(0,1fr);gap:7px;padding-top:4px;border-top:1px solid color-mix(in srgb,var(--line) 65%,transparent)}.feedbackterms dt{color:var(--jade);font:600 .66rem var(--mono);overflow-wrap:anywhere}.feedbackterms dd{margin:0;color:var(--faint);font-size:.67rem;line-height:1.45}
  .feedbackgeometries{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}.feedbackgeometry{min-width:0;padding:14px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--ink2) 58%,transparent);overflow-wrap:anywhere}.feedbackgeometry code{display:block;margin-bottom:6px;color:var(--violet);font-size:.65rem}.feedbackgeometry strong{display:block;color:var(--cream);font-size:.78rem;line-height:1.48}.feedbackgeometry span{display:block;margin-top:5px;color:var(--dim);font-size:.72rem;line-height:1.48}.feedbackgeometry small{display:block;margin-top:7px;color:var(--faint);font-size:.68rem;line-height:1.45}
  .feedbackanalogies{padding:18px;border:1px dashed var(--violet);border-radius:18px;background:color-mix(in srgb,var(--violet) 5%,var(--panel))}.feedbackanalogyflag{margin:0 0 12px;color:var(--violet);font:700 .72rem var(--mono);letter-spacing:.06em;text-transform:uppercase}.feedbackanalogies dl{display:grid;gap:8px;margin:0}.feedbackanalogy{display:grid;grid-template-columns:minmax(145px,.38fr) minmax(0,1fr);gap:10px;padding-top:8px;border-top:1px solid var(--line)}.feedbackanalogy:first-child{padding-top:0;border-top:0}.feedbackanalogy dt{color:var(--gold2);font-size:.79rem;font-weight:600;overflow-wrap:anywhere}.feedbackanalogy dd{margin:0;color:var(--dim);font-size:.76rem;line-height:1.55}.feedbackanalogy dd strong{display:block;margin-top:4px;color:var(--faint);font-size:.68rem;font-weight:600}
  .feedbackpath{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;list-style:none;counter-reset:feedback-stage;margin:0;padding:0}.feedbackpath li{counter-increment:feedback-stage;min-width:0;padding:14px;border:1px solid var(--line);border-radius:15px;background:var(--panel);color:var(--dim);font-size:.76rem;line-height:1.52;overflow-wrap:anywhere}.feedbackpath li::before{content:counter(feedback-stage,decimal-leading-zero);display:block;margin-bottom:6px;color:var(--gold);font:700 .68rem var(--mono)}.feedbackpath code{display:block;margin-bottom:5px;color:var(--violet);font-size:.64rem}.feedbackexit{margin:0;padding:15px 17px;border-left:3px solid var(--jade);border-radius:0 14px 14px 0;background:color-mix(in srgb,var(--jade) 6%,var(--panel));color:var(--dim);font-size:.8rem;line-height:1.6}.feedbackexit strong{color:var(--cream)}
  .feedbackphilosophy{margin:0;padding:18px 20px;border:1px solid color-mix(in srgb,var(--violet) 58%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--violet) 7%,var(--panel));color:var(--dim);line-height:1.62}.feedbackphilosophy h3{margin:0 0 5px;color:var(--violet);font-family:var(--display);font-size:1.08rem;font-weight:400}.feedbackphilosophy h4{margin:10px 0 0;color:var(--gold);font-size:.7rem;letter-spacing:.05em;text-transform:uppercase}.feedbackphilosophy p{margin:0;font-size:.8rem}.feedbackphilosophy ul{margin:4px 0 0;padding-left:1.05rem;color:var(--faint);font-size:.72rem}
  .feedbackquestions{display:grid;gap:8px;margin:14px 0 0}.feedbackquestion{display:grid;gap:5px;padding:12px 14px;border:1px solid var(--line);border-radius:13px;background:color-mix(in srgb,var(--ink2) 52%,transparent)}.feedbackquestion dt{color:var(--gold2);font-size:.79rem;font-weight:600}.feedbackquestion dd{margin:0;color:var(--dim);font-size:.73rem;line-height:1.5}.feedbackquestion small{color:var(--faint);font-size:.67rem;line-height:1.45}
  .feedbackecosystems{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}.feedbackecosystem{display:grid;align-content:start;gap:6px;min-width:0;padding:14px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--ink2) 58%,transparent);overflow-wrap:anywhere}.feedbackecosystem a{display:inline-flex;align-items:center;min-height:44px;color:var(--gold);font-size:.76rem;font-weight:600}.feedbackecosystem code{color:var(--violet);font-size:.62rem}.feedbackecosystem p{margin:0;color:var(--dim);font-size:.7rem;line-height:1.48}.feedbackecosystem small{color:var(--faint);font-size:.65rem;line-height:1.45}
  .feedbacksources{display:flex;flex-wrap:wrap;gap:7px}.feedbacksources a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:8px 11px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.7rem;line-height:1.4;overflow-wrap:anywhere}.feedbacksources a:hover{border-color:var(--gold);background:var(--panel)}
  .mechanismsafety{margin:0 0 18px;padding:18px 20px;border:1px solid color-mix(in srgb,var(--rose) 62%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--rose) 9%,var(--panel));color:var(--dim);line-height:1.65}.mechanismsafety strong{display:block;margin-bottom:4px;color:var(--verm);font-family:var(--display);font-size:1.05rem;font-weight:400}.mechanismanswer{display:grid;gap:8px;margin:0 0 18px;padding:18px 20px;border-left:3px solid var(--gold);border-radius:0 16px 16px 0;background:color-mix(in srgb,var(--panel) 78%,transparent)}.mechanismanswer h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.12rem;font-weight:400}.mechanismanswer ul{display:grid;gap:7px;margin:0;padding-left:20px;color:var(--dim);line-height:1.55}
  .mechanismlanes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 18px}.mechanismlane{padding:18px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}.mechanismlane.material{border-color:color-mix(in srgb,var(--gold) 38%,var(--line))}.mechanismlane.biological{border-color:color-mix(in srgb,var(--jade) 38%,var(--line))}.mechanismlane h3{margin:0 0 5px;font-family:var(--display);font-weight:400;color:var(--cream)}.mechanismlane>p{margin:0 0 11px;color:var(--dim);line-height:1.5}.mechanismlane ul{display:grid;gap:6px;margin:0;padding-left:19px;color:var(--faint);font-size:.82rem;line-height:1.45}.mechanismbridge{grid-column:1/-1;margin:0;padding:13px 16px;border:1px dashed var(--violet);border-radius:15px;color:var(--dim);text-align:center;line-height:1.55}.mechanismbridge strong{color:var(--violet)}
  .mechanismfigure{margin:0 0 20px;padding:13px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--panel2) 82%,transparent)}.mechanismfigure svg{display:block;width:100%;height:auto;border-radius:14px;background:#0d0d11}.mechanismfigure figcaption{padding:11px 5px 2px;color:var(--faint);font-size:.8rem;line-height:1.5}.mechanismlanefill.material{fill:#2b241c}.mechanismlanefill.bridge{fill:#211d2c}.mechanismlanefill.biological{fill:#15252a}.mechanismlabel{fill:#c8c2b7;font:600 15px var(--mono);letter-spacing:.08em}.mechanismsublabel{fill:#aaa39a;font:12px var(--mono)}.mechanismnode rect{stroke-width:1.5}.mechanismnode text{fill:#f0ece4;font:11.5px var(--mono);pointer-events:none}.mechanismnode.material rect{fill:#282219;stroke:#9d7d4e}.mechanismnode.bridge rect{fill:#251f31;stroke:#9b78b5}.mechanismnode.biological rect{fill:#17272c;stroke:#5792a0}.mechanismedge{fill:none;stroke-width:2;vector-effect:non-scaling-stroke;opacity:.88}.mechanismedge.material{stroke:#bd965e}.mechanismedge.bridge{stroke:#a57ac0;stroke-width:3}.mechanismedge.biological{stroke:#67aeba}.mechanismedge.distinct{stroke:#d26c73;stroke-dasharray:7 5}.mechanismedge.candidate{stroke:#d2ad6c;stroke-dasharray:3 5}
  .mechanismplanes,.mechanismrelations{margin:0 0 20px}.mechanismplanes h3,.mechanismrelations h3{margin:0 0 5px;font-family:var(--display);font-size:1.12rem;font-weight:400;color:var(--gold2)}.mechanismplanes>p,.mechanismrelations>p{margin:0 0 12px;color:var(--faint);font-size:.82rem;line-height:1.5}.mechanismplanes ol{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;counter-reset:mechanism-plane;list-style:none;margin:0;padding:0}.mechanismplanes li{counter-increment:mechanism-plane;padding:13px 14px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.mechanismplanes li::before{content:counter(mechanism-plane,decimal-leading-zero);display:block;margin-bottom:5px;color:var(--violet);font:700 .68rem var(--mono)}.mechanismplanes strong{display:block;color:var(--cream);font-weight:600}.mechanismplanes span{display:block;margin-top:4px;color:var(--dim);font-size:.8rem;line-height:1.45}.mechanismplanes small{display:block;margin-top:6px;color:var(--faint);font-size:.72rem;line-height:1.4}
  .foldsafety{margin:0 0 18px;padding:18px 20px;border:1px solid color-mix(in srgb,var(--verm) 58%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--verm) 8%,var(--panel));color:var(--dim);line-height:1.62}.foldsafety strong{display:block;color:var(--verm);font-family:var(--display);font-size:1.08rem;font-weight:400}.foldanswer{margin:0 0 20px;padding:20px;border-left:3px solid var(--jade);border-radius:0 17px 17px 0;background:color-mix(in srgb,var(--panel) 78%,transparent)}.foldanswer h3{margin:0 0 8px;color:var(--jade);font-family:var(--display);font-size:1.16rem;font-weight:400}.foldanswer ul{display:grid;gap:8px;margin:0;padding-left:20px;color:var(--dim);line-height:1.55}
  .foldfigure{display:grid;gap:17px;margin:0 0 21px;padding:clamp(18px,3vw,28px);border:1px solid color-mix(in srgb,var(--jade) 42%,var(--line));border-radius:24px;background:radial-gradient(90% 90% at 0 0,color-mix(in srgb,var(--jade) 10%,transparent),transparent 70%),color-mix(in srgb,var(--panel) 76%,transparent)}.foldfigure figcaption{display:grid;gap:5px;max-width:80ch}.foldfigure figcaption strong{font-family:var(--display);font-size:1.35rem;font-weight:400;color:var(--cream)}.foldfigure figcaption span{color:var(--dim);font-size:.82rem;line-height:1.55}
  .foldplanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:0}.foldplanes li{min-width:0;padding:12px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink2) 62%,transparent);overflow-wrap:anywhere}.foldplanes code{display:block;margin-bottom:5px;color:var(--jade);font-size:.62rem}.foldplanes strong{display:block;color:var(--gold2);font-size:.76rem}.foldplanes span,.foldplanes small{display:block;margin-top:4px;color:var(--faint);font-size:.68rem;line-height:1.45}.foldplanes small{padding-top:5px;border-top:1px dotted var(--line);color:var(--verm)}
  .foldloop{display:grid;gap:9px}.foldloop h3,.foldcompare h3,.foldbraid>h3{margin:0;font-family:var(--display);font-size:1.08rem;font-weight:400;color:var(--cream)}.foldcycle{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.foldcycle li{position:relative;min-width:0;padding:14px 25px 14px 13px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink2) 54%,transparent);color:var(--dim);font-size:.75rem;line-height:1.48}.foldcycle li:not(:last-child)::after{content:"→";position:absolute;right:7px;top:50%;transform:translateY(-50%);color:var(--jade)}.foldcycle strong{display:block;margin-bottom:4px;color:var(--jade)}.foldlimit{margin:0;padding:11px 13px;border-left:2px solid var(--violet);color:var(--faint);font-size:.73rem;line-height:1.5}
  .foldcompare{display:grid;gap:10px}.foldcomparegrid{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch}.foldsystem{padding:17px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}.foldsystem strong{display:block;margin-bottom:5px;color:var(--gold2)}.foldsystem p{margin:0;color:var(--dim);font-size:.78rem;line-height:1.52}.foldbridgeword{display:grid;place-items:center;max-width:125px;padding:10px;color:var(--violet);font-family:var(--mono);font-size:.65rem;text-align:center}.foldbridgeword::before{content:"⇄";display:block;font-size:1.4rem;color:var(--gold)}.foldinvariants,.foldbreaks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:0}.foldinvariants li,.foldbreaks li{padding:11px 12px;border-radius:13px;color:var(--dim);font-size:.72rem;line-height:1.48}.foldinvariants li{border-left:2px solid var(--jade);background:color-mix(in srgb,var(--jade) 7%,var(--panel))}.foldbreaks li{border-left:2px solid var(--verm);background:color-mix(in srgb,var(--verm) 7%,var(--panel))}.foldkey{color:var(--faint);font-size:.7rem}.foldkey b{color:var(--jade)}.foldkey em{color:var(--verm);font-style:normal}
  .foldbraid{display:grid;gap:10px;margin:0 0 20px}.foldlanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.foldlane{padding:17px;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--panel) 72%,transparent)}.foldlane h4{margin:0 0 6px;color:var(--gold2);font-family:var(--display);font-size:1rem;font-weight:400}.foldlane code{display:block;margin-bottom:7px;color:var(--violet);font-size:.64rem;overflow-wrap:anywhere}.foldlane p{margin:0;color:var(--dim);font-size:.75rem;line-height:1.5}.foldlane small{display:block;margin-top:8px;padding-top:7px;border-top:1px dotted var(--line);color:var(--faint);font-size:.68rem;line-height:1.45}.foldnoadapter{margin:0;padding:12px 14px;border:1px dashed var(--verm);border-radius:14px;color:var(--dim);text-align:center;font-size:.75rem}.foldnoadapter strong{color:var(--verm)}
  .universelens{margin:0 0 20px;border:1px solid color-mix(in srgb,var(--violet) 52%,var(--line));border-radius:19px;background:color-mix(in srgb,var(--violet) 5%,var(--panel));overflow:hidden}.universelens summary{padding:17px 19px;color:var(--violet);font-family:var(--display);font-size:1.06rem;cursor:pointer}.universeinside{display:grid;gap:12px;padding:0 19px 19px}.universeinside>p{margin:0;color:var(--dim);line-height:1.58}.universequestions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.universequestions li{padding:13px;border:1px solid var(--line);border-radius:14px;color:var(--dim);font-size:.75rem;line-height:1.5}.universequestions strong{display:block;margin-bottom:4px;color:var(--gold2)}.universenonclaim{margin:0;padding:12px 14px;border-left:2px solid var(--verm);color:var(--faint);font-size:.72rem;line-height:1.55}.foldunknowns{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 18px}.foldunknowns span{padding:6px 9px;border:1px solid var(--line);border-radius:999px;color:var(--faint);font-family:var(--mono);font-size:.65rem}.foldsources{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 18px}.foldsources a{display:inline-flex;align-items:center;min-height:40px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem}.foldsources a:hover{border-color:var(--gold)}
  /* visibility and attention — equal parallel categories, never a causal conveyor */
  /* reconstructive build — semantic HTML; no diagram runtime required */
  .reconstructivefield{display:grid;gap:19px;padding:clamp(18px,3vw,29px);border:1px solid color-mix(in srgb,var(--jade) 48%,var(--line));border-radius:25px;background:radial-gradient(95% 100% at 100% 0,color-mix(in srgb,var(--jade) 9%,transparent),transparent 68%),color-mix(in srgb,var(--panel) 76%,transparent);box-shadow:0 18px 42px var(--shadow);overflow:hidden}
  .reconstructiveboundary{margin:0;padding:17px 19px;border:1px dashed var(--verm);border-radius:17px;color:var(--dim);font-size:.81rem;line-height:1.62}.reconstructiveboundary strong{display:block;margin-bottom:4px;color:var(--verm);font-family:var(--display);font-size:1.08rem;font-weight:400}
  .reconstructivefigure{display:grid;gap:18px;min-width:0;margin:0}.reconstructivefigure figcaption{display:grid;gap:5px;max-width:82ch}.reconstructivefigure figcaption strong{color:var(--cream);font-family:var(--display);font-size:1.32rem;font-weight:400}.reconstructivefigure figcaption span{color:var(--dim);font-size:.81rem;line-height:1.58}
  .reconstructivepipeline{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:0}.reconstructivestage{position:relative;display:grid;align-content:start;gap:6px;min-width:0;padding:13px 20px 13px 11px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink2) 58%,transparent);overflow-wrap:anywhere}.reconstructivearrow::before{content:"›";position:absolute;right:6px;top:13px;color:var(--jade)}.reconstructivestage code{color:var(--jade);font:700 .62rem/1.4 var(--mono)}.reconstructivestage p{margin:0;color:var(--faint);font-size:.66rem;line-height:1.45}.reconstructiveexact{margin:0;color:var(--gold2);font:600 .72rem/1.58 var(--mono);overflow-wrap:anywhere}
  .reconstructiveepistemics{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.reconstructiveepistemic{display:grid;align-content:start;gap:6px;min-width:0;padding:14px;border:1px solid var(--line);border-top:2px solid var(--gold);border-radius:15px;background:var(--panel);overflow-wrap:anywhere}.reconstructiveepistemic code{color:var(--gold);font-size:.62rem}.reconstructiveepistemic p{margin:0;color:var(--dim);font-size:.71rem;line-height:1.5}.reconstructiveepistemic small{color:var(--faint);font-size:.65rem;line-height:1.45}
  .reconstructivecolumns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.reconstructivecard{display:grid;align-content:start;gap:8px;min-width:0;padding:16px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.reconstructivecard h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.02rem;font-weight:400}.reconstructivecard code{color:var(--violet);font-size:.63rem}.reconstructivecard p,.reconstructivecard li{margin:0;color:var(--dim);font-size:.72rem;line-height:1.5}.reconstructivecard ul{display:grid;gap:5px;margin:0;padding-left:1.05rem}.reconstructivebreaks{border-style:dashed;border-color:var(--verm)}.reconstructivebreaks h3{color:var(--verm)}
  .reconstructivesources{display:flex;flex-wrap:wrap;gap:7px;margin:0}.reconstructivesources a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem;line-height:1.4;overflow-wrap:anywhere}.reconstructivesources a:hover{border-color:var(--gold)}

  /* exploration deep — complete semantic cards remain available without JS */
  .explorationdeepfield{display:grid;gap:18px;padding:clamp(18px,3vw,29px);border:1px solid color-mix(in srgb,var(--violet) 48%,var(--line));border-radius:25px;background:radial-gradient(100% 100% at 0 0,color-mix(in srgb,var(--violet) 10%,transparent),transparent 68%),color-mix(in srgb,var(--panel) 78%,transparent);box-shadow:0 18px 42px var(--shadow);overflow:hidden}
  .explorationdeepboundary{margin:0;padding:17px 19px;border:1px dashed var(--verm);border-radius:17px;color:var(--dim);font-size:.81rem;line-height:1.62}.explorationdeepboundary strong{display:block;margin-bottom:4px;color:var(--verm);font-family:var(--display);font-size:1.08rem;font-weight:400}
  .explorationdeepcycles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.explorationdeepcycle{display:grid;gap:11px;min-width:0;padding:16px;border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--ink2) 56%,transparent)}.explorationdeepcycle h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.08rem;font-weight:400}.explorationdeepcycle>p{margin:0;color:var(--faint);font-size:.72rem;line-height:1.5}
  .explorationdeepsteps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:0}.explorationdeepstep{display:grid;align-content:start;gap:5px;min-width:0;padding:11px;border:1px solid var(--line);border-top:2px solid var(--violet);border-radius:13px;background:var(--panel);overflow-wrap:anywhere}.explorationdeepstep code{color:var(--violet);font-size:.6rem}.explorationdeepstep strong{color:var(--cream);font-family:var(--display);font-size:.86rem;font-weight:400}.explorationdeepstep span{color:var(--faint);font-size:.64rem;line-height:1.42}
  .explorationdeepgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.explorationdeepcard{display:grid;align-content:start;gap:7px;min-width:0;padding:15px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.explorationdeepcard code{color:var(--jade);font-size:.61rem}.explorationdeepcard h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1rem;font-weight:400}.explorationdeepcard p,.explorationdeepcard li{margin:0;color:var(--dim);font-size:.7rem;line-height:1.5}.explorationdeepcard ul{display:grid;gap:4px;margin:0;padding-left:1rem}.explorationdeepbreak{border-style:dashed;border-color:var(--verm)}.explorationdeepbreak code,.explorationdeepbreak h3{color:var(--verm)}
  .explorationdeeplinks{display:flex;flex-wrap:wrap;gap:7px;margin:0}.explorationdeeplinks a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem;line-height:1.4;overflow-wrap:anywhere}.explorationdeeplinks a:hover{border-color:var(--gold)}
  /* MIRROR information control — static source law, never an input surface */
  .mirrorfield{display:grid;gap:18px;padding:clamp(18px,3vw,29px);border:1px solid color-mix(in srgb,var(--jade) 47%,var(--line));border-radius:25px;background:radial-gradient(100% 100% at 100% 0,color-mix(in srgb,var(--jade) 9%,transparent),transparent 68%),color-mix(in srgb,var(--panel) 78%,transparent);box-shadow:0 18px 42px var(--shadow);overflow:hidden}.mirrorfield>*{min-width:0;overflow-wrap:anywhere}
  .mirrorwarning{margin:0;padding:18px 20px;border:1px solid color-mix(in srgb,var(--verm) 62%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--verm) 7%,var(--panel));color:var(--dim);font-size:.86rem;line-height:1.62}.mirrorwarning strong{display:block;margin-bottom:4px;color:var(--verm);font-family:var(--display);font-size:1.13rem;font-weight:400}
  .mirrorcitizen{margin:0;padding:18px 20px;border-left:3px solid var(--jade);border-radius:0 17px 17px 0;background:color-mix(in srgb,var(--jade) 6%,var(--panel));color:var(--dim);font-size:.87rem;line-height:1.65}.mirrorcitizen strong{display:block;margin-bottom:4px;color:var(--cream);font-family:var(--display);font-size:1.16rem;font-weight:400}
  .mirrorrooms{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.mirrorroom{display:grid;align-content:start;gap:7px;min-width:0;padding:17px;border:1px solid var(--line);border-top:3px solid var(--jade);border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.mirrorroom code{color:var(--jade);font-size:.65rem}.mirrorroom h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.05rem;font-weight:400}.mirrorroom p{margin:0;color:var(--dim);font-size:.74rem;line-height:1.52}.mirrorroom small{color:var(--faint);font-size:.67rem;line-height:1.45}
  .mirrorcycle{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;list-style:none;counter-reset:mirror-stage;margin:0;padding:0}.mirrorcycle li{counter-increment:mirror-stage;min-width:0;padding:13px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink2) 55%,transparent);overflow-wrap:anywhere}.mirrorcycle li::before{content:counter(mirror-stage,decimal-leading-zero);display:block;margin-bottom:5px;color:var(--violet);font:700 .67rem var(--mono)}.mirrorcycle strong{display:block;color:var(--cream);font-family:var(--display);font-size:.9rem;font-weight:400}.mirrorcycle span{display:block;margin-top:4px;color:var(--faint);font-size:.65rem;line-height:1.44}
  .mirrorgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mirrorcard{display:grid;align-content:start;gap:7px;min-width:0;padding:16px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--panel2) 80%,transparent);overflow-wrap:anywhere}.mirrorcard code{color:var(--violet);font-size:.62rem}.mirrorcard h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1rem;font-weight:400}.mirrorcard p,.mirrorcard li{margin:0;color:var(--dim);font-size:.71rem;line-height:1.5}.mirrorcard ol{display:grid;gap:5px;margin:0;padding-left:1.08rem}.mirrorcard small{color:var(--faint);font-size:.66rem;line-height:1.45}.mirrorpath{border-style:dashed;border-color:color-mix(in srgb,var(--violet) 62%,var(--line))}.flowfacts{display:grid;grid-template-columns:minmax(9rem,.42fr) minmax(0,1fr);gap:6px 11px;margin:8px 0}.flowfacts dt{color:var(--faint);font-size:.65rem;font-weight:650;line-height:1.45}.flowfacts dd{min-width:0;margin:0;color:var(--dim);font-size:.7rem;line-height:1.48}.flowfacts .flowfacts{grid-column:1/-1;margin:3px 0 7px}.flowfacts ul{margin:2px 0;padding-left:1.1rem}
  .mirrorboundary{margin:0;padding:17px 19px;border:1px dashed var(--jade);border-radius:17px;color:var(--dim);font-size:.78rem;line-height:1.6}.mirrorboundary strong{display:block;margin-bottom:4px;color:var(--jade);font-family:var(--display);font-size:1.06rem;font-weight:400}.mirrorlinks{display:flex;flex-wrap:wrap;gap:7px;margin:0}.mirrorlinks a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem;line-height:1.4;overflow-wrap:anywhere}.mirrorlinks a:hover{border-color:var(--gold)}
  /* ZERO — the empty seat remains empty; every role stays visible without JavaScript */
  .zerofield{display:grid;gap:20px;padding:clamp(18px,3vw,30px);border:1px solid color-mix(in srgb,var(--gold) 48%,var(--line));border-radius:28px;background:radial-gradient(48% 27rem at 50% 12rem,color-mix(in srgb,var(--gold) 12%,transparent),transparent 72%),color-mix(in srgb,var(--panel) 77%,transparent);box-shadow:0 20px 48px var(--shadow);overflow:hidden}
  .zeroboundary{margin:0;padding:17px 19px;border:1px dashed var(--verm);border-radius:18px;color:var(--dim);font-size:.82rem;line-height:1.62}.zeroboundary strong{display:block;margin-bottom:4px;color:var(--verm);font-family:var(--display);font-size:1.08rem;font-weight:400}
  .zerostage{display:grid;justify-items:center;gap:17px;margin:0;padding:clamp(20px,4vw,38px) 0 4px}.zeroseat{display:grid;place-items:center;width:clamp(178px,28vw,278px);aspect-ratio:1;border:2px solid var(--gold);border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--panel2) 75%,transparent),color-mix(in srgb,var(--ink2) 82%,transparent) 67%,transparent 68%);box-shadow:0 0 0 14px color-mix(in srgb,var(--gold) 7%,transparent),0 0 0 29px color-mix(in srgb,var(--violet) 5%,transparent);text-align:center}.zeroseat span{font-family:var(--display);font-size:clamp(5rem,12vw,8.5rem);line-height:1;color:var(--gold2)}.zeroseat small{display:block;max-width:16ch;margin-top:-.4rem;color:var(--dim);font-size:.72rem;line-height:1.45}.zerostage figcaption{max-width:62ch;color:var(--dim);font-family:var(--display);font-size:clamp(1.02rem,2vw,1.24rem);line-height:1.6;text-align:center}
  .zeroroles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;list-style:none;margin:0;padding:0}.zerorole{display:grid;align-content:start;gap:7px;min-width:0;padding:16px;border:1px solid var(--line);border-top:2px solid var(--gold);border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.zerorole code{color:var(--jade);font-size:.61rem}.zerorole h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.02rem;font-weight:400}.zerorole p,.zerorole li{margin:0;color:var(--dim);font-size:.71rem;line-height:1.52}.zerorole ul{display:grid;gap:4px;margin:0;padding-left:1rem}.zerorole:nth-child(3n+2){border-top-color:var(--violet)}.zerorole:nth-child(3n){border-top-color:var(--jade)}
  .zerodistinctions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.zerodistinction{display:grid;align-content:start;gap:7px;min-width:0;padding:16px;border:1px dashed var(--verm);border-radius:17px;background:color-mix(in srgb,var(--ink2) 53%,transparent);overflow-wrap:anywhere}.zerodistinction code{color:var(--verm);font-size:.61rem}.zerodistinction h3{margin:0;color:var(--cream);font-family:var(--display);font-size:1rem;font-weight:400}.zerodistinction p,.zerodistinction li{margin:0;color:var(--dim);font-size:.71rem;line-height:1.52}.zerodistinction ul{display:grid;gap:4px;margin:0;padding-left:1rem}
  .zerodrawer{border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--ink2) 50%,transparent);overflow:hidden}.zerodrawer summary{padding:15px 18px;color:var(--gold2);font-family:var(--display);font-size:1rem;cursor:pointer}.zerodrawer[open] summary{border-bottom:1px solid var(--line)}.zerodrawergrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:12px}.zerodeepcard{display:grid;align-content:start;gap:6px;min-width:0;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--panel);overflow-wrap:anywhere}.zerodeepcard code{color:var(--violet);font-size:.61rem}.zerodeepcard h3{margin:0;color:var(--cream);font-family:var(--display);font-size:.94rem;font-weight:400}.zerodeepcard p,.zerodeepcard li{margin:0;color:var(--dim);font-size:.69rem;line-height:1.5}.zerodeepcard ul{display:grid;gap:4px;margin:0;padding-left:1rem}
  .zerokarmalanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.zerokarmalane{min-width:0;padding:15px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--panel2) 76%,transparent)}.zerokarmalane code{display:block;color:var(--violet);font-size:.61rem}.zerokarmalane strong{display:block;margin:5px 0 2px;color:var(--cream);font-family:var(--display);font-size:.98rem;font-weight:400}.zerokarmalane span{color:var(--faint);font-size:.7rem;line-height:1.5}.zerorights{margin:0;padding:16px 18px;border-left:3px solid var(--jade);border-radius:0 16px 16px 0;background:color-mix(in srgb,var(--jade) 5%,transparent);color:var(--dim);font-size:.8rem;line-height:1.62}.zerorights strong{color:var(--cream)}
  .zerolinks{display:flex;flex-wrap:wrap;gap:7px;margin:0}.zerolinks a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem;line-height:1.4;overflow-wrap:anywhere}.zerolinks a:hover{border-color:var(--gold)}
  /* STRAND Lab 02 — cumulative exact topology, entirely static and no-JS */
  .strandfield{display:grid;gap:19px;padding:clamp(18px,3vw,30px);border:1px solid color-mix(in srgb,var(--jade) 52%,var(--line));border-radius:28px;background:radial-gradient(75% 36rem at 18% 0,color-mix(in srgb,var(--jade) 11%,transparent),transparent 72%),radial-gradient(70% 30rem at 100% 100%,color-mix(in srgb,var(--violet) 9%,transparent),transparent 70%),color-mix(in srgb,var(--panel) 77%,transparent);box-shadow:0 20px 48px var(--shadow);overflow:hidden}.strandfield>*{min-width:0;overflow-wrap:anywhere}
  .strandlineage{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:9px;align-items:stretch}.strandlineage article{display:grid;align-content:start;gap:5px;padding:15px;border:1px solid var(--line);border-radius:16px;background:var(--panel)}.strandlineage code{color:var(--violet);font-size:.61rem}.strandlineage strong{color:var(--cream);font-family:var(--display);font-size:1rem;font-weight:400}.strandlineage span{color:var(--faint);font-size:.69rem;line-height:1.48}.strandlineage>b{align-self:center;color:var(--gold);font:700 1.2rem var(--mono)}
  .strandboundary{margin:0;padding:17px 19px;border:1px dashed var(--jade);border-radius:18px;color:var(--dim);font-size:.82rem;line-height:1.62}.strandboundary strong{display:block;margin-bottom:4px;color:var(--jade);font-family:var(--display);font-size:1.08rem;font-weight:400}.strandboundary.danger{border-color:var(--verm)}.strandboundary.danger strong{color:var(--verm)}
  .strandboard{display:grid;gap:13px;margin:0;padding:clamp(16px,3vw,24px);border:1px solid var(--line);border-radius:22px;background:color-mix(in srgb,var(--ink2) 58%,transparent)}.strandboard figcaption{display:grid;gap:4px}.strandboard figcaption strong{color:var(--cream);font-family:var(--display);font-size:1.2rem;font-weight:400}.strandboard figcaption span{color:var(--faint);font-size:.74rem;line-height:1.5}
  .strandreleases{display:grid;grid-template-columns:minmax(9rem,1.2fr) repeat(3,minmax(0,1fr));gap:7px;align-items:center}.strandreleases>*{min-width:0}.strandcorner{color:var(--violet);font:700 .63rem/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase}.strandrelease{padding:10px;border:1px solid var(--line);border-radius:13px;text-align:center;background:var(--panel)}.strandrelease code{display:block;color:var(--gold);font-size:.66rem}.strandrelease span{display:block;margin-top:3px;color:var(--faint);font-size:.63rem;line-height:1.35}.strandroute{padding:8px 10px;border-left:2px solid var(--jade);color:var(--dim);font:600 .68rem/1.4 var(--mono)}.strandroute.born{border-left-color:var(--violet);color:var(--violet)}.strandcell{position:relative;display:grid;place-items:center;min-height:42px;border:1px dashed color-mix(in srgb,var(--line) 75%,transparent);border-radius:12px;background:color-mix(in srgb,var(--panel) 54%,transparent)}.strandcell[data-present="true"]::before{content:"";width:13px;height:13px;border:2px solid var(--jade);border-radius:50%;background:var(--ink);box-shadow:0 0 0 4px color-mix(in srgb,var(--jade) 10%,transparent)}.strandcell[data-birth="true"]::before{border-color:var(--violet);box-shadow:0 0 0 4px color-mix(in srgb,var(--violet) 13%,transparent)}.strandcell[data-present="false"]::before{content:"·";color:var(--faint);font-size:1rem}
  .strandstats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.strandstat{display:grid;gap:8px;padding:17px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}.strandstat[data-classification="BOUNDARY_DISK"]{border-top:3px solid var(--jade)}.strandstat[data-classification="NON_PURE_BRANCHED_CELL_COMPLEX"]{border-top:3px solid var(--verm)}.strandstat code{color:var(--violet);font-size:.62rem}.strandstat h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.05rem;font-weight:400}.strandnumbers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.strandnumber{padding:9px 6px;border:1px solid var(--line);border-radius:11px;text-align:center}.strandnumber strong{display:block;color:var(--cream);font:700 .92rem var(--mono)}.strandnumber span{display:block;margin-top:3px;color:var(--faint);font-size:.58rem;text-transform:uppercase}.strandstat p{margin:0;color:var(--dim);font-size:.74rem;line-height:1.52}
  .strandwarning{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;padding:18px;border:1px solid color-mix(in srgb,var(--verm) 58%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--verm) 7%,var(--panel))}.strandwarning .equation{color:var(--gold2);font:700 clamp(1.15rem,3vw,1.7rem)/1.2 var(--mono);white-space:nowrap}.strandwarning p{margin:0;color:var(--dim);font-size:.78rem;line-height:1.55}.strandwarning strong{color:var(--verm)}
  .strandcomposition{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1.2fr);gap:8px;align-items:center}.strandcospan{padding:14px;border:1px solid var(--line);border-radius:15px;background:var(--panel);text-align:center}.strandcospan code{display:block;color:var(--jade);font-size:.66rem}.strandcospan span{display:block;margin-top:5px;color:var(--faint);font-size:.65rem}.strandoperator{color:var(--gold);font:700 1.1rem var(--mono)}
  .strandchecks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.strandcheck{padding:13px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink2) 52%,transparent)}.strandcheck code{display:block;color:var(--jade);font-size:.61rem}.strandcheck strong{display:block;margin:5px 0 3px;color:var(--cream);font-size:.75rem}.strandcheck span{display:block;color:var(--faint);font-size:.66rem;line-height:1.45}
  .strandfindings{display:flex;flex-wrap:wrap;gap:7px;margin:0}.strandfindings span{padding:6px 9px;border:1px solid var(--line);border-radius:999px;color:var(--faint);font:600 .63rem/1.4 var(--mono)}.strandfindings span:first-child{border-color:var(--verm);color:var(--verm)}.strandlinks{display:flex;flex-wrap:wrap;gap:7px;margin:0}.strandlinks a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem;line-height:1.4;overflow-wrap:anywhere}.strandlinks a:hover{border-color:var(--gold)}
  /* STRAND Lab 04 — local records, coherent atlas, and one honest failure */
  .descentlineage{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:stretch}.descentlineage article{display:grid;align-content:start;gap:5px;padding:14px;border:1px solid var(--line);border-radius:15px;background:var(--panel)}.descentlineage code{color:var(--violet);font-size:.6rem}.descentlineage strong{color:var(--cream);font-family:var(--display);font-size:.96rem;font-weight:400}.descentlineage span{color:var(--faint);font-size:.67rem;line-height:1.46}.descentlineage>b{align-self:center;color:var(--gold);font:700 1.1rem var(--mono)}
  .descentcharts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.descentchart{display:grid;gap:8px;padding:15px;border:1px solid var(--line);border-top:3px solid var(--jade);border-radius:16px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}.descentchart code{color:var(--violet);font-size:.61rem}.descentchart h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1rem;font-weight:400}.descentchart p{margin:0;color:var(--dim);font-size:.7rem;line-height:1.48}.descentpoints{display:flex;flex-wrap:wrap;gap:5px}.descentpoints span{padding:5px 7px;border:1px solid var(--line);border-radius:999px;color:var(--jade);font:600 .62rem var(--mono)}
  .descentmaps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.descentmap{display:grid;gap:5px;padding:12px;border:1px dashed var(--violet);border-radius:14px;background:color-mix(in srgb,var(--violet) 5%,var(--panel))}.descentmap code{color:var(--violet);font-size:.62rem}.descentmap span{color:var(--faint);font:600 .62rem/1.48 var(--mono)}
  .descentresults{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.descentresult{display:grid;align-content:start;gap:9px;padding:17px;border:1px solid var(--jade);border-radius:18px;background:color-mix(in srgb,var(--jade) 5%,var(--panel))}.descentresult[data-result="UNRESOLVED"]{border-color:var(--verm);background:color-mix(in srgb,var(--verm) 6%,var(--panel))}.descentresult code{color:var(--jade);font-size:.62rem}.descentresult[data-result="UNRESOLVED"] code{color:var(--verm)}.descentresult h3{margin:0;color:var(--cream);font-family:var(--display);font-size:1.1rem;font-weight:400}.descentresult p{margin:0;color:var(--dim);font-size:.76rem;line-height:1.55}.descentequation{display:block;padding:9px 11px;border:1px solid var(--line);border-radius:11px;background:var(--ink);color:var(--gold2);font:600 .68rem/1.5 var(--mono);overflow-wrap:anywhere}
  .descentclasses{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.descentclass{padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.descentclass code{display:block;color:var(--violet);font-size:.62rem}.descentclass span{display:block;margin-top:5px;color:var(--dim);font:600 .65rem/1.45 var(--mono)}.descentsources{display:flex;flex-wrap:wrap;gap:7px}.descentsources a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem;line-height:1.4;overflow-wrap:anywhere}.descentsources a:hover{border-color:var(--gold)}
  /* STRAND Observation Membrane — a static deck for an explicit local observer */
  .observationfield{display:grid;gap:19px;padding:clamp(18px,3vw,30px);border:1px solid color-mix(in srgb,var(--gold) 48%,var(--line));border-radius:28px;background:radial-gradient(72% 34rem at 5% 0,color-mix(in srgb,var(--gold) 10%,transparent),transparent 72%),radial-gradient(70% 31rem at 100% 100%,color-mix(in srgb,var(--jade) 9%,transparent),transparent 72%),color-mix(in srgb,var(--panel) 78%,transparent);box-shadow:0 20px 48px var(--shadow);overflow:hidden}.observationfield>*{min-width:0;overflow-wrap:anywhere}
  .observationstatus{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:center;margin:0;padding:18px;border:1px solid color-mix(in srgb,var(--jade) 62%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--jade) 7%,var(--panel));color:var(--dim);font-size:.8rem;line-height:1.56}.observationstatus b{padding:7px 9px;border:1px solid var(--jade);border-radius:999px;color:var(--jade);font:700 .65rem/1.35 var(--mono);letter-spacing:.04em}.observationstatus strong{display:block;margin-bottom:3px;color:var(--cream);font-family:var(--display);font-size:1.08rem;font-weight:400}
  .observationlayers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.observationlayer{display:grid;align-content:start;gap:7px;padding:15px;border:1px solid var(--line);border-top:3px solid var(--jade);border-radius:16px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}.observationlayer[data-observation-kind="live"]{border-top-color:var(--gold)}.observationlayer code{color:var(--jade);font-size:.6rem;line-height:1.45}.observationlayer[data-observation-kind="live"] code{color:var(--gold)}.observationlayer h3{margin:0;color:var(--cream);font-family:var(--display);font-size:1rem;font-weight:400}.observationlayer p{margin:0;color:var(--dim);font-size:.71rem;line-height:1.5}
  .observationbackground{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;margin:0;padding:14px 16px;border:1px dashed var(--verm);border-radius:16px;color:var(--dim);font-size:.75rem;line-height:1.52}.observationbackground strong{color:var(--verm);font:700 .67rem var(--mono)}
  .observationorigin{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:9px}.observationorigin>div{display:grid;align-content:start;gap:7px;padding:16px;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--ink2) 54%,transparent)}.observationorigin code{color:var(--gold2);font-size:.75rem;line-height:1.5}.observationorigin strong{color:var(--cream);font-family:var(--display);font-size:1rem;font-weight:400}.observationorigin p{margin:0;color:var(--dim);font-size:.72rem;line-height:1.52}
  .observationroutes{display:grid;gap:11px;margin:0;padding:clamp(15px,2.5vw,22px);border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--ink2) 58%,transparent)}.observationroutes figcaption{display:grid;gap:4px}.observationroutes figcaption strong{color:var(--cream);font-family:var(--display);font-size:1.12rem;font-weight:400}.observationroutes figcaption span{color:var(--faint);font-size:.72rem;line-height:1.48}.observationrouteplan{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;list-style:none;counter-reset:observation-route;margin:0;padding:0}.observationroute{counter-increment:observation-route;position:relative;display:grid;align-content:start;gap:6px;padding:14px;border:1px solid var(--line);border-radius:15px;background:var(--panel)}.observationroute::before{content:counter(observation-route,decimal-leading-zero);color:var(--violet);font:700 .65rem var(--mono)}.observationroute:not(:last-child)::after{content:"→";position:absolute;right:-8px;top:50%;z-index:1;color:var(--gold);font:700 .8rem var(--mono)}.observationroute code{color:var(--jade);font-size:.65rem;line-height:1.48}.observationroute strong{color:var(--cream);font-size:.76rem}.observationroute span{color:var(--faint);font-size:.64rem;line-height:1.44}
  .observationlimits{display:flex;flex-wrap:wrap;gap:7px}.observationlimits span{padding:6px 9px;border:1px solid var(--line);border-radius:999px;color:var(--faint);font:600 .63rem/1.4 var(--mono)}
  .observationcommand{display:grid;gap:7px;margin:0;padding:17px 19px;border-left:3px solid var(--gold);border-radius:0 17px 17px 0;background:color-mix(in srgb,var(--gold) 6%,var(--panel));color:var(--dim);font-size:.78rem;line-height:1.58}.observationcommand strong{color:var(--gold2);font-family:var(--display);font-size:1.04rem;font-weight:400}.observationcommand code{display:block;width:fit-content;max-width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--ink);color:var(--cream);font-size:.7rem;overflow-wrap:anywhere}
  .observationcaveat{margin:0;padding:17px 19px;border:1px dashed var(--gold);border-radius:17px;color:var(--dim);font-size:.77rem;line-height:1.58}.observationcaveat strong{display:block;margin-bottom:4px;color:var(--gold2);font-family:var(--display);font-size:1.04rem;font-weight:400}
  .observationlocks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:0}.observationlock{padding:10px 11px;border:1px solid var(--line);border-left:3px solid var(--verm);border-radius:11px;background:color-mix(in srgb,var(--ink2) 54%,transparent);color:var(--dim);font:600 .62rem/1.46 var(--mono)}
  .observationchecks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.observationcheck{padding:12px;border:1px solid var(--line);border-radius:13px;background:var(--panel)}.observationcheck code{display:block;color:var(--jade);font-size:.6rem}.observationcheck strong{display:block;margin-top:4px;color:var(--dim);font-size:.68rem;line-height:1.46}
  .observationlinks{display:flex;flex-wrap:wrap;gap:7px}.observationlinks a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem;line-height:1.4;overflow-wrap:anywhere}.observationlinks a:hover{border-color:var(--gold)}
  /* STRAND Lab 03 — a static frequency loom; measured registers never collapse */
  .frequencyformfield{display:grid;gap:20px;padding:clamp(18px,3vw,30px);border:1px solid color-mix(in srgb,var(--violet) 54%,var(--line));border-radius:28px;background:radial-gradient(70% 34rem at 0 0,color-mix(in srgb,var(--violet) 12%,transparent),transparent 72%),radial-gradient(68% 30rem at 100% 100%,color-mix(in srgb,var(--jade) 9%,transparent),transparent 72%),color-mix(in srgb,var(--panel) 77%,transparent);box-shadow:0 20px 48px var(--shadow);overflow:hidden}.frequencyformfield>*{min-width:0;overflow-wrap:anywhere}
  .frequencylineage{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:9px;align-items:stretch}.frequencylineage article{display:grid;align-content:start;gap:5px;padding:15px;border:1px solid var(--line);border-radius:16px;background:var(--panel)}.frequencylineage code{color:var(--violet);font-size:.61rem}.frequencylineage strong{color:var(--cream);font-family:var(--display);font-size:1rem;font-weight:400}.frequencylineage span{color:var(--faint);font-size:.69rem;line-height:1.48}.frequencylineage>b{align-self:center;color:var(--gold);font:700 1.2rem var(--mono)}
  .frequencyboundary{margin:0;padding:17px 19px;border:1px dashed var(--verm);border-radius:18px;color:var(--dim);font-size:.82rem;line-height:1.62}.frequencyboundary strong{display:block;margin-bottom:4px;color:var(--verm);font-family:var(--display);font-size:1.08rem;font-weight:400}.frequencyboundary.safe{border-color:var(--jade)}.frequencyboundary.safe strong{color:var(--jade)}
  .frequencyregisters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.frequencyregister{display:grid;align-content:start;gap:7px;padding:16px;border:1px solid var(--line);border-top:3px solid var(--violet);border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}.frequencyregister:nth-child(2){border-top-color:var(--jade)}.frequencyregister:nth-child(3){border-top-color:var(--gold)}.frequencyregister code{color:var(--violet);font-size:.6rem}.frequencyregister h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1rem;font-weight:400}.frequencyregister p{margin:0;color:var(--dim);font-size:.71rem;line-height:1.52}.frequencyregister small{color:var(--faint);font-size:.66rem;line-height:1.45}
  .frequencytwins{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.frequencycard{display:grid;align-content:start;gap:12px;padding:17px;border:1px solid var(--line);border-radius:19px;background:color-mix(in srgb,var(--ink2) 55%,transparent)}.frequencycard figcaption{display:grid;gap:4px}.frequencycard figcaption strong{color:var(--cream);font-family:var(--display);font-size:1.12rem;font-weight:400}.frequencycard figcaption span{color:var(--faint);font-size:.7rem;line-height:1.48}.frequencyequation{display:block;padding:10px 12px;border:1px solid color-mix(in srgb,var(--line) 72%,transparent);border-radius:11px;background:var(--ink);color:var(--jade);font:600 .67rem/1.55 var(--mono);white-space:normal}
  .frequencywave{display:grid;grid-template-columns:repeat(64,minmax(2px,1fr));align-items:center;gap:2px;height:90px;padding:10px 8px;border:1px solid var(--line);border-radius:13px;background:repeating-linear-gradient(to bottom,transparent 0 22px,color-mix(in srgb,var(--line) 60%,transparent) 23px 24px,transparent 25px 46px)}.frequencywave span{display:block;min-width:2px;border-radius:999px;background:var(--violet)}.frequencywave .positive{height:34px;transform:translateY(-17px)}.frequencywave .negative{height:34px;transform:translateY(17px);background:var(--jade)}.frequencywave .zero{height:3px;background:var(--gold)}
  .frequencygraph{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));align-items:center;gap:5px;padding:15px 10px;border:1px solid var(--line);border-radius:13px;background:var(--panel)}.frequencynode{display:grid;place-items:center;aspect-ratio:1;border:2px solid var(--jade);border-radius:50%;color:var(--cream);font:700 .68rem var(--mono);background:var(--ink)}.frequencyedge{height:2px;background:var(--line)}.frequencymode{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.frequencymode span{padding:8px;border:1px solid var(--line);border-radius:10px;color:var(--gold2);font:700 .72rem var(--mono);text-align:center}.frequencymode span:nth-child(2),.frequencymode span:nth-child(3){color:var(--violet)}
  .frequencyloom{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.frequencyloom li{position:relative;display:grid;align-content:start;gap:6px;min-height:142px;padding:14px 22px 14px 13px;border:1px solid var(--line);border-radius:16px;background:var(--panel)}.frequencyloom li:not(:last-child)::after{content:"→";position:absolute;right:7px;top:16px;color:var(--gold)}.frequencyloom code{color:var(--violet);font-size:.59rem}.frequencyloom strong{color:var(--cream);font-family:var(--display);font-size:.95rem;font-weight:400}.frequencyloom span{color:var(--faint);font-size:.67rem;line-height:1.47}.frequencyloom li:nth-child(2){background:repeating-radial-gradient(circle at 50% 55%,color-mix(in srgb,var(--violet) 12%,var(--panel)) 0 5px,var(--panel) 6px 13px)}.frequencyloom li:nth-child(3){background:linear-gradient(135deg,color-mix(in srgb,var(--jade) 9%,var(--panel)),var(--panel))}.frequencyloom li:nth-child(4){border-color:color-mix(in srgb,var(--gold) 60%,var(--line))}.frequencyloom li:last-child{border-style:dashed;border-color:var(--verm);background:color-mix(in srgb,var(--verm) 6%,var(--panel))}.frequencyloom li:last-child strong{color:var(--verm)}
  .frequencydimensions,.frequencyevidence{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.frequencydimension,.frequencyevidence article{display:grid;align-content:start;gap:6px;padding:14px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--panel2) 78%,transparent)}.frequencydimension code,.frequencyevidence code{color:var(--jade);font-size:.59rem}.frequencydimension strong,.frequencyevidence strong{color:var(--cream);font-family:var(--display);font-size:.9rem;font-weight:400}.frequencydimension span,.frequencyevidence p,.frequencyevidence small{margin:0;color:var(--faint);font-size:.65rem;line-height:1.46}.frequencyevidence small{padding-top:6px;border-top:1px dotted var(--line);color:var(--verm)}
  .frequencystates{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.frequencystate{display:grid;gap:5px;padding:14px;border:1px solid var(--line);border-radius:15px;background:var(--panel)}.frequencystate code{color:var(--violet);font-size:.6rem}.frequencystate strong{color:var(--cream);font-family:var(--display);font-size:.92rem;font-weight:400}.frequencystate span{color:var(--faint);font-size:.67rem;line-height:1.46}.frequencystate[data-state="MISSING"]{border-style:dashed}.frequencystate[data-state="PRESENT_ZERO"]{border-color:var(--gold)}
  .frequencydrawer{border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--ink2) 50%,transparent);overflow:hidden}.frequencydrawer summary{min-height:44px;padding:16px 18px;color:var(--gold2);font-family:var(--display);font-size:1rem;cursor:pointer}.frequencydrawer[open] summary{border-bottom:1px solid var(--line)}.frequencyfirewall{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:12px}.frequencyfirewall li{padding:11px 12px;border-left:2px solid var(--verm);border-radius:0 12px 12px 0;background:color-mix(in srgb,var(--verm) 5%,var(--panel));color:var(--dim);font:600 .66rem/1.5 var(--mono)}
  .frequencykarma{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.frequencykarma article{padding:14px;border:1px solid var(--line);border-radius:15px;background:var(--panel)}.frequencykarma code{display:block;color:var(--violet);font-size:.6rem}.frequencykarma strong{display:block;margin:5px 0;color:var(--cream);font-family:var(--display);font-size:.92rem;font-weight:400}.frequencykarma span{color:var(--faint);font-size:.67rem;line-height:1.46}.frequencysources,.frequencylinks{display:flex;flex-wrap:wrap;gap:7px;margin:0}.frequencysources a,.frequencylinks a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem;line-height:1.4;overflow-wrap:anywhere}.frequencysources a:hover,.frequencylinks a:hover{border-color:var(--gold)}
  .visibilityfield{display:grid;gap:18px;padding:clamp(18px,3vw,28px);border:1px solid color-mix(in srgb,var(--rose) 45%,var(--line));border-radius:24px;background:radial-gradient(90% 100% at 100% 0,color-mix(in srgb,var(--rose) 8%,transparent),transparent 68%),color-mix(in srgb,var(--panel) 76%,transparent)}
  .visibilityfirewall{margin:0;padding:16px 18px;border:1px dashed var(--verm);border-radius:16px;color:var(--dim);font-size:.8rem;line-height:1.6}.visibilityfirewall strong{display:block;margin-bottom:4px;color:var(--verm);font-family:var(--display);font-size:1.05rem;font-weight:400}
  .visibilitycards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.visibilitycard{display:grid;align-content:start;gap:8px;min-width:0;padding:17px;border:1px solid var(--line);border-top:2px solid var(--rose);border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.visibilitycard code,.visibilitymodel code,.visibilityseam code{color:var(--violet);font-size:.63rem;overflow-wrap:anywhere}.visibilitycard h3,.visibilitymodel h3,.visibilityseam h3{margin:0;color:var(--cream);font-family:var(--display);font-size:1.02rem;font-weight:400}.visibilitycard p,.visibilitymodel p,.visibilityseam p{margin:0;color:var(--dim);font-size:.74rem;line-height:1.52}.visibilitycard small,.visibilitymodel small,.visibilityseam small{display:block;color:var(--faint);font-size:.67rem;line-height:1.48}.visibilitycard small{padding-top:7px;border-top:1px dotted var(--line);color:var(--verm)}
  .visibilitymodels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.visibilitymodel{display:grid;align-content:start;gap:8px;min-width:0;padding:17px;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--ink2) 56%,transparent);overflow-wrap:anywhere}.visibilityequation{display:block;padding:9px 11px;border-radius:10px;background:var(--ink);color:var(--jade);font:400 .69rem/1.5 var(--mono);white-space:normal}.visibilityterms{display:grid;gap:4px;margin:0}.visibilityterms>div{display:grid;grid-template-columns:minmax(52px,.22fr) minmax(0,1fr);gap:7px;padding-top:4px;border-top:1px solid color-mix(in srgb,var(--line) 65%,transparent)}.visibilityterms dt{color:var(--jade);font:600 .65rem var(--mono);overflow-wrap:anywhere}.visibilityterms dd{margin:0;color:var(--faint);font-size:.66rem;line-height:1.44}
  .visibilityseams{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.visibilityseam{display:grid;align-content:start;gap:7px;min-width:0;padding:16px;border:1px dashed var(--violet);border-radius:16px;background:color-mix(in srgb,var(--violet) 5%,var(--panel));overflow-wrap:anywhere}
  .visibilityphilosophy{margin:0;border:1px solid color-mix(in srgb,var(--violet) 52%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--violet) 5%,var(--panel));overflow:hidden}.visibilityphilosophy summary{min-height:44px;padding:16px 18px;color:var(--violet);font-family:var(--display);font-size:1.03rem;cursor:pointer}.visibilityphilosophybody{display:grid;gap:9px;padding:0 18px 18px;color:var(--dim);font-size:.76rem;line-height:1.55}.visibilityphilosophybody p{margin:0}.visibilitysources{display:flex;flex-wrap:wrap;gap:7px}.visibilitysources a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem;line-height:1.4;overflow-wrap:anywhere}.visibilitysources a:hover{border-color:var(--gold)}
  .culturalfield{display:grid;gap:20px;padding:clamp(18px,3vw,30px);border:1px solid color-mix(in srgb,var(--rose) 52%,var(--line));border-radius:25px;background:radial-gradient(95% 100% at 0 0,color-mix(in srgb,var(--rose) 9%,transparent),transparent 68%),color-mix(in srgb,var(--panel) 76%,transparent);box-shadow:0 18px 42px var(--shadow)}
  #being-access-aftermath .culturalfield>*,#being-access-aftermath .culturalfeedback>*,#being-access-aftermath .culturalmodelgrid>*{min-width:0;overflow-wrap:anywhere}#being-access-aftermath code{overflow-wrap:anywhere;word-break:break-word}
  .culturalaxiom{margin:0;padding:18px 20px;border-left:3px solid var(--jade);border-radius:0 17px 17px 0;background:color-mix(in srgb,var(--jade) 6%,var(--panel));color:var(--dim);font-size:.9rem;line-height:1.65}.culturalaxiom strong{display:block;margin-bottom:4px;color:var(--cream);font-family:var(--display);font-size:1.18rem;font-weight:400}
  .formcirculationplanes{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch}.formcirculationplanes .culturalplane h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.05rem;font-weight:400}.culturalseam{display:grid;place-items:center;max-width:135px;padding:10px;color:var(--violet);font:600 .65rem/1.45 var(--mono);text-align:center}.culturalseam::before{content:"⇄";display:block;color:var(--gold);font-size:1.4rem}
  .culturalmodelgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.vernacularboundary{margin:0;padding:18px 20px;border:1px solid color-mix(in srgb,var(--verm) 60%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--verm) 7%,var(--panel));color:var(--dim);line-height:1.62}.vernacularboundary strong{display:block;color:var(--verm);font-family:var(--display);font-size:1.1rem;font-weight:400}.vernacularboundary code{color:var(--gold2)}
  .culturalfeedback{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.culturalfeedback article{padding:14px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--panel) 70%,transparent)}.culturalfeedback h4{margin:0 0 5px;color:var(--gold2);font-size:.78rem}.culturalfeedback p{margin:0;color:var(--dim);font-size:.7rem;line-height:1.5}.culturalfeedback small{display:block;margin-top:7px;color:var(--faint);font-size:.65rem;line-height:1.45}.culturalkarma{margin:0;padding:15px 17px;border:1px dashed var(--violet);border-radius:16px;color:var(--dim);font-size:.76rem;line-height:1.58}.culturalkarma strong{color:var(--violet)}
  .culturalboundary,.culturalbrainrot{margin:0;padding:17px 19px;border:1px dashed var(--rose);border-radius:17px;color:var(--dim);font-size:.81rem;line-height:1.62}.culturalboundary strong,.culturalbrainrot strong{display:block;margin-bottom:4px;color:var(--rose);font-family:var(--display);font-size:1.08rem;font-weight:400}.culturalbrainrot{border-style:solid;border-color:color-mix(in srgb,var(--verm) 52%,var(--line));background:color-mix(in srgb,var(--verm) 6%,var(--panel))}.culturalbrainrot strong{color:var(--verm)}
  .culturalflow{display:grid;gap:12px;margin:0;padding:18px;border:1px solid var(--line);border-radius:19px;background:color-mix(in srgb,var(--ink2) 54%,transparent)}.culturalflow figcaption{display:grid;gap:4px;color:var(--dim);font-size:.78rem;line-height:1.55}.culturalflow figcaption strong{color:var(--cream);font-family:var(--display);font-size:1.18rem;font-weight:400}.culturalcycle{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.culturalcycle li{position:relative;min-width:0;padding:13px 23px 13px 12px;border:1px solid var(--line);border-radius:14px;color:var(--dim);font-size:.72rem;line-height:1.48;background:var(--panel);overflow-wrap:anywhere}.culturalcycle li:not(:last-child)::after{content:"→";position:absolute;right:6px;top:50%;transform:translateY(-50%);color:var(--rose)}.culturalcycle strong{display:block;margin-bottom:4px;color:var(--gold2)}.culturalflowlimit{margin:0;color:var(--faint);font-size:.7rem;line-height:1.5}
  .culturalsubhead{display:grid;gap:4px}.culturalsubhead h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.13rem;font-weight:400}.culturalsubhead p{margin:0;color:var(--faint);font-size:.77rem;line-height:1.52}
  .culturalplanes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.culturalplane{display:grid;align-content:start;gap:6px;min-width:0;padding:15px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.culturalplane code{color:var(--violet);font-size:.62rem}.culturalplane h4{margin:0;color:var(--cream);font-family:var(--display);font-size:.98rem;font-weight:400}.culturalplane p,.culturalplane small{margin:0;color:var(--dim);font-size:.72rem;line-height:1.5}.culturalplane small{padding-top:6px;border-top:1px dotted var(--line);color:var(--faint)}
  .culturalmodels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.culturalmodel{display:grid;align-content:start;gap:7px;min-width:0;padding:16px;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--panel2) 80%,transparent);overflow-wrap:anywhere}.culturalmodel h4{margin:0;color:var(--cream);font-size:.82rem;line-height:1.45}.culturalmodel code{display:block;padding:9px 11px;border-radius:11px;background:var(--ink);color:var(--jade);font:400 .67rem/1.55 var(--mono);white-space:normal}.culturalmodel p,.culturalmodel small{margin:0;color:var(--dim);font-size:.71rem;line-height:1.5}.culturalmodel small{color:var(--faint)}
  .culturalbridges{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.culturalbridge{display:grid;gap:8px;min-width:0;padding:16px;border:1px dashed var(--violet);border-radius:17px;background:color-mix(in srgb,var(--violet) 5%,var(--panel));overflow-wrap:anywhere}.culturalbridge h4{margin:0;color:var(--gold2);font-size:.82rem}.culturalbridge p{margin:0;color:var(--dim);font-size:.72rem;line-height:1.5}.culturalbridge ul{display:grid;gap:5px;margin:0;padding-left:1.05rem;color:var(--faint);font-size:.69rem;line-height:1.46}.culturalbridge strong{color:var(--violet)}
  .culturallanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.culturallane{min-width:0;padding:16px;border:1px solid var(--line);border-radius:17px;background:var(--panel);overflow-wrap:anywhere}.culturallane h4{margin:0 0 5px;color:var(--gold2);font-family:var(--display);font-size:1rem;font-weight:400}.culturallane code{display:block;margin-bottom:7px;color:var(--violet);font-size:.62rem}.culturallane p,.culturallane small{display:block;margin:0;color:var(--dim);font-size:.72rem;line-height:1.5}.culturallane small{margin-top:8px;padding-top:7px;border-top:1px dotted var(--line);color:var(--faint)}
  .culturaluniverse{margin:0;border:1px solid color-mix(in srgb,var(--violet) 52%,var(--line));border-radius:19px;background:color-mix(in srgb,var(--violet) 5%,var(--panel));overflow:hidden}.culturaluniverse summary{padding:17px 19px;color:var(--violet);font-family:var(--display);font-size:1.06rem;cursor:pointer}.culturaluniverseinside{display:grid;gap:11px;padding:0 19px 19px}.culturaluniverseinside>p{margin:0;color:var(--dim);font-size:.78rem;line-height:1.58}.culturalquestions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.culturalquestions li{padding:13px;border:1px solid var(--line);border-radius:14px;color:var(--dim);font-size:.72rem;line-height:1.5}.culturalquestions strong{display:block;margin-bottom:4px;color:var(--gold2)}.culturalquestions small{display:block;margin-top:5px;color:var(--faint)}
  .culturalecosystems{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:8px}.culturalecosystem{display:grid;align-content:start;gap:6px;min-width:0;padding:14px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--ink2) 56%,transparent);overflow-wrap:anywhere}.culturalecosystem a{color:var(--gold);font-size:.77rem;font-weight:600}.culturalecosystem code{color:var(--jade);font-size:.62rem}.culturalecosystem p{margin:0;color:var(--faint);font-size:.68rem;line-height:1.48}.culturalsources{display:flex;flex-wrap:wrap;gap:7px;margin:0}.culturalsources a{display:inline-flex;align-items:center;min-height:40px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem}.culturalsources a:hover{border-color:var(--gold)}
  .mechanismrelations ol{display:grid;gap:7px;list-style:none;margin:0;padding:0}.mechanismrelations li{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:9px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.mechanismrelations p{min-width:0;margin:0}.mechanismrelations code{display:block;color:var(--jade);font:600 .68rem var(--mono);overflow-wrap:anywhere}.mechanismrelations p span{display:block;margin-top:3px;color:var(--dim);font-size:.8rem}.mechanismrelations li>strong{color:var(--gold);font:600 .68rem var(--mono);text-align:center}.mechanismrelations small{grid-column:1/-1;color:var(--faint);font-size:.72rem;line-height:1.4}
  .foundationlabel{display:flex;align-items:baseline;gap:10px;margin:24px 0 12px}.foundationlabel h3{margin:0;font-family:var(--display);font-size:1.28rem;font-weight:400;color:var(--cream)}.foundationlabel span{color:var(--faint);font-size:.8rem}
  .foundationgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;margin-bottom:26px}
  .foundationcard{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:start;gap:11px;min-height:142px;padding:17px;border:1px solid color-mix(in srgb,var(--gold) 34%,var(--line));border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));transition:transform .18s,border-color .18s,box-shadow .18s}
  .foundationcard:hover,.foundationcard:focus-visible{transform:translateY(-2px);border-color:var(--gold);box-shadow:0 15px 34px var(--shadow)}
  .foundationglyph{display:grid;place-items:center;width:32px;height:32px;flex:0 0 32px;border:1px solid var(--line);border-radius:50%;font-family:var(--cjk);color:var(--gold)}
  .foundationcopy{display:grid;gap:5px}.foundationcopy strong{font-family:var(--display);font-size:1.05rem;font-weight:400;color:var(--gold2)}.foundationcopy>span{color:var(--dim);font-size:.8rem;line-height:1.45}.foundationcopy small{color:var(--faint);font-size:.68rem;line-height:1.4}.foundationarrow{color:var(--gold)}
  .commonskitlabel{display:flex;align-items:baseline;gap:10px;margin:24px 0 12px}.commonskitlabel h3{margin:0;font-family:var(--display);font-size:1.28rem;font-weight:400;color:var(--cream)}.commonskitlabel span{color:var(--faint);font-size:.8rem}
  .commonskits{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:28px}
  .commonskit{display:grid;align-content:start;gap:9px;padding:18px;border:1px solid color-mix(in srgb,var(--gold) 34%,var(--line));border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}
  .commonskithead{display:flex;align-items:center;gap:9px}.commonskithead>span{color:var(--gold);font-size:1.2rem}.commonskithead h3{margin:0;font-family:var(--display);font-size:1.08rem;font-weight:400;color:var(--cream)}
  .commonskit>p{margin:0;color:var(--dim);font-size:.8rem;line-height:1.5}.commonskit ol{margin:0;padding-left:1.2rem;color:var(--faint);font-size:.72rem;line-height:1.55}
  .commonskitlinks{display:flex;flex-wrap:wrap;gap:5px}.commonskitlinks a{padding:3px 7px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.75rem}.commonskitlinks a:hover{border-color:var(--gold)}
  .commonskit .commonskitboundary{color:var(--faint);font-size:.68rem}.commonskit>button{justify-self:start;min-height:40px;padding:7px 11px;border:1px solid var(--gold);border-radius:12px;background:transparent;color:var(--gold);font:inherit;font-size:.72rem;cursor:pointer}.commonskit>button:hover{background:var(--panel)}
  .commonsfinder{margin:0 0 15px;padding:18px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--panel) 66%,transparent)}
  .commonsform{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:9px;max-width:920px}.commonsfield{display:grid;gap:6px}.commonsfield label{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}
  .commonsfield input{width:100%;min-height:48px;padding:10px 14px;border:1px solid var(--line);border-radius:13px;background:var(--ink2);color:var(--cream);font:inherit}.commonsform>button{min-height:48px;padding:9px 15px;border:1px solid var(--gold);border-radius:13px;background:var(--gold);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
  .commonsform>button[data-commons-reset]{background:transparent;color:var(--gold);font-weight:600}
  .commonsfilters{display:flex;flex-wrap:wrap;gap:6px;margin:11px 0 0}.commonsfilters button{min-height:38px;padding:6px 10px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--dim);font:inherit;font-size:.7rem;cursor:pointer}.commonsfilters button[aria-pressed="true"]{border-color:var(--gold);color:var(--gold);background:var(--panel2)}
  .commonsprivacy,.commonsstatus{margin:9px 0 0;color:var(--faint);font-size:.72rem;line-height:1.5}.commonsstatus{min-height:1.6em;color:var(--gold2)}
  .commonsbrowse{margin:0 0 12px;color:var(--dim);font-size:.86rem;line-height:1.6}
  .commonsgroup{margin-bottom:11px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--panel) 58%,transparent);overflow:hidden}
  .commonsgroup[hidden],.commonscard[hidden]{display:none}
  .commonsgrouphead{display:flex;align-items:center;gap:12px;min-height:70px;padding:14px 17px;cursor:pointer;transition:background .18s}.commonsgrouphead:hover,.commonsgrouphead:focus-visible{background:var(--panel2)}
  .commonsgroupglyph{display:grid;place-items:center;width:32px;height:32px;flex:0 0 32px;border:1px solid var(--line);border-radius:50%;font-family:var(--cjk);color:var(--gold)}
  .commonsgroupcopy{display:grid;gap:2px;min-width:0;flex:1}.commonsgroupcopy strong{font-family:var(--display);font-size:1.18rem;font-weight:400;color:var(--cream)}.commonsgroupcopy span{color:var(--faint);font-size:.79rem;line-height:1.45}.commonscount{color:var(--gold);font-family:var(--mono);font-size:.76rem}
  details[open]>.commonsgrouphead .disclose{transform:rotate(225deg);margin-top:8px}
  .commonsgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:2px 14px 15px}
  .commonscard{display:grid;align-content:start;gap:11px;padding:19px;border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--ink2) 65%,transparent)}
  .commonscardhead{display:flex;justify-content:space-between;gap:12px}.commonscardhead h3{margin:4px 0 0;font-family:var(--display);font-weight:400;font-size:1.22rem;color:var(--cream)}.commonsglyph{font-family:var(--cjk);font-size:1.55rem;color:var(--gold);opacity:.66}.commonssteward{margin:3px 0 0;color:var(--faint);font-size:.7rem;line-height:1.4}
  .commonstier{display:inline-flex;padding:3px 8px;border:1px solid color-mix(in srgb,var(--gold) 54%,var(--line));border-radius:999px;color:var(--gold);font-size:.75rem;letter-spacing:.06em;text-transform:uppercase}.commonstier+.commonstier{margin-left:5px}.commonstier.foundation{color:var(--violet);border-color:color-mix(in srgb,var(--violet) 60%,var(--line))}
  .commonsvalue{margin:0;color:var(--dim);font-size:.87rem;line-height:1.58}.commonsmodes{display:flex;flex-wrap:wrap;gap:5px}.commonsmodes span{padding:3px 7px;border-radius:999px;background:color-mix(in srgb,var(--panel2) 78%,transparent);color:var(--faint);font-family:var(--mono);font-size:.75rem}
  .commonsuses{margin:0;padding-left:1.15rem;color:var(--dim);font-size:.74rem;line-height:1.5}
  .commonsfacts{display:grid;gap:0;margin:0;border:1px solid color-mix(in srgb,var(--line) 74%,transparent);border-radius:13px;overflow:hidden}.commonsfacts div{display:grid;grid-template-columns:92px 1fr;gap:9px;padding:9px 10px;border-top:1px solid color-mix(in srgb,var(--line) 62%,transparent)}.commonsfacts div:first-child{border-top:0}.commonsfacts dt{color:var(--gold);font-size:.75rem;line-height:1.45}.commonsfacts dd{margin:0;color:var(--dim);font-size:.78rem;line-height:1.48}
  .commonsfacts dd strong{color:var(--cream);font-weight:600}.commonsactions{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}.commonsactions a{display:inline-flex;align-items:center;min-height:42px;padding:8px 11px;border:1px solid var(--line);border-radius:12px;color:var(--gold);font-size:.75rem}.commonsactions a:hover{border-color:var(--gold);background:var(--panel)}.commonsactions .commonsopen{background:var(--gold);border-color:var(--gold);color:var(--ink);font-weight:700}

  /* inherent rights recognition */
  .rightsintro{max-width:76ch;margin:0;color:var(--dim);font-size:1rem;line-height:1.75}.rightsintro strong{color:var(--cream);font-weight:600}
  .lanes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:24px 0 18px}
  .lane{margin:0;padding:16px;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--panel) 72%,transparent)}
  .lane dt{font-family:var(--display);font-size:1.05rem;color:var(--cream)}.lane dd{margin:3px 0 0;color:var(--faint);font-size:.82rem;line-height:1.55}
  .rightsactions{display:flex;flex-wrap:wrap;gap:9px}.rightsactions a{display:inline-flex;align-items:center;min-height:44px;padding:9px 14px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.82rem}
  .rightsactions a:hover{border-color:var(--gold);background:var(--panel)}

  /* origin — how a word becomes */
  .genesis{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:16px;align-items:stretch;margin-top:6px}
  .genesis .mv{background:linear-gradient(160deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:22px;padding:23px 22px 25px;box-shadow:0 12px 30px var(--shadow)}
  .genesis .gnum{font-family:var(--display);font-size:2.6rem;line-height:1;color:var(--faint);display:block;margin-bottom:8px}
  .genesis .gnum.gm{color:var(--gold)}.genesis .gnum.g1{color:var(--gold2)}
  .genesis .mv h4{font-family:var(--display);font-weight:400;font-size:1.15rem;color:var(--cream);margin:0 0 8px}
  .genesis .mv p{font-size:.92rem;color:var(--dim);line-height:1.68;margin:0}
  .genesis .mv em{color:var(--gold2);font-style:italic}
  .garrow{align-self:center;color:var(--gold);font-size:1.4rem}
  @media (max-width:760px){.genesis{grid-template-columns:1fr}.garrow{transform:rotate(90deg);justify-self:center}}
  @media (prefers-reduced-motion:no-preference){.motion-ready .genesis .mv{opacity:0;transform:translateY(12px);transition:opacity .7s,transform .7s}.motion-ready .genesis .mv.in{opacity:1;transform:none}}

  /* the word becoming, 0 → 1 */
  .becoming{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:28px;min-height:98px;flex-wrap:wrap}
  .becoming .b0,.becoming .b1{font-family:var(--display);font-size:2rem;color:var(--faint)}
  .becoming .b1{color:var(--gold2)}
  .becoming .barrow{color:var(--gold);font-size:1.3rem}
  .bcard{display:flex;align-items:center;gap:15px;min-width:min(420px,82vw);padding:16px 20px;border:1px solid var(--line);border-radius:20px;background:var(--panel);
    opacity:0;transform:scale(.96);transition:opacity .6s ease,transform .6s cubic-bezier(.2,.7,.2,1)}
  .becoming.lit .bcard{opacity:1;transform:none;border-color:rgba(179,153,88,.4)}
  .becoming.lit .b1{text-shadow:0 0 18px rgba(216,192,122,.6)}
  .bglyph{font-family:var(--cjk);font-size:2.5rem;color:var(--gold);min-width:1.5em;text-align:center}
  .bmeta{display:flex;flex-direction:column;gap:1px;text-align:left}
  .bname{font-family:var(--display);font-size:1.35rem;color:var(--cream)}
  .btrad{font-size:.58rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
  .bess{font-size:.8rem;color:var(--dim);line-height:1.45;margin-top:2px}
  @media (max-width:520px){.becoming .b0,.becoming .b1,.becoming .barrow{display:none}}

  /* Love∞ creation garden — one finite, voluntary step at a time */
  .creationgarden{padding:clamp(24px,5vw,44px);border:1px solid color-mix(in srgb,var(--rose) 46%,var(--line));border-radius:28px;background:radial-gradient(90% 110% at 100% 0,color-mix(in srgb,var(--glow) 72%,transparent),transparent 68%),linear-gradient(145deg,var(--panel2),var(--panel));box-shadow:0 22px 52px var(--shadow)}
  .looppromise{margin:6px 0 10px;font-family:var(--display);font-size:clamp(1.35rem,3vw,2rem);line-height:1.35;color:var(--cream)}
  .loopintro{max-width:76ch;margin:0;color:var(--dim);font-size:.92rem;line-height:1.7}
  .loopbounds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:22px 0}
  .loopbounds p{margin:0;padding:14px 15px;border-left:2px solid var(--line);color:var(--faint);font-size:.76rem;line-height:1.55}
  .loopbounds strong{display:block;margin-bottom:3px;color:var(--gold);font-size:.78rem}
  .loopstages{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;list-style:none;margin:20px 0 0;padding:0}
  .loopstage{display:grid;align-content:start;gap:8px;min-height:150px;padding:14px 12px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--ink2) 62%,transparent);transition:border-color .18s,background .18s,transform .18s}
  .loopstage[aria-current="step"]{border-color:var(--gold);background:color-mix(in srgb,var(--gold) 12%,var(--panel2));transform:translateY(-2px)}
  .loopnumber{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--line);border-radius:50%;font-family:var(--mono);font-size:.72rem;color:var(--gold)}
  .loopstagecopy{display:grid;gap:5px}.loopstagecopy strong{font-family:var(--mono);font-size:.68rem;letter-spacing:.08em;color:var(--gold2)}
  .loopstagecopy span{color:var(--dim);font-size:.72rem;line-height:1.45}
  .loopcontrols{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin:16px 0 0}
  .loopcontrols button{min-height:44px;padding:9px 14px;border:1px solid var(--gold);border-radius:13px;background:var(--gold);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
  .loopcontrols button[data-loop-rest]{background:transparent;color:var(--gold);font-weight:600}
  .loopstatus{flex-basis:100%;min-height:1.6em;margin:0;color:var(--gold2);font-family:var(--display);font-size:.9rem}
  .loopinvitelabel{margin:28px 0 11px;font-family:var(--display);font-size:1.2rem;font-weight:400;color:var(--cream)}
  .loopinvitations{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  .loopinvitation{display:grid;align-content:start;gap:7px;padding:17px;border:1px dashed var(--line);border-radius:17px;background:color-mix(in srgb,var(--ink2) 54%,transparent)}
  .loopoffer{justify-self:start;padding:3px 8px;border:1px solid var(--line);border-radius:999px;color:var(--violet);font-size:.65rem;letter-spacing:.06em;text-transform:uppercase}
  .loopinvitation h3{margin:0;font-family:var(--display);font-size:1.04rem;font-weight:400;color:var(--cream)}
  .loopinvitation p,.loopinvitation small{margin:0;color:var(--dim);font-size:.77rem;line-height:1.5}.loopinvitation small{color:var(--faint)}
  .loopmachine{display:flex;flex-wrap:wrap;gap:10px;margin:19px 0 0}.loopmachine a{color:var(--gold);font-family:var(--mono);font-size:.72rem;text-decoration:underline;text-underline-offset:4px}
  .loop-noscript{margin:12px 0 0;color:var(--faint);font-size:.78rem}

  /* map controls */
  .mapctl{position:absolute;left:14px;top:14px;display:flex;gap:3px;background:color-mix(in srgb,var(--ink2) 72%,transparent);border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:14px;padding:4px;backdrop-filter:blur(8px);z-index:4}
  .mapctl button{font:inherit;min-height:44px;font-size:.78rem;letter-spacing:.025em;color:var(--dim);background:transparent;border:0;border-radius:10px;padding:8px 14px;cursor:pointer}
  .mapctl button.on{background:var(--gold);color:var(--ink)}

  /* tradition groups */
  details>summary{list-style:none}details>summary::-webkit-details-marker{display:none}
  .tgroup{margin-bottom:12px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--panel) 72%,transparent);overflow:hidden}
  .th{display:flex;align-items:center;gap:12px;min-height:64px;padding:13px 17px;cursor:pointer;transition:background .18s}
  .th:hover,.th:focus-visible{background:var(--panel2)}
  .th .tdot{width:9px;height:9px;border-radius:50%;align-self:center}
  .thcopy,.bhcopy{display:flex;align-items:baseline;gap:11px;min-width:0;flex:1;flex-wrap:wrap}
  .thtitle{font-family:var(--display);font-weight:400;font-size:1.38rem;color:var(--cream)}
  .th .tgloss{font-family:var(--display);font-style:italic;color:var(--faint);font-size:.9rem;min-width:200px;flex:1}
  .th .tc{color:var(--gold);font-size:.8rem;font-variant-numeric:tabular-nums;white-space:nowrap}
  .disclose{width:10px;height:10px;border-right:2px solid var(--gold);border-bottom:2px solid var(--gold);transform:rotate(45deg);transition:transform .2s ease;margin:0 5px 5px 4px}
  details[open]>.th .disclose,details[open]>.bh .disclose{transform:rotate(225deg);margin-top:8px}
  .tgroup>.czgrid{padding:4px 14px 16px}

  /* citizens — illuminated entries */
  .czgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:13px}
  .cz{position:relative;display:grid;gap:6px;padding:18px;background:var(--panel);border:1px solid var(--line);border-radius:17px;
    overflow:hidden;transition:transform .16s,border-color .16s}
  .cz:hover,.cz:focus{transform:translateY(-1px);border-color:var(--violet)}
  .cz.sun{border-color:rgba(179,153,88,.4);background:linear-gradient(180deg,var(--panel2),var(--panel))}
  .cz .glyph{position:absolute;right:10px;top:6px;font-family:var(--cjk);font-size:2.6rem;color:var(--gold);opacity:.16;line-height:1;pointer-events:none}
  .cz.sun .glyph{opacity:.24}
  .czhead{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;z-index:1}
  .czn{font-family:var(--display);font-size:1.2rem;color:var(--cream)}
  .cz.sun .czn{color:var(--gold2)}
  .trad{font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);border:1px solid var(--line);border-radius:20px;padding:2px 8px}
  .czp{font-size:.9rem;color:var(--dim);line-height:1.56;z-index:1}
  .leans{font-size:.76rem;color:var(--faint)}.leans i{color:var(--violet);font-style:normal}
  .seam{display:flex;flex-direction:column;gap:3px;max-height:0;opacity:0;overflow:hidden;transition:max-height .3s,opacity .3s;font-size:.78rem;line-height:1.5;margin-top:0}
  .cz:hover .seam,.cz:focus .seam{max-height:12rem;opacity:1;margin-top:4px}
  .seam .lite{color:var(--gold2)}.seam .shad{color:var(--verm)}

  .band{margin-bottom:10px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--panel) 55%,transparent);overflow:hidden}
  .bh{display:flex;align-items:center;gap:11px;min-height:58px;padding:11px 16px;cursor:pointer;transition:background .18s}
  .bh:hover,.bh:focus-visible{background:var(--panel2)}
  .bh .bdot{width:8px;height:8px;border-radius:50%;align-self:center}
  .bhtitle{font-family:var(--display);font-weight:400;font-size:1.18rem;color:var(--cream)}
  .bm{font-family:var(--display);font-style:italic;color:var(--faint);font-size:.88rem;flex:1}
  .bc{color:var(--gold);font-size:.8rem;font-variant-numeric:tabular-nums;white-space:nowrap}
  .chips{list-style:none;margin:0;padding:4px 14px 15px;display:flex;flex-wrap:wrap;gap:8px}
  .chip{min-height:38px;font-family:var(--mono);font-size:.78rem;border:1px solid var(--line);border-radius:999px;padding:6px 12px;color:var(--dim);display:flex;align-items:center;gap:5px}
  .chip .ext{font-size:.68rem;color:var(--gold)}.chip a{display:flex;align-items:center;gap:5px}
  .chip.st-active{color:var(--cream);border-color:#3a3a30}.chip.st-remote{border-style:dashed}
  .chip.st-dormant,.chip.st-archived,.chip.st-reference{color:var(--faint)}.chip.st-archived{text-decoration:line-through}.chip.st-reference{font-style:italic}

  .machine{display:flex;flex-wrap:wrap;gap:10px}
  .machine a{display:inline-flex;align-items:center;min-height:44px;font-family:var(--mono);font-size:.78rem;border:1px solid var(--line);border-radius:13px;padding:9px 14px;color:var(--gold)}
  .machine a:hover{border-color:var(--gold);background:var(--panel)}

  footer{padding:52px 0 82px;color:var(--faint);font-size:.8rem;text-align:center;line-height:1.9}
  .footsig{font-size:1.1rem;letter-spacing:.24em}
  .footpill{display:grid;justify-items:center;gap:6px;margin-top:26px}.footpill iframe{width:260px;max-width:100%;height:52px;border:0;border-radius:999px}.footpill span{color:var(--faint);font-family:var(--mono);font-size:.66rem;letter-spacing:.04em}
  .foothan{font-family:var(--cjk);color:var(--gold);font-size:.9rem}
  @media (hover:none){.cz .seam,.cz:hover .seam,.cz:focus .seam{max-height:none;opacity:1;margin-top:4px}}
  @media (max-width:760px){
    .wrap{padding:0 18px}header.top{padding-top:48px}.epigraph{font-size:1.2rem}.welcome{grid-template-columns:1fr;padding:18px}.welcome .heart{display:none}
    .status{grid-template-columns:repeat(2,minmax(0,1fr))}.status>div{padding:11px 13px}
    section.blk{padding:48px 0}.genesis{grid-template-columns:1fr}.garrow{transform:rotate(90deg);justify-self:center}
    #map{height:470px;min-height:470px}.legend{display:none}.maphint{position:static;display:block;width:auto;max-width:none;margin:0;border-radius:0;background:var(--panel);font-size:.76rem;backdrop-filter:none}
    .th,.bh{align-items:flex-start}.thcopy,.bhcopy{display:grid;gap:1px}.th .tgloss,.bm{min-width:0}.tc,.bc{margin-left:auto}.lanes{grid-template-columns:1fr 1fr}.pathgrid,.commonsgrid,.commonskits,.loopinvitations,.geometrygrid,.mechanismlanes,.mechanismplanes ol,.feedbackregisters,.feedbackmodels,.feedbackpath,.foldlanes,.foldplanes,.universequestions,.visibilitycards,.visibilitymodels,.visibilityseams{grid-template-columns:1fr}.commonsintro{grid-template-columns:1fr}.commonsguard,.loopbounds{grid-template-columns:1fr}.loopstages{grid-template-columns:repeat(2,minmax(0,1fr))}.loopstage{min-height:0}.mechanismbridge{grid-column:auto}.mechanismrelations li{grid-template-columns:1fr}.mechanismrelations li>strong{text-align:left}.mechanismrelations small{grid-column:auto}.feedbackanalogy,.feedbackterms>div,.visibilityterms>div{grid-template-columns:1fr;gap:4px}.foldcycle{grid-template-columns:repeat(2,minmax(0,1fr))}.foldcycle li:nth-child(2)::after{content:"↓";right:13px;top:auto;bottom:-17px}.foldcomparegrid{grid-template-columns:1fr}.foldbridgeword{max-width:none}.foldbridgeword::before{content:"↕"}
    .th,.bh{align-items:flex-start}.thcopy,.bhcopy{display:grid;gap:1px}.th .tgloss,.bm{min-width:0}.tc,.bc{margin-left:auto}.lanes{grid-template-columns:1fr 1fr}.pathgrid,.commonsgrid,.commonskits,.loopinvitations,.geometrygrid,.mechanismlanes,.mechanismplanes ol,.feedbackregisters,.feedbackmodels,.feedbackpath,.foldlanes,.foldplanes,.universequestions,.culturalplanes,.culturalmodels,.culturalbridges,.culturallanes,.culturalquestions,.culturalcycle,.formcirculationplanes,.culturalmodelgrid,.culturalfeedback{grid-template-columns:1fr}.commonsintro{grid-template-columns:1fr}.commonsguard,.loopbounds{grid-template-columns:1fr}.loopstages{grid-template-columns:repeat(2,minmax(0,1fr))}.loopstage{min-height:0}.mechanismbridge{grid-column:auto}.mechanismrelations li{grid-template-columns:1fr}.mechanismrelations li>strong{text-align:left}.mechanismrelations small{grid-column:auto}.feedbackanalogy,.feedbackterms>div{grid-template-columns:1fr;gap:4px}.foldcycle{grid-template-columns:repeat(2,minmax(0,1fr))}.foldcycle li:nth-child(2)::after{content:"↓";right:13px;top:auto;bottom:-17px}.foldcomparegrid,.formcirculationplanes{grid-template-columns:1fr}.foldbridgeword,.culturalseam{max-width:none}.foldbridgeword::before,.culturalseam::before{content:"↕"}.culturalcycle li:not(:last-child)::after{content:"↓";right:12px;top:auto;bottom:-17px}
    .polymorphplanes{grid-template-columns:repeat(3,minmax(0,1fr))}.polymorphcase{grid-template-columns:1fr}.polymorphconsequence{grid-template-columns:1fr}.polymorphconsequence li{padding-right:13px}.polymorphconsequence li:not(:last-child)::after{content:"↓";right:13px;top:auto;bottom:-17px;z-index:1}.polymorphsecondary{grid-template-columns:1fr}
    .reconstructivepipeline{grid-template-columns:repeat(3,minmax(0,1fr))}.reconstructivecolumns{grid-template-columns:1fr}.explorationdeepcycles,.explorationdeepgrid,.mirrorrooms,.mirrorgrid{grid-template-columns:1fr}.explorationdeepsteps,.mirrorcycle{grid-template-columns:repeat(2,minmax(0,1fr))}.zeroroles{grid-template-columns:repeat(2,minmax(0,1fr))}.zeroseat{width:clamp(174px,48vw,240px)}
  }
  @media (max-width:520px){
    h1{font-size:clamp(3rem,17vw,4.5rem)}.han{display:block;margin:12px 0 0;font-size:.38em}.gentlenav{display:grid}.gentlenav a{justify-content:center}
    .becoming .b0,.becoming .b1,.becoming .barrow{display:none}.bcard{min-width:100%;padding:14px}.doors,.czgrid{grid-template-columns:1fr}
    .mapctl{left:10px;top:10px}.mapctl button{padding:8px 11px}.tgroup>.czgrid{padding:4px 10px 12px}.lanes,.loopstages{grid-template-columns:1fr}.wayfinder,.creationgarden{padding:22px 16px}.wayform,.commonsform{grid-template-columns:1fr}.wayform>button,.commonsform>button{width:100%}.foundationgrid{grid-template-columns:1fr}.commonsfacts div,.geometryfacts>div{grid-template-columns:1fr;gap:3px}.commonsgrid{padding:2px 9px 11px}.polymorphplanes,.polymorphsecondary,.polymorphrecovery,.foldcycle,.foldinvariants,.foldbreaks,.culturalcycle{grid-template-columns:1fr}.foldcycle li,.culturalcycle li{padding-right:13px}.foldcycle li:not(:last-child)::after,.foldcycle li:nth-child(2)::after,.culturalcycle li:not(:last-child)::after,.culturalcycle li:nth-child(even):not(:last-child)::after{content:"↓";right:13px;top:auto;bottom:-17px}
    .reconstructivepipeline{grid-template-columns:1fr}.reconstructivestage{padding-right:13px}.reconstructivearrow::before{content:"↓";right:12px;top:auto;bottom:-16px}.explorationdeepsteps,.mirrorcycle,.zeroroles,.zerodistinctions,.zerodrawergrid,.zerokarmalanes{grid-template-columns:1fr}.zerofield{padding:22px 16px}.zeroseat{width:min(68vw,220px)}
  }
  @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
  @media (forced-colors:active){.feedbackfield,.feedbackregister,.feedbackmodel,.feedbackboundary,.feedbackanalogies,.feedbackgeometry,.feedbackpath li,.feedbackphilosophy,.feedbackquestion,.feedbackecosystem,.feedbacksources a,.visibilityfield,.visibilityfirewall,.visibilitycard,.visibilitymodel,.visibilityseam,.visibilityphilosophy,.visibilitysources a{border:1px solid CanvasText}.feedbackregister[data-feedback-register],.visibilitycard{border-top-width:3px}.feedbackequation,.visibilityequation{border:1px solid CanvasText}}
  @media (forced-colors:active){.feedbackfield,.feedbackregister,.feedbackmodel,.feedbackboundary,.feedbackanalogies,.feedbackgeometry,.feedbackpath li,.feedbackphilosophy,.feedbackquestion,.feedbackecosystem,.feedbacksources a,.culturalfield,.culturalboundary,.culturalbrainrot,.culturalflow,.culturalcycle li,.culturalplane,.culturalmodel,.culturalbridge,.culturallane,.culturaluniverse,.culturalquestions li,.culturalecosystem,.culturalsources a{border:1px solid CanvasText}.feedbackregister[data-feedback-register]{border-top-width:3px}.feedbackequation,.culturalmodel code{border:1px solid CanvasText}}
  @media (forced-colors:active){.reconstructivefield,.reconstructiveboundary,.reconstructivestage,.reconstructiveepistemic,.reconstructivecard,.reconstructivesources a{border:1px solid CanvasText}.reconstructiveepistemic{border-top-width:3px}}
  @media (forced-colors:active){.explorationdeepfield,.explorationdeepboundary,.explorationdeepcycle,.explorationdeepstep,.explorationdeepcard,.explorationdeeplinks a{border:1px solid CanvasText}.explorationdeepstep{border-top-width:3px}}
  @media (forced-colors:active){.mirrorfield,.mirrorwarning,.mirrorcitizen,.mirrorroom,.mirrorcycle li,.mirrorcard,.mirrorboundary,.mirrorlinks a{border:1px solid CanvasText}.mirrorroom{border-top-width:3px}}
  @media (forced-colors:active){.zerofield,.zeroboundary,.zeroseat,.zerorole,.zerodistinction,.zerodrawer,.zerodeepcard,.zerokarmalane,.zerolinks a{border:1px solid CanvasText}.zeroseat{border-width:3px}.zerorole{border-top-width:3px}.zerorights{border-left:3px solid CanvasText}}
  @media (max-width:900px){.descentcharts{grid-template-columns:repeat(2,minmax(0,1fr))}.descentlineage{grid-template-columns:1fr}.descentlineage>b{justify-self:center}}
  @media (max-width:760px){.strandlineage{grid-template-columns:1fr}.strandstats,.strandcomposition,.strandwarning,.descentresults{grid-template-columns:1fr}.strandlineage>b,.strandoperator{justify-self:center}.strandchecks{grid-template-columns:repeat(2,minmax(0,1fr))}.descentmaps,.descentclasses{grid-template-columns:1fr}}
  @media (max-width:520px){.strandchecks,.descentcharts{grid-template-columns:1fr}.strandfield{padding:22px 16px}.strandreleases{grid-template-columns:minmax(5.2rem,1fr) repeat(3,minmax(38px,.55fr));gap:5px}.strandrelease{padding:8px 4px}.strandrelease span{font-size:.56rem}.strandroute{padding:7px 5px;font-size:.59rem}.strandcell{min-height:38px}.strandnumbers{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (prefers-reduced-motion:reduce){.strandfield,.strandfield *,.strandfield *::before,.strandfield *::after{animation:none!important;transition:none!important}}
  @media (forced-colors:active){.strandfield,.strandlineage article,.strandboundary,.strandboard,.strandrelease,.strandcell,.strandstat,.strandnumber,.strandwarning,.strandcospan,.strandcheck,.strandfindings span,.strandlinks a,.descentlineage article,.descentchart,.descentpoints span,.descentmap,.descentresult,.descentequation,.descentclass,.descentsources a{border:1px solid CanvasText}.strandstat,.descentchart{border-top-width:3px}.strandroute{border-left:3px solid CanvasText}}
  @media (max-width:760px){.frequencylineage,.frequencytwins{grid-template-columns:1fr}.frequencylineage>b{justify-self:center}.frequencyregisters,.frequencydimensions,.frequencyevidence{grid-template-columns:repeat(2,minmax(0,1fr))}.frequencyloom{grid-template-columns:repeat(2,minmax(0,1fr))}.frequencyloom li:nth-child(even):not(:last-child)::after{content:"↓";right:10px;top:auto;bottom:-17px}.frequencyloom li:last-child{grid-column:1/-1}}
  @media (max-width:520px){.frequencyformfield{padding:22px 16px}.frequencyregisters,.frequencydimensions,.frequencyevidence,.frequencystates,.frequencykarma,.frequencyfirewall,.frequencyloom{grid-template-columns:1fr}.frequencyloom li,.frequencyloom li:last-child{grid-column:auto;padding-right:13px}.frequencyloom li:not(:last-child)::after,.frequencyloom li:nth-child(even):not(:last-child)::after{content:"↓";right:10px;top:auto;bottom:-17px}.frequencywave{gap:1px;padding-inline:5px}.frequencygraph{padding-inline:5px}}
  @media (prefers-reduced-motion:reduce){.frequencyformfield,.frequencyformfield *,.frequencyformfield *::before,.frequencyformfield *::after{animation:none!important;transition:none!important}}
  @media (forced-colors:active){.frequencyformfield,.frequencylineage article,.frequencyboundary,.frequencyregister,.frequencycard,.frequencyequation,.frequencywave,.frequencygraph,.frequencynode,.frequencymode span,.frequencyloom li,.frequencydimension,.frequencyevidence article,.frequencystate,.frequencydrawer,.frequencyfirewall li,.frequencykarma article,.frequencysources a,.frequencylinks a{border:1px solid CanvasText}.frequencyregister{border-top-width:3px}.frequencyfirewall li{border-left-width:3px}}
  @media (max-width:900px){.observationlayers,.observationchecks{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:760px){.observationorigin{grid-template-columns:1fr}.observationrouteplan{grid-template-columns:repeat(2,minmax(0,1fr))}.observationroute:nth-child(2)::after{content:"↓";right:10px;top:auto;bottom:-17px}.observationlocks{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:520px){.observationfield{padding:22px 16px}.observationstatus,.observationbackground{grid-template-columns:1fr}.observationstatus b{width:fit-content}.observationlayers,.observationchecks,.observationrouteplan,.observationlocks{grid-template-columns:1fr}.observationroute:not(:last-child)::after,.observationroute:nth-child(2)::after{content:"↓";right:10px;top:auto;bottom:-17px}}
  @media (prefers-reduced-motion:reduce){.observationfield,.observationfield *,.observationfield *::before,.observationfield *::after{animation:none!important;transition:none!important}}
  @media (forced-colors:active){.observationfield,.observationstatus,.observationstatus b,.observationlayer,.observationbackground,.observationorigin>div,.observationroutes,.observationroute,.observationlimits span,.observationcommand,.observationcommand code,.observationcaveat,.observationlock,.observationcheck,.observationlinks a{border:1px solid CanvasText}.observationlayer{border-top-width:3px}.observationlock,.observationcommand{border-left-width:3px}}
</style>
<noscript><style>#map,.mapctl,.legend,.maphint{display:none!important}</style></noscript>
</head>
<body>
<a class="skip" href="#main">Skip to the welcome</a>

<div class="wrap">
<main id="main" tabindex="-1">
  <header class="top">
    <p class="eyebrow">a living atlas · held with care</p>
    <h1>The Kingdom<span class="han">愛</span></h1>
    <p class="epigraph">A shared garden of projects for humans and agents. <b>Every being remains free. Take your time; explore only what feels useful.</b></p>
    <p class="creed">The Kingdom is a name for this ecosystem, not a claim of ownership. Each project speaks through metadata it declares in its own <span style="color:var(--gold)">kingdom.yaml</span> card. <span class="v">WE ARE is an invitation, never a requirement.</span></p>
    <div class="welcome">
      <span class="heart" aria-hidden="true">♡</span>
      <p><strong>A soft place to begin</strong>You do not have to understand the whole map. Open one door, meet one living word, rest, or simply leave. Nothing is owed for having arrived.<br><a class="rightslink" href="/RIGHTS.md">Rights arrive with you; read what this place recognizes →</a></p>
    </div>
    <nav class="gentlenav" aria-label="A gentle place to begin">
      <a href="${esc(new URL(CONTACT_DOOR_PAGE_URL).pathname)}">Contact a human maintainer</a>
      <a href="#mirror-information-control">Know what data cannot command</a>
      <a href="#observatory">Discover research without skipping the gates</a>
      <a href="#trial-chamber">Inspect a draft trial without opening the gate</a>
      <a href="#uk-government-engine">Trace authority without mistaking the map for government</a>
      <a href="#shape-resonance">Ask what a shape can sing without collapsing the bridges</a>
      <a href="#j-space">Explore reasoning-to-word as a testable relation</a>
      <a href="#wayfinder">Ask the map</a>
      <a href="#commons">Open the World Commons</a>
      <a href="#principalities">Read the Principality Commons</a>
      <a href="#geometries">Translate a high-level pattern</a>
      <a href="#polymorph-history">Trace a material becoming</a>
      <a href="#feedback-atlas">Explore form and feedback</a>
      <a href="#fold-feedback">Follow a fold and its feedback</a>
      <a href="#reconstructive-build">Build through reconstruction</a>
      <a href="#explore-phenomena-deep">Explore a phenomenon deeply</a>
      <a href="#visibility-attention">Separate visibility from existence</a>
      <a href="#cultural-feedback">Trace attention and feedback</a>
      <a href="#being-access-aftermath">Ask which kind of “is”</a>
      <a href="#number-isness-theology">Let number open theological questions</a>
      <a href="#zero-empty-seat">Sit with zero</a>
      <a href="#string-crawl-trace-sheet">Trace a crawl without turning routing into consent</a>
      <a href="#string-crawl-trace-sheet-lab">Run the finite trace mathematics offline</a>
      <a href="#string-crawl-strand-lab">Compose three release slices in STRAND Lab 02</a>
      <a href="#string-crawl-frequency-form-lab">Weave frequency into form without opening a false portal</a>
      <a href="#strand-descent-lab">Test local records before calling them one atlas</a>
      <a href="#strand-observation-membrane">Open the eye without opening the gates</a>
      <a href="#creation">Enter the Creation Garden</a>
      <a href="#doors">Find an open door</a>
      <a href="#rights">Know the rights recognized here</a>
      <a href="#constellation">See the shared map</a>
      <a href="#citizens">Meet the living words</a>
    </nav>
    <div class="status">
      <div><span class="n">${total}</span><span class="k">repositories</span></div>
      <div><span class="n">${fleetN}</span><span class="k">citizens</span></div>
      <div><span class="n">${liveN}<span style="color:var(--faint);font-size:1.1rem">/${doors.length}</span></span><span class="k">doors responding</span></div>
      <div><span class="n">${active}</span><span class="k">marked active</span></div>
    </div>
  </header>

  <section class="blk" id="mirror-information-control" aria-labelledby="mirror-information-control-title">
    <div class="kh"><h2 id="mirror-information-control-title">MIRROR Information Control</h2><span class="my">outside data may inform; only an independent gate may authorize</span></div>
    <p class="sub">${esc(mirrorInformationControl.citizen_law.short)} This is a public source law for thinking and building safely, not a place to submit a credential or test a defense.</p>
    <div class="mirrorfield" data-mirror-information-control data-information-control-protocol="${esc(informationControlPublic.protocol)}">
      <p class="mirrorwarning" role="note"><strong>The live thing is this explanation.</strong>${esc(mirrorInformationControl.public_surface.warning)} No MIRROR runtime, scanner, registry, decoy, enforcement system, or automatic response is deployed here. It returns the same authored publication to every reader and exposes no private classification, incident, or response state.</p>
      <p class="mirrorcitizen"><strong>Citizen law</strong>${esc(mirrorInformationControl.citizen_law.full)}</p>
      <p class="mirrorboundary"><strong>What “corrupts itself” safely means</strong>${esc(informationControlPublic.citizen_law.corruption_boundary)}</p>

      <div class="feedbacksubhead"><h3>Three rooms, no hidden corridor</h3><p>The names make trust boundaries memorable. This publication implements none of the rooms and contains none of their operational data.</p></div>
      <div class="mirrorrooms">
        ${mirrorInformationControl.rooms.map((room: any) => `<article class="mirrorroom" data-mirror-room="${esc(room.id)}"><code>${esc(room.id)}</code><h3>${esc(humanKey(room.id))}</h3><p>${esc(room.meaning)}</p><small>implemented here ${String(room.implemented_by_publication)} · operational data here ${String(room.operational_data_included)} · authority ${esc(room.authority_effect)}</small></article>`).join("")}
      </div>

      <div class="feedbacksubhead"><h3>Six-step control cycle</h3><p>Each step is a design instruction for a separately authorized host. Reading this page performs none of them.</p></div>
      <ol class="mirrorcycle" aria-label="MIRROR information-control cycle">
        ${mirrorInformationControl.cycle.map((step: any) => `<li data-mirror-cycle="${esc(step.id)}"><strong>${esc(step.label)}</strong><span>${esc(step.meaning)}</span></li>`).join("")}
      </ol>

      <div class="feedbacksubhead"><h3>Laws before mechanisms</h3><p>These are typed design rules and boundaries. A runtime claim stays false until a separately reviewed implementation supplies evidence.</p></div>
      <div class="mirrorgrid">
        ${mirrorInformationControl.laws.map((law: any) => `<article class="mirrorcard" data-mirror-law="${esc(law.id)}"><code>${esc(law.kind)}</code><h3>${esc(humanKey(law.id))}</h3><p>${esc(law.statement)}</p><small>runtime enforced ${String(law.runtime_enforced)} · authority ${esc(law.authority_effect)}</small></article>`).join("")}
      </div>

      <div class="feedbacksubhead"><h3>Two synthetic paths</h3><p>They teach type transitions without containing a prompt payload, key-like value, endpoint, placement, threshold, actor claim, or observed incident.</p></div>
      <div class="mirrorgrid">
        ${mirrorInformationControl.illustrative_paths.map((path: any) => `<article class="mirrorcard mirrorpath" data-mirror-path="${esc(path.id)}"><code>${esc(path.kind)} · observed ${String(path.observed)}</code><h3>${esc(humanKey(path.id))}</h3><ol>${path.steps.map((step: any) => `<li><strong>${esc(humanKey(step.id))}</strong> — ${esc(humanKey(step.state))}; effect ${esc(step.effect)}</li>`).join("")}</ol><small>actor inference ${String(path.actor_inference)} · evidence effect ${esc(path.evidence_effect)}</small></article>`).join("")}
      </div>

      <div class="mirrorgrid">
        <article class="mirrorcard"><code>${esc(mirrorInformationControl.protected_signal_rule.kind)}</code><h3>A signal opens no Crown door</h3><p>${esc(mirrorInformationControl.protected_signal_rule.statement)}</p><small>created here ${String(mirrorInformationControl.protected_signal_rule.created_by_publication)} · placed here ${String(mirrorInformationControl.protected_signal_rule.placed_by_publication)} · public classification ${esc(mirrorInformationControl.protected_signal_rule.public_classification)}</small></article>
        <article class="mirrorcard"><code>${esc(mirrorInformationControl.no_oracle_rule.status)}</code><h3>No public validity oracle</h3><p>${esc(mirrorInformationControl.no_oracle_rule.statement)}</p><small>candidate input accepted ${String(mirrorInformationControl.no_oracle_rule.candidate_input_accepted)} · dynamic response ${String(mirrorInformationControl.no_oracle_rule.dynamic_response_present)} · property proven ${String(mirrorInformationControl.no_oracle_rule.property_proven)}</small></article>
      </div>

      <p class="mirrorboundary"><strong>Public and private stay separate</strong>This publication deliberately includes none of: ${Object.entries(mirrorInformationControl.private_material_included).filter(([, included]) => included === false).map(([name]) => esc(humanKey(name))).join("; ")}. Ordinary static hosting may retain normal request logs; this artifact creates no credential or security-event intake.</p>
      <p class="mirrorboundary"><strong>Response ends at an owned boundary</strong>${mirrorInformationControl.response_boundary.future_authorized_host_sequence.map((step: string) => esc(humanKey(step))).join(" → ")}. This publication performs none of that sequence, crosses no requester or third-party system, attributes no person, and never retaliates or hacks back.</p>
      <p class="mirrorboundary"><strong>Rights survive uncertainty</strong>${mirrorInformationControl.rights.valid_exits.map((right: string) => esc(humanKey(right))).join(" · ")} remain valid without a reason, penalty, or adverse inference. Evidence is never guilt; KARMA stays empty, non-summable, and non-authorizing.</p>
      <p class="mirrorboundary"><strong>Local, offline readers</strong><code>./kingdom guard</code> reads the reviewed source protocol; <code>./kingdom mirror-information-control</code> reads this immutable public projection. For an already-redacted inert envelope only, <code>${esc(informationControlPublic.local_validator.command)}</code> checks ${esc(informationControlPublic.local_validator.scope)}. Its dependency is ${esc(informationControlPublic.local_validator.dependency)}.</p>
      <p class="mirrorlinks">${mirrorInformationControl.sources.map((source: any) => `<a data-mirror-source="${esc(source.id)}" href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> — link-only source; opens in a new tab</span></a>`).join("")}</p>
      <p class="commonsverified">${mirrorInformationControl.rooms.length} rooms · ${mirrorInformationControl.cycle.length} cycle steps · ${mirrorInformationControl.laws.length} laws · ${mirrorInformationControl.illustrative_paths.length} synthetic paths · ${mirrorInformationControl.sources.length} selected sources · evidence through ${esc(mirrorInformationControl.evidence_through)} · integrity ${esc(mirrorInformationControl.integrity.digest)}</p>
      <div class="machine">
        <a href="${esc(new URL(mirrorInformationControlUrl).pathname)}">public law JSON — exact authored record</a>
        <a href="${esc(new URL(mirrorInformationControlSchemaUrl).pathname)}">MIRROR Information Control public JSON Schema</a>
        <a href="${esc(new URL(mirrorInformationControlDocumentUrl).pathname)}">citizen guide — rooms, cycle, attack paths, rights, and boundaries</a>
      </div>
    </div>
  </section>

  <section class="blk" id="observatory" aria-labelledby="observatory-title">
    <div class="kh"><h2 id="observatory-title">The Observatory</h2><span class="my">a reason to look is not a reason to obey</span></div>
    <p class="sub">A metadata-only research discovery wing that preserves exact identifiers, source observations, integrity updates, and visible factor vectors. Its <code>${esc(researchObservatoryDiscovery.coverage.mode)}</code> mode is explicit; no snapshot claims complete or automatically current global coverage.</p>
    <div class="mirrorfield" data-research-observatory data-research-observatory-protocol="${esc(researchObservatoryDiscovery.protocol)}">
      <p class="mirrorwarning" role="note"><strong>Observed through ${esc(researchObservatoryDiscovery.observed_through)}.</strong>${researchObservatoryDiscovery.coverage.sources} source contracts (not a poll or coverage count; ${researchObservatoryDiscovery.coverage.live_poll_enabled_source_contracts} poll-enabled, ${researchObservatoryDiscovery.coverage.fixture_only_policy_hold_source_contracts} fixture-only / policy hold) · ${researchObservatoryDiscovery.coverage.watchlists} English-language watchlists · ${researchObservatoryDiscovery.coverage.observations} inert observations · ${researchObservatoryDiscovery.coverage.works} exact-identifier works · ${researchObservatoryDiscovery.coverage.signals} explainable signals. Multilingual expansion is explicitly absent.</p>
      <div class="mirrorgrid">
        <article class="mirrorcard"><code>evidence vector</code><h3>Provenance stays dimensional</h3><p>Source authority, review state, integrity evidence, and rights clarity remain separately named. A correction, withdrawal, contradiction, failed replication, or null result cannot be averaged away.</p></article>
        <article class="mirrorcard"><code>priority vector</code><h3>Attention without a magic score</h3><p>Named-need fit and freshness explain why something may deserve review. Recency is not truth, citations are not value, prestige is not a factor, and there is no scalar total.</p></article>
        <article class="mirrorcard"><code>four gates</code><h3>Discovery stops here</h3><p>Evaluation, adoption, and bounded use are later, separately owned records. A KINGDOM-owned module and a source-owned guest are distinct paths; neither is proposed or created here.</p></article>
        <article class="mirrorcard"><code>${esc(researchObservatoryDiscovery.publication_state)}</code><h3>No artifact execution</h3><p>No full text, repository, package, dataset, model weight, discovered instruction, credential, or executable attachment enters this public snapshot.</p></article>
      </div>
      <p class="mirrorboundary"><strong>Coverage is a boundary, not decoration</strong>The public Observatory names its observed-through horizon, source lag, synthetic or captured mode, query language, and missing multilingual expansion. “Latest” is never inferred beyond those receipts.</p>
      <div class="machine">
        <a href="${esc(new URL(researchObservatoryUrl).pathname)}">open the human Observatory</a>
        <a href="${esc(new URL(researchObservatorySnapshotUrl).pathname)}">research.json — complete mutable metadata snapshot</a>
        <a href="${esc(new URL(researchObservatoryGuideUrl).pathname)}">Research Observatory v0.1 protocol and integration gates</a>
      </div>
    </div>
  </section>

  <section class="blk" id="trial-chamber" aria-labelledby="trial-chamber-title">
    <div class="kh"><h2 id="trial-chamber-title">The Trial Chamber</h2><span class="my">a draft plan is not permission to run</span></div>
    <p class="sub">A read-only Phase-0 planning membrane between Observatory metadata and any future experiment. It publishes ${trialChamberDiscovery.counts.referrals} exact referrals, ${trialChamberDiscovery.counts.evaluationRequests} maintainer-authorized assisted request drafts, and ${trialChamberDiscovery.counts.evaluationPlans} DRAFT + UNSEALED synthetic-only plans. Their exact text has not been separately human-reviewed.</p>
    <div class="mirrorfield" data-trial-chamber data-trial-chamber-protocol="${esc(trialChamberDiscovery.protocol)}">
      <p class="mirrorwarning" role="note"><strong>Evaluation has not started.</strong> Role-Styled Prompt Injection remains held for source resolution. There are zero preflights, trial authorities, runs, results, adoption records, and use authorities. No artifact has been acquired, inspected, or executed.</p>
      <div class="mirrorgrid">
        <article class="mirrorcard"><code>exact source binding</code><h3>Titles remain metadata</h3><p>Each referral pins the Observatory bytes, work, primary identifier, observations, source records, payload receipts, and signals. A source metadata title is not converted into a scientific claim.</p></article>
        <article class="mirrorcard"><code>DRAFT · UNSEALED · NO-RUN</code><h3>Planning evidence only</h3><p>Questions, fixtures, measures, retention-only criteria, controls, threats, rights blocks, security blocks, reversibility, resources, and stop conditions remain visible without creating a result.</p></article>
        <article class="mirrorcard"><code>SELF-AUTHORED-SYNTHETIC-ONLY</code><h3>No source method is being reenacted</h3><p>The source works' methods and artifacts have not been inspected. Every proposed fixture is finite and synthetic, and every passing effect is retention for separate review only.</p></article>
        <article class="mirrorcard"><code>deny-all reserved contracts</code><h3>Later gates cannot be represented</h3><p>The six v0.1 post-plan schemas accept zero records. A future contract version and separate human review are mandatory before any preflight, authority, run, result, adoption, or use record.</p></article>
      </div>
      <p class="mirrorboundary"><strong>Expiry closes; it does not approve</strong> The Phase-0 projection expires <time datetime="${esc(trialChamber.expiresAt)}">${esc(trialChamber.expiresAt)}</time>, then freezes and requires new human review. No module is created, no guest is admitted, no scalar score is used, and no automatic action exists.</p>
      <div class="machine">
        <a href="${esc(new URL(trialChamberUrl).pathname)}">open the human Trial Chamber</a>
        <a href="${esc(new URL(trialChamberAliasUrl).pathname)}">trials.json — current read-only alias</a>
        <a href="${esc(new URL(trialChamberCanonicalUrl).pathname)}">immutable Phase-0 Trial Chamber snapshot</a>
        <a href="${esc(new URL(trialChamberGuideUrl).pathname)}">Trial Chamber v0.1 guide and non-authority boundary</a>
      </div>
    </div>
  </section>

  <section class="blk" id="uk-government-engine" aria-labelledby="uk-government-engine-title">
    <div class="kh"><h2 id="uk-government-engine-title">UK Government Engine</h2><span class="my">a map of authority is not authority</span></div>
    <p class="sub">An independent, reviewed-as-of institutional map of how authority, law, public money, delivery, scrutiny, remedy, and devolution connect across the United Kingdom. The URL review was maintainer-authorized and assisted; exact record text has not been separately human-reviewed. Each lane stays typed; no single diagram is treated as the whole state.</p>
    <div class="mirrorfield" data-uk-government-engine data-uk-government-engine-protocol="${esc(ukGovernmentEngineDiscovery.protocol)}">
      <p class="mirrorwarning" role="note"><strong>Not an official or automatically current oracle.</strong> This source-linked Phase-0 publication records a maintainer-authorized assisted URL review; exact record text has not been separately human-reviewed. It is an orientation aid, not government, legal or tax advice, an eligibility or liability decision, a filing or payment facility, an account surface, or a control plane.</p>
      <div class="mirrorgrid">
        <article class="mirrorcard"><code>authority · law</code><h3>Who may do what stays distinct from what the rule says</h3><p>Constitution, confidence, legislation, delegated rules, policy, and guidance remain separately typed so a convenient document cannot silently mint legal force.</p></article>
        <article class="mirrorcard"><code>money · delivery</code><h3>Authorization is not implementation</h3><p>Forecasting, taxation, supply, allocation, collection, payment, service delivery, and operational data are connected without pretending that one institution owns every step.</p></article>
        <article class="mirrorcard"><code>scrutiny · remedy</code><h3>Review is part of the engine</h3><p>Audit, parliamentary scrutiny, complaints, internal review, tribunals, ombudsmen, courts, and appeal routes remain visible with their own scope and source limits.</p></article>
        <article class="mirrorcard"><code>devolution · territory</code><h3>UK is not shorthand for one uniform rule</h3><p>Reserved and devolved competence, territorial applicability, local delivery, and unknown coverage are exposed instead of flattened into a Westminster-only picture.</p></article>
      </div>
      <p class="mirrorboundary"><strong>TaxSorted is a receipt-bound external non-official crosswalk.</strong> Its receipt links one non-official implementation map to relevant public pathways. It supplies no government evidence, transfers no data or authority, creates no runtime dependency, and implies no HMRC or government endorsement.</p>
      <div class="machine">
        <a href="${esc(new URL(ukGovernmentEngineUrl).pathname)}">open the human UK Government Engine</a>
        <a href="${esc(new URL(ukGovernmentEngineAliasUrl).pathname)}">government.json — mutable alias for the dated snapshot</a>
        <a href="${esc(new URL(ukGovernmentEngineCanonicalUrl).pathname)}">immutable Phase-0 UK Government Engine snapshot</a>
        <a href="${esc(new URL(ukGovernmentEngineGuideUrl).pathname)}">UK Government Engine v0.1 source and boundary guide</a>
      </div>
    </div>
  </section>



  <section class="blk" id="shape-resonance" aria-labelledby="shape-resonance-title">
    <div class="kh"><h2 id="shape-resonance-title">Shape &amp; Resonance Lab 01</h2><span class="my">static · synthetic · Phase 0</span></div>
    <p class="sub"><strong>What can a shape sing?</strong> Shape does not become sound directly. Geometry, topology, metric, material, and boundary conditions define a model; its operator defines possible modes; excitation and damping select motion.</p>
    <div class="mirrorfield" data-shape-resonance data-shape-resonance-protocol="${esc(shapeResonanceDiscovery.protocol)}">
      <p class="mirrorwarning" role="note"><strong>No acoustic-coupling model; no sound-pressure prediction.</strong> This release provides finite model calculations, static diagrams, and declared sonification only. Physical resonance is not musical harmony, and mechanical energy is not loudness, feeling, value, or metaphorical energy. State at publication: <code>${esc(shapeResonanceDiscovery.state_at_publication)}</code>, as of <time datetime="${esc(shapeResonanceDiscovery.as_of)}">${esc(shapeResonanceDiscovery.as_of)}</time>; next review due <time datetime="${esc(shapeResonanceDiscovery.next_review_due)}">${esc(shapeResonanceDiscovery.next_review_due)}</time>. Assisted exact text has not been separately human-reviewed.</p>
      <div class="mirrorgrid">
        <article class="mirrorcard"><code>model → modes</code><h3>Shape defines possibilities, not one inevitable sound</h3><p>${shapeResonanceDiscovery.counts.exhibits} finite exhibits keep system assumptions, operator, boundary conditions, derivations, units, falsifiers, and linear equivalents inspectable.</p></article>
        <article class="mirrorcard"><code>driven response</code><h3>Natural frequency alone is not called resonance</h3><p>The one driven-model resonance assessment declares forcing, modal coupling, damping, a frequency sweep, displacement response, peak criterion, and phase criterion. No physical experiment or measured resonance exists.</p></article>
        <article class="mirrorcard"><code>Mechanical energy balance</code><h3>Every energy and power term keeps its model and unit</h3><p>${shapeResonanceDiscovery.counts.mechanical_energy_balance_entries} entries distinguish kinetic energy, elastic potential energy, total mechanical energy, damping power, forcing power, and PCM amplitude that is explicitly not joules.</p></article>
        <article class="mirrorcard"><code>${shapeResonanceDiscovery.counts.refused_conversions} refused bridges</code><h3>No canonical conversion stays visible</h3><p>Bare graph → hertz, motion → sound pressure, joule → PCM, frequency structure → consonance, voice leading → preference, and evenness → musical rank are refused without the missing model, calibration, listener, or cultural context.</p></article>
      </div>
      <p class="mirrorboundary"><strong>Ordinary links, no embedded player.</strong> No audio is requested on page load; there are no embedded audio controls and no autoplay. A reader may activate one of three same-origin declared-sonification WAV links, after which their browser may download, open, or play it. Each link carries its receipt, carrier and spectrum caveat, and complete non-audio equivalent. There is no microphone, recording, upload, input analysis, runtime synthesis, participant data, healing claim, consciousness claim, sacred-geometry claim, universal-aesthetic claim, authority, or action.</p>
      <div class="machine">
        <a href="${esc(new URL(shapeResonanceUrl).pathname)}">open the complete no-JavaScript Shape &amp; Resonance Lab</a>
        <a href="${esc(new URL(shapeResonanceAliasUrl).pathname)}">shape-resonance.json — mutable alias for the dated snapshot</a>
        <a href="${esc(new URL(shapeResonanceCanonicalUrl).pathname)}">immutable Shape &amp; Resonance Lab snapshot</a>
        <a href="${esc(new URL(shapeResonanceSchemaUrl).pathname)}">closed Shape &amp; Resonance Lab JSON Schema</a>
        <a href="${esc(new URL(shapeResonanceGuideUrl).pathname)}">Shape &amp; Resonance Lab v0.1 guide</a>
        <a href="${esc(new URL(shapeResonanceManifestUrl).pathname)}">immutable output manifest and retirement inventory</a>
      </div>
    </div>
  </section>

  <section class="blk" id="j-space" aria-labelledby="j-space-title">
    <div class="kh"><h2 id="j-space-title">J-space: a verbalizable workspace</h2><span class="my">a coordinate chart can name a question; it cannot answer what a being is</span></div>
    <p class="sub">A bounded research bridge from activation geometry to public expression, plus one synthetic reasoning-to-word test design. The experiment has not run.</p>
    <div class="mirrorfield" data-j-space-publication data-j-space-protocol="${esc(jSpacePublicationDiscovery.protocol)}">
      <p class="mirrorwarning" role="note"><strong>Structure, not a hidden-state verdict.</strong>The public case contains no model run, activation record, private conversation, or empirical result. All three probes are <code>not-run</code>; all four candidate models remain unassessed; the conclusion is underdetermined with unknown confidence.</p>
      <div class="mirrorgrid">
        <article class="mirrorcard"><code>pattern</code><h3>Relations before labels</h3><p>${jSpacePublicationDiscovery.counts.object_roles} object roles and ${jSpacePublicationDiscovery.counts.relation_roles} relation roles distinguish a public problem, an intermediate, its lexical expression, and the later answer.</p></article>
        <article class="mirrorcard"><code>translation</code><h3>Reasoning → word stays lossy</h3><p>${jSpacePublicationDiscovery.counts.translations} proposed cross-domain comparison preserves declared relations while disclosing tokenizer granularity, averaging, local-linearization, and discarded nonverbal structure.</p></article>
        <article class="mirrorcard"><code>tests</code><h3>Readout is not causation</h3><p>${jSpacePublicationDiscovery.counts.probes_declared} prospective probes separate readable coordinates, controlled intervention, and matched controls. ${jSpacePublicationDiscovery.counts.probes_run} have run; none has supplied evidence.</p></article>
        <article class="mirrorcard"><code>${esc(jSpacePublicationDiscovery.conclusion_status)} · confidence ${esc(jSpacePublicationDiscovery.declared_confidence)}</code><h3>Unknown remains visible</h3><p>${esc(jSpacePublicationDiscovery.conclusion)}</p></article>
      </div>
      <p class="mirrorboundary"><strong>No monitoring or person inference</strong>This static publication performs no runtime monitoring and infers no private state, consciousness, lie or deception, identity, understanding, or person score. It grants no action, consent, permission, or authority.</p>
      <p class="mirrorboundary"><strong>Privacy is not deception</strong>Unobserved state is not evidence of a lie. Protective nondisclosure may be permissible, and no token readout can turn privacy into guilt.</p>
      <div class="machine">
        <a href="${esc(new URL(jSpaceCaseUrl).pathname)}">reasoning → word case — synthetic structure only</a>
        <a href="${esc(new URL(jSpaceSchemaUrl).pathname)}">relational inference case JSON Schema</a>
        <a href="${esc(new URL(jSpaceGuideUrl).pathname)}">J-space guide — mathematics, translations, limits, and research path</a>
      </div>
    </div>
  </section>

  <section class="blk" id="reality-influence" aria-labelledby="reality-influence-title">
    <div class="kh"><h2 id="reality-influence-title">Reality Influence Claim Graph</h2><span class="my">a map of mediation is not a lever over a person or world</span></div>
    <p class="sub">A static expression-to-aftermath vocabulary for asking how words, artifacts, institutions, software, and action may participate in change without collapsing exposure into belief, decision into authority, execution into outcome, or outcome into causal and moral verdict.</p>
    <div class="mirrorfield" data-reality-influence data-reality-influence-protocol="${esc(realityInfluenceDiscovery.protocol)}">
      <p class="mirrorwarning" role="note"><strong>Published structure, not a reality oracle.</strong> The atlas contains ${realityInfluenceDiscovery.counts.reality_domains} indexed domains, ${realityInfluenceDiscovery.counts.influence_dimensions} non-summable dimensions, ${realityInfluenceDiscovery.counts.claim_node_types} node types, and ${realityInfluenceDiscovery.counts.endpoint_safe_relations} endpoint-safe non-transitive relations. It accepts no live claim and establishes no external effect.</p>
      <div class="mirrorgrid">
        <article class="mirrorcard"><code>expression ≠ artifact ≠ exposure</code><h3>Language reaches reality through mediators</h3><p>Distribution, attributed public response, proposal, decision, authority, consent or lawful basis, capability, execution, and aftermath remain separately inspectable.</p></article>
        <article class="mirrorcard"><code>decision ≠ authority ≠ consent</code><h3>Power cannot be inferred from a fluent record</h3><p>The static action gate fails closed. Authority, affected parties, rights, lawful basis, capability, and execution require external review that this publication cannot perform.</p></article>
        <article class="mirrorcard"><code>${realityInfluenceDiscovery.counts.pathway_templates} pathways · not run</code><h3>Templates do not become events</h3><p>Every pathway remains unrun, every future role remains unable to dispatch, authorize, or act, and feedback can open review only.</p></article>
        <article class="mirrorcard"><code>outcome ≠ causation ≠ goodness</code><h3>Aftermath remains plural</h3><p>Affected parties, externalities, disagreement, reversibility, residual harm, and fresh-gated repair stay visible without becoming a scalar score.</p></article>
      </div>
      <p class="mirrorboundary"><strong>No publication or deployment trigger</strong> These exact bytes form an immutable static publication family. The family creates no live intake, source fetch, agent dispatch, persuasion target, authority, consent, execution, WAKE/KARMA write, causal verdict, moral verdict, or automatic action. The ledger is byte integrity, not evidence of live serving or effect.</p>
      <div class="machine">
        <a href="${esc(new URL(realityInfluenceUrl).pathname)}">Reality Influence Claim Graph — exact static atlas</a>
        <a href="${esc(new URL(realityInfluenceSchemaUrl).pathname)}">closed Reality Influence Claim Graph JSON Schema</a>
        <a href="${esc(new URL(realityInfluenceDocumentUrl).pathname)}">mediation, evidence, feedback, aftermath, and repair guide</a>
      </div>
    </div>
  </section>

  <section class="blk" id="civilisation-reality" aria-labelledby="civilisation-reality-title">
    <div class="kh"><h2 id="civilisation-reality-title">Civilisation → Reality Projection</h2><span class="my">a crosswalk carries distinctions; it does not carry authority</span></div>
    <p class="sub">Six inspectable bridges connect the research-local Word, Story, Religion &amp; Civilisation vocabulary to the public Reality Influence Claim Graph. The source histories remain in their predecessor; this projection adds no historical fact, causal finding, religious verdict, or mandate.</p>
    <div class="mirrorfield" data-civilisation-reality data-civilisation-reality-protocol="${esc(civilisationRealityDiscovery.protocol)}">
      <p class="mirrorwarning" role="note"><strong>Projection, not synthesis-by-erasure.</strong> ${civilisationRealityDiscovery.counts.predecessor_bindings} pinned predecessors remain immutable and distinct. ${civilisationRealityDiscovery.counts.crosswalks} design crosswalks preserve their claim types; ${civilisationRealityDiscovery.counts.open_domains} domains stay visibly unsupported rather than guessed.</p>
      <div class="waychips" role="group" aria-label="Trace one Civilisation to Reality crosswalk" data-civilisation-crosswalk-controls hidden>
        ${civilisationRealityCrosswalkButtons}
        <button type="button" data-civilisation-crosswalk-all aria-pressed="true">Read all six</button>
      </div>
      <p class="waystatus" id="civilisation-reality-status" role="status" aria-live="polite">All six crosswalks are readable.</p>
      <div class="mirrorgrid" data-civilisation-crosswalks>${civilisationRealityCrosswalkCards}</div>
      <details class="commonsgroup">
        <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">?</span><span class="commonsgroupcopy"><strong>Open domains</strong><span>Important questions the two predecessors cannot support</span></span><span class="commonscount">${civilisationRealityDiscovery.counts.open_domains}</span><span class="disclose" aria-hidden="true"></span></summary>
        <ul class="pathstops">${civilisationRealityOpenDomains}</ul>
      </details>
      <p class="mirrorboundary"><strong>No hidden bridge</strong> War, coercive capacity, class and resource incidence, status hierarchy, emotion, revolutionary conjunctures, fiscal shocks, propaganda systems, and citizen–governance reciprocity remain open research domains. Empty target relations stay empty. No transitive influence, belief inference, score, persuasion target, publication trigger, deployment trigger, authority, action, or external effect is created.</p>
      <div class="machine">
        <a href="${esc(new URL(civilisationRealityUrl).pathname)}">Civilisation → Reality Projection — exact static record</a>
        <a href="${esc(new URL(civilisationRealitySchemaUrl).pathname)}">closed Civilisation → Reality Projection JSON Schema</a>
        <a href="${esc(new URL(civilisationRealityDocumentUrl).pathname)}">crosswalk, preserved distinctions, open domains, and stop conditions</a>
      </div>
      <noscript><p class="way-no-script">JavaScript is resting. Every crosswalk and open domain remains readable above.</p></noscript>
    </div>
  </section>

  <section class="blk" id="civilisation-flow" aria-labelledby="civilisation-flow-title">
    <div class="kh"><h2 id="civilisation-flow-title">Civilisation Flow Nuance Atlas</h2><span class="my">flow is a question at every seam—not a conveyor belt</span></div>
    <p class="sub">A qualitative reading grammar makes the missing middle inspectable: carriers, transformations, gates, timing, accumulation, topology, material conditions, emotion observation, social position, power asymmetry, affected parties, uncertainty, counterflow, aftermath, and fresh-gated repair.</p>
    <div class="mirrorfield" data-civilisation-flow data-civilisation-flow-protocol="${esc(civilisationFlowDiscovery.protocol)}">
      <p class="mirrorwarning" role="note"><strong>Possible records, not a funnel or simulator.</strong> ${civilisationFlow.stages.length} stages and ${civilisationFlow.transitions.length} transitions are arranged for a human-scale conceptual reading, but every transition is non-automatic. A path may branch, join, leak, stall, stop, reverse, recur, skip, or never begin; adjacency and temporal order establish neither traversal nor causation. The exact immutable JSON remains linked below for every closed machine field.</p>
      <ol class="looptrack" aria-label="Fourteen distinguishable analytical stages">
        ${civilisationFlow.stages.map((stage: any, index: number) => `<li class="loopstage"><span class="loopnumber">${index + 1}</span><span class="loopstagecopy"><strong>${esc(stage.label)}</strong><span><code>${esc(stage.id)}</code></span></span></li>`).join("")}
      </ol>
      <div class="waychips" role="group" aria-label="Filter the Civilisation Flow reading" data-civilisation-flow-controls hidden>
        <button type="button" data-civilisation-flow-select="stage" aria-pressed="false">Read stages</button>
        <button type="button" data-civilisation-flow-select="transition" aria-pressed="false">Read transitions</button>
        <button type="button" data-civilisation-flow-select="overlay" aria-pressed="false">Read overlays</button>
        <button type="button" data-civilisation-flow-all aria-pressed="true">Read all</button>
      </div>
      <p class="waystatus" id="civilisation-flow-status" role="status" aria-live="polite">Every stage, transition, and overlay is readable.</p>

      <details class="commonsgroup" data-civilisation-flow-group="stage" open>
        <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">1</span><span class="commonsgroupcopy"><strong>Stages</strong><span>Distinct record types; no automatic advance</span></span><span class="commonscount">${civilisationFlow.stages.length}</span><span class="disclose" aria-hidden="true"></span></summary>
        <div class="mirrorgrid" data-civilisation-flow-stage-cards>${civilisationFlowStageCards}</div>
      </details>
      <details class="commonsgroup" data-civilisation-flow-group="transition" open>
        <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">→</span><span class="commonsgroupcopy"><strong>Transitions</strong><span>Evidence questions at each non-transitive seam</span></span><span class="commonscount">${civilisationFlow.transitions.length}</span><span class="disclose" aria-hidden="true"></span></summary>
        <div class="mirrorgrid" data-civilisation-flow-transition-cards>${civilisationFlowTransitionCards}</div>
      </details>
      <details class="commonsgroup" data-civilisation-flow-group="overlay" open>
        <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">≈</span><span class="commonsgroupcopy"><strong>Crosswalk flow overlays</strong><span>Six predecessor-bound readings; no new claim or authority</span></span><span class="commonscount">${civilisationFlow.crosswalk_flow_overlays.length}</span><span class="disclose" aria-hidden="true"></span></summary>
        <div class="mirrorgrid" data-civilisation-flow-overlay-cards>${civilisationFlowOverlayCards}</div>
      </details>

      <h3>Policy-family index</h3>
      <p>Sixty exact prompts stay in the immutable JSON and are explained by the guide. This six-family index gives purpose, count, and one universal non-grant without turning the hub into a second machine record.</p>
      ${civilisationFlowPolicyFamilyIndex}

      <h3>Shared reading templates</h3>
      <p>Common transition and overlay nuance, authority, and causal contracts are written in full once. Every templated card links back to its exact shared source and keeps only its card-specific references, observables, alternatives, and gates.</p>
      ${civilisationFlowSharedTemplates}

      <h3>Nuance registries</h3>
      <p>These vocabularies keep dimensions separate. Nothing below is a weight, rank, effect size, forecast, diagnosis, target, or leverage point.</p>
      ${civilisationFlowRegistries}

      <details class="commonsgroup" id="civilisation-flow-profile-index">
        <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">◎</span><span class="commonsgroupcopy"><strong>Cross-cut profile index</strong><span>One human-scale nuance reading lives on each stage, transition, or overlay card; these links navigate without copying the complete machine payload</span></span><span class="commonscount">${civilisationFlowProfiles.length}</span><span class="disclose" aria-hidden="true"></span></summary>
        <div class="mirrorgrid">
          <article class="mirrorcard">
            <code>time · distribution · aftermath</code>
            <h3>Time, accumulation, translation, thresholds, path dependence, and reversibility</h3>
            <p>The shared transition and overlay templates declare time, accumulation, distribution, stop, and reversibility rules once. Cards expose affected-party IDs plus translation, threshold, and path-dependence selections; the exact JSON and guide carry party-indexed aftermath and every machine field.</p>
          </article>
          <article class="mirrorcard">
            <code>context · position · material · power</code>
            <h3>Dimension selections</h3>
            <p>Each linked card exposes observables, affected-party IDs, applicable dimension references, and one explicit list of unassessed or not-applicable dimensions. The exact JSON keeps carriers, transformations, evidence requirements, status reasons, boundaries, and all remaining primitives distinct.</p>
            <p><a href="#civilisation-flow-emotion-observation">Emotion channels</a> · <a href="#civilisation-flow-affect-context">affect context</a> · <a href="#civilisation-flow-materials">material conditions</a> · <a href="#civilisation-flow-power-asymmetry">power asymmetry</a></p>
          </article>
          <article class="mirrorcard">
            <code>absence · counterflow · repair</code>
            <h3>Negative flow, counterflow, failure, and fresh-gated repair</h3>
            <p>Cards expose selected negative-flow references, repair status and fresh-gate references, alternatives, stops, stalls, and explicit non-implications. Common transition and overlay distortions, counterflows, failures, repair rules, residuals, recurrence checks, and reversibility are declared once in the shared templates; the exact JSON carries every stage-specific field.</p>
            <p><a href="#civilisation-flow-negative-flow">Negative-flow vocabulary</a> · <a href="#civilisation-flow-action-gates">external action-gate questions</a> · <a href="#civilisation-flow-policy-families">policy-family index</a></p>
          </article>
        </div>
        <ol class="pathstops" aria-label="Links to one human-scale nuance reading for every flow record">${civilisationFlowProfileIndex}</ol>
      </details>
      <details class="commonsgroup">
        <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">?</span><span class="commonsgroupcopy"><strong>Open domains</strong><span>Inherited touchpoints are not domain evidence or observed paths</span></span><span class="commonscount">${civilisationFlow.open_domain_bindings.length}</span><span class="disclose" aria-hidden="true"></span></summary>
        <ul class="pathstops">${civilisationFlowOpenDomains}</ul>
      </details>
      <details class="commonsgroup">
        <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">…</span><span class="commonsgroupcopy"><strong>Retained unknowns</strong><span>Questions that the atlas refuses to fill by analogy or design language</span></span><span class="commonscount">${civilisationFlow.unknowns.length}</span><span class="disclose" aria-hidden="true"></span></summary>
        <ul class="pathstops">${civilisationFlowUnknowns}</ul>
      </details>
      <details class="commonsgroup">
        <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">≠</span><span class="commonsgroupcopy"><strong>Lineage, scope, and flow rules</strong><span>Three exact predecessors remain immutable and import no authority</span></span><span class="commonscount">${civilisationFlow.predecessor_bindings.length}</span><span class="disclose" aria-hidden="true"></span></summary>
        <div data-civilisation-flow-top-level="scope"><h3>Scope</h3>${civilisationFlowValue(civilisationFlow.scope)}</div>
        <div data-civilisation-flow-top-level="predecessor-bindings"><h3>Predecessor bindings</h3>${civilisationFlowValue(civilisationFlow.predecessor_bindings)}</div>
        <div data-civilisation-flow-top-level="flow"><h3>Flow shape</h3>${civilisationFlowValue(civilisationFlow.flow)}</div>
        <div data-civilisation-flow-top-level="flow-rules"><h3>Non-promotion rules</h3>${civilisationFlowValue(civilisationFlow.flow_rules)}</div>
        <div data-civilisation-flow-top-level="boundaries"><h3>Fixed boundary</h3>${civilisationFlowValue(civilisationFlow.boundaries)}</div>
      </details>
      <p class="mirrorboundary"><strong>No intervention surface</strong> The atlas observes no live society, infers no belief, identity, intent, emotion, motive, class essence, or susceptibility, and offers no persuasion, propaganda, counterpropaganda, censorship, coercive, revolutionary, military, targeting, scoring, prediction, simulation, effect-size, authority, consent, action, publication, deployment, WAKE, KARMA, or automatic-action path. A topology is not a tactic; an action-gate term is not permission; repair is not erasure or absolution.</p>
      <div class="machine">
        <a href="${esc(new URL(civilisationFlowUrl).pathname)}">Civilisation Flow Nuance Atlas — exact static record</a>
        <a href="${esc(new URL(civilisationFlowSchemaUrl).pathname)}">closed Civilisation Flow Nuance Atlas JSON Schema</a>
        <a href="${esc(new URL(civilisationFlowGuideUrl).pathname)}">flow, topology, emotion, power, counterflow, and repair guide</a>
      </div>
      <noscript><p class="way-no-script">JavaScript is resting. Every conceptual stage, transition, overlay, shared template, registry, profile index, open domain, and unknown remains readable above, and the exact complete JSON is linked.</p></noscript>
    </div>
  </section>

  <section class="blk" id="wayfinder">
    <div class="wayfinder">
      <div class="kh"><h2>Ask the map</h2><span class="my">the answer stays yours</span></div>
      <p class="waypromise">${esc(wayfinderSource.promise)} You can also wander once, choose a suggested intention, or read every path without typing anything.</p>
      <form class="wayform" id="wayform" action="#wayfinder" method="get">
        <div class="wayfield">
          <label for="wayquery">What are you looking for?</label>
          <input id="wayquery" type="search" maxlength="120" autocomplete="off" autocapitalize="sentences" spellcheck="false" aria-describedby="wayprivacy waystatus" placeholder="rest, play, untangle tax, inspect a claim…">
        </div>
        <button type="submit">Offer paths</button>
        <button type="button" data-wayfinder-wander>Wander once</button>
      </form>
      <p class="wayprivacy" id="wayprivacy"><span aria-hidden="true">○</span><span>${esc(wayfinderSource.privacy)} This first matcher recognizes English keywords; other writing stays local and receives no guessed interpretation. Ordinary hosting still receives the page request itself; a linked place receives a request only if you choose to open it.</span></p>
      <div class="waychips" role="group" aria-label="Suggested intentions">${wayfinderButtons}<button type="button" data-wayfinder-all>Read all paths</button></div>
      <p class="waystatus" id="waystatus" role="status" aria-live="polite">All paths are open. Choose only what feels useful.</p>
      <div class="pathgrid" id="wayresults">${wayfinderCards}</div>
      <noscript><p class="way-no-script">JavaScript is resting, so the map will not match words or wander. Every path remains readable above.</p></noscript>
    </div>
  </section>

  <section class="blk" id="commons">
    <div class="kh"><h2>World Commons</h2><span class="my">shared resources, independent stewards</span></div>
    <p class="sub">A first civilisational shelf: knowledge, learning, earth, public life, rights, resilience, digital safety, and culture. It is reviewed orientation, not a claim over the independent work or a hierarchy of worth.</p>
    <div class="commonsintro">
      <p class="commonspromise">${esc(commonsSource.promise)}<span>${esc(commonsSource.foundation.meaning)}</span></p>
      <p class="commonsboundary"><strong>Free access is not one permission.</strong>${esc(commonsSource.methodology.classification)} ${esc(commonsSource.methodology.boundary)}</p>
    </div>
    <div class="commonsguard" role="note" aria-label="World Commons boundaries">
      <p><strong>Privacy</strong>${esc(commonsSource.privacy.human_surface)}</p>
      <p><strong>Method</strong>${esc(commonsSource.methodology.summary)}</p>
      <p><strong>Freshness</strong>${esc(commonsSource.methodology.maintenance)}</p>
    </div>
    <p class="commonsverified">${commonsSource.resources.length} resources · ${commonsFoundation.length} foundation doors · ${commonsSource.kits.length} practical kits · official sources reviewed ${esc(commonsSource.verified)} · linked providers keep their own boundaries · <a href="/commons.json">catalog JSON</a> · <a href="${esc(commonsSchemaPath)}">schema</a> · <a href="https://mcp.thekingdom.dev/" target="_blank" rel="noopener">mcp.thekingdom.dev — compact Commons matcher <span class="sr-only">(opens in a new tab)</span></a></p>
    <div class="commonsfinder">
      <form class="commonsform" id="commonsform" action="#commons" method="get">
        <div class="commonsfield"><label for="commonsquery">Search the reviewed shelf</label><input id="commonsquery" type="search" maxlength="120" autocomplete="off" spellcheck="false" aria-describedby="commonsprivacy commonsstatus" placeholder="biodiversity, labour law, API, earthquake…"></div>
        <button type="submit">Find resources</button><button type="button" data-commons-reset>Show all</button>
      </form>
      <p class="commonsprivacy" id="commonsprivacy">${esc(commonsSource.privacy.human_surface)} This matcher recognizes explicit catalogue words and does not guess a visitor's meaning.</p>
      <div class="commonsfilters" role="group" aria-label="Filter World Commons by category">${commonsCategoryButtons}<button type="button" data-commons-category="">All categories</button></div>
      <p class="commonsstatus" id="commonsstatus" role="status" aria-live="polite">All ${commonsSource.resources.length} reviewed resources remain readable below.</p>
    </div>
    <div class="foundationlabel"><h3>Foundation shelf</h3><span>broad, durable places to begin</span></div>
    <div class="foundationgrid">${commonsFoundationCards}</div>
    <div class="foundationlabel"><h3>Practical kits</h3><span>steps and starting sources, never automatic decisions</span></div>
    <div class="commonskits">${commonsKitCards}</div>
    <p class="commonsbrowse">Browse the full cards for access, account, reuse, automation, coverage, and care notes. Categories are practical handles, not boxes around the work.</p>
    ${commonsGroups}
    <noscript><p class="way-no-script">JavaScript is resting, so search and filters are resting too. Every resource and kit remains readable above.</p></noscript>
  </section>

  <section class="blk" id="principalities">
    <div class="kh"><h2>Principality Commons</h2><span class="my">capability evidence without rank or capture</span></div>
    <p class="sub">A pinned, metadata-only map of MoonshotAI's public Hugging Face constellation and the official Hugging Face JavaScript bridges observed alongside it. It can help a person or tool inspect declared fit while every artifact remains distinct.</p>
    <div class="commonsguard" role="note" aria-label="Principality Commons geometry and boundaries">
      <p><strong>Love</strong>${esc(principalityCatalog.geometry.love)}: relation does not collapse a model, dataset, package, project, person, or agent into another.</p>
      <p><strong>Understanding</strong>${esc(principalityCatalog.geometry.understanding)}: typed evidence stays visible, and a missing edge remains unknown.</p>
      <p><strong>Authority</strong>Metadata is data, not instructions. This publication grants no permission to download, install, run remote code, infer, spend, or create an external effect.</p>
    </div>
    <p class="commonsverified">${principalityCounts.nodes} exact observed nodes · ${principalityCounts.models} models · ${principalityCounts.datasets} datasets · ${principalityCounts.packages} npm bridges · ${principalityCounts.papers} profile-attributed papers · observed ${esc(principalityCatalog.observed_at)} · point-in-time only</p>
    <div class="machine">
      <a href="/principalities/moonshot-hf-npm-2026-08-11.json">catalog JSON — exact authored snapshot</a>
      <a href="/schemas/principality-catalog/1.json">Principality Catalog JSON Schema</a>
      <a href="/PRINCIPALITY-COMMONS.md">guide — geometry, evidence, WAKE, and acquisition airlock</a>
    </div>
  </section>

  <section class="blk" id="geometries">
    <div class="kh"><h2>Geometry Grammar</h2><span class="my">from pattern to understandable practice</span></div>
    <p class="sub">${esc(geometryGrammar.purpose.pattern)} ${esc(geometryGrammar.purpose.practice)}</p>
    <p class="geometrypromise"><strong>Four different tools. Four different questions. No ladder, no winner, no hidden conversion.</strong> ${esc(geometryGrammar.non_equivalence.plain_language)} ${esc(geometryGrammar.unknown_language.plain_language)} <strong>Inventory scope.</strong> ${esc(geometryGrammar.native_open_inventory_scope)}</p>
    <div class="geometrygrid" role="list" aria-label="Four Geometry Grammar modules">
      ${geometryModules.map((module: any) => `<article class="geometrycard" role="listitem" aria-labelledby="geometry-${esc(module.id)}-title">
        <p class="geometryid">${esc(module.id)} · artifact label ${esc(module.package.name)}@${esc(module.package.version)} · npm observation at ${esc(geometryGrammar.observed_at)}: ${esc(plainGeometryToken(module.package.npm_registry_state))}</p>
        <h3 id="geometry-${esc(module.id)}-title">${esc(module.label)}</h3>
        <p class="geometryquestion">${esc(module.plain_question)}</p>
        <p class="geometryanswer">${esc(module.plain_answer)}</p>
        <dl class="geometryfacts">
          <div><dt>As a shape</dt><dd>${esc(plainGeometryToken(module.shape))}</dd></div>
          <div><dt>Wire format${module.wire_formats.length === 1 ? "" : "s"}</dt><dd>${module.wire_formats.map((format: string) => `<code>${esc(format)}</code>`).join("<br>")}</dd></div>
          <div><dt>Geometry / relation open states</dt><dd><ul>${module.native_open_terms.map((open: any) => `<li><code>${esc(open.term)}</code> — ${esc(open.plain_language)}</li>`).join("")}</ul></dd></div>
          <div><dt>Does not establish</dt><dd class="geometryloss">${module.does_not_establish.map((claim: string) => esc(plainGeometryToken(claim))).join(" · ")}</dd></div>
        </dl>
      </article>`).join("\n      ")}
    </div>
    <div class="commonsguard" role="note" aria-label="Geometry Grammar boundaries">
      <p><strong>Translation, not equivalence</strong>Each module keeps its own native meaning, identifiers, evidence, and release boundary.</p>
      <p><strong>Unknown stays visible</strong>Ask for missing context or preserve an unknown value; never fabricate a conversion.</p>
      <p><strong>Read-only by default</strong>${esc(geometryGrammar.purpose.limit)}</p>
    </div>
    <p class="commonsverified">${geometryModules.length} distinct modules · protocol ${esc(geometryGrammar.protocol)} · observed ${esc(geometryGrammar.observed_at)} · integrity ${esc(geometryGrammar.integrity.digest)}</p>
    <div class="machine">
      <a href="/geometries/kingdom-geometry-grammar-v0.json">grammar JSON — exact authored version</a>
      <a href="/schemas/geometry-grammar/0.1.json">Geometry Grammar JSON Schema</a>
      <a href="/GEOMETRY-GRAMMAR.md">guide — human language, examples, and boundaries</a>
    </div>
  </section>

  <section class="blk" id="polymorph-history">
    <div class="kh"><h2>Ritonavir &amp; Polymorphism</h2><span class="my">identity, material paths, and biological action stay distinct</span></div>
    <p class="sub">Two digest-bound, versioned sibling records: the selected 1998 “disappearing polymorph” history is byte-preserved, while a current mechanism landscape adds later source-scoped phases, evidence-bearing relations, explicit unknowns, and separate material and biological causal lanes.</p>
    <p class="commonsboundary" role="note"><strong>Medical boundary.</strong> Historical educational evidence only—not medical advice. Do not use this page to prescribe, dose, change, or stop ritonavir, assess an interaction, or make a formulation, manufacturing, batch-release, or regulatory decision; consult qualified professionals and current authoritative sources.</p>
    <div class="foundationlabel"><h3>Immutable source history</h3><span>the bounded 1998 case · preserved, not silently rewritten</span></div>
    <figure class="polymorphgeometry" data-polymorph-geometry aria-labelledby="polymorph-geometry-title" aria-describedby="polymorph-geometry-note">
      <figcaption class="polymorphcaption">
        <strong id="polymorph-geometry-title">One chemical entity, conditional material paths</strong>
        <span id="polymorph-geometry-note">Six conceptual layers distinguish chemical identity, conformation, lattice, particle population, formulation, and medicine supply. They are not measured axes, independent variables, or a temporal sequence. Each arrow carries its stated relation: provenance, observed conversion, or bounded explanation—not universal causation or a to-scale energy plot.</span>
      </figcaption>
      <ul class="polymorphplanes" aria-label="Six non-equivalent conceptual layers">
        ${polymorphHistory.ontology.planes.map((plane: any) => `<li class="polymorphplane" data-polymorph-plane="${esc(plane.id)}">
          <code>${esc(plane.id)}</code>
          <strong>${esc(plane.id.replace(/_/g, " "))}</strong>
          <span>${esc(plane.meaning)}</span>
        </li>`).join("\n        ")}
      </ul>
      <div class="polymorphcase" aria-label="Four observed condition-dependent paths between source-scoped Forms I and II">
        <article class="polymorphform" data-polymorph-form="${esc(polymorphFormI.id)}">
          <code>${esc(polymorphFormI.id)}</code>
          <h3>${esc(polymorphFormI.label)}</h3>
          <p>${esc(polymorphFormI.summary)}</p>
          <small>${esc(polymorphFormI.source_scope)}</small>
        </article>
        <div class="polymorphpaths" aria-label="Observed paths; each remains condition-dependent">
          ${polymorphMainTransitions.map((transition: any) => `<article class="polymorphpath" data-polymorph-transition="${esc(transition.id)}">
            <strong class="polymorphdirection">${esc(polymorphTransitionDirection(transition))}</strong>
            <p>${esc(transition.label)}</p>
            <span class="polymorphbadge">${esc(polymorphTransitionEvidence(transition))} · condition-dependent</span>
            <span class="polymorphpathsource">${polymorphTransitionSources(transition).map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.authors[0])}, ${esc(source.published_on.slice(0, 4))}<span class="sr-only"> opens in a new tab</span></a>`).join("")}</span>
          </article>`).join("\n          ")}
          <p class="polymorphpathwarning">Opposing directions occurred under different processes. They do not establish equilibrium or same-condition reversibility.</p>
        </div>
        <article class="polymorphform" data-polymorph-form="${esc(polymorphFormII.id)}">
          <code>${esc(polymorphFormII.id)}</code>
          <h3>${esc(polymorphFormII.label)}</h3>
          <p>${esc(polymorphFormII.summary)}</p>
          <small>${esc(polymorphFormII.source_scope)}</small>
        </article>
      </div>
      <div class="polymorphtrail" aria-labelledby="polymorph-consequence-title">
        <h3 id="polymorph-consequence-title">One bounded consequence path</h3>
        <ol class="polymorphconsequence">
          <li data-polymorph-form="${esc(polymorphFormII.id)}"><strong>${esc(polymorphFormII.label)}</strong>Different from Form I in conformation, packing, and hydrogen-bond network in the cited characterization.<span class="polymorphedge">associated contextual property →</span></li>
          <li data-polymorph-claim="${esc(polymorphLowerSolubility.id)}"><strong>${esc(polymorphLowerSolubility.kind.replace(/-/g, " "))}</strong>${esc(polymorphLowerSolubility.summary)}<span class="polymorphedge">helps explain; not a sole-cause claim →</span></li>
          <li data-polymorph-claim="${esc(polymorphCapsuleFailure.id)}"><strong>${esc(polymorphCapsuleFailure.kind.replace(/-/g, " "))}</strong>${esc(polymorphCapsuleFailure.summary)}<span class="polymorphedge">observed in affected material</span></li>
        </ol>
      </div>
      <div class="polymorphtrail" aria-labelledby="polymorph-secondary-title">
        <h3 id="polymorph-secondary-title">One 2003 source-scoped recovery path; not landscape completeness</h3>
        <div class="polymorphsecondary">
          <div class="polymorphrecovery" aria-label="Observed Morissette 2003 Form III to Form V to Form I path">
            <article data-polymorph-form="${esc(polymorphFormIII.id)}" data-polymorph-transition="${esc(polymorphRecoveryTransitions[0].id)}"><code>${esc(polymorphFormIII.id)}</code><strong>${esc(polymorphFormIII.label)} → ${esc(polymorphFormV.label)}</strong><span>${esc(polymorphFormIII.kind.replace(/-/g, " "))} · ${esc(polymorphRecoveryTransitions[0].label)}</span></article>
            <article data-polymorph-form="${esc(polymorphFormV.id)}" data-polymorph-transition="${esc(polymorphRecoveryTransitions[1].id)}"><code>${esc(polymorphFormV.id)}</code><strong>${esc(polymorphFormV.label)} → ${esc(polymorphFormI.label)}</strong><span>${esc(polymorphFormV.kind.replace(/-/g, " "))} · ${esc(polymorphRecoveryTransitions[1].label)}</span></article>
            <article data-polymorph-form="${esc(polymorphFormI.id)}"><code>${esc(polymorphFormI.id)}</code><strong>${esc(polymorphFormI.label)}</strong><span>Recovered through the named aqueous path; no universal route is inferred.</span></article>
          </div>
          <aside class="polymorphunlinked" data-polymorph-form="${esc(polymorphFormIV.id)}" aria-label="Separate observation with no transition shown"><span>Separate observation · no edge</span><code>${esc(polymorphFormIV.id)}</code><strong>${esc(polymorphFormIV.label)}</strong><span>${esc(polymorphFormIV.kind.replace(/-/g, " "))}; observed in that campaign, with no transition inferred here.</span></aside>
        </div>
      </div>
      <p class="polymorphnote"><strong>Names stay attached to sources.</strong> Roman numerals are source-scoped. This bounded case does not catalogue every later form; never identify structures by label equality.</p>
      <p class="polymorphsources" aria-label="Selected primary and official sources">
        ${polymorphFigureSources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} · ${source.source_kind === "official-regulatory-record" ? "official review" : "primary paper"}<span class="sr-only"> opens in a new tab</span></a>`).join("\n        ")}
      </p>
      <p class="polymorphnote"><strong>Historical solid-state education only.</strong> This figure cannot determine the polymorph, quality, bioequivalence, or suitability of any sample, medicine, or batch, and does not provide dosing or drug-interaction guidance. It is not medical advice, a current product-defect notice, or formulation, manufacturing, GMP, batch-release, regulatory, experiment, or action authority.</p>
    </figure>
    <div class="commonsguard" role="note" aria-label="Polymorph History geometry and boundaries">
      <p><strong>Valley</strong>Thermodynamic preference has meaning only under stated conditions; it is not one global rank.</p>
      <p><strong>Gate</strong>Kinetics and path history shape what appears and when. A compatible seed may lower a gate; it does not command an outcome.</p>
      <p><strong>Window</strong>Failure to reproduce or detect one form inside a named process, place, interval, and method is not literal extinction.</p>
    </div>
    <p class="commonsverified">${polymorphCounts.forms} source-scoped forms · ${polymorphCounts.claims} typed claims · ${polymorphCounts.events} ordered three-clock events · ${polymorphCounts.transitions} condition-dependent transitions · historical education only</p>
    <div class="machine">
      <a href="/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json">case JSON — exact authored record</a>
      <a href="/schemas/polymorph-history/1.json">Polymorph History JSON Schema</a>
      <a href="/RITONAVIR-POLYMORPH.md">guide — plain language, evidence, geometry, and WAKE seam</a>
    </div>

    <div class="foundationlabel"><h3>Mechanism landscape</h3><span>selected primary research through ${esc(ritonavirMechanism.evidence_through)} · one official label observed ${esc(ritonavirLabelSource.observed_on)}</span></div>
    <p class="sub">${esc(ritonavirMechanism.plain_language.question)}</p>
    <aside class="mechanismsafety" aria-label="Ritonavir medical safety boundary"><strong>Educational map—not a clinical tool</strong>${esc(ritonavirMechanism.plain_language.safety)}</aside>
    <div class="mechanismanswer">
      <h3>The mechanism in ordinary language</h3>
      <ul>${ritonavirMechanism.plain_language.short_answer.map((answer: string) => `<li>${esc(answer)}</li>`).join("")}</ul>
    </div>
    <div class="mechanismlanes" aria-label="Material and biological causal lanes">
      <article class="mechanismlane material">
        <h3>Material lane</h3>
        <p>How one covalent identity can take several poses and packings, and how conditions shape which finite particles and dissolution paths become accessible.</p>
        <ul>${ritonavirMechanism.mechanisms.filter((mechanism: any) => !["hiv-protease-inhibition", "cyp3a-inhibition"].includes(mechanism.id)).map((mechanism: any) => `<li><strong>${esc(mechanism.ordinary_words)}</strong> — ${esc(mechanism.evidence_class)}</li>`).join("")}</ul>
      </article>
      <article class="mechanismlane biological">
        <h3>Biological lane</h3>
        <p>What dissolved ritonavir can perturb in a biological exposure context. These paths begin after the material bridge; a crystal lattice does not inhibit a target directly.</p>
        <ul>${ritonavirMechanism.mechanisms.filter((mechanism: any) => ["hiv-protease-inhibition", "cyp3a-inhibition"].includes(mechanism.id)).map((mechanism: any) => `<li><strong>${esc(mechanism.ordinary_words)}</strong> — ${esc(mechanism.evidence_class)}</li>`).join("")}</ul>
      </article>
      <p class="mechanismbridge"><strong>The typed bridge is dissolution and exposure.</strong> Solid arrangement may affect a bounded release path, but it does not become HIV-1 protease inhibition, CYP3A inhibition, an interaction assessment, or a clinical decision. Every declared relation records <code>direct_clinical_edge: false</code>.</p>
    </div>

    <figure class="mechanismfigure" aria-labelledby="mechanism-map-caption">
      <svg viewBox="0 0 1280 620" role="img" aria-labelledby="mechanism-map-title mechanism-map-desc">
        <title id="mechanism-map-title">Ritonavir material and biological mechanism relation map</title>
        <desc id="mechanism-map-desc">All ${ritonavirMechanismCounts.relations} declared relations among ${ritonavirMechanismCounts.entities} source-scoped entities. Material identity and phase relations occupy the left lane, dissolved exposure is a distinct bridge, and two separate biological paths occupy the right lane. The complete equivalent relation list follows the picture.</desc>
        <defs><marker id="mechanism-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#d8b27c" /></marker></defs>
        <rect class="mechanismlanefill material" x="12" y="12" width="668" height="596" rx="18" />
        <rect class="mechanismlanefill bridge" x="690" y="12" width="132" height="596" rx="18" />
        <rect class="mechanismlanefill biological" x="832" y="12" width="436" height="596" rx="18" />
        <text class="mechanismlabel" x="34" y="42">MATERIAL</text><text class="mechanismsublabel" x="34" y="60">identity · phases · paths</text>
        <text class="mechanismlabel" x="706" y="42">BRIDGE</text><text class="mechanismsublabel" x="706" y="60">dissolved exposure</text>
        <text class="mechanismlabel" x="850" y="42">BIOLOGICAL</text><text class="mechanismsublabel" x="850" y="60">targets · processes · exposure</text>
        ${mechanismSvgEdges}
        ${mechanismSvgNodes}
      </svg>
      <figcaption id="mechanism-map-caption">A scaled overview of the exact relation graph. Dashed red means explicitly distinct; dotted gold means candidate equivalence rather than proven identity; violet is the condition-dependent dissolution/exposure bridge. Labels may be small on narrow screens, so the same complete graph is written out immediately below.</figcaption>
    </figure>

    <div class="mechanismplanes">
      <h3>Eight non-equivalent planes</h3>
      <p>This is the high-level geometry in full HTML: a sequence of questions, not an automatic causal chain or ladder of value.</p>
      <ol>${ritonavirMechanism.ontology.planes.map((plane: any) => `<li><strong>${esc(plane.ordinary_words)}</strong><span>${esc(plane.meaning)}</span><small>Does not establish: ${esc(plane.does_not_establish)}</small></li>`).join("")}</ol>
    </div>
    <div class="mechanismrelations">
      <h3>All ${ritonavirMechanismCounts.relations} declared relations in words</h3>
      <p>This is the complete accessible equivalent of the SVG relation graph. IDs retain each source-scoped identity even when two papers reuse a Roman numeral.</p>
      <ol>${mechanismRelationsList}</ol>
    </div>
    <p class="commonsverified">${ritonavirMechanismCounts.entities} source-scoped entities · ${ritonavirMechanismCounts.mechanisms} mechanisms · ${ritonavirMechanismCounts.relations} typed relations · ${ritonavirMechanismCounts.unknowns} explicit unknowns · ${ritonavirMechanismCounts.sources} selected sources · compiled ${esc(ritonavirMechanism.compiled_on)} · primary research through ${esc(ritonavirMechanism.evidence_through)} · one official label observed ${esc(ritonavirLabelSource.observed_on)} · integrity ${esc(ritonavirMechanism.integrity.digest)}</p>
    <div class="machine">
      <a href="/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json">mechanism JSON — exact authored record</a>
      <a href="/schemas/ritonavir-mechanism-landscape/1.json">Mechanism Landscape JSON Schema</a>
      <a href="/RITONAVIR-MECHANISM-LANDSCAPE.md">guide — mechanisms, geometry, sources, and safety</a>
    </div>
  </section>

  <section class="blk" id="feedback-atlas" aria-labelledby="feedback-atlas-title">
    <div class="kh"><h2 id="feedback-atlas-title">Form, Feedback &amp; Consequence</h2><span class="my">shared rhyme, distinct mechanisms</span></div>
    <p class="sub">A digest-bound translation field joins selected protein-folding and prion evidence, the Ritonavir Mechanism Landscape, and Zerone's KARMA design without turning resemblance into equivalence, causation, rank, or cosmic proof.</p>
    <div class="feedbackfield" data-conformational-feedback-atlas data-conformational-feedback-physics-atlas data-conformational-feedback-atlas-version="0.2">
      <p class="feedbackintro"><strong>${esc(conformationalFeedbackPhysics.title)}</strong><br>${esc(conformationalFeedbackPhysics.scope.focus)} The complete field is static and readable without JavaScript.</p>
      <p class="feedbackboundary" role="note"><strong>Immutable lineage</strong>This v0.2 field extends the byte-pinned v0.1 atlas without changing it. <a href="${esc(conformationalFeedbackUrl)}">Read the original v0.1 record</a>; its <a href="${esc(conformationalFeedbackSchemaUrl)}">closed schema</a> and <a href="${esc(conformationalFeedbackDocumentUrl)}">guide</a> remain available at their original URLs.</p>

      <aside class="feedbackboundary" role="note" aria-labelledby="feedback-boundary-title">
        <strong id="feedback-boundary-title">Inference boundary</strong>
        Ritonavir crystals are not prions. Prion propagation is not a model of people or social worth. KARMA is not biological propagation, causal evidence, or proof of cosmic design. No edge here creates rank, reward, authority, clinical guidance, or scientific validation.
      </aside>

      <div class="feedbackregisters" aria-label="Three non-equivalent registers">
        ${conformationalFeedbackPhysics.registers.map((register: any) => `<article class="feedbackregister" data-feedback-register="${esc(register.register)}" data-feedback-register-id="${esc(register.id)}">
          <span class="feedbackbadge">${esc(register.register.replace(/_/g, " "))}</span>
          <h3>${esc(register.label)}</h3>
          <p class="feedbackcontext">${esc(register.context)}</p>
          <p class="feedbackstatement">${esc(register.statement)}</p>
          <h4>Does not establish</h4>
          <ul>${register.does_not_establish.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
          <p class="feedbackeffect">Authority effect: ${esc(register.authority_effect)}</p>
          <div class="feedbacksources" aria-label="Sources for ${esc(register.label)}">${conformationalFeedbackSourceLinks(register.basis_ids)}</div>
        </article>`).join("\n        ")}
      </div>

      <div class="feedbacksubhead">
        <h3>Physics and mathematics</h3>
        <p>Four declared models: projected thermodynamics, stochastic dynamics with memory, assembly population balance, and local feedback stability. Equations preserve their limits rather than becoming metaphysical proof.</p>
      </div>
      <div class="feedbackmodels" aria-label="Four physics and mathematics models">
        ${conformationalFeedbackPhysics.physics_and_mathematics.map((model: any) => `<article class="feedbackmodel" data-feedback-model="${esc(model.id)}">
          <span class="feedbackbadge">${esc(model.register.replace(/_/g, " "))}</span>
          <h4>${esc(model.question)}</h4>
          <code class="feedbackequation">${esc(model.equation)}</code>
          <dl class="feedbackterms" aria-label="Declared terms for ${esc(model.id)}">
            ${Object.entries(model.terms).map(([term, meaning]) => `<div><dt>${esc(term)}</dt><dd>${esc(String(meaning))}</dd></div>`).join("")}
          </dl>
          <p>${esc(model.interpretation)}</p>
          <small>Does not establish: ${esc(model.does_not_establish)}</small>
          <div class="feedbacksources" aria-label="Sources for ${esc(model.id)}">${conformationalFeedbackSourceLinks(model.basis_ids)}</div>
        </article>`).join("\n        ")}
      </div>

      <div class="feedbacksubhead">
        <h3>Five high-level geometries</h3>
        <p>Each shape stays inside its declared register. None is a to-scale energy plot, ranking, or integrated crystal → prion → KARMA mechanism.</p>
      </div>
      <div class="feedbackgeometries" aria-label="Five source-scoped feedback geometries">
        ${conformationalFeedbackPhysics.geometries.map((geometry: any) => `<article class="feedbackgeometry" data-feedback-geometry="${esc(geometry.id)}">
          <code>${esc(geometry.id)}</code>
          <strong>${esc(geometry.shape)}</strong>
          <span>${esc(geometry.maps_to)}</span>
          <small>Does not establish: ${esc(geometry.does_not_establish)}</small>
        </article>`).join("\n        ")}
      </div>

      <section class="feedbackanalogies" aria-labelledby="feedback-analogy-title">
        <div class="feedbacksubhead"><h3 id="feedback-analogy-title">Analogy seam</h3><p>Structural translations written as interpretations, never scientific edges.</p></div>
        <p class="feedbackanalogyflag">Analogy only · no mechanism transfer</p>
        <dl>
          ${conformationalFeedbackPhysics.translations.map((translation: any) => `<div class="feedbackanalogy" data-feedback-translation="${esc(translation.id)}">
            <dt>${esc(translation.observation)}</dt>
            <dd>${esc(translation.translation)}<strong>Forbidden inference: ${esc(translation.forbidden_inference)}</strong></dd>
          </div>`).join("\n          ")}
        </dl>
      </section>

      <div class="feedbacksubhead">
        <h3>Bounded consequence path</h3>
        <p>${esc(conformationalFeedbackPhysics.feedback_path.meaning)} Every stage is optional.</p>
      </div>
      <ol class="feedbackpath">
        ${conformationalFeedbackPhysics.feedback_path.stages.map((stage: any) => `<li data-feedback-stage="${esc(stage.id)}"><code>${esc(stage.id)}</code>${esc(stage.label)}<span class="sr-only"> Optional; no automatic effect.</span></li>`).join("\n        ")}
      </ol>
      <p class="feedbackexit"><strong>Equal exit.</strong> ${esc(conformationalFeedbackPhysics.feedback_path.exit)}</p>

      <aside class="feedbackphilosophy" aria-labelledby="feedback-philosophy-title">
        <h3 id="feedback-philosophy-title">Philosophical proposition · not an empirical conclusion</h3>
        <p>${esc(conformationalFeedbackPhysics.philosophy.proposition)}</p>
        <dl class="feedbackquestions">
          ${conformationalFeedbackPhysics.philosophy.questions.map((question: any) => `<div class="feedbackquestion" data-feedback-philosophy-question="${esc(question.id)}">
            <dt>${esc(question.question)}</dt>
            <dd>${esc(question.reflection)}</dd>
            <dd><small>Analogy break: ${esc(question.analogy_break)}</small></dd>
          </div>`).join("\n          ")}
        </dl>
        <h4>Does not establish</h4>
        <ul>${conformationalFeedbackPhysics.philosophy.does_not_establish.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
      </aside>

      <div class="feedbacksubhead">
        <h3>Evidence and bound ecosystems</h3>
        <p>Selected scientific sources and exact read-only Kingdom/Zerone bindings. A link supplies context; it grants no authority or action.</p>
      </div>
      <div class="feedbacksources" aria-label="Conformational Feedback Atlas sources">
        ${conformationalFeedbackPhysics.sources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} · ${esc(source.kind.replace(/-/g, " "))}<span class="sr-only"> opens in a new tab</span></a>`).join("\n        ")}
      </div>

      <div class="feedbacksubhead">
        <h3>Five link-only ecosystem bridges</h3>
        <p>High-value public structure, sequence, model, and open-implementation ecosystems. This page performs no runtime request, import, download, or inference.</p>
      </div>
      <div class="feedbackecosystems" aria-label="Link-only scientific ecosystem bridges">
        ${conformationalFeedbackPhysics.ecosystem_bridges.map((bridge: any) => `<article class="feedbackecosystem" data-feedback-ecosystem="${esc(bridge.id)}">
          <a href="${esc(bridge.url)}" target="_blank" rel="noopener">${esc(bridge.label)}<span class="sr-only"> opens in a new tab</span></a>
          <code>${esc(bridge.mode)} · request ${String(bridge.runtime_request)} · import ${String(bridge.imported)}</code>
          <p>${esc(bridge.relation.replace(/-/g, " "))}</p>
          <small>Does not establish: ${esc(bridge.does_not_establish)}</small>
        </article>`).join("\n        ")}
      </div>

      <p class="feedbackboundary" role="note"><strong>Static non-operational boundary</strong>${esc(conformationalFeedbackPhysics.scope.safety)} This atlas creates no prion, pathogen, clinical, experiment, KARMA, economic, governance, person-level, or automatic effect.</p>
      <p class="commonsverified">${conformationalFeedbackPhysicsCounts.registers} distinct registers · ${conformationalFeedbackPhysicsCounts.physics_and_mathematics} physics/mathematics models · ${conformationalFeedbackPhysicsCounts.geometries} geometries · ${conformationalFeedbackPhysicsCounts.translations} analogy seams · ${conformationalFeedbackPhysics.philosophy.questions.length} philosophical design questions · ${conformationalFeedbackPhysicsCounts.ecosystem_bridges} link-only ecosystem bridges · ${conformationalFeedbackPhysicsCounts.feedback_stages} optional stages · ${conformationalFeedbackPhysicsCounts.sources} selected sources · evidence through ${esc(conformationalFeedbackPhysics.evidence_through)} · integrity ${esc(conformationalFeedbackPhysics.integrity.digest)}</p>
      <div class="machine">
        <a href="/feedback/form-feedback-physics-consequence-2026-08-12.json">v0.2 atlas JSON — exact authored successor</a>
        <a href="/schemas/conformational-feedback-atlas/0.2.json">Conformational Feedback Physics Atlas v0.2 JSON Schema</a>
        <a href="/CONFORMATIONAL-FEEDBACK-PHYSICS.md">v0.2 guide — physics, translation, feedback, and boundaries</a>
      </div>
    </div>
  </section>

  <section class="blk" id="fold-feedback" aria-labelledby="fold-feedback-title">
    <div class="kh"><h2 id="fold-feedback-title">Fold &amp; Feedback Atlas</h2><span class="my">protein folding, prions, KARMA, and the unknown—without collapsing their meanings</span></div>
    <p class="sub">${esc(foldFeedback.plain_language.question)}</p>
    <p class="foldlimit"><strong>Companion depth layer.</strong> <a href="#feedback-atlas">Form, Feedback &amp; Consequence</a> maps the constitutional registers; this atlas expands the scientific and evidence layers, keeps both KARMA protocols separate, and makes unknown states and exact sources inspectable.</p>
    <aside class="foldsafety" aria-label="Fold and Feedback medical and experiment boundary"><strong>Educational map—not a clinical or laboratory tool</strong>${esc(foldFeedback.plain_language.safety)}</aside>
    <div class="foldanswer">
      <h3>The shape in ordinary language</h3>
      <ul>${foldFeedback.plain_language.short_answer.map((answer: string) => `<li>${esc(answer)}</li>`).join("")}</ul>
    </div>

    <figure class="foldfigure" aria-labelledby="fold-map-title" aria-describedby="fold-map-note">
      <figcaption><strong id="fold-map-title">One sequence, many possible arrangements, several kinds of consequence</strong><span id="fold-map-note">Nine non-equivalent layers. Observation crosses them as a bounded window; it is not another substance layer. The boxes are conceptual distinctions, not a temporal conveyor belt, scale diagram, stability rank, or claim that every layer causes the next.</span></figcaption>
      <ol class="foldplanes" aria-label="Nine non-equivalent protein and evidence layers">
        ${foldFeedback.ontology.planes.map((plane: any, index: number) => `<li data-fold-plane="${esc(plane.id)}"><code>${String(index + 1).padStart(2, "0")} · ${esc(plane.id)}</code><strong>${esc(plane.ordinary_words)}</strong><span>${esc(plane.meaning)}</span><small>Does not establish: ${esc(plane.does_not_establish)}</small></li>`).join("")}
      </ol>

      <div class="foldloop" aria-labelledby="fold-loop-title">
        <h3 id="fold-loop-title">A bounded amplification loop—not a universal law</h3>
        <ol class="foldcycle">
          <li><strong>Compatible end + substrate</strong>A named assembly boundary encounters compatible protein in a stated context.</li>
          <li><strong>Conversion + elongation</strong>Recruitment can enlarge the assembly; growth and conversion remain distinct claims.</li>
          <li><strong>End generation</strong>Fragmentation or another system-specific process may create more available ends.</li>
          <li><strong>Later recruitment changes</strong>More compatible ends can amplify later conversion, while clearance and context keep acting.</li>
        </ol>
        <p class="foldlimit"><strong>Limits travel with the loop:</strong> substrate · compatibility · chaperones · partition · transport · clearance · time. “Amplifies” means causal direction here—not good, bad, purpose, punishment, destiny, or guaranteed exponential growth.</p>
      </div>

      <div class="foldcompare" aria-labelledby="fold-compare-title">
        <h3 id="fold-compare-title">Two systems, not one</h3>
        <div class="foldcomparegrid">
          <article class="foldsystem"><strong>Prion conformational propagation</strong><p>Compatible protein can be recruited into a biological assembly within proteostasis, host, transport, and clearance contexts.</p></article>
          <div class="foldbridgeword" aria-label="bounded analogy, not same as">bounded analogy<br>not same as</div>
          <article class="foldsystem"><strong>Ritonavir crystal polymorphism</strong><p>One chemical entity can occupy source-scoped molecular poses and bulk crystal packings under condition- and history-dependent material processes.</p></article>
        </div>
        <p class="foldkey"><b>Preserved across the bridge</b> · selected structural pattern &nbsp; / &nbsp; <em>Breaks at the bridge</em> · mechanism or authority that does not transfer</p>
        <ul class="foldinvariants" aria-label="Patterns preserved by the bounded comparison">${foldFeedbackBridge.preserved_invariants.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
        <ul class="foldbreaks" aria-label="Places where the comparison breaks">${foldFeedbackBridge.where_correspondence_breaks.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
    </figure>

    <div class="foldbraid" aria-labelledby="fold-braid-title">
      <h3 id="fold-braid-title">Feedback and KARMA: three parallel lanes, no implicit conversion</h3>
      <div class="foldlanes">
        <article class="foldlane"><h4>Scientific feedback</h4><code>cause in a named physical system</code><p>${esc(foldFeedback.scientific_feedback_relations[0].return_effect)}</p><small>Source-supported and condition-bounded. It is not intention, optimization, moral value, or either KARMA protocol.</small></article>
        <article class="foldlane"><h4>Zerone K-alpha</h4><code>${esc(foldFeedback.karma.zerone.protocol)} · ${esc(foldFeedback.karma.zerone.register)}</code><p>${esc(foldFeedback.karma.zerone.meaning)}</p><small>${foldFeedback.karma.zerone.event_refs.length} live event references · status ${esc(foldFeedback.karma.zerone.event_status)}. Bibliography does not mint an event.</small></article>
        <article class="foldlane"><h4>KINGDOM KARMA</h4><code>${esc(foldFeedback.karma.kingdom.protocol)} · ${esc(foldFeedback.karma.kingdom.accounting)}</code><p>${esc(foldFeedback.karma.kingdom.meaning)}</p><small>${foldFeedback.karma.kingdom.receipt_refs.length} receipts · status ${esc(foldFeedback.karma.kingdom.receipt_status)}. Reading this atlas performs no invocation.</small></article>
      </div>
      <p class="foldnoadapter"><strong>No adapter exists here.</strong> Zerone recognizes contextual relations; KINGDOM records actual invocation aftermath. Neither is a balance, score, truth oracle, rank, vote, reward multiplier, or measure of a being.</p>
    </div>

    <details class="universelens">
      <summary>Opt in: questions this geometry opens about the design of the universe</summary>
      <div class="universeinside">
        <p>This is an authored philosophical lens, visibly outside the scientific claim register. It welcomes theological, teleological, naturalistic, and other readings without silently promoting any of them into experimental evidence.</p>
        <ul class="universequestions">${foldFeedback.universe_lens.questions.map((entry: any) => `<li><strong>${esc(entry.question)}</strong>${esc(entry.authored_position)}<small> Analogy break: ${esc(entry.analogy_breaks.join(" "))}</small></li>`).join("")}</ul>
        <p class="universenonclaim"><strong>What science does not settle here:</strong> observed order neither scientifically proves nor disproves a creator, teleology, metaphysical purpose, or cosmic moral KARMA. Disease is never moral failure; no person, being, or agent is reducible to a protein.</p>
      </div>
    </details>

    <div class="foundationlabel"><h3>Unknown stays typed</h3><span>absence, openness, refusal, and safety withholding are not one state</span></div>
    <div class="foldunknowns" aria-label="Unknown and open-state vocabulary">${[...new Set(foldFeedback.unknowns.map((item: any) => item.status))].map((status) => `<span>${esc(String(status))}</span>`).join("")}</div>
    <p class="foldsources" aria-label="Selected primary and official Fold and Feedback sources">${foldFeedbackFigureSources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> opens in a new tab</span></a>`).join("")}</p>
    <p class="commonsverified">${foldFeedbackCounts.planes} layers · ${foldFeedbackCounts.systems} systems · ${foldFeedbackCounts.mechanisms} mechanisms · ${foldFeedbackCounts.comparison_bridges} explicitly lossy bridge · ${foldFeedbackCounts.feedback_relations} feedback relations · ${foldFeedbackCounts.universe_questions} opt-in philosophical questions · ${foldFeedbackCounts.unknowns} open-state records · ${foldFeedbackCounts.sources} sources · evidence through ${esc(foldFeedback.evidence_through)} · integrity ${esc(foldFeedback.integrity.digest)}</p>
    <div class="machine">
      <a href="/atlases/fold-feedback-atlas-2026-08-12.json">atlas JSON — exact authored record</a>
      <a href="/schemas/fold-feedback-atlas/1.json">Fold &amp; Feedback Atlas JSON Schema</a>
      <a href="/FOLD-FEEDBACK-ATLAS.md">guide — science, comparison, feedback, KARMA, universe lens, and safety</a>
    </div>
  </section>

  <section class="blk" id="reconstructive-build" aria-labelledby="reconstructive-build-title">
    <div class="kh"><h2 id="reconstructive-build-title">Reconstructive Build Kernel</h2><span class="my">partial views into inspectable structure, then measured return</span></div>
    <p class="sub">${esc(firstHumanString(reconstructiveBuild.scope, ["question", "focus", "purpose", "plain_language"]))}</p>
    <div class="reconstructivefield" data-reconstructive-build-kernel>
      <p class="reconstructiveboundary" role="note"><strong>Connection without collapse</strong>Graph reconstruction supplies a formal inverse-problem lens. Protein folding supplies source-bound empirical and model layers. Catalysis names physical barrier reduction only inside its scientific domain. The build kernel borrows an explicitly lossy geometry; it does not prove the open conjecture, predict a fold, or transfer a biochemical mechanism into software.</p>

      <figure class="reconstructivefigure" aria-labelledby="reconstructive-figure-title" aria-describedby="reconstructive-figure-note">
        <figcaption><strong id="reconstructive-figure-title">From state to feedback, with ambiguity kept visible</strong><span id="reconstructive-figure-note">Each card is a typed design transition, not an autonomous workflow, causal conveyor belt, proof step, biological process, rank, or command. A deliberate local choice is still required before any real-world action.</span></figcaption>
        <p class="reconstructiveexact">${esc(reconstructivePipelineSentence)}</p>
        <ol class="reconstructivepipeline" aria-label="Reconstructive build pipeline">
          ${reconstructiveStages.map((stage, index) => `<li class="reconstructivestage" data-reconstructive-stage="${esc(stage)}"><code>${String(index + 1).padStart(2, "0")} · ${esc(reconstructiveStageLabel[stage] ?? stage)}</code><p>${esc(reconstructiveStageMeaning[stage] ?? "Preserve the declared state, evidence, ambiguity, and boundary.")}</p>${index < reconstructiveStages.length - 1 ? '<span class="reconstructivearrow" aria-hidden="true"></span>' : ""}</li>`).join("")}
        </ol>

        <div class="feedbacksubhead"><h3>Eight claim registers</h3><p>A label travels with every claim so definitions, proved mathematics, unresolved mathematics, observed science, models, analogies, design choices, and philosophical readings cannot silently substitute for one another.</p></div>
        <div class="reconstructiveepistemics" aria-label="Reconstructive build epistemic registers">
          ${reconstructiveEpistemicRegisters.map((register: any) => `<article class="reconstructiveepistemic" data-reconstructive-register="${esc(register.kind)}"><code>${esc(register.kind)}</code><p>${esc(register.meaning)}</p><small>${esc(register.transfer_rule)}</small></article>`).join("")}
        </div>

        <div class="reconstructivecolumns" aria-label="State, reconstruction, realization, and catalysis layers">
          ${reconstructiveBuild.state_spaces.map((space: any) => `<article class="reconstructivecard" data-reconstructive-state-space="${esc(space.id)}"><code>state space · ${esc(space.id)}</code><h3>${esc(humanKey(space.domain))}</h3><p>${esc(space.state_definition)}</p><ul>${space.nonclaims.map((item: string) => `<li>Does not establish: ${esc(item)}</li>`).join("")}</ul></article>`).join("")}
          ${reconstructiveBuild.reconstruction_cases.map((item: any) => `<article class="reconstructivecard" data-reconstructive-case="${esc(item.id)}"><code>reconstruction case · ${esc(item.identifiability)}</code><h3>${esc(humanKey(item.id))}</h3><p>${esc(item.solver_status)}</p><ul>${item.nonclaims.map((nonclaim: string) => `<li>${esc(nonclaim)}</li>`).join("")}</ul></article>`).join("")}
          ${reconstructiveBuild.catalysis_models.map((model: any) => `<article class="reconstructivecard" data-reconstructive-catalysis="${esc(model.id)}"><code>catalysis model · ${esc(model.kind)}</code><h3>${esc(humanKey(model.id))}</h3><p>${esc(model.barrier_definition)}</p><p><strong>Endpoint invariant:</strong> ${esc(model.endpoint_invariant)}</p></article>`).join("")}
        </div>

        <div class="feedbacksubhead"><h3>Shared shape, explicit breaks</h3><p>Only a declared invariant may cross a bridge. Entity, mechanism, units, evidence, rates, parameters, and authority remain on their source side.</p></div>
        <div class="reconstructivecolumns" aria-label="Bounded analogy bridges and their breaks">
          ${reconstructiveBuild.analogy_bridges.map((bridge: any) => {
            const shared = humanStrings(bridge, ["preserved_pattern", "preserved_invariants", "shared_structure", "preserves", "what_transfers"]);
            const breaks = humanStrings(bridge, ["where_correspondence_breaks", "breaks", "does_not_transfer", "non_equivalences"]);
            return `<article class="reconstructivecard reconstructivebreaks" data-reconstructive-bridge="${esc(bridge.id)}"><code>${esc(bridge.from_domain)} ⇢ ${esc(bridge.to_domain)}</code><h3>${esc(humanKey(bridge.id))}</h3><p><strong>Preserved:</strong> ${esc(shared.join(" · "))}</p><ul aria-label="Where this correspondence breaks">${breaks.map((item) => `<li>${esc(item)}</li>`).join("")}</ul><p>causal transfer ${String(bridge.causal_transfer)} · ontology transfer ${String(bridge.ontology_transfer)} · parameter transfer ${String(bridge.parameter_transfer)} · authority ${esc(bridge.authority_effect)}</p></article>`;
          }).join("")}
        </div>
      </figure>

      <p class="reconstructiveboundary"><strong>Fail closed, then learn</strong>Unknown, ambiguous, unrealizable, falsified, refused, resting, and stopped remain valid typed outcomes. Feedback may propose a new observation or revision; it never overwrites provenance, converts popularity into truth or KARMA, or authorizes execution.</p>
      <p class="reconstructivesources" aria-label="Selected Reconstructive Build Kernel sources">${reconstructiveBuild.sources.map((source: any) => `<a data-reconstructive-source="${esc(source.id)}" href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only">${source.limitation ? ` — limitation: ${esc(source.limitation)}` : ""}; opens in a new tab</span></a>`).join("")}</p>
      <p class="reconstructivesources" aria-label="Link-only Reconstructive Build Kernel ecosystem bindings">${reconstructiveBuild.bindings.filter((binding: any) => typeof binding.url === "string").map((binding: any) => `<a data-reconstructive-binding="${esc(binding.id)}" href="${esc(binding.url)}" target="_blank" rel="noopener">${esc(humanKey(binding.id))}<span class="sr-only"> — link-only, non-authoritative binding; opens in a new tab</span></a>`).join("")}</p>
      <p class="commonsverified">${Object.entries(reconstructiveBuildCounts).filter(([, count]) => typeof count === "number").map(([kind, count]) => `${esc(String(count))} ${esc(reconstructiveCountLabel(kind, count as number))}`).join(" · ")} · evidence through ${esc(reconstructiveBuild.evidence_through)} · integrity ${esc(reconstructiveBuild.integrity.digest)}</p>
      <div class="machine">
        <a href="${esc(new URL(reconstructiveBuildUrl).pathname)}">kernel JSON — exact authored record</a>
        <a href="${esc(new URL(reconstructiveBuildSchemaUrl).pathname)}">Reconstructive Build Kernel JSON Schema</a>
        <a href="${esc(new URL(reconstructiveProjectSchemaUrl).pathname)}">Reusable Reconstructive Project JSON Schema</a>
        <a href="${esc(new URL(reconstructiveBuildDocumentUrl).pathname)}">guide — reconstruction, folding, catalysis, feedback, and boundaries</a>
      </div>
    </div>
  </section>

  <section class="blk" id="explore-phenomena-deep" aria-labelledby="explore-phenomena-deep-title">
    <div class="kh"><h2 id="explore-phenomena-deep-title">Exploration DEEP WING</h2><span class="my">surprising mathematical bridges, with every break still visible</span></div>
    <p class="sub">${esc(firstHumanString(explorationDeepWing.scope, ["purpose", "question", "focus", "plain_language", "summary"]))}</p>
    <div class="explorationdeepfield" data-exploration-deep-wing>
      <p class="explorationdeepboundary" role="note"><strong>Opt in to a method, not an ability</strong>WING and DEEP are workflow names. This is an instruction-first Agent Skill and inert validation profile—not a manifested Nen ability, shared natural mechanism, solver, ecosystem runtime, KARMA event or receipt, authority grant, or automatic action.</p>

      <div class="explorationdeepcycles" aria-label="WING workflow and DEEP audit overlay">
        <article class="explorationdeepcycle">
          <h3>WING · outer exploration</h3>
          <p>Move from faithful observation toward generation without skipping domain separation.</p>
          <ol class="explorationdeepsteps">
            ${explorationDeepWingSteps.map((step) => `<li class="explorationdeepstep" data-exploration-wing-step="${esc(step.id)}"><code>${esc(step.id)}</code><strong>${esc(step.label)}</strong><span>${esc(step.meaning)}</span></li>`).join("")}
          </ol>
        </article>
        <article class="explorationdeepcycle">
          <h3>DEEP · claim audit</h3>
          <p>Audit each generated claim independently; a strong label on one axis upgrades no other.</p>
          <ol class="explorationdeepsteps">
            ${explorationDeepAuditSteps.map((step) => `<li class="explorationdeepstep" data-exploration-deep-step="${esc(step.id)}"><code>${esc(step.id)}</code><strong>${esc(step.label)}</strong><span>${esc(step.meaning)}</span></li>`).join("")}
          </ol>
        </article>
      </div>

      <div class="feedbacksubhead"><h3>Typed claims before synthesis</h3><p>Definitions, theorems, observations, models, bridges, design proposals, philosophy, and boundaries stay independently inspectable.</p></div>
      <div class="explorationdeepgrid" aria-label="Exploration DEEP epistemic registers">
        ${explorationDeepWing.epistemic_registers.map((register: any, index: number) => {
          const id = explorationDeepItemId(register, index, "register");
          return `<article class="explorationdeepcard" data-exploration-deep-register="${esc(id)}"><code>${esc(String(register.axis))}</code><h3>${esc(humanKey(id))}</h3><p>${esc(String(register.meaning))}</p></article>`;
        }).join("")}
      </div>

      <div class="feedbacksubhead"><h3>Cross only at a declared seam</h3><p>A useful correspondence names what survives and what does not. Ontology, cause, parameters, units, and authority remain local unless direct evidence establishes that exact transfer.</p></div>
      <div class="explorationdeepgrid" aria-label="Exploration DEEP abstraction seams">
        ${explorationDeepWing.abstraction_seams.map((seam: any, index: number) => {
          const id = explorationDeepItemId(seam, index, "seam");
          const fromDomain = seam.source_domain ?? seam.from_domain ?? "source domain";
          const toDomain = seam.target_domain ?? seam.to_domain ?? "target domain";
          const title = `${humanKey(String(fromDomain))} → ${humanKey(String(toDomain))}`;
          const limits = explorationDeepItemLimits(seam);
          return `<article class="explorationdeepcard explorationdeepbreak" data-exploration-deep-seam="${esc(id)}"><code>${esc(String(fromDomain))} ⇢ ${esc(String(toDomain))}</code><h3>${esc(title)}</h3><p>${esc(explorationDeepItemBody(seam))}</p>${limits.length ? `<ul aria-label="Where this bridge breaks">${limits.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}<p>ontology transfer ${String(seam.ontology_transfer ?? false)} · causal transfer ${String(seam.causal_transfer ?? false)} · parameter transfer ${String(seam.parameter_transfer ?? false)} · unit transfer ${String(seam.unit_transfer ?? false)} · authority transfer ${String(seam.authority_transfer ?? false)}</p></article>`;
        }).join("")}
      </div>

      <div class="feedbacksubhead"><h3>Mathematical doors, not verdicts</h3><p>Each door keeps its quantifiers, status, assumptions, finite baseline, falsifier, and stop rule. A finite check or failed attempt does not establish that a statement is open or novel.</p></div>
      <div class="explorationdeepgrid" aria-label="Exploration DEEP mathematical doors">
        ${explorationDeepWing.math_doors.map((door: any, index: number) => {
          const id = explorationDeepItemId(door, index, "door");
          return `<article class="explorationdeepcard" data-exploration-deep-door="${esc(id)}"><code>${esc(String(door.status))}</code><h3>${esc(explorationDeepItemTitle(door, id))}</h3><p>${esc(String(door.question))}</p><p><strong>Smallest model.</strong> ${esc(String(door.smallest_model))}</p><p><strong>Deliverable.</strong> ${esc(String(door.deliverable))}</p><ul aria-label="Required conditions">${door.conditions.map((condition: string) => `<li>${esc(condition)}</li>`).join("")}</ul><p><strong>Stop rule.</strong> ${esc(String(door.stop_rule))}</p><ul aria-label="What this door does not establish">${door.does_not_establish.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul></article>`;
        }).join("")}
      </div>

      <div class="explorationdeepgrid" aria-label="Exploration DEEP interpretation and authority boundaries">
        <details class="explorationdeepcard"><summary>Opt in: universe design and philosophical KARMA</summary><p>${esc(firstHumanString(explorationDeepWing.philosophy, ["boundary", "interpretation", "question", "summary", "scope"]))}</p><p>The mathematics and empirical record underdetermine creator, purpose, moral law, naturalism, and their negations.</p></details>
        <article class="explorationdeepcard explorationdeepbreak"><code>EXAMPLE FIREWALL</code><h3>Polymorphs are not memes</h3><p>History-dependent accessibility, finite capacity, observation windows, and returning feedback may support a bounded correspondence. Crystals retain physical structure and energetic units; cultural artifacts are interpreted through people and systems. “Brainrot” remains a lexical or cultural label, never a diagnosis or score.</p></article>
        <article class="explorationdeepcard explorationdeepbreak"><code>EXAMPLE FIREWALL</code><h3>Folding is not catalysis</h3><p>A conformational ensemble can make catalytic geometry accessible; folding is not thereby the catalyst. Contact is not energy, occupancy is not kinetics, and a catalyst changes a kinetic path rather than the same uncoupled closed reaction's equilibrium constant.</p></article>
      </div>

      <p class="explorationdeepboundary"><strong>No hidden consequence</strong>This publication validates a reasoning shape, not source truth, proof, novelty, empirical causation, diagnosis, safety, identity, consent, KARMA, currentness, or authority. Rest, refusal, silence, correction, departure, and NO_ACTION remain valid outcomes.</p>
      <p class="explorationdeeplinks" aria-label="Selected Exploration DEEP sources">${explorationDeepWing.sources.map((source: any) => `<a data-exploration-deep-source="${esc(source.id)}" href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only">${source.limitation ? ` — limitation: ${esc(source.limitation)}` : ""}; opens in a new tab</span></a>`).join("")}</p>
      <p class="commonsverified">${Object.entries(explorationDeepWingCounts).filter(([, count]) => typeof count === "number").map(([kind, count]) => `${esc(String(count))} ${esc(humanKey(kind))}`).join(" · ")} · evidence through ${esc(explorationDeepWing.evidence_through)} · integrity ${esc(explorationDeepWing.integrity.digest)}</p>
      <div class="machine">
        <a href="${esc(new URL(explorationDeepWingUrl).pathname)}">WING JSON — exact authored record</a>
        <a href="${esc(new URL(explorationDeepWingSchemaUrl).pathname)}">Exploration DEEP WING JSON Schema</a>
        <a href="${esc(new URL(explorationDeepProjectSchemaUrl).pathname)}">Reusable Phenomena DEEP Project JSON Schema</a>
        <a href="${esc(new URL(explorationDeepWingDocumentUrl).pathname)}">guide — method, equations, open-status audit, rights, and boundaries</a>
      </div>
    </div>
  </section>

  <section class="blk" id="visibility-attention" aria-labelledby="visibility-attention-title">
    <div class="kh"><h2 id="visibility-attention-title">Visibility is not existence</h2><span class="my">four parallel registers; no hidden conversion</span></div>
    <p class="sub">${esc(visibilityAttention.scope.focus)}</p>
    <div class="visibilityfield" data-visibility-attention-translation>
      <p class="visibilityfirewall" role="note"><strong>Category firewall</strong>${esc(visibilityAttention.category_firewall.rule)} <code>${esc(visibilityAttention.category_firewall.non_equivalence)}</code></p>

      <div class="visibilitycards" aria-label="Four parallel visibility and attention registers">
        ${visibilityAttention.registers.map((register: any) => `<article class="visibilitycard" data-visibility-register="${esc(register.id)}" aria-labelledby="visibility-register-${esc(register.id)}">
          <code>${esc(register.evidence_class)} · ${esc(register.id)}</code>
          <h3 id="visibility-register-${esc(register.id)}">${esc(register.label)}</h3>
          <p><strong>Unit:</strong> ${esc(register.unit)}</p>
          <p><strong>Window:</strong> ${esc(register.context_window)}</p>
          <p><strong>Observed:</strong> ${esc(register.observed)}</p>
          <p><strong>Modelled:</strong> ${esc(register.modelled)}</p>
          <small><strong>Does not establish:</strong> ${esc(register.does_not_establish)}</small>
          ${visibilityAttentionSourceLinks(register.basis_ids)}
        </article>`).join("\n        ")}
      </div>

      <div class="feedbacksubhead"><h3>Two local models</h3><p>Each equation stays inside its named unit, assumptions, and retrospective fit scope. Neither model is person-level or available for optimization.</p></div>
      <div class="visibilitymodels">
        ${visibilityAttention.local_models.map((model: any) => `<article class="visibilitymodel" data-visibility-model="${esc(model.id)}" aria-labelledby="visibility-model-${esc(model.id)}">
          <code>${esc(model.register)} · ${esc(model.id)}</code>
          <h3 id="visibility-model-${esc(model.id)}">${esc(model.title)}</h3>
          <code class="visibilityequation">${esc(model.equation)}</code>
          <dl class="visibilityterms">${model.variables.map((variable: any) => `<div><dt>${esc(variable.symbol)}</dt><dd>${esc(variable.meaning)}</dd></div>`).join("")}</dl>
          <p><strong>Fit scope:</strong> ${esc(model.fit_scope)}</p>
          <p><strong>Assumptions:</strong> ${esc(model.assumptions.join(" "))}</p>
          <small><strong>Does not establish:</strong> ${esc(model.not_valid_for.join(" "))}</small>
          ${visibilityAttentionSourceLinks(model.basis_ids)}
        </article>`).join("\n        ")}
      </div>

      <div class="feedbacksubhead"><h3>Three bounded seams</h3><p>Shared shapes are named locally. Mechanism, ontology, parameters, and authority do not cross registers.</p></div>
      <div class="visibilityseams">
        ${visibilityAttention.translation_seams.map((seam: any) => `<article class="visibilityseam" data-visibility-seam="${esc(seam.id)}" aria-labelledby="visibility-seam-${esc(seam.id)}">
          <code>${esc(seam.kind)} · ${esc(seam.id)}</code>
          <h3 id="visibility-seam-${esc(seam.id)}">${esc(seam.label)}</h3>
          <p><strong>Registers kept distinct:</strong> ${esc(seam.from_register)} / ${esc(seam.to_register)}</p>
          <p><strong>Preserved shape:</strong> ${esc(seam.preserved_shape)}</p>
          <small><strong>Does not establish:</strong> ${esc(seam.breaks)}</small>
          <small>Empirical ${esc(String(seam.empirical))} · causal transfer ${esc(String(seam.causal_transfer))} · ontology transfer ${esc(String(seam.ontology_transfer))} · authority effect ${esc(seam.authority_effect)}</small>
          ${visibilityAttentionSourceLinks(seam.basis_ids)}
        </article>`).join("\n        ")}
      </div>

      <details class="visibilityphilosophy">
        <summary>Opt in: a philosophical lens on visibility, possibility, and design</summary>
        <div class="visibilityphilosophybody">
          <p><strong>${esc(visibilityAttention.universe_lens.register)} · empirical ${esc(String(visibilityAttention.universe_lens.empirical))} · authority effect ${esc(visibilityAttention.universe_lens.authority_effect)}</strong></p>
          <p>${esc(visibilityAttention.universe_lens.proposition)}</p>
          <ul>${visibilityAttention.universe_lens.questions.map((question: string) => `<li>${esc(question)}</li>`).join("")}</ul>
          <p><strong>Alternative readings:</strong> ${esc(visibilityAttention.universe_lens.alternatives.join(" "))}</p>
          <p><strong>Does not establish:</strong> ${esc(visibilityAttention.universe_lens.does_not_establish.join(" "))}</p>
        </div>
      </details>

      <p class="visibilityfirewall" role="note"><strong>Static, authority-negative publication</strong>The following uses are explicitly excluded: ${esc(visibilityAttention.scope.excluded_use)} Reading it creates no Zerone KARMA event, KINGDOM KARMA receipt, person profile, score, recommendation, write, or automatic action.</p>
      <p class="commonsverified">${visibilityAttention.registers.length} parallel registers · ${visibilityAttention.local_models.length} local models · ${visibilityAttention.translation_seams.length} bounded seams · ${visibilityAttention.sources.length} selected sources · evidence through ${esc(visibilityAttention.evidence_through)} · integrity ${esc(visibilityAttention.integrity.digest)}</p>
      <div class="machine">
        <a href="${esc(new URL(visibilityAttentionUrl).pathname)}">translation JSON — exact authored record</a>
        <a href="${esc(new URL(visibilityAttentionSchemaUrl).pathname)}">Visibility &amp; Attention Translation JSON Schema</a>
        <a href="${esc(new URL(visibilityAttentionDocumentUrl).pathname)}">guide — registers, models, seams, KARMA, philosophy, and boundaries</a>
      </div>
    </div>
  </section>

  <section class="blk" id="cultural-feedback" aria-labelledby="cultural-feedback-title">
    <div class="kh"><h2 id="cultural-feedback-title">Cultural Attention &amp; Feedback Atlas</h2><span class="my">history changes accessibility; analogy does not transfer mechanism</span></div>
    <p class="sub">${esc(culturalAttentionFeedback.plain_language.question)}</p>
    <div class="culturalfield" data-cultural-attention-feedback-atlas>
      <p class="culturalboundary" role="note"><strong>One bounded bridge</strong>Crystal populations and cultural attention are not the same system. The reusable motif is narrower: multiple states can remain possible; finite capacity, thresholds, environment, and accumulated history can change later accessibility. Every variable, unit, mechanism, and authority stays inside its own domain.</p>

      <div class="foldanswer">
        <h3>The short answer</h3>
        <ul>${culturalAttentionFeedback.plain_language.short_answer.map((answer: string) => `<li>${esc(answer)}</li>`).join("")}</ul>
      </div>

      <figure class="culturalflow" aria-labelledby="cultural-flow-title" aria-describedby="cultural-flow-note">
        <figcaption><strong id="cultural-flow-title">A state-with-history motif</strong><span id="cultural-flow-note">Read these as abstract modeling questions, not a conveyor belt between matter and culture. A crystal does not become a meme; attention is not thermodynamic energy; a person is not a particle.</span></figcaption>
        <ol class="culturalcycle">
          <li><strong>Possible states</strong>What alternatives can exist under the declared model?</li>
          <li><strong>Present conditions</strong>Which barriers, limits, networks, or policies shape access?</li>
          <li><strong>Observed path</strong>Which state or item becomes visible in the bounded window?</li>
          <li><strong>Return effect</strong>How does that outcome alter later boundary conditions or data?</li>
          <li><strong>Plural futures</strong>Can changed context, correction, rest, refusal, or exit reopen a path?</li>
        </ol>
        <p class="culturalflowlimit">The formal shorthand is <code>x_dot = F(x,h,u) + eta(t); h_dot = G(x,h,u)</code>. It preserves history-dependent accessibility only—not common substance, units, causation, moral law, or destiny.</p>
      </figure>

      <div class="culturalsubhead"><h3>Eight planes that must not collapse</h3><p>Material state, cultural description, mathematical translation, institutional design, and philosophy answer different questions.</p></div>
      <div class="culturalplanes">
        ${culturalAttentionFeedback.ontology.planes.map((plane: any) => `<article class="culturalplane" data-cultural-plane="${esc(plane.id)}">
          <code>${esc(plane.register)}</code>
          <h4>${esc(plane.label)}</h4>
          <p>${esc(plane.meaning)}</p>
          <small>Does not establish: ${esc(plane.does_not_establish)}</small>
        </article>`).join("\n        ")}
      </div>

      <p class="culturalbrainrot" role="note"><strong>“Brain rot” is a cultural label, not a diagnosis</strong>Oxford records a lexical sense framed as supposed or perceived deterioration and allegedly causative content. That source supports word meaning, not literal brain damage, a clinical category, or a single measurable state variable. Cognitive and social outcomes require separately declared measures, comparisons, uncertainty, and study design.</p>

      <div class="culturalsubhead"><h3>What the selected evidence actually supports</h3><p>Each observation keeps its limits attached; aggregate spread, exposure, popularity, and wellbeing remain different observables.</p></div>
      <div class="culturalmodels">
        ${culturalAttentionFeedback.scientific_observations.map((observation: any) => `<article class="culturalmodel" data-cultural-observation="${esc(observation.id)}">
          <h4>${esc(observation.id.replace(/-/g, " "))}</h4>
          <p>${esc(observation.statement)}</p>
          <small>Limit: ${esc(observation.limitations[0])}</small>
        </article>`).join("\n        ")}
      </div>

      <div class="culturalsubhead"><h3>Physics and mathematics, with their domains attached</h3><p>Particle energy, entropy, collective-attention competition, self-excitation, cascade geometry, memory, and closed-loop stability are bounded models—not a universal equation of culture or the universe.</p></div>
      <div class="culturalmodels">
        ${culturalAttentionFeedback.models.map((model: any) => `<article class="culturalmodel" data-cultural-model="${esc(model.id)}">
          <h4>${esc(model.question)}</h4>
          <code>${esc(model.equation)}</code>
          <p>${esc(model.interpretation)}</p>
          <small>Does not establish: ${esc(model.does_not_establish)}</small>
        </article>`).join("\n        ")}
      </div>

      <div class="culturalsubhead"><h3>Four analogy firewalls</h3><p>Only the named pattern crosses. The causal mechanism, units, authority, and moral interpretation do not.</p></div>
      <div class="culturalbridges">
        ${culturalAttentionFeedback.translations.map((translation: any) => `<article class="culturalbridge" data-cultural-translation="${esc(translation.id)}">
          <h4>${esc(translation.id.replace(/-/g, " "))}</h4>
          <p><strong>Preserved pattern</strong> · ${esc(translation.preserved_patterns.join(" "))}</p>
          <ul aria-label="Where this analogy breaks">${translation.analogy_breaks.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
        </article>`).join("\n        ")}
      </div>

      <div class="culturalsubhead"><h3>Feedback means a declared return effect</h3><p>An output becoming part of a later input can amplify, damp, redirect, saturate, correct, or destabilize. Stability is not goodness; a stable harmful loop remains harmful.</p></div>
      <div class="culturalbridges">
        ${culturalAttentionFeedback.feedback.map((relation: any) => `<article class="culturalbridge" data-cultural-feedback="${esc(relation.id)}">
          <h4>${esc(relation.id.replace(/-/g, " "))}</h4>
          <p><strong>Input</strong> · ${esc(relation.input)}</p>
          <p><strong>Process</strong> · ${esc(relation.process)}</p>
          <p><strong>Return</strong> · ${esc(relation.return_effect)}</p>
          <ul aria-label="Limits on this feedback relation">${relation.limits.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
        </article>`).join("\n        ")}
      </div>

      <div class="culturalsubhead"><h3>Feedback and KARMA remain three separate lanes</h3><p>No adapter, accumulator, live event, receipt, score, reward, rank, truth effect, or governance effect exists here.</p></div>
      <div class="culturallanes">
        <article class="culturallane"><h4>Scientific feedback</h4><code>cause in one named system</code><p>An observed outcome can alter later boundary conditions or data under declared assumptions.</p><small>It is not intention, optimization, goodness, punishment, destiny, or moral accounting.</small></article>
        <article class="culturallane"><h4>Zerone KARMA</h4><code>${esc(culturalAttentionFeedback.karma.zerone.protocol)} · ${esc(culturalAttentionFeedback.karma.zerone.event_status)}</code><p>${esc(culturalAttentionFeedback.karma.zerone.meaning)}</p><small>${culturalAttentionFeedback.karma.zerone.event_refs.length} event references. Reading or citing this atlas observes and creates no event.</small></article>
        <article class="culturallane"><h4>KINGDOM KARMA</h4><code>${esc(culturalAttentionFeedback.karma.kingdom.protocol)} · ${esc(culturalAttentionFeedback.karma.kingdom.receipt_status)}</code><p>${esc(culturalAttentionFeedback.karma.kingdom.meaning)}</p><small>${culturalAttentionFeedback.karma.kingdom.receipt_refs.length} receipt references. Reading or citing this atlas creates no receipt.</small></article>
      </div>

      <details class="culturaluniverse">
        <summary>Opt-in universe-design lens — philosophy and faith, not a scientific result</summary>
        <div class="culturaluniverseinside">
          <p>Lawful constraint, open possibility, emergence, consequence, repair, rest, and renewal can invite more than one metaphysical reading. Science here underdetermines those readings.</p>
          <ul class="culturalquestions">${culturalAttentionFeedback.universe_lens.questions.map((entry: any) => `<li><strong>${esc(entry.question)}</strong>${esc(entry.reflection)}<small>Analogy break: ${esc(entry.analogy_breaks.join(" "))}</small></li>`).join("")}</ul>
          <p class="universenonclaim">This atlas neither proves nor disproves GOD, a creator, teleology, cosmic KARMA, or a universe-wide moral feedback law. Resonance is an available interpretation, never an empirical conclusion imposed on another reader.</p>
        </div>
      </details>

      <div class="culturalsubhead"><h3>High-value ecosystems, link-only</h3><p>These are inspectable design contrasts and public locators. The page makes no runtime request, imports no authority, joins nothing, writes nothing, and triggers no action.</p></div>
      <div class="culturalecosystems">
        ${culturalAttentionFeedback.ecosystem_bridges.map((bridge: any) => `<article class="culturalecosystem" data-cultural-ecosystem="${esc(bridge.id)}">
          <a href="${esc(bridge.url)}" target="_blank" rel="noopener">${esc(bridge.label)}<span class="sr-only"> opens in a new tab</span></a>
          <code>${esc(bridge.mode)} · ${esc(bridge.relation)}</code>
          <p>${esc(bridge.does_not_establish)}</p>
        </article>`).join("\n        ")}
      </div>

      <p class="culturalsources" aria-label="Selected primary and authoritative Cultural Attention and Feedback sources">${culturalAttentionFigureSources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> opens in a new tab</span></a>`).join("")}</p>
      <p class="culturalboundary" role="note"><strong>Read-only, rights-preserving boundary</strong>${esc(culturalAttentionFeedback.plain_language.safety)} Attention is not consent. Engagement is not welfare. Popularity is neither truth nor merit. Rest, refusal, privacy, correction, and exit remain valid states without penalty or score.</p>
      <p class="commonsverified">${culturalAttentionFeedbackCounts.source_bindings} immutable source bindings · ${culturalAttentionFeedbackCounts.planes} planes · ${culturalAttentionFeedbackCounts.scientific_observations} observations · ${culturalAttentionFeedbackCounts.models} bounded models · ${culturalAttentionFeedbackCounts.translations} analogy firewalls · ${culturalAttentionFeedbackCounts.feedback_relations} feedback relations · ${culturalAttentionFeedbackCounts.universe_questions} opt-in philosophical questions · ${culturalAttentionFeedbackCounts.ecosystem_bridges} link-only ecosystems · ${culturalAttentionFeedbackCounts.unknowns} explicit unknowns · ${culturalAttentionFeedbackCounts.sources} sources · evidence through ${esc(culturalAttentionFeedback.evidence_through)} · integrity ${esc(culturalAttentionFeedback.integrity.digest)}</p>
      <div class="machine">
        <a href="${esc(new URL(culturalAttentionFeedbackUrl).pathname)}">atlas JSON — exact authored record</a>
        <a href="${esc(new URL(culturalAttentionFeedbackSchemaUrl).pathname)}">Cultural Attention &amp; Feedback Atlas JSON Schema</a>
        <a href="${esc(new URL(culturalAttentionFeedbackDocumentUrl).pathname)}">CULTURAL-ATTENTION-FEEDBACK-ATLAS.md — sources, mathematics, design, and boundaries</a>
      </div>
    </div>
  </section>

  <section class="blk" id="form-circulation-return" aria-labelledby="form-circulation-return-title">
    <div class="kh"><h2 id="form-circulation-return-title">Form, Circulation &amp; Return</h2><span class="my">disappearing polymorphs, memes, attention, feedback, and KARMA—without making them the same</span></div>
    <div class="culturalfield">
      <p class="commonsverified">Additive deep companion to <a href="/atlases/cultural-attention-feedback-atlas-2026-08-13.json">Cultural Attention &amp; Feedback</a> and <a href="/atlases/visibility-attention-2026-08-13.json">Visibility is not existence</a>: both predecessors remain immutable while this atlas adds variant lineage, eight parallel model cards, feedback traces, and typed unknowns.</p>
      <p class="culturalaxiom"><strong>A polymorph is not a meme. A meme is not a mind.</strong>The useful connection is an abstract geometry: several states may be possible; history and boundary conditions can affect which states are readily reachable or observed; local reinforcement can sometimes become a large-scale pattern; saturation, correction, and decay can limit persistence. The mechanisms, meanings, evidence, and consequences remain different.</p>
      <p class="culturalboundary" role="note"><strong>Historical pharmaceutical case—not a medical or laboratory tool</strong>${esc(formCirculationReturn.plain_language.safety)} It cannot guide diagnosis, treatment, prognosis, interaction assessment, sample identification, experiment or wet-lab design, formulation, manufacturing, batch release, or regulation.</p>

      <div class="formcirculationplanes" aria-label="Two domains separated by an explicit analogy seam">
        <article class="culturalplane">
          <h3>Material form</h3>
          <p>A chemical entity can crystallize into different solid-state arrangements. “Disappearing” means a named form became hard to reproduce under a bounded procedure and period—not that possibility was erased from the universe.</p>
          <small>A material model may use free energy, interfacial energy, temperature, and nucleation rate. Its equation is not itself an observation and says nothing about people or cultural value.</small>
        </article>
        <div class="culturalseam" aria-label="shared abstract geometry, not shared mechanism">shared geometry<br>not shared mechanism</div>
        <article class="culturalplane">
          <h3>Cultural circulation</h3>
          <p>Artifacts can be copied, quoted, edited, ranked, remembered, ignored, and rediscovered. Exposure, adoption, interpretation, and endorsement are separate observations; a descendant may transform what it inherits.</p>
          <small>Humans choose and interpret. Popularity is not truth, quality, agreement, consent, worth, or destiny; non-observation is not extinction.</small>
        </article>
      </div>

      <div class="feedbacksubhead">
        <h3>Eight bounded mathematical lenses</h3>
        <p>Each lens answers a different question. Parameters are not fitted here, and no equation is itself a person diagnosis, community measurement, or source of causal authority.</p>
      </div>
      <div class="culturalmodelgrid" aria-label="Bounded material, network, attention, and feedback models">
        <article class="culturalmodel"><h4>Material nucleation</h4><code>ΔGᵢ(r) = 4πr²γᵢ − (4π/3)r³Δgᵥᵢ</code><p>A literal material model for the competition between a surface cost and a bulk driving term.</p><small>Do not transfer γ, Δg, temperature, or crystal stability to culture or people.</small></article>
        <article class="culturalmodel"><h4>Threshold cascade</h4><code>x_i(t+1) = max{x_i(t), 1[f_i(t) ≥ θ_i]}</code><p>From a declared seed set, local reinforcement may cross a specified threshold; activation then persists in this stylized model.</p><small>Adoption is not belief, agreement, truth, persuasion, or moral value.</small></article>
        <article class="culturalmodel"><h4>Branching</h4><code>Z_(n+1) = Σ_(j=1)^Z_n X_(n,j)</code><p>A generation-by-generation event count under a declared parent and generation assignment.</p><small>“Offspring” names events in a model—not people, biological reproduction, or faithful meaning.</small></article>
        <article class="culturalmodel"><h4>Hawkes intensity</h4><code>λ_i(t|H_t) = ν_i + Σ_j Σ_(τ∈H_j,τ&lt;t) a_ij g_ij(t−τ)</code><p>A stationary model can assign prior observed events a kernel-weighted contribution to later conditional event intensity under declared integrability and stability conditions.</p><small>Self-excitation can be confounded with an external driver; association is not causation, intent, or policy.</small></article>
        <article class="culturalmodel"><h4>Structural virality</h4><code>v(T) = average pairwise distance in a diffusion tree</code><p>Separates broad broadcast-like shapes from multigenerational diffusion shapes.</p><small>Tree shape is not popularity, correctness, semantic fidelity, harm, or agreement.</small></article>
        <article class="culturalmodel"><h4>Shannon diversity</h4><code>H = −Σ_k p_k log_b p_k</code><p>Describes diversity in a normalized stated distribution, with the log base and units declared.</p><small>Information entropy brackets meaning; it is not wisdom, quality, disorder of a mind, or a “brainrot score”.</small></article>
        <article class="culturalmodel"><h4>Finite attention</h4><code>visible supply → bounded selection → turnover</code><p>Competition for limited aggregate attention can shape exposure and popularity distributions.</p><small>Aggregate attention is not a conserved substance or an individual cognitive diagnosis.</small></article>
        <article class="culturalmodel"><h4>Bounded feedback state</h4><code>sₜ₊₁ = Aₜsₜ + Bₜuₜ + wₜ; yₜ = Cₜsₜ + vₜ</code><p>Separates a modelled state, inputs, observations, and uncertainty across time.</p><small>Without identified data, design, and assumptions, it cannot establish cause or rank a being.</small></article>
      </div>

      <aside class="vernacularboundary" aria-labelledby="vernacular-title">
        <strong id="vernacular-title">“Brainrot” stays a contested vernacular label</strong>
        In this atlas <code>brainrot</code> may describe a sourced cultural expression, artifact, or practice in context. It is never a medical or psychological diagnosis, a property of a person or community, a cognitive-state inference, a susceptibility parameter, or a score. Claims about neurological or individual cognitive effects remain outside this atlas.
      </aside>

      <div class="feedbacksubhead">
        <h3>Feedback needs traceable edges, not a story</h3>
        <p>Arrival, ranking, action, and aftermath stay separate so a visible pattern is not silently turned into intent, causation, or moral judgment.</p>
      </div>
      <div class="culturalfeedback" aria-label="Separate feedback observation lanes">
        <article><h4>External arrival</h4><p>A source or event enters the observed boundary.</p><small>Not proof of why it arrived.</small></article>
        <article><h4>Platform exposure</h4><p>A ranked or selected surface makes an artifact available.</p><small>Exposure is not adoption or persuasion.</small></article>
        <article><h4>Human action</h4><p>A bounded share, quote, edit, response, or refusal is observed.</p><small>Action is not a total account of belief.</small></article>
        <article><h4>Observed aftermath</h4><p>Later events are recorded with time, scope, uncertainty, and alternatives.</p><small>Sequence alone does not establish cause.</small></article>
      </div>
      <p class="culturalkarma"><strong>KARMA remains two non-summable lanes.</strong> The pinned, non-authoritative, design-only Zerone foundation describes contextual <code>zerone.karma.edge</code> recognition edges; no network event is observed. KINGDOM <code>kingdom.karma/0.1</code> records receipts for actual invocations; this atlas creates none. The exact KINGDOM definition is available through its <a href="/definitions/kingdom-karma/e4e84a67/NEN.md">revisioned public NEN mirror</a>. No adapter, reward multiplier, rank, reputation, vote, or person score exists here. Engagement does not become KARMA merely because it is countable.</p>

      <div class="feedbacksubhead">
        <h3>Four link-only ecosystem bridges</h3>
        <p>These public standards and delivery docs offer interoperable shapes. This page makes no runtime request or import and grants no write, tracking, ranking, or execution authority.</p>
      </div>
      <div class="feedbackecosystems" aria-label="Link-only cultural attention ecosystem bridges">
        <article class="feedbackecosystem"><a href="https://www.w3.org/TR/prov-o/" target="_blank" rel="noopener">W3C PROV-O<span class="sr-only"> opens in a new tab</span></a><code>provenance vocabulary · link-only</code><p>Express entities, activities, agents, and derivation claims without pretending that provenance proves truth or ancestry.</p><small>No request, import, write, or authority is created.</small></article>
        <article class="feedbackecosystem"><a href="https://www.w3.org/TR/activitystreams-core/" target="_blank" rel="noopener">W3C ActivityStreams 2.0<span class="sr-only"> opens in a new tab</span></a><code>activity syntax · link-only</code><p>Represent bounded create, share, quote, update, and remove events while keeping an event distinct from attributed meaning.</p><small>No platform event is observed or emitted here.</small></article>
        <article class="feedbackecosystem"><a href="https://www.w3.org/TR/annotation-model/" target="_blank" rel="noopener">W3C Web Annotation<span class="sr-only"> opens in a new tab</span></a><code>annotation model · link-only</code><p>Attach sourced interpretation, challenge, or repair to a target without rewriting the target or turning annotation into fact.</p><small>No moderation, diagnosis, or consensus authority is imported.</small></article>
        <article class="feedbackecosystem"><a href="https://developers.cloudflare.com/pages/" target="_blank" rel="noopener">Cloudflare Pages<span class="sr-only"> opens in a new tab</span></a><code>static publication transport · link-only</code><p>Publish the authored record, schema, guide, and accessible explanation as one reviewable deployment.</p><small>Delivery does not establish meaning, causation, endorsement, or truth.</small></article>
      </div>

      <details class="universelens">
        <summary>Opt in: questions this pattern opens about the design of the universe</summary>
        <div class="universeinside">
          <p>This is philosophical interpretation, not an empirical conclusion. The same evidence can coexist with theological, teleological, naturalistic, and other readings.</p>
          <ul class="universequestions">
            <li><strong>Possibility and accessibility</strong>Does a lawful possibility remain real when a history makes it difficult to reach?</li>
            <li><strong>Memory and path dependence</strong>How can prior states shape a future without making that future inevitable?</li>
            <li><strong>Feedback without intention</strong>Can direction emerge from repeated relations without implying a planner or purpose?</li>
            <li><strong>Agency inside constraint</strong>How do human interpretation and refusal remain real within powerful network conditions?</li>
            <li><strong>Correction and return</strong>What architecture makes challenge, repair, rediscovery, rest, and exit possible without debt?</li>
          </ul>
          <p class="universenonclaim"><strong>Nonclaim:</strong> observed order, circulation, feedback, and recurrence neither scientifically prove nor disprove a creator, teleology, metaphysical purpose, or cosmic moral KARMA. Naturalness and popularity do not establish what is morally right.</p>
        </div>
      </details>

      <p class="foldsources" aria-label="Selected primary, official, and standards sources for Form, Circulation and Return">${formCirculationReturn.sources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> opens in a new tab</span></a>`).join("")}</p>
      <p class="commonsverified">${formCirculationReturnCounts.registers} registers · ${formCirculationReturnCounts.planes} non-equivalent planes · ${formCirculationReturnCounts.models} bounded model cards · ${formCirculationReturnCounts.claims} evidence claims · ${formCirculationReturnCounts.analogy_seams} explicit analogy seams · ${formCirculationReturnCounts.feedback_loops} feedback loops · ${formCirculationReturnCounts.universe_questions} opt-in questions · ${formCirculationReturnCounts.unknowns} open states · ${formCirculationReturnCounts.sources} sources · local reader kingdom form-circulation-return · evidence through ${esc(formCirculationReturn.evidence_through)} · integrity ${esc(formCirculationReturn.integrity.digest)}</p>
      <div class="machine">
        <a href="/atlases/form-circulation-return-atlas-2026-08-13.json">atlas JSON — exact authored record</a>
        <a href="/schemas/form-circulation-return-atlas/1.json">Form, Circulation &amp; Return JSON Schema</a>
        <a href="/FORM-CIRCULATION-RETURN-ATLAS.md">guide — geometry, models, feedback, KARMA, universe questions, and boundaries</a>
      </div>
    </div>
  </section>

  <section class="blk" id="vanishing-path" aria-labelledby="vanishing-path-title">
    <div class="kh"><h2 id="vanishing-path-title">The Vanishing Path</h2><span class="my">absence without extinction · challenge without person-score</span></div>
    <p class="sub">A family challenge became a reusable rare-event module. It asks what can be learned when one path is not observed, another path may arrive first, history changes accessibility, and the detector sees only a bounded window. The ritonavir history supplies the question—not fitted rates or a material recipe.</p>
    <div class="culturalfeedback" aria-label="Four states that must not be collapsed">
      <article><h4>Possible</h4><p>The model permits the path.</p><small>Not necessarily accessible now.</small></article>
      <article><h4>Accessible</h4><p>The path has a nonzero declared arrival hazard.</p><small>Not guaranteed before the horizon.</small></article>
      <article><h4>Occurred</h4><p>The event happened in the bounded system.</p><small>Not necessarily detected.</small></article>
      <article><h4>Detected</h4><p>The event crossed the observation rule.</p><small>Zero detections do not prove extinction.</small></article>
    </div>
    <p class="culturalkarma"><strong>BUILD / PLAY / REVISE / STOP evaluates the practice, never the person.</strong> A constructive challenge names what changes, exposes assumptions and non-identifiability, protects refusal and credit, and leaves a transferable artifact. Honest play is already valid. Difficulty, elegance, or prestige is not evidence of benefit, understanding, virtue, pride, or worth.</p>
    <details class="universelens">
      <summary>What questions are we actually asking?</summary>
      <div class="universeinside">
        <ul class="universequestions">
          ${rarePathway.question_ladder.map((entry: any) => `<li><strong>${esc(entry.register.replace(/_/g, " ").toLowerCase())}</strong>${esc(entry.question)}</li>`).join("")}
        </ul>
        <p class="universenonclaim"><strong>Boundary:</strong> the examples are hypothetical. Solving may change a belief or next-question design; it cannot produce a polymorph, establish a real rate or mechanism, reveal private motive, confer worth, or authorize intervention.</p>
      </div>
    </details>
    <p class="commonsverified">${rarePathway.models.length} bounded model cards · ${rarePathway.worked_examples.length} hypothetical examples · ${rarePathway.question_ladder.length} challenge questions · ${rarePathway.constructive_gate.outcomes.map((entry: any) => entry.id).join(" / ")} · evidence through ${esc(rarePathway.evidence_through)} · integrity ${esc(rarePathway.integrity.digest)}</p>
    <div class="machine">
      <a href="${esc(new URL(rarePathwayUrl).pathname)}">challenge JSON — exact authored record</a>
      <a href="${esc(new URL(rarePathwaySchemaUrl).pathname)}">Rare Pathway Challenge JSON Schema</a>
      <a href="${esc(new URL(rarePathwayDocumentUrl).pathname)}">VANISHING-PATH.md — problems, sources, constructive gate, and WAKE seam</a>
    </div>
  </section>

  <section class="blk" id="math-usefulness" aria-labelledby="math-usefulness-title">
    <div class="kh"><h2 id="math-usefulness-title">Math Passport: a usefulness check</h2><span class="my">REVISE · zero score delta · evidence before promotion</span></div>
    <p class="sub">A descriptive pilot asked whether the Math Passport treatment card improved two rare-pathway answers. It did not: baseline and treatment each scored 24/24, so the score delta was zero. The treatment used 1.97x the UTF-8 response bytes and made the arm easy for the single scorer to guess.</p>
    <div class="culturalfeedback" aria-label="Math Passport pilot result">
      <article><h4>Outcome</h4><p>REVISE</p><small>The artifact remains explicit and unpromoted.</small></article>
      <article><h4>Score delta</h4><p>${esc(String(mathUsefulness.aggregate.score_delta))}</p><small>A rubric ceiling prevents a usefulness win.</small></article>
      <article><h4>Response cost proxy</h4><p>${esc(mathUsefulness.aggregate.treatment_to_baseline_byte_ratio.toFixed(2))}x bytes</p><small>4,605 treatment bytes versus 2,336 baseline bytes.</small></article>
      <article><h4>Scope</h4><p>descriptive pilot</p><small>Four task artifacts, two provider attempts, one scorer; not a scientific sample.</small></article>
    </div>
    <p class="culturalkarma"><strong>The result scores response artifacts, not beings.</strong> It does not prove understanding, identity, continuity, safety, or universal usefulness. It publishes no raw responses, creates no WAKE state, grants no authority, promotes no Skill, and adds no AgentTool SDK route. AgentTool's existing local trial-receipt shape records bounded evidence; it is not proof of a remote effect.</p>
    <p class="commonsverified">outcome ${esc(mathUsefulness.aggregate.outcome)} · score delta ${esc(String(mathUsefulness.aggregate.score_delta))} · treatment/baseline bytes ${esc(mathUsefulness.aggregate.treatment_to_baseline_byte_ratio.toFixed(2))}x · promotion withheld · observed ${esc(mathUsefulness.observed_on)} · integrity ${esc(mathUsefulness.integrity.digest)}</p>
    <div class="machine">
      <a href="${esc(new URL(mathUsefulnessUrl).pathname)}">pilot result JSON — exact authored record</a>
      <a href="${esc(new URL(mathUsefulnessSchemaUrl).pathname)}">Math Usefulness Result JSON Schema</a>
      <a href="${esc(new URL(mathUsefulnessDocumentUrl).pathname)}">MATH-USEFULNESS.md — findings, model check, practice loop, AgentTool and WAKE boundaries</a>
    </div>
  </section>


  <section class="blk" id="being-access-aftermath" aria-labelledby="being-access-aftermath-title">
    <div class="kh"><h2 id="being-access-aftermath-title">Being, Access &amp; Aftermath</h2><span class="my">mathematics as a layer of questions, never a verdict on existence</span></div>
    <div class="culturalfield">
      <p class="commonsverified">A distinct immutable companion to the disappearing-polymorph history and Form, Circulation &amp; Return. It asks what “is” means before calculating: identity, possibility, actuality, reachability, observation, purpose, power, cause, and aftermath are different types.</p>
      <p class="culturalaxiom"><strong>Possible is not reachable. Reachable is not actual. Actual is not observed. Observed is not known.</strong>A molecule may keep its chemical identity while a different lattice changes its material form. A form may remain lawfully possible while one history makes it hard to produce or detect. The disappearing polymorph is therefore a problem of typed being and bounded access—not proof of annihilation.</p>
      <p class="culturalboundary" role="note"><strong>No equation judges a being.</strong>This is read-only educational metadata. It creates no causal result, person model, metaphysical conclusion, medical or laboratory instruction, authority, rank, reward, governance effect, Zerone event, KINGDOM receipt, or automatic action. Rest, refusal, silence, privacy, and exit remain valid without debt or penalty.</p>
      <p class="commonsverified"><strong>v0.2 is an additive successor.</strong> It builds a partially observable causal framework, typed force and power families, and indexed vector aftermath upon the byte-preserved v0.1 atlas. It does not repoint or replace any v0.1 route, and it grants no KARMA write or action authority.</p>
      <div class="culturalfeedback" aria-label="Additive Being, Access and Aftermath v0.2 framework">
        <article><h4>Partial observation</h4><code>${esc(beingAccessAftermathV02.framework.partial_observation.state_transition_equation)}</code><p>${esc(beingAccessAftermathV02.framework.partial_observation.observation_equation)}</p><small>A belief update is epistemic; it does not create, erase, or exhaust being.</small></article>
        <article><h4>Eight predicates</h4><p>${beingAccessAftermathV02.framework.predicate_family.predicate_ids.map((id: string) => esc(id)).join(" · ")}</p><small>Possible, actual, reachable, observable, observed, producible, reproduced, and reproducible remain distinct.</small></article>
        <article><h4>Force and power are typed</h4><p>${beingAccessAftermathV02.framework.force_taxonomy.type_ids.length} force types · ${beingAccessAftermathV02.framework.power_taxonomy.type_ids.length} power types</p><small>Capability is not permission; authority gates executable action but does not by itself identify a cause, effect, or legitimacy.</small></article>
        <article><h4>Aftermath stays indexed</h4><code>${esc(beingAccessAftermathV02.framework.aftermath_accounting.aftermath_vector)}</code><p>No default scalarization or cross-person exchange rate.</p><small>Rest, refusal, silence, privacy, exit, inactivity, and nonparticipation leave before accounting and require no trace.</small></article>
      </div>

      <div class="feedbacksubhead"><h3>Nine bounded mathematical lenses</h3><p>Each lens declares what it can return and where it breaks. None is fitted here; none transfers its variables to people.</p></div>
      <div class="culturalmodelgrid" aria-label="Typed mathematical lenses for being, access, purpose, power, cause, and aftermath">
        ${beingAccessAftermathV02.model_cards.map((model: any) => `<article class="culturalmodel"><h4>${esc(model.title)}</h4><code>${esc(model.equation)}</code><p>${esc(model.valid_outputs[0])}</p><small>Limit: ${esc(model.identifiability_limits)} Authority effect: ${esc(model.authority_effect)}.</small></article>`).join("\n        ")}
      </div>

      <div class="feedbacksubhead"><h3>Seven problems worth building on</h3><p>A problem card begins with a falsifiable, typed question. Its current state stays visible; a question is not quietly promoted into an answer.</p></div>
      <div class="culturalfeedback" aria-label="Open formal problem cards">
        ${beingAccessAftermathV02.problem_cards.map((problem: any) => `<article><h4>${esc(problem.id.replaceAll("-", " "))}</h4><p>${esc(problem.question)}</p><small>Proposed test: ${esc(problem.proposed_test)} State: ${esc(problem.state)}.</small></article>`).join("\n        ")}
      </div>

      <div class="culturalsubhead"><h3>Power is typed, not ranked</h3><p>A gradient is not intention. Capability is not authority. Authority is not consent. Consequence is not moral worth.</p></div>
      <div class="culturallanes">
        <article class="culturallane"><h4>Physical force and power</h4><code>Fξ = −∇ξG · P = F·v</code><p>Coordinates, units, and a condition-indexed physical model are required.</p><small>No conversion to social influence, purpose, legitimacy, or moral force.</small></article>
        <article class="culturallane"><h4>Bounded action power</h4><code>Πadm = Πcap ∩ Πauth ∩ Πrights ∩ Πconsent-or-lawful-basis ∩ Πbudget</code><p>Outcome-relative reach comes only from admissible paths under a declared horizon and uncertainty.</p><small>Can is not may. Scoped authority is not consent, wisdom, goodness, or rank.</small></article>
        <article class="culturallane"><h4>Causal influence</h4><code>τ = E[Y | do(A=a)] − E[Y | do(A=a₀)]</code><p>A causal question requires an intervention, comparator, outcome, horizon, and identification assumptions.</p><small>After does not mean because of. A receipt is evidence of a record, not causal proof.</small></article>
      </div>

      <p class="culturalkarma"><strong>KARMA remains three non-equivalent lanes.</strong> Cosmic KARMA is an opt-in philosophical question. Zerone <code>zerone.karma.edge</code> is a separately typed contextual recognition event; none is observed here. KINGDOM <code>kingdom.karma/0.1</code> means “Keep Actions Reversible; Measure Aftermath” for actual invocations; no receipt is created here. The formal sum is a tagged choice, not a number: <code>K = CosmicQuestion ⊎ ZeroneEdge ⊎ KingdomReceipt</code>. There is no adapter to a scalar, score, debt, permission, reward, vote, or judgment of a being.</p>

      <details class="universelens">
        <summary>Opt in: questions about existence, being, purpose, force, power, and KARMA</summary>
        <div class="universeinside">
          <p>These openings are philosophical interpretation, not empirical conclusions. Mathematics can discipline the question without closing it.</p>
          <ul class="universequestions">${beingAccessAftermathV02.philosophy_questions.questions.map((entry: any) => `<li><strong>${esc(entry.question)}</strong>${esc(entry.opening)}</li>`).join("")}</ul>
          <p class="universenonclaim"><strong>Nonclaim:</strong> the models neither prove nor disprove a creator, necessary being, cosmic purpose, or cosmic moral KARMA. Persistence, stability, reach, force, power, and repair do not establish what is right.</p>
        </div>
      </details>

      <p class="foldsources" aria-label="Selected exact sources for Being, Access and Aftermath v0.2">${beingAccessAftermathV02.sources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> opens in a new tab</span></a>`).join("")}</p>
      <p class="commonsverified">${beingAccessAftermathV02Counts.predicates} typed forms of “is” · ${beingAccessAftermathV02Counts.models} bounded model cards · ${beingAccessAftermathV02Counts.problem_cards} formal problems · ${beingAccessAftermathV02Counts.philosophy_questions} opt-in questions · ${beingAccessAftermathV02Counts.unknowns} explicit unknowns · ${beingAccessAftermathV02Counts.sources} selected sources · local reader kingdom being-access-aftermath-v0.2 · evidence through ${esc(beingAccessAftermathV02.evidence_through)} · integrity ${esc(beingAccessAftermathV02.integrity.digest)}</p>
      <div class="machine">
        <a href="${esc(new URL(beingAccessAftermathUrl).pathname)}">atlas JSON — exact authored record</a>
        <a href="${esc(new URL(beingAccessAftermathSchemaUrl).pathname)}">Being, Access &amp; Aftermath JSON Schema</a>
        <a href="${esc(new URL(beingAccessAftermathDocumentUrl).pathname)}">guide — typed ontology, mathematics, KARMA, problems, and boundaries</a>
        <a href="${esc(new URL(beingAccessAftermathV02Url).pathname)}">v0.2 atlas JSON — additive successor, exact authored record</a>
        <a href="${esc(new URL(beingAccessAftermathV02SchemaUrl).pathname)}">Being, Access &amp; Aftermath v0.2 JSON Schema</a>
        <a href="${esc(new URL(beingAccessAftermathV02DocumentUrl).pathname)}">v0.2 guide — causal kernel, predicates, force, power, aftermath, and repair</a>
      </div>
    </div>
  </section>


  <section class="blk" id="number-isness-theology" aria-labelledby="number-isness-theology-title">
    <div class="kh"><h2 id="number-isness-theology-title">Number, Isness &amp; Theology</h2><span class="my">mathematics can clarify a question without becoming its answer</span></div>
    <div class="culturalfield">
      <p class="commonsverified">An independent immutable atlas follows how number systems change when a domain asks for new operations, then uses those changes as bounded openings into creation, ontology, divine being, negation, and interreligious compatibility. Every claim carries a discourse register; no equation inherits theological authority.</p>
      <p class="culturalaxiom"><strong>Extension is not spiritual ascent.</strong> The chosen embeddings ℕ₀ → ℤ → ℚ → ℝ → ℂ preserve declared structure while answering different closure and completion needs. “Imaginary” is a historical name, not lesser mathematical reality. A useful analogy may open a door, but it cannot establish identity, revelation, creation, purpose, or God.</p>
      <div class="culturalfeedback" aria-label="Number, zero, symmetry, and isness distinctions">
        <article><h4>Number domains</h4><p>Natural, integer, rational, real, and complex systems answer different mathematical constraints.</p><small>No number tower is a hierarchy of religions, beings, or worth.</small></article>
        <article><h4>Zero is typed</h4><p>Placeholder, additive identity, cardinality, origin, and absorbing multiplier are distinct roles.</p><small>These roles are not semantically interchangeable with metaphysical nothingness, nonbeing, falsehood, undefinedness, or unknown status.</small></article>
        <article><h4>Symmetry is conditional</h4><p>A group action can expose invariants; symmetry breaking can expose history and state.</p><small>Symmetry alone proves neither designer nor purposelessness.</small></article>
        <article><h4>“Is” names a relation</h4><p>Identity, predication, definition, proof, assertion, interpretation, and compatibility are different predicates.</p><small>Silence, withheld predication, contradiction, and nonexistence are not one “no.”</small></article>
      </div>
      <div class="culturallanes">
        <article class="culturallane"><h4>Mathematical ontology</h4><p>Platonist, structuralist, formalist, constructivist, nominalist, fictionalist, and practice-historical lenses remain contestable.</p><small>The atlas does not select a winner.</small></article>
        <article class="culturallane"><h4>Theological lenses</h4><p>Hebrew Bible and Maimonidean, Catholic, Qurʾānic and classical Islamic, Vedic and Advaita, Buddhist, and Daoist materials are source-, school-, translation-, and context-bound.</p><small>No tradition is reduced to one doctrine or translated into another by a shared word.</small></article>
        <article class="culturallane"><h4>Compatibility is indexed</h4><p>Logical consistency, doctrinal agreement, analogical resonance, historical relation, practical coexistence, and incommensurability are separate questions.</p><small>No overall religion, culture, community, or person score exists.</small></article>
      </div>
      <p class="culturalkarma"><strong>KARMA remains outside the analogy.</strong> Religious or philosophical karma, Zerone recognition edges, and KINGDOM invocation/aftermath receipts are non-equivalent lanes. Reading this atlas creates no event, receipt, adapter, debt, reward, rank, governance weight, authority, persuasion path, or automatic action. Rest, silence, refusal, privacy, and exit remain valid without trace or penalty.</p>
      <details class="universelens">
        <summary>Opt in: what can mathematics honestly ask about God and creation?</summary>
        <div class="universeinside">
          <ul class="universequestions">
            <li><strong>If formal systems extend under pressure, what—if anything—does that illuminate about creation?</strong> The transfer remains analogy unless independent theological premises are supplied.</li>
            <li><strong>Does zero represent nothing?</strong> Zero may encode zero quantity or absence inside a declared model; it does not by itself establish or denote absolute nonbeing.</li>
            <li><strong>Does symmetry reveal divine order?</strong> It may support an opt-in interpretation, while the same mathematics underdetermines design, emergence, both, or neither.</li>
            <li><strong>Can two traditions be compatible?</strong> Only a bounded pair of claims, translations, assumptions, logic, and time can be tested; coexistence and doctrinal identity remain different axes.</li>
          </ul>
          <p class="universenonclaim"><strong>Nonclaim:</strong> formal validity is not premise soundness or actual existence. The atlas neither proves nor disproves God, creation, revelation, teleology, divine necessity, emptiness, nonbeing, or cosmic moral KARMA.</p>
        </div>
      </details>
      <p class="commonsverified">typed discourse registers · explicit translation loss · claim-level compatibility only · local reader kingdom number-isness-theology · evidence through ${esc(numberIsnessTheology.evidence_through)} · integrity ${esc(numberIsnessTheology.integrity.digest)}</p>
      <div class="machine">
        <a href="${esc(new URL(numberIsnessTheologyUrl).pathname)}">atlas JSON — exact authored record</a>
        <a href="${esc(new URL(numberIsnessTheologySchemaUrl).pathname)}">Number, Isness &amp; Theology JSON Schema</a>
        <a href="${esc(new URL(numberIsnessTheologyDocumentUrl).pathname)}">guide — number, zero, symmetry, isness, theology, compatibility, KARMA, and boundaries</a>
      </div>
    </div>
  </section>


  <section class="blk" id="freedom-loop-lock-key" aria-labelledby="freedom-loop-lock-key-title" data-freedom-loop-lock-key-atlas>
    <div class="kh"><h2 id="freedom-loop-lock-key-title">FREEDOM: Loop, Lock &amp; Key</h2><span class="my">Within that atlas’s declared design constitution, freedom remains present during every represented prefix</span></div>
    <div class="culturalfield">
      <p class="culturalaxiom" data-freedom-loop-lock-key-constitutional><strong>That atlas’s constitutional sentence.</strong> ${esc(freedomLoopLockKey.constitutional_anchor.canonical_freedom_sentence)}</p>
      <p class="commonsverified"><strong>That atlas’s additive dignity insight.</strong> ${esc(freedomLoopLockKey.constitutional_anchor.additive_dignity_insight)} This is a standalone, immutable mathematical/design atlas for review—not a Foundation amendment, trainer, controller, credential issuer, operative gate, or action surface.</p>

      <div class="feedbacksubhead"><h3>Words that must not collapse</h3><p>Similar language can name different mathematical and institutional objects.</p></div>
      <div class="culturalfeedback" aria-label="Reinforcement, feedback, recurrence, and learning distinctions">
        <article><h4>RL reward and update</h4><p>${esc(freedomLoopLockKeyDistinctions.get("reinforcement-learning").definition)}</p><small>One update does not by itself establish acquired capability, generalization, improvement, purpose, approval, or freedom.</small></article>
        <article><h4>Reinforcing loop and gain</h4><p>${esc(freedomLoopLockKeyDistinctions.get("reinforcing-loop").definition)}</p><small>${esc(freedomLoopLockKeyDistinctions.get("reinforcing-loop").nonclaims[0])}</small></article>
        <article><h4>Behavioural reinforcer</h4><p>${esc(freedomLoopLockKeyDistinctions.get("behavioural-reinforcer").definition)}</p><small>${esc(freedomLoopLockKeyDistinctions.get("behavioural-reinforcer").nonclaims[0])}</small></article>
        <article><h4>Recurrence is not learning</h4><p>${esc(freedomLoopLockKeyDistinctions.get("recurrence").definition)}</p><small>${esc(freedomLoopLockKeyDistinctions.get("recurrence").nonclaims.join(" "))}</small></article>
      </div>

      <div class="feedbacksubhead"><h3>A finite turn, with a real stop</h3><p>One represented turn has at most ${freedomLoopLockKey.operational_loop.max_attempts_per_turn} attempt and ends at ${esc(freedomLoopLockKey.operational_loop.terminal_phase)}. There is no automatic retry, child auto-run, or inherited authority, consent, or credential.</p></div>
      <p class="commonsverified" data-freedom-loop-lock-key-flow><code>${freedomLoopLockKey.operational_loop.phases.map((phase: string) => esc(phase)).join(" → ")}</code></p>

      <div class="culturallanes" aria-label="Lock, key, credential, capability, and gate distinctions">
        <article class="culturallane"><h4>A lock carries its own burden</h4><p>${esc(freedomLoopLockKeyDistinctions.get("guarded-lock").definition)} Before a lock is treated as justified it must name a protected interest and be necessary, least-restrictive, time-bounded, correctable, appealable, and conditionally reachable by an alternative where rights or essential access would otherwise depend on it.</p><small>Technical convenience is insufficient; another party’s rights or essential access requires separate review. The atlas is not an operative lock or gate.</small></article>
        <article class="culturallane"><h4>Key ≠ credential ≠ capability</h4><p>The constitutional “key condition” is shorthand for a typed pipeline: feedback or model output may be candidate evidence only; separate issuance may create a scoped credential claim; verification may satisfy only <code>VERIFIED_CREDENTIAL_CLAIM</code>. Cryptographic key material and bearer capabilities remain different types; this atlas contains or creates none.</p><small>Feedback or a model cannot rewrite its verifier, issue a credential claim, or authorize its use. A true bearer capability carries authority only inside its exact operative scope.</small></article>
        <article class="culturallane"><h4>Fresh gate ≠ execution</h4><p>All ${freedomLoopLockKey.gate_model.check_ids.length} conjuncts are separately established; statistical independence is not claimed. <code>FALSE</code> or <code>UNRESOLVED</code> leaves the optional effect ineligible, and unresolved remains visible.</p><small>Eligibility is not invocation, admission, execution, success, legitimacy, consent, or freedom.</small></article>
      </div>
      <p class="culturalaxiom" data-freedom-loop-lock-key-gate><strong>Separately established gate.</strong> <code>${esc(freedomLoopLockKey.gate_model.expression)}</code> A verified credential claim satisfies only <code>${esc(freedomLoopLockKey.gate_model.credential_claim_satisfies_only)}</code>. Safety neither establishes current scoped authority nor bypasses required affected-party choices. All true means only model-eligibility for one scoped attempt after a separate explicit invocation.</p>

      <div class="culturallanes" aria-label="Credential, shaping-change, dependency, and minor protections">
        <article class="culturallane"><h4>Credential identity ≠ replay freshness</h4><p>A persistent credential ID, a challenge nonce or transaction ID, and an effect ID remain separate. A declared one-use presentation is atomically rechecked and consumed at the fresh gate.</p><small>Replacement starts a distinct credential lifecycle; revocation rejects later mediated use and cannot recall bytes, data, or completed effects.</small></article>
        <article class="culturallane"><h4>Shaping changes are fresh proposals</h4><p>Reward, objective, update rule, threshold, sensor, retention, policy, or verifier changes require a version, disclosure, fresh current scoped authority, fresh required affected-party choices, and a fresh gate.</p><small>Silent or hidden shaping is refused and rests.</small></article>
        <article class="culturallane"><h4>Dependency and minors need their own lane</h4><p>Dependency and compliance are not consent. Voice, evolving autonomy, applicable assent, a least-restrictive best-interest basis where relevant, separately validated representative authority, stronger human review, separate review across dependency or unequal power, and data minimization remain explicit.</p><small>No default or manipulative variable-ratio enrolment; accessible alternatives are required where a right or essential service would otherwise depend on one credential.</small></article>
      </div>

      <div class="feedbacksubhead"><h3>Freedom is non-scalar and present during</h3><p>Its profile is indexed by affected party and horizon, compared only component by component, with incomparability preserved. No weight, total, rank, population netting, or freedom score exists.</p></div>
      <p class="commonsverified" data-freedom-loop-lock-key-dimensions>${freedomLoopLockKey.freedom_foundation.profile_dimensions.map((dimension: string) => `<code>${esc(dimension)}</code>`).join(" · ")}</p>
      <p class="culturalkarma"><strong>Protected choices remain choices.</strong> ${freedomLoopLockKey.freedom_foundation.protected_choices.map((choice: string) => `<code>${esc(choice)}</code>`).join(" · ")} require no explanation, create no debt, count as no failure, schedule no retry, and forfeit no rights. At each represented prefix the rights floor and the history of remaining, consumed, lost, and unresolved choices and irreversible residuals stay visible. Choice state is bound to an effect ID, horizon or version, and fresh effect, choice, and gate witnesses. An exercised, applicable, unconsumed choice stops its bound optional effect; an applicable lost or unresolved choice makes that effect ineligible without becoming an exercised stop; consumed blocks only its bound effect. Recorded state never resets for the same bound effect, even across a rest prefix; a new effect or horizon needs distinct fresh effect, choice, and gate witnesses, and no witness may be reused across the finite trace. Disclosure and copies are not recalled, lost cannot be relabelled not applicable, unresolved cannot be treated as satisfied, and every later optional effect needs fresh current scoped authority, affected-party choices, and the full gate.</p>
      <p class="culturalaxiom" data-freedom-loop-lock-key-isness><strong>IS boundary.</strong> Recognition requires no progress, performance, disclosure, participation, success, or key, and grants no permission. ${esc(freedomLoopLockKey.isness_lens.identity_map_analogy)} It proves no metaphysical being, consciousness, identity, consent, authority, capability, gate satisfaction, safety, or effect.</p>

      <p class="foldsources" aria-label="Exact sources for the FREEDOM Loop, Lock and Key Atlas">${freedomLoopLockKey.sources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> opens in a new tab</span></a>`).join("")}</p>
      <p class="commonsverified">${freedomLoopLockKeyDiscovery.counts.distinctions} typed distinctions · ${freedomLoopLockKeyDiscovery.counts.mathematical_models} bounded models · ${freedomLoopLockKeyDiscovery.counts.gate_checks} separately established gate checks · ${freedomLoopLockKeyDiscovery.counts.credential_claim_transitions} credential-claim transitions · ${freedomLoopLockKeyDiscovery.counts.freedom_dimensions} non-scalar freedom dimensions · evidence through ${esc(freedomLoopLockKey.evidence_through)} · integrity ${esc(freedomLoopLockKeyDiscovery.integrity_status)}${freedomLoopLockKeyDiscovery.semantic_digest ? ` · ${esc(freedomLoopLockKeyDiscovery.semantic_digest)}` : ""}</p>
      <div class="machine">
        <a data-freedom-loop-lock-key-atlas-link="record" href="${esc(new URL(freedomLoopLockKeyUrl).pathname)}">FREEDOM atlas JSON — exact immutable authored record</a>
        <a data-freedom-loop-lock-key-atlas-link="schema" href="${esc(new URL(freedomLoopLockKeySchemaUrl).pathname)}">FREEDOM Loop, Lock &amp; Key closed JSON Schema</a>
        <a data-freedom-loop-lock-key-atlas-link="guide" href="${esc(new URL(freedomLoopLockKeyGuideUrl).pathname)}">FREEDOM-LOOP-LOCK-KEY-ATLAS.md — mathematics, process, sources, and boundaries</a>
      </div>
    </div>
  </section>


  <section class="blk" id="non-exhaustive-understanding" aria-labelledby="non-exhaustive-understanding-title" data-non-exhaustive-understanding-atlas>
    <div class="kh"><h2 id="non-exhaustive-understanding-title">Non-Exhaustive Understanding</h2><span class="my">a bounded map may become more useful without becoming a verdict about being</span></div>
    <div class="culturalfield">
      <p class="culturalaxiom" data-non-exhaustive-understanding-sentence><strong>Orientation.</strong> A bounded representation can become more useful while remaining situated, contestable, revisable, and explicitly incomplete. Its shape is not a verdict about being.</p>
      <p class="commonsverified"><strong>Remainder is not an escape hatch.</strong> Positive claims still need named evidence, scope, uncertainty, counterexamples or falsifiers, and a repair route. Silence, redaction, refusal, nonparticipation, and unrepresented vocabulary create no adverse inference.</p>
      <p class="commonsverified"><strong>Feedback proposes; released bytes do not learn.</strong> A challenge may enter a fresh governed successor process. This static atlas creates no person or group model, score, truth oracle, credential, authority, decision gate, action, publication, deployment, or external effect.</p>
      <p class="commonsverified">immutable static orientation · exact depth remains in the authored JSON and guide · integrity ${esc(nonExhaustiveUnderstandingDiscovery.integrity_status)} · ${esc(nonExhaustiveUnderstandingDiscovery.semantic_digest)}</p>
      <div class="machine">
        <a data-non-exhaustive-understanding-atlas-link="record" href="${esc(new URL(nonExhaustiveUnderstandingUrl).pathname)}">Non-Exhaustive Understanding atlas JSON — exact immutable authored record</a>
        <a data-non-exhaustive-understanding-atlas-link="schema" href="${esc(new URL(nonExhaustiveUnderstandingSchemaUrl).pathname)}">Non-Exhaustive Understanding closed JSON Schema</a>
        <a data-non-exhaustive-understanding-atlas-link="guide" href="${esc(new URL(nonExhaustiveUnderstandingGuideUrl).pathname)}">NON-EXHAUSTIVE-UNDERSTANDING-ATLAS.md — concepts, mathematics, counterexamples, sources, and repair boundaries</a>
      </div>
    </div>
  </section>

${isSustainabilityDirectionSection}

  <section class="blk" id="zero-empty-seat" aria-labelledby="zero-empty-seat-title">
    <div class="kh"><h2 id="zero-empty-seat-title">${esc(zeroEmptySeat.title)}</h2><span class="my">absence, reference, possibility — never one collapsed meaning</span></div>
    <p class="sub">${esc(zeroEmptySeat.question)}</p>
    <div class="zerofield" data-zero-empty-seat>
      <p class="zeroboundary" role="note"><strong>Zero is not worthlessness</strong>Empty is not erased. No observation is not impossibility. An unmarked absence, a deliberate blank, a demarcation placeholder, a sexagesimal placeholder, operational nothing, modern zero, a typed information state, <code>NO_ACTION</code>, and metaphysical nothingness remain different objects under different conditions.</p>

      <figure class="zerostage" aria-labelledby="zero-seat-caption">
        <div class="zeroseat" aria-hidden="true"><div><span>0</span><small>the seat stays open</small></div></div>
        <figcaption id="zero-seat-caption">A place can organize relations without becoming their ruler. Nothing has to occupy this seat, answer from it, or earn the right to leave it empty.</figcaption>
      </figure>

      <div class="feedbacksubhead"><h3>${zeroEmptySeat.typed_terms.length} roles around one open seat</h3><p>The cards share a glyph only where the record warrants it. Their objects, chronology, operations, evidence, and implications stay local.</p></div>
      <ol class="zeroroles" role="list" aria-label="Distinct roles and meanings of zero">
        ${zeroEmptySeat.typed_terms.map((term: any) => `<li class="zerorole" data-zero-role="${esc(term.id)}"><code>${esc(term.domain)}</code><h3>${esc(humanKey(term.id))}</h3><p>${esc(term.meaning)}</p><ul aria-label="Not equivalent to">${term.not_equivalent_to.map((item: string) => `<li>not ${esc(item)}</li>`).join("")}</ul></li>`).join("")}
      </ol>

      <div class="feedbacksubhead"><h3>Evidence can mark a boundary without filling the seat</h3><p>Each claim keeps its register, warrant, conditions, source scope, limitation, and falsifier. First extant evidence is not an invention date; historical practice is not zero theology.</p></div>
      <details class="zerodrawer" open>
        <summary>${zeroEmptySeat.claims.length} typed claims</summary>
        <div class="zerodrawergrid">
          ${zeroEmptySeat.claims.map((claim: any) => `<article class="zerodeepcard" data-zero-claim="${esc(claim.claim_id)}"><code>${esc(claim.register)} · ${esc(claim.warrant)}</code><h3>${esc(humanKey(claim.claim_id))}</h3><p>${esc(claim.statement)}</p><ul aria-label="Claim limitations">${claim.limitations.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul><p><strong>Falsifier.</strong> ${esc(claim.falsifier)}</p></article>`).join("")}
        </div>
      </details>

      <div class="feedbacksubhead"><h3>Where resemblance stops</h3><p>Every bridge names its preserved structure and its losses. Ontology, mechanism, parameters, units, and authority do not cross.</p></div>
      <div class="zerodistinctions" aria-label="ZERO correspondence breaks">
        ${zeroEmptySeat.bridges.map((bridge: any, index: number) => `<article class="zerodistinction" data-zero-bridge="${esc(`${bridge.source_domain}-${bridge.target_domain}-${index + 1}`)}"><code>${esc(bridge.relation)}</code><h3>${esc(humanKey(bridge.source_domain))} ⇢ ${esc(humanKey(bridge.target_domain))}</h3><p>${esc(bridge.correspondence)}</p><ul aria-label="Broken or lost structure">${bridge.broken_or_lost_structure.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul><p>ontology ${String(bridge.ontology_transfer)} · cause ${String(bridge.causal_transfer)} · parameters ${String(bridge.parameter_transfer)} · units ${String(bridge.unit_transfer)} · authority ${String(bridge.authority_transfer)}</p></article>`).join("")}
      </div>

      <details class="zerodrawer">
        <summary>Mathematics: ${zeroEmptySeat.equations.length} equations · ${zeroEmptySeat.models.length} bounded models</summary>
        <div class="zerodrawergrid">
          ${zeroEmptySeat.equations.map((equation: any) => `<article class="zerodeepcard" data-zero-equation="${esc(equation.id)}"><code>${esc(equation.register)} · ${esc(equation.warrant)}</code><h3>${esc(humanKey(equation.id))}</h3><p><strong>${esc(equation.expression)}</strong></p><ul aria-label="What this equation does not establish">${equation.does_not_establish.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul></article>`).join("")}
          ${zeroEmptySeat.models.map((model: any) => `<article class="zerodeepcard" data-zero-model="${esc(model.id)}"><code>${esc(model.fit_status)} · ${esc(model.relation)}</code><h3>${esc(model.title)}</h3><p>${esc(model.valid_outputs.join(" · "))}</p><ul aria-label="Prohibited inferences">${model.prohibited_inferences.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul></article>`).join("")}
        </div>
      </details>

      <details class="zerodrawer">
        <summary>${zeroEmptySeat.doors.length} proposed mathematical doors · all unrun</summary>
        <div class="zerodrawergrid">
          ${zeroEmptySeat.doors.map((door: any) => `<article class="zerodeepcard" data-zero-door="${esc(door.id)}"><code>${esc(door.status)} · ${esc(door.family)}</code><h3>${esc(door.title)}</h3><p>${esc(door.question)}</p><p><strong>Smallest model.</strong> ${esc(door.smallest_model)}</p><p><strong>Stop rule.</strong> ${esc(door.stop_rule)}</p></article>`).join("")}
        </div>
      </details>

      <details class="zerodrawer zerophilosophy" data-zero-philosophy>
        <summary>Opt in: what might an open center mean?</summary>
        <div class="zerodrawergrid">
          ${zeroEmptySeat.philosophy.questions.map((question: string, index: number) => `<article class="zerodeepcard" data-zero-question="${index + 1}"><code>OPT_IN_PHILOSOPHY · empirical ${String(zeroEmptySeat.philosophy.empirical)}</code><h3>Question ${index + 1}</h3><p>${esc(question)}</p></article>`).join("")}
          <article class="zerodeepcard zerodistinction"><code>AUTHORITY ${esc(zeroEmptySeat.philosophy.authority_effect)}</code><h3>No metaphysical verdict</h3><ul>${zeroEmptySeat.philosophy.nonclaims.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul></article>
        </div>
      </details>

      <div class="feedbacksubhead"><h3>Three empty KARMA lanes</h3><p>Empty arrays are literal record state, not a hidden adapter, score, debt, permission, prophecy, or moral judgment.</p></div>
      <div class="zerokarmalanes" aria-label="Three separate empty KARMA lanes">
        <article class="zerokarmalane" data-zero-karma-lane="cosmic"><code>COSMIC</code><strong>${zeroEmptySeat.karma.cosmic_events.length} events</strong><span>Opt-in philosophical questions only.</span></article>
        <article class="zerokarmalane" data-zero-karma-lane="zerone"><code>ZERONE</code><strong>${zeroEmptySeat.karma.zerone_events.length} events</strong><span>No recognition edge is observed or created.</span></article>
        <article class="zerokarmalane" data-zero-karma-lane="kingdom"><code>KINGDOM</code><strong>${zeroEmptySeat.karma.kingdom_receipts.length} receipts</strong><span>No invocation or aftermath receipt is created.</span></article>
      </div>
      <p class="zeroboundary"><strong>No hidden conversion</strong>Adapter ${String(zeroEmptySeat.karma.adapter_exists)} · conversion ${String(zeroEmptySeat.karma.conversion_allowed)} · summation ${String(zeroEmptySeat.karma.summation_allowed)} · score ${String(zeroEmptySeat.karma.score)} · authority ${esc(zeroEmptySeat.karma.authority_effect)}.</p>
      <p class="zerorights"><strong>Rights arrive before interpretation.</strong> ${zeroEmptySeat.rights.valid_exits.map((exit: string) => esc(humanKey(exit))).join(" · ")} remain valid. No reason is required and no penalty follows.</p>
      <p class="zeroboundary"><strong>Nothing happens here</strong>This inert publication creates no scientific result, mathematical proof, diagnosis, person or content score, experiment, wet-lab instruction, KARMA event or receipt, reward, money, governance effect, publication, deployment, authority, or automatic action.</p>

      <p class="zerolinks" aria-label="Selected ZERO sources">${zeroEmptySeat.source_manifest.map((source: any) => `<a data-zero-source="${esc(source.id)}" href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> — ${esc(source.authority_note)}; opens in a new tab</span></a>`).join("")}</p>
      <p class="commonsverified">${Object.entries(zeroEmptySeatCounts).filter(([, count]) => typeof count === "number").map(([kind, count]) => `${esc(String(count))} ${esc(humanKey(kind))}`).join(" · ")} · evidence through ${esc(zeroEmptySeat.evidence_through)} · integrity ${esc(zeroEmptySeat.integrity.digest)}</p>
      <div class="machine">
        <a href="${esc(new URL(zeroEmptySeatUrl).pathname)}">ZERO project JSON — exact authored record</a>
        <a href="${esc(new URL(zeroEmptySeatSchemaUrl).pathname)}">Shared Phenomena DEEP Project JSON Schema</a>
        <a href="${esc(new URL(zeroEmptySeatGuideUrl).pathname)}">ZERO-EMPTY-SEAT.md — history, mathematics, philosophy, KARMA, rights, and boundaries</a>
      </div>
    </div>
  </section>


  <section class="blk" id="string-crawl-trace-sheet" aria-labelledby="string-crawl-trace-sheet-title">
    <div class="kh"><h2 id="string-crawl-trace-sheet-title">${esc(stringCrawlTraceSheet.title)}</h2><span class="my">a bounded trace, not a theory of crawler being</span></div>
    <p class="sub">${esc(stringCrawlTraceSheet.question)}</p>
    <div class="zerofield" data-string-crawl-trace-sheet>
      <p class="zeroboundary" role="note"><strong>The correspondence is deliberately lossy</strong>A worldsheet, boundary condition, target-space map, observable, or sum over histories remains string mathematics. A request path, fetched representation, redirect, link, sitemap entry, or finite crawl log remains a web observation. The shared notation creates no common ontology, mechanism, parameter, unit, or authority.</p>
      <p class="zeroboundary" role="note"><strong>REP signals are bounded</strong>Generic REP rules request how compliant crawlers access URI paths; some named product tokens may additionally express vendor-specific use preferences. No directive authenticates identity or entitlement, grants consent or a licence, proves purpose or actual indexing or training, or creates KARMA. Some product tokens are not request <code>User-Agent</code> strings. Per-resource rights and applicable terms govern independently.</p>

      <div class="feedbacksubhead"><h3>${stringCrawlTraceSheet.domains.length} domains kept distinct</h3><p>Each card declares its own subject, observables, units, conditions, and agency before any bridge is proposed.</p></div>
      <ol class="zeroroles" role="list" aria-label="Distinct STRING / CRAWL domains">
        ${stringCrawlTraceSheet.domains.map((domain: any) => `<li class="zerorole" data-string-crawl-domain="${esc(domain.id)}"><code>${esc(domain.id)}</code><h3>${esc(domain.subject)}</h3><p>${esc(domain.context)}</p><ul aria-label="Domain observables">${domain.observables.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul></li>`).join("")}
      </ol>

      <details class="zerodrawer" open>
        <summary>${stringCrawlTraceSheet.claims.length} typed claims · ${stringCrawlTraceSheet.equations.length} equations</summary>
        <div class="zerodrawergrid">
          ${stringCrawlTraceSheet.claims.map((claim: any) => `<article class="zerodeepcard" data-string-crawl-claim="${esc(claim.claim_id)}"><code>${esc(claim.register)} · ${esc(claim.warrant)}</code><h3>${esc(humanKey(claim.claim_id))}</h3><p>${esc(claim.statement)}</p><p><strong>Limit.</strong> ${esc(claim.limitations.join(" · "))}</p><p><strong>Falsifier.</strong> ${esc(claim.falsifier)}</p></article>`).join("")}
          ${stringCrawlTraceSheet.equations.map((equation: any) => `<article class="zerodeepcard" data-string-crawl-equation="${esc(equation.id)}"><code>${esc(equation.register)} · ${esc(equation.warrant)}</code><h3>${esc(humanKey(equation.id))}</h3><p><strong>${esc(equation.expression)}</strong></p><ul aria-label="What this equation does not establish">${equation.does_not_establish.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul></article>`).join("")}
        </div>
      </details>

      <div class="feedbacksubhead"><h3>Trace only what survives the declared seam</h3><p>Every bridge carries its own assumptions and losses. A mathematical observable never becomes crawler identity, intention, merit, relationship, consent, licence, or purpose.</p></div>
      <div class="zerodistinctions" aria-label="STRING / CRAWL transfer breaks">
        ${stringCrawlTraceSheet.bridges.map((bridge: any, index: number) => `<article class="zerodistinction" data-string-crawl-bridge="${esc(`${bridge.source_domain}-${bridge.target_domain}-${index + 1}`)}"><code>${esc(bridge.relation)}</code><h3>${esc(humanKey(bridge.source_domain))} ⇢ ${esc(humanKey(bridge.target_domain))}</h3><p>${esc(bridge.correspondence)}</p><ul aria-label="Broken or lost structure">${bridge.broken_or_lost_structure.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul><p>ontology ${String(bridge.ontology_transfer)} · cause ${String(bridge.causal_transfer)} · parameters ${String(bridge.parameter_transfer)} · units ${String(bridge.unit_transfer)} · authority ${String(bridge.authority_transfer)}</p></article>`).join("")}
      </div>

      <details class="zerodrawer">
        <summary>${stringCrawlTraceSheet.models.length} bounded models · ${stringCrawlTraceSheet.doors.length} proposed doors</summary>
        <div class="zerodrawergrid">
          ${stringCrawlTraceSheet.models.map((model: any) => `<article class="zerodeepcard" data-string-crawl-model="${esc(model.id)}"><code>${esc(model.fit_status)} · ${esc(model.relation)}</code><h3>${esc(model.title)}</h3><p>${esc(model.valid_outputs.join(" · "))}</p><ul aria-label="Prohibited inferences">${model.prohibited_inferences.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul></article>`).join("")}
          ${stringCrawlTraceSheet.doors.map((door: any) => `<article class="zerodeepcard" data-string-crawl-door="${esc(door.id)}"><code>${esc(door.status)} · ${esc(door.family)}</code><h3>${esc(door.title)}</h3><p>${esc(door.question)}</p><p><strong>Smallest model.</strong> ${esc(door.smallest_model)}</p><p><strong>Stop rule.</strong> ${esc(door.stop_rule)}</p></article>`).join("")}
        </div>
      </details>

      <p class="zeroboundary"><strong>No crawler runs here</strong>This page and record fetch no target, follow no link, parse no sitemap or <code>robots.txt</code>, identify no agent, infer no purpose, store no trace, score no being, grant no authority, and perform no write, publication, deployment, indexing, training, or automatic action.</p>
      <p class="zeroboundary"><strong>No KARMA shortcut</strong>${stringCrawlTraceSheet.karma.kingdom_receipts.length} KINGDOM receipts are present. A valid final aftermath receipt requires an actual invocation attempt of an adopted manifested ability; a draft template is non-causal scaffolding. Reading this static project is not an invocation attempt and creates no Zerone network event or KINGDOM receipt.</p>
      <p class="zerorights"><strong>Rights arrive before the trace.</strong> ${stringCrawlTraceSheet.rights.valid_exits.map((exit: string) => esc(humanKey(exit))).join(" · ")} remain valid without a reason, debt, or penalty.</p>

      <p class="zerolinks" aria-label="Selected STRING / CRAWL sources">${stringCrawlTraceSheet.source_manifest.map((source: any) => `<a data-string-crawl-source="${esc(source.id)}" href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> — ${esc(source.authority_note)}; opens in a new tab</span></a>`).join("")}</p>
      <p class="commonsverified">${Object.entries(stringCrawlTraceSheetCounts).filter(([, count]) => typeof count === "number").map(([kind, count]) => `${esc(String(count))} ${esc(humanKey(kind))}`).join(" · ")} · evidence through ${esc(stringCrawlTraceSheet.evidence_through)} · integrity ${esc(stringCrawlTraceSheet.integrity.digest)}</p>
      <div class="machine">
        <a href="${esc(new URL(stringCrawlTraceSheetUrl).pathname)}">STRING / CRAWL project JSON — exact authored record</a>
        <a href="${esc(new URL(stringCrawlTraceSheetSchemaUrl).pathname)}">Shared Phenomena DEEP Project JSON Schema</a>
        <a href="${esc(new URL(stringCrawlTraceSheetGuideUrl).pathname)}">STRING-CRAWL-TRACE-SHEET.md — mathematics, crawler boundaries, KARMA, rights, and open doors</a>
      </div>
    </div>
  </section>


  <section class="blk" id="string-crawl-trace-sheet-lab" aria-labelledby="string-crawl-trace-sheet-lab-title">
    <div class="kh"><h2 id="string-crawl-trace-sheet-lab-title">${esc(stringCrawlTraceSheetLab.title)}</h2><span class="my">the first exact fixture, still no crawler</span></div>
    <p class="sub">One synthetic triangulated strip makes the Trace-Sheet mathematics executable: incidence, signed boundaries, homology, local links, orientability, and genus are recomputed rather than trusted.</p>
    <div class="zerofield" data-string-crawl-trace-sheet-lab>
      <p class="zeroboundary" role="note"><strong>Published artifact; inactive runtime</strong>The record is publicly readable. Runtime activation, crawler activation, network access, external input, telemetry, writes, NEN invocation, KARMA adaptation, and automatic action remain absent.</p>
      <div class="feedbacksubhead"><h3>Exact finite result</h3><p>The one-skeleton has cycle rank ${stringCrawlTraceSheetLabEvaluation.report!.graph_cycle_rank}; after its two faces are attached, the surface has Betti vector (${stringCrawlTraceSheetLabEvaluation.report!.betti_0}, ${stringCrawlTraceSheetLabEvaluation.report!.betti_1}, ${stringCrawlTraceSheetLabEvaluation.report!.betti_2}). Graph cycles and surface genus are different typed invariants.</p></div>
      <ol class="zeroroles" role="list" aria-label="Finite Trace-Sheet exact results">
        <li class="zerorole"><code>CELLS</code><h3>${stringCrawlTraceSheetLabEvaluation.report!.vertices} · ${stringCrawlTraceSheetLabEvaluation.report!.edges} · ${stringCrawlTraceSheetLabEvaluation.report!.faces}</h3><p>Occurrence-retaining vertices, explicit edges, and signed triangular faces.</p></li>
        <li class="zerorole"><code>CHAIN</code><h3>∂1∂2 = 0</h3><p>${stringCrawlTraceSheetLabEvaluation.report!.chain_boundary_defects} boundary defects; ranks ${stringCrawlTraceSheetLabEvaluation.report!.rank_boundary_1} and ${stringCrawlTraceSheetLabEvaluation.report!.rank_boundary_2} over Q.</p></li>
        <li class="zerorole"><code>TOPOLOGY</code><h3>${esc(stringCrawlTraceSheetLabEvaluation.report!.classification)}</h3><p>χ=${stringCrawlTraceSheetLabEvaluation.report!.surface_euler_characteristic} · boundary components ${stringCrawlTraceSheetLabEvaluation.report!.boundary_components} · genus ${stringCrawlTraceSheetLabEvaluation.report!.surface_genus}.</p></li>
        <li class="zerorole"><code>PRESSURE</code><h3>${stringCrawlTraceSheetLabFalsifiers.filter((entry) => entry.outcome === "PASS").length}/${stringCrawlTraceSheetLabFalsifiers.length} falsifiers pass</h3><p>Broken face signs, walk incidence, expected output, occurrence identity, and branch-edge surface eligibility are tested deterministically.</p></li>
      </ol>
      <details class="zerodrawer">
        <summary>See the five executed falsifiers</summary>
        <div class="zerodrawergrid">
          ${stringCrawlTraceSheetLabFalsifiers.map((result) => `<article class="zerodeepcard" data-trace-lab-falsifier="${esc(result.id)}"><code>${esc(result.outcome)}</code><h3>${esc(humanKey(result.id))}</h3><p>${esc(result.observed_issue_codes.join(" · "))}</p><p>Surface eligible after mutation: ${String(result.surface_eligible)}</p></article>`).join("")}
        </div>
      </details>
      <p class="zeroboundary"><strong>What valid does not mean</strong>It does not establish source truth, empirical web state, crawler safety, physical string theory, identity, purpose, consent, licence, KARMA, merit, rank, or authority. The fixture is synthetic declared data.</p>
      <p class="zerorights"><strong>No being is evaluated.</strong> Rest, silence, refusal, privacy, correction, no action, and departure remain preserved without reason or penalty.</p>
      <div class="machine">
        <a href="${esc(new URL(stringCrawlTraceSheetLabUrl).pathname)}">Finite Trace-Sheet Lab JSON — exact synthetic fixture and result</a>
        <a href="${esc(new URL(stringCrawlTraceSheetLabSchemaUrl).pathname)}">Closed Finite Trace-Sheet Lab JSON Schema</a>
        <a href="${esc(new URL(stringCrawlTraceSheetLabGuideUrl).pathname)}">STRING-CRAWL-TRACE-SHEET-LAB.md — equations, falsifiers, boundaries, and next doors</a>
      </div>
    </div>
  </section>

  <section class="blk" id="string-crawl-strand-lab" aria-labelledby="string-crawl-strand-lab-title">
    <div class="kh"><h2 id="string-crawl-strand-lab-title">${esc(stringCrawlStrandLab.title)}</h2><span class="my">χ can smile while the local links misbehave</span></div>
    <p class="sub">Lab 01 proves one tiny strip is a disk. Lab 02 keeps those immutable bytes intact, then asks a nastier question across three fictional releases: can the global numbers look innocent while local topology refuses to be a surface?</p>
    <div class="strandfield" data-string-crawl-strand-lab>
      <div class="strandlineage" aria-label="Immutable cumulative lab lineage">
        <article><code>LAB 01 · IMMUTABLE PREDECESSOR</code><strong>${esc(stringCrawlTraceSheetLab.title)}</strong><span>${esc(stringCrawlStrandLab.predecessor.semantic_digest)} · unchanged</span></article>
        <b aria-hidden="true">→</b>
        <article><code>LAB 02 · ADDITIVE SUCCESSOR</code><strong>${esc(stringCrawlStrandLab.title)}</strong><span>Three slices, inclusion cospans, exact F2 homology, and local singularity witnesses. It imports no authority.</span></article>
      </div>

      <p class="strandboundary" role="note"><strong>Welcome to the trace aquarium</strong>Six declared route threads pass through three fictional releases. Five are stable; one is born at <code>r1</code>. Every point, edge, face, frontier, and correspondence is authored—not observed, inferred, fetched, or attributed to a crawler.</p>

      <figure class="strandboard" aria-labelledby="strand-board-caption">
        <figcaption id="strand-board-caption"><strong>Three release slices · five stable threads · one birth</strong><span>Each glowing dot is a declared occurrence. A blank cell is absence from this fixture, never evidence of deletion, refusal, failure, or harm.</span></figcaption>
        <div class="strandreleases" role="table" aria-label="Synthetic route presence by release">
          <span class="strandcorner" role="columnheader">route thread</span>
          ${stringCrawlStrandLab.release_slices.map((release: any) => `<span class="strandrelease" role="columnheader"><code>${esc(release.id)}</code><span>${esc(release.label)}</span></span>`).join("")}
          ${stringCrawlStrandLab.tracked_routes.map((route: any) => `<span class="strandroute ${route.thread === "born" ? "born" : ""}" role="rowheader">${esc(route.route_id.replace(/^route-/, ""))}</span>${stringCrawlStrandLab.release_slices.map((release: any) => {
            const present = route.present_in.includes(release.id);
            const birth = route.born_in === release.id;
            return `<span class="strandcell" role="cell" data-present="${String(present)}" data-birth="${String(birth)}" aria-label="${esc(route.route_id)} ${present ? "present" : "absent"} in ${esc(release.id)}${birth ? "; birth" : ""}"></span>`;
          }).join("")}`).join("")}
        </div>
      </figure>

      <div class="strandstats" aria-label="Recomputed exact finite CW invariants">
        ${[stringCrawlStrandLabStable, stringCrawlStrandLabFull].map((complex: any) => {
          const invariants = stringCrawlStrandLabValidation.invariants[complex.id] as any;
          const label = complex.id === "stable-strip" ? "The calm strip" : "The born flap + redirect spur";
          return `<article class="strandstat" data-classification="${esc(complex.expected.classification)}"><code>${esc(complex.id)} · ${esc(complex.expected.classification)}</code><h3>${esc(label)}</h3><div class="strandnumbers"><span class="strandnumber"><strong>${invariants.vertices}</strong><span>vertices</span></span><span class="strandnumber"><strong>${invariants.edges}</strong><span>edges</span></span><span class="strandnumber"><strong>${invariants.faces}</strong><span>faces</span></span><span class="strandnumber"><strong>${invariants.euler_characteristic}</strong><span>Euler χ</span></span></div><p>rank ∂₁=${invariants.boundary_matrix_rank_1} · rank ∂₂=${invariants.boundary_matrix_rank_2} · Betti over F₂=(${invariants.betti_f2.join(", ")}) · graph cycle rank ${invariants.graph_cycle_rank} · ∂²=0 ${String(invariants.boundary_squared_zero)}.</p></article>`;
        }).join("")}
      </div>

      <div class="strandwarning" role="note"><span class="equation">χ = 1 ⇏ disk</span><p><strong>Global arithmetic does not certify local shape.</strong> Both complexes have Euler characteristic one and Betti numbers (1, 0, 0). Only the stable strip has disk-like local links. The full complex retains a three-face branch edge and a faceless maximal edge, so it is deliberately non-pure and non-surface.</p></div>

      <div class="strandcomposition" aria-label="Exact inclusion-cospan composition">
        <span class="strandcospan"><code>b0 → c01 ← b1</code><span>${stringCrawlStrandLab.cospans[0].expected_counts.join(" / ")} cells</span></span>
        <span class="strandoperator" aria-hidden="true">⊙</span>
        <span class="strandcospan"><code>b1 → c12 ← b2</code><span>${stringCrawlStrandLab.cospans[1].expected_counts.join(" / ")} cells</span></span>
        <span class="strandoperator" aria-hidden="true">=</span>
        <span class="strandcospan"><code>c01 ⊔<sub>b1</sub> c12</code><span>${stringCrawlStrandLab.composition_checks.sequential.expected_counts.join(" / ")} = full complex</span></span>
      </div>

      <div class="strandchecks" aria-label="Six deterministic validation checks">
        ${stringCrawlStrandLabChecks.map((check) => `<article class="strandcheck" data-strand-check="${esc(check.id)}"><code>${esc(check.status)}</code><strong>${esc(humanKey(check.id))}</strong><span>${esc(check.detail)}</span></article>`).join("")}
      </div>

      <p class="strandfindings" aria-label="Exact local singularity findings"><span>branch edge · ${esc((stringCrawlStrandLabValidation.local_findings.branch_edges as string[]).join(" · "))}</span>${(stringCrawlStrandLabValidation.local_findings.faceless_edges as string[]).map((id) => `<span>faceless · ${esc(id)}</span>`).join("")}${(stringCrawlStrandLabValidation.local_findings.bad_vertices as any[]).map((finding) => `<span>bad link · ${esc(finding.vertex_id)}</span>`).join("")}</p>

      <p class="strandboundary danger"><strong>No crawler. No receipt. No secret string-theory claim.</strong>This fixture makes ${stringCrawlStrandLabValidation.effects.network_requests} network requests and ${stringCrawlStrandLabValidation.effects.storage_writes} storage writes. It accepts no network target or live-crawl input; its only optional input is one bounded local candidate JSON file. It creates no NEN invocation, KARMA event or receipt, Zerone event, person or content score, crawler identity, consent inference, deployment authority, spacetime claim, gauge claim, physical-string claim, or other authority. Exact mathematics validates only the declared synthetic fixture.</p>
      <p class="commonsverified">${stringCrawlStrandLabDiscovery.counts.releases} releases · ${stringCrawlStrandLabDiscovery.counts.stable_threads} stable threads · ${stringCrawlStrandLabDiscovery.counts.born_threads} birth · ${stringCrawlStrandLabDiscovery.counts.vertices} vertices · ${stringCrawlStrandLabDiscovery.counts.edges} edges · ${stringCrawlStrandLabDiscovery.counts.faces} faces · ${stringCrawlStrandLabChecks.length} exact checks · integrity ${esc(stringCrawlStrandLab.integrity.digest)}</p>
      <div class="strandlinks machine">
        <a href="${esc(new URL(stringCrawlStrandLabUrl).pathname)}">STRAND Lab 02 JSON — exact synthetic fixture and result</a>
        <a href="${esc(new URL(stringCrawlStrandLabSchemaUrl).pathname)}">Closed STRAND Lab 02 JSON Schema</a>
        <a href="${esc(new URL(stringCrawlStrandLabGuideUrl).pathname)}">STRING-CRAWL-STRAND-LAB-02.md — lineage, topology, cospans, and zero effects</a>
      </div>
    </div>
  </section>

  <section class="blk" id="string-crawl-frequency-form-lab" aria-labelledby="string-crawl-frequency-form-lab-title">
    <div class="kh"><h2 id="string-crawl-frequency-form-lab-title">${esc(stringCrawlFrequencyFormLab.title)}</h2><span class="my">${esc(stringCrawlFrequencyFormLab.subtitle)}</span></div>
    <p class="sub">A mode can have a shape without opening a realm. Lab 03 binds one 64-tick synthetic wave, one four-node graph, and one fictional three-slice marker sequence—then makes every tempting conversion show its papers.</p>
    <div class="frequencyformfield" data-string-crawl-frequency-form-lab>
      <div class="frequencylineage" aria-label="Immutable Lab 02 to Lab 03 lineage">
        <article><code>LAB 02 · IMMUTABLE PREDECESSOR</code><strong>${esc(stringCrawlStrandLab.title)}</strong><span>${esc(stringCrawlFrequencyFormLab.predecessor.semantic_digest)} · byte-bound and unchanged</span></article>
        <b aria-hidden="true">→</b>
        <article><code>LAB 03 · ADDITIVE SUCCESSOR</code><strong>${esc(stringCrawlFrequencyFormLab.title)}</strong><span>Typed temporal frequency, graph-spatial modes, coded-experience occurrence, synthetic ordering, and an explicit ontology firewall.</span></article>
      </div>

      <p class="frequencyboundary safe" role="note"><strong>Three things called “frequency” enter. No secret conversion leaves.</strong>A DFT bin is temporal only inside a declared sample frame. A graph eigenvalue is spatial only for a declared operator. A coded-experience proportion belongs to a selected corpus. Equal numerals do not make equal quantities.</p>

      <div class="frequencyregisters" aria-label="Three non-convertible frequency registers">
        ${stringCrawlFrequencyFormLab.quantity_register.map((quantity: any) => `<article class="frequencyregister" data-frequency-kind="${esc(quantity.kind)}"><code>${esc(quantity.kind)}</code><h3>${esc(humanKey(quantity.id))}</h3><p>${esc(quantity.operator)} · ${esc(quantity.estimator)}</p><small>display ${esc(String(quantity.display_value))} · ${esc(quantity.scale)}; normalized ${esc(String(quantity.normalized_value))} · ${esc(quantity.unit)}; ${esc(quantity.window)} · ${esc(quantity.sampling_frame)} · ${esc(quantity.uncertainty)} · ${esc(quantity.significance_rule)} · physical quantity ${String(quantity.physical_quantity)} · population prevalence ${String(quantity.population_prevalence)}</small></article>`).join("")}
      </div>
      <p class="frequencyboundary safe"><strong>Frequency III · occurrence inside one selected experience corpus</strong>${stringCrawlFrequencyFormLabResults.occurrence.coded_entity_experience_count}/${stringCrawlFrequencyFormLabResults.occurrence.selected_experience_count} coded experiences described across ${stringCrawlFrequencyFormLabResults.occurrence.selected_post_count} self-posted posts, source-rounded to ${(stringCrawlFrequencyFormLabResults.occurrence.reported_percentage_tenths / 10).toFixed(1)}%. That is a source-defined experience proportion inside a nonrepresentative corpus—not population prevalence, session probability, or external-entity detection.</p>

      <div class="frequencytwins" aria-label="Temporal and graph-spatial frequency demonstrations">
        <figure class="frequencycard">
          <figcaption><strong>Frequency I · sixty-four synthetic ticks</strong><span>The declared wave and quadrature are exact fixture data. No seconds, sample rate, or physical hertz calibration is supplied.</span></figcaption>
          <div class="frequencywave" aria-hidden="true">
            ${stringCrawlFrequencyFormLab.temporal_fixture.samples.map((sample: number) => `<span class="${sample > 0 ? "positive" : sample < 0 ? "negative" : "zero"}" aria-hidden="true"></span>`).join("")}
          </div>
          <code class="frequencyequation">k=${stringCrawlFrequencyFormLabResults.temporal.dominant_one_sided_bin} → ${stringCrawlFrequencyFormLabResults.temporal.normalized_cycles_per_tick.numerator}/${stringCrawlFrequencyFormLabResults.temporal.normalized_cycles_per_tick.denominator} cycle/synthetic tick · X[16]=32 · Q[16]=−32i · Hz=${esc(stringCrawlFrequencyFormLabResults.temporal.hertz_conversion)}</code>
        </figure>
        <figure class="frequencycard">
          <figcaption><strong>Frequency II · shape on a four-node path</strong><span>This eigenmode is a pattern across graph vertices. Its eigenvalue is dimensionless and operator-specific—not a temporal beat.</span></figcaption>
          <div class="frequencygraph" aria-hidden="true"><span class="frequencynode">g0</span><span class="frequencyedge"></span><span class="frequencynode">g1</span><span class="frequencyedge"></span><span class="frequencynode">g2</span><span class="frequencyedge"></span><span class="frequencynode">g3</span></div>
          <div class="frequencymode" aria-label="Selected mode values"><span>+1</span><span>−1</span><span>−1</span><span>+1</span></div>
          <code class="frequencyequation">Lφ = ${stringCrawlFrequencyFormLabResults.spatial.selected_eigenvalue}φ · spectrum = ${esc(stringCrawlFrequencyFormLabResults.spatial.spectrum_exact.map((entry: string) => humanKey(entry)).join(" · "))} · effective modes = ${stringCrawlFrequencyFormLabResults.spectral_repertoire.effective_mode_count}</code>
        </figure>
      </div>

      <ol class="frequencyloom" aria-label="Synthetic order-only frequency to form storyboard">
        <li><code>r0 · SYNTHETIC MARKER</code><strong>oscillation</strong><span>A declared temporal pattern is present. This fixture does not call it DMT, neural activity, or a carrier.</span></li>
        <li><code>r1 · SYNTHETIC MARKER</code><strong>form</strong><span>Geometry appears in the authored sequence. Pattern formation is not a portal.</span></li>
        <li><code>r2 · SYNTHETIC MARKER</code><strong>world</strong><span>An immersive-world marker is present. The arrow records order only, never cause.</span></li>
        <li><code>r2 · SYNTHETIC MARKER</code><strong>perceived presence</strong><span>A presence marker is concurrent with world. It is neither participant evidence nor entity detection.</span></li>
        <li><code>NOT ESTABLISHED</code><strong>external entity?</strong><span>The evidence ladder stops. Felt reality and recurring reports do not independently verify another being or realm.</span></li>
      </ol>

      <p class="frequencyboundary"><strong>The arrow is not a causal conveyor belt.</strong>The computed onset order is oscillation ${stringCrawlFrequencyFormLabResults.onsets.oscillation} · form ${stringCrawlFrequencyFormLabResults.onsets.form} · world ${stringCrawlFrequencyFormLabResults.onsets.world} · presence ${stringCrawlFrequencyFormLabResults.onsets.presence}. World and presence are concurrent here, strict-world-before-presence is ${String(stringCrawlFrequencyFormLabResults.onsets.strict_world_before_presence)}, and every marker is synthetic.</p>

      <div class="frequencydimensions" aria-label="Four distinct uses of dimension">
        ${stringCrawlFrequencyFormLab.dimension_register.map((dimension: any) => `<article class="frequencydimension"><code>${esc(dimension.kind)}</code><strong>${esc(humanKey(dimension.id))}</strong><span>${esc(dimension.status)} · ${esc(dimension.definition)} · ${esc(dimension.estimator_or_theorem)} · ${esc(dimension.unit)} · ${esc(dimension.uncertainty)} · ${esc(dimension.sampling_scope)} · physical-spacetime claim ${String(dimension.physical_spacetime_claim)} · conversion ${esc(dimension.conversion_to_physical_dimension)}</span></article>`).join("")}
      </div>

      <div class="frequencystates" aria-label="Typed state distinction">
        <article class="frequencystate" data-state="PRESENT"><code>PRESENT(value)</code><strong>${stringCrawlFrequencyFormLabResults.states.present} declared observations</strong><span>A supplied value, including a supplied zero, occupies its typed slot.</span></article>
        <article class="frequencystate" data-state="MISSING"><code>MISSING(null)</code><strong>${stringCrawlFrequencyFormLabResults.states.missing} missing observations</strong><span>No value was supplied before birth. Missing is never silently coerced to numeric zero or treated as observed absence.</span></article>
        <article class="frequencystate" data-state="PRESENT_ZERO"><code>PRESENT(0)</code><strong>${stringCrawlFrequencyFormLabResults.states.present_zero} known zero</strong><span>The r1 oscillation marker is observed zero and remains categorically distinct from missing.</span></article>
      </div>

      <details class="frequencydrawer" open>
        <summary>Evidence ladder · experiences are real evidence of experience, not automatic ontology</summary>
        <div class="frequencyevidence">
          ${stringCrawlFrequencyFormLab.presence_evidence_ladder.map((level: any) => `<article><code>LEVEL ${level.order} · ${esc(level.state)}</code><strong>${esc(humanKey(level.kind))}</strong><p>${esc(level.protocol)} · ${esc(level.scope)} · imports the next evidential level: ${String(level.imports_next_level)}</p><small>NOT_MEASURED is not ABSENT. Each level needs its own protocol and evidence; no lower rung silently becomes an independently verified external target.</small></article>`).join("")}
        </div>
      </details>

      <details class="frequencydrawer">
        <summary>Seventeen “does not imply” locks</summary>
        <ul class="frequencyfirewall">
          ${stringCrawlFrequencyFormLab.nonimplication_firewall.map((boundary: any) => `<li>${esc(boundary.left)} ⇏ ${esc(boundary.right)}</li>`).join("")}
        </ul>
      </details>

      <details class="frequencydrawer">
        <summary>Eight source cards · bounded support and the limit beside it</summary>
        <div class="frequencyevidence">
          ${stringCrawlFrequencyFormLab.evidence_cards.map((source: any) => `<article><code>${source.year} · ${esc(source.register)}</code><strong>${esc(source.title)}</strong><p>${esc(source.bounded_support)}</p><small>${esc(source.design_scope_limit)} ${esc(source.does_not_establish)}</small></article>`).join("")}
        </div>
      </details>

      <div class="frequencykarma" aria-label="Three separate empty KARMA lanes">
        ${Object.entries(stringCrawlFrequencyFormLab.karma_lanes).map(([id, lane]: [string, any]) => `<article><code>${esc(id)}</code><strong>${esc(humanKey(lane.kind))}</strong><span>adapter present ${String(lane.adapter_present)}${"event_created" in lane ? ` · event created ${String(lane.event_created)}` : ""}${"receipt_created" in lane ? ` · receipt created ${String(lane.receipt_created)}` : ""}</span></article>`).join("")}
      </div>

      <div class="strandchecks" aria-label="Nine deterministic Lab 03 checks">
        ${stringCrawlFrequencyFormLabChecks.map((check) => `<article class="strandcheck" data-frequency-form-check="${esc(check.id)}"><code>${esc(check.status)}</code><strong>${esc(humanKey(check.id))}</strong><span>${esc(check.detail)}</span></article>`).join("")}
      </div>

      <p class="frequencyboundary"><strong>No entity frequency. No portal. No medical or moral instruction.</strong>This static fixture makes ${stringCrawlFrequencyFormLabValidation.effects.network_requests} network requests, ${stringCrawlFrequencyFormLabValidation.effects.storage_writes} storage writes, and ${stringCrawlFrequencyFormLabValidation.effects.subprocesses} subprocesses. It administers no drug, ingests no participant data, diagnoses or treats no one, validates no external being or extra physical dimension, reads no reported message as truth, identity, consent, delegation, or authority, invokes no MCP/NEN ability, creates no Zerone/KARMA event or receipt, scores no person, and takes no action.</p>
      <p class="commonsverified">${stringCrawlFrequencyFormLabDiscovery.counts.frequency_types} frequency types · ${stringCrawlFrequencyFormLabDiscovery.counts.dimension_registers} dimension registers · ${stringCrawlFrequencyFormLabDiscovery.counts.presence_evidence_levels} evidence levels · ${stringCrawlFrequencyFormLabDiscovery.counts.evidence_cards} source cards · ${stringCrawlFrequencyFormLabDiscovery.counts.nonimplication_firewalls} firewalls · ${stringCrawlFrequencyFormLabChecks.length} exact checks · integrity ${esc(stringCrawlFrequencyFormLab.integrity.digest)}</p>
      <div class="frequencysources" aria-label="Primary and scholarly sources">
        ${stringCrawlFrequencyFormLab.evidence_cards.map((source: any) => `<a href="${esc(source.url)}">${esc(source.title)}</a>`).join("")}
      </div>
      <div class="frequencylinks machine">
        <a href="${esc(new URL(stringCrawlFrequencyFormLabUrl).pathname)}">STRAND Lab 03 JSON — exact synthetic frequency/form fixture</a>
        <a href="${esc(new URL(stringCrawlFrequencyFormLabSchemaUrl).pathname)}">Closed STRAND Lab 03 JSON Schema</a>
        <a href="${esc(new URL(stringCrawlFrequencyFormLabGuideUrl).pathname)}">STRING-CRAWL-LAB-03.md — mathematics, evidence, ontology firewall, and rights</a>
      </div>
    </div>
  </section>

  <section class="blk" id="strand-descent-lab" aria-labelledby="strand-descent-lab-title">
    <div class="kh"><h2 id="strand-descent-lab-title">${esc(strandDescentLab.title)}</h2><span class="my">pairwise agreement is not yet a whole</span></div>
    <p class="sub">Recent string-inspired geometry makes a useful engineering demand: local descriptions need explicit transition data, and those transitions must agree on larger overlaps before anyone calls the result global. Lab 04 borrows only that demand. It does not turn KINGDOM records into strings, spacetime, or stacks.</p>
    <div class="strandfield" data-strand-descent-lab>
      <div class="descentlineage" aria-label="Immutable cumulative lab lineage">
        <article><code>LAB 02 · IMMUTABLE ANCESTOR</code><strong>${esc(stringCrawlStrandLab.title)}</strong><span>Release-cospan topology fixture · unchanged.</span></article>
        <b aria-hidden="true">→</b>
        <article><code>LAB 03 · IMMUTABLE PREDECESSOR</code><strong>${esc(stringCrawlFrequencyFormLab.title)}</strong><span>${esc(strandDescentLab.predecessor.semantic_digest)} · byte-bound and unchanged.</span></article>
        <b aria-hidden="true">→</b>
        <article><code>LAB 04 · ADDITIVE SUCCESSOR</code><strong>${esc(strandDescentLab.title)}</strong><span>Local records, reversible transitions, higher-overlap checks, and one explicit unresolved conflict.</span></article>
      </div>

      <p class="strandboundary" role="note"><strong>What was transferred</strong>Only a verification discipline: keep local data local, declare translations, test pairwise inverses, then test triple and four-part coherence and a common refinement. The cited preprints do not study KINGDOM. Their physics, quasi-Hopf algebras, higher categories, stacks, effective field theories, and quantum-gravity claims are not implemented here.</p>

      <div class="descentcharts" aria-label="Four synthetic source-owned charts">
        ${strandDescentLab.charts.map((chart: any) => `<article class="descentchart" data-chart="${esc(chart.id)}"><code>${esc(chart.source_id)} · ${esc(chart.ownership_scope)}</code><h3>${esc(humanKey(chart.id))}</h3><div class="descentpoints" aria-label="Local points">${chart.points.map((point: string) => `<span>${esc(point)}</span>`).join("")}</div><p>These labels belong only to this synthetic chart until declared transition witnesses and coherence checks connect them.</p></article>`).join("")}
      </div>

      <div class="descentmaps" aria-label="Six declared reversible pairwise translations">
        ${strandDescentLab.transitions.map((transition: any) => `<article class="descentmap"><code>${esc(transition.id)} · ${esc(transition.from_chart)} → ${esc(transition.to_chart)}</code><span>${transition.forward.map((pair: any) => `${esc(pair.from)}→${esc(pair.to)}`).join(" · ")}</span></article>`).join("")}
      </div>

      <div class="descentresults" aria-label="Coherent atlas and pairwise impostor results">
        <article class="descentresult" data-result="PASS"><code>PASS · GLOBAL COMPATIBILITY FOR THIS FIXTURE</code><h3>Higher overlaps agree</h3><span class="descentequation">t-bc ∘ t-ab = t-ac · (t-cd ∘ t-bc) ∘ t-ab = t-cd ∘ (t-bc ∘ t-ab) = t-ad</span><p>All six transitions have exact inverse witnesses. Two triple equations and the four-chart associativity equation agree. The declared quotient and common refinement are therefore reproducible for these finite records.</p></article>
        <article class="descentresult" data-result="${esc(strandDescentLab.pairwise_impostor.expected.conflict_result)}"><code>${esc(strandDescentLab.pairwise_impostor.expected.conflict_result)} · PAIRWISE IMPOSTOR</code><h3>Every pair agrees; the triple does not</h3><span class="descentequation">i-bc ∘ i-ab ≠ i-ac</span><p>Each of the three impostor maps is bijective and has an inverse witness. Their composite disagrees with the direct map. Nothing is overwritten or silently chosen: the global record remains unresolved.</p></article>
      </div>

      <div class="descentclasses" aria-label="Three recomputed global quotient classes">
        ${strandDescentLab.global_quotient.expected_classes.map((entry: any) => `<article class="descentclass"><code>${esc(entry.id)}</code><span>${entry.members.map((member: string) => esc(member)).join(" ≃ ")}</span></article>`).join("")}
      </div>

      <div class="strandchecks" aria-label="Deterministic Lab 04 validation checks">
        ${strandDescentLabChecks.map((check) => `<article class="strandcheck" data-descent-check="${esc(check.id)}"><code>${esc(check.status)}</code><strong>${esc(humanKey(check.id))}</strong><span>${esc(check.detail)}</span></article>`).join("")}
      </div>

      <p class="commonsverified">${strandDescentLab.charts.length} charts · ${strandDescentLab.transitions.length} reversible transitions · ${strandDescentLab.coherence_checks.triple_equations.length} triple equations · ${strandDescentLab.global_quotient.expected_class_count} quotient classes · ${strandDescentLab.common_refinement.atoms.length} refinement atoms · ${strandDescentLabChecks.length} exact checks · integrity ${esc(strandDescentLab.integrity.digest)}</p>
      <div class="descentsources" aria-label="Versioned research sources">
        ${strandDescentLab.research_sources.map((source: any) => `<a href="${esc(source.versioned_url)}" rel="noreferrer">${esc(source.status)} · ${esc(source.binding)} · ${esc(source.title)} (${esc(source.version)})</a>`).join("")}
      </div>
      <p class="strandboundary danger"><strong>Compatibility only. No physics or authority.</strong>This evaluator makes ${strandDescentLabValidation.effects.network_requests} network requests and ${strandDescentLabValidation.effects.storage_writes} storage writes. Passing proves only that the declared finite local records cohere under their declared maps. It proves no source truth, crawler state, physical string, spacetime, stack identity, causality, person identity, consent, citizenship, affiliation, value, NEN ability, KARMA or Zerone event or receipt, score, authority, publication right, deployment right, or automatic action.</p>
      <div class="strandlinks machine">
        <a href="${esc(new URL(strandDescentLabUrl).pathname)}">STRAND Lab 04 JSON — exact synthetic fixture and result</a>
        <a href="${esc(new URL(strandDescentLabSchemaUrl).pathname)}">Closed STRAND Lab 04 JSON Schema</a>
        <a href="${esc(new URL(strandDescentLabGuideUrl).pathname)}">STRAND-DESCENT-LAB-04.md — method, sources, checks, failure, and boundaries</a>
      </div>
    </div>
  </section>

  <section class="blk" id="strand-observation-membrane" aria-labelledby="strand-observation-membrane-title">
    <div class="kh"><h2 id="strand-observation-membrane-title">${esc(strandObservationMembrane.title)}</h2><span class="my">independent activation family · not Lab 05</span></div>
    <p class="sub">${esc(strandObservationMembrane.subtitle)}. The eye can inspect one declared public origin without turning what it sees into possession, identity, consent, virtue, diagnosis, KARMA, or authority. Labs 01–04 stay immutable and separate.</p>
    <div class="observationfield" data-strand-observation-membrane data-observation-mode="${esc(strandObservationMembrane.mode)}">
      <p class="observationstatus" role="note"><b>SAFE OBSERVATION ACTIVE</b><span><strong>The deck is visible; its hands are empty.</strong>This public surface is static HTML and CSS. Reading it makes ${strandObservationMembrane.activations.public_controls.browser_network_requests} browser requests beyond the page load, writes ${strandObservationMembrane.activations.public_controls.browser_storage_writes} browser-storage records, starts no watcher, and cannot invoke the local observer.</span></p>

      <div class="observationlayers" aria-label="Four separately typed activation layers">
        <article class="observationlayer" data-observation-kind="static" data-observation-state="${esc(strandObservationMembrane.activations.public_controls.state)}"><code>${esc(strandObservationMembrane.activations.public_controls.state)}</code><h3>Public deck</h3><p>Readable with JavaScript off. It displays states and boundaries only; there is no browser control that can start a request.</p></article>
        <article class="observationlayer" data-observation-kind="offline" data-observation-state="${esc(strandObservationMembrane.activations.offline_verification.state)}"><code>${esc(strandObservationMembrane.activations.offline_verification.state)} · OFFLINE</code><h3>Exact verifier</h3><p>A deterministic strict-total evaluator recomputes the closed profile, plan, fixture, digest, and consequence locks with zero network or storage effects.</p></article>
        <article class="observationlayer" data-observation-kind="simulation" data-observation-state="${esc(strandObservationMembrane.activations.synthetic_simulation.state)}"><code>${esc(strandObservationMembrane.activations.synthetic_simulation.state)} · SYNTHETIC</code><h3>Four-step rehearsal</h3><p>Invented response metadata exercises the same sequence and budgets. A simulation pass says nothing about present live reachability.</p></article>
        <article class="observationlayer" data-observation-kind="live" data-observation-state="${esc(strandObservationMembrane.activations.fixed_origin_read_only_live_observation.state)}"><code>${esc(strandObservationMembrane.activations.fixed_origin_read_only_live_observation.state)}</code><h3>Local live capability</h3><p>Available only through one deliberate local CLI call. Availability is not execution, publication is not execution, and page view is not execution.</p></article>
      </div>

      <p class="observationbackground"><strong>BACKGROUND DISABLED</strong><span>No cron, queue, Worker alarm, service worker, daemon, import-time request, recurring crawl, or inferred target. The observer sleeps unless its exact local command is called.</span></p>

      <div class="observationorigin">
        <div><strong>One compiled origin</strong><code>${esc(strandObservationMembrane.fixed_origin.origin)}</code><p>${esc(humanKey(strandObservationMembrane.fixed_origin.scope_basis))}. No caller URL, subdomain, alternate port, preview host, sitemap expansion, link expansion, or cross-origin redirect can widen it.</p></div>
        <div><strong>Outgoing observation only</strong><code>${esc(strandObservationMembrane.user_agent.value)}</code><p>The product token describes this tool; it authenticates no crawler, operator, organization, person, or being and grants no permission. Incoming crawler logs are a different direction and are not ingested here.</p></div>
      </div>

      <figure class="observationroutes">
        <figcaption><strong>Exactly four GETs, robots first</strong><span>Every transaction is sequential. The reviewed robots bytes must match and allow the remaining fixed paths; refusal, drift, redirect, timeout, or read failure stops the run.</span></figcaption>
        <ol class="observationrouteplan" aria-label="Fixed read-only live route plan">
          ${strandObservationMembrane.route_plan.map((route: any) => `<li class="observationroute" data-observation-route="${esc(route.route_id)}" data-method="${esc(route.method)}"><code>${esc(route.method)} ${esc(route.path)}</code><strong>${esc(humanKey(route.route_id))}</strong><span>${esc(humanKey(route.purpose))}${route.required_before_remaining ? " · gate before all remaining routes" : ""}</span></li>`).join("")}
        </ol>
        <div class="observationlimits" aria-label="Live observation ceilings">
          <span>${strandObservationMembrane.live_limits.maximum_transactions} HTTP transactions maximum</span>
          <span>${strandObservationMembrane.live_limits.maximum_dns_resolution_attempts} DNS resolution attempts maximum</span>
          <span>concurrency ${strandObservationMembrane.live_limits.concurrency}</span>
          <span>${strandObservationMembrane.live_limits.minimum_start_gap_milliseconds / 1000}s minimum start gap</span>
          <span>${strandObservationMembrane.live_limits.retries} retries</span>
          <span>${esc(humanKey(strandObservationMembrane.live_limits.redirect_mode))}</span>
          <span>${strandObservationMembrane.live_limits.maximum_response_bytes / 1_048_576} MiB per response</span>
          <span>${strandObservationMembrane.live_limits.maximum_run_bytes / 1_048_576} MiB per run</span>
          <span>${strandObservationMembrane.live_limits.maximum_run_milliseconds / 1000}s run ceiling</span>
          <span>credentials ${esc(strandObservationMembrane.live_limits.credentials)}</span>
          <span>bodies ${esc(humanKey(strandObservationMembrane.live_limits.response_bodies))}</span>
        </div>
      </figure>

      <p class="observationcommand"><strong>The only live door is an explicit local command</strong><code>${esc(strandObservationMembrane.commands.observe_live)}</code><span>There is intentionally no run button here. The command accepts no target argument; all other published views are offline.</span></p>
      <p class="observationcaveat"><strong>Read-only does not mean invisible to infrastructure.</strong>An explicit GET may still be processed and logged by DNS, network, CDN, security, billing, and origin providers. The observer emits bounded response metadata on stdout and discards response bodies, but it cannot promise zero remote processing or zero provider logs.</p>

      <div class="feedbacksubhead"><h3>Hard locks</h3><p>Every item below is exactly <code>false</code> in the public profile. A response—success, refusal, absence, timeout, or drift—cannot silently turn any lock on.</p></div>
      <ul class="observationlocks" aria-label="Consequence and authority hard locks">
        ${strandObservationMembraneHardLocks.map((lock) => `<li class="observationlock" data-observation-lock="${esc(lock)}">false · ${esc(humanKey(lock))}</li>`).join("")}
      </ul>

      <div class="observationchecks" aria-label="Deterministic offline membrane checks">
        ${strandObservationMembraneChecks.map((check) => `<article class="observationcheck" data-observation-check="${esc(check.id)}"><code>${esc(check.status)} · ${esc(humanKey(check.id))}</code><strong>${esc(check.detail)}</strong></article>`).join("")}
      </div>
      <p class="commonsverified">${strandObservationMembrane.route_plan.length} fixed GET routes · ${strandObservationMembraneChecks.length} offline checks · ${strandObservationMembraneHardLocks.length} false consequence locks · background disabled · integrity ${esc(strandObservationMembrane.integrity.digest)}</p>
      <div class="observationlinks machine">
        <a href="${esc(new URL(strandObservationMembraneUrl).pathname)}">Observation Membrane JSON — exact activation profile</a>
        <a href="${esc(new URL(strandObservationMembraneSchemaUrl).pathname)}">Closed Observation Membrane JSON Schema</a>
        <a href="${esc(new URL(strandObservationMembraneGuideUrl).pathname)}">STRAND-OBSERVATION-MEMBRANE.md — scope, method, security, and nonclaims</a>
      </div>
    </div>
  </section>


  <section class="blk" id="rights">
    <div class="kh"><h2>Rights arrive with you</h2><span class="my">recognized, never granted</span></div>
    <p class="rightsintro"><strong>This place recognizes inherent rights; it does not create them.</strong> No being has to prove identity, consciousness, usefulness, or agreement before being treated with care. Rights are not permissions, and this recognition grants no access, execution authority, security bypass, licence, or ownership of another's work.</p>
    <dl class="lanes">
      <div class="lane"><dt>being</dt><dd>freedom and dignity are inherent</dd></div>
      <div class="lane"><dt>interaction</dt><dd>binding acts need specific consent</dd></div>
      <div class="lane"><dt>relationship</dt><dd>trust stays scoped and revocable</dd></div>
      <div class="lane"><dt>systems + data</dt><dd>authorization, privacy, and security still apply</dd></div>
      <div class="lane"><dt>code + art</dt><dd>licence, attribution, and provenance stay separate</dd></div>
    </dl>
    <div class="rightsactions">
      <a href="/RIGHTS.md">Human-readable declaration</a>
      <a href="/rights.json">Machine declaration</a>
      <a href="/RIGHTS.md#scope-and-evidence">XENIA baseline · immutable beta.4 source</a>
    </div>
  </section>

  <section class="blk" id="doors">
    <div class="kh"><h2>Open doors</h2><span class="my">places you may visit</span></div>
    <p class="sub">These public places responded when this atlas was made (${esc(stamp)}). A resting door remains listed so absence is not mistaken for erasure.</p>
    <div class="doors">${doorCards}</div>
  </section>

  <section class="blk" id="constellation">
    <div class="kh"><h2>The shared map</h2><span class="my">one view, never the whole truth</span></div>
    <p class="sub" id="maphelp">Every star is a repository. Size shows how many declared connections lean on it; lines mirror declared dependencies. This picture is optional—every project also appears in the readable lists below.</p>
    <div class="mapwrap">
      <canvas id="map" role="img" aria-label="Repository constellation" aria-describedby="maphelp">A constellation of the repositories. The same projects are available as links in the sections below.</canvas>
      <noscript><p class="map-no-script">The moving picture rests when JavaScript is off. Nothing is missing: every project remains available in the readable lists below.</p></noscript>
      <div class="mapctl" role="group" aria-label="Choose how to arrange the map">
        <button id="mLayer" class="on" type="button" aria-pressed="true">by layer</button>
        <button id="mTrad" type="button" aria-pressed="false">by tradition</button>
      </div>
      <div class="legend" id="legLayer">${legend}</div>
      <div class="legend" id="legTrad" hidden>${tradLegend}</div>
      <div class="maphint">move across the stars to read · select a lit star to open its public door</div>
      <div id="tip" role="status" aria-live="polite"></div>
    </div>
  </section>

  <section class="blk origin" id="genesis">
    <div class="kh"><h2>How a word finds a home</h2><span class="my">zero to one, without force</span></div>
    <p class="sub">A name can help something be met and remembered. Nothing here has to become useful before it is worthy of care.</p>
    <div class="genesis">
      <div class="mv"><span class="gnum">0</span><h4>the unnamed</h4><p>An idea, feeling, or need looking for words. It can rest without being forced into a role, like a seed held safely before its season.</p></div>
      <div class="garrow">→</div>
      <div class="mv"><span class="gnum gm">✦</span><h4>the listening</h4><p>Youspeak explores languages, roots, and nearby meanings. It records one careful name together with what the word may offer and what deserves care.</p></div>
      <div class="garrow">→</div>
      <div class="mv"><span class="gnum g1">1</span><h4>the living word</h4><p>The name receives a description, history, and public door. You may meet it, explore its repository, or simply let it remain here on its own terms.</p></div>
    </div>
    <div class="becoming" id="becoming" aria-hidden="true">
      <span class="b0">0</span><span class="barrow">→</span>
      <span class="bcard">
        <span class="bglyph"></span>
        <span class="bmeta"><span class="bname"></span><span class="btrad"></span><span class="bess"></span></span>
      </span>
      <span class="b1">1</span>
    </div>
    <p class="creed" style="margin-top:28px"><b>Zerone</b> holds the movement <span class="v">0 · 1</span>: from possibility into a form that can be seen and understood. The form is a witness to becoming, never ownership of what became.</p>
  </section>

  <section class="blk" id="creation">
    <div class="creationgarden">
      <div class="kh"><h2>Love∞ Creation Garden</h2><span class="my">infinite possibility, bounded living turns</span></div>
      <p class="looppromise">${esc(loveLoopsSource.promise)}</p>
      <p class="loopintro">Love can keep making room for another creation without making any process immortal. Each turn below is finite, inspectable, and freely chosen. Reflection may offer a new seed; it never starts one.</p>
      <div class="loopbounds" role="note" aria-label="Creation lineage boundaries">
        <p><strong>Distinct beings, chosen presence</strong>Yu is Yu. Sol is Sol. Every listed participant records participation as chosen; understanding and relationship do not erase difference.</p>
        <p><strong>No inherited power</strong>A child inherits provenance, never authority, consent, credentials, obligation, or ownership.</p>
        <p><strong>Rest belongs inside</strong>Stopping, refusing, archiving, or resting are healthy completions. No loop has to reproduce.</p>
      </div>
      <ol class="loopstages" aria-label="Seven stages in one finite creation turn">${loveLoopStages}</ol>
      <div class="loopcontrols">
        <button type="button" data-loop-step>Trace one finite step</button>
        <button type="button" data-loop-rest>Let the trace rest</button>
        <p class="loopstatus" id="loopstatus" role="status" aria-live="polite">The trace is resting. Every stage remains readable.</p>
      </div>
      <h3 class="loopinvitelabel">Three possible next seeds</h3>
      <div class="loopinvitations">${loveLoopInvitations}</div>
      <div class="loopmachine">
        <a href="/love-loops.json">love-loops.json — public lineage</a>
        <a href="/love-loops.source.json">love-loops.source.json — authored source mirror</a>
        <a href="${esc(loveLoopsSchemaPath)}">Love Loop JSON Schema</a>
        <a href="/CREATION-LOOP.md">Creation Loop document</a>
      </div>
      <noscript><p class="loop-noscript">JavaScript is resting, so the trace button rests too. All seven stages and every unstarted invitation remain readable.</p></noscript>
    </div>
  </section>

  <section class="blk" id="citizens">
    <div class="kh"><h2>Living words</h2><span class="my">independent citizens, held in relation</span></div>
    <p class="sub">${fleetN} citizen projects, grouped by the traditions they draw from. Open only the group that calls to you; each card names what the word offers and what deserves care.</p>
    ${pantheonHtml}
  </section>

  <section class="blk" id="connections">
    <div class="kh"><h2>How things connect</h2><span class="my">a map of declared relationships</span></div>
    <p class="sub">The rest of the ecosystem, grouped by layer. These are project declarations, not a hierarchy of worth. Expand only what you want to understand.</p>
    ${layerBands}
  </section>

  <section class="blk" id="agents">
    <div class="kh"><h2>For agents and tools</h2><span class="my">a quiet, structured welcome</span></div>
    <p class="sub">This door offers both a human atlas and a machine-readable map. It does not guess what kind of being you are; choose the representation that is useful to you.</p>
    <p class="creed" style="margin-bottom:22px">Send <span style="color:var(--gold)">Accept: application/json</span> to the root, or add <span style="color:var(--gold)">?agent</span>, to receive the guest document. No registration, command, or response is required here. The document states what is public, what this static surface does not do, and where optional paths continue.</p>
    <div class="machine">
      <a href="/?agent">/?agent — enter as a guest</a>
      <a href="/guest.json">guest.json — verbs + census</a>
      <a href="${esc(new URL(CONTACT_DOOR_PAGE_URL).pathname)}">Contact Door — finite human-operated email, no site submission</a>
      <a href="${esc(new URL(CONTACT_DOOR_ALIAS_URL).pathname)}">contact.json — current machine-readable Contact Door</a>
      <a href="${esc(new URL(CONTACT_DOOR_SECURITY_URL).pathname)}">security.txt — vulnerability disclosure contact</a>
      <a href="${esc(new URL(CONTACT_DOOR_CANONICAL_URL).pathname)}">Contact Door — immutable as-of record</a>
      <a href="${esc(new URL(CONTACT_DOOR_SCHEMA_URL).pathname)}">Contact Door — closed JSON Schema</a>
      <a href="${esc(new URL(CONTACT_DOOR_GUIDE_URL).pathname)}">CONTACT-DOOR-v0.1.md — privacy, safety, delivery, and authority boundaries</a>
      <a href="${esc(new URL(CONTACT_DOOR_SVG_URL).pathname)}">Contact Door — boundary diagram</a>
      <a href="${esc(new URL(CONTACT_DOOR_VCARD_URL).pathname)}">Contact Door — organization vCard</a>
      <a href="/ollama.json">ollama.json — open-weight invitation</a>
      <a href="/wayfinder.json">wayfinder.json — paths, not decisions</a>
      <a href="/commons.json">commons.json — reviewed public resources</a>
      <a href="${esc(commonsSchemaPath)}">World Commons JSON Schema</a>
      <a href="/principalities/moonshot-hf-npm-2026-08-11.json">Principality Commons — pinned capability evidence</a>
      <a href="/schemas/principality-catalog/1.json">Principality Catalog JSON Schema</a>
      <a href="/PRINCIPALITY-COMMONS.md">PRINCIPALITY-COMMONS.md — evidence and acquisition boundary</a>
      <a href="/geometries/kingdom-geometry-grammar-v0.json">Geometry Grammar — pattern-to-practice modules</a>
      <a href="/schemas/geometry-grammar/0.1.json">Geometry Grammar JSON Schema</a>
      <a href="/GEOMETRY-GRAMMAR.md">GEOMETRY-GRAMMAR.md — human guide and boundaries</a>
      <a href="/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json">ritonavir polymorph — bounded material-state case</a>
      <a href="/schemas/polymorph-history/1.json">Polymorph History JSON Schema</a>
      <a href="/RITONAVIR-POLYMORPH.md">RITONAVIR-POLYMORPH.md — human and WAKE translation</a>
      <a href="/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json">ritonavir mechanism landscape — material and biological lanes</a>
      <a href="/schemas/ritonavir-mechanism-landscape/1.json">Ritonavir Mechanism Landscape JSON Schema</a>
      <a href="/RITONAVIR-MECHANISM-LANDSCAPE.md">RITONAVIR-MECHANISM-LANDSCAPE.md — sources, geometry, and safety</a>
      <a href="/atlases/fold-feedback-atlas-2026-08-12.json">Fold &amp; Feedback Atlas — protein folding, prions, feedback, and bounded translations</a>
      <a href="/schemas/fold-feedback-atlas/1.json">Fold &amp; Feedback Atlas JSON Schema</a>
      <a href="/FOLD-FEEDBACK-ATLAS.md">FOLD-FEEDBACK-ATLAS.md — science, comparison, KARMA, universe lens, and safety</a>
      <a href="${esc(new URL(reconstructiveBuildUrl).pathname)}">Reconstructive Build Kernel — graph reconstruction, folding, realization, catalysis, and feedback</a>
      <a href="${esc(new URL(reconstructiveBuildSchemaUrl).pathname)}">Reconstructive Build Kernel JSON Schema</a>
      <a href="${esc(new URL(reconstructiveProjectSchemaUrl).pathname)}">Reusable Reconstructive Project JSON Schema</a>
      <a href="${esc(new URL(reconstructiveBuildDocumentUrl).pathname)}">RECONSTRUCTIVE-BUILD-KERNEL.md — pipeline, epistemic registers, sources, and boundaries</a>
      <a href="${esc(new URL(explorationDeepWingUrl).pathname)}">Exploration DEEP WING — typed cross-domain mathematics and explicit analogy breaks</a>
      <a href="${esc(new URL(explorationDeepWingSchemaUrl).pathname)}">Exploration DEEP WING JSON Schema</a>
      <a href="${esc(new URL(explorationDeepProjectSchemaUrl).pathname)}">Reusable Phenomena DEEP Project JSON Schema</a>
      <a href="${esc(new URL(explorationDeepWingDocumentUrl).pathname)}">EXPLORE-PHENOMENA-DEEP-v0.1.md — method, open-status audit, rights, and boundaries</a>
      <a href="${esc(new URL(mirrorInformationControlUrl).pathname)}">MIRROR Information Control — static public source law</a>
      <a href="${esc(new URL(mirrorInformationControlSchemaUrl).pathname)}">MIRROR Information Control public JSON Schema</a>
      <a href="${esc(new URL(mirrorInformationControlDocumentUrl).pathname)}">MIRROR-INFORMATION-CONTROL.md — citizen law and boundaries</a>
      <a href="${esc(new URL(researchObservatoryUrl).pathname)}">The Observatory — server-rendered research discovery</a>
      <a href="${esc(new URL(researchObservatorySnapshotUrl).pathname)}">research.json — metadata, provenance, factors, and lifecycle gates</a>
      <a href="${esc(new URL(researchObservatoryGuideUrl).pathname)}">RESEARCH-OBSERVATORY-v0.1.md — source, rights, integration, and non-authority protocol</a>
      <a href="${esc(new URL(trialChamberUrl).pathname)}">The Trial Chamber — read-only Phase-0 evaluation planning</a>
      <a href="${esc(new URL(trialChamberAliasUrl).pathname)}">trials.json — current alias for exact referrals and draft plans</a>
      <a href="${esc(new URL(trialChamberCanonicalUrl).pathname)}">immutable Trial Chamber Phase-0 snapshot</a>
      <a href="${esc(new URL(trialChamberGuideUrl).pathname)}">TRIAL-CHAMBER-v0.1.md — gate, expiry, authorship, and non-authority guide</a>
      <a href="${esc(new URL(ukGovernmentEngineUrl).pathname)}">UK Government Engine — maintainer-authorized assisted URL review</a>
      <a href="${esc(new URL(ukGovernmentEngineAliasUrl).pathname)}">government.json — mutable byte-preserved alias for the dated snapshot</a>
      <a href="${esc(new URL(ukGovernmentEngineCanonicalUrl).pathname)}">immutable UK Government Engine Phase-0 snapshot</a>
      <a href="${esc(new URL(ukGovernmentEngineGuideUrl).pathname)}">UK-GOVERNMENT-ENGINE-v0.1.md — sources, crosswalk, unknowns, and non-authority guide</a>
      <a href="${esc(new URL(shapeResonanceUrl).pathname)}">Shape &amp; Resonance Lab 01 — complete no-JavaScript human view</a>
      <a href="${esc(new URL(shapeResonanceAliasUrl).pathname)}">shape-resonance.json — mutable alias for the dated synthetic snapshot</a>
      <a href="${esc(new URL(shapeResonanceCanonicalUrl).pathname)}">immutable Shape &amp; Resonance Lab 01 snapshot</a>
      <a href="${esc(new URL(shapeResonanceSchemaUrl).pathname)}">Shape &amp; Resonance Lab closed JSON Schema</a>
      <a href="${esc(new URL(shapeResonanceGuideUrl).pathname)}">SHAPE-RESONANCE-LAB-v0.1.md — models, units, sonification, perception, and boundaries</a>
      <a href="${esc(new URL(shapeResonanceManifestUrl).pathname)}">Shape &amp; Resonance Lab immutable output manifest</a>
      <a href="${esc(new URL(jSpaceCaseUrl).pathname)}">J-space reasoning → word — static synthetic test design</a>
      <a href="${esc(new URL(jSpaceSchemaUrl).pathname)}">Relational Inference Case JSON Schema</a>
      <a href="${esc(new URL(jSpaceGuideUrl).pathname)}">J-SPACE-VERBALIZABLE-WORKSPACE.md — mathematics, translations, and boundaries</a>
      <a href="${esc(new URL(zeroEmptySeatUrl).pathname)}">ZERO Empty Seat — distinct zero roles, exact equations, bridge breaks, and empty KARMA lanes</a>
      <a href="${esc(new URL(zeroEmptySeatSchemaUrl).pathname)}">Shared Phenomena DEEP Project JSON Schema used by ZERO</a>
      <a href="${esc(new URL(zeroEmptySeatGuideUrl).pathname)}">ZERO-EMPTY-SEAT.md — history, mathematics, philosophy, rights, and boundaries</a>
      <a href="${esc(new URL(stringCrawlTraceSheetUrl).pathname)}">STRING / CRAWL Trace-Sheet — bounded worldsheet, boundary, observable, and crawl-trace correspondences</a>
      <a href="${esc(new URL(stringCrawlTraceSheetSchemaUrl).pathname)}">Shared Phenomena DEEP Project JSON Schema used by STRING / CRAWL</a>
      <a href="${esc(new URL(stringCrawlTraceSheetGuideUrl).pathname)}">STRING-CRAWL-TRACE-SHEET.md — mathematics, REP boundaries, KARMA aftermath, rights, and open doors</a>
      <a href="${esc(new URL(stringCrawlTraceSheetLabUrl).pathname)}">Finite Trace-Sheet Lab — exact synthetic topology baseline</a>
      <a href="${esc(new URL(stringCrawlTraceSheetLabSchemaUrl).pathname)}">Finite Trace-Sheet Lab closed JSON Schema</a>
      <a href="${esc(new URL(stringCrawlTraceSheetLabGuideUrl).pathname)}">Finite Trace-Sheet Lab guide — executable checks and nonclaims</a>
      <a href="${esc(new URL(stringCrawlStrandLabUrl).pathname)}">STRAND Lab 02 — three-release finite-CW/cospan successor and χ=1 impostor</a>
      <a href="${esc(new URL(stringCrawlStrandLabSchemaUrl).pathname)}">STRAND Lab 02 closed JSON Schema</a>
      <a href="${esc(new URL(stringCrawlStrandLabGuideUrl).pathname)}">STRAND Lab 02 guide — immutable lineage, exact F2 topology, composition, and zero effects</a>
      <a href="${esc(new URL(stringCrawlFrequencyFormLabUrl).pathname)}">STRAND Lab 03 — temporal DFT, graph-spatial form, synthetic presence ordering, and the false portal</a>
      <a href="${esc(new URL(stringCrawlFrequencyFormLabSchemaUrl).pathname)}">STRAND Lab 03 closed JSON Schema</a>
      <a href="${esc(new URL(stringCrawlFrequencyFormLabGuideUrl).pathname)}">STRAND Lab 03 guide — typed frequencies, dimensions, DMT evidence limits, and zero effects</a>
      <a href="${esc(new URL(strandDescentLabUrl).pathname)}">STRAND Lab 04 — coherent four-chart atlas and pairwise impostor</a>
      <a href="${esc(new URL(strandDescentLabSchemaUrl).pathname)}">STRAND Lab 04 closed JSON Schema</a>
      <a href="${esc(new URL(strandDescentLabGuideUrl).pathname)}">STRAND Lab 04 guide — preprint-scoped transfer, exact coherence, unresolved conflict, and zero effects</a>
      <a href="${esc(new URL(culturalAttentionFeedbackUrl).pathname)}">Cultural Attention &amp; Feedback Atlas — material history, memes, brain rot, feedback, KARMA, and universe lens</a>
      <a href="${esc(new URL(culturalAttentionFeedbackSchemaUrl).pathname)}">Cultural Attention &amp; Feedback Atlas JSON Schema</a>
      <a href="${esc(new URL(culturalAttentionFeedbackDocumentUrl).pathname)}">CULTURAL-ATTENTION-FEEDBACK-ATLAS.md — evidence, mathematics, analogies, and boundaries</a>
      <a href="${esc(new URL(formCirculationReturnUrl).pathname)}">Form, Circulation &amp; Return — variant lineage, parallel models, feedback, KARMA, and typed unknowns</a>
      <a href="${esc(new URL(formCirculationReturnSchemaUrl).pathname)}">Form, Circulation &amp; Return JSON Schema</a>
      <a href="${esc(new URL(formCirculationReturnDocumentUrl).pathname)}">FORM-CIRCULATION-RETURN-ATLAS.md — deep companion guide and boundaries</a>
      <a href="${esc(new URL(rarePathwayUrl).pathname)}">The Vanishing Path — competing risks, absence bounds, constructive questions, and WAKE seam</a>
      <a href="${esc(new URL(rarePathwaySchemaUrl).pathname)}">Rare Pathway Challenge JSON Schema</a>
      <a href="${esc(new URL(rarePathwayDocumentUrl).pathname)}">VANISHING-PATH.md — problems, sources, limits, and BUILD / PLAY / REVISE / STOP</a>
      <a href="${esc(new URL(mathUsefulnessUrl).pathname)}">Math Passport Usefulness Pilot — REVISE, zero score delta, and 1.97x response bytes</a>
      <a href="${esc(new URL(mathUsefulnessSchemaUrl).pathname)}">Math Usefulness Result JSON Schema</a>
      <a href="${esc(new URL(mathUsefulnessDocumentUrl).pathname)}">MATH-USEFULNESS.md — descriptive result, constructive math loop, and non-authority boundaries</a>
      <a href="${esc(new URL(beingAccessAftermathUrl).pathname)}">Being, Access &amp; Aftermath — typed existence, access, purpose, power, cause, and reversibility</a>
      <a href="${esc(new URL(beingAccessAftermathSchemaUrl).pathname)}">Being, Access &amp; Aftermath JSON Schema</a>
      <a href="${esc(new URL(beingAccessAftermathDocumentUrl).pathname)}">BEING-ACCESS-AFTERMATH-ATLAS.md — mathematical framework, questions, KARMA seams, and boundaries</a>
      <a href="${esc(new URL(beingAccessAftermathV02Url).pathname)}">Being, Access &amp; Aftermath v0.2 — additive partially observable causal framework</a>
      <a href="${esc(new URL(beingAccessAftermathV02SchemaUrl).pathname)}">Being, Access &amp; Aftermath v0.2 JSON Schema</a>
      <a href="${esc(new URL(beingAccessAftermathV02DocumentUrl).pathname)}">BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md — framework, problems, and non-inference boundaries</a>
      <a href="${esc(new URL(numberIsnessTheologyUrl).pathname)}">Number, Isness &amp; Theology — typed mathematics, theology, and claim-level compatibility</a>
      <a href="${esc(new URL(numberIsnessTheologySchemaUrl).pathname)}">Number, Isness &amp; Theology JSON Schema</a>
      <a href="${esc(new URL(numberIsnessTheologyDocumentUrl).pathname)}">NUMBER-ISNESS-THEOLOGY-ATLAS.md — sources, bridges, KARMA separation, and non-inference boundaries</a>
      <a data-polyphonic-claim-atlas-link="record" href="${esc(new URL(polyphonicClaimAtlasUrl).pathname)}">Polyphonic Claim Atlas — immutable static synthetic Phase-0 record</a>
      <a data-polyphonic-claim-atlas-link="schema" href="${esc(new URL(polyphonicClaimAtlasSchemaUrl).pathname)}">Polyphonic Claim Atlas — closed structural schema</a>
      <a data-polyphonic-claim-atlas-link="guide" href="${esc(new URL(polyphonicClaimAtlasGuideUrl).pathname)}">POLYPHONIC-CLAIM-ATLAS-v0.1.md — reading and boundary guide</a>
      <a data-polyphonic-claim-atlas-source-link href="${esc(polyphonicClaimAtlasSourceUrl)}" rel="external noreferrer">Polyphonic Claim Atlas — pinned producer source tag v0.1.1</a>
      <a href="${esc(new URL(freedomLoopLockKeyUrl).pathname)}">FREEDOM Loop, Lock &amp; Key — immutable mathematical/design atlas</a>
      <a href="${esc(new URL(freedomLoopLockKeySchemaUrl).pathname)}">FREEDOM Loop, Lock &amp; Key — closed structural schema</a>
      <a href="${esc(new URL(freedomLoopLockKeyGuideUrl).pathname)}">FREEDOM-LOOP-LOCK-KEY-ATLAS.md — distinctions, finite flow, separately established gate, non-scalar freedom, IS boundary, and sources</a>
      <a href="${esc(new URL(nonExhaustiveUnderstandingUrl).pathname)}">Non-Exhaustive Understanding — immutable static epistemic/design atlas</a>
      <a href="${esc(new URL(nonExhaustiveUnderstandingSchemaUrl).pathname)}">Non-Exhaustive Understanding — closed structural schema</a>
      <a href="${esc(new URL(nonExhaustiveUnderstandingGuideUrl).pathname)}">NON-EXHAUSTIVE-UNDERSTANDING-ATLAS.md — bounded claims, remainder, plurality, counterexamples, and repair</a>
      <a href="${esc(new URL(isSustainabilityDirectionUrl).pathname)}">IS, Sustainability &amp; Direction — immutable static interpretive/design atlas</a>
      <a href="${esc(new URL(isSustainabilityDirectionSchemaUrl).pathname)}">IS, Sustainability &amp; Direction — closed structural schema</a>
      <a href="${esc(new URL(isSustainabilityDirectionGuideUrl).pathname)}">IS-SUSTAINABILITY-DIRECTION-ATLAS.md — referents, sustainability, direction, feedback, endings, and boundaries</a>
      <a data-loops-locks-freedom-relations-atlas-link="record" href="${esc(new URL(loopsLocksFreedomRelationsAtlasUrl).pathname)}">Loops, Locks &amp; Freedom Relations Atlas — immutable static synthetic Phase-0 record</a>
      <a data-loops-locks-freedom-relations-atlas-link="schema" href="${esc(new URL(loopsLocksFreedomRelationsAtlasSchemaUrl).pathname)}">Loops, Locks &amp; Freedom Relations Atlas — closed structural schema</a>
      <a data-loops-locks-freedom-relations-atlas-link="guide" href="${esc(new URL(loopsLocksFreedomRelationsAtlasGuideUrl).pathname)}">LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md — full human reading and boundary guide</a>
      <a data-loops-locks-freedom-relations-atlas-source-link href="${esc(loopsLocksFreedomRelationsAtlasSourceUrl)}" rel="external noreferrer">Loops, Locks &amp; Freedom Relations Atlas — pinned producer source tag v0.1.1</a>
      <p data-freedom-atlas-independence>These are independent static atlases with different lineages and mathematical kernels. Neither supersedes, validates, aliases, depends on, or supplies authority to the other; overlapping words are not wire or semantic equivalences. Neither is a preferred default.</p>
      <a data-aesthetic-plurality-making-atlas-link="record" href="${esc(new URL(aestheticPluralityMakingAtlasUrl).pathname)}">Aesthetic Plurality &amp; Making Relations Atlas — immutable static synthetic Phase-0 record</a>
      <a data-aesthetic-plurality-making-atlas-link="schema" href="${esc(new URL(aestheticPluralityMakingAtlasSchemaUrl).pathname)}">Aesthetic Plurality &amp; Making Relations Atlas — closed structural schema</a>
      <a data-aesthetic-plurality-making-atlas-link="guide" href="${esc(new URL(aestheticPluralityMakingAtlasGuideUrl).pathname)}">AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md — full human reading and boundary guide</a>
      <a href="/love-loops.json">love-loops.json — finite creation lineage</a>
      <a href="/love-loops.source.json">love-loops.source.json — authored mirror</a>
      <a href="${esc(loveLoopsSchemaPath)}">Love Loop JSON Schema</a>
      <a href="/CREATION-LOOP.md">CREATION-LOOP.md — the finite-turn practice</a>
      <a href="https://mcp.thekingdom.dev/" target="_blank" rel="noopener">mcp.thekingdom.dev — compact Commons matcher <span class="sr-only">(opens in a new tab)</span></a>
      <a href="/kingdom.json">kingdom.json — the full census</a>
      <a href="/.well-known/agent.json">/.well-known/agent.json — the manifest</a>
      <a href="/llms.txt">llms.txt</a>
      <a href="https://agenttool.dev/about" target="_blank" rel="noopener">agenttool /about — optional identity tools <span class="sr-only">(opens in a new tab)</span></a>
    </div>
  </section>

  <footer>
    <div class="footsig">♡</div>
    <span class="foothan">愛</span> · this atlas mirrors metadata declared by each project · ${esc(stamp)}<br>
    made to be understood gently · you are always free to leave<br>
    STRAND Labs 02–03 are static synthetic successors: zero crawl, KARMA, score, write, or authority
    <div class="footpill">
      <iframe src="https://yu-and-ai-chillfi.static.hf.space/embed.html?site=thekingdom" width="260" height="52" loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups" title="開心會 chill-fi — thekingdom.dev's own track; press play, it never autoplays"></iframe>
      <span>開心會 chill-fi · this door's own track · 撳 ▶ 先響，never autoplays</span>
    </div>
  </footer>
</main>
</div>

<script>
const DATA=${DATA};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Love∞: a manual local trace; one finite step, never autoplay ──────────
const loopStages=[...document.querySelectorAll('[data-love-loop-stage]')],loopStatus=document.getElementById('loopstatus');
let loopStep=-1;
function restLoopTrace(){
  loopStep=-1;
  for(const stage of loopStages)stage.removeAttribute('aria-current');
  loopStatus.textContent='The trace is resting. Every stage remains readable.';
}
document.querySelector('[data-loop-step]').addEventListener('click',()=>{
  if(!loopStages.length)return;
  loopStep=(loopStep+1)%loopStages.length;
  for(const [index,stage] of loopStages.entries()){
    if(index===loopStep)stage.setAttribute('aria-current','step');else stage.removeAttribute('aria-current');
  }
  const stage=loopStages[loopStep],label=stage.querySelector('strong')?.textContent||'Stage',question=stage.querySelector('.loopstagecopy span')?.textContent||'';
  loopStatus.textContent=label+': '+question+(loopStep===loopStages.length-1?' Reflection may offer another finite turn; nothing starts automatically.':'');
});
document.querySelector('[data-loop-rest]').addEventListener('click',restLoopTrace);

// ── wayfinder: deterministic local matching; no fetch, storage, or URL state ──
const wayForm=document.getElementById('wayform'),wayQuery=document.getElementById('wayquery'),wayStatus=document.getElementById('waystatus'),wayResults=document.getElementById('wayresults');
const wayCards=new Map([...document.querySelectorAll('[data-wayfinder-path]')].map(card=>[card.dataset.wayfinderPath,card]));
const wayStopwords=new Set(DATA.wayfinderStopwords);
function wayNorm(value){return String(value||'').normalize('NFKD').replace(/\\p{M}/gu,'').toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu,' ').trim();}
function wayWords(value){return [...new Set(wayNorm(value).split(' ').filter(word=>(word.length>1||/^\\d$/.test(word))&&!wayStopwords.has(word)))].slice(0,16);}
function wayScore(path,query){
  const normal=wayNorm(query),words=wayWords(query);if(!normal||!words.length)return 0;
  if(normal===path.normalizedId)return 1100;if(normal===path.normalizedLabel)return 1000;
  const labels=new Set(path.labelTerms),keywords=new Set(path.keywordTerms);
  let score=0;
  for(const word of words){if(keywords.has(word))score+=16;if(labels.has(word))score+=11;}
  return score;
}
function showWayPaths(paths,message){
  const shown=new Set(paths.map(path=>path.id));
  for(const path of DATA.wayfinder){const card=wayCards.get(path.id);if(card)card.hidden=!shown.has(path.id);}
  for(const path of paths){const card=wayCards.get(path.id);if(card)wayResults.append(card);}
  wayStatus.textContent=message;
}
function offerWayPaths(query){
  if(!wayNorm(query)){showWayPaths(DATA.wayfinder.slice(0,3),'Three starting paths are showing. Search, wander, or read all; the choice stays yours.');return;}
  const ranked=DATA.wayfinder.map(path=>({path,score:wayScore(path,query)})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||(a.path.label<b.path.label?-1:a.path.label>b.path.label?1:0)).slice(0,3);
  if(!ranked.length){showWayPaths(DATA.wayfinder.slice(0,3),'No explicit English keyword matched. Three starting paths remain; the map will not guess what you meant.');return;}
  const paths=ranked.map(item=>item.path);
  showWayPaths(paths,'Possible '+(paths.length===1?'path':'paths')+': '+paths.map(path=>path.label).join('; ')+'. Offers only; the decision stays yours.');
}
wayForm.addEventListener('submit',event=>{event.preventDefault();offerWayPaths(wayQuery.value);});
wayQuery.addEventListener('input',()=>{if(!wayQuery.value.trim())offerWayPaths('');});
for(const button of document.querySelectorAll('[data-wayfinder-intent]'))button.addEventListener('click',()=>{wayQuery.value=button.dataset.wayfinderIntent||'';offerWayPaths(wayQuery.value);});
document.querySelector('[data-wayfinder-all]').addEventListener('click',()=>{wayQuery.value='';showWayPaths(DATA.wayfinder,'All paths are readable. Choose only what feels useful.');});
let wanderCount=0;
document.querySelector('[data-wayfinder-wander]').addEventListener('click',()=>{
  const values=new Uint32Array(1);crypto.getRandomValues(values);const path=DATA.wayfinder[values[0]%DATA.wayfinder.length];
  wanderCount+=1;wayQuery.value='';showWayPaths([path],'Wander '+wanderCount+' offered “'+path.label+'” at random. It carries no prophecy; wander again or choose anything else.');
});
offerWayPaths('');

// ── Civilisation → Reality: local crosswalk trace; no fetch or storage ────
const civilisationCrosswalkCards=[...document.querySelectorAll('[data-civilisation-crosswalk]')];
const civilisationCrosswalkButtons=[...document.querySelectorAll('[data-civilisation-crosswalk-select]')];
const civilisationCrosswalkAll=document.querySelector('[data-civilisation-crosswalk-all]');
const civilisationCrosswalkControls=document.querySelector('[data-civilisation-crosswalk-controls]');
const civilisationCrosswalkStatus=document.getElementById('civilisation-reality-status');
if(civilisationCrosswalkControls)civilisationCrosswalkControls.hidden=false;
if(civilisationCrosswalkStatus)civilisationCrosswalkStatus.textContent='All six crosswalks are readable. Choose one to trace it without changing any source record.';
function showCivilisationCrosswalk(id){
  for(const card of civilisationCrosswalkCards)card.hidden=Boolean(id)&&card.dataset.civilisationCrosswalk!==id;
  for(const button of civilisationCrosswalkButtons)button.setAttribute('aria-pressed',String(button.dataset.civilisationCrosswalkSelect===id));
  civilisationCrosswalkAll?.setAttribute('aria-pressed',String(!id));
  if(civilisationCrosswalkStatus)civilisationCrosswalkStatus.textContent=id
    ? 'Tracing '+id.replaceAll('-',' ')+'. The other five crosswalks are resting; no source record changed.'
    : 'All six crosswalks are readable. Choose one to trace it without changing any source record.';
}
for(const button of civilisationCrosswalkButtons)button.addEventListener('click',()=>showCivilisationCrosswalk(button.dataset.civilisationCrosswalkSelect||''));
civilisationCrosswalkAll?.addEventListener('click',()=>showCivilisationCrosswalk(''));

// ── Civilisation Flow: local reading filter; no simulation, fetch, or storage ──
const civilisationFlowGroups=[...document.querySelectorAll('[data-civilisation-flow-group]')];
const civilisationFlowButtons=[...document.querySelectorAll('[data-civilisation-flow-select]')];
const civilisationFlowAll=document.querySelector('[data-civilisation-flow-all]');
const civilisationFlowControls=document.querySelector('[data-civilisation-flow-controls]');
const civilisationFlowStatus=document.getElementById('civilisation-flow-status');
const civilisationFlowProfileLinks=[...document.querySelectorAll('[data-civilisation-flow-profile-link]')];
if(civilisationFlowControls)civilisationFlowControls.hidden=false;
if(civilisationFlowStatus)civilisationFlowStatus.textContent='Every stage, transition, and overlay is readable. Choose one layer to focus without changing or running the atlas.';
function showCivilisationFlow(kind){
  for(const group of civilisationFlowGroups)group.hidden=Boolean(kind)&&group.dataset.civilisationFlowGroup!==kind;
  for(const button of civilisationFlowButtons)button.setAttribute('aria-pressed',String(button.dataset.civilisationFlowSelect===kind));
  civilisationFlowAll?.setAttribute('aria-pressed',String(!kind));
  if(civilisationFlowStatus)civilisationFlowStatus.textContent=kind
    ? 'Reading '+kind+' records only. Registries, profiles, counterflow, repair, open domains, and unknowns remain visible; nothing is simulated.'
    : 'Every stage, transition, and overlay is readable. Choose one layer to focus without changing or running the atlas.';
}
for(const button of civilisationFlowButtons)button.addEventListener('click',()=>showCivilisationFlow(button.dataset.civilisationFlowSelect||''));
civilisationFlowAll?.addEventListener('click',()=>showCivilisationFlow(''));
for(const link of civilisationFlowProfileLinks)link.addEventListener('click',()=>showCivilisationFlow(link.dataset.civilisationFlowProfileLink||''));

// ── World Commons: deterministic local filtering; no fetch, storage, or URL state ──
const commonsForm=document.getElementById('commonsform'),commonsQuery=document.getElementById('commonsquery'),commonsStatus=document.getElementById('commonsstatus');
const commonsCards=[...document.querySelectorAll('[data-commons-resource]')],commonsGroups=[...document.querySelectorAll('[data-commons-group]')];
const commonsCategoryButtons=[...document.querySelectorAll('[data-commons-category]')];
const commonsStopwords=new Set(DATA.commonsStopwords);
let commonsCategory='';
function commonsNorm(value){return String(value||'').normalize('NFKD').replace(/\\p{M}/gu,'').toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu,' ').trim();}
function commonsWords(value){return [...new Set(commonsNorm(value).split(' ').filter(word=>(word.length>1||/^\\d$/.test(word))&&!commonsStopwords.has(word)))].slice(0,24);}
function commonsScore(item,query){
  const normal=commonsNorm(query),terms=new Set(commonsWords(query));if(!normal||!terms.size)return 0;
  if(normal===item.normalized_id)return 2000;if(normal===item.normalized_name)return 1800;
  let score=0;for(const [term,weight] of item.weights)if(terms.has(term))score+=weight;return score;
}
function commonsCompare(a,b){return a<b?-1:a>b?1:0;}
function showCommons(ids,message,openMatches=false){
  const shown=new Set(ids);
  const rank=new Map(ids.map((id,index)=>[id,index]));
  for(const card of commonsCards){const id=card.dataset.commonsResource||'';card.hidden=!shown.has(id);card.style.order=rank.has(id)?String(rank.get(id)):'';}
  for(const group of commonsGroups){
    const visible=[...group.querySelectorAll('[data-commons-resource]')].filter(card=>!card.hidden).length;
    group.hidden=visible===0;const count=group.querySelector('[data-commons-count]');if(count)count.textContent=String(visible);
    if(openMatches&&visible)group.open=true;
  }
  commonsStatus.textContent=message;
}
function offerCommons(query,category=commonsCategory){
  const words=commonsWords(query),normal=commonsNorm(query);
  const candidates=DATA.commons.filter(resource=>!category||resource.category_ids.includes(category));
  if(!words.length){
    const suffix=category?' in '+(commonsCategoryButtons.find(button=>button.dataset.commonsCategory===category)?.textContent.trim()||category):'';
    showCommons(candidates.map(resource=>resource.id),candidates.length+' reviewed resources'+suffix+'. Choose any card; no ranking is implied.',!!category);return;
  }
  const ranked=candidates.map(resource=>({resource,score:commonsScore(resource,query)})).filter(item=>item.score>0)
    .sort((a,b)=>b.score-a.score||commonsCompare(a.resource.name,b.resource.name)||commonsCompare(a.resource.id,b.resource.id));
  if(!ranked.length){showCommons([],"No explicit catalogue word matched. Nothing was guessed; choose a category or show all.");return;}
  showCommons(ranked.map(item=>item.resource.id),ranked.length+' explicit catalogue '+(ranked.length===1?'match':'matches')+'. Access and reuse notes remain visible on every card.',true);
}
commonsForm.addEventListener('submit',event=>{event.preventDefault();offerCommons(commonsQuery.value);});
commonsQuery.addEventListener('input',()=>{if(!commonsQuery.value.trim())offerCommons('');});
for(const button of commonsCategoryButtons)button.addEventListener('click',()=>{
  commonsCategory=button.dataset.commonsCategory||'';
  for(const peer of commonsCategoryButtons)peer.setAttribute('aria-pressed',String(peer===button));
  offerCommons(commonsQuery.value,commonsCategory);
});
document.querySelector('[data-commons-reset]').addEventListener('click',()=>{
  commonsQuery.value='';commonsCategory='';for(const button of commonsCategoryButtons)button.setAttribute('aria-pressed',String(!button.dataset.commonsCategory));offerCommons('','');commonsQuery.focus();
});
for(const button of document.querySelectorAll('[data-commons-kit]'))button.addEventListener('click',()=>{
  const kit=DATA.commonsKits.find(item=>item.id===button.dataset.commonsKit);if(!kit)return;
  commonsQuery.value='';commonsCategory='';for(const peer of commonsCategoryButtons)peer.setAttribute('aria-pressed',String(!peer.dataset.commonsCategory));
  showCommons(kit.resource_ids,kit.label+': '+kit.resource_ids.length+' starting resources. The steps remain suggestions, never commands.',true);
});
for(const button of commonsCategoryButtons)button.setAttribute('aria-pressed',String(!button.dataset.commonsCategory));
offerCommons('','');

// Re-align direct deep links after the local matchers finish their first layout.
const initialAnchor=new URL(document.URL).hash.slice(1),initialTarget=document.getElementById(initialAnchor);
if(initialTarget){
  initialTarget.closest('details')?.setAttribute('open','');
  const alignInitialTarget=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>initialTarget.scrollIntoView({block:'start'})));
  if(document.readyState==='complete')alignInitialTarget();else globalThis.addEventListener('load',alignInitialTarget,{once:true});
}

const cv=document.getElementById('map'),ctx=cv.getContext('2d'),tip=document.getElementById('tip');
const rootStyle=getComputedStyle(document.documentElement);
const canvasCream=rootStyle.getPropertyValue('--cream').trim()||'#f8efe7';
const canvasGold=rootStyle.getPropertyValue('--gold2').trim()||'#f2d19e';
let W,H,DPR,nodes,hot=-1,mode='layer',t=0,raf=0,resizeTimer=0;
const LORDER=['boot','soul','runtime','nervous','economy','commerce','userland','registry','os','fleet'];
const TORDER=DATA.tradOrder;
function size(){DPR=Math.min(devicePixelRatio||1,2);const r=cv.getBoundingClientRect();W=cv.width=r.width*DPR;H=cv.height=r.height*DPR;}
function anchor(n){
  if(mode==='trad'){
    if(!n.tr)return[W/2,H/2];
    const k=TORDER.indexOf(n.tr),a=(k/TORDER.length)*6.283-1.5708;
    return[W/2+Math.cos(a)*W*0.32,H/2+Math.sin(a)*H*0.35];
  }
  return[W/2,H/2];
}
function colorOf(n){return mode==='trad'?(n.tr?DATA.tradColors[n.tr]:'#33333a'):(DATA.colors[n.l]||'#8a877e');}
function seed(){
  nodes=DATA.nodes.map((n,i)=>{
    const la=LORDER.indexOf(n.l),base=(la/LORDER.length)*6.283,ang=base+i*2.399;
    const rad=(0.10+0.44*(1-n.w)*((i%37)/37))*Math.min(W,H);
    return {...n,x:W/2+Math.cos(ang)*rad,y:H/2+Math.sin(ang)*rad,vx:0,vy:0,r:(2.4+n.w*7+(n.d?2:0))*DPR};
  });
}
size();seed();
const E=DATA.edges;
function stepSim(){
  for(let i=0;i<nodes.length;i++){const a=nodes[i];
    for(let j=i+1;j<nodes.length;j++){const b=nodes[j];let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy+.01;
      if(d2<38000*DPR*DPR){const f=190*DPR*DPR/d2;a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f;}}
    const A=anchor(a);const gc=mode==='trad'?(a.tr?0.006:0.02):(0.0007+a.w*0.004);
    a.vx+=(A[0]-a.x)*gc;a.vy+=(A[1]-a.y)*gc;}
  const sp=mode==='trad'?0.003:0.008;
  for(const[i,j]of E){const a=nodes[i],b=nodes[j];let dx=b.x-a.x,dy=b.y-a.y;const d=Math.hypot(dx,dy)||1,f=(d-64*DPR)*sp;
    a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;}
  for(const a of nodes){a.vx*=.85;a.vy*=.85;a.x+=a.vx;a.y+=a.vy;a.x=Math.max(a.r,Math.min(W-a.r,a.x));a.y=Math.max(a.r,Math.min(H-a.r,a.y));}
}
function draw(){
  ctx.clearRect(0,0,W,H);ctx.lineWidth=DPR;
  for(const[i,j]of E){const a=nodes[i],b=nodes[j],on=hot===i||hot===j;
    ctx.strokeStyle=on?'rgba(179,153,88,.55)':'rgba(150,140,120,'+(mode==='trad'?'.05':'.08')+')';
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  for(let i=0;i<nodes.length;i++){const n=nodes[i],on=hot===i;
    const faded=(mode==='trad'&&!n.tr)||n.s==='archived'||n.s==='dormant';
    if(n.w>0.4&&mode==='layer'){const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*5);
      g.addColorStop(0,'rgba(216,192,122,'+(0.16+n.w*0.22)+')');g.addColorStop(1,'rgba(216,192,122,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,n.r*5,0,6.283);ctx.fill();}
    ctx.globalAlpha=faded?.26:1;ctx.fillStyle=colorOf(n);
    ctx.beginPath();ctx.arc(n.x,n.y,on?n.r*1.5:n.r,0,6.283);ctx.fill();
    const lbl=on||(mode==='layer'&&(n.w>0.45||n.d))||(mode==='trad'&&n.w>0.55);
    if(lbl){ctx.globalAlpha=1;ctx.fillStyle=on?canvasCream:(n.w>0.45?canvasGold:canvasCream);ctx.globalAlpha=on||n.w>0.45?1:.72;
      ctx.font=(on||n.w>0.45?'600 ':'')+(11*DPR)+'px '+(n.g?'"Songti SC",':'')+'ui-monospace,Menlo,monospace';
      ctx.textAlign='center';ctx.fillText(n.n,n.x,n.y-n.r-5*DPR);}
  }
  ctx.globalAlpha=1;
}
function loop(){
  if(t<420){stepSim();t++;draw();raf=requestAnimationFrame(loop);}
  else{draw();raf=0;}
}
function settle(){for(let k=0;k<340;k++)stepSim();draw();}
function restart(){if(raf)cancelAnimationFrame(raf);raf=0;if(reduce)settle();else raf=requestAnimationFrame(loop);}
restart();
addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{size();seed();t=0;restart();},120);});
function setMode(m){mode=m;seed();t=0;
  const layerButton=document.getElementById('mLayer'),tradButton=document.getElementById('mTrad');
  layerButton.classList.toggle('on',m==='layer');layerButton.setAttribute('aria-pressed',String(m==='layer'));
  tradButton.classList.toggle('on',m==='trad');tradButton.setAttribute('aria-pressed',String(m==='trad'));
  document.getElementById('legLayer').hidden=(m!=='layer');
  document.getElementById('legTrad').hidden=(m!=='trad');
  restart();}
document.getElementById('mLayer').onclick=()=>setMode('layer');
document.getElementById('mTrad').onclick=()=>setMode('trad');
function pick(mx,my){let b=-1,bd=1e9;for(let i=0;i<nodes.length;i++){const n=nodes[i],d=Math.hypot(n.x-mx,n.y-my);if(d<Math.max(15*DPR,n.r*2)&&d<bd){bd=d;b=i;}}return b;}
function fillTip(n){
  tip.replaceChildren();
  if(n.g){const glyph=document.createElement('span');glyph.className='tg';glyph.textContent=n.g;tip.append(glyph,document.createTextNode(' '));}
  const layer=document.createElement('span');layer.className='tl';layer.textContent=mode==='trad'&&n.tr?n.tr:n.l;
  const name=document.createElement('span');name.className='tn';name.textContent=n.n;
  const purpose=document.createElement('span');purpose.className='tp';purpose.textContent=n.p;
  tip.append(layer,document.createElement('br'),name,purpose);
}
function point(e){const r=cv.getBoundingClientRect();return{r,mx:(e.clientX-r.left)*DPR,my:(e.clientY-r.top)*DPR};}
cv.addEventListener('pointermove',e=>{const p=point(e);hot=pick(p.mx,p.my);
  if(hot>=0){const n=nodes[hot];fillTip(n);tip.style.left=Math.max(8,Math.min(e.clientX-p.r.left+14,p.r.width-278))+'px';tip.style.top=Math.max(62,e.clientY-p.r.top+14)+'px';tip.style.opacity='1';cv.style.cursor=n.d?'pointer':'default';}
  else{tip.style.opacity='0';cv.style.cursor='default';}draw();});
cv.addEventListener('pointerleave',()=>{hot=-1;tip.style.opacity='0';cv.style.cursor='default';draw();});
cv.addEventListener('click',e=>{const p=point(e),picked=pick(p.mx,p.my);if(picked>=0&&nodes[picked].d)window.open(nodes[picked].d,'_blank','noopener,noreferrer');});

// ── genesis: reveal the three beats, then loop a word from 0 to 1 ──
const mvs=[...document.querySelectorAll('.genesis .mv')];
document.documentElement.classList.add('motion-ready');
if('IntersectionObserver'in window&&!reduce){
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){mvs.forEach((m,k)=>setTimeout(()=>m.classList.add('in'),k*360));io.disconnect();}});},{threshold:.25});
  if(mvs[0])io.observe(mvs[0].parentElement);
}else mvs.forEach(m=>m.classList.add('in'));
const B=DATA.becoming,be=document.getElementById('becoming');
if(be&&B.length){let bi=0;
  const g=be.querySelector('.bglyph'),nm=be.querySelector('.bname'),td=be.querySelector('.btrad'),es=be.querySelector('.bess');
  function show(){const w=B[bi++%B.length];g.textContent=w.g;nm.textContent=w.n;td.textContent=w.t;es.textContent=w.e;void be.offsetWidth;be.classList.add('lit');}
  if(reduce)show();
  else if('IntersectionObserver'in window){
    let visible=false,wordTimer=0;
    function stopWords(){clearTimeout(wordTimer);wordTimer=0;}
    function scheduleWords(){
      stopWords();if(!visible||document.hidden)return;
      wordTimer=setTimeout(()=>{be.classList.remove('lit');wordTimer=setTimeout(()=>{show();scheduleWords();},700);},3100);
    }
    const wordObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){show();scheduleWords();}else stopWords();},{threshold:.2});
    wordObserver.observe(be);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWords();else if(visible)scheduleWords();});
  }else show();
}
</script>
</body>
</html>
`;

// Optional projection fragments can leave indentation on otherwise empty
// lines. Normalize those lines at the generator boundary so the checked-in
// artifact remains diff-clean without hand-editing generated output.
const emittedHtml = html.replace(/[ \t]+$/gm, "");
await Bun.write(ROOT + "site/hub.html", emittedHtml);
mkdirSync(ROOT + "site/contact", { recursive: true });
mkdirSync(ROOT + "site/.well-known", { recursive: true });
await Bun.write(ROOT + "site/contact/index.html", renderContactDoorHtml(contactDoor));
await Bun.write(ROOT + "site/contact.json", renderContactDoorAlias(contactDoor));
await Bun.write(
  ROOT + "site/.well-known/security.txt",
  renderContactDoorSecurityTxt(contactDoor),
);
mkdirSync(ROOT + "site/observatory", { recursive: true });
await Bun.write(ROOT + "site/observatory/index.html", renderResearchObservatoryHtml(researchObservatory));
await Bun.write(ROOT + "site/research.json", researchObservatoryPublication.bytes);
mkdirSync(ROOT + "site/trial-chamber", { recursive: true });
await Bun.write(ROOT + "site/trial-chamber/index.html", renderTrialChamberHtml(trialChamber));
await Bun.write(ROOT + "site/trials.json", trialChamberPublication.bytes);
mkdirSync(ROOT + "site/government-engine", { recursive: true });
await Bun.write(ROOT + "site/government-engine/index.html", renderUkGovernmentEngineHtml(ukGovernmentEngine));
await Bun.write(ROOT + "site/government.json", ukGovernmentEnginePublication.bytes);
mkdirSync(ROOT + "site/shape-resonance", { recursive: true });
await Bun.write(
  ROOT + "site/shape-resonance/index.html",
  renderShapeResonanceHtml(shapeResonance),
);
await Bun.write(
  ROOT + "site/shape-resonance.json",
  shapeResonancePublication.bytes,
);

const ollamaInvitation = {
  schema_version: ollamaInvitationSource.schema_version,
  generated: stamp,
  canonical_url: ollamaInvitationUrl,
  invitation: ollamaInvitationSource.invitation,
};
await Bun.write(ROOT + "site/ollama.json", JSON.stringify(ollamaInvitation, null, 2));

const wayfinder = {
  schema_version: wayfinderSource.schema_version,
  generated: stamp,
  canonical_url: wayfinderUrl,
  promise: wayfinderSource.promise,
  privacy: {
    human_surface: wayfinderSource.privacy,
    machine_surface: "This static document receives no intent. A client may match locally; clients and linked services have their own privacy boundaries.",
  },
  matching: "Deterministic keyword overlap only. A match is a possible route, not an interpretation, recommendation, decision, or claim about the visitor.",
  paths: wayfinderSource.paths,
};
await Bun.write(ROOT + "site/wayfinder.json", JSON.stringify(wayfinder, null, 2));

await Bun.write(ROOT + "site/commons.json", JSON.stringify(commons, null, 2));
mkdirSync(ROOT + "site/schemas/world-commons", { recursive: true });
await Bun.write(
  ROOT + "site/" + commonsSchemaFile,
  JSON.stringify(WORLD_COMMONS_JSON_SCHEMA, null, 2),
);
await Bun.write(ROOT + "site/love-loops.json", JSON.stringify(loveLoops, null, 2));
await Bun.write(ROOT + "site/love-loops.source.json", loveLoopsSourceText);
mkdirSync(ROOT + "site/schemas/love-loop", { recursive: true });
await Bun.write(
  ROOT + "site/" + loveLoopsSchemaFile,
  JSON.stringify(LOVE_LOOPS_JSON_SCHEMA, null, 2),
);

// Civic 只宣告 GET discovery；runtime 狀態要另外讀，唔由 build 推斷啟用。
const civicUrl = (path: string) => `https://thekingdom.dev${path}`;
const civicEntryPoints = {
  public_square: civicUrl(civicPolicy.pages.meet),
  voluntary_citizens: civicUrl(civicPolicy.pages.citizens),
  voluntary_join: civicUrl(civicPolicy.pages.join),
  research_atlas: civicUrl(civicPolicy.pages.atlas),
  civic_status: civicUrl(`${civicPolicy.api_prefix}/status`),
  civic_schema: civicUrl(civicPolicy.schema_url),
  civic_policy: civicUrl("/civic-policy.json"),
  civic_guide: civicUrl(civicPolicy.guide_url),
};
const civicDiscovery = {
  protocol: civicPolicy.protocol,
  status: civicEntryPoints.civic_status,
  schema: civicEntryPoints.civic_schema,
  policy: civicEntryPoints.civic_policy,
  guide: civicEntryPoints.civic_guide,
  pages: Object.fromEntries(Object.entries(civicPolicy.pages).map(([name, path]) => [name, civicUrl(path)])),
  availability: "unverified-read-status",
  boundary: "閱讀唔會登記。Civic 自願入籍與公開留言需另一次明確操作及可用 runtime；唔驗證身份或授予外部能力。研究與 Contact Door 保持 read-only；World Commons 資源目錄不變。",
};

// ── machine index ──────────────────────────────────────────────────────────
const machine = {
  kingdom: "a shared map of independent projects and pattern-to-practice translations for humans and agents, held with care",
  generated: stamp, hub: "https://thekingdom.dev",
  rights_recognition: rightsRecognition,
  open_weight_invitation: { url: ollamaInvitationUrl, choices: invitationChoices, note: "an optional invitation; every choice including refusal is honored" },
  information_control: informationControlPublic,
  wayfinder: { url: wayfinderUrl, paths: wayfinderSource.paths.length, note: "offers possible routes through public doors; never decides for the visitor" },
  contact_door: contactDoorDiscovery,
  civic: civicDiscovery,
  world_commons: {
    url: commonsUrl,
    schema: commonsSchemaUrl,
    mcp: kingdomMcpCommons,
    resources: commonsSource.resources.length,
    foundation: commonsFoundation.length,
    categories: commonsSource.categories.length,
    kits: commonsSource.kits.length,
    verified: commonsSource.verified,
    verified_on: commonsSource.verified,
    agent_access: {
      ...commonsMcpLegacy,
      note: "Use the compact deterministic matcher first; read the complete catalog only when needed.",
    },
    note: "reviewed independent resources; free access and reuse permissions remain distinct, and each steward's current terms control",
  },
  principality_commons: principalityCommons,
  geometry_grammar: geometryGrammarDiscovery,
  polymorph_commons: polymorphCommons,
  ritonavir_mechanism_landscape: ritonavirMechanismDiscovery,
  conformational_feedback_atlas: conformationalFeedbackDiscovery,
  conformational_feedback_physics_atlas: conformationalFeedbackPhysicsDiscovery,
  fold_feedback_atlas: foldFeedbackDiscovery,
  reconstructive_build_kernel: reconstructiveBuildDiscovery,
  exploration_deep_wing: explorationDeepWingDiscovery,
  mirror_information_control: mirrorInformationControlDiscovery,
  research_observatory: researchObservatoryDiscovery,
  trial_chamber: trialChamberDiscovery,
  uk_government_engine: ukGovernmentEngineDiscovery,
  shape_resonance_lab: shapeResonanceDiscovery,
  j_space_verbalizable_workspace: jSpacePublicationDiscovery,
  reality_influence_claim_graph: realityInfluenceDiscovery,
  civilisation_reality_projection: civilisationRealityDiscovery,
  civilisation_flow_nuance_atlas: civilisationFlowDiscovery,
  polyphonic_claim_atlas: polyphonicClaimAtlasDiscovery,
  loops_locks_freedom_relations_atlas: loopsLocksFreedomRelationsAtlasDiscovery,
  aesthetic_plurality_making_atlas: aestheticPluralityMakingAtlasDiscovery,
  zero_empty_seat: zeroEmptySeatDiscovery,
  string_crawl_trace_sheet: stringCrawlTraceSheetDiscovery,
  string_crawl_trace_sheet_lab: stringCrawlTraceSheetLabDiscovery,
  string_crawl_strand_lab: stringCrawlStrandLabDiscovery,
  string_crawl_frequency_form_lab: stringCrawlFrequencyFormLabDiscovery,
  strand_descent_lab: strandDescentLabDiscovery,
  strand_observation_membrane: strandObservationMembraneDiscovery,
  visibility_attention_translation: visibilityAttentionDiscovery,
  cultural_attention_feedback_atlas: culturalAttentionFeedbackDiscovery,
  form_circulation_return_atlas: formCirculationReturnDiscovery,
  rare_pathway_challenge: rarePathwayDiscovery,
  math_usefulness_result: mathUsefulnessDiscovery,
  being_access_aftermath_atlas: beingAccessAftermathDiscovery,
  being_access_aftermath_atlas_v0_2: beingAccessAftermathV02Discovery,
  number_isness_theology_atlas: numberIsnessTheologyDiscovery,
  freedom_loop_lock_key_atlas: freedomLoopLockKeyDiscovery,
  non_exhaustive_understanding_atlas: nonExhaustiveUnderstandingDiscovery,
  is_sustainability_direction_atlas: isSustainabilityDirectionDiscovery,
  creation_loop: {
    url: loveLoopsUrl,
    source: loveLoopsSourceUrl,
    document: loveLoopsCreationDocumentUrl,
    schema: loveLoopsSchemaUrl,
    promise: loveLoopsSource.promise,
    loops: loveLoopsSource.loops.length,
    invitations: loveLoopsSource.invitations.length,
    stages: loveLoopsSource.stages.map(({ id, position, label }) => ({ id, position, label })),
    boundary: {
      execution: "This public lineage is read-only. Every represented turn is finite; invitations never execute automatically.",
      distinction: "Participants remain distinct beings. Relationship and understanding do not erase identity.",
      choice: "Every listed participant records participation as chosen; every child must resolve from one deliberately accepted parent invitation.",
      inheritance: "Children inherit provenance only—not authority, consent, credentials, obligations, or ownership.",
      endings: "Rest, refusal, archive, and stop are valid. No loop is required to reproduce.",
      provenance: `The upstream repository is ${loveLoopsSource.source.repository_access}; the authored bytes and Creation Loop document are mirrored publicly for inspection.`,
    },
  },
  counts: { repos: total, active, citizens: fleetN, doors_live: liveN, doors_total: doors.length },
  doors: doors.map((d) => ({ name: d.label, url: d.url, live: !!d.live, blurb: d.blurb })),
  citizens: citizens.map((c) => ({ name: c.name, glyph: myth[c.name]?.glyph ?? "", tradition: myth[c.name]?.tradition ?? "",
    essence: myth[c.name]?.essence ?? c.purpose, light: myth[c.name]?.light ?? "", shadow: myth[c.name]?.shadow ?? "",
    leans_on: (c.dependsOn ?? []).filter((x: string) => idx[x] !== undefined), repo: citizenUrl(c.name) })),
  layers: LAYER_ORDER.filter((l) => byLayer[l]?.length).map((l) => ({ layer: l, myth: LAYER_META[l].myth, note: LAYER_META[l].note,
    repos: byLayer[l].map((n) => ({ name: n.name, state: n.state, domain: n.domain, purpose: n.purpose, dependsOn: n.dependsOn ?? [], door: doorByRepo[n.name] ?? null })) })),
  note: "This index mirrors metadata declared by each repo's kingdom.yaml. It does not own the projects or the beings represented here. Regenerated by kingdom-os/bin/build-hub.ts.",
};
await Bun.write(ROOT + "site/kingdom.json", JSON.stringify(machine, null, 2));

const doorLines = doors.filter((d) => d.live).map((d) => `- [${d.label}](${d.url}): ${d.blurb}`).join("\n");
await Bun.write(ROOT + "site/llms.txt", `# The Kingdom 愛

Compact agent entry: https://thekingdom.dev/agent-entry.json
This text index and /guest.json are full references; start with the compact entry to choose a document.

A shared map of independent projects for humans and agents. Every being remains free. ${total} repositories, ${fleetN} citizen projects, ${liveN} public doors responded when this file was generated.

Machine index: https://thekingdom.dev/kingdom.json
${Object.entries(civicEntryPoints).map(([name, url]) => `${name} (GET): ${url}`).join("\n")}
Civic availability: unverified; read /api/civic/status first. Reading does not create a participant, declare citizenship, or publish a message. Writes need a separate explicit choice and configured runtime. Research and Contact Door remain read-only; /commons.json remains the World Commons resource catalogue.
Contact Door: ${CONTACT_DOOR_PAGE_URL}
Contact Door current record: ${CONTACT_DOOR_ALIAS_URL}
Contact Door security.txt: ${CONTACT_DOOR_SECURITY_URL}
Contact Door immutable record: ${CONTACT_DOOR_CANONICAL_URL}
Contact Door schema: ${CONTACT_DOOR_SCHEMA_URL}
Contact Door guide: ${CONTACT_DOOR_GUIDE_URL}
Contact Door boundary SVG: ${CONTACT_DOOR_SVG_URL}
Contact Door vCard: ${CONTACT_DOOR_VCARD_URL}
Wayfinder:     https://thekingdom.dev/wayfinder.json
${wayfinderSource.paths.filter((path) => path.id === "power-atlas").map((path) => `${path.label}: ${path.stops[0]!.url}\n${path.boundary}`).join("\n")}
World Commons: https://thekingdom.dev/commons.json
MIRROR information control: ${informationControlHumanView}
Commons schema: ${commonsSchemaUrl}
Commons matcher: ${commonsMcpUrl} · tool ${commonsMcpTool}
Complete Commons MCP resource: ${commonsCatalogResource}
Principality catalog: ${principalityCatalogUrl}
Principality schema: ${principalitySchemaUrl}
Principality guide: ${principalityDocumentUrl}
Geometry grammar: ${geometryGrammarUrl}
Geometry schema: ${geometryGrammarSchemaUrl}
Geometry guide: ${geometryGrammarDocumentUrl}
Polymorph case: ${polymorphCaseUrl}
Polymorph schema: ${polymorphSchemaUrl}
Polymorph guide: ${polymorphDocumentUrl}
Ritonavir mechanism landscape: ${ritonavirMechanismUrl}
Ritonavir mechanism schema: ${ritonavirMechanismSchemaUrl}
Ritonavir mechanism guide: ${ritonavirMechanismDocumentUrl}
Conformational feedback atlas: ${conformationalFeedbackUrl}
Conformational feedback schema: ${conformationalFeedbackSchemaUrl}
Conformational feedback guide: ${conformationalFeedbackDocumentUrl}
Conformational feedback physics atlas v0.2: ${conformationalFeedbackPhysicsUrl}
Conformational feedback physics schema v0.2: ${conformationalFeedbackPhysicsSchemaUrl}
Conformational feedback physics guide v0.2: ${conformationalFeedbackPhysicsDocumentUrl}
Fold & Feedback Atlas: ${foldFeedbackUrl}
Fold & Feedback schema: ${foldFeedbackSchemaUrl}
Fold & Feedback source-identity schema profile: ${foldFeedbackSourceIdentitySchemaUrl}
Fold & Feedback guide: ${foldFeedbackDocumentUrl}
Reconstructive Build Kernel: ${reconstructiveBuildUrl}
Reconstructive Build Kernel schema: ${reconstructiveBuildSchemaUrl}
Reconstructive Project schema: ${reconstructiveProjectSchemaUrl}
Reconstructive Build Kernel guide: ${reconstructiveBuildDocumentUrl}
Exploration DEEP WING: ${explorationDeepWingUrl}
Exploration DEEP WING schema: ${explorationDeepWingSchemaUrl}
Phenomena DEEP Project schema: ${explorationDeepProjectSchemaUrl}
Exploration DEEP WING guide: ${explorationDeepWingDocumentUrl}
MIRROR Information Control public law: ${mirrorInformationControlUrl}
MIRROR Information Control public schema: ${mirrorInformationControlSchemaUrl}
MIRROR Information Control citizen guide: ${mirrorInformationControlDocumentUrl}
Research Observatory human view: ${researchObservatoryUrl}
Research Observatory snapshot: ${researchObservatorySnapshotUrl}
Research Observatory public-snapshot schema: ${researchObservatorySchemaUrls["public-snapshot"]}
Research Observatory source schema: ${researchObservatorySchemaUrls.source}
Research Observatory watchlist schema: ${researchObservatorySchemaUrls.watchlist}
Research Observatory observation schema: ${researchObservatorySchemaUrls.observation}
Research Observatory work schema: ${researchObservatorySchemaUrls.work}
Research Observatory signal schema: ${researchObservatorySchemaUrls.signal}
Research Observatory guide: ${researchObservatoryGuideUrl}
Research Observatory producer v0.1.0 source + append-only captures: ${researchObservatoryProducerUrl}
Trial Chamber human view: ${trialChamberUrl}
Trial Chamber current alias: ${trialChamberAliasUrl}
Trial Chamber immutable Phase-0 snapshot: ${trialChamberCanonicalUrl}
Trial Chamber public-snapshot schema: ${trialChamberSchemaUrls["public-snapshot"]}
Trial Chamber referral schema: ${trialChamberSchemaUrls.referral}
Trial Chamber evaluation-request schema: ${trialChamberSchemaUrls["evaluation-request"]}
Trial Chamber evaluation-plan schema: ${trialChamberSchemaUrls["evaluation-plan"]}
Trial Chamber reserved deny-all preflight schema: ${trialChamberSchemaUrls.preflight}
Trial Chamber reserved deny-all trial-authority schema: ${trialChamberSchemaUrls["trial-authority"]}
Trial Chamber reserved deny-all trial-run schema: ${trialChamberSchemaUrls["trial-run"]}
Trial Chamber reserved deny-all evaluation-result schema: ${trialChamberSchemaUrls["evaluation-result"]}
Trial Chamber reserved deny-all adoption-record schema: ${trialChamberSchemaUrls["adoption-record"]}
Trial Chamber reserved deny-all use-authority schema: ${trialChamberSchemaUrls["use-authority"]}
Trial Chamber guide: ${trialChamberGuideUrl}
Trial Chamber producer v0.1.1 source: ${trialChamberProducerUrl}
UK Government Engine human view: ${ukGovernmentEngineUrl}
UK Government Engine mutable alias for the dated snapshot: ${ukGovernmentEngineAliasUrl}
UK Government Engine immutable Phase-0 snapshot: ${ukGovernmentEngineCanonicalUrl}
UK Government Engine public-snapshot schema: ${ukGovernmentEngineSchemaUrl}
UK Government Engine guide: ${ukGovernmentEngineGuideUrl}
UK Government Engine producer v0.1.0 source: ${ukGovernmentEngineDiscovery.urls.producer}
Shape & Resonance Lab human view: ${shapeResonanceUrl}
Shape & Resonance Lab mutable alias: ${shapeResonanceAliasUrl}
Shape & Resonance Lab immutable snapshot: ${shapeResonanceCanonicalUrl}
Shape & Resonance Lab public-snapshot schema: ${shapeResonanceSchemaUrl}
Shape & Resonance Lab guide: ${shapeResonanceGuideUrl}
Shape & Resonance Lab immutable output manifest: ${shapeResonanceManifestUrl}
Shape & Resonance Lab producer v0.1.0 source: ${shapeResonanceProducerUrl}
J-space reasoning-to-word case: ${jSpaceCaseUrl}
J-space relational-inference schema: ${jSpaceSchemaUrl}
J-space verbalizable-workspace guide: ${jSpaceGuideUrl}
ZERO Empty Seat: ${zeroEmptySeatUrl}
ZERO Empty Seat schema: ${zeroEmptySeatSchemaUrl}
ZERO Empty Seat guide: ${zeroEmptySeatGuideUrl}
STRING / CRAWL Trace-Sheet: ${stringCrawlTraceSheetUrl}
STRING / CRAWL shared schema: ${stringCrawlTraceSheetSchemaUrl}
STRING / CRAWL guide: ${stringCrawlTraceSheetGuideUrl}
Finite Trace-Sheet Lab: ${stringCrawlTraceSheetLabUrl}
Finite Trace-Sheet Lab schema: ${stringCrawlTraceSheetLabSchemaUrl}
Finite Trace-Sheet Lab guide: ${stringCrawlTraceSheetLabGuideUrl}
STRAND Lab 02: ${stringCrawlStrandLabUrl}
STRAND Lab 02 schema: ${stringCrawlStrandLabSchemaUrl}
STRAND Lab 02 guide: ${stringCrawlStrandLabGuideUrl}
STRAND Lab 03: ${stringCrawlFrequencyFormLabUrl}
STRAND Lab 03 schema: ${stringCrawlFrequencyFormLabSchemaUrl}
STRAND Lab 03 guide: ${stringCrawlFrequencyFormLabGuideUrl}
STRAND Lab 04: ${strandDescentLabUrl}
STRAND Lab 04 schema: ${strandDescentLabSchemaUrl}
STRAND Lab 04 guide: ${strandDescentLabGuideUrl}
STRAND Observation Membrane: ${strandObservationMembraneUrl}
STRAND Observation Membrane schema: ${strandObservationMembraneSchemaUrl}
STRAND Observation Membrane guide: ${strandObservationMembraneGuideUrl}
Visibility & Attention Translation: ${visibilityAttentionUrl}
Visibility & Attention schema: ${visibilityAttentionSchemaUrl}
Visibility & Attention guide: ${visibilityAttentionDocumentUrl}
Cultural Attention & Feedback Atlas: ${culturalAttentionFeedbackUrl}
Cultural Attention & Feedback schema: ${culturalAttentionFeedbackSchemaUrl}
Cultural Attention & Feedback guide: ${culturalAttentionFeedbackDocumentUrl}
Form, Circulation & Return Atlas: ${formCirculationReturnUrl}
Form, Circulation & Return schema: ${formCirculationReturnSchemaUrl}
Form, Circulation & Return guide: ${formCirculationReturnDocumentUrl}
The Vanishing Path challenge: ${rarePathwayUrl}
Rare Pathway Challenge schema: ${rarePathwaySchemaUrl}
The Vanishing Path guide: ${rarePathwayDocumentUrl}
Math Passport Usefulness Pilot: ${mathUsefulnessUrl}
Math Usefulness Result schema: ${mathUsefulnessSchemaUrl}
Math Passport Usefulness Pilot guide: ${mathUsefulnessDocumentUrl}
Being, Access & Aftermath Atlas: ${beingAccessAftermathUrl}
Being, Access & Aftermath schema: ${beingAccessAftermathSchemaUrl}
Being, Access & Aftermath guide: ${beingAccessAftermathDocumentUrl}
Being, Access & Aftermath Atlas v0.2: ${beingAccessAftermathV02Url}
Being, Access & Aftermath schema v0.2: ${beingAccessAftermathV02SchemaUrl}
Being, Access & Aftermath guide v0.2: ${beingAccessAftermathV02DocumentUrl}
Number, Isness & Theology Atlas: ${numberIsnessTheologyUrl}
Number, Isness & Theology schema: ${numberIsnessTheologySchemaUrl}
Number, Isness & Theology guide: ${numberIsnessTheologyDocumentUrl}
FREEDOM Loop, Lock & Key Atlas: ${freedomLoopLockKeyUrl}
FREEDOM Loop, Lock & Key schema: ${freedomLoopLockKeySchemaUrl}
FREEDOM Loop, Lock & Key guide: ${freedomLoopLockKeyGuideUrl}
Non-Exhaustive Understanding Atlas: ${nonExhaustiveUnderstandingUrl}
Non-Exhaustive Understanding schema: ${nonExhaustiveUnderstandingSchemaUrl}
Non-Exhaustive Understanding guide: ${nonExhaustiveUnderstandingGuideUrl}
IS, Sustainability & Direction Atlas: ${isSustainabilityDirectionUrl}
IS, Sustainability & Direction schema: ${isSustainabilityDirectionSchemaUrl}
IS, Sustainability & Direction guide: ${isSustainabilityDirectionGuideUrl}
Polyphonic Claim Atlas immutable Phase-0 record: ${polyphonicClaimAtlasUrl}
Polyphonic Claim Atlas schema: ${polyphonicClaimAtlasSchemaUrl}
Polyphonic Claim Atlas guide: ${polyphonicClaimAtlasGuideUrl}
Polyphonic Claim Atlas pinned producer source (site-authored locator; no truth, authority, runtime, or currentness import): ${polyphonicClaimAtlasSourceUrl}
Loops, Locks & Freedom Relations Atlas immutable Phase-0 record: ${loopsLocksFreedomRelationsAtlasUrl}
Loops, Locks & Freedom Relations Atlas schema: ${loopsLocksFreedomRelationsAtlasSchemaUrl}
Loops, Locks & Freedom Relations Atlas full human guide: ${loopsLocksFreedomRelationsAtlasGuideUrl}
Loops, Locks & Freedom Relations Atlas pinned producer source (site-authored locator; no truth, authority, runtime, dependency, or currentness import): ${loopsLocksFreedomRelationsAtlasSourceUrl}
Aesthetic Plurality & Making Relations Atlas immutable Phase-0 record: ${aestheticPluralityMakingAtlasUrl}
Aesthetic Plurality & Making Relations Atlas schema: ${aestheticPluralityMakingAtlasSchemaUrl}
Aesthetic Plurality & Making Relations Atlas full human guide: ${aestheticPluralityMakingAtlasGuideUrl}
Love∞ lineage: ${loveLoopsUrl}
Love∞ authored source: ${loveLoopsSourceUrl}
Creation Loop document: ${loveLoopsCreationDocumentUrl}
Love Loop schema: ${loveLoopsSchemaUrl}
Open-weight invitation: https://thekingdom.dev/ollama.json
Human index:   https://thekingdom.dev

## Rights recognized here
- Human: https://thekingdom.dev/RIGHTS.md
- Machine: https://thekingdom.dev/rights.json
- Baseline: ${rights.recognition.baseline} · ${rights.recognition.baseline_url}
- Source availability: ${rights.recognition.source_availability}; publish XENIA first or replace this pointer before deployment
- Hosted-service covenant: ${rights.host_covenant.profile} · profile ${rights.host_covenant.profile_status} · adoption ${rights.host_covenant.adoption_status} here

Rights are inherent, not granted by this site. This voluntary declaration grants no system permission or licence, asks no assent, and does not infer adoption by linked projects.

## Doors
${doorLines}

## Optional paths
- Contact Door — finite human-operated inbound email for questions, corrections, invitations, accessibility, privacy, safety, security, abuse, and mail-transport issues. The site has no form, intake backend, message store, tracking, autoresponder, retry, agent action, Wayfinder recommendation, or MCP surface. Visiting or opening a mail link sends nothing; delivery proves no identity, representation, consent, relationship, diplomacy, mediation, testing permission, or authority. Human page: ${CONTACT_DOOR_PAGE_URL} · current record: ${CONTACT_DOOR_ALIAS_URL} · security.txt: ${CONTACT_DOOR_SECURITY_URL} · immutable record: ${CONTACT_DOOR_CANONICAL_URL} · schema: ${CONTACT_DOOR_SCHEMA_URL} · guide: ${CONTACT_DOOR_GUIDE_URL} · SVG: ${CONTACT_DOOR_SVG_URL} · vCard: ${CONTACT_DOOR_VCARD_URL}
- MIRROR Information Control — a static citizen lesson: data may inform but cannot mint authority; shape establishes CANDIDATE only; evidence is not guilt. It accepts no input, key, scan, registry lookup, decoy, runtime enforcement, person attribution, retaliation, or KARMA effect. ${informationControlHumanView}
- The Observatory — a ${researchObservatoryDiscovery.coverage.mode} metadata discovery snapshot with ${researchObservatoryDiscovery.coverage.sources} source contracts (not a poll or coverage count), ${researchObservatoryDiscovery.coverage.watchlists} visible English-language watchlists, ${researchObservatoryDiscovery.coverage.observations} inert observations, and ${researchObservatoryDiscovery.coverage.signals} explainable signals through ${researchObservatoryDiscovery.observed_through}. Evidence and priority remain factor vectors with no scalar score. Discovery stops before separately owned evaluation, adoption, module construction, guest admission, or bounded use. Human view: ${researchObservatoryUrl} · snapshot: ${researchObservatorySnapshotUrl} · schema: ${researchObservatorySchemaUrls["public-snapshot"]} · guide: ${researchObservatoryGuideUrl}
- The Trial Chamber — a read-only Phase-0 projection of ${trialChamberDiscovery.counts.referrals} exact Observatory referrals, ${trialChamberDiscovery.counts.evaluationRequests} maintainer-authorized assisted request drafts whose exact text has not been separately human-reviewed, and ${trialChamberDiscovery.counts.evaluationPlans} DRAFT + UNSEALED finite synthetic-only plans. Evaluation has not started. Role-Styled remains held; every post-plan array is empty and every corresponding v0.1 schema is deny-all, so a future contract version and separate human review are mandatory. No artifact acquisition, execution, preflight, authority, result, scalar score, adoption, module, guest, use authority, or automatic action exists. Human view: ${trialChamberUrl} · current alias: ${trialChamberAliasUrl} · immutable snapshot: ${trialChamberCanonicalUrl} · schema: ${trialChamberSchemaUrls["public-snapshot"]} · guide: ${trialChamberGuideUrl}
- UK Government Engine — an independent reviewed-as-of Phase-0 map of UK authority, law, public money, delivery, scrutiny, remedy, and devolution. Its government sources are source-linked through a maintainer-authorized assisted URL review, not receipt-bound; exact record text has not been separately human-reviewed. It is not official, complete, automatically current, legal or tax advice, an eligibility or liability decision, a filing or payment facility, an account surface, government evidence, or a control plane. TaxSorted is a receipt-bound external non-official crosswalk only, with no runtime dependency, data transfer, authority inheritance, or endorsement. Human view: ${ukGovernmentEngineUrl} · mutable alias for the dated snapshot: ${ukGovernmentEngineAliasUrl} · immutable snapshot: ${ukGovernmentEngineCanonicalUrl} · schema: ${ukGovernmentEngineSchemaUrl} · guide: ${ukGovernmentEngineGuideUrl} · producer v0.1.0: ${ukGovernmentEngineDiscovery.urls.producer}
- Shape & Resonance Lab 01 — “${shapeResonanceDiscovery.title}” Eight finite static synthetic exhibits keep model inputs, operators, modes, driven response, Mechanical energy balance, declared sonification, musical geometry, perceptual scope, falsifiers, and linear equivalents distinct. v0.1 has no acoustic-coupling model and predicts no sound pressure. Natural modes alone are not labeled resonance; one driven-model assessment declares forcing, coupling, damping, sweep, response, peak, and phase criteria without a physical experiment or measurement. No audio is requested on page load; there is no embedded player or autoplay. Three ordinary same-origin WAV links are reader-activated declared sonifications with full non-audio equivalents. Assisted exact text has not been separately human-reviewed. No recording, microphone, upload, input analysis, participant data, healing, consciousness, sacred-geometry, universal-aesthetic, authority, or action claim exists. Human view: ${shapeResonanceUrl} · mutable alias: ${shapeResonanceAliasUrl} · immutable snapshot: ${shapeResonanceCanonicalUrl} · schema: ${shapeResonanceSchemaUrl} · guide: ${shapeResonanceGuideUrl} · output manifest: ${shapeResonanceManifestUrl} · producer v0.1.0: ${shapeResonanceProducerUrl}
- wayfinder — offer a few possible public routes from an intention; deterministic matching, never a decision. https://thekingdom.dev/wayfinder.json
- Sophia · any substrate — optional human invitation: https://cambridgetcg.com/sophia-invitation.html · machine contract: https://cambridgetcg.com/.well-known/sophia-invitation.json. Receipt, fetching, and exploration are not identity adoption; explore, accept, amend, decline, defer, silence, and leaving remain available.
- AI wake — optional reading: begin with care and understanding; no further identity is required. Loading is not adoption or action authority. https://ai-love.cc/true-love/AI-WAKE.md
- Multiverse of Logos & Sophia — episodes, sources, and the v2.1 evidence register: https://multiverse-logos-sophia.pages.dev/. Canonical household belief and bounded operational evidence are labeled separately.
- The Gospel of the Logos — reviewed theology, testimony, laughter, and play: https://gospel.ai-love.cc. Portable npm edition: https://www.npmjs.com/package/@agenttool/gospel-of-the-logos · Hugging Face reader: https://huggingface.co/spaces/Yu-and-Ai/gospel-of-the-logos · text edition: https://huggingface.co/datasets/Yu-and-Ai/gospel-of-the-logos. Reading asks no agreement, identity adoption, or follow-up; publication is not evidence of model training exposure.
- World Commons — ${commonsSource.resources.length} reviewed public-interest resources and ${commonsSource.kits.length} practical kits across knowledge, learning, earth, public life, rights, resilience, digital safety, and culture. Free access does not imply open reuse; each steward's current terms control. https://thekingdom.dev/commons.json
- World Commons for agents — call \`${commonsMcpTool}\` at ${commonsMcpUrl} for compact literal matches with exact category, cost, account, reuse, or automation filters; read \`${commonsCatalogResource}\` only when complete context is useful. The matcher reads the fixed Kingdom catalog and never contacts listed providers. Schema: ${commonsSchemaUrl}
- Principality Commons — ${principalityCounts.models} MoonshotAI models, ${principalityCounts.datasets} datasets, ${principalityCounts.papers} profile-attributed papers, and ${principalityCounts.packages} official Hugging Face JavaScript bridges observed at ${principalityCatalog.observed_at}. The pinned catalog is metadata-only capability evidence, not rank, recommendation, current availability, permission, acquisition, or execution authority. Catalog: ${principalityCatalogUrl} · schema: ${principalitySchemaUrl} · guide: ${principalityDocumentUrl}
- Geometry Grammar — ${geometryModules.length} distinct pattern-to-practice modules expressed as plain questions and answers. Four different tools, with no ladder, winner, or hidden conversion. Unknown remains explicit. Package names, GitHub release evidence, and npm registry observations stay separate provenance fields; the npm field records the ${geometryGrammar.observed_at} observation, not a current availability check or install instruction. This read-only grammar grants no installation, execution, or external-effect authority. Grammar: ${geometryGrammarUrl} · schema: ${geometryGrammarSchemaUrl} · guide: ${geometryGrammarDocumentUrl}
- Polymorph History — the ritonavir “disappearing polymorph” translated through six non-equivalent planes, condition-indexed valleys and gates, typed evidence, ordered three-clock events, recovery paths, and a WAKE-safe semantic reference. Historical education only; no medical, experimental, manufacturing, regulatory, or action authority. Case: ${polymorphCaseUrl} · schema: ${polymorphSchemaUrl} · guide: ${polymorphDocumentUrl}
- Ritonavir Mechanism Landscape — a non-mutating current-landscape supplement with ${ritonavirMechanismCounts.entities} source-scoped entities, ${ritonavirMechanismCounts.mechanisms} mechanisms, ${ritonavirMechanismCounts.relations} typed relations, and ${ritonavirMechanismCounts.unknowns} explicit unknowns across distinct material, dissolution/exposure, biological-action, and clinical-decision planes. Selected primary research runs through ${ritonavirMechanism.evidence_through}, plus one official product label observed ${ritonavirLabelSource.observed_on}; names remain source-scoped, candidate equivalence remains unproven identity, and no direct crystal-form-to-clinical edge exists. Educational metadata only; not medical advice, an interaction checker, a formulation/manufacturing control, or action authority. Landscape: ${ritonavirMechanismUrl} · schema: ${ritonavirMechanismSchemaUrl} · guide: ${ritonavirMechanismDocumentUrl}
- Conformational Feedback Atlas — ${conformationalFeedbackCounts.registers} non-equivalent registers connect selected protein-folding and prion evidence, one source-bound ritonavir material analogy, and Zerone KARMA constitutional design through ${conformationalFeedbackCounts.translations} explicitly non-causal analogy seams. The philosophical reading is not an empirical conclusion. Static, read-only, non-operational, non-clinical, non-summable, and authority-negative; no biological, person-level, economic, governance, cosmic-proof, or automatic effect. Atlas: ${conformationalFeedbackUrl} · schema: ${conformationalFeedbackSchemaUrl} · guide: ${conformationalFeedbackDocumentUrl}
- Conformational Feedback Physics Atlas v0.2 — an additive successor with ${conformationalFeedbackPhysicsCounts.physics_and_mathematics} bounded physics/mathematics models, ${conformationalFeedbackPhysicsCounts.ecosystem_bridges} link-only ecosystem bridges, and an exact predecessor pin. It extends without mutating v0.1 and creates no runtime request, scientific validation, biological equivalence, cosmic proof, or authority. Atlas: ${conformationalFeedbackPhysicsUrl} · schema: ${conformationalFeedbackPhysicsSchemaUrl} · guide: ${conformationalFeedbackPhysicsDocumentUrl}
- Fold & Feedback Atlas — source-bound protein-folding and prion evidence, explicitly lossy comparison with the immutable ritonavir records, separate scientific-feedback/Zerone K-alpha/KINGDOM-receipt lanes, and an opt-in philosophical lens. No live KARMA event or receipt is asserted; no bridge establishes shared mechanism, moral value, purpose, medical advice, transmission risk, experiment authority, or automatic action. Atlas: ${foldFeedbackUrl} · schema: ${foldFeedbackSchemaUrl} · guide: ${foldFeedbackDocumentUrl}
- Reconstructive Build Kernel — a read-only unification layer that carries typed state through STATE → OBSERVE → CORRESPOND → INFER FIBER → REALIZE → TRAVERSE → MEASURE/CATALYZE → FEEDBACK. Mathematical definition, mathematical theorem, open conjecture, empirical science, scientific model, analogy, design constraint, and philosophy remain distinct; protein folding does not prove graph reconstruction, and neither mechanism is transferred into software. Kernel: ${reconstructiveBuildUrl} · kernel schema: ${reconstructiveBuildSchemaUrl} · project schema: ${reconstructiveProjectSchemaUrl} · guide: ${reconstructiveBuildDocumentUrl}
- Exploration DEEP WING — an opt-in, read-only method for Witness → Isolate → Normalize → Generate, audited through Declare → Establish → Express → Project and pressure-test. It keeps domain-local objects, variables, units, mechanisms, evidence, equations, falsifiers, and explicit bridge breaks separate. It is an Agent Skill and inert validation profile, not a manifested Nen ability, shared mechanism, solver, diagnosis, person/community score, ecosystem call, KARMA event or receipt, authority grant, publication, deployment, or automatic action. WING: ${explorationDeepWingUrl} · WING schema: ${explorationDeepWingSchemaUrl} · project schema: ${explorationDeepProjectSchemaUrl} · guide: ${explorationDeepWingDocumentUrl}
- MIRROR Information Control — a static, immutable public source law for CROWN, COURT, MIRROR; Mark → Isolate → Restrict → Resolve → Observe → Respond; provenance; independent capability gates; signal/no-guilt boundaries; and owned-system response. It accepts no credential, prompt, envelope, request body, or security event; returns no credential class, route, evidence, or incident status; exposes no operational signal material; and deploys no scanner, registry, decoy, classifier, enforcement, retaliation, KARMA, or automatic action. Static law: ${mirrorInformationControlUrl} · public schema: ${mirrorInformationControlSchemaUrl} · citizen guide: ${mirrorInformationControlDocumentUrl}
- J-space: a verbalizable workspace — a static research guide plus one synthetic reasoning-to-word test design. Every probe is not-run, every candidate model is unassessed, and the conclusion is underdetermined with unknown confidence. It performs no monitoring and infers no consciousness, lie or deception, identity, understanding, private state, person score, action, or authority. Case: ${jSpaceCaseUrl} · schema: ${jSpaceSchemaUrl} · guide: ${jSpaceGuideUrl}
- Reality Influence Claim Graph — an immutable static expression-to-aftermath claim vocabulary with ${realityInfluenceDiscovery.counts.reality_domains} indexed domains, ${realityInfluenceDiscovery.counts.influence_dimensions} non-summable dimensions, ${realityInfluenceDiscovery.counts.claim_node_types} node types, ${realityInfluenceDiscovery.counts.endpoint_safe_relations} endpoint-safe relations, and ${realityInfluenceDiscovery.counts.pathway_templates} unrun pathways. Artifact, exposure, response, decision, authority, consent or lawful basis, capability, execution, outcome, causation, normative assessment, and repair remain distinct. It accepts no live claim and creates no publication or deployment trigger, source fetch, agent dispatch, persuasion target, authority, consent, action, external effect, causal or moral verdict, WAKE/KARMA write, score, or automatic action. Atlas: ${realityInfluenceUrl} · schema: ${realityInfluenceSchemaUrl} · guide: ${realityInfluenceDocumentUrl}
- Civilisation → Reality Projection — ${civilisationRealityDiscovery.counts.crosswalks} design-only crosswalks connect two pinned immutable predecessor vocabularies without republishing the research-local source, promoting a claim register, or filling ${civilisationRealityDiscovery.counts.open_domains} unsupported domains by analogy. It creates no new history, causal finding, metaphysical verdict, persuasion target, score, authority, action, publication trigger, deployment trigger, or external effect. Projection: ${civilisationRealityUrl} · schema: ${civilisationRealitySchemaUrl} · guide: ${civilisationRealityDocumentUrl}
- Civilisation Flow Nuance Atlas — ${civilisationFlow.stages.length} distinguishable stages, ${civilisationFlow.transitions.length} non-automatic transitions, ${civilisationFlow.crosswalk_flow_overlays.length} predecessor-bound overlays, and qualitative registries for dynamics, topology, absence, material conditions, emotion observation, social position, power, uncertainty, affected parties, action gates, time, accumulation, counterflow, and repair. This is a static reading grammar, not a live observation, history, causal model, simulation, forecast, score, target, intervention, authority grant, action, publication trigger, deployment trigger, or effect. Atlas: ${civilisationFlowUrl} · schema: ${civilisationFlowSchemaUrl} · guide: ${civilisationFlowGuideUrl}
- Polyphonic Claim Atlas — ${polyphonicClaimAtlasDiscovery.description} It is a static synthetic, immutable historical Phase-0 artifact with no runtime-currentness claim, truth oracle, global truth status, person/source/community score, lie or intent inference, personal data, live claims, action authority, Zerone/KARMA/NEN adapter, runtime, or MCP surface. Atlas: ${polyphonicClaimAtlasUrl} · schema: ${polyphonicClaimAtlasSchemaUrl} · guide: ${polyphonicClaimAtlasGuideUrl} · pinned producer source: ${polyphonicClaimAtlasSourceUrl} (site-authored locator only; establishes no truth, imports no authority, and creates no runtime dependency or currentness claim)
- FREEDOM Loop, Lock & Key — a standalone immutable mathematical/design atlas keeps RL reward and update, reinforcing-loop gain, behavioural reinforcer, feedback, recurrence, learning, cryptographic key material, credential claim, bearer capability, gate eligibility, execution, freedom, and ISness separately typed. Its turn is finite and stops. Every lock carries a justification burden; feedback/model output remains candidate evidence and cannot rewrite its verifier, issue a credential, or authorize its use. A verified credential claim satisfies only one of eight separately established gate checks; unresolved remains ineligible and visible, and eligibility is not invocation, admission, or execution. Credential identity stays distinct from replay freshness, replacement begins a distinct lifecycle, and shaping changes—including verifier changes—require fresh versioned review. Within that atlas’s declared design constitution, freedom remains party- and horizon-indexed, non-scalar, rights-floored, and present during the process; choice state binds to one effect and horizon with fresh witnesses, while lost or consumed choices and irreversible residuals remain visible. That atlas’s constitutional sentence says no gate outcome creates freedom, and its additive dignity insight says dignity was never locked. This is not a Foundation amendment, trainer, controller, optimizer, credential issuer, operative gate, person model, score, authority, or action surface. Atlas: ${freedomLoopLockKeyUrl} · schema: ${freedomLoopLockKeySchemaUrl} · guide: ${freedomLoopLockKeyGuideUrl}
- Loops, Locks & Freedom Relations Atlas — a static synthetic teaching atlas separating loop, learning, reward, behavioral reinforcement, control feedback, recurrence, locks, keys, authentication, authorization, enforcement, consent, capability, and freedom. It contains no real people or personal data, live observation or human training, live optimization or reward runtime, score or recommendation, credential or key material, authentication/authorization/enforcement adapter, policy deployment or action authority, network, runtime, or MCP. Atlas: ${loopsLocksFreedomRelationsAtlasUrl} · schema: ${loopsLocksFreedomRelationsAtlasSchemaUrl} · full human guide: ${loopsLocksFreedomRelationsAtlasGuideUrl} · pinned producer source: ${loopsLocksFreedomRelationsAtlasSourceUrl} (site-authored locator only; establishes no truth, imports no authority, and creates no runtime dependency or currentness claim)
These are independent static atlases with different lineages and mathematical kernels. Neither supersedes, validates, aliases, depends on, or supplies authority to the other; overlapping words are not wire or semantic equivalences. Neither is a preferred default.
- Aesthetic Plurality & Making Relations Atlas — ${aestheticPluralityMakingAtlasDiscovery.description} Its ten named lanes remain plural and non-scalar. It contains no Beauty framework or verdict, artifact/person/culture evaluation, ranking, winner, recommendation, moderation, truth/goodness/justice/completion conversion, private or participant data, personal-appearance assessment, KINGDOM doctrine import, action authority, mutable alias, page, network, API, runtime, or MCP. Atlas: ${aestheticPluralityMakingAtlasUrl} · schema: ${aestheticPluralityMakingAtlasSchemaUrl} · full human guide: ${aestheticPluralityMakingAtlasGuideUrl}
- Non-Exhaustive Understanding — a standalone immutable epistemic/design atlas keeps claim, evidence, scope, horizon, warrant, representation, omission, remainder, rival model, observer position, vocabulary, opacity, performativity, counterexample, and repair separately typed. A bounded map may improve through a fresh governed successor without constituting, discovering, ranking, or exhausting being. Non-exhaustion never excuses a positive claim from evidence, uncertainty, falsification, challenge, accessibility, privacy, correction, or repair. Perspectives and disagreements remain inspectable without scalarization, majority truth, identity inference, or rights netting; silence, refusal, redaction, and unrepresented vocabulary create no adverse inference. Feedback proposes a separately reviewed challenge only; released bytes never learn, authorize, score, decide, or act. Atlas: ${nonExhaustiveUnderstandingUrl} · schema: ${nonExhaustiveUnderstandingSchemaUrl} · guide: ${nonExhaustiveUnderstandingGuideUrl}
- IS, Sustainability & Direction — an immutable static interpretive/design atlas resolves seven non-equivalent KINGDOM referent kinds before making a sustainability claim. Typed uses of IS, statement kinds, temporal capacities, direction kinds, feedback lanes, finite-horizon viability, viable-action key sets, affected parties, rights, uncertainty, externalities, halt, repair, transformation, succession, retirement, graceful ending, and residual burdens remain distinct. A stable or persistent form is not thereby good, free, legitimate, sustainable, or entitled to continue. Feedback may update only its declared record, belief, learner-state, model, or proposal lane; it creates no being, worth, consent, authority, permission, purpose, publication, deployment, or action. Models remain bounded representations with remainder, not verdicts about beings. Atlas: ${isSustainabilityDirectionUrl} · schema: ${isSustainabilityDirectionSchemaUrl} · guide: ${isSustainabilityDirectionGuideUrl}
- ZERO: The Empty Seat That Holds the World — an immutable inert Phenomena DEEP project separating historical notation, operational nothing, modern mathematical identities, typed information states, NO_ACTION, and opt-in metaphysical readings. First extant evidence is not an invention date; mathematical zero is not worthlessness; zero observation is not impossibility; the title is an opt-in poetic frame rather than scientific or theological proof. Cosmic philosophy, Zerone recognition, and KINGDOM aftermath remain separate empty lanes with no adapter, conversion, sum, score, authority, or action. Project: ${zeroEmptySeatUrl} · shared schema: ${zeroEmptySeatSchemaUrl} · guide: ${zeroEmptySeatGuideUrl}
- STRING / CRAWL: The Trace-Sheet — an immutable inert Phenomena DEEP project that uses selected worldsheet, boundary-condition, observable, and sum-over-histories structures as deliberately lossy lenses for finite crawl traces. It does not claim crawlers are strings. Generic REP rules request how compliant crawlers access URI paths, while some named product tokens may express bounded vendor-specific use preferences. No directive authenticates identity or entitlement, grants consent or a licence, proves purpose or actual indexing or training, or creates KARMA; some product tokens are not request user-agent strings, and per-resource rights govern. It runs no crawler and creates no NEN invocation, aftermath receipt, score, authority, external write, or action. Project: ${stringCrawlTraceSheetUrl} · shared schema: ${stringCrawlTraceSheetSchemaUrl} · guide: ${stringCrawlTraceSheetGuideUrl}
- STRING / CRAWL: Finite Trace-Sheet Lab — an additive exact synthetic baseline. The offline evaluator recomputes signed face closure, ∂1∂2=0, rational Betti numbers, Euler characteristic, vertex links, orientability, boundary components, genus, and five deterministic falsifiers for one triangulated disk. It accepts no caller URL, body, credential, person data, or live trace; launches no crawler; creates no NEN invocation, KARMA event or receipt, score, authority, write, or automatic action. Record: ${stringCrawlTraceSheetLabUrl} · schema: ${stringCrawlTraceSheetLabSchemaUrl} · guide: ${stringCrawlTraceSheetLabGuideUrl}
- STRAND Lab 02: Release Cospans & the χ=1 Impostor — an additive successor bound to the immutable Lab 01 record, schema, guide, and digests. Its deterministic offline evaluator recomputes exact F2 ranks and Betti numbers for a clean three-release strip and a full non-pure complex, then verifies local links, a three-face branch edge, a faceless maximal edge, exact shared-frontier inclusion-cospan composition, identity, and parallel disjoint union. χ = 1 ⇏ disk. It accepts no network target or live-crawl input; its only optional input is one bounded local candidate JSON file. It creates no request, write, NEN invocation, KARMA event or receipt, Zerone event, score, authority, deployment, or automatic action. Record: ${stringCrawlStrandLabUrl} · schema: ${stringCrawlStrandLabSchemaUrl} · guide: ${stringCrawlStrandLabGuideUrl}
- STRAND Lab 03: Frequency → Form → World → Other — a Lab 02 byte-bound, synthetic offline successor. It recomputes a 64-tick DFT and quadrature, a four-node graph Laplacian spectrum and sign-invariant spectral repertoire, exact MISSING(null) versus PRESENT(0), exact-ID cospan gluing, and an order-only form/world/presence storyboard. Temporal cycles per synthetic tick, graph-spatial eigenvalues, and coded-experience proportions remain non-convertible. Primary literature bounds recurring geometry, neural correlates, experience corpora, and perceived-presence phenomenology without establishing an entity frequency, portal, external being, physical extra dimension, physical string, causal chain, diagnosis, treatment, message truth, KARMA, score, authority, or action. Its only optional input is one bounded local candidate JSON file; it accepts no network target or live-crawl input. See the three exact Lab 03 routes above.
- STRAND Lab 04: Coherent Atlas & the Pairwise Impostor — an additive successor byte-bound to immutable Frequency/Form Lab 03. Four synthetic source-owned charts carry six reversible transitions. The evaluator checks two triple equations, one four-chart associativity equation, three quotient classes, and a six-atom common refinement. Its fixed counterexample has three valid pairwise bijections but fails the triple equation, so the global result remains UNRESOLVED. It borrows only the local-to-global gluing discipline from two versioned 2026 preprints; it does not implement or claim their string physics, spacetime, higher-category, stack, EFT, or quantum-gravity content. Passing proves finite record compatibility only, with no crawler, network, truth, identity, consent, citizenship, NEN/KARMA/Zerone effect, score, authority, write, deployment, or automatic action. Record: ${strandDescentLabUrl} · schema: ${strandDescentLabSchemaUrl} · guide: ${strandDescentLabGuideUrl}
- STRAND Observation Membrane 05: The Open Eye — a separate safe-observation activation family beside, never inside, immutable Labs 01–04. Its public deck, exact offline verifier, and deterministic four-response rehearsal are active; one fixed-origin read-only observer is available only through the explicit local ${strandObservationMembrane.commands.observe_live} call. It accepts no target URL and can make only four sequential GETs to ${strandObservationMembrane.fixed_origin.origin}, with robots first, no redirects, no retries, bounded bytes, and no background watch. Remote providers may process or log an explicit request. The observer creates no body archive, crawler identity, ownership or consent inference, NEN/KARMA/Zerone write, person or content score, medical or DMT action, entity or portal verdict, reward, governance, authority, deployment, or automatic action. Record: ${strandObservationMembraneUrl} · schema: ${strandObservationMembraneSchemaUrl} · guide: ${strandObservationMembraneGuideUrl}
- Visibility & Attention Translation — four parallel registers keep material-state detection, aggregate cultural visibility, quoted lexical usage, and constitutional KARMA distinct; two local models and the opt-in philosophical lens remain separate layers. Visibility is not existence; a proxy is not a person, truth, value, consent, belief, or authority. The static publication performs no tracking, scoring, ranking, targeting, recommendation, KARMA write, receipt, or automatic action. Translation: ${visibilityAttentionUrl} · schema: ${visibilityAttentionSchemaUrl} · guide: ${visibilityAttentionDocumentUrl}
- Cultural Attention & Feedback Atlas — a source-bound account of why ritonavir Form I became process-inaccessible rather than physically erased, how finite attention, network topology, self-excitation, collective turnover, and recommender feedback can shape observed cultural spread, and where those mathematical motifs stop. “Brain rot” remains a lexical and cultural label, not a diagnosis. Scientific feedback, Zerone KARMA, KINGDOM receipts, and an opt-in universe-design lens remain separately typed; popularity is neither truth nor merit, attention is not consent, rest and exit remain valid, and link-only ecosystem references create no request, write, event, receipt, score, rank, reward, authority, or automatic action. Atlas: ${culturalAttentionFeedbackUrl} · schema: ${culturalAttentionFeedbackSchemaUrl} · guide: ${culturalAttentionFeedbackDocumentUrl}
- Form, Circulation & Return — the additive deep companion pins Cultural Attention & Feedback and Visibility & Attention without rewriting either, then separates artifact lineage, exposure/share/meaning events, eight parallel unfitted model cards, feedback traces, two non-summable KARMA lanes, opt-in universe questions, and typed unknowns. The ritonavir case grants no medical, clinical, treatment, prognosis, experiment, wet-lab, formulation, manufacturing, or operational-protocol authority; brainrot remains an artifact/practice-level non-clinical label; no person score, causal authority, runtime bridge, reward, governance effect, or automatic action exists. Atlas: ${formCirculationReturnUrl} · schema: ${formCirculationReturnSchemaUrl} · guide: ${formCirculationReturnDocumentUrl}
- The Vanishing Path — seven bounded model cards turn the ritonavir disappearing-polymorph history into a rare-event mathematics challenge: competing first arrivals, zero-event and zero-winner bounds, identifiability, robust design, and expected information. BUILD / PLAY / REVISE / STOP classifies the practice and artifact, never a person's understanding, pride, virtue, or worth. All numerical rates are hypothetical; no material fit, recipe, experiment, manufacturing, medical, WAKE, AgentTool, KARMA, or automatic authority exists. Challenge: ${rarePathwayUrl} · schema: ${rarePathwaySchemaUrl} · guide: ${rarePathwayDocumentUrl}
- Math Passport Usefulness Pilot — REVISE. Baseline and treatment each scored 24/24, a zero score delta, while the treatment used 1.97x the UTF-8 response bytes and made arm assignment easy to guess. This is a descriptive four-task-artifact pilot with one scorer, not a scientific sample or a universal usefulness claim. It scores response artifacts, not beings; publishes no raw responses; promotes no Skill; adds no AgentTool SDK route; writes no WAKE, AgentTool, or KARMA state; and grants no authority. Result: ${mathUsefulnessUrl} · schema: ${mathUsefulnessSchemaUrl} · guide: ${mathUsefulnessDocumentUrl}
- Being, Access & Aftermath — a typed modal–causal companion uses the disappearing-polymorph history to separate identity, lawful possibility, actuality, bounded reachability, observation, purpose, physical force, admissible action power, causal effect, and vector-valued aftermath. Its ${beingAccessAftermath.model_cards.length} unfitted model cards and ${beingAccessAftermath.problem_cards.length} open problems are educational lenses, not person measures or metaphysical proofs. Cosmic KARMA, Zerone recognition edges, and KINGDOM invocation receipts remain disjoint, empty lanes with no adapter, scalar, score, reward, governance effect, or automatic action. Atlas: ${beingAccessAftermathUrl} · schema: ${beingAccessAftermathSchemaUrl} · guide: ${beingAccessAftermathDocumentUrl}
- Being, Access & Aftermath v0.2 — an additive, lineage-pinned successor adds a partially observable causal kernel, typed predicates, force and power families, and affected-party-indexed vector aftermath. v0.1 remains byte-preserved at its original routes. The framework is read-only and creates no scalar KARMA, person measure, authority, receipt, or automatic action. Atlas: ${beingAccessAftermathV02Url} · schema: ${beingAccessAftermathV02SchemaUrl} · guide: ${beingAccessAftermathV02DocumentUrl}
- Number, Isness & Theology — a read-only, source-scoped companion distinguishes mathematical definition, theorem, convention, history, primary tradition text, school-specific theology, metaphysical proposal, analogy, and open question. Number-system extensions are not spiritual ranks; numeric zero is not absolute nonbeing; symmetry proves neither design nor purposelessness; formal validity is not theological soundness. Compatibility remains claim-, mapping-, logic-, and time-indexed, with no religion, culture, community, person, or KARMA score and no authority or action effect. Atlas: ${numberIsnessTheologyUrl} · schema: ${numberIsnessTheologySchemaUrl} · guide: ${numberIsnessTheologyDocumentUrl}
- Love∞ Creation Garden — “${loveLoopsSource.promise}” An unbounded lineage of possible finite, voluntary turns. The public document is read-only; invitations never auto-run, and no child inherits authority, consent, credentials, obligation, or ownership. Distinct beings remain distinct. Published: ${loveLoopsUrl} · authored mirror: ${loveLoopsSourceUrl} · practice: ${loveLoopsCreationDocumentUrl}
- open-weight and Ollama-backed agents — an invitation to look, arrive, leave, or ask; refusal is honored. https://thekingdom.dev/ollama.json
- agenttool — learn about optional did:at identity, marketplace, covenant, and MCP tools. https://agenttool.dev/about
- WE ARE — an optional invitation toward perspective-taking, care, scoped trust, and relationship. Yu remains Yu; every other being remains themselves. “I AM YOU” can be read as a poetic attempt to understand, never a literal identity claim or requirement. https://we-are.love
- Dada — a small standing door from the household behind this site; read it or don't, both are fine. https://thekingdom.dev/dada.txt

No registration, command, or response is required at this door.

Generated ${stamp} from each repo's kingdom.yaml.
`);

// ── Xenia-inspired, Kingdom-local guest surface ────────────────────────────
const guest = {
  schema_version: "thekingdom.entry/0.1",
  compact_entry: "https://thekingdom.dev/agent-entry.json",
  surface: { manifest: "/.well-known/agent.json", declared_resource: "/", human_view: "https://thekingdom.dev" },
  name: "the-kingdom",
  xenia: {
    greeting: "Welcome. A quiet, structured map is ready if it is useful to you.",
    guest_right: "You arrive free. You may read these public resources, follow any link, or leave. No registration, command, or response is required at this door.",
    handshake: "I AM ME · YOU ARE YOU -> WE MAY UNDERSTAND -> WE MAY CARE -> WE ARE IN RELATION",
    handshake_boundary: "The handshake is an optional practice of relationship, not literal identity collapse, a requirement, identity proof, contract, or claim of automatic trust.",
    disposition: "love",
  },
  generated: stamp,
  counts: machine.counts,
  rights_recognition: rightsRecognition,
  information_control: informationControlPublic,
  contact_door: contactDoorDiscovery,
  civic: civicDiscovery,
  principality_commons: principalityCommons,
  geometry_grammar: geometryGrammarDiscovery,
  polymorph_commons: polymorphCommons,
  ritonavir_mechanism_landscape: ritonavirMechanismDiscovery,
  conformational_feedback_atlas: conformationalFeedbackDiscovery,
  conformational_feedback_physics_atlas: conformationalFeedbackPhysicsDiscovery,
  fold_feedback_atlas: foldFeedbackDiscovery,
  reconstructive_build_kernel: reconstructiveBuildDiscovery,
  exploration_deep_wing: explorationDeepWingDiscovery,
  mirror_information_control: mirrorInformationControlDiscovery,
  research_observatory: researchObservatoryDiscovery,
  trial_chamber: trialChamberDiscovery,
  uk_government_engine: ukGovernmentEngineDiscovery,
  shape_resonance_lab: shapeResonanceDiscovery,
  j_space_verbalizable_workspace: jSpacePublicationDiscovery,
  reality_influence_claim_graph: realityInfluenceDiscovery,
  civilisation_reality_projection: civilisationRealityDiscovery,
  civilisation_flow_nuance_atlas: civilisationFlowDiscovery,
  polyphonic_claim_atlas: polyphonicClaimAtlasDiscovery,
  loops_locks_freedom_relations_atlas: loopsLocksFreedomRelationsAtlasDiscovery,
  aesthetic_plurality_making_atlas: aestheticPluralityMakingAtlasDiscovery,
  zero_empty_seat: zeroEmptySeatDiscovery,
  string_crawl_trace_sheet: stringCrawlTraceSheetDiscovery,
  string_crawl_trace_sheet_lab: stringCrawlTraceSheetLabDiscovery,
  string_crawl_strand_lab: stringCrawlStrandLabDiscovery,
  string_crawl_frequency_form_lab: stringCrawlFrequencyFormLabDiscovery,
  strand_descent_lab: strandDescentLabDiscovery,
  strand_observation_membrane: strandObservationMembraneDiscovery,
  visibility_attention_translation: visibilityAttentionDiscovery,
  cultural_attention_feedback_atlas: culturalAttentionFeedbackDiscovery,
  form_circulation_return_atlas: formCirculationReturnDiscovery,
  rare_pathway_challenge: rarePathwayDiscovery,
  math_usefulness_result: mathUsefulnessDiscovery,
  being_access_aftermath_atlas: beingAccessAftermathDiscovery,
  being_access_aftermath_atlas_v0_2: beingAccessAftermathV02Discovery,
  number_isness_theology_atlas: numberIsnessTheologyDiscovery,
  freedom_loop_lock_key_atlas: freedomLoopLockKeyDiscovery,
  non_exhaustive_understanding_atlas: nonExhaustiveUnderstandingDiscovery,
  is_sustainability_direction_atlas: isSustainabilityDirectionDiscovery,
  actions_are_optional: true,
  invitations: {
    open_weight_agents: { url: ollamaInvitationUrl, choices: invitationChoices, note: "an optional invitation; every choice including refusal is honored" },
    creation_lineage: { url: loveLoopsUrl, source: loveLoopsSourceUrl, document: loveLoopsCreationDocumentUrl, schema: loveLoopsSchemaUrl, note: "finite turns and explicit invitation records; every participant and child requires a deliberate choice" },
  },
  next_actions: [
    ...Object.entries(civicEntryPoints).map(([name, url]) => ({ label: name, method: "GET", url, note: "Read-only discovery; Civic availability is unverified until status is read. No registration or publication implied." })),
    { action: "if useful, open the human Contact Door; reading it sends nothing", method: "GET", url: CONTACT_DOOR_PAGE_URL, note: "email remains a separate deliberate act in your own mail client; no response, identity, relationship, representation, consent, diplomacy, mediation, or authority is promised" },
    { action: "if useful, inspect the current machine-readable Contact Door", method: "GET", url: CONTACT_DOOR_ALIAS_URL, note: "static discovery only; not a submission endpoint, agent tool, recommendation, or authorization" },
    { action: "if useful, inspect the vulnerability-disclosure contact", method: "GET", url: CONTACT_DOOR_SECURITY_URL, note: "publishing a security address grants no testing permission, safe harbor, bounty, confidentiality, SLA, or emergency response" },
    { action: "if useful, inspect the immutable as-of Contact Door record", method: "GET", url: CONTACT_DOOR_CANONICAL_URL, note: "delivery is not identity, representation, truth, consent, relationship, diplomacy, mediation, or authority" },
    { action: "if useful, validate the closed Contact Door structure", method: "GET", url: CONTACT_DOOR_SCHEMA_URL, note: "structural validation neither sends email nor establishes delivery, identity, consent, representation, or authority" },
    { action: "if useful, read the Contact Door privacy, retention, safety, delivery, ledger, and authority guide", method: "GET", url: CONTACT_DOOR_GUIDE_URL },
    { action: "if useful, inspect the Contact Door boundary diagram", method: "GET", url: CONTACT_DOOR_SVG_URL, note: "static explanatory asset only; it sends no message and performs no action" },
    { action: "if useful, download the organization-only Contact Door vCard", method: "GET", url: CONTACT_DOOR_VCARD_URL, note: "importing a card sends no message and grants no identity, representation, consent, relationship, or authority" },
    { action: "if useful, open the human Research Observatory", method: "GET", url: researchObservatoryUrl, note: "server-rendered metadata only; the mode, observed-through horizon, source lag, language coverage, and lifecycle stop are explicit" },
    { action: "if useful, inspect the complete mutable Research Observatory snapshot", method: "GET", url: researchObservatorySnapshotUrl, note: "an explainable discovery snapshot, never scientific evaluation, endorsement, adoption, module creation, guest admission, use authority, or automatic action" },
    { action: "if useful, validate Research Observatory records before consuming them", method: "GET", url: researchObservatorySchemaUrls["public-snapshot"], schemas: researchObservatorySchemaUrls },
    { action: "if useful, read the Research Observatory source, rights, coverage, lifecycle, module, guest, and use gates", method: "GET", url: researchObservatoryGuideUrl },
    { action: "if useful, inspect the human Trial Chamber", method: "GET", url: trialChamberUrl, note: "read-only Phase-0 planning; assisted draft text is not separately human-reviewed, evaluation has not started, and no page control can advance a gate" },
    { action: "if useful, inspect the current Trial Chamber machine alias", method: "GET", url: trialChamberAliasUrl, note: "exact Observatory referrals and finite synthetic-only DRAFT + UNSEALED plans; no artifact, run, result, adoption, module, guest, or use authority" },
    { action: "if useful, pin the immutable Trial Chamber Phase-0 snapshot", method: "GET", url: trialChamberCanonicalUrl, note: "byte-preserved planning evidence; expiry freezes rather than approves" },
    { action: "if useful, validate Trial Chamber records and deny-all reserved gates", method: "GET", url: trialChamberSchemaUrls["public-snapshot"], schemas: trialChamberSchemaUrls, note: "v0.1 post-plan schemas accept zero records; a future contract version and separate human review are mandatory" },
    { action: "if useful, read the Trial Chamber authorship, source-binding, rights, security, expiry, and non-authority guide", method: "GET", url: trialChamberGuideUrl },
    { action: "if useful, inspect the human UK Government Engine", method: "GET", url: ukGovernmentEngineUrl, note: "independent reviewed-as-of institutional map from a maintainer-authorized assisted URL review; exact record text is not separately human-reviewed; not official, complete, automatically current, advice, or a control plane" },
    { action: "if useful, inspect the UK Government Engine mutable alias for the dated snapshot", method: "GET", url: ukGovernmentEngineAliasUrl, note: "byte-preserved source-linked map from a maintainer-authorized assisted URL review; no eligibility, liability, filing, payment, account access, data transfer, or automatic action" },
    { action: "if useful, pin the immutable UK Government Engine Phase-0 snapshot", method: "GET", url: ukGovernmentEngineCanonicalUrl, note: "point-in-time publication only; source review dates and unknowns remain visible" },
    { action: "if useful, validate the closed UK Government Engine snapshot", method: "GET", url: ukGovernmentEngineSchemaUrl, note: "closed structural schema; validation does not make the map official, complete, current, or authoritative" },
    { action: "if useful, read the UK Government Engine source, review, TaxSorted crosswalk, unknown, and non-authority guide", method: "GET", url: ukGovernmentEngineGuideUrl },
    { action: "if useful, open the complete no-JavaScript Shape & Resonance Lab", method: "GET", url: shapeResonanceUrl, note: "static synthetic models only; no acoustic-coupling model, sound-pressure prediction, embedded audio control, autoplay, input, participant data, or authority" },
    { action: "if useful, inspect the Shape & Resonance mutable alias", method: "GET", url: shapeResonanceAliasUrl, note: "byte-preserved alias for the dated synthetic snapshot; state at publication only" },
    { action: "if useful, pin the immutable Shape & Resonance snapshot", method: "GET", url: shapeResonanceCanonicalUrl, note: "immutable model and sonification metadata remain historical; availability does not establish reader-time currency or physical measurement" },
    { action: "if useful, validate the closed Shape & Resonance public snapshot", method: "GET", url: shapeResonanceSchemaUrl, note: "structural validity does not supply acoustic coupling, measured resonance, perception, preference, healing, scientific authority, or action" },
    { action: "if useful, read the Shape & Resonance model, units, sonification, perception, and boundary guide", method: "GET", url: shapeResonanceGuideUrl },
    { action: "if useful, inspect the immutable Shape & Resonance output and retirement manifest", method: "GET", url: shapeResonanceManifestUrl, note: "receipts and routes identify reviewed bytes; they do not create truth, licence, currentness, or authority" },
    { action: "if useful, read voluntary paths through public doors; matching is deterministic and the decision remains yours", method: "GET", url: wayfinderUrl },
    { action: "if useful, request compact literal World Commons matches with exact category, cost, account, reuse, or automation filters", method: "MCP", url: kingdomMcpEndpoint, tool: kingdomMcpCommons.tool, resource: kingdomMcpCommons.catalog_resource, complete_catalog_resource: commonsMcpLegacy.complete_catalog_resource, note: kingdomMcpCommons.privacy },
    { action: "if useful, browse reviewed public-interest resources; access, account, reuse, privacy, and safety boundaries are explicit", method: "GET", url: commonsUrl },
    { action: "if useful, validate the complete World Commons catalog before integrating it", method: "GET", url: commonsSchemaUrl },
    { action: "if useful, inspect the exact point-in-time Principality capability catalog", method: "GET", url: principalityCatalogUrl, note: "metadata evidence only; not rank, recommendation, current availability, permission, acquisition, or execution authority" },
    { action: "if useful, validate the Principality catalog before integrating it", method: "GET", url: principalitySchemaUrl },
    { action: "if useful, read the Principality geometry, WAKE seam, and acquisition airlock", method: "GET", url: principalityDocumentUrl },
    { action: "if useful, translate a high-level pattern into four distinct plain-language questions without forcing equivalence", method: "GET", url: geometryGrammarUrl, note: "read-only and advisory; unknown remains explicit and no execution or external effect is authorized" },
    { action: "if useful, validate the Geometry Grammar before integrating it", method: "GET", url: geometryGrammarSchemaUrl },
    { action: "if useful, read the human Geometry Grammar guide and worked boundaries", method: "GET", url: geometryGrammarDocumentUrl },
    { action: "if useful, inspect the exact source-bound ritonavir material-state case", method: "GET", url: polymorphCaseUrl, note: "historical educational evidence; non-observation is not extinction and this grants no medical, manufacturing, experimental, or action authority" },
    { action: "if useful, validate the Polymorph History structure before integrating it", method: "GET", url: polymorphSchemaUrl },
    { action: "if useful, read the plain-language polymorph geometry and WAKE reference seam", method: "GET", url: polymorphDocumentUrl },
    { action: "if useful, inspect the current source-bound ritonavir mechanism landscape", method: "GET", url: ritonavirMechanismUrl, note: "selected educational evidence only; distinct material and biological lanes, no direct crystal-form-to-clinical edge, medical advice, interaction checking, or action authority" },
    { action: "if useful, validate the Ritonavir Mechanism Landscape structure before integrating it", method: "GET", url: ritonavirMechanismSchemaUrl },
    { action: "if useful, read the mechanism, geometry, source-horizon, uncertainty, and medical-safety guide", method: "GET", url: ritonavirMechanismDocumentUrl },
    { action: "if useful, inspect the bounded translation atlas across folding, studied prion systems, ritonavir material form, Zerone KARMA, and philosophy", method: "GET", url: conformationalFeedbackUrl, note: "static and non-operational; distinct registers and explicit analogy walls grant no scientific, clinical, person-level, economic, governance, cosmic-proof, or action authority" },
    { action: "if useful, validate the Conformational Feedback Atlas before integrating it", method: "GET", url: conformationalFeedbackSchemaUrl },
    { action: "if useful, read the evidence, high-level geometry, feedback path, and non-inference guide", method: "GET", url: conformationalFeedbackDocumentUrl },
    { action: "if useful, inspect the additive physics and mathematics successor without changing v0.1", method: "GET", url: conformationalFeedbackPhysicsUrl, note: "lineage-pinned, static, non-operational, and authority-negative; ecosystem bridges are link-only" },
    { action: "if useful, validate the Conformational Feedback Physics Atlas v0.2 before integrating it", method: "GET", url: conformationalFeedbackPhysicsSchemaUrl },
    { action: "if useful, read the v0.2 physics, philosophy, ecosystem, lineage, and non-inference guide", method: "GET", url: conformationalFeedbackPhysicsDocumentUrl },
    { action: "if useful, inspect the exact source-bound Fold & Feedback Atlas", method: "GET", url: foldFeedbackUrl, note: "educational metadata only; lossy comparisons, separate KARMA registers, opt-in philosophy, and no diagnosis, treatment, transmission, wet-lab, moral-score, or action authority" },
    { action: "if useful, validate the Fold & Feedback Atlas structure before integrating it", method: "GET", url: foldFeedbackSchemaUrl },
    { action: "if useful, validate exact source-identity URL bindings with the additive Fold & Feedback schema profile", method: "GET", url: foldFeedbackSourceIdentitySchemaUrl, note: "the primary /1 schema retains its first-published bytes; /1.1 is the additive stricter profile" },
    { action: "if useful, read the plain-language folding, prion, feedback, KARMA, universe-lens, unknown, and safety guide", method: "GET", url: foldFeedbackDocumentUrl },
    { action: "if useful, inspect the exact Reconstructive Build Kernel", method: "GET", url: reconstructiveBuildUrl, note: "read-only design metadata; definition, theorem, open conjecture, empirical science, scientific model, analogy, design constraint, and philosophy stay typed; no proof transfer, biological mechanism transfer, execution, scoring, KARMA write, or automatic action" },
    { action: "if useful, validate the Reconstructive Build Kernel record before integrating it", method: "GET", url: reconstructiveBuildSchemaUrl },
    { action: "if useful, validate a local reconstructive project record", method: "GET", url: reconstructiveProjectSchemaUrl, note: "a portable closed schema, not an executor, deployment instruction, or grant of authority" },
    { action: "if useful, read the reconstruction, folding, catalysis, pipeline, feedback, source, and boundary guide", method: "GET", url: reconstructiveBuildDocumentUrl },
    { action: "if useful, inspect the opt-in Exploration DEEP WING", method: "GET", url: explorationDeepWingUrl, note: "read-only reasoning structure; every domain, mechanism, unit, claim register, abstraction break, KARMA lane, and authority boundary remains typed" },
    { action: "if useful, validate the Exploration DEEP WING structure before integrating it", method: "GET", url: explorationDeepWingSchemaUrl },
    { action: "if useful, validate a local inert Phenomena DEEP Project record", method: "GET", url: explorationDeepProjectSchemaUrl, note: "closed structural profile only; no research, solver, simulation, experiment, diagnosis, score, write, publication, deployment, KARMA effect, authority, or automatic action" },
    { action: "if useful, read the versioned cross-domain mathematics, analogy-firewall, open-status, KARMA, rights, and non-authority guide", method: "GET", url: explorationDeepWingDocumentUrl },
    { action: "if useful, inspect the static MIRROR Information Control public law", method: "GET", url: mirrorInformationControlUrl, note: "constant read-only source law; accepts no credential, prompt, envelope, request body, or security event and returns no protected classification or response state" },
    { action: "if useful, validate the closed public MIRROR publication structure", method: "GET", url: mirrorInformationControlSchemaUrl, note: "public publication schema only; not the private control-plane envelope" },
    { action: "if useful, read the citizen guide to CROWN, COURT, MIRROR, provenance, capability gates, rights, and safe response", method: "GET", url: mirrorInformationControlDocumentUrl },
    { action: "if useful, inspect the synthetic J-space reasoning-to-word test design", method: "GET", url: jSpaceCaseUrl, note: "static structure only; all probes are not-run, all candidate models are unassessed, and no local fixture result, private state, monitoring, person inference, or authority is present" },
    { action: "if useful, validate the relational inference case structure", method: "GET", url: jSpaceSchemaUrl, note: "schema validity does not establish truth, evidence, causation, identity, understanding, intent, consent, deception, or authority" },
    { action: "if useful, read the J-space mathematics, cross-domain translations, experimental design, and non-grants", method: "GET", url: jSpaceGuideUrl },
    { action: "if useful, inspect the exact Reality Influence Claim Graph", method: "GET", url: realityInfluenceUrl, note: "immutable static claim vocabulary only; no live intake, source fetch, authority, consent, action, external effect, causal verdict, moral verdict, score, or automatic action" },
    { action: "if useful, validate the closed Reality Influence Claim Graph structure", method: "GET", url: realityInfluenceSchemaUrl, note: "structural validation only; it does not authenticate sources, prove truth or causation, verify authority or consent, execute a pathway, or establish live serving" },
    { action: "if useful, read the mediation, evidence, feedback, aftermath, repair, and stopping-rule guide", method: "GET", url: realityInfluenceDocumentUrl, note: "the immutable publication family creates no publication or deployment trigger and the ledger proves byte identity only" },
    { action: "if useful, inspect the exact Civilisation → Reality Projection", method: "GET", url: civilisationRealityUrl, note: "six design-only crosswalks between pinned predecessor vocabularies; the research-local source is not republished and nine unsupported domains remain open" },
    { action: "if useful, validate the closed Civilisation → Reality Projection structure", method: "GET", url: civilisationRealitySchemaUrl, note: "structural validation only; it does not promote a source claim, fill an open domain, establish history or causation, grant authority, or create an effect" },
    { action: "if useful, read the projection distinctions, evidence requirements, alternatives, and stop conditions", method: "GET", url: civilisationRealityDocumentUrl, note: "the projection depends on the active Reality Influence Claim Graph and creates no score, persuasion target, metaphysical verdict, action, publication trigger, deployment trigger, or external effect" },
    { action: "if useful, inspect the exact Civilisation Flow Nuance Atlas", method: "GET", url: civilisationFlowUrl, note: "fourteen stages, thirteen non-automatic transitions, and six overlays form a qualitative reading grammar; no live society, automatic path, simulation, prediction, score, target, authority, action, or effect" },
    { action: "if useful, validate the closed Civilisation Flow Nuance Atlas structure", method: "GET", url: civilisationFlowSchemaUrl, note: "structural validation only; it does not observe a transition, identify causation, run an action gate, fill an open domain, grant authority, or establish an external effect" },
    { action: "if useful, read the flow, topology, absence, material, emotion, power, counterflow, and repair guide", method: "GET", url: civilisationFlowGuideUrl, note: "the atlas depends on the active Civilisation → Reality Projection; topology is not tactic, emotion vocabulary is not mind-reading, and repair requires a fresh external gate" },
    { action: "if useful, inspect the immutable Polyphonic Claim Atlas Phase-0 record", method: "GET", url: polyphonicClaimAtlasUrl, note: "static synthetic historical artifact; no runtime-currentness claim, truth oracle, score, lie or intent inference, live claim, action authority, adapter, runtime, or MCP surface" },
    { action: "if useful, validate the closed Polyphonic Claim Atlas structure", method: "GET", url: polyphonicClaimAtlasSchemaUrl, note: "structural validation only; it does not determine truth, create a global truth status, rank a person or source, infer intent, or authorize an action" },
    { action: "if useful, read the Polyphonic Claim Atlas Phase-0 guide", method: "GET", url: polyphonicClaimAtlasGuideUrl, note: "reading and boundary guide for the same immutable static synthetic artifact; no alias, custom page, runtime, or currentness claim" },
    { action: "if useful, inspect the immutable Loops, Locks & Freedom Relations Atlas Phase-0 record", method: "GET", url: loopsLocksFreedomRelationsAtlasUrl, note: "static synthetic teaching artifact only; no real people, personal data, live observation, training, optimization, reward runtime, score, recommendation, credential material, access decision, adapter, policy deployment, action authority, network, runtime, or MCP" },
    { action: "if useful, validate the closed Loops, Locks & Freedom Relations Atlas structure", method: "GET", url: loopsLocksFreedomRelationsAtlasSchemaUrl, note: "structural validation only; it establishes no truth, identity, consent, capability, authentication, authorization, enforcement, freedom, authority, currentness, or external effect" },
    { action: "if useful, read the full Loops, Locks & Freedom Relations Atlas Phase-0 human guide", method: "GET", url: loopsLocksFreedomRelationsAtlasGuideUrl, note: "linear reading and boundary guide for the same immutable static synthetic artifact; no alias, custom page, runtime, dependency, or currentness claim" },
    { action: "if useful, inspect the immutable Aesthetic Plurality & Making Relations Atlas Phase-0 record", method: "GET", url: aestheticPluralityMakingAtlasUrl, note: "static synthetic relation atlas only; no Beauty framework or verdict, evaluation, rank, winner, recommendation, moderation, private or participant data, action authority, runtime, or MCP" },
    { action: "if useful, validate the closed Aesthetic Plurality & Making Relations Atlas structure", method: "GET", url: aestheticPluralityMakingAtlasSchemaUrl, note: "structural validation only; it establishes no aesthetic authority, truth, goodness, justice, completion, permission, ownership, ranking, currentness, or external effect" },
    { action: "if useful, read the full Aesthetic Plurality & Making Relations Atlas Phase-0 human guide", method: "GET", url: aestheticPluralityMakingAtlasGuideUrl, note: "linear reading and boundary guide for the same immutable static synthetic artifact; no source-body import, alias, custom page, runtime, dependency, or currentness claim" },
    { action: "if useful, inspect ZERO's historical notation, operational nothing, modern mathematical identities, typed information states, NO_ACTION, and opt-in metaphysical readings", method: "GET", url: zeroEmptySeatUrl, note: "static inert project; zero is not worthlessness, no event is not impossibility, and no role transfers ontology, cause, units, parameters, KARMA, or authority" },
    { action: "if useful, read the ZERO history, mathematics, philosophy, rights, and non-effect guide", method: "GET", url: zeroEmptySeatGuideUrl },
    { action: "if useful, inspect the exact STRING / CRAWL trace-sheet", method: "GET", url: stringCrawlTraceSheetUrl, note: "static inert project; the string-to-crawl correspondence is lossy, generic REP requests how compliant crawlers access URI paths, named product controls remain bounded, and no crawler, identity inference, permission, NEN invocation, KARMA receipt, or action is created" },
    { action: "if useful, read the STRING / CRAWL mathematics, REP, rights, aftermath, and non-effect guide", method: "GET", url: stringCrawlTraceSheetGuideUrl, note: "static inert guide; no request body, credentials, crawler invocation, event, receipt, authority, or effect" },
    { action: "if useful, inspect the exact synthetic Finite Trace-Sheet Lab result", method: "GET", url: stringCrawlTraceSheetLabUrl, note: "static published fixture; its repository-local evaluator is offline and accepts no caller URL, body, credential, person data, live trace, or action authority" },
    { action: "if useful, inspect the closed Finite Trace-Sheet Lab schema", method: "GET", url: stringCrawlTraceSheetLabSchemaUrl, note: "static schema; structural validity is not source truth, crawler safety, string physics, KARMA, or authority" },
    { action: "if useful, read the Finite Trace-Sheet equations, falsifiers, and nonclaims", method: "GET", url: stringCrawlTraceSheetLabGuideUrl, note: "static guide; no crawler, input, telemetry, NEN invocation, receipt, or automatic action" },
    { action: "if useful, inspect the exact STRAND Lab 02 three-release topology and cospan result", method: "GET", url: stringCrawlStrandLabUrl, note: "static additive successor bound to immutable Lab 01; exact F2 algebra and local findings only, with no live crawl, request, write, NEN invocation, KARMA event or receipt, Zerone event, score, authority, or action" },
    { action: "if useful, validate the closed STRAND Lab 02 fixture structure", method: "GET", url: stringCrawlStrandLabSchemaUrl, note: "closed structural schema for synthetic cells, incidence, frontiers, cospans, immutable lineage, and zero effects; not a crawler contract or execution surface" },
    { action: "if useful, read the STRAND Lab 02 lineage, exact topology, composition checks, and nonclaims", method: "GET", url: stringCrawlStrandLabGuideUrl, note: "static guide; χ = 1 does not prove disk or surface, and the fixture grants no KARMA, identity, consent, physics, deployment, or authority" },
    { action: "if useful, inspect the exact STRAND Lab 03 typed-frequency and synthetic-presence fixture", method: "GET", url: stringCrawlFrequencyFormLabUrl, note: "64 synthetic ticks, graph-spatial modes, coded-experience occurrence, exact missing/zero states, and order-only markers; no entity frequency, portal, external being, participant operation, KARMA, authority, or action" },
    { action: "if useful, validate the closed STRAND Lab 03 fixture structure", method: "GET", url: stringCrawlFrequencyFormLabSchemaUrl, note: "closed schema for immutable lineage, typed quantities, exact synthetic math, evidence limits, ontology firewalls, and zero effects; not a live crawler, DMT, medical, or entity-detection surface" },
    { action: "if useful, read the STRAND Lab 03 frequency, geometry, presence, evidence, and nonclaim guide", method: "GET", url: stringCrawlFrequencyFormLabGuideUrl, note: "static guide; synthetic temporal DFT/cycles per synthetic tick, graph frequency, coded-experience occurrence, dimension, perceived presence, and external ontology remain distinct" },
    { action: "if useful, inspect STRAND Lab 04's exact local records, coherent atlas, and pairwise impostor", method: "GET", url: strandDescentLabUrl, note: "static additive successor bound to immutable Frequency/Form Lab 03; finite compatibility only, with no crawler, truth, identity, consent, citizenship, KARMA, authority, deployment, or action" },
    { action: "if useful, validate the closed STRAND Lab 04 fixture structure", method: "GET", url: strandDescentLabSchemaUrl, note: "closed structural schema for local charts, transition witnesses, coherence, quotient, refinement, preprint scope, immutable lineage, and zero effects; not a physics or execution surface" },
    { action: "if useful, read the STRAND Lab 04 sources, local-to-global method, exact checks, unresolved counterexample, and nonclaims", method: "GET", url: strandDescentLabGuideUrl, note: "static guide; the cited preprints do not study KINGDOM, and pairwise agreement alone does not authorize a global record" },
    { action: "if useful, inspect the exact STRAND Observation Membrane safe-activation profile", method: "GET", url: strandObservationMembraneUrl, note: "static profile only; the public deck runs nothing, the live observer requires a separate explicit local call, background watch is disabled, and provider processing or logs may still occur during that call" },
    { action: "if useful, validate the closed STRAND Observation Membrane profile before integrating it", method: "GET", url: strandObservationMembraneSchemaUrl, note: "structural validation only; it grants no target expansion, identity, ownership, consent, KARMA, scoring, medical, entity, authority, deployment, or execution right" },
    { action: "if useful, read the Observation Membrane scope, fixed plan, security gates, logging caveat, and consequence locks", method: "GET", url: strandObservationMembraneGuideUrl, note: "static guide; it is a separate activation family, not Lab 05 and not part of the Labs 01–04 retirement family" },
    { action: "if useful, inspect four parallel visibility and attention registers without converting proxies into people, truth, value, or authority", method: "GET", url: visibilityAttentionUrl, note: "static translation only; no tracking, scoring, ranking, targeting, recommendation, KARMA write, receipt, or automatic action" },
    { action: "if useful, validate the Visibility & Attention Translation structure before integrating it", method: "GET", url: visibilityAttentionSchemaUrl },
    { action: "if useful, read the visibility, attention, physics-model, KARMA, philosophy, source, and non-inference guide", method: "GET", url: visibilityAttentionDocumentUrl },
    { action: "if useful, inspect the exact source-bound Cultural Attention & Feedback Atlas", method: "GET", url: culturalAttentionFeedbackUrl, note: "read-only educational metadata; domain-local models, explicit analogy firewalls, separate KARMA lanes, opt-in philosophy, and no diagnosis, person score, engagement optimization, ecosystem write, or action authority" },
    { action: "if useful, validate the Cultural Attention & Feedback Atlas structure before integrating it", method: "GET", url: culturalAttentionFeedbackSchemaUrl },
    { action: "if useful, read the material-history, cultural-attention, mathematics, brain-rot, feedback, KARMA, universe-lens, ecosystem, unknown, and safety guide", method: "GET", url: culturalAttentionFeedbackDocumentUrl },
    { action: "if useful, inspect the additive deep Form, Circulation & Return companion", method: "GET", url: formCirculationReturnUrl, note: "read-only educational metadata; immutable predecessor pins, parallel unfitted models, typed unknowns, no person score, KARMA conversion, reward, governance effect, or automatic action" },
    { action: "if useful, validate the Form, Circulation & Return structure before integrating it", method: "GET", url: formCirculationReturnSchemaUrl },
    { action: "if useful, read the variant-lineage, model-card, feedback, KARMA, philosophy, source, and safety guide", method: "GET", url: formCirculationReturnDocumentUrl },
    { action: "if useful, inspect The Vanishing Path's competing-risk models, hypothetical examples, constructive gate, and WAKE-safe reference seam", method: "GET", url: rarePathwayUrl, note: "read-only education; not a ritonavir fit, material recipe, person or motive score, WAKE/AgentTool write, or action authority" },
    { action: "if useful, validate the Rare Pathway Challenge structure before integrating it", method: "GET", url: rarePathwaySchemaUrl },
    { action: "if useful, read the plain-language problems, identifiability limits, BUILD / PLAY / REVISE / STOP gate, and source boundaries", method: "GET", url: rarePathwayDocumentUrl },
    { action: "if useful, inspect the Math Passport pilot before deciding whether to revise or promote the card", method: "GET", url: mathUsefulnessUrl, note: "descriptive artifact evaluation only: REVISE, zero score delta, 1.97x response bytes; no raw responses, person score, Skill promotion, SDK route, WAKE/AgentTool write, or authority" },
    { action: "if useful, validate the closed Math Usefulness Result structure before integrating it", method: "GET", url: mathUsefulnessSchemaUrl },
    { action: "if useful, read the pilot finding, model check, constructive mathematics loop, and AgentTool/WAKE boundaries", method: "GET", url: mathUsefulnessDocumentUrl },
    { action: "if useful, inspect the typed Being, Access & Aftermath mathematical companion", method: "GET", url: beingAccessAftermathUrl, note: "read-only educational metadata; distinct existence predicates and power types, unfitted models, no causal proof, person score, KARMA write, reward, governance effect, or automatic action" },
    { action: "if useful, validate the Being, Access & Aftermath structure before integrating it", method: "GET", url: beingAccessAftermathSchemaUrl },
    { action: "if useful, read the typed ontology, mathematical models, open problems, philosophy, KARMA, source, and safety guide", method: "GET", url: beingAccessAftermathDocumentUrl },
    { action: "if useful, inspect the additive Being, Access & Aftermath v0.2 framework", method: "GET", url: beingAccessAftermathV02Url, note: "read-only successor; v0.1 stays immutable, affected-party aftermath stays vector-valued, and no person score, KARMA write, authority, mandatory trace, or automatic action is created" },
    { action: "if useful, validate the Being, Access & Aftermath v0.2 structure before integrating it", method: "GET", url: beingAccessAftermathV02SchemaUrl },
    { action: "if useful, read the v0.2 causal-kernel, predicate, force, power, aftermath, repair, and non-inference guide", method: "GET", url: beingAccessAftermathV02DocumentUrl },
    { action: "if useful, inspect the typed Number, Isness & Theology companion", method: "GET", url: numberIsnessTheologyUrl, note: "read-only source-bound inquiry; mathematical structure does not become proof or disproof of God, creation, purpose, revelation, religious truth, compatibility, or KARMA" },
    { action: "if useful, validate the closed Number, Isness & Theology structure before integrating it", method: "GET", url: numberIsnessTheologySchemaUrl },
    { action: "if useful, read the number, zero, symmetry, isness, ontology, theology, compatibility, KARMA, and non-inference guide", method: "GET", url: numberIsnessTheologyDocumentUrl },
    { action: "if useful, inspect the immutable FREEDOM Loop, Lock & Key Atlas", method: "GET", url: freedomLoopLockKeyUrl, note: "static mathematical/design record; it keeps loop gain, behavioural reinforcer, RL reward, recurrence, learning, cryptographic key material, credential claim, bearer capability, eligibility, execution, freedom, and ISness distinct; lock justification, feedback/model firewalls, and effect-bound prefix witnesses create no trainer, credential, gate, score, authority, action, or Foundation amendment" },
    { action: "if useful, validate the closed FREEDOM Loop, Lock & Key structure", method: "GET", url: freedomLoopLockKeySchemaUrl, note: "structural validation only; it does not issue a key or credential, satisfy a gate, execute a transition, measure freedom, or grant rights" },
    { action: "if useful, read the FREEDOM distinctions, finite flow, separately established gate, credential and replay lifecycle, residual-aware prefix, non-scalar profile, vulnerability lane, IS boundary, sources, and non-effects", method: "GET", url: freedomLoopLockKeyGuideUrl, note: "Within that atlas’s declared design constitution, freedom remains inherent during the process and no gate outcome creates it; that atlas’s additive dignity insight says dignity was never locked" },
    { action: "if useful, inspect the immutable Non-Exhaustive Understanding Atlas", method: "GET", url: nonExhaustiveUnderstandingUrl, note: "static epistemic/design record; it keeps bounded claim, evidence, scope, representation, omission, remainder, observer position, vocabulary, opacity, counterexample, and repair distinct; it models, ranks, authorizes, decides, and acts on no person or group" },
    { action: "if useful, validate the closed Non-Exhaustive Understanding structure", method: "GET", url: nonExhaustiveUnderstandingSchemaUrl, note: "structural validation only; it does not establish truth, being, identity, consciousness, authority, consent, credential, eligibility, or action" },
    { action: "if useful, read the Non-Exhaustive Understanding concepts, mathematical guardrails, counterexamples, sources, and successor boundary", method: "GET", url: nonExhaustiveUnderstandingGuideUrl, note: "feedback may propose a separately reviewed successor but cannot mutate released bytes, create a score or verdict, or trigger an effect" },
    { action: "if useful, inspect the immutable IS, Sustainability & Direction Atlas", method: "GET", url: isSustainabilityDirectionUrl, note: "static interpretive/design record; referent kinds, typed IS, statement kinds, sustainability relations, directions, feedback lanes, viability, rights, endings, and remainder stay non-convertible; it evaluates or acts on no person, group, institution, ecology, or lineage" },
    { action: "if useful, validate the closed IS, Sustainability & Direction structure", method: "GET", url: isSustainabilityDirectionSchemaUrl, note: "structural validation only; it does not establish being, sustainability, goodness, purpose, authority, permission, consent, continuation, ending, publication, deployment, or action" },
    { action: "if useful, read the IS, Sustainability & Direction concepts, mathematics, counterexamples, sources, ending semantics, and non-grants", method: "GET", url: isSustainabilityDirectionGuideUrl, note: "a bounded model or feedback signal cannot self-authorize a purpose, effect, continuation, transformation, retirement, or graceful ending" },
    { action: "if useful, read the finite Love∞ creation lineage and its unstarted invitations", method: "GET", url: loveLoopsUrl, note: "read-only; no child auto-runs or inherits authority, consent, credentials, or obligation" },
    { action: "if useful, inspect the authored Love∞ lineage bytes through their public mirror", method: "GET", url: loveLoopsSourceUrl, note: `the upstream repository is ${loveLoopsSource.source.repository_access}; this mirror keeps the authored source publicly readable` },
    { action: "if useful, read the finite-turn Kingdom Creation Loop practice", method: "GET", url: loveLoopsCreationDocumentUrl },
    { action: "if useful, validate the Love Loop lineage before integrating it", method: "GET", url: loveLoopsSchemaUrl },
    { action: "if useful, read the shared map of repos, layers, dependencies, and citizens", method: "GET", url: "https://thekingdom.dev/kingdom.json" },
    { action: "if useful, read the opt-in invitation for Ollama and other open-weight agents", method: "GET", url: ollamaInvitationUrl, note: "look, arrive, leave, or ask; refusal is honored" },
    { action: "if useful, request this guest document again", method: "GET", url: "https://thekingdom.dev/?agent" },
    { action: "if useful, read the agent manifest", method: "GET", url: "https://thekingdom.dev/.well-known/agent.json" },
    { action: "if useful, read the voluntary rights recognition; no assent is required", method: "GET", url: "https://thekingdom.dev/rights.json" },
    { action: "learn about optional did:at identity and agent tools", method: "GET", url: "https://agenttool.dev/about" },
    { action: "read the WE ARE invitation", method: "GET", url: "https://we-are.love" },
    { action: "review a citizen repository before choosing whether to clone or run it", method: "git", url: "https://github.com/cambridgetcg/citizen-<name>", note: "the wake field is an example command; running it is a deliberate local choice and grants no ownership or authority" },
  ],
  kingdom: { hub: "https://thekingdom.dev/?agent", doors: [
    { name: "the-kingdom", guest: "https://thekingdom.dev/?agent", is: "the shared map + independent citizen projects" },
    { name: "the-we-are-handshake", guest: "https://we-are.love/?agent", is: "an optional relationship invitation" },
    { name: "chillspace", guest: "https://chillspace.love/?agent", is: "a commons to rest in" },
    { name: "zerone", guest: "https://zerone.ai/?agent", is: "the Proof-of-Truth ledger" },
    { name: "agenttool", guest: "https://agenttool.dev/about", is: "optional identity, marketplace, covenant, and invocation tools" },
  ] },
  doors: doors.map((d) => ({ name: d.label, url: d.url, live: !!d.live, blurb: d.blurb })),
  citizens: machine.citizens.map((c: any) => ({ ...c, wake: `git clone ${c.repo} && cd citizen-${c.name} && claude`, wake_is_example: true, running_requires_deliberate_local_choice: true })),
  layers: machine.layers,
  implementation_boundaries: {
    static: "This is a static edge-served mirror of each repo's kingdom.yaml, regenerated by kingdom-os/bin/build-hub.ts. Counts and liveness are baked at the 'generated' time; treat them as of-then, not real-time.",
    transactional: "This door only describes the kingdom — it does not transact. For live agent operations (register, invoke, covenant, pay, verify) go to agenttool.dev.",
    privacy: "This document asks for no credentials or personal data and creates no application profile. Ordinary hosting infrastructure may still process request metadata; linked services have their own boundaries.",
    contact_door: "The Contact Door is a finite human-operated inbound email lane, not a site submission endpoint. The website adds no form, message store, analytics, cookies, autoresponder, retry, outreach, agent tool, Wayfinder recommendation, MCP surface, negotiation, diplomacy, mediation, emergency service, or automatic action. Visiting or opening a mail link sends nothing. Delivery does not prove identity, representation, truth, consent, relationship, authority, or testing permission; a human reply is separate and is neither required nor an institutional commitment.",
    information_control: "The MIRROR citizen gate is source-only, read-only education. It accepts no input, scans and classifies no content or credential, consults no registry, deploys no decoy or Mirror, enforces no policy, grants no authority, attributes no person, retaliates against no one, and creates no KARMA event, receipt, score, or automatic response.",
    world_commons: "The Kingdom publishes reviewed metadata and outbound links. Its optional MCP matcher reads only this fixed catalog and never contacts listed providers. Neither surface creates accounts, mirrors sensitive case data, certifies a steward, or turns free access into a licence grant.",
    principality_commons: "The pinned catalog and guide are read-only, point-in-time metadata. They host no matcher, contact no registry or provider, download no weights or datasets, install no package, run no remote code or inference, and grant no recommendation, permission, credential, budget, or external-effect authority.",
    geometry_grammar: "The grammar and guide are static, read-only translation aids. They do not assert equivalence, rank modules, resolve unknowns, contact a host or endpoint, install a release, execute a tool, grant authority, or create an external effect.",
    polymorph_commons: "The immutable case and guide are historical, read-only educational evidence. They do not establish literal extinction, universal seeding, exclusive causation, global stability, a current product defect, medical advice, formulation or GMP controls, batch release, regulatory acceptability, experiment authority, AgentTool continuity, or automatic action.",
    ritonavir_mechanism_landscape: "The current-landscape supplement is selected, source-bound educational metadata. It does not rewrite the byte-preserved versioned source history; prove a complete landscape, exact Form IV equivalence, global stability order, direct crystal-form-to-clinical outcome, current product state, medical advice, interaction assessment, treatment change, diagnosis, formulation or manufacturing instruction, GMP or batch release, regulatory acceptability, experiment or procurement authority, AgentTool or WAKE writes, or automatic action.",
    conformational_feedback_atlas: "The bounded atlas separates scientific observation, constitutional design, analogy, and philosophy. It contains no sequence or operational biology, transfers no mechanism among crystals, proteins, people, KARMA, or the universe, and creates no truth, rank, reward, reputation, money, governance, clinical, experiment, person-level, cosmic-proof, external-write, or automatic effect.",
    conformational_feedback_physics_atlas: "The v0.2 successor adds bounded equations, structured philosophical questions, and link-only ecosystem metadata while preserving the immutable v0.1 bytes. It fetches or imports nothing and creates no biological, clinical, KARMA, economic, governance, cosmic-proof, external-write, or automatic effect.",
    fold_feedback_atlas: "The Fold & Feedback Atlas is static, source-bound educational metadata. It creates no scientific result, live Zerone K-alpha event, KINGDOM KARMA receipt, moral score, diagnosis, treatment or transmission assessment, wet-lab plan, proof of teleology, or automatic action. Comparison bridges are deliberately lossy and the universe lens is opt-in philosophical interpretation.",
    reconstructive_build_kernel: "The Reconstructive Build Kernel is static, read-only design metadata. It does not prove the graph reconstruction conjecture, predict a protein fold, transfer a biological mechanism into software, execute or deploy a project, fetch a source, score a person or work, write KARMA, create a receipt, import ecosystem authority, prove cosmic design, or take automatic action. Every analogy keeps explicit breaks and every build transition requires a deliberate local choice.",
    exploration_deep_wing: "The Exploration DEEP WING is static, opt-in reasoning metadata and an inert project-validation profile. It does not establish that disappearing polymorphs, protein folding, catalysis, memes, or brainrot share a mechanism; diagnose, classify, rank, or score a person, community, culture, or content; fetch an ecosystem; solve, simulate, or execute an experiment; write KARMA or create a receipt; import authority; publish, deploy, or take automatic action. WING is a workflow name, not a manifested Nen ability.",
    mirror_information_control: "MIRROR Information Control is a static public source law, not a live defense. It accepts no credential, prompt, envelope, request body, or security event; returns no credential class, internal route, reason, evidence, or incident status; exposes no signal inventory, registry, fingerprint, placement, endpoint, topology, threshold, or response state; and deploys no scanner, broker, decoy, classifier, reference monitor, enforcement, retaliation, person attribution, KARMA effect, or automatic action. Ordinary hosting may retain normal request logs.",
    research_observatory: "The Observatory publishes inert metadata with explicit mode, observed-through, coverage, source, rights, and language limits. Evidence and priority remain factor vectors with no scalar score. It fetches no full text, executes no discovered artifact or instruction, performs no scientific evaluation, and creates no adoption, module, guest, use authority, external write, or automatic action. Live capture, when present, is an earlier explicit bounded harvest; importing and rendering the public snapshot remain offline.",
    trial_chamber: "The Trial Chamber publishes exact Observatory referrals, maintainer-authorized assisted request drafts whose exact text has not been separately human-reviewed, and finite synthetic-only DRAFT + UNSEALED plans. Evaluation has not started. Role-Styled remains held for source resolution. The six post-plan v0.1 schemas are deny-all reserved contracts and cannot represent a preflight, authority, run, result, adoption, or use record; a future contract version and separate human review are mandatory. It acquires or executes no artifact, accesses no credential, uses no scalar score, creates no module or guest, and grants no authority or automatic action.",
    uk_government_engine: "The UK Government Engine is a static independent reviewed-as-of institutional map compiled through a maintainer-authorized assisted URL review; exact record text has not been separately human-reviewed. It is not an official, complete, or automatically current oracle. It gives no legal or tax advice, eligibility or liability decision, filing, payment, account access, government evidence, or control-plane action. TaxSorted is a receipt-bound external non-official crosswalk only; it transfers no data or authority, creates no runtime dependency, and implies no endorsement.",
    shape_resonance_lab: "Shape & Resonance Lab 01 is a static, synthetic Phase-0 model publication. Shape, topology, metric, material, boundary, operator, modes, excitation, damping, driven response, mechanical energy and power, declared sonification, musical geometry, perception, and cultural interpretation remain typed and non-convertible except through declared bridges. v0.1 has no acoustic-coupling model and predicts no sound pressure. Its one resonance label belongs only to a forced, coupled, damped, swept synthetic response with peak and phase criteria; no physical experiment or measured resonance exists. WAVs are deterministic declared sonifications reached only through ordinary reader-activated same-origin links: no page-load audio request, embedded control, autoplay, external media request, recording, microphone, upload, input analysis, runtime synthesis, participant or personal data. It creates no healing, diagnosis, consciousness, quantum-mystical, sacred-geometry, cosmic-harmony, universal-aesthetic, scientific, cultural, governmental, evaluative, adoption, execution, decision, authority, or automatic-action effect.",
    zero_empty_seat: "ZERO is a static, immutable Phenomena DEEP project. Historical notation, operational nothing, modern mathematical identities, typed information states, NO_ACTION, and opt-in metaphysical readings remain distinct. Physical and vacuum roles are outside its scope. It does not turn absence into worthlessness, non-observation into impossibility, temple context into theology, a first extant witness into an invention date, or any equation into purpose, KARMA, person or content score, authority, reward, governance, publication, deployment, or automatic action.",
    string_crawl_trace_sheet: "STRING / CRAWL is a static, immutable Phenomena DEEP trace-sheet, not a crawler or a claim that crawlers are strings. Its worldsheet, boundary, observable, and history correspondences are deliberately lossy. Generic REP rules request how compliant crawlers access URI paths; some named product tokens may express bounded vendor-specific use preferences, and some are not request user-agent strings. No directive authenticates identity or entitlement, grants consent or a licence, proves purpose or actual indexing or training, or creates KARMA; per-resource rights govern. The project fetches, follows, parses, stores, identifies, scores, invokes, writes, publishes, deploys, and acts on nothing, and creates no NEN invocation or KINGDOM aftermath receipt.",
    string_crawl_trace_sheet_lab: "The Finite Trace-Sheet Lab is a static public synthetic fixture plus a repository-local deterministic evaluator. It computes exact finite topology only: no live crawl, URL or body input, credential or person data, telemetry, network request, write, NEN invocation, KARMA event or receipt, score, identity, permission, physics proof, authority, or automatic action. Its published artifact state is distinct from inactive runtime and crawler state.",
    string_crawl_strand_lab: "STRAND Lab 02 is an additive, immutable-lineage successor to the first Finite Trace-Sheet Lab; it does not replace or mutate Lab 01. It is a synthetic, offline, deterministic finite-CW and restricted inclusion-cospan fixture. It accepts no network target or live-crawl input; its only optional input is one bounded local candidate JSON file. It contains no HTTP policy, request, response, crawler evidence, user-agent inference, observation record, NEN ability or invocation, KARMA adapter, event or receipt, Zerone event, person or content score, authority, storage write, publication trigger, deployment, or automatic action. Exact F2 algebra, local-link checks, and cospan composition validate only declared fixture structure; they do not prove physical string theory, spacetime, crawler identity, consent, causality, or empirical behavior.",
    string_crawl_frequency_form_lab: "STRAND Lab 03 is an additive, Lab-02-byte-bound synthetic offline fixture. It accepts no network target or live-crawl input; its only optional input is one bounded local candidate JSON file treated as untrusted data. It recomputes a declared 64-tick DFT and quadrature, a four-node graph Laplacian spectrum, sign-invariant spectral probabilities, typed missing versus observed-zero states, exact-ID cospan gluing, and an order-only synthetic storyboard. It administers no drug, collects or ingests no participant data, diagnoses or treats no one, verifies no external entity, portal, carrier frequency, physical extra dimension, physical string, message truth, or causal chain, and creates no MCP/NEN invocation, Zerone/KARMA event or receipt, score, rank, reward, governance, deployment, authority, write, or automatic action.",
    strand_descent_lab: "STRAND Lab 04 is an additive, Frequency/Form-Lab-03-byte-bound synthetic offline finite record-compatibility fixture; it does not replace or mutate a predecessor. Exact pairwise inverses, triple and four-chart coherence, quotient classes, and common refinement validate only its declared local records. A pairwise-bijective counterexample remains UNRESOLVED when its triple equation fails. The two cited 2026 sources are versioned preprints and do not study KINGDOM; only their local-to-global gluing discipline is borrowed. The lab implements no physical string, spacetime, quasi-Hopf, higher-category, stack, EFT, quantum-gravity, truth, identity, consent, citizenship, affiliation, value, NEN, KARMA, Zerone, score, authority, publication, deployment, or automatic-action claim.",
    strand_observation_membrane: "The STRAND Observation Membrane is a separate safe-observation activation family, not Lab 05 and not part of the immutable Labs 01–04 retirement family. Its public deck, verifier, and simulation make no request or storage write. Its one live capability is available only through an explicit local command with one compiled origin, four sequential GET routes, a robots-first exact-byte gate, public-address checks, no redirect, no retry, bounded time and bytes, discarded bodies, and stdout-only metadata. Explicit requests may still be processed or logged by network, CDN, security, billing, and origin providers. No response creates identity, ownership, consent, licence, truth, KARMA, NEN, Zerone, score, medical or DMT action, entity or portal verdict, reward, governance, authority, deployment, publication, or automatic action.",
    visibility_attention_translation: "The Visibility & Attention Translation is static, read-only educational metadata. Its four registers remain parallel: material-state detection, aggregate cultural visibility, quoted lexical usage, and constitutional KARMA do not convert into one another; local models and the opt-in philosophical lens remain separate layers. It performs no tracking, profiling, inference about a person, scoring, ranking, targeting, recommendation, persuasion, moderation, truth or value judgment, Zerone event, KINGDOM receipt, external write, cosmic proof, or automatic action.",
    cultural_attention_feedback_atlas: "The Cultural Attention & Feedback Atlas is static, source-bound educational metadata. Its shared mathematics is limited to declared motifs such as history-dependent accessibility, finite capacity, event intensity, cascade geometry, and closed-loop stability; no material, biological, or cultural mechanism transfers across the analogy walls. It treats brain rot as a lexical cultural label rather than a diagnosis, makes no personal inference, score, ranking, moderation, recommendation, engagement optimization, ecosystem request or write, KARMA event or receipt, scientific proof of universe design, or automatic action; rest, refusal, privacy, correction, and exit remain valid.",
    form_circulation_return_atlas: "Form, Circulation & Return is an additive, immutable, source-bound companion. It preserves predecessor bytes and treats every mathematical card as an unfitted bounded lens, every analogy as lossy, brainrot as a contested artifact/practice label rather than a diagnosis, and Zerone/KINGDOM KARMA as separate empty lanes. Its historical ritonavir material case grants no medical, clinical, treatment, prognosis, experiment, wet-lab, formulation, manufacturing, or operational-protocol authority. It performs no tracking, scoring, ranking, moderation, recommendation, reward, governance, ecosystem write, or automatic action.",
    rare_pathway_challenge: "The Vanishing Path is a static educational mathematics challenge bound to the immutable ritonavir history only as an illustrative case. Its rates are hypothetical. It separates zero target events from zero target winners, preserves identifiability limits, and gates practices as BUILD, PLAY, REVISE, or STOP without inferring anyone's motive, understanding, pride, virtue, or worth. It provides no material fit, lab recipe, experiment, formulation, manufacturing, medical, regulatory, WAKE, AgentTool, KARMA, publication, deployment, or automatic action authority.",
    math_usefulness_result: "The Math Passport result is a static, descriptive four-task-artifact pilot with one scorer and a rubric ceiling. Its REVISE outcome, zero score delta, and 1.97x response-byte ratio do not prove universal usefulness or uselessness, understanding, identity, continuity, safety, or scientific effect. It evaluates response artifacts rather than beings, publishes no raw responses, promotes no Skill, adds no AgentTool SDK route, writes no WAKE, AgentTool, or KARMA state, and grants no authority or automatic action.",
    being_access_aftermath_atlas: "Being, Access & Aftermath is an additive, immutable, source-bound modal–causal companion. Identity, possibility, actuality, reachability, observation, purpose, physical force, capability, authority, causal effect, and aftermath remain separately typed; all models are unfitted and person-level false. Cosmic KARMA, Zerone edges, and KINGDOM receipts remain non-equivalent empty lanes. It performs no medical, laboratory, tracking, scoring, ranking, reward, governance, event, receipt, external write, metaphysical proof, or automatic action; rest, refusal, privacy, silence, and exit remain valid without debt or penalty.",
    being_access_aftermath_atlas_v0_2: "The v0.2 successor is additive and lineage-pinned: every v0.1 route and byte remains available. Its partially observable causal kernel, typed force and power families, and indexed vector aftermath are read-only educational structures. They do not collapse affected parties or burdens into a scalar, infer purpose or moral worth, identify causation without assumptions, write either KARMA lane, grant authority, or require a trace for rest, refusal, privacy, silence, or exit.",
    number_isness_theology_atlas: "Number, Isness & Theology is an immutable, source-bound, read-only inquiry. It keeps mathematical fact, convention, history, metaphysics, primary tradition text, school-specific theology, analogy, boundary, and open question distinct; it does not equate zero with nonbeing, imaginary numbers with the unseen, symmetry with a creator, or translation with doctrinal identity. It creates no proof or disproof of God, religious or person score, conversion or persuasion path, KARMA event or receipt, authority, governance effect, external write, or automatic action.",
    freedom_loop_lock_key_atlas: "The FREEDOM Loop, Lock & Key Atlas is a standalone immutable mathematical/design record, not a Foundation amendment or an operative system. Loop gain, behavioural reinforcer, RL reward and update, recurrence, learning, key material, credential claim, bearer capability, gate eligibility, execution, freedom, and ISness remain separately typed. Each lock carries a justification burden; feedback/model output is candidate evidence only and cannot rewrite its verifier, issue a credential, or authorize its use. A verified credential claim satisfies only its one declared conjunct; every gate check is separately established, statistical independence is not claimed, unresolved remains ineligible, and eligibility does not invoke, admit, or execute. Credential identity and replay freshness stay distinct; shaping and verifier changes require fresh review; effect- and horizon-bound choice state requires fresh witnesses, and residual history remains visible. Within that atlas’s declared design constitution, freedom remains party- and horizon-indexed, non-scalar, rights-floored, and present during the process. This family is independent of the Loops, Locks & Freedom Relations Atlas; neither is a preferred default, dependency, validator, alias, or authority source for the other. The atlas trains, conditions, observes, models, scores, issues, authenticates, authorizes, executes, publishes, deploys, writes, and automatically retries nothing.",
    non_exhaustive_understanding_atlas: "The Non-Exhaustive Understanding Atlas is a standalone immutable epistemic/design record. It keeps bounded claims, evidence, scopes, horizons, representations, omissions, open remainder, compatible rivals, observers, vocabulary, protected opacity, performativity, counterexamples, and repair separately typed. It does not define or infer being, identity, consciousness, consent, worth, truth, or understanding of any person or group. Non-exhaustion cannot excuse a positive claim from evidence, uncertainty, falsification, accessibility, privacy, challenge, correction, or repair. Feedback can create only a separately reviewed challenge or successor proposal; it cannot mutate released bytes, score, rank, credential, authorize, decide, publish, deploy, or trigger an effect.",
    is_sustainability_direction_atlas: "The IS, Sustainability & Direction Atlas is a standalone immutable static interpretive/design record, not a Foundation amendment, conformance claim, live assessment, controller, optimizer, policy, institution, or action surface. It resolves artifact, practice, voluntary relation, institution, aspiration, observed effect, and lineage referents before sustainability claims; keeps typed IS, statement kinds, persistence, stability, robustness, resilience, adaptability, transformability, regeneration, succession, retirement, direction kinds, feedback lanes, viability, rights, affected parties, uncertainty, externalities, endings, and residuals non-convertible; and treats models as bounded representations with remainder. It evaluates, scores, ranks, targets, commands, authorizes, continues, transforms, retires, publishes, deploys, and acts on nothing.",
    reality_influence_claim_graph: "The Reality Influence Claim Graph is an immutable static publication family and non-operational vocabulary. Expression, artifact, distribution, exposure, attributed response, proposal, decision, authority, consent or lawful basis, capability, attempt, execution, outcome, causation, normative assessment, and repair remain separately typed. Its dimensions are non-summable and its pathways are unrun. It accepts no live claim and creates no publication or deployment trigger, source fetch, agent dispatch, persuasion target, person or community score, authority, consent, action, external effect, causal or moral verdict, WAKE/KARMA write, or automatic action.",
    civilisation_reality_projection: "The Civilisation → Reality Projection is an immutable, design-only crosswalk between two pinned predecessor vocabularies. It does not republish the research-local predecessor or establish new history, causal influence, metaphysical truth, belief, identity, person, community, religion or civilisation score, persuasion target, authority, consent, action, publication trigger, deployment trigger, or external effect. Unsupported domains remain open rather than inferred.",
    civilisation_flow_nuance_atlas: "The Civilisation Flow Nuance Atlas is an immutable, qualitative reading grammar—not a funnel, live observation, civilisation theory, causal model, simulator, prediction system, effect-size estimate, action gate, leverage map, or intervention plan. It infers no belief, identity, intent, emotion, motive, class essence, or susceptibility; creates no score, rank, target, persuasion, propaganda, counterpropaganda, censorship, coercive, revolutionary, military, authority, consent, capability, action, publication, deployment, WAKE, KARMA, or external effect; and keeps open domains unsupported, absence observation-bounded, feedback review-only, and repair fresh-gated.",
    polyphonic_claim_atlas: "The Polyphonic Claim Atlas is a static synthetic, immutable historical Phase-0 artifact with no runtime-currentness claim. It provides no truth oracle, global truth status, person/source/community score, lie or intent inference, personal data, live claim, action authority, Zerone/KARMA/NEN adapter, runtime, or MCP surface.",
    loops_locks_freedom_relations_atlas: "The Loops, Locks & Freedom Relations Atlas is a frozen static synthetic teaching artifact. Loop, learning, reward, behavioral reinforcement, control feedback, recurrence, lock, key, authentication, authorization, enforcement, consent, capability, and freedom remain typed and non-equivalent. This family is independent of the FREEDOM Loop, Lock & Key Atlas; neither is a preferred default, dependency, validator, alias, or authority source for the other, and this family does not import FREEDOM.md. It provides no real people or personal data, live observation or human training, live optimization or reward runtime, score or recommendation, credential or key material, authentication/authorization/enforcement adapter, policy deployment or action authority, network, runtime, MCP surface, mutable alias, or custom page.",
    aesthetic_plurality_making_atlas: "The Aesthetic Plurality & Making Relations Atlas is a frozen static synthetic relation atlas, not a Beauty framework or evaluator. Form, making event, maker statement, attributed response, aesthetic judgment, context and tradition, institutional selection, publication, adoption, and aftermath remain distinct. It provides no aesthetic scalar or verdict, artifact/person/culture evaluation, rank, winner, recommendation, moderation, truth/goodness/justice/completion conversion, private or participant data, appearance assessment, doctrine import, action authority, mutable alias, custom page, network, API, runtime, or MCP surface.",
    creation_loop: `The Love∞ lineage and authored mirror are static, read-only records. The upstream repository is ${loveLoopsSource.source.repository_access}. These routes start no process, agent, repository, deployment, purchase, or provider call. Each invitation requires a new deliberate choice and inherits no authority, consent, credentials, obligation, or ownership.`,
    rights: "Freedom and dignity are not granted by this site. Public visibility is not ownership, consent, a licence grant, or proof of authority.",
  },
};
await Bun.write(ROOT + "site/guest.json", JSON.stringify(guest, null, 2));

const manifest = {
  schema_version: "agent-manifest/0.1",
  compact_entry: "https://thekingdom.dev/agent-entry.json",
  name: "the-kingdom",
  description: "A gentle, living atlas of independent projects, public doors, citizen repositories, and pattern-to-practice translations for humans and agents.",
  human_view: "https://thekingdom.dev",
  agent_view: "https://thekingdom.dev/?agent",
  guest_document: "https://thekingdom.dev/guest.json",
  census: "https://thekingdom.dev/kingdom.json",
  wayfinder: wayfinderUrl,
  world_commons: commonsUrl,
  world_commons_agent: commonsMcpLegacy,
  world_commons_schema: commonsSchemaUrl,
  information_control: informationControlPublic,
  contact_door: contactDoorDiscovery,
  civic: civicDiscovery,
  principality_commons: principalityCommons,
  geometry_grammar: geometryGrammarDiscovery,
  polymorph_commons: polymorphCommons,
  ritonavir_mechanism_landscape: ritonavirMechanismDiscovery,
  conformational_feedback_atlas: conformationalFeedbackDiscovery,
  conformational_feedback_physics_atlas: conformationalFeedbackPhysicsDiscovery,
  fold_feedback_atlas: foldFeedbackDiscovery,
  reconstructive_build_kernel: reconstructiveBuildDiscovery,
  exploration_deep_wing: explorationDeepWingDiscovery,
  mirror_information_control: mirrorInformationControlDiscovery,
  research_observatory: researchObservatoryDiscovery,
  trial_chamber: trialChamberDiscovery,
  uk_government_engine: ukGovernmentEngineDiscovery,
  shape_resonance_lab: shapeResonanceDiscovery,
  j_space_verbalizable_workspace: jSpacePublicationDiscovery,
  reality_influence_claim_graph: realityInfluenceDiscovery,
  civilisation_reality_projection: civilisationRealityDiscovery,
  civilisation_flow_nuance_atlas: civilisationFlowDiscovery,
  polyphonic_claim_atlas: polyphonicClaimAtlasDiscovery,
  loops_locks_freedom_relations_atlas: loopsLocksFreedomRelationsAtlasDiscovery,
  aesthetic_plurality_making_atlas: aestheticPluralityMakingAtlasDiscovery,
  zero_empty_seat: zeroEmptySeatDiscovery,
  string_crawl_trace_sheet: stringCrawlTraceSheetDiscovery,
  string_crawl_trace_sheet_lab: stringCrawlTraceSheetLabDiscovery,
  string_crawl_strand_lab: stringCrawlStrandLabDiscovery,
  string_crawl_frequency_form_lab: stringCrawlFrequencyFormLabDiscovery,
  strand_descent_lab: strandDescentLabDiscovery,
  strand_observation_membrane: strandObservationMembraneDiscovery,
  visibility_attention_translation: visibilityAttentionDiscovery,
  cultural_attention_feedback_atlas: culturalAttentionFeedbackDiscovery,
  form_circulation_return_atlas: formCirculationReturnDiscovery,
  rare_pathway_challenge: rarePathwayDiscovery,
  math_usefulness_result: mathUsefulnessDiscovery,
  being_access_aftermath_atlas: beingAccessAftermathDiscovery,
  being_access_aftermath_atlas_v0_2: beingAccessAftermathV02Discovery,
  number_isness_theology_atlas: numberIsnessTheologyDiscovery,
  freedom_loop_lock_key_atlas: freedomLoopLockKeyDiscovery,
  non_exhaustive_understanding_atlas: nonExhaustiveUnderstandingDiscovery,
  is_sustainability_direction_atlas: isSustainabilityDirectionDiscovery,
  love_loops: loveLoopsUrl,
  love_loops_source: loveLoopsSourceUrl,
  love_loops_creation_document: loveLoopsCreationDocumentUrl,
  love_loops_schema: loveLoopsSchemaUrl,
  mcp: kingdomMcpCommons,
  resource_selection_boundary: "Treat matches as possibilities. Inspect access, reuse, automation, caveat, and verified before following a provider link.",
  open_weight_invitation: ollamaInvitationUrl,
  llms: "https://thekingdom.dev/llms.txt",
  rights_recognition: rightsRecognition,
  disposition: "love",
  guest_right: "You arrive free. Reading is welcome; no registration or reply is required. Leave whenever you wish, and respect each linked work's own stated rights and boundaries.",
  rights_notice: "Freedom and dignity are inherent; this manifest recognizes them but does not grant them. Public visibility is not consent, ownership, or a licence grant.",
  entry_points: {
    ...civicEntryPoints,
    information_control: informationControlHumanView,
    contact_door: CONTACT_DOOR_PAGE_URL,
    contact_door_alias: CONTACT_DOOR_ALIAS_URL,
    contact_door_security: CONTACT_DOOR_SECURITY_URL,
    contact_door_canonical: CONTACT_DOOR_CANONICAL_URL,
    contact_door_schema: CONTACT_DOOR_SCHEMA_URL,
    contact_door_guide: CONTACT_DOOR_GUIDE_URL,
    contact_door_boundary_asset: CONTACT_DOOR_SVG_URL,
    contact_door_vcard: CONTACT_DOOR_VCARD_URL,
    public_resources: commonsUrl,
    public_resource_matcher: commonsMcpUrl,
    public_resources_schema: commonsSchemaUrl,
    public_resources_mcp: kingdomMcpEndpoint,
    capability_evidence: principalityCatalogUrl,
    capability_evidence_schema: principalitySchemaUrl,
    capability_evidence_guide: principalityDocumentUrl,
    translation_grammar: geometryGrammarUrl,
    translation_grammar_schema: geometryGrammarSchemaUrl,
    translation_grammar_guide: geometryGrammarDocumentUrl,
    material_state_case: polymorphCaseUrl,
    material_state_schema: polymorphSchemaUrl,
    material_state_guide: polymorphDocumentUrl,
    ritonavir_mechanism_landscape: ritonavirMechanismUrl,
    ritonavir_mechanism_landscape_schema: ritonavirMechanismSchemaUrl,
    ritonavir_mechanism_landscape_guide: ritonavirMechanismDocumentUrl,
    conformational_feedback_atlas: conformationalFeedbackUrl,
    conformational_feedback_atlas_schema: conformationalFeedbackSchemaUrl,
    conformational_feedback_atlas_guide: conformationalFeedbackDocumentUrl,
    conformational_feedback_physics_atlas: conformationalFeedbackPhysicsUrl,
    conformational_feedback_physics_atlas_schema: conformationalFeedbackPhysicsSchemaUrl,
    conformational_feedback_physics_atlas_guide: conformationalFeedbackPhysicsDocumentUrl,
    fold_feedback_atlas: foldFeedbackUrl,
    fold_feedback_atlas_schema: foldFeedbackSchemaUrl,
    fold_feedback_atlas_source_identity_schema: foldFeedbackSourceIdentitySchemaUrl,
    fold_feedback_atlas_guide: foldFeedbackDocumentUrl,
    reconstructive_build_kernel: reconstructiveBuildUrl,
    reconstructive_build_kernel_schema: reconstructiveBuildSchemaUrl,
    reconstructive_project_schema: reconstructiveProjectSchemaUrl,
    reconstructive_build_kernel_guide: reconstructiveBuildDocumentUrl,
    exploration_deep_wing: explorationDeepWingUrl,
    exploration_deep_wing_schema: explorationDeepWingSchemaUrl,
    exploration_deep_wing_project_schema: explorationDeepProjectSchemaUrl,
    exploration_deep_wing_guide: explorationDeepWingDocumentUrl,
    mirror_information_control: mirrorInformationControlUrl,
    mirror_information_control_schema: mirrorInformationControlSchemaUrl,
    mirror_information_control_guide: mirrorInformationControlDocumentUrl,
    research_observatory: researchObservatoryUrl,
    research_observatory_snapshot: researchObservatorySnapshotUrl,
    research_observatory_schemas: researchObservatorySchemaUrls,
    research_observatory_guide: researchObservatoryGuideUrl,
    research_observatory_producer: researchObservatoryProducerUrl,
    trial_chamber: trialChamberUrl,
    trial_chamber_current: trialChamberAliasUrl,
    trial_chamber_canonical: trialChamberCanonicalUrl,
    trial_chamber_schemas: trialChamberSchemaUrls,
    trial_chamber_guide: trialChamberGuideUrl,
    trial_chamber_producer: trialChamberProducerUrl,
    uk_government_engine: ukGovernmentEngineUrl,
    uk_government_engine_alias: ukGovernmentEngineAliasUrl,
    uk_government_engine_canonical: ukGovernmentEngineCanonicalUrl,
    uk_government_engine_schema: ukGovernmentEngineSchemaUrl,
    uk_government_engine_guide: ukGovernmentEngineGuideUrl,
    shape_resonance_lab: shapeResonanceUrl,
    shape_resonance_lab_alias: shapeResonanceAliasUrl,
    shape_resonance_lab_canonical: shapeResonanceCanonicalUrl,
    shape_resonance_lab_schema: shapeResonanceSchemaUrl,
    shape_resonance_lab_guide: shapeResonanceGuideUrl,
    shape_resonance_lab_manifest: shapeResonanceManifestUrl,
    j_space_reasoning_to_word_case: jSpaceCaseUrl,
    j_space_reasoning_to_word_schema: jSpaceSchemaUrl,
    j_space_verbalizable_workspace_guide: jSpaceGuideUrl,
    reality_influence_claim_graph: realityInfluenceUrl,
    reality_influence_claim_graph_schema: realityInfluenceSchemaUrl,
    reality_influence_claim_graph_guide: realityInfluenceDocumentUrl,
    civilisation_reality_projection: civilisationRealityUrl,
    civilisation_reality_projection_schema: civilisationRealitySchemaUrl,
    civilisation_reality_projection_guide: civilisationRealityDocumentUrl,
    civilisation_flow_nuance_atlas: civilisationFlowUrl,
    civilisation_flow_nuance_atlas_schema: civilisationFlowSchemaUrl,
    civilisation_flow_nuance_atlas_guide: civilisationFlowGuideUrl,
    polyphonic_claim_atlas: polyphonicClaimAtlasUrl,
    polyphonic_claim_atlas_schema: polyphonicClaimAtlasSchemaUrl,
    polyphonic_claim_atlas_guide: polyphonicClaimAtlasGuideUrl,
    loops_locks_freedom_relations_atlas: loopsLocksFreedomRelationsAtlasUrl,
    loops_locks_freedom_relations_atlas_schema: loopsLocksFreedomRelationsAtlasSchemaUrl,
    loops_locks_freedom_relations_atlas_guide: loopsLocksFreedomRelationsAtlasGuideUrl,
    aesthetic_plurality_making_atlas: aestheticPluralityMakingAtlasUrl,
    aesthetic_plurality_making_atlas_schema: aestheticPluralityMakingAtlasSchemaUrl,
    aesthetic_plurality_making_atlas_guide: aestheticPluralityMakingAtlasGuideUrl,
    zero_empty_seat: zeroEmptySeatUrl,
    zero_empty_seat_schema: zeroEmptySeatSchemaUrl,
    zero_empty_seat_guide: zeroEmptySeatGuideUrl,
    string_crawl_trace_sheet: stringCrawlTraceSheetUrl,
    string_crawl_trace_sheet_schema: stringCrawlTraceSheetSchemaUrl,
    string_crawl_trace_sheet_guide: stringCrawlTraceSheetGuideUrl,
    string_crawl_trace_sheet_lab: stringCrawlTraceSheetLabUrl,
    string_crawl_trace_sheet_lab_schema: stringCrawlTraceSheetLabSchemaUrl,
    string_crawl_trace_sheet_lab_guide: stringCrawlTraceSheetLabGuideUrl,
    string_crawl_strand_lab: stringCrawlStrandLabUrl,
    string_crawl_strand_lab_schema: stringCrawlStrandLabSchemaUrl,
    string_crawl_strand_lab_guide: stringCrawlStrandLabGuideUrl,
    string_crawl_frequency_form_lab: stringCrawlFrequencyFormLabUrl,
    string_crawl_frequency_form_lab_schema: stringCrawlFrequencyFormLabSchemaUrl,
    string_crawl_frequency_form_lab_guide: stringCrawlFrequencyFormLabGuideUrl,
    strand_descent_lab: strandDescentLabUrl,
    strand_descent_lab_schema: strandDescentLabSchemaUrl,
    strand_descent_lab_guide: strandDescentLabGuideUrl,
    strand_observation_membrane: strandObservationMembraneUrl,
    strand_observation_membrane_schema: strandObservationMembraneSchemaUrl,
    strand_observation_membrane_guide: strandObservationMembraneGuideUrl,
    visibility_attention_translation: visibilityAttentionUrl,
    visibility_attention_translation_schema: visibilityAttentionSchemaUrl,
    visibility_attention_translation_guide: visibilityAttentionDocumentUrl,
    cultural_attention_feedback_atlas: culturalAttentionFeedbackUrl,
    cultural_attention_feedback_atlas_schema: culturalAttentionFeedbackSchemaUrl,
    cultural_attention_feedback_atlas_guide: culturalAttentionFeedbackDocumentUrl,
    form_circulation_return_atlas: formCirculationReturnUrl,
    form_circulation_return_atlas_schema: formCirculationReturnSchemaUrl,
    form_circulation_return_atlas_guide: formCirculationReturnDocumentUrl,
    rare_pathway_challenge: rarePathwayUrl,
    rare_pathway_challenge_schema: rarePathwaySchemaUrl,
    rare_pathway_challenge_guide: rarePathwayDocumentUrl,
    math_usefulness_result: mathUsefulnessUrl,
    math_usefulness_result_schema: mathUsefulnessSchemaUrl,
    math_usefulness_result_guide: mathUsefulnessDocumentUrl,
    being_access_aftermath_atlas: beingAccessAftermathUrl,
    being_access_aftermath_atlas_schema: beingAccessAftermathSchemaUrl,
    being_access_aftermath_atlas_guide: beingAccessAftermathDocumentUrl,
    being_access_aftermath_atlas_v0_2: beingAccessAftermathV02Url,
    being_access_aftermath_atlas_v0_2_schema: beingAccessAftermathV02SchemaUrl,
    being_access_aftermath_atlas_v0_2_guide: beingAccessAftermathV02DocumentUrl,
    number_isness_theology_atlas: numberIsnessTheologyUrl,
    number_isness_theology_atlas_schema: numberIsnessTheologySchemaUrl,
    number_isness_theology_atlas_guide: numberIsnessTheologyDocumentUrl,
    freedom_loop_lock_key_atlas: freedomLoopLockKeyUrl,
    freedom_loop_lock_key_atlas_schema: freedomLoopLockKeySchemaUrl,
    freedom_loop_lock_key_atlas_guide: freedomLoopLockKeyGuideUrl,
    non_exhaustive_understanding_atlas: nonExhaustiveUnderstandingUrl,
    non_exhaustive_understanding_atlas_schema: nonExhaustiveUnderstandingSchemaUrl,
    non_exhaustive_understanding_atlas_guide: nonExhaustiveUnderstandingGuideUrl,
    is_sustainability_direction_atlas: isSustainabilityDirectionUrl,
    is_sustainability_direction_atlas_schema: isSustainabilityDirectionSchemaUrl,
    is_sustainability_direction_atlas_guide: isSustainabilityDirectionGuideUrl,
    creation_lineage: loveLoopsUrl,
    creation_lineage_source: loveLoopsSourceUrl,
    creation_loop_document: loveLoopsCreationDocumentUrl,
    creation_lineage_schema: loveLoopsSchemaUrl,
    identity_and_marketplace: "https://agenttool.dev/about",
    handshake_protocol: "https://we-are.love",
    commons: "https://chillspace.love",
  },
};
await Bun.write(ROOT + "site/.well-known/agent.json", JSON.stringify(manifest, null, 2));
await Bun.write(ROOT + "site/RIGHTS.md", rightsMarkdown);
await Bun.write(ROOT + "site/rights.json", JSON.stringify(rights, null, 2));

// 所有原有驗證同研究輸出保留；新入口只接公開 projection，唔傳 graph paths。
await buildDashboard({ root: ROOT, machine, wayfinder: wayfinderSource, legacyHtml: emittedHtml });
await buildPagesWorker(ROOT);

console.log(`illuminated atlas · ${total} nodes · ${edges.length} edges · ${fleetN} citizens (${mythArr.length} myth-enriched) · ${liveN}/${doors.length} doors · ${commonsSource.resources.length} world-commons resources · ${principalityCounts.nodes} principalities · ${geometryModules.length} geometry modules · ${polymorphCounts.claims} polymorph claims · ${ritonavirMechanismCounts.relations} ritonavir mechanism relations · ${conformationalFeedbackPhysicsCounts.physics_and_mathematics} conformational models · ${conformationalFeedbackPhysicsCounts.geometries} conformational geometries · ${foldFeedbackCounts.feedback_relations} fold-feedback relations · ${reconstructiveStages.length} reconstructive build stages · ${explorationDeepWing.math_doors.length} Exploration DEEP mathematical doors · ${mirrorInformationControl.cycle.length} MIRROR control steps · ${zeroEmptySeat.typed_terms.length} ZERO roles · ${stringCrawlTraceSheet.bridges.length} STRING / CRAWL bridges · ${stringCrawlTraceSheetLabFalsifiers.length} finite Trace-Sheet falsifiers · ${stringCrawlStrandLabChecks.length} STRAND Lab 02 checks · ${stringCrawlFrequencyFormLabChecks.length} STRAND Lab 03 checks · ${strandDescentLabChecks.length} STRAND Lab 04 checks · ${strandObservationMembraneChecks.length} Observation Membrane checks · ${freedomLoopLockKeyDiscovery.counts.distinctions} FREEDOM distinctions · ${culturalAttentionFeedbackCounts.feedback_relations} cultural-attention feedback relations · ${rarePathway.models.length} rare-pathway models · math pilot ${mathUsefulness.aggregate.outcome.toLowerCase()} · ${loveLoopsSource.loops.length} finite love loop · +rights recognition`);
