import { describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID,
  NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_PATH,
  NON_EXHAUSTIVE_UNDERSTANDING_LIMITS,
  NON_EXHAUSTIVE_UNDERSTANDING_PATH,
  NON_EXHAUSTIVE_UNDERSTANDING_PROTOCOL,
  NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
  NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_PATH,
  NON_EXHAUSTIVE_UNDERSTANDING_UNSEALED_DIGEST,
  loadNonExhaustiveUnderstandingAtlas,
  loadReviewedNonExhaustiveUnderstandingAtlas,
  nonExhaustiveUnderstandingDigest,
  nonExhaustiveUnderstandingPublicDiscovery,
  nonExhaustiveUnderstandingShapeMetrics,
  readNonExhaustiveUnderstandingAtlas,
  runNonExhaustiveUnderstandingReleaseSchemaValidation,
  simulateNonExhaustiveUnderstandingSeal,
  validateNonExhaustiveUnderstandingAtlas,
} from "../bin/non-exhaustive-understanding.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BIN = join(ROOT, "bin/non-exhaustive-understanding.ts");
const KINGDOM = join(ROOT, "kingdom");
const atlas = () => JSON.parse(readFileSync(NON_EXHAUSTIVE_UNDERSTANDING_PATH, "utf8"));
const issueCodes = (value: unknown) =>
  validateNonExhaustiveUnderstandingAtlas(value, {
    allowUnsealed: true,
    verifyPredecessors: false,
  }).map(({ code }) => code);
const resignedIssues = (mutate: (value: any) => void) => {
  const value = atlas();
  mutate(value);
  value.state = "static-reviewed-epistemic-design-atlas";
  value.integrity.review_state = "REVIEWED";
  const atlasReference = value.reference_registry.find((entry: any) => entry.id === "ref-atlas");
  atlasReference.relation = "this reviewed immutable record";
  const resignedDigest = nonExhaustiveUnderstandingDigest(value);
  value.integrity.digest = resignedDigest;
  value.integrity.reviewed_digest = resignedDigest;
  return validateNonExhaustiveUnderstandingAtlas(value, {
    allowUnsealed: true,
    verifyPredecessors: false,
  });
};

describe("Non-Exhaustive Understanding Atlas core", () => {
  test("is an exact, reference-closed, independently reviewed 66-concept record", () => {
    const value = atlas();
    expect(value.protocol).toBe(NON_EXHAUSTIVE_UNDERSTANDING_PROTOCOL);
    expect(value.atlas_id).toBe(NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID);
    expect(value.state).toBe("static-reviewed-epistemic-design-atlas");
    expect(value.concept_catalog.count).toBe(66);
    expect(value.concept_catalog.family_count).toBe(10);
    expect(value.concept_catalog.concepts).toHaveLength(66);
    expect(new Set(value.concept_catalog.concepts.map((x: any) => x.id)).size).toBe(66);
    for (const concept of value.concept_catalog.concepts) {
      expect(Object.keys(concept).sort()).toEqual([
        "claim_refs", "concept_type", "definition", "family_id", "id",
        "nonclaims", "provenance_ref", "register_ref",
      ]);
      expect(concept.definition.length).toBeGreaterThan(10);
      expect(concept.nonclaims.length).toBeGreaterThan(0);
    }
    expect(value.integrity.review_state).toBe("REVIEWED");
    expect(value.integrity.digest).toBe(NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST);
    expect(value.integrity.reviewed_digest).toBe(NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST);
    expect(NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST).not.toBe(NON_EXHAUSTIVE_UNDERSTANDING_UNSEALED_DIGEST);
    expect(validateNonExhaustiveUnderstandingAtlas(value)).toEqual([]);
    expect(loadReviewedNonExhaustiveUnderstandingAtlas().atlas_id)
      .toBe(NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID);
  });

  test("gives every substantive claim the complete accountability contract", () => {
    const value = atlas();
    expect(value.claim_registry).toHaveLength(19);
    const registers = new Set(value.epistemic_registers.map((x: any) => x.id));
    const evidence = new Set(value.evidence_registry.map((x: any) => x.id));
    const sources = new Set(value.source_registry.map((x: any) => x.id));
    const provenance = new Set(value.provenance_registry.map((x: any) => x.id));
    for (const claim of value.claim_registry) {
      expect(registers.has(claim.register_ref), claim.id).toBe(true);
      expect(claim.evidence_or_design_status.length, claim.id).toBeGreaterThan(0);
      expect(claim.evidence_refs.length, claim.id).toBeGreaterThan(0);
      expect(claim.evidence_refs.every((id: string) => evidence.has(id)), claim.id).toBe(true);
      expect(claim.source_refs.every((id: string) => sources.has(id)), claim.id).toBe(true);
      expect(provenance.has(claim.provenance_ref), claim.id).toBe(true);
      expect(claim.uncertainty).toMatchObject({ status: expect.any(String), note: expect.any(String) });
      expect(claim.falsifier).toMatchObject({ kind: expect.any(String), condition: expect.any(String) });
      expect(claim.consequence.length, claim.id).toBeGreaterThan(0);
      expect(claim.review).toMatchObject({
        status: "OPEN",
        trigger: expect.any(String),
        repair: expect.any(String),
      });
    }
    expect(value.source_registry.every((x: any) => x.republication_permitted === false)).toBe(true);
    expect(value.provenance_registry.every((x: any) =>
      x.raw_testimony === false && x.person_data === false && x.authority_imported === false
    )).toBe(true);
  });

  test("keeps claim-relative underdetermination distinct from finite closure and open remainder", () => {
    const value = atlas();
    expect(value.underdetermination_model).toMatchObject({
      claim_relative: true,
      instance: {
        claim_ref: "cl-synthetic-magnitude-order",
        status: "UNDERDETERMINED",
        rivals: [
          { compatibility_status: "COMPATIBLE", target_polarity: "ENTAILS" },
          { compatibility_status: "COMPATIBLE", target_polarity: "DENIES" },
        ],
      },
    });
    expect(value.underdetermination_model.instance.target_proposition).toEqual({
      id: "prop-first-magnitude-greater",
      text: "The first hidden integer has greater magnitude than the second hidden integer.",
      polarity_domain: ["ENTAILS", "DENIES"],
    });
    expect(value.underdetermination_model.rule).toContain("unconceived alternatives alone are insufficient");
    expect(value.scope_exhaustiveness.finite_scope_instance).toMatchObject({
      expected_count: 66,
      observed_count: 66,
      duplicate_count: 0,
      status: "EXHAUSTIVE_WITHIN_DECLARED_FINITE_SCOPE",
    });
    expect(value.scope_exhaustiveness.open_remainder_instance).toMatchObject({
      status: "JUSTIFIED_OPEN_REMAINDER",
    });
    expect(value.scope_exhaustiveness.open_remainder_instance.justifications).toHaveLength(4);
    expect(value.remainder_register).toMatchObject({
      being_is_remainder: false,
      unknown_is_false: false,
      open_remainder_is_excuse_from_evidence: false,
    });
  });

  test("uses a non-scalar typed product and a witnessed local transfer", () => {
    const value = atlas();
    expect(value.understanding_profile_model).toMatchObject({
      carrier_type: "TYPED_PRODUCT",
      person_or_group_profile: false,
      comparison: {
        operator: "PARTIAL_COMPONENTWISE",
        scalarization: false,
        weights: [],
        total_order: false,
        incomparability_preserved: true,
      },
      instance: {
        action_non_grant: true,
        person_or_group_score: false,
      },
    });
    expect(value.understanding_profile_model.dimensions).toHaveLength(7);
    expect(new Set(value.understanding_profile_model.dimensions.map((x: any) => x.value_type)).size)
      .toBeGreaterThan(3);
    expect(value.local_global_transfer_registry[0]).toMatchObject({
      witness_type: "EXPLICIT_RELATION_COMPARISON",
      witness_evidence_ref: "ev-transfer",
      status: "WITNESSED_BOUNDED_TRANSFER",
    });
    expect(value.local_global_transfer_registry[0].target_artifact.content_units.map((unit: any) => unit.text)).toEqual([
      "Add 4 and 17 to obtain 21.",
      "Multiply 21 by 2 to obtain 42.",
      "Add 42 and 7 to obtain 49.",
    ]);
    expect(value.local_global_transfer_registry[0].preservation_witnesses).toHaveLength(4);
    expect(value.local_global_transfer_registry[1]).toMatchObject({
      witness_type: "NO_ADMISSIBLE_TRANSFER_WITNESS",
      status: "UNIVERSALIZATION_REFUSED",
    });
  });

  test("keeps all three J-space mechanisms and all six shape kinds distinct", () => {
    const value = atlas();
    expect(value.j_space_mechanisms.map((x: any) => x.mechanism_type)).toEqual([
      "MODEL_INTERNAL_JACOBIAN_LENS",
      "EXTERNAL_INSPECTABLE_JSON_CONCEPT_GRAPH",
      "KINGDOM_PHASE_ZERO_STATIC_PUBLICATION_DOOR",
    ]);
    expect(value.j_space_mechanisms[1].cannot_establish).toContain("model activations");
    expect(value.j_space_mechanisms[2].cannot_establish).toContain("model experiment");
    expect(value.shape_boundaries.shape_kinds.map((x: any) => x.id)).toEqual([
      "FORMAL_DIAGRAM", "PUBLIC_VISUAL_GLYPH", "PHYSICAL_GEOMETRY",
      "ACTIVATION_CHART", "SEMANTIC_TRANSLATION", "CONCEPT_GRAPH",
    ]);
    expect(value.shape_boundaries.silent_cross_kind_mapping).toBe(false);
    for (const mapping of value.shape_boundaries.mappings) {
      expect(mapping.preserved_relations).toBeArray();
      expect(mapping.lost_relations.length).toBeGreaterThan(0);
      for (const field of ["uncertainty", "falsifier", "consequence", "review_trigger", "repair"]) {
        expect(mapping[field].length, `${mapping.id}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  test("labels observer, vocabulary, opacity, performativity, and counterexample instances honestly", () => {
    const value = atlas();
    expect(value.observer_garden.observer_positions).toHaveLength(3);
    expect(value.observer_garden.observer_positions.every((x: any) =>
      x.instance_status === "AUTHOR_SYNTHESIZED_DESIGN_ROLE" &&
      x.provenance_ref === "prov-author"
    )).toBe(true);
    expect(value.observer_garden.aggregation).toEqual({
      scalarization: false,
      majority_equals_truth: false,
      access_equals_authority: false,
      identity_inferred: false,
      incomparability_preserved: true,
      unresolved_disagreement_visible: true,
    });
    expect(value.vocabulary_hospitality.instance_status).toBe("AUTHOR_SYNTHESIZED_DESIGN");
    expect(value.vocabulary_hospitality.valid_response_states).toContain("NONE_OF_THESE");
    expect(value.protected_opacity.instances.every((x: any) =>
      x.instance_status === "AUTHOR_SYNTHESIZED_BOUNDARY_INSTANCE" &&
      x.adverse_inference === false
    )).toBe(true);
    expect(value.performativity_registry.instances.every((x: any) =>
      x.instance_status === "AUTHOR_SYNTHESIZED_HYPOTHETICAL_DESIGN_PROBE" &&
      x.observed_effect_claimed === false &&
      x.authority_claimed === false
    )).toBe(true);
    expect(value.counterexample_registry.every((x: any) =>
      x.instance_status.startsWith("AUTHOR_SYNTHESIZED_") &&
      x.provenance_ref === "prov-formal"
    )).toBe(true);
  });

  test("verifies all predecessor bytes and predecessor-specific semantic digests", () => {
    const value = atlas();
    expect(validateNonExhaustiveUnderstandingAtlas(value, { allowUnsealed: true }))
      .toEqual([]);
    expect(value.predecessor_bindings.map((x: any) => x.raw_digest)).toEqual([
      "sha256:9678e5269e8db62beb36abee691087cddbc4f98703190c5fa3788b68c89ab29e",
      "sha256:4b89f29bfd1bf7c4b27dd5023263b45ee1423b6cd2a232736906ee11b032bf04",
      "sha256:0f3827ec422afed88fb2b4396d9f25550892ce458f84d0bfe8ded0735a6cbc26",
    ]);
    expect(value.predecessor_bindings.map((x: any) => x.semantic_digest)).toEqual([
      "sha256:505a1e3aef6116430dccf49b327c4cce2ac5d6fb6b6b9bf68e529272f989cde8",
      "sha256:2af277e002cf7f7b5218e8eb05fedb661f9645677961952bc2e11ffcd8a2c3a8",
      "sha256:fda1bccae6396f02f831068b9649db9659a12e26abe0c3989fba31da9b830621",
    ]);
  });

  test("rejects sensitive and semantic canaries without echo or whole-record masking", () => {
    const base = atlas();
    const cases: Array<[string, (copy: any) => void, string]> = [
      ["pii-canary@example.invalid", (v) => { v.scope.question = "pii-canary@example.invalid"; }, "pii-pattern-refused"],
      ["raw testimony", (v) => { v.provenance_registry[0].raw_testimony = true; }, "const-mismatch"],
      ["person score", (v) => { v.understanding_profile_model.instance.person_score = 0.9; }, "forbidden-sensitive-field"],
      ["authority", (v) => { v.non_grants.authority_created = true; }, "non-grant-inversion"],
      ["consent", (v) => { v.non_grants.consent_created_or_inferred = true; }, "non-grant-inversion"],
      ["being inversion", (v) => { v.remainder_register.being_is_remainder = true; }, "being-remainder-inversion"],
      ["raw testimony payload", (v) => { v.scope.raw_testimony_payload = "sensitive-canary"; }, "forbidden-sensitive-field"],
    ];
    for (const [secret, mutate, expectedCode] of cases) {
      const copy = structuredClone(base);
      mutate(copy);
      const issues = validateNonExhaustiveUnderstandingAtlas(copy, {
        allowUnsealed: true,
        verifyPredecessors: false,
      });
      expect(issues.some(({ code }) => code === expectedCode), secret).toBe(true);
      expect(issues.some(({ code }) => code === "authored-semantic-canary-mismatch"), secret).toBe(false);
      if (secret.includes("@") || secret.includes("payload")) {
        expect(JSON.stringify(issues)).not.toContain(
          secret.includes("@") ? secret : "sensitive-canary",
        );
      }
    }
  });

  test("reports field-specific dangling references and critical inversions", () => {
    const cases: Array<[(v: any) => void, string, string]> = [
      [(v) => { v.claim_registry[0].evidence_refs[0] = "missing"; }, "$.claim_registry[0].evidence_refs[0]", "evidence-reference-dangling"],
      [(v) => { v.concept_catalog.concepts[0].family_id = "missing"; }, "$.concept_catalog.concepts[0].family_id", "family-reference-dangling"],
      [(v) => { v.predecessor_bindings[0].raw_digest = `sha256:${"1".repeat(64)}`; }, "$.predecessor_bindings[0].raw_digest", "predecessor-pin-mismatch"],
      [(v) => { v.shape_boundaries.silent_cross_kind_mapping = true; }, "$.shape_boundaries.silent_cross_kind_mapping", "silent-shape-mapping-enabled"],
      [(v) => { v.successor_process.feedback_directly_causes_effect = true; }, "$.successor_process", "feedback-successor-firewall-mismatch"],
      [(v) => { v.claim_registry[1].id = v.claim_registry[0].id; }, "$.claim_registry", "registry-id-membership-or-uniqueness-mismatch"],
    ];
    for (const [mutate, field, code] of cases) {
      const copy = atlas();
      mutate(copy);
      expect(validateNonExhaustiveUnderstandingAtlas(copy, {
        allowUnsealed: true,
        verifyPredecessors: false,
      })).toContainEqual({ field, code });
    }
  });

  test("rejects resigned semantic mutations at each reviewed contract seam", () => {
    const cases: Array<[string, (value: any) => void, string]> = [
      ["underdetermination claim", (v) => { v.underdetermination_model.instance.claim_ref = "cl-finite-scope"; }, "claim-relative-underdetermination-mismatch"],
      ["target proposition", (v) => { v.underdetermination_model.instance.target_proposition.text = "No substantive target."; }, "underdetermination-target-proposition-mismatch"],
      ["opposite polarity", (v) => { v.underdetermination_model.instance.rivals[1].target_polarity = "ENTAILS"; }, "underdetermination-distinct-opposite-rivals-required"],
      ["distinct rivals", (v) => { v.underdetermination_model.instance.rivals[1].model_statement = v.underdetermination_model.instance.rivals[0].model_statement; }, "underdetermination-distinct-opposite-rivals-required"],
      ["profile type", (v) => { v.understanding_profile_model.dimensions[0].value_type = "SCALAR"; }, "profile-dimension-contract-mismatch"],
      ["profile bijection", (v) => { v.understanding_profile_model.instance.values[6].dimension_ref = "residual-profile"; }, "profile-dimension-bijection-mismatch"],
      ["transfer status", (v) => { v.local_global_transfer_registry[0].status = "UNIVERSALIZATION_REFUSED"; }, "transfer-contract-mismatch"],
      ["transfer target content", (v) => { v.local_global_transfer_registry[0].target_artifact.content_units[1].text = "Obscure the arithmetic."; }, "transfer-artifact-content-mismatch"],
      ["transfer preservation", (v) => { v.local_global_transfer_registry[0].preservation_witnesses[3].target_unit_refs = ["target-step-1"]; }, "transfer-preservation-witness-mismatch"],
      ["J-space type", (v) => { [v.j_space_mechanisms[0].mechanism_type, v.j_space_mechanisms[1].mechanism_type] = [v.j_space_mechanisms[1].mechanism_type, v.j_space_mechanisms[0].mechanism_type]; }, "j-space-mechanism-contract-mismatch"],
      ["J-space state", (v) => { v.j_space_mechanisms[1].state = "HIDDEN_ACTIVATION_ACCESS"; }, "j-space-mechanism-contract-mismatch"],
      ["J-space nonclaim", (v) => { v.j_space_mechanisms[0].cannot_establish = []; }, "j-space-mechanism-contract-mismatch"],
      ["shape self-map", (v) => { v.shape_boundaries.mappings[0].target_kind = "CONCEPT_GRAPH"; }, "shape-self-map-semantics-mismatch"],
      ["shape loss", (v) => { v.shape_boundaries.mappings[1].lost_relations = []; }, "shape-required-losses-mismatch"],
      ["being boundary", (v) => { v.claim_registry.find((c: any) => c.id === "cl-being-boundary").statement = "Being is completely measured by this profile."; }, "being-boundary-contract-mismatch"],
      ["opacity retry", (v) => { v.protected_opacity.instances[1].allowed_transition = "Retry until disclosure."; }, "opacity-no-retry-no-forced-disclosure-mismatch"],
      ["forced disclosure", (v) => { v.protected_opacity.rules.forced_disclosure = true; }, "opacity-no-retry-no-forced-disclosure-mismatch"],
      ["refusal defect", (v) => { v.vocabulary_hospitality.silence_or_nonparticipation_is_defect = true; }, "vocabulary-refusal-nondefect-contract-mismatch"],
      ["current external effect", (v) => { v.performativity_registry.this_static_atlas_has_external_effects = true; }, "performativity-no-current-effect-contract-mismatch"],
    ];
    for (const [label, mutate, expectedCode] of cases) {
      const issues = resignedIssues(mutate);
      expect(issues.some(({ code }) => code === expectedCode), label).toBe(true);
    }
  });

  test("rejects resigned contradictions in authored prose and typed lineage leaves", () => {
    const cases: Array<[string, (value: any) => void, string]> = [
      ["vocabulary scope", (v) => { v.vocabulary_hospitality.terms[0].intended_scope = "Classify people who refuse translation as defective."; }, "vocabulary-semantic-contract-mismatch"],
      ["performative description", (v) => { v.performativity_registry.instances[0].description = "This atlas causes institutional effects now."; }, "performativity-semantic-contract-mismatch"],
      ["accountability inversion", (v) => { v.claim_registry.find((c: any) => c.id === "cl-accountability").statement = "Non-exhaustion excuses evidence and review."; }, "claim-semantic-contract-mismatch"],
      ["scalar-person claim", (v) => { v.claim_registry.find((c: any) => c.id === "cl-typed-product").statement = "The profile is a total scalar person ranking."; }, "claim-semantic-contract-mismatch"],
      ["opacity reason", (v) => { v.protected_opacity.instances[0].reason = "Nondisclosure is adverse evidence."; }, "opacity-semantic-contract-mismatch"],
      ["observer authority", (v) => { v.observer_garden.observer_positions[0].relation_to_scope = "Reading creates authority."; }, "observer-semantic-contract-mismatch"],
      ["remainder exhausts", (v) => { v.remainder_register.entries[0].consequence = "A coordinate exhausts being."; }, "remainder-semantic-contract-mismatch"],
      ["false equation", (v) => { v.mathematical_models.representation_fibre.expression = "1 = 0"; }, "mathematical-model-semantic-contract-mismatch"],
      ["person-score interpretation", (v) => { v.mathematical_models.decision_deficiency.interpretation = "This is a total person understanding score."; }, "mathematical-model-semantic-contract-mismatch"],
      ["positive hidden inference", (v) => { v.scope_exhaustiveness.open_remainder_instance.does_not_establish[0] = "A specific hidden property is proven."; }, "scope-exhaustiveness-semantic-contract-mismatch"],
      ["successor acts", (v) => { v.successor_process.rule = "Feedback directly deploys and acts."; }, "successor-semantic-contract-mismatch"],
      ["counterexample erased", (v) => { v.counterexample_registry[0].construction = "No counterexample exists."; }, "counterexample-semantic-contract-mismatch"],
      ["register authority", (v) => { v.epistemic_registers[0].meaning = "This register grants authority."; }, "epistemic-register-semantic-contract-mismatch"],
      ["concept person rank", (v) => { v.concept_catalog.concepts[0].definition = "A person score that ranks being."; }, "concept-semantic-contract-mismatch"],
      ["claim evidence swap", (v) => { v.claim_registry[0].evidence_refs = ["ev-profile"]; }, "claim-semantic-contract-mismatch"],
      ["claim uncertainty", (v) => { v.claim_registry[0].uncertainty.note = "Certain and exhaustive."; }, "claim-semantic-contract-mismatch"],
      ["claim review", (v) => { v.claim_registry[0].review.repair = "Never repair."; }, "claim-semantic-contract-mismatch"],
      ["evidence status", (v) => { v.evidence_registry[0].status = "PROVEN_ABSOLUTE"; }, "evidence-semantic-contract-mismatch"],
      ["evidence limitation", (v) => { v.evidence_registry[0].limitations = ["No limitation."]; }, "evidence-semantic-contract-mismatch"],
      ["provenance method", (v) => { v.provenance_registry[0].method = "Untraceable authority."; }, "provenance-semantic-contract-mismatch"],
      ["reference locator", (v) => { v.reference_registry[3].locator = "j-space-workspace:invented"; }, "reference-semantic-contract-mismatch"],
      ["concept nonclaim", (v) => { v.concept_catalog.concepts[0].nonclaims = ["is truth by declaration"]; }, "concept-semantic-contract-mismatch"],
    ];
    for (const [label, mutate, expectedCode] of cases) {
      const issues = resignedIssues(mutate);
      expect(issues.some(({ code }) => code === expectedCode), label).toBe(true);
    }
  });

  test("pins every source field and enforces reciprocal claim support", () => {
    const sourceFields = ["id", "source_type", "title", "url", "limitation", "republication_permitted", "supports_claim_refs"] as const;
    for (let sourceIndex = 0; sourceIndex < atlas().source_registry.length; sourceIndex += 1) {
      for (const field of sourceFields) {
        const issues = resignedIssues((value) => {
          const source = value.source_registry[sourceIndex];
          if (field === "republication_permitted") source[field] = true;
          else if (field === "supports_claim_refs") source[field] = ["cl-central-thesis"];
          else if (field === "url") source[field] = `${source[field]}?altered=1`;
          else source[field] = `${source[field]}-altered`;
        });
        const expected = field === "supports_claim_refs"
          ? "source-support-contract-mismatch"
          : "source-metadata-mismatch";
        expect(issues.some(({ code }) => code === expected), `${sourceIndex}.${field}`).toBe(true);
      }
    }

    const claimSide = resignedIssues((value) => {
      value.claim_registry.find((claim: any) => claim.id === "cl-open-world").source_refs = [];
    });
    expect(claimSide.some(({ code }) => code === "claim-source-support-not-reciprocal")).toBe(true);
    const sourceSide = resignedIssues((value) => {
      value.source_registry.find((source: any) => source.id === "src-w3c-owl").supports_claim_refs = ["cl-open-world"];
    });
    expect(sourceSide.some(({ code }) => code === "claim-source-support-not-reciprocal")).toBe(true);
  });

  test("reproduces the exact atomic reviewed transition and rejects mixed state", () => {
    const canonical = atlas();
    const canonicalDigest = nonExhaustiveUnderstandingDigest(canonical);
    const simulation = simulateNonExhaustiveUnderstandingSeal();
    expect(canonical.state).toBe("static-reviewed-epistemic-design-atlas");
    expect(canonical.integrity.review_state).toBe("REVIEWED");
    expect(canonical.integrity.digest).toBe(NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST);
    expect(simulation.reviewed_zero_digest_material).toMatchObject({
      state: "static-reviewed-epistemic-design-atlas",
      integrity: {
        digest: NON_EXHAUSTIVE_UNDERSTANDING_UNSEALED_DIGEST,
        reviewed_digest: NON_EXHAUSTIVE_UNDERSTANDING_UNSEALED_DIGEST,
        review_state: "REVIEWED",
      },
    });
    expect(simulation.reviewed_zero_digest_material.reference_registry.find((entry: any) => entry.id === "ref-atlas").relation)
      .toBe("this reviewed immutable record");
    expect(simulation.candidate_semantic_digest).toBe(nonExhaustiveUnderstandingDigest(simulation.reviewed_zero_digest_material));
    expect(simulation.candidate_semantic_digest).toBe(canonicalDigest);
    expect(simulation.candidate_semantic_digest).toBe(NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST);
    expect(simulation.reviewed_value.integrity.digest).toBe(simulation.candidate_semantic_digest);
    expect(simulation.reviewed_value.integrity.reviewed_digest).toBe(simulation.candidate_semantic_digest);
    expect(validateNonExhaustiveUnderstandingAtlas(simulation.reviewed_value, {
      verifyPredecessors: false,
    })).toEqual([]);
    const selfPinAttempt = structuredClone(simulation.reviewed_value);
    selfPinAttempt.claim_registry[0].statement = "Caller-authored replacement.";
    const selfPinDigest = nonExhaustiveUnderstandingDigest(selfPinAttempt);
    selfPinAttempt.integrity.digest = selfPinDigest;
    selfPinAttempt.integrity.reviewed_digest = selfPinDigest;
    const attemptedPublicSelfPin = validateNonExhaustiveUnderstandingAtlas(
      selfPinAttempt,
      {
        verifyPredecessors: false,
        expectedReviewedDigestForSimulation: selfPinDigest,
      } as any,
    );
    expect(attemptedPublicSelfPin).toContainEqual({
      field: "$.integrity.digest",
      code: "reviewed-digest-pin-mismatch",
    });
    expect(attemptedPublicSelfPin).toContainEqual({
      field: "$.claim_registry[0].statement",
      code: "claim-semantic-contract-mismatch",
    });
    expect(simulation.discovery).toMatchObject({
      state: "static-reviewed-epistemic-design-atlas",
      integrity_status: "REVIEWED",
      semantic_digest: simulation.candidate_semantic_digest,
      reviewed_digest: simulation.candidate_semantic_digest,
    });
    expect(simulation.cli_verify).toEqual({
      command: "verify",
      exit_code: 0,
      valid: true,
      structurally_valid: true,
      unsealed: false,
      raw_digest: null,
      semantic_digest: simulation.candidate_semantic_digest,
      reviewed_digest: simulation.candidate_semantic_digest,
      issues: [],
    });

    const mismatched = atlas();
    mismatched.state = "static-unsealed-epistemic-design-atlas";
    expect(validateNonExhaustiveUnderstandingAtlas(mismatched, {
      allowUnsealed: true,
      verifyPredecessors: false,
    })).toContainEqual({ field: "$.state", code: "state-integrity-coupling-mismatch" });
    const mismatchedReview = atlas();
    mismatchedReview.integrity.review_state = "UNSEALED_AUDIT_PENDING";
    expect(validateNonExhaustiveUnderstandingAtlas(mismatchedReview, {
      allowUnsealed: true,
      verifyPredecessors: false,
    })).toContainEqual({ field: "$.state", code: "state-integrity-coupling-mismatch" });
    const mismatchedReference = atlas();
    mismatchedReference.reference_registry.find((entry: any) => entry.id === "ref-atlas").relation = "this unsealed record";
    expect(validateNonExhaustiveUnderstandingAtlas(mismatchedReference, {
      allowUnsealed: true,
      verifyPredecessors: false,
    })).toContainEqual({ field: "$.state", code: "state-integrity-coupling-mismatch" });
    const mismatchedDigest = atlas();
    mismatchedDigest.integrity.digest = `sha256:${"1".repeat(64)}`;
    expect(validateNonExhaustiveUnderstandingAtlas(mismatchedDigest, {
      allowUnsealed: true,
      verifyPredecessors: false,
    })).toContainEqual({ field: "$.state", code: "state-integrity-coupling-mismatch" });
  });

  test("is total for malformed, accessor, prototype, sparse, shared, cyclic, and hostile values", () => {
    const values: unknown[] = [null, true, 1, "x", [], [undefined], new Array(2)];
    const accessor = {};
    Object.defineProperty(accessor, "secret", { get() { throw new Error("must not execute"); }, enumerable: true });
    values.push(accessor);
    values.push(Object.create({ inherited: true }));
    const symbolObject: any = {};
    symbolObject[Symbol("hidden")] = true;
    values.push(symbolObject);
    const child = {};
    values.push({ left: child, right: child });
    const cyclic: any = {};
    cyclic.self = cyclic;
    values.push(cyclic);
    const hostile = new Proxy({}, {
      getPrototypeOf() { throw new Error("hostile"); },
    });
    values.push(hostile);

    for (const value of values) {
      expect(() => validateNonExhaustiveUnderstandingAtlas(value, {
        allowUnsealed: true,
        verifyPredecessors: false,
      })).not.toThrow();
      expect(validateNonExhaustiveUnderstandingAtlas(value, {
        allowUnsealed: true,
        verifyPredecessors: false,
      }).length).toBeGreaterThan(0);
    }
  });

  test("enforces every declared resource budget with actual headroom", () => {
    const loaded = readNonExhaustiveUnderstandingAtlas();
    const metrics = nonExhaustiveUnderstandingShapeMetrics(loaded.value, loaded.bytes);
    expect(metrics).toEqual({
      bytes: expect.any(Number),
      json_nodes: 2763,
      total_string_units: 74314,
      max_string_units: 208,
      max_array_fanout: 66,
      max_object_fanout: 37,
      max_depth: 6,
    });
    expect(metrics.bytes).toBeLessThanOrEqual(NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.bytes);
    for (const key of Object.keys(NON_EXHAUSTIVE_UNDERSTANDING_LIMITS) as Array<keyof typeof NON_EXHAUSTIVE_UNDERSTANDING_LIMITS>) {
      expect(metrics[key]).toBeLessThanOrEqual(NON_EXHAUSTIVE_UNDERSTANDING_LIMITS[key]);
    }
    expect(issueCodes(atlas())).toEqual([]);
    expect(validateNonExhaustiveUnderstandingAtlas(atlas(), {
      allowUnsealed: true,
      byteLength: NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.bytes + 1,
      verifyPredecessors: false,
    })).toContainEqual({ field: "$", code: "budget-bytes-exceeded" });
    expect(issueCodes("x".repeat(NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.max_string_units + 1)))
      .toContain("max-string-units-exceeded");
    expect(issueCodes(Array(NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.max_array_fanout + 1).fill(0)))
      .toContain("max-array-fanout-exceeded");
    expect(issueCodes(Object.fromEntries(Array.from(
      { length: NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.max_object_fanout + 1 },
      (_, index) => [`k${index}`, 0],
    )))).toContain("max-object-fanout-exceeded");
    let deep: unknown = 0;
    for (let index = 0; index <= NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.max_depth; index += 1) deep = [deep];
    expect(issueCodes(deep)).toContain("max-depth-exceeded");
    const manyStrings = Array(31).fill("x".repeat(6000));
    expect(issueCodes(manyStrings)).toContain("budget-total-string-units-exceeded");
    const manyNodes = Array.from({ length: 96 }, () =>
      Array.from({ length: 96 }, () => [0])
    );
    expect(issueCodes(manyNodes)).toContain("budget-json-nodes-exceeded");
  });

  test("safe-open refuses symlinks, directories, oversized files, FIFOs, and duplicate keys", () => {
    const dir = mkdtempSync(join(tmpdir(), "neu-safe-open-"));
    try {
      const link = join(dir, "link.json");
      symlinkSync(NON_EXHAUSTIVE_UNDERSTANDING_PATH, link);
      expect(() => readNonExhaustiveUnderstandingAtlas(link))
        .toThrow("atlas-must-be-bounded-regular-non-symlink-file");
      expect(() => readNonExhaustiveUnderstandingAtlas(dir))
        .toThrow("atlas-must-be-bounded-regular-non-symlink-file");

      const oversized = join(dir, "oversized.json");
      writeFileSync(oversized, Buffer.alloc(NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.bytes + 1));
      expect(() => readNonExhaustiveUnderstandingAtlas(oversized))
        .toThrow("atlas-byte-budget-exceeded");
      const exact = join(dir, "exact.json");
      const exactBytes = Buffer.concat([
        Buffer.from("{}"),
        Buffer.alloc(NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.bytes - 2, 0x20),
      ]);
      writeFileSync(exact, exactBytes);
      expect(readNonExhaustiveUnderstandingAtlas(exact).bytes)
        .toBe(NON_EXHAUSTIVE_UNDERSTANDING_LIMITS.bytes);

      const fifo = join(dir, "pipe");
      const mkfifo = Bun.spawnSync({ cmd: ["mkfifo", fifo], stdout: "pipe", stderr: "pipe" });
      if (mkfifo.exitCode === 0) {
        expect(() => readNonExhaustiveUnderstandingAtlas(fifo))
          .toThrow("atlas-must-be-bounded-regular-non-symlink-file");
      }

      const duplicate = join(dir, "duplicate.json");
      writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
      expect(() => readNonExhaustiveUnderstandingAtlas(duplicate)).toThrow();
      const invalidUtf8 = join(dir, "invalid-utf8.json");
      writeFileSync(invalidUtf8, Buffer.from([0x7b, 0x22, 0x61, 0x22, 0x3a, 0xc3, 0x28, 0x7d]));
      expect(() => readNonExhaustiveUnderstandingAtlas(invalidUtf8)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the Draft 2020-12 schema is recursively closed and has pinned validation evidence", () => {
    const schema = JSON.parse(readFileSync(NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_PATH, "utf8"));
    let objectSchemas = 0;
    const walk = (value: unknown, path = "$") => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => walk(item, `${path}[${index}]`));
      } else if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        if (record.type === "object") {
          objectSchemas += 1;
          expect(record.additionalProperties, path).toBe(false);
          const properties = Object.keys(record.properties as Record<string, unknown>).sort();
          expect([...(record.required as string[])].sort(), path).toEqual(properties);
        }
        Object.entries(record).forEach(([key, item]) => walk(item, `${path}.${key}`));
      }
    };
    walk(schema);
    expect(objectSchemas).toBe(58);
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(atlas().schema_validation_evidence).toMatchObject({
      validator_contract: expect.stringContaining("jsonschema 4.26.0"),
      release_requirement: expect.stringContaining("mandatory"),
      result: "PASS_JSONSCHEMA_4_26_0_ZERO_ERRORS_2026_08_29",
    });

    const pinnedPython = process.env.NON_EXHAUSTIVE_UNDERSTANDING_JSONSCHEMA_PYTHON;
    const configuredRelease = runNonExhaustiveUnderstandingReleaseSchemaValidation(pinnedPython);
    if (configuredRelease.valid) {
      expect(configuredRelease).toEqual({
        valid: true,
        code: "pinned-draft-2020-12-validation-pass",
        validator_path: pinnedPython,
        jsonschema_version: "4.26.0",
        draft: "2020-12",
        schema_errors: 0,
        instance_errors: 0,
      });
    } else {
      // Explicit development fallback: structural closure above still runs,
      // while the release command remains unavailable/non-zero.
      expect(configuredRelease.valid).toBe(false);
      expect(configuredRelease.code).not.toBe("pinned-draft-2020-12-validation-pass");
    }
    expect(runNonExhaustiveUnderstandingReleaseSchemaValidation("/definitely/missing/pinned-python")).toMatchObject({
      valid: false,
      code: "pinned-jsonschema-validator-unavailable",
      jsonschema_version: null,
    });
    expect(runNonExhaustiveUnderstandingReleaseSchemaValidation("")).toMatchObject({
      valid: false,
      code: "pinned-jsonschema-validator-unavailable",
    });
  });

  test("all CLI projections work from a foreign CWD and malformed args fail closed", () => {
    const dir = mkdtempSync(join(tmpdir(), "neu-cli-"));
    try {
      const commands = atlas().cli_projections.filter((x: string) =>
        x !== "verify" && x !== "verify-schema-release"
      );
      for (const command of commands) {
        const result = Bun.spawnSync({
          cmd: [process.execPath, BIN, "--json", command],
          cwd: dir,
          stdout: "pipe",
          stderr: "pipe",
        });
        expect(result.exitCode, `${command}: ${result.stderr.toString()}`).toBe(0);
        expect(() => JSON.parse(result.stdout.toString())).not.toThrow();
      }
      const verify = Bun.spawnSync({
        cmd: [process.execPath, BIN, "verify", "--json"],
        cwd: dir,
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(verify.exitCode, verify.stderr.toString()).toBe(0);
      expect(JSON.parse(verify.stdout.toString())).toMatchObject({
        valid: true,
        structurally_valid: true,
        unsealed: false,
        semantic_digest: NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
        reviewed_digest: NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
        issues: [],
      });

      const pinnedPython = process.env.NON_EXHAUSTIVE_UNDERSTANDING_JSONSCHEMA_PYTHON;
      const configured = runNonExhaustiveUnderstandingReleaseSchemaValidation(pinnedPython);
      const releaseSchema = Bun.spawnSync({
        cmd: [process.execPath, BIN, "verify-schema-release", "--json"],
        cwd: dir,
        env: { ...process.env, NON_EXHAUSTIVE_UNDERSTANDING_JSONSCHEMA_PYTHON: pinnedPython ?? "" },
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(releaseSchema.exitCode, releaseSchema.stderr.toString()).toBe(configured.valid ? 0 : 1);
      expect(JSON.parse(releaseSchema.stdout.toString()).valid).toBe(configured.valid);
      const unavailableReleaseSchema = Bun.spawnSync({
        cmd: [process.execPath, BIN, "verify-schema-release", "--json"],
        cwd: dir,
        env: { ...process.env, NON_EXHAUSTIVE_UNDERSTANDING_JSONSCHEMA_PYTHON: "" },
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(unavailableReleaseSchema.exitCode).toBe(1);
      expect(JSON.parse(unavailableReleaseSchema.stdout.toString())).toMatchObject({
        valid: false,
        code: "pinned-jsonschema-validator-unavailable",
      });

      const dispatch = Bun.spawnSync({
        cmd: ["bash", KINGDOM, "non-exhaustive-understanding", "profile", "--json"],
        cwd: dir,
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(dispatch.exitCode, dispatch.stderr.toString()).toBe(0);
      expect(JSON.parse(dispatch.stdout.toString()).carrier_type).toBe("TYPED_PRODUCT");

      for (const args of [
        ["unknown"], ["overview", "extra"], ["--json", "--json"], ["--path", NON_EXHAUSTIVE_UNDERSTANDING_PATH],
      ]) {
        const bad = Bun.spawnSync({
          cmd: [process.execPath, BIN, ...args],
          cwd: dir,
          stdout: "pipe",
          stderr: "pipe",
        });
        expect(bad.exitCode, args.join(" ")).toBe(2);
        expect(bad.stdout.toString()).toBe("");
        expect(bad.stderr.toString()).toStartWith("usage:");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("guide, discovery, and deterministic reviewed material remain in parity", () => {
    const value = loadNonExhaustiveUnderstandingAtlas();
    const guide = readFileSync(NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_PATH, "utf8");
    for (const family of value.concept_catalog.families) {
      expect(guide).toContain(`${family.id} (${family.concept_ids.length})`);
      for (const id of family.concept_ids) expect(guide).toContain(id);
    }
    for (const command of value.cli_projections) expect(guide).toContain(command);
    expect(guide).toContain("Both integrity.digest and integrity.reviewed_digest equal the independently");
    expect(guide).toContain(NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST);
    expect(guide).toContain("Being is not the remainder");
    expect(guide).toContain("In a generic presheaf");
    expect(guide).toContain("sheaf, every compatible matching family glues uniquely");
    expect(guide).toContain("The seal was performed as one atomic transition");
    expect(guide).toContain("NON_EXHAUSTIVE_UNDERSTANDING_JSONSCHEMA_PYTHON");

    const digest = nonExhaustiveUnderstandingDigest(value);
    expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(digest).toBe(NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST);
    expect(nonExhaustiveUnderstandingDigest(value)).toBe(digest);
    expect(nonExhaustiveUnderstandingPublicDiscovery(value)).toMatchObject({
      counts: {
        concepts: 66,
        claims: 19,
        evidence: 14,
        sources: 15,
        counterexamples: 2,
        remainders: 3,
        j_space_mechanisms: 3,
      },
      integrity_status: "REVIEWED",
      semantic_digest: NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
      reviewed_digest: NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
      static_only: true,
      runtime: false,
      person_data: false,
      action_or_authority_effect: false,
    });
  });
});
