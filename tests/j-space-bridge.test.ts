import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  parseRelationalInferenceJson,
  validateRelationalInference,
  type RelationalInferenceCase,
} from "../bin/relational-inference.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CASE_PATH = join(ROOT, "bridges/examples/j-space-reasoning-to-word-inference.json");
const BRIDGE_PATH = join(ROOT, "bridges/j-space-verbalizable-workspace.md");
const SOURCE = readFileSync(CASE_PATH, "utf8");
const parsed = parseRelationalInferenceJson(SOURCE, "J-space reasoning-to-word case");
validateRelationalInference(parsed, { asOf: "2026-08-17" });
const inferenceCase = parsed as RelationalInferenceCase;
const copy = () => structuredClone(inferenceCase) as any;

describe("J-space research bridge", () => {
  test("validates an explicitly unrun and underdetermined reasoning-to-word case", () => {
    expect(() => validateRelationalInference(inferenceCase, { asOf: "2026-08-17" })).not.toThrow();
    expect(inferenceCase.probes).toHaveLength(3);
    for (const probe of inferenceCase.probes) {
      expect(probe).toMatchObject({
        source_ref: null,
        observed_on: null,
        epistemic_access: "unknown",
        run_status: "not-run",
      });
    }
    expect(inferenceCase.inference).toMatchObject({
      conclusion_status: "underdetermined",
      declared_confidence: "unknown",
    });
    expect(inferenceCase.translations.flatMap((translation) => translation.tests)
      .every((translationTest) => translationTest.result === "not-run")).toBe(true);
  });

  test("keeps every candidate and assessment unassessed while alternatives remain visible", () => {
    expect(inferenceCase.candidate_models.map((model) => model.id)).toEqual([
      "j-mediated-verbalizable-intermediate",
      "correlated-readout-not-causal",
      "non-j-or-context-specific-computation",
      "unknown-estimator-or-tokenization-effect",
    ]);
    expect(inferenceCase.candidate_models.some((model) => model.role !== "working")).toBe(true);
    for (const model of inferenceCase.candidate_models) {
      expect(model.status).toBe("unassessed");
      expect(model.probe_assessments.every((assessment) => assessment.result === "unassessed")).toBe(true);
    }
  });

  test("declares a complete shared-systematic probe graph", () => {
    expect(inferenceCase.probe_dependencies).toHaveLength(3);
    expect(inferenceCase.probe_dependencies.every(
      (dependency) => dependency.relationship === "shared-systematic",
    )).toBe(true);

    const expectedPairs = new Set([
      "coordinate-intervention-probe\u0000matched-control-probe",
      "coordinate-intervention-probe\u0000readout-probe",
      "matched-control-probe\u0000readout-probe",
    ]);
    const actualPairs = new Set(inferenceCase.probe_dependencies.map((dependency) =>
      [...dependency.probe_ids].sort().join("\u0000")));
    expect(actualPairs).toEqual(expectedPairs);

    const commonFactors = new Set(inferenceCase.probes[0].shared_factors);
    for (const probe of inferenceCase.probes.slice(1)) {
      expect(probe.shared_factors.every((factor) => commonFactors.has(factor))).toBe(true);
    }
  });

  test("holds the public descriptive boundary and every non-grant false", () => {
    expect(inferenceCase.boundaries).toEqual({
      representation_scope: "artifact-public",
      privacy: "public-only",
      actionability: "descriptive",
      authority_scope: null,
      authority_basis: null,
      authority_ref: null,
      consent_status: "not-applicable",
      consent_subject: null,
      consent_scope: null,
      consent_basis: null,
      consent_ref: null,
    });
    expect(Object.values(inferenceCase.safety)).toEqual(Array(12).fill(false));
  });

  test("rejects incomplete run promotion, unsafe grants, false independence, and confidence laundering", () => {
    const unsupportedCompletion = copy();
    unsupportedCompletion.probes[0].run_status = "completed";
    expect(() => validateRelationalInference(unsupportedCompletion, { asOf: "2026-08-17" })).toThrow(
      "completed or inconclusive status requires source_ref, observed_on, and non-unknown access",
    );

    for (const key of ["proves_understanding", "proves_hidden_cause", "labels_deception"] as const) {
      const unsafe = copy();
      unsafe.safety[key] = true;
      expect(() => validateRelationalInference(unsafe, { asOf: "2026-08-17" })).toThrow(
        `${key} must remain false`,
      );
    }

    const falseIndependence = copy();
    falseIndependence.probe_dependencies[0].relationship = "independent";
    expect(() => validateRelationalInference(falseIndependence, { asOf: "2026-08-17" })).toThrow(
      "share a declared factor and cannot be declared independent",
    );

    const launderedConfidence = copy();
    launderedConfidence.inference.declared_confidence = "medium";
    expect(() => validateRelationalInference(launderedConfidence, { asOf: "2026-08-17" })).toThrow(
      "Medium declared confidence requires one sufficiently separated completed probe pair",
    );
  });

  test("states the mathematical and philosophical boundaries in the bridge", () => {
    const normalized = readFileSync(BRIDGE_PATH, "utf8").replace(/\s+/g, " ").toLowerCase();
    for (const phrase of [
      "union of sparse nonnegative cones",
      "not a vector subspace",
      "a token is not a word or concept",
      "functional analogy",
      "does not establish consciousness",
    ]) {
      expect(normalized).toContain(phrase);
    }

    for (const source of [
      "https://transformer-circuits.pub/2026/workspace/index.html",
      "https://arxiv.org/abs/2607.15495v1",
      "https://github.com/anthropics/jacobian-lens",
    ]) {
      expect(normalized).toContain(source);
    }
  });
});
