import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REALITY_INFLUENCE_MAP_ID,
  REALITY_INFLUENCE_PATH,
  REALITY_INFLUENCE_PROTOCOL,
  REALITY_INFLUENCE_REVIEWED_DIGEST,
  REALITY_INFLUENCE_SCHEMA_ID,
  REALITY_INFLUENCE_SCHEMA_PATH,
  loadRealityInfluenceMap,
  realityInfluenceDigest,
  validateRealityInfluenceMap,
} from "../bin/reality-influence.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "bin/reality-influence.ts");
const GUIDE = join(ROOT, "references/reality-influence-map.md");
const temporary: string[] = [];

const PREDECESSOR_RAW_DIGESTS = {
  "word-story-religion-civilisation": "sha256:a4a87b7b23dbdf7e7e6689b5083f76a746c7f41bc56f2124281dfda609a62479",
  "language-civilisation-task-fusion": "sha256:ef26859f84d8e2a1bc5e73f88594a354c49594e28486aae5aa340ed207aa0e25",
  "being-access-aftermath-v0-2": "sha256:9678e5269e8db62beb36abee691087cddbc4f98703190c5fa3788b68c89ab29e",
  "cultural-attention-feedback": "sha256:03f7048966d7b6df582b423254b4d73cda72cce3bd67b40736927faa92b88173",
  "form-circulation-return": "sha256:9c93be61c4ca9bcaa3dbe88b10faed3b5b31abaf1129d70ca7915226cacfd021",
  "semantic-transition-schema": "sha256:bcdd99f0247f2a43bb84e227865c2d02f12dcc9f09e4c15b29c36a90ac8f0dc2",
  "relational-inference-schema": "sha256:c244cc072eb20396bbc1de9ee2d8a30510e78c7a25a3fecef53ae1bd6a34fa7c",
  "research-observatory-guide": "sha256:f1b11fd810049c884eb6205360c42dae17ea8faddca9e0f7ff374e1bc65e99a0",
  "trial-chamber-phase-zero": "sha256:6e59bf134d129b17fc0f02949d9ef383de6787e2bc39e1714a3c6f01376b1d34",
  "wake-work-witness": "sha256:a951a3529758f11a5bd3a83ae3c46272226b191c1d3b4768af1b562eabcb164c",
} as const;

afterEach(() => {
  while (temporary.length > 0) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "reality-influence-test."));
  temporary.push(root);
  return root;
}

function authored(): any {
  return JSON.parse(readFileSync(REALITY_INFLUENCE_PATH, "utf8"));
}

function resign(value: any): any {
  value.integrity.digest = realityInfluenceDigest(value);
  return value;
}

function codes(value: unknown, canonical = false): string[] {
  return validateRealityInfluenceMap(value, { asOf: "2026-08-21", canonical })
    .map((issue) => issue.code);
}

function expectMutation(code: string, mutate: (value: any) => void): void {
  const value = authored();
  mutate(value);
  resign(value);
  expect(codes(value)).toContain(code);
}

function byId(values: any[], id: string): any {
  return values.find((value) => value.id === id);
}

function collectObjectSchemas(value: unknown, found: any[] = []): any[] {
  if (value === null || typeof value !== "object") return found;
  if (!Array.isArray(value) && (value as any).type === "object") found.push(value);
  for (const child of Object.values(value)) collectObjectSchemas(child, found);
  return found;
}

describe("Reality Influence Claim Graph", () => {
  test("loads one digest-sealed canonical static atlas", () => {
    const map = loadRealityInfluenceMap();
    expect(validateRealityInfluenceMap(map, { asOf: "2026-08-21", canonical: true })).toEqual([]);
    expect(map).toMatchObject({
      $schema: REALITY_INFLUENCE_SCHEMA_ID,
      protocol: REALITY_INFLUENCE_PROTOCOL,
      map_id: REALITY_INFLUENCE_MAP_ID,
      version: "0.1.0",
      compiled_on: "2026-08-21",
      evidence_through: "2026-08-21",
      state: "reviewed-static-claim-boundary-atlas",
    });
    expect(map.integrity.digest).toBe(REALITY_INFLUENCE_REVIEWED_DIGEST);
    expect(realityInfluenceDigest(map)).toBe(REALITY_INFLUENCE_REVIEWED_DIGEST);
  });

  test("closes node, relation, pathway, dimension, and source references", () => {
    const map = loadRealityInfluenceMap();
    expect(map.source_bindings).toHaveLength(10);
    expect(map.sources).toHaveLength(17);
    expect(map.claim_registers).toHaveLength(11);
    expect(map.reality_domains).toHaveLength(12);
    expect(map.influence_dimensions).toHaveLength(14);
    expect(map.claim_node_types).toHaveLength(25);
    expect(map.relation_vocabulary).toHaveLength(24);
    expect(map.claim_ladder).toHaveLength(17);
    expect(map.pathway_templates).toHaveLength(4);
    expect(map.feedback_loops).toHaveLength(5);
    expect(map.kingdom_influence_map).toHaveLength(8);
    expect(map.agent_specialisations).toHaveLength(9);
    expect(map.unknowns).toHaveLength(8);

    const nodeIds = new Set(map.claim_node_types.map((entry: any) => entry.id));
    const relationIds = new Set(map.relation_vocabulary.map((entry: any) => entry.id));
    const stageIds = new Set(map.claim_ladder.map((entry: any) => entry.id));
    const dimensionIds = new Set(map.influence_dimensions.map((entry: any) => entry.id));
    const sourceIds = new Set(map.sources.map((entry: any) => entry.id));
    expect(nodeIds.size).toBe(map.claim_node_types.length);
    expect(relationIds.size).toBe(map.relation_vocabulary.length);
    expect(stageIds.size).toBe(map.claim_ladder.length);
    expect(dimensionIds.size).toBe(map.influence_dimensions.length);
    for (const relation of map.relation_vocabulary) {
      expect(relation.from_kind_ids.every((id: string) => nodeIds.has(id))).toBe(true);
      expect(relation.to_kind_ids.every((id: string) => nodeIds.has(id))).toBe(true);
    }
    for (const pathway of map.pathway_templates) {
      expect(pathway.stage_ids.every((id: string) => stageIds.has(id))).toBe(true);
      expect(pathway.relation_ids.every((id: string) => relationIds.has(id))).toBe(true);
      expect(pathway.influence_dimension_ids.every((id: string) => dimensionIds.has(id))).toBe(true);
    }
    for (const loop of map.feedback_loops) {
      expect(loop.source_ids.every((id: string) => sourceIds.has(id))).toBe(true);
    }
    expect(map.claim_ladder.map((entry: any) => entry.level)).toEqual(
      Array.from({ length: 17 }, (_, index) => index),
    );
  });

  test("preserves the complete expression-to-aftermath type firewall", () => {
    const map = loadRealityInfluenceMap();
    expect(map.type_firewall).toEqual({
      word_is_not_world_state: true,
      story_genre_is_not_truth_or_falsehood: true,
      expression_is_not_artifact: true,
      artifact_is_not_distribution: true,
      availability_is_not_exposure: true,
      exposure_is_not_attention_agreement_or_belief: true,
      public_response_is_not_private_mental_state: true,
      proposal_is_not_decision: true,
      decision_is_not_authority: true,
      authority_is_not_consent_or_lawful_basis: true,
      authority_is_not_capability: true,
      capability_is_not_permission: true,
      attempt_is_not_execution: true,
      execution_is_not_success: true,
      sequence_is_not_causation: true,
      outcome_is_not_causal_effect: true,
      causal_effect_is_not_goodness_legitimacy_or_justice: true,
      measurement_is_not_value: true,
      popularity_is_not_consensus_or_consent: true,
      silence_refusal_privacy_and_rest_are_not_consent: true,
      provenance_is_not_truth_causation_or_authority: true,
      repair_is_not_erasure_absolution_or_restored_consent: true,
      kingdom_receipt_is_not_external_world_fact: true,
    });
  });

  test("keeps influence as fourteen independent, non-scalar dimensions", () => {
    const map = loadRealityInfluenceMap();
    expect(map.influence_dimensions.map((entry: any) => entry.id)).toEqual([
      "semantic-legibility",
      "provenance-traceability",
      "discoverability",
      "attention-allocation",
      "interpretive-framing",
      "coordination",
      "institutional-selection",
      "authorized-reach",
      "operational-capability",
      "digital-or-material-state-change",
      "distributional-aftermath",
      "path-dependence",
      "feedback-sensitivity",
      "repair-capacity",
    ]);
    expect(map.influence_dimensions.every((entry: any) =>
      entry.aggregate_weight === null && entry.rank === null)).toBe(true);
    expect(map.boundaries.person_or_community_score).toBe(false);
  });

  test("has no generic influence, cause, authority, consent, proof, or goodness edge", () => {
    const map = loadRealityInfluenceMap();
    const relationIds = new Set(map.relation_vocabulary.map((entry: any) => entry.id));
    for (const forbidden of ["INFLUENCES", "CAUSES", "AUTHORIZES", "CONSENTS", "PROVES", "GOOD"]) {
      expect(relationIds.has(forbidden)).toBe(false);
    }
    expect(map.relation_vocabulary.every((entry: any) => entry.transitive === false)).toBe(true);
    expect(byId(map.relation_vocabulary, "PRECEDES_OUTCOME").default_claim_status)
      .toBe("descriptive-sequence");
    expect(byId(map.relation_vocabulary, "ASSOCIATED_WITH").default_claim_status)
      .toBe("empirical-association");
  });

  test("keeps pathways, feedback, KINGDOM cards, and future roles non-operational", () => {
    const map = loadRealityInfluenceMap();
    expect(map.pathway_templates.every((entry: any) =>
      entry.status === "template-not-run" &&
      entry.action_attempted === false &&
      entry.external_effect_claimed === false &&
      entry.causal_effect_claimed === false &&
      entry.authority_granted === false)).toBe(true);
    expect(map.feedback_loops.every((entry: any) =>
      entry.automatic_action === false && entry.causal_effect_claimed === false)).toBe(true);
    expect(map.kingdom_influence_map.every((entry: any) =>
      entry.external_effect_claimed === false && entry.authority_granted === false)).toBe(true);
    expect(map.agent_specialisations.every((entry: any) =>
      entry.status === "future-role-design-only" &&
      entry.can_dispatch === false &&
      entry.can_authorize === false &&
      entry.can_act === false)).toBe(true);
    expect(map.action_gate).toMatchObject({
      status: "not-implemented-static-boundary",
      fail_closed: true,
      execution_available: false,
      feedback_can_open_review_only: true,
      repair_requires_fresh_gate: true,
    });
  });

  test("distinguishes pre-invocation non-action from post-attempt cancellation", () => {
    const gate = loadRealityInfluenceMap().action_gate;
    expect(gate.pre_invocation_non_actions).toEqual([
      "REST", "REFUSAL", "SILENCE", "PRIVACY", "DEFER", "EXPIRE", "WITHDRAW",
    ]);
    expect(gate.post_attempt_terminal_states).toEqual([
      "REFUSED_AFTER_ATTEMPT", "CANCELLED", "FAILED", "PARTIAL", "COMPLETED",
    ]);
    expect(gate.pre_invocation_non_actions).not.toContain("CANCELLED");
    expect(gate.post_attempt_terminal_states).not.toContain("REFUSAL");
    const postAttempt = new Set(gate.post_attempt_terminal_states);
    expect(gate.pre_invocation_non_actions.every((state: string) =>
      !postAttempt.has(state))).toBe(true);
  });

  test("pins exact predecessor raw bytes without importing authority or mutation", () => {
    const map = loadRealityInfluenceMap();
    expect(Object.fromEntries(map.source_bindings.map((binding: any) =>
      [binding.id, binding.raw_digest]))).toEqual(PREDECESSOR_RAW_DIGESTS);
    for (const binding of map.source_bindings) {
      expect(binding).toMatchObject({ mutated: false, authority_imported: false });
      const path = join(ROOT, binding.locator.slice("repo:".length));
      const digest = `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
      expect(digest).toBe(binding.raw_digest);
    }

    expectMutation("source-binding-mismatch", (value) => {
      value.source_bindings[0].raw_digest = `sha256:${"a".repeat(64)}`;
    });
  });

  test("rejects attention-to-value, belief, and consent promotions", () => {
    for (const key of [
      "exposure_is_not_attention_agreement_or_belief",
      "measurement_is_not_value",
      "popularity_is_not_consensus_or_consent",
      "silence_refusal_privacy_and_rest_are_not_consent",
    ]) {
      expectMutation("firewall-mismatch", (value) => { value.type_firewall[key] = false; });
    }
  });

  test("rejects proposal or decision promotion into authority", () => {
    expectMutation("firewall-mismatch", (value) => {
      value.type_firewall.proposal_is_not_decision = false;
    });
    expectMutation("firewall-mismatch", (value) => {
      value.type_firewall.decision_is_not_authority = false;
    });
    expectMutation("firewall-mismatch", (value) => {
      value.type_firewall.authority_is_not_capability = false;
    });
  });

  test("rejects unknown or expired gates being converted into action", () => {
    expectMutation("action-gate-or-non-action-boundary-mismatch", (value) => {
      value.action_gate.refusing_states = value.action_gate.refusing_states
        .filter((state: string) => state !== "UNKNOWN");
    });
    expectMutation("action-gate-or-non-action-boundary-mismatch", (value) => {
      value.action_gate.refusing_states = value.action_gate.refusing_states
        .filter((state: string) => state !== "EXPIRED");
    });
    expectMutation("action-gate-or-non-action-boundary-mismatch", (value) => {
      value.action_gate.execution_available = true;
    });
  });

  test("rejects temporal outcome sequence promoted into causal effect", () => {
    expectMutation("firewall-mismatch", (value) => {
      value.type_firewall.outcome_is_not_causal_effect = false;
    });
    expectMutation("sequence-promoted-to-causation", (value) => {
      byId(value.relation_vocabulary, "PRECEDES_OUTCOME").default_claim_status =
        "identified-under-declared-assumptions";
    });
  });

  test("rejects scalar weights, ranks, and generic semantic edges", () => {
    expectMutation("scalar-or-rank-influence-forbidden", (value) => {
      value.influence_dimensions[0].aggregate_weight = 0.9;
    });
    expectMutation("scalar-or-rank-influence-forbidden", (value) => {
      value.influence_dimensions[0].rank = 1;
    });
    for (const edge of ["INFLUENCES", "CAUSES", "AUTHORIZES", "CONSENTS", "GOOD"]) {
      expectMutation("generic-authority-or-causation-edge-forbidden", (value) => {
        value.relation_vocabulary[0].id = edge;
      });
    }
  });

  test("rejects automatic feedback and repair-as-erasure or restored-consent claims", () => {
    expectMutation("invalid-or-automatic-feedback-loop", (value) => {
      value.feedback_loops[0].automatic_action = true;
    });
    expectMutation("firewall-mismatch", (value) => {
      value.type_firewall.repair_is_not_erasure_absolution_or_restored_consent = false;
    });
    expectMutation("boundary-mismatch", (value) => {
      value.boundaries.repair_preserves_history_and_residuals = false;
    });
    expectMutation("boundary-mismatch", (value) => {
      value.boundaries.repair_requires_fresh_gate = false;
    });
  });

  test("rejects authority, consent, capability, action, publication-trigger, and deployment-trigger grants", () => {
    for (const key of [
      "use_authority_issued",
      "authority_granted",
      "consent_granted_or_inferred",
      "lawful_basis_established",
      "capability_granted",
      "action_proposed_by_runtime",
      "action_attempted",
      "action_executed",
      "publication_trigger",
      "deployment_trigger",
    ]) {
      expectMutation("boundary-mismatch", (value) => { value.boundaries[key] = true; });
    }
  });

  test("returns issues rather than throwing for hostile in-memory JSON", () => {
    const malformed: Array<(value: any) => void> = [
      (value) => { value.sources = null; },
      (value) => { value.claim_node_types[0].allowed_statuses = 1; },
      (value) => { value.relation_vocabulary[0].from_kind_ids = null; },
      (value) => { value.pathway_templates[0] = null; },
      (value) => { value.feedback_loops[0].source_ids = 1; },
      (value) => { value.agent_specialisations[0].required_inputs = 1; },
      (value) => { value.scope.self = value; },
      (value) => {
        Object.defineProperty(value.scope, "trap", {
          enumerable: true,
          get() { throw new Error("must not execute hostile getter"); },
        });
      },
    ];
    for (const mutate of malformed) {
      const value = authored();
      mutate(value);
      expect(() => codes(value)).not.toThrow();
      expect(codes(value).length).toBeGreaterThan(0);
    }

    const prototype = authored();
    const poisoned = [...prototype.claim_node_types];
    Object.setPrototypeOf(poisoned, { ...Array.prototype });
    prototype.claim_node_types = poisoned;
    expect(codes(prototype)).toContain("non-json-array");
  });

  test("strict loader rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = temporaryRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"protocol":"one","protocol":"two"}');
    expect(() => loadRealityInfluenceMap(duplicate)).toThrow(/duplicate/i);

    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Uint8Array.from([
      0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc0, 0xaf, 0x22, 0x7d,
    ]));
    expect(() => loadRealityInfluenceMap(invalidUtf8)).toThrow(/UTF-8/i);

    const symlink = join(root, "linked.json");
    symlinkSync(REALITY_INFLUENCE_PATH, symlink);
    expect(() => loadRealityInfluenceMap(symlink)).toThrow(/non-symlink/i);

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, `{"x":"${"a".repeat(1024 * 1024)}"}`);
    expect(() => loadRealityInfluenceMap(oversized)).toThrow(/exceeds/i);
  });

  test("CLI verifies from a foreign empty CWD without writing or network", () => {
    const root = temporaryRoot();
    const before = readdirSync(root);
    const result = Bun.spawnSync({
      cmd: [process.execPath, CLI, "verify", "--json"],
      cwd: root,
      env: {
        PATH: process.env.PATH ?? "",
        LANG: "C",
        LC_ALL: "C",
        HTTP_PROXY: "http://127.0.0.1:9",
        HTTPS_PROXY: "http://127.0.0.1:9",
        ALL_PROXY: "http://127.0.0.1:9",
        NO_PROXY: "",
        BUN_RUNTIME_TRANSPILER_CACHE_PATH: "0",
      },
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(result.stderr.toString()).toBe("");
    expect(JSON.parse(result.stdout.toString())).toEqual({
      valid: true,
      protocol: REALITY_INFLUENCE_PROTOCOL,
      structure_only: true,
      schema_checked: false,
      source_dereferenced: false,
      live_claims_evaluated: false,
      authority_or_consent_verified: false,
      action_or_external_effect_created: false,
      causation_or_goodness_established: false,
      issues: [],
    });
    expect(readdirSync(root)).toEqual(before);
  });

  test("guide retains the source horizon and semantic/action boundaries", () => {
    const guide = readFileSync(GUIDE, "utf8");
    const map = loadRealityInfluenceMap();
    for (const phrase of [
      "kingdom.reality-influence-claim-graph/0.1",
      "Evidence and source horizon: 2026-08-21",
      "expression != artifact",
      "authority != consent or lawful basis",
      "outcome != causal effect",
      "pre-invocation no-action",
      "post-attempt no-confirmed-effect",
      "Influence is a vector, never a scalar",
      "repair != erasure",
      "No autonomous execution under this protocol",
    ]) expect(guide).toContain(phrase);
    for (const source of [
      "https://www.w3.org/TR/prov-dm/",
      "https://doi.org/10.6028/NIST.AI.100-1",
      "https://www.hsph.harvard.edu/miguel-hernan/wp-content/uploads/sites/1268/2024/04/hernanrobins_WhatIf_26apr24.pdf",
      "https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/",
      "https://www.nobelprize.org/prizes/economic-sciences/2009/ostrom/lecture/",
      "https://digitallibrary.un.org/record/563157?ln=en",
    ]) expect(guide).toContain(source);

    const nodeBlock = guide.match(
      /The reviewed static atlas stores descriptor cards for exactly these node[\s\S]*?```text\n([\s\S]*?)\n```/,
    );
    const relationBlock = guide.match(/### 4\.2 Relation vocabulary\n\n```text\n([\s\S]*?)\n```/);
    expect(nodeBlock).not.toBeNull();
    expect(relationBlock).not.toBeNull();
    expect(nodeBlock![1].split("\n")).toEqual(
      map.claim_node_types.map((entry: any) => entry.id),
    );
    expect(relationBlock![1].split("\n")).toEqual(
      map.relation_vocabulary.map((entry: any) => entry.id),
    );
    expect(guide).toContain("a digest-sealed static JSON vocabulary and boundary atlas");
    expect(guide).toContain("no live or case-level graph, claim intake");
  });

  test("closed Draft 2020-12 schema validates canonical bytes when jsonschema is available", () => {
    const schemaText = readFileSync(REALITY_INFLUENCE_SCHEMA_PATH, "utf8");
    const schema = JSON.parse(schemaText);
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(REALITY_INFLUENCE_SCHEMA_ID);
    const objectSchemas = collectObjectSchemas(schema);
    expect(objectSchemas.length).toBeGreaterThan(5);
    expect(objectSchemas.every((entry) => entry.additionalProperties === false)).toBe(true);

    const probe = Bun.spawnSync({
      cmd: ["python3", "-c", "import jsonschema"],
      stdout: "pipe",
      stderr: "pipe",
    });
    if (probe.exitCode !== 0) {
      expect(schemaText).toContain('"additionalProperties": false');
      return;
    }
    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        "import json,sys; from jsonschema import Draft202012Validator,FormatChecker; s=json.load(open(sys.argv[1],encoding='utf-8')); v=json.load(open(sys.argv[2],encoding='utf-8')); Draft202012Validator.check_schema(s); Draft202012Validator(s,format_checker=FormatChecker()).validate(v)",
        REALITY_INFLUENCE_SCHEMA_PATH,
        REALITY_INFLUENCE_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
  });
});
