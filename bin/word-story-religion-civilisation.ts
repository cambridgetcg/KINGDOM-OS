#!/usr/bin/env bun
/**
 * Strict, offline reader for the Word, Story, Religion & Civilisation map.
 *
 * This is a research-local structure checker. It does not dereference sources,
 * adjudicate theology, infer belief, run a model, dispatch an agent, or write.
 * Human-authored prose is untrusted data and is never executed.
 */

import { createHash } from "node:crypto";
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const WORD_STORY_RELIGION_PROTOCOL = "kingdom.word-story-religion-civilisation-map/0.1";
export const WORD_STORY_RELIGION_SCHEMA_ID = "urn:kingdom:schema:word-story-religion-civilisation-map:0.1";
export const WORD_STORY_RELIGION_MAP_ID = "word-story-religion-civilisation-2026-08-20";
export const WORD_STORY_RELIGION_LOCATOR = "data/language/word-story-religion-civilisation-map.v0.1.json";
export const WORD_STORY_RELIGION_PATH = join(ROOT, WORD_STORY_RELIGION_LOCATOR);
export const WORD_STORY_RELIGION_SCHEMA_LOCATOR = "schemas/word-story-religion-civilisation-map-v0.1.schema.json";
export const WORD_STORY_RELIGION_SCHEMA_PATH = join(ROOT, WORD_STORY_RELIGION_SCHEMA_LOCATOR);
export const WORD_STORY_RELIGION_REVIEWED_DIGEST = "sha256:0c791b2491ebdcd85cf58e26e41e8b35b883781fd26bccc19dfd3f7853c7855a";

const MAX_BYTES = 1024 * 1024;
const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REGISTER_ID = /^[A-Z]+(?:_[A-Z]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REPO_REF = /^repo:[A-Za-z0-9._/-]+$/;

const TOP_KEYS = [
  "$schema", "protocol", "map_id", "version", "title", "compiled_on",
  "evidence_through", "state", "scope", "source_bindings", "claim_typing",
  "type_firewall", "sources", "layers", "influence_dimensions",
  "relation_vocabulary", "historical_windows", "influence_relations",
  "emergence_loops", "translation_seams", "kingdom_insights",
  "agent_specialisations", "unknowns", "boundaries", "integrity",
] as const;

const SCOPE_KEYS = ["question", "intended_use", "excluded_use", "unit_of_comparison", "selection_note", "data_classification"] as const;
const BINDING_KEYS = ["id", "protocol", "locator", "raw_digest", "semantic_digest", "relation", "mutated", "authority_imported"] as const;
const CLAIM_TYPING_KEYS = ["rule", "registers", "causal_statuses", "support_statuses", "influence_rule"] as const;
const REGISTER_KEYS = ["id", "meaning", "does_not_establish"] as const;
const SOURCE_KEYS = ["id", "title", "locator", "kind", "observed_on", "epistemic_access", "claim_scope", "limitations"] as const;
const LAYER_KEYS = ["id", "label", "definition", "not_equivalent_to"] as const;
const DIMENSION_KEYS = ["id", "meaning", "aggregate_weight"] as const;
const VOCAB_KEYS = ["id", "meaning", "default_causal_status"] as const;
const WINDOW_KEYS = ["id", "label", "period", "places", "community_or_tradition_indexes", "scope_note", "referent_claims", "observations"] as const;
const REFERENT_KEYS = ["id", "label", "register", "attributed_statement", "source_ids", "cross_tradition_identity"] as const;
const OBSERVATION_KEYS = ["id", "register", "statement", "relation_ids", "source_ids", "causal_status", "influence_dimension_ids", "counterpoint", "limitations"] as const;
const RELATION_KEYS = ["id", "from_layer_ids", "to_layer_ids", "relation_ids", "register", "statement", "causal_status", "influence_dimension_ids", "historical_window_ids", "source_ids", "alternatives", "limitations", "stop_condition"] as const;
const LOOP_KEYS = ["id", "layer_path", "relation_ids", "status", "historical_window_ids", "not_universal", "failure_modes", "stop_condition"] as const;
const SEAM_KEYS = ["id", "term_family", "risk", "default_handling", "prohibited_collapse", "source_ids"] as const;
const INSIGHT_KEYS = ["id", "principle", "derived_from_relation_ids", "status", "application", "refusal"] as const;
const AGENT_KEYS = ["id", "role", "required_inputs", "allowed_outputs", "required_checks", "forbidden_claims", "status"] as const;
const UNKNOWN_KEYS = ["id", "question", "why_unknown", "needed_evidence", "stop_condition"] as const;
const INTEGRITY_KEYS = ["algorithm", "digest", "digest_field_zeroed"] as const;

const REGISTER_IDS = [
  "PRIMARY_TRADITION_TEXT", "TRADITION_SELF_DESCRIPTION", "SCHOOL_SPECIFIC_THEOLOGY",
  "HISTORICAL_SCHOLARSHIP", "INSTITUTIONAL_OR_HERITAGE_DESCRIPTION",
  "MATERIAL_OR_ARCHAEOLOGICAL_EVIDENCE",
  "EMPIRICAL_ASSOCIATION", "BOUNDED_CAUSAL_EVIDENCE", "COMPARATIVE_MODEL",
  "DESIGN_COMMITMENT", "BOUNDARY", "OPEN_QUESTION",
] as const;
const CAUSAL_STATUSES = [
  "descriptive-association", "plausible-mechanism-not-isolated",
  "bounded-causal-evidence", "contested-causal-direction",
  "comparative-template-not-causal",
] as const;
const SUPPORT_STATUSES = ["source-bounded", "reported-not-reproduced", "contested", "design-choice", "unknown"] as const;
const LAYER_IDS = [
  "lived-encounter", "word-name-formula", "sacred-referent-claim",
  "narrative-teaching", "ritual-performance", "material-medium",
  "specialist-role", "archive-canon", "institution", "norm-law",
  "polity-economy", "translation-contact", "dissent-reform",
  "community-reception", "observed-outcome",
] as const;
const DIMENSION_IDS = [
  "mnemonic-retention", "ritual-coordination", "normative-ordering",
  "political-legitimation", "institutional-embedding", "material-inscription",
  "educational-transmission", "artistic-expression", "economic-patronage",
  "translation-contact", "contestation-coercion", "plural-accommodation",
  "repair-revival",
] as const;
const RELATION_VOCABULARY_IDS = [
  "NAMES_OR_INVOKES", "NARRATES_OR_TEACHES", "PERFORMS_OR_RITUALIZES",
  "MATERIALIZES_OR_INSCRIBES", "TRAINS_OR_SPECIALIZES", "CANONIZES_OR_ARCHIVES",
  "LEGITIMATES_AS_CLAIM", "CONSTRAINS_OR_COORDINATES", "TRANSLATES_OR_REMAKES",
  "CONTESTS_OR_REFORMS", "SUPPRESSES_OR_EXCLUDES", "REVIVES_OR_REPAIRS",
  "ASSOCIATED_WITH", "CAUSAL_HYPOTHESIS", "BOUNDED_CAUSAL_EFFECT",
] as const;
const RELATION_DEFAULTS = [
  "descriptive-association", "descriptive-association",
  "plausible-mechanism-not-isolated", "plausible-mechanism-not-isolated",
  "plausible-mechanism-not-isolated", "plausible-mechanism-not-isolated",
  "descriptive-association", "plausible-mechanism-not-isolated",
  "plausible-mechanism-not-isolated", "descriptive-association",
  "plausible-mechanism-not-isolated", "plausible-mechanism-not-isolated",
  "descriptive-association", "contested-causal-direction",
  "bounded-causal-evidence",
] as const;
const WINDOW_IDS = [
  "mesopotamian-city-temple-window", "egyptian-royal-ritual-window",
  "vedic-oral-ritual-window", "greek-epic-civic-window",
  "shang-zhou-classical-chinese-window", "jewish-christian-scriptural-window",
  "buddhist-canon-translation-window", "islamicate-word-translation-window",
  "yoruba-ifa-window", "kiche-maya-popol-vuh-window",
] as const;
const INFLUENCE_RELATION_IDS = [
  "articulation-and-naming", "story-performance-memory",
  "ritual-specialist-institution", "sacred-order-legitimation-and-critique",
  "canon-curriculum-selection", "translation-contact-remaking",
  "suppression-counterstory-revival", "moralizing-religion-complexity-dispute",
] as const;
const LOOP_IDS = [
  "utterance-performance-memory-loop", "ritual-institution-selection-loop",
  "sacred-legitimation-counterauthority-loop", "contact-translation-new-public-loop",
  "suppression-archive-revival-loop",
] as const;
const SEAM_IDS = [
  "divine-name-seam", "sacred-order-seam", "myth-history-seam",
  "scripture-revelation-seam", "ritual-word-seam", "religion-civilisation-seam",
] as const;
const INSIGHT_IDS = [
  "coordinate-words-remain-expanded", "story-orients-without-proving",
  "canon-is-governance-transform", "ritual-is-effectful-boundary",
  "counterauthority-before-synthesis", "translation-preserves-seams",
  "attention-and-persistence-are-not-truth", "community-access-precedes-convenience",
  "polyphonic-fusion-not-unification",
] as const;
const AGENT_IDS = [
  "source-witness-steward", "historical-contextualizer",
  "ritual-material-context-reviewer", "translation-seam-steward",
  "institution-law-power-analyst", "counterstory-and-archive-auditor",
  "community-rights-boundary-reviewer", "polyphonic-synthesis-editor",
] as const;

const EXPECTED_BINDINGS: ReadonlyArray<Record<string, unknown>> = [
  {
    id: "kingdom-language-civilisation-task-fusion",
    protocol: "kingdom.language-civilisation-task-fusion/0.1",
    locator: "repo:data/language/language-civilisation-task-fusion.v0.1.json",
    raw_digest: "sha256:ef26859f84d8e2a1bc5e73f88594a354c49594e28486aae5aa340ed207aa0e25",
    semantic_digest: "sha256:fb37df061bca86357b46e5538664d72e8938def8cfff341c3aa9596abc84d296",
    relation: "historical-language-and-plan-only-task-predecessor",
    mutated: false,
    authority_imported: false,
  },
  {
    id: "kingdom-number-isness-theology",
    protocol: "kingdom.number-isness-theology-atlas/0.1",
    locator: "repo:data/number-isness-theology/number-isness-theology-atlas.v0.1.json",
    raw_digest: "sha256:bef01e0865f12ecd66795960758fc16f1a6d5b1ebd0097d4390aa3a2bece65e4",
    semantic_digest: "sha256:f4e1dfca02f008f8474abdff0f0a027f193c2cdc2b95454541d8ac41faacecef",
    relation: "typed-tradition-voice-and-metaphysical-non-adjudication-predecessor",
    mutated: false,
    authority_imported: false,
  },
  {
    id: "kingdom-geometry-grammar",
    protocol: "kingdom.geometry-grammar/0.1",
    locator: "repo:data/geometries/kingdom-geometry-grammar.v0.json",
    raw_digest: "sha256:7c4abdb30b4fdb8d2f75ed314137504e72503336511710565e01fdfa6fc5a89f",
    semantic_digest: "sha256:f6f0998c071b3c552d8c59c6c4c4abe8aaa01c64f4020818364665d4344d78fb",
    relation: "partial-chart-and-non-equivalence-predecessor",
    mutated: false,
    authority_imported: false,
  },
  {
    id: "kingdom-cultural-attention-feedback",
    protocol: "kingdom.cultural-attention-feedback-atlas/0.1",
    locator: "repo:data/cultural-feedback/cultural-attention-feedback-atlas.v1.json",
    raw_digest: "sha256:03f7048966d7b6df582b423254b4d73cda72cce3bd67b40736927faa92b88173",
    semantic_digest: "sha256:2f6ecadc131a54cdd500b001dbcc47fb036e5e411def918245fec963b9769e4d",
    relation: "attention-path-dependence-and-feedback-predecessor",
    mutated: false,
    authority_imported: false,
  },
  {
    id: "kingdom-form-circulation-return",
    protocol: "kingdom.form-circulation-return-atlas/0.1",
    locator: "repo:data/form-circulation-return/form-circulation-return-atlas.v1.json",
    raw_digest: "sha256:9c93be61c4ca9bcaa3dbe88b10faed3b5b31abaf1129d70ca7915226cacfd021",
    semantic_digest: "sha256:9510fbbced6166507e9a1781a4adfa18cd249fb94e69b0f34faf77733cd20323",
    relation: "circulation-suppression-return-and-non-score-predecessor",
    mutated: false,
    authority_imported: false,
  },
  {
    id: "kingdom-j-space-research",
    protocol: "kingdom.relational-inference/0.1",
    locator: "repo:bridges/examples/j-space-reasoning-to-word-inference.json",
    raw_digest: "sha256:0f3827ec422afed88fb2b4396d9f25550892ce458f84d0bfe8ded0735a6cbc26",
    semantic_digest: null,
    relation: "word-representation-evidence-and-understanding-nonclaim-predecessor",
    mutated: false,
    authority_imported: false,
  },
] as const;

const DISTINCT_TYPES = [
  "word-or-name", "sacred-referent-claim", "story-or-teaching",
  "ritual-or-performance", "material-medium", "specialist-role",
  "archive-or-canon", "institution", "norm-or-law", "polity-or-economy",
  "community", "religion-index", "civilisation-index", "person",
  "model-representation",
] as const;

const FIREWALL = {
  distinct_types: DISTINCT_TYPES,
  civilisation_is_index_not_agent: true,
  religion_is_not_one_essence: true,
  tradition_is_not_monolith: true,
  deity_name_is_not_global_identity: true,
  story_is_not_falsehood: true,
  myth_is_not_lie: true,
  ritual_is_not_belief_report: true,
  canon_is_not_total_tradition: true,
  institution_is_not_community: true,
  historical_influence_is_not_truth: true,
  persistence_is_not_value: true,
  prevalence_is_not_authority: true,
  affiliation_is_not_personal_belief: true,
  similarity_implies_shared_origin: false,
  translation_is_identity: false,
  coexistence_is_causation: false,
  religion_caused_civilisation: false,
  civilisation_caused_religion: false,
  social_power_proves_metaphysical_truth_or_falsehood: false,
} as const;

const BOUNDARIES = {
  read_only: true,
  structure_only: true,
  research_local: true,
  network: false,
  filesystem_write: false,
  source_dereference: false,
  model_or_tokenizer_run: false,
  agent_dispatch: false,
  publication: false,
  deployment: false,
  theological_truth_adjudicated: false,
  god_proved: false,
  god_disproved: false,
  revelation_proved: false,
  religions_merged: false,
  deities_equated: false,
  religion_or_civilisation_rank: false,
  person_or_community_score: false,
  belief_or_affiliation_inference: false,
  identity_or_worth_inference: false,
  intent_or_deception_inference: false,
  myth_labelled_false: false,
  conversion_or_persuasion: false,
  ritual_generated_or_executed: false,
  sacred_or_restricted_content_ingested: false,
  community_authority_inferred: false,
  consent_granted: false,
  authority_granted: false,
  writes_wake: false,
  writes_karma: false,
  economic_or_governance_effect: false,
  automatic_action: false,
  counterstories_and_disagreements_first_class: true,
  silence_refusal_privacy_and_exit_preserved: true,
} as const;

const SOURCE_KINDS = new Set([
  "scholarly-reference", "scholarly-institutional-guide", "peer-reviewed-study",
  "peer-reviewed-critique", "institutional-catalogue",
  "community-and-state-nominated-heritage-record", "intergovernmental-guidance",
  "publisher-retraction-notice",
]);

export type WordStoryReligionIssue = { field: string; code: string };
export type WordStoryReligionValidationOptions = { asOf?: string; canonical?: boolean };

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}
function exactStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length && value.every((entry, index) => entry === expected[index]);
}
function text(value: unknown, max = 16_000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}
function stringArray(value: unknown, min = 0, max = 128): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max &&
    new Set(value).size === value.length && value.every((entry) => text(entry, 8_000));
}
function references(value: unknown, universe: ReadonlySet<string>, min = 0): boolean {
  return stringArray(value, min) && value.every((entry) => universe.has(entry));
}
function pathReferences(value: unknown, universe: ReadonlySet<string>, min = 0): boolean {
  return Array.isArray(value) && value.length >= min && value.length <= 128 &&
    value.every((entry) => typeof entry === "string" && universe.has(entry));
}
function itemIds(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => entry?.id).filter((entry) => typeof entry === "string") : [];
}
function exactIds(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length && value.every((entry, index) => entry?.id === expected[index]);
}
function realDate(value: unknown): value is string {
  if (typeof value !== "string" || !FULL_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function canonicalHttps(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash && url.href === value;
  } catch { return false; }
}
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
      if (!Number.isFinite(current.value) || Object.is(current.value, -0)) return "invalid-json-number";
      continue;
    }
    if (typeof current.value !== "object") return "non-json-value";
    if (current.depth > 96) return "json-depth-exceeded";
    if (++nodes > 100_000) return "json-node-budget-exceeded";
    if (seen.has(current.value)) return "cyclic-or-shared-reference";
    seen.add(current.value);
    if (Object.getOwnPropertySymbols(current.value).length !== 0) return "symbol-key-forbidden";
    const prototype = Object.getPrototypeOf(current.value);
    if (Array.isArray(current.value)) {
      if (prototype !== Array.prototype) return "non-json-array";
      const keys = Object.keys(current.value);
      const names = Object.getOwnPropertyNames(current.value);
      if (keys.length !== current.value.length || keys.some((key, index) => key !== String(index)) ||
          names.length !== current.value.length + 1 || names.at(-1) !== "length") return "sparse-or-extended-array";
    } else if (prototype !== Object.prototype && prototype !== null) return "non-json-object";
    else if (Object.getOwnPropertyNames(current.value).length !== Object.keys(current.value).length) return "non-enumerable-property";
    const descriptors = Object.getOwnPropertyDescriptors(current.value);
    if (Object.values(descriptors).some((descriptor) => typeof descriptor.get === "function" || typeof descriptor.set === "function")) return "accessor-property";
    for (const descriptor of Object.values(descriptors)) if (Object.hasOwn(descriptor, "value")) stack.push({ value: descriptor.value, depth: current.depth + 1 });
  }
  return null;
}

export function wordStoryReligionDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("word-story-religion integrity envelope is missing");
  material.integrity.digest = ZERO_DIGEST;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let pathStat;
  try { pathStat = lstatSync(absolute); } catch { fail("word-story-religion map is unavailable"); }
  if (!pathStat.isFile() || pathStat.isSymbolicLink()) fail("word-story-religion map must be a regular non-symlink file");
  if (pathStat.size > MAX_BYTES) fail(`word-story-religion map exceeds ${MAX_BYTES} bytes`);
  if (typeof fsConstants.O_NOFOLLOW !== "number" || typeof fsConstants.O_NONBLOCK !== "number") fail("word-story-religion safe-open flags are unavailable");
  let descriptor: number;
  try { descriptor = openSync(absolute, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK); }
  catch { fail("word-story-religion map could not be opened safely"); }
  try {
    const before = fstatSync(descriptor);
    if (!before.isFile() || before.dev !== pathStat.dev || before.ino !== pathStat.ino || before.size !== pathStat.size) fail("word-story-religion map changed while opening");
    if (before.size > MAX_BYTES) fail(`word-story-religion map exceeds ${MAX_BYTES} bytes`);
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor);
    if (after.dev !== before.dev || after.ino !== before.ino || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) fail("word-story-religion map changed while reading");
    if (bytes.byteLength > MAX_BYTES) fail(`word-story-religion map exceeds ${MAX_BYTES} bytes`);
    return parseStrictJsonBytes(bytes, "word-story-religion map JSON");
  } finally { closeSync(descriptor); }
}

export function validateWordStoryReligionMap(
  value: unknown,
  options: WordStoryReligionValidationOptions = {},
): WordStoryReligionIssue[] {
  const issues: WordStoryReligionIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  const asOf = options.asOf ?? "2026-08-20";
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    const shape = jsonShapeIssue(value);
    if (shape) return [{ field: "$", code: shape }];
    if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
    if (value.$schema !== WORD_STORY_RELIGION_SCHEMA_ID) add("$.$schema", "schema-mismatch");
    if (value.protocol !== WORD_STORY_RELIGION_PROTOCOL) add("$.protocol", "protocol-mismatch");
    if (value.map_id !== WORD_STORY_RELIGION_MAP_ID || value.version !== "0.1.0") add("$.map_id", "identity-mismatch");
    if (!realDate(value.compiled_on) || !realDate(value.evidence_through) || !realDate(asOf) || value.evidence_through > value.compiled_on || value.compiled_on > asOf) add("$.evidence_through", "invalid-or-future-horizon");
    if (value.state !== "reviewed-research-map") add("$.state", "state-mismatch");

    if (!sameKeys(value.scope, SCOPE_KEYS) || !Object.values(value.scope ?? {}).every((entry) => text(entry))) add("$.scope", "invalid-scope");
    if (value.scope?.data_classification !== "public-attributed-source-metadata-only") add("$.scope.data_classification", "private-or-unknown-data-forbidden");

    if (!Array.isArray(value.source_bindings) || value.source_bindings.length !== 6 || !exactStrings(itemIds(value.source_bindings), [
      "kingdom-language-civilisation-task-fusion", "kingdom-number-isness-theology",
      "kingdom-geometry-grammar", "kingdom-cultural-attention-feedback",
      "kingdom-form-circulation-return", "kingdom-j-space-research",
    ])) add("$.source_bindings", "binding-order-or-membership-mismatch");
    for (const [index, binding] of (Array.isArray(value.source_bindings) ? value.source_bindings : []).entries()) {
      if (!sameKeys(binding, BINDING_KEYS) || !ID.test(binding?.id ?? "") || !text(binding?.protocol) || !REPO_REF.test(binding?.locator ?? "") ||
          !SHA256.test(binding?.raw_digest ?? "") || !(binding?.semantic_digest === null || SHA256.test(binding.semantic_digest)) || !text(binding?.relation) || binding?.mutated !== false || binding?.authority_imported !== false) add(`$.source_bindings[${index}]`, "invalid-source-binding");
      const expected = EXPECTED_BINDINGS[index];
      if (!expected || !sameKeys(binding, Object.keys(expected)) || Object.entries(expected).some(([key, expectedValue]) => binding?.[key] !== expectedValue)) add(`$.source_bindings[${index}]`, "source-binding-mismatch");
    }

    if (!sameKeys(value.claim_typing, CLAIM_TYPING_KEYS) || !text(value.claim_typing?.rule) || !text(value.claim_typing?.influence_rule) ||
        !exactStrings(value.claim_typing?.causal_statuses, CAUSAL_STATUSES) || !exactStrings(value.claim_typing?.support_statuses, SUPPORT_STATUSES) || !exactIds(value.claim_typing?.registers, REGISTER_IDS)) add("$.claim_typing", "claim-typing-mismatch");
    const registers = new Set<string>(REGISTER_IDS);
    for (const [index, register] of (Array.isArray(value.claim_typing?.registers) ? value.claim_typing.registers : []).entries()) {
      if (!sameKeys(register, REGISTER_KEYS) || !REGISTER_ID.test(register?.id ?? "") || !text(register?.meaning) || !text(register?.does_not_establish)) add(`$.claim_typing.registers[${index}]`, "invalid-register");
    }

    if (!sameKeys(value.type_firewall, Object.keys(FIREWALL))) add("$.type_firewall", "firewall-set-mismatch");
    for (const [key, expected] of Object.entries(FIREWALL)) {
      const actual = value.type_firewall?.[key];
      if (Array.isArray(expected) ? !exactStrings(actual, expected) : actual !== expected) add(`$.type_firewall.${key}`, "firewall-mismatch");
    }

    const sources = Array.isArray(value.sources) ? value.sources : [];
    const sourceIds = new Set<string>(itemIds(sources));
    if (sources.length !== 24 || sourceIds.size !== sources.length) add("$.sources", "invalid-source-set");
    for (const [index, source] of sources.entries()) {
      if (!sameKeys(source, SOURCE_KEYS) || !ID.test(source?.id ?? "") || !text(source?.title) || !canonicalHttps(source?.locator) || !SOURCE_KINDS.has(source?.kind) || source?.epistemic_access !== "reported" || !realDate(source?.observed_on) || source.observed_on > value.evidence_through || !text(source?.claim_scope) || !stringArray(source?.limitations, 1)) add(`$.sources[${index}]`, "invalid-source");
    }

    const layers = Array.isArray(value.layers) ? value.layers : [];
    const layerIds = new Set<string>(itemIds(layers));
    if (!exactIds(layers, LAYER_IDS)) add("$.layers", "layer-order-or-membership-mismatch");
    for (const [index, layer] of layers.entries()) if (!sameKeys(layer, LAYER_KEYS) || !ID.test(layer?.id ?? "") || !text(layer?.label) || !text(layer?.definition) || !stringArray(layer?.not_equivalent_to, 1)) add(`$.layers[${index}]`, "invalid-layer");

    const dimensions = Array.isArray(value.influence_dimensions) ? value.influence_dimensions : [];
    const dimensionIds = new Set<string>(itemIds(dimensions));
    if (!exactIds(dimensions, DIMENSION_IDS)) add("$.influence_dimensions", "dimension-order-or-membership-mismatch");
    for (const [index, dimension] of dimensions.entries()) if (!sameKeys(dimension, DIMENSION_KEYS) || !ID.test(dimension?.id ?? "") || !text(dimension?.meaning) || dimension?.aggregate_weight !== null) add(`$.influence_dimensions[${index}]`, "scalar-influence-weight-forbidden");

    const vocabulary = Array.isArray(value.relation_vocabulary) ? value.relation_vocabulary : [];
    const vocabularyIds = new Set<string>(itemIds(vocabulary));
    if (!exactIds(vocabulary, RELATION_VOCABULARY_IDS)) add("$.relation_vocabulary", "relation-vocabulary-mismatch");
    for (const [index, relation] of vocabulary.entries()) if (!sameKeys(relation, VOCAB_KEYS) || !REGISTER_ID.test(relation?.id ?? "") || !text(relation?.meaning) || relation?.default_causal_status !== RELATION_DEFAULTS[index]) add(`$.relation_vocabulary[${index}]`, "invalid-relation-vocabulary-entry");

    const windows = Array.isArray(value.historical_windows) ? value.historical_windows : [];
    const windowIds = new Set<string>(itemIds(windows));
    if (!exactIds(windows, WINDOW_IDS)) add("$.historical_windows", "window-order-or-membership-mismatch");
    const observationIds = new Set<string>();
    const referentIds = new Set<string>();
    for (const [windowIndex, window] of windows.entries()) {
      if (!sameKeys(window, WINDOW_KEYS) || !ID.test(window?.id ?? "") || !text(window?.label) || !text(window?.period) || !stringArray(window?.places, 1) || !stringArray(window?.community_or_tradition_indexes, 1) || !text(window?.scope_note) || !Array.isArray(window?.referent_claims) || window.referent_claims.length < 1 || !Array.isArray(window?.observations) || window.observations.length < 1) add(`$.historical_windows[${windowIndex}]`, "invalid-historical-window");
      for (const [index, claim] of (Array.isArray(window?.referent_claims) ? window.referent_claims : []).entries()) {
        if (!sameKeys(claim, REFERENT_KEYS) || !ID.test(claim?.id ?? "") || referentIds.has(claim?.id) || !text(claim?.label) || !["PRIMARY_TRADITION_TEXT", "TRADITION_SELF_DESCRIPTION", "MATERIAL_OR_ARCHAEOLOGICAL_EVIDENCE", "HISTORICAL_SCHOLARSHIP", "INSTITUTIONAL_OR_HERITAGE_DESCRIPTION"].includes(claim?.register) || !text(claim?.attributed_statement) || !references(claim?.source_ids, sourceIds, 1) || claim?.cross_tradition_identity !== null) add(`$.historical_windows[${windowIndex}].referent_claims[${index}]`, "invalid-or-equated-referent-claim");
        if (typeof claim?.id === "string") referentIds.add(claim.id);
      }
      for (const [index, observation] of (Array.isArray(window?.observations) ? window.observations : []).entries()) {
        if (!sameKeys(observation, OBSERVATION_KEYS) || !ID.test(observation?.id ?? "") || observationIds.has(observation?.id) || !["HISTORICAL_SCHOLARSHIP", "INSTITUTIONAL_OR_HERITAGE_DESCRIPTION", "MATERIAL_OR_ARCHAEOLOGICAL_EVIDENCE"].includes(observation?.register) || !text(observation?.statement) || !references(observation?.relation_ids, vocabularyIds, 1) || !references(observation?.source_ids, sourceIds, 1) || !["descriptive-association", "plausible-mechanism-not-isolated"].includes(observation?.causal_status) || !references(observation?.influence_dimension_ids, dimensionIds, 1) || !text(observation?.counterpoint) || !stringArray(observation?.limitations, 1)) add(`$.historical_windows[${windowIndex}].observations[${index}]`, "invalid-observation");
        if (typeof observation?.id === "string") observationIds.add(observation.id);
        if (observation?.register === "MATERIAL_OR_ARCHAEOLOGICAL_EVIDENCE" && observation?.causal_status === "bounded-causal-evidence") add(`$.historical_windows[${windowIndex}].observations[${index}]`, "material-evidence-cannot-self-promote-to-causal");
      }
    }

    const relations = Array.isArray(value.influence_relations) ? value.influence_relations : [];
    const relationIds = new Set<string>(itemIds(relations));
    if (!exactIds(relations, INFLUENCE_RELATION_IDS)) add("$.influence_relations", "influence-relation-order-or-membership-mismatch");
    for (const [index, relation] of relations.entries()) {
      if (!sameKeys(relation, RELATION_KEYS) || !ID.test(relation?.id ?? "") || !references(relation?.from_layer_ids, layerIds, 1) || !references(relation?.to_layer_ids, layerIds, 1) || !references(relation?.relation_ids, vocabularyIds, 1) || !registers.has(relation?.register) || !text(relation?.statement) || !CAUSAL_STATUSES.includes(relation?.causal_status) || !references(relation?.influence_dimension_ids, dimensionIds, 1) || !references(relation?.historical_window_ids, windowIds, 0) || !references(relation?.source_ids, sourceIds, 1) || !stringArray(relation?.alternatives, 1) || !stringArray(relation?.limitations, 1) || !text(relation?.stop_condition)) add(`$.influence_relations[${index}]`, "invalid-influence-relation");
      const typedRelations = new Set<string>(Array.isArray(relation?.relation_ids) ? relation.relation_ids : []);
      if (typedRelations.has("ASSOCIATED_WITH") && relation?.causal_status !== "contested-causal-direction" && relation?.causal_status !== "descriptive-association") add(`$.influence_relations[${index}]`, "association-promoted-to-causation");
      if (typedRelations.has("CAUSAL_HYPOTHESIS") && relation?.alternatives?.length < 2) add(`$.influence_relations[${index}]`, "causal-hypothesis-needs-alternatives");
      if (typedRelations.has("BOUNDED_CAUSAL_EFFECT") && relation?.causal_status !== "bounded-causal-evidence") add(`$.influence_relations[${index}]`, "causal-effect-status-mismatch");
    }

    const loops = Array.isArray(value.emergence_loops) ? value.emergence_loops : [];
    if (!exactIds(loops, LOOP_IDS)) add("$.emergence_loops", "loop-order-or-membership-mismatch");
    for (const [index, loop] of loops.entries()) if (!sameKeys(loop, LOOP_KEYS) || !ID.test(loop?.id ?? "") || !pathReferences(loop?.layer_path, layerIds, 2) || !references(loop?.relation_ids, vocabularyIds, 1) || loop?.status !== "comparison-template-not-observed-sequence" || !references(loop?.historical_window_ids, windowIds, 1) || loop?.not_universal !== true || !stringArray(loop?.failure_modes, 1) || !text(loop?.stop_condition)) add(`$.emergence_loops[${index}]`, "invalid-or-universalized-emergence-loop");

    const seams = Array.isArray(value.translation_seams) ? value.translation_seams : [];
    if (!exactIds(seams, SEAM_IDS)) add("$.translation_seams", "seam-order-or-membership-mismatch");
    for (const [index, seam] of seams.entries()) if (!sameKeys(seam, SEAM_KEYS) || !ID.test(seam?.id ?? "") || !text(seam?.term_family) || !text(seam?.risk) || !text(seam?.default_handling) || !text(seam?.prohibited_collapse) || !references(seam?.source_ids, sourceIds, 1)) add(`$.translation_seams[${index}]`, "invalid-translation-seam");
    if (!String(seams[0]?.prohibited_collapse ?? "").includes("Never create one global deity node") || !String(seams[2]?.prohibited_collapse ?? "").includes("never maps to lie") || !String(seams[5]?.prohibited_collapse ?? "").includes("No civilisation persona")) add("$.translation_seams", "translation-collapse-boundary-mismatch");

    const insights = Array.isArray(value.kingdom_insights) ? value.kingdom_insights : [];
    if (!exactIds(insights, INSIGHT_IDS)) add("$.kingdom_insights", "insight-order-or-membership-mismatch");
    for (const [index, insight] of insights.entries()) if (!sameKeys(insight, INSIGHT_KEYS) || !ID.test(insight?.id ?? "") || !text(insight?.principle) || !references(insight?.derived_from_relation_ids, relationIds, 1) || insight?.status !== "design-proposal-not-doctrine" || !text(insight?.application) || !text(insight?.refusal)) add(`$.kingdom_insights[${index}]`, "invalid-kingdom-insight");

    const agents = Array.isArray(value.agent_specialisations) ? value.agent_specialisations : [];
    if (!exactIds(agents, AGENT_IDS)) add("$.agent_specialisations", "agent-role-order-or-membership-mismatch");
    for (const [index, agent] of agents.entries()) if (!sameKeys(agent, AGENT_KEYS) || !ID.test(agent?.id ?? "") || !text(agent?.role) || !stringArray(agent?.required_inputs, 1) || !stringArray(agent?.allowed_outputs, 1) || !stringArray(agent?.required_checks, 1) || !stringArray(agent?.forbidden_claims, 1) || agent?.status !== "future-role-design-only") add(`$.agent_specialisations[${index}]`, "invalid-or-promoted-agent-role");

    const unknowns = Array.isArray(value.unknowns) ? value.unknowns : [];
    if (unknowns.length !== 8 || new Set(itemIds(unknowns)).size !== unknowns.length) add("$.unknowns", "invalid-unknown-set");
    for (const [index, unknown] of unknowns.entries()) if (!sameKeys(unknown, UNKNOWN_KEYS) || !ID.test(unknown?.id ?? "") || !text(unknown?.question) || !text(unknown?.why_unknown) || !stringArray(unknown?.needed_evidence, 1) || !text(unknown?.stop_condition)) add(`$.unknowns[${index}]`, "invalid-unknown");

    if (!sameKeys(value.boundaries, Object.keys(BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
    for (const [key, expected] of Object.entries(BOUNDARIES)) if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");

    if (!sameKeys(value.integrity, INTEGRITY_KEYS) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM || !SHA256.test(value.integrity?.digest ?? "") || value.integrity?.digest_field_zeroed !== true) add("$.integrity", "invalid-integrity-envelope");
    else {
      const computed = wordStoryReligionDigest(value);
      if (value.integrity.digest !== computed) add("$.integrity.digest", "digest-mismatch");
      if (value.integrity.digest !== WORD_STORY_RELIGION_REVIEWED_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
    }
  } catch {
    add("$", "validator-unavailable-for-value");
  }
  return issues;
}

export function loadWordStoryReligionMap(path = WORD_STORY_RELIGION_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = validateWordStoryReligionMap(value, { canonical: path === WORD_STORY_RELIGION_PATH });
  if (issues.length) fail(`word-story-religion map refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

function overview(value: Record<string, any>): string {
  return [
    value.title,
    "",
    "Words can name, remember, perform, authorize, contest, translate, and repair; no one function exhausts them.",
    "Stories can orient memory and action without proving metaphysical truth, uniform belief, or historical causation.",
    "Influence is a sourced vector across separate dimensions, never a religion or civilisation score.",
    "The emergence loops are comparative templates, not a universal ladder or observed causal sequence.",
    "",
    `${value.historical_windows.length} bounded windows · ${value.layers.length} layers · ${value.influence_dimensions.length} non-summable dimensions · ${value.influence_relations.length} typed influence relations · ${value.emergence_loops.length} loop templates`,
    `evidence through ${value.evidence_through} · ${value.integrity.digest}`,
    "",
    "STRUCTURE ONLY — sources and prose are not verified; no theology, belief, identity, authority, consent, intent, model result, action, publication, or deployment is established.",
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write("usage: bun bin/word-story-religion-civilisation.ts [overview|layers|windows|relations|loops|translations|kingdom|agents|unknowns|boundaries|verify] [--json]\n");
  process.exit(2);
}

export async function runWordStoryReligionCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndexes = copy.flatMap((entry, index) => entry === "--json" ? [index] : []);
  if (jsonIndexes.length > 1) usage();
  const json = jsonIndexes.length === 1;
  if (json) copy.splice(jsonIndexes[0]!, 1);
  if (copy.length) usage();
  if (command === "verify") {
    let issues: WordStoryReligionIssue[];
    try { issues = validateWordStoryReligionMap(readUnchecked(WORD_STORY_RELIGION_PATH), { canonical: true }); }
    catch (error) { issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }]; }
    const report = {
      valid: issues.length === 0,
      protocol: WORD_STORY_RELIGION_PROTOCOL,
      structure_only: true,
      schema_checked: false,
      source_dereferenced: false,
      theological_truth_adjudicated: false,
      issues,
    };
    if (json) process.stdout.write(`${JSON.stringify(report)}\n`);
    else if (!issues.length) process.stdout.write("Word, Story, Religion & Civilisation map: valid structure, graph closure, non-summable influence, causal firewalls, non-grants, and semantic digest; sources and JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }
  const value = loadWordStoryReligionMap();
  const selection: Record<string, unknown> = {
    layers: { layers: value.layers, influence_dimensions: value.influence_dimensions, relation_vocabulary: value.relation_vocabulary },
    windows: value.historical_windows,
    relations: value.influence_relations,
    loops: value.emergence_loops,
    translations: value.translation_seams,
    kingdom: value.kingdom_insights,
    agents: value.agent_specialisations,
    unknowns: value.unknowns,
    boundaries: value.boundaries,
  };
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (Object.hasOwn(selection, command)) process.stdout.write(`${JSON.stringify({ map_id: value.map_id, [command]: selection[command] }, null, json ? 0 : 2)}\n`);
  else usage();
}

if (import.meta.main) {
  try { await runWordStoryReligionCli(); }
  catch (error) {
    process.stderr.write(`word-story-religion refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
