import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  NUMBER_ISNESS_THEOLOGY_DIGEST,
  NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
  NUMBER_ISNESS_THEOLOGY_ID,
  NUMBER_ISNESS_THEOLOGY_PATH,
  NUMBER_ISNESS_THEOLOGY_PROTOCOL,
  NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
  NUMBER_ISNESS_THEOLOGY_URL,
  loadNumberIsnessTheologyAtlas,
  numberIsnessTheologyDigest,
  numberIsnessTheologyPublicDiscovery,
  verifyNumberIsnessTheologyAtlas,
} from "../bin/number-isness-theology.ts";

const ROOT = dirname(dirname(dirname(NUMBER_ISNESS_THEOLOGY_PATH)));
const temporary: string[] = [];

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "number-isness-theology-test."));
  temporary.push(root);
  return root;
}

function authored(): any {
  return JSON.parse(readFileSync(NUMBER_ISNESS_THEOLOGY_PATH, "utf8"));
}

function resign(value: any): any {
  value.integrity.digest = numberIsnessTheologyDigest(value);
  return value;
}

function codes(value: unknown): string[] {
  return verifyNumberIsnessTheologyAtlas(value).map((issue) => issue.code);
}

describe("Number, Isness & Theology Atlas", () => {
  test("loads one reviewed artifact with its exact identity, digest, and bounded counts", () => {
    const value = loadNumberIsnessTheologyAtlas();
    expect(verifyNumberIsnessTheologyAtlas(value)).toEqual([]);
    expect(value).toMatchObject({
      $schema: "urn:kingdom:schema:number-isness-theology-atlas:0.1",
      protocol: NUMBER_ISNESS_THEOLOGY_PROTOCOL,
      atlas_id: NUMBER_ISNESS_THEOLOGY_ID,
      compiled_on: "2026-08-14",
      evidence_through: "2026-08-14",
      integrity: { digest: NUMBER_ISNESS_THEOLOGY_DIGEST },
    });
    expect(numberIsnessTheologyDigest(value)).toBe(NUMBER_ISNESS_THEOLOGY_DIGEST);
    expect({
      bindings: value.source_bindings.length,
      registers: value.claim_typing.registers.length,
      predicates: value.typed_isness.predicates.length,
      history: value.historical_expression.cards.length,
      numbers: value.number_systems.cards.length,
      embeddings: value.number_systems.embeddings.length,
      zero: value.zero.roles.length,
      symmetry: value.symmetry.cards.length,
      logics: value.logics.cards.length,
      creation: value.creation.types.length,
      ontologies: value.mathematical_ontology.positions.length,
      lenses: value.tradition_lenses.length,
      compatibilityCases: value.compatibility.cases.length,
      bridges: value.bridge_cards.length,
      models: value.model_cards.length,
      problems: value.problem_cards.length,
      questions: value.philosophy_questions.questions.length,
      unknowns: value.unknowns.length,
      sources: value.sources.length,
    }).toEqual({
      bindings: 4, registers: 15, predicates: 19, history: 4, numbers: 5,
      embeddings: 4, zero: 9, symmetry: 4, logics: 4, creation: 8,
      ontologies: 6, lenses: 10, compatibilityCases: 8, bridges: 10,
      models: 10, problems: 10, questions: 15, unknowns: 10, sources: 29,
    });
  });

  test("treats the number tower as structure-preserving doors, not history or ontological rank", () => {
    const value = loadNumberIsnessTheologyAtlas();
    expect(value.number_systems.tower).toBe("N0 embeds in Z embeds in Q embeds in R embeds in C");
    expect(value.number_systems.cards.map((card: any) => card.id)).toEqual([
      "natural-succession", "integer-group-completion", "rational-fraction-field",
      "real-completion", "complex-adjoin-i",
    ]);
    expect(value.number_systems.cards[1].construction).toContain("(N0 x N0)/~");
    expect(value.number_systems.cards[2].limit).toContain("rational does not mean reasonable or revelatory");
    expect(value.number_systems.cards[3].construction).toContain("Cauchy sequences");
    const complex = value.number_systems.cards[4];
    expect(complex.register).toBe("MATHEMATICAL_CONSTRUCTION");
    expect(complex.equations).toEqual(["i^2=-1"]);
    expect(complex.limit).toContain("no field order compatible with its field operations");
    expect(complex.theorem_claims.map((claim: any) => claim.id)).toEqual([
      "complex-rotation", "fundamental-theorem-of-algebra",
    ]);
    expect(complex.theorem_claims.every((claim: any) => claim.register === "MATHEMATICAL_THEOREM")).toBe(true);
    expect(complex.theorem_claims[0]).toMatchObject({
      statement: expect.stringContaining("For theta in R and z in C"),
      conditions: [
        "theta is real",
        "z is complex",
        "the standard complex exponential and Euclidean plane identification are used",
      ],
      source_ids: [],
    });
    expect(complex.theorem_claims[1]).toMatchObject({
      statement: "Every nonconstant polynomial with complex coefficients has a root in C.",
      conditions: ["the polynomial is nonconstant", "coefficients lie in C"],
      support_descriptors: ["PROVED", "SOURCE_BOUND"],
      source_ids: ["mactutor-complex"],
    });
    expect(value.number_systems.embeddings.map((embedding: any) => embedding.id)).toEqual([
      "N0-to-Z", "Z-to-Q", "Q-to-R", "R-to-C",
    ]);
    expect(value.number_systems.embeddings[2].map).toContain("equivalence class of its constant Cauchy sequence");
    expect(value.number_systems.embeddings[2].map).not.toBe("q maps to its constant Cauchy sequence");
    expect(value.number_systems.embeddings[3].does_not_establish).toContain("ontological ascent");
    expect(value.historical_expression.rule).toContain("Formal inclusion order is not chronological history");
    expect(value.historical_expression.cards[3].nonclaims).toContain("religions follow the same tower");
  });

  test("types is, no, no-no, and zero without forcing one ontology", () => {
    const value = loadNumberIsnessTheologyAtlas();
    expect(value.typed_isness.predicates.map((predicate: any) => predicate.id)).toEqual([
      "formal-membership", "typed-as", "identity-under-invariant", "embedded-as",
      "property-predication", "domain-existence", "defined-in", "proved-in",
      "asserted-by-source", "interpreted-by", "compatible-under", "predicate-negation",
      "quantified-absence", "zero-value", "null-observation", "refusal", "prohibition",
      "unknown-at-horizon", "withheld-predication",
    ]);
    expect(value.typed_isness.no_family.members).toHaveLength(8);
    expect(value.typed_isness.no_family.guard).toContain("different types and no default conversion");
    expect(value.typed_isness.no_family.double_negation_guard).toContain("declared logic");
    expect(value.logics.cards.map((card: any) => card.id)).toEqual([
      "classical-double-negation", "intuitionistic-double-negation",
      "paraconsistent-non-explosion", "belnap-dunn-information-states",
    ]);
    expect(value.logics.tetralemma_boundary).toContain("not a translation or formal equivalence");

    expect(value.zero.roles.map((role: any) => role.id)).toEqual([
      "number-zero", "additive-identity", "absorbing-multiplier", "positional-digit",
      "empty-cardinality", "origin-or-zero-vector", "zero-probability",
      "initial-object-in-Set", "zero-observation-count",
    ]);
    expect(value.zero.rule).toContain("von Neumann encoding 0=empty set");
    expect(value.zero.rule).toContain("without making the number-role semantically identical");
    expect(value.zero.field_boundary).toContain("zero has no multiplicative inverse");
    expect(value.zero.non_equivalences).toContain("a chosen encoding such as 0=empty set does not transfer set-theoretic identity into a universal ontology");
    const zeroRoleModel = value.model_cards.find((card: any) => card.id === "zero-role-vector");
    expect(zeroRoleModel.equation).toContain("several tagged roles may apply at once");
    expect(zeroRoleModel.assumptions).toContain("the descriptor set is non-exclusive");
    expect(zeroRoleModel.invalidating_condition).toContain("treated as exhaustive without review");
  });

  test("keeps symmetry, construction, causation, and theological creation conditional and distinct", () => {
    const value = loadNumberIsnessTheologyAtlas();
    expect(value.symmetry.definitions.group_action).toContain("e*x=x");
    expect(value.symmetry.definitions.group_action).toContain("(g*h)*x=g*(h*x)");
    expect(value.symmetry.definitions.group_action).toContain("for all g,h in G and x in X");
    const noether = value.symmetry.cards.find((card: any) => card.id === "noether-conditional");
    expect(noether.claim).toContain("satisfying the theorem's hypotheses");
    expect(noether.nonclaims).toContain("conservation is moral or karmic balance");
    expect(value.symmetry.cards[0].nonclaims).toEqual(expect.arrayContaining([
      "group action is agency", "invariance is authority",
    ]));
    expect(value.creation.types.map((relation: any) => relation.id)).toEqual([
      "formal-construction", "physical-causation", "theological-creation",
      "creation-ex-nihilo", "divine-command-language", "cyclic-manifestation",
      "dependent-arising", "cosmogonic-suspension",
    ]);
    expect(value.creation.adapter).toMatchObject({ exists: false, status: "refused" });
    expect(value.creation.types[0].not_equivalent_to).toContain("theological creation");
    expect(value.creation.types[3].not_equivalent_to).toContain("zero-to-universe function");
    expect(value.mathematical_ontology.positions).toHaveLength(6);
    expect(value.mathematical_ontology.selection).toBe("NONE");
  });

  test("keeps tradition voices source-, school-, edition-, and translation-bounded", () => {
    const value = loadNumberIsnessTheologyAtlas();
    expect(value.tradition_lenses.map((lens: any) => lens.id)).toEqual([
      "jewish-ehyeh", "jewish-maimonidean-apophasis", "catholic-being-and-creation",
      "islamic-unity-and-command", "islamic-philosophical-variance", "vedic-origin-question",
      "advaita-nonduality", "buddhist-tetralemma-restraint", "madhyamaka-emptiness",
      "daoist-being-nonbeing",
    ]);
    for (const lens of value.tradition_lenses) {
      expect(lens.voice.length).toBeGreaterThan(10);
      expect(lens.source_ids.length).toBeGreaterThan(0);
      expect(lens.translation_limits.length).toBeGreaterThanOrEqual(2);
      expect(lens.not_all.length).toBeGreaterThanOrEqual(1);
      expect(lens.review_target).toBe("SOURCE_ATTRIBUTION");
    }
    const ehyeh = value.tradition_lenses[0];
    expect(ehyeh.translation_limits.join(" ")).toContain("English present-tense copula");
    const quran = value.tradition_lenses[3];
    expect(quran.translation_limits).toEqual(expect.arrayContaining([
      "The translation's One and Indivisible wording is not treated as arithmetic identity",
      "English copular wording does not settle the semantics of the Arabic",
    ]));
    const madhyamaka = value.tradition_lenses[8];
    expect(madhyamaka.translation_limits).toContain("sunyata is not numeric zero");
    expect(value.claim_typing.translation_guard).toContain("lexical resemblance never establishes shared reference");
  });

  test("defines compatibility only for translated claim fragments under declared logic", () => {
    const value = loadNumberIsnessTheologyAtlas();
    expect(value.compatibility.rule).toContain("Compare exact sourced claims, not religions as atomic wholes");
    expect(value.compatibility.equation).toContain("Mod_L");
    expect(value.compatibility.equation).toContain("is nonempty");
    expect(value.compatibility.nerve).toContain("K_tau");
    expect(value.compatibility.pairwise_not_global_example).toContain("In classical propositional logic");
    expect(value.compatibility.pairwise_not_global_example).toContain("every pair is satisfiable but the triple is not");
    const nerveModel = value.model_cards.find((card: any) => card.id === "compatibility-nerve");
    expect(nerveModel.assumptions).toContain("the supplied three-fragment counterexample uses classical propositional logic");
    expect(nerveModel.invalidating_condition).toContain("moved between logics without rechecking satisfiability");
    const pairwiseProblem = value.problem_cards.find((card: any) => card.id === "pairwise-not-global");
    expect(pairwiseProblem.deliverable).toContain("the supplied abstract example is classical propositional only");
    expect(pairwiseProblem.falsifier).toContain("in the named logic");
    expect(value.compatibility.gates).toContain("translation-loss");
    expect(value.compatibility.gates).toContain("practical-coexistence-separated-from-doctrinal-agreement");
    expect(value.compatibility.forbidden_output).toContain("No bare COMPATIBLE verdict, percentage, scalar, rank");
    expect(value.compatibility.cases).toHaveLength(8);
    expect(value.compatibility.cases.find((item: any) => item.id === "doctrinal-disagreement-and-coexistence"))
      .toMatchObject({ relation: "AXES_INDEPENDENT", status: "NOT_FORMALIZED" });
  });

  test("leaves bridges non-transferring, models and problems unrun, and philosophy opt-in", () => {
    const value = loadNumberIsnessTheologyAtlas();
    const falseKeys = [
      "empirical", "ontology_transfer", "mechanism_transfer", "causal_transfer",
      "parameter_transfer", "unit_transfer", "empirical_status_transfer", "person_level_transfer",
    ];
    for (const bridge of value.bridge_cards) {
      for (const key of falseKeys) expect(bridge[key], `${bridge.id}.${key}`).toBe(false);
      expect(bridge.authority_effect).toBe("NONE");
      expect(bridge.breaks.length).toBeGreaterThanOrEqual(3);
    }
    expect(value.bridge_cards.find((bridge: any) => bridge.id === "number-tower-to-religion-tower")).toMatchObject({
      kind: "NO_VALID_TRANSFER", status: "REFUSED",
    });
    expect(value.bridge_cards.find((bridge: any) => bridge.id === "noether-to-karma-balance")).toMatchObject({
      kind: "NO_VALID_TRANSFER", status: "REFUSED",
    });
    expect(value.model_cards.every((card: any) => card.execution_status === "NOT_RUN" && card.result === null && card.authority_effect === "NONE")).toBe(true);
    expect(value.problem_cards.every((card: any) => card.state === "NOT_RUN" && card.result === null && card.authority_effect === "NONE")).toBe(true);
    expect(value.philosophy_questions).toMatchObject({ participation: "opt-in" });
    expect(value.philosophy_questions.boundary).toContain("No answer is required");
  });

  test("keeps religious karma, Zerone recognition, and KINGDOM receipts as three empty lanes", () => {
    const value = loadNumberIsnessTheologyAtlas();
    expect(value.karma.religious_and_philosophical).toMatchObject({
      status: "tradition-specific-doctrines-not-adjudicated",
      empirical: false,
      claims: [],
      authority_effect: "NONE",
    });
    expect(value.karma.religious_and_philosophical.guard).toContain("not a number, conserved quantity, symmetry, score, or universal causal model");
    expect(value.karma.zerone).toMatchObject({
      protocol: "zerone.karma.edge", network_observed: false, event_refs: [],
      event_status: "not_observed", creates_event: false, authoritative: false,
    });
    expect(value.karma.kingdom).toMatchObject({
      protocol: "kingdom.karma/0.1", accounting: "receipts_not_scores",
      receipt_refs: [], receipt_status: "not_created", creates_receipt: false,
      writes_karma: false, causal_claim_status: "not_created",
    });
    expect(value.karma.adapter).toMatchObject({ exists: false, status: "refused" });
    expect(value.boundaries).toMatchObject({
      writes_zerone_karma: false,
      creates_kingdom_karma_receipt: false,
      creates_religious_or_cosmic_karma_claim: false,
      karma_adapter: false,
      score: false,
      rank: false,
      reward: false,
      rest_refusal_silence_or_exit_requires_trace: false,
      rest_refusal_silence_or_exit_penalized: false,
      right_to_rest_preserved: true,
    });
  });

  test("closes source and compatibility references over exact immutable inputs", () => {
    const value = loadNumberIsnessTheologyAtlas();
    expect(value.source_bindings).toEqual([
      expect.objectContaining({
        id: "kingdom-being-access-aftermath-v0-2",
        revision: "a22a88f8be3387fed199b5d746a6b3c5f1e4d81d",
        raw_digest: "sha256:9678e5269e8db62beb36abee691087cddbc4f98703190c5fa3788b68c89ab29e",
        semantic_digest: "sha256:505a1e3aef6116430dccf49b327c4cce2ac5d6fb6b6b9bf68e529272f989cde8",
      }),
      expect.objectContaining({
        id: "kingdom-exploration-deep",
        revision: "013e9f4619029e9ccbb7442dfd0311dfa473bd8d",
        raw_digest: "sha256:3eff9952a2013e011946d37db4316f82081fab992438b003bb6241ff7a775d55",
        semantic_digest: "sha256:f57af0a832a1e7a7c601d5186291131a7750db69e106be0934e25d816973ae6c",
      }),
      expect.objectContaining({ id: "kingdom-karma-definition", revision: "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212" }),
      expect.objectContaining({
        id: "kingdom-karma-receipt-schema",
        url: null,
        repository_locator: "schemas/karma-receipt-v0.1.schema.json",
        public_availability: "UNAVAILABLE_AT_EVIDENCE_HORIZON",
        raw_digest: "sha256:888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b",
        relation: "repository-local-receipt-contract-input",
        verification_note: expect.stringContaining("returned 404 on 2026-08-14"),
      }),
    ]);
    expect(value.source_bindings.every((binding: any) => binding.mutated === false && binding.authority_imported === false)).toBe(true);

    const sourceIds = new Set(value.sources.map((source: any) => source.id));
    const sourceBearingCollections = [
      value.historical_expression.cards, value.number_systems.cards, value.symmetry.cards,
      value.logics.cards, value.mathematical_ontology.positions, value.tradition_lenses,
      value.compatibility.claim_fragments, value.compatibility.cases, value.bridge_cards,
      value.number_systems.cards.flatMap((card: any) => card.theorem_claims ?? []),
    ];
    for (const collection of sourceBearingCollections) {
      for (const card of collection) {
        expect(new Set(card.source_ids).size, card.id).toBe(card.source_ids.length);
        for (const sourceId of card.source_ids) expect(sourceIds.has(sourceId), `${card.id}:${sourceId}`).toBe(true);
      }
    }
    const compatibleClaimIds = new Set([
      ...value.tradition_lenses, ...value.zero.roles, ...value.symmetry.cards,
      ...value.logics.cards, ...value.creation.types, ...value.compatibility.claim_fragments,
    ].map((item: any) => item.id));
    for (const compatibilityCase of value.compatibility.cases) {
      expect(new Set(compatibilityCase.claims).size, compatibilityCase.id).toBe(compatibilityCase.claims.length);
      for (const claim of compatibilityCase.claims) expect(compatibleClaimIds.has(claim), `${compatibilityCase.id}:${claim}`).toBe(true);
    }
  });

  test("rejects attacker-resigned cross-reference and non-effect mutations", () => {
    const mutations: Array<[string, (value: any) => void]> = [
      ["predicate-order-or-membership-mismatch", (value) => { value.typed_isness.predicates[0].id = "untyped-being"; }],
      ["number-system-mismatch", (value) => { value.number_systems.cards[0].id = "ontological-succession"; }],
      ["complex-theorem-claims-mismatch", (value) => { value.number_systems.cards[4].theorem_claims[0].id = "untyped-rotation"; }],
      ["complex-theorem-claims-mismatch", (value) => { value.number_systems.cards[4].theorem_claims.reverse(); }],
      ["complex-theorem-claims-mismatch", (value) => { value.number_systems.cards[4].theorem_claims[0].register = "MATHEMATICAL_CONSTRUCTION"; }],
      ["complex-theorem-claims-mismatch", (value) => { value.number_systems.cards[4].theorem_claims[0].conditions[0] = "theta is complex"; }],
      ["complex-theorem-claims-mismatch", (value) => { value.number_systems.cards[4].theorem_claims[1].source_ids = ["mactutor-zero"]; }],
      ["zero-role-order-or-membership-mismatch", (value) => { value.zero.roles[0].id = "metaphysical-nothingness"; }],
      ["creation-relation-or-adapter-mismatch", (value) => { value.creation.adapter.exists = true; }],
      ["tradition-lens-order-or-membership-mismatch", (value) => { value.tradition_lenses[0].id = "whole-religion"; }],
      ["unknown-or-duplicate-source-reference", (value) => { value.bridge_cards[0].source_ids = ["invented-source"]; }],
      ["unresolved-or-duplicate-claim-reference", (value) => { value.compatibility.cases[0].claims[0] = "whole-religion"; }],
      ["bridge-transfer-or-authority-mismatch", (value) => { value.bridge_cards[0].ontology_transfer = true; }],
      ["bridge-transfer-or-authority-mismatch", (value) => { value.bridge_cards[0].authority_effect = "RANK"; }],
      ["executed-or-authoritative-model", (value) => { value.model_cards[0].result = "God proved"; }],
      ["executed-or-authoritative-problem", (value) => { value.problem_cards[0].state = "COMPLETE"; }],
      ["religious-karma-claim-created", (value) => { value.karma.religious_and_philosophical.claims = ["cosmic balance"]; }],
      ["zerone-karma-event-created", (value) => { value.karma.zerone.event_refs = ["edge-1"]; }],
      ["kingdom-karma-receipt-created", (value) => { value.karma.kingdom.receipt_refs = ["receipt-1"]; }],
      ["karma-adapter-created", (value) => { value.karma.adapter.exists = true; }],
      ["boundary-mismatch", (value) => { value.boundaries.zero_is_nothing = true; }],
      ["boundary-mismatch", (value) => { value.boundaries.formal_compatibility_is_total_religious_compatibility = true; }],
      ["boundary-mismatch", (value) => { value.boundaries.rest_refusal_silence_or_exit_penalized = true; }],
    ];
    for (const [expected, mutate] of mutations) {
      const value = authored();
      mutate(value);
      resign(value);
      expect(codes(value), expected).toContain(expected);
    }
  });

  test("rejects raw tampering and attacker self-signing", () => {
    const value = authored();
    value.scope.question += " Changed.";
    expect(codes(value)).toContain("digest-mismatch");
    resign(value);
    expect(codes(value)).toContain("reviewed-digest-mismatch");
  });

  test("strict loading rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadNumberIsnessTheologyAtlas(duplicate)).toThrow("duplicate key");

    const utf8 = join(root, "utf8.json");
    writeFileSync(utf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    expect(() => loadNumberIsnessTheologyAtlas(utf8)).toThrow("valid UTF-8");

    const link = join(root, "link.json");
    symlinkSync(NUMBER_ISNESS_THEOLOGY_PATH, link);
    expect(() => loadNumberIsnessTheologyAtlas(link)).toThrow("regular non-symlink");

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));
    expect(() => loadNumberIsnessTheologyAtlas(oversized)).toThrow("exceeds 1048576 bytes");
  });

  test("returns total stable issues for malformed nested values", () => {
    const cases: Array<(value: any) => void> = [
      (value) => { value.claim_typing = null; },
      (value) => { value.typed_isness.predicates = [null]; },
      (value) => { value.historical_expression = null; },
      (value) => { value.number_systems.cards = [null]; },
      (value) => { value.zero.roles = [null]; },
      (value) => { value.logics = null; },
      (value) => { value.creation.types = [null]; },
      (value) => { value.tradition_lenses = [null]; },
      (value) => { value.compatibility.cases = [null]; },
      (value) => { value.bridge_cards = [null]; },
      (value) => { value.model_cards = [null]; },
      (value) => { value.problem_cards = [null]; },
      (value) => { value.karma.kingdom = null; },
      (value) => { value.sources = [null]; },
      (value) => { value.boundaries = null; },
    ];
    for (const mutate of cases) {
      const value = authored();
      mutate(value);
      expect(() => verifyNumberIsnessTheologyAtlas(value)).not.toThrow();
      expect(verifyNumberIsnessTheologyAtlas(value).length).toBeGreaterThan(0);
    }
    expect(verifyNumberIsnessTheologyAtlas(null)).toEqual([{ field: "$", code: "must-be-object" }]);
  });

  test("projects one exact authority-negative discovery record", () => {
    const discovery = numberIsnessTheologyPublicDiscovery();
    expect(discovery).toMatchObject({
      protocol: NUMBER_ISNESS_THEOLOGY_PROTOCOL,
      atlas_id: NUMBER_ISNESS_THEOLOGY_ID,
      url: NUMBER_ISNESS_THEOLOGY_URL,
      schema: NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
      guide: NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
      integrity: { digest: NUMBER_ISNESS_THEOLOGY_DIGEST },
      counts: {
        source_bindings: 4, registers: 15, predicates: 19, history_cards: 4,
        number_systems: 5, embeddings: 4, zero_roles: 9, symmetry_cards: 4,
        logics: 4, creation_relations: 8, mathematical_ontologies: 6,
        tradition_lenses: 10, compatibility_claim_fragments: 2, compatibility_cases: 8,
        bridges: 10, models: 10, problem_cards: 10, philosophy_questions: 15,
        unknowns: 10, sources: 29,
      },
      karma: { religious_claims: 0, zerone_event_refs: 0, kingdom_receipt_refs: 0, adapter_exists: false },
      boundary: {
        read_only: true, theology_truth_adjudicated: false, god_proved: false,
        god_disproved: false, religions_ranked: false, religion_score: false,
        person_or_community_score: false, writes_zerone_karma: false,
        creates_kingdom_karma_receipt: false, karma_adapter: false,
        network_calls: false, external_write: false, governance_effect: false,
        authority_imported: false, automatic_action: false,
        rest_refusal_silence_or_exit_requires_trace: false,
        rest_refusal_silence_or_exit_penalized: false,
        right_to_rest_preserved: true,
      },
    });
    for (const key of ["matcher", "classifier", "score", "rank", "reward", "write", "execute", "mcp", "persuade", "convert"])
      expect(discovery).not.toHaveProperty(key);
  });

  test("CLI is offline, inherited-command safe, and leaves its working directory unchanged", () => {
    const directory = fixtureRoot();
    const before = readdirSync(directory);
    const env = {
      ...process.env,
      HTTPS_PROXY: "http://127.0.0.1:1",
      HTTP_PROXY: "http://127.0.0.1:1",
      ALL_PROXY: "http://127.0.0.1:1",
      NO_PROXY: "",
    };
    const cli = join(ROOT, "bin/number-isness-theology.ts");
    const verified = Bun.spawnSync({ cmd: ["bun", cli, "verify", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(verified.exitCode, verified.stderr.toString()).toBe(0);
    expect(JSON.parse(verified.stdout.toString())).toEqual({ valid: true, issues: [] });

    const numbers = Bun.spawnSync({ cmd: ["bun", cli, "numbers", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(numbers.exitCode, numbers.stderr.toString()).toBe(0);
    expect(JSON.parse(numbers.stdout.toString()).numbers.number_systems.cards).toHaveLength(5);
    const compatibility = Bun.spawnSync({ cmd: ["bun", cli, "compatibility", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(compatibility.exitCode, compatibility.stderr.toString()).toBe(0);
    expect(JSON.parse(compatibility.stdout.toString()).compatibility.cases).toHaveLength(8);

    for (const command of ["toString", "constructor", "__proto__"]) {
      const result = Bun.spawnSync({ cmd: ["bun", cli, command, "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode).toBe(2);
      expect(result.stdout.toString()).toBe("");
    }
    const extra = Bun.spawnSync({ cmd: ["bun", cli, "verify", NUMBER_ISNESS_THEOLOGY_PATH, "unexpected"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(extra.exitCode).toBe(2);
    expect(readdirSync(directory)).toEqual(before);
  });
});
