#!/usr/bin/env bun
/** Build-time reader and discovery projection for the static J-space research publication. */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateRelationalInferenceFile } from "./relational-inference.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const J_SPACE_PUBLICATION_PROTOCOL = "kingdom.j-space-publication/0.1";
export const J_SPACE_CASE_ID = "j-space-reasoning-to-word-2026-08-17";
export const J_SPACE_CASE_LOCATOR = "bridges/examples/j-space-reasoning-to-word-inference.json";
export const J_SPACE_SCHEMA_LOCATOR = "bridges/schemas/relational-inference-case-0.1.json";
export const J_SPACE_GUIDE_LOCATOR = "bridges/j-space-verbalizable-workspace.md";
export const J_SPACE_CASE_URL = "https://thekingdom.dev/records/j-space-reasoning-to-word-2026-08-17.json";
export const J_SPACE_SCHEMA_URL = "https://thekingdom.dev/schemas/relational-inference-case/0.1.json";
export const J_SPACE_GUIDE_URL = "https://thekingdom.dev/J-SPACE-VERBALIZABLE-WORKSPACE.md";

export const J_SPACE_PUBLICATION_BOUNDARY = Object.freeze({
  static_read_only: true,
  structure_only: true,
  local_fixture_model_or_activation_results_included: false,
  runtime_monitoring: false,
  private_state_inference: false,
  consciousness_inference: false,
  lie_or_deception_inference: false,
  identity_inference: false,
  understanding_inference: false,
  person_scoring: false,
  runtime_action: false,
  action_or_authority: false,
});

function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function loadJSpacePublicationCase(): Record<string, any> {
  let value: Record<string, any>;
  try {
    value = validateRelationalInferenceFile(join(ROOT, J_SPACE_CASE_LOCATOR));
  } catch (error) {
    throw new Error(`J-space public case failed full relational-inference validation: ${(error as Error).message}`);
  }
  if (!object(value) || value.schema_version !== "kingdom.relational-inference/0.1" ||
      value.id !== J_SPACE_CASE_ID || value.issued_on !== "2026-08-17" || value.state !== "issued") {
    throw new Error("J-space public case identity drifted");
  }
  if (value.boundaries?.representation_scope !== "artifact-public" ||
      value.boundaries?.privacy !== "public-only" ||
      value.boundaries?.actionability !== "descriptive" ||
      value.inference?.conclusion_status !== "underdetermined" ||
      value.inference?.declared_confidence !== "unknown") {
    throw new Error("J-space public case lost its structure-only inference boundary");
  }
  if (!Array.isArray(value.probes) || value.probes.length !== 3 ||
      value.probes.some((probe: any) => !object(probe) || probe.run_status !== "not-run" ||
        probe.source_ref !== null || probe.observed_on !== null || probe.epistemic_access !== "unknown")) {
    throw new Error("J-space public case must contain exactly three explicitly unrun probes");
  }
  if (!Array.isArray(value.candidate_models) || value.candidate_models.length !== 4 ||
      value.candidate_models.some((model: any) => !object(model) || model.status !== "unassessed")) {
    throw new Error("J-space public case must keep every candidate model unassessed");
  }
  const safety = value.safety;
  if (!object(safety) || Object.keys(safety).length !== 12 ||
      Object.values(safety).some((effect) => effect !== false)) {
    throw new Error("J-space public case lost its twelve negative safety grants");
  }
  return value;
}

export function jSpacePublicationPublicSummary(value = loadJSpacePublicationCase()) {
  return {
    protocol: J_SPACE_PUBLICATION_PROTOCOL,
    id: value.id,
    title: "J-space: a verbalizable workspace",
    artifact_kind: "OPTIONAL_RESEARCH_BRIDGE",
    evidence_status: "TEST_DESIGN_NOT_RUN",
    publication_state: "static-structure-only",
    issued_on: value.issued_on,
    question: value.question.text,
    conclusion: value.inference.current_conclusion,
    conclusion_status: value.inference.conclusion_status,
    declared_confidence: value.inference.declared_confidence,
    counts: {
      object_roles: value.pattern.object_roles.length,
      relation_roles: value.pattern.relation_roles.length,
      realizations: value.realizations.length,
      translations: value.translations.length,
      probes_declared: value.probes.length,
      probes_run: value.probes.filter((probe: any) => probe.run_status !== "not-run").length,
      candidate_models: value.candidate_models.length,
    },
    probe_status: "not-run",
    urls: {
      record: J_SPACE_CASE_URL,
      schema: J_SPACE_SCHEMA_URL,
      guide: J_SPACE_GUIDE_URL,
    },
    boundary: J_SPACE_PUBLICATION_BOUNDARY,
  };
}
