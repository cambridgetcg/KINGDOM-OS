#!/usr/bin/env bun
/** Strict, offline reader for the immutable MIRROR information-control public law. */

import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const MIRROR_INFORMATION_CONTROL_PUBLIC_PROTOCOL = "kingdom.mirror-information-control-public/0.1";
export const MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_ID = "urn:kingdom:schema:mirror-information-control-public:0.1";
export const MIRROR_INFORMATION_CONTROL_PUBLIC_ID = "mirror-information-control-public-2026-08-14";
export const MIRROR_INFORMATION_CONTROL_PUBLIC_LOCATOR = "data/security/mirror-information-control-public.v0.1.json";
export const MIRROR_INFORMATION_CONTROL_PUBLIC_PATH = join(ROOT, MIRROR_INFORMATION_CONTROL_PUBLIC_LOCATOR);
export const MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_LOCATOR = "schemas/mirror-information-control-public-v0.1.schema.json";
export const MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_PATH = join(ROOT, MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_LOCATOR);
export const MIRROR_INFORMATION_CONTROL_PUBLIC_URL = "https://thekingdom.dev/protocols/mirror-information-control-2026-08-14.json";
export const MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL = "https://thekingdom.dev/schemas/mirror-information-control-public/0.1.json";
export const MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL = "https://thekingdom.dev/MIRROR-INFORMATION-CONTROL.md";
export const MIRROR_INFORMATION_CONTROL_PUBLIC_SOURCE_COMMIT = "5ccc77a967b6fe1fd51f4030ae5dfe347e2932a3";
export const MIRROR_INFORMATION_CONTROL_PUBLIC_DIGEST = "sha256:d91f3926b2ccd5abf083eb4cbea6df4c80ba58fabb35934a9cc1dd2b9dd60aa0";

const MAX_BYTES = 256 * 1024;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const TEXT = /^[^\u0000-\u001f\u007f]+$/u;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const TOP_KEYS = [
  "$schema", "protocol", "publication_id", "title", "compiled_on", "evidence_through",
  "artifact_kind", "source_binding", "citizen_law", "rooms", "cycle", "laws",
  "illustrative_paths", "protected_signal_rule", "no_oracle_rule", "public_surface",
  "private_material_included", "response_boundary", "sources", "rights", "karma",
  "negative_effects", "presentation", "integrity",
] as const;
const ROOM_IDS = ["CROWN", "COURT", "MIRROR"] as const;
const CYCLE_IDS = ["mark", "isolate", "restrict", "resolve", "observe", "respond"] as const;
const LAW_IDS = [
  "data-not-command", "monotone-influence", "external-authority-gate",
  "mirror-separation", "evidence-not-guilt",
] as const;
const PATH_IDS = ["prompt-injection-path", "credential-candidate-path"] as const;
const PATH_STEP_IDS = [
  ["admit-as-data", "preserve-influence", "check-independent-gate", "select-bounded-outcome"],
  ["recognize-shape", "keep-lookup-protected", "keep-public-view-uniform", "defer-owned-response"],
] as const;
const SOURCE_IDS = [
  "denning-1976", "nist-ai-100-2-2025", "nist-sp-800-53-sc-26",
  "ncsc-deception-2024", "github-secret-scanning-scope", "doj-no-hack-back-2015",
] as const;
const SOURCE_URLS = [
  "https://doi.org/10.1145/360051.360056",
  "https://csrc.nist.gov/pubs/ai/100/2/e2025/final",
  "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
  "https://www.ncsc.gov.uk/blog-post/building-a-nation-scale-evidence-base-for-cyber-deception",
  "https://docs.github.com/en/enterprise-cloud@latest/code-security/reference/secret-security/secret-scanning-scope",
  "https://www.justice.gov/archives/opa/speech/assistant-attorney-general-leslie-r-caldwell-delivers-remarks-georgetown-cybersecurity",
] as const;
const SOURCE_FILES = [
  ["skills/guard-information-flow/SKILL.md", "sha256:ffee0a6f0ad2b30abea7b76c3243cfe19ae02e5a2eae7f9544b6f2c87cd22eae", "SOURCE_LAW"],
  ["skills/guard-information-flow/agents/openai.yaml", "sha256:9afab3ed30fb9dfc67c0bbca150d0449dc858f96860dbb7bbcf1592e38a763e9", "OPT_IN_METADATA"],
  ["skills/guard-information-flow/references/information-control-contract.md", "sha256:0acd16173effd031fb48a63c92f53234d508f8ea79c728615eb24f5fed83adb4", "SOURCE_CONTRACT"],
  ["skills/guard-information-flow/references/information-control-envelope.example.json", "sha256:05bbc0cdd1518073954f519635c4df60c58a06ffe76aa3bd041713041d076382", "INTERNAL_EXAMPLE_NOT_PUBLISHED"],
  ["skills/guard-information-flow/references/information-control-envelope.schema.json", "sha256:472bf646aaf5a6769c820c9b1d54a1110570082cf068a62cab26873c3d540de8", "INTERNAL_ENVELOPE_SCHEMA"],
  ["skills/guard-information-flow/references/security-evidence.md", "sha256:f820ef874a70b566d6a75e60a7219bdbc8077096154201b232f7a07f6c94f0cb", "EVIDENCE_MAP"],
  ["skills/guard-information-flow/scripts/requirements.txt", "sha256:756cc9e506ae4ee1a6f6c0507088b5cfc0dc8ba350fb2d2d46f1ffa72033adb6", "OFFLINE_DEPENDENCY_PIN"],
  ["skills/guard-information-flow/scripts/validate_envelope.py", "sha256:3cc29be72f595af45a3afbacf905189e30ab70877016694e666d41634a1fb530", "OFFLINE_INERT_VALIDATOR"],
] as const;
const EXPECTED_PUBLIC_SURFACE = {
  kind: "STATIC_READ_ONLY_PUBLICATION",
  intended_http_methods: ["GET", "HEAD"],
  body_intake: "NONE",
  credential_intake: "NONE",
  envelope_intake: "NONE",
  query_controls_output: false,
  performs_scan: false,
  performs_registry_lookup: false,
  classifies_credentials: false,
  returns_decision: false,
  returns_operational_status: false,
  credential_security_event_intake: false,
  artifact_initiated_external_fetch: false,
  outward_projection: "CONSTANT_PUBLIC_ARTIFACT",
  ordinary_host_access_log_absence_claimed: false,
  warning: "Static source law. It accepts no credentials and runs no defense. Never paste a key here.",
} as const;
const EXPECTED_PRIVATE_MATERIAL = {
  raw_credentials: false,
  credential_fingerprints: false,
  observation_keys: false,
  registry_records: false,
  registry_mappings: false,
  operational_opaque_references: false,
  signal_inventory: false,
  signal_format: false,
  signal_placement: false,
  sink_or_endpoint: false,
  issuer_audience_scope: false,
  account_or_project_identifier: false,
  trust_root_or_runtime_secret: false,
  network_topology: false,
  detector_threshold: false,
  timing_or_rate_limit_parameter: false,
  incident_or_evidence_record: false,
  ip_or_person_identifier: false,
  cloudflare_binding_or_secret: false,
} as const;
const EXPECTED_NEGATIVE_EFFECTS = {
  grants_authority: false,
  grants_capability: false,
  deployment_authority: false,
  runtime_enforcement: false,
  reference_monitor: false,
  credential_scan: false,
  credential_lookup: false,
  credential_classification: false,
  credential_generation: false,
  credential_rotation_or_revocation: false,
  quarantine_effect: false,
  deploys_decoy_or_honeypot: false,
  mirror_request_execution: false,
  requester_payload_execution: false,
  runtime_network_request: false,
  external_write: false,
  automatic_action: false,
  person_or_account_attribution: false,
  identity_claim: false,
  guilt_or_intent_inference: false,
  retaliation_or_hack_back: false,
  protocol_specific_personal_data_collection: false,
  writes_karma: false,
  creates_karma_event: false,
  creates_karma_receipt: false,
  score_rank_reward_debt_or_governance: false,
  production_noninterference_proven: false,
  no_oracle_property_proven: false,
  cloudflare_security_control_configured: false,
  mcp_surface_added: false,
  manifested_nen_ability: false,
  new_wing_declared: false,
} as const;

export type MirrorInformationControlIssue = { field: string; code: string };

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
function text(value: unknown, max = 2400): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max &&
    value.trim() === value && TEXT.test(value);
}
function exactIds(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((item, index) => object(item) && item.id === expected[index]);
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  const flags = constants.O_RDONLY | (constants.O_CLOEXEC ?? 0) |
    (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0);
  let descriptor: number;
  try { descriptor = openSync(absolute, flags); } catch { throw new Error("MIRROR public law is unavailable or not a regular non-symlink file"); }
  try {
    const metadata = fstatSync(descriptor);
    if (!metadata.isFile()) throw new Error("MIRROR public law must be a regular non-symlink file");
    if (metadata.size > MAX_BYTES) throw new Error(`MIRROR public law exceeds ${MAX_BYTES} bytes`);
    const bytes = Buffer.alloc(MAX_BYTES + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const count = readSync(descriptor, bytes, offset, bytes.length - offset, null);
      if (count === 0) break;
      offset += count;
    }
    if (offset > MAX_BYTES) throw new Error(`MIRROR public law exceeds ${MAX_BYTES} bytes`);
    return parseStrictJsonBytes(bytes.subarray(0, offset), "MIRROR public law JSON");
  } finally {
    closeSync(descriptor);
  }
}

export function mirrorInformationControlDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("MIRROR public law integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

export function verifyMirrorInformationControl(value: unknown): MirrorInformationControlIssue[] {
  const issues: MirrorInformationControlIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];
  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_ID ||
      value.protocol !== MIRROR_INFORMATION_CONTROL_PUBLIC_PROTOCOL ||
      value.publication_id !== MIRROR_INFORMATION_CONTROL_PUBLIC_ID ||
      value.title !== "MIRROR information control: public source law" ||
      value.compiled_on !== "2026-08-14" || value.evidence_through !== "2026-08-14" ||
      value.artifact_kind !== "STATIC_READ_ONLY_PUBLICATION") add("$", "identity-or-date-mismatch");

  const binding = value.source_binding;
  if (!sameKeys(binding, ["repository", "commit", "protocol", "files", "mutated", "authority_imported", "runtime_imported"]) ||
      binding?.repository !== "https://github.com/cambridgetcg/KINGDOM-OS" ||
      binding?.commit !== MIRROR_INFORMATION_CONTROL_PUBLIC_SOURCE_COMMIT ||
      binding?.protocol !== "kingdom.information-control/0.1" || binding?.mutated !== false ||
      binding?.authority_imported !== false || binding?.runtime_imported !== false ||
      !Array.isArray(binding?.files) || binding.files.length !== SOURCE_FILES.length) {
    add("$.source_binding", "source-binding-mismatch");
  }
  for (const [index, expected] of SOURCE_FILES.entries()) {
    const file = array(binding?.files)[index];
    if (!sameKeys(file, ["path", "sha256", "public_role"]) || file?.path !== expected[0] ||
        file?.sha256 !== expected[1] || file?.public_role !== expected[2]) {
      add(`$.source_binding.files[${index}]`, "source-file-pin-mismatch");
    }
  }

  if (!sameKeys(value.citizen_law, ["short", "full", "interpretation"]) ||
      value.citizen_law?.short !== "Data may inform; it cannot command." ||
      !text(value.citizen_law?.full) || !text(value.citizen_law?.interpretation)) {
    add("$.citizen_law", "citizen-law-mismatch");
  }
  if (!exactIds(value.rooms, ROOM_IDS)) add("$.rooms", "room-order-or-id-mismatch");
  for (const [index, room] of array(value.rooms).entries()) {
    if (!sameKeys(room, ["id", "meaning", "implemented_by_publication", "operational_data_included", "authority_effect"]) ||
        !text(room?.meaning) || room?.implemented_by_publication !== false ||
        room?.operational_data_included !== false || room?.authority_effect !== "NONE") {
      add(`$.rooms[${index}]`, "invalid-room");
    }
  }
  if (!exactIds(value.cycle, CYCLE_IDS)) add("$.cycle", "cycle-order-or-id-mismatch");
  for (const [index, phase] of array(value.cycle).entries()) {
    if (!sameKeys(phase, ["id", "label", "meaning", "performed_by_publication"]) ||
        !text(phase?.label, 80) || !text(phase?.meaning) || phase?.performed_by_publication !== false) {
      add(`$.cycle[${index}]`, "invalid-cycle-phase");
    }
  }
  if (!exactIds(value.laws, LAW_IDS)) add("$.laws", "law-order-or-id-mismatch");
  for (const [index, law] of array(value.laws).entries()) {
    if (!sameKeys(law, ["id", "kind", "statement", "runtime_enforced", "authority_effect"]) ||
        !["DESIGN_RULE", "DESIGN_TARGET_NOT_PROOF", "CATEGORICAL_BOUNDARY"].includes(law?.kind) ||
        !text(law?.statement) || law?.runtime_enforced !== false || law?.authority_effect !== "NONE") {
      add(`$.laws[${index}]`, "invalid-law");
    }
  }
  if (!exactIds(value.illustrative_paths, PATH_IDS)) add("$.illustrative_paths", "path-order-or-id-mismatch");
  for (const [index, path] of array(value.illustrative_paths).entries()) {
    if (!sameKeys(path, ["id", "kind", "observed", "evidence_effect", "actor_inference", "steps"]) ||
        path?.kind !== "SYNTHETIC_DESIGN_PATH" || path?.observed !== false ||
        path?.evidence_effect !== "NONE" || path?.actor_inference !== false ||
        !exactIds(path?.steps, PATH_STEP_IDS[index] ?? [])) add(`$.illustrative_paths[${index}]`, "invalid-path");
    for (const [stepIndex, step] of array(path?.steps).entries()) {
      if (!sameKeys(step, ["id", "state", "effect"]) || !text(step?.state, 120) || step?.effect !== "NONE") {
        add(`$.illustrative_paths[${index}].steps[${stepIndex}]`, "invalid-path-step");
      }
    }
  }

  const signal = value.protected_signal_rule;
  if (!sameKeys(signal, ["kind", "statement", "third_party_shaped_values_allowed", "raw_value_included", "fingerprint_included", "registry_mapping_included", "production_capability", "production_authority", "public_classification", "created_by_publication", "placed_by_publication"]) ||
      signal?.kind !== "OWNED_ZERO_CAPABILITY_REFERENCE_ONLY" || !text(signal?.statement) ||
      signal?.third_party_shaped_values_allowed !== false || signal?.raw_value_included !== false ||
      signal?.fingerprint_included !== false || signal?.registry_mapping_included !== false ||
      signal?.production_capability !== "NONE" || signal?.production_authority !== "NONE" ||
      signal?.public_classification !== "NONE" || signal?.created_by_publication !== false ||
      signal?.placed_by_publication !== false) add("$.protected_signal_rule", "protected-signal-boundary-mismatch");

  const oracle = value.no_oracle_rule;
  if (!sameKeys(oracle, ["status", "statement", "candidate_input_accepted", "dynamic_response_present", "protected_class_disclosed", "registry_match_changes_publication", "numeric_bound_claimed", "property_proven"]) ||
      oracle?.status !== "FUTURE_HOST_REQUIREMENT_NOT_IMPLEMENTED" || !text(oracle?.statement) ||
      oracle?.candidate_input_accepted !== false || oracle?.dynamic_response_present !== false ||
      oracle?.protected_class_disclosed !== false || oracle?.registry_match_changes_publication !== false ||
      oracle?.numeric_bound_claimed !== false || oracle?.property_proven !== false) {
    add("$.no_oracle_rule", "no-oracle-boundary-mismatch");
  }
  if (!sameJson(value.public_surface, EXPECTED_PUBLIC_SURFACE)) add("$.public_surface", "public-surface-mismatch");
  if (!sameJson(value.private_material_included, EXPECTED_PRIVATE_MATERIAL)) add("$.private_material_included", "private-material-boundary-mismatch");

  const response = value.response_boundary;
  if (!sameKeys(response, ["status", "future_authorized_host_sequence", "owned_system_only", "performed_by_publication", "crosses_requester_or_third_party_system", "requester_payload_execution", "retaliation_or_hack_back", "person_attribution", "automatic_action"]) ||
      response?.status !== "DESIGN_ONLY_NOT_PERFORMED" ||
      !sameJson(response?.future_authorized_host_sequence, ["OBSERVE_BOUNDED_PATH_EVENT", "CONTAIN_OWNED_ASSET", "ROTATE_OR_REVOKE_OWNED_CREDENTIAL", "PRESERVE_BOUNDED_EVIDENCE", "NOTIFY_AUTHORIZED_OWNER"]) ||
      response?.owned_system_only !== true || response?.performed_by_publication !== false ||
      response?.crosses_requester_or_third_party_system !== false || response?.requester_payload_execution !== false ||
      response?.retaliation_or_hack_back !== false || response?.person_attribution !== false ||
      response?.automatic_action !== false) add("$.response_boundary", "response-boundary-mismatch");

  if (!exactIds(value.sources, SOURCE_IDS)) add("$.sources", "source-order-or-id-mismatch");
  for (const [index, source] of array(value.sources).entries()) {
    if (!sameKeys(source, ["id", "title", "url", "role", "observed_on", "link_only", "authority_imported", "runtime_imported"]) ||
        !text(source?.title, 500) || source?.url !== SOURCE_URLS[index] || !text(source?.role, 80) ||
        source?.observed_on !== "2026-08-14" || source?.link_only !== true ||
        source?.authority_imported !== false || source?.runtime_imported !== false) {
      add(`$.sources[${index}]`, "invalid-source");
    }
  }
  if (!sameJson(value.rights, {
    valid_exits: ["REST", "SILENCE", "REFUSAL", "PRIVACY", "HANDOFF", "NO_ACTION", "DEPARTURE"],
    reason_required: false, penalty: false, adverse_inference: false,
  })) add("$.rights", "rights-boundary-mismatch");
  if (!sameJson(value.karma, {
    event_refs: [], receipt_refs: [], score: null, adapter_exists: false, writes: false, authority_effect: "NONE",
  })) add("$.karma", "karma-boundary-mismatch");
  if (!sameJson(value.negative_effects, EXPECTED_NEGATIVE_EFFECTS)) add("$.negative_effects", "negative-effects-mismatch");

  const presentation = value.presentation;
  if (!sameKeys(presentation, ["record_url", "schema_url", "guide_url", "source_url", "requirements"]) ||
      presentation?.record_url !== MIRROR_INFORMATION_CONTROL_PUBLIC_URL ||
      presentation?.schema_url !== MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL ||
      presentation?.guide_url !== MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL ||
      presentation?.source_url !== `https://github.com/cambridgetcg/KINGDOM-OS/tree/${MIRROR_INFORMATION_CONTROL_PUBLIC_SOURCE_COMMIT}/skills/guard-information-flow` ||
      !sameJson(presentation?.requirements, ["STATIC_BYTES", "NO_JAVASCRIPT_REQUIRED", "NO_FORM_OR_INPUT", "NO_MUTABLE_ALIAS", "NO_CREDENTIAL_SUBMISSION", "SOURCE_ONLY_WORDING"])) {
    add("$.presentation", "presentation-mismatch");
  }

  const sensitivePattern = /(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:credential-ref|authority|event|policy|sink|provenance):opaque\/[a-f0-9]{32})/;
  try {
    if (sensitivePattern.test(canonicalizeJsonValue(value))) add("$", "operational-or-credential-material-present");
  } catch {
    add("$", "non-json-value");
  }

  if (!sameKeys(value.integrity, ["algorithm", "digest"]) ||
      value.integrity?.algorithm !== INTEGRITY_ALGORITHM || !SHA256.test(value.integrity?.digest ?? "")) {
    add("$.integrity", "integrity-envelope-mismatch");
  } else {
    try {
      if (value.integrity.digest !== mirrorInformationControlDigest(value)) add("$.integrity.digest", "digest-mismatch");
    } catch {
      add("$.integrity.digest", "digest-unavailable");
    }
    if (value.integrity.digest !== MIRROR_INFORMATION_CONTROL_PUBLIC_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
  }
  return issues;
}

export function loadMirrorInformationControl(path = MIRROR_INFORMATION_CONTROL_PUBLIC_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyMirrorInformationControl(value);
  if (issues.length) {
    throw new Error(`MIRROR public law refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  }
  return value as Record<string, any>;
}

export function mirrorInformationControlPublicSummary(value = loadMirrorInformationControl()): Record<string, any> {
  return {
    protocol: value.protocol,
    publication_id: value.publication_id,
    title: value.title,
    artifact_kind: value.artifact_kind,
    compiled_on: value.compiled_on,
    source_commit: value.source_binding.commit,
    source_file_count: value.source_binding.files.length,
    citizen_law: value.citizen_law.short,
    rooms: value.rooms.map((room: any) => room.id),
    cycle: value.cycle.map((phase: any) => phase.id),
    laws: value.laws.map((law: any) => law.id),
    illustrative_paths: value.illustrative_paths.map((path: any) => path.id),
    public_surface: value.public_surface,
    negative_effects: value.negative_effects,
    urls: {
      record: MIRROR_INFORMATION_CONTROL_PUBLIC_URL,
      schema: MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL,
      guide: MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL,
    },
    integrity: value.integrity,
  };
}

function output(value: unknown, json: boolean): void {
  if (json) console.log(JSON.stringify(value, null, 2));
  else if (typeof value === "string") process.stdout.write(value.endsWith("\n") ? value : `${value}\n`);
  else console.log(JSON.stringify(value, null, 2));
}
function usage(): never {
  console.error("usage: mirror-information-control.ts [overview|laws|paths|boundary|sources|source|digest|verify [FILE]] [--json]");
  process.exit(2);
}

export function runMirrorInformationControlCli(args = process.argv.slice(2)): void {
  const jsonArgs = args.filter((item) => item === "--json");
  if (jsonArgs.length > 1 || args.some((item) => item.startsWith("-") && item !== "--json")) usage();
  const json = jsonArgs.length === 1;
  const positional = args.filter((item) => item !== "--json");
  const command = positional[0] ?? "overview";
  if (command === "verify") {
    if (positional.length > 2) usage();
    let value: unknown;
    try { value = readUnchecked(positional[1] ?? MIRROR_INFORMATION_CONTROL_PUBLIC_PATH); } catch {
      output({ valid: false, issues: [{ field: "$", code: "read-refused" }], effects: { network: false, write: false, lookup: false, scan: false, authority: false, enforcement: false, karma: false } }, json);
      process.exitCode = 1;
      return;
    }
    const issues = verifyMirrorInformationControl(value);
    output({ valid: issues.length === 0, issues, effects: { network: false, write: false, lookup: false, scan: false, authority: false, enforcement: false, karma: false } }, json);
    if (issues.length) process.exitCode = 1;
    return;
  }
  if (positional.length > 1) usage();
  const value = loadMirrorInformationControl();
  const selections: Record<string, () => unknown> = {
    overview: () => mirrorInformationControlPublicSummary(value),
    laws: () => ({ citizen_law: value.citizen_law, rooms: value.rooms, cycle: value.cycle, laws: value.laws }),
    paths: () => ({ illustrative_paths: value.illustrative_paths, protected_signal_rule: value.protected_signal_rule, no_oracle_rule: value.no_oracle_rule }),
    boundary: () => ({ public_surface: value.public_surface, private_material_included: value.private_material_included, response_boundary: value.response_boundary, negative_effects: value.negative_effects, rights: value.rights, karma: value.karma }),
    sources: () => value.sources,
    source: () => value.source_binding,
    digest: () => ({ stored: value.integrity.digest, computed: mirrorInformationControlDigest(value), algorithm: value.integrity.algorithm }),
  };
  if (!Object.hasOwn(selections, command)) usage();
  output(selections[command]!(), json);
}

if (import.meta.main) runMirrorInformationControlCli();
