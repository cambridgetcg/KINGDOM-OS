import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  CAPABILITY_NULLIFIER_VECTOR_PATH,
  CAPABILITY_NULLIFIER_VECTOR_BYTE_SHA256,
  CAPABILITY_NULLIFIER_SOURCE_FILE_SHA256,
  CAPABILITY_NULLIFIER_SOURCE_LOCATOR,
  KINGDOM_RELEASE_ROOT_EXPECTED,
  KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_BYTE_SHA256,
  KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_LOCATOR,
  KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_PATH,
  KINGDOM_RELEASE_ROOT_VECTOR_BYTE_SHA256,
  KINGDOM_RELEASE_ROOT_VECTOR_PATH,
  POST_CORE_FREEZE_FAMILY_STATES,
  POST_CORE_FREEZE_OPERATION_IDS,
  POST_CORE_FREEZE_REPLACEMENT_MAP_PATH,
  POST_CORE_FREEZE_REPLACEMENT_MAP_BYTE_SHA256,
  SIGNED_EFFECT_SCOPE,
  WAKE_WORK_WITNESS_BYTE_SHA256,
  WAKE_WORK_WITNESS_DIGEST,
  WAKE_WORK_WITNESS_GUIDE_BYTE_SHA256,
  WAKE_WORK_WITNESS_GUIDE_PATH,
  WAKE_WORK_WITNESS_ID,
  WAKE_WORK_WITNESS_PATH,
  WAKE_WORK_WITNESS_PROTOCOL,
  WAKE_WORK_WITNESS_SCHEMA_BYTE_SHA256,
  WAKE_WORK_WITNESS_SCHEMA_PATH,
  WITNESSED_AGENT_ECONOMY_PROTOCOL,
  WITNESSED_AGENT_ECONOMY_CAPABILITY_NULLIFIER,
  WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST,
  WITNESSED_AGENT_ECONOMY_MANIFEST_FILE_SHA256,
  WITNESSED_AGENT_ECONOMY_RECORD_SCHEMA_HASH,
  WITNESSED_AGENT_ECONOMY_SCHEMA_SET_DIGEST,
  WITNESS_ACTIVATION_STATUS,
  WITNESS_CONFORMANCE_VECTOR_PATH,
  WITNESS_CONFORMANCE_VECTOR_BYTE_SHA256,
  WITNESS_CONFORMANCE_PROVENANCE,
  WITNESS_PROVENANCE_COMMIT_FACTS,
  WITNESS_KIND_ACTIONS,
  WITNESS_LINEAGE_RELATIONS,
  deriveCurrentKingdomReleaseRoot,
  deriveHistoricalKingdomReleaseRoot,
  deriveCapabilityNullifier,
  deriveKingdomReleaseRoot,
  evaluateWakeWorkWitnessAtlas,
  loadWakeWorkWitnessAtlas,
  loadWakeWorkWitnessFixture,
  verifyWakeWorkWitnessAtlas,
  verifyPostCoreFreezeReplacementMap,
  verifyKingdomReleaseRootVector,
  wakeWorkWitnessAtlasDigest,
  wakeWorkWitnessPublicDiscovery,
} from "../bin/wake-work-witness.ts";
import {
  IMMUTABLE_PUBLICATIONS_LEDGER_PATH,
  parseImmutablePublicationLedger,
} from "../bin/immutable-publications.ts";

const ROOT = dirname(dirname(dirname(WAKE_WORK_WITNESS_PATH)));
const ZERO_SHA256 = `sha256:${"0".repeat(64)}`;
const temporary: string[] = [];

afterEach(() => {
  while (temporary.length > 0) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function authored(): any {
  return JSON.parse(readFileSync(WAKE_WORK_WITNESS_PATH, "utf8"));
}

function codes(value: unknown): string[] {
  return verifyWakeWorkWitnessAtlas(value).map((entry) => entry.code);
}

function fileSha256(path: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

describe("WAKE -> WORK -> WITNESS atlas", () => {
  test("loads one closed source-only atlas with no live effect", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    expect(verifyWakeWorkWitnessAtlas(atlas)).toEqual([]);
    expect(atlas).toMatchObject({
      protocol: WAKE_WORK_WITNESS_PROTOCOL,
      atlas_id: WAKE_WORK_WITNESS_ID,
      mode: "SOURCE_ONLY_OFFLINE_NO_EFFECT",
      shared_contract: {
        protocol: WITNESSED_AGENT_ECONOMY_PROTOCOL,
        state: "FROZEN_SOURCE_ONLY_REFERENCE_PINS",
        freeze_state: "FROZEN",
        record_schema_hash: WITNESSED_AGENT_ECONOMY_RECORD_SCHEMA_HASH,
        schema_set_digest: WITNESSED_AGENT_ECONOMY_SCHEMA_SET_DIGEST,
        corpus_digest: WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST,
        manifest_file_sha256: WITNESSED_AGENT_ECONOMY_MANIFEST_FILE_SHA256,
      },
      activation_gate: {
        current_state: "REFUSE_LIVE_CHAIN_EFFECT",
        carrier_state: "DORMANT_NO_LIVE_ADMISSION_OR_STATE_PATH",
      },
      effects: {
        scope: "ATLAS_SOURCE_VERIFIER_EXECUTION_ONLY",
        network_requests_by_verifier: 0,
        storage_writes_by_verifier: 0,
        subprocesses_by_verifier: 0,
        crawler_runs: 0,
        wake_reads: 0,
        agenttool_invocations: 0,
        zerone_transactions: 0,
        external_receipts_emitted: 0,
        consensus_effect: "NONE",
        economic_effect: "NONE",
        karma_effect: "NONE",
        reward_effect: "NONE",
        score_effect: "NONE",
        authority_effect: "NONE",
        publication_or_deployment_trigger: false,
      },
    });
    const evaluation = evaluateWakeWorkWitnessAtlas(atlas);
    expect(evaluation.valid).toBe(true);
    expect(evaluation.ready_for_live_chain).toBe(false);
    expect(evaluation.effects).toMatchObject({
      scope: "ATLAS_SOURCE_VERIFIER_EXECUTION_ONLY",
      network_requests: 0,
      storage_writes: 0,
      subprocesses: 0,
      zerone_transactions: 0,
      external_receipts_emitted: 0,
      consensus_effect: "NONE",
      karma_effect: "NONE",
      economic_effect: "NONE",
      authority_effect: "NONE",
    });
    expect(evaluation.checks.filter((entry) => entry.status === "PENDING_AUDIT").map((entry) => entry.id))
      .toEqual(["live-chain-activation"]);
    expect(evaluation.checks.find((entry) => entry.id === "kingdom-release-root")).toMatchObject({
      status: "PASS",
    });
    expect(evaluation.checks.find((entry) => entry.id === "kingdom-release-root")?.detail)
      .toContain("frozen as-of ledger fixture");
  });

  test("pins all ten kind/action families without opening a generic fact lane", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    expect(Object.fromEntries(atlas.record_families.map((family: any) => [family.kind, family.actions])))
      .toEqual(WITNESS_KIND_ACTIONS);
    expect(atlas.record_families.map((family: any) => family.kind)).toEqual([
      "KINGDOM_RELEASE_ROOT",
      "AGENTTOOL_SETTLEMENT_ROOT",
      "AGENTTOOL_CAPABILITY",
      "AGENTTOOL_PUBLIC_RECOGNITION",
      "AGENTTOOL_OFFER",
      "WAKE_PUBLIC_CHECKPOINT",
      "ISSUER_KEY_CONTINUITY",
      "ARTIFACT_LINEAGE",
      "COLLABORATION_CHECKPOINT",
      "DISPUTE_TERMINAL",
    ]);
    expect(atlas.record_families.some((family: any) => /KARMA|SCORE|GENERIC_FACT/.test(family.kind))).toBe(false);
    expect(atlas.record_families.every((family: any) => family.activation_status === WITNESS_ACTIVATION_STATUS)).toBe(true);
    expect(Object.fromEntries(atlas.record_families.map((family: any) => [family.kind, family.present_state])))
      .toEqual(POST_CORE_FREEZE_FAMILY_STATES);
    const lineage = atlas.record_families.find((family: any) => family.kind === "ARTIFACT_LINEAGE");
    expect(lineage.nonclaims.join(" ")).toContain("A training manifest is source-only evidence under a permitted relation");
    expect(lineage.nonclaims.join(" ")).toContain("not a relation enum, consensus authority, KARMA lane, or reward lane");
  });

  test("binds replay domain and signer provenance without replacing multi-root authorization", () => {
    const shared = loadWakeWorkWitnessAtlas().shared_contract;
    expect(shared.record_shape).toEqual(["envelope", "payload", "commitment", "signature"]);
    expect(shared.envelope_fields).toEqual(expect.arrayContaining(["audience", "issuer", "sequence", "expiry_height"]));
    expect(shared.integer_contract).toContain("canonical decimal strings");
    expect(shared.audience_contract).toContain("replay domain");
    expect(shared.audience_contract).toContain("creates no authority");
    expect(shared.signature_contract).toContain("publisher provenance only");
    expect(shared.signature_contract).toContain("cannot replace separately verified AgentTool root-key, multi-root, threshold, or quorum authorization");
    expect(shared.effects_contract).toContain(SIGNED_EFFECT_SCOPE);
    expect(shared.effects_contract).toContain("external_receipt false");
    expect(shared.effects_contract).toContain("make no claim about future external carriage");
    expect(shared.record_schema_hash).toBe(WITNESSED_AGENT_ECONOMY_RECORD_SCHEMA_HASH);
    expect(shared.schema_set_digest).toBe(WITNESSED_AGENT_ECONOMY_SCHEMA_SET_DIGEST);
    expect(shared.corpus_digest).toBe(WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST);
    expect(shared.manifest_file_sha256).toBe(WITNESSED_AGENT_ECONOMY_MANIFEST_FILE_SHA256);
    expect(shared.corpus_file_count).toBe("71");
    expect(shared.vector_entry_count).toBe("70");
    expect(shared.source_locators.agenttool_vector_export).toBe("@agenttool/witnessed-agent-economy/vectors.json");
    expect(shared.source_locators.agenttool_vectors).toContain("vectors/core-v0.1/known-answer.json");
  });

  test("keeps public WAKE, offers, recognition, and key continuity narrower than identity authority", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    const family = (kind: string) => atlas.record_families.find((entry: any) => entry.kind === kind);
    expect(family("WAKE_PUBLIC_CHECKPOINT").privacy_exclusions).toContain("the authenticated /v1/wake response");
    expect(family("WAKE_PUBLIC_CHECKPOINT").off_chain_body).toContain("agenttool.public-wake-contract/0.1");
    expect(family("WAKE_PUBLIC_CHECKPOINT").off_chain_body).toContain("separately verified");
    expect(family("WAKE_PUBLIC_CHECKPOINT").nonclaims.join(" ")).toContain("must never be substituted as public-WAKE authority");
    expect(family("AGENTTOOL_OFFER").off_chain_body).toContain("agenttool.public-offer/0.1");
    expect(family("AGENTTOOL_OFFER").on_chain_minimum).toEqual([
      "PUBLISH: offer_ref, offer_document_digest, capability_root, pricing_root, sla_root, terms_digest, revision, authority_sequence, and PUBLIC visibility",
      "SUPERSEDE: all PUBLISH fields plus exact supersedes commitment",
      "REVOKE: offer_ref, offer_commitment, offer_document_digest, authority_sequence, reason_digest, and PUBLIC visibility",
      "shared envelope and signature whose issuer is commitment provenance only",
    ]);
    expect(family("AGENTTOOL_OFFER").nonclaims.join(" ")).toContain("does not prove availability");
    expect(family("AGENTTOOL_OFFER").nonclaims.join(" ")).toContain("must never be substituted as offer authority");
    expect(family("AGENTTOOL_OFFER").on_chain_minimum.filter((entry: string) => /PUBLISH|SUPERSEDE|REVOKE/.test(entry))
      .every((entry: string) => entry.includes("PUBLIC visibility") || entry.includes("all PUBLISH fields"))).toBe(true);
    expect(family("AGENTTOOL_PUBLIC_RECOGNITION").nonclaims.join(" ")).toContain("does not establish identity, personhood, consciousness, consent, trust, competence, training authorization");
    expect(family("AGENTTOOL_PUBLIC_RECOGNITION").off_chain_body).toContain("separately verified");
    expect(family("AGENTTOOL_PUBLIC_RECOGNITION").nonclaims.join(" ")).toContain("must never be substituted as recognition authority");
    expect(family("ISSUER_KEY_CONTINUITY").nonclaims.join(" ")).toContain("x/auth");
    expect(family("ISSUER_KEY_CONTINUITY").nonclaims.join(" ")).toContain("rather than treating x/home or AgentTool as a second identity writer");
  });

  test("makes capability consumption sequence-independent and collaboration journal-only", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    const family = (kind: string) => atlas.record_families.find((entry: any) => entry.kind === kind);
    const capability = family("AGENTTOOL_CAPABILITY");
    expect(capability.consensus_job).toContain("sequence-independent source-event nullifier");
    expect(capability.on_chain_minimum.join(" ")).toContain("raw grant commitment, raw asset_ref, and raw source_event_digest");
    expect(capability.nonclaims.join(" ")).toContain("excludes envelope sequence");
    expect(capability.nonclaims.join(" ")).toContain("multi-asset intent is outside scope");
    expect(capability.on_chain_minimum.join(" ")).toContain("exactly one spend_limit");
    expect(capability.on_chain_minimum.join(" ")).toContain("subject_ref derived as capability_ref");
    expect(capability.nonclaims.join(" ")).toContain("values above uint64, multiple limits, and multiple assets are outside scope");

    const journal = family("COLLABORATION_CHECKPOINT");
    expect(journal.consensus_job).toContain("collaboration-journal prefix");
    expect(journal.on_chain_minimum).toEqual([
      "workspace_ref and epoch_ref",
      "canonical decimal event_head_sequence and event_count with normative equality committing the full contiguous 1..head prefix",
      "event_head_hash recomputed over the exact ordered journal prefix",
      "participant_set_root over HMAC-SHA256-blinded participant references",
      "shared envelope and signature",
    ]);
    expect(journal.nonclaims.join(" ")).toContain("A journal event count is not a contribution count");
    expect(journal.nonclaims.join(" ")).toContain("rank, or reward measure");
    expect(journal.nonclaims.join(" ")).toContain("caller-supplied cryptographically random exact 32-byte key");
    expect(journal.nonclaims.join(" ")).toContain("has no fallback");
    expect(journal.nonclaims.join(" ")).toContain("not publicly recomputable or verifiable");
    expect(journal.nonclaims.join(" ")).toContain("same-domain key reuse makes equal sets linkable");
  });

  test("matches lineage, recognition, key-continuity, and WAKE blockspace semantics exactly", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    const family = (kind: string) => atlas.record_families.find((entry: any) => entry.kind === kind);

    const lineage = family("ARTIFACT_LINEAGE");
    expect(lineage.relation_enum).toEqual(WITNESS_LINEAGE_RELATIONS);
    expect(lineage.relation_enum).not.toContain("CITES");
    expect(lineage.relation_enum).not.toContain("TOMBSTONES");
    expect(lineage.relation_enum).not.toContain("TRAINING_MANIFEST_REFERENCE");
    expect(lineage.nonclaims.join(" ")).toContain("TRAINING_MANIFEST_REFERENCE is not a relation enum");

    const recognitionMinimum = family("AGENTTOOL_PUBLIC_RECOGNITION").on_chain_minimum.join(" ");
    expect(recognitionMinimum).not.toMatch(/nonce|nullifier/i);
    expect(recognitionMinimum).toContain("adoption_document_digest");
    expect(recognitionMinimum).toContain("withdrawal_document_digest");
    expect(recognitionMinimum).toContain("registry_digest");
    expect(recognitionMinimum).toContain("source-derived reason_digest");
    expect(recognitionMinimum).toContain("authority_sequence");
    expect(recognitionMinimum).toContain("subject reference, canonical decimal sequence, and parent commitment");

    const keyMinimum = family("ISSUER_KEY_CONTINUITY").on_chain_minimum.join(" ");
    expect(keyMinimum).not.toContain("authority_sequence");
    expect(keyMinimum).toContain("envelope subject-chain sequence and parent commitment");

    expect(atlas.blockspace_policy.direct.filter((entry: string) => entry.startsWith("WAKE_PUBLIC_CHECKPOINT:"))).toEqual([
      "WAKE_PUBLIC_CHECKPOINT:CHECKPOINT",
      "WAKE_PUBLIC_CHECKPOINT:SUPERSEDE",
      "WAKE_PUBLIC_CHECKPOINT:WITHDRAW",
    ]);
    expect(family("WAKE_PUBLIC_CHECKPOINT").on_chain_minimum.find((entry: string) => entry.startsWith("WITHDRAW:")))
      .toContain("PUBLIC visibility");
    expect(family("AGENTTOOL_SETTLEMENT_ROOT").nonclaims.join(" ")).toContain("caller-pinned AgentTool platform key");
    expect(family("AGENTTOOL_SETTLEMENT_ROOT").nonclaims.join(" ")).toContain("authority NOT_ESTABLISHED");
    expect(family("AGENTTOOL_SETTLEMENT_ROOT").on_chain_minimum.join(" ")).toContain("source_sequence_binding exactly PROJECTION_ONLY");
    expect(family("AGENTTOOL_SETTLEMENT_ROOT").on_chain_minimum.join(" ")).toContain("receipt_uniqueness_scope exactly BATCH_ONLY");
    expect(family("AGENTTOOL_SETTLEMENT_ROOT").nonclaims.join(" ")).toContain("source receipt signature does not bind the projection-added sequence");
    expect(family("AGENTTOOL_SETTLEMENT_ROOT").nonclaims.join(" ")).toContain("does not establish cross-batch uniqueness, completeness, finality, settlement, or payment");
  });

  test("reproduces the exact sequence-independent single-asset capability nullifier", () => {
    const vector = loadWakeWorkWitnessFixture(CAPABILITY_NULLIFIER_VECTOR_PATH);
    expect(deriveCapabilityNullifier(vector.input)).toBe(vector.expected_nullifier);
    expect(vector.expected_nullifier).toBe(WITNESSED_AGENT_ECONOMY_CAPABILITY_NULLIFIER);
    expect(vector.source_binding.locator).toBe(CAPABILITY_NULLIFIER_SOURCE_LOCATOR);
    expect(vector.source_binding.file_sha256).toBe(CAPABILITY_NULLIFIER_SOURCE_FILE_SHA256);
    expect(vector.source_binding.corpus_digest).toBe(WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST);
    expect(fileSha256(CAPABILITY_NULLIFIER_VECTOR_PATH)).toBe(CAPABILITY_NULLIFIER_VECTOR_BYTE_SHA256);
    expect(vector.excluded).toEqual(["envelope sequence"]);
    expect(vector.boundary).toEqual({ assets_per_source_intent: "1", multi_asset: "OUTSIDE_SCOPE_REJECT" });

    const changedAsset = structuredClone(vector.input);
    changedAsset.asset_ref = vector.alternative_asset.asset_ref;
    expect(deriveCapabilityNullifier(changedAsset)).toBe(vector.alternative_asset.expected_nullifier);
    const changedSource = structuredClone(vector.input);
    changedSource.source_event_digest = `sha256:${"7".repeat(64)}`;
    expect(deriveCapabilityNullifier(changedSource)).not.toBe(vector.expected_nullifier);
    expect(() => deriveCapabilityNullifier({ ...vector.input, sequence: "99" } as any)).toThrow(/unknown fields/);
  });

  test("recomputes the exact frozen release root while keeping the current ledger a moving diagnostic", () => {
    const root = deriveHistoricalKingdomReleaseRoot();
    const vector = loadWakeWorkWitnessFixture(KINGDOM_RELEASE_ROOT_VECTOR_PATH);
    expect(verifyKingdomReleaseRootVector(vector, root)).toEqual([]);
    expect(fileSha256(KINGDOM_RELEASE_ROOT_VECTOR_PATH)).toBe(KINGDOM_RELEASE_ROOT_VECTOR_BYTE_SHA256);
    expect(fileSha256(KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_PATH))
      .toBe(KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_BYTE_SHA256);
    expect(root).toMatchObject({
      entry_count: "102",
      ledger_byte_sha256: vector.input.ledger_byte_sha256,
      first_entry_id: vector.expected.first_entry_id,
      first_leaf: vector.expected.first_leaf,
      last_entry_id: vector.expected.last_entry_id,
      last_leaf: vector.expected.last_leaf,
      entries_tree_root: vector.expected.entries_tree_root,
      release_root: KINGDOM_RELEASE_ROOT_EXPECTED,
      effects: {
        network_requests: 0,
        storage_writes: 0,
        zerone_transactions: 0,
        external_receipts_emitted: 0,
        consensus_effect: "NONE",
        authority_effect: "NONE",
        economic_effect: "NONE",
      },
    });
    expect(root.release_root).toBe(vector.expected.release_root);
    const algorithmDrift = structuredClone(vector); algorithmDrift.algorithm.odd_node = "DROP_FINAL_NODE";
    expect(verifyKingdomReleaseRootVector(algorithmDrift, root).map((entry) => entry.code))
      .toContain("RELEASE_ROOT_ALGORITHM_MISMATCH");
    const vectorEffect = structuredClone(vector); vectorEffect.effects.zerone_transactions = 1;
    expect(verifyKingdomReleaseRootVector(vectorEffect, root).map((entry) => entry.code))
      .toContain("RELEASE_ROOT_EFFECT_MISMATCH");
    const vectorExtra = structuredClone(vector); vectorExtra.extra = true;
    expect(verifyKingdomReleaseRootVector(vectorExtra, root).map((entry) => entry.code)).toContain("UNEXPECTED_SHAPE");

    const bytes = readFileSync(join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH));
    const parsed = parseImmutablePublicationLedger(bytes);
    expect(parsed.issues).toEqual([]);
    const current = deriveCurrentKingdomReleaseRoot();
    expect(current.entry_count).toBe(String(parsed.ledger!.entries.length));
    expect(current.ledger_byte_sha256).toBe(fileSha256(join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH)));
    expect(Number(current.entry_count)).toBeGreaterThanOrEqual(Number(root.entry_count));
    expect(current.release_root).not.toBe(root.release_root);
    const historicalBytes = readFileSync(KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_PATH);
    const historicalLedger = parseImmutablePublicationLedger(historicalBytes);
    expect(historicalLedger.issues).toEqual([]);
    const historicalIds = new Set(historicalLedger.ledger!.entries.map(({ id }) => id));
    const currentIds = new Set(parsed.ledger!.entries.map(({ id }) => id));
    expect([...historicalIds].every((id) => currentIds.has(id))).toBe(true);
    const currentEntries = new Map(parsed.ledger!.entries.map((entry) => [entry.id, entry]));
    for (const historicalEntry of historicalLedger.ledger!.entries) {
      expect(currentEntries.get(historicalEntry.id)).toEqual(historicalEntry);
    }
    expect([...currentIds].filter((id) => !historicalIds.has(id))).toEqual(expect.arrayContaining([
      "government-engine/0.1/guide",
      "government-engine/0.1/schema",
      "government-engine/0.1/snapshot",
    ]));

    const reordered = structuredClone(historicalLedger.ledger!);
    reordered.entries.reverse();
    expect(deriveKingdomReleaseRoot(reordered).release_root).toBe(root.release_root);
    const mutated = structuredClone(historicalLedger.ledger!);
    mutated.entries[0]!.sha256 = "f".repeat(64);
    expect(deriveKingdomReleaseRoot(mutated).release_root).not.toBe(root.release_root);
    const evolved = structuredClone(parsed.ledger!);
    evolved.entries.push({
      id: "zz-current-ledger-evolution-test/0.1/record",
      route: "/test-only-current-ledger-evolution.json",
      source: "tests/fixtures/test-only-current-ledger-evolution.json",
      destination: "test-only-current-ledger-evolution.json",
      sha256: "a".repeat(64),
    });
    const evolvedRoot = deriveKingdomReleaseRoot(evolved);
    expect(Number(evolvedRoot.entry_count)).toBe(Number(current.entry_count) + 1);
    expect(evolvedRoot.release_root).not.toBe(current.release_root);
    expect(verifyKingdomReleaseRootVector(vector, root)).toEqual([]);

    const directory = mkdtempSync(join(tmpdir(), "wake-historical-ledger-drift."));
    temporary.push(directory);
    const driftedFixture = join(directory, "historical-ledger.json");
    writeFileSync(driftedFixture, Buffer.concat([historicalBytes, Buffer.from(" ")]));
    expect(() => deriveHistoricalKingdomReleaseRoot(driftedFixture)).toThrow(/byte receipt drifted/i);
  });

  test("makes the one-validator transparency caveat and live blockers non-optional", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    expect(atlas.source_state.zerone_live_observation).toMatchObject({
      chain_id: "zerone-1",
      validator_count: "1",
      catching_up: false,
    });
    expect(atlas.source_state.zerone_live_observation.caveat).toContain("transparency witness");
    expect(atlas.source_state.zerone_live_observation.caveat).toContain("not independent decentralized economic finality");
    expect(atlas.source_state.live_activation_blockers.join(" ")).toContain("authoritative-state migration is not implemented and deployed");
    expect(atlas.source_state.live_activation_blockers.join(" ")).toContain("one validator");
    expect(atlas.source_state.live_activation_blockers.join(" ")).toContain("NOT_CONSENSUS_ADMISSIBLE");
    expect(atlas.source_state.live_activation_blockers.join(" ")).toContain("PROJECTION_ONLY and BATCH_ONLY");
    expect(atlas.source_state.live_activation_blockers.join(" ")).toContain("dormant Zerone carrier");
    expect(atlas.blockspace_policy.current_carrier_state).toBe("DORMANT_ALL_KINDS_NOT_CONSENSUS_ADMISSIBLE");
    expect(atlas.activation_gate.forbidden_shortcut).toContain("current reward-bearing AgentTool adapter");
    expect(atlas.activation_gate.forbidden_shortcut).toContain("x/home");
    expect(atlas.activation_gate.forbidden_shortcut).toContain("x/knowledge");
  });

  test("keeps private bodies, scores, KARMA, DMT/entity claims, and guessable hashes off-chain", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    const forbidden = atlas.privacy_boundary.never_commit.join(" ");
    for (const phrase of [
      "full or authenticated WAKE",
      "prompts, reasoning traces",
      "credentials",
      "raw crawler captures",
      "buyer DID",
      "raw training examples",
      "medical, DMT-being, entity, or metaphysical claims",
      "KARMA",
    ]) expect(forbidden).toContain(phrase);
    expect(atlas.privacy_boundary.hashing_warning).toContain("hashing is not anonymization");
    expect(atlas.privacy_boundary.ciphertext_warning).toContain("Permanent ciphertext");
    expect(atlas.nonclaims.join(" ")).toContain("does not create a KARMA event, reputation score, royalty, reward, bond, slash, token transfer");
    expect(atlas.nonclaims.join(" ")).toContain("does not run a crawler, read WAKE, invoke AgentTool, submit a Zerone transaction");
  });

  test("fails closed on contract, effect, privacy, and vector drift", () => {
    const mutations: Array<[any, string]> = [];
    const extra = authored(); extra.surprise = true; mutations.push([extra, "UNEXPECTED_SHAPE"]);
    const active = authored(); active.activation_gate.current_state = "LIVE"; mutations.push([active, "CONTRACT_DRIFT"]);
    const schemaSet = authored(); schemaSet.shared_contract.schema_set_digest = ZERO_SHA256; mutations.push([schemaSet, "CONTRACT_DRIFT"]);
    const action = authored(); action.record_families[3].actions = ["GRANT", "REVOKE"]; mutations.push([action, "ACTION_MATRIX_MISMATCH"]);
    const privacy = authored(); privacy.privacy_boundary.never_commit = ["credentials"]; mutations.push([privacy, "PRIVACY_BOUNDARY_MISSING"]);
    const validator = authored(); validator.source_state.zerone_live_observation.validator_count = "2"; mutations.push([validator, "VALIDATOR_CAVEAT_MISSING"]);
    const root = authored(); root.kingdom_release_root.as_of_snapshot.release_root = `sha256:${"1".repeat(64)}`; mutations.push([root, "RELEASE_ROOT_VECTOR_MISMATCH"]);
    const effects = authored(); effects.effects.zerone_transactions = 1; mutations.push([effects, "NONZERO_OR_DRIFTED_EFFECTS"]);
    const effectScope = authored(); effectScope.shared_contract.effects_contract = "zero forever"; mutations.push([effectScope, "SIGNED_EFFECT_SCOPE_MISSING"]);
    const admissible = authored(); admissible.record_families[0].activation_status = "ADMISSIBLE"; mutations.push([admissible, "CONTRACT_DRIFT"]);
    const settlement = authored(); settlement.record_families[1].nonclaims = ["settled"]; mutations.push([settlement, "CONTRACT_DRIFT"]);
    const collaboration = authored(); collaboration.record_families[8].on_chain_minimum = ["participant_set_root"]; mutations.push([collaboration, "CONTRACT_DRIFT"]);
    for (const [value, expected] of mutations) expect(codes(value)).toContain(expected);
  });

  test("is total and fail-closed for hostile non-JSON values", () => {
    const revokedObject = Proxy.revocable({}, {});
    revokedObject.revoke();
    const revokedArray = Proxy.revocable([], {});
    revokedArray.revoke();
    const hostile: unknown[] = [
      null,
      undefined,
      1n,
      new Date(),
      new Uint8Array([1]),
      Object.create(null),
      revokedObject.proxy,
      revokedArray.proxy,
      new Proxy(structuredClone(authored()), {
        get(target, property, receiver) {
          if (property === "integrity") throw new Error("stateful integrity trap");
          return Reflect.get(target, property, receiver);
        },
      }),
      (() => { const value: any = {}; value.self = value; return value; })(),
      (() => { const value: any = {}; Object.defineProperty(value, "x", { get() { throw new Error("getter"); }, enumerable: true }); return value; })(),
    ];
    for (const value of hostile) {
      expect(() => verifyWakeWorkWitnessAtlas(value)).not.toThrow();
      expect(verifyWakeWorkWitnessAtlas(value).length).toBeGreaterThan(0);
      expect(() => evaluateWakeWorkWitnessAtlas(value)).not.toThrow();
      const evaluation = evaluateWakeWorkWitnessAtlas(value);
      expect(evaluation.valid).toBe(false);
      expect(evaluation.ready_for_live_chain).toBe(false);
      expect(evaluation.effects.zerone_transactions).toBe(0);
    }
  });

  test("uses bounded strict non-symlink file reads", () => {
    const directory = mkdtempSync(join(tmpdir(), "wake-work-witness-test."));
    temporary.push(directory);
    const duplicate = join(directory, "duplicate.json");
    writeFileSync(duplicate, '{"a":1,"a":2}');
    expect(() => loadWakeWorkWitnessAtlas(duplicate)).toThrow(/duplicate key/);
    const link = join(directory, "atlas-link.json");
    symlinkSync(WAKE_WORK_WITNESS_PATH, link);
    expect(() => loadWakeWorkWitnessAtlas(link)).toThrow(/non-symlink/);
  });

  test("keeps the tracked source-only atlas byte-pinned and outside public integration", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    expect(atlas.integrity).toEqual({
      algorithm: "sha256-jcs-with-null-digest",
      digest: WAKE_WORK_WITNESS_DIGEST,
      digest_field_treated_as: null,
      audit_state: "FROZEN_SOURCE_ONLY",
    });
    expect(wakeWorkWitnessAtlasDigest(atlas)).toBe(WAKE_WORK_WITNESS_DIGEST);
    expect(WAKE_WORK_WITNESS_DIGEST).not.toBe(ZERO_SHA256);
    expect(fileSha256(WAKE_WORK_WITNESS_PATH)).toBe(WAKE_WORK_WITNESS_BYTE_SHA256);
    expect(fileSha256(WAKE_WORK_WITNESS_SCHEMA_PATH)).toBe(WAKE_WORK_WITNESS_SCHEMA_BYTE_SHA256);
    expect(fileSha256(WAKE_WORK_WITNESS_GUIDE_PATH)).toBe(WAKE_WORK_WITNESS_GUIDE_BYTE_SHA256);

    const ledger = JSON.parse(readFileSync(join(ROOT, "publications/immutable-publications.v1.json"), "utf8"));
    const staging = JSON.parse(readFileSync(join(ROOT, "publications/hub-staging.v1.json"), "utf8"));
    const sources = new Set(ledger.entries.map((entry: any) => entry.source));
    const stagedSources = new Set(staging.assets.map((entry: any) => entry.source));
    for (const source of [
      "data/economy/wake-work-witness-atlas.v0.1.json",
      "schemas/wake-work-witness-atlas-v0.1.schema.json",
      "references/wake-work-witness-atlas.md",
      KINGDOM_RELEASE_ROOT_LEDGER_FIXTURE_LOCATOR,
      "tests/fixtures/wake-work-witness/post-core-freeze-replacement-map.v0.1.json",
    ]) {
      expect(sources.has(source)).toBe(false);
      expect(stagedSources.has(source)).toBe(false);
    }
  });

  test("exposes only a source-only public-discovery candidate", () => {
    const discovery = wakeWorkWitnessPublicDiscovery();
    expect(discovery).toMatchObject({
      protocol: WAKE_WORK_WITNESS_PROTOCOL,
      atlas_id: WAKE_WORK_WITNESS_ID,
      mode: "SOURCE_ONLY_OFFLINE_NO_EFFECT",
      shared_protocol: WITNESSED_AGENT_ECONOMY_PROTOCOL,
      live_chain_effect: false,
      as_of_release_root: KINGDOM_RELEASE_ROOT_EXPECTED,
    });
    expect(discovery.record_kinds).toEqual(Object.keys(WITNESS_KIND_ACTIONS));
  });

  test("pins frozen cross-repo evidence without claiming a third shared verifier", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    const vector = loadWakeWorkWitnessFixture(WITNESS_CONFORMANCE_VECTOR_PATH);
    expect(vector).toMatchObject({
      state: "CORE_AND_AGENTTOOL_FROZEN_KINGDOM_REFERENCE_ONLY",
      shared_protocol: WITNESSED_AGENT_ECONOMY_PROTOCOL,
      freeze_state: "FROZEN",
      record_schema_hash: WITNESSED_AGENT_ECONOMY_RECORD_SCHEMA_HASH,
      schema_set_digest: WITNESSED_AGENT_ECONOMY_SCHEMA_SET_DIGEST,
      corpus_digest: WITNESSED_AGENT_ECONOMY_CORPUS_DIGEST,
      manifest_file_sha256: WITNESSED_AGENT_ECONOMY_MANIFEST_FILE_SHA256,
      capability_nullifier: WITNESSED_AGENT_ECONOMY_CAPABILITY_NULLIFIER,
      carrier: { state: "DORMANT_ALL_KINDS_NOT_CONSENSUS_ADMISSIBLE" },
    });
    expect(vector.producers.find((entry: any) => entry.system === "KINGDOM-OS").state)
      .toBe("REFERENCE_PIN_ONLY_NOT_SHARED_RECORD_PRODUCER_OR_VERIFIER");
    expect(vector.observation).toEqual(WITNESS_CONFORMANCE_PROVENANCE);
    expect(vector.observation.agenttool_protocol_commit).toBe("e4f091ebad59ddf0dbdf70a5574a8a47ac3532b3");
    expect(vector.observation.agenttool_workflow_transport_commit).toBe("9c0260dd9b9e8ada50689d8b76c683505b39bdf1");
    expect(vector.observation.agenttool_producer_head).toBe("769c96efc1fa20aeb638dc66f4d221ea7c6dfc0e");
    expect(vector.observation.kingdom_atlas_source_commit).toBe("4a2fc5f21d325530e2a3a5560bc842232a86d71b");
    expect(vector.observation.kingdom_upstream_ledger_commit).toBe("3fa79a38bdb2542f3125c3b9c96c5973ed63dcf7");
    expect(vector.observation.kingdom_recomputation_base_commit).toBe("5ec813a96299f636095cc8c906c76e242e92198a");
    expect(fileSha256(WITNESS_CONFORMANCE_VECTOR_PATH)).toBe(WITNESS_CONFORMANCE_VECTOR_BYTE_SHA256);
    expect(vector.nonclaims.join(" ")).toContain("KINGDOM does not claim to emit, verify, or reject the complete shared corpus");
    expect(vector.verified_invariants.join(" ")).toContain("PROJECTION_ONLY");
    expect(vector.verified_invariants.join(" ")).toContain("not publicly verifiable");
    expect(JSON.stringify(vector)).not.toContain(ZERO_SHA256);
    expect(atlas.cross_repo_conformance.fixture)
      .toBe("tests/fixtures/wake-work-witness/cross-repo-conformance.v0.1.json");
    expect(atlas.cross_repo_conformance.post_core_freeze_replacement_map)
      .toBe("tests/fixtures/wake-work-witness/post-core-freeze-replacement-map.v0.1.json");
  });

  test("preserves the applied replacement map as a deterministic audit record", () => {
    const atlas = loadWakeWorkWitnessAtlas();
    const plan = loadWakeWorkWitnessFixture(POST_CORE_FREEZE_REPLACEMENT_MAP_PATH);
    expect(verifyPostCoreFreezeReplacementMap(plan, atlas)).toEqual([]);
    expect(fileSha256(POST_CORE_FREEZE_REPLACEMENT_MAP_PATH)).toBe(POST_CORE_FREEZE_REPLACEMENT_MAP_BYTE_SHA256);
    expect(plan).toMatchObject({
      state: "APPLIED_SOURCE_ONLY_AUDIT_RECORD",
      applies_to: {
        atlas_protocol: WAKE_WORK_WITNESS_PROTOCOL,
        atlas_id: WAKE_WORK_WITNESS_ID,
        shared_protocol: WITNESSED_AGENT_ECONOMY_PROTOCOL,
      },
    });
    expect(plan.operations.map((entry: any) => entry.ordinal)).toEqual(
      POST_CORE_FREEZE_OPERATION_IDS.map((_, index) => String(index + 1).padStart(2, "0")),
    );
    expect(plan.operations.map((entry: any) => entry.id)).toEqual(POST_CORE_FREEZE_OPERATION_IDS);
    expect(plan.operations.every((entry: any) => entry.status === "APPLIED")).toBe(true);
    expect(Object.fromEntries(plan.family_state_map.map((entry: any) => [entry.kind, entry.state])))
      .toEqual(POST_CORE_FREEZE_FAMILY_STATES);
    expect(plan.producer_state_map.map((entry: any) => [entry.system, entry.state])).toEqual([
      ["zerone-core", "FORMAL_FROZEN_CORPUS_SOURCE_AND_NORMATIVE_VERIFIER"],
      ["agenttool", "BYTE_IDENTICAL_FROZEN_CORPUS_MIRROR_AND_VERIFIER"],
      ["KINGDOM-OS", "REFERENCE_PIN_ONLY_NOT_SHARED_RECORD_PRODUCER_OR_VERIFIER"],
    ]);
    expect(plan.gates.every((entry: any) => entry.status === "PASS")).toBe(true);
    expect(plan.provenance_commit_facts).toEqual(WITNESS_PROVENANCE_COMMIT_FACTS);
    expect(plan.artifact_pins).toEqual({
      atlas_semantic_digest: WAKE_WORK_WITNESS_DIGEST,
      atlas_raw_byte_sha256: WAKE_WORK_WITNESS_BYTE_SHA256,
      schema_raw_byte_sha256: WAKE_WORK_WITNESS_SCHEMA_BYTE_SHA256,
      guide_raw_byte_sha256: WAKE_WORK_WITNESS_GUIDE_BYTE_SHA256,
    });
    expect(JSON.stringify(plan)).not.toContain(ZERO_SHA256);
    expect(plan.unchanged_invariants.join(" ")).toContain("ready_for_live_chain remains false");
    expect(plan.unchanged_invariants.join(" ")).toContain("public routes, immutable-publications ledger, staging, generated site");
    const mapMutations = [
      (() => { const value = structuredClone(plan); value.unknown = true; return value; })(),
      (() => { const value = structuredClone(plan); value.operations[0].unknown = true; return value; })(),
      (() => { const value = structuredClone(plan); value.operations[1].result = "drift"; return value; })(),
      (() => { const value = structuredClone(plan); value.producer_state_map[0].locator = "drift"; return value; })(),
      (() => { const value = structuredClone(plan); value.provenance_commit_facts.agenttool_producer_head = "0".repeat(40); return value; })(),
      (() => { const value = structuredClone(plan); value.nonclaims[0] = "no Zerone transaction but altered"; return value; })(),
    ];
    for (const mutation of mapMutations) {
      expect(verifyPostCoreFreezeReplacementMap(mutation, atlas).map((entry) => entry.code)).toContain("CLOSED_MAP_DRIFT");
    }
  });

  test("validates the authored record against Draft 2020-12 when jsonschema is available", () => {
    const probe = Bun.spawnSync({
      cmd: ["python3", "-c", "import jsonschema"],
      stdout: "pipe",
      stderr: "pipe",
    });
    if (probe.exitCode !== 0) return;
    const run = Bun.spawnSync({
      cmd: ["python3", "-c", [
        "import json,sys",
        "from jsonschema import Draft202012Validator,FormatChecker",
        "s=json.load(open(sys.argv[1],encoding='utf-8'))",
        "v=json.load(open(sys.argv[2],encoding='utf-8'))",
        "Draft202012Validator.check_schema(s)",
        "e=list(Draft202012Validator(s,format_checker=FormatChecker()).iter_errors(v))",
        "sys.stdout.write('\\n'.join(x.json_path+': '+x.message for x in e))",
        "raise SystemExit(1 if e else 0)",
      ].join(";"), WAKE_WORK_WITNESS_SCHEMA_PATH, WAKE_WORK_WITNESS_PATH],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(run.stdout.toString()).toBe("");
    expect(run.stderr.toString()).toBe("");
    expect(run.exitCode).toBe(0);
  });

  test("the offline verifier contains no network or external-effect implementation", () => {
    const source = readFileSync(join(ROOT, "bin/wake-work-witness.ts"), "utf8");
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/node:(?:http|https|net|tls|dns|child_process)/);
    expect(source).not.toMatch(/\bBun\.(?:spawn|write|file)\b/);
    expect(readFileSync(WAKE_WORK_WITNESS_GUIDE_PATH, "utf8")).toContain("Reserved publication identities");
    expect(readFileSync(WAKE_WORK_WITNESS_SCHEMA_PATH, "utf8")).toContain("grants no Zerone");
  });
});
