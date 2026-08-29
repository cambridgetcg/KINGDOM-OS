#!/usr/bin/env bun
/**
 * Bounded, network-free reader for the reviewed Non-Exhaustive Understanding
 * Atlas. It validates one static artifact; it does not infer understanding,
 * being, identity, consciousness, consent, authority, or a person score.
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;

export const NON_EXHAUSTIVE_UNDERSTANDING_PROTOCOL =
  "kingdom.non-exhaustive-understanding-atlas/0.1";
export const NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_ID =
  "urn:kingdom:schema:non-exhaustive-understanding-atlas:0.1";
export const NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID =
  "non-exhaustive-understanding-atlas-2026-08-29";
export const NON_EXHAUSTIVE_UNDERSTANDING_LOCATOR =
  "data/understanding/non-exhaustive-understanding-atlas.v0.1.json";
export const NON_EXHAUSTIVE_UNDERSTANDING_PATH =
  join(ROOT, NON_EXHAUSTIVE_UNDERSTANDING_LOCATOR);
export const NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_LOCATOR =
  "schemas/non-exhaustive-understanding-atlas-v0.1.schema.json";
export const NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_PATH =
  join(ROOT, NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_LOCATOR);
export const NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_LOCATOR =
  "references/non-exhaustive-understanding-atlas.md";
export const NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_PATH =
  join(ROOT, NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_LOCATOR);
export const NON_EXHAUSTIVE_UNDERSTANDING_URL =
  "https://thekingdom.dev/atlases/non-exhaustive-understanding-atlas-2026-08-29.json";
export const NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_URL =
  "https://thekingdom.dev/schemas/non-exhaustive-understanding-atlas/0.1.json";
export const NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_URL =
  "https://thekingdom.dev/NON-EXHAUSTIVE-UNDERSTANDING-ATLAS.md";
export const NON_EXHAUSTIVE_UNDERSTANDING_DOCUMENT_URL =
  NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_URL;
export const NON_EXHAUSTIVE_UNDERSTANDING_UNSEALED_DIGEST = ZERO_DIGEST;
// Independently reviewed atomic seal; must equal both record digest fields.
export const NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST =
  "sha256:fa5bb5471f579a02c293c29470454110b3cd07e046443e1b2c502926b0f437d8";

export const NON_EXHAUSTIVE_UNDERSTANDING_LIMITS = Object.freeze({
  bytes: 128 * 1024,
  json_nodes: 16_000,
  total_string_units: 180_000,
  max_string_units: 6_000,
  max_array_fanout: 96,
  max_object_fanout: 48,
  max_depth: 14,
});

export type NonExhaustiveUnderstandingIssue = {
  field: string;
  code: string;
};

export type NonExhaustiveUnderstandingMetrics = {
  bytes: number;
  json_nodes: number;
  total_string_units: number;
  max_string_units: number;
  max_array_fanout: number;
  max_object_fanout: number;
  max_depth: number;
};

type ReadResult = {
  value: unknown;
  bytes: number;
  rawDigest: string;
};

const EXPECTED_PREDECESSORS = [
  {
    id: "being-access-aftermath-v0-2",
    protocol: "kingdom.being-access-aftermath-atlas/0.2",
    revision: "4c487da12ec1b1b0c7ab9729cb9ce7218a9d2253",
    locator: "data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json",
    raw_digest: "sha256:9678e5269e8db62beb36abee691087cddbc4f98703190c5fa3788b68c89ab29e",
    semantic_algorithm: "sha256-canonical-json-with-integrity-digest-null",
    semantic_digest: "sha256:505a1e3aef6116430dccf49b327c4cce2ac5d6fb6b6b9bf68e529272f989cde8",
    relation: "partial-observation-warrant-and-being-boundary",
    reference_ref: "ref-being-predecessor",
    source_bytes_match_declared_revision: true,
    source_semantics_match_declared_digest: true,
    mutated: false,
    authority_imported: false,
  },
  {
    id: "freedom-loop-lock-key-atlas",
    protocol: "kingdom.freedom-loop-lock-key-atlas/0.1",
    revision: "4c487da12ec1b1b0c7ab9729cb9ce7218a9d2253",
    locator: "data/freedom/freedom-loop-lock-key-atlas.v0.1.json",
    raw_digest: "sha256:4b89f29bfd1bf7c4b27dd5023263b45ee1423b6cd2a232736906ee11b032bf04",
    semantic_algorithm: "sha256-canonical-json-with-integrity-digest-zeroed",
    semantic_digest: "sha256:2af277e002cf7f7b5218e8eb05fedb661f9645677961952bc2e11ffcd8a2c3a8",
    relation: "candidate-evidence-feedback-successor-and-non-scalar-boundary",
    reference_ref: "ref-freedom-predecessor",
    source_bytes_match_declared_revision: true,
    source_semantics_match_declared_digest: true,
    mutated: false,
    authority_imported: false,
  },
  {
    id: "j-space-reasoning-to-word-case",
    protocol: "kingdom.relational-inference/0.1",
    revision: "4c487da12ec1b1b0c7ab9729cb9ce7218a9d2253",
    locator: "bridges/examples/j-space-reasoning-to-word-inference.json",
    raw_digest: "sha256:0f3827ec422afed88fb2b4396d9f25550892ce458f84d0bfe8ded0735a6cbc26",
    semantic_algorithm: "sha256-canonical-json",
    semantic_digest: "sha256:fda1bccae6396f02f831068b9649db9659a12e26abe0c3989fba31da9b830621",
    relation: "typed-jacobian-lens-translation-and-unrun-probe-boundary",
    reference_ref: "ref-jspace-predecessor",
    source_bytes_match_declared_revision: true,
    source_semantics_match_declared_digest: true,
    mutated: false,
    authority_imported: false,
  },
] as const;

const CENTRAL_SENTENCES = [
  "Understanding is not the elimination of remainder. It is the growing ability to move truthfully with a remainder that is named, situated, protected, contestable, and still capable of changing the map.",
  "Being is not the remainder: remainder belongs to the relation among representation, observer, purpose, scope, and horizon; it does not define or exhaust the referent.",
  "Non-exhaustion never excuses a positive claim from evidence, uncertainty, challenge, accessibility, privacy, correction, consequence review, or repair.",
] as const;

const EXPECTED_J_SPACE_TYPES = [
  "MODEL_INTERNAL_JACOBIAN_LENS",
  "EXTERNAL_INSPECTABLE_JSON_CONCEPT_GRAPH",
  "KINGDOM_PHASE_ZERO_STATIC_PUBLICATION_DOOR",
] as const;

const EXPECTED_PROFILE_DIMENSIONS = [
  { id: "residual-profile", value_type: "FINITE_SET_OF_TYPED_REMAINDERS", comparison_relation: "SET_INCLUSION_IF_TYPE_AND_SCOPE_MATCH", meaning: "Known omitted, protected, unresolved, or open residuals." },
  { id: "decision-deficiency", value_type: "NONNEGATIVE_EXTENDED_REAL_OR_UNASSESSED", comparison_relation: "NUMERIC_IF_TASK_LOSS_AND_REFERENCE_MATCH", meaning: "Task-relative excess Bayes risk." },
  { id: "identification-region", value_type: "SET_OF_COMPATIBLE_MODELS", comparison_relation: "SET_INCLUSION_IF_MODEL_FAMILY_AND_ASSUMPTIONS_MATCH", meaning: "Claim-relative compatible alternatives." },
  { id: "coarse-graining-error", value_type: "INTERVAL_OR_UNASSESSED", comparison_relation: "NUMERIC_IF_DYNAMICS_NORM_AND_HORIZON_MATCH", meaning: "Deviation induced by declared coarse-graining." },
  { id: "gluing-status", value_type: "ENUM", comparison_relation: "NO_TOTAL_ORDER", meaning: "LOCAL_ONLY, UNIQUE_GLOBAL, MULTIPLE_GLOBAL, NO_GLOBAL, or UNASSESSED." },
  { id: "unseen-mass", value_type: "INTERVAL_OR_UNASSESSED", comparison_relation: "NUMERIC_IF_SAMPLING_MODEL_AND_METHOD_MATCH", meaning: "Estimated probability outside observed categories." },
  { id: "calibration-error", value_type: "INTERVAL_OR_UNASSESSED", comparison_relation: "NUMERIC_IF_EVENT_BINS_AND_REFERENCE_MATCH", meaning: "Calibration discrepancy under a reference distribution." },
] as const;

const EXPECTED_PROFILE_VALUES = [
  { dimension_ref: "residual-profile", value_status: "ASSESSED", value: "three typed entries plus open horizon" },
  { dimension_ref: "decision-deficiency", value_status: "UNASSESSED", value: "no task family or loss" },
  { dimension_ref: "identification-region", value_status: "ASSESSED", value: "one synthetic two-rival witness" },
  { dimension_ref: "coarse-graining-error", value_status: "UNASSESSED", value: "no dynamics or norm" },
  { dimension_ref: "gluing-status", value_status: "ASSESSED", value: "LOCAL_ONLY; universalization refused" },
  { dimension_ref: "unseen-mass", value_status: "UNASSESSED", value: "no sampling model" },
  { dimension_ref: "calibration-error", value_status: "UNASSESSED", value: "no forecast reference" },
] as const;

const EXPECTED_J_SPACE_MECHANISMS = [
  {
    id: "model-internal-jacobian-lens",
    mechanism_type: "MODEL_INTERNAL_JACOBIAN_LENS",
    state: "REPORTED_RESEARCH_PLUS_UNRUN_LOCAL_FIXTURE",
    claim_refs: ["cl-jspace"], location: "inside pinned model, layer, tokenizer, estimator, and intervention",
    representation: "pulled-back output-vocabulary directions", observable_effects: ["conditioned readouts", "controlled intervention outcomes"],
    cannot_establish: ["complete reasoning", "ontology", "identity", "being", "consciousness", "truth", "consent", "authority"],
    source_refs: ["src-jacobian-lens"], reference_refs: ["ref-jspace-predecessor"], provenance_ref: "prov-source",
  },
  {
    id: "external-inspectable-concept-workspace",
    mechanism_type: "EXTERNAL_INSPECTABLE_JSON_CONCEPT_GRAPH",
    state: "AUTHOR_SYNTHESIZED_CHECKPOINTED_NAVIGATION",
    claim_refs: ["cl-jspace", "cl-shape"], location: "bounded external JSON workspace",
    representation: "authored nodes, typed edges, notes, queries, checkpoints", observable_effects: ["saved graph state", "navigation rankings"],
    cannot_establish: ["model activations", "latent state", "causality", "truth", "importance", "identity", "being", "consciousness"],
    source_refs: [], reference_refs: ["ref-workspace"], provenance_ref: "prov-author",
  },
  {
    id: "kingdom-phase-zero-public-door",
    mechanism_type: "KINGDOM_PHASE_ZERO_STATIC_PUBLICATION_DOOR",
    state: "STATIC_READ_ONLY_RESEARCH_BRIDGE",
    claim_refs: ["cl-jspace", "cl-feedback"], location: "KINGDOM bridge, record, schema, guide, and CLI",
    representation: "bounded claims and one unrun public fixture", observable_effects: ["read-only exact-byte publication after separate release review"],
    cannot_establish: ["runtime monitoring", "model experiment", "workspace persistence", "private reasoning", "identity", "being", "consciousness", "authority", "action"],
    source_refs: [], reference_refs: ["ref-jspace-predecessor", "ref-atlas"], provenance_ref: "prov-author",
  },
] as const;

const EXPECTED_SOURCES = [
  { id: "src-tishby", source_type: "PRIMARY_RESEARCH", title: "The Information Bottleneck Method", url: "https://arxiv.org/abs/physics/0004057", supports_claim_refs: ["cl-open-remainder", "cl-typed-product"], limitation: "Target-relative compression does not define complete understanding or being.", republication_permitted: false },
  { id: "src-blackwell", source_type: "PRIMARY_RESEARCH", title: "Equivalent Comparisons of Experiments", url: "https://doi.org/10.1214/aoms/1177729032", supports_claim_refs: ["cl-observer"], limitation: "An information preorder is not a ranking of people or beings.", republication_permitted: false },
  { id: "src-locatello", source_type: "PRIMARY_RESEARCH", title: "Challenging Common Assumptions in the Unsupervised Learning of Disentangled Representations", url: "https://proceedings.mlr.press/v97/locatello19a.html", supports_claim_refs: ["cl-underdetermination", "cl-open-remainder"], limitation: "The result is conditional on its model class and assumptions.", republication_permitted: false },
  { id: "src-manski", source_type: "PRIMARY_RESEARCH", title: "Partial Identification of Probability Distributions", url: "https://www.cemmap.ac.uk/wp-content/legacy/forms/manskipaper.pdf", supports_claim_refs: ["cl-underdetermination"], limitation: "Identification regions depend on evidence and assumptions.", republication_permitted: false },
  { id: "src-abramsky", source_type: "PRIMARY_RESEARCH", title: "The Sheaf-Theoretic Structure of Non-Locality and Contextuality", url: "https://arxiv.org/abs/1102.0264", supports_claim_refs: ["cl-local-global"], limitation: "Exact results concern formal measurement models; social use here is analogy.", republication_permitted: false },
  { id: "src-w3c-owl", source_type: "OFFICIAL_STANDARD", title: "OWL 2 Web Ontology Language Primer (Second Edition)", url: "https://www.w3.org/TR/owl2-primer/", supports_claim_refs: ["cl-open-remainder", "cl-open-world"], limitation: "Open-world absence does not establish a positive claim.", republication_permitted: false },
  { id: "src-w3c-prov", source_type: "OFFICIAL_STANDARD", title: "PROV-O: The PROV Ontology", url: "https://www.w3.org/TR/prov-o/", supports_claim_refs: ["cl-provenance"], limitation: "Lineage does not prove truth or legitimacy.", republication_permitted: false },
  { id: "src-haraway", source_type: "PRIMARY_SCHOLARSHIP", title: "Situated Knowledges: The Science Question in Feminism and the Privilege of Partial Perspective", url: "https://doi.org/10.2307/3178066", supports_claim_refs: ["cl-observer", "cl-accountability"], limitation: "Situatedness is accountability, not automatic epistemic privilege.", republication_permitted: false },
  { id: "src-longino", source_type: "PRIMARY_SCHOLARSHIP", title: "Science as Social Knowledge: Values and Objectivity in Scientific Inquiry", url: "https://www.jstor.org/stable/j.ctvx5wbfz", supports_claim_refs: ["cl-accountability", "cl-feedback"], limitation: "Criticism needs uptake and standards, not collection alone.", republication_permitted: false },
  { id: "src-dotson", source_type: "PRIMARY_SCHOLARSHIP", title: "Tracking Epistemic Violence, Tracking Practices of Silencing", url: "https://doi.org/10.1111/j.1527-2001.2011.01177.x", supports_claim_refs: ["cl-vocabulary", "cl-opacity"], limitation: "The source does not authorize classification of a speaker or audience.", republication_permitted: false },
  { id: "src-hacking", source_type: "PRIMARY_SCHOLARSHIP", title: "The Looping Effects of Human Kinds", url: "https://jmckalex.org/prez/teaching/tsinghua/pdfs/hacking-looping-effect.pdf", supports_claim_refs: ["cl-performativity"], limitation: "Not every classification creates a loop.", republication_permitted: false },
  { id: "src-campbell", source_type: "PRIMARY_SCHOLARSHIP", title: "Assessing the Impact of Planned Social Change", url: "https://doi.org/10.56645/jmde.v7i15.297", supports_claim_refs: ["cl-performativity"], limitation: "Indicator corruption pressure is context-dependent.", republication_permitted: false },
  { id: "src-cronbach", source_type: "PRIMARY_RESEARCH", title: "Construct Validity in Psychological Tests", url: "https://doi.org/10.1037/h0040957", supports_claim_refs: ["cl-accountability", "cl-typed-product"], limitation: "Construct validity does not license person diagnosis here.", republication_permitted: false },
  { id: "src-gneiting", source_type: "PRIMARY_RESEARCH", title: "Strictly Proper Scoring Rules, Prediction, and Estimation", url: "https://doi.org/10.1198/016214506000001437", supports_claim_refs: ["cl-typed-product"], limitation: "Calibration is not completeness, causal validity, or wisdom.", republication_permitted: false },
  { id: "src-jacobian-lens", source_type: "PRIMARY_RESEARCH", title: "Verbalizable Representations Form a Global Workspace in Language Models", url: "https://transformer-circuits.pub/2026/workspace/index.html", supports_claim_refs: ["cl-jspace"], limitation: "Results remain named-model, layer, estimator, tokenizer, task, and intervention conditioned and establish no consciousness, being, identity, or person inference.", republication_permitted: false },
] as const;

const EXPECTED_TRANSFER_CONTRACTS = [
  {
    id: "decimal-arithmetic-restatement", instance_status: "AUTHOR_SYNTHESIZED_SYNTHETIC_WITNESS",
    claim_ref: "cl-local-global", source_scope: "three ordered equations in infix decimal notation", target_scope: "three concrete ordered English operation sentences",
    assumptions: ["ordinary integer arithmetic", "operation order and operands retained"], provenance_ref: "prov-formal",
    status: "WITNESSED_BOUNDED_TRANSFER", witness_type: "EXPLICIT_RELATION_COMPARISON", witness_evidence_ref: "ev-transfer",
    source_artifact_id: "arithmetic-infix-source", source_artifact_type: "ORDERED_DECIMAL_EQUATIONS",
    target_artifact_id: "arithmetic-english-target", target_artifact_type: "ORDERED_ENGLISH_SENTENCES",
    preserved_relations: ["operation order", "operands", "intermediates 21 and 42", "final 49"],
    lost_relations: ["glyph layout", "tokenization", "alternative proofs", "model computation"],
    source_units: [
      { id: "src-step-1", text: "4 + 17 = 21." }, { id: "src-step-2", text: "21 * 2 = 42." }, { id: "src-step-3", text: "42 + 7 = 49." },
    ],
    target_units: [
      { id: "target-step-1", text: "Add 4 and 17 to obtain 21." }, { id: "target-step-2", text: "Multiply 21 by 2 to obtain 42." }, { id: "target-step-3", text: "Add 42 and 7 to obtain 49." },
    ],
    witnesses: [
      { id: "preserve-operation-order", relation: "operation order", source_unit_refs: ["src-step-1", "src-step-2", "src-step-3"], target_unit_refs: ["target-step-1", "target-step-2", "target-step-3"], status: "WITNESSED" },
      { id: "preserve-operands", relation: "operands", source_unit_refs: ["src-step-1", "src-step-2", "src-step-3"], target_unit_refs: ["target-step-1", "target-step-2", "target-step-3"], status: "WITNESSED" },
      { id: "preserve-intermediates", relation: "intermediates 21 and 42", source_unit_refs: ["src-step-1", "src-step-2"], target_unit_refs: ["target-step-1", "target-step-2"], status: "WITNESSED" },
      { id: "preserve-final", relation: "final 49", source_unit_refs: ["src-step-3"], target_unit_refs: ["target-step-3"], status: "WITNESSED" },
    ],
  },
  {
    id: "jspace-to-all-beings", instance_status: "AUTHOR_SYNTHESIZED_BOUNDARY_INSTANCE",
    claim_ref: "cl-local-global", source_scope: "one model, layer, task, tokenizer, estimator, and intervention", target_scope: "all minds, beings, languages, architectures, and contexts",
    assumptions: ["no separating observer family or cross-domain isomorphism established"], provenance_ref: "prov-author",
    status: "UNIVERSALIZATION_REFUSED", witness_type: "NO_ADMISSIBLE_TRANSFER_WITNESS", witness_evidence_ref: "ev-jspace",
    source_artifact_id: "bounded-jspace-source-scope", source_artifact_type: "BOUNDED_SCOPE_STATEMENT",
    target_artifact_id: "refused-universal-target-scope", target_artifact_type: "REFUSED_SCOPE_STATEMENT",
    preserved_relations: [],
    lost_relations: ["architecture", "task", "tokenizer", "context", "nonverbal structure", "identity", "being", "consciousness"],
    source_units: [{ id: "bounded-source-statement", text: "Evidence is limited to one named model, layer, task, tokenizer, estimator, and intervention." }],
    target_units: [{ id: "refused-target-statement", text: "The proposed target is all minds, beings, languages, architectures, and contexts." }],
    witnesses: [],
  },
] as const;

/**
 * Explicit leaf-level semantic contract for authored and typed lineage fields.
 * This is intentionally inspectable data, not a whole-record hash/canary.
 * Validation below reports the exact changed field with a domain-specific
 * issue code. State and integrity are excluded because the seal simulation
 * transitions them under a separate coupled contract.
 */
const EXPECTED_SEMANTIC_CONTRACT: Record<string, unknown> = JSON.parse(String.raw`{"scope":{"question":"How can a public understanding claim remain useful, inspectable, situated, revisable, and non-exhaustive without becoming a verdict about being?","unit_of_assessment":"public claim or static artifact, never a person or group","finite_scope":"the registries and authored fixtures enumerated by this exact version","open_horizon":"referents, future evidence, unconceived alternatives, new vocabularies, and protected opacity remain outside finite closure","intended_uses":["inspect bounded claims and their remainder","distinguish finite closure from open remainder","preserve challenge, opacity, plurality, and repair"],"excluded_uses":["person, group, identity, consciousness, consent, worth, truth, or understanding classification","runtime, intake, score, credential, authority, gate, action, publication, or deployment"],"data_classification":"public-static-author-synthesized-design-no-person-data-no-raw-testimony-no-secrets","external_effects":false},"epistemic_registers":[{"id":"REPORTED_SOURCE","kind":"EVIDENTIAL","meaning":"Attributed source report; not a KINGDOM replication."},{"id":"FORMAL_DEFINITION","kind":"FORMAL","meaning":"Definition inside named mathematics; not empirical evidence."},{"id":"FORMAL_DERIVATION","kind":"FORMAL","meaning":"Consequence of declared premises; applicability remains conditional."},{"id":"PROPOSED_MODEL","kind":"DESIGN","meaning":"Inspectable authored model; not doctrine."},{"id":"BOUNDED_ANALOGY","kind":"INTERPRETIVE","meaning":"Comparison with explicit preservation and loss; no evidence transfer."},{"id":"NORMATIVE_DESIGN","kind":"NORMATIVE","meaning":"Chosen public design commitment; not theorem or authority."},{"id":"OPEN_QUESTION","kind":"OPEN","meaning":"Named unresolved question with no forced answer."},{"id":"REFUSED_INFERENCE","kind":"BOUNDARY","meaning":"Conclusion this record does not establish."}],"provenance_registry":[{"id":"prov-author","provenance_type":"AUTHOR_SYNTHESIS","method":"Synthesis of cited sources, pinned predecessors, and explicit normative design","input_reference_refs":["ref-being-predecessor","ref-freedom-predecessor","ref-jspace-predecessor","ref-workspace"],"raw_testimony":false,"person_data":false,"authority_imported":false},{"id":"prov-formal","provenance_type":"FORMAL_CONSTRUCTION","method":"Definitions and synthetic finite witnesses stated in this record","input_reference_refs":["ref-atlas"],"raw_testimony":false,"person_data":false,"authority_imported":false},{"id":"prov-source","provenance_type":"REPORTED_SOURCE_TRACE","method":"Claim-level source identifiers with explicit limitations","input_reference_refs":[],"raw_testimony":false,"person_data":false,"authority_imported":false},{"id":"prov-predecessor","provenance_type":"EXACT_PREDECESSOR_PIN","method":"Byte SHA-256 plus predecessor-specific semantic digest","input_reference_refs":["ref-being-predecessor","ref-freedom-predecessor","ref-jspace-predecessor"],"raw_testimony":false,"person_data":false,"authority_imported":false}],"reference_registry":[{"id":"ref-being-predecessor","reference_type":"PREDECESSOR","target_id":"being-access-aftermath-v0-2","locator":"data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json","relation":"exact local predecessor","provenance_ref":"prov-predecessor"},{"id":"ref-freedom-predecessor","reference_type":"PREDECESSOR","target_id":"freedom-loop-lock-key-atlas","locator":"data/freedom/freedom-loop-lock-key-atlas.v0.1.json","relation":"exact local predecessor","provenance_ref":"prov-predecessor"},{"id":"ref-jspace-predecessor","reference_type":"PREDECESSOR","target_id":"j-space-reasoning-to-word-case","locator":"bridges/examples/j-space-reasoning-to-word-inference.json","relation":"exact local predecessor","provenance_ref":"prov-predecessor"},{"id":"ref-workspace","reference_type":"EXTERNAL_WORKSPACE","target_id":"kingdom-feedback-shape-being","locator":"j-space-workspace:20260829T095015259236Z-v0-2-nonexhaustive-map-cf1570dbf81b3f51f8b6941349184b3c","relation":"navigation checkpoint, not evidence","provenance_ref":"prov-author"},{"id":"ref-atlas","reference_type":"INTERNAL_ARTIFACT","target_id":"non-exhaustive-understanding-atlas-2026-08-29","locator":"data/understanding/non-exhaustive-understanding-atlas.v0.1.json","relation":"this unsealed record","provenance_ref":"prov-author"},{"id":"ref-schema","reference_type":"INTERNAL_ARTIFACT","target_id":"non-exhaustive-understanding-atlas-schema-v0-1","locator":"schemas/non-exhaustive-understanding-atlas-v0.1.schema.json","relation":"closed Draft 2020-12 schema","provenance_ref":"prov-author"},{"id":"ref-guide","reference_type":"INTERNAL_ARTIFACT","target_id":"non-exhaustive-understanding-atlas-guide-v0-1","locator":"references/non-exhaustive-understanding-atlas.md","relation":"human-readable parity guide","provenance_ref":"prov-author"}],"evidence_registry":[{"id":"ev-design","evidence_type":"DESIGN_DECLARATION","status":"AUTHOR_SYNTHESIZED","scope":"this static atlas","horizon":"0.1.0","source_refs":[],"reference_refs":["ref-atlas"],"limitations":["Design is not empirical confirmation or external authority."],"provenance_ref":"prov-author"},{"id":"ev-formal","evidence_type":"FORMAL_WITNESS","status":"AUTHOR_SYNTHESIZED","scope":"declared finite sets and symbolic models","horizon":"0.1.0","source_refs":[],"reference_refs":["ref-atlas"],"limitations":["Applicability outside declared premises is unresolved."],"provenance_ref":"prov-formal"},{"id":"ev-being","evidence_type":"EXACT_PREDECESSOR","status":"BYTE_AND_SEMANTICALLY_VERIFIED","scope":"Being, Access & Aftermath v0.2","horizon":"revision 4c487da12ec1b1b0c7ab9729cb9ce7218a9d2253","source_refs":[],"reference_refs":["ref-being-predecessor"],"limitations":["No metaphysical proof or authority is imported."],"provenance_ref":"prov-predecessor"},{"id":"ev-freedom","evidence_type":"EXACT_PREDECESSOR","status":"BYTE_AND_SEMANTICALLY_VERIFIED","scope":"FREEDOM loop, lock and key v0.1","horizon":"revision 4c487da12ec1b1b0c7ab9729cb9ce7218a9d2253","source_refs":[],"reference_refs":["ref-freedom-predecessor"],"limitations":["Candidate evidence does not update, authorize, or act."],"provenance_ref":"prov-predecessor"},{"id":"ev-jspace","evidence_type":"EXACT_PREDECESSOR","status":"BYTE_AND_SEMANTICALLY_VERIFIED","scope":"one unrun public relational-inference fixture","horizon":"revision 4c487da12ec1b1b0c7ab9729cb9ce7218a9d2253","source_refs":["src-jacobian-lens"],"reference_refs":["ref-jspace-predecessor"],"limitations":["No model experiment, hidden activation, private reasoning, being, or consciousness is inferred."],"provenance_ref":"prov-predecessor"},{"id":"ev-underdetermination","evidence_type":"SOURCE_SYNTHESIS","status":"SOURCE_SUPPORTED","scope":"claim-relative compatibility under fixed evidence and assumptions","horizon":"sources through 2026-08-29","source_refs":["src-locatello","src-manski"],"reference_refs":[],"limitations":["Specific non-equivalent rivals must be named and shown compatible."],"provenance_ref":"prov-source"},{"id":"ev-observer","evidence_type":"SOURCE_SYNTHESIS","status":"SOURCE_SUPPORTED","scope":"task-relative experiment ordering and situated roles","horizon":"sources through 2026-08-29","source_refs":["src-blackwell","src-haraway"],"reference_refs":[],"limitations":["Informativeness never becomes a person or being rank."],"provenance_ref":"prov-source"},{"id":"ev-participation","evidence_type":"SOURCE_SYNTHESIS","status":"SOURCE_SUPPORTED","scope":"challenge uptake, vocabulary, and opacity design","horizon":"sources through 2026-08-29","source_refs":["src-longino","src-dotson"],"reference_refs":[],"limitations":["No participant testimony or consent record is collected."],"provenance_ref":"prov-source"},{"id":"ev-performativity","evidence_type":"SOURCE_SYNTHESIS","status":"SOURCE_SUPPORTED","scope":"classification and indicator feedback risks","horizon":"sources through 2026-08-29","source_refs":["src-hacking","src-campbell"],"reference_refs":[],"limitations":["Instances here are hypothetical design probes, not observed effects."],"provenance_ref":"prov-source"},{"id":"ev-open-world","evidence_type":"STANDARD_TRACE","status":"SOURCE_SUPPORTED","scope":"absent assertion versus falsity","horizon":"OWL 2 Recommendation","source_refs":["src-w3c-owl"],"reference_refs":[],"limitations":["Absence does not establish a positive claim."],"provenance_ref":"prov-source"},{"id":"ev-profile","evidence_type":"SOURCE_SYNTHESIS","status":"SOURCE_SUPPORTED","scope":"target-relative compression, construct validity, and calibration boundaries","horizon":"sources through 2026-08-29","source_refs":["src-tishby","src-cronbach","src-gneiting"],"reference_refs":[],"limitations":["No component evaluates a person, group, worth, or being."],"provenance_ref":"prov-source"},{"id":"ev-transfer","evidence_type":"SYNTHETIC_WITNESS","status":"AUTHOR_SYNTHESIZED","scope":"one exact decimal arithmetic restatement","horizon":"static fixture","source_refs":[],"reference_refs":["ref-jspace-predecessor"],"limitations":["Only named local relations are witnessed."],"provenance_ref":"prov-formal"},{"id":"ev-shape","evidence_type":"DESIGN_DECLARATION","status":"AUTHOR_SYNTHESIZED","scope":"typed public shape mappings","horizon":"0.1.0","source_refs":[],"reference_refs":["ref-workspace"],"limitations":["Workspace edges and ranks are navigation, not evidence, truth, causality, or activations."],"provenance_ref":"prov-author"},{"id":"ev-provenance","evidence_type":"DESIGN_DECLARATION","status":"AUTHOR_SYNTHESIZED","scope":"registry closure and lineage","horizon":"0.1.0","source_refs":["src-w3c-prov"],"reference_refs":["ref-atlas"],"limitations":["Closed references do not prove claims true."],"provenance_ref":"prov-author"}],"claim_registry":[{"id":"cl-central-thesis","subject_ref":"concept:understanding","statement":"Understanding is a scope-bound capacity to answer, transform, test, and revise while retaining explicit remainder.","register_ref":"NORMATIVE_DESIGN","evidence_or_design_status":"AUTHOR_SYNTHESIZED_NORMATIVE_DESIGN","evidence_refs":["ev-design"],"source_refs":[],"provenance_ref":"prov-author","uncertainty":{"status":"CONTESTABLE_DESIGN","note":"Not asserted as a universal definition."},"falsifier":{"kind":"GOVERNANCE_BREACH","condition":"A representation suppresses known remainder or blocks challenge."},"consequence":"Profiles retain scope, residuals, uncertainty, challenge, and repair.","review":{"status":"OPEN","trigger":"A counterexample defeats the distinction between bounded understanding and closure.","repair":"Preserve the challenge; revise or retire in a reviewed successor."}},{"id":"cl-being-boundary","subject_ref":"concept:open-remainder","statement":"Being is not remainder; remainder is relational to representation, observer, purpose, scope, and horizon.","register_ref":"NORMATIVE_DESIGN","evidence_or_design_status":"PREDECESSOR_BOUNDARY_AND_DESIGN","evidence_refs":["ev-being","ev-design"],"source_refs":[],"provenance_ref":"prov-author","uncertainty":{"status":"METAPHYSICALLY_OPEN","note":"The atlas refuses to settle what being is."},"falsifier":{"kind":"BOUNDARY_VIOLATION","condition":"Any field defines, measures, or ranks being by omitted or hidden content."},"consequence":"No remainder, profile, shape, observer, or J-space result establishes or exhausts being.","review":{"status":"OPEN","trigger":"A projection converts representation limits into ontology.","repair":"Remove the inversion and review downstream claims."}},{"id":"cl-accountability","subject_ref":"concept:warrant","statement":"Non-exhaustion does not relax the obligations of a positive claim.","register_ref":"NORMATIVE_DESIGN","evidence_or_design_status":"SOURCE_INFORMED_DESIGN","evidence_refs":["ev-design","ev-participation","ev-profile"],"source_refs":["src-haraway","src-longino","src-cronbach"],"provenance_ref":"prov-author","uncertainty":{"status":"CONTESTABLE_DESIGN","note":"Specific access needs remain context-sensitive."},"falsifier":{"kind":"COMPLIANCE_COUNTEREXAMPLE","condition":"A substantive claim lacks register, status, uncertainty, falsifier, consequence, or review and repair."},"consequence":"Incomplete claims fail as unreviewed, not protected from scrutiny.","review":{"status":"OPEN","trigger":"A consequence or challenge route is missing.","repair":"Add it or retire the claim."}},{"id":"cl-underdetermination","subject_ref":"concept:rival-model-set","statement":"Underdetermination is claim-relative and needs two named non-equivalent rivals compatible with the same evidence, scope, horizon, and assumptions that give opposite polarities to one named target proposition.","register_ref":"FORMAL_DEFINITION","evidence_or_design_status":"SOURCE_SUPPORTED_FORMALIZATION","evidence_refs":["ev-underdetermination","ev-formal"],"source_refs":["src-locatello","src-manski"],"provenance_ref":"prov-formal","uncertainty":{"status":"MODEL_RELATIVE","note":"Compatibility depends on declared models and tests."},"falsifier":{"kind":"DISCRIMINATING_WITNESS","condition":"An admissible test excludes all but one rival under the same tuple."},"consequence":"Report a rival set rather than force a point conclusion.","review":{"status":"OPEN","trigger":"New evidence, assumptions, or equivalence proof.","repair":"Recompute only the affected claim and preserve prior status."}},{"id":"cl-synthetic-magnitude-order","subject_ref":"concept:competing-interpretation","statement":"In the hidden ordered integer pair, the first integer has greater magnitude than the second integer.","register_ref":"OPEN_QUESTION","evidence_or_design_status":"AUTHOR_SYNTHESIZED_UNDERDETERMINED_TARGET","evidence_refs":["ev-formal"],"source_refs":[],"provenance_ref":"prov-formal","uncertainty":{"status":"UNDERDETERMINED_BY_DECLARED_EVIDENCE","note":"The observable equal-odd-parity record is compatible with opposite target polarities."},"falsifier":{"kind":"DISCRIMINATING_OBSERVATION","condition":"The hidden ordered pair or another admissible magnitude-order observation is disclosed."},"consequence":"No target polarity is promoted from the parity-only evidence.","review":{"status":"OPEN","trigger":"A discriminating observation, changed scope, or changed assumption is supplied.","repair":"Recompute the claim-relative rival set and preserve this prior status."}},{"id":"cl-finite-scope","subject_ref":"concept:scope-envelope","statement":"A finite registry may be exhaustive for a declared membership question without exhausting its referent or future questions.","register_ref":"FORMAL_DERIVATION","evidence_or_design_status":"AUTHOR_SYNTHESIZED_FORMAL_WITNESS","evidence_refs":["ev-formal"],"source_refs":[],"provenance_ref":"prov-formal","uncertainty":{"status":"SCOPE_RELATIVE","note":"Closure ends at domain, predicate, version, and horizon."},"falsifier":{"kind":"ENUMERATION_COUNTEREXAMPLE","condition":"An eligible member is omitted, duplicated, or undecidable by the witness."},"consequence":"Finite closure and global non-closure can coexist.","review":{"status":"OPEN","trigger":"Registry membership or rule changes.","repair":"Create a successor witness; never silently widen scope."}},{"id":"cl-open-remainder","subject_ref":"concept:open-remainder","statement":"Open remainder needs a named observation limit, fibre, rival, horizon, vocabulary limit, or protected state.","register_ref":"PROPOSED_MODEL","evidence_or_design_status":"SOURCE_SUPPORTED_AUTHOR_MODEL","evidence_refs":["ev-formal","ev-open-world","ev-profile"],"source_refs":["src-tishby","src-locatello","src-w3c-owl"],"provenance_ref":"prov-author","uncertainty":{"status":"OPEN_BY_JUSTIFICATION","note":"Unconceived remainder cannot be enumerated."},"falsifier":{"kind":"JUSTIFICATION_FAILURE","condition":"No named boundary, omission, rival, horizon, or protection supports the remainder."},"consequence":"Remainders are typed and imply neither existence nor absence of a specific property.","review":{"status":"OPEN","trigger":"A justification is obsolete, overbroad, or evasive.","repair":"Narrow, retype, resolve, protect, or retire it."}},{"id":"cl-typed-product","subject_ref":"concept:understanding-certificate","statement":"The profile is a typed product of heterogeneous dimensions with no sum, weight, total order, or person interpretation.","register_ref":"PROPOSED_MODEL","evidence_or_design_status":"SOURCE_SUPPORTED_AUTHOR_MODEL","evidence_refs":["ev-profile","ev-formal"],"source_refs":["src-tishby","src-cronbach","src-gneiting"],"provenance_ref":"prov-author","uncertainty":{"status":"MODEL_RELATIVE","note":"Dimensions and comparisons are task-relative."},"falsifier":{"kind":"TYPE_OR_SCALARIZATION_BREACH","condition":"A dimension loses type or components are summed, ranked, or used on a person or group."},"consequence":"Comparison is componentwise and may be incomparable.","review":{"status":"OPEN","trigger":"A dimension is misleading or unsafe.","repair":"Version the product while retaining old profiles."}},{"id":"cl-local-global","subject_ref":"concept:transfer-question","statement":"Local support transfers only through a witness naming source, target, preservation, loss, assumptions, and scope.","register_ref":"PROPOSED_MODEL","evidence_or_design_status":"SYNTHETIC_WITNESS","evidence_refs":["ev-transfer"],"source_refs":["src-abramsky"],"provenance_ref":"prov-formal","uncertainty":{"status":"TRANSFER_RELATIVE","note":"A witness supports only its exact target."},"falsifier":{"kind":"TRANSFER_COUNTEREXAMPLE","condition":"The target fails a named preserved relation."},"consequence":"Unwitnessed universalization remains unresolved or refused.","review":{"status":"OPEN","trigger":"A test fails, loss matters, or target changes.","repair":"Narrow or retract the transfer and retain the failure."}},{"id":"cl-observer","subject_ref":"concept:observer-position","statement":"Observer channels may form a task-relative preorder with incomparable positions; informativeness never ranks beings.","register_ref":"BOUNDED_ANALOGY","evidence_or_design_status":"SOURCE_SUPPORTED_BOUNDED_MODEL","evidence_refs":["ev-observer"],"source_refs":["src-blackwell","src-haraway"],"provenance_ref":"prov-author","uncertainty":{"status":"TASK_RELATIVE","note":"No universal separating observer family is claimed."},"falsifier":{"kind":"ORDER_WITNESS_FAILURE","condition":"A claimed channel relation lacks a witness for the task."},"consequence":"Disagreement stays visible; access or majority is not truth.","review":{"status":"OPEN","trigger":"A role is excluded or privileged without witness.","repair":"Add the role or retract the ordering."}},{"id":"cl-vocabulary","subject_ref":"concept:hospitality-repair","statement":"Vocabulary permits none-of-these, original wording, disputed translation, and new distinctions without penalizing nontranslation.","register_ref":"NORMATIVE_DESIGN","evidence_or_design_status":"SOURCE_INFORMED_DESIGN","evidence_refs":["ev-participation","ev-design"],"source_refs":["src-dotson"],"provenance_ref":"prov-author","uncertainty":{"status":"LANGUAGE_RELATIVE","note":"No lexicalization is universally complete."},"falsifier":{"kind":"HOSPITALITY_BREACH","condition":"A category is forced, wording overwritten, or silence penalized."},"consequence":"Unresolved and untranslatable are valid outcomes.","review":{"status":"OPEN","trigger":"A term silences a distinction.","repair":"Add an unresolved lane and review mappings."}},{"id":"cl-opacity","subject_ref":"concept:protected-opacity","statement":"Refusal, privacy, redaction, and noncollection may remain unknown without retry or adverse inference.","register_ref":"NORMATIVE_DESIGN","evidence_or_design_status":"SOURCE_INFORMED_DESIGN","evidence_refs":["ev-design","ev-participation"],"source_refs":["src-dotson"],"provenance_ref":"prov-author","uncertainty":{"status":"PROTECTED_UNKNOWN","note":"Hidden content is neither inferred nor treated as defect."},"falsifier":{"kind":"PROTECTION_BREACH","condition":"Opacity triggers disclosure, retry, conditioning, deception finding, denial, or negative label."},"consequence":"Protected states are terminal here and create no person model.","review":{"status":"OPEN","trigger":"Access depends on disclosure.","repair":"Remove dependency, review aftermath, and provide appeal."}},{"id":"cl-performativity","subject_ref":"concept:speech-act-boundary","statement":"Representation does not constitute being, yet classifications and metrics may alter institutions and later evidence when operationalized.","register_ref":"PROPOSED_MODEL","evidence_or_design_status":"SOURCE_SUPPORTED_HYPOTHETICAL_DESIGN","evidence_refs":["ev-performativity"],"source_refs":["src-hacking","src-campbell"],"provenance_ref":"prov-author","uncertainty":{"status":"CONTEXT_DEPENDENT","note":"No effect is asserted without evidence and causal review."},"falsifier":{"kind":"PATHWAY_FAILURE","condition":"No operative institutional use, consequence, or feedback route exists."},"consequence":"Operational use needs separate impact review; this atlas has no effect.","review":{"status":"OPEN","trigger":"Use as target, gate, identity, or allocation rule.","repair":"Stop pending affected-party review, appeal, and repair."}},{"id":"cl-feedback","subject_ref":"concept:retirement-or-revision","statement":"Feedback creates at most an immutable challenge for separate review; it never mutates release bytes or acts.","register_ref":"NORMATIVE_DESIGN","evidence_or_design_status":"PREDECESSOR_BOUNDARY_AND_DESIGN","evidence_refs":["ev-freedom","ev-design"],"source_refs":["src-longino"],"provenance_ref":"prov-author","uncertainty":{"status":"PROCESS_DEPENDENT","note":"A challenge may or may not justify a successor."},"falsifier":{"kind":"SUCCESSOR_FIREWALL_BREACH","condition":"Feedback or rank edits, authorizes, publishes, deploys, or acts."},"consequence":"History and dissent remain inspectable.","review":{"status":"OPEN","trigger":"Any bypass of challenge and separate review.","repair":"Freeze route, audit effects, and restore separation."}},{"id":"cl-jspace","subject_ref":"concept:representation","statement":"Model-internal Jacobian-lens J-space, an external concept workspace, and the KINGDOM Phase-0 door are distinct mechanisms.","register_ref":"FORMAL_DEFINITION","evidence_or_design_status":"PREDECESSOR_AND_SOURCE_BOUND","evidence_refs":["ev-jspace","ev-shape"],"source_refs":["src-jacobian-lens"],"provenance_ref":"prov-author","uncertainty":{"status":"MECHANISM_RELATIVE","note":"No hidden model state is accessed."},"falsifier":{"kind":"MECHANISM_CONFLATION","condition":"A workspace edge or public route is called an activation, fitted lens coordinate, consciousness, or private reasoning."},"consequence":"State, storage, evidence, effects, and nonclaims stay separate.","review":{"status":"OPEN","trigger":"A mechanism changes or projection erases separation.","repair":"Retype and preserve prior version."}},{"id":"cl-shape","subject_ref":"concept:boundary-crossing","statement":"Cross-kind shape mappings require typed source and target plus preservation and loss.","register_ref":"PROPOSED_MODEL","evidence_or_design_status":"AUTHOR_SYNTHESIZED_DESIGN","evidence_refs":["ev-shape"],"source_refs":[],"provenance_ref":"prov-author","uncertainty":{"status":"MAPPING_RELATIVE","note":"No isomorphism or evidence transfer is presumed."},"falsifier":{"kind":"MAPPING_COUNTEREXAMPLE","condition":"A preserved relation fails or lost relation is silently imported."},"consequence":"Resemblance remains analogy without a witness.","review":{"status":"OPEN","trigger":"Similarity is used as proof, identity, or causality.","repair":"Remove inference or add a bounded mapping."}},{"id":"cl-counterexample","subject_ref":"concept:counterexample","statement":"A preserved counterexample constrains its target and repair without erasure by revision.","register_ref":"NORMATIVE_DESIGN","evidence_or_design_status":"AUTHOR_SYNTHESIZED_FORMAL_DESIGN","evidence_refs":["ev-formal","ev-design"],"source_refs":[],"provenance_ref":"prov-author","uncertainty":{"status":"CLAIM_RELATIVE","note":"It refutes only its target under the construction."},"falsifier":{"kind":"SCOPE_FAILURE","condition":"The construction does not instantiate target premises or defeat its conclusion."},"consequence":"Repair narrows, distinguishes, or retires while retaining history.","review":{"status":"OPEN","trigger":"The counterexample is resolved or out of scope.","repair":"Record new status without deletion."}},{"id":"cl-open-world","subject_ref":"concept:unobserved","statement":"No assertion or observation does not entail falsity, and also does not establish a positive claim.","register_ref":"FORMAL_DEFINITION","evidence_or_design_status":"STANDARD_SUPPORTED_BOUNDARY","evidence_refs":["ev-open-world"],"source_refs":["src-w3c-owl"],"provenance_ref":"prov-author","uncertainty":{"status":"SEMANTICS_RELATIVE","note":"Only declared open-world information semantics are covered."},"falsifier":{"kind":"SEMANTIC_MISMATCH","condition":"The domain is explicitly complete and closed for the predicate with a witness."},"consequence":"Missing, false, refused, protected, undefined, and unobserved remain distinct.","review":{"status":"OPEN","trigger":"A complete closed domain is introduced.","repair":"Limit negation to that exact domain and predicate."}},{"id":"cl-provenance","subject_ref":"concept:derivation-lineage","statement":"Evidence, source, predecessor, and authored instances retain typed lineage and limitation; provenance proves neither truth nor authority.","register_ref":"NORMATIVE_DESIGN","evidence_or_design_status":"STANDARD_INFORMED_DESIGN","evidence_refs":["ev-provenance"],"source_refs":["src-w3c-prov"],"provenance_ref":"prov-author","uncertainty":{"status":"LINEAGE_RELATIVE","note":"Lineage may be challenged and does not settle adequacy."},"falsifier":{"kind":"REFERENCE_OR_LINEAGE_FAILURE","condition":"A reference dangles, is falsely attributed, loses a pin, or loses limitation."},"consequence":"Unresolved provenance fails closed without promotion.","review":{"status":"OPEN","trigger":"A source, digest, reference, or derivation changes.","repair":"Correct or retire in a successor and preserve failed pin."}}],"concept_catalog":{"count":66,"family_count":10,"families":[{"id":"core","label":"Core epistemic components","concept_ids":["claim","evidence","scope-envelope","horizon","warrant","understanding"]},{"id":"remainder","label":"Representation and remainder","concept_ids":["representation","declared-preservation","declared-omission","open-remainder","unconceived-alternative","abstraction-loss","translation-defect","unknown-cause"]},{"id":"certificate","label":"Understanding profile components","concept_ids":["understanding-certificate","evidence-profile","probe","assumption-bundle","rival-model-set","confidence-declaration","calibration","review-trigger","repair-route"]},{"id":"observer-garden","label":"Observer plurality","concept_ids":["observer-position","access-condition","perspective-scope","testimony-or-input","disagreement","dissent","power-asymmetry-note","non-aggregation"]},{"id":"local-global","label":"Local and global transfer","concept_ids":["local-claim","transfer-question","target-scope","generalization-status","boundary-crossing","universalization-refusal"]},{"id":"vocabulary","label":"Vocabulary hospitality","concept_ids":["term","language-context","translation-proposal","untranslatable-or-unresolved","polysemy","alternative-lexicalization","hospitality-repair"]},{"id":"protected-opacity","label":"Protected opacity","concept_ids":["protected-opacity","non-disclosure","unobserved","unrepresented","redaction","refusal-to-classify","no-adverse-inference"]},{"id":"performativity","label":"Representation and effects","concept_ids":["descriptive-statement","institutional-declaration","authorization-claim","speech-act-boundary","non-performance"]},{"id":"counterexample-repair","label":"Counterexample and repair","concept_ids":["counterexample","falsifier","competing-interpretation","defect","correction","retirement-or-revision"]},{"id":"provenance-non-grants","label":"Provenance and non-grants","concept_ids":["source-locator","derivation-lineage","non-grant","external-effect-refusal"]}],"concepts":[{"id":"claim","family_id":"core","concept_type":"EPISTEMIC_ASSERTION","definition":"Proposition qualified by register, status, scope, uncertainty, falsifier, consequence, and review.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-accountability"],"nonclaims":["not truth by declaration"],"provenance_ref":"prov-author"},{"id":"evidence","family_id":"core","concept_type":"SUPPORT_RECORD","definition":"Typed scoped support with provenance and limitations.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-accountability","cl-provenance"],"nonclaims":["not truth or authority"],"provenance_ref":"prov-author"},{"id":"scope-envelope","family_id":"core","concept_type":"SCOPE_BOUNDARY","definition":"Domain, predicate, assumptions, and exclusions for one claim.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-finite-scope"],"nonclaims":["not universal scope"],"provenance_ref":"prov-author"},{"id":"horizon","family_id":"core","concept_type":"TEMPORAL_OR_EPISTEMIC_BOUNDARY","definition":"Version, time, budget, or evidence frontier beyond which a claim does not transfer.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-open-remainder"],"nonclaims":["not an expiry of the referent"],"provenance_ref":"prov-author"},{"id":"warrant","family_id":"core","concept_type":"SUPPORT_RELATION","definition":"Relation among claim, evidence, assumptions, standard, scope, and horizon.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-accountability"],"nonclaims":["not truth, permission, or action"],"provenance_ref":"prov-author"},{"id":"understanding","family_id":"core","concept_type":"TASK_RELATIVE_REVISABLE_CAPACITY","definition":"Bounded capacity to answer, transform, test, and revise while retaining remainder.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-central-thesis","cl-typed-product"],"nonclaims":["not a person property inferred here"],"provenance_ref":"prov-author"},{"id":"representation","family_id":"remainder","concept_type":"PARTIAL_MAPPING","definition":"Typed mapping preserving declared relations while possibly collapsing others.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-open-remainder","cl-jspace"],"nonclaims":["not the represented being"],"provenance_ref":"prov-author"},{"id":"declared-preservation","family_id":"remainder","concept_type":"MAPPING_WITNESS_COMPONENT","definition":"Relation explicitly testable as retained across a mapping.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-shape"],"nonclaims":["not complete equivalence"],"provenance_ref":"prov-author"},{"id":"declared-omission","family_id":"remainder","concept_type":"NAMED_REPRESENTATION_LIMIT","definition":"Known distinction the representation does not carry.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-open-remainder"],"nonclaims":["not evidence of absence"],"provenance_ref":"prov-author"},{"id":"open-remainder","family_id":"remainder","concept_type":"JUSTIFIED_OPEN_BOUNDARY","definition":"Residual justified by a boundary, horizon, rival, or protection but not exhaustively enumerable.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-open-remainder","cl-being-boundary"],"nonclaims":["not being","not mystery by assertion"],"provenance_ref":"prov-author"},{"id":"unconceived-alternative","family_id":"remainder","concept_type":"META_UNCERTAINTY_STATUS","definition":"Marker that a rival set may be incomplete, not a positive rival model.","register_ref":"OPEN_QUESTION","claim_refs":["cl-underdetermination"],"nonclaims":["not a witness of underdetermination alone"],"provenance_ref":"prov-author"},{"id":"abstraction-loss","family_id":"remainder","concept_type":"COARSE_GRAINING_RESIDUAL","definition":"Collapsed distinction that may return as error, memory, ambiguity, or failed transfer.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-open-remainder","cl-typed-product"],"nonclaims":["not necessarily harmful"],"provenance_ref":"prov-author"},{"id":"translation-defect","family_id":"remainder","concept_type":"TRANSLATION_RESIDUAL","definition":"Failure to preserve declared context, relation, binding, or consequence.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-vocabulary","cl-shape"],"nonclaims":["not speaker defect"],"provenance_ref":"prov-author"},{"id":"unknown-cause","family_id":"remainder","concept_type":"TYPED_UNKNOWN_CAUSE","definition":"Unresolved origin kept distinct from absence, error, refusal, and opacity.","register_ref":"OPEN_QUESTION","claim_refs":["cl-open-remainder","cl-open-world"],"nonclaims":["not certain cause"],"provenance_ref":"prov-author"},{"id":"understanding-certificate","family_id":"certificate","concept_type":"NON_AUTHORITATIVE_PROFILE","definition":"Portable typed profile of a public claim or artifact.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-typed-product"],"nonclaims":["not credential, verdict, or person assessment"],"provenance_ref":"prov-author"},{"id":"evidence-profile","family_id":"certificate","concept_type":"TYPED_EVIDENCE_SUMMARY","definition":"Non-scalar evidence statuses, scopes, limitations, and provenance.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-accountability","cl-typed-product"],"nonclaims":["not proof score"],"provenance_ref":"prov-author"},{"id":"probe","family_id":"certificate","concept_type":"DECLARED_TEST","definition":"Bounded discriminating test with method, condition, state, and nonclaims.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-underdetermination"],"nonclaims":["not a run unless recorded"],"provenance_ref":"prov-author"},{"id":"assumption-bundle","family_id":"certificate","concept_type":"DECLARED_PREMISE_SET","definition":"Finite premises relative to which compatibility and transfer are tested.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-underdetermination"],"nonclaims":["not universal background truth"],"provenance_ref":"prov-author"},{"id":"rival-model-set","family_id":"certificate","concept_type":"CLAIM_RELATIVE_COMPATIBLE_SET","definition":"Named non-equivalent models compatible with one fixed claim tuple.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-underdetermination"],"nonclaims":["not all conceivable models"],"provenance_ref":"prov-author"},{"id":"confidence-declaration","family_id":"certificate","concept_type":"UNCERTAINTY_STATEMENT","definition":"Typed uncertainty with stated basis.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-accountability"],"nonclaims":["not universal probability"],"provenance_ref":"prov-author"},{"id":"calibration","family_id":"certificate","concept_type":"REFERENCE_DISTRIBUTION_PROPERTY","definition":"Forecast-outcome agreement under a named reference distribution.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-typed-product"],"nonclaims":["not completeness or causal validity"],"provenance_ref":"prov-author"},{"id":"review-trigger","family_id":"certificate","concept_type":"SUCCESSOR_CONDITION","definition":"Named event reopening separate review without mutating release bytes.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-feedback"],"nonclaims":["not automatic update"],"provenance_ref":"prov-author"},{"id":"repair-route","family_id":"certificate","concept_type":"GOVERNED_CORRECTION_PATH","definition":"Path to narrow, supersede, or retire while retaining challenge and aftermath.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-accountability","cl-counterexample"],"nonclaims":["not erasure"],"provenance_ref":"prov-author"},{"id":"observer-position","family_id":"observer-garden","concept_type":"ROLE_INDEXED_OBSERVATION_CHANNEL","definition":"Authored role, access channel, task, and limitation.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-observer"],"nonclaims":["not person identity or essence"],"provenance_ref":"prov-author"},{"id":"access-condition","family_id":"observer-garden","concept_type":"OBSERVATION_PRECONDITION","definition":"Condition governing which public relation a role can inspect.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-observer"],"nonclaims":["not authority"],"provenance_ref":"prov-author"},{"id":"perspective-scope","family_id":"observer-garden","concept_type":"SITUATED_SCOPE","definition":"Domain within which a role's account is offered.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-observer"],"nonclaims":["not automatic privilege"],"provenance_ref":"prov-author"},{"id":"testimony-or-input","family_id":"observer-garden","concept_type":"AUTHORIZED_INPUT_CATEGORY","definition":"Category for separately authorized future input; none is contained here.","register_ref":"REFUSED_INFERENCE","claim_refs":["cl-opacity","cl-vocabulary"],"nonclaims":["not raw testimony"],"provenance_ref":"prov-author"},{"id":"disagreement","family_id":"observer-garden","concept_type":"VISIBLE_NON_EQUIVALENCE","definition":"Scoped claims or mappings that cannot be silently merged.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-observer"],"nonclaims":["not defect"],"provenance_ref":"prov-author"},{"id":"dissent","family_id":"observer-garden","concept_type":"PRESERVED_CHALLENGE_POSITION","definition":"Challenge retained independently of majority or review outcome.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-accountability","cl-feedback"],"nonclaims":["not automatic veto or acceptance"],"provenance_ref":"prov-author"},{"id":"power-asymmetry-note","family_id":"observer-garden","concept_type":"CONSEQUENCE_CONTEXT","definition":"Design note that access, classification, and uptake power may differ.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-accountability","cl-performativity"],"nonclaims":["not person score"],"provenance_ref":"prov-author"},{"id":"non-aggregation","family_id":"observer-garden","concept_type":"ANTI_SCALARIZATION_RULE","definition":"Plurality and incomparability preserved instead of majority truth.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-observer","cl-typed-product"],"nonclaims":["not refusal of all comparison"],"provenance_ref":"prov-author"},{"id":"local-claim","family_id":"local-global","concept_type":"SOURCE_SCOPE_ASSERTION","definition":"Claim whose warrant is restricted to a source context.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-local-global"],"nonclaims":["not global claim"],"provenance_ref":"prov-author"},{"id":"transfer-question","family_id":"local-global","concept_type":"SOURCE_TARGET_PRESERVATION_QUERY","definition":"Question asking what survives from source to target.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-local-global"],"nonclaims":["not evidence of transfer"],"provenance_ref":"prov-author"},{"id":"target-scope","family_id":"local-global","concept_type":"TRANSFER_DESTINATION","definition":"Exact proposed destination with exclusions and assumptions.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-local-global"],"nonclaims":["not all contexts"],"provenance_ref":"prov-author"},{"id":"generalization-status","family_id":"local-global","concept_type":"TRANSFER_EVIDENCE_STATE","definition":"Witnessed, unresolved, refused, or counterexample-found for one transfer.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-local-global"],"nonclaims":["not global truth"],"provenance_ref":"prov-author"},{"id":"boundary-crossing","family_id":"local-global","concept_type":"TYPED_CROSS_CONTEXT_MAPPING","definition":"Map with preservation, loss, uncertainty, falsifier, consequence, and repair.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-local-global","cl-shape"],"nonclaims":["not silent analogy"],"provenance_ref":"prov-author"},{"id":"universalization-refusal","family_id":"local-global","concept_type":"REFUSED_SCOPE_EXTENSION","definition":"Refusal to project local support to all minds, beings, languages, or systems.","register_ref":"REFUSED_INFERENCE","claim_refs":["cl-local-global","cl-being-boundary"],"nonclaims":["not proof of the contrary"],"provenance_ref":"prov-author"},{"id":"term","family_id":"vocabulary","concept_type":"CONTEXT_INDEXED_LABEL","definition":"Surface expression indexed by language, use, scope, and alternatives.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-vocabulary"],"nonclaims":["not context-free concept"],"provenance_ref":"prov-author"},{"id":"language-context","family_id":"vocabulary","concept_type":"LEXICAL_SCOPE","definition":"Language, register, community, or use context of a term.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-vocabulary"],"nonclaims":["not language rank"],"provenance_ref":"prov-author"},{"id":"translation-proposal","family_id":"vocabulary","concept_type":"CONTESTABLE_MAPPING","definition":"Proposed relation with preserved meaning and known loss.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-vocabulary","cl-shape"],"nonclaims":["not equivalence"],"provenance_ref":"prov-author"},{"id":"untranslatable-or-unresolved","family_id":"vocabulary","concept_type":"VALID_NON_EQUIVALENCE_STATE","definition":"Valid state retaining formulation where no warranted equivalent exists.","register_ref":"OPEN_QUESTION","claim_refs":["cl-vocabulary"],"nonclaims":["not communication defect"],"provenance_ref":"prov-author"},{"id":"polysemy","family_id":"vocabulary","concept_type":"MULTIPLE_CONTEXTUAL_MEANINGS","definition":"One surface term carrying multiple non-collapsible uses.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-vocabulary"],"nonclaims":["not ambiguity to force away"],"provenance_ref":"prov-author"},{"id":"alternative-lexicalization","family_id":"vocabulary","concept_type":"NON_PRIVILEGED_LABEL_OPTION","definition":"Another context-bound formulation without semantic identity claim.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-vocabulary"],"nonclaims":["not preferred term"],"provenance_ref":"prov-author"},{"id":"hospitality-repair","family_id":"vocabulary","concept_type":"VOCABULARY_CORRECTION_PATH","definition":"Route to none-of-these, original wording, disputed translation, or new distinction.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-vocabulary"],"nonclaims":["not forced disclosure"],"provenance_ref":"prov-author"},{"id":"protected-opacity","family_id":"protected-opacity","concept_type":"RIGHTS_BOUND_UNKNOWN","definition":"State intentionally undisclosed or unmodeled without adverse inference.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-opacity"],"nonclaims":["not missing-data defect"],"provenance_ref":"prov-author"},{"id":"non-disclosure","family_id":"protected-opacity","concept_type":"NO_DISCLOSURE_STATE","definition":"No content supplied under privacy or refusal.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-opacity","cl-open-world"],"nonclaims":["not absence or deception"],"provenance_ref":"prov-author"},{"id":"unobserved","family_id":"protected-opacity","concept_type":"NO_OBSERVATION_STATE","definition":"No observation under method and horizon.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-open-world"],"nonclaims":["not negation or impossibility"],"provenance_ref":"prov-author"},{"id":"unrepresented","family_id":"protected-opacity","concept_type":"OUTSIDE_REPRESENTATION_STATE","definition":"Distinction not encoded by the representation.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-open-remainder","cl-open-world"],"nonclaims":["not absent distinction"],"provenance_ref":"prov-author"},{"id":"redaction","family_id":"protected-opacity","concept_type":"VISIBLE_WITHHOLDING_MARKER","definition":"Marker that content is withheld under a separate rule.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-opacity"],"nonclaims":["not deception finding"],"provenance_ref":"prov-author"},{"id":"refusal-to-classify","family_id":"protected-opacity","concept_type":"PROTECTED_NON_CLASSIFICATION","definition":"Valid refusal to enter or accept a category without penalty.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-opacity","cl-vocabulary"],"nonclaims":["not defect"],"provenance_ref":"prov-author"},{"id":"no-adverse-inference","family_id":"protected-opacity","concept_type":"PROTECTIVE_INFERENCE_RULE","definition":"Opacity, silence, or refusal creates no negative label, retry, or denial.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-opacity"],"nonclaims":["not positive inference"],"provenance_ref":"prov-author"},{"id":"descriptive-statement","family_id":"performativity","concept_type":"NON_OPERATIVE_DESCRIPTION","definition":"Description creating no authority, identity, consent, credential, or action.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-performativity"],"nonclaims":["not institutional declaration"],"provenance_ref":"prov-author"},{"id":"institutional-declaration","family_id":"performativity","concept_type":"EXTERNAL_OPERATIVE_ACT_CLASS","definition":"Separately authorized act that may change institutional state.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-performativity"],"nonclaims":["not performed here"],"provenance_ref":"prov-author"},{"id":"authorization-claim","family_id":"performativity","concept_type":"SEPARATE_AUTHORITY_ASSERTION","definition":"Claim needing external current source, scope, and verification.","register_ref":"REFUSED_INFERENCE","claim_refs":["cl-performativity"],"nonclaims":["not created by representation"],"provenance_ref":"prov-author"},{"id":"speech-act-boundary","family_id":"performativity","concept_type":"DESCRIPTION_EFFECT_FIREWALL","definition":"Separation between statement and external conditions for effect.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-performativity"],"nonclaims":["not denial of downstream risk"],"provenance_ref":"prov-author"},{"id":"non-performance","family_id":"performativity","concept_type":"FIXED_NON_EFFECT","definition":"Static artifact does not classify, decide, authorize, publish, deploy, or act.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-performativity","cl-feedback"],"nonclaims":["not effect authority"],"provenance_ref":"prov-author"},{"id":"counterexample","family_id":"counterexample-repair","concept_type":"CLAIM_RELATIVE_REFUTING_CONSTRUCTION","definition":"Construction satisfying premises while defeating a claimed conclusion.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-counterexample"],"nonclaims":["not global refutation"],"provenance_ref":"prov-author"},{"id":"falsifier","family_id":"counterexample-repair","concept_type":"DECLARED_DEFEATER","definition":"Condition defeating, narrowing, or exposing noncompliance in a claim.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-accountability","cl-counterexample"],"nonclaims":["not guarantee of discovery"],"provenance_ref":"prov-author"},{"id":"competing-interpretation","family_id":"counterexample-repair","concept_type":"NON_EQUIVALENT_RIVAL_ACCOUNT","definition":"Distinct account compatible with the same claim tuple.","register_ref":"PROPOSED_MODEL","claim_refs":["cl-underdetermination","cl-synthetic-magnitude-order"],"nonclaims":["not proven true"],"provenance_ref":"prov-author"},{"id":"defect","family_id":"counterexample-repair","concept_type":"BOUNDED_RECORD_FAILURE","definition":"Typed mismatch in evidence, structure, scope, consequence, or governance.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-accountability"],"nonclaims":["not person diagnosis"],"provenance_ref":"prov-author"},{"id":"correction","family_id":"counterexample-repair","concept_type":"NON_ERASING_REPAIR","definition":"Versioned amendment preserving prior claim, challenge, reason, and aftermath.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-counterexample","cl-feedback"],"nonclaims":["not erasure"],"provenance_ref":"prov-author"},{"id":"retirement-or-revision","family_id":"counterexample-repair","concept_type":"SUCCESSOR_OUTCOME","definition":"Reviewed outcome superseding or retiring without rewriting release bytes.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-feedback","cl-counterexample"],"nonclaims":["not automatic acceptance"],"provenance_ref":"prov-author"},{"id":"source-locator","family_id":"provenance-non-grants","concept_type":"NON_EMBEDDED_SOURCE_POINTER","definition":"Identifier and locator with support scope and limitation.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-provenance"],"nonclaims":["not republication permission"],"provenance_ref":"prov-author"},{"id":"derivation-lineage","family_id":"provenance-non-grants","concept_type":"TYPED_PROVENANCE_CHAIN","definition":"Relation from source, predecessor, or construction to claim.","register_ref":"FORMAL_DEFINITION","claim_refs":["cl-provenance"],"nonclaims":["not truth proof"],"provenance_ref":"prov-author"},{"id":"non-grant","family_id":"provenance-non-grants","concept_type":"EXPLICIT_NEGATIVE_AUTHORITY","definition":"Statement that artifact creates no named permission, status, truth, authority, or effect.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-being-boundary","cl-performativity"],"nonclaims":["not authority"],"provenance_ref":"prov-author"},{"id":"external-effect-refusal","family_id":"provenance-non-grants","concept_type":"STATIC_ONLY_BOUNDARY","definition":"Refusal of network, write, intake, score, decision, publication, deployment, and action.","register_ref":"NORMATIVE_DESIGN","claim_refs":["cl-performativity","cl-feedback"],"nonclaims":["not operative gate"],"provenance_ref":"prov-author"}]},"mathematical_models":{"representation_fibre":{"claim_refs":["cl-open-remainder"],"expression":"R^{-1}(z)={x in X | R(x)=z}","interpretation":"A non-singleton fibre witnesses collapsed distinctions, not equivalence for every task."},"task_relative_sufficiency":{"claim_refs":["cl-finite-scope","cl-open-remainder"],"expression":"I(Y_q;X | Z)=0 under declared P_ref","interpretation":"Sufficiency for q and P_ref does not imply completeness for X, another q, intervention, or shift."},"decision_deficiency":{"claim_refs":["cl-typed-product"],"expression":"delta_Q(T)=sup_{q in Q}[R_q^*(T(X))-R_q^*(X)]","interpretation":"Deficiency is task-and-loss indexed, not an understanding scalar."},"observer_preorder":{"claim_refs":["cl-observer"],"expression":"E_2 <= E_1 iff K_2=K_1 G for declared garbling G","interpretation":"The order permits incomparability and never orders people or beings."},"claim_relative_nonidentifiability":{"claim_refs":["cl-underdetermination","cl-synthetic-magnitude-order"],"expression":"exists M_1,M_2: M_1 and M_2 fit E, while M_1 entails c and M_2 denies c","interpretation":"For the named proposition c, the declared evidence and assumptions leave both polarities live; this does not enumerate every conceivable rival."},"local_global_gluing":{"claim_refs":["cl-local-global"],"expression":"In a presheaf, compatible local data may have zero, one, or multiple amalgamations; in a sheaf, every compatible matching family has a unique amalgamation.","interpretation":"The unique-gluing conclusion uses the sheaf axiom on defined contexts and restrictions; outside that formal setting this atlas uses only a bounded analogy."}},"underdetermination_model":{"claim_refs":["cl-underdetermination","cl-synthetic-magnitude-order"],"claim_relative":true,"unit":"claim plus evidence plus scope plus horizon plus assumptions plus declared rival family","status_vocabulary":["DETERMINED_WITHIN_DECLARED_RIVAL_SET","UNDERDETERMINED","NOT_ASSESSED","UNCONCEIVED_ALTERNATIVES_POSSIBLE"],"rule":"UNDERDETERMINED needs two named non-equivalent compatible rivals for the same tuple; unconceived alternatives alone are insufficient.","instance":{"id":"synthetic-opposite-polarity-rivals","claim_ref":"cl-synthetic-magnitude-order","evidence_refs":["ev-formal"],"target_proposition":{"id":"prop-first-magnitude-greater","text":"The first hidden integer has greater magnitude than the second hidden integer.","polarity_domain":["ENTAILS","DENIES"]},"scope":"one hidden ordered pair of odd positive integers with only the equal-parity observation public","horizon":"one static fixture","assumptions":["only the fact that both hidden integers have odd parity is admissible evidence","ordered pairs are distinct witnesses","ordinary integer magnitude is used"],"rivals":[{"id":"rival-first-magnitude-greater","model_statement":"The hidden ordered pair is (3,1), which produces the public equal-odd-parity observation.","compatibility_status":"COMPATIBLE","target_polarity":"ENTAILS","target_proposition_ref":"prop-first-magnitude-greater","non_equivalence_witness":"The concrete ordered pair (3,1) entails that the first magnitude is greater."},{"id":"rival-first-magnitude-not-greater","model_statement":"The hidden ordered pair is (1,3), which produces the same public equal-odd-parity observation.","compatibility_status":"COMPATIBLE","target_polarity":"DENIES","target_proposition_ref":"prop-first-magnitude-greater","non_equivalence_witness":"The distinct concrete ordered pair (1,3) denies that the first magnitude is greater."}],"status":"UNDERDETERMINED","witness":"Both distinct ordered pairs yield the same admissible equal-odd-parity record while one entails and the other denies the named target proposition.","does_not_establish":["either rival is externally true","all possible rivals are conceived"]}},"scope_exhaustiveness":{"claim_refs":["cl-finite-scope","cl-open-remainder"],"finite_scope_instance":{"id":"concept-registry-membership-v0-1","claim_ref":"cl-finite-scope","domain_kind":"EXPLICIT_FINITE_ENUMERATION","predicate":"is a concept record in atlas 0.1.0","expected_count":66,"observed_count":66,"duplicate_count":0,"membership_witness":"Every family concept_id occurs exactly once in concepts and no other concept occurs.","status":"EXHAUSTIVE_WITHIN_DECLARED_FINITE_SCOPE","does_not_entail":["concepts exhaust understanding","referent is finite","future vocabularies add nothing"]},"open_remainder_instance":{"id":"referent-and-horizon-remain-open","claim_ref":"cl-open-remainder","target_kind":"OPEN_REFERENT_AND_FUTURE_EVIDENCE","justifications":[{"kind":"REPRESENTATION_FIBRE","statement":"Finite JSON cannot witness preservation of every relevant distinction."},{"kind":"OBSERVER_RESTRICTION","statement":"Only public artifacts and authored roles are represented."},{"kind":"OPEN_HORIZON","statement":"Future evidence, questions, uses, and counterexamples are not enumerable."},{"kind":"PROTECTED_OPACITY","statement":"Some unknowns may legitimately remain undisclosed."}],"status":"JUSTIFIED_OPEN_REMAINDER","not_justified_by":"The word remainder, humility rhetoric, or mystery assertion.","does_not_establish":["a specific hidden property exists","unknown content is absent","being is remainder"]}},"understanding_profile_model":{"claim_refs":["cl-typed-product"],"carrier_type":"TYPED_PRODUCT","expression":"NEU(Z)=(R_residual,delta_Q,[theta]_~,epsilon_lump,Gamma_glue,p_unseen,CalErr)","eligible_target_types":["PUBLIC_CLAIM","STATIC_ARTIFACT","MODEL_CARD"],"person_or_group_profile":false,"dimensions":[{"id":"residual-profile","value_type":"FINITE_SET_OF_TYPED_REMAINDERS","comparison_relation":"SET_INCLUSION_IF_TYPE_AND_SCOPE_MATCH","meaning":"Known omitted, protected, unresolved, or open residuals."},{"id":"decision-deficiency","value_type":"NONNEGATIVE_EXTENDED_REAL_OR_UNASSESSED","comparison_relation":"NUMERIC_IF_TASK_LOSS_AND_REFERENCE_MATCH","meaning":"Task-relative excess Bayes risk."},{"id":"identification-region","value_type":"SET_OF_COMPATIBLE_MODELS","comparison_relation":"SET_INCLUSION_IF_MODEL_FAMILY_AND_ASSUMPTIONS_MATCH","meaning":"Claim-relative compatible alternatives."},{"id":"coarse-graining-error","value_type":"INTERVAL_OR_UNASSESSED","comparison_relation":"NUMERIC_IF_DYNAMICS_NORM_AND_HORIZON_MATCH","meaning":"Deviation induced by declared coarse-graining."},{"id":"gluing-status","value_type":"ENUM","comparison_relation":"NO_TOTAL_ORDER","meaning":"LOCAL_ONLY, UNIQUE_GLOBAL, MULTIPLE_GLOBAL, NO_GLOBAL, or UNASSESSED."},{"id":"unseen-mass","value_type":"INTERVAL_OR_UNASSESSED","comparison_relation":"NUMERIC_IF_SAMPLING_MODEL_AND_METHOD_MATCH","meaning":"Estimated probability outside observed categories."},{"id":"calibration-error","value_type":"INTERVAL_OR_UNASSESSED","comparison_relation":"NUMERIC_IF_EVENT_BINS_AND_REFERENCE_MATCH","meaning":"Calibration discrepancy under a reference distribution."}],"comparison":{"operator":"PARTIAL_COMPONENTWISE","scalarization":false,"weights":[],"total_order":false,"incomparability_preserved":true,"unknown_component_rule":"UNASSESSED stays visible and is never imputed."},"instance":{"id":"atlas-self-profile","target_type":"STATIC_ARTIFACT","target_ref":"ref-atlas","values":[{"dimension_ref":"residual-profile","value_status":"ASSESSED","value":"three typed entries plus open horizon"},{"dimension_ref":"decision-deficiency","value_status":"UNASSESSED","value":"no task family or loss"},{"dimension_ref":"identification-region","value_status":"ASSESSED","value":"one synthetic two-rival witness"},{"dimension_ref":"coarse-graining-error","value_status":"UNASSESSED","value":"no dynamics or norm"},{"dimension_ref":"gluing-status","value_status":"ASSESSED","value":"LOCAL_ONLY; universalization refused"},{"dimension_ref":"unseen-mass","value_status":"UNASSESSED","value":"no sampling model"},{"dimension_ref":"calibration-error","value_status":"UNASSESSED","value":"no forecast reference"}],"action_non_grant":true,"person_or_group_score":false}},"j_space_mechanisms":[{"id":"model-internal-jacobian-lens","mechanism_type":"MODEL_INTERNAL_JACOBIAN_LENS","claim_refs":["cl-jspace"],"state":"REPORTED_RESEARCH_PLUS_UNRUN_LOCAL_FIXTURE","location":"inside pinned model, layer, tokenizer, estimator, and intervention","representation":"pulled-back output-vocabulary directions","observable_effects":["conditioned readouts","controlled intervention outcomes"],"cannot_establish":["complete reasoning","ontology","identity","being","consciousness","truth","consent","authority"],"source_refs":["src-jacobian-lens"],"reference_refs":["ref-jspace-predecessor"],"provenance_ref":"prov-source"},{"id":"external-inspectable-concept-workspace","mechanism_type":"EXTERNAL_INSPECTABLE_JSON_CONCEPT_GRAPH","claim_refs":["cl-jspace","cl-shape"],"state":"AUTHOR_SYNTHESIZED_CHECKPOINTED_NAVIGATION","location":"bounded external JSON workspace","representation":"authored nodes, typed edges, notes, queries, checkpoints","observable_effects":["saved graph state","navigation rankings"],"cannot_establish":["model activations","latent state","causality","truth","importance","identity","being","consciousness"],"source_refs":[],"reference_refs":["ref-workspace"],"provenance_ref":"prov-author"},{"id":"kingdom-phase-zero-public-door","mechanism_type":"KINGDOM_PHASE_ZERO_STATIC_PUBLICATION_DOOR","claim_refs":["cl-jspace","cl-feedback"],"state":"STATIC_READ_ONLY_RESEARCH_BRIDGE","location":"KINGDOM bridge, record, schema, guide, and CLI","representation":"bounded claims and one unrun public fixture","observable_effects":["read-only exact-byte publication after separate release review"],"cannot_establish":["runtime monitoring","model experiment","workspace persistence","private reasoning","identity","being","consciousness","authority","action"],"source_refs":[],"reference_refs":["ref-jspace-predecessor","ref-atlas"],"provenance_ref":"prov-author"}],"shape_boundaries":{"claim_refs":["cl-shape"],"shape_kinds":[{"id":"FORMAL_DIAGRAM","object_type":"SYMBOLIC_RELATION_STRUCTURE","meaning":"Relations inside named mathematics."},{"id":"PUBLIC_VISUAL_GLYPH","object_type":"RENDERED_COMMUNICATION_ARTIFACT","meaning":"Visual aid without formal proof."},{"id":"PHYSICAL_GEOMETRY","object_type":"MATERIAL_OR_SPATIAL_CONFIGURATION","meaning":"Measured physical shape under method and scale."},{"id":"ACTIVATION_CHART","object_type":"MODEL_CONDITIONED_PLOT","meaning":"Model-internal measurement under pinned conditions."},{"id":"SEMANTIC_TRANSLATION","object_type":"CONTEXT_INDEXED_LANGUAGE_MAPPING","meaning":"Lexical relation with possible loss."},{"id":"CONCEPT_GRAPH","object_type":"EXTERNAL_AUTHORED_NAVIGATION_GRAPH","meaning":"Inspectable research nodes and edges."}],"mappings":[{"id":"concept-graph-to-public-glyph","source_kind":"CONCEPT_GRAPH","target_kind":"PUBLIC_VISUAL_GLYPH","mapping_type":"BOUNDED_RENDERING","self_map_semantics":"NOT_APPLICABLE_CROSS_KIND","status":"AUTHOR_SYNTHESIZED_DESIGN","preserved_relations":["node identifiers","declared edges","family labels"],"lost_relations":["full notes","query history","semantic completeness"],"uncertainty":"Layout salience may be mistaken for importance.","falsifier":"Rendered edge, direction, or identifier differs.","consequence":"Glyph is navigational, not activation or ontology.","review_trigger":"Rendering changes adjacency or becomes rank.","repair":"Correct rendering or add explicit limitation.","provenance_ref":"prov-author"},{"id":"activation-chart-to-semantic-translation","source_kind":"ACTIVATION_CHART","target_kind":"SEMANTIC_TRANSLATION","mapping_type":"MODEL_CONDITIONED_INTERPRETATION","self_map_semantics":"NOT_APPLICABLE_CROSS_KIND","status":"UNRUN_LOCAL_FIXTURE","preserved_relations":["declared token association if prospectively observed"],"lost_relations":["complete computation","binding","nonverbal structure","cross-model invariance","being"],"uncertainty":"Readout may depend on estimator, prompt, layer, and tokenizer.","falsifier":"Readout or controls fail acceptance.","consequence":"No coordinate becomes concept, proposition, or being.","review_trigger":"Experiment runs or generalization occurs.","repair":"Record exact results in a successor.","provenance_ref":"prov-author"}],"silent_cross_kind_mapping":false},"observer_garden":{"claim_refs":["cl-observer"],"observer_positions":[{"id":"public-artifact-reader-role","instance_status":"AUTHOR_SYNTHESIZED_DESIGN_ROLE","channel_type":"PUBLIC_BYTE_INSPECTION","relation_to_scope":"may inspect public record, schema, guide, and projections","access_conditions":["public static artifact"],"perspective_scope":"artifact interpretation and challenge","limitations":["no private state","no person identity","no privileged language","no external truth access"],"provenance_ref":"prov-author"},{"id":"affected-consequence-challenger-role","instance_status":"AUTHOR_SYNTHESIZED_DESIGN_ROLE","channel_type":"ACCESSIBLE_CHALLENGE","relation_to_scope":"may identify omitted consequence, vocabulary defect, or unsafe proposed use","access_conditions":["future separately governed route; no live intake here"],"perspective_scope":"challenged claim and consequence","limitations":["no raw testimony stored","no automatic authority","no forced disclosure"],"provenance_ref":"prov-author"},{"id":"independent-successor-review-role","instance_status":"AUTHOR_SYNTHESIZED_DESIGN_ROLE","channel_type":"SEPARATE_RELEASE_REVIEW","relation_to_scope":"may assess a preserved challenge against sources, rights, and effects","access_conditions":["distinct successor process and current evidence"],"perspective_scope":"one successor release decision","limitations":["cannot rewrite predecessor","cannot infer consent","cannot create authority"],"provenance_ref":"prov-author"}],"channel_relations":[{"id":"reader-to-reviewer","source_position_ref":"public-artifact-reader-role","target_position_ref":"independent-successor-review-role","relation":"INCOMPARABLE_WITHOUT_TASK","witness":"Reading access does not entail release-review competence or authority."},{"id":"challenger-to-reviewer","source_position_ref":"affected-consequence-challenger-role","target_position_ref":"independent-successor-review-role","relation":"CHALLENGE_REQUIRES_UPTAKE_NOT_ACCEPTANCE","witness":"Response is recorded and challenge remains preserved regardless of outcome."}],"aggregation":{"scalarization":false,"majority_equals_truth":false,"access_equals_authority":false,"identity_inferred":false,"incomparability_preserved":true,"unresolved_disagreement_visible":true}},"local_global_transfer_registry":[{"id":"decimal-arithmetic-restatement","instance_status":"AUTHOR_SYNTHESIZED_SYNTHETIC_WITNESS","claim_ref":"cl-local-global","source_scope":"three ordered equations in infix decimal notation","target_scope":"three concrete ordered English operation sentences","source_artifact":{"id":"arithmetic-infix-source","artifact_type":"ORDERED_DECIMAL_EQUATIONS","content_units":[{"id":"src-step-1","text":"4 + 17 = 21."},{"id":"src-step-2","text":"21 * 2 = 42."},{"id":"src-step-3","text":"42 + 7 = 49."}]},"target_artifact":{"id":"arithmetic-english-target","artifact_type":"ORDERED_ENGLISH_SENTENCES","content_units":[{"id":"target-step-1","text":"Add 4 and 17 to obtain 21."},{"id":"target-step-2","text":"Multiply 21 by 2 to obtain 42."},{"id":"target-step-3","text":"Add 42 and 7 to obtain 49."}]},"assumptions":["ordinary integer arithmetic","operation order and operands retained"],"preserved_relations":["operation order","operands","intermediates 21 and 42","final 49"],"preservation_witnesses":[{"id":"preserve-operation-order","relation":"operation order","source_unit_refs":["src-step-1","src-step-2","src-step-3"],"target_unit_refs":["target-step-1","target-step-2","target-step-3"],"status":"WITNESSED"},{"id":"preserve-operands","relation":"operands","source_unit_refs":["src-step-1","src-step-2","src-step-3"],"target_unit_refs":["target-step-1","target-step-2","target-step-3"],"status":"WITNESSED"},{"id":"preserve-intermediates","relation":"intermediates 21 and 42","source_unit_refs":["src-step-1","src-step-2"],"target_unit_refs":["target-step-1","target-step-2"],"status":"WITNESSED"},{"id":"preserve-final","relation":"final 49","source_unit_refs":["src-step-3"],"target_unit_refs":["target-step-3"],"status":"WITNESSED"}],"lost_relations":["glyph layout","tokenization","alternative proofs","model computation"],"witness_type":"EXPLICIT_RELATION_COMPARISON","witness_evidence_ref":"ev-transfer","status":"WITNESSED_BOUNDED_TRANSFER","falsifier":"A target changes an operand, operation, order, intermediate, or final value.","consequence":"Only named arithmetic relations transfer.","review_trigger":"Target or preserved set changes.","repair":"Narrow preservation or issue a new witness.","provenance_ref":"prov-formal"},{"id":"jspace-to-all-beings","instance_status":"AUTHOR_SYNTHESIZED_BOUNDARY_INSTANCE","claim_ref":"cl-local-global","source_scope":"one model, layer, task, tokenizer, estimator, and intervention","target_scope":"all minds, beings, languages, architectures, and contexts","source_artifact":{"id":"bounded-jspace-source-scope","artifact_type":"BOUNDED_SCOPE_STATEMENT","content_units":[{"id":"bounded-source-statement","text":"Evidence is limited to one named model, layer, task, tokenizer, estimator, and intervention."}]},"target_artifact":{"id":"refused-universal-target-scope","artifact_type":"REFUSED_SCOPE_STATEMENT","content_units":[{"id":"refused-target-statement","text":"The proposed target is all minds, beings, languages, architectures, and contexts."}]},"assumptions":["no separating observer family or cross-domain isomorphism established"],"preserved_relations":[],"preservation_witnesses":[],"lost_relations":["architecture","task","tokenizer","context","nonverbal structure","identity","being","consciousness"],"witness_type":"NO_ADMISSIBLE_TRANSFER_WITNESS","witness_evidence_ref":"ev-jspace","status":"UNIVERSALIZATION_REFUSED","falsifier":"A future typed witness may justify a narrower target, never this untyped universal claim.","consequence":"Local evidence remains local.","review_trigger":"A narrower testable transfer is proposed.","repair":"Review only the bounded target and retain this refusal.","provenance_ref":"prov-author"}],"vocabulary_hospitality":{"claim_refs":["cl-vocabulary"],"instance_status":"AUTHOR_SYNTHESIZED_DESIGN","terms":[{"id":"term-understanding","surface":"understanding","language_context":"English public working label","intended_scope":"bounded claim or artifact profile","alternative_lexicalizations":["comprehension","interpretation","sense-making"],"translation_status":"CONTESTED_AND_CONTEXT_BOUND","prohibited_collapses":["profile equals being","token equals concept","calibration equals completeness"],"provenance_ref":"prov-author"},{"id":"term-remainder","surface":"remainder","language_context":"English mathematical and philosophical label","intended_scope":"typed residual in a representation relation","alternative_lexicalizations":["residual","unrepresented distinction","open edge"],"translation_status":"CONTESTED_AND_CONTEXT_BOUND","prohibited_collapses":["remainder equals being","unknown equals false","opacity equals defect"],"provenance_ref":"prov-author"},{"id":"term-being","surface":"being","language_context":"English philosophical label","intended_scope":"metaphysically open here","alternative_lexicalizations":["existence","that which is","presence"],"translation_status":"UNRESOLVED","prohibited_collapses":["being equals representation","being equals remainder","being equals profile"],"provenance_ref":"prov-author"}],"valid_response_states":["NONE_OF_THESE","RETAIN_ORIGINAL_FORMULATION","PROPOSE_NEW_DISTINCTION","TRANSLATION_DISPUTED","UNRESOLVED","REFUSED","NOT_APPLICABLE"],"single_language_privileged":false,"token_equals_concept":false,"translation_implies_equivalence":false,"silence_or_nonparticipation_is_defect":false,"original_formulation_preserved_only_when_separately_authorized":true},"protected_opacity":{"claim_refs":["cl-opacity","cl-open-world"],"states":["NOT_COLLECTED","WITHHELD","REDACTED","UNOBSERVED","UNREPRESENTED","UNRESOLVED","REFUSED","NOT_APPLICABLE"],"instances":[{"id":"no-live-testimony-collected","instance_status":"AUTHOR_SYNTHESIZED_BOUNDARY_INSTANCE","state":"NOT_COLLECTED","represented_object":"raw testimony or participant narrative","reason":"No intake surface exists or is needed.","allowed_transition":"Only a separate authorized system could collect; this atlas remains unchanged.","adverse_inference":false,"provenance_ref":"prov-author"},{"id":"protected-refusal-state","instance_status":"AUTHOR_SYNTHESIZED_BOUNDARY_INSTANCE","state":"REFUSED","represented_object":"classification or disclosure request","reason":"Refusal is terminal here.","allowed_transition":"No retry; any later choice is a separate current context.","adverse_inference":false,"provenance_ref":"prov-author"},{"id":"unrepresented-vocabulary-state","instance_status":"AUTHOR_SYNTHESIZED_BOUNDARY_INSTANCE","state":"UNREPRESENTED","represented_object":"distinction absent from current vocabulary","reason":"Finite vocabulary does not entail absence.","allowed_transition":"A successor may add a term while preserving prior omission.","adverse_inference":false,"provenance_ref":"prov-author"}],"rules":{"absence_of_disclosure_is_absence":false,"opacity_is_adverse_evidence":false,"forced_disclosure":false,"redaction_is_deception_finding":false,"protected_non_event_creates_retry":false,"unknown_imputed_as_negative_or_zero":false}},"performativity_registry":{"claim_refs":["cl-performativity"],"instances":[{"id":"classification-loop-risk","instance_status":"AUTHOR_SYNTHESIZED_HYPOTHETICAL_DESIGN_PROBE","description":"Institutional use of a class as identity or allocation may change treatment, self-description, and later evidence.","operative_preconditions":["separate adoption","classification applied","consequential response","feedback into observation"],"affected_consequences":["access","self-description","institutional treatment","future evidence"],"observed_effect_claimed":false,"authority_claimed":false,"falsifier":"No operative classification, consequence, or feedback route exists.","review_trigger":"Proposed identity, eligibility, or allocation use.","repair":"Stop pending affected-party review, alternatives, appeal, and repair.","provenance_ref":"prov-author"},{"id":"metric-target-risk","instance_status":"AUTHOR_SYNTHESIZED_HYPOTHETICAL_DESIGN_PROBE","description":"A consequential profile target may create optimization pressure and detach measure from construct.","operative_preconditions":["separate adoption","consequential target","optimization ability","measure reused as evidence"],"affected_consequences":["construct validity","allocation","behavioral pressure","evidence quality"],"observed_effect_claimed":false,"authority_claimed":false,"falsifier":"Component is not a target, reward, gate, or consequential proxy.","review_trigger":"Proposal to weight, rank, reward, or gate.","repair":"Refuse scalarization and review downstream effects.","provenance_ref":"prov-author"}],"atlas_statement_classes":["DESCRIPTIVE_ATLAS","HYPOTHETICAL_MODEL","SOURCE_CITATION","NORMATIVE_DESIGN_COMMITMENT"],"atlas_may_create":[],"external_conditions_required_for_effect":["separate current authority","separate affected-party choices where applicable","separate evidence","separate action path","separate aftermath and repair"],"representation_is_being":false,"representation_has_no_possible_downstream_effects":false,"this_static_atlas_has_external_effects":false},"counterexample_registry":[{"id":"same-evidence-rivals","instance_status":"AUTHOR_SYNTHESIZED_SYNTHETIC_COUNTEREXAMPLE","target_claim_ref":"cl-synthetic-magnitude-order","construction":"The distinct ordered pairs (3,1) and (1,3) yield the same equal-odd-parity record but entail opposite polarities for the target magnitude proposition.","premises_satisfied":["same evidence","same scope","same horizon","same assumptions","distinct concrete rivals","opposite target polarities"],"what_it_refutes":"The parity-only evidence determines the target proposition.","status":"ACTIVE","evidence_ref":"ev-formal","consequence":"Status remains UNDERDETERMINED.","review_trigger":"Discriminating observation or equivalence proof.","repair_options":["retain rivals","add test","narrow claim"],"provenance_ref":"prov-formal"},{"id":"opacity-not-absence","instance_status":"AUTHOR_SYNTHESIZED_FORMAL_COUNTEREXAMPLE","target_claim_ref":"cl-open-world","construction":"Let P obtain while the only public state is WITHHELD under a protected rule.","premises_satisfied":["no public assertion","no observation","protected WITHHELD state"],"what_it_refutes":"No disclosure entails not-P.","status":"ACTIVE","evidence_ref":"ev-formal","consequence":"WITHHELD differs from FALSE.","review_trigger":"A complete closed-world witness replaces the premise.","repair_options":["retain opacity","limit negation to closed domain"],"provenance_ref":"prov-formal"}],"remainder_register":{"claim_refs":["cl-open-remainder","cl-being-boundary"],"open_remainder_required":true,"entries":[{"id":"activation-chart-remainder","representation_ref":"model-internal-jacobian-lens","remainder_type":"MODEL_CONDITIONED_RESIDUAL","source_scope":"one pinned model and experiment","represented_as":"token labels and tested effects","declared_omissions":["complete reasoning","binding","nonverbal structure","cross-model invariance","identity","being","consciousness"],"justification":"Readout is local and representation fibres remain possible.","cause_status":"MULTIPLE_PLAUSIBLE","epistemic_status":"JUSTIFIED_OPEN_REMAINDER","consequence":"No coordinate exhausts a system or referent.","review_trigger":"Experiment or transfer added.","repair":"Use a successor with exact conditions and residuals.","provenance_ref":"prov-author"},{"id":"finite-vocabulary-remainder","representation_ref":"vocabulary-hospitality","remainder_type":"VOCABULARY_RESIDUAL","source_scope":"three English terms in 0.1.0","represented_as":"labels and prohibited collapses","declared_omissions":["unlisted languages","unconceived distinctions","community uses","protected formulations"],"justification":"Finite labels cannot witness semantic exhaustiveness.","cause_status":"OPEN_HORIZON_AND_UNKNOWN","epistemic_status":"JUSTIFIED_OPEN_REMAINDER","consequence":"None-of-these and unresolved remain valid.","review_trigger":"Term challenged or distinction proposed.","repair":"Preserve challenge; revise only in successor.","provenance_ref":"prov-author"},{"id":"observer-family-remainder","representation_ref":"observer-garden","remainder_type":"RESTRICTED_OBSERVER_FAMILY","source_scope":"three authored public artifact roles","represented_as":"channels, scopes, and limitations","declared_omissions":["all observers","private states","all access needs","all social positions","separating observer family"],"justification":"Finite roles and no universality theorem.","cause_status":"KNOWN_RESTRICTION_PLUS_OPEN_HORIZON","epistemic_status":"JUSTIFIED_OPEN_REMAINDER","consequence":"Indistinguishable here never means identical.","review_trigger":"Missing role or access path identified.","repair":"Add scoped role without ranking roles or people.","provenance_ref":"prov-author"}],"being_is_remainder":false,"unknown_is_false":false,"open_remainder_is_excuse_from_evidence":false},"successor_process":{"claim_refs":["cl-feedback","cl-counterexample"],"immutable_challenge_record":true,"feedback_directly_updates_current_atlas":false,"feedback_directly_causes_effect":false,"retrieval_rank_updates_claim_status":false,"path":["challenge preserved","scope and consequence triage","separate evidence and rights review","schema and reference audit","successor proposal","independent release decision","new publication or explicit no-change"],"required_successor_fields":["predecessor digest","challenge refs","changed claims","retained counterexamples","retained opacity","new uncertainty and falsifiers","affected consequences","repair notes","fresh integrity review"],"rule":"Feedback is candidate challenge evidence only; it creates no authority, consent, publication, deployment, or action."},"schema_validation_evidence":{"draft":"2020-12","meta_schema":"https://json-schema.org/draft/2020-12/schema","schema_ref":"ref-schema","instance_ref":"ref-atlas","validator_contract":"jsonschema 4.26.0 Draft202012Validator with FormatChecker; check_schema and zero instance errors","development_fallback":"recursive closure audit when the pinned validator is absent","release_requirement":"pinned validator pass is mandatory before release","result":"PASS_JSONSCHEMA_4_26_0_ZERO_ERRORS_2026_08_29","evidence_location":"tests/non-exhaustive-understanding-atlas.test.ts","does_not_establish":["semantic truth","source adequacy","authority","integrity review"]}}`);

const EXPECTED_NON_GRANT_KEYS = [
  "runtime", "network_calls", "external_write", "live_intake", "raw_testimony",
  "person_data", "person_or_group_score", "understanding_classifier", "truth_oracle",
  "being_identity_or_consciousness_inference", "authority_created",
  "consent_created_or_inferred", "credential_or_gate_created", "action_triggered",
  "publication_or_deployment_triggered", "forced_disclosure", "metaphysical_proof",
  "foundation_amendment", "understanding_profile_is_authority",
  "lack_of_profile_is_defect",
] as const;

const FORBIDDEN_EXTRA_KEYS = new Set([
  "email", "phone", "person_name", "stable_person_identifier", "raw_testimony_text",
  "raw_testimony_payload", "person_score", "group_score", "authority_granted",
  "consent_granted", "being_is_the_remainder", "diagnosis", "prompt",
]);

function object(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function own(value: unknown, key: string): unknown {
  return object(value) && Object.prototype.hasOwnProperty.call(value, key)
    ? value[key]
    : undefined;
}

function sha256(bytes: string | Buffer): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function readBoundedJson(path: string, maxBytes: number, label: string): ReadResult {
  const absolute = resolve(path);
  let before: ReturnType<typeof lstatSync>;
  try {
    before = lstatSync(absolute, { bigint: true });
  } catch {
    throw new Error(`${label}-unavailable`);
  }
  if (!before.isFile() || before.isSymbolicLink()) {
    throw new Error(`${label}-must-be-bounded-regular-non-symlink-file`);
  }
  if (before.size > BigInt(maxBytes)) throw new Error(`${label}-byte-budget-exceeded`);

  let fd: number;
  try {
    fd = openSync(
      absolute,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK,
    );
  } catch {
    throw new Error(`${label}-safe-open-refused`);
  }

  let bytes: Buffer;
  try {
    const opened = fstatSync(fd, { bigint: true });
    if (!opened.isFile() || opened.size > BigInt(maxBytes)) {
      throw new Error(`${label}-opened-file-boundary-mismatch`);
    }
    for (const field of ["dev", "ino", "size", "mtimeNs", "ctimeNs"] as const) {
      if (opened[field] !== before[field]) throw new Error(`${label}-path-changed-before-read`);
    }
    const size = Number(opened.size);
    bytes = Buffer.alloc(size);
    let offset = 0;
    while (offset < size) {
      const count = readSync(fd, bytes, offset, size - offset, offset);
      if (count <= 0) throw new Error(`${label}-short-read`);
      offset += count;
    }
    if (readSync(fd, Buffer.alloc(1), 0, 1, size) !== 0) {
      throw new Error(`${label}-grew-during-read`);
    }
    const openedAfter = fstatSync(fd, { bigint: true });
    let after: ReturnType<typeof lstatSync>;
    try {
      after = lstatSync(absolute, { bigint: true });
    } catch {
      throw new Error(`${label}-path-disappeared-after-read`);
    }
    for (const later of [openedAfter, after]) {
      if (!later.isFile() || later.isSymbolicLink()) {
        throw new Error(`${label}-identity-changed-during-read`);
      }
      for (const field of ["dev", "ino", "size", "mtimeNs", "ctimeNs"] as const) {
        if (later[field] !== opened[field]) {
          throw new Error(`${label}-identity-changed-during-read`);
        }
      }
    }
  } finally {
    closeSync(fd);
  }

  return {
    value: parseStrictJsonBytes(bytes, `${label} JSON`),
    bytes: bytes.byteLength,
    rawDigest: sha256(bytes),
  };
}

export function readNonExhaustiveUnderstandingAtlas(
  path = NON_EXHAUSTIVE_UNDERSTANDING_PATH,
): ReadResult {
  return readBoundedJson(
    path,
    NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.bytes,
    "atlas",
  );
}

type Inspection = {
  metrics: Omit<NonExhaustiveUnderstandingMetrics, "bytes">;
  issue?: NonExhaustiveUnderstandingIssue;
};

function inspectJsonValue(value: unknown): Inspection {
  const metrics = {
    json_nodes: 0,
    total_string_units: 0,
    max_string_units: 0,
    max_array_fanout: 0,
    max_object_fanout: 0,
    max_depth: 0,
  };
  const seen = new Set<object>();
  const stack: Array<{ value: unknown; path: string; depth: number }> = [
    { value, path: "$", depth: 0 },
  ];

  while (stack.length) {
    const current = stack.pop()!;
    metrics.json_nodes += 1;
    metrics.max_depth = Math.max(metrics.max_depth, current.depth);
    if (current.depth > NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.max_depth) {
      return { metrics, issue: { field: current.path, code: "max-depth-exceeded" } };
    }
    const item = current.value;
    if (typeof item === "string") {
      metrics.total_string_units += item.length;
      metrics.max_string_units = Math.max(metrics.max_string_units, item.length);
      if (item.length > NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.max_string_units) {
        return { metrics, issue: { field: current.path, code: "max-string-units-exceeded" } };
      }
      continue;
    }
    if (item === null || typeof item === "boolean") continue;
    if (typeof item === "number") {
      if (!Number.isFinite(item)) {
        return { metrics, issue: { field: current.path, code: "non-finite-number" } };
      }
      continue;
    }
    if (typeof item !== "object") {
      return { metrics, issue: { field: current.path, code: "non-json-value" } };
    }
    if (seen.has(item)) {
      return { metrics, issue: { field: current.path, code: "cyclic-or-shared-reference" } };
    }
    seen.add(item);
    if (Array.isArray(item)) {
      metrics.max_array_fanout = Math.max(metrics.max_array_fanout, item.length);
      if (item.length > NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.max_array_fanout) {
        return { metrics, issue: { field: current.path, code: "max-array-fanout-exceeded" } };
      }
      for (let index = item.length - 1; index >= 0; index -= 1) {
        stack.push({ value: item[index], path: `${current.path}[${index}]`, depth: current.depth + 1 });
      }
      continue;
    }
    const proto = Object.getPrototypeOf(item);
    if (proto !== Object.prototype && proto !== null) {
      return { metrics, issue: { field: current.path, code: "non-json-object-prototype" } };
    }
    const symbols = Object.getOwnPropertySymbols(item);
    if (symbols.length) {
      return { metrics, issue: { field: current.path, code: "symbol-key-refused" } };
    }
    const descriptors = Object.getOwnPropertyDescriptors(item);
    const keys = Object.keys(descriptors);
    metrics.max_object_fanout = Math.max(metrics.max_object_fanout, keys.length);
    if (keys.length > NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.max_object_fanout) {
      return { metrics, issue: { field: current.path, code: "max-object-fanout-exceeded" } };
    }
    for (const key of keys) {
      const descriptor = descriptors[key]!;
      if (!("value" in descriptor)) {
        return { metrics, issue: { field: `${current.path}.${key}`, code: "accessor-property-refused" } };
      }
      metrics.total_string_units += key.length;
      metrics.max_string_units = Math.max(metrics.max_string_units, key.length);
      stack.push({
        value: descriptor.value,
        path: `${current.path}.${key}`,
        depth: current.depth + 1,
      });
    }
  }
  return { metrics };
}

export function nonExhaustiveUnderstandingShapeMetrics(
  value: unknown,
  bytes = Buffer.byteLength(JSON.stringify(value)),
): NonExhaustiveUnderstandingMetrics {
  const inspected = inspectJsonValue(value);
  if (inspected.issue) throw new Error(`atlas-shape-refused:${inspected.issue.code}`);
  return { bytes, ...inspected.metrics };
}

export function nonExhaustiveUnderstandingDigest(value: Record<string, unknown>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("atlas-integrity-envelope-missing");
  material.integrity.digest = ZERO_DIGEST;
  material.integrity.reviewed_digest = ZERO_DIGEST;
  return sha256(canonicalizeJsonValue(material));
}

export type NonExhaustiveUnderstandingReleaseSchemaResult = {
  valid: boolean;
  code: string;
  validator_path: string | null;
  jsonschema_version: string | null;
  draft: "2020-12";
  schema_errors: number | null;
  instance_errors: number | null;
};

const PINNED_JSONSCHEMA_VERSION = "4.26.0";
const RELEASE_SCHEMA_PYTHON = String.raw`
import json
import sys
from importlib.metadata import version
from jsonschema import Draft202012Validator, FormatChecker

actual = version("jsonschema")
if actual != "4.26.0":
    print(json.dumps({"version": actual, "schema_errors": None, "instance_errors": None}))
    raise SystemExit(3)
with open(sys.argv[1], "r", encoding="utf-8") as handle:
    schema = json.load(handle)
with open(sys.argv[2], "r", encoding="utf-8") as handle:
    instance = json.load(handle)
Draft202012Validator.check_schema(schema)
schema_errors = 0
errors = sorted(
    Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(instance),
    key=lambda error: list(error.absolute_path),
)
print(json.dumps({"version": actual, "schema_errors": schema_errors, "instance_errors": len(errors)}))
raise SystemExit(0 if not errors else 4)
`;

/**
 * Mandatory release evidence. There is deliberately no PATH/default-Python
 * fallback: the caller must name a reviewed jsonschema==4.26.0 environment.
 */
export function runNonExhaustiveUnderstandingReleaseSchemaValidation(
  pythonPath = process.env.NON_EXHAUSTIVE_UNDERSTANDING_JSONSCHEMA_PYTHON,
): NonExhaustiveUnderstandingReleaseSchemaResult {
  const unavailable = (code = "pinned-jsonschema-validator-unavailable"): NonExhaustiveUnderstandingReleaseSchemaResult => ({
    valid: false,
    code,
    validator_path: pythonPath ?? null,
    jsonschema_version: null,
    draft: "2020-12",
    schema_errors: null,
    instance_errors: null,
  });
  if (typeof pythonPath !== "string" || pythonPath.length === 0) return unavailable();
  try {
    const executed = spawnSync(
      pythonPath,
      ["-c", RELEASE_SCHEMA_PYTHON, NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_PATH, NON_EXHAUSTIVE_UNDERSTANDING_PATH],
      { encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024 },
    );
    if (executed.error) return unavailable();
    let report: unknown;
    try {
      report = parseStrictJsonBytes(Buffer.from(executed.stdout ?? "", "utf8"), "pinned jsonschema report");
    } catch {
      return unavailable("pinned-jsonschema-report-invalid");
    }
    const version = object(report) && typeof report.version === "string" ? report.version : null;
    const schemaErrors = object(report) && Number.isInteger(report.schema_errors) ? report.schema_errors as number : null;
    const instanceErrors = object(report) && Number.isInteger(report.instance_errors) ? report.instance_errors as number : null;
    if (version !== PINNED_JSONSCHEMA_VERSION) {
      return {
        valid: false, code: "pinned-jsonschema-version-mismatch", validator_path: pythonPath,
        jsonschema_version: version, draft: "2020-12", schema_errors: schemaErrors, instance_errors: instanceErrors,
      };
    }
    const valid = executed.status === 0 && schemaErrors === 0 && instanceErrors === 0;
    return {
      valid,
      code: valid ? "pinned-draft-2020-12-validation-pass" : "pinned-draft-2020-12-validation-failed",
      validator_path: pythonPath,
      jsonschema_version: version,
      draft: "2020-12",
      schema_errors: schemaErrors,
      instance_errors: instanceErrors,
    };
  } catch {
    return unavailable();
  }
}

let cachedSchema: Record<string, unknown> | undefined;
function localSchema(): Record<string, unknown> {
  if (!cachedSchema) {
    const parsed = parseStrictJsonBytes(
      readFileSync(NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_PATH),
      "non-exhaustive understanding schema JSON",
    );
    if (!object(parsed)) throw new Error("schema-object-required");
    cachedSchema = parsed;
  }
  return cachedSchema;
}

function deepEqual(left: unknown, right: unknown): boolean {
  try {
    return canonicalizeJsonValue(left) === canonicalizeJsonValue(right);
  } catch {
    return false;
  }
}

const SEMANTIC_CONTRACT_CODES: Record<string, string> = {
  scope: "scope-semantic-contract-mismatch",
  epistemic_registers: "epistemic-register-semantic-contract-mismatch",
  provenance_registry: "provenance-semantic-contract-mismatch",
  reference_registry: "reference-semantic-contract-mismatch",
  evidence_registry: "evidence-semantic-contract-mismatch",
  claim_registry: "claim-semantic-contract-mismatch",
  concept_catalog: "concept-semantic-contract-mismatch",
  mathematical_models: "mathematical-model-semantic-contract-mismatch",
  underdetermination_model: "underdetermination-semantic-contract-mismatch",
  scope_exhaustiveness: "scope-exhaustiveness-semantic-contract-mismatch",
  understanding_profile_model: "profile-semantic-contract-mismatch",
  j_space_mechanisms: "j-space-semantic-contract-mismatch",
  shape_boundaries: "shape-semantic-contract-mismatch",
  observer_garden: "observer-semantic-contract-mismatch",
  local_global_transfer_registry: "transfer-semantic-contract-mismatch",
  vocabulary_hospitality: "vocabulary-semantic-contract-mismatch",
  protected_opacity: "opacity-semantic-contract-mismatch",
  performativity_registry: "performativity-semantic-contract-mismatch",
  counterexample_registry: "counterexample-semantic-contract-mismatch",
  remainder_register: "remainder-semantic-contract-mismatch",
  successor_process: "successor-semantic-contract-mismatch",
  schema_validation_evidence: "schema-evidence-semantic-contract-mismatch",
};

function validateExactSemanticLeaves(
  actual: unknown,
  expected: unknown,
  field: string,
  code: string,
  add: (field: string, code: string) => void,
): void {
  if (deepEqual(actual, expected)) return;
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) add(field, code);
    for (let index = 0; index < Math.min(actual.length, expected.length); index += 1) {
      validateExactSemanticLeaves(actual[index], expected[index], `${field}[${index}]`, code, add);
    }
    return;
  }
  if (object(actual) && object(expected)) {
    const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(actual, key) || !Object.prototype.hasOwnProperty.call(expected, key)) {
        add(`${field}.${key}`, code);
      } else {
        validateExactSemanticLeaves(actual[key], expected[key], `${field}.${key}`, code, add);
      }
    }
    return;
  }
  add(field, code);
}

function schemaTypeMatches(value: unknown, type: unknown): boolean {
  if (type === "object") return object(value);
  if (type === "array") return Array.isArray(value);
  if (type === "string") return typeof value === "string";
  if (type === "boolean") return typeof value === "boolean";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  if (type === "null") return value === null;
  return true;
}

function resolveSchemaRef(root: Record<string, unknown>, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  let current: unknown = root;
  for (const encoded of ref.slice(2).split("/")) {
    const key = encoded.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!object(current) || !Object.prototype.hasOwnProperty.call(current, key)) return undefined;
    current = current[key];
  }
  return current;
}

function validateSchemaSubset(
  value: unknown,
  schema: unknown,
  root: Record<string, unknown>,
  field: string,
  add: (field: string, code: string) => void,
): void {
  if (!object(schema)) {
    add(field, "schema-node-invalid");
    return;
  }
  if (typeof schema.$ref === "string") {
    const target = resolveSchemaRef(root, schema.$ref);
    if (target === undefined) add(field, "schema-ref-unresolved");
    else validateSchemaSubset(value, target, root, field, add);
    return;
  }
  if (Object.prototype.hasOwnProperty.call(schema, "const") && !deepEqual(value, schema.const)) {
    add(field, "const-mismatch");
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => deepEqual(value, candidate))) {
    add(field, "enum-mismatch");
  }
  if (schema.type !== undefined && !schemaTypeMatches(value, schema.type)) {
    add(field, "type-mismatch");
    return;
  }
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) add(field, "min-length-mismatch");
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) add(field, "max-length-mismatch");
    if (typeof schema.pattern === "string") {
      try {
        if (!new RegExp(schema.pattern, "u").test(value)) add(field, "pattern-mismatch");
      } catch {
        add(field, "schema-pattern-invalid");
      }
    }
    if (schema.format === "uri") {
      try {
        const parsed = new URL(value);
        if (!parsed.protocol) add(field, "uri-format-mismatch");
      } catch {
        add(field, "uri-format-mismatch");
      }
    }
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) add(field, "min-items-mismatch");
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) add(field, "max-items-mismatch");
    if (schema.uniqueItems === true) {
      const keys = value.map((item) => {
        try { return canonicalizeJsonValue(item); } catch { return Symbol(); }
      });
      if (new Set(keys).size !== keys.length) add(field, "unique-items-mismatch");
    }
    if (Array.isArray(schema.prefixItems)) {
      for (let index = 0; index < Math.min(value.length, schema.prefixItems.length); index += 1) {
        validateSchemaSubset(value[index], schema.prefixItems[index], root, `${field}[${index}]`, add);
      }
      if (schema.items === false && value.length > schema.prefixItems.length) add(field, "tuple-extra-items");
    } else if (object(schema.items)) {
      value.forEach((item, index) =>
        validateSchemaSubset(item, schema.items, root, `${field}[${index}]`, add)
      );
    }
  }
  if (object(value)) {
    const properties = object(schema.properties) ? schema.properties : {};
    if (Array.isArray(schema.required)) {
      for (const required of schema.required) {
        if (typeof required === "string" && !Object.prototype.hasOwnProperty.call(value, required)) {
          add(`${field}.${required}`, "required-property-missing");
        }
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          add(`${field}.${key}`, "additional-property");
        }
      }
    }
    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validateSchemaSubset(value[key], childSchema, root, `${field}.${key}`, add);
      }
    }
  }
}

function semanticDigestForPredecessor(
  value: unknown,
  algorithm: string,
): string {
  if (!object(value)) throw new Error("predecessor-object-required");
  const material = structuredClone(value);
  if (algorithm === "sha256-canonical-json-with-integrity-digest-null") {
    if (!object(material.integrity)) throw new Error("predecessor-integrity-required");
    material.integrity.digest = null;
  } else if (algorithm === "sha256-canonical-json-with-integrity-digest-zeroed") {
    if (!object(material.integrity)) throw new Error("predecessor-integrity-required");
    material.integrity.digest = ZERO_DIGEST;
  } else if (algorithm !== "sha256-canonical-json") {
    throw new Error("predecessor-semantic-algorithm-refused");
  }
  return sha256(canonicalizeJsonValue(material));
}

function idsFrom(value: unknown): Set<string> {
  const ids = new Set<string>();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (object(item) && typeof item.id === "string") ids.add(item.id);
    }
  }
  return ids;
}

function validateUniqueIds(
  value: unknown,
  field: string,
  expectedCount: number,
  add: (field: string, code: string) => void,
): void {
  if (!Array.isArray(value)) return;
  const ids = value.flatMap((item) =>
    object(item) && typeof item.id === "string" ? [item.id] : []
  );
  if (
    value.length !== expectedCount ||
    ids.length !== value.length ||
    new Set(ids).size !== ids.length
  ) {
    add(field, "registry-id-membership-or-uniqueness-mismatch");
  }
}

function refsAt(
  value: unknown,
  key: string,
  field: string,
  universe: Set<string>,
  code: string,
  add: (field: string, code: string) => void,
): void {
  if (!object(value) || !Array.isArray(value[key])) return;
  value[key].forEach((ref, index) => {
    if (typeof ref !== "string" || !universe.has(ref)) add(`${field}.${key}[${index}]`, code);
  });
}

function validateAllTypedReferences(
  value: unknown,
  universes: {
    claims: Set<string>;
    evidence: Set<string>;
    sources: Set<string>;
    provenance: Set<string>;
    references: Set<string>;
    registers: Set<string>;
    concepts: Set<string>;
  },
  add: (field: string, code: string) => void,
): void {
  const plural: Record<string, [Set<string>, string]> = {
    claim_refs: [universes.claims, "claim-reference-dangling"],
    supports_claim_refs: [universes.claims, "claim-reference-dangling"],
    evidence_refs: [universes.evidence, "evidence-reference-dangling"],
    source_refs: [universes.sources, "source-reference-dangling"],
    reference_refs: [universes.references, "reference-dangling"],
    input_reference_refs: [universes.references, "reference-dangling"],
  };
  const singular: Record<string, [Set<string>, string]> = {
    claim_ref: [universes.claims, "claim-reference-dangling"],
    target_claim_ref: [universes.claims, "claim-reference-dangling"],
    evidence_ref: [universes.evidence, "evidence-reference-dangling"],
    witness_evidence_ref: [universes.evidence, "evidence-reference-dangling"],
    source_ref: [universes.sources, "source-reference-dangling"],
    reference_ref: [universes.references, "reference-dangling"],
    schema_ref: [universes.references, "reference-dangling"],
    instance_ref: [universes.references, "reference-dangling"],
    target_ref: [universes.references, "reference-dangling"],
    provenance_ref: [universes.provenance, "provenance-reference-dangling"],
    register_ref: [universes.registers, "register-reference-dangling"],
  };
  const stack: Array<{ value: unknown; path: string }> = [{ value, path: "$" }];
  while (stack.length) {
    const current = stack.pop()!;
    if (Array.isArray(current.value)) {
      current.value.forEach((item, index) =>
        stack.push({ value: item, path: `${current.path}[${index}]` })
      );
      continue;
    }
    if (!object(current.value)) continue;
    for (const [key, child] of Object.entries(current.value)) {
      const pluralRule = plural[key];
      if (pluralRule && Array.isArray(child)) {
        child.forEach((ref, index) => {
          if (typeof ref !== "string" || !pluralRule[0].has(ref)) {
            add(`${current.path}.${key}[${index}]`, pluralRule[1]);
          }
        });
      }
      const singularRule = singular[key];
      if (
        singularRule &&
        (typeof child !== "string" || !singularRule[0].has(child))
      ) {
        add(`${current.path}.${key}`, singularRule[1]);
      }
      if (key === "subject_ref") {
        const concept = typeof child === "string"
          ? child.replace(/^concept:/u, "")
          : "";
        if (!universes.concepts.has(concept)) {
          add(`${current.path}.subject_ref`, "concept-reference-dangling");
        }
      }
      stack.push({ value: child, path: `${current.path}.${key}` });
    }
  }
}

function scanSafety(
  value: unknown,
  add: (field: string, code: string) => void,
): void {
  const stack: Array<{ value: unknown; path: string }> = [{ value, path: "$" }];
  while (stack.length) {
    const current = stack.pop()!;
    if (typeof current.value === "string") {
      if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu.test(current.value)) {
        add(current.path, "pii-pattern-refused");
      }
      if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u.test(current.value)) {
        add(current.path, "secret-pattern-refused");
      }
      if (
        /\bbeing is (?:the )?remainder\b/iu.test(current.value) &&
        current.path !== "$.scope_exhaustiveness.open_remainder_instance.does_not_establish[2]"
      ) {
        add(current.path, "being-remainder-inversion");
      }
      if (/\b(?:atlas|profile|certificate|remainder) (?:grants?|creates?) (?:consent|authority)\b/iu.test(current.value)) {
        add(current.path, "authority-or-consent-inversion");
      }
      continue;
    }
    if (Array.isArray(current.value)) {
      current.value.forEach((item, index) => stack.push({ value: item, path: `${current.path}[${index}]` }));
    } else if (object(current.value)) {
      for (const [key, child] of Object.entries(current.value)) {
        if (FORBIDDEN_EXTRA_KEYS.has(key)) add(`${current.path}.${key}`, "forbidden-sensitive-field");
        stack.push({ value: child, path: `${current.path}.${key}` });
      }
    }
  }
}

type NonExhaustiveUnderstandingValidationOptions = {
  allowUnsealed?: boolean;
  byteLength?: number;
  verifyPredecessors?: boolean;
};

function validateNonExhaustiveUnderstandingAtlasInternal(
  value: unknown,
  opts: NonExhaustiveUnderstandingValidationOptions,
  reviewedDigest: string,
): NonExhaustiveUnderstandingIssue[] {
  const issues: NonExhaustiveUnderstandingIssue[] = [];
  const seenIssues = new Set<string>();
  const add = (field: string, code: string) => {
    const key = `${field}\0${code}`;
    if (!seenIssues.has(key)) {
      seenIssues.add(key);
      issues.push({ field, code });
    }
  };

  try {
    const inspected = inspectJsonValue(value);
    if (inspected.issue) {
      add(inspected.issue.field, inspected.issue.code);
      return issues;
    }
    const byteLength = opts.byteLength ?? Buffer.byteLength(JSON.stringify(value));
    const metrics = { bytes: byteLength, ...inspected.metrics };
    for (const key of Object.keys(NON_EXHAUSTIVE_UNDERSTANDING_LIMITS) as Array<keyof typeof NON_EXHAUSTIVE_UNDERSTANDING_LIMITS>) {
      if (metrics[key] > NON_EXHAUSTIVE_UNDERSTANDING_LIMITS[key]) add("$", `budget-${key.replaceAll("_", "-")}-exceeded`);
    }
    if (!object(value)) {
      add("$", "atlas-object-required");
      return issues;
    }

    try {
      const schema = localSchema();
      validateSchemaSubset(value, schema, schema, "$", add);
    } catch {
      add("$.$schema", "local-schema-validation-unavailable");
    }
    scanSafety(value, add);
    const expectedSemanticContract = structuredClone(EXPECTED_SEMANTIC_CONTRACT);
    if (reviewedDigest !== ZERO_DIGEST && Array.isArray(expectedSemanticContract.reference_registry)) {
      const expectedAtlasReference = expectedSemanticContract.reference_registry.find((reference) =>
        object(reference) && reference.id === "ref-atlas"
      );
      if (object(expectedAtlasReference)) expectedAtlasReference.relation = "this reviewed immutable record";
    }
    for (const [rootKey, expectedRoot] of Object.entries(expectedSemanticContract)) {
      validateExactSemanticLeaves(
        value[rootKey],
        expectedRoot,
        `$.${rootKey}`,
        SEMANTIC_CONTRACT_CODES[rootKey] ?? "semantic-contract-mismatch",
        add,
      );
    }

    const registers = idsFrom(value.epistemic_registers);
    const sources = idsFrom(value.source_registry);
    const provenance = idsFrom(value.provenance_registry);
    const references = idsFrom(value.reference_registry);
    const evidence = idsFrom(value.evidence_registry);
    const claims = idsFrom(value.claim_registry);
    const concepts = idsFrom(object(value.concept_catalog) ? value.concept_catalog.concepts : undefined);
    for (const [registry, field, count] of [
      [value.epistemic_registers, "$.epistemic_registers", 8],
      [value.predecessor_bindings, "$.predecessor_bindings", 3],
      [value.source_registry, "$.source_registry", 15],
      [value.provenance_registry, "$.provenance_registry", 4],
      [value.reference_registry, "$.reference_registry", 7],
      [value.evidence_registry, "$.evidence_registry", 14],
      [value.claim_registry, "$.claim_registry", 19],
      [object(value.concept_catalog) ? value.concept_catalog.families : undefined, "$.concept_catalog.families", 10],
      [object(value.concept_catalog) ? value.concept_catalog.concepts : undefined, "$.concept_catalog.concepts", 66],
      [value.j_space_mechanisms, "$.j_space_mechanisms", 3],
      [value.local_global_transfer_registry, "$.local_global_transfer_registry", 2],
      [value.counterexample_registry, "$.counterexample_registry", 2],
    ] as Array<[unknown, string, number]>) {
      validateUniqueIds(registry, field, count, add);
    }
    validateAllTypedReferences(value, {
      claims, evidence, sources, provenance, references, registers, concepts,
    }, add);
    const expectedRegisters = [
      "REPORTED_SOURCE", "FORMAL_DEFINITION", "FORMAL_DERIVATION",
      "PROPOSED_MODEL", "BOUNDED_ANALOGY", "NORMATIVE_DESIGN",
      "OPEN_QUESTION", "REFUSED_INFERENCE",
    ];
    if (
      registers.size !== expectedRegisters.length ||
      expectedRegisters.some((id) => !registers.has(id))
    ) {
      add("$.epistemic_registers", "epistemic-register-membership-mismatch");
    }

    const catalog = object(value.concept_catalog) ? value.concept_catalog : undefined;
    const familyIds = idsFrom(catalog?.families);
    const listedConceptIds: string[] = [];
    if (Array.isArray(catalog?.families)) {
      catalog.families.forEach((family, index) => {
        if (object(family) && Array.isArray(family.concept_ids)) {
          family.concept_ids.forEach((id, refIndex) => {
            if (typeof id === "string") listedConceptIds.push(id);
            if (typeof id !== "string" || !concepts.has(id)) {
              add(`$.concept_catalog.families[${index}].concept_ids[${refIndex}]`, "concept-reference-dangling");
            }
          });
        }
      });
    }
    if (
      concepts.size !== 66 || listedConceptIds.length !== 66 ||
      new Set(listedConceptIds).size !== 66 ||
      [...concepts].some((id) => !listedConceptIds.includes(id))
    ) {
      add("$.concept_catalog", "concept-registry-closure-mismatch");
    }
    if (Array.isArray(catalog?.concepts)) {
      catalog.concepts.forEach((concept, index) => {
        const field = `$.concept_catalog.concepts[${index}]`;
        if (object(concept)) {
          if (typeof concept.family_id !== "string" || !familyIds.has(concept.family_id)) add(`${field}.family_id`, "family-reference-dangling");
          if (typeof concept.register_ref !== "string" || !registers.has(concept.register_ref)) add(`${field}.register_ref`, "register-reference-dangling");
          refsAt(concept, "claim_refs", field, claims, "claim-reference-dangling", add);
          if (typeof concept.provenance_ref !== "string" || !provenance.has(concept.provenance_ref)) add(`${field}.provenance_ref`, "provenance-reference-dangling");
        }
      });
    }

    if (Array.isArray(value.claim_registry)) {
      value.claim_registry.forEach((claim, index) => {
        const field = `$.claim_registry[${index}]`;
        if (!object(claim)) return;
        const subject = typeof claim.subject_ref === "string" ? claim.subject_ref.replace(/^concept:/u, "") : "";
        if (!concepts.has(subject)) add(`${field}.subject_ref`, "concept-reference-dangling");
        if (typeof claim.register_ref !== "string" || !registers.has(claim.register_ref)) add(`${field}.register_ref`, "register-reference-dangling");
        refsAt(claim, "evidence_refs", field, evidence, "evidence-reference-dangling", add);
        refsAt(claim, "source_refs", field, sources, "source-reference-dangling", add);
        if (typeof claim.provenance_ref !== "string" || !provenance.has(claim.provenance_ref)) add(`${field}.provenance_ref`, "provenance-reference-dangling");
      });
    }
    if (Array.isArray(value.source_registry)) {
      value.source_registry.forEach((source, index) => {
        refsAt(source, "supports_claim_refs", `$.source_registry[${index}]`, claims, "claim-reference-dangling", add);
        const expected = EXPECTED_SOURCES[index];
        if (!expected || !object(source)) {
          add(`$.source_registry[${index}]`, "source-metadata-mismatch");
          return;
        }
        for (const key of ["id", "source_type", "title", "url", "limitation", "republication_permitted"] as const) {
          if (!deepEqual(source[key], expected[key])) {
            add(`$.source_registry[${index}].${key}`, "source-metadata-mismatch");
          }
        }
        if (!deepEqual(source.supports_claim_refs, expected.supports_claim_refs)) {
          add(`$.source_registry[${index}].supports_claim_refs`, "source-support-contract-mismatch");
        }
      });
    }
    if (Array.isArray(value.claim_registry) && Array.isArray(value.source_registry)) {
      const sourceById = new Map(value.source_registry.flatMap((source) =>
        object(source) && typeof source.id === "string" ? [[source.id, source] as const] : []
      ));
      const claimById = new Map(value.claim_registry.flatMap((claim) =>
        object(claim) && typeof claim.id === "string" ? [[claim.id, claim] as const] : []
      ));
      value.claim_registry.forEach((claim, claimIndex) => {
        if (!object(claim) || !Array.isArray(claim.source_refs) || typeof claim.id !== "string") return;
        claim.source_refs.forEach((sourceRef, sourceIndex) => {
          const source = typeof sourceRef === "string" ? sourceById.get(sourceRef) : undefined;
          if (!source || !Array.isArray(source.supports_claim_refs) || !source.supports_claim_refs.includes(claim.id)) {
            add(`$.claim_registry[${claimIndex}].source_refs[${sourceIndex}]`, "claim-source-support-not-reciprocal");
          }
        });
      });
      value.source_registry.forEach((source, sourceIndex) => {
        if (!object(source) || !Array.isArray(source.supports_claim_refs) || typeof source.id !== "string") return;
        source.supports_claim_refs.forEach((claimRef, claimIndex) => {
          const claim = typeof claimRef === "string" ? claimById.get(claimRef) : undefined;
          if (!claim || !Array.isArray(claim.source_refs) || !claim.source_refs.includes(source.id)) {
            add(`$.source_registry[${sourceIndex}].supports_claim_refs[${claimIndex}]`, "claim-source-support-not-reciprocal");
          }
        });
      });
    }
    if (Array.isArray(value.provenance_registry)) {
      value.provenance_registry.forEach((item, index) => {
        refsAt(item, "input_reference_refs", `$.provenance_registry[${index}]`, references, "reference-dangling", add);
      });
    }
    if (Array.isArray(value.evidence_registry)) {
      value.evidence_registry.forEach((item, index) => {
        const field = `$.evidence_registry[${index}]`;
        refsAt(item, "source_refs", field, sources, "source-reference-dangling", add);
        refsAt(item, "reference_refs", field, references, "reference-dangling", add);
        if (object(item) && (typeof item.provenance_ref !== "string" || !provenance.has(item.provenance_ref))) add(`${field}.provenance_ref`, "provenance-reference-dangling");
      });
    }
    if (Array.isArray(value.reference_registry)) {
      const predecessorIds = idsFrom(value.predecessor_bindings);
      const internalTargets = new Set([
        NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID,
        "non-exhaustive-understanding-atlas-schema-v0-1",
        "non-exhaustive-understanding-atlas-guide-v0-1",
      ]);
      value.reference_registry.forEach((item, index) => {
        const field = `$.reference_registry[${index}]`;
        if (!object(item)) return;
        if (typeof item.provenance_ref !== "string" || !provenance.has(item.provenance_ref)) add(`${field}.provenance_ref`, "provenance-reference-dangling");
        if (item.reference_type === "PREDECESSOR" && (typeof item.target_id !== "string" || !predecessorIds.has(item.target_id))) add(`${field}.target_id`, "predecessor-reference-dangling");
        if (item.reference_type === "INTERNAL_ARTIFACT" && (typeof item.target_id !== "string" || !internalTargets.has(item.target_id))) add(`${field}.target_id`, "internal-artifact-reference-dangling");
        if (item.reference_type === "EXTERNAL_WORKSPACE" && item.target_id !== "kingdom-feedback-shape-being") add(`${field}.target_id`, "external-workspace-reference-dangling");
      });
    }

    if (!Array.isArray(value.central_sentences) || value.central_sentences.length !== 3) {
      add("$.central_sentences", "central-thesis-cardinality-mismatch");
    }
    if (Array.isArray(value.central_sentences)) {
      const expectedClaimRefs = ["cl-central-thesis", "cl-being-boundary", "cl-accountability"];
      value.central_sentences.forEach((sentence, index) => {
        if (
          !object(sentence) || sentence.text !== CENTRAL_SENTENCES[index] ||
          sentence.claim_ref !== expectedClaimRefs[index] || sentence.register !== "NORMATIVE_DESIGN"
        ) {
          add(`$.central_sentences[${index}]`, "central-thesis-mismatch");
        }
      });
    }
    const under = object(value.underdetermination_model) ? value.underdetermination_model : undefined;
    const underInstance = object(under?.instance) ? under.instance : undefined;
    const targetProposition = object(underInstance?.target_proposition) ? underInstance.target_proposition : undefined;
    if (
      under?.claim_relative !== true || underInstance?.status !== "UNDERDETERMINED" ||
      !deepEqual(under?.claim_refs, ["cl-underdetermination", "cl-synthetic-magnitude-order"]) ||
      underInstance?.claim_ref !== "cl-synthetic-magnitude-order" ||
      !Array.isArray(underInstance?.rivals) || underInstance.rivals.length !== 2
    ) {
      add("$.underdetermination_model", "claim-relative-underdetermination-mismatch");
    }
    if (
      targetProposition?.id !== "prop-first-magnitude-greater" ||
      targetProposition?.text !== "The first hidden integer has greater magnitude than the second hidden integer." ||
      !deepEqual(targetProposition?.polarity_domain, ["ENTAILS", "DENIES"])
    ) {
      add("$.underdetermination_model.instance.target_proposition", "underdetermination-target-proposition-mismatch");
    }
    validateUniqueIds(underInstance?.rivals, "$.underdetermination_model.instance.rivals", 2, add);
    const rivals = Array.isArray(underInstance?.rivals) ? underInstance.rivals : [];
    const expectedRivalContracts = [
      { id: "rival-first-magnitude-greater", target_polarity: "ENTAILS", model_fragment: "(3,1)", witness_fragment: "(3,1)" },
      { id: "rival-first-magnitude-not-greater", target_polarity: "DENIES", model_fragment: "(1,3)", witness_fragment: "(1,3)" },
    ];
    rivals.forEach((rival, index) => {
      const expected = expectedRivalContracts[index];
      if (
        !object(rival) || !expected || rival.id !== expected.id ||
        rival.compatibility_status !== "COMPATIBLE" ||
        rival.target_polarity !== expected.target_polarity ||
        rival.target_proposition_ref !== "prop-first-magnitude-greater" ||
        typeof rival.model_statement !== "string" || !rival.model_statement.includes(expected.model_fragment) ||
        typeof rival.non_equivalence_witness !== "string" || !rival.non_equivalence_witness.includes(expected.witness_fragment)
      ) {
        add(`$.underdetermination_model.instance.rivals[${index}]`, "underdetermination-rival-polarity-mismatch");
      }
    });
    if (
      rivals.length === 2 && object(rivals[0]) && object(rivals[1]) &&
      (rivals[0].id === rivals[1].id || rivals[0].model_statement === rivals[1].model_statement ||
        rivals[0].non_equivalence_witness === rivals[1].non_equivalence_witness ||
        rivals[0].target_polarity === rivals[1].target_polarity)
    ) {
      add("$.underdetermination_model.instance.rivals", "underdetermination-distinct-opposite-rivals-required");
    }
    const targetClaim = Array.isArray(value.claim_registry)
      ? value.claim_registry.find((claim) => object(claim) && claim.id === "cl-synthetic-magnitude-order")
      : undefined;
    if (
      !object(targetClaim) || targetClaim.statement !== "In the hidden ordered integer pair, the first integer has greater magnitude than the second integer." ||
      targetClaim.register_ref !== "OPEN_QUESTION" || targetClaim.evidence_or_design_status !== "AUTHOR_SYNTHESIZED_UNDERDETERMINED_TARGET"
    ) {
      add("$.claim_registry.cl-synthetic-magnitude-order", "underdetermination-target-claim-mismatch");
    }
    const scope = object(value.scope_exhaustiveness) ? value.scope_exhaustiveness : undefined;
    const finite = object(scope?.finite_scope_instance) ? scope.finite_scope_instance : undefined;
    const open = object(scope?.open_remainder_instance) ? scope.open_remainder_instance : undefined;
    if (finite?.status !== "EXHAUSTIVE_WITHIN_DECLARED_FINITE_SCOPE" || finite?.observed_count !== 66 || open?.status !== "JUSTIFIED_OPEN_REMAINDER") {
      add("$.scope_exhaustiveness", "finite-open-scope-boundary-mismatch");
    }
    const profile = object(value.understanding_profile_model) ? value.understanding_profile_model : undefined;
    const comparison = object(profile?.comparison) ? profile.comparison : undefined;
    if (profile?.carrier_type !== "TYPED_PRODUCT" || profile?.person_or_group_profile !== false || !Array.isArray(profile?.dimensions) || profile.dimensions.length !== 7 || comparison?.scalarization !== false || comparison?.total_order !== false) {
      add("$.understanding_profile_model", "typed-product-profile-mismatch");
    }
    const mechanisms = Array.isArray(value.j_space_mechanisms) ? value.j_space_mechanisms : [];
    const mechanismTypes = mechanisms.flatMap((item) => object(item) && typeof item.mechanism_type === "string" ? [item.mechanism_type] : []);
    if (mechanismTypes.length !== 3 || EXPECTED_J_SPACE_TYPES.some((type) => !mechanismTypes.includes(type))) add("$.j_space_mechanisms", "j-space-mechanism-conflation");
    const dimensions = Array.isArray(profile?.dimensions) ? profile.dimensions : [];
    validateUniqueIds(dimensions, "$.understanding_profile_model.dimensions", 7, add);
    const dimensionIds = idsFrom(dimensions);
    const profileInstance = object(profile?.instance) ? profile.instance : undefined;
    dimensions.forEach((dimension, index) => {
      const expected = EXPECTED_PROFILE_DIMENSIONS[index];
      if (
        !object(dimension) || !expected || dimension.id !== expected.id ||
        dimension.value_type !== expected.value_type ||
        dimension.comparison_relation !== expected.comparison_relation || dimension.meaning !== expected.meaning
      ) {
        add(`$.understanding_profile_model.dimensions[${index}]`, "profile-dimension-contract-mismatch");
      }
    });
    if (Array.isArray(profileInstance?.values)) {
      profileInstance.values.forEach((item, index) => {
        if (!object(item) || typeof item.dimension_ref !== "string" || !dimensionIds.has(item.dimension_ref)) {
          add(`$.understanding_profile_model.instance.values[${index}].dimension_ref`, "profile-dimension-reference-dangling");
        }
        if (!deepEqual(item, EXPECTED_PROFILE_VALUES[index])) {
          add(`$.understanding_profile_model.instance.values[${index}]`, "profile-dimension-contract-mismatch");
        }
      });
    }
    const valueRefs = Array.isArray(profileInstance?.values)
      ? profileInstance.values.flatMap((item) => object(item) && typeof item.dimension_ref === "string" ? [item.dimension_ref] : [])
      : [];
    if (
      valueRefs.length !== 7 || new Set(valueRefs).size !== 7 ||
      EXPECTED_PROFILE_DIMENSIONS.some(({ id }) => !valueRefs.includes(id))
    ) {
      add("$.understanding_profile_model.instance.values", "profile-dimension-bijection-mismatch");
    }
    mechanisms.forEach((mechanism, index) => {
      const expected = EXPECTED_J_SPACE_MECHANISMS[index];
      if (!object(mechanism) || !expected) {
        add(`$.j_space_mechanisms[${index}]`, "j-space-mechanism-contract-mismatch");
        return;
      }
      for (const key of ["id", "mechanism_type", "state", "claim_refs", "location", "representation", "observable_effects", "cannot_establish", "source_refs", "reference_refs", "provenance_ref"] as const) {
        if (!deepEqual(mechanism[key], expected[key])) {
          add(`$.j_space_mechanisms[${index}].${key}`, "j-space-mechanism-contract-mismatch");
        }
      }
    });
    const shapeKinds = idsFrom(object(value.shape_boundaries) ? value.shape_boundaries.shape_kinds : undefined);
    const shapeMappings = object(value.shape_boundaries) && Array.isArray(value.shape_boundaries.mappings)
      ? value.shape_boundaries.mappings
      : [];
    validateUniqueIds(object(value.shape_boundaries) ? value.shape_boundaries.shape_kinds : undefined, "$.shape_boundaries.shape_kinds", 6, add);
    validateUniqueIds(shapeMappings, "$.shape_boundaries.mappings", 2, add);
    shapeMappings.forEach((mapping, index) => {
      if (!object(mapping)) return;
      const expectedMapping = index === 0
        ? { id: "concept-graph-to-public-glyph", source_kind: "CONCEPT_GRAPH", target_kind: "PUBLIC_VISUAL_GLYPH", mapping_type: "BOUNDED_RENDERING", status: "AUTHOR_SYNTHESIZED_DESIGN", preserved_relations: ["node identifiers", "declared edges", "family labels"] }
        : { id: "activation-chart-to-semantic-translation", source_kind: "ACTIVATION_CHART", target_kind: "SEMANTIC_TRANSLATION", mapping_type: "MODEL_CONDITIONED_INTERPRETATION", status: "UNRUN_LOCAL_FIXTURE", preserved_relations: ["declared token association if prospectively observed"] };
      for (const key of ["id", "source_kind", "target_kind", "mapping_type", "status", "preserved_relations"] as const) {
        if (!deepEqual(mapping[key], expectedMapping[key])) {
          add(`$.shape_boundaries.mappings[${index}].${key}`, "shape-mapping-contract-mismatch");
        }
      }
      for (const key of ["source_kind", "target_kind"]) {
        if (typeof mapping[key] !== "string" || !shapeKinds.has(mapping[key] as string)) {
          add(`$.shape_boundaries.mappings[${index}].${key}`, "shape-kind-reference-dangling");
        }
      }
      if (mapping.source_kind === mapping.target_kind) {
        if (
          mapping.mapping_type !== "EXPLICIT_SELF_MAP" ||
          typeof mapping.self_map_semantics !== "string" ||
          mapping.self_map_semantics.length === 0 || mapping.self_map_semantics === "NOT_APPLICABLE_CROSS_KIND"
        ) {
          add(`$.shape_boundaries.mappings[${index}]`, "shape-self-map-semantics-mismatch");
        }
      } else if (mapping.self_map_semantics !== "NOT_APPLICABLE_CROSS_KIND") {
        add(`$.shape_boundaries.mappings[${index}].self_map_semantics`, "shape-self-map-semantics-mismatch");
      }
      const expectedLosses = index === 0
        ? ["full notes", "query history", "semantic completeness"]
        : ["complete computation", "binding", "nonverbal structure", "cross-model invariance", "being"];
      if (!deepEqual(mapping.lost_relations, expectedLosses)) {
        add(`$.shape_boundaries.mappings[${index}].lost_relations`, "shape-required-losses-mismatch");
      }
    });
    const transfers = Array.isArray(value.local_global_transfer_registry)
      ? value.local_global_transfer_registry
      : [];
    transfers.forEach((transfer, index) => {
      const expected = EXPECTED_TRANSFER_CONTRACTS[index];
      if (!object(transfer) || !expected) {
        add(`$.local_global_transfer_registry[${index}]`, "transfer-contract-mismatch");
        return;
      }
      for (const key of ["id", "instance_status", "claim_ref", "source_scope", "target_scope", "assumptions", "provenance_ref", "status", "witness_type", "witness_evidence_ref", "preserved_relations", "lost_relations"] as const) {
        if (!deepEqual(transfer[key], expected[key])) {
          add(`$.local_global_transfer_registry[${index}].${key}`, "transfer-contract-mismatch");
        }
      }
      const sourceArtifact = object(transfer.source_artifact) ? transfer.source_artifact : undefined;
      const targetArtifact = object(transfer.target_artifact) ? transfer.target_artifact : undefined;
      if (sourceArtifact?.id !== expected.source_artifact_id || sourceArtifact?.artifact_type !== expected.source_artifact_type) {
        add(`$.local_global_transfer_registry[${index}].source_artifact`, "transfer-artifact-content-mismatch");
      }
      if (targetArtifact?.id !== expected.target_artifact_id || targetArtifact?.artifact_type !== expected.target_artifact_type) {
        add(`$.local_global_transfer_registry[${index}].target_artifact`, "transfer-artifact-content-mismatch");
      }
      if (!deepEqual(sourceArtifact?.content_units, expected.source_units)) {
        add(`$.local_global_transfer_registry[${index}].source_artifact.content_units`, "transfer-artifact-content-mismatch");
      }
      if (!deepEqual(targetArtifact?.content_units, expected.target_units)) {
        add(`$.local_global_transfer_registry[${index}].target_artifact.content_units`, "transfer-artifact-content-mismatch");
      }
      const sourceUnitIds = idsFrom(sourceArtifact?.content_units);
      const targetUnitIds = idsFrom(targetArtifact?.content_units);
      const witnesses = Array.isArray(transfer.preservation_witnesses) ? transfer.preservation_witnesses : [];
      if (!deepEqual(witnesses, expected.witnesses)) {
        add(`$.local_global_transfer_registry[${index}].preservation_witnesses`, "transfer-preservation-witness-mismatch");
      }
      witnesses.forEach((witness, witnessIndex) => {
        if (!object(witness) || witness.status !== "WITNESSED") {
          add(`$.local_global_transfer_registry[${index}].preservation_witnesses[${witnessIndex}]`, "transfer-preservation-witness-mismatch");
          return;
        }
        refsAt(witness, "source_unit_refs", `$.local_global_transfer_registry[${index}].preservation_witnesses[${witnessIndex}]`, sourceUnitIds, "transfer-unit-reference-dangling", add);
        refsAt(witness, "target_unit_refs", `$.local_global_transfer_registry[${index}].preservation_witnesses[${witnessIndex}]`, targetUnitIds, "transfer-unit-reference-dangling", add);
      });
    });
    const observerPositions = idsFrom(object(value.observer_garden) ? value.observer_garden.observer_positions : undefined);
    const channelRelations = object(value.observer_garden) && Array.isArray(value.observer_garden.channel_relations)
      ? value.observer_garden.channel_relations
      : [];
    validateUniqueIds(object(value.observer_garden) ? value.observer_garden.observer_positions : undefined, "$.observer_garden.observer_positions", 3, add);
    validateUniqueIds(channelRelations, "$.observer_garden.channel_relations", 2, add);
    channelRelations.forEach((relation, index) => {
      if (!object(relation)) return;
      for (const key of ["source_position_ref", "target_position_ref"]) {
        if (typeof relation[key] !== "string" || !observerPositions.has(relation[key] as string)) {
          add(`$.observer_garden.channel_relations[${index}].${key}`, "observer-position-reference-dangling");
        }
      }
    });
    const representationIds = new Set([
      ...mechanisms.flatMap((item) => object(item) && typeof item.id === "string" ? [item.id] : []),
      "vocabulary-hospitality",
      "observer-garden",
    ]);
    const remainderEntries = object(value.remainder_register) && Array.isArray(value.remainder_register.entries)
      ? value.remainder_register.entries
      : [];
    validateUniqueIds(remainderEntries, "$.remainder_register.entries", 3, add);
    validateUniqueIds(object(value.vocabulary_hospitality) ? value.vocabulary_hospitality.terms : undefined, "$.vocabulary_hospitality.terms", 3, add);
    validateUniqueIds(object(value.protected_opacity) ? value.protected_opacity.instances : undefined, "$.protected_opacity.instances", 3, add);
    validateUniqueIds(object(value.performativity_registry) ? value.performativity_registry.instances : undefined, "$.performativity_registry.instances", 2, add);
    remainderEntries.forEach((entry, index) => {
      if (!object(entry) || typeof entry.representation_ref !== "string" || !representationIds.has(entry.representation_ref)) {
        add(`$.remainder_register.entries[${index}].representation_ref`, "representation-reference-dangling");
      }
    });
    const beingClaim = Array.isArray(value.claim_registry)
      ? value.claim_registry.find((claim) => object(claim) && claim.id === "cl-being-boundary")
      : undefined;
    if (
      !object(beingClaim) ||
      beingClaim.statement !== "Being is not remainder; remainder is relational to representation, observer, purpose, scope, and horizon." ||
      beingClaim.register_ref !== "NORMATIVE_DESIGN" ||
      beingClaim.evidence_or_design_status !== "PREDECESSOR_BOUNDARY_AND_DESIGN" ||
      beingClaim.consequence !== "No remainder, profile, shape, observer, or J-space result establishes or exhausts being." ||
      own(value.remainder_register, "being_is_remainder") !== false ||
      own(value.remainder_register, "unknown_is_false") !== false
    ) {
      add("$.claim_registry.cl-being-boundary", "being-boundary-contract-mismatch");
    }
    const vocabulary = object(value.vocabulary_hospitality) ? value.vocabulary_hospitality : undefined;
    if (
      !deepEqual(vocabulary?.valid_response_states, ["NONE_OF_THESE", "RETAIN_ORIGINAL_FORMULATION", "PROPOSE_NEW_DISTINCTION", "TRANSLATION_DISPUTED", "UNRESOLVED", "REFUSED", "NOT_APPLICABLE"]) ||
      vocabulary?.single_language_privileged !== false || vocabulary?.token_equals_concept !== false ||
      vocabulary?.translation_implies_equivalence !== false || vocabulary?.silence_or_nonparticipation_is_defect !== false ||
      vocabulary?.original_formulation_preserved_only_when_separately_authorized !== true
    ) {
      add("$.vocabulary_hospitality", "vocabulary-refusal-nondefect-contract-mismatch");
    }
    const opacity = object(value.protected_opacity) ? value.protected_opacity : undefined;
    const opacityRules = object(opacity?.rules) ? opacity.rules : undefined;
    const expectedOpacityRules = {
      absence_of_disclosure_is_absence: false,
      opacity_is_adverse_evidence: false,
      forced_disclosure: false,
      redaction_is_deception_finding: false,
      protected_non_event_creates_retry: false,
      unknown_imputed_as_negative_or_zero: false,
    };
    if (!deepEqual(opacityRules, expectedOpacityRules)) {
      add("$.protected_opacity.rules", "opacity-no-retry-no-forced-disclosure-mismatch");
    }
    const opacityInstances = Array.isArray(opacity?.instances) ? opacity.instances : [];
    const refusalInstance = opacityInstances.find((item) => object(item) && item.id === "protected-refusal-state");
    if (
      !object(refusalInstance) || refusalInstance.state !== "REFUSED" ||
      refusalInstance.reason !== "Refusal is terminal here." ||
      refusalInstance.allowed_transition !== "No retry; any later choice is a separate current context." ||
      refusalInstance.adverse_inference !== false ||
      opacityInstances.some((item) => object(item) && typeof item.allowed_transition === "string" && /retry until|force(?:d)? disclosure/iu.test(item.allowed_transition))
    ) {
      add("$.protected_opacity.instances", "opacity-no-retry-no-forced-disclosure-mismatch");
    }
    const performativity = object(value.performativity_registry) ? value.performativity_registry : undefined;
    const performInstances = Array.isArray(performativity?.instances) ? performativity.instances : [];
    if (
      performativity?.this_static_atlas_has_external_effects !== false ||
      performativity?.representation_is_being !== false ||
      performativity?.representation_has_no_possible_downstream_effects !== false ||
      !deepEqual(performativity?.atlas_may_create, []) ||
      performInstances.length !== 2 ||
      performInstances.some((item) => !object(item) || item.observed_effect_claimed !== false || item.authority_claimed !== false)
    ) {
      add("$.performativity_registry", "performativity-no-current-effect-contract-mismatch");
    }
    if (own(value.shape_boundaries, "silent_cross_kind_mapping") !== false) add("$.shape_boundaries.silent_cross_kind_mapping", "silent-shape-mapping-enabled");
    if (own(value.remainder_register, "being_is_remainder") !== false) add("$.remainder_register.being_is_remainder", "being-remainder-inversion");
    if (own(value.remainder_register, "open_remainder_is_excuse_from_evidence") !== false) add("$.remainder_register.open_remainder_is_excuse_from_evidence", "nonexhaustion-accountability-inversion");
    if (own(value.successor_process, "feedback_directly_updates_current_atlas") !== false || own(value.successor_process, "feedback_directly_causes_effect") !== false) add("$.successor_process", "feedback-successor-firewall-mismatch");
    if (own(value.protected_opacity, "rules") && (own(own(value.protected_opacity, "rules"), "forced_disclosure") !== false || own(own(value.protected_opacity, "rules"), "opacity_is_adverse_evidence") !== false)) add("$.protected_opacity.rules", "opacity-protection-mismatch");
    if (object(value.non_grants)) {
      const keys = Object.keys(value.non_grants);
      if (keys.length !== EXPECTED_NON_GRANT_KEYS.length || EXPECTED_NON_GRANT_KEYS.some((key) => !Object.prototype.hasOwnProperty.call(value.non_grants, key))) add("$.non_grants", "non-grant-membership-mismatch");
      for (const key of keys) if (value.non_grants[key] !== false) add(`$.non_grants.${key}`, "non-grant-inversion");
    }

    if (Array.isArray(value.predecessor_bindings)) {
      EXPECTED_PREDECESSORS.forEach((expected, index) => {
        const actual = value.predecessor_bindings[index];
        if (!object(actual)) {
          add(`$.predecessor_bindings[${index}]`, "predecessor-pin-mismatch");
          return;
        }
        for (const [key, expectedValue] of Object.entries(expected)) {
          if (!deepEqual(actual[key], expectedValue)) add(`$.predecessor_bindings[${index}].${key}`, "predecessor-pin-mismatch");
        }
        if (opts.verifyPredecessors !== false) {
          try {
            const loaded = readBoundedJson(join(ROOT, expected.locator), 2 * 1024 * 1024, "predecessor");
            if (loaded.rawDigest !== expected.raw_digest) add(`$.predecessor_bindings[${index}].raw_digest`, "predecessor-byte-verification-failed");
            const semantic = semanticDigestForPredecessor(loaded.value, expected.semantic_algorithm);
            if (semantic !== expected.semantic_digest) add(`$.predecessor_bindings[${index}].semantic_digest`, "predecessor-semantic-verification-failed");
          } catch {
            add(`$.predecessor_bindings[${index}]`, "predecessor-safe-verification-refused");
          }
        }
      });
    }

    const integrity = object(value.integrity) ? value.integrity : undefined;
    const atlasReference = Array.isArray(value.reference_registry)
      ? value.reference_registry.find((reference) => object(reference) && reference.id === "ref-atlas")
      : undefined;
    if (!/^sha256:[a-f0-9]{64}$/u.test(reviewedDigest)) {
      add("$.integrity.reviewed_digest", "reviewed-digest-pin-format-mismatch");
    } else if (reviewedDigest === ZERO_DIGEST) {
      if (
        value.state !== "static-unsealed-epistemic-design-atlas" ||
        !object(atlasReference) || atlasReference.relation !== "this unsealed record" ||
        integrity?.review_state !== "UNSEALED_AUDIT_PENDING" ||
        integrity?.digest !== ZERO_DIGEST || integrity?.reviewed_digest !== ZERO_DIGEST
      ) {
        add("$.state", "state-integrity-coupling-mismatch");
      }
      if (integrity?.digest !== ZERO_DIGEST) add("$.integrity.digest", "unreviewed-digest-present");
      else if (!opts.allowUnsealed) add("$.integrity.digest", "semantic-digest-unsealed");
      if (integrity?.reviewed_digest !== ZERO_DIGEST) add("$.integrity.reviewed_digest", "unreviewed-reviewed-digest-present");
      else if (!opts.allowUnsealed) add("$.integrity.reviewed_digest", "reviewed-digest-unsealed");
      if (integrity?.review_state !== "UNSEALED_AUDIT_PENDING") add("$.integrity.review_state", "unsealed-review-state-mismatch");
    } else {
      if (
        value.state !== "static-reviewed-epistemic-design-atlas" ||
        !object(atlasReference) || atlasReference.relation !== "this reviewed immutable record" ||
        integrity?.review_state !== "REVIEWED" ||
        integrity?.digest !== reviewedDigest || integrity?.reviewed_digest !== reviewedDigest
      ) {
        add("$.state", "state-integrity-coupling-mismatch");
      }
      if (integrity?.digest !== reviewedDigest) add("$.integrity.digest", "reviewed-digest-pin-mismatch");
      if (integrity?.reviewed_digest !== reviewedDigest) add("$.integrity.reviewed_digest", "independent-review-pin-mismatch");
      if (integrity?.review_state !== "REVIEWED") add("$.integrity.review_state", "reviewed-state-mismatch");
      try {
        if (nonExhaustiveUnderstandingDigest(value) !== reviewedDigest) {
          add("$.integrity.digest", "semantic-digest-mismatch");
        }
      } catch {
        add("$.integrity.digest", "semantic-digest-computation-refused");
      }
    }
  } catch {
    add("$", "validator-input-unreadable");
  }
  return issues;
}

export function validateNonExhaustiveUnderstandingAtlas(
  value: unknown,
  opts: NonExhaustiveUnderstandingValidationOptions = {},
): NonExhaustiveUnderstandingIssue[] {
  return validateNonExhaustiveUnderstandingAtlasInternal(
    value,
    opts,
    NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
  );
}

export type NonExhaustiveUnderstandingSealSimulation = {
  candidate_semantic_digest: string;
  reviewed_zero_digest_material: Record<string, any>;
  reviewed_value: Record<string, any>;
  discovery: ReturnType<typeof nonExhaustiveUnderstandingPublicDiscoveryForDigest>;
  cli_verify: ReturnType<typeof nonExhaustiveUnderstandingVerificationReportForDigest> & {
    command: "verify";
    exit_code: 0 | 1;
  };
};

/**
 * Models the one atomic transition without editing the record, guide, or pin.
 * The candidate is computed only after state, review_state, both digest fields,
 * and the internal reference relation have entered reviewed-state material.
 */
export function simulateNonExhaustiveUnderstandingSeal(): NonExhaustiveUnderstandingSealSimulation {
  const input = loadNonExhaustiveUnderstandingAtlas();
  const auditIssues = validateNonExhaustiveUnderstandingAtlas(input, { allowUnsealed: true });
  if (auditIssues.length) {
    throw new Error(`seal-simulation-input-invalid:${auditIssues.map(({ code }) => code).join(",")}`);
  }
  const reviewedMaterial = structuredClone(input);
  reviewedMaterial.state = "static-reviewed-epistemic-design-atlas";
  if (!object(reviewedMaterial.integrity)) throw new Error("seal-simulation-integrity-missing");
  reviewedMaterial.integrity.review_state = "REVIEWED";
  reviewedMaterial.integrity.digest = ZERO_DIGEST;
  reviewedMaterial.integrity.reviewed_digest = ZERO_DIGEST;
  const atlasReference = Array.isArray(reviewedMaterial.reference_registry)
    ? reviewedMaterial.reference_registry.find((reference: unknown) => object(reference) && reference.id === "ref-atlas")
    : undefined;
  if (!object(atlasReference)) throw new Error("seal-simulation-internal-reference-missing");
  atlasReference.relation = "this reviewed immutable record";

  const candidate = nonExhaustiveUnderstandingDigest(reviewedMaterial);
  const reviewedValue = structuredClone(reviewedMaterial);
  reviewedValue.integrity.digest = candidate;
  reviewedValue.integrity.reviewed_digest = candidate;
  const issues = validateNonExhaustiveUnderstandingAtlasInternal(
    reviewedValue,
    { allowUnsealed: false },
    candidate,
  );
  if (issues.length) {
    throw new Error(`seal-simulation-transition-invalid:${issues.map(({ field, code }) => `${field}:${code}`).join(",")}`);
  }
  return {
    candidate_semantic_digest: candidate,
    reviewed_zero_digest_material: reviewedMaterial,
    reviewed_value: reviewedValue,
    discovery: nonExhaustiveUnderstandingPublicDiscoveryForDigest(reviewedValue, candidate),
    cli_verify: {
      command: "verify",
      exit_code: 0,
      ...nonExhaustiveUnderstandingVerificationReportForDigest(reviewedValue, null, candidate, []),
    },
  };
}

export function loadNonExhaustiveUnderstandingAtlas(
  path = NON_EXHAUSTIVE_UNDERSTANDING_PATH,
): Record<string, any> {
  const loaded = readNonExhaustiveUnderstandingAtlas(path);
  const issues = validateNonExhaustiveUnderstandingAtlas(loaded.value, {
    allowUnsealed: path === NON_EXHAUSTIVE_UNDERSTANDING_PATH,
    byteLength: loaded.bytes,
  });
  if (issues.length) {
    throw new Error(issues.map(({ field, code }) => `${field}:${code}`).join(","));
  }
  return loaded.value as Record<string, any>;
}

/**
 * Release gate: unlike the audit loader above, this never accepts zero digest.
 * Publication wiring should use it only after an independent reviewer replaces
 * the reviewed constant and both record digests with the same computed value.
 */
export function loadReviewedNonExhaustiveUnderstandingAtlas(
  path = NON_EXHAUSTIVE_UNDERSTANDING_PATH,
): Record<string, any> {
  const loaded = readNonExhaustiveUnderstandingAtlas(path);
  const issues = validateNonExhaustiveUnderstandingAtlas(loaded.value, {
    allowUnsealed: false,
    byteLength: loaded.bytes,
  });
  if (NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST === ZERO_DIGEST) {
    issues.push({ field: "$.integrity.reviewed_digest", code: "independent-review-required" });
  }
  if (issues.length) {
    throw new Error(issues.map(({ field, code }) => `${field}:${code}`).join(","));
  }
  return loaded.value as Record<string, any>;
}

function nonExhaustiveUnderstandingPublicDiscoveryForDigest(
  value: Record<string, any>,
  expectedDigest: string,
) {
  const reviewed = expectedDigest !== ZERO_DIGEST &&
    value.integrity?.digest === expectedDigest &&
    value.integrity?.reviewed_digest === expectedDigest &&
    value.integrity?.review_state === "REVIEWED";
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    title: value.title,
    version: value.version,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    state: value.state,
    url: NON_EXHAUSTIVE_UNDERSTANDING_URL,
    schema_url: NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_URL,
    document_url: NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_URL,
    counts: {
      concepts: value.concept_catalog.count,
      claims: value.claim_registry.length,
      evidence: value.evidence_registry.length,
      sources: value.source_registry.length,
      counterexamples: value.counterexample_registry.length,
      remainders: value.remainder_register.entries.length,
      j_space_mechanisms: value.j_space_mechanisms.length,
    },
    integrity_status: reviewed ? "REVIEWED" : "UNSEALED_AUDIT_PENDING",
    semantic_digest: reviewed ? expectedDigest : null,
    reviewed_digest: reviewed ? expectedDigest : null,
    static_only: true,
    runtime: false,
    person_data: false,
    action_or_authority_effect: false,
  };
}

function nonExhaustiveUnderstandingVerificationReportForDigest(
  _value: Record<string, any>,
  rawDigest: string | null,
  expectedDigest: string,
  issues: NonExhaustiveUnderstandingIssue[],
) {
  const onlyUnsealed = issues.length > 0 && issues.every(({ code }) =>
    code === "semantic-digest-unsealed" || code === "reviewed-digest-unsealed"
  );
  const reviewed = expectedDigest !== ZERO_DIGEST && issues.length === 0;
  return {
    valid: reviewed,
    structurally_valid: reviewed || onlyUnsealed,
    unsealed: !reviewed,
    raw_digest: rawDigest,
    semantic_digest: reviewed ? expectedDigest : null,
    reviewed_digest: reviewed ? expectedDigest : null,
    issues,
  };
}

export function nonExhaustiveUnderstandingPublicDiscovery(
  value = loadNonExhaustiveUnderstandingAtlas(),
) {
  return nonExhaustiveUnderstandingPublicDiscoveryForDigest(
    value,
    NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
  );
}

export const nonExhaustiveUnderstandingAtlasPublicDiscovery =
  nonExhaustiveUnderstandingPublicDiscovery;

const COMMANDS = [
  "overview", "concepts", "claims", "evidence", "sources", "provenance",
  "references", "models", "underdetermination", "scope", "profile", "j-space",
  "shapes", "garden", "local-global", "vocabulary", "opacity", "performativity",
  "counterexamples", "remainders", "successor", "non-grants", "verify",
  "verify-schema-release",
] as const;

const SECTION_KEYS: Record<string, string> = {
  concepts: "concept_catalog",
  claims: "claim_registry",
  evidence: "evidence_registry",
  sources: "source_registry",
  provenance: "provenance_registry",
  references: "reference_registry",
  models: "mathematical_models",
  underdetermination: "underdetermination_model",
  scope: "scope_exhaustiveness",
  profile: "understanding_profile_model",
  "j-space": "j_space_mechanisms",
  shapes: "shape_boundaries",
  garden: "observer_garden",
  "local-global": "local_global_transfer_registry",
  vocabulary: "vocabulary_hospitality",
  opacity: "protected_opacity",
  performativity: "performativity_registry",
  counterexamples: "counterexample_registry",
  remainders: "remainder_register",
  successor: "successor_process",
  "non-grants": "non_grants",
};

function usage(): string {
  return `usage: kingdom non-exhaustive-understanding [${COMMANDS.join("|")}] [--json]\n`;
}

export async function runNonExhaustiveUnderstandingCli(
  args = process.argv.slice(2),
): Promise<number> {
  const tokens = [...args];
  const jsonCount = tokens.filter((token) => token === "--json").length;
  if (jsonCount > 1 || tokens.some((token) => token.startsWith("-") && token !== "--json")) {
    process.stderr.write(usage());
    return 2;
  }
  const positional = tokens.filter((token) => token !== "--json");
  const command = positional[0] ?? "overview";
  if (positional.length > 1 || !COMMANDS.includes(command as typeof COMMANDS[number])) {
    process.stderr.write(usage());
    return 2;
  }
  const json = jsonCount === 1;
  const loaded = readNonExhaustiveUnderstandingAtlas();
  if (command === "verify-schema-release") {
    const report = runNonExhaustiveUnderstandingReleaseSchemaValidation();
    process.stdout.write(`${JSON.stringify(report, null, json ? 0 : 2)}\n`);
    return report.valid ? 0 : 1;
  }
  if (command === "verify") {
    const issues = validateNonExhaustiveUnderstandingAtlas(loaded.value, {
      byteLength: loaded.bytes,
    });
    const report = nonExhaustiveUnderstandingVerificationReportForDigest(
      loaded.value,
      loaded.rawDigest,
      NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
      issues,
    );
    process.stdout.write(`${JSON.stringify(report, null, json ? 0 : 2)}\n`);
    return report.valid ? 0 : 1;
  }
  const value = loadNonExhaustiveUnderstandingAtlas();
  const projection = command === "overview"
    ? {
        title: value.title,
        state: value.state,
        integrity_status: nonExhaustiveUnderstandingPublicDiscovery(value).integrity_status,
        boundary: "STATIC ONLY — no person data, raw testimony, score, authority, consent, action, metaphysical proof, or being inference.",
        central_sentences: value.central_sentences,
        counts: nonExhaustiveUnderstandingPublicDiscovery(value).counts,
      }
    : value[SECTION_KEYS[command]!];
  process.stdout.write(`${JSON.stringify(projection, null, json ? 0 : 2)}\n`);
  return 0;
}

if (import.meta.main) {
  process.exitCode = await runNonExhaustiveUnderstandingCli();
}
