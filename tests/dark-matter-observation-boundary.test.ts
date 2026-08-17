import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateSemanticTransition,
  type SemanticTransitionReceipt,
} from "../bin/semantic-transitions.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PATH = join(ROOT, "bridges/examples/dark-matter-observation-to-latent-hypothesis.json");
const receipt = JSON.parse(readFileSync(PATH, "utf8")) as SemanticTransitionReceipt;
const copy = () => structuredClone(receipt) as any;
const AS_OF = { asOf: "2026-08-16" };

describe("dark-matter observation boundary", () => {
  test("keeps reported effects separate from an inferred latent interpretation", () => {
    expect(() => validateSemanticTransition(receipt, AS_OF)).not.toThrow();
    expect(receipt.source).toMatchObject({
      statement_kind: "observation",
      epistemic_access: "reported",
      expression_origin: "translated",
    });
    expect(receipt.target).toMatchObject({
      statement_kind: "interpretation",
      epistemic_access: "inferred",
      expression_origin: "generated",
    });
    expect(receipt.transition.kind).toBe("infer");
    expect(receipt.transition.introduced_assumptions.length).toBeGreaterThanOrEqual(3);
  });

  test("carries model losses, alternatives, bounded evidence, and a stop condition", () => {
    expect(receipt.transition.loss_assessment.status).toBe("losses-declared");
    expect(receipt.transition.discarded_structure.map((entry) => entry.name)).toEqual([
      "physical-dynamics",
      "empirical-authority",
      "unique-latent-cause",
    ]);
    expect(receipt.warrant.evidence.find((entry) => entry.id === "lz-null-search")?.role).toBe("supports");
    expect(receipt.warrant.known_limits.some((limit) => limit.includes("No cited result establishes"))).toBe(true);
    expect(receipt.transition.counterexample).toContain("mismatch is labeled a lie");
    expect(receipt.transition.stop_condition).toContain("person-level inference");
  });

  test("treats a null channel as a bounded constraint rather than universal absence", () => {
    const relation = receipt.transition.preserved_relations.find((entry) => entry.name === "null-region-boundary");
    expect(relation).toBeDefined();
    expect(relation!.source_form).toContain("parameter region");
    expect(relation!.source_form).toContain("rather than disproving dark matter");
    expect(relation!.target_form).toContain("rather than proving absence");
  });

  test("rejects silent promotion and removal of the declared inference basis", () => {
    const promoted = copy();
    promoted.target.epistemic_access = "direct";
    expect(() => validateSemanticTransition(promoted, AS_OF)).toThrow(
      "requires distinct new supporting evidence",
    );

    const assumptionless = copy();
    assumptionless.transition.introduced_assumptions = [];
    expect(() => validateSemanticTransition(assumptionless, AS_OF)).toThrow(
      "must declare its introduced assumption",
    );
  });

  test("keeps all non-grants false and never turns structure into a person judgment", () => {
    expect(Object.values(receipt.safety)).toEqual([false, false, false, false, false, false]);
    for (const key of ["proves_truth", "infers_intent", "rates_people"] as const) {
      const unsafe = copy();
      unsafe.safety[key] = true;
      expect(() => validateSemanticTransition(unsafe, AS_OF)).toThrow(`${key} must remain false`);
    }
  });
});
