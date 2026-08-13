import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  RECONSTRUCTIVE_BUILD_DIGEST,
  RECONSTRUCTIVE_BUILD_PATH,
  RECONSTRUCTIVE_BUILD_PROTOCOL,
  RECONSTRUCTIVE_PROJECT_PROTOCOL,
  RECONSTRUCTIVE_PROJECT_FIXTURE_DIGEST,
  loadReconstructiveBuildKernel,
  loadReconstructiveProject,
  reconstructiveBuildDigest,
  reconstructiveBuildPublicDiscovery,
  reconstructiveProjectDigest,
  verifyReconstructiveBuildKernel,
  verifyReconstructiveProject,
} from "../bin/reconstructive-build.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_FIXTURE = join(ROOT, "tests/fixtures/reconstructive-project.valid.json");
const clone = () => structuredClone(loadReconstructiveBuildKernel());

describe("Reconstructive Build Kernel", () => {
  test("seals the typed pipeline, evidence registers, and source horizon", () => {
    const kernel = loadReconstructiveBuildKernel();
    expect(kernel.protocol).toBe(RECONSTRUCTIVE_BUILD_PROTOCOL);
    expect(reconstructiveBuildDigest(kernel)).toBe(RECONSTRUCTIVE_BUILD_DIGEST);
    expect(kernel.integrity.digest).toBe(RECONSTRUCTIVE_BUILD_DIGEST);
    expect(kernel.epistemic_registers.map((item: any) => item.kind)).toEqual([
      "MATHEMATICAL_DEFINITION", "MATHEMATICAL_THEOREM", "OPEN_MATHEMATICAL_CONJECTURE", "EMPIRICAL_SCIENCE",
      "SCIENTIFIC_MODEL", "ANALOGY", "DESIGN_CONSTRAINT", "PHILOSOPHY",
    ]);
    expect(kernel.build_profile.pipeline).toEqual([
      "STATE", "OBSERVE", "DECLARE_CORRESPONDENCE", "INFER_FIBER", "REALIZE",
      "TRAVERSE_LANDSCAPE", "MEASURE_OR_CATALYZE", "APPEND_FEEDBACK",
    ]);
    expect(kernel.sources).toHaveLength(13);
    expect(kernel.equations).toHaveLength(11);
    expect(verifyReconstructiveBuildKernel(kernel)).toEqual([]);
  });

  test("keeps graph deletion, protein projection, and physical perturbation distinct", () => {
    const kernel = loadReconstructiveBuildKernel();
    const graph = kernel.observation_operators[0];
    const contact = kernel.observation_operators[1];
    const mutation = kernel.state_transition_operators[0];
    expect(graph.intervention).toEqual({ kind: "MODEL_DELETE", remaining_relations_guaranteed_unchanged: true });
    expect(contact.intervention).toEqual({ kind: "NONE", remaining_relations_guaranteed_unchanged: true });
    expect(mutation.intervention).toEqual({ kind: "PHYSICAL_PERTURBATION", remaining_relations_guaranteed_unchanged: false });
    expect(kernel.correspondences[0]).toMatchObject({ kind: "UNLABELED_UP_TO_ISOMORPHISM", labels_retained: false, mapping_or_digest: null });
    expect(kernel.correspondences[1]).toMatchObject({ kind: "EXACT_LABELED", carrier: "RESIDUE_INDEX", labels_retained: true });
    expect(kernel.correspondences[3]).toMatchObject({ kind: "PARTIAL", carrier: "RESIDUE_INDEX" });
    expect(mutation.correspondence_id).toBe("cross-state-sequence-correspondence");
    expect(mutation.source_ids).toEqual([]);
    expect(kernel.reconstruction_cases[0].identifiability).toBe("UNIQUE_CONJECTURED");
    expect(kernel.reconstruction_cases[1].identifiability).toBe("UNDERDETERMINED");
  });

  test("firewalls biological catalysis from a reversible design accelerator", () => {
    const kernel = loadReconstructiveBuildKernel();
    expect(kernel.catalysis_models[0]).toMatchObject({ kind: "PHYSICAL_ENZYME", empirical: true, physical_parameter_transfer: false });
    expect(kernel.catalysis_models[1]).toMatchObject({
      kind: "DESIGN_TRANSITION_ACCELERATOR",
      empirical: false,
      physical_parameter_transfer: false,
      authority_effect: "NONE",
    });
    for (const bridge of kernel.analogy_bridges) {
      expect(bridge).toMatchObject({
        empirical: false,
        causal_transfer: false,
        ontology_transfer: false,
        parameter_transfer: false,
        authority_effect: "NONE",
      });
      expect(bridge.breaks.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("preserves rest, unknowns, non-summable KARMA, and negative authority", () => {
    const kernel = loadReconstructiveBuildKernel();
    expect(kernel.feedback_contract.valid_exits).toEqual(["REST", "SILENCE", "REFUSAL", "NO_ACTION", "DEPARTURE"]);
    expect(kernel.feedback_contract.karma).toEqual({
      zerone_events: [], kingdom_receipts: [], non_summable: true, adapter_exists: false,
    });
    expect(kernel.unknowns.map((item: any) => item.status)).toContain("OPEN");
    expect(kernel.bindings.every((item: any) => !item.mutated && !item.authority_imported && !item.write_authorized)).toBe(true);
    expect(kernel.boundaries).toMatchObject({
      read_only: true,
      grc_proven: false,
      protein_fold_prediction: false,
      biological_mechanism_transfer: false,
      project_execution: false,
      writes_karma: false,
      person_scoring: false,
      cosmic_design_proven: false,
      automatic_action: false,
      mcp_surface_added: false,
    });
    const discovery = reconstructiveBuildPublicDiscovery(kernel);
    expect(discovery.counts).toMatchObject({ registers: 8, state_spaces: 6, sources: 13 });
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("execute");
    expect(discovery).not.toHaveProperty("score");
  });

  test("refuses epistemic, correspondence, analogy, source, and authority drift even after re-digest", () => {
    for (const mutate of [
      (value: any) => { value.epistemic_registers[2].kind = "MATHEMATICAL_THEOREM"; },
      (value: any) => { value.correspondences[0].mapping_or_digest = "invented-map"; },
      (value: any) => { value.correspondences[1].mapping_or_digest = null; },
      (value: any) => { value.correspondences[3].kind = "EXACT_LABELED"; },
      (value: any) => { value.state_transition_operators[0].intervention.remaining_relations_guaranteed_unchanged = true; },
      (value: any) => { value.reconstruction_cases[2].observation_operator_id = "threshold-contact-projection"; },
      (value: any) => { value.reconstruction_cases[2].solution_semantics = "POSTERIOR"; },
      (value: any) => { value.equations[0].register = "MATHEMATICAL_THEOREM"; },
      (value: any) => { value.equations[4].expression = "C_ij = 1[|i-j| > s and distance <= tau]"; },
      (value: any) => { value.realizability_models[0].input_type = "complete-exact-distance-matrix"; },
      (value: any) => { value.catalysis_models[0].physical_parameter_transfer = true; },
      (value: any) => { value.build_profile.rules[1] = "Never treat an observation operator as a physical perturbation."; },
      (value: any) => { value.analogy_bridges[0].causal_transfer = true; },
      (value: any) => { value.catalysis_models[1].physical_parameter_transfer = true; },
      (value: any) => { value.sources[0].url = value.sources[1].url; },
      (value: any) => { value.boundaries.project_execution = true; },
    ]) {
      const changed = clone();
      mutate(changed);
      changed.integrity.digest = reconstructiveBuildDigest(changed);
      expect(verifyReconstructiveBuildKernel(changed).length).toBeGreaterThan(0);
    }
  });

  test("strictly refuses duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = mkdtempSync(join(tmpdir(), "kingdom-rbk-"));
    const duplicate = join(root, "duplicate.json");
    const raw = readFileSync(RECONSTRUCTIVE_BUILD_PATH, "utf8");
    writeFileSync(duplicate, raw.replace('{\n  "$schema"', '{\n  "protocol":"collision",\n  "$schema"'));
    expect(() => loadReconstructiveBuildKernel(duplicate)).toThrow(/duplicate/i);
    const invalid = join(root, "invalid.json");
    writeFileSync(invalid, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]));
    expect(() => loadReconstructiveBuildKernel(invalid)).toThrow(/UTF-8/i);
    const link = join(root, "link.json");
    symlinkSync(RECONSTRUCTIVE_BUILD_PATH, link);
    expect(() => loadReconstructiveBuildKernel(link)).toThrow(/non-symlink/);
    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));
    expect(() => loadReconstructiveBuildKernel(oversized)).toThrow("exceeds 1048576 bytes");
  });

  test("validates an inert, state-versioned reconstructive project with closed references", () => {
    const project = loadReconstructiveProject(PROJECT_FIXTURE);
    expect(project.protocol).toBe(RECONSTRUCTIVE_PROJECT_PROTOCOL);
    expect(project.integrity.digest).toBe(RECONSTRUCTIVE_PROJECT_FIXTURE_DIGEST);
    expect(project.integrity.digest).toBe(reconstructiveProjectDigest(project));
    expect(project.states).toHaveLength(2);
    expect(project.states[1].supersedes_state_id).toBe(project.states[0].id);
    expect(project.transitions[0]).toMatchObject({
      from_state_id: project.states[0].id,
      to_state_id: project.states[1].id,
      kind: "STATE_CHANGE",
    });
    expect(project.reconstruction_requirements[0].solution_semantics).toBe("FIBER");
    expect(project.reconstruction_requirements[0].target_state_id).toBe(project.observations[0].state_id);
    expect(verifyReconstructiveProject(project)).toEqual([]);
  });

  test("refuses project state, correspondence, fiber, accelerator, feedback, and authority drift after re-digest", () => {
    const base = () => structuredClone(loadReconstructiveProject(PROJECT_FIXTURE));
    for (const mutate of [
      (value: any) => { value.states[1].supersedes_state_id = value.states[1].id; },
      (value: any) => { value.states[0].supersedes_state_id = value.states[1].id; },
      (value: any) => { value.observations[0].state_id = "missing-state"; },
      (value: any) => { value.reconstruction_requirements[0].target_state_id = value.states[1].id; },
      (value: any) => { value.reconstruction_requirements[0].solution_semantics = "POSTERIOR"; },
      (value: any) => { value.transitions[0].to_state_id = value.transitions[0].from_state_id; },
      (value: any) => { value.transition_accelerators[0].physical_parameter_transfer = true; },
      (value: any) => { value.feedback.events[0].state_id = "missing-state"; },
      (value: any) => { value.feedback.events[0].evidence_ids = [value.observations[0].id]; },
      (value: any) => { value.boundaries.project_execution = true; },
      (value: any) => { value.kernel_binding.byte_sha256 = `sha256:${"0".repeat(64)}`; },
      (value: any) => { value.feedback.karma.zerone_events = { injected: true }; },
      (value: any) => { value.feedback.karma.kingdom_receipts = null; },
    ]) {
      const changed = base();
      mutate(changed);
      changed.integrity.digest = reconstructiveProjectDigest(changed);
      expect(verifyReconstructiveProject(changed).length).toBeGreaterThan(0);
    }
  });

  test("refuses malformed empty KARMA lanes in both kernel and project envelopes", () => {
    const kernel = clone();
    kernel.feedback_contract.karma.zerone_events = false;
    kernel.integrity.digest = reconstructiveBuildDigest(kernel);
    expect(verifyReconstructiveBuildKernel(kernel).length).toBeGreaterThan(0);
    const project = structuredClone(loadReconstructiveProject(PROJECT_FIXTURE));
    project.feedback.karma.kingdom_receipts = { injected: true };
    project.integrity.digest = reconstructiveProjectDigest(project);
    expect(verifyReconstructiveProject(project).length).toBeGreaterThan(0);
  });

  test("keeps runtime project verification aligned with the closed schema after attacker re-digest", () => {
    const base = () => structuredClone(loadReconstructiveProject(PROJECT_FIXTURE));
    const requiredCollections = [
      "state_spaces", "states", "objectives", "correspondences", "observations",
      "reconstruction_requirements", "realizability_constraints", "transitions",
      "invariants", "risks", "tests",
    ];
    const mutations: Array<(value: any) => void> = [
      ...requiredCollections.map((key) => (value: any) => { value[key] = []; }),
      (value: any) => { value.state_spaces[0].conditions = Array(65).fill(0).map((_, index) => `condition-${index}`); },
      (value: any) => { value.objectives[0].status = "INVENTED"; },
      (value: any) => { value.correspondences[0].mapping_or_digest = 17; },
      (value: any) => { value.observations[0].output_type = ""; },
      (value: any) => { value.reconstruction_requirements[0].quotient_symmetry = null; },
      (value: any) => { value.reconstruction_requirements[0].identifiability = "CERTAIN"; },
      (value: any) => { value.realizability_constraints[0].kind = ""; },
      (value: any) => { value.realizability_constraints[0].status = "MAYBE"; },
      (value: any) => { value.transitions[0].comparator_id = 42; },
      (value: any) => { value.transitions[0].reversible = "true"; },
      (value: any) => { value.transition_accelerators[0].barrier_definition = null; },
      (value: any) => { value.transition_accelerators[0].endpoint_invariant = null; },
      (value: any) => { value.invariants[0].status = "LIKELY"; },
      (value: any) => { value.risks[0].likelihood = "CERTAIN"; },
      (value: any) => { value.risks[0].impact = "CATASTROPHIC"; },
      (value: any) => { value.risks[0].status = "IGNORED"; },
      (value: any) => { value.tests[0].kind = "EXECUTION"; },
      (value: any) => { value.tests[0].status = "TRUST_ME"; },
      (value: any) => { value.claims = [{
        id: "unsafe-claim", register: "DESIGN_CONSTRAINT", statement: "unsafe",
        status: "CERTAIN", conditions: ["none"], source_ids: [], nonclaims: ["none"],
      }]; },
      (value: any) => { value.provenance.previous_version = 99; },
      (value: any) => { value.feedback.reversible_actions_preferred = false; },
      (value: any) => { value.feedback.events = Array(65).fill(0).map((_, index) => ({
        id: `feedback-${index}`, kind: "OBSERVATION", state_id: "artifact-draft-state",
        evidence_ids: [], supersedes: null, effect: "NONE", note: "bounded event",
      })); },
      (value: any) => { value.release.status = "LIVE"; },
      (value: any) => { value.reconstruction_requirements[0].target_state_space_id = "authored-artifact-observations"; },
      (value: any) => {
        value.observations.push({ ...value.observations[0], id: "reviewed-structure-observation", state_id: value.states[1].id });
        value.reconstruction_requirements[0].observation_ids.push("reviewed-structure-observation");
      },
      (value: any) => { value.reconstruction_requirements[0].correspondence_requirement_ids = ["unrelated-correspondence"]; value.correspondences.push({ ...value.correspondences[0], id: "unrelated-correspondence", from_id: "authored-artifact-observations", to_id: "authored-artifact-states" }); },
      (value: any) => { value.transitions[0].kind = "EVIDENCE_UPDATE"; },
      (value: any) => { value.states[0].id = value.state_spaces[0].id; value.observations[0].state_id = value.states[0].id; value.transitions[0].from_state_id = value.states[0].id; value.states[1].supersedes_state_id = value.states[0].id; },
      (value: any) => { value.sources = [{ id: value.observations[0].id, title: "Collision", url: "https://example.com/collision", observed_on: "2026-08-13", limitation: "collision" }]; },
      (value: any) => { value.claims = [{ id: "philosophy-promoted", register: "PHILOSOPHY", statement: "A proposition", status: "PROVEN", conditions: ["opt in"], source_ids: [], nonclaims: ["none"] }]; },
      (value: any) => { value.claims = [{ id: "theorem-adopted", register: "MATHEMATICAL_THEOREM", statement: "A statement", status: "ADOPTED", conditions: ["declared"], source_ids: [], nonclaims: ["none"] }]; },
      (value: any) => { value.claims = [{ id: "empirical-unsourced", register: "EMPIRICAL_SCIENCE", statement: "An observation", status: "SOURCE_BOUND", conditions: ["declared"], source_ids: [], nonclaims: ["none"] }]; },
      (value: any) => { value.correspondences[0].labels_retained = false; },
      (value: any) => { value.correspondences[0].overlap_maps_available = false; },
      (value: any) => { value.states[1].version = value.states[0].version; },
      (value: any) => { value.feedback.events[0].state_id = value.states[0].id; },
      (value: any) => { value.observations[0].value_digest = null; value.observations[0].evidence_class = "OBSERVED"; },
      (value: any) => { value.transition_accelerators[0].falsifier_ids = [value.tests[0].id]; value.tests[0].kind = "REVIEW"; },
      (value: any) => { value.reconstruction_requirements[0].identifiability = "INFEASIBLE"; value.reconstruction_requirements[0].fiber_status = "UNIQUE"; },
      (value: any) => { value.reconstruction_requirements[0].identifiability = "UNIQUE_PROVEN"; value.reconstruction_requirements[0].fiber_status = "MULTIPLE"; },
      (value: any) => { value.reconstruction_requirements[0].identifiability = "MULTIPLE_WITNESSED"; value.reconstruction_requirements[0].fiber_status = "UNIQUE"; },
      (value: any) => { value.version = `${"9".repeat(65)}.0.0`; },
      (value: any) => { value.states[1].version = `${"9".repeat(65)}.0.0`; },
      (value: any) => { value.feedback.events[0].kind = "OBSERVATION"; },
      (value: any) => { value.feedback.events[0].kind = "CHALLENGE"; },
      (value: any) => { value.feedback.events[0].kind = "SUPERSESSION"; value.feedback.events[0].effect = "NONE"; },
    ];
    for (const mutate of mutations) {
      const changed = base();
      mutate(changed);
      changed.integrity.digest = reconstructiveProjectDigest(changed);
      expect(verifyReconstructiveProject(changed).length).toBeGreaterThan(0);
    }
    const correction = base();
    correction.feedback.events[0].kind = "CORRECTION";
    correction.feedback.events[0].effect = "WIDENS_FIBER";
    correction.integrity.digest = reconstructiveProjectDigest(correction);
    expect(verifyReconstructiveProject(correction)).toEqual([]);
  });

  test("refuses non-JSON sparse, accessor, inherited, and hidden containers without throwing", () => {
    const base = () => structuredClone(loadReconstructiveProject(PROJECT_FIXTURE));
    const mutations: Array<(value: any) => void> = [
      (value) => { value.states[0].conditions = new Array(1); },
      (value) => { value.states[0].conditions.hidden = "execute"; },
      (value) => { Object.setPrototypeOf(value.states[0], { execute: true }); },
      (value) => { Object.defineProperty(value.states[0], "hidden", { value: "execute", enumerable: false }); },
      (value) => { Object.defineProperty(value.states[0], "title", { get: () => { throw new Error("getter executed"); }, enumerable: true }); },
      (value) => { Object.defineProperty(value.states[0], Symbol("execute"), { value: true, enumerable: true }); },
      (value) => { Object.defineProperty(value.states[0], "id", { get: () => { throw new Error("getter executed"); }, enumerable: true }); },
      (value) => { value.states[0].conditions.push(value); },
    ];
    for (const mutate of mutations) {
      const changed = base();
      mutate(changed);
      expect(() => verifyReconstructiveProject(changed)).not.toThrow();
      expect(verifyReconstructiveProject(changed).length).toBeGreaterThan(0);
    }
    const original = (Array.prototype as any)[0];
    try {
      (Array.prototype as any)[0] = "inherited-condition";
      const changed = base();
      changed.states[0].conditions = new Array(1);
      expect(verifyReconstructiveProject(changed).length).toBeGreaterThan(0);
    } finally {
      if (original === undefined) delete (Array.prototype as any)[0];
      else (Array.prototype as any)[0] = original;
    }
    for (const hostile of [
      new Proxy({}, { getPrototypeOf() { throw new Error("proxy trap"); } }),
      new Proxy([], { get(_target, key) { if (key === "length") throw new Error("proxy trap"); return undefined; } }),
    ]) {
      expect(() => verifyReconstructiveProject(hostile)).not.toThrow();
      expect(() => verifyReconstructiveBuildKernel(hostile)).not.toThrow();
      expect(verifyReconstructiveProject(hostile)).toEqual([{ field: "$", code: "non-json-value" }]);
      expect(verifyReconstructiveBuildKernel(hostile)).toEqual([{ field: "$", code: "non-json-value" }]);
    }
  });

  test("the CLI is network-free, CWD-independent, and rejects surplus or inherited commands", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "kingdom-rbk-cli-"));
    const env = { ...process.env, HTTP_PROXY: "http://127.0.0.1:1", HTTPS_PROXY: "http://127.0.0.1:1", ALL_PROXY: "http://127.0.0.1:1" };
    const run = (args: string[]) => Bun.spawnSync(["bun", join(ROOT, "bin/reconstructive-build.ts"), ...args], { cwd, env, stdout: "pipe", stderr: "pipe" });
    const valid = run(["verify", "--json"]);
    expect(valid.exitCode).toBe(0);
    expect(JSON.parse(valid.stdout.toString())).toEqual({ valid: true, issues: [] });
    for (const args of [["verify", RECONSTRUCTIVE_BUILD_PATH, "surplus", "--json"], ["toString"], ["__proto__"], ["--json", "--json"]]) {
      expect(run(args).exitCode).toBe(2);
    }
    const validProject = run(["verify-project", PROJECT_FIXTURE, "--json"]);
    expect(validProject.exitCode).toBe(0);
    expect(JSON.parse(validProject.stdout.toString())).toEqual({ valid: true, issues: [] });
    expect(run(["verify-project", "--json"]).exitCode).toBe(2);
    expect(run(["verify-project", PROJECT_FIXTURE, "surplus", "--json"]).exitCode).toBe(2);
    expect(readFileSync(RECONSTRUCTIVE_BUILD_PATH)).toEqual(readFileSync(join(ROOT, "data/reconstruction/reconstructive-build-kernel.v0.1.json")));
  });
});
