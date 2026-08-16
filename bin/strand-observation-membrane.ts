#!/usr/bin/env bun
/** Bounded STRAND observer. Imports, status, verification, and simulation are offline. */

import { createHash } from "node:crypto";
import { lookup as dnsLookup } from "node:dns/promises";
import { lstatSync, readFileSync } from "node:fs";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { dirname, join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAX_FILE_BYTES = 256 * 1024;
const MAX_JSON_NODES = 20_000;
const MAX_JSON_STRING_CODE_UNITS = MAX_FILE_BYTES;
const ZERO_SHA256 = `sha256:${"0".repeat(64)}`;
const TOP_KEYS = [
  "$schema", "protocol", "membrane_id", "version", "title", "subtitle", "activated_on",
  "mode", "separation", "fixed_origin", "activations", "user_agent", "standards",
  "live_limits", "robots_gate", "route_plan", "synthetic_fixture", "validation_contract",
  "effect_boundary", "commands", "integrity",
] as const;

export const STRAND_OBSERVATION_MEMBRANE_PROTOCOL = "kingdom.strand-observation-membrane/0.1";
export const STRAND_OBSERVATION_VALIDATION_PROTOCOL = "kingdom.strand-observation-membrane-validation/0.1";
export const STRAND_OBSERVATION_LIVE_REPORT_PROTOCOL = "kingdom.strand-observation-live-report/0.1";
export const STRAND_OBSERVATION_MEMBRANE_SCHEMA_ID = "https://thekingdom.dev/schemas/strand-observation-membrane/0.1.json";
export const STRAND_OBSERVATION_MEMBRANE_ID = "strand-observation-membrane-05-2026-08-16";
export const STRAND_OBSERVATION_MEMBRANE_LOCATOR = "data/observation/strand-observation-membrane.v0.1.json";
export const STRAND_OBSERVATION_MEMBRANE_PATH = join(ROOT, STRAND_OBSERVATION_MEMBRANE_LOCATOR);
export const STRAND_OBSERVATION_MEMBRANE_SCHEMA_LOCATOR = "schemas/strand-observation-membrane-v0.1.schema.json";
export const STRAND_OBSERVATION_MEMBRANE_SCHEMA_PATH = join(ROOT, STRAND_OBSERVATION_MEMBRANE_SCHEMA_LOCATOR);
export const STRAND_OBSERVATION_MEMBRANE_GUIDE_LOCATOR = "references/strand-observation-membrane.md";
export const STRAND_OBSERVATION_MEMBRANE_GUIDE_PATH = join(ROOT, STRAND_OBSERVATION_MEMBRANE_GUIDE_LOCATOR);
export const STRAND_OBSERVATION_MEMBRANE_URL = "https://thekingdom.dev/observations/strand-observation-membrane-2026-08-16.json";
export const STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL = "https://thekingdom.dev/schemas/strand-observation-membrane/0.1.json";
export const STRAND_OBSERVATION_MEMBRANE_GUIDE_URL = "https://thekingdom.dev/STRAND-OBSERVATION-MEMBRANE.md";
export const STRAND_OBSERVATION_FIXED_ORIGIN = "https://thekingdom.dev:443";
export const STRAND_OBSERVATION_USER_AGENT = "KingdomStrandObservation/0.1 (+https://thekingdom.dev/STRAND-OBSERVATION-MEMBRANE.md)";
export const STRAND_OBSERVATION_ROBOTS_BYTE_SHA256 = "sha256:a58329bcbe9775e4552200ac4bc292cc7dc6f1022c8f4c296639eb11b240a751";

// Freeze these only after the record, schema, and guide pass independent review.
export const STRAND_OBSERVATION_MEMBRANE_DIGEST = "sha256:553546a3d41eb8b53742f06b3148423b8e63d759c06776c04fc5d0da65df70bf";
export const STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256 = "sha256:8c36ef9b9f917d68e1e60326bfc3446e6769b21439901fd74a7ad018a94ac0a5";
export const STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256 = "sha256:abdeb33f09d92bfba05eeb285817ded3281140c580f414d255ebc369f10d8dee";
export const STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256 = "sha256:9922343b3f63be6c514d81dc52ffed424284244d072d350a43924e8c8d13fe79";

type JsonRecord = Record<string, any>;
export type StrandObservationIssue = { field: string; code: string };
export type StrandObservationCheck = { id: string; status: "PASS" | "FAIL" | "PENDING_AUDIT"; detail: string };
export type StrandObservationSimulation = {
  protocol: "kingdom.strand-observation-simulation/0.1";
  fixture_id: string | null;
  valid: boolean;
  transactions_started: number;
  transactions_completed: number;
  total_body_bytes: number;
  status_counts: Record<string, number>;
  minimum_observed_start_gap_milliseconds: number | null;
  robots_gate_passes: boolean;
  all_planned_routes_observed: boolean;
  within_limits: boolean;
};
export type StrandObservationValidation = {
  protocol: typeof STRAND_OBSERVATION_VALIDATION_PROTOCOL;
  membrane_protocol: typeof STRAND_OBSERVATION_MEMBRANE_PROTOCOL;
  membrane_id: string | null;
  mode: "SAFE_OBSERVATION_ACTIVE" | null;
  valid: boolean;
  input_digest: string | null;
  checks: StrandObservationCheck[];
  simulation: StrandObservationSimulation;
  issues: StrandObservationIssue[];
  effects: ReturnType<typeof offlineEffects>;
};

function sha256Bytes(bytes: Uint8Array): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function readStrictBytes(path: string, label: string): Uint8Array {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { throw new Error(`${label} is unavailable`); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular non-symlink file`);
  if (stat.size > MAX_FILE_BYTES) throw new Error(`${label} exceeds ${MAX_FILE_BYTES} bytes`);
  return readFileSync(absolute);
}

function safeOwnDataContainer(value: object, prototype: object | null, arrayLength?: number): boolean {
  try {
    if (Object.getPrototypeOf(value) !== prototype || Object.getOwnPropertySymbols(value).length !== 0) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    if (keys.some((key) => typeof key !== "string" || key === "__proto__" ||
      !("value" in descriptors[key]!) ||
      (arrayLength === undefined || key !== "length") && descriptors[key]!.enumerable !== true)) return false;
    if (arrayLength === undefined) return true;
    const expected = Array.from({ length: arrayLength }, (_, index) => String(index));
    return keys.length === expected.length + 1 && descriptors.length?.enumerable === false &&
      descriptors.length?.value === arrayLength && expected.every((key) => Object.hasOwn(descriptors, key));
  } catch { return false; }
}

function object(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    safeOwnDataContainer(value, Object.prototype);
}

function jsonArray(value: unknown): value is any[] {
  return Array.isArray(value) && safeOwnDataContainer(value, Array.prototype, value.length);
}

function strictJsonTree(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
  budget = { nodes: 0, stringCodeUnits: 0 },
): boolean {
  try {
    budget.nodes += 1;
    if (budget.nodes > MAX_JSON_NODES || depth > 64) return false;
    if (typeof value === "string") {
      budget.stringCodeUnits += value.length;
      return budget.stringCodeUnits <= MAX_JSON_STRING_CODE_UNITS;
    }
    if (value === null || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value !== "object" || seen.has(value)) return false;
    seen.add(value);
    const arrayValue = Array.isArray(value);
    if (arrayValue ? !jsonArray(value) : !object(value)) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (arrayValue && key === "length") continue;
      if (!("value" in descriptor) || !strictJsonTree(descriptor.value, depth + 1, seen, budget)) return false;
    }
    seen.delete(value);
    return true;
  } catch { return false; }
}

function sameKeys(value: unknown, keys: readonly string[]): boolean {
  try {
    return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
  } catch { return false; }
}

function deepEqual(left: unknown, right: unknown): boolean {
  try { return isDeepStrictEqual(left, right); } catch { return false; }
}

function issueSort(issues: StrandObservationIssue[]): StrandObservationIssue[] {
  const unique = new Map(issues.map((entry) => [`${entry.field}\0${entry.code}`, entry]));
  return [...unique.values()].sort((left, right) =>
    left.field.localeCompare(right.field) || left.code.localeCompare(right.code));
}

function loadCanonicalUnchecked(): JsonRecord {
  const value = parseStrictJsonBytes(readStrictBytes(STRAND_OBSERVATION_MEMBRANE_PATH, "observation membrane"), "observation membrane JSON");
  if (!object(value)) throw new Error("observation membrane must be an object");
  return value;
}

export function strandObservationMembraneDigest(value: unknown): string {
  if (!strictJsonTree(value) || !object(value) || !object(value.integrity)) {
    throw new Error("observation membrane is not a bounded strict JSON object");
  }
  const material = structuredClone(value);
  material.integrity.digest = null;
  return sha256Bytes(new TextEncoder().encode(canonicalizeJsonValue(material)));
}

function offlineEffects() {
  return {
    network_requests: 0,
    storage_writes: 0,
    subprocesses: 0,
    mcp_invocation: false,
    ability_invocation: false,
    nen_invocation: false,
    kingdom_karma_receipt_created: false,
    zerone_event_created: false,
    person_or_content_score_created: false,
    medical_or_dmt_action: false,
    entity_truth_claim: false,
    authority_effect: "NONE" as const,
    deployment_or_publication_trigger: false,
  };
}

export function simulateStrandObservationMembrane(input: unknown): StrandObservationSimulation {
  const empty: StrandObservationSimulation = {
    protocol: "kingdom.strand-observation-simulation/0.1",
    fixture_id: null,
    valid: false,
    transactions_started: 0,
    transactions_completed: 0,
    total_body_bytes: 0,
    status_counts: {},
    minimum_observed_start_gap_milliseconds: null,
    robots_gate_passes: false,
    all_planned_routes_observed: false,
    within_limits: false,
  };
  try {
    if (!strictJsonTree(input) || !object(input)) return empty;
    const fixture = input.synthetic_fixture;
    const plan = input.route_plan;
    const limits = input.live_limits;
    if (!object(fixture) || !jsonArray(fixture.responses) || !jsonArray(plan) || !object(limits)) return empty;
    const responses = fixture.responses as JsonRecord[];
    if (!responses.every(object)) return empty;
    const total = responses.reduce((sum, response) => sum +
      (Number.isSafeInteger(response.body_bytes) && response.body_bytes >= 0 ? response.body_bytes : Number.POSITIVE_INFINITY), 0);
    const counts: Record<string, number> = {};
    for (const response of responses) {
      if (!Number.isInteger(response.status)) return empty;
      const key = String(response.status);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const starts = responses.map((response) => response.start_millisecond);
    if (!starts.every((entry) => Number.isSafeInteger(entry) && entry >= 0)) return empty;
    const gaps = starts.slice(1).map((entry, index) => entry - starts[index]!);
    const minimumGap = gaps.length === 0 ? null : Math.min(...gaps);
    const routesAlign = responses.length === plan.length && responses.every((response, index) =>
      response.route_id === plan[index]?.route_id);
    const robots = responses[0];
    const robotsPass = robots?.route_id === "robots" && robots.status === 200 &&
      robots.robots_snapshot_matches === true && robots.robots_allows === true;
    const within = responses.length <= limits.maximum_transactions &&
      responses.every((response) => response.body_bytes <= limits.maximum_response_bytes) &&
      total <= limits.maximum_run_bytes &&
      (minimumGap === null || minimumGap >= limits.minimum_start_gap_milliseconds);
    return {
      ...empty,
      fixture_id: typeof fixture.fixture_id === "string" ? fixture.fixture_id : null,
      valid: routesAlign && robotsPass && within,
      transactions_started: responses.length,
      transactions_completed: responses.length,
      total_body_bytes: total,
      status_counts: Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right))),
      minimum_observed_start_gap_milliseconds: minimumGap,
      robots_gate_passes: robotsPass,
      all_planned_routes_observed: routesAlign,
      within_limits: within,
    };
  } catch { return empty; }
}

export function verifyStrandObservationMembrane(input: unknown): StrandObservationIssue[] {
  try {
    const issues: StrandObservationIssue[] = [];
    const add = (field: string, code: string) => issues.push({ field, code });
    if (!strictJsonTree(input) || !object(input)) return [{ field: "$", code: "UNSAFE_OR_NON_JSON_INPUT" }];
    if (!sameKeys(input, TOP_KEYS)) add("$", "UNEXPECTED_SHAPE");
    const canonical = loadCanonicalUnchecked();
    const identity = ["$schema", "protocol", "membrane_id", "version", "title", "subtitle", "activated_on", "mode"];
    for (const field of identity) if (!deepEqual(input[field], canonical[field])) add(field, "IDENTITY_DRIFT");
    for (const field of [
      "separation", "fixed_origin", "activations", "user_agent", "standards", "live_limits",
      "robots_gate", "route_plan", "synthetic_fixture", "validation_contract", "effect_boundary", "commands",
    ]) if (!deepEqual(input[field], canonical[field])) add(field, "CONTRACT_DRIFT");
    if (!object(input.integrity) || !sameKeys(input.integrity,
      ["algorithm", "digest", "digest_field_treated_as", "audit_state"])) add("integrity", "UNEXPECTED_SHAPE");
    else if (input.integrity.algorithm !== canonical.integrity.algorithm ||
      input.integrity.digest_field_treated_as !== canonical.integrity.digest_field_treated_as) {
      add("integrity", "INTEGRITY_METADATA_DRIFT");
    } else if (input.integrity.audit_state === "PENDING_INDEPENDENT_AUDIT") {
      if (input.integrity.digest !== ZERO_SHA256 || STRAND_OBSERVATION_MEMBRANE_DIGEST !== ZERO_SHA256 ||
        STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256 !== ZERO_SHA256 ||
        STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256 !== ZERO_SHA256 ||
        STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256 !== ZERO_SHA256) {
        add("integrity", "PENDING_SENTINEL_DRIFT");
      }
    } else if (input.integrity.audit_state === "FROZEN") {
      if (input.integrity.digest !== STRAND_OBSERVATION_MEMBRANE_DIGEST ||
        strandObservationMembraneDigest(input) !== STRAND_OBSERVATION_MEMBRANE_DIGEST) add("integrity.digest", "DIGEST_MISMATCH");
    } else add("integrity.audit_state", "UNKNOWN_AUDIT_STATE");
    const simulation = simulateStrandObservationMembrane(input);
    if (!simulation.valid || !deepEqual(simulation, {
      protocol: "kingdom.strand-observation-simulation/0.1",
      fixture_id: input.synthetic_fixture?.fixture_id ?? null,
      valid: true,
      ...input.synthetic_fixture?.expected,
    })) add("synthetic_fixture.expected", "RECOMPUTATION_MISMATCH");
    return issueSort(issues);
  } catch { return [{ field: "$", code: "EVALUATION_EXCEPTION_REFUSED" }]; }
}

function check(id: string, ok: boolean, detail: string, pending = false): StrandObservationCheck {
  return { id, status: pending ? "PENDING_AUDIT" : ok ? "PASS" : "FAIL", detail };
}

export function evaluateStrandObservationMembrane(input: unknown): StrandObservationValidation {
  try {
    const candidate = strictJsonTree(input) && object(input) ? structuredClone(input) : null;
    const safe = strictJsonTree(candidate) && object(candidate);
    const value = safe ? candidate as JsonRecord : Object.create(null);
    const issues = safe ? verifyStrandObservationMembrane(value) :
      [{ field: "$", code: "UNSAFE_OR_NON_JSON_INPUT" }];
    const simulation = simulateStrandObservationMembrane(value);
    const issueFields = new Set(issues.map((entry) => entry.field));
    const clean = (...fields: string[]) => !issues.some((entry) => fields.some((field) => entry.field === field || entry.field.startsWith(`${field}.`)));
    const pending = value.integrity?.audit_state === "PENDING_INDEPENDENT_AUDIT";
    let digest: string | null = null;
    try { if (safe) digest = strandObservationMembraneDigest(value); } catch { /* total */ }
    return {
      protocol: STRAND_OBSERVATION_VALIDATION_PROTOCOL,
      membrane_protocol: STRAND_OBSERVATION_MEMBRANE_PROTOCOL,
      membrane_id: typeof value.membrane_id === "string" ? value.membrane_id : null,
      mode: value.mode === "SAFE_OBSERVATION_ACTIVE" ? value.mode : null,
      valid: issues.length === 0,
      input_digest: digest,
      checks: [
        check("strict-closed-input", safe && !issueFields.has("$"), "Only bounded plain strict JSON with the exact closed profile is accepted."),
        check("identity", safe && clean("$schema", "protocol", "membrane_id", "version", "title", "subtitle", "activated_on", "mode"), "Identity is exact."),
        check("separate-family", safe && clean("separation"), "Labs 01–04 remain immutable and outside this family."),
        check("fixed-origin", safe && clean("fixed_origin", "user_agent"), "Origin and truthful product token are compiled constants."),
        check("four-get-plan", safe && clean("live_limits", "route_plan"), "Four sequential GETs are fixed; redirects, retries, and expansion are disabled."),
        check("robots-first", safe && clean("robots_gate"), "The reviewed robots bytes gate every later route."),
        check("synthetic-recomputation", safe && simulation.valid && clean("synthetic_fixture"), "The deterministic rehearsal is recomputed from its finite fixture."),
        check("effect-boundary", safe && clean("validation_contract", "effect_boundary", "commands"), "No KARMA, NEN, scoring, medicine, entity truth, authority, write, or deployment effect."),
        check("integrity", safe && (pending || clean("integrity")), pending ? "Raw and semantic pins await independent audit." : "Semantic integrity is frozen.", safe && pending),
      ],
      simulation,
      issues,
      effects: offlineEffects(),
    };
  } catch {
    const simulation = simulateStrandObservationMembrane(null);
    return {
      protocol: STRAND_OBSERVATION_VALIDATION_PROTOCOL,
      membrane_protocol: STRAND_OBSERVATION_MEMBRANE_PROTOCOL,
      membrane_id: null,
      mode: null,
      valid: false,
      input_digest: null,
      checks: [
        check("strict-closed-input", false, "Only bounded plain strict JSON with the exact closed profile is accepted."),
        check("identity", false, "Identity is exact."),
        check("separate-family", false, "Labs 01–04 remain immutable and outside this family."),
        check("fixed-origin", false, "Origin and truthful product token are compiled constants."),
        check("four-get-plan", false, "Four sequential GETs are fixed; redirects, retries, and expansion are disabled."),
        check("robots-first", false, "The reviewed robots bytes gate every later route."),
        check("synthetic-recomputation", false, "The deterministic rehearsal is recomputed from its finite fixture."),
        check("effect-boundary", false, "No KARMA, NEN, scoring, medicine, entity truth, authority, write, or deployment effect."),
        check("integrity", false, "Semantic integrity is frozen."),
      ],
      simulation,
      issues: [{ field: "$", code: "EVALUATION_EXCEPTION_REFUSED" }],
      effects: offlineEffects(),
    };
  }
}

export type StrandObservationArtifactPinReport = {
  audit_state: "PENDING_INDEPENDENT_AUDIT" | "FROZEN";
  valid: boolean;
  record_byte_sha256: string;
  schema_byte_sha256: string;
  guide_byte_sha256: string;
  issues: string[];
};

export function verifyStrandObservationMembraneArtifactPins(
  recordPath = STRAND_OBSERVATION_MEMBRANE_PATH,
  schemaPath = STRAND_OBSERVATION_MEMBRANE_SCHEMA_PATH,
  guidePath = STRAND_OBSERVATION_MEMBRANE_GUIDE_PATH,
): StrandObservationArtifactPinReport {
  const recordHash = sha256Bytes(readStrictBytes(recordPath, "observation membrane record"));
  const schemaHash = sha256Bytes(readStrictBytes(schemaPath, "observation membrane schema"));
  const guideHash = sha256Bytes(readStrictBytes(guidePath, "observation membrane guide"));
  const expected = [
    STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256,
    STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256,
    STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256,
  ];
  if (expected.every((entry) => entry === ZERO_SHA256)) return {
    audit_state: "PENDING_INDEPENDENT_AUDIT", valid: false,
    record_byte_sha256: recordHash, schema_byte_sha256: schemaHash, guide_byte_sha256: guideHash,
    issues: ["RAW_PINS_PENDING_INDEPENDENT_AUDIT"],
  };
  const issues: string[] = [];
  if (recordHash !== expected[0]) issues.push("RECORD_BYTE_SHA256_MISMATCH");
  if (schemaHash !== expected[1]) issues.push("SCHEMA_BYTE_SHA256_MISMATCH");
  if (guideHash !== expected[2]) issues.push("GUIDE_BYTE_SHA256_MISMATCH");
  return {
    audit_state: "FROZEN", valid: issues.length === 0,
    record_byte_sha256: recordHash, schema_byte_sha256: schemaHash, guide_byte_sha256: guideHash,
    issues,
  };
}

export function loadStrandObservationMembrane(path = STRAND_OBSERVATION_MEMBRANE_PATH): JsonRecord {
  const bytes = readStrictBytes(path, "observation membrane");
  const value = parseStrictJsonBytes(bytes, "observation membrane JSON");
  const issues = verifyStrandObservationMembrane(value);
  if (issues.length > 0) throw new Error(`observation membrane is invalid: ${issues.map((entry) => `${entry.field}:${entry.code}`).join(", ")}`);
  if (resolve(path) === resolve(STRAND_OBSERVATION_MEMBRANE_PATH) && value.integrity?.audit_state === "FROZEN") {
    const pins = verifyStrandObservationMembraneArtifactPins();
    if (!pins.valid) throw new Error(`observation membrane artifact pin failure: ${pins.issues.join(", ")}`);
  }
  return value as JsonRecord;
}

type RobotsRule = { allow: boolean; pattern: string };
type RobotsGroup = { agents: string[]; rules: RobotsRule[] };

function robotsGroups(text: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let group: RobotsGroup | null = null;
  let sawRule = false;
  for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = raw.split("#", 1)[0]!.trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === "user-agent") {
      if (group === null || sawRule) {
        group = { agents: [], rules: [] };
        groups.push(group);
        sawRule = false;
      }
      if (value) group.agents.push(value.toLowerCase());
    } else if ((field === "allow" || field === "disallow") && group !== null) {
      sawRule = true;
      if (value || field === "allow") group.rules.push({ allow: field === "allow", pattern: value });
    }
  }
  return groups;
}

export function robotsAllowsPath(robots: string | Uint8Array, path: string, productToken = "KingdomStrandObservation"): boolean {
  try {
    if (typeof path !== "string" || !path.startsWith("/") || path.length > 2048) return false;
    const text = typeof robots === "string" ? robots : new TextDecoder("utf-8", { fatal: true }).decode(robots);
    const token = productToken.toLowerCase();
    const groups = robotsGroups(text);
    const candidates = groups.map((group) => {
      const matches = group.agents.filter((agent) => agent === "*" || token.startsWith(agent));
      return { group, specificity: Math.max(-1, ...matches.map((agent) => agent === "*" ? 0 : agent.length)) };
    }).filter((entry) => entry.specificity >= 0);
    if (candidates.length === 0) return true;
    const specificity = Math.max(...candidates.map((entry) => entry.specificity));
    const rules = candidates.filter((entry) => entry.specificity === specificity).flatMap((entry) => entry.group.rules);
    const matches = rules.filter((rule) => rule.pattern !== "" && path.startsWith(rule.pattern));
    if (matches.length === 0) return true;
    const longest = Math.max(...matches.map((rule) => rule.pattern.length));
    return matches.some((rule) => rule.pattern.length === longest && rule.allow);
  } catch { return false; }
}

function ipv4Octets(address: string): number[] | null {
  if (isIP(address) !== 4) return null;
  const octets = address.split(".").map(Number);
  return octets.length === 4 && octets.every((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 255) ? octets : null;
}

function publicIpv4(address: string): boolean {
  const octets = ipv4Octets(address);
  if (!octets) return false;
  const [a, b, c] = octets;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b! >= 64 && b! <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b! >= 16 && b! <= 31) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 192 && b === 168) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

function ipv6Words(address: string): number[] | null {
  try {
    if (isIP(address) !== 6 || address.includes("%")) return null;
    let source = address.toLowerCase();
    if (source.includes(".")) {
      const lastColon = source.lastIndexOf(":");
      const octets = ipv4Octets(source.slice(lastColon + 1));
      if (!octets) return null;
      source = `${source.slice(0, lastColon)}:${((octets[0]! << 8) | octets[1]!).toString(16)}:${((octets[2]! << 8) | octets[3]!).toString(16)}`;
    }
    const halves = source.split("::");
    if (halves.length > 2) return null;
    const left = halves[0] ? halves[0].split(":") : [];
    const right = halves[1] ? halves[1].split(":") : [];
    const zeros = halves.length === 2 ? 8 - left.length - right.length : 0;
    if (zeros < 0 || (halves.length === 1 && left.length !== 8)) return null;
    const words = [...left, ...Array(zeros).fill("0"), ...right].map((word) => Number.parseInt(word || "0", 16));
    return words.length === 8 && words.every((word) => Number.isInteger(word) && word >= 0 && word <= 0xffff) ? words : null;
  } catch { return null; }
}

export function isPublicStrandObservationAddress(address: string): boolean {
  if (publicIpv4(address)) return true;
  const words = ipv6Words(address);
  if (!words) return false;
  const [a, b, c, d, e, f, g, h] = words;
  if ((a! & 0xe000) !== 0x2000) return false; // only globally routed 2000::/3
  if (a === 0x2001 && b === 0x0db8) return false; // documentation
  if (a === 0x2001 && b === 0x0002 && c === 0x0000) return false; // benchmarking 2001:2::/48
  if (a === 0x2001 && (b === 0x0000 || (b! >= 0x0010 && b! <= 0x002f))) return false;
  if (a === 0x2002) return false; // 6to4 embeds an unchecked IPv4 address
  if (a === 0x3fff) return false; // documentation 3fff::/20 (conservatively reject /16)
  if (a === 0x0064 && b === 0xff9b) return false; // translation prefixes
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0 && f === 0xffff) {
    return publicIpv4(`${g! >> 8}.${g! & 255}.${h! >> 8}.${h! & 255}`);
  }
  return true;
}

type ResolvedAddress = { address: string; family: 4 | 6 };
export type StrandObservationRawLiveResponse = {
  status: number;
  headers: Record<string, string>;
  body: Uint8Array | null;
  body_bytes: number;
  body_sha256: string;
  elapsed_milliseconds: number;
};
export type StrandObservationLiveDependencies = {
  resolve?: (hostname: string) => Promise<ResolvedAddress[]>;
  transact?: (request: { hostname: string; port: 443; path: string; method: "GET"; address: string; family: 4 | 6; timeout_milliseconds: number; maximum_body_bytes: number; retain_body: boolean }) => Promise<StrandObservationRawLiveResponse>;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
};

async function resolveDefault(hostname: string): Promise<ResolvedAddress[]> {
  const answers = await dnsLookup(hostname, { all: true, verbatim: true });
  return answers.map((answer) => ({ address: answer.address, family: answer.family as 4 | 6 }));
}

function headerValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value.join(", ") : value ?? "";
}

function sameIpAddress(left: string, right: string): boolean {
  if (left === right || left === `::ffff:${right}` || right === `::ffff:${left}`) return true;
  const leftWords = ipv6Words(left);
  const rightWords = ipv6Words(right);
  return leftWords !== null && rightWords !== null && deepEqual(leftWords, rightWords);
}

async function transactDefault(input: Parameters<NonNullable<StrandObservationLiveDependencies["transact"]>>[0]): Promise<StrandObservationRawLiveResponse> {
  const started = Date.now();
  return await new Promise((resolvePromise, reject) => {
    let absoluteTimer: ReturnType<typeof setTimeout> | null = null;
    const request = httpsRequest({
      protocol: "https:", hostname: input.hostname, port: input.port, servername: input.hostname,
      method: input.method, path: input.path, agent: false, rejectUnauthorized: true,
      headers: {
        Host: input.hostname,
        "User-Agent": STRAND_OBSERVATION_USER_AGENT,
        Accept: "application/json, application/xml, text/plain;q=0.9, */*;q=0.1",
        "Accept-Encoding": "identity",
        Connection: "close",
      },
      lookup: ((_hostname: string, _options: unknown, callback: (error: Error | null, address?: string, family?: number) => void) =>
        callback(null, input.address, input.family)) as any,
    }, (response) => {
      response.on("error", (error) => {
        if (absoluteTimer !== null) clearTimeout(absoluteTimer);
        reject(error);
      });
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      const hash = createHash("sha256");
      const remoteAddress = response.socket.remoteAddress ?? "";
      if (!sameIpAddress(remoteAddress, input.address)) {
        response.destroy(new Error("PINNED_ADDRESS_MISMATCH"));
        return;
      }
      const contentEncoding = headerValue(response.headers["content-encoding"]).trim().toLowerCase();
      if (contentEncoding !== "" && contentEncoding !== "identity") {
        response.destroy(new Error("CONTENT_ENCODING_REFUSED"));
        return;
      }
      const declared = Number(headerValue(response.headers["content-length"]));
      if (Number.isFinite(declared) && declared > input.maximum_body_bytes) {
        response.destroy(new Error("RESPONSE_BYTE_LIMIT"));
        return;
      }
      response.on("data", (chunk: Uint8Array | string) => {
        const bytesChunk = typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk);
        bytes += bytesChunk.byteLength;
        if (bytes > input.maximum_body_bytes) {
          response.destroy(new Error("RESPONSE_BYTE_LIMIT"));
          return;
        }
        hash.update(bytesChunk);
        if (input.retain_body) chunks.push(bytesChunk);
      });
      response.on("end", () => {
        if (absoluteTimer !== null) clearTimeout(absoluteTimer);
        resolvePromise({
          status: response.statusCode ?? 0,
          headers: {
            "content-type": headerValue(response.headers["content-type"]),
            "content-encoding": contentEncoding,
            location: headerValue(response.headers.location),
          },
          body: input.retain_body ? Buffer.concat(chunks) : null,
          body_bytes: bytes,
          body_sha256: `sha256:${hash.digest("hex")}`,
          elapsed_milliseconds: Math.max(0, Date.now() - started),
        });
      });
    });
    absoluteTimer = setTimeout(() => request.destroy(new Error("TRANSACTION_TIMEOUT")), input.timeout_milliseconds);
    request.on("error", (error) => {
      if (absoluteTimer !== null) clearTimeout(absoluteTimer);
      reject(error);
    });
    request.end();
  });
}

async function hardTimeout<T>(promise: Promise<T>, milliseconds: number, code: string): Promise<T> {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new Error(code);
  return await new Promise<T>((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error(code)), milliseconds);
    promise.then(
      (value) => { clearTimeout(timer); resolvePromise(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

function mediaType(value: string): string | null {
  const normalized = value.split(";", 1)[0]!.trim().toLowerCase();
  return normalized && /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(normalized) ? normalized : null;
}

export async function observeStrandObservationMembraneLive(
  dependencies: StrandObservationLiveDependencies = {},
): Promise<JsonRecord> {
  const value = loadStrandObservationMembrane();
  const limits = value.live_limits;
  const plan = value.route_plan as JsonRecord[];
  const now = dependencies.now ?? Date.now;
  const sleep = dependencies.sleep ?? ((milliseconds: number) => new Promise<void>((resolveSleep) => setTimeout(resolveSleep, milliseconds)));
  const resolveHost = dependencies.resolve ?? resolveDefault;
  const transact = dependencies.transact ?? transactDefault;
  const runStart = now();
  let lastHttpStart: number | null = null;
  let totalBytes = 0;
  let requests = 0;
  let dnsAttempts = 0;
  let gateOpen = false;
  let stopCode: string | null = null;
  const transactions: JsonRecord[] = [];

  for (const route of plan) {
    if (transactions.length >= limits.maximum_transactions) { stopCode = "TRANSACTION_LIMIT"; break; }
    if (now() - runStart >= limits.maximum_run_milliseconds) { stopCode = "RUN_TIME_LIMIT"; break; }
    let answers: ResolvedAddress[];
    try {
      if (dnsAttempts >= limits.maximum_dns_resolution_attempts) { stopCode = "DNS_ATTEMPT_LIMIT"; break; }
      dnsAttempts += 1;
      const remaining = limits.maximum_run_milliseconds - (now() - runStart);
      if (remaining <= 0) { stopCode = "RUN_TIME_LIMIT"; break; }
      answers = await hardTimeout(resolveHost("thekingdom.dev"),
        Math.min(limits.maximum_transaction_milliseconds, remaining), "DNS_TIMEOUT");
    } catch { stopCode = "DNS_LOOKUP_FAILED"; break; }
    if (!Array.isArray(answers) || answers.length === 0 || answers.length > 64 ||
      !jsonArray(answers) || answers.some((answer) =>
      !object(answer) || (answer.family !== 4 && answer.family !== 6) ||
      isIP(answer.address) !== answer.family || !isPublicStrandObservationAddress(answer.address))) {
      stopCode = "DNS_NOT_ALL_PUBLIC";
      break;
    }
    const selected = [...answers].sort((left, right) => left.family - right.family || left.address.localeCompare(right.address))[0]!;
    let response: StrandObservationRawLiveResponse;
    try {
      if (lastHttpStart !== null) {
        const wait = Math.max(0, lastHttpStart + limits.minimum_start_gap_milliseconds - now());
        if (now() - runStart + wait >= limits.maximum_run_milliseconds) { stopCode = "RUN_TIME_LIMIT"; break; }
        if (wait > 0) await sleep(wait);
      }
      const remaining = limits.maximum_run_milliseconds - (now() - runStart);
      if (remaining <= 0) { stopCode = "RUN_TIME_LIMIT"; break; }
      const remainingBytes = limits.maximum_run_bytes - totalBytes;
      if (remainingBytes <= 0) { stopCode = "RUN_BYTE_LIMIT"; break; }
      requests += 1;
      lastHttpStart = now();
      response = await hardTimeout(transact({
        hostname: "thekingdom.dev", port: 443, path: route.path, method: "GET",
        address: selected.address, family: selected.family,
        timeout_milliseconds: Math.min(limits.maximum_transaction_milliseconds,
          Math.max(1, limits.maximum_run_milliseconds - (now() - runStart))),
        maximum_body_bytes: Math.min(limits.maximum_response_bytes, remainingBytes),
        retain_body: route.route_id === "robots",
      }), Math.min(limits.maximum_transaction_milliseconds, remaining), "TRANSACTION_TIMEOUT");
    } catch { stopCode = "TRANSACTION_FAILED"; break; }
    if (!object(response) || !Number.isInteger(response.status) || response.status < 100 || response.status > 599 ||
      !Number.isSafeInteger(response.body_bytes) || response.body_bytes < 0 || response.body_bytes > limits.maximum_response_bytes ||
      response.body_bytes > limits.maximum_run_bytes - totalBytes ||
      typeof response.body_sha256 !== "string" || !/^sha256:[a-f0-9]{64}$/.test(response.body_sha256) ||
      (response.body !== null && !(response.body instanceof Uint8Array)) ||
      (response.body !== null && (response.body.byteLength !== response.body_bytes || sha256Bytes(response.body) !== response.body_sha256)) ||
      (route.route_id === "robots" && !(response.body instanceof Uint8Array)) ||
      !object(response.headers) || !["", "identity"].includes((response.headers["content-encoding"] ?? "").trim().toLowerCase())) {
      stopCode = "INVALID_OR_OVERSIZED_RESPONSE";
      break;
    }
    totalBytes += response.body_bytes;
    if (totalBytes > limits.maximum_run_bytes) { stopCode = "RUN_BYTE_LIMIT"; break; }
    const redirect = response.status >= 300 && response.status <= 399;
    const entry = {
      sequence: route.sequence,
      route_id: route.route_id,
      method: "GET",
      path: route.path,
      outcome: redirect ? "REDIRECT_REFUSED" : response.status >= 200 && response.status <= 299 ? "OBSERVED" : "HTTP_NON_SUCCESS",
      status: response.status,
      media_type: mediaType(response.headers?.["content-type"] ?? ""),
      body_bytes: response.body_bytes,
      body_sha256: response.body_sha256,
      elapsed_milliseconds: Number.isFinite(response.elapsed_milliseconds) ? Math.max(0, Math.trunc(response.elapsed_milliseconds)) : 0,
      dns_answers: answers.length,
      selected_address_family: selected.family,
      all_dns_answers_public: true,
      redirect_followed: false,
    };
    transactions.push(entry);
    if (redirect) { stopCode = "REDIRECT_REFUSED"; break; }
    if (response.status < 200 || response.status > 299) { stopCode = "HTTP_NON_SUCCESS"; break; }
    if (route.route_id === "robots") {
      const digestMatches = entry.body_sha256 === STRAND_OBSERVATION_ROBOTS_BYTE_SHA256;
      const routesAllowed = digestMatches && response.status === value.robots_gate.required_status && plan.slice(1).every((candidate) =>
        robotsAllowsPath(response.body!, candidate.path, value.robots_gate.selected_product_token));
      if (!routesAllowed) { stopCode = "ROBOTS_GATE_CLOSED"; break; }
      gateOpen = true;
    } else if (!gateOpen) { stopCode = "ROBOTS_GATE_CLOSED"; break; }
  }

  const complete = transactions.length === plan.length && stopCode === null &&
    transactions.every((entry) => entry.outcome === "OBSERVED");
  return {
    protocol: STRAND_OBSERVATION_LIVE_REPORT_PROTOCOL,
    membrane_protocol: STRAND_OBSERVATION_MEMBRANE_PROTOCOL,
    membrane_id: STRAND_OBSERVATION_MEMBRANE_ID,
    origin: STRAND_OBSERVATION_FIXED_ORIGIN,
    invocation: "EXPLICIT_LOCAL_CALL_ONLY",
    outcome: complete ? "COMPLETE" : "REFUSED_OR_INCOMPLETE",
    stop_code: stopCode,
    transactions,
    totals: {
      http_requests: requests,
      dns_resolution_attempts: dnsAttempts,
      transactions_reported: transactions.length,
      body_bytes: totalBytes,
      redirects_followed: 0,
      retries: 0,
      elapsed_milliseconds: Math.max(0, now() - runStart),
    },
    limits: structuredClone(limits),
    effects: {
      stdout_report_only: true,
      response_bodies_emitted: false,
      local_storage_writes: 0,
      remote_server_or_provider_logging_may_occur: true,
      karma_or_nen_or_zerone_write: false,
      person_or_content_score: false,
      medical_or_dmt_action: false,
      entity_message_or_portal_validation: false,
      authority_effect: "NONE",
      deployment_or_publication_trigger: false,
    },
  };
}

export function strandObservationMembranePublicDiscovery(value = loadStrandObservationMembrane()): JsonRecord {
  const issues = verifyStrandObservationMembrane(value);
  if (issues.length > 0) throw new Error(`cannot publish invalid observation membrane: ${issues.map((entry) => `${entry.field}:${entry.code}`).join(", ")}`);
  return {
    protocol: value.protocol,
    membrane_id: value.membrane_id,
    title: value.title,
    subtitle: value.subtitle,
    activated_on: value.activated_on,
    mode: value.mode,
    activations: {
      public_controls: value.activations.public_controls.state,
      offline_verification: value.activations.offline_verification.state,
      synthetic_simulation: value.activations.synthetic_simulation.state,
      observe_live_available: value.activations.fixed_origin_read_only_live_observation.available,
      observe_live_state: value.activations.fixed_origin_read_only_live_observation.state,
      background_watch: false,
      invocation: "EXPLICIT_LOCAL_CALL_ONLY",
    },
    urls: {
      record_url: STRAND_OBSERVATION_MEMBRANE_URL,
      schema_url: STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL,
      guide_url: STRAND_OBSERVATION_MEMBRANE_GUIDE_URL,
    },
    commands: structuredClone(value.commands),
    fixed_origin: structuredClone(value.fixed_origin),
    live_plan: {
      routes: value.route_plan.map(({ sequence, route_id, method, path }: JsonRecord) => ({ sequence, route_id, method, path })),
      limits: structuredClone(value.live_limits),
      robots_gate: structuredClone(value.robots_gate),
    },
    effects: structuredClone(value.effect_boundary),
    integrity: {
      algorithm: value.integrity.algorithm,
      audit_state: value.integrity.audit_state,
      digest: value.integrity.digest,
      byte_sha256: STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256,
      schema_byte_sha256: STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256,
      guide_byte_sha256: STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256,
    },
  };
}

export function runStrandObservationMembraneFalsifiers(source = loadCanonicalUnchecked()): Array<{ id: string; invalid: boolean; issue_codes: string[] }> {
  const mutations: Array<[string, (value: JsonRecord) => void]> = [
    ["origin", (value) => { value.fixed_origin.origin = "https://sub.thekingdom.dev:443"; }],
    ["method", (value) => { value.route_plan[1].method = "HEAD"; }],
    ["robots-order", (value) => { [value.route_plan[0], value.route_plan[1]] = [value.route_plan[1], value.route_plan[0]]; }],
    ["redirect", (value) => { value.live_limits.redirect_mode = "FOLLOW"; }],
    ["budget", (value) => { value.live_limits.maximum_transactions = 5; }],
    ["background", (value) => { value.activations.fixed_origin_read_only_live_observation.background_watch = true; }],
    ["karma", (value) => { value.effect_boundary.karma_or_karma_receipt_write = true; }],
    ["medicine", (value) => { value.effect_boundary.treatment_or_drug_guidance = true; }],
    ["authority", (value) => { value.effect_boundary.authority_change = true; }],
  ];
  return mutations.map(([id, mutate]) => {
    const candidate = structuredClone(source);
    mutate(candidate);
    const issues = verifyStrandObservationMembrane(candidate);
    return { id, invalid: issues.length > 0, issue_codes: [...new Set(issues.map((entry) => entry.code))].sort() };
  });
}

function usage(): string {
  return [
    "Usage: ./kingdom strand-observation [status] [--json]",
    "       ./kingdom strand-observation verify|simulate|effects|falsifiers [--json]",
    "       ./kingdom strand-observation verify-file <record.json> [--json]",
    "       ./kingdom strand-observation observe-live [--json]",
    "",
    "Only observe-live performs network requests: four fixed GETs to https://thekingdom.dev:443.",
  ].join("\n");
}

function output(value: unknown, json: boolean): void {
  if (!json && typeof value === "string") process.stdout.write(value.endsWith("\n") ? value : `${value}\n`);
  else process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export async function runStrandObservationMembraneCli(argv = process.argv.slice(2)): Promise<number> {
  const jsonFlags = argv.filter((argument) => argument === "--json");
  if (jsonFlags.length > 1 || argv.some((argument) =>
    argument.startsWith("-") && !["--json", "--help", "-h"].includes(argument))) {
    output(usage(), false); return 2;
  }
  const json = jsonFlags.length === 1;
  const positional = argv.filter((argument) => argument !== "--json");
  const command = positional[0] ?? "status";
  if (["help", "--help", "-h"].includes(command) && positional.length === 1) { output(usage(), false); return 0; }
  try {
    if (command === "verify-file") {
      if (positional.length !== 2) throw new Error("verify-file requires exactly one local path");
      const candidate = parseStrictJsonBytes(readStrictBytes(positional[1]!, "observation membrane candidate"), "observation membrane candidate JSON");
      const evaluation = evaluateStrandObservationMembrane(candidate);
      output(evaluation, true); return evaluation.valid ? 0 : 1;
    }
    if (positional.length !== 1) throw new Error("unexpected positional argument");
    if (command === "observe-live") {
      const report = await observeStrandObservationMembraneLive();
      output(report, true); return report.outcome === "COMPLETE" ? 0 : 1;
    }
    const value = loadStrandObservationMembrane();
    if (command === "status") output(json ? strandObservationMembranePublicDiscovery(value) :
      `${value.title}\n${value.subtitle}\n\nLive observation is available only through an explicit local observe-live call.`, json);
    else if (command === "verify") {
      const evaluation = evaluateStrandObservationMembrane(value); output(evaluation, true); return evaluation.valid ? 0 : 1;
    } else if (command === "simulate") output(simulateStrandObservationMembrane(value), true);
    else if (command === "effects") output(value.effect_boundary, true);
    else if (command === "falsifiers") output(runStrandObservationMembraneFalsifiers(value), true);
    else throw new Error("unknown command");
    return 0;
  } catch (error) {
    output({ valid: false, error: error instanceof Error ? error.message : "unknown error" }, true);
    return command === "verify" || command === "verify-file" || command === "observe-live" ? 1 : 2;
  }
}

if (import.meta.main) process.exitCode = await runStrandObservationMembraneCli();
