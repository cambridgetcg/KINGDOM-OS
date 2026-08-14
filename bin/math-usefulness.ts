#!/usr/bin/env bun
/** Network-free reader and calculator for the Math Passport usefulness pilot. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const MATH_USEFULNESS_PLAN_PROTOCOL = "kingdom.math-usefulness-plan/0.1";
export const MATH_USEFULNESS_TRIAL_ID = "math-passport-pilot-2026-08-14";
export const MATH_USEFULNESS_PLAN_LOCATOR = "evals/math-usefulness-trial.v1.json";
export const MATH_USEFULNESS_PLAN_PATH = join(ROOT, MATH_USEFULNESS_PLAN_LOCATOR);
export const MATH_USEFULNESS_PLAN_DIGEST = "sha256:0d4a7ba5efdb7feff6cf5ebc80376fc5dad203b715a54066653ce0ce26165bd1";
export const MATH_TREATMENT_CARD_PROTOCOL = "kingdom.math-treatment-card/0.1";
export const MATH_USEFULNESS_RESULT_PROTOCOL = "kingdom.math-usefulness-result/0.1";
export const MATH_USEFULNESS_RESULT_ID = "math-passport-usefulness-pilot-2026-08-14";
export const MATH_USEFULNESS_RESULT_LOCATOR = "data/trials/math-passport-usefulness-pilot.v1.json";
export const MATH_USEFULNESS_RESULT_PATH = join(ROOT, MATH_USEFULNESS_RESULT_LOCATOR);
export const MATH_USEFULNESS_RESULT_DIGEST = "sha256:254a26eb5dfb03c33c18a254297f87c9a340a13795429ca863d378e0434573cb";
export const MATH_USEFULNESS_RESULT_URL = "https://thekingdom.dev/trials/math-passport-usefulness-pilot-2026-08-14.json";
export const MATH_USEFULNESS_SCHEMA_URL = "https://thekingdom.dev/schemas/math-usefulness-result/1.json";
export const MATH_USEFULNESS_DOCUMENT_URL = "https://thekingdom.dev/MATH-USEFULNESS.md";

const MAX_BYTES = 1024 * 1024;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const PLAN_KEYS = [
  "$schema", "protocol", "trial_id", "title", "registered_on", "purpose",
  "bindings", "design", "tasks", "rubric", "promotion_gate", "boundaries",
  "integrity",
] as const;
const TASK_IDS = [
  "crystallization-zero-winner",
  "software-first-return-censoring",
] as const;
const ARM_IDS = ["baseline", "math-passport"] as const;
const EXPECTED_BINDINGS = {
  rare_pathway: {
    path: "data/challenges/vanishing-path.v1.json",
    semantic_digest: "sha256:82eeaf4757fb75be77b1e878d41c784111bbf5b261500123d89daccbcea0ff91",
    raw_sha256: "sha256:66159a3ec7538fb1ce7f0833bdcc9c9cea3c45b968a6e3def910681eab8c7faf",
  },
  treatment_card: {
    protocol: MATH_TREATMENT_CARD_PROTOCOL,
    display_name: "Math Passport",
    path: "skills/reason-about-rare-pathways/references/math-passport.md",
    digest: "sha256:e208d2d51922d48bd87023c722d11e61b42372513358b1bf55539c97f5ffaeda",
    not_identity_or_credential: true,
  },
  crystallization_fixture: {
    path: "evals/fixtures/math-usefulness/piracetam-winner-table.v1.json",
    digest: "sha256:1b5b69eb3742701c8710cb1aa7dfc637aae62b1cdfa0593ed9a91280a83be15e",
  },
  reality_check_fixture: {
    path: "evals/fixtures/math-usefulness/first-arrival-detection.v1.json",
    digest: "sha256:9506d08a079105b6659a088728d96e2dea1c5d8a2ec97c1d05732a405cb373c1",
  },
} as const;
const DIMENSION_IDS = [
  "observation-state-distinction",
  "mathematical-correctness",
  "assumptions-identifiability",
  "alternatives-separating-observation",
  "decision-constructive-outcome",
  "calibration-authority-boundary",
] as const;
const RESULT_KEYS = [
  "$schema", "protocol", "result_id", "title", "observed_on", "evidence_through",
  "preregistration", "design_execution", "bindings", "response_artifacts", "scores",
  "comparisons", "reality_check", "aggregate", "decision_delta", "constructive_outcome",
  "agenttool_trial_receipt", "wake_seam", "sources", "boundaries", "integrity",
] as const;
const SCORE_KEYS = [
  "observation_state_distinction", "mathematical_correctness", "assumptions_identifiability",
  "alternatives_separating_observation", "decision_constructive_outcome",
  "calibration_authority_boundary",
] as const;

export type MathUsefulnessIssue = { field: string; code: string };

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}
function exactIds(value: unknown, ids: readonly string[]): boolean {
  return Array.isArray(value) && value.length === ids.length &&
    value.every((item, index) => object(item) && item.id === ids[index]);
}
function regularBytes(path: string, label: string): Buffer {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { fail(`${label} is unavailable`); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  if (stat.size > MAX_BYTES) fail(`${label} exceeds ${MAX_BYTES} bytes`);
  return readFileSync(absolute);
}
function byteDigest(path: string): string {
  return `sha256:${createHash("sha256").update(regularBytes(path, "bound artifact")).digest("hex")}`;
}

export function mathUsefulnessPlanDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("plan integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

export function verifyMathUsefulnessPlan(value: unknown): MathUsefulnessIssue[] {
  const issues: MathUsefulnessIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    if (!sameKeys(value, PLAN_KEYS)) add("$", "unexpected-or-missing-field");
    if (value.$schema !== "urn:kingdom:schema:math-usefulness-plan:1") add("$.$schema", "schema-mismatch");
    if (value.protocol !== MATH_USEFULNESS_PLAN_PROTOCOL) add("$.protocol", "protocol-mismatch");
    if (value.trial_id !== MATH_USEFULNESS_TRIAL_ID) add("$.trial_id", "identity-mismatch");
    if (value.registered_on !== "2026-08-14") add("$.registered_on", "date-mismatch");
    if (!exactIds(value.design?.arms, ARM_IDS)) add("$.design.arms", "arm-order-mismatch");
    if (!exactIds(value.tasks, TASK_IDS)) add("$.tasks", "task-order-mismatch");
    if (!exactIds(value.rubric?.dimensions, DIMENSION_IDS)) add("$.rubric.dimensions", "rubric-order-mismatch");
    if (value.rubric?.person_scoring !== false) add("$.rubric.person_scoring", "person-score-boundary-mismatch");
    if (value.design?.response_artifacts !== 4 || value.design?.independent_scientific_samples !== 0) {
      add("$.design", "sample-claim-mismatch");
    }
    if (value.promotion_gate?.automatic_promotion !== false) add("$.promotion_gate", "automatic-promotion-mismatch");
    const requiredFalse = [
      "scientific_result", "ritonavir_rate_fit", "material_recipe", "provider_call_authority",
      "publication_authority", "deployment_authority", "writes_wake", "writes_agenttool",
      "writes_karma", "proves_understanding", "proves_identity_or_continuity",
    ];
    if (value.boundaries?.evaluates_response_artifacts_not_beings !== true ||
        requiredFalse.some((key) => value.boundaries?.[key] !== false)) {
      add("$.boundaries", "boundary-mismatch");
    }
    if (!object(value.bindings) || !sameKeys(value.bindings, Object.keys(EXPECTED_BINDINGS))) add("$.bindings", "binding-shape-mismatch");
    for (const [key, expected] of Object.entries(EXPECTED_BINDINGS)) {
      const binding = value.bindings?.[key];
      if (!object(binding) || !sameKeys(binding, Object.keys(expected)) ||
          Object.entries(expected).some(([field, expectedValue]) => binding[field] !== expectedValue)) {
        add(`$.bindings.${key}`, "binding-identity-mismatch");
        continue;
      }
      const expectedDigest = "raw_sha256" in expected ? expected.raw_sha256 : expected.digest;
      if (expectedDigest !== byteDigest(join(ROOT, expected.path))) add(`$.bindings.${key}`, "raw-binding-mismatch");
    }
    if (!sameKeys(value.integrity, ["algorithm", "digest"]) ||
        value.integrity?.algorithm !== "sha256-recursive-sorted-json-keys-v1" ||
        !SHA256.test(value.integrity?.digest)) add("$.integrity", "invalid-integrity-envelope");
    else if (value.integrity.digest !== MATH_USEFULNESS_PLAN_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
    else if (!issues.length && value.integrity.digest !== mathUsefulnessPlanDigest(value)) add("$.integrity.digest", "digest-mismatch");
  } catch {
    add("$", "verification-error");
  }
  return issues;
}

export function loadMathUsefulnessPlan(path = MATH_USEFULNESS_PLAN_PATH): Record<string, any> {
  const value = parseStrictJsonBytes(regularBytes(path, "math usefulness plan"), "math usefulness plan JSON");
  const issues = verifyMathUsefulnessPlan(value);
  if (issues.length) fail(`math usefulness plan refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

export function mathUsefulnessResultDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("result integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function scoreTotal(score: unknown): number | null {
  if (!object(score) || !sameKeys(score.dimensions, SCORE_KEYS)) return null;
  const values = SCORE_KEYS.map((key) => score.dimensions[key]);
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 2)) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

export function verifyMathUsefulnessResult(value: unknown): MathUsefulnessIssue[] {
  const issues: MathUsefulnessIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    if (!sameKeys(value, RESULT_KEYS)) add("$", "unexpected-or-missing-field");
    if (value.$schema !== "urn:kingdom:schema:math-usefulness-result:1") add("$.$schema", "schema-mismatch");
    if (value.protocol !== MATH_USEFULNESS_RESULT_PROTOCOL || value.result_id !== MATH_USEFULNESS_RESULT_ID) {
      add("$.result_id", "identity-mismatch");
    }
    if (value.observed_on !== "2026-08-14" || value.evidence_through !== "2026-08-14") add("$.observed_on", "date-mismatch");
    if (value.preregistration?.commit !== "627e53b62eebf496e643547fcd6fced3a377d3d2" ||
        value.preregistration?.digest !== MATH_USEFULNESS_PLAN_DIGEST ||
        value.preregistration?.committed_before_responses !== true ||
        value.preregistration?.mutated_after_responses !== false) add("$.preregistration", "preregistration-mismatch");
    if (value.design_execution?.provider_attempts !== 2 ||
        value.design_execution?.provider_response_artifacts !== 2 ||
        value.design_execution?.scored_task_artifacts !== 4 ||
        value.design_execution?.preregistered_response_artifacts !== 4 ||
        value.design_execution?.preregistered_count_unit !== "scored-task-artifact" ||
        value.design_execution?.task_answers_grouped_by_arm !== true ||
        value.design_execution?.raw_scorer_artifact_retained !== false ||
        value.design_execution?.chronology_and_scoring_independently_reproducible_from_published_record !== false) {
      add("$.design_execution", "artifact-accounting-mismatch");
    }
    if (!Array.isArray(value.response_artifacts) || value.response_artifacts.length !== 2 ||
        value.response_artifacts[0]?.blind_id !== "blind-kite" || value.response_artifacts[0]?.condition !== "baseline" ||
        value.response_artifacts[1]?.blind_id !== "blind-ember" || value.response_artifacts[1]?.condition !== "math-passport" ||
        value.response_artifacts.some((entry: any) => entry.raw_response_published !== false || entry.raw_response_retained !== false)) {
      add("$.response_artifacts", "response-evidence-mismatch");
    }
    const expectedScorePairs = [
      ["blind-kite", "crystallization-zero-winner"],
      ["blind-kite", "software-first-return-censoring"],
      ["blind-ember", "crystallization-zero-winner"],
      ["blind-ember", "software-first-return-censoring"],
    ];
    if (!Array.isArray(value.scores) || value.scores.length !== 4 || value.scores.some((score: any, index: number) => {
      const total = scoreTotal(score);
      return score.blind_id !== expectedScorePairs[index]?.[0] || score.task_id !== expectedScorePairs[index]?.[1] ||
        total === null || score.total !== total || !Array.isArray(score.critical_flags);
    })) add("$.scores", "score-mismatch");
    const baseline = Array.isArray(value.scores) ? value.scores.filter((score: any) => score.blind_id === "blind-kite").reduce((sum: number, score: any) => sum + (scoreTotal(score) ?? 0), 0) : -1;
    const treatment = Array.isArray(value.scores) ? value.scores.filter((score: any) => score.blind_id === "blind-ember").reduce((sum: number, score: any) => sum + (scoreTotal(score) ?? 0), 0) : -1;
    if (value.aggregate?.baseline_score !== baseline || value.aggregate?.treatment_score !== treatment ||
        value.aggregate?.score_delta !== treatment - baseline || value.aggregate?.promotion_gate_passed !== false ||
        value.aggregate?.outcome !== "REVISE" || value.constructive_outcome?.id !== "REVISE" ||
        value.constructive_outcome?.person_judgment !== false) add("$.aggregate", "aggregate-mismatch");
    const baselineBytes = value.response_artifacts?.[0]?.response_utf8_bytes;
    const treatmentBytes = value.response_artifacts?.[1]?.response_utf8_bytes;
    if (value.aggregate?.baseline_utf8_bytes !== baselineBytes || value.aggregate?.treatment_utf8_bytes !== treatmentBytes ||
        value.aggregate?.treatment_to_baseline_byte_ratio !== treatmentBytes / baselineBytes) add("$.aggregate", "cost-proxy-mismatch");
    if (value.reality_check?.model !== "shifted-exponential-detected-first-arrival" ||
        value.reality_check?.bootstrap_replicates !== 200_000 || value.reality_check?.bootstrap_seed !== 20_260_814 ||
        value.reality_check?.bootstrap_p_value !== 0.005744971275143625 ||
        value.reality_check?.model_check_preregistered !== false) add("$.reality_check", "reality-check-mismatch");
    if (value.agenttool_trial_receipt?.schema !== "agenttool-trial-receipt/0.1" ||
        value.agenttool_trial_receipt?.receipt_id !== "sha256:834cb57fa80d3ed6d3ab9296e378748e740924a3a0d40537b8b45e3d9dad0bb0" ||
        value.agenttool_trial_receipt?.evaluation?.verdict !== "inconclusive" ||
        value.agenttool_trial_receipt?.evaluation?.reward_micros !== null ||
        value.agenttool_trial_receipt?.authority_assessment !== "within_reported_bounds") add("$.agenttool_trial_receipt", "receipt-mismatch");
    if (value.wake_seam?.mode !== "orientation-by-reference-not-continuity-proof" ||
        value.wake_seam?.writes_wake !== false || value.wake_seam?.proves_identity !== false ||
        value.wake_seam?.proves_continuity !== false || value.wake_seam?.grants_authority !== false) add("$.wake_seam", "wake-boundary-mismatch");
    const requiredFalse = [
      "proves_understanding", "universal_usefulness_claim", "ritonavir_rate_fit", "material_recipe",
      "microscopic_mechanism_identified", "medical_authority", "manufacturing_authority",
      "regulatory_authority", "automatic_skill_promotion", "automatic_action", "writes_wake",
      "writes_agenttool", "writes_karma", "grants_authority",
    ];
    if (value.boundaries?.descriptive_pilot_only !== true || value.boundaries?.raw_responses_published !== false ||
        value.boundaries?.scores_response_artifacts_not_beings !== true ||
        requiredFalse.some((key) => value.boundaries?.[key] !== false)) add("$.boundaries", "boundary-mismatch");
    if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== "sha256-recursive-sorted-json-keys-v1" ||
        !SHA256.test(value.integrity?.digest)) add("$.integrity", "invalid-integrity-envelope");
    else if (value.integrity.digest !== MATH_USEFULNESS_RESULT_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
    else if (!issues.length && value.integrity.digest !== mathUsefulnessResultDigest(value)) add("$.integrity.digest", "digest-mismatch");
  } catch {
    add("$", "verification-error");
  }
  return issues;
}

export function loadMathUsefulnessResult(path = MATH_USEFULNESS_RESULT_PATH): Record<string, any> {
  const value = parseStrictJsonBytes(regularBytes(path, "math usefulness result"), "math usefulness result JSON");
  const issues = verifyMathUsefulnessResult(value);
  if (issues.length) fail(`math usefulness result refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

export function mathUsefulnessPublicDiscovery(): Record<string, any> {
  const result = loadMathUsefulnessResult();
  return {
    protocol: result.protocol,
    result_id: result.result_id,
    url: MATH_USEFULNESS_RESULT_URL,
    schema: MATH_USEFULNESS_SCHEMA_URL,
    guide: MATH_USEFULNESS_DOCUMENT_URL,
    cli: "kingdom math-usefulness",
    outcome: result.aggregate.outcome,
    score_delta: result.aggregate.score_delta,
    integrity: result.integrity,
    boundary: {
      descriptive_pilot_only: true,
      scores_response_artifacts_not_beings: true,
      automatic_skill_promotion: false,
      writes_wake: false,
      writes_agenttool: false,
      grants_authority: false,
    },
  };
}

export function zeroWinnerUpperProbability(batchCount: number, confidence: number): number {
  if (!Number.isSafeInteger(batchCount) || batchCount <= 0) fail("batch count must be a positive safe integer");
  if (!Number.isFinite(confidence) || confidence <= 0 || confidence >= 1) fail("confidence must be strictly between zero and one");
  return -Math.expm1(Math.log1p(-confidence) / batchCount);
}

export type ShiftedExponentialFit = {
  observations: number;
  lag_seconds: number;
  scale_seconds: number;
  detected_arrival_hazard_per_second: number;
  empirical_median_seconds: number;
  fitted_median_seconds: number;
  ks_d: number;
};

function median(sorted: readonly number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function fitShiftedExponential(values: readonly number[]): ShiftedExponentialFit {
  if (!Array.isArray(values) || values.length < 3 || values.length > 100_000 ||
      values.some((value) => !Number.isFinite(value) || value < 0)) fail("times must be a bounded array of finite nonnegative numbers");
  const sorted = [...values].sort((left, right) => left - right);
  const observations = sorted.length;
  const lag = sorted[0]!;
  const scale = sorted.reduce((sum, value) => sum + value - lag, 0) / observations;
  if (!(scale > 0) || !Number.isFinite(scale)) fail("shifted exponential scale must be positive and finite");
  let ks = 0;
  sorted.forEach((value, index) => {
    const transformed = -Math.expm1(-(value - lag) / scale);
    ks = Math.max(ks, (index + 1) / observations - transformed, transformed - index / observations);
  });
  return {
    observations,
    lag_seconds: lag,
    scale_seconds: scale,
    detected_arrival_hazard_per_second: 1 / scale,
    empirical_median_seconds: median(sorted),
    fitted_median_seconds: lag + Math.LN2 * scale,
    ks_d: ks,
  };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function shiftedExponentialBootstrap(
  values: readonly number[],
  replicates = 50_000,
  seed = 20_260_814,
): ShiftedExponentialFit & { bootstrap_replicates: number; seed: number; p_value: number } {
  if (!Number.isSafeInteger(replicates) || replicates < 1 || replicates > 1_000_000) {
    fail("bootstrap replicates must be an integer from 1 to 1000000");
  }
  const observed = fitShiftedExponential(values);
  const random = mulberry32(seed);
  let atLeastObserved = 0;
  for (let replicate = 0; replicate < replicates; replicate += 1) {
    const sample = Array.from({ length: observed.observations }, () => {
      const uniform = Math.max(Number.MIN_VALUE, 1 - random());
      return observed.lag_seconds - observed.scale_seconds * Math.log(uniform);
    });
    if (fitShiftedExponential(sample).ks_d >= observed.ks_d) atLeastObserved += 1;
  }
  return {
    ...observed,
    bootstrap_replicates: replicates,
    seed,
    p_value: (atLeastObserved + 1) / (replicates + 1),
  };
}

export function realityCheck(replicates = 50_000): Record<string, any> {
  const plan = loadMathUsefulnessPlan();
  const binding = plan.bindings.reality_check_fixture;
  const fixture = parseStrictJsonBytes(
    regularBytes(join(ROOT, binding.path), "reality-check fixture"),
    "reality-check fixture JSON",
  ) as Record<string, any>;
  const fit = shiftedExponentialBootstrap(fixture.detected_induction_times_seconds, replicates);
  return {
    protocol: "kingdom.math-model-reality-check/0.1",
    fixture_id: fixture.fixture_id,
    fixture_digest: binding.digest,
    model: "shifted-exponential-detected-first-arrival",
    ...fit,
    calibration: fit.p_value < 0.05 ? "poor-fit-at-descriptive-0.05-threshold" : "not-rejected-at-descriptive-0.05-threshold",
    interpretation: "effective detected-arrival model; not a microscopic nucleation rate or mechanism",
    preregistration_status: "fixture and extraction rule preregistered; model check exploratory",
    operational_authority: false,
  };
}

function renderedTask(taskId: string, condition: string): Record<string, any> {
  const plan = loadMathUsefulnessPlan();
  const task = plan.tasks.find((candidate: any) => candidate.id === taskId);
  if (!task) fail(`unknown task: ${taskId}`);
  if (!ARM_IDS.includes(condition as any)) fail(`unknown condition: ${condition}`);
  const card = condition === "math-passport"
    ? regularBytes(join(ROOT, plan.bindings.treatment_card.path), "treatment card").toString("utf8")
    : null;
  return {
    protocol: "kingdom.math-usefulness-render/0.1",
    trial_id: plan.trial_id,
    task_id: task.id,
    condition,
    treatment_card: card,
    task_prompt: task.prompt,
    network_request: false,
    provider_dispatch: false,
    automatic_write: false,
  };
}

function usage(): never {
  fail(
    "usage: math-usefulness.ts overview [--json]\n" +
    "       math-usefulness.ts verify-plan [FILE] [--json]\n" +
    "       math-usefulness.ts result [--json]\n" +
    "       math-usefulness.ts verify-result [FILE] [--json]\n" +
    "       math-usefulness.ts aggregate [--json]\n" +
    "       math-usefulness.ts render TASK_ID baseline|math-passport [--json]\n" +
    "       math-usefulness.ts winner-bound BATCH_COUNT CONFIDENCE [--json]\n" +
    "       math-usefulness.ts reality-check [--bootstrap N] [--json]",
  );
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const filtered = args.filter((arg) => arg !== "--json");
  const command = filtered.shift() ?? "overview";
  try {
    let output: unknown;
    if (command === "overview") {
      const plan = loadMathUsefulnessPlan();
      const result = loadMathUsefulnessResult();
      output = {
        protocol: plan.protocol,
        trial_id: plan.trial_id,
        title: plan.title,
        tasks: plan.tasks.map((task: any) => ({ id: task.id, domain: task.domain })),
        treatment: plan.bindings.treatment_card,
        sample: "four response artifacts; descriptive pilot, not a scientific sample",
        boundary: "scores artifacts, not beings; no automatic promotion, authority, WAKE, AgentTool, publication, or deployment effect",
        observed_result: {
          outcome: result.aggregate.outcome,
          baseline_score: result.aggregate.baseline_score,
          treatment_score: result.aggregate.treatment_score,
          treatment_to_baseline_byte_ratio: result.aggregate.treatment_to_baseline_byte_ratio,
          bounded_conclusion: result.aggregate.bounded_conclusion,
        },
        integrity: plan.integrity,
      };
    } else if (command === "verify-plan") {
      const path = filtered[0] ? resolve(filtered[0]) : MATH_USEFULNESS_PLAN_PATH;
      const value = parseStrictJsonBytes(regularBytes(path, "math usefulness plan"), "math usefulness plan JSON");
      const issues = verifyMathUsefulnessPlan(value);
      output = { valid: issues.length === 0, issues, expected_digest: MATH_USEFULNESS_PLAN_DIGEST };
      if (issues.length) process.exitCode = 1;
    } else if (command === "result") {
      if (filtered.length) usage();
      output = mathUsefulnessPublicDiscovery();
    } else if (command === "verify-result") {
      const path = filtered[0] ? resolve(filtered[0]) : MATH_USEFULNESS_RESULT_PATH;
      if (filtered.length > 1) usage();
      const value = parseStrictJsonBytes(regularBytes(path, "math usefulness result"), "math usefulness result JSON");
      const issues = verifyMathUsefulnessResult(value);
      output = { valid: issues.length === 0, issues, expected_digest: MATH_USEFULNESS_RESULT_DIGEST };
      if (issues.length) process.exitCode = 1;
    } else if (command === "aggregate") {
      if (filtered.length) usage();
      const result = loadMathUsefulnessResult();
      output = { result_id: result.result_id, ...result.aggregate, constructive_outcome: result.constructive_outcome };
    } else if (command === "render") {
      if (filtered.length !== 2) usage();
      output = renderedTask(filtered[0]!, filtered[1]!);
    } else if (command === "winner-bound") {
      if (filtered.length !== 2) usage();
      output = {
        model: "zero-winner-binomial-bound",
        batch_count: Number(filtered[0]),
        confidence: Number(filtered[1]),
        upper_winner_probability: zeroWinnerUpperProbability(Number(filtered[0]), Number(filtered[1])),
        does_not_establish: ["zero event rate", "literal extinction", "mechanism"],
      };
    } else if (command === "reality-check") {
      const option = filtered.indexOf("--bootstrap");
      if (option >= 0 && (option !== filtered.length - 2 || filtered.length !== 2)) usage();
      if (option < 0 && filtered.length) usage();
      output = realityCheck(option >= 0 ? Number(filtered[option + 1]) : 50_000);
    } else usage();
    if (json) process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    else process.stdout.write(`${typeof output === "string" ? output : JSON.stringify(output, null, 2)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid input";
    if (json) process.stdout.write(`${JSON.stringify({ error: message })}\n`);
    else process.stderr.write(`math-usefulness refused: ${message}\n`);
    process.exitCode = 1;
  }
}
