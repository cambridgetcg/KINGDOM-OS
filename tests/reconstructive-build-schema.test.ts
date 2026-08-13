import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const KERNEL_PATH = join(ROOT, "data/reconstruction/reconstructive-build-kernel.v0.1.json");
const KERNEL_SCHEMA_PATH = join(ROOT, "schemas/reconstructive-build-kernel-v0.1.schema.json");
const PROJECT_SCHEMA_PATH = join(ROOT, "schemas/reconstructive-project-v0.1.schema.json");
const PROJECT_FIXTURE_PATH = join(ROOT, "tests/fixtures/reconstructive-project.valid.json");

const parse = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const kernel = () => structuredClone(parse(KERNEL_PATH));
const project = () => structuredClone(parse(PROJECT_FIXTURE_PATH));
const kernelSchema = parse(KERNEL_SCHEMA_PATH);
const projectSchema = parse(PROJECT_SCHEMA_PATH);

function canonicalize(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
  }
  throw new Error("non-JSON value");
}

function semanticDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalize(material)).digest("hex")}`;
}

const PYTHON = process.env.RECONSTRUCTIVE_SCHEMA_PYTHON || "python3";
const pythonProbe = Bun.spawnSync({ cmd: [PYTHON, "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
const schemaTest = pythonProbe.exitCode === 0 ? test : test.skip;

function validate(schemaPath: string, values: unknown[]): { schema_ok: boolean; valid: boolean[]; errors: string[][] } {
  const script = [
    "import json,sys",
    "from jsonschema import Draft202012Validator, FormatChecker",
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
    "print(json.dumps({'schema_ok':True,'valid':[not x for x in errors],'errors':errors}))",
  ].join("\n");
  const result = Bun.spawnSync({
    cmd: [PYTHON, "-c", script, schemaPath],
    stdin: Buffer.from(JSON.stringify(values)), stdout: "pipe", stderr: "pipe",
    env: { ...process.env, http_proxy: "http://127.0.0.1:9", https_proxy: "http://127.0.0.1:9", HTTP_PROXY: "http://127.0.0.1:9", HTTPS_PROXY: "http://127.0.0.1:9", NO_PROXY: "*" },
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
  return JSON.parse(result.stdout.toString());
}

describe("Reconstructive Build Draft 2020-12 schemas", () => {
  test("pins two distinct closed schema identities and the reviewed kernel digest", () => {
    expect(kernelSchema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(kernelSchema.$id).toBe("urn:kingdom:schema:reconstructive-build-kernel:0.1");
    expect(projectSchema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(projectSchema.$id).toBe("urn:kingdom:schema:reconstructive-project:0.1");
    expect(kernelSchema.properties.integrity.$ref).toBe("#/$defs/integrity");
    expect(kernelSchema.$defs.integrity.properties.digest.const).toBe(kernel().integrity.digest);
    expect(kernelSchema.$comment).toContain("cannot recompute");
    expect(projectSchema.$comment).toContain("not a reconstruction solver");
    expect(projectSchema.$defs.kernelBinding.properties.relation.const).toBe("PROFILE_OF");
    expect(projectSchema.$defs.kernelBinding.properties.authority_imported.const).toBe(false);

    const visit = (value: unknown, path = "$", seen = new Set<unknown>()) => {
      if (value === null || typeof value !== "object" || seen.has(value)) return;
      seen.add(value);
      const record = value as Record<string, any>;
      if (record.type === "object") expect(record.additionalProperties, path).toBe(false);
      for (const [key, child] of Object.entries(record)) visit(child, `${path}.${key}`, seen);
    };
    visit(kernelSchema);
    visit(projectSchema);
  });

  test("project fixture has an exact kernel binding and a recomputable semantic digest", () => {
    const value = project();
    const rawKernel = `sha256:${createHash("sha256").update(readFileSync(KERNEL_PATH)).digest("hex")}`;
    expect(value.kernel_binding).toEqual({
      protocol: "kingdom.reconstructive-build-kernel/0.1",
      url: "https://thekingdom.dev/atlases/reconstructive-build-kernel-2026-08-13.json",
      byte_sha256: rawKernel,
      semantic_digest: kernel().integrity.digest,
      relation: "PROFILE_OF",
      mutated: false,
      authority_imported: false,
    });
    expect(semanticDigest(value)).toBe(value.integrity.digest);
    expect(value.claims).toEqual([]);
    expect(value.sources).toEqual([]);
    const stateSpaceIds = new Set(value.state_spaces.map((entry: any) => entry.id));
    const stateIds = new Set(value.states.map((entry: any) => entry.id));
    const statesById = new Map(value.states.map((entry: any) => [entry.id, entry]));
    const correspondencesById = new Map(value.correspondences.map((entry: any) => [entry.id, entry]));
    expect([...stateIds]).toEqual(["artifact-draft-state", "artifact-reviewed-state"]);
    expect(value.states.every((entry: any) => stateSpaceIds.has(entry.state_space_id))).toBe(true);
    expect(value.observations.every((entry: any) => stateIds.has(entry.state_id))).toBe(true);
    expect(value.observations.every((entry: any) => stateSpaceIds.has(entry.output_state_space_id))).toBe(true);
    expect(value.observations.every((entry: any) => {
      const state = statesById.get(entry.state_id) as any;
      const correspondence = correspondencesById.get(entry.correspondence_id) as any;
      return correspondence?.from_id === state?.state_space_id && correspondence?.to_id === entry.output_state_space_id;
    })).toBe(true);
    expect(value.reconstruction_requirements.every((entry: any) => entry.solution_semantics === "FIBER")).toBe(true);
    expect(value.reconstruction_requirements.every((entry: any) =>
      entry.observation_ids.every((observationId: string) =>
        value.observations.find((observation: any) => observation.id === observationId)?.state_id === entry.target_state_id))).toBe(true);
    expect(value.transitions.every((entry: any) => stateIds.has(entry.from_state_id) && stateIds.has(entry.to_state_id))).toBe(true);
    expect(value.transitions.filter((entry: any) => entry.kind === "STATE_CHANGE").every((entry: any) => entry.from_state_id !== entry.to_state_id)).toBe(true);
    expect(value.feedback.events.every((entry: any) => stateIds.has(entry.state_id))).toBe(true);
    expect(value.authority).toMatchObject({ profile_inert: true, execute: false, deploy: false, external_write: false, karma_write: false, automatic_action: false });
    expect(value.transition_accelerators[0]).toMatchObject({ kind: "DESIGN_TRANSITION_ACCELERATOR", empirical: false, physical_parameter_transfer: false, authority_effect: "NONE", reversible: true });
  });

  schemaTest("executes both schemas against their canonical instances", () => {
    const kernelResult = validate(KERNEL_SCHEMA_PATH, [kernel()]);
    expect(kernelResult.schema_ok).toBe(true);
    expect(kernelResult.valid, JSON.stringify(kernelResult.errors)).toEqual([true]);
    const projectResult = validate(PROJECT_SCHEMA_PATH, [project()]);
    expect(projectResult.schema_ok).toBe(true);
    expect(projectResult.valid, JSON.stringify(projectResult.errors)).toEqual([true]);
  });

  schemaTest("kernel schema rejects identity, order, source, correspondence, intervention, analogy, boundary and digest drift", () => {
    const values: any[] = [];
    const push = (mutate: (value: any) => void) => { const value = kernel(); mutate(value); values.push(value); };
    push((value) => { value.extra = true; });
    push((value) => { value.protocol = "kingdom.reconstructive-build-kernel/0.2"; });
    push((value) => { value.epistemic_registers.reverse(); });
    push((value) => { value.observation_operators.pop(); });
    push((value) => { [value.sources[0], value.sources[1]] = [value.sources[1], value.sources[0]]; });
    push((value) => { value.sources[0].url = "https://example.invalid/source"; });
    push((value) => { value.correspondences[0].mapping_or_digest = "invented-map"; });
    push((value) => { value.correspondences[1].mapping_or_digest = null; });
    push((value) => { value.state_transition_operators[0].intervention.remaining_relations_guaranteed_unchanged = true; });
    push((value) => { value.reconstruction_cases[2].observation_operator_id = "threshold-contact-projection"; });
    push((value) => { value.catalysis_models[1].empirical = true; });
    push((value) => { value.analogy_bridges[0].causal_transfer = true; });
    push((value) => { value.feedback_contract.valid_exits.pop(); });
    push((value) => { value.boundaries.project_deployment = true; });
    push((value) => { value.integrity.digest = "sha256:" + "0".repeat(64); });
    const result = validate(KERNEL_SCHEMA_PATH, values);
    expect(result.valid).toEqual(values.map(() => false));
  });

  schemaTest("project schema rejects correspondence upgrades, hidden perturbation, ambiguity loss and authority drift", () => {
    const values: any[] = [];
    const push = (mutate: (value: any) => void) => { const value = project(); mutate(value); values.push(value); };
    push((value) => { value.extra = true; });
    push((value) => { value.kernel_binding.url = "https://example.invalid/kernel.json"; });
    push((value) => { value.kernel_binding.mutated = true; });
    push((value) => { value.correspondences[0].kind = "UNLABELED_UP_TO_ISOMORPHISM"; });
    push((value) => { value.correspondences[0].mapping_or_digest = null; });
    push((value) => { value.correspondences[0].labels_retained = false; });
    push((value) => { value.correspondences[0].overlap_maps_available = false; });
    push((value) => { value.observations[0].operator_kind = "PHYSICAL_PERTURBATION"; value.observations[0].intervention.kind = "PHYSICAL_PERTURBATION"; value.observations[0].intervention.remaining_relations_guaranteed_unchanged = false; });
    push((value) => { value.observations[0].evidence_class = "OBSERVED"; value.observations[0].value_digest = null; });
    push((value) => { value.reconstruction_requirements[0].solution_semantics = "POSTERIOR"; });
    push((value) => { delete value.reconstruction_requirements[0].target_state_id; });
    push((value) => { value.reconstruction_requirements[0].identifiability = "INFEASIBLE"; value.reconstruction_requirements[0].fiber_status = "UNIQUE"; });
    push((value) => { value.claims = [{ id: "bad-philosophy", register: "PHILOSOPHY", statement: "claim", status: "PROVEN", conditions: ["declared"], source_ids: [], nonclaims: ["none"] }]; });
    push((value) => { value.claims = [{ id: "bad-empirical", register: "EMPIRICAL_SCIENCE", statement: "claim", status: "SOURCE_BOUND", conditions: ["declared"], source_ids: [], nonclaims: ["none"] }]; });
    push((value) => { value.uncertainty_policy.fiber_statuses = ["UNIQUE"]; });
    push((value) => { value.transition_accelerators[0].empirical = true; });
    push((value) => { value.transition_accelerators[0].physical_parameter_transfer = true; });
    push((value) => { value.transition_accelerators[0].authority_effect = "EXECUTE"; });
    push((value) => { value.authority.execute = true; });
    push((value) => { value.authority.deploy = true; });
    push((value) => { value.feedback.karma.adapter_exists = true; });
    push((value) => { value.feedback.karma.score = 1; });
    push((value) => { value.feedback.events[0].kind = "OBSERVATION"; });
    push((value) => { value.feedback.events[0].kind = "CHALLENGE"; });
    push((value) => { value.feedback.events[0].effect = "NONE"; });
    push((value) => { value.boundaries.wet_lab_protocol = true; });
    push((value) => { value.release.deployed = true; });
    const result = validate(PROJECT_SCHEMA_PATH, values);
    expect(result.valid).toEqual(values.map(() => false));
    const widening = project();
    widening.feedback.events[0].kind = "CORRECTION";
    widening.feedback.events[0].effect = "WIDENS_FIBER";
    expect(validate(PROJECT_SCHEMA_PATH, [widening]).valid).toEqual([true]);
  });

  schemaTest("kernel and project schemas reject each other's instances", () => {
    expect(validate(KERNEL_SCHEMA_PATH, [project()]).valid).toEqual([false]);
    expect(validate(PROJECT_SCHEMA_PATH, [kernel()]).valid).toEqual([false]);
  });
});
