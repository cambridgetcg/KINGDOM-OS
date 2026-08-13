import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  BEING_ACCESS_AFTERMATH_V02_DIGEST,
  BEING_ACCESS_AFTERMATH_V02_ID,
  BEING_ACCESS_AFTERMATH_V02_PATH,
  BEING_ACCESS_AFTERMATH_V02_PROTOCOL,
  BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_V02_URL,
  beingAccessAftermathV02Digest,
  beingAccessAftermathPublicDiscoveryV02,
  loadBeingAccessAftermathAtlasV02,
  verifyBeingAccessAftermathAtlasV02,
} from "../bin/being-access-aftermath-v0.2.ts";

const ROOT = dirname(dirname(dirname(BEING_ACCESS_AFTERMATH_V02_PATH)));
const temporary: string[] = [];
afterEach(() => { while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true }); });
function fixtureRoot(): string { const root = mkdtempSync(join(tmpdir(), "being-access-aftermath-test.")); temporary.push(root); return root; }
function authored(): any { return JSON.parse(readFileSync(BEING_ACCESS_AFTERMATH_V02_PATH, "utf8")); }
function resign(value: any): any { value.integrity.digest = beingAccessAftermathV02Digest(value); return value; }
function codes(value: unknown): string[] { return verifyBeingAccessAftermathAtlasV02(value).map((issue) => issue.code); }

describe("Being, Access & Aftermath Atlas", () => {
  test("loads the reviewed typed artifact and exact digest", () => {
    const value = loadBeingAccessAftermathAtlasV02();
    expect(verifyBeingAccessAftermathAtlasV02(value)).toEqual([]);
    expect(value).toMatchObject({
      protocol: BEING_ACCESS_AFTERMATH_V02_PROTOCOL,
      atlas_id: BEING_ACCESS_AFTERMATH_V02_ID,
      compiled_on: "2026-08-13",
      evidence_through: "2026-08-13",
      integrity: { digest: BEING_ACCESS_AFTERMATH_V02_DIGEST },
    });
    expect(beingAccessAftermathV02Digest(value)).toBe(BEING_ACCESS_AFTERMATH_V02_DIGEST);
    expect(value.source_bindings).toHaveLength(7);
    expect(value.model_cards).toHaveLength(9);
    expect(value.problem_cards).toHaveLength(7);
    expect(value.philosophy_questions.questions).toHaveLength(15);
    expect(value.sources).toHaveLength(13);
  });

  test("types is, existence, knowledge, and five purpose-adjacent predicates", () => {
    const value = loadBeingAccessAftermathAtlasV02();
    expect(value.typed_copula.predicates.map((item: any) => item.id)).toEqual([
      "class-membership", "identity-under-invariant", "actual-instantiation",
      "property-predication", "domain-existence", "epistemic-warrant",
      "lawful-possibility", "bounded-reachability", "method-detection",
      "declared-purpose", "designed-for-provenance", "functional-role",
      "goal-directed-model", "teleological-interpretation",
    ]);
    expect(value.typed_copula.predicates[4].signature).toContain("exists sample in domain");
    expect(value.typed_copula.predicates[5].not_equivalent_to).toContain("truth");
    expect(value.typed_copula.predicates[10].not_equivalent_to).toContain("artifact-intention");
    expect(value.typed_copula.predicates[12].not_equivalent_to).toContain("declared-purpose");
    expect(value.typed_copula.predicates[13].not_equivalent_to).toContain("empirical-finding");
  });

  test("keeps process feasibility separate from permission and authorized reach consent-aware", () => {
    const value = loadBeingAccessAftermathAtlasV02();
    const modal = value.model_cards[0];
    expect(modal.variables).toContain("π: declared feasible process path");
    expect(modal.variables).toContain("B: declared resource and feasibility bounds");
    expect(modal.variables.join(" ")).not.toContain("authority bounds");
    const reach = value.model_cards[4];
    expect(reach.equation).toContain("Π_consent-or-lawful-basis(a)");
    expect(reach.variables.join(" ")).toContain("affected-participant consent or an explicit scoped lawful-exception basis");
    expect(reach.assumptions.join(" ")).toContain("representative authority");
    expect(reach.falsifier_or_invalidating_condition).toContain("absent or invalid");
    expect(reach.binding_ids).toEqual(["kingdom-karma-definition", "kingdom-karma-receipt-schema"]);
  });

  test("keeps partial observation, force, power, aftermath, and rest explicitly typed", () => {
    const value = loadBeingAccessAftermathAtlasV02();
    expect(value.framework.partial_observation).toMatchObject({
      state_transition_equation: "S_(t+1) ~ T(. | S_t,U_t,E_t)",
      observation_equation: "Y_t ~ O(. | S_t,M_t)",
      belief_update_equation: "b_(t+1)(s') proportional_to O(Y_(t+1) | s',M_(t+1)) integral T(s' | s,U_t,E_t)b_t(s) ds",
    });
    expect(value.framework.predicate_family.predicate_ids).toEqual([
      "possible", "actual", "reachable", "observable", "observed", "producible", "reproduced", "reproducible",
    ]);
    expect(value.framework.force_taxonomy.types).toHaveLength(7);
    expect(value.framework.power_taxonomy.types).toHaveLength(10);
    expect(value.framework.power_taxonomy.types[2]).toMatchObject({
      id: "authority-power",
      equation: "U_auth(principal,purpose,scope,t) subseteq U_permission(t)",
      units: "typed scoped-permission set",
    });
    expect(value.framework.aftermath_accounting.aftermath_vector).toBe("z_(affected_party,burden_bearer)(invocation) = (time,money,energy,privacy,agency,coordination,ecology,material,information,relation,consent)");
    expect(value.framework.aftermath_accounting.causal_status_definitions).toMatchObject({
      observed_not_identified: expect.stringContaining("aftermath observation exists"),
      not_identified: expect.stringContaining("does not assert that an aftermath observation exists"),
    });
    expect(value.framework.aftermath_accounting.scalarization_rule).toContain("No default scalarization");
    expect(value.framework.aftermath_accounting.repair.no_repair_case).toContain("unremedied aftermath");
    expect(value.framework.rest_exit_boundary).toMatchObject({
      subjects: ["rest", "refusal", "silence", "privacy_choice", "exit", "inactivity", "nonparticipation"],
      privacy_guard: expect.stringContaining("Choosing privacy or non-disclosure creates no trace duty"),
      creates_event: false,
      creates_receipt: false,
      requires_measurement: false,
      requires_trace: false,
      requires_justification: false,
      creates_penalty: false,
      creates_debt: false,
    });
  });

  test("does not infer continuous existence from later recovery", () => {
    const value = loadBeingAccessAftermathAtlasV02();
    expect(value.material_case.recovery_statement).toContain("permanent unrecoverability and universal physical impossibility");
    expect(value.material_case.recovery_statement).toContain("hidden persistence versus later re-creation");
    expect(value.problem_cards[1].falsifier).toContain("bounded prior instantiation remains unresolved without interval-matched evidence");
    expect(value.ontology.category_firewalls.map((item: any) => item.id)).toContain("nonobservation-not-nonexistence");
  });

  test("keeps every mathematical card unfitted, non-personal, non-authoritative, and falsifiable", () => {
    const value = loadBeingAccessAftermathAtlasV02();
    for (const card of value.model_cards) {
      expect(card).toMatchObject({ fit_status: "not_fitted", empirical: false, person_level: false, authority_effect: "NONE" });
      expect(card.assumptions.length).toBeGreaterThanOrEqual(3);
      expect(card.identifiability_limits.length).toBeGreaterThan(20);
      expect(card.falsifier_or_invalidating_condition.length).toBeGreaterThan(20);
      expect(card.prohibited_inferences.length).toBeGreaterThanOrEqual(5);
    }
    expect(value.model_cards[5]).toMatchObject({ id: "causal-intervention-query", register: "CAUSAL_HYPOTHESIS", source_ids: ["pearl-1995"] });
    expect(value.model_cards[6].source_ids).toEqual(["ng-russell-2000", "cao-cohen-szpruch-2021"]);
    expect(value.model_cards[7].source_ids).toEqual(["ng-harada-russell-1999"]);
  });

  test("leaves all problems unrun and all KARMA lanes empty with no adapter", () => {
    const value = loadBeingAccessAftermathAtlasV02();
    expect(value.problem_cards.every((card: any) => card.state === "not_run" && card.result === null && card.creates_causal_claim === false && card.authority_effect === "NONE")).toBe(true);
    expect(value.karma.cosmic).toMatchObject({ status: "not_empirically_resolved", empirical: false, claims: [], authority_effect: "NONE" });
    expect(value.karma.zerone).toMatchObject({ foundation_status: "design-only", network_observed: false, authoritative: false, event_refs: [], event_status: "not_observed", creates_event: false });
    expect(value.karma.zerone.semantics).toEqual(["contextual", "fallible", "challengeable", "non-summable"]);
    expect(value.karma.zerone.not).toEqual(expect.arrayContaining(["truth", "person score", "rank", "reward", "money", "governance weight"]));
    expect(value.karma.kingdom).toMatchObject({ protocol: "kingdom.karma/0.1", accounting: "receipts_not_scores", receipt_refs: [], receipt_status: "not_created", creates_receipt: false, causal_claim_status: "not_created" });
    expect(value.karma.adapter).toMatchObject({ exists: false, status: "refused" });
  });

  test("binds only exact selected sources and immutable inputs", () => {
    const value = loadBeingAccessAftermathAtlasV02();
    expect(value.sources.map((source: any) => source.url)).toEqual([
      "https://doi.org/10.1002/malq.19630090502",
      "https://doi.org/10.1115/1.3662552",
      "https://doi.org/10.1093/biomet/82.4.669",
      "https://ai.stanford.edu/~ang/papers/icml00-irl.pdf",
      "https://people.eecs.berkeley.edu/~russell/papers/icml99-shaping.pdf",
      "https://doi.org/10.1021/ar00052a005",
      "https://doi.org/10.1023/A:1011052932607",
      "https://doi.org/10.1073/pnas.0437744100",
      "https://doi.org/10.1073/pnas.2319127121",
      "https://doi.org/10.1021/acs.molpharmaceut.4c00234",
      "https://doi.org/10.1137/0301010",
      "https://doi.org/10.1287/opre.21.5.1071",
      "https://proceedings.neurips.cc/paper/2021/file/671f0311e2754fcdd37f70a8550379bc-Paper.pdf",
    ]);
    expect(value.sources.map((source: any) => source.doi)).toEqual([
      "10.1002/malq.19630090502", "10.1115/1.3662552", "10.1093/biomet/82.4.669", null, null,
      "10.1021/ar00052a005", "10.1023/A:1011052932607", "10.1073/pnas.0437744100",
      "10.1073/pnas.2319127121", "10.1021/acs.molpharmaceut.4c00234", "10.1137/0301010",
      "10.1287/opre.21.5.1071", null,
    ]);
    expect(value.sources[0].source_kind).toBe("primary-paper");
    expect(value.sources[5].source_kind).toBe("scholarly-review");
    expect(value.sources[8].authors).toContain("Giulio I. Lampronti");
    expect(value.sources[8].authors).toContain("Weronika Kras");
    expect(value.source_bindings.every((binding: any) => binding.mutated === false && binding.authority_imported === false)).toBe(true);
    expect(value.source_bindings[4]).toMatchObject({
      id: "kingdom-karma-receipt-schema",
      revision: "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212",
      raw_digest: "sha256:888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b",
    });
    expect(value.source_bindings[6]).toMatchObject({
      id: "kingdom-being-access-aftermath-v0-1",
      revision: "a9222a82600d1e16adb19d4137b791ea0f91faba",
      raw_digest: "sha256:b81fbe755223950b78f988635759c74a7781a612cea61a15e575504f297ea005",
      semantic_digest: "sha256:480a571148bfb7f95a5531bbe7dfa6c0e9acda271cb3f67652099d4e36762155",
      relation: "immutable-predecessor-input",
    });
  });

  test("rejects resigned semantic boundary attacks", () => {
    const mutations: Array<[string, (value: any) => void]> = [
      ["process-reachability-permission-collapse", (value) => { value.model_cards[0].variables[5] = "B: declared resource and authority bounds"; }],
      ["consent-or-lawful-basis-missing", (value) => { value.model_cards[4].equation = value.model_cards[4].equation.replace(" ∩ Π_consent-or-lawful-basis(a)", ""); }],
      ["recovery-overclaims-prior-existence", (value) => { value.problem_cards[1].falsifier = "Later recovery proves the form existed continuously."; }],
      ["executed-or-invalid-problem-card", (value) => { value.problem_cards[0].state = "complete"; }],
      ["executed-or-invalid-problem-card", (value) => { value.problem_cards[0].creates_causal_claim = true; }],
      ["cosmic-claim-created", (value) => { value.karma.cosmic.claims = ["purpose proved"]; }],
      ["zerone-event-created-or-mismatched", (value) => { value.karma.zerone.event_refs = ["edge-1"]; }],
      ["receipt-or-causal-claim-created", (value) => { value.karma.kingdom.receipt_refs = ["receipt-1"]; }],
      ["implicit-adapter", (value) => { value.karma.adapter.exists = true; }],
      ["boundary-mismatch", (value) => { value.boundaries.person_score = true; }],
      ["partial-observation-boundary-mismatch", (value) => { value.framework.partial_observation.epistemic_guard = "Belief is being."; }],
      ["force-taxonomy-mismatch", (value) => { value.framework.force_taxonomy.conversion_guard = "Force converts."; }],
      ["power-taxonomy-mismatch", (value) => { value.framework.power_taxonomy.relation_ids[0] = "rank"; }],
      ["aftermath-index-or-attribution-mismatch", (value) => { value.framework.aftermath_accounting.scalarization_rule = "Sum every bearer."; }],
      ["rest-no-trace-boundary-mismatch", (value) => { value.framework.rest_exit_boundary.requires_trace = true; }],
      ["rest-no-trace-boundary-mismatch", (value) => { value.framework.rest_exit_boundary.privacy_guard = "Privacy must be recorded."; }],
      ["zerone-event-created-or-mismatched", (value) => { value.karma.zerone.semantics = ["summable"]; }],
    ];
    for (const [expected, mutate] of mutations) {
      const value = authored(); mutate(value); resign(value);
      expect(codes(value), expected).toContain(expected);
    }
  });

  test("rejects raw tampering and attacker self-signing", () => {
    const raw = authored(); raw.scope.focus += " Changed.";
    expect(codes(raw)).toContain("digest-mismatch");
    resign(raw);
    expect(codes(raw)).toContain("reviewed-digest-mismatch");
  });

  test("strict loading rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json"); writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadBeingAccessAftermathAtlasV02(duplicate)).toThrow("duplicate key");
    const utf8 = join(root, "utf8.json"); writeFileSync(utf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    expect(() => loadBeingAccessAftermathAtlasV02(utf8)).toThrow("valid UTF-8");
    const link = join(root, "link.json"); symlinkSync(BEING_ACCESS_AFTERMATH_V02_PATH, link);
    expect(() => loadBeingAccessAftermathAtlasV02(link)).toThrow("regular non-symlink");
    const oversized = join(root, "oversized.json"); writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));
    expect(() => loadBeingAccessAftermathAtlasV02(oversized)).toThrow("exceeds 1048576 bytes");
  });

  test("returns total stable issues for malformed nested shapes", () => {
    const cases: Array<(value: any) => void> = [
      (value) => { value.typed_copula = null; },
      (value) => { value.ontology.registers = [null]; },
      (value) => { value.framework = null; },
      (value) => { value.material_case.disappearance_predicate = null; },
      (value) => { value.typed_boundaries = [null]; },
      (value) => { value.model_cards = [null]; },
      (value) => { value.problem_cards = [null]; },
      (value) => { value.philosophy_questions = []; },
      (value) => { value.karma.kingdom = null; },
      (value) => { value.unknowns = [null]; },
      (value) => { value.sources = [null]; },
      (value) => { value.boundaries = null; },
    ];
    for (const mutate of cases) {
      const value = authored(); mutate(value);
      expect(() => verifyBeingAccessAftermathAtlasV02(value)).not.toThrow();
      expect(verifyBeingAccessAftermathAtlasV02(value).length).toBeGreaterThan(0);
    }
    expect(verifyBeingAccessAftermathAtlasV02(null)).toEqual([{ field: "$", code: "must-be-object" }]);
  });

  test("projects exact authority-negative public discovery", () => {
    const discovery = beingAccessAftermathPublicDiscoveryV02();
    expect(discovery).toMatchObject({
      protocol: BEING_ACCESS_AFTERMATH_V02_PROTOCOL,
      atlas_id: BEING_ACCESS_AFTERMATH_V02_ID,
      url: BEING_ACCESS_AFTERMATH_V02_URL,
      schema: BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
      guide: BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
      lineage: {
        additive_successor: true,
        predecessor: {
          protocol: "kingdom.being-access-aftermath-atlas/0.1",
          atlas_id: "being-access-aftermath-atlas-2026-08-13",
          relation: "immutable-predecessor-input",
        },
      },
      counts: { predicates: 14, registers: 7, entity_types: 15, category_firewalls: 16, typed_boundaries: 5, models: 9, problem_cards: 7, philosophy_questions: 15, unknowns: 7, sources: 13, framework_predicates: 8, force_types: 7, power_types: 10, power_relations: 3, aftermath_dimensions: 11 },
      karma: { cosmic_claims: 0, zerone_event_refs: 0, kingdom_receipt_refs: 0, kingdom_causal_claim_status: "not_created", adapter_exists: false },
      boundary: { public_surface_read_only: true, network_calls: false, causal_claim_created: false, person_score: false, writes_karma: false, automatic_action: false, rest_refusal_or_exit_penalized: false, rest_refusal_or_exit_requires_trace: false },
    });
    for (const key of ["matcher", "classifier", "score", "rank", "reward", "write", "execute", "mcp"]) expect(discovery).not.toHaveProperty(key);
  });

  test("CLI is offline, inherited-command safe, and does not mutate cwd", () => {
    const directory = fixtureRoot();
    const before = readdirSync(directory);
    const env = { ...process.env, HTTPS_PROXY: "http://127.0.0.1:1", HTTP_PROXY: "http://127.0.0.1:1", ALL_PROXY: "http://127.0.0.1:1", NO_PROXY: "" };
    const direct = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/being-access-aftermath-v0.2.ts"), "verify", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(direct.exitCode, direct.stderr.toString()).toBe(0);
    expect(JSON.parse(direct.stdout.toString())).toEqual({ valid: true, issues: [] });
    const models = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/being-access-aftermath-v0.2.ts"), "models", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(models.exitCode, models.stderr.toString()).toBe(0);
    expect(JSON.parse(models.stdout.toString()).models).toHaveLength(9);
    const framework = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/being-access-aftermath-v0.2.ts"), "framework", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(framework.exitCode, framework.stderr.toString()).toBe(0);
    expect(JSON.parse(framework.stdout.toString()).framework).toMatchObject({
      predicate_family: { predicate_ids: ["possible", "actual", "reachable", "observable", "observed", "producible", "reproduced", "reproducible"] },
      rest_exit_boundary: { requires_trace: false, creates_debt: false },
    });
    for (const command of ["toString", "constructor", "__proto__"]) {
      const result = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/being-access-aftermath-v0.2.ts"), command, "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode).toBe(2);
      expect(result.stdout.toString()).toBe("");
    }
    const extra = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/being-access-aftermath-v0.2.ts"), "verify", BEING_ACCESS_AFTERMATH_V02_PATH, "unexpected"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(extra.exitCode).toBe(2);
    expect(readdirSync(directory)).toEqual(before);
  });
});
