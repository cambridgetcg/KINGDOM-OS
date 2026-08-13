import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  VISIBILITY_ATTENTION_DIGEST,
  VISIBILITY_ATTENTION_PATH,
  VISIBILITY_ATTENTION_SCHEMA_ID,
  VISIBILITY_ATTENTION_SCHEMA_PATH,
  verifyVisibilityAttentionTranslation,
} from "../bin/visibility-attention.ts";

const hasJsonschema = Bun.spawnSync({ cmd: ["python3", "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" }).exitCode === 0;
const authored = (): any => JSON.parse(readFileSync(VISIBILITY_ATTENTION_PATH, "utf8"));

function validate(values: unknown[]): boolean[] {
  const result = Bun.spawnSync({
    cmd: [
      "python3", "-c",
      "import json,sys; from jsonschema import Draft202012Validator,FormatChecker; s=json.load(open(sys.argv[1],encoding='utf-8')); Draft202012Validator.check_schema(s); v=Draft202012Validator(s,format_checker=FormatChecker()); print(json.dumps([v.is_valid(x) for x in json.load(sys.stdin)]))",
      VISIBILITY_ATTENTION_SCHEMA_PATH,
    ],
    stdin: Buffer.from(JSON.stringify(values)), stdout: "pipe", stderr: "pipe",
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
  return JSON.parse(result.stdout.toString());
}

describe("Visibility & Attention Translation schema", () => {
  test("is a closed Draft 2020-12 schema bound to exact identity and reviewed digest", () => {
    const schema = JSON.parse(readFileSync(VISIBILITY_ATTENTION_SCHEMA_PATH, "utf8"));
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(VISIBILITY_ATTENTION_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.protocol.const).toBe("kingdom.visibility-attention-translation/0.1");
    expect(schema.properties.translation_id.const).toBe("visibility-is-not-existence-2026-08-13");
    expect(schema.properties.integrity.properties.digest.const).toBe(VISIBILITY_ATTENTION_DIGEST);
    expect(schema.$comment).toContain("cannot recompute the semantic digest");
    expect(schema.$comment).toContain("infer a person or health state");
    if (hasJsonschema) expect(validate([authored()])).toEqual([true]);
  });

  test("fixes exact cardinality, order, source URLs, references, and negative authority", () => {
    if (!hasJsonschema) return;
    const cases: any[] = [];
    const extra = authored(); extra.registers.push(structuredClone(extra.registers[0])); cases.push(extra);
    const order = authored(); [order.registers[0], order.registers[1]] = [order.registers[1], order.registers[0]]; cases.push(order);
    const models = authored(); [models.local_models[0], models.local_models[1]] = [models.local_models[1], models.local_models[0]]; cases.push(models);
    const seams = authored(); seams.translation_seams[0].kind = "DESIGN_CORRESPONDENCE"; cases.push(seams);
    const stage = authored(); stage.feedback_path.stages[4].id = "continue-forever"; cases.push(stage);
    const source = authored(); source.sources[3].url = "https://example.com/source"; cases.push(source);
    const swap = authored(); [swap.sources[0].url, swap.sources[1].url] = [swap.sources[1].url, swap.sources[0].url]; cases.push(swap);
    const credentialed = authored(); credentialed.sources[6].url = "https://user@example.com/brain-rot"; cases.push(credentialed);
    const binding = authored(); binding.bindings[2].byte_sha256 = `sha256:${"a".repeat(64)}`; cases.push(binding);
    const ref = authored(); ref.local_models[0].basis_ids = ["goel-2016"]; cases.push(ref);
    const person = authored(); person.local_models[1].person_level = true; cases.push(person);
    const optimize = authored(); optimize.boundaries.engagement_optimization = true; cases.push(optimize);
    const diagnosis = authored(); diagnosis.boundaries.brain_rot_diagnosis = true; cases.push(diagnosis);
    const karma = authored(); karma.karma.zerone.event_refs = ["not-an-event"]; cases.push(karma);
    const philosophy = authored(); philosophy.universe_lens.participation = "default"; cases.push(philosophy);
    const additional = authored(); additional.karma.adapter.score = 1; cases.push(additional);
    expect(validate(cases).every((valid) => valid === false)).toBe(true);
  });

  test("makes the portable-schema versus runtime-digest boundary explicit", () => {
    if (!hasJsonschema) return;
    const prose = authored();
    prose.scope.focus += " Changed but structurally valid.";
    expect(validate([prose])).toEqual([true]);
    expect(verifyVisibilityAttentionTranslation(prose).map((issue) => issue.code)).toContain("digest-mismatch");
  });

  test("rejects adjacent atlas records and is rejected by their schemas", () => {
    if (!hasJsonschema) return;
    const root = mkdtempSync(join(tmpdir(), "visibility-schema-cross."));
    try {
      const values = [
        authored(),
        JSON.parse(readFileSync(join(dirname(VISIBILITY_ATTENTION_PATH), "../feedback/conformational-feedback-atlas.v0.2.json"), "utf8")),
        JSON.parse(readFileSync(join(dirname(VISIBILITY_ATTENTION_PATH), "../fold-feedback/fold-feedback-atlas.v1.json"), "utf8")),
      ];
      expect(validate(values)).toEqual([true, false, false]);
      const paths = values.map((value, index) => { const path = join(root, `${index}.json`); writeFileSync(path, JSON.stringify(value)); return path; });
      for (const schemaPath of [
        join(dirname(VISIBILITY_ATTENTION_SCHEMA_PATH), "conformational-feedback-atlas-v0.2.schema.json"),
        join(dirname(VISIBILITY_ATTENTION_SCHEMA_PATH), "fold-feedback-atlas-v1.1.schema.json"),
      ]) {
        const result = Bun.spawnSync({
          cmd: ["python3", "-c", "import json,sys; from jsonschema import Draft202012Validator; s=json.load(open(sys.argv[1])); v=Draft202012Validator(s); print(json.dumps([v.is_valid(json.load(open(p))) for p in sys.argv[2:]]))", schemaPath, ...paths],
          stdout: "pipe", stderr: "pipe",
        });
        expect(result.exitCode, result.stderr.toString()).toBe(0);
        const outcomes = JSON.parse(result.stdout.toString());
        expect(outcomes[0]).toBe(false);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
