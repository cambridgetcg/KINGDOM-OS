#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(SCRIPT_PATH));

export const RITONAVIR_MECHANISM_PROTOCOL = "kingdom.ritonavir-mechanism-landscape/0.1";
export const RITONAVIR_MECHANISM_ID = "ritonavir-mechanism-landscape-2026-08-11";
export const RITONAVIR_MECHANISM_LOCATOR = "data/polymorphs/ritonavir-mechanism-landscape.v1.json";
export const RITONAVIR_MECHANISM_PATH = join(ROOT, RITONAVIR_MECHANISM_LOCATOR);
export const RITONAVIR_MECHANISM_DIGEST = "sha256:2a97b0f3ac3741314e50f7512ef97cb19cf3294fed24728c622bd27dd180309b";
export const RITONAVIR_MECHANISM_URL = `https://thekingdom.dev/polymorphs/${RITONAVIR_MECHANISM_ID}.json`;
export const RITONAVIR_MECHANISM_SCHEMA_URL = "https://thekingdom.dev/schemas/ritonavir-mechanism-landscape/1.json";
export const RITONAVIR_MECHANISM_DOCUMENT_URL = "https://thekingdom.dev/RITONAVIR-MECHANISM-LANDSCAPE.md";

const MAX_BYTES = 512 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const DATE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;
const HTTPS = /^https:\/\/[^/]/;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const HISTORY_DIGEST = "sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116";

const PLANE_IDS = [
  "chemical-entity",
  "molecular-conformer",
  "crystal-phase",
  "particle-population",
  "formulation-dissolution",
  "dissolved-exposure",
  "pharmacological-action",
  "clinical-decision",
] as const;

const GEOMETRY_IDS = [
  "identity-fiber",
  "source-chart-atlas",
  "conditional-energy-landscape",
  "kinetic-path-graph",
  "observer-cover",
  "causal-dissolution-bridge",
] as const;

const ENTITY_IDS = [
  "ritonavir-chemical-entity",
  "ritonavir-dissolved-exposure",
  "form-i-trans-carbamate-conformer",
  "form-ii-cis-carbamate-conformer",
  "abbott-form-i",
  "abbott-form-ii",
  "morissette-2003-form-iii-solvate",
  "morissette-2003-form-iv-anhydrous",
  "morissette-2003-form-v-hydrate",
  "modern-2023-form-iii-anhydrous",
  "iuzzolino-2025-form-4-structure",
  "parent-2026-form-iv-structure",
  "bounded-ritonavir-particle-population",
  "named-formulation-dissolution-context",
  "hiv-1-protease",
  "hiv-gag-pol-processing",
  "immature-noninfectious-hiv-particles",
  "cyp3a",
  "co-medication-exposure",
] as const;

const MECHANISM_IDS = [
  "conformational-polymorphism",
  "conditional-thermodynamics",
  "nucleation-and-path-selection",
  "dissolution-bridge",
  "hiv-protease-inhibition",
  "cyp3a-inhibition",
  "complementary-observation",
] as const;

const RELATION_IDS = [
  "form-i-same-chemical",
  "form-ii-same-chemical",
  "form-i-conformer-of-ritonavir",
  "form-ii-conformer-of-ritonavir",
  "form-i-packs-with-conformer",
  "form-ii-packs-with-conformer",
  "modern-form-iii-same-chemical",
  "form-iii-labels-not-same",
  "iuzzolino-structure-models-historical-form-iv",
  "two-form-iv-records-candidate-equivalent",
  "phase-to-particle-bridge",
  "particle-to-formulation-dissolution-bridge",
  "formulation-to-dissolved-exposure-bridge",
  "dissolved-ritonavir-inhibits-hiv-protease",
  "protease-inhibition-reduces-processing",
  "reduced-processing-leads-to-immature-particles",
  "dissolved-ritonavir-inhibits-cyp3a",
  "cyp3a-inhibition-may-alter-exposure",
] as const;

const SOURCE_PINS: ReadonlyArray<readonly [string, string, string | null]> = [
  ["kingdom-history-v1", "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json", null],
  ["bauer-2001", "https://doi.org/10.1023/A:1011052932607", "10.1023/A:1011052932607"],
  ["morissette-2003", "https://doi.org/10.1073/pnas.0437744100", "10.1073/pnas.0437744100"],
  ["dailymed-ritonavir-2023", "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=db633374-6d8e-4622-9fe1-f9d68baa59bb", null],
  ["yao-2023", "https://doi.org/10.1016/j.xphs.2022.09.026", "10.1016/j.xphs.2022.09.026"],
  ["parent-2023", "https://doi.org/10.1021/acs.cgd.2c01017", "10.1021/acs.cgd.2c01017"],
  ["iuzzolino-2025", "https://doi.org/10.1038/s42004-025-01814-6", "10.1038/s42004-025-01814-6"],
  ["parent-2026", "https://doi.org/10.1021/acs.cgd.5c01571", "10.1021/acs.cgd.5c01571"],
  ["bauser-2026", "https://doi.org/10.1038/s41526-026-00594-0", "10.1038/s41526-026-00594-0"],
];

const EXPECTED_BOUNDARIES: Record<string, boolean> = {
  phase_name_is_global_identity: false,
  form_iv_exact_equivalence_established: false,
  complete_solid_form_landscape_established: false,
  global_stability_ranking_established: false,
  exclusive_1998_cause_established: false,
  universal_seed_effect_established: false,
  direct_crystal_form_to_clinical_outcome: false,
  current_product_defect_established: false,
  medical_advice: false,
  diagnostic_authority: false,
  dosing_authority: false,
  interaction_checker: false,
  treatment_change_authority: false,
  formulation_instruction: false,
  manufacturing_instruction: false,
  gmp_authority: false,
  batch_release_authority: false,
  regulatory_authority: false,
  experiment_authority: false,
  procurement_authority: false,
  automatic_action: false,
  writes_agenttool: false,
  writes_wake: false,
  public_surface_read_only: true,
};

const EVIDENCE_CLASSES = new Set([
  "structure-supported",
  "measurement-and-model-supported",
  "observation-and-supported-mechanism",
  "bounded-synthesis",
  "official-label",
  "methodological-synthesis",
  "composition-and-structure-supported",
  "structure-and-pattern-supported",
  "strongly-supported-inference",
  "observation-and-analysis",
  "derived-thermodynamic-analysis",
  "model-supported",
]);

const SOLID_KINDS = new Set(["anhydrous-polymorph", "formamide-solvate", "hydrate", "structure-record"]);
const DIRECT_BIOLOGICAL_KINDS = new Set(["dissolved-exposure", "pharmacological-target", "biological-process", "biological-state", "exposure-state"]);

export type RitonavirMechanismIssue = { field: string; code: string };

function fail(message: string): never {
  throw new Error(message);
}

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameKeys(value: unknown, expected: readonly string[]): boolean {
  return isObject(value) && Object.keys(value).sort().join("\u0000") === [...expected].sort().join("\u0000");
}

function isId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 100 && ID.test(value);
}

function isText(value: unknown, max = 2400): value is string {
  return typeof value === "string" && value.length > 0 && Array.from(value).length <= max;
}

function isTextArray(value: unknown, min = 1, max = 32): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max && value.every((entry) => isText(entry, 1200));
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function exactIds(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry?.id === expected[index]);
}

function isDate(value: unknown, full = false): value is string {
  if (typeof value !== "string") return false;
  const match = DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const monthText = match[2];
  const dayText = match[3];
  if (year < 1 || (full && dayText === undefined)) return false;
  if (monthText === undefined) return !full;
  const month = Number(monthText);
  if (month < 1 || month > 12) return false;
  if (dayText === undefined) return !full;
  const day = Number(dayText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= days[month - 1]!;
}

function isHttps(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 600 || !HTTPS.test(value) || value.includes("\\")) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !!parsed.hostname;
  } catch {
    return false;
  }
}

function arrayOf(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function idsOf(value: unknown): string[] {
  return arrayOf(value).map((entry) => entry?.id).filter(isId);
}

function refs(
  issues: RitonavirMechanismIssue[],
  field: string,
  value: unknown,
  target: Set<string>,
  allowEmpty = false,
): void {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || !unique(value.filter((entry) => typeof entry === "string")) ||
      !value.every((entry) => typeof entry === "string" && target.has(entry))) {
    issues.push({ field, code: "unresolved-reference" });
  }
}

export function ritonavirMechanismDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!isObject(material.integrity)) fail("ritonavir mechanism landscape integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try {
    stat = lstatSync(absolute);
  } catch {
    fail("ritonavir mechanism landscape is unavailable");
  }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("ritonavir mechanism landscape must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) fail(`ritonavir mechanism landscape exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "ritonavir mechanism landscape JSON");
}

export function verifyRitonavirMechanismLandscape(value: unknown): RitonavirMechanismIssue[] {
  const issues: RitonavirMechanismIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!isObject(value)) return [{ field: "$", code: "must-be-object" }];

  const topKeys = [
    "$schema", "protocol", "landscape_id", "title", "compiled_on", "evidence_through", "source_history",
    "scope", "plain_language", "ontology", "entities", "naming_charts", "mechanisms", "relations", "claims",
    "analytical_windows", "unknowns", "sources", "boundaries", "integrity",
  ];
  if (!sameKeys(value, topKeys)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== "urn:kingdom:schema:ritonavir-mechanism-landscape:1") add("$.$schema", "schema-mismatch");
  if (value.protocol !== RITONAVIR_MECHANISM_PROTOCOL) add("$.protocol", "protocol-mismatch");
  if (value.landscape_id !== RITONAVIR_MECHANISM_ID) add("$.landscape_id", "identity-mismatch");
  if (!isText(value.title, 240)) add("$.title", "invalid-text");
  if (!isDate(value.compiled_on, true)) add("$.compiled_on", "invalid-date");
  if (!isDate(value.evidence_through, true) || value.evidence_through > value.compiled_on) add("$.evidence_through", "invalid-evidence-horizon");

  if (!sameKeys(value.source_history, ["case_id", "semantic_digest", "public_url", "relation", "mutates_source_history", "supersedes_source_history", "supersedes_for_current_landscape"]) ||
      value.source_history?.case_id !== "ritonavir-disappearing-polymorph-2026-08-11" ||
      value.source_history?.semantic_digest !== HISTORY_DIGEST ||
      value.source_history?.public_url !== SOURCE_PINS[0]![1] ||
      value.source_history?.relation !== "non-mutating-current-landscape-supplement" ||
      value.source_history?.mutates_source_history !== false || value.source_history?.supersedes_source_history !== false ||
      value.source_history?.supersedes_for_current_landscape !== true) {
    add("$.source_history", "source-history-boundary-mismatch");
  }

  if (!sameKeys(value.scope, ["focus", "coverage", "intended_use", "excluded_use", "currentness"]) ||
      !isText(value.scope?.focus) || !isText(value.scope?.coverage) || !isText(value.scope?.intended_use) ||
      !isText(value.scope?.excluded_use) || value.scope?.currentness !== "selected-evidence-as-of-compilation") {
    add("$.scope", "invalid-scope");
  }
  if (!sameKeys(value.plain_language, ["question", "short_answer", "safety"]) || !isText(value.plain_language?.question) ||
      !isTextArray(value.plain_language?.short_answer, 4, 8) || !isText(value.plain_language?.safety) ||
      !value.plain_language.safety.includes("not medical advice") ||
      !value.plain_language.safety.includes("serious or life-threatening") ||
      !value.plain_language.safety.includes("do not start, stop, or change")) {
    add("$.plain_language", "medical-safety-boundary-mismatch");
  }

  if (!sameKeys(value.ontology, ["non_equivalence", "planes", "geometry"]) ||
      value.ontology?.non_equivalence !== "chemical_entity != molecular_conformer != crystal_phase != particle_population != formulation_dissolution != dissolved_exposure != pharmacological_action != clinical_decision") {
    add("$.ontology", "non-equivalence-mismatch");
  }
  if (!exactIds(value.ontology?.planes, PLANE_IDS)) add("$.ontology.planes", "plane-order-or-membership-mismatch");
  for (const [index, plane] of arrayOf(value.ontology?.planes).entries()) {
    if (!sameKeys(plane, ["id", "ordinary_words", "meaning", "does_not_establish"]) ||
        !isText(plane.ordinary_words) || !isText(plane.meaning) || !isText(plane.does_not_establish)) {
      add(`$.ontology.planes[${index}]`, "invalid-plane");
    }
  }
  if (!exactIds(value.ontology?.geometry, GEOMETRY_IDS)) add("$.ontology.geometry", "geometry-order-or-membership-mismatch");
  for (const [index, geometry] of arrayOf(value.ontology?.geometry).entries()) {
    if (!sameKeys(geometry, ["id", "ordinary_words", "finite_shape", "maps_to", "does_not_imply"]) ||
        !isText(geometry.ordinary_words) || !isText(geometry.finite_shape) || !isText(geometry.maps_to) || !isText(geometry.does_not_imply)) {
      add(`$.ontology.geometry[${index}]`, "invalid-geometry");
    }
  }

  if (!exactIds(value.entities, ENTITY_IDS)) add("$.entities", "entity-order-or-membership-mismatch");
  const entityIds = new Set(idsOf(value.entities));
  const entityKinds = new Map<string, string>();
  for (const [index, entity] of arrayOf(value.entities).entries()) {
    if (!sameKeys(entity, ["id", "kind", "label", "source_scope", "summary"]) || !isId(entity.id) || !isId(entity.kind) ||
        !isText(entity.label, 180) || !isText(entity.source_scope) || !isText(entity.summary)) {
      add(`$.entities[${index}]`, "invalid-entity");
    }
    entityKinds.set(entity.id, entity.kind);
  }

  const sourceIds = new Set(idsOf(value.sources));
  if (sourceIds.size !== SOURCE_PINS.length || value.sources?.length !== SOURCE_PINS.length) add("$.sources", "source-count-or-id-mismatch");
  for (const [index, source] of arrayOf(value.sources).entries()) {
    const pin = SOURCE_PINS[index];
    if (!pin || !sameKeys(source, ["id", "title", "source_kind", "published_on", "observed_on", "url", "doi", "authority_note"]) ||
        source.id !== pin[0] || source.url !== pin[1] || source.doi !== pin[2] || !isText(source.title, 500) || !isId(source.source_kind) ||
        !isDate(source.published_on) || !isDate(source.observed_on, true) || source.observed_on > value.compiled_on ||
        !isHttps(source.url) || !isText(source.authority_note)) {
      add(`$.sources[${index}]`, "source-pin-or-shape-mismatch");
    }
    if (source.id !== "kingdom-history-v1" && source.published_on > value.evidence_through) {
      add(`$.sources[${index}].published_on`, "source-after-evidence-horizon");
    }
  }

  if (!Array.isArray(value.naming_charts) || value.naming_charts.length !== 2 || !unique(idsOf(value.naming_charts))) {
    add("$.naming_charts", "invalid-chart-set");
  }
  for (const [index, chart] of arrayOf(value.naming_charts).entries()) {
    if (!sameKeys(chart, ["id", "title", "source_ids", "entries", "boundary"]) || !isId(chart.id) ||
        !isText(chart.title) || !isText(chart.boundary) || !Array.isArray(chart.entries) || chart.entries.length < 2) {
      add(`$.naming_charts[${index}]`, "invalid-chart");
    }
    refs(issues, `$.naming_charts[${index}].source_ids`, chart.source_ids, sourceIds);
    for (const [entryIndex, entry] of arrayOf(chart.entries).entries()) {
      if (!sameKeys(entry, ["label", "entity_id"]) || !isText(entry.label, 160) || !entityIds.has(entry.entity_id)) {
        add(`$.naming_charts[${index}].entries[${entryIndex}]`, "invalid-chart-entry");
      }
    }
  }

  if (!exactIds(value.mechanisms, MECHANISM_IDS)) add("$.mechanisms", "mechanism-order-or-membership-mismatch");
  const mechanismIds = new Set(idsOf(value.mechanisms));
  for (const [index, mechanism] of arrayOf(value.mechanisms).entries()) {
    if (!sameKeys(mechanism, ["id", "ordinary_words", "finite_shape", "scientific_mechanism", "evidence_class", "source_ids", "limitations"]) ||
        !isText(mechanism.ordinary_words) || !isText(mechanism.finite_shape) || !isText(mechanism.scientific_mechanism) ||
        !EVIDENCE_CLASSES.has(mechanism.evidence_class) || !isTextArray(mechanism.limitations, 1, 8)) {
      add(`$.mechanisms[${index}]`, "invalid-mechanism");
    }
    refs(issues, `$.mechanisms[${index}].source_ids`, mechanism.source_ids, sourceIds);
  }

  if (!exactIds(value.relations, RELATION_IDS)) add("$.relations", "relation-order-or-membership-mismatch");
  for (const [index, relation] of arrayOf(value.relations).entries()) {
    if (!sameKeys(relation, ["id", "subject_id", "predicate", "object_id", "mechanism_id", "evidence_class", "source_ids", "condition_dependent", "universal", "direct_clinical_edge"]) ||
        !entityIds.has(relation.subject_id) || !isId(relation.predicate) || !entityIds.has(relation.object_id) ||
        !mechanismIds.has(relation.mechanism_id) || !EVIDENCE_CLASSES.has(relation.evidence_class) ||
        typeof relation.condition_dependent !== "boolean" || typeof relation.universal !== "boolean" ||
        relation.direct_clinical_edge !== false) {
      add(`$.relations[${index}]`, "invalid-relation");
    }
    refs(issues, `$.relations[${index}].source_ids`, relation.source_ids, sourceIds);
    if (SOLID_KINDS.has(entityKinds.get(relation.subject_id) ?? "") && DIRECT_BIOLOGICAL_KINDS.has(entityKinds.get(relation.object_id) ?? "")) {
      add(`$.relations[${index}]`, "forbidden-solid-to-biological-shortcut");
    }
    if (relation.predicate === "candidate-equivalent-to" && relation.universal !== false) {
      add(`$.relations[${index}]`, "candidate-equivalence-cannot-be-universal");
    }
  }
  const formThreeCrosswalk = value.relations?.find((relation: any) => relation.id === "form-iii-labels-not-same");
  if (formThreeCrosswalk?.predicate !== "not-same-phase-as") add("$.relations", "form-iii-crosswalk-missing");
  const formFourCrosswalk = value.relations?.find((relation: any) => relation.id === "two-form-iv-records-candidate-equivalent");
  if (formFourCrosswalk?.predicate !== "candidate-equivalent-to" || formFourCrosswalk?.universal !== false) {
    add("$.relations", "form-iv-uncertainty-collapsed");
  }
  const pathById = new Map(arrayOf(value.relations).map((relation) => [relation?.id, relation]));
  const requiredDissolutionPath = [
    ["phase-to-particle-bridge", "abbott-form-i", "bounded-ritonavir-particle-population"],
    ["particle-to-formulation-dissolution-bridge", "bounded-ritonavir-particle-population", "named-formulation-dissolution-context"],
    ["formulation-to-dissolved-exposure-bridge", "named-formulation-dissolution-context", "ritonavir-dissolved-exposure"],
  ] as const;
  for (const [id, subject, object] of requiredDissolutionPath) {
    const relation = pathById.get(id);
    if (relation?.subject_id !== subject || relation?.object_id !== object ||
        relation?.mechanism_id !== "dissolution-bridge" || relation?.condition_dependent !== true ||
        relation?.universal !== false) {
      add(`$.relations.${id}`, "dissolution-path-boundary-mismatch");
    }
  }

  const claimIds = idsOf(value.claims);
  if (!Array.isArray(value.claims) || value.claims.length < 8 || !unique(claimIds)) add("$.claims", "invalid-claim-set");
  for (const [index, claim] of arrayOf(value.claims).entries()) {
    if (!sameKeys(claim, ["id", "summary", "evidence_class", "source_ids", "entity_ids", "mechanism_ids", "limitations"]) ||
        !isId(claim.id) || !isText(claim.summary) || !EVIDENCE_CLASSES.has(claim.evidence_class) ||
        !isTextArray(claim.limitations, 1, 8)) add(`$.claims[${index}]`, "invalid-claim");
    refs(issues, `$.claims[${index}].source_ids`, claim.source_ids, sourceIds);
    refs(issues, `$.claims[${index}].entity_ids`, claim.entity_ids, entityIds);
    refs(issues, `$.claims[${index}].mechanism_ids`, claim.mechanism_ids, mechanismIds);
  }

  const windowIds = idsOf(value.analytical_windows);
  if (!Array.isArray(value.analytical_windows) || value.analytical_windows.length < 4 || !unique(windowIds)) {
    add("$.analytical_windows", "invalid-window-set");
  }
  for (const [index, window] of arrayOf(value.analytical_windows).entries()) {
    if (!sameKeys(window, ["id", "methods", "observes", "does_not_establish"]) || !isId(window.id) ||
        !isTextArray(window.methods, 1, 12) || !isText(window.observes) || !isText(window.does_not_establish)) {
      add(`$.analytical_windows[${index}]`, "invalid-window");
    }
  }

  const unknownIds = idsOf(value.unknowns);
  if (!Array.isArray(value.unknowns) || value.unknowns.length < 5 || !unique(unknownIds)) add("$.unknowns", "invalid-unknown-set");
  for (const [index, unknown] of arrayOf(value.unknowns).entries()) {
    if (!sameKeys(unknown, ["id", "question", "status", "why_open", "source_ids"]) || !isId(unknown.id) ||
        !isText(unknown.question) || !isId(unknown.status) || !isText(unknown.why_open)) {
      add(`$.unknowns[${index}]`, "invalid-unknown");
    }
    refs(issues, `$.unknowns[${index}].source_ids`, unknown.source_ids, sourceIds);
  }

  if (!sameKeys(value.boundaries, Object.keys(EXPECTED_BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
  for (const [key, expected] of Object.entries(EXPECTED_BOUNDARIES)) {
    if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");
  }

  if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM ||
      !SHA256.test(value.integrity?.digest ?? "")) {
    add("$.integrity", "invalid-integrity-envelope");
  } else if (value.integrity.digest !== RITONAVIR_MECHANISM_DIGEST) {
    add("$.integrity.digest", "reviewed-digest-mismatch");
  } else if (value.integrity.digest !== ritonavirMechanismDigest(value)) {
    add("$.integrity.digest", "digest-mismatch");
  }

  return issues;
}

export function loadRitonavirMechanismLandscape(path = RITONAVIR_MECHANISM_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyRitonavirMechanismLandscape(value);
  if (issues.length) fail(`ritonavir mechanism landscape refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

export function ritonavirMechanismPublicDiscovery(value = loadRitonavirMechanismLandscape()): Record<string, any> {
  return {
    protocol: value.protocol,
    landscape_id: value.landscape_id,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: RITONAVIR_MECHANISM_URL,
    schema: RITONAVIR_MECHANISM_SCHEMA_URL,
    guide: RITONAVIR_MECHANISM_DOCUMENT_URL,
    source_history: {
      case_id: value.source_history.case_id,
      semantic_digest: value.source_history.semantic_digest,
      relation: value.source_history.relation,
      supersedes_for_current_landscape: value.source_history.supersedes_for_current_landscape,
    },
    integrity: value.integrity,
    counts: {
      planes: value.ontology.planes.length,
      geometries: value.ontology.geometry.length,
      entities: value.entities.length,
      naming_charts: value.naming_charts.length,
      mechanisms: value.mechanisms.length,
      relations: value.relations.length,
      claims: value.claims.length,
      analytical_windows: value.analytical_windows.length,
      unknowns: value.unknowns.length,
      sources: value.sources.length,
    },
    safety: value.plain_language.safety,
    boundary: {
      medical_advice: false,
      interaction_checker: false,
      treatment_change_authority: false,
      direct_crystal_form_to_clinical_outcome: false,
      form_iv_exact_equivalence_established: false,
      complete_solid_form_landscape_established: false,
      experiment_authority: false,
      automatic_action: false,
      public_surface_read_only: true,
    },
  };
}

function overview(value: Record<string, any>): string {
  return [
    value.title,
    "",
    ...value.plain_language.short_answer,
    "",
    `${value.mechanisms.length} mechanisms · ${value.relations.length} typed relations · ${value.unknowns.length} explicit unknowns`,
    `evidence through ${value.evidence_through} · digest ${value.integrity.digest}`,
    "",
    `Safety: ${value.plain_language.safety}`,
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write(
    "usage: ritonavir-mechanism.ts [overview|mechanisms|landscape|sources|unknowns] [--json]\n" +
      "       ritonavir-mechanism.ts verify [FILE] [--json]\n",
  );
  process.exit(2);
}

export async function runRitonavirMechanismCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndex = copy.indexOf("--json");
  const json = jsonIndex !== -1;
  if (json) copy.splice(jsonIndex, 1);
  if (copy.some((arg) => arg.startsWith("-"))) usage();

  if (command === "verify") {
    if (copy.length > 1) usage();
    let issues: RitonavirMechanismIssue[];
    try {
      issues = verifyRitonavirMechanismLandscape(readUnchecked(copy[0] ? resolve(copy[0]) : RITONAVIR_MECHANISM_PATH));
    } catch (error) {
      issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }];
    }
    if (json) process.stdout.write(`${JSON.stringify({ valid: issues.length === 0, issues })}\n`);
    else if (!issues.length) process.stdout.write("Ritonavir mechanism landscape: valid sources, graph, uncertainty, boundaries, and semantic digest; JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }

  if (copy.length) usage();
  const value = loadRitonavirMechanismLandscape();
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (command === "mechanisms") process.stdout.write(`${JSON.stringify({ landscape_id: value.landscape_id, mechanisms: value.mechanisms }, null, json ? 0 : 2)}\n`);
  else if (command === "landscape") process.stdout.write(`${JSON.stringify({ landscape_id: value.landscape_id, entities: value.entities, relations: value.relations }, null, json ? 0 : 2)}\n`);
  else if (command === "sources") process.stdout.write(`${JSON.stringify({ landscape_id: value.landscape_id, sources: value.sources }, null, json ? 0 : 2)}\n`);
  else if (command === "unknowns") process.stdout.write(`${JSON.stringify({ landscape_id: value.landscape_id, unknowns: value.unknowns }, null, json ? 0 : 2)}\n`);
  else usage();
}

if (import.meta.main) {
  try {
    await runRitonavirMechanismCli();
  } catch (error) {
    process.stderr.write(`ritonavir mechanism refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
