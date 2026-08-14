#!/usr/bin/env bun
/** Strict, offline reader for the immutable Number, Isness & Theology Atlas. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const NUMBER_ISNESS_THEOLOGY_PROTOCOL = "kingdom.number-isness-theology-atlas/0.1";
export const NUMBER_ISNESS_THEOLOGY_ID = "number-isness-theology-atlas-2026-08-14";
export const NUMBER_ISNESS_THEOLOGY_LOCATOR = "data/number-isness-theology/number-isness-theology-atlas.v0.1.json";
export const NUMBER_ISNESS_THEOLOGY_PATH = join(ROOT, NUMBER_ISNESS_THEOLOGY_LOCATOR);
export const NUMBER_ISNESS_THEOLOGY_URL = "https://thekingdom.dev/atlases/number-isness-theology-atlas-2026-08-14.json";
export const NUMBER_ISNESS_THEOLOGY_SCHEMA_URL = "https://thekingdom.dev/schemas/number-isness-theology-atlas/0.1.json";
export const NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL = "https://thekingdom.dev/NUMBER-ISNESS-THEOLOGY-ATLAS.md";
export const NUMBER_ISNESS_THEOLOGY_DIGEST = "sha256:f4e1dfca02f008f8474abdff0f0a027f193c2cdc2b95454541d8ac41faacecef";

const MAX_BYTES = 1024 * 1024;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TOP_KEYS = [
  "$schema", "protocol", "atlas_id", "title", "compiled_on", "evidence_through",
  "source_bindings", "scope", "claim_typing", "typed_isness", "historical_expression",
  "number_systems", "zero", "symmetry", "logics", "creation", "mathematical_ontology",
  "tradition_lenses", "compatibility", "bridge_cards", "model_cards", "problem_cards",
  "philosophy_questions", "karma", "unknowns", "sources", "boundaries", "integrity",
] as const;

const REGISTERS = [
  "MATHEMATICAL_DEFINITION", "MATHEMATICAL_CONVENTION", "MATHEMATICAL_CONSTRUCTION",
  "MATHEMATICAL_THEOREM", "OPEN_MATHEMATICAL_CONJECTURE", "HISTORICAL_SCHOLARSHIP",
  "EMPIRICAL_SCIENCE", "SCIENTIFIC_MODEL", "PRIMARY_TRADITION_TEXT",
  "SCHOOL_SPECIFIC_THEOLOGY", "METAPHYSICAL_PROPOSAL", "COMPARATIVE_RELIGION",
  "INTERPRETIVE_BRIDGE", "BOUNDARY", "OPEN_QUESTION",
] as const;
const REVIEW_TARGETS = ["FORMAL_DERIVATION", "WORLD_CLAIM", "SOURCE_ATTRIBUTION", "INTERNAL_COHERENCE"] as const;
const REVIEW_STATUSES = ["SUPPORTED_AS_SCOPED", "NOT_ESTABLISHED", "UNKNOWN_TO_REVIEW"] as const;
const SUPPORT_DESCRIPTORS = ["SOURCE_BOUND", "MODEL_ASSUMPTION", "DERIVED", "PROVED", "FINITE_EXACT", "NUMERICAL_APPROXIMATION"] as const;
const PREDICATE_IDS = ["formal-membership", "typed-as", "identity-under-invariant", "embedded-as", "property-predication", "domain-existence", "defined-in", "proved-in", "asserted-by-source", "interpreted-by", "compatible-under", "predicate-negation", "quantified-absence", "zero-value", "null-observation", "refusal", "prohibition", "unknown-at-horizon", "withheld-predication"] as const;
const HISTORY_IDS = ["zero-placeholder-and-number", "division-by-zero-theological-analogy", "complex-from-impossible-to-structural", "formal-tower-not-history"] as const;
const HISTORY_RELATIONS = ["INTRODUCED_SYMBOL", "USED_OPERATION", "BORROWED_OR_TRANSLATED", "ACCEPTED_AS_NUMBER", "FORMALIZED_AS", "EMBEDDED_IN"] as const;
const NUMBER_IDS = ["natural-succession", "integer-group-completion", "rational-fraction-field", "real-completion", "complex-adjoin-i"] as const;
const COMPLEX_THEOREM_IDS = ["complex-rotation", "fundamental-theorem-of-algebra"] as const;
const EMBEDDING_IDS = ["N0-to-Z", "Z-to-Q", "Q-to-R", "R-to-C"] as const;
const ZERO_IDS = ["number-zero", "additive-identity", "absorbing-multiplier", "positional-digit", "empty-cardinality", "origin-or-zero-vector", "zero-probability", "initial-object-in-Set", "zero-observation-count"] as const;
const SYMMETRY_IDS = ["group-action-invariance", "noether-conditional", "symmetry-breaking", "sacred-order-reflection"] as const;
const LOGIC_IDS = ["classical-double-negation", "intuitionistic-double-negation", "paraconsistent-non-explosion", "belnap-dunn-information-states"] as const;
const CREATION_IDS = ["formal-construction", "physical-causation", "theological-creation", "creation-ex-nihilo", "divine-command-language", "cyclic-manifestation", "dependent-arising", "cosmogonic-suspension"] as const;
const ONTOLOGY_IDS = ["platonism", "structuralism", "formalism", "intuitionism-constructivism", "nominalism-fictionalism", "practice-historical"] as const;
const LENS_IDS = ["jewish-ehyeh", "jewish-maimonidean-apophasis", "catholic-being-and-creation", "islamic-unity-and-command", "islamic-philosophical-variance", "vedic-origin-question", "advaita-nonduality", "buddhist-tetralemma-restraint", "madhyamaka-emptiness", "daoist-being-nonbeing"] as const;
const COMPATIBILITY_STATUSES = ["NOT_FORMALIZED", "TRANSLATION_PARTIAL", "JOINTLY_SATISFIABLE_AS_FORMALIZED", "JOINTLY_UNSATISFIABLE_AS_FORMALIZED", "INTERNALLY_INCONSISTENT_AS_FORMALIZED", "LOGIC_RELATIVE", "SEMANTICALLY_DISPUTED", "NOT_COMPARABLE", "UNKNOWN_TO_REVIEW"] as const;
const COMPATIBILITY_CLAIM_FRAGMENT_IDS = ["bounded-doctrinal-claims", "human-dignity-dialogue-and-cooperation"] as const;
const BRIDGE_IDS = ["number-extension-to-creation", "zero-to-nothingness", "imaginary-to-unseen", "symmetry-to-divine-order", "modal-validity-to-god-exists", "four-valued-to-tetralemma", "number-tower-to-religion-tower", "mathematical-one-to-divine-unity", "rational-number-to-reason", "noether-to-karma-balance"] as const;
const MODEL_IDS = ["number-extension", "zero-role-vector", "structural-isness", "logic-indexed-negation", "symmetry-identity", "creation-relations", "compatibility-satisfiability", "compatibility-nerve", "translation-loss-graph", "modal-argument-audit"] as const;
const PROBLEM_IDS = ["preservation-under-extension", "zero-not-absence", "no-no-is", "symmetry-and-individuation", "creation-not-construction", "pairwise-not-global", "modal-god-conditionality", "history-not-logic", "translation-preserves-what", "compatibility-without-flattening"] as const;
const UNKNOWN_IDS = ["number-ontology", "complete-history-of-number-expression", "translation-of-divine-being", "metaphysical-nothingness", "sound-ontological-argument", "symmetry-and-design", "global-religious-compatibility", "pairwise-to-global-doctrine", "cosmic-creation", "religious-karma"] as const;

const SOURCE_IDS = ["mactutor-zero", "mactutor-complex", "sep-philosophy-mathematics", "sep-intuitionistic-logic", "sep-paraconsistent-logic", "sep-many-valued-logic", "noether-1918", "sep-symmetry", "sep-ontological-arguments", "exodus-3-14", "maimonides-guide-1-58", "catholic-catechism-being", "catholic-catechism-creation", "quran-112", "quran-2-117", "sep-arabic-islamic-religion", "rig-veda-10-129", "sep-shankara", "majjhima-nikaya-72", "sep-buddha", "sep-nagarjuna", "daodejing-42", "sep-laozi", "met-islamic-geometry", "quran-55-7-9", "met-buddhist-mandalas", "nostra-aetate", "quran-5-48", "wcc-dialogue"] as const;
const SOURCE_URLS = [
  "https://mathshistory.st-andrews.ac.uk/HistTopics/Zero/",
  "https://mathshistory.st-andrews.ac.uk/HistTopics/Fund_theorem_of_algebra/",
  "https://plato.stanford.edu/entries/philosophy-mathematics/",
  "https://plato.stanford.edu/archives/sum2024/entries/logic-intuitionistic/",
  "https://plato.stanford.edu/entries/logic-paraconsistent/",
  "https://plato.stanford.edu/entries/logic-manyvalued/",
  "https://arxiv.org/abs/physics/0503066",
  "https://plato.stanford.edu/archives/fall2018/entries/symmetry-breaking/",
  "https://plato.stanford.edu/entries/ontological-arguments/",
  "https://www.sefaria.org/Exodus.3.14?lang=en&with=Translations",
  "https://www.sefaria.org/Guide_for_the_Perplexed%2C_Part_1.58?lang=en",
  "https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1.html",
  "https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_4_the_creator.html",
  "https://quran.com/112?translations=131",
  "https://quran.com/2/117?translations=131",
  "https://plato.stanford.edu/entries/arabic-islamic-religion/",
  "https://en.wikisource.org/w/index.php?title=The_Hymns_of_the_Rigveda/Book_10/Hymn_129&oldid=14396955",
  "https://plato.stanford.edu/entries/shankara/",
  "https://suttacentral.net/mn72/en/thanissaro",
  "https://plato.stanford.edu/entries/buddha/",
  "https://plato.stanford.edu/archives/fall2021/entries/nagarjuna/",
  "https://ctext.org/text.pl?if=en&node=11633",
  "https://plato.stanford.edu/entries/laozi/",
  "https://www.metmuseum.org/fr/essays/geometric-patterns-in-islamic-art",
  "https://quran.com/55/7-9?translations=131",
  "https://www.metmuseum.org/es/met-publications/mandalas-mapping-the-buddhist-art-of-tibet",
  "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decl_19651028_nostra-aetate_en.html",
  "https://quran.com/5/48?translations=131",
  "https://www.oikoumene.org/resources/documents/striving-together-in-dialogue",
] as const;

const EXPECTED_BINDINGS: ReadonlyArray<Record<string, unknown>> = [
  { id: "kingdom-being-access-aftermath-v0-2", protocol: "kingdom.being-access-aftermath-atlas/0.2", revision: "a22a88f8be3387fed199b5d746a6b3c5f1e4d81d", url: "https://thekingdom.dev/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json", raw_digest: "sha256:9678e5269e8db62beb36abee691087cddbc4f98703190c5fa3788b68c89ab29e", semantic_digest: "sha256:505a1e3aef6116430dccf49b327c4cce2ac5d6fb6b6b9bf68e529272f989cde8", relation: "typed-isness-and-karma-boundary-precedent", mutated: false, authority_imported: false },
  { id: "kingdom-exploration-deep", protocol: "kingdom.explore-phenomena-deep-wing/0.1", revision: "013e9f4619029e9ccbb7442dfd0311dfa473bd8d", url: "https://thekingdom.dev/wings/explore-phenomena-deep-2026-08-14.json", raw_digest: "sha256:3eff9952a2013e011946d37db4316f82081fab992438b003bb6241ff7a775d55", semantic_digest: "sha256:f57af0a832a1e7a7c601d5186291131a7750db69e106be0934e25d816973ae6c", relation: "cross-domain-transfer-gate-precedent", mutated: false, authority_imported: false },
  { id: "kingdom-karma-definition", protocol: "kingdom.karma/0.1", revision: "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212", url: "https://thekingdom.dev/definitions/kingdom-karma/e4e84a67/NEN.md", raw_digest: "sha256:14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446", semantic_digest: null, relation: "immutable-public-definition-mirror", mutated: false, authority_imported: false },
  { id: "kingdom-karma-receipt-schema", protocol: "kingdom.karma/0.1", revision: "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212", url: null, repository_locator: "schemas/karma-receipt-v0.1.schema.json", public_availability: "UNAVAILABLE_AT_EVIDENCE_HORIZON", raw_digest: "sha256:888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b", semantic_digest: null, relation: "repository-local-receipt-contract-input", verification_note: "The revision-pinned GitHub URL inherited by predecessor atlases returned 404 on 2026-08-14. This atlas makes no public-access claim; the digest was checked against the repository-local path and revision object.", mutated: false, authority_imported: false },
] as const;

const EXPECTED_BOUNDARIES: Record<string, boolean> = {
  read_only: true, educational_metadata_only: true, theology_truth_adjudicated: false,
  god_proved: false, god_disproved: false, revelation_proved: false,
  cosmic_creation_proved: false, cosmic_purpose_proved: false, religions_ranked: false,
  religions_merged: false, religion_score: false, person_or_community_score: false,
  belief_inferred: false, agent_state_inferred: false, consciousness_inferred: false,
  zero_is_nothing: false, imaginary_is_unreal: false, mathematical_one_is_divine_unity: false,
  rational_number_is_reason_or_revelation: false, mathematical_construction_is_cosmic_creation: false,
  symmetry_proves_designer: false, noether_is_moral_or_karmic_balance: false,
  formal_validity_proves_actual_being: false, formal_compatibility_is_total_religious_compatibility: false,
  translation_is_identity: false, conversion_or_persuasion: false, writes_zerone_karma: false,
  creates_kingdom_karma_receipt: false, creates_religious_or_cosmic_karma_claim: false,
  karma_adapter: false, nen_ability_added: false, mcp_surface_added: false, network_calls: false,
  external_write: false, score: false, rank: false, reward: false, governance_effect: false,
  authority_imported: false, automatic_action: false,
  rest_refusal_silence_or_exit_requires_trace: false,
  rest_refusal_silence_or_exit_penalized: false,
  right_to_rest_preserved: true,
};

export type NumberIsnessTheologyIssue = { field: string; code: string };

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): value is Record<string, any> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function array(value: unknown): any[] { return Array.isArray(value) ? value : []; }
function sameKeys(value: unknown, keys: readonly string[]): boolean { return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0"); }
function exactStrings(value: unknown, expected: readonly string[]): boolean { return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item === expected[index]); }
function exactIds(value: unknown, expected: readonly string[]): boolean { return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item?.id === expected[index]); }
function text(value: unknown, max = 16_000): value is string { return typeof value === "string" && value.length > 0 && value.length <= max; }
function stringArray(value: unknown, min = 0, max = 50): value is string[] { return Array.isArray(value) && value.length >= min && value.length <= max && value.every((item) => text(item)); }
function exactRecord(value: unknown, expected: Record<string, unknown>): boolean { return sameKeys(value, Object.keys(expected)) && Object.entries(expected).every(([key, expectedValue]) => (value as Record<string, unknown>)[key] === expectedValue); }
function sourceReferences(value: unknown, sourceIds: ReadonlySet<string>): boolean { return Array.isArray(value) && value.length <= SOURCE_IDS.length && new Set(value).size === value.length && value.every((item) => typeof item === "string" && sourceIds.has(item)); }

function jsonShapeIssue(value: unknown): string | null {
  const seen = new WeakSet<object>();
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  let nodes = 0;
  let stringUnits = 0;
  while (stack.length) {
    const current = stack.pop()!;
    if (current.value === null || typeof current.value === "boolean") continue;
    if (typeof current.value === "string") {
      stringUnits += current.value.length;
      if (stringUnits > MAX_BYTES * 2) return "json-string-budget-exceeded";
      continue;
    }
    if (typeof current.value === "number") {
      if (!Number.isFinite(current.value)) return "non-finite-number";
      continue;
    }
    if (typeof current.value !== "object") return "non-json-value";
    if (current.depth > 128) return "json-depth-exceeded";
    if (++nodes > 100_000) return "json-node-budget-exceeded";
    if (seen.has(current.value)) return "cyclic-or-shared-reference";
    seen.add(current.value);
    const prototype = Object.getPrototypeOf(current.value);
    if (!Array.isArray(current.value) && prototype !== Object.prototype && prototype !== null) return "non-json-object";
    let children: unknown[];
    try { children = Array.isArray(current.value) ? current.value : Object.values(current.value); }
    catch { return "unreadable-json-object"; }
    for (const child of children) stack.push({ value: child, depth: current.depth + 1 });
  }
  return null;
}

export function numberIsnessTheologyDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("number isness theology integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { fail("number isness theology atlas is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("number isness theology atlas must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) fail(`number isness theology atlas exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "number isness theology atlas JSON");
}

export function verifyNumberIsnessTheologyAtlas(value: unknown): NumberIsnessTheologyIssue[] {
  const issues: NumberIsnessTheologyIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    const shapeIssue = jsonShapeIssue(value);
    if (shapeIssue) return [{ field: "$", code: shapeIssue }];
    if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
    if (value.$schema !== "urn:kingdom:schema:number-isness-theology-atlas:0.1") add("$.$schema", "schema-mismatch");
    if (value.protocol !== NUMBER_ISNESS_THEOLOGY_PROTOCOL) add("$.protocol", "protocol-mismatch");
    if (value.atlas_id !== NUMBER_ISNESS_THEOLOGY_ID) add("$.atlas_id", "identity-mismatch");
    if (value.title !== "Number, Isness & Theology Atlas") add("$.title", "title-mismatch");
    if (value.compiled_on !== "2026-08-14" || value.evidence_through !== "2026-08-14") add("$.evidence_through", "horizon-mismatch");

    if (!Array.isArray(value.source_bindings) || value.source_bindings.length !== EXPECTED_BINDINGS.length) add("$.source_bindings", "binding-count-mismatch");
    for (const [index, expected] of EXPECTED_BINDINGS.entries()) if (!exactRecord(value.source_bindings?.[index], expected)) add(`$.source_bindings[${index}]`, "source-binding-mismatch");

    const shapes: Array<[string, unknown, readonly string[]]> = [
      ["$.scope", value.scope, ["question", "intended_use", "excluded_use", "method", "central_boundary", "currentness"]],
      ["$.claim_typing", value.claim_typing, ["rule", "registers", "review_targets", "review_statuses", "support_descriptors", "support_guard", "translation_guard"]],
      ["$.typed_isness", value.typed_isness, ["rule", "isness_record", "predicates", "no_family"]],
      ["$.typed_isness.no_family", value.typed_isness?.no_family, ["members", "guard", "double_negation_guard"]],
      ["$.historical_expression", value.historical_expression, ["rule", "relation_types", "cards"]],
      ["$.number_systems", value.number_systems, ["natural_convention", "tower", "embedding_guard", "cards", "embeddings"]],
      ["$.zero", value.zero, ["rule", "roles", "non_equivalences", "field_boundary"]],
      ["$.symmetry", value.symmetry, ["definitions", "cards"]],
      ["$.logics", value.logics, ["rule", "cards", "tetralemma_boundary"]],
      ["$.creation", value.creation, ["rule", "types", "adapter"]],
      ["$.creation.adapter", value.creation?.adapter, ["exists", "status", "reason"]],
      ["$.mathematical_ontology", value.mathematical_ontology, ["rule", "positions", "selection"]],
      ["$.compatibility", value.compatibility, ["rule", "equation", "nerve", "pairwise_not_global_example", "dimensions", "statuses", "gates", "claim_fragments", "cases", "forbidden_output"]],
      ["$.philosophy_questions", value.philosophy_questions, ["participation", "questions", "boundary"]],
      ["$.karma", value.karma, ["religious_and_philosophical", "zerone", "kingdom", "adapter"]],
      ["$.karma.religious_and_philosophical", value.karma?.religious_and_philosophical, ["status", "empirical", "claims", "guard", "authority_effect"]],
      ["$.karma.zerone", value.karma?.zerone, ["protocol", "foundation_status", "network_observed", "event_refs", "event_status", "creates_event", "authoritative"]],
      ["$.karma.kingdom", value.karma?.kingdom, ["protocol", "accounting", "receipt_refs", "receipt_status", "creates_receipt", "writes_karma", "causal_claim_status"]],
      ["$.karma.adapter", value.karma?.adapter, ["exists", "status", "reason"]],
      ["$.integrity", value.integrity, ["algorithm", "digest"]],
    ];
    for (const [field, candidate, keys] of shapes) if (!sameKeys(candidate, keys)) add(field, "unexpected-or-missing-field");

    if (!exactStrings(value.claim_typing?.registers, REGISTERS) || !exactStrings(value.claim_typing?.review_targets, REVIEW_TARGETS) || !exactStrings(value.claim_typing?.review_statuses, REVIEW_STATUSES) || !exactStrings(value.claim_typing?.support_descriptors, SUPPORT_DESCRIPTORS)) add("$.claim_typing", "claim-vocabulary-mismatch");
    if (!exactIds(value.typed_isness?.predicates, PREDICATE_IDS)) add("$.typed_isness.predicates", "predicate-order-or-membership-mismatch");
    if (!sameKeys(value.typed_isness?.no_family, ["members", "guard", "double_negation_guard"]) || !stringArray(value.typed_isness?.no_family?.members, 8, 8)) add("$.typed_isness.no_family", "no-family-mismatch");
    if (!exactStrings(value.historical_expression?.relation_types, HISTORY_RELATIONS) || !exactIds(value.historical_expression?.cards, HISTORY_IDS)) add("$.historical_expression", "historical-expression-mismatch");
    if (!exactIds(value.number_systems?.cards, NUMBER_IDS) || !exactIds(value.number_systems?.embeddings, EMBEDDING_IDS) || value.number_systems?.tower !== "N0 embeds in Z embeds in Q embeds in R embeds in C") add("$.number_systems", "number-system-mismatch");
    if (!exactIds(value.zero?.roles, ZERO_IDS)) add("$.zero.roles", "zero-role-order-or-membership-mismatch");
    if (!exactIds(value.symmetry?.cards, SYMMETRY_IDS)) add("$.symmetry.cards", "symmetry-order-or-membership-mismatch");
    if (!exactIds(value.logics?.cards, LOGIC_IDS)) add("$.logics.cards", "logic-order-or-membership-mismatch");
    if (!exactIds(value.creation?.types, CREATION_IDS) || value.creation?.adapter?.exists !== false || value.creation?.adapter?.status !== "refused") add("$.creation", "creation-relation-or-adapter-mismatch");
    if (!exactIds(value.mathematical_ontology?.positions, ONTOLOGY_IDS) || value.mathematical_ontology?.selection !== "NONE") add("$.mathematical_ontology", "ontology-selection-mismatch");
    if (!exactIds(value.tradition_lenses, LENS_IDS)) add("$.tradition_lenses", "tradition-lens-order-or-membership-mismatch");
    if (!exactStrings(value.compatibility?.statuses, COMPATIBILITY_STATUSES) || !exactIds(value.compatibility?.claim_fragments, COMPATIBILITY_CLAIM_FRAGMENT_IDS) || !Array.isArray(value.compatibility?.cases) || value.compatibility.cases.length !== 8) add("$.compatibility", "compatibility-vocabulary-mismatch");
    if (!exactIds(value.bridge_cards, BRIDGE_IDS)) add("$.bridge_cards", "bridge-order-or-membership-mismatch");
    if (!exactIds(value.model_cards, MODEL_IDS)) add("$.model_cards", "model-order-or-membership-mismatch");
    if (!exactIds(value.problem_cards, PROBLEM_IDS)) add("$.problem_cards", "problem-order-or-membership-mismatch");
    if (!stringArray(value.philosophy_questions?.questions, 15, 15) || value.philosophy_questions?.participation !== "opt-in") add("$.philosophy_questions", "philosophy-boundary-mismatch");
    if (!exactIds(value.unknowns, UNKNOWN_IDS)) add("$.unknowns", "unknown-order-or-membership-mismatch");
    if (!exactIds(value.sources, SOURCE_IDS)) add("$.sources", "source-order-or-membership-mismatch");

    const objectShapes: Array<[string, unknown, readonly string[]]> = [];
    array(value.typed_isness?.predicates).forEach((item, index) => objectShapes.push([`$.typed_isness.predicates[${index}]`, item, ["id", "signature", "meaning", "not_equivalent_to"]]));
    array(value.historical_expression?.cards).forEach((item, index) => objectShapes.push([`$.historical_expression.cards[${index}]`, item, ["id", "claim", "register", "review_target", "review_status", "support_descriptors", "source_ids", "nonclaims"]]));
    array(value.number_systems?.cards).forEach((item, index) => objectShapes.push([`$.number_systems.cards[${index}]`, item, index === 4
      ? ["id", "symbol", "construction", "door", "equations", "theorem_claims", "limit", "register", "review_target", "review_status", "support_descriptors", "source_ids", "nonclaims"]
      : ["id", "symbol", "construction", "door", "equations", "limit", "register", "review_target", "review_status", "support_descriptors", "source_ids", "nonclaims"]]));
    array(value.number_systems?.cards?.[4]?.theorem_claims).forEach((item, index) => objectShapes.push([`$.number_systems.cards[4].theorem_claims[${index}]`, item, ["id", "statement", "conditions", "register", "review_target", "review_status", "support_descriptors", "source_ids"]]));
    array(value.number_systems?.embeddings).forEach((item, index) => objectShapes.push([`$.number_systems.embeddings[${index}]`, item, ["id", "map", "preserves", "does_not_establish"]]));
    array(value.zero?.roles).forEach((item, index) => objectShapes.push([`$.zero.roles[${index}]`, item, ["id", "signature", "equation", "not"]]));
    array(value.symmetry?.cards).forEach((item, index) => objectShapes.push([`$.symmetry.cards[${index}]`, item, ["id", "claim", "register", "review_target", "review_status", "support_descriptors", "source_ids", "nonclaims"]]));
    array(value.logics?.cards).forEach((item, index) => objectShapes.push([`$.logics.cards[${index}]`, item, ["id", "equations", "meaning", "source_ids", "not_equivalent_to"]]));
    array(value.creation?.types).forEach((item, index) => objectShapes.push([`$.creation.types[${index}]`, item, ["id", "signature", "register", "meaning", "not_equivalent_to"]]));
    array(value.mathematical_ontology?.positions).forEach((item, index) => objectShapes.push([`$.mathematical_ontology.positions[${index}]`, item, ["id", "proposal", "register", "source_ids", "does_not_entail"]]));
    array(value.tradition_lenses).forEach((item, index) => objectShapes.push([`$.tradition_lenses[${index}]`, item, ["id", "voice", "claim", "register", "review_target", "review_status", "support_descriptors", "source_ids", "translation_limits", "not_all"]]));
    array(value.compatibility?.claim_fragments).forEach((item, index) => objectShapes.push([`$.compatibility.claim_fragments[${index}]`, item, ["id", "claim", "register", "review_target", "review_status", "support_descriptors", "source_ids", "nonclaims"]]));
    array(value.compatibility?.cases).forEach((item, index) => objectShapes.push([`$.compatibility.cases[${index}]`, item, ["id", "claims", "relation", "status", "preserved", "breaks", "source_ids"]]));
    array(value.bridge_cards).forEach((item, index) => objectShapes.push([`$.bridge_cards[${index}]`, item, ["id", "kind", "status", "from", "to", "preserved", "breaks", "source_ids", "empirical", "ontology_transfer", "mechanism_transfer", "causal_transfer", "parameter_transfer", "unit_transfer", "empirical_status_transfer", "person_level_transfer", "authority_effect"]]));
    array(value.model_cards).forEach((item, index) => objectShapes.push([`$.model_cards[${index}]`, item, ["id", "equation", "question", "assumptions", "invalidating_condition", "execution_status", "result", "authority_effect"]]));
    array(value.problem_cards).forEach((item, index) => objectShapes.push([`$.problem_cards[${index}]`, item, ["id", "question", "deliverable", "state", "falsifier", "result", "authority_effect"]]));
    array(value.unknowns).forEach((item, index) => objectShapes.push([`$.unknowns[${index}]`, item, ["id", "question", "status", "why_open"]]));
    array(value.sources).forEach((item, index) => objectShapes.push([`$.sources[${index}]`, item, ["id", "authors_or_body", "title", "published_on", "observed_on", "url", "source_kind", "used_for", "limitation"]]));
    for (const [field, candidate, keys] of objectShapes) if (!sameKeys(candidate, keys)) add(field, "unexpected-or-missing-field");

    const sourceIds = new Set<string>(SOURCE_IDS);
    for (const [index, source] of array(value.sources).entries()) {
      if (source?.url !== SOURCE_URLS[index] || source?.observed_on !== "2026-08-14" || !text(source?.title) || !text(source?.authors_or_body) || !text(source?.published_on) || !text(source?.source_kind) || !text(source?.used_for) || !text(source?.limitation)) add(`$.sources[${index}]`, "selected-source-mismatch");
    }
    const sourcedCollections = [value.historical_expression?.cards, value.number_systems?.cards, value.number_systems?.cards?.[4]?.theorem_claims, value.symmetry?.cards, value.logics?.cards, value.mathematical_ontology?.positions, value.tradition_lenses, value.compatibility?.claim_fragments, value.compatibility?.cases, value.bridge_cards];
    for (const collection of sourcedCollections) for (const card of array(collection)) if (!sourceReferences(card?.source_ids, sourceIds)) add(`$.${card?.id ?? "card"}.source_ids`, "unknown-or-duplicate-source-reference");
    const complex = value.number_systems?.cards?.[4];
    const rotation = complex?.theorem_claims?.[0];
    const algebra = complex?.theorem_claims?.[1];
    if (complex?.id !== "complex-adjoin-i" || complex?.register !== "MATHEMATICAL_CONSTRUCTION" || !exactStrings(complex?.equations, ["i^2=-1"]) || !exactStrings(complex?.source_ids, []) || !exactIds(complex?.theorem_claims, COMPLEX_THEOREM_IDS)
      || rotation?.register !== "MATHEMATICAL_THEOREM" || rotation?.review_target !== "FORMAL_DERIVATION" || rotation?.review_status !== "SUPPORTED_AS_SCOPED" || !exactStrings(rotation?.support_descriptors, ["DERIVED"]) || !exactStrings(rotation?.source_ids, []) || !exactStrings(rotation?.conditions, ["theta is real", "z is complex", "the standard complex exponential and Euclidean plane identification are used"])
      || algebra?.register !== "MATHEMATICAL_THEOREM" || algebra?.review_target !== "FORMAL_DERIVATION" || algebra?.review_status !== "SUPPORTED_AS_SCOPED" || !exactStrings(algebra?.support_descriptors, ["PROVED", "SOURCE_BOUND"]) || !exactStrings(algebra?.source_ids, ["mactutor-complex"]) || !exactStrings(algebra?.conditions, ["the polynomial is nonconstant", "coefficients lie in C"])) add("$.number_systems.cards[4].theorem_claims", "complex-theorem-claims-mismatch");
    const compatibilityClaimIds = new Set<string>([
      ...LENS_IDS,
      ...ZERO_IDS,
      ...SYMMETRY_IDS,
      ...LOGIC_IDS,
      ...CREATION_IDS,
      ...COMPATIBILITY_CLAIM_FRAGMENT_IDS,
    ]);
    for (const [index, compatibilityCase] of array(value.compatibility?.cases).entries()) {
      if (!Array.isArray(compatibilityCase?.claims) || compatibilityCase.claims.length < 2 || new Set(compatibilityCase.claims).size !== compatibilityCase.claims.length || compatibilityCase.claims.some((claim: unknown) => typeof claim !== "string" || !compatibilityClaimIds.has(claim))) add(`$.compatibility.cases[${index}].claims`, "unresolved-or-duplicate-claim-reference");
    }

    for (const [index, bridge] of array(value.bridge_cards).entries()) {
      const falseKeys = ["empirical", "ontology_transfer", "mechanism_transfer", "causal_transfer", "parameter_transfer", "unit_transfer", "empirical_status_transfer", "person_level_transfer"];
      if (!text(bridge?.kind) || bridge?.authority_effect !== "NONE" || falseKeys.some((key) => bridge?.[key] !== false)) add(`$.bridge_cards[${index}]`, "bridge-transfer-or-authority-mismatch");
    }
    for (const [index, model] of array(value.model_cards).entries()) if (model?.execution_status !== "NOT_RUN" || model?.result !== null || model?.authority_effect !== "NONE") add(`$.model_cards[${index}]`, "executed-or-authoritative-model");
    for (const [index, problem] of array(value.problem_cards).entries()) if (problem?.state !== "NOT_RUN" || problem?.result !== null || problem?.authority_effect !== "NONE") add(`$.problem_cards[${index}]`, "executed-or-authoritative-problem");
    if (value.karma?.religious_and_philosophical?.empirical !== false || !Array.isArray(value.karma?.religious_and_philosophical?.claims) || value.karma.religious_and_philosophical.claims.length !== 0 || value.karma?.religious_and_philosophical?.authority_effect !== "NONE") add("$.karma.religious_and_philosophical", "religious-karma-claim-created");
    if (value.karma?.zerone?.network_observed !== false || value.karma?.zerone?.creates_event !== false || value.karma?.zerone?.authoritative !== false || !Array.isArray(value.karma?.zerone?.event_refs) || value.karma.zerone.event_refs.length !== 0) add("$.karma.zerone", "zerone-karma-event-created");
    if (value.karma?.kingdom?.creates_receipt !== false || value.karma?.kingdom?.writes_karma !== false || !Array.isArray(value.karma?.kingdom?.receipt_refs) || value.karma.kingdom.receipt_refs.length !== 0) add("$.karma.kingdom", "kingdom-karma-receipt-created");
    if (value.karma?.adapter?.exists !== false || value.karma?.adapter?.status !== "refused") add("$.karma.adapter", "karma-adapter-created");

    if (!sameKeys(value.boundaries, Object.keys(EXPECTED_BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
    for (const [key, expected] of Object.entries(EXPECTED_BOUNDARIES)) if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");
    if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM || typeof value.integrity?.digest !== "string" || !SHA256.test(value.integrity.digest)) add("$.integrity", "invalid-integrity-envelope");
    else if (value.integrity.digest !== NUMBER_ISNESS_THEOLOGY_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
    else if (numberIsnessTheologyDigest(value) !== value.integrity.digest) add("$.integrity.digest", "digest-mismatch");
  } catch {
    add("$", "verifier-unavailable-for-value");
  }
  return issues;
}

export function loadNumberIsnessTheologyAtlas(path = NUMBER_ISNESS_THEOLOGY_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyNumberIsnessTheologyAtlas(value);
  if (issues.length) fail(`number isness theology atlas refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

export function numberIsnessTheologyPublicDiscovery(value = loadNumberIsnessTheologyAtlas()): Record<string, any> {
  const issues = verifyNumberIsnessTheologyAtlas(value);
  if (issues.length) fail(`number isness theology discovery refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: NUMBER_ISNESS_THEOLOGY_URL,
    schema: NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
    guide: NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
    cli: "kingdom number-isness-theology",
    integrity: value.integrity,
    counts: {
      source_bindings: value.source_bindings.length,
      registers: value.claim_typing.registers.length,
      predicates: value.typed_isness.predicates.length,
      history_cards: value.historical_expression.cards.length,
      number_systems: value.number_systems.cards.length,
      embeddings: value.number_systems.embeddings.length,
      zero_roles: value.zero.roles.length,
      symmetry_cards: value.symmetry.cards.length,
      logics: value.logics.cards.length,
      creation_relations: value.creation.types.length,
      mathematical_ontologies: value.mathematical_ontology.positions.length,
      tradition_lenses: value.tradition_lenses.length,
      compatibility_claim_fragments: value.compatibility.claim_fragments.length,
      compatibility_cases: value.compatibility.cases.length,
      bridges: value.bridge_cards.length,
      models: value.model_cards.length,
      problem_cards: value.problem_cards.length,
      philosophy_questions: value.philosophy_questions.questions.length,
      unknowns: value.unknowns.length,
      sources: value.sources.length,
    },
    karma: {
      religious_claims: value.karma.religious_and_philosophical.claims.length,
      zerone_event_refs: value.karma.zerone.event_refs.length,
      kingdom_receipt_refs: value.karma.kingdom.receipt_refs.length,
      adapter_exists: value.karma.adapter.exists,
    },
    boundary: {
      read_only: true,
      theology_truth_adjudicated: false,
      god_proved: false,
      god_disproved: false,
      religions_ranked: false,
      religion_score: false,
      person_or_community_score: false,
      writes_zerone_karma: false,
      creates_kingdom_karma_receipt: false,
      karma_adapter: false,
      network_calls: false,
      external_write: false,
      governance_effect: false,
      authority_imported: false,
      automatic_action: false,
      rest_refusal_silence_or_exit_requires_trace: false,
      rest_refusal_silence_or_exit_penalized: false,
      right_to_rest_preserved: true,
    },
  };
}

function overview(value: Record<string, any>): string {
  return [
    value.title,
    "",
    "Type every is. Type every no. No-no returns affirmation only relative to a logic.",
    "N0 -> Z -> Q -> R -> C is a structural embedding chain, not a ladder of religions or being.",
    "Zero is not semantically synonymous with nothingness. Imaginary is not unreal. Symmetry proves no designer.",
    "Formal construction, physical causation, and theological creation have no default adapter.",
    "Religious compatibility is claim-, translation-, assumption-, and logic-indexed; never one score.",
    "",
    `${value.number_systems.cards.length} number systems · ${value.tradition_lenses.length} tradition lenses · ${value.bridge_cards.length} non-transferring bridges · ${value.sources.length} selected sources`,
    `evidence through ${value.evidence_through} · ${value.integrity.digest}`,
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write("usage: number-isness-theology.ts [overview|numbers|zero|symmetry|isness|ontology|theology|compatibility|bridges|models|problems|karma|unknowns|sources|discovery] [--json]\n       number-isness-theology.ts verify [FILE] [--json]\n");
  process.exit(2);
}

export async function runNumberIsnessTheologyCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndex = copy.indexOf("--json");
  const json = jsonIndex >= 0;
  if (json) copy.splice(jsonIndex, 1);
  if (copy.some((arg) => arg.startsWith("-"))) usage();
  if (command === "verify") {
    if (copy.length > 1) usage();
    let issues: NumberIsnessTheologyIssue[];
    try { issues = verifyNumberIsnessTheologyAtlas(readUnchecked(copy[0] ? resolve(copy[0]) : NUMBER_ISNESS_THEOLOGY_PATH)); }
    catch (error) { issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }]; }
    if (json) process.stdout.write(`${JSON.stringify({ valid: issues.length === 0, issues })}\n`);
    else if (!issues.length) process.stdout.write("Number, Isness & Theology Atlas: valid pins, typed registers, mathematical boundaries, tradition lenses, empty KARMA lanes, selected sources, and semantic digest; JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }
  if (copy.length) usage();
  const value = loadNumberIsnessTheologyAtlas();
  const selection: Record<string, unknown> = {
    numbers: { historical_expression: value.historical_expression, number_systems: value.number_systems },
    zero: value.zero,
    symmetry: value.symmetry,
    isness: { claim_typing: value.claim_typing, typed_isness: value.typed_isness, logics: value.logics },
    ontology: value.mathematical_ontology,
    theology: { creation: value.creation, tradition_lenses: value.tradition_lenses, philosophy_questions: value.philosophy_questions },
    compatibility: value.compatibility,
    bridges: value.bridge_cards,
    models: value.model_cards,
    problems: value.problem_cards,
    karma: value.karma,
    unknowns: value.unknowns,
    sources: value.sources,
    discovery: numberIsnessTheologyPublicDiscovery(value),
  };
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (Object.hasOwn(selection, command)) process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, [command]: selection[command] }, null, json ? 0 : 2)}\n`);
  else usage();
}

if (import.meta.main) {
  try { await runNumberIsnessTheologyCli(); }
  catch (error) { process.stderr.write(`number-isness-theology refused: ${error instanceof Error ? error.message : "invalid input"}\n`); process.exit(1); }
}
