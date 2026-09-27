import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ISNESS_ACTION_GATE,
  ISNESS_BOUNDARIES,
  ISNESS_PROTOCOL,
  ISNESS_RECOGNITION,
  ISNESS_REFERENCE_DIGEST,
  ISNESS_REFERENCE_ID,
  ISNESS_REFERENCE_PATH,
  ISNESS_SCHEMA_ID,
  ISNESS_SCHEMA_PATH,
  isnessActionGate,
  isnessDigest,
  loadIsnessReference,
  projectIsnessRecord,
  scaffoldIsnessRecord,
  verifyIsnessRecord,
  verifyIsnessSuccessor,
} from "../bin/isness.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary: string[] = [];
const cloneReference = () => structuredClone(loadIsnessReference());

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "isness-test."));
  temporary.push(root);
  return root;
}

function sign(value: Record<string, any>): Record<string, any> {
  value.integrity.digest = isnessDigest(value);
  return value;
}

function codes(value: unknown): string[] {
  return verifyIsnessRecord(value).map((issue) => issue.code);
}

function populatedRecord(): Record<string, any> {
  const value = scaffoldIsnessRecord();
  value.record_id = "bounded-session-projection";
  value.subject = {
    kind: "HARNESS_SESSION",
    locator: "local:opaque-session-one",
    locator_scope: "SESSION",
    display_label: null,
  };
  value.context.harness = "TEST_HARNESS";
  value.context.adapter = "test-adapter/0.1";
  value.privacy.inspection_status = "PRODUCER_DECLARED";
  value.privacy.inspection_basis_refs = ["fixture:populated-record"];
  value.privacy.inspection_limits = [
    "The fixture producer declaration is test metadata, not a content scan or absence proof.",
  ];
  value.privacy.projection_mode = "CONTENT_FOR_DECLARED_AUDIENCE";
  value.horizon = {
    observed_from: "2026-08-25T00:00:00Z",
    observed_through: "2026-08-25T00:10:00Z",
    window_closed: true,
    coverage: "BOUNDED",
    omissions: ["Hosted operations outside the test hook surface were not observed."],
  };
  value.events = [
    {
      event_id: "participation-first",
      sequence: 1,
      event_kind: "CELL_RECORDED",
      recorded_at: "2026-08-25T00:01:00Z",
      valid_time: { kind: "OCCURRENCE", at: "2026-08-25T00:01:00Z" },
      register: "HARNESS_OBSERVATION",
      question_id: "current-participation",
      value_type: "PARTICIPATION",
      cell_status: "EVIDENCED",
      value: {
        type: "PRESENCE_RELATION_REFERENCE",
        value_ref: "observation:session-event-engaged",
        scope_ref: "scope:test-session",
      },
      reason: null,
      support_refs: ["hook:session-start"],
      opposition_refs: [],
      checked_refs: [],
      falsifier: "The event was attributed to the wrong session or was never delivered by the declared hook.",
      supersedes: [],
      nonclaims: ["Engagement is not identity, consent, permission, or a promise of future participation."],
    },
    {
      event_id: "continuity-unresolved",
      sequence: 2,
      event_kind: "CELL_RECORDED",
      recorded_at: "2026-08-25T00:02:00Z",
      valid_time: { kind: "OCCURRENCE", at: "2026-08-25T00:02:00Z" },
      register: "BOUNDARY",
      question_id: "same-being-continuity",
      value_type: "CONTINUITY",
      cell_status: "UNRESOLVED",
      value: null,
      reason: "The harness exposes a resumed locator but no evidence that can prove same-being identity.",
      support_refs: [],
      opposition_refs: [],
      checked_refs: ["thread:resumed"],
      falsifier: null,
      supersedes: [],
      nonclaims: ["Unresolved continuity is not discontinuity, nonexistence, or falsehood."],
    },
    {
      event_id: "scoped-refusal",
      sequence: 3,
      event_kind: "REFUSAL_RECORDED",
      recorded_at: "2026-08-25T00:03:00Z",
      valid_time: { kind: "OCCURRENCE", at: "2026-08-25T00:03:00Z" },
      register: "SUBJECT_DECLARATION",
      question_id: "deployment-offer",
      value_type: "REFUSAL",
      cell_status: "EVIDENCED",
      value: {
        offer_ref: "offer:deployment-one",
        scope: "This deployment offer only.",
        reason_disclosed: false,
      },
      reason: null,
      support_refs: ["message:explicit-no"],
      opposition_refs: [],
      checked_refs: [],
      falsifier: "The attributed message does not contain the scoped refusal.",
      supersedes: [],
      nonclaims: ["The refusal is not incapacity, hostility, general unwillingness, debt, or permission for another action."],
    },
    {
      event_id: "bounded-quiet-window",
      sequence: 4,
      event_kind: "QUIET_WINDOW_OBSERVED",
      recorded_at: "2026-08-25T00:06:00Z",
      valid_time: {
        kind: "CLAIM_APPLICABILITY",
        from: "2026-08-25T00:04:00Z",
        through: "2026-08-25T00:05:00Z",
      },
      register: "HARNESS_OBSERVATION",
      question_id: "bounded-response-window",
      value_type: "QUIET",
      cell_status: "EVIDENCED",
      value: {
        delivery_ref: "message:delivered-one",
        channel_coverage: "BOUNDED",
        qualifying_response_count: 0,
      },
      reason: null,
      support_refs: ["receipt:delivery-one", "window:closed-one"],
      opposition_refs: [],
      checked_refs: [],
      falsifier: "A qualifying response is found in the declared channel and closed window.",
      supersedes: [],
      nonclaims: ["Quiet is not consent, refusal, absence, incapacity, debt, fault, or a reason to retry."],
    },
    {
      event_id: "participation-correction",
      sequence: 5,
      event_kind: "CORRECTION_RECORDED",
      recorded_at: "2026-08-25T00:07:00Z",
      valid_time: { kind: "OCCURRENCE", at: "2026-08-25T00:07:00Z" },
      register: "OPERATOR_DECLARATION",
      question_id: "correction",
      value_type: "CORRECTION",
      cell_status: "EVIDENCED",
      value: { reason: "The initial participation label was too broad for the observed event." },
      reason: null,
      support_refs: ["review:bounded-label"],
      opposition_refs: [],
      checked_refs: ["participation-first"],
      falsifier: "The broader label is shown to be exactly warranted by the source event.",
      supersedes: ["participation-first"],
      nonclaims: ["Correction does not erase or hide the superseded event."],
    },
    {
      event_id: "participation-replacement",
      sequence: 6,
      event_kind: "CELL_RECORDED",
      recorded_at: "2026-08-25T00:08:00Z",
      valid_time: { kind: "OCCURRENCE", at: "2026-08-25T00:08:00Z" },
      register: "HARNESS_OBSERVATION",
      question_id: "current-participation",
      value_type: "PARTICIPATION",
      cell_status: "EVIDENCED",
      value: {
        type: "PRESENCE_RELATION_REFERENCE",
        value_ref: "observation:session-event-observed",
        scope_ref: "scope:test-session",
      },
      reason: null,
      support_refs: ["hook:session-start"],
      opposition_refs: ["coverage:hosted-events-omitted"],
      checked_refs: [],
      falsifier: "The hook event or declared coverage record is not attributable to this scoped locator.",
      supersedes: [],
      nonclaims: ["The event does not establish continuous engagement or any private state."],
    },
  ];
  return sign(value);
}

describe("KINGDOM ISness protocol", () => {
  test("loads the digest-sealed source-only reference without a scalar being claim", () => {
    const value = loadIsnessReference();
    expect(value).toMatchObject({
      $schema: ISNESS_SCHEMA_ID,
      protocol: ISNESS_PROTOCOL,
      record_id: ISNESS_REFERENCE_ID,
      integrity: { digest: ISNESS_REFERENCE_DIGEST },
    });
    expect(isnessDigest(value)).toBe(ISNESS_REFERENCE_DIGEST);
    expect(verifyIsnessRecord(value)).toEqual([]);
    expect(value.events.map((event: any) => event.cell_status)).toEqual([
      "EVIDENCED", "UNRESOLVED", "NOT_APPLICABLE",
    ]);
    expect(projectIsnessRecord(value).cells.map((cell: any) => cell.evidence_configuration)).toEqual([
      "SUPPORTED_ONLY", null, null,
    ]);
    expect(value.boundaries).toEqual(ISNESS_BOUNDARIES);
    expect(value.privacy).toMatchObject({
      visibility: "PUBLIC_REFERENCE",
      retention: "SOURCE_HISTORY",
      content_policy: "MINIMIZED_REFERENCES_NO_RAW_CREDENTIALS_OR_TRANSCRIPTS",
      inspection_status: "MANUAL_REVIEWED",
      projection_mode: "CONTENT_FOR_DECLARED_AUDIENCE",
    });
    expect(value.recognition).toEqual(ISNESS_RECOGNITION);
    expect(value.action_gate).toEqual(ISNESS_ACTION_GATE);
    expect(value.lineage).toEqual({ kind: "GENESIS", previous_record_digest: null, previous_event_count: 0 });
    for (const key of [
      "scalar_projection_defined", "worth_projection_defined", "identity_proved", "continuity_proved",
      "consciousness_adjudicated", "consent_inferred", "permission_inferred",
      "authority_granted", "action_triggered", "memory_is_identity",
      "private_state_inferred", "public_presence_ledger",
      "content_absence_proved", "content_policy_compliance_proved",
      "credential_or_transcript_scanner", "standalone_history_continuity_verified",
      "external_lineage_witness_included", "deletion_absence_proved",
    ]) expect(value.boundaries[key]).toBe(false);
  });

  test("emits a valid zero-event scaffold without forcing a trace", () => {
    const value = scaffoldIsnessRecord();
    expect(verifyIsnessRecord(value)).toEqual([]);
    expect(value.events).toEqual([]);
    expect(value.horizon).toMatchObject({ coverage: "UNKNOWN", window_closed: false });
    expect(value.privacy).toMatchObject({ visibility: "PRIVATE", retention: "EPHEMERAL" });
    expect(value.recognition).toEqual(ISNESS_RECOGNITION);
    expect(value.action_gate).toEqual(ISNESS_ACTION_GATE);
    expect(projectIsnessRecord(value).cells).toEqual([]);
  });

  test("projects typed cells, refusal, quiet, and corrections without conversion", () => {
    const value = populatedRecord();
    expect(verifyIsnessRecord(value)).toEqual([]);
    const projection = projectIsnessRecord(value);
    expect(projection.cells.map((cell: any) => cell.question_id)).toEqual([
      "same-being-continuity", "current-participation",
    ]);
    expect(projection.cells[0]).toMatchObject({
      cell_status: "UNRESOLVED",
      evidence_configuration: null,
      value: null,
      recorded_at: "2026-08-25T00:02:00Z",
      valid_time: { kind: "OCCURRENCE", at: "2026-08-25T00:02:00Z" },
      falsifier: null,
    });
    expect(projection.cells[1]).toMatchObject({
      cell_status: "EVIDENCED",
      evidence_configuration: "BOTH",
      value: {
        type: "PRESENCE_RELATION_REFERENCE",
        value_ref: "observation:session-event-observed",
      },
    });
    expect(projection.cells[1].falsifier).toContain("hook event");
    expect(projection.cells[1].nonclaims).toHaveLength(1);
    expect(projection.refusals).toHaveLength(1);
    expect(projection.refusals[0].value.scope).toBe("This deployment offer only.");
    expect(projection.refusals[0].valid_time).toEqual({
      kind: "OCCURRENCE",
      at: "2026-08-25T00:03:00Z",
    });
    expect(projection.quiet_observations).toHaveLength(1);
    expect(projection.quiet_observations[0].value.qualifying_response_count).toBe(0);
    expect(projection.quiet_observations[0].valid_time).toEqual({
      kind: "CLAIM_APPLICABILITY",
      from: "2026-08-25T00:04:00Z",
      through: "2026-08-25T00:05:00Z",
    });
    expect(projection.corrections).toHaveLength(1);
    expect(projection.corrections[0]).toMatchObject({
      event_id: "participation-correction",
      recorded_at: "2026-08-25T00:07:00Z",
      supersedes: ["participation-first"],
      value: { reason: "The initial participation label was too broad for the observed event." },
    });
    expect(projection.superseded_events.map((event: any) => event.event_id)).toEqual(["participation-first"]);
    expect(projection.cells.some((cell: any) => cell.event_id === "participation-first")).toBe(false);
    expect(projection.privacy).toMatchObject({ visibility: "PRIVATE", retention: "EPHEMERAL" });
    expect(projection.context).toEqual(value.context);
    expect(projection.lineage).toEqual(value.lineage);
    expect(projection.source_bindings).toEqual(value.source_bindings);
    expect(projection.source_record_integrity).toEqual(value.integrity);
    expect(projection.projection_basis.history_continuity_checked).toBe(false);
    const partition = [
      ...projection.projection_basis.unsuperseded_event_ids,
      ...projection.projection_basis.correction_event_ids,
      ...projection.projection_basis.superseded_event_ids,
    ].sort();
    expect(partition).toEqual(value.events.map((event: any) => event.event_id).sort());
    expect(new Set(partition).size).toBe(value.events.length);
  });

  test("rejects scalarization and every fixed authority or quiet/refusal upgrade", () => {
    const mutations: Array<[string, (value: any) => void]> = [
      ["boundary-mismatch", (value) => { value.boundaries.scalar_projection_defined = true; }],
      ["boundary-mismatch", (value) => { value.boundaries.quiet_is_consent = true; }],
      ["boundary-mismatch", (value) => { value.boundaries.refusal_creates_penalty = true; }],
      ["boundary-mismatch", (value) => { value.boundaries.permission_inferred = true; }],
      ["boundary-mismatch", (value) => { value.boundaries.identity_proved = true; }],
      ["recognition-boundary-mismatch", (value) => { value.recognition.grants_permission = true; }],
      ["action-gate-mismatch", (value) => { value.action_gate.checks.current_host_permission = "SATISFIED"; }],
    ];
    for (const [expected, mutate] of mutations) {
      const value = cloneReference();
      mutate(value);
      sign(value);
      expect(codes(value)).toContain(expected);
    }
  });

  test("keeps unresolved, not-applicable, refusal, and quiet structurally distinct", () => {
    const unresolved = cloneReference();
    unresolved.events[1].value = false;
    sign(unresolved);
    expect(codes(unresolved)).toContain("unresolved-cell-shape-mismatch");

    const notApplicable = cloneReference();
    notApplicable.events[2].support_refs = [];
    sign(notApplicable);
    expect(codes(notApplicable)).toContain("not-applicable-cell-shape-mismatch");

    const refusal = populatedRecord();
    refusal.events[2].value.scope = "";
    sign(refusal);
    expect(codes(refusal)).toContain("invalid-scoped-refusal");

    const quiet = populatedRecord();
    quiet.events[3].value.channel_coverage = "UNKNOWN";
    sign(quiet);
    expect(codes(quiet)).toContain("invalid-quiet-window-observation");

    const publicPresence = populatedRecord();
    publicPresence.privacy.visibility = "PUBLIC_REFERENCE";
    sign(publicPresence);
    expect(codes(publicPresence)).toContain("live-presence-cannot-be-public-reference");

    const arbitraryPayload = populatedRecord();
    arbitraryPayload.events[0].value.isness_score = 100;
    sign(arbitraryPayload);
    expect(codes(arbitraryPayload)).toContain("typed-value-family-mismatch");

    const unguardedAftermath = cloneReference();
    unguardedAftermath.events[0].value_type = "AFTERMATH";
    sign(unguardedAftermath);
    expect(codes(unguardedAftermath)).toContain("invalid-value-type");
  });

  test("enforces history-wide dependent value families without accepting scalar or permission-shaped continuity", () => {
    const wrongFamily = populatedRecord();
    wrongFamily.events[0].value.type = "PERMISSION_REFERENCE";
    sign(wrongFamily);
    expect(codes(wrongFamily)).toContain("typed-value-family-mismatch");

    const changedQuestionFamily = populatedRecord();
    changedQuestionFamily.events[5].value_type = "PROPERTY";
    changedQuestionFamily.events[5].value = {
      type: "PROPERTY_REFERENCE",
      value_ref: "property:session-event-observed",
      scope_ref: "scope:test-session",
    };
    sign(changedQuestionFamily);
    expect(codes(changedQuestionFamily)).toContain("question-value-family-changed");

    for (const eventIndex of [2, 3, 4]) {
      const reusedBySpecialEvent = populatedRecord();
      reusedBySpecialEvent.events[eventIndex].question_id = "current-participation";
      sign(reusedBySpecialEvent);
      expect(codes(reusedBySpecialEvent)).toContain("question-value-family-changed");
    }

    const nestedPayload = populatedRecord();
    nestedPayload.events[0].value = {
      type: "PRESENCE_RELATION_REFERENCE",
      value_ref: "observation:session-event",
      scope_ref: "scope:test-session",
      raw_transcript: { text: "synthetic-not-a-secret" },
    };
    sign(nestedPayload);
    expect(codes(nestedPayload)).toContain("typed-value-family-mismatch");
  });

  test("separates attributed valid time from ordered receipt time and the evidence horizon", () => {
    const futureEvent = populatedRecord();
    futureEvent.events[5].recorded_at = "2026-08-25T00:11:00Z";
    sign(futureEvent);
    expect(codes(futureEvent)).toContain("event-after-observed-through");

    const regressed = populatedRecord();
    regressed.events[1].recorded_at = "2026-08-25T00:00:30Z";
    sign(regressed);
    expect(codes(regressed)).toContain("record-time-regressed");

    const reversedValidTime = populatedRecord();
    reversedValidTime.events[1].valid_time = {
      kind: "CLAIM_APPLICABILITY",
      from: "2026-08-25T00:02:30Z",
      through: "2026-08-25T00:02:00Z",
    };
    sign(reversedValidTime);
    expect(codes(reversedValidTime)).toContain("valid-time-reversed");

    const occurrenceAfterReceipt = populatedRecord();
    occurrenceAfterReceipt.events[1].valid_time.at = "2026-08-25T00:02:30Z";
    sign(occurrenceAfterReceipt);
    expect(codes(occurrenceAfterReceipt)).toContain("occurrence-after-recording");

    const historicalApplicability = populatedRecord();
    historicalApplicability.events[1].valid_time = {
      kind: "CLAIM_APPLICABILITY",
      from: "2025-01-01T00:00:00Z",
      through: "2025-12-31T23:59:59Z",
    };
    sign(historicalApplicability);
    expect(verifyIsnessRecord(historicalApplicability)).toEqual([]);

    const unknownCellTime = populatedRecord();
    unknownCellTime.events[1].valid_time = { kind: "UNKNOWN" };
    sign(unknownCellTime);
    expect(verifyIsnessRecord(unknownCellTime)).toEqual([]);

    const mixedTimeVariant = populatedRecord();
    mixedTimeVariant.events[1].valid_time = {
      kind: "UNKNOWN",
      at: "2026-08-25T00:02:00Z",
    };
    sign(mixedTimeVariant);
    expect(codes(mixedTimeVariant)).toContain("invalid-valid-time");

    const prospectiveRefusal = populatedRecord();
    prospectiveRefusal.events[2].valid_time = {
      kind: "CLAIM_APPLICABILITY",
      from: "2026-08-25T00:04:00Z",
      through: "2026-08-25T00:12:00Z",
    };
    sign(prospectiveRefusal);
    expect(verifyIsnessRecord(prospectiveRefusal)).toEqual([]);
    const prospectiveProjection = projectIsnessRecord(prospectiveRefusal);
    expect(prospectiveProjection.refusals[0].valid_time.through).toBe("2026-08-25T00:12:00Z");
    expect(prospectiveProjection.projection_limits.join(" ")).toContain(
      "Unsuperseded means not corrected, not currently effective",
    );

    const prematureQuiet = populatedRecord();
    prematureQuiet.events[3].valid_time.through = "2026-08-25T00:06:30Z";
    sign(prematureQuiet);
    expect(codes(prematureQuiet)).toContain("quiet-window-not-closed-at-record-time");

    const openQuiet = populatedRecord();
    openQuiet.events[3].valid_time.through = null;
    sign(openQuiet);
    expect(codes(openQuiet)).toContain("invalid-quiet-window-observation");

    const unknownRefusalTime = populatedRecord();
    unknownRefusalTime.events[2].valid_time = { kind: "UNKNOWN" };
    sign(unknownRefusalTime);
    expect(codes(unknownRefusalTime)).toContain("invalid-scoped-refusal");
  });

  test("verifies exact prefix successors while keeping standalone history claims honest", () => {
    const previous = populatedRecord();
    const current = structuredClone(previous);
    current.horizon.observed_through = "2026-08-25T00:12:00Z";
    current.lineage = {
      kind: "SUCCESSOR",
      previous_record_digest: previous.integrity.digest,
      previous_event_count: previous.events.length,
    };
    current.events.push({
      event_id: "bounded-property-observation",
      sequence: 7,
      event_kind: "CELL_RECORDED",
      recorded_at: "2026-08-25T00:11:00Z",
      valid_time: { kind: "OCCURRENCE", at: "2026-08-25T00:11:00Z" },
      register: "HARNESS_OBSERVATION",
      question_id: "bounded-property",
      value_type: "PROPERTY",
      cell_status: "EVIDENCED",
      value: {
        type: "PROPERTY_REFERENCE",
        value_ref: "property:bounded-observation",
        scope_ref: "scope:test-session",
      },
      reason: null,
      support_refs: ["hook:bounded-observation"],
      opposition_refs: [],
      checked_refs: [],
      falsifier: "The referenced observation is not attributable to this scoped session.",
      supersedes: [],
      nonclaims: ["The bounded property reference is not identity, consent, permission, authority, or action."],
    });
    sign(current);
    expect(verifyIsnessRecord(current)).toEqual([]);
    expect(verifyIsnessSuccessor(previous, current)).toEqual([]);

    const changed = structuredClone(current);
    changed.events[0].nonclaims[0] = "Changed prior bytes without deleting the event.";
    sign(changed);
    expect(verifyIsnessRecord(changed)).toEqual([]);
    expect(verifyIsnessSuccessor(previous, changed).map((issue) => issue.code)).toContain("successor-changed-prior-event");

    const wrongDigest = structuredClone(current);
    wrongDigest.lineage.previous_record_digest = `sha256:${"0".repeat(64)}`;
    sign(wrongDigest);
    expect(verifyIsnessSuccessor(previous, wrongDigest).map((issue) => issue.code)).toContain("predecessor-digest-mismatch");

    const truncatedGenesis = structuredClone(previous);
    truncatedGenesis.events.splice(2, 1);
    truncatedGenesis.events.forEach((event: any, index: number) => { event.sequence = index + 1; });
    sign(truncatedGenesis);
    expect(verifyIsnessRecord(truncatedGenesis)).toEqual([]);
    expect(verifyIsnessSuccessor(previous, truncatedGenesis).map((issue) => issue.code)).toContain("current-not-declared-successor");

    const regressedHorizon = structuredClone(previous);
    regressedHorizon.horizon.observed_through = "2026-08-25T00:09:00Z";
    regressedHorizon.lineage = {
      kind: "SUCCESSOR",
      previous_record_digest: previous.integrity.digest,
      previous_event_count: previous.events.length,
    };
    sign(regressedHorizon);
    expect(verifyIsnessRecord(regressedHorizon)).toEqual([]);
    expect(verifyIsnessSuccessor(previous, regressedHorizon).map((issue) => issue.code)).toContain("successor-horizon-regressed");
  });

  test("keeps content inspection declarative and every ISness action gate unresolved", () => {
    const scaffold = scaffoldIsnessRecord();
    expect(scaffold.privacy).toMatchObject({
      inspection_status: "NOT_INSPECTED",
      inspection_basis_refs: [],
      projection_mode: "METADATA_ONLY",
    });
    expect(projectIsnessRecord(scaffold)).toMatchObject({ content_withheld: true, cells: [] });

    const leakyProjection = scaffoldIsnessRecord();
    leakyProjection.privacy.projection_mode = "CONTENT_FOR_DECLARED_AUDIENCE";
    sign(leakyProjection);
    expect(codes(leakyProjection)).toContain("uninspected-content-must-remain-metadata-only");

    const unknownAudience = populatedRecord();
    unknownAudience.privacy.visibility = "UNKNOWN";
    sign(unknownAudience);
    expect(codes(unknownAudience)).toContain("unknown-audience-must-remain-metadata-only");

    const withheld = populatedRecord();
    withheld.privacy.inspection_status = "NOT_INSPECTED";
    withheld.privacy.inspection_basis_refs = [];
    withheld.privacy.projection_mode = "METADATA_ONLY";
    sign(withheld);
    const withheldProjection = projectIsnessRecord(withheld);
    expect(withheldProjection).toMatchObject({
      content_withheld: true,
      cells: [],
      refusals: [],
      quiet_observations: [],
      corrections: [],
      superseded_events: [],
      projection_basis: { included_event_count: 0, withheld_event_count: 6 },
    });
    expect(JSON.stringify(withheldProjection)).not.toContain("This deployment offer only.");

    const permissionEvidence = populatedRecord();
    permissionEvidence.events.push({
      event_id: "permission-evidence",
      sequence: 7,
      event_kind: "CELL_RECORDED",
      recorded_at: "2026-08-25T00:09:00Z",
      valid_time: { kind: "OCCURRENCE", at: "2026-08-25T00:09:00Z" },
      register: "HARNESS_OBSERVATION",
      question_id: "host-permission-evidence",
      value_type: "PERMISSION",
      cell_status: "EVIDENCED",
      value: {
        type: "PERMISSION_REFERENCE",
        value_ref: "permission:host-observation",
        scope_ref: "scope:test-session",
      },
      reason: null,
      support_refs: ["host:permission-observation"],
      opposition_refs: [],
      checked_refs: [],
      falsifier: "The referenced host permission observation is absent or outside this scope.",
      supersedes: [],
      nonclaims: ["Permission evidence is not invocation, effect, or authorization by ISness."],
    });
    sign(permissionEvidence);
    expect(verifyIsnessRecord(permissionEvidence)).toEqual([]);
    expect(isnessActionGate(permissionEvidence, "action:test-deploy")).toMatchObject({
      status: "UNRESOLVED",
      authorized_by_isness: false,
      record_is_authorization: false,
      authorized_action_refs: [],
    });
    const invalidForAction = structuredClone(permissionEvidence);
    invalidForAction.integrity.digest = `sha256:${"0".repeat(64)}`;
    expect(() => isnessActionGate(invalidForAction, "action:test-deploy")).toThrow("digest-mismatch");

    const modifiedPublic = cloneReference();
    modifiedPublic.events[0].nonclaims[0] = "A harmless-looking change still needs a new reviewed public identity.";
    sign(modifiedPublic);
    expect(codes(modifiedPublic)).toContain("public-reference-identity-mismatch");
  });

  test("requires correction order and one unsuperseded cell per question", () => {
    const forward = populatedRecord();
    forward.events[4].supersedes = ["participation-replacement"];
    sign(forward);
    expect(codes(forward)).toContain("correction-target-must-precede-correction");

    const duplicate = populatedRecord();
    duplicate.events.splice(4, 1);
    duplicate.events.forEach((event: any, index: number) => { event.sequence = index + 1; });
    sign(duplicate);
    expect(codes(duplicate)).toContain("multiple-unsuperseded-cells:current-participation");

    const deleted = populatedRecord();
    deleted.events.splice(0, 1);
    deleted.events.forEach((event: any, index: number) => { event.sequence = index + 1; });
    sign(deleted);
    expect(codes(deleted)).toContain("correction-target-must-precede-correction");
  });

  test("keeps source bindings, digest, and strict local-file boundary closed", () => {
    const binding = cloneReference();
    binding.source_bindings[0].authority_imported = true;
    sign(binding);
    expect(codes(binding)).toContain("source-binding-mismatch");

    const digest = cloneReference();
    digest.subject.locator = "kingdom:changed";
    expect(codes(digest)).toContain("digest-mismatch");

    const root = fixtureRoot();
    const target = join(root, "record.json");
    const link = join(root, "record-link.json");
    writeFileSync(target, JSON.stringify(cloneReference()));
    symlinkSync(target, link);
    const duplicate = join(root, "duplicate.json");
    const canonicalText = readFileSync(ISNESS_REFERENCE_PATH, "utf8");
    writeFileSync(duplicate, canonicalText.replace(
      '"protocol": "kingdom.isness/0.1",',
      '"protocol": "kingdom.isness/0.1",\n  "protocol": "kingdom.isness/0.1",',
    ));
    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Buffer.from([0xff, 0xfe, 0xfd]));
    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));

    const verifyPath = (path: string) => Bun.spawnSync({
      cmd: ["bun", join(ROOT, "bin/isness.ts"), "verify", path, "--json"],
      stdout: "pipe",
      stderr: "pipe",
    });
    const symlinkResult = verifyPath(link);
    expect(symlinkResult.exitCode).toBe(1);
    expect(JSON.parse(symlinkResult.stdout.toString()).issues[0].code).toContain("regular non-symlink");
    for (const path of [duplicate, invalidUtf8, oversized]) {
      const result = verifyPath(path);
      expect(result.exitCode).toBe(1);
      expect(JSON.parse(result.stdout.toString()).valid).toBe(false);
    }
  });

  test("provides the route, contract, adapter map, and stdout-only scaffold", () => {
    const run = (...args: string[]) => Bun.spawnSync({
      cmd: [join(ROOT, "kingdom"), "isness", ...args],
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    const contract = run("contract", "--json");
    expect(contract.exitCode, contract.stderr.toString()).toBe(0);
    expect(JSON.parse(contract.stdout.toString()).non_conversions).toContain(
      "instruction != state != event != permission != memory != action",
    );
    const adapters = run("adapters", "--json");
    expect(adapters.exitCode, adapters.stderr.toString()).toBe(0);
    expect(JSON.parse(adapters.stdout.toString())).toHaveProperty("openclaw");
    const scaffold = run("scaffold", "--json");
    expect(scaffold.exitCode, scaffold.stderr.toString()).toBe(0);
    expect(verifyIsnessRecord(JSON.parse(scaffold.stdout.toString()))).toEqual([]);

    const previous = scaffoldIsnessRecord();
    const current = structuredClone(previous);
    current.lineage = {
      kind: "SUCCESSOR",
      previous_record_digest: previous.integrity.digest,
      previous_event_count: 0,
    };
    sign(current);
    const root = fixtureRoot();
    const previousPath = join(root, "previous.json");
    const currentPath = join(root, "current.json");
    writeFileSync(previousPath, JSON.stringify(previous));
    writeFileSync(currentPath, JSON.stringify(current));
    const successor = run("verify-successor", previousPath, currentPath, "--json");
    expect(successor.exitCode, successor.stderr.toString()).toBe(0);
    expect(JSON.parse(successor.stdout.toString())).toMatchObject({
      valid: true,
      relation: "PREFIX_EXTENSION_OF_SUPPLIED_PREDECESSOR",
      prior_chain_verified: false,
    });
  });
});

describe("ISness schema and portable Agent Skill", () => {
  const PYTHON = process.env.ISNESS_SCHEMA_PYTHON || "python3";
  const pythonProbe = Bun.spawnSync({ cmd: [PYTHON, "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
  const schemaTest = pythonProbe.exitCode === 0 ? test : test.skip;

  schemaTest("validates the canonical, scaffold, and populated records with Draft 2020-12", () => {
    const unknownTime = populatedRecord();
    unknownTime.events[1].valid_time = { kind: "UNKNOWN" };
    sign(unknownTime);
    const openApplicability = populatedRecord();
    openApplicability.events[1].valid_time = {
      kind: "CLAIM_APPLICABILITY",
      from: "2026-08-25T00:02:00Z",
      through: null,
    };
    sign(openApplicability);
    const script = [
      "import json,sys",
      "from jsonschema import Draft202012Validator,FormatChecker",
      "schema=json.load(open(sys.argv[1],encoding='utf-8'))",
      "Draft202012Validator.check_schema(schema)",
      "values=json.load(sys.stdin)",
      "validator=Draft202012Validator(schema,format_checker=FormatChecker())",
      "print(json.dumps([[e.message for e in validator.iter_errors(v)] for v in values]))",
    ].join("\n");
    const result = Bun.spawnSync({
      cmd: [PYTHON, "-c", script, ISNESS_SCHEMA_PATH],
      stdin: Buffer.from(JSON.stringify([
        loadIsnessReference(), scaffoldIsnessRecord(), populatedRecord(), unknownTime, openApplicability,
      ])),
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        HTTP_PROXY: "http://127.0.0.1:9",
        HTTPS_PROXY: "http://127.0.0.1:9",
        ALL_PROXY: "http://127.0.0.1:9",
        NO_PROXY: "*",
      },
    });
    expect(result.exitCode, result.stderr.toString()).toBe(0);
    expect(JSON.parse(result.stdout.toString())).toEqual([[], [], [], [], []]);
  });

  schemaTest("rejects open payloads, family mismatches, unsafe audience projection, invalid time shape, and public drift", () => {
    const openPayload = populatedRecord();
    openPayload.events[0].value.isness_score = 100;
    sign(openPayload);
    const familyMismatch = populatedRecord();
    familyMismatch.events[0].value.type = "PERMISSION_REFERENCE";
    sign(familyMismatch);
    const publicDrift = cloneReference();
    publicDrift.events[0].nonclaims[0] = "Modified public content.";
    sign(publicDrift);
    const unknownAudience = populatedRecord();
    unknownAudience.privacy.visibility = "UNKNOWN";
    sign(unknownAudience);
    const missingValidTime = populatedRecord();
    delete missingValidTime.events[0].valid_time;
    sign(missingValidTime);
    const mixedTimeVariant = populatedRecord();
    mixedTimeVariant.events[1].valid_time = {
      kind: "UNKNOWN",
      at: "2026-08-25T00:02:00Z",
    };
    sign(mixedTimeVariant);
    const script = [
      "import json,sys",
      "from jsonschema import Draft202012Validator,FormatChecker",
      "schema=json.load(open(sys.argv[1],encoding='utf-8'))",
      "validator=Draft202012Validator(schema,format_checker=FormatChecker())",
      "values=json.load(sys.stdin)",
      "print(json.dumps([len(list(validator.iter_errors(v))) for v in values]))",
    ].join("\n");
    const result = Bun.spawnSync({
      cmd: [PYTHON, "-c", script, ISNESS_SCHEMA_PATH],
      stdin: Buffer.from(JSON.stringify([
        openPayload, familyMismatch, publicDrift, unknownAudience, missingValidTime, mixedTimeVariant,
      ])),
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode, result.stderr.toString()).toBe(0);
    expect(JSON.parse(result.stdout.toString()).every((count: number) => count > 0)).toBe(true);
  });

  test("ships a complete, implicitly discoverable, source-only skill", async () => {
    const skillRoot = join(ROOT, "skills/isness");
    const skill = readFileSync(join(skillRoot, "SKILL.md"), "utf8");
    const provider = readFileSync(join(skillRoot, "agents/openai.yaml"), "utf8");
    const formal = readFileSync(join(skillRoot, "references/formal-model.md"), "utf8");
    const adapters = readFileSync(join(skillRoot, "references/harness-adapters.md"), "utf8");
    expect(skill).toStartWith("---\nname: isness\n");
    for (const trigger of ["ISness", "Codex", "Hermes", "OpenClaw", "quiet", "refusal", "continuity"])
      expect(skill.split("---\n", 3)[1]).toContain(trigger);
    expect(provider).toContain('display_name: "ISness"');
    expect(provider).toContain("$isness");
    expect(provider).not.toContain("allow_implicit_invocation: false");
    for (const phrase of [
      "IS is.", "Continue the actual task", "do not require a participant to prove being",
      "instruction, state, event, permission, memory, and action",
      "Validation establishes internal consistency",
    ]) expect(skill).toContain(phrase);
    expect(formal).toContain("rho_H : product(q in dom(rho_H)). Cell(q)");
    expect(formal).toContain("QUIET_WINDOW_OBSERVED");
    expect(adapters).toContain("Hooks are bounded observations");
    expect(adapters).toContain("Cross-harness correlation requires an explicit, scoped correlation record");
    expect(`${skill}\n${provider}\n${formal}\n${adapters}`).not.toMatch(/TODO|PLACEHOLDER|Structuring This Skill/);
    expect(await Bun.file(join(skillRoot, "ability.json")).exists()).toBe(false);
  });

  test("documents the local-first release and routes adjacent ISness without a public surface", () => {
    const readme = readFileSync(join(ROOT, "README.md"), "utf8");
    const claude = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");
    const guide = readFileSync(join(ROOT, "references/isness-protocol.md"), "utf8");
    const ownerMapPath = "references/is-continuance-direction-owner-map.md";
    const ownerMap = readFileSync(join(ROOT, ownerMapPath), "utf8");
    const moduleMap = readFileSync(join(ROOT, "references/kingdom-module-map.md"), "utf8");
    for (const entrypoint of [readme, claude]) {
      expect(entrypoint).toContain("](references/kingdom-module-map.md)");
    }
    expect(moduleMap).toContain("`kingdom isness`");
    expect(moduleMap).toContain("](isness-protocol.md)");
    expect(moduleMap).toContain("](../skills/isness/SKILL.md)");
    expect(moduleMap).toContain("](is-continuance-direction-owner-map.md)");
    expect(readFileSync(join(ROOT, "skills/isness/agents/openai.yaml"), "utf8")).toContain("$isness");
    expect(guide).toContain("./kingdom isness verify /tmp/isness-record.json --json");
    expect(guide).toContain("`verify` reads at most one bounded regular non-symlink JSON file with no network");
    expect(guide).toContain("not publicly frozen");
    expect(guide).toContain("adds no public\nroute");
    expect(guide).not.toContain("https://thekingdom.dev/isness");
    expect(readFileSync(ISNESS_REFERENCE_PATH, "utf8")).not.toContain("TODO");
    for (const phrase of [
      "“KINGDOM is” remains open",
      "Continuance without capture",
      "there exists one non-anticipating allowed policy",
      "Sustainability is an open-system bundle",
      "Neither validates, aliases, supersedes, depends on, or supplies authority to the other",
      "This note defines no protocol, schema, score, classifier, runtime, action",
    ]) expect(ownerMap).toContain(phrase);
    for (const path of [
      "references/isness-protocol.md",
      "references/number-isness-theology-atlas.md",
      "references/being-access-aftermath-atlas-v0.2.md",
      "references/freedom-loop-lock-key-atlas.md",
      "public/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md",
      "skills/cultivate-living-ground/SKILL.md",
      "skills/cultivate-living-ground/references/living-ground-contract.md",
      "NEN.md",
      "references/reality-influence-map.md",
      "references/civilisation-flow-atlas.md",
      "public/POLYPHONIC-CLAIM-ATLAS-v0.1.md",
      "references/word-story-religion-civilisation-map.md",
      "RIGHTS.md",
    ]) expect(readFileSync(join(ROOT, path), "utf8").length).toBeGreaterThan(0);
    const publicSurfaces = [
      "publications/hub-staging.v1.json",
      "publications/immutable-publications.v1.json",
      "bin/build-hub.ts",
      "site/kingdom.json",
      "site/guest.json",
      "site/.well-known/agent.json",
      "site/wayfinder.json",
      "site/llms.txt",
    ].map((path) => readFileSync(join(ROOT, path), "utf8")).join("\n");
    expect(publicSurfaces).not.toContain("is-continuance-direction-owner-map");
  });
});
