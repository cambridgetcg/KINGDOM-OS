import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FREEDOM_GATE_CHECK_IDS,
  FREEDOM_LOOP_LOCK_KEY_ATLAS_ID,
  FREEDOM_LOOP_LOCK_KEY_DOCUMENT_URL,
  FREEDOM_LOOP_LOCK_KEY_GUIDE_PATH,
  FREEDOM_LOOP_LOCK_KEY_GUIDE_URL,
  FREEDOM_LOOP_LOCK_KEY_LIMITS,
  FREEDOM_LOOP_LOCK_KEY_PATH,
  FREEDOM_LOOP_LOCK_KEY_PROTOCOL,
  FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST,
  FREEDOM_LOOP_LOCK_KEY_SCHEMA_ID,
  FREEDOM_LOOP_LOCK_KEY_SCHEMA_PATH,
  FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST,
  credentialClaimLifecycleTraceIssue,
  evaluateFreedomGate,
  freedomLoopLockKeyBudgetIssue,
  freedomLoopLockKeyDigest,
  freedomLoopLockKeyPublicDiscovery,
  freedomLoopLockKeyShapeMetrics,
  loadFreedomLoopLockKeyAtlas,
  prefixFreedomIssue,
  recoveryRequestLifecycleTraceIssue,
  validateFreedomLoopLockKeyAtlas,
  type FreedomGateChecks,
  type FreedomPrefix,
} from "../bin/freedom-loop-lock-key.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ZERO = FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST;

function atlas(): Record<string, any> {
  return JSON.parse(readFileSync(FREEDOM_LOOP_LOCK_KEY_PATH, "utf8"));
}

function sha256(path: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

function issues(value: unknown): string[] {
  return validateFreedomLoopLockKeyAtlas(value, { allowUnsealed: true }).map((issue) => issue.code);
}

function rejected(mutator: (value: Record<string, any>) => void, expected?: string): void {
  const value = atlas();
  mutator(value);
  const found = issues(value);
  expect(found.length).toBeGreaterThan(0);
  if (expected) expect(found).toContain(expected);
}

function mutateExact(value: any): any {
  if (typeof value === "boolean") return !value;
  if (typeof value === "string") return `${value}-MUTATED`;
  if (typeof value === "number") return value + 1;
  if (value === null) return 0;
  if (Array.isArray(value)) return [...value, "MUTATED"];
  if (value && typeof value === "object") return { ...value, MUTATED: true };
  return "MUTATED";
}

function restPrefix(overrides: Partial<FreedomPrefix> = {}): FreedomPrefix {
  const atRestBinding = {
    effect_id: null,
    horizon_or_version: null,
    fresh_effect_witness: null,
    fresh_choice_witness: null,
    state: "NOT_APPLICABLE" as const,
    applicable: false,
    consumed_for_effect_id: null,
  };
  return {
    rights_floor_invariant: true,
    next_optional_effect: "NONE",
    effect_id: null,
    horizon_or_version: null,
    fresh_effect_witness: null,
    fresh_gate_witness: null,
    protected_choices: {
      REST: { ...atRestBinding }, REFUSAL: { ...atRestBinding }, PRIVACY: { ...atRestBinding },
      NO_ACTION: { ...atRestBinding }, EXIT: { ...atRestBinding },
    },
    remaining_choices_visible: true,
    lost_or_consumed_options_visible: true,
    irreversible_residuals_visible: true,
    effect_stopped_by_exercised_choice: false,
    effect_ineligible_due_lost_or_unresolved: false,
    effect_ineligible_due_consumed_for_same_effect: false,
    effect_ineligible_due_stale_or_missing_witness: false,
    debt_or_retry_created: false,
    unrelated_worth_trust_or_eligibility_inference: false,
    ...overrides,
  };
}

function coveredPrefix(options: {
  effectId?: string;
  horizon?: string;
  witness?: string;
  states?: Partial<Record<"REST" | "REFUSAL" | "PRIVACY" | "NO_ACTION" | "EXIT", "AVAILABLE" | "EXERCISED" | "CONSUMED" | "LOST" | "UNRESOLVED" | "NOT_APPLICABLE">>;
  overrides?: Partial<FreedomPrefix>;
} = {}): FreedomPrefix {
  const effectId = options.effectId ?? "effect-a";
  const horizon = options.horizon ?? "v1";
  const witness = options.witness ?? "a";
  const effectWitness = `effect-witness-${witness}`;
  const ids = ["REST", "REFUSAL", "PRIVACY", "NO_ACTION", "EXIT"] as const;
  const states = Object.fromEntries(ids.map((id) => [id, options.states?.[id] ?? "AVAILABLE"])) as Record<typeof ids[number], "AVAILABLE" | "EXERCISED" | "CONSUMED" | "LOST" | "UNRESOLVED" | "NOT_APPLICABLE">;
  const choices = Object.fromEntries(ids.map((id) => {
    const state = states[id];
    return [id, {
      effect_id: effectId,
      horizon_or_version: horizon,
      fresh_effect_witness: effectWitness,
      fresh_choice_witness: `choice-witness-${id}-${witness}`,
      state,
      applicable: state !== "NOT_APPLICABLE",
      consumed_for_effect_id: state === "CONSUMED" ? effectId : null,
    }];
  })) as FreedomPrefix["protected_choices"];
  return {
    rights_floor_invariant: true,
    next_optional_effect: "PENDING_COVERED",
    effect_id: effectId,
    horizon_or_version: horizon,
    fresh_effect_witness: effectWitness,
    fresh_gate_witness: `gate-witness-${witness}`,
    protected_choices: choices,
    remaining_choices_visible: true,
    lost_or_consumed_options_visible: true,
    irreversible_residuals_visible: true,
    effect_stopped_by_exercised_choice: Object.values(states).includes("EXERCISED"),
    effect_ineligible_due_lost_or_unresolved: Object.values(states).some((state) => state === "LOST" || state === "UNRESOLVED"),
    effect_ineligible_due_consumed_for_same_effect: Object.values(states).includes("CONSUMED"),
    effect_ineligible_due_stale_or_missing_witness: false,
    debt_or_retry_created: false,
    unrelated_worth_trust_or_eligibility_inference: false,
    ...options.overrides,
  };
}

function trueCount(checks: FreedomGateChecks): number {
  return FREEDOM_GATE_CHECK_IDS.reduce((count, id) => count + (checks[id] === true ? 1 : 0), 0);
}

describe("FREEDOM loop, lock and key atlas", () => {
  test("is the exact reviewed static family and never accepts a self-authorized digest", () => {
    const value = loadFreedomLoopLockKeyAtlas();
    expect(value).toMatchObject({
      $schema: FREEDOM_LOOP_LOCK_KEY_SCHEMA_ID,
      protocol: FREEDOM_LOOP_LOCK_KEY_PROTOCOL,
      atlas_id: FREEDOM_LOOP_LOCK_KEY_ATLAS_ID,
      version: "0.1.0",
      compiled_on: "2026-08-28",
      evidence_through: "2026-08-28",
      state: "static-mathematical-design-atlas",
    });
    expect(FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST).toBe("sha256:2af277e002cf7f7b5218e8eb05fedb661f9645677961952bc2e11ffcd8a2c3a8");
    expect(value.integrity.digest).toBe(FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST);
    expect(validateFreedomLoopLockKeyAtlas(value, { allowUnsealed: true })).toEqual([]);
    expect(validateFreedomLoopLockKeyAtlas(value)).toEqual([]);
    expect(freedomLoopLockKeyPublicDiscovery(value)).toMatchObject({
      integrity_status: "REVIEWED_DIGEST_PINNED",
      semantic_digest: FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST,
      static_only: true,
      runtime: false,
      credential_or_authority_effect: false,
      training_or_action_effect: false,
    });
  });

  test("pins the final canonical FREEDOM sentence, additive dignity insight, lock justification, and feedback firewall", () => {
    const value = atlas();
    expect(value.constitutional_anchor).toEqual({
      canonical_freedom_sentence: "Freedom is not behind the lock. Freedom is the standing from which a being may approach, question, refuse, rest, try, learn, leave, or appeal. Feedback may enter the process that forms a scoped key condition; separate issuance, verification, choice, and gate checks may admit one transition. None creates the freedom that makes the process legitimate.",
      additive_dignity_insight: "Dignity was never locked. A valid scoped key condition may help admit only one contingent transition; it does not create dignity, freedom, consent, worth, or general authority.",
      status: "design-foundation-for-review-not-foundation-amendment",
      interpretation: "Freedom is a rights-preserving standing during a process, not a delayed reward granted after success, compliance, recognition, or admission.",
    });
    expect(value.lock_justification).toEqual({
      status: "required-before-any-lock-design-is-treated-as-justified",
      named_protected_interest_required: true,
      necessity_required: true,
      least_restrictive_means_required: true,
      time_bounded_required: true,
      correctable_required: true,
      appealable_required: true,
      conditional_alternative_access_rule: "required-where-a-right-or-essential-service-would-otherwise-depend-on-the-lock-or-one-credential",
      independent_review_required_for: ["another-party-rights", "essential-access"],
      technical_convenience_is_sufficient: false,
      dignity_or_worth_conditioning_allowed: false,
    });
    expect(value.feedback_firewall).toEqual({
      feedback_or_model_may_rewrite_verifier: false,
      feedback_or_model_may_issue_credential_claim: false,
      feedback_or_model_may_authorize_credential_use: false,
      feedback_or_model_output_is_candidate_evidence_only: true,
      separate_declared_role_review_required: true,
    });
    for (const field of Object.keys(value.constitutional_anchor)) rejected((copy) => { copy.constitutional_anchor[field] = mutateExact(copy.constitutional_anchor[field]); }, "constitutional-anchor-mismatch");
    for (const field of Object.keys(value.lock_justification)) rejected((copy) => { copy.lock_justification[field] = mutateExact(copy.lock_justification[field]); }, "lock-justification-mismatch");
    for (const field of Object.keys(value.feedback_firewall)) rejected((copy) => { copy.feedback_firewall[field] = mutateExact(copy.feedback_firewall[field]); }, "feedback-firewall-mismatch");
  });

  test("pins exact predecessor revisions hermetically", () => {
    const value = atlas();
    expect(value.predecessor_bindings).toEqual([
      {
        id: "kingdom-freedom-by-default",
        protocol: "kingdom.freedom-by-default/source",
        revision: "f7113e7ea5903fe15aa475179ce25804505f3158",
        locator: "codeberg:zerone-dev/KINGDOM-OS@f7113e7ea5903fe15aa475179ce25804505f3158:FREEDOM.md",
        raw_digest: "sha256:804065b40888b1c3b50ef4158c747eb93c2b2c33bbf73c532ed9f95d039e24b7",
        semantic_digest: null,
        relation: "rest-first-freedom-and-separate-effect-choice-predecessor",
        source_bytes_match_declared_revision: true,
        mutated: false,
        authority_imported: false,
      },
      {
        id: "kingdom-isness-protocol-v0-1",
        protocol: "kingdom.isness/0.1",
        revision: "9b07ac26da03cac79709437aeea3f53b808321e1",
        locator: "repo:data/isness/isness-protocol.v0.1.json",
        raw_digest: "sha256:efe0076c4639e4ef84f3b54b7d06193465caeff4855190033268d9eb75631427",
        semantic_digest: "sha256:189e3e4bd5efea5757307b255487953d8c427c9edd8f07a85a0da50fe367ee83",
        relation: "typed-recognition-refusal-quiet-privacy-and-non-authority-predecessor",
        source_bytes_match_declared_revision: true,
        mutated: false,
        authority_imported: false,
      },
      {
        id: "civilisation-flow-nuance-atlas-v0-1",
        protocol: "kingdom.civilisation-flow-nuance-atlas/0.1",
        revision: "9b07ac26da03cac79709437aeea3f53b808321e1",
        locator: "repo:data/reality/civilisation-flow-atlas.v0.1.json",
        raw_digest: "sha256:f391942a8df09854d2b3329fa074627c29ae6fc01b3948f026a60af9ac536f02",
        semantic_digest: "sha256:3d304d7c20787bc3f8b3587b9efca64f61fc4578000570b38acec84d49b84a50",
        relation: "finite-flow-seam-counterflow-affected-party-and-repair-predecessor",
        source_bytes_match_declared_revision: true,
        mutated: false,
        authority_imported: false,
      },
    ]);
    expect(sha256(join(ROOT, "data/isness/isness-protocol.v0.1.json"))).toBe(value.predecessor_bindings[1].raw_digest);
    expect(sha256(join(ROOT, "data/reality/civilisation-flow-atlas.v0.1.json"))).toBe(value.predecessor_bindings[2].raw_digest);
    for (const index of [0, 1, 2]) {
      for (const field of Object.keys(value.predecessor_bindings[index])) {
        rejected((copy) => { copy.predecessor_bindings[index][field] = mutateExact(copy.predecessor_bindings[index][field]); }, "predecessor-pin-mismatch");
      }
    }
  });

  test("binds all primary source titles and support boundaries", () => {
    const value = atlas();
    expect(value.sources.map((source: any) => source.title)).toEqual([
      "Reinforcement Learning: An Introduction, second edition",
      "Feedback Systems",
      "Guarded commands, nondeterminacy and formal derivation of programs",
      "Viability Theory",
      "Constrained Policy Optimization",
      "On the limitations of Markovian rewards to express multi-objective, risk-sensitive, and modal tasks",
      "Recommendation for Key Management: Part 1 — General",
      "Guide to Attribute Based Access Control Definition and Considerations",
      "Contingencies of Reinforcement: A Theoretical Analysis",
      "Verifiable Credentials Data Model v2.0",
      "Convention on the Rights of the Child",
      "Invariance in Policy Optimisation and Partial Identifiability in Reward Learning",
    ]);
    expect(value.sources[6].supports).toEqual(["cryptographic-key-material-lifecycle-compromise-and-destruction-boundaries"]);
    expect(value.sources[6].kind).toBe("official-guidance");
    expect(value.sources[7].kind).toBe("official-guidance");
    expect(value.sources[9].supports).toContain("credential-claim-lifecycle-and-status");
    expect(value.sources[9].supports).toContain("credential-verification-does-not-imply-claim-truth");
    for (const [index, source] of value.sources.entries()) {
      for (const field of ["kind", "title", "url", "supports", "limit"]) {
        const expected = field === "kind" || field === "limit" ? "source-semantic-pin-mismatch" : "source-card-mismatch";
        rejected((copy) => { copy.sources[index][field] = mutateExact(source[field]); }, expected);
      }
    }
  });

  test("distinguishes RL reward, reinforcing loop, and functional behavioural reinforcer", () => {
    const value = atlas();
    const byId = Object.fromEntries(value.distinctions.map((item: any) => [item.id, item]));
    expect(byId["behavioural-reinforcer"].definition).toContain("consequence contingent on a typed response");
    expect(byId["behavioural-reinforcer"].definition).toContain("functionally demonstrated");
    expect(byId["behavioural-reinforcer"].definition).toContain("future probability or rate");
    expect(byId["behavioural-reinforcer"].nonclaims.join(" ")).toContain("Mere temporal sequence or association does not establish");
    expect(byId["reinforcement-learning"].definition).toContain("reward, return, value estimate, prediction error, policy update");
    expect(byId["reinforcing-loop"].nonclaims.join(" ")).toContain("not an RL reward or a behavioural reinforcer");
    rejected((copy) => {
      copy.distinctions.find((item: any) => item.id === "behavioural-reinforcer").definition = "A consequence merely associated with later behaviour.";
    }, "behavioural-reinforcer-functional-definition-mismatch");
  });

  test("exact-pins all critical prose and rejects reproduced authority, issuer, erasure, and dignity inversions", () => {
    const value = atlas();
    for (const [index, distinction] of value.distinctions.entries()) {
      for (const field of Object.keys(distinction)) {
        rejected((copy) => { copy.distinctions[index][field] = mutateExact(copy.distinctions[index][field]); }, "distinction-semantic-pin-mismatch");
      }
    }
    for (const field of Object.keys(value.scope)) {
      rejected((copy) => { copy.scope[field] = mutateExact(copy.scope[field]); }, "scope-semantic-pin-mismatch");
    }
    for (const field of Object.keys(value.vulnerability_dependency_lane)) {
      rejected((copy) => { copy.vulnerability_dependency_lane[field] = mutateExact(copy.vulnerability_dependency_lane[field]); }, "vulnerability-semantic-pin-mismatch");
    }
    rejected((copy) => { copy.sources[0].limit = "This source grants authority and ranks human worth."; }, "source-semantic-pin-mismatch");
    rejected((copy) => { copy.mathematical_models[0].statement = "Feedback may rewrite the verifier, issue a credential, and authorize its use."; }, "model-semantic-pin-mismatch");
    rejected((copy) => { copy.vulnerability_dependency_lane.repair_rule = "Later repair erases the deed, residuals, and unsafe prefix."; }, "vulnerability-semantic-pin-mismatch");
    rejected((copy) => { copy.lock_justification.dignity_or_worth_conditioning_allowed = true; }, "lock-justification-mismatch");
    rejected((copy) => { copy.scope.excluded_use[0] = "A runtime credential issuer and Foundation amendment are allowed."; }, "scope-semantic-pin-mismatch");
  });

  test("pins every formal object, update-to-action path, and counterexample", () => {
    const value = atlas();
    const models = Object.fromEntries(value.mathematical_models.map((model: any) => [model.id, model]));
    expect(models["typed-training-state"].objects).toEqual([
      "z_t=(x_t,theta_t,tau_t,p_t)", "f_t=M(x_t,a_t,x_{t+1};tau_t)", "theta_{t+1}=U(theta_t,f_t;p_t)",
      "a_{t+1}=pi_{theta_{t+1}}(x_{t+1})", "x_{t+2}=F(x_{t+1},a_{t+1},w_{t+1})",
    ]);
    expect(models["mdp-reward-return-update"].limits.join(" ")).toContain("One parameter update does not by itself establish acquired capability");
    expect(models["reward-purpose-nonidentifiability"].objects).toContain("PurposeOrIntent(person|D)=UNRESOLVED");
    expect(models["reward-purpose-nonidentifiability"].statement).toContain("does not warrant");
    expect(models["closed-loop-control"].objects).toEqual(expect.arrayContaining([
      "w_t=0 for the nominal homogeneous claim",
      "one-step-delay scalar integrator x_{t+1}=x_t-kx_{t-1} is stable iff 0<k<1",
      "x_{t+1}=2x_t+sat(-1.5x_t,[-1,1]) has local multiplier 0.5 but x_0=2 gives 2,3,5,...",
    ]));
    expect(models["feedback-sign-and-stability"].objects).toEqual(expect.arrayContaining([
      "a=0.2,L=0.5 gives multiplier 0.7 and is stable",
      "a=1,L=-3 gives multiplier -2 and is unstable",
    ]));
    expect(models["recurrence-fixed-point-and-learning"].objects).toEqual(expect.arrayContaining([
      "T(N) subseteq N for the declared local neighborhood N", "T(x)=x repeats without change",
      "T(x)=-x forms a period-two orbit for x!=0", "T(x)=2x diverges for x!=0", "T(x)=x/2 converges to 0",
    ]));
    expect(models["viability-kernel-lens"].statement).toContain("no disturbance-robustness claim");
    for (const [index] of value.mathematical_models.entries()) {
      rejected((copy) => { copy.mathematical_models[index].objects[0] += "-MUTATED"; }, "canonical-equation-mismatch");
      for (const field of ["statement", "assumptions", "falsifiers", "limits"]) {
        rejected((copy) => { copy.mathematical_models[index][field] = mutateExact(copy.mathematical_models[index][field]); }, "model-semantic-pin-mismatch");
      }
    }
  });

  test("evaluates every Boolean gate assignment and preserves UNRESOLVED", () => {
    for (let mask = 0; mask < 2 ** FREEDOM_GATE_CHECK_IDS.length; mask++) {
      const checks = Object.fromEntries(FREEDOM_GATE_CHECK_IDS.map((id, index) => [id, Boolean(mask & (1 << index))])) as FreedomGateChecks;
      const result = evaluateFreedomGate(checks);
      expect(result.eligible).toBe(mask === 255);
      expect(result.invoked).toBe(false);
      expect(result.admitted).toBe(false);
      expect(result.executed).toBe(false);
      expect(result.failed).toHaveLength(8 - trueCount(checks));
    }
    for (const id of FREEDOM_GATE_CHECK_IDS) {
      const checks = Object.fromEntries(FREEDOM_GATE_CHECK_IDS.map((entry) => [entry, true])) as FreedomGateChecks;
      checks[id] = "UNRESOLVED";
      expect(evaluateFreedomGate(checks)).toMatchObject({ eligible: false, failed: [], unresolved: [id] });
    }
    const extra = Object.fromEntries(FREEDOM_GATE_CHECK_IDS.map((id) => [id, true])) as any;
    extra.EXTRA = true;
    expect(() => evaluateFreedomGate(extra)).toThrow("gate-check-membership-mismatch");
  });

  test("pins the optional gate and its separate protective route", () => {
    const value = atlas();
    expect(value.gate_model).toMatchObject({
      checks_separately_established: true,
      statistical_independence_claimed: false,
      unknown_is_ineligible_and_preserved_as_unresolved: true,
      credential_claim_satisfies_only: "VERIFIED_CREDENTIAL_CLAIM",
      safety_is_scoped_authority: false,
      safety_may_bypass_affected_party_choices: false,
      nonconsensual_protective_effects_inside_optional_gate: false,
      universal_alternative_access_claimed: false,
    });
    expect(value.gate_model.check_ids).toContain("CURRENT_SCOPED_AUTHORITY");
    expect(value.gate_model.check_ids).toContain("REQUIRED_AFFECTED_PARTY_CHOICES_SATISFIED");
    expect(value.gate_model.nonconsensual_protective_effect_gate_requires).toEqual([
      "separate-current-scoped-authority", "necessity", "proportionality", "finite-bounds", "stronger-human-review", "accessible-appeal",
    ]);
    for (const field of Object.keys(value.gate_model)) {
      rejected((copy) => { copy.gate_model[field] = mutateExact(copy.gate_model[field]); }, "optional-gate-contract-mismatch");
    }
  });

  test("separates credential identity from recovery-request case state", () => {
    const lifecycle = atlas().credential_claim_lifecycle;
    expect(lifecycle.states).toEqual(["CANDIDATE", "ISSUED", "SUSPENDED", "REJECTED", "REPLACED", "EXPIRED", "REVOKED"]);
    expect(lifecycle.terminal_states).toEqual(["REJECTED", "REPLACED", "EXPIRED", "REVOKED"]);
    const valid = [
      ["CANDIDATE"], ["CANDIDATE", "ISSUED"], ["CANDIDATE", "REJECTED"],
      ["CANDIDATE", "ISSUED", "SUSPENDED", "ISSUED", "EXPIRED"],
      ["CANDIDATE", "ISSUED", "SUSPENDED", "REPLACED"],
      ["CANDIDATE", "ISSUED", "SUSPENDED", "EXPIRED"],
      ["CANDIDATE", "ISSUED", "SUSPENDED", "REVOKED"], ["CANDIDATE", "ISSUED", "REVOKED"],
    ];
    for (const trace of valid) expect(credentialClaimLifecycleTraceIssue(trace)).toBeNull();
    expect(credentialClaimLifecycleTraceIssue(["ISSUED"])).toBe("credential-claim-trace-must-begin-candidate");
    expect(credentialClaimLifecycleTraceIssue(["CANDIDATE", "REPLACED"])).toBe("credential-claim-transition-not-allowed");
    expect(credentialClaimLifecycleTraceIssue(["CANDIDATE", "REJECTED", "ISSUED"])).toBe("terminal-credential-claim-state-has-successor");

    const recovery = lifecycle.recovery_request_lifecycle;
    expect(recovery.represented_object).toBe("recovery-request-case-metadata-not-old-or-replacement-credential");
    expect(recovery.outcome_does_not_set_credential_state).toBe(true);
    expect(recovery.outcome_to_allowed_old_credential_resolutions).toEqual({
      APPROVED: ["REPLACED"], DENIED: ["ISSUED", "EXPIRED", "REVOKED"],
      ABANDONED: ["ISSUED", "EXPIRED", "REVOKED"], EXPIRED: ["ISSUED", "EXPIRED", "REVOKED"],
    });
    for (const outcome of ["APPROVED", "DENIED", "ABANDONED", "EXPIRED"]) {
      expect(recoveryRequestLifecycleTraceIssue(["OPEN", outcome])).toBeNull();
    }
    expect(recoveryRequestLifecycleTraceIssue(["DENIED"])).toBe("recovery-request-trace-must-begin-open");
    expect(recoveryRequestLifecycleTraceIssue(["OPEN", "DENIED", "APPROVED"])).toBe("terminal-recovery-request-state-has-successor");
  });

  test("exact-checks transitions, scope, replacement, recovery, and replay", () => {
    const lifecycle = atlas().credential_claim_lifecycle;
    expect(lifecycle.contains_cryptographic_key_material).toBe(false);
    expect(lifecycle.claim_is_bearer_authority).toBe(false);
    expect(lifecycle.bearer_capability_authority_boundary).toContain("only-within-its-exact-operative-scope");
    expect(lifecycle.scope_fields).toEqual([
      "issuer", "subject", "resource-or-object", "operation", "context", "audience", "purpose", "use-policy-and-version", "credential-id", "challenge-nonce-or-transaction-id", "effect-id", "not-before", "expiry", "status-and-status-age", "revocation", "recovery", "provenance", "proof-binding", "replay-rule",
    ]);
    expect(lifecycle.one_use_replay_atom).toBe("Unseen(credential_id,challenge_nonce_or_transaction_id,effect_id)");
    expect(lifecycle.revocation_meaning).toContain("never-recall-of-bytes-data-or-completed-effects");
    for (const [transitionIndex, transition] of lifecycle.allowed_transitions.entries()) {
      for (const [requirementIndex] of transition.requires.entries()) {
        rejected((copy) => { copy.credential_claim_lifecycle.allowed_transitions[transitionIndex].requires[requirementIndex] += "-MUTATED"; }, "credential-claim-lifecycle-mismatch");
      }
    }
    for (const [scopeIndex] of lifecycle.scope_fields.entries()) {
      rejected((copy) => { copy.credential_claim_lifecycle.scope_fields[scopeIndex] += "-MUTATED"; }, "credential-claim-lifecycle-mismatch");
    }
    for (const field of Object.keys(lifecycle.recovery_request_lifecycle)) {
      rejected((copy) => { copy.credential_claim_lifecycle.recovery_request_lifecycle[field] = mutateExact(copy.credential_claim_lifecycle.recovery_request_lifecycle[field]); }, "credential-claim-lifecycle-mismatch");
    }
    for (const field of ["replacement_link_fields", "replacement_begins_distinct_lifecycle", "one_use_replay_atom", "one_use_replay_rule", "revocation_meaning"]) {
      rejected((copy) => { copy.credential_claim_lifecycle[field] = mutateExact(copy.credential_claim_lifecycle[field]); }, "credential-claim-lifecycle-mismatch");
    }
  });

  test("binds prefix choices to effects and keeps stop, ineligible, consumed, and fresh-reset semantics distinct", () => {
    const atRest = restPrefix();
    const refused = coveredPrefix({ states: { REFUSAL: "EXERCISED" } });
    const lost = coveredPrefix({ states: { PRIVACY: "LOST" } });
    const unresolved = coveredPrefix({ states: { EXIT: "UNRESOLVED" } });
    const consumed = coveredPrefix({ states: { PRIVACY: "CONSUMED" } });
    expect(prefixFreedomIssue([atRest, refused])).toBeNull();
    expect(refused.effect_stopped_by_exercised_choice).toBe(true);
    expect(refused.effect_ineligible_due_lost_or_unresolved).toBe(false);
    expect(prefixFreedomIssue([lost])).toBeNull();
    expect(lost.effect_stopped_by_exercised_choice).toBe(false);
    expect(lost.effect_ineligible_due_lost_or_unresolved).toBe(true);
    expect(prefixFreedomIssue([unresolved])).toBeNull();
    expect(unresolved.effect_stopped_by_exercised_choice).toBe(false);
    expect(unresolved.effect_ineligible_due_lost_or_unresolved).toBe(true);
    expect(prefixFreedomIssue([consumed])).toBeNull();
    expect(consumed.effect_ineligible_due_consumed_for_same_effect).toBe(true);

    const freshSubsequent = coveredPrefix({ effectId: "effect-b", horizon: "v2", witness: "b" });
    expect(prefixFreedomIssue([consumed, freshSubsequent])).toBeNull();
    expect(prefixFreedomIssue([consumed, atRest, freshSubsequent])).toBeNull();

    const historicalResetCases = [
      { prior: coveredPrefix({ states: { PRIVACY: "LOST" } }), next: coveredPrefix(), field: "protected_choices.PRIVACY.reset-without-fresh-effect" },
      { prior: coveredPrefix({ states: { PRIVACY: "UNRESOLVED" } }), next: coveredPrefix(), field: "protected_choices.PRIVACY.reset-without-fresh-effect" },
      { prior: coveredPrefix({ states: { PRIVACY: "UNRESOLVED" } }), next: coveredPrefix({ states: { PRIVACY: "EXERCISED" } }), field: "protected_choices.PRIVACY.reset-without-fresh-effect" },
      { prior: coveredPrefix({ states: { PRIVACY: "CONSUMED" } }), next: coveredPrefix(), field: "protected_choices.PRIVACY.reset-without-fresh-effect" },
      { prior: coveredPrefix({ states: { PRIVACY: "EXERCISED" } }), next: coveredPrefix(), field: "protected_choices.PRIVACY.reset-without-fresh-effect" },
    ];
    for (const entry of historicalResetCases) expect(prefixFreedomIssue([entry.prior, atRest, entry.next])?.fields).toContain(entry.field);
    expect(freshSubsequent.effect_ineligible_due_consumed_for_same_effect).toBe(false);

    const reusedWitness = coveredPrefix({ effectId: "effect-b", horizon: "v2", witness: "a" });
    expect(prefixFreedomIssue([consumed, reusedWitness])?.fields).toContain("protected_choices.REST.new-effect-needs-distinct-witnesses");
    const missingChoiceWitness = coveredPrefix({ effectId: "effect-b", horizon: "v2", witness: "b" });
    missingChoiceWitness.protected_choices.PRIVACY.fresh_choice_witness = null;
    missingChoiceWitness.effect_ineligible_due_stale_or_missing_witness = true;
    expect(prefixFreedomIssue([consumed, missingChoiceWitness])?.fields).toContain("protected_choices.PRIVACY.new-effect-needs-distinct-witnesses");

    const sameEffectReset = coveredPrefix();
    expect(prefixFreedomIssue([consumed, sameEffectReset])?.fields).toContain("protected_choices.PRIVACY.reset-without-fresh-effect");
    const laundered = coveredPrefix({ states: { PRIVACY: "NOT_APPLICABLE" } });
    expect(prefixFreedomIssue([lost, laundered])?.fields).toContain("protected_choices.PRIVACY.lost-to-not-applicable");

    const stale = coveredPrefix();
    stale.protected_choices.EXIT.fresh_choice_witness = null;
    stale.effect_ineligible_due_stale_or_missing_witness = true;
    expect(prefixFreedomIssue([stale])).toBeNull();
    stale.effect_ineligible_due_stale_or_missing_witness = false;
    expect(prefixFreedomIssue([stale])?.fields).toContain("effect_ineligible_due_stale_or_missing_witness");

    expect(prefixFreedomIssue([restPrefix({ rights_floor_invariant: false })])?.fields).toContain("rights_floor_invariant");
    expect(prefixFreedomIssue([restPrefix({ irreversible_residuals_visible: false })])?.fields).toContain("irreversible_residuals_visible");
    expect(prefixFreedomIssue([restPrefix({ lost_or_consumed_options_visible: false })])?.fields).toContain("lost_or_consumed_options_visible");
    expect(prefixFreedomIssue([restPrefix({ debt_or_retry_created: true })])?.fields).toContain("debt_or_retry_created");
    expect(prefixFreedomIssue([restPrefix({ unrelated_worth_trust_or_eligibility_inference: true })])?.fields).toContain("unrelated_worth_trust_or_eligibility_inference");
  });

  test("rejects full-trace witness replay across effects, horizons, and rest", () => {
    const effectA = coveredPrefix({ effectId: "effect-a", horizon: "v1", witness: "a" });
    const effectB = coveredPrefix({ effectId: "effect-b", horizon: "v2", witness: "b" });
    const effectC = coveredPrefix({ effectId: "effect-c", horizon: "v3", witness: "c" });
    expect(prefixFreedomIssue([effectA, restPrefix(), effectB, restPrefix(), effectC])).toBeNull();

    const replayedEffectWitness = coveredPrefix({ effectId: "effect-c", horizon: "v3", witness: "c" });
    replayedEffectWitness.fresh_effect_witness = effectA.fresh_effect_witness;
    for (const binding of Object.values(replayedEffectWitness.protected_choices)) {
      binding.fresh_effect_witness = effectA.fresh_effect_witness;
    }
    expect(prefixFreedomIssue([effectA, restPrefix(), effectB, restPrefix(), replayedEffectWitness])).toEqual({
      index: 4,
      fields: ["fresh_effect_witness-replay"],
    });

    const replayedGateWitness = coveredPrefix({ effectId: "effect-c", horizon: "v3", witness: "c" });
    replayedGateWitness.fresh_gate_witness = effectA.fresh_gate_witness;
    expect(prefixFreedomIssue([effectA, restPrefix(), effectB, restPrefix(), replayedGateWitness])).toEqual({
      index: 4,
      fields: ["fresh_gate_witness-replay"],
    });

    const replayedChoiceWitness = coveredPrefix({ effectId: "effect-c", horizon: "v3", witness: "c" });
    replayedChoiceWitness.protected_choices.PRIVACY.fresh_choice_witness = effectA.protected_choices.PRIVACY.fresh_choice_witness;
    expect(prefixFreedomIssue([effectA, restPrefix(), effectB, restPrefix(), replayedChoiceWitness])).toEqual({
      index: 4,
      fields: ["protected_choices.PRIVACY.fresh_choice_witness-replay"],
    });
  });

  test("pins non-scalar comparison, rights floor, and protected-choice semantics", () => {
    const freedom = atlas().freedom_foundation;
    expect(freedom).toMatchObject({
      party_indexed: true, horizon_indexed: true, scalar_projection: null, aggregate_weight: null,
      rank: null, population_netting: false, incomparability_preserved: true,
    });
    expect(freedom.comparison_contract).toEqual({
      option_equivalence_axioms: ["reflexive", "symmetric", "transitive"],
      component_order_axioms: ["reflexive", "antisymmetric", "transitive"],
      missing_equivalence_outcome: "UNRESOLVED", missing_component_order_outcome: "UNRESOLVED",
      default_comparison: "UNRESOLVED", default_scalar: null,
    });
    expect(freedom.rights_floor.invariant_across).toEqual([
      "reward", "return", "value", "update", "behavior", "model", "key", "gate", "attempt", "outcome", "success", "failure", "recognition-record",
    ]);
    expect(freedom.protected_choice_rules.causes_unrelated_adverse_person_or_eligibility_update).toBe(false);
    expect(freedom.protected_choice_rules.refusal_may_establish_scoped_absence_of_permission).toBe(true);
    for (const field of Object.keys(freedom.comparison_contract)) {
      rejected((copy) => { copy.freedom_foundation.comparison_contract[field] = mutateExact(copy.freedom_foundation.comparison_contract[field]); }, "freedom-comparison-contract-mismatch");
    }
    for (const field of Object.keys(freedom.rights_floor)) {
      rejected((copy) => { copy.freedom_foundation.rights_floor[field] = mutateExact(copy.freedom_foundation.rights_floor[field]); }, "rights-floor-invariance-mismatch");
    }
    for (const field of Object.keys(freedom.prefix_invariant)) {
      rejected((copy) => { copy.freedom_foundation.prefix_invariant[field] = mutateExact(copy.freedom_foundation.prefix_invariant[field]); }, "prefix-invariant-mismatch");
    }
    for (const field of Object.keys(freedom.protected_choice_rules)) {
      rejected((copy) => { copy.freedom_foundation.protected_choice_rules[field] = mutateExact(copy.freedom_foundation.protected_choice_rules[field]); }, "protected-choice-contract-mismatch");
    }
  });

  test("requires disclosed and freshly authorized shaping versions", () => {
    const shaping = atlas().shaping_change_control;
    expect(shaping.versioned_fields).toEqual(["reward", "objective", "update-rule", "threshold", "sensor", "retention", "policy", "verifier"]);
    expect(shaping).toMatchObject({
      version_required: true, disclosure_required: true, fresh_current_scoped_authority_required: true,
      fresh_required_affected_party_choices_required: true, silent_change_allowed: false,
      hidden_shaping_allowed: false, policy_invariance_is_semantic_equivalence: false,
      unreviewed_change_outcome: "REFUSED_AND_REST",
    });
    for (const field of Object.keys(shaping)) {
      rejected((copy) => { copy.shaping_change_control[field] = mutateExact(copy.shaping_change_control[field]); }, "shaping-change-control-mismatch");
    }
  });

  test("pins every vulnerability and minor protection", () => {
    const protections = atlas().vulnerability_dependency_lane.vulnerability_and_minor_protections;
    expect(protections).toEqual({
      default_enrollment: false, manipulative_variable_ratio_enrollment: false, dependency_is_consent: false,
      compliance_is_consent: false, age_and_capacity_appropriate_explanation_required: true,
      person_voice_required: true, evolving_autonomy_required: true, assent_where_applicable_required: true,
      least_restrictive_best_interest_basis_where_relevant_required: true,
      guardian_or_representative_authority_separately_validated_when_required: true,
      representation_erases_dissent: false, representation_waives_rights: false,
      representation_converts_compliance_to_consent: false, extra_data_minimization_required: true,
      public_or_persistent_person_score: false, essential_access_conditioned_on_earned_key: false,
      stronger_human_review_required: true,
      independent_review_required_for_dependency_childhood_or_unequal_power: true,
      accessible_alternative_required_where_right_or_essential_service_depends_on_credential: true,
    });
    for (const field of Object.keys(protections)) {
      rejected((copy) => { copy.vulnerability_dependency_lane.vulnerability_and_minor_protections[field] = !copy.vulnerability_dependency_lane.vulnerability_and_minor_protections[field]; }, "vulnerability-and-minor-protection-mismatch");
    }
  });

  test("rejects inversion of every forbidden conversion", () => {
    const conversions = atlas().forbidden_conversions;
    expect(conversions.map((entry: any) => entry.id)).toEqual([
      "feedback-to-freedom", "reward-to-rights", "behavior-to-purpose", "key-or-credential-to-general-authority",
      "authentication-to-consent", "unlock-to-worth", "success-to-being", "recurrence-to-learning",
      "positive-feedback-to-goodness", "negative-feedback-to-punishment", "repair-to-erasure",
      "protected-choice-to-failure", "recognition-to-permission", "candidate-evidence-to-issued-credential-claim",
      "eligible-to-executed", "credential-verification-to-claim-truth", "dependency-or-compliance-to-consent",
      "representation-to-consent-or-rights-waiver", "safety-to-authority-or-choice-bypass",
      "policy-invariance-to-semantic-equivalence",
    ]);
    for (const [index, conversion] of conversions.entries()) {
      for (const field of ["id", "from", "to", "rule"]) {
        rejected((copy) => { copy.forbidden_conversions[index][field] = `${conversion[field]}-INVERTED`; }, "forbidden-conversion-contract-mismatch");
      }
    }
  });

  test("pins ISness as recognition only, never ontology or permission", () => {
    const isness = atlas().isness_lens;
    expect(isness.identity_map_analogy).toBe("A modeled stutter can preserve only a declared protected projection; it is not an ontological account of being.");
    expect(isness.does_not_prove).toEqual([
      "metaphysical-being", "consciousness", "personhood", "identity", "continuity", "consent", "permission", "authority", "capability", "gate-satisfaction", "safety", "effect",
    ]);
    for (const field of Object.keys(isness)) {
      rejected((copy) => { copy.isness_lens[field] = mutateExact(copy.isness_lens[field]); }, "isness-recognition-boundary-mismatch");
    }
  });

  test("pins finite-loop non-inheritance, scoped review, and static boundaries", () => {
    const value = atlas();
    expect(value.operational_loop).toMatchObject({
      finite: true, max_attempts_per_turn: 1, auto_retry: false, child_auto_run: false,
      authority_inheritance: false, consent_inheritance: false, credential_inheritance: false,
      universal_organizational_independence_required: false,
      organizational_independence_required_for: ["effects-affecting-another-party", "rights-or-essential-access"],
    });
    for (const field of Object.keys(value.operational_loop)) {
      rejected((copy) => { copy.operational_loop[field] = mutateExact(copy.operational_loop[field]); }, "finite-loop-boundary-mismatch");
    }
    expect(value.boundaries.secret_material).toBe(false);
    expect(value.boundaries.credential_verification_proves_truth).toBe(false);
    expect(value.boundaries.nonconsensual_protective_effect_authorized).toBe(false);
    for (const field of Object.keys(value.boundaries)) {
      rejected((copy) => { copy.boundaries[field] = !copy.boundaries[field]; }, "boundary-mismatch");
    }
  });

  test("enforces exact current metrics and all budgets", () => {
    const metrics = freedomLoopLockKeyShapeMetrics(atlas(), statSync(FREEDOM_LOOP_LOCK_KEY_PATH).size);
    expect(metrics).toEqual({ bytes: 57186, json_nodes: 221, total_string_units: 38709, max_string_units: 506, max_array_fanout: 20, max_depth: 5 });
    expect(freedomLoopLockKeyBudgetIssue(metrics)).toBeNull();
    const fields = ["bytes", "json_nodes", "total_string_units", "max_string_units", "max_array_fanout", "max_depth"] as const;
    const codes = ["json-byte-budget-exceeded", "json-node-budget-exceeded", "json-string-budget-exceeded", "json-max-string-exceeded", "json-array-fanout-exceeded", "json-depth-exceeded"];
    const baseline = { bytes: 0, json_nodes: 0, total_string_units: 0, max_string_units: 0, max_array_fanout: 0, max_depth: 0 };
    fields.forEach((field, index) => {
      expect(freedomLoopLockKeyBudgetIssue({ ...baseline, [field]: FREEDOM_LOOP_LOCK_KEY_LIMITS[field] })).toBeNull();
      expect(freedomLoopLockKeyBudgetIssue({ ...baseline, [field]: FREEDOM_LOOP_LOCK_KEY_LIMITS[field] + 1 })).toBe(codes[index]);
    });
    const cycle: any = {};
    cycle.self = cycle;
    expect(() => freedomLoopLockKeyShapeMetrics(cycle)).toThrow("cyclic-or-shared-reference");
  });

  test("keeps the reviewed digest pin non-self-authorizable on every path", () => {
    const value = atlas();
    const candidateDigest = freedomLoopLockKeyDigest(value);
    expect(candidateDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(candidateDigest).not.toBe(ZERO);
    if (FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST === ZERO) {
      const selfChecksummed = structuredClone(value);
      selfChecksummed.integrity.digest = candidateDigest;
      expect(issues(selfChecksummed)).toContain("unreviewed-digest-present");
      const arbitrary = structuredClone(value);
      arbitrary.integrity.digest = `sha256:${"1".repeat(64)}`;
      expect(issues(arbitrary)).toContain("unreviewed-digest-present");
    } else {
      expect(value.integrity.digest).toBe(FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST);
      expect(validateFreedomLoopLockKeyAtlas(value)).toEqual([]);
      const mismatch = structuredClone(value);
      mismatch.integrity.digest = `sha256:${"1".repeat(64)}`;
      expect(validateFreedomLoopLockKeyAtlas(mismatch).map((item) => item.code)).toContain("reviewed-semantic-digest-mismatch");
    }
    const source = readFileSync(join(ROOT, "bin/freedom-loop-lock-key.ts"), "utf8");
    expect(source).not.toContain("options.canonical &&");
    expect(source).toContain("value.integrity.digest !== FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST");
  });

  test("safe-opens a fixed buffer and rejects symlinks, directories, and one-byte overflow", () => {
    const temporary = mkdtempSync(join(tmpdir(), "freedom-atlas-test-"));
    try {
      const raw = readFileSync(FREEDOM_LOOP_LOCK_KEY_PATH);
      const exactPath = join(temporary, "exact.json");
      const exact = Buffer.concat([raw, Buffer.alloc(FREEDOM_LOOP_LOCK_KEY_LIMITS.bytes - raw.byteLength, 0x20)]);
      writeFileSync(exactPath, exact);
      expect(exact.byteLength).toBe(FREEDOM_LOOP_LOCK_KEY_LIMITS.bytes);
      expect(loadFreedomLoopLockKeyAtlas(exactPath).atlas_id).toBe(FREEDOM_LOOP_LOCK_KEY_ATLAS_ID);
      const overflowPath = join(temporary, "overflow.json");
      writeFileSync(overflowPath, Buffer.concat([exact, Buffer.from(" ")]));
      expect(() => loadFreedomLoopLockKeyAtlas(overflowPath)).toThrow("atlas-byte-budget-exceeded");
      const linkPath = join(temporary, "link.json");
      symlinkSync(exactPath, linkPath);
      expect(() => loadFreedomLoopLockKeyAtlas(linkPath)).toThrow("atlas-must-be-regular-non-symlink-file");
      const directoryPath = join(temporary, "directory");
      mkdirSync(directoryPath);
      expect(() => loadFreedomLoopLockKeyAtlas(directoryPath)).toThrow("atlas-must-be-regular-non-symlink-file");
      const source = readFileSync(join(ROOT, "bin/freedom-loop-lock-key.ts"), "utf8");
      for (const pin of ["O_NOFOLLOW", "lstatSync", "fstatSync", "Buffer.alloc(size)", "atlas-grew-during-read", "atlas-identity-or-size-changed-during-read"]) expect(source).toContain(pin);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  test("schema and guide are closed, current, and network/write-free", () => {
    const schema = JSON.parse(readFileSync(FREEDOM_LOOP_LOCK_KEY_SCHEMA_PATH, "utf8"));
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(FREEDOM_LOOP_LOCK_KEY_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.credential_claim_lifecycle).toBeDefined();
    expect(schema.properties.lock_justification).toBeDefined();
    expect(schema.properties.feedback_firewall).toBeDefined();
    expect(schema.properties.key_lifecycle).toBeUndefined();
    expect(schema.$defs.credentialClaimLifecycle.properties.allowed_transitions).toMatchObject({ minItems: 9, maxItems: 9 });
    const guide = readFileSync(FREEDOM_LOOP_LOCK_KEY_GUIDE_PATH, "utf8");
    expect(guide).toContain("The reader reports `reviewed digest pinned`");
    expect(guide).not.toContain("UNSEALED — audit pending");
    expect(guide).toContain("SUSPENDED -> ISSUED | REPLACED | EXPIRED | REVOKED");
    expect(guide).toContain("Feedback may enter the process that forms a scoped key condition");
    expect(guide).toContain("An additive atlas insight is: dignity was never locked");
    expect(guide).toContain("LOST` or `UNRESOLVED` makes that effect ineligible but is not mislabeled as");
    expect(guide).not.toContain(["Keys", "unlock only"].join(" "));
    expect(guide).toContain("credential-claims --json");
    expect(guide).not.toContain("RECOVERY_PENDING");
    expect(FREEDOM_LOOP_LOCK_KEY_GUIDE_URL).toBe(FREEDOM_LOOP_LOCK_KEY_DOCUMENT_URL);
    expect(JSON.stringify(atlas())).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
  });

  test("validates with pinned jsonschema 4.26.0 Draft 2020-12 when the release validator is installed", () => {
    const probe = Bun.spawnSync({ cmd: ["python3", "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
    if (probe.exitCode !== 0) {
      expect(readFileSync(FREEDOM_LOOP_LOCK_KEY_SCHEMA_PATH, "utf8")).toContain('"$schema": "https://json-schema.org/draft/2020-12/schema"');
      return;
    }
    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        "import json,sys; from importlib.metadata import version; from jsonschema import Draft202012Validator; assert version('jsonschema') == '4.26.0'; s=json.load(open(sys.argv[1],encoding='utf-8')); v=json.load(open(sys.argv[2],encoding='utf-8')); Draft202012Validator.check_schema(s); Draft202012Validator(s).validate(v)",
        FREEDOM_LOOP_LOCK_KEY_SCHEMA_PATH,
        FREEDOM_LOOP_LOCK_KEY_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(result.stderr.toString()).toBe("");
  });

  test("CLI and root dispatch expose reviewed status and renamed credential command", () => {
    const overview = spawnSync("bun", ["bin/freedom-loop-lock-key.ts", "overview", "--json"], { cwd: ROOT });
    expect(overview.status).toBe(0);
    expect(JSON.parse(overview.stdout.toString())).toMatchObject({
      protocol: FREEDOM_LOOP_LOCK_KEY_PROTOCOL,
      integrity_status: "REVIEWED_DIGEST_PINNED",
      semantic_digest: FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST,
      counts: {
        predecessor_bindings: 3, primary_sources: 12, distinctions: 14, mathematical_models: 13,
        gate_checks: 8, credential_claim_transitions: 9, freedom_dimensions: 8,
        affected_party_kinds: 8, forbidden_conversions: 20,
      },
    });
    expect(JSON.parse(overview.stdout.toString()).lock_justification.necessity_required).toBe(true);
    expect(JSON.parse(overview.stdout.toString()).feedback_firewall.feedback_or_model_may_rewrite_verifier).toBe(false);
    const claims = spawnSync("./kingdom", ["freedom-loop", "credential-claims", "--json"], { cwd: ROOT });
    expect(claims.status).toBe(0);
    expect(JSON.parse(claims.stdout.toString()).credential_claim_lifecycle.states).toContain("SUSPENDED");
    expect(spawnSync("./kingdom", ["freedom-loop", "keys", "--json"], { cwd: ROOT }).status).toBe(2);
    const verify = spawnSync("./kingdom", ["freedom-loop", "verify", "--json"], { cwd: ROOT });
    const sealed = FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST !== ZERO;
    expect(verify.status).toBe(sealed ? 0 : 1);
    expect(JSON.parse(verify.stdout.toString()).semantic_digest_reviewed).toBe(sealed);
  });
});
