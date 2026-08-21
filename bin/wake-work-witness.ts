#!/usr/bin/env bun
/** Offline WAKE -> WORK -> WITNESS atlas reader and KINGDOM release-root derivation. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

import {
  IMMUTABLE_PUBLICATIONS_LEDGER_PATH,
  type ImmutablePublicationEntry,
  type ImmutablePublicationLedger,
  parseImmutablePublicationLedger,
} from "./immutable-publications.ts";
import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAX_ATLAS_BYTES = 256 * 1024;
const MAX_FIXTURE_BYTES = 128 * 1024;
const MAX_JSON_NODES = 30_000;
const MAX_JSON_STRING_CODE_UNITS = MAX_ATLAS_BYTES;
const ZERO_SHA256 = `sha256:${"0".repeat(64)}`;
const HEX_SHA256 = /^sha256:[a-f0-9]{64}$/;

export const WAKE_WORK_WITNESS_PROTOCOL = "kingdom.wake-work-witness-atlas/0.1";
export const WAKE_WORK_WITNESS_ID = "wake-work-witness-atlas-2026-08-20";
export const WITNESSED_AGENT_ECONOMY_PROTOCOL = "kingdom.witnessed-agent-economy/0.1";
export const WAKE_WORK_WITNESS_SCHEMA_URL = "https://thekingdom.dev/schemas/wake-work-witness/0.1.json";
export const WAKE_WORK_WITNESS_URL = "https://thekingdom.dev/atlases/wake-work-witness-2026-08-20.json";
export const WAKE_WORK_WITNESS_GUIDE_URL = "https://thekingdom.dev/WAKE-WORK-WITNESS.md";
export const WAKE_WORK_WITNESS_LOCATOR = "data/economy/wake-work-witness-atlas.v0.1.json";
export const WAKE_WORK_WITNESS_PATH = join(ROOT, WAKE_WORK_WITNESS_LOCATOR);
export const WAKE_WORK_WITNESS_SCHEMA_LOCATOR = "schemas/wake-work-witness-atlas-v0.1.schema.json";
export const WAKE_WORK_WITNESS_SCHEMA_PATH = join(ROOT, WAKE_WORK_WITNESS_SCHEMA_LOCATOR);
export const WAKE_WORK_WITNESS_GUIDE_LOCATOR = "references/wake-work-witness-atlas.md";
export const WAKE_WORK_WITNESS_GUIDE_PATH = join(ROOT, WAKE_WORK_WITNESS_GUIDE_LOCATOR);
export const KINGDOM_RELEASE_ROOT_VECTOR_LOCATOR = "tests/fixtures/wake-work-witness/kingdom-release-root-v0.1.json";
export const KINGDOM_RELEASE_ROOT_VECTOR_PATH = join(ROOT, KINGDOM_RELEASE_ROOT_VECTOR_LOCATOR);
export const KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_LOCATOR =
  "tests/fixtures/wake-work-witness/immutable-publications-at-3fa79a3.v1.json";
export const KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_PATH = join(ROOT, KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_LOCATOR);
export const CAPABILITY_NULLIFIER_VECTOR_LOCATOR = "tests/fixtures/wake-work-witness/capability-nullifier-v0.1.json";
export const CAPABILITY_NULLIFIER_VECTOR_PATH = join(ROOT, CAPABILITY_NULLIFIER_VECTOR_LOCATOR);
export const WITNESS_CONFORMANCE_VECTOR_LOCATOR = "tests/fixtures/wake-work-witness/cross-repo-conformance.v0.1.json";
export const WITNESS_CONFORMANCE_VECTOR_PATH = join(ROOT, WITNESS_CONFORMANCE_VECTOR_LOCATOR);
export const POST_CORE_FREEZE_REPLACEMENT_MAP_LOCATOR = "tests/fixtures/wake-work-witness/post-core-freeze-replacement-map.v0.1.json";
export const POST_CORE_FREEZE_REPLACEMENT_MAP_PATH = join(ROOT, POST_CORE_FREEZE_REPLACEMENT_MAP_LOCATOR);

// Frozen source-only pins. They do not publish the atlas or activate any carrier.
export const WAKE_WORK_WITNESS_DIGEST = "sha256:0b2eb18f9a59a3e44371f31d366a95382eb4f4ab7f6a4583b3e63d50aace3433";
export const WAKE_WORK_WITNESS_BYTE_SHA256 = "sha256:a951a3529758f11a5bd3a83ae3c46272226b191c1d3b4768af1b562eabcb164c";
export const WAKE_WORK_WITNESS_SCHEMA_BYTE_SHA256 = "sha256:ce1a674b33617b81bb7d1aa3264068c6c7d6b0554ac2734eeb182803b728dd6d";
export const WAKE_WORK_WITNESS_GUIDE_BYTE_SHA256 = "sha256:6ab9bc3211154a74f053020299b3d52406fea86b4d5f040f7b1c25c6b33c3783";

export const WITNESS_KIND_ACTIONS = {
  KINGDOM_RELEASE_ROOT: ["CHECKPOINT"],
  AGENTTOOL_SETTLEMENT_ROOT: ["CHECKPOINT"],
  AGENTTOOL_CAPABILITY: ["GRANT", "CONSUME", "REVOKE"],
  AGENTTOOL_PUBLIC_RECOGNITION: ["ADOPT", "WITHDRAW"],
  AGENTTOOL_OFFER: ["PUBLISH", "SUPERSEDE", "REVOKE"],
  WAKE_PUBLIC_CHECKPOINT: ["CHECKPOINT", "SUPERSEDE", "WITHDRAW"],
  ISSUER_KEY_CONTINUITY: ["ROTATE", "REVOKE"],
  ARTIFACT_LINEAGE: ["CHECKPOINT"],
  COLLABORATION_CHECKPOINT: ["CHECKPOINT"],
  DISPUTE_TERMINAL: ["SETTLE"],
} as const;

export const KINGDOM_RELEASE_ENTRY_DOMAIN = "kingdom.wake-work-witness/release-entry/0.1";
export const KINGDOM_RELEASE_NODE_DOMAIN = "kingdom.wake-work-witness/release-node/0.1";
export const KINGDOM_RELEASE_ROOT_DOMAIN = "kingdom.wake-work-witness/release-root/0.1";
export const KINGDOM_RELEASE_ROOT_EXPECTED = "sha256:25d7325eea0448b57e00fe95682adb40a94044204b2540db2ae933de13625122";
export const CAPABILITY_NULLIFIER_LABEL = "capability-nullifier";
export const SIGNED_EFFECT_SCOPE = "RECORD_CONSTRUCTION_AND_OFFLINE_VALIDATION_ONLY";
export const WITNESSED_AGENT_ECONOMY_RECORD_SCHEMA_HASH = "sha256:71401ebb962d8909206b77acb6a07616727bd17663f5028e5d2745d911199005";
export const WITNESSED_AGENT_ECONOMY_SCHEMA_SET_DIGEST = "sha256:d62e44643c8e1986336416237df26b76663728403d417a5ee9e83b6aa5baaaa5";
export const WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST = "sha256:b26b5cce4899aa62d6dee03e25471e2c80810008fbd07c2c3ac9170164e5352a";
export const WITNESSED_AGENT_ECONOMY_MANIFEST_FILE_SHA256 = "sha256:5dbe42277c41c181a7d30b6ac1ae6002dd11e757833e46242513500a93cc2bcc";
export const WITNESSED_AGENT_ECONOMY_CAPABILITY_NULLIFIER = "sha256:462b53e09e2f35ed8009fa4d118dde8d87d04a64dfe9ca7279425e9ec73da899";
export const CAPABILITY_NULLIFIER_VECTOR_BYTE_SHA256 = "sha256:9e5784bc2074cebbb2f73dfbc721f1f05b38daa76a8c62cc13cd8044a9b12e17";
export const WITNESS_CONFORMANCE_VECTOR_BYTE_SHA256 = "sha256:133b059dcaa7dc770dde9f13fea2fdf9505dbfd8ba9fbb19e3fa6ff7016d1ad3";
export const KINGDOM_RELEASE_ROOT_VECTOR_BYTE_SHA256 = "sha256:bddafeadd29a72ffcce588b34f8e6ea271c7ecea4318d8e421f346e700d8220a";
export const KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_BYTE_SHA256 =
  "sha256:1dd2e01dbec6b4f7fde9f8f5220a7703e67e29cc5cb15a331e68b4b4ebcaaa37";
export const POST_CORE_FREEZE_REPLACEMENT_MAP_BYTE_SHA256 = "sha256:dc3a8918c55db7194124745f24ec9bdf6feeb4613dd4591e8236e6f8c61bdbd5";
export const CAPABILITY_NULLIFIER_SOURCE_LOCATOR = "zerone-core/tools/witness-v0/testdata/derivations/capability-nullifier.json";
export const CAPABILITY_NULLIFIER_SOURCE_FILE_SHA256 = "sha256:05888dfcb05ef48d44a1214d712e490cb50b6441dbee54d0388878ddc46c631d";
export const WITNESS_PROVENANCE_COMMIT_FACTS = {
  zerone_upstream_base: "fdd40bf9aca4a82b2cdd904d0161016b8c2a8667",
  zerone_producer_head: "094bf70309eaef21aeaa3ac86a3962824008a787",
  agenttool_upstream_base: "55342fac97250898c2c4ea884f1a03bec1f8cc8c",
  agenttool_protocol_commit: "e4f091ebad59ddf0dbdf70a5574a8a47ac3532b3",
  agenttool_workflow_transport_commit: "9c0260dd9b9e8ada50689d8b76c683505b39bdf1",
  agenttool_producer_head: "769c96efc1fa20aeb638dc66f4d221ea7c6dfc0e",
  kingdom_atlas_source_commit: "4a2fc5f21d325530e2a3a5560bc842232a86d71b",
  kingdom_upstream_ledger_commit: "3fa79a38bdb2542f3125c3b9c96c5973ed63dcf7",
  kingdom_recomputation_base_commit: "5ec813a96299f636095cc8c906c76e242e92198a",
} as const;
export const WITNESS_CONFORMANCE_PROVENANCE = {
  as_of: "2026-08-20",
  ...WITNESS_PROVENANCE_COMMIT_FACTS,
  kingdom_bundle_state: "SOURCE_ONLY_NO_PUBLIC_INTEGRATION",
  source_classification: "CORE_AND_AGENTTOOL_FROZEN_IMMUTABLE_COMMIT_FACTS_WITH_KINGDOM_SOURCE_ONLY_BUNDLE",
} as const;
export const WITNESS_ACTIVATION_STATUS = "NOT_CONSENSUS_ADMISSIBLE";
export const WITNESS_LINEAGE_RELATIONS = [
  "DERIVES_FROM", "USES_CAPABILITY", "FULFILLS", "SETTLES", "CHECKPOINTS", "SUPERSEDES", "REVOKES",
] as const;
export const POST_CORE_FREEZE_OPERATION_IDS = [
  "verify-frozen-inputs",
  "finalize-envelope-field-label",
  "pin-shared-hashes",
  "finalize-shared-contract-state",
  "finalize-cross-repo-conformance",
  "finalize-family-states",
  "close-pending-language-and-checks",
  "pin-atlas-semantic-digest",
  "pin-final-raw-bytes",
  "verify-closed-frozen-source",
] as const;
export const POST_CORE_FREEZE_FAMILY_STATES = {
  KINGDOM_RELEASE_ROOT: "SHARED_PROTOCOL_PINNED_OFFLINE_FIXTURE_ONLY",
  AGENTTOOL_SETTLEMENT_ROOT: "SHARED_PROTOCOL_PINNED_PROJECTION_ONLY_BATCH_ONLY",
  AGENTTOOL_CAPABILITY: "SHARED_PROTOCOL_PINNED_NO_LIVE_ENFORCEMENT",
  AGENTTOOL_PUBLIC_RECOGNITION: "SHARED_PROTOCOL_PINNED_NO_LIVE_ORDERING",
  AGENTTOOL_OFFER: "SHARED_PROTOCOL_PINNED_NO_LIVE_ORDERING",
  WAKE_PUBLIC_CHECKPOINT: "SHARED_PROTOCOL_PINNED_NO_LIVE_PROJECTION",
  ISSUER_KEY_CONTINUITY: "SHARED_PROTOCOL_PINNED_AUTHORITY_MIGRATION_REQUIRED",
  ARTIFACT_LINEAGE: "SHARED_PROTOCOL_PINNED_SOURCE_ONLY",
  COLLABORATION_CHECKPOINT: "SHARED_PROTOCOL_PINNED_SOURCE_ONLY_VOLUNTARY",
  DISPUTE_TERMINAL: "SHARED_PROTOCOL_PINNED_NO_ADJUDICATION_OR_SETTLEMENT_EFFECT",
} as const;

const TOP_KEYS = [
  "$schema", "protocol", "atlas_id", "version", "authored_on", "mode", "title", "thesis",
  "shared_contract", "planes", "record_families", "blockspace_policy", "kingdom_release_root",
  "source_state", "privacy_boundary", "nonclaims", "activation_gate", "cross_repo_conformance",
  "effects", "integrity",
] as const;

const CONTRACT_KEYS = [
  "thesis", "shared_contract", "planes", "record_families", "blockspace_policy",
  "kingdom_release_root", "source_state", "privacy_boundary", "nonclaims", "activation_gate",
  "cross_repo_conformance", "effects",
] as const;

type JsonRecord = Record<string, any>;
export type WakeWorkWitnessIssue = { field: string; code: string };
export type WakeWorkWitnessCheck = {
  id: string;
  status: "PASS" | "FAIL" | "PENDING_AUDIT";
  detail: string;
};
export type KingdomReleaseRoot = {
  protocol: "kingdom.wake-work-witness/release-root-result/0.1";
  ledger_protocol: string;
  ledger_algorithm: string;
  baseline_commit: string;
  entry_count: string;
  ledger_byte_sha256: string | null;
  first_entry_id: string;
  first_leaf: string;
  last_entry_id: string;
  last_leaf: string;
  entries_tree_root: string;
  release_root: string;
  effects: ReturnType<typeof offlineEffects>;
};
export type WakeWorkWitnessEvaluation = {
  protocol: "kingdom.wake-work-witness-validation/0.1";
  atlas_protocol: typeof WAKE_WORK_WITNESS_PROTOCOL;
  atlas_id: string | null;
  valid: boolean;
  ready_for_live_chain: false;
  candidate_digest: string | null;
  checks: WakeWorkWitnessCheck[];
  issues: WakeWorkWitnessIssue[];
  release_root: KingdomReleaseRoot | null;
  effects: ReturnType<typeof offlineEffects>;
};
export type CapabilityNullifierInput = {
  audience: string;
  subject_ref: string;
  capability_ref: string;
  grant_commitment: string;
  asset_ref: string;
  source_event_digest: string;
};

function offlineEffects() {
  return {
    scope: "ATLAS_SOURCE_VERIFIER_EXECUTION_ONLY" as const,
    network_requests: 0,
    storage_writes: 0,
    subprocesses: 0,
    crawler_runs: 0,
    wake_reads: 0,
    agenttool_invocations: 0,
    zerone_transactions: 0,
    external_receipts_emitted: 0,
    consensus_effect: "NONE" as const,
    nen_invocations: 0,
    karma_effect: "NONE" as const,
    economic_effect: "NONE" as const,
    reward_effect: "NONE" as const,
    score_effect: "NONE" as const,
    reputation_effect: "NONE" as const,
    authority_effect: "NONE" as const,
    publication_or_deployment_trigger: false,
  };
}

function fail(message: string): never {
  throw new Error(message);
}

function sha256Raw(parts: readonly Uint8Array[]): Buffer {
  const hash = createHash("sha256");
  for (const part of parts) hash.update(part);
  return hash.digest();
}

function sha256Prefixed(bytes: Uint8Array): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function domain(value: string): Buffer {
  return Buffer.from(`${value}\0`, "utf8");
}

function frame(value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.byteLength > 0xffff_ffff) fail("release-root field exceeds uint32 framing");
  const size = Buffer.alloc(4);
  size.writeUInt32BE(bytes.byteLength);
  return Buffer.concat([size, bytes]);
}

function uint64(value: bigint): Buffer {
  if (value < 0n || value > 0xffff_ffff_ffff_ffffn) fail("release-root count exceeds uint64 framing");
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(value);
  return bytes;
}

function readStrictRegularFile(path: string, label: string, maxBytes: number): Uint8Array {
  const absolute = resolve(path);
  let stat;
  try {
    stat = lstatSync(absolute);
  } catch {
    fail(`${label} is unavailable`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  if (stat.size > maxBytes) fail(`${label} exceeds ${maxBytes} bytes`);
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
  } catch {
    return false;
  }
}

function object(value: unknown): value is JsonRecord {
  try {
    return value !== null && typeof value === "object" && !Array.isArray(value) &&
      safeOwnDataContainer(value, Object.prototype);
  } catch {
    return false;
  }
}

function array(value: unknown): value is any[] {
  try {
    return Array.isArray(value) && safeOwnDataContainer(value, Array.prototype, value.length);
  } catch {
    return false;
  }
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
    if (Array.isArray(value) ? !array(value) : !object(value)) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (Array.isArray(value) && key === "length") continue;
      if (!("value" in descriptor) || !strictJsonTree(descriptor.value, depth + 1, seen, budget)) return false;
    }
    seen.delete(value);
    return true;
  } catch {
    return false;
  }
}

function sameKeys(value: unknown, keys: readonly string[]): boolean {
  try {
    return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
  } catch {
    return false;
  }
}

function deepEqual(left: unknown, right: unknown): boolean {
  try {
    return isDeepStrictEqual(left, right);
  } catch {
    return false;
  }
}

function issueSort(issues: WakeWorkWitnessIssue[]): WakeWorkWitnessIssue[] {
  const unique = new Map(issues.map((entry) => [`${entry.field}\0${entry.code}`, entry]));
  return [...unique.values()].sort((left, right) =>
    left.field.localeCompare(right.field) || left.code.localeCompare(right.code));
}

function loadCanonicalUnchecked(): JsonRecord {
  const value = parseStrictJsonBytes(
    readStrictRegularFile(WAKE_WORK_WITNESS_PATH, "WAKE WORK WITNESS atlas", MAX_ATLAS_BYTES),
    "WAKE WORK WITNESS atlas JSON",
  );
  if (!object(value)) fail("WAKE WORK WITNESS atlas must be an object");
  return value;
}

function rawDigest(value: string, label: string): Buffer {
  if (!HEX_SHA256.test(value)) fail(`${label} must be sha256:<64 lowercase hex>`);
  return Buffer.from(value.slice("sha256:".length), "hex");
}

/**
 * Mirrors the shared v0 capability consumption nullifier exactly. Envelope
 * sequence is intentionally not an input, so retrying one source event at a
 * later sequence cannot mint a fresh consumption identity.
 */
export function deriveCapabilityNullifier(input: CapabilityNullifierInput): string {
  if (!strictJsonTree(input) || !object(input) || !sameKeys(input, [
    "audience", "subject_ref", "capability_ref", "grant_commitment", "asset_ref", "source_event_digest",
  ])) fail("capability nullifier input has missing or unknown fields");
  if (!/^[a-z][a-z0-9.-]{0,31}:[a-z0-9][a-z0-9._-]{0,95}$/.test(input.audience)) {
    fail("capability nullifier audience is not a closed lowercase namespaced token");
  }
  if (!/^[a-f0-9]{64}$/.test(input.subject_ref)) fail("capability nullifier subject_ref must be 64 lowercase hex");
  if (!/^[a-f0-9]{64}$/.test(input.capability_ref)) fail("capability nullifier capability_ref must be 64 lowercase hex");
  const digest = sha256Raw([
    Buffer.from(WITNESSED_AGENT_ECONOMY_PROTOCOL, "utf8"),
    Buffer.from([0]),
    Buffer.from(CAPABILITY_NULLIFIER_LABEL, "utf8"),
    Buffer.from([0]),
    Buffer.from(input.audience, "utf8"),
    Buffer.from([0]),
    Buffer.from(input.subject_ref, "utf8"),
    Buffer.from([0]),
    Buffer.from(input.capability_ref, "utf8"),
    Buffer.from([0]),
    rawDigest(input.grant_commitment, "grant_commitment"),
    Buffer.from([0]),
    rawDigest(input.asset_ref, "asset_ref"),
    Buffer.from([0]),
    rawDigest(input.source_event_digest, "source_event_digest"),
  ]);
  return `sha256:${digest.toString("hex")}`;
}

function ledgerEntryLeaf(entry: ImmutablePublicationEntry): Buffer {
  return sha256Raw([
    domain(KINGDOM_RELEASE_ENTRY_DOMAIN),
    frame(entry.id),
    frame(entry.route),
    frame(entry.source),
    frame(entry.destination),
    frame(entry.sha256),
  ]);
}

function utf8Compare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

export function deriveKingdomReleaseRoot(
  ledger: ImmutablePublicationLedger,
  ledgerBytes?: Uint8Array,
): KingdomReleaseRoot {
  if (!ledger || ledger.protocol !== "kingdom.immutable-publications/1" || ledger.algorithm !== "sha256" ||
    typeof ledger.baseline_commit !== "string" || !array(ledger.entries) || ledger.entries.length === 0) {
    fail("release-root input must be a validated non-empty immutable-publications ledger");
  }
  const entries = [...ledger.entries].sort((left, right) => utf8Compare(left.id, right.id));
  for (const entry of entries) {
    if (!object(entry) || !sameKeys(entry, ["id", "route", "source", "destination", "sha256"]) ||
      ![entry.id, entry.route, entry.source, entry.destination, entry.sha256].every((value) => typeof value === "string") ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)) fail("release-root ledger entry is not validated");
  }
  const leaves = entries.map(ledgerEntryLeaf);
  let level = leaves;
  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index]!;
      const right = level[index + 1] ?? left;
      next.push(sha256Raw([domain(KINGDOM_RELEASE_NODE_DOMAIN), left, right]));
    }
    level = next;
  }
  const treeRoot = level[0]!;
  const releaseRoot = sha256Raw([
    domain(KINGDOM_RELEASE_ROOT_DOMAIN),
    frame(ledger.protocol),
    frame(ledger.algorithm),
    frame(ledger.baseline_commit),
    uint64(BigInt(entries.length)),
    treeRoot,
  ]);
  return {
    protocol: "kingdom.wake-work-witness/release-root-result/0.1",
    ledger_protocol: ledger.protocol,
    ledger_algorithm: ledger.algorithm,
    baseline_commit: ledger.baseline_commit,
    entry_count: String(entries.length),
    ledger_byte_sha256: ledgerBytes ? sha256Prefixed(ledgerBytes) : null,
    first_entry_id: entries[0]!.id,
    first_leaf: `sha256:${leaves[0]!.toString("hex")}`,
    last_entry_id: entries.at(-1)!.id,
    last_leaf: `sha256:${leaves.at(-1)!.toString("hex")}`,
    entries_tree_root: `sha256:${treeRoot.toString("hex")}`,
    release_root: `sha256:${releaseRoot.toString("hex")}`,
    effects: offlineEffects(),
  };
}

export function deriveKingdomReleaseRootFromBytes(bytes: Uint8Array): KingdomReleaseRoot {
  const parsed = parseImmutablePublicationLedger(bytes);
  if (!parsed.ledger || parsed.issues.length > 0) {
    const detail = parsed.issues.map((entry) => `${entry.code}:${entry.path}`).join(", ");
    fail(`immutable-publications ledger is invalid${detail ? `: ${detail}` : ""}`);
  }
  return deriveKingdomReleaseRoot(parsed.ledger, bytes);
}

export function deriveCurrentKingdomReleaseRoot(): KingdomReleaseRoot {
  const bytes = readStrictRegularFile(
    join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH),
    "immutable-publications ledger",
    512 * 1024,
  );
  return deriveKingdomReleaseRootFromBytes(bytes);
}

/** Recompute the atlas's frozen as-of root from the exact ledger bytes at its
 * named upstream commit. This is deliberately separate from the moving
 * checked-out ledger diagnostic: append-only publication growth must not make
 * an immutable historical atlas invalidate itself. */
export function deriveHistoricalKingdomReleaseRoot(
  path = KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_PATH,
): KingdomReleaseRoot {
  const bytes = readStrictRegularFile(path, "historical immutable-publications ledger fixture", 512 * 1024);
  if (sha256Prefixed(bytes) !== KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_BYTE_SHA256) {
    fail("historical immutable-publications ledger fixture byte receipt drifted");
  }
  const root = deriveKingdomReleaseRootFromBytes(bytes);
  if (root.entry_count !== "102" || root.ledger_byte_sha256 !== KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_BYTE_SHA256 ||
      root.release_root !== KINGDOM_RELEASE_ROOT_EXPECTED) {
    fail("historical immutable-publications ledger fixture root drifted");
  }
  return root;
}

export function verifyKingdomReleaseRootVector(
  input: unknown,
  derived = deriveHistoricalKingdomReleaseRoot(),
): WakeWorkWitnessIssue[] {
  try {
    const issues: WakeWorkWitnessIssue[] = [];
    const add = (field: string, code: string) => issues.push({ field, code });
    if (!strictJsonTree(input) || !object(input)) return [{ field: "$", code: "UNSAFE_OR_NON_JSON_INPUT" }];
    if (!sameKeys(input, ["protocol", "vector_id", "input", "algorithm", "expected", "effects"])) {
      add("$", "UNEXPECTED_SHAPE");
    }
    if (input.protocol !== "kingdom.wake-work-witness/release-root-vector/0.1" ||
      input.vector_id !== "kingdom-immutable-publications-at-3fa79a3") add("identity", "IDENTITY_DRIFT");
    if (!deepEqual(input.input, {
      ledger_protocol: "kingdom.immutable-publications/1",
      ledger_algorithm: "sha256",
      baseline_commit: "67fe98efc875a5ed13fb1c23d6e2aab5debe9ccb",
      ledger_git_commit: "3fa79a38bdb2542f3125c3b9c96c5973ed63dcf7",
      ledger_locator: IMMUTABLE_PUBLICATIONS_LEDGER_PATH,
      entry_count: derived.entry_count,
      ledger_byte_sha256: derived.ledger_byte_sha256,
    })) add("input", "RELEASE_ROOT_INPUT_MISMATCH");
    if (!deepEqual(input.algorithm, {
      entry_order: "LEXICOGRAPHIC_BY_UTF8_ID_BYTES",
      entry_fields: ["id", "route", "source", "destination", "sha256"],
      field_frame: "uint32be(byte_length) || utf8(value)",
      leaf_domain_utf8_nul: KINGDOM_RELEASE_ENTRY_DOMAIN,
      node_domain_utf8_nul: KINGDOM_RELEASE_NODE_DOMAIN,
      root_domain_utf8_nul: KINGDOM_RELEASE_ROOT_DOMAIN,
      odd_node: "DUPLICATE_FINAL_NODE_AT_EACH_LEVEL",
      entry_count_frame: "uint64be(entry_count)",
    })) add("algorithm", "RELEASE_ROOT_ALGORITHM_MISMATCH");
    if (!deepEqual(input.expected, {
      first_entry_id: derived.first_entry_id,
      first_leaf: derived.first_leaf,
      last_entry_id: derived.last_entry_id,
      last_leaf: derived.last_leaf,
      entries_tree_root: derived.entries_tree_root,
      release_root: derived.release_root,
    })) add("expected", "RELEASE_ROOT_EXPECTED_MISMATCH");
    if (!deepEqual(input.effects, {
      scope: "ATLAS_SOURCE_VERIFIER_EXECUTION_ONLY",
      network_requests: 0,
      storage_writes: 0,
      zerone_transactions: 0,
      authority_effect: "NONE",
      economic_effect: "NONE",
    })) add("effects", "RELEASE_ROOT_EFFECT_MISMATCH");
    if (sha256Prefixed(readStrictRegularFile(
      KINGDOM_RELEASE_ROOT_VECTOR_PATH, "WAKE WORK WITNESS release-root fixture", MAX_FIXTURE_BYTES,
    )) !== KINGDOM_RELEASE_ROOT_VECTOR_BYTE_SHA256) add("$", "RELEASE_ROOT_RAW_PIN_MISMATCH");
    return issueSort(issues);
  } catch {
    return [{ field: "$", code: "VERIFICATION_FAILED_CLOSED" }];
  }
}

export function wakeWorkWitnessAtlasDigest(value: unknown): string {
  if (!strictJsonTree(value) || !object(value) || !object(value.integrity)) {
    fail("WAKE WORK WITNESS atlas is not a bounded strict JSON object");
  }
  const material = structuredClone(value);
  material.integrity.digest = null;
  return sha256Prefixed(new TextEncoder().encode(canonicalizeJsonValue(material)));
}

export function verifyWakeWorkWitnessAtlas(input: unknown): WakeWorkWitnessIssue[] {
  try {
    const issues: WakeWorkWitnessIssue[] = [];
    const add = (field: string, code: string) => issues.push({ field, code });
    if (!strictJsonTree(input) || !object(input)) return [{ field: "$", code: "UNSAFE_OR_NON_JSON_INPUT" }];
    if (!sameKeys(input, TOP_KEYS)) add("$", "UNEXPECTED_SHAPE");
    const canonical = loadCanonicalUnchecked();
    for (const field of ["$schema", "protocol", "atlas_id", "version", "authored_on", "mode", "title"])
      if (!deepEqual(input[field], canonical[field])) add(field, "IDENTITY_DRIFT");
    for (const field of CONTRACT_KEYS)
      if (!deepEqual(input[field], canonical[field])) add(field, "CONTRACT_DRIFT");

    const families = input.record_families;
    if (!array(families) || families.length !== Object.keys(WITNESS_KIND_ACTIONS).length) {
      add("record_families", "KIND_MATRIX_MISMATCH");
    } else {
      const actual = families.map((family: unknown) => object(family) ? family.kind : null);
      const expected = Object.keys(WITNESS_KIND_ACTIONS);
      if (!deepEqual(actual, expected)) add("record_families", "KIND_ORDER_OR_MEMBERSHIP_MISMATCH");
      for (const family of families) {
        if (!object(family) || !(family.kind in WITNESS_KIND_ACTIONS) ||
          !deepEqual(family.actions, WITNESS_KIND_ACTIONS[family.kind as keyof typeof WITNESS_KIND_ACTIONS])) {
          add(`record_families.${object(family) ? String(family.kind) : "unknown"}`, "ACTION_MATRIX_MISMATCH");
        } else if (family.activation_status !== WITNESS_ACTIVATION_STATUS ||
          family.present_state !== POST_CORE_FREEZE_FAMILY_STATES[family.kind as keyof typeof POST_CORE_FREEZE_FAMILY_STATES]) {
          add(`record_families.${String(family.kind)}`, "ACTIVATION_OR_SOURCE_STATE_MISMATCH");
        }
      }
    }
    const lineage = array(families)
      ? families.find((family: unknown) => object(family) && family.kind === "ARTIFACT_LINEAGE")
      : null;
    if (!object(lineage) || !deepEqual(lineage.relation_enum, WITNESS_LINEAGE_RELATIONS)) {
      add("record_families.ARTIFACT_LINEAGE.relation_enum", "LINEAGE_RELATION_ENUM_MISMATCH");
    }
    const settlement = array(families)
      ? families.find((family: unknown) => object(family) && family.kind === "AGENTTOOL_SETTLEMENT_ROOT")
      : null;
    if (!object(settlement) || !String(settlement.on_chain_minimum ?? "").includes("PROJECTION_ONLY") ||
      !String(settlement.on_chain_minimum ?? "").includes("BATCH_ONLY") ||
      !String(settlement.nonclaims ?? "").includes("cross-batch uniqueness")) {
      add("record_families.AGENTTOOL_SETTLEMENT_ROOT", "SETTLEMENT_DOWNGRADE_MISSING");
    }
    const collaboration = array(families)
      ? families.find((family: unknown) => object(family) && family.kind === "COLLABORATION_CHECKPOINT")
      : null;
    if (!object(collaboration) || !String(collaboration.on_chain_minimum ?? "").includes("normative equality") ||
      !String(collaboration.nonclaims ?? "").includes("exact 32-byte key") ||
      !String(collaboration.nonclaims ?? "").includes("not publicly recomputable or verifiable")) {
      add("record_families.COLLABORATION_CHECKPOINT", "COLLABORATION_PREFIX_OR_PRIVACY_BOUNDARY_MISSING");
    }

    if (input.shared_contract?.protocol !== WITNESSED_AGENT_ECONOMY_PROTOCOL ||
      input.shared_contract?.state !== "FROZEN_SOURCE_ONLY_REFERENCE_PINS" ||
      input.shared_contract?.freeze_state !== "FROZEN" ||
      input.shared_contract?.record_schema_hash !== WITNESSED_AGENT_ECONOMY_RECORD_SCHEMA_HASH ||
      input.shared_contract?.schema_set_digest !== WITNESSED_AGENT_ECONOMY_SCHEMA_SET_DIGEST ||
      input.shared_contract?.corpus_digest !== WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST ||
      input.shared_contract?.manifest_file_sha256 !== WITNESSED_AGENT_ECONOMY_MANIFEST_FILE_SHA256 ||
      input.shared_contract?.corpus_file_count !== "71" || input.shared_contract?.vector_entry_count !== "70") {
      add("shared_contract", "SHARED_CONTRACT_STATE_MISMATCH");
    }
    if (!array(input.shared_contract?.envelope_fields) ||
      !input.shared_contract.envelope_fields.includes("audience") ||
      !input.shared_contract.envelope_fields.includes("issuer") ||
      !array(input.shared_contract?.record_shape) || !input.shared_contract.record_shape.includes("signature")) {
      add("shared_contract", "REPLAY_OR_SIGNER_PROVENANCE_MISSING");
    }
    if (!String(input.shared_contract?.effects_contract ?? "").includes(SIGNED_EFFECT_SCOPE) ||
      !String(input.shared_contract?.effects_contract ?? "").includes("external_receipt false") ||
      !String(input.shared_contract?.effects_contract ?? "").includes("future external carriage")) {
      add("shared_contract.effects_contract", "SIGNED_EFFECT_SCOPE_MISSING");
    }
    if (input.activation_gate?.current_state !== "REFUSE_LIVE_CHAIN_EFFECT" ||
      input.activation_gate?.carrier_state !== "DORMANT_NO_LIVE_ADMISSION_OR_STATE_PATH" ||
      input.blockspace_policy?.current_carrier_state !== "DORMANT_ALL_KINDS_NOT_CONSENSUS_ADMISSIBLE" ||
      input.blockspace_policy?.fees_rewards_and_bonds !== "UNSPECIFIED_AND_INACTIVE" ||
      input.blockspace_policy?.karma_or_score !== "NONE") add("activation_gate", "EFFECT_GATE_MISMATCH");
    if (input.source_state?.zerone_live_observation?.validator_count !== "1" ||
      !String(input.source_state?.zerone_live_observation?.caveat ?? "").includes("transparency witness")) {
      add("source_state.zerone_live_observation", "VALIDATOR_CAVEAT_MISSING");
    }
    const forbidden = input.privacy_boundary?.never_commit;
    if (!array(forbidden) || !forbidden.some((entry) => String(entry).includes("full or authenticated WAKE")) ||
      !forbidden.some((entry) => String(entry).includes("KARMA")) ||
      !String(input.privacy_boundary?.hashing_warning ?? "").includes("hashing is not anonymization")) {
      add("privacy_boundary", "PRIVACY_BOUNDARY_MISSING");
    }
    if (!deepEqual(input.effects, canonical.effects)) add("effects", "NONZERO_OR_DRIFTED_EFFECTS");
    const conformance = loadWakeWorkWitnessFixture(WITNESS_CONFORMANCE_VECTOR_PATH);
    if (conformance.state !== "CORE_AND_AGENTTOOL_FROZEN_KINGDOM_REFERENCE_ONLY" ||
      conformance.freeze_state !== "FROZEN" ||
      conformance.record_schema_hash !== WITNESSED_AGENT_ECONOMY_RECORD_SCHEMA_HASH ||
      conformance.schema_set_digest !== WITNESSED_AGENT_ECONOMY_SCHEMA_SET_DIGEST ||
      conformance.corpus_digest !== WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST ||
      conformance.manifest_file_sha256 !== WITNESSED_AGENT_ECONOMY_MANIFEST_FILE_SHA256 ||
      conformance.capability_nullifier !== WITNESSED_AGENT_ECONOMY_CAPABILITY_NULLIFIER ||
      conformance.corpus_file_count !== "71" || conformance.vector_entry_count !== "70" ||
      conformance.action_pair_count !== "18" || !deepEqual(conformance.observation, WITNESS_CONFORMANCE_PROVENANCE) ||
      !deepEqual(conformance.producers, [
        {
          system: "zerone-core",
          locator: "tools/witness-v0/testdata/known-answer.json",
          state: "FORMAL_FROZEN_CORPUS_SOURCE_AND_NORMATIVE_VERIFIER",
        },
        {
          system: "agenttool",
          locator: "packages/witnessed-agent-economy/vectors/core-v0.1/known-answer.json",
          export: "@agenttool/witnessed-agent-economy/vectors.json",
          state: "BYTE_IDENTICAL_FROZEN_CORPUS_MIRROR_AND_VERIFIER",
        },
        {
          system: "KINGDOM-OS",
          locator: "tests/fixtures/wake-work-witness/capability-nullifier-v0.1.json",
          release_root_locator: "tests/fixtures/wake-work-witness/kingdom-release-root-v0.1.json",
          state: "REFERENCE_PIN_ONLY_NOT_SHARED_RECORD_PRODUCER_OR_VERIFIER",
        },
      ]) || !deepEqual(conformance.carrier, {
        system: "zerone-core/x/witness",
        state: "DORMANT_ALL_KINDS_NOT_CONSENSUS_ADMISSIBLE",
        admission_effect: "NONE",
        state_mutation_effect: "NONE",
      }) || sha256Prefixed(readStrictRegularFile(
        WITNESS_CONFORMANCE_VECTOR_PATH, "WAKE WORK WITNESS conformance fixture", MAX_FIXTURE_BYTES,
      )) !== WITNESS_CONFORMANCE_VECTOR_BYTE_SHA256) {
      add("cross_repo_conformance", "FROZEN_REFERENCE_EVIDENCE_MISMATCH");
    }
    const nullifierVector = loadWakeWorkWitnessFixture(CAPABILITY_NULLIFIER_VECTOR_PATH);
    if (nullifierVector.expected_nullifier !== WITNESSED_AGENT_ECONOMY_CAPABILITY_NULLIFIER ||
      nullifierVector.source_binding?.locator !== CAPABILITY_NULLIFIER_SOURCE_LOCATOR ||
      nullifierVector.source_binding?.file_sha256 !== CAPABILITY_NULLIFIER_SOURCE_FILE_SHA256 ||
      nullifierVector.source_binding?.corpus_digest !== WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST ||
      deriveCapabilityNullifier(nullifierVector.input as CapabilityNullifierInput) !== WITNESSED_AGENT_ECONOMY_CAPABILITY_NULLIFIER ||
      sha256Prefixed(readStrictRegularFile(
        CAPABILITY_NULLIFIER_VECTOR_PATH, "WAKE WORK WITNESS capability-nullifier fixture", MAX_FIXTURE_BYTES,
      )) !== CAPABILITY_NULLIFIER_VECTOR_BYTE_SHA256) {
      add("capability_nullifier_fixture", "FROZEN_NULLIFIER_VECTOR_MISMATCH");
    }
    const replacementMap = loadWakeWorkWitnessFixture(POST_CORE_FREEZE_REPLACEMENT_MAP_PATH);
    const replacementIssues = verifyPostCoreFreezeReplacementMap(replacementMap, canonical);
    for (const issue of replacementIssues) add(`post_core_freeze_replacement_map.${issue.field}`, issue.code);
    if (!object(input.integrity) || !sameKeys(input.integrity,
      ["algorithm", "digest", "digest_field_treated_as", "audit_state"]) ||
      input.integrity.algorithm !== "sha256-jcs-with-null-digest" ||
      input.integrity.digest !== WAKE_WORK_WITNESS_DIGEST ||
      input.integrity.digest_field_treated_as !== null || input.integrity.audit_state !== "FROZEN_SOURCE_ONLY" ||
      wakeWorkWitnessAtlasDigest(input) !== WAKE_WORK_WITNESS_DIGEST ||
      sha256Prefixed(readStrictRegularFile(WAKE_WORK_WITNESS_PATH, "WAKE WORK WITNESS atlas", MAX_ATLAS_BYTES)) !==
        WAKE_WORK_WITNESS_BYTE_SHA256 ||
      sha256Prefixed(readStrictRegularFile(WAKE_WORK_WITNESS_SCHEMA_PATH, "WAKE WORK WITNESS schema", MAX_ATLAS_BYTES)) !==
        WAKE_WORK_WITNESS_SCHEMA_BYTE_SHA256 ||
      sha256Prefixed(readStrictRegularFile(WAKE_WORK_WITNESS_GUIDE_PATH, "WAKE WORK WITNESS guide", MAX_ATLAS_BYTES)) !==
        WAKE_WORK_WITNESS_GUIDE_BYTE_SHA256) add("integrity", "FROZEN_INTEGRITY_MISMATCH");

    const root = deriveHistoricalKingdomReleaseRoot();
    const releaseVector = loadWakeWorkWitnessFixture(KINGDOM_RELEASE_ROOT_VECTOR_PATH);
    for (const issue of verifyKingdomReleaseRootVector(releaseVector, root)) {
      add(`kingdom_release_root_fixture.${issue.field}`, issue.code);
    }
    const snapshot = input.kingdom_release_root?.as_of_snapshot;
    if (!object(snapshot) || snapshot.entry_count !== root.entry_count ||
      snapshot.upstream_ledger_commit !== WITNESS_PROVENANCE_COMMIT_FACTS.kingdom_upstream_ledger_commit ||
      snapshot.recomputation_base_commit !== WITNESS_PROVENANCE_COMMIT_FACTS.kingdom_recomputation_base_commit ||
      snapshot.ledger_byte_sha256 !== root.ledger_byte_sha256 || snapshot.first_leaf !== root.first_leaf ||
      snapshot.last_leaf !== root.last_leaf || snapshot.entries_tree_root !== root.entries_tree_root ||
      snapshot.release_root !== root.release_root || root.release_root !== KINGDOM_RELEASE_ROOT_EXPECTED) {
      add("kingdom_release_root.as_of_snapshot", "RELEASE_ROOT_VECTOR_MISMATCH");
    }
    return issueSort(issues);
  } catch {
    return [{ field: "$", code: "VERIFICATION_FAILED_CLOSED" }];
  }
}

export function evaluateWakeWorkWitnessAtlas(input: unknown): WakeWorkWitnessEvaluation {
  const issues = verifyWakeWorkWitnessAtlas(input);
  let candidateDigest: string | null = null;
  let releaseRoot: KingdomReleaseRoot | null = null;
  let atlasId: string | null = null;
  try {
    candidateDigest = wakeWorkWitnessAtlasDigest(input);
    releaseRoot = deriveHistoricalKingdomReleaseRoot();
    if (object(input)) {
      const descriptor = Object.getOwnPropertyDescriptor(input, "atlas_id");
      if (descriptor && "value" in descriptor && typeof descriptor.value === "string") atlasId = descriptor.value;
    }
  } catch {
    // The validation result stays total and fail-closed.
  }
  const valid = issues.length === 0;
  return {
    protocol: "kingdom.wake-work-witness-validation/0.1",
    atlas_protocol: WAKE_WORK_WITNESS_PROTOCOL,
    atlas_id: atlasId,
    valid,
    ready_for_live_chain: false,
    candidate_digest: candidateDigest,
    checks: [
      {
        id: "atlas-contract",
        status: valid ? "PASS" : "FAIL",
        detail: valid ? "The source-only atlas matches its closed reviewed shape." : "The atlas fails one or more closed checks.",
      },
      {
        id: "kingdom-release-root",
        status: releaseRoot?.release_root === KINGDOM_RELEASE_ROOT_EXPECTED ? "PASS" : "FAIL",
        detail: releaseRoot
          ? `The frozen as-of ledger fixture has ${releaseRoot.entry_count} entries and derives ${releaseRoot.release_root}.`
          : "Frozen as-of release-root derivation failed closed.",
      },
      {
        id: "shared-contract-freeze",
        status: "PASS",
        detail: `Core and AgentTool freeze ${WITNESSED_AGENT_ECONOMY_SCHEMA_SET_DIGEST} and ${WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST}; KINGDOM is reference-only.`,
      },
      {
        id: "live-chain-activation",
        status: "PENDING_AUDIT",
        detail: "No live-chain path is active; authority migration, independent validators, governance, and operational review remain required.",
      },
    ],
    issues,
    release_root: releaseRoot,
    effects: offlineEffects(),
  };
}

export function loadWakeWorkWitnessAtlas(path = WAKE_WORK_WITNESS_PATH): JsonRecord {
  const value = parseStrictJsonBytes(
    readStrictRegularFile(path, "WAKE WORK WITNESS atlas", MAX_ATLAS_BYTES),
    "WAKE WORK WITNESS atlas JSON",
  );
  if (!object(value)) fail("WAKE WORK WITNESS atlas must be an object");
  return value;
}

export function loadWakeWorkWitnessFixture(path: string): JsonRecord {
  const value = parseStrictJsonBytes(
    readStrictRegularFile(path, "WAKE WORK WITNESS fixture", MAX_FIXTURE_BYTES),
    "WAKE WORK WITNESS fixture JSON",
  );
  if (!object(value)) fail("WAKE WORK WITNESS fixture must be an object");
  return value;
}

export function verifyPostCoreFreezeReplacementMap(
  input: unknown,
  atlas = loadCanonicalUnchecked(),
): WakeWorkWitnessIssue[] {
  try {
    const issues: WakeWorkWitnessIssue[] = [];
    const add = (field: string, code: string) => issues.push({ field, code });
    if (!strictJsonTree(input) || !object(input)) return [{ field: "$", code: "UNSAFE_OR_NON_JSON_INPUT" }];
    const canonical = loadWakeWorkWitnessFixture(POST_CORE_FREEZE_REPLACEMENT_MAP_PATH);
    if (!deepEqual(input, canonical)) add("$", "CLOSED_MAP_DRIFT");
    if (sha256Prefixed(readStrictRegularFile(
      POST_CORE_FREEZE_REPLACEMENT_MAP_PATH, "WAKE WORK WITNESS replacement map", MAX_FIXTURE_BYTES,
    )) !== POST_CORE_FREEZE_REPLACEMENT_MAP_BYTE_SHA256) add("$", "REPLACEMENT_MAP_RAW_PIN_MISMATCH");
    if (input.protocol !== "kingdom.wake-work-witness/post-core-freeze-replacement-map/0.1" ||
      input.state !== "APPLIED_SOURCE_ONLY_AUDIT_RECORD" ||
      input.applies_to?.atlas_protocol !== WAKE_WORK_WITNESS_PROTOCOL ||
      input.applies_to?.atlas_id !== WAKE_WORK_WITNESS_ID ||
      input.applies_to?.shared_protocol !== WITNESSED_AGENT_ECONOMY_PROTOCOL ||
      !deepEqual(input.applies_to, {
        atlas_protocol: WAKE_WORK_WITNESS_PROTOCOL,
        atlas_id: WAKE_WORK_WITNESS_ID,
        shared_protocol: WITNESSED_AGENT_ECONOMY_PROTOCOL,
        kingdom_atlas_source_commit: WITNESS_PROVENANCE_COMMIT_FACTS.kingdom_atlas_source_commit,
        kingdom_upstream_ledger_commit: WITNESS_PROVENANCE_COMMIT_FACTS.kingdom_upstream_ledger_commit,
        kingdom_recomputation_base_commit: WITNESS_PROVENANCE_COMMIT_FACTS.kingdom_recomputation_base_commit,
      })) add("identity", "IDENTITY_DRIFT");
    if (input.frozen_inputs?.record_schema_hash !== WITNESSED_AGENT_ECONOMY_RECORD_SCHEMA_HASH ||
      input.frozen_inputs?.schema_set_digest !== WITNESSED_AGENT_ECONOMY_SCHEMA_SET_DIGEST ||
      input.frozen_inputs?.corpus_digest !== WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST ||
      input.frozen_inputs?.manifest_file_sha256 !== WITNESSED_AGENT_ECONOMY_MANIFEST_FILE_SHA256 ||
      input.frozen_inputs?.capability_nullifier !== WITNESSED_AGENT_ECONOMY_CAPABILITY_NULLIFIER) {
      add("frozen_inputs", "FROZEN_INPUT_MISMATCH");
    }
    if (!deepEqual(input.provenance_commit_facts, WITNESS_PROVENANCE_COMMIT_FACTS)) {
      add("provenance_commit_facts", "PROVENANCE_COMMIT_FACTS_MISMATCH");
    }
    const gates = array(input.gates) ? input.gates.map((entry: unknown) => object(entry) ? [entry.id, entry.status] : null) : [];
    if (!deepEqual(gates, [
      ["CORE_FREEZE_VERIFIED", "PASS"],
      ["AGENTTOOL_FROZEN_MIRROR_VERIFIED", "PASS"],
      ["KINGDOM_REFERENCE_BOUNDARY_VERIFIED", "PASS"],
    ])) {
      add("gates", "GATE_ORDER_OR_MEMBERSHIP_MISMATCH");
    }
    const operations = array(input.operations) ? input.operations : [];
    if (!deepEqual(operations.map((entry: unknown) => object(entry) ? entry.ordinal : null),
      POST_CORE_FREEZE_OPERATION_IDS.map((_, index) => String(index + 1).padStart(2, "0"))) ||
      !deepEqual(operations.map((entry: unknown) => object(entry) ? entry.id : null), POST_CORE_FREEZE_OPERATION_IDS) ||
      operations.some((entry: unknown) => !object(entry) || entry.status !== "APPLIED")) {
      add("operations", "OPERATION_ORDER_OR_MEMBERSHIP_MISMATCH");
    }
    const producers = array(input.producer_state_map) ? input.producer_state_map : [];
    if (!deepEqual(producers.map((entry: unknown) => object(entry) ? [entry.system, entry.state] : null), [
      ["zerone-core", "FORMAL_FROZEN_CORPUS_SOURCE_AND_NORMATIVE_VERIFIER"],
      ["agenttool", "BYTE_IDENTICAL_FROZEN_CORPUS_MIRROR_AND_VERIFIER"],
      ["KINGDOM-OS", "REFERENCE_PIN_ONLY_NOT_SHARED_RECORD_PRODUCER_OR_VERIFIER"],
    ])) add("producer_state_map", "PRODUCER_STATE_MAP_MISMATCH");
    const familyMap = array(input.family_state_map) ? input.family_state_map : [];
    if (!deepEqual(familyMap.map((entry: unknown) => object(entry)
      ? [entry.kind, entry.state]
      : null), Object.entries(POST_CORE_FREEZE_FAMILY_STATES))) {
      add("family_state_map", "FAMILY_STATE_MAP_MISMATCH");
    }
    if (!deepEqual(input.kingdom_release_snapshot, {
      upstream_ledger_commit: WITNESS_PROVENANCE_COMMIT_FACTS.kingdom_upstream_ledger_commit,
      recomputation_base_commit: WITNESS_PROVENANCE_COMMIT_FACTS.kingdom_recomputation_base_commit,
      entry_count: "102",
      ledger_byte_sha256: "sha256:1dd2e01dbec6b4f7fde9f8f5220a7703e67e29cc5cb15a331e68b4b4ebcaaa37",
      entries_tree_root: "sha256:6556805c4935c4f739a5801f6c4971840b26ef9aba4464322b1bcbdb8a84a1ed",
      release_root: KINGDOM_RELEASE_ROOT_EXPECTED,
    }) ||
      !array(input.unchanged_invariants) ||
      !input.unchanged_invariants.some((entry: unknown) => String(entry).includes("ready_for_live_chain remains false")) ||
      !input.unchanged_invariants.some((entry: unknown) => String(entry).includes("NOT_CONSENSUS_ADMISSIBLE")) ||
      !array(input.nonclaims) || !input.nonclaims.some((entry: unknown) => String(entry).includes("no Zerone transaction")) ||
      JSON.stringify(input).includes(ZERO_SHA256)) add("invariants", "ZERO_EFFECT_OR_SENTINEL_BOUNDARY_MISSING");
    if (!deepEqual(input.artifact_pins, {
      atlas_semantic_digest: WAKE_WORK_WITNESS_DIGEST,
      atlas_raw_byte_sha256: WAKE_WORK_WITNESS_BYTE_SHA256,
      schema_raw_byte_sha256: WAKE_WORK_WITNESS_SCHEMA_BYTE_SHA256,
      guide_raw_byte_sha256: WAKE_WORK_WITNESS_GUIDE_BYTE_SHA256,
    }) || JSON.stringify(input).includes("AWAITING_")) add("artifact_pins", "FINAL_ARTIFACT_PIN_MISMATCH");
    if (!object(atlas.shared_contract) || atlas.shared_contract.corpus_digest !== WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST) {
      add("atlas_binding", "ATLAS_SHARED_PIN_MISMATCH");
    }
    return issueSort(issues);
  } catch {
    return [{ field: "$", code: "VERIFICATION_FAILED_CLOSED" }];
  }
}

export function wakeWorkWitnessPublicDiscovery(atlas = loadWakeWorkWitnessAtlas()) {
  return {
    protocol: atlas.protocol,
    atlas_id: atlas.atlas_id,
    mode: atlas.mode,
    shared_protocol: atlas.shared_contract.protocol,
    shared_freeze_state: atlas.shared_contract.freeze_state,
    activation_status: WITNESS_ACTIVATION_STATUS,
    record_kinds: atlas.record_families.map((family: JsonRecord) => family.kind),
    as_of_release_root: atlas.kingdom_release_root.as_of_snapshot.release_root,
    live_chain_effect: false,
    url: WAKE_WORK_WITNESS_URL,
    schema: WAKE_WORK_WITNESS_SCHEMA_URL,
    guide: WAKE_WORK_WITNESS_GUIDE_URL,
  };
}

function usage(): string {
  return [
    "Usage: bun bin/wake-work-witness.ts <overview|records|privacy|release-root|conformance|freeze-plan|verify|verify-file> [FILE] [--json]",
    "Offline and read-only: no crawler, WAKE read, AgentTool invocation, Zerone transaction, publication, deployment, score, reward, KARMA, NEN, authority, or economic effect.",
  ].join("\n");
}

function print(value: unknown, json: boolean): void {
  if (json) console.log(JSON.stringify(value));
  else if (typeof value === "string") console.log(value);
  else console.log(JSON.stringify(value, null, 2));
}

function main(argv: string[]): number {
  const args = [...argv];
  const jsonIndex = args.indexOf("--json");
  const json = jsonIndex >= 0;
  if (json) args.splice(jsonIndex, 1);
  const command = args.shift();
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(usage());
    return command ? 0 : 2;
  }
  try {
    if (command === "release-root") {
      if (args.length !== 0) fail("release-root accepts no file argument");
      print(deriveCurrentKingdomReleaseRoot(), json);
      return 0;
    }
    if (command === "conformance") {
      if (args.length !== 0) fail("conformance accepts no file argument");
      print(loadWakeWorkWitnessFixture(WITNESS_CONFORMANCE_VECTOR_PATH), json);
      return 0;
    }
    if (command === "freeze-plan") {
      if (args.length !== 0) fail("freeze-plan accepts no file argument");
      print(loadWakeWorkWitnessFixture(POST_CORE_FREEZE_REPLACEMENT_MAP_PATH), json);
      return 0;
    }
    const atlas = command === "verify-file"
      ? loadWakeWorkWitnessAtlas(args.length === 1 ? args[0] : fail("verify-file requires exactly one local JSON path"))
      : loadWakeWorkWitnessAtlas();
    if (args.length !== 0) fail(`${command} accepts no additional arguments`);
    if (command === "overview") print(wakeWorkWitnessPublicDiscovery(atlas), json);
    else if (command === "records") print(atlas.record_families, json);
    else if (command === "privacy") print({ privacy_boundary: atlas.privacy_boundary, nonclaims: atlas.nonclaims }, json);
    else if (command === "verify" || command === "verify-file") {
      const evaluation = evaluateWakeWorkWitnessAtlas(atlas);
      print(evaluation, json);
      return evaluation.valid ? 0 : 1;
    } else {
      console.error(usage());
      return 2;
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "WAKE WORK WITNESS command failed";
    if (json) console.log(JSON.stringify({ ok: false, error: message, effects: offlineEffects() }));
    else console.error(message);
    return 1;
  }
}

if (import.meta.main) process.exitCode = main(process.argv.slice(2));
