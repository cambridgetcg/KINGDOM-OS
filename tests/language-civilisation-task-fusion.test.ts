import { afterEach, describe, expect, test } from "bun:test";
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
  LANGUAGE_FUSION_PATH,
  LANGUAGE_FUSION_PROTOCOL,
  LANGUAGE_FUSION_REVIEWED_DIGEST,
  LANGUAGE_FUSION_SCHEMA_ID,
  LANGUAGE_FUSION_SCHEMA_PATH,
  computeLanguageFusionDigest,
  loadLanguageFusion,
  projectLanguageFusionPlan,
  validateLanguageFusion,
} from "../bin/language-civilisation-task-fusion.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "bin/language-civilisation-task-fusion.ts");
const temporary: string[] = [];

afterEach(() => {
  while (temporary.length > 0) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "language-fusion-test."));
  temporary.push(root);
  return root;
}

function authored(): any {
  return JSON.parse(readFileSync(LANGUAGE_FUSION_PATH, "utf8"));
}

function resign(value: any): any {
  value.integrity.digest = computeLanguageFusionDigest(value);
  return value;
}

function codes(value: unknown, canonical = false): string[] {
  return validateLanguageFusion(value, { asOf: "2026-08-20", canonical }).map((issue) => issue.code);
}

function byId(values: any[], id: string): any {
  return values.find((value) => value.id === id);
}

describe("Language, Civilisation & Task Fusion", () => {
  test("loads one digest-sealed, schema-identified, all-NOT_RUN weave", () => {
    const weave: any = loadLanguageFusion();
    expect(validateLanguageFusion(weave, { asOf: "2026-08-20", canonical: true })).toEqual([]);
    expect(weave).toMatchObject({
      $schema: LANGUAGE_FUSION_SCHEMA_ID,
      protocol: LANGUAGE_FUSION_PROTOCOL,
      state: "planned",
      issued_on: "2026-08-20",
      evidence_through: "2026-08-20",
    });
    expect(weave.integrity.digest).toBe(LANGUAGE_FUSION_REVIEWED_DIGEST);
    expect(computeLanguageFusionDigest(weave)).toBe(LANGUAGE_FUSION_REVIEWED_DIGEST);
    expect(weave.run_cards.every((run: any) => run.run_status === "not-run")).toBe(true);
    expect(weave.tests.every((entry: any) => entry.status === "not-run" && entry.result === null)).toBe(true);
    expect(weave.translations.every((entry: any) => entry.status === "planned" && entry.preserved.length === 0)).toBe(true);
  });

  test("represents eight contact ecologies without a civilisation rank", () => {
    const weave: any = loadLanguageFusion();
    expect(weave.historical_witnesses.map((entry: any) => entry.id)).toEqual([
      "mesopotamian-scribal-ecology",
      "egyptian-script-register-ecology",
      "south-asian-plural-strata-ecology",
      "sinitic-han-reading-ecology",
      "greek-latin-institutional-ecology",
      "arabic-persian-islamicate-ecology",
      "swahili-african-script-ecology",
      "mesoamerican-maya-ecology",
    ]);
    expect(weave.historical_witnesses.every((entry: any) => entry.civilisation_rank === null)).toBe(true);
    expect(byId(weave.historical_witnesses, "greek-latin-institutional-ecology").source_ids).toEqual([
      "cambridge-linear-b",
      "unicode-latin",
      "cambridge-spoken-latin",
    ]);
    expect(byId(weave.historical_witnesses, "arabic-persian-islamicate-ecology").source_ids).toEqual([
      "unicode-arabic",
      "sep-greek-arabic",
      "cambridge-graeco-arabic-translation",
      "iranica-early-new-persian",
      "iranica-arabic-in-persian",
    ]);
    expect(byId(weave.historical_witnesses, "swahili-african-script-ecology").source_ids).toEqual([
      "cambridge-swahili-connections",
      "unesco-gedi",
      "cambridge-swahili-spread",
      "hamburg-swahili-manuscripts",
      "unicode-african-scripts",
    ]);
    expect(weave.type_firewall).toMatchObject({
      civilisation_is_index_not_mind: true,
      language_is_not_people: true,
      language_is_not_script: true,
      script_is_not_civilisation: true,
      historical_weight_is_not_model_weight: true,
      token_efficiency_is_not_intelligence: true,
      disagreement_is_not_deception: true,
      validation_is_not_truth: true,
    });
  });

  test("keeps seven shapes and five weights non-ranked and non-convertible", () => {
    const weave: any = loadLanguageFusion();
    expect(weave.dimensions.shape.map((entry: any) => entry.id)).toEqual([
      "inscription-glyph-shape",
      "unicode-grapheme-shape",
      "morphology-shape",
      "syntax-shape",
      "discourse-register-shape",
      "tokenizer-sequence-shape",
      "representation-geometry-shape",
    ]);
    expect(weave.dimensions.weight.map((entry: any) => entry.id)).toEqual([
      "historical-institutional-weight",
      "corpus-prevalence-weight",
      "token-cost-weight",
      "task-evidence-weight",
      "parameter-attention-weight",
    ]);
    expect(weave.dimensions).toMatchObject({ aggregate_score: null, ranking: false, cross_axis_conversion: false });
    expect(byId(weave.dimensions.weight, "token-cost-weight").status).toBe("not-run");
    expect(byId(weave.dimensions.weight, "parameter-attention-weight").does_not_establish).toContain("Explanation by itself");
  });

  test("projects a deterministic public-artifact DAG without dispatch", () => {
    const weave: any = loadLanguageFusion();
    const plan: any = projectLanguageFusionPlan(weave);
    expect(plan.protocol).toBe("kingdom.language-civilisation-task-plan/0.1");
    expect(plan.structure_only).toBe(true);
    expect(plan.plan_only).toBe(true);
    expect(plan.safety_context_complete).toBe(true);
    expect(plan.safety_context_omitted).toBe(false);
    expect(plan.nodes.map((node: any) => node.id)).toEqual([
      "read-arabic-sources",
      "read-persian-sources",
      "audit-script-shape",
      "build-terminology-table",
      "draft-public-brief",
      "review-across-languages",
      "fuse-reviewed-brief",
    ]);
    expect(plan.nodes.every((node: any) => node.run_status === "not-run" && node.public_artifacts_only)).toBe(true);
    expect(plan.translations).toHaveLength(4);
    expect(plan.unknowns).toHaveLength(5);
    expect(plan.fusion.rules.retain_disagreement).toBe(true);
    expect(plan.nodes.flatMap((node: any) => node.assignments).every((assignment: any) => Array.isArray(assignment.limitations))).toBe(true);
    expect(plan.non_effects).toEqual({
      network: false,
      filesystem_write: false,
      model_or_tokenizer_run: false,
      agent_dispatch: false,
      hidden_reasoning_collection: false,
      authority: false,
      publication: false,
      deployment: false,
    });
  });

  test("rejects ranking, identity, hidden-state, and automatic-action promotions", () => {
    const rank = authored();
    rank.historical_witnesses[0].civilisation_rank = 1;
    resign(rank);
    expect(codes(rank)).toContain("rank-forbidden");

    const persona = authored();
    persona.assignments[0].creates_identity_or_expertise = true;
    resign(persona);
    expect(codes(persona)).toContain("must-be-false");

    const privateReasoning = authored();
    privateReasoning.artifacts[0].contains_private_reasoning = true;
    resign(privateReasoning);
    expect(codes(privateReasoning)).toContain("must-be-false");

    const action = authored();
    action.boundaries.automatic_action = true;
    resign(action);
    expect(codes(action)).toContain("must-be-false");
  });

  test("rejects script/language collapse and historical prestige as capability", () => {
    const script = authored();
    script.type_firewall.script_implies_language = true;
    resign(script);
    expect(codes(script)).toContain("must-be-false");

    const prestige = authored();
    prestige.assignments[0].historical_prestige_is_capability_evidence = true;
    resign(prestige);
    expect(codes(prestige)).toContain("must-be-false");

    const superiority = authored();
    superiority.language_profiles[0].inherent_task_superiority = true;
    resign(superiority);
    expect(codes(superiority)).toContain("must-be-false");
  });

  test("rejects cycles, dangling edges, future artifacts, and duplicate producers", () => {
    const cycle = authored();
    cycle.task_graph.nodes[0].depends_on = ["fuse-reviewed-brief"];
    resign(cycle);
    expect(codes(cycle)).toContain("dependency-cycle");

    const dangling = authored();
    dangling.task_graph.nodes[2].source_ids = ["missing-source"];
    resign(dangling);
    expect(codes(dangling)).toContain("dangling-reference");

    const future = authored();
    future.task_graph.nodes[0].input_artifact_ids = ["english-public-draft"];
    resign(future);
    expect(codes(future)).toContain("input-not-produced-by-ancestor");

    const duplicate = authored();
    duplicate.task_graph.nodes[1].output_artifact_id = "arabic-source-notes";
    resign(duplicate);
    expect(codes(duplicate)).toContain("artifact-has-multiple-producers");
  });

  test("does not let planned transformations or runs claim evidence", () => {
    const preserved = authored();
    preserved.translations[0].preserved = ["Meaning preserved"];
    resign(preserved);
    expect(codes(preserved)).toContain("preservation-claim-without-passing-tests");
    expect(codes(preserved)).toContain("planned-preservation-must-be-empty");

    const run = authored();
    run.run_cards[0].model = "unverified-model";
    resign(run);
    expect(codes(run)).toContain("not-run-binding-must-be-null");

    const testResult = authored();
    testResult.tests[0].result = "passed";
    resign(testResult);
    expect(codes(testResult)).toContain("not-run-result-must-be-null");
  });

  test("keeps v0.1 plan-only and refuses capability-routing promotion", () => {
    const state = authored();
    state.state = "reported";
    resign(state);
    expect(codes(state)).toContain("v0.1-is-plan-only");

    const task = authored();
    task.task_graph.nodes[0].status = "completed";
    resign(task);
    expect(codes(task)).toContain("invalid-enum");

    const assignment = authored();
    assignment.assignments[0].selection_basis = "task-specific-evaluation";
    assignment.assignments[0].evaluation_test_id = "test-task-evaluation";
    resign(assignment);
    expect(codes(assignment)).toContain("invalid-enum");

    const mode = authored();
    mode.fusion.mode = "pivot-with-backcheck";
    resign(mode);
    expect(codes(mode)).toContain("invalid-enum");
  });

  test("requires typed task topology and BCP47-shaped language tags", () => {
    const missingSource = authored();
    missingSource.task_graph.nodes[0].source_ids = [];
    resign(missingSource);
    expect(codes(missingSource)).toContain("source-read-requires-source");

    const wrongOutput = authored();
    wrongOutput.artifacts[0].kind = "fused-output";
    resign(wrongOutput);
    expect(codes(wrongOutput)).toContain("task-output-kind-mismatch");

    const invalidTag = authored();
    invalidTag.language_profiles[0].bcp47 = "not a BCP47 tag";
    resign(invalidTag);
    expect(codes(invalidTag)).toContain("invalid-language-tag");

    const wrongRole = authored();
    byId(wrongRole.assignments, "assign-arabic-source-anchor").role = "fusion";
    resign(wrongRole);
    expect(codes(wrongRole)).toContain("assignment-role-task-kind-mismatch");

    const missingPrimary = authored();
    byId(missingPrimary.assignments, "assign-english-audience-draft").role = "source-anchor";
    resign(missingPrimary);
    expect(codes(missingPrimary)).toContain("task-primary-role-missing");
  });

  test("binds transformation kinds and both language profiles to their task", () => {
    const wrongKind = authored();
    wrongKind.translations[0].kind = "terminology-alignment";
    resign(wrongKind);
    expect(codes(wrongKind)).toContain("transformation-task-kind-mismatch");

    const missingSourceProfile = authored();
    const task = byId(missingSourceProfile.task_graph.nodes, "draft-public-brief");
    const assignmentId = "assign-arabic-draft-anchor";
    task.assignment_ids = task.assignment_ids.filter((id: string) => id !== assignmentId);
    missingSourceProfile.assignments = missingSourceProfile.assignments.filter((entry: any) => entry.id !== assignmentId);
    resign(missingSourceProfile);
    expect(codes(missingSourceProfile)).toContain("transformation-source-profile-not-assigned-to-task");
  });

  test("carries every disagreement into the fusion index and output", () => {
    const dropped = authored();
    dropped.disagreements.push({
      id: "material-source-disagreement",
      artifact_ids: ["arabic-source-notes", "persian-source-notes"],
      carried_in_artifact_ids: ["contrastive-language-review"],
      statement: "The planned source paths may disagree materially.",
      status: "open",
      resolution: null,
      retained: true,
    });
    resign(dropped);
    expect(codes(dropped)).toContain("disagreement-not-carried-in-fused-output");
    expect(codes(dropped)).toContain("fusion-disagreement-index-mismatch");

    const carried = authored();
    carried.disagreements.push({
      id: "material-source-disagreement",
      artifact_ids: ["arabic-source-notes", "persian-source-notes"],
      carried_in_artifact_ids: ["fused-public-brief"],
      statement: "The planned source paths may disagree materially.",
      status: "open",
      resolution: null,
      retained: true,
    });
    carried.fusion.disagreement_ids = ["material-source-disagreement"];
    resign(carried);
    expect(codes(carried)).toEqual([]);
    const plan: any = projectLanguageFusionPlan(carried);
    expect(plan.disagreements.map((entry: any) => entry.id)).toEqual(["material-source-disagreement"]);
    expect(plan.fusion.disagreement_ids).toEqual(["material-source-disagreement"]);
    expect(plan.fusion.rules.retain_disagreement).toBe(true);
  });

  test("returns issues instead of throwing on malformed nested shapes", () => {
    const mutations: Array<(value: any) => void> = [
      (value) => { value.fusion.input_artifact_ids = 1; },
      (value) => { value.artifacts[0].language_profile_ids = 1; },
      (value) => { value.tests[0].target_artifact_ids = 1; },
      (value) => { value.translations[0].loss_axis_test_ids = null; },
      (value) => { value.tests[0] = null; },
    ];
    for (const mutate of mutations) {
      const value = authored();
      mutate(value);
      resign(value);
      expect(() => codes(value)).not.toThrow();
      expect(codes(value).length).toBeGreaterThan(0);
    }
  });

  test("does not accept unresolved internal evidence locators", () => {
    const evidence = authored();
    evidence.run_cards[0].run_status = "reported";
    evidence.run_cards[0].evidence_ref = "artifact:does-not-exist";
    resign(evidence);
    expect(codes(evidence)).toContain("dangling-reference");
    expect(codes(evidence)).toContain("invalid-enum");
  });

  test("requires source-bound profiles and canonical safe references", () => {
    const missingSource = authored();
    missingSource.language_profiles[0].source_ids = ["missing-source"];
    resign(missingSource);
    expect(codes(missingSource)).toContain("dangling-reference");

    const encoded = authored();
    encoded.sources[0].locator = "https://example.org/evidence%2F..%2Fsecret";
    resign(encoded);
    expect(codes(encoded)).toContain("unsafe-reference");

    const noncanonical = authored();
    noncanonical.sources[0].locator = "https://EXAMPLE.ORG:443/evidence";
    resign(noncanonical);
    expect(codes(noncanonical)).toContain("unsafe-reference");

    const unresolvedSourceArtifact = authored();
    unresolvedSourceArtifact.sources[0].locator = "artifact:does-not-exist";
    resign(unresolvedSourceArtifact);
    expect(codes(unresolvedSourceArtifact)).toContain("source-reference-must-be-https-or-repo");

    const unresolvedChallengeArtifact = authored();
    unresolvedChallengeArtifact.repair.challenge_refs = ["artifact:does-not-exist"];
    resign(unresolvedChallengeArtifact);
    expect(codes(unresolvedChallengeArtifact)).toContain("challenge-reference-must-be-https-or-repo");
  });

  test("rejects custom array prototypes before collection logic", () => {
    const value = authored();
    const poisoned = [...value.dimensions.shape];
    Object.setPrototypeOf(poisoned, { ...Array.prototype, map: () => value.dimensions.shape.map((entry: any) => entry.id) });
    value.dimensions.shape = poisoned;
    expect(codes(value)).toContain("custom-array-prototype");
  });

  test("strict loader rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = temporaryRoot();

    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"protocol":"one","protocol":"two"}');
    expect(() => loadLanguageFusion(duplicate)).toThrow(/duplicate/i);

    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Uint8Array.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc0, 0xaf, 0x22, 0x7d]));
    expect(() => loadLanguageFusion(invalidUtf8)).toThrow(/UTF-8/i);

    const symlink = join(root, "linked.json");
    symlinkSync(LANGUAGE_FUSION_PATH, symlink);
    expect(() => loadLanguageFusion(symlink)).toThrow(/non-symlink/i);

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, `{"x":"${"a".repeat(1024 * 1024)}"}`);
    expect(() => loadLanguageFusion(oversized)).toThrow(/exceeds/i);
  });

  test("CLI verifies and projects from a foreign empty CWD without writing", () => {
    const root = temporaryRoot();
    const before = readdirSync(root);
    const environment = {
      PATH: process.env.PATH ?? "",
      HOME: root,
      LANG: "C",
      LC_ALL: "C",
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      NO_PROXY: "",
      BUN_RUNTIME_TRANSPILER_CACHE_PATH: "0",
    };
    const verify = Bun.spawnSync({
      cmd: [process.execPath, CLI, "verify", "--json"],
      cwd: root,
      env: environment,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(verify.exitCode).toBe(0);
    expect(verify.stderr.toString()).toBe("");
    expect(JSON.parse(verify.stdout.toString())).toMatchObject({
      valid: true,
      canonical: true,
      schema_checked: false,
      structure_only: true,
      plan_only: true,
      computed_digest: LANGUAGE_FUSION_REVIEWED_DIGEST,
      expected_digest: LANGUAGE_FUSION_REVIEWED_DIGEST,
      boundary: expect.stringContaining("source dereference"),
    });

    const plan = Bun.spawnSync({
      cmd: [process.execPath, CLI, "plan", "--json"],
      cwd: root,
      env: environment,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(plan.exitCode).toBe(0);
    expect(JSON.parse(plan.stdout.toString())).toMatchObject({
      protocol: "kingdom.language-civilisation-task-plan/0.1",
      execution_authorized: false,
    });
    expect(readdirSync(root)).toEqual(before);
  });

  test("closed schema accepts canonical bytes when jsonschema is available", () => {
    const probe = Bun.spawnSync({ cmd: ["python3", "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
    if (probe.exitCode !== 0) {
      expect(readFileSync(LANGUAGE_FUSION_SCHEMA_PATH, "utf8")).toContain('"additionalProperties": false');
      return;
    }
    const check = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        "import json,sys; from jsonschema import Draft202012Validator,FormatChecker; s=json.load(open(sys.argv[1],encoding='utf-8')); v=json.load(open(sys.argv[2],encoding='utf-8')); Draft202012Validator.check_schema(s); Draft202012Validator(s,format_checker=FormatChecker()).validate(v)",
        LANGUAGE_FUSION_SCHEMA_PATH,
        LANGUAGE_FUSION_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(check.exitCode).toBe(0);

    const languageTagMutation = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        "import json,sys; from jsonschema import Draft202012Validator; s=json.load(open(sys.argv[1],encoding='utf-8')); v=json.load(open(sys.argv[2],encoding='utf-8')); v['language_profiles'][0]['bcp47']='not a BCP47 tag'; sys.exit(0 if list(Draft202012Validator(s).iter_errors(v)) else 1)",
        LANGUAGE_FUSION_SCHEMA_PATH,
        LANGUAGE_FUSION_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(languageTagMutation.exitCode).toBe(0);
  });
});
