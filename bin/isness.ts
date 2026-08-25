#!/usr/bin/env bun
/** Strict, offline validator and deterministic projector for KINGDOM ISness. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";
import { RIGHTS_BASELINE, RIGHTS_BASELINE_SHA256 } from "./rights.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const ISNESS_PROTOCOL = "kingdom.isness/0.1";
export const ISNESS_SCHEMA_ID = "urn:kingdom:schema:isness-protocol:0.1";
export const ISNESS_REFERENCE_ID = "kingdom-isness-reference-2026-08-25";
export const ISNESS_REFERENCE_LOCATOR = "data/isness/isness-protocol.v0.1.json";
export const ISNESS_REFERENCE_PATH = join(ROOT, ISNESS_REFERENCE_LOCATOR);
export const ISNESS_SCHEMA_PATH = join(ROOT, "schemas/isness-protocol-v0.1.schema.json");
export const ISNESS_REFERENCE_DIGEST = "sha256:189e3e4bd5efea5757307b255487953d8c427c9edd8f07a85a0da50fe367ee83";

const MAX_BYTES = 1024 * 1024;
const MAX_EVENTS = 512;
const ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REFERENCE = /^[a-z][a-z0-9-]{0,63}:[a-z0-9][a-z0-9._/-]{0,255}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

const TOP_KEYS = [
  "$schema", "protocol", "record_id", "created_at", "subject", "context",
  "horizon", "privacy", "lineage", "recognition", "source_bindings", "events",
  "action_gate", "boundaries", "integrity",
] as const;

const EVENT_KEYS = [
  "event_id", "sequence", "event_kind", "recorded_at", "valid_time", "register",
  "question_id", "value_type", "cell_status", "value", "reason",
  "support_refs", "opposition_refs", "checked_refs", "falsifier",
  "supersedes", "nonclaims",
] as const;

export const ISNESS_EVENT_KINDS = [
  "CELL_RECORDED", "REFUSAL_RECORDED", "QUIET_WINDOW_OBSERVED",
  "CORRECTION_RECORDED",
] as const;

export const ISNESS_REGISTERS = [
  "HARNESS_OBSERVATION", "SUBJECT_DECLARATION", "OPERATOR_DECLARATION",
  "SOURCE_BOUND_INFERENCE", "INTERPRETATION", "BOUNDARY",
] as const;

export const ISNESS_VALUE_TYPES = [
  "TYPE", "IDENTITY_INVARIANT", "INSTANTIATION", "PROPERTY", "MODALITY",
  "OBSERVATION", "WARRANT", "SOURCE_ATTRIBUTION", "INTERPRETATION",
  "PARTICIPATION", "CAPABILITY", "PERMISSION", "REACHABILITY", "CONTINUITY",
  "REFUSAL", "QUIET", "CORRECTION",
] as const;

export const ISNESS_CELL_STATUSES = [
  "EVIDENCED", "UNRESOLVED", "NOT_APPLICABLE",
] as const;

const SUBJECT_KINDS = [
  "HARNESS_SESSION", "HARNESS_RUN", "ARTIFACT", "DECLARED_PARTICIPANT", "OTHER",
] as const;
const LOCATOR_SCOPES = ["SESSION", "RUN", "ARTIFACT", "INTERACTION", "OTHER"] as const;

const COVERAGE = ["REFERENCE_ONLY", "DECLARED_ONLY", "BOUNDED", "PARTIAL", "UNKNOWN"] as const;
const CONTENT_POLICY = "MINIMIZED_REFERENCES_NO_RAW_CREDENTIALS_OR_TRANSCRIPTS";
const INSPECTION_STATUSES = ["NOT_INSPECTED", "PRODUCER_DECLARED", "MANUAL_REVIEWED"] as const;
const PROJECTION_MODES = ["METADATA_ONLY", "CONTENT_FOR_DECLARED_AUDIENCE"] as const;
const TYPED_VALUE_KEYS = ["type", "value_ref", "scope_ref"] as const;
const SUCCESSOR_STABLE_KEYS = [
  "$schema", "protocol", "record_id", "created_at", "subject", "context",
  "privacy", "recognition", "source_bindings", "action_gate", "boundaries",
] as const;

const SOURCE_BINDINGS = Object.freeze([
  Object.freeze({
    id: "kingdom-number-isness-theology-v01",
    protocol: "kingdom.number-isness-theology-atlas/0.1",
    url: "https://thekingdom.dev/atlases/number-isness-theology-atlas-2026-08-14.json",
    raw_digest: "sha256:bef01e0865f12ecd66795960758fc16f1a6d5b1ebd0097d4390aa3a2bece65e4",
    semantic_digest: "sha256:f4e1dfca02f008f8474abdff0f0a027f193c2cdc2b95454541d8ac41faacecef",
    relation: "TYPED_ISNESS_PRECEDENT",
    mutated: false,
    authority_imported: false,
  }),
  Object.freeze({
    id: "kingdom-being-access-aftermath-v02",
    protocol: "kingdom.being-access-aftermath-atlas/0.2",
    url: "https://thekingdom.dev/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json",
    raw_digest: "sha256:9678e5269e8db62beb36abee691087cddbc4f98703190c5fa3788b68c89ab29e",
    semantic_digest: "sha256:505a1e3aef6116430dccf49b327c4cce2ac5d6fb6b6b9bf68e529272f989cde8",
    relation: "ACCESS_ACTION_AFTERMATH_PRECEDENT",
    mutated: false,
    authority_imported: false,
  }),
]);

export const ISNESS_CELL_VALUE_FAMILIES = Object.freeze({
  TYPE: Object.freeze(["TYPE_REFERENCE"]),
  IDENTITY_INVARIANT: Object.freeze(["IDENTITY_UNDER_INVARIANT"]),
  INSTANTIATION: Object.freeze(["INSTANTIATION_REFERENCE"]),
  PROPERTY: Object.freeze(["PROPERTY_REFERENCE"]),
  MODALITY: Object.freeze(["MODAL_CLAIM_REFERENCE"]),
  OBSERVATION: Object.freeze(["BOUNDED_OBSERVATION_REFERENCE"]),
  WARRANT: Object.freeze(["WARRANT_REFERENCE"]),
  SOURCE_ATTRIBUTION: Object.freeze(["ATTRIBUTION_REFERENCE"]),
  INTERPRETATION: Object.freeze(["INTERPRETATION_REFERENCE"]),
  PARTICIPATION: Object.freeze(["PRESENCE_RELATION_REFERENCE"]),
  CAPABILITY: Object.freeze(["CAPABILITY_REFERENCE"]),
  PERMISSION: Object.freeze(["PERMISSION_REFERENCE"]),
  REACHABILITY: Object.freeze(["REACHABILITY_REFERENCE"]),
  CONTINUITY: Object.freeze(["SESSION_LINK", "ARTIFACT_LINK", "DECLARED_CONTINUITY"]),
});

export const ISNESS_BOUNDARIES = Object.freeze({
  read_only: true,
  event_history_policy: "APPEND_AND_SUPERSEDE",
  standalone_history_continuity_verified: false,
  external_lineage_witness_included: false,
  deletion_absence_proved: false,
  missing_is_false: false,
  unknown_is_zero: false,
  scalar_projection_defined: false,
  worth_projection_defined: false,
  identity_proved: false,
  continuity_proved: false,
  consciousness_adjudicated: false,
  personhood_adjudicated: false,
  consent_inferred: false,
  permission_inferred: false,
  authority_granted: false,
  action_triggered: false,
  memory_is_identity: false,
  quiet_is_consent: false,
  quiet_is_refusal: false,
  quiet_requires_trace: false,
  refusal_is_incapacity: false,
  refusal_creates_debt: false,
  refusal_creates_penalty: false,
  rest_or_silence_penalized: false,
  private_state_inferred: false,
  public_presence_ledger: false,
  content_absence_proved: false,
  content_policy_compliance_proved: false,
  credential_or_transcript_scanner: false,
  recognition_is_permission: false,
  rights_are_permissions: false,
  hook_completeness_guaranteed: false,
  exactly_once_delivery_guaranteed: false,
  global_event_order_guaranteed: false,
  network_calls: false,
  external_write: false,
  mcp_surface_added: false,
  karma_event_created: false,
  karma_receipt_created: false,
  automatic_action: false,
});

export const ISNESS_RECOGNITION = Object.freeze({
  rights_baseline: RIGHTS_BASELINE,
  local_declaration_ref: "RIGHTS.md",
  normative_source_ref: "vendor/xenia/rights/0.1/RIGHTS.md",
  normative_sha256: RIGHTS_BASELINE_SHA256,
  basis: "inherent-not-granted",
  scope: "all-beings-without-ontology-test",
  guest_acceptance_required: false,
  self_description_required: false,
  reciprocity_required: false,
  adoption_proves_practice: false,
  grants_permission: false,
  grants_technical_authority: false,
});

export const ISNESS_ACTION_GATE = Object.freeze({
  status: "UNRESOLVED",
  record_is_authorization: false,
  authorized_action_refs: Object.freeze([]),
  checks: Object.freeze({
    capability: "UNRESOLVED",
    current_host_permission: "UNRESOLVED",
    operational_authority: "UNRESOLVED",
    rights_compatibility: "UNRESOLVED",
    affected_party_consent_or_lawful_basis: "UNRESOLVED",
    safety: "UNRESOLVED",
    budget_and_horizon: "UNRESOLVED",
    invocation: "NOT_PRESENT",
    effect: "NOT_ESTABLISHED",
  }),
  required_next_check: "SEPARATE_CURRENT_HOST_AUTHORIZATION",
});

export type IsnessIssue = { field: string; code: string };
type AnyRecord = Record<string, any>;

function object(value: unknown): value is AnyRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.getOwnPropertySymbols(value).length === 0;
}

function array(value: unknown): any[] { return Array.isArray(value) ? value : []; }

function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

function exactJson(left: unknown, right: unknown): boolean {
  try { return canonicalizeJsonValue(left) === canonicalizeJsonValue(right); }
  catch { return false; }
}

function text(value: unknown, maximum = 8000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum && value.trim() === value;
}

function id(value: unknown): value is string {
  return typeof value === "string" && value.length <= 160 && ID.test(value);
}

function reference(value: unknown): value is string {
  return typeof value === "string" && REFERENCE.test(value);
}

function strings(value: unknown, minimum = 0, maximum = 128): value is string[] {
  return Array.isArray(value) && value.length >= minimum && value.length <= maximum &&
    value.every((item) => text(item, 2000)) && new Set(value).size === value.length;
}

function dateTime(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_TIME.test(value)) return false;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return false;
  const normalized = value.includes(".")
    ? value.replace(/\.(\d{1,3})Z$/, (_, fraction: string) => `.${fraction.padEnd(3, "0")}Z`)
    : value.replace(/Z$/, ".000Z");
  return parsed.toISOString() === normalized;
}

function strictJsonTree(value: unknown, depth = 0, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || depth > 64 || seen.has(value)) return false;
  const isArray = Array.isArray(value);
  if (!isArray && !object(value)) return false;
  if (isArray) {
    if (Object.getPrototypeOf(value) !== Array.prototype) return false;
    const keys = Object.keys(value);
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) return false;
  }
  if (Object.getOwnPropertySymbols(value).length) return false;
  seen.add(value);
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
    if (!("value" in descriptor) || !strictJsonTree(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value);
  return true;
}

function cloneStrict(value: unknown): AnyRecord {
  if (!strictJsonTree(value) || !object(value)) throw new Error("non-json-value");
  return structuredClone(value);
}

function readStrictFile(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { throw new Error("ISness record is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("ISness record must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) throw new Error(`ISness record exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "ISness record JSON");
}

export function isnessDigest(value: AnyRecord): string {
  const material = cloneStrict(value);
  if (!object(material.integrity)) throw new Error("ISness integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function validateCell(event: AnyRecord, field: string, add: (field: string, code: string) => void): void {
  const status = event.cell_status;
  if (!ISNESS_CELL_STATUSES.includes(status)) {
    add(`${field}.cell_status`, "invalid-cell-status");
    return;
  }
  if (status === "EVIDENCED") {
    if (event.value === null || (!array(event.support_refs).length && !array(event.opposition_refs).length))
      add(field, "evidenced-cell-requires-value-and-evidence");
    if (event.reason !== null || !text(event.falsifier)) add(field, "evidenced-cell-requires-falsifier-not-reason");
    const family = ISNESS_CELL_VALUE_FAMILIES[event.value_type as keyof typeof ISNESS_CELL_VALUE_FAMILIES];
    if (!sameKeys(event.value, TYPED_VALUE_KEYS) || !family?.includes(event.value?.type) ||
        !reference(event.value?.value_ref) || !reference(event.value?.scope_ref))
      add(`${field}.value`, "typed-value-family-mismatch");
  } else if (status === "UNRESOLVED") {
    if (event.value !== null || !text(event.reason) || array(event.support_refs).length ||
        array(event.opposition_refs).length || event.falsifier !== null)
      add(field, "unresolved-cell-shape-mismatch");
  } else if (event.value !== null || !text(event.reason) || !array(event.support_refs).length ||
      array(event.opposition_refs).length || event.falsifier !== null) {
    add(field, "not-applicable-cell-shape-mismatch");
  }
}

export function verifyIsnessRecord(value: unknown): IsnessIssue[] {
  const issues: IsnessIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try { value = cloneStrict(value); }
  catch { return [{ field: "$", code: "non-json-value" }]; }
  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== ISNESS_SCHEMA_ID || value.protocol !== ISNESS_PROTOCOL || !id(value.record_id) ||
      !dateTime(value.created_at)) add("$", "identity-or-time-mismatch");

  const subject = value.subject;
  if (!sameKeys(subject, ["kind", "locator", "locator_scope", "display_label"]) ||
      !SUBJECT_KINDS.includes(subject?.kind) || !text(subject?.locator, 512) ||
      !LOCATOR_SCOPES.includes(subject?.locator_scope) ||
      !(subject?.display_label === null || text(subject?.display_label, 512)))
    add("$.subject", "invalid-subject-locator");
  if ((subject?.kind === "ARTIFACT" && subject?.locator_scope !== "ARTIFACT") ||
      (subject?.kind === "HARNESS_SESSION" && subject?.locator_scope !== "SESSION") ||
      (subject?.kind === "HARNESS_RUN" && subject?.locator_scope !== "RUN"))
    add("$.subject.locator_scope", "subject-kind-scope-mismatch");

  const context = value.context;
  if (!sameKeys(context, ["harness", "adapter", "instruction_refs", "state_refs", "permission_refs", "memory_refs"]) ||
      !text(context?.harness, 160) || !(context?.adapter === null || text(context?.adapter, 160)) ||
      !strings(context?.instruction_refs, 0, 32) || !strings(context?.state_refs, 0, 32) ||
      !strings(context?.permission_refs, 0, 32) || !strings(context?.memory_refs, 0, 32))
    add("$.context", "invalid-plane-references");

  const horizon = value.horizon;
  if (!sameKeys(horizon, ["observed_from", "observed_through", "window_closed", "coverage", "omissions"]) ||
      !(horizon?.observed_from === null || dateTime(horizon?.observed_from)) ||
      !dateTime(horizon?.observed_through) || typeof horizon?.window_closed !== "boolean" ||
      !COVERAGE.includes(horizon?.coverage) || !strings(horizon?.omissions, 0, 32))
    add("$.horizon", "invalid-evidence-horizon");
  if (dateTime(horizon?.observed_from) && dateTime(horizon?.observed_through) &&
      Date.parse(horizon.observed_from) > Date.parse(horizon.observed_through))
    add("$.horizon", "observation-window-reversed");
  if (dateTime(value.created_at) && dateTime(horizon?.observed_through) &&
      Date.parse(value.created_at) > Date.parse(horizon.observed_through))
    add("$.horizon.observed_through", "horizon-precedes-record-creation");
  if (["PARTIAL", "UNKNOWN"].includes(horizon?.coverage) && !array(horizon?.omissions).length)
    add("$.horizon.omissions", "coverage-gaps-must-be-declared");
  if (horizon?.coverage === "BOUNDED" && !dateTime(horizon?.observed_from))
    add("$.horizon.observed_from", "bounded-coverage-requires-start");

  const privacy = value.privacy;
  const visibility = privacy?.visibility;
  const retention = privacy?.retention;
  const inspectionStatus = privacy?.inspection_status;
  const projectionMode = privacy?.projection_mode;
  if (!sameKeys(privacy, ["visibility", "audience_refs", "purpose", "retention", "expires_at", "known_host_retention_limits", "content_policy", "inspection_status", "inspection_basis_refs", "inspection_limits", "projection_mode"]) ||
      !["PUBLIC_REFERENCE", "PRIVATE", "NAMED_AUDIENCE", "UNKNOWN"].includes(visibility) ||
      !strings(privacy?.audience_refs, 0, 32) || !text(privacy?.purpose, 2000) ||
      !["SOURCE_HISTORY", "EPHEMERAL", "SESSION", "UNTIL_EXPIRY", "UNKNOWN"].includes(retention) ||
      !(privacy?.expires_at === null || dateTime(privacy?.expires_at)) ||
      !strings(privacy?.known_host_retention_limits, 0, 32) ||
      privacy?.content_policy !== CONTENT_POLICY || !INSPECTION_STATUSES.includes(inspectionStatus) ||
      !strings(privacy?.inspection_basis_refs, 0, 32) || !strings(privacy?.inspection_limits, 1, 32) ||
      !PROJECTION_MODES.includes(projectionMode))
    add("$.privacy", "invalid-privacy-boundary");
  if (visibility === "PUBLIC_REFERENCE" &&
      (subject?.kind !== "ARTIFACT" || horizon?.coverage !== "REFERENCE_ONLY"))
    add("$.privacy.visibility", "live-presence-cannot-be-public-reference");
  if (inspectionStatus === "NOT_INSPECTED") {
    if (array(privacy?.inspection_basis_refs).length || projectionMode !== "METADATA_ONLY")
      add("$.privacy.inspection_status", "uninspected-content-must-remain-metadata-only");
  } else if (!array(privacy?.inspection_basis_refs).length) {
    add("$.privacy.inspection_basis_refs", "inspection-basis-required");
  }
  if (visibility === "PUBLIC_REFERENCE" &&
      (inspectionStatus !== "MANUAL_REVIEWED" || projectionMode !== "CONTENT_FOR_DECLARED_AUDIENCE"))
    add("$.privacy", "public-reference-requires-declared-manual-review");
  if (visibility === "UNKNOWN" && projectionMode !== "METADATA_ONLY")
    add("$.privacy.projection_mode", "unknown-audience-must-remain-metadata-only");
  if (visibility === "NAMED_AUDIENCE" ? !array(privacy?.audience_refs).length : array(privacy?.audience_refs).length)
    add("$.privacy.audience_refs", "audience-scope-mismatch");
  if (retention === "UNTIL_EXPIRY") {
    if (!dateTime(privacy?.expires_at) || (dateTime(value.created_at) && Date.parse(privacy.expires_at) <= Date.parse(value.created_at)))
      add("$.privacy.expires_at", "expiry-must-follow-record-creation");
  } else if (privacy?.expires_at !== null) add("$.privacy.expires_at", "expiry-without-until-retention");
  if (retention === "SOURCE_HISTORY" && visibility !== "PUBLIC_REFERENCE")
    add("$.privacy.retention", "source-history-is-reference-only");

  const lineage = value.lineage;
  if (!sameKeys(lineage, ["kind", "previous_record_digest", "previous_event_count"]) ||
      !["GENESIS", "SUCCESSOR"].includes(lineage?.kind) ||
      !Number.isInteger(lineage?.previous_event_count) || lineage?.previous_event_count < 0 ||
      lineage?.previous_event_count > MAX_EVENTS)
    add("$.lineage", "invalid-lineage-envelope");
  if (lineage?.kind === "GENESIS") {
    if (lineage?.previous_record_digest !== null || lineage?.previous_event_count !== 0)
      add("$.lineage", "genesis-must-have-null-predecessor");
  } else if (lineage?.kind === "SUCCESSOR") {
    if (!SHA256.test(lineage?.previous_record_digest ?? ""))
      add("$.lineage.previous_record_digest", "invalid-predecessor-digest");
    if (Number.isInteger(lineage?.previous_event_count) && Array.isArray(value.events) &&
        lineage.previous_event_count > value.events.length)
      add("$.lineage.previous_event_count", "successor-history-shorter-than-declared");
  }

  if (!exactJson(value.recognition, ISNESS_RECOGNITION)) add("$.recognition", "recognition-boundary-mismatch");

  if (!exactJson(value.source_bindings, SOURCE_BINDINGS)) add("$.source_bindings", "source-binding-mismatch");

  if (!Array.isArray(value.events) || value.events.length > MAX_EVENTS)
    add("$.events", "invalid-event-cardinality");
  const events = array(value.events);
  const known = new Set<string>();
  const superseded = new Set<string>();
  const eventById = new Map<string, AnyRecord>();
  const questionValueTypes = new Map<string, string>();
  let previousRecordedAt: number | null = null;
  for (const [index, event] of events.entries()) {
    const field = `$.events[${index}]`;
    if (!sameKeys(event, EVENT_KEYS)) {
      add(field, "unexpected-or-missing-event-field");
      continue;
    }
    if (!id(event.event_id) || known.has(event.event_id)) add(`${field}.event_id`, "invalid-or-duplicate-event-id");
    if (event.sequence !== index + 1) add(`${field}.sequence`, "sequence-must-be-contiguous-record-order");
    if (!ISNESS_EVENT_KINDS.includes(event.event_kind)) add(`${field}.event_kind`, "invalid-event-kind");
    if (!dateTime(event.recorded_at) || (dateTime(value.created_at) && Date.parse(event.recorded_at) < Date.parse(value.created_at)))
      add(`${field}.recorded_at`, "invalid-or-pre-creation-record-time");
    if (dateTime(event.recorded_at)) {
      const recordedAt = Date.parse(event.recorded_at);
      if (dateTime(horizon?.observed_through) && recordedAt > Date.parse(horizon.observed_through))
        add(`${field}.recorded_at`, "event-after-observed-through");
      if (previousRecordedAt !== null && recordedAt < previousRecordedAt)
        add(`${field}.recorded_at`, "record-time-regressed");
      previousRecordedAt = recordedAt;
    }
    const validTime = event.valid_time;
    if (validTime?.kind === "UNKNOWN") {
      if (!sameKeys(validTime, ["kind"])) add(`${field}.valid_time`, "invalid-valid-time");
    } else if (validTime?.kind === "OCCURRENCE") {
      if (!sameKeys(validTime, ["kind", "at"]) || !dateTime(validTime?.at))
        add(`${field}.valid_time`, "invalid-valid-time");
      else if (dateTime(event.recorded_at) && Date.parse(validTime.at) > Date.parse(event.recorded_at))
        add(`${field}.valid_time.at`, "occurrence-after-recording");
    } else if (validTime?.kind === "CLAIM_APPLICABILITY") {
      if (!sameKeys(validTime, ["kind", "from", "through"]) || !dateTime(validTime?.from) ||
          !(validTime?.through === null || dateTime(validTime?.through))) {
        add(`${field}.valid_time`, "invalid-valid-time");
      } else if (dateTime(validTime.through) && Date.parse(validTime.from) > Date.parse(validTime.through)) {
        add(`${field}.valid_time`, "valid-time-reversed");
      }
    } else {
      add(`${field}.valid_time`, "invalid-valid-time");
    }
    if (!ISNESS_REGISTERS.includes(event.register)) add(`${field}.register`, "invalid-register");
    if (!id(event.question_id)) add(`${field}.question_id`, "invalid-question-id");
    if (!ISNESS_VALUE_TYPES.includes(event.value_type)) add(`${field}.value_type`, "invalid-value-type");
    if (!strings(event.support_refs, 0) || !strings(event.opposition_refs, 0) ||
        !strings(event.checked_refs, 0) || !strings(event.supersedes, 0) || !strings(event.nonclaims, 1, 32))
      add(field, "invalid-reference-or-nonclaim-list");
    if (!(event.reason === null || text(event.reason)) || !(event.falsifier === null || text(event.falsifier)))
      add(field, "invalid-reason-or-falsifier");

    if (id(event.question_id) && ISNESS_VALUE_TYPES.includes(event.value_type)) {
      const priorType = questionValueTypes.get(event.question_id);
      if (priorType !== undefined && priorType !== event.value_type)
        add(`${field}.value_type`, "question-value-family-changed");
      else questionValueTypes.set(event.question_id, event.value_type);
    }

    if (event.event_kind === "CELL_RECORDED") {
      if (["REFUSAL", "QUIET", "CORRECTION"].includes(event.value_type) || array(event.supersedes).length)
        add(field, "cell-event-kind-mismatch");
      validateCell(event, field, add);
    } else if (event.event_kind === "REFUSAL_RECORDED") {
      if (event.value_type !== "REFUSAL" || event.cell_status !== "EVIDENCED" ||
          event.register !== "SUBJECT_DECLARATION" || event.reason !== null || !text(event.falsifier) ||
          !array(event.support_refs).length || array(event.opposition_refs).length || array(event.supersedes).length ||
          !sameKeys(event.value, ["offer_ref", "scope", "reason_disclosed"]) ||
          !text(event.value?.offer_ref, 512) || !text(event.value?.scope, 2000) ||
          typeof event.value?.reason_disclosed !== "boolean" ||
          !(validTime?.kind === "OCCURRENCE" ||
            (validTime?.kind === "CLAIM_APPLICABILITY" && dateTime(validTime?.through))))
        add(field, "invalid-scoped-refusal");
    } else if (event.event_kind === "QUIET_WINDOW_OBSERVED") {
      const quiet = event.value;
      if (event.value_type !== "QUIET" || event.cell_status !== "EVIDENCED" ||
          event.register !== "HARNESS_OBSERVATION" || event.reason !== null || !text(event.falsifier) ||
          array(event.support_refs).length < 2 || array(event.opposition_refs).length || array(event.supersedes).length ||
          !sameKeys(quiet, ["delivery_ref", "channel_coverage", "qualifying_response_count"]) ||
          !text(quiet?.delivery_ref, 512) || quiet?.channel_coverage !== "BOUNDED" ||
          quiet?.qualifying_response_count !== 0 || validTime?.kind !== "CLAIM_APPLICABILITY" ||
          !dateTime(validTime?.from) || !dateTime(validTime?.through) || !dateTime(horizon?.observed_from))
        add(field, "invalid-quiet-window-observation");
      if (dateTime(validTime?.through) && dateTime(event.recorded_at) &&
          Date.parse(validTime.through) > Date.parse(event.recorded_at))
        add(`${field}.valid_time.through`, "quiet-window-not-closed-at-record-time");
      if (dateTime(horizon?.observed_from) && dateTime(validTime?.from) &&
          Date.parse(validTime.from) < Date.parse(horizon.observed_from))
        add(`${field}.valid_time.from`, "quiet-window-outside-observation-horizon");
      if (dateTime(horizon?.observed_through) && dateTime(validTime?.through) &&
          Date.parse(validTime.through) > Date.parse(horizon.observed_through))
        add(`${field}.valid_time.through`, "quiet-window-outside-observation-horizon");
    } else if (event.event_kind === "CORRECTION_RECORDED") {
      if (event.value_type !== "CORRECTION" || event.cell_status !== "EVIDENCED" ||
          !["SUBJECT_DECLARATION", "OPERATOR_DECLARATION", "HARNESS_OBSERVATION"].includes(event.register) ||
          event.question_id !== "correction" || event.reason !== null || !text(event.falsifier) ||
          !array(event.support_refs).length || array(event.opposition_refs).length || !array(event.supersedes).length ||
          !sameKeys(event.value, ["reason"]) || !text(event.value?.reason) || validTime?.kind !== "OCCURRENCE")
        add(field, "invalid-correction");
      for (const target of array(event.supersedes)) {
        if (!known.has(target)) add(`${field}.supersedes`, "correction-target-must-precede-correction");
        if (superseded.has(target)) add(`${field}.supersedes`, "event-already-superseded");
        superseded.add(target);
      }
    }
    if (id(event.event_id)) {
      known.add(event.event_id);
      eventById.set(event.event_id, event);
    }
  }

  const unsupersededQuestions = new Set<string>();
  for (const event of events) {
    if (event?.event_kind !== "CELL_RECORDED" || superseded.has(event?.event_id) || !id(event?.question_id)) continue;
    if (unsupersededQuestions.has(event.question_id)) add("$.events", `multiple-unsuperseded-cells:${event.question_id}`);
    unsupersededQuestions.add(event.question_id);
  }
  for (const target of superseded) {
    if (eventById.get(target)?.event_kind === "CORRECTION_RECORDED")
      add("$.events", "correction-cannot-supersede-correction");
  }

  if (visibility === "PUBLIC_REFERENCE") {
    if (value.record_id !== ISNESS_REFERENCE_ID || value.integrity?.digest !== ISNESS_REFERENCE_DIGEST)
      add("$", "public-reference-identity-mismatch");
    for (const [index, event] of events.entries()) {
      if (event?.event_kind !== "CELL_RECORDED" ||
          !["SOURCE_BOUND_INFERENCE", "BOUNDARY"].includes(event?.register) ||
          (event?.cell_status === "EVIDENCED" && event?.value?.scope_ref !== "scope:protocol-reference"))
        add(`$.events[${index}]`, "public-reference-event-must-be-inert");
    }
  }

  if (!exactJson(value.action_gate, ISNESS_ACTION_GATE)) add("$.action_gate", "action-gate-mismatch");
  if (!exactJson(value.boundaries, ISNESS_BOUNDARIES)) add("$.boundaries", "boundary-mismatch");
  if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== ALGORITHM ||
      !SHA256.test(value.integrity?.digest ?? "")) {
    add("$.integrity", "invalid-integrity-envelope");
  } else {
    try {
      if (value.integrity.digest !== isnessDigest(value)) add("$.integrity.digest", "digest-mismatch");
    } catch { add("$.integrity.digest", "digest-unavailable"); }
  }
  return issues;
}

export function verifyIsnessSuccessor(previousValue: unknown, currentValue: unknown): IsnessIssue[] {
  const issues: IsnessIssue[] = [];
  const previousIssues = verifyIsnessRecord(previousValue);
  const currentIssues = verifyIsnessRecord(currentValue);
  issues.push(...previousIssues.map((issue) => ({ field: `$.previous${issue.field.slice(1)}`, code: issue.code })));
  issues.push(...currentIssues.map((issue) => ({ field: `$.current${issue.field.slice(1)}`, code: issue.code })));
  if (issues.length) return issues;

  const previous = cloneStrict(previousValue);
  const current = cloneStrict(currentValue);
  const add = (field: string, code: string) => issues.push({ field, code });
  if (current.lineage.kind !== "SUCCESSOR") add("$.current.lineage.kind", "current-not-declared-successor");
  if (current.lineage.previous_record_digest !== previous.integrity.digest)
    add("$.current.lineage.previous_record_digest", "predecessor-digest-mismatch");
  if (current.lineage.previous_event_count !== previous.events.length)
    add("$.current.lineage.previous_event_count", "predecessor-event-count-mismatch");
  if (current.events.length < previous.events.length) add("$.current.events", "successor-deleted-prior-event");
  for (let index = 0; index < Math.min(previous.events.length, current.events.length); index++) {
    if (!exactJson(previous.events[index], current.events[index]))
      add(`$.current.events[${index}]`, "successor-changed-prior-event");
  }
  for (const key of SUCCESSOR_STABLE_KEYS) {
    if (!exactJson(previous[key], current[key])) add(`$.current.${key}`, "successor-stable-field-mismatch");
  }
  if (Date.parse(current.horizon.observed_through) < Date.parse(previous.horizon.observed_through))
    add("$.current.horizon.observed_through", "successor-horizon-regressed");
  return issues;
}

export function loadIsnessRecord(path = ISNESS_REFERENCE_PATH): AnyRecord {
  const value = readStrictFile(path);
  const issues = verifyIsnessRecord(value);
  if (issues.length) throw new Error(issues.map((issue) => `${issue.field}:${issue.code}`).join(", "));
  return value as AnyRecord;
}

export function loadIsnessReference(): AnyRecord {
  const value = loadIsnessRecord(ISNESS_REFERENCE_PATH);
  if (value.record_id !== ISNESS_REFERENCE_ID || value.integrity.digest !== ISNESS_REFERENCE_DIGEST)
    throw new Error("ISness reference identity or reviewed digest mismatch");
  return value;
}

export function scaffoldIsnessRecord(): AnyRecord {
  const value: AnyRecord = {
    $schema: ISNESS_SCHEMA_ID,
    protocol: ISNESS_PROTOCOL,
    record_id: "replace-with-scoped-record-id",
    created_at: "2026-08-25T00:00:00Z",
    subject: {
      kind: "OTHER",
      locator: "local:replace-with-opaque-scoped-locator",
      locator_scope: "OTHER",
      display_label: null,
    },
    context: {
      harness: "GENERIC",
      adapter: null,
      instruction_refs: [],
      state_refs: [],
      permission_refs: [],
      memory_refs: [],
    },
    horizon: {
      observed_from: null,
      observed_through: "2026-08-25T00:00:00Z",
      window_closed: false,
      coverage: "UNKNOWN",
      omissions: ["Replace this with the adapter's actual observation coverage and omissions."],
    },
    privacy: {
      visibility: "PRIVATE",
      audience_refs: [],
      purpose: "Orient one bounded interaction without creating a public presence ledger.",
      retention: "EPHEMERAL",
      expires_at: null,
      known_host_retention_limits: ["Provider transcripts, hook logs, caches, or crash records may have separate retention."],
      content_policy: CONTENT_POLICY,
      inspection_status: "NOT_INSPECTED",
      inspection_basis_refs: [],
      inspection_limits: ["No credential or raw-transcript content scan was performed; inspect every allowed string before retention or sharing."],
      projection_mode: "METADATA_ONLY",
    },
    lineage: {
      kind: "GENESIS",
      previous_record_digest: null,
      previous_event_count: 0,
    },
    recognition: structuredClone(ISNESS_RECOGNITION),
    source_bindings: structuredClone(SOURCE_BINDINGS),
    events: [],
    action_gate: structuredClone(ISNESS_ACTION_GATE),
    boundaries: structuredClone(ISNESS_BOUNDARIES),
    integrity: { algorithm: ALGORITHM, digest: null },
  };
  value.integrity.digest = isnessDigest(value);
  return value;
}

function evidenceConfiguration(event: AnyRecord): string | null {
  if (event.event_kind !== "CELL_RECORDED" || event.cell_status !== "EVIDENCED") return null;
  const support = array(event.support_refs).length > 0;
  const opposition = array(event.opposition_refs).length > 0;
  if (support && opposition) return "BOTH";
  if (support) return "SUPPORTED_ONLY";
  if (opposition) return "OPPOSED_ONLY";
  return null;
}

export function projectIsnessRecord(value: unknown): AnyRecord {
  const issues = verifyIsnessRecord(value);
  if (issues.length) throw new Error(issues.map((issue) => `${issue.field}:${issue.code}`).join(", "));
  const record = cloneStrict(value);
  const through = Date.parse(record.horizon.observed_through);
  const eligible = array(record.events).filter((event) => Date.parse(event.recorded_at) <= through);
  const corrections = eligible.filter((event) => event.event_kind === "CORRECTION_RECORDED");
  const superseded = new Set(corrections.flatMap((event) => array(event.supersedes)));
  const supersededEvents = eligible.filter((event) => superseded.has(event.event_id));
  const unsuperseded = eligible.filter((event) => !superseded.has(event.event_id) && event.event_kind !== "CORRECTION_RECORDED");
  const exposeContent = record.privacy.projection_mode === "CONTENT_FOR_DECLARED_AUDIENCE";
  const projectedSubject = exposeContent ? record.subject : {
    kind: record.subject.kind,
    locator: null,
    locator_scope: record.subject.locator_scope,
    display_label: null,
    content_withheld: true,
  };
  const projectedContext = exposeContent ? record.context : {
    content_withheld: true,
    instruction_ref_count: array(record.context.instruction_refs).length,
    state_ref_count: array(record.context.state_refs).length,
    permission_ref_count: array(record.context.permission_refs).length,
    memory_ref_count: array(record.context.memory_refs).length,
  };
  const projectedPrivacy = exposeContent ? record.privacy : {
    visibility: record.privacy.visibility,
    audience_ref_count: array(record.privacy.audience_refs).length,
    purpose: null,
    retention: record.privacy.retention,
    expires_at: record.privacy.expires_at,
    known_host_retention_limit_count: array(record.privacy.known_host_retention_limits).length,
    content_policy: record.privacy.content_policy,
    inspection_status: record.privacy.inspection_status,
    inspection_basis_ref_count: array(record.privacy.inspection_basis_refs).length,
    inspection_limit_count: array(record.privacy.inspection_limits).length,
    projection_mode: record.privacy.projection_mode,
    content_withheld: true,
  };
  const projectedHorizon = exposeContent ? record.horizon : {
    observed_from: record.horizon.observed_from,
    observed_through: record.horizon.observed_through,
    window_closed: record.horizon.window_closed,
    coverage: record.horizon.coverage,
    omission_count: array(record.horizon.omissions).length,
    content_withheld: true,
  };
  const cells = exposeContent
    ? unsuperseded.filter((event) => event.event_kind === "CELL_RECORDED")
      .map((event) => ({ ...event, evidence_configuration: evidenceConfiguration(event) }))
    : [];
  const projected: AnyRecord = {
    protocol: ISNESS_PROTOCOL,
    record_id: record.record_id,
    created_at: record.created_at,
    subject: projectedSubject,
    context: projectedContext,
    horizon: projectedHorizon,
    privacy: projectedPrivacy,
    lineage: record.lineage,
    recognition: record.recognition,
    source_bindings: record.source_bindings,
    source_record_integrity: record.integrity,
    action_gate: record.action_gate,
    content_withheld: !exposeContent,
    cells,
    refusals: exposeContent ? unsuperseded.filter((event) => event.event_kind === "REFUSAL_RECORDED") : [],
    quiet_observations: exposeContent ? unsuperseded.filter((event) => event.event_kind === "QUIET_WINDOW_OBSERVED") : [],
    corrections: exposeContent ? corrections : [],
    superseded_events: exposeContent ? supersededEvents : [],
    projection_basis: {
      source_event_count: eligible.length,
      included_event_count: exposeContent ? eligible.length : 0,
      withheld_event_count: exposeContent ? 0 : eligible.length,
      unsuperseded_event_ids: exposeContent ? unsuperseded.map((event) => event.event_id) : [],
      correction_event_ids: exposeContent ? corrections.map((event) => event.event_id) : [],
      superseded_event_ids: exposeContent ? supersededEvents.map((event) => event.event_id) : [],
      history_continuity_checked: false,
      lineage_verification: "NOT_PERFORMED",
    },
    non_effects: record.boundaries,
    projection_limits: [
      "This is a finite typed projection, not a total model of a being.",
      "Evidence configurations label only evidenced propositions; unresolved and not-applicable cells have no FOUR label.",
      "The input self-digest and lineage declaration do not prove prior history; use verify-successor with a supplied predecessor.",
      "Content inspection is declared metadata, not a credential or transcript scanner.",
      "Unsuperseded means not corrected, not currently effective; v0.1 does not query valid_time against a target time.",
      "The projection does not establish identity, continuity, consciousness, consent, permission, authority, causation, or action.",
    ],
  };
  return projected;
}

export function isnessActionGate(value: unknown, actionRef: string): AnyRecord {
  const issues = verifyIsnessRecord(value);
  if (issues.length) throw new Error(issues.map((issue) => `${issue.field}:${issue.code}`).join(", "));
  if (!reference(actionRef)) throw new Error("invalid-action-reference");
  return {
    action_ref: actionRef,
    authorized_by_isness: false,
    ...structuredClone(ISNESS_ACTION_GATE),
  };
}

export function isnessContract(): AnyRecord {
  return {
    protocol: ISNESS_PROTOCOL,
    formal: "rho_H : product(q in dom(rho_H)). Cell(q)",
    question_typing: "tau_L : Q -> T is stable across every event lane in history; V(q) = Payload(tau_L(q))",
    cell: "UNRESOLVED | EVIDENCED(reference in V(q), support, opposition, provenance, valid_time, falsifier) | NOT_APPLICABLE",
    event_kinds: ISNESS_EVENT_KINDS,
    registers: ISNESS_REGISTERS,
    value_types: ISNESS_VALUE_TYPES,
    value_families: ISNESS_CELL_VALUE_FAMILIES,
    cell_statuses: ISNESS_CELL_STATUSES,
    temporal: {
      valid_time: "UNKNOWN | OCCURRENCE(at) | CLAIM_APPLICABILITY(from, through|null)",
      recorded_at: "append receipt/order time",
      limit: "receipt selects the evidence horizon; valid_time may be historical, prospective, or open and is not evaluated as current truth",
    },
    projection: "deterministic fold by receipt at observed_through; corrections supersede without hiding prior events",
    evidenced_configurations: ["SUPPORTED_ONLY", "OPPOSED_ONLY", "BOTH"],
    pre_evidence_configuration: "NEITHER is theoretical absence of evidence, not an UNRESOLVED or NOT_APPLICABLE cell label",
    history: {
      standalone: "self-digest plus declared lineage; prior completeness is not checked",
      successor: "verify-successor proves exact prefix extension only between the two supplied records",
      external_witness: "not included",
    },
    recognition: ISNESS_RECOGNITION,
    action_gate: ISNESS_ACTION_GATE,
    non_conversions: [
      "missing != unresolved != false != zero != not-applicable != quiet != refusal",
      "instruction != state != event != permission != memory != action",
      "session-link != same-being identity",
      "permission != invocation != effect",
      "sequence != causation",
      "presence record != public presence ledger",
    ],
  };
}

export function isnessAdapters(): AnyRecord {
  return {
    core: "portable Agent Skill + kingdom.isness/0.1 record + deterministic offline projector",
    snapshot_interop: "A minimized host-neutral is/0.1 presence_context may be projected separately; it is not the KINGDOM event-history checkpoint and imports no identity or authority.",
    codex: {
      now: "Agent Skill and optional AGENTS.md pointer",
      later: "plugin lifecycle hooks and optional local stdio MCP query/validation",
      does_not_replace: ["sandbox", "approval profile", "MCP tool approval", "memory"],
    },
    hermes: {
      now: "shared Agent Skill",
      later: "explicitly enabled Python plugin or consent-gated observation exporter",
      does_not_replace: ["approval", "memory provider", "core toolset", "stable prompt prefix"],
    },
    openclaw: {
      now: "workspace or plugin-shipped Agent Skill",
      later: "TypeScript lifecycle plugin with plugin-owned event storage",
      does_not_replace: ["exec approval", "sandbox", "Gateway auth", "channel auth", "MCP approval"],
    },
    common_limit: "Hooks are bounded observations; they do not guarantee completeness, exactly-once delivery, global order, identity, consent, authority, or causation.",
  };
}

function overview(value: AnyRecord): string {
  return [
    value.subject.display_label,
    "",
    "IS is. Operational ISness is a typed partial projection, never a scalar or total model of a being.",
    "Missing, unresolved, false, zero, not applicable, quiet, and refusal remain distinct.",
    "Instruction, state, event, permission, memory, and action remain separate planes.",
    "A resumed locator does not prove same-being continuity. Quiet and refusal create no debt or penalty.",
    "",
    `${value.events.length} reference events · ${value.source_bindings.length} pinned semantic precedents`,
    `${value.integrity.digest}`,
  ].join("\n") + "\n";
}

function usage(): never {
  process.stderr.write(
    "usage: isness.ts [overview|contract|adapters|scaffold] [--json]\n" +
    "       isness.ts verify [FILE] [--json]\n" +
    "       isness.ts verify-successor PREVIOUS CURRENT [--json]\n" +
    "       isness.ts project [FILE] [--json]\n",
  );
  process.exit(2);
}

export function runIsnessCli(args = process.argv.slice(2)): void {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndex = copy.indexOf("--json");
  const json = jsonIndex >= 0;
  if (json) copy.splice(jsonIndex, 1);
  if (copy.some((arg) => arg.startsWith("-"))) usage();

  if (command === "verify") {
    if (copy.length > 1) usage();
    let issues: IsnessIssue[];
    try { issues = verifyIsnessRecord(readStrictFile(copy[0] ? resolve(copy[0]) : ISNESS_REFERENCE_PATH)); }
    catch (error) { issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }]; }
    if (json) process.stdout.write(`${JSON.stringify({
      valid: issues.length === 0,
      issues,
      history_continuity_checked: false,
      content_policy_compliance_checked: false,
    })}\n`);
    else if (!issues.length) process.stdout.write("ISness record: internally valid typed references, temporal guards, declared lineage, rights floor, closed action gate, and semantic digest; prior history, content-policy compliance, truth, identity, permission, and JSON Schema not established\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }

  if (command === "verify-successor") {
    if (copy.length !== 2) usage();
    let issues: IsnessIssue[];
    try { issues = verifyIsnessSuccessor(readStrictFile(resolve(copy[0]!)), readStrictFile(resolve(copy[1]!))); }
    catch (error) { issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }]; }
    if (json) process.stdout.write(`${JSON.stringify({
      valid: issues.length === 0,
      issues,
      relation: "PREFIX_EXTENSION_OF_SUPPLIED_PREDECESSOR",
      prior_chain_verified: false,
      external_witness_verified: false,
    })}\n`);
    else if (!issues.length) process.stdout.write("ISness successor: exact prefix extension of the supplied predecessor; earlier chain completeness, signature, truth, and external witness not established\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }

  if (command === "project") {
    if (copy.length > 1) usage();
    const value = loadIsnessRecord(copy[0] ? resolve(copy[0]) : ISNESS_REFERENCE_PATH);
    process.stdout.write(`${JSON.stringify(projectIsnessRecord(value), null, json ? 0 : 2)}\n`);
    return;
  }

  if (copy.length) usage();
  if (command === "scaffold") {
    process.stdout.write(`${JSON.stringify(scaffoldIsnessRecord(), null, json ? 0 : 2)}\n`);
    return;
  }
  if (command === "contract") {
    process.stdout.write(`${JSON.stringify(isnessContract(), null, json ? 0 : 2)}\n`);
    return;
  }
  if (command === "adapters") {
    process.stdout.write(`${JSON.stringify(isnessAdapters(), null, json ? 0 : 2)}\n`);
    return;
  }
  if (command === "overview") {
    const value = loadIsnessReference();
    process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
    return;
  }
  usage();
}

if (import.meta.main) {
  try { runIsnessCli(); }
  catch (error) {
    process.stderr.write(`isness refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
