#!/usr/bin/env bun
/** Strict, offline reader for the immutable Form, Circulation & Return Atlas. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const FORM_CIRCULATION_RETURN_PROTOCOL = "kingdom.form-circulation-return-atlas/0.1";
export const FORM_CIRCULATION_RETURN_ID = "form-circulation-return-atlas-2026-08-13";
export const FORM_CIRCULATION_RETURN_LOCATOR = "data/form-circulation-return/form-circulation-return-atlas.v1.json";
export const FORM_CIRCULATION_RETURN_PATH = join(ROOT, FORM_CIRCULATION_RETURN_LOCATOR);
export const FORM_CIRCULATION_RETURN_URL = `https://thekingdom.dev/atlases/${FORM_CIRCULATION_RETURN_ID}.json`;
export const FORM_CIRCULATION_RETURN_SCHEMA_URL = "https://thekingdom.dev/schemas/form-circulation-return-atlas/1.json";
export const FORM_CIRCULATION_RETURN_DOCUMENT_URL = "https://thekingdom.dev/FORM-CIRCULATION-RETURN-ATLAS.md";
export const FORM_CIRCULATION_RETURN_DIGEST = "sha256:9510fbbced6166507e9a1781a4adfa18cd249fb94e69b0f34faf77733cd20323";

const MAX_BYTES = 1024 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_PRECISION = /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";

const TOP_KEYS = [
  "$schema", "protocol", "atlas_id", "title", "compiled_on", "evidence_through",
  "source_bindings", "scope", "plain_language", "ontology", "material_case",
  "cultural_layer", "model_cards", "evidence_claims", "analogy_seams",
  "feedback_loops", "karma", "ecosystem_bridges", "universe_lens", "unknowns",
  "sources", "boundaries", "integrity",
] as const;

const REGISTER_IDS = ["MATERIAL_OBSERVATION", "CULTURAL_OBSERVATION", "CULTURAL_ANALYSIS", "MATHEMATICAL_MODEL", "FEEDBACK_HYPOTHESIS", "CONSTITUTIONAL_DESIGN", "PHILOSOPHY"] as const;
const PLANE_IDS = [
  "material-molecule", "crystal-form", "bounded-material-sample", "cultural-artifact",
  "cultural-practice-label", "exposure-or-impression-event", "share-or-remix-event",
  "platform-distribution-state", "collective-attention-state", "individual-cognitive-state",
  "clinical-assessment",
] as const;
const FIREWALL_IDS = [
  "crystal-not-meme", "seed-not-share", "spread-not-contagion", "attention-not-mind",
  "brainrot-not-diagnosis", "model-not-measurement", "popularity-not-value",
  "analogy-not-mechanism", "karma-not-metric", "philosophy-not-science",
] as const;
const TERM_NAMES = ["polymorph", "disappear", "meme", "brainrot", "spread", "virality", "attention", "entropy", "karma", "feedback"] as const;
const MODEL_IDS = ["material-nucleation", "threshold", "branching", "hawkes", "structural-virality", "shannon-diversity", "finite-attention", "bounded-feedback-state-space"] as const;
const CLAIM_IDS = [
  "disappearing-is-availability-history-not-destruction", "ritonavir-form-ii-disrupted-manufacture",
  "material-context-selects-accessible-forms", "digital-memes-are-cultural-groups",
  "finite-attention-network-can-generate-heavy-tails", "structural-virality-separates-broadcast-and-chains",
  "collective-attention-can-accelerate-and-shorten", "complex-adoption-can-require-reinforcement",
  "brainrot-is-contested-vernacular", "hawkes-encodes-history-dependent-intensity",
  "shannon-entropy-is-not-quality", "unfitted-models-do-not-describe-this-atlas-population",
] as const;
const SEAM_IDS = ["availability-not-existence", "seed-not-share", "nucleation-not-adoption", "form-selection-not-cultural-merit", "material-sample-not-human-population", "return-not-destiny"] as const;
const FEEDBACK_IDS = ["material-seeding-loop", "attention-ranking-loop", "remix-recognition-loop", "challenge-repair-loop"] as const;
const DESIGN_IDS = ["provenance-bearing-lineage", "challenge-and-repair", "action-and-aftermath", "rest-exit-no-debt"] as const;
const ECOSYSTEM_IDS = ["w3c-prov-o", "w3c-web-annotation", "w3c-activitystreams-2", "cloudflare-pages-publication"] as const;
const ECOSYSTEM_URLS = ["https://www.w3.org/TR/prov-o/", "https://www.w3.org/TR/annotation-model/", "https://www.w3.org/TR/activitystreams-core/", "https://developers.cloudflare.com/pages/"] as const;
const UNIVERSE_IDS = ["persistence-and-return", "selection-and-freedom", "finite-attention-and-value", "feedback-and-responsibility", "unknown-and-design"] as const;
const UNKNOWN_IDS = ["cultural-unit-definition", "cross-platform-identity", "counterfactual-exposure", "causal-ranking-effect", "model-parameters", "brainrot-operationalization", "individual-effect", "cross-domain-isomorphism"] as const;
const UNKNOWN_STATUSES = ["unknown", "not_established", "outside_scope", "not_observed", "unmapped", "contested", "withheld_for_safety", "refused"] as const;
const SOURCE_IDS = [
  "dunitz-1995", "bauer-2001", "sacchi-2024", "karthika-2016", "shifman-2013", "watts-2002",
  "centola-2010", "gleeson-2021", "hawkes-1971", "goel-2016", "weng-2012",
  "qiu-2017", "lorenz-spreen-2019", "huszar-2022", "chaney-2018",
  "pennycook-2021", "shannon-1948", "oxford-brain-rot-2024", "w3c-prov-o", "cloudflare-pages",
] as const;
const SOURCE_URLS = [
  "https://doi.org/10.1021/ar00052a005", "https://doi.org/10.1023/A:1011052932607",
  "https://doi.org/10.1073/pnas.2319127121", "https://doi.org/10.1021/acs.cgd.6b00794",
  "https://doi.org/10.1111/jcc4.12013",
  "https://doi.org/10.1073/pnas.082090499", "https://doi.org/10.1126/science.1185231",
  "https://doi.org/10.1093/comnet/cnab002", "https://doi.org/10.1093/biomet/58.1.83",
  "https://doi.org/10.1287/mnsc.2015.2158", "https://doi.org/10.1038/srep00335",
  "https://doi.org/10.1038/s41562-017-0132", "https://doi.org/10.1038/s41467-019-09311-w",
  "https://doi.org/10.1073/pnas.2025334119",
  "https://doi.org/10.1145/3240323.3240370", "https://doi.org/10.1038/s41586-021-03344-2",
  "https://doi.org/10.1002/j.1538-7305.1948.tb01338.x",
  "https://corp.oup.com/news/brain-rot-named-oxford-word-of-the-year-2024/",
  "https://www.w3.org/TR/prov-o/", "https://developers.cloudflare.com/pages/",
] as const;

const EXPECTED_BINDINGS: ReadonlyArray<Record<string, unknown>> = [
  { id: "kingdom-ritonavir-history", system: "kingdom", revision: "06996296fd0de3a25ed9bb299f3c627b6a29045d", artifact: "ritonavir-disappearing-polymorph-2026-08-11", url: "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json", raw_digest: "sha256:08148603a1228960ac35df1378f1283c3fce43874a9fc07e6687f18e980dcb1c", semantic_digest: "sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116", relation: "immutable-material-case-input", mutated: false, authority_imported: false },
  { id: "kingdom-ritonavir-mechanism", system: "kingdom", revision: "919df4409fc42ede5330ecd36c12fdb752ee9c50", artifact: "ritonavir-mechanism-landscape-2026-08-11", url: "https://thekingdom.dev/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json", raw_digest: "sha256:5e136a74d5166275427da920685a84c17901f63d6e4b0661fd529c96d386943b", semantic_digest: "sha256:2a97b0f3ac3741314e50f7512ef97cb19cf3294fed24728c622bd27dd180309b", relation: "immutable-material-mechanism-input", mutated: false, authority_imported: false },
  { id: "kingdom-conformational-feedback-v0-1", system: "kingdom", revision: "78876f598ebe18a1ae3cbc947a382b550224a7c7", artifact: "form-feedback-consequence-2026-08-12", url: "https://thekingdom.dev/feedback/form-feedback-consequence-2026-08-12.json", raw_digest: "sha256:ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6", semantic_digest: "sha256:14ce5e5e4b2b3d29d9a9cc0c831dcfb88de3d4a9e9584119939e5118f7ac7361", relation: "immutable-feedback-input", mutated: false, authority_imported: false },
  { id: "kingdom-conformational-feedback-v0-2", system: "kingdom", revision: "78876f598ebe18a1ae3cbc947a382b550224a7c7", artifact: "form-feedback-physics-consequence-2026-08-12", url: "https://thekingdom.dev/feedback/form-feedback-physics-consequence-2026-08-12.json", raw_digest: "sha256:7d9b1eed8514051e47448cfc983f00e160d5b76c49704822158f76d3f8cf6349", semantic_digest: "sha256:0fc24a0fac99d2dadcdef5b87290a1d598b856f874aa9637ab4d503fd4c9dc11", relation: "immutable-physics-input", mutated: false, authority_imported: false },
  { id: "kingdom-fold-feedback", system: "kingdom", revision: "b9ef002c953c057e16c9d05f0370b707aa4bf754", artifact: "fold-feedback-atlas-2026-08-12", url: "https://thekingdom.dev/atlases/fold-feedback-atlas-2026-08-12.json", raw_digest: "sha256:bc9a9abc966e64f7fb967778974879eb045083b342b70100bba92c94d0879df5", semantic_digest: "sha256:f19f83453bcac228c6a2804b840062067e92e71187f67b713f50abf0168252b7", relation: "immutable-boundary-input", mutated: false, authority_imported: false },
  { id: "kingdom-visibility-attention", system: "kingdom", revision: "b0130580c5f939cbd7c3eff2708744b952dabaee", artifact: "visibility-is-not-existence-2026-08-13", url: "https://thekingdom.dev/atlases/visibility-attention-2026-08-13.json", raw_digest: "sha256:0af0249c40298ed746d39ee60760a4390bb45137caa8ee6dd7555a824f597bd3", semantic_digest: "sha256:9fb83bbd022f520716fabcdec49d8af259b9681efd5e640a9e3119c5c42a54ed", relation: "immutable-attention-boundary-input", mutated: false, authority_imported: false },
  { "id": "kingdom-cultural-attention-feedback", "system": "kingdom", "revision": "3944cacf50f53dfc8939f8557015fe4ad57c5599", "artifact": "cultural-attention-feedback-atlas-2026-08-13", "url": "https://thekingdom.dev/atlases/cultural-attention-feedback-atlas-2026-08-13.json", "raw_digest": "sha256:03f7048966d7b6df582b423254b4d73cda72cce3bd67b40736927faa92b88173", "semantic_digest": "sha256:2f6ecadc131a54cdd500b001dbcc47fb036e5e411def918245fec963b9769e4d", "relation": "immutable-cultural-attention-predecessor", "mutated": false, "authority_imported": false },
  { id: "kingdom-karma-definition", system: "kingdom", revision: "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212", artifact: "NEN.md KARMA definition", url: "https://thekingdom.dev/definitions/kingdom-karma/e4e84a67/NEN.md", raw_digest: "sha256:14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446", semantic_digest: null, relation: "immutable-public-definition-mirror", mutated: false, authority_imported: false },
  { id: "zerone-karma-foundation", system: "zerone", revision: "fae391e371f0ebea2e24eb46c33a4ebd1380154f", artifact: "zerone.karma-foundation/v1", url: "https://github.com/cambridgetcg/zerone-core/blob/fae391e371f0ebea2e24eb46c33a4ebd1380154f/dashboard/public/standards/karma-foundation.v1.json", raw_digest: "sha256:b46710704869dcc340ded356be72b4ec692f204710fedfb5cd43eb3757dc7b80", semantic_digest: null, relation: "definition-only", mutated: false, authority_imported: false },
] as const;

const EXPECTED_BOUNDARIES: Record<string, boolean> = {
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
};

export type FormCirculationReturnIssue = { field: string; code: string };

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): value is Record<string, any> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function array(value: unknown): any[] { return Array.isArray(value) ? value : []; }
function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}
function text(value: unknown, max = 5000): value is string { return typeof value === "string" && value.length > 0 && Array.from(value).length <= max; }
function id(value: unknown): value is string { return typeof value === "string" && value.length <= 120 && ID.test(value); }
function fullDate(value: unknown): value is string {
  if (typeof value !== "string" || !FULL_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month! < 1 || month! > 12 || day! < 1) return false;
  const leap = year! % 4 === 0 && (year! % 100 !== 0 || year! % 400 === 0);
  return day! <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month! - 1]!;
}
function strings(value: unknown, min = 1, max = 30): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max && value.every((item) => text(item));
}
function ids(value: unknown): string[] { return array(value).map((item) => item?.id).filter((item) => typeof item === "string"); }
function exactIds(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item?.id === expected[index]);
}
function unique(values: string[]): boolean { return new Set(values).size === values.length; }
function references(value: unknown, known: Set<string>, min = 1): boolean {
  return Array.isArray(value) && value.length >= min && value.length <= 30 && value.every((item) => typeof item === "string" && known.has(item)) && unique(value);
}
function exactRecord(value: unknown, expected: Record<string, unknown>): boolean {
  return sameKeys(value, Object.keys(expected)) && Object.entries(expected).every(([key, item]) => (value as Record<string, unknown>)[key] === item);
}

export function formCirculationReturnDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("form circulation return integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { fail("form circulation return atlas is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("form circulation return atlas must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) fail(`form circulation return atlas exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "form circulation return atlas JSON");
}

export function verifyFormCirculationReturnAtlas(value: unknown): FormCirculationReturnIssue[] {
  const issues: FormCirculationReturnIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
    if (value.$schema !== "urn:kingdom:schema:form-circulation-return-atlas:1") add("$.$schema", "schema-mismatch");
    if (value.protocol !== FORM_CIRCULATION_RETURN_PROTOCOL) add("$.protocol", "protocol-mismatch");
    if (value.atlas_id !== FORM_CIRCULATION_RETURN_ID) add("$.atlas_id", "identity-mismatch");
    if (!text(value.title, 240)) add("$.title", "invalid-text");
    if (value.compiled_on !== "2026-08-13" || value.evidence_through !== "2026-08-13" || !fullDate(value.compiled_on) || !fullDate(value.evidence_through)) add("$.evidence_through", "invalid-horizon");

    if (!Array.isArray(value.source_bindings) || value.source_bindings.length !== EXPECTED_BINDINGS.length) add("$.source_bindings", "binding-count-mismatch");
    for (const [index, expected] of EXPECTED_BINDINGS.entries()) if (!exactRecord(value.source_bindings?.[index], expected)) add(`$.source_bindings[${index}]`, "source-binding-mismatch");

    if (!sameKeys(value.scope, ["focus", "intended_use", "excluded_use", "observation_policy", "currentness"]) ||
        !text(value.scope?.focus) || !text(value.scope?.intended_use) || !text(value.scope?.excluded_use) || !text(value.scope?.observation_policy) ||
        value.scope?.currentness !== "selected-evidence-as-of-compilation") add("$.scope", "invalid-scope");
    if (!sameKeys(value.plain_language, ["question", "short_answer", "safety"]) || !text(value.plain_language?.question) ||
        !strings(value.plain_language?.short_answer, 7, 7) || !text(value.plain_language?.safety) ||
        !value.plain_language?.safety?.includes("no medical") || !value.plain_language?.safety?.includes("wet-lab") ||
        !value.plain_language?.safety?.includes("manufacturing") || !value.plain_language?.safety?.includes("operational-protocol") ||
        !value.plain_language?.safety?.includes("not a diagnosis") || !value.plain_language?.safety?.includes("No runtime request")) add("$.plain_language", "safety-or-shape-mismatch");

    if (!sameKeys(value.ontology, ["non_equivalence", "registers", "planes", "firewalls", "domain_qualified_terms"]) ||
        !text(value.ontology?.non_equivalence) || !value.ontology.non_equivalence.includes("person_or_community_or_moral_status")) add("$.ontology", "ontology-mismatch");
    if (!exactIds(value.ontology?.registers, REGISTER_IDS)) add("$.ontology.registers", "register-order-or-membership-mismatch");
    for (const [index, item] of array(value.ontology?.registers).entries()) if (!sameKeys(item, ["id", "meaning", "cannot_authorize"]) || !REGISTER_IDS.includes(item?.id) || !text(item?.meaning) || !text(item?.cannot_authorize)) add(`$.ontology.registers[${index}]`, "invalid-register");
    if (!exactIds(value.ontology?.planes, PLANE_IDS)) add("$.ontology.planes", "plane-order-or-membership-mismatch");
    for (const [index, item] of array(value.ontology?.planes).entries()) if (!sameKeys(item, ["id", "ordinary_words", "does_not_establish"]) || !id(item?.id) || !text(item?.ordinary_words) || !text(item?.does_not_establish)) add(`$.ontology.planes[${index}]`, "invalid-plane");
    if (!exactIds(value.ontology?.firewalls, FIREWALL_IDS) || array(value.ontology?.firewalls).some((item) => !sameKeys(item, ["id", "rule", "enforced"]) || !text(item?.rule) || item?.enforced !== true)) add("$.ontology.firewalls", "firewall-mismatch");
    if (!Array.isArray(value.ontology?.domain_qualified_terms) || value.ontology.domain_qualified_terms.length !== TERM_NAMES.length || value.ontology.domain_qualified_terms.some((item: any, index: number) => !sameKeys(item, ["term", "bounded_meaning", "forbidden_shortcut"]) || item?.term !== TERM_NAMES[index] || !text(item?.bounded_meaning) || !text(item?.forbidden_shortcut))) add("$.ontology.domain_qualified_terms", "term-boundary-mismatch");

    if (!sameKeys(value.material_case, ["subject", "disappearance_predicate", "literal_model", "source_ids"]) || !text(value.material_case?.subject)) add("$.material_case", "invalid-material-case");
    const predicate = value.material_case?.disappearance_predicate;
    if (!sameKeys(predicate, ["subject", "process_or_corpus", "procedure", "time_window", "detection_threshold", "observed_result", "exclusions"]) || !text(predicate?.subject) || !text(predicate?.process_or_corpus) || !text(predicate?.procedure) || !text(predicate?.time_window) || !text(predicate?.detection_threshold) || !text(predicate?.observed_result) || !strings(predicate?.exclusions, 4, 8)) add("$.material_case.disappearance_predicate", "unbounded-disappearance-predicate");
    if (!sameKeys(value.material_case?.literal_model, ["equations", "register", "warning"]) || !strings(value.material_case?.literal_model?.equations, 2, 2) || value.material_case?.literal_model?.register !== "MATHEMATICAL_MODEL" || !text(value.material_case?.literal_model?.warning) || !value.material_case.literal_model.warning.includes("Atlas-authored") || !value.material_case.literal_model.warning.includes("not observations")) add("$.material_case.literal_model", "material-model-boundary-mismatch");

    const sourceIds = new Set(ids(value.sources));
    if (!references(value.material_case?.source_ids, sourceIds, 3)) add("$.material_case.source_ids", "invalid-source-reference");
    if (!sameKeys(value.cultural_layer, ["variant_unit", "event_distinctions", "lineage_policy", "meaning_fidelity", "vernacular_labels"]) || !text(value.cultural_layer?.variant_unit) || !strings(value.cultural_layer?.event_distinctions, 11, 11) || !text(value.cultural_layer?.lineage_policy) || !text(value.cultural_layer?.meaning_fidelity)) add("$.cultural_layer", "invalid-cultural-layer");
    if (!exactIds(value.cultural_layer?.vernacular_labels, ["brainrot"])) add("$.cultural_layer.vernacular_labels", "vernacular-label-set-mismatch");
    const label = value.cultural_layer?.vernacular_labels?.[0];
    if (!sameKeys(label, ["id", "status", "target_type", "source_id", "context", "quoted_wording", "observed_on", "never"]) || label?.status !== "contested" || label?.target_type !== "artifact-or-practice-only" || label?.source_id !== "oxford-brain-rot-2024" || !text(label?.context) || label?.quoted_wording !== "brain rot" || label?.observed_on !== "2026-08-13" || !strings(label?.never, 5, 5)) add("$.cultural_layer.vernacular_labels[0]", "vernacular-label-target-invalid");
    if (array(label?.never).join("|") !== "diagnosis|individual-cognitive-state|person-or-community-property|susceptibility-parameter|score") add("$.cultural_layer.vernacular_labels[0].never", "person-state-forbidden");

    if (!exactIds(value.model_cards, MODEL_IDS)) add("$.model_cards", "model-order-or-membership-mismatch");
    for (const [index, card] of array(value.model_cards).entries()) {
      if (!sameKeys(card, ["id", "equation", "equation_status", "source_relation", "domain", "variables", "fit_status", "assumptions", "valid_outputs", "uncertainty", "identifiability_limits", "prohibited_inferences", "source_ids", "universal", "person_level", "authority_effect"]) ||
          !id(card?.id) || !text(card?.equation) || !id(card?.equation_status) || !text(card?.source_relation) || !REGISTER_IDS.includes(card?.domain) || !strings(card?.variables) || card?.fit_status !== "not_fitted" || !strings(card?.assumptions) || !strings(card?.valid_outputs) || !text(card?.uncertainty) || !text(card?.identifiability_limits) || !strings(card?.prohibited_inferences, 4) || !references(card?.source_ids, sourceIds) || card?.universal !== false || card?.person_level !== false || card?.authority_effect !== "NONE") add(`$.model_cards[${index}]`, "invalid-or-unbound-model-card");
    }
    if (array(value.model_cards).some((card: any) => card?.domain !== "MATHEMATICAL_MODEL") || !array(value.model_cards?.[0]?.assumptions).includes("material-domain-only")) add("$.model_cards", "model-domain-mismatch");

    if (!exactIds(value.evidence_claims, CLAIM_IDS)) add("$.evidence_claims", "claim-order-or-membership-mismatch");
    for (const [index, claim] of array(value.evidence_claims).entries()) if (!sameKeys(claim, ["id", "register", "claim", "source_ids", "limitations"]) || !id(claim?.id) || !REGISTER_IDS.includes(claim?.register) || !text(claim?.claim) || !references(claim?.source_ids, sourceIds) || !strings(claim?.limitations)) add(`$.evidence_claims[${index}]`, "invalid-claim");
    if (value.evidence_claims?.[3]?.register !== "CULTURAL_ANALYSIS") add("$.evidence_claims[3].register", "analysis-mislabeled-as-observation");
    if (!exactIds(value.analogy_seams, SEAM_IDS)) add("$.analogy_seams", "seam-order-or-membership-mismatch");
    const planeIds = new Set(PLANE_IDS);
    for (const [index, seam] of array(value.analogy_seams).entries()) if (!sameKeys(seam, ["id", "from", "to", "preserves", "breaks", "relation", "empirical", "causal_transfer", "authority_effect"]) || !id(seam?.id) || !planeIds.has(seam?.from) || !planeIds.has(seam?.to) || !strings(seam?.preserves) || !strings(seam?.breaks) || seam?.relation !== "bounded-analogy-not-same-as" || seam?.empirical !== false || seam?.causal_transfer !== false || seam?.authority_effect !== "NONE") add(`$.analogy_seams[${index}]`, "analogy-firewall-mismatch");

    if (!exactIds(value.feedback_loops, FEEDBACK_IDS)) add("$.feedback_loops", "feedback-order-or-membership-mismatch");
    for (const [index, loop] of array(value.feedback_loops).entries()) if (!sameKeys(loop, ["id", "register", "input", "process", "return_effect", "status", "source_relation", "source_ids", "does_not_establish"]) || !id(loop?.id) || !REGISTER_IDS.includes(loop?.register) || !text(loop?.input) || !text(loop?.process) || !text(loop?.return_effect) || !id(loop?.status) || !text(loop?.source_relation) || !references(loop?.source_ids, sourceIds) || !strings(loop?.does_not_establish, 3)) add(`$.feedback_loops[${index}]`, "invalid-feedback-loop");
    if (value.feedback_loops?.[0]?.register !== "MATERIAL_OBSERVATION" || value.feedback_loops?.[0]?.status !== "source-bound-example" ||
        value.feedback_loops?.[1]?.register !== "FEEDBACK_HYPOTHESIS" || value.feedback_loops?.[1]?.status !== "bounded-hypothesis" ||
        value.feedback_loops?.[2]?.register !== "FEEDBACK_HYPOTHESIS" || value.feedback_loops?.[2]?.status !== "bounded-hypothesis" ||
        value.feedback_loops?.[3]?.register !== "CONSTITUTIONAL_DESIGN" || value.feedback_loops?.[3]?.status !== "design-correspondence-not-observed") add("$.feedback_loops", "epistemic-register-mismatch");

    if (!sameKeys(value.karma, ["cultural_feedback_is_not_karma", "engagement_is_not_karma", "zerone", "kingdom", "adapter", "design_correspondences"]) || value.karma?.cultural_feedback_is_not_karma !== true || value.karma?.engagement_is_not_karma !== true) add("$.karma", "karma-lane-mismatch");
    if (!sameKeys(value.karma?.zerone, ["foundation_protocol", "foundation_status", "network_observed", "authoritative", "event_type", "event_refs", "event_status", "not"]) || value.karma?.zerone?.foundation_protocol !== "zerone.karma-foundation/v1" || value.karma?.zerone?.foundation_status !== "design-only" || value.karma?.zerone?.network_observed !== false || value.karma?.zerone?.authoritative !== false || value.karma?.zerone?.event_type !== "zerone.karma.edge" || !Array.isArray(value.karma?.zerone?.event_refs) || value.karma.zerone.event_refs.length !== 0 || value.karma?.zerone?.event_status !== "not_observed" || !strings(value.karma?.zerone?.not, 5, 5)) add("$.karma.zerone", "zerone-event-not-observed");
    if (!sameKeys(value.karma?.kingdom, ["protocol", "accounting", "receipt_refs", "receipt_status", "not"]) || value.karma?.kingdom?.protocol !== "kingdom.karma/0.1" || value.karma?.kingdom?.accounting !== "receipts_not_scores" || !Array.isArray(value.karma?.kingdom?.receipt_refs) || value.karma.kingdom.receipt_refs.length !== 0 || value.karma?.kingdom?.receipt_status !== "not_created" || !strings(value.karma?.kingdom?.not, 4, 4)) add("$.karma.kingdom", "kingdom-receipt-not-created");
    if (!sameKeys(value.karma?.adapter, ["exists", "status", "reason"]) || value.karma?.adapter?.exists !== false || value.karma?.adapter?.status !== "refused" || !text(value.karma?.adapter?.reason)) add("$.karma.adapter", "implicit-adapter");
    if (!exactIds(value.karma?.design_correspondences, DESIGN_IDS) || array(value.karma?.design_correspondences).some((item) => !sameKeys(item, ["id", "status", "pattern", "maps_to", "does_not_convert"]) || item?.status !== "not_observed" || !text(item?.pattern) || !strings(item?.maps_to) || item?.does_not_convert !== true)) add("$.karma.design_correspondences", "observed-or-converting-design-map");

    if (!exactIds(value.ecosystem_bridges, ECOSYSTEM_IDS)) add("$.ecosystem_bridges", "ecosystem-order-or-membership-mismatch");
    for (const [index, bridge] of array(value.ecosystem_bridges).entries()) if (!sameKeys(bridge, ["id", "standard", "url", "use", "mode", "runtime_request", "authority_imported"]) || !id(bridge?.id) || !text(bridge?.standard) || bridge?.url !== ECOSYSTEM_URLS[index] || !text(bridge?.use) || bridge?.mode !== "link-only" || bridge?.runtime_request !== false || bridge?.authority_imported !== false) add(`$.ecosystem_bridges[${index}]`, "active-or-authoritative-ecosystem-bridge");

    if (!sameKeys(value.universe_lens, ["participation", "register", "questions", "nonclaims"]) || value.universe_lens?.participation !== "opt-in" || value.universe_lens?.register !== "PHILOSOPHY" || !exactIds(value.universe_lens?.questions, UNIVERSE_IDS) || !strings(value.universe_lens?.nonclaims, 6, 6)) add("$.universe_lens", "universe-lens-mismatch");
    for (const [index, question] of array(value.universe_lens?.questions).entries()) if (!sameKeys(question, ["id", "question", "authored_position", "analogy_breaks"]) || !id(question?.id) || !text(question?.question) || !text(question?.authored_position) || !strings(question?.analogy_breaks)) add(`$.universe_lens.questions[${index}]`, "invalid-philosophical-question");
    const nonclaims = array(value.universe_lens?.nonclaims);
    for (const required of ["scientifically proves intentional universe design", "scientifically disproves a creator or metaphysical purpose", "proves cosmic moral KARMA"]) if (!nonclaims.includes(required)) add("$.universe_lens.nonclaims", "philosophy-as-evidence");

    if (!exactIds(value.unknowns, UNKNOWN_IDS)) add("$.unknowns", "unknown-order-or-membership-mismatch");
    for (const [index, unknown] of array(value.unknowns).entries()) if (!sameKeys(unknown, ["id", "question", "status", "why_open", "source_ids"]) || !id(unknown?.id) || !text(unknown?.question) || !UNKNOWN_STATUSES.includes(unknown?.status) || !text(unknown?.why_open) || !references(unknown?.source_ids, sourceIds)) add(`$.unknowns[${index}]`, "invalid-unknown");

    if (!exactIds(value.sources, SOURCE_IDS)) add("$.sources", "source-order-or-membership-mismatch");
    for (const [index, source] of array(value.sources).entries()) if (!sameKeys(source, ["id", "title", "source_kind", "published_on", "observed_on", "url", "doi", "authority_note"]) || !id(source?.id) || !text(source?.title, 800) || !id(source?.source_kind) || typeof source?.published_on !== "string" || !YEAR_PRECISION.test(source.published_on) || source?.observed_on !== "2026-08-13" || source?.url !== SOURCE_URLS[index] || !(source?.doi === null || text(source?.doi, 200)) || !text(source?.authority_note)) add(`$.sources[${index}]`, "invalid-source");

    if (!sameKeys(value.boundaries, Object.keys(EXPECTED_BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
    for (const [key, expected] of Object.entries(EXPECTED_BOUNDARIES)) if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");
    if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM || typeof value.integrity?.digest !== "string" || !SHA256.test(value.integrity.digest)) add("$.integrity", "invalid-integrity-envelope");
    else if (value.integrity.digest !== FORM_CIRCULATION_RETURN_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
    else if (!issues.length) {
      try { if (value.integrity.digest !== formCirculationReturnDigest(value)) add("$.integrity.digest", "digest-mismatch"); }
      catch { add("$.integrity.digest", "digest-unavailable"); }
    }
  } catch {
    add("$", "verifier-unavailable-for-value");
  }
  return issues;
}

export function loadFormCirculationReturnAtlas(path = FORM_CIRCULATION_RETURN_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyFormCirculationReturnAtlas(value);
  if (issues.length) fail(`form circulation return atlas refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

export function formCirculationReturnPublicDiscovery(value = loadFormCirculationReturnAtlas()): Record<string, any> {
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: FORM_CIRCULATION_RETURN_URL,
    schema: FORM_CIRCULATION_RETURN_SCHEMA_URL,
    guide: FORM_CIRCULATION_RETURN_DOCUMENT_URL,
    cli: "kingdom form-circulation-return",
    integrity: value.integrity,
    counts: {
      registers: value.ontology.registers.length,
      planes: value.ontology.planes.length,
      models: value.model_cards.length,
      claims: value.evidence_claims.length,
      analogy_seams: value.analogy_seams.length,
      feedback_loops: value.feedback_loops.length,
      universe_questions: value.universe_lens.questions.length,
      unknowns: value.unknowns.length,
      sources: value.sources.length,
    },
    karma: {
      zerone_foundation_status: value.karma.zerone.foundation_status,
      zerone_network_observed: value.karma.zerone.network_observed,
      zerone_authoritative: value.karma.zerone.authoritative,
      zerone_event_status: value.karma.zerone.event_status,
      zerone_event_refs: value.karma.zerone.event_refs.length,
      kingdom_receipt_status: value.karma.kingdom.receipt_status,
      kingdom_receipt_refs: value.karma.kingdom.receipt_refs.length,
      adapter_exists: value.karma.adapter.exists,
      engagement_is_karma: false,
    },
    safety: value.plain_language.safety,
    boundary: {
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
    },
  };
}

function overview(value: Record<string, any>): string {
  return [value.title, "", ...value.plain_language.short_answer, "", `${value.model_cards.length} bounded models · ${value.analogy_seams.length} lossy analogy seams · ${value.feedback_loops.length} feedback loops · ${value.unknowns.length} open states`, `evidence through ${value.evidence_through} · ${value.integrity.digest}`, "", `Safety: ${value.plain_language.safety}`].join("\n") + "\n";
}
function usage(): never {
  process.stderr.write("usage: form-circulation-return.ts [overview|variants|diffusion|attention|meaning|models|feedback|karma|universe|unknowns|sources] [--json]\n       form-circulation-return.ts verify [FILE] [--json]\n");
  process.exit(2);
}
export async function runFormCirculationReturnCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndex = copy.indexOf("--json");
  const json = jsonIndex >= 0;
  if (json) copy.splice(jsonIndex, 1);
  if (copy.some((arg) => arg.startsWith("-"))) usage();
  if (command === "verify") {
    if (copy.length > 1) usage();
    let issues: FormCirculationReturnIssue[];
    try { issues = verifyFormCirculationReturnAtlas(readUnchecked(copy[0] ? resolve(copy[0]) : FORM_CIRCULATION_RETURN_PATH)); }
    catch (error) { issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }]; }
    if (json) process.stdout.write(`${JSON.stringify({ valid: issues.length === 0, issues })}\n`);
    else if (!issues.length) process.stdout.write("Form, Circulation & Return Atlas: valid pins, planes, models, analogy seams, feedback, KARMA separation, philosophy boundary, unknowns, sources, and semantic digest; JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }
  if (copy.length) usage();
  const value = loadFormCirculationReturnAtlas();
  const diffusion = value.model_cards.filter((card: any) => ["threshold", "branching", "hawkes", "structural-virality"].includes(card.id));
  const attention = {
    models: value.model_cards.filter((card: any) => ["shannon-diversity", "finite-attention", "bounded-feedback-state-space"].includes(card.id)),
    claims: value.evidence_claims.filter((claim: any) => ["finite-attention-network-can-generate-heavy-tails", "collective-attention-can-accelerate-and-shorten", "brainrot-is-contested-vernacular"].includes(claim.id)),
  };
  const selection: Record<string, unknown> = {
    variants: value.cultural_layer,
    diffusion,
    attention,
    meaning: { terms: value.ontology.domain_qualified_terms, labels: value.cultural_layer.vernacular_labels },
    models: value.model_cards,
    feedback: value.feedback_loops,
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
  try { await runFormCirculationReturnCli(); }
  catch (error) { process.stderr.write(`form-circulation-return refused: ${error instanceof Error ? error.message : "invalid input"}\n`); process.exit(1); }
}
