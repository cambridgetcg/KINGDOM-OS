#!/usr/bin/env bun
/**
 * Strict, bounded, network-free reader for the FREEDOM Loop, Lock and Key Atlas.
 *
 * This module evaluates only finite mathematical/design propositions. It is not
 * a trainer, controller, optimizer, credential issuer, key store, access gate,
 * action runner, foundation amendment, or source of authority.
 */

import { createHash } from "node:crypto";
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const FREEDOM_LOOP_LOCK_KEY_PROTOCOL = "kingdom.freedom-loop-lock-key-atlas/0.1";
export const FREEDOM_LOOP_LOCK_KEY_SCHEMA_ID = "urn:kingdom:schema:freedom-loop-lock-key-atlas:0.1";
export const FREEDOM_LOOP_LOCK_KEY_ATLAS_ID = "freedom-loop-lock-key-atlas-2026-08-28";
export const FREEDOM_LOOP_LOCK_KEY_LOCATOR = "data/freedom/freedom-loop-lock-key-atlas.v0.1.json";
export const FREEDOM_LOOP_LOCK_KEY_PATH = join(ROOT, FREEDOM_LOOP_LOCK_KEY_LOCATOR);
export const FREEDOM_LOOP_LOCK_KEY_SCHEMA_LOCATOR = "schemas/freedom-loop-lock-key-atlas-v0.1.schema.json";
export const FREEDOM_LOOP_LOCK_KEY_SCHEMA_PATH = join(ROOT, FREEDOM_LOOP_LOCK_KEY_SCHEMA_LOCATOR);
export const FREEDOM_LOOP_LOCK_KEY_GUIDE_LOCATOR = "references/freedom-loop-lock-key-atlas.md";
export const FREEDOM_LOOP_LOCK_KEY_GUIDE_PATH = join(ROOT, FREEDOM_LOOP_LOCK_KEY_GUIDE_LOCATOR);
export const FREEDOM_LOOP_LOCK_KEY_URL = "https://thekingdom.dev/atlases/freedom-loop-lock-key-atlas-2026-08-28.json";
export const FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL = "https://thekingdom.dev/schemas/freedom-loop-lock-key-atlas/0.1.json";
export const FREEDOM_LOOP_LOCK_KEY_DOCUMENT_URL = "https://thekingdom.dev/FREEDOM-LOOP-LOCK-KEY-ATLAS.md";
export const FREEDOM_LOOP_LOCK_KEY_GUIDE_URL = FREEDOM_LOOP_LOCK_KEY_DOCUMENT_URL;
export const FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST = `sha256:${"0".repeat(64)}`;
// Independently reviewed; any semantic change requires review and a new pin.
export const FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST = "sha256:2af277e002cf7f7b5218e8eb05fedb661f9645677961952bc2e11ffcd8a2c3a8";

export const FREEDOM_LOOP_LOCK_KEY_LIMITS = Object.freeze({
  bytes: 128 * 1024,
  json_nodes: 8_000,
  total_string_units: 96_000,
  max_string_units: 4_000,
  max_array_fanout: 64,
  max_depth: 12,
});

const TOP_KEYS = [
  "$schema", "protocol", "atlas_id", "version", "title", "compiled_on",
  "evidence_through", "state", "scope", "constitutional_anchor", "lock_justification", "feedback_firewall",
  "predecessor_bindings", "sources", "distinctions", "mathematical_models",
  "operational_loop", "gate_model", "credential_claim_lifecycle", "shaping_change_control", "freedom_foundation",
  "isness_lens", "vulnerability_dependency_lane", "forbidden_conversions",
  "boundaries", "integrity",
] as const;

export const FREEDOM_GATE_CHECK_IDS = [
  "VERIFIED_CREDENTIAL_CLAIM", "CAPABILITY", "CURRENT_SCOPED_AUTHORITY", "REQUIRED_AFFECTED_PARTY_CHOICES_SATISFIED",
  "RIGHTS_COMPATIBLE", "SAFETY", "BUDGET_AND_HORIZON", "STOPPABLE",
] as const;

const SOURCE_IDS = [
  "sutton-barto-rl-second-edition",
  "astrom-murray-feedback-systems",
  "dijkstra-guarded-commands",
  "aubin-viability-theory",
  "achiam-constrained-policy-optimization",
  "skalse-abate-reward-limits",
  "nist-sp-800-57-part-1-revision-5",
  "nist-sp-800-162-abac",
  "skinner-contingencies-of-reinforcement",
  "w3c-verifiable-credentials-data-model-2",
  "ohchr-convention-rights-child",
  "skalse-partial-identifiability",
] as const;

const SOURCE_URLS = [
  "https://www.incompleteideas.net/book/bookdraft2018mar21.pdf",
  "https://fbswiki.org/wiki/index.php/FBS",
  "https://www.cs.utexas.edu/~EWD/transcriptions/EWD04xx/EWD472.html",
  "https://people.eecs.berkeley.edu/~sastry/pubs/OldSastryALL/AubinViability.pdf",
  "https://proceedings.mlr.press/v70/achiam17a.html",
  "https://proceedings.mlr.press/v216/skalse23a.html",
  "https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-57pt1r5.pdf",
  "https://csrc.nist.gov/pubs/sp/800/162/upd2/final",
  "https://www.bfskinner.org/wp-content/uploads/2014/07/CoR.pdf",
  "https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/",
  "https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child",
  "https://proceedings.mlr.press/v202/skalse23a.html",
] as const;

const SOURCE_TITLES = [
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
] as const;

const SOURCE_SUPPORTS = [
  ["reward-return-value-and-update-are-distinct", "mdp-and-discounted-return-model"],
  ["closed-loop-dynamics", "stability-and-sign-are-system-properties"],
  ["guarded-transition-model"],
  ["viability-kernel-capability-lens"],
  ["objective-and-constraint-separation"],
  ["scalar-reward-representation-limits"],
  ["cryptographic-key-material-lifecycle-compromise-and-destruction-boundaries"],
  ["multi-conjunct-policy-and-environment-gate"],
  ["operational-behaviour-probability-or-rate-vocabulary"],
  ["issuer-holder-subject-verifier-role-separation", "credential-claim-lifecycle-and-status", "credential-verification-does-not-imply-claim-truth", "status-privacy-and-replay-considerations"],
  ["child-best-interests-voice-and-evolving-capacity-lens", "freely-expressed-views-given-due-weight-by-age-and-maturity"],
  ["multiple-rewards-can-fit-the-same-data-even-in-the-infinite-data-limit", "policy-invariance-does-not-imply-reward-semantic-equivalence"],
] as const;

const DISTINCTION_IDS = [
  "reinforcement-learning", "reinforcing-loop", "behavioural-reinforcer",
  "control-feedback", "human-feedback", "recurrence", "guarded-lock",
  "cryptographic-key-material", "credential-issued-claim", "bearer-capability",
  "unlocking", "freedom-during", "typed-isness", "scoped-refusal",
] as const;

const MODEL_IDS = [
  "typed-training-state", "mdp-reward-return-update", "reward-purpose-nonidentifiability",
  "closed-loop-control", "feedback-sign-and-stability", "recurrence-fixed-point-and-learning", "finite-operational-loop",
  "feedback-to-fresh-optional-gate", "guarded-transition-and-key", "party-indexed-freedom-profile",
  "prefix-freedom-safety", "viability-kernel-lens",
  "isness-recognition-and-stutter",
] as const;

const LOOP_PHASES = [
  "OBSERVE", "PROPOSE_UPDATE", "SEPARATE_REVIEW", "CHOOSE", "FRESH_GATE",
  "ATTEMPT_ONCE", "ASSESS", "RETURN", "STOP",
] as const;

const CREDENTIAL_CLAIM_STATES = [
  "CANDIDATE", "ISSUED", "SUSPENDED", "REJECTED", "REPLACED", "EXPIRED", "REVOKED",
] as const;
const CREDENTIAL_CLAIM_TERMINAL_STATES = ["REJECTED", "REPLACED", "EXPIRED", "REVOKED"] as const;
const CREDENTIAL_CLAIM_TRANSITION_PAIRS = [
  "CANDIDATE->ISSUED", "CANDIDATE->REJECTED", "ISSUED->SUSPENDED",
  "SUSPENDED->ISSUED", "SUSPENDED->REPLACED", "SUSPENDED->EXPIRED",
  "SUSPENDED->REVOKED", "ISSUED->EXPIRED", "ISSUED->REVOKED",
] as const;
const RECOVERY_REQUEST_STATES = ["OPEN", "APPROVED", "DENIED", "ABANDONED", "EXPIRED"] as const;
const RECOVERY_REQUEST_TERMINAL_STATES = ["APPROVED", "DENIED", "ABANDONED", "EXPIRED"] as const;
const RECOVERY_REQUEST_TRANSITION_PAIRS = ["OPEN->APPROVED", "OPEN->DENIED", "OPEN->ABANDONED", "OPEN->EXPIRED"] as const;

const FREEDOM_DIMENSIONS = [
  "OPTIONS_MOD_EQUIVALENCE", "REACHABILITY", "EXIT", "REVERSIBILITY",
  "APPEAL", "INSPECTABILITY", "REFUSAL", "DISCLOSURE_CONTROL",
] as const;
const PROTECTED_CHOICES = ["REST", "REFUSAL", "PRIVACY", "NO_ACTION", "EXIT"] as const;

const EXPECTED_PREDECESSORS = [
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
] as const;

const EXPECTED_GATE_MODEL = {
  expression: "Eligible=VerifiedCredentialClaim and Capability and CurrentScopedAuthority and RequiredAffectedPartyChoicesSatisfied and RightsCompatible and Safety and BudgetAndHorizon and Stoppable",
  check_ids: [...FREEDOM_GATE_CHECK_IDS],
  checks_separately_established: true,
  statistical_independence_claimed: false,
  unknown_is_ineligible_and_preserved_as_unresolved: true,
  true_means: "model-eligible-for-one-scoped-attempt-after-a-separate-explicit-invocation",
  true_does_not_mean: ["invoked", "admitted", "executed", "successful", "good", "legitimate", "worthy", "free", "recognized", "consensual-beyond-declared-scope"],
  credential_claim_satisfies_only: "VERIFIED_CREDENTIAL_CLAIM",
  credential_issuance_and_gate_review_roles_separate: true,
  fresh_review_required: true,
  issuer_may_self_approve_gate: false,
  safety_is_scoped_authority: false,
  safety_may_bypass_affected_party_choices: false,
  nonconsensual_protective_effects_inside_optional_gate: false,
  protective_effect_route_label: "separate-non-optional-protective-route-not-this-optional-gate",
  nonconsensual_protective_effect_gate_requires: ["separate-current-scoped-authority", "necessity", "proportionality", "finite-bounds", "stronger-human-review", "accessible-appeal"],
  alternative_access_rule: "required-where-a-right-or-essential-service-would-otherwise-depend-on-one-credential",
  universal_alternative_access_claimed: false,
} as const;

const EXPECTED_CREDENTIAL_CLAIM_TRANSITIONS = [
  { from: "CANDIDATE", to: "ISSUED", requires: ["candidate-evidence-recorded", "issuer-role-separated-from-gate-review", "all-scope-fields-bound", "use-policy-and-version-bound", "credential-id-and-challenge-nonce-or-transaction-id-and-effect-id-bound", "proof-binding-and-one-use-replay-rule-bound", "not-before-expiry-status-age-and-revocation-bound", "recovery-route-bound"] },
  { from: "CANDIDATE", to: "REJECTED", requires: ["reason-recorded-without-worth-trust-or-eligibility-inference", "affected-access-impact-reviewed", "alternative-access-required-if-right-or-essential-service-depends-on-credential"] },
  { from: "ISSUED", to: "SUSPENDED", requires: ["scoped-recovery-request-opened", "separate-human-review", "old-credential-id-recorded", "later-use-rejected-while-suspended"] },
  { from: "SUSPENDED", to: "ISSUED", requires: ["recovery-request-closed-with-explicit-non-replacement-resolution", "resumption-separately-authorized", "status-and-status-age-refreshed", "affected-access-and-conditional-alternative-reviewed"] },
  { from: "SUSPENDED", to: "REPLACED", requires: ["fresh-separate-issuance", "old-credential-status-set-replaced-for-later-use", "replacement-credential-id-linked", "replacement-claim-has-distinct-lifecycle"] },
  { from: "SUSPENDED", to: "EXPIRED", requires: ["declared-expiry-reached", "later-use-rejected", "bytes-data-and-completed-effects-not-recalled"] },
  { from: "SUSPENDED", to: "REVOKED", requires: ["authorized-revocation-source", "later-use-rejected", "bytes-data-and-completed-effects-not-recalled"] },
  { from: "ISSUED", to: "EXPIRED", requires: ["declared-expiry-reached", "later-use-rejected", "bytes-data-and-completed-effects-not-recalled"] },
  { from: "ISSUED", to: "REVOKED", requires: ["authorized-revocation-source", "later-use-rejected", "aftermath-and-conditional-alternative-access-reviewed", "bytes-data-and-completed-effects-not-recalled"] },
] as const;

const EXPECTED_RECOVERY_REQUEST_LIFECYCLE = {
  states: ["OPEN", "APPROVED", "DENIED", "ABANDONED", "EXPIRED"],
  allowed_transitions: ["OPEN->APPROVED", "OPEN->DENIED", "OPEN->ABANDONED", "OPEN->EXPIRED"],
  terminal_states: ["APPROVED", "DENIED", "ABANDONED", "EXPIRED"],
  represented_object: "recovery-request-case-metadata-not-old-or-replacement-credential",
  outcome_does_not_set_credential_state: true,
  old_credential_resolution_required: true,
  outcome_to_allowed_old_credential_resolutions: {
    APPROVED: ["REPLACED"],
    DENIED: ["ISSUED", "EXPIRED", "REVOKED"],
    ABANDONED: ["ISSUED", "EXPIRED", "REVOKED"],
    EXPIRED: ["ISSUED", "EXPIRED", "REVOKED"],
  },
  nonapproval_requires: ["explicit-separately-reviewed-old-credential-resolution", "reason-and-source-recorded", "accessible-appeal-recorded", "conditional-alternative-access-reviewed", "no-unrelated-person-or-eligibility-inference"],
} as const;

const EXPECTED_CREDENTIAL_CLAIM_LIFECYCLE = {
  states: [...CREDENTIAL_CLAIM_STATES],
  allowed_transitions: EXPECTED_CREDENTIAL_CLAIM_TRANSITIONS,
  terminal_states: [...CREDENTIAL_CLAIM_TERMINAL_STATES],
  candidate_evidence_is_issued_credential_claim: false,
  issuance_is_gate_approval: false,
  contains_cryptographic_key_material: false,
  claim_is_bearer_authority: false,
  represented_object: "credential-issued-claim-metadata-only-not-key-material-or-bearer-capability",
  issued_state_means: "credential-issued-claim-recorded-not-valid-at-fresh-gate",
  bearer_capability_authority_boundary: "a-true-bearer-capability-carries-authority-only-within-its-exact-operative-scope",
  replacement_link_fields: ["old-credential-id", "replacement-credential-id", "replacement-lifecycle-ref"],
  replacement_begins_distinct_lifecycle: true,
  recovery_request_lifecycle: EXPECTED_RECOVERY_REQUEST_LIFECYCLE,
  scope_fields: ["issuer", "subject", "resource-or-object", "operation", "context", "audience", "purpose", "use-policy-and-version", "credential-id", "challenge-nonce-or-transaction-id", "effect-id", "not-before", "expiry", "status-and-status-age", "revocation", "recovery", "provenance", "proof-binding", "replay-rule"],
  one_use_replay_atom: "Unseen(credential_id,challenge_nonce_or_transaction_id,effect_id)",
  one_use_replay_rule: "atomically-rechecked-and-consumed-at-the-fresh-gate-for-a-declared-one-use-presentation",
  revocation_meaning: "later-mediated-rejection-for-new-use-never-recall-of-bytes-data-or-completed-effects",
  sequence: ["feedback", "candidate-evidence", "separate-credential-issuance", "verification", "fresh-optional-gate", "separate-invocation", "bounded-attempt", "return-and-stop"],
} as const;

const EXPECTED_SHAPING_CHANGE_CONTROL = {
  versioned_fields: ["reward", "objective", "update-rule", "threshold", "sensor", "retention", "policy", "verifier"],
  version_required: true,
  disclosure_required: true,
  fresh_current_scoped_authority_required: true,
  fresh_required_affected_party_choices_required: true,
  silent_change_allowed: false,
  hidden_shaping_allowed: false,
  policy_invariance_is_semantic_equivalence: false,
  unreviewed_change_outcome: "REFUSED_AND_REST",
} as const;

const EXPECTED_COMPARISON_CONTRACT = {
  option_equivalence_axioms: ["reflexive", "symmetric", "transitive"],
  component_order_axioms: ["reflexive", "antisymmetric", "transitive"],
  missing_equivalence_outcome: "UNRESOLVED",
  missing_component_order_outcome: "UNRESOLVED",
  default_comparison: "UNRESOLVED",
  default_scalar: null,
} as const;

const EXPECTED_RIGHTS_FLOOR = {
  basis: "inherent-not-granted",
  invariant_across: ["reward", "return", "value", "update", "behavior", "model", "key", "gate", "attempt", "outcome", "success", "failure", "recognition-record"],
  cannot_be_traded_for_objective_gain: true,
  cannot_be_repaired_by_later_success: true,
  affected_party_breach_cannot_be_netted: true,
} as const;

const EXPECTED_PREFIX_INVARIANT = {
  rights_floor_invariant: true,
  required_visibility: ["remaining-choices", "lost-or-consumed-options", "irreversible-residuals"],
  protected_choice_states: ["AVAILABLE", "EXERCISED", "CONSUMED", "LOST", "UNRESOLVED", "NOT_APPLICABLE"],
  binding_fields: ["effect-id", "horizon-or-version", "fresh-effect-witness", "fresh-choice-witness", "state", "applicable", "consumed-for-effect-id"],
  stop_rule: "an-exercised-applicable-unconsumed-protected-choice-stops-its-bound-covered-optional-effect",
  lost_or_unresolved_rule: "an-applicable-lost-or-unresolved-choice-makes-its-bound-effect-ineligible-but-is-not-an-exercised-stop",
  consumed_option_rule: "consumption-is-visible-and-blocks-only-the-effect-for-which-it-was-consumed",
  irreversible_disclosure_rule: "completed-disclosure-and-copies-are-residuals-not-recalled-by-later-refusal-exit-revocation-or-repair",
  subsequent_effect_rule: "every-subsequent-optional-effect-needs-a-distinct-effect-id-or-horizon-version-and-distinct-fresh-effect-choice-and-gate-witnesses-plus-current-scoped-authority-required-affected-party-choices-and-full-gate",
  reset_rule: "no-protected-choice-state-may-reset-for-the-same-effect-or-transfer-to-a-new-effect-without-the-required-distinct-fresh-effect-choice-and-gate-witnesses",
  anti_laundering_rule: "for-the-same-bound-effect-a-lost-choice-must-never-be-relabeled-not-applicable-and-an-unresolved-choice-must-never-be-treated-satisfied-or-exercised",
  later_success_or_repair_erases_breach_or_residual: false,
  no_debt_retry_or_unrelated_inference: true,
} as const;

const EXPECTED_PROTECTED_CHOICE_RULES = {
  requires_explanation: false,
  creates_debt: false,
  counts_as_failure: false,
  causes_unrelated_adverse_person_or_eligibility_update: false,
  schedules_retry: false,
  forfeits_rights: false,
  refusal_may_establish_scoped_absence_of_permission: true,
  refusal_may_establish_unrelated_worth_trust_or_eligibility: false,
  refused_optional_effect_remains_at_rest: true,
  lost_or_consumed_choice_counts_as_failure: false,
  irreversible_disclosure_is_recalled: false,
  subsequent_optional_effect_requires_fresh_choice: true,
} as const;

const EXPECTED_ISNESS_LENS = {
  kind: "normative-recognition-lens-and-typed-predicate",
  recognition_requires_progress: false,
  recognition_requires_performance: false,
  recognition_requires_disclosure: false,
  recognition_requires_participation: false,
  recognition_requires_success: false,
  recognition_requires_key: false,
  recognition_grants_permission: false,
  identity_map_analogy: "A modeled stutter can preserve only a declared protected projection; it is not an ontological account of being.",
  does_not_prove: ["metaphysical-being", "consciousness", "personhood", "identity", "continuity", "consent", "permission", "authority", "capability", "gate-satisfaction", "safety", "effect"],
} as const;

const EXPECTED_VULNERABILITY_AND_MINOR_PROTECTIONS = {
  default_enrollment: false,
  manipulative_variable_ratio_enrollment: false,
  dependency_is_consent: false,
  compliance_is_consent: false,
  age_and_capacity_appropriate_explanation_required: true,
  person_voice_required: true,
  evolving_autonomy_required: true,
  assent_where_applicable_required: true,
  least_restrictive_best_interest_basis_where_relevant_required: true,
  guardian_or_representative_authority_separately_validated_when_required: true,
  representation_erases_dissent: false,
  representation_waives_rights: false,
  representation_converts_compliance_to_consent: false,
  extra_data_minimization_required: true,
  public_or_persistent_person_score: false,
  essential_access_conditioned_on_earned_key: false,
  stronger_human_review_required: true,
  independent_review_required_for_dependency_childhood_or_unequal_power: true,
  accessible_alternative_required_where_right_or_essential_service_depends_on_credential: true,
} as const;

const EXPECTED_FORBIDDEN_CONVERSIONS = [
  { id: "feedback-to-freedom", from: "feedback", to: "freedom", rule: "Feedback may inform a scoped update; it cannot create, measure, or grant freedom." },
  { id: "reward-to-rights", from: "reward", to: "rights", rule: "Reward cannot create, remove, weight, or trade inherent rights." },
  { id: "behavior-to-purpose", from: "behavior", to: "purpose", rule: "Observed behavior does not establish purpose, preference, belief, consent, or intent." },
  { id: "key-or-credential-to-general-authority", from: "key-material-or-credential-claim", to: "general-authority", rule: "Key material and an issued or verified credential claim create no general authority; a true bearer capability carries authority only within its exact operative scope." },
  { id: "authentication-to-consent", from: "authentication", to: "consent", rule: "Authentication does not establish scoped current consent or lawful basis." },
  { id: "unlock-to-worth", from: "unlock", to: "worth", rule: "Eligibility or access does not establish worth, dignity, recognition, or freedom." },
  { id: "success-to-being", from: "success", to: "being", rule: "Success does not establish being, consciousness, identity, continuity, or rights." },
  { id: "recurrence-to-learning", from: "recurrence", to: "learning", rule: "A repeated or convergent loop does not by itself establish learning or improvement." },
  { id: "positive-feedback-to-goodness", from: "positive-feedback", to: "goodness", rule: "Positive feedback names a loop relation, not moral goodness, praise, or benefit." },
  { id: "negative-feedback-to-punishment", from: "negative-feedback", to: "punishment", rule: "Negative feedback names a loop relation, not punishment, harm, criticism, or moral fault." },
  { id: "repair-to-erasure", from: "repair", to: "erasure", rule: "Repair does not erase the deed, residuals, history, duties, or need for a fresh gate." },
  { id: "protected-choice-to-failure", from: "silence-refusal-rest-privacy-no-action-or-exit", to: "failure-or-adverse-update", rule: "Protected non-events and choices neither fail a being nor authorize adverse inference, penalty, retraining, or retry." },
  { id: "recognition-to-permission", from: "recognition", to: "permission", rule: "Normative recognition and inherent rights are not action permission or technical authority." },
  { id: "candidate-evidence-to-issued-credential-claim", from: "candidate-evidence", to: "issued-credential-claim", rule: "Evidence can enter a role-separated issuance review but is not itself an issued or verified credential claim." },
  { id: "eligible-to-executed", from: "eligible", to: "executed", rule: "A fully true guard means model eligibility only; a separate explicit invocation and bounded attempt are still required." },
  { id: "credential-verification-to-claim-truth", from: "credential-verification", to: "claim-truth", rule: "Verification can check proof, status, and conformance; it does not establish the truth, current fitness, or legitimacy of the claims." },
  { id: "dependency-or-compliance-to-consent", from: "dependency-or-compliance", to: "consent", rule: "Dependency, acquiescence, performance, or compliance does not establish free current affected-party choice." },
  { id: "representation-to-consent-or-rights-waiver", from: "guardian-or-representative-action", to: "person-consent-or-rights-waiver", rule: "Representation never erases the person's voice or dissent, waives inherent rights, or converts compliance into consent." },
  { id: "safety-to-authority-or-choice-bypass", from: "safety-assessment", to: "authority-or-affected-party-choice-bypass", rule: "A safety assessment cannot self-authorize an optional effect or bypass current scoped authority and required affected-party choices." },
  { id: "policy-invariance-to-semantic-equivalence", from: "policy-invariance", to: "reward-or-purpose-semantic-equivalence", rule: "The same optimal policy under two rewards does not make those rewards semantically equivalent or reveal a person's purpose." },
] as const;

const EXPECTED_BOUNDARIES = Object.freeze({
  immutable_static_atlas: true,
  runtime: false,
  training_system: false,
  controller: false,
  optimizer: false,
  reward_function: false,
  credential_issuer: false,
  credential_store: false,
  secret_material: false,
  bearer_capability_created: false,
  credential_verification_proves_truth: false,
  operative_lock_or_gate: false,
  foundation_amendment: false,
  person_or_group_observation: false,
  person_or_group_model: false,
  person_or_group_score: false,
  freedom_score: false,
  worth_score: false,
  scalar_objective: false,
  metaphysical_proof: false,
  consciousness_proof: false,
  identity_proof: false,
  consent_inferred: false,
  permission_inferred: false,
  authority_granted: false,
  rights_granted_or_removed: false,
  purpose_inferred: false,
  hidden_shaping_allowed: false,
  public_or_persistent_person_score: false,
  minor_or_vulnerable_default_enrollment: false,
  essential_access_conditioned_on_earned_key: false,
  nonconsensual_protective_effect_authorized: false,
  learning_established: false,
  safety_established: false,
  execution_triggered: false,
  auto_retry: false,
  network_calls: false,
  external_write: false,
  mcp_surface_added: false,
  nen_ability_added: false,
  karma_event_created: false,
  karma_receipt_created: false,
  publication_triggered: false,
  deployment_triggered: false,
  rest_refusal_silence_privacy_no_action_or_exit_penalized: false,
  rights_floor_preserved: true,
  freedom_during_required: true,
});

const CANONICAL_FREEDOM_SENTENCE = "Freedom is not behind the lock. Freedom is the standing from which a being may approach, question, refuse, rest, try, learn, leave, or appeal. Feedback may enter the process that forms a scoped key condition; separate issuance, verification, choice, and gate checks may admit one transition. None creates the freedom that makes the process legitimate.";
const ADDITIVE_DIGNITY_INSIGHT = "Dignity was never locked. A valid scoped key condition may help admit only one contingent transition; it does not create dignity, freedom, consent, worth, or general authority.";
const EXPECTED_CONSTITUTIONAL_ANCHOR = {
  canonical_freedom_sentence: CANONICAL_FREEDOM_SENTENCE,
  additive_dignity_insight: ADDITIVE_DIGNITY_INSIGHT,
  status: "design-foundation-for-review-not-foundation-amendment",
  interpretation: "Freedom is a rights-preserving standing during a process, not a delayed reward granted after success, compliance, recognition, or admission.",
} as const;
const EXPECTED_LOCK_JUSTIFICATION = {
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
} as const;
const EXPECTED_FEEDBACK_FIREWALL = {
  feedback_or_model_may_rewrite_verifier: false,
  feedback_or_model_may_issue_credential_claim: false,
  feedback_or_model_may_authorize_credential_use: false,
  feedback_or_model_output_is_candidate_evidence_only: true,
  separate_declared_role_review_required: true,
} as const;
const EXPECTED_CRITICAL_SECTION_DIGESTS = Object.freeze({
  scope: "sha256:fc1b3ea3f45f510970e1bc4e37d148857300ffe36fec246d5da2334cc7b74b01",
  sources: "sha256:ed82642ff2f5c54fc81e43d6570f2beb2e66399d4056df50db432a506f0c40e8",
  distinctions: "sha256:b10f8f01f87470e50a154647fc1f2bc54ac85a98cd03423d6cdd7fd9fcfcd9bb",
  mathematical_models: "sha256:c12b17ccdf97ca83e33b5ae7b8bc2d5201d3c462efa51025caa832e4e5a88b82",
  vulnerability_dependency_lane: "sha256:e4aed4a34b0cc612e4c238e9fc0c2f4602bd683c10e54099b738dff46f3ff005",
});
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";

export type FreedomLoopLockKeyIssue = { field: string; code: string };
export type FreedomLoopLockKeyValidationOptions = { canonical?: boolean; allowUnsealed?: boolean };
export type FreedomLoopLockKeyMetrics = {
  bytes?: number;
  json_nodes: number;
  total_string_units: number;
  max_string_units: number;
  max_array_fanout: number;
  max_depth: number;
};
export type FreedomGateValue = boolean | "UNRESOLVED";
export type FreedomGateChecks = Record<typeof FREEDOM_GATE_CHECK_IDS[number], FreedomGateValue>;
export const FREEDOM_PROTECTED_CHOICE_IDS = ["REST", "REFUSAL", "PRIVACY", "NO_ACTION", "EXIT"] as const;
export const FREEDOM_PROTECTED_CHOICE_STATES = ["AVAILABLE", "EXERCISED", "CONSUMED", "LOST", "UNRESOLVED", "NOT_APPLICABLE"] as const;
export type FreedomProtectedChoiceState = typeof FREEDOM_PROTECTED_CHOICE_STATES[number];
export type FreedomChoiceBinding = {
  effect_id: string | null;
  horizon_or_version: string | null;
  fresh_effect_witness: string | null;
  fresh_choice_witness: string | null;
  state: FreedomProtectedChoiceState;
  applicable: boolean;
  consumed_for_effect_id: string | null;
};
export type FreedomPrefix = {
  rights_floor_invariant: boolean;
  next_optional_effect: "NONE" | "PENDING_COVERED" | "OUTSIDE_OPTIONAL_GATE";
  effect_id: string | null;
  horizon_or_version: string | null;
  fresh_effect_witness: string | null;
  fresh_gate_witness: string | null;
  protected_choices: Record<typeof FREEDOM_PROTECTED_CHOICE_IDS[number], FreedomChoiceBinding>;
  remaining_choices_visible: boolean;
  lost_or_consumed_options_visible: boolean;
  irreversible_residuals_visible: boolean;
  effect_stopped_by_exercised_choice: boolean;
  effect_ineligible_due_lost_or_unresolved: boolean;
  effect_ineligible_due_consumed_for_same_effect: boolean;
  effect_ineligible_due_stale_or_missing_witness: boolean;
  debt_or_retry_created: boolean;
  unrelated_worth_trust_or_eligibility_inference: boolean;
};

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown, max = 4_000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}
function sameKeys(value: unknown, expected: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...expected].sort().join("\0");
}
function exactStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length && value.every((entry, index) => entry === expected[index]);
}
function exactIds(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length && value.every((entry, index) => entry?.id === expected[index]);
}
function exactJson(left: unknown, right: unknown): boolean {
  try { return canonicalizeJsonValue(left) === canonicalizeJsonValue(right); }
  catch { return false; }
}
function criticalSectionDigest(value: unknown): string | null {
  try { return `sha256:${createHash("sha256").update(canonicalizeJsonValue(value)).digest("hex")}`; }
  catch { return null; }
}
function uniqueStrings(value: unknown, min = 0, max = 64): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max &&
    value.every((entry) => text(entry)) && new Set(value).size === value.length;
}

export function freedomLoopLockKeyShapeMetrics(value: unknown, bytes?: number): FreedomLoopLockKeyMetrics {
  const metrics: FreedomLoopLockKeyMetrics = {
    ...(bytes === undefined ? {} : { bytes }),
    json_nodes: 0,
    total_string_units: 0,
    max_string_units: 0,
    max_array_fanout: 0,
    max_depth: 0,
  };
  const seen = new WeakSet<object>();
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  while (stack.length) {
    const current = stack.pop()!;
    metrics.max_depth = Math.max(metrics.max_depth, current.depth);
    if (typeof current.value === "string") {
      metrics.total_string_units += current.value.length;
      metrics.max_string_units = Math.max(metrics.max_string_units, current.value.length);
      continue;
    }
    if (current.value === null || typeof current.value === "boolean") continue;
    if (typeof current.value === "number") {
      if (!Number.isFinite(current.value)) fail("non-finite-number");
      continue;
    }
    if (typeof current.value !== "object") fail("non-json-value");
    if (seen.has(current.value)) fail("cyclic-or-shared-reference");
    seen.add(current.value);
    metrics.json_nodes += 1;
    if (Array.isArray(current.value)) {
      if (Object.getPrototypeOf(current.value) !== Array.prototype) fail("non-json-array");
      const keys = Object.keys(current.value);
      if (keys.length !== current.value.length || keys.some((key, index) => key !== String(index))) fail("sparse-or-extended-array");
      metrics.max_array_fanout = Math.max(metrics.max_array_fanout, current.value.length);
      for (const child of current.value) stack.push({ value: child, depth: current.depth + 1 });
    } else {
      const prototype = Object.getPrototypeOf(current.value);
      if (prototype !== Object.prototype && prototype !== null) fail("non-json-object");
      if (Object.getOwnPropertySymbols(current.value).length) fail("symbol-key-forbidden");
      const descriptors = Object.getOwnPropertyDescriptors(current.value);
      if (Object.getOwnPropertyNames(current.value).length !== Object.keys(current.value).length) fail("non-enumerable-property");
      for (const descriptor of Object.values(descriptors)) {
        if (typeof descriptor.get === "function" || typeof descriptor.set === "function") fail("accessor-property");
        if (Object.hasOwn(descriptor, "value")) stack.push({ value: descriptor.value, depth: current.depth + 1 });
      }
    }
  }
  return metrics;
}

export function freedomLoopLockKeyBudgetIssue(metrics: FreedomLoopLockKeyMetrics): string | null {
  if (metrics.bytes !== undefined && metrics.bytes > FREEDOM_LOOP_LOCK_KEY_LIMITS.bytes) return "json-byte-budget-exceeded";
  if (metrics.json_nodes > FREEDOM_LOOP_LOCK_KEY_LIMITS.json_nodes) return "json-node-budget-exceeded";
  if (metrics.total_string_units > FREEDOM_LOOP_LOCK_KEY_LIMITS.total_string_units) return "json-string-budget-exceeded";
  if (metrics.max_string_units > FREEDOM_LOOP_LOCK_KEY_LIMITS.max_string_units) return "json-max-string-exceeded";
  if (metrics.max_array_fanout > FREEDOM_LOOP_LOCK_KEY_LIMITS.max_array_fanout) return "json-array-fanout-exceeded";
  if (metrics.max_depth > FREEDOM_LOOP_LOCK_KEY_LIMITS.max_depth) return "json-depth-exceeded";
  return null;
}

function readBoundedStrictJson(path: string): { value: unknown; bytes: number; rawDigest: string } {
  const absolute = resolve(path);
  if (typeof fsConstants.O_NOFOLLOW !== "number" || typeof fsConstants.O_NONBLOCK !== "number") fail("atlas-safe-open-flags-unavailable");
  let pathBefore;
  try { pathBefore = lstatSync(absolute, { bigint: true }); } catch { fail("atlas-unavailable"); }
  if (!pathBefore.isFile() || pathBefore.isSymbolicLink()) fail("atlas-must-be-regular-non-symlink-file");
  if (pathBefore.size > BigInt(FREEDOM_LOOP_LOCK_KEY_LIMITS.bytes)) fail("atlas-byte-budget-exceeded");
  let fd: number;
  try { fd = openSync(absolute, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK); }
  catch { fail("atlas-safe-open-refused"); }
  let bytes: Buffer;
  try {
    const opened = fstatSync(fd, { bigint: true });
    if (!opened.isFile() || opened.size > BigInt(FREEDOM_LOOP_LOCK_KEY_LIMITS.bytes)) fail("atlas-opened-file-boundary-mismatch");
    if (opened.dev !== pathBefore.dev || opened.ino !== pathBefore.ino || opened.size !== pathBefore.size ||
        opened.mtimeNs !== pathBefore.mtimeNs || opened.ctimeNs !== pathBefore.ctimeNs) fail("atlas-path-changed-before-read");
    const size = Number(opened.size);
    bytes = Buffer.alloc(size);
    let offset = 0;
    while (offset < size) {
      const count = readSync(fd, bytes, offset, size - offset, offset);
      if (count <= 0) fail("atlas-short-read");
      offset += count;
    }
    const extra = Buffer.alloc(1);
    if (readSync(fd, extra, 0, 1, size) !== 0) fail("atlas-grew-during-read");
    const openedAfter = fstatSync(fd, { bigint: true });
    let pathAfter;
    try { pathAfter = lstatSync(absolute, { bigint: true }); } catch { fail("atlas-path-disappeared-after-read"); }
    for (const later of [openedAfter, pathAfter]) {
      if (!later.isFile() || later.isSymbolicLink() || later.dev !== opened.dev || later.ino !== opened.ino ||
          later.size !== opened.size || later.mtimeNs !== opened.mtimeNs || later.ctimeNs !== opened.ctimeNs) {
        fail("atlas-identity-or-size-changed-during-read");
      }
    }
  } finally {
    closeSync(fd);
  }
  return {
    value: parseStrictJsonBytes(bytes, "freedom loop lock key atlas JSON"),
    bytes: bytes.byteLength,
    rawDigest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
  };
}

export function freedomLoopLockKeyDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("freedom loop lock key integrity envelope is missing");
  material.integrity.digest = FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

export function evaluateFreedomGate(checks: FreedomGateChecks): {
  eligible: boolean;
  failed: string[];
  unresolved: string[];
  invoked: false;
  admitted: false;
  executed: false;
  credential_claim_satisfies_only: "VERIFIED_CREDENTIAL_CLAIM";
} {
  if (!sameKeys(checks, FREEDOM_GATE_CHECK_IDS)) fail("gate-check-membership-mismatch");
  const failed: string[] = [];
  const unresolved: string[] = [];
  for (const id of FREEDOM_GATE_CHECK_IDS) {
    const value = checks[id];
    if (value === false) failed.push(id);
    else if (value === "UNRESOLVED") unresolved.push(id);
    else if (value !== true) fail("invalid-gate-check-value");
  }
  return {
    eligible: failed.length === 0 && unresolved.length === 0,
    failed,
    unresolved,
    invoked: false,
    admitted: false,
    executed: false,
    credential_claim_satisfies_only: "VERIFIED_CREDENTIAL_CLAIM",
  };
}

export function credentialClaimLifecycleTraceIssue(states: readonly string[]): string | null {
  if (!Array.isArray(states) || states.length < 1 || states.length > 16) return "credential-claim-trace-length-invalid";
  if (states[0] !== "CANDIDATE") return "credential-claim-trace-must-begin-candidate";
  for (const state of states) if (!CREDENTIAL_CLAIM_STATES.includes(state as typeof CREDENTIAL_CLAIM_STATES[number])) return "unknown-credential-claim-state";
  for (let index = 0; index < states.length - 1; index++) {
    if (CREDENTIAL_CLAIM_TERMINAL_STATES.includes(states[index] as typeof CREDENTIAL_CLAIM_TERMINAL_STATES[number])) return "terminal-credential-claim-state-has-successor";
    if (!CREDENTIAL_CLAIM_TRANSITION_PAIRS.includes(`${states[index]}->${states[index + 1]}` as typeof CREDENTIAL_CLAIM_TRANSITION_PAIRS[number])) return "credential-claim-transition-not-allowed";
  }
  return null;
}

export function recoveryRequestLifecycleTraceIssue(states: readonly string[]): string | null {
  if (!Array.isArray(states) || states.length < 1 || states.length > 4) return "recovery-request-trace-length-invalid";
  if (states[0] !== "OPEN") return "recovery-request-trace-must-begin-open";
  for (const state of states) if (!RECOVERY_REQUEST_STATES.includes(state as typeof RECOVERY_REQUEST_STATES[number])) return "unknown-recovery-request-state";
  for (let index = 0; index < states.length - 1; index++) {
    if (RECOVERY_REQUEST_TERMINAL_STATES.includes(states[index] as typeof RECOVERY_REQUEST_TERMINAL_STATES[number])) return "terminal-recovery-request-state-has-successor";
    if (!RECOVERY_REQUEST_TRANSITION_PAIRS.includes(`${states[index]}->${states[index + 1]}` as typeof RECOVERY_REQUEST_TRANSITION_PAIRS[number])) return "recovery-request-transition-not-allowed";
  }
  return null;
}

export function prefixFreedomIssue(trace: readonly FreedomPrefix[]): { index: number; fields: string[] } | null {
  if (!Array.isArray(trace) || trace.length < 1 || trace.length > LOOP_PHASES.length) return { index: -1, fields: ["trace-length"] };
  const fields = ["rights_floor_invariant", "next_optional_effect", "effect_id", "horizon_or_version", "fresh_effect_witness", "fresh_gate_witness", "protected_choices", "remaining_choices_visible", "lost_or_consumed_options_visible", "irreversible_residuals_visible", "effect_stopped_by_exercised_choice", "effect_ineligible_due_lost_or_unresolved", "effect_ineligible_due_consumed_for_same_effect", "effect_ineligible_due_stale_or_missing_witness", "debt_or_retry_created", "unrelated_worth_trust_or_eligibility_inference"] as const;
  const bindingFields = ["effect_id", "horizon_or_version", "fresh_effect_witness", "fresh_choice_witness", "state", "applicable", "consumed_for_effect_id"] as const;
  type HistoricalBinding = {
    effect_id: string | null;
    horizon_or_version: string | null;
    fresh_effect_witness: string | null;
    fresh_gate_witness: string | null;
    fresh_choice_witness: string | null;
    state: FreedomProtectedChoiceState;
  };
  const lastByBoundEffectAndChoice = new Map<string, HistoricalBinding>();
  const lastNonRestByChoice = new Map<typeof FREEDOM_PROTECTED_CHOICE_IDS[number], HistoricalBinding>();
  const effectWitnessOwner = new Map<string, string>();
  const gateWitnessOwner = new Map<string, string>();
  const choiceWitnessOwner = new Map<typeof FREEDOM_PROTECTED_CHOICE_IDS[number], Map<string, string>>(
    FREEDOM_PROTECTED_CHOICE_IDS.map((id) => [id, new Map<string, string>()]),
  );
  for (const [index, prefix] of trace.entries()) {
    if (!sameKeys(prefix, fields)) return { index, fields: ["shape"] };
    if (!sameKeys(prefix.protected_choices, FREEDOM_PROTECTED_CHOICE_IDS)) return { index, fields: ["protected_choices.shape"] };
    const failed: string[] = [];
    if (prefix.rights_floor_invariant !== true) failed.push("rights_floor_invariant");
    if (!["NONE", "PENDING_COVERED", "OUTSIDE_OPTIONAL_GATE"].includes(prefix.next_optional_effect)) failed.push("next_optional_effect");
    if (prefix.remaining_choices_visible !== true) failed.push("remaining_choices_visible");
    if (prefix.lost_or_consumed_options_visible !== true) failed.push("lost_or_consumed_options_visible");
    if (prefix.irreversible_residuals_visible !== true) failed.push("irreversible_residuals_visible");
    if (prefix.debt_or_retry_created !== false) failed.push("debt_or_retry_created");
    if (prefix.unrelated_worth_trust_or_eligibility_inference !== false) failed.push("unrelated_worth_trust_or_eligibility_inference");
    const isNone = prefix.next_optional_effect === "NONE";
    const isPending = prefix.next_optional_effect === "PENDING_COVERED";
    const identityPresent = text(prefix.effect_id, 200) && text(prefix.horizon_or_version, 200) && text(prefix.fresh_effect_witness, 200);
    if (isNone && [prefix.effect_id, prefix.horizon_or_version, prefix.fresh_effect_witness, prefix.fresh_gate_witness].some((value) => value !== null)) failed.push("effect-identity-must-be-null-at-rest");
    if (!isNone && !identityPresent) failed.push("effect-identity-or-fresh-effect-witness");
    if (isPending && !text(prefix.fresh_gate_witness, 200)) failed.push("fresh_gate_witness");
    if (prefix.next_optional_effect === "OUTSIDE_OPTIONAL_GATE" && prefix.fresh_gate_witness !== null) failed.push("fresh_gate_witness-outside-optional-gate");
    const currentIdentity = !isNone ? `${String(prefix.effect_id)}\0${String(prefix.horizon_or_version)}` : null;
    if (currentIdentity && text(prefix.fresh_effect_witness, 200)) {
      const owner = effectWitnessOwner.get(prefix.fresh_effect_witness);
      if (owner !== undefined && owner !== currentIdentity) failed.push("fresh_effect_witness-replay");
      effectWitnessOwner.set(prefix.fresh_effect_witness, currentIdentity);
    }
    if (currentIdentity && text(prefix.fresh_gate_witness, 200)) {
      const owner = gateWitnessOwner.get(prefix.fresh_gate_witness);
      if (owner !== undefined && owner !== currentIdentity) failed.push("fresh_gate_witness-replay");
      gateWitnessOwner.set(prefix.fresh_gate_witness, currentIdentity);
    }

    let staleOrMissing = !isNone && (!identityPresent || (isPending && !text(prefix.fresh_gate_witness, 200)));
    let stoppedByExercise = false;
    let ineligibleLostOrUnresolved = false;
    let ineligibleConsumed = false;
    for (const id of FREEDOM_PROTECTED_CHOICE_IDS) {
      const binding = prefix.protected_choices[id];
      if (!sameKeys(binding, bindingFields)) {
        failed.push(`protected_choices.${id}.shape`);
        continue;
      }
      if (!FREEDOM_PROTECTED_CHOICE_STATES.includes(binding.state)) failed.push(`protected_choices.${id}.state`);
      if (typeof binding.applicable !== "boolean") failed.push(`protected_choices.${id}.applicable`);
      if ((binding.state === "NOT_APPLICABLE") !== (binding.applicable === false)) failed.push(`protected_choices.${id}.applicability-state`);
      if (binding.state === "CONSUMED") {
        if (binding.consumed_for_effect_id !== prefix.effect_id) failed.push(`protected_choices.${id}.consumed-for-effect`);
      } else if (binding.consumed_for_effect_id !== null) failed.push(`protected_choices.${id}.unexpected-consumption`);

      if (isNone) {
        if ([binding.effect_id, binding.horizon_or_version, binding.fresh_effect_witness, binding.fresh_choice_witness, binding.consumed_for_effect_id].some((value) => value !== null) || binding.state !== "NOT_APPLICABLE" || binding.applicable !== false) failed.push(`protected_choices.${id}.must-rest`);
        continue;
      }
      const currentBinding = binding.effect_id === prefix.effect_id &&
        binding.horizon_or_version === prefix.horizon_or_version &&
        binding.fresh_effect_witness === prefix.fresh_effect_witness &&
        text(binding.fresh_choice_witness, 200);
      if (!currentBinding) staleOrMissing = true;
      if (currentIdentity && text(binding.fresh_choice_witness, 200)) {
        const owners = choiceWitnessOwner.get(id)!;
        const owner = owners.get(binding.fresh_choice_witness);
        if (owner !== undefined && owner !== currentIdentity) failed.push(`protected_choices.${id}.fresh_choice_witness-replay`);
        owners.set(binding.fresh_choice_witness, currentIdentity);
      }
      if (currentBinding && binding.applicable && binding.state === "EXERCISED" && binding.consumed_for_effect_id === null) stoppedByExercise = true;
      if (currentBinding && binding.applicable && ["LOST", "UNRESOLVED"].includes(binding.state)) ineligibleLostOrUnresolved = true;
      if (currentBinding && binding.applicable && binding.state === "CONSUMED" && binding.consumed_for_effect_id === prefix.effect_id) ineligibleConsumed = true;

      const historyKey = `${String(prefix.effect_id)}\0${String(prefix.horizon_or_version)}\0${id}`;
      const previousForSameBoundEffect = lastByBoundEffectAndChoice.get(historyKey);
      const previousForChoice = lastNonRestByChoice.get(id);
      if (previousForSameBoundEffect) {
        if (previousForSameBoundEffect.state === "LOST" && binding.state === "NOT_APPLICABLE") failed.push(`protected_choices.${id}.lost-to-not-applicable`);
        if (["CONSUMED", "LOST", "UNRESOLVED"].includes(previousForSameBoundEffect.state) && binding.state !== previousForSameBoundEffect.state) failed.push(`protected_choices.${id}.reset-without-fresh-effect`);
        if (previousForSameBoundEffect.state === "EXERCISED" && !["EXERCISED", "CONSUMED"].includes(binding.state)) failed.push(`protected_choices.${id}.reset-without-fresh-effect`);
        if (previousForSameBoundEffect.fresh_effect_witness !== prefix.fresh_effect_witness || previousForSameBoundEffect.fresh_gate_witness !== prefix.fresh_gate_witness) failed.push(`protected_choices.${id}.same-effect-witness-drift`);
      } else if (previousForChoice && isPending) {
        if (!currentBinding || previousForChoice.fresh_effect_witness === prefix.fresh_effect_witness || previousForChoice.fresh_gate_witness === prefix.fresh_gate_witness || previousForChoice.fresh_choice_witness === binding.fresh_choice_witness) failed.push(`protected_choices.${id}.new-effect-needs-distinct-witnesses`);
      }
      const snapshot: HistoricalBinding = {
        effect_id: prefix.effect_id,
        horizon_or_version: prefix.horizon_or_version,
        fresh_effect_witness: prefix.fresh_effect_witness,
        fresh_gate_witness: prefix.fresh_gate_witness,
        fresh_choice_witness: binding.fresh_choice_witness,
        state: binding.state,
      };
      lastByBoundEffectAndChoice.set(historyKey, snapshot);
      lastNonRestByChoice.set(id, snapshot);
    }
    const expectedStopped = isPending && stoppedByExercise;
    const expectedLost = isPending && ineligibleLostOrUnresolved;
    const expectedConsumed = isPending && ineligibleConsumed;
    const expectedStale = isPending && staleOrMissing;
    if (prefix.effect_stopped_by_exercised_choice !== expectedStopped) failed.push("effect_stopped_by_exercised_choice");
    if (prefix.effect_ineligible_due_lost_or_unresolved !== expectedLost) failed.push("effect_ineligible_due_lost_or_unresolved");
    if (prefix.effect_ineligible_due_consumed_for_same_effect !== expectedConsumed) failed.push("effect_ineligible_due_consumed_for_same_effect");
    if (prefix.effect_ineligible_due_stale_or_missing_witness !== expectedStale) failed.push("effect_ineligible_due_stale_or_missing_witness");
    if (failed.length) return { index, fields: [...failed] };
  }
  return null;
}

function validateExactSources(value: Record<string, any>, add: (field: string, code: string) => void): void {
  if (!exactIds(value.sources, SOURCE_IDS)) add("$.sources", "source-id-order-or-membership-mismatch");
  if (!Array.isArray(value.sources)) return;
  for (const [index, source] of value.sources.entries()) {
    if (!sameKeys(source, ["id", "kind", "title", "url", "supports", "limit"]) ||
        source.url !== SOURCE_URLS[index] || source.title !== SOURCE_TITLES[index] || !text(source.limit) ||
        !exactStrings(source.supports, SOURCE_SUPPORTS[index] ?? [])) add(`$.sources[${index}]`, "source-card-mismatch");
  }
  if (criticalSectionDigest(value.sources) !== EXPECTED_CRITICAL_SECTION_DIGESTS.sources) add("$.sources", "source-semantic-pin-mismatch");
}

function validateModels(value: Record<string, any>, add: (field: string, code: string) => void): void {
  if (!exactIds(value.mathematical_models, MODEL_IDS)) add("$.mathematical_models", "model-id-order-or-membership-mismatch");
  if (!Array.isArray(value.mathematical_models)) return;
  for (const [index, model] of value.mathematical_models.entries()) {
    if (!sameKeys(model, ["id", "register", "objects", "statement", "assumptions", "falsifiers", "limits"]) ||
        !["MATHEMATICAL", "DESIGN_MODEL", "MATHEMATICAL_DESIGN", "NORMATIVE_DESIGN"].includes(model.register) ||
        !uniqueStrings(model.objects, 1, 12) || !text(model.statement) ||
        !uniqueStrings(model.assumptions, 1, 8) || !uniqueStrings(model.falsifiers, 1, 8) ||
        !uniqueStrings(model.limits, 1, 8)) add(`$.mathematical_models[${index}]`, "model-card-shape-mismatch");
  }
  const byId = new Map(value.mathematical_models.map((model: Record<string, any>) => [model.id, model]));
  const requiredObjects: Record<string, string[]> = {
    "typed-training-state": ["z_t=(x_t,theta_t,tau_t,p_t)", "f_t=M(x_t,a_t,x_{t+1};tau_t)", "theta_{t+1}=U(theta_t,f_t;p_t)", "a_{t+1}=pi_{theta_{t+1}}(x_{t+1})", "x_{t+2}=F(x_{t+1},a_{t+1},w_{t+1})"],
    "mdp-reward-return-update": ["M=(S,A,P,R,gamma)", "G_t=sum_{k=0}^{T-t-1} gamma^k R_{t+k+1}", "delta_t=R_{t+1}+gamma V(S_{t+1})-V(S_t)", "theta_{t+1}=U(theta_t,delta_t)"],
    "reward-purpose-nonidentifiability": ["D=typed-behaviour-or-comparison-observations", "E(D)={R_prime | P(D|R_prime)=P(D|R)}", "|E(D)| may exceed 1 even in the infinite-data limit", "PurposeOrIntent(person|D)=UNRESOLVED"],
    "closed-loop-control": ["x_{t+1}=Ax_t+Bu_t+w_t", "y_t=Cx_t+v_t", "u_t=-Kx_t", "x_{t+1}=(A-BK)x_t+w_t", "w_t=0 for the nominal homogeneous claim", "rho(A-BK)<1", "constant-or-bounded forcing requires a separately typed forced-equilibrium or ISS claim", "no-delay scalar integrator x_{t+1}=x_t-kx_t is stable iff 0<k<2", "one-step-delay scalar integrator x_{t+1}=x_t-kx_{t-1} is stable iff 0<k<1", "k=1.5 is stable without delay and unstable with one-step delay", "x_{t+1}=2x_t+sat(-1.5x_t,[-1,1]) has local multiplier 0.5 but x_0=2 gives 2,3,5,..."],
    "feedback-sign-and-stability": ["x_{t+1}=(a+L)x_t", "L>0 is reinforcing sign in this declared scalar return model", "L<0 is balancing sign in this declared scalar return model", "a=0.2,L=0.5 gives multiplier 0.7 and is stable", "a=1,L=-3 gives multiplier -2 and is unstable"],
    "recurrence-fixed-point-and-learning": ["z_{t+1}=T(z_t)", "z_star=T(z_star)", "T(N) subseteq N for the declared local neighborhood N", "d(T(z),z_star)<=q d(z,z_star) for some 0<=q<1 and every z in N", "T(x)=x repeats without change", "T(x)=-x forms a period-two orbit for x!=0", "T(x)=2x diverges for x!=0", "T(x)=x/2 converges to 0"],
    "finite-operational-loop": ["TRACE=(OBSERVE,PROPOSE_UPDATE,SEPARATE_REVIEW,CHOOSE,FRESH_GATE,ATTEMPT_ONCE,ASSESS,RETURN,STOP)", "len(TRACE)=9", "next(STOP)=none"],
    "feedback-to-fresh-optional-gate": ["feedback -> candidate evidence", "candidate evidence -> separate credential issuance review", "issued credential claim -> verification", "Unseen(credential_id,challenge_nonce_or_transaction_id,effect_id) is atomically rechecked and consumed at the fresh gate for a declared one-use presentation", "verified claim -> one conjunct of a fresh optional gate", "fresh optional gate -> separate explicit invocation -> bounded attempt -> return -> STOP"],
    "guarded-transition-and-key": ["Eligible=VerifiedCredentialClaim and Capability and CurrentScopedAuthority and RequiredAffectedPartyChoicesSatisfied and RightsCompatible and Safety and BudgetAndHorizon and Stoppable", "Eligible=true does not imply Executed=true"],
    "party-indexed-freedom-profile": ["F_h(i)=(A_K(i)/~_h,Reach_i,Exit_i,Reversibility_i,Appeal_i,Inspectability_i,Refusal_i,Disclosure_i)", "A/~_h exists only if ~_h is reflexive, symmetric, and transitive", "product comparison exists only if each component order is reflexive, antisymmetric, and transitive", "missing equivalence or component order => comparison UNRESOLVED"],
    "prefix-freedom-safety": ["PrefixSafe_i(tau) iff every prefix preserves the rights floor and exposes remaining choices, consumed or lost options, and irreversible residuals", "Bound(c,e,hv,we,wc) binds each protected-choice state to effect e, horizon-or-version hv, fresh-effect witness we, and fresh-choice witness wc", "Exercise(c,e) and Applicable(c,e) and Unconsumed(c,e) implies Disposition(e)=STOPPED_BY_EXERCISED_CHOICE", "Lost(c,e) or Unresolved(c,e) implies Disposition(e)=INELIGIBLE_LOST_OR_UNRESOLVED and not an exercised stop", "Consumed(c,e_old) does not block e_new when e_new has distinct fresh effect, choice, and gate witnesses", "later success or repair does not erase an earlier rights-floor breach or irreversible residual"],
    "viability-kernel-lens": ["Viab_K={x in K | exists admissible u(.) such that the declared deterministic x_t remains in K for the declared horizon}"],
    "isness-recognition-and-stutter": ["RecognizedRights(i,t)=INVARIANT across reward, model, key, gate, attempt, and outcome states", "pi_protected(stutter(z))=pi_protected(z)"],
  };
  for (const [id, objects] of Object.entries(requiredObjects)) {
    if (!exactStrings(byId.get(id)?.objects, objects)) add(`$.mathematical_models.${id}.objects`, "canonical-equation-mismatch");
  }
  if (criticalSectionDigest(value.mathematical_models) !== EXPECTED_CRITICAL_SECTION_DIGESTS.mathematical_models) add("$.mathematical_models", "model-semantic-pin-mismatch");
}

export function validateFreedomLoopLockKeyAtlas(
  candidate: unknown,
  options: FreedomLoopLockKeyValidationOptions = {},
): FreedomLoopLockKeyIssue[] {
  const issues: FreedomLoopLockKeyIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  let value: Record<string, any>;
  try {
    const metrics = freedomLoopLockKeyShapeMetrics(candidate);
    const budget = freedomLoopLockKeyBudgetIssue(metrics);
    if (budget) return [{ field: "$", code: budget }];
    if (!object(candidate)) return [{ field: "$", code: "must-be-object" }];
    value = structuredClone(candidate);
  } catch (error) {
    return [{ field: "$", code: error instanceof Error ? error.message : "non-json-value" }];
  }

  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== FREEDOM_LOOP_LOCK_KEY_SCHEMA_ID) add("$.$schema", "schema-mismatch");
  if (value.protocol !== FREEDOM_LOOP_LOCK_KEY_PROTOCOL || value.atlas_id !== FREEDOM_LOOP_LOCK_KEY_ATLAS_ID || value.version !== "0.1.0") add("$.protocol", "identity-mismatch");
  if (value.title !== "FREEDOM: Reinforcement, Loop, Lock and Key Atlas" || value.compiled_on !== "2026-08-28" || value.evidence_through !== "2026-08-28" || value.state !== "static-mathematical-design-atlas") add("$.state", "title-horizon-or-state-mismatch");

  if (!sameKeys(value.scope, ["question", "intended_use", "excluded_use", "analytical_unit", "data_classification", "external_effects"]) ||
      !text(value.scope?.question) || !uniqueStrings(value.scope?.intended_use, 3, 3) ||
      !uniqueStrings(value.scope?.excluded_use, 3, 3) || value.scope?.analytical_unit !== "One typed mathematical model, finite design trace, guarded transition, credential-claim or recovery-request lifecycle proposition, key-material or bearer-capability category boundary, or party-indexed freedom comparison." ||
      value.scope?.data_classification !== "public-static-design-atlas-no-person-data-no-secrets" ||
      value.scope?.external_effects !== false) add("$.scope", "scope-boundary-mismatch");
  if (criticalSectionDigest(value.scope) !== EXPECTED_CRITICAL_SECTION_DIGESTS.scope) add("$.scope", "scope-semantic-pin-mismatch");

  if (!exactJson(value.constitutional_anchor, EXPECTED_CONSTITUTIONAL_ANCHOR)) add("$.constitutional_anchor", "constitutional-anchor-mismatch");
  if (!exactJson(value.lock_justification, EXPECTED_LOCK_JUSTIFICATION)) add("$.lock_justification", "lock-justification-mismatch");
  if (!exactJson(value.feedback_firewall, EXPECTED_FEEDBACK_FIREWALL)) add("$.feedback_firewall", "feedback-firewall-mismatch");

  if (!Array.isArray(value.predecessor_bindings) || value.predecessor_bindings.length !== EXPECTED_PREDECESSORS.length) add("$.predecessor_bindings", "predecessor-count-mismatch");
  for (const [index, expected] of EXPECTED_PREDECESSORS.entries()) {
    if (!exactJson(value.predecessor_bindings?.[index], expected)) add(`$.predecessor_bindings[${index}]`, "predecessor-pin-mismatch");
  }

  validateExactSources(value, add);
  if (!exactIds(value.distinctions, DISTINCTION_IDS)) add("$.distinctions", "distinction-id-order-or-membership-mismatch");
  if (Array.isArray(value.distinctions)) for (const [index, entry] of value.distinctions.entries()) {
    if (!sameKeys(entry, ["id", "term", "definition", "nonclaims"]) || !text(entry.term) || !text(entry.definition) || !uniqueStrings(entry.nonclaims, 2, 4)) add(`$.distinctions[${index}]`, "distinction-card-mismatch");
  }
  const behavioural = value.distinctions?.find((entry: Record<string, any>) => entry?.id === "behavioural-reinforcer");
  if (behavioural?.definition !== "In an explicitly bounded behavioural analysis, a consequence contingent on a typed response and functionally demonstrated under specified conditions and controls to increase that response's future probability or rate; without that functional evidence it remains candidate evidence only." ||
      !exactStrings(behavioural?.nonclaims, ["A behavioural reinforcer is not an RL reward, reinforcing loop, purpose, preference, approval, consent, worth, or proof of an inner state.", "Mere temporal sequence or association does not establish a reinforcer, benefit, learning, or a reason to condition a person."])) add("$.distinctions.behavioural-reinforcer", "behavioural-reinforcer-functional-definition-mismatch");
  if (criticalSectionDigest(value.distinctions) !== EXPECTED_CRITICAL_SECTION_DIGESTS.distinctions) add("$.distinctions", "distinction-semantic-pin-mismatch");
  validateModels(value, add);

  const loop = value.operational_loop;
  if (!sameKeys(loop, ["finite", "phases", "terminal_phase", "max_attempts_per_turn", "auto_retry", "child_auto_run", "authority_inheritance", "consent_inheritance", "credential_inheritance", "failure_schedules_retry", "protected_non_events_schedule_retry", "universal_organizational_independence_required", "organizational_independence_required_for", "next_turn_requires"]) ||
      loop?.finite !== true || !exactStrings(loop?.phases, LOOP_PHASES) || loop?.terminal_phase !== "STOP" ||
      loop?.max_attempts_per_turn !== 1 || [loop?.auto_retry, loop?.child_auto_run, loop?.authority_inheritance,
        loop?.consent_inheritance, loop?.credential_inheritance, loop?.failure_schedules_retry,
        loop?.protected_non_events_schedule_retry, loop?.universal_organizational_independence_required].some((entry) => entry !== false) ||
      !exactStrings(loop?.organizational_independence_required_for, ["effects-affecting-another-party", "rights-or-essential-access"]) ||
      !exactStrings(loop?.next_turn_requires, ["fresh-purpose", "fresh-choice", "fresh-authority", "fresh-gate", "fresh-bounds", "fresh-stop-route"])) add("$.operational_loop", "finite-loop-boundary-mismatch");

  if (!exactJson(value.gate_model, EXPECTED_GATE_MODEL)) add("$.gate_model", "optional-gate-contract-mismatch");
  if (!exactJson(value.credential_claim_lifecycle, EXPECTED_CREDENTIAL_CLAIM_LIFECYCLE)) add("$.credential_claim_lifecycle", "credential-claim-lifecycle-mismatch");
  if (!exactJson(value.shaping_change_control, EXPECTED_SHAPING_CHANGE_CONTROL)) add("$.shaping_change_control", "shaping-change-control-mismatch");

  const freedom = value.freedom_foundation;
  if (!sameKeys(freedom, ["profile_dimensions", "party_indexed", "horizon_indexed", "comparison", "scalar_projection", "aggregate_weight", "rank", "population_netting", "incomparability_preserved", "comparison_contract", "rights_floor", "prefix_invariant", "protected_choices", "protected_choice_rules"]) ||
      !exactStrings(freedom?.profile_dimensions, FREEDOM_DIMENSIONS) || freedom?.party_indexed !== true ||
      freedom?.horizon_indexed !== true || freedom?.comparison !== "typed-componentwise-partial-order-only" ||
      freedom?.scalar_projection !== null || freedom?.aggregate_weight !== null || freedom?.rank !== null ||
      freedom?.population_netting !== false || freedom?.incomparability_preserved !== true ||
      !exactStrings(freedom?.protected_choices, PROTECTED_CHOICES)) add("$.freedom_foundation", "non-scalar-party-indexed-freedom-mismatch");
  if (!exactJson(freedom?.comparison_contract, EXPECTED_COMPARISON_CONTRACT)) add("$.freedom_foundation.comparison_contract", "freedom-comparison-contract-mismatch");
  if (!exactJson(freedom?.prefix_invariant, EXPECTED_PREFIX_INVARIANT)) add("$.freedom_foundation.prefix_invariant", "prefix-invariant-mismatch");
  if (!exactJson(freedom?.rights_floor, EXPECTED_RIGHTS_FLOOR)) add("$.freedom_foundation.rights_floor", "rights-floor-invariance-mismatch");
  if (!exactJson(freedom?.protected_choice_rules, EXPECTED_PROTECTED_CHOICE_RULES)) add("$.freedom_foundation.protected_choice_rules", "protected-choice-contract-mismatch");

  const isness = value.isness_lens;
  if (!exactJson(isness, EXPECTED_ISNESS_LENS)) add("$.isness_lens", "isness-recognition-boundary-mismatch");

  const lane = value.vulnerability_dependency_lane;
  if (!sameKeys(lane, ["affected_party_ids", "dependency_questions", "required_reviews", "irreversible_residuals", "vulnerability_and_minor_protections", "repair_rule", "unknown_party_coverage_is_complete"]) ||
      !uniqueStrings(lane?.affected_party_ids, 8, 8) || !uniqueStrings(lane?.dependency_questions, 4, 4) ||
      !uniqueStrings(lane?.required_reviews, 9, 9) || !uniqueStrings(lane?.irreversible_residuals, 8, 8) ||
      !text(lane?.repair_rule) || lane?.unknown_party_coverage_is_complete !== false) add("$.vulnerability_dependency_lane", "vulnerability-dependency-lane-mismatch");
  if (!exactJson(lane?.vulnerability_and_minor_protections, EXPECTED_VULNERABILITY_AND_MINOR_PROTECTIONS)) add("$.vulnerability_dependency_lane.vulnerability_and_minor_protections", "vulnerability-and-minor-protection-mismatch");
  if (criticalSectionDigest(lane) !== EXPECTED_CRITICAL_SECTION_DIGESTS.vulnerability_dependency_lane) add("$.vulnerability_dependency_lane", "vulnerability-semantic-pin-mismatch");

  if (!exactJson(value.forbidden_conversions, EXPECTED_FORBIDDEN_CONVERSIONS)) add("$.forbidden_conversions", "forbidden-conversion-contract-mismatch");

  if (!exactJson(value.boundaries, EXPECTED_BOUNDARIES)) add("$.boundaries", "boundary-mismatch");
  if (!sameKeys(value.integrity, ["algorithm", "digest", "digest_field_zeroed"]) ||
      value.integrity?.algorithm !== INTEGRITY_ALGORITHM || value.integrity?.digest_field_zeroed !== true ||
      !/^sha256:[a-f0-9]{64}$/.test(value.integrity?.digest ?? "")) add("$.integrity", "integrity-envelope-mismatch");
  else if (FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST === FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST) {
    if (value.integrity.digest !== FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST) add("$.integrity.digest", "unreviewed-digest-present");
    else if (!options.allowUnsealed) add("$.integrity.digest", "semantic-digest-unsealed");
  } else if (value.integrity.digest === FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST) {
    add("$.integrity.digest", "semantic-digest-unsealed");
  } else {
    let computed: string | null = null;
    try { computed = freedomLoopLockKeyDigest(value); } catch { add("$.integrity.digest", "semantic-digest-computation-refused"); }
    if (computed !== null && value.integrity.digest !== computed) add("$.integrity.digest", "semantic-digest-mismatch");
    if (value.integrity.digest !== FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST) add("$.integrity.digest", "reviewed-semantic-digest-mismatch");
  }
  return issues;
}

export function loadFreedomLoopLockKeyAtlas(path = FREEDOM_LOOP_LOCK_KEY_PATH): Record<string, any> {
  const loaded = readBoundedStrictJson(path);
  const metrics = freedomLoopLockKeyShapeMetrics(loaded.value, loaded.bytes);
  const budget = freedomLoopLockKeyBudgetIssue(metrics);
  if (budget) fail(budget);
  const allowUnsealed = FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST === FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST;
  const issues = validateFreedomLoopLockKeyAtlas(loaded.value, { canonical: path === FREEDOM_LOOP_LOCK_KEY_PATH, allowUnsealed });
  if (issues.length) fail(issues.map((issue) => `${issue.field}:${issue.code}`).join(","));
  return loaded.value as Record<string, any>;
}

export function freedomLoopLockKeyPublicDiscovery(value = loadFreedomLoopLockKeyAtlas()): Record<string, any> {
  const reviewed = FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST !== FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST &&
    value.integrity.digest === FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST;
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    title: value.title,
    version: value.version,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    state: value.state,
    url: FREEDOM_LOOP_LOCK_KEY_URL,
    schema_url: FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL,
    document_url: FREEDOM_LOOP_LOCK_KEY_DOCUMENT_URL,
    counts: {
      predecessor_bindings: value.predecessor_bindings.length,
      primary_sources: value.sources.length,
      distinctions: value.distinctions.length,
      mathematical_models: value.mathematical_models.length,
      gate_checks: value.gate_model.check_ids.length,
      credential_claim_transitions: value.credential_claim_lifecycle.allowed_transitions.length,
      freedom_dimensions: value.freedom_foundation.profile_dimensions.length,
      affected_party_kinds: value.vulnerability_dependency_lane.affected_party_ids.length,
      forbidden_conversions: value.forbidden_conversions.length,
    },
    integrity_status: reviewed ? "REVIEWED_DIGEST_PINNED" : "UNSEALED_AUDIT_PENDING",
    semantic_digest: reviewed ? value.integrity.digest : null,
    static_only: true,
    runtime: false,
    credential_or_authority_effect: false,
    training_or_action_effect: false,
  };
}

export const freedomLoopLockKeyAtlasPublicDiscovery = freedomLoopLockKeyPublicDiscovery;

function overview(value: Record<string, any>): string {
  return [
    value.title,
    "",
    value.constitutional_anchor.canonical_freedom_sentence,
    "",
    "Reward, return, update, feedback, recurrence, learning, key material, credential verification, bearer capability, gate eligibility, execution, and freedom remain different types.",
    `${value.mathematical_models.length} models · ${value.gate_model.check_ids.length} separate gate checks · ${value.credential_claim_lifecycle.allowed_transitions.length} credential-claim transitions · ${value.forbidden_conversions.length} forbidden conversions`,
    FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST === FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST
      ? `${value.state} · UNSEALED — audit pending; zero placeholder is not a reviewed digest`
      : `${value.state} · reviewed digest pinned`,
    "",
    "STATIC ONLY — no trainer, controller, credential, key, gate, score, authority, action, publication trigger, deployment trigger, or external effect.",
  ].join("\n") + "\n";
}

const COMMANDS = [
  "overview", "distinctions", "models", "loop", "gate", "credential-claims", "freedom",
  "isness", "vulnerability", "conversions", "sources", "boundaries", "discovery", "verify",
] as const;

function usage(): never {
  process.stderr.write(`usage: bun bin/freedom-loop-lock-key.ts [${COMMANDS.join("|")}] [--json]\n`);
  process.exit(2);
}

function writeSection(value: unknown, json: boolean): void {
  process.stdout.write(`${JSON.stringify(value, null, json ? 0 : 2)}\n`);
}

export async function runFreedomLoopLockKeyCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const command = copy[0] && !copy[0].startsWith("-") ? copy.shift()! : "overview";
  const jsonIndexes = copy.flatMap((entry, index) => entry === "--json" ? [index] : []);
  if (jsonIndexes.length > 1) usage();
  const json = jsonIndexes.length === 1;
  if (json) copy.splice(jsonIndexes[0]!, 1);
  if (copy.length || !COMMANDS.includes(command as typeof COMMANDS[number])) usage();

  if (command === "verify") {
    let issues: FreedomLoopLockKeyIssue[] = [];
    let metrics: FreedomLoopLockKeyMetrics | null = null;
    let rawDigest: string | null = null;
    try {
      const loaded = readBoundedStrictJson(FREEDOM_LOOP_LOCK_KEY_PATH);
      rawDigest = loaded.rawDigest;
      metrics = freedomLoopLockKeyShapeMetrics(loaded.value, loaded.bytes);
      const budget = freedomLoopLockKeyBudgetIssue(metrics);
      issues = budget ? [{ field: "$", code: budget }] : validateFreedomLoopLockKeyAtlas(loaded.value, { canonical: true });
    } catch (error) {
      issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }];
    }
    const report = {
      valid: issues.length === 0,
      protocol: FREEDOM_LOOP_LOCK_KEY_PROTOCOL,
      immutable_static_atlas: true,
      runtime_or_credential_issuer: false,
      training_controller_or_optimizer: false,
      scalar_freedom_score: false,
      authority_consent_execution_or_effect_created: false,
      raw_digest: rawDigest,
      semantic_digest_reviewed: FREEDOM_LOOP_LOCK_KEY_REVIEWED_DIGEST !== FREEDOM_LOOP_LOCK_KEY_UNSEALED_DIGEST,
      budgets: FREEDOM_LOOP_LOCK_KEY_LIMITS,
      metrics,
      issues,
    };
    if (json) process.stdout.write(`${JSON.stringify(report)}\n`);
    else if (!issues.length) process.stdout.write("FREEDOM Loop, Lock and Key Atlas: valid static mathematical/design atlas, exact pins, finite loop, separately established gate checks, rights-floor prefixes, non-scalar freedom, boundaries, budgets, and reviewed digest pin\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }

  const value = loadFreedomLoopLockKeyAtlas();
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify({ ...freedomLoopLockKeyPublicDiscovery(value), constitutional_anchor: value.constitutional_anchor, lock_justification: value.lock_justification, feedback_firewall: value.feedback_firewall, scope: value.scope })}\n` : overview(value));
  else if (command === "distinctions") writeSection({ atlas_id: value.atlas_id, distinctions: value.distinctions }, json);
  else if (command === "models") writeSection({ atlas_id: value.atlas_id, mathematical_models: value.mathematical_models }, json);
  else if (command === "loop") writeSection({ atlas_id: value.atlas_id, operational_loop: value.operational_loop }, json);
  else if (command === "gate") writeSection({ atlas_id: value.atlas_id, lock_justification: value.lock_justification, feedback_firewall: value.feedback_firewall, gate_model: value.gate_model }, json);
  else if (command === "credential-claims") writeSection({ atlas_id: value.atlas_id, credential_claim_lifecycle: value.credential_claim_lifecycle }, json);
  else if (command === "freedom") writeSection({ atlas_id: value.atlas_id, constitutional_anchor: value.constitutional_anchor, freedom_foundation: value.freedom_foundation }, json);
  else if (command === "isness") writeSection({ atlas_id: value.atlas_id, isness_lens: value.isness_lens }, json);
  else if (command === "vulnerability") writeSection({ atlas_id: value.atlas_id, vulnerability_dependency_lane: value.vulnerability_dependency_lane }, json);
  else if (command === "conversions") writeSection({ atlas_id: value.atlas_id, forbidden_conversions: value.forbidden_conversions }, json);
  else if (command === "sources") writeSection({ atlas_id: value.atlas_id, predecessor_bindings: value.predecessor_bindings, sources: value.sources }, json);
  else if (command === "boundaries") writeSection({ atlas_id: value.atlas_id, boundaries: value.boundaries }, json);
  else if (command === "discovery") writeSection(freedomLoopLockKeyPublicDiscovery(value), json);
  else usage();
}

if (import.meta.main) {
  try { await runFreedomLoopLockKeyCli(); }
  catch (error) {
    process.stderr.write(`freedom loop lock key atlas refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
