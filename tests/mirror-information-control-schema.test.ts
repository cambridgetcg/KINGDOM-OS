import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  MIRROR_INFORMATION_CONTROL_PUBLIC_DIGEST,
  MIRROR_INFORMATION_CONTROL_PUBLIC_ID,
  MIRROR_INFORMATION_CONTROL_PUBLIC_PATH,
  MIRROR_INFORMATION_CONTROL_PUBLIC_PROTOCOL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_ID,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_PATH,
  verifyMirrorInformationControl,
} from "../bin/mirror-information-control.ts";

const ROOT = dirname(dirname(dirname(MIRROR_INFORMATION_CONTROL_PUBLIC_PATH)));
const PYTHON = process.env.MIRROR_INFORMATION_CONTROL_SCHEMA_PYTHON ||
  process.env.INFORMATION_CONTROL_SCHEMA_PYTHON || "python3";
const pythonProbe = Bun.spawnSync({ cmd: [PYTHON, "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
const schemaTest = pythonProbe.exitCode === 0 ? test : test.skip;
const authored = (): any => JSON.parse(readFileSync(MIRROR_INFORMATION_CONTROL_PUBLIC_PATH, "utf8"));

function validate(values: unknown[]): { valid: boolean[]; errors: string[][] } {
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
    "print(json.dumps({'valid':[not current for current in errors],'errors':errors}))",
  ].join("\n");
  const result = Bun.spawnSync({
    cmd: [PYTHON, "-c", script, MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_PATH],
    stdin: Buffer.from(JSON.stringify(values)), stdout: "pipe", stderr: "pipe",
    env: { ...process.env, HTTP_PROXY: "http://127.0.0.1:1", HTTPS_PROXY: "http://127.0.0.1:1", NO_PROXY: "*" },
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
  return JSON.parse(result.stdout.toString());
}

describe("MIRROR information-control public schema", () => {
  test("is a closed Draft 2020-12 schema with exact static identity", () => {
    const schema = JSON.parse(readFileSync(MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_PATH, "utf8"));
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.protocol.const).toBe(MIRROR_INFORMATION_CONTROL_PUBLIC_PROTOCOL);
    expect(schema.properties.publication_id.const).toBe(MIRROR_INFORMATION_CONTROL_PUBLIC_ID);
    expect(schema.properties.integrity.properties.digest.const).toBe(MIRROR_INFORMATION_CONTROL_PUBLIC_DIGEST);
    expect(schema.$comment).toContain("accepts no credential or envelope input");
    expect(schema.$comment).toContain("cannot recompute its semantic digest");
    expect(schema.$comment).toContain("prove noninterference or a no-oracle property");
    const visit = (value: unknown, path = "$", seen = new Set<unknown>()) => {
      if (value === null || typeof value !== "object" || seen.has(value)) return;
      seen.add(value);
      const record = value as Record<string, any>;
      if (record.type === "object") expect(record.additionalProperties, path).toBe(false);
      for (const [key, child] of Object.entries(record)) visit(child, `${path}.${key}`, seen);
    };
    visit(schema);
  });

  schemaTest("validates the authored record and pins all source and research identities", () => {
    const value = authored();
    expect(validate([value])).toEqual({ valid: [true], errors: [[]] });
    const mutations: any[] = [];
    const push = (mutate: (candidate: any) => void) => { const candidate = structuredClone(value); mutate(candidate); mutations.push(candidate); };
    push((candidate) => { candidate.source_binding.commit = "a".repeat(40); });
    push((candidate) => { candidate.source_binding.files[0].sha256 = `sha256:${"a".repeat(64)}`; });
    push((candidate) => { [candidate.source_binding.files[0], candidate.source_binding.files[1]] = [candidate.source_binding.files[1], candidate.source_binding.files[0]]; });
    push((candidate) => { candidate.sources[0].url = "https://example.invalid/source"; });
    push((candidate) => { [candidate.sources[0], candidate.sources[1]] = [candidate.sources[1], candidate.sources[0]]; });
    push((candidate) => { candidate.presentation.record_url = "https://example.invalid/classify"; });
    push((candidate) => { candidate.presentation.requirements.push("BODY_INPUT"); });
    expect(validate(mutations).valid.every((valid) => valid === false)).toBe(true);
  });

  schemaTest("rejects every attempted intake, oracle, private-material, runtime, and authority promotion", () => {
    const base = authored();
    const mutations: any[] = [];
    const push = (mutate: (candidate: any) => void) => { const candidate = structuredClone(base); mutate(candidate); mutations.push(candidate); };
    push((candidate) => { candidate.extra = true; });
    push((candidate) => { candidate.public_surface.body_intake = "JSON"; });
    push((candidate) => { candidate.public_surface.credential_intake = "FORM"; });
    push((candidate) => { candidate.public_surface.query_controls_output = true; });
    push((candidate) => { candidate.public_surface.performs_registry_lookup = true; });
    push((candidate) => { candidate.public_surface.classifies_credentials = true; });
    push((candidate) => { candidate.no_oracle_rule.dynamic_response_present = true; });
    push((candidate) => { candidate.no_oracle_rule.property_proven = true; });
    push((candidate) => { candidate.protected_signal_rule.raw_value_included = true; });
    push((candidate) => { candidate.protected_signal_rule.production_capability = "POSSIBLE_SCOPED"; });
    push((candidate) => { candidate.private_material_included.observation_keys = true; });
    push((candidate) => { candidate.private_material_included.cloudflare_binding_or_secret = true; });
    push((candidate) => { candidate.response_boundary.crosses_requester_or_third_party_system = true; });
    push((candidate) => { candidate.response_boundary.retaliation_or_hack_back = true; });
    push((candidate) => { candidate.rooms[2].implemented_by_publication = true; });
    push((candidate) => { candidate.laws[0].runtime_enforced = true; });
    push((candidate) => { candidate.illustrative_paths[0].observed = true; });
    push((candidate) => { candidate.rights.penalty = true; });
    push((candidate) => { candidate.karma.event_refs = ["event:opaque/00000000000000000000000000000000"]; });
    push((candidate) => { candidate.negative_effects.grants_authority = true; });
    push((candidate) => { candidate.negative_effects.runtime_enforcement = true; });
    push((candidate) => { candidate.negative_effects.deploys_decoy_or_honeypot = true; });
    push((candidate) => { candidate.negative_effects.cloudflare_security_control_configured = true; });
    push((candidate) => { candidate.protected_signal_rule.credential_class = "SIGNAL_REFERENCE"; });
    push((candidate) => { candidate.selected_route = "MIRROR_ONLY"; });
    push((candidate) => { candidate.evidence = { strength: "CONFIRMED_SIGNAL_INTERACTION" }; });
    const result = validate(mutations);
    expect(result.valid, JSON.stringify(result.errors)).toEqual(mutations.map(() => false));
  });

  schemaTest("makes the portable-schema versus runtime-digest boundary explicit", () => {
    const value = authored();
    value.citizen_law.interpretation += " Structurally valid changed prose.";
    expect(validate([value]).valid).toEqual([true]);
    expect(verifyMirrorInformationControl(value).map((issue) => issue.code)).toContain("digest-mismatch");
  });

  schemaTest("rejects the protected internal envelope and adjacent public records", () => {
    const internalEnvelope = JSON.parse(readFileSync(join(ROOT, "skills/guard-information-flow/references/information-control-envelope.example.json"), "utf8"));
    const adjacent = JSON.parse(readFileSync(join(ROOT, "data/exploration/phenomena-deep-wing.v0.1.json"), "utf8"));
    expect(validate([authored(), internalEnvelope, adjacent]).valid).toEqual([true, false, false]);
  });
});
