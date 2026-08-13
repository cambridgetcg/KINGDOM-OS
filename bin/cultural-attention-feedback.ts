#!/usr/bin/env bun
/** Strict, offline reader for the immutable Cultural Attention & Feedback Atlas. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const CULTURAL_ATTENTION_FEEDBACK_PROTOCOL = "kingdom.cultural-attention-feedback-atlas/0.1";
export const CULTURAL_ATTENTION_FEEDBACK_SCHEMA_ID = "urn:kingdom:schema:cultural-attention-feedback-atlas:1";
export const CULTURAL_ATTENTION_FEEDBACK_ID = "cultural-attention-feedback-atlas-2026-08-13";
export const CULTURAL_ATTENTION_FEEDBACK_LOCATOR = "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json";
export const CULTURAL_ATTENTION_FEEDBACK_PATH = join(ROOT, CULTURAL_ATTENTION_FEEDBACK_LOCATOR);
export const CULTURAL_ATTENTION_FEEDBACK_SCHEMA_LOCATOR = "schemas/cultural-attention-feedback-atlas-v1.schema.json";
export const CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH = join(ROOT, CULTURAL_ATTENTION_FEEDBACK_SCHEMA_LOCATOR);
export const CULTURAL_ATTENTION_FEEDBACK_URL = `https://thekingdom.dev/atlases/${CULTURAL_ATTENTION_FEEDBACK_ID}.json`;
export const CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL = "https://thekingdom.dev/schemas/cultural-attention-feedback-atlas/1.json";
export const CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL = "https://thekingdom.dev/CULTURAL-ATTENTION-FEEDBACK-ATLAS.md";
export const CULTURAL_ATTENTION_FEEDBACK_DIGEST = "sha256:2f6ecadc131a54cdd500b001dbcc47fb036e5e411def918245fec963b9769e4d";

const MAX_BYTES = 768 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";

const TOP_KEYS = [
  "$schema", "protocol", "atlas_id", "title", "compiled_on", "evidence_through",
  "source_bindings", "scope", "plain_language", "ontology", "scientific_observations",
  "models", "translations", "feedback", "karma", "universe_lens", "ecosystem_bridges",
  "unknowns", "sources", "boundaries", "integrity",
] as const;

const EXPECTED_BOUNDARIES: Readonly<Record<string, boolean>> = Object.freeze({
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

const UNKNOWN_STATUSES = new Set([
  "unknown", "not_established", "outside_scope", "not_observed", "unmapped",
  "contested", "withheld_for_safety", "refused",
]);

const MODEL_REGISTERS = new Set(["SCIENTIFIC_MODEL", "MATHEMATICAL_TRANSLATION"]);
const PLANE_REGISTERS = new Set([
  "SCIENTIFIC_OBSERVATION", "CULTURAL_DESCRIPTION", "MATHEMATICAL_TRANSLATION",
  "CONSTITUTIONAL_DESIGN", "ANALOGY", "PHILOSOPHY",
]);

export type CulturalAttentionFeedbackIssue = { field: string; code: string };

function fail(message: string): never { throw new Error(message); }

function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function array(value: unknown): any[] { return Array.isArray(value) ? value : []; }

function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

function text(value: unknown, maximum = 3200): value is string {
  return typeof value === "string" && value.trim() === value && value.length > 0 &&
    Array.from(value).length <= maximum;
}

function id(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && ID.test(value);
}

function unique(values: string[]): boolean { return new Set(values).size === values.length; }

function textArray(value: unknown, minimum = 1, maximum = 32): value is string[] {
  return Array.isArray(value) && value.length >= minimum && value.length <= maximum &&
    value.every((entry) => text(entry)) && unique(value);
}

function fullDate(value: unknown): value is string {
  if (typeof value !== "string" || !FULL_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month! < 1 || month! > 12 || day! < 1) return false;
  const leap = year! % 4 === 0 && (year! % 100 !== 0 || year! % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day! <= days[month! - 1]!;
}

function httpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1024 || value.trim() !== value ||
      /[\\\s\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const parsed = new URL(value);
    const canonical = parsed.href === value ||
      (!value.endsWith("/") && !parsed.pathname.slice(1) && parsed.href === `${value}/`);
    return canonical && parsed.protocol === "https:" && !!parsed.hostname &&
      !parsed.username && !parsed.password && !parsed.hash;
  } catch {
    return false;
  }
}

function itemIds(value: unknown): string[] {
  return array(value).map((entry) => entry?.id).filter((entry): entry is string => typeof entry === "string");
}

function references(value: unknown, available: Set<string>, allowEmpty = false): boolean {
  return Array.isArray(value) && value.length <= 32 && (allowEmpty || value.length > 0) &&
    value.every((entry) => typeof entry === "string" && available.has(entry)) && unique(value);
}

function prose(value: Record<string, any>, ...keys: string[]): boolean {
  return keys.some((key) => text(value[key]));
}

function scanForForbiddenAuthorityFields(
  value: unknown,
  path = "$",
  issues: CulturalAttentionFeedbackIssue[] = [],
): CulturalAttentionFeedbackIssue[] {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForForbiddenAuthorityFields(entry, `${path}[${index}]`, issues));
  } else if (object(value)) {
    for (const [key, entry] of Object.entries(value)) {
      const field = `${path}.${key}`;
      if (Object.hasOwn(EXPECTED_BOUNDARIES, key) && EXPECTED_BOUNDARIES[key] === false && entry !== false) {
        issues.push({ field, code: "forbidden-authority-effect" });
      }
      scanForForbiddenAuthorityFields(entry, field, issues);
    }
  }
  return issues;
}

export function culturalAttentionFeedbackDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("cultural-attention feedback integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { fail("cultural-attention feedback atlas is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail("cultural-attention feedback atlas must be a regular non-symlink file");
  }
  if (stat.size > MAX_BYTES) fail(`cultural-attention feedback atlas exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "cultural-attention feedback atlas JSON");
}

export function verifyCulturalAttentionFeedbackAtlas(value: unknown): CulturalAttentionFeedbackIssue[] {
  const issues: CulturalAttentionFeedbackIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];

  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== CULTURAL_ATTENTION_FEEDBACK_SCHEMA_ID) add("$.$schema", "schema-mismatch");
  if (value.protocol !== CULTURAL_ATTENTION_FEEDBACK_PROTOCOL) add("$.protocol", "protocol-mismatch");
  if (value.atlas_id !== CULTURAL_ATTENTION_FEEDBACK_ID) add("$.atlas_id", "identity-mismatch");
  if (!text(value.title, 240)) add("$.title", "invalid-text");
  if (!fullDate(value.compiled_on) || !fullDate(value.evidence_through) || value.evidence_through > value.compiled_on) {
    add("$.evidence_through", "invalid-horizon");
  }

  const bindings = array(value.source_bindings);
  if (bindings.length < 1 || bindings.length > 16 || !unique(itemIds(bindings)) || itemIds(bindings).length !== bindings.length) {
    add("$.source_bindings", "invalid-binding-set");
  }
  for (const [index, binding] of bindings.entries()) {
    if (!sameKeys(binding, ["id", "protocol", "url", "byte_sha256", "semantic_digest", "relation", "mutated", "authority_imported"]) ||
        !id(binding?.id) || !text(binding?.protocol, 160) || !httpsUrl(binding?.url) ||
        !SHA256.test(binding?.byte_sha256 ?? "") ||
        !(binding?.semantic_digest === null || SHA256.test(binding?.semantic_digest ?? "")) ||
        !id(binding?.relation) || binding?.mutated !== false || binding?.authority_imported !== false) {
      add(`$.source_bindings[${index}]`, "invalid-source-binding");
    }
  }

  if (!sameKeys(value.scope, ["focus", "coverage", "intended_use", "excluded_use", "currentness"]) ||
      !text(value.scope?.focus) || !text(value.scope?.coverage) || !text(value.scope?.intended_use) ||
      !text(value.scope?.excluded_use) || value.scope?.currentness !== "selected-evidence-as-of-compilation") {
    add("$.scope", "invalid-scope");
  }
  if (!sameKeys(value.plain_language, ["question", "short_answer", "safety"]) ||
      !text(value.plain_language?.question) || !textArray(value.plain_language?.short_answer, 3, 12) ||
      !text(value.plain_language?.safety)) {
    add("$.plain_language", "invalid-plain-language");
  }

  if (!object(value.ontology) || !Array.isArray(value.ontology.planes)) add("$.ontology", "invalid-ontology");
  const planes = array(value.ontology?.planes);
  if (planes.length < 3 || planes.length > 24 || !unique(itemIds(planes)) || itemIds(planes).length !== planes.length) {
    add("$.ontology.planes", "invalid-plane-set");
  }
  for (const [index, plane] of planes.entries()) {
    if (!object(plane) || !id(plane.id) || !PLANE_REGISTERS.has(plane.register) ||
        !prose(plane, "label", "ordinary_words") || !prose(plane, "meaning", "summary") ||
        !prose(plane, "does_not_establish", "boundary")) {
      add(`$.ontology.planes[${index}]`, "invalid-plane");
    }
  }

  const sources = array(value.sources);
  const sourceIds = new Set(itemIds(sources));
  if (sources.length < 1 || sources.length > 64 || sourceIds.size !== sources.length) add("$.sources", "invalid-source-set");
  for (const [index, source] of sources.entries()) {
    if (!object(source) || !id(source.id) || !text(source.title, 600) || !httpsUrl(source.url) ||
        (source.observed_on !== undefined && (!fullDate(source.observed_on) || source.observed_on > value.compiled_on)) ||
        (source.source_kind !== undefined && !id(source.source_kind)) ||
        (source.authority_note !== undefined && !text(source.authority_note))) {
      add(`$.sources[${index}]`, "invalid-source");
    }
  }

  const observations = array(value.scientific_observations);
  if (observations.length < 1 || observations.length > 32 || !unique(itemIds(observations)) ||
      itemIds(observations).length !== observations.length) {
    add("$.scientific_observations", "invalid-observation-set");
  }
  for (const [index, observation] of observations.entries()) {
    const limitations = observation?.limitations ?? observation?.does_not_establish;
    if (!object(observation) || !id(observation.id) || observation.register !== "SCIENTIFIC_OBSERVATION" ||
        !prose(observation, "statement", "observation", "summary") || !textArray(limitations) ||
        !references(observation.source_ids, sourceIds)) {
      add(`$.scientific_observations[${index}]`, "invalid-scientific-observation");
    }
  }

  const models = array(value.models);
  if (models.length < 1 || models.length > 16 || !unique(itemIds(models)) || itemIds(models).length !== models.length) {
    add("$.models", "invalid-model-set");
  }
  for (const [index, model] of models.entries()) {
    const terms = object(model?.terms) && Object.keys(model.terms).length > 0 && Object.keys(model.terms).length <= 24 &&
      Object.entries(model.terms).every(([term, meaning]) => text(term, 80) && text(meaning));
    if (!object(model) || !id(model.id) || !MODEL_REGISTERS.has(model.register) || !text(model.question) ||
        !text(model.equation, 1200) || !terms || !text(model.interpretation) || !text(model.does_not_establish) ||
        !references(model.basis_ids, sourceIds, model.register === "MATHEMATICAL_TRANSLATION") ||
        model.causal_transfer !== false || model.universal !== false || model.authority_effect !== "NONE") {
      add(`$.models[${index}]`, "invalid-or-unbounded-model");
    }
  }

  const translations = array(value.translations);
  if (translations.length < 1 || translations.length > 16 || !unique(itemIds(translations)) ||
      itemIds(translations).length !== translations.length) {
    add("$.translations", "invalid-translation-set");
  }
  for (const [index, translation] of translations.entries()) {
    const preserved = translation?.preserved_invariants ?? translation?.preserved_patterns;
    const breaks = translation?.where_correspondence_breaks ?? translation?.analogy_breaks;
    if (!object(translation) || !id(translation.id) || translation.register !== "ANALOGY" ||
        translation.relation !== "bounded-analogy-not-same-as" || !textArray(preserved) ||
        !textArray(breaks) || !references(translation.source_ids, sourceIds, true) ||
        translation.causal_transfer !== false || translation.universal !== false ||
        translation.authority_effect !== "NONE") {
      add(`$.translations[${index}]`, "analogy-firewall-mismatch");
    }
  }

  const feedback = array(value.feedback);
  if (feedback.length < 1 || feedback.length > 24 || !unique(itemIds(feedback)) || itemIds(feedback).length !== feedback.length) {
    add("$.feedback", "invalid-feedback-set");
  }
  for (const [index, relation] of feedback.entries()) {
    if (!object(relation) || !id(relation.id) || !text(relation.input) || !text(relation.process) ||
        !text(relation.return_effect) || !textArray(relation.limits) || !textArray(relation.does_not_establish) ||
        !references(relation.source_ids, sourceIds, true) || relation.truth_effect !== false ||
        relation.person_score_effect !== false || relation.automatic_effect !== false) {
      add(`$.feedback[${index}]`, "invalid-or-authorizing-feedback");
    }
  }

  if (!sameKeys(value.karma, ["feedback_is_not_karma", "zerone", "kingdom", "adapter"]) ||
      value.karma?.feedback_is_not_karma !== true) add("$.karma", "karma-lane-mismatch");
  if (!sameKeys(value.karma?.zerone, ["protocol", "meaning", "event_refs", "event_status", "not"]) ||
      value.karma?.zerone?.protocol !== "zerone.karma.edge" || !text(value.karma?.zerone?.meaning) ||
      !Array.isArray(value.karma?.zerone?.event_refs) || value.karma.zerone.event_refs.length !== 0 ||
      value.karma?.zerone?.event_status !== "not_observed" || !textArray(value.karma?.zerone?.not)) {
    add("$.karma.zerone", "zerone-karma-mismatch");
  }
  if (!sameKeys(value.karma?.kingdom, ["protocol", "meaning", "accounting", "receipt_refs", "receipt_status", "not"]) ||
      value.karma?.kingdom?.protocol !== "kingdom.karma/0.1" || value.karma?.kingdom?.accounting !== "receipts_not_scores" ||
      !text(value.karma?.kingdom?.meaning) || !Array.isArray(value.karma?.kingdom?.receipt_refs) ||
      value.karma.kingdom.receipt_refs.length !== 0 || value.karma?.kingdom?.receipt_status !== "not_created" ||
      !textArray(value.karma?.kingdom?.not)) {
    add("$.karma.kingdom", "kingdom-karma-mismatch");
  }
  if (!sameKeys(value.karma?.adapter, ["exists", "reason"]) || value.karma?.adapter?.exists !== false ||
      !text(value.karma?.adapter?.reason)) add("$.karma.adapter", "implicit-karma-adapter");

  if (!sameKeys(value.universe_lens, ["participation", "register", "questions", "nonclaims"]) ||
      value.universe_lens?.participation !== "opt-in" || value.universe_lens?.register !== "philosophical-interpretation" ||
      !Array.isArray(value.universe_lens?.questions) || value.universe_lens.questions.length < 1 ||
      value.universe_lens.questions.length > 12 || !textArray(value.universe_lens?.nonclaims, 2, 16)) {
    add("$.universe_lens", "universe-lens-mismatch");
  }
  const universeQuestions = array(value.universe_lens?.questions);
  if (!unique(itemIds(universeQuestions)) || itemIds(universeQuestions).length !== universeQuestions.length) {
    add("$.universe_lens.questions", "invalid-question-set");
  }
  for (const [index, question] of universeQuestions.entries()) {
    if (!object(question) || !id(question.id) || !text(question.question) ||
        !prose(question, "authored_position", "reflection") || !textArray(question.analogy_breaks)) {
      add(`$.universe_lens.questions[${index}]`, "invalid-philosophical-question");
    }
  }

  const ecosystemBridges = array(value.ecosystem_bridges);
  if (ecosystemBridges.length < 1 || ecosystemBridges.length > 16 || !unique(itemIds(ecosystemBridges)) ||
      itemIds(ecosystemBridges).length !== ecosystemBridges.length) {
    add("$.ecosystem_bridges", "invalid-ecosystem-set");
  }
  for (const [index, bridge] of ecosystemBridges.entries()) {
    if (!sameKeys(bridge, ["id", "label", "url", "relation", "mode", "runtime_request", "imported", "mutated", "authority_imported", "authority_effect", "write_authorized", "automatic_action", "does_not_establish"]) ||
        !id(bridge?.id) || !text(bridge?.label, 240) || !httpsUrl(bridge?.url) || !id(bridge?.relation) ||
        bridge?.mode !== "LINK_ONLY" ||
        bridge.runtime_request !== false || bridge.imported !== false || bridge.authority_imported !== false ||
        bridge.mutated !== false || bridge.authority_effect !== "NONE" || bridge.write_authorized !== false ||
        bridge.automatic_action !== false || !text(bridge.does_not_establish)) {
      add(`$.ecosystem_bridges[${index}]`, "ecosystem-bridge-not-link-only");
    }
  }

  const unknowns = array(value.unknowns);
  if (unknowns.length < 1 || unknowns.length > 32 || !unique(itemIds(unknowns)) || itemIds(unknowns).length !== unknowns.length) {
    add("$.unknowns", "invalid-unknown-set");
  }
  for (const [index, unknown] of unknowns.entries()) {
    if (!object(unknown) || !id(unknown.id) || !text(unknown.question) || !UNKNOWN_STATUSES.has(unknown.status) ||
        !text(unknown.why_open) || !references(unknown.source_ids, sourceIds, true)) {
      add(`$.unknowns[${index}]`, "invalid-unknown");
    }
  }

  if (!sameKeys(value.boundaries, Object.keys(EXPECTED_BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
  for (const [key, expected] of Object.entries(EXPECTED_BOUNDARIES)) {
    if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");
  }
  issues.push(...scanForForbiddenAuthorityFields(value));

  if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM ||
      typeof value.integrity?.digest !== "string" || !SHA256.test(value.integrity.digest)) {
    add("$.integrity", "invalid-integrity-envelope");
  } else if (value.integrity.digest !== CULTURAL_ATTENTION_FEEDBACK_DIGEST) {
    add("$.integrity.digest", "reviewed-digest-mismatch");
  } else {
    try {
      if (value.integrity.digest !== culturalAttentionFeedbackDigest(value)) add("$.integrity.digest", "digest-mismatch");
    } catch {
      add("$.integrity.digest", "digest-unavailable");
    }
  }
  return issues;
}

export function loadCulturalAttentionFeedbackAtlas(
  path = CULTURAL_ATTENTION_FEEDBACK_PATH,
): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyCulturalAttentionFeedbackAtlas(value);
  if (issues.length) {
    fail(`cultural-attention feedback atlas refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  }
  return value as Record<string, any>;
}

export function culturalAttentionFeedbackPublicDiscovery(
  value = loadCulturalAttentionFeedbackAtlas(),
): Record<string, any> {
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: CULTURAL_ATTENTION_FEEDBACK_URL,
    schema: CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
    guide: CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
    integrity: value.integrity,
    counts: {
      source_bindings: value.source_bindings.length,
      planes: value.ontology.planes.length,
      scientific_observations: value.scientific_observations.length,
      models: value.models.length,
      translations: value.translations.length,
      feedback_relations: value.feedback.length,
      universe_questions: value.universe_lens.questions.length,
      ecosystem_bridges: value.ecosystem_bridges.length,
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
    boundary: { ...EXPECTED_BOUNDARIES },
  };
}

function overview(value: Record<string, any>): string {
  return [
    value.title,
    "",
    ...value.plain_language.short_answer,
    "",
    `${value.ontology.planes.length} planes · ${value.scientific_observations.length} scientific observations · ${value.models.length} models · ${value.translations.length} bounded translations · ${value.feedback.length} feedback relations · ${value.unknowns.length} explicit open states`,
    `evidence through ${value.evidence_through} · ${value.integrity.digest}`,
    "",
    `Safety: ${value.plain_language.safety}`,
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write(
    "usage: cultural-attention-feedback.ts [overview|planes|models|bridges|ecosystems|feedback|karma|universe|unknowns|sources] [--json]\n" +
    "       cultural-attention-feedback.ts verify [FILE] [--json]\n",
  );
  process.exit(2);
}

export async function runCulturalAttentionFeedbackCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndexes = copy.flatMap((entry, index) => entry === "--json" ? [index] : []);
  if (jsonIndexes.length > 1) usage();
  const json = jsonIndexes.length === 1;
  if (json) copy.splice(jsonIndexes[0]!, 1);
  if (copy.some((arg) => arg.startsWith("-"))) usage();

  if (command === "verify") {
    if (copy.length > 1) usage();
    let issues: CulturalAttentionFeedbackIssue[];
    try {
      issues = verifyCulturalAttentionFeedbackAtlas(
        readUnchecked(copy[0] ? resolve(copy[0]) : CULTURAL_ATTENTION_FEEDBACK_PATH),
      );
    } catch (error) {
      issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }];
    }
    if (json) process.stdout.write(`${JSON.stringify({ valid: issues.length === 0, issues })}\n`);
    else if (!issues.length) {
      process.stdout.write(
        "Cultural Attention & Feedback Atlas: valid identity, source bindings, planes, models, bounded bridges, feedback, KARMA separation, philosophy boundary, unknowns, authority negatives, and semantic digest; JSON Schema not checked\n",
      );
    } else {
      issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    }
    process.exit(issues.length ? 1 : 0);
  }

  if (copy.length) usage();
  const value = loadCulturalAttentionFeedbackAtlas();
  const selection: Record<string, unknown> = {
    planes: value.ontology.planes,
    models: value.models,
    bridges: value.translations,
    ecosystems: value.ecosystem_bridges,
    feedback: value.feedback,
    karma: value.karma,
    universe: value.universe_lens,
    unknowns: value.unknowns,
    sources: value.sources,
  };
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (Object.hasOwn(selection, command)) {
    process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, [command]: selection[command] }, null, json ? 0 : 2)}\n`);
  } else usage();
}

if (import.meta.main) {
  try { await runCulturalAttentionFeedbackCli(); }
  catch (error) {
    process.stderr.write(`cultural-attention feedback refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
