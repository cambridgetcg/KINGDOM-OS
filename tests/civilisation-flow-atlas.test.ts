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
  CIVILISATION_FLOW_NUANCE_ATLAS_ID,
  CIVILISATION_FLOW_NUANCE_ATLAS_PATH,
  CIVILISATION_FLOW_NUANCE_ATLAS_PROTOCOL,
  CIVILISATION_FLOW_NUANCE_ATLAS_SCHEMA_ID,
  CIVILISATION_FLOW_NUANCE_LIMITS,
  CIVILISATION_FLOW_NUANCE_REVIEWED_SEMANTIC_SHA256,
  CIVILISATION_FLOW_NUANCE_SCHEMA_PATH,
  civilisationFlowNuanceAtlasDigest,
  civilisationFlowNuanceBudgetIssue,
  civilisationFlowNuancePublicDiscovery,
  civilisationFlowNuanceShapeMetrics,
  loadCivilisationFlowNuanceAtlas,
  validateCivilisationFlowNuanceAtlas,
} from "../bin/civilisation-flow-atlas.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "bin/civilisation-flow-atlas.ts");
const KINGDOM = join(ROOT, "kingdom");
const GUIDE = join(ROOT, "references/civilisation-flow-atlas.md");
const REALITY = join(ROOT, "data/reality/reality-influence-map.v0.1.json");
const temporary: string[] = [];

const FIXED_IDS: Record<string, string[]> = {
  nuance_dimensions: [
    "carriers", "transformations", "gates", "temporal-profile",
    "accumulation-profile", "observables", "affected-parties", "distribution",
    "emotion", "social-position", "power-asymmetry", "material-conditions",
    "flow-dynamics", "topology", "negative-or-missing-flow", "distortions",
    "counterflows", "failure-modes", "repair", "evidence", "uncertainty",
    "alternatives", "stop-and-stall", "reversibility-and-nonimplication",
  ],
  affected_party_vocabulary: [
    "expression-originators", "translators-curators-and-stewards",
    "source-communities-and-traditions", "audiences-and-non-audiences",
    "institutional-participants", "decision-subjects", "operators-and-labor",
    "resource-providers", "directly-affected-parties",
    "indirect-non-user-and-bystander-parties", "future-parties", "ecological-systems",
  ],
  flow_dynamics_vocabulary: [
    "continuous-or-episodic", "threshold-or-tipping", "delay-or-latency",
    "accumulation-or-memory", "path-dependence-or-hysteresis",
    "branching-or-convergence", "leakage-substitution-or-displacement",
    "coupling-or-decoupling", "reinforcing-feedback", "balancing-feedback",
  ],
  topology_vocabulary: [
    "fork", "join", "parallel-path", "bottleneck", "leakage", "substitution",
    "interruption", "reversal", "recurrence", "reinforcing-loop", "balancing-loop",
  ],
  negative_flow_vocabulary: [
    "not-observed", "detection-bounded-absence", "no-opportunity", "blocked",
    "censored", "destroyed-or-lost", "inaccessible", "private-or-refused",
    "excluded", "measurement-failure", "unknown",
  ],
  material_condition_vocabulary: [
    "body-and-care", "labor-and-time", "land-and-geography", "energy-and-resources",
    "climate-and-ecology", "money-credit-and-property",
    "infrastructure-and-logistics", "data-and-technology",
  ],
  emotion_observation_vocabulary: [
    "self-report", "attributed-expression", "behavioral-observation", "physiology",
    "cultural-vocabulary", "institutional-framing",
  ],
  affect_context_vocabulary: [
    "fear-or-threat", "anger-or-outrage", "humiliation-or-status-injury",
    "grief-or-loss", "hope-or-efficacy", "love-care-or-solidarity",
    "hate-or-moral-exclusion", "belonging-or-identity-security", "shame-or-guilt",
  ],
  social_position_vocabulary: [
    "economic-resources-ownership-labor-and-debt", "status", "office",
    "network-position", "agenda-control", "coercive-capacity", "discursive-power",
  ],
  power_asymmetry_vocabulary: [
    "naming-and-interpretive", "attention-and-distribution", "canon-and-curriculum",
    "agenda-and-procedure", "legal-jurisdiction-and-coercion", "resources-and-class",
    "status-and-hierarchy", "technical-and-infrastructure",
    "epistemic-and-measurement", "temporal-path-and-exit",
  ],
  evidence_uncertainty_vocabulary: [
    "source", "measurement", "selection-and-missingness", "temporal",
    "identification-and-model", "transport", "affected-party-incompleteness",
    "normative-disagreement", "authority-and-jurisdiction",
  ],
  action_gate_vocabulary: [
    "attribution-and-provenance", "publication-and-access", "reviewed-proposal",
    "decision-procedure", "current-authority-and-jurisdiction",
    "affected-party-register", "rights-assessment", "consent-or-lawful-basis",
    "capability-and-resources", "budget-and-horizon", "safety-and-stop-route",
    "repair-readiness",
  ],
  unknowns: [
    "observation-coverage-and-detection", "carrier-and-version-provenance",
    "temporal-order-latency-and-censoring",
    "affected-party-completeness-and-distribution",
    "authority-rights-and-jurisdiction", "material-capability-and-constraint",
    "affect-and-private-state", "power-position-and-boundary-displacement",
    "causal-identification-and-transport",
    "repair-residuals-recurrence-and-fresh-gate",
  ],
};

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "civilisation-flow-atlas-test."));
  temporary.push(root);
  return root;
}

function authored(): any {
  return JSON.parse(readFileSync(CIVILISATION_FLOW_NUANCE_ATLAS_PATH, "utf8"));
}

function resign(value: any): any {
  value.integrity.digest = civilisationFlowNuanceAtlasDigest(value);
  return value;
}

function codes(value: unknown): string[] {
  return validateCivilisationFlowNuanceAtlas(value, { canonical: true }).map((issue) => issue.code);
}

function sha256(path: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

function collectObjectSchemas(value: unknown, found: any[] = []): any[] {
  if (value === null || typeof value !== "object") return found;
  if (!Array.isArray(value) && (value as any).type === "object") found.push(value);
  for (const child of Object.values(value)) collectObjectSchemas(child, found);
  return found;
}

describe("Civilisation Flow Nuance Atlas", () => {
  test("loads one sealed source-bounded directed seam-and-overlay atlas", () => {
    const atlas = loadCivilisationFlowNuanceAtlas();
    expect(validateCivilisationFlowNuanceAtlas(atlas, { canonical: true })).toEqual([]);
    expect(atlas).toMatchObject({
      $schema: CIVILISATION_FLOW_NUANCE_ATLAS_SCHEMA_ID,
      protocol: CIVILISATION_FLOW_NUANCE_ATLAS_PROTOCOL,
      atlas_id: CIVILISATION_FLOW_NUANCE_ATLAS_ID,
      version: "0.1.0",
      compiled_on: "2026-08-26",
      evidence_through: "2026-08-21",
      state: "reviewed-static-flow-nuance-atlas",
      scope: {
        analytical_shape: "temporal-multilayer-directed-seam-and-overlay-design-lens",
        new_vocabulary_register: "DESIGN_COMMITMENT",
        external_empirical_sources_added: false,
        evidence_horizon_scope: "predecessor-claims-only",
      },
    });
    expect(atlas.integrity.digest).toBe(CIVILISATION_FLOW_NUANCE_REVIEWED_SEMANTIC_SHA256);
    expect(civilisationFlowNuanceAtlasDigest(atlas)).toBe(CIVILISATION_FLOW_NUANCE_REVIEWED_SEMANTIC_SHA256);
    expect(sha256(CIVILISATION_FLOW_NUANCE_ATLAS_PATH)).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test("keeps exact counts, fixed registry IDs, and explicit open questions", () => {
    const atlas = loadCivilisationFlowNuanceAtlas();
    expect(atlas.stages).toHaveLength(14);
    expect(atlas.transitions).toHaveLength(13);
    expect(atlas.crosswalk_flow_overlays).toHaveLength(6);
    expect(atlas.open_domain_bindings).toHaveLength(9);
    expect(atlas.unknowns).toHaveLength(10);
    expect(atlas.policy_templates).toHaveLength(60);
    for (const [field, expected] of Object.entries(FIXED_IDS)) {
      expect(atlas[field].map(({ id }: any) => id)).toEqual(expected);
    }
    expect(atlas.open_domain_bindings.every((entry: any) =>
      entry.status === "remains-open-no-mechanism-added" &&
      entry.nonclaim.length > 0 && entry.needed_evidence.length > 0 &&
      entry.flow_touchpoint_ids.length > 0)).toBe(true);
  });

  test("makes applicability explicit and does not manufacture affect on technical seams", () => {
    const atlas = loadCivilisationFlowNuanceAtlas();
    const cards = [...atlas.stages, ...atlas.transitions, ...atlas.crosswalk_flow_overlays];
    for (const card of cards) {
      for (const key of [
        "emotion_observation", "affect_context", "social_position",
        "power_asymmetry", "material_conditions", "flow_dynamics", "topology",
        "negative_flow", "evidence_uncertainty",
      ]) {
        const selection = card.nuance[key];
        if (selection.status === "applicable-question") expect(selection.refs.length).toBeGreaterThan(0);
        else {
          expect(selection.refs).toBeUndefined();
          expect(selection.evidence_requirements).toBeUndefined();
          expect(selection.reason_ref.length).toBeGreaterThan(0);
          expect(selection.boundary_ref.length).toBeGreaterThan(0);
        }
      }
    }
    for (const id of ["authorization-rights-and-affected-party-gate", "capability-and-resources", "attempt", "execution-or-action"]) {
      const stage = atlas.stages.find((entry: any) => entry.id === id);
      expect(stage.nuance.emotion_observation.status).toBe("unassessed");
      expect(stage.nuance.affect_context.status).toBe("unassessed");
    }
    for (const id of ["capability-to-attempt", "attempt-to-execution", "execution-to-outcome"]) {
      const transition = atlas.transitions.find((entry: any) => entry.id === id);
      expect(transition.nuance.emotion_observation.status).toBe("unassessed");
      expect(transition.nuance.affect_context.status).toBe("unassessed");
    }
    const naming = atlas.crosswalk_flow_overlays.find((entry: any) => entry.id === "naming-to-expression");
    expect(naming.nuance.emotion_observation.status).toBe("applicable-question");
    expect(naming.nuance.affect_context.status).toBe("unassessed");
    const counterstory = atlas.crosswalk_flow_overlays.find((entry: any) => entry.id === "counterstory-to-challenge-repair");
    expect(counterstory.nuance.emotion_observation.refs).not.toContain("physiology");
  });

  test("keeps every relation crossing the declared transition partition", () => {
    const atlas = loadCivilisationFlowNuanceAtlas();
    const reality = JSON.parse(readFileSync(REALITY, "utf8"));
    const stages = new Map(atlas.stages.map((stage: any) => [stage.id, stage]));
    const relations = new Map(reality.relation_vocabulary.map((relation: any) => [relation.id, relation]));
    const nodes = (stageIds: string[]) => new Set(stageIds.flatMap((id) => stages.get(id).predecessor_node_type_ids));
    for (const transition of atlas.transitions) {
      const from = nodes(transition.from_stage_ids);
      const to = nodes(transition.to_stage_ids);
      for (const relationId of transition.predecessor_relation_ids) {
        const relation: any = relations.get(relationId);
        const forward = relation.from_kind_ids.some((id: string) => from.has(id)) && relation.to_kind_ids.some((id: string) => to.has(id));
        const reverse = relation.from_kind_ids.some((id: string) => to.has(id)) && relation.to_kind_ids.some((id: string) => from.has(id));
        expect(forward || reverse).toBe(true);
      }
    }
    expect(atlas.transitions.at(-1).predecessor_relation_ids).toEqual(["RESPONDS_WITH_REPAIR", "ASSESSES_UNDER_FRAMEWORK"]);
  });

  test("rejects every cross-family template substitution", () => {
    const mutations: Array<[string, (value: any) => void]> = [
      ["policy-template-ref-wrong-family-dimension-boundary", (value) => { value.stages[0].nuance.emotion_observation.reason_ref = "negative-expected-trace"; }],
      ["policy-template-ref-wrong-family-negative-flow", (value) => { value.stages[0].nuance.negative_flow_profiles[0].expected_trace = "evidence-counterevidence"; }],
      ["policy-template-ref-wrong-family-party-aftermath", (value) => { value.stages[0].nuance.affected_party_aftermath[0].benefits = ["repair-attempt-question"]; }],
      ["policy-template-ref-wrong-family-translation-threshold-path", (value) => {
        const card = value.stages.find((entry: any) => entry.nuance.translation_profile.status === "applicable-question");
        card.nuance.translation_profile.preserved = ["negative-expected-trace"];
      }],
      ["policy-template-ref-wrong-family-translation-threshold-path", (value) => {
        const card = value.stages.find((entry: any) => entry.nuance.threshold_profile.status === "applicable-question");
        card.nuance.threshold_profile.trigger = ["repair-attempt-question"];
      }],
      ["policy-template-ref-wrong-family-translation-threshold-path", (value) => {
        const card = value.stages.find((entry: any) => entry.nuance.path_dependence_profile.status === "applicable-question");
        card.nuance.path_dependence_profile.evidence = ["repair-attempt-question"];
      }],
      ["policy-template-ref-wrong-family-promotion-evidence", (value) => { value.stages[0].evidence_profile.counterevidence = ["repair-attempt-question"]; }],
      ["policy-template-ref-wrong-family-repair", (value) => { value.stages[0].nuance.repair_profile.attempt = ["evidence-counterevidence"]; }],
    ];
    for (const [expected, mutate] of mutations) {
      const value = authored();
      mutate(value);
      resign(value);
      expect(codes(value)).toContain(expected);
    }
  });

  test("rejects affected-party, negative-flow, template, and relation closure drift", () => {
    const mutations: Array<[string, (value: any) => void]> = [
      ["aftermath-parties-must-exactly-match-selected-parties", (value) => { value.stages[0].nuance.affected_party_aftermath.pop(); }],
      ["repair-residual-parties-must-exactly-match-selected-parties", (value) => { value.stages[0].nuance.repair_profile.party_indexed_residuals.pop(); }],
      ["negative-profiles-must-exactly-match-selected-statuses", (value) => { value.stages[0].nuance.negative_flow_profiles.pop(); }],
      ["affected-party-ref-not-closed", (value) => { value.stages[0].nuance.affected_party_ids[0] = "invented-party"; }],
      ["negative-status-ref-not-closed", (value) => {
        value.stages[0].nuance.negative_flow.refs[0] = "invented-status";
        value.stages[0].nuance.negative_flow_profiles[0].status_ref = "invented-status";
      }],
      ["nuance-template-family-mismatch", (value) => { value.transitions[0].nuance.template_ref = "overlay-default"; }],
      ["authority-template-family-mismatch", (value) => { value.transitions[0].authority_dependency.template_ref = "overlay-authority"; }],
      ["causal-template-family-mismatch", (value) => { value.transitions[0].causal_influence.template_ref = "overlay-causal"; }],
      ["relation-does-not-cross-transition-partition", (value) => { value.transitions.at(-1).predecessor_relation_ids.push("ATTEMPTS"); }],
    ];
    for (const [expected, mutate] of mutations) {
      const value = authored();
      mutate(value);
      resign(value);
      expect(codes(value)).toContain(expected);
    }
  });

  test("rejects duplicate or reordered IDs in every fixed registry", () => {
    for (const field of Object.keys(FIXED_IDS)) {
      const value = authored();
      value[field][1].id = value[field][0].id;
      resign(value);
      expect(codes(value)).toContain("fixed-registry-id-order-or-membership-mismatch");
    }
  });

  test("pins canonical metrics and accepts each bound exactly before rejecting one-over", () => {
    const bytes = readFileSync(CIVILISATION_FLOW_NUANCE_ATLAS_PATH).byteLength;
    const metrics = civilisationFlowNuanceShapeMetrics(authored(), bytes);
    expect(metrics).toEqual({
      bytes: 886_555,
      json_nodes: 21_927,
      total_string_units: 376_256,
      max_string_units: 337,
      max_array_fanout: 60,
      max_depth: 8,
    });
    expect(civilisationFlowNuanceBudgetIssue(metrics)).toBeNull();
    const base = {
      bytes: 0,
      json_nodes: 0,
      total_string_units: 0,
      max_string_units: 0,
      max_array_fanout: 0,
      max_depth: 0,
    };
    const cases: Array<[keyof typeof base, string]> = [
      ["bytes", "json-byte-budget-exceeded"],
      ["json_nodes", "json-node-budget-exceeded"],
      ["total_string_units", "json-string-budget-exceeded"],
      ["max_string_units", "json-max-string-exceeded"],
      ["max_array_fanout", "json-array-fanout-exceeded"],
      ["max_depth", "json-depth-exceeded"],
    ];
    for (const [field, expected] of cases) {
      const near = { ...base, [field]: CIVILISATION_FLOW_NUANCE_LIMITS[field] };
      const over = { ...base, [field]: CIVILISATION_FLOW_NUANCE_LIMITS[field] + 1 };
      expect(civilisationFlowNuanceBudgetIssue(near)).toBeNull();
      expect(civilisationFlowNuanceBudgetIssue(over)).toBe(expected);
    }
  });

  test("strict fixed-size loader rejects duplicate keys, invalid UTF-8, symlinks, and oversized files", () => {
    const root = temporaryRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"protocol":"one","protocol":"two"}');
    expect(() => loadCivilisationFlowNuanceAtlas(duplicate)).toThrow(/duplicate key/i);

    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Uint8Array.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]));
    expect(() => loadCivilisationFlowNuanceAtlas(invalidUtf8)).toThrow(/UTF-8/i);

    const linked = join(root, "linked.json");
    symlinkSync(CIVILISATION_FLOW_NUANCE_ATLAS_PATH, linked);
    expect(() => loadCivilisationFlowNuanceAtlas(linked)).toThrow(/non-symlink/i);

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, " ".repeat(CIVILISATION_FLOW_NUANCE_LIMITS.bytes + 1));
    expect(() => loadCivilisationFlowNuanceAtlas(oversized)).toThrow(/exceeds/i);

    const source = readFileSync(CLI, "utf8");
    expect(source).toContain("Buffer.allocUnsafe(before.size)");
    expect(source).toContain("readSync(descriptor");
    expect(source).not.toContain("readFileSync(descriptor)");
  });

  test("CLI and root dispatch are deterministic, foreign-CWD safe, network-free, and write nothing", () => {
    const root = temporaryRoot();
    const before = readdirSync(root);
    const env = {
      PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
      LANG: "C",
      LC_ALL: "C",
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      ALL_PROXY: "http://127.0.0.1:9",
      NO_PROXY: "",
      BUN_RUNTIME_TRANSPILER_CACHE_PATH: "0",
    };
    const run = (cmd: string[]) => Bun.spawnSync({ cmd, cwd: root, env, stdout: "pipe", stderr: "pipe" });
    const commands = [
      "overview", "chain", "stages", "transitions", "crosswalks", "dynamics",
      "topology", "materials", "emotions", "power", "negative-flow",
      "open-domains", "unknowns", "templates", "rules", "boundaries", "discovery", "verify",
    ];
    for (const command of commands) {
      const result = run([process.execPath, CLI, command, "--json"]);
      expect(result.exitCode).toBe(0);
      expect(result.stderr.toString()).toBe("");
      expect(() => JSON.parse(result.stdout.toString())).not.toThrow();
      if (command === "overview") {
        const summary = JSON.parse(result.stdout.toString());
        expect(result.stdout.byteLength).toBeLessThan(20_000);
        expect(summary).toHaveProperty("predecessor_bindings");
        expect(summary).toHaveProperty("counts.stages", 14);
        expect(summary).not.toHaveProperty("stages");
        expect(summary).not.toHaveProperty("transitions");
      }
    }
    const dispatch = run([KINGDOM, "civilisation-flow", "discovery", "--json"]);
    expect(dispatch.exitCode).toBe(0);
    expect(JSON.parse(dispatch.stdout.toString())).toEqual(civilisationFlowNuancePublicDiscovery());
    expect(readdirSync(root)).toEqual(before);

    const inherited = run([process.execPath, CLI, "toString", "--json"]);
    expect(inherited.exitCode).toBe(2);
    expect(inherited.stdout.toString()).toBe("");
    expect(inherited.stderr.toString()).toContain("usage:");
  });

  test("discovery, guide, schema, and source retain the static non-effect boundary", () => {
    expect(civilisationFlowNuancePublicDiscovery()).toMatchObject({
      protocol: CIVILISATION_FLOW_NUANCE_ATLAS_PROTOCOL,
      atlas_id: CIVILISATION_FLOW_NUANCE_ATLAS_ID,
      publication_state: "immutable-versioned-static-family",
      counts: {
        predecessor_bindings: 3,
        stages: 14,
        transitions: 13,
        crosswalk_flow_overlays: 6,
        open_domain_bindings: 9,
        unknowns: 10,
        policy_templates: 60,
      },
      boundary: {
        static_read_only: true,
        public_static_publication_family: true,
        predecessor_mutation: false,
        predecessor_republication: false,
        causal_effect_identified: false,
        metaphysical_verdict: false,
        authority_granted: false,
        targeting: false,
        persuasion_optimization: false,
        action_attempted: false,
        action_executed: false,
        external_effect_claimed: false,
        publication_trigger: false,
        deployment_trigger: false,
        automatic_action: false,
      },
    });
    const guide = readFileSync(GUIDE, "utf8");
    for (const phrase of [
      CIVILISATION_FLOW_NUANCE_ATLAS_PROTOCOL,
      "directed-seam-and-overlay-design-lens",
      "predecessor-claims-only",
      "Compact templates preserve",
      "Affect-context vocabulary",
      "Negative flow: absence needs a type",
      "The authority–causality firewall",
      "Nine domains remain open",
      "Repair is a loop with an exit",
      "is intended to support the conditions",
    ]) expect(guide).toContain(phrase);

    const schema = JSON.parse(readFileSync(CIVILISATION_FLOW_NUANCE_SCHEMA_PATH, "utf8"));
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(CIVILISATION_FLOW_NUANCE_ATLAS_SCHEMA_ID);
    expect(collectObjectSchemas(schema).every((entry) => entry.additionalProperties === false)).toBe(true);
    const source = readFileSync(CLI, "utf8");
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain('from "node:http');
    expect(source).not.toContain('from "node:https');
    expect(source).not.toContain('from "node:child_process');
    expect(source).not.toContain("Bun.spawn");
  });

  test("closed Draft 2020-12 schema validates canonical bytes when host jsonschema is available", () => {
    const schemaText = readFileSync(CIVILISATION_FLOW_NUANCE_SCHEMA_PATH, "utf8");
    const probe = Bun.spawnSync({ cmd: ["python3", "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
    if (probe.exitCode !== 0) {
      expect(schemaText).toContain('"additionalProperties": false');
      return;
    }
    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        "import json,sys; from jsonschema import Draft202012Validator; s=json.load(open(sys.argv[1],encoding='utf-8')); v=json.load(open(sys.argv[2],encoding='utf-8')); Draft202012Validator.check_schema(s); Draft202012Validator(s).validate(v)",
        CIVILISATION_FLOW_NUANCE_SCHEMA_PATH,
        CIVILISATION_FLOW_NUANCE_ATLAS_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(result.stderr.toString()).toBe("");
  });
});
