import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MATH_TREATMENT_CARD_PROTOCOL,
  MATH_USEFULNESS_PLAN_DIGEST,
  MATH_USEFULNESS_PLAN_PATH,
  MATH_USEFULNESS_RESULT_DIGEST,
  MATH_USEFULNESS_RESULT_PATH,
  fitShiftedExponential,
  loadMathUsefulnessPlan,
  loadMathUsefulnessResult,
  mathUsefulnessPlanDigest,
  mathUsefulnessPublicDiscovery,
  mathUsefulnessResultDigest,
  realityCheck,
  verifyMathUsefulnessPlan,
  verifyMathUsefulnessResult,
  zeroWinnerUpperProbability,
} from "../bin/math-usefulness.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary: string[] = [];

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function authored(): any {
  return JSON.parse(readFileSync(MATH_USEFULNESS_PLAN_PATH, "utf8"));
}

function cli(...args: string[]) {
  return Bun.spawnSync(["bun", "bin/math-usefulness.ts", ...args], { cwd: ROOT });
}

describe("Math Passport usefulness plan", () => {
  test("loads a digest-bound preregistration that evaluates artifacts, never beings", () => {
    const plan = loadMathUsefulnessPlan();
    expect(verifyMathUsefulnessPlan(plan)).toEqual([]);
    expect(mathUsefulnessPlanDigest(plan)).toBe(MATH_USEFULNESS_PLAN_DIGEST);
    expect(plan).toMatchObject({
      protocol: "kingdom.math-usefulness-plan/0.1",
      design: { response_artifacts: 4, independent_scientific_samples: 0 },
      rubric: { unit: "response-artifact", person_scoring: false },
      promotion_gate: { automatic_promotion: false },
      boundaries: { writes_wake: false, writes_agenttool: false, proves_understanding: false },
    });
    expect(plan.bindings.treatment_card).toMatchObject({
      protocol: MATH_TREATMENT_CARD_PROTOCOL,
      not_identity_or_credential: true,
    });
  });

  test("refuses content drift, self-resigned drift, duplicate keys, and symlinks", () => {
    const changed = authored();
    changed.purpose += " changed";
    expect(verifyMathUsefulnessPlan(changed).map((issue) => issue.code)).toContain("digest-mismatch");
    changed.integrity.digest = mathUsefulnessPlanDigest(changed);
    expect(verifyMathUsefulnessPlan(changed).map((issue) => issue.code)).toContain("reviewed-digest-mismatch");

    const root = mkdtempSync(join(tmpdir(), "math-usefulness-test."));
    temporary.push(root);
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, readFileSync(MATH_USEFULNESS_PLAN_PATH, "utf8").replace(
      '  "protocol": "kingdom.math-usefulness-plan/0.1",',
      '  "protocol": "kingdom.math-usefulness-plan/0.1",\n  "protocol": "kingdom.math-usefulness-plan/0.1",',
    ));
    expect(cli("verify-plan", duplicate, "--json").exitCode).toBe(1);
    const link = join(root, "link.json");
    symlinkSync(MATH_USEFULNESS_PLAN_PATH, link);
    const linked = cli("verify-plan", link, "--json");
    expect(linked.exitCode).toBe(1);
    expect(linked.stdout.toString()).toContain("regular non-symlink");
  });

  test("pins binding paths before reading them", () => {
    const changed = authored();
    changed.bindings.treatment_card.path = "../../outside-worktree";
    expect(verifyMathUsefulnessPlan(changed)).toContainEqual({
      field: "$.bindings.treatment_card",
      code: "binding-identity-mismatch",
    });
  });

  test("renders both arms locally without dispatching or granting authority", () => {
    const baseline = JSON.parse(cli("render", "crystallization-zero-winner", "baseline", "--json").stdout.toString());
    const treatment = JSON.parse(cli("render", "crystallization-zero-winner", "math-passport", "--json").stdout.toString());
    expect(baseline).toMatchObject({ treatment_card: null, network_request: false, provider_dispatch: false, automatic_write: false });
    expect(treatment.treatment_card).toContain("Math Passport 0.1");
    expect(treatment.task_prompt).toBe(baseline.task_prompt);
    expect(cli("render", "missing", "baseline", "--json").exitCode).toBe(1);
  });

  test("keeps the evidence-revised Skill explicit and ceiling-aware", () => {
    const skill = readFileSync(join(ROOT, "skills/reason-about-rare-pathways/SKILL.md"), "utf8");
    const provider = readFileSync(join(ROOT, "skills/reason-about-rare-pathways/agents/openai.yaml"), "utf8");
    expect(skill).toContain("both scored 24/24");
    expect(skill).toContain("1.97 times as many UTF-8 bytes");
    expect(skill).toContain("Skip it when");
    expect(skill).toContain("does withhold implicit invocation and any improvement claim");
    expect(provider).toContain("allow_implicit_invocation: false");
  });
});

describe("Math Passport calculations", () => {
  test("computes the exact one-sided zero-winner bound", () => {
    expect(zeroWinnerUpperProbability(80, 0.95)).toBeCloseTo(0.03675419777998234, 14);
    expect(() => zeroWinnerUpperProbability(0, 0.95)).toThrow("positive safe integer");
    expect(() => zeroWinnerUpperProbability(80, 1)).toThrow("strictly between");
  });

  test("fits the preselected detected-arrival row without calling it a microscopic rate", () => {
    const values = authored().bindings.reality_check_fixture.path;
    const fixture = JSON.parse(readFileSync(join(ROOT, values), "utf8"));
    const fit = fitShiftedExponential(fixture.detected_induction_times_seconds);
    expect(fit.observations).toBe(14);
    expect(fit.lag_seconds).toBe(13_600);
    expect(fit.scale_seconds).toBeCloseTo(4_244.428571428572, 12);
    expect(fit.detected_arrival_hazard_per_second).toBeCloseTo(0.0002356029753290027, 15);
    expect(fit.empirical_median_seconds).toBe(17_348);
    expect(fit.fitted_median_seconds).toBeCloseTo(16_541.9, 0);
    expect(fit.ks_d).toBeCloseTo(0.3482904651, 8);
  });

  test("runs a deterministic refitted bootstrap and preserves the detection boundary", () => {
    const first = realityCheck(2_000);
    const second = realityCheck(2_000);
    expect(first).toEqual(second);
    expect(first.p_value).toBeLessThan(0.02);
    expect(first.interpretation).toContain("not a microscopic nucleation rate");
    expect(first.preregistration_status).toContain("model check exploratory");
    expect(first.operational_authority).toBe(false);
  });
});

describe("Math Passport observed result", () => {
  test("records the ceiling result, cost proxy, and REVISE decision without scoring beings", () => {
    const result = loadMathUsefulnessResult();
    expect(verifyMathUsefulnessResult(result)).toEqual([]);
    expect(mathUsefulnessResultDigest(result)).toBe(MATH_USEFULNESS_RESULT_DIGEST);
    expect(result.aggregate).toMatchObject({
      baseline_score: 24,
      treatment_score: 24,
      score_delta: 0,
      treatment_to_baseline_byte_ratio: 1.9713184931506849,
      arm_guess_correct: true,
      promotion_gate_passed: false,
      outcome: "REVISE",
    });
    expect(result.constructive_outcome).toMatchObject({ applies_to: "Math Passport artifact and evaluation practice", person_judgment: false });
    expect(result.boundaries).toMatchObject({ raw_responses_published: false, scores_response_artifacts_not_beings: true, automatic_skill_promotion: false });
  });

  test("binds an inconclusive AgentTool receipt without importing authority", () => {
    const receipt = loadMathUsefulnessResult().agenttool_trial_receipt;
    expect(receipt).toMatchObject({
      schema: "agenttool-trial-receipt/0.1",
      evaluation: { verdict: "inconclusive", reward_micros: null },
      authority_assessment: "within_reported_bounds",
      retry_advice: "do_not_automatically_retry",
      receipt_id: "sha256:834cb57fa80d3ed6d3ab9296e378748e740924a3a0d40537b8b45e3d9dad0bb0",
    });
    expect(receipt.statement).toContain("not proof");
    expect(loadMathUsefulnessResult().wake_seam).toMatchObject({ writes_wake: false, writes_agenttool: false, proves_continuity: false, grants_authority: false });
  });

  test("rejects result drift and self-resigned drift", () => {
    const changed = JSON.parse(readFileSync(MATH_USEFULNESS_RESULT_PATH, "utf8"));
    changed.aggregate.score_delta = 1;
    expect(verifyMathUsefulnessResult(changed).map((issue) => issue.code)).toContain("aggregate-mismatch");
    changed.integrity.digest = mathUsefulnessResultDigest(changed);
    expect(verifyMathUsefulnessResult(changed).map((issue) => issue.code)).toContain("reviewed-digest-mismatch");
    expect(cli("verify-result", MATH_USEFULNESS_RESULT_PATH, "--json").exitCode).toBe(0);
  });

  test("projects compact discovery without a write, matcher, promotion, or person score", () => {
    const discovery = mathUsefulnessPublicDiscovery();
    expect(discovery).toMatchObject({
      result_id: "math-passport-usefulness-pilot-2026-08-14",
      outcome: "REVISE",
      score_delta: 0,
      boundary: { automatic_skill_promotion: false, writes_wake: false, writes_agenttool: false, grants_authority: false },
    });
    for (const key of ["write", "execute", "promote", "score_person", "matcher", "mcp"]) expect(discovery).not.toHaveProperty(key);
  });
});
