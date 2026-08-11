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

export const POLYMORPH_CASE_ID = "ritonavir-disappearing-polymorph-2026-08-11";
export const DEFAULT_POLYMORPH_LOCATOR = "data/polymorphs/ritonavir-disappearing-polymorph.v1.json";
export const DEFAULT_POLYMORPH_PATH = join(ROOT, DEFAULT_POLYMORPH_LOCATOR);
export const POLYMORPH_CASE_URL = `https://thekingdom.dev/polymorphs/${POLYMORPH_CASE_ID}.json`;
export const POLYMORPH_SCHEMA_URL = "https://thekingdom.dev/schemas/polymorph-history/1.json";
export const POLYMORPH_DOCUMENT_URL = "https://thekingdom.dev/RITONAVIR-POLYMORPH.md";

const MAX_BYTES = 1024 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const DATE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;
const CLOCK_YEAR = /\b\d{4}\b/;
const CLOCK_DATE_TOKEN = /\b\d{4}-\d{2}-\d{2}\b/g;
const CLOCK_CUE = /\b(?:before|after|between|during|through|from|to|in|dated|early|late|spring|summer|autumn|fall|winter|observed|observation|reported|published|publication|research|investigation|review|activity|period|manufacture|manufacturing|commercial|development|trial|experiment|work|account|dossier)\b/i;
const HTTPS_LEXICAL = /^https:\/\/[^/]/;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const WAKE_CARRY_FIELDS = [
  "protocol",
  "case_id",
  "integrity.algorithm",
  "integrity.digest",
  "compiled_on",
  "evidence_through",
  "selected_source_ids",
  "selected_claim_ids",
  "translation_language",
] as const;
const WAKE_REVALIDATION_FIELDS = [
  "exact canonical artifact value against the declared integrity algorithm and digest",
  "selected source IDs, locators, and authority notes",
  "selected claim IDs, evidence classes, limitations, and form references",
  "referenced condition vectors, detection methods, thresholds, and limits",
  "evidence-through date against newer, contrary, or superseding evidence",
  "current task scope, audience, intended use, and projection language",
  "current medical, experimental, manufacturing, quality, regulatory, publication, deployment, and action authority",
] as const;
const EVIDENCE_CLASSES = new Set([
  "observation",
  "mechanism_supported",
  "mechanism_hypothesis",
  "retrospective_inference",
  "metaphor",
  "unknown",
]);
const LANGUAGES = ["plain", "solid_state", "process", "evidence", "wake", "kingdom"] as const;

export type PolymorphIssue = { field: string; code: string };

function fail(message: string): never {
  throw new Error(message);
}

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 96 && ID.test(value);
}

function isText(value: unknown, max = 2000): value is string {
  return typeof value === "string" && value.length > 0 && Array.from(value).length <= max;
}

function isStringArray(value: unknown, max = 64): value is string[] {
  return Array.isArray(value) && value.length <= max && value.every((entry) => isText(entry, 1000));
}

function sameKeys(value: unknown, expected: readonly string[]): boolean {
  return isObject(value) && Object.keys(value).sort().join("\u0000") === [...expected].sort().join("\u0000");
}

function idsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject).map((entry) => entry.id).filter(isId);
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function exactStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry === expected[index]);
}

function isCalendarDate(value: unknown, full = false): value is string {
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

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 500 ||
      !HTTPS_LEXICAL.test(value) || value.includes("\\")) return false;
  try {
    const parsed = new URL(value);
    const labels = parsed.hostname.split(".");
    const validHostname = labels.length > 0 && labels.every((label) =>
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
    return parsed.protocol === "https:" && validHostname &&
      parsed.username.length === 0 && parsed.password.length === 0;
  } catch {
    return false;
  }
}

function isClockText(value: unknown): value is string {
  if (!isText(value, 200) || !CLOCK_YEAR.test(value)) return false;
  const dates = value.match(CLOCK_DATE_TOKEN) ?? [];
  if (dates.some((date) => !isCalendarDate(date, true))) return false;
  return dates.length > 0 || CLOCK_CUE.test(value);
}

function arrayOf(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

export function polymorphHistoryDigest(history: Record<string, any>): string {
  const material = structuredClone(history);
  if (!isObject(material.integrity)) fail("polymorph history integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try {
    stat = lstatSync(absolute);
  } catch {
    fail("polymorph history is unavailable");
  }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("polymorph history must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) fail(`polymorph history exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "polymorph history JSON");
}

export function verifyPolymorphHistory(value: unknown): PolymorphIssue[] {
  const issues: PolymorphIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!isObject(value)) return [{ field: "$", code: "must-be-object" }];

  const topKeys = [
    "$schema", "protocol", "case_id", "title", "compiled_on", "evidence_through", "scope", "ontology",
    "forms", "contexts", "sources", "claims", "events", "transitions", "translations",
    "wake_seam", "boundaries", "integrity",
  ];
  if (!sameKeys(value, topKeys)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== "urn:kingdom:schema:polymorph-history:1") add("$.$schema", "protocol-mismatch");
  if (value.protocol !== "kingdom.polymorph-history/0.1") add("$.protocol", "protocol-mismatch");
  if (value.case_id !== POLYMORPH_CASE_ID) add("$.case_id", "unexpected-case-id");
  if (!isText(value.title, 200)) add("$.title", "invalid-text");
  if (!isCalendarDate(value.compiled_on, true)) add("$.compiled_on", "invalid-date");
  if (!isCalendarDate(value.evidence_through, true)) add("$.evidence_through", "invalid-date");
  if (isCalendarDate(value.compiled_on, true) && isCalendarDate(value.evidence_through, true) &&
      value.evidence_through > value.compiled_on) add("$.evidence_through", "evidence-after-compilation");

  if (!sameKeys(value.scope, ["focus", "coverage", "intended_use", "audience", "currentness"])) {
    add("$.scope", "invalid-shape");
  }
  if (!isText(value.scope?.focus) || !isText(value.scope?.coverage) || !isText(value.scope?.intended_use) ||
      !isText(value.scope?.audience) || value.scope?.currentness !== "historical-case-as-of-compilation") {
    add("$.scope", "invalid-boundary");
  }

  if (!sameKeys(value.ontology, ["non_equivalence", "planes", "disappearance", "geometry"])) {
    add("$.ontology", "invalid-shape");
  }
  const expectedPlanes = ["molecule", "conformer", "crystal_lattice", "particle_population", "formulation", "medicine_supply"];
  const planeIds = Array.isArray(value.ontology?.planes)
    ? value.ontology.planes.map((entry: any) => entry?.id).filter((entry: unknown): entry is string => typeof entry === "string")
    : [];
  if (!Array.isArray(value.ontology?.planes) || !unique(planeIds) || planeIds.join("|") !== expectedPlanes.join("|")) {
    add("$.ontology.planes", "plane-order-or-membership-mismatch");
  }
  for (const [index, plane] of arrayOf(value.ontology?.planes).entries()) {
    if (!sameKeys(plane, ["id", "meaning", "does_not_establish"]) || !expectedPlanes.includes(plane.id) ||
        !isText(plane.meaning) || !isText(plane.does_not_establish)) add(`$.ontology.planes[${index}]`, "invalid-plane");
  }
  if (value.ontology?.non_equivalence !== "molecule != conformer != crystal_lattice != particle_population != formulation != medicine_supply") {
    add("$.ontology.non_equivalence", "non-equivalence-mismatch");
  }
  if (!sameKeys(value.ontology?.disappearance, ["predicate", "existence_predicate"]) ||
      value.ontology?.disappearance?.predicate !== "bounded_process_facility_interval_detection" ||
      value.ontology?.disappearance?.existence_predicate !== false) {
    add("$.ontology.disappearance", "literal-extinction-boundary-mismatch");
  }
  if (!Array.isArray(value.ontology?.geometry) || value.ontology.geometry.length < 4) add("$.ontology.geometry", "insufficient-geometry");
  const geometryTerms = arrayOf(value.ontology?.geometry)
    .map((item) => item?.term)
    .filter((term): term is string => typeof term === "string");
  if (!unique(geometryTerms)) add("$.ontology.geometry", "duplicate-geometry-term");
  for (const [index, item] of arrayOf(value.ontology?.geometry).entries()) {
    if (!sameKeys(item, ["term", "maps_to", "limit"]) || !isId(item.term) || !isText(item.maps_to) || !isText(item.limit)) {
      add(`$.ontology.geometry[${index}]`, "invalid-geometry-term");
    }
  }

  const collections = ["forms", "contexts", "sources", "claims", "events", "transitions"] as const;
  const minimums: Record<(typeof collections)[number], number> = {
    forms: 2,
    contexts: 1,
    sources: 1,
    claims: 1,
    events: 1,
    transitions: 1,
  };
  const sets: Record<string, Set<string>> = {};
  for (const name of collections) {
    const ids = idsOf(value[name]);
    if (!Array.isArray(value[name]) || ids.length !== value[name].length || !unique(ids)) add(`$.${name}`, "invalid-or-duplicate-id");
    if (!Array.isArray(value[name]) || value[name].length < minimums[name]) add(`$.${name}`, "collection-too-small");
    sets[name] = new Set(ids);
  }

  for (const [index, form] of arrayOf(value.forms).entries()) {
    if (!sameKeys(form, ["id", "label", "source_scope", "kind", "compound_id", "aliases", "summary"]) ||
        !isId(form.id) || !isText(form.label, 100) || !isText(form.source_scope, 300) || !isId(form.kind) ||
        form.compound_id !== "ritonavir" || !Array.isArray(form.aliases) || !isText(form.summary)) {
      add(`$.forms[${index}]`, "invalid-form");
      continue;
    }
    for (const [aliasIndex, alias] of form.aliases.entries()) {
      if (!sameKeys(alias, ["label", "source_id"]) || !isText(alias.label, 100) || !sets.sources.has(alias.source_id)) {
        add(`$.forms[${index}].aliases[${aliasIndex}]`, "invalid-alias-reference");
      }
    }
  }

  for (const [index, context] of arrayOf(value.contexts).entries()) {
    if (!sameKeys(context, ["id", "label", "kind", "condition_vector", "detection_limit"]) ||
        !isId(context.id) || !isText(context.label, 200) || !isId(context.kind) ||
        !sameKeys(context.condition_vector, ["process", "solvent", "temperature", "supersaturation", "seeding", "mechanical_action", "facility", "material_scale", "interval", "other"]) ||
        !Object.values(context.condition_vector ?? {}).every((entry) => isText(entry)) ||
        !sameKeys(context.detection_limit, ["method", "threshold", "limit"]) ||
        !Object.values(context.detection_limit ?? {}).every((entry) => isText(entry))) {
      add(`$.contexts[${index}]`, "invalid-context");
    }
  }

  for (const [index, source] of arrayOf(value.sources).entries()) {
    if (!sameKeys(source, ["id", "title", "source_kind", "published_on", "url", "doi", "authors", "authority_note"]) ||
        !isId(source.id) || !isText(source.title, 400) || !isId(source.source_kind) ||
        !isCalendarDate(source.published_on) || !isHttpsUrl(source.url) ||
        !(source.doi === null || isText(source.doi, 150)) ||
        !isStringArray(source.authors, 30) || !isText(source.authority_note)) {
      add(`$.sources[${index}]`, "invalid-source");
    }
    if (isCalendarDate(source?.published_on) && isCalendarDate(value.evidence_through, true) &&
        source.published_on > value.evidence_through) {
      add(`$.sources[${index}].published_on`, "source-after-evidence-horizon");
    }
  }

  const references = (path: string, entries: unknown, target: Set<string>, allowEmpty = false) => {
    if (!Array.isArray(entries) || (!allowEmpty && entries.length === 0) ||
        !entries.every((entry) => typeof entry === "string" && target.has(entry)) || !unique(entries)) add(path, "unresolved-reference");
  };

  for (const [index, claim] of arrayOf(value.claims).entries()) {
    if (!sameKeys(claim, ["id", "kind", "summary", "evidence_class", "source_ids", "context_ids", "form_ids", "limitations"]) ||
        !isId(claim.id) || !isId(claim.kind) || !isText(claim.summary) || !EVIDENCE_CLASSES.has(claim.evidence_class) ||
        !isStringArray(claim.limitations, 16) || claim.limitations.length === 0) add(`$.claims[${index}]`, "invalid-claim");
    references(`$.claims[${index}].source_ids`, claim.source_ids, sets.sources);
    references(`$.claims[${index}].context_ids`, claim.context_ids, sets.contexts);
    references(`$.claims[${index}].form_ids`, claim.form_ids, sets.forms, true);
  }

  for (const [index, event] of arrayOf(value.events).entries()) {
    if (!sameKeys(event, ["id", "sequence", "label", "event_time", "observation_time", "publication_time", "context_ids", "claim_ids", "form_states", "disappearance_predicate"]) ||
        !isId(event.id) || !Number.isSafeInteger(event.sequence) || event.sequence < 1 ||
        !isText(event.label, 300) || !isText(event.event_time, 200) ||
        !isText(event.observation_time, 200) || !isText(event.publication_time, 200) ||
        !Array.isArray(event.form_states) || event.form_states.length === 0) {
      add(`$.events[${index}]`, "invalid-event");
    }
    for (const clock of ["event_time", "observation_time", "publication_time"] as const) {
      if (!isClockText(event?.[clock])) {
        add(`$.events[${index}].${clock}`, "invalid-clock");
      }
    }
    references(`$.events[${index}].context_ids`, event.context_ids, sets.contexts);
    references(`$.events[${index}].claim_ids`, event.claim_ids, sets.claims);
    for (const [stateIndex, state] of arrayOf(event.form_states).entries()) {
      if (!sameKeys(state, ["form_id", "status"]) || !sets.forms.has(state.form_id) || !isId(state.status)) {
        add(`$.events[${index}].form_states[${stateIndex}]`, "invalid-form-state");
      }
    }
    if (event.disappearance_predicate !== null &&
        (!sameKeys(event.disappearance_predicate, ["process_scope", "facility_scope", "interval", "detection_predicate", "existence_predicate"]) ||
         !isText(event.disappearance_predicate.process_scope) || !isText(event.disappearance_predicate.facility_scope) ||
         !isText(event.disappearance_predicate.interval) || !isText(event.disappearance_predicate.detection_predicate) ||
         event.disappearance_predicate.existence_predicate !== false)) {
      add(`$.events[${index}].disappearance_predicate`, "invalid-disappearance-predicate");
    }
  }

  const eventSequences = arrayOf(value.events).map((event) => event?.sequence);
  if (!eventSequences.every((sequence, index) => sequence === index + 1)) {
    add("$.events", "event-sequence-mismatch");
  }

  for (const [index, transition] of arrayOf(value.transitions).entries()) {
    if (!sameKeys(transition, ["id", "label", "input_form_ids", "output_form_ids", "context_ids", "claim_ids", "relation", "condition_dependent", "universal"]) ||
        !isId(transition.id) || !isText(transition.label, 300) || !isId(transition.relation) ||
        transition.condition_dependent !== true || transition.universal !== false) add(`$.transitions[${index}]`, "invalid-transition");
    references(`$.transitions[${index}].input_form_ids`, transition.input_form_ids, sets.forms);
    references(`$.transitions[${index}].output_form_ids`, transition.output_form_ids, sets.forms);
    references(`$.transitions[${index}].context_ids`, transition.context_ids, sets.contexts);
    references(`$.transitions[${index}].claim_ids`, transition.claim_ids, sets.claims);
  }

  if (!sameKeys(value.translations, LANGUAGES)) add("$.translations", "language-set-mismatch");
  for (const language of LANGUAGES) {
    const projection = value.translations?.[language];
    if (!sameKeys(projection, ["title", "lines", "boundary"]) || !isText(projection?.title, 200) ||
        !isStringArray(projection?.lines, 16) || projection.lines.length === 0 || !isText(projection?.boundary)) {
      add(`$.translations.${language}`, "invalid-translation");
    }
  }

  const wake = value.wake_seam;
  if (!sameKeys(wake, ["role", "carry_fields", "requires_revalidation", "inherits_identity", "grants_authority", "proves_currentness", "writes_agenttool"]) ||
      wake?.role !== "orientation_by_reference_not_continuity_proof" ||
      !exactStrings(wake?.carry_fields, WAKE_CARRY_FIELDS) ||
      !exactStrings(wake?.requires_revalidation, WAKE_REVALIDATION_FIELDS) ||
      wake?.inherits_identity !== false || wake?.grants_authority !== false || wake?.proves_currentness !== false || wake?.writes_agenttool !== false) {
    add("$.wake_seam", "wake-boundary-mismatch");
  }

  const expectedBoundaries: Record<string, boolean> = {
    literal_extinction_established: false,
    universal_seed_contamination_established: false,
    exclusive_historical_cause_established: false,
    global_stability_ranking_established: false,
    complete_form_landscape_established: false,
    current_product_defect_established: false,
    medical_advice: false,
    dosing_authority: false,
    formulation_instruction: false,
    manufacturing_instruction: false,
    gmp_authority: false,
    batch_release_authority: false,
    regulatory_authority: false,
    experiment_authority: false,
    procurement_authority: false,
    automatic_action: false,
    public_surface_read_only: true,
  };
  if (!sameKeys(value.boundaries, Object.keys(expectedBoundaries))) add("$.boundaries", "boundary-set-mismatch");
  for (const [key, expected] of Object.entries(expectedBoundaries)) {
    if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");
  }

  if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM ||
      typeof value.integrity?.digest !== "string" || !SHA256.test(value.integrity.digest)) {
    add("$.integrity", "invalid-integrity");
  } else {
    try {
      if (polymorphHistoryDigest(value) !== value.integrity.digest) add("$.integrity.digest", "digest-mismatch");
    } catch {
      add("$.integrity.digest", "digest-unavailable");
    }
  }
  return issues;
}

export function loadPolymorphHistory(path = DEFAULT_POLYMORPH_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyPolymorphHistory(value);
  if (issues.length > 0) fail(`polymorph history failed verification at ${issues[0]!.field}: ${issues[0]!.code}`);
  return value as Record<string, any>;
}

export function polymorphPublicDiscovery(history = loadPolymorphHistory()): Record<string, any> {
  return {
    protocol: history.protocol,
    case_id: history.case_id,
    url: POLYMORPH_CASE_URL,
    schema: POLYMORPH_SCHEMA_URL,
    document: POLYMORPH_DOCUMENT_URL,
    compiled_on: history.compiled_on,
    evidence_through: history.evidence_through,
    integrity: history.integrity.digest,
    counts: {
      forms: history.forms.length,
      contexts: history.contexts.length,
      sources: history.sources.length,
      claims: history.claims.length,
      events: history.events.length,
      transitions: history.transitions.length,
      languages: LANGUAGES.length,
    },
    boundary: {
      disappearance: "process-scoped-not-literal-extinction",
      stability: "condition-indexed-not-global-rank",
      causation: "typed-evidence-not-single-myth",
      currentness: "historical-case-as-of-compilation",
      authority: "educational-read-only-no-medical-gmp-or-experimental-authority",
      existence_predicate: false,
      universal_seed_effect: false,
      global_stability_rank: false,
      medical_authority: false,
      manufacturing_authority: false,
      regulatory_authority: false,
      experiment_authority: false,
      writes_agenttool: false,
      automatic_action: false,
    },
  };
}

function renderOverview(history: Record<string, any>): string {
  const plain = history.translations.plain.lines;
  return [
    `${history.title}`,
    "",
    ...plain,
    "",
    `${history.forms.length} source-scoped forms · ${history.events.length} events · ${history.sources.length} cited source records`,
    `digest ${history.integrity.digest}`,
    "",
    "Try: kingdom polymorph timeline | forms | translate wake | evidence seed-effects-conditional | verify",
    `${history.translations.plain.boundary}`,
  ].join("\n") + "\n";
}

function renderForms(history: Record<string, any>): string {
  return history.forms.map((form: any) => `${form.id}\n  ${form.label} · ${form.kind}\n  ${form.summary}`).join("\n\n") + "\n";
}

function renderTimeline(history: Record<string, any>): string {
  return [...history.events].sort((left: any, right: any) => left.sequence - right.sequence).map((event: any) => {
    const suffix = event.disappearance_predicate ? " [bounded disappearance predicate; existence=false]" : "";
    return `${event.sequence}. ${event.event_time} · ${event.label}${suffix}`;
  }).join("\n") + "\n";
}

function renderTranslation(history: Record<string, any>, language: string): string {
  const projection = history.translations[language];
  return `${projection.title}\n\n${projection.lines.join("\n")}\n\nBoundary: ${projection.boundary}\n`;
}

function renderEvidence(history: Record<string, any>, id: string): string {
  const claim = history.claims.find((entry: any) => entry.id === id);
  if (!claim) fail(`unknown claim ${JSON.stringify(id)}`);
  const sources = claim.source_ids.map((sourceId: string) => history.sources.find((entry: any) => entry.id === sourceId));
  const contexts = claim.context_ids.map((contextId: string) => history.contexts.find((entry: any) => entry.id === contextId));
  return [
    `${claim.id} · ${claim.evidence_class} · ${claim.kind}`,
    claim.summary,
    "",
    ...sources.map((source: any) => `source: ${source.title}\n  ${source.url}`),
    ...contexts.map((context: any) => `context: ${context.label}\n  detection: ${context.detection_limit.limit}`),
    ...claim.limitations.map((limit: string) => `limit: ${limit}`),
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write(
    "usage: polymorph.ts [overview] [--json]\n" +
      "       polymorph.ts forms [--json]\n" +
      "       polymorph.ts timeline [--json]\n" +
      "       polymorph.ts translate plain|solid_state|process|evidence|wake|kingdom [--json]\n" +
      "       polymorph.ts evidence CLAIM_ID [--json]\n" +
      "       polymorph.ts show ID [--json]\n" +
      "       polymorph.ts verify [FILE] [--json]\n",
  );
  process.exit(2);
}

function parseCli(args: string[]): { command: string; json: boolean; positional: string[] } {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  let json = false;
  const positional: string[] = [];
  for (const arg of copy) {
    if (arg === "--json") {
      if (json) usage();
      json = true;
    } else if (arg === "--help" || arg === "-h" || arg.startsWith("-")) usage();
    else positional.push(arg);
  }
  return { command, json, positional };
}

async function main(): Promise<void> {
  const cli = parseCli(process.argv.slice(2));
  try {
    if (cli.command === "verify") {
      if (cli.positional.length > 1) usage();
      const path = cli.positional[0] ? resolve(cli.positional[0]) : DEFAULT_POLYMORPH_PATH;
      let issues: PolymorphIssue[];
      try {
        issues = verifyPolymorphHistory(readUnchecked(path));
      } catch (error) {
        issues = [{ field: "$", code: error instanceof Error ? error.message : "history-read-refused" }];
      }
      if (cli.json) process.stdout.write(`${JSON.stringify({ valid: issues.length === 0, issues })}\n`);
      else if (issues.length === 0) process.stdout.write("Polymorph history: valid references, ordered clocks, WAKE seam, boundaries, and semantic digest; JSON Schema not checked\n");
      else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
      process.exit(issues.length === 0 ? 0 : 1);
    }

    const history = loadPolymorphHistory();
    if (cli.command === "overview") {
      if (cli.positional.length) usage();
      process.stdout.write(cli.json ? `${JSON.stringify(history)}\n` : renderOverview(history));
      return;
    }
    if (cli.command === "forms") {
      if (cli.positional.length) usage();
      process.stdout.write(cli.json ? `${JSON.stringify({ case_id: history.case_id, forms: history.forms })}\n` : renderForms(history));
      return;
    }
    if (cli.command === "timeline") {
      if (cli.positional.length) usage();
      const events = [...history.events].sort((left: any, right: any) => left.sequence - right.sequence);
      process.stdout.write(cli.json ? `${JSON.stringify({ case_id: history.case_id, events })}\n` : renderTimeline(history));
      return;
    }
    if (cli.command === "translate") {
      if (cli.positional.length !== 1 || !LANGUAGES.includes(cli.positional[0] as any)) usage();
      const language = cli.positional[0]!;
      process.stdout.write(cli.json ? `${JSON.stringify({ case_id: history.case_id, language, projection: history.translations[language] })}\n` : renderTranslation(history, language));
      return;
    }
    if (cli.command === "evidence") {
      if (cli.positional.length !== 1) usage();
      const claim = history.claims.find((entry: any) => entry.id === cli.positional[0]);
      if (!claim) fail(`unknown claim ${JSON.stringify(cli.positional[0])}`);
      process.stdout.write(cli.json ? `${JSON.stringify({ claim, sources: history.sources.filter((source: any) => claim.source_ids.includes(source.id)), contexts: history.contexts.filter((context: any) => claim.context_ids.includes(context.id)) })}\n` : renderEvidence(history, claim.id));
      return;
    }
    if (cli.command === "show") {
      if (cli.positional.length !== 1) usage();
      const id = cli.positional[0];
      const item = [...history.forms, ...history.contexts, ...history.sources, ...history.claims, ...history.events, ...history.transitions]
        .find((entry: any) => entry.id === id);
      if (!item) fail(`unknown polymorph-history item ${JSON.stringify(id)}`);
      process.stdout.write(`${JSON.stringify(item, null, cli.json ? 0 : 2)}\n`);
      return;
    }
    usage();
  } catch (error) {
    process.stderr.write(`polymorph refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}

if (import.meta.main) await main();
