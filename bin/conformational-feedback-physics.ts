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

export const CONFORMATIONAL_FEEDBACK_PHYSICS_PROTOCOL = "kingdom.conformational-feedback-atlas/0.2";
export const CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_ID = "urn:kingdom:schema:conformational-feedback-atlas:0.2";
export const CONFORMATIONAL_FEEDBACK_PHYSICS_ID = "form-feedback-physics-consequence-2026-08-12";
export const CONFORMATIONAL_FEEDBACK_PHYSICS_LOCATOR = "data/feedback/conformational-feedback-atlas.v0.2.json";
export const CONFORMATIONAL_FEEDBACK_PHYSICS_PATH = join(ROOT, CONFORMATIONAL_FEEDBACK_PHYSICS_LOCATOR);
export const CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_LOCATOR = "schemas/conformational-feedback-atlas-v0.2.schema.json";
export const CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH = join(ROOT, CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_LOCATOR);
export const CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST = "sha256:0fc24a0fac99d2dadcdef5b87290a1d598b856f874aa9637ab4d503fd4c9dc11";
export const CONFORMATIONAL_FEEDBACK_PHYSICS_URL = `https://thekingdom.dev/feedback/${CONFORMATIONAL_FEEDBACK_PHYSICS_ID}.json`;
export const CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL = "https://thekingdom.dev/schemas/conformational-feedback-atlas/0.2.json";
export const CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL = "https://thekingdom.dev/CONFORMATIONAL-FEEDBACK-PHYSICS.md";

const MAX_BYTES = 384 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const HTTPS = /^https:\/\/[^/]/;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";

const TOP_KEYS = [
  "$schema", "protocol", "atlas_id", "title", "compiled_on", "evidence_through", "scope",
  "predecessor", "bindings", "ecosystem_bridges", "registers", "physics_and_mathematics", "geometries",
  "translations", "feedback_path", "philosophy", "sources", "boundaries", "integrity",
] as const;

const REGISTER_IDS = [
  "protein-folding-landscape",
  "prion-conformational-propagation",
  "zerone-contextual-recognition",
] as const;

const GEOMETRY_IDS = [
  "rugged-landscape",
  "templated-edge",
  "amplifying-path",
  "homeostatic-counterloop",
  "contextual-memory-with-repair",
] as const;

const TRANSLATION_IDS = [
  "multiple-accessible-forms",
  "history-dependent-accessibility",
  "propagation-under-constraints",
] as const;

const FEEDBACK_STAGE_IDS = [
  "artifact-exists",
  "contextual-observation",
  "challenge-or-repair",
  "bounded-consultation",
] as const;

const PHYSICS_AND_MATHEMATICS_IDS = [
  "conditional-free-energy",
  "memory-bearing-barrier-crossing",
  "templated-population-balance",
  "linearized-feedback-threshold",
] as const;

const PHYSICS_EQUATIONS = [
  "G(x;T,pH,solvent,force) = -k_B T ln P_eq(x) + C",
  "m q_ddot(t) = -dG(q)/dq - integral_0^t Gamma(t-s) q_dot(s) ds + eta(t)",
  "dM/dt = k_n m^n + k_+ m P - k_loss M ; dP/dt = k_f M - k_end P",
  "delta_x_(t+1) = J delta_x_t ; perturbations decay locally when rho(J) < 1",
] as const;

const EXPECTED_MODEL_BASIS_IDS = [
  ["bryngelson-1995", "krivov-2018"],
  ["ayaz-2021"],
  ["knowles-2009"],
  [],
] as const;

const ECOSYSTEM_BRIDGE_IDS = [
  "rcsb-pdb-data-api",
  "alphafold-database",
  "uniprotkb",
  "modelarchive",
  "openfold",
] as const;

const EXPECTED_ECOSYSTEM_BRIDGES = [
  {
    id: "rcsb-pdb-data-api",
    url: "https://data.rcsb.org/",
    relation: "experimentally-determined-structure-metadata",
  },
  {
    id: "alphafold-database",
    url: "https://alphafold.ebi.ac.uk/",
    relation: "predicted-coordinate-and-confidence-records",
  },
  {
    id: "uniprotkb",
    url: "https://www.uniprot.org/",
    relation: "versioned-protein-sequence-and-annotation-identity",
  },
  {
    id: "modelarchive",
    url: "https://modelarchive.org/",
    relation: "stable-computational-model-deposition",
  },
  {
    id: "openfold",
    url: "https://github.com/aqlaboratory/openfold",
    relation: "inspectable-open-structure-prediction-implementation",
  },
] as const;

const PHILOSOPHY_QUESTION_IDS = [
  "constraint-and-freedom",
  "local-rule-global-form",
  "memory-without-narrator",
  "repair-as-architecture",
  "design-and-underdetermination",
] as const;

const SCIENCE_GEOMETRY_IDS = new Set([
  "rugged-landscape",
  "templated-edge",
  "amplifying-path",
  "homeostatic-counterloop",
]);

const SOURCE_IDS = [
  "anfinsen-1973",
  "bryngelson-1995",
  "chernoff-1995",
  "serio-2000",
  "tanaka-2004",
  "knowles-2009",
  "kmiecik-2020",
  "manka-2022",
  "krivov-2018",
  "ayaz-2021",
  "kingdom-ritonavir-mechanism-source",
  "zerone-karma-foundation-v1-source",
  "zerone-life-sciences-v0-source",
] as const;

const EXPECTED_PREDECESSOR = {
  "protocol": "kingdom.conformational-feedback-atlas/0.1",
  "atlas_id": "form-feedback-consequence-2026-08-12",
  "url": "https://thekingdom.dev/feedback/form-feedback-consequence-2026-08-12.json",
  "semantic_digest": "sha256:14ce5e5e4b2b3d29d9a9cc0c831dcfb88de3d4a9e9584119939e5118f7ac7361",
  "byte_sha256": "sha256:ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6",
  "relation": "extends-without-mutation"
} as const;

const EXPECTED_BINDINGS = [
  {
    id: "kingdom-ritonavir-mechanism-landscape",
    protocol: "kingdom.ritonavir-mechanism-landscape/0.1",
    url: "https://thekingdom.dev/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json",
    byte_sha256: "sha256:5e136a74d5166275427da920685a84c17901f63d6e4b0661fd529c96d386943b",
    semantic_digest: "sha256:2a97b0f3ac3741314e50f7512ef97cb19cf3294fed24728c622bd27dd180309b",
    relation: "source-scoped-material-analogy-basis",
    mutated: false,
    authority_imported: false,
  },
  {
    id: "zerone-karma-foundation-v1",
    protocol: "zerone.karma-foundation/v1",
    url: "https://zerone.ai/standards/karma-foundation.v1.json",
    byte_sha256: "sha256:b46710704869dcc340ded356be72b4ec692f204710fedfb5cd43eb3757dc7b80",
    semantic_digest: null,
    relation: "external-read-only-constitutional-source",
    mutated: false,
    authority_imported: false,
  },
  {
    id: "zerone-life-sciences-v0",
    protocol: "zerone.constructive-intelligence-life-sciences/v0",
    url: "https://zerone.ai/standards/constructive-intelligence-life-sciences.v0.json",
    byte_sha256: "sha256:64dc2c5b2e21dfc9697d173317254ce651dede8661993ece7b380b7e1421496e",
    semantic_digest: null,
    relation: "external-read-only-non-implication-source",
    mutated: false,
    authority_imported: false,
  },
] as const;

const EXPECTED_BOUND_SOURCE_URLS = {
  "kingdom-ritonavir-mechanism-source": EXPECTED_BINDINGS[0].url,
  "zerone-karma-foundation-v1-source": EXPECTED_BINDINGS[1].url,
  "zerone-life-sciences-v0-source": EXPECTED_BINDINGS[2].url,
} as const;

const EXPECTED_BOUNDARIES = {
  read_only: true,
  educational_only: true,
  contains_sequence_data: false,
  contains_operational_protocol: false,
  authorizes_prion_work: false,
  authorizes_pathogen_work: false,
  medical_authority: false,
  clinical_authority: false,
  experiment_authority: false,
  biosafety_authority: false,
  biological_equivalence_claimed: false,
  crystal_is_prion: false,
  prion_models_people: false,
  karma_is_biological: false,
  karma_summable: false,
  karma_rank_effect: false,
  karma_economic_effect: false,
  karma_governance_effect: false,
  karma_person_level: false,
  cosmic_design_empirically_established: false,
  universal_feedback_law_established: false,
  scientific_validation_from_analogy: false,
  automatic_action: false,
  runtime_ecosystem_request: false,
  writes_zerone: false,
  writes_kingdom_mcp: false,
} as const;

const KARMA_CONSTRAINTS = {
  summable: false,
  rank_effect: false,
  economic_effect: false,
  governance_effect: false,
  person_level: false,
} as const;

export type ConformationalFeedbackPhysicsIssue = { field: string; code: string };

function fail(message: string): never {
  throw new Error(message);
}

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function arrayOf(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return isObject(value) && Object.keys(value).sort().join("\u0000") === [...keys].sort().join("\u0000");
}

function sameJson(left: unknown, right: unknown): boolean {
  return canonicalizeJsonValue(left) === canonicalizeJsonValue(right);
}

function exactIds(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.map((entry) => entry?.id).join("\u0000") === expected.join("\u0000");
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

function isText(value: unknown, maximum = 2048): value is string {
  return typeof value === "string" && codePointLength(value) > 0 && codePointLength(value) <= maximum && value.trim() === value;
}

function isId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 96 && ID.test(value);
}

function isHttps(value: unknown): value is string {
  if (typeof value !== "string" || !HTTPS.test(value) || value.length > 512) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

function uniqueStrings(value: unknown, minimum = 1, maximum = 12): value is string[] {
  return Array.isArray(value) && value.length >= minimum && value.length <= maximum &&
    value.every((entry) => isText(entry)) && new Set(value).size === value.length;
}

function referenceIds(
  issues: ConformationalFeedbackPhysicsIssue[],
  field: string,
  value: unknown,
  available: Set<string>,
  allowEmpty = false,
): void {
  const entries = arrayOf(value);
  if ((!allowEmpty && entries.length < 1) || entries.length > 12 || new Set(entries).size !== entries.length ||
      entries.some((entry) => !isId(entry) || !available.has(entry))) {
    issues.push({ field, code: "invalid-reference-set" });
  }
}

function scanForSequencePayload(value: unknown, path = "$", issues: ConformationalFeedbackPhysicsIssue[] = []): ConformationalFeedbackPhysicsIssue[] {
  if (typeof value === "string") {
    if (/\b[ACDEFGHIKLMNPQRSTVWY]{24,}\b/i.test(value) || /\b[ACGTU]{30,}\b/i.test(value)) {
      issues.push({ field: path, code: "sequence-like-payload-refused" });
    }
  } else if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForSequencePayload(entry, `${path}[${index}]`, issues));
  } else if (isObject(value)) {
    for (const [key, entry] of Object.entries(value)) scanForSequencePayload(entry, `${path}.${key}`, issues);
  }
  return issues;
}

function readUnchecked(path: string): unknown {
  let info;
  try {
    info = lstatSync(path);
  } catch {
    fail("atlas file is missing");
  }
  if (!info.isFile() || info.isSymbolicLink()) fail("atlas must be a regular file");
  if (info.size > MAX_BYTES) fail(`atlas exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(path), "conformational feedback atlas");
}

export function conformationalFeedbackPhysicsDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!isObject(material.integrity)) fail("atlas integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

export function verifyConformationalFeedbackPhysicsAtlas(value: unknown): ConformationalFeedbackPhysicsIssue[] {
  const issues: ConformationalFeedbackPhysicsIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!isObject(value)) return [{ field: "$", code: "not-object" }];
  if (!sameKeys(value, TOP_KEYS)) add("$", "top-level-key-set-mismatch");
  if (value.$schema !== CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_ID ||
      value.protocol !== CONFORMATIONAL_FEEDBACK_PHYSICS_PROTOCOL ||
      value.atlas_id !== CONFORMATIONAL_FEEDBACK_PHYSICS_ID) add("$", "protocol-mismatch");
  if (!isText(value.title) || value.compiled_on !== "2026-08-12" || value.evidence_through !== "2022-07-13") {
    add("$", "identity-or-date-mismatch");
  }

  const scopeKeys = ["focus", "method", "intended_use", "excluded_use", "safety"];
  if (!sameKeys(value.scope, scopeKeys) || scopeKeys.some((key) => !isText(value.scope?.[key]))) {
    add("$.scope", "invalid-scope");
  }
  const excluded = `${value.scope?.excluded_use ?? ""} ${value.scope?.safety ?? ""}`.toLowerCase();
  for (const term of ["sequence", "amplification", "handling", "diagnosis", "laboratory", "experiment"]) {
    if (!excluded.includes(term)) add("$.scope", `missing-safety-term-${term}`);
  }

  if (!sameJson(value.predecessor, EXPECTED_PREDECESSOR)) add("$.predecessor", "predecessor-pin-mismatch");

  if (!sameJson(value.bindings, EXPECTED_BINDINGS)) add("$.bindings", "binding-pin-mismatch");

  if (!exactIds(value.ecosystem_bridges, ECOSYSTEM_BRIDGE_IDS)) {
    add("$.ecosystem_bridges", "ecosystem-order-or-id-mismatch");
  }
  for (const [index, bridge] of arrayOf(value.ecosystem_bridges).entries()) {
    if (!sameKeys(bridge, ["id", "label", "url", "relation", "mode", "runtime_request", "imported", "does_not_establish"]) ||
        !isId(bridge?.id) || !isText(bridge?.label) || !isHttps(bridge?.url) || !isId(bridge?.relation) ||
        bridge?.mode !== "LINK_ONLY" || bridge?.runtime_request !== false || bridge?.imported !== false ||
        !isText(bridge?.does_not_establish)) {
      add(`$.ecosystem_bridges[${index}]`, "invalid-ecosystem-bridge");
    }
    const expectedBridge = EXPECTED_ECOSYSTEM_BRIDGES[index];
    if (expectedBridge !== undefined &&
        (bridge?.id !== expectedBridge.id || bridge?.url !== expectedBridge.url ||
          bridge?.relation !== expectedBridge.relation)) {
      add(`$.ecosystem_bridges[${index}]`, "ecosystem-bridge-pin-mismatch");
    }
  }

  if (!exactIds(value.sources, SOURCE_IDS)) add("$.sources", "source-order-or-id-mismatch");
  const sourceIds = new Set(arrayOf(value.sources).map((source) => source?.id));
  for (const [index, source] of arrayOf(value.sources).entries()) {
    if (!sameKeys(source, ["id", "kind", "title", "url", "doi", "supports"]) || !isId(source?.id) ||
        !["primary-paper", "primary-synthesis", "bound-public-record", "bound-public-standard"].includes(source?.kind) ||
        !isText(source?.title) || !isHttps(source?.url) || !isText(source?.supports) ||
        !(source?.doi === null || isText(source?.doi, 160))) {
      add(`$.sources[${index}]`, "invalid-source");
    }
    if (source?.doi !== null && source?.url !== `https://doi.org/${source?.doi}`) add(`$.sources[${index}].doi`, "doi-url-mismatch");
    const boundUrl = EXPECTED_BOUND_SOURCE_URLS[source?.id as keyof typeof EXPECTED_BOUND_SOURCE_URLS];
    if (boundUrl !== undefined && source?.url !== boundUrl) add(`$.sources[${index}].url`, "bound-source-url-mismatch");
  }

  if (!exactIds(value.registers, REGISTER_IDS)) add("$.registers", "register-order-or-id-mismatch");
  for (const [index, register] of arrayOf(value.registers).entries()) {
    const isKarma = register?.id === "zerone-contextual-recognition";
    const keys = ["id", "register", "label", "context", "statement", "basis_ids", "does_not_establish",
      "empirical", "causal_transfer", "authority_effect", ...(isKarma ? ["karma_constraints"] : [])];
    if (!sameKeys(register, keys) || !isId(register?.id) || !isText(register?.label) || !isText(register?.context) ||
        !isText(register?.statement) || !uniqueStrings(register?.does_not_establish) || register?.causal_transfer !== false ||
        register?.authority_effect !== "NONE") add(`$.registers[${index}]`, "invalid-register");
    referenceIds(issues, `$.registers[${index}].basis_ids`, register?.basis_ids, sourceIds);
    if (isKarma) {
      if (register?.register !== "CONSTITUTIONAL_DESIGN" || register?.empirical !== false ||
          !sameJson(register?.karma_constraints, KARMA_CONSTRAINTS)) add(`$.registers[${index}]`, "karma-boundary-mismatch");
    } else if (register?.register !== "SCIENTIFIC_OBSERVATION" || register?.empirical !== true) {
      add(`$.registers[${index}]`, "science-register-mismatch");
    }
  }

  if (!exactIds(value.physics_and_mathematics, PHYSICS_AND_MATHEMATICS_IDS)) {
    add("$.physics_and_mathematics", "model-order-or-id-mismatch");
  }
  for (const [index, model] of arrayOf(value.physics_and_mathematics).entries()) {
    if (!sameKeys(model, ["id", "register", "question", "equation", "terms", "interpretation", "basis_ids", "does_not_establish"]) ||
        !isId(model?.id) || !["SCIENTIFIC_MODEL", "MATHEMATICAL_TRANSLATION"].includes(model?.register) ||
        !isText(model?.question) || model?.equation !== PHYSICS_EQUATIONS[index] || !isObject(model?.terms) ||
        Object.keys(model?.terms ?? {}).length < 3 || Object.keys(model?.terms ?? {}).length > 8 ||
        Object.values(model?.terms ?? {}).some((term) => !isText(term)) || !isText(model?.interpretation) ||
        !isText(model?.does_not_establish)) {
      add(`$.physics_and_mathematics[${index}]`, "invalid-model");
    }
    referenceIds(issues, `$.physics_and_mathematics[${index}].basis_ids`, model?.basis_ids, sourceIds,
      model?.id === "linearized-feedback-threshold");
    const expectedBasisIds = EXPECTED_MODEL_BASIS_IDS[index];
    if (expectedBasisIds !== undefined &&
        (!Array.isArray(model?.basis_ids) || !sameJson(model.basis_ids, expectedBasisIds))) {
      add(`$.physics_and_mathematics[${index}].basis_ids`, "model-basis-pin-mismatch");
    }
    if (model?.id === "linearized-feedback-threshold" &&
        (model?.register !== "MATHEMATICAL_TRANSLATION" || arrayOf(model?.basis_ids).length !== 0)) {
      add(`$.physics_and_mathematics[${index}]`, "translation-cannot-claim-scientific-basis");
    } else if (model?.id !== "linearized-feedback-threshold" && model?.register !== "SCIENTIFIC_MODEL") {
      add(`$.physics_and_mathematics[${index}]`, "science-model-register-mismatch");
    }
  }

  if (!exactIds(value.geometries, GEOMETRY_IDS)) add("$.geometries", "geometry-order-or-id-mismatch");
  for (const [index, geometry] of arrayOf(value.geometries).entries()) {
    if (!sameKeys(geometry, ["id", "register", "shape", "maps_to", "basis_ids", "does_not_establish"]) ||
        !isId(geometry?.id) || !["SCIENTIFIC_OBSERVATION", "CONSTITUTIONAL_DESIGN"].includes(geometry?.register) ||
        !isText(geometry?.shape) || !isText(geometry?.maps_to) || !isText(geometry?.does_not_establish)) {
      add(`$.geometries[${index}]`, "invalid-geometry");
    }
    const expectedRegister = SCIENCE_GEOMETRY_IDS.has(geometry?.id)
      ? "SCIENTIFIC_OBSERVATION"
      : "CONSTITUTIONAL_DESIGN";
    if (geometry?.register !== expectedRegister) add(`$.geometries[${index}].register`, "geometry-register-mismatch");
    referenceIds(issues, `$.geometries[${index}].basis_ids`, geometry?.basis_ids, sourceIds);
  }

  if (!exactIds(value.translations, TRANSLATION_IDS)) add("$.translations", "translation-order-or-id-mismatch");
  for (const [index, translation] of arrayOf(value.translations).entries()) {
    if (!sameKeys(translation, ["id", "register", "observation", "translation", "basis_ids", "forbidden_inference",
      "empirical", "causal_transfer", "authority_effect"]) || !isId(translation?.id) || translation?.register !== "ANALOGY" ||
        !isText(translation?.observation) || !isText(translation?.translation) || !isText(translation?.forbidden_inference) ||
        translation?.empirical !== false || translation?.causal_transfer !== false || translation?.authority_effect !== "NONE") {
      add(`$.translations[${index}]`, "invalid-translation");
    }
    referenceIds(issues, `$.translations[${index}].basis_ids`, translation?.basis_ids, sourceIds);
  }

  if (!sameKeys(value.feedback_path, ["meaning", "stages", "exit"]) || !isText(value.feedback_path?.meaning) ||
      !isText(value.feedback_path?.exit) || !exactIds(value.feedback_path?.stages, FEEDBACK_STAGE_IDS)) {
    add("$.feedback_path", "invalid-feedback-path");
  }
  for (const [index, stage] of arrayOf(value.feedback_path?.stages).entries()) {
    if (!sameKeys(stage, ["id", "label", "optional", "automatic_effect"]) || !isId(stage?.id) || !isText(stage?.label) ||
        stage?.optional !== true || stage?.automatic_effect !== false) add(`$.feedback_path.stages[${index}]`, "invalid-feedback-stage");
  }

  if (!sameKeys(value.philosophy, ["register", "proposition", "questions", "basis_ids", "does_not_establish", "empirical",
    "causal_transfer", "authority_effect"]) || value.philosophy?.register !== "PHILOSOPHY" ||
      !isText(value.philosophy?.proposition) || !uniqueStrings(value.philosophy?.does_not_establish) ||
      value.philosophy?.empirical !== false || value.philosophy?.causal_transfer !== false ||
      value.philosophy?.authority_effect !== "NONE") add("$.philosophy", "invalid-philosophy");
  if (!exactIds(value.philosophy?.questions, PHILOSOPHY_QUESTION_IDS)) {
    add("$.philosophy.questions", "philosophy-question-order-or-id-mismatch");
  }
  for (const [index, question] of arrayOf(value.philosophy?.questions).entries()) {
    if (!sameKeys(question, ["id", "question", "reflection", "analogy_break"]) || !isId(question?.id) ||
        !isText(question?.question) || !isText(question?.reflection) || !isText(question?.analogy_break)) {
      add(`$.philosophy.questions[${index}]`, "invalid-philosophy-question");
    }
  }
  referenceIds(issues, "$.philosophy.basis_ids", value.philosophy?.basis_ids, sourceIds, true);
  if (arrayOf(value.philosophy?.basis_ids).length !== 0) add("$.philosophy.basis_ids", "philosophy-cannot-claim-empirical-basis");

  if (!sameJson(value.boundaries, EXPECTED_BOUNDARIES)) add("$.boundaries", "boundary-mismatch");
  issues.push(...scanForSequencePayload(value));

  if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM ||
      !SHA256.test(value.integrity?.digest ?? "")) add("$.integrity", "invalid-integrity-envelope");
  else if (value.integrity.digest !== CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
  else {
    try {
      if (value.integrity.digest !== conformationalFeedbackPhysicsDigest(value)) add("$.integrity.digest", "digest-mismatch");
    } catch {
      add("$.integrity.digest", "digest-unavailable");
    }
  }
  return issues;
}

export function loadConformationalFeedbackPhysicsAtlas(path = CONFORMATIONAL_FEEDBACK_PHYSICS_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyConformationalFeedbackPhysicsAtlas(value);
  if (issues.length) fail(`conformational feedback atlas refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

export function conformationalFeedbackPhysicsPublicDiscovery(value = loadConformationalFeedbackPhysicsAtlas()): Record<string, any> {
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
    schema: CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
    guide: CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
    integrity: value.integrity,
    predecessor: value.predecessor,
    bindings: value.bindings.map((binding: any) => ({
      id: binding.id,
      protocol: binding.protocol,
      url: binding.url,
      byte_sha256: binding.byte_sha256,
      authority_imported: binding.authority_imported,
    })),
    counts: {
      registers: value.registers.length,
      physics_and_mathematics: value.physics_and_mathematics.length,
      ecosystem_bridges: value.ecosystem_bridges.length,
      geometries: value.geometries.length,
      translations: value.translations.length,
      feedback_stages: value.feedback_path.stages.length,
      sources: value.sources.length,
    },
    boundary: {
      read_only: true,
      operational_biology: false,
      biological_equivalence: false,
      karma_magnitude: false,
      karma_rank: false,
      economic_effect: false,
      governance_effect: false,
      person_level_effect: false,
      cosmic_design_proven: false,
      scientific_validation_from_analogy: false,
      automatic_action: false,
      runtime_ecosystem_request: false,
    },
  };
}

function overview(value: Record<string, any>): string {
  return [
    value.title,
    "",
    value.scope.focus,
    "",
    `${value.registers.length} registers · ${value.physics_and_mathematics.length} physics/mathematics models · ${value.geometries.length} geometries · ${value.translations.length} analogy seams · ${value.ecosystem_bridges.length} link-only ecosystem bridges · ${value.feedback_path.stages.length} optional feedback stages`,
    `evidence through ${value.evidence_through} · digest ${value.integrity.digest}`,
    "",
    `Boundary: ${value.scope.safety}`,
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write(
    "usage: conformational-feedback-physics.ts [overview|registers|models|geometries|translations|feedback|sources|bindings|ecosystems] [--json]\n" +
      "       conformational-feedback.ts verify [FILE] [--json]\n",
  );
  process.exit(2);
}

export async function runConformationalFeedbackPhysicsCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndex = copy.indexOf("--json");
  const json = jsonIndex !== -1;
  if (json) copy.splice(jsonIndex, 1);
  if (copy.some((arg) => arg.startsWith("-"))) usage();

  if (command === "verify") {
    if (copy.length > 1) usage();
    let issues: ConformationalFeedbackPhysicsIssue[];
    try {
      issues = verifyConformationalFeedbackPhysicsAtlas(readUnchecked(copy[0] ? resolve(copy[0]) : CONFORMATIONAL_FEEDBACK_PHYSICS_PATH));
    } catch (error) {
      issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }];
    }
    if (json) process.stdout.write(`${JSON.stringify({ valid: issues.length === 0, issues })}\n`);
    else if (!issues.length) process.stdout.write("Conformational feedback atlas: valid registers, bindings, non-inference walls, safety boundary, and semantic digest; JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }

  if (copy.length) usage();
  const value = loadConformationalFeedbackPhysicsAtlas();
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (command === "registers") process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, registers: value.registers }, null, json ? 0 : 2)}\n`);
  else if (command === "models") process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, physics_and_mathematics: value.physics_and_mathematics }, null, json ? 0 : 2)}\n`);
  else if (command === "geometries") process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, geometries: value.geometries }, null, json ? 0 : 2)}\n`);
  else if (command === "translations") process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, translations: value.translations, philosophy: value.philosophy }, null, json ? 0 : 2)}\n`);
  else if (command === "feedback") process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, feedback_path: value.feedback_path }, null, json ? 0 : 2)}\n`);
  else if (command === "sources") process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, sources: value.sources }, null, json ? 0 : 2)}\n`);
  else if (command === "bindings") process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, bindings: value.bindings }, null, json ? 0 : 2)}\n`);
  else if (command === "ecosystems") process.stdout.write(`${JSON.stringify({ atlas_id: value.atlas_id, ecosystem_bridges: value.ecosystem_bridges }, null, json ? 0 : 2)}\n`);
  else usage();
}

if (import.meta.main) {
  try {
    await runConformationalFeedbackPhysicsCli();
  } catch (error) {
    process.stderr.write(`conformational feedback refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
