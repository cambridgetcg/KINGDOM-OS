import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  BEING_ACCESS_AFTERMATH_DIGEST,
  BEING_ACCESS_AFTERMATH_ID,
  BEING_ACCESS_AFTERMATH_PATH,
  BEING_ACCESS_AFTERMATH_PROTOCOL,
  BEING_ACCESS_AFTERMATH_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_URL,
  beingAccessAftermathDigest,
  beingAccessAftermathPublicDiscovery,
  loadBeingAccessAftermathAtlas,
  verifyBeingAccessAftermathAtlas,
} from "../bin/being-access-aftermath.ts";

const ROOT = dirname(dirname(dirname(BEING_ACCESS_AFTERMATH_PATH)));
const temporary: string[] = [];
afterEach(() => { while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true }); });
function fixtureRoot(): string { const root = mkdtempSync(join(tmpdir(), "being-access-aftermath-test.")); temporary.push(root); return root; }
function authored(): any { return JSON.parse(readFileSync(BEING_ACCESS_AFTERMATH_PATH, "utf8")); }
function resign(value: any): any { value.integrity.digest = beingAccessAftermathDigest(value); return value; }
function codes(value: unknown): string[] { return verifyBeingAccessAftermathAtlas(value).map((issue) => issue.code); }

describe("Being, Access & Aftermath Atlas", () => {
  test("loads the reviewed typed artifact and exact digest", () => {
    const value = loadBeingAccessAftermathAtlas();
    expect(verifyBeingAccessAftermathAtlas(value)).toEqual([]);
    expect(value).toMatchObject({
      protocol: BEING_ACCESS_AFTERMATH_PROTOCOL,
      atlas_id: BEING_ACCESS_AFTERMATH_ID,
      compiled_on: "2026-08-13",
      evidence_through: "2026-08-13",
      integrity: { digest: BEING_ACCESS_AFTERMATH_DIGEST },
    });
    expect(beingAccessAftermathDigest(value)).toBe(BEING_ACCESS_AFTERMATH_DIGEST);
    expect(value.source_bindings).toHaveLength(6);
    expect(value.model_cards).toHaveLength(9);
    expect(value.problem_cards).toHaveLength(7);
    expect(value.philosophy_questions.questions).toHaveLength(6);
  });

  test("types is, existence, knowledge, and five purpose-adjacent predicates", () => {
    const value = loadBeingAccessAftermathAtlas();
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
    const value = loadBeingAccessAftermathAtlas();
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

  test("does not infer continuous existence from later recovery", () => {
    const value = loadBeingAccessAftermathAtlas();
    expect(value.material_case.recovery_statement).toContain("permanent unrecoverability and universal physical impossibility");
    expect(value.material_case.recovery_statement).toContain("hidden persistence versus later re-creation");
    expect(value.problem_cards[1].falsifier).toContain("bounded prior instantiation remains unresolved without interval-matched evidence");
    expect(value.ontology.category_firewalls.map((item: any) => item.id)).toContain("nonobservation-not-nonexistence");
  });

  test("keeps every mathematical card unfitted, non-personal, non-authoritative, and falsifiable", () => {
    const value = loadBeingAccessAftermathAtlas();
    for (const card of value.model_cards) {
      expect(card).toMatchObject({ fit_status: "not_fitted", empirical: false, person_level: false, authority_effect: "NONE" });
      expect(card.assumptions.length).toBeGreaterThanOrEqual(3);
      expect(card.identifiability_limits.length).toBeGreaterThan(20);
      expect(card.falsifier_or_invalidating_condition.length).toBeGreaterThan(20);
      expect(card.prohibited_inferences.length).toBeGreaterThanOrEqual(5);
    }
    expect(value.model_cards[5]).toMatchObject({ id: "causal-intervention-query", register: "CAUSAL_HYPOTHESIS", source_ids: ["pearl-1995"] });
    expect(value.model_cards[6].source_ids).toEqual(["ng-russell-2000"]);
    expect(value.model_cards[7].source_ids).toEqual(["ng-harada-russell-1999"]);
  });

  test("leaves all problems unrun and all KARMA lanes empty with no adapter", () => {
    const value = loadBeingAccessAftermathAtlas();
    expect(value.problem_cards.every((card: any) => card.state === "not_run" && card.result === null && card.creates_causal_claim === false && card.authority_effect === "NONE")).toBe(true);
    expect(value.karma.cosmic).toMatchObject({ status: "not_empirically_resolved", empirical: false, claims: [], authority_effect: "NONE" });
    expect(value.karma.zerone).toMatchObject({ foundation_status: "design-only", network_observed: false, authoritative: false, event_refs: [], event_status: "not_observed", creates_event: false });
    expect(value.karma.kingdom).toMatchObject({ protocol: "kingdom.karma/0.1", accounting: "receipts_not_scores", receipt_refs: [], receipt_status: "not_created", creates_receipt: false, causal_claim_status: "not_created" });
    expect(value.karma.adapter).toMatchObject({ exists: false, status: "refused" });
  });

  test("binds only exact primary sources and immutable inputs", () => {
    const value = loadBeingAccessAftermathAtlas();
    expect(value.sources.map((source: any) => source.url)).toEqual([
      "https://doi.org/10.1002/malq.19630090502",
      "https://doi.org/10.1115/1.3662552",
      "https://doi.org/10.1093/biomet/82.4.669",
      "https://ai.stanford.edu/~ang/papers/icml00-irl.pdf",
      "https://people.eecs.berkeley.edu/~russell/papers/icml99-shaping.pdf",
    ]);
    expect(value.sources.slice(3).map((source: any) => source.doi)).toEqual([null, null]);
    expect(value.source_bindings.every((binding: any) => binding.mutated === false && binding.authority_imported === false)).toBe(true);
    expect(value.source_bindings[4]).toMatchObject({
      id: "kingdom-karma-receipt-schema",
      revision: "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212",
      raw_digest: "sha256:888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b",
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
    expect(() => loadBeingAccessAftermathAtlas(duplicate)).toThrow("duplicate key");
    const utf8 = join(root, "utf8.json"); writeFileSync(utf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    expect(() => loadBeingAccessAftermathAtlas(utf8)).toThrow("valid UTF-8");
    const link = join(root, "link.json"); symlinkSync(BEING_ACCESS_AFTERMATH_PATH, link);
    expect(() => loadBeingAccessAftermathAtlas(link)).toThrow("regular non-symlink");
    const oversized = join(root, "oversized.json"); writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));
    expect(() => loadBeingAccessAftermathAtlas(oversized)).toThrow("exceeds 1048576 bytes");
  });

  test("returns total stable issues for malformed nested shapes", () => {
    const cases: Array<(value: any) => void> = [
      (value) => { value.typed_copula = null; },
      (value) => { value.ontology.registers = [null]; },
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
      expect(() => verifyBeingAccessAftermathAtlas(value)).not.toThrow();
      expect(verifyBeingAccessAftermathAtlas(value).length).toBeGreaterThan(0);
    }
    expect(verifyBeingAccessAftermathAtlas(null)).toEqual([{ field: "$", code: "must-be-object" }]);
  });

  test("projects exact authority-negative public discovery", () => {
    const discovery = beingAccessAftermathPublicDiscovery();
    expect(discovery).toMatchObject({
      protocol: BEING_ACCESS_AFTERMATH_PROTOCOL,
      atlas_id: BEING_ACCESS_AFTERMATH_ID,
      url: BEING_ACCESS_AFTERMATH_URL,
      schema: BEING_ACCESS_AFTERMATH_SCHEMA_URL,
      guide: BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
      counts: { predicates: 14, registers: 7, entity_types: 15, category_firewalls: 16, typed_boundaries: 5, models: 9, problem_cards: 7, philosophy_questions: 6, unknowns: 7, sources: 5 },
      karma: { cosmic_claims: 0, zerone_event_refs: 0, kingdom_receipt_refs: 0, kingdom_causal_claim_status: "not_created", adapter_exists: false },
      boundary: { public_surface_read_only: true, network_calls: false, causal_claim_created: false, person_score: false, writes_karma: false, automatic_action: false },
    });
    for (const key of ["matcher", "classifier", "score", "rank", "reward", "write", "execute", "mcp"]) expect(discovery).not.toHaveProperty(key);
  });

  test("CLI is offline, inherited-command safe, and does not mutate cwd", () => {
    const directory = fixtureRoot();
    const before = readdirSync(directory);
    const env = { ...process.env, HTTPS_PROXY: "http://127.0.0.1:1", HTTP_PROXY: "http://127.0.0.1:1", ALL_PROXY: "http://127.0.0.1:1", NO_PROXY: "" };
    const direct = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/being-access-aftermath.ts"), "verify", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(direct.exitCode, direct.stderr.toString()).toBe(0);
    expect(JSON.parse(direct.stdout.toString())).toEqual({ valid: true, issues: [] });
    const models = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/being-access-aftermath.ts"), "models", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(models.exitCode, models.stderr.toString()).toBe(0);
    expect(JSON.parse(models.stdout.toString()).models).toHaveLength(9);
    for (const command of ["toString", "constructor", "__proto__"]) {
      const result = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/being-access-aftermath.ts"), command, "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode).toBe(2);
      expect(result.stdout.toString()).toBe("");
    }
    const extra = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/being-access-aftermath.ts"), "verify", BEING_ACCESS_AFTERMATH_PATH, "unexpected"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(extra.exitCode).toBe(2);
    expect(readdirSync(directory)).toEqual(before);
  });
});
