#!/usr/bin/env bun
/** Strict, offline reader for the immutable Visibility & Attention Translation. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const VISIBILITY_ATTENTION_PROTOCOL = "kingdom.visibility-attention-translation/0.1";
export const VISIBILITY_ATTENTION_SCHEMA_ID = "urn:kingdom:schema:visibility-attention-translation:0.1";
export const VISIBILITY_ATTENTION_ID = "visibility-is-not-existence-2026-08-13";
export const VISIBILITY_ATTENTION_LOCATOR = "data/attention/visibility-attention-translation.v0.1.json";
export const VISIBILITY_ATTENTION_PATH = join(ROOT, VISIBILITY_ATTENTION_LOCATOR);
export const VISIBILITY_ATTENTION_SCHEMA_LOCATOR = "schemas/visibility-attention-translation-v0.1.schema.json";
export const VISIBILITY_ATTENTION_SCHEMA_PATH = join(ROOT, VISIBILITY_ATTENTION_SCHEMA_LOCATOR);
export const VISIBILITY_ATTENTION_URL = "https://thekingdom.dev/atlases/visibility-attention-2026-08-13.json";
export const VISIBILITY_ATTENTION_SCHEMA_URL = "https://thekingdom.dev/schemas/visibility-attention/0.1.json";
export const VISIBILITY_ATTENTION_DOCUMENT_URL = "https://thekingdom.dev/VISIBILITY-ATTENTION.md";
export const VISIBILITY_ATTENTION_DIGEST = "sha256:9fb83bbd022f520716fabcdec49d8af259b9681efd5e640a9e3119c5c42a54ed";

const MAX_BYTES = 512 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const TOP_KEYS = [
  "$schema", "protocol", "translation_id", "title", "compiled_on", "evidence_through",
  "scope", "bindings", "category_firewall", "registers", "local_models",
  "translation_seams", "feedback_path", "karma", "universe_lens", "unknowns",
  "sources", "boundaries", "integrity",
] as const;

const REGISTER_IDS = ["material-science", "computational-social-science", "lexical-usage", "zerone-karma"] as const;
const MODEL_IDS = ["finite-window-crystal-detection", "retrospective-diffusion-tree-geometry"] as const;
const MODEL_EQUATIONS = [
  "P(T_detect <= t) = 1 - exp[-J V max(t - t_g, 0)]",
  "nu(T) = 2/[n(n-1)] sum_{i<j} d_T(i,j), for n >= 2",
] as const;
const SEAM_IDS = ["finite-window-visibility", "local-mathematics-only", "feedback-with-exit"] as const;
const FEEDBACK_STAGE_IDS = [
  "publish-bounded-claim", "observe-without-profiling", "challenge-and-correct",
  "supersede-with-provenance", "rest-refuse-or-exit",
] as const;
const SOURCE_IDS = [
  "bauer-2001", "sacchi-2024", "jiang-2011", "weng-2012", "lorenz-spreen-2019",
  "goel-2016", "oxford-2024", "national-academies-2024", "zerone-karma-2026",
] as const;
const SOURCE_URLS = [
  "https://doi.org/10.1023/A:1011052932607",
  "https://doi.org/10.1073/pnas.2319127121",
  "https://doi.org/10.1021/cg101213q",
  "https://doi.org/10.1038/srep00335",
  "https://doi.org/10.1038/s41467-019-09311-w",
  "https://doi.org/10.1287/mnsc.2015.2158",
  "https://corp.oup.com/news/brain-rot-named-oxford-word-of-the-year-2024/",
  "https://doi.org/10.17226/27396",
  "https://zerone.ai/standards/karma-foundation.v1.json",
] as const;
const EXPECTED_BINDINGS = [
  {
    id: "kingdom-ritonavir-history",
    url: "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json",
    byte_sha256: "sha256:08148603a1228960ac35df1378f1283c3fce43874a9fc07e6687f18e980dcb1c",
    semantic_digest: "sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116",
    relation: "comparison-basis-only", mutated: false, authority_imported: false,
  },
  {
    id: "kingdom-conformational-feedback-physics",
    url: "https://thekingdom.dev/feedback/form-feedback-physics-consequence-2026-08-12.json",
    byte_sha256: "sha256:7d9b1eed8514051e47448cfc983f00e160d5b76c49704822158f76d3f8cf6349",
    semantic_digest: "sha256:0fc24a0fac99d2dadcdef5b87290a1d598b856f874aa9637ab4d503fd4c9dc11",
    relation: "design-language-only", mutated: false, authority_imported: false,
  },
  {
    id: "kingdom-fold-feedback",
    url: "https://thekingdom.dev/atlases/fold-feedback-atlas-2026-08-12.json",
    byte_sha256: "sha256:bc9a9abc966e64f7fb967778974879eb045083b342b70100bba92c94d0879df5",
    semantic_digest: "sha256:f19f83453bcac228c6a2804b840062067e92e71187f67b713f50abf0168252b7",
    relation: "non-equivalence-boundary-only", mutated: false, authority_imported: false,
  },
  {
    id: "zerone-karma-foundation",
    url: "https://zerone.ai/standards/karma-foundation.v1.json",
    byte_sha256: "sha256:b46710704869dcc340ded356be72b4ec692f204710fedfb5cd43eb3757dc7b80",
    semantic_digest: null,
    relation: "constitutional-context-only", mutated: false, authority_imported: false,
  },
] as const;
const EXPECTED_BOUNDARIES = {
  read_only: true,
  educational_only: true,
  contains_no_personal_data: true,
  medical_advice: false,
  diagnostic_authority: false,
  brain_rot_diagnosis: false,
  people_as_prions: false,
  people_as_crystals: false,
  culture_as_prion: false,
  cultural_diffusion_as_crystallization_kinetics: false,
  person_level_inference: false,
  person_level_prediction: false,
  content_classification: false,
  targeting: false,
  recommender: false,
  persuasion: false,
  moderation: false,
  virality_optimization: false,
  engagement_optimization: false,
  scoring: false,
  automatic_action: false,
  karma_aggregation: false,
  karma_rank: false,
  karma_economic_effect: false,
  karma_governance_effect: false,
  writes_zerone_karma: false,
  creates_kingdom_karma_receipt: false,
  runtime_request: false,
  mcp_surface_added: false,
  experiment_authority: false,
  manufacturing_authority: false,
  scientifically_proves_cosmic_design: false,
} as const;

export type VisibilityAttentionIssue = { field: string; code: string };

function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function array(value: unknown): any[] { return Array.isArray(value) ? value : []; }
function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}
function sameJson(left: unknown, right: unknown): boolean {
  try { return canonicalizeJsonValue(left) === canonicalizeJsonValue(right); } catch { return false; }
}
function text(value: unknown, max = 4000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max && value.trim() === value;
}
function id(value: unknown): value is string { return typeof value === "string" && value.length <= 120 && ID.test(value); }
function exactIds(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((item, index) => item?.id === expected[index]);
}
function textArray(value: unknown, min = 1, max = 24): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max &&
    value.every((item) => text(item)) && new Set(value).size === value.length;
}
function refs(value: unknown, known: Set<string>, allowEmpty = false): boolean {
  return Array.isArray(value) && value.length <= 16 && (allowEmpty || value.length > 0) &&
    value.every((item) => typeof item === "string" && known.has(item)) &&
    new Set(value).size === value.length;
}
function fullDate(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { throw new Error("visibility-attention translation is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("visibility-attention translation must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) throw new Error(`visibility-attention translation exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "visibility-attention translation JSON");
}

export function visibilityAttentionDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("visibility-attention integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

export function verifyVisibilityAttentionTranslation(value: unknown): VisibilityAttentionIssue[] {
  const issues: VisibilityAttentionIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];
  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== VISIBILITY_ATTENTION_SCHEMA_ID || value.protocol !== VISIBILITY_ATTENTION_PROTOCOL ||
      value.translation_id !== VISIBILITY_ATTENTION_ID) add("$", "identity-mismatch");
  if (!text(value.title, 240) || value.title !== "Visibility is not existence" ||
      !fullDate(value.compiled_on) || !fullDate(value.evidence_through) ||
      value.compiled_on !== "2026-08-13" || value.evidence_through > value.compiled_on) {
    add("$", "title-or-date-mismatch");
  }
  if (!sameKeys(value.scope, ["focus", "coverage", "intended_use", "excluded_use", "currentness"]) ||
      !text(value.scope?.focus) || !text(value.scope?.coverage) || !text(value.scope?.intended_use) ||
      !text(value.scope?.excluded_use) || value.scope?.currentness !== "selected-evidence-as-of-compilation") {
    add("$.scope", "invalid-scope");
  }
  if (!sameJson(value.bindings, EXPECTED_BINDINGS)) add("$.bindings", "binding-pin-mismatch");
  if (!sameKeys(value.category_firewall, ["rule", "non_equivalence", "enforced"]) ||
      !text(value.category_firewall?.rule) || !text(value.category_firewall?.non_equivalence) ||
      value.category_firewall?.enforced !== true) add("$.category_firewall", "firewall-mismatch");

  if (!exactIds(value.sources, SOURCE_IDS)) add("$.sources", "source-order-or-id-mismatch");
  const sourceIds = new Set(array(value.sources).map((item) => item?.id).filter((item) => typeof item === "string"));
  for (const [index, source] of array(value.sources).entries()) {
    if (!sameKeys(source, ["id", "title", "source_kind", "published_on", "observed_on", "url", "doi", "limitation"]) ||
        !id(source?.id) || !text(source?.title, 700) || !id(source?.source_kind) ||
        !(typeof source?.published_on === "string" && /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(source.published_on)) ||
        !fullDate(source?.observed_on) || source?.url !== SOURCE_URLS[index] ||
        !(source?.doi === null || text(source?.doi, 200)) || !text(source?.limitation)) {
      add(`$.sources[${index}]`, "invalid-source");
    }
    if (source?.doi !== null && source?.url !== `https://doi.org/${source?.doi}`) {
      add(`$.sources[${index}].doi`, "doi-url-mismatch");
    }
  }

  if (!exactIds(value.registers, REGISTER_IDS)) add("$.registers", "register-order-or-id-mismatch");
  const registerIds = new Set(REGISTER_IDS);
  for (const [index, register] of array(value.registers).entries()) {
    if (!sameKeys(register, ["id", "label", "unit", "context_window", "observed", "modelled", "does_not_establish", "evidence_class", "basis_ids"]) ||
        !id(register?.id) || !text(register?.label) || !text(register?.unit) || !text(register?.context_window) ||
        !text(register?.observed) || !text(register?.modelled) || !text(register?.does_not_establish) ||
        !["SCIENTIFIC_OBSERVATION", "LEXICAL_OBSERVATION", "CONSTITUTIONAL_DESIGN"].includes(register?.evidence_class) ||
        !refs(register?.basis_ids, sourceIds)) add(`$.registers[${index}]`, "invalid-register");
  }
  if (value.registers?.[2]?.evidence_class !== "LEXICAL_OBSERVATION" ||
      value.registers?.[3]?.evidence_class !== "CONSTITUTIONAL_DESIGN") add("$.registers", "register-class-mismatch");

  if (!exactIds(value.local_models, MODEL_IDS)) add("$.local_models", "model-order-or-id-mismatch");
  for (const [index, model] of array(value.local_models).entries()) {
    if (!sameKeys(model, ["id", "title", "register", "equation", "variables", "assumptions", "fit_scope", "basis_ids", "retrospective_only", "person_level", "optimization_allowed", "not_valid_for"]) ||
        !id(model?.id) || !text(model?.title) || !registerIds.has(model?.register) ||
        model?.equation !== MODEL_EQUATIONS[index] || !Array.isArray(model?.variables) ||
        model.variables.length < 3 || model.variables.length > 8 ||
        model.variables.some((term: unknown) => !sameKeys(term, ["symbol", "meaning"]) || !text((term as any)?.symbol, 80) || !text((term as any)?.meaning)) ||
        !textArray(model?.assumptions, 3, 8) || !text(model?.fit_scope) || !refs(model?.basis_ids, sourceIds) ||
        model?.retrospective_only !== true || model?.person_level !== false ||
        model?.optimization_allowed !== false || !textArray(model?.not_valid_for, 3, 8)) {
      add(`$.local_models[${index}]`, "invalid-local-model");
    }
  }

  if (!exactIds(value.translation_seams, SEAM_IDS)) add("$.translation_seams", "seam-order-or-id-mismatch");
  for (const [index, seam] of array(value.translation_seams).entries()) {
    if (!sameKeys(seam, ["id", "kind", "label", "from_register", "to_register", "preserved_shape", "breaks", "basis_ids", "empirical", "causal_transfer", "ontology_transfer", "authority_effect"]) ||
        !id(seam?.id) || !["ANALOGY_ONLY", "MATHEMATICAL_TRANSLATION", "DESIGN_CORRESPONDENCE"].includes(seam?.kind) ||
        !text(seam?.label) || !registerIds.has(seam?.from_register) || !registerIds.has(seam?.to_register) ||
        !text(seam?.preserved_shape) || !text(seam?.breaks) || !refs(seam?.basis_ids, sourceIds) ||
        seam?.empirical !== false || seam?.causal_transfer !== false || seam?.ontology_transfer !== false ||
        seam?.authority_effect !== "NONE") add(`$.translation_seams[${index}]`, "invalid-seam");
  }

  if (!sameKeys(value.feedback_path, ["rule", "stages", "valid_exits"]) || !text(value.feedback_path?.rule) ||
      !exactIds(value.feedback_path?.stages, FEEDBACK_STAGE_IDS) ||
      !textArray(value.feedback_path?.valid_exits, 6, 6)) add("$.feedback_path", "feedback-shape-mismatch");
  for (const [index, stage] of array(value.feedback_path?.stages).entries()) {
    if (!sameKeys(stage, ["id", "label", "description"]) || !id(stage?.id) ||
        !text(stage?.label) || !text(stage?.description)) add(`$.feedback_path.stages[${index}]`, "invalid-feedback-stage");
  }

  if (!sameKeys(value.karma, ["zerone", "kingdom", "adapter"]) ||
      !sameKeys(value.karma?.zerone, ["protocol", "meaning", "non_summable", "event_status", "event_refs", "creates_event"]) ||
      value.karma?.zerone?.protocol !== "zerone.karma-foundation/v1" ||
      !text(value.karma?.zerone?.meaning) || value.karma?.zerone?.non_summable !== true ||
      value.karma?.zerone?.event_status !== "not_observed" || !Array.isArray(value.karma?.zerone?.event_refs) ||
      value.karma.zerone.event_refs.length !== 0 || value.karma?.zerone?.creates_event !== false ||
      !sameKeys(value.karma?.kingdom, ["protocol", "meaning", "accounting", "receipt_status", "receipt_refs", "creates_receipt"]) ||
      value.karma?.kingdom?.protocol !== "kingdom.karma/0.1" || !text(value.karma?.kingdom?.meaning) ||
      value.karma?.kingdom?.accounting !== "receipts_not_scores" || value.karma?.kingdom?.receipt_status !== "not_created" ||
      !Array.isArray(value.karma?.kingdom?.receipt_refs) || value.karma.kingdom.receipt_refs.length !== 0 ||
      value.karma?.kingdom?.creates_receipt !== false ||
      !sameKeys(value.karma?.adapter, ["exists", "reason"]) || value.karma?.adapter?.exists !== false ||
      !text(value.karma?.adapter?.reason)) add("$.karma", "karma-boundary-mismatch");

  if (!sameKeys(value.universe_lens, ["participation", "register", "empirical", "proposition", "questions", "alternatives", "does_not_establish", "authority_effect"]) ||
      value.universe_lens?.participation !== "opt-in" || value.universe_lens?.register !== "PHILOSOPHY" ||
      value.universe_lens?.empirical !== false || !text(value.universe_lens?.proposition) ||
      !textArray(value.universe_lens?.questions, 3, 6) || !textArray(value.universe_lens?.alternatives, 3, 6) ||
      !textArray(value.universe_lens?.does_not_establish, 3, 6) ||
      value.universe_lens?.authority_effect !== "NONE") add("$.universe_lens", "universe-lens-mismatch");

  if (!Array.isArray(value.unknowns) || value.unknowns.length !== 5) add("$.unknowns", "unknown-count-mismatch");
  for (const [index, unknown] of array(value.unknowns).entries()) {
    if (!sameKeys(unknown, ["id", "status", "question", "why_open", "basis_ids"]) || !id(unknown?.id) ||
        !["unknown", "not-established", "contested", "refused"].includes(unknown?.status) ||
        !text(unknown?.question) || !text(unknown?.why_open) ||
        !refs(unknown?.basis_ids, sourceIds, unknown?.id === "cosmic-design")) {
      add(`$.unknowns[${index}]`, "invalid-unknown");
    }
  }

  if (!sameJson(value.boundaries, EXPECTED_BOUNDARIES)) add("$.boundaries", "boundary-mismatch");
  if (!sameKeys(value.integrity, ["algorithm", "digest"]) ||
      value.integrity?.algorithm !== INTEGRITY_ALGORITHM || !SHA256.test(value.integrity?.digest ?? "")) {
    add("$.integrity", "integrity-envelope-mismatch");
  } else {
    try {
      if (value.integrity.digest !== visibilityAttentionDigest(value)) add("$.integrity.digest", "digest-mismatch");
    } catch {
      add("$.integrity.digest", "digest-unavailable");
    }
    if (value.integrity.digest !== VISIBILITY_ATTENTION_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
  }
  return issues;
}

export function loadVisibilityAttentionTranslation(path = VISIBILITY_ATTENTION_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyVisibilityAttentionTranslation(value);
  if (issues.length) {
    throw new Error(`visibility-attention translation refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  }
  return value as Record<string, any>;
}

export function visibilityAttentionPublicDiscovery(value = loadVisibilityAttentionTranslation()): Record<string, any> {
  return {
    protocol: value.protocol,
    translation_id: value.translation_id,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: VISIBILITY_ATTENTION_URL,
    schema: VISIBILITY_ATTENTION_SCHEMA_URL,
    guide: VISIBILITY_ATTENTION_DOCUMENT_URL,
    integrity: value.integrity,
    bindings: value.bindings.map((binding: any) => ({
      id: binding.id,
      url: binding.url,
      relation: binding.relation,
      mutated: binding.mutated,
      authority_imported: binding.authority_imported,
    })),
    counts: {
      registers: value.registers.length,
      local_models: value.local_models.length,
      translation_seams: value.translation_seams.length,
      feedback_stages: value.feedback_path.stages.length,
      sources: value.sources.length,
    },
    boundary: value.boundaries,
  };
}

function output(value: unknown, json: boolean): void {
  if (json) console.log(JSON.stringify(value, null, 2));
  else if (typeof value === "string") process.stdout.write(value.endsWith("\n") ? value : `${value}\n`);
  else console.log(JSON.stringify(value, null, 2));
}
function usage(): never {
  console.error("usage: visibility-attention.ts [overview|registers|models|seams|feedback|karma|philosophy|sources|bindings|verify [FILE]] [--json]");
  process.exit(2);
}

export function runVisibilityAttentionCli(args = process.argv.slice(2)): void {
  const jsonArgs = args.filter((item) => item === "--json");
  if (jsonArgs.length > 1 || args.some((item) => item.startsWith("-") && item !== "--json")) usage();
  const json = jsonArgs.length === 1;
  const positional = args.filter((item) => item !== "--json");
  const command = positional[0] ?? "overview";
  if (command === "verify") {
    if (positional.length > 2) usage();
    const path = positional[1] ?? VISIBILITY_ATTENTION_PATH;
    let value: unknown;
    try { value = readUnchecked(path); } catch (error) {
      if (json) output({ valid: false, issues: [{ field: "$", code: "read-refused" }] }, true);
      else console.error(String(error));
      process.exitCode = 1;
      return;
    }
    const issues = verifyVisibilityAttentionTranslation(value);
    output({ valid: issues.length === 0, issues }, json);
    if (issues.length) process.exitCode = 1;
    return;
  }
  if (positional.length > 1) usage();
  const value = loadVisibilityAttentionTranslation();
  const selections: Record<string, () => unknown> = {
    overview: () => ({
      title: value.title,
      scope: value.scope,
      firewall: value.category_firewall,
      counts: visibilityAttentionPublicDiscovery(value).counts,
      boundary: value.boundaries,
    }),
    registers: () => value.registers,
    models: () => value.local_models,
    seams: () => value.translation_seams,
    feedback: () => value.feedback_path,
    karma: () => value.karma,
    philosophy: () => value.universe_lens,
    sources: () => value.sources,
    bindings: () => value.bindings,
  };
  if (!Object.hasOwn(selections, command)) usage();
  output(selections[command]!(), json);
}

if (import.meta.main) runVisibilityAttentionCli();
