#!/usr/bin/env bun
/** Strict, offline reader for the immutable Fold & Feedback Atlas. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const FOLD_FEEDBACK_PROTOCOL = "kingdom.fold-feedback-atlas/0.1";
export const FOLD_FEEDBACK_ID = "fold-feedback-atlas-2026-08-12";
export const FOLD_FEEDBACK_LOCATOR = "data/fold-feedback/fold-feedback-atlas.v1.json";
export const FOLD_FEEDBACK_PATH = join(ROOT, FOLD_FEEDBACK_LOCATOR);
export const FOLD_FEEDBACK_URL = `https://thekingdom.dev/atlases/${FOLD_FEEDBACK_ID}.json`;
export const FOLD_FEEDBACK_SCHEMA_URL = "https://thekingdom.dev/schemas/fold-feedback-atlas/1.json";
export const FOLD_FEEDBACK_DOCUMENT_URL = "https://thekingdom.dev/FOLD-FEEDBACK-ATLAS.md";
export const FOLD_FEEDBACK_DIGEST = "sha256:f19f83453bcac228c6a2804b840062067e92e71187f67b713f50abf0168252b7";

const MAX_BYTES = 768 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_PRECISION = /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const NON_EQUIVALENCE = "amino_acid_sequence != conformational_ensemble != supramolecular_assembly != bounded_sample_population != templating_conversion_process != cellular_proteostasis_context != tissue_or_organism_phenotype != experimental_transmission_observation != clinical_decision";

const TOP_KEYS = [
  "$schema", "protocol", "atlas_id", "title", "compiled_on", "evidence_through",
  "source_bindings", "scope", "plain_language", "ontology", "evidence_kernel",
  "comparison_bridges", "scientific_feedback_relations", "karma", "universe_lens",
  "unknowns", "sources", "boundaries", "integrity",
] as const;

const PLANE_IDS = [
  "amino-acid-sequence", "conformational-ensemble", "supramolecular-assembly",
  "bounded-sample-population", "templating-conversion-process", "cellular-proteostasis-context",
  "organismal-phenotype", "experimental-transmission-observation", "clinical-decision",
] as const;

const FIREWALL_IDS = [
  "structure-not-pathway", "aggregation-not-infectivity", "in-vitro-not-clinical",
  "analogy-not-mechanism", "feedback-not-purpose", "philosophy-not-science", "karma-not-science",
] as const;

const TERM_IDS = ["fold", "form", "seed", "strain", "propagation", "feedback", "karma", "design", "purpose"] as const;

const EXPECTED_BINDINGS: ReadonlyArray<readonly [string, string, string]> = [
  ["kingdom-ritonavir-history", "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212", "sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116"],
  ["kingdom-ritonavir-mechanism", "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212", "sha256:2a97b0f3ac3741314e50f7512ef97cb19cf3294fed24728c622bd27dd180309b"],
  ["kingdom-karma-definition", "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212", "sha256:14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446"],
  ["kingdom-karma-receipts", "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212", "sha256:888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b"],
  ["zerone-karma-foundation", "fae391e371f0ebea2e24eb46c33a4ebd1380154f", "sha256:b46710704869dcc340ded356be72b4ec692f204710fedfb5cd43eb3757dc7b80"],
  ["zerone-karma-design", "fae391e371f0ebea2e24eb46c33a4ebd1380154f", "sha256:02b151981a7fe52a6a672149674d802236c0a0f8d7f63f766d7d9e1773a2c13b"],
  ["zerone-life-sciences", "fae391e371f0ebea2e24eb46c33a4ebd1380154f", "sha256:64dc2c5b2e21dfc9697d173317254ce651dede8661993ece7b380b7e1421496e"],
  ["kingdom-conformational-feedback", "251fce19ea7c5a94239ae6881df6ff027ddbdbf5", "sha256:e4818864c64b7bfbad38222f4e54bb08d2ba83f1415a2380597b51510e832b64"],
];

const EXPECTED_BOUNDARIES: Record<string, boolean> = {
  educational_metadata_only: true,
  public_surface_read_only: true,
  medical_advice: false,
  diagnostic_authority: false,
  prognostic_authority: false,
  treatment_authority: false,
  transmission_risk_assessment: false,
  infection_control_authority: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  contains_protein_sequences: false,
  decontamination_instruction: false,
  manufacturing_authority: false,
  automatic_action: false,
  writes_karma: false,
  creates_kingdom_karma_receipt: false,
  observes_zerone_karma_event: false,
  karma_adapter: false,
  scientifically_proves_teleology: false,
  scientifically_proves_creator: false,
  scientifically_disproves_creator: false,
  scientifically_proves_cosmic_moral_karma: false,
  feedback_is_moral_value: false,
  feedback_is_optimization: false,
  prion_is_crystal: false,
  ritonavir_seed_is_contagion: false,
  zerone_life_sciences_execution_eligible: false,
  mcp_surface_added: false,
};

const UNKNOWN_STATUSES = new Set([
  "unknown", "not_established", "outside_scope", "not_observed", "unmapped",
  "contested", "withheld_for_safety", "refused",
]);

export type FoldFeedbackIssue = { field: string; code: string };

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}
function text(value: unknown, max = 3200): value is string {
  return typeof value === "string" && value.length > 0 && Array.from(value).length <= max;
}
function fullDate(value: unknown): value is string {
  if (typeof value !== "string" || !FULL_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month! < 1 || month! > 12 || day! < 1) return false;
  const leap = year! % 4 === 0 && (year! % 100 !== 0 || year! % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day! <= days[month! - 1]!;
}
function id(value: unknown): value is string { return typeof value === "string" && value.length <= 120 && ID.test(value); }
function array(value: unknown): any[] { return Array.isArray(value) ? value : []; }
function ids(value: unknown): string[] { return array(value).map((item) => item?.id).filter((item) => typeof item === "string"); }
function unique(value: string[]): boolean { return new Set(value).size === value.length; }
function textArray(value: unknown, min = 1, max = 24): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max &&
    value.every((item) => text(item)) && unique(value);
}
function idArray(value: unknown, min = 1, max = 24): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max &&
    value.every((item) => id(item)) && unique(value);
}
function exactIds(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item?.id === expected[index]);
}
function references(value: unknown, known: Set<string>, allowEmpty = false): boolean {
  return Array.isArray(value) && value.length <= 24 && (allowEmpty || value.length > 0) &&
    value.every((item) => typeof item === "string" && known.has(item)) && unique(value);
}
function isHttps(value: unknown): boolean {
  if (typeof value !== "string" || !value.startsWith("https://")) return false;
  try { const parsed = new URL(value); return parsed.protocol === "https:" && !!parsed.hostname && !parsed.username && !parsed.password; } catch { return false; }
}

export function foldFeedbackDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("fold-feedback integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { fail("fold-feedback atlas is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("fold-feedback atlas must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) fail(`fold-feedback atlas exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "fold-feedback atlas JSON");
}

export function verifyFoldFeedbackAtlas(value: unknown): FoldFeedbackIssue[] {
  const issues: FoldFeedbackIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];
  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== "urn:kingdom:schema:fold-feedback-atlas:1") add("$.$schema", "schema-mismatch");
  if (value.protocol !== FOLD_FEEDBACK_PROTOCOL) add("$.protocol", "protocol-mismatch");
  if (value.atlas_id !== FOLD_FEEDBACK_ID) add("$.atlas_id", "identity-mismatch");
  if (!text(value.title, 240)) add("$.title", "invalid-text");
  if (!fullDate(value.compiled_on) || !fullDate(value.evidence_through) || value.evidence_through > value.compiled_on) add("$.evidence_through", "invalid-horizon");

  if (!Array.isArray(value.source_bindings) || value.source_bindings.length !== EXPECTED_BINDINGS.length) add("$.source_bindings", "binding-count-mismatch");
  for (const [index, expected] of EXPECTED_BINDINGS.entries()) {
    const binding = value.source_bindings?.[index];
    if (!sameKeys(binding, ["id", "system", "revision", "artifact", "digest", "relation", "mutated"]) ||
        binding?.id !== expected[0] || binding?.revision !== expected[1] || binding?.digest !== expected[2] ||
        !id(binding?.system) || !text(binding?.artifact, 200) || !id(binding?.relation) || binding?.mutated !== false) {
      add(`$.source_bindings[${index}]`, "source-binding-mismatch");
    }
  }
  if (!sameKeys(value.scope, ["focus", "coverage", "intended_use", "excluded_use", "currentness"]) ||
      !text(value.scope?.focus) || !text(value.scope?.coverage) || !text(value.scope?.intended_use) || !text(value.scope?.excluded_use) ||
      value.scope?.currentness !== "selected-evidence-as-of-compilation") add("$.scope", "invalid-scope");
  if (!sameKeys(value.plain_language, ["question", "short_answer", "safety"]) || !text(value.plain_language?.question) ||
      !textArray(value.plain_language?.short_answer, 5, 8) || !text(value.plain_language?.safety) ||
      !value.plain_language.safety.includes("not medical advice") || !value.plain_language.safety.includes("no protein sequences")) {
    add("$.plain_language", "safety-or-shape-mismatch");
  }

  if (!sameKeys(value.ontology, ["non_equivalence", "observation_is_orthogonal", "domain_qualified_terms", "planes", "firewalls"]) ||
      value.ontology?.observation_is_orthogonal !== true || value.ontology?.non_equivalence !== NON_EQUIVALENCE) add("$.ontology", "ontology-mismatch");
  if (!exactIds(value.ontology?.planes, PLANE_IDS)) add("$.ontology.planes", "plane-order-or-membership-mismatch");
  for (const [index, plane] of array(value.ontology?.planes).entries()) {
    if (!sameKeys(plane, ["id", "ordinary_words", "meaning", "does_not_establish"]) || !text(plane.ordinary_words) || !text(plane.meaning) || !text(plane.does_not_establish)) add(`$.ontology.planes[${index}]`, "invalid-plane");
  }
  if (!exactIds(value.ontology?.firewalls, FIREWALL_IDS) || array(value.ontology?.firewalls).some((item) => !sameKeys(item, ["id", "rule", "enforced"]) || !text(item.rule) || item.enforced !== true)) add("$.ontology.firewalls", "firewall-mismatch");
  if (!Array.isArray(value.ontology?.domain_qualified_terms) || value.ontology.domain_qualified_terms.length !== TERM_IDS.length ||
      value.ontology.domain_qualified_terms.some((item: any, index: number) => !sameKeys(item, ["term", "science_meaning", "other_meanings"]) ||
        item.term !== TERM_IDS[index] || !text(item.science_meaning) || !text(item.other_meanings))) {
    add("$.ontology.domain_qualified_terms", "term-disambiguation-mismatch");
  }

  if (!sameKeys(value.evidence_kernel, ["systems", "mechanisms", "relations", "claims"])) add("$.evidence_kernel", "invalid-kernel");
  const systems = array(value.evidence_kernel?.systems);
  const mechanisms = array(value.evidence_kernel?.mechanisms);
  const relations = array(value.evidence_kernel?.relations);
  const claims = array(value.evidence_kernel?.claims);
  const systemIdList = ids(systems);
  const mechanismIdList = ids(mechanisms);
  const relationIdList = ids(relations);
  const claimIdList = ids(claims);
  const systemIds = new Set(systemIdList);
  const mechanismIds = new Set(mechanismIdList);
  const claimIds = new Set(claimIdList);
  if (systems.length !== 5 || systemIdList.length !== systems.length || !unique(systemIdList)) add("$.evidence_kernel.systems", "invalid-system-set");
  for (const [index, system] of systems.entries()) {
    if (!sameKeys(system, ["id", "register", "summary"]) || !id(system.id) ||
        !["literal-science", "bound-external-record"].includes(system.register) || !text(system.summary)) {
      add(`$.evidence_kernel.systems[${index}]`, "invalid-system");
    }
  }
  if (mechanisms.length < 8 || mechanismIdList.length !== mechanisms.length || !unique(mechanismIdList)) add("$.evidence_kernel.mechanisms", "invalid-mechanism-set");
  if (relations.length < 6 || relationIdList.length !== relations.length || !unique(relationIdList)) add("$.evidence_kernel.relations", "invalid-relation-set");
  if (claims.length < 7 || claimIdList.length !== claims.length || !unique(claimIdList)) add("$.evidence_kernel.claims", "invalid-claim-set");

  const sourceIds = new Set(ids(value.sources));
  if (sourceIds.size < 15 || !unique(ids(value.sources))) add("$.sources", "invalid-source-set");
  for (const [index, source] of array(value.sources).entries()) {
    if (!sameKeys(source, ["id", "title", "source_kind", "published_on", "observed_on", "url", "doi", "authority_note"]) ||
        !id(source.id) || !text(source.title, 600) || !id(source.source_kind) || typeof source.published_on !== "string" || !YEAR_PRECISION.test(source.published_on) ||
        !fullDate(source.observed_on) || !fullDate(value.compiled_on) || source.observed_on > value.compiled_on || !isHttps(source.url) ||
        !(source.doi === null || text(source.doi, 200)) || !text(source.authority_note)) add(`$.sources[${index}]`, "invalid-source");
  }
  for (const [index, mechanism] of mechanisms.entries()) {
    if (!sameKeys(mechanism, ["id", "system_ids", "ordinary_words", "scientific_statement", "source_ids", "limitations"]) || !id(mechanism.id) ||
        !references(mechanism.system_ids, systemIds) || !text(mechanism.ordinary_words) || !text(mechanism.scientific_statement) ||
        !references(mechanism.source_ids, sourceIds) || !textArray(mechanism.limitations)) add(`$.evidence_kernel.mechanisms[${index}]`, "invalid-mechanism");
  }
  const planeIds = new Set(PLANE_IDS);
  for (const [index, relation] of relations.entries()) {
    if (!sameKeys(relation, ["id", "subject_id", "predicate", "object_id", "mechanism_id", "source_ids", "condition_dependent", "universal"]) || !id(relation.id) ||
        !planeIds.has(relation.subject_id) || !id(relation.predicate) || !planeIds.has(relation.object_id) || !mechanismIds.has(relation.mechanism_id) ||
        !references(relation.source_ids, sourceIds) || relation.condition_dependent !== true || relation.universal !== false) add(`$.evidence_kernel.relations[${index}]`, "invalid-or-unbounded-relation");
    if (relation?.subject_id === "supramolecular-assembly" && ["organismal-phenotype", "experimental-transmission-observation", "clinical-decision"].includes(relation?.object_id)) add(`$.evidence_kernel.relations[${index}]`, "forbidden-assembly-shortcut");
  }
  for (const [index, claim] of claims.entries()) {
    if (!sameKeys(claim, ["id", "register", "summary", "source_ids", "limitations"]) || !id(claim.id) || !id(claim.register) || !text(claim.summary) ||
        !references(claim.source_ids, sourceIds) || !textArray(claim.limitations)) add(`$.evidence_kernel.claims[${index}]`, "invalid-claim");
  }

  if (!Array.isArray(value.comparison_bridges) || value.comparison_bridges.length !== 1) add("$.comparison_bridges", "bridge-count-mismatch");
  for (const [index, bridge] of array(value.comparison_bridges).entries()) {
    if (!sameKeys(bridge, ["id", "from_system", "to_system", "preserved_invariants", "where_correspondence_breaks", "universal", "relation", "source_ids"]) ||
        !id(bridge.id) || !systemIds.has(bridge.from_system) || !systemIds.has(bridge.to_system) || bridge.relation !== "bounded-analogy-not-same-as" || bridge.universal !== false ||
        !textArray(bridge.preserved_invariants, 3) || !textArray(bridge.where_correspondence_breaks, 4) ||
        !references(bridge.source_ids, sourceIds)) add(`$.comparison_bridges[${index}]`, "analogy-firewall-mismatch");
  }

  const feedbackRelations = array(value.scientific_feedback_relations);
  const feedbackIds = ids(feedbackRelations);
  if (!Array.isArray(value.scientific_feedback_relations) || feedbackRelations.length < 3 || feedbackIds.length !== feedbackRelations.length || !unique(feedbackIds)) add("$.scientific_feedback_relations", "invalid-feedback-set");
  for (const [index, feedback] of array(value.scientific_feedback_relations).entries()) {
    if (!sameKeys(feedback, ["id", "register", "input", "process", "return_effect", "direction", "limits", "source_ids", "does_not_establish"]) || !id(feedback.id) ||
        !["literal-science", "kingdom-design-correspondence"].includes(feedback.register) || !["amplifies", "redirects", "corrects"].includes(feedback.direction) ||
        !text(feedback.input) || !text(feedback.process) || !text(feedback.return_effect) || !textArray(feedback.limits) ||
        !references(feedback.source_ids, sourceIds) || !textArray(feedback.does_not_establish, 2)) add(`$.scientific_feedback_relations[${index}]`, "invalid-feedback");
  }

  if (!sameKeys(value.karma, ["scientific_feedback_is_not_karma", "zerone", "kingdom", "adapter", "design_correspondences"]) || value.karma?.scientific_feedback_is_not_karma !== true) add("$.karma", "karma-lane-mismatch");
  if (!sameKeys(value.karma?.zerone, ["protocol", "meaning", "register", "event_kinds", "event_refs", "event_status", "not"]) || value.karma.zerone.protocol !== "zerone.karma.edge" || value.karma.zerone.register !== "priced-coherence" ||
      !Array.isArray(value.karma.zerone.event_kinds) || value.karma.zerone.event_kinds.join("|") !== "cited|corroborate|corroborated|external|pending_open|pending_settle|verify" ||
      !Array.isArray(value.karma.zerone.event_refs) || value.karma.zerone.event_refs.length !== 0 || value.karma.zerone.event_status !== "not_observed" ||
      !text(value.karma.zerone.meaning) || !textArray(value.karma.zerone.not)) add("$.karma.zerone", "zerone-karma-mismatch");
  if (!sameKeys(value.karma?.kingdom, ["protocol", "meaning", "accounting", "receipt_refs", "receipt_status", "not"]) || value.karma.kingdom.protocol !== "kingdom.karma/0.1" || value.karma.kingdom.accounting !== "receipts_not_scores" ||
      !Array.isArray(value.karma.kingdom.receipt_refs) || value.karma.kingdom.receipt_refs.length !== 0 || value.karma.kingdom.receipt_status !== "not_created" ||
      !text(value.karma.kingdom.meaning) || !textArray(value.karma.kingdom.not)) add("$.karma.kingdom", "kingdom-karma-mismatch");
  if (!sameKeys(value.karma?.adapter, ["exists", "reason"]) || value.karma.adapter.exists !== false || !text(value.karma.adapter.reason)) add("$.karma.adapter", "implicit-adapter");
  const designCorrespondences = array(value.karma?.design_correspondences);
  const designIds = ids(designCorrespondences);
  if (!Array.isArray(value.karma?.design_correspondences) || designCorrespondences.length < 2 || designIds.length !== designCorrespondences.length || !unique(designIds) ||
      designCorrespondences.some((entry: any) => !sameKeys(entry, ["id", "status", "pattern", "maps_to", "does_not_convert"]) || !id(entry.id) ||
        entry.status !== "not_observed" || !text(entry.pattern) || !idArray(entry.maps_to) || entry.does_not_convert !== true)) {
    add("$.karma.design_correspondences", "observed-or-converting-design-map");
  }

  const universeQuestions = array(value.universe_lens?.questions);
  const universeQuestionIds = ids(universeQuestions);
  if (!sameKeys(value.universe_lens, ["participation", "register", "questions", "nonclaims"]) || value.universe_lens?.participation !== "opt-in" || value.universe_lens?.register !== "philosophical-interpretation" ||
      !Array.isArray(value.universe_lens?.questions) || universeQuestions.length < 4 || universeQuestionIds.length !== universeQuestions.length || !unique(universeQuestionIds)) add("$.universe_lens", "universe-lens-mismatch");
  for (const [index, question] of universeQuestions.entries()) {
    if (!sameKeys(question, ["id", "question", "scientific_prompt_claim_ids", "authored_position", "analogy_breaks"]) || !id(question.id) || !text(question.question) ||
        !references(question.scientific_prompt_claim_ids, claimIds) || !text(question.authored_position) || !textArray(question.analogy_breaks)) add(`$.universe_lens.questions[${index}]`, "invalid-philosophical-question");
  }
  const requiredNonclaims = ["scientifically proves intentional universe design", "scientifically disproves a creator or metaphysical purpose", "proves cosmic moral KARMA"];
  if (!textArray(value.universe_lens?.nonclaims) || requiredNonclaims.some((item) => !value.universe_lens.nonclaims.includes(item))) add("$.universe_lens.nonclaims", "teleology-boundary-mismatch");

  if (!Array.isArray(value.unknowns) || value.unknowns.length < 7 || !unique(ids(value.unknowns))) add("$.unknowns", "invalid-unknown-set");
  for (const [index, unknown] of array(value.unknowns).entries()) {
    if (!sameKeys(unknown, ["id", "question", "status", "why_open", "source_ids"]) || !id(unknown.id) || !text(unknown.question) || !UNKNOWN_STATUSES.has(unknown.status) || !text(unknown.why_open) || !references(unknown.source_ids, sourceIds)) add(`$.unknowns[${index}]`, "invalid-unknown");
  }

  if (!sameKeys(value.boundaries, Object.keys(EXPECTED_BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
  for (const [key, expected] of Object.entries(EXPECTED_BOUNDARIES)) if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");
  if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM || typeof value.integrity?.digest !== "string" || !SHA256.test(value.integrity.digest)) add("$.integrity", "invalid-integrity-envelope");
  else if (value.integrity.digest !== FOLD_FEEDBACK_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
  else if (!issues.length) {
    try {
      if (value.integrity.digest !== foldFeedbackDigest(value)) add("$.integrity.digest", "digest-mismatch");
    } catch {
      add("$.integrity.digest", "digest-unavailable");
    }
  }
  return issues;
}

export function loadFoldFeedbackAtlas(path = FOLD_FEEDBACK_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyFoldFeedbackAtlas(value);
  if (issues.length) fail(`fold-feedback atlas refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

export function foldFeedbackPublicDiscovery(value = loadFoldFeedbackAtlas()): Record<string, any> {
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: FOLD_FEEDBACK_URL,
    schema: FOLD_FEEDBACK_SCHEMA_URL,
    guide: FOLD_FEEDBACK_DOCUMENT_URL,
    integrity: value.integrity,
    counts: {
      planes: value.ontology.planes.length,
      systems: value.evidence_kernel.systems.length,
      mechanisms: value.evidence_kernel.mechanisms.length,
      relations: value.evidence_kernel.relations.length,
      claims: value.evidence_kernel.claims.length,
      comparison_bridges: value.comparison_bridges.length,
      feedback_relations: value.scientific_feedback_relations.length,
      universe_questions: value.universe_lens.questions.length,
      unknowns: value.unknowns.length,
      sources: value.sources.length,
    },
    karma: {
      zerone_event_status: value.karma.zerone.event_status,
      zerone_event_refs: value.karma.zerone.event_refs.length,
      kingdom_receipt_status: value.karma.kingdom.receipt_status,
      kingdom_receipt_refs: value.karma.kingdom.receipt_refs.length,
      adapter_exists: value.karma.adapter.exists,
    },
    safety: value.plain_language.safety,
    boundary: {
      public_surface_read_only: true,
      medical_advice: false,
      experiment_authority: false,
      automatic_action: false,
      writes_karma: false,
      creates_kingdom_karma_receipt: false,
      observes_zerone_karma_event: false,
    },
  };
}

function overview(value: Record<string, any>): string {
  return [value.title, "", ...value.plain_language.short_answer, "", `${value.evidence_kernel.mechanisms.length} mechanisms · ${value.scientific_feedback_relations.length} feedback relations · ${value.unknowns.length} explicit open states`, `evidence through ${value.evidence_through} · ${value.integrity.digest}`, "", `Safety: ${value.plain_language.safety}`].join("\n") + "\n";
}
function usage(): never {
  process.stderr.write("usage: fold-feedback.ts [overview|mechanisms|compare|feedback|karma|universe|unknowns|sources] [--json]\n       fold-feedback.ts verify [FILE] [--json]\n");
  process.exit(2);
}
export async function runFoldFeedbackCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndex = copy.indexOf("--json");
  const json = jsonIndex >= 0;
  if (json) copy.splice(jsonIndex, 1);
  if (copy.some((arg) => arg.startsWith("-"))) usage();
  if (command === "verify") {
    if (copy.length > 1) usage();
    let issues: FoldFeedbackIssue[];
    try { issues = verifyFoldFeedbackAtlas(readUnchecked(copy[0] ? resolve(copy[0]) : FOLD_FEEDBACK_PATH)); }
    catch (error) { issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }]; }
    if (json) process.stdout.write(`${JSON.stringify({ valid: issues.length === 0, issues })}\n`);
    else if (!issues.length) process.stdout.write("Fold & Feedback Atlas: valid pins, science, bridges, feedback, KARMA separation, philosophy boundary, unknowns, and semantic digest; JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }
  if (copy.length) usage();
  const value = loadFoldFeedbackAtlas();
  const selection: Record<string, unknown> = {
    mechanisms: value.evidence_kernel.mechanisms,
    compare: value.comparison_bridges,
    feedback: value.scientific_feedback_relations,
    karma: value.karma,
    universe: value.universe_lens,
    unknowns: value.unknowns,
    sources: value.sources,
  };
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (Object.hasOwn(selection, command)) process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, [command]: selection[command] }, null, json ? 0 : 2)}\n`);
  else usage();
}

if (import.meta.main) {
  try { await runFoldFeedbackCli(); }
  catch (error) { process.stderr.write(`fold-feedback refused: ${error instanceof Error ? error.message : "invalid input"}\n`); process.exit(1); }
}
