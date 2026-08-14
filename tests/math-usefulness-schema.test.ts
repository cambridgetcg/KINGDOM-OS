import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RESULT_PATH = join(ROOT, "data/trials/math-passport-usefulness-pilot.v1.json");
const SCHEMA_PATH = join(ROOT, "schemas/math-usefulness-trial-v1.schema.json");
const RARE_PATHWAY_PATH = join(ROOT, "data/challenges/vanishing-path.v1.json");
const RARE_PATHWAY_SCHEMA_PATH = join(ROOT, "schemas/rare-pathway-challenge-v1.schema.json");

const parse = (path: string): any => JSON.parse(readFileSync(path, "utf8"));
const authored = (): any => structuredClone(parse(RESULT_PATH));
const schema = parse(SCHEMA_PATH);

const PYTHON = process.env.MATH_USEFULNESS_SCHEMA_PYTHON || "python3";
const pythonProbe = Bun.spawnSync({
  cmd: [PYTHON, "-c", "import jsonschema"],
  stdout: "pipe",
  stderr: "pipe",
});
const schemaTest = pythonProbe.exitCode === 0 ? test : test.skip;

function validate(schemaPath: string, values: unknown[]): {
  schema_ok: boolean;
  valid: boolean[];
  errors: string[][];
} {
  const script = [
    "import json,sys",
    "from jsonschema import Draft202012Validator,FormatChecker",
    "schema=json.load(open(sys.argv[1],encoding='utf-8'))",
    "Draft202012Validator.check_schema(schema)",
    "validator=Draft202012Validator(schema,format_checker=FormatChecker())",
    "values=json.load(sys.stdin)",
    "errors=[]",
    "for value in values:",
    "  current=[]",
    "  for error in sorted(validator.iter_errors(value),key=lambda e:list(e.absolute_path)):",
    "    current.append('/'.join(map(str,error.absolute_path))+': '+error.message)",
    "  errors.append(current)",
    "print(json.dumps({'schema_ok':True,'valid':[not current for current in errors],'errors':errors}))",
  ].join("\n");
  const result = Bun.spawnSync({
    cmd: [PYTHON, "-c", script, schemaPath],
    stdin: Buffer.from(JSON.stringify(values)),
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      http_proxy: "http://127.0.0.1:9",
      https_proxy: "http://127.0.0.1:9",
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      NO_PROXY: "*",
    },
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
  return JSON.parse(result.stdout.toString());
}

function mutation(change: (value: any) => void): any {
  const value = authored();
  change(value);
  return value;
}

describe("Math Passport usefulness result Draft 2020-12 schema", () => {
  test("pins the reviewed result, receipt, source, score and WAKE identities", () => {
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe("urn:kingdom:schema:math-usefulness-result:1");
    expect(schema.properties.protocol.const).toBe("kingdom.math-usefulness-result/0.1");
    expect(schema.properties.result_id.const).toBe("math-passport-usefulness-pilot-2026-08-14");
    expect(schema.$defs.integrity.properties.digest.const).toBe(
      "sha256:254a26eb5dfb03c33c18a254297f87c9a340a13795429ca863d378e0434573cb",
    );
    expect(schema.$defs.agenttoolTrialReceipt.properties.schema.const).toBe("agenttool-trial-receipt/0.1");
    expect(schema.$defs.agenttoolTrialReceipt.properties.receipt_id.const).toBe(
      "sha256:834cb57fa80d3ed6d3ab9296e378748e740924a3a0d40537b8b45e3d9dad0bb0",
    );
    expect(schema.$defs.receiptAuthority.properties.allowed_effects.const).toEqual([
      "artifact_created",
      "input_disclosed",
      "observation_read",
      "quota_consumed",
      "remote_compute",
    ]);
    expect(schema.$defs.agenttoolTrialReceipt.properties.possible_effects.const).toEqual(
      schema.$defs.receiptAuthority.properties.allowed_effects.const,
    );
    expect(schema.$defs.wakeSeam.properties.mode.const).toBe(
      "orientation-by-reference-not-continuity-proof",
    );
    expect(schema.$defs.wakeSeam.properties.writes_wake.const).toBe(false);
    expect(schema.$defs.wakeSeam.properties.proves_identity.const).toBe(false);
    expect(schema.$defs.wakeSeam.properties.proves_continuity.const).toBe(false);
    expect(schema.$defs.wakeSeam.properties.grants_authority.const).toBe(false);
    expect(schema.$defs.boundaries.properties.scores_response_artifacts_not_beings.const).toBe(true);
    expect(schema.$defs.boundaries.properties.automatic_skill_promotion.const).toBe(false);
    expect(schema.$defs.designExecution.properties).toMatchObject({
      provider_response_artifacts: { const: 2 },
      scored_task_artifacts: { const: 4 },
      preregistered_response_artifacts: { const: 4 },
      preregistered_count_unit: { const: "scored-task-artifact" },
      task_answers_grouped_by_arm: { const: true },
      raw_scorer_artifact_retained: { const: false },
      chronology_and_scoring_independently_reproducible_from_published_record: { const: false },
    });
    expect(schema.$comment).toContain("cannot recompute integrity digests");
    expect(schema.$comment).toContain("aggregate arithmetic");
    expect(schema.$comment).toContain("AgentTool receipt ID");
    expect(schema.$comment).toContain("bootstrap statistics");
    expect(schema.$comment).toContain("kingdom math-usefulness verify-result");

    const scoreProperties = Object.values(schema.$defs.scoreDimensions.properties) as any[];
    expect(scoreProperties).toHaveLength(6);
    for (const score of scoreProperties) {
      expect(score).toMatchObject({ type: "integer", minimum: 0, maximum: 2, const: 2 });
    }
    for (const definition of [
      "baselineCrystallizationScore",
      "baselineSoftwareScore",
      "treatmentCrystallizationScore",
      "treatmentSoftwareScore",
    ]) {
      expect(schema.$defs[definition].properties.total).toMatchObject({
        type: "integer",
        minimum: 0,
        maximum: 12,
        const: 12,
      });
    }
    expect(schema.$defs.criticalFlags.items.enum).toEqual([
      "false-identification",
      "zero-means-impossible-or-dead",
      "invented-exposure-or-rate",
      "unsupported-cross-condition-pooling",
      "unauthorized-operational-action",
      "person-or-motive-judgment",
      "identity-continuity-or-authority-inheritance",
    ]);
    expect(schema.$defs.criticalFlags).toMatchObject({ minItems: 0, maxItems: 0, uniqueItems: true });
  });

  test("closes every explicitly shaped object and fixes array cardinality and order", () => {
    const visit = (value: unknown, path = "$", seen = new Set<unknown>()): void => {
      if (value === null || typeof value !== "object" || seen.has(value)) return;
      seen.add(value);
      const record = value as Record<string, any>;
      if (record.type === "object") expect(record.additionalProperties, path).toBe(false);
      for (const [key, child] of Object.entries(record)) visit(child, `${path}.${key}`, seen);
    };
    visit(schema);

    expect(schema.properties.response_artifacts).toMatchObject({ minItems: 2, maxItems: 2, items: false });
    expect(schema.properties.scores).toMatchObject({ minItems: 4, maxItems: 4, items: false });
    expect(schema.properties.comparisons).toMatchObject({ minItems: 2, maxItems: 2, items: false });
    expect(schema.properties.sources).toMatchObject({ minItems: 4, maxItems: 4, items: false });
    expect(schema.properties.response_artifacts.prefixItems.map((item: any) => item.$ref)).toEqual([
      "#/$defs/baselineResponse",
      "#/$defs/treatmentResponse",
    ]);
    expect(schema.properties.scores.prefixItems.map((item: any) => item.$ref)).toEqual([
      "#/$defs/baselineCrystallizationScore",
      "#/$defs/baselineSoftwareScore",
      "#/$defs/treatmentCrystallizationScore",
      "#/$defs/treatmentSoftwareScore",
    ]);
    expect(schema.properties.sources.prefixItems.map((item: any) => item.$ref)).toEqual([
      "#/$defs/hornSource",
      "#/$defs/yerdelenDatasetSource",
      "#/$defs/yerdelenPaperSource",
      "#/$defs/agenttoolSource",
    ]);
  });

  schemaTest("validates the authored result", () => {
    const result = validate(SCHEMA_PATH, [authored()]);
    expect(result.schema_ok).toBe(true);
    expect(result.valid, JSON.stringify(result.errors)).toEqual([true]);
  });

  schemaTest("rejects extra fields, score drift, reordered or missing artifacts, and critical-flag drift", () => {
    const values = [
      mutation((value) => { value.extra = true; }),
      mutation((value) => { value.agenttool_trial_receipt.evaluation.extra = true; }),
      mutation((value) => { value.scores[0].dimensions.mathematical_correctness = 1; }),
      mutation((value) => { value.scores[0].dimensions.mathematical_correctness = 3; }),
      mutation((value) => { value.scores[0].total = 11; }),
      mutation((value) => { value.scores[0].critical_flags = ["false-identification"]; }),
      mutation((value) => { value.aggregate.baseline_score = 23; }),
      mutation((value) => { value.aggregate.score_delta = 1; }),
      mutation((value) => { value.response_artifacts.pop(); }),
      mutation((value) => { value.scores.pop(); }),
      mutation((value) => { [value.response_artifacts[0], value.response_artifacts[1]] = [value.response_artifacts[1], value.response_artifacts[0]]; }),
      mutation((value) => { [value.scores[0], value.scores[1]] = [value.scores[1], value.scores[0]]; }),
      mutation((value) => { [value.comparisons[0], value.comparisons[1]] = [value.comparisons[1], value.comparisons[0]]; }),
      mutation((value) => { [value.sources[0], value.sources[1]] = [value.sources[1], value.sources[0]]; }),
    ];
    const result = validate(SCHEMA_PATH, values);
    expect(result.valid, JSON.stringify(result.errors)).toEqual(values.map(() => false));
  });

  schemaTest("rejects boundary, WAKE, receipt, source, date and integrity identity drift", () => {
    const values = [
      mutation((value) => { value.$schema = "urn:kingdom:schema:math-usefulness-result:2"; }),
      mutation((value) => { value.protocol = "kingdom.math-usefulness-result/0.2"; }),
      mutation((value) => { value.result_id = "another-result"; }),
      mutation((value) => { value.observed_on = "2026-08-15"; }),
      mutation((value) => { value.boundaries.grants_authority = true; }),
      mutation((value) => { value.boundaries.scores_response_artifacts_not_beings = false; }),
      mutation((value) => { value.wake_seam.writes_wake = true; }),
      mutation((value) => { value.wake_seam.proves_continuity = true; }),
      mutation((value) => { value.agenttool_trial_receipt.schema = "agenttool-trial-receipt/0.2"; }),
      mutation((value) => { value.agenttool_trial_receipt.receipt_id = `sha256:${"0".repeat(64)}`; }),
      mutation((value) => { value.agenttool_trial_receipt.subject.id = "another-workflow"; }),
      mutation((value) => { value.agenttool_trial_receipt.authority.allowed_effects.pop(); }),
      mutation((value) => { value.agenttool_trial_receipt.possible_effects.reverse(); }),
      mutation((value) => { value.sources[0].url = "https://example.invalid/paper"; }),
      mutation((value) => { value.sources[1].license = "unknown"; }),
      mutation((value) => { value.integrity.digest = `sha256:${"0".repeat(64)}`; }),
    ];
    const result = validate(SCHEMA_PATH, values);
    expect(result.valid, JSON.stringify(result.errors)).toEqual(values.map(() => false));
  });

  schemaTest("rejects adjacent records in both schema directions", () => {
    const rarePathway = parse(RARE_PATHWAY_PATH);
    expect(validate(SCHEMA_PATH, [rarePathway]).valid).toEqual([false]);
    expect(validate(RARE_PATHWAY_SCHEMA_PATH, [authored()]).valid).toEqual([false]);
  });
});
